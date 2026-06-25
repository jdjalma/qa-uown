---
name: db-polling-pattern
description: Load when validating an asynchronous result in the DB (vendor callback, activity log, status transition, sweep task). Use waitForRecord with exponential backoff, never a single query + sleep. Polling is flakiness prevention — not optimization.
disable-model-invocation: true
---

# DB Polling Pattern

## When to apply

Whenever you need to validate an asynchronous effect in the DB:

- Activity log (inviolable rule #13)
- Vendor callback (Kount, SEON, DV360, GowSign)
- Status transition triggered by a background job
- Sweep task (scheduled)
- Payment settlement

**Do NOT use** for synchronous validation (immediate API response). Use `expect` directly.

## Procedure

### Canonical helper

```ts
import { db } from "@/helpers/database.helpers";

const log = await db.waitForRecord({
 table: "uown_los_lead_notes",
 filter: { lead_id: leadId, note_type: "SIGNING_COMPLETED" },
 timeoutMs: 30_000,
 intervalMs: 500, // first interval, then grows
 maxIntervalMs: 5_000,
});
```

### Backoff policy

```
attempt 1: t=0 (immediate — it may already be there)
attempt 2: t=500ms
attempt 3: t=1.5s (grows 1.5x or 2x)
attempt 4: t=3.5s
attempt 5: t=7.5s (cap at 5s for the next ones)
...
```

Exponential backoff matters because:
- Load on the test DB drops when the event is slow
- Logs are less polluted
- False negatives from a race are rarer

### When to use polling vs `waitForRecord`

| Case | Helper |
|------|--------|
| Wait for 1 specific row to appear | `db.waitForRecord({ filter })` |
| Wait for count >= N | `db.waitForCount({ filter, min: N })` |
| Wait for a field to change (UPDATE) | `db.waitForChange({ filter, field, expected })` |
| Immediate validation after a synchronous API response | `db.getSingleRow` (no polling) |

(Check the exact names in `src/helpers/database.helpers.ts`.)

## Pitfalls

### 1. `setTimeout` + 1 query
```ts
// ❌ Anti-pattern — guaranteed flakiness
await page.waitForTimeout(5000);
const row = await db.query("SELECT ...");
expect(row).toBeDefined;
```
If the event takes 6s in that environment, it fails. If it arrives in 100ms, you wasted 4.9s. Use `waitForRecord`.

### 2. Timeout too short
- Synchronous activity log: 5–10s
- Settle Application activity log in qa1: **120s** configured — but if polling returns 0 rows even with 120s, suspect TZ drift (pitfall #6 below) BEFORE increasing the timeout further. See [[application-lifecycle]] pitfall #66 (TZ drift, the real root cause) and #65 (SUPERSEDED — the timeout was treating a symptom).
- Vendor callback (Kount/SEON): 30–60s
- DV360 / external fraud: up to 2min in sandbox
- Sweep task: depends on the schedule — check `uown_sv_sql_config` or the config docs

### 3. Filter too broad
```ts
// ❌ Ambiguous when there are multiple events for the same lead
filter: { lead_id }
```
Always include `note_type` or another discriminator.

### 4. Missing cleanup
Polling accumulates latency if the row was left over from a previous run. Ensure cleanup or use a timestamp/runId in the filter:
```ts
filter: { lead_id, created_at_gte: testStartedAt }
```

### 6. `timestamp without time zone` vs UTC comparison (2026-05-22)

`Date.toISOString` produces a UTC `Z` string. Comparing that against a Postgres `timestamp without time zone` column breaks silently when the DB host TZ differs from UTC — the predicate becomes false because Postgres interprets the literal without offset conversion.

```typescript
// ❌ Broken on hosts with TZ ≠ UTC
filter: { created_at_gte: new Date.toISOString } // "$1 = '2026-05-22T09:00:00.000Z'" fails to match a UTC+3 host row
```

**Safe alternatives (in order of preference):**
1. **Fresh-data + count-only assertion:** assert `count >= 1` where `pk > $snapshotPk` (avoids timestamp entirely).
2. **Cast to UTC in SQL:** `WHERE created_at AT TIME ZONE 'UTC' > $1` (explicit, works regardless of host TZ).
3. **Correlation by unique marker:** use `source_uuid`, `x-run-id`, or similar inserted with the action (see pitfall #34 in [[application-lifecycle]]).

**Detection:** query `SELECT now, current_setting('TimeZone')` — if TZ ≠ UTC, timestamp comparisons against Node JS Date values are unreliable.

### 7. SQL projection vs JPA entity drift (2026-05-22)

Writing raw SQL that projects columns that do NOT exist in the actual table causes silent failures (0 rows from `waitForRecord`) or Postgres errors swallowed by catch blocks.

**Canonical example:** spec draft projected `scheduled_due_date` and `new_due_date` from `uown_due_date_moves` — neither column exists. Real columns: `pk, agent, row_created_timestamp, row_updated_timestamp, tenant_id, web_user_id, account_pk, agent_username, moved_by_days, moved_from_due_date, is_fpd_change, adjustment_type`.

**Rule:** before projecting any column from a table not already in the catalog, run:
```sql
SELECT column_name, data_type
 FROM information_schema.columns
 WHERE table_name = 'uown_due_date_moves'
 ORDER BY ordinal_position;
```
Never assume column names from entity field names, DTO names, or issue title wording.

### 5. DB connection exposed in the test
Use the helper. Do not open a `pg.Client` directly in the spec — it violates layering and breaks the connection pool.

### 8. A `while/for` loop + `sleep()` re-implements `pollUntil`/`waitForRecord` (DRY)

`sleep()` (`@helpers/index.js`) is the project's helper that serves as a substitute for `page.waitForTimeout` — which is why it escapes the `waitForTimeout` ban. But **`sleep()` inside a loop that waits for a condition is the same anti-pattern**: it hand-rolls `pollUntil` (whose own docstring says "Shared primitive — previously reimplemented in database/esign-db/settled-in-full").

```ts
// ❌ Hand-rolled poll loop — re-implements pollUntil, fixed cadence, pollutes the spec
while (Date.now() < deadline) {
  await sleep(5_000);
  const row = await db.getSingleRow('SELECT ... WHERE pk=$1', [pk]);
  if (row) break;
}

// ✅ Shared helper — exponential backoff, one place to tune timing
const row = await pollUntil(
  () => db.getSingleRow('SELECT ... WHERE pk=$1', [pk]),
  { timeoutMs: 120_000, logPrefix: 'sticky-recover' },
);
// ✅ or, for a row from a known table:
const note = await db.waitForRecord('SELECT ... WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1', [leadPk]);
```

**A bare `sleep()` (outside a condition loop) is only acceptable** for an external propagation delay that has NO observable condition (e.g. giving a vendor webhook time before the FIRST query, an async sweep with no status flag) — and always with a one-line comment justifying it. A navigation retry (`for (attempt) { try goto; catch { await sleep(backoff) } }`) is a legitimate use of sleep as backoff between attempts, not a conditional wait.

**How to detect (audit):** `grep -rn -B6 "await sleep(" tests/` → every `sleep` preceded by `while (`/`for (` that queries the DB/state is a candidate for `pollUntil`/`waitForRecord`. Origin: DRY audit 2026-06-23 — ~30 hand-rolled loops re-implementing the primitive in domain specs (sticky, seon, gowsign).

## Expected output

Each step that validates an async effect has:
1. The action that triggered it
2. `await db.waitForRecord({ ... })` with a timeout appropriate to the type
3. A content assertion (not just presence — see the `activity-log-validation` skill)

## Cross-links

- Skill [[activity-log-validation]] — first consumer of this pattern
- Skill [[helpers-catalog]] — check the real helper names/signatures
- Source: `src/helpers/database.helpers.ts`

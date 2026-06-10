# SPEC — RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536

## Source

- **GitLab issue:** https://gitlab.com/uown/backend/svc/-/work_items/536
- **Title:** LevelAI: return `lastScheduleMoveDate` and `numberOfDueDateMoves` in `TmsAccountSummary`
- **Milestone:** Uown | RU05.26.1.52.0 (due 2026-05-26)
- **Labels:** `workflow::qa-in-process`, `priority::high`
- **State:** opened
- **MR:** !1444 — **merged** in R1.52.0 (https://gitlab.com/uown/backend/svc/-/merge_requests/1444)
- **Author / dev:** Marcos Pacheco Silva
- **Issue description:** EMPTY. Only content is a single dev comment (2026-05-21) with `curl` snippets and the two expected response keys.
- **Test file (handoff):** `RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536.spec.ts`
- **Suggested pipeline:** task-test (hybrid UI+API) in `docs/taskTestingUown/.../`.

---

## Current state / Build deployed

- **qa1:** ✅ deployed (verified end-to-end by orchestrator on 2026-05-22; accountPk=4524).
- **qa2:** ❌ **NOT deployed** — endpoints reply HTTP 200, but the two new keys are **absent** from the payload (key missing, not `null`). Verified on accountPk=11540.
- **stg / dev / sandbox:** not verified at SPEC time.
- **Spelling drift:** title says `lastScheduleMoveDate` (no "d"); Java field is `lastScheduleMovedDate` (with "d"). Test asserts the Java field — see Q-D1.
- **Code path verified:**
  - `TmsService.populateSchedSummaryInformation` writes `numberOfDueDateMoves` from `SvSchedSummary.SchedSummaryInfo.dueDateMoves`.
  - `TmsService.populateSchedMoveDates` (new) does top-1 `DueDateMoveService.getForAccount(accountPk, PageRequest.of(0,1, Sort.by(DESC,"rowCreatedTimestamp")))` and sets `lastScheduleMovedDate = lastDueDate.createdTimestamp()`. Early-return when list is empty (→ `null`).
- **DB cross-check (qa1, accountPk=4524, post-move):**
  - `uown_sv_sched_summary.due_date_moves` = 1 ✅
  - `uown_due_date_moves` has 1 row (`pk=350`, `row_created_timestamp=2026-05-22T15:05:20.756Z` UTC; API returned `2026-05-22T12:05:20.756016` = `LocalDateTime` in server TZ — 3h offset).
- **v1 vs legacy:** `deepEqual === true` on the JSON bodies (same bytes).

---

## Scope

### IN

- New response fields on **both** TMS account-summary endpoints:
  - v1: `GET /uown/tms/v1/accounts/{accountPk}/summary`
  - legacy: `GET /uown/tms/getAccountSummary/{accountPk}`
- Field semantics:
  - `numberOfDueDateMoves` (Integer) — count of due-date moves, sourced from `uown_sv_sched_summary.due_date_moves`.
  - `lastScheduleMovedDate` (LocalDateTime) — `row_created_timestamp` of the most recent row in `uown_due_date_moves`.
- State transitions: zero-moves baseline → first move → second move (counter increments, timestamp updates).
- Cross-endpoint parity: v1 and legacy return equivalent payloads for the same accountPk.
- UI-driven action (Move Due Date modal on Servicing) as the trigger (rule #14, UI-first).
- DB validation against `uown_sv_sched_summary` and `uown_due_date_moves`.
- Activity log validation (rule #13) on the move action — see Activity Log section.
- Environment gating: primary qa1 (`@qa1` tag). Re-run when qa2/stg promotion advances.

### OUT

- Authentication/permission on TMS endpoints — TMS API key model unchanged; no AC.
- Behavior of the Move Due Date business rules themselves (offset limits, weekend handling, max moves per account) — not changed by !1444.
- Other `TmsAccountSummary` fields (EPO date, payment frequency, balances) — out of #536; only the two new keys are under test.
- Sticky.io / payment-vendor side effects of a move — covered by other suites if applicable.
- Performance / latency of the new query (top-1 + ORDER BY DESC LIMIT 1 is cheap; PO has not flagged perf).
- LevelAI consumer-side parsing — third-party; QA's contract stops at the response body.
- Production validation — staging smoke is sufficient for QA pipeline.

### AMBIGUOUS / Questions for PO + dev

See [Open Questions](#open-questions) — Q-D1, Q-D2, Q-PO.

---

## AC Coverage

All AC marked `[INFERIDO]` because issue description is empty; AC reconstructed from dev comment + MR diff.

| # | Acceptance Criterion | Classification | Scenarios |
|---|----------------------|----------------|-----------|
| AC-1 | Both endpoints (v1 `/uown/tms/v1/accounts/{pk}/summary` and legacy `/uown/tms/getAccountSummary/{pk}`) return HTTP 200 for a valid `accountPk`. | `[INFERIDO]` | S1, S2, S3, S4 |
| AC-2 | Both endpoints include the keys `numberOfDueDateMoves` and `lastScheduleMovedDate` in the response body. | `[INFERIDO]` | S1, S2, S3, S4 |
| AC-3 | `numberOfDueDateMoves` equals `uown_sv_sched_summary.due_date_moves` for the account (consistency invariant). | `[INFERIDO]` | S2, S3 |
| AC-4 | `lastScheduleMovedDate` equals the `row_created_timestamp` of the most-recent row in `uown_due_date_moves` for the account, serialized as LocalDateTime (no timezone). | `[INFERIDO]` | S2, S3 |
| AC-5 | Zero-moves baseline: a fresh ACTIVE account with no due-date moves returns `numberOfDueDateMoves: 0` and `lastScheduleMovedDate: null`. | `[INFERIDO]` | S1 |
| AC-6 | v1 and legacy endpoints return equivalent payloads (same value for the two new keys) for the same `accountPk` at the same point in time. | `[INFERIDO]` | S4 |
| AC-7 | Counter increments correctly across multiple moves (0→1, 1→2) and `lastScheduleMovedDate` advances to the latest move's timestamp. | `[INFERIDO]` | S2, S3 |
| AC-8 (rule #13, mandatory) | Move Due Date action emits an entry in `uown_sv_activity_log` with `log_type='DUE_DATE_MOVES'`, `account_pk` populated, `lead_pk` NULL, and `notes` matching `/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/`. | `[CONFIRMADO via investigação 2026-05-22, account 4524, pk=1735531]` | S2, S3 |

---

## Risk Analysis

| Area | Risk | Why | Coverage |
|------|------|-----|----------|
| Contract change for LevelAI consumer | **MEDIUM** (downgraded 2026-05-22 — qa1-only scope per Q-D2) | New keys promised by 2026-05-26 for qa1. Cross-env promotion not in scope for #536 milestone. | S1, S2, S3, S4 |
| Key-absent vs `null` semantics | `[RESOLVED — out of scope per Q-D2]` | qa2/stg/prod não entram nesta milestone; key-presence drift across envs deixou de ser preocupação para #536. Assertion via `hasOwnProperty` ainda permanece como hardening defensivo no S1. | S1 (still uses `hasOwnProperty`) |
| LocalDateTime serialization (TZ) | **MEDIUM** | API returns `LocalDateTime` (no offset). DB row is `timestamptz` UTC. 3h delta observed between API (12:05) and DB (15:05). Naive equality fails; comparison must tolerate server TZ. | S2 assertion uses tolerance window (±1 minute on `Instant.parse(dbTs)` vs `LocalDateTime` parsed as server TZ) |
| Atomicity between `sched_summary.due_date_moves` and `uown_due_date_moves` | **MEDIUM** | If the move action writes the new row before incrementing the summary counter (or vice-versa), a probe between writes returns inconsistent state. Mitigated by DB polling — wait for both to reach expected state. | S2 polling loop on both tables |
| Cross-endpoint parity drift | **MEDIUM** | v1 and legacy share the same `TmsService` populator today, but legacy could diverge in a later refactor. Lock current parity. | S4 explicit `deepEqual` on the two keys |
| Counter incrementing across multiple moves | **MEDIUM** | First-move logic is straightforward; second-move tests that the populator does not stale-read or cache. | S3 (0→1→2 in a single test) |
| Empty / null state for fresh account | **LOW** | Early-return path in `populateSchedMoveDates` is trivial; cheap to assert. | S1 |
| Deploy lag across envs | `[RESOLVED — qa1-only per Q-D2]` | Milestone explicitly scoped qa1; promotion to stg/prod tracked separately. | Test gated `@qa1`; S5 dropped. |
| Activity log presence (rule #13) | **LOW** (CONFIRMED via investigação) | `uown_sv_activity_log` row confirmed at `log_type='DUE_DATE_MOVES'` (Q-PO answer). Now a mandatory AC. | AC-8; S2, S3 validate row + notes pattern |
| Wrong field name (typo "Move" vs "Moved") | **LOW** | MR diff confirms `lastScheduleMovedDate`. Assertion uses the Java spelling. | All scenarios use the canonical key name; Q-D1 confirms |

---

## Test Strategy

- **Approach:** **Hybrid (UI + API + DB)**.
  - **UI (rule #14):** trigger the move via the Servicing portal's Move Due Date modal — that's the real customer-agent action and the path with rendering/state-machine concerns. Reuse `ScheduledPaymentPage.moveDueDateFirstOption(offsetDays)`.
  - **API:** validate the contract that LevelAI consumes — direct GET on the v1 and legacy endpoints (`TmsAuditClient.getAccountSummary` already exists for v1; legacy method to be ADDED).
  - **DB:** validate the invariants behind the response (`uown_sv_sched_summary.due_date_moves`, `uown_due_date_moves`).
- **Justification for hybrid (NOT API-only):**
  - The action that produces the new fields — Move Due Date — is a Servicing UI flow used by agents. Rule #14 says UI-first when the feature has a UI affordance. The endpoints are LevelAI-facing (admin/ops), but the **mutation** that drives the assertions is UI-driven. Triggering via `POST /uown/svc/moveDueDatesByDays/{accountPk}` would bypass the customer-facing modal and mask bugs in that flow.
  - API-only would also miss the visual confirmation that the move took effect (toast, modal close, scheduled table refresh).
- **Environments:**
  - **Primary:** `qa1` (verified deployed). Tag: `@qa1`.
  - **Cross-env smoke:** **deferred** — qa2 is not deployed at SPEC time. When promotion advances, re-run S1 + S2 on qa2 / stg.
- **Suites to activate:** **none** beyond the dedicated spec. No need to expand to dual-brand or signing-regression — #536 is a TMS contract change, not a brand-scoped or signing-scoped change.
- **Merchant preflight (rule #12):** **skip** (`skipMerchantPreflight: true`) for two of the three setup paths:
  - **Fresh-data path** (DEFAULT, rule #10): `createPreQualifiedApplication` → `driveLeadToFunding` to reach ACTIVE state. Helper invokes merchant preflight automatically; that's fine here because it's lead creation, not existing-account mutation.
  - **Reuse path** (EXCEPTION, with justification): qa1 seed `accountPk=4524`. **Must** pass `skipMerchantPreflight: true` — preflight on an existing account's merchant is forbidden side-effect (rule #12).
- **DB:** SELECT-only (rule: Security + Exception 3). No UPDATE/INSERT/DELETE on `uown_sv_sched_summary` or `uown_due_date_moves`. The counter increments only via the legitimate UI action.
- **Activity log (rule #13, AC-8 mandatory):** after each move trigger, validate `uown_sv_activity_log` for a row with `log_type='DUE_DATE_MOVES'`, `account_pk` populated, `lead_pk` NULL, and `notes` matching `/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/`. Absent row = test failure (AC-8 binding). Confirmed via investigation 2026-05-22 (account 4524, log pk=1735531) — see Q-PO answer.

### Assertion strategy — key presence vs null

Per the qa1 vs qa2 deploy drift, distinguishing **key absent** from **key present with value `null`** is mandatory:

```ts
// AC-2 / AC-5 binding assertion (do NOT do `body.numberOfDueDateMoves !== undefined`)
expect(Object.prototype.hasOwnProperty.call(body, 'numberOfDueDateMoves')).toBe(true);
expect(Object.prototype.hasOwnProperty.call(body, 'lastScheduleMovedDate')).toBe(true);

// Then assert value:
expect(body.numberOfDueDateMoves).toBe(0);          // S1
expect(body.lastScheduleMovedDate).toBeNull();      // S1
```

Reason: `hasOwnProperty` distinguishes the qa2 (key missing) vs qa1 (key present, value null) states. A plain `=== null` check would falsely pass on qa2 if the key is missing and the test reads `undefined === null` → false → test fails — but the message would be confusing. Better to fail loudly on absence.

### LocalDateTime ↔ timestamptz comparison

```ts
// API returns LocalDateTime (no offset), DB returns timestamptz (UTC).
// Server TZ is +3h offset on qa1 (observed).
// Strategy: parse both as Date, allow ±2 minutes drift, allow ±4h TZ window.
const apiTs = body.lastScheduleMovedDate;                       // e.g. "2026-05-22T12:05:20.756016"
const dbRow = await db.getSingleRow(/* uown_due_date_moves top-1 */);
const dbTs = dbRow.row_created_timestamp;                       // UTC instant

// Convert API LocalDateTime to UTC by adding server-TZ offset (read once at suite init).
// Or simpler: assert apiTs is within ±4h of dbTs (covers any TZ ≤ ±UTC+4) AND seconds match.
expectWithinTzWindow(apiTs, dbTs, { maxOffsetHours: 5, secondsTolerance: 2 });
```

Helper `expectWithinTzWindow` to be implemented (new utility — see Dependencies).

---

## Test Design Techniques Applied

### Equivalence Partitioning — `numberOfDueDateMoves` value class

| Class | Setup | Expected |
|-------|-------|----------|
| Zero moves | Fresh ACTIVE account, no moves | `0` + `lastScheduleMovedDate: null` |
| One move | Same account, after 1 UI move | `1` + valid `LocalDateTime` |
| Multiple moves | Same account, after 2 UI moves | `2` + `LocalDateTime` from move #2 (most recent) |

### State Transition

```
[ACTIVE, moves=0, lastMove=null]
        │
        │ Move Due Date modal (offset +7d)
        ▼
[ACTIVE, moves=1, lastMove=T1]
        │
        │ Move Due Date modal (offset +7d) again
        ▼
[ACTIVE, moves=2, lastMove=T2 > T1]
```

S2 covers the first transition; S3 covers the chained second transition.

### Decision Table — endpoint × account state

| Endpoint | Account state | Expected `numberOfDueDateMoves` | Expected `lastScheduleMovedDate` |
|----------|---------------|--------------------------------|----------------------------------|
| v1 | Fresh, no moves | 0 | null |
| legacy | Fresh, no moves | 0 | null |
| v1 | After 1 move | 1 | LocalDateTime (= T1 ± TZ) |
| legacy | After 1 move | 1 | LocalDateTime (= T1 ± TZ) |
| v1 | After 2 moves | 2 | LocalDateTime (= T2 ± TZ) |
| legacy | After 2 moves | 2 | LocalDateTime (= T2 ± TZ) |

### Boundary Value Analysis

- 0 → 1 (first move; tests early-return removal in populator).
- 1 → 2 (chained; tests top-1 ordering by `rowCreatedTimestamp DESC`).

Higher counts (5, 10, …) not in scope — additional moves exercise the same code path with no new boundary.

### Exploratory Heuristics Loaded

- **Deploy drift across envs** (key absent on qa2) — explicit `hasOwnProperty` assertion locks state.
- **Naming drift** (Java field has extra "d") — Q-D1 covers; spec uses Java spelling.
- **TZ drift on LocalDateTime serialization** — comparison helper with tolerance window.
- **Atomic vs racy state between two source tables** — DB polling on both tables before asserting response.

---

## Test Data

### Primary path — fresh data (DEFAULT, rule #10)

- Create application via `createPreQualifiedApplication` (UOWN brand merchant, 13m program, qa1).
- Drive to ACTIVE via `driveLeadToFunding` (signing + funding + activation).
- Resulting `accountPk` is the test subject. Persist as fixture-scoped `freshAccountPk`.
- Merchant preflight executes automatically inside `createPreQualifiedApplication` (auto-heal) — no test-side action required.

### Reuse path — qa1 seed (EXCEPTION, justified)

- `accountPk = 4524` (qa1, ACTIVE, SEMI_MONTHLY, 26 payments remaining, state CA, merchant 5th Ave Furniture).
- **Justification:** orchestrator already exercised the full E2E on this account on 2026-05-22 (1 move applied; counter=1; timestamp set). Useful for a **regression smoke** that does not need to be repeatable from scratch.
- **Constraint:** pass `skipMerchantPreflight: true` — existing account, do NOT mutate merchant config.
- **Status:** the seed is now in a `moves=1` state (not zero-moves). It cannot serve as the S1 baseline; only S3 (move #2 → moves=2) and S4 (parity) can reuse it.

### Endpoint base URLs (qa1)

- v1: `GET https://svc-qa1.uownleasing.com/uown/tms/v1/accounts/{accountPk}/summary`
- legacy: `GET https://svc-qa1.uownleasing.com/uown/tms/getAccountSummary/{accountPk}`
- Auth: `Authorization: $FIVE9_TMS_API_KEY` (env var `tmsApiKey`).

### UI navigation

- Portal: Servicing — `https://servicing-qa1.uownleasing.com/account/{accountPk}/due-amounts`
- Modal trigger: Move Due Date button on Due Amounts page.
- Helper: `ScheduledPaymentPage.moveDueDateFirstOption(7)` — picks the first scheduled date and shifts it by +7 days. Returns `{ selectedDate, newDate }` for evidence.

### DB queries (SELECT only)

```sql
-- AC-3 / AC-7 source of truth for counter
SELECT account_pk, due_date_moves
FROM uown_sv_sched_summary
WHERE account_pk = $1;

-- AC-4 source of truth for last-move timestamp
SELECT pk, account_pk, row_created_timestamp, scheduled_due_date, new_due_date
FROM uown_due_date_moves
WHERE account_pk = $1
ORDER BY row_created_timestamp DESC
LIMIT 1;

-- AC-8 (rule #13, MANDATORY) — canonical activity log table per Q-PO (Yuri, 2026-05-22)
SELECT pk, account_pk, lead_pk, log_type, notes, created_by, creation_source, row_created_timestamp
FROM uown_sv_activity_log
WHERE account_pk = $1
  AND log_type = 'DUE_DATE_MOVES'
  AND row_created_timestamp >= $2  -- T0 of the move action
ORDER BY row_created_timestamp DESC;
```

---

## Active Scenarios (Prioritized)

| ID | Name | Priority | AC coverage |
|----|------|----------|-------------|
| S1 | Zero-moves baseline: keys present, values are `0` / `null` | P1 | AC-1, AC-2, AC-5 |
| S2 | First move increments counter and sets timestamp (state transition 0→1) | P1 | AC-1, AC-2, AC-3, AC-4, AC-7, AC-8 |
| S3 | Second move chains correctly (state transition 1→2) | P1 | AC-3, AC-4, AC-7 |
| S4 | v1 ↔ legacy payload parity for the two new keys | P1 | AC-6 |
| ~~S5~~ | ~~Cross-env smoke (qa2 / stg / dev when deployed)~~ — **DROPPED** per Q-D2 (qa1-only milestone) | — | — |

### Scenario 1 — Zero-moves baseline (PRIORITY 1)

- **Technique:** Equivalence partitioning (zero-moves class) + key-presence assertion.
- **Persona:** LevelAI consumer doing a first-time fetch on a freshly-activated lease.
- **Setup:**
  1. Create application via `createPreQualifiedApplication` (UOWN brand, 13m, qa1).
  2. `driveLeadToFunding` → reach ACTIVE state.
  3. Capture `freshAccountPk`. No DB seeding. No move action.
- **Steps:**
  1. `GET /uown/tms/v1/accounts/{freshAccountPk}/summary` → body B1.
  2. `GET /uown/tms/getAccountSummary/{freshAccountPk}` → body B2.
- **Validations:**
  - **API (AC-1):** both responses are HTTP 200.
  - **API (AC-2):** `hasOwnProperty('numberOfDueDateMoves')` and `hasOwnProperty('lastScheduleMovedDate')` are `true` on **both** B1 and B2.
  - **API (AC-5):** `numberOfDueDateMoves === 0` and `lastScheduleMovedDate === null` on **both** B1 and B2.
  - **DB:** `SELECT due_date_moves FROM uown_sv_sched_summary WHERE account_pk = $1` returns `0`.
  - **DB:** `SELECT count(*) FROM uown_due_date_moves WHERE account_pk = $1` returns `0`.
- **Pitfalls considered:**
  - If the test runs on an env where the build is not deployed, S1 fails with key-absent error — this is the desired loud failure (locks deploy-drift detection).
  - Rule #12: `createPreQualifiedApplication` runs merchant preflight automatically; no manual call needed.
- **Tags:** `@qa1 @priority-high @smoke @api`

### Scenario 2 — First move increments counter (PRIORITY 1)

- **Technique:** State transition (0 → 1) + DB invariant + activity-log probe.
- **Persona:** Servicing agent moves a due date in response to a customer call; LevelAI then polls for the updated summary.
- **Setup:**
  1. Reuse `freshAccountPk` from S1 (or create fresh via `createPreQualifiedApplication` + `driveLeadToFunding`).
  2. Capture `T0 = now()` BEFORE the move.
- **Steps:**
  1. Navigate Servicing → `account/{freshAccountPk}/due-amounts`.
  2. Call `ScheduledPaymentPage.moveDueDateFirstOption(7)` → returns `{ selectedDate, newDate }`. Modal closes (helper waits for it).
  3. Wait for DB-side commit: poll `uown_sv_sched_summary.due_date_moves` until it equals `1` (timeout 30s).
  4. Poll `uown_due_date_moves` until row count for the account equals `1` (timeout 30s).
  5. `GET /uown/tms/v1/accounts/{freshAccountPk}/summary` → body B1.
  6. `GET /uown/tms/getAccountSummary/{freshAccountPk}` → body B2.
- **Validations:**
  - **UI:** modal closed cleanly (helper handles).
  - **API (AC-1, AC-2):** both 200; both contain the two keys.
  - **API (AC-3):** `B1.numberOfDueDateMoves === 1` and `B2.numberOfDueDateMoves === 1`.
  - **API (AC-4):** `B1.lastScheduleMovedDate` is a parseable LocalDateTime; compared to `uown_due_date_moves.row_created_timestamp` via `expectWithinTzWindow` (±5h TZ, ±2s seconds). Same for B2.
  - **DB (AC-3 source):** `uown_sv_sched_summary.due_date_moves` = `1`.
  - **DB (AC-4 source):** `uown_due_date_moves` row exists, `scheduled_due_date` matches `selectedDate`, `new_due_date` matches `newDate`.
  - **Activity log (AC-8, rule #13, MANDATORY):** SELECT from `uown_sv_activity_log` with `account_pk = $1`, `log_type = 'DUE_DATE_MOVES'`, `row_created_timestamp >= T0`. Assert:
    - Exactly 1 new row for this move.
    - `lead_pk IS NULL` (account-centric).
    - `created_by` equals the logged-in Servicing user.
    - `creation_source = 'USER_ACTION'`.
    - `notes` matches `/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/`.
    - Timestamp within ~10ms of `uown_due_date_moves.row_created_timestamp` (same transaction).
    - Absent row → test FAILS (AC-8 binding).
- **Pitfalls considered:**
  - **Race between two source tables:** DB polling waits for **both** tables to reach the expected state before calling the API.
  - **TZ drift in serialized LocalDateTime:** comparison tolerance.
  - **Modal failure on Bootstrap modal stack:** helper already implements waitForModalOpen / waitForModalHidden.
- **Tags:** `@qa1 @priority-high @hybrid @ui @api @db`

### Scenario 3 — Second move chains (PRIORITY 1)

- **Technique:** State transition (1 → 2) + ordering invariant.
- **Persona:** Same agent, second customer call; LevelAI re-polls.
- **Setup:**
  1. Use the account from S2 (state = `moves=1`).
  2. Capture `T1 = uown_due_date_moves.row_created_timestamp` of the existing top-1 row (this is the prior `lastScheduleMovedDate`).
- **Steps:**
  1. Navigate to Due Amounts again.
  2. `ScheduledPaymentPage.moveDueDateFirstOption(7)` (second invocation; offset applied to whatever the new first scheduled date is — order-of-magnitude doesn't matter, just any valid move).
  3. Poll `uown_sv_sched_summary.due_date_moves` until `2`.
  4. Poll `uown_due_date_moves` count until `2`.
  5. `GET` v1 + legacy.
- **Validations:**
  - **API (AC-7):** `numberOfDueDateMoves === 2` on both endpoints.
  - **API (AC-4):** `lastScheduleMovedDate` strictly newer than `T1` (i.e. `parse(body.lastScheduleMovedDate) > parse(T1)`).
  - **DB invariant:** top-1 by `row_created_timestamp DESC` is the new row (NOT the prior one).
  - **Activity log (AC-8, rule #13, MANDATORY):** new row in `uown_sv_activity_log` with `log_type='DUE_DATE_MOVES'`, `account_pk` populated, `lead_pk` NULL, `notes` matching the regex. Total of 2 `DUE_DATE_MOVES` rows for the account post-S3 (one from S2 + one from S3). Absent new row → test FAILS.
- **Pitfalls considered:**
  - Populator stale-cache: if the populator caches the first move's timestamp at service-init, the new top-1 wouldn't surface. Test catches this.
  - Equal-timestamp tie-break: in the unlikely event two moves share the same `row_created_timestamp` to millisecond precision, fall back to `pk DESC` tie-break (`DueDateMoveService` should use this implicitly — record observation if otherwise).
- **Tags:** `@qa1 @priority-high @hybrid @ui @api @db`

### Scenario 4 — v1 ↔ legacy payload parity (PRIORITY 1)

- **Technique:** Cross-endpoint equivalence.
- **Persona:** LevelAI is mid-migration between legacy and v1; both must agree.
- **Setup:** Any account exercised in S1, S2, or S3 (preferably reuse the S3 account; state = `moves=2`).
- **Steps:**
  1. `GET v1` → body B1.
  2. `GET legacy` → body B2 (within ≤ 2s of B1 to minimize clock drift between calls).
- **Validations:**
  - **AC-6:** `B1.numberOfDueDateMoves === B2.numberOfDueDateMoves`.
  - **AC-6:** `B1.lastScheduleMovedDate === B2.lastScheduleMovedDate` (string-equal, since both serialize from the same Java `LocalDateTime`).
  - Optional: `deepEqual(B1, B2)` for the full body — locks broader parity (acknowledge as `[OBSERVAÇÃO]` if other fields drift, since that's outside #536).
- **Pitfalls considered:**
  - Concurrency: another agent moving the due date between the two GETs would invalidate parity. Mitigate by sequential GETs in tight succession and account isolation (fresh account from S1+S2+S3 chain).
- **Tags:** `@qa1 @priority-high @api`

### ~~Scenario 5 — Cross-env smoke~~ — **DROPPED**

- **Status:** **DROPPED** 2026-05-22 per Q-D2 (dev/PO). Milestone RU05.26.1.52.0 is qa1-only for #536. qa2/stg/prod promotion of this build is out of scope.
- **If re-opened later:** a separate task would re-introduce cross-env smoke as S1+S2 repeated with `@qa2`/`@stg` tags.

---

## Cenários considerados e descartados

| ID | Discarded | Reason |
|----|-----------|--------|
| **D1 — Direct DB UPDATE on `uown_sv_sched_summary.due_date_moves` to test populator independently** | Discarded | Forbidden by rule #10 + Exception 3 (no DB mutation). UI-driven path is the supported coverage. |
| **D2 — Move via `POST /uown/svc/moveDueDatesByDays/{accountPk}` (API-only)** | Discarded | Rule #14 (UI-first). The Move Due Date modal IS the customer-agent flow. API-only would bypass the rendered state machine. |
| **D3 — Negative case: invalid `accountPk` returns 4xx with the keys absent** | Discarded | Out of scope for #536. !1444 only added populator logic; error handling on invalid accountPk is unchanged and covered by 525-style smoke. |
| **D4 — Permission / unauthorized access to TMS endpoints** | Discarded | Auth model unchanged by !1444. Separate concern. |
| **D5 — Performance: query plan for top-1 ORDER BY DESC LIMIT 1 on `uown_due_date_moves`** | Discarded | Trivial query on indexed `account_pk + row_created_timestamp`. PO has not flagged. |
| **D6 — Stress: 100 moves on the same account** | Discarded | No boundary discovered beyond 1 → 2. Cost > value. |
| **D7 — Other `TmsAccountSummary` fields regression** | Discarded | Out of scope (#536 only adds the two new keys). Covered by 525 + general TMS smoke. |
| **D8 — DST / leap-second edge on `LocalDateTime` serialization** | Discarded | Acknowledged risk but window is small (one DST switch per year per region); TZ-tolerance window in `expectWithinTzWindow` already covers ±5h. Add explicit DST test if a defect surfaces. |
| **D9 — Move via `TmsDueDateController.moveDueDate` admin endpoint** | Discarded | Same as D2 — bypasses UI. |

---

## Out-of-scope decisions (documented)

- **No DB mutation** — counters increment only via the UI move; timestamps come from the real action.
- **No API-only path** for the move trigger — UI-first (rule #14).
- **qa1-only milestone** — per Q-D2 (dev/PO, 2026-05-22), #536 is scoped to qa1 only. qa2/stg/prod runs not part of this task. S5 dropped.
- **Activity log: MANDATORY AC-8** — `uown_sv_activity_log` row with `log_type='DUE_DATE_MOVES'` (canonical Servicing table per Q-PO). Absent log = test failure (rule #13 binding).
- **Cosmetic note in `notes` string** — `"from dueDate"` (variable name leaked into user-facing text) is documented as `[OBSERVAÇÃO]` cosmetic follow-up; NOT a bug for #536.
- **No assertion on other TmsAccountSummary fields** — #536 is scoped to the two new keys.

---

## Pitfalls / Notes

- **Cosmetic — `"from dueDate"` leaks variable name** in `uown_sv_activity_log.notes` (e.g., `"Due Date changed from dueDate 2026-05-22 by 7 days"`). Reads as code-leak in user-facing text. **Not a bug for #536**; flag as cosmetic follow-up in the final report. Owner = move-due-date feature team, separate ticket.
- **Same-transaction timestamp race** — `uown_sv_activity_log` row commits ~6ms before `uown_due_date_moves` row (same DB transaction). Probe race window <10ms. Polling strategy already accounts for this (wait for both rows in S2/S3).
- **`lead_pk IS NULL` on `uown_sv_activity_log`** — the log is account-centric; do not join on lead. Asserting `lead_pk` populated would falsely fail.
- **TZ on `LocalDateTime`** — confirmed intentional (Q-PO). Comparison helper `expectWithinTzWindow` still required; no contract change planned.
- **Field name `lastScheduleMovedDate` (with "d") is final** — Marcos confirmed; do not "fix" to the title spelling.

---

## Dependencies (for `qa-implementer`)

### NEW — must be added

1. **`TmsAuditClient.getAccountSummaryLegacy(accountPk)`** — new method for the legacy endpoint.
   - URL: `GET /uown/tms/getAccountSummary/{accountPk}`.
   - Auth: same `Authorization: $FIVE9_TMS_API_KEY` header as the existing v1 method.
   - File: extend `src/api/clients/tms-audit.client.ts` (`:154` section, alongside `getPayoffAmountLegacy`).
   - Pattern: mirror `getAccountSummary(accountId)` at `:57` and `getPayoffAmountLegacy(accountPk)` at `:161`.
   - Typed response: see "Type definition" below.

2. **`TmsAccountSummary` response interface** — `src/api/responses/tms-audit.response.ts` (create if absent).
   - Minimum shape for #536 assertions:
     ```ts
     export interface TmsAccountSummaryResponse {
       numberOfDueDateMoves?: number | null;       // optional because qa2 omits it pre-deploy
       lastScheduleMovedDate?: string | null;      // ISO LocalDateTime, no offset, e.g. "2026-05-22T12:05:20.756016"
       // other fields intentionally `unknown` — out of scope for #536
       [key: string]: unknown;
     }
     ```
   - Both `getAccountSummary` and `getAccountSummaryLegacy` should return `ApiResponse<TmsAccountSummaryResponse>` instead of `ApiResponse<unknown>` for #536 scenarios. Existing call sites in other tests stay backward-compatible.

3. **Utility `expectWithinTzWindow(apiLocalDateTime, dbTimestamptz, opts)`** — new helper.
   - Location: `src/helpers/datetime.helpers.ts` (create if absent) or extend an existing datetime helper.
   - Signature:
     ```ts
     export function expectWithinTzWindow(
       apiTs: string,                                    // "2026-05-22T12:05:20.756016"
       dbTs: string | Date,                              // ISO UTC or Date
       opts: { maxOffsetHours: number; secondsTolerance: number },
     ): void;
     ```
   - Implementation: parse both, compute absolute delta, assert `≤ opts.maxOffsetHours * 3600 + opts.secondsTolerance` seconds.

### EXISTING — reuse

- `createPreQualifiedApplication` — `src/helpers/api-setup.helpers.ts:218` (fresh-data path; rule #10).
- `driveLeadToFunding` — `src/helpers/api-setup.helpers.ts:344` (lifecycle to ACTIVE).
- `ScheduledPaymentPage.moveDueDateFirstOption(offsetDays)` — `src/pages/servicing/scheduled-payment.page.ts:74` (UI trigger).
- `TmsAuditClient.getAccountSummary(accountId)` — `src/api/clients/tms-audit.client.ts:57` (v1 endpoint, already typed).
- `db.getSingleRow`, `db.waitForRecord` — existing DB polling helpers.

### Selectors

- No new selectors. `SELECTORS.moveDueDateButton`, `SELECTORS.moveDueDateScheduledSelect`, `SELECTORS.moveDueDateNewDateInput`, `SELECTORS.modalShow`, `SELECTORS.filterOptionWithRole` already used by `ScheduledPaymentPage`.
- **DOM-first check (rule #16):** if a Move Due Date selector failure occurs during implementation, run the DOM-investigation protocol via MCP Playwright at viewport 1440×900 (Servicing portal = agent-facing, internal portal). Do NOT increase timeout.

---

## DoR (Definition of Ready) check

| Item | Status | Note |
|------|--------|------|
| AC explicit and testable | YES | AC consolidated (8 total). Q-D1, Q-D2, Q-PO all answered 2026-05-22. AC-8 now `[CONFIRMADO]` via investigação. Remaining AC-1..AC-7 still `[INFERIDO]` (issue description empty), but consumer contract validated via dev (Marcos) + MR diff. |
| Scenarios defined | YES | 4 active (S1–S4). S5 dropped per Q-D2. |
| Test data available | YES | Fresh data via `createPreQualifiedApplication`; reuse seed `accountPk=4524` available as fallback. |
| Environments accessible | YES | qa1 ✅ deployed and verified. qa2/stg/prod out of scope per Q-D2. |
| DoD criteria clear | YES | See below. |
| Risk identified | YES | Deploy drift HIGH; TZ MEDIUM; key-absent-vs-null MEDIUM. |

## DoD (Definition of Done) — proposed

- S1–S4 (P1) all green on `qa1`.
- AC-8 activity-log validation passes (`uown_sv_activity_log` row with `log_type='DUE_DATE_MOVES'` and `notes` regex match) — MANDATORY, blocking.
- Cosmetic `[OBSERVAÇÃO]` for `"from dueDate"` notes string surfaced in report (non-blocking follow-up).
- `TmsAuditClient.getAccountSummaryLegacy` added, exported, type-checked, and barrel-exported.
- `expectWithinTzWindow` helper added and catalogued.
- `tsc --noEmit` clean.
- Report `RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536-report.md` written and rule #7 satisfied (no PENDING after a successful run).
- Q-D1, Q-D2, Q-PO answers (all resolved 2026-05-22) reflected in this SPEC and copied into report under "Open questions" section.

---

## Open Questions

> All questions resolved 2026-05-22. History preserved below.

- **Q-D1 (dev, Marcos):** Confirm canonical field name. Issue title says `lastScheduleMoveDate`; Java field is `lastScheduleMovedDate` (extra "d"). MR diff confirms the latter. Is this final or will it be renamed before LevelAI cut-over? If renamed, SPEC and helper need a one-line patch.
  - **[RESPONDIDO 2026-05-22 por Marcos]** `lastScheduleMovedDate` (with "d") is the definitive canonical name. No rename planned.
- **Q-D2 (dev/PO):** When the build promotes through stg/prod incrementally and an env temporarily lacks the keys, what's the consumer contract with LevelAI? Should the response always include the keys (with `null` if no data) on all envs from the day of merge? Currently qa2 has key **absent** — that's a stronger drift than just `null`.
  - **[RESPONDIDO 2026-05-22 por dev/PO]** "qa2 ignora, não está deployado lá." Scope for this milestone is **qa1-only**. qa2/stg/prod are out of scope for #536.
- **Q-PO (Yuri):** Deploy schedule for qa2 / stg / prod under milestone RU05.26.1.52.0 (due 2026-05-26)? Determines when S5 (cross-env smoke) can execute.
  - **[RESPONDIDO 2026-05-22 por Yuri]** Implicit in Q-D2 — qa2 não entra nesta milestone. Promotion schedule for stg/prod not confirmed; not blocking #536 closure.
- **Q-PO (rule #13 follow-up):** When the Move Due Date action runs, which table is the authoritative activity log target — `uown_los_lead_notes` (lead-centric) or `uown_sv_activity_log` (account-centric)? S2 probes both; result will be reported.
  - **[RESPONDIDO 2026-05-22 por Yuri]** Canonical Servicing table is `uown_sv_activity_log`. Move Due Date confirmed to emit a row with:
    - `log_type = 'DUE_DATE_MOVES'`
    - `notes` matches `/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/` (note: `"from dueDate"` leaks the Java variable name — cosmetic, not a bug for #536; see Pitfalls).
    - `account_pk` populated, `lead_pk` NULL (account-centric).
    - `created_by` = logged-in user (`test.tester` in verification); `creation_source = 'USER_ACTION'`.
    - Timestamp ~6ms before `uown_due_date_moves` row — same transaction; race window <10ms.
- **Q-PO (TZ):** Is the `LocalDateTime` (no offset) intentional, or should LevelAI receive UTC ISO-8601 (`Instant`)? `LocalDateTime` is ambiguous for any consumer that does not know the server's TZ. If `Instant` is desired, that's a contract change for a follow-up issue.
  - **[RESPONDIDO 2026-05-22 por Yuri]** `LocalDateTime` without timezone is **intentional**. No contract follow-up.

---

## Test naming

Confirmed: **`RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536`**

- Folder: `docs/taskTestingUown/RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536/`
- Spec file: this document (`spec.md`).
- Test file (handoff target): `RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536.spec.ts`
- Report file (post-run): `RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536-report.md`

---

## Next step

**Ready for: `qa-implementer`**

Implementer must:

1. Add `TmsAuditClient.getAccountSummaryLegacy(accountPk)` — mirror existing v1 method, new URL `/uown/tms/getAccountSummary/{accountPk}`, same TMS API key auth.
2. Add `TmsAccountSummaryResponse` interface in `src/api/responses/tms-audit.response.ts`; type both `getAccountSummary` and `getAccountSummaryLegacy` accordingly.
3. Add `expectWithinTzWindow` helper in `src/helpers/datetime.helpers.ts` (create file if absent).
4. Create `RU05.26.1.52.0_levelaiLastScheduleMoveDateAndNumberOfDueDateMoves_536.spec.ts` in this folder.
5. Implement S1 → S2 → S3 → S4 in order. Defer S5 (cross-env) per Q-PO.
6. Use `createPreQualifiedApplication` + `driveLeadToFunding` for fresh-data setup (rule #10 default). Do NOT pass `skipMerchantPreflight: true` on fresh-data path (lifecycle helper handles preflight). If reusing seed `accountPk=4524`, pass `skipMerchantPreflight: true` (rule #12).
7. Trigger move via `ScheduledPaymentPage.moveDueDateFirstOption(7)` — UI-first (rule #14). Do NOT call the move REST endpoint directly.
8. Use `Object.prototype.hasOwnProperty.call(body, key)` for AC-2 key-presence assertions — distinguishes the qa2 (missing) vs qa1 (null) drift.
9. SELECT-only on DB (rule: Security). No UPDATE/INSERT/DELETE on `uown_sv_sched_summary` or `uown_due_date_moves`.
10. Activity-log validation (rule #13) is **MANDATORY** — query `uown_sv_activity_log` with `log_type='DUE_DATE_MOVES'`; assert presence + `notes` regex (`/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/`) + `lead_pk IS NULL` + `creation_source='USER_ACTION'`. Pattern documented from investigação 2026-05-22 (account 4524, log pk=1735531).
11. DOM-first (rule #16): if any Move Due Date selector fails, investigate via MCP Playwright at viewport 1440×900 BEFORE increasing timeouts.
12. `tsc --noEmit` must pass before handing off to `qa-validator`.
13. Tags: `@qa1 @priority-high`; per-scenario `@smoke @hybrid @api @db @ui` as noted.
14. Hand off to `qa-validator` with run command suggestion (single-env qa1 invocation).

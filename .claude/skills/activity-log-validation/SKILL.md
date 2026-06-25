---
name: activity-log-validation
description: Load when planning, implementing, or validating a test that triggers a business action (signing, payment, refund, recovery, status transition, vendor callback). Every relevant action requires a log in uown_los_lead_notes or an equivalent table — no log = nothing happened.
disable-model-invocation: true
---

# Activity Log Validation — Inviolable Rule #13

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO VALIDATE** — mandatory log rules, tables, assertion patterns. The **canonical schema of tables and SQL queries** does NOT live here — the single source is `docs/business-rules/appendix-c-tabelas-banco.md` + `appendix-f-sql-reference.md`. To resolve a topic, run `node scripts/docs-tooling.mjs resolve activity-log`. **Do not duplicate table schema here** — it drifts.

## The principle

> "If there is no activity log, that means nothing is happening."
> — Priyanka Namburu, UOWN daily 2026-04-28

Every relevant business action **MUST** have a corresponding activity log / note in the DB. Absence of a log is an **implementation failure**, not acceptable behavior.

## When to apply

Whenever the test exercises:

- **Signing**: contract dispatch, signature event, completion, void
- **Payment**: attempt, success, failure, refund, EPO
- **Recovery / Arrangement**: new arrangement, modify, default
- **Status transition**: pre-qualified → qualified → leased → signed → active → closed
- **Vendor callback**: Kount, SEON, DV360, GowSign, SignWell
- **Lead modification**: edit invoice, add document, change merchant
- **Communication**: email dispatch, SMS, OTP

## Procedure

### 1. Before each test step

Identify the business action that the step triggers. E.g.: "step 5 — agent confirms signing completion via the portal".

### 2. Determine the log table

Default: `uown_los_lead_notes`. Variants by domain:
- Signing events: `uown_los_lead_notes` + possibly `uown_signing_event` (check via Grep)
- Payment: `uown_los_lead_notes` + `uown_payment_attempt`
- Vendor callbacks: `uown_los_lead_notes` + the vendor-specific table
- **Move Due Date:** `uown_sv_activity_log` (NOT `uown_los_lead_notes` — account-centric action)

Consult `docs/taskTestingUown/database-schema.md` or Grep for the name of the expected event.

### 3. REAL schema of `uown_los_lead_notes` (confirmed 2026-05-20 via qa1 probe)

**Existing columns**: `pk` (bigint), `agent` (varchar — frequently NULL), `row_created_timestamp`, `row_updated_timestamp`, `tenant_id`, `web_user_id`, `lead_pk`, `notes` (text).

⚠️ The columns `note_type`, `body`, `content`, `author`, `created_by`, `created_at` **DO NOT EXIST**. The typing is a **prefix inside the text**: `[ServiceName][methodName] message`. Real examples:
- `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true`
- `[ContractService][isLeaseOrLeaseModSigned] Lead starting status CONTRACT_CREATED`
- `[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING`

### 4. Add a DB assertion with the correct schema

```ts
import { db } from "@helpers/database.helpers.js";

const log = await db.waitForRecord<{ pk: number; notes: string; row_created_timestamp: Date }>({
 query: `SELECT pk, notes, row_created_timestamp
 FROM uown_los_lead_notes
 WHERE lead_pk = $1
 AND row_created_timestamp >= $2
 AND notes ILIKE $3
 ORDER BY row_created_timestamp DESC
 LIMIT 1`,
 params: [leadPk, triggerTs, '%[ContractService]%SIGNED%'],
 timeoutMs: 30_000,
});

expect(log).toBeDefined;
expect(log.notes).toMatch(/\[ContractService\].*SIGNED/i);
```

### 5. Validate content, not just presence

A log that exists but is empty is as bad as one that does not exist. Check in `notes`:
- **Service prefix** (`[ESIGNSERVICE]`, `[ContractService]`, `[LeadFundingService]`, `[UOwnClient]`, `[LosRequestMessageConstraintValidator]`, etc.)
- **Verb** in the method (parse, validate, update, send, sign, void)
- **Identifier** (new/old status, IDs, response codes)
- **Channel** when applicable (EMAIL, SMS, IN_PORTAL — extracted from the text)

## Expected output in SPEC / report

Each step with a business action in the SPEC **must** have an "Activity log expected" line, and each report must cover presence + content:

```markdown
### Step 5 — Agent confirms signing
- Action: click "Confirm Signature" in the Servicing portal
- API expected: POST /uown/svc/signing/{leadId}/confirm
- UI expected: badge changes to "Signed"
- **Activity log expected**: row in uown_los_lead_notes with `notes ILIKE '%[ContractService]%SIGNED%'`, lead_pk=:leadPk, row_created_timestamp >= trigger
```

## Move Due Date — canonical log in `uown_sv_activity_log` (2026-05-22)

The Move Due Date action is **account-centric** — the log goes in `uown_sv_activity_log`, NOT in `uown_los_lead_notes`.

| Field | Expected value |
|-------|----------------|
| `log_type` | `'DUE_DATE_MOVES'` |
| `account_pk` | accountPk populated |
| `lead_pk` | **NULL** |
| `creation_source` | `'USER_ACTION'` |
| `created_by` | logged-in UI user |
| `notes` | matches `/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/` |

**Timing pitfall:** the backend throws `ResponseStatusException(BAD_REQUEST)` BEFORE the `createOrUpdate` when validation fails (e.g., offset > WEEKLY cap). The log is never written — asserting the absence of the log when status = 400 is part of the negative CT, not an observability gap.

**Cosmetic pitfall — `"from dueDate"` in notes:** the backend's `String.format` leaks the Java variable name `dueDate` into the user-facing log (e.g., `"Due Date changed from dueDate 2026-05-30 by 3 days"`). This is not a bug of this task. Assert with the exact string as per the real format, not "from date".

**Assertion template:**

```typescript
const log = await db.waitForRecord<{ notes: string; created_by: string }>({
 query: `SELECT notes, created_by
 FROM uown_sv_activity_log
 WHERE account_pk = $1
 AND log_type = 'DUE_DATE_MOVES'
 AND row_created_timestamp >= $2
 ORDER BY pk DESC LIMIT 1`,
 params: [accountPk, triggerTs],
 timeoutMs: 15_000,
});
expect(log.notes).toMatch(/Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days/);
```

## Canonical lead_pk vs account_pk mapping

| Action | Log table | Key | Content example |
|------|--------------|-------|---------------------|
| Settle Application | `uown_los_lead_notes` | `lead_pk` | `[UOwnClient][settleApplication]` + `[LeadFundingService][updateFundingStatus]` |
| Move Due Date | `uown_sv_activity_log` | `account_pk` | `log_type='DUE_DATE_MOVES'`, notes match `/Due Date changed from dueDate .../` |
| Payment attempt | `uown_los_lead_notes` | `lead_pk` | `[PaymentService]...` |
| Signing event | `uown_los_lead_notes` | `lead_pk` | `[ContractService][isLeaseOrLeaseModSigned]...` |

**Mnemonic rule:** an action on a lead (pre-funding) → `uown_los_lead_notes (lead_pk)`; a post-funding action on an account → `uown_sv_activity_log (account_pk)`.
Source: live qa1 lead_pk=11748 / account_pk=4774 (2026-05-24).

## Settle Application — canonical log in `uown_los_lead_notes` (2026-05-24)

The Settle Application action produces notes in `uown_los_lead_notes` with `lead_pk`:

| Expected pattern in `notes` | Order |
|---------------------------|-------|
| `[UOwnClient][settleApplication]` (call to the Settle client) | 1 |
| `[LeadFundingService][updateFundingStatus]` (status transition) | 2 |

**Exact UI toast:** `"Successfully settled this lease"` (captured live in qa1 lead 11748, 2026-05-24). Use this exact string in toast assertions — not `"Settled successfully"` nor `"Lease settled"`.

**Diagnostic pattern — `termnull` smell:** if the Settle notes contain the string `"termnull"`, the lead was affected by the NPD=null bug (pre-fix). Diagnostic query: `SELECT COUNT(*) FROM uown_los_lead_notes WHERE notes ILIKE '%termnull%'` — zero rows confirms the fix is applied. See [[application-lifecycle]] pitfall #62.

**Assertion template:**

```typescript
const settleNote = await db.waitForRecord<{ notes: string }>({
 query: `SELECT notes FROM uown_los_lead_notes
 WHERE lead_pk = $1
 AND notes ILIKE '%[UOwnClient][settleApplication]%'
 ORDER BY pk DESC LIMIT 1`,
 params: [leadPk],
 timeoutMs: 120_000, // 120s configured; if it returns 0 rows, suspect TZ drift before increasing — see pitfall #66 (root cause) / #65 (SUPERSEDED)
});
expect(settleNote).toBeDefined;
expect(settleNote.notes).not.toContain('termnull'); // confirms NPD is not null
```

## Sticky cancel/refund — SYSTEM_GENERATED log in `uown_sv_activity_log` (R1.53.0)

Unlike the human/UI logs (`DUE_DATE_MOVES`, `created_by`=user), the R1.53.0 Sticky actions write **system-generated** logs. When asserting, do NOT expect a human `created_by` nor a `lead_pk`:

| Field | Value (sticky cancel/refund) |
|-------|------------------------------|
| `log_type` | `INTERNAL` |
| `created_by` | `SYSTEM` |
| `creation_source` | `SYSTEM_GENERATED` |
| `lead_pk` | `null` (the log is account-level) |
| `notes` (e.g.) | `"Sticky recovery marked CANCELED locally — Sticky rejected cancel: <error>"`; refund writes `"Sticky refund submitted…"` (sync) + `"Sticky refund confirmed via webhook…"` |

Source: KB `559-sticky-recover-cancel-sweep.md` (pk10961637) + `sticky-payment-refund.md`. Product rule: [[payment-flows]] · `05-pagamentos.md §53b`.

## Known gaps (actions that do NOT currently generate a log)

Catalog of actions that confirmedly do **not** produce a note — open an observability ticket if the test depends on it:

| Action | Primary evidence table | Lead notes? | Confirmed on |
|---|---|---|---|
| `POST /uown/sendWelcomeEmail/{pk}` | `uown_email_queue` (template_name='Welcome', status=SENT) | **NO** (0/45 in 60d) | 2026-05-20 — qa1 — |
| `settledInFullAccountEmailSweep` | `uown_email_queue` (template_name=`SettledInFullEmail`, monotonic PK) | undetermined | 2026-06-02 — dev3 |
| `RecurringPaymentReminderSweep` | `uown_email_queue` (template_name=`RecurringPaymentReminder`) | undetermined | 2026-06-02 — dev3 |
| `FirstPaymentReminderSweep` | `uown_email_queue` (template_name=`FirstPaymentReminder`) | undetermined | 2026-06-02 — dev3 |

### Audit tables for email sweeps (dev3 2026-06-02)

- `uown_email_queue` — **primary evidence** (`pk, account_pk, lead_pk, template_name, status, sent_time, row_created_timestamp`). Monotonic PK; assert a new row from today.
- `uown_correspondence_logs` — `pk, account_pk, lead_pk, correspondence_type ('EMAIL'), template_name, error, row_created_timestamp`. ⚠️ `error` carries informational text EVEN on success — do **NOT** assert `error IS NULL`.
- `uown_sweep_logs` — `pk, sweep_name, number_of_records_processed, row_created_timestamp`. ⚠️ `number_of_records_processed` is written AFTER processing; a read `< 5s` after the trigger returns `0`. Do NOT use it as evidence of success. See [[payment-flows]] section "Email Sweep validation" + [[application-lifecycle]] pitfalls #87-#90.

## Pitfalls

1. **Timing** — the log may be asynchronous (callback, queue). Use `waitForRecord` with backoff, not a single query.
2. **Idempotency** — does resending an email generate a new log? Confirm: AC4 of "example.md" requires a new log on resend.
3. **Audit field vs display field** — `uown_los_lead_notes` keeps the technical id; the UI shows a friendly name. Validate **both** when applicable.
4. **Vendor callback latency** — Kount/SEON can take minutes in sandbox. Do not set too short a timeout.

## Anti-patterns

- ❌ Marking a test green when the UI shows success but the log was not written — a silent bug
- ❌ Polling only by UI status; the UI may be cached
- ❌ Ignoring a missing log "because it does not change the functional result" — violates inviolable rule #13
- ❌ Hardcoding a `note_type` string without checking the real value in production/staging

## Cross-links

- Inviolable rule #13 in `CLAUDE.md`
- Skill [[qa-domain-reflexes]] — complete checklist of validations per action
- Skill [[application-lifecycle]] — logs expected at each step of the lifecycle
- Skill [[db-polling-pattern]] — how to poll a log with backoff

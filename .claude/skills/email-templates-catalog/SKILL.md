---
name: email-templates-catalog
description: Load when planning/implementing/validating a test that involves email templates (Welcome, Settled-in-Full, Verification, Late Payment, OTP). Catalog of confirmed facts — template_name, GCS bucket, schema of the uown_email_queue and uown_los_lead_notes tables, observability gaps.
disable-model-invocation: true
---

# Email Templates Catalog — facts confirmed via DB probe

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **confirmed email facts** — template names, table schemas, observability gaps. The **canonical communication rules** (portal, SMS, consent, notifications) do NOT live here — the single source is `docs/business-rules/10-portal-comunicacoes.md`. To resolve a topic, run `node scripts/docs-tooling.mjs resolve email`. **Do not duplicate product rules here** — they drift.

> Source of the confirmations: direct probe in qa1 (`scripts/probe_welcome.ts`, `scripts/probe_notes_schema.ts`). Update this skill whenever a new fact is confirmed by a probe (`qa-doc-keeper`'s responsibility).

## 1. Table `uown_email_queue` — canonical schema

The source-of-truth table for "email was sent" evidence. The `triggerScheduledTask/emailSweep` sweep is the worker that changes `status PENDING → SENT` and populates `sent_time`.

| Column | Type | Use in validation |
|---|---|---|
| `pk` | bigint | row identifier |
| `account_pk` | bigint | filter by account (lease FK) |
| `lead_pk` | bigint | filter by lead (origination) |
| `customer_pk` | bigint | customer FK |
| `merchant_pk` | bigint | 0 = no merchant (e.g., Welcome) |
| `to_email_addresses` | text | compare with the customer's email |
| `from_email_address`, `from_email_name` | varchar | sender branding |
| `subject` | text | subject assertion |
| `template_name` | varchar | **case-sensitive** — use the exact literal |
| `template_version` | varchar | normally NULL |
| `status` | varchar | `PENDING` (queued) → `SENT` / `STORED` (delivered) |
| `queue_type`, `priority` | varchar | queue metadata |
| `sent_time` | timestamp | NULL before the sweep; populated after pickup |
| `picked_at_time`, `send_by_time` | timestamp | SLA window |
| `row_created_timestamp`, `row_updated_timestamp` | timestamp | use `row_created_timestamp >= trigger_ts` to filter |
| `email_body` | text | full delivered HTML (use to extract `<img src>`, validate placeholders) |
| `email_body_type` | varchar | `HTML` or `TEXT` |
| `data_map` | text (json) | merge vars (FirstName, Amount, etc.) |
| `error_desc`, `response` | text | troubleshooting of failed sends |

### Standard send-validation pattern

```sql
SELECT pk, account_pk, lead_pk, to_email_addresses, subject,
 template_name, status, sent_time, email_body_type
 FROM uown_email_queue
 WHERE account_pk = :accountPk
 AND template_name = :templateName — case-sensitive
 AND row_created_timestamp >= :triggerTs
 ORDER BY row_created_timestamp DESC
 LIMIT 1;
```

Minimum assertions: row exists; `status='SENT'`; `sent_time IS NOT NULL`; `to_email_addresses` matches the email; `email_body_type='HTML'`.

## 2. Catalog of `template_name` (exact value — case-sensitive)

| template_name | Trigger | Brand-aware? | Activity log in lead_notes? | Confirmed |
|---|---|---|---|---|
| `Welcome` | `POST /uown/sendWelcomeEmail/{accountPk}` | yes (UOWN ↔ KS) after #517 | ❌ NO (gap) | 2026-05-20 qa1 (45 sends) |
| `SettledInFullEmail` | sweep `settledInFullAccountEmailSweep` | undetermined | undetermined | 2026-06-02 dev3 |
| `RecurringPaymentReminder` | sweep `RecurringPaymentReminderSweep` | undetermined | undetermined | 2026-06-02 dev3 |
| `FirstPaymentReminder` | sweep `FirstPaymentReminderSweep` | undetermined | undetermined | 2026-06-02 dev3 |

> Add new rows as other templates are probed. Include a "Confirmed on" column with env + date — without it the entry becomes folklore.

> ⚠️ `src/scripts/dev3-trigger-sweeps.ts` uses the WRONG template `SettledInFullAccountEmail` (with `Account`) and the WRONG port `5446` — do NOT copy from that file. The real `template_name` is `SettledInFullEmail` (without `Account`). Confirmed in `email-sweeps-servicing.spec.ts`, dev3 2026-06-02. Selection conditions and DOW window of each sweep: [[payment-flows]] section "Email Sweep validation + selection conditions" + [[application-lifecycle]] pitfalls #87-#90.

## 3. Image hosting — approved GCS domain

**Confirmed allow-list**: `https://storage.googleapis.com/uown/<filename>` (bucket = `uown`).

Known images in the current Welcome template (pre-#517):
- `logo_top_62.png` (+ `@2x.png`)
- `icon-facebook.png`
- `icon-twitter.png` *(will be replaced by `icon-linkedin.png` in #517 for UOWN)*
- `icon-instagram.png`
- `logos-05.png` (+ `@2x.png`)

Validation regex (negative — any URL outside this allow-list fails):
```regex
<img[^>]+src="(?!https://storage\.googleapis\.com/uown/)
```

Also include CSS background images: `background(?:-image)?:url\(["']?([^"')]+)`.

## 4. Sweep — `emailSweep`

**Endpoint**: `POST {svc}/uown/svc/triggerScheduledTask/emailSweep` — picks up `PENDING` rows, dispatches via SendGrid, populates `sent_time` and changes `status` to `SENT` (`STORED` has also been seen).

**Confirmed availability**: dev1, qa1.
**Undetermined** (requires VPN): stg, qa2.

Pattern: `trigger` → `sweep` → `poll DB sent_time IS NOT NULL` → `poll IMAP inbox`.

Existing helpers in `src/helpers/settled-in-full.helpers.ts`:
- `getEmailQueueRecord(db, toEmail, accountPk, templateHint)` — single fetch
- `waitForEmailQueueRecord(...)` — with exponential polling
- `waitForEmailQueueDispatched(db, queuePk, timeoutMs)` — waits for `sent_time IS NOT NULL`
- `countEmailQueueRows(db, accountPk, sinceTs)` — baseline / idempotency

## 5. `uown_los_lead_notes` — real schema (CORRECTION 2026-05-20)

A probe confirmed that the table **does NOT have** `note_type`. Real schema:

| Column | Type | Notes |
|---|---|---|
| `pk` | bigint | |
| `agent` | varchar | almost always NULL (system logs) |
| `row_created_timestamp` | timestamp | use this, not `created_at` |
| `row_updated_timestamp` | timestamp | |
| `tenant_id` | bigint | |
| `web_user_id` | bigint | |
| `lead_pk` | bigint | main filter |
| `notes` | text | free content, typing as a prefix |

**Implicit typing** — observed format:
```
2026-05-18T13:22:46.293Z : [ServiceName][methodName] free message
```

Real examples (lead 11407):
- `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true`
- `[ContractService][isLeaseOrLeaseModSigned] Lead starting status CONTRACT_CREATED`
- `[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING`

Correct validation:
```sql
SELECT pk, notes, row_created_timestamp
 FROM uown_los_lead_notes
 WHERE lead_pk = :leadPk
 AND row_created_timestamp >= :triggerTs
 AND notes ILIKE '%[ContractService]%SIGNED%';
```

## 6. Confirmed observability gaps

| Action | Gap | Workaround | Report? |
|---|---|---|---|
| Welcome Email | Does not create a note in lead_notes | Use `uown_email_queue` as primary evidence | Yes — pitfall in `activity-log-validation` |
| `uown_correspondence_logs.error` | Field carries informational text EVEN on success (dev3 2026-06-02) | Do NOT assert `error IS NULL` to validate send success — use the presence of a row in `uown_email_queue` | No (log behavior, not a bug) |

## 7. IMAP — reading the delivered email

Shared inbox: `fintechgroup777@gmail.com` (see memory `reference_imap_fintechgroup777`).

Plus-addressing by runId to isolate between tests/workers:
```ts
import { uniqueEmail, RUN_ID } from '@helpers/index.js';
const customerEmail = uniqueEmail(`517-${RUN_ID}-uown`);
```

Helper: `src/helpers/email.helpers.ts` — `snapshotInboxUid` → `getEmailContent` / `getEmailLink`.

**Rule**: click the real link (do not use the API payload URL) for flows involving a CTA — see memory `feedback_email_imap_click_link`.

## 8. How to keep this skill up to date (qa-doc-keeper)

This skill is a **living catalog of probed facts**, not theory documentation. Every time:

1. A new template is discovered / created → add a row in §2.
2. A new bucket / image domain appears → update §3.
3. The table schema changes (new migration) → re-probe and update §1 or §5.
4. A log gap is confirmed / closed → update §6.

**Re-probe command** (run when you suspect drift):
```bash
npx tsx scripts/probe_welcome.ts QA1
npx tsx scripts/probe_notes_schema.ts QA1
```

Always include the **confirmation date + env** when adding a row. Without it the info becomes folklore and the next agent won't know whether it is still true.

## Cross-links

- Skill [[activity-log-validation]] — correct lead_notes schema (references this skill)
- Skill [[db-polling-pattern]] — polling patterns
- Memory `reference_imap_fintechgroup777`
- `docs/taskTestingUown/database-schema.md` — canonical schema (must reflect this skill)

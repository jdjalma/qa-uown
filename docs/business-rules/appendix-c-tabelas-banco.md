---
title: "Appendix C: Important Database Tables"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - db: uown_los_lead
  - db: uown_sv_account
  - db: uown_scheduled_task
  - db: uown_right_foot_balance_check
  - db: uown_customer_journey
  - env: qa2
covers: [tabelas, schema, postgres, indexes, troubleshooting, merchant-snapshot, rightfoot, customer-journey]
---

# Appendix C: Important Database Tables
## UOwn Leasing - SVC Platform

The most important PostgreSQL tables for verification and troubleshooting.

---

## Appendix C: Important Database Tables for Verification

| Table | Use | When to Query |
|--------|-----|-----------------|
| `uown_sv_account` | Servicing accounts | Check status, balance, rating |
| `uown_los_lead` | Application leads | Check lead status, UW result |
| `uown_los_lead_short_code` | Lead short codes (migrated from uown_los_lead) | Check short_code after migration V20260226100000 |
| `uown_lead_approval_terms` | Approved terms per lead (Task #1239) | Check UW/merchant/approved terms after `termsStep` or `CalculatorStep` |
| `uown_sv_cctransaction` | CC transactions | After CC sweeps |
| `uown_sv_achpayment` | ACH payments | After ACH sweeps |
| `uown_sv_receivable` | Receivables | Check installments, EPO, due dates |
| `uown_sweep_logs` | Sweep logs | Check execution of any sweep |
| `uown_scheduled_task` | Sweep definitions | Check cron, SQL, is_active |
| `uown_email_queue` | Email queue | Check sent correspondence |
| `uown_sms_queue` | SMS queue (opt-in and notifications) | Check SMS delivery per lead/account; optimized indexes (Task #455) |
| `uown_sv_protection_plan` | Protection plan | Check enrollments/cancellations |
| `uown_sv_contract` | Contracts | Check e-sign status |
| `uown_blacklist_*` | Blacklists | Check fraud entries |
| `uown_frequency_mods` | Frequency changes | Change audit |
| `uown_due_date_moves` | Due date moves | Adjustment audit |
| `uown_sv_payment_arrangement` | Payment arrangements (Task #446) | Check status (NOT_STARTED/IN_PROGRESS/SUCCESS/FAILED), type (NORMAL/SETTLEMENT), FK with CC/ACH transactions |
| `uown_right_foot_balance_check` | RightFoot bank balance result (R1.53.0) | Decides whether the ACH rerun is created (`status=SUCCESS` + balance); see RightFoot section below |
| `uown_right_foot_batch` | RightFoot batch/webhook audit (R1.53.0) | Check `status`, `webhook_payload`, `batch_complete_event_fired` |
| `uown_right_foot_outbound_api_log` | RightFoot external call log (R1.53.0) | Integration troubleshooting |
| `uown_customer_journey` / `uown_customer_session` / `uown_customer_event` | Origination funnel telemetry (R1.53.0, origination#1308) | Drop-off/friction analysis; see Customer Journey section below |
| `qrtz_*` | Quartz scheduler | State of scheduled jobs |

---

## Performance Indexes — SmsOptInConfirmationResponse (Task #455)

Partial indexes created by the Flyway migration V20260220050615 to optimize the `SmsOptInConfirmationResponse` query. They replace the old combined index (`idx_uown_sms_queue_lead_account_pk`) with two independent partial indexes, reducing CPU on SMS opt-in queries.

| Index | Table | Column | Type |
|-------|--------|--------|------|
| `idx_uown_sms_queue_lead_pk` | `uown_sms_queue` | `lead_pk` | Partial (WHERE lead_pk IS NOT NULL) |
| `idx_uown_sms_queue_account_pk` | `uown_sms_queue` | `account_pk` | Partial (WHERE account_pk IS NOT NULL) |
| ~~`idx_uown_sms_queue_lead_account_pk`~~ | `uown_sms_queue` | — | **Removed** by the migration |

---

## Performance Indexes — getDataMismatchForLead (Task #449)

Composite indexes created to optimize the `getDataMismatchForLead` query (Step 5 of the origination pipeline). They reduce CPU and I/O on impersonation fraud checks.

| Index | Table | Columns | Purpose |
|-------|--------|---------|-----------|
| `idx_uwdata_status_expiration` | `uown_los_uwdata` | `uw_status, approval_expiration_date` | Filter leads with UW approved within validity |
| `idx_lead_timestamp_status` | `uown_los_lead` | `row_created_timestamp, lead_status` | Filter active leads by creation period |
| `idx_address_zip_code` | `uown_los_address` | `zip_code` | Address verification joins |
| `idx_address_state` | `uown_los_address` | `state` | Address verification joins by state |

---

## Performance Indexes — getLosActivityLog (Task #457)

Composite index created by the Flyway migration V20260225120421 to optimize the activity log query (high CPU). Enables searches by `lead_pk + log_type` ordered by `row_created_timestamp DESC` without a seq-scan.

| Index | Table | Columns | Type |
|-------|--------|---------|------|
| `idx_los_activity_lead_type_created_ts` | `uown_los_activity_log` | `lead_pk, log_type, row_created_timestamp DESC` | Composite |

---

## Performance Indexes — getLeadSummaryResults (Task #461)

Indexes created by the Flyway migration V20260220064821 to optimize the `getLeadSummaryResults` query. Includes a functional phone-concatenation index and four indexes shared with `getDataMismatchForLead` (Task #449).

| Index | Table | Columns / Expression | Type |
|-------|--------|---------------------|------|
| `idx_phone_full_number_active` | `uown_los_phone` | `(area_code \|\| phone_number)` | Functional (expression) |
| `idx_uwdata_status_expiration` | `uown_los_uwdata` | `uw_status, approval_expiration_date` | Composite (shared with #449) |
| `idx_lead_timestamp_status` | `uown_los_lead` | `row_created_timestamp, lead_status` | Composite (shared with #449) |
| `idx_address_zip_code` | `uown_los_address` | `zip_code` | Simple (shared with #449) |
| `idx_address_state` | `uown_los_address` | `state` | Simple (shared with #449) |

**Note:** Functional (expression) indexes must be verified via `pg_indexes.indexdef` — the helper `getIndexColumns()` uses `pg_attribute` and does not return columns of expression-based indexes.

---

## Performance Indexes — getLosSimpleSearchResults (Task #463)

Functional indexes created by the Flyway migration V20260227113249 to optimize case-insensitive search by customer name in the `getLosSimpleSearchResults` query. PostgreSQL stores the expression as `upper((col)::text)`.

| Index | Table | Expression | Type |
|-------|--------|-----------|------|
| `idx_customer_first_name_upper` | `uown_los_customer` | `UPPER(first_name)` | Functional (UPPER) |
| `idx_customer_last_name_upper` | `uown_los_customer` | `UPPER(last_name)` | Functional (UPPER) |

**Verification rule:** The search query MUST use `UPPER(first_name) = UPPER($1)` (and not `ILIKE` or direct comparison) for the planner to use the functional index.

---

## Performance Indexes — Login and Account Status

Indexes created by the migrations V20260306062454 and V20260311070247 to optimize security queries and account status tracking.

| Index | Table | Columns | Migration | Purpose |
|-------|--------|---------|----------|-----------|
| `idx_uown_login_attempt` | `uown_login_attempt` | `(username, created_date)` | V20260306062454 | Optimizes rate-limiting verification and login attempt auditing |
| `idx_account_status_leadpk` | `uown_sv_account` | `(account_status, lead_pk)` | V20260311070247 | Optimizes account lookup queries by status + lead (e.g., collections sweeps, reports) |

**Context:** The login index was added together with the authentication attempt tracking system (security audit). The account_status + lead_pk index speeds up sweeps that filter accounts by status and then join with the originating lead.

---

## Performance Indexes — getLeadSummaryResults (V20260309065837)

Additional indexes created to optimize the `getLeadSummaryResults` query (leads search screen in the Origination portal).

| Index | Table | Columns | Purpose |
|-------|--------|---------|-----------|
| Lead summary indexes | `uown_los_lead`, `uown_los_customer`, `uown_los_address` | Varies | Fast search by name, status, date, and merchant in the leads listing |

**Note:** The exact details of the indexed columns can be verified via:
```sql
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename IN ('uown_los_lead', 'uown_los_customer', 'uown_los_address')
  AND indexname LIKE '%summary%'
ORDER BY indexname;
```

---

## uown_los_sched_summary — Term Month Display (Task #1242)

Schedule summary table that contains information about the plan selected by the customer. The `term_in_months` field is the data source for the "Term Month" column in the Overview and Leads tables of the Origination portal.

| Column | Type | Description |
|--------|------|-------------|
| `pk` | BIGSERIAL PK | Unique identifier |
| `lead_pk` | BIGINT FK | Reference to the lead (`uown_los_lead.pk`) |
| `account_pk` | BIGINT FK | Reference to the account (null until funding) |
| `term_in_months` | INTEGER | Term selected by the customer (13 or 16 months) |
| `plan_id` | VARCHAR | Plan identifier (e.g., `WK13`, `BWK16`) |
| `payment_frequency` | VARCHAR | Selected payment frequency |

**Lifecycle:**
- Record created during `submitApplication` (NOT during `sendApplication`)
- `term_in_months` populated from the `planId` selected by the customer
- Leads without a completed `submitApplication` have no record — the "Term Month" column displays empty in the frontend
- JOIN: `LEFT JOIN uown_los_sched_summary ON lead_pk` (allows null)

**Verification query:**

```sql
SELECT term_in_months, plan_id, payment_frequency
FROM uown_los_sched_summary
WHERE lead_pk = :leadPk
ORDER BY pk DESC
LIMIT 1;
```

---

## uown_lead_approval_terms (Task #1239)

Records the approved terms for each lead after the `termsStep` (leads without invoice) or `CalculatorStep` (leads with invoice).

| Column | Type | Description |
|--------|------|-------------|
| `pk` | BIGSERIAL PK | Unique record identifier |
| `lead_pk` | BIGINT FK | Reference to the lead (`uown_los_lead.pk`) |
| `uw_terms` | VARCHAR | Terms returned by underwriting (e.g., `"13,16"`) |
| `merchant_terms` | VARCHAR | Terms configured for the merchant (e.g., `"13,16"`) |
| `approved_terms` | VARCHAR | Intersection of UW and merchant — effective approved terms (e.g., `"13,16"`) |
| `row_created_timestamp` | TIMESTAMP | Record creation date/time |

**Rules:**
- Each execution of `termsStep` or `CalculatorStep` **inserts** a new record — never does an UPDATE/UPSERT
- Complete history preserved per lead
- Values displayed in the frontend via `approvedTermMonthsDisplay` from the `GET /uown/los/getMerchantInfo/{leadPk}` endpoint (e.g., `"13 months, 16 months"`)

**Verification query:**

```sql
SELECT pk, lead_pk, uw_terms, merchant_terms, approved_terms, row_created_timestamp
FROM uown_lead_approval_terms
WHERE lead_pk = :leadPk
ORDER BY row_created_timestamp DESC;
```

---

## Merchant Settings Snapshot (R1.53.0 — Flyway 20260609155406)

Tables created by release 1.53.0 (qa2 deploy 2026-06-15) to preserve the merchant's underwriting configuration at the moment of approval. Ensures that later changes to the merchant do not affect already-approved leads/accounts.

| Table | Purpose | Unique key |
|--------|-----------|-------------|
| `uown_los_lead_merchant_settings_snapshot` | Snapshot written at the lead's UW approval (LOS) | `lead_pk` UNIQUE |
| `uown_sv_account_merchant_settings_snapshot` | Snapshot inherited from the lead, written at account creation (SVC) | `account_pk` UNIQUE |

**Business columns (both, confirmed in the DDL):** `merchant_pk`, `program_pk` (nullable), `epo5` BOOLEAN (EPO 5%), `epo10` BOOLEAN (EPO 10%), `uw_pipeline` VARCHAR(10) (values `GDS` / `ABBR` / `TAKTILE`), `fraud_threshold` INTEGER. The account table adds `lead_pk`. (+ audit: `tenant_id`, `web_user_id`, `agent`, `row_created/updated_timestamp`.)

**Lifecycle (confirmed in R1.53.0 code):**
- **LOS snapshot (lead):** written by `MerchantSettingsSnapshotListener` in a **new transaction, AFTER_COMMIT**, on receiving `ApplicationApprovedEvent` — published by `ApplicationProcessor` only when `isUwApproved` (status `UW_APPROVED`) **AND** `maxApprovalAmount > 0`. A snapshot failure does **not** fail the application (exception swallowed).
- **SVC snapshot (account):** written inline in the LOS→SVC import (`LosToSvcImportService`) **copying the lead's snapshot data** — it does NOT re-query the live merchant. If the lead snapshot does not exist, the account snapshot is **skipped**.
- Both writes are **idempotent** (skip if a row already exists for the `lead_pk`/`account_pk`).
- `merchant_pk`/`program_pk` resolved via `findByLeadPk`; `epo5`/`epo10`/`uw_pipeline`/`fraud_threshold` come from `MerchantInfo` (GDS-config columns, Flyway `V20260312100000`).
- Leads/accounts prior to R1.53.0 (pre-2026-06-15) do NOT have a snapshot (Path A for absence tests).

**Sources:** `service/MerchantSettingsSnapshotService.java`, `service/application/sendApp/listener/MerchantSettingsSnapshotListener.java`, `service/application/sendApp/ApplicationProcessor.java`, `service/LosToSvcImportService.java`, `pojo/MerchantInfo.java`. Entities in dependency JARs (`los-common`/`svc-common`) — `@Table` mapping inferred by JPA convention, **[HYPOTHESIS]**.

---

## Underwriting Scores: npm_segment & tam_score (R1.53.0 — Flyway 20260603054943)

Columns `npm_segment INTEGER` and `tam_score INTEGER` added to **`uown_los_uwdata`** (lead) AND **`uown_sv_uwdata`** (account), both nullable.

- Origin: parsed from the GDS response (`out.npm_segment` / `out.tam_score`) -> `UWInfo` -> `uown_los_uwdata`; copied to `uown_sv_uwdata` in the LOS->SVC import (same `UWInfo` object).
- Meaning: **[HYPOTHESIS]** — `tam_score` (TireAgent model, live 475 in stg per memory), `npm_segment` (risk segment); pass-through of GDS JSON keys, svc does not filter by client-type.
- Detail: [02-originacao-pipeline.md §40](02-originacao-pipeline.md).

---

## RightFoot — ACH Balance Verification (R1.53.0 — Flyway 20260612102430 / 20260616122043 / 20260619131000)

| Table | Purpose | Key columns |
|--------|-----------|---------------|
| `uown_right_foot_balance_check` | 1 row per balance check request | `authorizer_unique_id` UNIQUE (`RFBC-{accountPk}-{snowflake}`), `account_pk`, `batch_id`, `routing_number`, `account_number`, `requested_amount`, `balance`, `status`, `failure_reason`, `process_type` |
| `uown_right_foot_batch` | Webhook/batch audit | `batch_id`, `status`, `webhook_payload`, `errors`, `process_type`, `batch_complete_event_fired` |
| `uown_right_foot_outbound_api_log` | Outbound call log | `json_api_endpoint`, `request_url`, `http_method`, `request/response_body`, `http_status`, `stack_trace` |

- `uown_sv_achpayment.right_foot_balance_check_pk` (BIGINT) — FK of the ACH created for the approved balance check.
- `status` confirmed: `SUCCESS` (gate). Other values live in the `com.uownleasing:rightfoot` lib — **[HYPOTHESIS]**.
- Cleanup: `CleanupService.deleteOldEntries` purges old rows. Full rule: [09-integracoes-externas.md §48](09-integracoes-externas.md).

---

## Customer Journey / Session / Event — Funnel Analytics (R1.53.0 — Flyway 20260611054944/45/46)

Tracking of the customer's application funnel (abandonment, refreshes, per-page timing). Fed by the **frontend** (Website/origination, iframe-embeddable) via `POST /api/journeys/...`. `journey_id` = `leadPk`.

| Table | Purpose | Key columns |
|--------|-----------|---------------|
| `uown_customer_journey` | 1 per journey | `journey_id` UNIQUE, `status`, `current_step`, `total_sessions`, `total_refreshes`, `total_submit_attempts`, `started_at`, `completed_at`, `last_activity_at`, `source`, `application_id`, `merchant_id`, `shortcode` |
| `uown_customer_session` | N per journey | `session_id` UNIQUE, `journey_id`, `status`, `browser`, `device_type`, `operating_system`, `iframe_ind`, `embedder_origin`, `refresh_count` |
| `uown_customer_event` | N per session | `event_id` UNIQUE, `session_id`, `journey_id`, `event_type`, `page_name`, `api_duration_ms`, `render_duration_ms`, `page_duration_ms`, `error_code`, `error_message` |

- **JourneyStatus:** `IN_PROGRESS` -> `COMPLETED` (event `REDIRECT_COMPLETED`); `ABANDONED` declared but **never set** in code ([OBSERVATION]).
- **event_type** with branch: `PAGE_REFRESHED` (increments refreshes), `REDIRECT_COMPLETED` (completes); the rest = free text. **Session status** (free text): `ACTIVE`/`ENDED`.
- **[OBSERVATION]** `total_submit_attempts`, `application_id`, `merchant_id`, `shortcode`, `source` declared but never populated in svc code R1.53.0; possible persistence no-op in `CustomerJourneyService.complete()`. Confirm with product.
- Sources: `svc/analytics/` package. Detail: [02-originacao-pipeline.md](02-originacao-pipeline.md) · [appendix-d D.37](appendix-d-constantes-enums.md).

---


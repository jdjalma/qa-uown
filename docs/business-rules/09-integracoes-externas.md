---
title: Third-Party Integrations
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/data/merchant-config-contract.ts#offerInsurance
  - db: uown_sv_protection_plan
  - svc-source: config/rightfoot/RightFootConfig.java
  - env: qa2
covers: [buddy-insurance, taxcloud, taxjar, five9, kornerstone, proget, skit-ai, vendor-health, rightfoot]
---

# Third-Party Integrations
## UOwn Leasing - SVC Platform

Buddy Insurance, TaxCloud/TaxJar, Five9, RTR/Kornerstone, Proget and Skit.ai.

---

## 23. Protection Plan (Buddy Insurance)

### What It Is

The protection plan is an **optional insurance product** offered to the customer, operated by **Buddy Insurance** (an AON partner). The product is `AON_PURCHASEPROTECTION` -- purchase protection insurance for the leased merchandise.

### What It's For

It protects the customer against damage, theft, or loss of the leased product during the lease period.

### Pricing

**$12.99/month** (monthly), $38.97 (quarterly), $155.88 (one-time payment). Buddy collects directly via the customer's card token.

### How the Customer Selects It

**Channel 1 - At Origination (during signing):**
The e-sign form presents the plan offer. The customer checks `optIn = true` to enroll or `optIn = false` to decline.

**Channel 2 - In the Customer Portal (post-funding):**
The endpoint `GET /getPlanEligibilityForAccount/{accountPk}` checks eligibility, and `POST /enrollAccountInProtectionPlan` performs the enrollment.

### Eligibility Check (Portal)

| Condition | Required |
|----------|-----------|
| Account ACTIVE | Yes |
| Merchant has `offerInsurance = true` | Yes |
| Customer's state in the list of allowed states | Yes |
| Not already enrolled | Yes |
| No other account with the same email already has an active plan | Yes |

### Enrollment Flow (Opt-In)

1. **Card tokenization:** Creates a payment token via USA ePay so Buddy can charge directly
2. **Call to Buddy:** POST to `https://partners.buddyinsurance.com/v3/policy` with customer data and payment token
3. **Response:** Receives `policyId` and `customerId`
4. **Status:** COMPLETED with `enrollmentDate = today`

### Cross-Coverage

If the customer chose NOT to enroll, the system checks whether they already have coverage via another lead/account with the same email. If so, it sets `alreadyCovered = true` and copies the data from the existing policy.

### Impact on Payments and Finances

| Aspect | Impact |
|---------|---------|
| Receivables | For current UOWN accounts: Buddy collects directly (no receivable). For migrated Kornerstone accounts: a `PROTECTION_PLAN_FEE` receivable is created |
| EPO | Plan fees are **excluded** from the payment calculation for EPO |
| Contract balance | Plan fees are added as "Protection Plan AddOn To Date" |
| Funding | Fee included in the funding cost calculation |

### Cancellation

**On UOwn's side:** When a lease is cancelled/expired, the system authenticates with Buddy via OAuth and calls the cancellation API. It cancels in cascade for all associated leads.

**On Buddy's side:** Buddy sends CSVs via SFTP to the `buddy/cancellations` folder. A weekly sweep (Friday 8 AM) processes the files.

### Main Configurations

| Config | Description |
|--------|-----------|
| `cancel.protection.plan` | Kill switch for cancellation (default: true) |
| `offer.insurance.in.states` | States where the plan is offered |
| `BuddyClient.base.url` | Buddy API URL |
| `BuddyClient.partner.id` | Partner ID (production: `p-19g61kzm0yy7d`) |

---

## 24. Taxes and Fees (TaxCloud / TaxJar)

### What It Is

The tax system automatically calculates the **sales tax rate** for each transaction based on the customer's or merchant's address.

### What It's For

Tax compliance. In the US, each state, county, and city can have different rates. UOwn needs to calculate and collect the correct tax for each jurisdiction.

### How Routing Works

The `TaxService` is the routing layer:

1. **Checks exemption:** If the merchant is `taxExempted` for the customer's state -> rate = 0%
2. **Routes to provider:** Config `useTaxCloudApi` (default: true)
   - True -> TaxCloud
   - False -> TaxJar

### TaxCloud (Primary Provider)

**What it does:**
1. **Rate lookup:** Given a complete address, returns the combined rate (state + county + city + district)
2. **Compliance reporting:** Receives data from each payment and refund daily for automated filing

**Cache:** Results stored in the `TaxForZip` table. If an unexpired result exists for the same address, no API call is made.

**Daily sweeps:**
- `DailyTaxCloudPaymentsSync`: Sends all of the day's payment allocations to TaxCloud (10 threads)
- `DailyTaxCloudRefundsSync`: Sends all of the day's reversed payments to TaxCloud (5 threads)

**How the internal user uses it:** An admin can look up a rate via `GET /getTaxForZip/{zipCode}`. Sweeps run automatically.

**How it affects the customer:** Tax is calculated transparently on each lease installment.

### TaxJar (Alternative/Legacy Provider)

**What it does:** Rate lookup only (no compliance reporting).

**Differentiators:**
- Supports override by zip code (useful for corrections)
- Cache with configurable expiration (default 30 days)
- Stores more details (county name, full response)

**When to use:** If TaxCloud has problems, an admin can switch via a config flag without a deploy.

---

## 25. Five9 (Call Center and IVR)

### What It Is

Five9 is a **cloud call center** platform that operates UOwn's IVR (Interactive Voice Response) system -- the automated telephone system.

### What It's For

It allows customers to interact with UOwn by phone and agents to make collection calls. The integration synchronizes customer preferences between Five9 and the UOwn system.

### How the Customer Interacts

The customer calls UOwn's number. During the IVR flow, they may be asked about communication preferences (e.g., "Do you want to keep receiving text messages?"). The response is captured and sent automatically to the UOwn system.

### How It Works Technically

Five9 sends a POST to `POST /uown/tms/updateContactPreferences` with:
- Phone number
- `doNotText` flag

The system looks up all matching phone records, updates the flag, and creates an activity log on the associated accounts.

### Impact

When a customer opts out of receiving texts via IVR, `doNotText = true` is set on their phone records, preventing future SMS communications.

---

## 43. RTR (Real Time Reporting / Kornerstone Migration)

### What It Is

Integration with the external RTR system for importing data from the legacy Kornerstone/Katerba systems.

### What It's For

It migrates portfolios from the old system (Kornerstone) to the new UOwn system. It synchronizes accounts, customer data, and transactions.

### How It Works

**Remote server:** `http://34.69.198.41:8080`

| Method | Function |
|--------|--------|
| `getAccountsThatChanged()` | Fetches accounts with changed data |
| `getImportPojoByRtrAccounData()` | Imports complete account data |
| `getImportPojoByApplicationId()` | Looks up by application ID |
| `getAllCompanyInfo()` | Company reference data |
| `processRtoData()` | Processes RTO data |
| `processKatabatData()` | Imports from a Katabat file |

### How to Trigger

- **Automatic sweep:** `kornerstoneDailyImportSweep` (10:00 PM daily)
- **Manual:** Via the MigrationService internal API

---

## 44. Proget (Device Locking)

### What It Is

Integration with the **Proget** system for remote locking of devices (IoT/GPS tracking) associated with leased merchandise.

### What It's For

When a customer becomes delinquent, the devices associated with the product can be locked remotely as an incentive to pay.

### How It Works

The daily sweep `progetDeviceLockingSweep` identifies delinquent accounts and sends lock commands to Proget.

### How to Enable

- The sweep runs automatically at midnight
- Requires Proget integration configured on the merchant
- To trigger manually: `POST /uown/svc/triggerScheduledTask/progetDeviceLockingSweep`

---

## 45. Skit.ai (Automated Collection Bot)

### What It Is

Integration with **Skit.ai**, a voice bot platform for automated collections.

### What It's For

The bot calls delinquent customers automatically, offers payment arrangements, and processes transactions via TMS -- with no need for a human agent.

### How It Works

1. **Sweeps generate files** with delinquent customer data:
   - `createSkitDelinquentFileSweep` - List of delinquents
   - `createSkitDelinquentOfferFileSweep` - List with settlement offers
2. **Files sent via SFTP** to Skit.ai
3. **Bot calls customers** and negotiates
4. **If the customer accepts:** The bot uses TMS to process the payment
5. **Notes logged** with type `SKIT_CALL_LOG` via `addLogNote`

### How to Enable

- Sweeps run automatically at midnight
- To generate a file manually: `POST /uown/svc/triggerScheduledTask/createSkitDelinquentFileSweep`
- The sweep's SQL defines the selection criteria (configurable via the database)

---

## 46. PayPair (External Merchant Portal)

### What It Is

PayPair is a **financing marketplace** platform that lets merchants offer multiple leasing/financing options (including UOWN) to customers through a single widget.

### What It's For

Merchants like TireAgent use the PayPair portal (`dw93bg.paypair.com`) to offer financing to the end customer without integrating directly with each provider. The PayPair widget presents plans from bread, koalafi, paytomorrow, and uown.

### How It Works

1. **Accessing the portal:** The merchant goes to `dw93bg.paypair.com` (public page, no login)
2. **Merchant selection:** Dropdown with a list of configured merchants
3. **Filling in data:** JSON textareas with the customer's personal data and shopping cart
4. **Configuration:** Provider=`anybody`, prequalification=`false`, productSelectionType=`ShopByVehicle`
5. **Modal widget:** The "Get lease" button opens the iframe `#llapp-iframe` (src: `fesandbox2.paypair.com/widget`)

### Customer Flow in the Widget

| Step | Action | Details |
|-------|------|---------|
| 1 | Phone verification | Phone (prefix 111/222 in sandbox) → OTP sent via SMS |
| 2 | OTP capture | Intercepted via the response of the `/api/v1/users/send_code` API → `otp_code` field |
| 3 | Application data | SSN, income, date of birth |
| 4 | Pre-qualification | The system evaluates eligibility → "Congratulations" banner if approved |
| 5 | Plan selection | 4 plans available: bread(0), koalafi(1), paytomorrow(2), uown(3) |
| 6 | Payment frequency | Weekly / Bi-Weekly / Twice a month |
| 7 | Payment | Nested iframe `#pt-iframe` inside `#llapp-iframe` for the UOWN CC/bank form |
| 8 | E-sign | ContractPage.completeESign() via UOWN Origination |

### Iframe Architecture

```
Page (dw93bg.paypair.com)
└── #llapp-iframe (PayPair widget sandbox)
    ├── Phone input / OTP / Data / Plans
    └── #pt-iframe (UOWN payment form)
        └── CC/Bank fields
```

### Merchants Integrated via PayPair

| Merchant | Product | Price |
|----------|---------|-------|
| TireAgent | Michelin Primacy 4 Tire Set | $800 + $10 tax |

### Differences Compared to PayTomorrow

| Aspect | PayTomorrow | PayPair |
|---------|-------------|---------|
| Login | Requires login to the portal | No login (public) |
| OTP | Email (IMAP) | Phone (network intercept) |
| Iframe | Direct page | Double nesting (#llapp → #pt) |
| Providers | PayTomorrow only | 4 providers (bread, koalafi, paytomorrow, uown) |
| Textareas | N/A | JSON via evaluate() |

---

## 47. Podium (Customer Review Management)

### What It Is

Podium is an **online reputation and review management** platform. The integration lets Servicing portal agents send review invitations directly to customers without leaving the UOwn interface.

### What It's For

To make it easier to collect reviews from satisfied customers via Google, Yelp, and other platforms managed by Podium. The agent does not need to copy emails or use the Podium portal separately.

### How the Agent Uses It

1. **Accessing the Send Invite modal:** On the Customer Information page of the Servicing portal, the agent clicks the envelope icon (`#invitation`) in the left sidebar
2. **Send Podium Link button:** Visible inside the modal only for users with the `send_podium_link` permission (permission `customer_information.modify.send_podium_link`)
3. **Confirmation:** The agent clicks "Send Podium Link" and confirms in the confirmation modal ("Please Confirm" / "Continue")
4. **Feedback:** Green toast "Podium invitation sent successfully." confirms the send

### How It Works Technically

**Endpoint:** `POST /uown/svc/accounts/{accountPk}/podium-link`

**Backend:**
1. Validates that a primary customer exists for the account (`No primary customer found for this account.` if not)
2. Obtains or renews the Podium OAuth2 token via an automatically managed lifecycle
3. Sends the invitation via the Podium API to the primary customer's email/phone
4. Logs the call in `sv_outbound_api_log` (separate SVC schema)

**Authentication with Podium (OAuth2):**
- Token stored in `uown_podium_token` (`access_token`, `refresh_token`, `expiration_time`)
- The system automatically renews the token before each call if needed
- Flyway migration: `V20260317121000__create_podium_token_table.sql`

### Access Control

| Permission | Role |
|-----------|-------|
| `send_podium_link` | Required to see/use the button in the Send Invite modal |
| Users without the permission | The Send Invite modal may be accessible, but the "Send Podium Link" button is not rendered |

### Database Structure

**`uown_podium_token` table:**

| Column | Type | Description |
|--------|------|-----------|
| `pk` | bigint | Auto-increment PK |
| `access_token` | text | Active OAuth2 token |
| `refresh_token` | text | Renewal token |
| `expiration_time` | timestamp | Date/time the access_token expires |
| `tenant_id` | bigint | FK to tenant |
| `row_created_timestamp` | timestamp | Audit: creation |
| `row_updated_timestamp` | timestamp | Audit: last update |

**`sv_outbound_api_log` table** (separate SVC schema):
Logs each outbound call to Podium with `url`, `call_type`, `request`, and `response`. Not accessible via the tests' DB connection (schema boundary).

### Error Handling

| Situation | API Response |
|----------|----------------|
| Nonexistent `accountPk` | HTTP 400 -- `"No primary customer found for this account."` |
| Expired token | The system renews automatically before calling Podium |
| Error in the Podium API | HTTP 5xx with an error message from Podium |

### Milestone

RU03.26.1.50.0 -- Task #442 (`uownSvcPodiumApiIntegration`)

---

## 48. RightFoot (ACH Bank Balance Verification) — R1.53.0

### What It Is

RightFoot is an external vendor for **bank balance verification (bank balance check)** for ACH payments, introduced in R1.53.0 (svc#540). Base URL `https://api.rightfoot.com` (the same in prod and sandbox).

### What It's For

To confirm that the customer's bank account has **sufficient funds before creating/retrying an ACH debit**, reducing NSF returns. A new ACH is only seeded when `exposure + requested_amount + buffer $100 <= balance` (buffer hardcoded in `DailyRerunACHCreate.sql:70`).

### Scope (When It Runs)

It applies to **ACTIVE accounts with ACH auto-pay in a delinquency window**. Both balance-check sweeps select `account_status='ACTIVE'`, `auto_pay_types LIKE '%ACH%'`, bank account with `auto_pay=true`, within the delinquency window. **There is no per-merchant or per-client-type flag** — the selection is purely account-state/delinquency-driven (via seeded SQL).

### Flow (3 Steps)

1. A **balance-check sweep** submits requests to RightFoot (`rightFootBalanceCheckService.submit`).
2. RightFoot responds via a **webhook** that completes the batch (`POST /uown/webhooks/rightfoot/batch-ready`).
3. The Spring event `RightFootBatchCompleteEvent` (listener **AFTER_COMMIT**) triggers `DailyRerunAchCreationService.createDailyRerunACHs(batchIds)`, which creates the `uown_sv_achpayment` rows.

### Sweeps

| Sweep | Seeded cron | process_type | Selection (summary) | Batch |
|-------|--------------|--------------|------------------|-------|
| `DailyAchBalanceCheckSweep` | `0 0 15 * * ?` (15:00 daily) | `DAILY_RERUN_DELINQUENT` | window `CURRENT_DATE-150 .. -15`, last SETTLED ACH per account, `LIMIT 5000` | 5000, 3-thread pool |
| `RerunAchBalanceCheckSweep` | `0 0 9 ? * THU` (Thu 09:00) | `RERUN` | `SCHEDULED` or `REQUEST` tied to a `SETTLEMENT` arrangement; `return_code IN (R01,R09)`; `status IN (RETURNED,REVERSED)`; `tries<2`; delinquency `<45d`; no previous RERUN | 500 (config), single-thread |
| `DailyRerunAchCreationService` | **not Quartz** — triggered by the batch-complete event + REST | — | SQL `DailyRerunACHCreate` | 1000, 4-thread pool, `username=SYSTEM` |

### ACH Gating (`DailyRerunACHCreate.sql`)

An ACH is only created when the corresponding balance check satisfies: `status='SUCCESS'`, `response_timestamp IS NOT NULL`, **same routing+account number** as the bank account, within the window, and `exposure + requested_amount + 100 <= balance`. The new `uown_sv_achpayment` carries the FK `right_foot_balance_check_pk` back to the approved balance check. **Duplicate guard**: no new `DAILY_RERUN_DELINQUENT` ACH is created if there is already one in-flight (`PENDING/PICKED_TO_SEND/STATUS_UPDATE_PENDING/SENT`) for the account.

### Webhook & Batch

- Inbound endpoint: `POST /uown/webhooks/rightfoot/batch-ready` (accepts JSON or text/plain) -> `RightFootWebhookService.handleWebhook`.
- `uown_right_foot_batch` stores `webhook_payload`, `errors`, `status`, `process_type`, `webhook_payload_received_at`, and `batch_complete_event_fired` (BOOLEAN default FALSE) — idempotency flag for the completion event.
- Admin triggers (`RightFootController`, `/uown/rightfoot`): `POST /uown/rightfoot/batch-result` (reprocesses 1 batch), `POST /uown/rightfoot/ach-payments/daily-rerun` (creates ACHs manually from a list of batchIds).

### Status & Failure

The only value confirmed in svc code: `uown_right_foot_balance_check.status = 'SUCCESS'` (the gate condition). The remaining `status`/`failure_reason` values and the webhook parser live in the `com.uownleasing:rightfoot:1.53.0` lib, which is **not available on disk** (not checked out, not in the Gradle cache). **[HYPOTHESIS]** — do not assume values beyond `SUCCESS`.

### Configurations

Prefix `com.uownleasing.svc.rightfoot.`, via `ConfigurationManagement`/Hazelcast — **not** present in `application.yaml`:

| Key | Default | Note |
|-------|---------|------------|
| `api.key` | prod empty / sandbox literal | **[SECURITY]** hardcoded sandbox fallback in `RightFootConfig.java:26-28` |
| `base.url` | `https://api.rightfoot.com` | |
| `webhook.url` | host + `/uown/webhooks/rightfoot/batch-ready` | |
| `balance.threshold` | 100 | no caller in svc — **[HYPOTHESIS]** consumed in the lib; the real buffer is a literal in the SQL |
| `balance.check.sweep.cron` | `0 0 8 ? * THU` | **[OBSERVATION]** diverges from the seeded cron (`0 0 15 * * ?`); getter has no caller in svc |
| `...RerunAchBalanceCheckSweep.batchSize` | 500 | |
| `...DailyRerunAchCreationService.interrupt` | false | kill-switch |

### Tables

- `uown_right_foot_balance_check` — `authorizer_unique_id` UNIQUE (`RFBC-{accountPk}-{snowflakeId}`), `account_pk`, `batch_id`, `routing_number`/`account_number`, `requested_amount` (= `next_payment_with_tax`, or the ACH `amount` in a SETTLEMENT arrangement), `balance`, `status`, `failure_reason`, `process_type`, `request/response_timestamp`.
- `uown_right_foot_batch` — `batch_id`, `status`, `webhook_payload`, `errors`, `process_type`, `batch_complete_event_fired`.
- `uown_right_foot_outbound_api_log` — outbound call log (endpoint, url, method, headers, request/response, http_status, stack_trace).
- `uown_sv_achpayment.right_foot_balance_check_pk` — FK from the ACH to the balance check.
- Cleanup: `CleanupService.deleteOldEntries(deletionCutOff)` purges old rows from the first two tables.

### Notes for the Team (R1.53.0)

- **[OBSERVATION]** Cron divergence between the default config and the seeded task (above).
- **[OBSERVATION]** Syntax artifact in `DailyAchBalanceCheckSweep.java:241` — `TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,\n,\n` contains a stray comma (`,\n,\n`) that would break the query if run verbatim. Confirm with the team.
- **[SECURITY]** Literal API key hardcoded as a sandbox fallback (`RightFootConfig.java:26-28`).

### Sources (svc R1.53.0)

`config/rightfoot/RightFootConfig.java` · `service/sweeps/rightfoot/{DailyAchBalanceCheckSweep,RerunAchBalanceCheckSweep,RightFootBalanceCheckMapper}.java` · `service/ach/DailyRerunAchCreationService.java` · `service/ach/listener/RightFootCompleteListener.java` · `rest/svc/{RightFootController,RightFootWebhookController}.java` · `service/BootstrapService.java` (~2275) · `resources/sqls/DailyRerunACHCreate.sql` · migrations `V20260612102430` / `V20260616122043` / `V20260619131000`. Lib `com.uownleasing:rightfoot:1.53.0` (internals not available on disk).

### Milestone

R1.53.0 — svc#540 (Implement rightfoot foundation), svc#540 (RerunAchBalanceCheckSweep), duplicate payment checks

---


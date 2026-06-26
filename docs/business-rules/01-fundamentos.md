---
title: Fundamentals and Overview
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-25
sources:
  - code: src/data/merchant-config-contract.ts#REQUIRED_MERCHANT_CONFIG
  - code: src/data/merchants.ts#MERCHANTS
  - code: src/pages/origination/programs.page.ts
  - code: src/pages/origination/program-details.page.ts
  - code: src/pages/origination/program-groups.page.ts
  - env: qa2
  - env: stg
covers: [business-model, merchant-types, programs, merchant-config, kornerstone, epo]
derived_from: [origination-programs-program-settings-groups, origination-merchant-detail-edit-page]
---

# Fundamentals and Overview
## UOwn Leasing - SVC Platform

Business overview, fundamental financial concepts, merchant programs, and configuration management.

---

## 1. Business Overview

### What UOwn Leasing Is

UOwn Leasing is a **lease-to-own** company. It positions itself between **merchants** and **customers (customers)**, allowing customers to purchase products in installments even without traditional credit.

### How the Business Model Works

1. **The merchant** registers on the platform and configures its financing programs (terms, rates, durations)
2. **The customer** goes to the merchant, chooses products, and applies for a lease
3. **UOwn** assesses the customer's risk (underwriting) and approves or denies
4. If approved, the customer **electronically signs** the lease contract
5. **UOwn pays the merchant** (funding) - the merchant receives the value of the products
6. **The customer makes periodic payments** to UOwn until the lease is paid off
7. **Early Purchase Option (EPO):** If the customer pays the original product value within 90 days, they pay off the lease without paying the full markup

### Operated Companies

| Company | Description |
|---------|-----------|
| **UOwn Leasing** | Main company. Templates, emails, portal with UOwn branding |
| **Kornerstone Living** | Subsidiary. Its own templates, portal at `kornerstoneliving.com`, distinct EPO rules with a formula based on moneyFactor |

### Merchant Types

| Type | Description | How state is determined |
|------|-----------|---------------------------|
| **ONLINE** | Merchant operates over the internet. Codes begin with "OL" or "ON" | Uses the **customer's** state for taxes and programs |
| **INSTORE** | Merchant operates in person | Uses the **merchant's** state for taxes and programs |

### Full Lifecycle Flow

```
ORIGINATION (LOS)
================
1. Customer applies on the merchant's site
2. 17-step pipeline validates the application
3. Underwriting assesses credit risk
4. If approved: customer receives a limit and payment options
5. Customer completes their data, chooses frequency, confirms items
6. Contract generated and sent for electronic signature
7. Customer signs -> Lead status = SIGNED
8. Funding: UOwn pays the merchant
9. Lead imported into the servicing system

SERVICING (SVC)
===============
10. Active account created with a receivables schedule
11. Payments collected automatically (ACH or CC)
12. If customer pays EPO within 90 days -> account paid off with a discount
13. If not -> payments continue until the end of the contract
14. End of contract -> account paid (PAID_OUT)
```

---

## 2. Fundamental Financial Concepts

### 2.1 Money Factor

**What it is:** The money factor is the multiplier that defines how much **extra** the customer will pay over the original product value across the lease. It is the equivalent of an interest rate in the leasing world.

**How it works:**
```
Contract Value = Base Cost x Money Factor x Term Months
```

**Practical example:**
- Product costs **$1,000**
- Money Factor = **0.15** per month
- Term = **12 months**
- Total contract value = $1,000 x 0.15 x 12 = **$1,800**
- The customer pays $1,800 for a $1,000 product (markup of $800)

**Where it is configured:** In the merchant's program (`ProgramInfo.moneyFactor`). Each program can have a different money factor, allowing different price levels for different risk segments or product categories.

**Impact on EPO:** The money factor is also used inversely to calculate how much of the customer's payments went toward "principal" (product cost) vs "lease charge" (UOwn's profit). In the Kornerstone formula: `amountPaidForEPO = totalPayments / moneyFactor`.

### 2.2 Security Deposit

**What it is:** A small amount (e.g. $40) charged to the customer **before** signing the lease. It is NOT an additional cost -- it is credited against the customer's last payment.

**What it is for:** It works as a guarantee of the customer's commitment and as initial risk coverage for UOwn.

**Where the value comes from:** The security deposit value is configured **per state** in the `securityDeposit` field of the `state_configurations` table. This is a **separate** field from `processingFee` in the same table. It can be queried via `GET /getAllStateConfigurations` or `POST /getStateConfigurationsByState/{state}` -- the field appears as `securityDeposit` inside `stateConfigurationsInfo`.

**When it is charged (logic in `CalculatorService.getSecurityDepositForLead`):**

1. **Condition 1 (holdDeposit):** Merchant has `holdDeposit = true` AND the state has `securityDeposit` configured (not null)
2. **Condition 2 (checkUwForVerification):** Merchant has `checkUwForVerification = true` AND Underwriting flagged `chargeProcessingFee = true` in UWData AND the state has `securityDeposit` configured (not null)
3. **Exclusion:** If the program has `processingFeeOverride > 0` or `amountChargedAtSigning > 0`, the security deposit is NOT charged (returns $0)

**Pre-signing charge hierarchy (logic in `CalculatorService.getFeeToBeChargedForLead`):**

The system determines ONE single fee to charge before e-sign, in this priority order:
1. `amountChargedAtSigning` from the program (if > 0)
2. `processingFee` from the state (if the merchant has chargeProcessingFee enabled)
3. `securityDeposit` from the state (fallback if the two above are $0)

**Impact on the contract:** The deposit appears in the lease document ("You have agreed to give us a Security Deposit in the amount of...") and is applied as a credit on the last payment (`lastPaymentNoTaxWithFees = lastPaymentNoTaxNoFees - securityDeposit`).

### 2.3 Processing Fee

**What it is:** A fee charged by UOwn for processing the lease.

**How it is determined (priority order):**
1. If the merchant has `chargeProcessingFee = false` -> $0
2. If the program has `amountChargedAtSigning > 0` -> $0
3. If the program has `processingFeeOverride > 0` -> use that value
4. Value configured in StateConfigurations for the state
5. Fallback: $0

**Impact:** Generates a separate receivable of type `PROCESSING_FEE` on the account.

### 2.4 Buyout Fee

**What it is:** A fixed fee charged to the customer if they exercise the early purchase option (EPO).

**Where it is configured:** On the merchant (`MerchantInfo.buyoutFee`, default: $0).

**Impact:** Added to the EPO amount. NO tax applies to the buyout fee (tax is calculated only on the product cost).


## 3. Merchant Programs (Lease Terms)

### What a Program Is

A **Merchant Program** is the financial template that defines the terms of a lease. Each merchant can have multiple active programs, and the system selects the appropriate program based on the customer's state, cart value, and category.

### Main Program Fields

| Field | Description | Example |
|-------|-----------|---------|
| `programName` | Human-readable program name | "Furniture 13 months" |
| `programType` | SAME_AS_CASH or QUICK_PAY | SAME_AS_CASH |
| `termMonths` | Lease duration in months | 13 |
| `moneyFactor` | Monthly cost multiplier | 0.15 |
| `epoDays` | Early purchase window (days) | 90 |
| `epoFeePercent` | % fee on EPO | 0.05 |
| `dealerDiscount` | % retained from the amount paid to the merchant | 5% |
| `dealerRebate` | % returned to the merchant as an incentive | 2% |
| `maxDollarAmount` | Maximum lease value | $5,000 |
| `minCartAmount` / `maxCartAmount` | Cart value range | $200 - $3,000 |
| `processingFeeOverride` | Processing fee override | $49.99 |
| `states` | States where the program is valid | "CA,TX,NY,FL" |

### SAME_AS_CASH vs QUICK_PAY

| Aspect | SAME_AS_CASH | QUICK_PAY |
|---------|-------------|-----------|
| **Concept** | If you pay everything within 90 days, you pay the "cash" price | Pay a fixed percentage of the original price |
| **EPO** | Yes, based on the original cost | Yes, based on `quickPayPct` |
| **Money Factor** | Used to compute the full contract | Can use an alternative percentage |
| **Typical use** | Default program for most merchants | Simplified promotional program |

### How the Program Is Selected

1. Customer applies at a merchant
2. System identifies the state (the customer's if ONLINE, the merchant's if INSTORE)
3. Filters the merchant's programs by: state, type (`SAME_AS_CASH`), cart value range, category
4. If multiple valid programs exist, the selection takes the underwriting result into account (segment/risk)

### Program Routing by Flow (Task #439)

After underwriting, the system evaluates **routing inputs** to decide the flow and program:

| Input | Description |
|-------|-----------|
| Banking data | Presence of routing number + account number |
| Eligible BIN | The first 6 digits of the credit card meet eligibility criteria |

**Flows:**

| Condition | Flow | Program evaluation |
|----------|-------|----------------------|
| Banking data present **AND** eligible BIN | Kornerstone | 16 months first → fallback 13 months |
| Banking data absent **OR** BIN not eligible | UOWN | 13 months only |

**Important:** Programs are **pre-defined** in the merchant's setup. Underwriting **selects** among the available ones — it does not build programs dynamically.

### Identification by planId (Task #439)

Each combination of frequency + term is identified by a `planId`:

**Format:** `{frequency_abbreviation}{term_months}`

| Frequency | Abbreviation | Example |
|------------|------------|---------|
| WEEKLY | WK | WK13, WK16 |
| BI_WEEKLY | BWK | BWK13, BWK16 |
| SEMI_MONTHLY | SM | SM13, SM16 |
| MONTHLY | MN | MN13, MN16 |

The `planId` is used in: `SchedSummaryInfo`, redirect URL, the `missing-fields` endpoint, and `SubmitApplicationService`.

### Minimum Lease Amount

**What it is:** The minimum value a lease needs to have to be accepted by the system. It protects against very low-value leases that are not economically viable.

**Default value:** `$250.00 USD` (`minimumLeaseAmount` field in `MerchantInfo`, default `new BigDecimal("250")`).

**Per-merchant configuration:** Each merchant can configure a different minimum value, above or equal to the default. The field is editable in the merchant's configuration.

**Where it is validated:** In `LosRequestMessageConstraintValidator.validateMinimumLeaseValue()`, called at two points:

| Endpoint | When it validates |
|----------|--------------|
| `sendApplication` | When processing an invoice within the application (`validateInvoiceDetails`) |
| `sendInvoice` | When receiving a new invoice for an existing lead (`validateInvoiceInformation`) |

**What is compared:** The system compares the `merchandiseSubtotal` (merchandise value, without taxes/fees) against the merchant's `minimumLeaseAmount`.

**Validation rule:**
```
IF merchandiseSubtotal < merchant's minimumLeaseAmount:
  REJECT with error: "The merchandise amount requested, {value}, is less than the minimum lease amount, {minimum}."
```

**Activation control:** Configurable via `verifyMinimumLeaseValue` -- if disabled, the validation is skipped.

**Important scenarios:**
- Value $249.99 in a merchant with a $250 minimum → **rejected**
- Value $250.00 in a merchant with a $250 minimum → **accepted**
- Cancelled invoice + new invoice below the minimum → **rejected** (each invoice is validated independently)
- Merchant with a custom $500 minimum → validates against $500, not $250

---

## 33. Configuration Management and Feature Activation

### What It Is

The system has a dynamic configuration layer built on Spring Cloud Context and Hazelcast, allowing configurations to be changed in **real time without restarting** the server.

### What It Is For

It lets administrators enable/disable features, adjust thresholds, modify sweep behavior, and control features without needing to deploy or restart the application.

### Configuration Architecture

**Main file:** `ConfigurationManagement.java`
- Type-safe retrieval of configurations (String, Integer, Long, Double, Boolean)
- Support for dual defaults (production vs. test)
- Distributed storage via Hazelcast IMap
- Cache with `@RefreshScope` for hot-reload

### How to Change Configurations in Real Time

#### Via REST API (Recommended)

| Endpoint | Method | Description |
|----------|--------|-----------|
| `POST /ConfigurationManagement/createOrUpdateConfig` | POST | Creates or updates a configuration. Body: `{"key": "key", "value": "value"}` |
| `GET /ConfigurationManagement/forceReloadConfig` | GET | Forces a reload of ALL configurations, clears the cache, and re-injects fields |

**Example usage:**
```
POST /ConfigurationManagement/createOrUpdateConfig
Content-Type: application/json
{"key": "sendCCPeek", "value": "true"}
```

#### Via Database

Change directly in the configurations table and then call `/forceReloadConfig`.

### Configuration Naming Pattern

Most follow the pattern:
```
com.uownleasing.svc.service.{ServiceName}.{configKey}
```

**Real examples:**
- `com.uownleasing.svc.service.RewindPaymentsService.statuses.to.active.for.rewind`
- `com.uownleasing.svc.service.MissingRequiredFieldsService.items.can.be.empty.for.merchant.*`
- `com.uownleasing.svc.service.Five9Service.updateContactPreferences`
- `sendCCPeek` (controls CC Peek)
- `ccPeekOn` (globally toggles CC Peek on/off)
- `no.business.in.state` (blocked states)
- `useTaxCloudApi` (choice between TaxCloud and TaxJar)
- `cancel.protection.plan` (enables protection plan cancellation)
- `create.nsf.fee.receivable.on.rerun` (creates NSF fee on rerun)

### Hazelcast Distributed Maps

The system keeps three distributed in-memory maps for concurrency control:

| Map | Key | Use |
|------|-------|-----|
| **Application Request** | SSN -> UUID | Prevents simultaneous duplicate applications |
| **Settlement Request** | leadPk -> UUID | Prevents duplicate settlement offers |
| **Authorization Request** | leadPk -> UUID | Prevents duplicate invoice authorizations |

**Map management endpoints (Admin):**
- `GET /uown/clearApplicationRequestMap` - Clears the application map
- `GET /uown/clearSettlementRequestMap` - Clears the settlements map
- `GET /uown/clearAuthorizationRequestMap` - Clears the authorizations map

### Scheduled Tasks (Sweeps) Management

| Endpoint | Method | Description |
|----------|--------|-----------|
| `POST /uown/svc/triggerScheduledTask/{taskName}` | POST | **Triggers** a sweep manually now |
| `POST /uown/svc/pauseScheduledTask/{taskName}` | POST | **Pauses** a sweep (does not run again until resumed) |
| `POST /uown/svc/resumeScheduledTask/{taskName}` | POST | **Resumes** a paused sweep |
| `POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger={cron}` | POST | **Reschedules** with a new cron |
| `POST /uown/svc/deleteScheduledTask/{taskName}` | POST | **Deletes** a sweep |
| `GET /uown/svc/getAllScheduledTasks` | GET | Lists all sweeps with status |
| `GET /uown/svc/getScheduledTaskByName/{name}` | GET | Details of a specific sweep |
| `POST /uown/svc/updateScheduleTaskSqlByName/{name}` | POST | **Updates the SQL** of the sweep (multipart file) |

### Via Database (Table `uown_scheduled_task`)

| Field | Description |
|-------|-----------|
| `scheduled_task_name` | Identifier name of the sweep |
| `cron_trigger` | Cron scheduling expression |
| `sql_to_pick_accounts` | SQL that selects accounts to process |
| `is_active` | `true` = active, `false` = paused |
| `template_name` | DMS template to run |
| `last_trigger_time` | Last run (audit) |

**To pause a sweep via the database:**
```sql
UPDATE uown_scheduled_task SET is_active = false WHERE scheduled_task_name = 'sweepName';
```

**To change a sweep's SQL:**
```sql
UPDATE uown_scheduled_task SET sql_to_pick_accounts = 'SELECT ...' WHERE scheduled_task_name = 'sweepName';
```

### How to Verify Whether a Sweep Ran

**Logs table:** `uown_sweep_logs`

```sql
SELECT * FROM uown_sweep_logs
WHERE sweep_name = 'sweepName'
ORDER BY created_date DESC
LIMIT 10;
```

Shows: run date, pod hostname, number of records processed, errors.

---

## Geographic Coverage

### Supported States and Territories

The platform accepts applications from **57 locations** — 50 US states + 7 territories:

| Category | Locations |
|-----------|-------------|
| **50 States** | AK, AL, AR, AZ, CA, CO, CT, DC, DE, FL, GA, HI, IA, ID, IL, IN, KS, KY, LA, MA, MD, ME, MI, MN, MO, MS, MT, NC, ND, NE, NH, NJ, NM, NV, NY, OH, OK, OR, PA, RI, SC, SD, TN, TX, UT, VA, VT, WA, WI, WV, WY |
| **7 Territories** | AS (American Samoa), GU (Guam), MP (Northern Mariana Islands), PR (Puerto Rico), UM (US Minor Outlying Islands), VI (Virgin Islands) |

### Blocked States (No Business)

Configured via `no.business.in.state` (defaults: NJ, VT, MN, ME). See the origination section for details on Step 1 of the pipeline.

### Contacts by Brand

| Brand | Support Email | Support Hours |
|-------|-----------------|------------------------|
| **UOWN** | help@uownleasing.com | Mon-Sat 9am-10pm ET; Sun 11am-9pm ET |
| **Kornerstone** | support@kornerstoneliving.com | Mon-Sat 8am-12am ET; Sun 11am-11pm ET |

---

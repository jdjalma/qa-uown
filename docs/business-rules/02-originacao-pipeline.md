---
title: Origination and Application Pipeline
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/config/constants.ts#generateTestSSN
  - db: uown_los_lead
  - db: uown_los_uw_info
  - svc-source: service/LeadRiskService.java
  - svc-source: analytics/service/CustomerEventService.java
  - env: qa2
covers: [pipeline, underwriting, fraud-vendors, neuroid, kount, state-check, geolocation, customer-journey, segment-limits]
---

# Origination and Application Pipeline
## UOwn Leasing - SVC Platform

17-step pipeline, fraud verification, underwriting, pre-signing validation, approved amounts, continuation/finalization, address verification, and geolocation.

---

## 4. Application Pipeline (17 Steps)

### Overview

When a customer submits an application, it goes through a **sequential pipeline of 17 steps**. If any step returns `DECLINED`, the pipeline **stops immediately** -- subsequent steps do not run.

### Concurrency Control

The system keeps a `ConcurrentHashMap` indexed by SSN. If an application is already in progress for the same SSN, it returns the error `"Application already in progress"`. The SSN is removed from the map in a `finally` block.

### Order Configurable by Client Type

The order of the steps is configurable per merchant type via:
```
application.steps.{ClientType} = "stateCheck, merchantAutoDenyCheck, ..."
```

This allows specific merchants to skip or reorder steps according to business needs.

### Individual Toggles per Step

Each step can be enabled/disabled individually via configuration:

| Config | Step | Default |
|--------|------|---------|
| `check.valid.states` | State Check | true |
| `check.black.list` | Blacklist Check | true |
| `check.for.previous.denied.uw` | Previous UW Denied | true |
| `check.for.previous.signed` | Future FPD Check | true |
| `check.duplicate.info` | Duplicate Check | true |
| `check.previous.leads.for.delinquency` | Eligible for Reapproval | true |
| `check.neuroid.on.send.application` | NeuroID Check | true |

### Step 1: State Check

**What it is:** Checks whether UOwn operates in the customer's state and whether lease programs are available in that state.

**What it's for:** Regulatory compliance -- some states prohibit or restrict lease-to-own operations.

**How it works for the internal user:** Configurable via `no.business.in.state` (default: NJ, VT, MN, ME). Admins can add/remove blocked states without a deploy.

**How it affects the customer:** The customer receives the message "We do not offer leasing in {state}".

**Result if denied:** Status `DENIED`, internal `NO_BUSINESS_IN_STATE` or `NO_PROGRAM_IN_STATE`. No denial email.

### Step 2: Merchant Auto Deny

**What it is:** Checks whether the merchant has been flagged to automatically deny all applications.

**What it's for:** Used when a merchant is suspended, deactivated, or under fraud investigation. It allows blocking new applications without fully deactivating the merchant.

**How it works for the internal user:** An admin enables the flag `autoDenyApplication = TRUE` in the merchant record.

**How it affects the customer:** The customer receives a generic "Denied". No denial email.

**Result:** Status `DENIED`, internal `MERCHANT_AUTO_DENIED`.

### Step 3: Source Check (Traffic Source Verification)

**What it is:** **Probabilistic** denial based on the customer's traffic source/channel. Certain traffic categories have configured denial rates.

**What it's for:** Traffic quality control. If a specific marketing campaign generates a lot of fraud, the denial rate can be increased without shutting down the entire campaign.

**How it works:** Generates a random number and compares it against the category's denial rate. E.g., category "111706798993" has an 80% denial rate -- 8 out of every 10 applications from that source are denied.

**Applies only to:** Merchants of type `BUY_ON_TRUST` (configurable).

**Result if denied:** Status `DENIED`, internal `SOURCE_INELIGIBLE`. No denial email.

### Step 4: Blacklist Check

**What it is:** Checks whether the customer's personal data matches any entry in the fraud blacklist.

**What it's for:** Fraud prevention. Customers previously identified as fraudsters are prevented from applying again.

**Fields checked:** First name, last name, email, mobile phone, SSN, ZIP code, bank account number, routing number, address.

**How it works for the internal user:** Agents can add/remove blacklist entries via the Admin Panel. They can also blacklist an entire lead (all data at once).

**How it affects the customer:** The customer receives "Fraud check failed". **No denial email** (so as not to alert fraudsters).

**Result:** Status `DENIED`, internal `BLACKLIST_DENIED`.

### Step 5: Data Mismatch Check

**What it is:** Compares the current application's data with data from the same customer's previous applications. Detects suspicious changes of name, address, etc.

**What it's for:** Impersonation fraud -- someone using another person's SSN may change name/address to receive the merchandise.

**Triggered by:** Specific merchant codes or a flag by `clientName`.

**Result if mismatch:** Status `DENIED`, **denial email sent**.

### Step 6: Previous Leads (Previous Lead Lookup)

**What it is:** Looks up and cancels the same customer's previous leads, calculating how much of the approval has already been consumed.

**What it's for:** Ensures a customer does not have multiple active leads and calculates the remaining credit.

**IMPORTANT:** This step **NEVER denies**. It is purely data collection.

**Effects:** Previous leads are cancelled. `consumedApprovalAmount` is calculated for use in later steps.

### Step 7: Previous UW Denied

**What it is:** Checks whether the customer has been previously denied by underwriting.

**What it's for:** Avoids unnecessary reprocessing -- if the customer was denied recently, there's no point in running UW again (unless there's an override).

**Result if denied:** Status `UW_DENIED`, **denial email sent**.

### Step 8: Future FPD Check (Signed Lease with Future Payment)

**What it is:** Prevents a new application if the customer has a signed lease whose first payment date (FPD) is still in the future.

**What it's for:** Prevents the customer from obtaining multiple leases simultaneously before the first one starts generating payments.

**Denial conditions (ALL must be true):**
- Previous lead with status `SIGNED`
- `accountPk` is null (not yet converted to an account)
- `firstPaymentDueDate` is later than today

**Result:** Status `DENIED`, internal `SIGNED_FPD_IN_FUTURE`. No email.

### Step 9: Duplicate Check

**What it is:** Checks whether the customer has multiple applications using the same email, phone, or banking data.

**What it's for:** Prevents abuse -- the same individual trying to obtain multiple leases using contact variants.

| Check | Default Limit | What happens |
|-------------|---------------|----------------|
| Duplicate emails | 3 uses | `EMAIL_COUNT_FAILED` |
| Duplicate phones | 3 uses | `PHONE_COUNT_FAILED` |
| Duplicate accounts by email | Via service | `{status}_DUP_EMAIL` |
| Duplicate accounts by phone | Via service | `{status}_DUP_PHONE` |
| Duplicate accounts by bank | Via service | `{status}_DUP_BANK_INFO` |

### Step 10: Eligible for Reapproval

**What it is:** Checks whether a customer who already has existing accounts is delinquent on them.

**What it's for:** Prevents delinquent customers from obtaining new leases.

**How it works:** If the customer has existing accounts, it checks whether any is past due. If so, it denies with "Ineligible for re-approval".

### Step 11: NeuroID Check (Behavioral Biometrics)

**What it is:** Analyzes **how** the customer filled out the form (typing speed, mouse movements, copy/paste patterns, hesitations). Described in detail in section 5.

### Step 12: Underwriting (Credit Analysis)

Described in detail in section 6.

### Step 13: Invoice Placeholder

**What it is:** For specific merchants (e.g., `SYNCHRONY`), creates an invoice using the approval amount as the order total.

**What it's for:** Some merchants do not send an invoice in advance. The system creates a placeholder so that the calculation can proceed.

### Step 14: Calculate Max Approval

**What it is:** Calculates the maximum approval amount, accounting for credit already consumed in previous leads.

**Result if <= 0:** Denied with "No credit remaining", internal `NO_REMAINING_AMOUNT`.

### Step 15: Compare Cost Check (Cost vs Approval Comparison)

**What it is:** Compares the cart cost against the approval amount.

| Scenario | Result |
|---------|-----------|
| Cost <= approval | Passes |
| Cost > approval, eligible for item split | Passes with a flag for split |
| Exempt client type (PAY_TOMORROW, TIRE_AGENT, PAY_POSSIBLE) | Passes without check |
| Cost > approval, no split | Denied, but the customer receives an approval notification |

### Step 16: Item Split (Cart Split)

Described in detail in section 31.

### Step 17: Calculator (Payment Calculator)

Described in detail in section 7.

---

## 5. Fraud and Identity Verification System

### Overview of the Defense Strategy

UOwn uses a **layered defense** strategy with multiple third-party services, each verifying a different angle. No single service decides on its own -- the combination of results forms the final decision.

### 5.1 Sentilink (Synthetic Identity Detection)

**What it is:** A service specialized in detecting **synthetic identities** (fabricated identities mixing real and fake data from different people) and **identity theft** (use of another real person's data).

**What it's for:** Synthetic identity fraud is the fastest-growing type of financial fraud. Synthetic identities can pass traditional credit checks because they build real history over time. Sentilink detects what credit bureaus cannot.

**When it runs:** First step of the UW engine -- if the identity is fake, there's no point in running the remaining checks.

**Data sent:** First name, last name, date of birth, SSN, email, phone, full address.

**Three scores analyzed:**
- **Synthetic Score** -- probability that the identity is fabricated
- **Identity Theft Score** -- probability of impersonation
- **Abuse Score** -- probability of first-party fraud (applying with one's own data but intent to default)

**Configuration:** Thresholds are **per merchant** -- different merchants tolerate different levels of risk. Previous results can be reused within a configurable window of days.

**Possible results:** APPROVE, DECLINE (score above the threshold), SSN_TYPO (SSN appears manipulated), ERROR.

### 5.2 Neustar (Contact Data Verification)

**What it is:** A data intelligence platform that cross-references the customer's phone, email, address, and name against massive telecom and consumer data bases.

**What it's for:** Fraudsters cannot assemble a perfectly consistent set of contact data. The phone may be prepaid, the address may not match the carrier's records, or the email may have been created days earlier. Neustar detects these inconsistencies.

**When it runs:** Second step of the UW engine.

**Checks performed (each one can deny independently):**
- Phone does not match the name
- Address does not match the phone
- Email does not match the phone
- Email does not match the name
- Phone is prepaid/burner
- Phone tenure too short
- Phone usage too low (2 months)
- Suspicious recent name change
- Invalid or very new email
- Invalid address (USPS), vacant, or a prison address
- DPV (Delivery Point Validation) validation failure

**Configuration:** Each check can be enabled/disabled per merchant. Thresholds per merchant.

### 5.3 LexisNexis (Identity Risk and Public Records)

**What it is:** A risk-scoring service based on public records, court records, property records, and credit data.

**What it's for:** Adds a layer that neither Sentilink nor Neustar covers: deep public-records analysis. Detects whether an SSN was issued recently (possibly to a minor), whether the applicant has a fraud history in court records, or whether multiple applications come from addresses linked to known fraud.

**When it runs:** Third step of the UW engine.

**Possible results:** PASS (score below the threshold), FAIL -> `LEXISNEXIS_DENIED`, ERROR.

### 5.4 SEON (Digital Fraud Engine)

**What it is:** A fraud engine that analyzes the applicant's **digital footprint** -- email, phone, IP, and device fingerprint.

**What it's for:** Captures the "digital layer" of fraud. A fraudster may have assembled a convincing identity on paper, but their digital behavior betrays them: using a VPN from another country, a temporary email created the same day, a VoIP phone, or no social-media presence.

**When it runs:** Fourth and final step of the UW engine -- it acts as the final safety net.

**What it analyzes:**
- **Email:** Linked to social networks? Age? Disposable provider? Fraud score?
- **Phone:** Real? Linked to social networks? VoIP number?
- **IP:** VPN, proxy, or Tor? Geolocation? Data-center IP?
- **Device fingerprint:** Device/browser behavior

**Four independent scores:** Email, IP, phone, and an overall fraud score, each with a threshold **per merchant**.

### 5.5 NeuroID (Behavioral Biometrics)

**What it is:** Analyzes **how** the applicant fills out the application form, not **what** they type.

**What it's for:** An innovation in fraud detection. A fraudster may have the perfect stolen identity with matching documents, but cannot replicate the behavioral patterns of the real person. Someone typing their own name and SSN from memory behaves fundamentally differently from someone reading it off a screen or pasting it from a database.

**What it monitors:**
- Typing speed and rhythm
- Mouse movement patterns
- Hesitation patterns (pausing before typing the SSN, as if reading it from somewhere)
- Copy/paste behavior
- Device interaction patterns

**When it runs:** The JavaScript SDK collects data during form completion. The check is queried during submission.

**Possible results:** APPROVE, DECLINE, PROFILE_NOT_FOUND (JS disabled), ERROR, **`NOT_ENOUGH_INTERACTION_DATA`** (new in R1.53.0).

**R1.53.0 — `NOT_ENOUGH_INTERACTION_DATA` (NeuroID without enough data):**
- Treated as a **non-blocking pass-through**: `success=true`, the fraud rules keep running; the customer is only blocked if other fraud signals fire. Together with `PROFILE_NOT_FOUND`, it can trigger the config path "approve on profile not found".
- **Simulation toggle** (for testing): config `com.uownleasing.svc.service.NeuroIdVerificationService.simulate.not.enough.interaction.data` (default `false`) — when `true`, svc overrides the real status to `NOT_ENOUGH_INTERACTION_DATA` with `success=true`.
- **[ATTENTION — drift]** The "prevent repeated NeuroID calls" guard (skip-on-prior-approval / returning-to-sign, `preventRepeatedNeuroIdCallsSigningRetry`) **is NOT merged in R1.53.0** — it lives in the unmerged `R1.53.0_neuro_id` branch (with a revert). The current `NeuroIdCheckStep`/`NeuroIdVerificationStep` steps do **not** have a repeated-call guard. Confirm against the deployed env before writing tests that assume a skip.
- **Sources:** `service/application/submitApp/NeuroIdVerificationService.java:58,130,147-156`, `enumeration/NeuroIdStatus.java`.

### 5.6 Intellicheck (Identity Document Authentication)

**What it is:** An identity-document authentication service that reads the **barcode** on the back of driver's licenses and IDs.

**What it's for:** Fraudsters can create visually convincing IDs, but getting the barcode encoding right in the exact pattern of the issuing state is extremely difficult. Intellicheck detects forged, altered, and counterfeit documents.

**How the customer uses it:** During application submission, the customer photographs the front and back of their driver's license. The images are sent to Intellicheck.

**What it verifies:**
- Barcode data is consistent with the front of the document
- Document format matches the issuing state's standard
- Document is not expired
- No signs of tampering

**Additional verification:** After Intellicheck, the system performs **fuzzy name matching** between the name on the document and the name on the application, and optionally verifies date of birth.

### 5.7 SEON ID (ID Verification via SEON)

**What it is:** An alternative to Intellicheck. The customer photographs their ID, and SEON extracts data and verifies the match.

**Checks:** Does the name match? Does the state match? Does the ZIP code match? Does the date of birth match?

**Configuration:** The merchant chooses between Intellicheck or SEON ID via the flags `isIntellicheckRequired` and `isSeonIdCheckRequired`.

### 5.8 Kount (Credit Card Fraud)

**What it is:** A fraud-detection service for credit card transactions. It assesses risk **before** charging the card.

**What it's for:** Even after approving the application, UOwn needs to ensure the card used for payment is not stolen. Kount prevents chargebacks and payment fraud.

**When it runs:** At the moment of **payment** (not during the application). For both new leads and existing accounts.

**What it analyzes:**
- Card BIN (first 6 digits) and last 4
- Device session (fingerprint via the JavaScript SDK)
- Payer IP
- Cardholder's name, address, email, and date of birth
- Transaction amount and details

**Possible results:** APPROVE (low risk), DECLINE (high risk), ERROR.

**Smart cache:** Checks whether there is already a recent decision for the same person + card. If so, it reuses it without a new API call.

### 5.9 Plaid (Banking and Income Verification)

**What it is:** A service that connects directly to the customer's **bank account** (with their permission) to verify ownership, income, and financial health.

**What it's for:** Traditional credit checks miss many customers with limited credit (thin-file). Plaid provides alternative data based on real bank transactions to determine ability to pay.

**When it runs:** **Conditionally** -- only when:
1. The merchant has enabled Plaid (`isPlaidVerificationRequired`)
2. Underwriting placed the lead in a "lambda segment" within a configured range
3. The lead status is `UW_REVIEW` (uncertain underwriting)

In other words, Plaid is a **second-chance mechanism** for applicants in the gray zone.

**How the customer uses it:**
1. Receives a link to connect their bank via the Plaid widget
2. Authenticates with their banking credentials
3. Plaid analyzes 180 days of banking history

**Possible results:** PLAID_SUCCESS (approved via bank), PLAID_FAILED (denied), PLAID_ABANDONED (customer gave up), PLAID_ERROR.

### Full Execution Order

```
FORM COMPLETION
  -> NeuroID silently collects behavioral biometrics

ID UPLOAD
  -> Intellicheck OR SEON ID authenticates the document

SUBMISSION (UW Engine)
  1. Sentilink -> Synthetic/stolen identity?
  2. Neustar   -> Contact data consistent?
  3. LexisNexis -> Red flags in public records?
  4. SEON Fraud -> Does the digital footprint indicate fraud?

CREDIT DECISION
  -> If the engine passes: runs BlackBox (credit model)
  -> If BlackBox is uncertain: Plaid as a second chance

PAYMENT
  -> Kount pre-authorizes the card transaction
```


## 6. Underwriting (Credit Analysis)

### What Underwriting Is

After the fraud checks pass, the system evaluates the customer's **creditworthiness**. Three decision engines are available:

| Engine | Description | Priority |
|--------|-----------|------------|
| **GDS** | External decision engine | 1 (if enabled) |
| **Taktile** | Alternative decision engine | 2 (if enabled) |
| **ABB** | Default decision engine (BlackBox) | Default |

### Decision to Run vs Reuse UW

| Condition | Action |
|----------|------|
| Lead status: NEW, EXPIRED, PENDING_UW, UW_DENIED, UW_ERROR | Run a new UW |
| UW data does not exist | Run a new UW |
| Approval expired | Run a new UW |
| Otherwise | Reuse the previous UW |

### Skip UW (Bypass for Specific Merchants)

Some merchants can skip UW entirely. Conditions (ALL must be true):
- `clientType` in the skip-UW list
- Threshold check not required OR the lead meets the threshold
- Score check not required OR the lead has a score

Skip result: `decision = "ACCEPT"`, `creditLimit = loanAmount`.

### Approval Expiration

`approvalExpirationDate = today + merchant.numDaysApprovalExp days`

### Flag isEligibleForExtraInfo — Migration V20260313160247

A field added to `Uwdata` (table `uown_los_uwdata`) by Flyway migration V20260313160247. It indicates whether the lead is eligible to collect additional information after the UW decision (e.g., extra data required by certain merchants or programs before proceeding to the contract).

| Field | Type | Description |
|-------|------|-----------|
| `is_eligible_for_extra_info` | BOOLEAN | `true` when the flow requires an additional post-UW data collection step |

**Impact:** Checked by the frontend (origination) and by the `canContinueApplication` logic to determine whether there is an extra step before contract generation.

### Field internal_decision — Migration V20260212152410

A field added to the `uown_los_uw_info` table to separate the **internal decision** of the UW engine from the lead's **public status**.

| Field | Description |
|-------|-----------|
| `uw_status` (existing) | The lead's public status after UW (e.g., `UW_APPROVED`, `UW_DENIED`) |
| `internal_decision` (new) | The raw decision returned by the UW engine before any business adjustment |

**Why separate them:** The internal decision may differ from the public status when business rules (e.g., approval override, skip UW) modify the result after the engine decides. Preserving `internal_decision` ensures traceability and auditability.

### Program Selection and Routing (13 vs 16 Months) — Task #439

After the credit decision, underwriting evaluates **routing inputs** to determine which flow and program to use:

**Routing Inputs:**
1. Presence of banking data (routing number + account number)
2. Eligibility of the credit card BIN (first 6 digits)

**Routing Scenarios:**

| Scenario | Condition | Flow | Program |
|---------|----------|-------|----------|
| 1 | Banking data present **AND** BIN eligible | **Kornerstone** | Evaluates 16 months first, falls back to 13 months |
| 2 | Banking data absent **OR** BIN not eligible | **UOWN** | 13 months only |

**Important rules:**
- Programs are **pre-defined** — underwriting **selects**, it does not build them
- In the Kornerstone scenario, if the 16-month program does not meet the criteria (amount, state, etc.), it automatically falls back to 13 months
- Program selection uses `planId` (new format) to uniquely identify the frequency + term combination
- The `planId` is composed of: frequency abbreviation + term in months (e.g., `WK13`, `BWK16`, `SM13`, `MN16`)

**planId Format:**

| Frequency | Abbreviation | Example 13m | Example 16m |
|------------|------------|-------------|-------------|
| WEEKLY | WK | WK13 | WK16 |
| BI_WEEKLY | BWK | BWK13 | BWK16 |
| SEMI_MONTHLY | SM | SM13 | SM16 |
| MONTHLY | MN | MN13 | MN16 |

**Backend impact:**
- `planId` added to `SchedSummaryInfo`
- `setMerchantProgramForLead` removed from `UnderwritingService` (programs pre-selected)
- `buildScheduleForFrequency` now generates `planId` = frequency + term
- `SubmitApplicationService` uses `planId` to locate the correct `PaymentOption`
- Redirect URL updated to include `planId`

**Frontend impact (Task #1242 — Term Month Column):**
- "Term Month" column added to the Overview and Leads tables in the Origination portal
- Data source: `uown_los_sched_summary.term_in_months` via LEFT JOIN with `uown_los_lead`
- The value displays the term **selected** by the customer (13 or 16), not all eligible terms
- Leads without a completed `submitApplication` have no record in `sched_summary` — the column displays empty
- The `sched_summary` record is created during `submitApplication` when the `planId` is provided
- Prerequisite: `getMissingFields(shortCode, planId)` must be called before `submitApplication` to set `merchantProgramPk` on the lead
- `SubmitApplicationResponseBody` includes the `termInMonths` field (e.g., 13 or 16) confirming the selected term

**Backend limitation — missing configuration for 16 months with non-monthly frequencies:**
- `getNumberOfPayments(16, WEEKLY)` / `getNumberOfPayments(16, BI_WEEKLY)` / `getNumberOfPayments(16, SEMI_MONTHLY)` throw `SvcException` because the configurations `number.of.payments.16.WEEKLY`, `number.of.payments.16.BI_WEEKLY`, and `number.of.payments.16.SEMI_MONTHLY` do not exist in the backend
- `getNumberOfPayments(16, MONTHLY)` uses the fallback `return numberOfMonths = 16` (no configuration lookup) and **works correctly**
- **Impact on tests:** To create a lead with `term_in_months=16` in environments with this limitation (e.g., qa1), call `sendInvoice` with `selectedPaymentFrequency='MONTHLY'` — this generates `planId=MN16` without triggering the exception
- **Additional prerequisites for qa1 (non-Kornerstone merchants):** in addition to `selectedPaymentFrequency='MONTHLY'`, a DB patch is required before `sendInvoice`: `eligible_terms='16'` in the `uown_los_uwdata` table and `merchant_program_pk=207` in the `uown_los_lead` table
- This limitation **does not exist in production**, where the Kornerstone merchant has all programs configured natively

### Peak/Off-Peak Campaigns

In production, between `peakStartHour` and `peakEndHour` it uses `peakCampaignId`, otherwise it uses `offPeakCampaignId`. In test environments, it always uses peak.

---

## 39. Pre-Signing Validation (Missing Required Fields)

### What It Is

A **gatekeeper** service that validates whether all required data is filled in before allowing the customer to sign the contract.

### What It's For

Prevents contracts from being signed with incomplete data, which would cause problems in funding and servicing.

### Validated Fields

| Field | Condition | Config |
|-------|----------|--------|
| Items/Cart | Cannot be empty (except for configured merchants) | `items.can.be.empty.for.merchant.*` |
| Invoice Amount | Must be > $0 | Direct |
| ID Verification | Required by merchant (Intellicheck/SEON) | Merchant flag |
| ACH Data | Routing + account number if ACH enabled | Merchant flag |
| Bank Verification | Optional but configurable per merchant | Merchant flag |
| CC Data | Required if CC payment is enabled | Merchant flag |
| First Payment Date | Required by merchant | `isFpdRequired` |
| Employment | Next pay date + frequency (if ACH) | Validation |
| Payment Frequency | Selection required | `desiredPaymentFrequency` |
| NeuroID Check | Optional fraud check | `useNeuroIdCheck` |
| Insurance Offer | State-dependent | `offer.insurance.in.states` |
| Item Split Payment | Lease vs. immediate purchase split | `isItemSplit` |

### How It's Triggered

Called automatically during the signing flow:
- **Legacy endpoint:** `GET /missing-fields/{shortCode}` (uses `selectedPaymentFrequency`)
- **Endpoint with planId (Task #439):** `GET /missing-fields/{shortCode}?planId={planId}` (accepts `planId` in place of `selectedPaymentFrequency`)

**Compatibility:** Both `selectedPaymentFrequency` and `planId` work. The `planId` contains both the frequency and the term (e.g., `WK13`), whereas `selectedPaymentFrequency` contains only the frequency (e.g., `WEEKLY`).

### What It Returns

`RequiredFields` containing: list of missing fields, calculated fees, security deposit, first payment date, insurance eligibility.

---

## 40. Approved Amounts by Risk Segment

### What It Is

A system of **maximum approval limits** based on the customer's risk segment.

### What It's For

Controls risk exposure. High-risk customers receive lower limits; low-risk customers receive higher limits.

### How It Works

Data loaded from a CSV file (`combined_approval_amounts.csv`, 60 rows) into the `approved_amount_by_segment` table. The row is selected by `(lambdaSegment, riskType)` via `ApprovedAmountBySegmentRepo.findByLambdaSegmentAndRiskType`:

| Field | Description |
|-------|-----------|
| `lambdaSegment` | Risk segment **1-20** (the "Model Segment" column of the CSV; comes from GDS) |
| `riskType` | Only **`DEFAULT`**, **`HIGH_RISK`**, **`TIRE_AGENT`** (entity `ApprovedAmountBySegment.java`; derived from `peakCampaignId` by `LeadRiskService.determineRiskType` — see [appendix-e](appendix-e-campanhas-uw.md)) |
| `maxApprovedAmountCR` | Maximum approved amount |

> **R1.53.0 correction (doc-vs-code drift):** the matrix is keyed on `lambdaSegment` (1-20) + `riskType` (`DEFAULT`/`HIGH_RISK`/`TIRE_AGENT`). The old "PRIME/GOOD/FAIR/POOR" labels and the "1-10" range were incorrect. The `npm_segment`/`tam_score` scores (below) are **a snapshot, they do NOT enter this selection**. **Sources:** `db/entity/ApprovedAmountBySegment.java`, `db/repository/ApprovedAmountBySegmentRepo.java`, `service/LeadRiskService.java`, `resources/combined_approval_amounts.csv`.

### How to Update

```
POST /uown/loadApprovedAmountsFromExcel
```
Upload a new CSV file with updated limits.

### Impact

The customer's approval amount is capped at the `maxApprovedAmountCR` of their segment. It directly affects how much the customer can finance.

### Additional GDS Scores: npm_segment and tam_score (R1.53.0)

Release 1.53.0 added two integer scores coming from the GDS underwriting engine, persisted alongside the other UW outputs in `uown_los_uwdata` (lead) and copied to `uown_sv_uwdata` on account creation:

| Field | Type | Origin | Meaning |
|-------|------|--------|-------------|
| `npm_segment` | INTEGER (nullable) | `out.npm_segment` node of the GDS response | Risk segment — **[HYPOTHESIS]** semantics/range not documented in the svc code |
| `tam_score` | INTEGER (nullable) | `out.tam_score` node of the GDS response | Model score (TireAgent-only per memory; live value observed 475 in stg) — **[HYPOTHESIS]** |

- Flow: `GdsResponseParser` reads the nodes -> `UnderwritingService.toUWInfo` sets them in `UWInfo` -> persisted in `uown_los_uwdata` -> the same `UWInfo` object copied to `uown_sv_uwdata` in the LOS->SVC import.
- Only populated when present in the `out` node; absent => NULL. svc does **not** filter by client-type (the logic of which clients emit the keys lives in `uwengine`).
- **Sources:** `service/gds/GdsResponseParser.java:58-63`, `service/UnderwritingService.java:107-108`, `pojo/UWResponse.java:66-67`, migration `V20260603054943_1.53.0`.

---

## 62. Application Continuation and Finalization

### 62.1 Application Continuation (Can Continue)

**What it is:** Checks whether an application can be continued, validating the lead's existence and pending requirements.

**Lead lookup logic:**
- Accepts a UUID or short code
- The UUID is split on the underscore and only the first part is used

**Checks:**

| Check | Result |
|-------------|-----------|
| Lead not found | `leadFound = false`, returns |
| Merchant not found | Returns incomplete |
| Primary customer does not exist | Can continue (`canContinue = true`) |
| Customer exists | Checks Plaid eligibility |

**Plaid check:**
- Depends on the lead status, the merchant's `isPlaidVerificationRequired` flag, and the UW data
- If Plaid is required and the config is enabled, phone verification is also required

**Endpoint:** `POST /uown/los/canContinueApplication`

### 62.2 Application Finalization

**What it is:** Retrieves missing required fields and sends approval communications.

**Employment fields checked:**
- `nextPayDate` (next pay date)
- `payFrequency` (pay frequency)
- `employer` (employer name)

**If lead DENIED:** A not-approved message is returned, with no email/SMS sent.

**If lead approved:**
- **Approval email** sent (synchronous or asynchronous, configurable)
- **Approval SMS** sent if a phone with a valid area code exists
- Phone format: `areaCode + phoneNumber`

**Endpoint:** `GET /uown/los/getFinalApprovalDetails/{leadPk}`

---

## 64. Address Verification (Melissa Data)

### What It Is

An address verification and standardization service using the external Melissa Data service, with a caching mechanism to avoid redundant calls.

### What It's For

Ensures that addresses provided by customers are valid and standardized according to USPS. Invalid addresses can indicate fraud or cause delivery problems.

### Caching Mechanism

| Condition | Action |
|----------|------|
| Address not previously verified | Runs Melissa Data |
| Existing verification, `lastRun` > 30 days ago | Runs Melissa Data again |
| Existing verification, `lastRun` <= 30 days ago | Returns the cached result |

**Config:** `days.past.last.run` (default: 30 days)

### Address Matching

Looks up by four components:
- Street Address 1
- City
- State
- ZIP Code

---

## 65. Geolocation by ZIP Code

### What It Is

A service that converts a ZIP code into county information using an external source.

### What It's For

County information is needed for correct tax calculation, since in the U.S. each county may have different rates. It is also used for regulatory compliance.

### How It Works

- **Source:** `https://www.getzips.com/cgi-bin/ziplook.exe?Zip={zipcode}`
- **Parser:** JSoup to extract the county from the returned HTML
- **Fallback:** Returns `null` silently on error
- **No cache:** Each lookup makes an HTTP call

---

## 66. Customer Journey Tracking (Funnel Analytics) — R1.53.0

### What It Is

Tracking of the **customer application funnel** for abandonment and performance analysis, introduced in R1.53.0. It captures, per journey: count of sessions, refreshes, and submit attempts; per session: browser/device/OS, iframe vs portal, embedder origin; per event: page, API/render/page timing, and errors.

### How It Works

- Fed by the **frontend** (Website/origination application form, iframe-embeddable) via REST under `/api/journeys`. `journeyId` = `leadPk`; `source` = `IFRAME`/`PORTAL`.
- **Race-tolerant design:** the journey and session are created lazily (`getOrCreate`) on first contact — **there is no endpoint to create a journey**. The journey is born `IN_PROGRESS`.
- **Events:** `PAGE_REFRESHED` increments refreshes (session + journey); `REDIRECT_COMPLETED` marks the journey `COMPLETED`; other event_types are free text. `currentStep` = the last `pageName`.
- **Session:** `start` enriches with device/browser/OS/iframe/embedder; `end` => status `ENDED`.

### Endpoints

| Action | Endpoint |
|------|----------|
| Start session | `POST /api/journeys/{journeyId}/session/start` |
| End session | `POST /api/journeys/{journeyId}/session/{sessionId}/end` |
| Record event | `POST /api/journeys/{journeyId}/events` |

### Notes (R1.53.0)

- **[OBSERVATION]** `ABANDONED` (JourneyStatus) declared but **never set** in svc code — abandonment is probably computed by an external job/consumer (there is an index on `last_activity_at`).
- **[OBSERVATION]** `total_submit_attempts`, `application_id`, `merchant_id`, `shortcode`, `source` declared but **never populated** in svc R1.53.0 code; possible persistence no-op in `CustomerJourneyService.complete()` (mutates without `save()` outside a managed tx). Confirm with product.
- Tables and enum: [appendix-c](appendix-c-tabelas-banco.md) · [appendix-d D.37](appendix-d-constantes-enums.md). Sources: package `svc/analytics/` (entity/service/controller/dto, enum `JourneyStatus`).

---

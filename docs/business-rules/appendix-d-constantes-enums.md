---
title: "Appendix D: Business Constants and Enumerations"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/types/enums.ts#FundingQueueStatus
  - code: src/types/enums.ts#LeadStatus
  - svc-source: enumeration/ClientType.java
  - svc-source: analytics/enumeration/JourneyStatus.java
  - env: qa2
covers: [enums, constantes, status, funding-queue, lead-status, approval-status, magwitch, rightfoot, customer-journey]
---

# Appendix D: Business Constants and Enumerations
## UOwn Leasing - SVC Platform

All of the system's enums, constants, and reference values.

---

## Appendix D: Business Constants and Enumerations

### D.1 Application Approval Status (AppApprovalStatus)

| Value | Code | Description |
|-------|--------|-----------|
| `APPROVED` | E0 | Application approved |
| `DELAYED` | E1 | Approval delayed/pending review |
| `EDIT_ERROR` | E2 | Error in the application data requiring correction |
| `SYSTEM_ERROR` | E3 | System error during processing |
| `DECLINED` | E4 | Application declined |

> **Attention — E0/E1 in distinct fields:** In the `AppApprovalStatus` field, `E0` = APPROVED and `E1` = delayed approval. In the `transactionStatus` field (same JSON response), `E0` = "received, not approved for transaction" and `E1` = "approved for transaction". They are distinct fields with opposite semantics for the same code — never use `E0` as a synonym for "approved" when inspecting `transactionStatus`.

**UnderwritingStatus mapping:**
- APPROVED -> AppApprovalStatus.APPROVED
- DENIED -> AppApprovalStatus.DECLINED
- REVIEW -> AppApprovalStatus.DELAYED
- OTHER -> AppApprovalStatus.SYSTEM_ERROR

### D.2 Authorization Status (AuthApprovalStatus)

| Value | Code | Description |
|-------|--------|-----------|
| `APPROVED` | A1 | Authorization approved |
| `PRE_QUALIFIED` | A2 | Pre-qualification granted |
| `DECLINED` | A0 | Authorization declined |

### D.3 Customer Payment Status (CustomerPaymentStatus)

| Value | Description |
|-------|-----------|
| `PAID` | Payment received and processed |
| `REVERSED` | Payment reversed/chargeback |
| `CANCELLED` | Payment cancelled before processing |
| `RETURNED` | Payment returned (e.g., NSF check) |
| `ERROR` | Error in processing |
| `DENIED` | Payment denied/declined |
| `PENDING` | Awaiting processing |
| `PENDING_REFUND` | Refund pending |
| `REFUNDED` | Payment refunded |
| `SENT_TO_BANK` | Sent to the banking system |
| `UNKNOWN` | Indeterminate status |

### D.4 Funding Queue Status (FundingQueueStatus)

| Value | Description | Corresponding Lead Status |
|-------|-----------|---------------------------|
| `FUNDING` | In funding process | LeadStatus.FUNDING |
| `FUNDED` | Funded successfully | LeadStatus.FUNDED |
| `REQUEST_REFUND` | Refund requested | LeadStatus.OTHER |
| `REFUNDED` | Refunded | LeadStatus.OTHER |

### D.5 Funding Transaction Status (FundingTransactionStatus)

| Value | Description |
|-------|-----------|
| `ACTIVE` | Active transaction |
| `INACTIVE` | Inactive transaction |
| `CANCELLED` | Cancelled transaction |

### D.6 Merchant Program Types (MerchantProgramType)

| Value | Description |
|-------|-----------|
| `SAME_AS_CASH` | "Same as cash" financing -- if paid within 90 days, pays the cash price |
| `QUICK_PAY` | Accelerated payment plan with a fixed percentage |

### D.7 Merchant Type (MerchantType)

| Value | Description | Determination Rule |
|-------|-----------|----------------------|
| `ONLINE` | E-commerce/internet | Codes starting with "OL" or "ON", or "OW90218" |
| `INSTORE` | Physical store | All other codes |

**Impact:** Determines whether the state used for taxes/programs is the **customer's** (ONLINE) or the **merchant's** (INSTORE).

### D.8 Order Type (OrderType)

| Value | Code | Description |
|-------|--------|-----------|
| `SALE` | 1 | Standard sale |
| `RETURN` | 2 | Return |
| `EXCHANGE` | 3 | Exchange |
| `ADJUSTMENTS` | 4 | Adjustment |
| `CANCEL` | 5 | Cancellation |

### D.9 Line Item Type (LineItemType)

| Value | Code | Description |
|-------|--------|-----------|
| `DEBIT_SALE` | D | Sale/debit item |
| `CREDIT_RETURN` | C | Return/credit item |

### D.10 Bank Verification Status (BvStatus)

| Value | Description |
|-------|-----------|
| `PENDING` | Verification awaiting processing |
| `COMPLETE` | Verification completed |
| `ERROR` | Error during verification |
| `INVALID` | Invalid bank information |
| `PENDING_LENDING_ATTRIBUTES` | Awaiting additional attributes |

### D.11 NeuroID Status (NeuroIdStatus)

| Value | Description |
|-------|-----------|
| `SUCCESS` | Behavioral verification completed |
| `PROFILE_NOT_FOUND` | Profile not found (JS disabled) |
| `ERROR` | Error in verification |
| `NOT_ENOUGH_INTERACTION_DATA` | **(R1.53.0)** Insufficient behavioral data — treated as **non-blocking pass-through** (`success=true`); fraud continues via other signals. Simulation toggle: `...NeuroIdVerificationService.simulate.not.enough.interaction.data` (default false) |

> **[ATTENTION — drift]** The "prevent repeated NeuroID calls" guard (`preventRepeatedNeuroIdCallsSigningRetry`) is **NOT merged in R1.53.0** (branch `R1.53.0_neuro_id`, reverted). Detail in [02-originacao-pipeline.md §5.5](02-originacao-pipeline.md).

### D.12 Settlement Status (SettlementTransactionStatus)

| Value | Code | Description |
|-------|--------|-----------|
| `REJECTED` | A0 | Settlement transaction rejected |
| `ACCEPTED` | A1 | Settlement transaction accepted |

### D.13 Contact Types (ContactType)

| Value | Description |
|-------|-----------|
| `MOBILE_PHONE` | Mobile phone |
| `SMS` | Text message |
| `EMAIL` | Email |
| `CELL_PHONE` | Cell phone (alternative) |
| `HOME_PHONE` | Home phone |
| `WORK_PHONE` | Work phone |

### D.14 Product Categories (Category)

| Value | Description |
|-------|-----------|
| `FURNITURE` | Furniture |
| `TIRE` | Tires |
| `RETAIL` | General retail |
| `OTHER` | Other |

### D.15 Modification Type (ModType)

| Value | Description |
|-------|-----------|
| `LEAD_STATUS_CHANGE` | Lead status change |
| `LEASE_MOD` | Lease modification |
| `APPROVAL_AMOUNT_CHANGE` | Change of the approval amount |

### D.16 Dealer Rebate Type (DealerRebateType)

| Value | Description |
|-------|-----------|
| `DAILY` | Daily rebate |
| `MONTHLY` | Monthly rebate |
| `QUARTERLY` | Quarterly rebate |
| `YEARLY` | Yearly rebate |

### D.17 Platform Fee Type (PlatformFeeType)

| Value | Description |
|-------|-----------|
| `MONTHLY` | Monthly charge |
| `DAILY` | Daily charge |
| `QUARTERLY` | Quarterly charge |
| `YEARLY` | Yearly charge |

### D.18 Payment Frequency Abbreviations (PaymentFrequency) — Task #439

| Frequency | Enum value | Abbreviation |
|------------|-----------|------------|
| Weekly | `WEEKLY` | `WK` |
| Bi-weekly | `BI_WEEKLY` | `BWK` |
| Semi-monthly | `SEMI_MONTHLY` | `SM` |
| Monthly | `MONTHLY` | `MN` |

### D.19 planId Format — Task #439

The `planId` uniquely identifies a combination of payment frequency and program term.

**Format:** `{frequency_abbreviation}{term_months}`

**Examples:**

| planId | Meaning |
|--------|-------------|
| `WK13` | Weekly, 13 months |
| `BWK13` | Bi-weekly, 13 months |
| `SM16` | Semi-monthly, 16 months |
| `MN16` | Monthly, 16 months |

**Usage:**
- Included in the `SchedSummaryInfo` returned by the calculator
- Accepted as a parameter in the `missing-fields` endpoint (alternative to `selectedPaymentFrequency`)
- Used by `SubmitApplicationService` to locate the correct `PaymentOption`
- Present in the contract redirect URL

### D.20 Payment Arrangement Type (ArrangementType) -- Task #446

| Value | Description |
|-------|-----------|
| `NORMAL` | Standard payment arrangement (promise to pay). Account remains ACTIVE after completion |
| `SETTLEMENT` | Negotiated settlement arrangement. Account transitions to SETTLED_IN_FULL after completion |

### D.21 Payment Arrangement Status (PaymentArrangementStatus) -- Task #446

| Value | Description |
|-------|-----------|
| `NOT_STARTED` | Arrangement created, no transaction processed |
| `IN_PROGRESS` | Transactions in progress, some pending remain |
| `SUCCESS` | All transactions completed successfully |
| `FAILED` | At least one transaction failed. Arrangement deactivated, rating reset |

### D.22 Import Source (ImportSource)

| Value | Description |
|-------|-----------|
| `LOS` | Loan Origination System |
| `UOWN_V1` | Legacy UOwn v1 system |
| `KORNERSTONE` | Kornerstone system |

### D.23 Integration Type (IntegrationType)

| Value | Description |
|-------|-----------|
| `API` | Integration via API (server-to-server) |
| `PORTAL` | Integration via web portal (manual) |
| `HYBRID` | API + portal combination |

### D.24 ZIP Codes on State Borders

The system maintains a special mapping for ZIP codes that cross state borders:

| ZIP Code | States |
|----------|---------|
| 02861 | MA / RI |
| 42223 | KY / TN |
| 59221 | MT / ND |
| 63673 | IL / MO |
| 71749 | AR / LA |
| 73949 | OK / TX |
| 81137 | CO / NM |
| 84536 | AZ / UT |
| 86044 | AZ / UT |
| 86515 | AZ / NM |
| 88063 | NM / TX |
| 89439 | CA / NV |
| 97635 | CA / OR |

### D.25 Bank Account Age Categories (BankAccountAges)

Used in the Servicing portal to classify how long the customer's bank account has existed. Used in risk assessment when registering bank data.

| Value | Description |
|-------|-----------|
| `LESS_THAN_6_MONTHS` | Less than 6 months |
| `_6_TO_12_MONTHS` | 6 to 12 months |
| `_1_TO_2_YEARS` | 1 to 2 years |
| `_2_YEARS_OR_MORE` | 2 years or more |
| `UNKNOWN` | Not provided / unknown |

### D.26 Document Groups (DocumentGroup)

Classifies the types of documents that can be attached to a lead or account in the Servicing portal.

| Value | Description |
|-------|-----------|
| `DRIVERSLICENSE` | Driver's license / photo ID document |
| `PAYSTUB` | Pay stub / proof of income |
| `BANKSTATEMENT` | Bank statement |
| `SIGNEDPOD` | Signed POD (Proof of Delivery) |
| `CORRESPONDENCE` | Generic correspondence (bank letter, proof of residence, etc.) |
| `LEASE` | Signed lease contract |

**Access rules:**
- Upload requires the `upload_file_for_account` permission
- Metadata editing requires the `edit_document` permission
- Deletion requires the `delete_file` permission
- Resending a stored document requires the `resend_stored_doc` permission
- Customer visibility controlled by the `isVisibleToBorrower` flag

### D.27 Integrated Client Types (ClientType)

The system supports 35 client/merchant types, each with its own campaigns and configurations (source: `svc ClientType.java`):

| ClientType | Name | Segment |
|------------|------|----------|
| `RWS` | Retailer Web Services | General retail |
| `PAY_TOMORROW` | Pay Tomorrow | Financial platform |
| `PAY_TOMORROW_FRASER` | Frasier Auto | Automotive |
| `TIRE_AGENT` | Tire Agent | Tires |
| `TERRACE_FINANCE` | Terrace Finance | Financial |
| `STORIS` | Storis | Furniture (POS) |
| `V1_UOWN` | UOwn v1 (legacy) | Legacy |
| `WE_GET_FINANCING` | We Get Financing | Financial |
| `FIRST_APP` | First App | Platform |
| `DANIELS_JEWELERS` | Daniel's Jewelers | Jewelry |
| `SASLOW_JEWELERS` | Saslow's Jewelers | Jewelry |
| `EPC_VIP` | EPC VIP | Retail |
| `FORM_PIPER` | Form Piper | Platform |
| `FLEXX_BUY` | Flexx Buy | Financial |
| `RTB_SHOPPER` | RTB Shopper | Retail |
| `TIRE_BROS` | Tire Bros | Tires |
| `JEWELRY` | UOwn Jewellers | Jewelry |
| `VERACITY` | Veracity | Retail |
| `BRIDGE` | Bridge | Financial |
| `EVERLY` | Everly | Retail |
| `LEND_PRO` | Lend Pro | Financial |
| `SWEET_PAY` | Sweet Pay | Financial |
| `WATSCO` | Watsco | HVAC/Refrigeration |
| `360_FINANCE` | 360 Finance | Financial |
| `MY_EYE_MED` | My Eye Med | Health/Optical |
| `CHOICE_PAY` | Choice Pay | Financial |
| `PAY_POSSIBLE` | Pay Possible | Financial |
| `SYNCHRONY` | Synchrony | Financial |
| `BUY_ON_TRUST` | Buy on Trust | Trust |
| `SKEPS` | Skeps | Platform |
| `CONECTA_MOBILE` | Conecta Mobile | Telecom |
| `KORNERSTONE` | Kornerstone | Senior Living |
| `BIG_HORN_GOLF` | Big Horn Golf | Sport/Leisure |
| `MAGWITCH` | Magwitch | To be confirmed (new in R1.53.0) |
| `OTHER` | Other | Catch-all |

> **`MAGWITCH` (R1.53.0, svc#566)** — added in `ClientType.java` immediately before `OTHER`. 100% generic behavior: uses `PayTomorrowClient` (no own subclass), peak/off-peak campaign **142** ("Core Furniture" band, no peak/off-peak distinction), risk classification `DEFAULT`, **runs underwriting normally** (no skip-UW), no special program routing (13m/16m), no approval cap or own signing provider. Differs from the other generic brands (EPC_VIP, FORM_PIPER, FLEXX_BUY, etc.) only by the identity fields: `username=magwitch`, `apiKey=U0wn_Magwitch_K7pN4x`, `clientUrl=https://magwitch.com/`. Business segment not yet defined in the code — confirm with product.

---

### D.28 Invoice Item Status (ItemStatus)

Status of each line item within an invoice.

| Value | Description |
|-------|-----------|
| `PENDING` | Item added to the cart, awaiting delivery |
| `DELIVERED` | Item delivered to the customer |
| `PAID` | Item paid (account settled) |
| `CANCELLED` | Item cancelled (returned or cancelled by the merchant) |

**Settlement rule:** For `settleApplication`, all items must be in `DELIVERED` status. `CANCELLED` or `PAID` items block the process.

### D.29 Invoice Type (InvoiceType)

Classifies whether the invoice is for a financed product or one purchased in cash.

| Value | Description |
|-------|-----------|
| `LEASE` | Product financed via lease-to-own |
| `PURCHASED` | Product purchased in cash (no financing) |

Used as a filter in the funding queue and in reports.

### D.30 Merchant Bank Account Type (BankTypeEnum)

Type of bank account used to receive funding.

| Value | Description |
|-------|-----------|
| `COMMERCIAL` | Commercial bank account (business checking/savings) |
| `INVESTMENT` | Investment account |

### D.31 Merchant Product Categories (MerchantCategory)

Product types a merchant can offer via lease.

| Value | Description |
|-------|-----------|
| `FURNITURE` | Furniture |
| `TIRES` | Tires |
| `SHED` | Prefabricated sheds / garages |
| `LIVINGROOM` | Living room |
| `BEDROOM` | Bedroom |
| `DININGROOM` | Dining room |
| `APPLIANCES` | Appliances |
| `ELECTRONICS` | Electronics |
| `TIRE_PARTS` | Tire parts and accessories |
| `AUTOMOTIVES` | Automotive |
| `AUTOMOTIVE_ACCESSORIES` | Automotive accessories |
| `OTHER` | Other |

### D.32 Credit Card Type (CcOptions)

Credit card brands accepted in the system.

| Value | Description |
|-------|-----------|
| `AmericanExpress` | American Express |
| `MasterCard` | MasterCard |
| `Visa` | Visa |
| `Discover` | Discover |
| `Other` | Other brands |

### D.33 Lending Category (LendingCategoryType)

Classifies the customer's risk category for program and pricing decisions.

| Value | Description |
|-------|-----------|
| `LTO` | Lease-To-Own (the platform's default category) |
| `PRIME` | Prime customer (low risk) |
| `NEAR_PRIME` | Near-prime customer (moderate risk) |

### D.34 Chargeable Fee Type (FeeType) — Full View

Fee types that can be added manually by agents in the Servicing portal.

| Value | Description | How to Add |
|-------|-----------|----------------|
| `PROTECTION_PLAN_FEE` | Buddy Insurance protection plan fee | Automatic (via plan) |
| `NSF_FEE` | Non-sufficient funds fee | Automatic (NSF event) |
| `REINSTATEMENT_FEE` | Reinstatement fee | Manual (via Add Fee in Servicing) |
| `MANUAL_FEE` | Generic manual fee | Manual (via Add Fee in Servicing) |
| `MISC_FEE` | Miscellaneous fee | Manual (via Add Fee in Servicing) |

**Validations when adding a manual fee:**
- Due date >= today (cannot be in the past)
- Amount > $0
- Comment required (max 500 characters)
- `baseAmount = totalAmount = feeAmount` (no additional tax calculation)

---

### D.35 ACH Process Type (ACHProcessType)

Enum in `common` (`enumeration/ACHProcessType.java`). Indicates the origin/nature of each `uown_sv_achpayment` row.

| Value | Meaning |
|-------|-------------|
| `SCHEDULED` | Regular scheduled debit from the schedule |
| `RERUN` | Retry of a returned/reversed ACH (weekly sweep) |
| `RERUN_NSF` | NSF-specific retry |
| `REQUEST` | ACH requested ad hoc (includes SETTLEMENT arrangements) |
| `REFUND` | ACH reversal/refund |
| `DAILY_RERUN_DELINQUENT` | **(R1.53.0, svc#540)** ACH created by the RightFoot flow after confirming sufficient bank balance -- see section 48 of [09-integracoes-externas.md](09-integracoes-externas.md) |

> **[OBSERVATION]** The value `DAILY_RERUN_DELINQUENT` lives in the `R1.53.0` branch of `common` (commit `bfad466`); the local `master` checkout does not contain it.

### D.36 RightFoot Balance Check Status (R1.53.0)

Column `uown_right_foot_balance_check.status`. The only value confirmed in svc code is the one the ACH gate consumes:

| Value | Meaning |
|-------|-------------|
| `SUCCESS` | Balance confirmed by RightFoot; enables ACH creation if `exposure + amount + $100 <= balance` |

> **[HYPOTHESIS]** Other values (PENDING/FAILED/etc.) and the webhook parser live in the `com.uownleasing:rightfoot` lib (not available on disk). Do not assume values beyond `SUCCESS` without live inspection.

### D.37 Customer Journey Status (JourneyStatus) — R1.53.0

Enum `svc analytics/enumeration/JourneyStatus.java` (origination funnel telemetry, origination#1308). Column `uown_customer_journey.status`.

| Value | Meaning |
|-------|-------------|
| `IN_PROGRESS` | Journey open (initial state) |
| `COMPLETED` | Customer completed and was redirected to the merchant (set only on the `REDIRECT_COMPLETED` event, idempotent) |
| `ABANDONED` | **Declared but never assigned by svc code** -- no sweep/job sets it in R1.53.0 (drop-off would have to be derived from `last_activity_at`). **[OBSERVATION]** |

### D.38 Customer Journey Event Types (event_type) — R1.53.0

`uown_customer_event.event_type` is a **free VARCHAR** in svc -- the vocabulary (~50 values) lives in the `origination` frontend (`lib/analytics/events.ts`, `EV` map). The svc interprets only two server-side: `PAGE_REFRESHED` (increments refresh counters) and `REDIRECT_COMPLETED` (marks the journey as `COMPLETED`).

Event groups (frontend): page-views (`*_PAGE_VIEWED`), protection-plan (`PROTECTION_PLAN_OPTED_IN/OUT/SUBMITTED/SUBMIT_ERROR`), customer actions (`ID_SCAN_*`, `SUBMIT_CLICKED`, `RETRY_CLICKED`), submit (`SUBMIT_RESPONSE_RECEIVED/ERROR`), friction (`ERROR_DISPLAYED`, `PAGE_REFRESHED`, `RAGE_CLICK`, `LONG_RUNNING_API`), iframe (`IFRAME_LOAD_STARTED/COMPLETED/FAILED`), esign (`ESIGN_OPENED/COMPLETED/CLOSED/DECLINED/ERROR/OPEN_FAILED`), merchant integration (`POSTMESSAGE_SENT/RECEIVED`, `REDIRECT_STARTED`, `REDIRECT_COMPLETED`).

---


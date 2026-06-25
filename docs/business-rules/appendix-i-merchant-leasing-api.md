---
title: "Appendix I: Merchant Integration API (UOWN Leasing Full API)"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - external-doc: https://documenter.getpostman.com/view/13272666/2sAYX9o1C6
  - code: src/api/clients
covers: [integration-api, settlement, additional-lease, fraud-vendors, enums, webhooks]
---

# Appendix I: Merchant Integration API (UOWN Leasing Full API)
## UOwn Leasing - SVC Platform

Canonical reference of the **field/enum contract** of the Full Integration API that the merchant uses to automate applications, invoices, contracts, and funding without the Merchant Portal. This is the contract behind the paths already listed in [`appendix-b-endpoints.md`](appendix-b-endpoints.md) (which do NOT move here) and uses the enums from [`appendix-d-constantes-enums.md`](appendix-d-constantes-enums.md).

> **Primary (authoritative) source:** Postman published doc `UOWN LEASING API DOCUMENTATION (FULL API)` — `https://documenter.getpostman.com/view/13272666/2sAYX9o1C6` (captured 2026-06-23). `[external-doc:postman/uown-fullapi,2026-06-23]`. Because it is the official product spec, the fields/enums are `[CONFIRMED]` as the doc declares them. The test framework drives these endpoints via `src/api/clients`. `[doc:src/api/clients]`
>
> **Why `volatility: volatile`:** the sandbox rules (SSN-9 gate, min lease) and merchant config are drift-prone categories (cat. #1/#6 in [[volatile-knowledge-registry]]) — see the ⚠ caveat in I.7.

---

## I.1 The two application flows

| Flow | When to use | How |
|-------|-------------|------|
| **Complete (with cart)** | Customer has already chosen the items | `sendApplication` already includes `lineItem` → returns a lease finalization link |
| **Pre-Approval (without cart)** | Give a credit limit before the purchase | `sendApplication` without invoice → returns the pre-approved amount; later a separate `sendInvoice` |

After approval: the customer enters payment data → reviews terms → decides on the protection plan → signs the contract → lease finalized. Finalization via the **UOWN Portal** (hosted link) or **embedded pages** (iframe on the merchant's site).

---

## I.2 Authentication

Each request includes in the body (or headers):

| Field | Description |
|-------|-----------|
| `userName` | Username assigned to the merchant |
| `setupPassword` | Authentication password |
| `merchantNumber` | Unique merchant identifier (e.g., `OL90202-0001`) |

**Mandatory egress IP allowlist:** to access Sandbox/Production the merchant's egress IPs must be whitelisted (contact UOWN Support with Merchant Name, Environment, Access Type, static IPs). Cloud: route via NAT Gateway for consistent IPs. Credentials are merchant-specific. `[external-doc:postman/uown-fullapi,2026-06-23]`

---

## I.3 `sendApplication` — fields

Submits the customer's application for credit assessment. With `lineItem` → returns a finalization link; without → returns the pre-approved amount.

### Required fields (key selection — formats)

| JSON Tag | Format / Notes |
|----------|-----------------|
| `userName`, `setupPassword`, `merchantNumber` | Credentials (I.2) |
| `mainFirstName`, `mainLastName` | Applicant name |
| `mainDOB` | **MMDDYYYY** |
| `mainSSN` | **Digits only, no hyphens** |
| `mainAddress1`, `mainCity`, `mainPostalCode` | `mainPostalCode` digits only |
| `mainCellPhone` | Digits only |
| `mainEmployerName` | Required |
| `mainMonthlyIncome` **or** `mainAnnualIncome` | Integer — **one of the two is required** |
| `emailAddress` | Applicant email |
| `ipAddress` | **Required** |
| `seonFingerprintText` | **Required** — SEON fingerprint (fraud, I.8) |

### Relevant optional fields (formats)

| JSON Tag | Format / Notes |
|----------|-----------------|
| `localeString` | Default `en_US` |
| `returnUrl` | Post-signing redirect (I.6) |
| `uuid` / `externalReferenceId` / `customerCode` | Merchant identifiers |
| `individualJointIndicator` | `I` = Individual, `J` = Joint |
| `mainAtAddressFrom`, `mainAtPrevAddressFrom`, `mainAtEmployerFrom` | **MMYY** |
| `mainHousingStatus` | `O`=Own, `R`=Rent, `PR`=Parents/Relative, `OT`=Other |
| `mainCheckingAccount` / `mainSavingsAccount` | `Y` / `N` |
| `mainBankAccountType` | `CHECKING` / `SAVINGS` |
| `mainBankAccountOpenedDate`, `mainLastPayDate`, `mainNextPayDate` | **MMDDYYYY** |
| `mainPayFrequency` | `WEEKLY` / `BI_WEEKLY` / `SEMI_MONTHLY` / `MONTHLY` |
| `languagePreference` | `E` = English, `S` = Spanish |
| `mainMaritalStatus` | `M` = Married, `U` = Unmarried |
| `depositAmount`, `orderTotal`, `merchandiseSubtotal`, `salesTax`, `deliveryCharge`, `installationCharge`, `miscellaneousFees` | Decimals (up to 10 digits, 2 places) |
| `invoiceNumber`, `discountAmount`, `salesPerson` | Invoice data |

### `lineItem` structure (embedded cart)

Array; each object is a product. Required: `lineItemLineNumber`, `lineItemProductNumber`, `lineItemProductDescription`, `lineItemProductCategory`, `lineItemType`, `lineItemQuantityOrdered`, `lineItemUnitPrice`, `lineItemExtendedPrice` (= unit × qty; up to 10 digits, 2 places).

- **`lineItemType`**: `D` = debit/sale · `C` = credit/return.

---

## I.4 `sendInvoice` — operations via `orderType`

Submits an invoice OR operates on an existing application. Requires `accountNumber` (returned by `sendApplication`). `lineItem` required for sales.

| `orderType` | Operation |
|-------------|----------|
| `1` | Sale / Submit / Modify invoice |
| `5` | Cancel application (keeps the approval) |

Return semantics:
- **Submit (1):** line items with `lineItemType=D`; `orderTotal` = total.
- **Cancel (5):** `orderTotal = "0.00"`, no items; the approved lease remains.
- **Full return:** empty item list + `orderTotal 0.00`.
- **Partial return:** per returned item, `lineItemType = C`.
- **Modify (1):** update `lineItem` + `orderTotal`; do not include cancelled/returned items; calculated values (`orderTotal`, `merchandiseSubtotal`) must match.

Extra optional line item fields: `lineItemSerialNumber`, `lineItemBasePrice`, `lineItemTaxAmount`.

---

## I.5 `getApplicationStatus` — response + enums

Requires `accountNumber`. Returns status, decision, funding.

| Field | Values |
|-------|---------|
| `transactionStatus` | **`E0`** = not approved · **`E1`** = approved |
| `currentStatus` | `UW_APPROVED`, `UW_DENIED`, `DENIED`, `CANCELLED_DUP_SSN`, `CONTRACT_CREATED` |
| `statusDescription` | `SIGNED`, `FUNDING`, `FUNDED` |
| `hasSignedLease` | boolean — lease signed |
| `canContinue` | boolean — can proceed |
| `openToBuy` | boolean |
| `applicationFound` | boolean — application exists |
| `applicationSubmitted` | boolean — submitted successfully |
| `approvedAmount` / `accountBalance` / `amountToBeFunded` | Values |
| `authorizationNumber` | If `E1`, provider authorization number |
| `applicationCreatedTimestamp` / `fundRequestDateTime` / `fundedDateTime` | Timestamps |
| `lastPayment` / `lastPaymentDate` / `paymentDueDate` | Payments |
| `faults` / `fieldInError1..5` / `sorErrorDescription` | Fault detail (only if an error occurred) |

---

## I.6 `settleApplication` — funding

Finalizes the lease after signing + delivery → triggers funding.

**Pre-conditions (both):** (a) the customer signed the contract digitally; (b) the merchant delivered the merchandise.

Request: `userName`, `setupPassword`, `merchantNumber`, `accountNumber` (+ optional `localeString`).

Key response: **`transactionStatus`** `A0` = not settled · `A1` = settled; `amount`; `paymentDetailsList`; `authorizationNumber` (if A1); `faults`/`fieldInError*`/`sorErrorDescription`.

---

## I.7 `addLease` — additional lease

Creates an additional lease using the remaining approval of an already-funded lease. Same structure as `sendInvoice`, different endpoint.

**Pre-conditions:** (a) original lease funded; (b) first installment paid **on-time**; (c) remaining approval available.

Fields: credentials + `customerCode` (required), `accountNumber` (existing funded lease), **`orderType` always `"1"`**, `invoiceNumber` (new), `orderTotal`, `lineItem` (required), `selectedPaymentFrequency` (optional). Creates a new invoice under the same customer account; follows the same structure/totals validations as `sendInvoice`.

---

## I.7.1 ⚠ Sandbox rules — VOLATILE CAVEAT

The doc declares two sandbox rules:
- **SSN ending in 9 → DENIED; 0–8 → APPROVED** (just a simulation; does not reflect a real credit decision).
- **Min lease amount = $250** (below this it does not approve).

> ⚠ **Do NOT assume the SSN-9 rule is in effect without reconfirming.** The **SSN-ending-9 denial gate was observed OFF in sandbox/qa1** (live-proven 2026-06-17) — SSN ending in 9 **no longer denies**. Deterministic denial now requires **`uown_merchant.auto_deny_application=TRUE`** (PRE-UW denial, `MERCHANT_AUTO_DENIED` ≠ `UW_DENIED`, qa2-proven). `[memory:ssn9-denial-gate-off-sandbox-qa1]` `[db-observation:uown_los_lead_notes/uown_los_outbound_api_log]` — drift-prone fact (cat. #6 [[volatile-knowledge-registry]]). Reconfirm via `uown_los_lead_notes`/`uown_los_outbound_api_log` before asserting denial in **any** env. Cross-link [[ssn-test-modalities]] §6, [[application-lifecycle]] #109/#112.

The min lease rule ($250) is from the doc; treat it as `[external-doc]` and re-verify against the target env.

---

## I.8 Finalization notifications + SEON

**Lease finalization notifications** (3 channels):
1. **URL Redirect:** `{returnUrl}?event=completed&ata={uuid}` (signed) or `event=cancelled` (declined); `ata` = application UUID.
2. **Iframe postMessage:** when the signing is embedded, UOWN sends a `postMessage` on completion.
3. **Webhook:** UOWN does a `POST` to the partner's configured URL on signing (URL + message configurable per merchant).

**SEON fingerprint:** `seonFingerprintText` is **required** in `sendApplication` (fraud). The merchant integrates the SEON JS Agent (web) / SDK (iOS/Android) → `seon.config()` + `seon.getBase64Session()` produces the encrypted fingerprint. Enables fraud detection via browser/device/behavior signals in underwriting.

---

## Cross-links

- Endpoint paths → [`appendix-b-endpoints.md`](appendix-b-endpoints.md)
- Enums (LeadStatus, FundingQueueStatus) → [`appendix-d-constantes-enums.md`](appendix-d-constantes-enums.md)
- External vendors (SEON, SignWell) → [`appendix-a-integracoes.md`](appendix-a-integracoes.md)
- Volatile categories (sandbox SSN, merchant config) → [[volatile-knowledge-registry]] #1/#6
- SSN modalities → [[ssn-test-modalities]]

---

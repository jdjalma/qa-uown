---
title: Financial Calculations and Formulas
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-06-23
sources:
  - code: src/helpers/svc-payoff.helpers.ts#parseEpoBreakdown
  - code: src/data/sixteenMonthEpoForCa531.testData.ts#ISSUE531_DATA
  - svc-source: pojo/rest/CalculatorResults.java
  - svc-source: service/AccountAmountsService.java
covers: [payment-calculator, epo, payoff, money-factor, payment-frequency, state-rules]
---

# Financial Calculations and Formulas
## UOwn Leasing - SVC Platform

Payment calculator, EPO (Early Pay Off), payoff calculation, and per-state EPO rules.

---

## 7. Payment Calculator

### What It Does

Calculates the complete lease payment schedule: amount of each installment, number of installments, EPO, fees, taxes, and the redirect URL.

### Main Formulas

```
baseCost = totalInvoiceAmount - taxAmount - depositAmount
contractAmountBeforeTax = baseCost * moneyFactor * termMonths
contractAmountAfterTax = contractAmountBeforeTax + contractTax + processingFee - companyDiscount
regularPayment = contractAmountBeforeTax / numberOfPayments
```

### Payment Due Today and First Installment With Fees (R1.53.0 — svc#558)

Fixed in R1.53.0 for merchants that charge the signing fee at e-sign (Good Feet case), preventing double-billing of the fee/deposit on the first installment:

- `paymentDueToday` now comes **directly from `SchedSummaryInfo.getSigningFee()`** (the already-resolved signing fee), and is no longer re-derived from merchant flags (`chargeProcessingFeeBeforeEsign` / `holdDeposit` / UW).
- `processingFee` + `securityDeposit` are only added to `firstPaymentWithFeesAndTax` **when there is NO signing fee being charged now** (`signingFee == null || <= 0`). If the fee was already collected at signing, the first installment does not charge it again.
- **Sources:** `pojo/rest/CalculatorResults.java:41-58`.

### Contract Balance on the Receipt (Contract Balance) — R1.53.0 (#533)

The contract balance used on the payment receipt is now calculated in Java, no longer inline in the receipt SQL (which subtracted all PAID payments and could go **negative** with fees):

- `ContractBalance.balance = totalContractAmount − totalPaidAmount` via `AccountAmountsService.getContractBalance(account)`, scaled to 2 places (HALF_EVEN); injected into the `:contractBalance` placeholder.
- The "If you pay off now you save" line (`savedAmount = balance − payoff`) is only rendered when `savedAmount != null && savedAmount > 0` — the customer never sees a negative/zero "you save".
- **Sources:** `service/PaymentReceiptService.java:104-126`, `pojo/CommonDataPojo.java:179-207`, `service/AccountAmountsService.java:80-103`, templates `correspondence/templates/payment-receipt-email.html`.

### Number of Installments by Frequency

| Frequency | Abbreviation (planId) | How it is determined |
|------------|--------------------|--------------------|
| WEEKLY | WK | Config `numOfPayments.{term}.WEEKLY` |
| BI_WEEKLY | BWK | Config `numOfPayments.{term}.BI_WEEKLY` |
| SEMI_MONTHLY | SM | Config `numOfPayments.{term}.SEMI_MONTHLY` |
| MONTHLY | MN | `termMonths` (if no config) |

### planId in the Calculation (Task #439)

The calculator now generates a `planId` for each frequency + term combination via `buildScheduleForFrequency`. The `planId` is included in the returned `SchedSummaryInfo` and follows the format `{abbreviation}{term}` (e.g., `WK13`, `BWK16`).

The `planId` allows `SubmitApplicationService` to locate the exact `PaymentOption`, replacing the lookup by `selectedPaymentFrequency` alone. Both parameters continue to work for compatibility.

### EPO Calculation

```
epoStartDate = firstPaymentDate or today
epoExpiry = startDate + configured months or program epoDays
epoAmount = costWithFeesNoTax + epoFeeAmount + buyoutFee
```

**Special 16-month term (configurable via `changeEpoForTermMonths`):**
```
totalMoneyFactor = moneyFactor * termMonths   (e.g., 0.15 * 16 = 2.40)
leaseAmount = (baseCost * totalMoneyFactor) - baseCost
leaseDays = total lease days (calculated from firstPaymentDate, numOfPayments, and frequency)
dailyLeaseAmount = leaseAmount / leaseDays
epoAmount = baseCost + (dailyLeaseAmount * epoDays) + processingFee + epoFeeAmount + buyoutFee
```

**Note:** The `moneyFactor` used in this formula is the **total** contract factor (`moneyFactor * termMonths`), NOT the monthly factor.

### Final Minimum Payment (State-Specific)

Certain states (e.g., NC) require that the last payment not be lower than a percentage of the base cost (default: 11%).

---

## 15. EPO - Early Pay Off (Early Payoff Within 90 Days)

### What It Is

EPO is the option that lets the customer **pay off the lease early by paying the original product value** (or close to it) within a limited time window -- typically 90 days. It is the differentiator of the "Same as Cash" model.

### What It's For (Customer Benefit)

The total cost of the lease (with money factor) is significantly higher than the original price. Example: a $1,000 product can cost $1,800 on a 12-month lease. If the customer pays ~$1,000 + fees within 90 days, they save ~$800.

### Eligibility for the 90-Day EPO

| Condition (ALL must be true) | |
|---|---|
| An active EPO receivable must exist |
| `earlyPayoffDateExpiry` has not expired |
| Override not set (or override = true) |
| State in bypass list (CA): skips the past-due check |
| Delinquency-as-of date not earlier than today |
| No past-due payment transactions |

### EPO Calculation (Per-State Cascade)

| Priority | Rule |
|------------|-------|
| 1 | State discount on amount paid |
| 2 | State discount on remaining balance |
| 3 | State percentage on remaining balance |
| 4 | State formula (CA, HI, NY, WV): `EPO = cost * (remainingPayments / totalPayments)` |
| 5 | Program discount or global percentage |

**NC:** EPO cannot be lower than the last installment.

### Kornerstone EPO (Special Formula)

```
kwBuyout = EpoNoTax - ((TotalPaid - PPFees - OtherFees) / MoneyFactor) + PastDueRegular
```

### What Happens When EPO Is Paid Off

1. All payments are **rewound** (undone)
2. Payments reallocated to the EPO receivable
3. EPO marked as `PAID_IN_FULL`
4. Account status -> `PAID_OUT_EARLY_EPO`
5. Payoff date recorded
6. If there was an overpayment: an alert is created

---

## 56. Payoff Calculation (Payoff Amount)

### What It Is

Calculates the total amount needed to fully pay off a lease. Supports differentiated logic for Kornerstone accounts vs. standard UOwn accounts.

### What It's For

When a customer wants to pay off the lease outside the 90-day EPO window, or when an agent needs to provide the total payoff amount.

### Kornerstone Formula (KW Buyout)

Applicable only for Kleverwise, Prime10, or KWChoice programs:

```
KwBuyoutAmount = EpoAmountWithTax
    - ((TotalPayments - ProtectionPlanFees - OtherFees) / MoneyFactor)
    + PastDueRegularPayments
```

| Component | Description |
|------------|-----------|
| `TotalPayments` | All payments made to date |
| `ProtectionPlanFees` | Protection plan fees up to the current date (NOT future) |
| `OtherFees` | NSF and other fees (past AND future) |
| `MoneyFactor` | From the schedule summary (if zero, division returns zero) |
| `PastDueRegularPayments` | Only past-due regular installments (excludes processing fees) |

**Rounding:** `CEILING` to the nearest cent.

### Standard Calculation (UOwn)

Uses a configurable SQL query stored in `SvSqlConfig` with the name `getEpoBalance`. The query returns comma-separated breakdown data.

### Validation Against Contract Balance

**Config:** `com.uownleasing.svc.service.PayOffAmountService.check.contract.balance.for.epo`

If enabled and the calculated EPO exceeds the contract balance, the contract balance is used as the payoff amount.

### How to Query

- **Via TMS:** `POST /uown/tms/getPayoffAmount/{accountPk}`
- **Via Admin:** Account details interface

---

## 70. Detailed Per-State EPO Calculation Rules

### What It Is

The EPO calculation follows a cascade of state rules that determine specific discounts and formulas.

### Priority Cascade (verified in the code)

| Priority | Rule | Config | Example |
|------------|-------|--------|---------|
| 1 | Fixed discount on amount paid | `epo.discount.for.state.{STATE}` | E.g., TX = $50 discount |
| 2 | Discount on remaining balance | `epo.remaining.amount.discount.for.state.{STATE}` | E.g., FL = $30 |
| 3 | Percentage on remaining balance | `epo.discount.on.remaining.for.state.{STATE}` | E.g., GA = 5% |
| 4 | Special formula (CA, HI, NY, WV) | Hardcoded | `EPO = cost * (remainingPayments / totalPayments)` |
| 5 | Program discount | `merchantProgram.payoffDiscount` | Fallback |

### Special Rules by State

| State | Special Rule |
|--------|---------------|
| **NC** | EPO cannot be lower than the last installment value (`lastPaymentNoTaxWithFees`) |
| **CA, HI, NY, WV** | Proportional formula: `cost * (remainingPayments / totalPayments)` |

### EPO Formula Declared in the Contract (16 months)

The **text** of the 16-month contract declares the EPO price (verbatim intent):

> **EPO price = cost of the leased goods + taxes + applicable fees + daily lease fees accrued from inception until (exercise date | current date — depends on the state) − rental payments made on-time (excluding taxes and fees).**

- The **promotional payoff** window = `epoDays`; **any late payment voids the option** ("any late payment voids the option").
- The **calculation** cascade (per-state discounts) is already in §70 above; the per-state **contract text variants**:
  - **OH:** "Cash Price less **50%** of payments made".
  - **NY:** proportional — `Cash Price × (remaining / total payments)` (New baseline; NOT daily-accrual).
  - **PA / AL / LA / NC / TN / GA:** `{{payOffDiscountPercent}}%` discount on the remaining.
  - **NC:** EPO never below `{{lastPaymentDueAmountWithTax}}` (floor balloon).

Template registry + tokens + matrix → [`appendix-h-epo-template-registry.md`](appendix-h-epo-template-registry.md). Primary source: wiki `gow-sign/EPO-SECTIONS` `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`.

### Receivable Deactivation

When creating new receivables (e.g., frequency change), the system deactivates the previous ones:
- **For leads:** Deactivates ALL unpaid receivables
- **For accounts:** Deactivates only specific types: `PROCESSING_FEE`, `PROTECTION_PLAN_FEE`, `EARLY_PAY_OFF`, `REGULAR_PAYMENT`

---


---
title: Lease Product — Technical Deep Dive
domain: business-rules
status: stable
volatility: stable
last_verified: 2026-03-20
sources:
  - gitlab: CalculatorService.java
  - env: qa2
covers: [formulas-financeiras, calculator, contrato, parcelas, money-factor, tax, epo]
---

# Lease Product — Technical Deep Dive
## UOwn Leasing - Rules Extracted from Source Code

Complements the existing documents (01-11) with business rules extracted directly from the `svc`, `origination`, `servicing`, `common`, `uwengine` repositories.

**Last updated:** 2026-03-20

---

## 1. Financial Formulas with Decimal Precision

### 1.1 Contract — Full Calculation

Source: `CalculatorService.java` lines 192-207

```
baseCost                  = totalInvoiceAmount - taxAmount - depositAmount
contractAmountBeforeTax   = baseCost * moneyFactor * termMonths               [scale 4, HALF_EVEN]
contractTax               = contractAmountBeforeTax * taxRate                  [scale 6, HALF_EVEN]
contractAmountAfterTax    = contractAmountBeforeTax + contractTax
                          + processingFee - companyDiscount                    [scale 2, HALF_EVEN]
```

The `moneyFactor` stored in `sched_summary` is the **accumulated** factor: `programMoneyFactor * termMonths` (scale 4, HALF_EVEN).

### 1.2 Regular Installment.

Source: `CalculatorService.java` lines 416-451

**Standard (all states except NC):**
```
regularPaymentNoTax       = contractAmountBeforeTax / numberOfPayments        [scale 2, HALF_EVEN]
firstPaymentNoTaxWithFees = regularPaymentNoTax + processingFee - companyDiscount
nextPaymentWithTax        = regularPaymentNoTax * (1 + taxRate)               [scale 2, HALF_EVEN]
```

**NC — minimum last payment rule:**
Default rate: `0.11` (config: `last.payment.percent.rate.for.state.NC`)
```
minLastPaymentAmount      = baseCost * 0.11                                    [scale 2, HALF_EVEN]
regularPaymentNoTax       = (contractAmountBeforeTax - minLastPaymentAmount) / (numPayments - 1)
lastPaymentNoTaxNoFees    = minLastPaymentAmount
```

**Tax per installment:**
```
firstPaymentTax    = max(regularPaymentNoTax - companyDiscount, 0) * taxRate   [scale 4]
regularPaymentTax  = regularPaymentNoTax * taxRate                             [scale 4]
lastPaymentTax     = lastPaymentNoTaxWithFees * taxRate                        [scale 4]
totalTaxAmount     = firstPaymentTax + lastPaymentTax
                   + regularPaymentTax * (numPayments - 2)                     [scale 2]
```

**Last payment:**
```
lastPaymentNoTaxWithFees = lastPaymentNoTaxNoFees - securityDeposit
lastPaymentWithTax       = lastPaymentNoTaxWithFees + lastPaymentTax           [scale 2]
```

### 1.3 Number of Installments

Resolution (in order): `CalculatorService.java` lines 406-412, 904-913

1. Config `numOfPayments.{termMonths}.{frequency}`
2. Config `number.of.payments.{termMonths}.{frequency}`
3. If MONTHLY: `numberOfPayments = termMonths`
4. Otherwise: `SvcException`

**Lease days by frequency:**
| Frequency | Formula |
|------------|---------|
| WEEKLY | `numPayments * 7` |
| BI_WEEKLY | `numPayments * 14` |
| SEMI_MONTHLY | `numPayments * 15` |
| MONTHLY | `ChronoUnit.DAYS.between(activationDate, activationDate.plusMonths(numPayments))` |

### 1.4 Prorate Amount

Source: `getProrateAmount.sql`

Calculates the proportional amount when a payment occurs mid-period:
```
periodDays = WEEKLY:7 | BI_WEEKLY:14 | SEMI_MONTHLY:15 | MONTHLY:30
prorateAmount = greatest(
    (regularPayment + processingFee)
    - (regularPayment + processingFee) / periodDays * (dueDate - today)
    - partialAlreadyPaid + processingFeePartialPaid,
    0
) + overdueAmount
```

If the account is not ACTIVE: returns `0`. If there is no next receivable: returns only overdueAmount.

---

## 2. EPO — Full Calculation Cascade by State

### 2.1 Dispatch (PayOffAmountService.getPayOffAmount)

| Condition | Path |
|----------|---------|
| `termMonths == 16` | Anytime Buyout (daily formula) |
| Company=KORNERSTONE and program in (Kleverwise, Prime10, KWChoice) | Kornerstone formula |
| All others | SQL `getEpoBalance.sql` |

After calculation: if `EPO > contractBalance`, uses `contractBalance` (config: `check.contract.balance.for.epo`, default `true`).

### 2.2 Standard EPO — Priorities in the SQL

**Priority 1 — Account eligible for 90 days (active window):**
```
EPO = epoReceivable.total - totalPaid + totalFees + overdueAmount
```
Where: `totalPaid` = SUM(PAID) - `remainingPaymentAmount`; `totalFees` = active receivables excluding REGULAR, PROCESSING_FEE, EPO.
MI special case: `overdueAmount = pastDue * 0.55` (other states: `pastDue`).

**Priority 2 — State has `discount_on_paid`:**
```
EPO = epoReceivable.total - ((totalPaid - totalFees) * discountOnPaid) + overdueAmount
```

**Priority 3 — States CA, HI, NY, WV:**
```
EPO = (epoReceivable.total * (totalScheduledPayments - pastOrPaidPayments) / totalScheduledPayments)
    - epoReceivable.partialPaymentAmount + overdueAmount
```
`pastOrPaidPayments` = count of REGULAR_PAYMENT with `due_date <= today` OR `allocation_status = PAID_IN_FULL`.

**Priority 4 — NC and the calculated EPO < last payment:**
```
EPO = lastPayment(no_tax_with_fees + tax) + overdueAmount
```

**Default — all other states:**
```
EPO = (totalContractAmount - (totalPaid - totalFees)) * (1 - COALESCE(sc.epo_discount, mp.payoff_discount))
    + overdueAmount
```

### 2.3 EPO Kornerstone (PayOffAmountService lines 105-143)
```
paidTowardsEpo = totalPayments - leftOverPayment - ppFeesToDate - allOtherFees
paidTowardsEpo = (paidTowardsEpo > 0 && moneyFactor > 0) ? paidTowardsEpo / moneyFactor : 0

kwBuyoutAmount = epoAmountWithTax - paidTowardsEpo + regularPastDue           [CEILING]
```

### 2.4 Anytime Buyout 16 Months (AnytimeBuyOutService lines 41-58)
```
leaseAmount      = (baseCost * moneyFactor) - baseCost                         [scale 4, HALF_EVEN]
leaseDays        = config("totalLeaseDaysForTerm{term}") OR term * 30
dailyLeaseAmount = leaseAmount / leaseDays                                     [scale 2, HALF_EVEN]

buyoutAmount     = baseCost + (dailyLeaseAmount * daysUsed)
buyoutNoTax      = buyoutAmount + totalFees(processingFee + buyoutFee + ppFees + otherFees)
costTax          = buyoutAmount * taxRate                                       [scale 4, HALF_EVEN]
buyoutWithTax    = buyoutNoTax + costTax                                        [scale 2, HALF_EVEN]

finalBalance     = buyoutWithTax - actualPaymentsMade
```
`daysUsed = ChronoUnit.DAYS.between(activationDate, today)`.
If `finalBalance <= 0` or `daysUsed <= 0`: falls back to `contractBalance`.

### 2.5 EPO Expiration Date
```
epoStartDate = config("getEpoDateFromFpd") ? firstPaymentDate : today
epoExpiry    = epoStartDate + config("epo.months.for.state.{state}") months
             OR epoStartDate + program.epoDays
```
16-month accounts: `earlyPayoffDateExpiry = LocalDate.now()` (disables the 90-day window).

---

## 3. Pre-Signing Fee Hierarchy

### 3.1 Processing Fee (CalculatorService lines 932-960)

Resolution in order:
1. `merchant.chargeProcessingFee == false` → `$0`
2. `program.amountChargedAtSigning > 0` → `$0` (signing amount replaces it)
3. `program.processingFeeOverride > 0` → uses the override
4. `stateConfigurations.processingFee` → fee per state
5. Fallback → `$0`

### 3.2 Signing Fee (CalculatorService lines 1008-1037)

Resolution in order:
1. `program.amountChargedAtSigning > 0` → uses that value
2. `(merchant.chargeProcessingFee AND chargeProcessingFeeBeforeEsign) OR (checkUwForVerification AND uwData.chargeProcessingFee)` → uses the processing fee
3. Otherwise → uses the security deposit
4. Always `>= 0`

`SigningFeeService.getSigningFeeAmount()`: `MAX(amountChargedAtSigning, processingFee, securityDeposit, protectionPlanFee, 0)`.

### 3.3 Security Deposit (CalculatorService lines 966-1001)

Charged when:
- `merchant.holdDeposit == true` AND `stateConfigs.securityDeposit != null`
- OR `merchant.checkUwForVerification AND uwData.chargeProcessingFee` AND `stateConfigs.securityDeposit != null`

NOT charged if `processingFeeOverride > 0` OR `amountChargedAtSigning > 0`.

### 3.4 NSF Fee (AccountFeeService lines 27-37)
- Default: `$15.00` (config: `AccountFeeService.nsfFee`)
- Override per state: `stateConfigurations.nsf` (if `> 0`)
- State: INSTORE uses the merchant's state; others use the customer's state

### 3.5 Buyout Fee
Per merchant: `uown_merchant.buyout_fee`. Added to the EPO at origination.

### 3.6 EPO Fee (percentage)
`program.epoFeePercent`: `epoFeeAmount = baseCost * epoFeeRate` (if rate > 0).

---

## 4. LOS to SVC Import — 16 Entities

Source: `LosToSvcImportService.java`

When a lead is imported, the following entities are created **in order**:

| # | Entity | Origin |
|---|----------|--------|
| 1 | `SvAccount` | `lead.getLeadInfo()` (account data: merchant, amounts, status) |
| 2 | `SvCustomer` | One per `LosCustomer` (primary holder + co-signers) |
| 3 | `SvAddress` | Per customer |
| 4 | `SvEmail` | Per customer |
| 5 | `SvPhone` | Per customer |
| 6 | `SvEmployment` | Per customer |
| 7 | `SvBankAccount` | Per customer (dedup by routing+account) |
| 8 | `UWData` | Account underwriting data |
| 9 | `SvInvoice` | Lead invoice (`LosInvoice`) |
| 10 | `SvItem` | Invoice items |
| 11 | `SvSchedSummary` | Schedule (FPD, frequency, term, EPO date) |
| 12 | `SvReceivable` | Generated from the schedule (REGULAR, PROCESSING_FEE, EPO) |
| 13 | `SvCreditCard` | Copied from LOS |
| 14 | `SvCreditCardTransaction` | APPROVED SALE/CAPTURE transactions (not PURCHASE) |
| 15 | `SvProtectionPlan` | If a protection plan exists on the lead |
| 16 | Welcome email | Sent to the customer (async or sync per config) |

**Re-import:** If the account already exists, `updateAccountFromLead` regenerates items, invoice, schedule and receivables. If the account is CANCELLED, the cancellation is re-applied.

**ImportLog:** A record created before and after the import.

**16-month rule:** If `termMonths` is in `noEpoForTermMonths` (default: `"16"`): `earlyPayoffDateExpiry = LocalDate.now()`.

---

## 5. Payment Allocation Strategies

Source: `UownAllocationService.java`

### 5.1 AllocationStrategy enum
| Strategy | Description |
|------------|-----------|
| `DEFAULT` | Selects the next unpaid receivable by due date. If REGULAR_PAYMENT, it collects all with the same date or earlier |
| `EPO_ONLY` | Allocates only to the active EPO receivable |
| `REGULAR_RECEIVABLES` | Allocates to all unpaid receivables |

### 5.2 Allocation Order Within a Payment

1. **Non-EPO** receivables first (ordered by due date ASC)
2. **EPO** receivable last (with the remaining amount of the payment)
3. If the remaining amount after all receivables >= payoff amount → account `PAID_OUT_EARLY`, last receivable gets `PAID_OFF_BALANCE`
4. Any unallocated amount → `account.overPaymentAmount`

### 5.3 ReceivableAllocationStatus
| Status | Meaning |
|--------|------------|
| `UNPAID` | No payment applied |
| `PARTIALLY_PAID` | Partial payment applied |
| `PAID_IN_FULL` | Full amount paid |
| `PAID_OFF_BALANCE` | Balance paid off (payoff) |
| `NOT_APPLICABLE` | Not applicable |

### 5.4 Reallocation
`reallocateFromReceivable`: moves allocations between receivables.
Blocked if the account is in: `PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, CANCELLED`.
Blocked if the destination receivable is in: `PAID_IN_FULL, PAID_OFF_BALANCE`.

### 5.5 Auto PAID_OUT
After EACH allocation: `AutoPaidOutEligibilityService.isAccountEligibleForAutoPaidOut()` is checked. If eligible → status `PAID_OUT` immediately.

### 5.6 DEPOSIT Type
`PaymentType.DEPOSIT` always uses the `EPO_ONLY` strategy — bypasses normal receivable selection.

---

## 6. Rewind/Replay — Detailed Mechanics

Source: `RewindReplayService.java`, `RewindPaymentsService.java`, `ReplayPaymentsService.java`

### 6.1 Three Entry Points

**A. `rewindReplayForReversePayment(svPayment)`** (payment reversal):
1. Collects all PAID payments after the reversed payment (by `rowCreatedTimestamp`)
2. If the account is in a terminal status (PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, SETTLED_IN_FULL): resets to ACTIVE
3. Reverses the allocations of the reversed payment
4. If there are no unallocated payments: replays the subsequent ones
5. If there are unallocated payments: performs a full `rewindAndReplayAccount`

**B. `rewindAndReplayAccount(accountPk)`** (full rebuild):
1. Fetches ALL PAID payments in date ASC order
2. Zeroes `overPaymentAmount`
3. Reverses ALL allocations (`TransactionType.REWIND_PAYMENT`)
4. Re-applies all payments via `postPaymentService.postPaymentToAccount()`

**C. `rewindAndReplayPayment(paymentPk)`** (partial):
1. Reverses only the specified payment and all subsequent ones
2. Re-applies in chronological order

### 6.2 Rewind
- For each payment: reverses all allocations (marks receivables as UNPAID)
- If the account is in a terminal status and the payment had allocations: resets the account to ACTIVE

### 6.3 Replay
- Orders payments by `paymentDate` then `rowCreatedTimestamp`
- For each: `postPaymentService.postPaymentToAccount(payment, replayTransactionType)`

### 6.4 Reversible Statuses
Configurable via `statuses.to.active.for.rewind`:
`PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, SETTLED_IN_FULL` → `ACTIVE`

---

## 7. Invoice Modification (Lease Mod)

Source: `ModifyInvoiceService.java` lines 62-127

### 7.1 Preconditions
- Lead in status `SIGNED` or beyond (`lead.isSignedOrBeyond()`)

### 7.2 Flow
1. The account is **cancelled** (payments are NOT refunded)
2. Lead status → `LEASE_MOD_REQUESTED`
3. If the lead is FUNDED: `fundingStatus → REQUEST_REFUND`
4. A **new lead** is created by re-running the application processor on the original request
5. CC and bank account are linked from the old lead to the new one
6. Merchant notified

### 7.3 Restrictions (SendInvoiceService lines 243-252)
- The account must be in `ACTIVE` or `CANCELLED`
- Cannot modify after **80 days** from the activation date (config: `num.days.past.creation.for.lease.mod`)
- Specific users can bypass (config: `users.allowed.bypass.lease.mod.check`)
- Cannot modify if PAID items exist and the new total > approval amount

---

## 8. Full Funding Lifecycle

Source: `LeadFundingService.java`

### 8.1 Statuses
| FundingQueueStatus | Corresponding LeadStatus |
|--------------------|--------------------------|
| `FUNDING` | `FUNDING` |
| `FUNDED` | `FUNDED` |
| `REQUEST_REFUND` | — |
| `REFUNDED` | — |

### 8.2 Transitions

**SIGNED/READY_TO_FUND → FUNDING:**
- Validates the lead is in: `SIGNED, READY_TO_FUND, FUNDING, FUNDED`
- Sets `fundRequestDateTime = now`, `fundingStatus = FULL_FUNDING`
- Calls `importToServicing()` (LOS → SVC import)
- Creates a `FundingTransaction` record

**FUNDING → FUNDED:**
- Sets `fundDateTime = now`, `fundingStatus = FULLY_FUNDED`
- Lead status → `FUNDED`
- Marks the old `FundingTransaction` as `INACTIVE`, creates a new one with `FULLY_FUNDED`
- Records it in `FundingModification`

**FUNDED → FUNDING (reversal):**
- Only if the lead is currently in `FUNDED`
- Sets `fundingStatus = FULL_FUNDING`, lead → `FUNDING`

**FUNDED → REQUEST_REFUND → REFUNDED:**
- Creates a refund `FundingTransaction` with `refundRequestDateTime`
- On confirmation: updates to `REFUNDED`

### 8.3 Funded Amount Calculation
```
amountToBeFunded = invoiceAmount - (invoiceAmount * merchant.ccProcessingFeePercent)
```

### 8.4 Merchant Funding Exceptions
Two flags per merchant: `twoDayFundingException`, `fiveDayFundingException` (default: `false`).
Used as a filter in the funding queue.

---

## 9. Sweep Processing — Full Catalog

### 9.1 ACH Sweeps

| Sweep | Method | Description |
|-------|--------|-----------|
| `CreateScheduledACHPaymentsSweep` | `createScheduledACHPayments()` | Creates ACH records for accounts due today |
| `SendACHPaymentsSweep` | `sendACHPayments()` | Sends the ACH file to Profituity. Optional multi-thread |
| `getSendACHPaymentsStatusSweep` | `getSendACHPaymentsStatus()` | Polls Profituity ACK for sent payments |
| `getStatusDatePaymentsListSweep` | `getStatusDatePaymentsList()` | Polls results by date range; processes RETURNED |
| `rerunACHPaymentsSweep` | `rerunACHPayments()` | Re-runs failed ACH: creates NSF fee + RERUN ACH |
| `reverseAchPaymentsSweep` | `reverseAchPaymentsSweep()` | Reverses returned ACH. **Thread size = 1** |

### 9.2 CC Sweeps

| Sweep | Description |
|-------|-----------|
| `CreateScheduledCreditCardPaymentsSweep` | Creates CC transactions for accounts due today |
| `SendCreditCardPaymentsSweep` | Processes pending CC transactions via the gateway. Async thread pool |
| `rerunCCPaymentsSweep` | Re-runs DENIED/ERROR CC. Runs the next day or Thu/Fri/Sat. Representment 1 |
| `delinquencyRerunCCPaymentsSweep` | 100-day rerun. Accounts with `delinquency_as_of_date < today - 100` and rating NOT IN (B,C,P,S,D,E,F,G,L,U) |
| `dailyDelinquencyRerunCCPaymentsSweep` | Daily rerun. SALE of the day + delinquent accounts. NSF fee only if before 9 AM |

### 9.3 Delinquency CC Rerun — Amount Logic
```
nextRegularAmount = next regular receivable remaining amount
pastDueAmount = amount past due
amountCharged = min(pastDueAmount, nextRegularAmount) if pastDue > full receivable
              OTHERWISE: remainingRegularAmount
```
Uses the active CC auto-pay; falls back to the last tokenized card.

### 9.4 Other Sweeps

| Sweep | Description |
|-------|-----------|
| `paidOutAccountsSweep` | Marks eligible accounts as PAID_OUT |
| `sendEmailsSweep` | Sends pending emails |
| `sendFirstPaymentRemindersSweep` | First payment reminders |
| `sendRecurringPaymentRemindersSweep` | Recurring payment reminders |
| `delinquencyOfferEmailSweep` | Offer emails by delinquency tier |
| `latePaymentNoticeEmailSweep` | Monthly notice with the exact days past due |
| `settledInFullEmailSweep` | "Settled in Full" email (Mon-Fri 02:00) |
| `checkLeadExpirationSweep` | Checks expired leads |
| `cancelProtectionPlanSweep` | Cancels protection plans |
| `createSkitDelinquentFileSweep` | Generates a file for Skit.AI (automated collections) |
| `removeRatingLetterSweep` | Removes ratings from accounts that no longer meet the criteria |

---

## 10. CC Transaction Lifecycle

### 10.1 CCTransactionStatus
```
PENDING, FUTURE_PENDING, APPROVED, DENIED, ERROR, REFUNDED, CANCELLED,
MANUAL_REVERSE, PICKED_TO_SEND, PARTIALLY_REFUNDED, SKIPPED, REUSED
```

### 10.2 CC Flow
1. **Authorization**: $0.01 (or config) — `CCAction.AUTHENTICATION`
2. **Tokenization**: `CCAction.TOKENIZATION` — generates a token at the gateway
3. **Charge**: `CCAction.SALE` — processes the payment
4. **Post-processing**: Receipt created, payment allocated

### 10.3 NSF CC (CCNsfFeeService)
Detection: the message contains "Insufficient funds" OR a code in "50051, 57852" OR the last 2 digits = "51".
Fee due date: `today` (config: `setCurrentDateForNsf`, default `true`).

### 10.4 Refund CC
- Only if the original status = `APPROVED` or `PARTIALLY_REFUNDED`
- Amount <= `remainingRefundableAmount + chargedFeeAmount` (if refundFee=true)
- Partial: original → `PARTIALLY_REFUNDED`
- Full: original → `REFUNDED`, `remainingRefundableAmount = 0`
- Creates a `CCAction.CREDIT` transaction via the gateway

---

## 11. ACH Lifecycle

### 11.1 ACHStatus (all)
```
PENDING, SENT, ACK_ERROR, ERROR_SENDING, ERROR, CANCELLED, COMPLETED,
ACK_RECEIVED, INACTIVE, RETURNED, REVERSED, SETTLED, CORRECTION,
REJECTED, BLOCKED, REFUNDED, PENDING_TO_RERUN, MANUAL_REVERSE,
PICKED_TO_SEND, STATUS_UPDATE_PENDING, PARTIALLY_REFUNDED,
BLOCKED_ACCOUNT, SKIPPED, SETTLED_IN_RERUN, ACCOUNT_VALIDATION_ERROR
```

### 11.2 ACHProcessType
```
SCHEDULED, RERUN, RERUN_NSF, REQUEST, REFUND
```

### 11.3 Asynchronous Flow
1. `createOrUpdateACHPayment` stores the record
2. `SendACHPaymentsSweep` sends the file to Profituity (vendor)
3. `getSendACHPaymentsStatusSweep` polls the ACK
4. `getStatusDatePaymentsListSweep` polls the final results
5. `addPaymentAfterAch()` creates a SvPayment only for `ACHType.ACHDebit` (not ACHCredit)

### 11.4 NSF ACH — Conditions for Fee Creation
All must be true:
1. Config `create.nsf.fee.receivable.on.rerun == true`
2. `achProcessType == SCHEDULED`
3. `originalACHPk == null` (first occurrence)
4. `numberOfTries == 1`

### 11.5 Rerun ACH (after NSF)
1. Creates an NSF fee receivable
2. Creates a new ACH with `ACHProcessType.RERUN` and `originalACHPk` pointing to the original
3. If config `create.ach.payment.for.nsf.fee.on.rerun == true`: creates a second `RERUN_NSF` ACH to charge the fee

### 11.6 R08 Stop Payment
`updateAfterAchPaymentReturnCodeR08()`: creates the alert "R08: Customer placed a stop on payment".

---

## 12. SMS — Opt-In/Opt-Out Rules

Source: `SmsService.java`

### 12.1 Automatic Opt-In
On the first SMS sent to a lead or account (checked via the `SmsOptInConfirmationResponse` SQL):
- Prepends an automatic opt-in message (1 second earlier)
- KORNERSTONE: "Welcome to Kornerstone. Msg&data rates may apply..."

### 12.2 Automatic Opt-Out on Error
If delivery returns: `"invalid 'to' phone number"`, `"empty to number"`, `"the message from/to pair violates a blacklist rule"`, `"attempt to send to unsubscribed recipient"` → marks `doNotText = true` on all phone records with that number.

### 12.3 Vendors
- **TextGrid** (default) and **Twilio** — configurable split
- Config: `split.texts.between.twilio.and.textgrid`, `percent.texts.sent.via.textgrid`
- TextGrid numbers: `+16465829473, +16263856892, +14695051760, +12153157135`

### 12.4 KORNERSTONE Template Routing
If `company = KORNERSTONE`: the template name is prefixed with `KORNERSTONE_` before the lookup.

### 12.5 SMS Window for Delinquency
Configurable, default: **12:00-19:00**. Delinquency SMS are not sent outside this window.

---

## 13. Customer Portal

Source: `CustomerPortalController.java`

### 13.1 Capabilities
| Endpoint | Function |
|----------|--------|
| `POST /authenticateCustomer` | Customer authentication |
| `POST /sendVerificationCode/{phoneOrEmail}` | Sends a verification code |
| `POST /verifyCode/{phoneOrEmail}/{code}` | Verifies the code → `CustomerLoginResult` |
| `GET /getAllCustomerPayments/{accountPk}` | Lists the account's payments |
| `POST /createOrUpdateCustomerPayment` | Creates/updates a payment |
| `POST /createOrUpdateCorrespondenceTracking` | Tracks interactions |
| `POST /submitSupportTicket` | Integrates with Zendesk |
| `GET /getZendeskEmailCategories` | Support categories |

### 13.2 Rating P in the Portal
ACH/CC payments via the customer portal with a future date: the account rating is automatically set to `P` (Promise-to-Pay).
Config: `ach.customer.portal.add.rating.letter` / `cc.customer.portal.add.rating.letter` (default: `true`).

---

## 14. Merchant Config — Full Flags

Source: `MerchantInfo.java`

### 14.1 Verification Flags
| Flag | Default | Effect |
|------|---------|--------|
| `isIntellicheckRequired` | `false` | Requires an ID scan at signing |
| `isSeonIdCheckRequired` | `false` | Requires a SEON ID check at signing |
| `checkUwForVerification` | `false` | Consults the UW response to decide the ID requirement |
| `useNeuroIdCheck` | `false` | NeuroID behavioral biometrics on sendApp + submitApp |
| `isFraudCheckRequired` | `false` | SEON email/phone/IP verification |
| `useSentilink` | `false` | Sentilink in the UW extra data |
| `useNeustar` | `false` | Neustar in the UW extra data |
| `useLexisNexis` | `false` | LexisNexis in the UW extra data |

### 14.2 Payment Flags
| Flag | Default | Effect |
|------|---------|--------|
| `isCcRequired` | `true` | CC required at signing |
| `isAchRequired` | `true` | Bank account required |
| `isFpdRequired` | `false` | Explicit first payment date required |
| `isBankVerificationRequired` | `false` | Bank verification (Plaid-style) |
| `isPlaidVerificationRequired` | `false` | Plaid income verification |

### 14.3 Application Flags
| Flag | Default | Effect |
|------|---------|--------|
| `autoDenyApplication` | `false` | Auto-denies all applications |
| `isItemSplit` | `false` | Splits the cart into CC purchase-now + lease |
| `offerInsurance` | `false` | Offers a protection plan |
| `acceptNewApps` | — | Stops accepting new applications |
| `verifyPhoneBeforeSigning` | `false` | Phone OTP before signing |
| `recordSigningFlow` | `false` | Sentry session replay for signing |

### 14.4 E-Sign and UI Flags
| Flag | Default | Effect |
|------|---------|--------|
| `esignMode` | `EMBEDDED` | `EMBEDDED` (iFrame) or `EMAIL` |
| `esignClient` | `SIGNWELL` | E-sign vendor |
| `removeParentOrTopOnIframe` | `false` | Prevents iframe breakout |
| `allowCloseOnIframe` | `false` | Shows the close button on the SignWell embed |

### 14.5 Financial Settings
| Field | Default | Effect |
|-------|---------|--------|
| `merchantType` | `ONLINE` | ONLINE uses the customer's state; INSTORE uses the merchant's state |
| `numDaysApprovalExp` | `0` | Days until the approval expires |
| `allowedFrequencies` | `WEEKLY, BI_WEEKLY` | Payment frequencies offered |
| `defaultLoanAmount` | `$1,400` | Amount sent to UW if not specified |
| `minimumLeaseAmount` | `$250` | Minimum lease amount |
| `maxApprovalAmount` | null | Approval cap |
| `ccProcessingFeePercent` | — | Discount on funding |

### 14.6 Program Fields (ProgramInfo)
| Field | Default | Effect |
|-------|---------|--------|
| `moneyFactor` | — | Cost multiplier |
| `termMonths` | 13 | Lease duration |
| `epoDays` | 90 | EPO window |
| `epoFeePercent` | — | Percentage fee on EPO |
| `dealerDiscount` / `dealerRebate` | — | Funding adjustments |
| `processingFeeOverride` | — | Processing fee override |
| `amountChargedAtSigning` | — | Amount charged at signing |
| `programType` | — | e.g.: `SAME_AS_CASH` |
| `states` | — | States where the program is available |
| `maxCartAmount` / `minCartAmount` | — | Invoice limits |

---

## 15. Application Pipeline — 18 Detailed Steps

Source: `ApplicationProcessor.java` line 94-95

Default order:
```
stateCheck, merchantAutoDenyCheck, sourceCheck, blacklistCheck, dataMismatchCheck,
previousLeadsCheck, previousUwDeniedCheck, futureFpdCheck, duplicateCheck,
eligibleForReapprovalCheck, neuroIdCheck, underwritingCheck, termsStep,
invoicePlaceHolderStep, calculateMaxApprovalAmount, compareCostCheck,
itemSplitCheck, calculatorCheck
```

### Critical Steps with New Rules

**Step 3 — sourceCheck:** Only for `BUY_ON_TRUST`. Deny rates by category: `111706798993` = 80%, `105561120370` = 70%.

**Step 6 — previousLeadsCheck:** Cancels previous leads. Computes `consumedApprovalAmount` from all previous signed/funded leads.

**Step 7 — previousUwDeniedCheck:** Re-uses the previous UW denial EXCEPT if `isEligibleForExtraInfo=true` AND the new request has banking data → re-runs a fresh UW.

**Step 8 — futureFpdCheck:** Denies if a SIGNED lead already exists with `firstPaymentDueDate > today` and no accountPk.

**Step 9 — duplicateCheck:** Hard limits (default 3): `emailCount >= 3` → `EMAIL_COUNT_FAILED`; `phoneCount >= 3` → `PHONE_COUNT_FAILED`.

**Step 15 — calculateMaxApprovalAmount:** Factors `approvalAmount` + open-to-buy. If `maxApprovalAmount <= 0` → `NO_REMAINING_AMOUNT`.

**Step 16 — compareCostCheck:** If cost > maxApproval AND not eligible for item split → returns `DECLINED` with status `UW_APPROVED` (UW approved but the cart is too large).

### Second Opportunity (isEligibleForExtraInfo)

It is NOT a separate pipeline. UW returns `isEligibleForExtraInfo=true` on the denial. On re-application with banking data, UW is re-run fresh with the banking data in the extra fields.

### Missing Required Fields

Endpoint: `GET /uown/los/missing-fields/{shortCode}?planId=X`

**Critical:** `resolveAndSetMerchantProgramFromPlanId` — if `planId` is provided and `lead.merchantProgramPk == null`, it resolves the program. **Without this:** "Merchant program is required to determine fee".

**Link expiry:** 36 hours (configurable). Older links are rejected.

### Add Lease

Endpoint: `POST /uown/los/addLease`

- The lead must be in `FUNDED` (config: `valid.statuses.for.add.lease`)
- Runs the **full 18-step pipeline** as a new application
- The new lead receives the `refLeadPk` of the original lead
- The original lead receives `addedSecondLease=true`

---

## 16. Blacklist — Detail

Source: `BlackListService.java`

### 16.1 Fields Checked Against the Blacklist
| Field | How it is checked |
|-------|----------------|
| firstName + lastName | Combined match |
| SSN | Exact match |
| phoneNumber | areaCode + number |
| emailAddress | Exact match |
| bankAccountNumber | Exact match |
| bankRoutingNumber | Exact match |
| streetAddress1 + zipCode | Combined match |
| CC BIN | 6 digits exact |

### 16.2 What Triggers Blacklisting
- `LeadService.blackListLead()`: creates separate entries for EACH PII field
- Lead status → `BLACKLISTED`

### 16.3 What the Blacklist Blocks
- **Pipeline step 4** (`blacklistCheck`): blocks a new application → `BLACKLIST_DENIED`
- **Submit application** (`SubmitApplicationService` line 186): checks the bank account and routing before proceeding → `BLACKLIST_APPROVED`

### 16.4 Export
Automatic monthly report: `cron = "0 0 0 1 * ?"` — `generateExportBlacklistReport`.

---

## 17. State Configurations — Financial Fields

Source: `StateConfigurationsInfo.java`

| Field | Function |
|-------|--------|
| `processingFee` | Default processing fee per state |
| `nsf` | NSF fee override per state |
| `securityDeposit` | Security deposit amount |
| `discountOnPaid` | EPO discount applied to the total paid (Priority 2 in the SQL) |
| `epoDiscount` | EPO discount rate for the default formula (Priority 4/Default in the SQL) |
| `recycleFee` | Recycling fee per item (currently `ZERO` in the code) |
| `maxProcessingAndDeliveryFee` | Cap on processing + delivery fee |
| `maxCostPriceFactor` | Maximum allowed cost factor |

---

## 18. Tax Calculation

Source: `TaxService.java` lines 31-54

### 18.1 Flow
1. Normalizes address fields (trim, collapse whitespace)
2. Checks whether the merchant is tax-exempt for the state (`merchant.taxExemptedStates`, comma-separated list). If exempt: returns `0`
3. If `taxConfig.useTaxCloudApi() == true`: calls `TaxCloudService.getTaxForZip()`
4. Otherwise: calls `TaxJarService.getTaxForZip()`

### 18.2 Address Determination
- INSTORE: the merchant's address
- ONLINE: the customer's address

### 18.3 What Is Taxed
- Contract amount (per installment, per schedule)
- EPO amount (`baseCost * taxRate` or anytime buyout tax)
- Kornerstone EPO (`epoAmountWithTax`)

### 18.4 What Is NOT Taxed
- Processing fee
- Signing fee
(The fee is added to the contract amount AFTER the tax is calculated on the base contract)

---

## 19. Payment Frequency — Detail

### 19.1 Valid Values
| Frequency | Abbreviation (planId) | Backend Enum |
|------------|--------------------|-|
| Weekly | WK | `WEEKLY` |
| Bi-Weekly | BW (not BWK) | `BI_WEEKLY` |
| Semi-Monthly | SM | `SEMI_MONTHLY` |
| Monthly | MN | `MONTHLY` |

### 19.2 Frequency Change
- If the new frequency = current: no-op
- Recalculates the full schedule via `CalculatorService.calculateForAccount()`
- Increments `frequencyChanges` (starts at 1 if null)
- Records in `FrequencyMods` (old freq, new freq, old amount, new amount)
- Log `LogType.FREQUENCY_CHANGE`

### 19.3 Due Date Move
- **WEEKLY**: max offset **3 days**
- **Others**: max offset **7 days** (BUG: `validateOffsetByFrequency` always uses the WEEKLY branch)
- Two types: `SCHEDULE_SHIFT` (all future) and `NEXT_DUE_DATE` (only the next one)
- Increments `dueDateMoves`

---

## 20. Full Reference Enums

### PaymentType
```
ACH, CC, PW, DEBIT, VISA, AMEX, DISCOVER, MASTERCARD, OTHER, CASH, CHECK, MONEY_ORDER, DEPOSIT
```

### PaymentStatus
```
PAID, REVERSED, CANCELLED, RETURNED, ERROR, MANUAL_REVERSE, PENDING_REFUND, REFUNDED
```

### CustomerPaymentStatus (portal)
```
PAID, REVERSED, CANCELLED, RETURNED, ERROR, DENIED, PENDING, PENDING_REFUND,
REFUNDED, SENT_TO_BANK, UNKNOWN
```

### AutoPayType
```
NONE, ACH, CC, PAY_WALLET
```

### LogType (Activity Log)
```
IMPORT, REVIEW, DATA_CHANGE, DUE_DATE_MOVES, CORRESPONDENCE, STATUS_CHANGE,
CREDIT_CARD, BANK_ACCOUNT, ACH, PAYMENT, REWIND_REPLAY, DEFAULT, UNDERWRITING,
INTERNAL, INFORMATION, MERCHANT_DATA_CHANGE, FRAUD, ERROR, PROGRAM_DATA_CHANGE,
STATE_CONFIG_CHANGE, PAYWALLET, UWENGINE, ALLOCATION, SKIT_CALL_LOG,
CUSTOMER_ASSISTANCE, ESCALATION, OUTREACH_MERCHANT, OUTREACH_PLATFORM,
OUTREACH_ISR, OTHER, PEO_SUPPORT, POP_SHIPMENT, EMAIL, INBOUND_CALL,
MERCHANT_REVIEW, SOCIAL_MEDIA, NEW_MERCHANT, FREQUENCY_CHANGE
```

### FundingQueueStatus
```
FUNDING, FUNDED, REQUEST_REFUND, REFUNDED
```

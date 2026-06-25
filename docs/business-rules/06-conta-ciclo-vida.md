---
title: Account Lifecycle Management
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/helpers/account-aging.helpers.ts#SEED_DELINQUENCY_DAYS
  - code: src/helpers/settled-in-full.helpers.ts#getSweepWindowDate
  - db: uown_sv_account
  - env: qa2
covers: [receivables, auto-pay, rating-letters, delinquency, account-status, cancellation, paid-out, sweeps]
---

# Account Lifecycle Management
## UOwn Leasing - SVC Platform

Receivables, auto-pay, rating letters, delinquency, account/lead status, autopay management, and paid-out eligibility.

---

## 16. Receivables and Payment Schedule

### Receivable Types

| Type | Description | When created |
|------|-----------|---------------|
| `REGULAR_PAYMENT` | Regular lease installment | Always (schedule) |
| `PROCESSING_FEE` | Processing fee | If fee > 0 |
| `EARLY_PAY_OFF` | EPO amount | If EPO calculated |
| `PROTECTION_PLAN_FEE` | Protection plan fee | Migrated Kornerstone accounts |
| `NSF_FEE` | Insufficient funds fee | NSF event (ACH/CC) |
| `REINSTATEMENT_FEE` | Account reinstatement fee | Reinstatement after cancellation or severe delinquency |
| `MANUAL_FEE` | Manual fee posted by an agent | Manual administrative charge |
| `MISC_FEE` | Miscellaneous / sundry fee | One-off uncategorized charges |

### Tax Calculation on Receivables

```
taxAmount = baseAmount * taxRate
totalAmount = baseAmount + taxAmount
```

### Next Due Amount

Sum of all fees prior to the first regular receivable + the amount of the first regular installment + receivables on the same due date.

### Past Due Amount

```
pastDue = SUM(totalAmount - partialPaymentAmount) for receivables with dueDate <= today
```

---

## 18. Auto-Pay (Automatic Payment)

### Supported Types

`ACH` (bank debit), `CC` (credit card), `NONE`

### Validations

| Auto-Pay | Requires |
|----------|--------|
| ACH | Active bank account with auto-pay enabled |
| CC | Active credit card with auto-pay enabled |

### Automatic Removal by Rating

Ratings that turn off auto-pay (default: C, P, M):
- If the rating matches and ACH is active -> Removes ACH, creates a log and an alert
- If the rating matches and CC is active -> Removes CC, creates a log and an alert

---

## 19. Rating Letters (Account Risk Classification)

### What It Is

The rating letter is a single-letter classification that indicates the **risk/behavior status** of the account. It works as a "collections state" for the account.

### Meaning of Each Rating

> **Source of truth:** `common/src/main/java/com/uownleasing/common/enumeration/RatingLetter.java` — any discrepancy between this table and the enum must be resolved in favor of the enum.

| Rating | Meaning (enum) | Systemic impact (actual SQL filters) |
|--------|--------------------|--------------------------------------|
| `NULL` | Account with no rating — healthy | No exclusion. Standard auto-pay and sweep processing. |
| **P** | Payment Arrangement | Excluded from `ScheduledACHPayments`, `ScheduledCreditCardPayments`, `RerunACH/CC`, `CCDailyScheduledDeniedRerun`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. **Automatically removed after 60 days** (`RemoveRatingLetterSql`). |
| **C** | Confirmed Bankruptcy | The largest exclusion in the system — excluded from `FirstPaymentReminder`, `ScheduledACH/CC`, `RerunACH/CC`, `CustomerPortalReminder`, `CCDailyScheduledDeniedRerun`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. |
| **D** | Pending Bankruptcy | Excluded from `RerunACH/CC`, `CCDailyScheduledDeniedRerun`, `CustomerPortalReminder`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. NOT excluded from the initial scheduled run. |
| **B** | Discharged Bankruptcy | Excluded from `FirstPaymentReminder`, `ScheduledACH/CC`, `CustomerPortalReminder`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. NOT excluded from `RerunACH/CC`. |
| **M** | MR Money Owed | **Not present in any known SQL filter in svc.** A prior doc claimed that `M` turns off auto-pay; the code shows no evidence of exclusion via SQL. Possibly a separate toggle in `cc.auto_pay`/`account.auto_pay_types` — confirmatory investigation TBD. |
| **F** | Fraud (confirmed fraud) | Excluded from the "Settled in Full" email + `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. **NOT excluded** from Scheduled/Rerun/Sticky — confirmed fraud still goes through the collections sweeps. |
| **E** | Pickup Requested | Excluded from the "Settled in Full" email + `CCVintageRun` + `DelinquencyRerunCC`. |
| **U** | Pickup Completed Product (product picked up, customer retained liability) | Excluded from the "Settled in Full" email + `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. |
| **G** | Pickup Completed Settlement (pickup + negotiated settlement) | Excluded from `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. |
| **S** | Sold Accounts (account sold to a debt buyer) | Excluded from `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. **NOT excluded** from Scheduled/Rerun/Sticky. |
| **R** | DNC Dialer/Revoke (do not call / consent revoked) | No known SQL exclusion — probably blocks the auto-dialer/SMS via a separate non-SQL flag. |
| **J** | Opt Out Payment Reminders | Used in `= 'J'` in `CreateSkitDelinquentSweep` (bypasses creation of Skit/dialer/SMS tasks). |
| **L** | Legal (in legal proceedings) | Excluded from `CCVintageRun` + `DelinquencyRerunCC`. |

> **Important notes:**
>
> 1. **There is no "Standard" letter** — a normal account has `rating IS NULL`. The presence of the letter **S** indicates `Sold Accounts`, not "Standard".
> 2. **No SQL filter currently excludes `M`.** Historical documentation mentions that `M` turns off auto-pay, but the code shows no evidence of that behavior via a SQL filter — it may be done through another mechanism (a `cc.auto_pay` toggle, agent intervention, etc.).
> 3. **The "rerun/recovery" sweeps (RerunACH/CC, DelinquencyRerunCC, StickyRecoverSweep) have different exclusion lists from one another** — `StickyRecoverSweep` excludes only `B,C,D,P`, while `DelinquencyRerunCC` excludes `B,C,P,S,D,E,F,G,L,U`. The inconsistency is a candidate for product review.

### How the Rating Changes

| Event | New Rating |
|--------|------------|
| Payment arrangement created | P (previous_rating saved on the arrangement) |
| Payment arrangement failed (Task #446) | null (rating reset, current_rating on the arrangement = null) |
| ACH payment via customer portal with a future date | P |
| Account sold to a debt buyer | S (Sold) |
| Agent changes it manually | Any |

---

## 20. Delinquency and Collections

### How Delinquency Is Tracked

The `delinquencyAsOfDate` field in the schedule summary represents the date of the oldest unpaid receivable. `daysPastDue = days between delinquencyAsOfDate and today`.

### Delinquency Bands and Actions

| Days Past Due | Automatic Action |
|---------------|----------------|
| 31-60 | Delinquency30DayOffer email |
| 61-90 | Delinquency60DayOffer email + SMS |
| 91-150 | Delinquency90DayOffer email + SMS |
| 150+ | Delinquency150DayOffer email + SMS |
| 100 | Special CC rerun `_100_DAY_DELINQUENCY_RUN` |
| Daily | CC rerun `DAILY_DELINQUENCY_RUN` on delinquent accounts |

### Additional Reminders

- `delinquencyReminderEmailSweep`: generic "Past Due" reminders
- `latePaymentNoticeEmailSweep`: monthly notices with the exact number of days past due

---

## 21. Account Status

### ACTIVE

**What it means:** Active lease, customer owing money and making payments.
**When it happens:** Account created/imported from the LOS. Also when a paid-off account is reverted.
**Impact:** Normal payment processing, delinquency monitoring, auto-pay active.

### PAID_OUT

**What it means:** The customer completed all payments through the end of the contract. Lease concluded normally.
**When it happens:** Automatically when the remaining balance is less than or equal to one installment AND the current date >= the last payment date.
**Impact:** No future payments collected. "Paid in Full" email sent. Account closed.

### PAID_OUT_EARLY

**What it means:** The customer paid off early by covering the full balance (but OUTSIDE the 90-day EPO window).
**When it happens:** A payment causes an allocation that covers the full payoff amount.
**Impact:** Account closed. Payoff date recorded.

### PAID_OUT_EARLY_EPO

**What it means:** The customer exercised the early purchase option within 90 days (EPO). Paid the product's "cash" price.
**When it happens:** Total payments (minus fees) >= the EPO amount, within the eligibility window.
**Impact:** All payments are rewound and reallocated to the EPO. Account closed with a special status.

**Automatic reopening on ACH payment return:**

When an ACH payment that paid off the account via EPO is returned by the bank, the account must reopen automatically:

| Step | Sweep | Action |
|-------|-------|------|
| 1 | `sendACHPaymentsSweep` | Sends the payment to Profituity, marks it as SENT |
| 2 | `getSendACHPaymentsStatusSweep` | After ~5 min, checks the status, posts to the account → PAID_OUT_EARLY_EPO |
| 3 | `getStatusDatePaymentsListSweep` | After 2-3 days, checks whether it was returned → marks it as RETURNED |
| 4 | `reverseAchPaymentsSweep` | Reverses the payment and **reopens the account automatically** |

**Status transition:**
```
ACTIVE → (ACH payment sent) → PAID_OUT_EARLY_EPO → (payment returned) → ACTIVE
```

**Impact on production SQL queries:** The PAID_OUT_EARLY_EPO status is considered in the following SQLs:
- `isEligibleForReapproval` - includes EPO accounts for reapproval
- `openToBuyCustomers` / `openToBuyByClientType` - lists available accounts
- `rerun_ach` - includes them for ACH retry
- `getFundingReport` / `getFundingTransactionsForDateRange` - reports
- `paidInFullAccountEmailSweep` - sends the payoff email
- `sendDailyBorrowingBaseReport` - daily report

### CANCELLED

**What it means:** Lease cancelled. Contract voided.
**When it happens:** Fraud, merchant request, cooling-off period, administrative action.
**Impact:** `cancelledDateTime` recorded. Optionally all payments refunded. No future payments.

**CANCELLED → ACTIVE transition (reactivation):**
- Requires the `change_account_status_cancelled_to_active` + `change_account_status` permissions
- The system shows a confirmation modal with warnings:
  - "Refunded payments will NOT be cancelled"
  - "Pending ACH refunds will be marked cancelled and Payments will be re-posted"
- The agent must explicitly check the "Refund Payments" field to decide whether previously refunded payments should be re-posted

### SETTLED_IN_FULL

**What it means:** UOwn accepted a negotiated payment (typically less than the total owed) to close the account. Common for severely delinquent accounts where an AI or human agent calls the customer and offers a settlement.
**When it happens:**
- **Via direct CC:** A CC transaction of type SALE, same-day, marked as `isSettlementPayment = true`, and approved.
- **Via Payment Arrangement (Task #446):** An arrangement of type `SETTLEMENT` with all transactions completed successfully (status = `SUCCESS`). The system automatically transitions the account to SETTLED_IN_FULL when the settlement arrangement is completed.
**Impact:** "Settled in Full" email sent. `settledInFullDateTime` recorded. If the payment is reversed, the account returns to ACTIVE.

### CHARGED_OFF

**What it means:** Account written off as an accounting loss. UOwn determined that the debt is uncollectible (typically 180+ days past due).
**When it happens:** Administrative/batch charge-off process.
**Impact:** Excluded from normal payment processing. May be sold (-> SOLD).

### SOLD

**What it means:** The account's debt was sold to an external debt buyer.
**When it happens:** Portfolio sale process via `DocumentService.setDataForSoldAccount()`.
**Impact:** Account documents sent to the buyer via SharePoint. Rating -> S (Sold). `soldDateTime` recorded.

### CLOSED

**What it means:** Account closed for generic administrative reasons.
**Impact:** No payment processing.

---

## 22. Lead Status

### Application/Underwriting Phase

| Status | Meaning |
|--------|-----------|
| `NEW` | Application received, no processing started |
| `PENDING_UW` | Initial checks passed, underwriting in progress |
| `UW_APPROVED` | Approved by underwriting. Eligible for a contract |
| `UW_DENIED` | Denied by underwriting (credit risk) |
| `UW_REVIEW` | Requires manual review or additional verification (Plaid) |
| `UW_ERROR` | Error in the underwriting process |
| `DENIED` | Denied in a pre-underwriting step (fraud, state, duplicate) |
| `ERROR` | System error during processing |

### Contract/Signing Phase

| Status | Meaning |
|--------|-----------|
| `CONTRACT_CREATED` | Contract generated and sent for signing |
| `SIGNED` | Customer signed the contract electronically |
| `EXPIRED_CONTRACT` | Contract expired without a signature |
| `CANCELLED_CONTRACT` | Contract cancelled before funding |
| `ORDER_CANCELLED` | Merchant order/invoice cancelled |
| `LEASE_MOD_REQUESTED` | Lease modification requested (lead in the process of changing terms) |

### Funding Phase

| Status | Meaning |
|--------|-----------|
| `READY_TO_FUND` | Ready for the funding queue |
| `FUNDING` | Funding process started, money in transit |
| `FUNDED` | Merchant received payment. Account created in SVC |

### Terminal Statuses

| Status | Meaning |
|--------|-----------|
| `EXPIRED` | Approval expired without action |
| `INCOMPLETE` | Application abandoned before UW |
| `CANCELLED_DUP_SSN` | Cancelled by a newer lead with the same SSN |
| `CANCELLED_DUP_DENIAL` | Cancelled due to a denied SSN duplicate |
| `BLACKLISTED` | All of the customer's data added to the blacklist |

### Internal Fraud Statuses (internalStatus)

| Prefix | Service |
|---------|---------|
| `SENTILINK_DENIED/ERROR/SSN_TYPO` | Sentilink |
| `NEUSTAR_DENIED/ERROR` | Neustar |
| `FRAUD_DENIED/ERROR` | SEON |
| `LEXISNEXIS_DENIED/ERROR` | LexisNexis |
| `NEURO_ID_DENIED/APPROVED/ERROR` | NeuroID |
| `INTELLICHECK_FAILED/ERRORED` | Intellicheck |
| `SEON_ID_FAILED/APPROVED` | SEON ID |
| `BLACKLIST_DENIED/APPROVED` | Blacklist |
| `PLAID_PENDING/SUCCESS/FAILED/ABANDONED` | Plaid |

---

## 52. Account Cancellation

### What It Is

The process of closing a lease account, voiding the contract. It can include a full refund of all payments made.

### What It's For

Used when there is confirmed fraud, a merchant request, a legal cooling-off period, or an administrative action that requires voiding the contract.

### How It Works

1. **Account status** changes to `CANCELLED`
2. **Cancellation timestamp** recorded (`cancelledDateTime = now()`)
3. **Mandatory comment** explaining the reason for the cancellation
4. **Activity log** created with the status-change event
5. **Optional refund:** If `refundAllPayments = true`, all applied payments are refunded via `RefundPaymentService`

### Account Cancellation via Lead

When the cancellation is initiated from a lead (LOS system):

| Step | Action |
|-------|------|
| 1 | Validates the lead's existence and its link to an account |
| 2 | Optionally refunds the LOS CC transactions (config-driven) |
| 3 | Only transactions with `action = SALE` and `status = APPROVED` are refunded |
| 4 | Refunded transactions get the `REFUNDED` status |
| 5 | Runs the standard account cancellation |

**Configuration:** `com.uownleasing.svc.service.CancelAccountService.refund.los.payments` (default: `false`)

### How to Trigger

```
POST /uown/svc/cancelAccount/{accountPk}
Body: CancelAccountRequest { comment, refundAllPayments }
```

---

## 58. AutoPay and Financial Instruments Management

### What It Is

A service that automatically syncs the account's automatic payment (AutoPay) methods based on the available financial instruments (bank accounts and credit cards).

### What It's For

Ensures that AutoPay correctly reflects the available payment methods. When a card is added or removed, AutoPay adjusts automatically.

### Synchronization Rules

| Event | AutoPay Action |
|--------|----------------|
| Bank account added | ACH enabled automatically (if not present) |
| Last bank account removed | ACH removed from AutoPay |
| Credit card added | CC enabled automatically (if not present) |
| Last active credit card removed | CC removed from AutoPay |
| Bank account removed but CC exists | CC remains active |
| CC removed but bank account exists | ACH remains active |

### Rating Letter Impact

| Event | Action |
|--------|------|
| Rating changed to `C` (Confirmed Bankruptcy) or `P` (Payment Arrangement) | **Excluded from all payment sweeps** (ACH/CC scheduled, rerun, sticky recover) via SQL filters — behavior equivalent to "AutoPay off" |
| Rating changed to `M` (MR Money Owed) | **Systemic behavior not confirmed** — historical doc claimed it turns off AutoPay, but no current SQL filter excludes `M`. Investigate whether there is a separate toggle in `cc.auto_pay` or manual agent intervention |
| Rating removed (set to `NULL`) | Account returns to standard processing; AutoPay instruments re-eligible |
| Rating changed to another value | Impact varies by SQL filter — see the §19 table above |

### Auditing

Every rating or AutoPay change generates an activity log with the previous and new values. Changes are only logged if the value actually changed.

---

## 69. Auto Paid-Out Eligibility

### What It Is

A service that automatically determines whether an account is eligible for the `PAID_OUT` (paid off) status, based on the remaining balance and due dates.

### What It's For

Automates the closing of accounts that have already paid enough, without the need for manual action.

### Eligibility Criteria

| Criterion | Description |
|----------|-----------|
| **Minimum date** | The current date must be >= the last regular due date (the account cannot be closed before the scheduled due date) |
| **Remaining balance** | `Balance = Contract Total - Total Payments Made` |
| **Payment threshold** | Remaining balance <= the amount of one scheduled regular installment |
| **OR Fee threshold** | Remaining balance <= the total of eligible fees (MANUAL_FEE, MISC_FEE, NSF_FEE) |

### Eligible Fee Types

Configurable via `eligibility.fee.types` (default: `MANUAL_FEE, MISC_FEE, NSF_FEE`). Only these fee types are considered in the fee threshold for eligibility.

### Result

If eligible: the account changes to `PAID_OUT`, the "Paid in Full" email is sent, and the payoff date is recorded.

---


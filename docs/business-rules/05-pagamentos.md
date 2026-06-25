---
title: Payment Processing
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/api/clients/tms-payment.client.ts#TmsPaymentClient
  - code: src/data/test-cards.ts#TEST_CARDS
  - db: uown_sv_credit_card_transaction
  - db: uown_sv_achpayment
  - db: uown_sv_payment_arrangement
  - svc-source: service/cc/sticky/StickyRefundCompletionService.java
  - env: qa2
covers: [credit-card, ach, cc-peek, refunds, payment-arrangements, nsf, sweeps, rightfoot, sticky]
---

# Payment Processing
## UOwn Leasing - SVC Platform

CC payments, CC Peek, ACH, post-payment, PayWallet, CC Idempotent, refunds, payment arrangements and NSF fee.

---

## 11. Credit Card Payments

### Authorization Flow

1. **Kount pre-authorization** (fraud check)
2. If Kount DECLINED -> transaction denied, no gateway call
3. **Gateway token** obtained if needed
4. **Gateway call** to authorize/charge
5. **Response processing** (token, auth code, decision)

### NSF Detection (Non-Sufficient Funds)

A transaction is flagged as NSF if:
- Message contains "Insufficient funds"
- Error code in "50051, 57852"
- Last 2 digits of the code = "51"

### CC Rerun (Retry)

| Situation | Action |
|----------|------|
| First rerun | Creates an NSF fee receivable + a separate RERUN_NSF transaction |
| Subsequent reruns | Increments numberOfTries |
| Past due rerun | If approved, attempts to charge overdue receivables up to a $10,000 limit |

### Daily Denied Rerun (Automatic Daily Retry)

Runs daily, retrying the day's denied/errored CCs. Permanently excludes: expired cards, invalid numbers, closed accounts, stolen cards.

---

## 12. CC Peek (Partial Card Capture)

### What It Is

CC Peek is a mechanism that allows charging the customer's card for **less than the full amount** when the card does not have sufficient balance, instead of failing the entire transaction.

### What It's For

Without CC Peek, a $200 charge on a card with $150 available fails completely (collects $0). With CC Peek, the gateway "peeks" at the available balance, captures $150, and the system later retries the remaining $50. This reduces delinquency and improves cash flow.

### How Consent Is Captured

1. **At contract signing:** The e-sign document contains `preauthyes` and `preauthno` checkboxes
2. **Default:** Consent = `true` (if the customer does not check `preauthno`)
3. The `EsignService` saves the consent on the lead and later on the account

### When CC Peek Is Activated

| Condition (ALL must be true) | |
|---|---|
| Config `sendCCPeek` = true |
| Account has `ccPeekConsent = true` |
| Config `ccPeekOn` = true |
| Not a same-day request transaction (has its own toggle) |

### Impact on Retry

If a CC Peek transaction was approved but captured a partial amount, the rerun is performed for the remaining amount: `rerunAmount = originalAmount - capturedAmount`.

### How to Modify Consent

Internal agents can change the CC Peek consent via `ServicingInformationService`. Every change is recorded in the activity log.

### CC Peek Consent Management by Portal

CC Peek consent behaves differently depending on the portal:

| Portal | Behavior | Editable |
|--------|--------------|----------|
| **Origination** | Displays "CC Peek Consent" below the Credit Card section. Shows the original consent from the contract signing | **No** (read-only) |
| **Servicing** | Displays a "CC Peek Consent" toggle in the Servicing Information section. Allows agents to enable/disable it | **Yes** (editable) |

**Consent date logic:**
- **At contract signing:** If the customer consented → date = signing date
- **Activation in Servicing:** Toggle enabled → date = current activation date
- **Deactivation in Servicing:** Toggle disabled → date removed/hidden

**Persistence (`ConsentService.updateCcPeekConsent`):**
- Null-safe comparison using `Objects.equals()` to detect a real change
- Activity log created **only** if the value actually changes (idempotent)
- Message: `"CC Peek Consent changed from [previous] to [new]"`
- Log type: `DATA_CHANGE`
- Operator username recorded via `ThreadAttributes`

**Important:** Edits made in Servicing do NOT change the display in Origination (Origination always shows the original contract choice).

---

## 13a. Check Payments (Check Payment)

### What It Is

Physical checks received from customers, processed manually by agents via the Servicing portal.

### Required Fields

| Field | Rule |
|-------|-------|
| `paymentDate` | Check date (required) |
| `paymentAmount` | Amount > $0 (required) |
| `status` | Initial: POSTED; evolves to CLEARED or RETURNED |
| `allocationStrategy` | DEFAULT, REGULAR_RECEIVABLES or EPO_ONLY (required) |

### Check Status

| Status | Description |
|--------|-----------|
| `POSTED` | Check received and posted in the system |
| `CLEARED` | Bank clearing confirmed |
| `RETURNED` | Check returned (insufficient funds or invalid) |

### Allocation Strategy

Same rules as CC/ACH payments:
- **DEFAULT** — allocates to overdue receivables + next due
- **REGULAR_RECEIVABLES** — allocates only to regular installments (no EPO)
- **EPO_ONLY** — allocates only to the EPO balance

### Reverse/Refund Restriction

| Payment Type | Reverse | Refund |
|-------------------|---------|--------|
| `Check` | **Allowed** (with `reverse_payment` permission) | **NOT available** |
| `ACH_Payment` | Allowed | Allowed (partial or full) |
| `CC_Payment` | Allowed | Allowed (partial or full) |

**Rule:** Check payments (`Check`) can only be REVERSED — the refund option is hidden in the Servicing portal for this type.

**Partial refund:** The option to refund the fee (`refundFee`) is only available on a full refund — on a partial refund, `refundFee` is forced to `false`.

---

## 13. ACH Payments (Bank Debit)

### What It Is

ACH (Automated Clearing House) is the U.S. bank transfer system. UOwn debits amounts directly from the customer's bank account via Profituity (ACH processor).

### ACH Payment Creation

| Validation | Detail |
|-----------|---------|
| Bank data required | Error if null |
| Auto-pay default | `false` if null |
| Customer name | Filled in automatically if empty |
| Default account type | CHECKING |

### Rating Letter via Customer Portal

If the payment is of type REQUEST, with a future date, made from the "customer portal": rating updated to `P` (Promise to pay).

### NSF Fee on ACH

| Condition (ALL must be true) | |
|---|---|
| Config `create.nsf.fee.receivable.on.rerun` = true |
| Type: SCHEDULED |
| Not a rerun (originalACHPk = null) |
| First attempt (numberOfTries = 1) |

**Amount:** State-specific (StateConfigurations), fallback $15.00. INSTORE = merchant state, ONLINE = customer state.

### ACH Refund

Creates a new payment with `achType = ACHCredit`. If partial, creates a new PAID for the remainder.

### RightFoot Balance Check (R1.53.0)

For **ACTIVE accounts with ACH auto-pay in delinquency**, release 1.53.0 (svc#540) introduced the **RightFoot balance check**: before creating/retrying an ACH (delinquent rerun), the bank balance is checked to reduce NSF returns. An ACH is only created when the balance check returns `status='SUCCESS'`, same routing+account number, and `exposure + requested_amount + $100 <= balance`. The new ACH carries the FK `right_foot_balance_check_pk` and `process_type=DAILY_RERUN_DELINQUENT`. **Duplicate guard:** no new `DAILY_RERUN_DELINQUENT` ACH if one is already in-flight (`PENDING/PICKED_TO_SEND/STATUS_UPDATE_PENDING/SENT`) for the account. Full vendor, sweeps and webhook: [09-integracoes-externas.md §48](09-integracoes-externas.md).

---

## 14. Post-Payment and Receivable Allocation

### Allocation Strategies

| Strategy | Behavior |
|------------|--------------|
| DEFAULT | Allocates to overdue and next-due receivables |
| EPO_ONLY | Allocates only to the EPO receivable |
| Catch-all | Allocates to ALL unpaid receivables |

### Payment Without a Receivable

If there is no receivable to allocate to: creates an alert "Payment received but is not allocated to any receivable or epo".

---

## 37. PayWallet (Payroll Payments)

### What It Is

PayWallet is a **payroll deduction** service where the customer's employer deducts the lease amount directly from their salary.

### What It's For

An alternative to credit card and ACH. Payroll payments have a much lower delinquency rate because they are deducted before the customer receives their salary.

### How It Works

1. **PayWallet generates an Excel file** (.xlsx) with collected payments
2. **File deposited via SFTP** in the `/paywallet` folder
3. **Daily sweep** (`processPayWalletPaymentsSweep`) reads the file
4. **Parallel processing:** parses each line with ExecutorService
5. **Extracted data:** Date, customer name, collection account, disbursement account, lease reference, amount, trace number
6. **Deduplication:** Checks for existing payments by date + trace number
7. **Recording:** Converts to `PaymentInfo` and posts to the account
8. **Archiving:** Moves the processed file to `/pw/`, deletes the original

### How to Activate

- The sweep runs automatically at midnight
- To process manually: `POST /uown/svc/triggerScheduledTask/processPayWalletPaymentsSweep`
- The service depends on a configured SFTP connection

### What to Check

- New payments with source "PayWallet" on the account
- File moved from `/paywallet` to `/pw/`
- Processing logs for parsing errors

---

## 47. CC Idempotent (CC Timeout Retry)

### What It Is

A service that **retries CC transactions that timed out** (no gateway response) while ensuring **idempotency** -- it does not charge twice.

### What It's For

Payment gateways may fail to respond (network timeout, unavailability). The system needs to know whether the charge went through or not before retrying.

### How It Works

1. The sweep identifies transactions with TIMEOUT status
2. For each one, it queries the gateway for the real status
3. If charged: updates to APPROVED
4. If not charged: retries with the same reference (idempotent key)
5. If inconclusive: flags for manual review

### How to Activate

The `IdempotentCCSweep` sweep runs automatically. To trigger: `POST /uown/svc/triggerScheduledTask/IdempotentCCSweep`

---

## 53. Refund Payment

### What It Is

A service that processes refunds of already-completed payments, supporting both ACH and CC payments, with the ability to do a partial or full refund.

### What It's For

Needed when a payment must be reversed -- due to an error, account cancellation, fraud, or an agreement with the customer.

### Refund Types

| Type | Payment Method | Action |
|------|---------------------|------|
| **Full Refund** | ACH or CC | Reverses the full amount of the payment |
| **Partial Refund** | ACH or CC | Reverses part of the amount, creating a new record for the remainder |

### CC Refund Logic

1. Retrieves the CC transaction associated with the payment
2. Calls `CCRunRefundService` to execute the refund at the gateway
3. **Only proceeds** if the refund transaction returns status `APPROVED`
4. Detects a re-refund by checking whether the original transaction already had status `REFUNDED` or `PARTIALLY_REFUNDED`

### Partial Refund Logic

When the refund amount is less than the original payment amount:

1. Original payment marked as `REVERSED` with a reversal date and timestamp
2. **New payment record** created for the remaining amount (`originalAmount - refundAmount`)
3. New payment inherits: allocation strategy, payment date, status `PAID`

### Batch Refund

The service accepts a list of payment PKs (comma-separated) and processes each one individually. If one refund fails, the others continue -- failures are collected and returned in the consolidated response.

### How to Trigger

```
POST /uown/svc/refundPayment/{paymentPk}?amount={amount}&comment={reason}
```

---

## 53b. Sticky — Declined CC Recovery and Refund (R1.53.0)

Sticky is the **declined credit card recovery/dunning** engine (vendor `com.uownleasing:sticky`). Per-account state is in `uown_sticky` (`recovery_status`). Release 1.53.0 brought several code-confirmed changes:

**Cancellation of non-cancelable recovery:**
- The `StickyRecoverCancelSweep` only cancels non-terminal recoveries (`recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')`, non-ACTIVE account). So `RECOVERED/FAILED/CANCELED` are the **terminal** statuses.
- When a cancel is requested, if Sticky responds "Cannot cancel transaction" (HTTP 400 — transaction already terminal on the vendor side), svc does **NOT** fail: it marks the recovery **CANCELED locally**, logs WARN and writes an INTERNAL activity log. A different non-whitelisted error => `IllegalStateException`. A whitelisted error => success (no marking).

**Prior attempts + original transaction time (svc#564):**
- When submitting a declined CC to Sticky, svc sends the **history of previous declines** (`error`, `error_code`, `completed_time`) and the **count** (`null` if empty), via the `StickyPriorAttempts` SQL (self-join on `uown_sv_credit_card_transaction` by `account_pk`+`amount`, types `RERUN`/`DAILY_SCHEDULED_DENIED_RERUN`). This gives Sticky's dunning engine the history to decide the retry cadence.
- **[WARNING — drift]** despite the commit name ("UTC"), the merge code resolves the timestamps via **`ZoneId.of("America/New_York")`** (`.toInstant()`), **not UTC**. Verify against the DB before asserting recovery times in tests.

**Duplicate payment checks:**
- On refund confirmation, svc fetches **all** PAID `SvPayment` for the `ccPk` (most recent first). If there is **>1** PAID, it is a duplicate payment situation: it logs WARN ("Multiple PAID SvPayments found ... using most recent") and proceeds with the **most recent** one — it does **not** block/abort. An empty list => activity log "no payment found" and returns.

**Refund idempotency (R1.53.0_add_sticky_refund_idempotency):**
- There is no dedicated idempotency key; the protection is via the **PAID state machine**: refund is only allowed if the payment is `STICKY` **and** `PAID`. Reversing it removes the PAID status, so a 2nd attempt is rejected ("Only PAID Sticky payments can be refunded") and late webhooks find no PAID row (no-op). Completes inline only when Sticky returns `REFUNDED` and the payment is still `PAID`.

**Activity log (rule #13):** cancel-local, refund-confirmed/no-payment-found and refund-submitted write `LogType.INTERNAL` — assert on them in tests.

**Sources:** `service/cc/sticky/{StickyRecoverCancelService,StickyRecoverCancelSweepService,StickyRecoverSubmissionService,StickyRefundCompletionService,StickyRefundPaymentService}.java`, `resources/sqls/StickyPriorAttempts.sql`. Enum/vendor internals in `com.uownleasing:sticky` (not on disk) — **[HYPOTHESIS]** where indicated. Environment gotchas (sandbox-only): knowledge-base `sticky-recover-cancel-sweep.md` / `sticky-payment-refund.md`.

---

## 54. Payment Arrangement

### What It Is

A mechanism to create payment agreements with delinquent customers, processing multiple CC or ACH transactions at once and updating the account status. As of task #446, arrangements are persisted in the `uown_sv_payment_arrangement` entity with tracking of status, type, and linkage to individual transactions.

### What It's For

When a customer is past due, an agent can negotiate a payment plan. The arrangement allows scheduling and processing multiple payments in a single operation. SETTLEMENT-type arrangements allow paying off the account for a negotiated amount (typically less than the total owed).

### Entity: uown_sv_payment_arrangement (Task #446)

| Column | Type | Description |
|--------|------|-----------|
| `pk` | BIGINT (PK) | Primary key |
| `account_pk` | BIGINT (FK) | Linked account |
| `start_date` | DATE | Arrangement start date |
| `end_date` | DATE | Arrangement end date |
| `frequency` | VARCHAR | Payment frequency (WEEKLY, BI_WEEKLY, etc.) |
| `amount` | DECIMAL | Amount of each arrangement installment |
| `arrangement_type` | VARCHAR | Type: `NORMAL` or `SETTLEMENT` |
| `payment_type` | VARCHAR | Payment method (CC, ACH) |
| `username` | VARCHAR | Agent who created the arrangement |
| `previous_rating` | CHAR(1) | Account rating before the arrangement |
| `current_rating` | CHAR(1) | Current account rating |
| `is_active` | BOOLEAN | Whether the arrangement is active |
| `payment_arrangement_status` | VARCHAR | Status: `NOT_STARTED`, `IN_PROGRESS`, `SUCCESS`, `FAILED` |
| `notes` | TEXT | Agent notes |

### FK on the Transaction Tables (Task #446)

The transaction tables now have an FK to link each transaction to the arrangement that originated it:

| Table | New Column |
|--------|-------------|
| `uown_sv_credit_card_transaction` | `payment_arrangement_pk` |
| `uown_los_credit_card_transaction` | `payment_arrangement_pk` |
| `uown_sv_achpayment` | `payment_arrangement_pk` |

### Arrangement Types (ArrangementType)

| Type | Description | Impact on Closure |
|------|-----------|------------------------|
| `NORMAL` | Standard payment agreement (promise to pay) | On successful completion, arrangement marked as SUCCESS. Account remains ACTIVE |
| `SETTLEMENT` | Negotiated settlement agreement (reduced amount) | On successful completion, arrangement marked as SUCCESS **and the account changes to SETTLED_IN_FULL** |

### Arrangement State Machine (PaymentArrangementStatus)

| Status | Description |
|--------|-----------|
| `NOT_STARTED` | Arrangement created, no transaction processed yet |
| `IN_PROGRESS` | At least one transaction processed, pending transactions remain |
| `SUCCESS` | All transactions completed successfully |
| `FAILED` | At least one transaction failed |

### Status Transition Logic (Task #446)

The arrangement status evaluation follows the decision matrix below, run after each transaction is processed:

```
1. Did any linked transaction fail?
   YES → status = FAILED, is_active = false, current_rating = null
   NO → continue...

2. Are there pending transactions (PENDING)?
   YES → status = IN_PROGRESS
   NO → continue...

3. All transactions completed successfully:
   - If arrangement_type = SETTLEMENT → status = SUCCESS, account → SETTLED_IN_FULL
   - If arrangement_type = NORMAL → status = SUCCESS
```

**Transition details:**

| Condition | New Status | is_active | current_rating | Account Status |
|----------|-------------|-----------|----------------|-----------------|
| Any transaction failed | `FAILED` | `false` | `null` | No change (ACTIVE) |
| No failure + pending exist | `IN_PROGRESS` | `true` | Kept | No change |
| No failure + no pending + SETTLEMENT | `SUCCESS` | `false` | Kept | `SETTLED_IN_FULL` |
| No failure + no pending + NORMAL | `SUCCESS` | `false` | Kept | No change |

### Synchronous Processing (CC) vs Asynchronous (ACH)

| Method | Processing | Initial status | Final status (success) | Requires sweep? |
|--------|--------------|----------------|------------------------|--------------|
| **CC** | **Synchronous** — transactions processed within the same HTTP request | `NOT_STARTED` (momentary) | `SUCCESS` | No (sweep is informational) |
| **ACH** | **Asynchronous** — payments created as PENDING; processed by Profituity via sweeps | `NOT_STARTED` | `SUCCESS` | **Yes** (sendACHPaymentsSweep + getStatusDatePaymentsListSweep) |

**Testing implication:**
- CC arrangements: after `makeCreditCardPayments`, the status is already `SUCCESS` — do not wait for the sweep.
- ACH arrangements: after `createOrUpdateAchPayments`, the status is `NOT_STARTED` — wait for the sweep and poll to reach `SUCCESS`.

### How It Works

#### CC Transactions

1. **First transaction:** Card is authorized and tokenized (`authorizeAndTokenizeCard`)
2. **Subsequent transactions:** Use the same token from the first transaction
3. Each transaction is processed **synchronously** within the same HTTP request — the arrangement already reaches `SUCCESS` before the endpoint returns
4. The agent username is recorded on each transaction for auditing
5. Each CC transaction receives the parent arrangement's `payment_arrangement_pk`

#### ACH Payments

1. Each ACH payment receives the current agent's username
2. Payments are created or updated individually via `createOrUpdateAchPayment` with status `PENDING`
3. Each ACH payment receives the parent arrangement's `payment_arrangement_pk`
4. The field `ach_process_type = 'REQUEST'` must be sent so that `sendACHPaymentsSweep` processes the payment regardless of receivable due date (without this field, the sweep only picks up payments with a receivable due at D+1)

### Payment Sweeps and Arrangements (Task #446)

The payment-sending sweeps consider the arrangement when selecting transactions:

#### sendCreditCardPaymentsSql

Selects pending CC transactions to send to the gateway:
- `status = 'PENDING'`
- `posting_date <= CURRENT_DATE`
- Account with `account_status = 'ACTIVE'`
- Rating **different** from `B` and `C` (blocked/collections accounts are excluded)
- Result: transaction marked as `PICKED_TO_SEND`

#### sendACHPaymentsSql

Selects pending ACH payments to send to Profituity:
- `status = 'PENDING'`
- `posting_date <= CURRENT_DATE + 1` (ACH has D+1 lead time) **OR** `ach_process_type = 'REQUEST'` (arrangement payments — they ignore the due-date window)
- Rating **different** from `B` and `C`
- Result: payment marked as `PICKED_TO_SEND`

**Note:** ACH arrangement payments created via API must include `ach_process_type = 'REQUEST'`. Without this field, the sweep only processes them if a receivable is due at D+1 — on accounts without a near-due receivable, the payment would get stuck in PENDING.

#### Full cron chain (ACH arrangement → terminal) — confirmed dev3 2026-06-01

| Sweep / Listener | Schedule | Effect |
|------------------|----------|--------|
| `SendACHPaymentsSweep` | every 5 min | `PENDING → PICKED_TO_SEND` |
| `getSendACHPaymentsStatusSweep` | every 6 min | polls Profituity (send status) |
| `getStatusDatePaymentsListSweep` | daily 20:30 | final status of the day |
| `PaymentArrangementACHListener` | processor callback | only on `SETTLED` / `RETURNED` / `ACK_ERROR` → updates the arrangement |

**The arrangement only moves out of `NOT_STARTED` at a terminal payment state.** Intermediate states (`PENDING → PICKED_TO_SEND → SENT`) do NOT promote the arrangement — only a terminal state (`SETTLED`/`RETURNED`/`ACK_ERROR`) triggers the listener.

**Implication for an env without a real processor (dev3):** without Profituity, the ACH stops at `PICKED_TO_SEND` and never reaches terminal; `recalculateAchArrangementStatus` returns `IN_PROGRESS` (`PICKED_TO_SEND` is a pending status). To synthesize the terminal state in a test: UPDATE the payments to `SETTLED` (Exception 3 — explicit user authorization) BEFORE the recalc. The finalization logs (`Arrangement finalized as SUCCESS/FAILED`) are only emitted by the listener on a REAL callback — never by the synthetic paths. See skill [[application-lifecycle]] pitfalls #83/#84 and [[payment-flows]] sweep chain section.

### Impact on Rating

If the flag `paymentArrangement = true`:
- **Account rating letter** updated to `P` (Promise to Pay) — **persisted** in `uown_sv_account.rating`
- **previous_rating** saved on the arrangement for auditing
- **Existing auto-pay** is preserved and kept
- If the arrangement fails: `current_rating` reverts to `null` (rating reset)

**CONFIRMED BEHAVIOR (dev3, 2026-06-01) — corrects the old "known bug" note:** the `rating` column in `uown_sv_account` **IS PERSISTED** as `'P'` on arrangement creation, for both ACH and CC. The previous note (Task #446) claimed that `AccountFinancialInfoService.updateRatingLetterAndAutoPay` logged the activity log "Rating letter changed from null to P" but did NOT persist the entity — that is **incorrect/outdated**. DB-confirmed: the field persists correctly.

**Rating reset on CC SUCCESS (correct business behavior):** when a CC arrangement completes successfully (`SUCCESS`), the `rating` is reset to `null` and auto-pay is re-enabled — the account has returned to its normal state after being paid off. This is NOT a bug; it is the expected behavior. (A `FAILED` arrangement also resets `current_rating` to `null`, as per the transitions table.)

> Cataloged in skill [[payment-flows]] (section "Rating letter in Payment Arrangement", pitfall #18) and [[application-lifecycle]].

### How to Trigger

- **Via TMS:** `POST /uown/tms/makeCreditCardPayments` (CC)
- **Via TMS:** `POST /uown/tms/makeAchPayment` (ACH)
- **Via Admin:** Collections agent interface

---

## 71. Outstanding Balance Validation (Overpayment Prevention)

### What It Is

A validation rule that prevents charging the customer an amount greater than the account's remaining outstanding balance.

### What It's For

Protects against excessive charges that would result in a negative balance (credit) on the account, avoiding the need for a refund and accounting complications.

### Rule

```
IF charge_amount > remaining_outstanding_balance:
  REJECT the charge
```

**Remaining outstanding balance** = Total contract - Total payments already made (allocated).

### Impact

- An agent cannot process a payment above the balance
- If for some reason an excessive charge is processed, the UOwn agent must reverse the excess manually
- Applies to all payment methods (CC, ACH, PayWallet)

---

## 57. NSF Fee by State (NSF Fee)

### What It Is

Determines the NSF fee amount (Non-Sufficient Funds) for an account, with support for state-specific amounts.

### What It's For

When an ACH or CC payment fails due to insufficient funds, a fee is charged. The amount may vary by state according to local regulations.

### Determination Logic

1. **Default amount:** Config `com.uownleasing.svc.service.AccountFeeService.nsfFee` (default: `$15.00`)
2. **State determination:**
   - `INSTORE` merchant -> uses the **merchant** state
   - `ONLINE` merchant -> uses the **customer's address** state
3. **State override:** If the state's `StateConfigurations` has an NSF fee configured and > $0, uses the state amount
4. **Fallback:** If there is no state override, uses the default amount

---

## 72. Payment Receipt — Balance and "You Save" (R1.53.0)

The payment receipt shows two values: **Balance** (remaining lease obligation) and **"If you pay off now you save"** (`savedAmount = balance - payOffAmountBeforeEPOExpiry`, shown **only when > 0**).

- **Fix:** the balance was calculated by an inline SQL subquery (`totalContractAmountWithTaxAndFees - SUM(PAID)`) that **ignored the fees** (protection plan, NSF, reinstatement, misc), producing a low or **negative** balance when there were fees — also corrupting the "You Save". The calculation moved to Java `AccountAmountsService.getContractBalance()`, which **includes all fees** (`totalContractAmountWithTaxAndFees + protectionPlanFeesToDate + otherFees - totalPaidAmount`), injected into the SQL via the `:contractBalance` parameter (default `0` when null, `HALF_EVEN` rounding to 2 places). The template only renders "You Save" when `savedAmount > 0`.
- **ExtBrand (svc, branch `R1.53.0_ExtBrand-Png`):** the brand logo on the **PayNearMe** payment links (email/SMS) became `company.name().toLowerCase() + ".png"` (`uown.png`, `kornerstone.png`; company null => `uown.png`). Method `getExtBrandForCompany` in `config/PayNearMeConfig.java`; used by `PayNearMeLinkDeliveryBridgeImpl`.
- **Sources:** `pojo/CommonDataPojo.java:199-208`, `service/AccountAmountsService.java:35-104`, `service/PaymentReceiptService.java:104-127`, `resources/correspondence/templates/payment-receipt.sql`, `templates/payment-receipt-email.html`, `config/PayNearMeConfig.java:76-81`.

---

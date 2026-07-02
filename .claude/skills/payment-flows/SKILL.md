---
name: payment-flows
description: Use when a test or task touches payment in the UOWN platform — CC/ACH arrangements, EPO/payoff, allocation strategy, settled-in-full, refund, 13m vs 16m program eligibility, due amounts, CC sweep, receivables. Triggers on file paths like `tests/**/*payment*`, `tests/**/*epo*`, `tests/**/*cc*`, `tests/**/*finalize*`, `src/api/clients/payment-arrangement.client.ts`, `src/api/clients/credit-card.client.ts`, `src/api/clients/svc-payoff.client.ts`, `src/pages/servicing/payment-transaction.page.ts`, or business mentions of "pay credit card today", "make ACH payment", "EPO Only", "Payment/EPO", "payoff amount", "settle in full", "16 meses", "Kornerstone payment".
disable-model-invocation: true
---

# Payment Flows — UOWN domain knowledge

> Everything a payment test needs to know. For detailed endpoint tables, DB columns, enums, and activity log patterns, see [references/endpoints-tables.md](references/endpoints-tables.md).

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO TEST** — patterns, sequences, pitfalls. The **canonical product behavior** (enums `PaymentStatus`/`AllocationStrategy`, state machine, sweep rules) does NOT live here — the single source is `docs/business-rules/05-pagamentos.md` + `04-calculos-financeiros.md` and `src/api/clients/payment-arrangement.client.ts`. To resolve a topic, run `node scripts/docs-tooling.mjs resolve cc-payments` (or `ach-payments`, `nsf-fee`, `sweeps`). Recent investigations: `docs/knowledge-base/*sticky*`. **Do not duplicate product rules here** — they drift.

## When to apply

Apply when a test/PR touches:
- Origination contract page (CC_AUTH_PASSED flow)
- Servicing portal payments (CC/ACH, Payment History, CC Transactions, Due Amounts)
- API payment arrangement (`PaymentArrangementClient`)
- EPO/Payoff (`SvcPayoffClient`)
- Settled In Full (sweep, email, correspondence)
- Refund flows (PT refund, status revert)
- 13m vs 16m program selection

Do NOT apply for: signing (use `gowsign-knowledge`), fraud-vendor (use `fraud-vendors-knowledge`), merchant-config (use `merchant-preflight`).

## Lease state machine (payment context)

```
UW_APPROVED -> CC_AUTH_PASSED -> CONTRACT_CREATED -> SIGNED -> SETTLED -> FUNDING -> FUNDED -> ACTIVE
 |
 SETTLED_IN_FULL
```

- `CC_AUTH_PASSED`: CC + bank info submitted via `authorizeCreditCard`. E-sign becomes active.
- `FUNDED`: becomes `uown_sv_account`. Receivables created. All payments via `/uown/svc/...`.
- `SETTLED_IN_FULL`: payoff completed. Sweep email runs.

**Rule: no servicing payment before FUNDED** — `makeCreditCardPayments` on a lead still in `CONTRACT_CREATED` returns 400.

## Canonical setup sequence

Always prefer `driveLeadToFunding` from `src/helpers/api-setup.helpers.ts`:

```typescript
const { merchant, applicant, order } = buildTestData({ state: 'NY', merchant: 'TireAgent', orderTotal: '1500' });
const ctx = await driveLeadToFunding(api, merchant, applicant, order);
// ctx.accountPk ready for payment arrangement
```

Calls `ensureMerchantReady` (rule 12), fills bank info for Kornerstone, avoids timing pitfalls.

## Payment types summary

| Type | Client method | Key notes |
|------|--------------|-----------|
| CC arrangement | `paymentArrangement.makeCreditCardPayments` | `chargeFee=true` mandatory (Pitfall #4) |
| ACH arrangement | `paymentArrangement.createOrUpdateAchPayments` | |
| CC auth (contract) | `creditCard.authorizeCreditCard` | Pre-CC_AUTH_PASSED, Origination only |
| CC tokenize | `creditCard.createOrUpdateCreditCard` | Returns `creditCardPk` + `ccToken` for card-on-file |
| Payoff | `svcPayoff.getPayoffAmount` | Integer/decimal cents |
| Settlement | `svcPayoff.getServicingInfo` | `settlementAmount` field (when eligible) |

> Full endpoint table with all methods: [references/endpoints-tables.md](references/endpoints-tables.md)

## Refund / Reverse via Servicing (dev3 2026-06-01)

**Correct screen:** `/payment-history/{accountPk}` (History - Payments), NOT `/payment-transaction`. The Transaction screen shows a financial summary but does NOT have a per-row reverse icon.

- **Page object:** `PaymentHistoryPage` (`src/pages/servicing/payment-history.page.ts`)
- **Reverse icon:** `svg[data-icon="arrow-rotate-left"]` (NOT `.fa-undo`)
- **`reverseReason` is a React Select** (`<div>`, NOT a native `<select>`): select via click on the control + click on the option. `selectOption` does NOT work. Confirm `tagName` via `browser_evaluate` before any assert.
- **Dropdown options (exact text in DOM):** "Reverse", "Fully Refund", "**Partially** Refund" (NOT "Partial Refund" — the enum `ReverseReason.PARTIAL_REFUND` has the wrong text value)
- **Amount field (`#paymentAmount`)** is visible ONLY when "Partially Refund" is selected
- **Activity log:** refund goes to `uown_sv_activity_log` (Servicing action), NOT `uown_los_lead_notes` (LOS) — same table as Move Due Date

Cross-links: application-lifecycle pitfalls #77 (screen) and #78 (React Select). Page object catalog in [[page-object-pattern]].

**Reverse now available on `STICKY`/`PAID` rows (servicing#519, MR !700, merged 2026-06-30).** Before this, a Sticky-recovered row only offered "Fully Refund". Reverse is ledger-only (no Sticky API call, `uown_sticky` untouched); Fully Refund is unchanged. Canonical rule: `resolve cc-payments` → `05-pagamentos.md` §13a/§53. Recent investigation: `docs/knowledge-base/sticky-payment-refund.md`. **Automation gap (no code written by this skill — for `qa-implementer`):** no `.spec.ts` exercises this operation yet; `PaymentHistoryPage` has no method to read the Servicing `/customer-information/{accountPk}` "Notes / Activity Log" table (`<table role="table">`, distinct DOM from Origination's `.rdt_Table`) nor the account balance fields (Contract Balance / Amount Past Due / Next Payment — only a Website `ws*` equivalent exists). See `.claude/oracles/sticky-reverse-refund.md` Pendências #2/#3 and [[page-object-pattern]] catalog gap notes.

## Make Payment via Servicing (modal `#makePayment`, dev3 2026-06-01)

**ACH Make Payment is ASYNCHRONOUS.** When submitting ACH via the `#makePayment` modal, the IMMEDIATE (synchronous) effect is:
- `uown_sv_achpayment` with `status='PENDING'`, `amount=X`, `ach_process_type='REQUEST'`
- Synchronous activity log in `uown_sv_activity_log`: `ADDED : ACHPayment[...status=PENDING...amount=X...]`

What does NOT exist immediately (only after the sweep, via cron `CreateScheduledACHPaymentsSweep` at 19:00 daily):
- `uown_sv_payment` row
- `ADDED : Payment[paymentType=ACH...]` DATA_CHANGE log
- `status='PICKED_TO_SEND'` in `uown_sv_achpayment`

**Rule for tests:** Assert `uown_sv_achpayment WHERE status='PENDING'` + `ADDED : ACHPayment` log. NEVER assert `uown_sv_payment` for ACH within a reasonable timeout. Diagnostic signal: ACH assert times out at 60s despite a success toast = waiting for post-sweep state that never arrives.

**Make Payment accepts overpayment INTENTIONALLY.** The `#makePayment` modal has NO upper-limit validation. An amount > remaining balance (or > EPO payoff) is accepted: CC SALE APPROVED for the submitted amount, `uown_sv_payment` row created, log `ADDED : Payment[...]`, account transitions to `PAID_OUT_EARLY_EPO` if amount >= EPO amount. Confirmed by the user as expected behavior — excess refund is a separate back-office process. Overpayment tests must assert the positive behavior (payment created, CC APPROVED), NOT rejection.

Cross-links: application-lifecycle pitfalls #79 (ACH async) and #80 (overpayment accepted).

## Payment Arrangement via Servicing UI (modal Make Payment, dev3 2026-06-01)

Creating a **Payment Arrangement** (installment plan) via the Make Payment modal in Servicing. Different from the one-shot Make Payment above: here the "Payment Arrangement" checkbox opens Start Date / End Date / Frequency + an auto-populated installment table.

- **Page objects:** `ServicingBasePage.makeCcPaymentArrangement` (CC) and `ServicingBasePage.makeAchPaymentArrangement` (ACH, created 2026-06-01). Common schedule via private `fillArrangementSchedule`.

- **Arrangement Type is an EXPLICIT React Select in the UI, NOT backend-derived.** The modal has `label[for="paymentArrangementType"]` with options `NORMAL` / `SETTLEMENT`. The old JSDoc for `makeCcPaymentArrangement` (2026-03-17) said "UI does NOT expose an explicit arrangementType field; backend derives it from amount" — that comment was WRONG/outdated. Selector: `SELECTORS.arrangementTypeDropdown` (label-scoped `label[for=paymentArrangementType] ~ div[class*=control]`). Confirmed via DOM-first dev3 2026-06-01.

- **Frequency dropdown:** options `Weekly` | `BiWeekly` | `Monthly` | `SemiMonthly` — use **exact regex** ("Weekly" as a substring also matches "BiWeekly").

- **Date pickers `#startDate` / `#endDate` IGNORE `fill` / `type` / `pressSequentially`.** They are React-controlled date pickers rendered as `<input type="search">` (same DatePicker as `application-wizard.page.ts`). Writing via `fill`/`type` does NOT trigger the `onChange` that React observes → endDate stays = startDate = today → **always 1 installment** (this was the root of bugs F-001 and F-007/S7). Set via native `HTMLInputElement.prototype.value` setter + dispatch of `input`/`change` events (existing pattern in `application-wizard.page.ts`). Cross-link: application-lifecycle pitfall #85.

- **Auto-distribution:** `totalPaymentAmount` (editable input, auto-populated from the schedule) is distributed automatically across the generated installments. With the date picker correctly filled via native setter, `today → today+28` Weekly generates **5 installments** (F-007/S7 RESOLVED 2026-06-01 — it was not a product bug, it was the date picker ignoring the text).

- **ACH vs CC (post-submit state):**
 - **ACH** = arrangement `status=NOT_STARTED` + `uown_sv_achpayment` installments `PENDING` (ASYNCHRONOUS — promoted to `PICKED_TO_SEND` only after the daily sweep). DB-confirmed dev3: arrangement pk77 acct138.
 - **CC single-installment** = SYNCHRONOUS, arrangement `status=SUCCESS` in the same request; SALE transaction created with `payment_arrangement_pk` set. DB-confirmed dev3: arrangement pk72 acct141 → SALE APPROVED.
 - **CC multi-installment** = arrangement stays in **`IN_PROGRESS`**, NOT `SUCCESS`. Only the installment with `posting_date = today` processes synchronously (APPROVED); future installments (`posting_date > today`) stay `PENDING` until their posting date arrives. **This is the CORRECT product behavior** — NOT a bug. `simulateCcSweepForArrangement` (date-gated `posting_date <= CURRENT_DATE`) does NOT unblock future ones. In envs without a processor (dev3): use `db.approveAllPendingCcSalesForArrangement(arrangementPk)` (no date gate, authorized stand-in Exception 3, same pattern as S4/S5) + `recalculateArrangementStatus`. DB-confirmed dev3: arrangement pk100 with 5 SALEs (pk3328 APPROVED + pk3329-3332 PENDING). Cross-link: application-lifecycle pitfall #86.

Cross-links: application-lifecycle pitfalls #82 (explicit Arrangement Type UI), #85 (date picker native setter), #86 (CC multi-installment IN_PROGRESS). Page object catalog in [[page-object-pattern]]. Helper catalog in [[helpers-catalog]].

## ACH sweep chain + arrangement finalization (dev3 2026-06-01)

**Confirmed cron chain (ACH arrangement → terminal):**

| Sweep / Listener | Schedule | Effect |
|------------------|----------|--------|
| `SendACHPaymentsSweep` | every 5 min | `PENDING → PICKED_TO_SEND` |
| `getSendACHPaymentsStatusSweep` | every 6 min | polls Profituity (submission status) |
| `getStatusDatePaymentsListSweep` | daily 20:30 | final status for the day |
| `PaymentArrangementACHListener` | processor callback | only on `SETTLED` / `RETURNED` / `ACK_ERROR` → updates the arrangement |

**Intermediate states do NOT advance the arrangement.** `PENDING → PICKED_TO_SEND → SENT` leave the arrangement in `NOT_STARTED`. Only a terminal payment state (`SETTLED`/`RETURNED`/`ACK_ERROR`) triggers the arrangement update (app-lifecycle pitfall #84). Confirmed dev3: arrangements 63/64/65 with payments in `SENT` and arrangement in `NOT_STARTED`.

**Env without a real processor (dev3): ACH gets stuck at `PICKED_TO_SEND`.** Without real Profituity, there is no callback — the payment never reaches a terminal state, and `recalculateAchArrangementStatus` returns `IN_PROGRESS` (since `PICKED_TO_SEND ∈ PENDING_STATUSES`). To synthesize a terminal state: UPDATE payments to `SETTLED` (Exception 3 — explicit user authorization required) BEFORE the recalc → arrangement advances to `SUCCESS` (app-lifecycle pitfall #83).

**`@blocked-by-missing-log` in synthetic paths.** Finalization logs (`Arrangement finalized as SUCCESS`/`FAILED`) are only emitted by `PaymentArrangementACHListener` on a REAL processor callback — **never** by the synthetic paths (`recalculateAchArrangementStatus` / UPDATE + recalc), which write directly to the arrangement table without executing the Java listener. In tests using these paths: HARD assert the DB state (status + is_active) and the CREATION log ("ACH Arrangement created", organic pre-sweep); mark the FINALIZATION log as `@blocked-by-missing-log` (do NOT remove — documents debt vs rule #13). Cross-validation: the synchronous CC SETTLEMENT REAL path **does** generate the finalization log — confirms the log comes from backend execution, not the recalc helper.

## RightFoot ACH balance-check rerun (R1.53.0)

Balance verification vendor that **gates the ACH rerun** for delinquent accounts (auto-pay ACH). Chain:

| Sweep / Service | Schedule | Effect |
|-----------------|----------|--------|
| `DailyAchBalanceCheckSweep` | `0 0 15 * * ?` | submits balance-checks (`process_type=DAILY_RERUN_DELINQUENT`) to RightFoot |
| `RerunAchBalanceCheckSweep` | `0 0 9 ? * THU` | balance-check for reruns (`process_type=RERUN`) |
| `DailyRerunAchCreationService` | `RightFootBatchCompleteEvent` event (AFTER_COMMIT), **non-Quartz** | creates ACH after the RightFoot webhook |

ACH is only created when the balance check has `status='SUCCESS'`, same routing+account number, and `exposure + amount + $100 <= balance`; the ACH carries FK `right_foot_balance_check_pk`. Deduplication guard: no new ACH if one is already in-flight. Client: `scheduledTask.dailyAchBalanceCheckSweep()` / `.rerunAchBalanceCheckSweep()` (constants `SCHEDULED_TASK_NAMES`). Full rule: `09-integracoes-externas.md §48`.

## Sticky — Recovery / Cancel / Refund (R1.53.0)

CC declined recovery/dunning engine (`uown_sticky.recovery_status`). R1.53.0 changes (code-confirmed):

- **Non-cancellable cancel:** `StickyRecoverCancelSweep` only cancels non-terminal states (`recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')`); if Sticky responds "Cannot cancel transaction", svc marks CANCELED **locally** + writes an INTERNAL/SYSTEM log (see [[activity-log-validation]]).
- **Prior attempts (svc#564):** sends decline history + count via `StickyPriorAttempts.sql`. ⚠️ **timezone**: the original transaction time is resolved as **`America/New_York`** (despite the commit message saying "UTC") — verify in the DB before asserting timestamps.
- **Duplicate payment:** >1 SvPayment PAID per `ccPk` => WARN + uses the most recent one (**does not block**).
- **Idempotent refund:** no dedicated key — protected via the PAID state machine (refund only if `STICKY`+`PAID`; reverting removes PAID → 2nd attempt rejected). Refund/recovery happy-path = **sandbox-only** (KB `sticky-payment-refund.md`).

Product rule: `05-pagamentos.md §53b`.

## Payment receipt — Balance & "You Save" (R1.53.0)

`balance` in the receipt now **includes all fees** (PP/NSF/reinstatement/misc); "You Save" (`balance - payoffBeforeEPOExpiry`) only renders when `> 0`. Fixes negative/corrupted balance with fees. **ExtBrand**: PayNearMe email/SMS logo = `company.name().toLowerCase()+".png"`. Detail: `05-pagamentos.md §72`.

## Email Sweep validation + selection conditions (dev3 2026-06-02)

Email sweeps (`settledInFullAccountEmailSweep`, `RecurringPaymentReminderSweep`, `FirstPaymentReminderSweep`) write to `uown_email_queue` and `uown_correspondence_logs`. Validated in `email-sweeps-servicing.spec.ts` (3 scenarios, 5/5 PASS).

**Confirmed template names (case-sensitive, dev3 2026-06-02):**

| Sweep | `template_name` in `uown_email_queue` |
|-------|----------------------------------------|
| `settledInFullAccountEmailSweep` | `SettledInFullEmail` |
| `RecurringPaymentReminderSweep` | `RecurringPaymentReminder` |
| `FirstPaymentReminderSweep` | `FirstPaymentReminder` |

> `src/scripts/dev3-trigger-sweeps.ts` uses the WRONG template (`SettledInFullAccountEmail`) and the WRONG port (`5446`). Do NOT copy from that file. Canonical catalog in [[email-templates-catalog]].

**Audit tables:**
- `uown_email_queue`: `pk, account_pk, lead_pk, template_name, status (STORED/SENT/PICKED_TO_STORE), sent_time, row_created_timestamp` — PRIMARY evidence (monotonic PK).
- `uown_correspondence_logs`: `pk, account_pk, lead_pk, correspondence_type ('EMAIL'), template_name, error, row_created_timestamp` — the `error` field carries informational text EVEN on success; do NOT assert `error IS NULL`.
- `uown_sweep_logs`: `pk, sweep_name, number_of_records_processed, row_created_timestamp`.

**Rule 1 — `uown_sweep_logs.number_of_records_processed` is NOT reliable on immediate read.** Java creates the row with `processed=0` BEFORE processing and updates it AFTER. A read `< 5s` after trigger captures the pre-processing value. Use `uown_email_queue` (new row for today, monotonic PK) as primary evidence, NEVER `processed >= 1` via immediate read (app-lifecycle pitfall #87).

**Rule 2 — `settledInFullAccountEmailSweep` has a DOW window on the settlement date.** The sweep query has a CASE-WHEN on `settled_in_full_date_time`:
- DOW 1/2 (Mon/Tue): `DATE(settled_in_full_date_time) = CURRENT_DATE - 4`
- DOW 3 (Wed): `DATE(...) IN (CURRENT_DATE-4, CURRENT_DATE-3, CURRENT_DATE-2)`
- DOW 4/5 (Thu/Fri): `DATE(...) = CURRENT_DATE - 2`
- Weekend (`DOW NOT BETWEEN 1 AND 5`): sweep does NOT run.

Use the EXACT sweep query to select the test account; a simplified query overestimates the eligible set (app-lifecycle pitfall #88).

**Rule 3 — `FirstPaymentReminderSweep` requires both `sched_summary` AND `receivable` to be aligned.** Conditions:
```sql
AND schedSummary.first_payment_due_date <= CURRENT_DATE + 3
AND receivable.due_date = schedSummary.first_payment_due_date
AND receivable.receivable_type IN ('REGULAR_PAYMENT')
AND receivable.allocation_status IN ('UNPAID')
AND receivable.status IN ('ACTIVE')
```
Updating only `uown_sv_sched_summary.first_payment_due_date` leaves the JOIN at 0 rows. Also update `uown_sv_receivable.due_date` on the first REGULAR_PAYMENT UNPAID ACTIVE to the same value `<= today+3` (UPDATE — Exception 3, explicit authorization required). Fresh accounts have `first_payment_due_date = today+7` (outside the window) (app-lifecycle pitfall #89).

**Rule 4 — same-day dedup (Java-side) in `settledInFullAccountEmailSweep`.** The sweep skips accounts that already have an email in `STORED`/`SENT`/`PICKED_TO_STORE` today. Re-triggers on the same day return `processed=0`. Assert the PRESENCE of a row in `uown_email_queue` from today (NOT `>= triggerTs`) and tolerate `processed=0` (app-lifecycle pitfall #90).

Cross-links: application-lifecycle pitfalls #87-#90; [[email-templates-catalog]]; [[activity-log-validation]] (email audit tables).

## Rating letter in Payment Arrangement (CORRECTED dev3 2026-06-01)

**`uown_sv_account.rating='P'` (Promise to Pay) IS PERSISTED when the arrangement is created** — both ACH and CC. This **corrects** business-rule §54, which had documented the field's non-persistence as a "KNOWN BUG". DB-confirmed in dev3 (2026-06-01): the field DOES persist correctly. §54 was incorrectly documenting the bug.

- **Arrangement creation (ACH and CC):** `rating='P'` written to `uown_sv_account`; `previous_rating` saved in the arrangement for auditing; existing auto-pay preserved.
- **CC arrangement SUCCESS:** `rating` reset to `null` + auto-pay re-enabled. This is **correct business behavior** (account returned to normal after paying off), NOT a bug.
- **Arrangement FAILED:** `current_rating` reverts to `null` (reset).

**Rule for tests:** assert `rating='P'` after creating the arrangement (HARD assert, not `@blocked`). After CC SUCCESS, assert `rating IS NULL` + active auto-pay.

## AllocationStrategy (CRITICAL)

```typescript
enum AllocationStrategy {
 DEFAULT = 'Payment/EPO', // pays regular + EPO together
 REGULAR_RECEIVABLES = 'Payment', // regular receivables only
 EPO_ONLY = 'EPO Only', // EPO only
}
```

**UI location (2026-05):** Payment History "Update Payment" modal (NOT CC Transactions pencil). Set via `PaymentTransactionPage.editAllocationStrategy(rowIndex, strategy)`.

## Key principles

1. **`chargeFee=true`** mandatory in every CC transaction (via builder, not literal)
2. **`TEST_CARDS.MASTERCARD_APPROVED`** (BIN 5500) for CC payments; VISA rolled back in qa
3. **Float assertions:** use `toBeCloseTo` or `Number` comparison, never `toBe` for monetary values
4. **Activity log mandatory** for every payment action (CLAUDE.md rule 13)
5. **UI-first** when feature has a portal screen (CLAUDE.md rule 14)
6. **`accountPk` only after FUNDED** — distinct from `leadPk`
7. **16m eligibility is merchant-config, not brand** — any merchant with `term_in_months=16 AND is_active=true`
8. **Move Due Date cap:** WEEKLY=3d, others=7d. Safe universal offset=3
9. **`getMissingFields` before `submitApplication`** — sets `merchantProgramPk`, without it 400

## Pitfalls

| # | Pitfall | Fix |
|---|---------|-----|
| 1 | FK violation `fk_uown_cc_transaction_arrangement` | First `createOrUpdateCreditCard` to tokenize, then `useCardOnFile: true` |
| 2 | `sendInvoice` invalidates `contractUrl` | Never call before contract page is completed |
| 3 | VISA_APPROVED rolled back in qa | Use `MASTERCARD_APPROVED` (BIN 5500) |
| 4 | Missing `chargeFee=true` | Use `buildCcArrangementBody` builder |
| 5 | SETTLED_IN_FULL via direct UPDATE | Must use `makeCreditCardPayments(SETTLEMENT)` for sweep to work |
| 6 | Allocation strategy moved from CC Transactions | Now in Payment History "Update Payment" modal |
| 7 | Float in assertions | Use `toBeCloseTo(b, 2)` or `Number` |
| 8 | CC sweep row not at pk=1 | Use `ORDER BY pk DESC LIMIT 1` |
| 9 | Confusing accountPk/leadPk/leadUuid | leadPk for LOS, accountPk for SVC (only after FUNDED) |
| 10 | Missing `getMissingFields` call | Required before `submitApplication` |
| 11 | Refund looked for in `/payment-transaction` (no reverse icon) | Use `/payment-history/{accountPk}` + `PaymentHistoryPage` (app-lifecycle #77) |
| 12 | `selectOption` on `reverseReason` (React Select) is a no-op | Click on the control + click on the "Partially Refund" option (app-lifecycle #78) |
| 13 | ACH Make Payment assert times out at 60s despite success toast | ACH is asynchronous: assert `uown_sv_achpayment WHERE status='PENDING'` + `ADDED : ACHPayment` log; NEVER `uown_sv_payment` (only after the 19:00 sweep) (app-lifecycle #79) |
| 14 | Test asserting overpayment rejection in the Make Payment modal fails | Modal does NOT validate an upper limit — overpayment is intentionally accepted; assert positive behavior (payment created, CC APPROVED) (app-lifecycle #80) |
| 15 | Code/JSDoc assumes Arrangement Type is backend-derived from the amount | Arrangement Type is an explicit React Select in the UI (`label[for=paymentArrangementType]`, NORMAL/SETTLEMENT). Select via `SELECTORS.arrangementTypeDropdown`. Old JSDoc for `makeCcPaymentArrangement` (2026-03-17) was wrong (app-lifecycle #82) |
| 16 | In envs without a real processor (dev3), the terminal ACH arrangement transition synthesized via `recalculateAchArrangementStatus`/`recalculateArrangementStatus` + authorized UPDATE does **NOT generate an activity log** for finalization ("Arrangement finalized as SUCCESS"/failure). Cause: these helpers write directly to `uown_sv_payment_arrangement` and never execute the Java `PaymentArrangementACHListener` — the code that would write the log is only triggered by a REAL processor callback (SETTLED/RETURNED). Symptom: FAILED/SUCCESS state + correct `is_active`, but rule #13 log assert fails. NOT a product bug. | Terminal validation: DB state (status + is_active) is a HARD assert. Creation log ("ACH Arrangement created") is organic (pre-sweep) → HARD assert. **Finalization** log in the synthetic path → `@blocked-by-missing-log` (do NOT remove, rule #13) + explanatory comment + question to dev for an env with a processor. Confirmation: S6 (CC SETTLEMENT, REAL synchronous path) **does** generate the finalization log — proves the log comes from backend execution, not from the recalc helper. (S4/S5 of payment-arrangement-servicing, dev3 2026-06-01) |
| 17 | ACH arrangement stuck in `IN_PROGRESS` after `SendACHPaymentsSweep` in env without a processor (dev3); recalc never reaches `SUCCESS` | Payment stops at `PICKED_TO_SEND` (no Profituity callback) and `PICKED_TO_SEND ∈ PENDING_STATUSES`. UPDATE payments → `SETTLED` (Exception 3, explicit authorization) BEFORE recalc → arrangement advances to `SUCCESS`. Intermediate states (`PENDING/PICKED_TO_SEND/SENT`) leave the arrangement in `NOT_STARTED` — only terminal states (`SETTLED/RETURNED/ACK_ERROR`) promote it (app-lifecycle #83/#84). |
| 18 | Rating letter assert treats `rating='P'` as non-persisted based on "KNOWN BUG" in §54 | **§54 was wrong** — `uown_sv_account.rating='P'` DOES PERSIST when the arrangement is created (ACH and CC), DB-confirmed dev3 2026-06-01. Assert `rating='P'` as a HARD assert. CC SUCCESS resets `rating` to `null` + re-enables auto-pay (correct behavior, not a bug). See "Rating letter in Payment Arrangement" section. |
| 19 | Date pickers `#startDate`/`#endDate` of the arrangement modal ignore `fill`/`type`/`pressSequentially` → endDate=startDate=today → always 1 installment (root of F-001 and F-007/S7) | `<input type="search">` controlled by React; `fill`/`type` do not trigger `onChange`. Set via native `HTMLInputElement.prototype.value` setter + dispatch of `input`/`change` events (pattern in `application-wizard.page.ts`). With the fix, `today→today+28` Weekly generates 5 installments (app-lifecycle #85). |
| 20 | CC multi-installment arrangement stuck in `IN_PROGRESS`, never reaches `SUCCESS` after `simulateCcSweepForArrangement` | Only the installment with `posting_date=today` processes synchronously (APPROVED); future ones (`posting_date>today`) stay `PENDING` — CORRECT product behavior. `simulateCcSweepForArrangement` is date-gated. In envs without a processor (dev3): `db.approveAllPendingCcSalesForArrangement(arrangementPk)` (no date gate, Exception 3) + `recalculateArrangementStatus` (app-lifecycle #86). |
| 21 | `uown_sweep_logs.number_of_records_processed=0` on immediate read despite the sweep processing accounts | Java writes `processed` AFTER processing; the initial row is `0`. Primary evidence = new `uown_email_queue` row from today (monotonic PK), not immediate `processed>=1` (app-lifecycle #87). |
| 22 | `settledInFullAccountEmailSweep` does not process an "eligible" account | Sweep has a DOW CASE-WHEN on `settled_in_full_date_time` (Mon/Tue=today-4, Wed=today-4/-3/-2, Thu/Fri=today-2, weekend=does not run). Use the EXACT sweep query to select the account (app-lifecycle #88). |
| 23 | `FirstPaymentReminderSweep` skips account despite `first_payment_due_date <= today+3` | Sweep requires `receivable.due_date = schedSummary.first_payment_due_date` (REGULAR_PAYMENT/UNPAID/ACTIVE). Also update `uown_sv_receivable.due_date` (Exception 3). Fresh accounts have today+7 (outside window) (app-lifecycle #89). |
| 24 | Re-trigger of `settledInFullAccountEmailSweep` returns `processed=0` | Same-day dedup in Java (STORED/SENT/PICKED_TO_STORE from today). Assert presence of a row in `uown_email_queue` from today (not `>= triggerTs`); tolerate `processed=0` (app-lifecycle #90). |

## Checklist (pre-merge)

- [ ] Setup via `driveLeadToFunding` or `createPreQualifiedApplication` (fresh data)
- [ ] `MASTERCARD_APPROVED` where applicable
- [ ] `chargeFee=true` in all CC tx (via builder)
- [ ] Float assertions use `toBeCloseTo`
- [ ] Activity log validated for each payment action
- [ ] AllocationStrategy via Payment History modal
- [ ] `accountPk` extracted post-FUNDED
- [ ] 13m vs 16m confirmed via `uown_merchant_program` query
- [ ] UI-first respected
- [ ] Move Due Date: checked frequency before choosing offset; WEEKLY cap=3d
- [ ] Move Due Date activity log: `uown_sv_activity_log` (NOT `uown_los_lead_notes`)
- [ ] Refund/Reverse via `/payment-history/{accountPk}` (NOT `/payment-transaction`); reverse reason via React Select click; refund log in `uown_sv_activity_log`

> Detailed endpoints, DB tables, enums, sweep timing, activity log patterns: [references/endpoints-tables.md](references/endpoints-tables.md)

## Cross-links

- [[application-lifecycle]] — pitfall #11 (FK violation), full state machine
- [[common-operations]] — `buildCcPaymentDetails`, reusable patterns
- [[bug-classification]] — float divergence classification
- [[ssn-test-modalities]] — 16m SSN modalities
- [[merchant-preflight]] — `ensureMerchantReady` before application creation
- [[activity-log-validation]] — assertion templates

---
title: Servicing — Make Payment Modal (CC / ACH / Check) + Charge-Fee Suppression
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-28
sources:
  - env: sandbox
  - account: 17298 (Sanjay James, ACTIVE, NY, Tire Agent 13m)
  - code: svc backend @ R1.53.0
covers:
  - make-payment-modal
  - credit-card-payment
  - ach-payment
  - check-payment
  - charge-fee
  - restricted-states
  - convenience-fee
  - payment-allocation
  - rating-letter-p
promoted_to: []
---

> ✅ **Live-verified in sandbox 2026-06-28** via Playwright MCP (account 17298). Claims upgraded from `[needs-live]` to `[confirmed]` where observed. Remaining `[needs-live]` items (post-payment refresh, activity log text, toast wording) require a live payment submission to confirm — see Gaps. Source-code claims retain `[confirmed-source]` tag. This is an execution/investigation record, NOT a source of test patterns (rule #16).

> ✅ **ACH path also live-verified end-to-end in stg 2026-06-28** (a real ACH submit) — oracle [`servicing-ach-payment.md`](../../.claude/oracles/servicing-ach-payment.md), all 8 CT PASS (acct 622660). Confirms the remaining `[needs-live]` items for the **ACH** branch: post-payment **toast "Payment successful."**, the **refresh asymmetry** (getACHPayments+getAccountSummary+getAlertsForAccount, **no** getCCTransactions → BR-08), the **synchronous** `uown_sv_achpayment` PENDING (achType=ACHDebit, achProcessType=REQUEST) + `ADDED : ACHPayment[...]` activity log, and that **BR-05 no-bank-data** is enforced at the UI (Submit disabled) ahead of the backend error. The CC/Check/charge-fee branches remain as noted above.

# Servicing — Make Payment Modal (single CC / ACH / Check payment)

## Purpose

The **Make Payment** modal is the primary money-moving flow in the Servicing portal: it lets an agent post a one-off **Credit Card**, **ACH**, or **Check** payment against an ACTIVE lease account. It is the `PaymentModal` component imported from `@uownleasing/common-ui`, mounted at the auth layout level and opened by the circle-dollar icon on the Account Summary bar. `[confirmed-source]` (`servicing/layouts/auth/index.tsx:699-728`, `servicing/components/account-summary/index.tsx:332-344`)

Only the entry icon was previously documented (see [[servicing-customer-information-page]] / Account Summary bar). This doc covers the full flow it drives: the three payment types, the allocation selector, the prefilled amount, card-on-file vs add-card vs one-time-bank branches, the validation/success branches, and the post-payment refresh asymmetry.

## Portal / URL

- **Portal:** Servicing (internal agent-facing). Viewport for DOM work: single `1440×900` per CLAUDE.md rule #15.
- **Where:** any account page that renders the Account Summary bar (e.g. customer/account detail). The icon sits on the right of the bar next to the prorated calculator and Send Invite icons. `[confirmed-source]` (`account-summary/index.tsx:321-358`)
- **Modal title:** `Make Payment for Account #{pk}` per the GAP brief. `[needs-live]` — the title string lives inside the external `@uownleasing/common-ui` `PaymentModal`, not vendored in this checkout; verify in sandbox.

## Available Operations

| Operation | UI trigger | Store action (servicing) | Endpoint | Backend entry |
|---|---|---|---|---|
| Pay by Credit Card (single) | Payment type = Credit Card Payment, Submit | `achStore.makeCreditCardPayment` | `POST /uown/svc/makeCreditCardPayment` | `CCTransactionService.runTransaction(CCTransactionInfo)` |
| Pay by ACH (single) | Payment type = ACH Payment, Submit | `achStore.updateACHPayment` | `POST /uown/svc/createOrUpdateACHPayment` | `ACHPaymentService.createOrUpdateAchPayment(ACHPayment)` |
| Pay by Check | Payment type = Check, Submit | `paymentStore.makeCheckPayment` | `POST /uown/svc/makePayment` | `UownPaymentService.createOrUpdatePayment(PaymentInfo)` |
| Read CC convenience fee | (modal load / CC selection) | — | `GET /uown/svc/getCCConvenienceFee` | `creditCardConfig.getConvenienceFee()` (returns a string) |
| Multi-payment (arrangement) variants | (payment-arrangement flow, not single) | `makeCreditCardPayments` / `updateACHPayments` | `…/makeCreditCardPayments`, `…/createOrUpdateACHPayments` | `PaymentArrangementService` |

`[confirmed-source]` for all rows: store wiring `layouts/auth/index.tsx:706-710`; endpoints/handlers `ach.tsx:94-121,167-202,240-272`, `payment.tsx:471-485`; controllers `SvcCreditCardController.java:94-97,127-130`, `SvcACHPaymentController.java:44-47`, `SvcPaymentController.java:50-53`. The `…Payments` (plural) handlers are the multi-payment/arrangement variants also passed to the modal (`handleMakeCreditCardPayments`, `handleMakeAchPayments`) — out of scope for single payment; see [[servicing-payment-arrangement-page]].

### Enums driving the selectors

- **Payment type** (`PaymentType`): `ACH Payment`, `Credit Card Payment`, `Check`. `[confirmed-source]` (`servicing/enums/PaymentType.ts:1-5`)
- **Allocation type** (`AllocationType` → display `AllocationNames`): `DEFAULT` → "Payment/EPO", `REGULAR_RECEIVABLES` → "Payment", `EPO_ONLY` → "EPO Only". `[confirmed-source]` (`servicing/enums/AllocationType.ts:1-11`)

## Flow & States

1. **Eligibility gate (icon visible).** The circle-dollar icon renders only when `hasPaymentPermission` is true, i.e. `hasAchPaymentPermission || hasCreditCardPaymentPermission`. `[confirmed-source]` (`layouts/auth/index.tsx:507-508`, `account-summary/index.tsx:332`)
2. **Click circle-dollar (`id="makePayment"`, tooltip "Make Payment").** `handleMakePayment` branches on `isInactive`:
   - account inactive → opens an "Account is {status}" modal with body **"No further payments can be made."** (modal `PaymentModal` is NOT opened). `[confirmed-source]` (`account-summary/index.tsx:82-88`, `layouts/auth/index.tsx:737-746`)
   - account active → sets `isDisplayMakePaymentModal = true`. `[confirmed-source]`
3. **Modal mount guard.** `PaymentModal` renders only if `isDisplayMakePaymentModal && hasPaymentPermission && customerStore?.bankAccounts` is truthy — i.e. the customer bank-accounts object must be loaded. `[confirmed-source]` (`layouts/auth/index.tsx:699-701`)
4. **Modal opens prefilled.** `currentPaymentAmount` is seeded from `customerStore.accountSummary.nextPaymentDueAmount`; also receives `creditCards`, `bankAccounts`, `customerContactInfo`, customer name, and permission flags (`hasPaymentArrangementPermission`, `hasChargeFeePermission`). `[confirmed-source]` (`layouts/auth/index.tsx:705-726`)
5. **Agent selects payment type and (for CC/ACH) a card/bank source**, optionally edits Total Payment Amount and allocation, and submits. `[needs-live]` — the selectors, the source toggle (use-card-on-file vs add-card vs one-time bank), the allocation dropdown, and the Submit button are inside the external `PaymentModal`; layout/labels not readable in this checkout.
6. **Submit → store action → endpoint** (per Operations table).
7. **Post-payment refresh (asymmetric — see Business Rules BR-08).**

### Prohibited / blocked transitions

- **Inactive account → payment:** blocked at step 2; the modal never opens (BR-01). `[confirmed-source]`
- **No payment permission → icon hidden / modal not mounted:** blocked at steps 1 and 3. `[confirmed-source]`
- **CC amount ≤ 0 for a non-tokenization action:** rejected by backend (BR-04). `[confirmed-source]`
- **ACH with no bank data:** rejected by backend (BR-05). `[confirmed-source]`

## Business Rules

- **BR-01 — Inactive accounts cannot pay.** If `isInactive`, the circle-dollar click shows "No further payments can be made." instead of the payment modal. `[confirmed-source]` (`account-summary/index.tsx:82-88`)
- **BR-02 — Payment is permission-gated (two distinct perms).** CC requires `payment / make_credit_card_payment`; ACH requires `payment / create_or_update_ach_payment`; either one alone reveals the icon. Charge-fee uses `payment / view_charge_fee`. `[confirmed-source]` (`layouts/auth/index.tsx:465-508`)
- **BR-03 — Total Payment Amount defaults to the next payment due.** Prefilled from `accountSummary.nextPaymentDueAmount`. `[confirmed-source]` (`layouts/auth/index.tsx:718-720`). Whether the agent can override it and the field's min/validation is `[needs-live]`.
- **BR-04 — CC amount must be > 0 unless the action is a tokenization.** `runTransaction` throws `"CC transaction amount must be greater than 0"` when amount ≤ 0 and the `CCAction` is not in the configurable allow-list (default `"TOKENIZATION, CONNECTOR_TOKENIZATION"`). A real SALE at $0 is rejected. `[confirmed-source]` (`CCTransactionService.java:233-235`)
- **BR-05 — ACH requires bank data.** `createOrUpdateAchPayment` throws `"Error Creating ACH payment: No bank data"` when the request carries no `BankData`. `[confirmed-source]` (`ACHPaymentService.java:106-107`)
- **BR-06 — Adding a NEW card authorizes + tokenizes it first.** For a card with a CVC and a non-masked number, the backend runs an `AUTHENTICATION` for `default.amount.to.authenticate` (default `0.01`); on non-approval it throws `"Invalid card. Please try again"`, or — if NSF — `"Invalid card: Insufficient funds. Please try a different card."`. If no token results, it falls back to a `TOKENIZATION` action. `[confirmed-source]` (`CCTransactionService.java:121-152`). The client-side **Kount session fingerprint** is collected in the modal before submit. `[needs-live]` — fingerprint capture is in `@uownleasing/common-ui`; backend only logs that "Kount and Auth" can be config-skipped (`CCTransactionService.java:140`). `[confirmed-source]` for the log line.
- **BR-07 — A future-dated REQUEST payment sets rating letter "P".** Both CC and ACH: if the transaction type is `REQUEST` and `postingDate` is after today, the account's rating letter is set to `P` via `updateRatingLetterAndAutoPay` (config-gated by `cc.customer.portal.add.rating.letter` / `ach.customer.portal.add.rating.letter`, default true). `[confirmed-source]` (`CCTransactionService.java:250-260`, `ACHPaymentService.java:113-121`). The "P" is later auto-removed once no pending REQUEST payments remain (logs `"P rating removed: no remaining pending REQUEST payments on account"`). `[confirmed-source]` (`UownPaymentService.java:97-145`)
- **BR-08 — Post-payment refresh is asymmetric by payment type.**
  - **CC** (`makeCreditCardPayment`) re-fetches `ServicingInformation` + `AccountSummary` + `Alerts` + `CCTransactions`. `[confirmed-source]` (`ach.tsx:192-197`)
  - **ACH** (`updateACHPayment`) re-fetches `ACHPayments` + `ServicingInformation` + `AccountSummary` + `Alerts` (no CC transactions). `[confirmed-source]` (`ach.tsx:109-114`)
  - **Check** (`makeCheckPayment`) does a bare POST and returns the HTTP status only — **NO re-fetch** of any store. The Account Summary bar will not reflect the check payment until a manual reload. `[confirmed-source]` (`payment.tsx:471-485`)
- **BR-09 — Same-day approved SALE posts a payment + receipt.** When a CC SALE is APPROVED with `postingDate <= today`, the backend adds the payment and creates a CC payment receipt. `[confirmed-source]` (`CCTransactionService.java:262-266,321-328`)
- **BR-10 — CC card/account ownership check.** If the supplied card pk belongs to a different account/lead, backend throws `"Given credit card info doesn’t match the account"`. `[confirmed-source]` (`CCTransactionService.java:206-226`)

## Logic & Exceptions

- **Valid-response contract (CC/ACH).** The store treats a call as success only when `status === 200 && accountPk && !data.errorCode && !data.error`; otherwise it surfaces `data.error || 'Invalid credit card'` (CC) or `response.message` (ACH). So an HTTP 200 carrying an `error`/`errorCode` body is still a failure and triggers no refresh. `[confirmed-source]` (`ach.tsx:107,185-201`)
- **Check path return value.** `makeCheckPayment` returns `response.status || 500` (a number, not an error string) — the modal must interpret the numeric status itself. `[confirmed-source]` (`payment.tsx:483-484`)
- **Use-card-on-file resolution (backend).** When `ccInfo` is null (use card on file) the backend pulls the account's AutoPay card; if none exists it throws `"CreditCardInfo does not exist for account {pk}"`. `[confirmed-source]` (`CCTransactionService.java:303-317`)
- **CC vendor selection.** Live vendor is config-driven: OmniFund, else Channel Payments, else USAEPAY. Relevant when reading the resulting transaction's vendor. `[confirmed-source]` (`CCTransactionService.java:408-413`)
- **Agent webhook (atlog).** `makePayment` (check path) publishes an `AtlogPaymentEvent` only when the agent username is in the configured notify list (default `atlog-ai`); normal agents do not fire it. `[confirmed-source]` (`UownPaymentService.java:48-89`)
- **Convenience fee.** `GET /uown/svc/getCCConvenienceFee` returns a raw config string the modal uses to display/append the CC fee. `[confirmed-source]` (`SvcCreditCardController.java:127-130`). Exactly when the modal calls it and how it is shown is `[needs-live]`.

## Connections

- [[servicing-customer-information-page]] — host page rendering the Account Summary bar and the circle-dollar icon.
- [[servicing-payment-history-page]] — where a posted payment appears afterward.
- [[servicing-payment-transaction-page]] — CC transaction records (`getCCTransactions`) refreshed after a CC payment.
- [[servicing-payment-arrangement-page]] — the multi-payment (`…Payments` plural / `PaymentArrangementDto`) sibling of this single-payment flow.
- [[scheduled-payments]] — future-dated payments (the REQUEST/postingDate-after-today branch that sets rating "P").
- [[payment-flows]] — domain skill for CC/ACH/sweep mechanics.
- [[activity-log-validation]] — every posted payment / rating change must leave an activity log (rule #13); the rating-P removal explicitly logs to the activity log.

## Gaps

- **Modal internal UI not source-verifiable here.** `PaymentModal` ships from `@uownleasing/common-ui` and is not vendored in `/home/jose/projects/uown/servicing/node_modules`. All claims about the on-screen layout — modal title text, payment-type selector control style, allocation dropdown wording, Total Payment Amount field behavior/override, card-source toggle (use card on file / add card / one-time bank), Kount fingerprint capture, fee display, success/error toasts — are `[needs-live]`.
- **Check path UX gap (candidate observation, not confirmed bug).** Because the check path does no store refresh (BR-08), the Account Summary bar / balances may look stale until reload. Confirm whether the modal forces a reload or shows a confirmation. `[needs-live]`
- **Convenience-fee display.** Endpoint exists; whether/where the modal renders it for CC, and whether it is added to the posted amount, is unverified. `[needs-live]`
- **Allocation default in UI.** Code default `AllocationType.DEFAULT` → "Payment/EPO"; confirm the dropdown's preselected option and which allocations are offered per payment type. `[needs-live]`
- **Live business-rule confirmation.** BR-04/05/06/07 are read from backend source; reproduce each branch in sandbox against a fresh ACTIVE account before publishing as confirmed customer-visible behavior (rule #10, conservative classification).

---

## Appendix — Charge-Fee Toggle & Restricted-State Suppression (CT/ME/MA/PR)

> Scope: the credit-card "charge fee" behavior of the Servicing **Make Payment** flow. Covers the permission-gated checkbox, the backend state-based fee suppression, and how a refund re-adds (or does not re-add) the fee. This is a **money-affecting** rule with no prior documentation.

### Purpose

When an agent takes a credit-card payment in Servicing, the platform can add a processing fee on top of the payment amount. The agent can opt to charge that fee via a checkbox in the Make Payment modal, but the checkbox is only the *intent*. The backend (`CCSaleService` / `CCCaptureService`) re-evaluates that intent against the customer's **state** and **silently suppresses** the fee for customers in restricted states (default `CT, ME, MA, PR`) or with no resolvable state. A QA who ticks "charge fee" for a Connecticut customer and expects the fee to land will see it dropped — and that is **correct behavior, not a bug**. [confirmed-source]

### Portal / URL

- **Portal:** Servicing (internal, agent-facing). Viewport `1440×900` (Bootstrap `d-lg-block ≥992px`). [inferred]
- **Surface:** the **Make Payment** modal opened from an account's servicing page (`PaymentModal` component). [confirmed-source — `servicing/layouts/auth/index.tsx:699-728`]
- **Endpoint exercised:** `POST /uown/svc/makeCreditCardPayment` (single payment). Related: `POST /uown/svc/makeCreditCardPayments` (payment arrangements), `POST /uown/svc/makeCreditCardPaymentAsync`. All route through `CCTransactionService.runTransaction(...)`. [confirmed-source — `SvcCreditCardController.java:94-105`, `domain/stores/ach.tsx:181,251`]

### Available Operations

| Operation | Trigger (UI) | Endpoint | Charge-fee role |
|-----------|--------------|----------|-----------------|
| Make CC payment | Make Payment modal → submit (CC) | `POST /uown/svc/makeCreditCardPayment` | `chargeFee` flag sent on the transaction; backend re-evaluates by state | [confirmed-source]
| Make CC payment (arrangement) | Payment arrangement flow | `POST /uown/svc/makeCreditCardPayments` | Same `runTransaction` path, same state suppression | [confirmed-source]
| Refund CC payment | Refund action on a CC transaction | `POST /uown/svc/refundCreditCardPayment/{ccTransactionPk}/{refundFee}` | Re-adds the fee only if the **original** tx persisted `chargeFee=true` AND `refundFee=true` AND it is a full refund | [confirmed-source — `CCRunRefundService.java:72,95`]
| View "Charge Fee" of a tx | CC transactions table | (read) | Column renders the persisted boolean `creditCardTransactionInfo.chargeFee` | [confirmed-source — `utils/data-table-columns.tsx:615-624`]

### Flow & States

1. **Permission gate (UI).** The charge-fee checkbox is gated by `hasChargeFeePermission = hasModifyPermission(permissions, 'payment', 'view_charge_fee')`. This boolean is passed into `PaymentModal` as `hasChargeFeePermission`. Without the `payment.view_charge_fee` modify permission the control is not granted. [confirmed-source — `layouts/auth/index.tsx:501-505,726`]
2. **Agent intent.** Agent submits the payment with the `chargeFee` flag (boolean) on the transaction payload. [confirmed-source — flag present on `CCTransactionInfo`, displayed in column and consumed in services]
3. **Backend re-evaluation.** In `runSale` / `runCapture`: only **if** the incoming `chargeFee` is non-null and `true`, it is replaced by `getChargeFeeByState(...)`. If the incoming flag is already `false`/`null`, it stays off and no state lookup happens. [confirmed-source — `CCSaleService.java:60-62`, `CCCaptureService.java:43-45`]
4. **State resolution.** `getChargeFeeByState` resolves state with precedence: (a) the card's billing address state (`ccInfo.ccAddress.state`); else (b) the customer's **home** address — account home address if `accountPk` present, otherwise lead home address. [confirmed-source — `CCTransactionHelper.java:60-102`]
5. **Allow/suppress decision.** `isChargeFeeAllowed(state, restrictedStates)`: `null` state → **false** (suppressed); state in restricted set → **false** (suppressed); otherwise → **true** (allowed). [confirmed-source — `CCTransactionHelper.java:113-121`]
6. **Persistence.** The resolved boolean is sent to the gateway as `chargeFee` and persisted on the CC transaction. The actually-charged fee comes back from the gateway as `ccCaptureReply.feeAmount` → `chargedFeeAmount` (or `0`). [confirmed-source — `CCSaleService.java:64-91`]
7. **Refund.** On refund, `refundableAmountWithFees = remainingRefundableAmount + (original.chargeFee ? original.chargedFeeAmount : 0)`. The refunded amount equals `refundableAmountWithFees` only for a **full** refund with the `refundFee` path flag true; partial refunds or `refundFee=false` refund just the requested `amount`. [confirmed-source — `CCRunRefundService.java:68-95`]

**Prohibited / impossible transitions:**
- Checkbox ON cannot force a fee in a restricted state — backend always overrides ON→OFF by state. [confirmed-source]
- Checkbox OFF cannot be turned into a fee by the backend — state evaluation only runs when intent is already ON. [confirmed-source]
- A refund cannot re-add a fee that was never charged (`original.chargeFee=false` ⇒ `+0`), regardless of `refundFee`. [confirmed-source]

### Business Rules

- **BR-01 — Restricted states suppress the fee.** Customers (or card billing addresses) in `CT, ME, MA, PR` never get a charge fee, even with the checkbox ON. Configurable via `com.uownleasing.svc.service.cc.CCTransactionHelper.cc.chargefee.restricted.states` (comma list, trimmed, upper-cased); default `"CT,ME,MA,PR"`. [confirmed-source — `CCTransactionHelper.java:104-111`]
- **BR-02 — Null/unknown state suppresses the fee.** If no state can be resolved from card address or customer home address, the fee is suppressed (`isChargeFeeAllowed` returns `false` for `null`). [confirmed-source — `CCTransactionHelper.java:114-116`]
- **BR-03 — State precedence is card-address first.** The card billing-address state wins over the customer home-address state; home address (account, else lead) is only the fallback. A card billed to an allowed state for a customer living in a restricted state would be **allowed** (and vice-versa). [confirmed-source — `CCTransactionHelper.java:60-102`] [inferred — practical consequence]
- **BR-04 — Suppression is one-directional.** Backend only ever downgrades ON→OFF; it never upgrades OFF→ON. [confirmed-source — `CCSaleService.java:60-62`, `CCCaptureService.java:43-45`]
- **BR-05 — Refund re-adds the fee only from the original tx's persisted flag.** Refund math keys off `original.chargeFee`, not off the refunding agent's intent. If the original payment suppressed the fee (BR-01/02), the refund adds `0`. [confirmed-source — `CCRunRefundService.java:68-72`]
- **BR-06 — Fee re-add requires full refund + refundFee flag.** Partial refund (`isPartialRefund`) or `refundFee=false` refunds only the requested amount; the fee is folded in only on a full refund with `refundFee=true`. [confirmed-source — `CCRunRefundService.java:73,95`]
- **BR-07 — Charged fee amount is gateway-reported.** The persisted `chargedFeeAmount` is whatever the gateway returns in `ccCaptureReply.feeAmount` (else `0`); the captured `amount` is net of that fee on approval. [confirmed-source — `CCSaleService.java:87-96`]
- **BR-08 — Checkbox requires `payment.view_charge_fee`.** Agents without that modify permission do not get the toggle. [confirmed-source — `layouts/auth/index.tsx:501-505`] [needs-live — exact rendered/hidden state of the control]

### Logic & Exceptions

- The suppression decision is **logged**: `[CCTransactionHelper][getChargeFeeByState] state={}, chargeFeeAllowed={}` — use this log line to confirm why a fee was dropped. [confirmed-source — `CCTransactionHelper.java:66`]
- The refund writes an **activity log**: `Refund CC Payment complete. Status ..., Amount ..., refundFee ..., Remaining amount ...` into the account/lead activity log (per [[activity-log-validation]], a money action must have a log). [confirmed-source — `CCRunRefundService.java:116-121`]
- Edge: `original.chargeFee` null is coerced to `false` before the refund math, so legacy transactions never re-add a fee. [confirmed-source — `CCRunRefundService.java:68-70`]
- Edge: state comparison is case-insensitive (both the config set and the input state are upper-cased). A lower-case `"ct"` is still restricted. [confirmed-source — `CCTransactionHelper.java:108-118`]
- Config note: the `CreditCardPaymentRequest` DTO defaults `chargeFee = true`, but that DTO belongs to the TMS controller path; the Servicing `makeCreditCardPayment` endpoint binds a raw `CCTransactionInfo` whose `chargeFee` comes from the modal payload. Do not assume "default true" for the Servicing UI path. [confirmed-source — `dto/tms/request/CreditCardPaymentRequest.java:36`, `SvcCreditCardController.java:94-96`] [inferred — which path the modal uses; the modal source is external, see Gaps]

### Connections

- [[payment-flows]] — CC sale/capture/refund mechanics this rule sits inside.
- [[activity-log-validation]] — refund/payment must emit an activity log; rule #13.
- [[qa-domain-reflexes]] — every money action gets a validation; suppression must be asserted, not assumed.
- [[bug-classification]] — fee suppression in a restricted state is expected behavior, not a defect (rule #10).
- [[ui-first-principle]] — the checkbox and the resulting fee/total must be verified visually, not only via logs.
- Related canonical business-rules topics to `resolve`: `cc-payments`, `nsf-fee`.

### Gaps

- **G-1 [needs-live]** The actual rendering of the charge-fee checkbox (label text, position, default checked/unchecked, whether it shows a fee preview/total) lives in the external `@uownleasing/common-ui` `PaymentModal` and was **not** readable in this repo. Must be observed in the sandbox UI.
- **G-2 [needs-live]** Whether the modal surfaces the fee amount/new total to the agent before submit, and whether it warns when the fee is suppressed by state, is unknown — no UI feedback for suppression is visible in backend code (silent). Likely **no** user-facing warning, which is the core QA trap; confirm live.
- **G-3 [inferred]** The processing-fee *amount* per program/merchant is computed elsewhere (gateway-returned `feeAmount`); this doc does not cover where the fee figure originates. Needs a follow-up against the gateway/fee-config source.
- **G-4 [needs-live]** Exact permission behavior for `payment.view_charge_fee` (control hidden vs disabled) is inferred from the gate boolean only.
- **G-5 [confirmed-source]** Restricted-state list is environment-configurable; the live value of `cc.chargefee.restricted.states` per environment was not queried — verify before asserting CT/ME/MA/PR in a specific env.

## Live-Verify Checklist (run before trusting `[needs-live]` claims)

1. Log into the Servicing portal (sandbox) as an agent with both 'payment / make_credit_card_payment' and 'payment / create_or_update_ach_payment' permissions; open any ACTIVE lease account and confirm the circle-dollar icon (hover tooltip 'Make Payment') is visible on the right of the Account Summary bar.
2. Click the circle-dollar icon and confirm a modal titled exactly 'Make Payment for Account #{pk}' opens; screenshot it at 1440x900. (verifies modal title [needs-live])
3. In the open modal, confirm the payment-type selector offers exactly: 'Credit Card Payment', 'ACH Payment', 'Check'; record the control type (radio/dropdown). (verifies PaymentType selector)
4. Confirm the Total Payment Amount field is prefilled with the Account Summary 'Next Payment' value (accountSummary.nextPaymentDueAmount); test whether it is editable. (verifies BR-03)
5. Confirm the allocation selector shows the options 'Payment/EPO' (DEFAULT), 'Payment' (REGULAR_RECEIVABLES), 'EPO Only' (EPO_ONLY) and record which is preselected. (verifies AllocationNames + default gap)
6. Select Credit Card Payment and confirm three source options appear: use card on file, add new card, one-time bank — and that adding a new card shows CVC/number fields; check the network panel for any client Kount fingerprint param and a GET /uown/svc/getCCConvenienceFee call; note where the convenience fee is displayed. (verifies BR-06 fingerprint + fee display)
7. Set CC amount to 0 with a real (non-tokenization) submit and confirm the error 'CC transaction amount must be greater than 0' surfaces. (verifies BR-04)
8. Select ACH on an account with no bank data on file and submit; confirm error 'Error Creating ACH payment: No bank data'. (verifies BR-05)
9. Submit a CC SALE for a positive amount; confirm the Account Summary bar, Alerts, and the CC transactions list refresh WITHOUT a manual page reload (POST /uown/svc/makeCreditCardPayment then GETs to getServicingInformation/getAccountSummary/getAlerts/getCCTransactions in the network panel). (verifies BR-08 CC)
10. Submit an ACH payment; confirm refresh of ACH payments + Account Summary + Alerts (POST createOrUpdateACHPayment), and that the CC transaction list is NOT re-fetched. (verifies BR-08 ACH)
11. Submit a Check payment (POST /uown/svc/makePayment) and confirm the Account Summary bar does NOT auto-refresh until a manual reload. (verifies BR-08 Check asymmetry)
12. Schedule a future-dated CC or ACH REQUEST payment (postingDate after today) and confirm the account rating letter becomes 'P'; then verify the activity log records the change and that 'P' is removed once no pending REQUEST payments remain. (verifies BR-07 + activity-log rule #13)
13. On an INACTIVE/cancelled account, click the circle-dollar icon and confirm the message 'No further payments can be made.' appears and the payment modal does NOT open. (verifies BR-01)
14. Log in to the sandbox Servicing portal at 1440x900 with an agent user that HAS the payment.view_charge_fee permission. Open an active account, click Make Payment to open the modal, and confirm the charge-fee checkbox is present, capture its exact label text, default checked state, and whether a fee amount/new total is shown (verifies G-1, G-2, BR-08).
15. Repeat the previous step with an agent user that LACKS payment.view_charge_fee and confirm whether the charge-fee checkbox is hidden or disabled (verifies BR-08 / G-4).
16. Pick (or create via fresh automation per test-data-hierarchy) an account whose customer home address state is CT, ME, MA, or PR. In the Make Payment modal, tick the charge-fee checkbox, submit a small CC payment, then open the CC transactions table and confirm the Charge Fee column shows 'false' and no processing fee was added to the captured amount (verifies BR-01, BR-04).
17. Repeat with an account in an ALLOWED state (e.g. TX or FL), tick charge-fee, submit, and confirm the Charge Fee column shows 'true' and a non-zero fee was applied (verifies BR-01 allowed path, BR-07).
18. Using a card whose billing-address state differs from the customer's home state (one restricted, one allowed), submit with charge-fee ON and confirm the outcome follows the CARD billing state, not the home state (verifies BR-03).
19. On the allowed-state transaction that charged a fee, perform a FULL refund with the refund-fee option enabled and confirm the refunded amount includes the fee; then on a separate charged transaction do a PARTIAL refund and confirm the fee is NOT re-added (verifies BR-05, BR-06).
20. After the refund, open the account Activity Log and confirm a note 'Refund CC Payment complete. Status ..., refundFee ..., Remaining amount ...' was written (verifies the refund activity-log rule).
21. In sandbox, query the running config value of com.uownleasing.svc.service.cc.CCTransactionHelper.cc.chargefee.restricted.states to confirm it equals 'CT,ME,MA,PR' for this environment before publishing the restricted list (verifies G-5).


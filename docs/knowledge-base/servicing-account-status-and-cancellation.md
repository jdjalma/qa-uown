---
title: Servicing — Account Status Change & Cancellation (CANCELLED ⇄ ACTIVE, Refund-All)
domain: knowledge-base
status: hypothesis
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: source-audit (no live env)
  - code: servicing FE @ R1.50.2 (2026-04-07, stale)
  - code: svc backend @ R1.53.0
covers:
  - account-status-change
  - account-cancellation
  - cancelled-to-active
  - refund-all
  - changeAccountStatus
  - reactivation
promoted_to: []
---

> ⚠️ **Source-grounded draft — NOT yet live-verified.** Produced by the multi-agent code+backend audit `servicing-doc-gap-audit` (2026-06-25). The local servicing **frontend** checkout is branch **R1.50.2 (2026-04-07)** — stale vs the sandbox deploy (see memory `local-servicing-fe-stale-r1502`); the **backend** (svc) is R1.53.0. Claims are tagged `[confirmed-source]` (read in code), `[inferred]`, or `[needs-live]` (UI/visual claim to verify in sandbox). `status: hypothesis` until the Live-Verify Checklist at the bottom is run. This is an execution/investigation record, NOT a source of test patterns (rule #16).

## Purpose

Documents how a Servicing agent changes an account's status from the Account Summary bar, with focus on the previously-undocumented **CANCELLED** cluster: the cancel path (with optional bulk **Refund Payments**) and the **CANCELLED → ACTIVE** reactivation path (warning modal + ACH re-posting). `changeAccountStatus` is the single front-door endpoint; its `CANCELLED` branch delegates to `cancelAccountService.cancelAccount`, which is also exposed as a standalone endpoint. Cancellation is a **terminal status with bulk-refund side effects**, hence high business risk.

## Portal / URL

- Portal: **Servicing** (internal, agent-facing). Viewport per Rule #15: single `1440×900`.
- Surface: the **Account Summary** bar rendered at the top of an account view (the `AccountSummary` component, fed by `layouts/auth/index.tsx`). `[confirmed-source: servicing/components/account-summary/index.tsx:181-242, servicing/layouts/auth/index.tsx:551-553]`
- Exact account-route URL not captured here — `[needs-live]`.

## Available Operations

| Operation | Trigger (UI) | Endpoint | Request fields | Notes |
|---|---|---|---|---|
| Change status (non-cancel) | New Status dropdown → "Add a comment:" modal → SAVE | `POST /uown/svc/changeAccountStatus` | `accountPk`, `newStatus`, `comment`, `refundAllPayments` | Writes STATUS_CHANGE log, updates status. `[confirmed-source: SvcAccountController.java:149-153; ChangeAccountStatusService.java:57-73]` |
| Cancel account | New Status = `CANCELLED` → comment modal w/ "Refund Payments" checkbox → SAVE | `POST /uown/svc/changeAccountStatus` (delegates to `cancelAccount`) | same; `refundAllPayments` checkbox drives refund-all | Sets `CANCELLED` + `cancelledDateTime`, optional refund of ALL applied payments. `[confirmed-source: ChangeAccountStatusService.java:46-55; CancelAccountService.java:48-63]` |
| Reactivate | New Status = `ACTIVE` on a CANCELLED account → "Please note that:" warning → CONTINUE → comment modal → SAVE | `POST /uown/svc/changeAccountStatus` | same | Config-gated `checkAndUpdateAchPayments` re-posts ACH. `[confirmed-source: account-summary/index.tsx:473-475,509-533; ChangeAccountStatusService.java:64-71]` |
| Cancel (direct/standalone) | none observed in this surface | `POST /uown/svc/cancelAccount` | `CancelAccountRequest` (`accountPk` OR `lead`, `refundAllPayments`, `comment`) | Returns `AccountInfo`; same service method. `[confirmed-source: SvcAccountController.java:155-158; CancelAccountRequest.java:15-35]` |

Frontend store actions: `customerStore.changeAccountStatus` (POST `/uown/svc/changeAccountStatus`) and `customerStore.cancelAccount` (POST `/uown/svc/cancelAccount`). `[confirmed-source: servicing/domain/stores/customer.tsx:1395-1427]`

## Flow & States

**AccountStatus enum (dropdown options):** `ACTIVE`, `PAID_OUT`, `PAID_OUT_EARLY`, `PAID_OUT_EARLY_EPO`, `CHARGED_OFF`, `CLOSED`, `CANCELLED`, `SOLD`, `SETTLED_IN_FULL`. The dropdown renders **all** enum values as `<option>`s. `[confirmed-source: servicing/enums/AccountStatus.ts; account-summary/index.tsx:452,481-487]`

**UI branch logic on dropdown change** `[confirmed-source: account-summary/index.tsx:467-480]`:
- current `CANCELLED` + select `ACTIVE` → open **warning modal** ("Please note that:").
- select `CANCELLED` (from any non-cancelled) → open **comment modal** (with Refund Payments checkbox).
- any other transition → open **comment modal** (no checkbox).

**Backend branch logic** `[confirmed-source: ChangeAccountStatusService.java:39-73]`:
1. Blank comment → fail: `"Comment is required to change account status"`.
2. `newStatus == oldStatus` → succeeds no-op: `"Account status remains unchanged."`.
3. `newStatus == CANCELLED` → delegate to `cancelAccount`; response `"Account has been cancelled."` / `"Account cancellation failed."`.
4. Otherwise → log STATUS_CHANGE, set status+comment; if old `CANCELLED` and new `ACTIVE` (and config on) → `checkAndUpdateAchPayments`; then `updateAccount`. Response `"Account status updated successfully."`.

**State transitions** (observed in code):
- `* → CANCELLED` (terminal-ish; sets `cancelledDateTime`).
- `CANCELLED → ACTIVE` (reactivation; ACH re-post side effect).

**Prohibited / gated transitions:**
- On a **CANCELLED** account the **New Status dropdown is hidden** unless the user holds BOTH `account_status` AND `status_cancelled_to_active` restricted-modify permissions. With only `account_status`, a CANCELLED account shows no editable dropdown → reactivation is blocked at UI. `[confirmed-source: account-summary/index.tsx:159-165,229]`
- No backend enum-level transition guard observed — backend accepts any `newStatus` once comment is present (transition legality is enforced at the UI/permission layer, not in `ChangeAccountStatusService`). `[inferred: ChangeAccountStatusService.java has no transition-matrix check]`

## Business Rules

- **BR-01** — A non-blank `comment` is mandatory for any status change; blank comment is rejected server-side before any mutation. `[confirmed-source: ChangeAccountStatusService.java:39-41]` The "Add a comment:" modal also blocks SAVE client-side with `"Comment is required."`. `[confirmed-source: add-comment-modal/index.tsx:35-42]`
- **BR-02** — Selecting the same status as current is a successful no-op (`"Account status remains unchanged."`), not an error. `[confirmed-source: ChangeAccountStatusService.java:42-44]`
- **BR-03** — Cancelling an account always: writes a `STATUS_CHANGE` activity log, sets status `CANCELLED`, sets `cancelledDateTime = now`, and stores the comment. `[confirmed-source: CancelAccountService.java:56-62]`
- **BR-04** — **Refund-all only runs through the cancel branch.** When `refundAllPayments == true`, `cancelAccount` refunds **every applied payment** on the account (`getAllAppliedPaymentsForAccount` → `refundPaymentService.refundPayments`) and prefixes the log with `"Refunding payments on account"`. There is no other code path that bulk-refunds all applied payments. `[confirmed-source: CancelAccountService.java:52-55,65-71]`
- **BR-05** — The `Refund Payments` checkbox is rendered **only** when `newStatus === CANCELLED`; it maps to `refundAllPayments` in the request and **defaults to unchecked** (`false`). For non-cancel transitions the field is `undefined`. `[confirmed-source: add-comment-modal/index.tsx:30-32,67-80]`
- **BR-06** — On `CANCELLED → ACTIVE`, the warning modal informs the agent that **refunded payments will NOT be reversed**, while **pending ACH refunds will be cancelled and the underlying payments re-posted**. Confirming requires clicking **CONTINUE**, which then opens the comment modal. `[confirmed-source: account-summary/index.tsx:509-533]`
- **BR-07** — The ACH re-post on reactivation is **config-gated** by `com.uownleasing.svc.service.ChangeAccountStatusService.update.ach.payments.check` (**default `true`**). If false, reactivation changes status only, no ACH re-post. `[confirmed-source: ChangeAccountStatusService.java:64-70]`
- **BR-08** — `checkAndUpdateAchPayments` runs **asynchronously** (`CompletableFuture.runAsync`). For each refunded ACH payment with a matching PENDING `ACHCredit` refund: the refund ACH is set `CANCELLED` (+comment `"ACH Refund Cancelled: Account status changed: CANCELLED → ACTIVE"`, log INFORMATION `"ACH refund is being cancelled"`), the original payment is set `PAID` and re-posted via `postPaymentToAccount`, the original ACH is set `SETTLED`, and an INFORMATION log `"Reposting payments"` is written. `[confirmed-source: SvAccountService.java:411-435]`
- **BR-09** — Reactivation visibility requires both `restricted.modify.account_status` and `restricted.modify.status_cancelled_to_active`. The permission key prefix `restricted.modify.` is inferred from the helper name `hasRestrictedModifyPermission(permissions, '<suffix>')`. `[inferred: layouts/auth/index.tsx:288-296]` Suffix strings `account_status` and `status_cancelled_to_active` are `[confirmed-source: layouts/auth/index.tsx:290,295]`.
- **BR-10** — The standalone `POST /uown/svc/cancelAccount` endpoint hits the same `cancelAccount` method, so it can also trigger refund-all and terminal cancellation directly, bypassing the comment/permission UI gates. No method-level security annotation is present on the controller mapping. `[confirmed-source: SvcAccountController.java:155-158]` Whether an upstream gateway/filter enforces auth is `[needs-live]` / out of scope here.

## Logic & Exceptions

- **Activity log coverage** (Rule #13): cancel writes one `STATUS_CHANGE` log; non-cancel transitions write one `STATUS_CHANGE` log; reactivation ACH re-post writes `INFORMATION` logs (`"ACH refund is being cancelled"`, `"Reposting payments"`). `[confirmed-source: CancelAccountService.java:58; ChangeAccountStatusService.java:57-59; SvAccountService.java:422-423,431-432]`
- **`cancelAccountForLead`** is a sibling path (used when cancelling via a lead, not in this UI surface): logs on the LOS lead, optionally refunds LOS credit-card SALE/APPROVED transactions when config `...CancelAccountService.refund.los.payments` (default `false`) is on, then calls `cancelAccount`. `[confirmed-source: CancelAccountService.java:73-97]`
- **Exception handling**: `changeAccountStatus` wraps everything in try/catch and returns `success=false, "An unexpected error occurred: <msg>"` on any exception (e.g. account not found). `[confirmed-source: ChangeAccountStatusService.java:74-77]`
- **Refund timing risk**: refund-all is synchronous within the cancel transaction, but ACH re-post on reactivation is fire-and-forget async — UI may report success before re-posting completes. `[inferred: CompletableFuture.runAsync, SvAccountService.java:412]`
- **Toast feedback**: on success the UI shows `"The account status has been successfully changed."`; on failure it shows the backend `message` or a generic fallback. `[confirmed-source: account-summary/index.tsx:442-449]`

## Connections

- [[activity-log-validation]] — every transition/refund/re-post must have a matching log (BR-03, BR-08).
- [[payment-flows]] — refund-all reuses `refundPaymentService.refundPayments`; ACH re-post reuses `postPaymentToAccount`.
- [[application-lifecycle]] — terminal `CANCELLED` status and `cancelledDateTime`.
- Related KB docs: [[servicing-payment-history-page]], [[servicing-payment-transaction-page]], [[sticky-payment-refund]], [[sticky-recover-cancel-sweep]], [[servicing-account-edit-modals]].
- Domain skills: [[ui-first-principle]], [[dom-investigation]], [[bug-classification]].

## Gaps / Open Questions

- Exact Servicing account-route URL and the visual layout of the Account Summary bar — `[needs-live]`.
- Visual confirmation of the comment modal, the Refund Payments checkbox, and the warning modal text/buttons rendered to a real agent — `[needs-live]`.
- Whether the dropdown actually disappears (vs disabled) on a CANCELLED account without `status_cancelled_to_active` — code says hidden; confirm visually — `[needs-live]`.
- Whether all 9 enum statuses are actually selectable/meaningful in the UI or some are display-only — `[needs-live]`.
- Auth enforcement on the standalone `/uown/svc/cancelAccount` endpoint (gateway/filter) — out of scope, `[needs-live]`.
- Behavior when refund-all encounters a non-refundable payment (partial failure handling) — not covered in read code, `[inferred]` gap.

## Live-Verify Checklist (run before trusting `[needs-live]` claims)

1. Log into the Servicing portal (sandbox) at 1440x900 as a user holding restricted.modify.account_status. Open an ACTIVE account and confirm the Account Summary bar shows a 'New Status' dropdown next to the 'Status' box (verifies the dropdown surface).
2. On that ACTIVE account, open the New Status dropdown and confirm all 9 options render: ACTIVE, PAID_OUT, PAID_OUT_EARLY, PAID_OUT_EARLY_EPO, CHARGED_OFF, CLOSED, CANCELLED, SOLD, SETTLED_IN_FULL.
3. Select a non-CANCELLED status (e.g. CLOSED) and confirm a modal titled 'Add a comment:' opens with a Comment text field and a SAVE button, and that NO 'Refund Payments' checkbox is shown. Click SAVE with the field empty and confirm the inline error 'Comment is required.' appears.
4. Re-open the dropdown, select CANCELLED, and confirm the 'Add a comment:' modal now ALSO shows an unchecked checkbox labeled 'Refund Payments' (id=refundPayments).
5. Fill a comment, leave Refund Payments unchecked, SAVE; confirm success toast 'The account status has been successfully changed.', the Status box now reads CANCELLED, and a STATUS_CHANGE activity-log entry was written. Query the account: account_status=CANCELLED and cancelledDateTime is set.
6. On the now-CANCELLED account, as a user WITHOUT status_cancelled_to_active permission, confirm the 'New Status' dropdown is absent (hidden). Then re-test as a user WITH both restricted.modify.account_status AND restricted.modify.status_cancelled_to_active and confirm the dropdown reappears.
7. With both permissions, select ACTIVE on the CANCELLED account and confirm a warning modal titled 'Please note that:' appears containing the lines 'Refunded payments will NOT be cancelled.' and 'Pending ACH refunds will be marked cancelled and Payments will be re-posted.' with a CONTINUE button. Click CONTINUE and confirm it opens the 'Add a comment:' modal.
8. Complete the reactivation (comment + SAVE) on an account that had a PENDING ACH refund; confirm status returns to ACTIVE and that INFORMATION activity-log entries 'ACH refund is being cancelled' and 'Reposting payments' appear, and the prior payment shows re-posted/PAID.
9. Separately, on a fresh account with applied payments, cancel via the dropdown WITH 'Refund Payments' checked and confirm every applied payment is refunded and the activity log note begins with 'Refunding payments on account'.


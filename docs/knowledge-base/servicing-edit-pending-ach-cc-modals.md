---
title: Servicing — Edit-Pending ACH & CC History Modals
domain: knowledge-base
status: hypothesis
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: source-audit (no live env)
  - code: servicing FE @ R1.50.2 (2026-04-07, stale)
  - code: svc backend @ R1.53.0
covers:
  - edit-pending-ach
  - edit-pending-cc
  - disable-ach-payment
  - cc-edit-immediate-charge
  - pending-payment-edit
promoted_to: []
---

> ⚠️ **Source-grounded draft — NOT yet live-verified.** Produced by the multi-agent code+backend audit `servicing-doc-gap-audit` (2026-06-25). The local servicing **frontend** checkout is branch **R1.50.2 (2026-04-07)** — stale vs the sandbox deploy (see memory `local-servicing-fe-stale-r1502`); the **backend** (svc) is R1.53.0. Claims are tagged `[confirmed-source]` (read in code), `[inferred]`, or `[needs-live]` (UI/visual claim to verify in sandbox). `status: hypothesis` until the Live-Verify Checklist at the bottom is run. This is an execution/investigation record, NOT a source of test patterns (rule #16).

---

## Purpose

Each History page row that is still **`PENDING`** carries a **pencil icon** in its `Edit` column. Clicking it opens a per-row edit modal:

- **ACH History** (`/ach-history/{pk}`) → `EditPendingAchModal` — edit/remove a pending scheduled ACH payment.
- **Credit Card History** (`/credit-card-history/{pk}`) → `EditPendingCCPaymentModal` — edit/cancel a pending scheduled CC charge.

These are the **only mutating actions** on the History pages (everything else there is read-only — [[servicing-history-pages]] BR-01).

**Actors:** Servicing agents/supervisors. ACH modal is permission-gated; the CC modal is **not** (see BR-C1).

---

## Portal / URL

| Surface | URL (sandbox) |
|---|---|
| ACH History | `https://svc-website-sandbox.uownleasing.com/ach-history/{accountPk}` |
| CC History | `https://svc-website-sandbox.uownleasing.com/credit-card-history/{accountPk}` |

Pencil renders only on rows whose `status` (case-insensitive) is `pending` (`data-table-columns.tsx:393-404` ACH, `:643-656` CC). `[confirmed-source]`

---

## Available Operations

| Modal | Button | Frontend store call | HTTP | Backend | Effect |
|---|---|---|---|---|---|
| Edit Pending ACH | **SAVE** | `ACHStore.updateACHPayment` | `POST /uown/svc/createOrUpdateACHPayment` | `ACHPaymentService.createOrUpdateAchPayment` | Upsert pending ACH (amount/postingDate/comment) |
| Edit Pending ACH | **REMOVE** | `ACHStore.removeACHPayment` | `POST /uown/svc/disableACHPayment` | controller sets `ACHStatus.INACTIVE` → `svACHPaymentService.createOrUpdateSvAchPayment` | Soft-disable (status → `INACTIVE`) |
| Edit Pending CC | **SAVE** | `ACHStore.updateCcTransaction` | `PUT /uown/svc/payments/credit-cards/{ccTxPk}` | `CCUpdateTransactionService.updateCreditCardTransaction` | Update pending CC; **may charge immediately** (BR-C3) |
| Edit Pending CC | **REMOVE** (3rd button) | `ACHStore.updateCcTransaction` | `PUT /uown/svc/payments/credit-cards/{ccTxPk}` | same, `status='CANCELLED'` | Cancel pending CC |

All `[confirmed-source]` — `edit-pending-ach-modal/index.tsx:74,142`, `domain/stores/ach.tsx:101-104,152-159,214-218`, `edit-pending-cc-modal/index.tsx:71-72,112-116`, `rest/svc/SvcACHPaymentController.java:44-58,100-102`, `rest/svc/SvcCreditCardController.java:132-134`.

### Divergence: a newer validated ACH PUT exists but is NOT wired

A second, validated ACH endpoint exists — `PUT /uown/svc/payments/ach/{achPaymentPk}` → `AchUpdatePaymentService` (status-transition validation + activity log + arrangement refresh, mirroring the CC service). **The modal does not use it** — SAVE still hits the legacy `POST /createOrUpdateACHPayment` and REMOVE still hits `POST /disableACHPayment`. `[confirmed-source]` (`SvcACHPaymentController.java:100-102`, `AchUpdatePaymentService.java:31-92`; modal wiring `ach.tsx:40,60`). The CC modal, by contrast, already uses its validated `PUT` service.

---

## Modal fields

Both modals share the same shape (`[confirmed-source]`; visual layout `[needs-live]`):

| Field | ACH (`edit-pending-ach-modal`) | CC (`edit-pending-cc-modal`) |
|---|---|---|
| Reference # | read-only `achPayment.pk` | read-only `ccPayment.pk` |
| Created Time | read-only `rowCreatedTimestamp` | read-only `rowCreatedTimestamp` |
| Posting Date | `type=date`, `min=today` | `type=date`, `min=today` |
| Amount | `type=currency`, required, min 0 | `type=currency`, required, min 0 |
| Comment | `textarea`, required, max 500 | `textarea`, required, max 500, **prefilled** w/ existing comment |
| Title | "Edit Pending ACH" | "Edit Pending Credit Card Payment" |

Note: ACH `comment` initial value is **empty** (`edit-pending-ach-modal/index.tsx:43`); CC `comment` is **prefilled** from the existing transaction (`edit-pending-cc-modal/index.tsx:42`). This difference drives BR-A4.

---

## Flow & States

### ACH status model
- `PENDING` → (SAVE) stays `PENDING` (upsert) · → (REMOVE) `INACTIVE` (soft-disable, via legacy POST).
- The **validated** PUT path (`AchUpdatePaymentService`) only permits `PENDING → {PENDING, CANCELLED}`; it would **reject** `INACTIVE`. The legacy `disableACHPayment` POST **bypasses** that validation and writes `INACTIVE` directly. `[confirmed-source]` (controller sets status before calling service; no transition guard on that path — `SvcACHPaymentController.java:54-58`).

### CC status model (`CCUpdateTransactionService.isStatusValidForUpdate`)
- Allowed: **`PENDING → PENDING`** (edit) and **`PENDING → CANCELLED`** (remove).
- **Prohibited (throws `SvcException` "Invalid status update"):** any current status other than `PENDING`; any target other than `PENDING`/`CANCELLED`. `[confirmed-source]` (`CCUpdateTransactionService.java:48-52,78-82`).

### CC "run today" branch (high-risk)
On the CC PUT, after validation:
```
shouldRunToday = status == PENDING && LocalDate.now() >= postingDate
  true  → ccTransactionService.runTransaction(info, false)   // charges the card NOW
  false → save the updated pending row
```
`[confirmed-source]` (`CCUpdateTransactionService.java:65-70,84-87`).

---

## Business Rules

- **BR-A1 / BR-C1 — pencil only on PENDING rows.** Edit cell renders the pencil only when row status lowercased == `pending`. `[confirmed-source]`
- **BR-A2 — ACH modal is permission-gated.** Pencil shows only if `hasEditOrRemovePermission` (= `create_or_update_ach_payment` OR `disable_ach_payment`). The modal body renders only if `hasCreateOrUpdateACHPaymentPermission`; the REMOVE button renders only if `hasDisableACHPaymentPermission`; SAVE only if `hasCreateOrUpdateACHPaymentPermission`. `[confirmed-source]` (`components/history/ach.tsx:70-84,132-137`, `edit-pending-ach-modal/index.tsx:87,138,155`).
- **BR-A3 — ACH permission mapping is UNCONFIRMED (drift risk).** Source carries `// TODO: THESE NEED TO BE MAPPED TO CORRECT AMS PERMISSIONS` directly above the two `hasModifyPermission` lookups (`payment/create_or_update_ach_payment`, `ach_history/disable_ach_payment`). The resource/action strings may not match real AMS permission keys. Verify against AMS before asserting access behavior. `[confirmed-source]` (`components/history/ach.tsx:67-81`). Drift category per [[volatile-knowledge-registry]] (permissions).
- **BR-C1 — CC modal has NO permission gate.** Neither the CC Edit cell (`data-table-columns.tsx:643-656`, only `isPending`) nor `EditPendingCCPaymentModal` (no permission props at all) checks any permission — anyone who can view the CC History page can edit/cancel a pending CC. Contrast ACH. `[confirmed-source]`
- **BR-A4 — both ACH buttons require `formik.isValid && formik.dirty`; even REMOVE.** Because ACH `comment` starts empty and is required, the form is not `dirty`+`valid` until the agent types a comment — so **REMOVE cannot be clicked without first editing the comment**. `[confirmed-source]` (`edit-pending-ach-modal/index.tsx:141,159`). CC's third/REMOVE button has no such disabled-guard but still runs the same Yup validation on submit (comment required, but prefilled). `[confirmed-source]`
- **BR-A5 / BR-C5 — no past-dating.** Both modals compute "after end-of-yesterday" (ACH `isFirstDateAfterSecondDate` vs end-of-yesterday; CC `paymentPostingDate.isAfter(yesterday)`) and reject otherwise with toast **"Please enter a valid date."** Date input `min` is today. `[confirmed-source]` (`edit-pending-ach-modal/index.tsx:60-77`, `edit-pending-cc-modal/index.tsx:57-99`). NOTE: a posting date == **today** passes this client guard yet triggers the backend `shouldRunToday` charge (BR-C3).
- **BR-C2 — CC SAVE and REMOVE both PUT the same endpoint;** REMOVE differs only by setting `status='CANCELLED'` client-side before send. `[confirmed-source]` (`edit-pending-cc-modal/index.tsx:71-72,93`).
- **BR-C3 — HIGH RISK: editing a pending CC with a today/past posting date charges the card immediately.** Backend `shouldRunToday` (`status==PENDING && now >= postingDate`) calls `runTransaction`, executing a real charge rather than just saving. An agent intending to "edit" a pending payment can inadvertently capture funds by leaving/setting the posting date to today. `[confirmed-source]` (`CCUpdateTransactionService.java:65-66,84-87`).
- **BR-C4 — only `PENDING → {PENDING, CANCELLED}` is a legal CC status update;** anything else throws. `[confirmed-source]`
- **BR-X1 — every successful update writes an activity log.** CC: `LoggingService.createActivityLog(accountPk, LogType.CREDIT_CARD, …, "Updated Credit Card Transaction: pk=…, postingDate=…, amount=$…, status=…, comment=…")`. Validated ACH PUT: `LogType.ACH`, "Updated ACH Payment: …". `[confirmed-source]` (`CCUpdateTransactionService.java:91-101`, `AchUpdatePaymentService.java:82-92`). Per [[activity-log-validation]] every edit MUST produce one of these notes. ⚠️ The **legacy** ACH paths actually used by the modal (`createOrUpdateAchPayment` / `disableACHPayment`) were not read here — confirm their logging separately. `[gap]`
- **BR-X2 — side effects on the CC PUT:** after update it refreshes the payment arrangement (if `paymentArrangementPk != null`) and **always** calls `updateRatingForAccount`. The validated ACH PUT refreshes the arrangement and calls `updateRatingForAccount` **only when status == CANCELLED**. `[confirmed-source]` (`CCUpdateTransactionService.java:72-75`, `AchUpdatePaymentService.java:62-71`).

---

## Logic & Exceptions

- **Phantom-field cleanup hack (CC).** Before sending, the CC modal deletes three stray properties `postingDatee` / `accountPkk` / `amountt` if present, with the comment `//BE needs to DELETE THESE 3 PROPERTIES`. Defensive front-end cleanup of a malformed model. `[confirmed-source]` (`edit-pending-cc-modal/index.tsx:74-92`).
- **Soft-disable vs cancel divergence (ACH).** The modal's REMOVE writes `ACHStatus.INACTIVE` (legacy POST), whereas the unused validated PUT models removal as `CANCELLED`. Two different terminal states for "remove" depending on path. `[confirmed-source]`
- **Refetch after success.** ACH SAVE/REMOVE → `getACHPayments` + servicing info + account summary + alerts. CC SAVE/REMOVE → servicing info + account summary + alerts + `getCCTransactions`. Success toasts: "ACH Payment updated successfully" / "Credit Card Payment Updated Successfully". Error toast on CC: "Card error: {message}". `[confirmed-source]` (`ach.tsx:109-118,160-163`, `components/history/credit-card.tsx:108-114`).
- **Not-found / no-info guards (backend).** CC service throws `SvcException` if the tx pk is missing or has no `creditCardTransactionInfo`; validated ACH service throws if the ACH pk is missing. `[confirmed-source]`

---

## Connections

- Extends [[servicing-history-pages]] (Gap #2 closed: §1 ACH and §2 CC Edit-pending modal field sets + endpoints).
- [[servicing-payment-history-page]] — the other CC/ACH mutation surface (reverse/refund/rewind); contrast the two charge paths.
- [[activity-log-validation]] — BR-X1 (every edit must emit a `CREDIT_CARD`/`ACH` activity note).
- [[volatile-knowledge-registry]] — BR-A3 permission-mapping drift (unconfirmed AMS keys).
- [[payment-flows]] / [[scheduled-payments]] — pending scheduled ACH/CC payments are what these modals edit.
- [[origination-role-based-access-and-pii]] / AMS permissions — to resolve BR-A3.

---

## Gaps / To Investigate

1. **BR-A3 permission keys** (`payment/create_or_update_ach_payment`, `ach_history/disable_ach_payment`) not confirmed against real AMS permissions (source TODO). `[gap]`
2. **Legacy ACH POST logging** — whether `createOrUpdateAchPayment` / `disableACHPayment` emit activity logs (only the unused validated PUT was read). `[gap]`
3. **BR-C3 live confirmation** — confirm in sandbox that saving a pending CC with today's posting date produces a real captured charge (not just a save). `[needs-live]`
4. **Modal visual layout** (button order, REMOVE-disabled-until-comment behavior, toasts) not yet seen live. `[needs-live]`
5. Whether the unused `PUT /payments/ach/{pk}` is reachable from any other UI surface, or dead pending a future migration. `[gap]`

## Live-Verify Checklist (run before trusting `[needs-live]` claims)

1. Log into Servicing sandbox (https://svc-website-sandbox.uownleasing.com) as an agent with ACH+CC modify permissions; open an account that has a PENDING scheduled ACH payment and a PENDING scheduled CC payment (create one via the Make Payment / scheduled-payment flow with a future posting date if none exists).
2. Navigate to /ach-history/{accountPk}. Confirm [needs-live]: the PENDING ACH row shows a pencil icon in the Edit column; non-PENDING rows do not.
3. Click the ACH pencil. Confirm modal title 'Edit Pending ACH', read-only Reference # and Created Time, editable Posting Date (date picker min=today), Amount (currency), Comment (textarea, initially empty). Confirm SAVE and REMOVE are both DISABLED until you type into Comment (formik.dirty+valid) — verifying BR-A4.
4. Type a comment, click REMOVE; reload the ACH History and confirm the row's ACH Status becomes INACTIVE (soft-disable, BR-A6) and an activity-log note 'Updated ACH Payment...' or equivalent appears on the account (BR-X1 / Gap #2).
5. Navigate to /credit-card-history/{accountPk}. Confirm the PENDING CC row shows a pencil; click it. Confirm modal title 'Edit Pending Credit Card Payment' and that the Comment field is PREFILLED with the existing comment.
6. Permission contrast (BR-C1): log in (or use a role) WITHOUT CC modify permission but with CC History view; confirm the CC pencil still appears and the modal still opens (no gate), while on /ach-history the ACH pencil is hidden without ACH permissions.
7. HIGH-RISK BR-C3: open the pending CC edit modal, set Posting Date to TODAY, change the amount, click SAVE. Confirm via the CC History row + payment gateway that the card was CHARGED immediately (status moves out of PENDING / a capture occurs) rather than just saved. Then repeat with a FUTURE posting date and confirm it only saves (stays PENDING).
8. BR-C4: attempt to confirm only PENDING->PENDING/CANCELLED is allowed — verify no UI path lets you edit a non-PENDING CC row (pencil absent), consistent with the backend guard.


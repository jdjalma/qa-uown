---
title: Servicing — Payment Arrangement Creation Flow & Status Lifecycle
domain: knowledge-base
status: hypothesis
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: source-audit (no live env)
  - code: servicing FE @ R1.50.2 (2026-04-07, stale)
  - code: svc backend @ R1.53.0
covers:
  - payment-arrangement-creation
  - multi-leg-payment
  - arrangement-status-lifecycle
  - makeCreditCardPayments
  - createOrUpdateACHPayments
promoted_to: []
---

> ⚠️ **Source-grounded draft — NOT yet live-verified.** Produced by the multi-agent code+backend audit `servicing-doc-gap-audit` (2026-06-25). The local servicing **frontend** checkout is branch **R1.50.2 (2026-04-07)** — stale vs the sandbox deploy (see memory `local-servicing-fe-stale-r1502`); the **backend** (svc) is R1.53.0. Claims are tagged `[confirmed-source]` (read in code), `[inferred]`, or `[needs-live]` (UI/visual claim to verify in sandbox). `status: hypothesis` until the Live-Verify Checklist at the bottom is run. This is an execution/investigation record, NOT a source of test patterns (rule #16).

# Servicing — Payment Arrangement CREATION Flow + Status Lifecycle

> Charter: Document HOW a multi-leg payment arrangement is **created** (the open gap in `servicing-payment-arrangement-page.md`, which only covers the read-only list) and how its status is recomputed over its lifetime.
> Scope: extends [[servicing-payment-arrangement-page]]. The list/read page is documented there; this doc covers the write/creation path + `PaymentArrangementStatus` machine.
> Overall confidence: high on backend (full source read); the creation UI surface (the checkbox itself) lives in the external `@uownleasing/common-ui` `PaymentModal` and is `[needs-live]`.

---

## Purpose

A **payment arrangement** is a multi-leg catch-up / installment plan: several future CC or ACH payment legs grouped under one `SvPaymentArrangement` row. The grouping row tracks an aggregate `amount`, a `startDate`/`endDate` window, and a roll-up `status`.

Creation does **not** happen on the `/payment-arrangement/{accountPk}` page (that page is read-only — list + expandable legs). Creation happens from the **Make Payment modal** by checking a **Payment Arrangement** option, which makes the modal submit *multiple* legs in one request to a `…Payments` (plural) endpoint instead of the single-leg `…Payment` endpoint. `[confirmed-source]` (endpoint wiring) / `[needs-live]` (the checkbox UI)

**Actors:** Servicing agents (gated by the `payment` / payment-modal permission; see Business Rules). `[confirmed-source]`

---

## Portal / URL

| Property | Value |
|---|---|
| Portal | Servicing (`svc-website-{env}.uownleasing.com`) `[inferred]` |
| Entry surface | **Make Payment** modal (opened from Account Summary), NOT a dedicated URL `[confirmed-source]` |
| Modal component | `PaymentModal` from `@uownleasing/common-ui` (external pkg — source not in this repo) `[confirmed-source]` |
| Modal mount | `servicing/layouts/auth/index.tsx:699-711` (gated `isDisplayMakePaymentModal && hasPaymentPermission && customerStore?.bankAccounts`) `[confirmed-source]` |
| Read-only list (separate) | `/payment-arrangement/{accountPk}` — see [[servicing-payment-arrangement-page]] `[confirmed-source]` |

---

## Available Operations

| Operation | UI trigger | Store action (frontend) | Endpoint | Backend handler |
|---|---|---|---|---|
| Create CC arrangement (multi-leg) | Make Payment modal, Payment Arrangement checked, CC selected | `ACHStore.makeCreditCardPayments` (`ach.tsx:239-272`) | `POST /uown/svc/makeCreditCardPayments` | `SvcCreditCardController:99` → `PaymentArrangementService.runTransactions` (`:56-130`) `[confirmed-source]` |
| Create ACH arrangement (multi-leg) | Make Payment modal, Payment Arrangement checked, ACH selected | `ACHStore.updateACHPayments` (`ach.tsx:123-150`) | `POST /uown/svc/createOrUpdateACHPayments` | `SvcACHPaymentController:49` → `PaymentArrangementService.createOrUpdateAchPayments` (`:132-201`) `[confirmed-source]` |
| Single CC payment (NO arrangement) | Make Payment modal, Payment Arrangement unchecked, CC | `ACHStore.makeCreditCardPayment` (singular, `ach.tsx:167-202`) | `POST /uown/svc/makeCreditCardPayment` | (single-leg path) `[confirmed-source]` |
| Single ACH payment (NO arrangement) | Make Payment modal, Payment Arrangement unchecked, ACH | `ACHStore.updateACHPayment` (singular, `ach.tsx:94-121`) | `POST /uown/svc/createOrUpdateACHPayment` | `SvcACHPaymentController:44` `[confirmed-source]` |
| Status recompute (no direct UI) | side-effect of editing any pending leg | — | (internal) | `PaymentArrangementService.refreshFromTransactions` (`:309-348`) `[confirmed-source]` |

Note the singular-vs-plural naming: the **plural** store actions (`makeCreditCardPayments` / `updateACHPayments`) and the **plural** endpoints (`makeCreditCardPayments` / `createOrUpdateACHPayments`) are the arrangement path; the singular ones are ordinary one-off payments. Both pairs are wired into the same `PaymentModal` via separate props (`handleMakeCreditCardPayment` vs `handleMakeCreditCardPayments`; `handleMakeAchPayment` vs `handleMakeAchPayments`) at `layouts/auth/index.tsx:706-710`. `[confirmed-source]`

---

## Flow & States

### CC creation (`runTransactions`, `:56-130`) `[confirmed-source]`

1. Guard: proceed as an arrangement only if `paymentArrangement.isPaymentArrangement()` AND `creditCardTransactions` is non-empty. (`isPaymentArrangement` / the DTO field `paymentArrangement` defaults to `TRUE`; `arrangementType` defaults to `NORMAL`.) `[confirmed-source]`
2. Sort legs by `postingDate` ascending. `[confirmed-source]`
3. Sum all leg `amount`s → `totalAmount`. `[confirmed-source]`
4. `createPaymentArrangement(CC, totalAmount, first.postingDate, last.postingDate)` → persists the grouping row (see createPaymentArrangement below). `[confirmed-source]`
5. Write INTERNAL activity log: `"Credit Card Payment Arrangement created. arrangementPk=<pk>"`. `[confirmed-source]`
6. **Authorize + tokenize the card ONCE**: take `ccInfo` from the **first** transaction, set its `accountPk`, call `ccTransactionService.authorizeAndTokenizeCard(ccInfo)`; the returned tokenized `ccInfo` is then **reused for every leg**. `[confirmed-source]`
7. Loop every leg: set `accountPk`, `agentUsername`, the shared tokenized `ccInfo`, and `paymentArrangementPk`; call `ccTransactionService.runTransaction(leg, publishEvent)` where `publishEvent` is `true` **only for the last leg** (`i == size-1`). `[confirmed-source]`
8. Write INTERNAL log: `"PaymentArrangementService - runTransactions executed. paymentArrangement=true"`. `[confirmed-source]`

### ACH creation (`createOrUpdateAchPayments`, `:132-201`) `[confirmed-source]`

1. If `achPayments == null` → log INTERNAL `"createOrUpdateAchPayments failed: achPayments is null."` and **throw `IllegalArgumentException("achPayments must not be null")`**. (Empty list is allowed and simply does nothing; only `null` throws.) `[confirmed-source]`
2. Arrangement created only if `isPaymentArrangement()` AND list non-empty: sort by `postingDate`, sum amounts, `createPaymentArrangement(ACH, …)`, log `"ACH Arrangement created. arrangementPk=<pk>"`. `[confirmed-source]`
3. Loop legs: set `username`, set `paymentArrangementPk`, `achPaymentService.createOrUpdateAchPayment(leg)`. `[confirmed-source]`
4. Log `"PaymentArrangementService - createOrUpdateAchPayments executed. paymentArrangement=true"`. `[confirmed-source]`

### createPaymentArrangement (shared, `:231-295`) `[confirmed-source]`

Builds and saves `SvPaymentArrangement` with: `accountPk`, `arrangementType` (from DTO, default `NORMAL`), `paymentType` (CC/ACH), `amount = totalAmount`, `startDate = first leg postingDate`, `endDate = last leg postingDate`, `username`, `previousRating = account current rating`, `currentRating = "P"`, `status = NOT_STARTED`, `active = true`, `notes = "Payment arrangement created by <user>. Type: <arrangementType>."`. Then:
- Logs `"Payment Arrangement created. arrangementPk=…, type=…, paymentType=…"`.
- **Forces the account rating to `P`** via `updateRatingLetterAndAutoPay(P, …)` + `updateAccount`, and logs `"Account rating updated to P due to new Payment Arrangement. arrangementPk=…"`.

So a single arrangement-creation emits a chain of INTERNAL logs (≥3 for the arrangement + leg-level logs + the executed log). `[confirmed-source]`

### Status lifecycle (`PaymentArrangementStatus`) `[confirmed-source]`

Enum values (`svc-common/.../enumeration/PaymentArrangementStatus.java`): `NOT_STARTED`, `IN_PROGRESS`, `SUCCESS`, `FAILED`.

```
            create
              │
              ▼
        NOT_STARTED ──────────────┐
              │  refreshFromTransactions
              ▼
   ┌──────────┴──────────┐
   │ any leg DENIED/ERROR │ → FAILED
   │ any leg PENDING      │ → IN_PROGRESS (if today >= startDate)
   │ any leg PENDING      │ → NOT_STARTED (if startDate in future)
   │ all legs approved    │ → SUCCESS
   └──────────────────────┘
```

`refreshFromTransactions(pk)` (`:309-348`) **recomputes status from scratch** every time it runs:
- Loads arrangement; loads its CC transactions ordered by postingDate.
- If no transactions: logs `"No payments found for arrangement <pk>"` and returns without changing status. `[confirmed-source]`
- Resets `startDate`/`endDate` from the current first/last leg postingDates.
- `hasFailure` (any `DENIED` or `ERROR`) → `FAILED`.
- else `hasPending` (any `PENDING`) → `IN_PROGRESS` if `today >= startDate`, otherwise `NOT_STARTED`.
- else → `SUCCESS` (all approved).
- Logs `"Payment arrangement updated. Status is <X>"` and saves. `[confirmed-source]`

**Prohibited / non-enforced transitions:** there is **no state-machine guard** — status is fully derived from current leg states on each recompute. Therefore any transition is reachable, including ones that look like regressions: `FAILED → SUCCESS` (the failing leg edited to approved), `IN_PROGRESS → NOT_STARTED` (start date pushed into the future), `SUCCESS → FAILED` (a leg later errors). Do not assume monotonic progression. `[confirmed-source]` `[inferred]` (consequence)

---

## Business Rules

- **BR-01 — Arrangement vs single payment is decided by the "Payment Arrangement" flag, not by leg count.** The DTO field `paymentArrangement` (default `TRUE`) gates the arrangement branch; only when it is true AND the leg list is non-empty is an `SvPaymentArrangement` row created. The modal's Payment Arrangement checkbox drives this flag. `[confirmed-source]` (flag) / `[needs-live]` (checkbox→flag binding, in external PaymentModal)
- **BR-02 — Creating an arrangement forces the account rating to `P` (paying/arrangement).** `previousRating` is snapshotted; `currentRating` set to `P`; the account itself is updated to `P`. `[confirmed-source]`
- **BR-03 — A new arrangement is born `NOT_STARTED` and `active = true`.** `[confirmed-source]`
- **BR-04 — CC card is authorized/tokenized exactly once and the token is reused for all legs.** Avoids N authorizations for an N-leg plan. `[confirmed-source]`
- **BR-05 — Only the last CC leg publishes the completion event** (`publishEvent` true only on `i == size-1`). Downstream event-driven side effects fire once per arrangement, not per leg. `[confirmed-source]`
- **BR-06 — `startDate`/`endDate` = earliest/latest leg `postingDate`; `amount` = sum of leg amounts.** Recomputed on every `refreshFromTransactions`. `[confirmed-source]`
- **BR-07 — ACH creation rejects a `null` payment list with `IllegalArgumentException` (HTTP 500) + an INTERNAL failure log.** An empty (non-null) list is a no-op, not an error. `[confirmed-source]`
- **BR-08 — Editing any pending leg recomputes the parent arrangement status.** `CCUpdateTransactionService.updateInsideTransaction` (`:72-74`) and `AchUpdatePaymentService.updateAchPayment` (`:62-65`) call `refreshFromTransactions(paymentArrangementPk)` when the leg carries a `paymentArrangementPk`. This is the cascade that ties one leg edit to the arrangement row. `[confirmed-source]`
- **BR-09 — Every creation step writes an INTERNAL activity log.** Per Rule #13 (no log = nothing happened), expected logs are: `"Payment Arrangement created…"`, the type-specific `"Credit Card Payment Arrangement created…"` / `"ACH Arrangement created…"`, `"Account rating updated to P…"`, the `"…executed. paymentArrangement=true"` log, and on each recompute `"Payment arrangement updated. Status is X"`. `[confirmed-source]`

---

## Logic & Exceptions

- **ACH status recompute reads the CC table — ACH arrangements likely never recompute from their own legs.** `refreshFromTransactions` only queries `creditCardTransactionRepo.findByPaymentArrangementPkOrderByPostingDate(pk)`. For an ACH-type arrangement that query returns empty, so the method logs `"No payments found for arrangement <pk>"` and returns **without updating status** — even though `AchUpdatePaymentService` explicitly calls it after editing an ACH leg. Net effect: an ACH arrangement appears stuck at `NOT_STARTED` regardless of leg outcomes. `[confirmed-source]` (the CC-only query + early return) / `[inferred]` (the user-visible "stuck status" consequence — verify live). This is the highest-value candidate defect in this flow; do NOT classify as a bug without fresh reproduction per Rule #10.
- **`IllegalArgumentException` on null ACH list** surfaces to the client as a 500; the frontend `updateACHPayments` treats any non-200 / `error` / `errorCode` as failure and logs `"Unable to update ACH payments"`. `[confirmed-source]`
- **Tokenization failure on the first CC leg** aborts before any leg runs (it happens before the leg loop). `[inferred]` — exact rollback semantics of `authorizeAndTokenizeCard` not read here.
- **Status is advisory, not gating** — nothing in this service blocks edits based on current status; legs can be edited freely, recomputing status each time. `[confirmed-source]`

---

## Connections

- [[servicing-payment-arrangement-page]] — the read-only list + expandable legs (creation was its OPEN GAP; this doc closes it).
- [[servicing-payment-transaction-page]] / [[servicing-payment-history-page]] — where individual CC/ACH legs and their statuses surface.
- [[scheduled-payments]] — Due Amounts / scheduled legs context.
- [[payment-flows]] (skill) — CC authorize+tokenize, ACH posting mechanics.
- [[activity-log-validation]] (skill) — the INTERNAL logs above are the primary evidence of each step (Rule #13).
- Rating side effect (`P`) connects to rating-letters / auto-pay domain (`resolve rating-letters`).

---

## Gaps

- **G-01 `[needs-live]`** — The **Payment Arrangement checkbox** and the multi-leg entry grid live in the external `@uownleasing/common-ui` `PaymentModal`; its source is not in this repo (package not installed). The checkbox label, its enable/disable gating, how legs/dates are entered, and which permission hides it are unconfirmed from code. Verify in sandbox.
- **G-02 `[needs-live]`** — Which exact permission gates the *creation* path. The navbar **Payment Arrangement** *list* option is gated by `hasPaymentArrangementPermission` (`payment_arrangement` perm, `access-permissions.ts:15`), but the modal is gated by `hasPaymentPermission` (`layouts/auth/index.tsx:700`). Whether the checkbox itself is additionally gated by `payment_arrangement.modify` is unconfirmed. `[confirmed-source]` (the two distinct gates) / `[needs-live]` (checkbox gate).
- **G-03 `[inferred]`** — ACH-arrangement status never updating (see Logic) needs a live/DB reproduction to confirm it is a real defect vs. an unreached path.
- **G-04** — `ArrangementType` values beyond `NORMAL` not enumerated here; the modal may offer other types. `[needs-live]`
- **G-05** — `authorizeAndTokenizeCard` rollback/partial-failure behavior across legs not traced. `[inferred]`

## Live-Verify Checklist (run before trusting `[needs-live]` claims)

1. Log into Servicing sandbox (svc-website-sandbox.uownleasing.com) as an agent with payment permissions; open an account that has a saved bank account AND a saved credit card (the modal only mounts when customerStore.bankAccounts is present).
2. From the Account Summary, click the Make Payment button to open the PaymentModal. CONFIRM G-01: a 'Payment Arrangement' checkbox/toggle exists in the modal; capture its exact label and position.
3. With Payment Arrangement UNCHECKED, observe the network tab while submitting a CC payment — confirm it POSTs to /uown/svc/makeCreditCardPayment (singular). Then CHECK Payment Arrangement, add 2+ legs with different posting dates, submit, and confirm it POSTs to /uown/svc/makeCreditCardPayments (plural) with a creditCardTransactions array. This confirms BR-01 and the singular/plural split.
4. Repeat with ACH selected: confirm the arrangement submit POSTs to /uown/svc/createOrUpdateACHPayments (plural) with an achPayments array; the single payment uses /uown/svc/createOrUpdateACHPayment (singular).
5. After creating a CC arrangement, open /payment-arrangement/{accountPk} and confirm a new row appears with status NOT_STARTED and amount = sum of the legs; open the account Activity Log and confirm the INTERNAL entries: 'Payment Arrangement created…', 'Credit Card Payment Arrangement created. arrangementPk=…', 'Account rating updated to P due to new Payment Arrangement', and 'runTransactions executed' (BR-02/BR-03/BR-09).
6. Confirm BR-02 live: check the account header/rating shows 'P' immediately after arrangement creation (snapshot previous rating first).
7. Confirm BR-08 cascade: edit one pending CC leg (e.g., change its status to approved or change posting date) and confirm a new 'Payment arrangement updated. Status is X' INTERNAL log appears and the arrangement row status changes accordingly.
8. Confirm G-03 (ACH recompute defect): create an ACH arrangement, edit one of its pending ACH legs, and check the Activity Log — if you see 'No payments found for arrangement <pk>' and the status stays NOT_STARTED despite the leg change, the CC-only query bug is reproduced (then verify the row status in DB before classifying).
9. Confirm G-02: check whether a user holding only the payment-modal permission but NOT payment_arrangement.modify still sees/uses the Payment Arrangement checkbox.


---
title: Servicing — Payment History Page (Reverse / Refund / Update / Rewind)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (1 PAID CC payment of $10.00)"
  - url: https://svc-website-sandbox.uownleasing.com/payment-history/17298
  - code: servicing/pages/payment-history/[account].tsx
  - code: servicing/components/reverse-payment-modal/index.tsx
  - code: servicing/components/modals/update-payment/index.tsx
  - code: servicing/domain/stores/payment.tsx
covers:
  - servicing-payment-history
  - reverse-payment
  - refund-payment
  - update-payment-allocation
  - rewind-replay
  - allocation-strategy
promoted_to: []
---

# Servicing — Payment History Page (Reverse / Refund / Update / Rewind)

> Charter: Explore `/payment-history/{accountPk}` with Playwright MCP + source to document the payment list and its mutating actions (reverse, refund, update allocation, rewind & replay).
> Origin: gap analysis — the screen where payments are reversed/refunded was undocumented (2026-06-25) · Overall confidence: high

---

## Purpose

The **Payment History** screen — reached via navbar **History ▸ Payments**. Unlike the read-only [[servicing-payment-transaction-page]] (allocation ledger), this page is where an agent **acts on a posted payment**: reverse it, refund it (full/partial), re-allocate it, or rewind-and-replay the whole account.

**Actors:** Servicing agents/supervisors with the relevant payment-mutation permissions.

---

## Portal / URL

| Property | Value |
|---|---|
| Route | `/payment-history/{accountPk}` (`[account].tsx`) |
| Page title (h1) | **"Payment History"** `[confirmed]` |
| Auth | Required. Shares Account Summary header (no identity gate). |
| Fetch | `GET /uown/svc/getPayments/{pk}` `[confirmed]` |

---

## Table columns (`data-table-columns.tsx:1379-1472`)

| Column | Notes |
|---|---|
| Payment Date | sortable, **default sort DESC** (newest first) |
| Amount | currency |
| Funding Account | instrument: `CC` / `ACH` / `CHECK` `[confirmed: CC]` |
| Status | `PAID` / `REVERSED` / `MANUAL_REVERSE` (… ) |
| Allocation Strategy | how the payment was applied — e.g. `REGULAR_RECEIVABLES` `[confirmed]` |
| Comment | reason/notes |
| **Reverse Payment** | action icon (undo) — only for `PAID` rows; perm `reverse_payment` OR `refund_payment` |
| **Update Payment** | action icon (edit) — only for `PAID` rows; perm `payment_history.update_payment` |

- **Conditional styling:** `REVERSED` / `MANUAL_REVERSE` rows render **red + strikethrough**. `[source]`
- Pagination: 10 (default) / 15 / 20 / 25 / 30.

---

## Toolbar — Rewind / Replay

A **Rewind/Replay** button (clock-rotate-left icon) sits top-right of the table. `[confirmed]`
- Perm `payment_transaction.rewind_replay_account`.
- Opens a confirmation modal ("Do you wish to proceed?") → `POST /uown/svc/rewindAndReplayAccount/{accountPk}`.
- Rebuilds the account's payment/allocation state by replaying its transactions. **High-impact action** — recomputes the ledger.

---

## Reverse / Refund modal `[confirmed live]`

Opening the Reverse icon on a `PAID` row opens **"Reverse / Reallocate Payment"**:

| Field | Behaviour |
|---|---|
| Transaction Date | read-only (`06/25/2026`) |
| Type | read-only (`CC`) |
| Payment Amount | read-only for *Reverse* / *Fully Refund*; **editable** for *Partially Refund* (min `0.01`, max original amount) |
| **Reverse Reason** | select — **3 options: `Reverse`, `Fully Refund`, `Partially Refund`** `[confirmed live]` |
| Refund Convenience Fee | checkbox — appears only when *Fully Refund*; defaults checked `[source]` |
| Comment | textarea, **required**, 1–500 chars |
| Buttons | CANCEL / **SAVE** (form id `revertPaymentForm`) |

**Permission gating of the reason options:** `Reverse` needs `reverse_payment`; `Fully/Partially Refund` need `refund_payment`; **refund is hidden for CHECK payments**. `[source]`

### Action endpoints
| Reason | Endpoint | Body |
|---|---|---|
| Reverse | `POST /uown/svc/reversePayment` | `{ reason, paymentPk, accountPk }` |
| Refund (full/partial) | `POST /uown/svc/refundPayment` | `{ paymentPk, refundFee, amount, comment }` |

---

## Update Payment modal

Opening the Update (edit) icon on a `PAID` row opens a modal with one field:
- **Allocation Strategy** (required select; options = enum `AllocationNames` / `AllocationType.ts`) — re-allocates a paid payment across the account's receivables.
- Submit enabled only when changed (dirty + valid) → `POST /uown/svc/updatePayment` (payment object with new `paymentInfo.allocationStrategy`).

---

## Business Rules

- **BR-01:** Reverse/Update actions are available **only on `PAID` rows**. `[confirmed]` (icons present on the PAID row)
- **BR-02:** A reversal/refund **requires a comment** (1–500 chars). `[source]`
- **BR-03:** Partial refund lets the agent edit the amount (0.01 ≤ x ≤ original); Reverse/Full Refund lock the amount. `[confirmed live]` (modal field states)
- **BR-04:** Refund is **not offered for CHECK** payments. `[source]`
- **BR-05:** Reversed payments show struck-through red and their legs appear under *All Transactions* (not *Active*) on the [[servicing-payment-transaction-page]]. `[inferred]`
- **BR-06:** Rewind/Replay recomputes the whole account ledger — confirmation-gated. `[confirmed]`
- **BR-07:** Every reverse/refund/update must leave an activity-log entry on the account (see [[activity-log-validation]]) — assert it. `[expected]`

---

## API summary

`GET getPayments/{pk}` · `POST reversePayment` · `POST refundPayment` · `POST updatePayment` · `POST rewindAndReplayAccount/{pk}` (all `/uown/svc/`).

---

## Connections with What Was Already Known

- **Relates to:** [[servicing-payment-transaction-page]] (the allocation ledger that *displays* the result of these mutations), [[scheduled-payments]] (Due Amounts), [[sticky-payment-refund]] (Sticky-recovery refunds are a distinct path — this is the standard CC/ACH reversal).
- **New:** the reverse/refund/update/rewind action set and the `Reverse / Reallocate Payment` modal (3 reasons, comment-required, partial-refund editable amount).

---

## Gaps / To Investigate

1. Full `Status` enum and `AllocationNames` value list. `[gap]`
2. Live reverse/refund **not executed** (would mutate the test payment) — happy-path + the resulting activity log to be verified with a disposable fresh payment ([[test-data-hierarchy]] — pay via UI then reverse). `[gap]`
3. Rewind/Replay effects (what exactly is recomputed, side effects) not exercised. `[gap]`
4. Role-based visibility of the action icons. `[gap]`

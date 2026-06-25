---
title: Servicing — Payment Transactions Page (Transaction History)
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (Sanjay James, Tire Agent, 13-month ACTIVE lease)"
  - url: https://svc-website-sandbox.uownleasing.com/payment-transaction/17298
  - code: servicing/pages/payment-transaction/[account].tsx
  - code: servicing/utils/data-table-columns.tsx#663-798
  - code: servicing/domain/stores/payment.tsx
covers:
  - servicing-payment-transaction
  - transaction-history
  - transaction-summary
  - receivable-allocation
  - email-csv
  - reallocate-payment
promoted_to: []
---

# Servicing — Payment Transactions Page (Transaction History)

> Charter: Explore `/payment-transaction/{accountPk}` with Playwright MCP + source to document the Transaction-history table, its summary metrics, allocation rows, and CSV export.
> Origin: gap analysis — Servicing "Transaction" tab was undocumented (2026-06-25) · Overall confidence: high

---

## Purpose

The **Transaction History** screen — reached via the left-rail **"Transaction"** tab on any account, or the navbar **Servicing ▸ Payment Transaction**. It is a **read-only ledger** of how every payment was *allocated* across receivables (it is NOT the "Make a Payment" form — that is a modal, see [[servicing-documents-page]]).

One submitted payment can produce **multiple ledger rows** — one per receivable/allocation leg (e.g. a `REALLOCATE_PAYMENT` parent line + `REALLOCATE_CC` legs against each `REGULAR_PAYMENT` receivable). All legs share the same **Payment Number**.

**Actors:** Servicing agents, supervisors, admins.

---

## Portal / URL

| Property | Value |
|---|---|
| Route | `/payment-transaction/{accountPk}` (`[account].tsx`) |
| Auth | Required. **No identity-verification gate here** — that modal is specific to `/customer-information` (see [[servicing-customer-information-page]] BR-00). `[confirmed]` |
| Shared header | Same Account Summary bar (Account #, Ref Account→Origination, Status, New Status combobox, Next Payment, Merchant, Program Type) + 3 action icons (Prorated / Make Payment / Send Invite) present on all per-account pages. |

---

## Summary Metrics (top band)

| Metric | Example (17298) | Source |
|---|---|---|
| Total Payments | $10.00 | `getTransactionSummary/{pk}` |
| Total Late Fees | $0.00 | |
| Total NSF Fees | $0.00 | |
| Total Contract Balance | $1,334.15 | |
| Remaining Contract Balance | $1,324.15 | |
| EPO Pool Amount | $0.00 | |

**Filter dropdown:** `Active Transactions` (default) vs `All Transactions`. *Active* hides reversed/cancelled/refund legs. `[confirmed]`

---

## Table — 17 columns (`data-table-columns.tsx:663-798`)

Payment Number · Payment Date (EST) · Total Payment Amount · **Receivable Type** · Applied Due Date · Days Late · Payment Due · Applied Amount · Remaining Due · Carry Over · Next Due Date · **Payment Type** · Reversed / Refunded · Running past due · **Scheduled Type** · Scheduled Date · User.

- **Conditional styling:** rows that are cancelled/reversed or `scheduledType = REFUND_PAYMENT` render **red + strikethrough** (`#e50000`). `[confirmed via source]`
- **Legend** below the table: "Unpaid Fee". `[confirmed]`
- **Pagination:** 10 (default) / 15 / 20 / 25 / 30 rows. Client-side sort by column.
- Observed values (17298): Receivable Type `REGULAR_PAYMENT`; Payment Type `REALLOCATE_PAYMENT`, `REALLOCATE_CC`; Status `PAID`. `[confirmed]`

---

## Export

| Button | Behaviour |
|---|---|
| **Email CSV** | opens `EmailCSVModal` → `POST /uown/emailCSV` with `endpoint: /uown/getTransactions`. Perm `payment_transaction.email_csv`. |
| **Download CSV** | direct blob download (link auto-generated beside the button). **Disabled until data loads / when empty.** Perm `payment_transaction.download_csv`. `[confirmed]` (disabled state observed) |

> Same Email-CSV "page-only vs all-rows" caveats as the Search page may apply — see [[servicing-search-quick-search]]. Not re-verified here. `[gap]`

---

## API

| Call | Method | Purpose |
|---|---|---|
| `getAccountSummary/{pk}` | GET | header bar (cached 304) |
| `getTransactions/{pk}` | GET | ledger rows |
| `getTransactionSummary/{pk}` | GET | the 6 summary metrics |
| `/uown/emailCSV` | POST | email export |

`[confirmed]` via network capture (sandbox 2026-06-25).

---

## Business Rules

- **BR-01:** One payment → many ledger rows, grouped by **Payment Number**; the parent leg carries the gross amount, child legs carry per-receivable allocation. `[confirmed]` (3 rows for Payment Number 2192209, all $10.00 total)
- **BR-02:** Default filter is **Active Transactions** (reversed/refund legs hidden); switch to *All* to audit reversals. `[confirmed]`
- **BR-03:** No identity-verification gate on this page (unlike customer-information). `[confirmed]`
- **BR-04:** Reversed/refunded legs are shown struck-through in red. `[inferred via source]`

---

## Connections with What Was Already Known

- **Relates to:** [[servicing-payment-history-page]] (the *Payment History* page is where reversals/refunds are *performed*; this page only *displays* the resulting allocation legs).
- **Relates to:** [[scheduled-payments]] (Due Amounts) — `REALLOCATE_*` legs here are the downstream effect of reallocation/skip/waive actions there.
- **New:** the allocation-ledger model (parent + legs per receivable) and the 6 summary metrics.

---

## Gaps / To Investigate

1. Email/Download CSV column set & all-rows-vs-page behaviour not re-verified. `[gap]`
2. Full enum of Payment Type / Scheduled Type values (only `REALLOCATE_PAYMENT`, `REALLOCATE_CC`, `REGULAR_PAYMENT`, `REFUND_PAYMENT` seen). `[gap]`
3. Role-based visibility of Email/Download CSV. `[gap]`

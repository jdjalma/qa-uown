---
title: Servicing — Payment Arrangement Page
domain: knowledge-base
status: snapshot
volatility: stable
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (empty-state — no arrangements)"
  - url: https://svc-website-sandbox.uownleasing.com/payment-arrangement/17298
  - code: servicing/pages/payment-arrangement/[account].tsx
  - code: servicing/components/payment-arrangement-expandable-row/index.tsx
  - code: servicing/domain/stores/payment.tsx
covers:
  - servicing-payment-arrangement
  - installment-plan
  - arrangement-expandable-row
  - payment-plan
promoted_to: []
---

# Servicing — Payment Arrangement Page

> Charter: Explore `/payment-arrangement/{accountPk}` with Playwright MCP + source to document the arrangement list, its expandable per-payment legs, and endpoints.
> Origin: gap analysis (2026-06-25) · Overall confidence: medium (live empty-state only — column/expand detail from source)

---

## Purpose

Lists the **payment arrangements** (installment plans / catch-up plans) created for an account. Reached via navbar **Servicing ▸ Payment Arrangement**. Each arrangement row expands to show the **individual ACH and CC payment legs** scheduled under that plan.

**Actors:** Servicing agents, supervisors (gated by `payment_arrangement` view perm).

---

## Portal / URL

| Property | Value |
|---|---|
| Route | `/payment-arrangement/{accountPk}` (`[account].tsx`) |
| Page title (h1) | **"Payment Arrangements"** `[confirmed]` |
| Auth | Required. Shares the Account Summary header bar (no identity gate). |
| Empty state | "There are no records to display" `[confirmed]` (acct 17298 has no arrangements) |

---

## Main table (one row per arrangement)

| Column | Notes |
|---|---|
| Arrangement Pk | sortable |
| Payment Type | ACH / CC |
| Start Date | sortable |
| End Date | sortable |
| Total Amount | currency |
| Status | sortable — e.g. `NOT_STARTED`, … (full enum `[gap]`) |
| Created At | `MM/DD/YYYY h:mm:ss A`, sortable |
| Created By | agent username |

Pagination: 10 (default) / 15 / 20 / 25 / 30 / 40 / 50 / 100; server-side paging supported. `[source]`

### Expandable row (click an arrangement)
Reveals nested payment legs split by instrument:

**ACH leg sub-table:** Payment PK · Date · Amount · Status · Account Number · Type · Error.
**CC leg sub-table:** Payment PK · Date · Amount · Fee · Status · Vendor · Card (last 4).

`[source: payment-arrangement-expandable-row/index.tsx]` — not visually verified (no arrangement on the test account).

---

## API

| Call | Method | Purpose |
|---|---|---|
| `accounts/{pk}/payment-arrangements?page={n}&size={s}` | GET | paginated arrangement list `[confirmed]` |
| `payment-arrangements/{arrangementPk}/payments` | GET | the ACH/CC legs for one arrangement (on expand) `[source]` |

(both under `/uown/svc/`). `[confirmed]` for the list call via network capture.

---

## Data model

- `PaymentArrangement`: pk, accountPk, agent/username, startDate, endDate, amount, arrangementType, paymentType (ACH/CC), previousRating, currentRating, status, notes, active.
- `PaymentArrangementPayment` (nested leg): pk, startDate, endDate, frequency, installmentAmount, totalAmount, status, createdBy.

---

## Business Rules

- **BR-01:** Arrangements group multiple scheduled payment legs under one plan, keyed by Arrangement Pk. `[source]`
- **BR-02:** Legs are split by instrument (ACH vs CC) in two sub-tables on expand. `[source]`
- **BR-03:** Read-only listing page — creation/cancel of arrangements happens elsewhere (modal/flow not on this page). `[inferred]` — where arrangements are *created* is a `[gap]`.

---

## Connections with What Was Already Known

- **Relates to:** [[servicing-payment-history-page]] and [[servicing-payment-transaction-page]] (legs that execute show up there once charged).
- **New:** the arrangement → ACH/CC-leg expandable model.

---

## Gaps / To Investigate

1. **Where/how an arrangement is created** (which screen/modal posts a new arrangement) — not on this page. `[gap]`
2. Full Status enum (`NOT_STARTED`, ACTIVE, COMPLETED, CANCELLED?). `[gap]`
3. Expandable-row legs not visually verified (no test arrangement) — set up an account with an arrangement and re-verify. `[gap]`

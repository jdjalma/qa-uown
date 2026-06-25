---
title: Servicing — History & Transaction-View Pages (ACH · CC · Items · Email · Phone · Due-Date · Frequency · PayNearMe)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: sandbox
  - account: "17298 (Sanjay James, Tire Agent, 13m ACTIVE; 2 CC txns, 1 due-date move)"
  - url: https://svc-website-sandbox.uownleasing.com/credit-card-history/17298
  - url: https://svc-website-sandbox.uownleasing.com/ach-history/17298
  - url: https://svc-website-sandbox.uownleasing.com/due-date-moves-history/17298
  - code: servicing/pages/{ach-history,credit-card-history,items-history,email-history,phone-history,due-date-moves-history,frequency-history}/[account].tsx
  - code: servicing/utils/data-table-columns.tsx
  - code: servicing/domain/stores/customer.tsx
  - code: servicing/layouts/auth/index.tsx
covers:
  - servicing-history-pages
  - ach-history
  - credit-card-history
  - cc-transactions
  - items-history
  - email-history
  - phone-history
  - due-date-moves-history
  - frequency-history
  - paynearme-history
  - sticky-recovery-columns
promoted_to: []
---

# Servicing — History & Transaction-View Pages

> Charter: Explore the seven read-only history/transaction pages of the Servicing portal with Playwright MCP + source — columns, endpoints, filters, the navbar dropdown they live under.
> Origin: gap analysis — none of the History-menu pages were documented (2026-06-25) · Overall confidence: high (ACH/CC/Due-Date live-verified; Items/Email/Phone/Frequency from source + shared pattern)

---

## Purpose

**Eight** **read-only, paginated table views** that surface an account's history along one axis each. All hang off the navbar **History ▸** dropdown and share the per-account **Account Summary header**. (§8 PayNearMe was added to the sandbox after the local source snapshot — see §8 note.) None mutate data (the only "actions" are edit-pending on ACH/CC, which open the pending-payment edit modals).

> The mutating *Payment History* page (reverse/refund/update/rewind) is documented separately in [[servicing-payment-history-page]]; the allocation ledger in [[servicing-payment-transaction-page]].

**Actors:** Servicing agents/supervisors; each page gated by its own view permission.

---

## Shared pattern (all 7)

- Route: `/{page}/{accountPk}` (Next.js dynamic `[account]`). Auth required; **no identity-verification gate** (that is customer-information-only — [[servicing-customer-information-page]] BR-00).
- Account Summary header bar present (Account #, Ref Account→Origination, Status, New Status combobox, Next Payment, Merchant, Program Type + Prorated/Make-Payment/Send-Invite icons).
- Table = `react-data-table-component`; columns sortable (client-side) unless noted; default **10** rows/page (options 10/15/20/25/30, or 10/25/50/100 on some).
- Empty state: **"There are no records to display"**.
- Each table title is an `h1`-style header.

---

## 1. ACH History — `History ▸ ACH`  `[live-verified]`

| Property | Value |
|---|---|
| Route | `/ach-history/{pk}` |
| Title | **"ACH History"** |
| Fetch | `GET /uown/svc/getACHPayments?accountPk={pk}` |
| Extra | **client-side "Search table" box** (filters loaded rows) |
| View perm | `ach_history` |

**Columns:** Created date · Sent date · Posting date · Original Due Date · Type · Amount · ACH Status · Confirmation # · Return Code · Return Code Description · Agent · Comment · **Edit** (pending only).
**Row action:** Edit pending ACH → `EditPendingAchModal` (+ remove for pending, perm-gated).
(17298 ACH-empty — it paid by CC.)

---

## 2. Credit Card Transactions — `History ▸ CC Transactions`  `[live-verified]`

| Property | Value |
|---|---|
| Route | `/credit-card-history/{pk}` |
| Title | **"Credit Card Transactions"** |
| Fetch | `GET /uown/svc/getCCTransactions/{pk}` |
| View perm | `credit_card_history` |

**Columns (live, 27 + expand):** *(Expand Row)* · Created Date · Posting Date · Captured Amount · Original Requested Amount · First Name · Last Name · Confirmation # · CC Number (masked) · Status · Pre Auth Status · Completed Date · Transaction Type · CC Action · CC Vendor · CC Peek · NSF · Agent · Error Detail · Description · Comments · Transaction ID · Authorization Code · Charge Fee Amount · Charge Fee · Pending Payment? · **Sticky Recovery Status** · **Sticky Txn ID** · **Edit** (pending only).

> ⚠️ The live UI has **two columns the source-column range did not list — `Sticky Recovery Status` and `Sticky Txn ID`** (Sticky-recovery integration). Treat the live table as source of truth. `[confirmed live]`

**Row styling — legend (color code):**
- red = **Error / Denied / Sticky recovery failed**
- green = **Approved**
- orange = **Cancelled**
- brown = **Refunded / Partially Refunded**
- (in-progress) = **Sticky recovery in progress (started / retrying) — expand for retry attempts**
- = **Sticky recovered**

**Expand Row** reveals Sticky-recovery retry attempts (disabled when none). Row action: Edit pending CC → `EditPendingCCPaymentModal`.

**Observed values (17298):** `SALE`/`AUTHENTICATION` (CC Action), `REQUEST`/`OTHER` (Transaction Type), `APPROVED` (Status), `SUCCESS` (Pre Auth), Vendor `CHANNEL_PAYMENTS_CC`, CC Peek `true`. The `$1.01` `AUTHENTICATION` row is the card-validation auth by `manager`. `[confirmed]`

→ Connects to [[sticky-payment-refund]] / [[sticky-recover-cancel-sweep]] (Sticky columns) and [[seon-gate-real-mechanics]] (CC Peek).

---

## 3. Items Purchased — `History ▸ Items Purchased`  `[source]`

| Property | Value |
|---|---|
| Route | `/items-history/{pk}` |
| Title | **"Purchased Items History"** |
| Fetch | `GET /uown/svc/getAccountSummary/{pk}` → `accountSummary.items[]` (no dedicated endpoint) |
| View perm | `items_history` |

**Columns:** Qty · Qty Delivered · Category · Item Code · Serial Number · Price · Total · Description · Deliver Date · Status. Read-only. (Same data linked from the Account Summary "Items Purchased" count.)

---

## 4. Email History — `History ▸ Email`  `[source]`

| Property | Value |
|---|---|
| Route | `/email-history/{pk}` |
| Title | **"Email History"** |
| Fetch | `GET /uown/svc/getPrimaryCustomerEmailHistory/{pk}` |
| View perm | `email_history` |

**Columns:** Date (default sort DESC) · Updated Email · Email Type · Modification Type · Change Made By. Read-only audit of email-field changes.

---

## 5. Phone History — `History ▸ Phone`  `[source]`

| Property | Value |
|---|---|
| Route | `/phone-history/{pk}` |
| Title | **"Phone History"** |
| Fetch | `GET /uown/svc/getPrimaryCustomerPhoneHistory/{pk}` |
| View perm | `phone_history` |

**Columns:** Date (default sort DESC) · Updated Phone (formatted w/ area code) · Phone Type · Modification Type · Change Made By. Read-only audit of phone-field changes.

---

## 6. Due Date Moves History — `History ▸ Due Date Changes`  `[live-verified]`

| Property | Value |
|---|---|
| Route | `/due-date-moves-history/{pk}` |
| Title | **"Due Date Moves History"** |
| Fetch | `GET /uown/svc/accounts/{pk}/due-date-moves?page={n}&size={s}` — **server-side pagination** |
| View perm | `due_date_moves_history` |

**Columns:** Date · Agent · Previous Due Date · Days Moved · FPD Change · Adjustment Type.
**Observed (17298):** `06/25/2026 08:49AM · jmendes.gow · 07/15/2026 · -2 · No · SCHEDULE_SHIFT`. `[confirmed]` → links to the "# of Due Date Moved" counter on customer-information and [[scheduled-payments]] (Move Due Date action).

---

## 7. Frequency Changes — `History ▸ Frequency Changes`  `[source]`

| Property | Value |
|---|---|
| Route | `/frequency-history/{pk}` |
| Title | **"Frequency Changes"** |
| Fetch | `GET /uown/svc/accounts/{pk}/frequency-changes` |
| View perm | `frequency_history` |

**Columns:** Date (default sort DESC by `rowCreatedTimestamp`) · User · From (old freq) · To (new freq) · Old Payment · New Payment · First Due Date · Second Due Date. Audit of `changePaymentFrequency` actions from the Servicing Information panel.

---

## 8. PayNearMe History — `History ▸ PayNearMe`  `[live-verified]`

| Property | Value |
|---|---|
| Route | `/paynearme-history/{accountPk}` |
| Title | **"PayNearMe History"** |
| Nav item | a **`<button>`** in the History dropdown (not a plain link) — routes to the page |
| View perm | (likely `paynearme_history` / equivalent) `[needs-verify]` |

⚠️ **This page was missing from the original 7-page sweep — it is the 8th History page.** It does **not exist in the local frontend checkout** (branch R1.50.2, 2026-04-07) — it was deployed to sandbox afterward; the **live UI is authoritative** (see memory `local-servicing-fe-stale-r1502`). All claims here are from live MCP, not source.

**Structure — 3 tabs**, each backed by its own endpoint:
| Tab | Endpoint (GET) |
|---|---|
| **Attempts** (default) | `/uown/svc/paynearme/accounts/{pk}/history/attempts` |
| **Payment Callback** | `/uown/svc/paynearme/accounts/{pk}/history/payment-callbacks` |
| **Order Change Callback** | `/uown/svc/paynearme/accounts/{pk}/history/order-change-callbacks` |

- Read-only history of the customer's **PayNearMe** (cash-at-retail / kiosk) payment activity: each pay **attempt**, each PayNearMe **payment callback** (webhook), and each **order-change callback**.
- Empty state "There are no records to display" (acct 17298 has no PayNearMe activity — `[confirmed]`).
- Column sets per tab **not captured** (no rows on the test account) — `[gap: needs an account with PayNearMe history]`.
- Distinct from the older local-source `/uown/pw/*` endpoints (prepareAllocation/confirmAllocation/requestAffordability) — those are a separate affordability/allocation flow, NOT this svc-side history. `[inferred]`

---

## Endpoint quick-reference

| Page | Method · Path | Paging |
|---|---|---|
| ACH | GET `getACHPayments?accountPk={pk}` | client |
| CC | GET `getCCTransactions/{pk}` | client |
| Items | GET `getAccountSummary/{pk}` (`.items`) | client |
| Email | GET `getPrimaryCustomerEmailHistory/{pk}` | client |
| Phone | GET `getPrimaryCustomerPhoneHistory/{pk}` | client |
| Due Date | GET `accounts/{pk}/due-date-moves?page&size` | **server** |
| Frequency | GET `accounts/{pk}/frequency-changes` | client |
| PayNearMe | GET `paynearme/accounts/{pk}/history/{attempts,payment-callbacks,order-change-callbacks}` | per-tab |

(all under `/uown/svc/`).

---

## Business Rules

- **BR-01:** All seven are **read-only**; the only row actions are *Edit pending* on ACH and CC (open pending-payment edit modals). `[confirmed/source]`
- **BR-02:** ACH and CC pages have a free-text search/filter; the other five do not. `[confirmed]`
- **BR-03:** Due Date Moves uses **server-side** pagination (`page`/`size` params); the others paginate client-side over the full fetched set. `[confirmed]`
- **BR-04:** CC Transactions surfaces **Sticky-recovery** state (status, txn id, expandable retry attempts) and a color legend — the canonical UI to inspect a Sticky recovery. `[confirmed live]`
- **BR-05:** Email/Phone/Frequency/Due-Date pages are **change audits** ("Change Made By"/"Agent"/"User") — they mirror the activity-log story ([[activity-log-validation]]) for those specific fields. `[inferred]`

---

## Connections with What Was Already Known

- **New:** the full column/endpoint map for all seven History pages (none were previously documented).
- **New:** CC Transactions' Sticky-recovery columns + legend — connects [[sticky-payment-refund]] / [[sticky-recover-cancel-sweep]] to a concrete UI surface.
- **Relates to:** [[servicing-customer-information-page]] (counters/links that deep-link here), [[scheduled-payments]] (Move Due Date / frequency change actions audited here), [[servicing-payment-history-page]] & [[servicing-payment-transaction-page]] (the payment-mutation and ledger pages, documented separately).

---

## Gaps / To Investigate

1. **Items / Email / Phone / Frequency** column rendering not live-verified (test account lacked rows for some) — confirm on an account with email/phone edits and a frequency change. `[gap]`
2. Edit-pending modals (`EditPendingAchModal`, `EditPendingCCPaymentModal`) field sets not captured. `[gap]`
3. Full enums: ACH Status / Return Code, CC `Transaction Type`/`CC Action`/`Sticky Recovery Status`, `Adjustment Type` (only `SCHEDULE_SHIFT` seen), `Modification Type`. `[gap]`
4. Role-based visibility per history permission not tested (admin `jmendes.gow` only). `[gap]`

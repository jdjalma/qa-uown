# Sticky Refund — Scenario Analysis (beyond the happy-path AC)

> Source: live discovery + 2 happy-path runs in **sandbox** 2026-06-21 (accounts 6168 weekly/223, 6215 monthly/225) + merged code (svc!1465/!1471/!1493, sticky.io!8, frontend/servicing!696). Companion to `docs/knowledge-base/sticky-payment-refund.md`.
> **This file is execution/analysis history, NOT a source of pattern.**
>
> Gustavo's AC covered only the **happy path** (refund a RECOVERED payment → REFUNDED + reversed + logged). Below are the scenarios it did **not** anticipate, grouped by risk area, each with expected behavior (code-grounded), how to trigger in sandbox, severity, and testability. Sticky only works in **sandbox** ([[sticky-refund-tests-sandbox-only]]).

Legend — Status: ✅ confirmed live · 🟢 testable now in sandbox · 🟡 needs setup/state · 🔴 needs dev/Sticky support. Severity: 🔴 high (financial/legal) · 🟡 medium · 🟢 low.

---

## 0. Confirmed live (happy path + side effects)

| # | Scenario | Result | Sev |
|---|----------|--------|-----|
| HP-1 | Refund RECOVERED STICKY/PAID payment (weekly + monthly dunning) | ✅ `POST /refundPayment 200` → outbound `STICKY_REFUND` → `REFUND_SUBMITTED` → webhook → `REFUNDED` + SvPayment `REVERSED` + 2 activity logs | — |
| HP-2 | UI feedback | ✅ toast "Successfully refunded payment.", Payment History row REVERSED + red strikethrough, CC History `Sticky Recovery Status=REFUNDED` | — |
| HP-3 | **Refund re-opens delinquency** (NOT in AC) | ✅ account 6168 Past Due `+$38.45` ($1,115.05→$1,153.50), Past Due Date moved back one period (12/05→11/28). The recovered money becomes owed again | 🔴 |

---

## A. Status-gate & idempotency (backend `RefundService` guards)

| # | Scenario | Expected (code) | Trigger | Status | Sev |
|---|----------|-----------------|---------|--------|-----|
| A-1 | Refund an **already-REFUNDED** session (idempotency) | ✅ **CONFIRMED LIVE** (17204, payment PAID + session REFUNDED): refund **blocked** → toast "Unable to refund payment.", payment **unchanged**, **no 2nd STICKY_REFUND outbound, no double money**, no new log (svc!1493 duplicate guard). **Side finding:** the stuck 17204 payment is **NOT self-healed** by re-refund — it stays PAID/stuck (no agent fix for D-1) | ✅ live | 🔴 |
| A-2 | **Double-click / concurrent** refund (webhook pending) | session `REFUND_SUBMITTED` → `RefundService` returns "submitted", **no 2nd Sticky call**; svc!1493 duplicate-payment guard | 2 rapid SAVEs on a fresh candidate | 🟡 | 🔴 |
| A-3 | Refund a **REFUND_FAILED** session | "Previous Sticky refund failed; resolve before retrying" — **blocked**; how does an agent recover? (operational gap) | force a failed refund first (A-7) | 🟡 | 🟡 |
| A-4 | Refund a session **not in RECOVERED** (CANCELED / RECOVERY_STARTED / PENDING) | ✅ **CONFIRMED LIVE** (5084, CANCELED session): refund fails with backend log "Sticky recovery is not in RECOVERED status", payment stays PAID, no STICKY_REFUND outbound (see N-1) | ✅ live | 🟡 |
| A-5 | Refund with **no approved retry attempt** | "No approved recovery attempt found for refund" | session w/o APPROVED `uown_sticky_retry_attempt` | 🟡 | 🟡 |
| A-6 | Refund with **missing stickyTransactionId** | "Missing stickyTransactionId" | — | 🔴 | 🟢 |
| A-7 | **Sticky outbound FAILS** (txn not refundable on Sticky side) | `RefundService` error → svc writes "Sticky refund failed" activity log, `failedRefunds` returned, session → `REFUND_FAILED`, **payment stays PAID** | manipulate amount/txn so Sticky 4xx | 🔴 | 🟡 |

## B. Payment-state guards (`StickyRefundPaymentService`)

| # | Scenario | Expected | Trigger | Status | Sev |
|---|----------|----------|---------|--------|-----|
| B-1 | Refund a STICKY payment **already REVERSED** | ✅ **CONFIRMED LIVE** (6168): the REVERSED STICKY row has **no reverse icon** (`isReversedOrRefunded` hides it); only PAID rows show it. (Backend guard "Only PAID Sticky payments can be refunded" would also block an API call) | ✅ live | 🟡 |
| B-2 | STICKY payment **missing ccPk** | "Sticky payment is missing credit card transaction link" | — | 🔴 | 🟢 |
| B-3 | **Empty comment** | ✅ **CONFIRMED LIVE** (6169): SAVE with blank comment → Formik error **"Comment is required."**, modal stays open, **no `POST /refundPayment`** fired (blocked client-side) | ✅ live | 🟡 |
| B-4 | Non-STICKY payment hitting the sticky path | "Payment is not a Sticky recovery payment" (backend guard; can't happen via UI) | API | 🟢 | 🟢 |

## C. Reconciliation / financial side effects (the high-risk, AC-silent area)

| # | Scenario | Expected / question | Status | Sev |
|---|----------|---------------------|--------|-----|
| C-1 | Delinquency re-opens after refund | ✅ confirmed (HP-3). Verify ALL derived figures recompute: Days Past Due, EPO Balance, Settlement Amount, Payment Count, 90-day total | 🟢 | 🔴 |
| C-2 | Refund on **SETTLED_IN_FULL** account | **CONFIRMED LIVE** (6158): **no state guard** — refund proceeds (toast "Successfully refunded payment.", payment REVERSED, sticky REFUNDED). The account **auto-reverts SETTLED_IN_FULL → ACTIVE** (un-settles the customer) + delinquency moves back (12-12 → 12-05), but leaves **`settled_in_full_date_time` populated** (ACTIVE account with a ghost settlement timestamp). Refunding **re-opens a negotiated settlement** | ✅ live | 🔴 |
| C-3 | Refund on **CHARGED_OFF / CANCELLED / SOLD** account | **CONFIRMED LIVE** (6228 CHARGED_OFF, 6214 CANCELLED, **6166 SOLD**): **no state guard** — refund proceeds (payment REVERSED, sticky REFUNDED). Unlike SETTLED, the account **stays CHARGED_OFF / CANCELLED / SOLD** → money returned on a written-off / terminated / **sold-to-buyer** account while it stays terminal → books/contract inconsistency; SOLD is the most sensitive (UOWN refunds money for a debt it no longer owns). Also PAID_OUT (N-1) | ✅ live | 🔴 |
| C-4 | Recovered payment **allocated across multiple receivables** | does the reversal de-allocate correctly from each? (observed: single REGULAR_PAYMENT allocation per Sticky payment so far) | 🟡 | 🟡 |
| C-5 | **TaxCloud sync** of the reversed payment | `dailyTaxCloudRefundsSync` **inactive** → not synced (see N-3) | ⚠️ | 🔴 |
| C-6 | Multiple STICKY payments on one account | ✅ confirmed (6157: 2 STICKY payments both REVERSED independently + a 3rd SUBMIT_FAILED session) | ✅ | 🟢 |
| C-7 | **Reversal de-allocates (deletes allocation rows)** | ✅ confirmed: reversed payments 2190284/2190467 have **0 `uown_sv_allocation` rows** (the `taxable_amount` allocation is deleted); still-PAID 2190283 keeps its allocation. Compounds N-3 (tax-refund sync reads allocations that no longer exist) | ✅ | 🟡 |
| C-8 | **Refund of a recovered FEE** (NSF / PROCESSING) | the sweep gate does NOT exclude fee-type ccts (#485 BUG-16); in practice only REGULAR_PAYMENT recovered. A recovered NSF/PROCESSING fee refund would carry a different tax tic (NSF=10017, PROCESSING=10016) — **untested, needs setup** (recover a denied fee cct first) | 🔴 | 🟡 |

## D. Async / webhook scenarios

| # | Scenario | Expected | Status | Sev |
|---|----------|----------|--------|-----|
| D-1 | **Webhook never arrives** → stuck `REFUND_SUBMITTED`, **payment stays PAID** while Sticky already refunded the money | the 17204 case (06-17). **No guardian sweep observed** (same gap class as #485 recovery guardian). Money left Sticky but UOWN books it as paid → **mismatch** | 🟡 | 🔴 |
| D-2 | Webhook arrives but **payment not found** | `completeRefund` logs "Sticky refund confirmed via webhook but no payment found" | 🔴 | 🟡 |
| D-3 | **Duplicate webhook** (same dedupe_key) | `uown_sticky_webhook_dedupe` UNIQUE → idempotent, no double reversal | 🟡 | 🟡 |
| D-4 | Webhook arrives after payment already reversed by another path | completeRefund skips (status != PAID branch) | 🔴 | 🟡 |

## E. Permission / role

| # | Scenario | Expected (`data-table-columns` + `reverse-payment-modal`) | Status | Sev |
|---|----------|-----------------------------------------------------------|--------|-----|
| E-1 | Agent **without `RefundPayments:modify`** | STICKY row's reverse icon **hidden** (`canActOnRow = hasRefundPaymentsModifyPermission` for sticky). Code-confirmed; **live attempt blocked** — `readonly`/`AutotestAgent` did not authenticate into sandbox Servicing (no portal access). Needs a portal-accessible non-refund role | code ✅ / live ⏸️ | 🟡 |
| E-2 | Agent with **only ReversePayment** (not Refund) | for STICKY the modal options list is **empty** (Reverse not offered for sticky) → can't act. Code-confirmed; live blocked (same as E-1) | code ✅ / live ⏸️ | 🟡 |
| E-3 | readonly role | no action | code ✅ | 🟢 |

## F. UI / rendering

| # | Scenario | Expected | Status | Sev |
|---|----------|----------|--------|-----|
| F-1 | STICKY modal offers **only "Fully Refund"** (no Reverse, no Partially, no fee checkbox) | ✅ confirmed live | 🟢 | 🟢 |
| F-2 | **No partial refund** for STICKY | by design — large recovered payments can only be fully refunded. Product gap? | 🟢 | 🟡 |
| F-3 | CC History Sticky cells **MobX `observer()` gap** | cells may stay "—" until reload (`CreditCardHistoryPage` workaround) | 🟢 | 🟢 |

## G. Downstream / customer

| # | Scenario | Expected | Status | Sev |
|---|----------|----------|--------|-----|
| G-1 | **Customer notification** on refund | likely none (485 BUG-15: zero Sticky email/SMS templates). Should the customer be told their recovered payment was refunded? | 🟡 | 🟡 |
| G-2 | Refund reflected in customer-facing portal / statements | unverified | 🟡 | 🟡 |

---

## H. Rating letter × Sticky (recovery + refund)

Live-checked against sandbox sweep SQL + account data + **fresh-account reproduction** (account 17267) 2026-06-21. Both sweep SQLs dumped from `uown_scheduled_task`.

- `StickyRecoverSweep` (submit gate): `… AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B')) …` — **no autopay clause** (turning autopay off does NOT exclude).
- `StickyRecoverCancelSweep` (guardian): `WHERE st.sticky_transaction_id IS NOT NULL AND a.account_status <> 'ACTIVE' AND st.recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')` — **no rating clause**; only fires when the account leaves ACTIVE.

| # | Scenario | Finding (fresh repro, account 17267) | Status | Sev |
|---|----------|--------------------------------------|--------|-----|
| H-1 | Submit gate excludes P/C/D/B | ✅ **CONFIRMED fresh**: same cct selected by the real sweep SQL with `rating=NULL`, **excluded** with `rating='P'` and `rating='C'`. A *new* recovery will not start on a P/bankruptcy account | ✅ | — |
| H-2 | F/M/S/E/U/G NOT excluded | ⚠️ **CONFIRMED fresh**: same cct still selected with `rating='F'`. Live data: accounts 17177 (F) + 17176 (M) have Sticky sessions. Fraud/sold/etc. get retry-charged. Inconsistent with `DelinquencyRerunCC` (excludes B,C,P,S,D,E,F,G,L,U) | ✅ | 🟡 |
| H-3 | **In-flight recovery NOT cancelled when account enters arrangement(P)/bankruptcy(C/D/B)** | ⚠️ **CONFIRMED fresh**: simulated in-flight session (RECOVERY_STARTED) on the account — `StickyRecoverCancelSweep` does **NOT** pick it with `rating='P'` or `'C'` while `account_status='ACTIVE'`; it is picked **only** after `account_status='CANCELLED'`. So a customer who sets up a payment plan / files bankruptcy *after* submit (account stays ACTIVE) is still charged by Sticky. No `StickyRecoveryGuardianSweep`. Matches account 17179 (rating→P + autopay off, Sticky captured $21.73×2 the same day). **In prod the gateway captures (sandbox denies) → real money + possible automatic-stay violation** | ✅ | 🔴 |
| H-4 | Recovery/refund mutate rating? | ✅ No — recovered/refunded accounts stay `rating=NULL`; the refund (re-opens delinquency, HP-3/C-1) does **not** set a rating letter. Whether a refund *should* re-rate is a product question | ✅ | 🟢 |

## N. Newly discovered (live, 2026-06-21) — product / business-rule impact beyond A–H

| # | Scenario | Finding (evidence) | Status | Sev |
|---|----------|--------------------|--------|-----|
| N-1 | **Captured money that can't be refunded** (cancel-after-capture orphan) | **CONFIRMED LIVE 2026-06-21.** Account **5084**: Sticky captured $218.18 (28/05) → contributed to **PAID_OUT** (09/06, log shows RemainingBalance −$1,345.78 overpaid) → `StickyRecoverCancelSweep` fired (account non-ACTIVE) and Sticky **rejected the cancel** ("Cannot cancel transaction", already captured) → session left **CANCELED**, payment stays **PAID**. Drove the refund in the UI: icon **is shown** on the PAID row → modal → SAVE → `POST /refundPayment` **200** but payment stays **PAID** (no reversal, no STICKY_REFUND outbound), only a backend log `"Sticky refund failed … error=Sticky recovery is not in RECOVERED status"`. So this $218.18 is **un-refundable via the UI**. **UX:** on failure the FE shows a **transient generic toast "Unable to refund payment."** and the modal **stays open** (success path closes it + "Successfully refunded payment.") — the agent gets a generic error but **not the specific reason** (e.g. "not in RECOVERED status") | ✅ live | 🔴 |
| N-2 | **Refund → re-delinquency → re-recovery** | Refund re-activates the receivable (C-1). Same cct is dedup-protected (`NOT EXISTS sticky session with txn id` — session is REFUNDED), but the re-opened receivable **re-enters the dunning/recovery cycle**; a future denied scheduled payment on it can be Sticky-recovered again (new session). Refund is not a permanent stop on that obligation | ✅ (logic) | 🟡 |
| N-3 | **Refund tax not synced to TaxCloud** | `dailyTaxCloudRefundsSync` is **`is_active=false`** while `dailyTaxCloudPaymentsSync` is active. Tax collected on the Sticky recovery is remitted, but the refund/reversal is **not reported back** → tax over-remittance / reconciliation gap. Reversed payment's denormalized tax split shows `0.00/0.00` (vs `2.58/32.21` on a non-refunded Sticky payment). The refunds-sync SQL keys on `reverse_date_timestamp IS NOT NULL` (data is ready; sweep is just off). **Verify prod** (env-provisioning category) | ⚠️ | 🔴 |
| N-4 | EPO / balance recompute after refund | ✅ OK — `uown_sv_sched_summary` (`epo_amount_with_tax`, `epo_amount_without_tax`, `balance_amount_without_tax`) **updated at refund time** (6215 sched_summary `row_updated_timestamp` = exact refund timestamp 20:17:48). Stored figures are recomputed, not left stale | ✅ | 🟢 |
| N-5 | Refund confirmation webhook | `uown_sticky_inbound_log` event_type = **`refund.successful`** (status ACCEPTED) → drives `completeRefund` (SvPayment reversal + REFUNDED). Decrypts **only in sandbox** → reconfirms the qa2/D-1 "stuck at REFUND_SUBMITTED" limitation | ✅ | 🟡 |

## Top risks to raise with Gustavo/dev (AC-silent)

1. 🔴 **H-3 — in-flight recovery not cancelled on rating change (CONFIRMED fresh).** `StickyRecoverCancelSweep` has no rating clause (cancels only on `account_status<>ACTIVE`). A customer who enters a payment arrangement (P) or bankruptcy (C/D/B) *after* submit, while ACTIVE, is still charged. In prod (gateway captures) → payment in violation of the arrangement / automatic stay. Fix: add rating to the cancel sweep or build `StickyRecoveryGuardianSweep` (#485).
2. 🔴 **N-1 — captured money un-refundable (cancel-after-capture orphan).** Sticky capture that the cancel sweep later fails to cancel (already captured) leaves the session `CANCELED` + payment `PAID` → the refund feature (needs `RECOVERED`) can't return it. Account 5084 ($218.18). The refund feature should also handle CANCELED-with-captured-payment.
3. 🔴 **N-3 — refund tax not synced to TaxCloud.** `dailyTaxCloudRefundsSync` inactive while payments-sync is active → tax remitted on recovery but not credited back on refund. Verify prod + reconcile.
4. 🔴 **D-1 — webhook-stuck inconsistency, no guardian.** If the `refund.successful` webhook is lost, Sticky refunded the money but UOWN keeps payment `PAID` + session `REFUND_SUBMITTED` forever (account 17204 shape, qa2 can't decrypt webhooks). Ask: reconciliation/retry for stuck `REFUND_SUBMITTED`?
5. 🔴 **C-2/C-3 — no account-state guard on refund (CONFIRMED LIVE).** Refund proceeds on SETTLED_IN_FULL (6158 → reverts to ACTIVE, un-settles), CHARGED_OFF (6228 → stays charged-off, money reversed), CANCELLED (6214 → stays cancelled, money reversed), PAID_OUT (5084/N-1). Re-opens settlements / returns money on written-off / terminated accounts. Add an account-state guard or define intended per-state behavior.
6. 🟡 **A-7/A-3 — failed-refund dead-end.** After `REFUND_FAILED`, retry is blocked ("resolve before retrying") with no UI path.
7. 🟡 **N-2 — refund → re-delinquency → re-recovery** of the same obligation (new session); 🟡 **F-2/G-1 — no partial refund, no customer notification**.

## Execution status (live in sandbox 2026-06-21)

- ✅ **Confirmed live** (17): HP-1/2/3, A-1 (idempotency), A-4 (CANCELED gate), B-1 (icon hidden), B-3 (comment required), C-2 (SETTLED reverts), C-3 (CHARGED_OFF/CANCELLED/SOLD stay), C-6, C-7 (de-allocation), H-1/2/3/4 (rating gate + guardian, fresh repro), N-1 (orphan), N-4 (EPO recompute), N-5 (webhook event).
- ⚠️ **Confirmed-as-gap** (3): N-2 (re-recovery logic), N-3 + C-5 (tax-refund sync inactive).
- 🟢 **Code-confirmed, live not run**: B-2, B-4, D-3, E-1/E-2/E-3 (role login blocked), F-2/F-3.
- 🔴 **Needs dev/Sticky/setup**: A-2 (concurrency), A-3/A-7 (forced Sticky failure), A-5/A-6, C-8 (fee-refund), D-1/D-2/D-4 (webhook edge), G-1/G-2 (customer).

## Recommended automated coverage (priority)

- P0: HP-1/HP-2 + C-1 + A-1 + B-1/B-3 + C-2/C-3 — **all proven live, automate first**.
- P1: A-4 gate, C-7 de-allocation, E-1/E-2 permissions (once a non-refund role is available), D-3 dedupe.
- P1 (needs setup/dev): A-7/D-1 (forced failure + webhook-stuck), C-8 (recovered-fee refund), H-3 guardian.

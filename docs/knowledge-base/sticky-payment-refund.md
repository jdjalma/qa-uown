---
title: Sticky Payment Refund
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-21
sources:
  - env: sandbox (happy-path executed live)
  - account: 6168 / payment 2190284 / cc 69253 / sticky 31 — REVERSED+REFUNDED live 2026-06-21
  - env: qa2 (modal surface on account 9549; schema present, uown_sticky empty)
  - gitlab: uown/backend/svc!1465 RefundPaymentService.java + StickyRefundPaymentService.java + StickyRefundCompletionService.java
  - gitlab: uown/frontend/servicing!696 reverse-payment-modal/index.tsx + utils/data-table-columns.tsx
  - gitlab: uown/backend/sticky.io!8 RefundService + StickyRestClient.postRefund + StickyRecoveryStatus(REFUND_SUBMITTED/REFUND_FAILED/REFUNDED)
  - db: sandbox uown_sticky (RECOVERED/REFUNDED rows) · uown_sticky_outbound_log.source=STICKY_REFUND · uown_sv_payment STICKY
covers: [sticky-refund, reverse-payment, payment-history, sticky-recovery, cc-payments, payments]
promoted_to: [05-pagamentos]
---

# Sticky Payment Refund

> Charter: Explore the Servicing Reverse/Refund flow with Playwright MCP + the merged code to discover how a Sticky-recovered payment is refunded, and which business rules it touches.
> Origin: GitLab task in uown/backend/svc — milestone RU06.26.1.53.0 (release 2026-06-23, dev2/qa2). · Overall confidence: **high** (full happy-path executed live in sandbox 2026-06-21 — see Confirmed Run).

## Confirmed Run — happy path executed live (sandbox, 2026-06-21)

Refunded a real RECOVERED Sticky payment via the Servicing UI and verified every AC `[confirmed]`:

- Target: account **6168** (Josh Turner, MSA Powersports) · payment pk **2190284** ($38.45) · cc **69253** · sticky pk **31** (was `RECOVERED`/`SUBMITTED`).
- UI: Payment History → STICKY/PAID row → Reverse Payment → modal `Type=STICKY`, Reverse Reason **pre-set to "Fully Refund"**, **no** "Refund Convenience Fee" checkbox → comment → SAVE.
- Network: `POST /uown/svc/refundPayment` → **200** (NOT a literal `/refundStickyPayment` route — server-side routing, BR-02 proven).
- `uown_sticky_outbound_log` pk=33 `source=STICKY_REFUND`, request = `{stickyTransactionId, amount:"3845", authorizationId:"f6d82128-…", refundReason:"<agent comment>", refundDescription:"Uown servicing refund"}`; response `stickyStatus:"SUCCESS", result:"succeeded"`.
- `uown_sticky` pk=31 → `recovery_status=REFUNDED`, `status=REFUNDED`.
- `uown_sv_payment` pk=2190284 → `status=REVERSED`, `reverse_date` set, `reason="Sticky refund 409f3f…"`, comment "Refunded Sticky recovery amount 38.45".
- `uown_sv_activity_log`: (1) "Sticky refund submitted … stickyStatus=REFUND_SUBMITTED" (sync), then ~4s later (2) "Sticky refund confirmed via webhook … amount=38.45" (the **webhook-driven** `completeRefund`).
- UI after reload: STICKY row renders **REVERSED** with red strikethrough (`text-decoration:line-through; color:rgb(229,0,0)`).

Two-phase status: the synchronous refund only reaches **REFUND_SUBMITTED** (Sticky API 2xx); the transition to **REFUNDED** + the SvPayment reversal happen when the Sticky **confirmation webhook** arrives — which only decrypts in **sandbox**. `StickyRecoveryStatus` = {RECOVERY_STARTED, RECOVERED, FAILED, CANCELED, **REFUND_SUBMITTED, REFUND_FAILED, REFUNDED**}; the recovered state that gates a refund is **RECOVERED**.

## Purpose

Lets a Servicing agent **refund a payment that was captured by Sticky.io** (the dunning/recovery vendor, svc#485). A recovered payment's money sits on **Sticky's gateway**, not UOWN's native gateway (Channel Payments), so the normal refund path (`RefundPaymentService` → ACH/CC) cannot return it. This feature adds a Sticky-specific refund branch that calls **Sticky's Refund API** (`POST processing-hub/v1/api/payment/refund`). Actor: Servicing agent with `RefundPayments:modify` permission.

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| Refund a STICKY payment | ✅ (Fully Refund only) | Reverse-Payment modal on a `STICKY` + `PAID` row; comment required |
| Partial refund of STICKY | ❌ | Modal hides "Partially Refund" for `isSticky` (only "Fully Refund" offered) |
| Plain reverse of STICKY | ❌ | "Reverse" option not offered for STICKY rows |
| Refund convenience fee (STICKY) | ❌ | `refundFee` forced `false` for STICKY (checkbox hidden) |
| Re-refund / double refund | ❌ blocked | status must be `PAID`; idempotency + duplicate-payment check (svc!1493) |

## Flow and States (step by step in the UI)

Servicing → open account → **Payment History** (`/payment-history/{accountPk}`) → row whose **Funding Account = STICKY** and **Status = PAID** → click **Reverse Payment** icon (`fa-arrow-rotate-left`) → modal **"Reverse / Reallocate Payment"** → Reverse Reason pre-set to **Fully Refund** → type required **Comment** → **SAVE** → success toast → row shows reversed styling → CC History Sticky summary reflects REFUNDED.

**Modal logic (confirmed in UI on the non-Sticky/ACH path + in FE code):**

| Reverse Reason | Extra field shown | refundFee | amount sent |
|---|---|---|---|
| Reverse | — | n/a | reverse (not refund) |
| Fully Refund | "Refund Convenience Fee" checkbox (checked) | `isFullyRefund ? refundFee : false` | full (`initialPaymentAmount`) |
| Partially Refund | "Payment Amount" becomes editable textbox | forced `false` | edited `paymentAmount` |
| **Fully Refund + isSticky** | **none** (fee checkbox hidden) | **forced `false`** | **full only** |

State transitions:

| From → To | Trigger | Allowed? |
|---|---|---|
| Sticky session SUCCESSFUL → REFUNDED | agent Fully Refund | ✅ (`uown_sticky.recovery_status` & `.status` → `REFUNDED`) |
| SvPayment PAID → REVERSED | refund completes | ✅ (`uown_sv_payment.status='REVERSED'`, `reverse_date` set) |
| Non-PAID Sticky payment → refund | agent tries | ❌ "Only PAID Sticky payments can be refunded" |
| Non-Sticky payment → sticky refund | n/a | ❌ "Payment is not a Sticky recovery payment" |

## Business Rules

- **BR-01 — Routing by payment origin.** A payment with `paymentType = STICKY` is refunded via Sticky's API, never the native gateway. *(evidence: svc!1465 `RefundPaymentService.refundPayment` → `if (paymentType==STICKY) return stickyRefundPaymentService.refundStickyPayment(paymentPk, comment)`)* `[confirmed]`
- **BR-02 — Routing is SERVER-SIDE, reusing the existing endpoint.** The FE modal calls the **existing `refundPayment` helper** (`{paymentPk, refundFee, comment, amount}`); no new HTTP route was added in any of the 6 MRs. The dispatch to Sticky happens inside `RefundPaymentService`. *(evidence: frontend!696 calls `refundPayment(...)`; no `*Controller` file in svc!1465/!1471/!1493)* `[confirmed]` → **⚠️ POSSIBLE DIVERGENCE vs AC** (see Gaps).
- **BR-03 — Full refund only for Sticky.** `isSticky` → reverseReason defaults to "Fully Refund", options = `['Fully Refund']` only, `refundFee=false`, `amount=initialPaymentAmount`. *(evidence: frontend!696 `reverse-payment-modal/index.tsx`)* `[confirmed]`
- **BR-04 — Refund preconditions (validated in order).** (1) paymentType=STICKY, (2) status=PAID, (3) `ccPk>0` (CC txn link present), (4) comment non-blank — else respective failure message. *(evidence: svc!1465 `StickyRefundPaymentService.refundStickyPayment`)* `[confirmed]`
- **BR-05 — Sticky outbound payload.** `refundService.refundByCcTransactionPk(ccPk, settings, refundReason, "Uown servicing refund")` → Sticky `payment/refund` with `stickyTransactionId`, `amount` (captured cents), `authorizationId` (gateway txn id), `refundReason`=agent comment, `refundDescription`=`"Uown servicing refund"`. *(evidence: svc!1465 + Sticky API doc + Gustavo AC)* `[confirmed]`
- **BR-06 — Completion = REFUNDED + SvPayment reversed + activity log.** On `stickyStatus==REFUNDED && payment PAID` → `StickyRefundCompletionService.completeRefund(...)` sets `uown_sticky.{status,recovery_status}=REFUNDED`, reverses the `SvPayment`, writes an account activity log. On Sticky error → warn log + "Sticky refund failed…" activity log + failure returned. *(evidence: svc!1465; sticky.io!8 added `StickyRecoveryStatus.REFUNDED`)* `[confirmed]`
- **BR-07 — Idempotency / no double payment.** svc!1471 adds a payment-status check; svc!1493 adds duplicate-payment checks + logging; svc-common!128 adds `SvPaymentRepo` lookups by account+status. *(evidence: MR titles + diffs)* `[inferred]` (logic present; not exercised)
- **BR-08 — Activity log mandatory (CLAUDE.md #13).** Both success and failure write to the account activity log (Servicing domain → `uown_sv_activity_log`). `[confirmed via code]`

## Logic and Exceptions (DB contract)

`uown_sticky` (qa2/dev2, 15 cols) now carries **both** `status` and `recovery_status` (both → `REFUNDED`), plus `cc_transaction_pk`, `sticky_transaction_id`, `number_of_attempts`, `dunning_profile_id`, `last_retry_attempt_time`.
`uown_sticky_outbound_log` (13 cols) has a **`source`** column → refund rows expected with `source = STICKY_REFUND` (recovery rows are the recover/draft source).
`uown_sv_payment` (25 cols) — refund reversal lands as `status='REVERSED'` + `reverse_date`/`reverse_date_timestamp`/`reason`/`comments` (qa2 distribution today: PAID 51 379, REVERSED 751; **no "REFUNDED" status** on sv_payment — Sticky "REFUNDED" lives on `uown_sticky`, the SvPayment is "REVERSED").

## Connections with What Was Already Known

- **Confirms** the predecessor recovery model (svc#485 / `src/helpers/sticky.helpers.ts`): refund is the terminal step after a `recovery.successful` capture.
- **Confirms** business-rules `05-pagamentos.md §53-54` modal logic (Fully/Partially Refund, refundFee only on total) — observed live in qa2.
- **Adds** a new terminal Sticky state **REFUNDED** (485 only knew RECOVERY_STARTED/SUCCESSFUL/UNSUCCESSFUL).
- **Contradicts** the AC line "POST /uown/svc/refundStickyPayment called (not /refundPayment)" → implementation reuses `refundPayment` and delegates server-side. **Empirically confirmed 2026-06-21**: the live refund fired `POST /uown/svc/refundPayment → 200` (no `/refundStickyPayment` route). `refundStickyPayment` is the internal service method name only.

## How to run this discovery / test next time (the PROCESS)

> **Sticky refund/recovery only work in sandbox** ([[sticky-refund-tests-sandbox-only]]). qa2/dev2 have the schema but `uown_sticky` is empty + webhooks don't decrypt. Run the happy path in **sandbox**.

1. **Sandbox DB tunnel** — `127.0.0.1:**5445**` (kubectl port-forward; the `.env` `UOWN_DB_URL_SBX` says 5446 but the live tunnel is **5445** — stale .env). Don't edit `.env` (security rule); override at runtime: `export DB_CONNECTION_STRING="postgresql://${UOWN_DB_USER_SBX}:${UOWN_DB_PASS_SBX}@127.0.0.1:5445/svc"` (precedence over resolve, env.ts:96). Ask the user to bring up the tunnel.
2. **Env/URLs** — Servicing sandbox `https://svc-website-sandbox.uownleasing.com` (portal is internet-reachable even with the DB tunnel down). Login = role `manager` (`DEFAULT_MANAGER_*`), email/username + password, **no OTP**. Viewport `1440×900` (rule #15).
3. **Find a refund candidate (read-only, no manufacturing needed)** — sandbox has real RECOVERED sessions. `export DB_CONNECTION_STRING=…5445…; npx tsx src/scripts/_probe_refund.ts sandbox` lists candidates; `_probe_candidate.ts sandbox <ccPk,…>` verifies a candidate is refundable (needs: `uown_sticky.recovery_status=RECOVERED` + a `uown_sticky_retry_attempt` with `retry_status=APPROVED`, `amount` cents, `gateway_transaction_id`; + `uown_sv_payment` STICKY/PAID whose `cc_pk`=the sticky's `cc_transaction_pk`). Capture baseline with `_probe_verify.ts sandbox <acct> <cc> <pay> <stickyPk>`. Reusing an existing RECOVERED record is a **justified test-data exception** (a RECOVERED session is not creatable via automation — #485 never produced one organically).
4. **Drive the refund** — `…/payment-history/{accountPk}` → STICKY/PAID row → `fa-arrow-rotate-left` icon → modal (STICKY ⇒ only "Fully Refund", no fee checkbox) → required comment → SAVE. Verify with `_probe_verify.ts` (outbound_log `STICKY_REFUND`, sticky `REFUNDED`, payment `REVERSED`, two activity-log lines). The webhook completion lands ~secs later.
5. **MCP click gotcha** — sandbox Servicing throws persistent Toastify toasts + animated progressbars that make MCP `browser_click` fail the "stable" actionability check (5s timeout). Workaround that worked: remove toasts via `browser_evaluate` (`.Toastify__toast*`), and for the row icon / SAVE submit, dispatch the click via `browser_evaluate` (`el.dispatchEvent(new MouseEvent('click',{bubbles:true}))`). Login: submit with Enter (`browser_type … submit:true`) instead of clicking LOG IN.

## Gaps / To Investigate

- 🟢 **Account 17204 — earlier-build artifact, NOT a current bug** `[OBSERVATION]`. sticky pk=34 `REFUNDED` but payment pk=2190591 still `PAID`; its activity log has only "Sticky refund **submitted**" — no "confirmed via webhook" line. That refund ran **2026-06-17** (`refundReason="test"`), **before MR !1493** (idempotency, merged 06-19). The fresh run on the current build (account 6168) reversed the SvPayment correctly + logged the webhook confirmation. Per bug-classification #10, the isolated observation in pre-existing data is not a defect of the shipped code. (3 of the sandbox REFUNDED rows — sticky 23/26/34 — are all 06-17 test refunds with the same shape.)
- 🟡 **Success toast not captured** — the modal closed on success (200) but the "Successfully refunded payment" toast wasn't snapshotted (flashes briefly). Re-confirm visually next run.
- 🟡 **CC History REFUNDED render** — `…/customer-information/{accountPk}` → CC Transactions tab; confirm the 4 Sticky columns show REFUNDED (mind the MobX `observer()` gap → reload workaround in `CreditCardHistoryPage`).
- 🟡 **Reconciliation** — refunding a recovered payment that satisfied a delinquent receivable: does the receivable re-open / re-delinquent? `SvPayment`→REVERSED confirmed; receivable effect not described in the AC.
- 🟡 **TaxCloud sync** — is the reversed Sticky payment picked up by `DailyTaxCloudRefundsSync` (`09-integracoes-externas §24`)?
- 🟢 **Customer notification** — likely none (485 BUG-15: zero Sticky email/SMS templates); confirm whether refund notifies the customer.
- 🟢 **qa2/dev2** — schema present but `uown_sticky` empty + webhooks don't decrypt → not usable for Sticky refund testing.

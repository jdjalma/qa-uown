---
title: Servicing — PayWallet (pw) Salary-Allocation Flow
domain: knowledge-base
status: hypothesis
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: source-audit (no live env)
  - code: servicing FE @ R1.50.2 (2026-04-07, stale)
  - code: svc backend @ R1.53.0
covers:
  - paywallet
  - pw-allocation
  - salary-deduction
  - employer-search
  - affordability
  - allocation-lifecycle
promoted_to: []
---

> ⚠️ **Source-grounded draft — NOT yet live-verified.** Produced by the multi-agent code+backend audit `servicing-doc-gap-audit` (2026-06-25). The local servicing **frontend** checkout is branch **R1.50.2 (2026-04-07)** — stale vs the sandbox deploy (see memory `local-servicing-fe-stale-r1502`); the **backend** (svc) is R1.53.0. Claims are tagged `[confirmed-source]` (read in code), `[inferred]`, or `[needs-live]` (UI/visual claim to verify in sandbox). `status: hypothesis` until the Live-Verify Checklist at the bottom is run. This is an execution/investigation record, NOT a source of test patterns (rule #16).

# PayWallet ('pw') Salary-Allocation Flow — Servicing

## Purpose

PayWallet is an undocumented **payroll / salary-deduction payment subsystem** for Servicing accounts. It lets an agent (or a customer-facing widget) tie an account's recurring lease payment to a **salary allocation** taken at the customer's **employer**, instead of CC/ACH auto-pay. When an allocation is active, the account's auto-pay type set carries a `PAY_WALLET` marker and the platform recognizes a first-class `PW` payment type in ledgers. `[confirmed-source]` (store actions + enums + servicing-information.tsx)

The entire flow is surfaced through an **external component** shipped in `@uownleasing/common-ui` and wired to six BFF proxy endpoints under `/uown/pw/*`. `[confirmed-source]` (`domain/stores/customer.tsx:13-24` imports `EmployerSearch`, `PayInfo` and the widget from `@uownleasing/common-ui`)

**CRITICAL architectural fact:** there is **no `/uown/pw/*` controller in the `svc` repository** — `grep -rn "/uown/pw/" svc` returns **0 hits**. `[confirmed-source]` (grep over `/home/jose/projects/uown/svc`). The BFF (`servicing/server.js`) therefore proxies these paths to a **separate PayWallet integration service**, not to `svc`. `[inferred]` (absence of svc controller + presence of BFF routes implies an external upstream). Consequence: a given environment (e.g. sandbox) may not have the upstream PayWallet service wired, so the endpoints can 404/502 even though the BFF route exists. `[inferred]`

## Portal / URL

- **Portal:** Servicing (internal, agent-facing). Viewport `1440×900`. `[inferred]` (Servicing is a Bootstrap internal portal per project conventions)
- **Page:** Customer Information page — the PayWallet allocation UI is rendered by the external `@uownleasing/common-ui` component, and `PAY_WALLET` also appears within the **Servicing Information** panel's Auto-Pay types. `[confirmed-source]` (component import + `components/customer-info-panels/servicing-information.tsx:130-135,239-241`)
- **Exact on-screen location, labels, buttons, and the customer-vs-agent rendering are NOT visible in this repo** (the widget lives in the external package, whose dist was not present in `node_modules` at inspection). `[needs-live]`

## Available Operations

All six are defined as MobX `@action`s on the customer store (`domain/stores/customer.tsx`). The store methods are **not consumed anywhere else in the Servicing source** — they are passed as props into the external `@uownleasing/common-ui` PayWallet widget. `[confirmed-source]` (grep for consumers returned only the store definition)

| # | Store action (line) | HTTP | BFF path | Path/body params | Re-fetches on 200? | BFF auth key |
|---|---------------------|------|----------|------------------|--------------------|--------------|
| 1 | `getEmployer` (1537) | GET | `/uown/pw/employerSearch/{searchQuery}/{page}/{itemNumbers}` | `searchQuery=''`, `page=0`, `itemNumbers=30` defaults | **No** | (in GET allow-list) `[confirmed-source]` server.js:183 |
| 2 | `requestAffordability` (1616) | POST | `/uown/pw/requestAffordability/{accountPk}/{employerId}` | path: accountPk, employerId | **Yes** | `pw_request_affordability` `[confirmed-source]` server.js:151 |
| 3 | `prepareAllocation` (1553) | GET | `/uown/pw/prepareAllocation/{accountPk}` | path: accountPk | **Yes** | (in GET allow-list) `[confirmed-source]` server.js:184 |
| 4 | `confirmAllocation` (1640) | POST | `/uown/pw/confirmAllocation/{accountPk}` | path: accountPk; **body: `PayInfo`** | **Yes** | `pw_confirm_allocation` `[confirmed-source]` server.js:150 |
| 5 | `cancelAllocation` (1574) | GET | `/uown/pw/cancelAllocation/{accountPk}` | path: accountPk | **Yes** | (in GET allow-list) `[confirmed-source]` server.js:185 |
| 6 | `getCurrentPwStatus` (1595) | GET | `/uown/pw/getPwCurrentStatus/{accountPk}` | path: accountPk | **Yes** | (in GET allow-list) `[confirmed-source]` server.js:186 |

Notes:
- `employerSearch` uses **path-segment pagination** (`/{query}/{page}/{itemNumbers}`), not query string; default page size is **30**. `[confirmed-source]` (1538,1542)
- `getEmployer` is the **only** operation that does **not** re-fetch Financial + Servicing info — it is a pure lookup. `[confirmed-source]` (no `getFinancialInfo` call in its body, 1537-1550)
- The two **mutating writes** (`requestAffordability`, `confirmAllocation`) are guarded by **dedicated BFF auth keys** (`pw_request_affordability`, `pw_confirm_allocation`). `[confirmed-source]` server.js:150-151
- **Inconsistency worth flagging:** `cancelAllocation` is an HTTP **GET** that performs a state-changing cancel. `[confirmed-source]` (1576-1579, server.js GET list). This is a non-RESTful mutation-via-GET; cancel is not protected by a dedicated auth key the way confirm is. `[inferred]` (security observation)

## Flow & States

### Re-fetch side effect (confirmed)
Every operation except `getEmployer`, **only when the upstream returns HTTP 200**, chains two reads:
```
await this.getFinancialInfo(accountPk);
await this.getServicingInformation(accountPk);
```
`[confirmed-source]` (1561-1564, 1582-1585, 1603-1606, 1627-1630, 1652-1655). `getServicingInformation` and `getFinancialInfo` are defined at `customer.tsx:1191` and `1235`. `[confirmed-source]`. This keeps the Servicing Information panel's `autoPayTypes` (and thus the `PAY_WALLET` marker) in sync after any allocation mutation. `[inferred]`

### Lifecycle (UI sequence)
The intended agent/customer sequence is:
```
employerSearch (browse/paginate employers)
        │  pick employerId
        ▼
requestAffordability(accountPk, employerId)   ── upstream checks affordability
        ▼
prepareAllocation(accountPk)                  ── stages the allocation
        ▼
   ┌────────────┴─────────────┐
confirmAllocation(accountPk,   cancelAllocation(accountPk)
   PayInfo)                    (abandon)
        │
        ▼
getPwCurrentStatus(accountPk)  ── poll (callable at any point)
```
The **ordering above is `[inferred]`** — the source code defines the six actions independently and does not enforce a call order (the orchestration lives in the external widget). Only the individual call shapes and the post-200 re-fetch are `[confirmed-source]`.

### Backend payment states
`PWPaymentStatus` enum (the lifecycle of an individual PayWallet payment): `PENDING`, `PAID`, `REFUNDED`, `ERROR`, `CANCELLED`. `[confirmed-source]` (`common/.../enumeration/PWPaymentStatus.java:3-5`)

`PaymentType.PW` is a first-class payment type alongside `ACH, CC, DEBIT, VISA, ..., STICKY`, so PayWallet payments appear natively in ledgers/transactions. `[confirmed-source]` (`PaymentType.java:4`)

### Prohibited / unverified transitions
- Whether `confirmAllocation` is rejected if `prepareAllocation` was never called, and whether a second `requestAffordability` is allowed while one is `PENDING`, are **not determinable from this repo** (logic lives upstream). `[needs-live]`
- The exact `PWPaymentStatus` transition graph (e.g. can `ERROR` → `PAID` retry, can `PAID` → `REFUNDED` only) is **not** encoded in the enum. `[needs-live]`

## Business Rules

- **BR-01 — `PAY_WALLET` is a preserved, read-only auto-pay marker.** The Servicing Information edit form **filters `PAY_WALLET` out** of the editable Auto-Pay dropdown and **re-prepends it on save** when present:
  ```
  const autoPayOptionsType = servicingInfo?.autoPayTypes?.filter(t => t !== 'PAY_WALLET');
  const hasPayWalletConnected = servicingInfo?.autoPayTypes?.includes('PAY_WALLET');
  ...
  request.autoPayTypes = hasPayWalletConnected ? ['PAY_WALLET', ...autoPayType] : autoPayType;
  ```
  `[confirmed-source]` (`servicing-information.tsx:130-135, 239-241`). Effect: an agent **cannot add or remove `PAY_WALLET` from the auto-pay dropdown** — it is managed exclusively by the PayWallet allocation flow, and editing other auto-pay types never drops it.
- **BR-02 — `PAY_WALLET` is not a member of the editable `AutoPayTypes` enum.** The dropdown options come from `Object.values(AutoPayTypes)` (`AutoPayTypes.CC/ACH/NONE`), while `PAY_WALLET` is handled as a **string literal**, confirming it is treated as out-of-band state, not a user-selectable option. `[confirmed-source]` (`servicing-information.tsx:110-127` vs the literal filter at 130-135)
- **BR-03 — Mutating PW writes require dedicated authorization.** `confirmAllocation` and `requestAffordability` are gated by BFF keys `pw_confirm_allocation` / `pw_request_affordability`; the read/search/cancel paths are in the plain GET allow-list. `[confirmed-source]` (server.js:150-151,183-186)
- **BR-04 — Any successful PW mutation refreshes Financial + Servicing info.** A 200 always re-reads both panels so the UI reflects the new allocation/marker. `[confirmed-source]` (see Flow & States)
- **BR-05 — Employer search is paginated server-side with a 30-item default page.** `[confirmed-source]` (1538)
- **BR-06 — PW payments are ledger-visible.** Because `PaymentType.PW` exists, a salary-deducted payment posts as a distinct `PW` transaction (not disguised as ACH/CC). `[confirmed-source]` (enum) / exact ledger rendering `[needs-live]`

## Logic & Exceptions

- **Status fallback:** every store action returns `status: response?.status || 500` — a missing upstream response is surfaced as a generic **500** to the UI. `[confirmed-source]` (e.g. 1566-1570). This means a sandbox without the PayWallet upstream wired will likely show 500/empty rather than a typed "not configured" error. `[inferred]`
- **Loader handling:** the five non-search actions pass `isHandleLoader: true`; `getEmployer` does not, so type-ahead employer search will not toggle the global loader. `[confirmed-source]` (1558, 1579, 1600, 1624, 1649 vs 1540)
- **No order enforcement client-side:** the store exposes all six actions flatly; nothing prevents calling `confirmAllocation` before `prepareAllocation` from the store layer — guardrails (if any) are upstream. `[inferred]`
- **`PayInfo` body shape:** `confirmAllocation`'s payload type `PayInfo` is imported from `@uownleasing/common-ui`; its fields are **not visible in this repo**. `[needs-live]` (resolve by inspecting the installed package's `.d.ts` or a live confirm request)
- **`EmployerSearch` props:** `{ searchQuery, page, itemNumbers }`, defaults `('', 0, 30)`. `[confirmed-source]` (1538)

## Connections

- [[application-lifecycle]] — account/servicing lifecycle this allocation attaches to.
- [[payment-flows]] — `PaymentType.PW` joins ACH/CC/STICKY as a ledger payment type.
- [[activity-log-validation]] — a PW allocation/confirm/cancel is a business action; per Rule #13 it MUST emit an activity log/note. Whether `/uown/pw/*` writes to `uown_los_activity_log` / `uown_los_lead_notes` is **unverified** and a key test target. `[needs-live]`
- [[buddy-protection-plan-qa2]] (memory) — another common-ui-driven Servicing add-on whose notes land in `uown_los_activity_log`; useful precedent for where PW notes may live. `[inferred]`
- Related Servicing auto-pay docs (CC/ACH auto-pay, `createOrUpdateServicingInfo`) — PW is the third auto-pay channel but managed out-of-band. `[confirmed-source]`

## Gaps

1. **No upstream controller in repo.** The `/uown/pw/*` implementation (request/response schemas, validation, affordability logic, status machine) is **not in `svc`** and not in this repo at all. Document is necessarily BFF-and-enum-deep only. `[confirmed-source]` (grep=0)
2. **External widget UI unseen.** All visual claims (where the panel sits, button labels, employer picker UX, customer-portal vs agent rendering, error states) are `[needs-live]`.
3. **`PayInfo` / `Employer` payload shapes unknown** — live capture needed.
4. **Activity-log coverage unknown** — must confirm PW actions write a note (Rule #13).
5. **Sandbox wiring unknown** — `liveVerifiable=false`; endpoints may not be reachable in sandbox. Confirm which environment has the PayWallet upstream before authoring automated tests.
6. **Status-transition rules** for `PWPaymentStatus` not encoded anywhere in code — derive from upstream service or live observation.
7. **cancel-via-GET** non-RESTful mutation and its lack of a dedicated auth key — flag for security review. `[inferred]`

## Live-Verify Checklist (run before trusting `[needs-live]` claims)

1. Confirm the upstream is wired in the target env: from an authenticated Servicing session, open DevTools Network and call GET {servicingBaseUrl}/uown/pw/getPwCurrentStatus/{accountPk} for a known accountPk; a 200 (vs 404/502/500) confirms the PayWallet integration service is reachable. Record the response body shape.
2. Verify the PayWallet UI surface [needs-live]: log into Servicing (1440x900), open an account's Customer Information page, and visually locate the PayWallet allocation component rendered by @uownleasing/common-ui. Screenshot its position, heading, and primary buttons (employer search, request/confirm/cancel).
3. Verify employer search [needs-live]: in the PayWallet widget, type an employer name; in Network confirm the request is GET /uown/pw/employerSearch/{query}/0/30 and that paging advances the 2nd path segment. Capture one employer result object incl. the employerId used downstream.
4. Walk the lifecycle [needs-live]: pick an employer -> confirm POST /uown/pw/requestAffordability/{accountPk}/{employerId}; then observe GET /uown/pw/prepareAllocation/{accountPk}; submit to fire POST /uown/pw/confirmAllocation/{accountPk} and capture the exact PayInfo request body. Confirm that after each 200 the Financial Info and Servicing Information panels re-render (BR-04).
5. Verify BR-01/BR-02 marker behavior [needs-live]: with an allocation active, open the Servicing Information panel, confirm PAY_WALLET is NOT an option in the Auto-Pay dropdown, change an unrelated Auto-Pay value, save, reload the page, and confirm PAY_WALLET is still present in autoPayTypes (preserved, not droppable).
6. Verify cancel path [needs-live]: trigger cancel in the widget, confirm GET /uown/pw/cancelAllocation/{accountPk} returns 200, and that the PAY_WALLET marker is removed from the account's autoPayTypes on the subsequent re-fetch.
7. Verify activity-log coverage (Rule #13): after a confirm and after a cancel, query uown_los_activity_log and uown_los_lead_notes for the account/lead and confirm a PayWallet note row was written for each action; record table + status text.
8. Verify ledger visibility (BR-06): after a salary deduction posts, open the account Transactions/Payment History and confirm a payment with PaymentType PW appears distinctly; cross-check the PWPaymentStatus value (PENDING/PAID/REFUNDED/ERROR/CANCELLED) in the upstream/status response.


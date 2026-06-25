---
title: Servicing — Permission/Role Matrix, BFF Route-Gate & PII Masking
domain: knowledge-base
status: hypothesis
volatility: volatile
last_verified: 2026-06-25
sources:
  - env: source-audit (no live env)
  - code: servicing FE @ R1.50.2 (2026-04-07, stale)
  - code: svc backend @ R1.53.0
covers:
  - servicing-permissions
  - role-matrix
  - bff-route-gate
  - pii-masking
  - restricted-view
  - restricted-modify
  - permission-anomalies
promoted_to: []
---

> ⚠️ **Source-grounded draft — NOT yet live-verified.** Produced by the multi-agent code+backend audit `servicing-doc-gap-audit` (2026-06-25). The local servicing **frontend** checkout is branch **R1.50.2 (2026-04-07)** — stale vs the sandbox deploy (see memory `local-servicing-fe-stale-r1502`); the **backend** (svc) is R1.53.0. Claims are tagged `[confirmed-source]` (read in code), `[inferred]`, or `[needs-live]` (UI/visual claim to verify in sandbox). `status: hypothesis` until the Live-Verify Checklist at the bottom is run. This is an execution/investigation record, NOT a source of test patterns (rule #16).

# Servicing Permission/Role Matrix & Two-Layer Route-Gate Enforcement

> Knowledge-base discovery draft. Every claim is tagged `[confirmed-source]` (read directly in code), `[inferred]` (deduced from signatures/usage, not from the implementation body), or `[needs-live]` (UI/visual behavior that must be confirmed in the sandbox before publishing). Source files cited inline as `path:line`.

## Purpose

The Servicing portal authorizes agent actions in **two independent layers**: `[confirmed-source]`
1. **Frontend (FE) visibility gate** — React components hide/disable controls (sidebar links, navbar dropdowns, account-header actions, edit/modal buttons) using `hasViewPermission` / `hasModifyPermission` / `hasRestrictedModifyPermission` helpers imported from `@uownleasing/common-utilities`. Seen at `pages/customer-information/[account].tsx:134-218`, `layouts/auth/index.tsx:204-378`, `pages/search/index.tsx:271-274`, `pages/payment-transaction/[account].tsx:64-72`. `[confirmed-source]`
2. **Node BFF route gate (`server.js`)** — every proxied `/uown/*` request is independently re-authorized server-side by `hasRoutePermission` → `hasCategoryPermission` before being forwarded to the Java `svc` API. `server.js:383-490`, `server.js:311-372`, middleware at `server.js:974-1059`. `[confirmed-source]`

Both layers read the same per-user `permissions` object, which **AMS supplies at `/login`** and the BFF stores in the server session (`req.session.permissions`) and re-signs into a short-lived JWT (15 min) on every response. `server.js:546-583`, `server.js:90 (MAX_JWT_AGE = 60*15)`. `[confirmed-source]`

Why this matters for QA: the FE gate is **cosmetic** (it only decides what the agent sees); the BFF gate is the **real** access-control boundary. The two layers use overlapping-but-not-identical permission keys, and several keys are renamed/remapped between layers — so a role can render a control it cannot actually execute, or vice-versa. These mismatches are the primary QA surface of this feature.

## Portal / URL

- **Portal:** Servicing (internal, agent-facing). Single desktop viewport `1440×900` for inspection (Bootstrap `d-lg-block` ≥992px). `[inferred]`
- **Sandbox base:** `https://svc-website-sandbox.uownleasing.com` (pattern `https://svc-website-{env}.uownleasing.com`). `docs/claude/environments.md:22` `[confirmed-source]`
- **Permission source:** AMS (`AMS_URL`), proxied through `server.js` `/login`. `server.js:89, 493-594` `[confirmed-source]`

## The permissions object (shape)

Two top-level branches on `permissions`: `[confirmed-source]` (`models/permissions.ts:5-27`)

```
permissions = {
  restricted: {
    view:   { full: { dob, ssn }, partial: { account_number } },
    modify: { account_status, dob, ssn }
  },
  access: { <category>: { modify: { <key>: bool }, ... }, ... }
}
```

- `restricted.modify.*` is read by `hasRestrictedModifyPermission(permissions, target)` = `permissions.restricted.modify[target]`. `server.js:94-96` `[confirmed-source]`
- `access[category]` truthiness = **view** permission for that category; `access[category].modify[key]` = **modify** permission for a specific action. `[inferred from hasCategoryPermission, server.js:318-366]`

### Typed model declares only a SUBSET of runtime keys (drift hazard)

`models/access-permissions.ts` is the TypeScript model, but it declares **far fewer keys than the runtime uses**. `[confirmed-source]`
- `customer_information.modify` declares only 6 keys (`create_or_update_primary_customer_info`, `_employment`, `_primary_customer_contact_info`, `_servicing_information`, `_bank_account`, `_credit_card`) at `access-permissions.ts:113-122`, but the page reads ~20 keys at runtime: `verify_customer_information`, `confirm_customer_review`, `send_trustpilot_invitation`, `send_podium_link`, `send_customer_portal_link`, `view_send_invite`, `remove_bank_accounts`, `remove_credit_cards`, `edit_credit_cards`, `view_all_credit_cards`, `view_all_bank_accounts`, `add_credit_cards`, `add_bank_accounts`, `toggle_log_priority` (`pages/customer-information/[account].tsx:144-218`, `layouts/auth/index.tsx:477-505`). `[confirmed-source]`
- `payment.modify` model declares `create_or_update_ach_payment`, `make_credit_card_payment` (`access-permissions.ts:69-74`), but runtime also reads `view_charge_fee` (`[account].tsx:501-505`). `[confirmed-source]`
- `payment_transaction.modify` model declares `refund_payments` (`access-permissions.ts:78-83`), but the BFF whitelist modify key is `refund_payment` (singular) and `email_csv`/`download_csv` are read on the page (`pages/payment-transaction/[account].tsx:64-72`). Name mismatch `refund_payments` (model) vs `refund_payment` (BFF). `[confirmed-source]`

**QA consequence:** the typed model is NOT a reliable contract for what AMS sends or what the runtime checks. Treat AMS's `/login` payload as the source of truth, not `access-permissions.ts`. `[inferred]`

## Available Operations (BFF route-gate map)

15 categories are OR'd in `hasRoutePermission` (`server.js:473-489`): if **any** category authorizes the request, it passes. `[confirmed-source]`

| Category (`access` key) | Modify keys (POST/PUT) → svc route | GET routes gated |
|---|---|---|
| `customer_information` | 22 keys incl. `create_or_update_primary_customer_info`, `_employment`, `_third_party_contact`, `_primary_customer_contact_info`, `update_dnc`, `update_dnt`, `update_opt_out_ai`, `_servicing_information`, `_bank_account`, `_credit_card`, `_account_info`, `change_account_status`, `cancel_account`, `_bankruptcy_info`, `_financial_info`, `change_payment_frequency`, `save_customer_verification`, `send_trustpilot_invitation`, `send_podium_link`, `send_customer_portal_link`, `remove_credit_cards`, `remove_bank_accounts`, `get_accounts_by_criteria`, `toggle_log_priority`, `pw_*` (`server.js:127-159`) | `getAccountInfo`, `getAccountSummary`, `simpleSearch`, `getPrimaryCustomerInfo`, `getEmployment`, `getLogs`, `getTransactions`, `getServicingInfo`, `getFinancialInfo`, `getCreditCards`, `getBankAccounts`, `getRatingLetters`, `getProtectionPlanForAccount`, +others (`server.js:160-191`) |
| `documents` | `edit_document`, `resend_stored_doc`, `upload_file_for_account`, `delete_file` (`server.js:199-204`) | `getFilesForAccount` (`server.js:205`) |
| `payment` | `create_or_update_ach_payment(s)`, `make_credit_card_payment(s)`, `make_check_payment`; PUT `make_credit_card_payment` → `payments/credit-cards/{ccTransactionPk}` (`server.js:208-218`) | `getTransactionSummary`, `getScheduledPayments`, `getCCTransactions`, `getPayments`, `getACHPayments`, `getReceivableType` (`server.js:219-226`) |
| `scheduled_payments` | `create_or_update_receivable` (Add Fee), `move_due_date`, `reallocate_from_receivable`, `reinstate_default_schedule` (`server.js:236-241`) | `getDefaultScheduleParameters` (`server.js:242`) |
| `payment_transaction` | `reverse_payment`, `refund_payment`, `refund_payment_single`, `rewind_replay_account`, `email_csv` (`server.js:245-251`) | none (`server.js:252`) |
| `payment_arrangement` | none (`post:{}`) (`server.js:228-234`) | `accounts/{accountPk}/payment-arrangements`, `payment-arrangements/{paymentArrangementPk}/payments` (`server.js:231-232`) |
| `ach_history` | `disable_ach_payment` (`server.js:255`) | none |
| `payment_history` | `update_payment` → `updatePayment` (`server.js:273-274`) | none |
| `due_date_moves_history` | none | `accounts/` (`server.js:284`) |
| `frequency_changes_history` | none | `accounts/` (`server.js:288`) |
| `account_sale` | `get_documents_for_sold_accounts_with_file` (`server.js:292`) | none |
| `credit_card_history` | none | none (`server.js:260-263`) |
| `email_history` | none | none |
| `items_history` | none | none |
| `phone_history` | none | none |

### Whitelisted (no permission required)

`hasWhitelistedPermission` bypasses the gate entirely for: `[confirmed-source]` (`server.js:117-126`, `server.js:374-381`)
- **POST:** `/login`, `/logout`, `/authentication/requestResetCode`, `/authentication/verifyResetCode`, `/authentication/completeReset`
- **GET (startsWith):** `/renew`, `/health`

> Note: the gap brief said the whitelist is `/login,/logout,/renew,/health` — the **actual** POST whitelist also includes the three `/authentication/*` password-reset routes. `[confirmed-source]`

Additionally, per-category `whitelistedPost` (still requires `access[category]` truthy): `customer_information` whitelists `createOrUpdateLog`, `getBasicMerchantInfoByRefCode`, `getLocationNamesByMerchant` — these skip the `modify[key]` check but NOT the category-view check (`server.js:192-196, 319-335`; the `if (!categoryAccess)` branch at 321 short-circuits first). `[confirmed-source]`

## Flow & States

1. **Login** → BFF proxies to AMS; AMS returns `{ permissions, firstName, agentId, ... }`. BFF stores `permissions` in session, signs a 15-min JWT, returns `usertoken` header. If `permissions` is empty → **403**. `server.js:546-586` `[confirmed-source]`
2. **Every `/uown/*` request** passes through middleware (`server.js:974-1059`): `[confirmed-source]`
   - If path is not `/uown/` OR is whitelisted → `next()` (pass).
   - Else validate JWT (`usertoken`), require session, and call `hasRoutePermission`.
   - `isJwtValid && session && isRequestAllowed` → proceed (with restricted sub-checks below).
   - Else → **423** if `!isRequestAllowed` (permission denied), **401** otherwise (bad/expired JWT or no session). `server.js:1056` `[confirmed-source]`
3. **Restricted sub-gates** (run AFTER route gate passes): `[confirmed-source]`
   - `/uown/los/createOrUpdateAccountInfo` | `/uown/los/cancelAccount` | `/uown/los/changeAccountStatus`: if `body.accountStatus` present, require `restricted.modify.account_status` else **401**. `server.js:1006-1027`
   - `/uown/los/createOrUpdateLog`: if `body.logType === 'internal'`, require `restricted.modify.internal_notes` else **401**. `server.js:1028-1047`
4. **PII masking on responses** (orthogonal to route gate): `getPrimaryCustomerInfo`, `getFinancialInfo`, `getBankAccounts`, `getCreditCards`, `simpleSearch`, `getAccountsByDate` responses are masked via `ssnMask`/`dobMask`/`bankAccountNumberMask`/`ccNumberMask` using `restricted.view.*`. `server.js:661-797` `[confirmed-source]`. (Detailed masking belongs in the PII doc; cross-referenced below.)

### Prohibited / blocked transitions

- A request whose category is authorized for **view** but not the specific **modify** key → **423** from BFF even if the FE rendered the button. `[confirmed-source, server.js:336-372 + 1056]`
- Editing SSN/DOB without `restricted.modify.ssn`/`dob`: the special `createOrUpdatePrimaryCustomerInfo` server handler silently **drops** the new SSN/DOB and keeps the verified value (no error). `server.js:1157-1230` `[confirmed-source]`
- Cancelled→Active status change is FE-gated by a `status_cancelled_to_active` restricted key that the BFF does NOT enforce as a distinct route gate. `layouts/auth/index.tsx:293-296` `[confirmed-source]`; BFF only checks generic `account_status` (`server.js:1012-1015`) `[confirmed-source]`.

## Business Rules

- **BR-01** AMS is the single origin of permissions; the FE never computes them, it only reads `permissions.access` / `permissions.restricted`. `[confirmed-source, server.js:546-550]`
- **BR-02** The BFF re-authorizes every `/uown/*` call independently of the FE. Bypassing the UI (direct API call with a valid JWT) is still blocked by `hasRoutePermission`. `[confirmed-source, server.js:993-997]`
- **BR-03** Authorization is **OR-across-15-categories**: a request URL matched by any authorized category passes, even if the "intended" category is denied. This means a shared GET route (e.g. `/uown/svc/accounts/`) is allowed if ANY of `customer_information`, `due_date_moves_history`, `frequency_changes_history`, `payment_arrangement` grants it. `[confirmed-source, server.js:473-489 + 284,288]`
- **BR-04** GET is allowed when `access[category]` is truthy AND the URL `startsWith` a route in `category.get`. `[confirmed-source, server.js:323-330]`
- **BR-05** POST/PUT is allowed when the URL is in the category `whitelistedPost` (still needs category-view) OR `access[category].modify[remappedKey]` is true AND `normalizedUrl.startsWith(value)`. `[confirmed-source, server.js:331-368]`
- **BR-06** Empty-body `/uown/*` requests are forwarded with empty content; non-JSON content-type → **500** + session destroyed. `server.js:630-658` `[confirmed-source]`
- **BR-07** `restricted.modify.account_status` and `restricted.modify.internal_notes` are enforced on the `/uown/los/*` write paths, not the `/uown/svc/*` paths declared in `permissionsMapping`. `[confirmed-source, server.js:1006-1047]`

## Logic & Exceptions (QA-relevant anomalies)

These are the high-value defect/coverage hooks. All `[confirmed-source]` unless noted.

- **A1 — Naming mismatch `frequency_history` vs `frequency_changes_history`.** FE reads `access.frequency_history` (`layouts/auth/index.tsx:283-286`) and the typed model declares `frequency_history` (`access-permissions.ts:55-59`), but the BFF route-gate category is `frequency_changes_history` (`server.js:286-289`). The FE link routes to `/frequency-history/{accountPk}` (`layouts/auth/index.tsx:373-374`). If AMS sends only one of the two key spellings, the link visibility and the data-fetch authorization can disagree.
- **A2 — Naming mismatch `verify_customer_information` vs `save_customer_verification`.** FE checks `hasModifyPermission(..., 'customer_information', 'verify_customer_information')` (`pages/customer-information/[account].tsx:144-148`), but the BFF modify key for `/uown/svc/saveCustomerVerification` is `save_customer_verification` (`server.js:149`). FE button visibility and BFF submit authorization key on different names.
- **A3 — Key remaps inside `hasCategoryPermission`.** For POST/PUT the BFF rewrites the lookup key before checking `access[category].modify[key]` (`server.js:343-362`):
  - `update_dnc` / `update_dnt` / `update_opt_out_ai` → `create_or_update_primary_customer_contact_info`
  - `refund_payment_single` → `refund_payment`
  - `reinstate_default_schedule` → `move_due_date`
  So DNC/DNT/opt-out toggles are authorized by the **contact-info** modify permission, single-refund by the **bulk-refund** permission, and reinstate-default-schedule by the **move-due-date** permission. A role granted only `move_due_date` can also reinstate the default schedule.
- **A4 — `search.download_csv` references an undefined category (latent always-off).** `pages/search/index.tsx:271-274` calls `hasModifyPermission(permissions, 'search', 'download_csv')`, but there is **no `search` category** in `permissionsMapping` (`server.js:116-297`) nor in `AccessPermissions` (`access-permissions.ts`). `access.search` is therefore undefined → the CSV-download control is permanently hidden regardless of AMS config. (The CSV is built client-side, so the BFF never sees it; this is a pure FE dead gate.) `[confirmed-source]`; user-visible effect `[needs-live]`.
- **A5 — `payment_transaction.download_csv` is also FE-only.** `pages/payment-transaction/[account].tsx:67-72` reads key `download_csv` under `payment_transaction`, which is not a BFF modify key (BFF has `email_csv` but not `download_csv`, `server.js:245-251`). Unlike A4 the category exists, so AMS *could* set `access.payment_transaction.modify.download_csv`, but the typed model does not declare it. `[confirmed-source]`
- **A6 — CC edit-pending pencil has no FE gate, and the BFF gate is on a DIFFERENT category.** In the CC-history table the pencil/edit callback opens `EditPendingCCPaymentModal` with NO permission check (`components/history/credit-card.tsx:118-137`; the column factory `creditCardHistoryTableColumns(onClick)` receives only a click handler, `utils/data-table-columns.tsx:411`). The page is reached via `credit_card_history` view permission, but the edit submits `PUT /uown/svc/payments/credit-cards/{ccTxPk}` (`domain/stores/ach.tsx:205-218`), which the BFF authorizes under **`payment.make_credit_card_payment`** (after `normalizeDynamicRoutes`, `server.js:65-67, 215-218`). Result: a role with `credit_card_history` view but without `payment.make_credit_card_payment` sees and opens the pencil, fills the modal, submits, and gets a BFF **423**. Classic FE-not-gated / backend-gated split. FE no-gate `[confirmed-source]`; the 423 user experience `[needs-live]`.
- **A7 — `due_date_moves_history` route-gate called with missing args.** `hasDueDateMovesHistoryPermission = hasCategoryPermission(permissions, 'due_date_moves_history')` is invoked WITHOUT `method` and `targetUrl` (`server.js:456-459`), unlike all 14 sibling calls. With `method = undefined`, none of the GET/POST branches in `hasCategoryPermission` match, so this category **always returns false**. Its `accounts/` GET is only reachable because `customer_information`/`frequency_changes_history` also list `accounts/` (BR-03 OR-rescue). `[confirmed-source]`
- **A8 — Empty `payment_arrangement.post` means no PA write is BFF-gated by that category.** `payment_arrangement.post = {}` (`server.js:229`); FE gates the PA navbar link with `hasModifyPermission(permissions, 'payment', 'payment_arrangement')` (`layouts/auth/index.tsx:234-238`) — i.e. the FE uses category `payment` + key `payment_arrangement`, which is neither a BFF `payment` modify key nor a declared model key. `[confirmed-source]`
- **A9 — Restricted account-status / internal-notes gates key on `/uown/los/*` paths** while the `permissionsMapping` modify entries for the same actions point at `/uown/svc/*` (`server.js:143-146` vs `server.js:1006-1009`). The two namespaces are gated by different mechanisms. `[confirmed-source]`

## Connections

- [[origination-role-based-access-and-pii]] — the Origination-side equivalent; this doc is the missing Servicing counterpart. PII masking mechanics overlap.
- [[servicing-customer-information-page]] — the page that consumes the largest set of `customer_information.modify` keys.
- [[servicing-history-pages]] — ACH/CC/Email/Items/Payments/Phone/Due-Date/Frequency history pages, each gated by its own `*_history` category (several of which have empty modify maps).
- [[servicing-payment-transaction-page]] — `payment_transaction` modify keys (refund/reverse/rewind/email_csv) + the FE-only `download_csv` (A5).
- [[servicing-payment-arrangement-page]] — A8 (FE gates PA via `payment.payment_arrangement`).
- [[servicing-search-quick-search]] — A4 (dead `search.download_csv` gate) + PII masking of `simpleSearch` results.
- [[servicing-account-edit-modals]] — edit modals (incl. the ungated CC edit-pending pencil, A6).
- [[activity-log-validation]] — `createOrUpdateLog` whitelist + `internal_notes` restricted gate; every write that passes the gate must still produce an activity log.
- [[application-lifecycle]] — account-status transitions gated by `restricted.modify.account_status` / `status_cancelled_to_active`.

## Gaps (to verify before publishing)

1. **Exact AMS `/login` payload per role.** This doc infers `access`/`restricted` shape from consumers; the authoritative per-role boolean matrix (which keys AMS actually sends for each Servicing role) is NOT in this repo. Needs an AMS role dump or a live `/login` capture per role. `[needs-live]`
2. **FE helper bodies.** `hasViewPermission` / `hasModifyPermission` / `hasRestrictedModifyPermission` live in `@uownleasing/common-utilities` (not vendored in this checkout — `node_modules` absent). Their exact truthiness logic (e.g. whether `hasViewPermission` checks `access[category]` truthy vs `access[category].view`) is `[inferred]` from call sites and the BFF mirror, not read. Confirm against the published package.
3. **Visual confirmation of every FE gate** (A4, A5, A6, A8) — whether the control is hidden vs disabled vs renders-then-errors is `[needs-live]`.
4. **423 vs 401 surfacing** — whether the agent sees a toast, a silent failure, or a forced logout on a BFF denial is `[needs-live]`.
5. **`status_cancelled_to_active`** has a FE restricted key but no dedicated BFF route gate — confirm whether cancelled→active is actually blockable independent of generic `account_status`. `[needs-live]`

---

## Appendix — PII Masking by Role (Server-Side BFF Interceptor)

### Purpose

The Servicing portal masks Personally Identifiable Information (PII) — SSN, Date of Birth, bank-account numbers, and credit-card numbers — based on the logged-in agent's role permissions. The critical design fact: **masking is enforced entirely server-side in the BFF (Node/Express `server.js`) proxy response interceptor, not in the React frontend.** The browser never receives the full value when the role lacks permission, so a compromised or inspected client cannot reveal the unmasked data. This is compliance-relevant (PII minimization by role). `[confirmed-source]` — `servicing/server.js:661-797`

The permission flags live under a `restricted` object delivered by the auth backend at login and stored in the Express session; the interceptor reads them per-request and rewrites the proxied JSON body before it reaches the browser. `[confirmed-source]` — `servicing/server.js:545-550, 662`

### Portal / URL

- Portal: **Servicing** (internal, agent-facing). Viewport for live checks: single `1440×900` (Bootstrap `d-lg-block` ≥992px). `[inferred]` (per project portal-viewport rule)
- BFF process: `servicing/server.js` (Next.js custom server + `http-proxy-middleware` proxying `/uown/svc/*` to the SVC backend). `[confirmed-source]` — `servicing/server.js`
- Surfaces where masked-vs-full is observable: Primary Applicant SSN/DOB on the Customer Information page; bank/card numbers on the Financial Info section; SSN column in search results. `[needs-live]`

### Available Operations

| Endpoint (proxied path matched in interceptor) | Field(s) masked | Permission flag gating full value | Evidence |
|---|---|---|---|
| `GET /uown/svc/getPrimaryCustomerInfo/` | `primaryCustomerInformation.ssn`, `primaryCustomerInformation.dateOfBirth` | `restricted.view.full.ssn`, `restricted.view.full.dob` | `[confirmed-source]` server.js:682-718 |
| `GET /uown/svc/getFinancialInfo/` | `svBankAccounts[].bankAccountInfo.accountNumber`, `svCreditCards[].creditCardInfo.ccNumber` | `restricted.view.partial.account_number` | `[confirmed-source]` server.js:685-687, 720-759 |
| `GET /uown/svc/getBankAccounts/` | `[].bankAccountInfo.accountNumber` | `restricted.view.partial.account_number` | `[confirmed-source]` server.js:694-696, 772-785 |
| `GET /uown/svc/getCreditCards/` | `[].creditCardInfo.ccNumber` | `restricted.view.partial.account_number` | `[confirmed-source]` server.js:697-699, 787-797 |
| `GET/POST .../simpleSearch` | `searchResults[].ssn` | `restricted.view.full.ssn` | `[confirmed-source]` server.js:691-693, 761-770 |
| `.../getAccountsByDate` | `searchResults[].ssn` | `restricted.view.full.ssn` | `[confirmed-source]` server.js:688-690, 761-770 |
| `POST /uown/los/createOrUpdatePrimaryCustomerInfo` (save path) | plaintext SSN / DOB sent to backend only if permitted | `restricted.modify.ssn`, `restricted.modify.dob` | `[confirmed-source]` server.js:1177-1204 |

> Correction to GAP intake: the interceptor masks **`getAccountsByDate`** and **`simpleSearch`**, NOT `getAccountsByCriteria`. `getAccountsByCriteria` exists in `permissionsMapping` (server.js:157) but is **not** among the masked response paths — search-result SSN masking only fires for `getAccountsByDate` / `simpleSearch`. `[confirmed-source]` — server.js:688-693, 761. The GAP's "saveCustomerVerification" plaintext-SSN gating is in practice implemented in the `/uown/los/createOrUpdatePrimaryCustomerInfo` handler. `[confirmed-source]` — server.js:1157-1204

### Flow & States

1. **Login** — auth backend returns `responseBody.permissions`; the BFF stores it in `req.session.permissions` and signs a JWT carrying the same permissions. `[confirmed-source]` server.js:545-574
2. **Per request** — `onProxyRes` reads `permissions = req.session.permissions || {}`. `[confirmed-source]` server.js:662
3. **Buffer & parse** — full upstream response is buffered, then `JSON.parse`d. Non-JSON / empty / `'[]'` bodies pass through unmasked (nothing to mask). `[confirmed-source]` server.js:667-678
4. **Path match** — booleans (`pathHasSsnDob`, `isPathGetFinancialInfo`, `isPathGetAccounts`, `isPathSimpleSearch`, `isPathGetBankAccounts`, `isPathGetCreditCards`) decide which masker runs. `[confirmed-source]` server.js:682-699
5. **Mask** — `formatSSN` / `dobMask` / `bankAccountNumberMask` / `ccNumberMask` rewrite fields in place. `[confirmed-source]` server.js:705-797
6. **Fail-closed checks** — see Business Rules BR-05/BR-06. `[confirmed-source]` server.js:799-819
7. **Re-sign & send** — a fresh JWT is set on the `usertoken` header and the masked body is sent with the upstream status code. `[confirmed-source]` server.js:825-839

**Prohibited / impossible transitions:**
- The frontend cannot "unmask" — it only ever receives the masked string; no decrypt/reveal endpoint exists in the FE. A grep of the FE (`*.ts/*.tsx`) found **no** `restricted.view` consumer beyond the type model `models/permissions.ts`. `[confirmed-source]` (grep: only `models/permissions.ts` matches)
- A role without `restricted.modify.ssn` cannot push a new plaintext SSN to the backend: the save handler skips assigning `ssn` unless `hasSsnEditPermission` is true. `[confirmed-source]` server.js:1195-1198

### Business Rules

- **BR-01** When `restricted.view.full.ssn=false`, SSN is reduced to last-4 on `getPrimaryCustomerInfo`, `simpleSearch`, and `getAccountsByDate` results. `formatSSN` returns the masked value directly when `ssnMask(...).length === 4`; otherwise it formats the full `XXX-XX-XXXX`. `[confirmed-source]` server.js:98-114, 705-711, 761-770
- **BR-02** When `restricted.view.full.dob=false`, `primaryCustomerInformation.dateOfBirth` is replaced by `dobMask(permissions, dob)`. `[confirmed-source]` server.js:712-717
- **BR-03** When `restricted.view.partial.account_number=false`, bank-account numbers (`getFinancialInfo.svBankAccounts[]`, `getBankAccounts[]`) and credit-card numbers (`getFinancialInfo.svCreditCards[]`, `getCreditCards[]`) are masked via `bankAccountNumberMask` / `ccNumberMask`. `[confirmed-source]` server.js:720-797
- **BR-04** `restricted.modify.ssn` (and `restricted.modify.dob`) additionally gate whether a **plaintext** SSN/DOB is forwarded to the backend on save; without the flag the field is left as the previously-validated value and the new value is dropped. `[confirmed-source]` server.js:1177-1204
- **BR-05 (fail-closed, SSN/DOB)** On `getPrimaryCustomerInfo`, if the response is missing either `ssn` or `dob`, the BFF returns **401 `{unauthorized:true}`** instead of the body — a missing-PII response is treated as an error, not a pass-through. `[confirmed-source]` server.js:803-808
- **BR-06 (fail-closed, financial)** On `getFinancialInfo`, if the count of collected bank-account numbers does not match `svBankAccounts.length`, the BFF returns **401** — guards against partially-masked leakage. `[confirmed-source]` server.js:809-819
- **BR-07** Masking decision is taken from the **session** permissions, re-evaluated every request; a JWT is re-signed with those permissions each response. Permission changes therefore take effect on the next login / session, not retroactively on an existing JWT until `/renew`. `[inferred]` server.js:567-574, 825-839, 1126-1155
- **BR-08** The actual mask shape (how many digits shown, mask character) is produced by `@uownleasing/server-utilities` (`ssnMask`, `dobMask`, `bankAccountNumberMask`, `ccNumberMask`). For SSN the BFF relies on the contract "masked SSN has length 4" (last-4). Exact DOB/account/card mask format is defined in that shared package, **not** in `server.js`, and was not readable in this repo (package not installed locally). `[inferred]` server.js:22-28, 98-114

### Logic & Exceptions

- Masking is applied **in-place** by mutating the parsed `body` (e.g. `body.primaryCustomerInformation.ssn = formatSSN(...)`), then `JSON.stringify`-ing the mutated body. `[confirmed-source]` server.js:707-717, 837-839
- Path matching uses `String.includes(...)` on the request path with **trailing slashes** for the customer/financial/bank/card routes (`'/uown/svc/getPrimaryCustomerInfo/'`, etc.). A call to one of these without the trailing-slash form would not match the masker. `[confirmed-source]` server.js:682-699 `[inferred]` (routing-contract consequence)
- `simpleSearch` / `getAccountsByDate` mask only the `searchResults[].ssn` field; they do **not** mask DOB or account numbers in search payloads. `[confirmed-source]` server.js:761-770
- Empty / `'[]'` / non-JSON upstream bodies bypass all masking and are forwarded as-is. `[confirmed-source]` server.js:677-678
- `formatSSN` returns `''` for falsy input; if `ssnMask` returns something other than 4 chars, it reconstructs the full dashed SSN — i.e. "full SSN" path is the else-branch. `[confirmed-source]` server.js:98-114
- The save-path gating (`hasRestrictedModifyPermission`) defaults to `false` when the permission object is absent — fail-closed for writes. `[confirmed-source]` server.js:94-96

### Connections

- [[servicing-customer-information-page]] — the Primary Applicant SSN/DOB surface where BR-01/BR-02 are observed.
- [[servicing-search-quick-search]] — search results where BR-01 masks the SSN column (`simpleSearch`).
- [[origination-role-based-access-and-pii]] — sibling role-based PII behavior in the Origination portal; cross-check whether the same `restricted.*` contract applies.
- [[servicing-payment-history-page]] / [[servicing-payment-transaction-page]] — financial surfaces adjacent to bank/card number display.

### Gaps

- **Mask format unverified** — exact rendered form of masked DOB, account, and card numbers comes from `@uownleasing/server-utilities`, not readable here. `[needs-live]`
- **Role → flag mapping unknown** — which Servicing role(s) actually have `restricted.view.full.ssn/dob` and `restricted.view.partial.account_number` set to true/false is defined in the auth backend (AMS), not in `server.js`. Need a per-role permissions sample (two roles: one privileged, one restricted) to complete a true permissions matrix. `[needs-live]`
- **UI display claims unconfirmed** — the visual rendering (last-4 vs `•••`, where on screen) is `[needs-live]`; the masking logic is `[confirmed-source]` but its on-screen effect was not observed.
- **`getAccountsByCriteria`** is in `permissionsMapping` but not masked by the interceptor — confirm in sandbox whether that endpoint returns SSN at all (potential unmasked-leak candidate). `[needs-live]`
- **`restricted.modify.account_status`** exists in the model (`permissions.ts:19`) but is unrelated to PII masking; out of scope here, noted for the broader permissions matrix.

## Live-Verify Checklist (run before trusting `[needs-live]` claims)

1. A6 (CC pencil no FE gate): Obtain/login two Servicing roles in sandbox (https://svc-website-sandbox.uownleasing.com). Role-1 has credit_card_history view + payment.make_credit_card_payment; Role-2 has credit_card_history view but NOT payment.make_credit_card_payment. As each role, open an account, navbar History > CC Transactions (/credit-card-history/{accountPk}). Confirm the edit pencil renders for BOTH roles (FE not gated). With DevTools Network open, as Role-2 click the pencil on a PENDING CC tx, change amount/comment, Save. Confirm the PUT /uown/svc/payments/credit-cards/{ccTxPk} returns HTTP 423 and the edit does not persist; as Role-1 confirm it returns 200 and persists on reload.
2. A4 (search.download_csv dead gate): Login as a role you believe has broad permissions. Navigate to /search, run a search that returns results. Confirm the Download CSV control is ABSENT/hidden (because access.search is undefined). Capture the /login response JSON (Network tab) and confirm there is no 'search' key under permissions.access.
3. A5 (payment_transaction download_csv): Login, open an account, navbar Servicing > Payment Transaction (/payment-transaction/{accountPk}). Observe whether a Download CSV button is shown. Cross-check the /login payload for permissions.access.payment_transaction.modify.download_csv; if the key is absent the button should be hidden.
4. A1/A2 naming mismatch (frequency_history vs frequency_changes_history; verify_customer_information vs save_customer_verification): Capture a role's /login JSON. Note which spelling AMS sends. Then in the UI confirm: (a) the History > Frequency Changes link visibility tracks access.frequency_history while the data fetch on /frequency-history/{accountPk} (GET /uown/svc/accounts/...) is gated by frequency_changes_history; (b) the Verify Customer Information button (customer-information page) appears per verify_customer_information while the save POST /uown/svc/saveCustomerVerification is gated by save_customer_verification. Drive a role granted only one of each pair and observe the button-shows-but-save-fails (or vice versa) behavior.
5. A3 key remaps: As a role granted ONLY scheduled_payments.move_due_date (and not reinstate_default_schedule), attempt Reinstate Default Schedule in the UI and confirm POST /uown/svc/reinstateDefaultScheduleOnAccount returns 200 (authorized via the move_due_date remap). Separately, as a role granted only customer_information.create_or_update_primary_customer_contact_info, toggle DNC/DNT/Opt-out AI and confirm the updateDnc/updateDnt/updateOptOutAi POSTs return 200.
6. Restricted gates (account_status / internal_notes): As a role WITHOUT restricted.modify.account_status, attempt a status change that sets body.accountStatus and confirm 401. As a role WITHOUT restricted.modify.internal_notes, add an Internal note and confirm POST /uown/los/createOrUpdateLog returns 401, while a non-internal note succeeds.
7. 423 vs 401 surfacing: For any denied action above, observe and record the exact UI feedback (toast text, silent failure, or forced logout) and the HTTP status (423 = permission denied by route gate, 401 = JWT/session). Confirm whitelisted /renew keeps the session alive (15-min JWT refresh).
8. Log in to the Servicing sandbox portal (1440x900) with a RESTRICTED role (one expected to have restricted.view.full.ssn=false). Open the browser DevTools Network tab.
9. Navigate to an account's Customer Information page and locate the GET /uown/svc/getPrimaryCustomerInfo/ request. Confirm the response body shows primaryCustomerInformation.ssn as last-4 only and dateOfBirth as a masked value (BR-01/BR-02). Record the exact masked format.
10. On the same page, open the Financial Info section and inspect GET /uown/svc/getFinancialInfo/ (and/or getBankAccounts/getCreditCards). Confirm svBankAccounts[].bankAccountInfo.accountNumber and svCreditCards[].creditCardInfo.ccNumber are masked (BR-03). Record the mask format.
11. Run a search (simpleSearch) that returns results and inspect the response: confirm searchResults[].ssn is masked to last-4. Then confirm DOB and account numbers are NOT present/masked in search payload.
12. Log out and log back in with a PRIVILEGED role (restricted.view.full.ssn/dob=true, restricted.view.partial.account_number=true). Repeat steps 2-4 and confirm the same endpoints now return the FULL SSN (XXX-XX-XXXX), full DOB, and full bank/card numbers - proving masking is role-driven and server-side.
13. With the privileged role, edit the Primary Applicant SSN and Save; inspect POST /uown/los/createOrUpdatePrimaryCustomerInfo to confirm the new plaintext SSN is forwarded (restricted.modify.ssn=true, BR-04). With a role lacking modify.ssn, repeat and confirm the SSN field is NOT updated/forwarded.
14. Negative/fail-closed check: if feasible, observe an account whose getPrimaryCustomerInfo lacks ssn or dob and confirm the BFF returns HTTP 401 {unauthorized:true} rather than a partial body (BR-05).
15. Capture the rendered Customer Information page screenshot for both roles at 1440x900 to confirm the on-screen masked-vs-full display matches the network-layer masking.


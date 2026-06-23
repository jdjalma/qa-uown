# TMS API spec ↔ `src/api/` client coverage audit

Cross-reference of the official UOWN TMS spec ([`openapi.json`](openapi.json), 13 endpoints) against the
test framework's API clients. Snapshot: 2026-06-23.

> Source-tag: paths verified against `src/api/clients/*.ts` (primary). Spec = `docs/api-reference/openapi.json`.

## Verdict

- **9 / 13** endpoints have a client whose path matches the official spec.
- **3 / 13** have **no** TMS-v1 client (autopay CC, PayNearMe, contact preferences).
- **1 / 13** diverges on **path/controller** (`due-dates/move`).
- Several **legacy duplicates** (`/uown/tms/getX`, `/uown/svc/getX`) exist in code but are **not in the spec** — intentional (WI-525 dual-controller coverage), not bugs.

## Endpoint-by-endpoint

| # | Spec endpoint | Spec path | Client method | Status |
|---|---------------|-----------|---------------|--------|
| 1 | searchaccount | `POST /uown/tms/v1/accounts/search` | `CustomersClient.searchAccountsV1` | ✅ match (code marks it `@Deprecated`; spec still documents it) |
| 2 | getaccountsummary | `GET …/{id}/summary` | `TmsAuditClient.getAccountSummary` | ✅ match |
| 3 | getpayoffamount | `GET …/{id}/payoff` | `TmsAuditClient.getPayoffAmount` | ✅ match |
| 4 | getbankaccounts | `GET …/payment-methods/bank-accounts` | `TmsAuditClient.getBankAccounts` | ✅ match |
| 5 | getcreditcards | `GET …/payment-methods/credit-cards` | `TmsAuditClient.getCreditCards` | ✅ match |
| 6 | adjustnextduedate | `POST …/{accountPk}/next-due-date/adjustments` | `AccountClient.adjustNextDueDate` | ✅ match (uses `postTms` key — correct) |
| 7 | processachpayment | `POST …/payments/ach` | `TmsPaymentClient` (ACH) | ✅ match |
| 8 | processcreditcardpayment | `POST …/payments/credit-card` | `TmsPaymentClient` (CC) | ✅ match |
| 9 | processpaymentarrangement | `POST …/paymentArrangements` | `TmsPaymentClient` (arrangement) | ✅ match |
| 10 | **moveduedates** | `POST …/{id}/due-dates/move?moveNumberOfDays=&fromDueDate=` | `AccountClient.moveDueDatesByDays` → `POST /uown/svc/moveDueDatesByDays/{pk}?moveNumberOfDays=` | ⚠️ **path divergence** |
| 11 | **getautopaycreditcard** | `GET …/payment-methods/credit-cards/autopay` | — | ❌ **no client** |
| 12 | **sendpaynearmepaymentlink** | `POST …/{id}/paynearme/send?deliveryChannel=&amountOverride=` | — | ❌ **no client** |
| 13 | **updatecontactpreferences** | `POST …/{id}/contactPreferences` | — (closest: `SvcContactClient.createOrUpdateContactInfo` → `/uown/svc/createOrUpdatePrimaryCustomerContactInfo`, different endpoint & purpose) | ❌ **no client** |

## Details on the gaps

### ⚠️ #10 `due-dates/move` — path divergence (not payload)
- **Spec:** `POST /uown/tms/v1/accounts/{accountId}/due-dates/move` with query `moveNumberOfDays` (required) + `fromDueDate` (optional). No body.
- **Code:** `AccountClient.moveDueDatesByDays` → `POST /uown/svc/moveDueDatesByDays/{accountPk}?moveNumberOfDays=N`.
- The `moveNumberOfDays` query param **matches**; the difference is the **base controller** (`/uown/svc/…` legacy vs `/uown/tms/v1/…` documented) and the missing optional `fromDueDate`. `TmsAuditClient` even documents `.../due-dates/move` in its header comment but never implements it.
- **Action:** add a TMS-v1 `moveDueDates` method to `TmsAuditClient` (uses `tmsHeaders`) if FIVE9/TMS callers must hit the documented route; keep the SVC one for the Servicing-portal path.

### ❌ #11 `getautopaycreditcard` — missing
- `GET /uown/tms/v1/accounts/{accountId}/payment-methods/credit-cards/autopay`. Returns the autopay-configured card.
- Natural home: `TmsAuditClient` next to `getCreditCards`. No body.

### ❌ #12 `sendpaynearmepaymentlink` — missing
- `POST /uown/tms/v1/accounts/{accountId}/paynearme/send` with query `deliveryChannel` (required array — SMS/email) + `amountOverride` (optional). No body.

### ❌ #13 `updatecontactpreferences` — missing
- `POST /uown/tms/v1/accounts/{accountId}/contactPreferences`. Body `ContactPreferencesRequest`: `phoneNumber*` (int), `doNotCall`, `doNotText`, `optOutAi`, `optOutReason`, `atLeastOnePreference` (bool/string).
- This is **TCPA/AI opt-out**, distinct from `SvcContactClient.createOrUpdateContactInfo` (general phone/email CRUD). Needs a new `bodies/` type + client method (FIVE9/TMS key).

## Not in the spec but present in code (intentional — keep)
- Legacy S1 `TmsController`: `getPayoffAmountLegacy`, `getAccountSummaryLegacy`, `getBankAccountsLegacy`, `addLogNoteLegacy` (`/uown/tms/getX`, `/uown/tms/addLogNote`).
- SVC equivalents: `SvcPayoffClient.getPayoffAmount/getAccountSummary` (`/uown/svc/…`), `PaymentArrangementClient` (`/uown/svc/makeCreditCardPayments`, `/uown/svc/createOrUpdateACHPayments`).
- `TmsAuditClient.addActivityLog` (`POST …/activity-logs`) — write endpoint, not documented in the partner-facing spec.
- `CustomersClient.searchCustomersV2` (`/uown/tms/v2/customers/search`) — v2 not in the v1 spec.

These exist for dual-controller inbound-api-log coverage (WI-525) and Servicing-portal flows; the official spec only documents the partner-facing TMS surface. Do **not** delete on account of the spec.

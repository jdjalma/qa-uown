# MEMORY — subagent-impl-api

## extractContractUrl + skipInvoice combo (discovered 2026-05-07, Task #507)

When calling `setupApplicationViaApi(..., { extractContractUrl: true })`, the helper extracts `redirectUrl` from `sendApplication`'s `paymentDetailsList`. If `sendInvoice` then runs (the default — only skipped via `skipInvoice: true`), the backend regenerates the payment plan and the previously-extracted URL becomes stale. Subsequent calls using that URL's `shortCode` (e.g., `getMissingFields`) fail with HTTP 500 `"Invalid link. Please contact merchant"`.

**Rule:** always pass `skipInvoice: true` together with `extractContractUrl: true` when the test needs the `redirectUrl`/`shortCode` after the helper returns AND `sendApplication` already includes order data.

See pitfall #21 in `.claude/context/shared/application-lifecycle-protocol.md`.

## `/authorizeCreditCard` dual response shape (discovered 2026-05-07, Task #507)

When the CC body is invalid (incomplete `ccNumber`, expired `ccExp`, malformed `cvc`), the backend rejects the request pre-controller and returns the Spring global exception handler envelope `{"message": "...", "status": 500}` (2 keys) instead of the slim DTO `{status, error, errorCode, preAuthStatus}` (4 keys). Any test asserting the `/authorizeCreditCard` response shape MUST dispatch by `Object.keys(body).length`: 4-key → strict slim DTO assertions; 2-key → envelope assertions. Deep deny-list traversal (no gateway/token/CC leak) applies to both forms as the minimum common check. See pitfall #22 in `.claude/context/shared/application-lifecycle-protocol.md`.

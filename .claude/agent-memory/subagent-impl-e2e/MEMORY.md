# MEMORY — subagent-impl-e2e

## `page.on('response')` for wire-payload contract capture in signing flows (discovered 2026-05-07, Task #507)

When an E2E test must verify the actual network payload of an API call made by the browser during a signing flow (not just UI behavior), use `page.on('response', async (response) => { if (response.url().includes('/authorizeCreditCard')) { body = await response.json(); } })` registered BEFORE the action that triggers the request. This provides DevTools-equivalent wire-payload capture without requiring a separate API call. Reusable pattern for security/contract regression tests where the goal is asserting response shape or deny-list compliance on real browser-initiated requests (vs UI-only assertions). See CT-E2E-01 in Task #507 spec for reference implementation.

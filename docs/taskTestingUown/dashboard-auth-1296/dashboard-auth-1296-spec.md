# SPEC - dashboard-auth-1296

## Source

GitLab #1296 - UOWN | ORIGINATION | Overview /uown dashboard POST APIs reachable without session validation (whitelist)

Priority: High | Workflow: staging-in-process | Milestone: due 2026-05-27 | Assignee: Marcus Braga | Source: security

MRs: `uown/backend/ams!57`, `uown/frontend/origination!1452`

## Scope

### IN

- **Auth enforcement on 8 dashboard POST endpoints** - core of the fix; each endpoint must reject unauthenticated/tampered requests. These are the endpoints that were previously whitelisted in `START_WITH_POST_APIS` / permission whitelist:
  1. `/uown/getApplicationCountDetails`
  2. `/uown/getApprovalRateDetails`
  3. `/uown/getAvgApprovalDetails`
  4. `/uown/getOpenApprovalAmt`
  5. `/uown/getFundedAmtDetails`
  6. `/uown/getSignedLeaseApprovals`
  7. `/uown/getExpiringAppDetails`
  8. `/uown/getConversionRate`

- **Happy path (authenticated access)** - logged-in agent with valid session must still see dashboard data render correctly. Verifies the fix does not break normal access.

- **No-token rejection** - requests without `userToken` header must return 401 or 403. Validates whitelist removal.

- **Tampered/invalid token rejection** - requests with garbage `userToken` must return 401 or 403. Validates token validation logic, not just presence check.

- **Expired session (missing cookie)** - deleting `merchant.sid` session cookie should block access (redirect to login or 401/403). Validates session coupling.

### OUT

- **SQL injection testing** - post-mortem showed no successful exploitation; SQL injection is a separate security concern beyond the scope of this auth validation task. The fix is about closing the whitelist, not hardening query params.

- **Whitelist review of non-dashboard endpoints** - AC #2 mentions reviewing all `START_WITH_POST_APIS` entries, but this is a dev audit task, not a QA validation. Our scope is the 8 dashboard endpoints listed in the ticket.

- **Role-based access control (RBAC) matrix** - the fix is about session/token validation (authn), not authorization (authz). Whether "readonly" role can see dashboard vs "manager" is not in scope.

- **Customer portal / Website / Servicing** - this is purely Origination portal dashboard. No cross-portal impact.

- **Performance / load testing** - not in scope for this security fix.

- **Dual-brand** - dashboard endpoints are portal-level, not merchant-level. Brand parity (UOWN vs KS) is irrelevant here.

### AMBIGUOUS / Questions for PO

- **Q-01:** What is the exact response shape for rejected requests? AC says "401 or 403" but does not specify which. Is it `401 Unauthorized` (no valid credentials) or `403 Forbidden` (credentials present but insufficient)? **[ASSUMPTION A-01]:** We accept either 401 or 403 as valid rejection, since both indicate auth enforcement is active. We do NOT accept 200, 302, or 500.

- **Q-02:** For the expired session scenario (TC-04), is the expected behavior a redirect to login page (HTTP 302) or a direct 401/403 API response? AC says "redirect to login or 401/403." **[ASSUMPTION A-02]:** Both are acceptable. If calling the API directly without cookie, 401/403. If loading the page via browser, redirect to login. We test both paths.

- **Q-03:** Does the fix differentiate between `userToken` header and `merchant.sid` cookie? Are both required, or is one sufficient? **[ASSUMPTION A-03]:** Based on AC structure (TC-02 tests missing header, TC-04 tests missing cookie), they are likely independent auth mechanisms. We test each independently.

- **Q-04:** TC-04 (expired session) was not reported as passed in Lucas's manual QA report. Is there a known issue with this scenario? **[ASSUMPTION A-04]:** We include it in the automated test plan. If it fails, it becomes a finding, not a SPEC gap.

- **Q-05:** The 8 endpoints are POST. Do they require a request body, or can they be called with an empty body? **[ASSUMPTION A-05]:** We call with empty body `{}` for auth rejection tests (body content is irrelevant when auth fails first). For the happy path, we let the dashboard page make the calls naturally via UI.

## AC Coverage

| AC | Description | Scenario(s) |
|----|-------------|-------------|
| AC-01 | Logged-in user with valid token: 200 OK + data displayed | CT-01 (happy path UI) |
| AC-02 | Request without `userToken` header: 401/403 | CT-02 (no-token API, all 8 endpoints) |
| AC-03 | Request with tampered/invalid token: 401/403 | CT-03 (invalid-token API, all 8 endpoints) |
| AC-04 | Missing/invalid session cookie: redirect to login or 401/403 | CT-04 (expired-session API + UI redirect) |

## Risk Analysis

| Area | Risk | Why | Coverage |
|------|------|-----|----------|
| Whitelist removal breaks happy path | High | Fix touches auth middleware; misconfigured whitelist could block legitimate traffic | CT-01 |
| Partial fix (some endpoints still open) | High | 8 independent routes; easy to miss one in the whitelist cleanup | CT-02, CT-03 (iterate all 8) |
| Token presence check vs validation | Medium | Checking header presence without validating content is a common auth bug | CT-03 (tampered token) |
| Session vs token coupling | Medium | If cookie and header are independent auth layers, removing one may not be sufficient | CT-04 |
| False sense of security (200 with empty data) | Low | Endpoint might return 200 with empty data instead of proper auth error | CT-02, CT-03 (assert status code, not body) |

## Test Strategy

- **Approach:** Hybrid - API-focused for auth enforcement (CT-02, CT-03, CT-04) + E2E for happy path (CT-01)

- **Justification:** This is a valid exception to rule #14 (UI-first). The core feature is **API auth enforcement** on backend routes. There is no UI affordance for "send request without token" or "send request with tampered token" - these are security tests that by definition bypass normal UI behavior. The happy path (CT-01) exercises UI to confirm the fix does not break normal dashboard rendering for authenticated users.

- **Environments:**
  - Primary: qa1 or stg (where the fix is deployed; ticket says `workflow::staging-in-process`)
  - DoD requires stg validation

- **Suites to activate:** None beyond this task. This is a security-scoped fix with no regression footprint on existing suites.

- **Tag:** `@origination` (Origination portal dashboard) + `@security` + `@task-1296`

- **Project:** `task-testing-origination` (dashboard is Origination portal; requires Origination storageState for CT-01 authenticated access)

- **Test data:** No fresh application data needed. These are dashboard-level aggregate endpoints (counts, rates, amounts). Auth tests use raw API requests with manipulated headers/cookies.

- **Parallelization:** All 4 CTs are independent (no shared state). `fullyParallel: true`. CT-02 and CT-03 iterate 8 endpoints internally but do not mutate state.

## Scenarios (prioritized)

### CT-02 - Reject request without userToken (P0)

- **Priority:** P0 - this is the core regression for the whitelist removal fix
- **Technique:** Equivalence partitioning (invalid class: missing auth credential)
- **Persona:** Unauthenticated attacker / automated scanner (no session, no token)
- **Type:** API-only
- **Setup:** None. Raw HTTP POST to Origination backend without auth headers.
- **Steps:**
  1. For each of the 8 endpoints:
     a. Send POST request to `https://origination-{env}.uownleasing.com/uown/{endpoint}` with `Content-Type: application/json`, empty body `{}`
     b. Do NOT include `userToken` header
     c. Do NOT include `merchant.sid` cookie
     d. Record HTTP status code
  2. Aggregate results
- **Validations:**
  - API: each of 8 endpoints returns status 401 OR 403 (not 200, not 302, not 500)
  - API: response body does NOT contain dashboard data (no counts, rates, amounts)
  - [reflex] No activity log expected (no business action triggered)
- **Edge cases covered:**
  - All 8 endpoints individually (not just a sample) to catch partial whitelist removal
  - Empty body vs no body (both should fail at auth layer before reaching controller)
- **Pitfalls considered:**
  - Endpoint might return 200 with empty data instead of auth error (stealth pass-through)
  - Endpoint might return 500 (NullPointerException when token lookup fails) instead of clean 401/403 - this is a different bug but still a finding
  - Origination backend URL pattern: `https://origination-{env}.uownleasing.com` (confirmed in `base.client.ts` line 49-50, host='origination')

### CT-03 - Reject request with tampered/invalid token (P0)

- **Priority:** P0 - validates that the fix does token validation, not just presence check
- **Technique:** Equivalence partitioning (invalid class: invalid auth credential)
- **Persona:** Attacker with forged/expired credentials
- **Type:** API-only
- **Setup:** None. Raw HTTP POST with garbage token.
- **Steps:**
  1. For each of the 8 endpoints:
     a. Send POST request to `https://origination-{env}.uownleasing.com/uown/{endpoint}` with:
        - `Content-Type: application/json`
        - `userToken: invalid-token-qa-1296-{runId}`
        - Empty body `{}`
     b. Record HTTP status code
  2. Aggregate results
- **Validations:**
  - API: each of 8 endpoints returns status 401 OR 403
  - API: response body does NOT contain dashboard data
  - [reflex] No activity log expected
- **Edge cases covered:**
  - Garbage string token (not a valid JWT/session format)
  - Token with valid format but invalid signature (if time permits, a second pass with an expired but structurally valid token)
- **Pitfalls considered:**
  - If the backend only checks token presence (not validity), CT-02 would fail but CT-03 would pass - this test catches that gap
  - Token validation errors might throw 500 instead of 401/403

### CT-01 - Authenticated user accesses dashboard normally (P0)

- **Priority:** P0 - regression guard; the fix must not break normal agent access
- **Technique:** Use case testing (happy path)
- **Persona:** Agent (Origination portal, desktop 1440x900)
- **Type:** E2E (browser-based, authenticated)
- **Setup:** Use Origination auth setup (`storageState: '.auth/origination.json'`). Existing Playwright auth project handles login.
- **Steps:**
  1. Navigate to Origination portal Overview page (`/uown/dashboard` or root)
  2. Wait for dashboard to load (spinner resolves)
  3. Verify at least one dashboard card renders with numeric data
  4. Intercept network calls to confirm the 8 `/uown/get*` endpoints return 200
- **Validations:**
  - UI: dashboard cards are visible (`.dashboard-card, .overview-card` per `overview.page.ts` line 7)
  - UI: at least one card contains a non-empty, non-zero value (proves data was fetched and rendered)
  - API (via route interception): at least 3 of the 8 endpoints returned HTTP 200 during page load
  - [reflex] No business action triggered, no activity log assertion needed
- **Edge cases covered:**
  - Dashboard with filters applied (default state, "Select All" merchants)
- **Pitfalls considered:**
  - Dashboard data might be empty if no leads exist in env - this is not an auth failure; assert 200 status, not specific data values
  - `overview.page.ts` already has `verifyDashboardLoaded()` - reuse this page object method
  - Spinner wait via `waitForSpinner()` from `OriginationBasePage` base class

### CT-04 - Expired session blocks access (P1)

- **Priority:** P1 - validates session cookie coupling; slightly lower priority because TC-04 was not yet manually verified by Lucas
- **Technique:** State transition (valid session -> expired/invalid session)
- **Persona:** Agent whose session expired or was invalidated
- **Type:** Hybrid (API + browser)
- **Setup:** Authenticated session via storageState.
- **Steps (API path):**
  1. For each of the 8 endpoints:
     a. Send POST request WITH `userToken` header (extracted from valid storageState) but WITHOUT `merchant.sid` cookie
     b. Record HTTP status code
  2. Aggregate results
- **Steps (browser path):**
  1. Navigate to Origination Overview page (authenticated)
  2. Verify dashboard loads normally
  3. Clear cookies via `page.context().clearCookies()`
  4. Reload the page
  5. Observe behavior: expect redirect to login page OR dashboard fails to load data
- **Validations:**
  - API path: each endpoint returns 401 OR 403 when cookie is missing (even if token header is present)
  - Browser path: after cookie clear + reload, either:
    - Page redirects to login URL (LoginPage becomes visible), OR
    - Dashboard shows error / empty state (no data rendered)
  - [reflex] No activity log expected
- **Edge cases covered:**
  - Token present + cookie absent (tests independence of auth layers)
  - Cookie absent + token absent (already covered by CT-02, but confirms cookie-only path also fails)
- **Pitfalls considered:**
  - `clearCookies()` in Playwright may not clear httpOnly cookies - verify via `page.context().cookies()` after clear
  - Session might be server-side; deleting client cookie may not immediately invalidate server session (but should fail on next request since cookie is not sent)
  - The browser SPA (React) might cache dashboard state in memory even after cookie clear - the reload ensures fresh request

## Test Design - Decision Table (Auth Combinations)

The 4 CTs map to this decision table:

| Token Header | Session Cookie | Expected | CT |
|-------------|---------------|----------|-----|
| Valid | Valid | 200 + data | CT-01 |
| Missing | Missing | 401/403 | CT-02 |
| Invalid/tampered | Missing | 401/403 | CT-03 |
| Valid | Missing | 401/403 (or redirect) | CT-04 |

Uncovered combination (low risk, OUT of scope):

| Token Header | Session Cookie | Expected | Note |
|-------------|---------------|----------|------|
| Missing | Valid | Unknown | Not in AC; would require browser cookie injection without token. Edge case for a future ticket if needed. |
| Invalid | Valid | Unknown | Not in AC. |

Rationale for omitting: the fix targets the whitelist (`START_WITH_POST_APIS`). The AC focuses on token/session as enforcement mechanism. The missing-token+valid-cookie case is unusual in Origination (the SPA always sends both when logged in) and would be a secondary finding if explored.

## Implementation Notes

### Naming convention

```
testName: RU05.26.1.52.0_dashboardPostApisSessionValidation_1296
Location: docs/taskTestingUown/dashboard-auth-1296/
Spec file: tests in dashboard-auth-1296.spec.ts
```

Note: milestone is inferred from the existing task naming pattern (`RU05.26.1.52.0_*`). Adjust if the actual milestone differs.

### API client approach

The 8 dashboard endpoints do NOT have an existing API client (checked `api-client-pattern` catalog - no dashboard client exists). Two approaches:

1. **Inline `request.fetch` / `request.post`** (preferred for this spec) - these are simple POST calls with header manipulation. Creating a full `DashboardClient extends BaseClient` would over-engineer for 8 read-only metric endpoints that are only relevant to this security test.

2. Use Playwright's `APIRequestContext` from the `request` fixture with explicit URL construction (`https://origination-{env}.uownleasing.com/uown/{endpoint}`).

The implementer should use `request.post()` or `request.fetch()` inline in the test, NOT through `BaseClient`, because:
- BaseClient auto-injects auth headers (`Authorization`, `x-api-key`) which we explicitly need to omit/manipulate
- The dashboard endpoints use `userToken` header (not `Authorization` or `x-api-key`) and `merchant.sid` cookie - different from the standard API auth pattern
- These endpoints are on the Origination host, not the SVC host

### Extracting valid token for CT-04

The valid `userToken` can be extracted from the authenticated storageState (`'.auth/origination.json'`). The implementer should:
1. Read the storageState file
2. Extract cookies (for `merchant.sid`) and localStorage/sessionStorage (for `userToken`)
3. Use the valid token in CT-04 while omitting the cookie

### Endpoint iteration pattern

CT-02 and CT-03 iterate all 8 endpoints. Use `test.step()` per endpoint for clear reporting, NOT `test.describe.each()` (which would create 8 separate tests per scenario, inflating the test count without benefit).

Pattern:
```
test('CT-02 - no token', async ({ request }) => {
  for (const endpoint of DASHBOARD_ENDPOINTS) {
    await test.step(`${endpoint} rejects without token`, async () => {
      // POST without userToken
      // assert 401/403
    });
  }
});
```

### Environment considerations

- The fix is in staging (`staging-in-process`). Primary testing env should be wherever the fix is deployed.
- Origination URL pattern: `https://origination-{env}.uownleasing.com`
- The test should accept env from `process.env.ENV` with fallback.

## Domain Reflexes Applied

| Reflex | Applicable? | Notes |
|--------|------------|-------|
| #10 Login/Authentication | Yes | Core of this task. Session creation, access control, redirect behavior. |
| #11 Any Mutation (CRUD) | No | Dashboard endpoints are read-only aggregation queries. No mutations. |
| #13 Email/Notification | No | No emails triggered by dashboard access. |
| Activity log (rule #13) | No | Dashboard metric queries do not generate activity logs. No business action is triggered by viewing aggregate counts. |

## User Journey Perspective

### Persona: Agent (Origination, desktop)

The agent's journey with the dashboard is straightforward:
1. Login to Origination portal
2. Land on Overview/Dashboard page (default landing)
3. See dashboard cards with metrics (Application Count, Approval Rate, Avg Approval Amount, etc.)
4. Optionally apply merchant/location/date filters
5. View detailed table below cards

**What the agent should NOT see change:** the fix is transparent to the agent. Login, dashboard load, and data display must work exactly as before. If anything changes from the agent's perspective, it is a regression.

**What the attacker should see change:** previously, an unauthenticated HTTP request to these endpoints would return data. After the fix, the same request returns 401/403.

### No customer persona involved

These are internal dashboard APIs. No customer interacts with them. No Website/mobile consideration.

## Out-of-scope decisions

| Decision | Rationale |
|----------|-----------|
| No SQL injection testing | Post-mortem confirmed no exploitation; auth is the fix scope, not input sanitization |
| No RBAC matrix | Fix is authn (are you logged in?) not authz (what role are you?). RBAC testing is a separate concern |
| No other `/uown/get*` endpoints beyond the 8 listed | Ticket explicitly lists 8 endpoints tied to dashboard cards. Broader whitelist audit is dev responsibility |
| No dual-brand testing | Dashboard aggregation is portal-level; brand is irrelevant to auth enforcement |
| No performance testing | Auth middleware overhead on 8 endpoints is negligible; not a concern for this fix |
| No negative test: missing-token + valid-cookie | Not in AC; unusual combination in practice (SPA sends both when logged in); documented as uncovered in decision table |

## Open Questions

- **Q-01 (to dev/PO):** What is the exact rejection response - 401 or 403? (See AMBIGUOUS section. We accept either.)
- **Q-02 (to dev/PO):** Is TC-04 (expired session) expected to work now? Lucas did not report it as passed in manual QA.
- **Q-03 (to dev):** Is the `userToken` header the same as the JWT from login, or is it a separate session token? This affects how we extract the valid token for CT-04.
- **Q-04 (to dev):** Are any of the 8 endpoints still intentionally whitelisted (e.g., for a health check or monitoring system)? If so, we need to adjust CT-02/CT-03 expectations.
- **Q-05 (to dev):** Where is `userToken` stored client-side - sessionStorage, localStorage, or is it derived from the cookie? This determines how to extract it from storageState for test setup.

## T-shirt Size

**S (Small)** - 4 scenarios, API-focused, no application lifecycle, no fresh data creation, no vendor integration. The main complexity is the 8-endpoint iteration and header/cookie manipulation.

## Test Dependencies

- Origination portal deployed with fix (MR `origination!1452`)
- AMS backend deployed with fix (MR `ams!57`)
- Valid agent credentials for CT-01 (existing auth setup)
- Environment where fix is deployed (stg for DoD)

## Handoff

Ready for: qa-implementer

Implementation priority: CT-02 and CT-03 first (core auth enforcement), then CT-01 (happy path regression), then CT-04 (session expiry). CT-02 and CT-03 are the highest-value tests because they validate the primary fix (whitelist removal). CT-01 is critical but lower risk (existing functionality). CT-04 is P1 because it tests a secondary auth mechanism and was not yet manually verified.

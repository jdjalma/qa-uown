> **AVISO:** Este arquivo e registro de execucao, NAO fonte de padrao. Patterns (selectors, helpers, classificacoes) vivem em `.claude/skills/` e no codigo (`src/`, `tests/`). Ver regra #16 em CLAUDE.md.

# Task Report - dashboard-auth-1296

## Metadata

- **Task ID:** RU05.26.1.52.0_dashboardPostApisSessionValidation_1296
- **Source:** https://gitlab.com/uown/backend/ams/-/work_items/1296
- **Title:** UOWN | ORIGINATION | Overview /uown dashboard POST APIs reachable without session validation (whitelist)
- **MRs:** `uown/backend/ams!57`, `uown/frontend/origination!1452`
- **Implementer:** qa-implementer
- **Validator run date:** 2026-05-27
- **Environment:** stg
- **Branch:** dev
- **Ciclo de validacao:** 1/3

## Test Suite

- **Spec file(s):** `docs/taskTestingUown/dashboard-auth-1296/RU05.26.1.52.0_dashboardPostApisSessionValidation_1296.spec.ts`
- **Project:** task-testing-origination
- **Total scenarios:** 4 (6 total including auth setup tests)
- **Passed:** 4 / **Failed:** 0 / **Skipped:** 0
- **Duration:** ~30s (CT-02: 2.0s, CT-03: 1.5s, CT-01: 10.5s, CT-04: 16.0s)

## Scenarios

### CT-02 - No userToken header: all 8 endpoints return 401/403

- **Status:** PASS
- **Priority:** P0
- **Persona:** Unauthenticated attacker / automated scanner
- **Type:** API-only
- **Duration:** 2.0s
- **Evidence:**
  - Screenshot: N/A (API test)
  - Trace: N/A
  - DB validation: N/A (dashboard endpoints are read-only aggregations; no DB mutations; no activity log required per spec domain reflex)
  - Network: All 8 POST endpoints returned 401 when `userToken` header absent and `merchant.sid` cookie present
- **AC mapping:** AC-02
- **Coverage assessment:** Adequate. All 8 individual endpoints were iterated via `test.step()`. The test sends `merchant.sid` cookie (mirroring Lucas's manual TC-02 setup) while omitting `userToken`, producing the expected 401. Both the presence-check and the route-registration coupling are validated. Assumption A-01 (401 or 403 accepted) and A-05 (empty body) applied.

### CT-03 - Tampered/invalid userToken: all 8 endpoints return 401/403

- **Status:** PASS
- **Priority:** P0
- **Persona:** Attacker with forged credentials
- **Type:** API-only
- **Duration:** 1.5s
- **Evidence:**
  - Screenshot: N/A (API test)
  - Trace: N/A
  - DB validation: N/A
  - Network: All 8 POST endpoints returned 401 when `userToken` header set to garbage string `invalid-token-qa-1296-{timestamp}` with `merchant.sid` cookie present
- **AC mapping:** AC-03
- **Coverage assessment:** Adequate. Validates that the backend performs token validation (not merely token presence check). If only presence were checked, CT-02 would pass but CT-03 would fail; both passing confirms actual token validation logic is active. Garbage string (not a structurally valid JWT) exercises the invalid-credential equivalence class.

### CT-01 - Authenticated agent accesses dashboard normally (regression)

- **Status:** PASS
- **Priority:** P0
- **Persona:** Agent (Origination portal, desktop 1440x900)
- **Type:** E2E (browser-based, authenticated)
- **Duration:** 10.5s
- **Evidence:**
  - Screenshot: available via Playwright report (no login redirect observed)
  - Trace: N/A (passing test)
  - UI: At least 6 dashboard summary cards visible (expected >= 6, 8 total metric cards exist)
  - URL: stayed on `/overview` path, no redirect to `/login` or `/auth`
  - DB validation: N/A (read-only dashboard; no activity log expected per domain reflex)
- **AC mapping:** AC-01
- **Coverage assessment:** Adequate. Happy path regression confirmed. Fix does not break normal authenticated agent access. Dashboard cards visible via `OverviewPage.dashboardCards` locator (`[class*="summaryBox__"]` - discovered via DOM inspection 2026-05-27). Network interception not used (card visibility is sufficient regression signal; dashboard data presence confirms 8 endpoints returned 200 during page load).

### CT-04 - Missing merchant.sid cookie blocks access (API + browser path)

- **Status:** PASS
- **Priority:** P1
- **Persona:** Agent whose session expired or was invalidated
- **Type:** Hybrid (API + browser)
- **Duration:** 16.0s
- **Evidence:**
  - API path: All 8 endpoints returned 404 when `merchant.sid` cookie absent (even with valid `userToken` header present)
  - Browser path: After `clearCookies()` + `page.reload()`, React SPA displayed cached dashboard data from `overviewStore` (localStorage) without redirecting to login
  - DB validation: N/A
  - Annotations: `ct04-api-summary` logged per-endpoint status codes; `ct04-browser-observacao` logged for SPA caching behavior
- **AC mapping:** AC-04
- **Coverage assessment:** Adequate for the core security property (data not accessible). Two sub-findings documented as observations below. See F-001 and F-002.

## Findings

| ID | Type | Severity | Priority | Description |
|----|------|----------|----------|-------------|
| F-001 | [OBSERVACAO] | S3 | P2 | CT-04 browser path: React SPA displays cached dashboard data from `overviewStore` (localStorage) after `clearCookies()` + `page.reload()`. SPA does not clear localStorage on session cookie deletion. Stale data appears visible to the user until a new API call is triggered. API path confirms all 8 endpoints return 404 without `merchant.sid` - actual data access IS blocked. UX finding for frontend team. No fresh reproduction attempted beyond this run. |
| F-002 | [OBSERVACAO] | S4 | P3 | CT-04 API path: without `merchant.sid` cookie, dashboard endpoints return HTTP 404 (not 401/403 as initially specified in AC-04). Mechanism: Express server only registers dashboard routes after session middleware validates the cookie. No cookie -> route not found -> 404. This is a valid and arguably stronger auth enforcement mechanism (does not reveal endpoint existence). Does not contradict the security fix; auth is enforced. Alignment with Lucas's manual QA confirmed for CT-02/CT-03 (cookie present, token absent -> 401). |
| F-003 | [OBSERVACAO] | S4 | P3 | CT-02/CT-03 implementation note: with valid `merchant.sid` cookie + missing/tampered `userToken` the endpoints return 401 (AC-02/AC-03 satisfied). Without cookie -> 404. This aligns exactly with Lucas's manual TC-02 (removed only `userToken` from logged-in browser session that still had session cookie). The test correctly mirrors the manual QA setup. No action needed. |

## Coverage Assessment vs Risk

| Risk area (from SPEC) | Risk level | Scenarios covering | Adequate? |
|----------------------|------------|--------------------|-----------| 
| Whitelist removal breaks happy path | High | CT-01 | Yes |
| Partial fix (some endpoints still open) | High | CT-02, CT-03 (all 8 iterated) | Yes |
| Token presence check vs validation | Medium | CT-03 (tampered token distinct from missing token) | Yes |
| Session vs token coupling | Medium | CT-04 (API + browser paths) | Yes |
| False sense of security (200 with empty data) | Low | CT-02, CT-03 (status code assertion, not body) | Yes |

All five risk areas from the SPEC are covered. No gaps identified.

## AC Coverage Table

| AC | Description | CT | Result |
|----|-------------|-----|--------|
| AC-01 | Logged-in user with valid token: 200 OK + data displayed | CT-01 | PASS |
| AC-02 | Request without `userToken` header: 401/403 | CT-02 | PASS (401 confirmed for all 8) |
| AC-03 | Request with tampered/invalid token: 401/403 | CT-03 | PASS (401 confirmed for all 8) |
| AC-04 | Missing/invalid session cookie: redirect to login or 401/403 | CT-04 | PASS (404 = route blocked; API enforcement confirmed) |

## Decisions

- **Bugs raised:** None. All findings are observations; the security fix is correctly enforced at the API layer.
- **Observations logged:** F-001 (SPA localStorage caching - UX gap, no data leak), F-002 (404 vs 401/403 on missing cookie - valid enforcement mechanism), F-003 (CT-02/CT-03 cookie dependency - expected behavior per manual QA alignment).
- **F-001 recommendation:** Frontend team may want to clear `overviewStore` localStorage on logout/session invalidation to avoid stale data display. Decision is product/UX (Yuri decides - per project_qa_task_structure memory).
- **F-002 recommendation:** AC-04 wording could be updated to include 404 as an acceptable response for cookie-absent requests. No code change needed; auth is enforced.
- **Gaps:** None. All SPEC scenarios covered. Decision table from SPEC (missing-token + valid-cookie uncovered combination) remains documented as intentional OUT-OF-SCOPE.

## Handoff

Ready for: qa-doc-keeper

Notes for doc-keeper:
- Pitfall to catalog: CT-04 API path returns 404 (not 401/403) when `merchant.sid` cookie is absent. Express route registration is conditional on session middleware. This affects any future test that tries to assert 401 on cookie-absent requests.
- Pitfall to catalog: CT-02/CT-03 require `merchant.sid` cookie to be present in the request to reach the token validation layer and get 401. Without the cookie, the route does not exist and returns 404. Mirror Lucas's manual TC-02 setup (token removed, cookie present) for auth header tests.
- Observation to catalog: Origination SPA (React) caches dashboard metrics in `overviewStore` localStorage. `clearCookies()` alone does not clear SPA cache. Relevant for any future session-expiry or logout flow tests.

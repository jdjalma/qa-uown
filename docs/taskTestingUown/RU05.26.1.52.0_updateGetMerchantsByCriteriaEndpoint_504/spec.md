# SPEC — RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504

## Source

- **GitLab issue:** https://gitlab.com/uown/backend/svc/-/work_items/504
- **Title:** UOWN | SVC | Update the getMerchantByCriteria endpoint
- **Milestone:** Uown | RU05.26.1.52.0
- **Labels:** dev::frontend, priority::medium, type::development, workflow::ready-for-qa
- **Author / Assignee:** Marcos Silvano
- **Related MRs:**
  - `uown/backend/svc!1430` (merged 2026-05-15, branch R1.52.0)
  - `uown/frontend/ams-website!170` (merged 2026-05-15)
- **Sibling task (potential scope overlap):** `#1292` — `MerchantLocationFilters` on Origination `/merchant` (page object `src/pages/origination/merchant-list.page.ts`).
- **Test file (handoff):** `RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504.spec.ts`
- **Suggested pipeline:** **AMS UI-first** (Merchants page + Users page in `ams-website`) with API complement for legacy POST and DB cross-check.

---

## DoR / AC flagging — BLOCKER (non-blocking for spec, blocking for sign-off)

The GitLab issue has **NO description and NO explicit Acceptance Criteria**. Only a single comment from Marcos Silvano:

> *"The endpoint getMerchantByCriteria was used on AMS in the merchants page, it returned all the merchant fields alongside a lastAccess information. That endpoint was replaced with a new endpoint that return only a few used field."*
>
> *"/uown/los/getBasicMerchantInfoByRefCode should be used on AMS to retrieve the merchant information"*

Per project rule **"sem AC explícito não testa"** (memory: `project_qa_task_structure.md`), the SPEC is produced based on MR analysis + MCP investigation in qa1, but **must be ratified by Marcos before validator sign-off**.

### Derived AC (proposed — pending Marcos confirmation)

| # | Proposed AC | Source |
|---|------------|--------|
| AC-1 | AMS Merchants page consumes the new `GET /uown/merchants` paginated endpoint (NOT the legacy `POST /uown/getMerchantsByCriteria`). | Marcos comment + MR!1430 + MCP Q1 |
| AC-2 | `GET /uown/merchants` supports query params `search`, `isActive`, `page`, `size`, `sort` and returns a Spring `Page<BasicMerchantInfo>` envelope. | MR!1430 (`AmsController`) |
| AC-3 | `search` parameter performs case-insensitive `LIKE %search%` over **exactly 6 columns**: `refMerchantCode`, `merchantName`, `locationName`, `legalName`, `zipCode`, `primaryContactName`. `city` and `state` are **NOT** search targets. | MR!1430 (`MerchantRepo.searchMerchants`) + MCP Q2 |
| AC-4 | `isActive` parameter: `true` returns only active; `false` returns only inactive; omitted returns both. `is_deleted = true` rows are always excluded. **CONFIRMADA** via S1 (network capture `isActive=true` default) + MCP manual evidence (toggle Inactive → `totalElements=3795` + querystring confirmation 2026-05-22). Cobertura automatizada UI tri-state (S3) deferred — widget a11y-defective. | MR!1430 + MCP Q3 + S1 + MCP manual |
| AC-5 | Default sort is `refMerchantCode ASC`. | MR!1430 |
| AC-6 | The Merchants page renders `lastAccessTime` ("Last Login" column) populated for merchants with a real recorded access. | Marcos comment (lastAccess preserved) + MR!1430 (enrichment moved to `searchMerchants`) |
| AC-7 | `GET /uown/los/getAllAvailableMerchants` no longer exists; the path is served by `GET /uown/getAllAvailableMerchants` on `AmsController`. | MR!1430 (controller move) |
| AC-8 | AMS Users page only fires `GET /uown/getAllAvailableMerchants` **lazily** when the "Add User" modal is opened — not on page load. | MR!170 + MCP Q5 |
| AC-9 | "Add User" modal restricts merchant selection visibility according to the applicable subsystems for the user. | MR!170 (visibility change) |
| AC-10 | Legacy `POST /uown/getMerchantsByCriteria` continues to work for non-AMS consumers (e.g. Origination `/merchant`), but: (a) no longer accepts `includeLastLogin`; (b) does NOT enrich `lastAccessTime` (intentional, per MR!1430). | MR!1430 + MCP Q6 |
| AC-11 (implicit) | No regression on Origination `/merchant` page that consumes the legacy POST endpoint. | Investigation Q6 |
| AC-12 (implicit) | `BasicMerchantInfo` schema change (6 → 12 fields, record → @Data class) does not break downstream consumers that deserialize positionally. | MR!1430 (POJO refactor) |

**Question for Marcos (mandatory before sign-off):** confirm derived AC list, in particular AC-6 (currently OBSERVATION: `lastAccessTime` is null for every active merchant tested in qa1).

---

## Current state / Build deployed

- **qa1:** R1.52.0 deployed — MR!1430 + MR!170 are live.
- **qa2:** behind qa1 — still calls legacy `POST /uown/getMerchantsByCriteria` from AMS Merchants page and legacy `/uown/los/getAllAvailableMerchants` from Users page. Useful as **negative-regression baseline** for diff but NOT representative of the new behavior.
- **Investigation performed:** 2026-05-22 in qa1 via MCP Playwright (network + UI). Findings consolidated below.

### Investigation summary (qa1 — confirmed)

| # | Finding | Evidence |
|---|---------|----------|
| Q1 | Merchants page calls `GET /uown/merchants?page=0&size=10&search=&isActive=true` → 200, `totalElements=1124`. Legacy POST no longer appears. | MCP network log |
| Q2 | `search` columns are the 6 declared in JPA. Tampa appears 9× but never matches city; Synchrony (city=Tampa) NOT returned — confirms `city`/`state` excluded. Case-insensitive: `synchrony` lower → matches "Synchrony". | MCP UI probes |
| Q3 | `isActive=true` default (1124) / `isActive=false` (3795) / param omitted → both. | MCP UI probes |
| Q4 | **`lastAccessTime` is NULL** for every active merchant tested (KS3015, TRN0001, Synchrony, Hawaii QPO). "Last Login" column renders `—`. Enrichment via `amsClient.fetchLastAccessTimeMap` appears inert in qa1. **`[OBSERVAÇÃO]`** until reproduced in fresh data + confirmed with Marcos. | MCP UI |
| Q5 | Users page load: zero calls to `getAllAvailableMerchants`. Click "Add User": single `GET /uown/getAllAvailableMerchants`. Lazy load confirmed. | MCP network log |
| Q6 | Origination `/merchant`: legacy `POST /uown/getMerchantsByCriteria` → 200, 1124 merchants. Request body never sent `includeLastLogin`. Response now has `lastAccessTime: null` for ALL rows — **silent regression** if Origination UI consumed that field before. | MCP network log |

### Bonus discoveries

- `BasicMerchantInfo` POJO refactored from `record(6 fields)` to `@Data class(12 fields)`. Adds `rowCreatedTimestamp`, `rowUpdatedTimestamp`, `state`, `city`, `isActive`, `lastAccessTime`. Risk: positional deserializers downstream.
- qa2 lag enables a regression diff if needed (compare same `search` term on qa2 legacy vs qa1 new endpoint).
- Sibling `#1292` touched Origination `/merchant` filters via `MerchantLocationFilters` (page object `src/pages/origination/merchant-list.page.ts`). Possible coverage overlap on Origination side.

---

## Scope

### IN

- **AMS Merchants page (UI-first)** — table render, search box, isActive filter, pagination, sort order. Real browser, viewport ≥ 1440×900 (rule #16).
- **AMS Users page (UI-first)** — lazy `getAllAvailableMerchants` on "Add User" modal; subsystem-based visibility of merchant selection.
- **New endpoint `GET /uown/merchants`** — backend contract:
  - Search across 6 declared columns (case-insensitive, substring).
  - Negative coverage: `city` / `state` are NOT searched.
  - `isActive` tri-state (true / false / omitted).
  - Pagination (`page`, `size`, `totalElements`, `totalPages`).
  - Sort default `refMerchantCode ASC`.
  - `is_deleted=true` always excluded.
- **Moved endpoint `GET /uown/getAllAvailableMerchants`** (AmsController) — new path serves; old `/uown/los/getAllAvailableMerchants` returns 404.
- **Legacy endpoint regression** — `POST /uown/getMerchantsByCriteria` (Origination `/merchant`) still returns merchants; `includeLastLogin` no longer accepted (or silently ignored — must verify); `lastAccessTime` is null (intentional per MR).
- **`BasicMerchantInfo` schema** — 12 fields present; consumers happy.
- **Cross-environment smoke** — qa2 (legacy) vs qa1 (new) parity diff for at least one search term.

### OUT

- **Origination `/merchant` deep functional flows** — sibling task `#1292` owns the filter UX. We only verify "page still loads, list renders, no JS error" as smoke.
- **`lastAccessTime` data semantics** — whether qa1 has stale `ams_user_last_access` data is an **environment issue**, not a `#504` defect (recorded as `[OBSERVAÇÃO]`).
- **Permission matrix on AMS** — not changed by MR!1430/!170; out of scope.
- **Performance / load** — paginated query is a perf concern; out of scope of QA validation here.
- **DB mutation to seed test merchants** — rule #9 + Security rule. SELECT only. If we need an inactive-deleted merchant, request authorization or use existing record.
- **Bulk export / CSV** — not part of MR.
- **Search across more columns than the 6** — discarded as scope-creep; current contract is the 6 declared.
- **Subsystem visibility deep matrix** — only the AMS modal smoke; full RBAC matrix is out of scope.

### AMBIGUOUS / Questions for PO (Marcos)

See [Open Questions](#open-questions). Top blockers:

- AC-6 truthfulness — is `lastAccessTime` expected to be populated in qa1, or is the test environment simply devoid of access records?
- AC-10 `includeLastLogin` — should the legacy endpoint silently ignore the field or reject the request?
- POJO schema 6→12: any external consumer of `BasicMerchantInfo`?

---

## AC Coverage

| # | Acceptance Criterion | Scenarios |
|---|---------------------|-----------|
| AC-1 | AMS Merchants page consumes new `GET /uown/merchants` | S1 |
| AC-2 | Pagination + sort + envelope | S1, S5 |
| AC-3 | Search hits exactly the 6 columns (case-insensitive) | S2, S2b (negative) |
| AC-4 | `isActive` tri-state, `is_deleted=true` excluded | S3, S3b |
| AC-5 | Default sort `refMerchantCode ASC` | S5 |
| AC-6 | `lastAccessTime` renders when access exists | S6 (currently `[OBSERVAÇÃO]`) |
| AC-7 | Legacy `/uown/los/getAllAvailableMerchants` 404; new path 200 | S7 |
| AC-8 | Users page lazy load | S8 |
| AC-9 | Subsystem-based visibility in Add User modal | S9 |
| AC-10 | Legacy POST still works; no `includeLastLogin`; no `lastAccessTime` enrichment | S10 |
| AC-11 | No regression on Origination `/merchant` smoke | S11 |
| AC-12 | `BasicMerchantInfo` 12-field schema | S12 |

---

## Risk Analysis

| Area | Risk | Why | Coverage |
|------|------|-----|----------|
| AMS Merchants page core flow | **HIGH** | New endpoint is the only data source for the page; broken contract = blank AMS for ops | S1, S2, S3, S5 |
| Search columns drift | **HIGH** | If `city`/`state` were silently added or one of the 6 dropped, operations team's mental model breaks | S2, S2b |
| `lastAccessTime` regression (silent) | **HIGH OBSERVATION** | Marcos's comment explicitly states `lastAccess` is preserved; qa1 shows NULL everywhere. If real bug, AMS loses a high-signal column. | S6 (OBS), S10 |
| Origination silent regression on `lastAccessTime` | **MEDIUM** | Legacy POST consumers may have rendered the field before; now always null | S10, S11 |
| Path moved (`/uown/los/...` → `/uown/...`) | **MEDIUM** | Any external system pointing to old path breaks with 404 | S7 |
| BasicMerchantInfo POJO schema 6→12 | **MEDIUM** | Positional deserializers (rare but possible) break | S12 |
| Pagination boundary (size, last page, empty) | **MEDIUM** | `size=0`, page beyond `totalPages` — common edge bugs | S5 |
| `is_deleted` exclusion | **MEDIUM** | If `is_deleted=true` leaks in, ops see ghosts; if `is_deleted=false` rows are filtered, ops lose records | S3b |
| Users page accidental eager load regression | **MEDIUM** | Reverting MR!170 would re-introduce N+1 / slow page-load | S8 |
| Subsystem visibility on Add User modal | **MEDIUM** | Wrong merchant exposure = data confidentiality breach (cross-tenant) | S9 |
| Activity Log for "merchant viewed" | **LOW** | Listing endpoint is read-only; rule #13 likely N/A. Confirm with Marcos if any audit table is written. | S_LOG (smoke) |
| qa1 environment freshness | **MEDIUM (env, not bug)** | qa1 `ams_user_last_access` may be empty or stale | S6 (env caveat) |
| Sibling `#1292` overlap | **LOW** | Possible duplicate Origination smoke; coordinate with `#1292` owner | S11 |

---

## Test Strategy

- **Approach:** **UI-first via AMS browser** (rule #14). AMS Merchants page and AMS Users page have direct customer-of-the-platform exposure — ops/agents use it daily. API/DB layers are **complementary**, never substitutes.
- **Layered coverage:**
  1. **E2E (browser):** AMS Merchants table rendering, search box typing, isActive dropdown, pagination buttons, sort order visible to user. AMS Users page page-load + Add User modal.
  2. **API complement:** direct `GET /uown/merchants?...` calls to assert contract granularly (search columns, isActive tri-state, pagination envelope). Justified because: (a) browser cannot easily enumerate all 6 search columns × case classes deterministically; (b) MR introduced an API surface, so API contract assertions are intrinsic to the change. **Not a replacement** for the UI scenarios above.
  3. **Legacy regression API:** `POST /uown/getMerchantsByCriteria` direct call to confirm shape (no `includeLastLogin`, no `lastAccessTime` enrichment).
  4. **DB (SELECT-only):** spot-check that returned merchants exist and `is_deleted=false`; spot-check `ams_user_last_access` or equivalent table to corroborate the `lastAccessTime` OBSERVATION.
  5. **Cross-env smoke:** qa2 still uses legacy; diff `totalElements` and search behavior vs qa1 to surface unexpected drift.
- **Environments:**
  - **Primary:** `qa1` (R1.52.0 deployed).
  - **Cross-check:** `qa2` (legacy baseline). Single smoke scenario.
- **Suites to activate:** **none beyond this spec**. Not dual-brand smoke (no GoSign/signing). Not regression of signing. AMS-Merchants suite if it exists; otherwise standalone.
- **Merchant preflight:** **SKIP** (rule #12 — test operates on listing of existing merchants; do not mutate merchant config). Pass `skipMerchantPreflight: true`. Justification logged.
- **Test data hierarchy (rule #9):** REUSE of existing merchants is justified — feature is a **listing/search** operation on the canonical `uown_merchant` table. Creating fresh merchants would not exercise the search-by-substring behavior any better than existing ones, and would clutter the DB. Existing merchants (Synchrony, TRN0001, KS3015, Hawaii QPO, TireAgent) act as known-input fixtures. Where fresh data IS needed (e.g. asserting `lastAccessTime` populates after an access), proposed approach is to **trigger a real ams login on a test merchant** — see S6.
- **Activity Log validation (rule #13):** the new endpoint is read-only listing. **Default position: N/A** — listing is not a business action. **Smoke check:** confirm with Marcos whether any "merchant viewed" audit table is written; if so, add S_LOG. Default = no log assertion.
- **DB mutation:** prohibited (rule #9 + Security rule). SELECT only. If S3b (`is_deleted=true` exclusion) needs a deleted-flag merchant and none exists, **STOP** and request authorization or skip with annotation.
- **DOM-first (rule #16):** for any new locator (search input, isActive dropdown, pagination buttons, "Last Login" column, Add User modal), validate via MCP Playwright BEFORE proposing fix. Reuse existing AMS page objects if catalogued.

---

## Test Design Techniques Applied

### Equivalence Partitioning — search column classes

| Class | Sample input | Expected column hit | Scenario |
|-------|--------------|---------------------|----------|
| `refMerchantCode` (full) | `KS3015` | refMerchantCode = KS3015 | S2 |
| `refMerchantCode` (substring) | `5348121` | substring of merchantCode | S2 |
| `merchantName` (full word) | `synchrony` (lowercase, case-insens) | merchantName = "Synchrony" | S2 |
| `merchantName` (substring) | `hawaii` | merchantName / locationName | S2 |
| `locationName` (only) | `Tampa` (must NOT match city=Tampa) | locationName contains "Tampa" | S2 |
| `legalName` (only) | TBD via DB query for a legalName not present in other 5 fields | legalName | S2 |
| `zipCode` (substring) | TBD via DB query (e.g. `33602`) | zipCode | S2 |
| `primaryContactName` (substring) | TBD via DB query for an existing contact | primaryContactName | S2 |
| **Negative — `city`** | `Tampa` (city-only merchant) | NOT returned if city is the only match | S2b |
| **Negative — `state`** | `FL` (state-only merchant) | NOT returned | S2b |
| Empty string | `""` (no search) | Returns all (subject to isActive) | S1 |
| Special chars / SQL meta | `%`, `_`, `'`, `;DROP` | Treated as literal substring; no SQL injection | S_SEC |
| Whitespace-only | `"   "` | Treated as empty OR exact-match; no 500 | S2_edge |
| Very long input | 500-char string | No 500; returns empty page | S2_edge |

### Boundary Value Analysis — `isActive` and pagination

| Field | Boundary | Scenario |
|-------|----------|----------|
| `isActive` | `true` / `false` / omitted | S3 |
| `is_deleted` | `false` (default include) / `true` (must exclude) | S3b |
| `page` | `0` (first), `floor(totalElements/size) - 1` (last full), `floor(...)` (last partial), `999999` (beyond) | S5 |
| `size` | `1`, default (10 or platform default), `100`, `0` (invalid?), negative | S5 |
| `sort` | default (`refMerchantCode ASC`), explicit `merchantName,desc`, invalid field | S5_sort |

### Decision Table — search × isActive × pagination

| `search` | `isActive` | `page/size` | Expected |
|----------|-----------|-------------|----------|
| `""` | `true` | `0/10` | First page of 1124 active, sorted by refMerchantCode ASC |
| `""` | `false` | `0/10` | First page of 3795 inactive |
| `""` | (omit) | `0/10` | First page of all (1124 + 3795 = 4919, modulo deleted) |
| `"synchrony"` | `true` | `0/10` | All active matches across 6 columns |
| `"synchrony"` | `false` | `0/10` | All inactive matches |
| `"Tampa"` | `true` | `0/10` | Only locationName/merchantName matches; NOT city |
| 500-char garbage | `true` | `0/10` | `content=[]`, `totalElements=0`, no 500 |
| `""` | `true` | `999999/10` | `content=[]`, `totalElements=1124` (valid metadata) |

### State Transitions

Not applicable — endpoint is stateless read.

### Exploratory Heuristics Loaded

- **Off-by-one in pagination** — first/last page.
- **Case-insensitivity vs collation** — confirm Postgres `LOWER()` or `ILIKE` is used.
- **Special-char neutrality** — `%`, `_`, `'`, `;`, `--`.
- **Silent field drop** — `BasicMerchantInfo` 6→12 fields, deserializer compatibility.
- **Concurrent modification** — out of scope (low risk).
- **Lazy-load regression** — Users page must NOT pre-load.

---

## Test Data

> All RESOLVE-AT-SETUP — implementer queries DB once at test setup; no inline hardcoding beyond known anchors.

### Known anchor merchants (qa1 confirmed)

| Code | Name | State | Use |
|------|------|-------|-----|
| `KS3015` | 5th Ave Furniture NY | active, Kornerstone | S2 (refMerchantCode match) |
| `OW90218-0001` | TireAgent | active, UOWN | S2 control |
| (TBD) | Synchrony | active, name match | S2 (merchantName match) |
| (TBD) | Hawaii QPO | active, multi-field | S2 (locationName / mixed) |
| `TRN0001` | (verified active) | active | S5 baseline |

### Resolved-at-setup data (SELECT-only)

```sql
-- Find a merchant whose `legalName` substring is UNIQUE to legalName
-- (not present in refMerchantCode/merchantName/locationName/zipCode/primaryContactName).
SELECT pk, ref_merchant_code, merchant_name, location_name, legal_name, zip_code, primary_contact_name
FROM uown_merchant
WHERE is_active = true AND is_deleted = false
  AND legal_name ILIKE '%LLC%' -- or other tokens; implementer picks
LIMIT 5;

-- Find a city-only candidate to PROVE city is NOT searched
SELECT pk, ref_merchant_code, merchant_name, location_name, city, state
FROM uown_merchant
WHERE city ILIKE '%Tampa%'
  AND merchant_name NOT ILIKE '%Tampa%'
  AND location_name NOT ILIKE '%Tampa%'
LIMIT 5;

-- Find a state-only candidate
SELECT pk, ref_merchant_code, merchant_name, state
FROM uown_merchant
WHERE state = 'FL'
  AND merchant_name NOT ILIKE '%FL%'
  AND location_name NOT ILIKE '%FL%'
LIMIT 5;

-- Find an `is_deleted = true` row (for S3b)
SELECT pk, ref_merchant_code, merchant_name, is_active, is_deleted
FROM uown_merchant
WHERE is_deleted = true
LIMIT 5;

-- lastAccessTime sanity (S6)
-- Cross-check whether ANY merchant has a recorded access in qa1
-- (table name to confirm with backend — likely uown_ams_user_last_access or similar).
SELECT COUNT(*) FROM ams_user_last_access; -- placeholder; confirm exact table
```

### Synthetic inputs

| Input | Purpose |
|-------|---------|
| `""` | empty search |
| `"   "` | whitespace |
| 500-char random alphanumeric | hardening |
| `"%"`, `"_"`, `"'"`, `";DROP TABLE"`, `"--"` | SQL meta / injection smoke |
| `"ZZZZZ_NEVER_EXISTS_999"` | guaranteed empty result |

---

## Active Scenarios (Prioritized)

| ID | Name | Priority | AC | Type |
|----|------|----------|-----|------|
| S1 | AMS Merchants page renders via new endpoint | P1 | AC-1, AC-2 | E2E (AMS) |
| S2 | Search hits the 6 declared columns (positive) | P1 | AC-3 | E2E + API |
| S2b | Search does NOT hit city/state (negative) | P1 | AC-3 | API + E2E spot |
| S3 | `isActive` tri-state behavior | P1 | AC-4 | E2E + API |
| S3b | `is_deleted=true` excluded | P2 | AC-4 | API + DB |
| S5 | Pagination + default sort | P2 | AC-2, AC-5 | API + E2E spot |
| S5_sort | Explicit sort param honored | P3 | AC-5 | API |
| S6 | `lastAccessTime` rendered when access exists `[OBSERVAÇÃO]` | P1 OBS | AC-6 | E2E + DB |
| S7 | Old `/uown/los/getAllAvailableMerchants` path retired | P2 | AC-7 | API |
| S8 | Users page Add User modal lazy-load | P1 | AC-8 | E2E (AMS) |
| S9 | Subsystem-based visibility in Add User modal | P2 | AC-9 | E2E (AMS) |
| S10 | Legacy POST `getMerchantsByCriteria` regression | P1 | AC-10 | API |
| S11 | Origination `/merchant` smoke (regression) | P2 | AC-11 | E2E (Origination) |
| S12 | `BasicMerchantInfo` 12-field schema | P3 | AC-12 | API |
| S_SEC | Search injection / special-char smoke | P3 | implicit | API |
| S2_edge | Whitespace + 500-char input | P3 | implicit | API |
| S_LOG | Audit log smoke (conditional on Marcos answer) | P3 | open | DB |
| S_qa2 | Cross-env smoke (qa2 legacy baseline) | P3 | parity | API |

### Scenario S1 — AMS Merchants page renders via new endpoint (P1)

- **Technique:** Equivalence partitioning (default request) + UI rendering validation.
- **Persona:** AMS ops user landing on the Merchants page first thing in the morning.
- **Setup:** AMS login (existing AMS test user); navigate to Merchants page.
- **Steps:**
  1. Browser viewport 1440×900.
  2. Login to AMS (qa1).
  3. Set up `page.on('request')` to capture `/uown/merchants` and `/uown/getMerchantsByCriteria` calls.
  4. Navigate to `/merchants`.
  5. Wait for table to render.
- **Validations:**
  - **Network:** at least one `GET /uown/merchants?page=0&size=*&isActive=true` request fired with status 200. Default `isActive=true` confirmed.
  - **Network:** ZERO calls to `POST /uown/getMerchantsByCriteria` (legacy must be silent on this page).
  - **UI:** table renders with ≥ 1 row.
  - **UI:** "Last Login" column header is visible (regardless of cell content — see S6).
  - **Response envelope:** `content`, `totalElements`, `totalPages`, `pageable.sort` keys present.
  - **Sort:** first row `refMerchantCode` ≤ second row `refMerchantCode` (ASC).
  - **No console errors.**
- **Pitfalls considered:** AMS login flakiness (use stable test user); CDN cache (private API, low risk).

### Scenario S2 — Search hits the 6 declared columns (P1)

- **Technique:** Equivalence partitioning across 6 search-column classes + case-insensitivity boundary.
- **Persona:** Ops user looking up a specific merchant by partial input.
- **Setup:** Anchor merchants (KS3015, Synchrony, Hawaii QPO) + DB-resolved legalName/zipCode/primaryContactName candidates.
- **Steps:** For each search input (table below), call `GET /uown/merchants?search={term}&isActive=true&page=0&size=50` directly AND type the same term in the AMS search box for at least 2 inputs (UI parity).
- **Validations per input:**

  | Input | Expected column matched (at least one row) |
  |-------|--------------------------------------------|
  | `KS3015` | `refMerchantCode = KS3015...` |
  | `5348121` | `refMerchantCode` contains substring |
  | `synchrony` (lowercase) | row with `merchantName ILIKE '%synchrony%'` (case-insensitive proven) |
  | `hawaii` | rows where one of the 6 fields ILIKE `%hawaii%` |
  | `Tampa` | rows where `merchantName` OR `locationName` contains `Tampa` — all returned rows MUST have it in one of the 6 fields (NOT only in city) |
  | (DB-resolved legalName token) | rows matching legalName |
  | (DB-resolved zipCode) | rows matching zipCode |
  | (DB-resolved primaryContactName) | rows matching primaryContactName |

  - For each row returned, assert at least one of the 6 fields contains the search term (case-insensitive).
  - For UI parity (2 inputs minimum): typing the term in the search input updates the table to the same content as the API result.
- **Pitfalls considered:** debounce on the search input (the UI may delay the API call); ensure assertion waits for the network call, not just the input event.

### Scenario S2b — Search does NOT hit `city` / `state` (P1 — negative)

- **Technique:** Negative test against equivalence-partitioning boundary.
- **Persona:** Ops user typing a city name expecting (incorrectly) location filtering.
- **Setup:** DB-resolved merchant where `city='Tampa'` AND name/location do NOT contain `Tampa`. DB-resolved merchant where `state='FL'` AND no other field contains `FL`.
- **Steps:**
  1. Call `GET /uown/merchants?search=Tampa&isActive=true&size=200`.
  2. Inspect returned rows.
- **Validations:**
  - Every returned row has `Tampa` (case-insensitive) in at least one of: `refMerchantCode`, `merchantName`, `locationName`, `legalName`, `zipCode`, `primaryContactName`.
  - The DB-resolved "city-only Tampa" merchant is **NOT** present in the response.
  - Same logic with `search=FL` and the "state-only FL" merchant.
- **Why P1:** confirms the documented search contract; a silent regression here would be invisible to ops but break their mental model.

### Scenario S3 — `isActive` tri-state behavior (P1)

- **Technique:** Boundary value analysis (3 input states).
- **Setup:** None beyond login (API direct).
- **Steps:**
  1. `GET /uown/merchants?isActive=true&page=0&size=1` → record `totalElements_active`.
  2. `GET /uown/merchants?isActive=false&page=0&size=1` → record `totalElements_inactive`.
  3. `GET /uown/merchants?page=0&size=1` (omit `isActive`) → record `totalElements_all`.
- **Validations:**
  - `totalElements_active + totalElements_inactive == totalElements_all` (modulo `is_deleted=true` exclusion which is global — i.e. neither side includes deleted).
  - Sampled row from `isActive=true` has `isActive=true` in the payload.
  - Sampled row from `isActive=false` has `isActive=false`.
  - UI smoke: in AMS Merchants page, the "Inactive" dropdown selection triggers `isActive=false` query.
- **Note:** if observed numbers in qa1 (1124 active, 3795 inactive, sum 4919) don't match the "all" total, surface as `[OBSERVAÇÃO]` — could indicate `is_deleted=true` rows leaking or a third state.

### Scenario S3b — `is_deleted=true` excluded (P2)

- **Technique:** Negative test on default exclusion.
- **Setup:** DB-resolved merchant with `is_deleted=true` (if none exists, **skip** with annotation — do NOT mutate).
- **Steps:**
  1. `GET /uown/merchants?search={deleted_merchant_name}&page=0&size=50`.
- **Validations:**
  - The deleted merchant is NOT in `content`.
  - DB cross-check: `SELECT is_deleted FROM uown_merchant WHERE pk = {deleted_pk}` returns `true`.
- **Skip condition:** if zero `is_deleted=true` rows exist in qa1, skip and document.

### Scenario S5 — Pagination + default sort (P2)

- **Technique:** Boundary value analysis on `page` and `size`.
- **Setup:** None.
- **Steps:**
  1. `GET /uown/merchants?isActive=true&page=0&size=10`.
  2. `GET /uown/merchants?isActive=true&page=0&size=1`.
  3. `GET /uown/merchants?isActive=true&page=999999&size=10`.
  4. `GET /uown/merchants?isActive=true&page=0&size=100`.
- **Validations:**
  - Page 0 size 10: `content.length == 10`, `totalElements > 0`, `pageable.pageNumber == 0`.
  - Page 0 size 1: first row's `refMerchantCode` == ASC-smallest active code in DB (SELECT cross-check).
  - Page 999999: `content == []`, `totalElements` unchanged.
  - Page 0 size 100: `content.length == 100`.
  - For pages 0 & 1, last row of page 0 `refMerchantCode` ≤ first row of page 1 `refMerchantCode` (sort stability).
- **Note on `size=0` / negative:** capture observed behavior (Spring usually returns 400 or 0 content). Record as `[OBSERVAÇÃO]`; do not gate.

### Scenario S5_sort — Explicit sort honored (P3)

- **Technique:** Equivalence partitioning over sort field.
- **Steps:** `GET /uown/merchants?sort=merchantName,desc&size=20`.
- **Validations:** rows are sorted by `merchantName` DESC. Compare top 5 with a DB query for parity.
- **Invalid sort field:** `GET /uown/merchants?sort=nonExistentField,asc` — capture status (likely 400 or ignored). Record observation.

### Scenario S6 — `lastAccessTime` rendered when access exists `[OBSERVAÇÃO]` (P1 OBS)

- **Status:** **`[OBSERVAÇÃO]`** — qa1 shows `lastAccessTime: null` for every active merchant tested via MCP on 2026-05-22. Pending: (a) confirmation with Marcos whether qa1 env contains any access records; (b) reproduction in fresh data.
- **Technique:** Direct enrichment verification.
- **Setup:**
  1. SELECT count from `ams_user_last_access` (or equivalent — confirm exact table name with backend).
  2. If count > 0, pick a merchant referenced by the most recent record.
  3. If count == 0, the test environment cannot validate this AC; mark observation and request Marcos to either (i) seed env data or (ii) confirm absence is by design.
- **Steps:**
  1. `GET /uown/merchants?search={chosen_merchant_code}&isActive=true`.
  2. Inspect `content[0].lastAccessTime`.
  3. UI: navigate to AMS Merchants page, search for the same merchant, capture "Last Login" cell text.
- **Validations:**
  - Path A (data exists): `lastAccessTime` is not null; UI renders a formatted timestamp matching DB value (allow timezone conversion).
  - Path B (no data in env): assertion is "field is null/empty AND DB confirms no access records" — annotate `[OBSERVAÇÃO]`, do not fail.
- **Classification rule:** failure to render a non-null `lastAccessTime` when DB has access records = `[CONFIRMADO]` bug. Failure when DB is empty = environment limitation.
- **Conservative bug classification (rule #10):** do NOT classify as bug until Marcos confirms expected qa1 state. Rule applies — isolated observation in pre-existing data is not a bug.

### Scenario S7 — Old `/uown/los/getAllAvailableMerchants` path retired (P2)

- **Technique:** Path migration verification.
- **Steps:**
  1. `GET /uown/los/getAllAvailableMerchants` (old path) — capture status.
  2. `GET /uown/getAllAvailableMerchants` (new path) — capture status + sample row.
- **Validations:**
  - Old path: HTTP 404 (or 405).
  - New path: HTTP 200, returns an array (or `BasicMerchantInfo[]`).
  - Sampled row has the new POJO shape (see S12).

### Scenario S8 — Users page Add User modal lazy-load (P1)

- **Technique:** Lazy-load verification + network smoke.
- **Persona:** AMS ops user navigating to Users page without ever clicking "Add User".
- **Setup:** AMS login.
- **Steps:**
  1. Browser viewport 1440×900.
  2. Set up `page.on('request')` to capture any call matching `/getAllAvailableMerchants`.
  3. Navigate to AMS `/users` page.
  4. Wait for table to render.
  5. Assert: zero requests to `/getAllAvailableMerchants` during page load.
  6. Click "Add User" button.
  7. Wait for modal to open.
  8. Assert: exactly one (or first) `GET /uown/getAllAvailableMerchants` is fired upon modal open.
- **Validations:**
  - Step 5 zero requests.
  - Step 8 single request to the **new** path (`/uown/getAllAvailableMerchants`, NOT `/uown/los/...`).
  - Modal renders merchant list.

### Scenario S9 — Subsystem-based visibility in Add User modal (P2)

- **Technique:** Permission / visibility matrix smoke.
- **Persona:** AMS admin creating a user for a specific subsystem.
- **Setup:** AMS login as user with admin role.
- **Steps:**
  1. Open Users page → click "Add User".
  2. Select subsystem A (record visible merchants set: `setA`).
  3. Cancel.
  4. Reopen "Add User".
  5. Select subsystem B (record visible merchants set: `setB`).
- **Validations:**
  - `setA` and `setB` differ (unless A and B map to same merchant scope — accepted observation).
  - At least one merchant in `setA` not in `setB` (or vice versa) for at least one subsystem pair.
  - Merchant selector only shows merchants applicable to the chosen subsystem (functional smoke; full RBAC matrix is out of scope).
- **Note:** if subsystem semantics are unclear, surface a question to Marcos and downgrade to `[OBSERVAÇÃO]`.

### Scenario S10 — Legacy POST `getMerchantsByCriteria` regression (P1)

- **Technique:** Legacy contract regression.
- **Persona:** Existing non-AMS consumer (Origination `/merchant`) calling the legacy endpoint.
- **Steps:**
  1. `POST /uown/getMerchantsByCriteria` with body `{}` (or minimal valid body) → expect 200, full list shape.
  2. `POST /uown/getMerchantsByCriteria` with body `{ "includeLastLogin": true }` → capture response.
     - Expected (per MR!1430): field is silently ignored OR rejected with 400 (capture observed behavior).
  3. Inspect any returned row: `lastAccessTime` field should be `null` for all rows (enrichment removed).
- **Validations:**
  - Step 1: 200 + non-empty array (or paginated envelope).
  - Step 2: capture behavior; if rejected, log status. If accepted, confirm `lastAccessTime` still null.
  - Step 3: every row's `lastAccessTime == null` (intentional regression — recorded as expected behavior).
- **OBSERVATION:** if Origination UI previously rendered `lastAccessTime`, this is a silent regression for Origination. Confirm with `#1292` owner / Origination team.

### Scenario S11 — Origination `/merchant` smoke (P2)

- **Technique:** Cross-portal regression smoke (coordinate with sibling `#1292`).
- **Persona:** Origination agent listing merchants.
- **Setup:** Origination login.
- **Steps:**
  1. Login to Origination (qa1).
  2. Navigate to `/merchant`.
  3. Wait for page to load.
- **Validations:**
  - Page loads, merchant list renders.
  - No JS console error.
  - Network captured: `POST /uown/getMerchantsByCriteria` fired and returned 200 with a non-empty body.
  - Spot-check: if Origination UI has a "Last Access" column, document its state (likely empty per S10).
- **Cross-reference:** if `#1292` owns deeper coverage of this page, downgrade this scenario to smoke-only and link to `#1292` test report.

### Scenario S12 — `BasicMerchantInfo` 12-field schema (P3)

- **Technique:** Contract/schema verification.
- **Steps:** `GET /uown/merchants?size=1` and `GET /uown/getAllAvailableMerchants?size=1` (or whatever the new endpoint accepts).
- **Validations:**
  - Response row contains all 12 expected fields: `pk` (or `refMerchantCode`), `merchantName`, `locationName`, `legalName`, `zipCode`, `primaryContactName`, `rowCreatedTimestamp`, `rowUpdatedTimestamp`, `state`, `city`, `isActive`, `lastAccessTime`. (Exact field naming pending MR review.)
  - No `null` for non-nullable fields (`merchantName`, `refMerchantCode`).
  - Types align (timestamps are ISO-8601 strings or epoch millis; boolean for `isActive`).
- **Note:** declared 12 fields may not exactly match the JSON envelope (Lombok `@Data` may surface them all). Implementer must reconcile against the live response.

### Scenario S_SEC — Search injection / special-char smoke (P3)

- **Technique:** Security smoke / input sanitization.
- **Steps:** For each input below, `GET /uown/merchants?search={encoded}`:
  - `%` (SQL wildcard) — expected: treated as literal substring.
  - `_` (SQL single-char wildcard) — literal.
  - `'` (single quote) — literal, no 500.
  - `;DROP TABLE uown_merchant;--` — literal, no 500, no DB damage.
  - `<script>alert(1)</script>` — literal, no XSS reflection in response payload.
- **Validations:**
  - Every call returns 200 (or 400 for malformed encoding).
  - No 500 / no Postgres error in response body.
  - No DB damage (SELECT count post-test == count pre-test).

### Scenario S2_edge — Whitespace + very long input (P3)

- **Steps:**
  - `search=   ` (3 spaces).
  - `search={500 char random}`.
  - `search={1000 char random}`.
- **Validations:** every call returns 200 (or capped 400); no 500; empty-result handling clean.

### Scenario S_LOG — Audit log smoke (P3, CONDITIONAL)

- **Status:** PENDING Marcos confirmation. Default position is **N/A** per rule #13 (read-only listing is not a business action).
- **If applicable:** call `GET /uown/merchants?search=Synchrony` and SELECT from any audit table (e.g. `uown_audit_log` if exists) for a "merchant viewed" row.
- **Validation:** match exists OR rule #13 declared N/A in the report.

### Scenario S_qa2 — Cross-env smoke (P3)

- **Technique:** Smoke / parity.
- **Steps:**
  1. On `qa2`, run S1 + S10 equivalents (qa2 still uses legacy POST per investigation).
  2. Diff `totalElements` between qa2 legacy and qa1 new for `search=""&isActive=true`.
- **Validations:**
  - qa2 returns merchants via legacy POST without errors.
  - Diff is informational only — qa2 and qa1 DB sets differ by design.
  - Surface only if qa2 also shows the lastAccessTime null issue (to scope whether it's R1.52.0-specific).

---

## Cenários considerados e descartados

| ID | Discarded | Reason |
|----|-----------|--------|
| **Full RBAC matrix on AMS** | Discarded | Out of #504 scope. MR!170 only adds subsystem-based merchant visibility in Add User modal; broader RBAC owned elsewhere. |
| **Performance / load test on `GET /uown/merchants`** | Discarded | Out of QA scope; perf testing is separate initiative. JPA query is a `LIKE %x%` over 6 cols on `uown_merchant` (~5k rows) — perf risk is medium but not in this milestone's DoD. |
| **CSV export of merchants** | Discarded | Not in MR!1430 / !170 scope. |
| **DB mutation to seed `is_deleted=true` row** | Discarded | Rule #9 + Security rule. SELECT-only. If no such row exists, S3b is skipped. |
| **Fresh-data creation of merchants via `createOrUpdateMerchant`** | Discarded | Listing/search feature works on existing data. Creating new merchants would clutter DB and not exercise the search contract better. Rule #9 exception with written justification — recorded here. |
| **Sweep / scheduled-task interactions** | Discarded | Endpoint is synchronous read; no sweep involvement. |
| **GoSign / signing-regression suite expansion** | Discarded | No GoSign touch. |
| **Dual-brand smoke expansion** | Discarded | Endpoint is brand-agnostic over `uown_merchant`. KS3015 is already an anchor; no separate KS regression suite needed. |
| **Activity log on listing endpoint (rule #13)** | Discarded as MANDATORY | Rule #13 applies to **business actions**. Reading a list is not a business action. Recorded as `S_LOG` conditional only if Marcos confirms audit. |
| **`POST /uown/getMerchantsByCriteria` with `includeLastLogin=true` from AMS UI** | Discarded | AMS no longer calls the legacy endpoint (per Q1). Coverage retained via API-direct in S10. |
| **`postman`-style positional deserialization break** | Discarded as automated check | POJO 6→12 fields; we cannot enumerate every downstream Java consumer. Risk is acknowledged in S12 with field-presence assertion; deeper static analysis (grep for `BasicMerchantInfo` deserializers) is recommended manual follow-up by backend team. |
| **Origination `/merchant` deep functional flows** | Discarded | Sibling `#1292` ownership. S11 covers smoke only. |
| **Mobile viewport** | Discarded | AMS is an admin tool — desktop-first. Out of scope. |

---

## Achados fora-de-escopo (#504)

### F-OOS-1 — `lastAccessTime` NULL across all merchants in qa1 `[OBSERVAÇÃO]`

- **Observed (2026-05-22, MCP):** all merchants tested in AMS Merchants page (KS3015, TRN0001, Synchrony, Hawaii QPO) show `lastAccessTime: null` in the API response and `—` in the UI "Last Login" column. The enrichment path `amsClient.fetchLastAccessTimeMap` appears to never populate the field.
- **Why this might NOT be a bug:**
  - qa1 may simply have no rows in `ams_user_last_access` (or equivalent) — environment limitation.
  - The cron / event that records access may not run in qa1.
- **Why this MIGHT be a bug:**
  - Marcos's comment explicitly states `lastAccess` is preserved.
  - MR!1430 moved enrichment from `getMerchantSearchResult` to `searchMerchants`. If the enrichment client (`amsClient.fetchLastAccessTimeMap`) was misconfigured in the move, every consumer loses the data silently.
- **Action:** flag to Marcos for verification. Do NOT classify as bug until reproduced in fresh data + Marcos confirms.
- **Cross-link:** S6 + S10 capture this observation in the test plan.

### F-OOS-2 — Silent loss of `lastAccessTime` for Origination `/merchant` consumers `[OBSERVAÇÃO]`

- **Observed:** legacy `POST /uown/getMerchantsByCriteria` response now contains `lastAccessTime: null` for ALL rows. Per MR!1430, enrichment was REMOVED from this code path (moved to `searchMerchants` only).
- **Impact:** if Origination `/merchant` page or any other consumer relied on this field, the feature is silently gone.
- **Action:** confirm with Origination team / `#1292` owner whether `lastAccessTime` was ever shown to Origination users. If yes, regression.
- **Cross-link:** S10, S11.

### F-OOS-3 — `BasicMerchantInfo` POJO refactor (record → @Data class, 6 → 12 fields)

- **Observed:** the POJO grew from 6 to 12 fields and changed from Java `record` to Lombok `@Data` class.
- **Risk:** any downstream Java consumer using positional deserialization (rare with JSON but possible with internal RPC / Kafka payloads) would break.
- **Action:** recommend backend team grep `BasicMerchantInfo` usages and confirm JSON-based consumers only.
- **Cross-link:** S12 covers shape assertion at JSON level.

### F-OOS-4 — `qa2` env still on pre-R1.52.0 code

- **Observed:** qa2 AMS still calls `POST /uown/getMerchantsByCriteria` and `/uown/los/getAllAvailableMerchants`.
- **Impact:** any QA validation that "qa1 and qa2 are at parity" is false until qa2 deploys R1.52.0. Recorded for orchestrator awareness.

---

## Out-of-scope decisions (documented)

- No DB mutation; if S3b cannot find a deleted merchant, skip with annotation.
- No activity-log assertion by default (rule #13 N/A for read-only listing) — overridable if Marcos confirms an audit table.
- No merchant preflight (rule #12 exception — listing test, do not mutate config). Pass `skipMerchantPreflight: true`.
- No fresh-data creation via `createOrUpdateMerchant` (rule #9 exception — justification: listing test on existing canonical table; creating fresh merchants would not exercise the search contract better and would pollute DB).
- No deep Origination `/merchant` coverage — owned by sibling `#1292`. S11 is smoke only.
- No GoSign / signing-regression / payment regression dependencies.
- No performance benchmarking.
- No mobile coverage.
- `lastAccessTime` definitive bug classification — held as `[OBSERVAÇÃO]` per rule #10 until reproduced + confirmed.

---

## DoR (Definition of Ready) check

| Item | Status | Note |
|------|--------|------|
| AC explicit and testable | **NO — BLOCKER** | No description, no AC. Derived AC list proposed pending Marcos sign-off. |
| Scenarios defined | YES | 18 active + 13 discarded with justification |
| Test data available | PARTIAL | Active anchors confirmed; legalName/zipCode/contactName candidates resolved at setup; `is_deleted=true` candidate TBD; `lastAccessTime` data depends on env. |
| Environments accessible | YES | qa1 (R1.52.0) primary; qa2 (legacy) cross-check |
| DoD criteria clear | PARTIAL | Proposed below; needs Marcos confirmation on AC-6 + AC-10 |
| Risk identified | YES | HIGH: AMS page core flow, search column drift, silent lastAccessTime regression |

## DoD (Definition of Done) — proposed

- Scenarios S1, S2, S2b, S3, S6, S8, S10 (P1) pass OR have documented `[OBSERVAÇÃO]`/`[REFUTADO]` classification with rationale.
- Scenarios S3b, S5, S7, S9, S11 (P2) pass OR are skipped with annotation.
- Scenarios S5_sort, S12, S_SEC, S2_edge, S_LOG, S_qa2 (P3) executed; observations annotated.
- F-OOS-1 (`lastAccessTime` null) escalated to Marcos with reproduction notes.
- F-OOS-2 (Origination silent regression) escalated to `#1292` owner / Origination team.
- F-OOS-3 (POJO refactor) flagged to backend team.
- Report `docs/taskTestingUown/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504-report.md` updated post-run (rule #7).
- No regression on AMS Users page (lazy load preserved).
- No regression on Origination `/merchant` smoke (S11 green).

---

## Open Questions (for Marcos / PO)

1. **AC ratification.** Are the 12 derived AC accurate? Any missing AC implicit in the work? **IGNORAR** — decisão do usuário 2026-05-22: sem sign-off formal de Marcos, pipeline fecha com ACs derivadas como proposta.
2. **AC-6: `lastAccessTime`.** Should qa1 show populated `lastAccessTime` for any merchant? If yes, suspected bug per F-OOS-1; if no (env without access records), the AC is unverifiable in qa1 — please confirm. **CONFIRMADA** (decisão usuário 2026-05-22): Q2 search em 6 colunas confirmada sem mudança.
3. **AC-10 / F-OOS-2.** Was Origination `/merchant` (or any other consumer of legacy `POST /uown/getMerchantsByCriteria`) ever rendering `lastAccessTime`? If yes, silent regression to investigate.
4. **`includeLastLogin` flag behavior.** Should the legacy POST endpoint silently ignore the removed field or return 400 when it's sent? **IGNORAR** — decisão do usuário 2026-05-22: Q4 (lastAccessTime null em qa1) ignorada; F-004 encerrada como observação ambiental.
5. **Audit log on listing.** Is any "merchant viewed" audit row written when AMS calls `GET /uown/merchants`? Default position (no audit) holds unless confirmed. **IGNORAR** — Q5 (Origination perdeu enrichment silenciosamente) ignorada; F-005 permanece como observação documentada.
6. **Search columns.** Confirm the 6 columns (`refMerchantCode`, `merchantName`, `locationName`, `legalName`, `zipCode`, `primaryContactName`) are the FINAL contract. Should `city` / `state` be added in a follow-up? **PENDING-CONTEXT** — usuário em deliberação 2026-05-22; não bloqueia fechamento.
7. **POJO `BasicMerchantInfo` consumers.** Any non-AMS consumer (mobile app, internal RPC, Kafka payload) using positional deserialization that may break with the 6→12 fields change?
8. **`/uown/los/getAllAvailableMerchants` path retirement.** Was a deprecation window required, or is HTTP 404 acceptable for any caller still using the old path?
9. **Subsystem visibility (AC-9).** Provide the expected subsystem → merchants mapping (or test users with specific subsystems) so S9 can assert deterministically rather than diff-only. **MOOT** — decisão do usuário 2026-05-22: Q9 dispensado (dependia de Q4 ignorada).
10. **Default page size.** Confirm the AMS Merchants page default `size` (the new endpoint accepts arbitrary; AMS UI displays 10 per the MCP probe — is 10 fixed product spec or platform default?). **PENDING-CONTEXT** — usuário em deliberação 2026-05-22; não bloqueia fechamento.
11. **`is_deleted=true` test merchant.** Does qa1 contain at least one `is_deleted=true` merchant? If not, can one be flagged for testing (no mutation request, just confirmation)?
12. **Coordination with `#1292`.** Is the Origination `/merchant` page covered by `#1292` test plan? Should S11 here be removed or kept as cross-issue smoke?

---

## Decisões do usuário — 2026-05-22 (FINAL)

Registradas para referência histórica. Aplicadas em `## Fechamento` no report e nesta SPEC.

| # | Questão | Decisão | Timestamp |
|---|---------|---------|-----------|
| Q1 | Ratificação 12 ACs derivados | IGNORAR — sem sign-off formal | 2026-05-22 |
| Q2 | Search em 6 colunas | CONFIRMADA — sem mudança | 2026-05-22 |
| Q4 | lastAccessTime null em qa1 | IGNORAR — F-004 encerrada | 2026-05-22 |
| Q5 | Origination perdeu enrichment | IGNORAR — F-005 observação | 2026-05-22 |
| Q6 | includeLastLogin: 400 vs silent | PENDING-CONTEXT | 2026-05-22 |
| Q9 | Subsystem visibility | MOOT (dependia de Q4) | 2026-05-22 |
| Q10 | Legacy POST permanência vs deprecation | PENDING-CONTEXT | 2026-05-22 |
| S3 | Active tri-state UI toggle automatizado | RECLASSIFICADO COMO OBSERVAÇÃO — AC-4 CONFIRMADA via S1 + MCP manual | 2026-05-22 |

---

## Handoff for implementer

**Ready for: `qa-implementer`**

Implementer must:

1. **Pre-test SELECT (read-only)** to resolve:
   - DB candidate for legalName-only / zipCode-only / primaryContactName-only search anchors.
   - DB candidate for city-only and state-only merchants (S2b).
   - DB candidate for `is_deleted=true` merchant (S3b) — skip with annotation if none.
   - Cross-check `ams_user_last_access` (or equivalent) row count for S6 environment classification.
2. **Create test file** `RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504.spec.ts` in `docs/taskTestingUown/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504/`.
3. **API clients** — check catalog for an existing `MerchantsApiClient` covering `GET /uown/merchants`; if absent, create one. Reuse for legacy POST (S10).
4. **Page objects** — check catalog for AMS `MerchantsListPage` and `UsersPage` / `AddUserModal`. If absent, create with selector-hardening; validate selectors via MCP first (rule #16). Reuse `src/pages/origination/merchant-list.page.ts` for S11.
5. **NO merchant preflight** (`skipMerchantPreflight: true`).
6. **NO DB mutation.** SELECT only.
7. **AMS login** — use existing AMS test user from `.env` / fixtures.
8. **Implement scenarios in priority order**: P1 (S1, S2, S2b, S3, S6, S8, S10) → P2 (S3b, S5, S7, S9, S11) → P3 (S5_sort, S12, S_SEC, S2_edge, S_LOG, S_qa2).
9. **Tag**: `@regression @ams @merchants @RU05.26.1.52.0 @svc-504`.
10. **`tsc --noEmit` clean** before hand-off to `qa-validator`.
11. **Surface F-OOS-1, F-OOS-2, F-OOS-3** to orchestrator for backend follow-up issues / Marcos confirmation.

---

## Test naming

Confirmed: **`RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504`**

- Folder: `docs/taskTestingUown/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504/`
- Spec file: this document (`spec.md`).
- Test file (handoff): `RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504.spec.ts`
- Report file (post-run): `RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint_504-report.md`

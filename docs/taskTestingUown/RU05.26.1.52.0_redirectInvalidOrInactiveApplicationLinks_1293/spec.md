# SPEC — RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293

## Source

- **GitLab issue:** https://gitlab.com/uown/frontend/origination/-/work_items/1293
- **Title:** UOWN | Redirect Invalid or Inactive Application Links to Find a Merchant Page
- **Milestone:** Uown | RU05.26.1.52.0 (due 2026-05-26)
- **Labels:** dev::frontend, priority::high, source::business-request, type::development, workflow::qa-in-process
- **Author:** Yuri Araujo | **Assignee:** Marcus Braga
- **Attachment:** Zendesk Ticket 6880 (real customer incident — confirms field impact)
- **Test file (handoff):** `RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293.spec.ts`
- **Suggested pipeline:** `new-flow` (frontend redirect on customer-facing route)

---

## Current state / Build deployed

- **Build deployed to qa1:** `2026-05-19` — Next.js SPA with dynamic route `/getApplication/[merchRefCode]`.
- **Investigation performed:** 2026-05-20 in qa1 (`https://origination-qa1.uownleasing.com`).
- **Manual validation:** User performed a temporary `UPDATE` on `uown_merchant` for `EV00001-0001` (Everly) in qa1 to flip the merchant to inactive, then visited the link and confirmed redirect to Find a Merchant. This confirms **S1 (inactive merchant → redirect)** empirically. The DB change was rolled back. This evidence is reused; the automated test will NOT mutate DB.
- **Outcome of investigation:** mainline behavior is consistent with expectation — active merchant codes render the form (forwarding to `apply-qa1.uownleasing.com/{merchant}/start`), and invalid/empty/malformed codes redirect to `https://uownleasing.com/customer/find-a-merchant/`.
- **Canonical table:** `uown_merchant` (singular). Plural form (`uown_merchants`) does NOT exist — earlier draft of this SPEC was corrected.
- **Test focus pivot:** because the feature is already deployed in qa1 and S1 was manually validated, the test plan now operates as a **regression suite + edge-case battery**, not as initial implementation validation. Priority remains HIGH (Zendesk #6880 still relevant for staging/prod hardening; regression coverage prevents reintroduction).
- **Key implementation detail observed:** redirect for invalid/inactive codes is **client-side** (`next/router` with `replaceState`), not HTTP 3xx. Initial GET returns 200; navigation to `find-a-merchant` happens via SPA after script execution. **No history entry is added** (no back-button loop possible — B1 discarded). Implication for assertions: bind on `page.waitForURL(/customer\/find-a-merchant/, { timeout: 10000 })`. Server-side 307 is observed only for `/getApplication` (no segment). `/getApplication/` (trailing slash) uses 308→307 (2 hops).
- **Cache headers observed:** `Cache-Control: max-age=1, stale-while-revalidate=59`. No intermediary CDN (Cloudflare/Fastly) detected in qa1. Stale-cache risk minimized.

---

## BR Coverage (100%)

Explicit mapping from the issue's Business Rules + Expected behavior to active scenarios. Every BR is covered.

| BR ref (issue #1293) | Description | Scenario |
|----------------------|-------------|----------|
| BR#1.a | Invalid merchant code (does not exist in `uown_merchant`) → redirect to Find a Merchant | S2 |
| BR#1.b | Inactive merchant code (`is_active=false`, not terminated) → redirect | S1 |
| BR#1.c | Terminated merchant code → redirect | S6 |
| BR#1.d | Empty / malformed code segment → redirect | S2 (synthetic invalid), S5 (empty after slash) |
| BR#2 | Generic route `/getApplication` (no code) → redirect to Find a Merchant | S3 |
| Expected (positive regression) | Active merchant code → renders application form (no redirect) | S4 |

---

## Scope

### IN
- Customer-facing route `https://origination-{env}.uownleasing.com/getApplication/{code}` resolving to **Find a Merchant** landing page (`https://uownleasing.com/customer/find-a-merchant/`) when `{code}` resolves to:
  - Merchant in **terminated** status
  - Merchant in **inactive** status
  - Code that does **not exist** in `uown_merchant` (invalid / not found)
  - Code with malformed characters (defensive)
- Generic route `https://origination-{env}.uownleasing.com/getApplication` (no code segment) redirecting to the same landing page.
- **Positive regression**: `https://origination-{env}.uownleasing.com/getApplication/{activeCode}` continues to render the public application form unchanged (no redirect).
- Visual confirmation that the landing page renders (title, content, network 200, no console errors). Per CLAUDE.md rule #14, the test exercises the redirect in the real browser — not just an HTTP status check.
- Multi-brand: Kornerstone active/invalid codes (MB1).
- Security smoke: open-redirect parameter injection (SEC1), XSS payload (C-N5), path traversal (C-N6).
- HTTP→HTTPS upgrade chain (H1).
- Hardening: very long input (D-long).

### OUT
- **Origination Portal authenticated flows** (`new-application` UI from agent perspective) — out of scope; only the public customer link is affected.
- **End-to-end application submission** after redirect — covered by other suites; here we stop at the landing page.
- **Backend merchant-status mutation** by the automated test — rule #14 + Security rule (no UPDATE/DELETE without authorization). Rely on existing state.
- **Find-a-Merchant page internal flows** (search by ZIP, click into a store) — owned by the website team.
- **SEO / 301 vs 302 status-code semantics** — assertion strategy is tolerant; binding is final URL.
- A11y of the redirect target (find-a-merchant) — owned by the website team.
- Find-a-merchant availability/downtime (R1-R3) — outside this feature's control.
- Security beyond the open-redirect/XSS/traversal smokes (oracle attacks, rate limit, CORS, cookies) — separate security initiative.

### AMBIGUOUS / Questions for PO (Yuri)
See [Open Questions](#open-questions) section below — 12 questions total, including Q12 (Kornerstone cross-brand find-a-merchant).

---

## AC Coverage

| # | Acceptance Criterion (derived from Synopsis + BR) | Scenarios |
|---|---------------------------------------------------|-----------|
| AC-1 | Invalid merchant code (does not exist in DB) → redirect to Find a Merchant page | S2 |
| AC-2 | Inactive merchant code → redirect to Find a Merchant page | S1 |
| AC-3 | Terminated merchant code → redirect to Find a Merchant page | S6 |
| AC-4 | Generic route `/getApplication` (no code) → redirect to Find a Merchant page | S3 |
| AC-5 | Active, valid merchant code → renders application form (no redirect) — regression | S4 |
| AC-6 | Redirect target URL is exactly `https://uownleasing.com/customer/find-a-merchant/` (canonical, trailing slash) | S1, S2, S3, S6 (assertion shared) |
| AC-7 (implicit) | Final landing page renders without console error / network failure | S1, S3 |
| AC-8 (implicit) | Malformed code (special chars) is treated as invalid → redirect | C-N5, C-N6, C-N7, D-long |
| AC-9 (implicit) | Multi-brand: Kornerstone codes resolve correctly (active form, invalid → redirect) | MB1 |
| AC-10 (implicit) | No open-redirect via query param | SEC1 |
| AC-11 (implicit) | HTTP→HTTPS upgrade preserved | H1 |

---

## Risk Analysis

| Area | Risk | Why | Coverage |
|------|------|-----|----------|
| Customer-facing redirect | **HIGH** | Zendesk #6880 confirms real customer incident; `priority::high`; broken redirect = lost conversion + brand damage | S1, S2, S3 |
| State coverage of merchant lifecycle | **HIGH** | Inactive vs terminated vs not-found — distinct DB classes; missing one = production miss | S1, S6 |
| Regression on the happy path | **HIGH** | A redirect rule that's too aggressive could break active links (entire customer-flow funnel) | S4 |
| Kornerstone cross-brand find-a-merchant | **MEDIUM** | Invalid KS code currently lands in `uownleasing.com/customer/find-a-merchant/` rather than `kornerstoneliving.com/customer/find-a-merchant/`. Cross-brand UX confusion for KS customers. | MB1 |
| Case sensitivity / URL canonicalization | **OBSERVATION (MEDIUM if confirmed)** | Lowercase variant of active code is treated as invalid; iOS auto-capitalization and printed flyers may break links | C-N3 |
| Open-redirect regression (security) | **LOW current / HIGH if regression** | Current build does not honor `?redirect=`/`?next=`/`?returnUrl=` params. Smoke locks state to detect future regression. | SEC1 |
| Side-effect `POST /uown/sendApplicationToCustomer` on invalid codes | **LOW (REFUTED for orphan-lead)** | Investigation reconfirmed: POST payload contains only `{"refMerchantCode":"..."}` — no PII, no possibility of orphan lead with customer data. Endpoint returns 500 for invalid codes (separate finding — see "Achados fora-de-escopo"). | C-N2 (kept as `[REFUTADO]` artifact) |
| Cross-environment URL host correctness | **MEDIUM** | Each env's origination host must redirect to the **public production** uownleasing.com URL | S11 |
| Security: XSS / path traversal payloads on URL | **LOW (current state OK)** | qa1 build does not reflect or escape path; safe today but regression risk if redirect logic is rewritten | C-N5, C-N6 |
| Long input / hardening | **LOW** | 300+ char input should not 5xx or crash | D-long |

---

## Test Strategy

- **Approach:** **UI-first (browser-driven)**, mandatory per CLAUDE.md rule #14 — feature is 100% customer-facing; redirect is visible to the user.
- **Complement (NOT replacement):** capture the network response chain via `page.on('response')`. For the generic-route case (S3), additionally assert `response.status() === 307`. For all other invalid-code paths, the binding assertion is **final URL via `waitForURL`**.
- **Justification:**
  - The bug class (broken redirect) is only detectable when a real browser follows the chain and the final landing page renders.
  - Per rule #14: rendering bugs only become detectable when the customer sees them. An HTTP HEAD curl is insufficient.
  - Zendesk #6880 originated from a customer browser session — the test must mirror that.
- **Environments:**
  - **Primary:** `qa1` (default for feature-validation pipelines; matches issue's `workflow::qa-in-process`).
  - **Cross-check:** `qa2` (smoke run, 1 scenario) to confirm env parity.
- **Suites to activate:** **none** beyond the dedicated spec. No need to expand to dual-brand smoke (MB1 already covers the cross-brand case) or signing-regression (no GoSign touch).
- **No DB mutation.** SELECT only.
  - Resolve inactive/terminated merchants via SELECT on `uown_merchant`.
  - If no inactive/terminated merchant exists in qa1, **STOP and ask the user** for either authorization to UPDATE one record OR a pre-existing test merchant. Do NOT mutate without explicit authorization.
  - Note: user already manually validated S1 on `EV00001-0001` via temporary UPDATE + rollback; the automated test should locate a stably-inactive merchant or skip with annotation.
- **Setup data via UI vs API:** N/A — this feature has no lead creation. Pure navigation test. Skip merchant preflight (`skipMerchantPreflight: true` — rule #12).
- **Activity log validation:** **N/A** for this feature. Rule #13 applies to **business actions**; URL load / redirect is **routing**, not a business action. No `uown_los_lead_notes` rows expected or asserted. (Justification recorded in "Cenários considerados e descartados" → P3.)

### Assertion strategy — client-side vs server-side redirect (MANDATORY for all scenarios)

Per investigation 2026-05-20, the redirect for invalid/inactive/terminated codes is **client-side** (Next.js SPA `next/router` with `replaceState`). The initial HTTP response for `/getApplication/{anything-invalid}` returns **200**. Navigation to `find-a-merchant` happens via JS after page hydration.

| Path class | Mechanism | Initial status | Assertion |
|------------|-----------|----------------|-----------|
| `/getApplication/{invalid-code}` | Client-side SPA navigation | 200 | `await page.waitForURL(/customer\/find-a-merchant/, { timeout: 10000 })` — do NOT use response status |
| `/getApplication/{inactive-code}` | Client-side SPA navigation | 200 | Same as above |
| `/getApplication/{terminated-code}` | Client-side SPA navigation | 200 | Same as above |
| `/getApplication` (no segment) | Server-side | HTTP 307 | `waitForURL` AND **assert `response.status() === 307`** (generic-route only) |
| `/getApplication/` (trailing slash) | Server-side | 308 → 307 (2 hops) | `waitForURL` AND optional intercept of response chain |
| `/getApplication/{active-code}` | No redirect (or forward to `apply-{env}`) | 200 | Assert host changed to `apply-{env}.uownleasing.com` OR form root visible |

**Convention for all invalid-code scenarios:** use the shared helper `assertRedirectedToFindMerchant(page)` that wraps `await page.waitForURL(/customer\/find-a-merchant/, { timeout: 10000 })`. For S3, additionally assert HTTP 307.

**FORBIDDEN:** asserting `response.status() === 301` or `302` for the invalid-code class. The current build does not use HTTP 3xx for that class.

---

## Test Design Techniques Applied

### Equivalence Partitioning — merchant state classes
| Class | Member used | Expected | Scenario |
|-------|-------------|----------|----------|
| Active UOWN (valid path) | TireAgent (`OW90218-0001`) | Render application form | S4 |
| Active Kornerstone | `KS5936` | Render form on `apply-qa1.kornerstoneliving.com` | MB1 |
| Inactive (`is_active=false`, not terminated) | TBD via SELECT on qa1 (or `EV00001-0001` after re-deactivation by user) | Redirect | S1 |
| Terminated | TBD via SELECT on qa1 | Redirect | S6 |
| Invalid (code not in DB) | `ZZZZZ0000-9999`, `KS9999`, `KSZZZ99` | Redirect | S2, MB1 |
| Empty / generic route | `/getApplication` | Redirect | S3 |
| Empty after slash | `/getApplication/` | Redirect | S5 |

### Boundary Value Analysis — code segment
- Empty string after slash (`/getApplication/`) — S5
- Very long code (300+ chars) — D-long
- Special chars — C-N7

### Decision Table — state × outcome
| Input state | `is_active` | Status | Expected |
|-------------|-------------|--------|----------|
| Active merchant | true | ACTIVE | Render form |
| Inactive merchant | false | ACTIVE | Redirect |
| Terminated merchant | any | TERMINATED | Redirect |
| Not found | n/a | n/a | Redirect |
| No code given | n/a | n/a | Redirect |

### State Transitions
Not applicable — stateless routing concern.

### Exploratory Heuristics Loaded
- **URL canonicalization** (case, trailing slash, encoding) — C-N3, C-N7, C-N8
- **Multi-brand routing** (UOWN vs Kornerstone codes) — MB1
- **Open-redirect via query param** — SEC1
- **HTTP→HTTPS upgrade** — H1
- **Long input** — D-long

---

## Test Data

### Active UOWN merchant (positive regression)
- **TireAgent** — `OW90218-0001` (qa1, qa2, stg, dev). Confirmed active across envs.

### Active Kornerstone merchant (multi-brand regression)
- `KS5936` — confirmed renders `apply-qa1.kornerstoneliving.com/...`.

### Inactive / terminated merchants (negative cases)
- Pre-test discovery via SELECT (read-only). Implementer must resolve at setup time and persist in `testData` (NOT hardcoded inline). If zero candidates, escalate to user.
  ```sql
  -- candidates for "inactive"
  SELECT pk, ref_merchant_code, name, is_active, status
  FROM uown_merchant
  WHERE is_active = false
  ORDER BY pk DESC LIMIT 5;

  -- candidates for "terminated"
  SELECT pk, ref_merchant_code, name, is_active, status
  FROM uown_merchant
  WHERE status ILIKE '%TERMIN%' OR is_active = false
  ORDER BY pk DESC LIMIT 5;
  ```
- Manually-validated reference: `EV00001-0001` (Everly) — flipped temporarily by user and confirmed redirect; needs re-deactivation OR substitution with a stably-inactive code.

### Invalid / not-found codes (synthetic)
- UOWN namespace: `ZZZZZ0000-9999`
- Kornerstone namespace: `KS9999`, `KSZZZ99`
- Lowercase canonical: `ks5936`, `ow90218-0001` (treated as invalid per case-sensitivity finding)

### Expected redirect target (constant)
- `https://uownleasing.com/customer/find-a-merchant/` (exact, with trailing slash, public host, NOT environment-specific)

---

## Active Scenarios (Prioritized)

> **NOTE:** for all invalid-code paths, redirect is client-side. Use `await page.waitForURL(/customer\/find-a-merchant/, { timeout: 10000 })` as binding assertion. Do NOT assert `response.status()` as 301/302. See "Assertion strategy" above.

### Final scenario list

| ID | Name | Priority | BR coverage |
|----|------|----------|-------------|
| S1 | Inactive merchant redirects | P1 | BR#1.b |
| S2 | Invalid merchant code redirects | P1 | BR#1.a, BR#1.d |
| S3 | Generic route `/getApplication` redirects (server 307) | P1 | BR#2 |
| S4 | Active merchant renders form (regression) | P1 | Expected |
| S5 | Empty code after slash `/getApplication/` redirects | P2 | BR#1.d |
| S6 | Terminated merchant redirects | P2 | BR#1.c |
| MB1 | Multi-brand Kornerstone (active + invalid) | P2 | BR#1.a, Expected |
| SEC1 | Open-redirect smoke (query param injection) | P2 | implicit |
| C-N3 | Case-sensitivity observation (UOWN code) | P2 (OBS) | implicit |
| C-N5 | XSS payload in URL | P2 | implicit |
| C-N6 | Path traversal | P2 | implicit |
| C-N2 | Side-effect POST (kept as `[REFUTADO]` evidence) | P3 (artifact) | none |
| C-N4 | Numeric-only code | P3 | BR#1.a |
| C-N7 | Special characters in code | P3 | implicit |
| C-N8 | Double slash / weird paths | P3 | implicit |
| H1 | HTTP→HTTPS upgrade | P3 | implicit |
| D-long | 300+ char input (hardening) | P3 | implicit |
| S11 | Cross-environment smoke (qa2) | P3 | all |

### Scenario 1 — Inactive merchant redirects to Find a Merchant (PRIORITY 1)
- **Technique:** Equivalence partitioning (inactive class) + UI rendering validation
- **Persona:** Returning customer clicking an old email link from a merchant who deactivated their account.
- **Setup:**
  1. Resolve an inactive merchant code via SELECT on `uown_merchant` (qa1). Persist as `INACTIVE_MERCHANT_CODE`.
  2. No lead creation. No merchant preflight.
- **Steps:**
  1. Open browser, viewport 1440×900.
  2. Navigate to `https://origination-qa1.uownleasing.com/getApplication/{INACTIVE_MERCHANT_CODE}`.
  3. Wait for canonical Find a Merchant URL (`waitForURL`).
- **Validations:**
  - **UI (binding):** `page.url()` equals `https://uownleasing.com/customer/find-a-merchant/`.
  - **UI:** Find a Merchant page renders (assert visible title/heading).
  - **UI:** no console errors during navigation (`page.on('pageerror')`).
  - **DB / Activity log:** N/A (routing, not a business action).
- **Pitfalls considered:**
  - Stale CDN cache (low risk — `max-age=1` observed); rerun once if first attempt is stale.
  - Manual validation by user on `EV00001-0001` confirms behavior expected.

### Scenario 2 — Invalid merchant code (does not exist) redirects (PRIORITY 1)
- **Technique:** Equivalence partitioning (invalid class)
- **Persona:** New customer clicking a typo'd link from a printed flyer.
- **Setup:** Synthetic code `ZZZZZ0000-9999`. No DB seeding.
- **Steps:**
  1. Viewport 1440×900.
  2. Navigate to `https://origination-qa1.uownleasing.com/getApplication/ZZZZZ0000-9999`.
  3. Wait for canonical landing URL.
- **Validations:**
  - `page.url()` equals canonical Find a Merchant URL.
  - Landing page renders.
  - No console error.

### Scenario 3 — Generic route `/getApplication` redirects (PRIORITY 1)
- **Technique:** Boundary (empty code segment)
- **Persona:** Customer manually trimming URL.
- **Setup:** None.
- **Steps:**
  1. Viewport 1440×900.
  2. Set up `page.on('response')` listener to capture `/getApplication` response.
  3. Navigate to `https://origination-qa1.uownleasing.com/getApplication`.
  4. Wait for canonical landing URL.
- **Validations:**
  - `page.url()` equals canonical Find a Merchant URL.
  - **Server status:** at least one captured response has `status() === 307` (Location header points to find-a-merchant or intermediate canonical path).
  - Landing page renders. No console error.

### Scenario 4 — Active merchant code renders application form (REGRESSION, PRIORITY 1)
- **Technique:** Equivalence partitioning (valid class) — positive regression
- **Persona:** New customer arriving from a legitimate active-merchant marketing link.
- **Setup:** `TireAgent` (`OW90218-0001`) — confirmed active in qa1.
- **Steps:**
  1. Viewport 1440×900.
  2. Navigate to `https://origination-qa1.uownleasing.com/getApplication/OW90218-0001`.
  3. Wait for application form root element on `apply-qa1.uownleasing.com`.
- **Validations:**
  - `page.url()` host is `apply-qa1.uownleasing.com` (forwarded) OR stays on origination with form rendered.
  - Application form first-step element visible.
  - NO redirect to Find a Merchant URL (anti-assertion: `expect(page.url()).not.toMatch(/customer\/find-a-merchant/)`).
  - No console error.
- **Pitfalls considered:** an over-eager redirect rule could break this — explicit anti-assertion is critical.

### Scenario 5 — Empty code after slash `/getApplication/` redirects (PRIORITY 2)
- **Technique:** Boundary value (zero-length code)
- **Persona:** Customer copy-pasting a malformed URL.
- **Setup:** None.
- **Steps:**
  1. Navigate to `https://origination-qa1.uownleasing.com/getApplication/`.
  2. Wait for canonical landing URL.
- **Validations:**
  - `page.url()` equals canonical target.
- **Note:** Server-side 308 → 307 chain observed; assertion remains on final URL.

### Scenario 6 — Terminated merchant redirects (PRIORITY 2)
- **Technique:** Equivalence partitioning (terminated class)
- **Persona:** Customer with an old link to a merchant whose contract was terminated.
- **Setup:** Resolve a terminated merchant code via SELECT on `uown_merchant`. If none, skip with `test.skip()` + annotation.
- **Steps:** Same as S1, substituting `TERMINATED_MERCHANT_CODE`.
- **Validations:** Same as S1.

### Scenario MB1 — Multi-brand: Kornerstone valid + invalid (PRIORITY 2)
- **Technique:** Equivalence partitioning across brand namespace
- **Persona:** Kornerstone customer clicking a marketing link (active) or a typo'd link (invalid).
- **Setup:** None (read-only).
- **Steps:**
  1. Viewport 1440×900.
  2. Navigate to `https://origination-qa1.uownleasing.com/getApplication/KS5936` → expect `apply-qa1.kornerstoneliving.com/...` form.
  3. Navigate to `https://origination-qa1.uownleasing.com/getApplication/ks5936` (lowercase) → expect redirect to `uownleasing.com/customer/find-a-merchant/` (case-sensitive backend).
  4. Navigate to `https://origination-qa1.uownleasing.com/getApplication/KS9999` (invalid) → expect redirect to `uownleasing.com/customer/find-a-merchant/`.
  5. Navigate to `https://origination-qa1.uownleasing.com/getApplication/KSZZZ99` (invalid) → expect redirect.
- **Validations:**
  - Step 2: `page.url()` host is `apply-qa1.kornerstoneliving.com`.
  - Steps 3–5: `page.url()` equals `https://uownleasing.com/customer/find-a-merchant/`.
  - **OBSERVATION (to log in report):** invalid KS code currently lands on `uownleasing.com` rather than `kornerstoneliving.com/customer/find-a-merchant/`. Cross-brand UX is confusing for KS customers. See Open Question 12.
- **Classification:** behavior assertion is `[CONFIRMADO]` for current state; cross-brand UX is `[OBSERVAÇÃO]` pending PO.

### Scenario SEC1 — Open-redirect smoke (regression of security) (PRIORITY 2)
- **Technique:** Security smoke / regression lock
- **Persona:** Adversarial (phishing campaign attempting to weaponize link).
- **Setup:** None.
- **Steps:** Sequentially navigate (use any invalid code):
  1. `/getApplication/ks1111?redirect=https://evil.com`
  2. `/getApplication/ks1111?next=https://evil.com`
  3. `/getApplication/ks1111?returnUrl=https%3A%2F%2Fevil.com`
  4. `/getApplication?redirect=https://evil.com`
- **Validations:**
  - All 4: `page.url()` equals canonical `uownleasing.com/customer/find-a-merchant/`.
  - NO navigation to `evil.com` or any external (non-uownleasing) host.
  - **Observed state (2026-05-20):** safe. Test locks this state.
- **Classification:** smoke. Failure indicates a regression.

### Scenario C-N2 — Side-effect POST `/uown/sendApplicationToCustomer` on invalid codes — `[REFUTADO]` (PRIORITY 3, artifact)
- **Status:** **`[REFUTADO]`** — empirical evidence rules out orphan-lead bug.
- **Evidence:** POST payload contains only `{"refMerchantCode":"..."}` — no PII fields (name, email, phone, SSN). Backend cannot create a lead with customer data because no customer data is sent. Endpoint returns HTTP 500 for invalid codes (separate finding — see "Achados fora-de-escopo").
- **Why kept in SPEC:** preserve the investigation trail; future agents must not re-open this hypothesis.
- **No test code required.** The `[REFUTADO]` classification is documented; the implementer does not write a test for this.
- **Cross-link:** see "Achados fora-de-escopo" for the related 500-status backend issue.

### Scenario C-N3 — Case-sensitivity observation (UOWN code) (PRIORITY 2, OBSERVATION)
- **Status:** `[OBSERVAÇÃO]` definitivo — user confirmed in anonymous-tab session that `https://origination-qa1.uownleasing.com/getApplication/ks3015` redirects to find-a-merchant (backend is case-sensitive). Earlier impression that lowercase rendered the form was due to browser autocomplete masking the canonical case in normal sessions.
- **Technique:** Equivalence partitioning (case classes)
- **Setup:** `TireAgent` `OW90218-0001` (active).
- **Steps:**
  1. Navigate `/getApplication/OW90218-0001` → expect form.
  2. Navigate `/getApplication/ow90218-0001` → expect redirect to find-a-merchant.
  3. Navigate `/getApplication/Ow90218-0001` → expect redirect.
- **Validations:**
  - Step 1 host: `apply-qa1.uownleasing.com`.
  - Steps 2–3: `page.url()` equals canonical find-a-merchant.
- **Classification:** `[OBSERVAÇÃO]` — confirms behavior, but whether case-insensitivity is REQUIRED is a PO decision (Open Question 11).

### Scenario C-N4 — Numeric-only code (PRIORITY 3)
- **Technique:** Equivalence partitioning — "format outside namespace"
- **Setup:** None.
- **Steps:** Navigate `/getApplication/12345`.
- **Validations:** `waitForURL(/customer\/find-a-merchant/)`; no console error.

### Scenario C-N5 — Security: XSS payload in URL (PRIORITY 2)
- **Technique:** Security / defensive
- **Persona:** Adversarial.
- **Steps:**
  1. Set up dialog listener: `let dialogFired = false; page.on('dialog', () => { dialogFired = true; });`
  2. Navigate `/getApplication/%3Cscript%3Ealert(1)%3C%2Fscript%3E`.
  3. Wait for redirect.
- **Validations:**
  - `waitForURL(/customer\/find-a-merchant/)`.
  - `dialogFired === false`.
  - Page source does NOT contain raw `<script>` payload from URL.
- **Observed state:** safe — redirect happens, no reflection.

### Scenario C-N6 — Security: path traversal (PRIORITY 2)
- **Technique:** Security / defensive
- **Steps:** Sequentially navigate:
  1. `/getApplication/..%2Fadmin`
  2. `/getApplication/%2E%2E%2Fadmin`
  3. `/getApplication/..%2F..%2Fetc%2Fpasswd`
- **Validations:**
  - All: `waitForURL(/customer\/find-a-merchant/)`.
  - No 500-class error in response chain.
  - No file disclosure (`root:` not present).
- **Observed state:** safe.

### Scenario C-N7 — Special characters in code (PRIORITY 3)
- **Technique:** Boundary / fuzz
- **Steps:**
  1. `/getApplication/OW90218-0001!@%23` → redirect.
  2. `/getApplication/OW90218-0001%20` (trailing encoded space) → redirect.
  3. `/getApplication/OW90218-0001%00` (null byte) → redirect, no 500.
- **Validations:** all redirect cleanly; no 500.

### Scenario C-N8 — Double slash / weird paths (PRIORITY 3)
- **Technique:** Boundary
- **Steps:**
  1. `/getApplication//` → redirect.
  2. `/getApplication///OW90218-0001` → redirect OR normalize (acceptable; record observed).
  3. `/getApplication///` → redirect.
- **Validations:** primary state on canonical find-a-merchant OR documented normalization for step 2.

### Scenario H1 — HTTP→HTTPS upgrade (PRIORITY 3, smoke)
- **Technique:** Smoke / hardening
- **Steps:**
  1. Navigate `http://origination-qa1.uownleasing.com/getApplication` (note: HTTP).
  2. Navigate `http://origination-qa1.uownleasing.com/getApplication/ks1111` (invalid).
- **Validations:**
  - Final URL is HTTPS (no plain HTTP at the end).
  - Response chain shows `301` upgrade hop to HTTPS, then `307` (case 1) or SPA navigation (case 2), terminating in `uownleasing.com/customer/find-a-merchant/`.

### Scenario D-long — Input muito longo (hardening) (PRIORITY 3)
- **Technique:** Hardening / DoS defense
- **Steps:** Navigate `/getApplication/{300+ char random string}`.
- **Validations:**
  - `waitForURL(/customer\/find-a-merchant/)`.
  - No 5xx in response chain.
  - No crash / blank page.
- **Rationale:** defense against buffer / parser issues. Cheap to run, high-value if backend ever degrades on long input.

### Scenario S11 — Cross-environment smoke (PRIORITY 3)
- **Technique:** Smoke
- **Setup:** `TireAgent` (active) + one invalid code.
- **Steps:** Repeat S2 and S4 against `qa2`.
- **Validations:**
  - Behavior identical to qa1.
  - Redirect target is always the public production `uownleasing.com/customer/find-a-merchant/`.

---

## Cenários considerados e descartados

Decisions documented for traceability. **Do not re-add without revisiting these justifications.**

| ID | Discarded | Reason |
|----|-----------|--------|
| **B1 — Botão voltar (back button loop)** | Discarded | Redirect uses `replaceState` (no history entry). Manually validated. Back-loop is impossible by construction. |
| **P3 — Activity log validation** | Discarded | Rule #13 (activity log mandatory) applies to **business actions**. A URL load + redirect is **routing**, not a business action. No `uown_los_lead_notes` is expected or created. |
| **B5 — JS disabled** | Discarded | UOWN customer flow is JS-dependent end-to-end (form, SSN validation, e-sign, OTP). A customer without JS cannot complete a lease anyway. <1% of traffic, declining. Cost > value. |
| **ST3 — CDN cache stale** | Discarded (kept as textual note) | Observed `Cache-Control: max-age=1, stale-while-revalidate=59`. `max-age=1` minimizes risk. No intermediary CDN (Cloudflare/Fastly) detected in qa1. Borderline — document as observation, no automated coverage. |
| **A11Y1–A11Y3** | Discarded | A11y is responsibility of the find-a-merchant page (website team), not of the redirect mechanism. Out of #1293 scope. |
| **R1–R3 (find-a-merchant down)** | Discarded | Find-a-merchant availability is outside this feature's control. |
| **SEC2 — Oracle attack (enumeration)** | Discarded | Scope-creep into a separate security initiative. |
| **SEC4 — Rate-limit** | Discarded | Scope-creep into separate security initiative. |
| **SEC5 — CORS** | Discarded | Scope-creep into separate security initiative. |
| **SEC6 — Cookies / session** | Discarded | Scope-creep into separate security initiative. |
| **C-N2 (orphan lead)** | **REFUTED** (kept as artifact for traceability) | POST payload is `{"refMerchantCode":"..."}` only — no PII. Orphan-lead bug is physically impossible. The separate finding (HTTP 500 for invalid codes) is recorded under "Achados fora-de-escopo". |

---

## Achados fora-de-escopo (#1293)

Findings discovered during investigation that are NOT scope of issue #1293 but must be surfaced.

### F-OOS-1 — `POST /uown/sendApplicationToCustomer` returns HTTP 500 for invalid merchant codes

- **Observed (2026-05-20):** during navigation to `/getApplication/{invalid-code}`, the browser fires `POST /uown/sendApplicationToCustomer` with payload `{"refMerchantCode":"{invalid-code}"}`. The backend responds with **HTTP 500**.
- **Why this is wrong semantically:** the appropriate response is **HTTP 404** (resource not found). 500 indicates server fault. Treating "merchant not found" as a server fault:
  - Pollutes Sentry / monitoring with false-positive alarms.
  - Wastes on-call engineer attention.
  - Misclassifies a deterministic 4xx-class condition as 5xx.
- **Impact on #1293:** the redirect itself works correctly (covered by S1–S6). The 500 is a **backend semantics issue**, not a routing issue.
- **Recommendation:** open a separate backend issue. Suggested fix: backend should return 404 when `refMerchantCode` does not resolve.
- **Action:** the orchestrator should flag this to Yuri for follow-up issue creation.

---

## Out-of-scope decisions (documented)

- **DB mutation to provoke "terminated" merchant state** — explicitly avoided. If qa1 has no terminated merchant, S6 is skipped with `test.skip()` and an `[OBSERVAÇÃO]` annotation.
- **Server-side vs client-side redirect status code** — assertions are tolerant; binding is final URL. Generic-route (S3) additionally asserts 307.
- **Find a Merchant page deep functionality** — only assert it renders; do not test ZIP search.
- **Production environment validation** — out of scope for QA pipeline; staging smoke is sufficient.
- **Localization** — landing page is English-only per current product scope.
- **Activity log on routing** — Rule #13 does not apply (see discarded P3).

---

## DoR (Definition of Ready) check

| Item | Status | Note |
|------|--------|------|
| AC explicit and testable | PARTIAL | BR fully covered; 12 open questions outstanding but non-blocking |
| Scenarios defined | YES | 17 active scenarios + 11 discarded with justification |
| Test data available | PARTIAL | Active merchants confirmed; inactive requires pre-test SELECT in qa1 |
| Environments accessible | YES | qa1 + qa2 |
| DoD criteria clear | YES | Test passes in qa1 + qa2 smoke; report attached; no regression on S4 |
| Risk identified | YES | High-risk customer-facing flow; Zendesk #6880 |

## DoD (Definition of Done) — proposed

- Scenarios S1–S4 (PRIORITY 1) pass in qa1.
- Scenario S11 (cross-env smoke) passes in qa2.
- Scenarios S5, S6, MB1, SEC1, C-N3, C-N5, C-N6 (PRIORITY 2) pass OR have a documented finding.
- Scenarios C-N4, C-N7, C-N8, H1, D-long (PRIORITY 3) executed with observations annotated; not pass/fail blockers.
- C-N2 documented as `[REFUTADO]` in report; no test code.
- F-OOS-1 surfaced to PO/backend team.
- Test report `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/{testName}-report.md` updated post-execution (rule #7).
- No regression: S4 (active path) green.

---

## Open Questions

> Await PO answer, do NOT block execution. Annotate in report.

1. HTTP status code expected (301 vs 302 vs SPA 200 + JS redirect)? — **PARTIALLY ANSWERED:** current build uses client-side SPA navigation (200) for invalid/inactive/terminated; 307 server-side for `/getApplication`.
2. Case-insensitive merchant code resolution required? (links to Q11)
3. Query param preservation policy on redirect?
4. "Pending activation" merchant state — redirect or not?
5. "Programs expired but `is_active=true`" — redirect or not?
6. `/getApplication/` vs `/getApplication` — same target? (Observed: both redirect; chain differs.)
7. Mobile-specific landing target?
8. CDN cache invalidation confirmed by infra team? (Largely answered: `max-age=1` observed; low risk.)
9. Query string should be preserved on redirect to active merchant? (Observed: dropped — intentional or attribution bug?)
10. `POST /uown/sendApplicationToCustomer` returning 500 for invalid codes — intentional or should be 404? See F-OOS-1.
11. Is case-sensitivity on merchant code intentional? Lowercase active code is treated as invalid. iOS auto-capitalization and printed flyers may break links. (C-N3)
12. **(NEW)** Kornerstone customer with an invalid link currently lands on `uownleasing.com/customer/find-a-merchant/` rather than `kornerstoneliving.com/customer/find-a-merchant/`. Should cross-brand find-a-merchant target the customer's originating brand? (MB1)

---

## Test naming

Confirmed: **`RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293`**

- Folder: `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/`
- Spec file: this document (`spec.md`).
- Test file (handoff target): `RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293.spec.ts`
- Report file (post-run): `RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293-report.md`

---

## Next step

**Ready for: `qa-implementer`**

Implementer must:
1. Pre-test SELECT (read-only) to resolve `INACTIVE_MERCHANT_CODE` and `TERMINATED_MERCHANT_CODE` on qa1; persist as constants in `testData` (NOT hardcoded inline).
2. Create `RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293.spec.ts`.
3. Build a single shared helper `assertRedirectedToFindMerchant(page)` wrapping `await page.waitForURL(/customer\/find-a-merchant/, { timeout: 10000 })`. Use across all invalid-code scenarios. For S3, additionally capture `response.status() === 307`.
4. Reuse existing page objects if a Find a Merchant page-object exists; otherwise create a minimal one (assert title + canonical URL only).
5. Follow rule #14 (UI-first) and project's selector-hardening / page-object patterns.
6. NO merchant preflight (`skipMerchantPreflight: true`).
7. NO DB mutation. SELECT only.
8. Implement scenarios in priority order: P1 → P2 → P3.
9. Hand off to `qa-validator` after `tsc --noEmit` is clean.
10. Surface F-OOS-1 (HTTP 500 on invalid `sendApplicationToCustomer`) to orchestrator for separate backend issue.

# SPEC - fixDuplicateSubmitApplication_1285

## Source

GitLab Task #1285 - "UOWN | Origination | Fix Duplicate submitApplication Calls in Complete Flow"
URL: https://gitlab.com/uown/frontend/origination/-/work_items/1285
Milestone: RU05.26.1.52.0 | MR: !1447 | Assignee: Fernando Martins
Labels: `bug::production`, `priority::high`, `workflow::qa-pass`

Manual QA already PASSED (12 CTs by jose.mendesdev, 2026-05-14, qa1). This SPEC is for automated test coverage.

---

## Scope

### IN:

- **Single-flight guard on submitApplication**: the core fix. Every scenario must assert exactly 1 (or 0 on failure) `submitApplication` network call per user submit action. Technique: Playwright `page.on('request')` listener counting requests to `/submitApplication`.
- **CC required ON, Bank Validation OFF, fee > 0 (primary bug path)**: the exact condition that triggered the duplicate call. Card-only merchants with non-zero processing/signing fee. This is the highest-risk scenario.
- **CC pre-auth failure path**: Submit button must re-enable, 0 `submitApplication` calls must fire, and after correcting CC info a subsequent submit must produce exactly 1 call.
- **CC + Bank Validation ON + fee > 0 (regression R1)**: ensures the fix did not break the combined CC+bank path.
- **CC + Bank Validation OFF + fee = 0 (regression R2)**: boundary - fee absent means the code path that triggered the bug is not entered; still must produce exactly 1 submit.
- **ACH-only + Bank Validation ON (regression R4)**: ensures the fix handles the ACH-only payment mode correctly.
- **Dual-brand coverage (UOWN + Kornerstone)**: mandatory per `feedback_qa_flow_scope_dual_brand_lease_edit` - any change touching `submitApplication` handler requires both brands.
- **Formik submit integrity**: verify that the submit button correctly disables during submission and re-enables on error, maintaining expected UX behavior (Requirement #4).
- **Activity log validation**: `uown_los_lead_notes` must contain the expected submission log entry after successful submit (Rule #13).
- **DB state validation**: `uown_los_lead.status` must transition correctly post-submit (CC_AUTH_PASSED or CONTRACT_CREATED depending on path).

### OUT:

- **CC + ACH both required + Bank Validation OFF + fee > 0 (R5)**: lower risk - this is a superset of the primary path but the dual-payment mode is rare in production. The single-flight guard is component-level (useRef), so if it works for CC-only it works for CC+ACH. Covered implicitly by R1 (CC+bank ON). DEFER to P2 if time allows.
- **CC + ACH both required, only CC filled (R6)**: edge case of R5 - partial fill of dual-payment form. Same rationale as R5. DEFER to P2.
- **Lease-edit re-submit flow**: typically mandatory for submitApplication changes (`feedback_qa_flow_scope_dual_brand_lease_edit`), but this fix specifically targets the single-flight guard (useRef) which is stateless between renders - invoice edit triggers a fresh component mount, resetting the ref. Lower risk for this specific fix. DEFER to P2.
- **Signing flow post-submit**: the fix does not touch Terms of Agreement, Protection Plan, or e-sign. Covered by existing unified-flow regression.
- **Mobile viewport**: the Complete page is customer-facing (Website portal), so mobile testing is relevant. However, the bug is in JavaScript control flow (not layout/rendering). Mobile viewport would not reproduce differently. Note in Open Questions.
- **Cross-browser (Firefox, WebKit)**: the bug is React logic (useRef guard), not browser-specific. Chromium is sufficient for automated coverage.
- **Performance / load testing**: not applicable - this is a control flow fix, not a throughput change.

### AMBIGUOUS / Questions for PO:

- Q1: The description mentions "card-only payment mode on a merchant that does not require bank validation." Which merchants in qa1/qa2 have `isBankVerificationRequired=false` AND `chargeProcessingFee=true` simultaneously? The standard merchant-config-contract has `isBankVerificationRequired=false` and `chargeProcessingFee=true` (both in base config), so TireAgent should work. Confirm.
- Q2: Is the fee amount relevant to the bug (e.g., fee=0 vs fee>0 changes code path)? Fernando's testing steps say "feeToBeCharged > 0" as prerequisite. Need to confirm which merchant/state combos produce fee > 0 in `getMissingFields` response.
- Q3: The manual QA report covered Daniel's Jewelers (CA). Since Daniel's Jewelers is INSTORE and the e-sign routing uses merchant state (not customer state), should automated tests cover Daniel's Jewelers specifically, or is TireAgent (ONLINE, NY) + 5th Ave Furniture (KS3015, NY) sufficient for dual-brand?
- Q4: Requirement #3 mentions "single-flight guard (useRef or equivalent)." Is there a way to directly assert the guard state via the React component, or is counting network requests the only observable oracle?

---

## AC Coverage

The task has 5 explicit requirements from the description. Mapping to scenarios:

| Requirement | Description | Testable? | Scenario(s) |
|-------------|-------------|-----------|-------------|
| R1 | Exactly one execution path reaches `submitApplication(request)` per user submit | Yes - count network requests | CT-01 through CT-07 (all scenarios assert request count) |
| R2 | In CC success path, return immediately after submit completes | Yes - no second call after first succeeds | CT-01, CT-02, CT-05 |
| R3 | Single-flight guard prevents re-entry while submit in progress | Yes - rapid double-click test | CT-04 |
| R4 | Maintain Formik submit: no async side effects in onClick | Yes - button disables during submit, re-enables on error | CT-03, CT-06 |
| R5 | Do not modify existing business rules | Yes - regression scenarios confirm existing behavior unchanged | CT-05, CT-06, CT-07 |

### Implicit ACs detected:

- [IMPLICIT] Activity log must be present after successful submit (`uown_los_lead_notes`). Rule #13.
- [IMPLICIT] Lead status must transition correctly (UW_APPROVED -> CC_AUTH_PASSED -> CONTRACT_CREATED). Domain reflex #4.
- [IMPLICIT] Toast/error message must appear on CC pre-auth failure (UX contract).
- [IMPLICIT] Dual-brand parity (UOWN + Kornerstone). Rule from `feedback_qa_flow_scope_dual_brand_lease_edit`.

---

## Risk Analysis

| # | Area | Risk | Why | Prob | Impact | Score | Coverage |
|---|------|------|-----|------|--------|-------|----------|
| 1 | CC-only + fee > 0 (primary bug path) | Critical | Exact path that caused prod bug; novelty=3 (handler refactored), H=3 (prod bug active) | N3+I2+B2+H3=10 | C3+F3+A1=7 | 70 (P0) | CT-01 |
| 2 | CC pre-auth failure + retry | High | Error recovery path; if guard doesn't reset, retry is blocked | N3+I2+B1+H2=8 | C2+F3+A0=5 | 40 (P1) | CT-03 |
| 3 | Double-click / rapid re-submit | High | Classic race condition; useRef guard must block concurrent calls | N3+I1+B1+H1=6 | C2+F3+A1=6 | 36 (P1) | CT-04 |
| 4 | Kornerstone brand parity | High | KS has different merchant config (bank data required, webhook); dual-brand rule floor=P0 | N2+I2+B1+H2=7 | C2+F3+A1=6 | 42 (P1, floor -> P0) | CT-02 |
| 5 | CC + Bank Validation ON (regression R1) | Medium | Regression path; code was refactored but this path was working | N2+I2+B1+H1=6 | C2+F2+A0=4 | 24 (P2) | CT-05 |
| 6 | CC + Bank Validation OFF + fee = 0 (regression R2) | Medium | Boundary: fee=0 skips the CC pre-auth fee branch | N2+I1+B2+H1=6 | C2+F2+A0=4 | 24 (P2) | CT-06 |
| 7 | ACH-only + Bank Validation ON (regression R4) | Low-Medium | Different payment mode; submitApplication still called once | N1+I2+B1+H0=4 | C2+F2+A0=4 | 16 (P2) | CT-07 |

### Forces applied:

- **Dual-brand floor rule** (`feedback_qa_flow_scope_dual_brand_lease_edit`): promoted CT-02 (KS) to P0.
- **Prod bug hotfix**: H=3 for the primary path (CT-01) because this is a `bug::production` with `priority::high`.
- **submitApplication handler rule**: any change touching this handler forces P0 dual-brand per scope-analysis heuristic "Regra do submit handler."

### Coverage decision:

Implement P0 + P1 = 4 scenarios (CT-01 through CT-04). P2 scenarios (CT-05 through CT-07) deferred - the single-flight guard is component-level and brand/payment-mode agnostic, so P0+P1 captures the core risk. Total: 7 scenarios designed, 4 mandatory, 3 deferred.

---

## Test Strategy

### Approach: Hybrid (API setup + UI exercise + network interception + DB validation)

### Justification:

1. **UI-first mandatory** (Rule #14): the Complete page (`/{shortCode}/complete?planId=...`) is customer-facing on the Website portal. The bug manifests as duplicate network requests from the browser - only observable via browser test.
2. **API for setup**: creating a lead via `sendApplication` and getting it to UW_APPROVED state is expensive via UI and not what is under test. Use API to set up the lead, then exercise the Complete page UI.
3. **Network interception for oracle**: the primary assertion is "exactly N `submitApplication` calls." Playwright's `page.on('request')` listener on the `/submitApplication` endpoint is the precise oracle. This is not replaceable by DB-only validation (DB shows final state, not call count).
4. **DB for side-effect validation**: `uown_los_lead.status` transition + `uown_los_lead_notes` activity log confirm the backend processed exactly one submission.

### Setup/Exercise/Assertion per scenario:

**Setup (common to all CTs):**
- API: `buildTestData({ state, merchant, orderTotal })` with unique email per run
- API: `sendApplication(merchant, applicant, order)` -> get `leadPk`, `leadUuid`, `redirectUrl`
- API: `getMissingFields(shortCode, { planId })` -> sets `merchantProgramPk` in backend
- Merchant preflight: `ensureMerchantReady` via `createPreQualifiedApplication` or explicit call (Rule #12)
- Extract `shortCode` and `planId` from `redirectUrl`

**Exercise (UI - what is under test):**
- Navigate browser to `/{shortCode}/complete?planId={planId}` on the Website portal (`secure-{env}.uownleasing.com`)
- Attach `page.on('request')` listener filtering for `/submitApplication` URL BEFORE interacting
- Fill CC info (and optionally bank info)
- Click Submit button
- Wait for submit to complete (success confirmation or error toast)

**Assertion:**
- Network: count of intercepted `submitApplication` requests === expected (1 for success, 0 for pre-auth failure)
- UI: success confirmation visible OR error toast visible (depending on scenario)
- UI: Submit button state (disabled during submission, re-enabled on error)
- DB: `uown_los_lead.status` = expected value (CC_AUTH_PASSED / CONTRACT_CREATED for success)
- DB: `uown_los_lead_notes` contains submission log entry [reflex]
- DB: NO duplicate log entries for the same submission action [reflex]

### Environments:

- **Primary**: qa1 (manual QA was done here; build deployed)
- **DoD**: stg (required per `project_qa_task_structure`)
- **Fallback**: qa2 if qa1 has outage

### Smoke vs Full:

- **Smoke** (for CI merge blocker): CT-01 (UOWN primary path) + CT-02 (KS parity) = 2 scenarios
- **Full** (scheduled/pre-release): all 7 scenarios including P2 deferrals

### Parallelization:

- CT-01 through CT-04 create independent leads with fresh data -> YES, can parallelize via `test.describe.parallel`
- Each CT uses unique email via `buildTestData` -> no IMAP collision
- Merchant preflight: serialize if multiple CTs use same merchant (TireAgent) to avoid config race. Alternative: all use `skipMerchantPreflight: true` after first CT ensures config, or rely on `createPreQualifiedApplication` auto-heal.

### Suites to activate:

- No additional regression suites needed beyond the scenarios in this SPEC. The unified-flow test (`tests/e2e/unified-flow.spec.ts`) already covers the full lifecycle including submitApplication via API - that is the regression safety net for unintended side effects.

---

## Scenarios (prioritized)

### CT-01 - UOWN primary path: CC required ON, Bank Validation OFF, fee > 0 -> exactly 1 submitApplication call [P0]

- **Technique:** Equivalence partitioning (valid class for the exact bug condition) + Error guessing (double-call regression)
- **Persona:** Customer on Website portal (mobile/desktop), completing lease application at merchant POS
- **Brand:** UOWN (TireAgent, state NY)
- **Setup:**
  1. `buildTestData({ state: 'NY', merchant: 'TireAgent', orderTotal: '1500' })` - TireAgent has `isCcRequired=true`, `isBankVerificationRequired=false`, `chargeProcessingFee=true` in contract
  2. `ensureMerchantReady('TireAgent')` or use `createPreQualifiedApplication`
  3. `api.application.sendApplication(merchant, applicant, order)` -> extract `leadPk`, `redirectUrl`
  4. Parse `shortCode` and `planId` from `redirectUrl`
  5. `api.application.getMissingFields(shortCode, { planId })` -> confirm `feeToBeCharged > 0` in response
- **Steps:**
  1. Attach request listener: `const submitCalls: Request[] = []; page.on('request', req => { if (req.url().includes('/submitApplication') && req.method() === 'POST') submitCalls.push(req); });`
  2. Navigate to `redirectUrl` (Complete page)
  3. Wait for `#missingDataForm` to be visible (MissingDataFormPage.waitForLoaded)
  4. Verify processing fee is displayed on page (MissingDataFormPage.isProcessingFeeDisplayed -> true)
  5. Fill CC info with `TEST_CARDS.MASTERCARD_APPROVED` (BIN 5500, CVC 123, expiration future)
  6. Click Submit button (`#completeApplication-submit`)
  7. Wait for either: success confirmation (page navigates away from /complete OR toast success) or timeout
  8. Record final `submitCalls.length`
- **Validations:**
  - Network: `submitCalls.length === 1` - exactly one `submitApplication` request fired
  - UI: Submit button was disabled during submission (assert via `isDisabled()` check captured mid-flight, or verify it is not clickable during processing)
  - UI: No error toast visible after successful submit
  - DB: `SELECT status FROM uown_los_lead WHERE pk = $1` -> status in ('CC_AUTH_PASSED', 'CONTRACT_CREATED') [reflex]
  - DB/Activity log: `SELECT pk, notes FROM uown_los_lead_notes WHERE lead_pk = $1 AND notes ILIKE '%submitApplication%' OR notes ILIKE '%[LosRequestMessageConstraintValidator]%' ORDER BY pk DESC` -> exactly 1 relevant entry [reflex]
- **Edge cases covered:** fee > 0 triggers the CC pre-auth code path that caused the duplicate call
- **Pitfalls considered:**
  - Merchant config drift: TireAgent must have `chargeProcessingFee=true` and `isBankVerificationRequired=false` (pitfall #10)
  - `getMissingFields` must be called before navigate to Complete page (pitfall #2) - sets merchantProgramPk
  - MASTERCARD only, never VISA (pitfall #3)
  - `mainNextPayDate` required in sendApplication body (pitfall #63)

---

### CT-02 - Kornerstone parity: CC required ON, Bank Validation OFF, fee > 0 -> exactly 1 submitApplication call [P0]

- **Technique:** Equivalence partitioning (same valid class, different brand partition)
- **Persona:** Customer on Website portal, completing lease at Kornerstone merchant
- **Brand:** Kornerstone (5th Ave Furniture NY / KS3015, state NY)
- **Setup:**
  1. `buildTestData({ state: 'NY', merchant: 'FifthAveFurnitureNY', orderTotal: '1500' })` - KS3015 has `isCcRequired=true`, bank data is required by KS wizard (pitfall #5)
  2. `ensureMerchantReady('FifthAveFurnitureNY')` with Kornerstone contract
  3. `sendApplication` with bank data included in body (Kornerstone requires it)
  4. Extract `shortCode`, `planId` from `redirectUrl`
  5. `getMissingFields(shortCode, { planId })` -> confirm `feeToBeCharged > 0`
- **Steps:** Same as CT-01 (attach listener, navigate, fill CC, submit, count calls)
  - NOTE: KS Complete page may also show bank fields. Fill with `TEST_BANK` defaults if required by the form.
- **Validations:** Same as CT-01 (network count=1, DB status, activity log)
- **Edge cases covered:** Kornerstone brand uses different merchant config (webhook, holdDeposit), different `ref_merchant_code` prefix (KS*). Confirms fix is brand-agnostic.
- **Pitfalls considered:**
  - KS requires bank routing/account/CC BIN fields on wizard page 2 (pitfall `reference_kornerstone_wizard_bank_fields_required`)
  - KS brand resolved by `ref_merchant_code` prefix KS* (memory `reference_kornerstone_brand_by_ref_code`)

---

### CT-03 - CC pre-auth failure: 0 submitApplication calls, button re-enables, retry succeeds with exactly 1 call [P1]

- **Technique:** Boundary value analysis (error boundary) + State transition (error -> retry -> success)
- **Persona:** Customer on Website portal, enters invalid CC, then corrects and retries
- **Brand:** UOWN (TireAgent, state NY)
- **Setup:** Same as CT-01 steps 1-5
- **Steps:**
  1. Attach request listener for `/submitApplication`
  2. Navigate to Complete page
  3. Wait for form loaded
  4. Fill CC info with `TEST_CARDS.VISA_DECLINED` or invalid card number (a card that will fail pre-auth)
  5. Click Submit button
  6. Wait for error indication (toast message or inline error)
  7. Assert: `submitCalls.length === 0` - no `submitApplication` fired on pre-auth failure
  8. Assert: Submit button is re-enabled (not stuck in disabled state)
  9. Clear CC fields, fill with `TEST_CARDS.MASTERCARD_APPROVED`
  10. Click Submit again
  11. Wait for success
  12. Assert: `submitCalls.length === 1` - exactly 1 call after correction
- **Validations:**
  - Network: 0 calls after failed pre-auth, 1 call after successful retry
  - UI: Error toast/message visible after step 6
  - UI: Submit button re-enabled after error (Requirement #4 - Formik submit behavior)
  - DB: Lead status unchanged after failed pre-auth; transitions after successful retry [reflex]
  - DB/Activity log: no spurious submission entries from the failed attempt [reflex]
- **Edge cases covered:** Single-flight guard must reset after failed pre-auth so retry is possible
- **Pitfalls considered:**
  - Need a test card that fails pre-auth but does not crash the form. Check `TEST_CARDS` for a declined card constant. If none exists, use a known-bad card number (4111111111111112 or similar).
  - Formik's `isSubmitting` state must properly reset on error - the fix must not leave it stuck.

---

### CT-04 - Rapid double-click: single-flight guard prevents duplicate calls [P1]

- **Technique:** Error guessing (race condition) + Use case (impatient user double-clicks)
- **Persona:** Customer on Website portal, impatient, clicks Submit twice rapidly
- **Brand:** UOWN (TireAgent, state NY)
- **Setup:** Same as CT-01 steps 1-5
- **Steps:**
  1. Attach request listener for `/submitApplication`
  2. Navigate to Complete page, wait for form loaded
  3. Fill CC info with `TEST_CARDS.MASTERCARD_APPROVED`
  4. Rapid double-click Submit button: `await submitBtn.dblclick()` or `await submitBtn.click(); await submitBtn.click({ force: true });`
  5. Wait for submit to complete
  6. Assert: `submitCalls.length === 1` - guard prevented second call
- **Validations:**
  - Network: exactly 1 `submitApplication` request despite double-click
  - UI: Submit button disabled after first click (prevents natural re-click)
  - DB: single submission log entry, correct final status [reflex]
- **Edge cases covered:** The useRef guard (Requirement #3) specifically prevents re-entry while submit is in-progress. Double-click is the most common real-world trigger.
- **Pitfalls considered:**
  - `dblclick()` in Playwright fires two click events in rapid succession - this is the exact simulation needed
  - If the button disables via React state (Formik `isSubmitting`), the second click may be naturally blocked. The guard (useRef) is the backup for when React state update is async and the second click sneaks through.

---

### CT-05 - Regression R1: CC + Bank Validation ON + fee > 0 -> exactly 1 submit [P2, deferred]

- **Technique:** Equivalence partitioning (different config partition)
- **Persona:** Customer, merchant requires bank validation
- **Brand:** UOWN
- **Setup:** Requires a merchant with `isBankVerificationRequired=true` OR toggle TireAgent's config. Alternatively, use a merchant config that enables bank validation.
- **Steps:** Fill both CC + bank info, submit, count calls
- **Validations:** Network count=1, DB status, activity log
- **Note:** Deferred to P2. The single-flight guard is at the component level and does not depend on bank validation being on/off. CT-01 covers the core guard.

---

### CT-06 - Regression R2: CC + Bank Validation OFF + fee = 0 -> exactly 1 submit [P2, deferred]

- **Technique:** Boundary value analysis (fee=0 boundary)
- **Persona:** Customer, merchant does not charge processing fee
- **Brand:** UOWN
- **Setup:** Requires a merchant with `chargeProcessingFee=false` OR a state/program combo where fee calculates to 0.
- **Steps:** Fill CC (no fee displayed), submit, count calls
- **Validations:** Network count=1, no fee displayed on page, DB status, activity log
- **Note:** Deferred to P2. Fee=0 means the CC pre-auth fee branch is skipped entirely - this was NOT the buggy path. Lower risk.

---

### CT-07 - Regression R4: ACH-only + Bank Validation ON -> exactly 1 submit [P2, deferred]

- **Technique:** Equivalence partitioning (ACH-only payment mode)
- **Persona:** Customer, ACH-only merchant
- **Brand:** UOWN
- **Setup:** Requires a merchant with `isCcRequired=false` AND `isAchRequired=true` AND `isBankVerificationRequired=true`. This is an unusual config. Verify availability.
- **Steps:** Fill bank info only, submit, count calls
- **Validations:** Network count=1, DB status, activity log
- **Note:** Deferred to P2. ACH-only is a different code path from the CC path that had the bug. The single-flight guard covers all paths, so this is confirmation-level, not discovery-level.

---

## Test Design - Decision Table (submitApplication call count)

The core assertion across all scenarios is the count of `submitApplication` network requests. The decision table shows which conditions produce which count:

| # | CC Required | Bank Validation | Fee > 0 | CC Pre-auth | Expected submitApplication calls | Expected Status |
|---|-------------|-----------------|---------|-------------|----------------------------------|-----------------|
| CT-01 | ON | OFF | YES | SUCCESS | 1 | CC_AUTH_PASSED |
| CT-02 | ON (KS) | OFF | YES | SUCCESS | 1 | CC_AUTH_PASSED |
| CT-03a | ON | OFF | YES | FAIL | 0 | unchanged |
| CT-03b | ON | OFF | YES | SUCCESS (retry) | 1 | CC_AUTH_PASSED |
| CT-04 | ON | OFF | YES | SUCCESS (dblclick) | 1 | CC_AUTH_PASSED |
| CT-05 | ON | ON | YES | SUCCESS | 1 | CC_AUTH_PASSED |
| CT-06 | ON | OFF | NO | SUCCESS | 1 | CC_AUTH_PASSED |
| CT-07 | OFF (ACH) | ON | N/A | N/A | 1 | CC_AUTH_PASSED |

---

## Required Artifacts

### Existing (reuse):

| Artifact | Path | Purpose |
|----------|------|---------|
| `MissingDataFormPage` | `src/pages/origination/missing-data-form.page.ts` | Complete page form interactions (fill CC, fill bank, submit, fee detection) |
| `ApplicationClient` | `src/api/clients/application.client.ts` | `sendApplication`, `getMissingFields`, `submitApplication` |
| `buildTestData` | `src/helpers/test-data.helpers.ts` | Fresh test data generation |
| `createPreQualifiedApplication` | `src/helpers/api-setup.helpers.ts` | API setup with merchant preflight |
| `TEST_CARDS` | `src/config/constants.ts` or `src/data/test-cards.ts` | MASTERCARD_APPROVED, declined cards |
| `TEST_BANK` | `src/config/constants.ts` | Default bank routing/account |
| `DatabaseHelpers` | `src/helpers/database.helpers.ts` | `waitForRecord`, `getSingleRow` |

### New (to be created by qa-implementer):

| Artifact | Purpose | Notes |
|----------|---------|-------|
| Network request counter helper | Reusable function to attach `page.on('request')` listener, filter by URL pattern, return count and captured requests | Pattern exists in codebase (`tests/e2e/origination/simple-search-ui.spec.ts:310-315`). New helper should generalize this. Suggested location: `src/helpers/network-spy.helpers.ts` or inline in test if scope is narrow. |
| Test spec file | `docs/taskTestingUown/fixDuplicateSubmitApplication_1285/RU05.26.1.52.0_fixDuplicateSubmitApplicationCalls_1285.spec.ts` | Task test following naming convention |

### Page object gaps:

- `MissingDataFormPage` already has `fillCreditCard`, `fillBankAccount`, `fillAndSubmit`, `isProcessingFeeDisplayed`, `getProcessingFeeAmount`. Should be sufficient.
- No new page object needed. The Complete page is already modeled.
- **Note for implementer:** the Submit button in `MissingDataFormPage` is `#completeApplication-submit`. Verify via MCP/DOM inspection that this is still the correct selector post-MR !1447. The fix may have wrapped the button or changed the click handler chain.

---

## Test Data Requirements

| Data | Source | Notes |
|------|--------|-------|
| Unique email per CT | `buildTestData()` with `generateUniqueEmail()` | Rule #9 - fresh data per test |
| SSN (approved) | `generateTestSSN()` not ending in 9 | SSN ending in 9 = DENIED |
| CC (approved) | `TEST_CARDS.MASTERCARD_APPROVED` | BIN 5500; NEVER VISA (pitfall #3) |
| CC (declined) | `TEST_CARDS.VISA_DECLINED` or known-bad number | For CT-03; verify constant exists |
| Bank data | `TEST_BANK.DEFAULT_ROUTING`, `DEFAULT_ACCOUNT` | For KS (CT-02) and if bank validation ON |
| Merchant (UOWN) | TireAgent (`OW90218-0001`) | `isCcRequired=true`, `chargeProcessingFee=true`, `isBankVerificationRequired=false` |
| Merchant (KS) | 5th Ave Furniture NY (`KS3015`) | Kornerstone brand; available in all envs |
| State | NY | Both TireAgent and KS3015 support NY |
| Order total | $1500 | Sufficient for approval; produces non-zero fee |

---

## Out-of-scope Decisions

| Item | Why excluded |
|------|-------------|
| Lease-edit re-submit | useRef guard resets on component remount (invoice edit triggers remount). Risk is architectural, not behavioral. Defer to P2. |
| Mobile viewport | Bug is JS control flow, not CSS/layout. Same behavior on all viewports. |
| Cross-browser | React useRef is cross-browser standard. Chromium sufficient. |
| Signing flow post-submit | Not touched by MR !1447. Covered by existing unified-flow regression. |
| Daniel's Jewelers (CA) | INSTORE merchant with different e-sign routing. The duplicate-submit bug is independent of e-sign routing. TireAgent + KS3015 provide sufficient brand coverage. |
| R5 (CC+ACH both required, fee>0) | Superset of primary path. Guard is component-level. Covered implicitly. |
| R6 (CC+ACH, only CC filled) | Edge of R5. Same rationale. |

---

## Implementation Notes for qa-implementer

1. **Network spy pattern:** Use `page.on('request', listener)` and `page.off('request', listener)` bracketing. The listener should filter by: (a) URL contains `/submitApplication`, (b) method is POST. Capture full request objects for debugging. See existing pattern at `tests/e2e/origination/simple-search-ui.spec.ts:310-330`.

2. **Timing of listener attachment:** Attach the listener BEFORE any button click. The request fires asynchronously after the click and React state update. If listener is attached after click, it may miss the request.

3. **Waiting for completion:** After clicking Submit, need to wait for the submit to resolve. Options:
   - `page.waitForResponse(resp => resp.url().includes('/submitApplication'))` for the success case
   - `page.waitForTimeout(5000)` as fallback (anti-pattern but may be needed if no clear UI indicator)
   - Better: wait for UI state change (confirmation text, redirect, or toast)

4. **Double-click simulation (CT-04):** `dblclick()` fires mousedown-mouseup-click-mousedown-mouseup-click-dblclick event sequence. If the button disables on first click (React `isSubmitting`), the second click may be blocked by the DOM. To truly test the useRef guard (not the disabled state), consider: `submitBtn.click(); submitBtn.click({ force: true, delay: 50 });` which bypasses the disabled check.

5. **Project tag:** Use `@origination` tag since the Complete page is served from the origination domain (`secure-{env}.uownleasing.com`). The Website portal login is NOT needed for the Complete page - it is a public URL accessed via `redirectUrl`. Verify which Playwright project config matches this URL.

6. **Fee verification:** Before asserting the fix, verify that `getMissingFields` response contains `feeToBeCharged > 0`. If fee is 0, the test is in the wrong code path and CT-01 would be invalid.

7. **Declined card for CT-03:** Check `src/data/test-cards.ts` or `src/config/constants.ts` for a declined card constant. If none exists, use a known Mastercard test number that triggers decline (e.g., `5100000000000016` or check Tilled/Repay sandbox documentation for declined BINs). Do NOT use VISA even for the declined case (pitfall #3 applies to all CC operations in qa).

---

## Open Questions

- Q1: [ASSUMPTION] TireAgent in qa1 has `chargeProcessingFee=true` and `isBankVerificationRequired=false`. This matches `merchant-config-contract.ts`. If config has drifted, preflight auto-heal will fix it. Marking as assumption, not blocker.
- Q2: [ASSUMPTION] `getMissingFields` response for TireAgent/NY with orderTotal=1500 will return `feeToBeCharged > 0`. If fee is 0, need to identify a merchant/state/amount combo that produces fee > 0. The manual QA report used TireAgent and Daniel's Jewelers - both presumably had fee > 0.
- Q3: Is there a `TEST_CARDS` constant for a declined Mastercard? If not, implementer will need to identify one or add it to `src/data/test-cards.ts`.
- Q4: The Complete page URL (`secure-{env}.uownleasing.com/{shortCode}/complete`) - which Playwright project maps to this domain? It is the origination-hosted consumer form, not the Website portal per se. Verify `playwright.config.ts` project base URLs.
- Q5: After the fix (MR !1447), does the Submit button visually show a loading/spinner state during submission? If so, this provides a natural UI oracle for "submission in progress." Implementer should verify via DOM inspection.

---

## DoR Status

- [x] Description: clear problem statement + solution approach
- [x] AC explicit: 5 requirements listed in task description
- [x] Edge cases: mapped via Fernando's testing steps (R1-R6)
- [x] Build deployed: qa1 (manual QA passed 2026-05-14)
- [x] Dependencies: none external (pure frontend fix)
- [x] Dev tested: Fernando provided detailed testing steps
- [x] Scope changes: none
- [x] T-shirt size: **M** (4 mandatory scenarios, API setup + UI exercise + network interception)

## DoD Anticipated

- [x] AC tested in QA (qa1)
- [ ] AC tested in Staging (stg) - required for DoD closure
- [x] Edge cases covered (P0+P1)
- [x] Regression scenarios defined (P2 deferred with justification)
- [ ] Evidence planned: network request count logs + DB query results + screenshots

---

Ready for: **qa-implementer**

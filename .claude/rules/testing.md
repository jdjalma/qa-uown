---
paths:
  - "tests/**/*.ts"
---

# Test Rules

## Naming Convention (task tests from GitLab issues)

```
Pattern:   {milestone}_{camelCaseTitle}
Example:   R1.49.1_separateShortCodeInANewEntity
Location:  docs/taskTestingUown/{testName}/{testName}.spec.ts
Project:   task-testing-origination  OR  task-testing-servicing  (tag-selected — see below)
```

> Test/dir names carry the milestone + a descriptive camelCase title only — **do not append the GitLab task number** (task IDs are not committed). Track the source task in your tracker, not in the filename.

Non-task tests: `tests/e2e/{portal}/` or `tests/api/`

### task-testing project split — MANDATORY tag (discovered 2026-05-24)

The `task-testing` project was split into `task-testing-origination` and `task-testing-servicing` to avoid a `storageState`/`baseURL` mismatch when a spec covers both portals.

**Rule:** every spec in `docs/taskTestingUown/` MUST declare `@origination` OR `@servicing` in the `tag` field of `testData`:

```typescript
const testData = [{
  env: 'qa1',
  tag: '@origination',   // selects task-testing-origination (Origination baseURL + storageState)
  // or
  tag: '@servicing',    // selects task-testing-servicing (Servicing baseURL + storageState)
}];
```

If a spec uses BOTH portals: separate the CTs that access Origination (tag `@origination`) from those that access Servicing (tag `@servicing`) — never mix them in the same CT. Without this tag, Playwright selects the wrong project and the loaded page does not match the expected portal. See [[application-lifecycle]] pitfall #61.

## Mandatory Principles

1. **Independence**: Every test creates its own data — no shared state between tests
2. **DRY**: Reusable logic in helpers or page objects — never duplicate
3. **Own setup**: Tests call API to create preconditions — see § Test Data Hierarchy below
4. **Implicit cleanup**: Use unique `runId` + `email` — no manual teardown needed
5. **Tags**: `@smoke`/`@sanity`/`@regression` + `@critical` when applicable — use `TestTag` enum
6. **UI-first** (CLAUDE.md inviolable rule #15): default UI; API only when feature has no UI affordance — see § UI-First Principle below

## UI-First Principle (MANDATORY — CLAUDE.md rule #15)

> **Inviolable rule:** if the feature has a user flow in the portal, the test MUST exercise that flow via the browser. API-only is a restricted EXCEPTION.

### When UI is mandatory

- Feature has a screen or user interaction (Origination/Servicing/Website/AMS/Merchant portal)
- Visual validation: rendered placeholders, badges, iframe content (GowSign/SignWell), generated PDFs, formatted emails
- Customer-facing flow: completeApplication, signing, payment, refund, support actions

### When API-only is acceptable (EXCEPTIONS)

- **Admin/ops endpoints with no UI:** `PATCH /uown/svc/gowsign-templates/{id}`, `triggerScheduledTask`, `resumeScheduledTask`, internal CRUD
- **Setup/precondition:** speeding up the test by creating a lead via `sendApplication` before exercising the UI signing flow
- **Cross-cutting DB validation:** assertion queries over persisted rows (status transition, log presence)
- **API-only with explicit justification in the spec** when the feature's result is ONLY observable via API (e.g., webhooks, response payloads)

### What CANNOT be replaced by API

- **Rendered content** (PDF, email body, iframe content): a rendering bug is only detectable visually. Reading a backend log ≠ confirming that the user sees the correct value
- **Brand/styling** (logos, colors, footers): requires visual inspection
- **Fluid interaction** (modal opens, redirect works, click changes state): UI behavior

### Origin of the rule

2026-05-06 — BUG-01 (empty `{{securityDeposit}}`/`{{costPriceWithFeeNoTax}}` placeholders in legal documents) was discovered **manually by Fernando** because the API-only automated tests only read the backend log (`[DocumentDispatchService][GowSign] missing N tokens`) without rendering the PDF. UI-driven tests would have failed visibly in the GowSign iframe — the bug would have been caught in CI before any manual tester.

### Checklist for spec-test / impl-e2e / impl-api

Before marking a test as done:

- [ ] Does the feature have UI? If so, does the test exercise the flow via the browser?
- [ ] Do visual validations (PDF rendering, iframe content, badges) use a page object + assertions over the DOM/PDF, not just logs?
- [ ] If the test is API-only, does the spec/comment explicitly JUSTIFY why UI is not viable?
- [ ] If an API helper was chosen to speed up setup, does the spec make clear which part of the flow is still UI (e.g., "create lead via API → sign via UI")?

### Anti-patterns

```
❌ "API-only is faster" — without justifying the loss of visual coverage
❌ Validating a rendering bug via a backend log (`expect(notes).not.toContain('missing'))`)
❌ Skipping the GowSign/SignWell iframe because "it's flaky"
❌ Setup via API + assert via API when the user interacts via UI in the real flow
```

```
✅ Setup via API (create lead in CC_AUTH_PASSED) + UI completes the rest (signing iframe, download)
✅ API-only for PATCH /admin endpoints (no UI exposed) with a justifying comment
✅ Hybrid: drive the lead fully via UI when the defect being hunted may be UI/render-related
```

## Application Lifecycle Protocol (MANDATORY when feature creates applications)

> **Inviolable rule:** any test involving `sendApplication` MUST follow the canonical sequence documented in the [[application-lifecycle]] skill. Known violations cause recurring silly failures (DENIED, 400, 500, timeouts).
>
> Agents that create tests OR debug (`qa-planner`, `qa-implementer`, `qa-debugger`) MUST load this protocol before writing/fixing code.

**Quick checklist (details in the protocol):**

- [ ] `buildTestData` without `emailOverride` (unique email per run — avoids DataMismatchStep)
- [ ] Kornerstone merchant → `bankData` in the sendApplication body
- [ ] `submitApplication` always preceded by `getMissingFields(shortCode, { planId })` **and `submitResp.ok` asserted explicitly** (silent failure → lead stuck in `CC_AUTH_PASSED` → `settleApplication` 500; see [[application-lifecycle]] pitfall #81)
- [ ] CC: `TEST_CARDS.MASTERCARD_APPROVED` (never VISA_APPROVED — rollback in qa)
- [ ] Order: `SIGNED → settle → FUNDING → FUNDED → ACTIVE`
- [ ] SETTLED_IN_FULL via `makeCreditCardPayments(SETTLEMENT)` — never a direct UPDATE (no payment history → email template fails)

## E-sign Provider Routing — By Template Availability

> **Rule (qa2, confirmed by dev 2026-04-28):** the e-sign provider is determined by the **availability of a GowSign template for the lead's state**, NOT by a global flag on the merchant.
>
> **Observed behavior:**
> - A GowSign template exists for the state → `uown_esign_document.client = 'GOWSIGN'`
> - No GowSign template exists for the state → fallback to `merchant.esign_client` (default `SIGNWELL`)
>
> **States with a GowSign template in qa2 (2026-04-28):** only **CA**. All others fall back to Signwell.
>
> **🔄 SUPERSEDED (2026-06-21):** GowSign templates were rolled out to MORE states since April. Live-proven: TerraceFinance (`OL90202-0001`, ONLINE) with **customer state NY** signs via **GowSign** (`uown_esign_document.client='GOWSIGN'`, status SIGNED via `[EsignRedirectService][updateSignStatus]` + `[ContractService][isLeaseOrLeaseModSigned]`), NOT the Signwell fallback. → **Do NOT assume `state != 'CA' → Signwell`**; check the real `uown_esign_document.client` for the target state/env before choosing a merchant for GowSign vs Signwell coverage. Note: during the GowSign ceremony, `signGowSignInFrame` logs `completedMessage=false` (the "completed" postMessage was not captured) but the backend STILL transitions to SIGNED via redirect — **this is not a failure**. See [[volatile-knowledge-registry]] (GowSign state-routing drift).
>
> **⚠️ INSTORE merchant exception (discovered 2026-05-06):** for merchants with `merchant_type='INSTORE'`, the backend uses `merchant.state` (the physical store's state) instead of the customer state for the template lookup. Verified in `EsignService.loadLeadEsignContext()` lines 194-197 (svc R1.51.1):
>
> ```java
> if (merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE) {
>     state = merchant.getMerchantInfo().getState();
> }
> ```
>
> **Implications:**
> - Daniel's Jewelers (`OL90205-0079*`, INSTORE, state=CA) → ALWAYS routes by CA, regardless of customer state
> - Saslow's Jewelers CA (`OW90337-0001`, INSTORE, state=NC) → ALWAYS routes by NC, regardless of customer state → SIGNWELL fallback
> - TireAgent (`OW90218-0001`, ONLINE, state=CA) → uses customer state (normal behavior)
>
> **How to find merchant_type:** `SELECT pk, ref_merchant_code, merchant_type, state FROM uown_merchant WHERE ref_merchant_code = $1`. INSTORE in qa2 = 34 merchants (1.5k ONLINE).
>
> **For state-parametrized tests:** validate `merchant.merchant_type` BEFORE assuming that customer state determines routing — INSTORE merchants ignore customer state. Do not use an INSTORE merchant for multi-state coverage of GowSign vs SignWell routing.
>
> **Empirical evidence — TireAgent (OW90218-0001) qa2:**
> - leads CA 15741–15745, 15748+ → GOWSIGN
> - leads CO 15746–15747 → SIGNWELL
> - `uown_merchant.pk=34.esign_client = 'SIGNWELL'` (same value during both waves)
>
> **Implications for tests:**
> - Test for **GowSign signing** → `state: 'CA'` (the only state with a template until the new rollout)
> - Test for **Signwell signing** → any valid state `≠ CA`
> - Test for **Protection Plan** + **GowSign** simultaneously → blocked in qa2 while:
>   - (a) CA does not offer PP (lease log "Protection plan was not offered" — CA regulatory/legal restriction, not a bug)
>   - (b) The other states where PP works fall back to Signwell (no GowSign template)
> - When the product team rolls out GowSign templates to other states, **re-validate this rule** and update it with an evidence lead_pk

## Buddy Insurance Widget — Known Loop in qa2 STAGING

> **Active bug (origination/components/purchase-insurance/index.tsx:107-127):** In qa2, the `BuddyOfferElement` loads from `staging.embed.buddy.insure`, which tries to send analytics to `aggregate-analytics.netlify.app/api/send` — an endpoint without `Access-Control-Allow-Origin` → CORS error. It can corrupt the `offerElementResponse`, making `utilityStore.createProtectionPlan` fail.
>
> **Symptom:** opt-in/opt-out is clicked → submit "swallows" with no visible feedback → the user thinks they were returned to Terms. The frontend only unblocks on the 3rd consecutive click (`if (submitFailCount > 1)`).
>
> **How to apply it in automated tests:**
> - A test that needs to go through the Buddy widget in qa2 should account for up to 3 clicks on the Submit button before assuming a timeout failure
> - `TermsOfAgreementPage.acceptAndProceedWithProtectionPlan(true)` may need a retry in qa2; in qa1 it works directly (Buddy does not fail)
> - Reported to dev on 2026-04-28; until it is fixed, mark Buddy-dependent tests as `@flaky-tracked` if they run in qa2

## Activity Log Validation (MANDATORY — every business action)

> **Inviolable rule (CLAUDE.md #14):** *"If there is no activity log, that means nothing is happening."* — Priyanka Namburu, daily UOWN 2026-04-28.
>
> Every business action executed by the test MUST have an explicit validation of the generated activity log/note. Absence of a log = implementation failure, not expected behavior.

### What counts as a "business action"

Triggered one of these? → You need to validate the log:

- `sendApplication` / `submitApplication`
- Signing event (SignWell, GoSign, redirect, webhook callback)
- Payment attempt (CC, ACH, PayNearMe, Sticky retry)
- Refund (full/partial, CC/ACH)
- Recovery attempt (Sticky webhook received)
- Lease/account status transition (UW_APPROVED → SIGNED → SETTLED → FUNDING → FUNDED, etc.)
- Vendor callback (any webhook received from an external provider)
- Mutation via SVC (email sent, SMS, billing link, opt-out)

### How to validate

Every phase of the pipeline must apply:

**Planning (`qa-planner`)**
- Each scenario lists the expected log(s) in the "Validations" section
- Format: `uown_los_lead_notes` (or the domain-specific table) — text pattern + chronological order

**Implementation (`qa-implementer`)**
- `test.step('validate activity log', ...)` after each business action
- Use `db.waitForRecord` / `db.getSingleRow` querying `uown_los_lead_notes WHERE lead_pk = $1 ORDER BY pk DESC` (or the corresponding table)
- Assert the presence of the expected pattern + assert the absence of negative patterns when relevant (`"not offered"`, `"rejected"`, `"skipped"`, `"denied"`)

**Result validation (`qa-validator`)**
- The report MUST list the captured log per step (cite PK + text)
- A step with no captured log → mark as `[INCOMPLETE]`, not `[OK]`

**Debug (`qa-debugger`)**
- Before hypothesizing, read the lease logs (rule below). If the expected action has no log → backend bug (report it) or the step did not fire (fix it).

### Minimum assert patterns

```typescript
// After sendApplication
await test.step('activity log: application submitted', async () => {
  const note = await db.waitForRecord(
    `SELECT pk, notes FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND notes ILIKE '%application%submitted%'
     ORDER BY pk DESC LIMIT 1`,
    [ctx.leadPk],
  );
  expect(note, 'application submission log must be present').toBeTruthy();
});

// After signing event
await test.step('activity log: contract signed', async () => {
  const note = await db.waitForRecord(
    `SELECT pk, notes FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND notes ILIKE '%[ContractService]%signed%'
     ORDER BY pk DESC LIMIT 1`,
    [ctx.leadPk],
  );
  expect(note).toBeTruthy();
});
```

### When the log is NOT generated

If the backend does not record a log for an action that should — this is a product bug, not a test bug:

1. Document it in `[ContractService][...]` or the corresponding domain as a gap
2. Open a ticket for dev to add the log
3. Mark the validation step as `@blocked-by-missing-log` in the code comment
4. Do NOT remove the assert. Do NOT mark the test as passed. Wait for dev to add the log.

### Exception (the only one)

Purely read-only steps (GET, SELECT query, UI lookup without mutation) do not need to validate a log — they do not generate a business action.

## Debugging an Error/Divergence in Creation or Signing — Inspect the Lease Logs BEFORE Hypothesizing

> **Inviolable rule:** when an application-creation or signing test fails/diverges from the expected, the **FIRST ACTION** is to open the created lease/account and read the logs/notes in the DB (`uown_los_lead_notes` ordered by `pk`) or in the Servicing portal (Activity tab). Do NOT hypothesize or refactor before reading the log.
>
> **Why:** the backend already records the root cause in plain text with an EST timestamp. Real examples that saved hours:
> - "Protection plan was not offered" → revealed a state-based block (CA), not a merchant flag
> - "DataMismatchStep" → revealed a duplicate email across runs
> - "[ContractService][isLeaseOrLeaseModSigned]" → confirmed the signing route (Webhook vs EsignRedirectService)
>
> **How to apply it:**
> - Failure in `sendApplication`/`submitApplication`/signing → query `SELECT pk, notes FROM uown_los_lead_notes WHERE lead_pk = $1 ORDER BY pk` and read the last 30
> - Missing behavior (PP not created, contract not signed, status did not progress) → same query, look for negations: "not offered", "rejected", "blocked", "denied", "skipped"
> - Cite the log in the conversation before proposing a solution. If there is no log, cite that explicitly
> - Document the discovered cause as a new rule (blocked state, mandatory flag, call order) — feed `application-lifecycle-protocol.md § Pitfalls`

## Test Data Hierarchy (MANDATORY — all levels: spec / implementation / orchestration / direct analysis)

> **Creating fresh data is the DEFAULT. Reusing existing records is the EXCEPTION, with justification.**
> This rule is not optional and applies to spec-test, impl-e2e, impl-api, validate-results,
> debug-flaky, the qa-flow command, and direct analyses. Violating this hierarchy was the root
> cause of 4 hours wasted on pipeline #491 investigating a "bug" that was merely an
> artifact of an old fixture.

**Preference (from most to least preferred):**

1. ✅ **Create a NEW account/lead via automation (full happy path)** — DEFAULT. Use
   `driveLeadToFunding`, `buildTestData`, `sendApplication` + `submitApplication` + `changeLeadStatus`
   chained together. Advantages: predictable data, clean state, reproducible test, independent.

2. ⚠️ **Create via automation + mutate via the official API** (e.g., `SvcEmailClient.createOrUpdateEmail`
   to change the primary email after funding) — acceptable when the API mutation is faster
   than redoing the full flow. Always document the reason in a short comment.

3. 🚨 **Use an existing account/lead (pre-existing fixture)** — EXCEPTION. Accepted ONLY if:
   - The test is a documented GDS bypass (already without application data), OR
   - Setup via automation would take > 10 min per CT (unacceptable cost), OR
   - The fixture is impossible to create via automation (e.g., a system-computed rating
     requires a real payment history).

   Even in the exception: it requires a **comment in the spec** justifying it, AND requires a **reproduction
   in a fresh account** BEFORE classifying any behavior as a bug (see
   the [[bug-classification]] skill).

4. ❌ **Direct UPDATE in the DB on an existing account** — FORBIDDEN by default (CLAUDE.md
   Exception 3). Accepted only with explicit user authorization recorded in the
   conversation. Even when authorized, it is the last resort — always prefer to reproduce via
   automation first.

### Why

Pre-existing data brings unpredictable inherited state:
- Artifacts from previous pipelines/runs
- Data bugs already known (or not) to other tasks
- Historical race conditions that do not reflect the current code
- Inconsistent state produced by manual fixes

Fresh data proves the behavior of the **code**, not the **database**. It is reproducible,
reliable, and eliminates false positives.

### Enforcement checklist

Apply at every phase of the pipeline:

- [ ] Does the spec set up via API/automation (no hardcoded PK)?
- [ ] Does the implementation create fresh data via `buildTestData` / `sendApplication` / etc.?
- [ ] Does the report's evidence mark `Created` (not `Existing`) as the default?
- [ ] If reusing an existing account: does a code comment justify it + did a fresh reproduction validate the behavior?
- [ ] If a direct DB UPDATE: is the user's authorization recorded in the conversation?

If any answer is NO → **violation**. Go back to the corresponding phase and fix it
before proceeding.

### See also

- the [[bug-classification]] skill — rules for classifying
  behavior as a bug (requires a fresh reproduction).

## Lease State Machine

```
UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

- SSN not ending in 9 → `UW_APPROVED`
- SSN ending in 9 → `UW_DENIED`
- Contract URL: `sendApplication` → `paymentDetailsList[idx].redirectUrl`
- E-sign: auto-detects PandaDocs vs Signwell via iframe polling
- Refund: `FUNDED → REQUEST_REFUND → REFUNDED` (UI only via PayTomorrow portal)

## Risk Tier Selection (when test creates applications)

| Tier | SSN | State | Merchant | Amount | Expected |
|------|-----|-------|----------|--------|----------|
| low | ≠9 | CA, CO, FL | TerraceFinance | $800–$1.500 | FUNDED |
| high (denied) | =9 | any | any | any | UW_DENIED |
| blocked-state | ≠9 | NJ, VT, MN, ME | ONLINE merchant | any | DENIED |

## testData Structure

```typescript
const testData = [{
  env: 'sandbox',
  riskTier: 'low',
  state: 'CA',
  merchant: 'TerraceFinance',
  merchandiseAmount: 1000,
  runId: generateRunId(),
  email: generateUniqueEmail(),
  tag: '@cicd @sandbox',
}];
```

## Anti-Patterns

```
❌ page.waitForTimeout() — use .waitFor({ state: 'visible' }) or db.waitForRecord()
❌ await sleep(N) as a conditional wait (while/for loop that checks DB/state) — re-implements pollUntil/waitForRecord; sleep() is the SAME anti-pattern as waitForTimeout, it just dodges by name. Helper: pollUntil (@helpers/index.js) / db.waitForRecord / locator.waitFor. Bare sleep() only for a documented external-propagation delay + comment. See [[db-polling-pattern]] pitfall #8
❌ Assertions in page objects — assert in test, return values from page objects
❌ Import from @playwright/test directly — use @support/base-test or @fixtures/test-context.fixture
❌ Importing a runtime helper via its individual module (@helpers/foo.helpers.js) — use the barrel @helpers/index.js (only import type may target the module)
❌ ctx shared across tests — ctx is per-test only
❌ Relative imports (../../../src/...) — always use path aliases (@support/base-test.js, @config/constants.js, etc.)
❌ Inline locator in a spec that duplicates a page object method — Grep src/pages/{portal}/ first; if a method exists, call it; see [[selector-hardening]]
❌ body as never casts — use the correct typed builder (buildSendApplicationBody, buildSubmitApplicationBody) instead
```

## Definition of Done

- `tsc --noEmit` passes
- `test.step()` wraps every logical action
- `testData` has `env`, `tag`, `runId`, `email` (see note below)
- Selectors use `SELECTORS` constant
- `ctx` used for cross-step state

## testData — runId and email

The standard `testData` pattern MUST include `runId` and `email` for test isolation:

```typescript
const testData = [{
  env: 'sandbox',
  runId: generateRunId(),
  email: generateUniqueEmail(),
  tag: '@cicd @sandbox',
}];
```

**Exception:** Tests that use `existingAccountPks` (GDS bypass, no new application created) may omit `runId`/`email` since no application data is generated. Document this explicitly in a comment:

```typescript
const testData = [{
  env: 'qa1',
  // GDS bypass: pre-seeded account PKs, no application created → runId/email not needed
  existingAccountPks: ['4442', '4439'],
  tag: '@qa1',
}];
```

Note this as a deviation from the standard pattern in a comment — do not silently omit the fields.

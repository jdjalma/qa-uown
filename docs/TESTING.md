# Testing Guide

## Test Categories

### API Tests (`tests/api/`)

Pure API tests that do not require a browser. These test the backend REST API directly using Playwright's `request` context.

**Run:** `npm run test:api`

**Import fixture:**
```typescript
import { test, expect } from '../../src/fixtures/test-context.fixture.js';
```

**Using typed API clients:**
```typescript
import { ApplicationClient } from '../../src/api/clients/application.client.js';
import type { MerchantInfo, ApplicantInfo, OrderInfo } from '../../src/api/bodies/application.body.js';

test('send application', async ({ request }) => {
  const env = new ConfigEnvironment('sandbox');
  const client = new ApplicationClient(request, env);

  const merchant: MerchantInfo = { username: '...', password: '...', number: '...' };
  const applicant: ApplicantInfo = { firstName: '...', /* ... */ };
  const order: OrderInfo = { orderTotal: '6000', description: 'Test' };

  const response = await client.sendApplication(merchant, applicant, order);
  expect(response.ok).toBeTruthy();
  expect(response.body.leadUuid).toBeDefined();
});
```

### E2E Tests (`tests/e2e/`)

Browser-based tests that interact with the UOWN portals.

**Run:** `npm run test:origination`, `npm run test:servicing`, etc.

**Import fixture (with hooks):**
```typescript
import { test, expect } from '../../../src/support/base-test.js';
```

The `base-test` fixture automatically provides:
- CSS animation disabling (faster, less flaky)
- Screenshot on failure (attached to report)
- Console log capture (via `consoleLogs` fixture)
- Test metadata attachment
- All API clients and DB helpers

### Hybrid Tests

Tests that combine API calls and browser interaction (e.g., create account via API, then verify in UI).

```typescript
test('create and verify', async ({ page, api, db }) => {
  // API: create account
  const response = await api.application.sendApplication(merchant, applicant, order);

  // UI: verify in origination portal
  await page.goto(env.originationUrl);
  // ...
});
```

### Multi-Portal Integration Tests

Tests that span multiple portals and external systems. Example: the PayTomorrow Refund Flow.

**E2E (`tests/e2e/paytomorrow-refund-flow.spec.ts`):**
Full multi-portal test covering PayTomorrow portal login, application creation, email link polling, finalization flow (identity, employment, offers, contract e-sign), UOWN Origination verification, funding, refund via PayTomorrow portal, and Servicing cancellation verification.

**API-only (`tests/api/paytomorrow-refund-flow-api.spec.ts`):**
Pure API lifecycle test: `sendApplication` -> invoice -> CC auth -> submit -> SIGNED -> settle -> FUNDED. Covers the full lifecycle up to FUNDED without browser interaction (refund is only available via the PayTomorrow portal UI).

**Key patterns used:**
- `email.getEmailLink(recipientEmail, urlPattern)` — polls IMAP for an email containing a URL matching the pattern (e.g., `/paytomorrow\.com/i`)
- `PayTomorrowPortalPage` — page object for the external PayTomorrow merchant portal (extends `BasePage` directly)
- `api.lead.updateFundingStatus(leadPks, status)` — updates funding status for leads (e.g., FUNDING -> FUNDED)

### LeadShortCode Migration Validation Tests

**API+DB (`tests/api/R1.49.1_separateShortCodeInANewEntity_469.spec.ts`):**
Validates the Flyway migration V20260226100000 which moves the `short_code` field from `uown_los_lead` to a new dedicated table `uown_los_lead_short_code`. Contains 6 scenarios:

| Test | Coverage |
|------|----------|
| Schema + Flyway | Migration applied, table/FK/indexes/history/columns exist |
| Data migration | New applications generate `short_code` in new table + reverse lookup via JOIN |
| Uniqueness check | Each lead has exactly one `short_code` record |
| Search by short code | `canContinueApplication` + `getMissingFields` API endpoints |
| Redirect URLs | `sendApplication` redirectUrl references short_code-backed lead |
| Data integrity | No orphaned short_codes (old table vs new table) |

**Key patterns used:**
- `db.shortCodeTableExists()` — schema validation helper
- `db.shortCodeForeignKeyExists()` — FK constraint check
- `db.shortCodeIndexExists(indexName)` — index existence check (lead_pk, short_code)
- `db.shortCodeHistoryTableExists()` — history table check
- `db.getLeadShortCode(leadPk)` — full record from new table
- `db.getLeadShortCodeValue(leadPk)` — just the short_code string
- `db.getLeadByShortCode(shortCode)` — reverse lookup via JOIN
- `db.waitForLeadShortCode(leadPk)` — polling with exponential backoff

### TireAgent / PayPair Portal Integration Tests

**E2E (`tests/e2e/tire-agent-unified-flow.spec.ts`):**
8-phase multi-portal test covering the TireAgent merchant flow via external PayPair portal.

| Phase | Action | Key Details |
|-------|--------|-------------|
| 1 | Navigate & Select Merchant | `paypair.navigateToPortal()` → `selectMerchant('TireAgent')` (no login required) |
| 2 | Fill Application Data | JSON textareas via `evaluate()` (personal info, cart, provider config) |
| 3 | Phone OTP Verification | Network intercept on `/api/v1/users/send_code` response → `otp_code` |
| 4 | Application Details & Plan Selection | SSN, income, DOB → wait for plans → select UOWN plan (index 3 of 4) |
| 5 | Capture Offer & Payment Prep | `captureOfferValues()` → `proceedToLastStep()` (nested `#pt-iframe`) |
| 6 | Complete PT-Iframe Payment | CC/Bank form in nested iframe (`#pt-iframe` inside `#llapp-iframe`) |
| 7 | Switch to Origination Portal | Login → poll for CONTRACT_CREATED (max 120s, 5s intervals) |
| 8 | Complete E-Sign | `contractPage.completeESign()` → poll for SIGNED status |

**Key patterns used:**
- `PayPairPortalPage` — page object for external PayPair portal (extends `BasePage` directly)
- Iframe nesting: page → `#llapp-iframe` (widget) → `#pt-iframe` (UOWN payment form)
- OTP via network response intercept (not IMAP — phone-based, not email-based)
- `generatePayPairTestPhone()` — phone must start with "111" or "222" for PayPair sandbox
- `buildPayPairPersonalInfoJson()` / `buildPayPairCartJson()` — JSON stringifiers for textarea payloads
- Textarea fill via `evaluate()` — standard `fill()` timeouts on textareas with `oninput` handlers

### GDS Lambda Segment Validation Tests

**API+DB (`tests/taskTestingUown/RU02.26.1.49.1_gdsLambdaSegment_472.spec.ts`):**
Validates that the GDS underwriting process populates the `lambda_segment` column in the `uown_los_uwdata` table. Creates an application via API, waits for GDS approval, then queries the DB to verify `lambda_segment` is NOT NULL and that the uwdata record has expected fields (`decided_by_agent`, `uw_status`).

| Test | Coverage |
|------|----------|
| lambda_segment populated | Application approved by GDS has non-null `lambda_segment` in `uown_los_uwdata` |
| uwdata fields | `decided_by_agent` and `uw_status` are set on the uwdata record |

**Key patterns used:**
- `db.waitForLambdaSegment(leadPk, timeout)` — polls with exponential backoff until `lambda_segment` is populated
- `db.getUwDataByLeadPk(leadPk)` — retrieves full uwdata record for field-level assertions
- `attachJson()` — attaches 3 evidence artifacts (application, lambda_segment, full uwdata) to HTML report
- `buildTestData()` + `api.application.sendApplication()` — standard API setup pattern

### Program Selection & Routing Validation Tests (13 vs 16 Months)

**API+DB (`tests/taskTestingUown/RU02.26.1.49.1_uownSvcUnderWritingProgramSelectionAndRouting13Vs16Months_439.spec.ts`):**
Validates that underwriting program selection and routing correctly assigns 13-month or 16-month plans based on banking data and BIN eligibility. Contains 4 scenarios:

| Scenario | Flow | Conditions | Expected |
|----------|------|-----------|----------|
| 1 | Kornerstone | Banking data + BIN-eligible CC | 16-month programs available |
| 2 | UOWN (no banking) | No banking data | Only 13-month programs |
| 3 | UOWN (ineligible BIN) | Banking data + BIN-ineligible CC (Visa 4111) | Only 13-month programs |
| 4 | getMissingFields API | Both legacy (no planId) and new (with planId) parameter | 200/404 responses |

**Key patterns used:**
- `extractPlanIdsFromPaymentDetails()` — regex extraction from `paymentDetailsList[].planId` and `redirectUrl` (pattern: `\b(WK|BWK|SM|MN)(13|16)\b`)
- `extractShortCodeFromUrl()` — extracts short code from contract URLs for later API calls
- `api.application.getMissingFields(identifier, { planId?: string })` — new optional `planId` parameter for program-specific missing fields (optional, may not be deployed yet)
- `submitApplication` response includes `paymentFrequency` and `termInMonths` (informational, not yet populating paymentDetailsList)
- Polling for status progression (CONTRACT_CREATED/CC_AUTH_PASSED) as indirect validation when planId fields not yet populated
- `attachJson()` — attaches request/response artifacts at each step

**API Response Updates (Task #439):**
- `SendApplicationResponseBody` — added `planId` and `termInMonths` to `paymentDetailsList` element
- `ApplicationStatusResponseBody` — added `planId` and `termInMonths` to `paymentDetailsList` element
- `ApplicationClient.getMissingFields()` — now accepts optional `options?: { planId?: string }` parameter

### Environment Variable Verification Tests

**E2E (`tests/e2e/origination/implement-env-variables-for-is-prod-1228.spec.ts`):**
Verifies that the origination app uses env-based `IS_PRODUCTION` and `ENVIRONMENT_NAME` variables (not hostname-based detection) on the `/{shortCode}/complete` route. The test captures browser console logs to validate the expected log pattern: `[Origination env] ENVIRONMENT_NAME: <value> | IS_PRODUCTION: <true|false>`.

| Step | Action | Key Details |
|------|--------|-------------|
| 1 | Setup console listener | Inline `page.on('console')` capturing all types (not just error/warning) |
| 2 | Create application via API | `setupApplicationViaApi` with `extractContractUrl: true`, `skipCreditCardAuth: true` |
| 3 | Navigate to contract page | `/{shortCode}/complete` route |
| 4 | Extract and validate env log | Regex match on console output, poll up to 5s for SPA log emission |
| 5 | Assert IS_PRODUCTION | Must be `false` for non-production environments |
| 6 | Assert ENVIRONMENT_NAME | Must be present and valid (not empty/undefined/null) |

**Key patterns used:**
- Inline `page.on('console')` listener — captures all message types (the framework's `captureConsoleLogs` hook only captures error/warning)
- `buildTestData()` + `setupApplicationViaApi()` — standard API setup helpers
- Polling with `sleep()` — waits for SPA to emit console log after page load
- `test.info().annotations` — attaches captured values to test report

### Completion Screen Validation Tests (Confetes)

**E2E (`tests/taskTestingUown/R1.50.0_improveFinalCompletionScreen_1209/R1.50.0_improveFinalCompletionScreen_1209.spec.ts`):**
Validates the improved post-signature completion screen (Confetes component). The new design replaces the old minimal text screen with a confetti animation, check icon, "Thank You!" heading, contact info, and email notification footer. Also verifies the old "View Document" link is removed.

| Step | Action | Key Details |
|------|--------|-------------|
| 1 | Create application via API | `buildTestData()` + `setupApplicationViaApi()` with `extractContractUrl: true` |
| 2 | Fix shortCode from DB | Queries `uown_los_lead_short_code` for correct shortCode (invoice may regenerate it) |
| 3 | Navigate to contract page | `/{shortCode}/complete` route |
| 4 | Fill CC + bank info | `ContractPage.fillCreditCardInfo()` + `fillBankInfo()` |
| 5 | Accept T&C + insurance | `completeTermsAndShowInsurance()` + `completeProtectionPlan()` |
| 6 | Complete e-sign | `contractPage.completeESign()` (auto-detects SignWell/PandaDocs) |
| 7 | Validate completion screen | Heading, success message, contact info, phone, email footer, check icon |
| 8 | Verify old UI removed | Old "View Document" link should NOT be present |

**Key patterns used:**
- `CompletionScreenSelectors` — 5 new selectors (`completionCheckIcon`, `completionMainMessage`, `completionPhoneNumber`, `completionFooterText`, `completionContent`)
- ShortCode correction from DB — `db.getLeadShortCodeValue(leadPk)` to handle invoice shortCode regeneration
- Merchant program assignment — auto-assigns `merchant_program_pk` if missing via DB query
- Full-page screenshot attachment — captures completion screen as test evidence

### Payment Arrangement Settlement Tests

**API+DB (`tests/taskTestingUown/RU02.26.1.49.1_uownSvcAtlogAiPaymentArrangementSettlement_446/`):**
Validates the `uown_sv_payment_arrangement` entity and settlement flow using the Payment Arrangement API directly. Drives applications to FUNDED state, creates CC or ACH payment arrangements, triggers scheduled sweeps, and validates DB state transitions, FK links, account rating changes, and refund/cancellation flows. Environment: QA2. Merchants: TerraceFinance, Kornerstone.

| Scenario | Type | Flow | Key Assertions |
|----------|------|------|----------------|
| 1 | CC SETTLEMENT — overdue | Drive to FUNDED → create overdue CC arrangement → sweep → poll | DB status: NOT_STARTED → IN_PROGRESS → SUCCESS; account status: SETTLED_IN_FULL |
| 2 | CC SETTLEMENT — partial progress | Drive to FUNDED → create CC arrangement with future installments → sweep → poll | DB status: IN_PROGRESS (not all settled); no SETTLED_IN_FULL yet |
| 3 | CC SETTLEMENT — declined card | Drive to FUNDED → create arrangement with invalid CC → sweep → poll | DB status: FAILED; account rating unchanged |
| 4 | CC NORMAL arrangement | Drive to FUNDED → create CC normal (non-settlement) arrangement → sweep → poll | DB status: SUCCESS; account NOT SETTLED_IN_FULL |
| 5 | ACH SETTLEMENT arrangement | Drive to FUNDED → create ACH arrangement → verify record; ACH sweep | DB record created; ACH FK column present; ACH payments linked to arrangement |
| 6 | CC SETTLEMENT — 6 installments | 3 overdue + 3 upcoming installments; sweep processes overdue only | DB status: IN_PROGRESS after first sweep; SUCCESS after all overdue processed |
| 7 | Refund arrangement CC payment | Drive to FUNDED → create CC arrangement → sweep → refund one installment | CC transaction refunded; arrangement FK preserved; DB status updated |
| 8 | Lease cancellation with refund | Drive to FUNDED → create CC arrangement → cancel lease + refund | Account status: CANCELLED or SETTLED_IN_FULL; arrangement DB record reflects final state |

**Key patterns used:**
- `driveToFundedAndGetAccountPk()` — helper that drives a lead through the full state machine to FUNDED and returns `accountPk`
- `api.paymentArrangement.makeCreditCardPayments(accountPk, body)` — creates CC payment arrangement via API (replaces UI interaction)
- `api.paymentArrangement.createOrUpdateAchPayments(accountPk, body)` — creates ACH payment arrangement via API
- `buildCcArrangementBody(installments, isSettlement)` / `buildAchArrangementBody(installments)` — typed body builders
- `isoDate(offset)` — generates ISO date strings with day offset for installment due dates
- `api.scheduledTask.triggerScheduledTask('sendCreditCardPaymentsSql')` — triggers CC payment sweep (note: `triggerScheduledTask`, not `triggerTask`)
- `db.waitForPaymentArrangementStatus(accountPk, expectedStatus, timeout)` — polls arrangement status with exponential backoff; transitions: NOT_STARTED → IN_PROGRESS → SUCCESS/FAILED
- `db.getPaymentArrangement(accountPk)` — retrieves single arrangement record from `uown_sv_payment_arrangement`
- `db.getPaymentArrangementsByAccount(accountPk)` — lists all arrangements for an account
- `db.paymentArrangementTableExists()` — schema validation for new entity table
- `db.ccTransactionHasArrangementFk()` / `db.achPaymentHasArrangementFk()` — validates FK column exists in transaction tables
- `db.getCcTransactionsByArrangement(arrangementPk)` / `db.getAchPaymentsByArrangement(arrangementPk)` — retrieves transactions linked to a specific arrangement
- `db.getPaymentArrangementColumns()` — introspects column list on arrangement table
- `db.getAccountRating(accountPk)` / `db.waitForAccountStatus(accountPk, status)` — account lifecycle validation
- `db.waitForCcTransactionsProcessed(accountPk)` / `db.waitForAchPaymentsProcessed(accountPk)` — sweep completion polling (do NOT use fixed sleep after sweep trigger)

## Test Structure Conventions

### Parameterized Tests

Use `for...of` loops over test data arrays instead of Cucumber Examples tables:

```typescript
const testData = [
  { env: 'sandbox', state: 'CA', merchant: 'ProgressMobility' },
  { env: 'qa1', state: 'NY', merchant: 'TireAgent' },
];

for (const data of testData) {
  test.describe(`Flow - ${data.env}/${data.merchant}`, () => {
    test('full lifecycle', async ({ page, api }) => {
      // ...
    });
  });
}
```

### Test Steps

Use `test.step()` for logical grouping within a test:

```typescript
test('create account', async ({ page }) => {
  await test.step('Login to origination', async () => {
    // ...
  });

  await test.step('Fill application form', async () => {
    // ...
  });

  await test.step('Verify account created', async () => {
    // ...
  });
});
```

### Tags

Use Playwright tags for filtering:

```typescript
test.describe('My Suite', { tag: ['@cicd', '@sandbox'] }, () => {
  test('my test', async () => { /* ... */ });
});
```

Run with: `npx playwright test --grep @cicd`

## Page Object Model

All page interactions go through Page Object classes:

```typescript
// src/pages/origination/customer.page.ts
export class OriginationCustomerPage extends BasePage {
  async getLeadStatus(): Promise<string> {
    // ...
  }
}

// In test:
const customerPage = new OriginationCustomerPage(page);
const status = await customerPage.getLeadStatus();
```

## API Client Layer

### Structure

```
src/api/
├── clients/          # One client per domain
│   ├── base.client.ts
│   ├── application.client.ts
│   ├── invoice.client.ts
│   ├── lead.client.ts
│   ├── settlement.client.ts
│   ├── credit-card.client.ts
│   ├── scheduled-task.client.ts
│   └── payment-arrangement.client.ts
├── bodies/           # Typed request payloads + builders
│   ├── application.body.ts
│   ├── invoice.body.ts
│   ├── lead.body.ts
│   ├── settlement.body.ts
│   ├── credit-card.body.ts
│   └── payment-arrangement.body.ts
└── responses/        # Typed response interfaces
    ├── api-response.ts    # Generic ApiResponse<T> wrapper
    ├── application.response.ts
    ├── invoice.response.ts
    ├── payment-arrangement.response.ts
    └── ...
```

### Usage Patterns

**Via fixtures (recommended):**
```typescript
test('test', async ({ api }) => {
  const result = await api.application.sendApplication(merchant, applicant, order);
  expect(result.ok).toBeTruthy();
});
```

**Direct instantiation:**
```typescript
const client = new ApplicationClient(request, env);
const result = await client.sendApplication(merchant, applicant, order);
```

**Using body builders:**
```typescript
import { buildSendApplicationBody } from '../../src/api/bodies/application.body.js';

const body = buildSendApplicationBody(merchant, applicant, order);
```

## Hooks (E2E)

Hooks are automatically applied when using `src/support/base-test.ts`:

| Hook | When | Auto-applied? | What |
|---|---|---|---|
| `disableCssAnimations` | Before each test | Yes | Injects CSS to disable animations |
| `captureConsoleLogs` | Before each test | Yes | Captures console errors/warnings into `consoleLogs` fixture |
| `attachScreenshotOnFailure` | After each test | Yes | Full-page screenshot on failure |
| `attachTestMetadata` | After each test | Yes | Environment, URL, timing data |
| `attachConsoleLogsOnFailure` | After each test | **No** (manual) | Console logs on failure — exported but not auto-wired |
| `waitForPageReady` | On demand | **No** (manual) | Wait for page to be interactive |

## Test Evidence Attachments

Use `test.info().attach()` to attach evidence artifacts to the Playwright HTML report.

**Inline JSON display (recommended for structured data):**
```typescript
async function attachJson(name: string, data: unknown): Promise<void> {
  await test.info().attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'text/plain',  // text/plain renders inline in HTML report
  });
}
```

Use `contentType: 'text/plain'` (not `'application/json'`) so the data renders inline in the Playwright HTML report. With `application/json`, the report generates a download link instead of displaying the content directly.

## Reports

### Report Types

| Type | Location | Command |
|---|---|---|
| HTML (Playwright) | `reports/html/` | `npm run report` |
| JSON Summary | `reports/test-summary.json` | `npm run report:summary` |
| Allure | `reports/allure-report/` | `npm run report:allure` |
| Test artifacts | `reports/test-results/` | (automatic) |

### Custom JSON Summary

After each test run, `reports/test-summary.json` contains:

```json
{
  "timestamp": "2026-02-24T...",
  "environment": "sandbox",
  "totalTests": 13,
  "passed": 12,
  "failed": 1,
  "skipped": 0,
  "flaky": 0,
  "totalDuration": 45000,
  "tests": [
    {
      "title": "Create application...",
      "file": "tests/api/new-application-api.spec.ts",
      "project": "api-only",
      "status": "passed",
      "duration": 5234,
      "retries": 0,
      "tags": []
    }
  ]
}
```

## Environment Variables

### Test Configuration

| Variable | Default | Description |
|---|---|---|
| `ENV` | `sandbox` | Target environment |
| `TIMEOUT_MULTIPLIER` | `1` | Multiply all timeouts |
| `WORKERS` | `1` | Parallel workers |
| `RETRIES` | `0` | Retry count (CI: 1) |
| `STRICT_MODE` | `false` | Fail on warnings |
| `ALLURE` | `false` | Enable Allure reporter |
| `SCREENSHOTS` | `only-on-failure` | Screenshot mode |
| `VIDEO` | `off` | Video recording mode |
| `TRACE` | `on-first-retry` | Trace recording mode |

### CI/CD

Set `CI=true` (or `GITHUB_ACTIONS` or `JENKINS_URL`) to enable CI defaults:
- Retries: 1
- Screenshots: only-on-failure
- Trace: on-first-retry
- Headless browser

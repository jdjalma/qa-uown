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

### Payment Arrangement Settlement Tests (Task #446)

**API+DB (`tests/taskTestingUown/RU03.26.1.50.0_atlogAiPaymentArrangementSettlement_446/RU03.26.1.50.0_atlogAiPaymentArrangementSettlement_446.spec.ts`):**
Validates the `uown_sv_payment_arrangement` entity and settlement flow using the Payment Arrangement API directly. Drives applications to FUNDED state (or uses pre-seeded `existingAccountPks` when GDS is unavailable), creates CC or ACH payment arrangements, triggers scheduled sweeps, and validates DB state transitions, FK links, account status changes. Environment: QA1. Merchant: TerraceFinance.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | Schema validation | DB-only, no lead needed | Table exists, required columns present, FK columns on CC/ACH/LOS tables |
| CT-02 | CC SETTLEMENT — synchronous | Drive to FUNDED → create CC arrangement (today's date) | Status SUCCESS immediately (CC is synchronous); account SETTLED_IN_FULL |
| CT-03 | CC SETTLEMENT sweep | Drive to FUNDED → create CC arrangement → trigger sweep → poll | Arrangement SUCCESS; account SETTLED_IN_FULL |
| CT-04 | CC NORMAL sweep | Drive to FUNDED → create CC NORMAL arrangement → sweep → poll | Arrangement SUCCESS; account NOT SETTLED_IN_FULL |
| CT-05 | ACH SETTLEMENT — NOT_STARTED | Drive to FUNDED → create ACH arrangement | Status NOT_STARTED (ACH is asynchronous); payments linked via FK |
| CT-06 | ACH SETTLEMENT sweeps | Drive to FUNDED → create ACH → trigger send + status sweeps | Soft-asserted SUCCESS + SETTLED_IN_FULL (Profituity not active in QA1) |

**Key patterns used:**
- `existingAccountPks` bypass — when GDS is unavailable, pre-seed `testData.existingAccountPks` with known FUNDED account PKs to skip full account creation; `driveToFunded()` returns immediately with the provided `accountPk`
- `calculateDateISO(daysOffset)` from `@helpers/date.helpers` — returns `YYYY-MM-DD` for API date fields that Java deserializes as `LocalDate`; use instead of `calculateDate()` (which returns `MM/DD/YYYY`) for all payment arrangement posting dates
- `buildCcArrangementBody(options)` / `buildAchArrangementBody(options)` — typed body builders from `@api/bodies/payment-arrangement.body`
- `buildAchArrangementBody` always sets `achProcessType: 'REQUEST'` — bypasses the sendACHPaymentsSweep auto-pay due-date window so ACH payment arrangement payments are always picked up by the sweep
- `api.paymentArrangement.makeCreditCardPayments(body)` — creates CC payment arrangement (CC transactions processed synchronously in the same request)
- `api.paymentArrangement.createOrUpdateAchPayments(body)` — creates ACH payment arrangement (status starts at NOT_STARTED; requires Profituity sweep pipeline to reach SUCCESS)
- `api.scheduledTask.sendCreditCardPaymentsSweep()` / `sendAchPaymentsSweep()` / `getStatusDatePaymentsListSweep()` — scheduled task triggers
- `db.waitForPaymentArrangementStatus(accountPk, expectedStatus, timeout)` — polls arrangement status with exponential backoff; transitions: NOT_STARTED → IN_PROGRESS → SUCCESS/FAILED
- `db.waitForCcTransactionsProcessed(arrangementPk, timeout)` / `db.waitForAchPaymentsProcessed(arrangementPk, timeout)` — sweep completion polling (do NOT use fixed sleep after sweep trigger)
- `db.getPaymentArrangement(accountPk)` — retrieves single arrangement record from `uown_sv_payment_arrangement`
- `db.paymentArrangementTableExists()` — schema validation for new entity table
- `db.ccTransactionHasArrangementFk()` / `db.achPaymentHasArrangementFk()` / `db.losCcTransactionHasArrangementFk()` — validates FK column exists in transaction tables
- `db.getCcTransactionsByArrangement(arrangementPk)` / `db.getAchPaymentsByArrangement(arrangementPk)` — retrieves transactions linked to a specific arrangement
- `db.getPaymentArrangementColumns()` — introspects column list on arrangement table
- `db.getAccountRating(accountPk)` / `db.waitForAccountStatus(accountPk, status)` / `db.getAccountStatus(accountPk)` — account lifecycle validation
- Soft assertions with `console.warn` for known environment limitations (QA1 ACH Profituity inactive, rating persistence backend bug) — test passes but logs the limitation clearly

**Known environment limitations (QA1):**
- ACH Profituity sweep pipeline (`sendACHPaymentsSweep`) has `is_active=false` in `uown_scheduled_task`; ACH arrangements stay at NOT_STARTED. CT-06 soft-asserts SUCCESS + SETTLED_IN_FULL.
- Rating letter persistence backend bug: `AccountFinancialInfoService.updateRatingLetterAndAutoPay` logs "Rating letter changed from null to P" but does not persist. Rating assertions are intentionally skipped in CT-02 and CT-05.

### Payment Arrangement Settlement E2E UI Tests (Task #446)

**E2E+Hybrid (`tests/e2e/servicing/payment-arrangement-settlement-446.spec.ts`):**
Complementary UI tests for the Payment Arrangement feature. Validates the Servicing Portal Make Payment modal and SETTLEMENT account status rendering. Uses the `servicing-ui` Playwright project (storageState: `.auth/servicing.json`). Environment: QA1.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-UI-01 | E2E | Open Make Payment modal → check Payment Arrangement → fill dates/frequency → submit | Success toast visible; DB: arrangement type=NORMAL, status=SUCCESS, payment_type=CC |
| CT-UI-02 | Hybrid (API+UI) | API creates CC SETTLEMENT arrangement → reload Servicing UI | DB: arrangement type=SETTLEMENT, status=SUCCESS; account status=SETTLED_IN_FULL |

**Key patterns used:**
- `ServicingCustomerPage.makeCcPaymentArrangement({ startDate, endDate, frequency, paymentType })` — page object method for UI-driven CC payment arrangement via Make Payment modal
- Hybrid test pattern: API creates SETTLEMENT (since the UI modal does NOT expose an `arrangementType` selector — it always defaults to NORMAL), then UI verifies the resulting SETTLED_IN_FULL state
- `buildCcArrangementBody()` with `arrangementType: 'SETTLEMENT'` — used in CT-UI-02 to create arrangement via API
- `db.getPaymentArrangement(accountPk)` — verifies arrangement created with correct type, status, and payment_type
- `db.getAccountStatus(accountPk)` — verifies account transitioned to SETTLED_IN_FULL after settlement
- Pre-flight account eligibility check — skips test if account is already SETTLED_IN_FULL or has an active arrangement
- Screenshots at each step for evidence (`reports/screenshots/ct-ui-*`)

**UI modal fields (Make Payment → Payment Arrangement section):**
- `#paymentArrangement` — checkbox to enable arrangement section
- `#startDate`, `#endDate` — date range for the arrangement
- `#paymentFrequency` — React Select: Weekly, BiWeekly, Monthly, SemiMonthly (no hyphens)
- `paymentInfo[n].paymentDate` / `paymentInfo[n].paymentAmount` — auto-populated installments
- Success toast: "Payment Arrangement scheduled successfully."

**Important finding:** The standard Make Payment modal always omits `arrangementType` in the request body — the backend defaults to NORMAL. SETTLEMENT arrangements can only be created via API with explicit `arrangementType: 'SETTLEMENT'`.

### Due Date Moves History Tests (Task #502)

**E2E+API+DB (`tests/taskTestingUown/RU03.26.1.50.0_addDueDateMovesPageInHistoryMenu_502/RU03.26.1.50.0_addDueDateMovesPageInHistoryMenu_502.spec.ts`):**
Validates the new Servicing > History > Due Date Changes page. Uses existing FUNDED accounts. Environment: QA1. Contains 4 tests and 6 scenarios.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | E2E | Navigate to History > Due Date Changes | Page heading visible; `<div role="table">` rendered (react-data-table-component v7) |
| CT-02 | API | GET `/uown/svc/accounts/{pk}/due-date-moves` | 200 OK; `DueDateMovesPage` schema valid; `content` is array |
| CT-03 | API | POST `/uown/svc/moveDueDatesByDays/{pk}` | 200 OK; response includes `moveNumberOfDays`, `isFpdChange`, `agent`, `rowCreatedTimestamp` |
| CT-04 | DB | DB persistence after POST | `uown_sv_due_date_move` record created; `move_number_of_days` matches request |
| CT-05 | Hybrid (E2E + API + DB) | Triple validation: POST → GET → DB → UI | UI columns match API GET reference values; `isFpdChange` renders as `Yes`/`No`; dates render as `MM/DD/YYYY` |
| CT-06 | Hybrid (E2E + API + DB) | `isFpdChange = true` scenario | Same triple validation with a move that changes the first payment date |

**Key patterns used:**
- `DueDateMovesHistoryPage` — extends `ServicingBasePage`; uses `topMenuNavigateTo('due date changes')`
- `react-data-table-component v7` — page uses `<div role="table">` not `<table>`; use `page.getByRole('table')`
- `waitForResponse` before History menu click — prevents MobX pre-fetch race condition (see `test-patterns.md`)
- **Triple validation pattern (CT-05/CT-06)** — POST action → GET reference → DB cross-validate → UI column assertions. This establishes a reusable pattern for all history/list pages
- `api.account.getNextReceivable(accountPk)` — used to inspect current receivable state before a move
- `api.account.getDueDateMoves(accountPk, page, size)` — paginated list of all moves for an account
- `api.account.moveDueDatesByDays(accountPk, days)` — creates a new move record; `days` can be positive (postpone) or negative (advance)
- `existingAccountPks` bypass — pre-seeded FUNDED accounts for QA1 where GDS is unavailable

**New API response types (`src/api/responses/account.response.ts`):**
- `SvcReceivableResponse` — next receivable for an account
- `ReceivableInfo` — receivable sub-object embedded in `DueDateMoveRecord`
- `DueDateMoveRecord` — single move record: `pk`, `accountPk`, `moveNumberOfDays`, `isFpdChange`, `agent`, `rowCreatedTimestamp`, `nextReceivable`
- `DueDateMovesPage` — paginated wrapper: `content`, `totalElements`, `totalPages`, `number`, `size`

**New page object:**
- `src/pages/servicing/due-date-moves-history.page.ts` — `DueDateMovesHistoryPage` extends `ServicingBasePage`

### Frequency Changes History Tests (Task #503)

**E2E+API (`tests/taskTestingUown/RU03.26.1.50.0_addFrequencyChangesPageInHistoryMenu_503/RU03.26.1.50.0_addFrequencyChangesPageInHistoryMenu_503.spec.ts`):**
Validates the new Servicing > History > Frequency Changes page. Uses existing accounts with frequency modification history — no new application is created. Environment: QA1. Tests run in `serial` mode.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01/02/03 | E2E + API + DB | Navigate to page → verify render + API data format + pagination | Page heading + `<div role="table">` visible; API returns 200 with valid `FrequencyModsResponse[]`; DB record count matches API response count |
| CT-04 | E2E | Login with admin user → open History menu | "Frequency Changes" menu item visible for users with `frequency_history` permission |
| CT-05–CT-08 | E2E + DB + API | Change frequency via Servicing Information edit panel — full 4-step cycle (WEEKLY → BI_WEEKLY → MONTHLY → SEMI_MONTHLY → back to original) | `uown_frequency_mods` count increases by 1 per step; latest DB record has correct `old_frequency`/`new_frequency`; API response latest record matches; `SEMI_MONTHLY` has non-null `secondDueDate` |

**Key patterns used:**
- `FrequencyChangesHistoryPage` — extends `ServicingBasePage`, uses `topMenuNavigateTo('frequency changes')`
- `navigateToCustomer(accountPk)` via search — REQUIRED to set MobX `customerStore.accountPk`; `page.goto()` leaves `accountPk=null` causing nav to `/frequency-history/null`
- `waitForResponse` before History menu click — prevents MobX pre-fetch race condition (see `test-patterns.md`)
- `buildFrequencyCycle(currentFrequency)` — dynamically builds a 4-step cycle from current DB frequency, avoiding hardcoded starting point
- `react-data-table-component v7` — page uses `<div role="table">` not `<table>`; use `page.getByRole('table')` for existence checks
- API result ordering — `GET /uown/svc/accounts/{pk}/frequency-changes` returns records ASC (oldest first); use `response.body[response.body.length - 1]` for the most recent record
- Re-login per iteration — JWT is in-memory React/MobX state; `page.goto()` clears it; re-login needed before each Frequency Changes page visit in the CT-05–08 cycle
- `api.account.getFrequencyChanges(accountPk)` — used as fallback data validation when UI table is empty due to BUG-01
- Screenshots saved to `reports/test-results/503-screenshots/` at key steps as evidence

**Known application bug (BUG-01):**
`CustomerStore.frequencyChangesHistory` is missing the `@observable` decorator in `domain/stores/customer.tsx`. React never re-renders the `FrequencyChangesHistoryTable` after the API response arrives — the table always shows "no records" on SPA navigation. Tests use API validation (`api.account.getFrequencyChanges`) as the primary data assertion, and only verify that the table container element (`<div role="table">`) is present in the DOM.

**New types (`src/api/responses/account.response.ts`):**
- `FrequencyModsResponse` — `{ pk?, agent, rowCreatedTimestamp, frequencyModInfo: FrequencyModInfo }`
- `FrequencyModInfo` — `{ accountPk, oldFrequency, newFrequency, oldTermPayment, newTermPayment, firstDueDate, secondDueDate }`

### Term Month Column Verification Tests (Task #1242)

**Hybrid E2E+API (`tests/taskTestingUown/RU03.26.1.50.0_displaySelectedTermMonthInOverviewAndLeadsTables_1242/RU03.26.1.50.0_displaySelectedTermMonthInOverviewAndLeadsTables_1242.spec.ts`):**
Validates that the new "Term Month" column in the Origination portal Overview and Leads tables displays the term selected by the applicant via `planId`. Uses `sendApplication` + `getMissingFields` + `submitApplication` API flow to drive lead state, then verifies column values via E2E. Environment: QA1. Merchant: TerraceFinance.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | Hybrid (API + E2E) | `sendApplication` → `getMissingFields(planId)` → `submitApplication(planId)` → login → Overview + Leads | Term Month = "13" in both tables |
| CT-02 | Hybrid (API + E2E) | `sendApplication` (no order) → DB-patch (`eligible_terms='16'`, `merchant_program_pk=207`) → `sendInvoice(MONTHLY)` → `getMissingFields(MN16)` → `submitApplication(MN16, DISCOVER)` → login → Overview + Leads | Term Month = "16" in both tables |
| CT-03 | Hybrid (API + E2E) | `sendApplication` only (no `submitApplication`) → login → Overview + Leads | Term Month = "" (blank) in both tables |

**Key patterns used:**
- `api.application.getMissingFields(shortCode, { planId })` — sets `merchantProgramPk` on the lead (REQUIRED before `submitApplication`). Without this step, `submitApplication` fails with missing program reference
- `api.application.submitApplication(leadPk, firstName, lastName, { planId, ccNumber, cvc, ccType, ccExp })` — submits with explicit `planId` to create `sched_summary` record with `term_in_months`
- `SubmitApplicationResponseBody.termInMonths` — response field added to confirm selected term (e.g., assert `submitBody?.termInMonths === 16`)
- CC last name match: `CCCheckService.checkCCLastNameMatch` — backend validates CC last name matches customer's last name from `sendApplication`. The test reuses exact `firstName`/`lastName` from the applicant builder
- Sort indicator stripping: Leads table headers include `▲`/`▼` characters for sort direction — `cleanHeaders = headers.map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim())` before matching column names
- `extractPlanId(redirectUrl)` — extracts `planId` from `paymentDetailsList[].redirectUrl` query parameter
- `extractShortCode(redirectUrl)` — extracts short code from URL path for `getMissingFields` call
- `OverviewPage.getRowDataByReferenceId(leadPk)` — searches Overview table by Reference # column
- Custom `findLeadInLeadsTable()` helper — navigates to Leads page and searches paginated rows by Lead # with sort indicator awareness

**16-month flow in qa1 (CT-02 workaround):** `getNumberOfPayments(16, WEEKLY/BI_WEEKLY/SEMI_MONTHLY)` throws `SvcException` because no backend config exists for `number.of.payments.16.WEEKLY` etc. MONTHLY uses a fallback (`return numberOfMonths = 16`) so no config lookup occurs. Prerequisites before `sendInvoice(MONTHLY)`:
1. DB-patch `uown_los_uwdata.eligible_terms = '16'` for the lead
2. DB-patch `uown_los_lead.merchant_program_pk = 207` for the lead
3. Call `sendInvoice` with `selectedPaymentFrequency='MONTHLY'` — yields `planId=MN16` in `paymentDetailsList`
4. Retrieve `shortCode` via `db.getLeadShortCodeValue(leadPk)` (refreshed by `sendInvoice`)

**Data source:** `uown_los_sched_summary.term_in_months` — populated during `submitApplication` when `planId` is provided. Leads without `submitApplication` have no `sched_summary` record, so the column is blank (LEFT JOIN).

### Canonical Full-Lifecycle Regression Tests

Two E2E tests serve as the primary regression suite for the full account lifecycle. Both use the `cross-portal` Playwright project and cover origination, contract, servicing, and website portals end-to-end.

---

**E2E (`tests/e2e/unified-flow.spec.ts`) — cross-portal project:**
Full lifecycle via API-driven account creation. The canonical CICD test migrated from `TV_UownUnifiedFlow.feature`.

| Phase | Action | Key Details |
|-------|--------|-------------|
| 1 | Account creation via API | `sendApplication` (no `sendInvoice` before contract URL — invalidates the URL) |
| 2 | Contract page | Fill CC + bank info → submit → `completeTermsAndConditions()` (auto-detects insurance) → `completeESign()` |
| 3 | Origination portal | Login → poll for SIGNED/FUNDED status → settle → fund via funding queue |
| 4 | Customer info verification | Quick search, customer data assertions |
| 5 | Servicing portal | Add CC → ACH + CC payments → allocation strategy → navigation |
| 6 | Website portal | Login via email OTP → verify account → navigate → change email → payments |

**Key patterns used:**
- `completeTermsAndConditions()` — auto-detects insurance flow (BW13/TireAgent): checks for "See Protection Benefits" button and calls `completeProtectionPlan(false)` if found; otherwise proceeds to standard "PROCEED TO SIGNATURE"
- `editAllocationStrategy()` — non-fatal; skips with log if no edit icon found on the row
- `changeEmailToGeneric()` — non-fatal; skips gracefully if email field is disabled (read-only account)
- `settleLease()` success toast — non-fatal; some environments complete settlement without emitting a toast
- Default testData: `sandbox/TireAgent` (active), `stg/TireAgent` (commented out)

---

**E2E (`tests/e2e/origination/new-application.spec.ts`) — origination-ui project:**
Full lifecycle via UI-driven account creation using the Origination "New Application" form. Migrated from `TV_UownNewApplication.feature`.

| Phase | Action | Key Details |
|-------|--------|-------------|
| 1 | Origination portal — New Application | Login → navigate to "New Application" → fill form → extract `leadPk` from table |
| 2 | Complete application via API | `sendApplication` with extracted leadPk → navigate to contract URL |
| 3 | Contract page | Fill CC + bank info → submit → T&C → e-sign |
| 4 | Origination | Change to Signed → settle → fund via funding queue |
| 5 | Customer info verification | Quick search, customer data assertions |
| 6 | Servicing portal | Login → payments (ACH + CC) → navigate all sections |
| 7 | Website portal | Login → verify account → navigate → change email → payments |

**Key patterns used:**
- `NewApplicationPage.navigateToNewApplication()` — navigates via sidebar, fills merchant + location, sends application
- All same non-fatal patterns as `unified-flow.spec.ts` apply
- Default testData: `stg/TireAgent` (active), `sandbox/ProgressMobility` (commented out)

---

### CompleteApplication Screen Redesign Tests (Task #1233)

**E2E Hybrid (`tests/taskTestingUown/RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233/RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233.spec.ts`):**
Validates the redesigned MissingPaymentProgram screen on the `/{shortCode}/complete` route. MR !1408 replaced the plain white modal with a modern card-based layout featuring title/subtitle, payment cards with emoji icons, term selection tabs (13/16 months), and a footer with contact information. Environment: QA1. Merchant: TerraceFinance. Project: `task-testing`.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | E2E | Navigate to completeApplication without planId → verify new UI | Logo, title ("Choose the payment program..."), subtitle, payment cards with price/detail rows/button visible |
| CT-02 | E2E | Click "Choose Payment Program" button | CC/bank form appears, payment program container hides |
| CT-03 | E2E | Check term selection tabs (conditional) | Tabs labeled "X Months Terms" visible; tab switch changes card count; skips if merchant has single term |
| CT-04 | E2E | Verify frequency-specific labels | Card titles match frequency labels (Weekly/Bi-Weekly/Twice a Month/Monthly) with correct descriptions |
| CT-05 | E2E Hybrid | Full flow: program selection -> CC/bank -> T&C -> e-sign | Lead reaches CONTRACT_CREATED/SIGNED state |
| CT-06 | E2E | Verify footer content | Footer text = "Questions? We're here to help", phone = "(877) 353-8696" |

**Key patterns used:**
- `stripPlanId(rawUrl)` — removes `planId` query parameter from `redirectUrl` to force the MissingPaymentProgram screen to render (when `planId` is present, the backend auto-resolves the program and skips this screen)
- CSS Module selectors with `:not()` and `:has()` pseudo-classes — the frontend uses BEM-style CSS Modules where class names like `paymentCard__price` also partially match `paymentCard__priceContainer` and `paymentCard__priceLabel`; selectors use `:not([class*='Container']):not([class*='Label'])` to disambiguate
- Consolidated CT-01/02/03/04/06 into a single test with `test.step()` to share page context (avoids redundant application creation)
- CT-03 (term tabs) is conditional — gracefully skips when merchant has single term (no tabs rendered)
- `PaymentProgramSelectors` — 15 new selectors in `src/selectors/common.selectors.ts` covering the redesigned screen (container, logo, title, subtitle, cards, tabs, footer)
- `FREQUENCY_LABELS` constant — maps frequency names to expected title/description pairs from frontend source

**Known bug (BUG-01):** SSN `888888888` causes a NullPointerException in the backend (500 error). The test uses auto-generated approved SSNs instead. Documented in `docs/test-reports/1233-bugs.md`.

### Fix PlanId Condition When NextPayDate Is Not Provided (Task #476)

**API+E2E (`tests/taskTestingUown/Tasks/RU03.26.1.50.0_fixPlanIdConditionWhenNextPayDateIsNotProvided_476/RU03.26.1.50.0_fixPlanIdConditionWhenNextPayDateIsNotProvided_476.spec.ts`):**
Validates the fix for the `planId` condition on the `/{shortCode}/complete` route when `nextPayDate` is not provided. When `planId` is empty in the URL, the backend renders a 2-step employment form (next paycheck date + pay frequency) before showing payment program options. The test validates both the API-level `getMissingFields` behavior and the full E2E flow through the missing employment screen. Environment: sandbox. Merchant: TerraceFinance.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-API-01 | API | `sendApplication` → extract redirect URL | 200 OK; `paymentDetailsList` contains redirect URLs with `planId` parameter |
| CT-API-02 | API | `getMissingFields(shortCode, { planId })` — with planId | 200 OK; `merchantProgramPk` set on lead |
| CT-API-03 | API | `getMissingFields(shortCode)` — without planId | 200 OK; response valid when no planId provided |
| CT-API-04–08 | API | Various `getMissingFields` parameter combinations | API accepts empty `planId`, null, missing param; all return 200 |
| CT-E2E-01 | E2E | Strip `planId` from redirect URL → navigate to `/complete` → fill employment form → select plan → complete contract | Missing employment screen appears; 2-step form completes; plan selection screen shows "Please review and select one of the programs below."; lead reaches CONTRACT_CREATED |

**Key patterns used:**
- `stripPlanId(redirectUrl)` — removes `planId` query param from `paymentDetailsList[n].redirectUrl` to force the missing employment info screen (when `planId` is present, the backend resolves the program and skips this screen)
- `ContractPage.dismissSeonOverlay()` — hides `[data-testid="seon-idv-iframe"]` via JS in sandbox; the SEON identity verification iframe blocks pointer events on the `/complete` page
- `ContractPage.completeMissingEmploymentInfo(nextPayDate, frequency, programName)` — convenience method combining: `fillNextPaycheckDate` → `selectMissingPayFrequency` → `choosePlanByName`
- JS click bypass for NEXT button when SEON is present (`page.evaluate()` + `document.querySelectorAll('button')`)
- `ContractPage.isMissingEmploymentScreen()` — guard check before attempting to fill the employment form

**New `ContractPage` methods** (`src/pages/origination/contract.page.ts`):
- `dismissSeonOverlay()` — hides cross-origin SEON iframe blocking UI in sandbox
- `isMissingEmploymentScreen()` — detects `/complete` URL showing the empty planId screen
- `fillNextPaycheckDate(nextPayDate)` — fills date input + clicks NEXT (step 1)
- `selectMissingPayFrequency(frequency)` — selects from React Select + clicks NEXT via JS when SEON present (step 2)
- `waitForPlanSelectionScreen()` — waits for "Please review and select one of the programs below." heading
- `choosePlanByName(programName, index?)` — clicks matching payment program button
- `completeMissingEmploymentInfo(nextPayDate, frequency, programName?)` — full flow combining steps 1–3

**New selectors** (`src/selectors/common.selectors.ts`):
- `completeNextPaycheckInput` — `'input[type="search"]'`
- `completePayFrequencyCombobox` — `'[class*="react-select__control"]'`
- `completePlanSelectionHeading` — `'h2, [class*="heading"]'`
- `completeChooseProgramBtn` — `'button:has-text("Choose Payment Program")'`

**SEON discovery (sandbox-specific):** `secure-sandbox.uownleasing.com` shows a transparent SEON identity verification iframe (`[data-testid="seon-idv-iframe"]`) that intercepts pointer events. The iframe is cross-origin and cannot be dismissed via Playwright's normal interaction API. `dismissSeonOverlay()` hides it via `page.evaluate()`. For buttons still blocked after overlay dismiss, use explicit JS click via `page.evaluate(() => document.querySelectorAll('button')...)`.

---

### Submit Application Error Log Tests (Task #1240)

**E2E+API (`tests/taskTestingUown/RU03.26.1.50.0_trackAndDisplaySubmitApplicationErrors_1240/RU03.26.1.50.0_trackAndDisplaySubmitApplicationErrors_1240.spec.ts`):**
Validates the Error Log page (`/errorLog`) in the Origination portal, which tracks and displays errors from Send Application and Submit Application flows. Uses `ErrorLogPage` (extends `OriginationBasePage`) and `MerchantClient.getSubmitApplicationErrorLogs()`. Environment: QA1. Contains 5 tests.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | E2E | Navigate to `/errorLog` → verify Send Application tab is active by default | Page loads; Send Application tab has `aria-selected="true"` |
| CT-02 | E2E | Click Submit Application tab → verify tab switch | Submit Application tab becomes active; table headers match expected schema |
| CT-03 | E2E | Apply date range filter on Submit Application tab → submit | Filter accepted without error; results table updates |
| CT-04 | API | `GET /uown/getSubmitApplicationErrorLogs` via `MerchantClient` | 200 OK; response contains `logs: SubmitApplicationErrorLog[]`, `totalCount`, `moreResults` |
| CT-05 | E2E | Apply search filter on Submit Application tab → verify results | First row data accessible via `getFirstRowData()` keyed by header name |

**Key patterns used:**
- `ErrorLogPage` — extends `OriginationBasePage`; location `src/pages/origination/error-log.page.ts`
- `.tab-pane.active` scoping — ALL filter interactions scoped to the active tab panel to avoid false positives from the Origination nav bar search input (which shares the same `input[name='search']` selector). See `context/test-patterns.md` → "Tab Panel Scoping" section
- `getByRole('tab', { name: '...' })` + `aria-selected` — preferred method for checking tab active state (more reliable than CSS class inspection)
- `getByRole('button', { name: 'Search' })` scoped to `.tab-pane.active` — disambiguates from other "Search" buttons on the page
- `expandFilters()` idempotent — checks `.collapse.show` class before toggling; safe to call multiple times
- `getTableColumnHeaders()` — strips sort indicator characters (`▲▼△▽↑↓`) from header text and filters hidden headers
- `api.merchant.getSubmitApplicationErrorLogs(from, to, options?)` — `MerchantClient` method; `from`/`to` are ISO date strings; optional `{ search?, pageNumber?, maxResults? }`

**New API response types (`src/api/responses/merchant.response.ts`):**
- `SubmitApplicationErrorLog` — `pk`, `message`, `leadPk`, `merchantPk`, `refMerchantCode`, `merchantName`, `locationName`, `firstName`, `lastName`, `last4ssn`, `first5Cc`, `last4Cc`, `rowCreatedTimestamp`, `rowUpdatedTimestamp`, `tenantId`, `webUserId`, `agent`
- `SubmitApplicationErrorLogSearchResults` — `logs: SubmitApplicationErrorLog[]`, `totalCount`, `moreResults`

**New page object:**
- `src/pages/origination/error-log.page.ts` — `ErrorLogPage` extends `OriginationBasePage`

**Selectors** (prefix `el` = Error Log): `elTabSendApplication`, `elTabSubmitApplication`, `elFilterFromDate`, `elFilterToDate`, `elFilterSearch`, `elFilterSubmitButton` — defined in `src/selectors/common.selectors.ts`.

---

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
│   ├── merchant.client.ts
│   ├── account.client.ts
│   ├── payment-arrangement.client.ts
│   └── svc-payoff.client.ts
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
    ├── account.response.ts
    ├── merchant.response.ts
    ├── payment-arrangement.response.ts
    ├── svc-payoff.response.ts
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

### Date Helpers for API Fields

Use the correct date helper depending on how the Java backend deserializes the field:

| Helper | Format | Use when |
|--------|--------|----------|
| `calculateDate(offset)` | `MM/DD/YYYY` | Fields serialized as `String` or `MM/DD/YYYY` on the Java side |
| `calculateDateISO(offset)` | `YYYY-MM-DD` | Fields deserialized as Java `LocalDate` (e.g., `postingDate` in payment arrangements, ACH payments) |

```typescript
import { calculateDateISO } from '@helpers/date.helpers.js';

// For API fields that map to Java LocalDate (e.g., postingDate in AchPaymentInfo):
const today = calculateDateISO(0);    // '2026-03-17'
const inFiveDays = calculateDateISO(5); // '2026-03-22'
const fiveDaysAgo = calculateDateISO(-5); // '2026-03-12'
```

> If `postingDate` is sent as `MM/DD/YYYY` to a Java `LocalDate` field, Jackson throws a deserialization error. Always use `calculateDateISO()` for payment arrangement and ACH payment body fields.

### ACH Payment Arrangement — achProcessType

When creating ACH payment arrangements via `buildAchArrangementBody()`, the field `achProcessType: 'REQUEST'` is always included automatically. This is required for the `sendACHPaymentsSweep` SQL to pick up the payment regardless of due-date proximity:

```
sendACHPaymentsSweep SQL condition:
  posting_date <= CURRENT_DATE + 1   (standard auto-pay — requires receivable due soon)
  OR ach_process_type = 'REQUEST'    (payment arrangement — always picked up)
```

Without `achProcessType: 'REQUEST'`, an ACH arrangement payment would only be sent if there is a receivable due within 1 day, causing test failures on accounts with no upcoming receivables.

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

## Known Issues and Technical Debt

This section tracks deviations from project standards that are documented but not yet resolved. Each entry includes its severity, location, and the reason it was deferred.

### Medium — expect() inside page objects (verify* methods)

`DueDateMovesHistoryPage` and `FrequencyChangesHistoryPage` contain `verify*` methods that call `expect()` internally. This violates the project rule that page objects must not contain assertions (they should return values; tests assert).

**Affected files:**
- `src/pages/servicing/due-date-moves-history.page.ts` — `verifyColumnHeaders()`, `verifyFirstRowFormats()`
- `src/pages/servicing/frequency-changes-history.page.ts` — `verifyColumnHeaders()`, `verifyFirstRowFormats()`

**Why deferred:** The callers (test specs) depend on these methods emitting assertions. Refactoring requires simultaneous changes to both the page objects and the test files. The code is functionally correct.

**Fix approach:** Extract return types (e.g., `getColumnHeaders(): Promise<string[]>`, `getFirstRowData(): Promise<Record<string, string>>`), remove `expect()` from page objects, and add assertions in tests.

### Medium — Diagnostic spec files outside the standard directory pattern

Temporary diagnostic/investigation spec files exist outside the `tests/taskTestingUown/{name}/{name}.spec.ts` pattern:

| File | Issue |
|------|-------|
| `tests/taskTestingUown/diag.spec.ts` | Uses `db.executeUpdate` with UPDATE; `page.waitForTimeout`; flat placement |
| `tests/taskTestingUown/dom-diagnostic.spec.ts` | Uses `page.waitForTimeout(5000)`; flat placement |
| `tests/taskTestingUown/check-json.spec.ts` | SELECT only; flat placement |

These files are outside the Playwright `task-testing` project glob pattern but may be picked up by broader test runs. They should be cleaned up or moved to the correct subdirectory structure when the investigations are complete.

### Low — `body as never` casts in 476 spec

`tests/taskTestingUown/Tasks/.../476.spec.ts` uses `body as never` (4 occurrences) to bypass TypeScript type checking on `sendApplication()` calls. The correct fix is to use `buildSendApplicationBody()` with properly typed arguments.

**Pattern to avoid:**
```typescript
// WRONG
await api.application.sendApplication(merchant, applicant, order, body as never);

// CORRECT
const body = buildSendApplicationBody(merchant, applicant, order);
await api.application.sendApplication(merchant, applicant, order);
```

### Low — Misleading constant name `TEST_CARDS.VISA_APPROVED`

`src/config/constants.ts` — `TEST_CARDS.VISA_APPROVED` is actually a Mastercard (BIN 5146) used with `ccType: 'VISA'` in test bodies. The name is misleading.

This was discovered during the planId/submitApplication flow work (Task #476/#1242). The constant works correctly for approvals but the name may confuse future contributors. A rename to `TEST_CARDS.MASTERCARD_5146_APPROVED_AS_VISA` (or similar) would improve clarity.

### Low — testData without runId/email in GDS-bypass specs

`tests/.../446.spec.ts` and `tests/.../502.spec.ts` use `existingAccountPks` (GDS bypass) and therefore omit `runId`/`email` from `testData`. This is functionally correct (no application is created) but deviates from the standard `testData` structure.

When these tests are updated to support full application creation flows (when GDS is available), `runId` and `email` fields should be added back.

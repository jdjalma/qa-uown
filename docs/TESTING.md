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

**API-only (planned — not yet implemented):**
Pure API lifecycle test covering `sendApplication` -> invoice -> CC auth -> submit -> SIGNED -> settle -> FUNDED. Would cover the full lifecycle up to FUNDED without browser interaction (refund is only available via the PayTomorrow portal UI).

> **Status:** This API-only test is documented but not yet created in `tests/api/`.

**Key patterns used:**
- `email.getEmailLink(recipientEmail, urlPattern)` — polls IMAP for an email containing a URL matching the pattern (e.g., `/paytomorrow\.com/i`)
- `PayTomorrowPortalPage` — page object for the external PayTomorrow merchant portal (extends `BasePage` directly)
- `api.lead.updateFundingStatus(leadPks, status)` — updates funding status for leads (e.g., FUNDING -> FUNDED)

### LeadShortCode Migration Validation Tests

> **Status:** Spec file removed. Documentation preserved for reference patterns.

**API+DB (previously `tests/api/R1.49.1_separateShortCodeInANewEntity_469.spec.ts`):**
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

> **Status:** Spec file removed. Documentation preserved for reference patterns.

**API+DB (previously `docs/taskTestingUown/RU02.26.1.49.1_gdsLambdaSegment_472.spec.ts`):**
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

> **Status:** Spec file removed. Documentation preserved for reference patterns.

**API+DB (previously `docs/taskTestingUown/RU02.26.1.49.1_uownSvcUnderWritingProgramSelectionAndRouting13Vs16Months_439.spec.ts`):**
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

**E2E (`docs/taskTestingUown/R1.50.0_improveFinalCompletionScreen_1209/R1.50.0_improveFinalCompletionScreen_1209.spec.ts`):**
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

**API+DB (`docs/taskTestingUown/RU03.26.1.50.0_atlogAiPaymentArrangementSettlement_446/RU03.26.1.50.0_atlogAiPaymentArrangementSettlement_446.spec.ts`):**
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

**E2E+Hybrid (planned — not yet implemented):**
Complementary UI tests for the Payment Arrangement feature. Validates the Servicing Portal Make Payment modal and SETTLEMENT account status rendering. Uses the `servicing-ui` Playwright project (storageState: `.auth/servicing.json`). Environment: QA1.

> **Status:** This test spec is documented but not yet created in `tests/e2e/servicing/`. The API+DB spec (above) is the active test.

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

### Fix Payment Arrangement Status Tests (Task #483)

**API+DB+E2E (`docs/taskTestingUown/RU04.26.1.50.2_fixPaymentArrangementStatus_483/RU04.26.1.50.2_fixPaymentArrangementStatus_483.spec.ts`):**
Validates the payment arrangement status transitions for CC approved, CC denied, and future-dated multi-installment scenarios. Uses GDS bypass with pre-seeded ACTIVE KS3015 accounts in QA1. Merchant: FifthAveFurnitureNY (KS3015). Project: `task-testing`. Environment: QA1.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | API+DB | CC APPROVED — single installment, today | `status=SUCCESS`, `is_active=false` immediately after `makeCreditCardPayments` |
| CT-02 | API+DB | CC DENIED — single installment, today, declined card | `status=FAILED`, `is_active=false` |
| CT-03 | API+DB | Future-dated 3-installment arrangement | `status=NOT_STARTED`, `is_active=true`; installments created with future dates |

**Key patterns used:**
- CT-03 queries its account lazily inside the test (not in `beforeAll`) — CT-01 frees its account after synchronous CC SUCCESS (`is_active=false`), allowing account reuse with fewer test accounts
- `ServicingBasePage.makeCcPaymentArrangement({ startDate, endDate, frequency, ccDetails? })` — extended to accept optional `ccDetails` for one-time card entry when the account has a card on file
- `ccDetails` shape: `{ firstName, lastName, cardNumber, cvc, expMonth, expYear }` — when provided, clicks "Use one-time card information" radio and fills the manual entry form

**UI: one-time card form in Make Payment modal:**
When an account has a card on file, the payment arrangement modal shows two radios:
- "Use existing card information" (selected by default)
- "Use one-time card information" (reveals manual entry fields)

Manual entry fields (plain inputs with `placeholder` attributes — NOT React Select):
- `input[placeholder='First Name']` — `CreditCardSelectors.otCardFirstName`
- `input[placeholder='Last Name']` — `CreditCardSelectors.otCardLastName`
- `input[placeholder='Expires On']` — `type="month"` input; **requires `YYYY-MM` format**
- `input[placeholder='Card Security Code']` — `CreditCardSelectors.otCardSecurityCode`
- "Use current address" checkbox

**Critical: `type="month"` input format:**
HTML `input[type="month"]` filled via Playwright's `fill()` requires `YYYY-MM` format (e.g., `2028-12`). Using `MM/YY` or `MM/YYYY` causes `Error: Malformed value`. Always convert before filling:
```typescript
const fullYear = expYear.length === 2 ? `20${expYear}` : expYear;
await locator.fill(`${fullYear}-${expMonth}`);
```

**Report:** `docs/taskTestingUown/RU04.26.1.50.2_fixPaymentArrangementStatus_483-report.md`

### Due Date Moves History Tests (Task #502)

**E2E+API+DB (`docs/taskTestingUown/RU03.26.1.50.0_addDueDateMovesPageInHistoryMenu_502/RU03.26.1.50.0_addDueDateMovesPageInHistoryMenu_502.spec.ts`):**
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

**E2E+API (`docs/taskTestingUown/RU03.26.1.50.0_addFrequencyChangesPageInHistoryMenu_503/RU03.26.1.50.0_addFrequencyChangesPageInHistoryMenu_503.spec.ts`):**
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

### Money Factor Display Format and Program Details Page Tests (Tasks #1251, #1252)

**E2E (`docs/taskTestingUown/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251.spec.ts`):**
Validates that the Money Factor column in the Origination Programs table displays the value multiplied by 100 with trailing zeros removed (`toMoneyFactorDisplayValue`), matching the format already used in the edit form and Program Settings. Environment: QA2. Project: `task-testing`.

**E2E (`docs/taskTestingUown/RU04.26.1.51.0_createProgramDetailsPage_1252/RU04.26.1.51.0_createProgramDetailsPage_1252.spec.ts`):**
Validates the new `/programs/:pk` route (R1.51.0) which replaces the previous inline-edit pattern. Covers deep-link access, F5/reload persistence, back/forward browser navigation, Clone/Clone Group button presence, Activity Log panel, and edit+save round-trip. Environment: QA2. Project: `task-testing`.

| CT | Task | Type | Flow | Key Assertions |
|----|------|------|------|----------------|
| CT-01 | #1251 | E2E | Login → Programs table | Money Factor column shows `dbValue * 100` (e.g. DB `0.1846` → table `"18.46"`) |
| CT-02 | #1251 | E2E | Programs table → click program → details form | `tableValue === formValue`; URL contains `/programs/` |
| CT-03 | #1251 | E2E | Direct URL `/programs/:pk` → form | `formValue === toMoneyFactorDisplayValue(dbValue)`; `%` icon visible adjacent to input |
| CT-04 | #1251 | Hybrid (DB + E2E) | Fresh DB query → table → form | End-to-end chain: DB raw → table x100 → form x100, all identical |
| CT-05 | #1252 | E2E | Click program in table → URL change | URL matches `/programs/\d+`; loaded program name = clicked name |
| CT-06 | #1252 | E2E | Direct URL `/programs/:pk` | URL stays `/programs/{pk}` after load; form shows correct program name |
| CT-07 | #1252 | E2E | Direct URL → `page.reload()` | URL unchanged after F5; `nameAfter === nameBefore` |
| CT-08 | #1252 | E2E | Click program → `goBack()` → `goForward()` | Back: URL = `/programs`; Forward: URL = `/programs/{pk}` |
| CT-09 | #1252 | E2E | Direct URL → UI elements | Clone button visible; Clone Group button visible; Activity Log panel visible |
| CT-10 | #1252 | E2E | Direct URL → edit Amount at Signed → save | Toast "Program saved successfully"; saved value matches `55` or `55.00`; cleanup restores original |
| CT-11 | #1252 | Hybrid (DB + E2E) | Click program → extract PK from URL | `parseInt(pkFromUrl) === dbProgramPk` |

**Test result (2026-04-01, qa2):** 3 passed (CT-01 #1251, CT-08 #1252, CT-11 #1252), 8 skipped gracefully — backend svc on R1.50.0 (`GET /uown/programs/:pk` not yet deployed). Tests will pass automatically when svc upgrades to R1.51.0.

**Key patterns used:**
- `ProgramsPage.getMoneyFactorTableValue(programName)` — reads Money Factor column from list table
- `ProgramsPage.getMoneyFactorFormValue()` — reads `input[name='moneyFactor']` from edit form
- `ProgramsPage.navigateToProgramDetails(originationUrl, programPk)` — direct URL navigation to `/programs/:pk`
- `ProgramsPage.waitForProgramDetailsLoad()` — returns `boolean`; `false` triggers graceful skip when backend unavailable
- `ProgramsPage.navigateToPrograms()` — calls `showMaxRows()` + `networkidle` wait to load 100 rows/page, reducing pagination from ~182 to ~18 pages
- `ProgramsPage.nextPage()` — waits for `networkidle` + `tableRow.first().waitFor(visible)` to fix DataTable race condition on page turn
- `ProgramsPage.isCloneButtonVisible()` — matches `button, a` (Clone is an `<a>` link, not a `<button>`)
- Graceful skip pattern: `beforeAll` checks DB availability + backend feature flag; each CT calls `test.skip(!condition, reason)` as first line
- `test.describe.configure({ mode: 'serial' })` — required to share `let` context variables across CTs in the same describe block

**Report:** `docs/taskTestingUown/RU04.26.1.51.0_programs-1251-1252-report.md`

---

### Pagination Enforcement After Program Clone Action Tests (Task #1214)

**E2E (`docs/taskTestingUown/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214.spec.ts`):**
Validates that the Programs list respects the rows-per-page setting after a Clone Group action. Before this fix, cloning a program group reset the pagination and displayed all cloned rows (potentially hundreds) on a single page. Environment: QA2. Project: `task-testing`.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | E2E | Login → Programs → Clone Group → inspect page 1 | `rowsAfterClone === 10`; `rowsPerPageValue === "10"` |
| CT-02 | E2E | After CT-01 → navigate to page 2 | `rowsOnPage2 === 10` (pagination remains applied on subsequent pages) |

**Test result (2026-04-01, qa2):** 2/2 passed. CT-01: rowsAfterClone=10, rowsPerPage="10" ✅. CT-02: rowsOnPage2=10 ✅.

**Key patterns used:**
- `ProgramsPage.openCloneGroupModal()` — opens the Clone Group modal on the details page
- `ProgramsPage.fillCloneGroupName(name)` — fills the group name input in the modal
- `ProgramsPage.selectAllProgramsInModal()` — clicks "Select All" to select all programs
- `ProgramsPage.submitCloneGroupModal()` — clicks SAVE to submit the modal
- `ProgramsPage.waitForCloneGroupSuccess()` — waits for toast "Programs successfully cloned!"
- `ProgramsPage.getTableRowCount()` — counts visible `.rdt_TableRow` elements after the clone
- `ProgramsPage.getRowsPerPageValue()` — reads the rows-per-page dropdown to confirm it was not reset
- `test.describe.configure({ mode: 'serial' })` — CTs share the `clonedGroupName` variable set in CT-01

**Report:** `docs/taskTestingUown/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214-report.md`

---

### Invoice Number Column and Search Filter Tests (Task #1253)

**Hybrid E2E+DB (`docs/taskTestingUown/RU04.26.1.51.0_addInvoiceNumberColumnAndSearchFilterToLeadsPage_1253/RU04.26.1.51.0_addInvoiceNumberColumnAndSearchFilterToLeadsPage_1253.spec.ts`):**
Validates the new "Invoice Number" column and filter field on the Origination portal Leads page (R1.51.0). No new applications are created — tests use existing DB data discovered at runtime in `beforeAll`. Environment: QA1. Project: `task-testing`.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | E2E | Login → Leads → get table headers | "Invoice Number" column exists; positioned immediately after "Term Month" |
| CT-02 | Hybrid (DB + E2E) | DB: find lead with invoice → filter by Lead PK | Row "Invoice Number" cell = value from `uown_los_invoice.merchant_invoice_number` |
| CT-03 | Hybrid (DB + E2E) | DB: find lead without invoice → filter by Lead PK | Row "Invoice Number" cell is empty (LEFT JOIN → null) |
| CT-04 | E2E | Login → Leads → expand filters | Filter panel contains "Invoice Number" input with `placeholder='Search by Invoice Number'` |
| CT-05 | Hybrid (DB + E2E) | DB: find known invoice number → apply Invoice Number filter | At least one row returned; every row shows the filtered invoice number |
| CT-06 | E2E | Apply Invoice Number filter with `INVALID-INV-QA-99999` | "There are no records to display" message shown |

**Key patterns used:**
- `LeadsPage.setInvoiceNumber(invoiceNumber)` — fills `input[placeholder='Search by Invoice Number']` in the filter panel
- `db.queryOne()` in `beforeAll` — discovers real leads with/without invoice numbers; CTs that need DB data use `test.skip` when data is unavailable (DB tunnel not active). **Note:** `queryOne()` is the primary single-row query method (not `getSingleRow`, which does not exist)
- `LeadsPage.getCleanHeaders()` — strips sort indicators (`▲▼△▽↑↓`) before comparing column positions
- `SELECTORS.leadsInvoiceNumberInput` — `"input[placeholder='Search by Invoice Number']"` in `LeadsTableSelectors`

**Data source:** `uown_los_invoice.merchant_invoice_number` — joined to `uown_los_lead` via `lead_pk` in the `getLeadsByCriteria` backend endpoint. Leads without an invoice record yield an empty column (LEFT JOIN).

---

### Banking Data Propagation from Approved Lead Tests (Task #484)

**API + DB (`docs/taskTestingUown/RU04.26.1.50.2_propagateBankingDataFromApprovedLeadToNewLead_484/RU04.26.1.50.2_propagateBankingDataFromApprovedLeadToNewLead_484.spec.ts`):**
Validates the new `BankDataStep` inserted into the `sendApplication` pipeline (after `underwritingCheck`). When a returning customer applies without banking data, and their most recent approved lead had banking data with `source=SEND_APP` and was eligible for 16-month terms, the banking data is automatically copied to `uown_los_bank_account` on the new lead. Environment: QA2. Merchant: Kornerstone (`GOW-0003_clone_fer_ks`). Project: `task-testing`.

**Propagation conditions (all must be true):**
1. Config flag `saveBankDataFromPreviousLead` = true (default)
2. UW status = APPROVED
3. `eligibleTerms` contains `"16"` (Kornerstone / 16-month merchant)
4. `previousUW` is not blank (returning customer)
5. Request does NOT include banking data (`mainBankAccountNumber` absent)
6. Previous lead has a bank account record with `source = SEND_APP`

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-00 | API setup | `sendApplication` (Kornerstone, with banking data) | `authorizationNumber` > 0; bank record saved with `source=SEND_APP` |
| CT-01 | API + DB (graceful) | Returning customer, Kornerstone, no banking in request | Banking data propagated to new lead; `account_number`/`routing_number` match CT-00 lead |
| CT-02 | API + DB (graceful) | Returning customer, Kornerstone, banking data in request | BankDataStep skips propagation; new lead uses request banking data (Bank of America) |
| CT-03 | API + DB (graceful) | Returning customer, TerraceFinance (13m only), no banking in request | No propagation — `eligibleTerms` does not contain `"16"` |
| CT-04 | API + DB (graceful) | Returning customer, Kornerstone, previous lead had no bank accounts | No propagation — previous lead has no `uown_los_bank_account` records |
| CT-05 | API + DB (graceful) | New customer (no previousUW), Kornerstone, no banking in request | No propagation — first application, `previousUW` is blank |
| CT-06 | API + DB (graceful) | Field-level integrity check (inline in CT-01) | `account_number`, `routing_number`, `source` identical between leads; `lead_pk` differs |

**Test result (2026-04-02, qa2):** 7/7 passed. DB validations executed with graceful skip — SSH tunnel to qa2 not active; propagation confirmed indirectly via `authorizationNumber > 0` in all scenarios.

**Key patterns used:**
- `api.application.sendApplication(merchant, applicant, order)` — drives `sendApplication` pipeline including `BankDataStep`; `authorizationNumber > 0` confirms UW_APPROVED
- Graceful DB handling: DB queries wrapped with try/catch; `test.skip` when tunnel unavailable — API-level assertions always run
- Two-step setup per negative CT: create "previous" lead first (step 1), then apply as returning customer (step 2)
- `mainBankAccountNumber` / `mainBankRoutingNumber` presence in request body controls whether `BankDataStep` propagates or skips
- `Kornerstone` merchant (`GOW-0003_clone_fer_ks`) used for propagation CTs — 16-month eligible, valid for qa2
- `TerraceFinance` merchant (`OL90202-0001`) used for CT-03 — 13-month only, confirms `eligibleTerms` guard

**DB table:** `uown_los_bank_account` — columns: `pk`, `lead_pk`, `account_number`, `routing_number`, `bank_name`, `bank_account_type`, `source`, `is_deleted`

**Report:** `docs/taskTestingUown/RU04.26.1.50.2_propagateBankingDataFromApprovedLeadToNewLead_484-report.md`

---

### Term Month Column Verification Tests (Task #1242)

**Hybrid E2E+API (`docs/taskTestingUown/RU03.26.1.50.0_displaySelectedTermMonthInOverviewAndLeadsTables_1242/RU03.26.1.50.0_displaySelectedTermMonthInOverviewAndLeadsTables_1242.spec.ts`):**
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

### Bank Account Rating Letter Validation Tests (Task #497)

**E2E+API+DB (`docs/taskTestingUown/RU04.26.1.51.0_bankAccountRatingLetterValidation_497/RU04.26.1.51.0_bankAccountRatingLetterValidation_497.spec.ts`):**
Validates the Servicing portal bank account management flow and rating letter generation (R1.51.0). Covers adding/removing bank accounts via UI and API, default payment source updates, ACH funding path, activity log and rating change log entries. Environment: QA2. Project: `task-testing`. 6 CTs, all passing.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | E2E | Login → Servicing customer → Add bank account modal → fill + save | Bank account appears in account list; `getAccountNumberLastFour()` matches |
| CT-02 | E2E+DB | Add bank account → DB query | `getBankAccountsByAccountPk` returns new record; `is_deleted = false` |
| CT-03 | E2E+API | Delete bank account via UI | Row disappears from modal; `waitForBankAccountDeleted` confirms DB state |
| CT-04 | API | `api.bankAccount.createBankAccount` → `getBankAccounts` | Response contains created account; PK matches |
| CT-05 | API+DB | `api.bankAccount.deleteBankAccount` → `waitForBankAccountDeleted` | DB record marked deleted |
| CT-06 | E2E+API+DB | Full ACH flow: create account → set default payment → activity log + rating log | `getBankAccountActivityLogs` + `getRatingChangeLogs` contain expected entries |

**Key patterns used:**
- `BankAccountPage` — new page object for Servicing bank account modals (`.modal.show` scoping)
- `api.bankAccount` — typed client wired in `ApiClients` (`src/support/base-test.ts`)
- `db.getBankAccountsByAccountPk` / `db.waitForBankAccountDeleted` — DB polling helpers
- `db.getBankAccountActivityLogs` / `db.getRatingChangeLogs` — log validation helpers
- `BankAccountModalSelectors` in `src/selectors/selector.types.ts` — 19 entries scoped to `.modal.show`

**Report:** `docs/taskTestingUown/RU04.26.1.51.0_bankAccountRatingLetterValidation_497/RU04.26.1.51.0_bankAccountRatingLetterValidation_497-report.md`

---

### Multi-Select Filters — MMH / Modification Report / Funding Queue (Task #1319)

**E2E (`docs/taskTestingUown/R1.52.0_multiSelectFiltersMMHModReportFunding_1319/R1.52.0_multiSelectFiltersMMHModReportFunding_1319.spec.ts`):**
Validates the multi-select Merchant/Location filter component (originally shipped in #1292) extended in R1.52.0 to three remaining Origination pages: Merchant Modification History (`/merchantModificationHistory`), Modification Report (`/modificationReport`), and Funding Queue (`/funding`). The component DOM is shared across pages but behavior diverges per page (see divergence notes below). Environment: QA2. Project: `task-testing`.

> **Status:** spec created; NOT yet validated by `qa-validator` (no report). Two items remain `[HYPOTHESIS]` (see KB) — the Funding Queue endpoint (`getLeadsForFundingQueue`) and the sweep names `dailyRefundReportSweep`/`dailyRefundedReportSweep`.

| CT | Page | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | MMH | Multi-merchant filter | Result table Merchant column ⊆ selected merchants |
| CT-02 | MMH | Location (dependent on Merchant) | Location disabled until a Merchant is selected (BR-01); then filterable |
| CT-03 | Modification Report | Multi-merchant filter | Result table Merchant column ⊆ selected merchants |
| CT-04 | Funding Queue | Multi-status (Funded + Refunded) | Default "Funding" cleared first; rows reflect the selected statuses |
| CT-05 | Funding Queue | Multi-merchant | Merchant column ⊆ selected merchants (Location independent — BR-02) |
| CT-06 | Funding Queue | Status "Select All" | All 4 statuses (Funding/Funded/Request Refund/Refunded) selected |

**Key patterns used:**
- `MerchantModHistoryPage` / `ModificationReportPage` / `FundingPage` — `filterByMerchants([])` + `applyFilters` (MMH/ModReport) / `applyFiltersMulti` (Funding); legacy single-select `filterByMerchant`/`filterByLocation` kept (deprecated)
- `MerchantLocationFilterPO.applySearch` — regex extended to the 3 new Search endpoints (`getMerchantDataChangeResults`, `getModifiedLeads`, `getLeadsForFundingQueue`)
- `FundingPage.filterByStatuses([])` — clears the default pre-selected "Funding" status before applying (pitfall #122); `selectAllStatuses` / `statusFilterHasSelectAll` for the Status-only "Select All"
- `paginationPrevious` selector (`#pagination-previous-page`) added to `PaginationSelectors` for `goToPreviousPage`
- 2 report sweeps added to `tests/e2e/servicing/report-sweeps-servicing.spec.ts` `REPORT_SWEEPS` (`dailyRefundReportSweep`, `dailyRefundedReportSweep`; 15 → 17)

**Page-specific divergences (do NOT copy assumptions across pages):** MMH/ModReport disable Location until a Merchant is selected (BR-01); Funding Location is independent (BR-02); Funding Status pre-selects "Funding" on load (BR-03) and is the only filter with "Select All". See application-lifecycle pitfalls #121/#122 and KB `docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md`.

---

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

**E2E Hybrid (`docs/taskTestingUown/RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233/RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233.spec.ts`):**
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

**Known bug (BUG-01):** SSN `888888888` causes a NullPointerException in the backend (500 error). The test uses auto-generated approved SSNs instead. Documented in `docs/taskTestingUown/1233-bugs.md`.

### Fix PlanId Condition When NextPayDate Is Not Provided (Task #476)

**API+E2E (`docs/taskTestingUown/Tasks/RU03.26.1.50.0_fixPlanIdConditionWhenNextPayDateIsNotProvided_476/RU03.26.1.50.0_fixPlanIdConditionWhenNextPayDateIsNotProvided_476.spec.ts`):**
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

**E2E+API (`docs/taskTestingUown/RU03.26.1.50.0_trackAndDisplaySubmitApplicationErrors_1240/RU03.26.1.50.0_trackAndDisplaySubmitApplicationErrors_1240.spec.ts`):**
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
- `.tab-pane.active` scoping — ALL filter interactions scoped to the active tab panel to avoid false positives from the Origination nav bar search input (which shares the same `input[name='search']` selector). See skill [[e2e-examples]] (Tab Panel Scoping pattern)
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

### Podium API Integration Tests (Task #442)

**Hybrid E2E+API+DB (`docs/taskTestingUown/RU03.26.1.50.0_uownSvcPodiumApiIntegration_442/RU03.26.1.50.0_uownSvcPodiumApiIntegration_442.spec.ts`):**
Validates the Podium API integration in the Servicing portal. Podium is a reviews-management platform; the integration adds a "Send Podium Link" button inside the Send Invite modal (`#invitation`), gated by the `send_podium_link` permission. Includes Flyway migration for `uown_podium_token` (OAuth2 token lifecycle), API endpoint `POST /uown/svc/accounts/{pk}/podium-link`, and logging to `sv_outbound_api_log`. Environment: QA1. Project: `task-testing`.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | DB | Query `flyway_schema_history` + `information_schema.columns` | Migration `V20260317121000__create_podium_token_table.sql` applied with `success=true`; table has all 7 expected columns |
| CT-02 | E2E | Login as ADMIN → navigate to account 4438 → open Send Invite modal | `isPodiumLinkButtonVisible()` returns `true` (user has `send_podium_link` permission) |
| CT-03 | E2E | Open Send Invite modal → click "Send Podium Link" → confirm | Toast text: `"Podium invitation sent successfully."` |
| CT-04 | DB | Query `uown_podium_token` after invite send | At least 1 token row; `access_token` non-null; `expiration_time` non-null (token lifecycle active) |
| CT-05 | DB | Query `sv_outbound_api_log` for Podium call record | SKIPPED — `sv_outbound_api_log` inaccessible via test DB connection (SVC schema may be separate) |
| CT-06 | API | `POST /uown/svc/accounts/999999999/podium-link` (invalid accountPk) | HTTP 400; `errorMessage: "No primary customer found for this account."` |
| CT-07 | E2E | Login as supervisor (no `send_podium_link`) → open Send Invite modal | `isPodiumLinkButtonVisible()` returns `false` (PENDING — awaits execution with DB tunnel active) |

**Key patterns used:**
- `ServicingCustomerPage.openSendInviteModal()` — clicks `#invitation`, forces Bootstrap modal `show` class via JS (CSS animations disabled prevent automatic class addition)
- `ServicingCustomerPage.isPodiumLinkButtonVisible()` — returns `true` if "Send Podium Link" button is visible inside the InviteModal
- `ServicingCustomerPage.sendPodiumLink()` — full flow: open modal → click "Send Podium Link" (force: true) → confirm in ConfirmationModal → wait for toast; returns toast text
- `LoginPage` dynamic login override — CT-07 uses `LoginPage.login(supervisorUser, supervisorPassword)` to re-authenticate within the test as a different role
- `api.account.sendPodiumLink(accountPk)` — `AccountClient` method; `POST /uown/svc/accounts/{pk}/podium-link`; returns `PodiumInvitationResponse`
- `db.flywayMigrationApplied(version)` — validates Flyway migration applied with `success=true`
- Permission-gated UI: Bootstrap `InviteModal` from `@uownleasing/common-ui`; "Send Podium Link" button rendered only when `hasSendPodiumLinkPermission = true`
- Click `"Send Podium Link"` uses `force: true` — React unmounts `InviteModal` during click handler, so standard click fails

**New response types (`src/api/responses/account.response.ts`):**
- `PodiumInvitationResponse` — `message?: string`, `errorMessage?: string`

**Known environment limitation:**
- `sv_outbound_api_log` is not accessible via the test DB connection — the SVC schema appears to be on a separate database or schema boundary. CT-05 is permanently skipped with an explanatory message.

---

### AMS New Page to Assign Merchants to User Tests (Task #74)

**E2E+API (`docs/taskTestingUown/RU04.26.1.51.0_uownAmsNewPageToAssignMerchantsToUser_74/RU04.26.1.51.0_uownAmsNewPageToAssignMerchantsToUser_74.spec.ts`):**
Validates the new `/associate-users-to-merchants` page in the AMS portal (R1.51.0). The page provides two side-by-side `react-data-table-component` tables (Users and Merchants), a Submit button that opens a Bootstrap confirmation modal, a success toast, and a Log Activity audit trail accessible at `/users/[username]`. Environment: QA2. Project: `task-testing`. All 9/9 tests passing.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-E2E-01 | E2E | Login → navigate to `/associate-users-to-merchants` | Page renders with two rdt tables (Users + Merchants) and Submit button |
| CT-E2E-02 | E2E | Select user (row 0) → verify selection info text updates | Users table selection info shows selected count |
| CT-E2E-03 | E2E | Select merchant (row 0) → verify selection info text updates | Merchants table selection info shows selected count |
| CT-E2E-04 | E2E | Pagination on Merchants table → next page | Page 2 merchants differ from page 1 content |
| CT-E2E-05 | E2E | Select user + merchant → click Submit → confirm modal → success | `amsAssocConfirmButton` clicked; success toast visible (`amsSuccessToast`) |
| CT-E2E-06 | E2E | Navigate to `/users/[username]` → verify Log Activity section | Log Activity `react-data-table-component` table present with columns: date, type, userId, notes |
| CT-E2E-07 | E2E | Navigate to `/users/[username]` → expand "Edit User Merchants" accordion → click pencil → type "KS15500" in React Select → select "45 Tires - KS15500" → SAVE → verify merchant tag → verify log count unchanged (10 → 10) | Merchant tag "45 Tires - KS15500" visible in read-only list; Log Activity count stays at 10 — UI edit does NOT generate a log entry |
| CT-API-01 | API | `POST /user/addMerchantsToUsers` — bulk assign | 200 OK; response body confirms assignment |
| CT-API-02 | API | `PUT /user/{username}` — update user info | 200 OK; triggers Log Activity entry |

**Key patterns used:**
- `AmsUserMerchantsPage` — two-table layout: Users (left, nth(0)) + Merchants (right, nth(1)); both are `react-data-table-component` rdt tables — scope all row/pagination locators by nth index to avoid cross-table selection
- `AmsUserDetailsPage.getLatestLogEntry()` — waits for first `.rdt_TableRow` to appear (race condition guard) then reads cells `[date, type, userId, notes]`; returns `null` if table empty
- `AmsUserDetailsPage.getLogEntries()` — returns all visible rows on first page; waits for `rows.first()` before counting to avoid stale empty count
- `clickSubmit()` — clicks Submit → waits for Bootstrap `.modal-footer button:has-text("Confirm")` → clicks Confirm → waits for success toast; wraps each step in `try/catch` for resilience
- Pagination: `.rdt_Pagination` is a sibling of `.rdt_Table` (not nested inside it) — scope to `nth(0)` / `nth(1)` matching the table index

**Critical finding — Log Activity behavior:**
- `POST /user/addMerchantsToUsers` (bulk assign) does **NOT** generate Log Activity entries in AMS
- The "Edit User Merchants" UI card (accordion on `/users/[username]`) also does **NOT** generate Log Activity entries
- Only `PUT /user/{username}` (updateUser endpoint) triggers an `"UPDATED user info: {...}"` log entry
- Log Activity section is a `react-data-table-component` table (`.rdt_TableRow`) — NOT a native `<table>`; use `.rdt_TableRow` / `[class*="rdt_TableCell"]` selectors

**Critical finding — Edit User Merchants UI:**
- The "Edit User Merchants" card is an **OVERWRITE** operation — replaces the entire merchant list; it is not additive
- Entering edit mode removes `span#EditUserMerchants-edit` from the DOM; use `:has(#merchants)` to scope the SAVE button, not `:has(span#EditUserMerchants-edit)`
- React Select options are rendered in a portal with class `index-module_customOptionStyles__CSG9m`; navigate via ArrowDown+Enter

**New selectors (`src/selectors/common.selectors.ts`):**

rdt base selectors (shared by both tables on the page):
- `amsRdtTable` — `.rdt_Table`
- `amsRdtTableRow` — `.rdt_TableRow`
- `amsRdtPagination` — `.rdt_Pagination` (sibling of `.rdt_Table`, NOT nested inside it)
- `amsPaginationNextButton` — `button[aria-label="Next Page"]`

Associate Users to Merchants page (`/associate-users-to-merchants`):
- `amsAssocPageSubmit` — `button:has-text("Submit")`
- `amsAssocRowCheckbox` — `input[name="select-row-undefined"]`
- `amsUsersSelectionInfo` — `[class*="selectable-users-table_selectionInfo"]`
- `amsMerchantsSelectionInfo` — `[class*="selectable-merchants-table_selectionInfo"]`
- `amsAssocConfirmButton` — `.modal-footer button:has-text("Confirm")`
- `amsSuccessToast` — `.Toastify__toast--success, .toast-success, .alert-success`

Log Activity and User Details page (`/users/[username]`):
- `amsLogActivityRow` — `.rdt_TableRow`
- `amsLogActivityCell` — `[class*="rdt_TableCell"]`
- `amsEditUserMerchantsButton` — `span#EditUserMerchants-edit` (removed from DOM in edit mode — use `:has(#merchants)` for SAVE scoping)
- `amsUserMerchantsCardToggle` — `'.card-header:has(span#EditUserMerchants-edit) #toggle-collapse'`
- `amsUserMerchantsCardCollapse` — `'.card:has(span#EditUserMerchants-edit) .collapse'`
- `amsUserMerchantsSelectControl` / `amsUserMerchantsSelectInput` — React Select `#merchants` using `filter__` prefix (`#merchants .filter__control` / `#merchants .filter__input`)
- `amsUserMerchantsSelectOption` — `[class*="customOptionStyles__CSG9m"]` (options rendered in a portal; use ArrowDown+Enter to navigate)
- `amsUserMerchantsTag` — `'.card:has(span#EditUserMerchants-edit) [class*="tag__snNpm"]'`
- `amsUserMerchantsSaveButton` — `.card:has(#merchants) button[class*="collapsableEdit__button__primary"]`

**Page objects (modified):**
- `src/pages/ams/ams-user-merchants.page.ts` — `AmsUserMerchantsPage` extends `AmsBasePage`; methods: `waitForMerchantsPage()`, `selectUserByUsername(username)` (searches current page only, returns boolean), `selectUserByIndex(index)` (returns username text), `selectMerchantByIndex(index)` (returns merchant code text), `getUsersRowCount()`, `getMerchantsRowCount()`, `clickMerchantsNextPage()` (DOM text-change detection for reliable pagination transition), `clickUsersNextPage()`, `getUsersSelectionText()`, `getMerchantsSelectionText()`, `getCurrentPageMerchants()` (returns `string[]` with row-visibility wait), `isMerchantsNextPageAvailable()`, `clickSubmit()` (handles Bootstrap confirmation modal + returns boolean success)
- `src/pages/ams/ams-user-details.page.ts` — `AmsUserDetailsPage` extends `AmsBasePage`; added `expandMerchantsCard()`, `clickEditMerchantsButton()`, `selectMerchantInEdit()`, `saveMerchantsEdit()`, `getMerchantTags()`, `getLatestLogEntry()` (returns `null` if table empty), `getLogEntries()` (waits for `rows.first()` before counting)
- `src/pages/ams/ams-base.page.ts` — `AmsBasePage`; base utilities for rdt tables

**Report:** `docs/taskTestingUown/RU04.26.1.51.0_uownAmsNewPageToAssignMerchantsToUser_74-report.md`

---

### Customer Portal Reminder Email Template Tests (Task #490)

**API+IMAP+DB (`docs/taskTestingUown/RU04.26.1.51.0_addNewCustomerPortalReminderEmailTemplate_490/RU04.26.1.51.0_addNewCustomerPortalReminderEmailTemplate_490.spec.ts`):**
Validates the new Customer Portal Reminder email template for both UOWN and Kornerstone tenants. The flow sends the Customer Portal Link via API, triggers the email queue sweep, and validates email delivery via IMAP and DB state. Environment: QA1. Project: `task-testing`. 8 scenarios (CT-01 through CT-08), all passing.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | API | `POST /uown/svc/sendCustomerPortalLink/{accountPk}` (UOWN account) | 200 OK; response contains `message` confirming invite queued |
| CT-02 | API+DB | Trigger `sendEmailsSweep` → poll `uown_email_queue` | Email record transitions from PENDING to SENT |
| CT-03 | API+IMAP | IMAP polling for Customer Portal email (UOWN template) | Email received; subject and body match UOWN template |
| CT-04 | API | Screenshot of rendered UOWN email HTML via Chromium | Screenshot attached to test report as evidence |
| CT-05 | API | `POST /uown/svc/sendCustomerPortalLink/{accountPk}` (Kornerstone account) | 200 OK; response confirms Kornerstone invite queued |
| CT-06 | API+DB | Trigger `sendEmailsSweep` → poll `uown_email_queue` for Kornerstone | Email record transitions from PENDING to SENT |
| CT-07 | API+IMAP | IMAP polling for Customer Portal email (Kornerstone template) | Email received; subject and body match Kornerstone template |
| CT-08 | API | Screenshot of rendered Kornerstone email HTML via Chromium | Screenshot attached to test report as evidence |

**Key patterns used:**
- `api.account.sendCustomerPortalLink(accountPk)` — `AccountClient` method; `POST /uown/svc/sendCustomerPortalLink/{accountPk}`; returns `PortalInvitationResponse`
- `api.scheduledTask.sendEmailsSweep()` — `ScheduledTaskClient` method; `POST /uown/svc/sendEmailsSweep`; triggers processing of all PENDING emails in the queue
- `email.getEmailContent(recipientEmail, subjectPattern)` — IMAP polling via `imapflow` (Gmail) to retrieve delivered email
- `api.svcEmail.createOrUpdateEmail(body)` — used for test setup to set a known email address on the test account; original email is restored in `afterEach` cleanup
- DB validation via `uown_email_queue` queries — polls for email status transition (PENDING → SENT) with exponential backoff
- Chromium screenshot of rendered email HTML — email body rendered in a headless browser page; screenshot attached as test evidence

**New API methods:**

| Client | Method | Endpoint | Returns |
|--------|--------|----------|---------|
| `AccountClient` | `sendCustomerPortalLink(accountPk)` | `POST /uown/svc/sendCustomerPortalLink/{accountPk}` | `PortalInvitationResponse` |
| `ScheduledTaskClient` | `sendEmailsSweep()` | `POST /uown/svc/sendEmailsSweep` | — |

**New response type (`src/api/responses/account.response.ts`):**
- `PortalInvitationResponse` — `{ message?: string; errorMessage?: string }`

---

### Remove CC Information from AuthorizeCreditCard Endpoint Tests (Task #507)

**API (`docs/taskTestingUown/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507.spec.ts`) + E2E (`docs/taskTestingUown/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507-e2e.spec.ts`):**
Validates that `POST /uown/los/authorizeCreditCard` returns a slim DTO after the security patch (R1.51.1). The endpoint must expose only the allow-listed fields `{ status, error, errorCode, preAuthStatus }` and must NOT return any gateway, token, CC number, or transaction data. Full Gherkin scenario mapping: 12/12 covered across 7 API CTs + 2 E2E CTs. Environment: stg. Project: `task-testing`. 8 API passed + 3 E2E passed in stg.

**API spec — 7 CTs covering DTO contract, response shape, deny-list, decline path, invalid input, and adversarial input:**

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01 | API | `POST /uown/los/authorizeCreditCard` — approved card | HTTP 200; all deny-list fields absent (no `gateway*`, `token*`, `ccNumber*`, `transaction*`) |
| CT-02 | API | Allow-list completeness | Response shape matches slim DTO exactly; no extra root-level keys beyond allow-list |
| CT-03 | API | Deep traversal deny-list | Recursively traverse entire response body; confirm no nested key matches deny-list patterns |
| CT-04 | API | Invalid `ccNumber` (incomplete, e.g. `"4111"`) | Spring exception envelope `{message, status}` returned; no data leak in envelope |
| CT-05 | API | Declined card path | HTTP 200; slim DTO with `status` indicating decline; no sensitive fields |
| CT-06 | API | Expired `ccExp` | Spring exception envelope returned; no CC/token fields in body |
| CT-07 | API | Adversarial input (special characters, oversized payload) | Endpoint rejects gracefully; no raw data echoed back |

**E2E hybrid spec — 2 CTs covering DevTools-equivalent network capture during real signing flow + UI error rendering:**

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-E2E-01 | E2E hybrid | Full signing flow (API setup → browser navigate to contract → fill CC → `page.on('response')` intercept on `/authorizeCreditCard`) | Wire payload captured from real browser request; deny-list traversal on live response confirms no leak during actual signing |
| CT-E2E-02 | E2E | Invalid CC submission via Contract UI | UI renders error message from slim DTO `{ message }` without exposing raw backend error; no CC data visible in page |

**Key patterns used:**
- Allow-list validation: assert each allowed field exists; deny-list deep traversal: recursively walk response JSON keys and assert none match the deny-list patterns
- `api.creditCard.authorizeCreditCard(body)` — `CreditCardClient` method
- Dual response shape dispatch: `Object.keys(body).length === 4` → strict slim DTO assertions; `Object.keys(body).length === 2` → Spring exception envelope assertions (see pitfall #22 in `application-lifecycle-protocol.md`)
- `page.on('response', handler)` with URL filter on `/authorizeCreditCard` — captures wire payload during E2E signing flow (reusable pattern for security/contract regression when DevTools-level network capture is required)
- Deep deny-list traversal applied to both slim DTO and Spring envelope responses — minimum security check regardless of response shape

**Security guarantee verified in stg (2026-05-07):** endpoint no longer leaks gateway/token/CC data in either response form.

**Report:** `docs/taskTestingUown/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507-stg-report.md`

---

### Kount/GDS Token Sweep Tests (Task #502)

**API+DB (`docs/taskTestingUown/RU05.26.1.51.1_removeSelectForUpdateFromKountAndGDSTokenQueriesToPreventDatabaseLocking_502/`):**
Validates that `POST /uown/svc/refreshKountAccessTokenSweep` and `POST /uown/svc/refreshGdsAccessTokenSweep` update the access tokens in `uown_kount_token` and `uown_gds_token` without DB locking. Environment: QA2. Project: `task-testing`.

| CT | Type | Flow | Key Assertions |
|----|------|------|----------------|
| CT-01–02 | DB | Schema checks — `uown_kount_token` + `uown_gds_token` | Tables exist; `expiration_time` columns present |
| CT-03 | API+DB | Trigger Kount sweep → `waitForValueChange` on `access_token` | Token string differs from pre-sweep value; no DB lock errors |
| CT-04 | API+DB | Trigger GDS sweep → `waitForValueChange` on `access_token` | Same pattern for `uown_gds_token` |
| CT-05 | API | Both sweeps return 2xx (no 5xx lock timeout) | Response status OK |
| CT-06 | DB | `uown_scheduled_task` row existence check | Row identified by `scheduled_task_name` (column name confirmed) |

**Key pitfalls discovered (see common-operations.md for full details):**
- `uown_kount_token.expiration_time` is `timestamp WITHOUT time zone` — always compare timestamps in PG, not in JS (`Date.getTime()` is timezone-unreliable)
- `uown_scheduled_task` uses `scheduled_task_name` + `cron_trigger` columns (NOT `name`/`cron_expression`)
- After deleting pk=1 from either token table, the sweep recreates the row at a new auto-incremented PK — never query `WHERE pk = 1` after a delete+sweep cycle

**New API methods:** `api.scheduledTask.refreshKountAccessTokenSweep()`, `api.scheduledTask.refreshGdsAccessTokenSweep()`

**New DB helper:** `db.waitForValueChange(sql, params, oldValue, timeoutMs?, intervalMs?)` — polls until the scalar SQL result changes from `oldValue`

**New types:** `TokenRow`, `KountTokenRow`, `GdsTokenRow` (exported from `src/helpers/database.helpers.ts`)

**Ad-hoc scripts** (diagnostic, not promoted to first-class helpers):
- `src/scripts/check_tokens_502.ts` — reads current token state
- `src/scripts/bump_kount_expiry_502.ts` — bumps expiration for test setup
- `src/scripts/restore_tokens_502.ts` — restores tokens after destructive test steps

**App bug (external constraint):** `RefreshKountAccessTokenSweepService` / `RefreshGdsAccessTokenSweepService` use `loadOrCreateToken().setPk(1)` + `repo.save()`, but `@GeneratedValue` ignores the explicit PK on INSERT — the sweep always creates a new PK on recreation. Commit `213b96b54`. Tests must account for this behavior.

---

## Test Structure Conventions

### Database Waits

DB validations use a shared `pollUntil` with exponential backoff (100ms → 2s cap, 30s timeout; see `src/config/constants.ts` `DB_POLL_*`). **Never** use `page.waitForTimeout`/`setTimeout` to wait for DB state — fixed sleeps are flaky and slow. Use the typed `db.waitFor*` helpers.

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
├── clients/          # One client per domain (18 clients)
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
│   ├── svc-payoff.client.ts
│   ├── svc-phone.client.ts
│   ├── svc-email.client.ts
│   ├── svc-contact.client.ts
│   ├── los-partner-auth.client.ts
│   ├── los-partner-application.client.ts
│   ├── ams.client.ts
│   └── seon.client.ts
├── bodies/           # Typed request payloads + builders (13 files)
│   ├── application.body.ts
│   ├── invoice.body.ts
│   ├── lead.body.ts
│   ├── settlement.body.ts
│   ├── credit-card.body.ts
│   ├── payment-arrangement.body.ts
│   ├── account.body.ts
│   ├── svc-phone.body.ts
│   ├── svc-email.body.ts
│   ├── svc-contact.body.ts
│   ├── ams-user.body.ts
│   ├── merchant-config.body.ts
│   └── seon.body.ts
└── responses/        # Typed response interfaces (18 files)
    ├── base.response.ts   # Generic ApiResponse<T> wrapper
    ├── application.response.ts
    ├── invoice.response.ts
    ├── account.response.ts
    ├── merchant.response.ts
    ├── payment-arrangement.response.ts
    ├── svc-payoff.response.ts
    ├── settlement.response.ts
    ├── scheduled-task.response.ts
    ├── lead.response.ts
    ├── svc-phone.response.ts
    ├── svc-email.response.ts
    ├── svc-contact.response.ts
    ├── ams-user.response.ts
    ├── los-partner-auth.response.ts
    ├── los-partner-application.response.ts
    ├── credit-card.response.ts
    └── seon.response.ts
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

### RightFoot ACH balance-check sweeps (R1.53.0)

For **delinquent ACH auto-pay** accounts, R1.53.0 (svc#540) gates ACH reruns behind a RightFoot bank-balance check. A new `achProcessType` value — **`DAILY_RERUN_DELINQUENT`** — is written by `DailyAchBalanceCheckSweep` (and `RERUN` by `RerunAchBalanceCheckSweep`).

```
DailyAchBalanceCheckSweep   cron 0 0 15 * * ?    process_type DAILY_RERUN_DELINQUENT
RerunAchBalanceCheckSweep   cron 0 0 9 ? * THU   process_type RERUN
DailyRerunAchCreationService  (event-driven, NOT Quartz)  → creates the ACH after the RightFoot webhook
```

The ACH is created only when the matching `uown_right_foot_balance_check` row is `status='SUCCESS'`, same routing+account number, and `exposure + amount + $100 <= balance`; the new `uown_sv_achpayment` carries FK `right_foot_balance_check_pk`. Trigger from a test via `api.scheduledTask.dailyAchBalanceCheckSweep()` / `.rerunAchBalanceCheckSweep()` (`SCHEDULED_TASK_NAMES`). Canonical rule: `docs/business-rules/09-integracoes-externas.md §48`.

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

The custom reporter (`src/support/custom-reporter.ts`, registered in `playwright.config.ts`) emits `reports/test-summary.json` for CI parsing — chosen over JUnit XML so it can carry custom fields (environment, flaky count) alongside the HTML/list reporters.

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

Temporary diagnostic/investigation spec files exist outside the `docs/taskTestingUown/{name}/{name}.spec.ts` pattern:

| File | Issue |
|------|-------|
| `docs/taskTestingUown/diag.spec.ts` | Uses `db.executeUpdate` with UPDATE; `page.waitForTimeout`; flat placement |
| `docs/taskTestingUown/dom-diagnostic.spec.ts` | Uses `page.waitForTimeout(5000)`; flat placement |
| `docs/taskTestingUown/check-json.spec.ts` | SELECT only; flat placement |

These files are outside the Playwright `task-testing` project glob pattern but may be picked up by broader test runs. They should be cleaned up or moved to the correct subdirectory structure when the investigations are complete.

### Low — `body as never` casts in 476 spec

`docs/taskTestingUown/Tasks/.../476.spec.ts` uses `body as never` (4 occurrences) to bypass TypeScript type checking on `sendApplication()` calls. The correct fix is to use `buildSendApplicationBody()` with properly typed arguments.

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

## Platform Quirks

Known UI/API behavior divergences from standard patterns. Cross-reference the task report for full context.

### Origination react-select class prefix mix (Task #1262)

Origination forms use two concurrent react-select class naming schemes on the same page:
- **Themed selects** (e.g., Merchant/Location filter dropdowns): `classNamePrefix="filter"` → classes `filter__control`, `filter__option`, etc.
- **Default selects** (e.g., Inventory Category in merchant add/edit form): default `css-*` prefix → classes like `css-abc123-option`.

A union selector that handles both:
```
.filter__option, [class*="css-"][class*="option-"], [class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])
```

See `MerchantEditPage.pickReactSelectOption()` in `src/pages/origination/merchant-edit.page.ts` for the canonical implementation.

### Clone DropdownButton is an `<a>` tag, not `<button>` (Task #1262)

The "Clone" dropdown trigger in the Add Merchant form is rendered as `<a class="dropdownContainer__ddButton">`. Menu items are `.dropdown-item` children inside `.dropdown.show`. The first `.dropdown-item` is a header containing the search `<input>` — always exclude it with `.dropdown-item:not(.dropdown-header)`.

### `waitForResponse` flakiness on qa2 for merchant save (Task #1262)

`page.waitForResponse('/uown/createOrUpdateMerchant')` is flaky on qa2 because the response event may fire after navigation invalidates the wait. Prefer asserting on the outgoing request (`waitForRequest`) combined with URL change polling (`expect.poll(() => page.url().includes('addMerchant'))`) as the success signal.

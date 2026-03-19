# E2E Agent Responsibilities

> Reference for all agents working on E2E tests in the fintech-playwright framework.

## 1. Project Test Structure

```
tests/
├── api/                          # API-only tests (no browser)
│   ├── lease-cancellation-api.spec.ts
│   └── new-application-api.spec.ts
├── auth.setup.ts                 # Auth state setup
├── ci/                           # CI-specific tests
│   └── unified-flow-ci.spec.ts
├── e2e/                          # E2E browser tests (by portal)
│   ├── origination/
│   ├── servicing/
│   │   └── payment-arrangement-settlement-446.spec.ts
│   ├── website/    (future)
│   └── ams/        (future)
└── taskTestingUown/              # GitLab task-driven tests
    └── {testName}/{testName}.spec.ts
```

## 2. Page Object Hierarchy

```
BasePage
├── LoginPage, SearchPage, MerchantPage, ContractPage
├── PayTomorrowPortalPage, PayPairPortalPage
├── OriginationBasePage → OriginationCustomerPage, OverviewPage, FundingPage, ErrorLogPage, ...
├── ServicingBasePage → ServicingCustomerPage, PaymentTransactionPage, AchHistoryPage, ScheduledPaymentPage, LogPage, DueDateMovesHistoryPage, FrequencyChangesHistoryPage, ...
│   └── DueDateMovesHistoryPage  # Servicing > History > Due Date Changes tab (Task #448/#502)
│       Location: src/pages/servicing/due-date-moves-history.page.ts
│       Key methods: navigateToDueDateChanges(), isDueDateChangesMenuVisible(), waitForTableLoad(), getRowData(index)
├── WebsiteBasePage
└── AmsBasePage → AmsPage
```

Location: `src/pages/{portal}/`

## 3. Selectors

- Centralized in `src/selectors/common.selectors.ts`
- Types in `src/selectors/selector.types.ts`
- **Never** hardcode selectors in tests — always use `SELECTORS`

## 4. Available Helpers

| Helper | Location | Purpose |
|--------|----------|---------|
| `api-setup.helpers.ts` | `src/helpers/` | API client setup for tests |
| `auth.helpers.ts` | `src/helpers/` | Authentication helpers |
| `common.helpers.ts` | `src/helpers/` | Shared utilities (sleep, retry, etc.) |
| `database.helpers.ts` | `src/helpers/` | DB queries, polling, waitForRecord |
| `date.helpers.ts` | `src/helpers/` | Date formatting/parsing |
| `downloads.helpers.ts` | `src/helpers/` | File download verification |
| `email.helpers.ts` | `src/helpers/` | IMAP email reading (Gmail) |
| `navigation.helpers.ts` | `src/helpers/` | Page navigation patterns |
| `signwell.helpers.ts` | `src/helpers/` | Signwell e-sign helpers |
| `table.helpers.ts` | `src/helpers/` | Table interaction patterns |
| `template-engine.ts` | `src/helpers/` | JSON template interpolation |
| `test-artifact.helpers.ts` | `src/helpers/` | Test artifact management |
| `test-data.helpers.ts` | `src/helpers/` | `buildTestData()` — unified data builder |
| `worker-id.helper.ts` | `src/helpers/` | Worker-scoped unique IDs (PID + worker index) |

Import via barrel: `import { helperFn } from '@helpers/index.js';`

## 5. API Clients

Location: `src/api/clients/` — all extend `BaseClient`.
Bodies: `src/api/bodies/` — typed request bodies.
Responses: `src/api/responses/` — typed response interfaces.
Templates: `src/fixtures/api-templates/` — JSON templates for request bodies.

### AccountClient — additional methods (Task #502)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getNextReceivable` | `getNextReceivable(accountPk: string \| number)` | GET `/uown/svc/getNextReceivable/{pk}` — returns `SvcReceivableResponse` with the next receivable for the account |
| `getDueDateMoves` | `getDueDateMoves(accountPk: string \| number, page?: number, size?: number)` | GET `/uown/svc/accounts/{pk}/due-date-moves` — returns `DueDateMovesPage` (paginated list of `DueDateMoveRecord`) |
| `moveDueDatesByDays` | `moveDueDatesByDays(accountPk: string \| number, moveNumberOfDays: number)` | POST `/uown/svc/moveDueDatesByDays/{pk}` — moves all future due dates by N days; returns `DueDateMoveRecord` |
| `adjustNextDueDate` | `adjustNextDueDate(accountPk: string \| number, body: NextDueDateAdjustmentBody)` | POST `/uown/tms/v1/accounts/{pk}/next-due-date/adjustments` — TMS/IVR endpoint; uses **TMS API key** (`env.tmsApiKey`); returns `DueDateAdjustmentResponse` (Task #448) |

**New response interfaces (`src/api/responses/account.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `SvcReceivableResponse` | `pk`, `accountPk`, `dueDate`, `amount`, `status`, … |
| `ReceivableInfo` | subset used in due-date-move context |
| `DueDateMoveRecord` | `pk`, `accountPk`, `moveNumberOfDays`, `isFpdChange`, `agent`, `rowCreatedTimestamp`, `nextReceivable` |
| `DueDateMovesPage` | `content: DueDateMoveRecord[]`, `totalElements`, `totalPages`, `number`, `size` |
| `NextDueDateAdjustmentBody` | `dueDate: string \| null`, `offset: number` (Task #448) |
| `DueDateAdjustmentResponse` | `accountPk: number`, `originalDueDate: string`, `newDueDate: string` (Task #448) |

### MerchantClient — error log methods (Task #1240)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getSubmitApplicationErrorLogs` | `getSubmitApplicationErrorLogs(from: string, to: string, options?: { search?, pageNumber?, maxResults? })` | GET `/uown/getSubmitApplicationErrorLogs` — returns `SubmitApplicationErrorLogSearchResults` with paginated error logs from `uown_submit_application_error_log` (includes CC fields) |
| `getMerchantApiErrorLogs` | `getMerchantApiErrorLogs(from: string, to: string, options?: { search?, pageNumber?, maxResults? })` | GET `/uown/getMerchantApiErrorLogs` — returns `MerchantApiErrorLogSearchResults` from `uown_merchant_api_error_log` (no CC fields); same params as `getSubmitApplicationErrorLogs` |

**Response interfaces (`src/api/responses/merchant.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `SubmitApplicationErrorLog` | `pk`, `message`, `leadPk`, `merchantPk`, `refMerchantCode`, `merchantName`, `locationName`, `firstName`, `lastName`, `last4ssn`, `first5Cc`, `last4Cc`, `rowCreatedTimestamp`, `rowUpdatedTimestamp`, `tenantId`, `webUserId`, `agent` |
| `SubmitApplicationErrorLogSearchResults` | `logs: SubmitApplicationErrorLog[]`, `totalCount`, `moreResults` |
| `MerchantApiErrorLog` | `pk`, `message`, `leadPk`, `merchantPk`, `refMerchantCode`, `merchantName`, `locationName`, `firstName`, `lastName`, `last4ssn`, `rowCreatedTimestamp`, `rowUpdatedTimestamp`, `tenantId`, `webUserId`, `agent` — no CC fields (`first5Cc`, `last4Cc`) |
| `MerchantApiErrorLogSearchResults` | `logs: MerchantApiErrorLog[]`, `totalCount`, `moreResults` |

### ApplicationClient — authorizeCreditCard (Task #1240)

| Method | Signature | Description |
|--------|-----------|-------------|
| `authorizeCreditCard` | `authorizeCreditCard(body: AuthorizeCreditCardBody)` | POST `/uown/los/authorizeCreditCard` — authorizes a CC for an existing lead; errors (e.g., last name mismatch) are caught by `CustomExceptionHandler` and logged to `uown_submit_application_error_log`; **requires** `getMissingFields` to be called first |

**Notes:**
- `AuthorizeCreditCardResponseBody` (in `src/api/responses/credit-card.response.ts`) now includes `creditCardTransactionPk?: number` in addition to `authorizationCode` and `preAuthStatus`
- `SubmitApplicationOptions` (in `src/api/bodies/application.body.ts`) now includes `ccLastName?: string` — allows overriding the CC cardholder last name independently from `lastName` when calling `buildSubmitApplicationBody`; defaults to `lastName` if not provided

### ErrorLogPage — Origination portal (Task #1240)

Location: `src/pages/origination/error-log.page.ts`

Extends `OriginationBasePage`. Provides methods for the Error Log page (Submit/Send Application error tracking).

| Method | Description |
|--------|-------------|
| `navigateToErrorLog()` | Navigates to `/errorLog` route |
| `isSendApplicationTabActive()` | Checks if Send Application tab is currently active |
| `clickSubmitApplicationTab()` | Clicks Submit Application tab |
| `clickSendApplicationTab()` | Clicks Send Application tab |
| `getVisibleTabNames()` | Returns array of visible tab names |
| `getTableColumnHeaders()` | Returns array of table column header texts |
| `getTableRowCount()` | Returns number of rows in the error log table |
| `getFirstRowData()` | Returns first row data as `Record<string, string>` keyed by header |
| `setFilterFromDate(date)` | Sets the From date filter |
| `setFilterToDate(date)` | Sets the To date filter |
| `setFilterSearch(text)` | Sets the search text filter |
| `submitFilters()` | Clicks the filter submit button + waits for spinner |
| `waitForTableLoad(timeoutMs?)` | Waits for the error log table to be visible |
| `getRowsPerPageValue()` | Returns current rows-per-page dropdown value |
| `changeRowsPerPage(value)` | Changes rows-per-page dropdown selection |
| `getPaginationText()` | Returns pagination text or null |
| `getPageHeading()` | Returns the page heading text (e.g., `"ERROR LOG"`) — probes h1/h2 and text-match candidates |
| `isDownloadCsvButtonVisible()` | Returns true if the Download CSV button is visible in the active tab panel (calls `expandFilters()` first) |
| `isEmailCsvButtonVisible()` | Returns true if the Email CSV button is visible in the active tab panel (calls `expandFilters()` first) |
| `clickEmailCsv()` | Clicks the Email CSV button in the active tab panel (calls `expandFilters()` first) |
| `isEmailCsvModalVisible()` | Returns true if the Email CSV modal is open — looks for `.modal.show, [role="dialog"]` with email text |

**Selectors** (prefix `el` = Error Log): `elTabSendApplication`, `elTabSubmitApplication`, `elFilterFromDate`, `elFilterToDate`, `elFilterSearch`, `elFilterSubmitButton` — defined in `src/selectors/common.selectors.ts`, typed in `ErrorLogSelectors` interface.

**CSV download filenames (Task #1240):**
- Submit Application tab → `submit-application-error-log-reports.csv`
- Send Application tab → `error-log-reports.csv`

**Tab active scoping:** `getActiveTabPanel()` returns `page.locator('.tab-pane.active')` — always count=1 (only one panel is active at a time). When switching tabs via `clickSendApplicationTab()` / `clickSubmitApplicationTab()`, the page object waits for the new panel to become visible before returning. All filter interactions must be scoped to the active panel to avoid matching the nav bar search field (shares the `name='search'` attribute with the filter input).

### ContractPage — missing employment info flow methods (Task #476)

Methods added to `ContractPage` (`src/pages/origination/contract.page.ts`) to handle the `/complete` URL when `planId` is empty:

| Method | Signature | Description |
|--------|-----------|-------------|
| `dismissSeonOverlay` | `dismissSeonOverlay(): Promise<void>` | Hides the SEON `[data-testid="seon-idv-iframe"]` element via JS (`display:none`, `pointerEvents:none`, `zIndex:-9999`). Used in sandbox where SEON shows a QR code modal that blocks pointer events. No-op if iframe is not present. |
| `isMissingEmploymentScreen` | `isMissingEmploymentScreen(): Promise<boolean>` | Returns `true` if the `/complete` URL is showing the "missing employment info" screen (empty `planId` flow). Detected by `getByRole('searchbox', { name: /next paycheck/i })` visibility. |
| `fillNextPaycheckDate` | `fillNextPaycheckDate(nextPayDate: string): Promise<void>` | Fills the "When is your next paycheck?" date input (step 1 of the missing employment flow). Clicks the NEXT button after fill. `nextPayDate` in `MM/DD/YYYY` format. |
| `selectMissingPayFrequency` | `selectMissingPayFrequency(frequency: string): Promise<void>` | Selects pay frequency from the React Select dropdown (step 2). Calls `dismissSeonOverlay()` internally before interacting. Valid enum values: `WEEKLY`, `BI_WEEKLY`, `SEMI_MONTHLY`, `MONTHLY`. Uses JS click for NEXT when SEON is present (sandbox bypass). |
| `waitForPlanSelectionScreen` | `waitForPlanSelectionScreen(): Promise<void>` | Waits for "Please review and select one of the programs below." heading (timeout 30s). |
| `choosePlanByName` | `choosePlanByName(programName: string, index?: number): Promise<void>` | Clicks a payment program button matching `programName` text (e.g., `'Bi-Weekly'`). Falls back to index (default 0) if name not found. Calls `waitForPlanSelectionScreen()` first. |
| `completeMissingEmploymentInfo` | `completeMissingEmploymentInfo(nextPayDate, frequency, programName?): Promise<void>` | Convenience method combining steps 1–3: `fillNextPaycheckDate` → `selectMissingPayFrequency` → `choosePlanByName`. Default `programName = 'Bi-Weekly'`. |

**Trigger condition:** When `planId` is empty in the `/complete` URL (e.g., `?planId=`), the backend renders a 2-step employment form before showing payment program options. Use `stripPlanId(redirectUrl)` to force this screen. When `planId` is present, the backend auto-resolves the program and skips straight to the CC/bank form.

**New selectors** (`src/selectors/common.selectors.ts`):
- `completeNextPaycheckInput` — `'input[type="search"]'`
- `completePayFrequencyCombobox` — `'[class*="react-select__control"]'`
- `completePlanSelectionHeading` — `'h2, [class*="heading"]'`
- `completeChooseProgramBtn` — `'button:has-text("Choose Payment Program")'`

### ApplicationClient — getMissingFields + submitApplication flow (Task #1242)

When driving a lead through the full API flow (sendApplication → submitApplication), the `getMissingFields` endpoint **must** be called between the two steps to set `merchantProgramPk` on the lead:

```typescript
// 1. sendApplication → get redirectUrl → extract planId + shortCode
const sendRes = await api.application.sendApplication(merchant, applicant, order);
const option13 = sendRes.body!.paymentDetailsList!.find(p => p.termInMonths === 13);
const planId = extractPlanId(option13!.redirectUrl!); // e.g., 'WK13'
const shortCode = extractShortCode(option13!.redirectUrl!); // e.g., 'ABC123'

// 2. getMissingFields — REQUIRED: sets merchantProgramPk on the lead
await api.application.getMissingFields(shortCode, { planId });

// 3. submitApplication — planId selects the payment option
await api.application.submitApplication(leadPk, firstName, lastName, {
  planId, ccNumber: card.number, cvc: card.cvv, ccType: 'VISA', ccExp: card.expirationDate,
});
```

**CC last name match:** `CCCheckService.checkCCLastNameMatch` validates that the CC cardholder's last name matches the customer's last name from `sendApplication`. Always reuse the exact `firstName`/`lastName` from the applicant data in `submitApplication`.

## 6. Test Data

- Merchants: `src/data/merchants.ts`
- Test cards: `src/data/test-cards.ts`
- Addresses: `src/data/addresses.ts`
- Constants: `src/config/constants.ts`

## 7. Mandatory Patterns

- `test.step()` to group logical actions
- `ctx` object to share state between steps (same test only)
- `testData` fixture with `buildTestData()` for data setup
- Tags: `@smoke`, `@sanity`, `@regression` + `@critical` via `TestTag` enum
- Worker-scoped IDs via `worker-id.helper.ts` for parallel safety
- Lock protocol via `shared/agent-coordination.md` before editing shared files

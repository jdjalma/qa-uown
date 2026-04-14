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

> **Full tree (source of truth):** `context/architecture.md` §Page Object Hierarchy.

Detailed page objects with methods documented below (extends the tree above):

```
BasePage
├── LoginPage, SearchPage, MerchantPage, ContractPage
├── PayTomorrowPortalPage, PayPairPortalPage
├── OriginationBasePage → OriginationCustomerPage, OverviewPage, FundingPage, LeadsPage, ProgramsPage, ErrorLogPage, ...
├── ServicingBasePage → ServicingCustomerPage, PaymentTransactionPage, AchHistoryPage, ScheduledPaymentPage, LogPage, ServicingSearchPage, PaymentArrangementPage, DueDateMovesHistoryPage, FrequencyChangesHistoryPage, ...
│   ServicingBasePage key methods (payment arrangement):
│     makeCcPaymentArrangement({ startDate, endDate, frequency, paymentType?, ccDetails? })
│       — ccDetails?: { firstName, lastName, cardNumber, cvc, expMonth, expYear }
│       — when ccDetails provided: clicks "Use one-time card information" radio, fills manual CC form
│       — Expires On field is type="month"; method converts expYear+expMonth to YYYY-MM internally
│       — Added in Task #483 (one-time card support)
│   ├── DueDateMovesHistoryPage  # Servicing > History > Due Date Changes tab (Task #448/#502)
│   │   Location: src/pages/servicing/due-date-moves-history.page.ts
│   │   Key methods: navigateToDueDateChanges(), isDueDateChangesMenuVisible(), waitForTableLoad(), getRowData(index)
│   ├── PaymentArrangementPage — Task #500 (Display Payment Arrangements)
│   │   Location: src/pages/servicing/payment-arrangement.page.ts
│   │   Key methods: navigateToPaymentArrangement(accountPk), navigateDirectly(baseUrl, accountPk),
│   │     waitForTableLoad(), getRowData(index), findRowByPk(pk), expandRow(index),
│   │     getCcPaymentsData(), getAchPaymentsData(), getSubTableData(tableIndex),
│   │     getNormalizedHeaders(), getExpandedSectionHeaders(), getPaginationTotal()
│   │   Notes: FilterTable headers are duplicated in DOM — getSubTableData deduplicates automatically.
│   │     Uses direct URL navigation (menu nav unreliable from task-testing project).
│   └── ServicingCustomerPage — Task #505 additions (Opt Out AI flag) + Task #442 (Send Podium Link)
│       Location: src/pages/servicing/customer.page.ts
│       Key methods (Opt Out AI — Task #505):
│         navigateToPrimaryContact() — navigates to Primary Contact section; handles CONFIRM modal + dismisses modals
│         enterPrimaryContactEditMode() — clicks pencil icon, waits for checkboxes to become enabled
│         isOptOutAiVisible() — returns true if "Opt Out AI" checkbox is visible in Mobile Phone section
│         isOptOutAiChecked() — returns checked state of "Opt Out AI" checkbox
│         toggleOptOutAi(reason?) — enters edit mode, clicks checkbox, handles reason modal (enable only), clicks SAVE, returns toast text
│         setOptOutAi(enable: boolean) — idempotent: only clicks if current state differs from target; returns toast text or ''
│       Key methods (Send Podium Link — Task #442):
│         openSendInviteModal() — clicks envelope icon (#invitation), forces Bootstrap modal show class (CSS animations disabled)
│         isPodiumLinkButtonVisible() — returns true if "Send Podium Link" button is visible in InviteModal
│         sendPodiumLink() — full flow: open modal → click "Send Podium Link" (force) → confirm → wait for toast; returns toast text
│         closeSendInviteModal() — closes the Send Invite modal if open
│       UI interaction notes:
│         - Primary Contact section is READ-ONLY by default — must click pencil icon (#PrimaryContact-edit) first
│         - Checking "Opt Out AI" triggers a "Reason for Opt Out AI Mobile" modal (textarea + Save)
│         - Unchecking does NOT trigger the reason modal
│         - "Customer Information Confirmation" modal appears intermittently on page load — click CONFIRM
│         - Activity log format: "UPDATED : Phone[ optOutAi changed from false to true ]"
│         - InviteModal from @uownleasing/common-ui uses Bootstrap "modal fade" — CSS animations disabled in tests prevent "show" class; must force via JS
│         - Click "Send Podium Link" uses force:true (React unmounts InviteModal during click handler)
│         - ConfirmationModal: title "Please Confirm", button "Continue" — also force:true for same reason
├── WebsiteBasePage                   # + email OTP login + phone/contact update
│   Key methods (Update Phone — Task #146):
│     updatePhoneNumber(areaCode, phoneNumber) — navigates to Update Contact Info and fills phone fields
│     getErrorMessageText() — returns error message text if visible
│     getSuccessMessageText() — returns success message text if visible
│     isErrorVisible() — returns boolean whether error is currently displayed
│   Selectors added (Task #146): wsPhoneAreaCodeInput, wsPhoneNumberInput, wsSaveChangesButton,
│     wsSuccessMessage, wsErrorMessage, wsUpdatePhoneSection
└── AmsBasePage → AmsPage, AmsUserDetailsPage
    │   AmsUserDetailsPage — Task #79 (AMS Merchant Selection Flow)
    │   Location: src/pages/ams/ams-user-details.page.ts
    │   Key methods (merchant edit flow):
    │     clickEditMerchantsButton() — dispatches click event on SVG button (#EditUserMerchants-edit)
    │     cancelMerchantsEdit() — clicks CANCEL and waits for read-only mode
    │     saveMerchantsEdit() — clicks SAVE, handles "Confirm Changes" modal, waits for read-only mode
    │     clickManageMerchants() — clicks "Manage merchants" button in edit mode
    │     clickDeleteAll() — clicks "Delete All" button in edit mode
    │     isManageMerchantsVisible() — returns true if Manage merchants button is visible
    │     isDeleteAllVisible() — returns true if Delete All button is visible
    │     isSearchboxDisabled() — returns disabled state of the merchants searchbox
    │     isSearchboxVisible() — returns visibility of the merchants searchbox
    │     filterCurrentMerchants(term) — types in the read-only searchbox to filter displayed merchants
    │     clearCurrentMerchantsFilter() — clears the merchants searchbox
    │   Selectors updated (Task #79, src/selectors/common.selectors.ts):
    │     amsEditUserMerchantsButton: '#EditUserMerchants-edit' (was span, now button)
    │     amsUserMerchantsTag: '[class*="merchants-read_tag"]' (new CSS module class)
    │     amsManageMerchantsButton: 'button:has-text("Manage merchants")'
    │     amsDeleteAllMerchantsButton: 'button:has-text("Delete All")'
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

### AccountClient — additional methods (Task #502, #442)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getNextReceivable` | `getNextReceivable(accountPk: string \| number)` | GET `/uown/svc/getNextReceivable/{pk}` — returns `SvcReceivableResponse` with the next receivable for the account |
| `getDueDateMoves` | `getDueDateMoves(accountPk: string \| number, page?: number, size?: number)` | GET `/uown/svc/accounts/{pk}/due-date-moves` — returns `DueDateMovesPage` (paginated list of `DueDateMoveRecord`) |
| `moveDueDatesByDays` | `moveDueDatesByDays(accountPk: string \| number, moveNumberOfDays: number)` | POST `/uown/svc/moveDueDatesByDays/{pk}` — moves all future due dates by N days; returns `DueDateMoveRecord` |
| `adjustNextDueDate` | `adjustNextDueDate(accountPk: string \| number, body: NextDueDateAdjustmentBody)` | POST `/uown/tms/v1/accounts/{pk}/next-due-date/adjustments` — TMS/IVR endpoint; uses **TMS API key** (`env.tmsApiKey`); returns `DueDateAdjustmentResponse` (Task #448) |
| `sendPodiumLink` | `sendPodiumLink(accountPk: string \| number)` | POST `/uown/svc/accounts/{pk}/podium-link` — sends Podium review invite to primary customer; returns `PodiumInvitationResponse` (Task #442) |

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

### ProgramsPage — Origination portal (Tasks #1251, #1252)

Location: `src/pages/origination/programs.page.ts`

Extends `OriginationBasePage`. Provides methods for the `/programs` list and `/programs/:pk` detail pages.

**Existing methods (pre-#1251):** `navigateToPrograms`, `getCleanHeaders`, `showMaxRows`, `findProgramRow`, `clickProgramLink`, `fillProcessingFee`, `fillAmountAtSigned`, `saveProgram`, `getColumnWidth`

**New methods added (Tasks #1251/#1252):**

| Method | Description |
|--------|-------------|
| `getMoneyFactorTableValue(programName)` | Returns Money Factor column value for a given program from the list table (Task #1251) |
| `getMoneyFactorFormValue()` | Returns the value of `input[name='moneyFactor']` from the edit form (Task #1251) |
| `navigateToProgramDetails(originationUrl, programPk)` | Navigates directly to `/programs/:pk` route (Task #1252) |
| `getProgramNameFromForm()` | Returns the value of `input[name='programName']` from the details form (Task #1252) |
| `isCloneButtonVisible()` | Returns `true` if the Clone button is visible on the details page (Task #1252) |
| `isCloneGroupButtonVisible()` | Returns `true` if the Clone Group button is visible on the details page (Task #1252) |
| `isActivityLogPanelVisible()` | Returns `true` if the Activity Log panel is visible on the details page (Task #1252) |
| `waitForProgramDetailsLoad()` | Waits for the program name input to become visible — confirms details page loaded (Task #1252) |
| `openCloneGroupModal()` | Opens the Clone Group modal on the program details page (Task #1214) |
| `fillCloneGroupName(name)` | Fills the group name input field in the Clone Group modal (Task #1214) |
| `selectAllProgramsInModal()` | Clicks "Select All" to select all programs in the Clone Group modal (Task #1214) |
| `submitCloneGroupModal()` | Clicks the SAVE button to submit the Clone Group modal (Task #1214) |
| `waitForCloneGroupSuccess()` | Waits for the toast "Programs successfully cloned!" after cloning (Task #1214) |
| `getTableRowCount()` | Returns the number of visible rows in the programs list (`.rdt_TableRow`) (Task #1214) |
| `getRowsPerPageValue()` | Returns the current value of the rows-per-page dropdown (Task #1214) |

**Test files:**
- `docs/taskTestingUown/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251.spec.ts` — 4 CTs, env: qa2
- `docs/taskTestingUown/RU04.26.1.51.0_createProgramDetailsPage_1252/RU04.26.1.51.0_createProgramDetailsPage_1252.spec.ts` — 7 CTs, env: qa2
- `docs/taskTestingUown/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214.spec.ts` — 2 CTs, env: qa2

---

### LeadsPage — Origination portal (Task #1242, #1253)

Location: `src/pages/origination/leads.page.ts`

Extends `OriginationBasePage`. Provides methods for the Origination portal Leads (Search Result) page.

**Columns:** Lead # | Account # | Lead Status | Internal Status | State | Term Month | Invoice Number | Customer Name | SSN | Phone Number | Email Address | Merchant | Location | Ref Merchant Code | Client Type | Created at | Created from

| Method | Description |
|--------|-------------|
| `navigateAndWaitForTable()` | Navigates to the Leads page and waits for "Search Result" heading + spinner |
| `expandFilters()` | Expands the filter panel if collapsed |
| `setFromDate(date)` | Sets the From date filter (MM/DD/YYYY) — required field |
| `setToDate(date)` | Sets the To date filter (MM/DD/YYYY) |
| `filterByDateRange(from, to)` | Shorthand for `setFromDate` + `setToDate` |
| `setInvoiceNumber(invoiceNumber)` | Fills the "Invoice Number" filter field (`input[placeholder='Search by Invoice Number']`) — Task #1253 |
| `setLeadPk(leadPk)` | Fills the Lead PK search field |
| `setCustomerName(name)` | Fills the Customer Name search field |
| `filterByLeadStatus(displayStatus)` | Selects a Lead Status from the React Select dropdown |
| `filterByMerchant(merchantName)` | Selects a merchant from the Merchant single-select filter |
| `filterByLocation(locationName)` | Selects a location from the Location single-select filter |
| `clearMerchantFilter()` | Clears the Merchant filter by clicking its clear indicator |
| `getMerchantValue()` | Returns the currently selected merchant text |
| `getLocationValue()` | Returns the currently selected location text |
| `getLocationOptions()` | Opens the Location dropdown and returns all available option texts |
| `submitFilters()` | Clicks the Search button; waits for table rows or "no records" message |
| `getCleanHeaders()` | Returns table headers with sort indicators (`▲▼△▽↑↓`) stripped |
| `getVisibleRowCount()` | Returns number of visible table rows (0 if "no records" shown) |
| `findRowByLeadPk(leadPk)` | Returns the row matching the given Lead # as `Record<header, cellValue>` or null |
| `getAllVisibleRows()` | Returns all visible rows as `Record<header, cellValue>[]` |

**Selectors** (in `LeadsTableSelectors`): `leadsInvoiceNumberInput` — `"input[placeholder='Search by Invoice Number']"` (added Task #1253).

**Notes:**
- Leads table headers include sort indicators (`▲`/`▼`) — always use `getCleanHeaders()` before column name matching
- `filterByMerchant` and `filterByLocation` click the `filter__control` element (not the placeholder) to avoid `filter__input-container` intercept issues

---

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

### SvcPhoneClient — opt-out / DNC / DNT flags (Task #505)

Location: `src/api/clients/svc-phone.client.ts`

Extends `BaseClient`. Host: `svc`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `updateOptOutAi` | `updateOptOutAi(body: UpdateOptOutAiBody): Promise<ApiResponse<SvPhoneResponse>>` | POST `/uown/svc/updateOptOutAi` — sets `optOutAi` flag on a phone record; `optOutAiReason` optional |
| `updateDnc` | `updateDnc(body: UpdateDncBody): Promise<ApiResponse<SvPhoneResponse>>` | POST `/uown/svc/updateDnc` — sets `doNotCall` flag; `reasonForDnc` optional |
| `updateDnt` | `updateDnt(body: UpdateDntBody): Promise<ApiResponse<SvPhoneResponse>>` | POST `/uown/svc/updateDnt` — sets `doNotText` flag; `reasonForDnt` optional |

**Request bodies (`src/api/bodies/svc-phone.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `UpdateOptOutAiBody` | `phonePK: number`, `optOutAi: boolean`, `optOutAiReason?: string` |
| `UpdateDncBody` | `phonePK: number`, `doNotCall: boolean`, `reasonForDnc?: string` |
| `UpdateDntBody` | `phonePK: number`, `doNotText: boolean`, `reasonForDnt?: string` |

**Response interfaces (`src/api/responses/svc-phone.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `PhoneInfoResponse` | `phonePK`, `customerPK`, `phoneType`, `areaCode`, `phoneNumber`, `phoneExtension`, `doNotCall`, `reasonForDnc`, `doNotText`, `reasonForDnt`, `lastContactTimestamp`, `optOutAi?`, `optOutAiReason?` |
| `SvPhoneResponse` | `pk: number`, `phoneInfo: PhoneInfoResponse` |

**Notes:**
- `optOutAi` and `optOutAiReason` are `null` until backend R1.50.0 is deployed (added by Flyway migration V20260318174113)
- Available on the `api` fixture as `api.svcPhone` (added to `ApiClients` in `src/support/base-test.ts`)

### SvcContactClient — phone contact info updates (Task #146)

Location: `src/api/clients/svc-contact.client.ts`

Extends `BaseClient`. Host: `svc`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getContactInfo` | `getContactInfo(accountPk: number): Promise<ApiResponse<ContactInformationResponse>>` | GET `/uown/svc/getPrimaryCustomerContactInfo/{accountPk}` — re-exports `ContactInformationResponse` from `svc-email.response.js` |
| `createOrUpdateContactInfo` | `createOrUpdateContactInfo(body: CreateOrUpdateContactInfoBody): Promise<ApiResponse<unknown>>` | POST `/uown/svc/createOrUpdatePrimaryCustomerContactInfo` — creates or updates phone/email contact info |
| `sendVerificationCode` | `sendVerificationCode(phoneOrEmail: string, company?: string): Promise<ApiResponse<unknown>>` | POST `/uown/svc/sendVerificationCode/{phoneOrEmail}?company={company}` — sends OTP; `company` defaults to `'UOWN'` |

**Request bodies (`src/api/bodies/svc-contact.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `ContactPhoneInfo` | `phonePK: number` (capital K), `customerPK: number` (capital K), `phoneType: string`, `areaCode: string`, `phoneNumber: number` (Java Long), `phoneExtension?: string`, `doNotCall?: boolean`, `doNotText?: boolean` |
| `ContactEmailInfo` | `emailPK: number`, `customerPK: number`, `emailAddress: string`, `emailType: string`, `doNotEmail?: boolean` |
| `CreateOrUpdateContactInfoBody` | `accountPk: number`, `phones?: ContactPhoneInfo[]`, `emails?: ContactEmailInfo[]` |

**Response:**
- `src/api/responses/svc-contact.response.ts` — re-exports `ContactInformationResponse` from `svc-email.response.js`

**Notes:**
- Available on the `api` fixture as `api.svcContact` (added to `ApiClients` in `src/support/base-test.ts`)
- Critical: field names use capital K — `phonePK`, `customerPK`, `emailPK` — not `phonePk`
- `phoneNumber` is `number` (Java Long), not `string`
- Fix confirmed (Task #146): `sendVerificationCode` returns 200 after a phone is saved via `createOrUpdateContactInfo`

### SvcEmailClient — contact info / email updates (Task #442)

Location: `src/api/clients/svc-email.client.ts`

Extends `BaseClient`. Host: `svc`.

| Method | Signature | Description |
|--------|-----------|-------------|
| `getContactInfo` | `getContactInfo(accountPk: string \| number): Promise<ApiResponse<ContactInformationResponse>>` | GET `/uown/svc/getPrimaryCustomerContactInfo/{accountPk}` — returns full contact information (email list + phone list) for the primary customer of an account |
| `createOrUpdateEmail` | `createOrUpdateEmail(body: CreateOrUpdateEmailBody): Promise<ApiResponse<SvEmailUpdateResponse>>` | POST `/uown/svc/createOrUpdateEmail` — creates or updates an email record for a customer |

**Request body (`src/api/bodies/svc-email.body.ts`):**

| Interface | Fields |
|-----------|--------|
| `CreateOrUpdateEmailBody` | `emailPK: number`, `customerPK: number`, `emailAddress: string`, `emailType: string` (e.g. `'PRIMARY'`, `'SECONDARY'`, `'WORK'`, `'OTHER'`), `doNotEmail: boolean`, `reasonForDnc?: string` |

**Response interfaces (`src/api/responses/svc-email.response.ts`):**

| Interface | Fields |
|-----------|--------|
| `EmailInfoResponse` | `emailPK`, `customerPK`, `emailAddress`, `emailType`, `doNotEmail`, `reasonForDnc?` |
| `SvEmailResponse` | `pk: number`, `emailInfo: EmailInfoResponse` |
| `SvEmailUpdateResponse` | alias for `SvEmailResponse` — returned by `createOrUpdateEmail` |
| `SvPhoneInContactResponse` | `pk: number`, `phoneInfo: PhoneInfoResponse` — phone shape inside `ContactInformationResponse` |
| `ContactInformationResponse` | `accountPk: number`, `leadPk?: number`, `emailList: SvEmailResponse[]`, `phoneList: SvPhoneInContactResponse[]` |

**Notes:**
- Available on the `api` fixture as `api.svcEmail` (added to `ApiClients` in `src/support/base-test.ts`)
- `ContactInformationResponse` returns BOTH email and phone lists in a single call — prefer over separate phone/email lookups when both are needed

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

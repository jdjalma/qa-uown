# Page Objects Catalog - Detailed Method Reference

> For hierarchy, conventions, and anti-patterns, see [SKILL.md](../SKILL.md).

---

## OverviewPage - Origination dashboard

- **Location:** `src/pages/origination/overview.page.ts`
- **Extends:** `OriginationBasePage`
- **Key properties/methods:**
 - `dashboardCards` - locator for all metric summary cards (`SELECTORS.dashboardCard`)
 - `totalApplications`, `approvedCount`, `pendingCount` - individual metric locators (`[data-metric="..."]`)
 - `getDashboardMetric(metricName)` - returns text of a named metric card
 - `verifyDashboardLoaded` - waits for spinner, then races between filters button and table
 - `getRowDataByReferenceId(leadPk)` - paginates the leads table, returns row matching `Reference #`
 - `searchTable(value)` (2026-06-18) - types into the **table-panel** "Search table" free-text box (`SELECTORS.overviewTableSearch`). Use a non-matching value to drive the table to an **empty set** — this is the reliable empty-set lever (the table-panel `#fromDate` resets to today on render, so a future-only date window does NOT reliably empty the table — pitfall #115)
 - `expandTableFilters` (2026-06-18) - expands the **table-panel** filter form via `multiSelectFilterButton` with a **retry loop**. NOT a single click: `verifyDashboardLoaded` returns when the Filters button appears (Promise.race) BEFORE the table finishes loading on QA2, so a re-render can re-collapse the width-collapse-animated panel right after a toggle click (pitfall #116)
 - `csv: FilteredCsvDownloadControls` field (2026-06-18) - composed CSV controls (see component below), constructed with `tooltipIdPrefix='overview-csv-download'`

- **Selector:** `SELECTORS.dashboardCard = "[class*='summaryBox__']"` (added in). CSS module prefix anchor — hash suffix changes per webpack build. Do NOT hardcode the full hash class.

- **Two filter forms (pitfall #114 — disambiguate by id, never positional nth()):** Overview renders TWO independent filter forms, each with MM/DD/YYYY date inputs:
 - **Top-bar KPI form:** ids `#from`/`#to`, toggle class `overview_filterButton__` — drives the metric cards.
 - **Table panel:** ids `#fromDate`/`#toDate`, toggle class `index-module_filterButton__` — drives the table + CSV export.
 A positional `nth()` selector hits the KPI form. Always target the table-panel inputs by id and expand via the table-panel toggle (`expandTableFilters`).

- **Auth / navigation notes (see pitfalls #74-#76):**
 - Navigate to `${originationBase}/overview`, NOT `originationBase` root (root = login page always)
 - `localStorage.clear` required before reload if testing stale-data absence after session deletion

---

## FilteredCsvDownloadControls - shared CSV export component (2026-06-18)

- **Location:** `src/pages/origination/filtered-csv-download.controls.ts`
- **Extends:** none — plain composed controls class (`constructor(page, tooltipIdPrefix)`), NOT a page object. Composed into `OverviewPage` and `LeadsPage` via a `csv` field; mirrors the app's single reusable `FilteredCsvDownload` component (MR !1481) so the tooltip/modal/state logic is not duplicated across the two screens (rule #2).
- **`tooltipIdPrefix`:** `overview-csv-download` (Overview) | `leads-csv-download` (Leads) — the ONLY per-screen difference besides the download filename (`all-filtered-leads.csv` vs `leads-results.csv`).
- **Methods (all return data/Locators — no `expect` inside, assertions live in tests):**
 - `isDownloadCsvVisible` / `isDownloadCsvEnabled` - Download CSV gated by `hasDownloadPermission && headers.length>0`; enabled = `enabledButton` class present AND `disabledButton` absent
 - `isEmailCsvVisible` / `isEmailCsvEnabled` - Email CSV always rendered; disabled ONLY on empty table (NOT gated by download permission or size limit). **`isEmailCsvEnabled` checks the CSS `disabledButton` class (`SELECTORS.csvEmailButtonDisabled`), NOT Playwright `isEnabled()`** — the button is disabled via CSS (`pointer-events:none` + class) with NO HTML `disabled` attr, so `isEnabled()` always returns `true` and a click gets intercepted by the parent div → timeout (see [[selector-hardening]] CSS-disabled rule)
 - `fillEmailCsvAddress(address)` / `isEmailCsvSendEnabled` / `sendEmailCsv` - Email CSV modal send leg. `sendEmailCsv` clicks the modal Send button (`SELECTORS.csvEmailModalSendButton`) and waits for the modal to close (`state:'hidden'`, 10s). Call AFTER `fillEmailCsvAddress` + asserting `isEmailCsvSendEnabled` (Send stays disabled until an address is typed)
 - `hoverDownloadCsv` / `getDownloadDisabledTooltip` - hover surfaces the **directing** tooltip ("This export is too large to download directly. Please use Email CSV instead. …") rendered ONLY in the size-exceeded case. `getDownloadDisabledTooltip` matches the directing PHRASE scoped to the wrapper span, NOT the wrapper's raw text (the `<span>` wrapper's `textContent` is just the button label "Download CSV" — treating it as a tooltip is a false positive; the enabled case correctly returns null)
 - `downloadCsv` - clicks Download CSV, returns captured `Download` (happy path), via `waitForDownload`
 - `openEmailCsvModal` / `emailCsvModalTitle` / `isEmailCsvSendEnabled` / `fillEmailCsvAddress` / `cancelEmailCsvModal` - Email CSV modal flow ("Which email should we send this CSV file to?"; Send disabled until address typed; CANCEL closes without sending)
 - `getTotalRowCount` - reads the rdt pagination footer ("X-Y of N" → N) for row-count reconciliation against the CSV
- **CRITICAL — button disambiguation (pitfall #117):** Email CSV and Download CSV buttons SHARE the `filtered-csv-download_csvButton` class, and Email CSV is FIRST in the DOM. A bare class selector + `.first()` resolves to Email CSV → a "download" click opens the email modal. `SELECTORS.csvDownloadButton` is disambiguated by `:has-text('Download CSV')` — never select the download button by class alone.
- **Selectors (`common.selectors.ts`):** `csvDownloadButton` / `csvDownloadButtonEnabled` / `csvDownloadButtonDisabled`, `csvEmailButton`, `csvDownloadTooltipById(prefix)`, `csvEmailModal` / `csvEmailModalTitle` / `csvEmailModalInput` / `csvEmailModalSendButton` / `csvEmailModalCancelButton`, `rdtPaginationFooter`.
- **Helpers consumed:** `waitForDownload`, `parseCsv`, `deleteDownloadedFile` (`downloads.helpers.ts`).
- **KB:** `docs/knowledge-base/overview-leads-csv-export-size-limit.md` (48 MiB size guard, threshold/messages, Overview-vs-Leads diffs).

---

## LeadsPage - Origination leads list

- **Location:** `src/pages/origination/leads.page.ts`
- **Extends:** `OriginationBasePage`
- **CSV methods:** delegate to a composed `csv: FilteredCsvDownloadControls` field constructed with `tooltipIdPrefix='leads-csv-download'` — same public surface as Overview's `csv`. Leads CSV exports 17 columns incl. SSN; downloaded artifacts must be deleted via `deleteDownloadedFile` (PII hygiene).

---

## ServicingBasePage - payment arrangement

**Key methods:**

- `makeCcPaymentArrangement({ startDate, endDate, frequency, arrangementType?, totalPaymentAmount?, paymentType?, ccDetails? })` - cc flow (synchronous, status=SUCCESS)
 - `ccDetails?: { firstName, lastName, cardNumber, cvc, expMonth, expYear }`
 - When `ccDetails` provided: clicks "Use one-time card information" radio, fills manual CC form
 - "Expires On" field is `type="month"`; method converts `expYear + expMonth` to `YYYY-MM` internally
 - Added in (one-time card support); `arrangementType`/`totalPaymentAmount` added 2026-06-01

- `makeAchPaymentArrangement({ startDate, endDate, frequency, arrangementType?, totalPaymentAmount?, bankDetails? })` - ACH flow (added 2026-06-01)
 - ACH arrangement is inserted synchronously with arrangement `status=NOT_STARTED`, `payment_type=ACH`; linked `uown_sv_achpayment` row starts `PENDING`, daily ACH sweep promotes to `PICKED_TO_SEND`
 - `bankDetails?: { institute?, accountNumber, routingNumber }` — when omitted, uses bank on file (funded accounts default to "Use existing bank information" `select[name="bankAccountPk"]`)
 - Modal default payment type is already "ACH Payment" — no type switch needed
 - DB-confirmed dev3: arrangement pk77 acct138 → `status=NOT_STARTED`, `payment_type=ACH`

- Both arrangement methods share private `fillArrangementSchedule` — installment table auto-populates from startDate + endDate + frequency; `totalPaymentAmount` auto-distributes across installments
 - **Arrangement Type is an explicit React Select** (`label[for="paymentArrangementType"]`, options `NORMAL` | `SETTLEMENT`) — NOT backend-derived. Selector `SELECTORS.arrangementTypeDropdown` (label-scoped). The old `makeCcPaymentArrangement` JSDoc claiming "UI does NOT expose an explicit arrangementType field; backend derives it from amount" was WRONG (corrected 2026-06-01 via DOM-first dev3). See [[application-lifecycle]] pitfall #82.
 - Frequency dropdown options: `Weekly` | `BiWeekly` | `Monthly` | `SemiMonthly` — use **exact regex** match ("Weekly" substring also matches "BiWeekly")

## DueDateMovesHistoryPage - /#502

- **Location:** `src/pages/servicing/due-date-moves-history.page.ts`
- **Key methods:** `navigateToDueDateChanges`, `isDueDateChangesMenuVisible`, `waitForTableLoad`, `getRowData(index)`

## BankAccountPage -

- **Location:** `src/pages/servicing/bank-account.page.ts`
- **Key methods:**
 - `openAddBankAccountModal`, `addBankAccount(data)`, `openAllBankAccountsModal`
 - `getBankAccountRowByLastFour(last4)`, `deleteBankAccountByLastFour(last4)`
 - `getDefaultPaymentFromCard`, `getAccountNumberLastFour`
- **Notes:** scoped selectors use `.modal.show` to avoid collisions with other `rdt_Table` instances on customer page. Exported in `src/pages/servicing/index.ts`.

## PaymentArrangementPage -

- **Location:** `src/pages/servicing/payment-arrangement.page.ts`
- **Key methods:**
 - `navigateToPaymentArrangement(accountPk)`, `navigateDirectly(baseUrl, accountPk)`
 - `waitForTableLoad`, `getRowData(index)`, `findRowByPk(pk)`, `expandRow(index)`
 - `getCcPaymentsData`, `getAchPaymentsData`, `getSubTableData(tableIndex)`
 - `getNormalizedHeaders`, `getExpandedSectionHeaders`, `getPaginationTotal`
- **Notes:** FilterTable headers are duplicated in the DOM - `getSubTableData` dedupes automatically. Uses direct URL navigation (menu nav unreliable from `task-testing` project).
- **Cosmetic tech-debt (2026-06-02):** `EXPECTED_COLUMNS[0]` declares `'Arrangement PK'` (uppercase K) but the UI renders `'Arrangement Pk'` (lowercase k). The spec compares case-insensitively, so there is NO test failure; align the constant to `'Arrangement Pk'` when you touch the file. Discovered in the payment-arrangement-servicing pipeline (7/7 PASS, dev3).

## ServicingCustomerPage - (Opt Out AI) + (Send Podium Link)

- **Location:** `src/pages/servicing/customer.page.ts`

**Opt Out AI methods:**
- `navigateToPrimaryContact` - navigates to Primary Contact section; handles CONFIRM modal + dismisses modals
- `enterPrimaryContactEditMode` - clicks pencil icon, waits for checkboxes to become enabled
- `isOptOutAiVisible` - true if "Opt Out AI" checkbox is visible in Mobile Phone section
- `isOptOutAiChecked` - checked state of "Opt Out AI" checkbox
- `toggleOptOutAi(reason?)` - enters edit mode, clicks checkbox, handles reason modal (enable only), clicks SAVE, returns toast text
- `setOptOutAi(enable: boolean)` - idempotent: only clicks if current state differs from target

**Send Podium Link methods:**
- `openSendInviteModal` - clicks envelope icon (`#invitation`), forces Bootstrap modal show class (CSS animations disabled)
- `isPodiumLinkButtonVisible` - true if "Send Podium Link" button is visible in InviteModal
- `sendPodiumLink` - full flow: open modal - click "Send Podium Link" (force) - confirm - wait for toast; returns toast text
- `closeSendInviteModal` - closes the Send Invite modal if open

**UI interaction notes:**
- Primary Contact section is READ-ONLY by default - click the pencil icon (`#PrimaryContact-edit`) first
- Checking "Opt Out AI" triggers the "Reason for Opt Out AI Mobile" modal (textarea + Save)
- Unchecking does NOT trigger the modal
- "Customer Information Confirmation" modal appears intermittently on page load - click CONFIRM
- Activity log format: `"UPDATED : Phone[ optOutAi changed from false to true ]"`
- `InviteModal` from `@uownleasing/common-ui` uses Bootstrap "modal fade" - CSS animations disabled in tests prevent "show" class; force via JS
- Click "Send Podium Link" uses `force:true` (React unmounts InviteModal during click handler)
- ConfirmationModal: title "Please Confirm", button "Continue" - also force:true for same reason

## WebsiteBasePage - Update Phone

- **Key methods:**
 - `updatePhoneNumber(areaCode, phoneNumber)` - navigates to Update Contact Info and fills phone fields
 - `getErrorMessageText` - returns error message if visible
 - `getSuccessMessageText` - returns success message if visible
 - `isErrorVisible` - boolean whether error is displayed
- **Selectors added:** `wsPhoneAreaCodeInput`, `wsPhoneNumberInput`, `wsSaveChangesButton`, `wsSuccessMessage`, `wsErrorMessage`, `wsUpdatePhoneSection`

## MerchantEditPage - (Make Inventory Category Mandatory)

- **Location:** `src/pages/origination/merchant-edit.page.ts`
- **Key methods:**
 - `navigateToAddMerchant(originationUrl)` - navigates to Add Merchant form
 - `fillMerchantForm(data)` - fills all main merchant fields (text + react-select) via private `pickReactSelectOption(fieldId, value)`
 - `selectInventoryCategory(value)` - picks a value from the Inventory Category react-select
 - `clearInventoryCategory` - sends Backspace/Delete to the combobox input (LIMITATION: does NOT reliably null the Formik state - use only for negative-validation CTs)
 - `getInventoryCategoryValue` - currently selected category text
 - `isInventoryCategoryLabelRequired` - true if label carries required marker
 - `getInventoryCategoryErrorText` - Formik error message text
 - `openCloneDropdown` - clicks `<a class="dropdownContainer__ddButton">` (NOT a `<button>`)
 - `selectMerchantToClone(searchText)` - types into search input, clicks first `.dropdown-item:not(.dropdown-header)` child
 - `isClonedFromTooltipVisible` - checks visibility of the cloned-from icon tooltip

- **Selectors block:** `MerchantAddEditSelectors` in `src/selectors/selector.types.ts`
 - `merchantListAddButton`, `merchantCloneDropdownToggle`, `merchantCloneDropdownInput`, `merchantCloneDropdownItem`, `merchantClonedFromIcon`, `inventoryCategoryControl`, `inventoryCategoryInput`, `inventoryCategoryClearIndicator`, `inventoryCategorySingleValue`, `inventoryCategoryLabel`, `inventoryCategoryErrorText`, `merchantRefCodeInput`, `merchantNameInput`, `merchantLegalNameInput`, `merchantLocationNameInput`

- **Platform quirks discovered:**
 - Origination react-selects mix `filter__*` (classNamePrefix="filter") AND default `css-*` prefixes in the same form
 - Generic option selector that works for both: `.filter__option, [class*="css-"][class*="option-"], [class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])`
 - The Clone DropdownButton is `<a class="dropdownContainer__ddButton">` (not `<button>`); menu items are `.dropdown-item` inside `.dropdown.show`. The first item is a header with a search input - always exclude it via `.dropdown-item:not(.dropdown-header)`.
 - `page.waitForResponse('/uown/createOrUpdateMerchant')` is flaky in qa2 (response fires after navigation invalidates the wait). Prefer `waitForRequest` + `expect.poll(=> page.url.includes('addMerchant'))` as the UX success proof.

## AmsUserDetailsPage - (AMS Merchant Selection Flow)

- **Location:** `src/pages/ams/ams-user-details.page.ts`
- **Key methods (merchant edit flow):**
 - `clickEditMerchantsButton` - dispatches click event on SVG button (`#EditUserMerchants-edit`)
 - `cancelMerchantsEdit` - clicks CANCEL and waits for read-only mode
 - `saveMerchantsEdit` - clicks SAVE, handles "Confirm Changes" modal, waits for read-only mode
 - `clickManageMerchants` - clicks "Manage merchants" button in edit mode
 - `clickDeleteAll` - clicks "Delete All" button in edit mode
 - `isManageMerchantsVisible`, `isDeleteAllVisible`, `isSearchboxDisabled`, `isSearchboxVisible`
 - `filterCurrentMerchants(term)` - types in read-only searchbox to filter displayed merchants
 - `clearCurrentMerchantsFilter` - clears the searchbox

- **Selectors updated:**
 - `amsEditUserMerchantsButton: '#EditUserMerchants-edit'` (was span, now button)
 - `amsUserMerchantsTag: '[class*="merchants-read_tag"]'` (new CSS module class)
 - `amsManageMerchantsButton: 'button:has-text("Manage merchants")'`
 - `amsDeleteAllMerchantsButton: 'button:has-text("Delete All")'`

## ErrorLogPage - Origination portal

- **Location:** `src/pages/origination/error-log.page.ts`
- **Extends:** `OriginationBasePage`. Provides methods for Error Log page (Submit/Send Application error tracking).

| Method | Description |
|--------|-------------|
| `navigateToErrorLog` | Navigates to `/errorLog` route |
| `isSendApplicationTabActive` | Checks if Send Application tab is active |
| `clickSubmitApplicationTab` / `clickSendApplicationTab` | Tab switching |
| `getVisibleTabNames` | Array of visible tab names |
| `getTableColumnHeaders` | Array of table column header texts |
| `getTableRowCount` | Number of rows in the error log table |
| `getFirstRowData` | First row as `Record<header, cellValue>` |
| `setFilterFromDate(date)` / `setFilterToDate(date)` / `setFilterSearch(text)` | Set filter fields |
| `submitFilters` | Clicks filter submit + waits for spinner |
| `waitForTableLoad(timeoutMs?)` | Waits for table visibility |
| `getRowsPerPageValue` / `changeRowsPerPage(value)` | Rows-per-page dropdown |
| `getPaginationText` | Returns pagination text or null |
| `getPageHeading` | Returns page heading (e.g., `"ERROR LOG"`) |
| `isDownloadCsvButtonVisible` | Download CSV button visible in active tab panel (calls `expandFilters` first) |
| `isEmailCsvButtonVisible` / `clickEmailCsv` / `isEmailCsvModalVisible` | Email CSV flow |

- **Selectors (prefix `el`):** `elTabSendApplication`, `elTabSubmitApplication`, `elFilterFromDate`, `elFilterToDate`, `elFilterSearch`, `elFilterSubmitButton`
- **CSV download filenames:** Submit Application: `submit-application-error-log-reports.csv`; Send Application: `error-log-reports.csv`
- **Tab active scoping:** `getActiveTabPanel` returns `page.locator('.tab-pane.active')` - count=1 (only one panel active). All filter interactions scoped to active panel.

## ProgramGroupsPage - Origination portal

- **Location:** `src/pages/origination/program-groups.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `navigateToProgramGroups` | Navigates to `/programGroups` |
| `getGroupRowCount`, `getGroupName(index)`, `findGroupWithPrograms`, `getGroupProgramCount(index)` | Group list inspection |
| `openGroupModal(index)`, `getModalTitle`, `getModalTableHeaders`, `getModalProgramCount`, `getModalProgramData(index)` | Group detail modal |
| `clickProgramInModal(index)` | Navigates to program details |
| `searchGroups(term)`, `isEditButtonVisible(index)`, `closeGroupModal`, `isSearchVisible` | Misc |

- **Selectors (prefix `pg`):** `pgGroupCountCell`, `pgGroupInfoIcon`, `pgGroupEditIcon`, `pgProgramLink`

## ProgramsPage - Origination portal

- **Location:** `src/pages/origination/programs.page.ts`. Extends `OriginationBasePage`.
- **Pre-existing methods:** `navigateToPrograms`, `getCleanHeaders`, `showMaxRows`, `findProgramRow`, `clickProgramLink`, `fillProcessingFee`, `fillAmountAtSigned`, `saveProgram`, `getColumnWidth`

**New methods:**

| Method | Description |
|--------|-------------|
| `getMoneyFactorTableValue(programName)` | Money Factor column value |
| `getMoneyFactorFormValue` | `input[name='moneyFactor']` from edit form |
| `navigateToProgramDetails(originationUrl, programPk)` | Direct to `/programs/:pk` |
| `getProgramNameFromForm` | `input[name='programName']` from details form |
| `isCloneButtonVisible` / `isCloneGroupButtonVisible` / `isActivityLogPanelVisible` | Details page UI checks |
| `waitForProgramDetailsLoad` | Waits for program name input visible |
| `openCloneGroupModal` / `fillCloneGroupName(name)` / `selectAllProgramsInModal` / `submitCloneGroupModal` / `waitForCloneGroupSuccess` | Clone Group flow |
| `getTableRowCount` / `getRowsPerPageValue` | Pagination |

## ProgramsListPage / ProgramDetailsPage / MerchantProgramsSectionPage - Origination portal (scheduleProgramActivationDeactivationDates)

### `ProgramsListPage` - left pane of `/programs`
- **Location:** `src/pages/origination/programs-list.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `goto(originationUrl)` / `navigate(...)` | Navigate to `/programs` + wait for table load |
| `expandFilters` | Filter pane ships collapsed by default; opens the Filters drawer. Idempotent |
| `searchProgram(name)` | Auto-expands filters, fills Search input, clicks Search |
| `filterByGroup(groupName)` | Select group from `Program Groups` dropdown |
| `clickAddNewProgram` | Opens Program Details in create mode |
| `openProgramByName(programName)` | Clicks the row - opens Program Details |
| `getProgramRowByName(programName)` | Returns `Locator` |
| `waitForTableLoad` | Spinner cleared + first row visible |

### `ProgramDetailsPage` - right pane of `/programs`
- **Location:** `src/pages/origination/program-details.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `fillActivationDate(date)` / `fillDeactivationDate(date)` | Date format `MM/DD/YYYY` |
| `getActivationDate` / `getDeactivationDate` | Returns normalized `MM/DD/YYYY` |
| `clearActivationDate` / `clearDeactivationDate` | |
| `fillProgramName(name)` / `fillTermMonths(n)` / `fillMoneyFactor(...)` ... | Other form fields |
| `clickSave` / `clickCancel` / `clickClone` / `clickCloneGroup` | Action buttons |
| `waitForSaveToastVisible` | Returns the toast text after SAVE |
| `getInlineErrorMessage` | For `activationDate > deactivationDate` UI validation |
| `getLatestNoteOfType(type)` | Parses Notes section - `PROGRAM_DATA_CHANGE` is the standard audit type |
| `getNotesEntries` | Returns array of `{date, type, userId, notes}` |
| `waitForDetailsPanelLoad` | Panel header + program-name field visible |

### `MerchantProgramsSectionPage` - merchant detail page (read-only)
- **Location:** `src/pages/origination/merchant-programs-section.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `gotoMerchantDetail(originationUrl, merchantNumber)` | Navigate to `/merchant/:number` |
| `getProgramRowsInSection` | Returns `MerchantProgramSectionRow[]` |
| `getProgramStatusByName(programName)` | Returns `'Active'` | `'Inactive'` | `''` |
| `hoverStatusBadge(programName)` | Triggers tooltip render |
| `getStatusTooltipText(programName)` | Tooltip text with activation/deactivation dates |
| `hasEditAction(programName)` | Must return `false` - read-only contract |

## LeadsPage - Origination portal

- **Location:** `src/pages/origination/leads.page.ts`. Extends `OriginationBasePage`.
- **Columns:** Lead # | Account # | Lead Status | Internal Status | State | Term Month | Invoice Number | Customer Name | SSN | Phone Number | Email Address | Merchant | Location | Ref Merchant Code | Client Type | Created at | Created from

| Method | Description |
|--------|-------------|
| `navigateAndWaitForTable` | Navigates to Leads page and waits for "Search Result" heading + spinner |
| `expandFilters` | Expands filter panel if collapsed |
| `setFromDate(date)` / `setToDate(date)` / `filterByDateRange(from, to)` | Date range filters |
| `setInvoiceNumber(invoiceNumber)` | "Invoice Number" filter |
| `setLeadPk(leadPk)` / `setCustomerName(name)` | Search fields |
| `filterByLeadStatus(displayStatus)` / `filterByMerchant(merchantName)` / `filterByLocation(locationName)` | React Select filters |
| `clearMerchantFilter` / `getMerchantValue` / `getLocationValue` / `getLocationOptions` | Filter inspection |
| `submitFilters` | Clicks Search; waits for table rows or "no records" |
| `getCleanHeaders` | Headers with sort indicators stripped |
| `getVisibleRowCount` / `findRowByLeadPk(leadPk)` / `getAllVisibleRows` | Table data |

- **Selectors** (`LeadsTableSelectors`): `leadsInvoiceNumberInput` - `"input[placeholder='Search by Invoice Number']"`
- **Notes:**
 - Leads table headers include sort indicators - always use `getCleanHeaders` before column name matching
 - `filterByMerchant` and `filterByLocation` click the `filter__control` element to avoid the `filter__input-container` intercept

## MissingDataFormPage - Origination portal (side-fix)

- **Location:** `src/pages/origination/missing-data-form.page.ts`

| Method | Description |
|--------|-------------|
| `getProcessingFeeAmount` | Returns the processing fee amount text. Uses `getByText(/\$\s?[\d,]+\.?\d*\s+Authorization/i)` |
| `isProcessingFeeDisplayed` | Returns `true` if the processing fee element is visible |

**IMPORTANT:** Prior CSS-module hash selector `.missing-data-panel_missingDataPanel__feeAmount__cn7Wg` was replaced with text-based locator.

**Known gap (not fixed in #1285):** `fillBankAccount` uses `getByText(bank.accountType, { exact: true })` which causes strict-mode violation. See application-lifecycle pitfall #25.

## SeonWidgetComponent — standalone frameLocator-based component (added 2026-06-23)

- **Location:** `src/pages/components/seon-widget.component.ts`
- **Extends:** none — standalone component class (`constructor(page, parentFrame?)`). Does NOT extend BasePage. Follows the same convention as `FilteredCsvDownloadControls` (composed into pages, not a page). Export via `src/pages/components/index.ts`.
- **Purpose:** drives and asserts the SEON Identity Verification widget that the consumer portal injects on the `/complete` payment step when the merchant has `isSeonIdCheckRequired=true` and no valid SEON record exists. First component in the project that DIRECTS a cross-origin iframe via frameLocator (CDP-level; `page.evaluate` into `transfer.seonidv.com` is blocked by same-origin policy).
- **Topology — why there are two constructor signatures:**
  - Kornerstone `/complete` → SEON iframe is top-level on the `page` (pass no `parentFrame`)
  - PayPair / PayTomorrow → SEON iframe is nested inside the portal's `ptFrame` (pass `parentFrame`)
- **Reference spec:** `tests/e2e/origination/seon-widget-user-behavior.spec.ts` (P0, 7/7 PASS, sandbox 2026-06-23)
- **Reference pattern:** `docs/knowledge-base/seon-idv-widget-user-behavior.md` (SEON-UB-01..11)

**Public API:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `waitForSeonWidget` | `waitForSeonWidget(timeout?): Promise<void>` | Waits for the internal heading `"Verify your identity"` to be visible (~5s after goto). Guards against a stuck/loading iframe. |
| `isSeonWidgetVisible` | `isSeonWidgetVisible(timeout?): Promise<boolean>` | Non-throwing: true when heading visible. Distinct from outer-iframe presence. |
| `acceptPrivacyConsent` | `acceptPrivacyConsent(): Promise<void>` | Ticks the native checkbox; falls back to clicking label text if not directly actionable. |
| `isStartVerificationEnabled` | `isStartVerificationEnabled(): Promise<boolean>` | Reflects real `disabled` attribute — `false` before consent, `true` after. |
| `startVerification` | `startVerification(): Promise<void>` | Clicks "Start verification" — advances to camera/document/selfie. |
| `closeSeonWidget` | `closeSeonWidget(): Promise<void>` | Clicks the real X close control. Does NOT wait for / assert dismissal (caller decides). |
| `isSeonGateBlockingPaymentForm` | `isSeonGateBlockingPaymentForm(paymentFieldLocator): Promise<boolean>` | Non-destructive: true when the overlay blocks a given payment input. |
| `getSeonErrorMessage` | `getSeonErrorMessage(): Promise<string \| null>` | Returns widget error text or null. Matches "Failed to verify"/"verification failed" family. |
| `hideWidget` | `hideWidget(): Promise<void>` | BACK-COMPAT only: hides iframe via JS (display:none). Preserves legacy `dismissSeonOverlay` behavior. Use `closeSeonWidget()` for real cancel UX. |

**Selectors (confirmed live, sandbox 2026-06-23, lead 97964):**
- Outer iframe: `[data-testid="seon-idv-iframe"]` (static `SeonWidgetComponent.OUTER_IFRAME`)
- Inside frame (cross-origin `transfer.seonidv.com`, via frameLocator):
  - Heading: `getByRole('heading', { name: /verify your identity/i })`
  - Consent: `getByRole('checkbox')` (native — count=1)
  - Start btn: `getByRole('button', { name: /start verification/i })`
  - X close: `[class*="close-button"]` — icon-only, NO accessible name/aria-label/testid/title; CSS-module class partial match is the **last-resort, documented choice**
- Widget content loads ~5s after page goto

**When NOT to use:**
- If you only need the legacy DOM-hide behavior, `contract.page.ts:dismissSeonOverlay` still delegates to `hideWidget()` — no change needed unless exercising real cancel UX.
- PayPair and PayTomorrow still have their own `dismissSeonOverlay` impls (hide-only). Consolidation to `SeonWidgetComponent` is a tracked refactor debt (see below).

**Known behavior — cancel UX is non-trivial (OBSERVATION S3/P2, 2026-06-23):**
Clicking the real X (`closeSeonWidget`) does NOT dismiss the widget in sandbox (reproduced 2x — probe + validated spec). Root hypothesis: SEON SDK sandbox-mode does not implement close, or click does not propagate cross-origin. Not a confirmed bug. See [[fraud-vendors-knowledge]] Pitfall #11 and [[application-lifecycle]] Pitfall #142.

**Hook caveat:** `pre-write-validate.sh` Rule 1 (line 25-33) checks `export class` in `src/pages/**` without `extends` → blocks the file. The implementer worked around this with the `class X {}; export { X }` pattern. See [[application-lifecycle]] Pitfall #143.

**Refactor debt — 3 copies of `dismissSeonOverlay`:**
Today `contract.page.ts` delegates to `SeonWidgetComponent.hideWidget()`. PayPair (`paypair-portal.page.ts:900`) and PayTomorrow (`paytomorrow-portal.page.ts`) still carry their own hide-only impls. 5 specs depend on them. Track as follow-up to consolidate into `SeonWidgetComponent.hideWidget()`. Do NOT refactor now.

---

## ContractPage - missing employment info flow

Methods added to `ContractPage` (`src/pages/origination/contract.page.ts`) for the `/complete` URL when `planId` is empty:

| Method | Signature | Description |
|--------|-----------|-------------|
| `dismissSeonOverlay` | `dismissSeonOverlay: Promise<void>` | Hides SEON `[data-testid="seon-idv-iframe"]` via JS. No-op if iframe absent. |
| `isMissingEmploymentScreen` | `isMissingEmploymentScreen: Promise<boolean>` | True se `/complete` URL showing "missing employment info" screen. |
| `fillNextPaycheckDate` | `fillNextPaycheckDate(nextPayDate)` | Fills "When is your next paycheck?" input (step 1). `MM/DD/YYYY` format. |
| `selectMissingPayFrequency` | `selectMissingPayFrequency(frequency)` | Selects pay frequency from React Select (step 2). Valid: `WEEKLY`, `BI_WEEKLY`, `SEMI_MONTHLY`, `MONTHLY`. |
| `waitForPlanSelectionScreen` | `waitForPlanSelectionScreen: Promise<void>` | Waits for "Please review and select one of the programs below." heading (30s). |
| `choosePlanByName` | `choosePlanByName(programName, index?)` | Clicks payment program button matching `programName`. Falls back to index. |
| `completeMissingEmploymentInfo` | `completeMissingEmploymentInfo(nextPayDate, frequency, programName?)` | Convenience: full 3-step flow. Default `programName = 'Bi-Weekly'`. |

- **Trigger condition:** when `planId` is empty in the `/complete` URL, the backend renders a 2-step employment form before the payment program options.
- **New selectors:** `completeNextPaycheckInput`, `completePayFrequencyCombobox`, `completePlanSelectionHeading`, `completeChooseProgramBtn`

## ServicingDocumentsPage -

- **Location:** `src/pages/servicing/documents.page.ts`
- **Extends:** `ServicingBasePage`

| Method | Signature | Description |
|--------|-----------|-------------|
| `goto` | `goto(accountPk: string \| number)` | Navigates to customer information page for the account |
| `openDocumentsTab` | `openDocumentsTab` | Clicks the Documents tab and waits for the table to load |
| `waitForLoaded` | `waitForLoaded` | Waits for documents table to be visible and non-empty |
| `findRowByName` | `findRowByName(name: string)` | Returns `Locator` for the first row matching the document name |
| `getRowByDocumentNumber` | `getRowByDocumentNumber(docNumber: string)` | Returns `Locator` for row matching document number |
| `hasDocument` | `hasDocument(name: string): Promise<boolean>` | True if a document with the given name exists |
| `downloadDocument` | `downloadDocument(name: string): Promise<Download>` | Clicks download link; returns Playwright `Download` object |
| `openDocumentInViewer` | `openDocumentInViewer(name: string)` | Opens document link in viewer |
| `getDocumentRowsCount` | `getDocumentRowsCount: Promise<number>` | Returns total number of document rows visible |

## OriginationCustomerPage - lead status-action modals (added 2026-06-18, #1315)

- **Location:** `src/pages/origination/customer.page.ts`
- **Purpose:** drive the human-agent status transitions from the customer page summary bar (`Set to Expired`, `Change to Signed`) THROUGH the browser, so the SPA sends the `username` HTTP header that the #1315 fix relies on to record the real `agent_username` (not "SYSTEM"). Driving these via direct API call drops the header and reproduces the SYSTEM artifact — see KB `docs/knowledge-base/modification-report-agent-name-bug.md` BR-05.

| Method | Signature | Description |
|--------|-----------|-------------|
| `setToExpired` | `setToExpired(comment?)` | Clicks "Set to Expired" via `clickActionButton` (JS-dispatch click after scrollIntoView — button lives in the off-screen-prone horizontal summary bar), waits for the "Add a Comment" modal, fills the **optional** comment, confirms via **"Save"** (`button[type='submit']`). No `.catch` swallow on the modal/confirm waits — a missing confirm now throws (the pre-fix silent-miss left `changeLeadStatus` unfired). Default comment carries an automation marker into `uown_los_lead_notes` / `uown_lead_modifications`. |
| `changeToSigned` | `changeToSigned(comment?)` | Hardened for the **"Move Contract to Signed"** modal: comment is **REQUIRED** (CONFIRM stays disabled until filled), confirms via `button.submit-button` / "CONFIRM". Falls back to a plain confirm dialog (no comment field) for the older path. |

- **CRITICAL — the two confirm modals are NOT symmetric (pitfall #124, [[selector-hardening]]):**
  - `Set to Expired` → "Add a Comment" modal, comment **OPTIONAL**, confirm label **"Save"** (`button[type='submit']`, NO `.submit-button` class).
  - `Change to Signed` → "Move Contract to Signed" modal, comment **REQUIRED**, confirm label **"CONFIRM"** (`button.submit-button`).
  - Do NOT reuse one modal's confirm selector for the other — the old `setToExpired` used the CONFIRM/`.submit-button` selector → 0 matches → silent no-op.
- **Selectors (`common.selectors.ts`):** `moveContractToSignedModal` / `moveContractToSignedComment` / `moveContractToSignedConfirm`; `setToExpiredModal` / `setToExpiredComment` (`input[name='comment']`, placeholder "Type here...") / `setToExpiredConfirm` (`button[type='submit']` / "Save"). Both modal/confirm locators apply `.last()` to win against any stacked `.modal.show`.
- **DOM source:** LIVE qa2 lead 16728, 2026-06-18, headless chromium 1440×900. Confirmed via XHR 200 + status UW_APPROVED→EXPIRED + `uown_lead_modifications.mod_type=LEAD_STATUS_CHANGE`.
- **Test:** `tests/e2e/origination/R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts` (CT-01 EXPIRED, CT-02 SIGNED — `@qa2 @regression @critical`).

## OriginationCustomerPage - `ensureAuthenticated` v8 auth-retry pattern

**Location:** `src/pages/origination/customer.page.ts:225-385`

**Pattern:** `ensureAuthenticated(intendedPath?: string)` - v8 rewrite with 4 components: (A) pre-emptive JWT exp check; (B) caller-supplied intendedPath; (C) page.reload; (D) a real hydration guard via poll until JWT `exp > now + 60s`.

**Forbidden anti-patterns:** guarding by the existence of a `*Store$` key; `goto(base)` during a pending SPA nav; lazy detection via `isLoginPage`.

**Cross-links:** pitfall #69 in [[application-lifecycle]] (full root cause).

## OriginationCustomerPage - `settleLeaseViaDocuments` brand-filter gap

**Pitfall (F-005):** the filter uses the regex `/^UOWN_/` which does not match KS3015 (Kornerstone) documents. **Status:** `[OBSERVATION]`.

## OriginationCustomerPage - (Lease panel reader)

- **New method:** `getLeasePanelContracts: Promise<LeasePanelContract[]>`
- **New interface:** `LeasePanelContract` - `contractNumber`, `contractType`, `status`, `termMonths`, `timestamp`
- **New selectors block:** `LeasePanelSelectors`

## CreditCardHistoryPage - Servicing portal

- **Location:** `src/pages/servicing/credit-card-history.page.ts`
- **Extends:** `ServicingBasePage`

| Method | Description |
|--------|-------------|
| `navigateToCcHistory` | Navigate via top menu (History - CC Transactions) |
| `navigateToCcHistoryByUrl(baseUrl, accountPk)` | Sequential navigation: customer-information first - then CC Transactions tab (required for MobX store hydration, pitfall #40). |
| `getRowCount` | Number of rows |
| `getRowByTxPk(txPk)` | Find table row by cct PK |
| `getStickyRecoveryStatus(cctPk)` | Returns Sticky Recovery Status cell text |
| `getStickyTransactionId(cctPk)` | Returns Sticky Txn ID cell text |
| `waitForStickyRecoveriesResponse(timeoutMs?)` | Arms a `waitForResponse` listener on `/sticky-recoveries`. Must be called BEFORE navigation |
| `waitForStickyCellPopulated(cctPk, timeoutMs?)` | Polls until Sticky Recovery Status cell is non-empty |
| `reloadAfterStickyDataReady(baseUrl, accountPk, cctPk, timeoutMs?)` | Full reload pattern encapsulating MobX race workaround |

## Pitfall - `filter({ hasText: pk }).first` in rdt tables

**Symptom:** `getRowBy*Pk` helpers return "-" or empty text.

**Root cause:** `getRows.filter({ hasText: String(pk) }).first` does a **substring** match on the accumulated text of the ENTIRE row. Multiple rows may contain the PK as a substring.

**General rule for rdt-style tables:**

```
NO: getRows.filter({ hasText: String(pk) }).first // substring + first - silent collision
NO: row.locator('div[role="cell"]').nth(N) // hardcoded index
YES: page.locator(SELECTORS.tableRowById(pk)) // row id (rdt uses keyField)
YES: rows.filter({ has: page.getByRole('cell', { name, exact: true }) }) // exact cell
YES: dynamic columnIndex resolution via header role=columnheader
```

## SettlementBreakdownModal - Servicing portal

- **Location:** `src/pages/servicing/settlement-breakdown.modal.ts`
- **Extends:** `ServicingBasePage`

| Method | Signature | Description |
|--------|-----------|-------------|
| `open` | `open: Promise<void>` | Clicks Settlement Amount label to open modal |
| `close` | `close: Promise<void>` | Clicks X button to dismiss |
| `getBreakdownRows` | `getBreakdownRows: Promise<Array<{label, value}>>` | Returns all label/value pairs |
| `getValueByLabel(label)` | `getValueByLabel(label: string): Promise<string>` | Returns value for given label |
| `isVisible` | `isVisible: Promise<boolean>` | True if modal is currently open |

- **Known bug (BUG-3):** Modal opens EMPTY when Settlement Amount is $0.00.
- **Custom DOM structure (pitfall #49):** NOT Bootstrap `.modal-body`. Content in `<div class="overflow-auto p-3">`. Close button is `svg.fa-xmark-large`.

## AmsMerchantsPage - AMS portal

- **Location:** `src/pages/ams/ams-merchants.page.ts`
- **Extends:** `AmsBasePage`

| Method | Description |
|--------|-------------|
| `goto(amsBaseUrl)` | Direct navigation to `/merchants` |
| `clickSidebarMerchants` | Click Merchants link in AMS sidebar |
| `openFilters` | Opens Filters panel; idempotent |
| `submitSearch(term)` | Opens Filters, fills search input, clicks Search |
| `pickActiveAndSearch(state)` | Selects "Active" or "Inactive" from tri-state combobox |
| `clearActiveFilter` | Unchecks whichever option is currently checked |
| `getVisibleRowTexts` | Returns innerText of all rendered rdt rows |
| `rowContaining(text)` | Returns `Locator` for first row with text (substring match) |

- **PITFALL - Custom ARIA-checkbox widget:** Active combobox is NOT react-select and NOT a native `<select>`. Approved strategies: (1) Keyboard contract; (2) React-select option ID `[id^="react-select-"][id$="-option-0"]`. See [[application-lifecycle]] pitfall #47.

## AmsUsersPage - AMS portal

- **Location:** `src/pages/ams/ams-users.page.ts`
- **Extends:** `AmsBasePage`

| Method | Description |
|--------|-------------|
| `goto(amsBaseUrl)` | Direct navigation to `/users` |
| `clickAddUser` | Clicks "Add User" button - triggers lazy `getAllAvailableMerchants` call |

## PaymentHistoryPage - Servicing portal refund/reverse flow (dev3 2026-06-01)

- **Location:** `src/pages/servicing/payment-history.page.ts`
- **Extends:** `ServicingBasePage`
- **Exported via:** `src/pages/servicing/index.ts`
- **Purpose:** Reverse/Refund flow on the Servicing `/payment-history/{accountPk}` screen (History - Payments). This is the CORRECT screen for refunds, NOT `/payment-transaction` (which has no per-row reverse icon). See application-lifecycle pitfall #77.

| Method | Description |
|--------|-------------|
| `navigateByUrl(baseUrl, accountPk)` | Direct navigation to `/payment-history/{accountPk}` |
| `openReverseForPaymentByAmount(amount)` | Finds the payment row by amount and clicks the reverse icon (`svg[data-icon="arrow-rotate-left"]`) to open the modal |
| `setReverseReason(reason)` | Selects the React Select reverse reason. Options (exact DOM text): "Reverse", "Fully Refund", "Partially Refund" (NOT "Partial Refund") |
| `typeReverseAmount(amount)` | Fills `#paymentAmount` (visible only when "Partially Refund" is selected) |
| `typeReverseComment(text)` | Fills the comment textarea in the modal |
| `submitReverse` | Clicks the modal Save button |
| `cancelReverse` | Clicks the modal Cancel button |

- **Selectors (`common.selectors.ts:219-233`):** `paymentHistoryRows`, `paymentHistoryReverseIcon`, `reverseReasonControl`, `reverseReasonOption`, `reversePaymentAmountInput`, `reverseRefundFeeCheckbox`, `reverseCommentTextarea`, `reverseModalSaveButton`, `reverseModalCancelButton`
- **PITFALL - `reverseReason` is React Select (`<div>`), NOT native `<select>`:** `selectOption` no-ops/fails. Select via control click + option click. See application-lifecycle pitfall #78.
- **Activity log:** refund logs to `uown_sv_activity_log` (Servicing action), NOT `uown_los_lead_notes` (LOS).
- **`#paymentAmount` is conditional:** visible only after "Partially Refund" is chosen.

## MerchantListPage - Origination Merchant list (`/merchant`)

- **Location:** `src/pages/origination/merchant-list.page.ts`
- **Extends:** `OriginationBasePage`. Exported via `src/pages/origination/index.ts`.
- **Purpose:** navigation + table-read + Config Columns + Active filter + CSV export for the `/merchant` list page. **Distinct from `MerchantEditPage`** (`/merchant/{refMerchantCode}` add/edit form).

| Method | Description |
|--------|-------------|
| `navigateToMerchantList(originationUrl)` | Navigate to `/merchant` and wait for the table (empty dataset tolerated) |
| `getVisibleRowCount` | Row count; `0` when "There are no records to display" |
| `openConfigColumns` | Opens the Config Columns Bootstrap dropdown (idempotent). NO Apply button — selection is immediate (BR-01) |
| `closeConfigColumns` | Closes the dropdown via Escape |
| `isColumnChecked(name)` | Whether the column checkbox (native `input` keyed by `name`/`id` = column label) is checked |
| `setColumn(name, checked)` | Idempotently toggles a column; table updates on click (no Apply) |
| `getTableHeaders` | Headers in display order (sort arrows stripped) via `getNormalizedHeaders` |
| `getCellValueForMerchant(merchantCode, columnLabel, maxPages=5)` | Cell text under a column for a merchant row; paginates; `''` for empty/NULL cell, `null` if merchant row not found |
| `getMerchantCodeAtRow(rowIndex)` | Merchant Code of the row at 0-based index on the current page |
| `setActiveFilter('Active' \| 'Inactive')` | Sets the `#isActive` react-select then clicks Search to re-query (BR-06) |
| `downloadCsv` | Clicks "Download CSV", saves the download, returns local path (`merchant-report.csv`) |

- **Selectors (`ColumnOrderSelectors` in `selector.types.ts`):** `configColumnsTrigger`, `configColumnsPanelMerchants` (`div.dropdown.show:has-text('Configure the view')` — Merchants-specific Bootstrap dropdown, NOT the Overview dialog), `configColumnsCheckbox`, `csvDownloadTrigger`. Active filter reuses `FilterSelectors` (`filterControl`, `filterMenuPortal`, `filterOption`, `filtersButton`, `searchButton`).
- **Config Columns quirks (see [[application-lifecycle]] pitfalls #104-#106):**
 - Panel is a Bootstrap `div.dropdown.show`, NOT `[role='dialog']`/modal/aside (Overview's pattern). The generic `configColumnsPanel` selector returns 0 elements here.
 - Checkboxes are native `<input type='checkbox'>` whose `name`/`id` = the column label (no `<label>` wrap). `value="true"` checked, `value=""` unchecked.
 - Selection is immediate — no Apply/Save button; the table updates on click.
- **Active filter quirks (see [[application-lifecycle]] pitfall #107):**
 - `#isActive` react-select has only `Active`/`Inactive` (no "All" option — clear the selection to show all). Default page state is `Active`. NOT applied on change — requires the Search button click (BR-06).
- **Knowledge-base source:** `docs/knowledge-base/merchants-config-columns-export.md`.

## Multi-Select Merchant/Location filter pages — MMH / ModReport / Funding

> The shared multi-select Merchant/Location filter component (originally shipped to 7 pages in #1292) was extended to MMH, ModReport, and Funding Queue. The component DOM is identical across pages (`filter__value-container--is-multi`, `index-module_customOptionStyles__CSG9m` checkbox options) but the inter-page BEHAVIOR diverges — see the divergence table below and KB `docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md`. Legacy single-select `filterByMerchant`/`filterByLocation` methods are kept (deprecated, backward compat) — prefer the array `filterByMerchants`/`filterByLocations`.

### `MerchantLocationFilterPO` — shared multi-select filter PO
- **Location:** `src/pages/origination/merchant-location-filter.po.ts`. Extends `OriginationBasePage`.
- **`applySearch` regex** covers 3 Search endpoints per page: `getMerchantDataChangeResults` (MMH), `getModifiedLeads` (Modification Report), `getLeadsForFundingQueue` (Funding Queue, also matched via `funding` token).
- **[HYPOTHESIS]** the `getLeadsForFundingQueue` endpoint name is NOT confirmed via MCP (inferred from older reports); confirm via `browser_network_requests` in qa2 before treating it as `[CONFIRMED]`.

### `MerchantModHistoryPage` — MMH `/merchantModificationHistory`
- **Location:** `src/pages/origination/merchant-mod-history.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `filterByMerchants(merchants[])` / `filterByLocations(locations[])` | Multi-select checkbox filters. Location is DISABLED until ≥1 Merchant selected (BR-01) |
| `applyFilters` | Applies the current filter selection and waits for the MMH Search response |
| `getMerchantSelectedCount` / `getLocationSelectedCount` | Count of currently selected chips |
| `getCheckedMerchants` | Labels of checked Merchant options |
| `listAvailableMerchants` / `listAvailableLocations` | Option labels in the open dropdown |
| `getMerchantColumnValues` | Merchant column cell values of the result table |
| `getVisiblePageInfo` / `goToNextPage` / `goToPreviousPage` | Pagination |
| `filterByMerchant` / `filterByLocation` *(deprecated)* | Legacy single-select, kept for backward compat |

### `ModificationReportPage` — `/modificationReport`
- **Location:** `src/pages/origination/modification-report.page.ts`. Extends `OriginationBasePage`.
- **Multi-select surface (same as MMH):** `filterByMerchants`, `filterByLocations`, `applyFilters`, `getMerchantSelectedCount`, `getLocationSelectedCount`, `getCheckedMerchants`, `listAvailableMerchants`, `getMerchantColumnValues`, `getVisiblePageInfo`, `goToNextPage`, `goToPreviousPage`. Location DISABLED until a Merchant is selected (BR-01).
- **Agent / Date / Modification-Type filters + row reads:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `filterByAgentName` | `filterByAgentName(agentName)` | Free-text agent search (partial match), e.g. `jmendes.gow` or `SYSTEM`. Expands the filter panel, then sets `SELECTORS.modReportAgentNameInput` (`input#agentName`) via the **native-setter** path. |
| `filterByDateRange` | `filterByDateRange(startDate, endDate)` | Sets Start/End Date. Dates MUST be `MM/DD/YYYY` (DOM-confirmed placeholder, qa2 2026-06-18). Both `input#from`/`input#to` are React-controlled — set via native setter, NOT `fill()`. |
| `filterByModificationType` | `filterByModificationType(type)` | Single-select react-select anchored on `label:has-text('Modification Type') ~ div .filter__control`. Options: `LEAD_STATUS_CHANGE` / `APPROVAL_AMOUNT_CHANGE` / `LEASE_MOD`. |
| `search` | `search()` | Clicks Search; delegates to `submitFilters` (waits for table rows OR the "There are no records to display" empty-state). |
| `getAllRows` | `getAllRows(): Promise<Record<string,string>[]>` | Every visible row keyed by sort-arrow-normalized header text. `[]` on empty-state. Columns: Lead, Date, Modification Type, Merchant Name, Location Name, Old/New Status, Old/New Internal Status, New/Old Amount, Agent Name. |
| `getRowByLeadPk` | `getRowByLeadPk(leadPk)` | First row whose **`Lead`** column equals `leadPk`, or `null`. **Walks every result page** (rdt paginates at 10/page) via `goToNextPage` until found or Next is disabled — bounded by a 50-page guard. |
| `getAgentNameByLeadPk` | `getAgentNameByLeadPk(leadPk)` | Convenience — the "Agent Name" cell of the matching row, or `null`. |

- **`forceReactInputValue(selector, value)` (private):** sets a Formik/React-controlled input via the prototype native-value setter + dispatched `input`/`change`/`blur` events. `page.fill()` alone **silently no-ops** on `input#agentName`/`input#from`/`input#to` because React owns the value (same pattern as `SearchPage.forceReactInputValue` / `#search-input`). See [[selector-hardening]] "React-controlled date/text input" rule and the anti-pattern table in [[page-object-pattern]] (`page.fill on React-controlled inputs`).
- **Pagination on `getRowByLeadPk` (rdt default 10 rows/page):** do NOT assume the target lead is on page 1 — a freshly-created lead can land below the fold once the date filter widens the set. The walk is mandatory; a single-page `getAllRows().find(...)` would silently miss page-2+ rows.
- **DOM source:** LIVE qa2 2026-06-18 (`jmendes.gow`, headless chromium 1440×900). Date placeholder `MM/DD/YYYY` confirmed; the 3 ids are stable Formik names (`agentName`/`from`/`to`).
- **Test:** `tests/e2e/origination/R1.53.0_fixSystemAgentUsernameInModificationReport.spec.ts` — CT-03 asserts the rendered "Agent Name" cell = real agent (not SYSTEM) for a fresh `UW_APPROVED → EXPIRED`; CT-04 asserts a legitimate-SYSTEM `CONTRACT_CREATED → SIGNED` webhook record renders SYSTEM (read-only reuse + `test.skip` guard).

### `FundingPage` — Funding Queue `/funding`
- **Location:** `src/pages/origination/funding.page.ts`. Extends `OriginationBasePage`.
- **Behavioral divergences vs MMH/ModReport (do NOT copy assumptions across pages):** Location is INDEPENDENT (NOT disabled by Merchant — BR-02); Status filter has "Funding" PRE-SELECTED on load (BR-03) and is the only filter with "Select All".
- **SCOPE BOUNDARY (qa2 2026-06-19):** the FQ filter form is a CUSTOM component — labels are `<div>` (not `<label>`) and react-selects have stable IDs (`#statuses`/`#merchantName`/`#merchantLocation`). It does NOT consume the shared `MerchantLocationFilters` React component. Do NOT drive FQ filters via `MerchantLocationFilterPO` — its `<label>`-anchored XPath matches nothing here and throws `scrollIntoViewIfNeeded` timeout. Use `FundingPage`'s own `fq*`-backed methods (`listAvailableLocations`, `filterByLocations`, `filterByStatuses`, …).

| Method | Description |
|--------|-------------|
| `filterByStatuses(statuses[])` | Multi-select Status; CLEARS the default "Funding" selection before applying (pitfall — see below) |
| `clearStatusFilter` / `getCheckedStatuses` / `getStatusSelectedCount` | Status selection state |
| `listAvailableStatuses` | `Funding`, `Funded`, `Request Refund`, `Refunded` (4 distinct values — Request Refund and Refunded both map to `LeadStatus.OTHER` but are independent checkboxes) |
| `statusFilterHasSelectAll` / `selectAllStatuses` | Status is the only filter exposing "Select All" |
| `filterByMerchants(merchants[])` / `filterByLocations(locations[])` | Merchant + INDEPENDENT Location (BR-02) |
| `getMerchantSelectedCount` / `getLocationSelectedCount` | Selection counts |
| `listAvailableMerchants` | Merchant option labels |
| `listAvailableLocations` | Location option labels — delegates to `fqListOptions('merchantLocation')` against the stable `#merchantLocation` react-select. **Use this instead of `MerchantLocationFilterPO.listAvailableOptions('Location')`** — the shared PO's `<label>`-based XPath does NOT match the FQ custom DOM and times out (see scope boundary below). |
| `applyFiltersMulti` | Distinct name from the pre-existing `searchWithCurrentFilters` — applies the multi-select set |
| `getMerchantColumnValues` / `getStatusColumnValues` | Result table column reads |
| `getVisiblePageInfo` / `getTotalRowCount` / `goToNextPage` | Pagination |
| `isEmailCsvEnabled` | Delegates to `this.csv.isEmailCsvEnabled()`. False when the table is empty (CSS-disabled, NOT `isEnabled()` — see component note above) |
| `fillEmailCsvAddress(address)` | Delegates to `this.csv.fillEmailCsvAddress()` |
| `isEmailCsvSendEnabled` | Delegates to `this.csv.isEmailCsvSendEnabled()` — Send disabled until an address is typed |
| `sendEmailCsv` | Delegates to `this.csv.sendEmailCsv()` — clicks modal Send, waits for modal to close |

- **Email CSV flow pattern:** filter with ALL statuses (`['Funded','Refunded','Funding','Request Refund']`) to maximise the chance of a non-empty table → `isEmailCsvEnabled()`; if `false`, annotate and `return` (guard — empty table) → `openEmailCsvModal()` → `fillEmailCsvAddress(email)` → assert `isEmailCsvSendEnabled()` → `sendEmailCsv()`. The Email CSV button on Funding Queue is CSS-disabled on an empty table (`isEnabled()` would lie — see [[selector-hardening]]).

### Inter-page divergence (implementation reference)
| Behavior | MMH | ModReport | Funding |
|----------|-----|-----------|---------|
| Location disabled until Merchant selected | ✅ | ✅ | ❌ (independent) |
| Status filter present | — | — | ✅ ("Funding" pre-selected) |
| "Select All" available | Merchant ❌ | Merchant ❌ | Status ✅ (Merchant ❌) |
| Apply method name | `applyFilters` | `applyFilters` | `applyFiltersMulti` |

### Selector added
- `paginationPrevious: '#pagination-previous-page'` — added to `PaginationSelectors` (`common.selectors.ts` + typed in `selector.types.ts`). Pairs with the existing next-page selector for the `goToPreviousPage` methods above.

---

## SearchPage - Origination quick-search

- **Location:** `src/pages/search.page.ts`
- **Extends:** `BasePage`

**`SearchType` union:** `'Lead #' | 'Servicing Account #' | 'Phone' | 'Email' | 'SSN' | 'Invoice #' | 'UUID' | 'Name' | 'Last 4 CC' | 'Ref Account ID' | 'Contract #'`

| Method | Description |
|--------|-------------|
| `searchByType(type, input)` | Selects type from dropdown, force-sets React-controlled input, submits |
| `getQuickSearchResults` | Scrapes visible result rows |
| `expectNoDuplicateLeadPk(rows, context?)` | Assertion: fails if any leadPk appears more than once |
| `forceReactInputValue(selector, value)` | Bypass React synthetic event via evaluate |

**Critical pattern:** `#search-input` is React-controlled; `page.fill` silently no-ops. Always use `forceReactInputValue` or `searchByType`.

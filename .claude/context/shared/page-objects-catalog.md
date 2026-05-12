<!-- PT-BR: Catálogo de page objects detalhado — hierarquia + métodos adicionados por task. Consolidado de e2e-agent-responsibilities.md §1, §2, §3. -->

# Page Objects Catalog

> Catálogo detalhado de page objects. Para hierarquia completa (tree source of truth), ver [`context/project.md § Page Object Hierarchy`](../project.md). Este arquivo detalha métodos por page object, organizados por task.

## Project Test Structure

```
tests/
├── api/                          # API-only tests (no browser)
├── auth.setup.ts                 # Auth state setup
├── ci/                           # CI-specific tests
├── e2e/                          # E2E browser tests (by portal)
│   ├── origination/
│   ├── servicing/
│   ├── website/    (future)
│   └── ams/        (future)
└── taskTestingUown/              # GitLab task-driven tests
    └── {testName}/{testName}.spec.ts
```

## ServicingBasePage — payment arrangement

**Key methods:**

- `makeCcPaymentArrangement({ startDate, endDate, frequency, paymentType?, ccDetails? })` — cc manual flow
  - `ccDetails?: { firstName, lastName, cardNumber, cvc, expMonth, expYear }`
  - When `ccDetails` provided: clicks "Use one-time card information" radio, fills manual CC form
  - "Expires On" field is `type="month"`; method converts `expYear + expMonth` to `YYYY-MM` internally
  - Added in Task #483 (one-time card support)

## DueDateMovesHistoryPage — Task #448/#502

- **Location:** `src/pages/servicing/due-date-moves-history.page.ts`
- **Key methods:** `navigateToDueDateChanges()`, `isDueDateChangesMenuVisible()`, `waitForTableLoad()`, `getRowData(index)`

## BankAccountPage — Task #497

- **Location:** `src/pages/servicing/bank-account.page.ts`
- **Key methods:**
  - `openAddBankAccountModal()`, `addBankAccount(data)`, `openAllBankAccountsModal()`
  - `getBankAccountRowByLastFour(last4)`, `deleteBankAccountByLastFour(last4)`
  - `getDefaultPaymentFromCard()`, `getAccountNumberLastFour()`
- **Notes:** scoped selectors use `.modal.show` to avoid collisions with other `rdt_Table` instances on customer page. Exported in `src/pages/servicing/index.ts`.

## PaymentArrangementPage — Task #500

- **Location:** `src/pages/servicing/payment-arrangement.page.ts`
- **Key methods:**
  - `navigateToPaymentArrangement(accountPk)`, `navigateDirectly(baseUrl, accountPk)`
  - `waitForTableLoad()`, `getRowData(index)`, `findRowByPk(pk)`, `expandRow(index)`
  - `getCcPaymentsData()`, `getAchPaymentsData()`, `getSubTableData(tableIndex)`
  - `getNormalizedHeaders()`, `getExpandedSectionHeaders()`, `getPaginationTotal()`
- **Notes:** FilterTable headers são duplicados no DOM — `getSubTableData` dedupe automaticamente. Usa direct URL navigation (menu nav unreliable from `task-testing` project).

## ServicingCustomerPage — Task #505 (Opt Out AI) + Task #442 (Send Podium Link)

- **Location:** `src/pages/servicing/customer.page.ts`

**Opt Out AI methods (Task #505):**
- `navigateToPrimaryContact()` — navigates to Primary Contact section; handles CONFIRM modal + dismisses modals
- `enterPrimaryContactEditMode()` — clicks pencil icon, waits for checkboxes to become enabled
- `isOptOutAiVisible()` — true if "Opt Out AI" checkbox is visible in Mobile Phone section
- `isOptOutAiChecked()` — checked state of "Opt Out AI" checkbox
- `toggleOptOutAi(reason?)` — enters edit mode, clicks checkbox, handles reason modal (enable only), clicks SAVE, returns toast text
- `setOptOutAi(enable: boolean)` — idempotent: only clicks if current state differs from target

**Send Podium Link methods (Task #442):**
- `openSendInviteModal()` — clicks envelope icon (`#invitation`), forces Bootstrap modal show class (CSS animations disabled)
- `isPodiumLinkButtonVisible()` — true if "Send Podium Link" button is visible in InviteModal
- `sendPodiumLink()` — full flow: open modal → click "Send Podium Link" (force) → confirm → wait for toast; returns toast text
- `closeSendInviteModal()` — closes the Send Invite modal if open

**UI interaction notes:**
- Primary Contact section é READ-ONLY por default — clicar pencil icon (`#PrimaryContact-edit`) primeiro
- Checking "Opt Out AI" dispara modal "Reason for Opt Out AI Mobile" (textarea + Save)
- Unchecking NÃO dispara modal
- "Customer Information Confirmation" modal aparece intermitente no page load — clicar CONFIRM
- Activity log format: `"UPDATED : Phone[ optOutAi changed from false to true ]"`
- `InviteModal` de `@uownleasing/common-ui` usa Bootstrap "modal fade" — CSS animations disabled in tests prevent "show" class; force via JS
- Click "Send Podium Link" uses `force:true` (React unmounts InviteModal during click handler)
- ConfirmationModal: title "Please Confirm", button "Continue" — also force:true for same reason

## WebsiteBasePage — Update Phone (Task #146)

- **Key methods:**
  - `updatePhoneNumber(areaCode, phoneNumber)` — navigates to Update Contact Info and fills phone fields
  - `getErrorMessageText()` — returns error message if visible
  - `getSuccessMessageText()` — returns success message if visible
  - `isErrorVisible()` — boolean whether error is displayed
- **Selectors added:** `wsPhoneAreaCodeInput`, `wsPhoneNumberInput`, `wsSaveChangesButton`, `wsSuccessMessage`, `wsErrorMessage`, `wsUpdatePhoneSection`

## MerchantEditPage — Task #1262 (Make Inventory Category Mandatory)

- **Location:** `src/pages/origination/merchant-edit.page.ts`
- **Key methods:**
  - `navigateToAddMerchant(originationUrl)` — navigates to Add Merchant form
  - `fillMerchantForm(data)` — fills all main merchant fields (text + react-select) via private `pickReactSelectOption(fieldId, value)`
  - `selectInventoryCategory(value)` — picks a value from the Inventory Category react-select
  - `clearInventoryCategory()` — sends Backspace/Delete to combobox input (⚠️ LIMITATION: does NOT reliably null the Formik state — use only for negative-validation CTs)
  - `getInventoryCategoryValue()` — currently selected category text
  - `isInventoryCategoryLabelRequired()` — true if label carries required marker
  - `getInventoryCategoryErrorText()` — Formik error message text
  - `openCloneDropdown()` — clicks `<a class="dropdownContainer__ddButton">` (NOT a `<button>`)
  - `selectMerchantToClone(searchText)` — types into search input, clicks first `.dropdown-item:not(.dropdown-header)` child
  - `isClonedFromTooltipVisible()` — checks visibility of the cloned-from icon tooltip

- **Selectors block:** `MerchantAddEditSelectors` in `src/selectors/selector.types.ts`
  - `merchantListAddButton`, `merchantCloneDropdownToggle`, `merchantCloneDropdownInput`, `merchantCloneDropdownItem`, `merchantClonedFromIcon`, `inventoryCategoryControl`, `inventoryCategoryInput`, `inventoryCategoryClearIndicator`, `inventoryCategorySingleValue`, `inventoryCategoryLabel`, `inventoryCategoryErrorText`, `merchantRefCodeInput`, `merchantNameInput`, `merchantLegalNameInput`, `merchantLocationNameInput`

- **Platform quirks discovered (Task #1262):**
  - Origination react-selects mix `filter__*` (classNamePrefix="filter") E default `css-*` prefixes no mesmo form
  - Generic option selector que funciona para ambos: `.filter__option, [class*="css-"][class*="option-"], [class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])`
  - Clone DropdownButton é `<a class="dropdownContainer__ddButton">` (não `<button>`); menu items são `.dropdown-item` inside `.dropdown.show`. Primeiro item é header com search input — sempre excluir via `.dropdown-item:not(.dropdown-header)`.
  - `page.waitForResponse('/uown/createOrUpdateMerchant')` é flaky em qa2 (response fires after navigation invalidates wait). Prefere `waitForRequest` + `expect.poll(() => page.url().includes('addMerchant'))` como UX success proof.

## AmsUserDetailsPage — Task #79 (AMS Merchant Selection Flow)

- **Location:** `src/pages/ams/ams-user-details.page.ts`
- **Key methods (merchant edit flow):**
  - `clickEditMerchantsButton()` — dispatches click event on SVG button (`#EditUserMerchants-edit`)
  - `cancelMerchantsEdit()` — clicks CANCEL and waits for read-only mode
  - `saveMerchantsEdit()` — clicks SAVE, handles "Confirm Changes" modal, waits for read-only mode
  - `clickManageMerchants()` — clicks "Manage merchants" button in edit mode
  - `clickDeleteAll()` — clicks "Delete All" button in edit mode
  - `isManageMerchantsVisible()`, `isDeleteAllVisible()`, `isSearchboxDisabled()`, `isSearchboxVisible()`
  - `filterCurrentMerchants(term)` — types in read-only searchbox to filter displayed merchants
  - `clearCurrentMerchantsFilter()` — clears the searchbox

- **Selectors updated (Task #79):**
  - `amsEditUserMerchantsButton: '#EditUserMerchants-edit'` (was span, now button)
  - `amsUserMerchantsTag: '[class*="merchants-read_tag"]'` (new CSS module class)
  - `amsManageMerchantsButton: 'button:has-text("Manage merchants")'`
  - `amsDeleteAllMerchantsButton: 'button:has-text("Delete All")'`

## ErrorLogPage — Origination portal (Task #1240)

- **Location:** `src/pages/origination/error-log.page.ts`
- **Extends:** `OriginationBasePage`. Provides methods for Error Log page (Submit/Send Application error tracking).

| Method | Description |
|--------|-------------|
| `navigateToErrorLog()` | Navigates to `/errorLog` route |
| `isSendApplicationTabActive()` | Checks if Send Application tab is active |
| `clickSubmitApplicationTab()` / `clickSendApplicationTab()` | Tab switching |
| `getVisibleTabNames()` | Array of visible tab names |
| `getTableColumnHeaders()` | Array of table column header texts |
| `getTableRowCount()` | Number of rows in the error log table |
| `getFirstRowData()` | First row as `Record<header, cellValue>` |
| `setFilterFromDate(date)` / `setFilterToDate(date)` / `setFilterSearch(text)` | Set filter fields |
| `submitFilters()` | Clicks filter submit + waits for spinner |
| `waitForTableLoad(timeoutMs?)` | Waits for table visibility |
| `getRowsPerPageValue()` / `changeRowsPerPage(value)` | Rows-per-page dropdown |
| `getPaginationText()` | Returns pagination text or null |
| `getPageHeading()` | Returns page heading (e.g., `"ERROR LOG"`) |
| `isDownloadCsvButtonVisible()` | Download CSV button visible in active tab panel (calls `expandFilters()` first) |
| `isEmailCsvButtonVisible()` / `clickEmailCsv()` / `isEmailCsvModalVisible()` | Email CSV flow |

- **Selectors (prefix `el`):** `elTabSendApplication`, `elTabSubmitApplication`, `elFilterFromDate`, `elFilterToDate`, `elFilterSearch`, `elFilterSubmitButton`
- **CSV download filenames:** Submit Application → `submit-application-error-log-reports.csv`; Send Application → `error-log-reports.csv`
- **Tab active scoping:** `getActiveTabPanel()` returns `page.locator('.tab-pane.active')` — count=1 (only one panel active). All filter interactions scoped to active panel.

## ProgramGroupsPage — Origination portal (Task #1260)

- **Location:** `src/pages/origination/program-groups.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `navigateToProgramGroups()` | Navigates to `/programGroups` |
| `getGroupRowCount()`, `getGroupName(index)`, `findGroupWithPrograms()`, `getGroupProgramCount(index)` | Group list inspection |
| `openGroupModal(index)`, `getModalTitle()`, `getModalTableHeaders()`, `getModalProgramCount()`, `getModalProgramData(index)` | Group detail modal |
| `clickProgramInModal(index)` | Navigates to program details |
| `searchGroups(term)`, `isEditButtonVisible(index)`, `closeGroupModal()`, `isSearchVisible()` | Misc |

- **Selectors (prefix `pg`):** `pgGroupCountCell`, `pgGroupInfoIcon`, `pgGroupEditIcon`, `pgProgramLink`
- **Test file:** `docs/taskTestingUown/RU04.26.1.51.0_enableNavigationToProgramDetailsFromProgramGroupsPage_1260/...` — 10 CTs, env: qa2

## ProgramsPage — Origination portal (Tasks #1251, #1252, #1214)

- **Location:** `src/pages/origination/programs.page.ts`. Extends `OriginationBasePage`.
- **Pre-existing methods:** `navigateToPrograms`, `getCleanHeaders`, `showMaxRows`, `findProgramRow`, `clickProgramLink`, `fillProcessingFee`, `fillAmountAtSigned`, `saveProgram`, `getColumnWidth`

**New methods (Tasks #1251/#1252/#1214):**

| Method | Description |
|--------|-------------|
| `getMoneyFactorTableValue(programName)` | Money Factor column value (Task #1251) |
| `getMoneyFactorFormValue()` | `input[name='moneyFactor']` from edit form (Task #1251) |
| `navigateToProgramDetails(originationUrl, programPk)` | Direct to `/programs/:pk` (Task #1252) |
| `getProgramNameFromForm()` | `input[name='programName']` from details form (Task #1252) |
| `isCloneButtonVisible()` / `isCloneGroupButtonVisible()` / `isActivityLogPanelVisible()` | Details page UI checks (Task #1252) |
| `waitForProgramDetailsLoad()` | Waits for program name input visible (Task #1252) |
| `openCloneGroupModal()` / `fillCloneGroupName(name)` / `selectAllProgramsInModal()` / `submitCloneGroupModal()` / `waitForCloneGroupSuccess()` | Clone Group flow (Task #1214) |
| `getTableRowCount()` / `getRowsPerPageValue()` | Pagination (Task #1214) |

**Test files:** `docs/taskTestingUown/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251/...` (4 CTs), `...createProgramDetailsPage_1252/...` (7 CTs), `...enforcePaginationAfterProgramCloneAction_1214/...` (2 CTs) — env: qa2

## ProgramsListPage / ProgramDetailsPage / MerchantProgramsSectionPage — Origination portal (scheduleProgramActivationDeactivationDates, 2026-04-22)

Complements the legacy `ProgramsPage` above with the 2-pane layout and read-only merchant view for the **Schedule Program Activation and Deactivation Dates** feature.

### `ProgramsListPage` — left pane of `/programs`
- **Location:** `src/pages/origination/programs-list.page.ts`. Extends `OriginationBasePage`.
- **Purpose:** list of programs + filter pane + ADD NEW PROGRAM trigger.

| Method | Description |
|--------|-------------|
| `goto(originationUrl)` / `navigate(...)` | Navigate to `/programs` + wait for table load |
| `expandFilters()` | Filter pane ships collapsed by default; opens the Filters drawer. Idempotent |
| `searchProgram(name)` | Auto-expands filters, fills Search input, clicks Search |
| `filterByGroup(groupName)` | Select group from `Program Groups` dropdown |
| `clickAddNewProgram()` | Opens Program Details in create mode |
| `openProgramByName(programName)` | Clicks the row → opens Program Details |
| `getProgramRowByName(programName)` | Returns `Locator` |
| `waitForTableLoad()` | Spinner cleared + first row visible |

### `ProgramDetailsPage` — right pane of `/programs`
- **Location:** `src/pages/origination/program-details.page.ts`. Extends `OriginationBasePage`.
- **Purpose:** edit a single program + new `Activation Date` / `Deactivation Date` inputs + Notes (audit log).

| Method | Description |
|--------|-------------|
| `fillActivationDate(date)` / `fillDeactivationDate(date)` | Date format `MM/DD/YYYY` |
| `getActivationDate()` / `getDeactivationDate()` | Returns normalized `MM/DD/YYYY` (handles ISO or locale variants via `normalizeDateInputValue`) |
| `clearActivationDate()` / `clearDeactivationDate()` | |
| `fillProgramName(name)` / `fillTermMonths(n)` / `fillMoneyFactor(...)` ... | Other form fields |
| `clickSave()` / `clickCancel()` / `clickClone()` / `clickCloneGroup()` | Action buttons |
| `waitForSaveToastVisible()` | Returns the toast text after SAVE |
| `getInlineErrorMessage()` | For `activationDate > deactivationDate` UI validation |
| `getLatestNoteOfType(type)` | Parses Notes section — `PROGRAM_DATA_CHANGE` is the standard audit type |
| `getNotesEntries()` | Returns array of `{date, type, userId, notes}` |
| `waitForDetailsPanelLoad()` | Panel header + program-name field visible |

### `MerchantProgramsSectionPage` — merchant detail page (read-only)
- **Location:** `src/pages/origination/merchant-programs-section.page.ts`. Extends `OriginationBasePage`.
- **Purpose:** read-only display of programs assigned to a merchant with Status badge + tooltip. **No edit CTAs** — editing lives in `/programs`.

| Method | Description |
|--------|-------------|
| `gotoMerchantDetail(originationUrl, merchantNumber)` | Navigate to `/merchant/:number` |
| `getProgramRowsInSection()` | Returns `MerchantProgramSectionRow[]` — tolerant to fuzzy section selector |
| `getProgramStatusByName(programName)` | Returns `'Active'` \| `'Inactive'` \| `''` |
| `hoverStatusBadge(programName)` | Triggers tooltip render |
| `getStatusTooltipText(programName)` | Tooltip text with `Activation: <date>` / `Deactivation: <date>` or `—` |
| `hasEditAction(programName)` | Must return `false` — read-only contract |

**Test files:** `docs/taskTestingUown/scheduleProgramActivationDeactivationDates/*.spec.ts` — 59 tests total, 100% passing in qa2 (2026-04-22).

## LeadsPage — Origination portal (Task #1242, #1253)

- **Location:** `src/pages/origination/leads.page.ts`. Extends `OriginationBasePage`.
- **Columns:** Lead # | Account # | Lead Status | Internal Status | State | Term Month | Invoice Number | Customer Name | SSN | Phone Number | Email Address | Merchant | Location | Ref Merchant Code | Client Type | Created at | Created from

| Method | Description |
|--------|-------------|
| `navigateAndWaitForTable()` | Navigates to Leads page and waits for "Search Result" heading + spinner |
| `expandFilters()` | Expands filter panel if collapsed |
| `setFromDate(date)` / `setToDate(date)` / `filterByDateRange(from, to)` | Date range filters |
| `setInvoiceNumber(invoiceNumber)` | "Invoice Number" filter (Task #1253) |
| `setLeadPk(leadPk)` / `setCustomerName(name)` | Search fields |
| `filterByLeadStatus(displayStatus)` / `filterByMerchant(merchantName)` / `filterByLocation(locationName)` | React Select filters |
| `clearMerchantFilter()` / `getMerchantValue()` / `getLocationValue()` / `getLocationOptions()` | Filter inspection |
| `submitFilters()` | Clicks Search; waits for table rows or "no records" |
| `getCleanHeaders()` | Headers with sort indicators (`▲▼△▽↑↓`) stripped |
| `getVisibleRowCount()` / `findRowByLeadPk(leadPk)` / `getAllVisibleRows()` | Table data |

- **Selectors** (`LeadsTableSelectors`): `leadsInvoiceNumberInput` — `"input[placeholder='Search by Invoice Number']"` (Task #1253)
- **Notes:**
  - Leads table headers include sort indicators (`▲`/`▼`) — sempre usar `getCleanHeaders()` antes de column name matching
  - `filterByMerchant` e `filterByLocation` clicam `filter__control` element (não o placeholder) para evitar `filter__input-container` intercept

## ContractPage — missing employment info flow (Task #476)

Methods added to `ContractPage` (`src/pages/origination/contract.page.ts`) para `/complete` URL quando `planId` está empty:

| Method | Signature | Description |
|--------|-----------|-------------|
| `dismissSeonOverlay` | `dismissSeonOverlay(): Promise<void>` | Hides SEON `[data-testid="seon-idv-iframe"]` via JS (`display:none`, `pointerEvents:none`, `zIndex:-9999`). Used in sandbox. No-op if iframe absent. |
| `isMissingEmploymentScreen` | `isMissingEmploymentScreen(): Promise<boolean>` | True se `/complete` URL está showing "missing employment info" screen. Detected by `getByRole('searchbox', { name: /next paycheck/i })`. |
| `fillNextPaycheckDate` | `fillNextPaycheckDate(nextPayDate)` | Fills "When is your next paycheck?" input (step 1). Clicks NEXT. `MM/DD/YYYY` format. |
| `selectMissingPayFrequency` | `selectMissingPayFrequency(frequency)` | Selects pay frequency from React Select (step 2). Calls `dismissSeonOverlay()` first. Valid: `WEEKLY`, `BI_WEEKLY`, `SEMI_MONTHLY`, `MONTHLY`. Uses JS click for NEXT when SEON present (sandbox bypass). |
| `waitForPlanSelectionScreen` | `waitForPlanSelectionScreen(): Promise<void>` | Waits for "Please review and select one of the programs below." heading (30s). |
| `choosePlanByName` | `choosePlanByName(programName, index?)` | Clicks payment program button matching `programName` (e.g., `'Bi-Weekly'`). Falls back to index (default 0) if name not found. |
| `completeMissingEmploymentInfo` | `completeMissingEmploymentInfo(nextPayDate, frequency, programName?)` | Convenience: `fillNextPaycheckDate` → `selectMissingPayFrequency` → `choosePlanByName`. Default `programName = 'Bi-Weekly'`. |

- **Trigger condition:** quando `planId` está empty em `/complete` URL (e.g., `?planId=`), backend renderiza 2-step employment form antes de payment program options. Usar `stripPlanId(redirectUrl)` para forçar essa tela. Quando `planId` presente, backend auto-resolve program e skip direto para CC/bank form.
- **New selectors:** `completeNextPaycheckInput` (`'input[type="search"]'`), `completePayFrequencyCombobox` (`'[class*="react-select__control"]'`), `completePlanSelectionHeading` (`'h2, [class*="heading"]'`), `completeChooseProgramBtn` (`'button:has-text("Choose Payment Program")'`)

## ServicingDocumentsPage — Task #505 / hotfix R1.51.1

- **Location:** `src/pages/servicing/documents.page.ts`
- **Extends:** `ServicingBasePage`
- **Purpose:** Servicing portal Documents tab — list, verify, and download esign documents for an account.

| Method | Signature | Description |
|--------|-----------|-------------|
| `goto` | `goto(accountPk: string \| number)` | Navigates to customer information page for the account |
| `openDocumentsTab` | `openDocumentsTab()` | Clicks the Documents tab and waits for the table to load |
| `waitForLoaded` | `waitForLoaded()` | Waits for documents table to be visible and non-empty |
| `findRowByName` | `findRowByName(name: string)` | Returns `Locator` for the first row matching the document name |
| `getRowByDocumentNumber` | `getRowByDocumentNumber(docNumber: string)` | Returns `Locator` for row matching document number |
| `hasDocument` | `hasDocument(name: string): Promise<boolean>` | True if a document with the given name exists in the table |
| `downloadDocument` | `downloadDocument(name: string): Promise<Download>` | Clicks download link for the named document; returns Playwright `Download` object |
| `openDocumentInViewer` | `openDocumentInViewer(name: string)` | Opens document link in viewer (new tab or modal) |
| `getDocumentRowsCount` | `getDocumentRowsCount(): Promise<number>` | Returns total number of document rows visible |

- **Selectors block:** `ServicingDocumentsSelectors` added to `src/selectors/common.selectors.ts` under `// ── Servicing — Documents tab ──` and typed in `src/selectors/selector.types.ts`
- **Export:** added to barrel `src/pages/servicing/index.ts`

## Mandatory Patterns

- `test.step()` to group logical actions
- `ctx` object to share state between steps (same test only)
- `testData` fixture com `buildTestData()` for data setup
- Tags: `@smoke`, `@sanity`, `@regression` + `@critical` via `TestTag` enum

## Location Convention

Page objects: `src/pages/{portal}/` — `origination`, `servicing`, `website`, `ams`

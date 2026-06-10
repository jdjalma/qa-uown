# Page Objects Catalog - Detailed Method Reference

> Para hierarquia, convencoes e anti-patterns, ver [SKILL.md](../SKILL.md).

---

## OverviewPage - Origination dashboard (Task #1296)

- **Location:** `src/pages/origination/overview.page.ts`
- **Extends:** `OriginationBasePage`
- **Key properties/methods:**
  - `dashboardCards` - locator for all metric summary cards (`SELECTORS.dashboardCard`)
  - `totalApplications`, `approvedCount`, `pendingCount` - individual metric locators (`[data-metric="..."]`)
  - `getDashboardMetric(metricName)` - returns text of a named metric card
  - `verifyDashboardLoaded()` - waits for spinner, then races between filters button and table
  - `getRowDataByReferenceId(leadPk)` - paginates the leads table, returns row matching `Reference #`

- **Selector:** `SELECTORS.dashboardCard = "[class*='summaryBox__']"` (added in Task #1296). CSS module prefix anchor — hash suffix changes per webpack build. Do NOT hardcode the full hash class.

- **Auth / navigation notes (see pitfalls #74-#76):**
  - Navigate to `${originationBase}/overview`, NOT `originationBase` root (root = login page always)
  - `localStorage.clear()` required before reload if testing stale-data absence after session deletion

---

## ServicingBasePage - payment arrangement

**Key methods:**

- `makeCcPaymentArrangement({ startDate, endDate, frequency, arrangementType?, totalPaymentAmount?, paymentType?, ccDetails? })` - cc flow (synchronous, status=SUCCESS)
  - `ccDetails?: { firstName, lastName, cardNumber, cvc, expMonth, expYear }`
  - When `ccDetails` provided: clicks "Use one-time card information" radio, fills manual CC form
  - "Expires On" field is `type="month"`; method converts `expYear + expMonth` to `YYYY-MM` internally
  - Added in Task #483 (one-time card support); `arrangementType`/`totalPaymentAmount` added 2026-06-01

- `makeAchPaymentArrangement({ startDate, endDate, frequency, arrangementType?, totalPaymentAmount?, bankDetails? })` - ACH flow (added 2026-06-01)
  - ACH arrangement is inserted synchronously with arrangement `status=NOT_STARTED`, `payment_type=ACH`; linked `uown_sv_achpayment` row starts `PENDING`, daily ACH sweep promotes to `PICKED_TO_SEND`
  - `bankDetails?: { institute?, accountNumber, routingNumber }` — when omitted, uses bank on file (funded accounts default to "Use existing bank information" `select[name="bankAccountPk"]`)
  - Modal default payment type is already "ACH Payment" — no type switch needed
  - DB-confirmed dev3: arrangement pk77 acct138 → `status=NOT_STARTED`, `payment_type=ACH`

- Both arrangement methods share private `fillArrangementSchedule()` — installment table auto-populates from startDate + endDate + frequency; `totalPaymentAmount` auto-distributes across installments
  - **Arrangement Type is an explicit React Select** (`label[for="paymentArrangementType"]`, options `NORMAL` | `SETTLEMENT`) — NOT backend-derived. Selector `SELECTORS.arrangementTypeDropdown` (label-scoped). The old `makeCcPaymentArrangement` JSDoc claiming "UI does NOT expose an explicit arrangementType field; backend derives it from amount" was WRONG (corrected 2026-06-01 via DOM-first dev3). See [[application-lifecycle]] pitfall #82.
  - Frequency dropdown options: `Weekly` | `BiWeekly` | `Monthly` | `SemiMonthly` — use **exact regex** match ("Weekly" substring also matches "BiWeekly")

## DueDateMovesHistoryPage - Task #448/#502

- **Location:** `src/pages/servicing/due-date-moves-history.page.ts`
- **Key methods:** `navigateToDueDateChanges()`, `isDueDateChangesMenuVisible()`, `waitForTableLoad()`, `getRowData(index)`

## BankAccountPage - Task #497

- **Location:** `src/pages/servicing/bank-account.page.ts`
- **Key methods:**
  - `openAddBankAccountModal()`, `addBankAccount(data)`, `openAllBankAccountsModal()`
  - `getBankAccountRowByLastFour(last4)`, `deleteBankAccountByLastFour(last4)`
  - `getDefaultPaymentFromCard()`, `getAccountNumberLastFour()`
- **Notes:** scoped selectors use `.modal.show` to avoid collisions with other `rdt_Table` instances on customer page. Exported in `src/pages/servicing/index.ts`.

## PaymentArrangementPage - Task #500

- **Location:** `src/pages/servicing/payment-arrangement.page.ts`
- **Key methods:**
  - `navigateToPaymentArrangement(accountPk)`, `navigateDirectly(baseUrl, accountPk)`
  - `waitForTableLoad()`, `getRowData(index)`, `findRowByPk(pk)`, `expandRow(index)`
  - `getCcPaymentsData()`, `getAchPaymentsData()`, `getSubTableData(tableIndex)`
  - `getNormalizedHeaders()`, `getExpandedSectionHeaders()`, `getPaginationTotal()`
- **Notes:** FilterTable headers sao duplicados no DOM - `getSubTableData` dedupe automaticamente. Usa direct URL navigation (menu nav unreliable from `task-testing` project).
- **Cosmetic tech-debt (2026-06-02):** `EXPECTED_COLUMNS[0]` declara `'Arrangement PK'` (K maiusculo) mas a UI renderiza `'Arrangement Pk'` (k minusculo). A spec compara case-insensitive, entao NAO ha falha de teste; alinhar a constante para `'Arrangement Pk'` quando tocar o arquivo. Descoberto no payment-arrangement-servicing pipeline (7/7 PASS, dev3).

## ServicingCustomerPage - Task #505 (Opt Out AI) + Task #442 (Send Podium Link)

- **Location:** `src/pages/servicing/customer.page.ts`

**Opt Out AI methods (Task #505):**
- `navigateToPrimaryContact()` - navigates to Primary Contact section; handles CONFIRM modal + dismisses modals
- `enterPrimaryContactEditMode()` - clicks pencil icon, waits for checkboxes to become enabled
- `isOptOutAiVisible()` - true if "Opt Out AI" checkbox is visible in Mobile Phone section
- `isOptOutAiChecked()` - checked state of "Opt Out AI" checkbox
- `toggleOptOutAi(reason?)` - enters edit mode, clicks checkbox, handles reason modal (enable only), clicks SAVE, returns toast text
- `setOptOutAi(enable: boolean)` - idempotent: only clicks if current state differs from target

**Send Podium Link methods (Task #442):**
- `openSendInviteModal()` - clicks envelope icon (`#invitation`), forces Bootstrap modal show class (CSS animations disabled)
- `isPodiumLinkButtonVisible()` - true if "Send Podium Link" button is visible in InviteModal
- `sendPodiumLink()` - full flow: open modal - click "Send Podium Link" (force) - confirm - wait for toast; returns toast text
- `closeSendInviteModal()` - closes the Send Invite modal if open

**UI interaction notes:**
- Primary Contact section e READ-ONLY por default - clicar pencil icon (`#PrimaryContact-edit`) primeiro
- Checking "Opt Out AI" dispara modal "Reason for Opt Out AI Mobile" (textarea + Save)
- Unchecking NAO dispara modal
- "Customer Information Confirmation" modal aparece intermitente no page load - clicar CONFIRM
- Activity log format: `"UPDATED : Phone[ optOutAi changed from false to true ]"`
- `InviteModal` de `@uownleasing/common-ui` usa Bootstrap "modal fade" - CSS animations disabled in tests prevent "show" class; force via JS
- Click "Send Podium Link" uses `force:true` (React unmounts InviteModal during click handler)
- ConfirmationModal: title "Please Confirm", button "Continue" - also force:true for same reason

## WebsiteBasePage - Update Phone (Task #146)

- **Key methods:**
  - `updatePhoneNumber(areaCode, phoneNumber)` - navigates to Update Contact Info and fills phone fields
  - `getErrorMessageText()` - returns error message if visible
  - `getSuccessMessageText()` - returns success message if visible
  - `isErrorVisible()` - boolean whether error is displayed
- **Selectors added:** `wsPhoneAreaCodeInput`, `wsPhoneNumberInput`, `wsSaveChangesButton`, `wsSuccessMessage`, `wsErrorMessage`, `wsUpdatePhoneSection`

## MerchantEditPage - Task #1262 (Make Inventory Category Mandatory)

- **Location:** `src/pages/origination/merchant-edit.page.ts`
- **Key methods:**
  - `navigateToAddMerchant(originationUrl)` - navigates to Add Merchant form
  - `fillMerchantForm(data)` - fills all main merchant fields (text + react-select) via private `pickReactSelectOption(fieldId, value)`
  - `selectInventoryCategory(value)` - picks a value from the Inventory Category react-select
  - `clearInventoryCategory()` - sends Backspace/Delete to combobox input (LIMITATION: does NOT reliably null the Formik state - use only for negative-validation CTs)
  - `getInventoryCategoryValue()` - currently selected category text
  - `isInventoryCategoryLabelRequired()` - true if label carries required marker
  - `getInventoryCategoryErrorText()` - Formik error message text
  - `openCloneDropdown()` - clicks `<a class="dropdownContainer__ddButton">` (NOT a `<button>`)
  - `selectMerchantToClone(searchText)` - types into search input, clicks first `.dropdown-item:not(.dropdown-header)` child
  - `isClonedFromTooltipVisible()` - checks visibility of the cloned-from icon tooltip

- **Selectors block:** `MerchantAddEditSelectors` in `src/selectors/selector.types.ts`
  - `merchantListAddButton`, `merchantCloneDropdownToggle`, `merchantCloneDropdownInput`, `merchantCloneDropdownItem`, `merchantClonedFromIcon`, `inventoryCategoryControl`, `inventoryCategoryInput`, `inventoryCategoryClearIndicator`, `inventoryCategorySingleValue`, `inventoryCategoryLabel`, `inventoryCategoryErrorText`, `merchantRefCodeInput`, `merchantNameInput`, `merchantLegalNameInput`, `merchantLocationNameInput`

- **Platform quirks discovered (Task #1262):**
  - Origination react-selects mix `filter__*` (classNamePrefix="filter") E default `css-*` prefixes no mesmo form
  - Generic option selector que funciona para ambos: `.filter__option, [class*="css-"][class*="option-"], [class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])`
  - Clone DropdownButton e `<a class="dropdownContainer__ddButton">` (nao `<button>`); menu items sao `.dropdown-item` inside `.dropdown.show`. Primeiro item e header com search input - sempre excluir via `.dropdown-item:not(.dropdown-header)`.
  - `page.waitForResponse('/uown/createOrUpdateMerchant')` e flaky em qa2 (response fires after navigation invalidates wait). Prefere `waitForRequest` + `expect.poll(() => page.url().includes('addMerchant'))` como UX success proof.

## AmsUserDetailsPage - Task #79 (AMS Merchant Selection Flow)

- **Location:** `src/pages/ams/ams-user-details.page.ts`
- **Key methods (merchant edit flow):**
  - `clickEditMerchantsButton()` - dispatches click event on SVG button (`#EditUserMerchants-edit`)
  - `cancelMerchantsEdit()` - clicks CANCEL and waits for read-only mode
  - `saveMerchantsEdit()` - clicks SAVE, handles "Confirm Changes" modal, waits for read-only mode
  - `clickManageMerchants()` - clicks "Manage merchants" button in edit mode
  - `clickDeleteAll()` - clicks "Delete All" button in edit mode
  - `isManageMerchantsVisible()`, `isDeleteAllVisible()`, `isSearchboxDisabled()`, `isSearchboxVisible()`
  - `filterCurrentMerchants(term)` - types in read-only searchbox to filter displayed merchants
  - `clearCurrentMerchantsFilter()` - clears the searchbox

- **Selectors updated (Task #79):**
  - `amsEditUserMerchantsButton: '#EditUserMerchants-edit'` (was span, now button)
  - `amsUserMerchantsTag: '[class*="merchants-read_tag"]'` (new CSS module class)
  - `amsManageMerchantsButton: 'button:has-text("Manage merchants")'`
  - `amsDeleteAllMerchantsButton: 'button:has-text("Delete All")'`

## ErrorLogPage - Origination portal (Task #1240)

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
- **CSV download filenames:** Submit Application: `submit-application-error-log-reports.csv`; Send Application: `error-log-reports.csv`
- **Tab active scoping:** `getActiveTabPanel()` returns `page.locator('.tab-pane.active')` - count=1 (only one panel active). All filter interactions scoped to active panel.

## ProgramGroupsPage - Origination portal (Task #1260)

- **Location:** `src/pages/origination/program-groups.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `navigateToProgramGroups()` | Navigates to `/programGroups` |
| `getGroupRowCount()`, `getGroupName(index)`, `findGroupWithPrograms()`, `getGroupProgramCount(index)` | Group list inspection |
| `openGroupModal(index)`, `getModalTitle()`, `getModalTableHeaders()`, `getModalProgramCount()`, `getModalProgramData(index)` | Group detail modal |
| `clickProgramInModal(index)` | Navigates to program details |
| `searchGroups(term)`, `isEditButtonVisible(index)`, `closeGroupModal()`, `isSearchVisible()` | Misc |

- **Selectors (prefix `pg`):** `pgGroupCountCell`, `pgGroupInfoIcon`, `pgGroupEditIcon`, `pgProgramLink`

## ProgramsPage - Origination portal (Tasks #1251, #1252, #1214)

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

## ProgramsListPage / ProgramDetailsPage / MerchantProgramsSectionPage - Origination portal (scheduleProgramActivationDeactivationDates)

### `ProgramsListPage` - left pane of `/programs`
- **Location:** `src/pages/origination/programs-list.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `goto(originationUrl)` / `navigate(...)` | Navigate to `/programs` + wait for table load |
| `expandFilters()` | Filter pane ships collapsed by default; opens the Filters drawer. Idempotent |
| `searchProgram(name)` | Auto-expands filters, fills Search input, clicks Search |
| `filterByGroup(groupName)` | Select group from `Program Groups` dropdown |
| `clickAddNewProgram()` | Opens Program Details in create mode |
| `openProgramByName(programName)` | Clicks the row - opens Program Details |
| `getProgramRowByName(programName)` | Returns `Locator` |
| `waitForTableLoad()` | Spinner cleared + first row visible |

### `ProgramDetailsPage` - right pane of `/programs`
- **Location:** `src/pages/origination/program-details.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `fillActivationDate(date)` / `fillDeactivationDate(date)` | Date format `MM/DD/YYYY` |
| `getActivationDate()` / `getDeactivationDate()` | Returns normalized `MM/DD/YYYY` |
| `clearActivationDate()` / `clearDeactivationDate()` | |
| `fillProgramName(name)` / `fillTermMonths(n)` / `fillMoneyFactor(...)` ... | Other form fields |
| `clickSave()` / `clickCancel()` / `clickClone()` / `clickCloneGroup()` | Action buttons |
| `waitForSaveToastVisible()` | Returns the toast text after SAVE |
| `getInlineErrorMessage()` | For `activationDate > deactivationDate` UI validation |
| `getLatestNoteOfType(type)` | Parses Notes section - `PROGRAM_DATA_CHANGE` is the standard audit type |
| `getNotesEntries()` | Returns array of `{date, type, userId, notes}` |
| `waitForDetailsPanelLoad()` | Panel header + program-name field visible |

### `MerchantProgramsSectionPage` - merchant detail page (read-only)
- **Location:** `src/pages/origination/merchant-programs-section.page.ts`. Extends `OriginationBasePage`.

| Method | Description |
|--------|-------------|
| `gotoMerchantDetail(originationUrl, merchantNumber)` | Navigate to `/merchant/:number` |
| `getProgramRowsInSection()` | Returns `MerchantProgramSectionRow[]` |
| `getProgramStatusByName(programName)` | Returns `'Active'` | `'Inactive'` | `''` |
| `hoverStatusBadge(programName)` | Triggers tooltip render |
| `getStatusTooltipText(programName)` | Tooltip text with activation/deactivation dates |
| `hasEditAction(programName)` | Must return `false` - read-only contract |

## LeadsPage - Origination portal (Task #1242, #1253)

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
| `getCleanHeaders()` | Headers with sort indicators stripped |
| `getVisibleRowCount()` / `findRowByLeadPk(leadPk)` / `getAllVisibleRows()` | Table data |

- **Selectors** (`LeadsTableSelectors`): `leadsInvoiceNumberInput` - `"input[placeholder='Search by Invoice Number']"`
- **Notes:**
  - Leads table headers include sort indicators - sempre usar `getCleanHeaders()` antes de column name matching
  - `filterByMerchant` e `filterByLocation` clicam `filter__control` element para evitar `filter__input-container` intercept

## MissingDataFormPage - Origination portal (Task #1285 side-fix)

- **Location:** `src/pages/origination/missing-data-form.page.ts`

| Method | Description |
|--------|-------------|
| `getProcessingFeeAmount()` | Returns the processing fee amount text. Uses `getByText(/\$\s?[\d,]+\.?\d*\s+Authorization/i)` |
| `isProcessingFeeDisplayed()` | Returns `true` if the processing fee element is visible |

**IMPORTANT:** Prior CSS-module hash selector `.missing-data-panel_missingDataPanel__feeAmount__cn7Wg` was replaced with text-based locator.

**Known gap (not fixed in #1285):** `fillBankAccount` uses `getByText(bank.accountType, { exact: true })` which causes strict-mode violation. See application-lifecycle pitfall #25.

## ContractPage - missing employment info flow (Task #476)

Methods added to `ContractPage` (`src/pages/origination/contract.page.ts`) para `/complete` URL quando `planId` esta empty:

| Method | Signature | Description |
|--------|-----------|-------------|
| `dismissSeonOverlay` | `dismissSeonOverlay(): Promise<void>` | Hides SEON `[data-testid="seon-idv-iframe"]` via JS. No-op if iframe absent. |
| `isMissingEmploymentScreen` | `isMissingEmploymentScreen(): Promise<boolean>` | True se `/complete` URL showing "missing employment info" screen. |
| `fillNextPaycheckDate` | `fillNextPaycheckDate(nextPayDate)` | Fills "When is your next paycheck?" input (step 1). `MM/DD/YYYY` format. |
| `selectMissingPayFrequency` | `selectMissingPayFrequency(frequency)` | Selects pay frequency from React Select (step 2). Valid: `WEEKLY`, `BI_WEEKLY`, `SEMI_MONTHLY`, `MONTHLY`. |
| `waitForPlanSelectionScreen` | `waitForPlanSelectionScreen(): Promise<void>` | Waits for "Please review and select one of the programs below." heading (30s). |
| `choosePlanByName` | `choosePlanByName(programName, index?)` | Clicks payment program button matching `programName`. Falls back to index. |
| `completeMissingEmploymentInfo` | `completeMissingEmploymentInfo(nextPayDate, frequency, programName?)` | Convenience: full 3-step flow. Default `programName = 'Bi-Weekly'`. |

- **Trigger condition:** quando `planId` esta empty em `/complete` URL, backend renderiza 2-step employment form antes de payment program options.
- **New selectors:** `completeNextPaycheckInput`, `completePayFrequencyCombobox`, `completePlanSelectionHeading`, `completeChooseProgramBtn`

## ServicingDocumentsPage - Task #505

- **Location:** `src/pages/servicing/documents.page.ts`
- **Extends:** `ServicingBasePage`

| Method | Signature | Description |
|--------|-----------|-------------|
| `goto` | `goto(accountPk: string \| number)` | Navigates to customer information page for the account |
| `openDocumentsTab` | `openDocumentsTab()` | Clicks the Documents tab and waits for the table to load |
| `waitForLoaded` | `waitForLoaded()` | Waits for documents table to be visible and non-empty |
| `findRowByName` | `findRowByName(name: string)` | Returns `Locator` for the first row matching the document name |
| `getRowByDocumentNumber` | `getRowByDocumentNumber(docNumber: string)` | Returns `Locator` for row matching document number |
| `hasDocument` | `hasDocument(name: string): Promise<boolean>` | True if a document with the given name exists |
| `downloadDocument` | `downloadDocument(name: string): Promise<Download>` | Clicks download link; returns Playwright `Download` object |
| `openDocumentInViewer` | `openDocumentInViewer(name: string)` | Opens document link in viewer |
| `getDocumentRowsCount` | `getDocumentRowsCount(): Promise<number>` | Returns total number of document rows visible |

## OriginationCustomerPage - `ensureAuthenticated` v8 auth-retry pattern (svc#530)

**Location:** `src/pages/origination/customer.page.ts:225-385`

**Pattern:** `ensureAuthenticated(intendedPath?: string)` - rewrite v8 com 4 componentes: (A) pre-emptive JWT exp check; (B) caller-supplied intendedPath; (C) page.reload(); (D) guarda de hidratacao real via poll ate JWT `exp > now + 60s`.

**Anti-patterns proibidos:** guarda por `*Store$` key existir; `goto(base)` durante SPA nav pendente; deteccao lazy por `isLoginPage()`.

**Cross-links:** pitfall #69 em [[application-lifecycle]] (root cause completo).

## OriginationCustomerPage - `settleLeaseViaDocuments` brand-filter gap (svc#530)

**Pitfall (F-005):** filtro usa regex `/^UOWN_/` que nao casa com documentos KS3015 (Kornerstone). **Status:** `[OBSERVACAO]`.

## OriginationCustomerPage - Task #521 (Lease panel reader)

- **New method:** `getLeasePanelContracts(): Promise<LeasePanelContract[]>`
- **New interface:** `LeasePanelContract` - `contractNumber`, `contractType`, `status`, `termMonths`, `timestamp`
- **New selectors block:** `LeasePanelSelectors`

## CreditCardHistoryPage - Servicing portal (svc#485)

- **Location:** `src/pages/servicing/credit-card-history.page.ts`
- **Extends:** `ServicingBasePage`

| Method | Description |
|--------|-------------|
| `navigateToCcHistory()` | Navigate via top menu (History - CC Transactions) |
| `navigateToCcHistoryByUrl(baseUrl, accountPk)` | Sequential navigation: customer-information first - then CC Transactions tab (required for MobX store hydration, pitfall #40). |
| `getRowCount()` | Number of rows |
| `getRowByTxPk(txPk)` | Find table row by cct PK |
| `getStickyRecoveryStatus(cctPk)` | Returns Sticky Recovery Status cell text |
| `getStickyTransactionId(cctPk)` | Returns Sticky Txn ID cell text |
| `waitForStickyRecoveriesResponse(timeoutMs?)` | Arms a `waitForResponse` listener on `/sticky-recoveries`. Must be called BEFORE navigation |
| `waitForStickyCellPopulated(cctPk, timeoutMs?)` | Polls until Sticky Recovery Status cell is non-empty |
| `reloadAfterStickyDataReady(baseUrl, accountPk, cctPk, timeoutMs?)` | Full reload pattern encapsulating MobX race workaround |

## Pitfall - `filter({ hasText: pk }).first()` em tabelas rdt

**Sintoma:** helpers `getRowBy*Pk` retornam "-" ou texto vazio.

**Causa raiz:** `getRows().filter({ hasText: String(pk) }).first()` faz match **substring** no texto acumulado de TODA a row. Multiplas rows podem conter o PK como substring.

**Regra geral para tabelas rdt-style:**

```
NAO: getRows().filter({ hasText: String(pk) }).first()    // substring + first - colisao silenciosa
NAO: row.locator('div[role="cell"]').nth(N)               // index hardcoded
SIM: page.locator(SELECTORS.tableRowById(pk))              // id da row (rdt usa keyField)
SIM: rows.filter({ has: page.getByRole('cell', { name, exact: true }) })  // cell exact
SIM: resolucao dinamica de columnIndex via header role=columnheader
```

## SettlementBreakdownModal - Servicing portal (svc#512)

- **Location:** `src/pages/servicing/settlement-breakdown.modal.ts`
- **Extends:** `ServicingBasePage`

| Method | Signature | Description |
|--------|-----------|-------------|
| `open()` | `open(): Promise<void>` | Clicks Settlement Amount label to open modal |
| `close()` | `close(): Promise<void>` | Clicks X button to dismiss |
| `getBreakdownRows()` | `getBreakdownRows(): Promise<Array<{label, value}>>` | Returns all label/value pairs |
| `getValueByLabel(label)` | `getValueByLabel(label: string): Promise<string>` | Returns value for given label |
| `isVisible()` | `isVisible(): Promise<boolean>` | True if modal is currently open |

- **Known bug (BUG-3):** Modal opens EMPTY when Settlement Amount is $0.00.
- **Custom DOM structure (pitfall #49):** NOT Bootstrap `.modal-body`. Content in `<div class="overflow-auto p-3">`. Close button is `svg.fa-xmark-large`.

## AmsMerchantsPage - AMS portal (svc#504)

- **Location:** `src/pages/ams/ams-merchants.page.ts`
- **Extends:** `AmsBasePage`

| Method | Description |
|--------|-------------|
| `goto(amsBaseUrl)` | Direct navigation to `/merchants` |
| `clickSidebarMerchants()` | Click Merchants link in AMS sidebar |
| `openFilters()` | Opens Filters panel; idempotent |
| `submitSearch(term)` | Opens Filters, fills search input, clicks Search |
| `pickActiveAndSearch(state)` | Selects "Active" or "Inactive" from tri-state combobox |
| `clearActiveFilter()` | Unchecks whichever option is currently checked |
| `getVisibleRowTexts()` | Returns innerText of all rendered rdt rows |
| `rowContaining(text)` | Returns `Locator` for first row with text (substring match) |

- **PITFALL - Custom ARIA-checkbox widget:** Active combobox is NOT react-select and NOT a native `<select>`. Approved strategies: (1) Keyboard contract; (2) React-select option ID `[id^="react-select-"][id$="-option-0"]`. See [[application-lifecycle]] pitfall #47.

## AmsUsersPage - AMS portal (svc#504)

- **Location:** `src/pages/ams/ams-users.page.ts`
- **Extends:** `AmsBasePage`

| Method | Description |
|--------|-------------|
| `goto(amsBaseUrl)` | Direct navigation to `/users` |
| `clickAddUser()` | Clicks "Add User" button - triggers lazy `getAllAvailableMerchants` call |

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
| `submitReverse()` | Clicks the modal Save button |
| `cancelReverse()` | Clicks the modal Cancel button |

- **Selectors (`common.selectors.ts:219-233`):** `paymentHistoryRows`, `paymentHistoryReverseIcon`, `reverseReasonControl`, `reverseReasonOption`, `reversePaymentAmountInput`, `reverseRefundFeeCheckbox`, `reverseCommentTextarea`, `reverseModalSaveButton`, `reverseModalCancelButton`
- **PITFALL - `reverseReason` is React Select (`<div>`), NOT native `<select>`:** `selectOption()` no-ops/fails. Select via control click + option click. See application-lifecycle pitfall #78.
- **Activity log:** refund logs to `uown_sv_activity_log` (Servicing action), NOT `uown_los_lead_notes` (LOS).
- **`#paymentAmount` is conditional:** visible only after "Partially Refund" is chosen.

## SearchPage - Origination quick-search (svc#454)

- **Location:** `src/pages/search.page.ts`
- **Extends:** `BasePage`

**`SearchType` union:** `'Lead #' | 'Servicing Account #' | 'Phone' | 'Email' | 'SSN' | 'Invoice #' | 'UUID' | 'Name' | 'Last 4 CC' | 'Ref Account ID' | 'Contract #'`

| Method | Description |
|--------|-------------|
| `searchByType(type, input)` | Selects type from dropdown, force-sets React-controlled input, submits |
| `getQuickSearchResults()` | Scrapes visible result rows |
| `expectNoDuplicateLeadPk(rows, context?)` | Assertion: fails if any leadPk appears more than once |
| `forceReactInputValue(selector, value)` | Bypass React synthetic event via evaluate |

**Critical pattern:** `#search-input` is React-controlled; `page.fill()` silently no-ops. Always use `forceReactInputValue` or `searchByType`.

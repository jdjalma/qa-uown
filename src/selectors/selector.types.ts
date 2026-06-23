/**
 * Type definitions for centralized UI selectors.
 * Organized by UI domain section.
 */

// ── Section interfaces ──────────────────────────────────────────────

export interface SpinnerSelectors {
  spinnerBorder: string;
  spinnerGrow: string;
  fullPageLoader: string;
  loadingOverlay: string;
}

export interface ToastSelectors {
  toastBody: string;
  toastSuccess: string;
  toastError: string;
  toastClose: string;
}

export interface PaginationSelectors {
  paginationNext: string;
  paginationPrevious: string;
  rowsPerPageDropdown: string;
}

export interface SidebarSelectors {
  sidebarItem: string;
}

export interface FilterSelectors {
  filterOption: string;
  filterOptionWithRole: string;
  filterControl: string;
  filterControlResilient: string;
  filterComboboxInput: string;
  filtersButton: string;
  filterMenuPortal: string;
  filterPlaceholder: string;
  filterSingleValue: string;
  filterClearIndicator: string;
  filterMultiValueLabel: string;
  // Modification Report filter panel (Origination, #1315 — CT-03/CT-04).
  // DOM-first (LIVE qa2 2026-06-18, 1440×900): Formik inputs with stable ids.
  modReportAgentNameInput: string;
  modReportStartDateInput: string;
  modReportEndDateInput: string;
  // Task #1292 — multi-select rollout (Origination)
  // Bottom filter container button (leads-style block with Filters + Search button).
  // The class is a CSS-module hash; anchor on the stable prefix `index-module_filterButton__`.
  // Distinct from the Overview KPIs top filter (`overview_filterButton__`), which is single-select and out of scope.
  multiSelectFilterButton: string;
  multiSelectValueContainer: string;
}

export interface ModalSelectors {
  modalContent: string;
  modalHeader: string;
  modalBody: string;
  modalClose: string;
  modalShow: string;
  modalBackdrop: string;
}

export interface ButtonSelectors {
  submitButton: string;
  buttonPrimary: string;
  buttonRounded: string;
  saveButton: string;
  cancelButton: string;
}

export interface TableSelectors {
  table: string;
  tableHeader: string;
  tableRow: string;
  tableCell: string;
  tableRowById: (index: number) => string;
}

export interface LoginSelectors {
  loginEmail: string;
  loginPassword: string;
  loginButton: string;
}

export interface SearchSelectors {
  searchInput: string;
  searchInputLegacy: string;
  searchTypeDropdown: string;
  searchButton: string;
  /** Overview table-panel free-text search ("Search table") — empty-set lever (#1321). */
  overviewTableSearch: string;
  searchResultAccountLink: string;
  // ── Quick search bar (Origination + Servicing) — svc#454 ──
  /** Desktop-only wrapper for the quick search form (Bootstrap `d-lg-block`, ≥992px). */
  quickSearchForm: string;
  /** Search-type toggle anchor (CSS-module hash unstable — match via prefix). */
  quickSearchTypeToggle: string;
  /** Dropdown menu container that appears after clicking the toggle. */
  quickSearchTypeMenu: string;
  /** Menu items (the 9–10 searchType options) inside the dropdown. */
  /** Autocomplete result list (rendered below the input after the BFF request resolves). */
  /** Each result inside the autocomplete list — anchor on the customer link prefix. */
  quickSearchAutocompleteResult: string;
}

export interface CustomerSummarySelectors {
  customerSummary: string;
  customerStatusValue: string;
  accountNumberLink: string;
  ratingLetterValue: string;
}

export interface PaymentSelectors {
  makePayment: string;
  paymentTypeDropdown: string;
  totalPaymentAmountInput: string;
  allocationStrategyDropdown: string;
}

export interface CreditCardSelectors {
  ccNumber: string;
  ccFirstName: string;
  ccLastName: string;
  ccValue: string;
  ccCvc: string;
  ccExpMonthInput: string;
  ccExpYearInput: string;
  // One-time card form (payment arrangement modal)
  otCardFirstName: string;
  otCardLastName: string;
  otCardExpiresOn: string;
  otCardSecurityCode: string;
}

export interface BankSelectors {
  bankRoutingNumber: string;
  bankAccountNumber: string;
  achReEnterAccountNumber: string;
  bankAccountCustomerFirst: string;
  bankAccountCustomerLast: string;
  bankAccountTypeInput: string;
  existingBankAccountSelect: string;
}

export interface FormSelectors {
  isEverythingAgreed: string;
  isInfoConfirmed: string;
  isConfirmedForSettlement: string;
  inlineError: string;
  commentInput: string;
  amountInput: string;
  approvalAmountInput: string;
  checkboxInput: string;
}

export interface PandaDocsSelectors {
  pandaDocsIframe: string;
  pandaDocsStartSigning: string;
  pandaDocsClosePopup: string;
  pandaDocsInitials: string;
  pandaDocsAcceptAndSign: string;
  pandaDocsNext: string;
  pandaDocsSignature: string;
  pandaDocsFinish: string;
  pandaDocsAllSet: string;
}

export interface SignwellSelectors {
  signwellIframe: string;
  signwellStart: string;
  signwellCallout: string;
  signwellSignatureType: string;
  signwellInitialsType: string;
  signwellSignatureActions: string;
  signwellNextField: string;
  signwellAvatarWrapper: string;
  signwellFinish: string;
  signwellContinueModal: string;
  signwellSignAllLink: string;
  signwellDocCompleteHeading: string;
  signwellModalCloseLink: string;
}

/**
 * Provider-agnostic signing surface selectors. Used by `SigningPage`
 * (cross-portal) to detect which e-sign provider rendered the iframe and to
 * expose a uniform start/status surface across GowSign, SignWell, PandaDocs.
 */
export interface SigningProviderSelectors {
  /** Any iframe present on the page — used as the union for provider sniffing. */
  signingAnyIframe: string;
  /** GowSign iframe in the UOwn `AlternativeContractModal` wrapper. */
  signingGowSignIframe: string;
  /** Generic GowSign iframe match (any URL on `*.gowsign.com`). */
  signingGowSignIframeByUrl: string;
  /** Generic SignWell iframe match (URL or known embed ID). */
  signingSignWellIframeByUrl: string;
  /** Generic PandaDocs iframe match (legacy). */
  signingPandaDocsIframeByUrl: string;
}

export interface FundingSelectors {
  fundingQueue: string;
  fundingDropdownSvg: string;
  statusDropdownSvg: string;
  funded: string;
}

export interface PaymentTransactionSelectors {
  paymentTable: string;
  paymentTableRows: string;
  svgReverseIcon: string;
  pencilIcon: string;
}

export interface AddCardSelectors {
  addCardButton: string;
  saveCardButton: string;
}

export interface TopBarSelectors {
  topBar: string;
}

export interface MenuSelectors {
}

export interface PayTomorrowPortalSelectors {
  ptPhone: string;
  ptFirstName: string;
  ptLastName: string;
  ptEmail: string;
  ptOrderId: string;
  ptItemDescription: string;
  ptQuantity: string;
  ptPrice: string;
  ptTaxRate: string;
  ptShipping: string;
  ptDiscount: string;
  ptAddButton: string;
  ptSendToCustomerButton: string;
  ptRefundCheckbox: string;
  ptSsnInput: string;
  ptDobMonth: string;
  ptDobDay: string;
  ptDobYear: string;
  ptPayCycle: string;
  ptPayMonth: string;
  ptPayDay: string;
  ptMonthlyIncome: string;
  ptEmployerName: string;
  ptAgreeTerms: string;
  ptSubmitButton: string;
  ptSelectOffer: string;
  ptContractIframe: string;
  ptStreet: string;
  ptCity: string;
  ptZip: string;
  ptStateDropdown: string;
  ptButtonPrimary: string;
  ptCustomerNotPresentBtn: string;
  ptInitiatePreApprovalBtn: string;
  ptKeycloakUsername: string;
  ptKeycloakPassword: string;
  ptKeycloakLoginButton: string;
  ptChatWidget: string;
  ptConfirmYesButton: string;
  ptSendCartButton: string;
  ptSpinnerBackdrop: string;
  ptEyeIcon: string;
  ptRefundApplicationModal: string;
  ptProceedToSignature: string;
  ptInProgressRow: string;
  ptDetailsLink: string;
  ptPrimeDropdownItem: string;
  ptCcExpDateCombined: string;
}

export interface PayPairPortalSelectors {
  ppMerchantDropdown: string;
  ppInitPaypairButton: string;
  ppPersonalInfoTextarea: string;
  ppCartTextarea: string;
  ppProviderName: string;
  ppPreQualification: string;
  ppProductSelectionType: string;
  ppGetLeaseButton: string;
  ppLlappIframe: string;
  ppPhoneInput: string;
  ppPasscodeInput: string;
  ppContinueButton: string;
  ppDobMonthSelect: string;
  ppDobDaySelect: string;
  ppDobYearInput: string;
  ppSsnInput: string;
  ppIncomeInput: string;
  ppPaymentFrequencySelect: string;
  ppAgreementCheckbox: string;
  ppSeeMyPurchaseOptionsButton: string;
  ppDateFieldInput: string;
  ppDatepickerPrevMonth: string;
  ppLoaderContainer: string;
  ppViewPlanDetails: string;
  ppContinueWithUown: string;
  ppOfferApprovalAmount: string;
  ppOfferCartTotal: string;
  ppOfferRecurringPayment: string;
  ppContinueToLastStep: string;
  ppPtIframe: string;
}

export interface CancellationSelectors {
  merchantOfferInsuranceCheckbox: string;
}

export interface ModifyLeaseSelectors {
  modifyLeaseWarningContinue: string;
  modifyLeaseSaveButton: string;
  activityLogEntry: string;
}

export interface ContractSelectors {
  contractViewDocumentLink: string;
  contractCheckbox: string;
}

export interface PaymentProgramSelectors {
  paymentProgramContainer: string;
  paymentProgramLogo: string;
  paymentProgramTitle: string;
  paymentProgramSubtitle: string;
  paymentCard: string;
  paymentCardTitle: string;
  paymentCardDescription: string;
  paymentCardPrice: string;
  paymentCardDetailRow: string;
  paymentCardButton: string;
  termSelectionTab: string;
  termSelectionTabSelected: string;
  paymentProgramFooterText: string;
  paymentProgramFooterPhone: string;
}

export interface CompletionScreenSelectors {
}

export interface NewApplicationSelectors {
  // Origination portal "New Application" form
  naNewApplicationLink: string;
  naSubmitNewApplicationBtn: string;
  naEmailAddress: string;
  naPhone: string;

  // Consumer-facing application wizard — Page 1 (Personal Info)
  naMainFirstName: string;
  naMainLastName: string;
  naMainSsn: string;
  naMainDob: string;
  naMainCellPhone: string;
  naMainEmailAddress: string;
  naMainAddress1: string;
  naMainPostalCode: string;
  naMainCity: string;

  // Consumer-facing application wizard - Page 2 (Employment)
  naMainLastPayDate: string;
  naMainNextPayDate: string;
  naMainMonthlyIncome: string;

  // Consumer-facing application wizard - Page 3 (Consent)
  naIsAgreedToStatements: string;
  naIsAgreedToPrivacyPolicy: string;

  // Wizard footer buttons
  naSendApplicationNextBtn: string;
  naSendApplicationSubmitBtn: string;

  // Invoice / Lease creation on customer page
  naNumberOfItems: string;
  naItemCode: string;
  naItemDescription: string;
  naBasePricePerItem: string;
  naDeliveryFee: string;
  naInstallationFee: string;
  naMiscFee: string;
  naSubmitItemLease: string;
  naSalesPerson: string;
  naInvoiceNumber: string;
}

export interface InsuranceSelectors {
  purchaseInsuranceSubmitBtn: string;
  seeProtectionBenefitsBtn: string;
  insuranceOptInCheckbox: string;
  insuranceOptOutCheckbox: string;
}

export interface WebsiteSelectors {
  // Layout sections
  wsAccountSummary: string;
  wsPaymentSection: string;
  wsContactSection: string;

  // Login elements
  wsEmailOrPhoneInput: string;
  wsVerificationCodeInput: string;
  wsSubmitButton: string;
  wsResendCodeButton: string;

  // Dashboard elements
  wsMakePaymentButton: string;
  wsAccountNumber: string;
  wsBalanceAmount: string;
  wsNextPaymentDate: string;

  // Navigation links
  wsPaymentMethodsLink: string;
  wsUpdateContactLink: string;
  wsAccountSummaryLink: string;

  // Email change
  wsPrimaryEmailField: string;

  // Phone update — Update Contact Info page
  wsPhoneNumberInput: string;
  wsSaveChangesButton: string;
  wsSuccessMessage: string;
  wsErrorMessage: string;

  // ACH payment
  wsOtherAmountRadio: string;
  wsPaymentAmountField: string;
  wsAchCheckbox: string;
  wsPaymentSubmitButton: string;

  // Account dropdown
  wsAccountsDropdown: string;

  // Logout
  wsLogoutButton: string;

  // Navigation (inline in methods)
  wsPaymentsLink: string;
  wsDocumentsLink: string;
  wsContactLink: string;
}

export interface MerchantSettingSelectors {
  msDealerDiscountInput: string;
  msDealerRebateTypeSelect: string;
  msDealerRebateOverrideInput: string;
  msBulkConfirmButton: string;
  msPeakCampaignIdInput: string;
  msOffPeakCampaignIdInput: string;
  msPeakCampaignIdLabel: string;
  msOffPeakCampaignIdLabel: string;
  msUwPipelineInput: string;
  msFraudThresholdInput: string;
  msMaxApprovalAmountInput: string;
  msGdsDataToggle: string;
  /** EPO 5% / EPO 10% are GDS-section triple-checkbox collapse dropdowns (DOM-first verified qa2 2026-06-16). */
  msEpo5MainCheckbox: string;
  /** Caret-down toggle that opens the EPO5 True/False collapse dropdown. */
  msEpo5CaretToggle: string;
  msEpo5TrueCheckbox: string;
  msEpo5FalseCheckbox: string;
  msEpo10MainCheckbox: string;
  /** Caret-down toggle that opens the EPO10 True/False collapse dropdown. */
  msEpo10CaretToggle: string;
  msEpo10TrueCheckbox: string;
  msEpo10FalseCheckbox: string;
  /** GDS-section SAVE button (disabled until the form is dirty). Distinct from the filter-panel SAVE. */
  msGdsSaveButton: string;
  /** Merchant table row matched by visible refCode/code text (e.g. 'OL90202-0001'). */
  msMerchantRowByText: (text: string) => string;
  /** Filters-panel "Search table" box — filters the merchant table by code/name. */
  msMerchantSearchTableInput: string;
  /** Filters-panel apply button (accessible name "Search"). Distinct from SAVE/GDS buttons. */
  msMerchantFilterSearchButton: string;
}

export interface ServicingInformationSelectors {
  svInfoEditButton: string;          // #ServicingInformation-edit
  svInfoPayFrequencyDropdown: string; // #payFrequency (React Select)
  svInfoSaveButton: string;           // collapsableEdit save button
  svInfoFirstDueDateInput: string;    // first due date input in servicing info form
  svInfoSecondDueDateInput: string;   // second due date input in servicing info form
}

// ── Settlement Amount panel + modal (uown/frontend/servicing#512) ───────
//
// "Account & Contract Overview" sub-panel of "Servicing Information"
// exposes a clickable "Settlement Amount" label. Clicking it opens a
// Bootstrap modal titled "Settlement Breakdown" with per-line items.
//
// Selectors validated via MCP Playwright in qa1 (SPEC §7 + diretrizes do
// usuário 2026-05-22). The label is a `<div>` (NOT a button/link), so
// `getByRole` does not match — we anchor on the exact text content.
export interface SettlementAmountSelectors {
  /** Clickable "Settlement Amount" label in the Account & Contract Overview panel. */
  /** Modal container — Bootstrap `.modal.show` whose body contains "Settlement Breakdown". */
  settlementBreakdownModal: string;
  /** Modal title `<h*>` text — used to confirm the modal opened. */
  /** Each row inside the breakdown — `<tr>` or list item. Implementer iterates these. */
  settlementBreakdownRow: string;
  /** Close (X) button for the breakdown modal. */
  settlementBreakdownClose: string;
}

export interface PaymentArrangementSelectors {
  paymentArrangementCheckbox: string;                           // #paymentArrangement
  arrangementStartDateInput: string;                            // #startDate
  arrangementEndDateInput: string;                              // #endDate
  arrangementPaymentFrequencyDropdown: string;                  // xpath for #paymentFrequency React Select
  arrangementInstallmentAmountInput: (index: number) => string; // paymentInfo[n].paymentAmount
}

export interface ErrorLogSelectors {
  elFilterFromDate: string;
  elFilterToDate: string;
  elFilterSearch: string;
}

export interface MoveDueDateSelectors {
  moveDueDateButton: string;
  moveDueDateScheduledSelect: string;
  moveDueDateNewDateInput: string;
}

// ── Task #442 — Send Invite / Podium (Servicing — Account Summary) ─────────
export interface InvitationSelectors {
  invitationIcon: string;       // #invitation (envelope icon in account summary bar)
}

// ── Task #505 — Opt Out AI (Servicing — Primary Contact / Mobile Phone) ────
export interface OptOutAiSelectors {
  primaryContactEditButton: string;
  optOutAiCheckbox: string;
  doNotCallCheckbox: string;
  optOutAiReasonModal: string;
  optOutAiReasonTextbox: string;
  optOutAiReasonSaveButton: string;
}

// ── Origination — Leads Table Filters ─────────────────────────────────────────
export interface LeadsTableSelectors {
}

// ── Origination — Sales Rep / Merchant Info panel (Customer page) ──────────────
export interface SalesRepPanelSelectors {
  salesRepEditButton: string;   // CollapsableEditLayout edit trigger — #SalesRep-edit
  salesRepSaveButton: string;   // CollapsableEditLayout primary save button (scoped to panel)
}

// ── Origination — Lease Documents Panel (Customer page — Task #521 LEASEMOD) ──
// CSS-module hash classes — use [class*=] prefix matchers (pitfall #26).
export interface LeasePanelSelectors {
  leasePanelHeader: string;
  leasePanelContractItem: string;
  leasePanelContractTitleButton: string;
  leasePanelContractSubtitle1: string;
  leasePanelContractSubtitle2: string;
  leasePanelContractTimestamp: string;
}

// ── Origination — Open to Buy page ────────────────────────────────────────────
export interface OpenToBuySelectors {
  openToBuyExportCsvButton: string; // Export / CSV button on Open to Buy page
}

// ── Origination — Column-Order Tests (task #1295) ────────────────────────────
//
// Selectors used by Overview/Leads/Funding table-order assertions. Kept generic
// enough to be reused by future table-related specs (sort regression, scroll
// container probing, CSV export). DOM-first findings from qa1 (SPEC § 0.5):
//   - Tables are Bootstrap `<table>` wrapped in `<div class="table-responsive">`
//   - CSV export on Leads/Funding labelled `Download CSV` / `Email CSV` / `Export CSV`
//   - Overview exposes a `Config Columns` trigger (gear icon) — show/hide only,
//     no drag-reorder, no persistence (in-memory React state)
export interface ColumnOrderSelectors {
  /** Bootstrap scrollable wrapper around the main agent table. Used by CT-04 to
   *  assert customer-name <th> bounding box is fully visible at scrollLeft=0. */
  /** Generic "scrollable ancestor" fallback when `.table-responsive` is absent. */
  scrollableAncestor: string;
  /** Overview-only — "Config Columns" trigger (gear icon link). */
  configColumnsTrigger: string;
  /** Config Columns side-panel container ("Configure the view"). */
  configColumnsPanel: string;
  /** Config Columns panel on the Merchants list page — Bootstrap dropdown variant
   *  (`div.dropdown.show`, NOT a dialog/modal/aside). Task #1309. */
  configColumnsPanelMerchants: string;
  /** Individual column checkbox inside the Config Columns panel (by name attr). */
  configColumnsCheckbox: (name: string) => string;
  /** CSV export trigger probe — matches Download/Export CSV (direct download).
   *  Email-variant is excluded; race the download event in test. */
  csvDownloadTrigger: string;
  /** CSV email-variant trigger (sends CSV via email — no direct download). */
  csvEmailTrigger: string;

  // ── Task #1321 — CSV export size-limit guard (Overview + Leads) ──
  /** Precise Download CSV button (the `<button>` with text "Download CSV").
   *  Hash-agnostic class probe `filtered-csv-download_csvButton__…` plus text. */
  csvDownloadButton: string;
  /** Download CSV button in its ENABLED state (`filtered-csv-download_enabledButton__…`). */
  csvDownloadButtonEnabled: string;
  /** Download CSV button in its DISABLED state (`filtered-csv-download_disabledButton__…`;
   *  `background:#5a6268; cursor:not-allowed`). */
  csvDownloadButtonDisabled: string;
  /** Precise Email CSV button (the `<button>` with text "Email CSV"). */
  csvEmailButton: string;
  /** Email CSV button in its CSS-disabled state (class*="disabledButton"). */
  csvEmailButtonDisabled: string;
  /** Directing tooltip wrapper for the Download CSV control, by tooltipIdPrefix.
   *  Overview = `overview-csv-download`, Leads = `leads-csv-download`. */
  /** Email CSV modal dialog (title "Which email should we send this CSV file to?"). */
  csvEmailModal: string;
  /** Email CSV modal title text. */
  csvEmailModalTitle: string;
  /** Email address input inside the Email CSV modal (placeholder "Enter your email..."). */
  csvEmailModalInput: string;
  /** Send button inside the Email CSV modal (disabled until an address is entered). */
  csvEmailModalSendButton: string;
  /** CANCEL button inside the Email CSV modal. */
  csvEmailModalCancelButton: string;
  /** rdt pagination footer text container — holds the "X-Y of N" total. */
  rdtPaginationFooter: string;
}

// ── Servicing — CC History / Edit Pending CC Payment Modal ────────────────────
export interface CcHistorySelectors {
  ccEditPencilIcon: string;
  // Sticky Recover (svc#485)
  stickyStatusColumnName: string;
  stickyTxnIdColumnName: string;
  stickyAttemptsColumnName: string;
  stickyLastRetryColumnName: string;
}

// ── Origination — CCBIN (Send Application) ───────────────────────────────────
export interface CcBinSelectors {
  naCcBinField: string;
  naCcBinImage: string;
  naCcBinInstructionText: string;
}

// ── Origination — Merchant Add/Edit form (/merchant, /merchant/addMerchant, /merchant/{code}) ──
// ── Origination — Program Groups page (Task #1260) ──────────────────────────
export interface ProgramGroupsSelectors {
  pgGroupCountCell: string;
  pgGroupInfoIcon: string;
  pgGroupEditIcon: string;
}

// ── Origination — Programs List page (/programs — Schedule Activation/Deactivation Dates) ──
export interface ProgramsListSelectors {
  plSectionHeader: string;
  plAddNewProgramBtn: string;
  plSearchInput: string;
  plGroupFilterDropdown: string;
  plSearchButton: string;
  plTableRow: string;
  plProgramNameLink: string;
  plPaginationFooter: string;
}

// ── Origination — Program Details panel (right pane of 2-pane /programs layout) ────
export interface ProgramDetailsSelectors {
  pdPanelHeader: string;
  pdProgramNameInput: string;
  pdTermMonthsInput: string;
  pdActivationDateInput: string;
  pdDeactivationDateInput: string;
  pdMoneyFactorInput: string;
  pdPayoffDiscountInput: string;
  pdEpoDaysInput: string;
  pdEpoFeePercentInput: string;
  pdMinimumCartAmountInput: string;
  pdMaxCartAmountInput: string;
  pdDealerDiscountOverrideInput: string;
  pdProcessingFeeOverrideInput: string;
  pdAmountChargedAtSigningInput: string;
  pdAllowedFrequencyOverrideControl: string;
  pdLendingCategoryControl: string;
  pdProgramGroupControl: string;
  pdStatesControl: string;
  pdSaveButton: string;
  pdCancelButton: string;
  pdCloneDropdownToggle: string;
  pdCloneGroupButton: string;
  pdInlineError: string;
  pdNotesCard: string;
  pdNotesFiltersButton: string;
  pdNotesLogActivityControl: string;
  pdNotesRow: string;
  pdNotesCell: string;
  pdNotesExpandChevron: string;
}

// ── Origination — Merchant detail page: Programs section (read-only) ────────
export interface MerchantProgramsSectionSelectors {
  mpsSection: string;
  mpsProgramRow: string;
  mpsProgramNameCell: string;
  mpsStatusBadge: string;
  mpsStatusTooltip: string;
  mpsEditAction: string;
}

// ── Servicing — EPO panel (svc#531 R1.52.0 — 16m EPO for CA) ─────────────────
// "Account & Contract Overview" + "Early Payoff / 90-Day Pay Off" sections on
// /customer-information/{accountPk}. Each label `<div>` is followed by a
// sibling `<div>` value — page object reads the pair via xpath sibling.
export interface ServicingEpoPanelSelectors {
}

// ── Customer Portal — Overview + Payment (svc#531 R1.52.0) ───────────────────
// Customer-facing portal cards and the /payment page Pay Off radio. Mobile
// viewport 375x667 per CLAUDE.md regra #15.
export interface CustomerPortalOverviewSelectors {
  wsPayOffButton: string;
  wsContractBalanceLabel: string;
  wsPaymentDueLabel: string;
  wsNextPaymentDueDateLabel: string;
  wsPaymentPageBalancePaidOffRadioLabel: string;
}

// ── Servicing — Customer Documents tab (/documents/{accountPk}) ─────────────
export interface ServicingDocumentsSelectors {
  /** Page title rendered by `<PageName name="Documents" />` */
  svcDocumentsPageTitle: string;
  /** Search/filter input above the table — `<Input id="filterDocuments" />` */
  svcDocumentsSearchInput: string;
  /** "ADD NEW" upload trigger button (uses CSS-modules class `documentsButton`) */
  svcDocumentsAddNewButton: string;
  /** All rows of the react-data-table (rdt_TableRow) — scope under documents page only */
  svcDocumentsTableRow: string;
  /** Table cell selector for the documents table */
  svcDocumentsTableCell: string;
  /** "There are no records to display" empty-state message */
  svcDocumentsEmptyState: string;
  /** Download trigger inside a row — `<div id="download">` (FontAwesome SVG with onClick → window.open) */
  svcDocumentsRowDownloadTrigger: string;
  /** Edit pencil trigger inside a row — `<div id="edit">` */
  svcDocumentsRowEditTrigger: string;
  /** Resend trigger inside a row — `<div id="resend">` */
  svcDocumentsRowResendTrigger: string;
}

// ── Servicing — Bank Account CRUD Modal (card + Add + View All) ─────────────
export interface BankAccountModalSelectors {
  bankAccountCard: string;
  addBankAccountButton: string;
  viewAllBankAccountsButton: string;
  addBankAccountModalTitle: string;
  addBankAccountForm: string;
  bankAccountTypeDropdown: string;
  bankAccountRoutingNumberInput: string;
  bankAccountAccountNumberInput: string;
  setDefaultPaymentDropdown: string;
  saveBankAccountButton: string;
  cancelBankAccountButton: string;
  addBankAccountModalClose: string;
  allBankAccountsModalTitle: string;
  bankAccountsTable: string;
  bankAccountsTableBody: string;
  bankAccountsRowCheckbox: string;
  bankAccountsSelectAllCheckbox: string;
  bankAccountsDeleteButton: string;
  setDefaultPaymentValue: string;
  accountNumberDisplayValue: string;
}

export interface MerchantAddEditSelectors {
  merchantClonedFromIcon: string;
  merchantRefCodeInput: string;
  merchantNameInput: string;
  merchantLegalNameInput: string;
  merchantLocationNameInput: string;
}

// ── GowSign — Document Viewer (cross-portal / external embed) ──────────────
export interface GowSignDocumentViewerSelectors {
  // Header / Toolbar
  gsViewerRoot: string;
  gsDocumentTitle: string;
  gsStartSignatureButton: string;
  gsDownloadButton: string;
  gsCloseDocumentButton: string;

  // Pre-signature metadata table
  gsDocumentIdValue: string;
  gsRecipientNameCell: string;
  gsRecipientEmailCell: string;
  gsStatusBadge: string;

  // Document content
  gsPageNumber: string;

  // Property Price Tag
  gsPriceTagTable: string;
  gsPriceTagTotalOfPayments: string;
  gsPriceTagCostOfLease: string;
  gsPriceTagCashPrice: string;
  gsPriceTagAmountOfEachPayment: string;
  gsPriceTagNumberOfPayments: string;
  gsPriceTagRenewalPeriod: string;

  // LESSOR / LESSEE
  gsLessorLesseeTable: string;
  gsLessorCell: string;
  gsLesseeCell: string;

  // Lease Items
  gsLeaseItemsTable: string;
  gsLeaseItemsRow: string;
  gsTotalDeliveryFee: string;

  // Initial Payment Breakdown
  gsInitialLeasePaymentRow: string;
  gsProcessingFeeRow: string;
  gsTaxRow: string;
  gsTotalInitialPaymentRow: string;

  // Dates / agreement metadata in body
  gsAgreementNumberValue: string;
  gsAccountNumberValue: string;
  gsContractDateValue: string;
  gsInitialPaymentDueDateRow: string;
  gsPromoExpirationRow: string;

  // EPO chart
  gsEpoChartTable: string;
  gsEpoChartRows: string;

  // ACH grid
  gsAchGridTable: string;
  gsAchGridRows: string;
}

// ── AMS — Merchants list (/merchants) and Users page Add User modal — svc#504 ──
// MR!1430 + MR!170 (R1.52.0). Merchants page consumes new GET /uown/merchants;
// Users page lazy-loads getAllAvailableMerchants only when "Add User" is clicked.
// DOM refs validated via MCP Playwright in qa1 (2026-05-22).
export interface AmsMerchantsSelectors {
  /** Sidebar nav link for Merchants section (Bootstrap d-lg-block; requires ≥992px viewport). */
  amsMerchantsNavLink: string;
  /** Filters toggle button (opens the search + active-state filter panel). */
  amsMerchantsFiltersButton: string;
  /** Search input inside the opened Filters panel. */
  amsMerchantsSearchInput: string;
  /** Search submit button inside the opened Filters panel. */
  amsMerchantsSearchSubmitButton: string;
  /** Active-status combobox — opens a list of "Active" / "Inactive" options. Placeholder is "Please select". */
  amsMerchantsActiveCombobox: string;
  /** OPEN-state combobox container — scope for option label lookups. */
  amsMerchantsActiveComboboxOpen: string;
  /** Option row container in the open Active combobox — CSS-Module class `[class*="customOptionStyles"]`. Page object filters by exact label text. 6ª passada (F-003 fix definitivo). */
  amsMerchantsActiveOptionRow: string;
  /** Last Login column header in the merchants table (rendered regardless of cell content). */
  amsMerchantsLastLoginHeader: string;
  /** "Add User" button on /users page — triggers lazy load of /uown/getAllAvailableMerchants. */
  amsAddUserButton: string;
}

// ── AMS — Users list, User Details & Merchant Association (Task #74) ────────
export interface AmsUserSelectors {
  // Users list (/users) — react-data-table-component
  amsRdtTable: string;
  amsRdtTableRow: string;
  amsRdtTableBody: string;
  amsRdtPagination: string;
  amsPaginationNextButton: string;
  // User Details (/users/[username])
  amsEditProfileButton: string;
  amsUserFirstNameInput: string;
  amsUserLastNameInput: string;
  amsUserEmailInput: string;
  amsUserPhoneInput: string;
  amsSaveButton: string;
  amsCancelButton: string;
  // Associate Merchants (/associate-users-to-merchants)
  amsAssocPageSubmit: string;
  amsUsersSelectionInfo: string;
  amsMerchantsSelectionInfo: string;
  amsAssocRowCheckbox: string;
  // Toast
  amsSuccessToast: string;
  // Confirmation modal
  amsAssocConfirmButton: string;
  // Log Activity table (/users/[username]) — only rdt_Table on user details page
  amsLogActivityRow: string;
  amsLogActivityCell: string;
  // Edit User Merchants card (/users/[username])
  amsEditUserMerchantsButton: string;
  amsUserMerchantsCardToggle: string;
  amsUserMerchantsCardCollapse: string;
  amsUserMerchantsTag: string;
  amsManageMerchantsButton: string;
  amsDeleteAllMerchantsButton: string;
  amsUserMerchantsSaveButton: string;
  amsUserMerchantsCancelButton: string;
  amsUserMerchantsSelectControl: string;
  amsUserMerchantsSelectInput: string;
  amsUserMerchantsSelectOption: string;
  amsUserMerchantsSearchbox: string;
}

/** Composite type of all selectors */
export interface AppSelectors extends
  SpinnerSelectors,
  ToastSelectors,
  PaginationSelectors,
  SidebarSelectors,
  FilterSelectors,
  ModalSelectors,
  ButtonSelectors,
  TableSelectors,
  LoginSelectors,
  SearchSelectors,
  CustomerSummarySelectors,
  PaymentSelectors,
  CreditCardSelectors,
  BankSelectors,
  FormSelectors,
  PandaDocsSelectors,
  SignwellSelectors,
  SigningProviderSelectors,
  FundingSelectors,
  PaymentTransactionSelectors,
  AddCardSelectors,
  TopBarSelectors,
  MenuSelectors,
  CancellationSelectors,
  ModifyLeaseSelectors,
  PayTomorrowPortalSelectors,
  PayPairPortalSelectors,
  ContractSelectors,
  PaymentProgramSelectors,
  CompletionScreenSelectors,
  InsuranceSelectors,
  WebsiteSelectors,
  NewApplicationSelectors,
  MerchantSettingSelectors,
  ServicingInformationSelectors,
  SettlementAmountSelectors,
  PaymentArrangementSelectors,
  ErrorLogSelectors,
  MoveDueDateSelectors,
  AmsUserSelectors,
  AmsMerchantsSelectors,
  InvitationSelectors,
  OptOutAiSelectors,
  LeadsTableSelectors,
  SalesRepPanelSelectors,
  LeasePanelSelectors,
  OpenToBuySelectors,
  CcHistorySelectors,
  CcBinSelectors,
  MerchantAddEditSelectors,
  ProgramGroupsSelectors,
  ProgramsListSelectors,
  ProgramDetailsSelectors,
  MerchantProgramsSectionSelectors,
  BankAccountModalSelectors,
  ServicingDocumentsSelectors,
  GowSignDocumentViewerSelectors,
  ColumnOrderSelectors,
  ServicingEpoPanelSelectors,
  CustomerPortalOverviewSelectors {}

export interface AmsUserSelectors {
  amsRdtTable: string;
  amsRdtTableRow: string;
  amsRdtTableBody: string;
  amsRdtPagination: string;
  amsPaginationNextButton: string;
  amsEditProfileButton: string;
  amsUserFirstNameInput: string;
  amsUserLastNameInput: string;
  amsUserEmailInput: string;
  amsUserPhoneInput: string;
  amsSaveButton: string;
  amsCancelButton: string;
  amsAssocPageSubmit: string;
  amsUsersSelectionInfo: string;
  amsMerchantsSelectionInfo: string;
  amsAssocRowCheckbox: string;
  amsSuccessToast: string;
}

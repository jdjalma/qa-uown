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
  rowsPerPageDropdown: string;
}

export interface SidebarSelectors {
  sidebar: string;
  sidebarItem: string;
}

export interface FilterSelectors {
  filterOption: string;
  filterOptionWithRole: string;
  filterControl: string;
  filterControlResilient: string;
  filtersButton: string;
  filterMenuPortal: string;
  filterPlaceholder: string;
  filterSingleValue: string;
  filterClearIndicator: string;
  filterMultiValueLabel: string;
}

export interface ModalSelectors {
  modalContent: string;
  modalHeader: string;
  modalBody: string;
  modalFooter: string;
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
  searchResultAccountLink: string;
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
  signwellSignatureCallout: string;
  signwellInitialsCallout: string;
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
  menuOverview: string;
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
  ptRefundButton: string;
  ptRefundReason: string;
  ptRefundCheckbox: string;
  ptRefundConfirm: string;
  ptViewRefund: string;
  ptOtpInput: string;
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
  ptEmploymentSubmit: string;
  ptSelectOffer: string;
  ptContractIframe: string;
  ptContractScrollBox: string;
  ptCardholderFirstName: string;
  ptCardholderLastName: string;
  ptCardNumber: string;
  ptCardExpMonth: string;
  ptCardExpYear: string;
  ptCardCvv: string;
  ptContractAgreeCheckbox: string;
  ptContractSubmitBtn: string;
  ptStreet: string;
  ptCity: string;
  ptZip: string;
  ptStateDropdown: string;
  ptStateDropdownItem: string;
  ptConfirmDialog: string;
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
  cancelLeaseButton: string;
  cancelLeaseCommentInput: string;
  cancelLeaseRefundCheckbox: string;
  cancelLeaseConfirmButton: string;
  invoiceItemDeleteButton: string;
  merchantOfferInsuranceCheckbox: string;
}

export interface ModifyLeaseSelectors {
  modifyLeaseButton: string;
  modifyLeaseWarningContinue: string;
  modifyLeaseWarningCancel: string;
  modifyLeaseSaveButton: string;
  activityLogCard: string;
  activityLogEntry: string;
}

export interface ContractSelectors {
  contractViewDocumentLink: string;
  contractCheckbox: string;
  completeNextPaycheckInput: string;
  completePayFrequencyCombobox: string;
  completePlanSelectionHeading: string;
  completeChooseProgramBtn: string;
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
  paymentCardPriceLabel: string;
  paymentCardDetailRow: string;
  paymentCardButton: string;
  termSelectionTab: string;
  termSelectionTabSelected: string;
  paymentProgramFooterText: string;
  paymentProgramFooterPhone: string;
}

export interface CompletionScreenSelectors {
  completionCheckIcon: string;
  completionMainMessage: string;
  completionPhoneNumber: string;
  completionFooterText: string;
  completionContent: string;
}

export interface NewApplicationSelectors {
  // Origination portal "New Application" form
  naNewApplicationLink: string;
  naSubmitNewApplicationBtn: string;
  naEmailAddress: string;
  naPhone: string;
  naMerchantDropdown: string;
  naLocationDropdown: string;

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

  // Consumer-facing application wizard — Page 2 (Employment)
  naMainEmployerName: string;
  naMainPayFrequencyDropdown: string;
  naMainLastPayDate: string;
  naMainNextPayDate: string;
  naMainMonthlyIncome: string;
  naEmploymentDurationDropdown: string;

  // Consumer-facing application wizard — Page 3 (Consent)
  naIsAgreedToStatements: string;
  naIsAgreedToPrivacy: string;
  naBankruptcyDropdown: string;

  // Invoice / Lease creation on customer page
  naLeaseAddNew: string;
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
  buddyOfferContainer: string;
  insuranceOptInCheckbox: string;
  insuranceOptOutCheckbox: string;
}

export interface WebsiteSelectors {
  // Layout sections
  wsAccountSummary: string;
  wsPaymentSection: string;
  wsContactSection: string;

  // Login elements
  wsEmailInput: string;
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
  wsPhoneAreaCodeInput: string;
  wsPhoneNumberInput: string;
  wsSaveChangesButton: string;
  wsSuccessMessage: string;
  wsErrorMessage: string;
  wsUpdatePhoneSection: string;

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
  msMerchantTableCheckbox: string;
  msSubmitButton: string;
  msBulkConfirmButton: string;
  msPeakCampaignIdInput: string;
  msOffPeakCampaignIdInput: string;
  msPeakCampaignIdLabel: string;
  msOffPeakCampaignIdLabel: string;
  msUwPipelineInput: string;
  msFraudThresholdInput: string;
  msMaxApprovalAmountInput: string;
  msGdsDataToggle: string;
}

export interface ServicingInformationSelectors {
  svInfoEditButton: string;          // #ServicingInformation-edit
  svInfoPayFrequencyDropdown: string; // #payFrequency (React Select)
  svInfoSaveButton: string;           // collapsableEdit save button
  svInfoFirstDueDateInput: string;    // first due date input in servicing info form
  svInfoSecondDueDateInput: string;   // second due date input in servicing info form
}

export interface PaymentArrangementSelectors {
  paymentArrangementCheckbox: string;                           // #paymentArrangement
  arrangementStartDateInput: string;                            // #startDate
  arrangementEndDateInput: string;                              // #endDate
  arrangementPaymentFrequencyDropdown: string;                  // xpath for #paymentFrequency React Select
  arrangementInstallmentAmountInput: (index: number) => string; // paymentInfo[n].paymentAmount
  arrangementInstallmentDateInput: (index: number) => string;   // paymentInfo[n].paymentDate
}

export interface ErrorLogSelectors {
  elTabSendApplication: string;
  elTabSubmitApplication: string;
  elFilterFromDate: string;
  elFilterToDate: string;
  elFilterSearch: string;
  elFilterSubmitButton: string;
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
  primaryContactSaveButton: string;
  optOutAiCheckbox: string;
  doNotCallCheckbox: string;
  primaryContactSection: string;
  mobilePhoneSection: string;
  optOutAiReasonModal: string;
  optOutAiReasonTextbox: string;
  optOutAiReasonSaveButton: string;
}

// ── Origination — Leads Table Filters ─────────────────────────────────────────
export interface LeadsTableSelectors {
  leadsFromDateInput: string;
  leadsToDateInput: string;
  leadsLeadPkInput: string;
  leadsEmailInput: string;
  leadsSsnInput: string;
  leadsAccountPkInput: string;
  leadsPhoneInput: string;
  leadsCustomerNameInput: string;
  leadsStateDropdown: string;
  leadsLeadStatusDropdown: string;
  leadsInvoiceNumberInput: string;
}

// ── Origination — Sales Rep / Merchant Info panel (Customer page) ──────────────
export interface SalesRepPanelSelectors {
  salesRepEditButton: string;   // CollapsableEditLayout edit trigger — #SalesRep-edit
  salesRepSaveButton: string;   // CollapsableEditLayout primary save button (scoped to panel)
}

// ── Origination — Open to Buy page ────────────────────────────────────────────
export interface OpenToBuySelectors {
  openToBuyNavLink: string;         // Sidebar link to /openToBuy
  openToBuyExportCsvButton: string; // Export / CSV button on Open to Buy page
}

// ── Servicing — CC History / Edit Pending CC Payment Modal ────────────────────
export interface CcHistorySelectors {
  ccEditPencilIcon: string;
  ccEditModal: string;
  ccEditModalTitle: string;
  ccEditPostingDate: string;
  ccEditAmount: string;
  ccEditComment: string;
  ccEditSaveButton: string;
  ccEditCancelButton: string;
  ccEditRemoveButton: string;
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
  pgProgramLink: string;
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
  pdNotesSearchInput: string;
  pdNotesUserIdInput: string;
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
  bankAccountsTableRow: (index: number) => string;
  bankAccountsRowCheckbox: string;
  bankAccountsSelectAllCheckbox: string;
  bankAccountsDeleteButton: string;
  setDefaultPaymentValue: string;
  accountNumberDisplayValue: string;
}

export interface MerchantAddEditSelectors {
  merchantListAddButton: string;
  merchantCloneDropdownToggle: string;
  merchantCloneDropdownInput: string;
  merchantCloneDropdownItem: string;
  merchantClonedFromIcon: string;
  inventoryCategoryControl: string;
  inventoryCategoryInput: string;
  inventoryCategoryClearIndicator: string;
  inventoryCategorySingleValue: string;
  inventoryCategoryLabel: string;
  inventoryCategoryErrorText: string;
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
  gsReadingModeToggle: string;

  // Pre-signature metadata table
  gsSentByLabel: string;
  gsCreatedOnLabel: string;
  gsDocumentIdHeader: string;
  gsDocumentIdValue: string;
  gsRecipientHeader: string;
  gsRecipientNameCell: string;
  gsRecipientEmailCell: string;
  gsStatusBadge: string;

  // Document content
  gsDocumentContainer: string;
  gsPageNumber: string;
  gsPageBreak: string;

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
  gsEpoChartRowAt: (n: number) => string;

  // ACH grid
  gsAchGridTable: string;
  gsAchGridRows: string;
}

// ── AMS — Users list, User Details & Merchant Association (Task #74) ────────
export interface AmsUserSelectors {
  // Users list (/users) — react-data-table-component
  amsRdtTable: string;
  amsRdtTableRow: string;
  amsRdtTableBody: string;
  amsRdtPagination: string;
  amsPaginationNextButton: string;
  amsPaginationPrevButton: string;
  amsUsersSearchInput: string;
  // User Details (/users/[username])
  amsEditProfileButton: string;
  amsUserFirstNameInput: string;
  amsUserLastNameInput: string;
  amsUserEmailInput: string;
  amsUserPhoneInput: string;
  amsSaveButton: string;
  amsCancelButton: string;
  amsEditUserCard: string;
  // Associate Merchants (/associate-users-to-merchants)
  amsAssocPageSubmit: string;
  amsUsersSelectionInfo: string;
  amsMerchantsSelectionInfo: string;
  amsAssocUsersTableContainer: string;
  amsAssocMerchantsTableContainer: string;
  amsAssocSelectAllCheckbox: string;
  amsAssocRowCheckbox: string;
  amsAssocMerchantsSearch: string;
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
  amsUserMerchantsMultiValue: string;
  amsUserMerchantsMultiValueRemove: string;
  amsUserMerchantsClearIndicator: string;
  amsUserMerchantsSearchbox: string;
  amsUserMerchantsOriginationTab: string;
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
  PaymentArrangementSelectors,
  ErrorLogSelectors,
  MoveDueDateSelectors,
  AmsUserSelectors,
  InvitationSelectors,
  OptOutAiSelectors,
  LeadsTableSelectors,
  SalesRepPanelSelectors,
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
  GowSignDocumentViewerSelectors {}

export interface AmsUserSelectors {
  amsRdtTable: string;
  amsRdtTableRow: string;
  amsRdtTableBody: string;
  amsRdtPagination: string;
  amsPaginationNextButton: string;
  amsPaginationPrevButton: string;
  amsUsersSearchInput: string;
  amsEditProfileButton: string;
  amsUserFirstNameInput: string;
  amsUserLastNameInput: string;
  amsUserEmailInput: string;
  amsUserPhoneInput: string;
  amsSaveButton: string;
  amsCancelButton: string;
  amsEditUserCard: string;
  amsAssocPageSubmit: string;
  amsUsersSelectionInfo: string;
  amsMerchantsSelectionInfo: string;
  amsAssocUsersTableContainer: string;
  amsAssocMerchantsTableContainer: string;
  amsAssocSelectAllCheckbox: string;
  amsAssocRowCheckbox: string;
  amsAssocMerchantsSearch: string;
  amsSuccessToast: string;
}

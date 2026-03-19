/**
 * Type definitions for centralized UI selectors.
 * Organized by UI domain section.
 */

// ── Section interfaces ──────────────────────────────────────────────

export interface SpinnerSelectors {
  spinnerBorder: string;
  spinnerGrow: string;
  fullPageLoader: string;
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
  filtersButton: string;
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
}

export interface CustomerSummarySelectors {
  customerSummary: string;
  customerStatusValue: string;
  accountNumberLink: string;
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
}

export interface BankSelectors {
  bankRoutingNumber: string;
  bankAccountNumber: string;
  achReEnterAccountNumber: string;
  bankAccountCustomerFirst: string;
  bankAccountCustomerLast: string;
  bankAccountTypeInput: string;
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
  MoveDueDateSelectors {}

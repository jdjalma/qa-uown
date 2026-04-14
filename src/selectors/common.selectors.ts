/**
 * Centralized CSS/XPath selectors — single source of truth for all UI elements.
 * All selectors must be referenced via this const; never hardcode in page objects or tests.
 *
 * @see selector.types.ts for type definitions
 */
import type { AppSelectors } from './selector.types.js';

export const SELECTORS: AppSelectors = {
  // ── Spinner / Loading ──────────────────────────────────────────────
  spinnerBorder: '.spinner-border',
  spinnerGrow: '.spinner-grow',
  fullPageLoader: '[class*="index-module_loader"]',

  // ── Toast notifications ────────────────────────────────────────────
  toastBody: '.Toastify__toast-body',
  toastSuccess: '.Toastify__toast--success, .toast-success, .alert-success',
  toastError: '.Toastify__toast--error, .toast-error, .alert-danger',
  toastClose: '.Toastify__close-button',

  // ── Pagination ─────────────────────────────────────────────────────
  paginationNext: '#pagination-next-page',
  rowsPerPageDropdown: "select[aria-label='Rows per page:']",

  // ── Sidebar ────────────────────────────────────────────────────────
  sidebar: '.sidebar',
  sidebarItem: "div[class*='sidebar__menu-item']",

  // ── Filters ────────────────────────────────────────────────────────
  filterOption: "div[class*='filter__option']",
  filterOptionWithRole: '.filter__option, [role="option"]',
  filterControl: '.filter__control',
  filtersButton: "button[class*='filterButton'], button:has-text('Filters')",
  filterMenuPortal: '.filter__menu-portal',
  filterPlaceholder: "div[class*='filter__placeholder']",
  filterSingleValue: "div[class*='filter__single-value']",
  filterClearIndicator: '.filter__clear-indicator',
  filterMultiValueLabel: "div[class*='filter__multi-value__label']",

  // ── Modal ──────────────────────────────────────────────────────────
  modalContent: '.modal-content',
  modalHeader: '.modal-header',
  modalBody: '.modal-body',
  modalFooter: '.modal-footer',
  modalClose: '.modal-header .close, [data-dismiss="modal"]',
  modalShow: '.modal.show, .modal.fade.show',
  modalBackdrop: '.modal-backdrop',

  // ── Buttons ────────────────────────────────────────────────────────
  submitButton: '.submit-button',
  buttonPrimary: '.btn-primary',
  buttonRounded: '.btn-rounded',
  saveButton: "button:has-text('SAVE'), button >> span:has-text('SAVE')",
  cancelButton: "button >> span:has-text('CANCEL')",

  // ── Tables (rdt_Table - React Data Table) ──────────────────────────
  table: "[role='table']",
  tableHeader: "div[role='columnheader']",
  tableRow: '.rdt_TableRow',
  tableCell: "div[role='cell']",
  tableRowById: (index: number) => `#row-${index}`,

  // ── Login ──────────────────────────────────────────────────────────
  loginEmail: "input[type='email'], input[id*='email'], input[name*='email'], input[placeholder*='email' i]",
  loginPassword: "input[type='password'], input[id*='password'], input[name*='password']",
  loginButton: "button:has-text('Login'), button:has-text('Log in'), button:has-text('Sign in'), button:has-text('LOG IN')",

  // ── Search ─────────────────────────────────────────────────────────
  searchInput: '#search-input',
  searchInputLegacy: "input[name='search']",
  searchTypeDropdown: '#search-type-dropdown',
  searchButton: "button[name='searchButton']",

  // ── Customer Summary ───────────────────────────────────────────────
  customerSummary: '#customer-summary',
  customerStatusValue: "xpath=//div[@id='customer-summary']//*[contains(text(),'Status')]/following-sibling::div",
  accountNumberLink: "xpath=//div[@id='customer-summary']//*[contains(normalize-space(.),'Account Number')]/following-sibling::a | //div[@id='customer-summary']//*[contains(normalize-space(.),'Account Number')]/following-sibling::*//a",

  // ── Payment ────────────────────────────────────────────────────────
  makePayment: '#makePayment',
  paymentTypeDropdown: "xpath=//label[@for='paymentType']/../div",
  totalPaymentAmountInput: '#totalPaymentAmount',
  allocationStrategyDropdown: "xpath=//label[@for='allocationStrategy']/../div",

  // ── Credit Card fields ─────────────────────────────────────────────
  ccNumber: "input[id='ccNumber'], input[name='ccNumber'], input[placeholder*='Card Number'], input[aria-label*='Card Number']",
  ccFirstName: '#ccFirstName',
  ccLastName: '#ccLastName',
  ccValue: '#ccValue',
  ccCvc: '#cvc',
  ccExpMonthInput: '#ccExpMonth input',
  ccExpYearInput: '#ccExpYear input',
  // One-time card form fields (payment arrangement modal — shown after "Use one-time card information" radio)
  otCardFirstName: "input[placeholder='First Name']",
  otCardLastName: "input[placeholder='Last Name']",
  otCardExpiresOn: "input[placeholder='Expires On']",
  otCardSecurityCode: "input[placeholder='Card Security Code']",

  // ── Bank / ACH fields ──────────────────────────────────────────────
  bankRoutingNumber: '#bankRoutingNumber',
  bankAccountNumber: '#bankAccountNumber',
  achReEnterAccountNumber: '#achReEnterAccountNumber',
  bankAccountCustomerFirst: '#bankAccountCustomerFirstName',
  bankAccountCustomerLast: '#bankAccountCustomerLastName',
  bankAccountTypeInput: '#bankAccountType input',

  // ── Form fields ────────────────────────────────────────────────────
  isEverythingAgreed: '#isEverythingAgreed',
  isInfoConfirmed: '#isInfoConfirmed',
  isConfirmedForSettlement: '#isConfirmedForSettlement',
  inlineError: 'div.inline-error',
  commentInput: '#comment',
  amountInput: '#amount',
  approvalAmountInput: '#approvalAmount',
  checkboxInput: 'input[type="checkbox"]',

  // ── PandaDocs (E-Sign) ─────────────────────────────────────────────
  pandaDocsIframe: "xpath=//iframe[contains(@src,'https://app.pandadoc.com/document/')]",
  pandaDocsStartSigning: "xpath=//button[text()='Start signing']",
  pandaDocsClosePopup: "xpath=//button[contains(@class,'cm-dialog__close')]",
  pandaDocsInitials: "xpath=//div[text()='Initials']",
  pandaDocsAcceptAndSign: "xpath=//button[text()='Accept and sign']",
  pandaDocsNext: "xpath=//button[text()='Next']",
  pandaDocsSignature: "xpath=//div[text()='Signature']",
  pandaDocsFinish: "xpath=//button[text()='Finish']",
  pandaDocsAllSet: "xpath=//*[text()='All set! Document is complete']",

  // ── Signwell (E-Sign) ─────────────────────────────────────────────
  signwellIframe: '#SignWell-Embedded-Iframe',
  signwellStart: 'a.start, a:has-text("Click to Start")',
  signwellCallout: '.callout',
  signwellSignatureCallout: '.callout.signature-callout, .callout[data-field-type="signature"]',
  signwellInitialsCallout: '.callout.initials-callout, .callout[data-field-type="initials"]',
  signwellSignatureType: '.signature__type',
  signwellInitialsType: '.initials__type, .signature__type',
  signwellSignatureActions: '.signature-actions',
  signwellNextField: "xpath=//a[contains(text(),'Next Field') or contains(text(),'NEXT FIELD')]",
  signwellAvatarWrapper: '.avatar-wrapper',
  signwellFinish: 'a.finish',
  signwellContinueModal: 'button:has-text("Continue"), a:has-text("Continue")',
  signwellSignAllLink: 'a:has-text("Save & Apply Everywhere"), a:has-text("Sign All")',
  signwellDocCompleteHeading: 'h1:has-text("Thanks for filling out your document")',
  signwellModalCloseLink: '.modal a[href="#"]',

  // ── Origination - Funding ──────────────────────────────────────────
  fundingQueue: '#funding',
  fundingDropdownSvg: "xpath=//label[@for='funding']/following-sibling::div//div[contains(@class, 'filter__dropdown-indicator')]",
  statusDropdownSvg: "xpath=//label[@for='statuses']/following-sibling::div//div[contains(@class, 'filter__dropdown-indicator')]",
  funded: '#FUNDED',

  // ── Servicing - Payment Transaction ────────────────────────────────
  paymentTable: ".rdt_Table[role='table']",
  paymentTableRows: "xpath=//div[@role='rowgroup']//div[@role='row'][position() > 1]",
  svgReverseIcon: '.fa-undo',
  pencilIcon: "xpath=//*[@data-icon='pen-to-square']",

  // ── Add Card ───────────────────────────────────────────────────────
  addCardButton: "button:has-text('Add Card')",
  saveCardButton: "xpath=//div[contains(@class, 'd-flex justify-content-end')]/button[last()]",

  // ── Top bar ────────────────────────────────────────────────────────
  topBar: '.top-bar, .navbar, .account-header',

  // ── Menus ──────────────────────────────────────────────────────────
  menuOverview: '#overview',

  // ── Contract Page ─────────────────────────────────────────────────
  contractViewDocumentLink: "[class*='appComplete_appComplete__link']",
  contractCheckbox: 'input[type="checkbox"]',

  // ── Payment Program (completeApplication redesign — Task #1233) ──
  paymentProgramContainer: "[class*='paymentProgramModal__paymentProgramContainer']",
  paymentProgramLogo: '#payment-program-image',
  paymentProgramTitle: "[class*='paymentProgram__title']:not([class*='titleWrapper'])",
  paymentProgramSubtitle: "[class*='paymentProgram__subtitle']",
  paymentCard: "[class*='paymentCard']:has([class*='paymentCard__button'])",
  paymentCardTitle: "[class*='paymentCard__title']",
  paymentCardDescription: "[class*='paymentCard__description']",
  paymentCardPrice: "[class*='paymentCard__price']:not([class*='Container']):not([class*='Label'])",
  paymentCardPriceLabel: "[class*='paymentCard__priceLabel']",
  paymentCardDetailRow: "[class*='paymentCard__detailRow']",
  paymentCardButton: "[class*='paymentCard__button']",
  termSelectionTab: "[class*='termSelection__tab']",
  termSelectionTabSelected: "[class*='termSelection__tabSelected']",
  paymentProgramFooterText: "[class*='paymentProgram__footerText']",
  paymentProgramFooterPhone: "[class*='paymentProgram__footerPhone']",

  // ── Completion Screen (Confetes/New Design) ──────────────────────
  completionCheckIcon: "[class*='checkIcon']",
  completionMainMessage: "[class*='mainMessage']",
  completionPhoneNumber: "[class*='phoneNumber']",
  completionFooterText: "[class*='footerText']",
  completionContent: "[class*='content']",

  // ── PayTomorrow Portal ────────────────────────────────────────────
  ptKeycloakUsername: '#username',
  ptKeycloakPassword: '#password',
  ptKeycloakLoginButton: '#kc-login',
  ptChatWidget: '#fc_frame, iframe[id*="chat"], div[class*="freshchat"]',
  ptConfirmYesButton: "button:has-text('Yes')",
  ptSendCartButton: "button:has-text('Send Cart')",
  ptSpinnerBackdrop: '#spinner.backdrop, .backdrop',
  ptEyeIcon: '.pi-eye, i.pi-eye',
  ptRefundApplicationModal: "span:has-text('Refund Application')",
  ptProceedToSignature: 'button:has-text("PROCEED TO SIGNATURE")',
  ptInProgressRow: "tr:has-text('IN-PROGRESS')",
  ptDetailsLink: 'a[href*="details"]',
  ptPrimeDropdownItem: '.p-dropdown-item, li[role="option"]',
  ptCcExpDateCombined: "xpath=//div[text()='Expiration Date']/../*//input",
  ptPhone: "#phone, input[name='phone'], input[placeholder*='Phone']",
  ptFirstName: "#firstName1, input[name='firstName'], input[placeholder*='First Name']",
  ptLastName: "#lastName1, input[name='lastName'], input[placeholder*='Last Name']",
  ptEmail: "#emailAddress, input[name='email'], input[type='email'], input[placeholder*='Email']",
  ptCustomerNotPresentBtn: "button:has-text('No')",
  ptInitiatePreApprovalBtn: "button:has-text('Initiate Pre Approval'), button:has-text('INITIATE PRE APPROVAL')",
  ptOrderId: "#orderId, input[name='orderId']",
  ptItemDescription: "#itemDescription, #item-description, input[name='itemDescription'], input[name='item-description'], input[name='description']",
  ptQuantity: "#quantity, input[name='quantity']",
  ptPrice: "#price, input[name='price']",
  ptTaxRate: "#taxRate, input[name='taxRate'], input[placeholder*='Tax']",
  ptShipping: "#shipping, input[name='shipping'], input[placeholder*='Shipping']",
  ptDiscount: "#discount, input[name='discount'], input[placeholder*='Discount']",
  ptAddButton: "button:has-text('Add'), button:has-text('ADD')",
  ptSendToCustomerButton: "button:has-text('Send to customer to complete electronically'), button:has-text('Send to Customer')",
  ptRefundButton: "button[label='Refund'], button:has-text('Refund')",
  ptRefundReason: "textarea[name='refundReason']",
  ptRefundCheckbox: "input#agreedToRefund",
  ptRefundConfirm: "xpath=//span[contains(text(), 'Refund $')]",
  ptViewRefund: "button:has-text('View'), a:has-text('View')",
  ptOtpInput: "input[autocomplete='one-time-code'], input[name='otp'], input[placeholder*='code']",
  ptSsnInput: "input[name='ssn'], input[maxlength='9'], input[placeholder*='SSN'], input[placeholder*='Social Security']",
  ptDobMonth: "select[name='dobMonth'], input[name='dobMonth']",
  ptDobDay: "select[name='dobDay'], input[name='dobDay']",
  ptDobYear: "select[name='dobYear'], input[name='dobYear']",
  ptPayCycle: "select[name='payCycle'], input[name='payCycle']",
  ptPayMonth: "select[name='payMonth'], input[name='payMonth']",
  ptPayDay: "select[name='payDay'], input[name='payDay']",
  ptMonthlyIncome: "input[name='monthlyIncome'], input[placeholder*='Income']",
  ptEmployerName: "input[name='employerName'], input[placeholder*='Employer']",
  ptAgreeTerms: "input[name='agreeTerms'], input[type='checkbox']",
  ptSubmitButton: "button[type='submit'], button:has-text('Submit'), button:has-text('Continue')",
  ptEmploymentSubmit: "button[type='submit'], button:has-text('Submit'), button:has-text('Continue')",
  ptSelectOffer: "button:has-text('Select'), a:has-text('Select')",
  ptContractIframe: "iframe[src*='uownleasing.com'], iframe[src*='completeApplication'], iframe.col-12.p-0",
  ptContractScrollBox: ".contract-box, .agreement-box, div[style*='border'][style*='scroll'], div[style*='overflow'][style*='auto']",
  ptCardholderFirstName: "input[name='cardFirstName'], input[name='firstName'], input[placeholder*='First Name'], input[placeholder*='Cardholder']",
  ptCardholderLastName: "input[name='cardLastName'], input[name='lastName'], input[placeholder*='Last Name']",
  ptCardNumber: "input[name='cardNumber'], input[name='ccNumber'], input[placeholder*='Card Number'], input[placeholder*='card number'], input[type='tel'][maxlength='16']",
  ptCardExpMonth: "select[name='expMonth'], input[name='expMonth'], select[name='cardExpMonth']",
  ptCardExpYear: "select[name='expYear'], input[name='expYear'], select[name='cardExpYear']",
  ptCardCvv: "input[name='cvv'], input[name='cvc'], input[name='securityCode'], input[placeholder*='CVV'], input[placeholder*='CVC'], input[maxlength='4'][type='tel']",
  ptContractAgreeCheckbox: "input[type='checkbox'][name*='agree'], input[type='checkbox'][name*='terms'], input[type='checkbox']",
  ptContractSubmitBtn: "button:has-text('Complete'), button:has-text('Sign'), button:has-text('Submit'), button[type='submit']",
  ptStreet: "#street, input[name='street'], input[name='address'], input[placeholder*='Street']",
  ptCity: "#city, input[name='city'], input[placeholder*='City']",
  ptZip: "#zip, input[name='zip'], input[name='zipCode'], input[placeholder*='Zip']",
  ptStateDropdown: "#state, div[class*='dropdown'] label, select[name='state']",
  ptStateDropdownItem: "div[role='option'], li[role='option']",
  ptConfirmDialog: "button:has-text('OK'), button:has-text('Confirm'), button:has-text('Accept')",
  ptButtonPrimary: "button.btn-primary, button[class*='primary'], a.btn-primary",

  // ── PayPair Portal (dw93bg.paypair.com) ──────────────────────────
  ppMerchantDropdown: '#merchant',
  ppInitPaypairButton: "button:has-text('Init Paypair'), #initPaypair",
  ppPersonalInfoTextarea: "xpath=//h2[text()='Personal Info']/following-sibling::textarea[1]",
  ppCartTextarea: "textarea#cart, textarea[name='cart']",
  ppProviderName: "xpath=//div[contains(text(),'Provider')]/following-sibling::input[1]",
  ppPreQualification: "xpath=//div[contains(text(),'Prequalification')]/following-sibling::input[1]",
  ppProductSelectionType: "xpath=//div[contains(text(),'Product Selection Type')]/following-sibling::input[1]",
  ppGetLeaseButton: "button:has-text('Get lease')",
  ppLlappIframe: 'iframe#llapp-iframe',
  ppPhoneInput: "input[placeholder*='456-7890'], input[name='phone'], input[type='tel']",
  ppPasscodeInput: "input[name='passcode']",
  ppContinueButton: "button[type='submit'], button:has-text('Continue')",
  ppDobMonthSelect: '#react-select-2-input',
  ppDobDaySelect: '#react-select-3-input',
  ppDobYearInput: "input[name='year']",
  ppSsnInput: "input[name='ssn']",
  ppIncomeInput: "input[name='income']",
  ppPaymentFrequencySelect: '#react-select-4-input',
  ppAgreementCheckbox: "input[name='isAgreementChecked']",
  ppSeeMyPurchaseOptionsButton: "xpath=//button[contains(@class, 'step2__submit-btn') and text()='See My Purchase Options']",
  ppDateFieldInput: "input.date-field-input[placeholder='MM/DD/YYYY']",
  ppDatepickerPrevMonth: "xpath=//button[contains(@class, 'react-datepicker__navigation--previous')]",
  ppLoaderContainer: "xpath=//div[contains(@class, 'loader-container')]",
  ppViewPlanDetails: "xpath=//button[contains(.,'View Plan Details')] | //a[contains(.,'View Plan Details')]",
  ppContinueWithUown: "xpath=//button[contains(.,'Continue with Uown')] | //a[contains(.,'Continue with Uown')]",
  ppOfferApprovalAmount: "xpath=//div[contains(@class,'offer-item') and .//span[contains(.,'Approval Amount')]]//span[contains(@class,'font-bold') and contains(@class,'text-right')]",
  ppOfferCartTotal: "xpath=//div[contains(@class,'offer-item') and .//span[contains(.,'Cart Total')]]//span[contains(@class,'font-bold') and contains(@class,'text-right')]",
  ppOfferRecurringPayment: "xpath=//div[contains(@class,'offer-item') and .//span[contains(.,'Recurring Payment')]]//span[contains(@class,'font-bold') and contains(@class,'text-right')]",
  ppContinueToLastStep: "xpath=//button[contains(@class,'step5__submit-btn') and normalize-space(text())='CONTINUE TO LAST STEP']",
  ppPtIframe: '#pt-iframe',

  // ── Modify Lease ─────────────────────────────────────────────────
  modifyLeaseButton: "button:has-text('Modify Lease'), button >> span:has-text('Modify Lease')",
  modifyLeaseWarningContinue: ".modal.show button:has-text('Continue')",
  modifyLeaseWarningCancel: ".modal.show button:has-text('Cancel')",
  modifyLeaseSaveButton: ".modal.show button:has-text('SAVE'), .modal.show button:has-text('Save')",
  activityLogCard: "xpath=//div[contains(@class,'card')]//div[contains(text(),'Activity') or contains(text(),'activity')]/..",
  activityLogEntry: "xpath=//div[contains(@class,'card')]//div[contains(text(),'Activity') or contains(text(),'activity')]/../..//div[contains(@class,'card-body')]//div[@role='row'] | //div[contains(@class,'card')]//div[contains(text(),'Activity')]/../..//tr",

  // ── Cancellation ─────────────────────────────────────────────────
  cancelLeaseButton: "button:has-text('Cancel Lease'), button >> span:has-text('Cancel Lease')",
  cancelLeaseCommentInput: ".modal.show #comment, .modal.show textarea[name='comment'], #cancelComment",
  cancelLeaseRefundCheckbox: ".modal.show #refundAllPayments, .modal.show input[name='refundAllPayments'], .modal.show input[type='checkbox'][name*='refund']",
  cancelLeaseConfirmButton: ".modal.show .btn-danger:has-text('Cancel'), .modal.show .btn-primary:last-child",
  invoiceItemDeleteButton: "#deleteActionIcon, .fa-trash-can, .fa-trash, button[title='Delete'], button:has-text('Delete'), svg[data-icon='trash-can'], svg[data-icon='trash']",
  merchantOfferInsuranceCheckbox: "#checkbox-offerInsurance, #offerInsurance, input[name='offerInsurance']",

  // ── Insurance / Protection Plan ────────────────────────────────────
  purchaseInsuranceSubmitBtn: '#purchase-insurance-submit-btn',
  seeProtectionBenefitsBtn: 'button:has-text("See Protection Benefits")',
  buddyOfferContainer: '[class*="buddyOfferContainer"]',
  insuranceOptInCheckbox: 'text=I agree to the Uown Protection Plus',
  insuranceOptOutCheckbox: 'text=No, continue unprotected',

  // ── Website Portal ──────────────────────────────────────────────────
  wsAccountSummary: '.account-summary, [data-section="account-summary"]',
  wsPaymentSection: '.payment-section, [data-section="payments"]',
  wsContactSection: '.contact-section, [data-section="contact"]',

  wsEmailInput: "input[type='email'], input[name='email'], input[placeholder*='email' i]",
  wsVerificationCodeInput: "input[name='code'], input[placeholder*='code' i], input[type='tel']",
  wsSubmitButton: "button[type='submit'], button:has-text('Submit'), button:has-text('Continue'), button:has-text('Verify')",
  wsResendCodeButton: "button:has-text('Resend'), a:has-text('Resend'), :text-is(\"Didn't get a code?\"), :has-text('Resend code')",

  wsMakePaymentButton: 'button:has-text("Make a Payment"), button:has-text("Pay Now")',
  wsAccountNumber: '[data-field="accountNumber"], .account-number',
  wsBalanceAmount: '[data-field="balance"], .balance-amount',
  wsNextPaymentDate: '[data-field="nextPaymentDate"], .next-payment',

  wsPaymentMethodsLink: 'a:has-text("Payment Methods"), [href*="payment-method"]',
  wsUpdateContactLink: 'a:has-text("Update Contact"), a:has-text("Contact Info"), [href*="contact"]',
  wsAccountSummaryLink: 'a:has-text("Account Summary"), a:has-text("Summary"), [href*="summary"]',

  wsPrimaryEmailField: '#primaryEmail, input[name="primaryEmail"], input[type="email"]',

  // Phone update — Update Contact Info page
  wsPhoneAreaCodeInput: '#areaCode, input[name="areaCode"], input[placeholder*="Area" i]',
  wsPhoneNumberInput: '#phoneNumber, input[name="phoneNumber"], input[placeholder*="Phone" i]',
  wsSaveChangesButton: 'button:has-text("Save Changes"), button[type="submit"]:has-text("Save")',
  wsSuccessMessage: '.alert-success, .success-message, [class*="success"]:has-text("saved"), [class*="success"]:has-text("updated"), .toast-success',
  wsErrorMessage: '.alert-danger, .error-message, [class*="error"], .modal-body:has-text("could not find")',
  wsUpdatePhoneSection: 'form[data-section="phone"], .phone-section, [class*="phone"]',

  wsOtherAmountRadio: '#other',
  wsPaymentAmountField: '#other, input[name="paymentAmount"], input[type="number"]',
  wsAchCheckbox: "#row-0 input[type='checkbox'], div[id='cell-1-undefined'] input[type='checkbox']",
  wsPaymentSubmitButton: "button[class*='payment_submitBtn'], button:has-text('MAKE A PAYMENT')",

  wsAccountsDropdown: "[class*='overview_accountsDropDown'], [class*='accountsDropDown']",

  wsLogoutButton: 'button:has-text("Logout"), a:has-text("Logout"), .logout-button',

  wsPaymentsLink: 'a:has-text("Payment"), [href*="payment"]',
  wsDocumentsLink: 'a:has-text("Documents"), [href*="document"]',
  wsContactLink: 'a:has-text("Contact"), [href*="contact"]',
  // ── New Application / Application Wizard ─────────────────────────────
  // Origination portal "New Application" form
  naNewApplicationLink: '#newApplication, a[href*="newApplication"], a[href*="new-application"]',
  naSubmitNewApplicationBtn: '.btn-secondary',
  naEmailAddress: "input[name='custEmailAddress']",
  naPhone: "input[name='phone']",
  naMerchantDropdown: '.form-control',
  naLocationDropdown: '.form-control',

  // Consumer-facing application wizard — Page 1 (Personal Info)
  naMainFirstName: '#mainFirstName',
  naMainLastName: '#mainLastName',
  naMainSsn: '#mainSsn',
  naMainDob: '#mainDob',
  naMainCellPhone: '#mainCellPhone',
  naMainEmailAddress: '#emailAddress',
  naMainAddress1: '#mainAddress1',
  naMainPostalCode: '#mainPostalCode',
  naMainCity: '#mainCity',

  // Consumer-facing application wizard — Page 2 (Employment)
  naMainEmployerName: '#mainEmployerName',
  naMainPayFrequencyDropdown: "xpath=//label[contains(text(),'Pay Frequency')]/..//div[contains(@class,'react-select') or contains(@class,'dropdown')]",
  naMainLastPayDate: '#mainLastPayDate',
  naMainNextPayDate: '#mainNextPayDate',
  naMainMonthlyIncome: '#mainMonthlyIncome',
  naEmploymentDurationDropdown: "xpath=//label[contains(text(),'Employment Duration') or contains(text(),'How long')]/..//div[contains(@class,'react-select') or contains(@class,'dropdown')]",

  // Consumer-facing application wizard — Page 3 (Consent)
  naIsAgreedToStatements: '#isAgreedToStatements',
  naIsAgreedToPrivacy: '#isAgreedToPrivacy',
  naBankruptcyDropdown: "xpath=//label[contains(text(),'Bankruptcy') or contains(text(),'bankruptcy')]/..//div[contains(@class,'react-select') or contains(@class,'dropdown')]",

  // Invoice / Lease creation on customer page
  naLeaseAddNew: "xpath=//div[text()='Lease']/../div[text()='Add New'] | button:has-text('Add New')",
  naNumberOfItems: '#numberOfItems',
  naItemCode: '#itemCode',
  naItemDescription: '#itemDescription',
  naBasePricePerItem: '#basePricePerItem',
  naDeliveryFee: '#deliveryFee',
  naInstallationFee: '#installationFee',
  naMiscFee: '#miscFee',
  naSubmitItemLease: "button[type='submit']:has-text('Submit'), button.btn-secondary:has-text('Submit'), button:has-text('Add Item')",
  naSalesPerson: '#salesPerson',
  naInvoiceNumber: '#invoiceNumber',

  // ── Payment Arrangement ─────────────────────────────────────────────
  paymentArrangementCheckbox: '#paymentArrangement',
  arrangementStartDateInput: '#startDate',
  arrangementEndDateInput: '#endDate',
  arrangementPaymentFrequencyDropdown: "xpath=//label[@for='paymentFrequency']/../div",
  arrangementInstallmentAmountInput: (index: number) => `[id="paymentInfo[${index}].paymentAmount"]`,
  arrangementInstallmentDateInput: (index: number) => `[id="paymentInfo[${index}].paymentDate"]`,

  // ── Servicing Information Edit ─────────────────────────────────────
  svInfoEditButton: '#ServicingInformation-edit',
  svInfoPayFrequencyDropdown: '#payFrequency',
  svInfoSaveButton: "button[class*='collapsableEdit__button__primary']",
  svInfoFirstDueDateInput: '#firstDueDate, input[name="firstDueDate"]',
  svInfoSecondDueDateInput: '#secondDueDate, input[name="secondDueDate"]',

  // ── Search Results ──────────────────────────────────────────────────
  searchResultAccountLink: "a[href*='/customer-information/']",

  // ── Move Due Date (Servicing — Scheduled Payments modal) ───────────
  moveDueDateButton: "button:has-text('Move Due Date')",
  moveDueDateScheduledSelect: "#moveFromDueDate",
  moveDueDateNewDateInput: "input[name='numOfDaysToBeMoved']",

  // ── Origination - Leads Table Filters ──────────────────────────────
  leadsFromDateInput: "input[placeholder='MM/DD/YYYY']:first-of-type, input[name='from']",
  leadsToDateInput: "input[placeholder='MM/DD/YYYY']:last-of-type, input[name='to']",
  leadsLeadPkInput: "input[placeholder*='LeadPk'], input[placeholder*='Lead PK'], input[placeholder*='leadPk']",
  leadsEmailInput: "input[placeholder*='email' i]",
  leadsSsnInput: "input[placeholder*='ssn' i]",
  leadsAccountPkInput: "input[placeholder*='AccountPK'], input[placeholder*='Account PK']",
  leadsPhoneInput: "input[placeholder*='Phone']",
  leadsCustomerNameInput: "input[placeholder*='Customer Name']",
  leadsStateDropdown: "input[placeholder*='state' i]",
  leadsLeadStatusDropdown: "input[placeholder*='status' i], input[placeholder*='Lead Status' i]",
  leadsInvoiceNumberInput: "input[placeholder='Search by Invoice Number']",

  // ── Error Log (Origination — /errorLog) ────────────────────────────
  elTabSendApplication: "[eventkey='sendApplication'], button[data-rr-ui-event-key='sendApplication']",
  elTabSubmitApplication: "[eventkey='submitApplication'], button[data-rr-ui-event-key='submitApplication']",
  elFilterFromDate: "input[name='from']",
  elFilterToDate: "input[name='to']",
  elFilterSearch: "input[name='search']",
  elFilterSubmitButton: "button[type='submit'], button:has-text('Search'), button:has-text('Filter')",

  // ── Merchant Settings (Origination — /merchantSetting) ─────────────
  msDealerDiscountInput: "input[name='dealerDiscountOverride']",
  msDealerRebateTypeSelect: "select[name='dealerRebateType']",
  msDealerRebateOverrideInput: "input[name='dealerRebateOverride']",
  msMerchantTableCheckbox: "input[type='checkbox']",
  msSubmitButton: "button[type='submit']:has-text('Submit'), button:has-text('SUBMIT'), button:has-text('SAVE')",
  msBulkConfirmButton: ".modal.show button:has-text('Confirm'), .modal.show button:has-text('Yes')",
  msPeakCampaignIdInput: "input[name='peakCampaignId']",
  msOffPeakCampaignIdInput: "input[name='offPeakCampaignId']",
  msPeakCampaignIdLabel: "label[for='peakCampaignId']",
  msOffPeakCampaignIdLabel: "label[for='offPeakCampaignId']",
  msUwPipelineInput: "input[name='uwPipeline']",
  msFraudThresholdInput: "input[name='fraudThreshold']",
  msMaxApprovalAmountInput: "input[name='maxApprovalAmount']",
  msGdsDataToggle: "button:has-text('GDS Data')",

  // ── Contract page — missing employment info (planId empty in /complete URL) ──
  /** "Next paycheck" date input shown when planId is missing in the /complete URL */
  completeNextPaycheckInput: 'input[type="search"]',
  /** React Select combobox for pay frequency ("How often do you get paid?") */
  completePayFrequencyCombobox: '[class*="react-select__control"]',
  /** Plan selection heading shown after employment info is submitted */
  completePlanSelectionHeading: 'h2, [class*="heading"]',
  /** "Choose Payment Program" button on the plan selection screen */
  completeChooseProgramBtn: 'button:has-text("Choose Payment Program")',

  // ── Task #442 — Send Invite / Podium (Servicing — Account Summary) ────────
  invitationIcon: '#invitation',

  // ── Sales Rep / Merchant Info panel (Origination Customer page) ───────────
  salesRepEditButton: '#MerchantInfo-edit',
  salesRepSaveButton: ".collapsableEdit__button__primary, button[class*='collapsableEdit__button__primary']",

  // ── Open to Buy (Origination) ──────────────────────────────────────────────
  openToBuyNavLink: "a[href*='openToBuy'], a:has-text('Open to Buy'), #openToBuy",
  openToBuyExportCsvButton: "button:has-text('Export'), button:has-text('CSV'), a:has-text('Export CSV')",

  // ── Task #505 — Opt Out AI (Servicing — Primary Contact / Mobile Phone) ──
  primaryContactEditButton: '#PrimaryContact-edit',
  primaryContactSaveButton: "button[class*='collapsableEdit__button__primary']",
  optOutAiCheckbox: '#optOutAiMobile, label:has-text("Opt Out AI") input[type="checkbox"], input[name="optOutAiMobile"]',
  doNotCallCheckbox: '#doNotCallMobile, label:has-text("Do Not Call") input[type="checkbox"], input[name="doNotCallMobile"]',
  primaryContactSection: '[data-section="primary-contact"], .primary-contact-panel, section:has-text("Primary Contact")',
  mobilePhoneSection: '[data-section="mobile-phone"], section:has-text("Mobile Phone")',
  // Reason modal that appears when toggling Opt Out AI checkbox
  optOutAiReasonModal: 'dialog, [role="dialog"]',
  optOutAiReasonTextbox: 'dialog textarea, [role="dialog"] textarea',
  optOutAiReasonSaveButton: 'dialog button:has-text("Save"), [role="dialog"] button:has-text("Save")',

  // ── AMS — Users list (/users) ─────────────────────────────────────
  // Table uses react-data-table-component (divs, NOT <table>)
  amsRdtTable: '.rdt_Table',
  amsRdtTableRow: '.rdt_TableRow',
  amsRdtTableBody: '.rdt_TableBody',
  amsRdtPagination: '.rdt_Pagination',
  amsPaginationNextButton: 'button[aria-label="Next Page"]',
  amsPaginationPrevButton: 'button[aria-label="Previous Page"]',
  amsUsersSearchInput: 'input[name="search"]',

  // ── AMS — User Details (/users/[username]) ────────────────────────
  // Edit triggers: pencil icon spans per card section
  amsEditProfileButton: 'span#EditUserProfile-edit',
  amsUserFirstNameInput: 'input[name="firstName"]',
  amsUserLastNameInput: 'input[name="lastName"]',
  amsUserEmailInput: 'input[name="email"]',
  amsUserPhoneInput: 'input[name="phoneNumber"]',
  amsSaveButton: 'button:has-text("SAVE")',
  amsCancelButton: 'button:has-text("CANCEL")',
  amsEditUserCard: '#employmentForm',

  // ── AMS — Associate Merchants (/associate-users-to-merchants) ─────
  amsAssocPageSubmit: 'button:has-text("Submit")',
  amsUsersSelectionInfo: '[class*="selectable-users-table_selectionInfo"]',
  amsMerchantsSelectionInfo: '[class*="selectable-merchants-table_selectionInfo"]',
  amsAssocUsersTableContainer: '.col-xl-6:first-child',
  amsAssocMerchantsTableContainer: '.col-xl-6:last-child',
  amsAssocSelectAllCheckbox: 'input[name="select-all-rows"]',
  amsAssocRowCheckbox: 'input[name="select-row-undefined"]',
  amsAssocMerchantsSearch: 'input[placeholder*="merchant" i]',

  // ── AMS — Toast (reuse global toastSuccess) ───────────────────────
  amsSuccessToast: '.Toastify__toast--success, .toast-success, .alert-success',
  amsAssocConfirmButton: '.modal-footer button:has-text("Confirm")',
  amsLogActivityRow: '.rdt_TableRow',
  amsLogActivityCell: '[class*="rdt_TableCell"]',

  // ── AMS — Edit User Merchants card (/users/[username]) ──────────────
  // Pencil button ID (button#EditUserMerchants-edit with SVG inside)
  amsEditUserMerchantsButton: '#EditUserMerchants-edit',
  amsUserMerchantsCardToggle: '.card:has(#EditUserMerchants-edit) #toggle-collapse',
  amsUserMerchantsCardCollapse: '.card:has(#EditUserMerchants-edit) .collapse',
  // Tags in read-only view: merchants-read_tag CSS module class
  amsUserMerchantsTag: '[class*="merchants-read_tag"]',
  // "Manage merchants" button (edit mode) — opens merchant management modal
  amsManageMerchantsButton: 'button:has-text("Manage merchants")',
  // "Delete All" button (edit mode) — removes all merchants
  amsDeleteAllMerchantsButton: 'button:has-text("Delete All")',
  // SAVE button scoped to merchants card edit mode
  amsUserMerchantsSaveButton: 'button:has-text("SAVE")',
  // CANCEL button in merchants card edit mode
  amsUserMerchantsCancelButton: 'button:has-text("CANCEL")',
  // React Select controls (inside merchant management modal)
  amsUserMerchantsSelectControl: '.filter__control',
  amsUserMerchantsSelectInput: '.filter__input',
  amsUserMerchantsSelectOption: '[class*="customOptionStyles"]',
  // Multi-value tags in React Select (modal)
  amsUserMerchantsMultiValue: '[class*="multiValue"]',
  amsUserMerchantsMultiValueRemove: '[class*="multiValue"] [role="button"], [class*="multiValue"] [class*="remove"]',
  // Clear all indicator in React Select
  amsUserMerchantsClearIndicator: '[class*="clearIndicator"], [class*="clear-indicator"]',
  // Search for Current Merchants input (read-only mode)
  amsUserMerchantsSearchbox: 'input[placeholder="Search for Current Merchants"]',
  // Origination tab in the merchants card
  amsUserMerchantsOriginationTab: '.nav-tabs .nav-link',

  // ── CC History / Edit Modal ────────────────────────────────────
  ccEditPencilIcon: 'svg[data-icon="pencil-alt"], svg[data-icon="pencil"], svg[data-icon="pen-to-square"]',
  ccEditModal: '#editPendingCCForm, .modal:has(#editPendingCCForm)',
  ccEditModalTitle: '.modal-title',
  ccEditPostingDate: '#editPendingCCForm input[name="postingDate"], #editPendingCCForm [name="postingDate"]',
  ccEditAmount: '#editPendingCCForm input[name="amount"], #editPendingCCForm [name="amount"]',
  ccEditComment: '#editPendingCCForm textarea[name="comment"], #editPendingCCForm [name="comment"]',
  ccEditSaveButton: '#editPendingCCForm button[type="submit"], .modal:has(#editPendingCCForm) button:has-text("SAVE")',
  ccEditCancelButton: '.modal:has(#editPendingCCForm) button:has-text("Close"), .modal:has(#editPendingCCForm) button:has-text("Cancel"):not(:has-text("CANCEL"))',
  ccEditRemoveButton: '.modal:has(#editPendingCCForm) .btn-danger, .modal:has(#editPendingCCForm) button:has-text("Cancel"):last-of-type',

  // ── CCBIN (Send Application) ─────────────────────────────────
  naCcBinField: '#mainCreditCardBin',
  naCcBinImage: 'img[src*="ccbin"]',
  naCcBinInstructionText: '.ccBinContainer span, [class*="ccBinContainer"] span',
} as const;

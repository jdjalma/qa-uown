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
  /** Resilient combobox locator — works whether the widget exposes `.filter__control` (qa2 react-select) or only the ARIA `combobox` role (stg / alternate themes). */
  filterControlResilient: '.filter__control, [role="combobox"]',
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
  // Rating Letter row on customer-information page.
  // Structure: <div class="information-card_row"><span class="information-card_label">Rating Letter</span><span class="information-card_value">...</span></div>
  ratingLetterValue: '[class*="information-card_row"]:has([class*="information-card_label"]:has-text("Rating Letter")) [class*="information-card_value"]',

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
  /** Make Payment modal — <select> listing existing bank accounts on file (servicing portal). Empty until an option is chosen, which is required for Submit to enable. */
  existingBankAccountSelect: 'select[name="bankAccountPk"]',

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

  // ── Signing provider — provider-agnostic detection surface ─────────
  // Used by `SigningPage` (cross-portal) to detect which e-sign provider
  // (GOWSIGN | SIGNWELL | PANDADOCS) rendered the iframe via URL inspection.
  // Detection strategy preference (most → least robust):
  //   1. iframe URL host match (*.gowsign.com / *.signwell.com / app.pandadoc.com)
  //   2. DOM markers (UOwn alternative-contract wrapper, SignWell-Embedded-Iframe id)
  signingAnyIframe: 'iframe',
  signingGowSignIframe: 'iframe.alternative-contract-vendor_iframe__nSb3A',
  signingGowSignIframeByUrl: 'iframe[src*="gowsign.com"]',
  signingSignWellIframeByUrl: 'iframe[src*="signwell.com"], iframe#SignWell-Embedded-Iframe',
  signingPandaDocsIframeByUrl: 'iframe[src*="pandadoc.com"]',

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

  // Single input that accepts email OR 10-digit phone (no mask). Real DOM:
  // <input type="text" id="phoneOrEmail" name="phoneOrEmail" placeholder="Mobile number OR email address">
  wsEmailInput: "#phoneOrEmail, input[name='phoneOrEmail'], input[type='email'], input[placeholder*='email' i]",
  wsEmailOrPhoneInput: "#phoneOrEmail, input[name='phoneOrEmail']",
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

  // ── Merchant Add/Edit (Origination — /merchant & /merchant/addMerchant) ──────
  // Task #1262 — Inventory Category mandatory
  merchantListAddButton: "a[href*='addMerchant'], button:has-text('Add'), button:has-text('Add Merchant')",
  // Clone is a bootstrap DropdownButton with title="Clone" — toggle opens the menu
  merchantCloneDropdownToggle: "button:has-text('Clone'), .dropdown-toggle:has-text('Clone')",
  // Search input inside the clone dropdown (InputField name="search")
  merchantCloneDropdownInput: ".dropdown-menu input[name='search'], .show input[name='search']",
  // Each clonable merchant appears as a DropdownItem inside the opened dropdown menu
  merchantCloneDropdownItem: ".dropdown-menu.show .dropdown-item, .show .dropdown-item",
  // Clone icon + tooltip shown in Merchant Information panel after a clone
  merchantClonedFromIcon: '#merchantClone',
  // Inventory Category — react-select creatable control rendered by InputField (label "Inventory Category")
  inventoryCategoryControl: "label:has-text('Inventory Category') ~ div .filter__control, div:has(> label:has-text('Inventory Category')) .filter__control",
  inventoryCategoryInput: "label:has-text('Inventory Category') ~ div input, div:has(> label:has-text('Inventory Category')) input",
  inventoryCategoryClearIndicator: "label:has-text('Inventory Category') ~ div .filter__clear-indicator, div:has(> label:has-text('Inventory Category')) .filter__clear-indicator",
  inventoryCategorySingleValue: "label:has-text('Inventory Category') ~ div [class*='filter__single-value'], div:has(> label:has-text('Inventory Category')) [class*='filter__single-value']",
  inventoryCategoryLabel: "label:has-text('Inventory Category')",
  inventoryCategoryErrorText: "div:has(> label:has-text('Inventory Category')) [class*='error'], div:has(> label:has-text('Inventory Category')) .text-danger, div:has(> label:has-text('Inventory Category')) + div:has-text('Required')",
  // Merchant identity fields on the add/edit form
  merchantRefCodeInput: "input[name='merchantCode'], input[name='refMerchantCode']",
  merchantNameInput: "input[name='merchantName']",
  merchantLegalNameInput: "input[name='legalName']",
  merchantLocationNameInput: "input[name='locationName']",

  // ── Program Groups (Origination — /programGroups — Task #1260) ────────────
  pgGroupCountCell: "div[role='cell']:nth-child(2) span",
  pgGroupInfoIcon: "div[role='cell'] svg[data-icon='circle-info'], div[role='cell'] svg.fa-circle-info",
  pgGroupEditIcon: "div[role='cell'] svg[data-icon='pen-to-square'], div[role='cell'] svg.fa-pen-to-square, div[role='cell'] svg[data-icon='pencil']",
  pgProgramLink: 'a[href*="/programs/"]',

  // ── Programs List (Origination — /programs — Schedule Activation/Deactivation Dates) ──
  plSectionHeader: '[class*="index-module_sectionHeader"]:has-text("PROGRAMS")',
  plAddNewProgramBtn: 'button:has-text("ADD NEW PROGRAM")',
  plSearchInput: "input#search, input[name='search'][placeholder='Search table']",
  plGroupFilterDropdown: "#groupName, label:has-text('Program Groups') ~ div .filter__control",
  plSearchButton: "button[type='submit']:has-text('Search'), button:has-text('Search')",
  plTableRow: '.rdt_TableRow',
  // react-data-table-component renders program name as a <div> with cursor-pointer utility classes
  // (utils_dataTableColumn__cursorPointer_*, utils_dataTableColumn__blueFile_*). The `data-tag="allowRowEvents"`
  // on parent cells is unreliable for click handling — target the styled div directly.
  plProgramNameLink: ".rdt_TableRow [role='cell']:first-child [class*='cursorPointer'], .rdt_TableRow [role='cell']:first-child a, .rdt_TableRow [role='cell']:first-child span[class*='link']",
  plPaginationFooter: '.rdt_Pagination',

  // ── Program Details (Origination — right pane of /programs 2-pane layout) ──
  pdPanelHeader: '[class*="index-module_sectionHeader"]:has-text("PROGRAM DETAILS")',
  pdProgramNameInput: '#programName',
  pdTermMonthsInput: '#termMonths',
  pdActivationDateInput: '#activationDate',
  pdDeactivationDateInput: '#deactivationDate',
  pdMoneyFactorInput: '#moneyFactor',
  pdPayoffDiscountInput: '#payoffDiscount',
  pdEpoDaysInput: '#epoDays',
  pdEpoFeePercentInput: '#epoFeePercent',
  pdMinimumCartAmountInput: '#minimumCartAmount',
  pdMaxCartAmountInput: '#maxCartAmount',
  pdDealerDiscountOverrideInput: "input[name='dealerDiscountOverride']",
  pdProcessingFeeOverrideInput: "input[name='processingFeeOverride']",
  pdAmountChargedAtSigningInput: "input[name='amountChargedAtSigning']",
  pdAllowedFrequencyOverrideControl: "label:has-text('Allowed Frequency Override') ~ div .filter__control",
  pdLendingCategoryControl: "label:has-text('Lending Category') ~ div .filter__control, select[name='lendingCategory']",
  pdProgramGroupControl: "label:has-text('Program Group') ~ div .filter__control, select[name='programGroup']",
  pdStatesControl: "label:has-text('States') ~ div .filter__control",
  pdSaveButton: "button[form='addOrEditMerchantProgramForm']:has-text('SAVE'), button[type='submit']:has-text('SAVE')",
  pdCancelButton: "[class*='program-form_programForm__cancelButton'], button:has-text('CANCEL')",
  pdCloneDropdownToggle: "[class*='index-module_dropdownContainer__ddButton'], button:has-text('Clone'):not(:has-text('Group'))",
  pdCloneGroupButton: 'button:has-text("Clone Group")',
  pdInlineError: 'div.inline-error, [class*="error"]:has-text("Activation"), [class*="error"]:has-text("Deactivation")',
  pdNotesCard: '.card:has(.card-header:has-text("Notes")), .card:has([class*="card-header"]:has-text("Notes"))',
  pdNotesFiltersButton: '.card:has([class*="card-header"]:has-text("Notes")) button:has-text("Filters")',
  pdNotesSearchInput: '.card:has([class*="card-header"]:has-text("Notes")) input[name="search"], .card:has([class*="card-header"]:has-text("Notes")) input[placeholder*="Search" i]',
  pdNotesUserIdInput: '.card:has([class*="card-header"]:has-text("Notes")) input[name="userId"], .card:has([class*="card-header"]:has-text("Notes")) input[placeholder*="User" i]',
  pdNotesLogActivityControl: '.card:has([class*="card-header"]:has-text("Notes")) label:has-text("Log Activity") ~ div .filter__control',
  // Scope to table BODY only — excludes the header row (which is also .rdt_TableRow).
  // Multiple fallbacks for role-based + class-based matching against react-data-table-component.
  pdNotesRow: '.card:has([class*="card-header"]:has-text("Notes")) .rdt_TableBody .rdt_TableRow, .card:has([class*="card-header"]:has-text("Notes")) [role="rowgroup"]:last-of-type [role="row"]',
  pdNotesCell: "div[role='cell']",
  pdNotesExpandChevron: 'button[aria-label*="Expand" i], svg[data-icon="chevron-down"], svg[data-icon="chevron-right"]',

  // ── Merchant Programs Section (Origination — merchant detail page, read-only) ──
  mpsSection: "section:has(:text-is('Programs')), .card:has([class*='card-header']:has-text('Programs')), div:has(> :text-is('Programs')) + div",
  mpsProgramRow: '.rdt_TableRow',
  mpsProgramNameCell: "[role='cell']:first-child",
  mpsStatusBadge: "[class*='badge'], [class*='status'], [role='cell'] span:has-text('Active'), [role='cell'] span:has-text('Inactive')",
  mpsStatusTooltip: '[role="tooltip"], .tooltip, [class*="tooltip"]',
  mpsEditAction: "[role='cell'] svg[data-icon='pen-to-square'], [role='cell'] button:has-text('Edit'), [role='cell'] a:has-text('Edit')",

  // ── Bank Account Modal (Servicing — customer-information page) ────────────
  // Card-level anchors (read-only collapsed view)
  bankAccountCard: '.card:has(button:has-text("Add Account"))',
  addBankAccountButton: 'button:has-text("Add Account")',
  viewAllBankAccountsButton: 'button:has-text("View All")',
  // Read-only values on the collapsed card — resolved via label sibling combinators
  setDefaultPaymentValue: 'label:has-text("Set as default payment?") ~ div [class*="inputField__readOnly"], label:has-text("Set as default payment?") ~ div [class*="readOnly"]',
  accountNumberDisplayValue: 'label[for="accountNumber"] ~ div [class*="inputField__readOnly"], label:has-text("Account Number") ~ div [class*="readOnly"]',
  // "Add a Bank Account" modal
  addBankAccountModalTitle: 'div:has-text("Add a Bank Account")',
  addBankAccountForm: '#addBAForm',
  bankAccountTypeDropdown: '#bankAccountType',
  bankAccountRoutingNumberInput: '#routingNumber',
  bankAccountAccountNumberInput: '#accountNumber',
  setDefaultPaymentDropdown: '#autoPay',
  saveBankAccountButton: '#addBAForm button[class*="collapsableEdit__button__primary"], .modal.show button[class*="collapsableEdit__button__primary"]',
  cancelBankAccountButton: '#addBAForm button[class*="collapsableEdit__button__secondary"], .modal.show button[class*="collapsableEdit__button__secondary"]',
  addBankAccountModalClose: 'svg[data-icon="xmark-large"]',
  // "All Bank Accounts" modal (View All)
  allBankAccountsModalTitle: 'div:has-text("All Bank Accounts")',
  // Scoped to the "All Bank Accounts" modal — customer page has other rdt_Table instances
  // (e.g., Last 3 Payments). Strict-mode matching must resolve to a single element.
  bankAccountsTable: '.modal.show .rdt_Table',
  bankAccountsTableBody: '.modal.show .rdt_TableBody',
  bankAccountsTableRow: (index: number) => `#row-${index}`,
  bankAccountsRowCheckbox: 'input[name="select-row-undefined"]',
  bankAccountsSelectAllCheckbox: 'input[name="select-all-rows"]',
  bankAccountsDeleteButton: '.modal.show button:has-text("Delete")',

  // ── GowSign — Document Viewer (cross-portal / external embed) ─────────────
  // Reference: docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md § Apendice A
  // Selector strategy preference: ID > aria-label > custom non-Tailwind class > getByText
  // Header / Toolbar
  gsViewerRoot: '.gowsign-document',
  gsDocumentTitle: 'h1.overflow-hidden.overflow-ellipsis',
  gsStartSignatureButton: '#startSignatureButton',
  gsDownloadButton: 'button:has(svg.lucide-download)',
  gsCloseDocumentButton: 'button[aria-label="Close document"]',
  // Reading mode: Headless UI ID is dynamic, so anchor by aria-label/role (toggle is a switch)
  gsReadingModeToggle: '[role="switch"][aria-label*="Reading" i], [role="switch"][aria-labelledby]:near(:text("Reading mode"))',

  // Pre-signature metadata table
  gsSentByLabel: 'text=Document sent by',
  gsCreatedOnLabel: 'text=Created on',
  gsDocumentIdHeader: 'th:has-text("DOCUMENT ID"), :has(svg.lucide-file-digit)',
  gsDocumentIdValue: 'td:right-of(:text("DOCUMENT ID"))',
  gsRecipientHeader: 'th:has-text("Recipient")',
  gsRecipientNameCell: 'td:right-of(:text("Recipient"))',
  gsRecipientEmailCell: 'td span.text-blue-600:has(svg.lucide-mail)',
  gsStatusBadge: 'span.rounded-md.text-white',

  // Document content
  gsDocumentContainer: '.gowsign-document',
  gsPageNumber: '.styles_page-number__oHQFD',
  gsPageBreak: '.gowsign-page-break',

  // Property Price Tag
  gsPriceTagTable: 'table.price-tag',
  gsPriceTagTotalOfPayments: 'table.price-tag td:has(strong:has-text("TOTAL OF")) strong:has-text("$")',
  gsPriceTagCostOfLease: 'table.price-tag td:has(strong:has-text("COST OF LEASE")) strong:has-text("$")',
  gsPriceTagCashPrice: 'table.price-tag td:has(strong:has-text("CASH PRICE")) strong:has-text("$")',
  gsPriceTagAmountOfEachPayment: 'table.price-tag td:has(strong:has-text("AMOUNT OF EACH PAYMENT")) strong',
  gsPriceTagNumberOfPayments: 'table.price-tag td:has(strong:has-text("NUMBER OF")) strong',
  gsPriceTagRenewalPeriod: 'table.price-tag td:has(strong:has-text("RENEWAL PERIOD")) strong',

  // LESSOR / LESSEE
  gsLessorLesseeTable: 'table:has(td:has(strong:has-text("LESSOR:")))',
  gsLessorCell: 'table:has(td:has(strong:has-text("LESSOR:"))) td:has(strong:has-text("LESSOR:"))',
  gsLesseeCell: 'table:has(td:has(strong:has-text("LESSEE:"))) td:has(strong:has-text("LESSEE:"))',

  // Lease Items
  gsLeaseItemsTable: 'table#leaseItems:has(tbody tr td)',
  gsLeaseItemsRow: 'table#leaseItems:has(tbody tr td) tbody tr:has(td)',
  gsTotalDeliveryFee: 'p:has-text("Total Delivery Fee") u',

  // Initial Payment Breakdown
  gsInitialLeasePaymentRow: 'p:has-text("Initial Lease Payment") span[style*="float: right"]',
  gsProcessingFeeRow: 'p:has-text("Processing Fee") span[style*="float: right"]',
  gsTaxRow: 'p:has-text("Tax") span[style*="float: right"]',
  gsTotalInitialPaymentRow: 'p:has-text("Total Initial Payment") span[style*="float: right"]',

  // Dates / agreement metadata
  gsAgreementNumberValue: 'p:has-text("Agreement Number:") strong',
  gsAccountNumberValue: 'p:has-text("Account:") strong',
  gsContractDateValue: 'p:has(strong:has-text("Date:")) span[style*="float: right"]',
  gsInitialPaymentDueDateRow: 'p:has-text("initial Lease payment due on")',
  gsPromoExpirationRow: 'p:has-text("3-Month-Promotional-Payoff-Option"), p:has-text("expires on")',

  // EPO chart
  gsEpoChartTable: 'table:has(th:has-text("Payment Number")):has(th:has-text("EPO"))',
  gsEpoChartRows: 'table:has(th:has-text("Payment Number")):has(th:has-text("EPO")) tr:has(td)',
  gsEpoChartRowAt: (n: number) => `table:has(th:has-text("Payment Number")):has(th:has-text("EPO")) tr:nth-child(${n + 1})`,

  // ACH grid
  gsAchGridTable: 'table:has(th:has-text("Number of payments")):has(th:has-text("Total Cost"))',
  gsAchGridRows: 'table:has(th:has-text("Number of payments")):has(th:has-text("Total Cost")) tr:has(td)',

  // ── Servicing — Documents tab (/documents/{accountPk}) ─────────────
  // Source: servicing repo `components/document-information/index.tsx` and `pages/documents/[account].tsx`.
  // The page renders <PageName name="Documents" /> + <Input id="filterDocuments" /> + ADD NEW button + <DataTable ...>.
  // File Name column truncates to 31 chars on desktop with `...` and exposes the full title via the `title=""` attr.
  // The download cell is `<div className="mx-2 cursor-pointer" id="download">` containing a FontAwesome SVG whose
  // onClick calls `window.open(row.fileTempLink, '_blank')` — opens in a new tab; NOT a Download event.
  svcDocumentsPageTitle: 'h2:has-text("Documents"), h1:has-text("Documents"), [class*="page-name"]:has-text("Documents")',
  svcDocumentsSearchInput: '#filterDocuments',
  svcDocumentsAddNewButton: 'button[class*="documentsButton"], button:has-text("ADD NEW")',
  svcDocumentsTableRow: '.rdt_TableRow',
  svcDocumentsTableCell: "div[role='cell']",
  svcDocumentsEmptyState: 'text=There are no records to display',
  // IMPORTANT: ids are unique per row in the React source (id="download"/"edit"/"resend"), so duplicates exist
  // across rows in the DOM. Always scope these via the row Locator (e.g. row.locator(SELECTORS.svcDocumentsRowDownloadTrigger)),
  // never against the page root.
  svcDocumentsRowDownloadTrigger: '#download',
  svcDocumentsRowEditTrigger: '#edit',
  svcDocumentsRowResendTrigger: '#resend',
} as const;

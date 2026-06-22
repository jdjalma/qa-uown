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
  // Website portal full-screen modal overlay (lingers after async actions, intercepts clicks)
  loadingOverlay: 'div.position-fixed.background-gray',

  // ── Toast notifications ────────────────────────────────────────────
  toastBody: '.Toastify__toast-body',
  toastSuccess: '.Toastify__toast--success, .toast-success, .alert-success',
  toastError: '.Toastify__toast--error, .toast-error, .alert-danger',
  toastClose: '.Toastify__close-button',

  // ── Pagination ─────────────────────────────────────────────────────
  // react-data-table-component (rdt) standard footer button IDs.
  paginationNext: '#pagination-next-page',
  paginationPrevious: '#pagination-previous-page',
  rowsPerPageDropdown: "select[aria-label='Rows per page:']",

  // ── Sidebar ────────────────────────────────────────────────────────
  sidebarItem: "div[class*='sidebar__menu-item']",

  // ── Filters ────────────────────────────────────────────────────────
  // Option row inside a react-select menu. The legacy single-select uses
  // `.filter__option` (or `[role="option"]`). The new multi-select (Origination
  // R1.52.0 task #1292) wraps each option in `index-module_customOptionStyles__<hash>`
  // — match the prefix so we cover BOTH variants and don't need a separate selector.
  filterOption: "div[class*='filter__option'], div[class*='index-module_customOptionStyles__']",
  filterOptionWithRole: '.filter__option, [role="option"], div[class*="index-module_customOptionStyles__"]',
  filterControl: '.filter__control',
  /** Resilient combobox locator — works whether the widget exposes `.filter__control` (qa2 react-select) or only the ARIA `combobox` role (stg / alternate themes). */
  filterControlResilient: '.filter__control, [role="combobox"]',
  filtersButton: "button[class*='filterButton'], button:has-text('Filters')",
  // Overview dashboard metric cards. CSS module uses `summaryBox` as logical name;
  // anchor on the prefix since the hash suffix changes per build.
  dashboardCard: "[class*='summaryBox__']",
  // React-select renders the option menu either into a portal element
  // (`.filter__menu-portal` wraps a `.filter__menu`, used by legacy single-select
  // filters) OR inline as a bare `.filter__menu` (multi-select mode, Origination
  // R1.52.0 task #1292). Match BOTH so PO callers work across variants. The
  // `:visible` pseudo (Playwright) filters out the hidden portal sibling that
  // co-exists in DOM even when the inline `.filter__menu` is showing.
  filterMenuPortal: ':is(.filter__menu-portal, .filter__menu):visible',
  filterPlaceholder: "div[class*='filter__placeholder']",
  filterSingleValue: "div[class*='filter__single-value']",
  filterClearIndicator: '.filter__clear-indicator',
  filterMultiValueLabel: "div[class*='filter__multi-value__label']",
  // ── Modification Report filter panel (#1315 — CT-03/CT-04) ─────────
  // DOM-first (LIVE qa2 2026-06-18, jmendes.gow, 1440×900): the panel exposes
  // a free-text agent search and two date inputs as Formik-controlled inputs
  // with stable ids (`#agentName`, `#from`, `#to`). They are React-controlled,
  // so values MUST be set via the native-setter + `input` event path
  // (`forceReactInputValue`), NOT `fill()` alone. Dates use MM/DD/YYYY
  // (placeholder confirmed). The Modification Type single-select is the
  // `label:has-text('Modification Type') ~ div .filter__control` react-select
  // (options: LEAD_STATUS_CHANGE / APPROVAL_AMOUNT_CHANGE / LEASE_MOD).
  modReportAgentNameInput: "input#agentName[name='agentName']",
  modReportStartDateInput: "input#from[name='from']",
  modReportEndDateInput: "input#to[name='to']",
  // Task #1292 — multi-select Merchant/Location filter (Origination R1.52.0)
  // Bottom-of-page leads-style filter block (Filters toggle + Search button).
  // CSS-module hash suffix is unstable; anchor via the prefix attribute selector.
  // DO NOT use `overview_filterButton__` — that's the legacy KPI single-select on Overview top.
  multiSelectFilterButton: "button[class*='index-module_filterButton__']",
  // Multi-select react-select container — shows "N items selected" text in multi mode.
  multiSelectValueContainer: "[class*='filter__value-container--is-multi']",

  // ── Modal ──────────────────────────────────────────────────────────
  modalContent: '.modal-content',
  modalHeader: '.modal-header',
  modalBody: '.modal-body',
  modalClose: '.modal-header .close, [data-dismiss="modal"]',
  modalShow: '.modal.show, .modal.fade.show',
  modalBackdrop: '.modal-backdrop',

  // ── Status-change action modals (Origination customer page, #1315) ──
  // "Move Contract to Signed" modal (BR-06): appears when a lead with a prior
  // signing flow has "Change to Signed" clicked. Carries a required comment
  // field and a CONFIRM button. DOM-first (discovery KB modification-report-
  // agent-name-bug): [role="dialog"] with input placeholder "Add a comment
  // (required)" + a submit button.
  moveContractToSignedModal: "[role='dialog']:has-text('Move Contract to Signed'), .modal.show:has-text('Move Contract to Signed')",
  moveContractToSignedComment: "[role='dialog'] input[placeholder='Add a comment (required)'], .modal.show input[placeholder='Add a comment (required)']",
  moveContractToSignedConfirm: "[role='dialog'] button.submit-button, .modal.show button.submit-button, [role='dialog'] button:has-text('CONFIRM'), .modal.show button:has-text('CONFIRM')",
  // "Set to Expired" confirmation modal (#1315 — CT-01).
  // DOM-first (LIVE qa2 lead 16728, 2026-06-18, headless chromium 1440×900):
  // the action opens an "Add a Comment" modal inside `.modal.fade.show`
  // (role="dialog"). It carries an OPTIONAL comment input (`name="comment"`,
  // placeholder "Type here...", NOT required — Save stays enabled when empty)
  // and a submit button whose visible label is "Save" (NOT "CONFIRM"/"Yes",
  // and there is NO `.submit-button` class). The old selector (CONFIRM/Yes/
  // .submit-button) matched 0 elements → confirmVisible stayed false → the
  // method returned silently and changeLeadStatus never fired.
  setToExpiredModal: "[role='dialog']:has(input[name='comment']), .modal.show:has(input[name='comment'])",
  setToExpiredComment: "[role='dialog'] input[name='comment'], .modal.show input[name='comment']",
  // Anchor on the submit button (type=submit) inside the shown modal; "Save"
  // text kept as a secondary clause for resilience to a future type change.
  setToExpiredConfirm: "[role='dialog'] button[type='submit'], .modal.show button[type='submit'], [role='dialog'] button:has-text('Save'), .modal.show button:has-text('Save')",

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
  // Overview TABLE-panel free-text search (placeholder "Search table"). A non-matching
  // value yields a deterministic EMPTY table (DOM-confirmed QA2 2026-06-18: 0 rows +
  // "There are no records to display" + both export buttons disabled). Used as the
  // empty-set lever for the Overview CTs (#1321) — the From/To date window is unreliable
  // because the table-panel `#fromDate` resets to today (Formik default).
  overviewTableSearch: "input[placeholder='Search table']",
  // ── Quick Search bar (svc#454 — Origination + Servicing) ──────────
  // DOM live-validated for SPEC RU05.26.1.52.0 (qa1, 1440×900, post-login).
  // The desktop quick search form is wrapped in `<form class="d-none d-lg-block">`
  // so it only renders at ≥992px (Bootstrap `lg`). Tests fix viewport to 1440×900.
  // The search-type toggle uses CSS-module class `index-module_searchType__toggle__<hash>` —
  // hash suffix flips on every webpack rebuild, so we anchor on the prefix via [class*=].
  // The dropdown menu/items are standard Bootstrap `Dropdown.Menu` (role=menu/menuitem).
  // Autocomplete renders <a href="/customer-information/{leadPk}"> nodes after the BFF resolves.
  quickSearchForm: 'form.d-none.d-lg-block, form[class*="d-lg-block"]',
  quickSearchTypeToggle: 'a[class*="index-module_searchType__toggle"], a[class*="searchType__toggle"]',
  quickSearchTypeMenu: '[role="menu"].dropdown-menu, .dropdown-menu[role="menu"]',
  quickSearchAutocompleteResult: 'a[href*="/customer-information/"], a[href*="/customers/"]',

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
  // Broadened from 'gowsign.com' → 'gowsign': in sandbox the GowSign vendor host
  // is `gowsign-app-dev-uown.azurewebsites.net` (verified via live DOM 2026-06-12,
  // lead 97457), NOT *.gowsign.com. The substring 'gowsign' matches both the
  // azurewebsites sandbox host and prod `*.gowsign.com`. See pitfall — GowSign
  // host varies per environment.
  signingGowSignIframeByUrl: 'iframe[src*="gowsign"]',
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

  // ── Servicing - Payment History → Reverse / Reallocate Payment ─────
  // Page: /payment-history/{accountPk} (History menu → "Payments").
  // DOM-first verified on svc-website-dev3 account 94 (2026-06-01): the reverse/refund
  // affordance lives HERE (NOT on /payment-transaction, which has no per-row action icon).
  // Each rdt row (id="row-{n}", 8 cells) carries two action svgs in the last two columns:
  //   • "Reverse Payment"  → svg[data-icon="arrow-rotate-left"] (class fa-arrow-rotate-left cursor-pointer)
  //   • "Update Payment"   → svg[data-icon="pen-to-square"]
  paymentHistoryRows: ".rdt_TableRow",
  // Body-scoped data rows only — excludes the column-header row (which renders as
  // .rdt_TableHeadRow in a separate rowgroup). DOM-first verified via failure snapshot
  // on svc-website-dev3 account 141 (2026-06-01): the grid hydrates the body row
  // (06/01/2026 $100.00 CC PAID) asynchronously AFTER the head row, so the previous
  // `.rdt_TableRow` first()/count() iteration raced the fetch and saw 0 data rows.
  paymentHistoryBodyRows: ".rdt_TableBody .rdt_TableRow",
  paymentHistoryReverseIcon: 'svg[data-icon="arrow-rotate-left"]',
  // Reverse / Reallocate modal — "Reverse Reason" is a React Select (#reverseReason is a
  // DIV container, NOT a native <select>), so options are picked via the open menu, not selectOption().
  // Options observed: "Reverse", "Fully Refund", "Partially Refund".
  reverseReasonControl: '.modal-content #reverseReason [class*="control"]',
  reverseReasonOption: '.filter__option, [role="option"], div[class*="select__option"]',
  // "Partially Refund" reveals #paymentAmount (pre-filled with full amount); "Fully Refund"
  // reveals #refundFee checkbox (no editable amount). Both keep #comment textarea.
  reversePaymentAmountInput: '.modal-content #paymentAmount, [role="dialog"] #paymentAmount',
  reverseRefundFeeCheckbox: '.modal-content #refundFee, [role="dialog"] #refundFee',
  reverseCommentTextarea: '.modal-content #comment, [role="dialog"] #comment',
  reverseModalSaveButton: ".modal-content button:has-text('SAVE'), [role='dialog'] button:has-text('SAVE')",
  reverseModalCancelButton: ".modal-content button:has-text('CANCEL'), [role='dialog'] button:has-text('CANCEL')",

  // ── Add Card ───────────────────────────────────────────────────────
  addCardButton: "button:has-text('Add Card')",
  saveCardButton: "xpath=//div[contains(@class, 'd-flex justify-content-end')]/button[last()]",

  // ── Top bar ────────────────────────────────────────────────────────
  topBar: '.top-bar, .navbar, .account-header',

  // ── Menus ──────────────────────────────────────────────────────────

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
  paymentCardDetailRow: "[class*='paymentCard__detailRow']",
  paymentCardButton: "[class*='paymentCard__button']",
  termSelectionTab: "[class*='termSelection__tab']",
  termSelectionTabSelected: "[class*='termSelection__tabSelected']",
  paymentProgramFooterText: "[class*='paymentProgram__footerText']",
  paymentProgramFooterPhone: "[class*='paymentProgram__footerPhone']",

  // ── Completion Screen (Confetes/New Design) ──────────────────────

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
  ptRefundCheckbox: "input#agreedToRefund",
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
  ptSelectOffer: "button:has-text('Select'), a:has-text('Select')",
  ptContractIframe: "iframe[src*='uownleasing.com'], iframe[src*='completeApplication'], iframe.col-12.p-0",
  ptStreet: "#street, input[name='street'], input[name='address'], input[placeholder*='Street']",
  ptCity: "#city, input[name='city'], input[placeholder*='City']",
  ptZip: "#zip, input[name='zip'], input[name='zipCode'], input[placeholder*='Zip']",
  ptStateDropdown: "#state, div[class*='dropdown'] label, select[name='state']",
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
  // DOM-first (2026-06-12, MCP live lead 97502/97509): the modify-lease
  // confirmation dialog renders as both `.modal.show` and `[role="dialog"]`;
  // the action button label is exactly "Continue" (the uppercase "CONTINUE" in
  // the caution body is plain text, not the button). Scope to a visible dialog
  // and match the literal button text.
  modifyLeaseWarningContinue:
    ".modal.show button:has-text('Continue'), [role='dialog'] button:has-text('Continue')",
  modifyLeaseSaveButton: ".modal.show button:has-text('SAVE'), .modal.show button:has-text('Save')",
  activityLogEntry: "xpath=//div[contains(@class,'card')]//div[contains(text(),'Activity') or contains(text(),'activity')]/../..//div[contains(@class,'card-body')]//div[@role='row'] | //div[contains(@class,'card')]//div[contains(text(),'Activity')]/../..//tr",

  // ── Cancellation ─────────────────────────────────────────────────
  merchantOfferInsuranceCheckbox: "#checkbox-offerInsurance, #offerInsurance, input[name='offerInsurance']",

  // ── Insurance / Protection Plan ────────────────────────────────────
  purchaseInsuranceSubmitBtn: '#purchase-insurance-submit-btn',
  seeProtectionBenefitsBtn: 'button:has-text("See Protection Benefits")',
  insuranceOptInCheckbox: 'text=I agree to the Uown Protection Plus',
  insuranceOptOutCheckbox: 'text=No, continue unprotected',
  // Buddy offer widget host — `@buddy-technology/offer-component` (bumped ^1.7.1 in
  // origination!1466). The custom element renders the offer card/iframe; assert it is
  // present & non-empty BEFORE interacting so a layout regression in the bump is
  // caught (rule #14 — render is not proven by a DB log).
  buddyOfferElement:
    'buddy-offer-component, [class*="purchase-insurance"], [class*="offer-component"], #purchase-insurance-submit-btn',

  // ── Website Portal ──────────────────────────────────────────────────
  wsAccountSummary: '.account-summary, [data-section="account-summary"]',
  wsPaymentSection: '.payment-section, [data-section="payments"]',
  wsContactSection: '.contact-section, [data-section="contact"]',

  // Single input that accepts email OR 10-digit phone (no mask). Real DOM:
  // <input type="text" id="phoneOrEmail" name="phoneOrEmail" placeholder="Mobile number OR email address">
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
  wsPhoneNumberInput: '#phoneNumber, input[name="phoneNumber"], input[placeholder*="Phone" i]',
  wsSaveChangesButton: 'button:has-text("Save Changes"), button[type="submit"]:has-text("Save")',
  wsSuccessMessage: '.alert-success, .success-message, [class*="success"]:has-text("saved"), [class*="success"]:has-text("updated"), .toast-success',
  wsErrorMessage: '.alert-danger, .error-message, [class*="error"], .modal-body:has-text("could not find")',

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

  // Consumer-facing application wizard - Page 1 (Personal Info)
  // Note: DOM uses uppercase SSN/DOB; do not lowercase
  naMainFirstName: '#mainFirstName',
  naMainLastName: '#mainLastName',
  naMainSsn: '#mainSSN',
  naMainDob: '#mainDOB',
  naMainCellPhone: '#mainCellPhone',
  naMainEmailAddress: '#emailAddress',
  naMainAddress1: '#mainAddress1',
  naMainPostalCode: '#mainPostalCode',
  naMainCity: '#mainCity',

  // Consumer-facing application wizard - Page 2 (Employment)
  // EmployerName + EmploymentDuration removed in 2026-05 wizard refresh; left here only for legacy reference
  naMainLastPayDate: '#mainLastPayDate',
  naMainNextPayDate: '#mainNextPayDate',
  naMainMonthlyIncome: '#mainMonthlyIncome',

  // Consumer-facing application wizard - Page 2 bank fields + RightFoot consent (Task #1310, MR !1473)
  // DOM-confirmed in qa1 2026-06-01 (Origination wizard Step 2 / EMPLOYMENT).
  naMainBankRoutingNumber: '#mainBankRoutingNumber',
  naMainBankAccountNumber: '#mainBankAccountNumber',
  naMainCreditCardBin: '#mainCreditCardBin',
  // RightFoot consent block — renders only when routing OR account number has a value.
  naRightFootConsentSection: '[data-testid="rightFootConsentSection"]',
  naRightFootConsentChecked: '#rightFootConsentChecked',
  // Title div (no h* tag): "Uown Leasing uses Rightfoot..." / "Kornerstone living uses Rightfoot..."
  naRightFootConsentTitle: '[data-testid="rightFootConsentSection"] [class*="rightFootConsent__title"]',
  // Checkbox label body text ("By checking this box...").
  naRightFootConsentText: '[data-testid="rightFootConsentSection"] [class*="rightFootConsent__text"]',
  // Inline validation error (role=alert, id rightFootConsentChecked-error) — shown when unchecked.
  naRightFootConsentError: '#rightFootConsentChecked-error',
  // Yup inline errors for bank routing and account fields. These elements have no stable id
  // — they are the immediate next sibling of the input (confirmed via DOM snapshot 2026-06-01).

  // Consumer-facing application wizard - Page 3 (Consent)
  naIsAgreedToStatements: '#isAgreedToStatements',
  naIsAgreedToPrivacyPolicy: '#isAgreedToPrivacyPolicy',

  // Wizard footer buttons (data-nid-target is the only stable hook; .btn-primary is shared by Prev)
  naSendApplicationNextBtn: '[data-nid-target="sendApplication-nextBtn"]',
  naSendApplicationSubmitBtn: '[data-nid-target="sendApplication-submitBtn"]',

  // Invoice / Lease creation on customer page
  naNumberOfItems: '#numberOfItems',
  naItemCode: '#itemCode',
  naItemDescription: '#itemDescription',
  naBasePricePerItem: '#basePricePerItem',
  naDeliveryFee: '#deliveryFee',
  naInstallationFee: '#installationFee',
  naMiscFee: '#miscFee',
  naSubmitItemLease: "button[type='submit']:has-text('Submit'), button.btn-secondary:has-text('Submit'), button:has-text('Add Item'), button:has-text('ADD')",
  naSalesPerson: '#salesPerson',
  naInvoiceNumber: '#invoiceNumber',

  // ── Payment Arrangement ─────────────────────────────────────────────
  paymentArrangementCheckbox: '#paymentArrangement',
  arrangementStartDateInput: '#startDate',
  arrangementEndDateInput: '#endDate',
  arrangementPaymentFrequencyDropdown: "xpath=//label[@for='paymentFrequency']/../div",
  // Payment Arrangement Type React Select (label[for=paymentArrangementType]) — options NORMAL | SETTLEMENT.
  // DOM-confirmed dev3 acct 138 (2026-06-01): explicit UI select, not backend-derived.
  arrangementTypeDropdown: "xpath=//label[@for='paymentArrangementType']/../div",
  arrangementInstallmentAmountInput: (index: number) => `[id="paymentInfo[${index}].paymentAmount"]`,

  // ── Servicing Information Edit ─────────────────────────────────────
  svInfoEditButton: '#ServicingInformation-edit',
  svInfoPayFrequencyDropdown: '#payFrequency',
  svInfoSaveButton: "button[class*='collapsableEdit__button__primary']",
  svInfoFirstDueDateInput: '#firstDueDate, input[name="firstDueDate"]',
  svInfoSecondDueDateInput: '#secondDueDate, input[name="secondDueDate"]',

  // ── Settlement Amount panel + modal (svc#512 — R1.52.0) ────────────
  // The "Settlement Amount" label is a non-semantic <div> with
  // cursor:pointer inside the "Account & Contract Overview" column of
  // "Servicing Information". Validated via MCP Playwright in qa1
  // (SPEC §7 + diretrizes 2026-05-22). No <button>/<a> wrapper exists,
  // so getByRole does not match — anchor on the exact label text. The
  // page object scopes via `getByText('Settlement Amount', { exact: true })`
  // and filters by clickable ancestor for robustness; this string is the
  // CSS fallback when scoping by parent locator is not available.
  // Bootstrap modal anchored on its visible title.
  settlementBreakdownModal: ".modal.show:has-text('Settlement Breakdown')",
  // Each line item — implementer iterates to extract { label, value }.
  // DOM real (validated via MCP qa1, 2026-05-22): modal does NOT use a
  // Bootstrap `.modal-body` wrapper — uses a custom `<div class="overflow-auto p-3">`
  // containing `<table.w-100><tbody><tr><th>label</th><td>value</td></tr></tbody></table>`.
  // Scoping is done by the page object via `this.modal.locator(...)`.
  settlementBreakdownRow: "tr",
  // Modal close (X) — FontAwesome svg.fa-xmark-large inside .modal-content (no .modal-header wrapper).
  settlementBreakdownClose: ".modal.show .svg-inline--fa.fa-xmark-large, .modal.show [aria-label='Close']",

  // ── Search Results ──────────────────────────────────────────────────
  searchResultAccountLink: "a[href*='/customer-information/']",

  // ── Move Due Date (Servicing — Scheduled Payments modal) ───────────
  moveDueDateButton: "button:has-text('Move Due Date')",
  moveDueDateScheduledSelect: "#moveFromDueDate",
  moveDueDateNewDateInput: "input[name='numOfDaysToBeMoved']",

  // ── Origination - Leads Table Filters ──────────────────────────────

  // ── Error Log (Origination — /errorLog) ────────────────────────────
  elFilterFromDate: "input[name='from']",
  elFilterToDate: "input[name='to']",
  elFilterSearch: "input[name='search']",

  // ── Merchant Settings (Origination — /merchantSetting) ─────────────
  msDealerDiscountInput: "input[name='dealerDiscountOverride']",
  msDealerRebateTypeSelect: "select[name='dealerRebateType']",
  msDealerRebateOverrideInput: "input[name='dealerRebateOverride']",
  msBulkConfirmButton: ".modal.show button:has-text('Confirm'), .modal.show button:has-text('Yes')",
  msPeakCampaignIdInput: "input[name='peakCampaignId']",
  msOffPeakCampaignIdInput: "input[name='offPeakCampaignId']",
  msPeakCampaignIdLabel: "label[for='peakCampaignId']",
  msOffPeakCampaignIdLabel: "label[for='offPeakCampaignId']",
  msUwPipelineInput: "input[name='uwPipeline']",
  msFraudThresholdInput: "input[name='fraudThreshold']",
  msMaxApprovalAmountInput: "input[name='maxApprovalAmount']",
  msGdsDataToggle: "button:has-text('GDS Data')",
  // EPO 5% / EPO 10% on /merchantSetting are GDS-section triple-checkbox bulk controls
  // (DOM-first verified qa2 2026-06-16). Real structure:
  //   div.d-flex.flex-column
  //     ├─ div#toggler              (visible row)
  //     │    ├─ input#epo5-main     (enable-the-field checkbox; value="true")
  //     │    └─ svg.fa-caret-down   (cursor-pointer — OPENS the collapse dropdown)
  //     └─ div.position-relative.row
  //          └─ div.checkbox-dropdown_…card__… .collapse   (display:none until caret click)
  //               ├─ input#epo5        (True)   + text "True"
  //               └─ input#epo5-false  (False)  + text "False"
  // The True/False inputs are NOT revealed by checking `-main` — they live inside a
  // Bootstrap `.collapse` that only expands when the caret-down toggle is clicked.
  // NOTE: `#toggler` id is duplicated across fields (invalid HTML), so scope the caret
  // via `:has(#epoN-main)` to hit exactly one. After the caret opens the dropdown the
  // True/False inputs are genuinely visible/checkable — no force:true needed.
  msEpo5MainCheckbox: '#epo5-main',
  msEpo5CaretToggle: '#toggler:has(#epo5-main) svg.fa-caret-down',
  msEpo5TrueCheckbox: '#epo5',
  msEpo5FalseCheckbox: '#epo5-false',
  msEpo10MainCheckbox: '#epo10-main',
  msEpo10CaretToggle: '#toggler:has(#epo10-main) svg.fa-caret-down',
  msEpo10TrueCheckbox: '#epo10',
  msEpo10FalseCheckbox: '#epo10-false',
  // GDS-section SAVE button — disabled until a field is changed (form dirty).
  // Anchored on the CSS-module prefix to disambiguate from the filter-panel SAVE.
  msGdsSaveButton: "button[class*='merchantSetting_merchantSettingContainer__saveButton'], button:has-text('SAVE')",
  // Merchant table row matched by visible text (refCode or merchant code, e.g. 'OL90202-0001').
  msMerchantRowByText: (text: string) =>
    `.rdt_TableRow:has-text(${JSON.stringify(text)}), div[role='row']:has-text(${JSON.stringify(text)}), table tbody tr:has-text(${JSON.stringify(text)})`,
  // "Search table" box inside the Filters panel — filters the merchant table by code/name.
  // DOM-first (qa2 2026-06-16): `textbox "Search"` placeholder "Search table".
  // The default table renders only ~20 rows; terraceFinance (OL90202-0001) is NOT among them —
  // it must be typed here and the filter applied before the row exists in the DOM.
  msMerchantSearchTableInput: "input[placeholder='Search table']",
  // Filter-panel apply button (accessible name "Search"). Distinct from the SAVE/GDS buttons.
  msMerchantFilterSearchButton: "button:has-text('Search')",

  // ── Contract page — missing employment info (planId empty in /complete URL) ──
  /** "Next paycheck" date input shown when planId is missing in the /complete URL */
  /** React Select combobox for pay frequency ("How often do you get paid?") */
  /** Plan selection heading shown after employment info is submitted */
  /** "Choose Payment Program" button on the plan selection screen */

  // ── Task #442 — Send Invite / Podium (Servicing — Account Summary) ────────
  invitationIcon: '#invitation',

  // ── Sales Rep / Merchant Info panel (Origination Customer page) ───────────
  salesRepEditButton: '#MerchantInfo-edit',
  salesRepSaveButton: ".collapsableEdit__button__primary, button[class*='collapsableEdit__button__primary']",

  // ── Lease Documents Panel (Origination Customer page — Documents/Lease) ───
  // Task #521 (LEASEMOD GowSign). CSS-module hash classes are fragile (pitfall #26),
  // so we anchor on the prefix portion via [class*=] attribute selectors. The
  // hash suffix (e.g. __5Th8A) changes on every webpack rebuild — the prefix stays.
  leasePanelHeader: '[class*="customer-info-panels_documentsItemHeader__"]',
  // Row container: the `contractItem__` base class (without the inner element
  // variants `titleButton`, `subtitle1`, `subtitle2`, `timeStamp`). The :not()
  // chain rejects those nested elements while keeping the outer row.
  leasePanelContractItem: '[class*="customer-info-panels_contractItem__"]:not([class*="titleButton"]):not([class*="subtitle"]):not([class*="timeStamp"])',
  leasePanelContractTitleButton: '[class*="customer-info-panels_contractItem__titleButton__"]',
  leasePanelContractSubtitle1: '[class*="customer-info-panels_contractItem__subtitle1__"]',
  leasePanelContractSubtitle2: '[class*="customer-info-panels_contractItem__subtitle2__"]',
  leasePanelContractTimestamp: '[class*="customer-info-panels_contractItem__timeStamp__"]',

  // ── Open to Buy (Origination) ──────────────────────────────────────────────
  openToBuyExportCsvButton: "button:has-text('Export'), button:has-text('CSV'), a:has-text('Export CSV')",

  // ── Origination — Column-Order tests (task #1295) ─────────────────────────
  // SPEC § 0.5: Origination tables sit inside Bootstrap `<div class="table-responsive">`.
  // No data-testid available — anchor on the stable Bootstrap class.
  scrollableAncestor: '.table-responsive, [style*="overflow"], [class*="overflow-auto"], [class*="overflow-x"]',
  // Overview-only — Config Columns gear-icon trigger. Visible text "Config Columns" per SPEC § 0.5.
  configColumnsTrigger: "button:has-text('Config Columns'), a:has-text('Config Columns'), [aria-label='Config Columns']",
  // Side panel opened by the trigger ("Configure the view" heading per SPEC § 0.5).
  configColumnsPanel: "[role='dialog']:has-text('Configure the view'), .modal:has-text('Configure the view'), [class*='configColumns'], aside:has-text('Configure the view')",
  // Merchants list page (/merchant) — Config Columns is a Bootstrap dropdown
  // (`div.dropdown.show`), NOT a dialog/modal/aside. The generic `configColumnsPanel`
  // above does NOT match here. Discovery: docs/knowledge-base/merchants-config-columns-export.md. Task #1309.
  configColumnsPanelMerchants: "div.dropdown.show:has-text('Configure the view')",
  // Each column checkbox is matched by the option name (e.g. "Sales Rep Code").
  configColumnsCheckbox: (name: string) => `label:has-text(${JSON.stringify(name)}) input[type='checkbox'], input[type='checkbox'][name=${JSON.stringify(name)}]`,
  // CSV export probes (SPEC § 0.5 + multi-select-filters.spec.ts CT-09 pattern).
  csvDownloadTrigger: "button:has-text('Download CSV'), a:has-text('Download CSV'), button:has-text('Export CSV'), a:has-text('Export CSV'), button:has-text('Export')",
  csvEmailTrigger: "button:has-text('Email CSV'), a:has-text('Email CSV')",

  // ── Task #1321 — CSV export size-limit guard (Overview + Leads) ──
  // The app renders a single `FilteredCsvDownload` component on both screens.
  // Download CSV = <button> "Download CSV"; classes include
  // `filtered-csv-download_csvButton__<hash>` and, depending on state,
  // `filtered-csv-download_enabledButton__<hash>` or
  // `filtered-csv-download_disabledButton__<hash>` (hash-agnostic match).
  // DOM facts captured on QA2 2026-06-18 (deployed bundle + live React props);
  // validated by running this task's E2E. KB: overview-leads-csv-export-size-limit.md.
  // IMPORTANT: Email CSV and Download CSV buttons SHARE the `filtered-csv-download_csvButton`
  // class (DOM-confirmed: both match `button[class*='filtered-csv-download_csvButton']`,
  // and the Email CSV button is FIRST in the DOM). So this must disambiguate by the unique
  // "Download CSV" text — otherwise `.first()` resolves to the Email CSV button and a
  // download click opens the email modal instead (root cause of the CT-01/CT-02 download timeout).
  csvDownloadButton: "button[class*='filtered-csv-download_csvButton']:has-text('Download CSV')",
  csvDownloadButtonEnabled: "button[class*='filtered-csv-download_csvButton'][class*='enabledButton']",
  csvDownloadButtonDisabled: "button[class*='filtered-csv-download_csvButton'][class*='disabledButton']",
  csvEmailButton: "button:has-text('Email CSV')",
  csvEmailButtonDisabled: "button[class*='disabledButton']:has-text('Email CSV')",
  // The Download CSV button is wrapped in <span id="{tooltipIdPrefix}-{random}">.
  // On hover, React-Bootstrap renders the directing message as a portal:
  // <div role="tooltip" class="tooltip show bs-tooltip-auto"> outside the span.
  // DOM-confirmed sandbox 2026-06-18 after applying 79k-row date filter (#1321).
  csvDownloadTooltipPortal: "div[role='tooltip'].tooltip.show, div.tooltip.show",
  // Email CSV modal — a dialog with title "Which email should we send this CSV file to?".
  csvEmailModal: "[role='dialog']:has-text('Which email should we send this CSV file to?'), .modal:has-text('Which email should we send this CSV file to?')",
  csvEmailModalTitle: "text=Which email should we send this CSV file to?",
  csvEmailModalInput: "input[placeholder='Enter your email...']",
  csvEmailModalSendButton: "button:has-text('Send')",
  csvEmailModalCancelButton: "button:has-text('CANCEL')",
  // rdt pagination footer — text matches /\d+-\d+ of (\d+)/ (the filtered total).
  rdtPaginationFooter: '.rdt_Pagination',

  // ── Task #505 — Opt Out AI (Servicing — Primary Contact / Mobile Phone) ──
  primaryContactEditButton: '#PrimaryContact-edit',
  optOutAiCheckbox: '#optOutAiMobile, label:has-text("Opt Out AI") input[type="checkbox"], input[name="optOutAiMobile"]',
  doNotCallCheckbox: '#doNotCallMobile, label:has-text("Do Not Call") input[type="checkbox"], input[name="doNotCallMobile"]',
  // Reason modal that appears when toggling Opt Out AI checkbox
  optOutAiReasonModal: 'dialog, [role="dialog"]',
  optOutAiReasonTextbox: 'dialog textarea, [role="dialog"] textarea',
  optOutAiReasonSaveButton: 'dialog button:has-text("Save"), [role="dialog"] button:has-text("Save")',

  // ── AMS — Merchants list (/merchants) + Users page Add User — svc#504 (R1.52.0) ──
  // Backed by GET /uown/merchants (MR!1430). Lazy load of /uown/getAllAvailableMerchants
  // on /users page only fires when "Add User" is clicked (MR!170). Selectors validated
  // via MCP Playwright in qa1 on 2026-05-22.
  //
  // Sidebar links sit under Bootstrap `d-lg-block` — viewport ≥1440×900 required (rule #16).
  amsMerchantsNavLink: 'a:has-text("Merchants"), [href*="/merchants"]:has-text("Merchants")',
  // Filters toggle is a real <button> with literal "Filters" text (no aria-label).
  amsMerchantsFiltersButton: 'button:has-text("Filters")',
  // Search input inside the opened Filters panel.
  // The DOM exposes both `<input type="search">` and `role=searchbox` with accessible name "Search".
  amsMerchantsSearchInput: 'input[type="search"], input[role="searchbox"][name="Search" i], input[placeholder*="Search" i]',
  // Search submit button — Filters panel renders a literal "Search" button.
  amsMerchantsSearchSubmitButton: 'button:has-text("Search"):not(:has-text("Searchbox"))',
  // Active-status combobox — INLINE multi-select with checkboxes (NOT react-select).
  // DOM validated via MCP Playwright in qa1 on 2026-05-22 (S3 trace snapshot, ref=e86):
  //   - `[role="combobox"]` exposing the placeholder "Please select" when closed.
  //   - When opened (`aria-expanded="true"`), it inflates INLINE (no portal) to show
  //     two options "Active" / "Inactive". Each option is an anonymous `<div>` whose
  //     children are an `<input type="checkbox">` plus a `<div>` with the label text.
  //   - Options are NOT `[role="option"]` and have no `filter__option` class —
  //     the ARIA live region announces them as options for AT but the DOM nodes are
  //     unsemantic divs. Option lookup MUST be scoped to the OPEN combobox to avoid
  //     colliding with the table column header "Active" or the sidebar "Active" text.
  amsMerchantsActiveCombobox: 'div:has(> div > div.filter__placeholder:has-text("Please select")) [role="combobox"], div:has(div.filter__placeholder:has-text("Please select")) .filter__control',
  // Scope token for the OPEN state of the combobox. Page object uses this with
  // `.getByText(label, { exact: true })` to target the option label `<div>`.
  amsMerchantsActiveComboboxOpen: '[role="combobox"][aria-expanded="true"]',
  // OPTION ROW container in the open Active combobox. 6ª passada (F-003 — fix definitivo):
  // the option row is rendered by a CSS-Module class `index-module_customOptionStyles__<hash>`.
  // The hash suffix changes between webpack builds; the prefix `customOptionStyles` is stable.
  // DOM validated LIVE in qa1 (2026-05-22 13:13 UTC via mcp__playwright__browser_evaluate):
  //   <div class="index-module_customOptionStyles__CSG9m" id="react-select-2-option-1">
  //     <div class="d-flex align-items-center">
  //       <input type="checkbox">    ← NATIVE input, NO aria-label, NO <label> wrapping
  //       Inactive                   ← text node SIBLING of input (NOT inside <label for>)
  //     </div>
  //   </div>
  // Page object filters by exact label via `filter({ hasText: /^state$/ })` to
  // disambiguate Active vs Inactive (substring "Active" would otherwise match "Inactive").
  // Previous attempts (`getByRole('checkbox', { name })`, `:has(> [role="checkbox"])`) failed
  // because the native input has NO ARIA accessible name and NO `role="checkbox"` attribute.
  amsMerchantsActiveOptionRow: '[class*="customOptionStyles"]',
  // "Last Login" column header rendered in the merchants react-data-table-component table.
  amsMerchantsLastLoginHeader: 'div[role="columnheader"]:has-text("Last Login")',
  // Add User button on /users page (literal "Add User" text). Triggers lazy load of getAllAvailableMerchants.
  amsAddUserButton: 'button:has-text("Add User")',

  // ── AMS — Users list (/users) ─────────────────────────────────────
  // Table uses react-data-table-component (divs, NOT <table>)
  amsRdtTable: '.rdt_Table',
  amsRdtTableRow: '.rdt_TableRow',
  amsRdtTableBody: '.rdt_TableBody',
  amsRdtPagination: '.rdt_Pagination',
  amsPaginationNextButton: 'button[aria-label="Next Page"]',

  // ── AMS — User Details (/users/[username]) ────────────────────────
  // Edit triggers: pencil icon spans per card section
  amsEditProfileButton: 'span#EditUserProfile-edit',
  amsUserFirstNameInput: 'input[name="firstName"]',
  amsUserLastNameInput: 'input[name="lastName"]',
  amsUserEmailInput: 'input[name="email"]',
  amsUserPhoneInput: 'input[name="phoneNumber"]',
  amsSaveButton: 'button:has-text("SAVE")',
  amsCancelButton: 'button:has-text("CANCEL")',

  // ── AMS — Associate Merchants (/associate-users-to-merchants) ─────
  amsAssocPageSubmit: 'button:has-text("Submit")',
  amsUsersSelectionInfo: '[class*="selectable-users-table_selectionInfo"]',
  amsMerchantsSelectionInfo: '[class*="selectable-merchants-table_selectionInfo"]',
  amsAssocRowCheckbox: 'input[name="select-row-undefined"]',

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
  // Clear all indicator in React Select
  // Search for Current Merchants input (read-only mode)
  amsUserMerchantsSearchbox: 'input[placeholder="Search for Current Merchants"]',
  // Origination tab in the merchants card

  // ── CC History / Edit Modal ────────────────────────────────────
  ccEditPencilIcon: 'svg[data-icon="pencil-alt"], svg[data-icon="pencil"], svg[data-icon="pen-to-square"]',

  // ── Sticky Recover columns (svc#485 — CC History grid) ───────────
  // Accessible names of the 4 Servicing columns added for the Sticky recovery
  // domain. Used by `CreditCardHistoryPage` via role=columnheader / role=cell
  // matching (see DOM-first rule, CLAUDE.md #16). The role-based query is
  // built in the page object — these constants are the source of truth for
  // the header text rendered in the grid.
  stickyStatusColumnName: 'Sticky Recovery Status',
  stickyTxnIdColumnName: 'Sticky Txn ID',
  stickyAttemptsColumnName: 'Sticky Attempts',
  stickyLastRetryColumnName: 'Last Sticky Retry',

  // ── CCBIN (Send Application) ─────────────────────────────────
  naCcBinField: '#mainCreditCardBin',
  naCcBinImage: 'img[src*="ccbin"]',
  naCcBinInstructionText: '.ccBinContainer span, [class*="ccBinContainer"] span',

  // ── Merchant Add/Edit (Origination — /merchant & /merchant/addMerchant) ──────
  // Task #1262 — Inventory Category mandatory
  // Clone is a bootstrap DropdownButton with title="Clone" — toggle opens the menu
  // Search input inside the clone dropdown (InputField name="search")
  // Each clonable merchant appears as a DropdownItem inside the opened dropdown menu
  // Clone icon + tooltip shown in Merchant Information panel after a clone
  merchantClonedFromIcon: '#merchantClone',
  // Inventory Category — react-select creatable control rendered by InputField (label "Inventory Category")
  // Merchant identity fields on the add/edit form
  merchantRefCodeInput: "input[name='merchantCode'], input[name='refMerchantCode']",
  merchantNameInput: "input[name='merchantName']",
  merchantLegalNameInput: "input[name='legalName']",
  merchantLocationNameInput: "input[name='locationName']",
  // Funding on Hold checkbox (Settings > Others section) — DOM confirmed qa1 2026-06-02
  merchantHoldFundingCheckbox: "input[name='holdFunding']",

  // ── Program Groups (Origination — /programGroups — Task #1260) ────────────
  pgGroupCountCell: "div[role='cell']:nth-child(2) span",
  pgGroupInfoIcon: "div[role='cell'] svg[data-icon='circle-info'], div[role='cell'] svg.fa-circle-info",
  pgGroupEditIcon: "div[role='cell'] svg[data-icon='pen-to-square'], div[role='cell'] svg.fa-pen-to-square, div[role='cell'] svg[data-icon='pencil']",

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

  // Pre-signature metadata table
  gsDocumentIdValue: 'td:right-of(:text("DOCUMENT ID"))',
  gsRecipientNameCell: 'td:right-of(:text("Recipient"))',
  gsRecipientEmailCell: 'td span.text-blue-600:has(svg.lucide-mail)',
  gsStatusBadge: 'span.rounded-md.text-white',

  // Document content
  gsPageNumber: '.styles_page-number__oHQFD',

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

  // ACH grid
  gsAchGridTable: 'table:has(th:has-text("Number of payments")):has(th:has-text("Total Cost"))',
  gsAchGridRows: 'table:has(th:has-text("Number of payments")):has(th:has-text("Total Cost")) tr:has(td)',

  // ── Servicing — EPO panel (svc#531 R1.52.0 — 16m EPO for CA) ───────
  // Account & Contract Overview + Early Payoff / 90-Day Pay Off sections of
  // /customer-information/{accountPk}. DOM is a flat label-then-value pair:
  // each label `<div>` is followed by a sibling `<div>` containing the value.
  // Selectors anchor on the EXACT visible label text; page object resolves the
  // value via `locator(label).locator('xpath=following-sibling::div[1]')`.
  // DOM live-validated via MCP Playwright on qa1 account 4745 (2026-05-24).

  // ── Customer Portal — Overview + Payment (svc#531 R1.52.0) ─────────
  // Customer-facing portal (Website portal in repo naming). Mobile-first
  // viewport 375x667 per CLAUDE.md regra #15. Cards on /overview expose
  // amounts via a label `<div>` followed by a value `<div>`; the Pay Off
  // button is a `<button>` sibling of the value on the "Balance if Paid Off
  // Today" card. /payment shows the same balance inside a radio option
  // labelled "Balance if Paid Off Today:" (trailing colon).
  wsPayOffButton: 'button:has-text("Pay Off")',
  wsContractBalanceLabel: 'text="Contract Balance"',
  wsPaymentDueLabel: 'text="Payment Due"',
  wsNextPaymentDueDateLabel: 'text="Next Payment Due Date"',
  wsPaymentPageBalancePaidOffRadioLabel: 'text="Balance if Paid Off Today:"',

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

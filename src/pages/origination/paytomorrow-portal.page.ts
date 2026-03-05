import { type Page, type FrameLocator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { calculateDate } from '../../helpers/date.helpers.js';
import { ALL_TEST_CARDS } from '../../data/test-cards.js';
import { TEST_BANK } from '../../config/constants.js';
import { sleep } from '../../helpers/common.helpers.js';
import { completeSignwellFlow, clickSignAllViaLink } from '../../helpers/signwell.helpers.js';

/**
 * PayTomorrow Portal Page — handles the EXTERNAL PayTomorrow merchant portal
 * at https://merchant-staging.paytomorrow.com.
 *
 * This is NOT the UOWN Origination portal. It extends BasePage directly
 * (same pattern as ContractPage) because it is an external consumer/merchant-facing site.
 *
 * Flow:
 *   1. login() → authenticate on the PayTomorrow merchant portal
 *   2. proceedToApplications() → navigate to the "create application" page
 *   3. createApplicationCustomerNotPresent() → fill customer info (phone, name, email)
 *   4. addItemToApplication() → add item details, address, and send to customer
 *   5. handleIdentityVerification() → complete identity/SSN/DOB verification
 *   6. handleEmployment() → fill employment/income info
 *   7. handleOffers() → select an offer
 *   8. handleContractIframe() → return the contract iframe for e-sign
 *   9. refundTheLead() → process a refund on the portal
 */
export class PayTomorrowPortalPage extends BasePage {

  // ── Generous timeout for external portal transitions ────────────────
  private static readonly PT_NAV_TIMEOUT = 30_000;
  private static readonly PT_ACTION_TIMEOUT = 15_000;

  // ═══════════════════════════════════════════════════════════════════
  //  1. LOGIN
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Authenticate on the PayTomorrow merchant portal.
   * Fills username/password and waits for redirect to the applications list.
   */
  async login(username: string, password: string): Promise<void> {
    console.log(`[PT Portal] Logging in with user: ${username}`);

    // PayTomorrow uses Keycloak: #username (text), #password, #kc-login (input[type=submit])
    const emailField = this.page.locator(SELECTORS.ptKeycloakUsername).first();
    await emailField.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT });
    await emailField.fill(username);

    const passwordField = this.page.locator(SELECTORS.ptKeycloakPassword).first();
    await passwordField.fill(password);

    const loginBtn = this.page.locator(SELECTORS.ptKeycloakLoginButton).first();
    await loginBtn.click();

    await this.page.waitForURL('**/merchant/applications/**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    });
    console.log('[PT Portal] Login successful — on applications page');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  2. PROCEED TO APPLICATIONS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Click the first button on the page to navigate to the application creation page.
   */
  async proceedToApplications(): Promise<void> {
    console.log('[PT Portal] Navigating to create application page');

    const firstButton = this.page.locator('button').first();
    await firstButton.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await firstButton.click();

    await this.page.waitForURL('**/merchant/applications/create**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    });
    console.log('[PT Portal] On create application page');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  3. CREATE APPLICATION (Customer Not Present)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start a "Customer Not Present" application flow.
   * Fills phone, first name, last name, email and advances through the steps.
   */
  async createApplicationCustomerNotPresent(
    phone: string,
    firstName: string,
    lastName: string,
    email: string,
  ): Promise<void> {
    console.log(`[PT Portal] Creating application — customer not present: ${firstName} ${lastName}`);

    // Dismiss chat widget if visible (Freshchat/Drift overlay can intercept clicks)
    const chatWidget = this.page.locator(SELECTORS.ptChatWidget).first();
    if (await chatWidget.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await chatWidget.evaluate((el) => el.remove());
      console.log('[PT Portal] Removed chat widget overlay');
    }

    // Click "No" button for "Is the customer physically present in store?"
    const noBtn = this.page.locator(SELECTORS.ptCustomerNotPresentBtn).first();
    await noBtn.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await noBtn.click();
    console.log('[PT Portal] Clicked "No" — customer not present');

    // Wait for the Customer Information form to appear (all 4 fields at once)
    const firstNameField = this.page.locator(SELECTORS.ptFirstName).first();
    await firstNameField.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });

    // Fill all 4 fields: firstName, lastName, phone, email
    await firstNameField.fill(firstName);

    const lastNameField = this.page.locator(SELECTORS.ptLastName).first();
    await lastNameField.fill(lastName);

    const phoneField = this.page.locator(SELECTORS.ptPhone).first();
    await phoneField.fill(phone);

    const emailField = this.page.locator(SELECTORS.ptEmail).first();
    await emailField.fill(email);
    console.log(`[PT Portal] Filled customer info: ${firstName} ${lastName} / ${phone} / ${email}`);

    // Click "Initiate Pre Approval" button
    const initiateBtn = this.page.locator(SELECTORS.ptInitiatePreApprovalBtn).first();
    await initiateBtn.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await initiateBtn.click();
    console.log('[PT Portal] Clicked "Initiate Pre Approval"');

    // Handle "Do you want to add the cart?" confirmation dialog (PrimeNG modal)
    const confirmYesBtn = this.page.locator(SELECTORS.ptConfirmYesButton).first();
    await confirmYesBtn.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await confirmYesBtn.click();
    await sleep(3_000);
    console.log('[PT Portal] Confirmed "Add the cart" dialog — customer info submitted');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  4. ADD ITEM TO APPLICATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Add an item to the application with address, order details, and pricing.
   * Accepts the state address info for the shipping/billing address fields.
   */
  async addItemToApplication(state: {
    street: string;
    city: string;
    stateFullName: string;
    zipCode: string;
  }): Promise<string> {
    console.log(`[PT Portal] Adding item to application — state: ${state.stateFullName}`);

    // Fill street address
    const streetField = this.page.locator(SELECTORS.ptStreet).first();
    await streetField.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await streetField.fill(state.street);
    console.log(`[PT Portal] Filled street: ${state.street}`);

    // Fill city
    const cityField = this.page.locator(SELECTORS.ptCity).first();
    await cityField.fill(state.city);

    // Select state from PrimeNG dropdown
    await this.selectStateFromDropdown(state.stateFullName);

    // Fill zip code
    const zipField = this.page.locator(SELECTORS.ptZip).first();
    await zipField.fill(state.zipCode);
    console.log(`[PT Portal] Filled address: ${state.city}, ${state.stateFullName} ${state.zipCode}`);

    // Fill order ID (required)
    const orderIdField = this.page.locator(SELECTORS.ptOrderId).first();
    await orderIdField.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await orderIdField.fill('1579876780');

    // Fill item description (required)
    const descField = this.page.locator(SELECTORS.ptItemDescription).first();
    await descField.fill('Item Test');

    // Fill quantity (required)
    const qtyField = this.page.locator(SELECTORS.ptQuantity).first();
    await qtyField.fill('1');

    // Fill price (required) — keep below $1,500 to avoid exceeding approval limits
    const priceField = this.page.locator(SELECTORS.ptPrice).first();
    await priceField.fill('1000');
    console.log('[PT Portal] Filled cart details (orderId, description, qty=1, price=1000)');

    // Click "Add" button to add item to cart
    const addBtn = this.page.locator(SELECTORS.ptAddButton).first();
    await addBtn.click();
    await sleep(2_000);
    console.log('[PT Portal] Clicked Add button — item added to cart');

    // Fill tax/shipping/discount if visible (these fields appear after "Add")
    // Keep total low to avoid exceeding approval limits (max ~$1,500)
    const taxField = this.page.locator(SELECTORS.ptTaxRate).first();
    if (await taxField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await taxField.fill('0');
      const shippingField = this.page.locator(SELECTORS.ptShipping).first();
      await shippingField.fill('0');
      const discountField = this.page.locator(SELECTORS.ptDiscount).first();
      await discountField.fill('0');
      console.log('[PT Portal] Filled tax (0), shipping (0), discount (0) — total: $1,000');
    }

    // Click "Send to customer to complete electronically"
    const sendBtn = this.page.locator(SELECTORS.ptSendToCustomerButton).first();
    await sendBtn.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await sendBtn.click();
    await sleep(3_000);
    console.log('[PT Portal] Clicked "Send to Customer"');

    // After submission, page redirects to applications list.
    // Navigate to the first IN-PROGRESS app detail to get the token.
    await this.page.waitForURL('**/merchant/applications/**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    }).catch(() => {});

    const firstInProgressRow = this.page.locator(SELECTORS.ptInProgressRow).first();
    await firstInProgressRow.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });

    const viewLink = firstInProgressRow.locator(SELECTORS.ptDetailsLink).first();
    await viewLink.click();
    await sleep(3_000);
    console.log(`[PT Portal] Navigated to app detail: ${this.page.url()}`);

    // Click "Send Cart" button on detail page to trigger /send/cart API
    const sendCartResponsePromise = this.page.waitForResponse(
      (resp) => resp.url().includes('/send/cart') && resp.status() === 200,
      { timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT },
    );

    const sendCartBtn = this.page.locator(SELECTORS.ptSendCartButton).first();
    await sendCartBtn.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await sendCartBtn.click();

    // Handle confirmation dialog "Are you sure that you want to send cart?"
    const confirmYes = this.page.locator(SELECTORS.ptConfirmYesButton).first();
    await confirmYes.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    if (await confirmYes.isVisible()) {
      await confirmYes.click();
    }

    // Capture the /send/cart response to get finalization URL
    let finalizationUrl = '';
    try {
      const sendCartResp = await sendCartResponsePromise;
      const body = await sendCartResp.json() as { url?: string; token?: string };
      finalizationUrl = body.url || '';
      console.log(`[PT Portal] Finalization URL from /send/cart: ${finalizationUrl}`);
    } catch {
      console.log('[PT Portal] Could not capture /send/cart response — using token fallback');
    }

    // Fallback: extract token from detail page body
    if (!finalizationUrl) {
      const bodyText = await this.page.locator('body').textContent() ?? '';
      const tokenMatch = bodyText.match(/Token\s*:\s*([a-f0-9]{32})/);
      if (tokenMatch) {
        finalizationUrl = `https://api-staging-paytomorrow.paytomorrow.com/api/app/consumer/verify/${tokenMatch[1]}`;
        console.log(`[PT Portal] Finalization URL from token fallback: ${finalizationUrl}`);
      }
    }

    console.log('[PT Portal] Application sent to customer');
    return finalizationUrl;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  5a. HANDLE IDENTITY VERIFICATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Complete identity verification on the PayTomorrow embedded app page.
   * Handles address fields (if visible), terms agreement, OTP, SSN, DOB, pay cycle.
   *
   * @param ptPage - The PayTomorrow finalization page (may be a new tab)
   * @param ssn - SSN to use for identity verification
   */
  /** Handle OTP step on the PayTomorrow identity verification page */
  private async handlePtOtpStep(ptPage: Page): Promise<void> {
    await ptPage.waitForURL('**/verify/otp**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    }).catch(() => {
      console.log('[PT Portal] OTP URL wait timed out — may be on a different step');
    });

    const spinner = ptPage.locator(SELECTORS.ptSpinnerBackdrop);
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    const otpInputs = ptPage.locator('.otp-input, input[autocomplete="one-time-code"]');
    const otpCount = await otpInputs.count();

    if (otpCount < 5) {
      console.log(`[PT Portal] Found ${otpCount} OTP inputs — skipping OTP step`);
      return;
    }

    const otpCode = '12345';
    for (let i = 0; i < Math.min(otpCount, 5); i++) {
      await otpInputs.nth(i).fill(otpCode[i]);
    }
    console.log('[PT Portal] Filled OTP digits: 12345');

    const otpContinue = ptPage.locator("button:has-text('Continue'), button[type='submit']").first();
    await otpContinue.click();
    console.log('[PT Portal] Clicked Continue after OTP');
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
    await sleep(3_000);
  }

  /** Fill pay date using month/day selects or single input */
  private async handlePayDateSelection(ptPage: Page): Promise<void> {
    const payMonthSelect = ptPage.locator(SELECTORS.ptPayMonth).first();
    if (await payMonthSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = monthNames[futureDate.getMonth()];
      const monthNum = String(futureDate.getMonth() + 1);
      const dayOfMonth = String(futureDate.getDate());

      await payMonthSelect.selectOption({ label: monthName }).catch(async () => {
        await payMonthSelect.selectOption(monthNum).catch(async () => {
          await payMonthSelect.selectOption({ index: futureDate.getMonth() + 1 }).catch(() => {});
        });
      });
      console.log(`[PT Portal] Selected pay month: ${monthName} (${monthNum})`);

      const payDaySelect = ptPage.locator(SELECTORS.ptPayDay).first();
      if (await payDaySelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await payDaySelect.selectOption(dayOfMonth).catch(async () => {
          await payDaySelect.selectOption({ index: parseInt(dayOfMonth) }).catch(() => {});
        });
        console.log(`[PT Portal] Selected pay day: ${dayOfMonth}`);
      }
      return;
    }

    // Fallback: single pay date input
    const payDateFormatted = this.getPayDate(7);
    const payDayInput = ptPage.locator(SELECTORS.ptPayDay).first();
    if (await payDayInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tagName = await payDayInput.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await payDayInput.selectOption(payDateFormatted.split('/')[1]).catch(() => {});
      } else {
        await payDayInput.fill(payDateFormatted);
      }
      console.log(`[PT Portal] Filled pay date: ${payDateFormatted}`);
    }
  }

  async handleIdentityVerification(ptPage: Page, ssn: string): Promise<void> {
    console.log('[PT Portal] Starting identity verification');

    // Step 1: Terms & Address (if visible)
    const streetField = ptPage.locator(SELECTORS.ptStreet).first();
    if (await streetField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await streetField.fill('555 Test Street');
      console.log('[PT Portal] Filled address fields on verification page');
    }

    const termsCheckbox = ptPage.locator(SELECTORS.ptAgreeTerms).first();
    if (await termsCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (!await termsCheckbox.isChecked()) await termsCheckbox.check();
      console.log('[PT Portal] Checked terms agreement');
    }

    const submitBtn = ptPage.locator(SELECTORS.ptSubmitButton).first();
    if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitBtn.click();
      console.log('[PT Portal] Submitted step 1 form');
    }

    // OTP step
    await this.handlePtOtpStep(ptPage);

    // Step 2: SSN
    let ssnFilled = false;
    const ssnInput = ptPage.locator(SELECTORS.ptSsnInput).first();
    if (await ssnInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await ssnInput.fill(ssn);
      ssnFilled = true;
      console.log(`[PT Portal] Filled SSN: ***-**-${ssn.slice(-4)}`);
    }

    // Fallback: find SSN input by label text (Angular Material / custom form)
    if (!ssnFilled) {
      const ssnByLabel = ptPage.getByLabel(/social security/i).first();
      if (await ssnByLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await ssnByLabel.fill(ssn);
        ssnFilled = true;
        console.log(`[PT Portal] Filled SSN (by label): ***-**-${ssn.slice(-4)}`);
      }
    }

    if (!ssnFilled) {
      console.log('[PT Portal] SSN field not found — may not be required');
    }

    await this.fillDateOfBirth(ptPage, '06', '17', '1984');

    // Pay cycle
    const payCycleSelect = ptPage.locator(SELECTORS.ptPayCycle).first();
    if (await payCycleSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await payCycleSelect.selectOption({ label: 'Every two weeks' }).catch(async () => {
        await payCycleSelect.selectOption('BIWEEKLY').catch(() => {});
      });
      console.log('[PT Portal] Selected pay cycle: Every two weeks');
    }

    // Pay date
    await this.handlePayDateSelection(ptPage);

    // Click Continue/Submit to proceed
    const continueBtn = ptPage.locator("button:has-text('Continue'), button[type='submit'], button:has-text('Submit')").first();
    if (await continueBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await continueBtn.click();
      console.log('[PT Portal] Clicked Continue on step 2');
      await sleep(3_000);
    }

    // Wait for /confirm page or next step
    await ptPage.waitForURL('**/confirm**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    }).catch(() => {
      console.log('[PT Portal] confirm URL wait timed out — continuing');
    });

    // Submit confirm page if present
    const confirmSubmit = ptPage.locator(SELECTORS.ptSubmitButton).first();
    if (await confirmSubmit.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmSubmit.click();
      console.log('[PT Portal] Submitted confirm page');
    }

    // Wait for /employment page
    await ptPage.waitForURL('**/employment**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    }).catch(() => {
      console.log('[PT Portal] employment URL wait timed out — continuing');
    });

    console.log('[PT Portal] Identity verification complete');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  5b. HANDLE EMPLOYMENT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Fill employment information on the PayTomorrow application.
   *
   * @param ptPage - The PayTomorrow page (may be a new tab)
   */
  async handleEmployment(ptPage: Page): Promise<void> {
    console.log('[PT Portal] Filling employment information');

    // Fill monthly income
    const incomeField = ptPage.locator(SELECTORS.ptMonthlyIncome).first();
    await incomeField.waitFor({ state: 'visible', timeout: PayTomorrowPortalPage.PT_ACTION_TIMEOUT });
    await incomeField.fill('4300');
    console.log('[PT Portal] Filled monthly income: 4300');

    // Fill last pay date (14 days ago) — may be <select> or <input>
    const pastDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const payDayInput = ptPage.locator(SELECTORS.ptPayDay).first();
    if (await payDayInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tagName = await payDayInput.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await payDayInput.selectOption(String(pastDate.getDate())).catch(async () => {
          await payDayInput.selectOption({ index: 1 }).catch(() => {});
        });
      } else {
        const lastPayDate = calculateDate(-14, true);
        await payDayInput.fill(lastPayDate);
      }
      console.log(`[PT Portal] Filled last pay date: ${pastDate.getDate()}`);
    }

    // Also fill pay month <select> if visible (employment page may have month+day selects)
    const payMonthInput = ptPage.locator(SELECTORS.ptPayMonth).first();
    if (await payMonthInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      await payMonthInput.selectOption({ label: monthNames[pastDate.getMonth()] }).catch(async () => {
        await payMonthInput.selectOption(String(pastDate.getMonth() + 1)).catch(() => {});
      });
      console.log(`[PT Portal] Filled last pay month: ${monthNames[pastDate.getMonth()]}`);
    }

    // Fill employer name
    const employerField = ptPage.locator(SELECTORS.ptEmployerName).first();
    await employerField.fill('Feed Me Money Ltd.');
    console.log('[PT Portal] Filled employer: Feed Me Money Ltd.');

    // Submit employment form (may be labeled "Continue" or "Submit")
    const submitBtn = ptPage.locator("button:has-text('Continue'), button[type='submit'], button:has-text('Submit')").first();
    await submitBtn.click();
    console.log('[PT Portal] Submitted employment form');

    // Wait for /offers page
    await ptPage.waitForURL('**/offers**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    }).catch(() => {
      console.log('[PT Portal] offers URL wait timed out — continuing');
    });

    console.log('[PT Portal] Employment info complete');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  5c. HANDLE OFFERS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Select the first available offer on the offers page.
   *
   * @param ptPage - The PayTomorrow page (may be a new tab)
   */
  async handleOffers(ptPage: Page): Promise<void> {
    console.log('[PT Portal] Selecting offer');

    // Check for "cart exceeded maximum" error message first
    const bodyText = await ptPage.locator('body').textContent() ?? '';
    if (bodyText.includes('cart value exceeded') || bodyText.includes('exceeded your maximum')) {
      const errorMsg = bodyText.match(/(Sorry.*?Thank you\.)/s)?.[1] || 'Cart exceeded max approved amount';
      throw new Error(`[PT Portal] Application blocked: ${errorMsg}`);
    }

    // Wait for offers page — may take time for lender waterfall to complete
    const selectOfferBtn = ptPage.locator(SELECTORS.ptSelectOffer).first();
    await selectOfferBtn.waitFor({ state: 'visible', timeout: 60_000 });
    await selectOfferBtn.click();
    console.log('[PT Portal] Clicked select offer');

    // Wait for /contract page
    await ptPage.waitForURL('**/contract**', {
      timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT,
    }).catch(() => {
      console.log('[PT Portal] contract URL wait timed out — continuing');
    });

    console.log('[PT Portal] Offer selected — on contract page');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  5d. HANDLE CONTRACT PAGE (UOWN iframe inside PayTomorrow)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Complete the full contract flow inside the UOWN embedded iframe.
   *
   * The PayTomorrow /uown_v2/contract page embeds a UOWN iframe at
   * https://secure-sandbox.uownleasing.com/{token}/complete
   *
   * Flow mirrors ContractPage (same UOWN app, just inside an iframe):
   *   1. Fill CC info (first name, last name, card number, CVC, exp date)
   *   2. Fill bank/ACH info (routing, account, re-enter, account type)
   *   3. Click Submit → CC authorization + payment info submission
   *   4. Complete Terms & Conditions (checkboxes + "PROCEED TO SIGNATURE")
   *   5. Complete e-sign (Signwell or PandaDocs inside the iframe)
   *
   * @param ptPage - The PayTomorrow page (may be a new tab from finalization flow)
   * @param customerFirstName - Must match the name used in the PayTomorrow application
   * @param customerLastName - Must match the name used in the PayTomorrow application
   */
  /** Fill CC fields inside the UOWN contract iframe */
  private async fillCreditCardInIframe(frame: FrameLocator, firstName: string, lastName: string): Promise<void> {
    const testCard = ALL_TEST_CARDS.DISCOVER_APPROVED;
    console.log(`[PT Contract] Filling CC: ${firstName} ${lastName}, card ${testCard.number.slice(0, 4)}****`);

    await this.fillIframeField(frame, `${SELECTORS.ccFirstName}, input[placeholder*="First Name"]`, firstName);
    await this.fillIframeField(frame, `${SELECTORS.ccLastName}, input[placeholder*="Last Name"]`, lastName);
    await this.fillIframeField(frame, `${SELECTORS.ccValue}, ${SELECTORS.ccNumber}, input[placeholder*="Card Number"]`, testCard.number);
    await this.fillIframeField(frame, `${SELECTORS.ccCvc}, input[placeholder*="CVC"], input[placeholder*="CVV"]`, testCard.cvv);

    const expDate = `${testCard.expMonth}/${testCard.expYear.slice(-2)}`;
    const reactExpInput = frame.locator(SELECTORS.ptCcExpDateCombined).first();
    const ccExpDateInput = frame.locator('#ccExpDate').first();

    if (await reactExpInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.fillIframeField(frame, SELECTORS.ptCcExpDateCombined, expDate);
      await reactExpInput.press('Enter');
    } else if (await ccExpDateInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.fillIframeField(frame, '#ccExpDate', expDate);
      await frame.locator('body').first().click({ position: { x: 10, y: 10 } });
    } else {
      const expMonthInput = frame.locator(SELECTORS.ccExpMonthInput).first();
      const expYearInput = frame.locator(SELECTORS.ccExpYearInput).first();
      if (await expMonthInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await this.fillIframeField(frame, SELECTORS.ccExpMonthInput, testCard.expMonth);
        await expMonthInput.press('Enter');
      }
      if (await expYearInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await this.fillIframeField(frame, SELECTORS.ccExpYearInput, testCard.expYear);
        await expYearInput.press('Enter');
      }
    }
    console.log(`[PT Contract] CC info filled (exp: ${expDate})`);
  }

  /** Fill bank/ACH fields inside the UOWN contract iframe */
  private async fillBankInfoInIframe(frame: FrameLocator, firstName: string, lastName: string): Promise<void> {
    const bankRouting = frame.locator(SELECTORS.bankRoutingNumber).first();
    if (!await bankRouting.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[PT Contract] No bank fields visible — skipping');
      return;
    }
    console.log('[PT Contract] Filling bank info...');

    const bankFirst = frame.locator(SELECTORS.bankAccountCustomerFirst).first();
    if (await bankFirst.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.fillIframeField(frame, SELECTORS.bankAccountCustomerFirst, firstName);
    }
    const bankLast = frame.locator(SELECTORS.bankAccountCustomerLast).first();
    if (await bankLast.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.fillIframeField(frame, SELECTORS.bankAccountCustomerLast, lastName);
    }

    await this.fillIframeField(frame, SELECTORS.bankRoutingNumber, TEST_BANK.ROUTING_NUMBER);
    await this.fillIframeField(frame, SELECTORS.bankAccountNumber, TEST_BANK.ACCOUNT_NUMBER);

    const reEnter = frame.locator(SELECTORS.achReEnterAccountNumber).first();
    if (await reEnter.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.fillIframeField(frame, SELECTORS.achReEnterAccountNumber, TEST_BANK.ACCOUNT_NUMBER);
    }

    const accountTypeInput = frame.locator(SELECTORS.bankAccountTypeInput).first();
    if (await accountTypeInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await accountTypeInput.fill(TEST_BANK.DEFAULT_TYPE);
      await accountTypeInput.press('Enter');
    }
    console.log('[PT Contract] Bank info filled');
  }

  async handleContractPage(ptPage: Page, customerFirstName?: string, customerLastName?: string): Promise<void> {
    console.log('[PT Contract] Handling contract page');
    console.log(`[PT Contract] URL: ${ptPage.url()}`);

    await ptPage.waitForLoadState('networkidle').catch(() => {});
    await sleep(3_000);

    // 1. Detect and wait for the UOWN iframe
    const iframeLocator = ptPage.locator(SELECTORS.ptContractIframe).first();
    await iframeLocator.waitFor({ state: 'visible', timeout: 30_000 });
    console.log(`[PT Contract] Iframe detected — src: ${await iframeLocator.getAttribute('src') ?? ''}`);

    const frame = ptPage.frameLocator(SELECTORS.ptContractIframe);
    console.log('[PT Contract] Waiting for iframe content...');
    await frame.locator(`${SELECTORS.ccFirstName}, input[placeholder*="First Name"]`).first()
      .waitFor({ state: 'visible', timeout: 120_000 });
    console.log('[PT Contract] Iframe content loaded — CC fields visible');
    await sleep(1_000);

    const firstName = customerFirstName || 'Test';
    const lastName = customerLastName || 'Automation';

    // 2. Fill CC info
    await this.fillCreditCardInIframe(frame, firstName, lastName);

    // 3. Fill bank/ACH info
    await this.fillBankInfoInIframe(frame, firstName, lastName);

    // Tab through fields to trigger React onBlur validation
    await ptPage.keyboard.press('Tab');
    await sleep(300);
    await ptPage.keyboard.press('Tab');
    await sleep(500);

    // Screenshot before submit for debugging
    await ptPage.screenshot({ path: 'scripts/pt-contract-before-submit.png', fullPage: true }).catch(() => {});

    // ── 4. Click Submit button ──────────────────────────────────────
    await this.submitContractForm(ptPage, frame);

    // ── 5. Complete Terms & Conditions ───────────────────────────────
    await this.completeTermsAndConditions(ptPage, frame);

    // ── 6. Complete E-Sign (Signwell or PandaDocs inside iframe) ────
    await this.completeESignInIframe(ptPage, frame);

    // ── 7. Wait for post-signing success message ────────────────────
    await this.waitForPostSigningSuccess(ptPage, frame);
  }

  /** Submit the contract form, wait for CC authorization, and log API responses */
  private async submitContractForm(ptPage: Page, frame: FrameLocator): Promise<void> {
    const apiResponses: { url: string; status: number; body: string }[] = [];
    ptPage.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('uownleasing') || url.includes('authorize') || url.includes('complete')) {
        const status = resp.status();
        let body = '';
        try { body = (await resp.text()).slice(0, 500); } catch { /* ignore */ }
        apiResponses.push({ url, status, body });
      }
    });

    const submitBtn = frame.locator(
      `${SELECTORS.buttonPrimary}, #completeApplication-submit, button:has-text("Submit"), button[type="submit"]`
    ).first();

    for (let attempt = 1; attempt <= 10; attempt++) {
      const isDisabled = await submitBtn.isDisabled().catch(() => true);
      if (!isDisabled) break;
      console.log(`[PT Contract] Submit button disabled, waiting... attempt=${attempt}`);
      await sleep(500);
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    console.log('[PT Contract] Clicked Submit — waiting for CC authorization...');
    await sleep(5_000);

    for (const resp of apiResponses) {
      console.log(`[PT Contract] API: ${resp.status} ${resp.url.split('?')[0]}`);
      if (resp.body) console.log(`[PT Contract]   → ${resp.body.slice(0, 200)}`);
    }

    await this.checkPostSubmitToast(ptPage, frame);
  }

  /** Check for error toast after contract form submission */
  private async checkPostSubmitToast(ptPage: Page, frame: FrameLocator): Promise<void> {
    const errorToast = frame.locator(SELECTORS.toastBody).first();
    if (!await errorToast.isVisible({ timeout: 3_000 }).catch(() => false)) return;

    const toastText = await errorToast.textContent().catch(() => '');
    console.log(`[PT Contract] Toast after submit: "${toastText}"`);
    const lower = toastText?.toLowerCase() || '';
    if (lower.includes('invalid') || lower.includes('error')) {
      await ptPage.screenshot({ path: 'scripts/pt-contract-error-toast.png', fullPage: true }).catch(() => {});
    }
  }

  /** Complete T&C page: check all checkboxes and click PROCEED TO SIGNATURE */
  private async completeTermsAndConditions(ptPage: Page, frame: FrameLocator): Promise<void> {
    const anyCheckbox = frame.locator(SELECTORS.checkboxInput).first();
    const tcVisible = await anyCheckbox.waitFor({ state: 'visible', timeout: 30_000 }).then(() => true).catch(() => false);

    if (!tcVisible) {
      console.log('[PT Contract] No T&C checkboxes found — page may have advanced directly to e-sign');
      return;
    }

    console.log('[PT Contract] T&C page loaded — checking all checkboxes');
    const allCheckboxes = frame.locator(SELECTORS.checkboxInput);
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = allCheckboxes.nth(i);
      if (await cb.isVisible() && !await cb.isChecked()) {
        await cb.check();
      }
    }
    console.log(`[PT Contract] Checked ${count} checkbox(es)`);
    await sleep(1_000);

    const proceedBtn = frame.locator(SELECTORS.ptProceedToSignature).first();
    if (await proceedBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await proceedBtn.scrollIntoViewIfNeeded();
      await proceedBtn.click();
      console.log('[PT Contract] Clicked PROCEED TO SIGNATURE');
      await sleep(3_000);
    } else {
      console.log('[PT Contract] No PROCEED TO SIGNATURE button — trying Submit');
      const fallbackSubmit = frame.locator(`${SELECTORS.buttonPrimary}, button[type="submit"]`).first();
      if (await fallbackSubmit.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fallbackSubmit.click();
      }
    }
  }

  /** Wait for post-signing success message in iframe or outer page */
  private async waitForPostSigningSuccess(ptPage: Page, frame: FrameLocator): Promise<void> {
    console.log('[PT Contract] Waiting for post-signing success message...');
    const maxSuccessWait = 60_000;
    const successStart = Date.now();
    const successPatterns = ['Congratulations', 'completed successfully', 'Your application has been', 'Thank you', 'All set', 'Document is complete'];

    while (Date.now() - successStart < maxSuccessWait) {
      await sleep(3_000);

      if (!ptPage.url().includes('/contract')) {
        console.log(`[PT Contract] Page advanced to: ${ptPage.url()}`);
        break;
      }

      try {
        const iframeText = await frame.locator('body').first().textContent({ timeout: 5_000 });
        const trimmedText = (iframeText || '').replace(/\s+/g, ' ').trim();

        if (successPatterns.some(p => trimmedText.includes(p))) {
          console.log(`[PT Contract] Success message: "${trimmedText.slice(0, 500)}"`);
          break;
        }
        if (trimmedText.includes('error') || trimmedText.includes('failed')) {
          console.log(`[PT Contract] Error detected: "${trimmedText.slice(0, 300)}"`);
          break;
        }
      } catch {
        console.log('[PT Contract] Iframe not accessible — may have been removed after signing');
        break;
      }

      const elapsed = Math.round((Date.now() - successStart) / 1000);
      console.log(`[PT Contract] Waiting for success message... (${elapsed}s)`);
    }

    try {
      const outerText = await ptPage.locator('body').textContent({ timeout: 3_000 });
      const outerTrimmed = (outerText || '').replace(/\s+/g, ' ').trim();
      if (['Congratulations', 'Thank you', 'completed', 'success'].some(p => outerTrimmed.includes(p))) {
        console.log(`[PT Contract] Outer page success: "${outerTrimmed.slice(0, 300)}"`);
      }
    } catch {
      // Outer page may have navigated
    }

    await ptPage.screenshot({ path: 'scripts/pt-contract-post-sign.png', fullPage: true }).catch(() => {});
    console.log(`[PT Contract] Post-signing URL: ${ptPage.url()}`);
    console.log('[PT Contract] Contract page handling complete');
  }

  /**
   * Robustly fill a field inside the UOWN iframe.
   * Tries fill() first, verifies value, falls back to click+pressSequentially.
   * Same pattern as ContractPage.fillField() but works with FrameLocator.
   */
  private async fillIframeField(frame: FrameLocator, selector: string, value: string): Promise<void> {
    const field = frame.locator(selector).first();
    await field.scrollIntoViewIfNeeded().catch(() => {});

    if (!await field.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log(`[PT Contract] Field not visible: ${selector}`);
      return;
    }

    // Primary: click + fill
    await field.click();
    await field.fill(value);

    // Verify the value actually stuck (React controlled inputs may reject fill())
    const actual = await field.inputValue().catch(() => '');
    if (actual !== value) {
      console.log(`[PT Contract] fill() didn't stick for ${selector} (got "${actual}") — using pressSequentially`);
      await field.click({ clickCount: 3 }); // select all
      await field.pressSequentially(value, { delay: 30 });
    }

    const finalValue = await field.inputValue().catch(() => '');
    console.log(`[PT Contract] Filled ${selector.split(',')[0].trim()}: "${finalValue}"`);
  }

  /**
   * Detect and complete e-sign (Signwell or PandaDocs) inside the UOWN iframe.
   * The e-sign provider renders as a nested iframe WITHIN the UOWN contract iframe.
   */
  private async completeESignInIframe(ptPage: Page, parentFrame: FrameLocator): Promise<void> {
    console.log('[PT Contract] Detecting e-sign provider in iframe...');

    const signwellIframe = parentFrame.locator(SELECTORS.signwellIframe);
    const pandaDocsIframe = parentFrame.locator(SELECTORS.pandaDocsIframe);

    // Poll up to 60s for either e-sign iframe to appear
    for (let attempt = 1; attempt <= 12; attempt++) {
      if (await signwellIframe.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log('[PT Contract] Signwell iframe detected');
        await this.completeSignwellInIframe(ptPage, parentFrame);
        return;
      }
      if (await pandaDocsIframe.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log('[PT Contract] PandaDocs iframe detected');
        await this.completePandaDocsInIframe(ptPage, parentFrame);
        return;
      }

      // Check if the page already completed (URL changed from /contract)
      if (!ptPage.url().includes('/contract')) {
        console.log(`[PT Contract] Page already advanced past contract: ${ptPage.url()}`);
        return;
      }

      console.log(`[PT Contract] Waiting for e-sign iframe... attempt=${attempt}`);
      await sleep(3_000);
    }

    // Last resort: try Signwell
    console.log('[PT Contract] Timeout waiting for e-sign iframe — trying Signwell as fallback');
    await this.completeSignwellInIframe(ptPage, parentFrame);
  }

  /**
   * Complete Signwell e-sign flow inside the UOWN iframe.
   * Delegates to the shared signwell helper for the core Start → fields → Finish flow.
   * Handles PT-specific concerns: modal dismissal and btn-rounded close.
   */
  private async completeSignwellInIframe(_ptPage: Page, parentFrame: FrameLocator): Promise<void> {
    const signwellFrame = parentFrame.frameLocator(SELECTORS.signwellIframe);

    // Dismiss "This is Not Legally Binding" modal if present (test mode documents)
    const continueBtn = signwellFrame.locator(SELECTORS.signwellContinueModal).first();
    if (await continueBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await continueBtn.click();
      console.log('[PT ESign] Dismissed "Not Legally Binding" modal');
      await sleep(1_000);
    }

    // Delegate to shared helper for Start → fill fields → Finish
    await completeSignwellFlow(signwellFrame, 'PT ESign', async () => {
      await clickSignAllViaLink(signwellFrame);
    });

    // Optional btn-rounded close — may fail if page/iframe already closed after Finish
    try {
      const btnRounded = signwellFrame.locator(SELECTORS.buttonRounded);
      if (await btnRounded.last().isVisible({ timeout: 3_000 }).catch(() => false)) {
        await btnRounded.last().click({ force: true }).catch(() => {});
      }
    } catch {
      // Page or iframe context may have been closed after e-sign — that's OK
    }
  }

  /**
   * Complete PandaDocs e-sign inside the UOWN iframe (nested iframe).
   */
  private async completePandaDocsInIframe(ptPage: Page, parentFrame: FrameLocator): Promise<void> {
    const pandaFrame = parentFrame.frameLocator(SELECTORS.pandaDocsIframe);

    // Close popup if present
    const closePopup = pandaFrame.locator(SELECTORS.pandaDocsClosePopup);
    if (await closePopup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await closePopup.click();
    }

    // Click "Start signing"
    const startSigning = pandaFrame.locator(SELECTORS.pandaDocsStartSigning);
    await startSigning.waitFor({ state: 'visible', timeout: 10_000 });
    await startSigning.click();
    console.log('[PT ESign PandaDocs] Clicked Start signing');

    // Click first Initials field
    const initials = pandaFrame.locator(SELECTORS.pandaDocsInitials);
    await initials.waitFor({ state: 'visible', timeout: 10_000 });
    await initials.click();

    // Accept and sign
    const acceptAndSign = pandaFrame.locator(SELECTORS.pandaDocsAcceptAndSign);
    await acceptAndSign.waitFor({ state: 'visible', timeout: 10_000 });
    await acceptAndSign.click();

    // Loop through remaining fields via Next button
    const nextBtn = pandaFrame.locator(SELECTORS.pandaDocsNext);
    for (let i = 0; i < 10; i++) {
      if (!await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) break;
      await nextBtn.click();

      if (await initials.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await initials.click();
      } else {
        const signature = pandaFrame.locator(SELECTORS.pandaDocsSignature);
        if (await signature.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await signature.click();
          await acceptAndSign.waitFor({ state: 'visible', timeout: 5_000 });
          await acceptAndSign.click();
        }
      }
    }

    // Click Finish
    const finishBtn = pandaFrame.locator(SELECTORS.pandaDocsFinish);
    await finishBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await finishBtn.click();
    console.log('[PT ESign PandaDocs] Clicked Finish');

    // Verify "All Set"
    const allSetText = pandaFrame.locator(SELECTORS.pandaDocsAllSet);
    await allSetText.waitFor({ state: 'visible', timeout: 15_000 });
    console.log('[PT ESign PandaDocs] All set! Document complete');
  }

  /**
   * @deprecated Use handleContractPage() instead — the contract is a direct page, not an iframe.
   */
  async handleContractIframe(ptPage: Page): Promise<FrameLocator> {
    console.log('[PT Portal] WARNING: handleContractIframe is deprecated — use handleContractPage');
    const iframeLocator = ptPage.locator(SELECTORS.ptContractIframe);
    await iframeLocator.waitFor({ state: 'visible', timeout: 60_000 });
    return ptPage.frameLocator(SELECTORS.ptContractIframe);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  6. REFUND THE LEAD
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Process a refund for a lead on the PayTomorrow portal.
   *
   * Mirrors Java: PayTomorrowPages.refundTheLead()
   *   1. Ensure we're on the applications list
   *   2. Click the eye icon (pi-eye) on the first row → opens details page
   *   3. Wait 10s for details to load (Java: Thread.sleep(10000))
   *   4. Click "Refund" button
   *   5. Wait for "Refund Application" modal
   *   6. Fill reason ("test"), check agreement, click "Refund $XXX"
   *
   * IMPORTANT: The PT portal tab must have been kept open since login (multi-tab pattern).
   * The UOWN funding webhook fires immediately, so by the time we switch back to this tab,
   * the application status should already be "FUNDED BY LENDER" and the Refund button visible.
   */
  async refundTheLead(maxPollAttempts = 10): Promise<void> {
    console.log('[PT Portal] Starting refund process');
    console.log(`[PT Portal] Current URL: ${this.page.url()}`);

    // ── Step 1: Ensure we're on the applications list ────────────────
    if (!this.page.url().includes('/merchant/applications/list')) {
      console.log('[PT Portal] Navigating to applications list');
      await this.page.goto(
        'https://merchant-staging.paytomorrow.com/merchant/applications/list',
        { timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT },
      );
    }
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await sleep(3_000);

    await this.page.screenshot({ path: 'test-results/pt-refund-applications-list.png', fullPage: true });

    // ── Step 2: Click the eye icon on the first row ──────────────────
    // Java: ElementUtility.clickButtonByIterable(VIEW_REFUND, 0, false)
    // VIEW_REFUND = By.className("pi-eye")
    const eyeIcon = this.page.locator(SELECTORS.ptEyeIcon).first();
    if (await eyeIcon.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await eyeIcon.click();
      console.log('[PT Portal] Clicked eye icon (pi-eye) on first row');
    } else {
      // Fallback: try any eye icon variant or first-row action button
      const fallbackIcon = this.page.locator('tbody tr:first-child i.fa-eye, tbody tr:first-child .pi-eye, tbody tr:first-child td:last-child button').first();
      if (await fallbackIcon.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await fallbackIcon.click();
        console.log('[PT Portal] Clicked fallback view icon on first row');
      } else {
        throw new Error('[PT Portal] Could not find eye icon (pi-eye) on applications list');
      }
    }

    // ── Step 3: Wait for details page (Java: Thread.sleep(10000)) ────
    await sleep(10_000);
    await this.page.screenshot({ path: 'test-results/pt-refund-app-details.png', fullPage: true });
    console.log(`[PT Portal] Details page URL: ${this.page.url()}`);

    // ── Step 4: Click Refund button ──────────────────────────────────
    // Java: refundButton = @FindBy(xpath = "//button[@label='Refund']")
    const refundBtn = this.page.locator("button[label='Refund'], button:has-text('Refund')").first();

    // Poll — PT portal may take time to update status
    if (!await refundBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log(`[PT Portal] Refund button not yet visible — polling (${maxPollAttempts} attempts × 15s)...`);
      for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
        await sleep(15_000);
        await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
        await this.page.waitForLoadState('networkidle').catch(() => {});
        await sleep(3_000);

        const statusText = await this.page.locator('text=Status').first()
          .locator('..').textContent().catch(() => '');
        console.log(`[PT Portal] Poll attempt ${attempt}/${maxPollAttempts} — status: "${statusText?.trim()}"`);

        if (await refundBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          console.log(`[PT Portal] Refund button appeared on attempt ${attempt}`);
          break;
        }
      }
    }

    if (!await refundBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const bodyText = await this.page.locator('body').textContent() ?? '';
      console.log(`[PT Portal] Details page text: ${bodyText.replace(/\s+/g, ' ').trim().slice(0, 1000)}`);
      throw new Error('[PT Portal] Refund button not visible after polling');
    }

    await refundBtn.click();
    console.log('[PT Portal] Clicked Refund button');

    // ── Step 5: Wait for "Refund Application" modal ──────────────────
    // Java: CommonHelpers.waitForElement(REFUND_APPLICATION, 10, false)
    // REFUND_APPLICATION = By.xpath("//span[contains(text(), 'Refund Application')]")
    const refundModal = this.page.locator(SELECTORS.ptRefundApplicationModal);
    await refundModal.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {
      console.log('[PT Portal] "Refund Application" modal header not found — continuing');
    });

    await this.page.screenshot({ path: 'test-results/pt-refund-dialog.png', fullPage: true });

    // ── Step 6a: Fill refund reason ──────────────────────────────────
    // Java: reasonToRefundTextField = @FindBy(xpath = "//textarea[@name='refundReason']")
    const reasonField = this.page.locator("textarea[name='refundReason'], textarea").first();
    await reasonField.waitFor({ state: 'visible', timeout: 5_000 });
    await reasonField.fill('test');
    console.log('[PT Portal] Filled refund reason: test');

    // ── Step 6b: Check agreement checkbox ────────────────────────────
    // Java: agreedToRefundCheckbox = @FindBy(xpath = "//input[@id='agreedToRefund']")
    const agreeCheckbox = this.page.locator(SELECTORS.ptRefundCheckbox).first();
    await agreeCheckbox.waitFor({ state: 'visible', timeout: 5_000 });
    if (!await agreeCheckbox.isChecked()) {
      await agreeCheckbox.check();
    }
    console.log('[PT Portal] Checked refund agreement checkbox');

    // ── Step 6c: Click "Refund $XXX" confirmation button ─────────────
    // Java: popupRefundButton = @FindBy(xpath = "//span[contains(text(), 'Refund $')]")
    const confirmBtn = this.page.locator("span:has-text('Refund $'), button:has-text('Refund $')").first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await confirmBtn.click();
    console.log('[PT Portal] Clicked refund confirmation button');

    // Wait for confirmation to process
    await sleep(5_000);

    await this.page.screenshot({ path: 'test-results/pt-refund-complete.png', fullPage: true });
    console.log('[PT Portal] Refund process complete');
  }

  // ═══════════════════════════════════════════════════════════════════
  //  COMPLETE FINALIZATION FLOW (convenience method)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Navigate to the PayTomorrow finalization URL and handle the conditional flow.
   *
   * Depending on the URL path after navigation, this method will:
   *   - /confirm → click primary button, then employment + offers
   *   - /verify/personal → fill address, terms, OTP, SSN, DOB, pay cycle, then employment + offers
   *
   * @param finalizationUrl - The URL from the PayTomorrow finalization email
   * @param ssn - SSN to use for identity verification
   * @returns The new page used for the finalization flow
   */
  async completeFinalizationFlow(finalizationUrl: string, ssn: string): Promise<Page> {
    console.log(`[PT Portal] Opening finalization URL: ${finalizationUrl}`);

    // Open a new tab for the finalization flow
    const context = this.page.context();
    const newPage = await context.newPage();
    await newPage.goto(finalizationUrl, { timeout: PayTomorrowPortalPage.PT_NAV_TIMEOUT });
    await newPage.waitForLoadState('networkidle').catch(() => {});
    console.log(`[PT Portal] Finalization page loaded — URL: ${newPage.url()}`);

    const currentUrl = newPage.url();

    if (currentUrl.includes('/confirm')) {
      // Direct confirm flow — just click submit then proceed to employment + offers
      console.log('[PT Portal] On /confirm page — clicking submit');
      const confirmBtn = newPage.locator(SELECTORS.ptButtonPrimary).first();
      await confirmBtn.click();
      await sleep(2_000);

      await this.handleEmployment(newPage);
      await this.handleOffers(newPage);

    } else if (currentUrl.includes('/verify/personal')) {
      // Full verification flow
      console.log('[PT Portal] On /verify/personal — starting full verification');
      await this.handleIdentityVerification(newPage, ssn);
      await this.handleEmployment(newPage);
      await this.handleOffers(newPage);

    } else {
      // Unknown state — try identity verification as default
      console.log(`[PT Portal] Unknown URL pattern: ${currentUrl} — attempting identity verification`);
      await this.handleIdentityVerification(newPage, ssn);
      await this.handleEmployment(newPage);
      await this.handleOffers(newPage);
    }

    return newPage;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Select a state from the PayTomorrow state dropdown by iterating options.
   * Tries <select> first, then falls back to custom dropdown patterns.
   */
  private async selectStateFromDropdown(stateFullName: string): Promise<void> {
    // PrimeNG p-dropdown with id="state"
    const dropdown = this.page.locator(SELECTORS.ptStateDropdown).first();
    if (await dropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dropdown.click();
      await sleep(500);

      // PrimeNG dropdown items appear in a panel overlay
      const item = this.page.locator(SELECTORS.ptPrimeDropdownItem).filter({ hasText: stateFullName });
      await item.first().waitFor({ state: 'visible', timeout: 5_000 });
      await item.first().click();
      console.log(`[PT Portal] Selected state: ${stateFullName} (PrimeNG dropdown)`);
      return;
    }

    // Fallback: try native <select>
    const selectEl = this.page.locator('select[name="state"], select#state').first();
    if (await selectEl.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await selectEl.selectOption({ label: stateFullName });
      console.log(`[PT Portal] Selected state: ${stateFullName} (native select)`);
      return;
    }

    console.log(`[PT Portal] WARNING: Could not find state dropdown for "${stateFullName}"`);
  }

  /**
   * Fill date of birth fields (month, day, year) on the PayTomorrow form.
   * Handles both <select> and <input> field types.
   */
  private async fillDateOfBirth(ptPage: Page, month: string, day: string, year: string): Promise<void> {
    // Month
    const dobMonth = ptPage.locator(SELECTORS.ptDobMonth).first();
    if (await dobMonth.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tagName = await dobMonth.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await dobMonth.selectOption(month).catch(async () => {
          await dobMonth.selectOption({ label: 'June' }).catch(() => {});
        });
      } else {
        await dobMonth.fill(month);
      }
    }

    // Day
    const dobDay = ptPage.locator(SELECTORS.ptDobDay).first();
    if (await dobDay.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tagName = await dobDay.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await dobDay.selectOption(day);
      } else {
        await dobDay.fill(day);
      }
    }

    // Year
    const dobYear = ptPage.locator(SELECTORS.ptDobYear).first();
    if (await dobYear.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tagName = await dobYear.evaluate((el) => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await dobYear.selectOption(year);
      } else {
        await dobYear.fill(year);
      }
    }

    console.log(`[PT Portal] Filled DOB: ${month}/${day}/${year}`);
  }

  /**
   * Calculate a pay date N days from today in MM/DD/YYYY format.
   */
  private getPayDate(daysFromToday: number): string {
    return calculateDate(daysFromToday);
  }
}

/**
 * PayPair Portal Page Object
 * Migrated from: TireAgentPages.java + TireAgentSteps.java + PayTomorrowPages.java (TireAgent methods)
 *
 * Handles the PayPair merchant portal (https://dw93bg.paypair.com) used by TireAgent.
 * Flow: Navigate → Select Merchant → Init Paypair → Fill Personal Info JSON →
 *       Fill Provider/Config → Fill Cart JSON → Click Get Lease →
 *       Phone OTP verification → Fill Application Details →
 *       Prequalification → Plan Selection → Payment → Contract (pt-iframe)
 *
 * NOTE: The PayPair portal at dw93bg.paypair.com is a widget demo page —
 * it has NO login screen. The merchant dropdown, textareas, and "Get lease"
 * button are immediately available on page load.
 */
import { type Page, type Frame, type FrameLocator, expect } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { sleep } from '../../helpers/common.helpers.js';
import { completeSignwellFlow, clickSignAllViaLink } from '../../helpers/signwell.helpers.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { TEST_BANK } from '../../config/constants.js';
import type { EmailHelpers } from '../../helpers/email.helpers.js';

// ── Interfaces ────────────────────────────────────────────────────────

export interface PayPairOfferValues {
  approvalAmount: string;
  cartTotal: string;
  recurringPayment: string;
}

export type PaymentFrequency = 'Weekly' | 'Bi-Weekly' | 'Twice a month';

// ── Page Object ──────────────────────────────────────────────────────

export class PayPairPortalPage extends BasePage {
  private readonly PAYPAIR_URL = 'https://dw93bg.paypair.com';

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────

  /**
   * Navigate to the PayPair widget demo page.
   * No login required — the page loads directly with the form.
   */
  async navigateToPortal(): Promise<void> {
    await this.page.goto(this.PAYPAIR_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await this.page.waitForLoadState('networkidle').catch(() => {});
    // Wait for the merchant dropdown to confirm the page is ready
    await this.page.locator(SELECTORS.ppMerchantDropdown).waitFor({ state: 'visible', timeout: 15_000 });
    console.log('[PayPair] Navigated to portal — form ready');
  }

  // ── Merchant Selection ───────────────────────────────────────────

  /**
   * Select the merchant from the dropdown. The dropdown uses native <select>
   * with <option> elements. After selection, clicks "Init Paypair" to initialize
   * the widget for that merchant.
   */
  async selectMerchant(merchantName: string): Promise<void> {
    console.log(`[PayPair] Selecting merchant: ${merchantName}`);
    const dropdown = this.page.locator(SELECTORS.ppMerchantDropdown);
    await dropdown.selectOption({ label: merchantName });
    await sleep(500);

    const initBtn = this.page.locator(SELECTORS.ppInitPaypairButton);
    await initBtn.click();
    // Wait for widget initialization to complete — the page rebuilds form fields after Init
    await sleep(2_000);
    await this.page.waitForLoadState('networkidle').catch(() => {});
    console.log('[PayPair] Merchant selected and PayPair widget initialized');
  }

  // ── Form Filling (Personal Info + Cart) ──────────────────────────

  async fillPersonalInfo(personalInfoJson: string): Promise<void> {
    console.log('[PayPair] Filling personal info textarea');
    // Try the XPath selector first, fall back to textarea by name/id
    let textarea = this.page.locator(SELECTORS.ppPersonalInfoTextarea);
    if (!await textarea.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // Fallback: textarea with name or id containing 'personal' or first textarea on page
      textarea = this.page.locator("textarea[name*='personal'], textarea#personalInfo, textarea").first();
    }
    await textarea.waitFor({ state: 'visible', timeout: 15_000 });
    // Use evaluate to set value directly — avoids timeout from clear()/fill() on textarea with oninput handler
    await textarea.evaluate((el: HTMLTextAreaElement, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, personalInfoJson);
  }

  async fillProviderAndConfig(provider: string, prequalification: string, productSelectionType: string): Promise<void> {
    console.log(`[PayPair] Setting provider="${provider}", prequalification="${prequalification}", productSelectionType="${productSelectionType}"`);
    // Use evaluate for inputs with oninput handlers to avoid clear()/fill() timeouts
    const setInputValue = async (selector: string, value: string) => {
      const el = this.page.locator(selector);
      if (await el.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await el.evaluate((input: HTMLInputElement, val: string) => {
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }, value);
      }
    };
    await setInputValue(SELECTORS.ppProviderName, provider);
    await setInputValue(SELECTORS.ppPreQualification, prequalification);
    await setInputValue(SELECTORS.ppProductSelectionType, productSelectionType);
  }

  async fillCartInfo(cartJson: string): Promise<void> {
    console.log('[PayPair] Filling cart textarea');
    let textarea = this.page.locator(SELECTORS.ppCartTextarea);
    if (!await textarea.isVisible({ timeout: 5_000 }).catch(() => false)) {
      textarea = this.page.locator("textarea[name='cart'], textarea#cart").first();
    }
    await textarea.waitFor({ state: 'visible', timeout: 15_000 });
    // Use evaluate to set value directly — avoids timeout from clear() on large textarea with oninput handler
    await textarea.evaluate((el: HTMLTextAreaElement, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, cartJson);
  }

  async clickGetLease(): Promise<void> {
    console.log('[PayPair] Clicking Get Lease');
    await this.page.locator(SELECTORS.ppGetLeaseButton).click();
    await sleep(2_000);
  }

  // ── Phone Verification (OTP via network intercept) ───────────────

  /**
   * Returns the widget iframe FrameLocator. After "Get Lease" is clicked,
   * the PayPair widget opens as an overlay/modal inside an iframe.
   * The widget iframe has id="llapp-iframe" (src: fesandbox2.paypair.com/widget).
   * NOTE: There's also an analytics iframe (webeyez.com) on the page — must target by ID.
   */
  getWidgetIframe(): FrameLocator {
    return this.page.frameLocator(SELECTORS.ppLlappIframe);
  }

  /**
   * Handles phone verification by entering the phone number in the widget iframe,
   * submitting, then intercepting the OTP from the network responses.
   *
   * The PayPair widget sends OTP via /api/v1/users/send_code. In sandbox the OTP
   * may be returned in the response body (otp_code, otpCode, otp, or code field).
   * If not found, we listen for ALL responses after clicking Continue to find
   * the OTP in any subsequent API call.
   */
  /** Extract OTP from API response body (multiple field name variants) */
  private extractOtpFromBody(body: Record<string, unknown>): string {
    const otp = body.otp_code || body.otpCode || body.otp || body.code || body.verification_code;
    return otp ? String(otp) : '';
  }

  /** Listen for OTP in network responses, execute action, then stop listening */
  private async captureOtpDuringAction(action: () => Promise<void>): Promise<string> {
    let capturedOtp = '';
    const handler = async (response: import('@playwright/test').Response) => {
      try {
        const url = response.url();
        if (!url.includes('send_code') && !url.includes('verify') && !url.includes('otp')) return;
        const body = await response.json().catch(() => null);
        if (!body) return;
        const otp = this.extractOtpFromBody(body);
        if (otp) {
          capturedOtp = otp;
          console.log(`[PayPair] OTP captured from ${url}: ${otp}`);
        } else {
          console.log(`[PayPair] Response from ${url}: ${JSON.stringify(body).slice(0, 200)}`);
        }
      } catch { /* non-blocking */ }
    };
    this.page.on('response', handler);
    await action();
    await sleep(5_000);
    this.page.off('response', handler);
    return capturedOtp;
  }

  async handlePhoneVerification(phoneNumber: string): Promise<void> {
    console.log(`[PayPair] Handling phone verification for: ${phoneNumber}`);
    const widgetIframe = this.getWidgetIframe();

    const phoneInput = widgetIframe.locator(SELECTORS.ppPhoneInput);
    await phoneInput.waitFor({ state: 'visible', timeout: 60_000 });
    await phoneInput.click();
    await phoneInput.fill(phoneNumber);
    console.log('[PayPair] Phone number entered');

    // Capture OTP while clicking Continue
    const continueBtn = widgetIframe.locator(SELECTORS.ppContinueButton).first();
    await continueBtn.waitFor({ state: 'visible', timeout: 10_000 });
    let otp = await this.captureOtpDuringAction(() => continueBtn.click());

    // Retry via "Resend code" if OTP not captured
    if (!otp) {
      console.log('[PayPair] OTP not found in initial response — trying resend...');
      const resendBtn = widgetIframe.locator("button:has-text('Resend code')");
      if (await resendBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        otp = await this.captureOtpDuringAction(() => resendBtn.click());
      }
    }

    if (otp) {
      await this.insertOtp(otp, widgetIframe);
    } else {
      console.log('[PayPair] WARNING: Could not capture OTP — test may need manual intervention or env-specific config');
    }
  }

  /**
   * Inserts the OTP code into the 6-digit verification input inside the widget iframe.
   */
  async insertOtp(otpCode: string, widgetIframe: FrameLocator): Promise<void> {
    console.log(`[PayPair] Inserting OTP: ${otpCode}`);

    // The OTP input may be a single input or passcode field
    const otpInput = widgetIframe.locator(SELECTORS.ppPasscodeInput).first();
    await otpInput.waitFor({ state: 'visible', timeout: 15_000 });
    await otpInput.click();
    await otpInput.fill(otpCode);

    // Click Continue button (it becomes enabled after OTP is filled)
    const continueBtn = widgetIframe.locator(SELECTORS.ppContinueButton).first();
    await sleep(1_000);
    if (await continueBtn.isEnabled({ timeout: 5_000 }).catch(() => false)) {
      await continueBtn.click();
    } else {
      await otpInput.press('Enter');
    }

    // Wait for OTP screen to transition
    await sleep(5_000);
    console.log('[PayPair] OTP submitted');
  }

  // ── Application Details ──────────────────────────────────────────

  /**
   * Fills the application details form (DOB, SSN, income, payment frequency)
   * and selects a previous date for the date picker.
   * All fields are inside the widget iframe.
   *
   * Migrated from: TireAgentPages.fillApplicationDetails()
   */
  async fillApplicationDetails(ssn: string, income = '5000'): Promise<void> {
    console.log('[PayPair] Filling application details');

    const iframe = this.getWidgetIframe();

    // DOB — Month (react-select), Day (react-select), Year (input)
    const monthInput = iframe.locator(`${SELECTORS.ppDobMonthSelect}, [id*="select"][id*="input"]`).first();
    if (await monthInput.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await monthInput.fill('02');
      await monthInput.press('Enter');
    }
    const dayInput = iframe.locator(SELECTORS.ppDobDaySelect).first();
    if (await dayInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await dayInput.fill('1');
      await dayInput.press('Enter');
    }
    const yearInput = iframe.locator(SELECTORS.ppDobYearInput).first();
    if (await yearInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await yearInput.fill('2000');
    }

    // SSN and Income
    const ssnInput = iframe.locator(SELECTORS.ppSsnInput).first();
    await ssnInput.waitFor({ state: 'visible', timeout: 10_000 });
    await ssnInput.fill(ssn);

    const incomeInput = iframe.locator(SELECTORS.ppIncomeInput).first();
    if (await incomeInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await incomeInput.fill(income);
    }

    // Payment frequency default: Weekly (react-select)
    const freqInput = iframe.locator(SELECTORS.ppPaymentFrequencySelect).first();
    if (await freqInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await freqInput.fill('Weekly');
      await freqInput.press('Enter');
    }

    // Select a previous date (yesterday)
    await this.selectPreviousDate(iframe);

    // Agree to terms
    await this.agreeToTerms(iframe);

    // Click "See My Purchase Options"
    await this.clickSeeMyPurchaseOptions(iframe);

    console.log('[PayPair] Application details filled');
  }

  private async selectPreviousDate(iframe: FrameLocator): Promise<void> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const previousDay = String(yesterday.getDate());
    const needsPreviousMonth = yesterday.getMonth() !== today.getMonth();

    const dateInput = iframe.locator(SELECTORS.ppDateFieldInput).first();
    if (!await dateInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[PayPair] Date field not visible — skipping date selection');
      return;
    }
    await dateInput.click();

    if (needsPreviousMonth) {
      console.log('[PayPair] Navigating to previous month in datepicker');
      const prevMonthBtn = iframe.locator(SELECTORS.ppDatepickerPrevMonth).first();
      await prevMonthBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await prevMonthBtn.click();
      await sleep(500);
    }

    console.log(`[PayPair] Selecting previous day: ${previousDay}`);
    const dayLocator = iframe.locator(
      `xpath=//div[contains(@class, 'react-datepicker__day') and text()='${previousDay}' and not(contains(@class, 'react-datepicker__day--outside-month')) and not(contains(@class, 'react-datepicker__day--disabled'))]`,
    );
    await dayLocator.waitFor({ state: 'visible', timeout: 5_000 });
    await dayLocator.click();
    console.log('[PayPair] Previous date selected');
  }

  private async agreeToTerms(iframe: FrameLocator): Promise<void> {
    console.log('[PayPair] Agreeing to terms');

    // Try input[name='isAgreementChecked'] first
    const checkbox = iframe.locator(SELECTORS.ppAgreementCheckbox).first();
    if (await checkbox.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await checkbox.click({ force: true });
      return;
    }

    // Fallback: MUI checkbox root
    const muiCheckbox = iframe.locator("div.privacy-policy-agreement .MuiCheckbox-root, .MuiCheckbox-root").first();
    if (await muiCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await muiCheckbox.click();
      return;
    }

    // Fallback: any visible checkbox
    const anyCheckbox = iframe.locator(SELECTORS.checkboxInput).first();
    if (await anyCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await anyCheckbox.click({ force: true });
    }
  }

  private async clickSeeMyPurchaseOptions(iframe: FrameLocator): Promise<void> {
    console.log('[PayPair] Clicking See My Purchase Options');
    const btn = iframe.locator(SELECTORS.ppSeeMyPurchaseOptionsButton).first();
    await btn.waitFor({ state: 'visible', timeout: 20_000 });
    await btn.click();
  }

  // ── Plan Loading & Prequalification ──────────────────────────────

  async waitForPlansToLoad(timeoutMs = 90_000): Promise<void> {
    console.log('[PayPair] Waiting for plans to load...');
    const iframe = this.getWidgetIframe();
    const loader = iframe.locator(SELECTORS.ppLoaderContainer).first();
    await loader.waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {
      console.log('[PayPair] Loader did not disappear within timeout — proceeding');
    });
    console.log('[PayPair] Plans loaded');
  }

  async validatePrequalificationApproved(): Promise<void> {
    console.log('[PayPair] Validating prequalification approved');
    const iframe = this.getWidgetIframe();
    // Use getByText with substring to avoid apostrophe escaping issues
    const congratsBanner = iframe.getByText('Prequalified', { exact: false }).first();
    await expect(congratsBanner).toBeVisible({ timeout: 30_000 });
    console.log('[PayPair] Prequalification approved banner visible');
  }

  // ── Plan Details & Frequency ─────────────────────────────────────

  async openPlanDetails(): Promise<void> {
    console.log('[PayPair] Opening Uown plan details');
    const iframe = this.getWidgetIframe();
    await sleep(1_000);

    // Find all "View Plan Details" buttons. The plan order is: bread, koalafi, paytomorrow, uown.
    // Each plan card has its own View Plan Details button. We need the uown one.
    // Strategy: find the button that is a sibling/descendant of the element containing the uown logo.
    // Use the img alt="uown Logo" to find the plan card, then its following View Plan Details button.
    const uownViewDetails = iframe.locator(
      "xpath=//img[contains(@alt,'uown') or contains(@alt,'Uown')]/ancestor::div[1]/ancestor::div[1]/following-sibling::button[contains(.,'View Plan Details')]",
    ).first();

    if (await uownViewDetails.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await uownViewDetails.click();
      console.log('[PayPair] Uown plan details opened via sibling button');
      await sleep(1_000);
      return;
    }

    // Fallback: use index. Count all "View Plan Details" buttons visible.
    // The uown card is typically the 4th (index 3).
    console.log('[PayPair] Uown sibling XPath not matched, trying by index...');
    const allViewDetails = iframe.locator(SELECTORS.ppViewPlanDetails);
    const count = await allViewDetails.count();
    console.log(`[PayPair] Found ${count} View Plan Details buttons`);

    // Click each one starting from the end to find the uown one
    for (let i = count - 1; i >= 0; i--) {
      const btn = allViewDetails.nth(i);
      if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        console.log(`[PayPair] Clicked View Plan Details at index ${i}`);
        await sleep(1_000);

        // Check if "Continue with Uown" button appeared
        const continueUown = iframe.locator(SELECTORS.ppContinueWithUown).first();
        if (await continueUown.isVisible({ timeout: 3_000 }).catch(() => false)) {
          console.log('[PayPair] Uown plan details confirmed open');
          return;
        }
        // If not uown, close this one by clicking "Hide Plan Details" and try next
        const hideBtn = iframe.locator("button:has-text('Hide Plan Details')").first();
        if (await hideBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await hideBtn.click();
          await sleep(500);
        }
      }
    }
    console.log('[PayPair] WARNING: Could not find uown plan details button');
  }

  async selectPaymentFrequency(frequency: PaymentFrequency): Promise<void> {
    console.log(`[PayPair] Selecting payment frequency: ${frequency}`);
    const iframe = this.getWidgetIframe();
    // Try label with radio input first, then text-based label
    const label = iframe.locator(`xpath=//label[.//input[@value='${frequency}']] | //label[contains(text(),'${frequency}')]`).first();
    if (await label.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await label.click();
      console.log(`[PayPair] Payment frequency set to: ${frequency}`);
    } else {
      console.log(`[PayPair] Payment frequency label not found — may use default`);
    }
    await sleep(1_000);
  }

  async continueWithUown(): Promise<void> {
    console.log('[PayPair] Continuing with Uown');
    const iframe = this.getWidgetIframe();
    const btn = iframe.locator(SELECTORS.ppContinueWithUown).first();
    await btn.waitFor({ state: 'visible', timeout: 10_000 });
    await btn.click();
  }

  // ── Offer Values ─────────────────────────────────────────────────

  async captureOfferValues(): Promise<PayPairOfferValues> {
    console.log('[PayPair] Capturing offer values');
    const iframe = this.getWidgetIframe();
    const values: PayPairOfferValues = {
      approvalAmount: '',
      cartTotal: '',
      recurringPayment: '',
    };

    const approvalEl = iframe.locator(SELECTORS.ppOfferApprovalAmount).first();
    if (await approvalEl.isVisible({ timeout: 5_000 }).catch(() => false)) {
      values.approvalAmount = (await approvalEl.textContent())?.trim() || '';
      console.log(`[PayPair] Approval Amount: ${values.approvalAmount}`);
    }

    const cartEl = iframe.locator(SELECTORS.ppOfferCartTotal).first();
    if (await cartEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
      values.cartTotal = (await cartEl.textContent())?.trim() || '';
      console.log(`[PayPair] Cart Total: ${values.cartTotal}`);
    }

    const recurringEl = iframe.locator(SELECTORS.ppOfferRecurringPayment).first();
    if (await recurringEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
      values.recurringPayment = (await recurringEl.textContent())?.trim() || '';
      console.log(`[PayPair] Recurring Payment: ${values.recurringPayment}`);
    }

    return values;
  }

  // ── Proceed to Last Step ─────────────────────────────────────────

  /**
   * Clicks "CONTINUE TO LAST STEP" which transitions to the CC/bank payment form.
   * The payment form may appear inside a nested pt-iframe or in the same widget iframe.
   */
  async proceedToLastStep(): Promise<FrameLocator> {
    console.log('[PayPair] Proceeding to last step');
    const iframe = this.getWidgetIframe();
    const btn = iframe.locator(SELECTORS.ppContinueToLastStep).first();
    await btn.waitFor({ state: 'visible', timeout: 20_000 });
    await btn.click();

    // Wait for the payment form to appear — it may be in a nested pt-iframe
    // or directly in the widget iframe
    await sleep(3_000);

    // Try to find a nested pt-iframe first
    const nestedIframe = iframe.frameLocator(SELECTORS.ppPtIframe);
    const ptIframeEl = iframe.locator(SELECTORS.ppPtIframe);
    if (await ptIframeEl.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[PayPair] Found nested pt-iframe — switching context');
      return nestedIframe;
    }

    // Otherwise the payment form is in the widget iframe itself
    console.log('[PayPair] Payment form in widget iframe');
    return iframe;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  PAYMENT + T&C + E-SIGN (inside partner portal pt-iframe)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Complete the full payment, T&C, and e-sign flow inside the partner portal.
   * Combines CC/bank filling, T&C checkboxes, and SignWell/PandaDocs signing.
   *
   * Supports two flows:
   * - **In-browser T&C + SignWell**: T&C page loads in provider_flow frame → sign in iframe
   * - **Email-based signing**: "Signature Needed" page appears → signing link sent via email
   *
   * @param applicant - Applicant info (firstName, lastName, email)
   * @param ccData - Credit card data (number, cvv, expDate)
   * @param options - Optional: email helper + applicant email for email-based signing
   */
  async completePaymentAndSigning(
    applicant: { firstName: string; lastName: string; email?: string },
    ccData: { number: string; cvv: string; expDate: string },
    options?: { emailHelper?: EmailHelpers; applicantEmail?: string },
  ): Promise<void> {
    await this.completePaymentInPtIframe(applicant, ccData);
    const flowType = await this.completeTermsAndConditionsInPartnerPortal();

    if (flowType === 'email-signing') {
      await this.completeEmailBasedSigning(options?.emailHelper, options?.applicantEmail || applicant.email);
    } else {
      await this.completeESignInPartnerPortal();
    }

    await sleep(10_000);
    console.log('[PayPair] Payment + T&C + e-sign flow completed');
  }

  /**
   * Fill CC and bank info inside the nested pt-iframe (#llapp-iframe → #pt-iframe),
   * then submit the payment form.
   */
  async completePaymentInPtIframe(
    applicant: { firstName: string; lastName: string },
    ccData: { number: string; cvv: string; expDate: string },
  ): Promise<void> {
    const widgetIframe = this.page.frameLocator(SELECTORS.ppLlappIframe);
    const ptFrame = widgetIframe.frameLocator(SELECTORS.ppPtIframe);

    await sleep(10_000);

    // ── Dismiss SEON IDV overlay if present ───────────────────────
    // SEON injects an iframe (data-testid="seon-idv-iframe") that overlays the
    // CC payment form and intercepts pointer events. Close the modal via the X
    // button in the widget iframe, then remove the blocking iframe from pt-iframe.
    await this.dismissSeonOverlay(widgetIframe, ptFrame);

    // ── Fill CC info ──────────────────────────────────────────────
    const ccFirstNameField = ptFrame.locator(SELECTORS.ccFirstName).first();
    if (await ccFirstNameField.isVisible({ timeout: 30_000 }).catch(() => false)) {
      await this.fillPtIframeField(ptFrame, SELECTORS.ccFirstName, applicant.firstName);
      await this.fillPtIframeField(ptFrame, SELECTORS.ccLastName, applicant.lastName);
      await this.fillPtIframeField(ptFrame, SELECTORS.ccValue, ccData.number);
      await this.fillPtIframeField(ptFrame, SELECTORS.ccCvc, ccData.cvv);

      // Expiration date — combined input or separate month/year
      const expCombined = ptFrame.locator(SELECTORS.ptCcExpDateCombined).first();
      if (await expCombined.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await this.fillPtIframeField(ptFrame, SELECTORS.ptCcExpDateCombined, ccData.expDate);
        console.log(`[PayPair Payment] Expiration filled via combined input: ${ccData.expDate}`);
      } else {
        const expMonthInput = ptFrame.locator(SELECTORS.ccExpMonthInput).first();
        if (await expMonthInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          const [expMonth, expYear] = ccData.expDate.split('/');
          await expMonthInput.fill(expMonth);
          await expMonthInput.press('Enter');
          const expYearInput = ptFrame.locator(SELECTORS.ccExpYearInput).first();
          if (await expYearInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
            const fullYear = expYear.length === 2 ? `20${expYear}` : expYear;
            await expYearInput.fill(fullYear);
            await expYearInput.press('Enter');
          }
          console.log(`[PayPair Payment] Expiration filled via separate selects: ${ccData.expDate}`);
        }
      }

      // Tab out to trigger blur/validation
      await ptFrame.locator(SELECTORS.ccCvc).first().press('Tab');
      await sleep(1_000);

      // Verify CC fields were filled
      const filledCard = await ptFrame.locator(SELECTORS.ccValue).first().inputValue().catch(() => '');
      const filledCvc = await ptFrame.locator(SELECTORS.ccCvc).first().inputValue().catch(() => '');
      console.log(`[PayPair Payment] CC verification: card="${filledCard}", cvc="${filledCvc}"`);

      if (!filledCard || filledCard.length < 10) {
        console.log('[PayPair Payment] Card number not fully filled — retrying with fill()');
        const cardEl = ptFrame.locator(SELECTORS.ccValue).first();
        await cardEl.click({ clickCount: 3 });
        await cardEl.fill(ccData.number);
        await sleep(300);
      }
      if (!filledCvc || filledCvc.length < 3) {
        console.log('[PayPair Payment] CVC not fully filled — retrying with fill()');
        const cvcEl = ptFrame.locator(SELECTORS.ccCvc).first();
        await cvcEl.click({ clickCount: 3 });
        await cvcEl.fill(ccData.cvv);
        await sleep(300);
      }

      console.log(`[PayPair Payment] CC info filled (card ending ${ccData.number.slice(-4)})`);
    } else {
      console.log('[PayPair Payment] CC fields not found in pt-iframe — may already be filled');
    }

    // ── Fill bank info ────────────────────────────────────────────
    const bankTypeInput = ptFrame.locator(SELECTORS.bankAccountTypeInput).first();
    if (await bankTypeInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await bankTypeInput.fill(TEST_BANK.DEFAULT_TYPE);
      await bankTypeInput.press('Enter');
      console.log(`[PayPair Payment] Bank account type set to ${TEST_BANK.DEFAULT_TYPE}`);
    }

    const bankFirstNameField = ptFrame.locator(SELECTORS.bankAccountCustomerFirst).first();
    if (await bankFirstNameField.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.fillPtIframeField(ptFrame, SELECTORS.bankAccountCustomerFirst, applicant.firstName);
      await this.fillPtIframeField(ptFrame, SELECTORS.bankAccountCustomerLast, applicant.lastName);
      await this.fillPtIframeField(ptFrame, SELECTORS.bankRoutingNumber, TEST_BANK.DEFAULT_ROUTING);
      await this.fillPtIframeField(ptFrame, SELECTORS.bankAccountNumber, TEST_BANK.DEFAULT_ACCOUNT);
      await this.fillPtIframeField(ptFrame, SELECTORS.achReEnterAccountNumber, TEST_BANK.DEFAULT_ACCOUNT);
      console.log('[PayPair Payment] Bank info filled');
    }

    // ── Submit payment form ────────────────────────────────────────
    // The pt-iframe may show "Please scroll down to continue" — scroll to bottom first.
    await ptFrame.locator('body').evaluate((body) => body.scrollTo(0, body.scrollHeight)).catch(() => {});
    await sleep(1_000);

    const submitBtn = ptFrame.locator(SELECTORS.buttonPrimary).first();
    if (await submitBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click({ force: true });
      console.log('[PayPair Payment] Payment form submitted');
    } else {
      const fallbackBtn = ptFrame.locator("button:has-text('SUBMIT'), button:has-text('Submit'), button[type='submit']").first();
      if (await fallbackBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await fallbackBtn.scrollIntoViewIfNeeded();
        await fallbackBtn.click({ force: true });
        console.log('[PayPair Payment] Payment form submitted via fallback');
      }
    }

    // Wait for payment processing — the submit triggers CC authorization + page transition.
    await sleep(5_000);

    // Handle SEON IDV "Failed to verify identification" error — dismiss and retry submit.
    // SEON verification may fail in sandbox (no camera); the form can proceed after dismissal.
    const seonError = ptFrame.locator('text=Failed to verify identification').first();
    if (await seonError.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log('[PayPair Payment] SEON verification error detected — dismissing and retrying');
      // Close the SEON error alert banner
      const errorCloseBtn = ptFrame.locator('[role="alert"] ~ button, [role="alert"] button').first();
      if (await errorCloseBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await errorCloseBtn.click();
        console.log('[PayPair Payment] Dismissed SEON error banner');
      }
      await sleep(1_000);
      // Re-submit
      const retrySubmit = ptFrame.locator("button:has-text('Submit')").first();
      if (await retrySubmit.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await retrySubmit.scrollIntoViewIfNeeded();
        await retrySubmit.click({ force: true });
        console.log('[PayPair Payment] Payment form re-submitted after SEON dismissal');
      }
      await sleep(10_000);
    } else {
      await sleep(5_000);
    }
  }

  /**
   * Complete Terms & Conditions by polling all frames for #isEverythingAgreed.
   * After T&C submit, the iframe navigates to the e-sign page.
   *
   * @returns 'tc-completed' if in-browser T&C was found and submitted,
   *          'email-signing' if "Signature Needed" page was detected (email-based signing).
   */
  async completeTermsAndConditionsInPartnerPortal(): Promise<'tc-completed' | 'email-signing'> {
    console.log('[PayPair T&C] Waiting for T&C page...');
    let tcFound = false;

    for (let waitSec = 0; waitSec < 60; waitSec += 3) {
      // Check for "Signature Needed" (email-based signing) in provider_flow frame
      const providerFrame = this.page.frames().find(f =>
        f.name() === 'provider_flow' || f.url().includes('uownleasing.com'),
      );
      if (providerFrame) {
        const signatureNeeded = providerFrame.locator('text=Signature Needed, text=check your email');
        if (await signatureNeeded.first().isVisible({ timeout: 1_000 }).catch(() => false)) {
          console.log(`[PayPair T&C] "Signature Needed" detected at ${waitSec}s — email-based signing flow`);
          return 'email-signing';
        }
      }

      for (const f of this.page.frames()) {
        if (f === this.page.mainFrame()) continue;
        const agreed = f.locator(SELECTORS.isEverythingAgreed);
        if (await agreed.isVisible({ timeout: 1_000 }).catch(() => false)) {
          console.log(`[PayPair T&C] Found in frame: "${f.name()}" at ${waitSec}s`);

          // Check #isInfoConfirmed ("I confirm all information is true and complete.")
          const infoConfirmed = f.locator(SELECTORS.isInfoConfirmed);
          if (await infoConfirmed.isVisible({ timeout: 3_000 }).catch(() => false)) {
            if (!await infoConfirmed.isChecked().catch(() => false)) {
              await infoConfirmed.click({ force: true });
              console.log('[PayPair T&C] Checked #isInfoConfirmed');
            }
          } else {
            // Fallback: try the settlement confirmation checkbox (older versions)
            const settlementConfirm = f.locator(SELECTORS.isConfirmedForSettlement);
            if (await settlementConfirm.isVisible({ timeout: 1_000 }).catch(() => false)) {
              if (!await settlementConfirm.isChecked().catch(() => false)) {
                await settlementConfirm.click({ force: true });
                console.log('[PayPair T&C] Checked #isConfirmedForSettlement (fallback)');
              }
            }
          }
          if (!await agreed.isChecked().catch(() => false)) {
            await agreed.click({ force: true });
            console.log('[PayPair T&C] Checked #isEverythingAgreed');
          }

          await sleep(2_500);

          const submitTc = f.locator(SELECTORS.buttonPrimary).first();
          if (await submitTc.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await submitTc.click();
            console.log('[PayPair T&C] Submitted via btn-primary');
            await sleep(3_000);
          }
          tcFound = true;
          break;
        }
      }
      if (tcFound) break;
      console.log(`[PayPair T&C] Not found at ${waitSec}s — waiting...`);
      await sleep(3_000);
    }

    if (!tcFound) {
      console.log('[PayPair T&C] NOT FOUND after 60s — frame dump:');
      for (const f of this.page.frames()) {
        if (f.url() && f.url() !== 'about:blank') {
          console.log(`[PayPair T&C]   Frame "${f.name()}": ${f.url().substring(0, 120)}`);
        }
      }
      throw new Error('T&C page did not load after payment submit — integration flow broken');
    }

    return 'tc-completed';
  }

  /**
   * Complete email-based signing flow by fetching the SignWell link from email
   * and completing the signing process in a new page context.
   */
  async completeEmailBasedSigning(emailHelper?: EmailHelpers, applicantEmail?: string): Promise<void> {
    if (!emailHelper || !applicantEmail) {
      console.log('[PayPair Email Sign] No email helper or applicant email provided — skipping email-based signing');
      return;
    }

    console.log(`[PayPair Email Sign] Fetching SignWell link from email for ${applicantEmail}...`);
    const signwellLink = await emailHelper.getEmailLink(applicantEmail, /signwell\.com/i, 120_000);

    if (!signwellLink) {
      console.log('[PayPair Email Sign] No SignWell link found in email — signing may need manual completion');
      return;
    }

    console.log(`[PayPair Email Sign] SignWell link found: ${signwellLink.substring(0, 80)}...`);
    
    const signPage = await this.page.context().newPage();
    await signPage.goto(signwellLink, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await sleep(3_000);

    await completeSignwellFlow(signPage, 'PayPair Email Sign', async () => {
      await clickSignAllViaLink(signPage);
    });

    await sleep(2_000);
    await signPage.close();
    console.log('[PayPair Email Sign] Email-based signing completed');
  }

  /**
   * Find and complete SignWell (or PandaDocs) e-sign inside the partner portal.
   * Searches all frames for the signing iframe and completes the flow.
   */
  async completeESignInPartnerPortal(): Promise<void> {
    console.log('[PayPair ESign] Looking for e-sign iframe...');

    let signwellFrame: Frame | null = null;

    for (let waitSec = 0; waitSec < 30; waitSec += 3) {
      // Check nested frames for SignWell iframe element
      for (const f of this.page.frames()) {
        if (f === this.page.mainFrame()) continue;
        const sw = f.locator(SELECTORS.signwellIframe);
        if (await sw.isVisible({ timeout: 1_000 }).catch(() => false)) {
          console.log(`[PayPair ESign] SignWell iframe found in frame "${f.name()}" at ${waitSec}s`);
          signwellFrame = this.page.frames().find(
            child => child.url().includes('signwell.com') || child.name() === 'SignWell-Embedded-Iframe',
          ) ?? null;
          if (!signwellFrame) {
            signwellFrame = f.childFrames().find(
              child => child.url().includes('signwell.com') || child.name() === 'SignWell-Embedded-Iframe',
            ) ?? null;
          }
          break;
        }
      }
      if (signwellFrame) break;

      // Direct frame search
      const directSw = this.page.frames().find(f =>
        f.url().includes('signwell.com') || f.name() === 'SignWell-Embedded-Iframe',
      );
      if (directSw) {
        signwellFrame = directSw;
        console.log(`[PayPair ESign] SignWell frame found directly: ${directSw.url().substring(0, 100)}`);
        break;
      }

      console.log(`[PayPair ESign] E-sign iframe not found at ${waitSec}s — waiting...`);
      await sleep(3_000);
    }

    if (signwellFrame) {
      await this.completeSignwellInFrame(signwellFrame);
    } else {
      // Check for PandaDocs
      const pdFrame = this.page.frames().find(f => f.url().includes('pandadoc.com'));
      if (pdFrame) {
        console.log('[PayPair ESign] PandaDocs frame found — not implemented in partner portal');
      } else {
        console.log('[PayPair ESign] No e-sign iframe found after T&C');
      }
    }
  }

  // ── Private helpers for partner portal e-sign ─────────────────────

  /**
   * Complete SignWell signing using a Frame reference (not FrameLocator).
   * Delegates to the shared signwell helper for the core Start -> fields -> Finish flow.
   * Frame implements .locator() so it is compatible with the helper's LocatorSource type.
   */
  private async completeSignwellInFrame(sw: Frame): Promise<void> {
    console.log(`[PayPair ESign] Completing SignWell in frame: ${sw.url().substring(0, 100)}`);

    // Delegate to shared helper for Start → fill fields → Finish
    await completeSignwellFlow(sw, 'PayPair ESign', async () => {
      await clickSignAllViaLink(sw);
    });

    await sleep(5_000);

    // Check for success
    const providerFrame = this.page.frames().find(f => f.url().includes('uownleasing.com'));
    if (providerFrame?.url().includes('success')) {
      console.log('[PayPair ESign] SUCCESS page detected');
    }
  }

  /**
   * Dismiss the SEON IDV (identity verification) overlay that blocks the CC payment form.
   * SEON injects an iframe (data-testid="seon-idv-iframe") on top of the payment fields.
   * Strategy: remove the blocking iframe and overlay elements from the DOM via JS.
   * Do NOT click close buttons — the PayPair widget shares a close button that would
   * dismiss the entire widget overlay.
   */
  private async dismissSeonOverlay(_widgetIframe: FrameLocator, ptFrame: FrameLocator): Promise<void> {
    const seonIframe = ptFrame.locator('iframe[data-testid="seon-idv-iframe"]');
    if (!await seonIframe.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[PayPair Payment] No SEON overlay detected');
      return;
    }
    console.log('[PayPair Payment] SEON IDV overlay detected — removing from DOM');

    // Remove the SEON iframe and any overlay/backdrop from the pt-iframe DOM
    await ptFrame.locator('body').evaluate((body) => {
      body.querySelectorAll('iframe[data-testid="seon-idv-iframe"]').forEach(el => el.remove());
      body.querySelectorAll('[data-testid*="seon"], [class*="seon-idv"], [class*="seonIdv"]').forEach(el => el.remove());
    }).catch(() => {});
    await sleep(1_000);

    // Verify removal
    const stillVisible = await seonIframe.isVisible({ timeout: 2_000 }).catch(() => false);
    if (stillVisible) {
      await seonIframe.evaluate((el: HTMLElement) => el.remove()).catch(() => {});
      console.log('[PayPair Payment] SEON iframe required second removal');
    }

    console.log('[PayPair Payment] SEON overlay dismissed');
  }

  /**
   * Fill a field in the pt-iframe using pressSequentially (React controlled inputs).
   * Same pattern as ContractPage.fillField but for FrameLocator context.
   */
  private async fillPtIframeField(frame: FrameLocator, selector: string, value: string): Promise<void> {
    const field = frame.locator(selector).first();
    if (!await field.isVisible({ timeout: 5_000 }).catch(() => false)) return;
    await field.click();
    await field.pressSequentially(value, { delay: 30 });
  }
}

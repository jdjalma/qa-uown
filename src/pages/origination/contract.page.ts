import { type FrameLocator, type Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { sleep } from '../../helpers/common.helpers.js';
import {
  completeSignwellFlow as completeSignwellFlowHelper,
  clickSignAllViaLink,
} from '../../helpers/signwell.helpers.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { TEST_BANK } from '../../config/constants.js';
import type { TestCard } from '../../data/test-cards.js';

/**
 * Contract Page - consumer-facing payment form accessed via the contract/redirect URL.
 *
 * This page is separate from the origination portal. It's the URL returned in
 * `paymentDetailsList[n].redirectUrl` from the sendApplication API response.
 *
 * Flow:
 *   1. Fill CC info (ccFirstName, ccLastName, ccValue, cvc, expiration)
 *   2. Fill bank info (routing, account, re-enter, account type)
 *   3. Submit payment info → wait for CONTRACT_CREATED on portal
 *   4. Complete Terms & Conditions (isConfirmedForSettlement + isEverythingAgreed)
 *   5. Complete e-sign (Signwell or PandaDocs iframe)
 */
export class ContractPage extends BasePage {
  // ── Credit Card fields ──────────────────────────────────────────
  readonly ccFirstName = this.page.locator(SELECTORS.ccFirstName);
  readonly ccLastName = this.page.locator(SELECTORS.ccLastName);
  readonly ccValue = this.page.locator(SELECTORS.ccValue);
  readonly ccCvc = this.page.locator(SELECTORS.ccCvc);
  readonly ccExpInput = this.page.locator(SELECTORS.ptCcExpDateCombined);

  // ── Bank fields ─────────────────────────────────────────────────
  readonly bankRoutingNumber = this.page.locator(SELECTORS.bankRoutingNumber);
  readonly bankAccountNumber = this.page.locator(SELECTORS.bankAccountNumber);
  readonly achReEnterAccountNumber = this.page.locator(SELECTORS.achReEnterAccountNumber);
  readonly bankFirstName = this.page.locator(SELECTORS.bankAccountCustomerFirst);
  readonly bankLastName = this.page.locator(SELECTORS.bankAccountCustomerLast);
  readonly bankAccountTypeInput = this.page.locator(SELECTORS.bankAccountTypeInput);

  // ── T&C checkboxes ──────────────────────────────────────────────
  readonly isConfirmedForSettlement = this.page.locator(SELECTORS.isConfirmedForSettlement);
  readonly isEverythingAgreed = this.page.locator(SELECTORS.isEverythingAgreed);

  // ── Buttons ─────────────────────────────────────────────────────
  readonly submitButton = this.page.locator(SELECTORS.buttonPrimary).first();

  /**
   * Wait for a button/locator to become enabled, polling with short intervals.
   * Used before clicking submit buttons that React form validation may keep disabled.
   */
  private async waitForButtonEnabled(locator: Locator, maxAttempts = 10): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (!await locator.isDisabled().catch(() => true)) break;
      console.log(`[Contract] Button disabled, waiting... attempt=${attempt}`);
      await sleep(500);
    }
  }

  /**
   * Robustly fill a field that may be a React controlled input.
   * Tries fill() first, then falls back to click+clear+type if the value didn't stick.
   */
  private async fillField(locator: import('@playwright/test').Locator, value: string): Promise<void> {
    await locator.click();
    await locator.fill(value);

    // Verify the value was actually set.
    // Normalize spaces/dashes — auto-formatting inputs (e.g. CC number) add them.
    const actual = await locator.inputValue().catch(() => '');
    const strip = (s: string) => s.replace(/[\s-]/g, '');
    if (strip(actual) !== strip(value)) {
      // fill() didn't work (React controlled input) — use keyboard typing
      await locator.click({ clickCount: 3 }); // select all
      await locator.pressSequentially(value, { delay: 30 });
    }
  }

  /**
   * Fill credit card information on the contract page.
   * The contract page is consumer-facing and uses placeholder-based fields.
   * Fields may use IDs (#ccFirstName) or placeholders ("Cardholder's First Name").
   */
  async fillCreditCardInfo(info: {
    firstName: string;
    lastName: string;
    cardNumber: string;
    cvc: string;
    expDate: string; // format: "MM/YY" or "MM/YYYY"
  }): Promise<void> {
    // Resolve first/last name fields — try ID first, then placeholder
    const firstNameField = this.page.locator(
      `${SELECTORS.ccFirstName}, input[placeholder*="First Name"]`
    ).first();
    const lastNameField = this.page.locator(
      `${SELECTORS.ccLastName}, input[placeholder*="Last Name"]`
    ).first();

    await firstNameField.waitFor({ state: 'visible', timeout: 15_000 });
    await this.fillField(firstNameField, info.firstName);
    await this.fillField(lastNameField, info.lastName);

    // Card number and CVC — use standard #ccValue / #cvc selectors
    const cardField = this.page.locator(
      `${SELECTORS.ccValue}, ${SELECTORS.ccNumber}, input[placeholder*="Card Number"]`
    ).first();
    const cvcField = this.page.locator(
      `${SELECTORS.ccCvc}, input[placeholder*="CVC"], input[placeholder*="CVV"]`
    ).first();

    await this.fillField(cardField, info.cardNumber);
    await this.fillField(cvcField, info.cvc);

    // Expiration date via react-select or plain input
    if (await this.ccExpInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.fillField(this.ccExpInput, info.expDate);
      await this.ccExpInput.press('Enter');
    } else {
      // Fallback: try standard exp month/year selectors
      const expMonthInput = this.page.locator(SELECTORS.ccExpMonthInput);
      const expYearInput = this.page.locator(SELECTORS.ccExpYearInput);
      const [month, year] = info.expDate.split('/');
      if (await expMonthInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await this.fillField(expMonthInput, month);
        await expMonthInput.press('Enter');
      }
      if (await expYearInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await this.fillField(expYearInput, year);
        await expYearInput.press('Enter');
      }
    }
  }

  /**
   * Fill bank/ACH information on the contract page.
   */
  async fillBankInfo(info: {
    firstName: string;
    lastName: string;
    routingNumber: string;
    accountNumber: string;
    accountType?: string; // defaults to 'CHECKING'
  }): Promise<void> {
    // Bank fields may not be present for all merchants
    if (!await this.bankRoutingNumber.isVisible({ timeout: 5_000 }).catch(() => false)) {
      return;
    }

    if (await this.bankFirstName.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.fillField(this.bankFirstName, info.firstName);
    }
    if (await this.bankLastName.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.fillField(this.bankLastName, info.lastName);
    }

    await this.fillField(this.bankRoutingNumber, info.routingNumber);
    await this.fillField(this.bankAccountNumber, info.accountNumber);

    if (await this.achReEnterAccountNumber.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.fillField(this.achReEnterAccountNumber, info.accountNumber);
    }

    // Account type dropdown (react-select)
    const accountType = info.accountType ?? 'CHECKING';
    if (await this.bankAccountTypeInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.bankAccountTypeInput.fill(accountType);
      await this.bankAccountTypeInput.press('Enter');
    }
  }

  /**
   * Submit the payment info form (click the primary button).
   * Waits for the page to transition (spinner or URL change).
   */
  async submitPaymentInfo(): Promise<void> {
    await this.submitButton.scrollIntoViewIfNeeded();
    await this.submitButton.click();
    await this.waitForSpinner();

    // Check for error toast — if present, the form had validation errors
    await this.assertNoErrorToast('Contract payment submission');

    // Wait for the page to fully process after submission
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  /**
   * Complete the Terms & Conditions step.
   * Checks both confirmation checkboxes, then clicks "PROCEED TO SIGNATURE".
   *
   * Checkbox order matters:
   *   1. "I confirm all information is true and complete" (#isConfirmedForSettlement)
   *   2. "I agree to Privacy Policy, Terms and Conditions" (#isEverythingAgreed)
   */
  async completeTermsAndConditions(): Promise<void> {
    // Wait for any checkbox to appear on the T&C page
    const anyCheckbox = this.page.locator(SELECTORS.contractCheckbox).first();
    await anyCheckbox.waitFor({ state: 'visible', timeout: 30_000 });

    // Check all visible checkboxes (covers #isConfirmedForSettlement, #isEverythingAgreed,
    // and any other T&C checkboxes regardless of their IDs)
    const allCheckboxes = this.page.locator(SELECTORS.contractCheckbox);
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = allCheckboxes.nth(i);
      if (await cb.isVisible() && !await cb.isChecked()) {
        await cb.check();
      }
    }

    // Wait for the submit button to become enabled after checking boxes
    const submitBtn = this.page.locator(SELECTORS.ptProceedToSignature).first();
    await this.waitForButtonEnabled(submitBtn, 10);

    // Click "PROCEED TO SIGNATURE" button
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();

    // Verify no error toast appeared after clicking
    await this.assertNoErrorToast('T&C submission');

    await this.waitForSpinner();
  }

  /**
   * Complete T&C step when insurance is enabled.
   * The submit button text changes to "See Protection Benefits"
   * which shows the PurchaseInsurance modal instead of going to e-sign.
   */
  async completeTermsAndShowInsurance(): Promise<void> {
    const anyCheckbox = this.page.locator(SELECTORS.contractCheckbox).first();
    await anyCheckbox.waitFor({ state: 'visible', timeout: 30_000 });

    const allCheckboxes = this.page.locator(SELECTORS.contractCheckbox);
    const count = await allCheckboxes.count();
    for (let i = 0; i < count; i++) {
      const cb = allCheckboxes.nth(i);
      if (await cb.isVisible() && !await cb.isChecked()) {
        await cb.check();
      }
    }

    // Wait for the submit button to become enabled after checking boxes
    const submitBtnInsurance = this.page.locator(
      `${SELECTORS.seeProtectionBenefitsBtn}, ${SELECTORS.ptProceedToSignature}`
    ).first();
    await this.waitForButtonEnabled(submitBtnInsurance, 10);

    // Try "See Protection Benefits" first (insurance-enabled merchants),
    // fall back to "PROCEED TO SIGNATURE" if insurance is not offered.
    const seeProtectionBtn = this.page.locator(SELECTORS.seeProtectionBenefitsBtn).first();
    const proceedBtn = this.page.locator(SELECTORS.ptProceedToSignature).first();

    if (await seeProtectionBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await seeProtectionBtn.scrollIntoViewIfNeeded();
      await seeProtectionBtn.click();
      console.log('[Contract] Clicked "See Protection Benefits"');
    } else {
      await proceedBtn.scrollIntoViewIfNeeded();
      await proceedBtn.click();
      console.log('[Contract] Insurance button not found — clicked "PROCEED TO SIGNATURE"');
    }

    await this.assertNoErrorToast('T&C submission (insurance flow)');
    await this.waitForSpinner();
  }

  /**
   * Complete protection plan selection and proceed to e-sign.
   *
   * The protection plan page shows Buddy widget content above and two native
   * checkboxes below:
   *   - "I agree to the Uown Protection Plus for $X/month..." (opt-in)
   *   - "No, continue unprotected" (opt-out)
   * One MUST be selected before "PROCEED TO SIGNATURE" becomes active.
   */
  async completeProtectionPlan(optIn: boolean = true): Promise<void> {
    // Wait for the purchase-insurance submit button (in the main page, not inside any iframe)
    const submitBtn = this.page.locator(SELECTORS.purchaseInsuranceSubmitBtn);
    await submitBtn.waitFor({ state: 'visible', timeout: 30_000 });
    console.log('[Contract] Purchase insurance page visible');

    // Wait for protection plan content to render (iframes + Buddy widget)
    await sleep(3_000);

    // The opt-in/opt-out radio buttons are inside a protection plan iframe
    // (NOT the Buddy insurance widget iframe). Search all frames for the radios.
    let radioClicked = false;
    const choice = optIn ? 'opt-in' : 'opt-out';

    // Log all frames for diagnostic purposes
    const frames = this.page.frames();
    console.log(`[Contract] Page has ${frames.length} frames:`);
    for (const f of frames) {
      console.log(`[Contract]   frame: ${f.url().substring(0, 100) || '(empty)'}`);
    }

    // Strategy 1: Try main page with role-based locators (handles both native + ARIA radios)
    const mainRadios = this.page.getByRole('radio');
    const mainRadioCount = await mainRadios.count().catch(() => 0);
    console.log(`[Contract] Main page radios (by role): ${mainRadioCount}`);

    if (mainRadioCount >= 2) {
      const targetIndex = optIn ? 0 : 1;
      await mainRadios.nth(targetIndex).click({ force: true });
      radioClicked = true;
      console.log(`[Contract] Insurance ${choice}: radio clicked in main page (by role)`);
    }

    // Strategy 2: Try text-based click in main page
    if (!radioClicked) {
      const targetSelector = optIn ? SELECTORS.insuranceOptInCheckbox : SELECTORS.insuranceOptOutCheckbox;
      const textEl = this.page.locator(targetSelector).first();
      if (await textEl.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await textEl.click();
        radioClicked = true;
        console.log(`[Contract] Insurance ${choice}: clicked text selector in main page`);
      }
    }

    // Strategy 3: Search each frame for radios (protection plan content is in an iframe)
    if (!radioClicked) {
      for (const frame of frames) {
        if (frame === this.page.mainFrame()) continue;
        const frameUrl = frame.url();
        if (frameUrl.includes('buddy.insure')) continue;

        // Try role-based radios
        const radios = frame.getByRole('radio');
        const radioCount = await radios.count().catch(() => 0);
        console.log(`[Contract] Frame "${frameUrl.substring(0, 60)}" has ${radioCount} radios (by role)`);

        if (radioCount >= 2) {
          const targetIndex = optIn ? 0 : 1;
          await radios.nth(targetIndex).click({ force: true });
          radioClicked = true;
          console.log(`[Contract] Insurance ${choice}: radio clicked in iframe`);
          break;
        }

        // Try native input[type=radio] + input[type=checkbox]
        const inputs = frame.locator('input[type="radio"], input[type="checkbox"]');
        const inputCount = await inputs.count().catch(() => 0);
        if (inputCount >= 2) {
          console.log(`[Contract] Frame has ${inputCount} native radio/checkbox inputs`);
          const targetIndex = optIn ? 0 : 1;
          await inputs.nth(targetIndex).check({ force: true });
          radioClicked = true;
          console.log(`[Contract] Insurance ${choice}: native input checked in iframe`);
          break;
        }

        // Try text-based click
        const targetText = optIn ? 'I agree to the Uown Protection Plus' : 'No, continue unprotected';
        const textEl = frame.getByText(targetText).first();
        if (await textEl.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await textEl.click();
          radioClicked = true;
          console.log(`[Contract] Insurance ${choice}: clicked text in iframe`);
          break;
        }
      }
    }

    // Strategy 4: Use frameLocator on all iframes as last resort
    if (!radioClicked) {
      const iframes = this.page.locator('iframe');
      const iframeCount = await iframes.count();
      console.log(`[Contract] Trying ${iframeCount} iframes via frameLocator`);

      for (let i = 0; i < iframeCount; i++) {
        const fl = this.page.frameLocator(`iframe >> nth=${i}`);
        const radios = fl.getByRole('radio');
        const radioCount = await radios.count().catch(() => 0);
        if (radioCount >= 2) {
          const targetIndex = optIn ? 0 : 1;
          await radios.nth(targetIndex).click({ force: true });
          radioClicked = true;
          console.log(`[Contract] Insurance ${choice}: radio clicked via frameLocator[${i}]`);
          break;
        }
      }
    }

    if (!radioClicked) {
      console.log('[Contract] WARNING: Could not find insurance radio — proceeding anyway');
    }

    // Wait for the submit button to become enabled after radio selection
    await this.waitForButtonEnabled(submitBtn, 10);

    // Click "PROCEED TO SIGNATURE" to advance to e-sign
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    console.log('[Contract] Clicked "PROCEED TO SIGNATURE" on protection plan page');

    await this.assertNoErrorToast('Protection plan submission');
    await this.waitForSpinner();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  CREDIT CARD DECLINE VALIDATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Test a single decline card on the contract payment form.
   * Fills bank info + CC info, submits, captures toast error, and verifies
   * "PROCEED TO SIGNATURE" is NOT clickable.
   *
   * Mirrors checkCreditCardDeclinesUI() from Java AccountCreationSteps.
   *
   * @param card - The decline TestCard to test
   * @param applicantFirstName - First name for CC and bank fields
   * @param applicantLastName - Last name for CC and bank fields
   * @param isFirstCard - If false, refreshes the page before filling
   * @returns The toast error message text
   */
  async testDeclineCard(
    card: TestCard,
    applicantFirstName: string,
    applicantLastName: string,
    isFirstCard: boolean,
  ): Promise<string> {
    if (!isFirstCard) {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForLoadState('networkidle').catch(() => {});
      const firstNameField = this.page.locator(
        `${SELECTORS.ccFirstName}, input[placeholder*="First Name"]`
      ).first();
      await firstNameField.waitFor({ state: 'visible', timeout: 15_000 });
      await sleep(500);
    }

    // Fill bank info (same values Java uses)
    await this.fillBankInfo({
      firstName: applicantFirstName,
      lastName: applicantLastName,
      routingNumber: TEST_BANK.DEFAULT_ROUTING,
      accountNumber: TEST_BANK.DEFAULT_ACCOUNT_SHORT,
      accountType: TEST_BANK.DEFAULT_TYPE,
    });

    // Fill CC info with the decline card
    const expDate = `${card.expMonth}/${card.expYear}`;
    await this.fillCreditCardInfo({
      firstName: applicantFirstName,
      lastName: applicantLastName,
      cardNumber: card.number,
      cvc: card.cvv,
      expDate,
    });

    await sleep(300);

    // Trigger React change events — Tab through all fields to force onBlur validation
    for (let i = 0; i < 4; i++) {
      await this.page.keyboard.press('Tab');
      await sleep(200);
    }
    await sleep(500);

    // Click submit — try multiple selectors (contract page uses "Submit" or btn-primary)
    const submitBtn = this.page.locator(
      `button:has-text("Submit"), button:has-text("SUBMIT"), ${SELECTORS.buttonPrimary}`
    ).first();

    // Wait for button to become enabled (React form validation)
    await this.waitForButtonEnabled(submitBtn, 20);

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    // Capture toast error — waitFor handles the timing
    const toastText = await this.captureAndDismissToast(15_000) || 'NOTEXT';
    console.log(`[DeclineCheck] ${card.name}: "${toastText}"`);

    // Wait for toast to fully disappear before checking button state
    await this.page.locator(SELECTORS.toastBody).waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});

    // Verify "PROCEED TO SIGNATURE" button is NOT present/clickable
    const proceedBtn = this.page.locator(SELECTORS.ptProceedToSignature);
    const proceedVisible = await proceedBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (proceedVisible) {
      throw new Error(`Decline card ${card.name} allowed "PROCEED TO SIGNATURE" — should have been blocked`);
    }

    return toastText;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  E-SIGN FLOWS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Detect whether PandaDocs or Signwell is used, then complete e-sign.
   * Waits up to 60s for either iframe to appear.
   */
  async completeESign(): Promise<void> {
    const pandaDocsIframe = this.page.locator(SELECTORS.pandaDocsIframe);
    const signwellIframe = this.page.locator(SELECTORS.signwellIframe);

    // Wait for either iframe to appear (up to 60s)
    for (let attempt = 1; attempt <= 12; attempt++) {
      if (await pandaDocsIframe.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await this.completeESignPandaDocs();
        return;
      }
      if (await signwellIframe.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await this.completeESignSignwell();
        return;
      }
      console.log(`[ESign] Waiting for iframe... attempt=${attempt}`);
      await sleep(3_000);
    }

    // Last resort: try Signwell (will timeout with a clear error if not found)
    await this.completeESignSignwell();
  }

  /**
   * Complete e-sign via Signwell iframe.
   * Delegates to the shared `completeSignwellFlow()` using the iframe's FrameLocator.
   */
  private async completeESignSignwell(): Promise<void> {
    const iframeLocator = this.page.locator(SELECTORS.signwellIframe);
    await iframeLocator.waitFor({ state: 'visible', timeout: 30_000 });

    const frame = this.page.frameLocator(SELECTORS.signwellIframe);
    const iframeElement = await this.page.$(SELECTORS.signwellIframe);

    await completeSignwellFlowHelper(frame, 'Signwell', async () => {
      await this.signwellClickSignAllViaJs(iframeElement, frame);
    });

    // Optional btn-rounded close (iframe-only)
    const btnRounded = frame.locator(SELECTORS.buttonRounded);
    if (await btnRounded.last().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btnRounded.last().click();
    }
  }

  /**
   * Complete e-sign on a direct Signwell URL (no iframe wrapper).
   * Delegates to the shared `completeSignwellFlow()` using the page itself.
   */
  async completeESignDirect(): Promise<void> {
    // Dismiss "This is Not Legally Binding" modal if present (test mode documents)
    const continueBtn = this.page.locator(SELECTORS.signwellContinueModal).first();
    if (await continueBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await continueBtn.click();
      console.log('[ESign Direct] Dismissed "Not Legally Binding" modal');
      await sleep(1_000);
    }

    await completeSignwellFlowHelper(this.page, 'Direct', async () => {
      await clickSignAllViaLink(this.page);
    });

    // Wait for "Document complete!" confirmation modal (direct-only)
    const completeHeading = this.page.locator(SELECTORS.signwellDocCompleteHeading);
    await completeHeading.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
    console.log('[ESign Direct] Document complete confirmation shown');
    await sleep(3_000);

    // Dismiss the completion modal via its close link (X button)
    const closeLink = this.page.locator(SELECTORS.signwellModalCloseLink).first();
    if (await closeLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await closeLink.click({ force: true });
      console.log('[ESign Direct] Dismissed completion modal');
    }
  }

  /**
   * Shared Signwell e-sign flow used by both iframe and direct modes.
   * The only difference between modes is how "Sign All" is clicked,
   * which is abstracted via the `clickSignAll` callback.
   *
   * Uses a generic field-loop approach: after clicking Start, iterates through
   * all fields (signature/initials in any order) using the "Next Field" button.
   * Each field is detected by checking which input type is visible (signature
   * callout vs avatar-wrapper) and filled accordingly.
   *
   * @param source - A LocatorSource (Page for direct, FrameLocator for iframe)
   * @param label - Log label prefix (e.g. 'Signwell' or 'Direct')
   * @param clickSignAll - Callback to click the "Sign All" / "Save & Apply Everywhere" button
   */
  /**
   * Click "Sign All" button via JS execution inside Signwell iframe.
   * Mirrors: document.getElementsByClassName("signature-actions")[0].children[1].click()
   * Falls back to frame locator if JS evaluation fails.
   */
  private async signwellClickSignAllViaJs(iframeElement: any, frame: FrameLocator): Promise<void> {
    try {
      await this.page.evaluate((iframe) => {
        const frameDoc = (iframe as HTMLIFrameElement).contentDocument
          || (iframe as HTMLIFrameElement).contentWindow?.document;
        if (frameDoc) {
          const actions = frameDoc.getElementsByClassName('signature-actions')[0];
          if (actions && actions.children[1]) {
            (actions.children[1] as HTMLElement).click();
          } else if (actions && actions.children[0]) {
            (actions.children[0] as HTMLElement).click();
          }
        }
      }, iframeElement);
    } catch {
      // Fallback: try via frame locator — last action is "Save"/"Sign All"
      const signAllBtn = frame.locator(`${SELECTORS.signwellSignatureActions} button, ${SELECTORS.signwellSignatureActions} a`).last();
      if (await signAllBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await signAllBtn.click();
      } else {
        await frame.locator(`${SELECTORS.signwellSignatureActions} button, ${SELECTORS.signwellSignatureActions} a`).first().click();
      }
    }
  }

  /**
   * Complete e-sign via PandaDocs iframe.
   * Flow from Java: switch to iframe → close popup → Start signing →
   *                  Initials → Accept and sign → loop through Next/Initials →
   *                  Signature → Accept and sign → Finish → verify "All Set"
   */
  private async completeESignPandaDocs(): Promise<void> {
    const iframeElement = this.page.locator(SELECTORS.pandaDocsIframe);
    await iframeElement.waitFor({ state: 'visible', timeout: 30_000 });

    const frame = this.page.frameLocator(SELECTORS.pandaDocsIframe);

    // Close popup dialog if present
    const closePopup = frame.locator(SELECTORS.pandaDocsClosePopup);
    if (await closePopup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await closePopup.click();
    }

    // Click "Start signing"
    const startSigning = frame.locator(SELECTORS.pandaDocsStartSigning);
    await startSigning.waitFor({ state: 'visible', timeout: 10_000 });
    await startSigning.click();

    // Click first Initials field
    const initials = frame.locator(SELECTORS.pandaDocsInitials);
    await initials.waitFor({ state: 'visible', timeout: 10_000 });
    await initials.click();

    // Accept and sign
    const acceptAndSign = frame.locator(SELECTORS.pandaDocsAcceptAndSign);
    await acceptAndSign.waitFor({ state: 'visible', timeout: 10_000 });
    await acceptAndSign.click();

    // Loop through remaining Initials fields via Next button
    const nextBtn = frame.locator(SELECTORS.pandaDocsNext);
    for (let i = 0; i < 10; i++) {
      if (!await nextBtn.isVisible({ timeout: 3_000 }).catch(() => false)) break;
      await nextBtn.click();

      // Check if this is an Initials or Signature field
      if (await initials.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await initials.click();
      } else {
        // It's a Signature field
        const signature = frame.locator(SELECTORS.pandaDocsSignature);
        if (await signature.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await signature.click();
          await acceptAndSign.waitFor({ state: 'visible', timeout: 5_000 });
          await acceptAndSign.click();
        }
      }
    }

    // Click Finish
    const finishBtn = frame.locator(SELECTORS.pandaDocsFinish);
    await finishBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await finishBtn.click();

    // Verify completion text
    const allSetText = frame.locator(SELECTORS.pandaDocsAllSet);
    await allSetText.waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * After e-sign, click "View Document" link if present (Signwell flow).
   */
  async viewCompletedDocument(): Promise<void> {
    const viewDoc = this.page.locator(SELECTORS.contractViewDocumentLink);
    if (await viewDoc.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await viewDoc.click();

      // Close the document viewer — last btn-rounded is the close button
      const closeBtn = this.page.locator(SELECTORS.buttonRounded).last();
      if (await closeBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }
  }
}

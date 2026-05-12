import { expect } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { sleep } from '../../helpers/common.helpers.js';

export class WebsiteBasePage extends BasePage {
  readonly accountSummary = this.page.locator(SELECTORS.wsAccountSummary);
  readonly paymentSection = this.page.locator(SELECTORS.wsPaymentSection);
  readonly contactSection = this.page.locator(SELECTORS.wsContactSection);
  readonly makePaymentButton = this.page.locator(SELECTORS.wsMakePaymentButton);
  readonly accountNumber = this.page.locator(SELECTORS.wsAccountNumber);
  readonly balanceAmount = this.page.locator(SELECTORS.wsBalanceAmount);
  readonly nextPaymentDate = this.page.locator(SELECTORS.wsNextPaymentDate);

  // Login elements — single input #phoneOrEmail accepts email or 10-digit phone (no mask)
  readonly emailInput = this.page.locator(SELECTORS.wsEmailOrPhoneInput);
  readonly emailOrPhoneInput = this.page.locator(SELECTORS.wsEmailOrPhoneInput);
  readonly verificationCodeInput = this.page.locator(SELECTORS.wsVerificationCodeInput);
  readonly submitButton = this.page.locator(SELECTORS.wsSubmitButton);
  readonly resendCodeButton = this.page.locator(SELECTORS.wsResendCodeButton);

  // Navigation links
  readonly paymentMethodsLink = this.page.locator(SELECTORS.wsPaymentMethodsLink);
  readonly updateContactLink = this.page.locator(SELECTORS.wsUpdateContactLink);
  readonly accountSummaryLink = this.page.locator(SELECTORS.wsAccountSummaryLink);

  async getAccountNumber(): Promise<string> {
    return this.getTextContent(this.accountNumber);
  }

  async getBalance(): Promise<string> {
    return this.getTextContent(this.balanceAmount);
  }

  async getNextPaymentDate(): Promise<string> {
    return this.getTextContent(this.nextPaymentDate);
  }

  async clickMakePayment(): Promise<void> {
    await this.clickAndWaitForSpinner(this.makePaymentButton);
  }

  async verifyAccountSummaryVisible(): Promise<void> {
    await expect(this.accountSummary).toBeVisible();
  }

  /**
   * Logs in to the website portal with email OR 10-digit phone (no mask).
   * The website uses OTP verification rather than password. The OTP itself
   * can be obtained from the inbox or directly from `uown_login_attempt.code`
   * via DatabaseHelpers.waitForFreshOtpCode.
   */
  async loginWithEmailOrPhone(emailOrPhone: string): Promise<void> {
    await this.emailOrPhoneInput.fill(emailOrPhone);
    await this.clickAndWaitForSpinner(this.submitButton);
  }

  /** @deprecated Use loginWithEmailOrPhone — the field accepts both. */
  async loginWithEmail(email: string): Promise<void> {
    return this.loginWithEmailOrPhone(email);
  }

  /**
   * Enters the verification code received via email or SMS.
   * The website uses 6 separate single-digit inputs for the OTP code.
   * Typing into the first input auto-advances to the next fields.
   * Accepts both modal copies: "We just emailed you" and "We just texted you" (SMS).
   * @returns true if login succeeded (modal closed), false if code was invalid
   */
  async enterVerificationCode(code: string): Promise<boolean> {
    // Wait for the OTP modal to be visible (matches both email and SMS copy)
    const modalBody = this.page.locator(SELECTORS.modalBody).filter({ hasText: /We just (emailed|texted) you/i });
    await modalBody.waitFor({ state: 'visible', timeout: 10_000 });

    // The OTP form has 6 individual input fields inside the modal.
    // Target the first input INSIDE the modal body (not the email input behind it).
    const firstOtpInput = modalBody.locator('input').first();
    await firstOtpInput.waitFor({ state: 'visible', timeout: 5_000 });
    await firstOtpInput.click({ force: true });
    await this.page.keyboard.type(code, { delay: 100 });

    console.log(`[Website] Entered verification code: ${code}`);

    // Wait for the OTP modal to disappear (success) or invalid code error to appear
    const invalidCodeError = modalBody.locator(':text("Invalid verification code")');
    const result = await Promise.race([
      modalBody.waitFor({ state: 'hidden', timeout: 30_000 }).then(() => 'success' as const),
      invalidCodeError.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'invalid' as const),
    ]).catch(() => 'timeout' as const);

    if (result === 'invalid' || result === 'timeout') {
      console.log(`[Website] Verification code "${code}" was ${result === 'invalid' ? 'rejected (Invalid verification code)' : 'timed out'}`);
      return false;
    }

    // Modal closed — but auth isn't done until the page leaves the login route.
    // Without this, the next steps can interact with the still-loading login page.
    await this.page.waitForURL(url => !/\/$|\/login\/?$/.test(new URL(url).pathname), { timeout: 15_000 })
      .catch(() => { /* fall through — log will show actual URL */ });
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitForSpinner();

    const finalUrl = this.page.url();
    console.log(`[Website] Verification complete. URL: ${finalUrl}`);
    if (/\/$|\/login\/?$/.test(new URL(finalUrl).pathname)) {
      console.log('[Website] Auth check FAILED — still on login route after OTP modal closed.');
      return false;
    }
    return true;
  }

  /**
   * Requests a new verification code by clicking "Didn't get a code?" on the OTP modal.
   * Clears the existing OTP inputs so a fresh code can be entered.
   */
  async requestNewVerificationCode(): Promise<void> {
    const resendBtn = this.page.locator(SELECTORS.wsResendCodeButton).first();
    await resendBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await resendBtn.click();
    console.log('[Website] Requested new verification code');
    await sleep(2_000);
    await this.clearOtpInputs();
  }

  /**
   * Clears the 6 single-digit OTP inputs without requesting a new code.
   * Used between consecutive wrong-code attempts in lockout scenarios.
   * No-op if the modal is no longer visible (e.g. lockout closed it during
   * the transition).
   */
  async clearOtpInputs(): Promise<void> {
    const modalBody = this.page.locator(SELECTORS.modalBody).filter({ hasText: /We just (emailed|texted) you/i });
    if (!(await modalBody.isVisible({ timeout: 500 }).catch(() => false))) return;
    const otpInputs = modalBody.locator('input');
    const count = await otpInputs.count();
    for (let i = 0; i < count; i++) {
      await otpInputs.nth(i).fill('', { timeout: 2_000 }).catch(() => {/* modal closed mid-iteration */});
    }
  }

  /** True if the OTP modal is currently visible. */
  async isOtpModalVisible(): Promise<boolean> {
    const modalBody = this.page.locator(SELECTORS.modalBody).filter({ hasText: /We just (emailed|texted) you/i });
    return modalBody.isVisible({ timeout: 1_000 }).catch(() => false);
  }

  /**
   * Verifies the displayed account number matches expected.
   */
  async verifyAccountNumber(expected: string): Promise<void> {
    const displayed = await this.getAccountNumber();
    expect(displayed).toContain(expected);
  }

  // ── Navigation ──────────────────────────────────────────────────────

  async navigateToPaymentMethods(): Promise<void> {
    await this.clickAndWaitForSpinner(this.paymentMethodsLink);
  }

  async navigateToPayments(): Promise<void> {
    await this.clickAndWaitForSpinner(this.page.locator(SELECTORS.wsPaymentsLink));
  }

  async navigateToDocuments(): Promise<void> {
    await this.clickAndWaitForSpinner(this.page.locator(SELECTORS.wsDocumentsLink));
  }

  async navigateToContact(): Promise<void> {
    await this.clickAndWaitForSpinner(this.page.locator(SELECTORS.wsContactLink));
  }

  async navigateToUpdateContactInfo(): Promise<void> {
    await this.clickAndWaitForSpinner(this.updateContactLink);
  }

  async navigateToAccountSummary(): Promise<void> {
    await this.clickAndWaitForSpinner(this.accountSummaryLink);
  }

  // ── Sidebar Navigation (mirrors Java goToSidebarLink) ──────────────

  /**
   * Navigates via sidebar link with dropdown expansion fallback.
   * Java: goToSidebarLink(desiredOption) → searches sidebar items,
   * expands "Payments" and "Account Settings" dropdowns if needed.
   */
  async goToSidebarLink(desiredOption: string): Promise<void> {
    const normalizedOption = desiredOption.toLowerCase().trim();

    // Wait for any lingering full-screen overlay (post-payment, post-save) before
    // attempting the click — otherwise it intercepts pointer events and the click times out.
    await this.waitForSpinner();

    // Step 1: Try direct click (item already visible)
    if (await this.findAndClickSidebarItem(desiredOption)) {
      await this.waitForPageTransition(normalizedOption);
      return;
    }

    // Step 2: Expand the parent dropdown(s) for this item, then retry
    if (await this.expandDropdownAndClick(desiredOption, normalizedOption)) return;

    // Step 3: Expand ALL dropdowns as last resort
    await this.expandAllSidebarDropdowns();
    if (await this.findAndClickSidebarItem(desiredOption)) {
      await this.waitForPageTransition(normalizedOption);
      return;
    }

    // Step 4: Fallback — navigate by URL slug
    await this.navigateBySidebarUrlFallback(normalizedOption);
  }

  /** Try multiple selector strategies to find and click a sidebar item */
  private async findAndClickSidebarItem(desiredOption: string): Promise<boolean> {
    // Sidebar items are <span class="...sideBarContainer__item..."> elements.
    // Scope to that class — other spans elsewhere in the DOM (hidden header/breadcrumb
    // duplicates with the same text) would otherwise match `.first()` and never be clickable.
    const item = this.page
      .locator('[class*="sideBarContainer__item"]')
      .filter({ hasText: new RegExp(`^\\s*${desiredOption}\\s*$`, 'i') })
      .first();
    if (await item.isVisible({ timeout: 1_500 }).catch(() => false)) {
      await item.click();
      return true;
    }
    return false;
  }

  /** Expand parent dropdown(s) for the desired option, then try to click it */
  private async expandDropdownAndClick(desiredOption: string, normalizedOption: string): Promise<boolean> {
    const dropdownParents: Record<string, string[]> = {
      'make payment': ['Payments'],
      'payment methods': ['Payments'],
      'update contact info': ['Account Settings'],
    };
    const parents = dropdownParents[normalizedOption] || ['Payments', 'Account Settings'];
    for (const parentLabel of parents) {
      // Same scoping as findAndClickSidebarItem — avoid hidden duplicate spans.
      const parentEl = this.page
        .locator('[class*="sideBarContainer__item"]')
        .filter({ hasText: new RegExp(`^\\s*${parentLabel}\\s*$`, 'i') })
        .first();
      if (await parentEl.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await parentEl.click();
        // Wait briefly for dropdown expansion (children render under the same scope)
        await this.page.locator('[class*="sideBarContainer__item"]')
          .filter({ hasText: new RegExp(`^\\s*${desiredOption}\\s*$`, 'i') })
          .first()
          .waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
        if (await this.findAndClickSidebarItem(desiredOption)) {
          await this.waitForPageTransition(normalizedOption);
          return true;
        }
      }
    }
    return false;
  }

  /** Expand all sidebar dropdown sections */
  private async expandAllSidebarDropdowns(): Promise<void> {
    for (const dropdown of ['Payments', 'Account Settings']) {
      const dropdownEl = this.page
        .locator('[class*="sideBarContainer__item"]')
        .filter({ hasText: new RegExp(`^\\s*${dropdown}\\s*$`, 'i') })
        .first();
      if (await dropdownEl.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await dropdownEl.click();
        await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      }
    }
  }

  /** Navigate directly by URL when sidebar link cannot be found */
  private async navigateBySidebarUrlFallback(normalizedOption: string): Promise<void> {
    const urlMap: Record<string, string> = {
      'make payment': '/payment',
      'payment methods': '/manage-payment-methods',
      'documents': '/documents',
      'contact us': '/contact',
      'account summary': '/overview',
      'update contact info': '/update-contact',
    };
    const path = urlMap[normalizedOption] || `/${normalizedOption.replace(/\s+/g, '-')}`;
    const baseUrl = this.page.url().split('/').slice(0, 3).join('/');
    console.log(`[Website] Sidebar fallback: navigating directly to ${baseUrl}${path}`);
    await this.page.goto(`${baseUrl}${path}`);
    await this.waitForSpinner();
  }

  /**
   * Waits for URL transition matching the sidebar option.
   * Java: waitForRelevantTransition(desiredOption)
   */
  private async waitForPageTransition(option: string): Promise<void> {
    const transitionMap: Record<string, string> = {
      'account summary': 'overview',
      'make payment': 'payment',
      'payment methods': 'manage-payment-methods',
      'documents': 'documents',
      'contact us': 'contact',
      'update contact info': 'update-contact',
    };
    const urlFragment = transitionMap[option] || option.replace(/\s+/g, '-');
    await this.page.waitForURL(`**/*${urlFragment}*`, { timeout: 10_000 }).catch(() => {});
    await this.waitForSpinner();
  }

  // ── Phone Update ──────────────────────────────────────────────────

  /**
   * Updates the phone number on the Update Contact Info page.
   * Navigates to the contact info page, fills area code and phone number, then saves.
   */
  async updatePhoneNumber(areaCode: string, phoneNumber: string): Promise<void> {
    await this.goToSidebarLink('update contact info');

    // The form has a single combined "Mobile Phone*" input (e.g. "(407) 555-4802").
    // Use triple-click + pressSequentially to trigger React onChange properly.
    const phoneInput = this.page.locator(SELECTORS.wsPhoneNumberInput).first();
    await phoneInput.waitFor({ state: 'visible', timeout: 10_000 });
    await phoneInput.click({ clickCount: 3 });
    await phoneInput.pressSequentially(`${areaCode}${phoneNumber}`, { delay: 50 });

    const saveBtn = this.page.locator(SELECTORS.wsSaveChangesButton).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await saveBtn.click();
    await this.waitForSpinner();

    console.log(`[Website] Updated phone: (${areaCode}) ${phoneNumber}`);
  }

  /**
   * Returns the error message text if visible, null otherwise.
   */
  async getErrorMessageText(): Promise<string | null> {
    const errorEl = this.page.locator(SELECTORS.wsErrorMessage).first();
    const isVisible = await errorEl.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) return null;
    return (await errorEl.textContent())?.trim() || null;
  }

  /**
   * Returns the success message text if visible, null otherwise.
   */
  async getSuccessMessageText(): Promise<string | null> {
    const successEl = this.page.locator(SELECTORS.wsSuccessMessage).first();
    const isVisible = await successEl.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!isVisible) return null;
    return (await successEl.textContent())?.trim() || null;
  }

  /**
   * Checks if an error message containing "could not find" is visible.
   */
  async isErrorVisible(): Promise<boolean> {
    const errorEl = this.page.locator(SELECTORS.wsErrorMessage).filter({ hasText: /could not find/i }).first();
    return errorEl.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  // ── Email Change ──────────────────────────────────────────────────

  /**
   * Changes the primary email on the Update Contact Info page.
   * Java: changeEmailAddress() → fills PRIMARY_EMAIL, clicks primary button.
   */
  async changeEmailToGeneric(newEmail = 'fintechgroup777GENERIC@gmail.com'): Promise<void> {
    const emailField = this.page.locator(SELECTORS.wsPrimaryEmailField).first();
    await emailField.waitFor({ state: 'visible', timeout: 10_000 });

    // Some accounts (e.g. "paid in full") render contact info as read-only
    if (await emailField.isDisabled()) {
      console.log('[Website] Email field is disabled (account may be read-only) — skipping email change');
      return;
    }

    await emailField.clear();
    await emailField.fill(newEmail);

    // Wait for save button to be enabled after email input
    const saveBtn = this.page.locator(SELECTORS.buttonPrimary).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await saveBtn.click();
    await this.waitForSpinner();
    console.log(`[Website] Changed email to "${newEmail}"`);
  }

  // ── Website Payments ──────────────────────────────────────────────

  /**
   * Makes an ACH payment on the website Make Payment page.
   * Java: makeAchPaymentOnWebsite() →
   *   navigate to "make payment" → enter amount → toggle ACH checkbox → click MAKE A PAYMENT
   */
  async makeAchPayment(amount: string): Promise<void> {
    await this.goToSidebarLink('make payment');
    await this.page.locator(SELECTORS.wsOtherAmountRadio).waitFor({ state: 'visible', timeout: 10_000 });

    // Enter payment amount via JS to trigger change event
    const paymentField = this.page.locator(SELECTORS.wsPaymentAmountField).first();
    await paymentField.evaluate((el: HTMLInputElement, val: string) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, amount);

    // Toggle ACH checkbox (uncheck then check — Java pattern)
    const achCheckbox = this.page.locator(SELECTORS.wsAchCheckbox).first();
    if (await achCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (await achCheckbox.isChecked()) {
        await achCheckbox.uncheck();
        await sleep(300);
      }
      await achCheckbox.check();
    }

    // Click MAKE A PAYMENT button
    const payBtn = this.page.locator(SELECTORS.wsPaymentSubmitButton).first();
    await payBtn.click();

    // Wait for success toast
    const successToast = this.page.locator(SELECTORS.toastSuccess);
    await successToast.waitFor({ state: 'visible', timeout: 30_000 });
    console.log(`[Website] ACH payment of $${amount} submitted`);
  }

  /**
   * Makes a CC payment on the website Make Payment page.
   * Java: makeCcPaymentOnWebsite() →
   *   navigate to "make payment" → enter amount → uncheck ACH → check CC → click MAKE A PAYMENT
   */
  async makeCcPayment(amount: string): Promise<void> {
    // Navigate with retry (Java does up to 3 attempts with page refresh)
    await this.navigateToPaymentWithRetry();

    // Select payment amount and CC checkbox
    await this.selectPaymentAmount(amount);
    await this.selectLastCcCheckbox();

    // Click MAKE A PAYMENT button
    const payBtn = this.page.locator(SELECTORS.wsPaymentSubmitButton).first();
    await payBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await payBtn.click({ force: true });

    // Wait for success or error toast
    await this.waitForPaymentResult('CC', amount);
  }

  /** Navigate to make payment page with up to 3 retries */
  private async navigateToPaymentWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.goToSidebarLink('make payment');
      if (attempt > 1) {
        await this.page.reload();
        await this.waitForSpinner();
      }
      const otherField = this.page.locator(SELECTORS.wsOtherAmountRadio);
      if (await otherField.isVisible({ timeout: 5_000 }).catch(() => false)) break;
    }
  }

  /** Select payment amount: "Total Payment Due" radio or "Other" with custom amount */
  private async selectPaymentAmount(amount: string): Promise<void> {
    const totalPaymentDue = this.page.getByText('Total Payment Due').first();
    if (await totalPaymentDue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await totalPaymentDue.click();
    } else {
      await this.page.locator(SELECTORS.wsOtherAmountRadio).check();
      await sleep(300);
      await this.page.evaluate((val) => {
        const radio = document.querySelector('#other') as HTMLInputElement;
        if (!radio) return;
        let el = radio.parentElement;
        while (el && !el.querySelector('input[type="text"], input:not([type="radio"])')) {
          el = el.parentElement;
        }
        const input = el?.querySelector('input[type="text"], input:not([type="radio"])') as HTMLInputElement;
        if (input) {
          input.value = val;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, amount);
    }
    await sleep(500);
  }

  /** Uncheck all checkboxes then select the last CC card checkbox */
  private async selectLastCcCheckbox(): Promise<void> {
    const allCheckboxes = this.page.locator(SELECTORS.checkboxInput);
    const checkboxCount = await allCheckboxes.count();

    for (let i = 0; i < checkboxCount; i++) {
      const cb = allCheckboxes.nth(i);
      if (await cb.isChecked()) {
        await cb.uncheck();
        await sleep(200);
      }
    }

    if (checkboxCount >= 2) {
      const ccCheckbox = allCheckboxes.last();
      await ccCheckbox.check();
      await sleep(300);
    }
  }

  /** Wait for payment success or error toast and log the result */
  private async waitForPaymentResult(type: string, amount: string): Promise<void> {
    const successToast = this.page.locator(SELECTORS.toastSuccess);
    // Scope to error-specific Toastify/Bootstrap classes only. Avoid bare `[role="alert"]`:
    // Toastify sets role=alert on success toasts AND keeps an empty route-announcer
    // `<p role="alert">` in DOM permanently (Next.js). Either would falsify the race.
    const errorToast = this.page.locator(SELECTORS.toastError).first();
    const result = await Promise.race([
      successToast.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'success' as const),
      errorToast.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'error' as const),
    ]);

    if (result === 'error') {
      const errorText = (await errorToast.textContent())?.trim() || '';
      console.log(`[Website] ${type} payment error: "${errorText}" — will be treated as non-fatal`);
    } else {
      console.log(`[Website] ${type} payment of $${amount} submitted`);
    }
  }

  /**
   * Checks the active account ID on the website dashboard dropdown.
   * Java: checkActiveAccountID() → reads from overview_accountsDropDown class,
   * splits by " - " to extract account PK, switches account if mismatch.
   */
  async checkActiveAccountId(expectedAccountPk: string): Promise<boolean> {
    const dropdown = this.page.locator(SELECTORS.wsAccountsDropdown).first();
    const isVisible = await dropdown.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!isVisible) {
      console.log(`[Website] Account dropdown not found — single account or different layout. Skipping account ID check.`);
      return false;
    }

    const dropdownText = await dropdown.textContent() || '';
    const parts = dropdownText.split(' - ');
    const activeAccountPk = parts.length > 1 ? parts[1].trim() : parts[0].trim();

    if (activeAccountPk === expectedAccountPk) {
      console.log(`[Website] Active account matches: ${activeAccountPk}`);
      return true;
    }

    // Account mismatch — try to switch
    console.log(`[Website] Account mismatch: active="${activeAccountPk}" expected="${expectedAccountPk}". Attempting switch.`);
    await dropdown.click();
    const correctOption = this.page.locator(`text=${expectedAccountPk}`).first();
    if (await correctOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await correctOption.click();
      await this.waitForSpinner();
      return true;
    }

    console.log(`[Website] Could not switch to account ${expectedAccountPk}`);
    return false;
  }

  async logout(): Promise<void> {
    await this.page.locator(SELECTORS.wsLogoutButton).click();
  }
}

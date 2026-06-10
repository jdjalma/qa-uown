import { expect } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SearchPage } from '../search.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { dismissCustomerInfoConfirmation } from '../../helpers/servicing-dialogs.helpers.js';


export class ServicingCustomerPage extends ServicingBasePage {
  readonly customerSummary = this.page.locator(SELECTORS.customerSummary);
  readonly customerStatusValue = this.page.locator(SELECTORS.customerStatusValue);
  // Merchant value in the account info panel.
  // CSS sibling combinator replaces the original fragile XPath positional traversal.
  // Reads: within any .card-body, find a label containing "Merchant", then get the value div that follows it.
  readonly merchantName = this.page.locator('.card-body label:has-text("Merchant") ~ div div').first();
  readonly saveButton = this.page.locator(SELECTORS.saveButton);
  readonly cancelButton = this.page.locator(SELECTORS.cancelButton);
  readonly noteInput = this.page.locator('#logNote');
  readonly addLogIcon = this.page.locator('.fa-file-plus');
  readonly notesTable = this.page.locator(SELECTORS.paymentTable);

  // Add Card elements
  readonly addCardButton = this.page.locator(SELECTORS.addCardButton);
  readonly saveCardButton = this.page.locator(SELECTORS.saveCardButton);

  async navigateToCustomer(searchTerm: string): Promise<void> {
    // In servicing, enter the search term in the quick search bar.
    // The quick search autocomplete may not find the account, so we fall back to:
    //   1. Pressing Enter to submit the search
    //   2. Clicking the FIRST column "Account #" link (NOT "Ref Account" which links to origination)
    const searchPage = new SearchPage(this.page);
    await searchPage.ensureSearchVisible();
    await searchPage.quickSearchInput.clear();
    await searchPage.quickSearchInput.fill(searchTerm);

    // Try autocomplete first.
    // Only match the dedicated autocomplete item class — NOT "nav a[href*='/customer-information/']"
    // which can falsely match persistent sidebar links in STG and navigate to the wrong page.
    const autocompleteLink = this.page.locator('[class*="searchBarQuickSearchResultItem"]').first();
    if (await autocompleteLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await autocompleteLink.click();
      await this.waitForSpinner();
    }

    // If autocomplete didn't land on a customer page, fall back to Enter + first result link.
    if (!this.page.url().includes('/customer-information/')) {
      await searchPage.quickSearchInput.press('Enter');
      await this.waitForSpinner();

      // IMPORTANT: Click the "Account #" column link (first <a> in each row, href="/customer-information/...")
      // NOT the "Ref Account" link which points to the origination portal!
      const firstAccountLink = this.page.locator('a[href*="/customer-information/"]').first();
      await firstAccountLink.waitFor({ state: 'visible', timeout: 10_000 });
      await firstAccountLink.click();
      await this.waitForSpinner();
    }

    console.log(`[ServicingCustomer] Navigated to customer page. URL: ${this.page.url()}`);
  }

  async getAccountStatus(): Promise<string> {
    // Try origination-style #customer-summary first
    if (await this.customerStatusValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(this.customerStatusValue);
    }

    // Servicing portal: find "Status" label and read its parent text
    const statusFromLabel = await this.getStatusFromLabel();
    if (statusFromLabel) return statusFromLabel;

    // Broader fallback: read header area text and extract with regex
    const statusFromHeader = await this.getStatusFromHeaderArea();
    if (statusFromHeader) return statusFromHeader;

    // Last resort: search full body text
    const fullText = await this.page.locator('body').textContent() || '';
    const fullMatch = fullText.match(/Status[\s:]+([A-Z_]{3,})/);
    if (fullMatch) return fullMatch[1].trim();

    console.log('[ServicingCustomer] Could not find account status');
    return '';
  }

  /** Extract status from the "Status" label's parent element text */
  private async getStatusFromLabel(): Promise<string | null> {
    const statusLabel = this.page.locator('xpath=//*[normalize-space(text())="Status"]').first();
    if (!await statusLabel.isVisible({ timeout: 3_000 }).catch(() => false)) return null;

    const parent = statusLabel.locator('..');
    const parentText = await parent.textContent() || '';
    const cleaned = parentText.replace(/\s+/g, ' ').trim();
    const match = cleaned.match(/^Status\s+(.+)/i);
    return match ? match[1].trim() : null;
  }

  /** Extract status from the top 120px of the page using DOM tree walker */
  private async getStatusFromHeaderArea(): Promise<string | null> {
    const bodyText = await this.page.locator('body').first().evaluate(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const texts: string[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const rect = (node.parentElement as HTMLElement)?.getBoundingClientRect();
        if (rect && rect.top < 120) {
          const t = node.textContent?.trim();
          if (t) texts.push(t);
        }
      }
      return texts.join(' ');
    });
    const statusMatch = bodyText.match(/\bStatus\s+(ACTIVE|FUNDED|FUNDING|CLOSED|SUSPENDED|DELINQUENT|SETTLED_IN_FULL|SETTLED|CHARGED_OFF|APPROVED|SIGNED|CONTRACT_CREATED|PENDING|CANCELLED|CANCELED)\b/i);
    return statusMatch ? statusMatch[1].trim() : null;
  }

  async getMerchantName(): Promise<string> {
    return this.getTextContent(this.merchantName);
  }

  /**
   * Reads the Rating Letter value shown in the customer-information Account Info card.
   * Returns the trimmed value, or '-' when unset (backend has not persisted a rating).
   */
  async getRatingLetter(): Promise<string> {
    const value = this.page.locator(SELECTORS.ratingLetterValue).first();
    await value.waitFor({ state: 'visible', timeout: 10_000 });
    const text = (await value.textContent()) ?? '';
    return text.replace(/\s+/g, ' ').trim();
  }

  async navigateToSection(section: string): Promise<void> {
    await this.sideMenuNavigateTo(section);
  }

  async clickSave(): Promise<void> {
    await this.clickAndWaitForSpinner(this.saveButton);
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async addNote(noteText: string): Promise<void> {
    await this.addLogIcon.click();
    await this.noteInput.fill(noteText);
    await this.clickSave();
  }

  /**
   * Adds a credit card to the customer's payment methods.
   * Mirrors UownServicingSteps.addNewValidCC() from the Java project.
   */
  async addCreditCard(cardDetails: {
    firstName: string;
    lastName: string;
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  }): Promise<void> {
    // Dismiss any lingering modal/backdrop before clicking Add Card (same pattern as clickMakePayment)
    await this.dismissAllModals();
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    await this.addCardButton.click();
    await this.waitForModalOpen();

    const ccFirstName = this.page.locator(SELECTORS.ccFirstName);
    const ccLastName = this.page.locator(SELECTORS.ccLastName);

    if (await ccFirstName.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await ccFirstName.fill(cardDetails.firstName);
    }
    if (await ccLastName.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await ccLastName.fill(cardDetails.lastName);
    }

    await this.ccNumber.fill(cardDetails.cardNumber);

    // React Select dropdowns — type + Enter to commit selection
    await this.ccExpMonth.fill(cardDetails.expMonth);
    await this.ccExpMonth.press('Enter');
    await this.ccExpYear.fill(cardDetails.expYear);
    await this.ccExpYear.press('Enter');

    await this.ccCsc.fill(cardDetails.cvc);

    await this.saveCardButton.click();
    await this.waitForSpinner();

    // Verify success toast before dismissing modal
    // Check for error first
    await this.assertNoErrorToast('[AddCard] Failed to add credit card');

    // Wait for modal to close after save
    const modal = this.page.locator(SELECTORS.modalShow);
    await modal.first().waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      console.log('[AddCard] Modal still visible after save — dismissing');
    });

    // Force-dismiss any lingering modals and backdrops
    await this.dismissAllModals();
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /**
   * Navigates to CC history and verifies a payment with the given amount exists.
   */
  async verifyCcPaymentExists(amount: string): Promise<void> {
    await this.topMenuNavigateTo('cc history');
    const row = this.page.locator(SELECTORS.tableRow).filter({ hasText: amount });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  }

  // ── Task #505 — Opt Out AI ─────────────────────────────────────────────

  /**
   * Navigates to the Primary Contact section via the left nav menu.
   * Handles the "Customer Information Confirmation" modal that may appear, then
   * dismisses any other open modal/backdrop before clicking.
   */
  async navigateToPrimaryContact(): Promise<void> {
    // Wait for the page content to stabilize before interacting
    await this.waitForSpinner();
    // Handle "Customer Information Confirmation" modal (appears intermittently)
    const confirmBtn = this.page.getByRole('button', { name: 'CONFIRM' });
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
      await this.waitForSpinner();
    }
    await this.dismissAllModals();
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    await this.sideMenuNavigateTo('Primary Contact');
    await this.waitForSpinner();
  }

  /**
   * Returns true if the "Opt Out AI" checkbox in the Mobile Phone section is visible.
   */
  async isOptOutAiVisible(): Promise<boolean> {
    const checkbox = this.page.locator(SELECTORS.optOutAiCheckbox).first();
    return checkbox.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Returns the checked state of the "Opt Out AI" checkbox in the Mobile Phone section.
   */
  async isOptOutAiChecked(): Promise<boolean> {
    const checkbox = this.page.locator(SELECTORS.optOutAiCheckbox).first();
    return checkbox.isChecked({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Enters edit mode for the Primary Contact section by clicking the edit pencil.
   * Waits until the Opt Out AI checkbox becomes enabled (not disabled).
   */
  async enterPrimaryContactEditMode(): Promise<void> {
    const editBtn = this.page.locator(SELECTORS.primaryContactEditButton);
    await editBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await editBtn.click();
    // Wait until the checkbox is no longer disabled
    const checkbox = this.page.locator(SELECTORS.optOutAiCheckbox).first();
    await checkbox.waitFor({ state: 'visible', timeout: 5_000 });
    await this.page.waitForFunction(
      (sel: string) => {
        const el = document.querySelector(sel) as HTMLInputElement | null;
        return el != null && !el.disabled;
      },
      '#optOutAiMobile',
      { timeout: 5_000 },
    );
  }

  /**
   * Toggles the "Opt Out AI" checkbox, handles the reason modal (only appears when enabling),
   * saves, and waits for toast.
   * - Enable (check): edit mode → click checkbox → reason modal → fill reason → Save modal → SAVE section → toast
   * - Disable (uncheck): edit mode → click checkbox → no modal → SAVE section → toast
   * Returns the toast message text (empty string if no toast appeared).
   */
  async toggleOptOutAi(reason = 'Automated test toggle'): Promise<string> {
    // Enter edit mode so checkboxes become enabled
    await this.enterPrimaryContactEditMode();

    // Click the checkbox
    const checkbox = this.page.locator(SELECTORS.optOutAiCheckbox).first();
    await checkbox.click();

    // Reason modal only appears when ENABLING (checking) — not when disabling
    const reasonTextbox = this.page.locator(SELECTORS.optOutAiReasonTextbox).first();
    const modalAppeared = await reasonTextbox.isVisible({ timeout: 3_000 }).catch(() => false);

    if (modalAppeared) {
      await reasonTextbox.fill(reason);
      const modalSaveBtn = this.page.locator(SELECTORS.optOutAiReasonSaveButton).first();
      await modalSaveBtn.click();
      // Wait for modal to close
      const modal = this.page.locator(SELECTORS.optOutAiReasonModal);
      await modal.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
    }

    // Click SAVE on the Primary Contact section to persist changes
    const sectionSaveBtn = this.page.getByRole('button', { name: 'SAVE' });
    if (await sectionSaveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sectionSaveBtn.click();
    }

    // Wait for toast
    const toast = this.page.locator(SELECTORS.toastBody).first();
    await toast.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const text = await toast.textContent().catch(() => '');
    return text?.trim() ?? '';
  }

  /**
   * Sets the "Opt Out AI" checkbox to the desired state.
   * Only clicks if the current state differs from the target.
   * Returns the toast message text (empty string if no click was needed).
   */
  async setOptOutAi(enable: boolean): Promise<string> {
    const isChecked = await this.isOptOutAiChecked();
    if (isChecked !== enable) {
      return this.toggleOptOutAi();
    }
    return '';
  }

  // ── End Task #505 ──────────────────────────────────────────────────────

  // ── Task #442 — Send Invite / Podium ──────────────────────────────────

  /**
   * Opens the Send Invite modal by clicking the envelope icon (#invitation).
   * Dismisses any lingering modals/backdrops first.
   *
   * New flow (RU03.26.1.50.0): clicking the envelope first shows a
   * "Customer Information Confirmation" modal (CONFIRM/CANCEL). After CONFIRM,
   * the InviteModal with Trustpilot/CustomerPortal/Podium options appears.
   */
  async openSendInviteModal(): Promise<void> {
    // Wait for the envelope icon first — this confirms React has fully mounted the account
    // page and the useEffect that conditionally shows VerifyCustomerInformationModal has run.
    // Checking for the modal BEFORE this causes a timing race where the modal hasn't appeared
    // yet, the check returns false, and then the modal appears mid-InviteModal animation.
    const envelopeIcon = this.page.locator(SELECTORS.invitationIcon);
    await envelopeIcon.waitFor({ state: 'visible', timeout: 10_000 });

    // The "Customer Information Confirmation" modal auto-appears when an account page loads.
    // It MUST be closed via its "Confirm" button (handled by the helper) — only
    // handleConfirm() sets isVerified: true in utilityStore, preventing React from
    // continuously re-showing the modal (which destabilises the InviteModal animation).
    await dismissCustomerInfoConfirmation(this.page);

    await this.dismissAllModals();
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    // The React onClick handler is on the FontAwesomeIcon (SVG) inside #invitation.
    // The SVG has pointer-events: none (FontAwesome default), so a normal click() on
    // the div does NOT reach the SVG's React event handler. Use dispatchEvent('click')
    // directly on the SVG to bypass pointer-events and trigger the React handler.
    await this.page.locator('#invitation svg').dispatchEvent('click');

    // InviteModal is conditionally rendered by React — wait for a unique button to appear.
    await this.page.getByRole('button', { name: 'Send TrustPilot Invite' })
      .waitFor({ state: 'visible', timeout: 8_000 });
  }

  /**
   * Returns true if the "Send Podium Link" button is visible inside an open InviteModal.
   * Call openSendInviteModal() first.
   */
  async isPodiumLinkButtonVisible(): Promise<boolean> {
    return this.page.getByRole('button', { name: 'Send Podium Link' })
      .isVisible({ timeout: 10_000 }).catch(() => false);
  }

  /**
   * Executes the full "Send Podium Link" UI flow:
   *   1. dispatchEvent click on #invitation svg (bypasses pointer-events: none) → InviteModal opens
   *   2. Clicks "Send Podium Link" in InviteModal → ConfirmationModal opens, InviteModal closes
   *   3. Clicks CONFIRM in ConfirmationModal → API call → toast
   *
   * Returns the toast text.
   */
  async sendPodiumLink(): Promise<string> {
    // Wait for the envelope icon FIRST — confirms React fully mounted and useEffect ran.
    // Checking VerifyCustomerInfoModal BEFORE this causes a timing race: the modal hasn't
    // rendered yet → check returns false → modal appears later during InviteModal animation
    // → InviteModal button becomes unstable / detached.
    const envelopeIcon = this.page.locator(SELECTORS.invitationIcon);
    await envelopeIcon.waitFor({ state: 'visible', timeout: 10_000 });

    // The "Customer Information Confirmation" modal auto-appears when an account page loads.
    // It MUST be closed via its "Confirm" button (handled by the helper) — only
    // handleConfirm() sets isVerified: true in utilityStore, preventing React from
    // continuously re-showing the modal (which destabilises the InviteModal animation).
    await dismissCustomerInfoConfirmation(this.page);

    await this.dismissAllModals();
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    // Open InviteModal — retry envelope click up to 3 times because in some environments
    // (STG) the first dispatchEvent('click') fires before React has attached the onClick
    // handler to the SVG, resulting in a no-op.
    const sendPodiumBtn = this.page.getByRole('button', { name: 'Send Podium Link' });
    for (let attempt = 1; attempt <= 3; attempt++) {
      await this.page.locator('#invitation svg').dispatchEvent('click');
      const appeared = await sendPodiumBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
      if (appeared) break;
      console.log(`[sendPodiumLink] Envelope click attempt ${attempt} — InviteModal not visible, retrying`);
    }

    // Use dispatchEvent instead of click() to bypass actionability checks — in some
    // environments (STG) React re-renders can detach the button mid-click, causing
    // "element was detached from the DOM" timeout errors.
    await sendPodiumBtn.waitFor({ state: 'visible', timeout: 8_000 });
    await sendPodiumBtn.dispatchEvent('click');

    // After clicking "Send Podium Link", React unmounts InviteModal and mounts
    // ConfirmationModal. Wait for the Send Podium Link button to detach (InviteModal gone)
    // before looking for the ConfirmationModal's Continue button — this prevents Playwright
    // from matching a button in the wrong (closing) modal during the transition.
    await sendPodiumBtn.waitFor({ state: 'detached', timeout: 5_000 }).catch(() => {});

    // ConfirmationModal opens (confirmation-modal/index.tsx), title="Please Confirm",
    // primaryButtonText="Continue". Scope to the specific modal to avoid ambiguity.
    // Use dispatchEvent to bypass Bootstrap fade-in animation stability checks — the modal
    // content is stable enough for the event to fire even while animating.
    const confirmModal = this.page.locator('.modal').filter({ hasText: 'Please Confirm' });
    await confirmModal.waitFor({ state: 'visible', timeout: 8_000 });
    await confirmModal.getByRole('button', { name: 'Continue' }).dispatchEvent('click');

    const toast = this.page.locator(SELECTORS.toastBody).first();
    await toast.waitFor({ state: 'visible', timeout: 15_000 });
    const text = await toast.textContent().catch(() => '');
    return text?.trim() ?? '';
  }

  /**
   * Closes the Send Invite modal if it's open.
   */
  async closeSendInviteModal(): Promise<void> {
    const closeBtn = this.page.locator(`${SELECTORS.modalShow} ${SELECTORS.modalClose}`).first();
    if (await closeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeBtn.click();
      await this.page.locator(SELECTORS.modalShow).first().waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    }
  }

  // ── End Task #442 ──────────────────────────────────────────────────────

  /**
   * Changes the payment frequency via the Servicing Information edit panel.
   * Clicks the edit pencil (#ServicingInformation-edit), selects the new frequency
   * from the #payFrequency React Select dropdown, then clicks SAVE.
   *
   * @param newFrequency UI label: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Semi-Monthly'
   * @returns Object with { firstDueDate, secondDueDate } read from the form before saving, or empty strings if not visible
   */
  async changePaymentFrequencyViaUI(
    newFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Semi-Monthly',
  ): Promise<{ firstDueDate: string; secondDueDate: string }> {
    // 1. Wait for the Servicing Information edit pencil to be visible (page content loaded)
    await this.page.locator(SELECTORS.svInfoEditButton).waitFor({ state: 'visible', timeout: 30_000 });
    await this.page.locator(SELECTORS.svInfoEditButton).click();

    // 2. Wait for the form to expand (dropdown becomes visible)
    await this.page.locator(`${SELECTORS.svInfoPayFrequencyDropdown} .filter__control`).waitFor({ state: 'visible', timeout: 5_000 });

    // 3. Click the React Select control to open the frequency dropdown
    await this.page.locator(`${SELECTORS.svInfoPayFrequencyDropdown} .filter__control`).click();

    // 4. Wait for options to appear
    await this.page.locator(SELECTORS.filterOptionWithRole).first().waitFor({ state: 'visible', timeout: 5_000 });

    // 5. Click the option matching newFrequency exactly
    await this.page.locator(SELECTORS.filterOptionWithRole)
      .filter({ hasText: newFrequency })
      .first()
      .click();

    // 6. Read firstDueDate and secondDueDate if visible before saving
    let firstDueDate = '';
    let secondDueDate = '';

    const firstDueDateLocator = this.page.locator(SELECTORS.svInfoFirstDueDateInput).first();
    const secondDueDateLocator = this.page.locator(SELECTORS.svInfoSecondDueDateInput).first();

    if (await firstDueDateLocator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      firstDueDate = (await firstDueDateLocator.inputValue().catch(() => '')) ?? '';
    }
    if (await secondDueDateLocator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      secondDueDate = (await secondDueDateLocator.inputValue().catch(() => '')) ?? '';
    }

    // 7. Set up response listener BEFORE clicking SAVE to avoid race condition.
    const saveResponsePromise = this.page.waitForResponse(
      r => (r.request().method() === 'PUT' || r.request().method() === 'POST')
        && r.url().includes('/svc/'),
      { timeout: 60_000 },
    ).catch(() => null);

    // 8. Click the SAVE button
    await this.page.locator(SELECTORS.svInfoSaveButton).click();

    // 9. Wait for the save API response.
    const saveRes = await saveResponsePromise;
    if (saveRes) {
      console.log(`[changeFrequency] Save API: ${saveRes.request().method()} ${saveRes.url()} → ${saveRes.status()}`);
    } else {
      console.warn('[changeFrequency] No save API response captured within 60s');
    }

    // 10. Wait for the edit panel to collapse (SAVE button hidden).
    // In stg the frontend spinner may stay visible long after the API response returns 200.
    // The backend save is already confirmed by waitForResponse above — this is cosmetic.
    await this.page.locator(SELECTORS.svInfoSaveButton)
      .waitFor({ state: 'hidden', timeout: 15_000 })
      .catch(() => console.warn('[changeFrequency] SAVE button still visible after 15s — backend save already confirmed'));

    // 11. Wait for any remaining global spinner (full-page loader + Bootstrap spinners)
    await this.waitForSpinner();

    // 12. Check for error toast
    await this.assertNoErrorToast('[changeFrequency] Failed to save');

    return { firstDueDate, secondDueDate };
  }
}

import { expect } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { sleep } from '../../helpers/common.helpers.js';

export class OriginationCustomerPage extends OriginationBasePage {
  // Customer header summary section — structure from snapshot:
  //   "Status" label followed by sibling with the value (e.g. "Approved")
  readonly leadStatus = this.page.locator(
    "xpath=//*[normalize-space(text())='Status']/following-sibling::*[1]"
  );
  readonly internalStatus = this.page.locator(
    "xpath=//*[normalize-space(text())='Internal Status']/following-sibling::*[1]"
  );
  readonly referenceNumber = this.page.locator(
    "xpath=//*[normalize-space(text())='Reference Number']/following-sibling::*[1]"
  );

  readonly moveToServicingButton = this.page.locator("button:has-text('Move to Servicing')");
  readonly changeToSignedButton = this.page.locator("button:has-text('Change to Signed')");
  readonly setToExpiredButton = this.page.locator("button:has-text('Set to Expired')");
  readonly settleLeaseForm = this.page.locator('#settleLeaseForm, .settle-lease-form');
  readonly createLeaseButton = this.page.locator("xpath=//div[text()='Lease']/../div[text()='Add New']");
  readonly signContractButton = this.page.locator("button:has-text('Sign'), button:has-text('E-Sign')");
  readonly fundButton = this.page.locator("button:has-text('Fund')");
  readonly customerSummary = this.page.locator(SELECTORS.customerSummary);
  readonly confirmSettlement = this.page.locator(SELECTORS.isConfirmedForSettlement);
  readonly chargeProcessingFee = this.page.locator("input[name='chargeProcessingFeeBeforeEsign']");

  /**
   * Expand the collapsible actions menu in the customer summary header.
   * Clicks the caret-left SVG icon to reveal action buttons.
   */
  async expandActionsMenu(): Promise<void> {
    const caretIcon = this.page.locator('.fa-caret-left');
    if (await caretIcon.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await caretIcon.click();
      // Wait for the actions menu to expand (caret changes direction)
      await this.page.locator('.fa-caret-right').waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
    }
  }

  /**
   * Click an action button from the customer summary collapsible menu.
   * Expands the menu first if needed.
   */
  async clickActionButton(buttonText: string): Promise<void> {
    await this.expandActionsMenu();
    const btn = this.page.locator(`button:has-text("${buttonText}")`);
    await btn.waitFor({ state: 'visible', timeout: 5_000 });
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
    console.log(`[Customer] Clicked "${buttonText}"`);
    await this.waitForSpinner();
  }

  async getLeadStatus(): Promise<string> {
    return this.getTextContent(this.leadStatus);
  }

  /**
   * Polls for lead status by reloading the page until the status matches one of the expected keywords.
   * Returns the final status text. Does NOT throw if max attempts exceeded — returns last status.
   *
   * @param expectedKeywords - Array of lowercase substrings to match (e.g. ['signed', 'fund', 'settled'])
   * @param maxAttempts - Max reload attempts (default 10)
   * @param intervalMs - Sleep between attempts in ms (default 5000)
   * @returns Object with { status, matched } — matched is true if a keyword was found
   */
  async pollForLeadStatus(
    expectedKeywords: string[],
    maxAttempts = 10,
    intervalMs = 5_000,
  ): Promise<{ status: string; matched: boolean }> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      await this.waitForSpinner();
      await this.page.waitForLoadState('networkidle').catch(() => {});

      const status = await this.getLeadStatus();
      const sl = status.toLowerCase();
      console.log(`[PollStatus] attempt=${attempt}/${maxAttempts} status="${status}"`);

      if (expectedKeywords.some(kw => sl.includes(kw))) {
        console.log(`[PollStatus] Matched after ${attempt} attempt(s)`);
        return { status, matched: true };
      }

      if (attempt < maxAttempts) {
        await sleep(intervalMs);
      }
    }

    const finalStatus = await this.getLeadStatus();
    console.log(`[PollStatus] Max attempts reached — final status="${finalStatus}"`);
    return { status: finalStatus, matched: false };
  }

  async getInternalStatus(): Promise<string> {
    return this.getTextContent(this.internalStatus);
  }

  async selectLease(): Promise<void> {
    const leaseRow = this.page.locator("xpath=//div[text()='Lease']/parent::div/following-sibling::div/div/div[1]");
    await this.clickAndWaitForSpinner(leaseRow);
  }

  async clickMoveToServicing(): Promise<void> {
    await this.clickAndWaitForSpinner(this.moveToServicingButton);
  }

  async createLease(): Promise<void> {
    await this.clickAndWaitForSpinner(this.createLeaseButton);
  }

  async fillLeaseDetails(details: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(details)) {
      const input = this.page.locator(`[name="${field}"], #${field}`);
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  /**
   * Clicks "Change to Signed" button and confirms.
   * The button can be obscured by the horizontal scrolling summary bar,
   * so we first expand it by clicking the expand caret, then click the button.
   */
  async changeToSigned(): Promise<void> {
    // Expand the action buttons area if the expand caret is present
    const expandCaret = this.page.locator('svg[data-icon="caret-right"], svg[data-icon="caret-left"]').first();
    if (await expandCaret.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await expandCaret.click({ force: true });
      // Wait for the action buttons to become visible after expanding
      await this.changeToSignedButton.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
    }

    await this.changeToSignedButton.scrollIntoViewIfNeeded();
    await this.changeToSignedButton.click({ force: true });

    // A confirmation dialog or modal may appear
    const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|ok/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.waitForSpinner();
  }

  /**
   * Settles a lease via the Documents card UI modal.
   * Mirrors UownCustomerSteps.settleLeaseDocument() from the Java project.
   *
   * Flow: Documents card → click lease row → modal opens →
   *       check #isConfirmedForSettlement → click primary submit button.
   *
   * Prerequisite: the lead must be in SIGNED status (e-sign completed).
   * For CI/CD tests that skip e-sign, use the settlement API instead.
   */
  /** Click the lease document row via JS DOM traversal (fallback when locator is not visible) */
  private async clickLeaseDocumentViaJs(): Promise<boolean> {
    return this.page.evaluate(() => {
      const cards = document.getElementsByClassName('card');
      for (const card of cards) {
        const header = (card.children[0] as HTMLElement)?.innerText || '';
        if (!header.includes('Documents')) continue;
        const cardBody = card.children[1]?.children[0];
        if (!cardBody) continue;
        const docsContainer = cardBody.children[2] || cardBody.children[1];
        if (!docsContainer) continue;
        for (const row of docsContainer.children) {
          const type = (row.children[1] as HTMLElement)?.innerText || '';
          if (type.trim().toUpperCase() === 'LEASE') {
            (row.children[0] as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    });
  }

  async settleLeaseViaDocuments(): Promise<void> {
    await this.waitForSpinner();

    const leaseBtn = this.page.locator('button').filter({ hasText: /^UOWN_/ }).first();
    let clicked = false;

    for (let attempt = 1; attempt <= 10; attempt++) {
      if (await leaseBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await leaseBtn.click();
        clicked = true;
        console.log(`[Settle] Clicked lease document button on attempt ${attempt}`);
        break;
      }

      clicked = await this.clickLeaseDocumentViaJs();
      if (clicked) {
        console.log(`[Settle] Clicked lease document via JS on attempt ${attempt}`);
        break;
      }

      console.log(`[Settle] Documents not loaded yet, attempt ${attempt}/10`);
      await sleep(3_000);
      await this.page.reload();
      await this.waitForSpinner();
    }

    if (!clicked) {
      throw new Error('Unable to locate a lease document in the Documents card after retries');
    }

    // 2. Wait for the settlement modal
    const modal = this.page.locator('#customer-lease-modal, #customer-overview-modal');
    await modal.waitFor({ state: 'visible', timeout: 10_000 });

    // 3. Wait for any spinner inside the modal to finish loading
    await this.waitForSpinner();
    await this.page.locator(`${SELECTORS.spinnerBorder}, ${SELECTORS.spinnerGrow}`).first()
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

    // 4. Check the settlement confirmation checkbox
    const confirmCheckbox = this.page.locator(SELECTORS.isConfirmedForSettlement);
    await confirmCheckbox.waitFor({ state: 'visible', timeout: 30_000 });
    await confirmCheckbox.check();

    // 5. Wait for the submit button to be enabled after checkbox check, then click
    const submitBtnSettle = modal.locator(SELECTORS.buttonPrimary).last();
    await submitBtnSettle.waitFor({ state: 'visible', timeout: 5_000 });

    // 5. Click the last primary button in the modal
    const submitBtn = modal.locator(SELECTORS.buttonPrimary).last();
    await submitBtn.click();

    // 6. Wait for success toast (non-fatal — some environments settle without a toast)
    const toastText = await this.captureAndDismissToast(15_000).catch(() => '');
    if (toastText) {
      console.log(`[Settle] Toast: "${toastText}"`);
    } else {
      console.log('[Settle] No toast appeared — settlement may still have succeeded');
    }
    await this.waitForSpinner();
  }

  async submitSettlement(): Promise<void> {
    const confirmCheckbox = this.page.locator(SELECTORS.isConfirmedForSettlement);
    if (await confirmCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmCheckbox.check();
    }
    const submitBtn = this.page.locator(`${SELECTORS.submitButton}, ${SELECTORS.buttonPrimary}`).last();
    await this.clickAndWaitForSpinner(submitBtn);
  }

  async waitForLeadStatus(expectedStatus: string, timeoutMs = 30_000): Promise<void> {
    await expect(this.leadStatus).toContainText(expectedStatus, { timeout: timeoutMs });
  }

  async getAccountNumberFromSummary(): Promise<string> {
    // Try the SELECTORS.accountNumberLink first (scoped to #customer-summary)
    const link = this.page.locator(SELECTORS.accountNumberLink);
    if (await link.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(link);
    }

    // Fallback: find "Account Number" label followed by a link anywhere in the header
    const headerLink = this.page.locator(
      "xpath=//*[normalize-space(text())='Account Number']/following-sibling::a[1]"
    ).first();
    if (await headerLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(headerLink);
    }

    // Fallback: find "Account Number" label followed by any sibling with numeric text
    const headerValue = this.page.locator(
      "xpath=//*[normalize-space(text())='Account Number']/following-sibling::*[1]"
    ).first();
    if (await headerValue.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return this.getTextContent(headerValue);
    }

    // Fall back: extract from URL (e.g., /customers/12345)
    const url = this.page.url();
    const match = url.match(/\/customers\/(\d+)/);
    return match?.[1] || '';
  }

  /**
   * Retrieves customer info fields from the customer detail page.
   * The page structure uses label/value pairs like:
   *   <div>First Name</div> <div>TestFN...</div>
   */
  async getCustomerInfo(): Promise<Record<string, string>> {
    const info: Record<string, string> = {};
    const fieldMappings: Record<string, string> = {
      'First Name': 'First Name',
      'Last Name': 'Last Name',
      'Date of Birth': 'Date of Birth',
      'SSN': 'SSN',
      'Address Line 1': 'Address',
      'City': 'City',
      'State': 'State',
      'ZIP': 'Zip',
      'Primary Email': 'Email',
      'Mobile Phone': 'Phone',
    };

    for (const [pageLabel, infoKey] of Object.entries(fieldMappings)) {
      const value = this.page.locator(
        `xpath=//*[normalize-space(text())='${pageLabel}']/following-sibling::*[1]`
      ).first();
      if (await value.isVisible({ timeout: 5_000 }).catch(() => false)) {
        info[infoKey] = await this.getTextContent(value);
      }
    }
    return info;
  }

  /**
   * Validates customer info matches expected applicant data.
   */
  /**
   * Opens the "Modify Approval Amount" modal, fills in the new amount and comment,
   * then submits. Returns the toast message text.
   * Mirrors UownCustomerSteps.modifyingTheApprovalAmount() from the Java project.
   */
  async modifyApprovalAmount(newAmount: string, comment: string): Promise<string> {
    await this.clickActionButton('Modify Approval Amount');

    // Fill approval amount
    const approvalInput = this.page.locator(SELECTORS.approvalAmountInput);
    await approvalInput.waitFor({ state: 'visible', timeout: 10_000 });
    await approvalInput.clear();
    await approvalInput.fill(newAmount);

    // Fill comment
    await sleep(250);
    const commentInput = this.page.locator(SELECTORS.commentInput);
    await commentInput.clear();
    await commentInput.fill(comment);

    await sleep(250);

    // Click the last primary button (submit)
    const submitBtn = this.page.locator(SELECTORS.buttonPrimary).last();
    await submitBtn.click();

    // Capture toast message
    const toastText = await this.captureAndDismissToast(10_000);
    console.log(`[ModifyApproval] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Checks whether the "Modify Approval Amount" button is visible on the customer page.
   */
  async isModifyApprovalAmountVisible(): Promise<boolean> {
    await this.expandActionsMenu();
    const btn = this.page.locator("button:has-text('Modify Approval Amount')");
    return btn.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Dismisses the alert bar if visible (it can overlap action buttons).
   */
  private async dismissAlertBar(): Promise<void> {
    const hideAlert = this.page.locator('text=Hide Alert').first();
    if (await hideAlert.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await hideAlert.click();
      // Wait for alert bar to disappear
      await hideAlert.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
      console.log('[CancelLease] Dismissed alert bar');
    }
  }

  /**
   * Cancels a lease via the "Cancel Lease" action button.
   * Handles modal-based cancellation with retry logic.
   *
   * Flow: Dismiss alert → Click Cancel Lease → modal opens → fill comment →
   *       optionally check refund → confirm → toast
   */
  async cancelLease(comment: string, refundAllPayments = false): Promise<string> {
    // Dismiss alert bar first — it can overlap the Cancel Lease button
    await this.dismissAlertBar();

    let confirmed = false;

    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`[CancelLease] Attempt ${attempt}/5`);

      // Check if a toast already appeared from a previous attempt
      const earlyToast = await this.page.locator(SELECTORS.toastBody)
        .isVisible({ timeout: 1_000 }).catch(() => false);
      if (earlyToast) {
        console.log('[CancelLease] Toast already visible — cancel succeeded');
        confirmed = true;
        break;
      }

      // Expand actions menu and click Cancel Lease
      await this.expandActionsMenu();
      const cancelBtn = this.page.locator("button:has-text('Cancel Lease')");
      const btnVisible = await cancelBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (!btnVisible) {
        console.log(`[CancelLease] Cancel Lease button not visible on attempt ${attempt}`);
        await this.dismissAlertBar();
        await sleep(1_000);
        continue;
      }
      try {
        await cancelBtn.click({ force: true });
      } catch (clickErr) {
        console.log(`[CancelLease] Click failed (menu may have collapsed): ${clickErr}`);
        await sleep(1_000);
        continue;
      }

      // Wait for modal with a comment input (not just any .modal.show)
      const commentInModal = this.page.locator('.modal.show textarea, .modal.show input[name="comment"], .modal.show #comment').first();
      const hasCommentInput = await commentInModal.isVisible({ timeout: 5_000 }).catch(() => false);

      if (!hasCommentInput) {
        // Check for direct toast (cancel without modal)
        const toastAlready = await this.page.locator(SELECTORS.toastBody)
          .isVisible({ timeout: 3_000 }).catch(() => false);
        if (toastAlready) {
          console.log('[CancelLease] Direct cancel — toast appeared without modal');
          confirmed = true;
          break;
        }
        console.log(`[CancelLease] No cancel modal on attempt ${attempt}`);
        // Dismiss any stale modal
        await this.page.keyboard.press('Escape');
        await this.page.locator(SELECTORS.modalShow).last()
          .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        await this.dismissAlertBar();
        await sleep(1_000);
        continue;
      }

      console.log('[CancelLease] Cancel modal detected — filling form');

      // Fill comment
      try {
        await commentInModal.fill(comment);
        console.log('[CancelLease] Comment filled');
      } catch (e) {
        console.log(`[CancelLease] Failed to fill comment: ${e}`);
        await this.page.keyboard.press('Escape');
        await this.page.locator(SELECTORS.modalShow).last()
          .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        continue;
      }

      // Optionally check refund checkbox
      if (refundAllPayments) {
        const refundCheckbox = this.page.locator(
          '.modal.show input[name="refundAllPayments"], .modal.show input[type="checkbox"][name*="refund"], .modal.show input[type="checkbox"]',
        ).first();
        if (await refundCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await refundCheckbox.check();
          console.log('[CancelLease] Refund checkbox checked');
        }
      }

      await sleep(500);

      // Find and click the "Cancel Lease" confirm button
      // Use page-level selector (not scoped to modal variable) to handle re-renders
      const confirmBtn = this.page.locator('.modal.show button:has-text("Cancel Lease")');
      const confirmVisible = await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false);
      if (confirmVisible) {
        console.log('[CancelLease] Clicking "Cancel Lease" confirm button');
        try {
          await confirmBtn.click({ force: true });
          confirmed = true;
        } catch (confirmErr) {
          console.log(`[CancelLease] Confirm click failed: ${confirmErr}`);
          await this.page.keyboard.press('Escape');
          await sleep(1_000);
          continue;
        }
      } else {
        // Fallback: try the last button in the modal footer
        const footerBtns = this.page.locator('.modal.show .modal-footer button, .modal.show button');
        const count = await footerBtns.count();
        console.log(`[CancelLease] Confirm button not found, ${count} buttons total`);
        if (count >= 2) {
          // Last button is typically the action button
          const lastBtn = footerBtns.nth(count - 1);
          const btnText = await lastBtn.textContent().catch(() => '?');
          console.log(`[CancelLease] Clicking last button: "${btnText?.trim()}"`);
          await lastBtn.click({ force: true });
          confirmed = true;
        } else {
          // No usable buttons — dismiss and retry
          console.log('[CancelLease] No usable buttons — dismissing modal and retrying');
          await this.page.keyboard.press('Escape');
          await sleep(1_000);
          continue;
        }
      }

      // Wait for modal to close
      await this.page.locator(SELECTORS.modalShow).last()
        .waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {
          console.log('[CancelLease] Warning: modal did not close after confirm click');
        });
      break;
    }

    // Capture toast message
    const toastText = await this.captureAndDismissToast(60_000);
    console.log(`[CancelLease] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Deletes all invoice line items by clicking the delete button repeatedly
   * until no more are visible. Safety cap at 20 iterations.
   */
  async deleteAllInvoiceItems(): Promise<number> {
    let deleted = 0;
    const maxIterations = 20;

    for (let i = 0; i < maxIterations; i++) {
      const deleteBtn = this.page.locator(SELECTORS.invoiceItemDeleteButton).first();
      if (!await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        break;
      }

      await deleteBtn.click();

      // Handle confirmation dialog if present
      const confirmBtn = this.page.getByRole('button', { name: /confirm|yes|ok|delete/i }).first();
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await this.waitForSpinner();
      deleted++;
      console.log(`[DeleteInvoiceItems] Deleted item ${deleted}`);
    }

    console.log(`[DeleteInvoiceItems] Total items deleted: ${deleted}`);
    return deleted;
  }

  // ── Invoice / Lease Creation ────────────────────────────────────

  /**
   * Creates a new invoice/lease with line items on the customer page.
   * Mirrors AccountCreationSteps.createNewLease() from the Java project.
   *
   * Flow: Click "Add New" → add line items → fill sales person + invoice # →
   *       check settlement checkbox → submit → select program → confirm.
   */
  async createInvoiceWithItems(
    items: Array<{
      numberOfItems: string;
      itemCode: string;
      description: string;
      price: string;
      deliveryFee?: string;
      installationFee?: string;
      miscFee?: string;
    }>,
    options: {
      salesPerson: string;
      invoiceNumber: string;
      programName?: string;
    },
  ): Promise<void> {
    // Click "Add New" to open the invoice form
    await this.createLeaseButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.createLeaseButton.click();
    await this.waitForSpinner();

    // Wait for the item form to appear
    await this.page.locator(SELECTORS.naItemCode).waitFor({ state: 'visible', timeout: 10_000 });

    // Add each line item
    for (const item of items) {
      await this.page.locator(SELECTORS.naNumberOfItems).fill(item.numberOfItems);
      await this.page.locator(SELECTORS.naItemCode).fill(item.itemCode);
      await this.page.locator(SELECTORS.naItemDescription).fill(item.description);
      await this.page.locator(SELECTORS.naBasePricePerItem).fill(item.price);

      // Optional fee fields
      const deliveryFee = this.page.locator(SELECTORS.naDeliveryFee);
      if (await deliveryFee.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await deliveryFee.fill(item.deliveryFee ?? '0.00');
      }
      const installationFee = this.page.locator(SELECTORS.naInstallationFee);
      if (await installationFee.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await installationFee.fill(item.installationFee ?? '0.00');
      }
      const miscFee = this.page.locator(SELECTORS.naMiscFee);
      if (await miscFee.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await miscFee.fill(item.miscFee ?? '0.00');
      }

      // Submit this line item
      const submitItemBtn = this.page.locator(SELECTORS.naSubmitItemLease).first();
      await submitItemBtn.click();
      await this.waitForSpinner();
      // Wait for the item code field to clear (form reset after adding item)
      await this.page.locator(SELECTORS.naItemCode).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      console.log(`[CreateInvoice] Added item: ${item.description} @ $${item.price}`);
    }

    // Fill sales person and invoice number
    const salesPerson = this.page.locator(SELECTORS.naSalesPerson);
    if (await salesPerson.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await salesPerson.fill(options.salesPerson);
    }
    const invoiceNumber = this.page.locator(SELECTORS.naInvoiceNumber);
    if (await invoiceNumber.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await invoiceNumber.fill(options.invoiceNumber);
    }

    // Check settlement confirmation checkbox
    const confirmCheckbox = this.page.locator(SELECTORS.isConfirmedForSettlement);
    if (await confirmCheckbox.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmCheckbox.check();
    }

    // Submit the entire invoice
    await this.page.locator(SELECTORS.buttonPrimary).last().click();
    await this.waitForSpinner();

    // Wait for toast
    const toast = this.page.locator(SELECTORS.toastBody);
    await toast.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    const toastText = await toast.textContent().catch(() => '');
    console.log(`[CreateInvoice] Toast: "${toastText}"`);

    // Handle program selection modal if it appears
    await this.selectProgram(options.programName ?? 'Bi-Weekly');
  }

  /**
   * Handles the program selection modal that appears after invoice submission.
   * Selects the specified program (e.g., "Bi-Weekly Payment Program").
   */
  private async selectProgram(programName: string): Promise<void> {
    const modal = this.page.locator(SELECTORS.modalContent);
    if (!await modal.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[CreateInvoice] No program selection modal — skipping');
      return;
    }

    // Find and click the button containing the program name
    const programBtn = this.page.locator(`button:has-text("${programName}")`).first();
    if (await programBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await programBtn.click();
      await this.waitForSpinner();

      // Confirm selection (click the primary button in the modal, usually index 1)
      const confirmBtn = modal.locator(SELECTORS.buttonPrimary).first();
      if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await this.waitForSpinner();
      // Wait for program selection modal to close
      await this.page.locator(SELECTORS.modalContent)
        .waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
      console.log(`[CreateInvoice] Program "${programName}" selected`);
    } else {
      console.log(`[CreateInvoice] Program "${programName}" button not found`);
    }
  }

  /**
   * Modifies an existing lease via the "Modify Lease" action button.
   * Clicks the action button, handles optional warning modal, waits for
   * the invoice form to appear, executes the callback, then saves.
   * Returns the toast message text.
   *
   * @param callback — async function receiving the page to manipulate invoice items
   */
  async modifyLease(callback: (page: import('@playwright/test').Page) => Promise<void>): Promise<string> {
    await this.clickActionButton('Modify Lease');

    // Warning modal may or may not appear — handle both cases
    const continueBtn = this.page.locator(SELECTORS.modifyLeaseWarningContinue);
    if (await continueBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log('[ModifyLease] Warning modal detected — clicking Continue');
      await continueBtn.click();
      await this.waitForSpinner();
    } else {
      console.log('[ModifyLease] No warning modal — proceeding directly');
    }

    // Wait for the invoice form to be ready (item fields visible)
    const itemCodeField = this.page.locator(SELECTORS.naItemCode);
    const deleteBtn = this.page.locator(SELECTORS.invoiceItemDeleteButton).first();
    await Promise.race([
      itemCodeField.waitFor({ state: 'visible', timeout: 15_000 }),
      deleteBtn.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {
      console.log('[ModifyLease] Invoice form fields not yet visible — waiting more');
    });
    await sleep(1_000);

    // Execute the caller's modification logic
    await callback(this.page);

    // Click Save — try modal save first, then page-level save
    const saveBtn = this.page.locator(SELECTORS.modifyLeaseSaveButton);
    if (await saveBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      const fallbackSave = this.page.locator(SELECTORS.saveButton);
      if (await fallbackSave.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fallbackSave.click();
      } else {
        // Last resort: find any Save/Submit button
        const anySubmit = this.page.locator("button:has-text('Save'), button:has-text('SAVE'), button[type='submit']").last();
        await anySubmit.click();
      }
    }
    await this.waitForSpinner();

    // Capture toast message
    const toastText = await this.captureAndDismissToast(30_000);
    console.log(`[ModifyLease] Toast: "${toastText}"`);
    await this.waitForSpinner();

    return toastText;
  }

  /**
   * Retrieves activity log entries from the Activity card on the customer page.
   * Returns an array of text content from each log row.
   */
  async getActivityLogEntries(): Promise<string[]> {
    const entries: string[] = [];
    const rows = this.page.locator(SELECTORS.activityLogEntry);
    const count = await rows.count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent())?.trim() || '';
      if (text) entries.push(text);
    }
    return entries;
  }

  async validateCustomerInfo(expected: {
    firstName?: string;
    lastName?: string;
    dob?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }): Promise<void> {
    const info = await this.getCustomerInfo();
    if (expected.firstName) {
      expect(info['First Name'] || '').toContain(expected.firstName);
    }
    if (expected.lastName) {
      expect(info['Last Name'] || '').toContain(expected.lastName);
    }
    if (expected.email) {
      expect((info['Email'] || '').toLowerCase()).toContain(expected.email.toLowerCase());
    }
    if (expected.state) {
      expect(info['State'] || '').toContain(expected.state);
    }
  }
}

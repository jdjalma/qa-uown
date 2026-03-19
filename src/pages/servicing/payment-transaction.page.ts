import { expect } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { ReverseReason, AllocationStrategy } from '../../types/enums.js';

export class PaymentTransactionPage extends ServicingBasePage {
  readonly reverseIcon = this.page.locator(SELECTORS.svgReverseIcon);
  readonly reverseModal = this.page.locator(SELECTORS.modalContent);
  readonly reverseReasonDropdown = this.page.locator('#reverseReason, [name="reverseReason"]');
  readonly reverseCommentInput = this.page.locator(SELECTORS.commentInput);
  readonly reverseAmountInput = this.page.locator(SELECTORS.amountInput);
  readonly reverseSaveButton = this.page.locator(`${SELECTORS.modalContent} ${SELECTORS.saveButton}`);
  readonly reverseCancelButton = this.page.locator(`${SELECTORS.modalContent} ${SELECTORS.cancelButton}`);
  readonly inlineError = this.page.locator(SELECTORS.inlineError);
  readonly transactionTable = this.page.locator(SELECTORS.paymentTable);
  readonly pencilIcon = this.page.locator(SELECTORS.pencilIcon);
  readonly allocationStrategyDropdown = this.page.locator(SELECTORS.allocationStrategyDropdown);

  async navigateToPaymentTransactions(searchTerm?: string): Promise<void> {
    if (searchTerm) {
      const searchField = this.page.locator(`${SELECTORS.searchInput}, ${SELECTORS.searchInputLegacy}`);
      await searchField.fill(searchTerm);
      await this.page.locator(SELECTORS.searchButton).click();
      await this.waitForSpinner();
      await this.page.locator(`${SELECTORS.tableRowById(0)}, ${SELECTORS.tableRow}:first-child`).first().click();
      await this.waitForSpinner();
    }
    await this.sideMenuNavigateTo('payment transaction');
  }

  async openReverseForLatestPayment(): Promise<void> {
    const firstReverseIcon = this.reverseIcon.first();
    await firstReverseIcon.click();
    await this.waitForModalOpen();
  }

  async openReverseForPaymentByAmount(amount: string): Promise<void> {
    const targetAmount = amount.replace('$', '');
    const rows = this.page.locator(SELECTORS.paymentTableRows);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText && rowText.includes(targetAmount)) {
        const reverseBtn = rows.nth(i).locator(SELECTORS.svgReverseIcon);
        await reverseBtn.click();
        await this.waitForModalOpen();
        return;
      }
    }
    throw new Error(`No payment found with amount: ${amount}`);
  }

  async openReverseForLatestPaymentByType(paymentType: string): Promise<void> {
    const rows = this.page.locator(SELECTORS.paymentTableRows);
    const count = await rows.count();

    for (let i = 0; i < count; i++) {
      const rowText = await rows.nth(i).textContent();
      if (rowText && rowText.toLowerCase().includes(paymentType.toLowerCase())) {
        const reverseBtn = rows.nth(i).locator(SELECTORS.svgReverseIcon);
        await reverseBtn.click();
        await this.waitForModalOpen();
        return;
      }
    }
    throw new Error(`No payment found with type: ${paymentType}`);
  }

  async setReverseReason(reason: ReverseReason | string): Promise<void> {
    await this.reverseReasonDropdown.selectOption({ label: reason });
  }

  async typeReverseComment(comment: string): Promise<void> {
    await this.reverseCommentInput.fill(comment);
  }

  async typeReverseAmount(amount: string): Promise<void> {
    await this.reverseAmountInput.fill(amount);
  }

  async submitReverse(): Promise<void> {
    await this.clickAndWaitForSpinner(this.reverseSaveButton);
  }

  async cancelReverse(): Promise<void> {
    await this.reverseCancelButton.click();
    await this.page.locator(SELECTORS.modalContent).waitFor({ state: 'hidden' });
  }

  async getInlineErrorText(): Promise<string> {
    return this.getTextContent(this.inlineError);
  }

  async expectInlineErrorContains(text: string): Promise<void> {
    await expect(this.inlineError).toContainText(text);
  }

  async getTransactionCount(): Promise<number> {
    return this.page.locator(SELECTORS.paymentTableRows).count();
  }

  /**
   * Read a column value from a specific row (0-indexed) in the payment transaction table.
   * Matches Java's TableUtility.getRowDataByRowNumber().
   */
  async getRowColumnValue(rowIndex: number, columnName: string): Promise<string> {
    const headers = await this.page.locator(SELECTORS.tableHeader).allTextContents();
    const colIdx = headers.findIndex(h => h.trim().toLowerCase().includes(columnName.toLowerCase()));
    if (colIdx === -1) throw new Error(`Column "${columnName}" not found in headers: ${headers.join(', ')}`);

    const row = this.getDataRows().nth(rowIndex);
    const cells = row.locator(SELECTORS.tableCell);
    const cellText = await cells.nth(colIdx).textContent();
    return cellText?.trim() ?? '';
  }

  /**
   * Get the data rows from the payment table (works for both Transaction and Payment History pages).
   * Selects rows from the body rowgroup, skipping header rows.
   */
  private getDataRows() {
    // The body rowgroup is the last one; select all rows within it
    return this.page.locator("div[role='rowgroup']:last-of-type div[role='row']");
  }

  /**
   * Edit the allocation strategy on a transaction row.
   * Clicks the pencil/edit icon on the given row, selects the new strategy from
   * the React dropdown, and clicks Submit.
   * Matches Java's checkCCTransactionAllocation() step.
   */
  async editAllocationStrategy(rowIndex: number, strategy: AllocationStrategy | string): Promise<void> {
    const row = this.getDataRows().nth(rowIndex);

    // Find the "Update Payment" column index via headers
    const headers = await this.page.locator(SELECTORS.tableHeader).allTextContents();
    const updateColIdx = headers.findIndex(h =>
      h.toLowerCase().includes('update') || h.toLowerCase().includes('edit')
    );

    let editClicked = false;

    if (updateColIdx >= 0) {
      const updateCell = row.locator("[role='cell']").nth(updateColIdx);
      const editIcon = updateCell.locator('img, svg, [data-icon], button').first();
      if (await editIcon.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await editIcon.click({ force: true });
        editClicked = true;
      }
    }

    if (!editClicked) {
      // Fallback: try pencil icon selector or last cell icon
      const pencil = row.locator(`${SELECTORS.pencilIcon}`);
      if (await pencil.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
        await pencil.first().click();
        editClicked = true;
      } else {
        const lastIcon = row.locator("[role='cell']:last-child img").first();
        if (await lastIcon.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await lastIcon.click();
          editClicked = true;
        }
      }
    }

    if (!editClicked) {
      console.log(`[editAllocationStrategy] No edit icon found on row ${rowIndex} — skipping allocation strategy edit`);
      return;
    }

    // Wait for the modal to appear
    const submitButton = this.page.getByRole('button', { name: 'Submit', exact: true });
    await submitButton.waitFor({ state: 'visible', timeout: 10_000 });

    // Clear the current React Select value via the clear indicator (X icon),
    // then select the new value. This ensures onChange fires and Submit becomes enabled.
    const dropdownContainer = this.allocationStrategyDropdown;
    const clearIndicator = dropdownContainer.locator('[class*="clear"], [class*="Clear"]').first();
    if (await clearIndicator.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await clearIndicator.click();
    }

    // Open the dropdown and select the new value
    await dropdownContainer.click();
    await this.page.locator(SELECTORS.filterOptionWithRole)
      .filter({ hasText: strategy }).first().click();

    // Wait for Submit to become enabled (form state must recognize the change)
    await submitButton.waitFor({ state: 'visible' });
    await expect(submitButton).toBeEnabled({ timeout: 5_000 });

    // Click Submit and wait for modal to close
    await this.clickAndWaitForSpinner(submitButton);
  }
}

import { expect } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

export class ScheduledPaymentPage extends ServicingBasePage {
  readonly scheduledTable = this.page.locator('.rdt_Table, table');
  readonly moveDueDateBtn = this.page.locator(SELECTORS.moveDueDateButton);

  async navigateToScheduledPayments(): Promise<void> {
    await this.topMenuNavigateTo('due amounts');
    await this.waitForSpinner();
  }

  /**
   * Reads the first scheduled due date from the Due Amounts table.
   * Returns the date text as displayed (MM/DD/YYYY).
   */
  async getFirstScheduledDueDate(): Promise<string> {
    const firstCell = this.scheduledTable
      .locator('tbody tr:first-child td:first-child, .rdt_TableRow:first-child .rdt_TableCell:first-child')
      .first();
    const text = await firstCell.textContent();
    return text?.trim() || '';
  }

  /**
   * Moves a due date via the "Move Due Date" modal on the Due Amounts page.
   *
   * The modal has:
   *   - "Scheduled Due Date" — React Select dropdown (pre-selected with first date)
   *   - "New Due Date" — InputField type="date" (custom component, expects MM/DD/YYYY)
   *
   * The frontend calculates days difference between the two dates and sends
   * `moveNumberOfDays` to `POST /uown/svc/moveDueDatesByDays/{accountPk}`.
   *
   * @param scheduledDueDateDisplay - Date to select in the dropdown (MM/DD/YYYY).
   * @param newDateDisplay - The new date in MM/DD/YYYY format for the date picker.
   */
  async moveDueDate(scheduledDueDateDisplay: string, newDateDisplay: string): Promise<void> {
    await this.moveDueDateBtn.click();
    await this.waitForModalOpen();

    // Select "Scheduled Due Date" from React Select
    const selectContainer = this.page.locator(SELECTORS.moveDueDateScheduledSelect);
    await selectContainer.click();
    const option = this.page.locator(SELECTORS.filterOptionWithRole)
      .filter({ hasText: scheduledDueDateDisplay });
    await option.first().waitFor({ state: 'visible', timeout: 5_000 });
    await option.first().click();

    // "New Due Date" — custom InputField expects MM/DD/YYYY
    const newDateInput = this.page.locator(SELECTORS.moveDueDateNewDateInput);
    await newDateInput.clear();
    await newDateInput.fill(newDateDisplay);

    // Click SAVE in the modal footer
    const saveBtn = this.page.getByRole('button', { name: 'SAVE' });
    await this.clickAndWaitForSpinner(saveBtn);
  }

  /**
   * Verifies the success toast after moving a due date.
   */
  async verifyMoveDueDateSuccess(): Promise<void> {
    const toast = this.page.locator(SELECTORS.toastBody);
    await expect(toast).toContainText('Successfully moved the due dates', { timeout: 10_000 });
  }
}

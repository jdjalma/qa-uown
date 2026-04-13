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

    // Select "Scheduled Due Date" via type-ahead (click option doesn't work inside modal)
    const selectInput = this.page.locator(SELECTORS.moveDueDateScheduledSelect);
    await selectInput.click();
    await selectInput.pressSequentially(scheduledDueDateDisplay, { delay: 20 });
    await this.page.keyboard.press('Enter');

    // "New Due Date" — custom InputField expects MM/DD/YYYY
    const newDateInput = this.page.locator(SELECTORS.moveDueDateNewDateInput);
    await newDateInput.clear();
    await newDateInput.fill(newDateDisplay);

    // Click SAVE — don't wait for spinner (toast auto-dismisses quickly)
    const saveBtn = this.page.getByRole('button', { name: 'SAVE' });
    await saveBtn.click();
  }

  /**
   * Moves the due date by using the FIRST available option from the dropdown
   * and shifting it by `offsetDays` days.
   *
   * The Move Due Date modal uses a React Select whose Formik initialValue
   * (raw date format) doesn't match the formatted options — so the InputField
   * resets Formik's value to null on mount. We MUST click an option to set
   * the Formik value via React Select's onChange.
   *
   * Strategy: open dropdown → read first date → click it → fill New Due Date → SAVE.
   * Success indicator: modal closes (frontend toggle() on 200 response).
   *
   * @param offsetDays - Number of days to add to the selected scheduled date.
   * @returns `{ selectedDate, newDate }` both in MM/DD/YYYY format.
   */
  async moveDueDateFirstOption(offsetDays: number): Promise<{ selectedDate: string; newDate: string }> {
    await this.moveDueDateBtn.click();
    await this.waitForModalOpen();

    // Open dropdown and click the first option to set Formik value
    const selectInput = this.page.locator(SELECTORS.moveDueDateScheduledSelect);
    const optionLocator = this.page.locator(SELECTORS.filterOptionWithRole);

    await selectInput.click();
    await optionLocator.first().waitFor({ state: 'visible', timeout: 5_000 });

    const selectedDate = (await optionLocator.first().textContent())?.trim() || '';
    if (!selectedDate) throw new Error('No dates found in Move Due Date dropdown');

    // Click the first option — triggers onChange → Formik.setFieldValue
    await optionLocator.first().click();
    console.log(`[moveDueDateFirstOption] Clicked first option: ${selectedDate}`);

    // Calculate new date from selected + offset
    const [m, d, y] = selectedDate.split('/');
    const dt = new Date(`${y}-${m}-${d}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() + offsetDays);
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const newDate = `${mm}/${dd}/${dt.getUTCFullYear()}`;

    // Fill the "New Due Date" input
    const newDateInput = this.page.locator(SELECTORS.moveDueDateNewDateInput);
    await newDateInput.clear();
    await newDateInput.fill(newDate);

    // Click SAVE and wait for modal to close (frontend calls toggle() on success)
    const saveBtn = this.page.getByRole('button', { name: 'SAVE' });
    await saveBtn.click();
    await this.page.locator(SELECTORS.modalShow)
      .waitFor({ state: 'hidden', timeout: 30_000 });

    return { selectedDate, newDate };
  }

  /**
   * Verifies the success toast after moving a due date.
   */
  async verifyMoveDueDateSuccess(): Promise<void> {
    const toast = this.page.locator(SELECTORS.toastBody);
    await expect(toast).toContainText('Successfully moved the due dates', { timeout: 10_000 });
  }
}

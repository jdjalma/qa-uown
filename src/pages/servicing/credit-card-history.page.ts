import { type Locator } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Credit Card History Page — Servicing portal
 *
 * URL: /credit-card-history/{accountPk}
 *
 * Covers:
 *  - CC transaction table (FilterTable with conditional row styles)
 *  - Edit Pending CC Payment modal (edit amount/date/comment, cancel)
 */
export class CreditCardHistoryPage extends ServicingBasePage {

  // ── Navigation ──────────────────────────────────────────────────────

  /** Navigate to CC History via top menu (History → CC Transactions) */
  async navigateToCcHistory(): Promise<void> {
    await this.topMenuNavigateTo('cc transactions');
    await this.waitForCcTable();
  }

  /** Navigate to CC History page by direct URL */
  async navigateToCcHistoryByUrl(baseUrl: string, accountPk: string | number): Promise<void> {
    // Direct URL navigation — the SPA route /credit-card-history/[account] loads CC transactions
    await this.page.goto(`${baseUrl}/credit-card-history/${accountPk}`, { waitUntil: 'domcontentloaded' });
    await this.waitForSpinner();

    // Verify we landed on the CC History page (not redirected to customer-information)
    const ccTitle = this.page.locator('text=Credit Card Transactions').first();
    if (!await ccTitle.isVisible({ timeout: 8_000 }).catch(() => false)) {
      // Fallback: go to customer-information then use History menu
      await this.page.goto(`${baseUrl}/customer-information/${accountPk}`, { waitUntil: 'domcontentloaded' });
      await this.waitForSpinner();
      await this.topMenuNavigateTo('cc transactions');
      await this.waitForSpinner();
    }

    await this.waitForCcTable();
    // Expand to show all rows (default is 10 per page)
    await this.selectMaxRowsPerPage().catch(() => {});
  }

  // ── Table ───────────────────────────────────────────────────────────

  private async waitForCcTable(): Promise<void> {
    // Wait for the data-loading spinner to disappear (CC history fetches data via API)
    await this.waitForSpinner();
    // The FilterTable component shows "There are no records to display" during load,
    // then replaces with the actual table once API data arrives.
    // Wait for the rdt_Table (react-data-table) to appear with rows.
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => {
        // If no rows after 30s, the table is genuinely empty
      });
  }

  /** Get all table rows */
  private getRows(): Locator {
    return this.page.locator(SELECTORS.tableRow);
  }

  /** Get number of rows in the CC transaction table */
  async getRowCount(): Promise<number> {
    return this.getRows().count();
  }

  /**
   * Find a table row by CC Transaction PK (shown in "Confirmation #" and "Transaction ID" columns).
   * Returns the first row whose text contains the PK string.
   */
  getRowByTxPk(txPk: string | number): Locator {
    return this.getRows().filter({ hasText: String(txPk) }).first();
  }

  /** Get the status text displayed in a row for a given CC TX PK */
  async getRowStatus(txPk: string | number): Promise<string> {
    const row = this.getRowByTxPk(txPk);
    const cells = row.locator(SELECTORS.tableCell);
    // Status column is the 9th column (0-indexed: 8) in creditCardHistoryTableColumns
    const statusCell = cells.nth(8);
    return (await statusCell.textContent())?.trim() || '';
  }

  /**
   * Get text content of a specific cell in a row by column index.
   * Column indices (0-based): 0=Created Date, 1=Posting Date, 2=Captured Amount,
   * 3=Original Requested Amount, 4=First Name, 5=Last Name, 6=Confirmation #,
   * 7=CC Number, 8=Status, ... last=Edit
   */
  async getRowCellText(txPk: string | number, columnIndex: number): Promise<string> {
    const row = this.getRowByTxPk(txPk);
    const cells = row.locator(SELECTORS.tableCell);
    const cell = cells.nth(columnIndex);
    return (await cell.textContent())?.trim() || '';
  }

  /** Get the "Comments" column text for a row (column varies — search by row text) */
  async getRowComments(txPk: string | number): Promise<string> {
    const row = this.getRowByTxPk(txPk);
    // Comments is a wide column near the end — get all cell texts and find it
    const allText = await row.textContent() || '';
    return allText;
  }

  /** Check if the edit (pencil) icon is visible for a given row */
  async isEditIconVisible(txPk: string | number): Promise<boolean> {
    const row = this.getRowByTxPk(txPk);
    const pencil = row.locator(SELECTORS.ccEditPencilIcon);
    return pencil.isVisible({ timeout: 3_000 }).catch(() => false);
  }

  /** Check if a row has strikethrough text decoration (CANCELLED style) */
  async isRowStrikethrough(txPk: string | number): Promise<boolean> {
    const row = this.getRowByTxPk(txPk);
    const decoration = await row.evaluate(el => getComputedStyle(el).textDecoration);
    return decoration.includes('line-through');
  }

  /** Get the computed text color of a row (for status visual validation) */
  async getRowColor(txPk: string | number): Promise<string> {
    const row = this.getRowByTxPk(txPk);
    return row.evaluate(el => getComputedStyle(el).color);
  }

  /** Get the text content of the "Captured Amount" column for a row */
  async getRowAmount(txPk: string | number): Promise<string> {
    const row = this.getRowByTxPk(txPk);
    const cells = row.locator(SELECTORS.tableCell);
    // Captured Amount is 3rd column (0-indexed: 2)
    return (await cells.nth(2).textContent())?.trim() || '';
  }

  /** Get the "Pending Payment?" column value for a row */
  async getRowPendingPayment(txPk: string | number): Promise<string> {
    const row = this.getRowByTxPk(txPk);
    const cells = row.locator(SELECTORS.tableCell);
    // "Pending Payment?" is second to last column — find by text content instead
    const allText = await row.textContent() || '';
    return allText.includes('Yes') ? 'Yes' : 'No';
  }

  // ── Edit Modal ──────────────────────────────────────────────────────

  /** Click the edit (pencil) icon for a specific CC transaction row */
  async openEditModal(txPk: string | number): Promise<void> {
    // Expand rows per page to ensure the TX is visible (default is 10, may have 30+ rows)
    await this.selectMaxRowsPerPage().catch(() => {});

    const row = this.getRowByTxPk(txPk);
    const rowCount = await row.count();
    if (rowCount === 0) {
      throw new Error(`Row with txPk=${txPk} not found in CC History table`);
    }
    await row.scrollIntoViewIfNeeded().catch(() => {});

    // Try multiple strategies to find the pencil/edit icon
    const pencil = row.locator(SELECTORS.ccEditPencilIcon);
    if (await pencil.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await pencil.click();
    } else {
      // Fallback: find any clickable SVG or cursor-pointer element in the row
      const fallback = row.locator('.cursor-pointer, svg').first();
      if (await fallback.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fallback.click();
      } else {
        // Last resort: click the last cell (Edit column) in the row
        const cells = row.locator(SELECTORS.tableCell);
        const cellCount = await cells.count();
        const lastCell = cells.nth(cellCount - 1);
        const clickable = lastCell.locator('svg, .cursor-pointer, [role="button"]').first();
        await clickable.click({ timeout: 10_000 });
      }
    }

    // Wait for the edit CC form to be visible
    await this.page.locator('#editPendingCCForm').first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  /** Get the modal title text */
  async getEditModalTitle(): Promise<string> {
    // Try multiple strategies — common-ui Modal may render title differently
    for (const selector of ['.modal-title', SELECTORS.modalHeader, '.modal h5', '.modal h4']) {
      const el = this.page.locator(selector).first();
      if (await el.isVisible({ timeout: 2_000 }).catch(() => false)) {
        return (await el.textContent())?.trim() || '';
      }
    }
    // Fallback: get text from the modal content before the form
    const modal = this.page.locator(SELECTORS.modalContent).last();
    const text = (await modal.textContent())?.trim() || '';
    // Extract first line (title) before "Reference #"
    const match = text.match(/^(.+?)Reference/);
    return match ? match[1].trim() : text.slice(0, 50);
  }

  /** Get the Reference # value from the modal (readonly) */
  async getModalReferenceNumber(): Promise<string> {
    // InputField with label "Reference #" — readonly, rendered as value text
    const refField = this.page.locator(SELECTORS.modalBody)
      .locator('label:has-text("Reference") ~ div, label:has-text("Reference") + div')
      .first();
    // Try input first (some InputField variants use input[readOnly])
    const input = this.page.locator(SELECTORS.modalBody).locator('input[readonly]').first();
    if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return (await input.inputValue()) || '';
    }
    return (await refField.textContent())?.trim() || '';
  }

  // ── Modal form fields ────────────────────────────────────────────
  // InputField from @uownleasing/common-ui renders as label + input inside a wrapper div.
  // The formik `name` is applied to the input element. Use multiple selector strategies.

  private modalForm() {
    return this.page.locator('#editPendingCCForm, .modal-body form').first();
  }

  private modalInput(name: string): Locator {
    const form = this.modalForm();
    // Try by name attribute first, fallback to label-based
    return form.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  }

  private async modalInputByLabel(label: string): Promise<Locator> {
    const form = this.modalForm();
    // InputField renders: <label>Posting Date</label> followed by <input> in a sibling/child div
    const labelEl = form.getByText(label, { exact: true }).first();
    // The input is usually the next sibling's child or a sibling input
    const parent = labelEl.locator('..'); // parent container
    const input = parent.locator('input, textarea').first();
    if (await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return input;
    }
    // Fallback: find by label text association
    return form.getByLabel(label).first();
  }

  /**
   * Fill the Posting Date field in the edit modal.
   * Accepts ISO (YYYY-MM-DD) format — converts to MM/DD/YYYY for the HTML date input.
   * HTML date inputs in Chromium need triple-click to select all, then type the new value.
   */
  async fillPostingDate(isoDate: string): Promise<void> {
    let input = this.modalInput('postingDate');
    if (!await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      input = await this.modalInputByLabel('Posting Date');
    }
    // Chromium date input: select all via triple-click then type MMDDYYYY (no separators)
    // Playwright's fill() sets the value attribute but may not trigger React onChange.
    // Convert ISO YYYY-MM-DD to MMDDYYYY for keyboard entry.
    const [yyyy, mm, dd] = isoDate.split('-');
    const mmddyyyy = `${mm}${dd}${yyyy}`;
    await input.click({ clickCount: 3 });
    await input.pressSequentially(mmddyyyy, { delay: 50 });
    await input.press('Tab');
  }

  /** Fill the Amount field in the edit modal */
  async fillAmount(amount: string): Promise<void> {
    let input = this.modalInput('amount');
    if (!await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      input = await this.modalInputByLabel('Amount');
    }
    await input.fill('');
    await input.fill(amount);
  }

  /** Fill the Comment field in the edit modal */
  async fillComment(comment: string): Promise<void> {
    let input = this.modalInput('comment');
    if (!await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
      input = await this.modalInputByLabel('Comment');
    }
    await input.fill(comment);
  }

  /** Get the current value of Posting Date in the modal */
  async getModalPostingDate(): Promise<string> {
    let input = this.modalInput('postingDate');
    if (!await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
      input = await this.modalInputByLabel('Posting Date');
    }
    return input.inputValue();
  }

  /** Get the current value of Amount in the modal */
  async getModalAmount(): Promise<string> {
    let input = this.modalInput('amount');
    if (!await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
      input = await this.modalInputByLabel('Amount');
    }
    return input.inputValue();
  }

  /** Get the current value of Comment in the modal */
  async getModalComment(): Promise<string> {
    let input = this.modalInput('comment');
    if (!await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
      input = await this.modalInputByLabel('Comment');
    }
    return input.inputValue();
  }

  /** Click the SAVE button in the edit modal and wait for the request to complete */
  async clickSave(): Promise<void> {
    // Buttons may be in .modal-footer or directly inside the modal content
    const modal = this.page.locator(SELECTORS.modalContent).last();
    const saveBtn = modal.getByRole('button', { name: 'SAVE' });
    await saveBtn.click();
    await this.waitForSpinner();
  }

  /** Click the REMOVE button (cancels the CC transaction) in the edit modal and wait */
  async clickCancelTransaction(): Promise<void> {
    const modal = this.page.locator(SELECTORS.modalContent).last();
    const removeBtn = modal.getByRole('button', { name: 'REMOVE' });
    await removeBtn.click();
    await this.waitForSpinner();
  }

  /** Check if modal is currently open */
  async isEditModalOpen(): Promise<boolean> {
    return this.page.locator(SELECTORS.modalContent).isVisible({ timeout: 2_000 }).catch(() => false);
  }

  /** Get Formik validation error text if visible */
  async getValidationError(): Promise<string> {
    const error = this.page.locator(`${SELECTORS.modalBody} .text-danger, ${SELECTORS.modalBody} [class*="error"], ${SELECTORS.modalBody} .invalid-feedback`).first();
    if (await error.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return (await error.textContent())?.trim() || '';
    }
    return '';
  }
}

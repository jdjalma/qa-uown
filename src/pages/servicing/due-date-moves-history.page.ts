import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Due Date Moves History page — Servicing > History > Due Date Changes.
 * Displays a paginated table of payment due date adjustments for an account.
 *
 * API: GET /uown/svc/accounts/{accountPk}/due-date-moves?page=0&size=10
 * Permission: due_date_moves_history [access]
 */
export class DueDateMovesHistoryPage extends ServicingBasePage {
  readonly dataTable = this.page.locator(SELECTORS.table);
  readonly columnHeaders = this.page.locator(SELECTORS.tableHeader);
  readonly dataRows = this.page.locator(SELECTORS.tableRow);
  readonly dataCells = this.page.locator(SELECTORS.tableCell);
  readonly paginationNext = this.page.locator(SELECTORS.paginationNext);
  readonly rowsPerPageDropdown = this.page.locator(SELECTORS.rowsPerPageDropdown);
  readonly noDataMessage = this.page.locator('div.rdt_Table div:has-text("No data available"), div:has-text("There are no records to display")');

  /** Expected column headers in display order */
  static readonly EXPECTED_COLUMNS = [
    'Date',
    'Agent',
    'Previous Due Date',
    'Days Moved',
    'FPD Change',
    'Adjustment Type',
  ] as const;

  async navigateToDueDateChanges(): Promise<void> {
    await this.topMenuNavigateTo('due date changes');
    await this.page.waitForURL(/due-date-moves-history/, { timeout: 10_000 });
  }

  async waitForTableLoad(): Promise<void> {
    await this.waitForSpinner();
    // Wait for either data rows or no-data message
    await this.page.waitForFunction(
      () => {
        const rows = document.querySelectorAll('.rdt_TableRow');
        const noData = document.querySelector('.rdt_Table')?.textContent?.includes('no records');
        return rows.length > 0 || noData;
      },
      { timeout: 15_000 },
    ).catch(() => {});
  }

  async getColumnHeaders(): Promise<string[]> {
    await this.columnHeaders.first().waitFor({ state: 'visible', timeout: 10_000 });
    return this.columnHeaders.allTextContents();
  }

  async getRowCount(): Promise<number> {
    return this.dataRows.count();
  }

  /**
   * Returns all data from row at given index (0-based) as a Record<header, value>.
   */
  async getRowData(rowIndex: number): Promise<Record<string, string>> {
    const headers = await this.getColumnHeaders();
    const row = this.dataRows.nth(rowIndex);
    const cells = row.locator(SELECTORS.tableCell);
    const cellTexts = await cells.allTextContents();

    const data: Record<string, string> = {};
    headers.forEach((h, i) => {
      // Strip sort indicators (▲, ▼) so keys match EXPECTED_COLUMNS labels
      const key = h.trim().replace(/\s*[▲▼]+$/, '');
      data[key] = cellTexts[i]?.trim() ?? '';
    });
    return data;
  }

  /**
   * Returns normalized column headers (trimmed, no sort arrows).
   * Assertions should be performed in the test using EXPECTED_COLUMNS.
   */
  async verifyColumnHeaders(): Promise<string[]> {
    return (await this.getColumnHeaders()).map(h => h.trim());
  }

  /**
   * Returns first row data. Format assertions should be performed in the test.
   * Convenience wrapper around getRowData(0).
   */
  async verifyFirstRowFormats(): Promise<Record<string, string>> {
    return this.getRowData(0);
  }

  /**
   * Get the total number of rows shown in pagination info.
   * React Data Table shows "1-10 of 25" — extract the total.
   */
  async getPaginationTotal(): Promise<number | null> {
    const paginationText = await this.page.locator('.rdt_Pagination').textContent();
    if (!paginationText) return null;
    const match = paginationText.match(/of\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Change rows per page to a specific value.
   */
  async changeRowsPerPage(value: string): Promise<void> {
    const prevCount = await this.dataRows.count();
    await this.rowsPerPageDropdown.selectOption(value);
    await this.waitForSpinner();
    // Wait for row count to change (React Data Table re-renders after option change)
    await this.page.waitForFunction(
      ([selector, prev]) => document.querySelectorAll(selector).length !== prev,
      ['.rdt_TableRow', prevCount] as [string, number],
      { timeout: 10_000 },
    ).catch(() => {}); // ignore timeout — assertion in test will fail if count unchanged
  }

  /**
   * Check if the "Due Date Changes" option is visible in the History menu.
   */
  async isDueDateChangesMenuVisible(): Promise<boolean> {
    const historyBtn = this.page.getByRole('button', { name: /History/i }).first();
    if (await historyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await historyBtn.click();
    } else {
      await this.historyDropdown.click();
    }

    const menuItem = this.page.getByRole('menuitem', { name: 'Due Date Changes' });
    const isVisible = await menuItem.isVisible({ timeout: 3_000 }).catch(() => false);

    // Close menu by pressing Escape
    await this.page.keyboard.press('Escape');
    return isVisible;
  }
}

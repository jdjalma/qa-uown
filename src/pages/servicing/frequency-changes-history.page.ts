import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Frequency Changes History page — Servicing > History > Frequency Changes.
 * Displays a paginated table of payment frequency changes for an account.
 *
 * API: GET /uown/svc/accounts/{accountPk}/frequency-changes
 * Permission: frequency_history [view]
 */
export class FrequencyChangesHistoryPage extends ServicingBasePage {
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
    'User',
    'From',
    'To',
    'Old Payment',
    'New Payment',
    'First Due Date',
    'Second Due Date',
  ] as const;

  /** Valid frequency values that may appear in From/To columns */
  static readonly VALID_FREQUENCIES = [
    'WEEKLY',
    'BI_WEEKLY',
    'MONTHLY',
    'SEMI_MONTHLY',
  ] as const;

  async navigateToFrequencyChanges(): Promise<void> {
    await this.topMenuNavigateTo('frequency changes');
    // Wait for Next.js SPA navigation to complete (router.push is async)
    await this.page.waitForURL('**/frequency-history/**', { timeout: 15_000 }).catch(() => {
      console.log('[FrequencyChanges] URL did not change to frequency-history after menu click');
    });
  }

  async waitForTableLoad(): Promise<void> {
    await this.waitForSpinner();
    // react-data-table-component v7 renders <div role="table">, not native <table>
    await this.page.locator('.rdt_Table, [role="table"]').first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(() => {});
  }

  async getColumnHeaders(): Promise<string[]> {
    // Use 'attached' state: column headers may be in DOM but scrolled / not yet fully visible
    await this.columnHeaders.first().waitFor({ state: 'attached', timeout: 15_000 });
    return this.columnHeaders.allTextContents();
  }

  async getRowCount(): Promise<number> {
    return this.dataRows.count();
  }

  /**
   * Returns all data from row at given index (0-based) as a Record<header, value>.
   * Column headers may include sort arrows (▲/▼) — these are stripped from keys.
   */
  async getRowData(rowIndex: number): Promise<Record<string, string>> {
    const headers = await this.getColumnHeaders();
    const row = this.dataRows.nth(rowIndex);
    const cells = row.locator(SELECTORS.tableCell);
    const cellTexts = await cells.allTextContents();

    const data: Record<string, string> = {};
    headers.forEach((h, i) => {
      // Strip sort arrows (▲▼) from header keys
      const key = h.trim().replace(/[▲▼]/g, '').trim();
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
    await this.rowsPerPageDropdown.selectOption(value);
    await this.waitForSpinner();
  }

  /**
   * Navigate to the next page.
   * Returns true if navigation succeeded (button was enabled and clicked),
   * false if already on the last page.
   */
  async goToNextPage(): Promise<boolean> {
    const isDisabled = await this.paginationNext.isDisabled({ timeout: 3_000 }).catch(() => true);
    if (isDisabled) return false;
    await this.paginationNext.click();
    await this.waitForSpinner();
    return true;
  }

  /**
   * Check if the "Frequency Changes" option is visible in the History menu.
   */
  async isFrequencyChangesMenuVisible(): Promise<boolean> {
    const historyBtn = this.page.getByRole('button', { name: /History/i }).first();
    if (await historyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await historyBtn.click();
    } else {
      await this.historyDropdown.click();
    }

    const menuItem = this.page.getByRole('menuitem', { name: 'Frequency Changes' });
    const isVisible = await menuItem.isVisible({ timeout: 3_000 }).catch(() => false);

    // Close menu by pressing Escape
    await this.page.keyboard.press('Escape');
    return isVisible;
  }
}

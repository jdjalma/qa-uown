import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { LoginPage } from '../login.page.js';
import { ConfigEnvironment } from '../../config/environment.js';

/**
 * Payment Arrangement display page — Servicing > Servicing > Payment Arrangement.
 * Displays a paginated table of payment arrangements for an account,
 * with expandable rows showing CC or ACH payment sub-tables.
 *
 * Route: /payment-arrangement/{accountPk}
 * API: GET /uown/svc/accounts/{accountPk}/payment-arrangements
 * API: GET /uown/svc/payment-arrangements/{pk}/payments
 * Permission: payment_arrangement [access]
 *
 * Task #500: Display Payment Arrangements In Servicing Portal
 */
export class PaymentArrangementPage extends ServicingBasePage {
  readonly dataTable = this.page.locator('.rdt_Table, [role="table"]');
  readonly columnHeaders = this.page.locator(SELECTORS.tableHeader);
  readonly dataRows = this.page.locator(SELECTORS.tableRow);
  readonly dataCells = this.page.locator(SELECTORS.tableCell);
  readonly paginationNext = this.page.locator(SELECTORS.paginationNext);
  readonly noDataMessage = this.page.locator(
    'div.rdt_Table div:has-text("No data available"), div:has-text("There are no records to display")',
  );

  /** Expected column headers in the main arrangements table. */
  static readonly EXPECTED_COLUMNS = [
    'Arrangement PK',
    'Payment Type',
    'Start Date',
    'End Date',
    'Total Amount',
    'Status',
    'Created At',
    'Created By',
  ] as const;

  /** Expected CC sub-table column headers. */
  static readonly CC_COLUMNS = [
    'Payment PK',
    'Date',
    'Amount',
    'Fee',
    'Status',
    'Vendor',
    'Card',
  ] as const;

  /** Expected ACH sub-table column headers. */
  static readonly ACH_COLUMNS = [
    'Payment PK',
    'Date',
    'Amount',
    'Status',
    'Account Number',
    'Type',
    'Error',
  ] as const;

  // ── Navigation ───────────────────────────────────────────────────────

  async navigateToPaymentArrangement(accountPk?: string | number): Promise<void> {
    // Try menu navigation first
    await this.topMenuNavigateTo('payment arrangement');
    await this.page.waitForURL('**/payment-arrangement/**', { timeout: 15_000 }).catch(() => {
      // Fallback: direct URL navigation
      if (accountPk) {
        console.log('[PaymentArrangement] Menu navigation did not change URL — using direct URL');
      }
    });
    // If URL didn't change and we have accountPk, navigate directly
    if (accountPk && !this.page.url().includes('payment-arrangement')) {
      await this.page.goto(`${this.page.url().split('/customer-information')[0]}/payment-arrangement/${accountPk}`);
    }
    await this.waitForTableLoad();
  }

  async navigateDirectly(baseUrl: string, accountPk: string | number): Promise<void> {
    const base = baseUrl.replace(/\/$/, '');
    await this.page.goto(`${base}/payment-arrangement/${accountPk}`, { waitUntil: 'load', timeout: 120_000 });

    // Session recovery (stg tokens expire after ~9min of API-heavy tests)
    const loginPage = new LoginPage(this.page);
    if (await loginPage.isLoginPage()) {
      const envName = process.env.ENV || 'sandbox';
      console.log(`[PA.navigateDirectly] Session expired in ${envName} — re-authenticating`);
      const env = new ConfigEnvironment(envName);
      const creds = env.getCredentials('manager');

      // Navigate to base servicing URL first (mimic auth.setup flow).
      // If we login at /payment-arrangement/{pk}, the SPA redirects back to that route
      // after login — which fails without account context → back to login (loop).
      await this.page.goto(base, { waitUntil: 'load', timeout: 60_000 });
      await loginPage.login(creds.username, creds.password);
      await this.page.waitForLoadState('networkidle');

      // Verify login succeeded
      if (await loginPage.isLoginPage()) {
        const errMsg = await this.page.locator('.alert, .error, [role="alert"]').first()
          .textContent({ timeout: 2_000 }).catch(() => 'no error visible');
        console.log(`[PA.navigateDirectly] Login failed — error: ${errMsg}. Retrying...`);
        await loginPage.login(creds.username, creds.password);
        await this.page.waitForLoadState('networkidle');
      }

      // Establish account context by visiting customer-information first
      await this.page.goto(`${base}/customer-information/${accountPk}`, { waitUntil: 'load', timeout: 120_000 });
      await this.waitForSpinner();
      console.log(`[PA.navigateDirectly] Account context established — navigating to PA via menu`);

      // Use SPA-internal menu navigation (avoids full page reload which may lose auth)
      await this.navigateToPaymentArrangement(accountPk);
      return; // navigateToPaymentArrangement already calls waitForTableLoad
    }

    await this.waitForTableLoad();
  }

  // ── Table Loading ────────────────────────────────────────────────────

  async waitForTableLoad(): Promise<void> {
    await this.waitForSpinner();
    // Wait for the table container to be visible (stg API can be very slow)
    await this.page.locator('.rdt_Table, [role="table"]').first()
      .waitFor({ state: 'visible', timeout: 120_000 })
      .catch(() => {});
    // Wait for at least one data row or "no data" message
    await this.page.locator('.rdt_TableRow, .rdt_Table div:has-text("No data")').first()
      .waitFor({ state: 'visible', timeout: 120_000 })
      .catch(() => {});
  }

  // ── Main Table Reading ───────────────────────────────────────────────

  async getColumnHeaders(): Promise<string[]> {
    await this.columnHeaders.first().waitFor({ state: 'attached', timeout: 15_000 });
    return this.columnHeaders.allTextContents();
  }

  /**
   * Returns normalized column headers (trimmed, no sort arrows ▲▼).
   */
  async getNormalizedHeaders(): Promise<string[]> {
    return (await this.getColumnHeaders()).map(h => h.trim().replace(/[▲▼△▽↑↓]/g, '').trim());
  }

  async getRowCount(): Promise<number> {
    return this.dataRows.count();
  }

  /**
   * Returns data from row at given index as Record<header, value>.
   * Strips sort arrows from header keys.
   * Skips empty-named columns (e.g., the expand toggle column).
   */
  async getRowData(rowIndex: number): Promise<Record<string, string>> {
    const headers = await this.getColumnHeaders();
    const row = this.dataRows.nth(rowIndex);
    const cells = row.locator(SELECTORS.tableCell);
    const cellTexts = await cells.allTextContents();

    const data: Record<string, string> = {};
    let cellOffset = 0;
    headers.forEach((h) => {
      const key = h.trim().replace(/[▲▼△▽↑↓]/g, '').trim();
      const val = cellTexts[cellOffset]?.trim() ?? '';
      cellOffset++;
      // Skip unnamed columns (expand button, selection checkbox, etc.)
      if (!key) return;
      data[key] = val;
    });
    return data;
  }

  /**
   * Find a row by arrangement PK value.
   * Returns the row index (0-based) or -1 if not found.
   * Looks for column named "Arrangement Pk" or "Arrangement PK" (case-insensitive key match).
   */
  async findRowByPk(pk: string | number): Promise<number> {
    const count = await this.getRowCount();
    for (let i = 0; i < count; i++) {
      const data = await this.getRowData(i);
      // Case-insensitive key lookup for "Arrangement Pk/PK"
      const pkKey = Object.keys(data).find(k => k.toLowerCase().includes('arrangement') && k.toLowerCase().includes('pk'));
      if (pkKey && data[pkKey] === String(pk)) return i;
    }
    return -1;
  }

  // ── Expandable Rows ──────────────────────────────────────────────────

  /**
   * Expand a row by clicking on it. The expandable row content renders below.
   * react-data-table-component uses a toggle button or clickable row.
   * Waits for the expanded content to load (spinner disappears + sub-table visible).
   */
  async expandRow(rowIndex: number): Promise<void> {
    const row = this.dataRows.nth(rowIndex);
    // react-data-table-component: expandable rows use a button with aria-label or the row itself
    const expandBtn = row.locator('button[aria-label*="Expand"], button[data-testid*="expand"]');
    if (await expandBtn.count() > 0) {
      await expandBtn.first().click();
    } else {
      // Fallback: click the row itself (some rdt configs use onRowClicked)
      await row.click();
    }
    // Wait for expanded content to appear
    await this.page.locator('.rdt_ExpanderRow, [data-testid="expander-row"]').first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {
        console.log('[PaymentArrangement] Expanded content not detected via standard selector');
      });
    // Wait for loading spinner inside expanded row to disappear
    await this.waitForSpinner();
    // Wait for sub-table to render inside expanded content (stg CC gateway can take ~3min)
    const expandedContent = this.getExpandedContent();
    await expandedContent.locator('.rdt_Table, [role="table"], h4, h3').first()
      .waitFor({ state: 'visible', timeout: 300_000 })
      .catch(() => {
        console.log('[PaymentArrangement] Sub-table not detected in expanded content');
      });
  }

  /**
   * Collapse an expanded row by clicking it again.
   */
  async collapseRow(rowIndex: number): Promise<void> {
    const row = this.dataRows.nth(rowIndex);
    const expandBtn = row.locator('button[aria-label*="Expand"], button[data-testid*="expand"]');
    if (await expandBtn.count() > 0) {
      await expandBtn.first().click();
    } else {
      await row.click();
    }
  }

  // ── Sub-Table Reading (expanded content) ─────────────────────────────

  /**
   * Get the expanded row content container.
   * Returns the first visible expander row (there should be only one expanded at a time).
   */
  private getExpandedContent() {
    return this.page.locator('.rdt_ExpanderRow, [data-testid="expander-row"]').first();
  }

  /**
   * Get all sub-tables within the expanded content.
   * The expandable component renders separate FilterTable for CC and ACH.
   */
  private getSubTables() {
    return this.getExpandedContent().locator('.rdt_Table, [role="table"]');
  }

  /**
   * Read data from a sub-table within the expanded row.
   * @param tableIndex 0 for first sub-table, 1 for second (if two sections: ACH + CC)
   */
  async getSubTableData(tableIndex = 0): Promise<Array<Record<string, string>>> {
    const subTables = this.getSubTables();
    const count = await subTables.count();
    if (tableIndex >= count) return [];

    const table = subTables.nth(tableIndex);
    // Use .rdt_TableCol for headers — [role="columnheader"] can match duplicates
    const rawHeaders = await table.locator('.rdt_TableCol').allTextContents();
    // The FilterTable component may duplicate headers (label + sort); deduplicate by taking every other
    const cellCount = await table.locator('.rdt_TableRow').first().locator('.rdt_TableCell').count();
    let headers: string[];
    if (rawHeaders.length > cellCount && rawHeaders.length === cellCount * 2) {
      // Deduplicate: take every other header (even indexes = actual labels)
      headers = rawHeaders.filter((_, i) => i % 2 === 0);
    } else {
      headers = rawHeaders;
    }

    const rows = table.locator('.rdt_TableRow');
    const rowCount = await rows.count();

    const result: Array<Record<string, string>> = [];
    for (let r = 0; r < rowCount; r++) {
      const cells = await rows.nth(r).locator('.rdt_TableCell').allTextContents();
      const rowData: Record<string, string> = {};
      headers.forEach((h, i) => {
        const key = h.trim().replace(/[▲▼△▽↑↓]/g, '').trim();
        rowData[key] = cells[i]?.trim() ?? '';
      });
      result.push(rowData);
    }
    return result;
  }

  /**
   * Get the section heading text within expanded content (e.g., "ACH Payments", "CC Payments").
   */
  async getExpandedSectionHeaders(): Promise<string[]> {
    const headers = this.getExpandedContent().locator('h4, h3, h5');
    return headers.allTextContents();
  }

  /**
   * Get CC payments sub-table data.
   * The CC section is rendered when the arrangement has CC payments.
   * If both ACH and CC are present, the order depends on the component.
   */
  async getCcPaymentsData(): Promise<Array<Record<string, string>>> {
    const sectionHeaders = await this.getExpandedSectionHeaders();
    const subTables = this.getSubTables();
    const subTableCount = await subTables.count();

    // Try to find CC sub-table by section header
    for (let i = 0; i < sectionHeaders.length; i++) {
      if (sectionHeaders[i].toLowerCase().includes('cc')) {
        return this.getSubTableData(i);
      }
    }
    // Fallback: if only one sub-table, assume it's the correct one
    if (subTableCount === 1) return this.getSubTableData(0);
    return [];
  }

  /**
   * Get ACH payments sub-table data.
   */
  async getAchPaymentsData(): Promise<Array<Record<string, string>>> {
    const sectionHeaders = await this.getExpandedSectionHeaders();

    for (let i = 0; i < sectionHeaders.length; i++) {
      if (sectionHeaders[i].toLowerCase().includes('ach')) {
        return this.getSubTableData(i);
      }
    }
    return [];
  }

  /**
   * Get the number of sub-tables visible in the expanded content.
   */
  async getSubTableCount(): Promise<number> {
    return this.getSubTables().count();
  }

  // ── Debug Helpers ─────────────────────────────────────────────────────

  /**
   * Debug helper: returns raw headers and cell counts from the first sub-table.
   * Use to diagnose column alignment issues.
   */
  async debugSubTableHeaders(): Promise<{ headers: string[]; firstRowCells: string[] }> {
    const subTables = this.getSubTables();
    const count = await subTables.count();
    if (count === 0) return { headers: [], firstRowCells: [] };

    const table = subTables.first();
    const headers = await table.locator('.rdt_TableHeadRow .rdt_TableCol, [role="columnheader"]')
      .allTextContents();
    const firstRow = table.locator('.rdt_TableRow').first();
    const cells = await firstRow.locator('.rdt_TableCell, [role="cell"]').allTextContents();
    return { headers, firstRowCells: cells };
  }

  // ── Pagination ───────────────────────────────────────────────────────

  async getPaginationTotal(): Promise<number | null> {
    const paginationText = await this.page.locator('.rdt_Pagination').textContent();
    if (!paginationText) return null;
    const match = paginationText.match(/of\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }
}

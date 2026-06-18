import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { getTableHeaders, getColumnIndexByHeaderText } from '../../helpers/table.helpers.js';
import { FilteredCsvDownloadControls } from './filtered-csv-download.controls.js';
import { type Download } from '@playwright/test';

/**
 * Page object for the Origination portal Leads table (Search Result page).
 *
 * Filter panel fields (discovered from qa1 UI):
 *   From (required), To, SSN, Email, Lead PK, Account PK,
 *   Phone Number, Customer Name, State (combobox), Lead Status (combobox),
 *   Merchant (single-select), Location (single-select)
 *
 * Columns: Lead # | Account # | Lead Status | Internal Status | State |
 *          Term Month | Invoice Number | Customer Name | SSN | Phone Number | Email Address |
 *          Merchant | Location | Ref Merchant Code | Client Type | Created at | Created from
 *
 * NOTE: No Funded Amount column, no Signed Lease column.
 */
export class LeadsPage extends OriginationBasePage {

  /** Shared CSV export controls (task #1321). Leads tooltipIdPrefix = `leads-csv-download`. */
  readonly csv = new FilteredCsvDownloadControls(this.page, 'leads-csv-download');

  // ── Navigation ───────────────────────────────────────────────────────

  /**
   * Navigates to the Leads page and waits for the Search Result table to load.
   *
   * @param originationUrl - Optional base URL. When provided, uses a direct
   *                         `page.goto(`${originationUrl}leads`)` (the same
   *                         pattern OTB / Rebate / Merchant list use). This is
   *                         the REQUIRED path when the test starts from a
   *                         blank page after auth state load — the sidebar is
   *                         not mounted yet so `sideMenuNavigateTo('Leads')`
   *                         times out at 15s on the `getByText('Leads')`
   *                         fallback (root cause of run #2 F-002 recidiva).
   *                         Omit only when navigating from another
   *                         already-loaded Origination page where the sidebar
   *                         is guaranteed to be visible.
   */
  async navigateAndWaitForTable(originationUrl?: string): Promise<void> {
    if (originationUrl) {
      await this.page.goto(`${originationUrl}leads`, { waitUntil: 'domcontentloaded' });
    } else {
      await this.navigateToLeads();
    }
    await this.page.locator('text=Search Result').first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await this.waitForSpinner();
  }

  // ── Filters ──────────────────────────────────────────────────────────

  async expandFilters(): Promise<void> {
    await this.waitForSpinner();
    const fromLabel = this.page.locator('text=From').first();
    const isExpanded = await fromLabel.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!isExpanded) {
      const filtersBtn = this.page.locator("button:has-text('Filters')").first();
      if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await filtersBtn.click();
        await fromLabel.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      }
    }
  }

  /** Sets the From date (MM/DD/YYYY). Required field — first date input. */
  async setFromDate(date: string): Promise<void> {
    await this.expandFilters();
    // From is the FIRST input with placeholder MM/DD/YYYY (index 0)
    const inputs = this.page.locator("input[placeholder='MM/DD/YYYY']");
    await inputs.nth(0).fill(date);
  }

  /** Sets the To date (MM/DD/YYYY). Second date input. */
  async setToDate(date: string): Promise<void> {
    await this.expandFilters();
    const inputs = this.page.locator("input[placeholder='MM/DD/YYYY']");
    await inputs.nth(1).fill(date);
  }

  async filterByDateRange(fromDate: string, toDate: string): Promise<void> {
    await this.setFromDate(fromDate);
    await this.setToDate(toDate);
  }

  /** Fills the Invoice Number search field in the filter panel. */
  async setInvoiceNumber(invoiceNumber: string): Promise<void> {
    await this.expandFilters();
    await this.page.getByPlaceholder('Search by Invoice Number').fill(invoiceNumber);
  }

  /** Fills the Lead PK search field. */
  async setLeadPk(leadPk: string): Promise<void> {
    await this.expandFilters();
    await this.page.getByPlaceholder('Search by LeadPk').fill(leadPk);
  }

  /** Fills the Customer Name search field. */
  async setCustomerName(name: string): Promise<void> {
    await this.expandFilters();
    await this.page.getByPlaceholder('Search by Customer Name').fill(name);
  }

  /**
   * Selects a Lead Status from the React Select dropdown.
   * Uses display names: "Approved", "Funded", "Denied", etc.
   * Lead Status is below the fold — scrolls filter panel first.
   */
  async filterByLeadStatus(displayStatus: string): Promise<void> {
    await this.expandFilters();

    // Lead Status is a React Select — find its placeholder/value and click to open
    const placeholder = this.page.locator("div[class*='filter__placeholder']")
      .filter({ hasText: 'Lead Status' }).first();
    await placeholder.scrollIntoViewIfNeeded();
    await placeholder.click();

    // Select the matching option from the dropdown menu
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: displayStatus }).first();
    await option.click({ timeout: 5_000 });

    // Wait for dropdown portal to close after selection
    await this.page.locator('.filter__menu-portal')
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /** Selects a merchant from the Merchant single-select filter. */
  async filterByMerchant(merchantName: string): Promise<void> {
    await this.expandFilters();

    // Click the control (not the placeholder — filter__input-container intercepts clicks on placeholder)
    const control = this.page.locator("label:has-text('Merchant') ~ div")
      .locator(SELECTORS.filterControl).first();
    await control.scrollIntoViewIfNeeded();
    await control.click({ force: true });

    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: merchantName }).first();
    await option.click({ timeout: 5_000 });

    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /** Selects a location from the Location single-select filter (locations must already be loaded). */
  async filterByLocation(locationName: string): Promise<void> {
    await this.expandFilters();

    // Click the control (not the placeholder — filter__input-container intercepts clicks on placeholder)
    const control = this.page.locator("label:has-text('Location') ~ div")
      .locator(SELECTORS.filterControl).first();
    await control.scrollIntoViewIfNeeded();
    await control.click({ force: true });

    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: locationName }).first();
    await option.click({ timeout: 5_000 });

    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /** Clears the Merchant field by clicking its clear indicator (x). */
  async clearMerchantFilter(): Promise<void> {
    const merchantClear = this.page.locator("label:has-text('Merchant') ~ div")
      .locator(SELECTORS.filterClearIndicator).first();
    if (await merchantClear.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await merchantClear.click();
      await this.waitForSpinner();
    }
  }

  /** Returns the currently selected merchant text (empty string if none). */
  async getMerchantValue(): Promise<string> {
    const merchantSingleVal = this.page.locator("label:has-text('Merchant') ~ div")
      .locator(SELECTORS.filterSingleValue).first();
    if (await merchantSingleVal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return (await merchantSingleVal.textContent())?.trim() || '';
    }
    return '';
  }

  /** Returns the currently selected location text (empty string if none). */
  async getLocationValue(): Promise<string> {
    const locationSingleVal = this.page.locator("label:has-text('Location') ~ div")
      .locator(SELECTORS.filterSingleValue).first();
    if (await locationSingleVal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return (await locationSingleVal.textContent())?.trim() || '';
    }
    return '';
  }

  /** Opens the Location dropdown and returns all available option texts. */
  async getLocationOptions(): Promise<string[]> {
    await this.expandFilters();

    // Always click the filter__control — avoids filter__input-container intercept issues
    const locationControl = this.page.locator("label:has-text('Location') ~ div")
      .locator(SELECTORS.filterControl).first();
    await locationControl.scrollIntoViewIfNeeded();
    await locationControl.click({ force: true });

    // Wait for menu to appear
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    const options = await this.page.locator(SELECTORS.filterOption).allTextContents();

    // Close the dropdown via Escape
    await this.page.keyboard.press('Escape');
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    return options.map(text => text.trim()).filter(text => text.length > 0);
  }

  /** Clicks the Search button in the filter panel. */
  async submitFilters(): Promise<void> {
    // Use specific selector for the filter panel Search button (not the nav bar search)
    const searchBtn = this.page.locator("button[name='searchButton'], button[type='submit']:has-text('Search')").first();
    await searchBtn.scrollIntoViewIfNeeded();
    // Wait for any pending React Select state changes before submitting
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await searchBtn.click({ force: true, timeout: 8_000 });
    await this.waitForSpinner();
    // Wait for table rows first (prioritize), fallback to "no records"
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(async () => {
        await this.page.locator('text=There are no records to display')
          .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      });
  }

  // ── Table Data ───────────────────────────────────────────────────────

  /** Returns cleaned table headers (sort indicators stripped). */
  async getCleanHeaders(): Promise<string[]> {
    const raw = await getTableHeaders(this.page);
    return raw.map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim());
  }

  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }

  /** Searches for a row by Lead # value. Returns Record<header, cellValue> or null. */
  async findRowByLeadPk(leadPk: string): Promise<Record<string, string> | null> {
    const headers = await this.getCleanHeaders();
    const leadColIndex = headers.findIndex(h => h === 'Lead #');
    if (leadColIndex === -1) return null;

    const rows = this.page.locator(SELECTORS.tableRow);
    const rowCount = await rows.count();

    for (let r = 0; r < rowCount; r++) {
      const cells = await rows.nth(r).locator(SELECTORS.tableCell).allTextContents();
      if (cells[leadColIndex]?.trim() === leadPk) {
        return this.buildRowData(headers, cells);
      }
    }
    return null;
  }

  /** Returns all visible rows as Record<header, cellValue>[]. */
  async getAllVisibleRows(): Promise<Record<string, string>[]> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return [];

    const headers = await this.getCleanHeaders();
    const rows = this.page.locator(SELECTORS.tableRow);
    const rowCount = await rows.count();
    const result: Record<string, string>[] = [];

    for (let r = 0; r < rowCount; r++) {
      const cells = await rows.nth(r).locator(SELECTORS.tableCell).allTextContents();
      result.push(this.buildRowData(headers, cells));
    }
    return result;
  }

  // ── Column-order assertions (task #1295) ─────────────────────────────

  /** Alias for `getCleanHeaders` — consistent name across OverviewPage/FundingPage. */
  async readHeaderOrder(): Promise<string[]> {
    return this.getCleanHeaders();
  }

  /** Returns the 0-based column index whose header matches `label` (normalized, case-insensitive). */
  async getColumnIndexByHeaderText(label: string): Promise<number> {
    const headers = await this.readHeaderOrder();
    return getColumnIndexByHeaderText(headers, label);
  }

  /** Returns the cell text of all `<td>` in the given 0-based row index. */
  async getRowCells(rowIndex: number): Promise<string[]> {
    const rows = this.page.locator(SELECTORS.tableRow);
    return rows.nth(rowIndex).locator(SELECTORS.tableCell).allTextContents();
  }

  // ── CSV export (task #1321 — delegates to the shared controls) ───────

  isDownloadCsvVisible(): Promise<boolean> { return this.csv.isDownloadCsvVisible(); }
  isDownloadCsvEnabled(): Promise<boolean> { return this.csv.isDownloadCsvEnabled(); }
  isEmailCsvVisible(): Promise<boolean> { return this.csv.isEmailCsvVisible(); }
  isEmailCsvEnabled(): Promise<boolean> { return this.csv.isEmailCsvEnabled(); }
  hoverDownloadCsv(): Promise<void> { return this.csv.hoverDownloadCsv(); }
  getDownloadDisabledTooltip(): Promise<string | null> { return this.csv.getDownloadDisabledTooltip(); }
  downloadCsv(): Promise<Download> { return this.csv.downloadCsv(); }
  openEmailCsvModal(): Promise<void> { return this.csv.openEmailCsvModal(); }
  emailCsvModalTitle(): Promise<string | null> { return this.csv.emailCsvModalTitle(); }
  isEmailCsvSendEnabled(): Promise<boolean> { return this.csv.isEmailCsvSendEnabled(); }
  fillEmailCsvAddress(address: string): Promise<void> { return this.csv.fillEmailCsvAddress(address); }
  cancelEmailCsvModal(): Promise<void> { return this.csv.cancelEmailCsvModal(); }
  getTotalRowCount(): Promise<number | null> { return this.csv.getTotalRowCount(); }

  // ── Private ──────────────────────────────────────────────────────────

  private buildRowData(headers: string[], cells: string[]): Record<string, string> {
    const data: Record<string, string> = {};
    headers.forEach((header, i) => {
      data[header || `#empty-${i + 1}`] = cells[i]?.trim() || '';
    });
    return data;
  }
}

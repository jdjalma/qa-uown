import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

export class ErrorLogPage extends OriginationBasePage {

  async navigateToErrorLog(): Promise<void> {
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/errorLog')) {
      await this.page.goto(currentUrl.replace(/\/[^/]*$/, '/errorLog'));
      await this.waitForPageLoad();
    }
  }

  async isSendApplicationTabActive(): Promise<boolean> {
    const tab = this.page.getByRole('tab', { name: 'Send Application' });
    if (await tab.count() > 0) {
      const ariaSelected = await tab.getAttribute('aria-selected').catch(() => null);
      if (ariaSelected !== null) return ariaSelected === 'true';
      const className = await tab.getAttribute('class').catch(() => '');
      return className?.includes('active') ?? false;
    }
    return false;
  }

  async clickSubmitApplicationTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Submit Application' }).click();
    await this.waitForSpinner();
  }

  async clickSendApplicationTab(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Send Application' }).click();
    await this.waitForSpinner();
  }

  async getVisibleTabNames(): Promise<string[]> {
    // Scope to the tab bar within the error log content area (not header nav)
    const tabs = this.page.locator('.nav-tabs [role="tab"]');
    const count = await tabs.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await tabs.nth(i).textContent())?.trim();
      if (text) names.push(text);
    }
    return names;
  }

  async getTableColumnHeaders(): Promise<string[]> {
    const headerSelector = `${SELECTORS.tableHeader}, th`;
    // Wait for at least one visible column header
    await this.page.locator(headerSelector).first().waitFor({ timeout: 10_000 }).catch(() => {});
    const allHeaders = this.page.locator(headerSelector);
    const count = await allHeaders.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      if (!await allHeaders.nth(i).isVisible()) continue;
      let text = (await allHeaders.nth(i).textContent())?.trim();
      // Strip sort indicators (▲▼△▽↑↓)
      if (text) {
        text = text.replace(/[▲▼△▽↑↓]/g, '').trim();
        names.push(text);
      }
    }
    return names;
  }

  async getTableRowCount(): Promise<number> {
    // Count only visible rows (support both rdt_Table and native table)
    const rowSelectors = `${SELECTORS.tableRow}, tbody tr`;
    const allRows = this.page.locator(rowSelectors);
    const count = await allRows.count();
    let visible = 0;
    for (let i = 0; i < count; i++) {
      if (await allRows.nth(i).isVisible()) visible++;
    }
    return visible;
  }

  async getFirstRowData(): Promise<Record<string, string>> {
    const headers = await this.getTableColumnHeaders();
    // Find the first visible row's cells
    const cellSelectors = `${SELECTORS.tableRow} ${SELECTORS.tableCell}, tbody tr td`;
    const allCells = this.page.locator(cellSelectors);
    const data: Record<string, string> = {};
    let col = 0;
    const totalCells = await allCells.count();
    for (let i = 0; i < totalCells && col < headers.length; i++) {
      if (!await allCells.nth(i).isVisible()) continue;
      data[headers[col]] = (await allCells.nth(i).textContent())?.trim() || '';
      col++;
    }
    return data;
  }

  /** Returns the currently active tab panel (scoped to avoid nav bar elements). */
  private getActiveTabPanel() {
    return this.page.locator('.tab-pane.active');
  }

  async expandFilters(): Promise<void> {
    const panel = this.getActiveTabPanel();
    // Check if filter inputs are already visible within the active tab panel
    const searchInput = panel.locator(SELECTORS.elFilterSearch);
    if (await searchInput.first().isVisible({ timeout: 500 }).catch(() => false)) return;
    // Panel is collapsed — click the Filters toggle button within the active panel
    const filtersBtn = panel.getByRole('button', { name: 'Filters' });
    if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filtersBtn.click();
      // Wait for the filter input to become visible (confirms expand completed)
      await searchInput.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }
  }

  private async fillVisibleInput(selector: string, value: string): Promise<void> {
    await this.expandFilters();
    const panel = this.getActiveTabPanel();
    const input = panel.locator(selector).first();
    await input.fill(value);
  }

  async setFilterFromDate(date: string): Promise<void> {
    await this.fillVisibleInput(SELECTORS.elFilterFromDate, date);
  }

  async setFilterToDate(date: string): Promise<void> {
    await this.fillVisibleInput(SELECTORS.elFilterToDate, date);
  }

  async setFilterSearch(text: string): Promise<void> {
    await this.fillVisibleInput(SELECTORS.elFilterSearch, text);
  }

  async submitFilters(): Promise<void> {
    await this.expandFilters();
    // Click the Search button scoped to the active tab panel
    const panel = this.getActiveTabPanel();
    const searchBtn = panel.getByRole('button', { name: 'Search' });
    await searchBtn.click({ timeout: 8_000 });
    await this.waitForSpinner();
  }

  async waitForTableLoad(timeoutMs = 15_000): Promise<void> {
    await this.page.locator(`${SELECTORS.table}, ${SELECTORS.tableRow}, .rdt_Table, table, tbody tr`).first()
      .waitFor({ state: 'visible', timeout: timeoutMs })
      .catch(() => {});
    await this.waitForSpinner();
  }

  async getRowsPerPageValue(): Promise<string> {
    const dropdown = this.page.locator(SELECTORS.rowsPerPageDropdown).first();
    return await dropdown.inputValue().catch(() => '10');
  }

  async changeRowsPerPage(value: string): Promise<void> {
    const dropdown = this.page.locator(SELECTORS.rowsPerPageDropdown).first();
    await dropdown.selectOption(value);
    await this.waitForSpinner();
  }

  async getPaginationText(): Promise<string | null> {
    const pagination = this.page.locator('.rdt_Pagination');
    if (await pagination.isVisible({ timeout: 3_000 }).catch(() => false)) {
      return (await pagination.textContent())?.trim() || null;
    }
    return null;
  }

  async getPageHeading(): Promise<string | null> {
    // AuthWrapper renders page title as a heading element
    const candidates = [
      this.page.locator('h1').first(),
      this.page.locator('h2').first(),
      this.page.locator('[class*="title"]:has-text("ERROR LOG")').first(),
      this.page.locator('[class*="header"]:has-text("ERROR LOG")').first(),
      this.page.getByText('ERROR LOG', { exact: true }).first(),
    ];
    for (const el of candidates) {
      if (await el.isVisible({ timeout: 1_500 }).catch(() => false)) {
        const text = (await el.textContent())?.trim();
        if (text) return text;
      }
    }
    return null;
  }

  async isDownloadCsvButtonVisible(): Promise<boolean> {
    await this.expandFilters();
    const panel = this.getActiveTabPanel();
    return panel.getByRole('button', { name: /download csv/i }).isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async isEmailCsvButtonVisible(): Promise<boolean> {
    await this.expandFilters();
    const panel = this.getActiveTabPanel();
    return panel.getByRole('button', { name: /email csv/i }).isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async clickEmailCsv(): Promise<void> {
    await this.expandFilters();
    const panel = this.getActiveTabPanel();
    await panel.getByRole('button', { name: /email csv/i }).click();
  }

  async isEmailCsvModalVisible(): Promise<boolean> {
    const modal = this.page.locator('.modal.show, [role="dialog"]').filter({ hasText: /email/i });
    return modal.isVisible({ timeout: 5_000 }).catch(() => false);
  }
}

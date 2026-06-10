import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { findFirstMatchingRow, getNormalizedHeaders, getColumnIndexByHeaderText, goToNextPage } from '../../helpers/table.helpers.js';

export class OverviewPage extends OriginationBasePage {
  readonly dashboardCards = this.page.locator(SELECTORS.dashboardCard);
  readonly totalApplications = this.page.locator('[data-metric="totalApplications"]');
  readonly approvedCount = this.page.locator('[data-metric="approved"]');
  readonly pendingCount = this.page.locator('[data-metric="pending"]');

  async getDashboardMetric(metricName: string): Promise<string> {
    const metric = this.page.locator(`[data-metric="${metricName}"]`);
    return (await this.getTextContent(metric)) || '0';
  }

  async verifyDashboardLoaded(): Promise<void> {
    await this.waitForSpinner();
    // Wait for the Filters button or the data table to confirm the page is ready
    const filtersBtn = this.page.locator(SELECTORS.filtersButton).first();
    const table = this.page.locator(SELECTORS.table).first();
    await Promise.race([
      filtersBtn.waitFor({ state: 'visible', timeout: 15_000 }),
      table.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {});
  }

  /**
   * Navigates to overview page and searches the table for a row matching
   * the given Reference # (leadPk). Returns the row data including "Approval Amt".
   * Paginates if needed.
   * Mirrors CommonSteps.getTableDataForIdOnly() from the Java project.
   */
  async getRowDataByReferenceId(leadPk: string): Promise<Record<string, string> | null> {
    await this.waitForSpinner();

    // Wait for the table to render with at least one row (overview loads table after dashboard cards)
    const tableRow = this.page.locator(SELECTORS.tableRow).first();
    await tableRow.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
    await this.waitForSpinner();

    // Search across all pages
    for (let pageNum = 1; pageNum <= 20; pageNum++) {
      const row = await findFirstMatchingRow(this.page, { 'Reference #': leadPk });
      if (row) return row;

      const hasNext = await goToNextPage(this.page);
      if (!hasNext) break;
    }
    return null;
  }

  // ── Filters ──────────────────────────────────────────────────────────

  /**
   * Expands the filter panel if not already expanded.
   * Checks whether the Merchant filter control is visible; if not, clicks
   * the "Filters" toggle button and waits for filter controls to appear.
   */
  async expandFilters(): Promise<void> {
    await this.waitForSpinner();
    const merchantControl = this.getMerchantControl();
    const isExpanded = await merchantControl.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!isExpanded) {
      const filtersBtn = this.page.locator(SELECTORS.filtersButton).first();
      if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await filtersBtn.click();
        await merchantControl.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      }
    }
  }

  /**
   * Selects a merchant from the Merchant multi-select filter.
   * Types the merchant name to narrow the options, then picks the matching option.
   */
  async filterByMerchant(merchantName: string): Promise<void> {
    await this.expandFilters();
    await this.selectMultiFilterOption('Merchant', merchantName);
  }

  /** Selects the "Select All" option in the Merchant multi-select filter. */
  async selectAllMerchants(): Promise<void> {
    await this.expandFilters();
    await this.selectMultiFilterOption('Merchant', 'Select All');
  }

  /**
   * Selects a location from the Location multi-select filter.
   * Types the location name to narrow the options, then picks the matching option.
   * Waits for any reactive updates (e.g., auto-add merchants from location) to settle.
   */
  async filterByLocation(locationName: string): Promise<void> {
    await this.expandFilters();
    await this.selectMultiFilterOption('Location', locationName);
    await this.waitForSpinner();
  }

  /** Selects the "Select All" option in the Location multi-select filter. */
  async selectAllLocations(): Promise<void> {
    await this.expandFilters();
    await this.selectMultiFilterOption('Location', 'Select All');
  }

  /**
   * Clicks the Search button in the filter panel.
   * Waits for the spinner to complete and the table rows (or "no records") to render.
   */
  async submitFilters(): Promise<void> {
    const searchBtn = this.page.locator(SELECTORS.searchButton).first();
    await searchBtn.scrollIntoViewIfNeeded();
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await searchBtn.click({ force: true, timeout: 8_000 });
    await this.waitForSpinner();
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(async () => {
        await this.page.locator('text=There are no records to display')
          .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      });
  }

  /**
   * Returns the names of all currently selected merchants in the Merchant filter.
   * Reads the `.filter__multi-value__label` elements within the Merchant control.
   */
  async getSelectedMerchants(): Promise<string[]> {
    await this.expandFilters();
    return this.getMultiValueLabels('Merchant');
  }

  /**
   * Returns the names of all currently selected locations in the Location filter.
   * Reads the `.filter__multi-value__label` elements within the Location control.
   */
  async getSelectedLocations(): Promise<string[]> {
    await this.expandFilters();
    return this.getMultiValueLabels('Location');
  }

  /**
   * Opens the Location dropdown and returns all available option texts.
   * Closes the dropdown after collecting options.
   */
  async getLocationOptions(): Promise<string[]> {
    await this.expandFilters();
    const control = this.getFilterControlByLabel('Location');
    await control.click();

    // Wait for the dropdown menu to appear
    const menu = this.page.locator(SELECTORS.filterMenuPortal + ', .filter__menu').first();
    await menu.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    // Collect all option texts
    const options = this.page.locator(SELECTORS.filterOption);
    const texts = await options.allTextContents();
    const trimmed = texts.map(t => t.trim()).filter(Boolean);

    // Close the dropdown by pressing Escape
    await this.page.keyboard.press('Escape');
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    return trimmed;
  }

  // ── Column-order assertions (task #1295) ─────────────────────────────

  /** Returns the table headers in display order, with sort-indicator arrows stripped. */
  async readHeaderOrder(): Promise<string[]> {
    return getNormalizedHeaders(this.page);
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

  /**
   * Opens the "Config Columns" side panel (Overview only).
   * Waits for the panel container to be visible.
   */
  async clickConfigColumns(): Promise<void> {
    const trigger = this.page.locator(SELECTORS.configColumnsTrigger).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await this.page.locator(SELECTORS.configColumnsPanel).first()
      .waitFor({ state: 'visible', timeout: 5_000 })
      .catch(() => {
        // Some renderings expose the checkboxes inline (no modal wrapper); the
        // caller's next `toggleColumn` call will surface the real problem.
      });
  }

  /**
   * Toggles a single column visibility checkbox by name (e.g. 'Sales Rep Code').
   * Assumes the Config Columns panel is already open.
   */
  async toggleColumn(name: string): Promise<void> {
    const checkbox = this.page.locator(SELECTORS.configColumnsCheckbox(name)).first();
    await checkbox.waitFor({ state: 'attached', timeout: 5_000 });
    await checkbox.click();
  }

  /** Closes the Config Columns panel via Escape. */
  async closeConfigColumns(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.locator(SELECTORS.configColumnsPanel).first()
      .waitFor({ state: 'hidden', timeout: 3_000 })
      .catch(() => {});
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Returns the filter control locator for a given label (e.g., 'Merchant', 'Location').
   * Uses the label ~ sibling pattern to find the React Select control.
   */
  private getFilterControlByLabel(label: string) {
    return this.page.locator(`label:has-text('${label}') ~ div`)
      .locator(SELECTORS.filterControl).first();
  }

  /** Returns the Merchant filter control locator. */
  private getMerchantControl() {
    return this.getFilterControlByLabel('Merchant');
  }

  /**
   * Selects an option from a multi-select React Select filter identified by label.
   * Clicks the control, types the option text to narrow results, picks the match,
   * and waits for the dropdown menu to close.
   */
  private async selectMultiFilterOption(label: string, optionText: string): Promise<void> {
    const control = this.getFilterControlByLabel(label);
    await control.scrollIntoViewIfNeeded();
    await control.click();

    // Wait for dropdown menu to open
    const menu = this.page.locator(`${SELECTORS.filterMenuPortal}, .filter__menu`).first();
    await menu.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    // Pick the matching option directly (no typing needed)
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: optionText }).first();
    await option.click({ timeout: 5_000 });

    // Wait for the dropdown menu portal to close
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /**
   * Returns the text of all `.filter__multi-value__label` elements
   * within the filter control identified by the given label.
   */
  private async getMultiValueLabels(label: string): Promise<string[]> {
    const wrapper = this.page.locator(`label:has-text('${label}') ~ div`).first();
    const labels = wrapper.locator(SELECTORS.filterMultiValueLabel);
    const texts = await labels.allTextContents();
    return texts.map(t => t.trim()).filter(Boolean);
  }
}

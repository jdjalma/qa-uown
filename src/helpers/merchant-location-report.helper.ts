import { type Page } from '@playwright/test';
import { SELECTORS } from '../selectors/common.selectors.js';
import { MerchantLocationFilterPO } from '../pages/origination/merchant-location-filter.po.js';
import { waitForSpinner } from './common.helpers.js';
import { getColumnValues } from './table.helpers.js';

/** Empty-state message common to the Origination rdt tables. */
const EMPTY_STATE = 'text=There are no records to display';

/**
 * Shared controls for the Origination report pages that use the
 * multi-select Merchant/Location filter (#1319) + rdt pagination + column reading.
 *
 * Extracted from ModificationReportPage <-> MerchantModHistoryPage (they were ~80%
 * identical — filter/pagination/reading byte-for-byte equal). Composition
 * pattern (mirror of `FilteredCsvDownloadControls`): the page objects compose
 * this class via a `report` field and delegate, instead of duplicating the logic.
 *
 * Single-select `filterByMerchant`/`filterByLocation`/`expandFilters`/
 * `submitFilters` kept for backward-compat (DEPRECATED — use multi-select).
 */
export class MerchantLocationReportControls {
  private readonly filter: MerchantLocationFilterPO;

  constructor(private readonly page: Page) {
    this.filter = new MerchantLocationFilterPO(page);
  }

  // ── Single-select filters (DEPRECATED — backward compat) ─────────────

  async expandFilters(): Promise<void> {
    await waitForSpinner(this.page);
    const searchBtn = this.page.locator(SELECTORS.searchButton).first();
    const isExpanded = await searchBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!isExpanded) {
      const filtersBtn = this.page.locator(SELECTORS.filtersButton).first();
      if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await filtersBtn.click();
        await searchBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      }
    }
  }

  /** Selects one option in a single-select react-select anchored on `label`. */
  private async selectSingle(label: string, optionText: string): Promise<void> {
    await this.expandFilters();
    const control = this.page.locator(`label:has-text('${label}') ~ div`)
      .locator(SELECTORS.filterControl).first();
    await control.scrollIntoViewIfNeeded();
    await control.click({ force: true });

    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: optionText }).first();
    await option.click({ timeout: 5_000 });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  async filterByMerchant(merchantName: string): Promise<void> {
    await this.selectSingle('Merchant', merchantName);
  }

  async filterByLocation(locationName: string): Promise<void> {
    await this.selectSingle('Location', locationName);
  }

  async submitFilters(): Promise<void> {
    const searchBtn = this.page.locator(SELECTORS.searchButton).first();
    await searchBtn.scrollIntoViewIfNeeded();
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await searchBtn.click({ force: true, timeout: 8_000 });
    await waitForSpinner(this.page);
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(async () => {
        await this.page.locator(EMPTY_STATE)
          .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      });
  }

  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator(EMPTY_STATE)
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }

  // ── Multi-select filters (task #1319) ────────────────────────────────

  /** Selects one or more merchants. Expands the filter panel first. */
  async filterByMerchants(merchants: string[]): Promise<void> {
    await this.filter.openFilterPanel();
    await this.filter.selectMerchants(merchants);
  }

  /**
   * Selects one or more locations. MUST be called AFTER `filterByMerchants` —
   * Location is disabled until at least one Merchant is selected (DOM-first qa2).
   */
  async filterByLocations(locations: string[]): Promise<void> {
    await this.filter.selectLocations(locations);
  }

  /** Applies the current multi-select filter selection (clicks Search). */
  async applyFilters(): Promise<void> {
    await this.filter.applySearch();
  }

  /** Number of merchants currently selected ("N items selected"). */
  async getMerchantSelectedCount(): Promise<number> {
    return this.filter.getMerchantSelectedCount();
  }

  /** Number of locations currently selected ("N items selected"). */
  async getLocationSelectedCount(): Promise<number> {
    return this.filter.getLocationSelectedCount();
  }

  /** Names of the merchants currently ticked in the Merchant dropdown. */
  async getCheckedMerchants(): Promise<string[]> {
    return this.filter.getCheckedOptionNames('Merchant');
  }

  /** All merchant options available in the Merchant dropdown roster. */
  async listAvailableMerchants(): Promise<string[]> {
    return this.filter.listAvailableOptions('Merchant');
  }

  /**
   * All location options available in the Location dropdown roster.
   * Location is disabled until a Merchant is selected (DOM-first qa2), so call
   * `filterByMerchants` first — otherwise the roster is empty.
   */
  async listAvailableLocations(): Promise<string[]> {
    return this.filter.listAvailableOptions('Location');
  }

  // ── Table column reads (task #1319) ──────────────────────────────────

  /**
   * Reads the "Merchant Name" column value of every visible row.
   * Returns [] when the table shows the empty-state message.
   */
  async getMerchantColumnValues(): Promise<string[]> {
    const hasNoRecords = await this.page.locator(EMPTY_STATE)
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return [];
    return getColumnValues(this.page, 'Merchant Name');
  }

  // ── Pagination (task #1319) ──────────────────────────────────────────

  /** Trimmed text of the pagination footer, e.g. "1-10 of 45". '' when absent. */
  async getVisiblePageInfo(): Promise<string> {
    const footer = this.page.locator(SELECTORS.rdtPaginationFooter).first();
    if (!(await footer.isVisible({ timeout: 2_000 }).catch(() => false))) return '';
    return (await footer.textContent())?.trim() ?? '';
  }

  /** Advances to the next page if the Next button is enabled. */
  async goToNextPage(): Promise<void> {
    const nextBtn = this.page.locator(SELECTORS.paginationNext);
    const enabled = await nextBtn.isEnabled().catch(() => false);
    if (!enabled) return;
    await nextBtn.click();
    await waitForSpinner(this.page);
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }

  /** Returns to the previous page if the Previous button is enabled. */
  async goToPreviousPage(): Promise<void> {
    const prevBtn = this.page.locator(SELECTORS.paginationPrevious);
    const enabled = await prevBtn.isEnabled().catch(() => false);
    if (!enabled) return;
    await prevBtn.click();
    await waitForSpinner(this.page);
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }
}

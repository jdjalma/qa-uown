import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { MerchantLocationFilterPO } from './merchant-location-filter.po.js';
import { getNormalizedHeaders, getColumnIndexByHeaderText } from '../../helpers/table.helpers.js';

/**
 * Page object for the Origination Modification Report page.
 *
 * Filters: Agent Name, Merchant, Location (dependent on Merchant),
 *          Modification Type, Start/End Date.
 *
 * Endpoint: POST /uown/los/getModifiedLeads
 *
 * # Multi-select (task #1319, deployed qa2 2026-06-18)
 *
 * The Merchant + Location filters now use the shared `MerchantLocationFilters`
 * React component (multi-select). DOM-first (qa2 2026-06-18):
 *   - Merchant: `filter__value-container--is-multi`. No "Select All".
 *   - Location: `filter__value-container--is-multi`, DISABLED until at least one
 *     Merchant is selected — call `filterByMerchants` BEFORE `filterByLocations`.
 *
 * The single-select `filterByMerchant` / `filterByLocation` / `expandFilters` /
 * `submitFilters` methods are kept for backward compatibility but are DEPRECATED.
 */
export class ModificationReportPage extends OriginationBasePage {
  /** Shared multi-select Merchant/Location filter widget (#1319). */
  private readonly filter: MerchantLocationFilterPO = new MerchantLocationFilterPO(this.page);

  async navigateToModificationReport(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}/modificationReport`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  async expandFilters(): Promise<void> {
    await this.waitForSpinner();
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

  async filterByMerchant(merchantName: string): Promise<void> {
    await this.expandFilters();
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

  async filterByLocation(locationName: string): Promise<void> {
    await this.expandFilters();
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

  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }

  // ── Agent / Date / Modification-Type filters (#1315 — CT-03/CT-04) ───

  /**
   * Sets the value of a React-controlled (Formik) input via the native value
   * setter + `input`/`change` events. `page.fill()` alone silently no-ops on
   * these inputs because React owns the value. See [[selector-hardening]]
   * (forceReactInputValue) and [[page-object-pattern]] anti-pattern table.
   */
  private async forceReactInputValue(selector: string, value: string): Promise<void> {
    await this.page.evaluate(
      ([sel, val]) => {
        const input = document.querySelector(sel) as HTMLInputElement | null;
        if (!input) return;
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;
        if (setter) setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      },
      [selector, value] as const,
    );
  }

  /**
   * Free-text Agent Name search (partial match). Expands the filter panel first.
   * @param agentName e.g. `jmendes.gow` or `SYSTEM`.
   */
  async filterByAgentName(agentName: string): Promise<void> {
    await this.expandFilters();
    const input = this.page.locator(SELECTORS.modReportAgentNameInput).first();
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await this.forceReactInputValue(SELECTORS.modReportAgentNameInput, agentName);
  }

  /**
   * Sets the Start Date / End Date window. Dates MUST be `MM/DD/YYYY`
   * (DOM-confirmed placeholder, qa2 2026-06-18). Expands the filter panel first.
   */
  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.expandFilters();
    await this.page.locator(SELECTORS.modReportStartDateInput).first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    await this.forceReactInputValue(SELECTORS.modReportStartDateInput, startDate);
    await this.forceReactInputValue(SELECTORS.modReportEndDateInput, endDate);
  }

  /**
   * Selects a Modification Type in the single-select react-select
   * (`LEAD_STATUS_CHANGE` | `APPROVAL_AMOUNT_CHANGE` | `LEASE_MOD`).
   * Anchored on the "Modification Type" label's sibling control.
   */
  async filterByModificationType(type: string): Promise<void> {
    await this.expandFilters();
    const control = this.page.locator("label:has-text('Modification Type') ~ div")
      .locator(SELECTORS.filterControl).first();
    await control.scrollIntoViewIfNeeded();
    await control.click({ force: true });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: type }).first();
    await option.click({ timeout: 5_000 });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /** Clicks Search and waits for the table (or empty-state) to render. */
  async search(): Promise<void> {
    await this.submitFilters();
  }

  /**
   * Reads every visible row as a structured record keyed by header text
   * (sort-arrow-normalized). Empty array when the table shows the empty state.
   * Columns: Lead, Date, Modification Type, Merchant Name, Location Name,
   * Old Status, New Status, Old Internal Status, New Internal Status,
   * New Amount, Old Amount, Agent Name.
   */
  async getAllRows(): Promise<Record<string, string>[]> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return [];

    const headers = await getNormalizedHeaders(this.page);
    const rows = this.page.locator(SELECTORS.tableRow);
    const rowCount = await rows.count();
    const out: Record<string, string>[] = [];
    for (let i = 0; i < rowCount; i++) {
      const cells = await rows.nth(i).locator(SELECTORS.tableCell).allTextContents();
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        record[h.trim() || `#col-${idx}`] = (cells[idx] ?? '').trim();
      });
      out.push(record);
    }
    return out;
  }

  /**
   * Returns the first row whose "Lead" column equals `leadPk`, or null.
   * Use after applying filters + `search()`. Walks every result page (rdt
   * paginates at 10 rows by default) so a target on page 2+ is still found.
   */
  async getRowByLeadPk(leadPk: string | number): Promise<Record<string, string> | null> {
    const target = String(leadPk).trim();
    // Bounded page walk — guards against an unexpectedly large result set.
    for (let guard = 0; guard < 50; guard++) {
      const rows = await this.getAllRows();
      const hit = rows.find(r => (r['Lead'] ?? '').trim() === target);
      if (hit) return hit;

      const nextBtn = this.page.locator(SELECTORS.paginationNext);
      const canAdvance = await nextBtn.isEnabled().catch(() => false);
      if (!canAdvance) return null;
      await this.goToNextPage();
    }
    return null;
  }

  /**
   * Convenience accessor — the "Agent Name" cell of the row matching `leadPk`,
   * or null when the lead is not in the current result set.
   */
  async getAgentNameByLeadPk(leadPk: string | number): Promise<string | null> {
    const row = await this.getRowByLeadPk(leadPk);
    return row ? (row['Agent Name'] ?? null) : null;
  }

  // ── Multi-select filters (task #1319) ────────────────────────────────

  /**
   * Selects one or more merchants in the multi-select Merchant filter.
   * Expands the filter panel first.
   */
  async filterByMerchants(merchants: string[]): Promise<void> {
    await this.filter.openFilterPanel();
    await this.filter.selectMerchants(merchants);
  }

  /**
   * Selects one or more locations in the multi-select Location filter.
   * MUST be called AFTER `filterByMerchants` — Location is disabled until at
   * least one Merchant is selected (DOM-first qa2 2026-06-18).
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

  // ── Table column reads (task #1319) ──────────────────────────────────

  /**
   * Reads the "Merchant Name" column value of every visible row.
   * Returns [] when the table shows the empty-state message.
   */
  async getMerchantColumnValues(): Promise<string[]> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return [];

    const headers = await getNormalizedHeaders(this.page);
    const colIdx = getColumnIndexByHeaderText(headers, 'Merchant Name');
    if (colIdx === -1) return [];

    const rows = this.page.locator(SELECTORS.tableRow);
    const rowCount = await rows.count();
    const values: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const cells = await rows.nth(i).locator(SELECTORS.tableCell).allTextContents();
      values.push((cells[colIdx] ?? '').trim());
    }
    return values;
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
    await this.waitForSpinner();
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }

  /** Returns to the previous page if the Previous button is enabled. */
  async goToPreviousPage(): Promise<void> {
    const prevBtn = this.page.locator(SELECTORS.paginationPrevious);
    const enabled = await prevBtn.isEnabled().catch(() => false);
    if (!enabled) return;
    await prevBtn.click();
    await this.waitForSpinner();
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  }
}

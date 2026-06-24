import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { MerchantLocationReportControls } from '../../helpers/merchant-location-report.helper.js';
import { getNormalizedHeaders } from '../../helpers/table.helpers.js';

const EMPTY_STATE = 'text=There are no records to display';

/**
 * Page object for the Origination Modification Report page.
 *
 * Filters: Agent Name, Merchant, Location (dependent on Merchant),
 *          Modification Type, Start/End Date.
 *
 * Endpoint: POST /uown/los/getModifiedLeads
 *
 * O filtro multi-select Merchant/Location (#1319), a paginação e o
 * getMerchantColumnValues são compartilhados via
 * {@link MerchantLocationReportControls} (campo `report`) — delegados abaixo.
 * Específicos desta página: filtros Agent/Date/ModType (#1315) e a leitura
 * estruturada de linhas (getAllRows / getRowByLeadPk).
 */
export class ModificationReportPage extends OriginationBasePage {
  private readonly report = new MerchantLocationReportControls(this.page);

  async navigateToModificationReport(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}/modificationReport`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
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
    await this.report.expandFilters();
    const input = this.page.locator(SELECTORS.modReportAgentNameInput).first();
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await this.forceReactInputValue(SELECTORS.modReportAgentNameInput, agentName);
  }

  /**
   * Sets the Start Date / End Date window. Dates MUST be `MM/DD/YYYY`
   * (DOM-confirmed placeholder, qa2 2026-06-18). Expands the filter panel first.
   */
  async filterByDateRange(startDate: string, endDate: string): Promise<void> {
    await this.report.expandFilters();
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
    await this.report.expandFilters();
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
    await this.report.submitFilters();
  }

  /**
   * Reads every visible row as a structured record keyed by header text
   * (sort-arrow-normalized). Empty array when the table shows the empty state.
   * Columns: Lead, Date, Modification Type, Merchant Name, Location Name,
   * Old Status, New Status, Old Internal Status, New Internal Status,
   * New Amount, Old Amount, Agent Name.
   */
  async getAllRows(): Promise<Record<string, string>[]> {
    const hasNoRecords = await this.page.locator(EMPTY_STATE)
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
      await this.report.goToNextPage();
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

  // ── Delegação ao MerchantLocationReportControls (#1319) ──────────────
  expandFilters(): Promise<void> { return this.report.expandFilters(); }
  filterByMerchant(name: string): Promise<void> { return this.report.filterByMerchant(name); }
  filterByLocation(name: string): Promise<void> { return this.report.filterByLocation(name); }
  submitFilters(): Promise<void> { return this.report.submitFilters(); }
  getVisibleRowCount(): Promise<number> { return this.report.getVisibleRowCount(); }
  filterByMerchants(merchants: string[]): Promise<void> { return this.report.filterByMerchants(merchants); }
  filterByLocations(locations: string[]): Promise<void> { return this.report.filterByLocations(locations); }
  applyFilters(): Promise<void> { return this.report.applyFilters(); }
  getMerchantSelectedCount(): Promise<number> { return this.report.getMerchantSelectedCount(); }
  getLocationSelectedCount(): Promise<number> { return this.report.getLocationSelectedCount(); }
  getCheckedMerchants(): Promise<string[]> { return this.report.getCheckedMerchants(); }
  listAvailableMerchants(): Promise<string[]> { return this.report.listAvailableMerchants(); }
  getMerchantColumnValues(): Promise<string[]> { return this.report.getMerchantColumnValues(); }
  getVisiblePageInfo(): Promise<string> { return this.report.getVisiblePageInfo(); }
  async goToNextPage(): Promise<boolean> { await this.report.goToNextPage(); return true; }
  goToPreviousPage(): Promise<void> { return this.report.goToPreviousPage(); }
}

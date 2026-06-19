import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { sleep } from '../../helpers/common.helpers.js';
import { getNormalizedHeaders, getColumnIndexByHeaderText } from '../../helpers/table.helpers.js';
import type { Download } from '@playwright/test';
import { FilteredCsvDownloadControls } from './filtered-csv-download.controls.js';

export class FundingPage extends OriginationBasePage {
  /**
   * DOM-first (qa2 2026-06-18) — Funding Queue filter form is a CUSTOM component,
   * NOT the shared MerchantLocationFilters widget used on MMH / Modification Report.
   * Key differences:
   *   - Labels are <div> elements (not <label>), coexisting with sidebar nav
   *     <div> items that share the same text ("Merchant", etc.).
   *   - React-select containers have STABLE IDs: #statuses, #merchantName,
   *     #merchantLocation — used directly instead of label-based XPath.
   *   - Status* ("Funding" pre-selected on load), Merchant, Location are multi-select.
   *   - Location is INDEPENDENT of Merchant (not gated), unlike MMH / Mod Report.
   */

  /**
   * Shared CSV export controls (Download CSV / Email CSV + size-limit guard),
   * the same `FilteredCsvDownload` component used by Overview and Leads
   * (task #1321). `funding-csv-download` follows the `{screen}-csv-download`
   * tooltipIdPrefix convention.
   */
  private readonly csv = new FilteredCsvDownloadControls(this.page, 'funding-csv-download');

  readonly filtersButton = this.page.locator(SELECTORS.filtersButton);
  readonly searchButton = this.page.locator("button:has-text('Search')");
  readonly fundingTable = this.page.locator(SELECTORS.table);
  readonly sendToFundedButton = this.page.locator("button:has-text('Send to FUNDED')");
  readonly noRecordsMessage = this.page.locator('text=There are no records to display');

  /**
   * Navigates to the Funding Queue page.
   *
   * Pass `originationUrl` (e.g. `env.originationUrl`) to navigate directly via
   * URL — required when the page starts at `about:blank` (task-testing project,
   * no baseURL set). Omit when the browser is already on the Origination portal
   * (inline E2E flows in `tests/`); in that case the sidebar `#funding` link is
   * clicked as before.
   */
  async navigateToFundingQueue(originationUrl?: string): Promise<void> {
    if (originationUrl) {
      await this.page.goto(`${originationUrl}/funding`, { waitUntil: 'domcontentloaded' });
      await this.waitForPageLoad();
    } else {
      await this.clickAndWaitForSpinner(this.page.locator(SELECTORS.fundingQueue));
    }
  }

  async expandFilters(): Promise<void> {
    // Wait for any loading overlay to clear before interacting with filters
    await this.waitForSpinner();

    // Check if filter section is already expanded (search button visible)
    const searchBtn = this.page.locator("button:has-text('Search')").first();
    const isExpanded = await searchBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!isExpanded) {
      const filtersBtn = this.page.locator("button:has-text('Filters')").first();
      if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await filtersBtn.click({ force: true });
        await searchBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {
          console.log('[Funding] Search button did not appear after expanding filters');
        });
      }
    }
  }

  /**
   * Selects a merchant from the Merchant single-select filter.
   * Funding page uses label[@for]+sibling div pattern with filter__dropdown-indicator.
   */
  async filterByMerchant(merchantName: string): Promise<void> {
    await this.expandFilters();
    await this.selectFilterOption(
      [
        "xpath=//label[@for='merchantName']/following-sibling::div//div[contains(@class, 'filter__dropdown-indicator')]",
        "xpath=//*[text()='Merchant']/following-sibling::div//div[contains(@class, 'filter__dropdown-indicator')]",
        "xpath=//*[text()='Merchant']/following-sibling::div//div[contains(@class, 'control')]",
      ],
      merchantName,
    );
  }

  /**
   * Selects a location from the Location single-select filter.
   * Same label+sibling pattern as merchant.
   */
  async filterByLocation(locationName: string): Promise<void> {
    await this.expandFilters();
    await this.selectFilterOption(
      [
        "xpath=//label[@for='locationName']/following-sibling::div//div[contains(@class, 'filter__dropdown-indicator')]",
        "xpath=//*[text()='Location']/following-sibling::div//div[contains(@class, 'filter__dropdown-indicator')]",
        "xpath=//*[text()='Location']/following-sibling::div//div[contains(@class, 'control')]",
      ],
      locationName,
    );
  }

  /**
   * Selects a status in the funding queue filter.
   * "Funding" is pre-selected by default when the page loads.
   */
  async filterByStatus(status: string): Promise<void> {
    await this.expandFilters();

    await this.selectFilterOption(
      [
        `${SELECTORS.fundingDropdownSvg}, ${SELECTORS.statusDropdownSvg}`,
        "xpath=//*[contains(text(),'Status')]/following-sibling::div//div[contains(@class,'filter__dropdown-indicator')]",
      ],
      status,
    );
  }

  async searchWithCurrentFilters(): Promise<void> {
    await this.expandFilters();

    // Re-query the search button in case the DOM has re-rendered
    const searchBtn = this.page.locator("button:has-text('Search')").first();
    if (await searchBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchBtn.scrollIntoViewIfNeeded().catch(() => {});
      await searchBtn.click();
      await this.waitForSpinner();
    } else {
      // Fallback: reload page and retry
      console.log('[Funding] Search button not visible — reloading page');
      await this.page.reload();
      await this.waitForSpinner();
    }
  }

  /**
   * Searches the funding queue with retry, waiting for at least one record to appear.
   * After settlement, the account may take a few seconds to appear in the queue.
   */
  async searchUntilRecordsAppear(maxRetries = 5, intervalMs = 10_000): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      await this.searchWithCurrentFilters();

      const firstRow = this.page.locator(`${SELECTORS.tableRowById(0)}, ${SELECTORS.tableRow}`).first();
      if (await firstRow.isVisible({ timeout: 3_000 }).catch(() => false)) {
        return true;
      }

      if (attempt < maxRetries) {
        await sleep(intervalMs);
      }
    }
    return false;
  }

  /**
   * Funds the first entry in the funding queue.
   * Flow (from Java UownFundingSteps):
   *   1. Select checkbox on first row
   *   2. Click "Send to FUNDED" dropdown
   *   3. Click "FUNDED" option
   *   4. Click primary "SEND" confirmation button
   *   5. Wait for completion toast
   */
  async fundFirstEntry(): Promise<void> {
    const firstRow = this.page.locator(`${SELECTORS.tableRowById(0)}, ${SELECTORS.tableRow}`).first();
    await firstRow.waitFor({ state: 'visible', timeout: 10_000 });

    // Select the first row checkbox
    const firstRowCheckbox = firstRow.locator(SELECTORS.checkboxInput);
    if (await firstRowCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await firstRowCheckbox.check();
    } else {
      await firstRow.click();
    }

    // Click "Send to FUNDED" dropdown button
    await this.sendToFundedButton.click();

    // Click the FUNDED option in the dropdown menu
    const fundedOption = this.page.locator(
      `${SELECTORS.funded}, .dropdown-item:has-text("FUNDED"), [role="menuitem"]:has-text("FUNDED")`
    ).first();
    if (await fundedOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await fundedOption.click();
    }

    // Confirm by clicking primary SEND button
    const sendBtn = this.page.locator(
      "button.btn-primary:has-text('SEND'), button.btn-primary:has-text('Send'), button.btn-primary:has-text('Confirm')"
    ).first();
    if (await sendBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await sendBtn.click();
    }

    await this.waitForSpinner();

    // Wait for success toast
    const toast = this.page.locator(SELECTORS.toastBody);
    await toast.waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
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

  // ── Funding Queue filter helpers (task #1319) ────────────────────────
  // Stable DOM IDs for the react-select containers on the Funding Queue filter form.
  // Using IDs avoids the sidebar nav <div>Merchant</div> collision that breaks
  // XPath-based label lookup (MerchantLocationFilterPO is designed for <label> elements).

  /** Ensures the Funding Queue filter panel is expanded (Search button visible). */
  private async openFundingFilterPanel(): Promise<void> {
    await this.waitForSpinner();
    const search = this.searchButton.first();
    if (await search.isVisible({ timeout: 500 }).catch(() => false)) return;
    const toggle = this.page.locator(SELECTORS.multiSelectFilterButton).first();
    if (await toggle.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await toggle.click();
      await search.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }
  }

  /** react-select root control element scoped by stable ID. */
  private fqCtrl(id: string) {
    return this.page.locator(`#${id} .filter__control`);
  }

  /** Multi-value container ("N items selected" text) scoped by stable ID. */
  private fqValueContainer(id: string) {
    return this.page.locator(`#${id} [class*="filter__value-container--is-multi"]`);
  }

  /** Clear-all "×" indicator scoped by stable ID. */
  private fqClearX(id: string) {
    return this.page.locator(`#${id} .filter__clear-indicator`);
  }

  // NOTE: Funding Queue react-select dropdowns (DOM-first qa2 2026-06-18).
  // The combobox input exposes aria-expanded="true" when the dropdown is open —
  // this is the ONLY reliable open/close signal. CSS class approaches failed
  // because the menu class may differ from filter__menu / filter__menu-portal.
  // Option elements are found by SELECTORS.filterOption scoped to #id.

  /** Locator that exists (and is visible) only when the dropdown for id is open.
   *  Uses ARIA semantics: the combobox input sets aria-expanded="true" on open. */
  private fqExpanded(id: string) {
    return this.page.locator(`#${id} [aria-expanded='true']`);
  }

  /** All option rows for the open dropdown identified by id.
   *  Covers BOTH inline dropdowns (options inside #id) and portaled dropdowns
   *  (menu rendered to document.body via .filter__menu-portal).
   *  Funding Queue Status appears inline; Merchant/Location appear portaled.
   *  The two cases are never both open simultaneously so the union is safe. */
  private fqOptionRows(id: string) {
    return this.page.locator(
      `#${id} ${SELECTORS.filterOption}, ${SELECTORS.filterMenuPortal} ${SELECTORS.filterOption}`,
    );
  }

  /** Opens the dropdown for the given control ID.
   *  Guards against toggling it closed when already open (react-select auto-opens
   *  the dropdown after the clear-X is clicked — checking aria-expanded prevents
   *  the control click from closing it). */
  private async fqOpenDropdown(id: string): Promise<void> {
    const expanded = this.fqExpanded(id);
    if (await expanded.isVisible({ timeout: 300 }).catch(() => false)) return;
    await this.fqCtrl(id).click({ force: true });
    await expanded.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
  }

  /** Closes the dropdown for the given control ID.
   *  Escape does not commit a focused option (safe for multi-select checkboxes).
   *  After Escape, aria-expanded becomes false synchronously but the portaled menu
   *  element stays in DOM during the CSS close animation. The portal wait ensures
   *  the menu is fully gone before any subsequent action. */
  private async fqCloseDropdown(id: string): Promise<void> {
    if (!(await this.fqExpanded(id).isVisible({ timeout: 200 }).catch(() => false))) return;
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.fqExpanded(id).waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
    // Wait for the portaled menu overlay to be hidden (CSS animation complete).
    await this.page.locator('.filter__menu-portal')
      .waitFor({ state: 'hidden', timeout: 2_000 })
      .catch(() => {});
  }

  /** Selects a single option. Uses getByText exact match to avoid "Funded"/"Refunded"
   *  substring collision. After picking, closes any still-open dropdown via control click. */
  private async fqSelectOption(id: string, option: string): Promise<void> {
    await this.fqOpenDropdown(id);
    const item = this.fqOptionRows(id)
      .filter({ has: this.page.getByText(option, { exact: true }) })
      .first();
    await item.scrollIntoViewIfNeeded();
    await item.click();
    // Close any lingering dropdown (handle both close-on-pick and stay-open variants).
    await this.fqCloseDropdown(id);
  }

  /** Opens the dropdown, reads all option labels (excluding "Select All"), closes. */
  private async fqListOptions(id: string): Promise<string[]> {
    await this.fqOpenDropdown(id);
    const rows = this.fqOptionRows(id);
    const total = await rows.count();
    const out: string[] = [];
    for (let i = 0; i < total; i++) {
      const t = (await rows.nth(i).textContent())?.trim();
      if (t && t !== 'Select All') out.push(t);
    }
    await this.fqCloseDropdown(id);
    return out;
  }

  /** Returns the number of currently selected items from the "N items selected" text. */
  private async fqGetSelectedCount(id: string): Promise<number> {
    const vc = this.fqValueContainer(id);
    if (!(await vc.isVisible({ timeout: 1_000 }).catch(() => false))) return 0;
    const text = (await vc.textContent())?.trim() ?? '';
    const m = /(\d+)\s+items?\s+selected/i.exec(text);
    return m ? parseInt(m[1]!, 10) : 0;
  }

  // ── Multi-select filter public API (task #1319) ──────────────────────

  /**
   * Selects one or more statuses in the multi-select Status filter.
   *
   * The Status filter loads with "Funding" PRE-SELECTED. This method clears the
   * default selection first so the resulting selection contains EXACTLY the
   * requested statuses (DOM-first qa2 2026-06-18).
   */
  async filterByStatuses(statuses: string[]): Promise<void> {
    await this.openFundingFilterPanel();
    const cx = this.fqClearX('statuses');
    if (await cx.isVisible({ timeout: 500 }).catch(() => false)) await cx.click({ force: true });
    for (const s of statuses) await this.fqSelectOption('statuses', s);
  }

  /** Selects one or more merchants in the multi-select Merchant filter. */
  async filterByMerchants(merchants: string[]): Promise<void> {
    await this.openFundingFilterPanel();
    const cx = this.fqClearX('merchantName');
    if (await cx.isVisible({ timeout: 500 }).catch(() => false)) await cx.click({ force: true });
    for (const m of merchants) await this.fqSelectOption('merchantName', m);
  }

  /**
   * Selects one or more locations in the multi-select Location filter.
   * On the Funding Queue, Location is independent of Merchant (NOT disabled) —
   * unlike MMH / Modification Report (DOM-first qa2 2026-06-18).
   */
  async filterByLocations(locations: string[]): Promise<void> {
    await this.openFundingFilterPanel();
    const cx = this.fqClearX('merchantLocation');
    if (await cx.isVisible({ timeout: 500 }).catch(() => false)) await cx.click({ force: true });
    for (const l of locations) await this.fqSelectOption('merchantLocation', l);
  }

  /**
   * Applies the current filter selection by clicking "Search" and waiting for
   * the backend response. Named distinctly from `searchWithCurrentFilters` so
   * existing callers are not affected.
   *
   * Waits for `.filter__menu-portal` to be hidden before clicking Search.
   * All three Funding Queue filters (Status, Merchant, Location) use a portaled
   * react-select menu that stays in the DOM briefly after Escape (CSS animation).
   * The portal intercepts pointer events and blocks the Search button click.
   * Waiting here is more reliable than waiting inside fqCloseDropdown because
   * "Select All" click auto-closes the dropdown without going through fqCloseDropdown.
   */
  async applyFiltersMulti(): Promise<void> {
    await this.openFundingFilterPanel();
    // Ensure the portal overlay is fully gone before clicking Search.
    await this.page.locator('.filter__menu-portal')
      .waitFor({ state: 'hidden', timeout: 3_000 })
      .catch(() => {});
    const search = this.searchButton.first();
    await Promise.all([
      this.page.waitForResponse(
        r => /\/uown\//.test(r.url()) && r.status() < 400,
      ).catch(() => {}),
      search.click(),
    ]);
    await this.waitForSpinner();
  }

  /** Number of statuses currently selected ("N items selected"). */
  async getStatusSelectedCount(): Promise<number> {
    return this.fqGetSelectedCount('statuses');
  }

  /** Number of merchants currently selected ("N items selected"). */
  async getMerchantSelectedCount(): Promise<number> {
    return this.fqGetSelectedCount('merchantName');
  }

  /** Number of locations currently selected ("N items selected"). */
  async getLocationSelectedCount(): Promise<number> {
    return this.fqGetSelectedCount('merchantLocation');
  }

  /** All status options available in the Status dropdown roster. */
  async listAvailableStatuses(): Promise<string[]> {
    await this.openFundingFilterPanel();
    return this.fqListOptions('statuses');
  }

  /** All merchant options available in the Merchant dropdown roster. */
  async listAvailableMerchants(): Promise<string[]> {
    await this.openFundingFilterPanel();
    return this.fqListOptions('merchantName');
  }

  /** Clears the Status filter selection (clicks the "×" clear-all indicator). */
  async clearStatusFilter(): Promise<void> {
    const cx = this.fqClearX('statuses');
    if (await cx.isVisible({ timeout: 500 }).catch(() => false)) await cx.click({ force: true });
  }

  /** Names of the statuses currently ticked in the Status dropdown.
   *  Opens the dropdown, detects selection via the checkbox child (checked = selected), closes. */
  async getCheckedStatuses(): Promise<string[]> {
    await this.fqOpenDropdown('statuses');
    const rows = this.fqOptionRows('statuses');
    const count = await rows.count();
    const checked: string[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const text = (await row.textContent())?.trim();
      if (!text || text === 'Select All') continue;
      // Each status option contains an <input type="checkbox"> child; checked = selected.
      const isChecked = await row.locator('input[type="checkbox"]')
        .isChecked({ timeout: 200 }).catch(() => false);
      if (isChecked) checked.push(text);
    }
    await this.fqCloseDropdown('statuses');
    return checked;
  }

  /** Whether the Status dropdown exposes a "Select All" affordance. */
  async statusFilterHasSelectAll(): Promise<boolean> {
    await this.openFundingFilterPanel();
    await this.fqOpenDropdown('statuses');
    const has = await this.fqOptionRows('statuses')
      .filter({ hasText: 'Select All' })
      .isVisible({ timeout: 1_000 }).catch(() => false);
    await this.fqCloseDropdown('statuses');
    return has;
  }

  /** Ticks every Status option via the "Select All" affordance. */
  async selectAllStatuses(): Promise<void> {
    await this.openFundingFilterPanel();
    const cx = this.fqClearX('statuses');
    if (await cx.isVisible({ timeout: 500 }).catch(() => false)) await cx.click({ force: true });
    await this.fqOpenDropdown('statuses');
    const selectAll = this.fqOptionRows('statuses')
      .filter({ hasText: 'Select All' })
      .first();
    await selectAll.waitFor({ state: 'visible', timeout: 5_000 });
    await selectAll.click({ force: true });
    await this.fqCloseDropdown('statuses');
  }

  // ── Table column reads (task #1319) ──────────────────────────────────

  /**
   * Reads the "Merchant" column value of every visible row.
   * Returns [] when the table shows the empty-state message.
   */
  async getMerchantColumnValues(): Promise<string[]> {
    return this.getColumnValues('Merchant');
  }

  /**
   * Reads the "Status" column value of every visible row.
   * Returns [] when the table shows the empty-state message.
   */
  async getStatusColumnValues(): Promise<string[]> {
    return this.getColumnValues('Status');
  }

  /** Reads the named column's value for every visible row (header-matched). */
  private async getColumnValues(header: string): Promise<string[]> {
    if (await this.noRecordsMessage.isVisible({ timeout: 2_000 }).catch(() => false)) {
      return [];
    }
    const headers = await getNormalizedHeaders(this.page);
    const colIdx = getColumnIndexByHeaderText(headers, header);
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

  /**
   * Returns the total record count parsed from the pagination footer
   * ("1-10 of 45" → "45"). Falls back to the full footer text when the
   * "of N" pattern is absent (e.g. single-page tables without a total).
   */
  async getTotalRowCount(): Promise<string> {
    const text = await this.getVisiblePageInfo();
    const match = /\d+-\d+\s+of\s+(\d+)/i.exec(text);
    return match ? match[1]! : text;
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

  // ── CSV export (task #1321) ──────────────────────────────────────────
  // Delegated to the shared `FilteredCsvDownloadControls` component so the
  // Download CSV / Email CSV / size-limit logic is not duplicated. NOTE the
  // delegate is named `getTotalCsvRowCount` (not `getTotalRowCount`) to avoid
  // shadowing this class's existing `getTotalRowCount(): Promise<string>`.

  /** True when the Download CSV button is rendered. */
  isDownloadCsvVisible(): Promise<boolean> { return this.csv.isDownloadCsvVisible(); }

  /** True when the Download CSV button is in its enabled state. */
  isDownloadCsvEnabled(): Promise<boolean> { return this.csv.isDownloadCsvEnabled(); }

  /** True when the Email CSV button is rendered. */
  isEmailCsvVisible(): Promise<boolean> { return this.csv.isEmailCsvVisible(); }

  /** True when the Email CSV button is enabled (disabled only on empty table). */
  isEmailCsvEnabled(): Promise<boolean> { return this.csv.isEmailCsvEnabled(); }

  /** Hovers the Download CSV control to surface its directing tooltip. */
  hoverDownloadCsv(): Promise<void> { return this.csv.hoverDownloadCsv(); }

  /** Download CSV directing tooltip (size-exceeded case only), else null. */
  getDownloadDisabledTooltip(): Promise<string | null> { return this.csv.getDownloadDisabledTooltip(); }

  /** Clicks Download CSV and returns the captured Download (happy path). */
  downloadCsv(): Promise<Download> { return this.csv.downloadCsv(); }

  /** Clicks Email CSV and waits for the email-address modal to open. */
  openEmailCsvModal(): Promise<void> { return this.csv.openEmailCsvModal(); }

  /** Filtered total from the rdt pagination footer ("X-Y of N" → N), or null. */
  getTotalCsvRowCount(): Promise<number | null> { return this.csv.getTotalRowCount(); }
}

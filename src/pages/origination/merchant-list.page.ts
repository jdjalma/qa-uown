import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { waitForDownload, saveDownload } from '../../helpers/downloads.helpers.js';
import {
  getNormalizedHeaders,
  getColumnIndexByHeaderText,
} from '../../helpers/table.helpers.js';

/**
 * Page object for the Origination Merchant list page (`/merchant`).
 *
 * Task #1292 (R1.52.0) — the Merchant list page now uses the shared
 * `MerchantLocationFilters` multi-select component. Filter widget operations
 * live in `MerchantLocationFilterPO`; this PO handles navigation, table read
 * helpers, Config Columns, the Active filter and CSV export (task #1309).
 *
 * Distinct from `MerchantEditPage` (`/merchant/{refMerchantCode}`).
 *
 * ── Config Columns on /merchant (discovery, task #1309) ──────────────────
 * The Config Columns panel here is a Bootstrap dropdown (`div.dropdown.show`),
 * NOT a dialog/modal/aside — so the generic `configColumnsPanel` selector used
 * by `OverviewPage` does NOT match. We use `configColumnsPanelMerchants`.
 * Each column is a native `<input type="checkbox">` whose `name`/`id` is the
 * column label; `value="true"` when checked, `value=""` when unchecked.
 * Selecting/unselecting is immediate (no Apply/Save button — BR-01).
 * Source: docs/knowledge-base/merchants-config-columns-export.md
 */
export class MerchantListPage extends OriginationBasePage {
  async navigateToMerchantList(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchant`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => {
        // Empty dataset is unusual on /merchant but must not block panel assertions.
      });
  }

  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }

  // ── Config Columns (task #1309) ──────────────────────────────────────

  /**
   * Opens the "Config Columns" dropdown panel and waits for it to be visible.
   * Uses the Merchants-specific Bootstrap-dropdown selector (NOT the Overview
   * dialog selector). No Apply button — selection is immediate (BR-01).
   */
  async openConfigColumns(): Promise<void> {
    const panel = this.page.locator(SELECTORS.configColumnsPanelMerchants).first();
    if (await panel.isVisible({ timeout: 500 }).catch(() => false)) {
      return; // already open
    }
    const trigger = this.page.locator(SELECTORS.configColumnsTrigger).first();
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await panel.waitFor({ state: 'visible', timeout: 8_000 });
  }

  /** Closes the Config Columns dropdown via Escape and waits for it to hide. */
  async closeConfigColumns(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.locator(SELECTORS.configColumnsPanelMerchants).first()
      .waitFor({ state: 'hidden', timeout: 5_000 })
      .catch(() => {});
  }

  private columnCheckbox(name: string) {
    // Native checkbox keyed by `name`/`id` (= column label). The second
    // alternative of `configColumnsCheckbox` works on the Merchants page.
    return this.page.locator(`input[type='checkbox'][name=${JSON.stringify(name)}]`).first();
  }

  /**
   * Returns whether the column checkbox is currently checked.
   * Assumes the Config Columns panel is open.
   */
  async isColumnChecked(name: string): Promise<boolean> {
    const checkbox = this.columnCheckbox(name);
    await checkbox.waitFor({ state: 'attached', timeout: 8_000 });
    return checkbox.isChecked();
  }

  /**
   * Idempotently sets a column checkbox to the desired state — toggles ONLY
   * when the current state differs. Supports the "ensure unchecked" reset that
   * is the linchpin of the auto-default isolation (CT-05/06). Selection is
   * immediate (no Apply), so the table updates on click.
   * Assumes the Config Columns panel is open.
   */
  async setColumn(name: string, checked: boolean): Promise<void> {
    const checkbox = this.columnCheckbox(name);
    await checkbox.waitFor({ state: 'attached', timeout: 8_000 });
    const current = await checkbox.isChecked();
    if (current === checked) return;
    // The label-wrapped native input may be visually covered; click the input.
    await checkbox.click();
    await this.page.waitForFunction(
      ([n, want]) => {
        const el = document.querySelector(`input[type='checkbox'][name="${n}"]`) as HTMLInputElement | null;
        return !!el && el.checked === want;
      },
      [name, checked] as const,
      { timeout: 5_000 },
    ).catch(() => {});
  }

  // ── Table read helpers (task #1309) ──────────────────────────────────

  /** Returns the table headers in display order (sort-indicator arrows stripped). */
  async getTableHeaders(): Promise<string[]> {
    return getNormalizedHeaders(this.page);
  }

  /**
   * Resolves a merchant's row by Merchant Code and returns the cell text under
   * the given column label. Paginates up to `maxPages` (default 5) if the
   * merchant is not on the current page.
   *
   * Returns '' when the cell is empty (NULL GDS value renders blank — confirm
   * Q-G2 post-deploy). Returns null only if the merchant row is not found.
   */
  async getCellValueForMerchant(
    merchantCode: string,
    columnLabel: string,
    maxPages = 5,
  ): Promise<string | null> {
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const headers = await this.getTableHeaders();
      const codeIdx = getColumnIndexByHeaderText(headers, 'Merchant Code');
      const colIdx = getColumnIndexByHeaderText(headers, columnLabel);
      if (codeIdx === -1) {
        throw new Error(`'Merchant Code' column not found in headers: ${headers.join(' | ')}`);
      }
      if (colIdx === -1) {
        throw new Error(`Column '${columnLabel}' not found in headers: ${headers.join(' | ')}`);
      }

      const rows = this.page.locator(SELECTORS.tableRow);
      const rowCount = await rows.count();
      for (let r = 0; r < rowCount; r++) {
        const cells = await rows.nth(r).locator(SELECTORS.tableCell).allTextContents();
        const code = (cells[codeIdx] ?? '').trim();
        if (code === merchantCode) {
          return (cells[colIdx] ?? '').trim();
        }
      }

      const advanced = await this.goToNextMerchantPage();
      if (!advanced) break;
    }
    return null;
  }

  /** Resolves the Merchant Code of the row at the given 0-based index on the current page. */
  async getMerchantCodeAtRow(rowIndex: number): Promise<string> {
    const headers = await this.getTableHeaders();
    const codeIdx = getColumnIndexByHeaderText(headers, 'Merchant Code');
    if (codeIdx === -1) {
      throw new Error(`'Merchant Code' column not found in headers: ${headers.join(' | ')}`);
    }
    const rows = this.page.locator(SELECTORS.tableRow);
    const cells = await rows.nth(rowIndex).locator(SELECTORS.tableCell).allTextContents();
    return (cells[codeIdx] ?? '').trim();
  }

  private async goToNextMerchantPage(): Promise<boolean> {
    const nextBtn = this.page.locator(SELECTORS.paginationNext);
    const visible = await nextBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    const enabled = visible ? await nextBtn.isEnabled().catch(() => false) : false;
    if (!visible || !enabled) return false;
    await nextBtn.click();
    await this.waitForSpinner();
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
    return true;
  }

  // ── Active filter (task #1309) ───────────────────────────────────────

  /**
   * Sets the `Active`/`Inactive` filter via the `#isActive` react-select, then
   * applies it (clicks Search if a Search button is present). The Filters panel
   * may need to be expanded first; the Active react-select is opened, the option
   * is picked, and the filter is submitted.
   *
   * Discovery: container id `isActive`, single-select, options Active/Inactive
   * only (default Active). Filter is applied via the Search button (BR-06).
   */
  async setActiveFilter(value: 'Active' | 'Inactive'): Promise<void> {
    await this.expandFiltersIfNeeded();

    const control = this.page.locator(`#isActive ${SELECTORS.filterControl}`).first();
    await control.scrollIntoViewIfNeeded();
    await control.waitFor({ state: 'visible', timeout: 8_000 });
    await control.click();

    const menu = this.page.locator(SELECTORS.filterMenuPortal).first();
    await menu.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: value }).first();
    await option.click({ timeout: 5_000 });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    // BR-06: filter requires a Search click to re-query.
    await this.submitSearchIfPresent();
  }

  private async expandFiltersIfNeeded(): Promise<void> {
    const control = this.page.locator(`#isActive ${SELECTORS.filterControl}`).first();
    const visible = await control.isVisible({ timeout: 1_000 }).catch(() => false);
    if (visible) return;
    const filtersBtn = this.page.locator(SELECTORS.filtersButton).first();
    if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filtersBtn.click();
      await control.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }
  }

  private async submitSearchIfPresent(): Promise<void> {
    const searchBtn = this.page.locator(SELECTORS.searchButton).first();
    if (await searchBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await searchBtn.scrollIntoViewIfNeeded();
      await this.page.waitForLoadState('networkidle').catch(() => {});
      await searchBtn.click({ force: true, timeout: 8_000 });
    }
    await this.waitForSpinner();
    await this.page.locator(SELECTORS.tableRow).first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(async () => {
        await this.page.locator('text=There are no records to display')
          .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      });
  }

  // ── CSV export (task #1309) ──────────────────────────────────────────

  /**
   * Clicks "Download CSV", intercepts the download, saves it to the downloads
   * dir and returns the local file path. CSV is generated client-side from the
   * currently checked Config Columns (BR-02). Expected file name
   * `merchant-report.csv` (discovery).
   */
  async downloadCsv(): Promise<string> {
    const trigger = this.page.locator(SELECTORS.csvDownloadTrigger).first();
    await trigger.scrollIntoViewIfNeeded();
    const download = await waitForDownload(this.page, async () => {
      await trigger.click();
    });
    return saveDownload(download);
  }
}

import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for the Servicing portal main search/filter page (Search Result).
 *
 * Task #501: Add Merchant field on Search Filter
 * New filter fields: MERCHANT (name: 'merchantName') and LOCATION (name: 'location')
 * Both rendered as React Select dropdowns with classNamePrefix='filter'.
 *
 * Filter panel is collapsible — use expandFilters() before any filter interaction.
 *
 * Merchant dropdown options: filteredMerchants (string[]) — changes based on selected location.
 * Location dropdown options: locationNames (from API) or allLocations (all merchants' locations).
 * Cross-select: selecting merchant → filters locations; selecting location → auto-fills merchant.
 *
 * IMPORTANT: All option queries MUST be scoped to SELECTORS.filterMenuPortal (.filter__menu-portal).
 * Without scoping, SELECTORS.filterOption matches stale/hidden elements elsewhere on the page.
 */
export class ServicingSearchPage extends ServicingBasePage {

  // ── Navigation ────────────────────────────────────────────────────────────

  /**
   * Navigates directly to the Servicing search page.
   * @param servicingBaseUrl - from testEnv.servicingUrl (e.g. "https://servicing-qa1.uownleasing.com")
   */
  async navigateToSearch(servicingBaseUrl: string): Promise<void> {
    await this.page.goto(`${servicingBaseUrl}/search`);
    await this.waitForSpinner();
    await this.page.locator('text=Search Result').first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    // Wait for async merchant/location API calls to complete before any dropdown interaction.
    await this.page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  }

  // ── Filter Panel ──────────────────────────────────────────────────────────

  /**
   * Expands the filter panel if collapsed.
   * Detects expansion by checking if the "From" date label is visible.
   */
  async expandFilters(): Promise<void> {
    await this.waitForSpinner();
    // Use the Search submit button as expansion indicator — it is always visible when the
    // filter panel is expanded, regardless of which filters have values selected.
    // (The "From" date label does not exist on this search page.)
    const searchBtn = this.page.locator(SELECTORS.searchButton).first();
    const isExpanded = await searchBtn.isVisible({ timeout: 1_000 }).catch(() => false);
    if (!isExpanded) {
      const filtersBtn = this.page.getByRole('button', { name: 'Filters' }).first();
      if (await filtersBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await filtersBtn.click();
        await searchBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      }
    }
    // Wait for async merchant/location API calls triggered by panel expansion.
    await this.page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => {});
  }

  // ── Date Filters ──────────────────────────────────────────────────────────

  /**
   * Clears the From and To date range inputs in the filter panel.
   * The Servicing search page defaults to today's date, which filters out most accounts.
   * Call this before selectMerchant/selectLocation/submitFilters to search across all dates.
   */
  async clearDateFilters(): Promise<void> {
    await this.expandFilters();
    const fromInput = this.page.locator("input[name='from']").first();
    const toInput = this.page.locator("input[name='to']").first();
    if (await fromInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await fromInput.click();
      await fromInput.press('Control+a');
      await fromInput.press('Delete');
    }
    if (await toInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await toInput.click();
      await toInput.press('Control+a');
      await toInput.press('Delete');
    }
  }

  // ── Field Visibility ──────────────────────────────────────────────────────

  /**
   * Returns true if the MERCHANT React Select is visible in the filter panel.
   * React Select renders placeholder as div.filter__placeholder (NOT input[placeholder]).
   * Waits up to 5s for the merchants API call to complete and populate the dropdown.
   */
  async isMerchantFieldVisible(): Promise<boolean> {
    await this.expandFilters();
    return this.page.locator(SELECTORS.filterPlaceholder)
      .filter({ hasText: 'Search by Merchant' })
      .first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Returns true if the LOCATION React Select is visible in the filter panel.
   * React Select renders placeholder as div.filter__placeholder (NOT input[placeholder]).
   */
  async isLocationFieldVisible(): Promise<boolean> {
    await this.expandFilters();
    return this.page.locator(SELECTORS.filterPlaceholder)
      .filter({ hasText: 'Search by Location' })
      .first()
      .isVisible({ timeout: 5_000 }).catch(() => false);
  }

  // ── Merchant Dropdown ─────────────────────────────────────────────────────

  /**
   * Opens the Merchant React Select dropdown and returns all available option texts.
   * Options are scoped to .filter__menu-portal to avoid matching stale elements.
   * Closes the dropdown via Escape after reading options.
   */
  async getMerchantOptions(): Promise<string[]> {
    await this.expandFilters();
    const placeholder = this.page.locator(SELECTORS.filterPlaceholder)
      .filter({ hasText: 'Search by Merchant' }).first();
    await placeholder.scrollIntoViewIfNeeded();
    await placeholder.click();

    const menuPortal = this.page.locator(SELECTORS.filterMenuPortal);
    await menuPortal.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const options = menuPortal.locator(SELECTORS.filterOption);
    await options.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    const texts = await options.allTextContents();

    await this.page.keyboard.press('Escape');
    await menuPortal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    return texts.map(t => t.trim()).filter(Boolean);
  }

  /**
   * Selects a merchant by name in the Merchant React Select dropdown.
   * Options are scoped to .filter__menu-portal.
   * After selection, waits for the menu to close.
   */
  async selectMerchant(merchantName: string): Promise<void> {
    await this.expandFilters();

    const placeholder = this.page.locator(SELECTORS.filterPlaceholder)
      .filter({ hasText: 'Search by Merchant' }).first();
    await placeholder.scrollIntoViewIfNeeded();
    await placeholder.click();

    const menuPortal = this.page.locator(SELECTORS.filterMenuPortal);
    await menuPortal.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const option = menuPortal.locator(SELECTORS.filterOption)
      .filter({ hasText: merchantName }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();

    await menuPortal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /**
   * Returns the currently selected merchant name (single-value display text).
   * Returns empty string if no merchant is selected.
   */
  async getSelectedMerchant(): Promise<string> {
    // After selection, React Select renders: div.filter__single-value inside the merchant control
    const singleValue = this.page.locator(SELECTORS.filterSingleValue).nth(0);
    return (await singleValue.textContent({ timeout: 2_000 }).catch(() => '')) ?? '';
  }

  // ── Location Dropdown ─────────────────────────────────────────────────────

  /**
   * Opens the Location React Select dropdown and returns all visible option texts.
   * Options are scoped to .filter__menu-portal to avoid matching stale elements.
   * Closes the dropdown via Escape after reading.
   */
  async getLocationOptions(): Promise<string[]> {
    await this.expandFilters();
    const placeholder = this.page.locator(SELECTORS.filterPlaceholder)
      .filter({ hasText: 'Search by Location' }).first();
    await placeholder.scrollIntoViewIfNeeded();
    await placeholder.click();

    const menuPortal = this.page.locator(SELECTORS.filterMenuPortal);
    await menuPortal.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const options = menuPortal.locator(SELECTORS.filterOption);
    await options.first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    const texts = await options.allTextContents();

    await this.page.keyboard.press('Escape');
    await menuPortal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    return texts.map(t => t.trim()).filter(Boolean);
  }

  /**
   * Selects a location by name in the Location React Select dropdown.
   * Options are scoped to .filter__menu-portal.
   * Cross-select: this will auto-fill the Merchant field with the corresponding merchant.
   */
  async selectLocation(locationName: string): Promise<void> {
    await this.expandFilters();

    const placeholder = this.page.locator(SELECTORS.filterPlaceholder)
      .filter({ hasText: 'Search by Location' }).first();
    await placeholder.scrollIntoViewIfNeeded();
    await placeholder.click();

    const menuPortal = this.page.locator(SELECTORS.filterMenuPortal);
    await menuPortal.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
    const option = menuPortal.locator(SELECTORS.filterOption)
      .filter({ hasText: locationName }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click();

    await menuPortal.waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  /**
   * Returns the currently selected location name.
   * Returns empty string if no location is selected.
   */
  async getSelectedLocation(): Promise<string> {
    const singleValues = this.page.locator(SELECTORS.filterSingleValue);
    return (await singleValues.nth(1).textContent({ timeout: 2_000 }).catch(() => '')) ?? '';
  }

  /**
   * Clears the currently selected merchant by clicking the React Select clear button.
   * Falls back to keyboard Backspace if the clear indicator is not visible.
   * Clearing merchant also clears location (cross-select reverse — React state).
   */
  async clearMerchant(): Promise<void> {
    // Hover over the merchant control to reveal the clear (×) indicator
    const merchantControl = this.page.locator(SELECTORS.filterControl).first();
    await merchantControl.hover();
    const clearBtn = this.page.locator(SELECTORS.filterClearIndicator).first();
    const hasClear = await clearBtn.isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasClear) {
      await clearBtn.click();
    } else {
      // Fallback: click the single-value and press Backspace
      const singleValue = this.page.locator(SELECTORS.filterSingleValue).first();
      if (await singleValue.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await singleValue.click();
        await this.page.keyboard.press('Backspace');
      }
    }
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
  }

  // ── Search Submit ─────────────────────────────────────────────────────────

  /** Clicks the Search button in the filter panel and waits for results. */
  async submitFilters(): Promise<void> {
    const searchBtn = this.page.locator(
      "button[name='searchButton'], button[type='submit']:has-text('Search')",
    ).first();
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

  // ── Table Results ─────────────────────────────────────────────────────────

  /** Returns the number of visible rows in the results table (0 if "no records" message shown). */
  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }

  /** Returns all row cells text for a given row index (0-based). */
  async getRowCells(rowIndex: number): Promise<string[]> {
    const cells = await this.page.locator(SELECTORS.tableRow).nth(rowIndex)
      .locator(SELECTORS.tableCell).allTextContents();
    return cells.map(c => c.trim());
  }
}

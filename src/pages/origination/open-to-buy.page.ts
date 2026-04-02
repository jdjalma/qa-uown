import { type Page } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for the Origination portal Open to Buy page (/openToBuy).
 *
 * Task #1205 — Standardize Merchant and Location Filters.
 *
 * Filter panel fields:
 *   - Merchant (multi-select React Select with "Select All")
 *   - Location (multi-select React Select with "Select All")
 *
 * Uses the shared MerchantLocationFilters component with `filter__` CSS prefix.
 */
export class OpenToBuyPage extends OriginationBasePage {
  readonly exportCsvButton = this.page.locator(SELECTORS.openToBuyExportCsvButton).first();

  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ───────────────────────────────────────────────────────

  async navigateToOpenToBuy(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}openToBuy`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  // ── Filters ──────────────────────────────────────────────────────────

  async expandFilters(): Promise<void> {
    await this.waitForSpinner();
    // Check if the Merchant placeholder or multi-value chips are already visible
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

  async filterByMerchant(merchantName: string): Promise<void> {
    await this.expandFilters();
    const control = this.getMerchantControl();
    await control.click();
    // Type to search within the opened dropdown
    const input = this.getMerchantInput();
    await input.fill(merchantName);
    // Select the matching option
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: merchantName }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
    // Wait for menu portal to close
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    await this.waitForSpinner();
  }

  async selectAllMerchants(): Promise<void> {
    await this.expandFilters();
    const control = this.getMerchantControl();
    await control.click();
    const selectAllOption = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: 'Select All' }).first();
    await selectAllOption.waitFor({ state: 'visible', timeout: 5_000 });
    await selectAllOption.click({ force: true });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    await this.waitForSpinner();
  }

  async filterByLocation(locationName: string): Promise<void> {
    await this.expandFilters();
    const control = this.getLocationControl();
    await control.click();
    const input = this.getLocationInput();
    await input.fill(locationName);
    const option = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: locationName }).first();
    await option.waitFor({ state: 'visible', timeout: 5_000 });
    await option.click({ force: true });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    await this.waitForSpinner();
  }

  async selectAllLocations(): Promise<void> {
    await this.expandFilters();
    const control = this.getLocationControl();
    await control.click();
    const selectAllOption = this.page.locator(SELECTORS.filterOption)
      .filter({ hasText: 'Select All' }).first();
    await selectAllOption.waitFor({ state: 'visible', timeout: 5_000 });
    await selectAllOption.click({ force: true });
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    await this.waitForSpinner();
  }

  async submitFilters(): Promise<void> {
    // Open to Buy is a reactive page — data updates automatically as merchants/locations change.
    // There is no "Search" button. Close any open dropdown and wait for the page to settle.
    await this.page.keyboard.press('Escape');
    await this.waitForSpinner();
  }

  async exportCsv(): Promise<void> {
    await this.waitForSpinner();
    await this.exportCsvButton.click();
    await this.waitForSpinner();
  }

  // ── Read State ───────────────────────────────────────────────────────

  async getSelectedMerchants(): Promise<string[]> {
    const container = this.getMerchantContainer();
    const chips = container.locator(SELECTORS.filterMultiValueLabel);
    const count = await chips.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await chips.nth(i).textContent())?.trim();
      if (text) values.push(text);
    }
    return values;
  }

  async getSelectedLocations(): Promise<string[]> {
    const container = this.getLocationContainer();
    const chips = container.locator(SELECTORS.filterMultiValueLabel);
    const count = await chips.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await chips.nth(i).textContent())?.trim();
      if (text) values.push(text);
    }
    return values;
  }

  async getLocationOptions(): Promise<string[]> {
    await this.expandFilters();
    const control = this.getLocationControl();
    await control.click();
    // Wait for dropdown to open
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    const options = this.page.locator(SELECTORS.filterOption);
    const count = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await options.nth(i).textContent())?.trim();
      if (text) texts.push(text);
    }
    // Close dropdown
    await this.page.keyboard.press('Escape');
    await this.page.locator(SELECTORS.filterMenuPortal)
      .waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
    return texts;
  }

  async getMerchantSingleValue(): Promise<string> {
    const container = this.getMerchantContainer();
    const singleValue = container.locator(SELECTORS.filterSingleValue).first();
    return this.getTextContent(singleValue);
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  /**
   * Returns the container element for the Merchant filter control.
   * Scoped via the "Merchant" label and its parent wrapper.
   */
  private getMerchantContainer() {
    return this.page.locator("label:has-text('Merchant')").locator('..');
  }

  /** Returns the `.filter__control` within the Merchant container. */
  private getMerchantControl() {
    return this.getMerchantContainer().locator(SELECTORS.filterControl).first();
  }

  /** Returns the input within the Merchant filter control. */
  private getMerchantInput() {
    return this.getMerchantControl().locator('input').first();
  }

  /**
   * Returns the container element for the Location filter control.
   * Scoped via the "Location" label and its parent wrapper.
   */
  private getLocationContainer() {
    return this.page.locator("label:has-text('Location')").locator('..');
  }

  /** Returns the `.filter__control` within the Location container. */
  private getLocationControl() {
    return this.getLocationContainer().locator(SELECTORS.filterControl).first();
  }

  /** Returns the input within the Location filter control. */
  private getLocationInput() {
    return this.getLocationControl().locator('input').first();
  }
}

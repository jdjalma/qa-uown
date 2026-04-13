import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for the Origination Merchant Modification History page.
 *
 * Filters: Log Type, Start/End Date, Merchant Ref Code, Merchant (single-select),
 *          Location (single-select, dependent on Merchant), User Name.
 *
 * Endpoint: POST /uown/getMerchantDataChangeResults
 */
export class MerchantModHistoryPage extends OriginationBasePage {

  async navigateToMerchantModHistory(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}/merchantModificationHistory`, { waitUntil: 'domcontentloaded' });
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
}

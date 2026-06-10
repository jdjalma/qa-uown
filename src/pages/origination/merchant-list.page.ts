import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for the Origination Merchant list page (`/merchant`).
 *
 * Task #1292 (R1.52.0) — the Merchant list page now uses the shared
 * `MerchantLocationFilters` multi-select component. Filter widget operations
 * live in `MerchantLocationFilterPO`; this PO only handles navigation and
 * table read helpers.
 *
 * Distinct from `MerchantEditPage` (`/merchant/{refMerchantCode}`).
 */
export class MerchantListPage extends OriginationBasePage {
  async navigateToMerchantList(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchant`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }
}

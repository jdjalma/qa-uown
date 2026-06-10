import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for the Origination Rebate page (`/rebate`).
 *
 * Task #1292 (R1.52.0) — the Rebate page now consumes the shared
 * `MerchantLocationFilters` component (multi-select Merchant + Location).
 * Filter widget operations live in `MerchantLocationFilterPO`; this PO only
 * handles navigation and table read helpers.
 */
export class RebatePage extends OriginationBasePage {
  async navigateToRebate(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}rebate`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  async getVisibleRowCount(): Promise<number> {
    const hasNoRecords = await this.page.locator('text=There are no records to display')
      .isVisible({ timeout: 2_000 }).catch(() => false);
    if (hasNoRecords) return 0;
    return this.page.locator(SELECTORS.tableRow).count();
  }
}

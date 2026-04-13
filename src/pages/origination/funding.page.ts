import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { sleep } from '../../helpers/common.helpers.js';

export class FundingPage extends OriginationBasePage {
  readonly filtersButton = this.page.locator(SELECTORS.filtersButton);
  readonly searchButton = this.page.locator("button:has-text('Search')");
  readonly fundingTable = this.page.locator(SELECTORS.table);
  readonly sendToFundedButton = this.page.locator("button:has-text('Send to FUNDED')");
  readonly noRecordsMessage = this.page.locator('text=There are no records to display');

  async navigateToFundingQueue(): Promise<void> {
    await this.clickAndWaitForSpinner(this.page.locator(SELECTORS.fundingQueue));
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
}

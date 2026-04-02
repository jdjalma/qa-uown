import { type Page } from '@playwright/test';
import { AmsBasePage } from './ams-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * AmsUserMerchantsPage — /associate-users-to-merchants
 *
 * "Assign merchants to users" page with two react-data-table-component tables:
 *   - Left  (Users table):     select users via checkbox rows
 *   - Right (Merchants table): select merchants via checkbox rows
 *
 * Both tables have pagination (.rdt_Pagination / button[aria-label="Next Page"]).
 * Submit button: button:has-text("Submit")
 *
 * Selection info labels:
 *   - Users:     [class*="selectable-users-table_selectionInfo"]
 *   - Merchants: [class*="selectable-merchants-table_selectionInfo"]
 */
export class AmsUserMerchantsPage extends AmsBasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly submitButton         = this.page.locator(SELECTORS.amsAssocPageSubmit);
  readonly usersSelectionInfo   = this.page.locator(SELECTORS.amsUsersSelectionInfo);
  readonly merchantsSelectionInfo = this.page.locator(SELECTORS.amsMerchantsSelectionInfo);

  /** Scoped containers for each table */
  private get usersContainer()     { return this.page.locator(SELECTORS.amsAssocUsersTableContainer); }
  private get merchantsContainer() { return this.page.locator(SELECTORS.amsAssocMerchantsTableContainer); }

  /** Wait for both rdt tables to be visible on the page. */
  async waitForMerchantsPage(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible', timeout: 20_000 });
    await this.page.locator(SELECTORS.amsRdtTable).nth(1).waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Count of visible rows in the Users (left) table. */
  async getUsersRowCount(): Promise<number> {
    return this.usersContainer.locator(SELECTORS.amsRdtTableRow).count();
  }

  /** Count of visible rows in the Merchants (right) table. */
  async getMerchantsRowCount(): Promise<number> {
    return this.merchantsContainer.locator(SELECTORS.amsRdtTableRow).count();
  }

  /**
   * Select user in the Users table by row index (0-based).
   * Returns the username text of the selected row.
   */
  async selectUserByIndex(index: number): Promise<string> {
    const row = this.usersContainer.locator(SELECTORS.amsRdtTableRow).nth(index);
    await row.waitFor({ state: 'visible' });
    const checkbox = row.locator(SELECTORS.amsAssocRowCheckbox).first();
    await checkbox.check();
    // Return visible text of first non-checkbox cell
    const cellText = await row.locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
    return cellText.trim();
  }

  /**
   * Select a merchant in the Merchants (right) table by row index (0-based).
   * Returns the merchant code text.
   */
  async selectMerchantByIndex(index: number): Promise<string> {
    const row = this.merchantsContainer.locator(SELECTORS.amsRdtTableRow).nth(index);
    await row.waitFor({ state: 'visible' });
    const checkbox = row.locator(SELECTORS.amsAssocRowCheckbox).first();
    await checkbox.check();
    const cellText = await row.locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
    return cellText.trim();
  }

  /**
   * Navigate to next page in the Merchants (right) table pagination.
   */
  async clickMerchantsNextPage(): Promise<void> {
    const paginationNext = this.merchantsContainer.locator(SELECTORS.amsPaginationNextButton);
    await paginationNext.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate to next page in the Users (left) table pagination.
   */
  async clickUsersNextPage(): Promise<void> {
    const paginationNext = this.usersContainer.locator(SELECTORS.amsPaginationNextButton);
    await paginationNext.click();
    await this.page.waitForTimeout(500);
  }

  /** Returns the current selection info text for the Users table. */
  async getUsersSelectionText(): Promise<string> {
    return this.usersSelectionInfo.innerText().catch(() => '');
  }

  /** Returns the current selection info text for the Merchants table. */
  async getMerchantsSelectionText(): Promise<string> {
    return this.merchantsSelectionInfo.innerText().catch(() => '');
  }

  /**
   * Returns texts of all visible rows in the Merchants (right) table.
   * Useful to compare page 1 vs page 2 content.
   */
  async getCurrentPageMerchants(): Promise<string[]> {
    const rows = this.merchantsContainer.locator(SELECTORS.amsRdtTableRow);
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
      if (text.trim()) texts.push(text.trim());
    }
    return texts;
  }

  /** Returns true if the merchants table has a clickable "Next Page" button. */
  async isMerchantsNextPageAvailable(): Promise<boolean> {
    const btn = this.merchantsContainer.locator(SELECTORS.amsPaginationNextButton);
    try {
      await btn.waitFor({ state: 'visible', timeout: 3_000 });
      return !(await btn.isDisabled());
    } catch {
      return false;
    }
  }

  /** Click Submit and wait. Returns true if success feedback appears. */
  async clickSubmit(): Promise<boolean> {
    await this.submitButton.click();
    try {
      await this.page.locator(SELECTORS.amsSuccessToast).first().waitFor({ state: 'visible', timeout: 8_000 });
      return true;
    } catch {
      return false;
    }
  }
}

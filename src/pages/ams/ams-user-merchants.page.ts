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
 * Submit button triggers a Bootstrap confirmation modal (.modal-footer button "Confirm").
 *
 * Key discoveries:
 *   - Both tables use .rdt_Table — scope by nth(0) / nth(1)
 *   - Pagination nav (.rdt_Pagination) is a sibling of .rdt_Table, not inside it — scope to nth(0/1) of .rdt_Pagination
 *   - Merchants table loads async after users table — waitForMerchantsPage waits for both
 *   - Submit shows a "Confirm Association" modal — must click "Confirm" in .modal-footer
 */
export class AmsUserMerchantsPage extends AmsBasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly submitButton           = this.page.locator(SELECTORS.amsAssocPageSubmit);
  readonly usersSelectionInfo     = this.page.locator(SELECTORS.amsUsersSelectionInfo);
  readonly merchantsSelectionInfo = this.page.locator(SELECTORS.amsMerchantsSelectionInfo);

  /** Scoped containers for each rdt_Table (users=0, merchants=1) */
  private get usersContainer()     { return this.page.locator(SELECTORS.amsRdtTable).nth(0); }
  private get merchantsContainer() { return this.page.locator(SELECTORS.amsRdtTable).nth(1); }

  /** Wait for both rdt tables to be visible and both to have at least one data row. */
  async waitForMerchantsPage(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible', timeout: 20_000 });
    await this.page.locator(SELECTORS.amsRdtTable).nth(1).waitFor({ state: 'visible', timeout: 10_000 });
    // Wait for both tables to load their rows (merchants loads async after users)
    await this.usersContainer.locator(SELECTORS.amsRdtTableRow).first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.merchantsContainer.locator(SELECTORS.amsRdtTableRow).first().waitFor({ state: 'visible', timeout: 15_000 });
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
   * Find and select a user in the Users table by exact username.
   * Paginates through the Users table (up to maxPages) until found.
   * Returns true if found and selected, false otherwise.
   */
  async selectUserByUsername(username: string, maxPages = 30): Promise<boolean> {
    for (let pageNum = 0; pageNum < maxPages; pageNum++) {
      const rows = this.usersContainer.locator(SELECTORS.amsRdtTableRow);
      await rows.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const cellText = await row.locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
        if (cellText.trim() === username) {
          await row.locator(SELECTORS.amsAssocRowCheckbox).first().check();
          return true;
        }
      }
      if (!(await this.isUsersNextPageAvailable())) return false;
      await this.clickUsersNextPage();
    }
    return false;
  }

  /**
   * Returns true if the users table has a clickable "Next Page" button.
   * Pagination nav (.rdt_Pagination) is a sibling of .rdt_Table — scope to nth(0).
   */
  async isUsersNextPageAvailable(): Promise<boolean> {
    const btn = this.page.locator(SELECTORS.amsRdtPagination).nth(0).locator(SELECTORS.amsPaginationNextButton);
    try {
      await btn.waitFor({ state: 'visible', timeout: 3_000 });
      return !(await btn.isDisabled());
    } catch {
      return false;
    }
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
   * Pagination nav (.rdt_Pagination) is a sibling of .rdt_Table — scope to nth(1).
   */
  async clickMerchantsNextPage(): Promise<void> {
    const paginationNext = this.page.locator(SELECTORS.amsRdtPagination).nth(1).locator(SELECTORS.amsPaginationNextButton);
    // Capture current first-row text so we can detect when it changes (page transition complete)
    const currentFirstText = await this.merchantsContainer
      .locator(SELECTORS.amsRdtTableRow).first()
      .locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
    await paginationNext.click();
    // Wait until the first row text changes — indicates new page data has rendered
    const firstCell = this.merchantsContainer
      .locator(SELECTORS.amsRdtTableRow).first()
      .locator('[class*="rdt_TableCell"]').nth(1);
    await firstCell.waitFor({ state: 'visible', timeout: 15_000 });
    // Poll until text actually changes from the old value
    await this.page.waitForFunction(
      ({ containerSel, rowSel, cellSel, oldText }: { containerSel: string; rowSel: string; cellSel: string; oldText: string }) => {
        const tables = document.querySelectorAll(containerSel);
        if (tables.length < 2) return false;
        const firstRow = tables[1].querySelector(rowSel);
        if (!firstRow) return false;
        const cells = firstRow.querySelectorAll(cellSel);
        if (cells.length < 2) return false;
        return (cells[1].textContent?.trim() ?? '') !== oldText;
      },
      { containerSel: SELECTORS.amsRdtTable, rowSel: SELECTORS.amsRdtTableRow, cellSel: '[class*="rdt_TableCell"]', oldText: currentFirstText.trim() },
      { timeout: 15_000 },
    );
  }

  /**
   * Navigate to next page in the Users (left) table pagination.
   * Pagination nav (.rdt_Pagination) is a sibling of .rdt_Table — scope to nth(0).
   */
  async clickUsersNextPage(): Promise<void> {
    const paginationNext = this.page.locator(SELECTORS.amsRdtPagination).nth(0).locator(SELECTORS.amsPaginationNextButton);
    const currentFirstText = await this.usersContainer
      .locator(SELECTORS.amsRdtTableRow).first()
      .locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
    await paginationNext.click();
    await this.usersContainer.locator(SELECTORS.amsRdtTableRow).first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.waitForFunction(
      ({ containerSel, rowSel, cellSel, oldText }: { containerSel: string; rowSel: string; cellSel: string; oldText: string }) => {
        const tables = document.querySelectorAll(containerSel);
        if (tables.length < 1) return false;
        const firstRow = tables[0].querySelector(rowSel);
        if (!firstRow) return false;
        const cells = firstRow.querySelectorAll(cellSel);
        if (cells.length < 2) return false;
        return (cells[1].textContent?.trim() ?? '') !== oldText;
      },
      { containerSel: SELECTORS.amsRdtTable, rowSel: SELECTORS.amsRdtTableRow, cellSel: '[class*="rdt_TableCell"]', oldText: currentFirstText.trim() },
      { timeout: 10_000 },
    );
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
    // Wait for at least one row to be visible before counting (handles pagination transitions)
    await rows.first().waitFor({ state: 'visible', timeout: 15_000 });
    const count = await rows.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('[class*="rdt_TableCell"]').nth(1).innerText().catch(() => '');
      if (text.trim()) texts.push(text.trim());
    }
    return texts;
  }

  /**
   * Returns true if the merchants table has a clickable "Next Page" button.
   * Pagination nav (.rdt_Pagination) is a sibling of .rdt_Table — scope to nth(1).
   */
  async isMerchantsNextPageAvailable(): Promise<boolean> {
    const btn = this.page.locator(SELECTORS.amsRdtPagination).nth(1).locator(SELECTORS.amsPaginationNextButton);
    try {
      await btn.waitFor({ state: 'visible', timeout: 3_000 });
      return !(await btn.isDisabled());
    } catch {
      return false;
    }
  }

  /** Click Submit, confirm the "Confirm Association" Bootstrap modal, wait for success toast. */
  async clickSubmit(): Promise<boolean> {
    await this.submitButton.click();
    // A Bootstrap confirmation modal appears — click "Confirm" in .modal-footer to proceed
    const confirmBtn = this.page.locator(SELECTORS.amsAssocConfirmButton);
    try {
      await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await confirmBtn.click();
    } catch {
      // No confirmation dialog — proceed to check toast directly
    }
    try {
      await this.page.locator(SELECTORS.amsSuccessToast).first().waitFor({ state: 'visible', timeout: 8_000 });
      return true;
    } catch {
      return false;
    }
  }
}

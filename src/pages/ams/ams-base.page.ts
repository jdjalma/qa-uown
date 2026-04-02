import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * AmsBasePage — base for AMS portal pages.
 *
 * The AMS users table uses react-data-table-component (.rdt_Table / .rdt_TableRow),
 * NOT native <table> elements.
 */
export class AmsBasePage extends BasePage {
  /** Main react-data-table-component table */
  readonly rdtTable = this.page.locator(SELECTORS.amsRdtTable).first();
  readonly rdtTableBody = this.page.locator(SELECTORS.amsRdtTableBody).first();

  async waitForTable(): Promise<void> {
    await this.rdtTable.waitFor({ state: 'visible', timeout: 20_000 });
  }

  async getTableRowCount(): Promise<number> {
    return this.page.locator(SELECTORS.amsRdtTableRow).count();
  }

  async clickRowByIndex(index: number): Promise<void> {
    const row = this.page.locator(SELECTORS.amsRdtTableRow).nth(index);
    await row.waitFor({ state: 'visible' });
    await row.click();
  }

  async getRowText(index: number): Promise<string> {
    return this.page.locator(SELECTORS.amsRdtTableRow).nth(index).innerText();
  }

  async isAmsLoginPage(): Promise<boolean> {
    return this.isElementPresent('input[name="loginEmail"]', 3_000);
  }
}

import { BasePage } from '../base.page.js';

export class AmsBasePage extends BasePage {
  readonly usersTable = this.page.locator('table, .users-table');
  readonly searchField = this.page.locator('#searchField, input[placeholder*="Search"]');
  readonly searchButton = this.page.locator('button:has-text("Search")');
  readonly rolesFilter = this.page.locator('[data-filter="roles"], #rolesFilter');
  readonly lockedFilter = this.page.locator('[data-filter="locked"], #lockedFilter');

  async isAmsLoginPage(): Promise<boolean> {
    return this.isElementPresent('#loginEmail, [name="email"]', 3_000);
  }

  async filterUsers(searchTerm?: string, roles?: string, locked?: string): Promise<void> {
    if (searchTerm) {
      await this.searchField.fill(searchTerm);
    }
    if (roles) {
      await this.selectReactOption('[data-filter="roles"]', roles);
    }
    if (locked) {
      await this.selectReactOption('[data-filter="locked"]', locked);
    }
    await this.clickAndWaitForSpinner(this.searchButton);
  }

  async selectFirstUser(): Promise<void> {
    await this.clickAndWaitForSpinner(this.page.locator('tbody tr:first-child').first());
  }

  async selectUserByUsername(username: string): Promise<void> {
    const row = this.page.locator(`tbody tr:has-text("${username}")`);
    await this.clickAndWaitForSpinner(row.first());
  }
}

import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/common.selectors.js';
import { sleep } from '../helpers/common.helpers.js';

export class SearchPage extends BasePage {
  // The quick search bar in the top navbar — use the specific #search-input ID
  // (confirmed via MCP snapshot: <input id="search-input" type="search" placeholder="Quick search by Lead #">)
  readonly quickSearchInput = this.page.locator('#search-input');
  // The search type dropdown toggle (e.g. "Lead #", "Email", "Name")
  readonly searchTypeToggle = this.page.locator('nav a[href="#"]').filter({ has: this.page.locator('img') }).first();
  readonly searchButton = this.page.locator(SELECTORS.searchButton);
  readonly searchTypeDropdown = this.page.locator(SELECTORS.searchTypeDropdown);
  readonly resultsTable = this.page.locator(SELECTORS.table);

  async search(term: string): Promise<void> {
    await this.ensureSearchVisible();
    await this.quickSearchInput.fill(term);
    await this.quickSearchInput.press('Enter');
    await this.waitForSpinner();
  }

  async selectFirstResult(): Promise<void> {
    // Try autocomplete link first (navbar search results as <a href="/customers/...">)
    const autocompleteLink = this.page.locator('nav a[href*="/customers/"]').first();
    const tableRow = this.page.locator(`${SELECTORS.tableRow}:first-child, #row-0`).first();

    if (await autocompleteLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await autocompleteLink.click();
    } else {
      await tableRow.click();
    }
    await this.waitForSpinner();
  }

  /**
   * Ensures the quick search input is visible.
   * If the navbar is collapsed (responsive/mobile), clicks the hamburger toggle first.
   */
  async ensureSearchVisible(): Promise<void> {
    if (await this.quickSearchInput.isVisible({ timeout: 2_000 }).catch(() => false)) return;

    // Click hamburger/navbar toggle to expand the collapsed nav
    const hamburger = this.page.locator('.navbar-toggler, button[aria-label="Toggle navigation"], nav button.btn').first();
    if (await hamburger.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await hamburger.click();
      // Wait for navbar expansion animation to complete
      await this.quickSearchInput.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }

    // Ensure search input is now visible after expansion
    await this.quickSearchInput.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Types a search term in the quick search bar, waits for autocomplete
   * results and clicks the first matching link.
   */
  async searchAndSelectFirst(term: string): Promise<void> {
    await this.ensureSearchVisible();
    await this.quickSearchInput.clear();
    await this.quickSearchInput.fill(term);

    // Wait for autocomplete dropdown to appear
    const autocompleteLink = this.page.locator('nav a[href*="/customers/"]').first();
    try {
      await autocompleteLink.waitFor({ state: 'visible', timeout: 5_000 });
      await autocompleteLink.click();
      await this.waitForSpinner();
    } catch {
      // Autocomplete did not appear — fall back to Enter + table row click
      await this.quickSearchInput.press('Enter');
      await this.waitForSpinner();

      // Click the first reference link in the table
      const tableLink = this.page.locator('a[href*="/customers/"]').first();
      if (await tableLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await tableLink.click();
        await this.waitForSpinner();
      }
    }
  }

  /**
   * Selects the search type from the quick search dropdown.
   * Types available: "Lead #", "Servicing Account #", "Phone", "Email",
   * "SSN", "Invoice #", "UUID", "Name", "Last 4 CC"
   */
  async selectSearchType(type: string): Promise<void> {
    // Click the search type toggle to open the dropdown
    const toggle = this.page.locator('nav a[href="#"]').filter({ hasText: /Lead|Servicing|Phone|Email|SSN|Invoice|UUID|Name|Last 4/i }).first();
    if (await toggle.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await toggle.click();
      // Click the option in the dropdown
      await this.page.getByRole('menuitem', { name: type, exact: true }).click();
    } else if (await this.searchTypeDropdown.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.searchTypeDropdown.click();
      await this.page.locator(`button:has-text("${type}")`).click();
    }
  }

  async applyFilters(filters: Record<string, string>): Promise<void> {
    for (const [filterName, filterValue] of Object.entries(filters)) {
      const filterControl = this.page.locator(`#${filterName}, [data-filter="${filterName}"]`);
      if (await filterControl.isVisible()) {
        await this.selectReactOption(`#${filterName}`, filterValue);
      }
    }
  }

  async getResultCount(): Promise<number> {
    const rows = this.page.locator(SELECTORS.tableRow);
    return rows.count();
  }

  /**
   * Tests multiple quick search strategies (by Lead, Account, Email, Name).
   * Mirrors UownOverviewSteps.testMerchantPortalQuickSearchMethods() from the Java project.
   */
  async testQuickSearchMethods(searchCriteria: {
    leadPk?: string;
    accountPk?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    const searchTypes: Array<{ type: string; value: string }> = [];

    if (searchCriteria.leadPk) {
      searchTypes.push({ type: 'Lead #', value: searchCriteria.leadPk });
    }
    if (searchCriteria.accountPk) {
      searchTypes.push({ type: 'Servicing Account #', value: searchCriteria.accountPk });
    }
    if (searchCriteria.email) {
      searchTypes.push({ type: 'Email', value: searchCriteria.email });
    }
    if (searchCriteria.firstName) {
      searchTypes.push({ type: 'Name', value: searchCriteria.firstName });
    }
    if (searchCriteria.lastName) {
      searchTypes.push({ type: 'Name', value: searchCriteria.lastName });
    }

    for (const { type, value } of searchTypes) {
      await this.selectSearchType(type);
      await this.searchAndSelectFirst(value);
      // Navigate back to allow next search
      await this.page.goBack();
      await this.waitForSpinner();
    }
  }
}

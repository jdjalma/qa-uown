import { BasePage } from '../base.page.js';

export class OriginationBasePage extends BasePage {
  readonly sidebarMenu = this.page.locator('.sidebar');
  readonly fundingQueueLink = this.page.locator('a:has-text("Funding"), [href*="funding"]');
  readonly overviewLink = this.page.locator('a:has-text("Overview"), [href*="overview"]');
  readonly alertsLink = this.page.locator('a:has-text("Alerts"), [href*="alerts"]');

  // Sidebar items in the Origination portal are rendered capitalized
  // ("Overview", "Funding", "Leads", ...). `BasePage.sideMenuNavigateTo` falls
  // back to `getByText(section, { exact: true })` as a last resort — which is
  // case-sensitive — so we MUST pass the section name with the same casing the
  // sidebar uses, otherwise CT-13 (and any nav from a fallback path) misses.
  async navigateToOverview(): Promise<void> {
    await this.sideMenuNavigateTo('Overview');
  }

  async navigateToFundingQueue(): Promise<void> {
    await this.sideMenuNavigateTo('Funding');
  }

  async navigateToAlerts(): Promise<void> {
    await this.sideMenuNavigateTo('Alerts');
  }

  async navigateToCustomers(): Promise<void> {
    await this.sideMenuNavigateTo('Customers');
  }

  async navigateToLeads(): Promise<void> {
    await this.sideMenuNavigateTo('Leads');
  }
}

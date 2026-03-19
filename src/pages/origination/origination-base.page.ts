import { BasePage } from '../base.page.js';

export class OriginationBasePage extends BasePage {
  readonly sidebarMenu = this.page.locator('.sidebar');
  readonly fundingQueueLink = this.page.locator('a:has-text("Funding"), [href*="funding"]');
  readonly overviewLink = this.page.locator('a:has-text("Overview"), [href*="overview"]');
  readonly alertsLink = this.page.locator('a:has-text("Alerts"), [href*="alerts"]');

  async navigateToOverview(): Promise<void> {
    await this.sideMenuNavigateTo('overview');
  }

  async navigateToFundingQueue(): Promise<void> {
    await this.sideMenuNavigateTo('funding');
  }

  async navigateToAlerts(): Promise<void> {
    await this.sideMenuNavigateTo('alerts');
  }

  async navigateToCustomers(): Promise<void> {
    await this.sideMenuNavigateTo('customers');
  }

  async navigateToLeads(): Promise<void> {
    await this.sideMenuNavigateTo('leads');
  }
}

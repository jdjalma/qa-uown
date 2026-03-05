import { ServicingBasePage } from './servicing-base.page.js';

export class ScheduledPaymentPage extends ServicingBasePage {
  readonly scheduledTable = this.page.locator('table, .scheduled-payments-table');
  readonly addScheduleButton = this.page.locator('button:has-text("Add"), button:has-text("Schedule")');

  async navigateToScheduledPayments(): Promise<void> {
    await this.topMenuNavigateTo('scheduled payments');
  }

  async getScheduledPaymentCount(): Promise<number> {
    return this.page.locator('tbody tr').count();
  }
}

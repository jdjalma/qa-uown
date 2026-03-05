import { expect } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';

export class LogPage extends ServicingBasePage {
  readonly logTable = this.page.locator('table, .log-table');
  readonly logEntries = this.page.locator('tbody tr');

  async navigateToLogs(): Promise<void> {
    await this.sideMenuNavigateTo('log');
  }

  async getLogEntryCount(): Promise<number> {
    return this.logEntries.count();
  }

  async verifyLogContains(text: string): Promise<void> {
    const entry = this.page.locator(`tbody tr:has-text("${text}")`);
    await expect(entry.first()).toBeVisible();
  }
}

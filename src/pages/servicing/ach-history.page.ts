import { expect } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';

export class AchHistoryPage extends ServicingBasePage {
  readonly achTable = this.page.locator('table, .ach-history-table');
  readonly sweepStatus = this.page.locator('[data-field="sweepStatus"]');

  async navigateToAchHistory(): Promise<void> {
    await this.topMenuNavigateTo('ach history');
  }

  async getAchTransactionCount(): Promise<number> {
    return this.page.locator('tbody tr').count();
  }

  async verifyAchEntryExists(amount: string): Promise<void> {
    // ACH History table may use React Data Table (div-based) or standard HTML table
    const row = this.page.locator(`.rdt_TableRow, tbody tr`).filter({ hasText: amount });
    await expect(row.first()).toBeVisible({ timeout: 10_000 });
  }
}

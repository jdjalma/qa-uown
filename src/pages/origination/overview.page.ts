import { expect } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';
import { findFirstMatchingRow, goToNextPage } from '../../helpers/table.helpers.js';

export class OverviewPage extends OriginationBasePage {
  readonly dashboardCards = this.page.locator('.dashboard-card, .overview-card');
  readonly totalApplications = this.page.locator('[data-metric="totalApplications"]');
  readonly approvedCount = this.page.locator('[data-metric="approved"]');
  readonly pendingCount = this.page.locator('[data-metric="pending"]');

  async getDashboardMetric(metricName: string): Promise<string> {
    const metric = this.page.locator(`[data-metric="${metricName}"]`);
    return (await this.getTextContent(metric)) || '0';
  }

  async verifyDashboardLoaded(): Promise<void> {
    await this.waitForSpinner();
    await expect(this.dashboardCards.first()).toBeVisible();
  }

  /**
   * Navigates to overview page and searches the table for a row matching
   * the given Reference # (leadPk). Returns the row data including "Approval Amt".
   * Paginates if needed.
   * Mirrors CommonSteps.getTableDataForIdOnly() from the Java project.
   */
  async getRowDataByReferenceId(leadPk: string): Promise<Record<string, string> | null> {
    await this.waitForSpinner();

    // Wait for the table to render with at least one row (overview loads table after dashboard cards)
    const tableRow = this.page.locator(SELECTORS.tableRow).first();
    await tableRow.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
    await this.waitForSpinner();

    // Search across all pages
    for (let pageNum = 1; pageNum <= 20; pageNum++) {
      const row = await findFirstMatchingRow(this.page, { 'Reference #': leadPk });
      if (row) return row;

      const hasNext = await goToNextPage(this.page);
      if (!hasNext) break;
    }
    return null;
  }
}

import { OriginationBasePage } from './origination-base.page.js';

export class MetricsCalculatorPage extends OriginationBasePage {
  readonly calculatorForm = this.page.locator('.calculator-form, #metricsCalculator');
  readonly calculateButton = this.page.locator('button:has-text("Calculate")');
  readonly resultSection = this.page.locator('.result-section, .calculation-results');

  async calculateMetrics(inputs: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(inputs)) {
      await this.page.locator(`[name="${field}"], #${field}`).fill(value);
    }
    await this.clickAndWaitForSpinner(this.calculateButton);
  }

  async getResultValue(metricName: string): Promise<string> {
    const metric = this.resultSection.locator(`[data-metric="${metricName}"]`);
    return this.getTextContent(metric);
  }
}

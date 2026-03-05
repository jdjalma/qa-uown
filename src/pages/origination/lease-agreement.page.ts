import { expect } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';

export class LeaseAgreementPage extends OriginationBasePage {
  readonly contractSection = this.page.locator('.contract-section, #contract');
  readonly signButton = this.page.locator('button:has-text("Sign"), button:has-text("E-Sign")');
  readonly proceedToSignature = this.page.locator('button:has-text("Proceed to Signature")');
  readonly invoiceTable = this.page.locator('.invoice-table, table');

  async proceedToSign(): Promise<void> {
    await this.clickAndWaitForSpinner(this.proceedToSignature);
  }

  async signContract(): Promise<void> {
    await this.clickAndWaitForSpinner(this.signButton);
  }

  async getInvoiceCount(): Promise<number> {
    const rows = this.invoiceTable.locator('tbody tr');
    return rows.count();
  }

  async verifyContractCreated(): Promise<void> {
    await expect(this.contractSection).toBeVisible();
  }
}

import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/common.selectors.js';

export class MerchantPage extends BasePage {
  readonly merchantName = this.page.locator('[data-field="merchantName"], .merchant-name');
  readonly merchantStatus = this.page.locator('[data-field="merchantStatus"], .merchant-status');
  readonly programsSection = this.page.locator('.programs-section, #programs');
  readonly editButton = this.page.locator('button:has-text("Edit"), .edit-button');

  async getMerchantName(): Promise<string> {
    return this.getTextContent(this.merchantName);
  }

  async getMerchantStatus(): Promise<string> {
    return this.getTextContent(this.merchantStatus);
  }

  async navigateToPrograms(): Promise<void> {
    await this.sideMenuNavigateTo('programs');
  }

  /**
   * Toggles the "Offer Insurance" checkbox on the merchant configuration page.
   * Uses the checkbox ID from the portal HTML: input#checkbox-offerInsurance.
   */
  async setOfferInsurance(enabled: boolean): Promise<void> {
    const checkbox = this.page.locator(SELECTORS.merchantOfferInsuranceCheckbox);
    await checkbox.waitFor({ state: 'visible', timeout: 10_000 });
    if (enabled) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
    console.log(`[Merchant] Offer Insurance set to: ${enabled}`);
  }

  /**
   * Clicks the SAVE button on the merchant config page and returns the toast text.
   */
  async saveMerchantConfig(): Promise<string> {
    const saveBtn = this.page.locator(SELECTORS.saveButton);
    await this.clickAndWaitForSpinner(saveBtn);

    try {
      return await this.captureAndDismissToast(5_000);
    } catch {
      return '';
    }
  }
}

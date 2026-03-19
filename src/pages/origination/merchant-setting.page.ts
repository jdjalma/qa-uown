import { type Locator, expect } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for Origination → Merchant Settings page (/merchantSetting).
 * Handles bulk update of merchant fields including Dealer Discount, Rebate Type, Rebate Override.
 *
 * Dealer Rebate Type uses react-select with custom class prefix "filter__".
 * The container div has id="dealerRebateType" (set by the label's "for" attribute).
 * The merchant table requires a search/filter to populate rows.
 */
export class MerchantSettingPage extends OriginationBasePage {
  readonly dealerDiscountInput: Locator = this.page.locator(SELECTORS.msDealerDiscountInput);
  /** react-select control container for Dealer Rebate Type */
  readonly dealerRebateTypeControl: Locator = this.page.locator('#dealerRebateType div[class*="filter__control"]');
  readonly dealerRebateTypeSelect: Locator = this.page.locator(SELECTORS.msDealerRebateTypeSelect);
  readonly dealerRebateOverrideInput: Locator = this.page.locator(SELECTORS.msDealerRebateOverrideInput);
  readonly peakCampaignIdInput: Locator = this.page.locator(SELECTORS.msPeakCampaignIdInput);
  readonly offPeakCampaignIdInput: Locator = this.page.locator(SELECTORS.msOffPeakCampaignIdInput);
  readonly peakCampaignIdLabel: Locator = this.page.locator(SELECTORS.msPeakCampaignIdLabel);
  readonly offPeakCampaignIdLabel: Locator = this.page.locator(SELECTORS.msOffPeakCampaignIdLabel);
  readonly uwPipelineInput: Locator = this.page.locator(SELECTORS.msUwPipelineInput);
  readonly fraudThresholdInput: Locator = this.page.locator(SELECTORS.msFraudThresholdInput);
  readonly maxApprovalAmountInput: Locator = this.page.locator(SELECTORS.msMaxApprovalAmountInput);
  readonly gdsDataToggle: Locator = this.page.locator(SELECTORS.msGdsDataToggle);
  readonly saveButton: Locator = this.page.locator(SELECTORS.saveButton).first();
  readonly cancelButton: Locator = this.page.locator("button:has-text('CANCEL')").first();
  readonly bulkConfirmButton: Locator = this.page.locator(SELECTORS.msBulkConfirmButton);
  readonly filtersButton: Locator = this.page.locator(SELECTORS.filtersButton);
  readonly merchantTable: Locator = this.page.locator("table, [role='table'], .rdt_Table");

  async navigateToMerchantSettings(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchantSetting`, { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
    // Dismiss any error toasts (e.g. "Unable to load program groups") — wait up to 2 s for them to appear
    await this.page.locator('.Toastify__close-button').first().waitFor({ state: 'visible', timeout: 2_000 }).catch(() => {});
    const closeButtons = this.page.locator('.Toastify__close-button');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click().catch(() => {});
    }
  }

  async loadMerchants(): Promise<void> {
    // Click Filters button to expand, then search for merchants
    const filtersBtn = this.filtersButton;
    if (await filtersBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await filtersBtn.click();

      // Wait for filter panel to expand — look for Apply/Search button to appear
      const applyBtn = this.page.locator("button:has-text('Apply'), button:has-text('Search'), button:has-text('APPLY')").first();
      const applyVisible = await applyBtn.waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
      if (applyVisible) {
        await applyBtn.click();
        await this.waitForSpinner();
      }
    }

    // Wait for table rows to appear
    await this.page.locator("div[role='row'], tr, .rdt_TableRow").first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {
        console.log('[MerchantSettingPage] WARN: No table rows appeared after filter');
      });
  }

  async selectMerchantRow(index: number): Promise<void> {
    // The table uses custom checkboxes — click the checkbox cell in the row
    const rows = this.page.locator("div[role='row']:not([role='columnheader']), .rdt_TableRow, table tbody tr");
    const row = rows.nth(index);
    await row.waitFor({ state: 'visible', timeout: 15_000 });

    // Try native checkbox first, then custom checkbox icon
    const nativeCheckbox = row.locator("input[type='checkbox']");
    if (await nativeCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await nativeCheckbox.check({ force: true });
    } else {
      // Click the first cell (checkbox column) or any checkbox-like element
      const checkboxCell = row.locator("div[role='cell']:first-child, td:first-child, div:first-child").first();
      await checkboxCell.click();
    }
    console.log(`[MerchantSettingPage] Selected merchant row ${index}`);
  }

  async selectMerchantRows(indices: number[]): Promise<void> {
    for (const idx of indices) {
      await this.selectMerchantRow(idx);
    }
  }

  async fillDealerDiscount(value: string): Promise<void> {
    await this.dealerDiscountInput.scrollIntoViewIfNeeded();
    await this.dealerDiscountInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.dealerDiscountInput.clear();
    await this.dealerDiscountInput.fill(value);
    console.log(`[MerchantSettingPage] Dealer Discount set to: ${value}`);
  }

  async getDealerDiscountValue(): Promise<string> {
    await this.dealerDiscountInput.waitFor({ state: 'visible', timeout: 10_000 });
    return this.dealerDiscountInput.inputValue();
  }

  async selectDealerRebateType(type: string): Promise<void> {
    // Dealer Rebate Type is a native <select> element rendered by InputField type="select"
    await this.dealerRebateTypeSelect.scrollIntoViewIfNeeded();
    await this.dealerRebateTypeSelect.waitFor({ state: 'visible', timeout: 10_000 });
    await this.dealerRebateTypeSelect.selectOption(type);
    console.log(`[MerchantSettingPage] Dealer Rebate Type set to: ${type}`);
  }

  async fillDealerRebateOverride(value: string): Promise<void> {
    await this.dealerRebateOverrideInput.scrollIntoViewIfNeeded();
    await this.dealerRebateOverrideInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.dealerRebateOverrideInput.clear();
    await this.dealerRebateOverrideInput.fill(value);
    console.log(`[MerchantSettingPage] Dealer Rebate Override set to: ${value}`);
  }

  async submitSettings(): Promise<string> {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.clickAndWaitForSpinner(this.saveButton);
    try {
      return await this.captureAndDismissToast(10_000);
    } catch {
      return '';
    }
  }

  async confirmBulkUpdate(): Promise<void> {
    if (await this.bulkConfirmButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.bulkConfirmButton.click();
      await this.waitForSpinner();
    }
  }

  async isDealerDiscountVisible(): Promise<boolean> {
    return this.dealerDiscountInput.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async isDealerRebateTypeVisible(): Promise<boolean> {
    return this.dealerRebateTypeSelect.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async isDealerRebateOverrideVisible(): Promise<boolean> {
    return this.dealerRebateOverrideInput.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async getDealerRebateTypeOptions(): Promise<string[]> {
    await this.dealerRebateTypeSelect.scrollIntoViewIfNeeded();
    await this.dealerRebateTypeSelect.waitFor({ state: 'visible', timeout: 10_000 });
    // Read all <option> text values from the native select
    return this.dealerRebateTypeSelect.locator('option').allTextContents();
  }

  async getPeakCampaignIdValue(): Promise<string> {
    await this.peakCampaignIdInput.waitFor({ state: 'visible', timeout: 10_000 });
    return this.peakCampaignIdInput.inputValue();
  }

  async getOffPeakCampaignIdValue(): Promise<string> {
    await this.offPeakCampaignIdInput.waitFor({ state: 'visible', timeout: 10_000 });
    return this.offPeakCampaignIdInput.inputValue();
  }

  async getPeakCampaignIdLabelText(): Promise<string> {
    await this.peakCampaignIdLabel.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.peakCampaignIdLabel.textContent()) ?? '';
  }

  async getOffPeakCampaignIdLabelText(): Promise<string> {
    await this.offPeakCampaignIdLabel.waitFor({ state: 'visible', timeout: 10_000 });
    return (await this.offPeakCampaignIdLabel.textContent()) ?? '';
  }

  async expandGdsDataSection(): Promise<void> {
    // The GDS Data section may be collapsed. Click toggle to expand if fields are not visible.
    const uwField = this.uwPipelineInput;
    const isVisible = await uwField.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!isVisible) {
      await this.gdsDataToggle.click();
      await uwField.waitFor({ state: 'visible', timeout: 10_000 });
    }
    console.log('[MerchantSettingPage] GDS Data section expanded');
  }

  async fillUwPipeline(value: string): Promise<void> {
    await this.expandGdsDataSection();
    await this.uwPipelineInput.scrollIntoViewIfNeeded();
    await this.uwPipelineInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.uwPipelineInput.clear();
    await this.uwPipelineInput.fill(value);
    console.log(`[MerchantSettingPage] UW Pipeline set to: ${value}`);
  }

  async fillFraudThreshold(value: string): Promise<void> {
    await this.expandGdsDataSection();
    await this.fraudThresholdInput.scrollIntoViewIfNeeded();
    await this.fraudThresholdInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.fraudThresholdInput.clear();
    await this.fraudThresholdInput.fill(value);
    console.log(`[MerchantSettingPage] Fraud Threshold set to: ${value}`);
  }

  async fillMaxApprovalAmount(value: string): Promise<void> {
    await this.expandGdsDataSection();
    await this.maxApprovalAmountInput.scrollIntoViewIfNeeded();
    await this.maxApprovalAmountInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.maxApprovalAmountInput.clear();
    await this.maxApprovalAmountInput.fill(value);
    console.log(`[MerchantSettingPage] Max Approval Amount set to: ${value}`);
  }

  async getUwPipelineValue(): Promise<string> {
    await this.expandGdsDataSection();
    await this.uwPipelineInput.waitFor({ state: 'visible', timeout: 10_000 });
    return this.uwPipelineInput.inputValue();
  }

  async getFraudThresholdValue(): Promise<string> {
    await this.expandGdsDataSection();
    await this.fraudThresholdInput.waitFor({ state: 'visible', timeout: 10_000 });
    return this.fraudThresholdInput.inputValue();
  }

  async getMaxApprovalAmountValue(): Promise<string> {
    await this.expandGdsDataSection();
    await this.maxApprovalAmountInput.waitFor({ state: 'visible', timeout: 10_000 });
    return this.maxApprovalAmountInput.inputValue();
  }

  async isGdsDataSectionVisible(): Promise<boolean> {
    return this.gdsDataToggle.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async isUwPipelineVisible(): Promise<boolean> {
    return this.uwPipelineInput.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async isFraudThresholdVisible(): Promise<boolean> {
    return this.fraudThresholdInput.isVisible({ timeout: 5_000 }).catch(() => false);
  }

  async isMaxApprovalAmountVisible(): Promise<boolean> {
    return this.maxApprovalAmountInput.isVisible({ timeout: 5_000 }).catch(() => false);
  }
}

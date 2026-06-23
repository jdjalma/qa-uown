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
  // EPO 5% / 10% triple-checkbox controls (DOM-first verified qa2 2026-06-16).
  // The True/False inputs sit inside a Bootstrap `.collapse` opened by the
  // caret-down toggle — NOT by checking `-main`.
  readonly epo5MainCheckbox: Locator = this.page.locator(SELECTORS.msEpo5MainCheckbox);
  readonly epo5CaretToggle: Locator = this.page.locator(SELECTORS.msEpo5CaretToggle).first();
  readonly epo5TrueCheckbox: Locator = this.page.locator(SELECTORS.msEpo5TrueCheckbox);
  readonly epo5FalseCheckbox: Locator = this.page.locator(SELECTORS.msEpo5FalseCheckbox);
  readonly epo10MainCheckbox: Locator = this.page.locator(SELECTORS.msEpo10MainCheckbox);
  readonly epo10CaretToggle: Locator = this.page.locator(SELECTORS.msEpo10CaretToggle).first();
  readonly epo10TrueCheckbox: Locator = this.page.locator(SELECTORS.msEpo10TrueCheckbox);
  readonly epo10FalseCheckbox: Locator = this.page.locator(SELECTORS.msEpo10FalseCheckbox);
  readonly gdsSaveButton: Locator = this.page.locator(SELECTORS.msGdsSaveButton).first();
  readonly saveButton: Locator = this.page.locator(SELECTORS.saveButton).first();
  readonly cancelButton: Locator = this.page.locator("button:has-text('CANCEL')").first();
  readonly bulkConfirmButton: Locator = this.page.locator(SELECTORS.msBulkConfirmButton);
  readonly filtersButton: Locator = this.page.locator(SELECTORS.filtersButton);
  readonly merchantTable: Locator = this.page.locator("table, [role='table'], .rdt_Table");
  // "Search table" box inside the Filters panel — narrows the merchant table to a code/name.
  // DOM-first verified qa2 2026-06-16: default table renders ~20 rows; the target
  // merchant must be typed here + filter applied before its row exists in the DOM.
  readonly merchantSearchTableInput: Locator = this.page.locator(SELECTORS.msMerchantSearchTableInput);
  readonly merchantFilterSearchButton: Locator = this.page.locator(SELECTORS.msMerchantFilterSearchButton).first();

  async navigateToMerchantSettings(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchantSetting`, { waitUntil: 'domcontentloaded' });
    // DOM-first readiness anchor (NOT a timeout bump — Rule #15). The stg Origination
    // SPA keeps background connections open, so `waitForPageLoad()`'s
    // `waitForLoadState('networkidle')` never resolves on the 2nd+ navigation within a
    // serial suite (TC-03b+ timed out deterministically at base.page.ts:27). The
    // shared `waitForPageLoad()` is intentionally NOT changed (other page objects rely
    // on it); instead wait for the concrete `/merchantSetting` readiness signal — the
    // "Search table" filter box — which a login-probe confirmed is the visible anchor.
    await this.waitForSpinner();
    // The Filters button is the unconditional structural signal that the SPA route
    // mounted; the "Search table" box is inside the Filters panel. Wait on the box
    // (default-expanded on stg), but if it is collapsed, expand once so the anchor is
    // robust — never re-introduce a deterministic timeout if the panel defaults closed.
    const searchVisible = await this.merchantSearchTableInput
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    if (!searchVisible && await this.filtersButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await this.filtersButton.click();
    }
    await this.merchantSearchTableInput.waitFor({ state: 'visible', timeout: 30_000 });
    // Dismiss any error toasts (e.g. "Unable to load program groups") — wait up to 2 s for them to appear
    await this.page.locator('.Toastify__close-button').first().waitFor({ state: 'visible', timeout: 2_000 }).catch(() => {});
    const closeButtons = this.page.locator('.Toastify__close-button');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click().catch(() => {});
    }
  }

  /**
   * Expands the Filters panel (if collapsed) and waits for the merchant table to render.
   *
   * NOTE (DOM-first qa2 2026-06-16): the default table shows only ~20 rows.
   * Clicking the filter "Search" with an empty box returns that same default page — it does
   * NOT load every merchant. To act on a specific merchant (e.g. terraceFinance OL90202-0001,
   * not in the default page) pass `filterText`, or call `selectMerchantRowByText`, which filters
   * via the "Search table" box first. Calling `loadMerchants()` with no arg only readies the panel.
   */
  async loadMerchants(filterText?: string): Promise<void> {
    // The Filters panel may already be expanded (the "Search table" box visible) — only click
    // the Filters toggle if the search box is not yet present.
    const searchVisible = await this.merchantSearchTableInput
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
    if (!searchVisible) {
      const filtersBtn = this.filtersButton;
      if (await filtersBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await filtersBtn.click();
        await this.merchantSearchTableInput
          .waitFor({ state: 'visible', timeout: 5_000 })
          .catch(() => console.log('[MerchantSettingPage] WARN: Search table box did not appear after expanding Filters'));
      }
    }

    if (filterText) {
      await this.filterMerchantTable(filterText);
    }

    // Wait for table rows to appear (the default page; filtered set if filterText given).
    await this.page.locator("div[role='row'], tr, .rdt_TableRow").first()
      .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {
        console.log('[MerchantSettingPage] WARN: No table rows appeared');
      });
  }

  /**
   * Types `code` into the Filters panel "Search table" box and applies the filter so the
   * matching merchant row is loaded into the (otherwise ~20-row) table. Idempotent: clears
   * any prior value first. Without this, a merchant not in the default page (e.g.
   * terraceFinance OL90202-0001) is never in the DOM and row selection times out.
   */
  async filterMerchantTable(code: string): Promise<void> {
    await this.merchantSearchTableInput.waitFor({ state: 'visible', timeout: 10_000 });
    await this.merchantSearchTableInput.fill('');
    await this.merchantSearchTableInput.fill(code);
    // Apply: prefer the filter-panel Search button; fall back to Enter (live filter).
    if (await this.merchantFilterSearchButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.merchantFilterSearchButton.click();
    } else {
      await this.merchantSearchTableInput.press('Enter');
    }
    await this.waitForSpinner();
    console.log(`[MerchantSettingPage] Filtered merchant table by "${code}"`);
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

  // ── Merchant row selection by text ────────────────────────────────────
  //
  // The index-based `selectMerchantRow` is fragile when the filtered result
  // contains a clone (e.g. `OL90202-0001` + `OT90202-0001_clone`). Select the
  // exact row by its visible refCode/merchant-code text instead.

  /**
   * Checks the row whose visible text contains `rowText` (e.g. 'OL90202-0001').
   * Uses the row's native checkbox; falls back to the first cell if absent.
   */
  async selectMerchantRowByText(rowText: string): Promise<void> {
    const row = this.page.locator(SELECTORS.msMerchantRowByText(rowText)).first();
    // The default merchant table renders only ~20 rows; the target may not be among them
    // (e.g. terraceFinance OL90202-0001 is absent by default). Filter via the
    // "Search table" box first if the row is not already present.
    const alreadyVisible = await row.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!alreadyVisible) {
      await this.filterMerchantTable(rowText);
    }
    await row.waitFor({ state: 'visible', timeout: 15_000 });
    const nativeCheckbox = row.locator("input[type='checkbox']").first();
    if (await nativeCheckbox.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await nativeCheckbox.check({ force: true });
    } else {
      await row.locator("div[role='cell']:first-child, td:first-child").first().click();
    }
    console.log(`[MerchantSettingPage] Selected merchant row matching "${rowText}"`);
  }

  // ── EPO 5% / EPO 10% triple-checkbox bulk controls ────────────────────
  //
  // DOM-first verified (qa2 2026-06-16). Each EPO field is:
  //   #epoN-main   : visible enable checkbox ("include this field in the update")
  //   svg.fa-caret-down inside #toggler:has(#epoN-main) : opens the value dropdown
  //   #epoN        : value=true  checkbox — inside a `.collapse` (display:none)
  //   #epoN-false  : value=false checkbox — inside the same `.collapse`
  // The True/False inputs are NOT revealed by checking `-main`; they only become
  // visible after the caret toggle expands the Bootstrap `.collapse`. Checking
  // `-main` alone auto-flips the value to `true` but never opens the dropdown,
  // so the old code's `check({force:true})` hit an invisible input → timeout.
  // Fix: enable -main, click the caret to expand, then check the
  // visible True/False input with NO force.
  private async setEpoTriple(
    field: 'epo5' | 'epo10',
    value: boolean,
  ): Promise<void> {
    await this.expandGdsDataSection();
    const main = field === 'epo5' ? this.epo5MainCheckbox : this.epo10MainCheckbox;
    const caret = field === 'epo5' ? this.epo5CaretToggle : this.epo10CaretToggle;
    const trueBox = field === 'epo5' ? this.epo5TrueCheckbox : this.epo10TrueCheckbox;
    const falseBox = field === 'epo5' ? this.epo5FalseCheckbox : this.epo10FalseCheckbox;
    const target = value ? trueBox : falseBox;

    await main.scrollIntoViewIfNeeded();
    await main.waitFor({ state: 'visible', timeout: 10_000 });
    if (!(await main.isChecked())) {
      await main.check();
    }

    // Open the value dropdown if it is still collapsed (the True/False inputs are
    // hidden inside a Bootstrap `.collapse`). Idempotent: only click when collapsed.
    if (!(await target.isVisible({ timeout: 1_000 }).catch(() => false))) {
      await caret.scrollIntoViewIfNeeded();
      await caret.click();
    }

    // Now the input is genuinely visible/interactive — check WITHOUT force.
    await target.waitFor({ state: 'visible', timeout: 10_000 });
    if (!(await target.isChecked())) {
      await target.check();
    }
    console.log(`[MerchantSettingPage] ${field} bulk-set to ${value}`);
  }

  async setEpo5(value: boolean): Promise<void> {
    await this.setEpoTriple('epo5', value);
  }

  async setEpo10(value: boolean): Promise<void> {
    await this.setEpoTriple('epo10', value);
  }

  /**
   * Clicks the GDS-section SAVE (waits for it to become enabled — it is
   * disabled until the form is dirty) and confirms the bulk-update modal.
   * Returns the success toast text (empty string if none captured).
   */
  async saveGdsSettings(): Promise<string> {
    await this.gdsSaveButton.scrollIntoViewIfNeeded();
    await expect(this.gdsSaveButton).toBeEnabled({ timeout: 10_000 });
    await this.clickAndWaitForSpinner(this.gdsSaveButton);
    await this.confirmBulkUpdate();
    try {
      return await this.captureAndDismissToast(10_000);
    } catch {
      return '';
    }
  }
}

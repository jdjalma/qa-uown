import { type Page, type Locator } from '@playwright/test';
import { OriginationBasePage } from './origination-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Page object for Origination -> Merchant Edit page (/merchant/{refMerchantCode}).
 * Handles field presence/absence checks and mobile number field interactions.
 *
 * The form uses @uownleasing/common-ui InputField components which render
 * <label> + <input name="..."> pairs within titled sections.
 */
export class MerchantEditPage extends OriginationBasePage {
  readonly saveButton: Locator = this.page.locator(SELECTORS.saveButton).first();

  constructor(page: Page) {
    super(page);
  }

  // --- Navigation ---

  async navigateToMerchantEdit(originationUrl: string, refMerchantCode: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchant/${refMerchantCode}`, {
      waitUntil: 'domcontentloaded',
    });
    await this.waitForPageLoad();
  }

  // --- Field Visibility ---

  /**
   * Checks if a label with the given text is visible on the page.
   * Uses semantic locator (getByText) scoped to label elements.
   */
  async isFieldVisible(fieldName: string): Promise<boolean> {
    const label = this.page.locator('label').filter({ hasText: fieldName });
    return label.first().isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /**
   * Checks that a label with the given text is NOT present on the page.
   * Waits briefly to confirm the element does not appear.
   */
  async isFieldAbsent(fieldName: string): Promise<boolean> {
    const label = this.page.locator('label').filter({ hasText: fieldName });
    const count = await label.count();
    if (count === 0) return true;
    const visible = await label.first().isVisible({ timeout: 2_000 }).catch(() => false);
    return !visible;
  }

  // --- Section Labels ---

  /**
   * Returns all label texts within a section identified by its heading text.
   * Finds the section heading, then collects labels from the nearest parent container.
   */
  async getFieldLabels(sectionTitle: string): Promise<string[]> {
    await this.waitForSpinner();

    // Find the section heading element
    const sectionHeading = this.page
      .locator('h1, h2, h3, h4, h5, h6, .section-title, legend, [class*="title"], [class*="header"]')
      .filter({ hasText: sectionTitle })
      .first();

    await sectionHeading.waitFor({ state: 'visible', timeout: 10_000 });

    // Get the parent section container and extract all label texts
    const sectionContainer = sectionHeading.locator('xpath=ancestor::div[contains(@class,"card") or contains(@class,"section") or contains(@class,"col") or contains(@class,"row") or position()<=3]').last();

    const labels = sectionContainer.locator('label');
    const count = await labels.count();
    const labelTexts: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = (await labels.nth(i).textContent())?.trim() || '';
      if (text) {
        labelTexts.push(text);
      }
    }

    return labelTexts;
  }

  // --- Mobile Number Fields ---

  /**
   * Returns the locator for a mobile number input by its Formik field name.
   */
  private getMobileInput(fieldName: 'contactMobile' | 'alternateContactMobile'): Locator {
    return this.page.locator(`input[name="${fieldName}"]`);
  }

  /**
   * Fills the mobile number field identified by Formik name.
   */
  async fillMobileNumber(
    fieldName: 'contactMobile' | 'alternateContactMobile',
    value: string,
  ): Promise<void> {
    const input = this.getMobileInput(fieldName);
    await this.waitForSpinner();
    await input.scrollIntoViewIfNeeded();
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    await input.clear();
    await input.fill(value);
  }

  /**
   * Gets the current value of the mobile number field.
   */
  async getMobileNumberValue(
    fieldName: 'contactMobile' | 'alternateContactMobile',
  ): Promise<string> {
    const input = this.getMobileInput(fieldName);
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    return input.inputValue();
  }

  /**
   * Returns the maxLength attribute of the mobile number field, or null if not set.
   */
  async getMobileNumberMaxLength(
    fieldName: 'contactMobile' | 'alternateContactMobile',
  ): Promise<string | null> {
    const input = this.getMobileInput(fieldName);
    await input.waitFor({ state: 'visible', timeout: 10_000 });
    return input.getAttribute('maxLength');
  }

  // --- Save ---

  /**
   * Clicks the SAVE button, waits for the spinner, and returns the toast message text.
   */
  async saveMerchant(): Promise<string> {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.clickAndWaitForSpinner(this.saveButton);
    try {
      return await this.captureAndDismissToast(10_000);
    } catch {
      return '';
    }
  }

  // --- Merchant Add (Task #1262) ---

  /**
   * Navigate to the Add Merchant form. The canonical production route is
   * `/merchant/new` — the frontend uses `[refMerchantCode].tsx` with
   * `refMerchantCode === 'new'` for creation mode. Historically the tests
   * also saw `/merchant/addMerchant` behave equivalently (falls through to
   * creation when the lookup for a merchant with that ref code fails), and
   * is retained as a secondary fallback if the `/new` route regresses.
   */
  async navigateToAddMerchant(originationUrl: string): Promise<void> {
    await this.page.goto(`${originationUrl}merchant/new`, {
      waitUntil: 'domcontentloaded',
    });
    await this.waitForPageLoad();
  }

  /**
   * Fills text inputs and react-select fields on the merchant add/edit form.
   * Only fields passed in `data` are touched — everything else is left untouched.
   *
   * All "select" fields in this form render as react-select (div-based with
   * `css-*` classes — NOT native <select>). Each wrapper has `id={fieldName}`
   * so we open via `#name` and pick the option by `getByRole('option', {name})`.
   */
  async fillMerchantForm(data: {
    refMerchantCode?: string;
    merchantName?: string;
    locationName?: string;
    legalName?: string;
    peakCampaignId?: string | number;
    offPeakCampaignId?: string | number;
    dealerDiscount?: string | number;
    dealerRebate?: string | number;
    dealerRebateType?: string;
    merchantAddress?: string;
    merchantCity?: string;
    merchantState?: string;
    merchantZipCode?: string;
    clientType?: string;
    integrationType?: string;
    platformFee?: string | number;
    platFormFeeType?: string;
    defaultLoanAmount?: string | number;
    approvalAmountIncrease?: string | number;
    buyoutFee?: string | number;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<void> {
    await this.waitForSpinner();

    const fillInput = async (selector: string, value: string | number): Promise<void> => {
      const input = this.page.locator(selector).first();
      await input.waitFor({ state: 'visible', timeout: 10_000 });
      await input.scrollIntoViewIfNeeded();
      await input.clear();
      await input.fill(String(value));
    };

    const fillByName = async (name: string, value: string | number): Promise<void> => {
      await fillInput(`input[name='${name}']`, value);
    };

    if (data.refMerchantCode !== undefined) await fillInput(SELECTORS.merchantRefCodeInput, data.refMerchantCode);
    if (data.merchantName !== undefined) await fillInput(SELECTORS.merchantNameInput, data.merchantName);
    if (data.locationName !== undefined) await fillInput(SELECTORS.merchantLocationNameInput, data.locationName);
    if (data.legalName !== undefined) await fillInput(SELECTORS.merchantLegalNameInput, data.legalName);

    if (data.peakCampaignId !== undefined) await fillByName('peakCampaignId', data.peakCampaignId);
    if (data.offPeakCampaignId !== undefined) await fillByName('offPeakCampaignId', data.offPeakCampaignId);
    if (data.dealerDiscount !== undefined) await fillByName('dealerDiscount', data.dealerDiscount);
    if (data.dealerRebate !== undefined) await fillByName('dealerRebate', data.dealerRebate);
    if (data.dealerRebateType !== undefined) await this.pickReactSelectOption('dealerRebateType', data.dealerRebateType);

    if (data.merchantAddress !== undefined) await fillByName('merchantAddress', data.merchantAddress);
    if (data.merchantCity !== undefined) await fillByName('merchantCity', data.merchantCity);
    if (data.merchantState !== undefined) await this.pickReactSelectOption('merchantState', data.merchantState);
    if (data.merchantZipCode !== undefined) await fillByName('merchantZipCode', data.merchantZipCode);

    if (data.clientType !== undefined) await this.pickReactSelectOption('clientType', data.clientType);
    if (data.integrationType !== undefined) await this.pickReactSelectOption('integrationType', data.integrationType);

    if (data.platformFee !== undefined) await fillByName('platformFee', data.platformFee);
    if (data.platFormFeeType !== undefined) await this.pickReactSelectOption('platFormFeeType', data.platFormFeeType);
    if (data.defaultLoanAmount !== undefined) await fillByName('defaultLoanAmount', data.defaultLoanAmount);
    if (data.approvalAmountIncrease !== undefined) await fillByName('approvalAmountIncrease', data.approvalAmountIncrease);
    if (data.buyoutFee !== undefined) await fillByName('buyoutFee', data.buyoutFee);

    if (data.contactName !== undefined) await fillByName('contactName', data.contactName);
    if (data.contactEmail !== undefined) await fillByName('contactEmail', data.contactEmail);
    if (data.contactPhone !== undefined) await fillByName('contactPhone', data.contactPhone);
  }

  /**
   * Opens a react-select (InputField type='select') identified by wrapper id
   * and picks the option whose visible text matches `value` (case-insensitive
   * exact). Works for both `filter__*` themed and default `css-*` react-selects
   * because the option union includes both class patterns. Also works with the
   * native browser-select fallback (rarely used on this form).
   *
   * If `value` is empty or no option matches, picks the first available option
   * so dynamically-resolved presets (e.g. clientType depending on env) still
   * satisfy the Yup required validation without a hard-coded assumption.
   */
  private async pickReactSelectOption(fieldId: string, value: string): Promise<void> {
    const container = this.page.locator(`#${fieldId}`).first();
    await container.scrollIntoViewIfNeeded();
    await container.waitFor({ state: 'visible', timeout: 10_000 });
    await container.click();

    // Option union: react-select "filter__option" theme OR default "css-*"
    // "-option" class. Exclude placeholder, single-value and no-options nodes.
    const optionsUnion =
      '.filter__option, [class*="css-"][class*="option-"], [class*="-option"]:not([class*="options"]):not([class*="placeholder"]):not([class*="single-value"])';

    // 1) exact match first
    const exact = this.page
      .locator(optionsUnion)
      .filter({ hasText: new RegExp(`^\\s*${value}\\s*$`, 'i') })
      .first();
    if (value && (await exact.isVisible({ timeout: 2_000 }).catch(() => false))) {
      await exact.click({ timeout: 5_000 });
      return;
    }

    // 2) contains match (if value provided)
    if (value) {
      const contains = this.page
        .locator(optionsUnion)
        .filter({ hasText: new RegExp(value, 'i') })
        .first();
      if (await contains.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await contains.click({ timeout: 5_000 });
        return;
      }
    }

    // 3) fallback — first visible option (unblocks dynamic environments where
    // the canonical value is missing from the options list).
    const first = this.page.locator(optionsUnion).first();
    await first.click({ timeout: 5_000 });
  }

  // --- Inventory Category (Task #1262) ---

  /** Opens the Inventory Category react-select and picks an existing option by visible text. */
  async selectInventoryCategory(value: string): Promise<void> {
    await this.pickReactSelectOption('inventoryCategory', value);
  }

  /**
   * Clears the Inventory Category select. This react-select theme does NOT
   * expose a clear-indicator button, and the Formik-backed state only updates
   * through react-select's internal `onChange`. We simulate clearing by:
   *   1. Focusing the hidden combobox input.
   *   2. Triggering `backspaceRemovesValue` — react-select's default removes
   *      the selected `singleValue` when the input is empty and Backspace is
   *      pressed; this fires the onChange(null) that Formik listens to.
   * When the above is no-op (some builds disable `backspaceRemovesValue`),
   * we fall back to typing a unique placeholder string and clearing it so
   * the Formik `onInputChange` + empty value combination marks the field as
   * null.
   */
  async clearInventoryCategory(): Promise<void> {
    const current = await this.getInventoryCategoryValue();
    if (!current) return;

    const input = this.page
      .locator('#inventoryCategory input[role="combobox"], #inventoryCategory input')
      .first();
    await input.waitFor({ state: 'attached', timeout: 5_000 }).catch(() => undefined);
    await input.focus();
    // First backspace: if input has typed text, clears it; otherwise removes selection.
    await input.press('Backspace');

    // Verify the single value is gone — if still present, use Delete (alternate
    // react-select keyboard handler) and Backspace-again sequence.
    const stillHasValue = await this.getInventoryCategoryValue();
    if (stillHasValue) {
      await input.focus();
      await input.press('Delete');
      await input.press('Backspace');
    }
    // Close the menu so subsequent clicks (SAVE) are not intercepted.
    await this.page.keyboard.press('Escape').catch(() => undefined);
  }

  /** Returns the currently selected Inventory Category text, or '' when empty. */
  async getInventoryCategoryValue(): Promise<string> {
    const value = this.page
      .locator(`#inventoryCategory [class*="singleValue"]`)
      .first();
    const visible = await value.isVisible({ timeout: 2_000 }).catch(() => false);
    if (!visible) return '';
    return (await value.textContent())?.trim() ?? '';
  }

  /**
   * Detects whether the Inventory Category label is visually marked as required.
   * InputField renders the asterisk as `<span class="*__textError__*">*</span>`
   * inside the label.
   */
  async isInventoryCategoryLabelRequired(): Promise<boolean> {
    const label = this.page.locator(`label[for='inventoryCategory']`).first();
    await label.waitFor({ state: 'visible', timeout: 10_000 });
    const html = await label.innerHTML();
    return html.includes('*') || /required/i.test(html);
  }

  /**
   * Returns the inline validation error text for the Inventory Category field,
   * or '' if no error is visible within 3s.
   */
  async getInventoryCategoryErrorText(): Promise<string> {
    // Yup errors for this field appear near the input group — scan the parent
    // `.form-group` / input-group for the known literal.
    const literal = this.page
      .locator('text=/Inventory Category is Required/i')
      .first();
    const visible = await literal.isVisible({ timeout: 3_000 }).catch(() => false);
    if (!visible) return '';
    return (await literal.textContent())?.trim() ?? '';
  }

  // --- Clone (Task #1262) ---

  /**
   * Opens the Clone DropdownButton in the add-merchant header and waits for the
   * dropdown menu (`.dropdown.show`) to appear. The toggle is rendered as an
   * `<a>` with styled children — we click the inner "Clone" label element which
   * propagates the click to the parent anchor.
   */
  async openCloneDropdown(): Promise<void> {
    await this.waitForSpinner();
    // The Clone trigger is a text node inside `<a class="dropdownContainer__ddButton">`.
    // Clicking the inner label (div or anchor) triggers the dropdown.
    const toggle = this.page
      .locator('a[class*="dropdownContainer__ddButton"], [class*="dropdownContainer__ddButton__btnTitle"]')
      .filter({ hasText: /^Clone$/ })
      .first();
    await toggle.scrollIntoViewIfNeeded();
    await toggle.waitFor({ state: 'visible', timeout: 10_000 });
    await toggle.click();

    // Wait for the open state — Bootstrap adds `.show` to the `.dropdown`.
    await this.page
      .locator('.dropdown.show')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Filters the opened Clone dropdown search input by `searchText` (merchant
   * code, name, OR location — all three are matched by the frontend's filter)
   * and clicks the first DropdownItem after the header. The item labels are
   * `${merchantName} - ${merchantLocation}` so they do NOT contain the ref
   * code; we rely on the search narrowing the list and click the first
   * non-header match.
   */
  async selectMerchantToClone(searchText: string): Promise<void> {
    const openDropdown = this.page.locator('.dropdown.show').first();
    const search = openDropdown.locator('input[name="search"]').first();
    await search.waitFor({ state: 'visible', timeout: 10_000 });
    await search.clear();
    await search.fill(searchText);

    // Wait a beat for the filtered list to stabilize; then click first
    // non-header item — the frontend renders the search input inside a
    // `dropdown-header` DropdownItem, so skip headers.
    const item = openDropdown
      .locator('.dropdown-item:not(.dropdown-header)')
      .first();
    await item.waitFor({ state: 'visible', timeout: 10_000 });
    await item.click();
    await this.waitForSpinner();
  }

  /** Returns true when the Cloned From icon/tooltip is present in the Merchant Information panel. */
  async isClonedFromTooltipVisible(): Promise<boolean> {
    const icon = this.page.locator(SELECTORS.merchantClonedFromIcon).first();
    return icon.isVisible({ timeout: 5_000 }).catch(() => false);
  }
}

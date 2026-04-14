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
}

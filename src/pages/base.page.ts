import { type Page, type Locator, expect } from '@playwright/test';
import { SELECTORS } from '../selectors/common.selectors.js';
import { TIMEOUTS } from '../config/constants.js';
import { calculateDate } from '../helpers/date.helpers.js';
import {
  waitForSpinner,
  getToastText,
  waitForToastAndDismiss,
  isElementPresent,
  selectDropdownOption,
} from '../helpers/common.helpers.js';
import {
  goToNextPage,
  selectMaxRowsPerPage as selectMaxRows,
} from '../helpers/table.helpers.js';

export abstract class BasePage {
  constructor(protected page: Page) {}

  // --- Spinner / Loading (delegates to common.helpers) ---

  async waitForSpinner(timeoutMs = TIMEOUTS.SPINNER): Promise<void> {
    await waitForSpinner(this.page, timeoutMs);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.waitForSpinner();
  }

  protected async clickAndWaitForSpinner(locator: Locator): Promise<void> {
    await locator.click();
    await this.waitForSpinner();
  }

  // --- Toast (delegates to common.helpers) ---

  async getToastText(timeoutMs = TIMEOUTS.TOAST): Promise<string | null> {
    return getToastText(this.page, timeoutMs);
  }

  async expectToastContains(text: string, timeoutMs = TIMEOUTS.TOAST): Promise<void> {
    const toast = this.page.locator(SELECTORS.toastBody).first();
    await toast.waitFor({ state: 'visible', timeout: timeoutMs });
    await expect(toast).toContainText(text);
  }

  async dismissToast(): Promise<void> {
    await waitForToastAndDismiss(this.page);
  }

  /**
   * Captures toast text, dismisses it, and returns the trimmed text.
   * Replaces the repeated pattern: locator(toastBody) → waitFor → textContent → trim → click close.
   */
  async captureAndDismissToast(timeoutMs: number = TIMEOUTS.TOAST): Promise<string> {
    const toast = this.page.locator(SELECTORS.toastBody);
    await toast.waitFor({ state: 'visible', timeout: timeoutMs });
    const text = (await toast.textContent())?.trim() || '';
    const toastClose = this.page.locator(SELECTORS.toastClose);
    if (await toastClose.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await toastClose.click().catch(() => {});
    }
    return text;
  }

  // --- Navigation ---

  async sideMenuNavigateTo(section: string): Promise<void> {
    // Wait for any loading overlay to clear before interacting with sidebar
    await this.waitForSpinner();

    // Try the specific sidebar__menu-item selector first, then broader sidebar text matching
    const menuItem = this.page.locator(SELECTORS.sidebarItem).filter({ hasText: new RegExp(section, 'i') });
    if (await menuItem.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
      await menuItem.first().click();
    } else {
      // Fallback: click any sidebar/left-panel element with matching text
      const fallback = this.page.locator('.sidebar div, .flex-row div, nav div')
        .filter({ hasText: new RegExp(`^${section}$`, 'i') }).first();
      if (await fallback.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fallback.click();
      } else {
        // Last resort: getByText in the left column area
        await this.page.getByText(section, { exact: true }).first().click();
      }
    }
    await this.waitForSpinner();
  }

  // --- Date ---

  calculateDate(daysFromToday: number | string, allowPast = false): string {
    return calculateDate(daysFromToday, allowPast);
  }

  // --- Pagination (delegates to table.helpers) ---

  async goToNextPage(): Promise<boolean> {
    return goToNextPage(this.page);
  }

  async selectMaxRowsPerPage(): Promise<void> {
    await selectMaxRows(this.page);
  }

  // --- Modal ---

  async waitForModalOpen(timeoutMs = TIMEOUTS.MODAL): Promise<void> {
    await this.page.locator(SELECTORS.modalContent).last().waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async closeModal(): Promise<void> {
    await this.page.locator(SELECTORS.modalClose).last().click();
    await this.page.locator(SELECTORS.modalContent).last().waitFor({ state: 'hidden' });
  }

  // --- Dropdown (React Select) (delegates to common.helpers) ---

  async selectReactOption(controlSelector: string, optionText: string): Promise<void> {
    await selectDropdownOption(this.page, controlSelector, optionText);
  }

  /**
   * Resilient filter dropdown selection for `filter__*` styled dropdowns.
   * Tries each trigger selector until the menu opens, then selects the matching option.
   * Handles `.filter__menu-portal` and `.filter__menu` menu containers.
   *
   * @param triggerSelectors - CSS/XPath selectors for the dropdown trigger (tried in order)
   * @param optionText       - visible text of the option to select
   */
  async selectFilterOption(triggerSelectors: string[], optionText: string): Promise<void> {
    const menuSelector = '.filter__menu-portal, .filter__menu';

    for (const selector of triggerSelectors) {
      const trigger = this.page.locator(selector).first();
      if (await trigger.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await trigger.click();
        const menu = this.page.locator(menuSelector).first();
        if (await menu.isVisible({ timeout: 2_000 }).catch(() => false)) {
          const option = this.page.locator(SELECTORS.filterOption).filter({ hasText: optionText }).first();
          if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await option.click();
          }
          return;
        }
      }
    }
  }

  // --- Utility (delegates to common.helpers) ---

  async isElementPresent(selector: string, timeoutMs = TIMEOUTS.ELEMENT_PRESENCE): Promise<boolean> {
    return isElementPresent(this.page, selector, timeoutMs);
  }

  // --- Text Content (DRY helper for 14+ identical patterns) ---

  protected async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() || '';
  }

  // --- Toast Error Guard ---

  async assertNoErrorToast(context?: string): Promise<void> {
    const errorToast = this.page.locator(SELECTORS.toastError);
    if (await errorToast.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const errorText = await errorToast.textContent();
      throw new Error(`${context ?? 'Operation'} failed: "${errorText}"`);
    }
  }

  // --- Table Row Helpers ---

  async getTableRowCount(selector = 'tbody tr'): Promise<number> {
    return this.page.locator(selector).count();
  }

  async assertTableRowContains(text: string, rowSelector = `${SELECTORS.tableRow}, tbody tr`, timeoutMs = 10_000): Promise<void> {
    const row = this.page.locator(rowSelector).filter({ hasText: text });
    await expect(row.first()).toBeVisible({ timeout: timeoutMs });
  }

  // --- Modal Cleanup (DRY helper for bootstrap modal backdrops) ---

  async dismissAllModals(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.querySelectorAll('.modal.show, .modal.fade.show, .modal.fade').forEach(el => {
        (el as HTMLElement).style.display = 'none';
        el.classList.remove('show');
      });
      if (document.body) {
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
      }
    });
  }
}

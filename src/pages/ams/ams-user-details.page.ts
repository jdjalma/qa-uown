import { type Page } from '@playwright/test';
import { AmsBasePage } from './ams-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * AmsUserDetailsPage — /users/[username]
 *
 * User details are displayed as read-only cards. Each card has a pencil icon
 * (span#EditUserProfile-edit) to enter edit mode.
 *
 * Edit flow:
 *   1. Click span#EditUserProfile-edit
 *   2. Fields become inputs: input[name="firstName"], input[name="lastName"],
 *      input[name="email"], input[name="phoneNumber"]
 *   3. Click SAVE or CANCEL
 */
export class AmsUserDetailsPage extends AmsBasePage {
  constructor(page: Page) {
    super(page);
  }

  readonly editProfileButton = this.page.locator(SELECTORS.amsEditProfileButton);
  readonly firstNameInput    = this.page.locator(SELECTORS.amsUserFirstNameInput);
  readonly lastNameInput     = this.page.locator(SELECTORS.amsUserLastNameInput);
  readonly emailInput        = this.page.locator(SELECTORS.amsUserEmailInput);
  readonly phoneInput        = this.page.locator(SELECTORS.amsUserPhoneInput);
  readonly saveButton        = this.page.locator(SELECTORS.amsSaveButton);
  readonly cancelButton      = this.page.locator(SELECTORS.amsCancelButton);

  /** Wait for the user details page to load (edit pencil visible). */
  async waitForDetailsPage(): Promise<void> {
    await this.editProfileButton.waitFor({ state: 'visible', timeout: 20_000 });
  }

  /** Activate edit mode on the "Edit User Profile" card. */
  async clickEditProfileButton(): Promise<void> {
    await this.editProfileButton.click();
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 5_000 });
  }

  async fillPhoneNumber(value: string): Promise<void> {
    await this.phoneInput.fill(value);
  }

  async fillFirstName(value: string): Promise<void> {
    await this.firstNameInput.fill(value);
  }

  async clickSave(): Promise<void> {
    await this.clickAndWaitForSpinner(this.saveButton);
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
    await this.editProfileButton.waitFor({ state: 'visible', timeout: 5_000 });
  }

  async isSaveSuccessful(): Promise<boolean> {
    try {
      await this.page.locator(SELECTORS.amsSuccessToast).first().waitFor({ state: 'visible', timeout: 6_000 });
      return true;
    } catch {
      return false;
    }
  }

  /** Extract username from current URL path (/users/[username]). */
  async getUsernameFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/users\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  // ── Edit User Merchants card ──────────────────────────────────────────

  /**
   * Expands the "Edit User Merchants" card if it is currently collapsed.
   * The toggle chevron is inside the card header alongside the pencil icon.
   */
  async expandMerchantsCard(): Promise<void> {
    const collapse = this.page.locator(SELECTORS.amsUserMerchantsCardCollapse);
    const isExpanded = await collapse.evaluate((el) => el.classList.contains('show')).catch(() => false);
    if (!isExpanded) {
      await this.page.locator(SELECTORS.amsUserMerchantsCardToggle).click();
      await collapse.waitFor({ state: 'visible', timeout: 5_000 });
    }
  }

  /** Click the pencil on the "Edit User Merchants" card to enter edit mode. */
  async clickEditMerchantsButton(): Promise<void> {
    await this.page.locator(SELECTORS.amsEditUserMerchantsButton).click();
    await this.page.locator(SELECTORS.amsUserMerchantsSelectControl).waitFor({ state: 'visible', timeout: 5_000 });
  }

  /**
   * Type a merchant code/name in the React Select, wait for options to appear,
   * then select the first non-"Select All" option.
   * Returns the text of the selected option.
   */
  async selectMerchantInEdit(searchTerm: string): Promise<string> {
    await this.page.locator(SELECTORS.amsUserMerchantsSelectControl).click();
    await this.page.locator(SELECTORS.amsUserMerchantsSelectInput).type(searchTerm, { delay: 80 });
    // Wait for the dropdown to open (aria-expanded becomes true)
    await this.page.locator(SELECTORS.amsUserMerchantsSelectInput).waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      (sel) => document.querySelector(sel)?.getAttribute('aria-expanded') === 'true',
      SELECTORS.amsUserMerchantsSelectInput,
      { timeout: 5_000 },
    );
    // Options appear in a portal — ArrowDown skips "Select All", Enter selects
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('ArrowDown');
    const options = await this.page.locator(SELECTORS.amsUserMerchantsSelectOption).all();
    const selectedText = options.length > 1 ? (await options[1].innerText().catch(() => '')).trim() : searchTerm;
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.press('Escape'); // close dropdown
    return selectedText;
  }

  /** Click SAVE on the "Edit User Merchants" card and wait for read-only mode to restore. */
  async saveMerchantsEdit(): Promise<void> {
    await this.page.locator(SELECTORS.amsUserMerchantsSaveButton).click();
    // Wait for the pencil to reappear (edit mode closed)
    await this.page.locator(SELECTORS.amsEditUserMerchantsButton).waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Returns all current merchant tag texts from the read-only "Edit User Merchants" card. */
  async getMerchantTags(): Promise<string[]> {
    const tags = await this.page.locator(SELECTORS.amsUserMerchantsTag).all();
    const texts: string[] = [];
    for (const tag of tags) {
      const text = (await tag.innerText().catch(() => '')).trim();
      if (text) texts.push(text);
    }
    return texts;
  }

  /**
   * Returns the most recent Log Activity entry from the user details page.
   * The Log Activity table is the only .rdt_Table on /users/[username].
   * Each row has 4 cells: [date, type, userId, notes].
   */
  async getLatestLogEntry(): Promise<{ date: string; type: string; userId: string; notes: string } | null> {
    const firstRow = this.page.locator(SELECTORS.amsLogActivityRow).first();
    try {
      await firstRow.waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return null;
    }
    const cells = firstRow.locator(SELECTORS.amsLogActivityCell);
    const count = await cells.count();
    if (count < 4) return null;
    return {
      date:   (await cells.nth(0).innerText()).trim(),
      type:   (await cells.nth(1).innerText()).trim(),
      userId: (await cells.nth(2).innerText()).trim(),
      notes:  (await cells.nth(3).innerText()).trim(),
    };
  }

  /**
   * Returns all visible Log Activity entries (first page, up to 10 by default).
   */
  async getLogEntries(): Promise<Array<{ date: string; type: string; userId: string; notes: string }>> {
    const rows = this.page.locator(SELECTORS.amsLogActivityRow);
    try {
      await rows.first().waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      return [];
    }
    const count = await rows.count();
    const entries = [];
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator(SELECTORS.amsLogActivityCell);
      const cellCount = await cells.count();
      if (cellCount < 4) continue;
      entries.push({
        date:   (await cells.nth(0).innerText()).trim(),
        type:   (await cells.nth(1).innerText()).trim(),
        userId: (await cells.nth(2).innerText()).trim(),
        notes:  (await cells.nth(3).innerText()).trim(),
      });
    }
    return entries;
  }
}

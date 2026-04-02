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
}

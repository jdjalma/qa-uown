/**
 * AmsUsersPage — AMS portal Users list view (/users).
 *
 * After svc#504 / R1.52.0 (MR!170), `GET /uown/getAllAvailableMerchants` is
 * **lazy-loaded** only when the user clicks "Add User". On page load this
 * endpoint MUST NOT be called.
 *
 * This page object intentionally exposes a thin surface (load, click Add User).
 * Network capture/assertion is performed in the test (page.on('request') /
 * page.waitForRequest) — not in the page object.
 */
import { AmsBasePage } from './ams-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

export class AmsUsersPage extends AmsBasePage {
  readonly addUserButton = this.page.locator(SELECTORS.amsAddUserButton).first();

  /** Navigate directly to `/users`. */
  async goto(amsBaseUrl: string): Promise<void> {
    const url = `${amsBaseUrl.replace(/\/+$/, '')}/users`;
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /** Click the "Add User" button. Triggers the lazy load of getAllAvailableMerchants. */
  async clickAddUser(): Promise<void> {
    await this.addUserButton.waitFor({ state: 'visible', timeout: 10_000 });
    await this.addUserButton.click();
  }
}

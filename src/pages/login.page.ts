import { expect } from '@playwright/test';
import { BasePage } from './base.page.js';
import { SELECTORS } from '../selectors/common.selectors.js';

export class LoginPage extends BasePage {
  readonly emailInput = this.page.locator(SELECTORS.loginEmail);
  readonly passwordInput = this.page.locator(SELECTORS.loginPassword);
  readonly loginButton = this.page.locator(SELECTORS.loginButton);
  readonly forgotPasswordButton = this.page.locator('button:has-text("Forgot"), a:has-text("Forgot")');

  async login(username: string, password: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 15_000 });
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    // Wait for the post-login redirect to fully settle before returning.
    // waitForSpinner() has a 1.5s race window that can miss the login spinner and
    // return while the SPA is still on the login URL, causing the next caller to see
    // the "Merchant Login" shell instead of the authenticated navbar.
    // #search-input is only mounted in the authenticated navbar → its presence
    // confirms the SPA route-guard accepted the new session token.
    await this.page.locator(SELECTORS.searchInput)
      .waitFor({ state: 'visible', timeout: 20_000 })
      .catch(() => {});
    await this.waitForSpinner();
  }

  async isLoginPage(): Promise<boolean> {
    const hasEmail = await this.isElementPresent(SELECTORS.loginEmail, 3_000);
    if (!hasEmail) return false;
    return this.page.locator(SELECTORS.loginPassword).first().isVisible({ timeout: 1_000 }).catch(() => false);
  }

  async isLoggedIn(): Promise<boolean> {
    return !(await this.isLoginPage());
  }

  async loginIfNeeded(username: string, password: string): Promise<void> {
    if (await this.isLoginPage()) {
      await this.login(username, password);
    }
  }

  async lockAccountWithWrongPassword(email: string, attempts = 5): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(`WrongPassword${i}`);
      await this.loginButton.click();
      // Wait for error response before next attempt
      const errorMsg = this.page.locator('.alert, .error, [role="alert"]').first();
      await errorMsg.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
    }
  }

  async validateLoginFields(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}

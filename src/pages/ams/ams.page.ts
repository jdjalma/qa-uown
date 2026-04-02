import { expect } from '@playwright/test';
import { AmsBasePage } from './ams-base.page.js';

export class AmsPage extends AmsBasePage {
  readonly userProfile = this.page.locator('.user-profile, [data-section="profile"]');
  readonly usernameField = this.page.locator('[data-field="username"], #username');
  readonly phoneField = this.page.locator('[data-field="phone"], #phone, [name="phone"]');
  readonly emailField = this.page.locator('[data-field="email"], #email, [name="email"]');
  readonly saveButton = this.page.locator('button:has-text("Save")');
  readonly editButton = this.page.locator('button:has-text("Edit")');

  async getUsername(): Promise<string> {
    return this.getTextContent(this.usernameField);
  }

  async getPhone(): Promise<string> {
    const input = this.page.locator('#phone, [name="phone"]');
    return await input.inputValue();
  }

  async updatePhone(phone: string): Promise<void> {
    await this.editButton.click();
    await this.phoneField.fill(phone);
    await this.clickAndWaitForSpinner(this.saveButton);
  }

  async validateUsernameEquals(expected: string): Promise<void> {
    await expect(this.usernameField).toHaveText(expected);
  }

  async validatePhoneEquals(expected: string): Promise<void> {
    const phone = await this.getPhone();
    expect(phone).toBe(expected);
  }

  async openUserProfile(): Promise<void> {
    await this.clickRowByIndex(0);
    await expect(this.userProfile).toBeVisible();
  }
}

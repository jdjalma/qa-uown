/**
 * ApplicationWizardPage — Consumer-facing 3-page application form.
 *
 * Migrated from: AccountCreationSteps.java (fillInTheNewApplicationInformation)
 *
 * This page is opened via the email link sent after creating a new application
 * in the origination portal. It's a standalone consumer-facing page (like ContractPage),
 * not behind the origination portal login.
 *
 * Flow: Page 1 (Personal Info) → Page 2 (Employment) → Page 3 (Consent) → Confirmation
 */
import { expect } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';


export interface PersonalInfo {
  firstName: string;
  lastName: string;
  ssn: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
}

export interface EmploymentInfo {
  employerName: string;
  payFrequency?: string;
  lastPayDate: string;
  nextPayDate: string;
  monthlyIncome: string;
}

export class ApplicationWizardPage extends BasePage {

  // ── Page 1: Personal Info ────────────────────────────────────────

  async fillPersonalInfo(info: PersonalInfo): Promise<void> {
    await this.page.locator(SELECTORS.naMainFirstName).waitFor({ state: 'visible', timeout: 30_000 });

    await this.page.locator(SELECTORS.naMainFirstName).fill(info.firstName);
    await this.page.locator(SELECTORS.naMainLastName).fill(info.lastName);
    await this.page.locator(SELECTORS.naMainSsn).fill(info.ssn);
    await this.page.locator(SELECTORS.naMainDob).fill(info.dob);
    await this.page.locator(SELECTORS.naMainCellPhone).fill(info.phone);
    await this.page.locator(SELECTORS.naMainEmailAddress).fill(info.email);
    await this.page.locator(SELECTORS.naMainAddress1).fill(info.address);
    await this.page.locator(SELECTORS.naMainPostalCode).fill(info.zipCode);
    await this.page.locator(SELECTORS.naMainCity).fill(info.city);

    // Wait for the "Next" button to become enabled after form validation
    const nextBtn = this.page.locator(SELECTORS.buttonPrimary).first();
    await nextBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await nextBtn.click();
    await this.waitForSpinner();
    console.log('[ApplicationWizard] Page 1 (Personal Info) completed');
  }

  // ── Page 2: Employment Info ──────────────────────────────────────

  async fillEmploymentInfo(info: EmploymentInfo): Promise<void> {
    await this.page.locator(SELECTORS.naMainEmployerName).waitFor({ state: 'visible', timeout: 30_000 });

    await this.page.locator(SELECTORS.naMainEmployerName).fill(info.employerName);

    // Select pay frequency via react-select dropdown
    if (info.payFrequency) {
      await this.selectPayFrequency(info.payFrequency);
    }

    await this.page.locator(SELECTORS.naMainLastPayDate).fill(info.lastPayDate);
    await this.page.locator(SELECTORS.naMainNextPayDate).fill(info.nextPayDate);
    await this.page.locator(SELECTORS.naMainMonthlyIncome).fill(info.monthlyIncome);

    // Select a random employment duration option if the dropdown is present
    await this.selectRandomEmploymentDuration();

    // Wait for the "Next" button to become enabled after form validation
    const nextBtn = this.page.locator(SELECTORS.buttonPrimary).last();
    await nextBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await nextBtn.click();
    await this.waitForSpinner();
    console.log('[ApplicationWizard] Page 2 (Employment Info) completed');
  }

  // ── Page 3: Consent / Legal ──────────────────────────────────────

  async fillConsentInfo(): Promise<void> {
    await this.page.locator(SELECTORS.naIsAgreedToStatements).waitFor({ state: 'visible', timeout: 30_000 });

    // Select "No" for bankruptcy dropdown (if present)
    await this.selectBankruptcyNo();

    // Check consent checkboxes
    await this.page.locator(SELECTORS.naIsAgreedToStatements).check();
    await this.page.locator(SELECTORS.naIsAgreedToPrivacy).check();

    // Wait for Submit button to become enabled after consent checkboxes
    const submitBtn = this.page.locator(SELECTORS.buttonPrimary).last();
    await submitBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await submitBtn.click();
    await this.waitForSpinner();

    // Wait for consent section to disappear (form submitted)
    await this.page.locator(SELECTORS.naIsAgreedToStatements)
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

    console.log('[ApplicationWizard] Page 3 (Consent) completed');
  }

  // ── Confirmation ─────────────────────────────────────────────────

  /**
   * Waits for the confirmation page to display "thank you" or "congratulations",
   * indicating UW_APPROVED status.
   */
  async waitForApprovalConfirmation(timeoutMs = 60_000): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const text = document.body?.textContent?.toLowerCase() ?? '';
        return text.includes('thank you') || text.includes('congratulations');
      },
      null,
      { timeout: timeoutMs, polling: 2_000 },
    );
    console.log('[ApplicationWizard] Approval confirmation received');
  }

  /**
   * Completes the full 3-page wizard in one call.
   */
  async completeWizard(personal: PersonalInfo, employment: EmploymentInfo): Promise<void> {
    await this.fillPersonalInfo(personal);
    await this.fillEmploymentInfo(employment);
    await this.fillConsentInfo();
    await this.waitForApprovalConfirmation();
  }

  // ── Private helpers ──────────────────────────────────────────────

  private async selectPayFrequency(frequency: string): Promise<void> {
    const dropdown = this.page.locator(SELECTORS.naMainPayFrequencyDropdown).first();
    if (await dropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dropdown.click();
      const option = this.page.locator(`[class*="option"]`).filter({ hasText: frequency }).first();
      if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await option.click();
      }
    }
  }

  private async selectRandomEmploymentDuration(): Promise<void> {
    const dropdown = this.page.locator(SELECTORS.naEmploymentDurationDropdown).first();
    if (await dropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dropdown.click();
      const options = this.page.locator('[class*="option"]');
      const count = await options.count();
      if (count > 1) {
        const randomIndex = Math.floor(Math.random() * (count - 1)) + 1;
        await options.nth(randomIndex).click();
      }
    }
  }

  private async selectBankruptcyNo(): Promise<void> {
    const dropdown = this.page.locator(SELECTORS.naBankruptcyDropdown).first();
    if (await dropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dropdown.click();
      const noOption = this.page.locator('[class*="option"]').filter({ hasText: 'No' }).first();
      if (await noOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await noOption.click();
      }
    }
  }
}

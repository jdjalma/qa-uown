/**
 * MissingDataFormPage — /[shortCode]/complete?planId=... screen.
 *
 * Appears when the customer clicks the `paymentDetailsList[idx].redirectUrl` link
 * (which is the `providerURL` returned by the UOwn API after UW_APPROVED).
 *
 * Collects credit card data (required) and bank account data (optional)
 * before advancing to Terms of Agreement.
 *
 * Form ID: `missingDataForm`
 * Submit button: `#completeApplication-submit`
 */
import { BasePage } from '../base.page.js';
import { TEST_BANK } from '@config/constants.js';

export interface MissingDataCreditCardInfo {
  firstName: string;
  lastName: string;
  cardNumber: string;
  cvc: string;
  /** Format: MM/YYYY (e.g. "12/2030") */
  expiration: string;
}

export interface MissingDataBankInfo {
  firstName: string;
  lastName: string;
  accountType: 'CHECKING' | 'SAVINGS';
  routingNumber: string;
  accountNumber: string;
}

export class MissingDataFormPage extends BasePage {
  async waitForLoaded(timeoutMs = 30_000): Promise<void> {
    await this.page.locator('#missingDataForm').waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async fillCreditCard(cc: MissingDataCreditCardInfo): Promise<void> {
    await this.page.locator('#ccFirstName').fill(cc.firstName);
    await this.page.locator('#ccLastName').fill(cc.lastName);
    await this.page.locator('#ccValue').fill(cc.cardNumber);
    await this.page.locator('#cvc').fill(cc.cvc);
    await this.page.locator('#ccExpDate').fill(cc.expiration);
  }

  async fillBankAccount(bank: MissingDataBankInfo): Promise<void> {
    await this.page.locator('#bankAccountCustomerFirstName').fill(bank.firstName);
    await this.page.locator('#bankAccountCustomerLastName').fill(bank.lastName);

    await this.page.locator('#bankAccountType').click();
    // react-select uses class-prefixed options without `role="option"` — scope
    // by the option container class. Strict-mode safe: matches only menu items.
    await this.page
      .locator(`.filter__option:has-text("${bank.accountType}")`)
      .first()
      .click();

    await this.page.locator('#bankRoutingNumber').fill(bank.routingNumber);
    await this.page.locator('#bankAccountNumber').fill(bank.accountNumber);
    await this.page.locator('#achReEnterAccountNumber').fill(bank.accountNumber);
  }

  async submit(): Promise<void> {
    await this.page.locator('#completeApplication-submit').click();
  }

  async fillAndSubmit(cc: MissingDataCreditCardInfo, bank?: MissingDataBankInfo): Promise<void> {
    await this.fillCreditCard(cc);
    const submitBtn = this.page.locator('#completeApplication-submit');
    if (bank) {
      await this.fillBankAccount(bank);
    } else {
      // stg form keeps Submit [disabled] until ACH section is filled, even though
      // it is labeled "optional". Fall back to test defaults so the click resolves.
      const enabled = await submitBtn.isEnabled().catch(() => false);
      if (!enabled) {
        await this.fillBankAccount({
          firstName: cc.firstName,
          lastName: cc.lastName,
          accountType: TEST_BANK.DEFAULT_TYPE as 'CHECKING' | 'SAVINGS',
          routingNumber: TEST_BANK.DEFAULT_ROUTING,
          accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
        });
      }
    }
    await submitBtn.click();
  }

  /**
   * The Complete page renders the processing fee inline inside the CC section
   * description, e.g. "complete a $0.01 Authorization, today" or
   * "complete a $1.50 Authorization, today". When `chargeProcessingFee=false`
   * the page omits this sentence entirely (no `$N.NN Authorization` text).
   *
   * Text-based detection is intentional — the prior CSS-module hash selector
   * (`.missing-data-panel_missingDataPanel__feeAmount__cn7Wg`) breaks on every
   * webpack rebuild.
   */
  private feeLocator() {
    return this.page.getByText(/\$\s?[\d,]+\.?\d*\s+Authorization/i).first();
  }

  async isProcessingFeeDisplayed(): Promise<boolean> {
    return this.feeLocator()
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
  }

  async getProcessingFeeAmount(): Promise<string | null> {
    if (!(await this.isProcessingFeeDisplayed())) return null;
    const text = (await this.feeLocator().textContent())?.trim() ?? '';
    const match = text.match(/\$\s?([\d,]+\.?\d*)/);
    return match ? `$${match[1]}` : null;
  }
}

/**
 * MissingDataFormPage — tela /[shortCode]/complete?planId=...
 *
 * Aparece quando o cliente clica no link `paymentDetailsList[idx].redirectUrl`
 * (que e o `providerURL` retornado pela API UOwn apos UW_APPROVED).
 *
 * Coleta dados do cartao de credito (obrigatorio) e conta bancaria (opcional)
 * antes de avancar para Terms of Agreement.
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
  /** Format: MM/YYYY (ex: "12/2030") */
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
    await this.page.getByText(bank.accountType, { exact: true }).click();

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

  async isProcessingFeeDisplayed(): Promise<boolean> {
    return this.page
      .locator('.missing-data-panel_missingDataPanel__feeAmount__cn7Wg')
      .isVisible()
      .catch(() => false);
  }

  async getProcessingFeeAmount(): Promise<string | null> {
    const feeLocator = this.page.locator('.missing-data-panel_missingDataPanel__feeAmount__cn7Wg');
    if (!(await feeLocator.isVisible().catch(() => false))) return null;
    return (await feeLocator.textContent())?.trim() ?? null;
  }
}

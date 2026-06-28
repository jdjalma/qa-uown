/**
 * ContractCompletePage — consumer-facing payment page at the contract URL:
 *   secure-{env}.uownleasing.com/{shortCode}/complete?planId={planId}
 *   (Kornerstone: secure-{env}.kornerstoneliving.com/...)
 *
 * Collects credit card (CC) and/or bank (ACH) info before signing. WHICH sections
 * render is config-driven by the merchant (uown_merchant):
 *   - is_cc_required  = true → CC section  ("Require Credit Card Before Signing")
 *   - is_ach_required = true → ACH section ("Require Bank Info Before Signing")
 * Both true → CC + ACH on the same page; a single Submit.
 *
 * On a successful submit the page advances to TermsOfAgreementPage (Contract created,
 * lead_status → CONTRACT_CREATED, $49 preauth). A declined card shows the inline error
 * "Credit Card is invalid." and stays. The URL is stateful: revisiting after a successful
 * submit shows "SIGN CONTRACT"; a 2nd sendInvoice invalidates it → "Invalid link. Please
 * contact merchant".
 *
 * Live DOM-mapped on stg 2026-06-28 (leads 7218254-7218258).
 * Knowledge-base: docs/knowledge-base/cc-ach-contract-complete-page.md
 * BDD oracle: .claude/oracles/cc-ach.md
 */
import type { Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

export interface CreditCardInput {
  firstName: string;
  lastName: string;
  number: string;
  cvc: string;
  /** Expiration as MM/YYYY (e.g. "12/2028"). */
  expDate: string;
}

export interface BankAccountInput {
  firstName: string;
  lastName: string;
  routingNumber: string;
  accountNumber: string;
  /** "Checking" | "Savings". */
  accountType: string;
}

export class ContractCompletePage extends BasePage {
  // ── Credit Card section (rendered when merchant.is_cc_required) ──
  readonly ccFirstName: Locator = this.page.locator(SELECTORS.ccFirstName);
  readonly ccLastName: Locator = this.page.locator(SELECTORS.ccLastName);
  readonly ccNumber: Locator = this.page.locator(SELECTORS.ccValue);
  readonly ccCvc: Locator = this.page.locator(SELECTORS.ccCvc);
  readonly ccExpDate: Locator = this.page.locator(SELECTORS.ccExpDate);

  // ── Bank / ACH section (rendered when merchant.is_ach_required) ──
  readonly bankFirstName: Locator = this.page.locator(SELECTORS.bankAccountCustomerFirst);
  readonly bankLastName: Locator = this.page.locator(SELECTORS.bankAccountCustomerLast);
  readonly bankRoutingNumber: Locator = this.page.locator(SELECTORS.bankRoutingNumber);
  readonly bankAccountNumber: Locator = this.page.locator(SELECTORS.bankAccountNumber);
  readonly bankReEnterAccountNumber: Locator = this.page.locator(SELECTORS.achReEnterAccountNumber);
  readonly accountTypeSelect: Locator = this.page.locator(SELECTORS.bankAccountTypeSelect);

  readonly submitButton: Locator = this.page.locator(SELECTORS.completeApplicationSubmit);

  /** Navigate to a contract URL and wait for DOM content to settle. */
  async goto(contractUrl: string): Promise<void> {
    await this.page.goto(contractUrl, { waitUntil: 'domcontentloaded' });
  }

  /** Resolves once the payment form (Submit button) is visible. */
  async waitForLoaded(timeoutMs = 30_000): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /** True when the CC section is present (merchant.is_cc_required). Call after waitForLoaded. */
  async hasCreditCardSection(): Promise<boolean> {
    return this.ccNumber.isVisible().catch(() => false);
  }

  /** True when the ACH section is present (merchant.is_ach_required). Call after waitForLoaded. */
  async hasBankSection(): Promise<boolean> {
    return this.bankRoutingNumber.isVisible().catch(() => false);
  }

  /** Fills the credit card fields. No assertions — caller validates. */
  async fillCreditCard(cc: CreditCardInput): Promise<void> {
    await this.ccFirstName.fill(cc.firstName);
    await this.ccLastName.fill(cc.lastName);
    await this.ccNumber.fill(cc.number);
    await this.ccCvc.fill(cc.cvc);
    await this.ccExpDate.fill(cc.expDate);
  }

  /** Fills the bank/ACH fields (account number entered twice) + selects the account type. */
  async fillBankAccount(bank: BankAccountInput): Promise<void> {
    await this.bankFirstName.fill(bank.firstName);
    await this.bankLastName.fill(bank.lastName);
    await this.bankRoutingNumber.fill(bank.routingNumber);
    await this.bankAccountNumber.fill(bank.accountNumber);
    await this.bankReEnterAccountNumber.fill(bank.accountNumber);
    await this.selectAccountType(bank.accountType);
  }

  /** Selects an Account Type option (Checking/Savings) in the react-select dropdown. */
  async selectAccountType(type: string): Promise<void> {
    await this.accountTypeSelect.click();
    await this.accountTypeSelect.fill(type);
    await this.page.keyboard.press('Enter');
  }

  /** Clicks Submit. Advances to Terms of Agreement on success, or surfaces an inline error. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Returns the inline error text after a failed submit (e.g. "Credit Card is invalid."),
   * or null if no error appears within the timeout.
   */
  async getInlineError(timeoutMs = 8_000): Promise<string | null> {
    const err = this.page.getByText('Credit Card is invalid.', { exact: false }).first();
    return err
      .waitFor({ state: 'visible', timeout: timeoutMs })
      .then(async () => ((await err.textContent())?.trim() ?? null))
      .catch(() => null);
  }

  /** True when the page shows "Invalid link. Please contact merchant" (URL invalidated). */
  async isInvalidLink(timeoutMs = 8_000): Promise<boolean> {
    return this.page
      .getByText('Invalid link', { exact: false })
      .first()
      .waitFor({ state: 'visible', timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
  }

  /** True once the payment form is gone — i.e. a successful submit advanced to the next step. */
  async hasLeftPaymentForm(timeoutMs = 15_000): Promise<boolean> {
    return this.submitButton
      .waitFor({ state: 'hidden', timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);
  }
}

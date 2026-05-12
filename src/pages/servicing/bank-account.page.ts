import { type Page, type Locator } from '@playwright/test';
import { ServicingBasePage } from './servicing-base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Bank Account CRUD page object — Servicing portal (customer-information page).
 *
 * Scope:
 *   - "Bank Account" card (collapsed read-only view)
 *   - "Add a Bank Account" modal (form id: #addBAForm)
 *   - "All Bank Accounts" modal (rdt_Table with row checkboxes + Delete)
 *
 * React-Select dropdowns:
 *   Bank Account Type (#bankAccountType) and Set as default payment (#autoPay) are
 *   React-Select containers. The pattern used here (click container → click .filter__option
 *   or [role="option"] matching visible text) is the same one used by selectPaymentType in
 *   ServicingBasePage. Do NOT attempt to fill() the container — it's a div, not an input.
 */
export class BankAccountPage extends ServicingBasePage {
  // Card (collapsed read-only)
  readonly bankAccountCard: Locator = this.page.locator(SELECTORS.bankAccountCard);
  readonly addBankAccountButton: Locator = this.page.locator(SELECTORS.addBankAccountButton);
  readonly viewAllBankAccountsButton: Locator = this.page.locator(SELECTORS.viewAllBankAccountsButton);
  readonly setDefaultPaymentValue: Locator = this.page.locator(SELECTORS.setDefaultPaymentValue).first();
  readonly accountNumberDisplayValue: Locator = this.page.locator(SELECTORS.accountNumberDisplayValue).first();

  // Add modal
  readonly addBankAccountModalTitle: Locator = this.page.locator(SELECTORS.addBankAccountModalTitle);
  readonly addBankAccountForm: Locator = this.page.locator(SELECTORS.addBankAccountForm);
  readonly bankAccountTypeDropdown: Locator = this.page.locator(SELECTORS.bankAccountTypeDropdown);
  readonly routingNumberInput: Locator = this.page.locator(SELECTORS.bankAccountRoutingNumberInput);
  readonly accountNumberInput: Locator = this.page.locator(SELECTORS.bankAccountAccountNumberInput);
  readonly setDefaultPaymentDropdown: Locator = this.page.locator(SELECTORS.setDefaultPaymentDropdown);
  readonly saveBankAccountButton: Locator = this.page.locator(SELECTORS.saveBankAccountButton);
  readonly cancelBankAccountButton: Locator = this.page.locator(SELECTORS.cancelBankAccountButton);
  readonly addBankAccountModalClose: Locator = this.page.locator(SELECTORS.addBankAccountModalClose);

  // View All modal
  readonly allBankAccountsModalTitle: Locator = this.page.locator(SELECTORS.allBankAccountsModalTitle);
  readonly bankAccountsTable: Locator = this.page.locator(SELECTORS.bankAccountsTable);
  readonly bankAccountsTableBody: Locator = this.page.locator(SELECTORS.bankAccountsTableBody);
  readonly bankAccountsSelectAllCheckbox: Locator = this.page.locator(SELECTORS.bankAccountsSelectAllCheckbox);
  readonly bankAccountsDeleteButton: Locator = this.page.locator(SELECTORS.bankAccountsDeleteButton);

  constructor(page: Page) {
    super(page);
  }

  /**
   * Clicks the "Add Account" button on the Bank Account card and waits for
   * the "Add a Bank Account" modal to open.
   */
  async openAddBankAccountModal(): Promise<void> {
    await this.waitForSpinner();
    await this.addBankAccountButton.first().click();
    await this.waitForModalOpen();
    await this.addBankAccountForm.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Fills the "Add a Bank Account" form and submits.
   *
   * @param params.routingNumber - up to 9 digits
   * @param params.accountNumber - up to 17 digits
   * @param params.accountType   - CHECKING (default) or SAVINGS
   * @param params.setAsDefault  - true → "Yes", false → "No"
   */
  async addBankAccount(params: {
    routingNumber: string;
    accountNumber: string;
    accountType?: 'CHECKING' | 'SAVINGS';
    setAsDefault: boolean;
  }): Promise<void> {
    const accountType = params.accountType ?? 'CHECKING';
    const defaultLabel = params.setAsDefault ? 'Yes' : 'No';

    // Select bank account type via React-Select (click container → click option by text)
    await this.selectReactSelectOption(this.bankAccountTypeDropdown, accountType);

    // Text inputs
    await this.routingNumberInput.fill(params.routingNumber);
    await this.accountNumberInput.fill(params.accountNumber);

    // Select "Set as default payment?" via React-Select
    await this.selectReactSelectOption(this.setDefaultPaymentDropdown, defaultLabel);

    // Submit — wait for modal to close + spinner to resolve
    await this.saveBankAccountButton.first().click();
    await this.waitForSpinner();
    await this.addBankAccountForm.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }

  /**
   * Clicks "View All" on the Bank Account card and waits for the "All Bank Accounts" modal.
   */
  async openAllBankAccountsModal(): Promise<void> {
    await this.waitForSpinner();
    await this.viewAllBankAccountsButton.first().click();
    await this.waitForModalOpen();
    await this.bankAccountsTable.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Finds the row in the "All Bank Accounts" table whose Account Number column
   * ends with the given last-four digits. Returns a Locator (not asserted).
   *
   * Assumes the "View All" modal is already open. Account numbers are rendered
   * masked (e.g., "******1234"), so we match by "ends with" using :has-text.
   */
  async getBankAccountRowByLastFour(lastFour: string): Promise<Locator> {
    return this.bankAccountsTableBody
      .locator('[role="row"], .rdt_TableRow')
      .filter({ hasText: lastFour });
  }

  /**
   * Selects the row matching the given last-four and clicks Delete in the
   * "All Bank Accounts" modal. Confirms if a confirmation dialog appears.
   *
   * Assumes the "View All" modal is already open.
   */
  async deleteBankAccountByLastFour(lastFour: string): Promise<void> {
    const row = await this.getBankAccountRowByLastFour(lastFour);
    await row.first().waitFor({ state: 'visible', timeout: 10_000 });
    // Each row has one select checkbox (input[name="select-row-undefined"])
    await row.first().locator(SELECTORS.bankAccountsRowCheckbox).first().check();

    await this.bankAccountsDeleteButton.first().click();

    // Optional confirmation dialog ("Yes"/"Confirm"/"OK") — click if present
    const confirmBtn = this.page
      .locator('.modal.show button:has-text("Confirm"), .modal.show button:has-text("Yes"), .modal.show button:has-text("OK")')
      .first();
    if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.waitForSpinner();
  }

  /**
   * Reads the value of "Set as default payment?" on the collapsed Bank Account card.
   * Returns "Yes", "No", or "" if not displayed.
   */
  async getDefaultPaymentFromCard(): Promise<string> {
    if (!(await this.setDefaultPaymentValue.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return '';
    }
    return this.getTextContent(this.setDefaultPaymentValue);
  }

  /**
   * Returns the last 4 digits of the displayed account number on the card.
   * The UI renders the account masked (e.g., "******1234"); this extracts the
   * trailing digits. Returns "" if no digits found.
   */
  async getAccountNumberLastFour(): Promise<string> {
    if (!(await this.accountNumberDisplayValue.isVisible({ timeout: 3_000 }).catch(() => false))) {
      return '';
    }
    const raw = await this.getTextContent(this.accountNumberDisplayValue);
    const match = raw.match(/(\d{4})\s*$/);
    return match ? match[1] : '';
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  /**
   * Opens a React-Select dropdown (click the container div) and clicks the
   * option whose text matches optionText. Matches the pattern used by
   * ServicingBasePage.selectPaymentType.
   */
  private async selectReactSelectOption(container: Locator, optionText: string): Promise<void> {
    await container.click();
    await this.page
      .locator(SELECTORS.filterOptionWithRole)
      .filter({ hasText: new RegExp(`^${optionText}$`, 'i') })
      .first()
      .click();
  }
}

import { expect } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';


export class ServicingBasePage extends BasePage {
  // Top menu navigation — both dropdowns are <a class="dropdown-toggle nav-link">,
  // matched via role=link (NOT button) with exact name to avoid catching "manager", etc.
  readonly servicingDropdown = this.page.getByRole('link', { name: /^Servicing$/i }).first();
  readonly historyDropdown = this.page.getByRole('link', { name: /^History$/i }).first();

  // Side bar navigation
  readonly sidebarCustomer = this.page.locator(".sidebar-item:has-text('Customer')");
  readonly sidebarTransaction = this.page.locator(".sidebar-item:has-text('Transaction'), .sidebar-item:has-text('Payment')");
  readonly sidebarDocuments = this.page.locator(".sidebar-item:has-text('Documents')");

  // Payment modal elements (aligned with Elements.java)
  readonly makePaymentButton = this.page.locator(SELECTORS.makePayment);
  readonly paymentTypeDropdown = this.page.locator(SELECTORS.paymentTypeDropdown);
  readonly paymentDateInput = this.page.locator('#paymentDate, [name="paymentDate"]');
  readonly paymentAmountInput = this.page.locator(SELECTORS.totalPaymentAmountInput);

  // ACH fields
  readonly bankInstitute = this.page.locator('#bankingInstitute, [name="bankingInstitute"]');
  readonly bankAccountNumber = this.page.locator(SELECTORS.bankAccountNumber);
  readonly routingNumber = this.page.locator(SELECTORS.bankRoutingNumber);

  // CC fields
  readonly ccNumber = this.page.locator(SELECTORS.ccNumber);
  readonly ccExpMonth = this.page.locator(SELECTORS.ccExpMonthInput);
  readonly ccExpYear = this.page.locator(SELECTORS.ccExpYearInput);
  readonly ccCsc = this.page.locator(SELECTORS.ccCvc);

  // Billing fields
  readonly billingAddress = this.page.locator('#address1, [name="address1"]');
  readonly billingCity = this.page.locator('#city, [name="city"]');
  readonly billingState = this.page.locator('#state, [name="state"]');
  readonly billingZip = this.page.locator('#zip, [name="zip"]');

  // Submit / Cancel
  readonly submitPaymentButton = this.page.getByRole('button', { name: 'Submit', exact: true });
  readonly cancelPaymentButton = this.page.locator(SELECTORS.cancelButton);

  async topMenuNavigateTo(section: string): Promise<void> {
    const menuMap: Record<string, string> = {
      'servicing': 'Servicing',
      'payment transaction': 'Payment Transaction',
      'due amounts': 'Due Amounts',
      'scheduled payments': 'Scheduled Payment',
      'payment arrangement': 'Payment Arrangement',
      'ach history': 'ACH',
      'cc history': 'CC Transactions',
      'ach': 'ACH',
      'cc transactions': 'CC Transactions',
      'email': 'Email',
      'items purchased': 'Items Purchased',
      'payments': 'Payments',
      'phone': 'Phone',
      'due date changes': 'Due Date Changes',
      'frequency changes': 'Frequency Changes',
    };
    const label = menuMap[section.toLowerCase()] || section;

    const historyItems = [
      'ach history', 'cc history',
      'ach', 'cc transactions', 'email', 'items purchased', 'payments', 'phone',
      'due date changes', 'frequency changes',
    ];
    const isHistoryItem = historyItems.includes(section.toLowerCase());

    // Wait for any full-page loader/spinner to clear before interacting with the menu
    await this.waitForSpinner();

    // Open the correct dropdown. Both are <a role="link"> — clicking toggles the menu.
    const dropdown = isHistoryItem ? this.historyDropdown : this.servicingDropdown;
    await dropdown.waitFor({ state: 'visible', timeout: 5_000 });
    await dropdown.click();

    // Wait for dropdown menu to appear, then click the item by role
    const menuItem = this.page.getByRole('menuitem', { name: label });
    await menuItem.waitFor({ state: 'visible', timeout: 5_000 });
    await menuItem.click({ force: true });
    await this.waitForSpinner();
  }

  async clickMakePayment(): Promise<void> {
    // Dismiss any lingering modal/backdrop that may block the Make Payment button
    // Bootstrap modals can block pointer events even in "fade" state (before "show")
    await this.dismissAllModals();
    // Wait for modal backdrop to be fully removed before clicking
    await this.page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

    await this.makePaymentButton.click();
    await this.waitForModalOpen();
  }

  async selectPaymentType(paymentType: string): Promise<void> {
    await this.paymentTypeDropdown.click();
    await this.page.locator(SELECTORS.filterOptionWithRole).filter({ hasText: paymentType }).first().click();
  }

  async makeAchPayment(date: string, amount: string, bankDetails: {
    institute?: string;
    accountNumber: string;
    routingNumber: string;
  }): Promise<void> {
    await this.clickMakePayment();
    await this.selectPaymentType('ACH Payment');

    const formattedDate = this.calculateDate(date);
    if (formattedDate !== 'NA') {
      await this.paymentDateInput.fill(formattedDate);
    }
    await this.paymentAmountInput.fill(amount);

    // If existing bank info is on file, the modal shows a radio + <select> dropdown
    // instead of manual bank fields. Use existing info when available.
    const useExistingRadio = this.page.locator("input[type='radio'][value='existing']").first();
    const bankOnFile = this.page.locator("text=Use existing bank information");
    if (await bankOnFile.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (await useExistingRadio.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await useExistingRadio.check().catch(() => {});
      }
      // Submit stays disabled until a bank account is picked from the <select>.
      // The dropdown defaults to "" (placeholder) even when a single account exists.
      const accountSelect = this.page.locator(SELECTORS.existingBankAccountSelect).first();
      await accountSelect.waitFor({ state: 'visible', timeout: 5_000 });
      const optionValues = await accountSelect.locator('option').evaluateAll(opts =>
        opts.map(o => (o as HTMLOptionElement).value).filter(v => v !== ''),
      );
      if (optionValues.length === 0) {
        throw new Error('[makeAchPayment] existing-bank-account dropdown has no real options');
      }
      await accountSelect.selectOption(optionValues[0]);
    } else {
      // No existing bank info — fill manually
      if (bankDetails.institute) {
        await this.bankInstitute.fill(bankDetails.institute);
      }
      await this.bankAccountNumber.fill(bankDetails.accountNumber);
      await this.routingNumber.fill(bankDetails.routingNumber);
    }

    await this.clickAndWaitForSpinner(this.submitPaymentButton);
  }

  async makeCcPayment(date: string, amount: string, ccDetails: {
    cardNumber: string;
    expMonth: string;
    expYear: string;
    /** Card Security Code — maps to form field #cvc (also known as CVV/CVC) */
    csc: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    allocationStrategy?: string;
  }): Promise<void> {
    await this.clickMakePayment();
    await this.selectPaymentType('Credit Card Payment');

    const formattedDate = this.calculateDate(date);
    if (formattedDate !== 'NA') {
      await this.paymentDateInput.fill(formattedDate);
    }
    await this.paymentAmountInput.fill(amount);

    // Select allocation strategy if specified (Java: selectOptionByVisibleText on allocationStrategy dropdown)
    if (ccDetails.allocationStrategy) {
      const allocDropdown = this.page.locator(SELECTORS.allocationStrategyDropdown);
      if (await allocDropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await allocDropdown.click();
        await this.page.locator(SELECTORS.filterOptionWithRole)
          .filter({ hasText: ccDetails.allocationStrategy }).first().click();
      }
    }

    // If existing CC info is on file, the modal shows a radio + dropdown
    // instead of manual CC fields. Use existing info when available.
    const ccOnFile = this.page.locator("text=Use existing card information");
    if (await ccOnFile.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Existing card info is pre-selected — proceed to submit
    } else {
      // No existing card info — fill manually
      await this.ccNumber.fill(ccDetails.cardNumber);

      // React Select dropdowns — type + Enter to commit selection
      await this.ccExpMonth.fill(ccDetails.expMonth);
      await this.ccExpMonth.press('Enter');
      await this.ccExpYear.fill(ccDetails.expYear);
      await this.ccExpYear.press('Enter');

      await this.ccCsc.fill(ccDetails.csc);
      await this.billingAddress.fill(ccDetails.address);
      await this.billingCity.fill(ccDetails.city);
      await this.billingState.fill(ccDetails.state);
      await this.billingZip.fill(ccDetails.zip);
    }

    await this.clickAndWaitForSpinner(this.submitPaymentButton);
  }

  /**
   * Creates a Credit Card Payment Arrangement via the UI modal.
   *
   * The Servicing Portal UI does NOT expose an explicit arrangementType (SETTLEMENT/NORMAL) field.
   * The backend determines arrangement_type automatically based on the payment covering the account balance:
   *   - Payment arrangement amount >= account balance → SETTLEMENT
   *   - Payment arrangement amount < account balance  → NORMAL
   *
   * Confirmed via manual testing 2026-03-17:
   *   - Account 4453 (small balance ~$100): arrangement → SETTLEMENT
   *   - Account 4438 (balance ~$2,566): partial payment → NORMAL
   *
   * The installment schedule auto-populates from Start Date + End Date + Frequency.
   * CC arrangements are synchronous — they complete (SUCCESS) within the same request.
   * Requires a card on file (uses existing card automatically).
   * By default the modal opens with Payment Type = "ACH Payment"; this method doesn't change it.
   * To test CC, call selectPaymentType('Credit Card Payment') before submitting,
   * or pass a `paymentType` option.
   */
  async makeCcPaymentArrangement(options: {
    startDate: string;  // MM/DD/YYYY
    endDate: string;    // MM/DD/YYYY
    frequency: 'Weekly' | 'BiWeekly' | 'Monthly' | 'SemiMonthly';
    /** Payment type to select. Default: 'Credit Card Payment'. The modal default is 'ACH Payment'. */
    paymentType?: string;
    /** Optional CC details for manual card entry instead of card on file. */
    ccDetails?: {
      cardNumber: string;
      cvc: string;
      expMonth: string;   // '09' / '12'
      expYear: string;    // '28' / '2028'
      /** Cardholder first name — must match customer first name (CC last-name check). */
      firstName: string;
      /** Cardholder last name — must match customer last name (CC last-name check). */
      lastName: string;
    };
  }): Promise<void> {
    await this.clickMakePayment();

    // Enable Payment Arrangement mode (click if not already checked)
    const arrangementCheckbox = this.page.locator(SELECTORS.paymentArrangementCheckbox);
    if (!await arrangementCheckbox.isChecked({ timeout: 3_000 }).catch(() => false)) {
      await arrangementCheckbox.click();
    }

    // Fill Start / End dates — wait for startDate to be visible after checkbox enables the section.
    // Use pressSequentially + Tab to trigger React's onChange/onBlur events reliably.
    const startDateLocator = this.page.locator(SELECTORS.arrangementStartDateInput);
    await startDateLocator.waitFor({ state: 'visible', timeout: 5_000 });
    await startDateLocator.click();
    await startDateLocator.pressSequentially(options.startDate, { delay: 50 });
    await startDateLocator.press('Tab');
    const endDateLocator = this.page.locator(SELECTORS.arrangementEndDateInput);
    await endDateLocator.click();
    await endDateLocator.pressSequentially(options.endDate, { delay: 50 });
    await endDateLocator.press('Tab');

    // Select Payment Frequency via React Select (click the container div, same pattern as selectPaymentType)
    await this.page.locator(SELECTORS.arrangementPaymentFrequencyDropdown).click();
    await this.page.locator(SELECTORS.filterOptionWithRole)
      .filter({ hasText: options.frequency })
      .first()
      .click();

    // Wait for installment table to auto-populate (at least 1 row)
    await this.page.locator(SELECTORS.arrangementInstallmentAmountInput(0))
      .waitFor({ state: 'visible', timeout: 10_000 });

    // Select payment type (default: Credit Card Payment; modal default is ACH Payment)
    const targetPaymentType = options.paymentType ?? 'Credit Card Payment';
    await this.selectPaymentType(targetPaymentType);

    // Fill CC details if provided (manual card entry instead of card on file)
    if (options.ccDetails) {
      // When account has a card on file, modal shows "Use existing card" (checked) and
      // "Use one-time card information" radios. Click the one-time radio to reveal manual fields.
      const oneTimeRadio = this.page.getByRole('radio', { name: 'Use one-time card information' });
      if (await oneTimeRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await oneTimeRadio.click();
      }
      // One-time card form: First Name, Last Name, Card Number, Expires On (MM/YY), Security Code
      await this.page.locator(SELECTORS.otCardFirstName).waitFor({ state: 'visible', timeout: 5_000 });
      await this.page.locator(SELECTORS.otCardFirstName).fill(options.ccDetails.firstName);
      await this.page.locator(SELECTORS.otCardLastName).fill(options.ccDetails.lastName);
      await this.ccNumber.fill(options.ccDetails.cardNumber);
      // Expires On is type="month" input — requires YYYY-MM format (e.g., "2028-12")
      const fullYear = options.ccDetails.expYear.length === 2
        ? `20${options.ccDetails.expYear}`
        : options.ccDetails.expYear;
      await this.page.locator(SELECTORS.otCardExpiresOn).fill(
        `${fullYear}-${options.ccDetails.expMonth}`,
      );
      await this.page.locator(SELECTORS.otCardSecurityCode).fill(options.ccDetails.cvc);
      // Use current address to auto-fill billing address
      const useCurrentAddr = this.page.getByRole('checkbox', { name: 'Use current address' });
      if (await useCurrentAddr.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await useCurrentAddr.check();
      }
    }

    // Submit and wait for spinner to clear
    await this.clickAndWaitForSpinner(this.submitPaymentButton);
  }

  async isTopBarVisible(): Promise<boolean> {
    return this.page.locator(SELECTORS.topBar).isVisible();
  }
}

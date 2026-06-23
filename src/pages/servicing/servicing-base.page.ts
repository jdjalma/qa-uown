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
  readonly routingNumber = this.page.getByRole('textbox', { name: /routing number/i });

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
    const useExistingRadio = this.page.getByRole('radio', { name: /existing bank/i });
    const bankOnFile = this.page.locator("text=Use existing bank information");
    let usedExisting = false;
    if (await bankOnFile.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // The "use existing bank" radio can be present but DISABLED when there is no
      // reusable bank account on file (a fresh account — the contract-phase bank
      // info isn't persisted as a selectable servicing bank). Checking a disabled
      // radio just times out, so only take the existing-bank path when the radio
      // is actually enabled; otherwise fall through to the new-bank fields below.
      const radioVisible = await useExistingRadio.isVisible({ timeout: 1_000 }).catch(() => false);
      const radioEnabled = radioVisible && await useExistingRadio.isEnabled().catch(() => false);
      if (radioEnabled) {
        await useExistingRadio.check();
        const accountSelect = this.page.locator(SELECTORS.existingBankAccountSelect).first();
        const selectVisible = await accountSelect.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
        if (selectVisible) {
          const optionValues = await accountSelect.locator('option').evaluateAll(opts =>
            opts.map(o => (o as HTMLOptionElement).value).filter(v => v !== ''),
          );
          if (optionValues.length > 0) {
            await accountSelect.selectOption(optionValues[0]);
            usedExisting = true;
          }
        }
      }
    }
    if (!usedExisting) {
      const useOneTimeRadio = this.page.getByRole('radio', { name: /one-time/i });
      const oneTimeVisible = await useOneTimeRadio.isVisible({ timeout: 1_000 }).catch(() => false);
      if (oneTimeVisible && await useOneTimeRadio.isEnabled().catch(() => false)) {
        await useOneTimeRadio.check();
      }
      await this.bankInstitute.fill(bankDetails.institute || 'Test Bank');
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
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    await this.clickMakePayment();
    await this.selectPaymentType('Credit Card Payment');

    const formattedDate = this.calculateDate(date);
    if (formattedDate !== 'NA') {
      await this.paymentDateInput.fill(formattedDate);
    }
    await this.paymentAmountInput.fill(amount);

    if (ccDetails.allocationStrategy) {
      const allocDropdown = this.page.locator(SELECTORS.allocationStrategyDropdown);
      if (await allocDropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await allocDropdown.click();
        await this.page.locator(SELECTORS.filterOptionWithRole)
          .filter({ hasText: ccDetails.allocationStrategy }).first().click();
      }
    }

    const useOneTimeRadio = this.page.getByRole('radio', { name: /one-time/i });
    if (await useOneTimeRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await useOneTimeRadio.check();
      await this.ccNumber.waitFor({ state: 'visible', timeout: 5_000 });
    }

    // One-time form may require cardholder name (stg+ portals)
    if (ccDetails.firstName) {
      const firstNameInput = this.page.getByPlaceholder('First Name');
      if (await firstNameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await firstNameInput.fill(ccDetails.firstName);
      }
    }
    if (ccDetails.lastName) {
      const lastNameInput = this.page.getByPlaceholder('Last Name');
      if (await lastNameInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await lastNameInput.fill(ccDetails.lastName);
      }
    }

    await this.ccNumber.fill(ccDetails.cardNumber);

    // Newer portals use a single "Expires On" field; older have separate month/year
    const expiresOn = this.page.getByPlaceholder('Expires On');
    if (await expiresOn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const year = ccDetails.expYear.length === 2 ? `20${ccDetails.expYear}` : ccDetails.expYear;
      await expiresOn.fill(`${year}-${ccDetails.expMonth}`);
    } else {
      await this.ccExpMonth.fill(ccDetails.expMonth);
      await this.ccExpMonth.press('Enter');
      await this.ccExpYear.fill(ccDetails.expYear);
      await this.ccExpYear.press('Enter');
    }

    const securityCode = this.page.getByPlaceholder('Card Security Code');
    if (await securityCode.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await securityCode.fill(ccDetails.csc);
    } else {
      await this.ccCsc.fill(ccDetails.csc);
    }

    // Check "Use current address" if available; otherwise fill manually
    const useCurrentAddr = this.page.getByRole('checkbox', { name: /use current address/i });
    if (await useCurrentAddr.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await useCurrentAddr.check();
    } else {
      await this.billingAddress.fill(ccDetails.address);
      await this.billingCity.fill(ccDetails.city);
      await this.billingState.fill(ccDetails.state);
      await this.billingZip.fill(ccDetails.zip);
    }

    await this.clickAndWaitForSpinner(this.submitPaymentButton);
  }

  /**
   * Fills the Payment Arrangement section of the Make Payment modal: opens the
   * modal, checks #paymentArrangement, fills Start/End dates, selects Frequency,
   * optionally selects the Arrangement Type, and waits for the installment
   * schedule to auto-populate. Leaves the modal open WITHOUT selecting a payment
   * type or submitting — callers (makeCcPaymentArrangement / makeAchPaymentArrangement)
   * finish the type-specific fields and submit.
   *
   * DOM-confirmed (dev3 acct 138, 2026-06-01):
   *   - #totalPaymentAmount is editable and auto-populates from the schedule.
   *   - Frequency dropdown options: Weekly | BiWeekly | Monthly | SemiMonthly,
   *     so "Weekly" matched as a substring also matches "BiWeekly" — use exact regex.
   *   - "Payment Arrangement Type" IS an explicit React Select (label[for=paymentArrangementType])
   *     with options NORMAL | SETTLEMENT. It is NOT purely backend-derived.
   */
  private async fillArrangementSchedule(options: {
    startDate: string;  // MM/DD/YYYY
    endDate: string;    // MM/DD/YYYY
    frequency: 'Weekly' | 'BiWeekly' | 'Monthly' | 'SemiMonthly';
    /** Optional explicit Arrangement Type ('NORMAL' | 'SETTLEMENT'). When omitted, the UI default is kept. */
    arrangementType?: 'NORMAL' | 'SETTLEMENT';
    /** Optional fixed total that overrides the auto-populated #totalPaymentAmount. */
    totalPaymentAmount?: string;
  }): Promise<void> {
    await this.clickMakePayment();

    // Enable Payment Arrangement mode (click if not already checked)
    const arrangementCheckbox = this.page.locator(SELECTORS.paymentArrangementCheckbox);
    if (!await arrangementCheckbox.isChecked({ timeout: 3_000 }).catch(() => false)) {
      await arrangementCheckbox.click();
    }

    // Fill Start / End dates using the native HTMLInputElement value setter.
    // These are date-picker inputs (type=search) that ignore pressSequentially —
    // React's synthetic onChange only fires when the native setter dispatches the event.
    // Pattern from application-wizard.page.ts (same DatePicker component).
    const startDateLocator = this.page.locator(SELECTORS.arrangementStartDateInput);
    await startDateLocator.waitFor({ state: 'visible', timeout: 5_000 });
    await this.page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
    }, { sel: SELECTORS.arrangementStartDateInput, val: options.startDate });

    const endDateLocator = this.page.locator(SELECTORS.arrangementEndDateInput);
    await endDateLocator.waitFor({ state: 'visible', timeout: 3_000 });
    await this.page.evaluate(({ sel, val }) => {
      const el = document.querySelector(sel) as HTMLInputElement | null;
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (nativeSetter) nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
    }, { sel: SELECTORS.arrangementEndDateInput, val: options.endDate });

    // Select Payment Frequency via React Select (click the container div, same pattern as selectPaymentType).
    // EXACT regex match — "Weekly" as substring also matches "BiWeekly" (DOM-confirmed).
    await this.page.locator(SELECTORS.arrangementPaymentFrequencyDropdown).click();
    await this.page.locator(SELECTORS.filterOptionWithRole)
      .filter({ hasText: new RegExp(`^${options.frequency}$`) })
      .first()
      .click();

    // Optionally select the explicit Arrangement Type (NORMAL/SETTLEMENT) React Select.
    if (options.arrangementType) {
      await this.page.locator(SELECTORS.arrangementTypeDropdown).click();
      await this.page.locator(SELECTORS.filterOptionWithRole)
        .filter({ hasText: new RegExp(`^${options.arrangementType}$`) })
        .first()
        .click();
    }

    // Wait for installment table to auto-populate (at least 1 row)
    await this.page.locator(SELECTORS.arrangementInstallmentAmountInput(0))
      .waitFor({ state: 'visible', timeout: 10_000 });

    // Optionally override the auto-populated total.
    if (options.totalPaymentAmount) {
      const totalInput = this.page.locator(SELECTORS.totalPaymentAmountInput);
      await totalInput.fill(options.totalPaymentAmount);
      await totalInput.press('Tab');
    }
  }

  /**
   * Creates a Credit Card Payment Arrangement via the UI modal.
   *
   * The installment schedule auto-populates from Start Date + End Date + Frequency.
   * CC arrangements are synchronous — they complete (status=SUCCESS) within the same request,
   * and the linked CC SALE transactions are created with payment_arrangement_pk set
   * (DOM/DB-confirmed dev3: arrangement pk72 acct141 → SALE APPROVED, payment_arrangement_pk=72).
   * Requires a card on file (uses existing card automatically) unless ccDetails is provided.
   * The modal opens with Payment Type = "ACH Payment"; this method switches it to the
   * target payment type (default 'Credit Card Payment') after the schedule is built.
   */
  async makeCcPaymentArrangement(options: {
    startDate: string;  // MM/DD/YYYY
    endDate: string;    // MM/DD/YYYY
    frequency: 'Weekly' | 'BiWeekly' | 'Monthly' | 'SemiMonthly';
    /** Optional explicit Arrangement Type ('NORMAL' | 'SETTLEMENT'). When omitted, the UI default is kept. */
    arrangementType?: 'NORMAL' | 'SETTLEMENT';
    /** Optional fixed total that overrides the auto-populated #totalPaymentAmount. */
    totalPaymentAmount?: string;
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
    await this.fillArrangementSchedule({
      startDate: options.startDate,
      endDate: options.endDate,
      frequency: options.frequency,
      arrangementType: options.arrangementType,
      totalPaymentAmount: options.totalPaymentAmount,
    });

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

  /**
   * Creates an ACH Payment Arrangement via the UI modal.
   *
   * The installment schedule auto-populates from Start Date + End Date + Frequency.
   * ACH arrangements are inserted synchronously with arrangement status=NOT_STARTED
   * (DB-confirmed dev3: arrangement pk77 acct138 → status=NOT_STARTED, payment_type=ACH).
   * The linked uown_sv_achpayment row(s) are created with payment_arrangement_pk set;
   * the row starts PENDING and the daily ACH sweep later promotes it to PICKED_TO_SEND
   * (same sweep timing as one-time ACH payments).
   *
   * When the account has a bank on file (funded accounts do), the modal defaults to
   * "Use existing bank information" with a select[name="bankAccountPk"] — this method
   * keeps that default. Pass `bankDetails` to use one-time bank info instead.
   * The modal opens with Payment Type already = "ACH Payment", so no type switch is needed.
   */
  async makeAchPaymentArrangement(options: {
    startDate: string;  // MM/DD/YYYY
    endDate: string;    // MM/DD/YYYY
    frequency: 'Weekly' | 'BiWeekly' | 'Monthly' | 'SemiMonthly';
    /** Optional explicit Arrangement Type ('NORMAL' | 'SETTLEMENT'). When omitted, the UI default is kept. */
    arrangementType?: 'NORMAL' | 'SETTLEMENT';
    /** Optional fixed total that overrides the auto-populated #totalPaymentAmount. */
    totalPaymentAmount?: string;
    /** Optional one-time bank details. When omitted, uses the bank on file (existing). */
    bankDetails?: {
      institute?: string;
      accountNumber: string;
      routingNumber: string;
    };
  }): Promise<void> {
    await this.fillArrangementSchedule({
      startDate: options.startDate,
      endDate: options.endDate,
      frequency: options.frequency,
      arrangementType: options.arrangementType,
      totalPaymentAmount: options.totalPaymentAmount,
    });

    // Modal default payment type is "ACH Payment" — ensure it is selected (idempotent).
    await this.selectPaymentType('ACH Payment');

    // Bank selection: prefer existing bank on file (funded accounts have one).
    const useExistingRadio = this.page.getByRole('radio', { name: /use existing bank/i });
    let usedExisting = false;
    if (!options.bankDetails && await useExistingRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (!await useExistingRadio.isChecked().catch(() => false)) {
        await useExistingRadio.check();
      }
      const accountSelect = this.page.locator(SELECTORS.existingBankAccountSelect).first();
      if (await accountSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const optionValues = await accountSelect.locator('option').evaluateAll(opts =>
          opts.map(o => (o as HTMLOptionElement).value).filter(v => v !== ''),
        );
        if (optionValues.length > 0) {
          await accountSelect.selectOption(optionValues[0]);
          usedExisting = true;
        }
      }
    }

    // Fall back to one-time bank details when no bank on file or bankDetails provided.
    if (!usedExisting) {
      const oneTimeRadio = this.page.getByRole('radio', { name: /one-time bank/i });
      if (await oneTimeRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await oneTimeRadio.click();
      }
      const details = options.bankDetails;
      if (details) {
        await this.bankInstitute.fill(details.institute || 'Test Bank');
        await this.bankAccountNumber.fill(details.accountNumber);
        await this.routingNumber.fill(details.routingNumber);
      }
    }

    // Submit and wait for spinner to clear
    await this.clickAndWaitForSpinner(this.submitPaymentButton);
  }

  async isTopBarVisible(): Promise<boolean> {
    return this.page.locator(SELECTORS.topBar).isVisible();
  }
}

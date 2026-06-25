/**
 * ApplicationWizardPage - Consumer-facing 3-page application form.
 *
 * Served by `apply-{env}.{brand}/{shortLivedToken}/start` (Next.js SPA).
 * Canonical entry: `origination-{env}.uownleasing.com/getApplication/{merchantCode}`
 * forwards to the wizard with a valid session. A direct hit on `/start` returns
 * "application link has expired".
 *
 * Wizard layout (validated live in qa1 2026-05-24, MR !1464):
 *   Page 1 (Your Info)     -> firstName, lastName, SSN, DOB, phone, email, address, zip, city
 *   Page 2 (Employment)    -> pay schedule, lastPayDate, nextPayDate, monthlyIncome
 *                             (employer name and employment duration were removed from the form)
 *   Page 3 (Disclaimer)    -> bankruptcy dropdown, 2 consent checkboxes, Submit
 */
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
  state?: string;
}

export interface EmploymentInfo {
  payFrequency?: string;
  lastPayDate: string;
  nextPayDate: string;
  monthlyIncome: string;
  // Kornerstone merchants require these three (asterisk on labels). UOWN treats
  // them as optional. Pass for KS, omit for UOWN.
  bankRoutingNumber?: string;
  bankAccountNumber?: string;
  creditCardBin?: string;
  /**
   * RightFoot consent checkbox (Task #1310). The block renders only when bank
   * routing OR account is provided. The checkbox is CHECKED by default when it
   * appears. Set `false` to explicitly uncheck (which disables NEXT). When
   * undefined the default state (checked) is left untouched.
   */
  rightFootConsentChecked?: boolean;
  /**
   * When false, fill the employment fields but do NOT click NEXT (so the test
   * can inspect Step 2 state — e.g. RightFoot consent visibility). Default true.
   */
  advance?: boolean;
}

export class ApplicationWizardPage extends BasePage {

  // Page 1: Personal Info

  async fillPersonalInfo(info: PersonalInfo): Promise<void> {
    await this.page.locator(SELECTORS.naMainFirstName).waitFor({ state: 'visible', timeout: 30_000 });

    // Address autocomplete is Radar (replaced Google Places in 2026). In qa1 the
    // Radar /config + /autocomplete endpoints return HTTP 402 (Payment Required),
    // so the SDK health-check fails and the form drops into MANUAL-ENTRY fallback
    // (Ticket #914): mainAddress1 / mainPostalCode / mainCity become enabled and
    // mainState stays disabled (auto-filled from ZIP). We rely on that fallback.
    //
    // IMPORTANT FILL ORDER (DOM-confirmed qa1 2026-06-01): the wizard runs a one-time
    // async form re-init in the first few seconds that WIPES firstName/lastName if
    // they are filled too early or while other fills are still committing. So we fill
    // SSN / DOB / phone / email / address / ZIP first, let the ZIP->state autofill
    // settle, and fill firstName/lastName LAST via pressSequentially (real keystrokes).
    // This is the only ordering that reliably enables NEXT. See investigation in
    // docs/taskTestingUown/R1.52.0_rightfootConsent_1310.
    await this.page.waitForTimeout(2_500);

    await this.page.locator(SELECTORS.naMainSsn).fill(info.ssn);
    await this.page.locator(SELECTORS.naMainDob).fill(info.dob);
    await this.page.locator(SELECTORS.naMainCellPhone).fill(info.phone);
    await this.page.locator(SELECTORS.naMainEmailAddress).fill(info.email);

    // Street Address: plain fill (Radar fallback leaves the field a normal input).
    await this.page.locator(SELECTORS.naMainAddress1).fill(info.address);
    // ZIP drives the (disabled) State field via auto-fill.
    await this.page.locator(SELECTORS.naMainPostalCode).fill(info.zipCode);
    await this.page.waitForTimeout(2_500);

    // City may auto-fill from ZIP; if not, fill manually (enabled in fallback).
    const cityValue = await this.page.locator(SELECTORS.naMainCity).inputValue().catch(() => '');
    if (!cityValue) {
      await this.page.locator(SELECTORS.naMainCity).fill(info.city);
    }

    // Let every async commit (state autofill, validation) settle before the names.
    await this.page.waitForTimeout(2_500);

    // firstName / lastName LAST, via real keystrokes, to survive the re-init wipe.
    await this.page.locator(SELECTORS.naMainFirstName).click();
    await this.page.locator(SELECTORS.naMainFirstName).pressSequentially(info.firstName, { delay: 30 });
    await this.page.locator(SELECTORS.naMainLastName).click();
    await this.page.locator(SELECTORS.naMainLastName).pressSequentially(info.lastName, { delay: 30 });

    const nextBtn = this.page.locator(SELECTORS.naSendApplicationNextBtn);
    await nextBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        return !!el && !el.disabled;
      },
      SELECTORS.naSendApplicationNextBtn,
      { timeout: 15_000 },
    );
    await nextBtn.click();
    await this.waitForSpinner();
    console.log('[ApplicationWizard] Page 1 (Personal Info) completed');
  }

  // Page 2: Employment Info

  async fillEmploymentInfo(info: EmploymentInfo): Promise<void> {
    await this.page.locator(SELECTORS.naMainMonthlyIncome).waitFor({ state: 'visible', timeout: 30_000 });

    if (info.payFrequency) {
      await this.selectPayFrequency(info.payFrequency);
    }

    await this.page.locator(SELECTORS.naMainLastPayDate).fill(info.lastPayDate);
    await this.page.locator(SELECTORS.naMainNextPayDate).fill(info.nextPayDate);
    await this.page.locator(SELECTORS.naMainMonthlyIncome).fill(info.monthlyIncome);

    if (info.bankRoutingNumber !== undefined) {
      await this.page.locator(SELECTORS.naMainBankRoutingNumber).fill(info.bankRoutingNumber);
    }
    if (info.bankAccountNumber !== undefined) {
      await this.page.locator(SELECTORS.naMainBankAccountNumber).fill(info.bankAccountNumber);
    }
    if (info.creditCardBin !== undefined) {
      await this.page.locator(SELECTORS.naMainCreditCardBin).fill(info.creditCardBin);
    }

    // RightFoot consent (Task #1310): the block renders only when routing OR
    // account is provided, and the checkbox is CHECKED by default. Only act when
    // the caller explicitly asks to uncheck (or re-check) it.
    if (info.rightFootConsentChecked !== undefined) {
      await this.page.locator(SELECTORS.naRightFootConsentSection)
        .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
      if (info.rightFootConsentChecked) {
        await this.checkRightFootConsent();
      } else {
        await this.uncheckRightFootConsent();
      }
    }

    if (info.advance === false) {
      console.log('[ApplicationWizard] Page 2 fields filled (advance=false, NEXT not clicked)');
      return;
    }

    const nextBtn = this.page.locator(SELECTORS.naSendApplicationNextBtn);
    await nextBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        return !!el && !el.disabled;
      },
      SELECTORS.naSendApplicationNextBtn,
      { timeout: 10_000 },
    );
    await nextBtn.click();
    await this.waitForSpinner();
    console.log('[ApplicationWizard] Page 2 (Employment Info) completed');
  }

  // ── Page 2: bank fields + RightFoot consent (Task #1310) ───────────────────

  /**
   * Fill the bank routing/account fields WITHOUT advancing. Either value can be
   * a non-empty string (sets the field) or '' (clears it, dispatching React
   * change). Pass `undefined` to leave a field untouched.
   */
  async fillBankFields(routing?: string, account?: string): Promise<void> {
    await this.page.locator(SELECTORS.naMainMonthlyIncome).waitFor({ state: 'visible', timeout: 30_000 });
    if (routing !== undefined) {
      await this.page.locator(SELECTORS.naMainBankRoutingNumber).fill(routing);
    }
    if (account !== undefined) {
      await this.page.locator(SELECTORS.naMainBankAccountNumber).fill(account);
    }
    // Give the conditional RightFoot block time to mount/unmount.
    await this.page.waitForTimeout(800);
  }

  /** Clear both bank routing and account fields (drives the consent block hidden). */
  async clearBankFields(): Promise<void> {
    await this.page.locator(SELECTORS.naMainBankRoutingNumber).fill('');
    await this.page.locator(SELECTORS.naMainBankAccountNumber).fill('');
    await this.page.waitForTimeout(800);
  }

  /** True when the RightFoot consent section is rendered and visible. */
  async isRightFootConsentVisible(): Promise<boolean> {
    return this.page.locator(SELECTORS.naRightFootConsentSection)
      .isVisible({ timeout: 5_000 }).catch(() => false);
  }

  /** Title text, e.g. "Uown Leasing uses Rightfoot to connect with your account". */
  async getRightFootConsentHeading(): Promise<string> {
    const text = await this.page.locator(SELECTORS.naRightFootConsentTitle).first().textContent();
    return (text ?? '').trim();
  }

  /** Full body/label text of the consent ("By checking this box ..."). */
  async getRightFootConsentBodyText(): Promise<string> {
    const text = await this.page.locator(SELECTORS.naRightFootConsentText).first().textContent();
    return (text ?? '').trim();
  }

  async checkRightFootConsent(): Promise<void> {
    const cb = this.page.locator(SELECTORS.naRightFootConsentChecked);
    await cb.waitFor({ state: 'attached', timeout: 10_000 });
    await cb.check({ force: true });
    await this.page.waitForTimeout(300);
  }

  async uncheckRightFootConsent(): Promise<void> {
    const cb = this.page.locator(SELECTORS.naRightFootConsentChecked);
    await cb.waitFor({ state: 'attached', timeout: 10_000 });
    await cb.uncheck({ force: true });
    await this.page.waitForTimeout(300);
  }

  async isRightFootConsentChecked(): Promise<boolean> {
    return this.page.locator(SELECTORS.naRightFootConsentChecked)
      .isChecked({ timeout: 5_000 }).catch(() => false);
  }

  /** Returns whether the Step 2 NEXT button is currently enabled (does NOT click). */
  async isNextButtonEnabled(): Promise<boolean> {
    const disabled = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLButtonElement | null;
      return el ? el.disabled : true;
    }, SELECTORS.naSendApplicationNextBtn);
    return !disabled;
  }

  /** Inline validation error text under the consent ('' when no error rendered). */
  async getRightFootConsentError(): Promise<string> {
    const err = this.page.locator(SELECTORS.naRightFootConsentError);
    if (await err.count() === 0) return '';
    const text = await err.first().textContent();
    return (text ?? '').trim();
  }

  /**
   * Yup error text under the bank routing number field ('' when no error).
   *
   * The error element has no stable id or role — error text is found by scanning
   * up to 6 ancestor levels of the input and collecting visible innerText from
   * following siblings that do not contain child inputs (excludes CC-BIN section).
   * Uses innerText so pseudo-element content is included.
   */
  async getBankRoutingNumberError(): Promise<string> {
    return this.page.evaluate((inputId: string) => {
      const input = document.querySelector(`#${inputId}`) as HTMLElement | null;
      if (!input) return '';
      let ancestor: HTMLElement = input;
      for (let depth = 0; depth < 6; depth++) {
        let sib = ancestor.nextElementSibling as HTMLElement | null;
        while (sib) {
          const text = sib.innerText?.trim();
          if (text && text.length < 200 && !sib.querySelector('input')) return text;
          sib = sib.nextElementSibling as HTMLElement | null;
        }
        if (!ancestor.parentElement) break;
        ancestor = ancestor.parentElement as HTMLElement;
        if (['FORM', 'SECTION', 'MAIN', 'BODY'].includes(ancestor.tagName)) break;
      }
      return '';
    }, 'mainBankRoutingNumber');
  }

  /**
   * Yup error text under the bank account number field ('' when no error).
   * Same ancestor-scanning strategy as getBankRoutingNumberError.
   */
  async getBankAccountNumberError(): Promise<string> {
    return this.page.evaluate((inputId: string) => {
      const input = document.querySelector(`#${inputId}`) as HTMLElement | null;
      if (!input) return '';
      let ancestor: HTMLElement = input;
      for (let depth = 0; depth < 6; depth++) {
        let sib = ancestor.nextElementSibling as HTMLElement | null;
        while (sib) {
          const text = sib.innerText?.trim();
          if (text && text.length < 200 && !sib.querySelector('input')) return text;
          sib = sib.nextElementSibling as HTMLElement | null;
        }
        if (!ancestor.parentElement) break;
        ancestor = ancestor.parentElement as HTMLElement;
        if (['FORM', 'SECTION', 'MAIN', 'BODY'].includes(ancestor.tagName)) break;
      }
      return '';
    }, 'mainBankAccountNumber');
  }

  /**
   * Clicks the label text body of the RightFoot consent (not any link within it) to
   * toggle the checkbox. Resolves the <label> via the checkbox id, then calls
   * label.click() which the browser translates to a checkbox toggle.
   */
  async clickConsentTextBody(): Promise<void> {
    await this.page.evaluate((sel) => {
      const cb = document.querySelector(sel) as HTMLInputElement | null;
      if (!cb) return;
      const label =
        (document.querySelector(`label[for="${cb.id}"]`) as HTMLElement | null) ??
        (cb.closest('label') as HTMLElement | null);
      label?.click();
    }, SELECTORS.naRightFootConsentChecked);
    await this.page.waitForTimeout(300);
  }

  /** All anchors inside the consent block with their resolved href + target. */
  async getRightFootConsentLinks(): Promise<Array<{ text: string; href: string; target: string }>> {
    return this.page.locator(SELECTORS.naRightFootConsentSection).locator('a').evaluateAll((nodes) =>
      nodes.map((a) => {
        const el = a as HTMLAnchorElement;
        return {
          text: (el.textContent ?? '').trim(),
          href: el.getAttribute('href') ?? '',
          target: el.getAttribute('target') ?? '',
        };
      }),
    );
  }

  /** Returns whether the Step 3 Submit button is currently enabled (does NOT click). */
  async isSubmitButtonEnabled(): Promise<boolean> {
    const disabled = await this.page.evaluate((sel) => {
      const el = document.querySelector(sel) as HTMLButtonElement | null;
      return el ? el.disabled : true;
    }, SELECTORS.naSendApplicationSubmitBtn);
    return !disabled;
  }

  // Page 3: Consent / Legal

  async fillConsentInfo(): Promise<void> {
    await this.page.locator(SELECTORS.naIsAgreedToStatements).waitFor({ state: 'visible', timeout: 30_000 });

    await this.selectBankruptcyNo();

    await this.page.locator(SELECTORS.naIsAgreedToStatements).check();
    await this.page.locator(SELECTORS.naIsAgreedToPrivacyPolicy).check();

    const submitBtn = this.page.locator(SELECTORS.naSendApplicationSubmitBtn);
    await submitBtn.waitFor({ state: 'visible', timeout: 5_000 });
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLButtonElement | null;
        return !!el && !el.disabled;
      },
      SELECTORS.naSendApplicationSubmitBtn,
      { timeout: 10_000 },
    );
    await submitBtn.click();
    await this.waitForSpinner();

    await this.page.locator(SELECTORS.naIsAgreedToStatements)
      .waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

    console.log('[ApplicationWizard] Page 3 (Consent) completed');
  }

  // Confirmation

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

  async completeWizard(personal: PersonalInfo, employment: EmploymentInfo): Promise<void> {
    await this.fillPersonalInfo(personal);
    await this.fillEmploymentInfo(employment);
    await this.fillConsentInfo();
    await this.waitForApprovalConfirmation();
  }

  // Private helpers

  private async selectPayFrequency(frequency: string): Promise<void> {
    // Page 2 has a single react-select combobox (Pay Schedule). Use role-based
    // locator + keyboard pattern (react-select supports type-to-filter + Enter).
    const combobox = this.page.getByRole('combobox').first();
    await combobox.waitFor({ state: 'visible', timeout: 5_000 });
    await combobox.click();
    await combobox.fill(frequency);
    await combobox.press('Enter');
  }

  async selectBankruptcyNo(): Promise<void> {
    // Page 3 has a single react-select combobox (Bankruptcy). Same pattern.
    const combobox = this.page.getByRole('combobox').first();
    if (!(await combobox.isVisible({ timeout: 3_000 }).catch(() => false))) return;
    await combobox.click();
    await combobox.fill('No');
    await combobox.press('Enter');
  }
}

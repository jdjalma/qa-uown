/**
 * TermsOfAgreementPage — second screen after MissingDataForm.
 *
 * Shows the contract summary (First Payment, EPO, # Payments, Total) + items + 2 checkboxes:
 *   - #isInfoConfirmed       — "I confirm all information is true and complete"
 *   - #isEverythingAgreed    — "I agree to Privacy Policy, T&C, Electronic Disclosures"
 *
 * After checking both and clicking "Proceed to signature", a modal with the GowSign iframe opens
 * (`AlternativeContractModalPage`).
 *
 * Form ID: `termsOfAgreementForm`
 */
import type { Locator } from '@playwright/test';
import { BasePage } from '../base.page.js';
import { SELECTORS } from '../../selectors/common.selectors.js';

/**
 * Outcome of {@link TermsOfAgreementPage.acceptAndProceedWithProtectionPlan}.
 *
 * - `buddyReached` — the "See Protection Benefits" button was visible and the
 *   Buddy purchase-insurance panel was opened. `false` means the merchant did
 *   NOT offer insurance (standard Proceed-to-signature path). Tests that REQUIRE
 *   the Buddy flow (insurance-enabled merchant) must assert `buddyReached === true`
 *   so a silent no-Buddy fallback fails instead of passing.
 * - `radioClicked` — an opt-in/opt-out choice was actually clicked on the Buddy
 *   widget. Only meaningful when `buddyReached === true`.
 */
export interface ProtectionPlanOutcome {
  buddyReached: boolean;
  radioClicked: boolean;
}

export interface TermsSummary {
  initialPayment: string;
  initialPaymentDueDate: string;
  earlyPurchaseOption: string;
  paymentFrequency: string;
  numberOfPayments: string;
  paymentAmount: string;
  totalPaymentAmount: string;
}

export class TermsOfAgreementPage extends BasePage {
  async waitForLoaded(timeoutMs = 30_000): Promise<void> {
    await this.page.locator('#termsOfAgreementForm').waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /**
   * Wait until the customer has proceeded past Terms into the e-sign step.
   *
   * Two real routes exist (DOM-confirmed on qa2, lead via CT-02, 2026-06-19):
   *   - GowSign / SignWell render the e-sign document as a MODAL OVERLAY on top of
   *     the Terms page — `#termsOfAgreementForm` stays in the DOM (just covered), so
   *     waiting for it to be `hidden` never resolves and times out.
   *   - Some plans navigate away entirely — the form is removed.
   *
   * The reliable signal is therefore the POSITIVE one: an e-sign provider iframe
   * (GowSign/SignWell/PandaDoc, matched by URL — immune to CSS-Module hash drift)
   * has attached. We race that against the legacy "form hidden" signal so both
   * routes pass. Resolves as soon as either condition holds.
   */
  async waitForLeftTermsPage(timeoutMs = 30_000): Promise<void> {
    const esignIframe = this.page
      .locator('iframe[src*="gowsign"], iframe[src*="signwell"], iframe[src*="pandadoc"]')
      .first();
    await Promise.race([
      esignIframe.waitFor({ state: 'attached', timeout: timeoutMs }),
      this.page.locator('#termsOfAgreementForm').waitFor({ state: 'hidden', timeout: timeoutMs }),
    ]);
  }

  async checkInfoConfirmed(): Promise<void> {
    await this.page.locator('#isInfoConfirmed').check();
  }

  async checkEverythingAgreed(): Promise<void> {
    await this.page.locator('#isEverythingAgreed').check();
  }

  async checkAll(): Promise<void> {
    await this.checkInfoConfirmed();
    await this.checkEverythingAgreed();
  }

  async clickProceedToSignature(): Promise<void> {
    await this.page.getByRole('button', { name: /proceed to signature/i }).click();
  }

  /** Convenience: checks the 2 checkboxes + clicks Proceed */
  async acceptAndProceed(): Promise<void> {
    await this.checkAll();
    await this.clickProceedToSignature();
  }

  /**
   * Convenience for merchants with `offerInsurance=true`: the primary button
   * becomes "See Protection Benefits" before reaching the signing iframe.
   *
   * Behavior:
   *   1. Checks the confirmation checkboxes
   *   2. If "See Protection Benefits" is visible → clicks it, opts in/out
   *      on the PP panel and clicks PROCEED TO SIGNATURE
   *   3. Otherwise → clicks PROCEED TO SIGNATURE directly (standard path)
   *
   * Hardening: returns `{ buddyReached, radioClicked }` so the test
   * can FAIL on a silent fallback (insurance merchant that does not open Buddy)
   * instead of passing green. Throws when the Buddy panel opened but no
   * opt-in/opt-out radio could be clicked — submitting blind would mask a render
   * regression of the widget (`@buddy-technology/offer-component ^1.7.1`). Callers that
   * only need to get through Terms (opt-out, no insurance) may ignore the
   * return value — the early-return yields `{ buddyReached:false, radioClicked:false }`.
   *
   * @param ppOptIn true = accept PP (creates a row in uown_los_protection_plan),
   *                false = decline
   * @returns outcome with `buddyReached`/`radioClicked` — see {@link ProtectionPlanOutcome}
   * @throws if the Buddy panel opened but no radio could be clicked
   */
  async acceptAndProceedWithProtectionPlan(ppOptIn: boolean): Promise<ProtectionPlanOutcome> {
    await this.checkAll();

    const seeProtectionBtn = this.page.locator(SELECTORS.seeProtectionBenefitsBtn).first();
    const hasInsurance = await seeProtectionBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasInsurance) {
      // Standard, non-insurance path. Not a Buddy flow → buddyReached=false.
      await this.clickProceedToSignature();
      return { buddyReached: false, radioClicked: false };
    }

    await seeProtectionBtn.scrollIntoViewIfNeeded();
    await seeProtectionBtn.click();

    // PP opt-in/out page. Two radios — order: 0=opt-in, 1=opt-out.
    const submitBtn = this.page.locator(SELECTORS.purchaseInsuranceSubmitBtn);
    await submitBtn.waitFor({ state: 'visible', timeout: 30_000 });

    // Render guard (rule #14): the Buddy offer element must be present & non-empty
    // before we interact. A layout regression in the `^1.7.1` bump renders an empty
    // host → radios never mount → blind submit would pass. Surface it as a throw.
    const offer = this.page.locator(SELECTORS.buddyOfferElement).first();
    await offer.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {
      throw new Error(
        '[ProtectionPlan] Buddy offer element not visible after opening "See Protection Benefits" — '
          + 'possible offer-component ^1.7.1 render regression',
      );
    });

    // Buddy widget radios may live in main page OR in a buddy.insure iframe.
    // Retry a few times to give the widget a chance to render. Use check() with a
    // proper change-event dispatch (force-click bypasses React onChange).
    let radioClicked = false;
    for (let attempt = 0; attempt < 5 && !radioClicked; attempt++) {
      const mainRadios = this.page.getByRole('radio');
      const mainCount = await mainRadios.count().catch(() => 0);
      if (mainCount >= 2) {
        radioClicked = await this.selectProtectionRadio(mainRadios.nth(ppOptIn ? 0 : 1));
        if (radioClicked) break;
      }
      for (const frame of this.page.frames()) {
        if (frame === this.page.mainFrame()) continue;
        const frameRadios = frame.getByRole('radio');
        const frameCount = await frameRadios.count().catch(() => 0);
        if (frameCount >= 2) {
          radioClicked = await this.selectProtectionRadio(frameRadios.nth(ppOptIn ? 0 : 1));
          if (radioClicked) break;
        }
      }
      if (!radioClicked) {
        await submitBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      }
    }

    // Hardening: never submit blind. A non-clicked radio means the widget
    // failed to render its choices — submitting anyway would record an arbitrary
    // default and the test would pass on a broken widget.
    if (!radioClicked) {
      throw new Error(
        `[ProtectionPlan] could not click opt-${ppOptIn ? 'in' : 'out'} radio on the Buddy widget `
          + '(no frame exposed >= 2 radios after 5 attempts) — refusing to submit blind',
      );
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    return { buddyReached: true, radioClicked: true };
  }

  /**
   * Already-covered (cross-coverage) variant of the Buddy step.
   *
   * When the customer's email already has an ACTIVE Uown Protection Plus enrollment
   * (a prior lease on the same email opted in), the widget does NOT render the
   * opt-in/opt-out radios — it shows "Our records indicate that you're already
   * enrolled!" plus only a PROCEED TO SIGNATURE button (DOM-proven 2026-06-21, qa2,
   * CT-05). acceptAndProceedWithProtectionPlan would (correctly) throw here
   * because there are 0 radios — this method is the cross-coverage counterpart.
   *
   * @returns `{ alreadyEnrolled }` — true when the already-enrolled panel was detected
   *          (the UI-level proof of cross-coverage). Always clicks PROCEED TO SIGNATURE.
   */
  async acceptProtectionPlanAlreadyEnrolled(): Promise<{ alreadyEnrolled: boolean }> {
    await this.checkAll();

    const seeProtectionBtn = this.page.locator(SELECTORS.seeProtectionBenefitsBtn).first();
    if (await seeProtectionBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await seeProtectionBtn.scrollIntoViewIfNeeded();
      await seeProtectionBtn.click();
    }

    // PROCEED TO SIGNATURE is the sync point — present in BOTH the already-enrolled
    // panel and the normal radio panel.
    const submitBtn = this.page.locator(SELECTORS.purchaseInsuranceSubmitBtn);
    await submitBtn.waitFor({ state: 'visible', timeout: 30_000 });

    // Detect the already-enrolled copy (main page OR the buddy.insure iframe).
    const enrolledRe = /already enrolled|already receiving|records indicate/i;
    let alreadyEnrolled = enrolledRe.test(await this.page.locator('body').innerText().catch(() => ''));
    if (!alreadyEnrolled) {
      for (const frame of this.page.frames()) {
        if (frame === this.page.mainFrame()) continue;
        if (enrolledRe.test(await frame.locator('body').innerText().catch(() => ''))) {
          alreadyEnrolled = true;
          break;
        }
      }
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    return { alreadyEnrolled };
  }

  /**
   * Click a Buddy opt-in/opt-out radio and verify it actually became checked.
   * Mirrors the proven approach in ContractPage.completeProtectionPlan: prefer
   * check(); if React did not register it, fall back to a synthetic click+change.
   * Returns true only when the radio is confirmed checked.
   */
  private async selectProtectionRadio(radio: Locator): Promise<boolean> {
    await radio.check({ force: true }).catch(async () => {
      await radio.click({ force: true }).catch(() => {});
    });
    let checked = await radio.isChecked({ timeout: 2_000 }).catch(() => false);
    if (!checked) {
      await radio
        .evaluate((el) => {
          (el as HTMLInputElement).click();
          (el as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));
        })
        .catch(() => {});
      checked = await radio.isChecked({ timeout: 1_000 }).catch(() => false);
    }
    return checked;
  }

  async getSummary(): Promise<TermsSummary> {
    // Prefix-based [class*=] avoids coupling to the webpack hash suffix (e.g. __rotPG, __pVs0U)
    const desc = '[class*="termsOfAgreement__form__container__body__description"]';
    const span = '[class*="termsOfAgreement__form__container__body__span"]';

    const spans = this.page.locator(span);
    const descs = this.page.locator(desc);

    return {
      initialPayment: ((await spans.nth(0).textContent()) ?? '').trim(),
      initialPaymentDueDate: ((await spans.nth(1).textContent()) ?? '').trim(),
      earlyPurchaseOption: ((await this.page
        .locator('.font-family-gotham-bold.font-size_18px')
        .first()
        .textContent()) ?? '').trim(),
      paymentFrequency: ((await descs.nth(0).textContent()) ?? '').trim(),
      numberOfPayments: ((await descs.nth(1).textContent()) ?? '').trim(),
      paymentAmount: ((await descs.nth(2).textContent()) ?? '').trim(),
      totalPaymentAmount: ((await descs.nth(3).textContent()) ?? '').trim(),
    };
  }

  async getLeaseItems(): Promise<Array<{ modelNumber: string; description: string; itemPrice: string }>> {
    const rows = this.page.locator('.rdt_TableBody .rdt_TableRow');
    const count = await rows.count();
    const items: Array<{ modelNumber: string; description: string; itemPrice: string }> = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      items.push({
        modelNumber: ((await row.locator('[data-column-id="1"]').textContent()) ?? '').trim(),
        description: ((await row.locator('[data-column-id="2"]').textContent()) ?? '').trim(),
        itemPrice: ((await row.locator('[data-column-id="3"]').textContent()) ?? '').trim(),
      });
    }

    return items;
  }
}

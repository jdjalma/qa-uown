/**
 * TermsOfAgreementPage — segunda tela apos MissingDataForm.
 *
 * Mostra resumo do contrato (First Payment, EPO, # Payments, Total) + items + 2 checkboxes:
 *   - #isInfoConfirmed       — "I confirm all information is true and complete"
 *   - #isEverythingAgreed    — "I agree to Privacy Policy, T&C, Electronic Disclosures"
 *
 * Apos marcar ambos e clicar "Proceed to signature", abre modal com iframe GowSign
 * (`AlternativeContractModalPage`).
 *
 * Form ID: `termsOfAgreementForm`
 */
import { BasePage } from '../base.page.js';

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

  /** Conveniencia: marca os 2 checkboxes + clica Proceed */
  async acceptAndProceed(): Promise<void> {
    await this.checkAll();
    await this.clickProceedToSignature();
  }

  /**
   * Conveniencia para merchants com `offerInsurance=true`: o botao primario
   * vira "See Protection Benefits" antes de chegar ao iframe de assinatura.
   *
   * Comportamento:
   *   1. Marca os checkboxes de confirmacao
   *   2. Se "See Protection Benefits" estiver visivel → clica, opta in/out
   *      no painel de PP e clica PROCEED TO SIGNATURE
   *   3. Senao → clica PROCEED TO SIGNATURE direto (caminho standard)
   *
   * @param ppOptIn true = aceitar PP (cria row em uown_los_protection_plan),
   *                false = recusar
   */
  async acceptAndProceedWithProtectionPlan(ppOptIn: boolean): Promise<void> {
    await this.checkAll();

    const seeProtectionBtn = this.page
      .locator('button:has-text("See Protection Benefits")')
      .first();
    const hasInsurance = await seeProtectionBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!hasInsurance) {
      await this.clickProceedToSignature();
      return;
    }

    await seeProtectionBtn.scrollIntoViewIfNeeded();
    await seeProtectionBtn.click();

    // PP opt-in/out page. Two radios — order: 0=opt-in, 1=opt-out.
    const submitBtn = this.page.locator('#purchase-insurance-submit-btn');
    await submitBtn.waitFor({ state: 'visible', timeout: 30_000 });

    // Buddy widget radios may live in main page OR in a buddy.insure iframe.
    // Retry a few times to give the widget a chance to render.
    let radioClicked = false;
    for (let attempt = 0; attempt < 5 && !radioClicked; attempt++) {
      const mainRadios = this.page.getByRole('radio');
      const mainCount = await mainRadios.count().catch(() => 0);
      if (mainCount >= 2) {
        await mainRadios.nth(ppOptIn ? 0 : 1).click({ force: true });
        radioClicked = true;
        break;
      }
      for (const frame of this.page.frames()) {
        if (frame === this.page.mainFrame()) continue;
        const frameRadios = frame.getByRole('radio');
        const frameCount = await frameRadios.count().catch(() => 0);
        if (frameCount >= 2) {
          await frameRadios.nth(ppOptIn ? 0 : 1).click({ force: true });
          radioClicked = true;
          break;
        }
      }
      if (!radioClicked) await this.page.waitForTimeout(2_000);
    }

    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
  }

  async getSummary(): Promise<TermsSummary> {
    const desc = '.terms-of-agreement-form_termsOfAgreement__form__container__body__description__rotPG';
    const span = '.terms-of-agreement-form_termsOfAgreement__form__container__body__span__pVs0U';

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

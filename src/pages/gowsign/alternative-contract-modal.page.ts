/**
 * AlternativeContractModalPage — modal UOwn que embeda o iframe GowSign.
 *
 * Aparece apos cliente submeter `TermsOfAgreementPage` ("Proceed to signature").
 *
 * Estrutura observada em qa2:
 *   .modal-content
 *     ├── header: "Please Review and Sign Your Leasing Agreement" + close (X)
 *     └── .alternative-contract-vendor_iframeContainer__yAn5c
 *         └── iframe.alternative-contract-vendor_iframe__nSb3A
 *             src=https://test.gowsign.com/document/{uuid}?embedMode=true
 *
 * O nome de classe `alternative-contract-vendor` e o discriminator entre
 * GowSign (alternative) e Signwell (default).
 *
 * Use `getGowSignFrame()` para obter um `FrameLocator` e operar dentro do iframe
 * com `GowSignDocumentViewerPage` ou interacoes diretas.
 */
import type { FrameLocator } from '@playwright/test';
import { BasePage } from '../base.page.js';

export class AlternativeContractModalPage extends BasePage {
  async waitForOpen(timeoutMs = 30_000): Promise<void> {
    await this.page
      .locator('.alternative-contract-vendor_iframeContainer__yAn5c')
      .waitFor({ state: 'visible', timeout: timeoutMs });
  }

  /**
   * Retorna FrameLocator para o iframe GowSign embed dentro do modal.
   * Use isso para operar dentro do conteudo GowSign (canvas, inputs, submit).
   */
  getGowSignFrame(): FrameLocator {
    return this.page.frameLocator('iframe.alternative-contract-vendor_iframe__nSb3A');
  }

  /** URL do iframe (extrai o documentId do GowSign) */
  async getIframeSrc(): Promise<string | null> {
    return this.page
      .locator('iframe.alternative-contract-vendor_iframe__nSb3A')
      .getAttribute('src');
  }

  async getDocumentIdFromIframeSrc(): Promise<string | null> {
    const src = await this.getIframeSrc();
    if (!src) return null;
    const match = src.match(/\/document\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    return match ? match[1] : null;
  }

  async getModalTitle(): Promise<string> {
    return ((await this.page
      .locator('.modal-content .index-module_font_24px__AGMET')
      .first()
      .textContent()) ?? '').trim();
  }

  /**
   * Fecha o modal sem assinar.
   *
   * O X visual e um SVG dentro de um container com `cursor: pointer` mas que
   * Playwright nao considera "visible" (provavelmente container colapsado).
   * Estrategia: dispatchEvent('click') diretamente no SVG via JS — burla o
   * checador de visibilidade do Playwright e dispara o handler React/Vue.
   */
  async clickClose(): Promise<void> {
    const ok = await this.page.evaluate(() => {
      const svg = document.querySelector(
        '.modal-content svg[data-icon="xmark-large"]',
      ) as SVGElement | null;
      const target = svg?.closest('button, [role="button"], [class*="cursor_pointer"], span, div') ?? svg;
      if (!target) return false;
      target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    });
    if (!ok) throw new Error('Modal close (X) target not found');
  }

  async isOpen(): Promise<boolean> {
    return this.page
      .locator('.alternative-contract-vendor_iframeContainer__yAn5c')
      .isVisible()
      .catch(() => false);
  }

  /**
   * Clica o botao "Close document" DENTRO do iframe GowSign (NAO o X do modal
   * pai). Esse e o caminho que dispara o postMessage `closed` para o backend
   * — sem ele, o documento permanece em SENT_TO_CUSTOMER mesmo apos fechar
   * a UI (validado empiricamente: doc 13472 → event_name=closed +
   * redirect_url contendo document_status=canceled).
   *
   * O botao tem `aria-label="Close document"` no iframe.
   */
  async clickCloseDocumentInIframe(timeoutMs = 15_000): Promise<void> {
    const closeBtn = this.getGowSignFrame()
      .locator('button[aria-label="Close document"]')
      .first();
    await closeBtn.waitFor({ state: 'visible', timeout: timeoutMs });
    await closeBtn.click({ timeout: timeoutMs });
  }
}

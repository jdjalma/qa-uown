/**
 * EXPLORATORIO — captura HTML do widget de assinatura GowSign via fluxo UI completo.
 *
 * Fluxo em qa2 (TireAgent):
 *   1. createPreQualifiedApplication → lead em UW_APPROVED
 *   2. sendInvoice → backend gera invoice + paymentDetailsList[].redirectUrl
 *   3. UI: navega pro redirectUrl
 *   4. UI: MissingDataForm (preenche CC)
 *   5. UI: TermsOfAgreement (2 checkboxes + Proceed)
 *   6. UI: Modal abre com iframe GowSign
 *   7. UI dentro do iframe: captura HTML pre-Start
 *   8. UI dentro do iframe: clica Start → captura widget interativo
 *
 * Output: test-results/gowsign-widget-{timestamp}/
 *
 * Tag: @explore — rodar com:
 *   npx playwright test tests/e2e/gowsign/_explore-signing-widget.spec.ts --headed
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildTestData } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { GowSignDocumentViewerPage, AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';

const data = {
  state: 'CA',
  // TireAgent em qa2 (pk=34) usa GOWSIGN — confirmado por leads 15704/15705/15716 SIGNED.
  // O catalogo do projeto mapeia 'TireAgent' → username 'tireAgent' (credentials).
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
};

test.describe('GowSign — explore signing widget HTML', { tag: ['@explore', '@e2e', '@sandbox'] }, () => {

  test('drive lead → fill UI 3 screens → capture iframe widget HTML', async ({
    page,
    api,
    ctx,
  }, testInfo) => {
    test.setTimeout(420_000);

    const { merchant, applicant, order } = buildTestData({
      state: data.state,
      merchant: data.merchant,
      orderTotal: data.orderTotal,
      orderDescription: 'GowSign widget exploration',
    });

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = join('test-results', `gowsign-widget-${ts}`);
    await mkdir(outDir, { recursive: true });
    console.log(`[explore] artefatos serao salvos em: ${outDir}`);

    let contractUrl = '';

    await test.step('API: lead pre-qualificado (UW_APPROVED), depois invoice → redirectUrl', async () => {
      // Pre-qualifica lead — para em UW_APPROVED, sem CC auth, sem submit
      const preQualResult = await createPreQualifiedApplication(
        api,
        merchant,
        applicant,
        ctx,
        { skipPaymentInfo: true },
        testInfo,
      );
      console.log(`[explore] pre-qualified leadPk=${ctx.leadPk} approved=$${preQualResult.approvedAmount}`);

      // sendInvoice — gera paymentDetailsList[].redirectUrl
      const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
      expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

      const paymentDetailsList = invoiceResp.body?.paymentDetailsList ?? [];
      contractUrl = paymentDetailsList[0]?.redirectUrl ?? '';
      expect(contractUrl, 'redirectUrl should be present').toBeTruthy();
      console.log(`[explore] redirectUrl=${contractUrl}`);
    });

    await test.step('UI Tela 1: navega para redirectUrl + preenche MissingDataForm', async () => {
      await page.goto(contractUrl);

      const missingData = new MissingDataFormPage(page);
      try {
        await missingData.waitForLoaded(60_000);
      } catch {
        await page.screenshot({ path: join(outDir, '01-NO-missing-data.png'), fullPage: true });
        await writeFile(join(outDir, '01-NO-missing-data.html'), await page.content());
        throw new Error('MissingDataForm did not appear');
      }

      await page.screenshot({ path: join(outDir, '01-missing-data-form.png'), fullPage: true });

      // CC valido para qa2 — Visa test card
      await missingData.fillAndSubmit({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        cardNumber: '4111111111111111',
        cvc: '123',
        expiration: '12/2030',
      });
    });

    await test.step('UI Tela 2: TermsOfAgreement (checkboxes + Proceed)', async () => {
      const terms = new TermsOfAgreementPage(page);
      await terms.waitForLoaded(120_000);

      await page.screenshot({ path: join(outDir, '02-terms-of-agreement.png'), fullPage: true });

      const summary = await terms.getSummary().catch(() => null);
      const items = await terms.getLeaseItems().catch(() => []);
      await writeFile(
        join(outDir, '02-terms-summary.json'),
        JSON.stringify({ summary, items }, null, 2),
      );

      await terms.acceptAndProceed();
    });

    await test.step('UI Tela 3: Modal abre com iframe GowSign', async () => {
      const modal = new AlternativeContractModalPage(page);
      await modal.waitForOpen(120_000);

      const iframeSrc = await modal.getIframeSrc();
      const documentId = await modal.getDocumentIdFromIframeSrc();
      console.log(`[explore] iframe src=${iframeSrc}`);
      console.log(`[explore] documentId=${documentId}`);

      await page.screenshot({ path: join(outDir, '03-modal-opened.png'), fullPage: true });
      await writeFile(
        join(outDir, '03-modal-info.json'),
        JSON.stringify({ iframeSrc, documentId }, null, 2),
      );
    });

    await test.step('Iframe content (pre-Start) — aguarda loading spinner sumir', async () => {
      const modal = new AlternativeContractModalPage(page);
      const gowSignFrame = modal.getGowSignFrame();

      await gowSignFrame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

      // Aguarda o loading spinner do GowSign desaparecer
      const loadingSpinner = gowSignFrame.locator('.animate-spinSmooth, .animate-pulse');
      try {
        await loadingSpinner.first().waitFor({ state: 'detached', timeout: 30_000 });
      } catch {
        // Pode nao detach — tenta hidden tambem
        await loadingSpinner.first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
      }
      // Buffer pra renderizacao completar
      await page.waitForTimeout(3_000);

      const preStartHtml = await gowSignFrame.locator('body').innerHTML();
      await writeFile(join(outDir, '04-iframe-pre-start.html'), preStartHtml);
      await page.screenshot({ path: join(outDir, '04-iframe-pre-start.png'), fullPage: true });
    });

    await test.step('Click Start dentro do iframe + captura widget interativo', async () => {
      const modal = new AlternativeContractModalPage(page);
      const gowSignFrame = modal.getGowSignFrame();

      const startButton = gowSignFrame.locator('#startSignatureButton');
      // Force click — em alguns cenarios o Playwright reporta isVisible=false
      // mesmo quando o botao esta na tela (issue conhecido de iframe scroll)
      try {
        await startButton.scrollIntoViewIfNeeded({ timeout: 5_000 });
        await startButton.click({ timeout: 5_000 });
        console.log('[explore] Start clicked');
      } catch (e) {
        console.log(`[explore] Start click failed: ${e instanceof Error ? e.message : String(e)}`);
        await page.screenshot({ path: join(outDir, '05-start-click-failed.png'), fullPage: true });
      }

      // Aguarda preauth_choice aparecer (sinal de widget ativo) ou timeout
      await gowSignFrame
        .locator('input[name^="preauth_choice"]')
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 })
        .catch(() => {});
      await page.waitForTimeout(2_000);

      const postStartHtml = await gowSignFrame.locator('body').innerHTML();
      await writeFile(join(outDir, '05-iframe-post-start.html'), postStartHtml);
      await page.screenshot({ path: join(outDir, '05-iframe-post-start.png'), fullPage: true });
    });

    await test.step('Click no Sign button → captura HTML com modal ativo', async () => {
      const modal = new AlternativeContractModalPage(page);
      const gowSignFrame = modal.getGowSignFrame();

      // O botao "Sign" (visivel no header pos-Start) abre o modal de assinatura
      const signBtn = gowSignFrame.getByRole('button', { name: /^Sign$/i });
      const signVisible = await signBtn.isVisible().catch(() => false);
      if (!signVisible) {
        console.log('[explore] Sign button NOT visible — modal flow may differ');
        return;
      }

      try {
        await signBtn.first().click({ timeout: 5_000 });
        console.log('[explore] Sign button clicked');
        await page.waitForTimeout(2_000);

        const modalActiveHtml = await gowSignFrame.locator('body').innerHTML();
        await writeFile(join(outDir, '07-iframe-modal-active.html'), modalActiveHtml);
        await page.screenshot({ path: join(outDir, '07-iframe-modal-active.png'), fullPage: true });

        // Tenta desenhar no canvas visivel
        const canvas = gowSignFrame.locator('canvas:visible').first();
        const visible = await canvas.isVisible().catch(() => false);
        if (visible) {
          const box = await canvas.boundingBox();
          if (box) {
            await page.mouse.move(box.x + 10, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2, { steps: 15 });
            await page.mouse.up();
            await page.waitForTimeout(500);
            await page.screenshot({ path: join(outDir, '08-canvas-drawn.png'), fullPage: true });

            // Captura HTML com canvas desenhado + Save habilitado
            const drawnHtml = await gowSignFrame.locator('body').innerHTML();
            await writeFile(join(outDir, '08-iframe-canvas-drawn.html'), drawnHtml);
          }
        }
      } catch (e) {
        console.log(`[explore] Sign flow failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    });

    await test.step('Extract element summary inside iframe (pos-Start)', async () => {
      const modal = new AlternativeContractModalPage(page);
      const gowSignFrame = modal.getGowSignFrame();

      const summary = await gowSignFrame.locator('body').evaluate((body) => {
        const result: Record<string, unknown> = {};
        result.canvases = Array.from(body.querySelectorAll('canvas')).map((c) => ({
          width: (c as HTMLCanvasElement).width,
          height: (c as HTMLCanvasElement).height,
          id: c.id,
          className: c.className,
          visible: (c as HTMLElement).offsetParent !== null,
        }));
        result.inputs = Array.from(body.querySelectorAll('input')).map((i) => ({
          type: (i as HTMLInputElement).type,
          name: (i as HTMLInputElement).name,
          id: i.id,
          placeholder: (i as HTMLInputElement).placeholder,
          required: (i as HTMLInputElement).required,
          visible: (i as HTMLElement).offsetParent !== null,
        }));
        result.checkboxes = Array.from(body.querySelectorAll('input[type="checkbox"]')).map((c) => ({
          name: (c as HTMLInputElement).name,
          id: (c as HTMLInputElement).id,
          checked: (c as HTMLInputElement).checked,
          required: (c as HTMLInputElement).required,
          labelText: (c.closest('label')?.textContent || c.parentElement?.textContent || '')
            .trim().slice(0, 100),
        }));
        result.buttons = Array.from(body.querySelectorAll('button')).map((b) => ({
          text: ((b as HTMLButtonElement).textContent || '').trim().slice(0, 80),
          id: b.id,
          ariaLabel: b.getAttribute('aria-label'),
          type: (b as HTMLButtonElement).type,
          disabled: (b as HTMLButtonElement).disabled,
          visible: (b as HTMLElement).offsetParent !== null,
        }));
        result.dataTestids = Array.from(body.querySelectorAll('[data-testid]')).map((e) => ({
          testid: e.getAttribute('data-testid'),
          tag: e.tagName,
          text: (e.textContent || '').trim().slice(0, 80),
        }));
        result.dataAttrs = Array.from(
          body.querySelectorAll('[data-field-type], [data-signer], [data-required], [data-action]'),
        ).map((e) => ({
          tag: e.tagName,
          attrs: Object.fromEntries(
            Array.from(e.attributes)
              .filter((a) => a.name.startsWith('data-'))
              .map((a) => [a.name, a.value]),
          ),
          text: (e.textContent || '').trim().slice(0, 80),
        }));
        return result;
      });

      await writeFile(
        join(outDir, '06-iframe-element-summary.json'),
        JSON.stringify(summary, null, 2),
      );

      console.log(`\n[explore] elementos detectados dentro do iframe POS-Start:`);
      console.log(`  canvases:   ${(summary.canvases as unknown[]).length}`);
      console.log(`  inputs:     ${(summary.inputs as unknown[]).length}`);
      console.log(`  checkboxes: ${(summary.checkboxes as unknown[]).length}`);
      console.log(`  buttons:    ${(summary.buttons as unknown[]).length}`);
      console.log(`  testids:    ${(summary.dataTestids as unknown[]).length}`);
      console.log(`  data-attrs: ${(summary.dataAttrs as unknown[]).length}`);
    });
  });
});

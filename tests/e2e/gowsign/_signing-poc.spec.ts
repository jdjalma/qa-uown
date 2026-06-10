/**
 * POC — valida o helper `signGowSignInFrame` end-to-end.
 *
 * Fluxo em qa2 (TireAgent):
 *   1. createPreQualifiedApplication → lead UW_APPROVED
 *   2. sendInvoice → paymentDetailsList[].redirectUrl
 *   3. UI: MissingDataForm + TermsOfAgreement → modal abre com iframe GowSign
 *   4. signGowSignInFrame() — automatiza assinatura completa via Type mode
 *   5. Validacao DB: lead_status='SIGNED', esign_document.status='Completed'
 *
 * Pre-req: DB tunnel qa2 ativo (porta 5445).
 *
 * Tag: @poc — rodar com:
 *   npx playwright test tests/e2e/gowsign/_signing-poc.spec.ts --headed
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import {
  signGowSignInFrame,
  installPostMessageRecorder,
} from '@helpers/gowsign-signing.helper.js';
import {
  waitForLeadStatus,
  waitForEsignDocumentStatus,
  getEsignDocumentByLeadPk,
} from '@helpers/esign-db.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';

const data = {
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
};

test.describe(
  'GowSign — signing helper POC',
  { tag: ['@poc', '@e2e', '@qa2'] },
  () => {

    test('signGowSignInFrame completa assinatura → lead SIGNED + doc Completed', async ({
      page,
      api,
      ctx,
      db,
    }, testInfo) => {
      test.setTimeout(420_000);

      const { merchant, applicant, order } = buildTestData({
        state: data.state,
        merchant: data.merchant,
        orderTotal: data.orderTotal,
        orderDescription: 'GowSign signing POC',
      });

      // postMessage recorder DEVE ser instalado antes do page.goto
      await installPostMessageRecorder(page);

      let contractUrl = '';

      await test.step('API: pre-qualifica lead + sendInvoice → redirectUrl', async () => {
        await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          { skipPaymentInfo: true },
          testInfo,
        );

        const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
        expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
        contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
        expect(contractUrl, 'redirectUrl required').toBeTruthy();
        console.log(`[poc] leadPk=${ctx.leadPk} url=${contractUrl}`);
      });

      await test.step('UI: MissingDataForm (CC valido)', async () => {
        await page.goto(contractUrl);
        const missingData = new MissingDataFormPage(page);
        await missingData.waitForLoaded(60_000);
        await missingData.fillAndSubmit({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          cardNumber: '4111111111111111',
          cvc: '123',
          expiration: '12/2030',
        });
      });

      await test.step('UI: TermsOfAgreement → Proceed', async () => {
        const terms = new TermsOfAgreementPage(page);
        await terms.waitForLoaded(120_000);
        await terms.acceptAndProceed();
      });

      await test.step('UI: modal abre com iframe GowSign', async () => {
        const modal = new AlternativeContractModalPage(page);
        await modal.waitForOpen(120_000);
        const docId = await modal.getDocumentIdFromIframeSrc();
        console.log(`[poc] gowsign documentId=${docId}`);
        expect(docId).toBeTruthy();
      });

      await test.step('Helper: signGowSignInFrame() completa assinatura', async () => {
        const modal = new AlternativeContractModalPage(page);
        const frame = modal.getGowSignFrame();

        // Aguarda iframe carregar (loading spinner sumir)
        await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
        await frame
          .locator('.animate-spinSmooth, .animate-pulse')
          .first()
          .waitFor({ state: 'detached', timeout: 30_000 })
          .catch(() => {});

        const result = await signGowSignInFrame(page, frame, {
          preauthChoice: 'yes',
          fontIndex: 0,
          waitForCompleted: true,
        });

        console.log(`[poc] sign result:`, JSON.stringify(result, null, 2));

        expect(result.startClicked, 'Start button clicked').toBe(true);
        expect(result.preauthMarked, 'preauth marked').toBe('yes');
        expect(result.fieldsSigned, 'at least 1 field signed').toBeGreaterThan(0);
        expect(result.signClicked, 'final Sign clicked').toBe(true);
      });

      await test.step('DB: lead_status → SIGNED', async () => {
        const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', {
          timeoutMs: 60_000,
        });
        expect(status).toBe('SIGNED');
      });

      await test.step('DB: esign_document.client=GOWSIGN + status=SIGNED', async () => {
        const doc = await getEsignDocumentByLeadPk(db, ctx.leadPk!);
        expect(doc, 'esign_document row should exist').toBeTruthy();
        expect(doc!.esignClient).toBe('GOWSIGN');

        // GOWSIGN actual statuses observed: SENT_TO_CUSTOMER → SIGNED
        const signed = await waitForEsignDocumentStatus(
          db,
          doc!.pk,
          'SIGNED',
          { timeoutMs: 60_000 },
        );
        expect(signed.documentStatus).toBe('SIGNED');
        expect(signed.signedDateTime).not.toBeNull();
      });
    });
  },
);

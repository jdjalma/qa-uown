/**
 * SCRATCH / THROWAWAY — svc#544 "Add New York GowSign Template".
 *
 * Completes the GowSign signing ceremony for a FRESH New York 13-month lease
 * end-to-end (CC pre-auth → Terms → GowSign iframe Start/Sign/Finish) and
 * validates the signing activity log (rule #13). Mirrors the proven LSE-06
 * flow in `gowsign-signing-completion.spec.ts`, switching customer state to NY
 * (same ONLINE merchant OW90218-0001 → routes by customer state → NY_2025_SAC).
 *
 * NOT a regression test — DELETE after the COMPLETED evidence is captured.
 *
 * Run: ENV=qa2 npx playwright test tests/e2e/gowsign/__scratch_ny_signing_completion_svc544.spec.ts --project=cross-portal
 * Pre-req: DB tunnel qa2 active.
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
  getEsignDocumentByLeadPk,
  getLeadStatusTransitions,
} from '@helpers/esign-db.helpers.js';
import { sleep } from '@helpers/common.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';

const data = { state: 'NY', merchant: 'TireAgent', orderTotal: '800' };

test.describe('svc#544 NY GowSign Signing Completion', { tag: ['@qa2', '@hybrid'] }, () => {
  test('NY 13m lease signs end-to-end → SIGNED + esign SIGNED + activity log', async ({
    page, api, ctx, db,
  }, testInfo) => {
    test.setTimeout(420_000);

    const { merchant, applicant } = buildTestData({
      state: data.state,
      merchant: data.merchant,
      orderTotal: data.orderTotal,
      orderDescription: 'svc#544 NY GowSign signing completion',
    });

    await installPostMessageRecorder(page);
    let contractUrl = '';

    await test.step('API: pre-qualify NY lead → invoice → redirectUrl', async () => {
      await createPreQualifiedApplication(
        api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
      );
      const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
      expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
      contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
      expect(contractUrl, 'redirectUrl required').toBeTruthy();
      console.log(`[svc544] leadPk=${ctx.leadPk} contractUrl=${contractUrl}`);
    });

    await test.step('UI: CC pre-auth + Terms → GowSign modal opens', async () => {
      await page.goto(contractUrl);
      const missingData = new MissingDataFormPage(page);
      await missingData.waitForLoaded(60_000);
      // cardholder name = applicant name → satisfies the CC last-name match (BR-02)
      await missingData.fillAndSubmit({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        cardNumber: '4111111111111111',
        cvc: '123',
        expiration: '12/2030',
      });
      const terms = new TermsOfAgreementPage(page);
      await terms.waitForLoaded(120_000);
      await terms.acceptAndProceedWithProtectionPlan(false);

      const modal = new AlternativeContractModalPage(page);
      await modal.waitForOpen(120_000);
      const docId = await modal.getDocumentIdFromIframeSrc();
      expect(docId, 'GowSign documentId in iframe src').toBeTruthy();
    });

    await test.step('Helper: signGowSignInFrame() completes ceremony', async () => {
      const modal = new AlternativeContractModalPage(page);
      const frame = modal.getGowSignFrame();
      await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
      await frame
        .locator('.animate-spinSmooth, .animate-pulse')
        .first()
        .waitFor({ state: 'detached', timeout: 30_000 })
        .catch(() => {});

      const result = await signGowSignInFrame(page, frame, {
        preauthChoice: 'yes', fontIndex: 0, waitForCompleted: true,
      });
      console.log(`[svc544] signing result: ${JSON.stringify(result)}`);
      expect(result.startClicked, 'Start clicked').toBe(true);
      expect(result.signClicked, 'final Sign clicked').toBe(true);
    });

    await test.step('DB: lead_status → SIGNED', async () => {
      const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 90_000 });
      expect(status).toBe('SIGNED');
    });

    await test.step('DB: esign_document GOWSIGN signed (doc_signed_time_stamp not null)', async () => {
      // The "signed" status string is drift-prone (skill says COMPLETED, older spec
      // expects SIGNED) — poll the definitive signal (doc_signed_time_stamp) and LOG
      // the actual status value rather than guessing the enum.
      let doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
      expect(doc, 'esign_document row should exist').toBeTruthy();
      expect(doc!.esignClient).toBe('GOWSIGN');
      const deadline = Date.now() + 90_000;
      while (Date.now() < deadline && (!doc || doc.signedDateTime === null)) {
        await sleep(3_000);
        doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
      }
      console.log(`[svc544] esign_document: status="${doc!.documentStatus}" signedDateTime=${doc!.signedDateTime} client=${doc!.esignClient}`);
      expect(doc!.signedDateTime, 'doc_signed_time_stamp should be set after signing').not.toBeNull();
    });

    await test.step('Activity log (rule #13): transition lands in SIGNED', async () => {
      const transitions = await getLeadStatusTransitions(db, Number(ctx.leadPk));
      const toSigned = transitions.find((t) => t.to === 'SIGNED');
      expect(
        toSigned,
        `expected a transition to SIGNED — got ${JSON.stringify(transitions.map((t) => `${t.from}→${t.to}`))}`,
      ).toBeTruthy();
    });
  });
});

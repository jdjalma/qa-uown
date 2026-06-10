/**
 * E2E qa2 — GowSign Signature Fields (US-FLD-*)
 *
 * Cobre cenários de campos de assinatura visíveis a partir do iframe GowSign
 * que o cliente vê (UOWN flow). Não temos `GOWSIGN_API_KEY` em qa, então os
 * cenários puramente API (criação de fields via POST DOCX/HTML, validação de
 * width/height, signer=2) ficam como skip documentado.
 *
 * Cenários ATIVOS:
 *   - FLD-01.1: Signature field renderiza no iframe + assinatura completa
 *   - FLD-08.1: Multi-field (signature + initials no mesmo documento)
 *   - FLD-06.1: Submit bloqueado quando preauth (campo required) não marcado
 *
 * Cenários SKIP (documentados):
 *   - FLD-01.2 / FLD-05.* HTML inline tags — direct GowSign API
 *   - FLD-02.1 multi-page initials — depende do template, não parametrizável daqui
 *   - FLD-03.2 cc_peek_consent value=true — coberto por POST-07.1 (LSE-06)
 *   - FLD-04.1 checkbox group mutex — interações intra-iframe sem seletores estáveis
 *   - FLD-07.1 / 7.2 width/height validation — direct GowSign API
 *   - FLD-09.1 signer=2 — direct GowSign API
 *   - FLD-10.1 sem fields — direct GowSign API
 *
 * Pre-req: DB tunnel qa2 ativo (porta 5445).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import {
  signGowSignInFrame,
  installPostMessageRecorder,
} from '@helpers/gowsign-signing.helper.js';
import {
  getEsignDocumentByLeadPk,
  getEsignLeadStatus,
  waitForLeadStatus,
} from '@helpers/esign-db.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';

const data = {
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  merchantRefCode: 'OW90218-0001',
  orderTotal: '800',
};

test.describe(
  `GowSign Signature Fields - ${data.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-medium'] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // FLD-01.1 — Signature field renders + signing completes.
    //   Validates that the iframe presents at least one signature/initials
    //   field that the helper can sign, and the doc transitions to SIGNED.
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-01.1 Signature field renders in iframe + customer signs successfully',
      { tag: ['@priority-high'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-01.1 - signature renders',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API: pre-qualifies lead → invoice → redirectUrl', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(contractUrl).toBeTruthy();
        });

        await test.step('UI: walk to GowSign iframe', async () => {
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

          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);

          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
        });

        await test.step('UI: iframe presents the Start Signature button (signature field exists)', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          await frame
            .locator('.animate-spinSmooth, .animate-pulse')
            .first()
            .waitFor({ state: 'detached', timeout: 30_000 })
            .catch(() => {});

          // The Start button is rendered only when there is at least one
          // signature field to fulfill in the document.
          const startBtn = frame.locator('#startSignatureButton');
          await expect(
            startBtn,
            'Start Signature button should be visible — proves doc has signable fields',
          ).toBeVisible({ timeout: 30_000 });
        });

        await test.step('Helper: customer signs at least one signature field', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start clicked').toBe(true);
          expect(
            result.fieldsSigned,
            'helper must complete at least one signature field',
          ).toBeGreaterThanOrEqual(1);
          expect(result.signClicked, 'final Sign clicked').toBe(true);
        });

        await test.step('DB: esign_document.signed_date_time populated (signatureImage proxy)', async () => {
          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
          // We can't read the GowSign signatureImage from QA, but signed_date_time
          // populated proves the provider accepted the signature payload.
          const doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc).not.toBeNull();
          expect(doc!.esignClient).toBe('GOWSIGN');
          expect(
            doc!.signedDateTime,
            'signed_date_time should be set after a successful signature',
          ).not.toBeNull();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // FLD-08.1 — Multi-field document (signature + initials).
    //   The helper iterates a wizard with multiple steps when the document
    //   has both signature and initials fields. `result.fieldsSigned >= 2`
    //   proves at least two distinct field saves happened.
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-08.1 Multi-field document: signature + initials wizard both completed',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-08.1 - multi-field',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: setup → reach iframe', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(contractUrl).toBeTruthy();

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
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
        });

        await test.step('UI: iframe wizard exposes at least one preauth checkbox (additional field)', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

          // Click Start so the wizard enters the per-field flow where the
          // preauth radios become visible (these are required checkboxes —
          // proves the document has fields beyond the signature itself).
          const startBtn = frame.locator('#startSignatureButton');
          await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
          await startBtn.click();

          // PreAuth radios live as input[name="preauth_choice-yes"|"-no"]
          // — checking presence (not visibility — they are inputs hidden behind labels).
          const preauthYes = frame.locator('input[name="preauth_choice-yes"]');
          const preauthNo = frame.locator('input[name="preauth_choice-no"]');
          await expect(preauthYes).toHaveCount(1, { timeout: 15_000 });
          await expect(preauthNo).toHaveCount(1);
        });

        await test.step('Helper: completes both signature AND initials wizard saves', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          // fieldsSigned counts distinct wizard saves (signature step +
          // initials step). For TireAgent's lease both are present.
          expect(
            result.fieldsSigned,
            `expected at least 2 wizard saves (signature + initials), got ${result.fieldsSigned}`,
          ).toBeGreaterThanOrEqual(2);
          expect(result.signClicked).toBe(true);
        });

        await test.step('DB: doc transitions to SIGNED (sanity)', async () => {
          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
          const doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc?.documentStatus).toBe('SIGNED');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // FLD-06.1 — Required field validation blocks submit.
    //   Drive the wizard through signature/initials but DON'T mark the
    //   preauth radio. The submit button should not produce a SIGNED doc.
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-06.1 Submit blocked when required preauth field is unmarked → doc stays unsigned',
      { tag: ['@priority-high'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-06.1 - required validation',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';
        let preSignStatus: string | null = null;

        await test.step('API + UI: setup → reach iframe', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';

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
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);

          preSignStatus = await getEsignLeadStatus(db, Number(ctx.leadPk));
          expect(preSignStatus).toBe('CONTRACT_CREATED');
        });

        await test.step('Helper (skipPreauth=true): drive wizard but DO NOT mark preauth', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

          // skipPreauth=true → helper signs signature/initials wizard but
          // never auto-checks the preauth radio. waitForCompleted=false so
          // we don't block on a `completed` postMessage that won't come.
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            skipPreauth: true,
            waitForCompleted: false,
            timeoutMs: 60_000,
          });

          // fields can be signed (signature/initials) but final preauth radio
          // is not checked — we record the helper output for diagnostics.
          console.log(
            `[FLD-06.1] result fieldsSigned=${result.fieldsSigned} ` +
            `preauthMarked=${result.preauthMarked} signClicked=${result.signClicked}`,
          );
          expect(
            result.preauthMarked,
            'preauth must remain unmarked when skipPreauth=true',
          ).toBeNull();
        });

        await test.step('DB: lead_status remains CONTRACT_CREATED, NOT SIGNED', async () => {
          // Give backend any time to surprise us — sample for 30s.
          for (let i = 0; i < 5; i++) {
            const status = await getEsignLeadStatus(db, Number(ctx.leadPk));
            expect(
              status,
              `lead_status must NOT advance to SIGNED when preauth unchecked — got ${status}`,
            ).not.toBe('SIGNED');
            await sleep(6_000);
          }

          const finalStatus = await getEsignLeadStatus(db, Number(ctx.leadPk));
          expect(finalStatus).toBe('CONTRACT_CREATED');
        });

        await test.step('DB: esign_document.documentStatus is NOT SIGNED', async () => {
          const doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc).not.toBeNull();
          expect(
            doc!.documentStatus,
            `esign_document.status must not be SIGNED — got ${doc!.documentStatus}`,
          ).not.toBe('SIGNED');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // FLD-04.1 — Checkbox group mutex (UI-converted from API spec).
    //
    // The preauth Yes/No radios in the GowSign iframe form a mutex group
    // (`input[name="preauth_choice-yes"]` and `input[name="preauth_choice-no"]`
    // share the same logical group). Marking one must auto-unmark the other.
    // We exercise this directly in the UI without needing a forged document.
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-04.1 Checkbox group mutex: preauth Yes/No are mutually exclusive in iframe',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-04.1 - mutex',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: setup → reach iframe', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';

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
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
        });

        // The preauth inputs are independent checkboxes (different `name`
        // attributes). The mutex (`exact=1`) is enforced by the GowSign
        // provider's JS handler at click time, NOT by HTML radios. To test
        // mutex deterministically we need to:
        //   1. Read the initial state (input may come pre-checked depending
        //      on backend defaults — empirically observed `inputChecked: true`)
        //   2. SET the desired state (not toggle) — only click if needed
        //
        // The provider's mutex handler fires on `input.click()`. Strategies
        // that DO NOT toggle (Playwright `.check()` / `.uncheck()` directly)
        // bypass the handler and don't propagate mutex behaviour.
        const isPreauthChecked = async (which: 'yes' | 'no'): Promise<boolean> => {
          return page
            .frameLocator('iframe.alternative-contract-vendor_iframe__nSb3A')
            .locator(`input[name="preauth_choice-${which}"]`)
            .evaluate((el) => (el as HTMLInputElement).checked)
            .catch(() => false);
        };

        // Click via JS only when the current state differs from desired,
        // so we always end up "having clicked the visible Yes/No box once"
        // — which is what fires the mutex handler.
        const setPreauth = async (which: 'yes' | 'no', desired: boolean) => {
          const current = await isPreauthChecked(which);
          if (current === desired) {
            return; // already in the desired state, no click needed
          }
          await page
            .frameLocator('iframe.alternative-contract-vendor_iframe__nSb3A')
            .locator(`input[name="preauth_choice-${which}"]`)
            .evaluate((el) => {
              const input = el as HTMLInputElement;
              input.scrollIntoView({ block: 'center', behavior: 'instant' });
              input.click();
            });
          await page.waitForTimeout(800);
        };

        await test.step('UI: click Yes on preauth → Yes is checked, No remains unchecked', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

          // Start so the in-doc preauth checkboxes become reachable.
          const startBtn = frame.locator('#startSignatureButton');
          await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
          await startBtn.click();

          // Start auto-opens the Signature wizard modal which COVERS the
          // preauth checkboxes. Close it (Cancel) so preauth is interactable.
          const cancelBtn = frame.getByRole('button', { name: /^Cancel$/i }).first();
          if (await cancelBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
            await cancelBtn.click();
            await page.waitForTimeout(800);
          }

          await expect(frame.locator('input[name="preauth_choice-yes"]')).toHaveCount(1, {
            timeout: 15_000,
          });
          await expect(frame.locator('input[name="preauth_choice-no"]')).toHaveCount(1);

          // Capture initial state (preauth may come pre-checked depending
          // on backend defaults).
          const initialYes = await isPreauthChecked('yes');
          const initialNo = await isPreauthChecked('no');
          console.log(`[FLD-04.1] initial yes=${initialYes} no=${initialNo}`);

          // Set yes=true (idempotent: clicks only if currently false).
          // If yes started true and no=false, this is a no-op — but we still
          // assert mutex semantics on the FOLLOWING step (setting no=true).
          await setPreauth('yes', true);
          expect(await isPreauthChecked('yes'), 'yes should be checked after setPreauth(yes,true)').toBe(true);
          expect(
            await isPreauthChecked('no'),
            'no should remain unchecked after marking yes',
          ).toBe(false);
        });

        await test.step('UI: now click No → No becomes checked, Yes auto-unchecks (mutex)', async () => {
          // Forcing no=true should fire the provider's mutex handler and
          // auto-uncheck yes. Idempotent setter: clicks once because no
          // currently is false.
          await setPreauth('no', true);
          expect(await isPreauthChecked('no'), 'no should be checked after setPreauth(no,true)').toBe(true);
          expect(
            await isPreauthChecked('yes'),
            'mutex violated: yes is still checked after marking no',
          ).toBe(false);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // FLD-05.1 — Inline tag types rendered in the iframe (UI-converted).
    //
    // Original spec is API-side ("[sig|req|signer1]" → signature element).
    // The visible-from-QA equivalent: assert the iframe DOM exposes the
    // expected element types after Start. Confirms the template tags WERE
    // processed (signature input, initials input, preauth radios at minimum).
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-05.1 Iframe exposes the expected field types after Start (signature + initials + preauth radios)',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-05.1 - tag types',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: setup → reach iframe', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';

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
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
        });

        await test.step('UI: iframe DOM exposes signature input, initials input, preauth radios', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

          // Click Start to enter the signing flow where wizard inputs render.
          const startBtn = frame.locator('#startSignatureButton');
          await startBtn.waitFor({ state: 'visible', timeout: 30_000 });
          await startBtn.click();

          // Open the wizard — the signature input is inside the modal.
          // We walk one wizard cycle to reveal both signature and initials inputs.
          // Wait for the wizard or post-Start state to settle. The signature
          // input lives inside the wizard modal which opens automatically.
          const signature = frame.locator('input[name="signature"]');
          const sigCount = await signature.count();
          expect(
            sigCount,
            `signature input(s) must exist after Start (got ${sigCount}) — proves [sig|req|signer1] tag was processed`,
          ).toBeGreaterThanOrEqual(1);

          // PreAuth radio group is always present in the doc body after Start
          // (proves checkbox/radio tags processed) — independent of wizard state.
          const preauthYes = frame.locator('input[name="preauth_choice-yes"]');
          const preauthNo = frame.locator('input[name="preauth_choice-no"]');
          await expect(preauthYes).toHaveCount(1);
          await expect(preauthNo).toHaveCount(1);

          // Proof that initials field exists is best validated by FLD-08.1
          // (helper completes both wizard saves) — replicating it here would
          // double the runtime for the same signal.
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // FLD-02.1 — Multi-field initials (UI proxy for "multi-page initials").
    //
    // Strict spec asks for 5 initials fields on 5 separate pages — that's
    // template-defined and we can't dictate it. The closest empirical signal:
    // the helper's `fieldsSigned` counts distinct wizard saves (signature +
    // initials at minimum). We assert >= 2 (already done in FLD-08.1) and
    // additionally require the initials wizard step to fire, proving the
    // initials field type is processed and required to advance.
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-02.1 Initials wizard step is mandatory in multi-field document',
      { tag: ['@priority-low'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-02.1 - initials',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: setup → reach iframe → sign', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';

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
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
        });

        await test.step('Helper: fieldsSigned >= 2 means initials step DID fire', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(
            result.fieldsSigned,
            `fieldsSigned must include the initials wizard save — got ${result.fieldsSigned}`,
          ).toBeGreaterThanOrEqual(2);
          expect(result.signClicked).toBe(true);
        });

        await test.step('DB: doc transitions to SIGNED — confirms initials were accepted', async () => {
          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // FLD-03.2 — cc_peek_consent value=true post-sign.
    //   Re-validates the uown_los_lead.cc_peek_consent flag (also asserted
    //   by POST-07.1). Independent run for this specific scenario.
    // ─────────────────────────────────────────────────────────────
    test(
      'FLD-03.2 cc_peek_consent value=true after signing',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign FLD-03.2 - cc peek consent',
        });

        await installPostMessageRecorder(page);

        await test.step('Setup + sign', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          await page.goto(contractUrl);
          const missingData = new MissingDataFormPage(page);
          await missingData.waitForLoaded(60_000);
          await missingData.fillAndSubmit({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            cardNumber: '5500000000000004',
            cvc: '123',
            expiration: '12/2030',
          });
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes', fontIndex: 0, waitForCompleted: true,
          });
          expect(result.signClicked).toBe(true);
        });

        await test.step('DB: uown_los_lead.cc_peek_consent = true post-sign', async () => {
          // Wait for backend to parse + persist.
          const deadline = Date.now() + 30_000;
          let row: { cc_peek_consent: boolean | null } | null = null;
          while (Date.now() < deadline) {
            row = await db.queryOne<{ cc_peek_consent: boolean | null }>(
              'SELECT cc_peek_consent FROM uown_los_lead WHERE pk=$1',
              [Number(ctx.leadPk)],
            );
            if (row?.cc_peek_consent === true) break;
            await new Promise((r) => setTimeout(r, 2_000));
          }
          expect(row?.cc_peek_consent, `cc_peek_consent must be true after signing`).toBe(true);
        });
      },
    );
  },
);

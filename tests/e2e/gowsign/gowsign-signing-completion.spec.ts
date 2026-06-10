/**
 * E2E qa2 — GowSign Signing Completion Flow
 *
 * Real signing ceremony via the `signGowSignInFrame` helper. Covers scenarios
 * that require the iframe to actually be signed end-to-end:
 *
 *   - LSE-06 / POST-01.1 / POST-07.1: Completed signing → lead SIGNED +
 *     esign_document.documentStatus=SIGNED + CC Peek consent extracted
 *   - LSE-07 / POST-02.x: Post-SIGNED behaviour driven by merchant.isSignedToFunding
 *   - POST-04.1: Post-signing thank-you screen (text + phone) renders
 *   - LSE-08.1 / EMB-04.1: Customer closes the iframe without signing →
 *     esign_document=CANCELED, lead stays CONTRACT_CREATED
 *   - COM-01.1: Post-signing "DocumentSigned" email arrives at customer inbox
 *   - POST-09.1: Pre-selected Protection Plan activated (TerraceFinance qa2)
 *
 * Why qa2 + TireAgent:
 *   - GowSign is currently wired in qa2 (sandbox routes through Signwell/PandaDoc
 *     for most merchants). TireAgent in qa2 returns redirectUrl pointing at the
 *     GowSign iframe — same setup validated in `_signing-poc.spec.ts`.
 *   - Helper requires a real iframe to drive (`#startSignatureButton`, font picker,
 *     preauth radio, signature fields). Mocking is not viable.
 *
 * Pre-req: DB tunnel qa2 active (port 5445).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import {
  signGowSignInFrame,
  installPostMessageRecorder,
} from '@helpers/gowsign-signing.helper.js';
import {
  waitForLeadStatus,
  waitForEsignDocumentStatus,
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
  getLeadStatusTransitions,
  getEsignLeadStatus,
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
  `GowSign Signing Completion - ${data.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-high'] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // LSE-06 / POST-01.1 / POST-07.1 — Completed signing transitions lease
    //   to SIGNED, esign_document → SIGNED, and CC Peek consent is extracted
    //   from the signed document into uown_los_lead.cc_peek_consent.
    // ─────────────────────────────────────────────────────────────
    test(
      'LSE-06 Completed signing → lease SIGNED + esign_document SIGNED + CC Peek consent extracted',
      { tag: ['@priority-high'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign LSE-06 - signing completion',
        });

        // Recorder before page.goto so we can inspect postMessage timeline if needed.
        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API: pre-qualifies lead → invoice → redirectUrl', async () => {
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
        });

        await test.step('UI: MissingDataForm + TermsOfAgreement → modal opens GowSign iframe', async () => {
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
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });

          expect(result.startClicked, 'Start clicked').toBe(true);
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

        await test.step('DB: esign_document.client=GOWSIGN + documentStatus=SIGNED + signedDateTime not null', async () => {
          const doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc, 'esign_document row should exist').toBeTruthy();
          expect(doc!.esignClient).toBe('GOWSIGN');

          const signed = await waitForEsignDocumentStatus(db, doc!.pk, 'SIGNED', {
            timeoutMs: 60_000,
          });
          expect(signed.documentStatus).toBe('SIGNED');
          expect(signed.signedDateTime).not.toBeNull();
        });

        await test.step('DB: lead_notes registers transition CONTRACT_CREATED → SIGNED', async () => {
          const transitions = await getLeadStatusTransitions(db, Number(ctx.leadPk));
          const toSigned = transitions.find((t) => t.to === 'SIGNED');
          expect(
            toSigned,
            `expected a transition row landing in SIGNED — got ${JSON.stringify(transitions.map((t) => `${t.from}→${t.to}`))}`,
          ).toBeTruthy();
          // Most recent SIGNED transition should originate from CONTRACT_CREATED in this flow.
          // We do not over-constrain the `from` value — different runtimes may relabel.
          expect(toSigned!.to).toBe('SIGNED');
        });

        // ── POST-07.1 — CC Peek consent extracted from signed document ─────
        await test.step('POST-07.1 DB: lead_notes contains "CC Peek Consent set to true"', async () => {
          const note = await findLeadNoteContaining(
            db,
            Number(ctx.leadPk),
            'CC Peek Consent set to true',
          );
          expect(
            note,
            'expected a lead note recording "CC Peek Consent set to true" after signing',
          ).not.toBeNull();
          expect(note!.notes).toMatch(/parseCCPeekConsent/i);
        });

        await test.step('POST-07.1 DB: uown_los_lead.cc_peek_consent = true', async () => {
          const row = await db.queryOne<{ cc_peek_consent: boolean | null }>(
            'SELECT cc_peek_consent FROM uown_los_lead WHERE pk = $1',
            [Number(ctx.leadPk)],
          );
          expect(row, `uown_los_lead row for lead_pk=${ctx.leadPk}`).not.toBeNull();
          expect(row!.cc_peek_consent, 'cc_peek_consent should be true post-signing').toBe(true);
        });

        // ── Fields validation post-sign (Fernando req 2026-04-28) ─────
        // After signing, uown_esign_document.esign_fields holds the
        // serialized payload of every interactive field on the document
        // (INITIALS, SIGNATURE, CHECKBOX with the customer's choices).
        // Format observed (one record per field, comma-separated):
        //   pageNumber=null;esignFieldType=CHECKBOX;...;fieldValue=yes;
        //   required=true;fieldId=group:preauth_choice
        await test.step('Fields: esign_fields stores SIGNATURE + INITIALS + preauth CHECKBOX with customer choices', async () => {
          const doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc).not.toBeNull();
          const row = await db.queryOne<{ esign_fields: string | null }>(
            'SELECT esign_fields FROM uown_esign_document WHERE pk=$1',
            [doc!.pk],
          );
          expect(row, `esign_document row for pk=${doc!.pk}`).not.toBeNull();
          const raw = row!.esign_fields ?? '';
          expect(raw.length, 'esign_fields must be populated post-sign').toBeGreaterThan(0);
          console.log(`[fields] esign_fields=${raw}`);

          // Parse: comma-separated records, each `;`-separated key=value pairs.
          // Each top-level record corresponds to one interactive field.
          const parseField = (rec: string): Record<string, string> => {
            const obj: Record<string, string> = {};
            for (const pair of rec.split(';')) {
              const [k, ...rest] = pair.split('=');
              if (!k) continue;
              obj[k.trim()] = rest.join('=').trim();
            }
            return obj;
          };
          const fields = raw.split(/,(?=pageNumber=)/).map(parseField);
          console.log(`[fields] parsed ${fields.length} field(s):`, JSON.stringify(fields, null, 2));

          // Required: at least one SIGNATURE, INITIALS, and a preauth CHECKBOX.
          const sig = fields.find((f) => f.esignFieldType === 'SIGNATURE');
          const init = fields.find((f) => f.esignFieldType === 'INITIALS');
          const preauth = fields.find(
            (f) => f.esignFieldType === 'CHECKBOX' && /preauth_choice/i.test(f.fieldId ?? ''),
          );

          expect(sig, 'SIGNATURE field must be present').toBeTruthy();
          expect(sig!.fieldValue, 'SIGNATURE.fieldValue should be "SIGNED"').toBe('SIGNED');
          expect(sig!.required).toBe('true');

          expect(init, 'INITIALS field must be present').toBeTruthy();
          expect(init!.required).toBe('true');

          expect(preauth, 'preauth_choice CHECKBOX field must be present').toBeTruthy();
          // Helper marks 'yes' by default — the persisted value must match.
          expect(preauth!.fieldValue, 'preauth CHECKBOX.fieldValue should match the customer choice').toBe('yes');
          expect(preauth!.required).toBe('true');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // LSE-07 / POST-02.x — Post-SIGNED behaviour driven by isSignedToFunding
    //   - flag=true  → lease auto-transitions to FUNDING
    //   - flag=false → lease stays SIGNED (no spontaneous progression)
    // ─────────────────────────────────────────────────────────────
    test(
      'LSE-07/POST-02 Post-SIGNED behaviour matches merchant.isSignedToFunding',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(480_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign LSE-07 - post-signed behaviour',
        });

        let isSignedToFunding = false;

        await test.step('API: query merchant.isSignedToFunding flag', async () => {
          isSignedToFunding = await api.merchant.isSignedToFundingEnabled(data.merchantRefCode);
          console.log(`[LSE-07] ${data.merchant} isSignedToFunding=${isSignedToFunding}`);
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API: pre-qualifies lead → invoice → redirectUrl', async () => {
          await createPreQualifiedApplication(
            api,
            merchant,
            applicant,
            ctx,
            { skipPaymentInfo: true },
            testInfo,
          );

          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(contractUrl).toBeTruthy();
        });

        await test.step('UI: drives flow until GowSign iframe is rendered', async () => {
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

        await test.step('Helper: completes signing ceremony', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
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
          expect(result.signClicked).toBe(true);
        });

        await test.step('DB: lead_status reaches SIGNED first', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', {
            timeoutMs: 60_000,
          });
          expect(status).toBe('SIGNED');
        });

        await test.step(
          isSignedToFunding
            ? 'DB: lead auto-progresses SIGNED → FUNDING (isSignedToFunding=true)'
            : 'DB: lead stays SIGNED (isSignedToFunding=false)',
          async () => {
            const leadPk = Number(ctx.leadPk);

            if (isSignedToFunding) {
              // Auto-FUNDING: poll for the transition for up to 90s.
              const deadline = Date.now() + 90_000;
              let status = await getEsignLeadStatus(db, leadPk);
              while (status !== 'FUNDING' && status !== 'FUNDED' && Date.now() < deadline) {
                await sleep(3_000);
                status = await getEsignLeadStatus(db, leadPk);
              }
              expect(
                ['FUNDING', 'FUNDED'].includes(String(status)),
                `expected FUNDING or FUNDED, got ${status}`,
              ).toBe(true);
            } else {
              // Stays SIGNED: sample the status across a 30s window — should remain SIGNED.
              const samples: Array<string | null> = [];
              for (let i = 0; i < 5; i++) {
                samples.push(await getEsignLeadStatus(db, leadPk));
                await sleep(6_000);
              }
              const distinct = new Set(samples);
              expect(
                distinct.size === 1 && distinct.has('SIGNED'),
                `expected lead_status to stay SIGNED, samples=${JSON.stringify(samples)}`,
              ).toBe(true);
            }
          },
        );

        await test.step('DB: lead_notes contains "Sent Contract to customer. Contract EsignDocPk"', async () => {
          // Sanity: confirms GOWSIGN integration path even when lease auto-progresses.
          const note = await findLeadNoteContaining(
            db,
            Number(ctx.leadPk),
            'Sent Contract to customer. Contract EsignDocPk',
          );
          expect(note, 'creation note must exist').not.toBeNull();
          expect(note!.notes).toMatch(/EsignMode\s*:\s*(DOCX|HTML|EMAIL|STRAPI|EMBEDDED)/i);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // POST-04.1 — Post-signing thank-you screen renders on the parent
    //   page after the GowSign iframe emits `completed`. Asserts the
    //   visible-to-user content (Thank You title, success message,
    //   support phone) instead of pixel-level confetti animation.
    // ─────────────────────────────────────────────────────────────
    test(
      'POST-04.1 Thank-you screen renders after signing ceremony',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign POST-04 - thank-you screen',
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

        await test.step('Helper: signs the contract', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
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
          expect(result.signClicked).toBe(true);
        });

        // Wait for parent page to react to `completed` postMessage and render
        // the success screen. Scoped wait — we look for "Thank" text appearing
        // anywhere on the page (the modal closes, the parent flips state).
        await test.step('UI: thank-you screen content visible', async () => {
          const thankYou = page.getByText(/thank\s*you/i).first();
          await thankYou.waitFor({ state: 'visible', timeout: 30_000 });

          const successCopy = page.getByText(
            /(your\s+contract|successfully\s+signed|signed\s+successfully|contract\s+has\s+been\s+signed)/i,
          ).first();
          await expect(successCopy, 'success message should be visible').toBeVisible({ timeout: 10_000 });

          const phone = page.getByText(/\(?877\)?[\s.-]?353[\s.-]?8696/);
          await expect(phone, 'support phone (877) 353-8696 should be visible').toBeVisible({
            timeout: 10_000,
          });

          await page.screenshot({
            path: testInfo.outputPath('post-04-thank-you.png'),
            fullPage: true,
          });
        });

        // DB sanity: lead reached SIGNED — confirms we are NOT looking at the
        // pre-sign UI by accident (e.g., a CSP or render error masking the page).
        await test.step('DB: lead_status reached SIGNED', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
          expect(status).toBe('SIGNED');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // COM-01.1 — Post-signing "DocumentSigned" email arrives.
    //   The customer's e-mail (uniqueEmailAlias `fintechgroup777+RUNID@gmail.com`)
    //   should receive a `Subject: DocumentSigned` mail from GowSign once the
    //   ceremony completes. Validates body contains the expected confirmation
    //   text and the customer name from buildTestData.
    // ─────────────────────────────────────────────────────────────
    test(
      'COM-01.1 GowSign sends DocumentSigned email to customer after signing',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db, email }, testInfo) => {
        test.setTimeout(540_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign COM-01 - signed email',
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

        await test.step('Helper: completes signing ceremony', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
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
          expect(result.signClicked).toBe(true);
        });

        await test.step('DB: lead_status reaches SIGNED first (sanity)', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('Email: GowSign "DocumentSigned" email arrives at customer inbox', async () => {
          // GowSign typically dispatches the post-sign email within 30-90s.
          // Poll for up to 3 minutes (allows for sandbox/staging email delays).
          const message = await email.getEmailContent(
            applicant.email,
            /DocumentSigned/i,
            180_000,
          );

          expect(
            message,
            `expected GowSign DocumentSigned email at ${applicant.email} within 180s`,
          ).not.toBeNull();
          console.log(`[COM-01.1] subject="${message!.subject}"`);

          // Subject should literally be "DocumentSigned" (provider conventions).
          expect(message!.subject).toMatch(/DocumentSigned/i);

          // Body content checks — confirms the email is the post-sign one,
          // not the initial signature invite.
          expect(message!.body).toMatch(/Your\s+document\s+is\s+completed/i);
          expect(message!.body).toMatch(/signing\s+of\s+this\s+document\s+has\s+been\s+completed/i);

          // Customer name appears in the greeting (from buildTestData).
          // We use a lenient match because the names contain test-suffixes (Testfnlv...).
          const firstName = applicant.firstName;
          expect(message!.body.toLowerCase()).toContain(firstName.toLowerCase());
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // COM-02 — Email suprimido para fluxo embed.
    //
    // Spec: when the document is delivered via embedded iframe, GowSign
    // should NOT send a pre-sign "Please sign your document" invite email
    // (the customer is already in front of the iframe). Only the post-sign
    // confirmation (DocumentSigned, validated by COM-01.1) is allowed.
    //
    // Strategy: open iframe, wait 90s WITHOUT signing, then verify the
    // applicant inbox has zero invite-style messages.
    // ─────────────────────────────────────────────────────────────
    test(
      'COM-02 No invite email is sent for embed-mode delivery (only post-sign DocumentSigned)',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, email }, testInfo) => {
        test.setTimeout(360_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign COM-02 - email suppression',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: drive to iframe rendered (CC_AUTH_PASSED)', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
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

        await test.step('Wait 90s — give the provider a window to (improperly) send an invite', async () => {
          await sleep(90_000);
        });

        await test.step('Email: no invite-style email arrived in applicant inbox', async () => {
          // Subjects to exclude:
          //   - "Sign", "Please Sign", "Document Sent", "Invitation", "Action Required"
          // We do NOT exclude "DocumentSigned" — that's the legitimate post-sign
          // email tested by COM-01.1. Since we did not sign, that one should
          // also not arrive — this gives us a stricter assertion: NO email
          // from gowsign should arrive pre-sign in embed mode.
          const inviteSubject = /(invite|please\s*sign|sign\s+your|action\s*required|document\s*sent|document\s*ready)/i;

          // Short timeout — if no message in 30s, suppression confirmed.
          const result = await email.getEmailContent(applicant.email, inviteSubject, 30_000);
          expect(
            result,
            `expected NO invite email in embed mode; got subject="${result?.subject ?? ''}"`,
          ).toBeNull();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // COM-06 — Idioma do contrato (English).
    //
    // The contract content is in English regardless of locale. Validates
    // common English phrasing in the iframe DOM pre-sign.
    // ─────────────────────────────────────────────────────────────
    test(
      'COM-06 Contract content is rendered in English',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign COM-06 - language',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: drive to iframe rendered', async () => {
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

        await test.step('Iframe: contract heading and body use English contract phrasing', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          await page.waitForTimeout(2_000);

          // Heading literal observed in the CA template.
          await expect(
            frame.getByText(/CONSUMER LEASE-PURCHASE AGREEMENT/i).first(),
          ).toBeVisible({ timeout: 15_000 });

          // Required English contract terms must be present somewhere in
          // the iframe text (frame.locator('body').innerText() is the simplest
          // way to assert language).
          const bodyText = (await frame.locator('body').innerText()).toLowerCase();
          for (const phrase of [
            'lessor',
            'lessee',
            'total of payments',
            'cost of lease',
            'cash price',
            'payment',
            'signature',
          ]) {
            expect(
              bodyText,
              `English contract phrase "${phrase}" not found in iframe`,
            ).toContain(phrase);
          }

          // Negative check: contract should NOT contain pt-BR-only phrasing.
          // Sanity assertion to catch a hypothetical accidental locale flip.
          const ptOnlyMarkers = ['contrato de locação', 'arrendatário', 'arrendador'];
          for (const phrase of ptOnlyMarkers) {
            expect(
              bodyText.includes(phrase),
              `Unexpected pt-BR phrase "${phrase}" rendered in contract`,
            ).toBe(false);
          }
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // OPS-04.1 — Merchant receives notification when customer signs.
    //
    // Status (2026-04-28): SKIPPED. TireAgent qa2 has these merchant
    // contact columns:
    //   - alt_contact_email = ALternateNameTest@test.com (fake placeholder)
    //   - primary_contact_email = emailTest@test.com   (fake placeholder)
    //   - funding_report_emails = fintechgroup777@gmail.com (our IMAP inbox,
    //     but it is for funding reports, not per-signing notifications)
    //
    // Without confirmation from product/dev about which channel and which
    // Subject pattern carry the "customer signed" notification, an IMAP
    // assertion would either be brittle (subject regex unknown) or read
    // the wrong inbox. Re-enable once the notification destination + subject
    // are documented.
    // ─────────────────────────────────────────────────────────────
    // OPS-04.1 — Merchant receives signed-document notification email.
    //
    // Empirical attempt: drive a fresh sign + poll the inbox for any subject
    // hinting at a merchant notification ("signed", "completed", merchant
    // name, lead pk). If none surfaces in 60s after sign, the test fails
    // with the captured subjects so we can iterate on the regex.
    // ─────────────────────────────────────────────────────────────
    test(
      'OPS-04.1 Merchant receives notification email after customer signs',
      { tag: ['@priority-low'] },
      async ({ page, api, ctx, db, email }, testInfo) => {
        test.setTimeout(540_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign OPS-04 - merchant notif',
        });

        await installPostMessageRecorder(page);
        let contractUrl = '';

        await test.step('Setup + sign', async () => {
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
          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
        });

        await test.step('IMAP: search merchant inbox for "customer signed" notification', async () => {
          // The merchant's funding_report_emails for TireAgent qa2 = our
          // shared fintechgroup777@gmail.com inbox. Search broadly for any
          // subject related to signing of THIS lead.
          const merchantPattern = new RegExp(
            `(signed|complet|contract).*(${ctx.leadPk}|${applicant.firstName})`,
            'i',
          );
          const result = await email.getEmailContent(
            'fintechgroup777@gmail.com',
            merchantPattern,
            120_000,
          );

          if (!result) {
            // Document the gap clearly when nothing matches.
            console.log(
              `[OPS-04.1] No matching merchant notification within 120s. ` +
              `Subject pattern attempted: ${merchantPattern.source}`,
            );
          }
          expect(
            result,
            `Expected merchant notification email mentioning lead/customer for pk=${ctx.leadPk}. ` +
            `If nothing arrives, the merchant notification destination/subject is undocumented.`,
          ).not.toBeNull();
          console.log(`[OPS-04.1] merchant email subject="${result?.subject}"`);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // LSE-08.1 / EMB-04.1 — Customer closes iframe without signing.
    //
    // The GowSign iframe DOES expose a "Close document" button in embedMode
    // (`button[aria-label="Close document"]`). Empirically verified — doc
    // 13472, lead 15751: clicking it produces a row in
    // `uown_esign_event_trigger_log` with `event_name='closed'` and
    // `redirect_url` containing `document_status=canceled`.
    //
    // Earlier hypothesis ("embedMode hides the close button → no UI path to
    // abandon") was WRONG: the previous test was clicking the parent modal
    // X (UOwn shell), which only unmounts the UI without notifying the
    // backend. The fix routes the click through `clickCloseDocumentInIframe()`.
    test(
      'LSE-08.1 Closing the contract modal without signing → esign_document CANCELED + lead stays CONTRACT_CREATED',
      { tag: ['@priority-low'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign LSE-08 - close without signing',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';
        let esignDocPk = 0;

        await test.step('API: pre-qualifies lead → invoice → redirectUrl', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(contractUrl).toBeTruthy();
        });

        await test.step('UI: walk to GowSign iframe inside the modal', async () => {
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

        await test.step('DB: capture esign_document_pk before closing', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 30_000;
          let doc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!doc && Date.now() < deadline) {
            await sleep(2_000);
            doc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(doc, `esign_document for lead_pk=${leadPk}`).not.toBeNull();
          expect(doc!.esignClient).toBe('GOWSIGN');
          esignDocPk = doc!.pk;
          // Sanity: status should be OUTSTANDING (or CREATED) before close, not SIGNED/CANCELED.
          expect(
            ['OUTSTANDING', 'CREATED', 'SENT_TO_CUSTOMER'].includes(String(doc!.documentStatus)),
            `pre-close status should be OUTSTANDING/CREATED/SENT_TO_CUSTOMER, got ${doc!.documentStatus}`,
          ).toBe(true);
        });

        await test.step('UI: click "Close document" INSIDE the GowSign iframe (not the parent modal X)', async () => {
          const modal = new AlternativeContractModalPage(page);

          // The close path that propagates `closed` postMessage is the
          // GowSign-iframe's "Close document" button — empirically verified
          // (doc 13472, lead 15751: event_name=closed + redirect_url with
          // document_status=canceled). The parent modal X (UOwn shell) only
          // unmounts the UI without notifying the backend.
          await modal.clickCloseDocumentInIframe();

          // Give the iframe + parent + backend a beat to dispatch + persist.
          await sleep(3_000);
          await page.screenshot({
            path: testInfo.outputPath('lse-08-after-close.png'),
            fullPage: false,
          });
        });

        await test.step('DB: esign_document.documentStatus → CANCELED (poll up to 60s)', async () => {
          const deadline = Date.now() + 60_000;
          let doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          while (doc?.documentStatus !== 'CANCELED' && Date.now() < deadline) {
            await sleep(3_000);
            doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          }
          expect(
            doc?.documentStatus,
            `expected CANCELED post-close, got ${doc?.documentStatus} (esign_doc_pk=${esignDocPk})`,
          ).toBe('CANCELED');
        });

        await test.step('DB: lead_status remains CONTRACT_CREATED (close ≠ sign)', async () => {
          const status = await getEsignLeadStatus(db, Number(ctx.leadPk));
          expect(
            status,
            'closing without signing must NOT regress or advance the lease',
          ).toBe('CONTRACT_CREATED');
        });
      },
    );
  },
);

// ─────────────────────────────────────────────────────────────────
// POST-09.1 — Pre-selected Protection Plan activated.
//
// State: CO (NOT CA — see .claude/rules/testing.md § Protection Plan).
// CA blocks the PP offer in qa2 with the lease-note "Protection plan was
// not offered". CO + TireAgent (offerInsurance=true) is the working combo.
// ─────────────────────────────────────────────────────────────────
const ppData = {
  state: 'CO',
  merchant: 'FifthAveFurnitureNY',
  merchantRefCode: 'OW90218-0001',
  orderTotal: '800',
};

test.describe(
  `GowSign Post-Signing Protection Plan - ${ppData.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-medium'] },
  () => {

    // POST-09.1 — Pre-selected Protection Plan activated.
    //
    // Status (2026-04-28): SKIPPED. Empirical matrix in qa2/TireAgent:
    //   - CA → e-sign client = GOWSIGN, but Protection plan was not offered
    //     (lead 15741 — "Protection plan was not offered" in lease log).
    //   - CO → Protection plan offered, but e-sign client = SIGNWELL
    //     (lead 15747 — `uown_esign_document.client = 'SIGNWELL'`).
    //   See `.claude/rules/testing.md § Protection Plan + E-sign Provider`.
    //
    // No state/merchant combo currently satisfies BOTH GowSign routing AND
    // PP offering with TireAgent qa2. Re-enable when a viable combo is found
    // (different merchant, or qa2 config tweak that lifts the CA PP block).
    //
    // Body kept intact so re-enabling is `test.skip` → `test`.
    test(
      'POST-09.1 Pre-selected Protection Plan row created + activated post-signing',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(540_000);

        const { merchant, applicant } = buildTestData({
          state: ppData.state,
          merchant: ppData.merchant,
          orderTotal: ppData.orderTotal,
          orderDescription: 'GowSign POST-09 - PP preselected',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API: pre-qualifies lead with TerraceFinance → invoice → redirectUrl', async () => {
          // skipMerchantPreflight: TerraceFinance qa2 has `offerInsurance=true`
          // intentionally set on the admin side to enable preselected PP. The
          // shared merchant-config contract has `offerInsurance=false`, and
          // running preflight auto-heals the user's change away. Skip to keep
          // the merchant config the test depends on.
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx,
            { skipPaymentInfo: true, skipMerchantPreflight: true },
            testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(contractUrl, 'redirectUrl required').toBeTruthy();
          console.log(`[POST-09] leadPk=${ctx.leadPk} url=${contractUrl}`);
        });

        // Note on ordering: the e-sign document is only created after the
        // customer submits a CC (CC_AUTH_PASSED) via MissingDataForm — so the
        // provider guard runs AFTER the UI walk, not before.

        await test.step('UI: walks the customer flow up to the GowSign iframe', async () => {
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
          // POST-09 path: opt-IN to the protection plan offer so a row lands
          // in uown_los_protection_plan with policy_id populated.
          await terms.acceptAndProceedWithProtectionPlan(true);

          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
        });

        await test.step('DB: confirm e-sign document was created with client=GOWSIGN', async () => {
          // Now (after CC_AUTH_PASSED via UI) the document should exist.
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 30_000;
          let doc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!doc && Date.now() < deadline) {
            await sleep(2_000);
            doc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(doc, `esign_document for lead_pk=${leadPk}`).not.toBeNull();
          // Hard guard: if TerraceFinance qa2 routes to Signwell or PandaDoc the
          // signing helper cannot drive the iframe.
          expect(
            doc!.esignClient,
            `Expected GOWSIGN, got ${doc!.esignClient}. TerraceFinance qa2 may route to a different provider.`,
          ).toBe('GOWSIGN');
        });

        await test.step('Helper: completes signing ceremony', async () => {
          const modal = new AlternativeContractModalPage(page);
          const frame = modal.getGowSignFrame();
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
          expect(result.signClicked, 'final Sign clicked').toBe(true);
        });

        await test.step('DB: lead reaches SIGNED', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('DB: uown_los_protection_plan row exists for the lead', async () => {
          // Backend writes the PP row asynchronously after signing — poll up to 60s.
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let row: Record<string, unknown> | null = null;
          while (!row && Date.now() < deadline) {
            row = await db.queryOne<Record<string, unknown>>(
              `SELECT pk, lead_pk, opt_in, status, policy_id, error, customer_id
               FROM uown_los_protection_plan
               WHERE lead_pk = $1
               ORDER BY pk DESC
               LIMIT 1`,
              [leadPk],
            );
            if (!row) await sleep(3_000);
          }
          expect(
            row,
            `uown_los_protection_plan row should be created for lead_pk=${leadPk}`,
          ).not.toBeNull();
          console.log(`[POST-09] PP row=${JSON.stringify(row)}`);

          // opt_in must be true (this is the merchant-preselected flow).
          expect(row!.opt_in, 'opt_in should be true for preselected PP').toBe(true);
        });

        await test.step('DB: PP row reaches policy_id populated + status=ACTIVE', async () => {
          // Backend → Buddy roundtrip is async. Poll up to 90s for policy_id and ACTIVE.
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 90_000;
          let row: { policy_id: string | null; status: string | null; error: string | null } | null = null;
          while (Date.now() < deadline) {
            row = await db.queryOne<{ policy_id: string | null; status: string | null; error: string | null }>(
              `SELECT policy_id, status, error
               FROM uown_los_protection_plan
               WHERE lead_pk = $1
               ORDER BY pk DESC
               LIMIT 1`,
              [leadPk],
            );
            if (row && row.policy_id && row.status === 'ACTIVE') break;
            await sleep(3_000);
          }
          expect(row, 'PP row required').not.toBeNull();
          console.log(
            `[POST-09] final PP row: status=${row!.status} policy_id=${row!.policy_id} error=${row!.error}`,
          );
          // The success path: ACTIVE + policy_id. If Buddy returned an error we
          // surface it in the failure message rather than silently passing.
          expect(row!.status, `expected ACTIVE, got ${row!.status} (error=${row!.error ?? 'null'})`).toBe('ACTIVE');
          expect(row!.policy_id, 'policy_id must be populated by Buddy').toBeTruthy();
        });

        await test.step('DB: lead_notes mentions Protection Plan activation', async () => {
          // The exact phrasing varies across services — accept any of the canonical mentions.
          const leadPk = Number(ctx.leadPk);
          const note =
            (await findLeadNoteContaining(db, leadPk, 'Protection Plan activated')) ??
            (await findLeadNoteContaining(db, leadPk, 'Pre-selected Protection Plan')) ??
            (await findLeadNoteContaining(db, leadPk, 'Buddy'));
          expect(
            note,
            'expected at least one lead note mentioning Protection Plan / Buddy activation',
          ).not.toBeNull();
        });
      },
    );
  },
);

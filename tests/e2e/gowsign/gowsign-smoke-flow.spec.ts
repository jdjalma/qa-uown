/**
 * E2E Hybrid Smoke — GowSign Integration via UOwn flow
 *
 * Validates that the UOwn backend correctly integrates with GowSign at
 * `CC_AUTH_PASSED`. QA does NOT call the GowSign API directly — there is no
 * `GOWSIGN_API_KEY` in QA environments. Instead this suite drives a lead to
 * `CC_AUTH_PASSED` via UOwn API, then validates:
 *
 *   1. UOwn DB persistence (`uown_esign_document.client = 'GOWSIGN'`,
 *      `esign_mode` populated, FK from `uown_los_contract.esign_document_pk`,
 *      timeline note in `uown_los_lead_notes`).
 *   2. UOwn API response (`paymentDetailsList[idx].redirectUrl` returned).
 *   3. UI rendering (open `redirectUrl`, validate iframe loads, Start button,
 *      status badge, contract content, Start click event, Download).
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage` (src/pages/gowsign/document-viewer.page.ts)
 *   - DB helpers: `getEsignDocumentByLeadPk`, `findLeadNoteContaining`,
 *                 `getEsignEventsByDocPk`, `waitForEsignDocumentStatus`
 *                 (src/helpers/esign-db.helpers.ts)
 *   - API setup:  `setupApplicationViaApi` with extractContractUrl + submitPaymentInfoViaApi
 *
 * Spec source: docs/taskTestingUown/gowsign_integration/gowsign-integration-test-scenarios.md
 *
 * Tags: @smoke @regression @sandbox + custom @e2e/@hybrid/@priority-* per scenarios doc.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Download } from '@playwright/test';
import { GowSignDocumentViewerPage } from '@pages/gowsign/index.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
  getEsignEventsByDocPk,
  waitForEsignDocumentStatus,
} from '@helpers/esign-db.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Test data ───────────────────────────────────────────────────────
// Risk tier: low (CA + ProgressMobility, ~$800 — funds in QA without UW friction).
// `submitPaymentInfoViaApi: true` drives the lead to CC_AUTH_PASSED so the
// backend creates the GowSign contract and returns redirectUrl in the response.
const testData = {
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
  tag: buildTags(TestTag.SMOKE, TestTag.REGRESSION),
  extraTags: ['@e2e', '@hybrid', '@priority-high', '@db-validation'],
};

test.describe(
  `GowSign Smoke Flow - ${testData.merchant}`,
  { tag: [...splitTags(testData.tag), ...testData.extraTags] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // CT-01 — Smoke E2E: lead → CC_AUTH_PASSED → GowSign contract created
    //         (DB + API + UI iframe loads with OUTSTANDING badge)
    // ─────────────────────────────────────────────────────────────
    test(
      'CT-01 Smoke E2E: GowSign contract created on CC_AUTH_PASSED renders OUTSTANDING in iframe',
      { tag: ['@priority-high'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign smoke - contract create',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('Drive lead to CC_AUTH_PASSED via UOwn API (extracts redirectUrl)', async () => {
          const result = await setupApplicationViaApi(
            api,
            {
              merchant,
              applicant,
              order,
              verifyApproval: true,
              extractContractUrl: true,
              submitPaymentInfoViaApi: true,
            },
            testInfo,
            ctx,
          );
          // The redirectUrl returned by sendApplication IS the GowSign iframe entrypoint.
          // It is also the value persisted by backend after CC_AUTH_PASSED.
          expect(result.contractUrl, 'paymentDetailsList[idx].redirectUrl must be returned').toBeTruthy();
          contractUrl = result.contractUrl ?? '';
          ctx.contractUrl = contractUrl;
          console.log(`[GowSign] redirectUrl="${contractUrl}"`);
        });

        await test.step('DB: uown_esign_document populated with client=GOWSIGN', async () => {
          // Backend creates the e-sign document asynchronously after CC_AUTH_PASSED.
          // Poll esign-document by lead_pk to allow the backend job to complete.
          const leadPk = Number(ctx.leadPk);
          expect(Number.isFinite(leadPk) && leadPk > 0, 'ctx.leadPk must be a positive number').toBeTruthy();

          // Poll for the document to exist (esign-db helpers lookup-by-lead is direct,
          // so wrap in a short manual poll — the dispatcher runs after CC auth).
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `uown_esign_document row not found for lead_pk=${leadPk}`).not.toBeNull();
          expect(esignDoc!.esignClient, 'esign_document.client should be GOWSIGN').toBe('GOWSIGN');
          expect(esignDoc!.esignMode, 'esign_document.esign_mode should be populated').toBeTruthy();
          // FK from uown_los_contract.esign_document_pk → uown_esign_document.pk
          expect(esignDoc!.contractPk, 'uown_los_contract.esign_document_pk should reference this doc').not.toBeNull();
          console.log(
            `[GowSign] esignDoc pk=${esignDoc!.pk} client=${esignDoc!.esignClient} mode=${esignDoc!.esignMode} ` +
            `status=${esignDoc!.documentStatus} contractPk=${esignDoc!.contractPk}`,
          );

          // Annotate for downstream steps
          testInfo.annotations.push({ type: 'esignDocPk', description: String(esignDoc!.pk) });
          (ctx as Record<string, unknown>)['esignDocPk'] = esignDoc!.pk;
        });

        await test.step('DB: uown_los_lead_notes contains "Sent Contract to customer. Contract EsignDocPk"', async () => {
          const leadPk = Number(ctx.leadPk);
          const note = await findLeadNoteContaining(
            db,
            leadPk,
            'Sent Contract to customer. Contract EsignDocPk',
          );
          expect(note, 'Expected timeline note "Sent Contract to customer..." to exist').not.toBeNull();
          expect(note!.notes).toMatch(/EsignDocPk\s*:\s*\d+/i);
          expect(note!.notes).toMatch(/LeaseType\s*:\s*(LEASE|LEASE_MOD)/i);
          expect(note!.notes).toMatch(/EsignMode\s*:\s*(DOCX|HTML|EMAIL|STRAPI)/i);
        });

        await test.step('UI: open redirectUrl, iframe loads, Start visible, status=OUTSTANDING', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);
          expect(await viewer.isStartButtonVisible(), 'Start Signature button must be visible').toBe(true);

          const status = await viewer.getStatusBadge();
          expect(status, 'GowSign status badge should be OUTSTANDING for unsigned contract').toBe('OUTSTANDING');

          const docId = await viewer.getDocumentId();
          expect(docId, 'Document ID cell must be populated').toBeTruthy();

          await page.screenshot({
            path: testInfo.outputPath('gowsign-01-outstanding.png'),
            fullPage: false,
          });
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CT-02 — Contract content matches API paymentDetailsList values
    // ─────────────────────────────────────────────────────────────
    test(
      'CT-02 Contract iframe content matches paymentDetailsList values',
      { tag: ['@priority-high'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign smoke - content match',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';
        let recurringPaymentApi: number | null = null;
        let totalOfPaymentsApi: number | null = null;

        await test.step('Drive lead to CC_AUTH_PASSED + capture API payment details', async () => {
          const appResp = await api.application.sendApplication(merchant, applicant);
          expect(appResp.ok, `sendApplication: ${appResp.status}`).toBeTruthy();
          ctx.leadUuid =
            appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
          ctx.leadPk = String(appResp.body.authorizationNumber ?? '');
          expect(ctx.leadUuid).toBeTruthy();

          await sleep(5_000);

          const statusResp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
          expect(statusResp.ok).toBeTruthy();
          if (statusResp.body.leadPk) ctx.leadPk = String(statusResp.body.leadPk);

          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid, {
            orderTotal: testData.orderTotal,
          });
          expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

          const paymentDetails = invoiceResp.body?.paymentDetailsList ?? [];
          const idx = paymentDetails.length > 1 ? 1 : 0;
          const pd = paymentDetails[idx] as
            | {
                redirectUrl?: string;
                totalOfPayments?: number | string;
                recurringPayment?: number | string;
                paymentAmount?: number | string;
              }
            | undefined;
          expect(pd?.redirectUrl, 'paymentDetailsList redirectUrl required').toBeTruthy();
          contractUrl = pd!.redirectUrl as string;
          recurringPaymentApi =
            pd?.recurringPayment !== undefined
              ? Number(pd.recurringPayment)
              : pd?.paymentAmount !== undefined
                ? Number(pd.paymentAmount)
                : null;
          totalOfPaymentsApi =
            pd?.totalOfPayments !== undefined ? Number(pd.totalOfPayments) : null;

          // Drive to CC_AUTH_PASSED so backend builds the contract content.
          const url = new URL(contractUrl);
          const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
          const planId = url.searchParams.get('planId') ?? '';
          if (shortCode) {
            const missing = await api.application.getMissingFields(
              shortCode,
              planId ? { planId } : undefined,
            );
            expect(missing.ok, `getMissingFields: ${missing.status}`).toBeTruthy();
          }
          const submitResp = await api.application.submitApplication(
            Number(ctx.leadPk),
            applicant.firstName,
            applicant.lastName,
          );
          expect(submitResp.ok, `submitApplication: ${submitResp.status}`).toBeTruthy();

          console.log(
            `[GowSign] redirectUrl="${contractUrl}" totalOfPayments=${totalOfPaymentsApi} recurringPayment=${recurringPaymentApi}`,
          );
        });

        await test.step('Wait for esign_document.status=OUTSTANDING and contract content built', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, 'esign_document must exist').not.toBeNull();
          await waitForEsignDocumentStatus(db, esignDoc!.pk, 'OUTSTANDING', { timeoutMs: 60_000 });
        });

        await test.step('UI: extract Property Price Tag, LESSEE, LESSOR + cross-validate with API ($0.01 tolerance)', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const priceTag = await viewer.getPropertyPriceTag();
          const lessee = await viewer.getLessee();
          const lessor = await viewer.getLessor();

          console.log(
            `[GowSign] priceTag.totalOfPayments=${priceTag.totalOfPayments} amountOfEachPayment=${priceTag.amountOfEachPayment}`,
          );

          // Lessee: applicant data must round-trip
          expect(lessee.name.toLowerCase(), 'Lessee name must include applicant first/last name').toContain(
            applicant.firstName.toLowerCase(),
          );
          expect(lessee.name.toLowerCase()).toContain(applicant.lastName.toLowerCase());
          expect(lessee.state, 'Lessee state must match applicant state').toBe(testData.state);

          // Lessor: must be UOwn / lessor entity (non-empty)
          expect(lessor.name, 'Lessor name must be populated').toBeTruthy();

          // Money cross-validation with tolerance
          const parseMoney = (s: string): number => {
            const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
            return m ? Number(m[0]) : Number.NaN;
          };

          if (totalOfPaymentsApi !== null) {
            const uiTotal = parseMoney(priceTag.totalOfPayments);
            expect(Math.abs(uiTotal - totalOfPaymentsApi)).toBeLessThanOrEqual(0.01);
          }
          if (recurringPaymentApi !== null) {
            const uiAmount = parseMoney(priceTag.amountOfEachPayment);
            expect(Math.abs(uiAmount - recurringPaymentApi)).toBeLessThanOrEqual(0.01);
          }

          await page.screenshot({
            path: testInfo.outputPath('gowsign-02-contract-content.png'),
            fullPage: false,
          });
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CT-03 — Click Start triggers postMessage and DB event log row
    // ─────────────────────────────────────────────────────────────
    test(
      'CT-03 Clicking Start fires postMessage and persists event in uown_esign_event_trigger_log',
      { tag: ['@priority-high'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign smoke - start click',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        // Capture postMessage events from the iframe BEFORE first navigation.
        const messages: Array<{ origin: string; data: unknown }> = [];
        await page.exposeFunction('__capturePostMessage', (msg: { origin: string; data: unknown }) => {
          messages.push(msg);
        });
        await page.addInitScript(() => {
          window.addEventListener('message', (event: MessageEvent) => {
            try {
              const fn = (window as unknown as { __capturePostMessage?: (m: unknown) => void }).__capturePostMessage;
              if (fn) fn({ origin: event.origin, data: event.data });
            } catch {
              /* noop */
            }
          });
        });

        let contractUrl = '';
        let esignDocPk = 0;

        await test.step('Drive lead to CC_AUTH_PASSED', async () => {
          const result = await setupApplicationViaApi(
            api,
            {
              merchant,
              applicant,
              order,
              verifyApproval: true,
              extractContractUrl: true,
              submitPaymentInfoViaApi: true,
            },
            testInfo,
            ctx,
          );
          contractUrl = result.contractUrl ?? '';
          expect(contractUrl).toBeTruthy();

          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc).not.toBeNull();
          esignDocPk = esignDoc!.pk;
        });

        await test.step('UI: open viewer + click Start Signature', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const eventsBefore = await getEsignEventsByDocPk(db, esignDocPk);
          console.log(`[GowSign] events before Start click: ${eventsBefore.length}`);

          await viewer.clickStartSignature();

          // Wait for at least one postMessage to arrive (loaded/viewed).
          const deadline = Date.now() + 30_000;
          while (messages.length === 0 && Date.now() < deadline) {
            await sleep(500);
          }
          console.log(`[GowSign] postMessages captured: ${messages.length}`);
          expect(messages.length, 'GowSign iframe should emit at least one postMessage after Start').toBeGreaterThan(0);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-03-after-start-click.png'),
            fullPage: false,
          });
        });

        await test.step('DB: new row appears in uown_esign_event_trigger_log for esignDocPk', async () => {
          // Backend persists the event asynchronously — poll up to 30s.
          const deadline = Date.now() + 30_000;
          let events = await getEsignEventsByDocPk(db, esignDocPk);
          while (events.length === 0 && Date.now() < deadline) {
            await sleep(2_000);
            events = await getEsignEventsByDocPk(db, esignDocPk);
          }
          expect(
            events.length,
            `uown_esign_event_trigger_log should have at least 1 row for esign_doc_pk=${esignDocPk}`,
          ).toBeGreaterThan(0);

          const eventNames = events.map((e) => e.eventName).filter(Boolean);
          console.log(`[GowSign] event_names persisted: ${JSON.stringify(eventNames)}`);
          // Backend may persist either 'LOADED', 'VIEWED' or both — accept any.
          expect(
            eventNames.some((n) => /loaded|viewed/i.test(String(n))),
            'Expected at least one event_name matching LOADED or VIEWED',
          ).toBe(true);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CT-04 — Download contract from iframe
    // ─────────────────────────────────────────────────────────────
    test(
      'CT-04 Download contract emits a valid PDF',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign smoke - download',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('Drive lead to CC_AUTH_PASSED', async () => {
          const result = await setupApplicationViaApi(
            api,
            {
              merchant,
              applicant,
              order,
              verifyApproval: true,
              extractContractUrl: true,
              submitPaymentInfoViaApi: true,
            },
            testInfo,
            ctx,
          );
          contractUrl = result.contractUrl ?? '';
          expect(contractUrl).toBeTruthy();
        });

        await test.step('UI: open viewer, click Download, validate PDF', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          // Wait for the download event triggered by clicking Download.
          const [download] = (await Promise.all([
            page.waitForEvent('download', { timeout: 30_000 }),
            viewer.clickDownload(),
          ])) as [Download, void];

          const filename = download.suggestedFilename();
          expect(filename.toLowerCase().endsWith('.pdf'), `filename must end with .pdf, got "${filename}"`).toBe(true);

          // Save to disk to inspect size + magic bytes.
          const savedPath = testInfo.outputPath('gowsign-contract.pdf');
          await download.saveAs(savedPath);

          const { statSync, readFileSync } = await import('node:fs');
          const stats = statSync(savedPath);
          expect(stats.size, 'PDF size must be > 0').toBeGreaterThan(0);

          const head = readFileSync(savedPath).subarray(0, 4).toString('utf-8');
          expect(head, 'PDF magic bytes must be "%PDF"').toBe('%PDF');

          await page.screenshot({
            path: testInfo.outputPath('gowsign-04-after-download.png'),
            fullPage: false,
          });
        });
      },
  );
  },
);

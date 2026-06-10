/**
 * E2E Hybrid — GowSign Modify Lease (MOD) + Recovery (RES) flows
 *
 * Covers two related families of scenarios from the GowSign integration spec:
 *
 *   1. **MOD-01..04** — Modify Lease (post-SIGNED amendment, DEFAULT operator
 *      access, Collections-attached contracts, contract amendment).
 *   2. **RES-01..07** — Recovery flows (browser closed without signing, link
 *      validity across new browser context, multiple downloads consistency,
 *      multi-device access, browser matrix).
 *
 * QA NEVER calls the GowSign API directly — all setup goes through the UOwn
 * flow via `setupApplicationViaApi` (see `@helpers/api-setup.helpers`). The
 * iframe URL is read from `paymentDetailsList[0].redirectUrl`.
 *
 * Active scenarios (executable today):
 *   - RES-02 / 2.1 — Browser closed without signing → link still valid in new
 *                    context, document remains OUTSTANDING, no CLOSED event.
 *   - RES-05 / 5.1 — Download multiple times → SHA-256 hashes identical,
 *                    filenames consistent, file size > 0 each time.
 *
 * Skipped scenarios (documented reasons):
 *   - MOD-01 / 1.1 — requires post-SIGNED signing helper.
 *   - MOD-02 / 2.1 — requires lease forced into DEFAULT state setup.
 *   - MOD-03 / 3.1 — requires Collections portal UI flow.
 *   - MOD-04 / 4.1 — feature TBD (contract amendment).
 *   - RES-01    — requires signing-in-progress + setOffline support.
 *   - RES-03    — requires link-expiration renewal endpoint (TBD).
 *   - RES-04.1  — requires signed-state setup.
 *   - RES-04.2  — requires aged fixture (retention policy).
 *   - RES-06    — requires concurrent multi-device signing helpers.
 *   - RES-07    — covered by US-EMB-11 browser-matrix suite.
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage` (src/pages/gowsign/document-viewer.page.ts)
 *   - DB helpers:  `getEsignDocumentByLeadPk`, `getEsignEventsByDocPk`,
 *                  `waitForEsignDocumentStatus` (src/helpers/esign-db.helpers.ts)
 *   - API setup:   `setupApplicationViaApi` with `extractContractUrl: true`
 *
 * Spec source: docs/taskTestingUown/gowsign_integration/gowsign-integration-test-scenarios.md
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { GowSignDocumentViewerPage } from '@pages/gowsign/index.js';
import {
  getEsignDocumentByLeadPk,
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
  tag: buildTags(TestTag.REGRESSION),
  extraTags: ['@e2e', '@hybrid'],
};

test.describe(
  `GowSign Modify + Recovery - ${testData.merchant}`,
  { tag: [...splitTags(testData.tag), ...testData.extraTags] },
  () => {
    // ════════════════════════════════════════════════════════════════
    // MOD — Modify Lease (all skipped: each requires unbuilt helpers)
    // ════════════════════════════════════════════════════════════════

    test.skip(
      'MOD-01 / 1.1 Modify lease post-SIGNED generates a new GowSign contract',
      { tag: ['@priority-medium'] },
      async () => {
        // Skip reason: requires a signing helper that drives the contract from
        // OUTSTANDING → SIGNED via the GowSign UI. QA cannot call the GowSign
        // signing API directly (no GOWSIGN_API_KEY in QA), and the in-iframe
        // signature flow (canvas + adopt + finish) is not yet automated.
      },
    );

    test.skip(
      'MOD-02 / 2.1 Lease in DEFAULT — operator can access contract for amendment',
      { tag: ['@priority-medium'] },
      async () => {
        // Skip reason: requires deterministic setup that places a lease into
        // DEFAULT (delinquency simulation). Currently no UOwn-API path exists
        // to force DEFAULT; it requires aged fixtures + missed payments.
      },
    );

    test.skip(
      'MOD-03 / 3.1 Collections agent attaches modified contract to lease',
      { tag: ['@priority-medium'] },
      async () => {
        // Skip reason: requires Collections portal UI workflow (page object
        // not yet implemented + portal-specific permission setup).
      },
    );

    test.skip(
      'MOD-04 / 4.1 Contract amendment via Servicing portal',
      { tag: ['@priority-medium'] },
      async () => {
        // Skip reason: feature TBD — endpoint + UI for contract amendment
        // are pending product/engineering definition.
      },
    );

    // ════════════════════════════════════════════════════════════════
    // RES — Recovery
    // ════════════════════════════════════════════════════════════════

    test.skip(
      'RES-01 Customer loses connection mid-signing → recovery resumes signing',
      { tag: ['@priority-low'] },
      async () => {
        // Skip reason: requires signing-in-progress state + Playwright
        // `context.setOffline(true)` orchestration around the GowSign canvas.
        // The signing helper itself is not automated yet (see MOD-01 skip).
      },
    );

    // ─────────────────────────────────────────────────────────────
    // RES-02 / 2.1 — Browser closed without signing → link valid in new context
    // ─────────────────────────────────────────────────────────────
    test(
      'RES-02 / 2.1 Customer closes browser without signing — link remains valid in new browser context',
      { tag: ['@priority-medium'] },
      async ({ browser, page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign RES-02 - link survives browser close',
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
          contractUrl = result.contractUrl ?? '';
          expect(contractUrl, 'paymentDetailsList[0].redirectUrl must be returned').toBeTruthy();
          ctx.contractUrl = contractUrl;
        });

        await test.step('Wait for esign_document and OUTSTANDING status', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `esign_document must exist for lead_pk=${leadPk}`).not.toBeNull();
          await waitForEsignDocumentStatus(db, esignDoc!.pk, 'OUTSTANDING', { timeoutMs: 60_000 });
          (ctx as Record<string, unknown>)['esignDocPk'] = esignDoc!.pk;
        });

        await test.step('Page 1 (context 1): open viewer, confirm Start visible, then close', async () => {
          await page.goto(contractUrl);
          const viewer1 = new GowSignDocumentViewerPage(page);
          await viewer1.waitForLoaded(60_000);

          expect(
            await viewer1.isStartButtonVisible(),
            'Start Signature button must be visible in first context',
          ).toBe(true);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-res02-01-context1-loaded.png'),
            fullPage: false,
          });

          // Customer closes the browser without signing.
          await page.close();
        });

        await test.step('Page 2 (new browser context): same redirectUrl still resolves to OUTSTANDING viewer', async () => {
          const newContext = await browser.newContext();
          const page2 = await newContext.newPage();
          try {
            await page2.goto(contractUrl);
            const viewer2 = new GowSignDocumentViewerPage(page2);
            await viewer2.waitForLoaded(60_000);

            const status = await viewer2.getStatusBadge();
            expect(status, 'GowSign badge must remain OUTSTANDING after browser-close').toBe('OUTSTANDING');
            expect(
              await viewer2.isStartButtonVisible(),
              'Start Signature button must still be available in the new context',
            ).toBe(true);

            await page2.screenshot({
              path: testInfo.outputPath('gowsign-res02-02-context2-still-outstanding.png'),
              fullPage: false,
            });
          } finally {
            await newContext.close();
          }
        });

        await test.step('DB: status remains OUTSTANDING and no CLOSED event was logged', async () => {
          const esignDocPk = Number((ctx as Record<string, unknown>)['esignDocPk']);
          const doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc, 'esign_document must still exist').not.toBeNull();
          expect(
            doc!.documentStatus,
            'esign_document.status should remain OUTSTANDING — no SIGNED/CANCELED/EXPIRED transition',
          ).toBe('OUTSTANDING');

          const events = await getEsignEventsByDocPk(db, esignDocPk);
          const closedLikeEvents = events.filter((e) =>
            /closed|canceled|cancelled|terminated/i.test(String(e.eventName ?? '')),
          );
          console.log(
            `[GowSign] events on esign_doc_pk=${esignDocPk}: ${JSON.stringify(events.map((e) => e.eventName))}`,
          );
          expect(
            closedLikeEvents.length,
            `No CLOSED/CANCELED-like event should be present after browser-close, found: ${closedLikeEvents
              .map((e) => e.eventName)
              .join(', ')}`,
          ).toBe(0);
        });
      },
    );

    test.skip(
      'RES-03 Expired link → renewal endpoint generates a new redirectUrl',
      { tag: ['@priority-low'] },
      async () => {
        // Skip reason: link-expiration renewal endpoint is TBD. The current
        // backend does not expose a renewal API, and forcing an expiry
        // requires aged fixtures (multi-day retention).
      },
    );

    test.skip(
      'RES-04.1 Re-access after SIGNED — read-only viewer with signed PDF',
      { tag: ['@priority-low'] },
      async () => {
        // Skip reason: requires automated signing helper to bring the contract
        // into SIGNED state before re-accessing. See MOD-01 skip.
      },
    );

    test.skip(
      'RES-04.2 Re-access after retention policy — link returns expired/archived state',
      { tag: ['@priority-low'] },
      async () => {
        // Skip reason: requires an aged fixture older than the retention
        // window — cannot be created on demand from a fresh run.
      },
    );

    // ─────────────────────────────────────────────────────────────
    // RES-05 / 5.1 — Multiple downloads return identical PDFs
    // ─────────────────────────────────────────────────────────────
    test(
      'RES-05 / 5.1 Downloading the contract multiple times yields identical PDFs (SHA-256)',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign RES-05 - download consistency',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('Drive lead to CC_AUTH_PASSED via UOwn API', async () => {
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

        await test.step('Wait for OUTSTANDING document', async () => {
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

        await test.step('Open viewer once, then download contract 5 times — collect SHA-256, filename, size', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const ITERATIONS = 5;
          const hashes: string[] = [];
          const filenames: string[] = [];
          const sizes: number[] = [];

          for (let i = 1; i <= ITERATIONS; i++) {
            const [download] = await Promise.all([
              page.waitForEvent('download', { timeout: 30_000 }),
              viewer.clickDownload(),
            ]);

            const filename = download.suggestedFilename();
            filenames.push(filename);

            const filePath = await download.path();
            expect(filePath, `download #${i} must produce a file path`).toBeTruthy();

            const buffer = await readFile(filePath as string);
            expect(buffer.length, `download #${i} buffer must be > 0 bytes`).toBeGreaterThan(0);
            sizes.push(buffer.length);

            const hash = createHash('sha256').update(buffer).digest('hex');
            hashes.push(hash);
            console.log(
              `[GowSign RES-05] iter=${i} filename="${filename}" size=${buffer.length} sha256=${hash}`,
            );

            if (i === 1) {
              await page.screenshot({
                path: testInfo.outputPath('gowsign-res05-01-after-first-download.png'),
                fullPage: false,
              });
            }
          }

          // All SHA-256 hashes must be identical
          const uniqueHashes = new Set(hashes);
          expect(
            uniqueHashes.size,
            `Expected 1 unique SHA-256 hash across ${ITERATIONS} downloads, got ${uniqueHashes.size}: ${[...uniqueHashes].join(', ')}`,
          ).toBe(1);

          // Filename consistency — must be the same suggested filename each time
          const uniqueFilenames = new Set(filenames);
          expect(
            uniqueFilenames.size,
            `Expected 1 unique filename across ${ITERATIONS} downloads, got ${uniqueFilenames.size}: ${[...uniqueFilenames].join(', ')}`,
          ).toBe(1);

          // Size sanity — every download must be > 0 and equal to the first
          expect(sizes.every((s) => s > 0)).toBe(true);
          expect(new Set(sizes).size, 'All downloads must report the same byte count').toBe(1);
        });
      },
    );

    test.skip(
      'RES-06 Multi-device concurrent access — second device reflects first device events',
      { tag: ['@priority-low'] },
      async () => {
        // Skip reason: requires concurrent signing-in-progress orchestration
        // across two browser contexts (the signing helper itself is not
        // automated yet — see MOD-01 skip).
      },
    );

    test.skip(
      'RES-07 Browser matrix coverage (Chrome/Firefox/Safari/Edge)',
      { tag: ['@priority-low'] },
      async () => {
        // Skip reason: covered by the dedicated US-EMB-11 browser-matrix
        // suite which uses Playwright project-level browser configuration.
        // Duplicating it here would diverge from the single source of truth.
      },
    );
  },
);

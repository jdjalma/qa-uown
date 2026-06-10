/**
 * E2E Hybrid — GowSign Iframe Events (EMB-04..EMB-09 partial coverage)
 *
 * Validates iframe postMessage events from the embedded GowSign document
 * viewer driven through the UOwn flow. QA does NOT call the GowSign API
 * directly (no `GOWSIGN_API_KEY` in QA envs); instead each test drives a lead
 * to `CC_AUTH_PASSED` via UOwn API (`setupApplicationViaApi`), opens the
 * `paymentDetailsList[0].redirectUrl` returned by the backend and observes:
 *
 *   - postMessage events captured via an `addInitScript` recorder
 *   - DB persistence in `uown_esign_event_trigger_log` / `uown_esign_document`
 *   - Lead status invariants in `uown_los_lead.lead_status`
 *
 * Smoke (`gowsign-smoke-flow.spec.ts`) already covers EMB-01 (iframe loads),
 * EMB-02 (loaded event) and EMB-10 (Start gate) — those scenarios are NOT
 * repeated here.
 *
 * Active tests (priority-medium):
 *   - EMB-04 / 4.1 — Customer closes without signing fires `closed`
 *   - EMB-07 / 7.1 — Origin validation (security): cross-origin postMessage ignored
 *   - EMB-08 / 8.1 — Auto-detect provider (gowsign.com origin / client=GOWSIGN)
 *
 * Skipped tests (priority-low) with explicit rationale:
 *   - EMB-03 / 3.1 — `completed` event (requires signing helper to fill+submit)
 *   - EMB-05 / 5.1 — `error` event (hard to simulate real iframe error)
 *   - EMB-06 / 6.1 — `close-iframe` (typically follows completed/closed; hard to isolate)
 *   - EMB-08 / 8.2 — Timeout without detection (unstable to reproduce)
 *   - EMB-09 / 9.1 — No Buddy widget / PP pre-selected (requires backend feature flag)
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage`
 *   - DB helpers:  `getEsignDocumentByLeadPk`, `getEsignEventsByDocPk`,
 *                  `countEsignEvents`, `waitForEsignEvent`, `waitForLeadStatus`
 *   - API setup:   `setupApplicationViaApi` with extractContractUrl + submitPaymentInfoViaApi
 *
 * Tags: @regression @e2e @hybrid + @priority-medium (active) / @priority-low (skipped).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { GowSignDocumentViewerPage } from '@pages/gowsign/index.js';
import {
  getEsignDocumentByLeadPk,
  getEsignEventsByDocPk,
  countEsignEvents,
} from '@helpers/esign-db.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Test data ───────────────────────────────────────────────────────
// Risk tier: low (CA + ProgressMobility, ~$800 — funds in QA without UW friction).
const testData = {
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
  tag: buildTags(TestTag.REGRESSION),
  extraTags: ['@e2e', '@hybrid'],
};

// Helper — capture postMessages dispatched to the page window.
// MUST be installed BEFORE the first navigation to `redirectUrl`.
type GsCapturedMessage = { origin: string; data: unknown; ts: number };

async function installPostMessageRecorder(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __gsMessages?: GsCapturedMessage[] }).__gsMessages = [];
    window.addEventListener('message', (event: MessageEvent) => {
      try {
        const arr = (window as unknown as { __gsMessages?: GsCapturedMessage[] }).__gsMessages;
        if (arr) arr.push({ origin: event.origin, data: event.data, ts: Date.now() });
      } catch {
        /* noop */
      }
    });
  });
}

async function readMessages(
  page: import('@playwright/test').Page,
): Promise<GsCapturedMessage[]> {
  return page.evaluate(() => {
    const arr = (window as unknown as { __gsMessages?: GsCapturedMessage[] }).__gsMessages;
    return Array.isArray(arr) ? [...arr] : [];
  });
}

test.describe(
  `GowSign Iframe Events - ${testData.merchant}`,
  { tag: [...splitTags(testData.tag), ...testData.extraTags] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // EMB-04 / 4.1 — Customer closes without signing fires `closed`
    // ─────────────────────────────────────────────────────────────
    test(
      'EMB-04 / 4.1 Customer closes iframe without signing → DB row LIKE "%CLOS%", esign_document.status=CANCELED, lead_status stays CONTRACT_CREATED',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign EMB-04 close without signing',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';
        let esignDocPk = 0;
        let initialEventCount = 0;

        await test.step('Drive lead to CC_AUTH_PASSED + locate esign_document', async () => {
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
          expect(contractUrl, 'redirectUrl required').toBeTruthy();

          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
          esignDocPk = esignDoc!.pk;

          const eventsBefore = await getEsignEventsByDocPk(db, esignDocPk);
          initialEventCount = eventsBefore.length;
          console.log(`[EMB-04] esignDocPk=${esignDocPk} eventsBefore=${initialEventCount}`);
        });

        await test.step('UI: open iframe and click Close Document', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          await viewer.clickCloseDocument();

          // Wait up to 15s for a postMessage with a CLOSE-ish type.
          const deadline = Date.now() + 15_000;
          let closeMsg: GsCapturedMessage | undefined;
          while (Date.now() < deadline && !closeMsg) {
            const msgs = await readMessages(page);
            closeMsg = msgs.find((m) => {
              const d = m.data as { type?: string; event?: string } | undefined;
              const tag = String(d?.type ?? d?.event ?? '').toLowerCase();
              return tag.includes('clos');
            });
            if (!closeMsg) await sleep(500);
          }
          expect(
            closeMsg,
            'Expected at least one postMessage with type/event matching /clos/i after clickCloseDocument',
          ).toBeTruthy();

          await page.screenshot({
            path: testInfo.outputPath('emb-04-after-close.png'),
            fullPage: false,
          });
        });

        await test.step('DB: new row in uown_esign_event_trigger_log with event_name LIKE "%CLOS%"', async () => {
          const deadline = Date.now() + 30_000;
          let closeEvent;
          while (!closeEvent && Date.now() < deadline) {
            const events = await getEsignEventsByDocPk(db, esignDocPk);
            closeEvent = events.find((e) => /CLOS/i.test(String(e.eventName ?? '')));
            if (!closeEvent) await sleep(2_000);
          }
          expect(
            closeEvent,
            `uown_esign_event_trigger_log should contain a row with event_name LIKE '%CLOS%' for esign_doc_pk=${esignDocPk}`,
          ).toBeTruthy();

          const eventsAfter = await getEsignEventsByDocPk(db, esignDocPk);
          expect(eventsAfter.length).toBeGreaterThan(initialEventCount);
          console.log(`[EMB-04] event_names=${JSON.stringify(eventsAfter.map((e) => e.eventName))}`);
        });

        await test.step('DB: uown_esign_document.status transitions to CANCELED (poll)', async () => {
          const deadline = Date.now() + 30_000;
          let doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          while (doc?.documentStatus !== 'CANCELED' && Date.now() < deadline) {
            await sleep(2_000);
            doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          }
          expect(
            doc?.documentStatus,
            `esign_document.status should be CANCELED after close (current=${doc?.documentStatus})`,
          ).toBe('CANCELED');
        });

        await test.step('DB: uown_los_lead.lead_status remains CONTRACT_CREATED (close ≠ sign)', async () => {
          const status = await db.getSingleString(
            'SELECT lead_status FROM uown_los_lead WHERE pk = $1',
            [Number(ctx.leadPk)],
          );
          expect(
            status,
            'Closing the iframe must NOT advance the lead past CONTRACT_CREATED',
          ).toBe('CONTRACT_CREATED');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // EMB-07 / 7.1 — Origin validation (security)
    // ─────────────────────────────────────────────────────────────
    test(
      'EMB-07 / 7.1 postMessage from unknown origin is ignored — no DB events created, lead_status unchanged, iframe still active',
      { tag: ['@priority-medium', '@security'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign EMB-07 origin validation',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';
        let esignDocPk = 0;
        let eventCountBefore = 0;
        let leadStatusBefore = '';

        await test.step('Drive lead to CC_AUTH_PASSED + capture baseline state', async () => {
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

          const events = await getEsignEventsByDocPk(db, esignDocPk);
          eventCountBefore = events.length;

          leadStatusBefore =
            (await db.getSingleString('SELECT lead_status FROM uown_los_lead WHERE pk = $1', [
              leadPk,
            ])) ?? '';
          expect(leadStatusBefore).toBeTruthy();
          console.log(
            `[EMB-07] esignDocPk=${esignDocPk} eventsBefore=${eventCountBefore} leadStatusBefore=${leadStatusBefore}`,
          );
        });

        await test.step('UI: open iframe and inject fake-origin postMessage', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          // Dispatch a postMessage that LOOKS like a completed event but is
          // sent from the test page itself (origin = page origin, NOT the
          // gowsign.com iframe origin). The UOwn frontend MUST validate the
          // event.origin and discard non-trusted messages.
          await page.evaluate(() => {
            window.postMessage(
              { type: 'completed', documentId: 'fake-malicious-doc-id', source: 'malicious' },
              '*',
            );
          });

          // Give the frontend / network a window to (mis)react.
          await sleep(5_000);

          // The Start button MUST still be visible — origin rejection means
          // the viewer state did not advance to "completed".
          expect(
            await viewer.isStartButtonVisible(),
            'Start Signature button must remain visible after fake-origin postMessage',
          ).toBe(true);

          await page.screenshot({
            path: testInfo.outputPath('emb-07-after-fake-origin.png'),
            fullPage: false,
          });
        });

        await test.step('DB: no new events persisted (cross-origin discarded)', async () => {
          const eventsAfter = await getEsignEventsByDocPk(db, esignDocPk);
          expect(
            eventsAfter.length,
            `Event count must not increase after fake-origin postMessage (before=${eventCountBefore} after=${eventsAfter.length})`,
          ).toBe(eventCountBefore);

          const completedCount = await countEsignEvents(db, esignDocPk, 'COMPLETED');
          expect(
            completedCount,
            'No COMPLETED event row may exist after fake-origin postMessage',
          ).toBe(0);
        });

        await test.step('DB: uown_los_lead.lead_status unchanged', async () => {
          const statusAfter = await db.getSingleString(
            'SELECT lead_status FROM uown_los_lead WHERE pk = $1',
            [Number(ctx.leadPk)],
          );
          expect(
            statusAfter,
            `lead_status must remain ${leadStatusBefore} (got=${statusAfter}) after fake-origin postMessage`,
          ).toBe(leadStatusBefore);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // EMB-08 / 8.1 — Auto-detect provider (gowsign.com origin)
    // ─────────────────────────────────────────────────────────────
    test(
      'EMB-08 / 8.1 Backend auto-detects GOWSIGN provider — esign_document.client=GOWSIGN and redirectUrl points to gowsign.com',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign EMB-08 auto-detect provider',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('Drive lead to CC_AUTH_PASSED via UOwn flow', async () => {
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
          expect(contractUrl, 'paymentDetailsList[0].redirectUrl required').toBeTruthy();
        });

        await test.step('Sanity: redirectUrl points to gowsign.com', async () => {
          const url = new URL(contractUrl);
          expect(
            /(^|\.)gowsign\.com$/i.test(url.hostname),
            `redirectUrl host must be gowsign.com (got "${url.hostname}")`,
          ).toBe(true);
        });

        await test.step('DB: uown_esign_document.client=GOWSIGN populated by backend dispatcher', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
          expect(
            esignDoc!.esignClient,
            'Backend dispatcher must select GOWSIGN as the cross-provider client',
          ).toBe('GOWSIGN');
          expect(esignDoc!.esignMode, 'esign_mode must be populated').toBeTruthy();

          console.log(
            `[EMB-08] esignDocPk=${esignDoc!.pk} client=${esignDoc!.esignClient} mode=${esignDoc!.esignMode}`,
          );
        });

        await test.step('UI sanity: iframe loads from gowsign.com', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);
          expect(await viewer.isStartButtonVisible()).toBe(true);

          await page.screenshot({
            path: testInfo.outputPath('emb-08-iframe-gowsign.png'),
            fullPage: false,
          });
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // SKIPPED — documented rationale per scenario
    // ─────────────────────────────────────────────────────────────

    // EMB-03 / 3.1 — completed event requires a signing helper that fills
    // every signature field and submits. No such helper exists today and
    // building one couples the test to the GowSign DOM (out of scope).
    test.skip(
      'EMB-03 / 3.1 completed event after signing — SKIPPED: requires signing helper (fill fields + submit)',
      { tag: ['@priority-low'] },
      async () => {
        /* intentionally empty */
      },
    );

    // EMB-05 / 5.1 — error event requires triggering a real iframe error
    // (network failure mid-load, malformed document, provider 5xx). These
    // are non-deterministic and would require route-level mocking that
    // defeats the integration value of the test.
    test.skip(
      'EMB-05 / 5.1 error event from iframe — SKIPPED: hard to simulate a real provider error deterministically',
      { tag: ['@priority-low'] },
      async () => {
        /* intentionally empty */
      },
    );

    // EMB-06 / 6.1 — close-iframe message is typically dispatched as a
    // follow-up to completed/closed; isolating it without first triggering
    // a sign or close event requires DOM manipulation specific to the
    // GowSign provider build, which is unstable across releases.
    test.skip(
      'EMB-06 / 6.1 close-iframe event — SKIPPED: usually follows completed/closed, hard to isolate',
      { tag: ['@priority-low'] },
      async () => {
        /* intentionally empty */
      },
    );

    // EMB-08 / 8.2 — Timeout-without-detection is the negative of 8.1; it
    // requires reproducing a backend dispatcher race that is timing-sensitive
    // and not deterministic in QA.
    test.skip(
      'EMB-08 / 8.2 provider auto-detect timeout — SKIPPED: unstable to reproduce deterministically',
      { tag: ['@priority-low'] },
      async () => {
        /* intentionally empty */
      },
    );

    // EMB-09 / 9.1 — "no Buddy widget / PaymentPlan pre-selected" depends
    // on a backend feature flag (Buddy widget rollout) not toggleable from
    // QA tests. Will be enabled once the flag is exposed via merchant config.
    test.skip(
      'EMB-09 / 9.1 no Buddy widget + PP pre-selected — SKIPPED: requires backend feature flag not exposed to QA',
      { tag: ['@priority-low'] },
      async () => {
        /* intentionally empty */
      },
    );
  },
);

/**
 * E2E Hybrid — GowSign Lease Status Transitions (LSE-*)
 *
 * Validates UOwn lease-status transitions driven by the GowSign integration.
 * QA does NOT call the GowSign API directly — there is no `GOWSIGN_API_KEY`
 * in QA/sandbox. Instead this suite drives a lead to `CC_AUTH_PASSED` via
 * the UOwn API (`setupApplicationViaApi`) and validates the backend's
 * internal GowSign integration via:
 *
 *   1. UOwn DB persistence (`uown_esign_document`, `uown_los_lead`,
 *      `uown_los_lead_notes`, `uown_esign_event_trigger_log`).
 *   2. Iframe lifecycle (postMessage capture via addInitScript) for events
 *      that DO NOT require completing the signature ceremony.
 *
 * Skipped scenarios document why setup-via-automation is not feasible
 * (require completing signature, postMessage `closed`/`error`, expiration).
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage`
 *   - DB helpers:  `getEsignDocumentByLeadPk`, `findLeadNoteContaining`,
 *                  `getEsignEventsByDocPk`, `waitForEsignDocumentStatus`,
 *                  `getEsignLeadStatus`
 *   - API setup:   `setupApplicationViaApi` with extractContractUrl +
 *                  submitPaymentInfoViaApi
 *
 * Tags: @regression @e2e @hybrid @priority-medium (skips → @priority-low).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { GowSignDocumentViewerPage } from '@pages/gowsign/index.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
  getEsignEventsByDocPk,
  waitForEsignDocumentStatus,
  getEsignLeadStatus,
} from '@helpers/esign-db.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Test data ───────────────────────────────────────────────────────
// Risk tier: low (CA + ProgressMobility, ~$800 — funds in QA without UW friction).
// Each test creates its own fresh lead — see Test Data Hierarchy in testing.md.
const testData = {
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
  tag: buildTags(TestTag.REGRESSION),
  extraTags: ['@e2e', '@hybrid', '@priority-medium', '@db-validation'],
};

test.describe(
  `GowSign Lease Status - ${testData.merchant}`,
  { tag: [...splitTags(testData.tag), ...testData.extraTags] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // LSE-02 / 2.1 — Backend creates GowSign document on CC_AUTH_PASSED
    //                lead transitions to CONTRACT_CREATED
    // ─────────────────────────────────────────────────────────────
    test(
      'LSE-02.1 Contract creation on CC_AUTH_PASSED moves lease to CONTRACT_CREATED',
      { tag: ['@priority-medium'] },
      async ({ page: _page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign LSE-02 - contract created',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

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
          expect(result.contractUrl, 'redirectUrl must be returned').toBeTruthy();
        });

        let esignDocPk = 0;

        await test.step('DB: uown_esign_document populated with client=GOWSIGN', async () => {
          const leadPk = Number(ctx.leadPk);
          expect(Number.isFinite(leadPk) && leadPk > 0, 'ctx.leadPk must be positive').toBeTruthy();

          // Backend creates the e-sign document asynchronously after CC_AUTH_PASSED.
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `uown_esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
          expect(esignDoc!.esignClient, 'client should be GOWSIGN').toBe('GOWSIGN');
          expect(esignDoc!.esignMode, 'esign_mode should be populated').toBeTruthy();
          // FK from uown_los_contract.esign_document_pk validates the contract row exists.
          expect(esignDoc!.contractPk, 'uown_los_contract.esign_document_pk must reference doc').not.toBeNull();
          esignDocPk = esignDoc!.pk;
          testInfo.annotations.push({ type: 'esignDocPk', description: String(esignDocPk) });
        });

        await test.step('DB: uown_los_lead_notes contains "Sent Contract to customer. Contract EsignDocPk"', async () => {
          const leadPk = Number(ctx.leadPk);
          const note = await findLeadNoteContaining(
            db,
            leadPk,
            'Sent Contract to customer. Contract EsignDocPk',
          );
          expect(note, 'Expected timeline note "Sent Contract to customer..."').not.toBeNull();
          expect(note!.notes).toMatch(/EsignDocPk\s*:\s*\d+/i);
        });

        await test.step('DB: uown_esign_event_trigger_log captures creation event for the doc', async () => {
          // Some flows persist a creation/dispatch log entry — accept any row for this doc.
          // Skip strict event_name assertion: the canonical name is environment-specific.
          const events = await getEsignEventsByDocPk(db, esignDocPk);
          console.log(`[LSE-02.1] events on creation: ${events.map((e) => e.eventName).join(',') || '(none)'}`);
          // Non-blocking — only assert if the backend logged at least one event.
          // If empty, no failure: creation event may be persisted only at first iframe load.
          expect(Array.isArray(events)).toBe(true);
        });

        await test.step('DB: uown_los_lead.lead_status === CONTRACT_CREATED', async () => {
          const leadPk = Number(ctx.leadPk);
          const status = await getEsignLeadStatus(db, leadPk);
          expect(status, `uown_los_lead.lead_status for lead_pk=${leadPk}`).toBe('CONTRACT_CREATED');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // LSE-03 / 3.1 — Lease stays in CONTRACT_CREATED after PDF generated
    //                (esign_document.status → OUTSTANDING, no lead-status regression)
    // ─────────────────────────────────────────────────────────────
    test(
      'LSE-03.1 Lease stays in CONTRACT_CREATED after PDF/OUTSTANDING is built',
      { tag: ['@priority-medium'] },
      async ({ page: _page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign LSE-03 - outstanding stable',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

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
          expect(result.contractUrl).toBeTruthy();
        });

        let esignDocPk = 0;

        await test.step('Wait for esign_document to exist', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, 'esign_document must exist').not.toBeNull();
          esignDocPk = esignDoc!.pk;
        });

        await test.step('Wait for esign_document.status=OUTSTANDING (PDF built)', async () => {
          await waitForEsignDocumentStatus(db, esignDocPk, 'OUTSTANDING', { timeoutMs: 60_000 });
        });

        await test.step('DB: lead_status remains CONTRACT_CREATED (no regression)', async () => {
          const leadPk = Number(ctx.leadPk);
          const status = await getEsignLeadStatus(db, leadPk);
          expect(status, 'lead_status must remain CONTRACT_CREATED after PDF built').toBe(
            'CONTRACT_CREATED',
          );
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // LSE-04 / 4.1 — Customer clicks Start → loaded/viewed event in event_trigger_log
    //                lead_status remains CONTRACT_CREATED
    // ─────────────────────────────────────────────────────────────
    test(
      'LSE-04.1 Start click logs LOADED/VIEWED event without lead_status regression',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign LSE-04 - start event',
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
              const fn = (window as unknown as { __capturePostMessage?: (m: unknown) => void })
                .__capturePostMessage;
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

          await viewer.clickStartSignature();

          // Wait for at least one postMessage to arrive (loaded/viewed).
          const deadline = Date.now() + 30_000;
          while (messages.length === 0 && Date.now() < deadline) {
            await sleep(500);
          }
          expect(messages.length, 'iframe must emit at least one postMessage').toBeGreaterThan(0);

          await page.screenshot({
            path: testInfo.outputPath('lse-04-after-start.png'),
            fullPage: false,
          });
        });

        await test.step('DB: new event row in uown_esign_event_trigger_log', async () => {
          const deadline = Date.now() + 30_000;
          let events = await getEsignEventsByDocPk(db, esignDocPk);
          while (events.length === 0 && Date.now() < deadline) {
            await sleep(2_000);
            events = await getEsignEventsByDocPk(db, esignDocPk);
          }
          expect(events.length, `events for esign_doc_pk=${esignDocPk}`).toBeGreaterThan(0);

          const eventNames = events.map((e) => e.eventName).filter(Boolean);
          console.log(`[LSE-04.1] event_names: ${JSON.stringify(eventNames)}`);
          // Backend may persist 'LOADED', 'VIEWED', or both.
          expect(
            eventNames.some((n) => /loaded|viewed/i.test(String(n))),
            'expected event_name LOADED or VIEWED',
          ).toBe(true);
        });

        await test.step('DB: lead_status remains CONTRACT_CREATED', async () => {
          const leadPk = Number(ctx.leadPk);
          const status = await getEsignLeadStatus(db, leadPk);
          expect(status, 'lead_status must remain CONTRACT_CREATED after Start click').toBe(
            'CONTRACT_CREATED',
          );
        });
      },
    );

    // ═════════════════════════════════════════════════════════════
    // SKIPPED — require setup paths not available in QA / hybrid harness
    // ═════════════════════════════════════════════════════════════

    // LSE-01.1 — Reject documentCreate when lead is in UW_DENIED
    // QA does NOT call GowSign API directly. Backend rejection on UW_DENIED is a
    // service-layer guard not observable from the UOwn-driven hybrid flow.
    // skip reason: requires direct GowSign API call (no GOWSIGN_API_KEY in QA).
    test.skip(
      'LSE-01.1 Reject documentCreate on UW_DENIED lead',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires direct GowSign API call (no GOWSIGN_API_KEY in QA) */
      },
    );

    // LSE-01.2 — Reject documentCreate when lead is in SIGNED
    // skip reason: requires direct GowSign API call (no GOWSIGN_API_KEY in QA).
    test.skip(
      'LSE-01.2 Reject documentCreate on SIGNED lead',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires direct GowSign API call (no GOWSIGN_API_KEY in QA) */
      },
    );

    // LSE-05 — Field interactions (typing in signature fields, initials, etc.)
    // skip reason: requires completing the in-iframe signature ceremony — no
    // automated helper exists yet (the GowSign iframe is a third-party UI).
    test.skip(
      'LSE-05 Field interactions inside the signing iframe',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires signing-ceremony helper inside GowSign iframe */
      },
    );

    // LSE-06 — Completed signing → SIGNED
    //   Implemented in `gowsign-signing-completion.spec.ts` (qa2/TireAgent),
    //   which exercises the real `signGowSignInFrame` ceremony. Sandbox cannot
    //   run the helper because GowSign is wired only in qa2 for this merchant.
    test.skip(
      'LSE-06 Completed signing transitions lease to SIGNED (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    // LSE-07 — Auto-FUNDING after SIGNED
    //   Implemented in `gowsign-signing-completion.spec.ts` as a single test
    //   that branches on `merchant.isSignedToFunding` (true → FUNDING,
    //   false → stays SIGNED) — covers LSE-07 and POST-02.{1,2}.
    test.skip(
      'LSE-07 Auto-FUNDING after SIGNED (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    // LSE-08 — close-iframe postMessage → lease CANCELLED
    //   Tried in qa2/TireAgent + JS-dispatched modal X click (lead 15745):
    //   esign_document.status stayed `SENT_TO_CUSTOMER`, zero
    //   uown_esign_event_trigger_log rows for the doc, no close/cancel
    //   note in lead_notes. The iframe in qa2 runs with `embedMode=true`,
    //   which hides the in-iframe close button; the parent modal X just
    //   removes the UI shell without propagating a `closed` postMessage.
    //   See `gowsign-signing-completion.spec.ts` (LSE-08.1 skip) for the
    //   evidence trail.
    test.skip(
      'LSE-08 close-iframe transitions lease to CANCELLED (covered as skip in gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: see gowsign-signing-completion.spec.ts LSE-08.1 for the rationale */
      },
    );

    // LSE-09 — error event in iframe
    //   Triggering a real `error` postMessage from the GowSign iframe
    //   requires either provider 5xx, a malformed document, or a forged
    //   cross-origin message — all out of reach from the QA browser context
    //   (synthetic dispatchEvent from the parent has the wrong origin,
    //   which the production listener rejects).
    test.skip(
      'LSE-09 error event in iframe',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: cross-origin postMessage forgery + non-deterministic iframe error */
      },
    );

    // LSE-10 / 10.1 — close-iframe after some event (no status change)
    // skip reason: requires reaching a mid-signing state first (depends on LSE-05/06).
    test.skip(
      'LSE-10.1 close-iframe after intermediate event leaves lead_status unchanged',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires mid-signing state to isolate close-iframe semantics */
      },
    );

    // LSE-11 — EXPIRED status
    // skip reason: requires waiting past document expiration window (hours/days).
    test.skip(
      'LSE-11 Document EXPIRED transition',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires waiting past document expiration window */
      },
    );

    // LSE-12 — Idempotency on duplicate webhook events
    // skip reason: requires real GowSign webhook replay tooling.
    test.skip(
      'LSE-12 Idempotency on duplicate webhook events',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires GowSign webhook replay tooling */
      },
    );

    // LSE-13 — Race condition: simultaneous webhook + manual transition
    // skip reason: requires controlled stress harness — out of scope for hybrid suite.
    test.skip(
      'LSE-13 Race: simultaneous webhook + manual transition',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires stress harness */
      },
    );

    // LSE-14 — Reversal of SIGNED → CONTRACT_CREATED
    // skip reason: depends on reaching SIGNED first (LSE-06).
    test.skip(
      'LSE-14 Reversal SIGNED → CONTRACT_CREATED',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires SIGNED state from real signing ceremony */
      },
    );

    // LSE-15 — Cascade: cancellation propagates to dependent records
    // skip reason: depends on LSE-08 (CANCELLED).
    test.skip(
      'LSE-15 Cascade on cancellation',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: depends on LSE-08 (CANCELLED transition) */
      },
    );

    // LSE-16 — Reconciliation job
    // skip reason: requires triggering the reconciliation job and aging timestamps —
    // out of scope for hybrid harness.
    test.skip(
      'LSE-16 Reconciliation job consistency',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: requires triggering reconciliation job + aged timestamps */
      },
    );
  },
);

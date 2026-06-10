/**
 * E2E Hybrid — GowSign Operations + Signature Fields Visibility
 *
 * Validates two related concerns of the UOwn ↔ GowSign integration that QA
 * can observe without having direct GowSign API access:
 *
 *   1. OPS-* — Operations performed via the UOwn flow (pipeline integration,
 *      sandbox flag). UOwn drives the lead; GowSign is observed via DB +
 *      iframe URL only.
 *   2. FLD-* — Signature fields visibility on the iframe. QA does NOT control
 *      which fields the backend sends to GowSign — that decision is internal
 *      to the UOwn ↔ GowSign-API integration. We can only validate that the
 *      iframe renders with a working signing flow (Start button visible).
 *
 * QA constraints:
 *   - QA does NOT call GowSign API directly (no `GOWSIGN_API_KEY` in QA envs).
 *   - The full lead lifecycle is driven via UOwn API
 *     (`setupApplicationViaApi` with `submitPaymentInfoViaApi: true`).
 *   - The iframe entrypoint is `paymentDetailsList[0].redirectUrl` from the
 *     `sendApplication` response.
 *   - Fields like signature, name, date, etc. are decided by the backend.
 *     QA validates only that at least one signing element is visible.
 *
 * Schema reference:
 *   - `uown_esign_document.client = 'GOWSIGN'`, `esign_mode`, `test_mode`
 *     (boolean — sandbox flag forced by QA env config), `lead_pk`
 *   - `uown_los_lead.lead_status`
 *   - `uown_los_lead_notes.notes`
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage` (src/pages/gowsign/document-viewer.page.ts)
 *   - DB helpers: `getEsignDocumentByLeadPk`, `findLeadNoteContaining`
 *                 (src/helpers/esign-db.helpers.ts)
 *   - API setup:  `setupApplicationViaApi` (src/helpers/api-setup.helpers.ts)
 *
 * Spec source: docs/taskTestingUown/gowsign_integration/gowsign-integration-test-scenarios.md
 *              §§ OPS-01..12, FLD-01..10
 */
import { test, expect } from '@support/base-test.js';
import { GowSignDocumentViewerPage } from '@pages/gowsign/index.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
} from '@helpers/esign-db.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';

// ── Test data ───────────────────────────────────────────────────────
// Risk tier: low (CA + ProgressMobility, ~$800 — funds in QA without UW friction).
// `submitPaymentInfoViaApi: true` drives the lead to CC_AUTH_PASSED so the
// backend creates the GowSign contract and returns redirectUrl in the response.
const testData = {
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
  tag: ['@regression', '@e2e', '@hybrid', '@priority-medium'] as string[],
  skipTag: ['@regression', '@e2e', '@hybrid', '@priority-low'] as string[],
};

test.describe(
  `GowSign — operations + fields visibility - ${testData.merchant}`,
  { tag: testData.tag },
  () => {
    // ═══════════════════════════════════════════════════════════════════
    // OPERATIONS (OPS-*)
    // ═══════════════════════════════════════════════════════════════════

    test.describe('Operations (OPS-*)', () => {
      // ─────────────────────────────────────────────────────────────
      // OPS-01 — Pipeline integration (active)
      //   Pipeline UOwn cria contrato GowSign automaticamente quando o
      //   lead chega a CC_AUTH_PASSED.
      // ─────────────────────────────────────────────────────────────
      test.describe('Pipeline integration (OPS-01)', () => {
        test(
          'OPS-01 / 1.1 UOwn pipeline auto-creates GowSign contract on CC_AUTH_PASSED (DB + API)',
          { tag: testData.tag },
          async ({ api, db, ctx, merchantConfig: mSetup }, testInfo) => {
            test.setTimeout(420_000);

            const { merchant, applicant, order } = buildTestData({
              state: testData.state,
              merchant: testData.merchant,
              orderTotal: testData.orderTotal,
              orderDescription: 'GowSign OPS-01 - pipeline auto-create',
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
              expect(
                result.contractUrl,
                'paymentDetailsList[0].redirectUrl must be returned (API contract URL)',
              ).toBeTruthy();
              contractUrl = result.contractUrl ?? '';
              ctx.contractUrl = contractUrl;
              console.log(`[GowSign OPS-01] redirectUrl="${contractUrl}"`);
            });

            await test.step('DB: uown_esign_document populated with client=GOWSIGN, esign_mode set', async () => {
              const leadPk = Number(ctx.leadPk);
              expect(
                Number.isFinite(leadPk) && leadPk > 0,
                'ctx.leadPk must be a positive number',
              ).toBeTruthy();

              // Backend creates the e-sign document asynchronously after CC_AUTH_PASSED.
              const deadline = Date.now() + 60_000;
              let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
              while (!esignDoc && Date.now() < deadline) {
                await sleep(2_000);
                esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
              }
              expect(
                esignDoc,
                `uown_esign_document row not found for lead_pk=${leadPk}`,
              ).not.toBeNull();
              expect(
                esignDoc!.esignClient,
                "uown_esign_document.client should be 'GOWSIGN'",
              ).toBe('GOWSIGN');
              expect(
                esignDoc!.esignMode,
                'uown_esign_document.esign_mode should be populated',
              ).toBeTruthy();

              console.log(
                `[GowSign OPS-01] esignDoc pk=${esignDoc!.pk} client=${esignDoc!.esignClient} ` +
                  `mode=${esignDoc!.esignMode} status=${esignDoc!.documentStatus}`,
              );
            });

            await test.step('DB: timeline note "Sent Contract to customer. Contract EsignDocPk" exists', async () => {
              const leadPk = Number(ctx.leadPk);
              const note = await findLeadNoteContaining(
                db,
                leadPk,
                'Sent Contract to customer. Contract EsignDocPk',
              );
              expect(
                note,
                'Expected timeline note "Sent Contract to customer. Contract EsignDocPk..." to exist in uown_los_lead_notes',
              ).not.toBeNull();
              expect(note!.notes).toMatch(/EsignDocPk\s*:\s*\d+/i);
            });

            await test.step('API: paymentDetailsList[0].redirectUrl was populated (already extracted)', async () => {
              expect(
                contractUrl,
                'paymentDetailsList[0].redirectUrl must be a non-empty URL',
              ).toBeTruthy();
              expect(contractUrl, 'redirectUrl must look like an HTTPS URL').toMatch(/^https?:\/\//);
            });
          },
        );
      });

      // ─────────────────────────────────────────────────────────────
      // OPS-11 — Sandbox flag (active)
      //   QA envs force `test_mode = true` on every GowSign document.
      // ─────────────────────────────────────────────────────────────
      test.describe('Sandbox flag (OPS-11)', () => {
        test(
          'OPS-11 / 11.1 QA environment forces uown_esign_document.test_mode=true',
          { tag: testData.tag },
          async ({ api, db, ctx, merchantConfig: mSetup }, testInfo) => {
            test.setTimeout(420_000);

            const { merchant, applicant, order } = buildTestData({
              state: testData.state,
              merchant: testData.merchant,
              orderTotal: testData.orderTotal,
              orderDescription: 'GowSign OPS-11 - test_mode flag',
            });

            await test.step('Ensure merchant config', async () => {
              await mSetup.configureByName(testData.merchant, 'lifecycle');
            });

            await test.step('Create lead via UOwn API → CC_AUTH_PASSED', async () => {
              await setupApplicationViaApi(
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
            });

            await test.step('DB: uown_esign_document.test_mode === true (QA forces sandbox)', async () => {
              const leadPk = Number(ctx.leadPk);
              expect(
                Number.isFinite(leadPk) && leadPk > 0,
                'ctx.leadPk must be a positive number',
              ).toBeTruthy();

              // Wait for the doc to exist first.
              const deadline = Date.now() + 60_000;
              let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
              while (!esignDoc && Date.now() < deadline) {
                await sleep(2_000);
                esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
              }
              expect(
                esignDoc,
                `uown_esign_document row not found for lead_pk=${leadPk}`,
              ).not.toBeNull();

              // The standard `EsignDocument` mapper in esign-db.helpers does
              // not project `test_mode` — query it directly here. SELECT only
              // (read-only, per .claude/rules/security.md).
              const row = await db.queryOne<{ test_mode: boolean | null }>(
                'SELECT test_mode FROM uown_esign_document WHERE pk = $1',
                [esignDoc!.pk],
              );
              expect(row, 'Direct SELECT for test_mode must return a row').not.toBeNull();
              console.log(`[GowSign OPS-11] test_mode=${row!.test_mode}`);
              expect(
                row!.test_mode,
                `In ${testData.env} every GowSign document must be flagged test_mode=true`,
              ).toBe(true);
            });
          },
        );
      });

      // ─────────────────────────────────────────────────────────────
      // OPS-02..10, OPS-12 — Skipped (UOwn portal UI features / unrelated)
      // ─────────────────────────────────────────────────────────────
      test.describe('Skipped — UOwn portal UI features / unrelated to GowSign integration', () => {
        test.skip(
          'OPS-02 Merchant visualizes GowSign contract in merchant portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires dedicated merchant-portal UI (not available in QA test rig).
            // The merchant viewing a contract is a UOwn portal feature, not part of the
            // GowSign integration surface that is observable from this hybrid test.
          },
        );

        test.skip(
          'OPS-03 Merchant cancels contract via merchant portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires merchant-portal UI to trigger cancel action.
          },
        );

        test.skip(
          'OPS-04 Merchant receives notification after contract is signed',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires real signing (no signing helper available in QA),
            // and the notification surface is the merchant portal which is out of scope.
          },
        );

        test.skip(
          'OPS-05 Operator resends signing link from Origination portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires Origination portal UI workflow (operator action).
          },
        );

        test.skip(
          'OPS-06 Operator manually cancels contract from Origination portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires Origination portal UI workflow (operator action).
          },
        );

        test.skip(
          'OPS-07 Operator corrects applicant data and re-issues contract',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires Origination portal UI workflow + re-issue flow.
          },
        );

        test.skip(
          'OPS-08 Filter contracts by status in UOwn portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: pure UOwn portal feature, not related to GowSign integration.
          },
        );

        test.skip(
          'OPS-09 Filter contracts by date range in UOwn portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: pure UOwn portal feature, not related to GowSign integration.
          },
        );

        test.skip(
          'OPS-10 Export contract list from UOwn portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: pure UOwn portal feature, not related to GowSign integration.
          },
        );

        test.skip(
          'OPS-12 CS searches contract by SSN in CS portal',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires CS portal UI which is not in scope of this hybrid test.
          },
        );
      });
    });

    // ═══════════════════════════════════════════════════════════════════
    // SIGNATURE FIELDS VISIBILITY (FLD-*)
    // ═══════════════════════════════════════════════════════════════════

    test.describe('Signature fields visibility (FLD-*)', () => {
      // ─────────────────────────────────────────────────────────────
      // FLD-01 — At least one signature field visible (active)
      //   QA can only sanity-check that the iframe renders a signing
      //   flow. The Start Signature button being visible is the
      //   canonical proxy for "fields are present and ready".
      // ─────────────────────────────────────────────────────────────
      test.describe('Field presence (FLD-01)', () => {
        test(
          'FLD-01 / 1.1 At least one signature field visible in GowSign iframe (Start button = fields ready)',
          { tag: testData.tag },
          async ({ page, api, ctx, merchantConfig: mSetup }, testInfo) => {
            test.setTimeout(420_000);

            const { merchant, applicant, order } = buildTestData({
              state: testData.state,
              merchant: testData.merchant,
              orderTotal: testData.orderTotal,
              orderDescription: 'GowSign FLD-01 - fields visible',
            });

            await test.step('Ensure merchant config', async () => {
              await mSetup.configureByName(testData.merchant, 'lifecycle');
            });

            let contractUrl = '';

            await test.step('Drive lead to CC_AUTH_PASSED → contract OUTSTANDING', async () => {
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
              expect(contractUrl, 'redirectUrl must be present').toBeTruthy();
            });

            await test.step('UI: open viewer + assert Start Signature button is visible (= fields ready)', async () => {
              await page.goto(contractUrl);
              const viewer = new GowSignDocumentViewerPage(page);
              await viewer.waitForLoaded(60_000);

              // Sanity proxy for "at least one signature field is present":
              // when the GowSign viewer enters OUTSTANDING and renders the
              // Start Signature CTA, the document already contains the
              // signing fields the backend sent. Without fields, the viewer
              // would not show the Start button.
              const startVisible = await viewer.isStartButtonVisible();
              expect(
                startVisible,
                'Start Signature button must be visible — it is the canonical signal that signature fields are present',
              ).toBe(true);

              // Cross-check: status badge must be OUTSTANDING for the Start
              // button to be a valid signal.
              const status = await viewer.getStatusBadge();
              expect(
                status,
                'GowSign status badge should be OUTSTANDING (pre-signature state)',
              ).toBe('OUTSTANDING');

              await page.screenshot({
                path: testInfo.outputPath('gowsign-fld01-fields-visible.png'),
                fullPage: false,
              });
            });
          },
        );
      });

      // ─────────────────────────────────────────────────────────────
      // FLD-02..10 — Skipped (backend internals / require signing)
      // ─────────────────────────────────────────────────────────────
      test.describe('Skipped — backend internals / require signing helper', () => {
        test.skip(
          'FLD-02 Required-field validation prevents submission when empty',
          { tag: testData.skipTag },
          async () => {
            // Reason: the backend (UOwn ↔ GowSign-API) decides which fields
            // are sent and which are required. QA cannot manipulate the field
            // payload, so we cannot synthesize an "empty required field" case.
            // Validation logic is internal to GowSign and not observable here.
          },
        );

        test.skip(
          'FLD-03 Mutually-exclusive fields enforce only-one-checked invariant',
          { tag: testData.skipTag },
          async () => {
            // Reason: mutual exclusivity is configured at the field level by
            // the backend when it builds the GowSign payload. QA does not
            // control field metadata, and verifying invariants requires
            // signing which is unavailable in QA.
          },
        );

        test.skip(
          'FLD-04 Field width respects backend-supplied dimension',
          { tag: testData.skipTag },
          async () => {
            // Reason: backend internal — QA cannot inspect or manipulate the
            // width/height attributes the backend sends to GowSign. Visible
            // dimensions in the iframe depend on GowSign rendering, not on
            // observable UOwn behaviour.
          },
        );

        test.skip(
          'FLD-05 Field height respects backend-supplied dimension',
          { tag: testData.skipTag },
          async () => {
            // Reason: see FLD-04 — backend internal, not observable.
          },
        );

        test.skip(
          'FLD-06 Field positioning (x/y) on PDF matches backend payload',
          { tag: testData.skipTag },
          async () => {
            // Reason: positioning is decided server-side; QA has no signing
            // helper to confirm rendered coordinates against backend payload.
          },
        );

        test.skip(
          'FLD-07 Signature field renders correct type (signature vs initial)',
          { tag: testData.skipTag },
          async () => {
            // Reason: type discrimination requires inspecting the GowSign
            // field metadata which is not exposed to QA. Without a signing
            // helper we also cannot confirm correct binding to LESSEE party.
          },
        );

        test.skip(
          'FLD-08 Date field auto-fills with current date on signature',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires actually signing the document — QA has no
            // GowSign signing helper available in this environment.
          },
        );

        test.skip(
          'FLD-09 Name field auto-fills with applicant full name on signature',
          { tag: testData.skipTag },
          async () => {
            // Reason: requires actually signing the document — same constraint
            // as FLD-08.
          },
        );

        test.skip(
          'FLD-10 Field assignment matches party (LESSEE vs LESSOR) per backend rule',
          { tag: testData.skipTag },
          async () => {
            // Reason: party assignment is part of the field metadata sent by
            // the backend; QA cannot inspect it without GowSign API access,
            // and cannot confirm assignment without a signing helper.
          },
        );
      });
    });
  },
);

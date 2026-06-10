/**
 * E2E Hybrid — GowSign Post-Signing Flow (POST-*)
 *
 * Validates the post-signing pipeline driven by the UOwn backend's GowSign
 * integration. QA does NOT call the GowSign provider API directly — there is
 * no GOWSIGN_API_KEY in QA/sandbox. Instead this suite drives a lead via the
 * UOwn API (`setupApplicationViaApi`) and asserts:
 *
 *   - `paymentDetailsList[0].redirectUrl` shape (POST-03.1).
 *   - Signing-fee transaction precedes esign-document creation (POST-08.1).
 *
 * Most POST-* scenarios require a human to physically complete the signature
 * ceremony (or to programmatically trigger postMessage closed/error events on
 * the embedded GowSign widget). Those are kept as `.skip` with the reason
 * documented inline so the suite remains a single source of intent.
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage`
 *   - DB helpers:  `getEsignDocumentByLeadPk`, `findLeadNoteContaining`,
 *                  `waitForLeadStatus`, `getEsignLeadStatus`
 *   - API setup:   `setupApplicationViaApi` with extractContractUrl +
 *                  submitPaymentInfoViaApi
 *
 * Tags: @regression @e2e @hybrid @priority-medium (skips → @priority-low).
 *
 * Schema deviations vs. the spec request:
 *   - `uown_los_credit_card_transaction` has no `transaction_type` column;
 *     the closest is `cc_transaction_type` (free text) and `charge_type`
 *     (free text). The signing-fee row is identified by `lead_pk` +
 *     `status='APPROVED'` AND (`cc_transaction_type ILIKE '%FEE%'` OR
 *     `charge_type ILIKE '%FEE%'` OR `cc_action ILIKE '%SIGN%'`).
 *     This is a SELECT-only diagnostic query — no mutations.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
  waitForLeadStatus,
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

// ── Diagnostic row shape for credit card transactions ──────────────
interface CcTxnRow {
  pk: number | string;
  lead_pk: number | string | null;
  status: string | null;
  cc_transaction_type: string | null;
  charge_type: string | null;
  cc_action: string | null;
  amount: string | null;
  row_created_timestamp: Date | null;
}

test.describe(
  `GowSign Post-Signing - ${testData.merchant}`,
  { tag: [...splitTags(testData.tag), ...testData.extraTags] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // POST-03 / 3.1 — Redirect URL construction
    //   sendApplication response carries paymentDetailsList[0].redirectUrl
    //   and the URL points at the GowSign provider domain.
    // ─────────────────────────────────────────────────────────────
    test(
      'POST-03.1 sendApplication returns a well-formed GowSign redirectUrl',
      { tag: ['@priority-medium'] },
      async ({ page: _page, api, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign POST-03 - redirect URL shape',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('sendApplication via UOwn API + extract redirectUrl', async () => {
          const result = await setupApplicationViaApi(
            api,
            {
              merchant,
              applicant,
              order,
              verifyApproval: true,
              extractContractUrl: true,
              // No CC submission — POST-03.1 only needs the redirectUrl shape.
              skipCreditCardAuth: true,
            },
            testInfo,
            ctx,
          );
          contractUrl = result.contractUrl ?? '';
        });

        await test.step('redirectUrl is non-empty and absolute https URL', () => {
          expect(contractUrl, 'paymentDetailsList[0].redirectUrl missing').toBeTruthy();
          expect(contractUrl).toMatch(/^https:\/\//);
        });

        await test.step('redirectUrl host points to gowsign or uownleasing subdomain', () => {
          // The embedded contract is served from an UOwn host that proxies the
          // GowSign provider iframe; either host shape is acceptable in QA.
          const url = new URL(contractUrl);
          const isProvider = /gowsign\.com$/i.test(url.hostname);
          const isProxy = /uownleasing\.com$/i.test(url.hostname);
          expect(
            isProvider || isProxy,
            `redirectUrl host "${url.hostname}" is neither *.gowsign.com nor *.uownleasing.com`,
          ).toBeTruthy();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // POST-08 / 8.1 — Signing fee charged BEFORE GowSign contract creation
    //   timeline: cc_transaction (FEE / signing) → uown_esign_document
    // ─────────────────────────────────────────────────────────────
    test(
      'POST-08.1 Signing fee transaction precedes GowSign document creation',
      { tag: ['@priority-medium'] },
      async ({ page: _page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign POST-08 - signing fee precedes contract',
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

        await test.step('Wait for lead_status=CONTRACT_CREATED (signals doc creation)', async () => {
          const leadPk = Number(ctx.leadPk);
          await waitForLeadStatus(db, leadPk, 'CONTRACT_CREATED', { timeoutMs: 90_000 });
        });

        let esignDocCreatedAt: Date | null = null;

        await test.step('DB: capture uown_esign_document.row_created_timestamp', async () => {
          const leadPk = Number(ctx.leadPk);
          // Backend creates the e-sign document asynchronously after CC_AUTH_PASSED.
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `uown_esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
          expect(esignDoc!.esignClient, 'client should be GOWSIGN').toBe('GOWSIGN');
          expect(
            esignDoc!.rowCreatedTimestamp,
            'esign_document.row_created_timestamp must be populated',
          ).not.toBeNull();
          esignDocCreatedAt = esignDoc!.rowCreatedTimestamp;
          testInfo.annotations.push({
            type: 'esignDocCreatedAt',
            description: esignDocCreatedAt!.toISOString(),
          });
        });

        await test.step('DB: signing-fee CC transaction exists and APPROVED', async () => {
          const leadPk = Number(ctx.leadPk);
          // Schema deviation: the table has no `transaction_type` column.
          // The signing-fee row is identified heuristically by free-text
          // columns (cc_transaction_type, charge_type, cc_action) — any
          // approved fee/sign-flagged transaction tied to this lead counts.
          const rows = await db.query<CcTxnRow>(
            `SELECT pk,
                    lead_pk,
                    status,
                    cc_transaction_type,
                    charge_type,
                    cc_action,
                    amount,
                    row_created_timestamp
               FROM uown_los_credit_card_transaction
              WHERE lead_pk = $1
                AND status = 'APPROVED'
                AND (
                  cc_transaction_type ILIKE '%FEE%'
                  OR charge_type ILIKE '%FEE%'
                  OR cc_action ILIKE '%SIGN%'
                  OR cc_action ILIKE '%FEE%'
                )
              ORDER BY row_created_timestamp ASC NULLS LAST, pk ASC
              LIMIT 1`,
            [leadPk],
          );
          expect(
            rows.length,
            `No APPROVED signing-fee transaction found for lead_pk=${leadPk}`,
          ).toBeGreaterThan(0);
          const fee = rows[0];
          expect(fee.status).toBe('APPROVED');
          expect(
            fee.row_created_timestamp,
            'signing-fee row_created_timestamp must be populated',
          ).not.toBeNull();
          testInfo.annotations.push({
            type: 'signingFeeCreatedAt',
            description: new Date(fee.row_created_timestamp!).toISOString(),
          });
          testInfo.annotations.push({
            type: 'signingFeePk',
            description: String(fee.pk),
          });

          // The signing fee MUST be persisted before the esign document.
          // Backend ordering: charge fee → create GowSign contract.
          const feeMs = new Date(fee.row_created_timestamp!).getTime();
          const docMs = esignDocCreatedAt!.getTime();
          expect(
            feeMs <= docMs,
            `signing-fee row_created_timestamp (${fee.row_created_timestamp}) must precede or equal esign_document.row_created_timestamp (${esignDocCreatedAt!.toISOString()})`,
          ).toBeTruthy();
        });

        await test.step('DB: timeline note "Sent Contract to customer" exists', async () => {
          const leadPk = Number(ctx.leadPk);
          const note = await findLeadNoteContaining(
            db,
            leadPk,
            'Sent Contract to customer',
          );
          expect(
            note,
            'Expected lead-notes entry "Sent Contract to customer" after fee + doc creation',
          ).not.toBeNull();
        });

        await test.step('DB: lead_status === CONTRACT_CREATED', async () => {
          const leadPk = Number(ctx.leadPk);
          const status = await getEsignLeadStatus(db, leadPk);
          expect(status).toBe('CONTRACT_CREATED');
        });
      },
    );

    // ═════════════════════════════════════════════════════════════
    // SKIPPED scenarios — documented intent
    // ═════════════════════════════════════════════════════════════

    // POST-01 / 1.1 — Lease transitions to SIGNED after signature ceremony.
    //   Implemented in `gowsign-signing-completion.spec.ts` (qa2/TireAgent)
    //   alongside LSE-06.
    test.skip(
      'POST-01.1 Lease transitions to SIGNED after signature ceremony (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    // POST-02 / 2.1 / 2.2 — Auto-FUNDING vs stays-SIGNED depending on
    //   merchant.isSignedToFunding. Implemented as a single branching test in
    //   `gowsign-signing-completion.spec.ts` (qa2/TireAgent).
    test.skip(
      'POST-02.1 Auto-FUNDING transition for merchants with isSignedToFunding=true (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    test.skip(
      'POST-02.2 Lease stays SIGNED when merchant.isSignedToFunding=false (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    // POST-03 / 3.2 — Redirect handling when iframe emits event=canceled.
    // Reason: requires programmatically dispatching a postMessage canceled
    // event from the GowSign iframe (cross-origin, not feasible in QA).
    test.skip(
      'POST-03.2 Redirect handling for postMessage event=canceled',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped — needs cross-origin postMessage trigger */
      },
    );

    // POST-04 / 4.1 — Thank-you / success screen after signature.
    //   Implemented in `gowsign-signing-completion.spec.ts` (asserts "Thank You",
    //   success copy, and the (877) 353-8696 support phone post-signing).
    test.skip(
      'POST-04.1 Post-signature thank-you screen renders (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    // POST-05 / 5.1 — BW13 Buddy widget shown post-signature (TireAgent flow).
    // Reason: requires complex UI + TireAgent merchant + signed contract.
    test.skip(
      'POST-05.1 BW13 Buddy widget renders for TireAgent post-signature',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped — requires TireAgent flow + complex UI */
      },
    );

    // POST-06 / 6.1 — Cancellation cascade after signing.
    // Reason: covered in CRE-07.
    test.skip(
      'POST-06.1 Signing cancellation cascades to lease cleanup (covered by CRE-07)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped — covered in CRE-07 */
      },
    );

    // POST-07 / 7.1 — CC Peek consent captured at signing.
    //   Implemented in `gowsign-signing-completion.spec.ts` (LSE-06 test
    //   asserts the CC Peek consent note + uown_los_lead.cc_peek_consent
    //   column transition).
    test.skip(
      'POST-07.1 CC Peek consent recorded after signing (covered by gowsign-signing-completion.spec.ts)',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: covered by qa2 spec — see gowsign-signing-completion.spec.ts */
      },
    );

    // POST-08 / 8.2 — Signing-fee failure blocks GowSign contract creation.
    // Reason: requires injecting an invalid CC at the right step (specific
    // negative-path setup not yet automated).
    test.skip(
      'POST-08.2 Failed signing-fee blocks GowSign contract creation',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped — needs invalid-CC setup */
      },
    );

    // POST-09 / 9.1 — Pre-selected protection plan activated after signed.
    //   Requires a merchant configured with `uown_los_protection_plan.opt_in_source
    //   = 'MERCHANT_PRESELECTED'`. TireAgent (qa2) — the merchant we use for the
    //   real signing ceremony — does NOT currently preselect a PP, so no row
    //   lands in `uown_los_protection_plan` after signing. Re-enabling this
    //   requires either updating TireAgent's merchant config in qa2 or finding
    //   another GowSign-wired merchant that preselects PP.
    test.skip(
      'POST-09.1 Pre-selected protection plan activated post-signed',
      { tag: ['@priority-low'] },
      async () => {
        /* skipped: no GowSign-wired merchant with MERCHANT_PRESELECTED PP available in qa2 */
      },
    );
  },
);

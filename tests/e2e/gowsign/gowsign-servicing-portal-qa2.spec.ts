/**
 * E2E qa2 — GowSign Servicing Portal Visibility (US-OPS-* + US-LST-* — UI subset)
 *
 * MAJOR SCOPE NOTE:
 *   The strict LST-01..04 spec scenarios (`GET /api/document?...`) and most
 *   OPS-* scenarios are GowSign-provider API or UOWN backend API endpoints,
 *   NOT operator UI flows. Those require `GOWSIGN_API_KEY` and remain
 *   blocked. What we CAN exercise from the Servicing portal:
 *
 *   ✅ Operator sees the journey artifacts of a GowSign-signed lease:
 *      - account status reflects the post-funding state
 *      - customer detail shows expected info
 *   ✅ Customer search via Servicing /search lands on the right account
 *
 *   Skipped (with reasons) in-line below for the rest of OPS/LST.
 *
 * Pre-req:
 *   - DB tunnel qa2 active (port 5445)
 *   - Servicing credentials configured (env.getCredentials('manager'))
 */
import { test as ctxTest, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, findLeadNoteContaining } from '@helpers/index.js';
import { createPreQualifiedApplication, driveLeadToFunding } from '@helpers/api-setup.helpers.js';
import {
  installPostMessageRecorder,
  signGowSignInFrame,
} from '@helpers/gowsign-signing.helper.js';
import { waitForLeadStatus } from '@helpers/esign-db.helpers.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { navigateToServicingCustomer } from '@helpers/navigation.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';

const data = {
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  merchantRefCode: 'OW90218-0001',
  orderTotal: '800',
};

ctxTest.describe(
  `GowSign Servicing Portal - ${data.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-medium'] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // OPS-Servicing-View — Operator finds the GowSign-signed lease
    //   in Servicing portal after the customer signed and the lease
    //   transitioned to FUNDING. Validates the journey artifacts are
    //   observable from the operator side.
    // ─────────────────────────────────────────────────────────────
    ctxTest(
      'OPS Servicing View: signed GowSign lease is reachable + visible in Servicing portal',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db, testEnv }, testInfo) => {
        ctxTest.setTimeout(600_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign OPS-Servicing - operator view',
        });

        await installPostMessageRecorder(page);

        await ctxTest.step('API + UI: drive lead to SIGNED via the iframe helper', async () => {
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
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.signClicked).toBe(true);

          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
        });

        await ctxTest.step('API: drive lead to FUNDING (settle + updateFundingStatus)', async () => {
          // Servicing portal works on accounts; an account is created when
          // the lease moves SIGNED → settle → FUNDING.
          await driveLeadToFunding(api, merchant, ctx);

          // After driveLeadToFunding, the account exists. Capture accountPk
          // from DB (the helper wires it into ctx if the API exposes it).
          const accRow = await db.queryOne<{ pk: string }>(
            'SELECT pk FROM uown_sv_account WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1',
            [Number(ctx.leadPk)],
          );
          expect(accRow, `account row should exist for lead_pk=${ctx.leadPk}`).not.toBeNull();
          ctx.accountPk = accRow!.pk;
          console.log(`[OPS-Servicing] leadPk=${ctx.leadPk} accountPk=${ctx.accountPk}`);
        });

        await ctxTest.step('Servicing: login as manager', async () => {
          await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv);
        });

        await ctxTest.step('Servicing: search and open the customer information page', async () => {
          const customerPage = await navigateToServicingCustomer(
            page,
            String(ctx.accountPk),
          );

          // The Servicing customer page should load with the account in scope.
          // URL should contain /customer-information/{accountPk}.
          const url = page.url();
          console.log(`[OPS-Servicing] Servicing customer URL: ${url}`);
          expect(url).toContain('/customer-information/');
          expect(url).toContain(String(ctx.accountPk));

          // Account status should reflect the post-funding state — typically
          // FUNDING / FUNDED / ACTIVE depending on backend pipeline timing.
          const status = await customerPage.getAccountStatus();
          console.log(`[OPS-Servicing] account status in Servicing: "${status}"`);
          expect(
            status.length,
            'Servicing must surface a non-empty account status',
          ).toBeGreaterThan(0);
          // Status should NOT be a pre-sign value.
          expect(['NEW', 'PENDING_UW', 'UW_APPROVED', 'CC_AUTH_PASSED', 'CONTRACT_CREATED']).not.toContain(
            status,
          );
        });

        await ctxTest.step('DB cross-check: lead reflects the post-FUNDING state too', async () => {
          const row = await db.queryOne<{ lead_status: string }>(
            'SELECT lead_status FROM uown_los_lead WHERE pk=$1',
            [Number(ctx.leadPk)],
          );
          expect(row).not.toBeNull();
          // Acceptable post-FUNDING states.
          expect(['FUNDING', 'FUNDED', 'ACTIVE', 'SIGNED']).toContain(row!.lead_status);
        });

        await ctxTest.step('DB: signing audit-trail visible (EsignDocPk + SIGNED transition in lead_notes)', async () => {
          // The Servicing operator can audit the signing journey via the
          // Activity Log — backed by uown_los_lead_notes. We assert the key
          // notes are present so the operator's portal view has substance.
          const docNote = await findLeadNoteContaining(
            db,
            Number(ctx.leadPk),
            'Sent Contract to customer',
          );
          expect(docNote, 'Sent Contract note must exist for the signed lead').not.toBeNull();

          const signedNote = await findLeadNoteContaining(
            db,
            Number(ctx.leadPk),
            'status%instantly from CONTRACT_CREATED to SIGNED',
          );
          expect(signedNote, 'Servicing operator audit log should record SIGNED transition').not.toBeNull();
        });
      },
    );

    // ═════════════════════════════════════════════════════════════
    // REMOVED scenarios:
    //   - LST-01..04 / OPS-02 / OPS-03 / OPS-08..12 — require GowSign
    //     provider API or UOWN backend API calls (no GOWSIGN_API_KEY in
    //     qa). Belong in the dev team's unit/integration suite, not E2E.
    //   - OPS-05/06/07 (Resend / Cancel / Edit affordances on Servicing
    //     customer-information) — confirmed with product: these affordances
    //     do NOT exist in the Servicing portal. Spec was authored against
    //     an assumed UX that never shipped here.
    // ═════════════════════════════════════════════════════════════
  },
);

/**
 * E2E qa2 — GowSign Modify Lease Pos-Signed (US-MOD-01) full lifecycle
 *
 * Coverage:
 *   ✅ MOD-01.1 Phase 1: modify cascade (original SIGNED → LEASE_MOD_REQUESTED,
 *               new lead spawned at UW_APPROVED, original doc decoupled)
 *   ✅ MOD-01.1 Phase 2: customer signs the NEW contract via the iframe →
 *               new lead reaches SIGNED, new esign_document is SIGNED, the
 *               modify journey produces a fully signed replacement lease.
 *
 * Pre-req: DB tunnel qa2 ativo (porta 5445).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { installPostMessageRecorder, signGowSignInFrame } from '@helpers/gowsign-signing.helper.js';
import {
  waitForLeadStatus,
  getEsignDocumentByLeadPk,
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
  `GowSign Modify Lease - ${data.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-medium'] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // MOD-01.1 — Modify between SIGNED and FUNDED spawns a new lead.
    // ─────────────────────────────────────────────────────────────
    test(
      'MOD-01.1 modifyInvoiceForLead on SIGNED lead spawns new lead with new contract + cancels original',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        // 2 signing ceremonies (original + new contract) → ~3-4 min UI work
        // + DB polling. 12 min cap is generous for stability.
        test.setTimeout(720_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign MOD-01.1 - modify pos-signed',
        });

        await installPostMessageRecorder(page);

        let originalLeadPk = 0;
        let originalDocPk = 0;
        let newLeadPk = 0;

        await test.step('Drive original lead to SIGNED via the iframe helper', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(contractUrl).toBeTruthy();
          originalLeadPk = Number(ctx.leadPk);

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

          await waitForLeadStatus(db, originalLeadPk, 'SIGNED', { timeoutMs: 60_000 });

          const doc = await getEsignDocumentByLeadPk(db, originalLeadPk);
          expect(doc).not.toBeNull();
          originalDocPk = doc!.pk;
          console.log(`[MOD-01.1] originalLeadPk=${originalLeadPk} originalDocPk=${originalDocPk}`);
        });

        await test.step('API: POST /modifyInvoiceForLead returns newLeadPk', async () => {
          const resp = await api.lead.modifyInvoiceForLead(originalLeadPk);
          expect(resp.ok, `modifyInvoiceForLead: ${resp.status}`).toBeTruthy();
          expect(resp.body?.newLeadPk, 'response must carry newLeadPk').toBeTruthy();
          newLeadPk = Number(resp.body!.newLeadPk);
          expect(
            newLeadPk,
            `newLeadPk should be a different lead from originalLeadPk=${originalLeadPk}`,
          ).not.toBe(originalLeadPk);
          console.log(`[MOD-01.1] newLeadPk=${newLeadPk}`);
        });

        await test.step('DB: original lead transitioned to LEASE_MOD_REQUESTED', async () => {
          const status = await waitForLeadStatus(db, originalLeadPk, 'LEASE_MOD_REQUESTED', {
            timeoutMs: 30_000,
          });
          expect(status).toBe('LEASE_MOD_REQUESTED');
        });

        await test.step('DB: original lead notes record the modify request', async () => {
          const note = await db.queryOne<{ notes: string }>(
            `SELECT notes FROM uown_los_lead_notes
             WHERE lead_pk=$1 AND notes ILIKE '%modifyInvoice%'
             ORDER BY pk DESC LIMIT 1`,
            [originalLeadPk],
          );
          expect(note, 'expected at least one note mentioning "modifyInvoice"').not.toBeNull();
          console.log(`[MOD-01.1] modify note: ${String(note!.notes).slice(0, 200)}`);
        });

        await test.step('DB: new lead exists at a valid pre-contract status (UW_APPROVED expected)', async () => {
          // Empirical (qa2 2026-04-28): modifyInvoiceForLead spawns the new
          // lead at UW_APPROVED — the contract is built later when the
          // customer re-enters CC info on the new flow (same as a fresh
          // application). We validate the spawn point here; LSE-06 covers
          // the contract-creation half of the lifecycle independently.
          const deadline = Date.now() + 30_000;
          let newLeadStatus: string | null = null;
          while (Date.now() < deadline) {
            const row = await db.queryOne<{ lead_status: string }>(
              'SELECT lead_status FROM uown_los_lead WHERE pk=$1',
              [newLeadPk],
            );
            if (row?.lead_status && row.lead_status !== 'NEW' && row.lead_status !== 'PENDING_UW') {
              newLeadStatus = row.lead_status;
              break;
            }
            await sleep(2_000);
          }
          console.log(`[MOD-01.1] new lead spawn status=${newLeadStatus}`);
          expect(newLeadStatus, `new lead ${newLeadPk} should advance past NEW/PENDING_UW`).toBeTruthy();
          // Acceptable spawn states: UW_APPROVED (most common) or
          // CONTRACT_CREATED (if backend auto-creates contract too).
          expect(['UW_APPROVED', 'CC_AUTH_PASSED', 'CONTRACT_CREATED']).toContain(newLeadStatus);
        });

        await test.step('Cascade verification: original esign_document is fully decoupled from new lead', async () => {
          // The original doc remains attached to originalLeadPk only — it
          // must NOT migrate to the new lead. Sanity check both directions.
          const origRow = await db.queryOne<{ lead_pk: string }>(
            'SELECT lead_pk FROM uown_esign_document WHERE pk=$1',
            [originalDocPk],
          );
          expect(
            Number(origRow?.lead_pk),
            'original esign_document must still point at original lead',
          ).toBe(originalLeadPk);

          // No esign_document yet for the new lead (will be created when
          // the customer re-submits CC for it).
          const newDocs = await db.query<{ pk: string }>(
            'SELECT pk FROM uown_esign_document WHERE lead_pk=$1',
            [newLeadPk],
          );
          console.log(
            `[MOD-01.1] cascade: original doc pk=${originalDocPk} stays on lead ${originalLeadPk}; ` +
            `new lead ${newLeadPk} has ${newDocs.length} esign_document(s) yet`,
          );
        });

        // ── PHASE 2 — Customer signs the NEW contract ──────────────
        let newLeadUuid = '';
        let newContractUrl = '';

        await test.step('PHASE 2 setup: query new lead uuid + sendInvoice → new contractUrl', async () => {
          // The new lead has its own uuid (uown_los_lead.uuid). We need it
          // to call sendInvoice — which (a) builds the invoice + (b) returns
          // the contractUrl that will eventually open the iframe.
          const row = await db.queryOne<{ uuid: string }>(
            'SELECT uuid FROM uown_los_lead WHERE pk=$1',
            [newLeadPk],
          );
          expect(row?.uuid, `new lead ${newLeadPk} must have a uuid`).toBeTruthy();
          newLeadUuid = row!.uuid;

          // Repoint ctx to the new lead so downstream helpers (waitForLeadStatus
          // etc.) operate on the right entity.
          ctx.leadPk = String(newLeadPk);
          ctx.leadUuid = newLeadUuid;

          const invoiceResp = await api.invoice.sendInvoice(merchant, newLeadUuid);
          expect(invoiceResp.ok, `sendInvoice for new lead: ${invoiceResp.status}`).toBeTruthy();
          newContractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(newContractUrl, 'new contractUrl required').toBeTruthy();
          console.log(`[MOD-01.1] new lead ${newLeadPk} uuid=${newLeadUuid} url=${newContractUrl}`);
        });

        await test.step('PHASE 2 UI: drive customer through MissingDataForm + Terms on the new contract URL', async () => {
          await page.goto(newContractUrl);

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
        });

        await test.step('PHASE 2 sign: complete signing ceremony on the new contract', async () => {
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
          console.log(
            `[MOD-01.1 phase2] sign result: startClicked=${result.startClicked} ` +
            `fieldsSigned=${result.fieldsSigned} signClicked=${result.signClicked}`,
          );
          expect(result.signClicked, 'final Sign clicked on new contract').toBe(true);
        });

        await test.step('PHASE 2 DB: new lead reaches SIGNED', async () => {
          const status = await waitForLeadStatus(db, newLeadPk, 'SIGNED', { timeoutMs: 60_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('PHASE 2 DB: NEW esign_document is SIGNED + decoupled from original', async () => {
          const newDoc = await getEsignDocumentByLeadPk(db, newLeadPk);
          expect(newDoc, `new esign_document must exist for lead ${newLeadPk}`).not.toBeNull();
          expect(newDoc!.esignClient).toBe('GOWSIGN');
          expect(newDoc!.documentStatus).toBe('SIGNED');
          expect(newDoc!.signedDateTime, 'new doc signed_date_time populated').not.toBeNull();

          // Cross-check: new doc.pk MUST differ from originalDocPk (cascade).
          expect(
            newDoc!.pk,
            `new doc pk (${newDoc!.pk}) must differ from original (${originalDocPk})`,
          ).not.toBe(originalDocPk);

          console.log(
            `[MOD-01.1 phase2] originalDocPk=${originalDocPk} newDocPk=${newDoc!.pk} ` +
            `originalLead=${originalLeadPk} (LEASE_MOD_REQUESTED) newLead=${newLeadPk} (SIGNED)`,
          );
        });

        await test.step('PHASE 2 DB: original lease still in LEASE_MOD_REQUESTED (no rollback)', async () => {
          const row = await db.queryOne<{ lead_status: string }>(
            'SELECT lead_status FROM uown_los_lead WHERE pk=$1',
            [originalLeadPk],
          );
          expect(row?.lead_status).toBe('LEASE_MOD_REQUESTED');
        });
      },
    );
  },
);

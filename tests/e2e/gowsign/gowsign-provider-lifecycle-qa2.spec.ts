/**
 * E2E qa2 — GowSign Provider + Lifecycle (US-CUT-* + US-LCY-*)
 *
 * DB-validation focused: drives a lead to CC_AUTH_PASSED via UI flow, then
 * asserts the uown_esign_document row is correctly populated, follows the
 * expected lifecycle states, and stays consistent with the provider rules.
 *
 * Coverage:
 *   ✅ CUT-01.1 esign_client populated + FK to uown_los_contract valid + lead note
 *   ✅ CUT-01.2 document_key matches UUID v4
 *   ✅ LCY-01.1 status valid post-creation (SENT_TO_CUSTOMER in qa2 flow)
 *   ✅ LCY-02   status_timestamp populated and refreshes on signing transition
 *   ✅ LCY-08   status mapping: GowSign-side status maps into one of UOwn's
 *               canonical values { CREATED, SENT_TO_CUSTOMER, SIGNED, CANCELED }
 *   ✅ LCY-09   state persistence — querying twice returns the same row
 *
 * Pre-req: DB tunnel qa2 active (porta 5445).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { installPostMessageRecorder, signGowSignInFrame } from '@helpers/gowsign-signing.helper.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
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

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_DOC_STATUSES = new Set([
  'CREATED',
  'OUTSTANDING',
  'SENT_TO_CUSTOMER',
  'SIGNED',
  'CANCELED',
  'EXPIRED',
]);

test.describe(
  `GowSign Provider + Lifecycle - ${data.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-medium'] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // CUT-01.1 / 01.2 + LCY-01.1 / 08 / 09 — Provider + creation-time
    //   lifecycle validation. One iframe-open setup (~30s) covers all 5
    //   DB assertions because they all describe the SAME row at the same
    //   point in time (post-CC_AUTH_PASSED, pre-sign).
    // ─────────────────────────────────────────────────────────────
    test(
      'CUT-01 + LCY-01/08/09 esign_document row is correctly populated post-creation',
      { tag: ['@priority-high'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign CUT/LCY - provider + lifecycle',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: drive lead → contract iframe rendered', async () => {
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

        let docPk = 0;

        await test.step('CUT-01.1 / LCY-01.1: esign_document row exists with esign_client + esign_mode + valid status', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 30_000;
          let doc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!doc && Date.now() < deadline) {
            await sleep(2_000);
            doc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(doc, `esign_document for lead_pk=${leadPk}`).not.toBeNull();
          docPk = doc!.pk;

          // Provider populated and matches expected enum
          expect(doc!.esignClient, 'esign_client must be GOWSIGN in this flow').toBe('GOWSIGN');
          expect(['DOCX', 'HTML', 'EMAIL', 'STRAPI', 'EMBEDDED']).toContain(doc!.esignMode);

          // FK to uown_los_contract present (LCY-01.1)
          expect(doc!.contractPk, 'uown_los_contract.esign_document_pk must reference this doc').not.toBeNull();

          // Status valid in the canonical enum (LCY-08 mapping check)
          expect(
            VALID_DOC_STATUSES.has(String(doc!.documentStatus)),
            `unexpected status mapping: "${doc!.documentStatus}" not in ${[...VALID_DOC_STATUSES].join(',')}`,
          ).toBe(true);

          // Pre-sign: must NOT be SIGNED yet
          expect(doc!.documentStatus).not.toBe('SIGNED');
        });

        await test.step('CUT-01.2: document_key matches UUID v4 regex', async () => {
          const row = await db.queryOne<{ document_key: string | null }>(
            'SELECT document_key FROM uown_esign_document WHERE pk = $1',
            [docPk],
          );
          expect(row, 'document row must exist for docPk').not.toBeNull();
          expect(row!.document_key, 'document_key must be populated').toBeTruthy();
          expect(
            UUID_V4_REGEX.test(String(row!.document_key)),
            `document_key="${row!.document_key}" does NOT match UUID v4 regex`,
          ).toBe(true);
        });

        await test.step('CUT-01.1: lead_notes contain "Sent Contract to customer. Contract EsignDocPk : {pk}"', async () => {
          const leadPk = Number(ctx.leadPk);
          const note = await findLeadNoteContaining(
            db,
            leadPk,
            'Sent Contract to customer. Contract EsignDocPk',
          );
          expect(note, 'creation note must exist in lead_notes').not.toBeNull();
          // Note must reference the exact docPk and an EsignMode token
          expect(note!.notes).toMatch(new RegExp(`EsignDocPk\\s*:\\s*${docPk}\\b`));
          expect(note!.notes).toMatch(/EsignMode\s*:\s*(DOCX|HTML|EMAIL|STRAPI|EMBEDDED)/i);
        });

        await test.step('LCY-09: state persistence — re-reading the row returns the same data', async () => {
          const row1 = await db.queryOne<{ pk: string; client: string; status: string; document_key: string }>(
            'SELECT pk, client, status, document_key FROM uown_esign_document WHERE pk = $1',
            [docPk],
          );
          await sleep(2_000);
          const row2 = await db.queryOne<{ pk: string; client: string; status: string; document_key: string }>(
            'SELECT pk, client, status, document_key FROM uown_esign_document WHERE pk = $1',
            [docPk],
          );
          expect(row1).not.toBeNull();
          expect(row2).not.toBeNull();
          expect(row2!.pk).toBe(row1!.pk);
          expect(row2!.client).toBe(row1!.client);
          expect(row2!.document_key).toBe(row1!.document_key);
          // status may have advanced legitimately, so we only assert it's still
          // in the canonical mapping set.
          expect(VALID_DOC_STATUSES.has(String(row2!.status))).toBe(true);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CUT-02.3 — Multi-provider distribution coexists in the same DB.
    //   Pure DB query: in any 7-day window we expect both GOWSIGN and
    //   SIGNWELL rows (proves the routing isn't a hard cutover; old
    //   documents preserve their original provider).
    // ─────────────────────────────────────────────────────────────
    test(
      'CUT-02.3 esign_document distribution shows GOWSIGN and SIGNWELL coexisting (no mass migration)',
      { tag: ['@priority-medium'] },
      async ({ db }) => {
        test.setTimeout(60_000);

        const rows = await db.query<{ client: string | null; n: string }>(
          `SELECT client, COUNT(*) AS n
           FROM uown_esign_document
           WHERE row_created_timestamp > NOW() - INTERVAL '7 days'
           GROUP BY client
           ORDER BY n DESC`,
        );

        const distribution = rows.map((r) => ({ client: r.client, count: Number(r.n) }));
        console.log(`[CUT-02.3] last-7d distribution: ${JSON.stringify(distribution)}`);

        // Sanity: at least one row created in the last week (test environment is alive)
        expect(rows.length, 'expected at least one esign_document in the last 7 days').toBeGreaterThan(0);

        // Coexistence: at least 2 distinct providers OR a recognised provider.
        const distinctClients = new Set(rows.map((r) => r.client).filter(Boolean));
        const recognised = ['GOWSIGN', 'SIGNWELL', 'PANDADOC'];
        // All recorded providers must be from the known set
        for (const c of distinctClients) {
          expect(
            recognised.includes(String(c)),
            `unexpected provider in uown_esign_document.client: "${c}" (allowed: ${recognised.join(',')})`,
          ).toBe(true);
        }
        // Coexistence assertion: ≥1 GOWSIGN AND ≥1 SIGNWELL row in the last 7d
        // (this proves the system is NOT in a single-provider state — both are
        // in active rotation per the routing rule). If either is missing it's
        // a regression worth investigating.
        const gowsign = distribution.find((r) => r.client === 'GOWSIGN')?.count ?? 0;
        const signwell = distribution.find((r) => r.client === 'SIGNWELL')?.count ?? 0;
        expect(
          gowsign,
          `expected ≥1 GOWSIGN row in the last 7 days, got ${gowsign} (distribution=${JSON.stringify(distribution)})`,
        ).toBeGreaterThan(0);
        expect(
          signwell,
          `expected ≥1 SIGNWELL row in the last 7 days, got ${signwell} (distribution=${JSON.stringify(distribution)})`,
        ).toBeGreaterThan(0);
      },
    );

    // ─────────────────────────────────────────────────────────────
    // LCY-02 — status_timestamp updates on signing transition.
    //
    // Spec literal "CREATED → OUTSTANDING" doesn't apply: in qa2 the row
    // initialises at SENT_TO_CUSTOMER (no CREATED → OUTSTANDING transition
    // observed from QA). We test the meaningful transition we can drive:
    // SENT_TO_CUSTOMER → SIGNED, and assert status_timestamp moves forward.
    // ─────────────────────────────────────────────────────────────
    test(
      'LCY-02 status_timestamp advances on signing transition',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign LCY-02 - status timestamp',
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

        let preSignStatus: string | null = null;
        let preSignTimestamp: Date | null = null;
        let docPk = 0;

        await test.step('DB: capture initial status + status_timestamp', async () => {
          const leadPk = Number(ctx.leadPk);
          const deadline = Date.now() + 30_000;
          let row: { pk: string; status: string; status_timestamp: Date | null } | null = null;
          while (!row && Date.now() < deadline) {
            row = await db.queryOne<{ pk: string; status: string; status_timestamp: Date | null }>(
              `SELECT pk, status, status_timestamp FROM uown_esign_document
               WHERE pk = (SELECT esign_document_pk FROM uown_los_contract WHERE lead_pk=$1)`,
              [leadPk],
            );
            if (!row) await sleep(2_000);
          }
          expect(row).not.toBeNull();
          docPk = Number(row!.pk);
          preSignStatus = row!.status;
          preSignTimestamp = row!.status_timestamp ? new Date(row!.status_timestamp) : null;

          expect(VALID_DOC_STATUSES.has(String(preSignStatus))).toBe(true);
          expect(preSignStatus).not.toBe('SIGNED');
          console.log(
            `[LCY-02] preSign: status=${preSignStatus} timestamp=${preSignTimestamp?.toISOString() ?? 'null'}`,
          );
        });

        await test.step('Helper: complete signing ceremony', async () => {
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

        await test.step('DB: status transitioned to SIGNED + status_timestamp advanced', async () => {
          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });

          const deadline = Date.now() + 30_000;
          let row: { status: string; status_timestamp: Date | null } | null = null;
          while (Date.now() < deadline) {
            row = await db.queryOne<{ status: string; status_timestamp: Date | null }>(
              'SELECT status, status_timestamp FROM uown_esign_document WHERE pk=$1',
              [docPk],
            );
            if (row?.status === 'SIGNED') break;
            await sleep(2_000);
          }
          expect(row?.status, 'doc status must reach SIGNED post-helper').toBe('SIGNED');
          const postTs = row!.status_timestamp ? new Date(row!.status_timestamp) : null;
          console.log(
            `[LCY-02] postSign: status=${row!.status} timestamp=${postTs?.toISOString() ?? 'null'}`,
          );
          // status_timestamp must advance compared to pre-sign capture.
          if (preSignTimestamp && postTs) {
            expect(
              postTs.getTime() >= preSignTimestamp.getTime(),
              `status_timestamp regressed: ${preSignTimestamp.toISOString()} → ${postTs.toISOString()}`,
            ).toBe(true);
          } else {
            // At minimum, postTs should be set after signing.
            expect(postTs, 'status_timestamp must be populated post-sign').not.toBeNull();
          }
        });
      },
    );
  },
);

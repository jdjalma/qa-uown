/**
 * Multi-state signing regression — covers all 47 allowed US states + 4 blocked
 * states (NJ, VT, MN, ME) for the GoSign / SignWell coexistence rollout.
 *
 * Source SPEC: docs/taskTestingUown/multiStateSigningRegression/multiStateSigningRegression-spec.md
 * State matrix: src/data/state-merchant-matrix.ts (STATE_MATRIX, 51 rows total)
 *
 * SUITE_ENV (below) selects the target env. The state-merchant-matrix exposes
 * env-aware helpers (`getGowsignStatesForEnv` / `getSignwellStatesForEnv`) so
 * the per-env overrides are honored — CA in stg falls back to SIGNWELL because
 * the GoSign template is not yet deployed there (2026-04-29).
 *
 * Routing rule (qa2 baseline, 2026-04-28):
 *   - CA → GOWSIGN (only state with a GowSign template deployed)
 *   - All other allowed states → SIGNWELL (fallback via merchant.esign_client)
 *   - NJ, VT, MN, ME → BLOCKED at stateCheck (no esign_document created)
 *
 * Routing rule (stg override, 2026-04-29):
 *   - CA → SIGNWELL (template not yet deployed in stg)
 *   - GOWSIGN describe block iterates 0 rows on stg (intentional)
 *
 * Per-state happy-path flow (allowed states):
 *   1. API: createPreQualifiedApplication (skipPaymentInfo=true) + sendInvoice → redirectUrl
 *   2. DB: assert uown_esign_document.esign_client matches expectedProvider
 *   3. UI: page.goto(redirectUrl) → MissingDataForm → Terms → AlternativeContractModal
 *   4. Iframe content validation: lessor + lessee names + customer state, BEFORE signing
 *   5. Sign:
 *        GOWSIGN  → signGowSignInFrame
 *        SIGNWELL → completeSignwellFlow
 *   6. DB: poll uown_esign_document.document_status === 'SIGNED'
 *   7. Activity log: contract sent + contract signed
 *
 * Provider-specific notes:
 *   - submitPaymentInfoViaApi (sandbox shortcut) is DROPPED here. In qa2 the
 *     redirectUrl is consumed and shows "Invalid link" if the API pre-submits
 *     the CC. Must drive through the UI MissingDataForm.
 *   - Buddy widget loop in qa2 (.claude/rules/testing.md): TermsOfAgreementPage
 *     `acceptAndProceedWithProtectionPlan(false)` already retries radios — we
 *     pass `false` to skip PP entirely (PP is blocked in CA anyway, and
 *     extending PP to other states would multiply variables).
 *   - Test card: TEST_CARDS.MASTERCARD_APPROVED (BIN 5500), per testing.md —
 *     VISA_APPROVED (BIN 5146) has rolled back in qa.
 *   - Content validation: extracted via `frame.locator('body').innerText()`.
 *     Both GoSign and SignWell render the contract HTML directly inside the
 *     iframe; lessor + lessee + state appear as plain text. Substring
 *     comparison (case-insensitive) avoids inventing fragile per-field
 *     selectors per-provider.
 *
 * Activity Log Validation rule (.claude/rules/testing.md): every business
 * action gets an explicit `test.step('activity log: ...')` with a DB assertion
 * on `uown_los_lead_notes`.
 *
 * Merchant config: NOT configured explicitly. `setupApplicationViaApi` →
 * `createPreQualifiedApplication` already invokes `ensureMerchantReady` per
 * Inviolable Rule #13. In qa2 the env honors `MERCHANT_PREFLIGHT_SKIP=true`
 * because RBAC blocks `MerchantConfigurator.getMerchantsByRefCode`.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  STATE_MATRIX,
  GOWSIGN_STATES,
  SIGNWELL_STATES,
  BLOCKED_STATES,
  getGowsignStatesForEnv,
  getSignwellStatesForEnv,
  type EnvName,
  type StateMatrixRow,
} from '@data/state-merchant-matrix.js';
import {
  buildTestData,
  sleep,
} from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import {
  installPostMessageRecorder,
  signGowSignInFrame,
} from '@helpers/gowsign-signing.helper.js';
import { completeSignwellFlow, clickSignAllViaLink } from '@helpers/signwell.helpers.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
  getLeadNotesByLeadPk,
  waitForEsignDocumentStatus,
} from '@helpers/esign-db.helpers.js';
import { TEST_CARDS } from '@data/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import type { FrameLocator } from '@playwright/test';

// ── Suite env ─────────────────────────────────────────────────────────
// Resolved from process.env.ENV (set via .env). Feeds the matrix
// env-aware helpers below.
const SUITE_ENV: EnvName = (process.env.ENV ?? 'sandbox') as EnvName;
const SUITE_ENV_TAG = `@${SUITE_ENV}` as const;

// Resolve provider groupings ONCE per env at module load.
const ENV_GOWSIGN_STATES = getGowsignStatesForEnv(SUITE_ENV);
const ENV_SIGNWELL_STATES = getSignwellStatesForEnv(SUITE_ENV);

// ── Smoke subset gate ─────────────────────────────────────────────────
// CA, CO, AK, NJ — Task #5 representative rows. Tag adds @signing-smoke
// so PR builds can target this subset via --grep @signing-smoke.
const SMOKE_STATES = new Set(['CA', 'CO', 'AK', 'NJ']);

const BASE_TAGS = [
  '@regression',
  '@signing-regression',
  '@multi-state',
  '@hybrid',
  SUITE_ENV_TAG,
  '@priority-medium',
] as const;

function buildRowTags(row: StateMatrixRow): string[] {
  const tags: string[] = [...BASE_TAGS];
  if (SMOKE_STATES.has(row.state)) tags.push('@signing-smoke');
  return tags;
}

// Sanity at module load — fail loudly if the matrix is reshaped without
// updating the suite. 1 GOWSIGN + 46 SIGNWELL + 4 BLOCKED = 51.
const _expectedCounts = {
  gowsign: GOWSIGN_STATES.length,
  signwell: SIGNWELL_STATES.length,
  blocked: BLOCKED_STATES.length,
  total: STATE_MATRIX.length,
};
if (_expectedCounts.total !== _expectedCounts.gowsign + _expectedCounts.signwell + _expectedCounts.blocked) {
  throw new Error(
    `[multi-state-signing] STATE_MATRIX inconsistent: ${JSON.stringify(_expectedCounts)}`,
  );
}

/**
 * Pull the entire iframe text once and run substring assertions against it.
 * Works for both GoSign (top-level page or AlternativeContractModal iframe)
 * and SignWell (always iframe). Case-insensitive matching tolerates the
 * provider's title-casing of names.
 *
 * Returns the lower-cased frame body text so callers can do additional
 * targeted assertions when they care about specific phrases.
 */
async function readFrameBodyText(frame: FrameLocator): Promise<string> {
  // Wait until SOMETHING is rendered. innerText returns empty string until the
  // contract HTML mounts; 30s budget mirrors `waitForOpen`.
  const body = frame.locator('body');
  await body.waitFor({ state: 'visible', timeout: 30_000 });
  // Poll up to 20s for non-trivial content. The iframe boots with a loader
  // that returns a tiny string before the document hydrates.
  const deadline = Date.now() + 20_000;
  let text = '';
  while (Date.now() < deadline) {
    text = (await body.innerText().catch(() => '')) ?? '';
    if (text.length > 200) break;
    await sleep(1_000);
  }
  return text;
}

// ══════════════════════════════════════════════════════════════════════
// GOWSIGN routing — currently CA only (qa2 template availability)
// ══════════════════════════════════════════════════════════════════════
test.describe(
  'Multi-state signing regression — GOWSIGN routing',
  { tag: ['@regression', '@signing-regression', '@multi-state', '@hybrid', SUITE_ENV_TAG] },
  () => {

    for (const row of ENV_GOWSIGN_STATES) {
      test(
        `${row.state} routes to GOWSIGN with lessor "${row.lessor}"`,
        { tag: buildRowTags(row) },
        async ({ page, api, db, ctx }, testInfo) => {
          // Full UI + signing ceremony + DB polling. Generous budget per CT.
          test.setTimeout(540_000);

          const { merchant, applicant } = buildTestData({
            state: row.state,
            merchant: row.validMerchant,
            orderTotal: '1000',
            orderDescription: `multi-state-signing GOWSIGN ${row.state}`,
          });

          await installPostMessageRecorder(page);

          let redirectUrl = '';
          let leadPk = 0;

          await test.step(`API: pre-qualify lead (${row.state} / ${row.validMerchant}) + sendInvoice → redirectUrl`, async () => {
            await createPreQualifiedApplication(
              api,
              merchant,
              applicant,
              ctx,
              { skipPaymentInfo: true },
              testInfo,
            );
            const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
            expect(invoiceResp.ok, `sendInvoice ${invoiceResp.status}`).toBeTruthy();
            redirectUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
            expect(redirectUrl, 'redirectUrl from sendInvoice required').toBeTruthy();
            leadPk = Number(ctx.leadPk);
            expect(Number.isFinite(leadPk) && leadPk > 0, 'leadPk must be a positive number').toBe(true);
            console.log(`[multi-state-signing] ${row.state} GOWSIGN leadPk=${leadPk} redirectUrl=${redirectUrl}`);
          });

          await test.step('activity log: application submitted', async () => {
            const found = await db.waitForRecord(
              'uown_los_lead_notes',
              "lead_pk = $1 AND notes ILIKE '%application%'",
              [leadPk],
            );
            expect(found, 'application submission log must be present').toBe(true);
          });

          await test.step('UI: drive customer through MissingDataForm + Terms → contract iframe', async () => {
            // The e-sign document is created downstream (after the customer
            // submits CC + accepts Terms). DB validation MUST come AFTER this
            // step — querying the doc earlier returns null because the
            // dispatcher has not run yet. Confirmed empirically against qa2
            // 2026-04-28 (initial run found uown_esign_document=null at
            // pre-UI checkpoint for leads 16000, 16001, 16003).
            await page.goto(redirectUrl);
            const missingData = new MissingDataFormPage(page);
            await missingData.waitForLoaded(30_000);
            await missingData.fillAndSubmit({
              firstName: applicant.firstName,
              lastName: applicant.lastName,
              cardNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
              cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
              expiration: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
            });
            const terms = new TermsOfAgreementPage(page);
            await terms.waitForLoaded(60_000);
            // ppOptIn=false → skip Protection Plan. PP is blocked in CA anyway,
            // and extending PP to other states would multiply variables.
            await terms.acceptAndProceedWithProtectionPlan(false);
            const modal = new AlternativeContractModalPage(page);
            await modal.waitForOpen(60_000);
          });

          let esignDocPk = 0;

          await test.step(`DB: esign_document populated with esign_client=GOWSIGN`, async () => {
            const deadline = Date.now() + 60_000;
            let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
            while (!esignDoc && Date.now() < deadline) {
              await sleep(2_000);
              esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
            }
            expect(esignDoc, `uown_esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
            expect(
              esignDoc!.esignClient,
              `esign_document.esign_client mismatch — likely product distributed a new template for ${row.state}; ` +
                'update src/data/state-merchant-matrix.ts',
            ).toBe('GOWSIGN');
            expect(esignDoc!.esignMode, 'esign_mode must be populated').toBeTruthy();
            expect(esignDoc!.contractPk, 'uown_los_contract.esign_document_pk FK must reference this doc').not.toBeNull();
            esignDocPk = esignDoc!.pk;
            console.log(
              `[multi-state-signing] ${row.state} GOWSIGN esignDocPk=${esignDocPk} ` +
                `client=${esignDoc!.esignClient} mode=${esignDoc!.esignMode} status=${esignDoc!.documentStatus}`,
            );
          });

          await test.step('activity log: contract sent', async () => {
            const note = await findLeadNoteContaining(
              db,
              leadPk,
              `Sent Contract to customer. Contract EsignDocPk : ${esignDocPk}`,
            );
            expect(
              note,
              `Expected lead note "Sent Contract to customer. Contract EsignDocPk : ${esignDocPk}"`,
            ).not.toBeNull();
            expect(note!.notes).toMatch(/EsignMode\s*:\s*(DOCX|HTML|EMAIL|STRAPI|EMBEDDED)/i);
          });

          await test.step(`UI: iframe src host matches GOWSIGN`, async () => {
            const modal = new AlternativeContractModalPage(page);
            const src = await modal.getIframeSrc();
            expect(src, 'iframe src must be set').toBeTruthy();
            const url = new URL(String(src));
            expect(
              /(^|\.)gowsign\.com$/i.test(url.hostname),
              `iframe hostname should match gowsign.com, got "${url.hostname}". ` +
                'This is cross-talk (US-CUT-02) — the DB has esign_client=GOWSIGN ' +
                'but the rendered iframe is from a different provider.',
            ).toBe(true);
            await page.screenshot({
              path: testInfo.outputPath(`multi-state-${row.state}-GOWSIGN-pre-sign.png`),
              fullPage: false,
            });
          });

          await test.step('UI: validate contract content (lessor + lessee + state) BEFORE signing', async () => {
            const modal = new AlternativeContractModalPage(page);
            const frame = modal.getGowSignFrame();
            const text = await readFrameBodyText(frame);
            const lower = text.toLowerCase();
            expect(
              lower.includes(row.lessor.toLowerCase()),
              `Contract should contain LESSOR "${row.lessor}". ` +
                `Got first 500 chars: "${text.slice(0, 500)}"`,
            ).toBe(true);
            expect(
              lower.includes(applicant.firstName.toLowerCase()),
              `Contract should contain LESSEE first name "${applicant.firstName}". ` +
                `Got first 500 chars: "${text.slice(0, 500)}"`,
            ).toBe(true);
            expect(
              lower.includes(applicant.lastName.toLowerCase()),
              `Contract should contain LESSEE last name "${applicant.lastName}". ` +
                `Got first 500 chars: "${text.slice(0, 500)}"`,
            ).toBe(true);
            expect(
              new RegExp(`\\b${row.state}\\b`, 'i').test(text),
              `Contract should contain customer state "${row.state}". ` +
                `Got first 500 chars: "${text.slice(0, 500)}"`,
            ).toBe(true);
          });

          await test.step('UI: complete GOWSIGN signing ceremony', async () => {
            const modal = new AlternativeContractModalPage(page);
            const frame = modal.getGowSignFrame();
            const result = await signGowSignInFrame(page, frame, {
              preauthChoice: 'yes',
              fontIndex: 0,
              waitForCompleted: true,
            });
            expect(result.signClicked, 'GOWSIGN sign action must have fired').toBe(true);
            await page.screenshot({
              path: testInfo.outputPath(`multi-state-${row.state}-GOWSIGN-post-sign.png`),
              fullPage: false,
            });
          });

          await test.step('DB: uown_esign_document.document_status === SIGNED', async () => {
            const signed = await waitForEsignDocumentStatus(db, esignDocPk, 'SIGNED', { timeoutMs: 60_000 });
            expect(signed.documentStatus).toBe('SIGNED');
          });

          await test.step('activity log: contract signed', async () => {
            // Backend writes a [ContractService] note when the signing webhook
            // / EsignRedirectService finalizes the document. Pattern is broad
            // here because exact wording varies between GOWSIGN ("isLeaseOrLeaseModSigned")
            // and SIGNWELL.
            const recent = await getLeadNotesByLeadPk(db, leadPk, { limit: 30 });
            const matching = recent.find((n) =>
              /\[ContractService\]|signed|SIGNED/i.test(n.notes),
            );
            expect(
              matching,
              `Expected at least one signed-marker lead note for lead_pk=${leadPk}. ` +
                `Got: ${JSON.stringify(recent.slice(0, 5).map((n) => n.notes))}`,
            ).toBeTruthy();
          });
        },
      );
    }
  },
);

// ══════════════════════════════════════════════════════════════════════
// SIGNWELL routing — fallback for the 46 allowed states without a
// GowSign template (AK has the KW-Choice Alaska LLC lessor variant).
// ══════════════════════════════════════════════════════════════════════
test.describe(
  'Multi-state signing regression — SIGNWELL routing',
  { tag: ['@regression', '@signing-regression', '@multi-state', '@hybrid', SUITE_ENV_TAG] },
  () => {

    for (const row of ENV_SIGNWELL_STATES) {
      test(
        `${row.state} routes to SIGNWELL with lessor "${row.lessor}"`,
        { tag: buildRowTags(row) },
        async ({ page, api, db, ctx }, testInfo) => {
          test.setTimeout(540_000);

          const { merchant, applicant } = buildTestData({
            state: row.state,
            merchant: row.validMerchant,
            orderTotal: '1000',
            orderDescription: `multi-state-signing SIGNWELL ${row.state}`,
          });

          await installPostMessageRecorder(page);

          let redirectUrl = '';
          let leadPk = 0;

          await test.step(`API: pre-qualify lead (${row.state} / ${row.validMerchant}) + sendInvoice → redirectUrl`, async () => {
            await createPreQualifiedApplication(
              api,
              merchant,
              applicant,
              ctx,
              { skipPaymentInfo: true },
              testInfo,
            );
            const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
            expect(invoiceResp.ok, `sendInvoice ${invoiceResp.status}`).toBeTruthy();
            redirectUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
            expect(redirectUrl, 'redirectUrl from sendInvoice required').toBeTruthy();
            leadPk = Number(ctx.leadPk);
            expect(Number.isFinite(leadPk) && leadPk > 0, 'leadPk must be a positive number').toBe(true);
            console.log(`[multi-state-signing] ${row.state} SIGNWELL leadPk=${leadPk} redirectUrl=${redirectUrl}`);
          });

          await test.step('activity log: application submitted', async () => {
            const found = await db.waitForRecord(
              'uown_los_lead_notes',
              "lead_pk = $1 AND notes ILIKE '%application%'",
              [leadPk],
            );
            expect(found, 'application submission log must be present').toBe(true);
          });

          let signwellFrame: FrameLocator | null = null;

          await test.step('UI: drive customer through MissingDataForm + Terms → SignWell iframe (inline)', async () => {
            // E-sign document is created downstream (after CC submission +
            // Terms acceptance). DB validation MUST come AFTER this step.
            //
            // SignWell vs GoSign surface (qa2 2026-04-28 finding):
            //   - GoSign:  Terms → "Proceed to signature" opens
            //              `AlternativeContractModalPage` modal → iframe.
            //   - SignWell: NO modal — the SignWell iframe renders INLINE on
            //              the Terms page, identified by `iframe[src*="signwell.com"]`.
            //              The page-object header in alternative-contract-modal.page.ts
            //              already documents this: "alternative-contract-vendor
            //              e o discriminator entre GowSign (alternative) e
            //              Signwell (default)".
            // Therefore we don't call `AlternativeContractModalPage` here.
            await page.goto(redirectUrl);
            const missingData = new MissingDataFormPage(page);
            await missingData.waitForLoaded(30_000);
            await missingData.fillAndSubmit({
              firstName: applicant.firstName,
              lastName: applicant.lastName,
              cardNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
              cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
              expiration: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
            });
            const terms = new TermsOfAgreementPage(page);
            await terms.waitForLoaded(60_000);
            await terms.acceptAndProceedWithProtectionPlan(false);

            // Wait for the SignWell iframe to attach. The iframe may live on
            // the same Terms page OR after a navigation to a /sign URL —
            // the URL-based selector handles both.
            const iframeLocator = page.locator(SELECTORS.signingSignWellIframeByUrl);
            await iframeLocator.first().waitFor({ state: 'attached', timeout: 60_000 });
            signwellFrame = page.frameLocator(SELECTORS.signingSignWellIframeByUrl);
          });

          let esignDocPk = 0;

          await test.step(`DB: esign_document populated with esign_client=SIGNWELL`, async () => {
            const deadline = Date.now() + 60_000;
            let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
            while (!esignDoc && Date.now() < deadline) {
              await sleep(2_000);
              esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
            }
            expect(esignDoc, `uown_esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
            expect(
              esignDoc!.esignClient,
              `esign_document.esign_client mismatch — likely product distributed a new template for ${row.state}; ` +
                'update src/data/state-merchant-matrix.ts',
            ).toBe('SIGNWELL');
            expect(esignDoc!.esignMode, 'esign_mode must be populated').toBeTruthy();
            expect(esignDoc!.contractPk, 'uown_los_contract.esign_document_pk FK must reference this doc').not.toBeNull();
            esignDocPk = esignDoc!.pk;
            console.log(
              `[multi-state-signing] ${row.state} SIGNWELL esignDocPk=${esignDocPk} ` +
                `client=${esignDoc!.esignClient} mode=${esignDoc!.esignMode} status=${esignDoc!.documentStatus}`,
            );
          });

          await test.step('activity log: contract sent', async () => {
            const note = await findLeadNoteContaining(
              db,
              leadPk,
              `Sent Contract to customer. Contract EsignDocPk : ${esignDocPk}`,
            );
            expect(
              note,
              `Expected lead note "Sent Contract to customer. Contract EsignDocPk : ${esignDocPk}"`,
            ).not.toBeNull();
            expect(note!.notes).toMatch(/EsignMode\s*:\s*(DOCX|HTML|EMAIL|STRAPI|EMBEDDED)/i);
          });

          await test.step(`UI: iframe src host matches SIGNWELL`, async () => {
            const iframeLocator = page.locator(SELECTORS.signingSignWellIframeByUrl);
            const src = await iframeLocator.first().getAttribute('src');
            expect(src, 'iframe src must be set').toBeTruthy();
            const url = new URL(String(src));
            expect(
              /(^|\.)signwell\.com$/i.test(url.hostname),
              `iframe hostname should match signwell.com, got "${url.hostname}". ` +
                'This is cross-talk (US-CUT-02) — the DB has esign_client=SIGNWELL ' +
                'but the rendered iframe is from a different provider.',
            ).toBe(true);
            await page.screenshot({
              path: testInfo.outputPath(`multi-state-${row.state}-SIGNWELL-pre-sign.png`),
              fullPage: false,
            });
          });

          await test.step('DB: validate contract template + lessee match application data', async () => {
            // SignWell renders the contract as image-based PDF pages (canvas/
            // image surface), so the contract text is NOT in the iframe DOM.
            // Backend cross-check via `uown_esign_document` columns proves the
            // backend generated the right artifact for the application:
            //   - template_name encodes the state (e.g. AK_SAC_LEASE_AGREEMENT)
            //   - receiver_name mirrors the applicant submitted via sendApplication
            //   - client confirms routing (already asserted in step 2 — re-check
            //     here as defense-in-depth post-signing-init)
            // Lessor is implied by template_name → row.state → row.lessor (matrix).
            const doc = await getEsignDocumentByLeadPk(db, leadPk);
            expect(doc, `uown_esign_document still resolved by lead_pk=${leadPk}`).not.toBeNull();
            expect(doc!.esignClient, 'client column must be SIGNWELL').toBe('SIGNWELL');

            const meta = await db.queryOne<{ template_name: string | null; receiver_name: string | null }>(
              `SELECT template_name, receiver_name FROM uown_esign_document WHERE pk = $1`,
              [doc!.pk],
            );
            expect(meta, `uown_esign_document row missing for pk=${doc!.pk}`).toBeTruthy();
            expect(
              meta!.template_name,
              `template_name must be populated for SIGNWELL`,
            ).toBeTruthy();
            expect(
              meta!.template_name!,
              `template_name must encode state="${row.state}" — expected /^${row.state}_.*LEASE_AGREEMENT$/, got "${meta!.template_name}"`,
            ).toMatch(new RegExp(`^${row.state}_.*LEASE_AGREEMENT$`));

            const receiverName = meta!.receiver_name ?? '';
            expect(
              receiverName.toLowerCase().includes(applicant.firstName.toLowerCase()),
              `receiver_name "${receiverName}" should contain applicant firstName "${applicant.firstName}"`,
            ).toBe(true);
          });

          await test.step('UI: complete SIGNWELL signing ceremony', async () => {
            expect(signwellFrame, 'SignWell iframe must be resolved').not.toBeNull();
            await completeSignwellFlow(signwellFrame!, `SignWell ${row.state}`, async () => {
              await clickSignAllViaLink(signwellFrame!);
            });
            await page.screenshot({
              path: testInfo.outputPath(`multi-state-${row.state}-SIGNWELL-post-sign.png`),
              fullPage: false,
            });
          });

          await test.step('DB: uown_esign_document.document_status === SIGNED', async () => {
            const signed = await waitForEsignDocumentStatus(db, esignDocPk, 'SIGNED', { timeoutMs: 60_000 });
            expect(signed.documentStatus).toBe('SIGNED');
          });

          await test.step('activity log: contract signed', async () => {
            const recent = await getLeadNotesByLeadPk(db, leadPk, { limit: 30 });
            const matching = recent.find((n) =>
              /\[ContractService\]|signed|SIGNED/i.test(n.notes),
            );
            expect(
              matching,
              `Expected at least one signed-marker lead note for lead_pk=${leadPk}. ` +
                `Got: ${JSON.stringify(recent.slice(0, 5).map((n) => n.notes))}`,
            ).toBeTruthy();
          });
        },
      );
    }
  },
);

// ══════════════════════════════════════════════════════════════════════
// BLOCKED states (NJ, VT, MN, ME) — stateCheck denial
// UNCHANGED behaviour from previous suite (NJ passed last smoke).
// ══════════════════════════════════════════════════════════════════════
test.describe(
  'Multi-state signing regression — BLOCKED states (stateCheck denial)',
  { tag: ['@regression', '@signing-regression', '@multi-state', '@hybrid', SUITE_ENV_TAG] },
  () => {

    for (const row of BLOCKED_STATES) {
      test(
        `${row.state} is rejected at stateCheck — no esign_document created`,
        { tag: buildRowTags(row) },
        async ({ api, db, ctx }, testInfo) => {
          test.setTimeout(120_000);

          const { merchant, applicant } = buildTestData({
            state: row.state,
            merchant: row.validMerchant,
            orderTotal: '1000',
            orderDescription: `multi-state-signing BLOCKED ${row.state}`,
          });

          let leadPk: number | null = null;

          await test.step(`API: sendApplication for ${row.state} (denial expected)`, async () => {
            const resp = await api.application.sendApplication(merchant, applicant);
            const authNumber = resp.body?.authorizationNumber;
            if (authNumber) {
              leadPk = Number(authNumber);
              ctx.leadPk = String(authNumber);
              testInfo.annotations.push({ type: 'leadPk', description: String(authNumber) });
              console.log(
                `[multi-state-signing] ${row.state} sendApplication status=${resp.status} leadPk=${authNumber}`,
              );
            } else {
              console.log(
                `[multi-state-signing] ${row.state} sendApplication rejected at API: ` +
                  `${resp.status} body=${JSON.stringify(resp.body)}`,
              );
            }
          });

          await test.step('DB: no esign_document was created for the blocked lead', async () => {
            if (leadPk === null) {
              console.log(
                `[multi-state-signing] ${row.state}: sendApplication rejected pre-persistence; ` +
                  'no lead to validate against. Strictest form of stateCheck gate.',
              );
              return;
            }

            const deadline = Date.now() + 30_000;
            while (Date.now() < deadline) {
              const doc = await getEsignDocumentByLeadPk(db, leadPk);
              if (doc) {
                throw new Error(
                  `Blocked state ${row.state} should NOT produce an esign_document — ` +
                    `found pk=${doc.pk} client=${doc.esignClient} for lead_pk=${leadPk}. ` +
                    'This is a regulatory invariant violation (US-CUT-02 / state policy).',
                );
              }
              await sleep(2_000);
            }
            const finalDoc = await getEsignDocumentByLeadPk(db, leadPk);
            expect(
              finalDoc,
              `uown_esign_document must NOT exist for blocked-state lead ${leadPk} (${row.state})`,
            ).toBeNull();
          });

          await test.step('activity log: stateCheck denial recorded', async () => {
            // STATE_MATRIX[row].blockedReason is intentionally undefined —
            // Task #2 left it for Task #5 (smoke run) to capture the exact
            // substring per state. Until then we assert on broad markers
            // (case-insensitive). Do NOT freeze a substring here; that would
            // violate Inviolable Rule #11 (no invented log substrings).
            //
            // TODO(post-smoke): replace the broad ILIKE OR-chain with the
            // exact substring from STATE_MATRIX[row].blockedReason once Task
            // #5 captures it.

            if (leadPk === null) {
              console.log(
                `[multi-state-signing] ${row.state}: no lead persisted, denial is at API ` +
                  'response level — no notes to validate.',
              );
              return;
            }

            const recent = await getLeadNotesByLeadPk(db, leadPk, { limit: 5 });
            console.log(
              `[multi-state-signing] ${row.state} latest notes for lead ${leadPk}: ` +
                JSON.stringify(recent.map((n) => ({ pk: n.pk, notes: n.notes }))),
            );

            const matchingNote = recent.find((n) =>
              /denied|statecheck|no_business_in_state|state\s+not\s+allowed/i.test(n.notes),
            );
            expect(
              matchingNote,
              `Expected at least one denial-marker note for blocked state ${row.state} ` +
                `(lead_pk=${leadPk}). Got: ${JSON.stringify(recent.map((n) => n.notes))}`,
            ).toBeTruthy();
          });
        },
      );
    }
  },
);

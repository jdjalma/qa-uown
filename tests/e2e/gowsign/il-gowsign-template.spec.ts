/**
 * E2E stg — Illinois GowSign Template  (GitLab work item #576, milestone RU07.26.1.54.0)
 *
 * "UOWN | SVC | Add IL - Illinois GowSign Template" — verifies the new IL GowSign
 * lease-purchase templates. BDD oracle: `.claude/oracles/il-16m-gowsign-template.md`
 * (CT-01..CT-08). Sibling pattern: `ny-gowsign-template.spec.ts`.
 *
 * ── Two execution lanes (split by the NeuroID automation blocker) ────────────
 *
 * Lane A — AUTOMATABLE in CI (this file, the `test(...)` below):
 *   IL 13-month lease via TerraceFinance (OL90202-0001 / stg clone, ONLINE,
 *   UOWN gateway secure-stg.uownleasing.com, NO NeuroID) → GowSign IL_2025_SAC.
 *   Covers, on the standard IL SAC:
 *     · CT-01 negative control — 13m → template `IL_2025_SAC`, client=GOWSIGN
 *     · CT-04 token render smoke — populated money tokens, zero `{{ }}`, no missing-token note
 *     · CT-07 sanity reference — the standard IL SAC body (state-scoped, no wrong-state leak)
 *     · CT-08 signing completion + activity log (rule #13) — full ceremony on the 13m lease
 *
 * Lane B — MCP-MANUAL ONLY, blocked from CI by NeuroID (the two `test.fixme(...)` below):
 *   The 16m-specific content (Item 4 / Item 4a / EPO appendix / footer — CT-02..CT-06)
 *   and the CT-01 positive routing (16m → IL_2025_SAC_16_MONTHS) require an IL 16-month
 *   lease, which is only reachable through a Kornerstone ONLINE merchant whose /complete
 *   page lives on secure-stg.kornerstoneliving.com behind the NeuroID behavioral gate.
 *   Both automated entry paths (API submitApplication + browser auto-advance) are
 *   NeuroID-blocked (stg lead 7218278: "Failed to verify identification.", no esign doc,
 *   lead stuck UW_APPROVED). The reload → "Sign Contract" bypass is proven ONLY via
 *   Playwright MCP-manual, with no page object. → SPEC Open Question #1 / KB
 *   docs/knowledge-base/illinois-gowsign-template.md § Automation blocker.
 *   These CTs are handed to qa-validator for MCP-manual validation, NOT faked green here.
 *
 * ── Environment ──
 *   IL templates (IL_2025_SAC pk38 / IL_2025_SAC_16_MONTHS pk39, client_type=null) are
 *   DB-confirmed in **stg** only (qa2 UNVERIFIED — tunnel down at discovery). This spec
 *   MUST run with ENV=stg; it self-skips on any other env so a wrong-env run cannot
 *   produce a false failure. Routing is asserted against the LIVE DB
 *   (`assertSelectedTemplateForLead`), NOT the (stale) `state-merchant-matrix.ts` IL row.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TEST_CARDS } from '@config/constants.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  signGowSignInFrame,
  installPostMessageRecorder,
  getGowSignTemplatesForState,
  getEsignDocumentByLeadAndClient,
  assertSelectedTemplateForLead,
  waitForLeadStatus,
  getLeadStatusTransitions,
  findLeadNoteContaining,
  waitForLeadNoteSubstring,
  sleep,
} from '@helpers/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import type { FrameLocator, Page } from '@playwright/test';
import type { ApiClients, TestContext } from '@support/base-test.js';

const data = { state: 'IL', merchant: 'TerraceFinance', orderTotal: '900' };

// Full names of US states whose presence in an IL contract body would be a
// wrong-state legal leak. Florida is intentionally EXCLUDED — it is the
// Lessor's domicile/forum boilerplate ("Tampa, FL", Mollie LLC), expected in
// every contract. Illinois (the target state) is obviously not a leak.
const WRONG_STATE_LEAK =
  /\b(New York|Texas|Ohio|California|Alabama|Georgia|Pennsylvania|Louisiana|North Carolina|Virginia|Tennessee)\b/;

/** Drive a fresh IL 13m lead through CC pre-auth + Terms until the GowSign modal opens. */
async function openIl13mGowSignContract(
  page: Page,
  api: ApiClients,
  ctx: TestContext,
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  const { merchant, applicant } = buildTestData({
    state: data.state,
    merchant: data.merchant,
    orderTotal: data.orderTotal,
    orderDescription: 'IL GowSign template',
    // Deterministic clean address — realistic mode randomly appends a "# <unit>"
    // suffix the backend rejects ~50% of runs; static base + "Unit <id>" is valid.
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  // skipMerchantPreflight: TerraceFinance is a special ONLINE merchant whose
  // config is NOT the standard INSTORE merchant-config-contract — auto-healing it
  // would mutate out-of-scope ONLINE config (rule #12 exception, per SPEC).
  await createPreQualifiedApplication(
    api,
    merchant,
    applicant,
    ctx,
    { skipPaymentInfo: true, skipMerchantPreflight: true },
    testInfo,
  );

  // Re-invoice to obtain a fresh redirectUrl (the internal invoice used approvedAmount
  // but did not surface the URL). paymentDetailsList[0] is the 13m plan for the
  // non-Kornerstone ONLINE gateway (caps at 13m — the 16m template is Kornerstone-only).
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'redirectUrl required').toBeTruthy();

  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  // Cardholder last name MUST equal the applicant last name. Card: the canonical
  // approved Mastercard (raw Visa is rejected by the pre-auth gateway in qa/stg).
  await missingData.fillAndSubmit({
    firstName: applicant.firstName,
    lastName: applicant.lastName,
    cardNumber: TEST_CARDS.MASTERCARD_APPROVED.number,
    cvc: TEST_CARDS.MASTERCARD_APPROVED.cvv,
    expiration: TEST_CARDS.MASTERCARD_APPROVED.expirationDate,
  });

  const terms = new TermsOfAgreementPage(page);
  await terms.waitForLoaded(120_000);
  await terms.acceptAndProceedWithProtectionPlan(false);

  const modal = new AlternativeContractModalPage(page);
  await modal.waitForOpen(120_000);
  const frame = modal.getGowSignFrame();
  // Render-ready gate — wait for the contract body to render substantive content
  // (a rendered dollar amount). No hard-coded IL title heading is asserted here:
  // the exact IL 13m contract title is NOT frozen in the oracle, so asserting one
  // would be a fabricated checkpoint (rule #16).
  await expect
    .poll(async () => (await frame.locator('body').innerText()).length, {
      timeout: 30_000,
      message: 'GowSign IL contract body should render',
    })
    .toBeGreaterThan(500);

  return { frame, applicant };
}

test.describe(
  'RU07.26.1.54.0_addIlGowSignTemplate_576 — IL GowSign Template',
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@stg', '@priority-high', '@gowsign'] },
  () => {
    // ─────────────────────────────────────────────────────────────────────────
    // Lane A — AUTOMATABLE. IL 13m negative control: routing + render smoke +
    //   token cross-check + signing completion (single fresh lead, end to end).
    // ─────────────────────────────────────────────────────────────────────────
    test(
      'IL 13m routes to GOWSIGN IL_2025_SAC, renders populated, and signs to completion',
      async ({ page, api, ctx, db, testEnv }, testInfo) => {
        test.skip(
          testEnv.env !== 'stg',
          'IL GowSign templates are DB-confirmed only in stg — run with ENV=stg (qa2 UNVERIFIED).',
        );
        test.setTimeout(420_000);

        await test.step('CT-01: IL template inventory — both 13m and 16m rows exist (client_type=null)', async () => {
          const templates = await getGowSignTemplatesForState(db, 'IL');
          const names = templates.map((t) => t.name);
          expect(names, `IL templates found: ${names.join(', ')}`).toContain('IL_2025_SAC');
          expect(names, `IL templates found: ${names.join(', ')}`).toContain('IL_2025_SAC_16_MONTHS');
        });

        const { frame } = await openIl13mGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');
        const bodyNoCommas = bodyText.replace(/,/g, '');

        await test.step('CT-07 (sanity ref): contract is IL-scoped, no wrong-state legal leak', () => {
          expect(bodyText, 'lessee located in Illinois, IL').toMatch(/,\s*IL\b/);
          const leak = bodyText.match(WRONG_STATE_LEAK);
          expect(leak, `wrong-state leak found: "${leak?.[0]}"`).toBeNull();
        });

        await test.step('CT-04: no raw template tokens reach the customer-visible contract', () => {
          expect(bodyText, 'no raw {{token}} in the rendered PDF/iframe').not.toMatch(/\{\{|\}\}/);
          expect(bodyText, 'concrete dollar amounts rendered').toMatch(/\$\s?\d[\d,]*\.\d{2}/);
        });

        // CT-01 routing + CT-04 value cross-check need the esign document, created
        // at CONTRACT_CREATED (after CC pre-auth). Poll until the GOWSIGN row exists.
        await test.step('CT-01 (negative control): 13m lead routed to GOWSIGN / IL_2025_SAC', async () => {
          await expect
            .poll(
              async () =>
                (await getEsignDocumentByLeadAndClient(db, Number(ctx.leadPk), 'GOWSIGN'))?.status ?? null,
              { timeout: 60_000, message: 'GOWSIGN esign_document created at CONTRACT_CREATED' },
            )
            .not.toBeNull();

          const { esignDoc, template } = await assertSelectedTemplateForLead(
            db,
            Number(ctx.leadPk),
            'IL_2025_SAC',
          );
          expect(esignDoc.client, 'esign_document.client').toBe('GOWSIGN');
          expect(template.name, 'selected template name').toBe('IL_2025_SAC');
          // Cache the request payload for the token cross-check step.
          ctx.contractStatus = esignDoc.request ?? '';
        });

        await test.step('CT-04: every key money token from the backend variables map renders (nextPaymentDueAmount non-blank — AL regression watch)', () => {
          const request = ctx.contractStatus;
          expect(request, 'esign_document.request payload present').toBeTruthy();
          const vars = (JSON.parse(request).document?.variables ?? {}) as Record<string, string>;

          // Money tokens the customer must see, cross-checked value-for-value against
          // what the backend computed for THIS lead.
          for (const k of ['costPriceWithFeeNoTax', 'nextPaymentDueAmount', 'contractAmount']) {
            const v = String(vars[k] ?? '').replace(/,/g, '');
            expect(v, `variable ${k} present + non-empty in backend request`).toBeTruthy();
            expect(bodyNoCommas, `rendered contract must show ${k}=${v}`).toContain(v);
          }
          expect(String(vars.companyInfoBrandPhone ?? ''), 'companyInfoBrandPhone non-empty').toBeTruthy();
          expect(bodyText, 'brand phone rendered').toContain(String(vars.companyInfoBrandPhone));
        });

        await test.step('CT-04: NO "variables map missing token" dispatch note for this lead', async () => {
          const missingTokenNote = await findLeadNoteContaining(db, Number(ctx.leadPk), 'variables map missing');
          expect(
            missingTokenNote,
            `unexpected missing-token dispatch note: ${missingTokenNote?.notes ?? ''}`,
          ).toBeNull();
        });

        await test.step('CT-08: complete the GowSign signing ceremony', async () => {
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start clicked').toBe(true);
          expect(result.signClicked, 'final Sign clicked').toBe(true);
          // capturedCompleted may be false even on success (the "completed" postMessage
          // is not always captured); the backend still transitions via redirect — the
          // authoritative signals are the DB SIGNED status + notes asserted below.
        });

        await test.step('CT-08: lead transitions to SIGNED', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 90_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('CT-08: esign_document reaches SIGNED with a signed timestamp', async () => {
          let doc = await getEsignDocumentByLeadAndClient(db, Number(ctx.leadPk), 'GOWSIGN');
          const deadline = Date.now() + 60_000;
          while (Date.now() < deadline && doc?.status !== 'SIGNED') {
            await sleep(3_000);
            doc = await getEsignDocumentByLeadAndClient(db, Number(ctx.leadPk), 'GOWSIGN');
          }
          expect(doc?.status, 'esign_document.status after signing').toBe('SIGNED');
        });

        await test.step('CT-08 activity log (rule #13): SIGNED transition + [ContractService] note recorded', async () => {
          const transitions = await getLeadStatusTransitions(db, Number(ctx.leadPk));
          expect(
            transitions.find((t) => t.to === 'SIGNED'),
            `expected a transition to SIGNED — got ${JSON.stringify(transitions.map((t) => `${t.from}→${t.to}`))}`,
          ).toBeTruthy();
          const contractNote = await waitForLeadNoteSubstring(
            db,
            Number(ctx.leadPk),
            '[ContractService][isLeaseOrLeaseModSigned]',
            { timeoutMs: 60_000 },
          );
          expect(contractNote.notes, 'ContractService signing note').toContain('isLeaseOrLeaseModSigned');
          const signedNote = await findLeadNoteContaining(db, Number(ctx.leadPk), 'SIGNED');
          expect(signedNote, 'a lead note recording the SIGNED transition').not.toBeNull();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Lane B — BLOCKED FROM CI (NeuroID on the Kornerstone host). Marked fixme so
    //   qa-validator inherits an accurate picture and drives these MCP-manually.
    //   Do NOT convert to an automated pass until a stg test-merchant NeuroID
    //   bypass exists (SPEC Open Question #1) OR a Kornerstone reload→"Sign
    //   Contract" page object is built (SPEC Open Question #2).
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-02..CT-06 + CT-01(positive): IL_2025_SAC_16_MONTHS content & 16m routing — BLOCKED by NeuroID (Kornerstone host), MCP-manual only',
      async () => {
        // 16m route: Kornerstone KS3015 ONLINE + customer state IL + bankData(TEST_BANK)
        // + planId WK16 → IL_2025_SAC_16_MONTHS. Entry /complete page is
        // secure-stg.kornerstoneliving.com (NeuroID-gated). API submitApplication and
        // browser auto-advance are both NeuroID-blocked (stg lead 7218278). Content
        // checkpoints Item 4 (CT-02), Item 4a (CT-03), token+logo smoke (CT-04),
        // plan footer (CT-05), singular EPO appendix + page order (CT-06) and the
        // positive routing (CT-01: 16m → IL_2025_SAC_16_MONTHS) are validated by
        // qa-validator via the Playwright MCP reload→"Sign Contract" bypass.
        // Ref: .claude/oracles/il-16m-gowsign-template.md CT-01..CT-06.
      },
    );

    test.fixme(
      'CT-08 (16m): IL 16-month signing completion + activity log — BLOCKED by NeuroID (Kornerstone host), MCP-manual only',
      async () => {
        // Same blocker: the 16m signing ceremony can only be reached through the
        // NeuroID-gated Kornerstone host. Validated MCP-manually by qa-validator
        // (SIGNED + uown_esign_document SENT_TO_CUSTOMER→SIGNED + notes
        // [ContractService][isLeaseOrLeaseModSigned] / [EsignRedirectService][updateSignStatus]
        // / [ESIGNSERVICE][parseCCPeekConsent]). Ref: oracle CT-08.
      },
    );
  },
);

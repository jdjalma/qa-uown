/**
 * E2E qa2 — Massachusetts GowSign Template (work item #583)
 *
 * Covers the acceptance criteria of
 * "UOWN | SVC | Add MA - Massachusetts GowSign Template" (SignWell → GowSign migration, MA).
 * BDD oracle: `.claude/oracles/ma-16m-gowsign-template.md` (CT-01..CT-09).
 * SPEC: `docs/taskTestingUown/RU07.26.1.54.0_addMaGowSignTemplate_583/…-spec.md`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTOMATION FEASIBILITY (SPEC "Automation feasibility gate" S1, mirrors IL #576):
 *   - The MA 13-month term is reachable via a UOWN-gateway ONLINE merchant
 *     (TireAgent, routes by CUSTOMER state) with NO NeuroID gate → fully CI-automatable.
 *     This spec drives that path end-to-end (render + sign).
 *   - The MA 16-month term is only reachable via a Kornerstone ONLINE merchant whose
 *     `/complete` page is behind the NeuroID anti-bot gate. Both API `submitApplication`
 *     and browser auto-advance are NeuroID-blocked; the only proven 16m render path is
 *     MCP-manual (fill CC → reload → "Sign Contract"). Therefore the 16m content
 *     checkpoints (CT-02..CT-06, CT-08-16m) are NOT CI-automatable today and are marked
 *     `test.fixme()` below — they must be validated by an MCP-manual render / discovery
 *     pass (SPEC Open Questions #1, #2). Do NOT fake a pass for them.
 *
 * WHAT THIS SPEC VALIDATES IN CI (automatable now):
 *   Test 1 — CT-01 (13m routing) + CT-04 (token render smoke) + CT-07 (state-scope sanity)
 *            + CT-08 (signature completion + activity log, rule #13), via TireAgent + MA 13m.
 *   Test 2 — CT-02..CT-06 (16m contract content): `test.fixme()` — NeuroID-blocked (see above).
 *   Test 3 — CT-09 (SignWell fallback intact): a no-template state still routes SIGNWELL.
 *
 * Template inventory (SPEC Open Question #1): MA is ABSENT from the Appendix H registry and
 * from the last DB template map (docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md,
 * 2026-06-23). #583 ADDS `MA_2025_SAC` (13m) + `MA_2025_SAC_16_MONTHS` (16m). Test 1 asserts
 * their presence FIRST (Step 0) so a "templates not deployed" env fails with a clear signal
 * instead of a confusing GowSign-iframe timeout.
 *
 * Pre-req: DB tunnel qa2 active; #583 build deployed to the target env.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  signGowSignInFrame,
  installPostMessageRecorder,
  waitForLeadStatus,
  getEsignDocumentByLeadPk,
  getLeadStatusTransitions,
  findLeadNoteContaining,
  getGowSignTemplatesForState,
  assertSelectedTemplateForLead,
  sleep,
} from '@helpers/index.js';
import { TEST_CARDS } from '@config/constants.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import type { FrameLocator, Page } from '@playwright/test';

const data = { state: 'MA', merchant: 'TireAgent', orderTotal: '900' };

// Template business names added by #583.
const MA_13M_TEMPLATE = 'MA_2025_SAC';
const MA_16M_TEMPLATE = 'MA_2025_SAC_16_MONTHS';

// A no-template state that must still fall back to SIGNWELL (CT-09). CO is confirmed
// SIGNWELL in qa2 (docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md:
// "any other (CO, TX, AZ, …) → SIGNWELL"). Using an ONLINE merchant that routes by
// customer state keeps the fallback assertion deterministic.
const NO_TEMPLATE_STATE = 'CO';

// Other US states whose presence in a MA contract body would be a wrong-state legal
// leak (a donor-state copy carrying the wrong state-law clause — the primary migration
// risk per the SPEC). Massachusetts (state under test) and Florida (the Lessor's
// domicile/forum boilerplate "Tampa, FL", expected in every contract, BR-01) are
// intentionally EXCLUDED.
const WRONG_STATE_LEAK =
  /\b(Texas|Ohio|California|Alabama|Georgia|Pennsylvania|Louisiana|North Carolina|New York|Illinois|South Carolina)\b/;

/**
 * Drive a fresh MA 13m lead through CC pre-auth + Terms until the GowSign modal opens.
 * Mirrors the NY template spec's `openNyGowSignContract` (TireAgent + customer state +
 * 13m → GowSign). TireAgent is ONLINE (routes by customer state) and caps at 13m in qa2,
 * so no term override is needed. Returns the iframe FrameLocator and the applicant.
 */
async function openMaGowSignContract(
  page: Page,
  api: import('@support/base-test.js').ApiClients,
  ctx: import('@fixtures/test-context.fixture.js').TestContext,
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  const { merchant, applicant } = buildTestData({
    state: data.state,
    merchant: data.merchant,
    orderTotal: data.orderTotal,
    orderDescription: 'MA GowSign template',
    // Deterministic clean address: realistic mode randomly appends a "# <unit>" suffix
    // the backend rejects ~50% of runs. Static per-state base + "Unit <id>" is valid
    // and blacklist-immune (same rationale as the NY template spec).
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  // Setup via API (rule #14 exception (b) — precondition), parked at UW_APPROVED.
  // Merchant preflight (rule #12) runs inside createPreQualifiedApplication for the
  // created lead's merchant.
  await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'redirectUrl required').toBeTruthy();

  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  // Cardholder last name MUST equal the applicant last name (BR-02). Card: the canonical
  // approved Mastercard — raw Visa 4111… is rejected by the qa2 pre-auth gateway.
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
  // Wait for the contract body to render. Anchor on the generic "AGREEMENT" heading
  // (present in every rental-purchase contract) rather than a MA-specific heading —
  // MA wording is NOT frozen (SPEC), so an exact heading match would be brittle.
  await frame
    .getByText(/AGREEMENT/i)
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });

  return { frame, applicant };
}

test.describe(
  'MA GowSign Template (#583)',
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-high'] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // Test 1 — CT-01 (13m routing) + CT-04 (token render) + CT-07 (state scope)
    //          + CT-08 (signature completion + activity log). Single fresh MA 13m
    //          lead, end to end. Fully CI-automatable (UOWN-gateway, no NeuroID).
    // ─────────────────────────────────────────────────────────────
    test(
      'MA 13m routes to MA_2025_SAC (GowSign), renders populated + state-scoped, and signs to completion',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        await test.step('CT-01 (Step 0): both MA templates were deployed by #583', async () => {
          const templates = await getGowSignTemplatesForState(db, 'MA');
          const names = templates.map((t) => t.name);
          expect(
            names,
            `MA GowSign templates not deployed in this env — #583 not deployed or env not ready. Found: [${names.join(', ')}]`,
          ).toEqual(expect.arrayContaining([MA_13M_TEMPLATE, MA_16M_TEMPLATE]));
        });

        const { frame } = await openMaGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');
        const bodyNoCommas = bodyText.replace(/,/g, '');

        await test.step('CT-01: MA 13m lead selected the GOWSIGN MA_2025_SAC template', async () => {
          // Assert routing BEFORE signing — post-signature the esign_document.request
          // is overwritten to the string "getDocumentStatus" and templateId extraction
          // fails (gowsign-knowledge). assertSelectedTemplateForLead throws on mismatch.
          const { esignDoc, template } = await assertSelectedTemplateForLead(
            db,
            Number(ctx.leadPk),
            MA_13M_TEMPLATE,
          );
          expect(esignDoc.client, 'esign_document.client for MA 13m').toBe('GOWSIGN');
          expect(template.name).toBe(MA_13M_TEMPLATE);
        });

        await test.step('CT-07: contract is state-scoped to MA (lessee in Boston, MA); no wrong-state leak', () => {
          // Anchor on the deterministic customer address (STATE_ADDRESSES MA = Boston)
          // rather than an unfrozen MA-specific header string.
          expect(bodyText, 'lessee located in Boston, MA').toMatch(/Boston,\s*MA\b/i);
          const leak = bodyText.match(WRONG_STATE_LEAK);
          expect(leak, `wrong-state legal leak found: "${leak?.[0]}"`).toBeNull();
        });

        await test.step('CT-04: no raw template tokens / broken placeholders in the rendered contract', () => {
          expect(bodyText, 'no raw {{token}} should reach the customer-visible contract').not.toMatch(
            /\{\{|\}\}/,
          );
        });

        await test.step('CT-04: concrete money values + brand phone render (token smoke)', async () => {
          expect(bodyText, 'concrete dollar amounts rendered').toMatch(/\$\s?\d[\d,]*\.\d{2}/);

          // Value-for-value cross-check: the amounts the customer sees must equal the
          // values the backend computed for THIS lead (uown_esign_document.request).
          // Deterministic and wording-independent — the AL/OH `nextPaymentDueAmount`-blank
          // regression is caught here.
          const row = await db.queryOne<{ request: string }>(
            'SELECT request::text AS request FROM uown_esign_document WHERE lead_pk=$1 AND request LIKE $2 ORDER BY pk DESC LIMIT 1',
            [Number(ctx.leadPk), '{%'],
          );
          expect(row?.request, 'esign_document.request (dispatch JSON) present').toBeTruthy();
          const vars = (JSON.parse(row!.request).document?.variables ?? {}) as Record<string, string>;

          for (const k of ['contractAmount', 'nextPaymentDueAmount']) {
            const v = String(vars[k] ?? '').replace(/,/g, '');
            expect(v, `variable ${k} present + non-empty in backend request`).toBeTruthy();
            expect(bodyNoCommas, `rendered contract must show ${k}=${v}`).toContain(v);
          }
          if (vars.companyInfoBrandPhone) {
            expect(bodyText, 'brand phone rendered').toContain(String(vars.companyInfoBrandPhone));
          }
        });

        await test.step('CT-08: complete the GowSign signing ceremony', async () => {
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start clicked').toBe(true);
          expect(result.signClicked, 'final Sign clicked').toBe(true);
          expect(result.capturedCompleted, 'document reached "completed"').toBe(true);
        });

        await test.step('CT-08: lead transitions to SIGNED', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 90_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('CT-08: esign_document is GOWSIGN and reaches a signed timestamp', async () => {
          let doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc, 'esign_document row').toBeTruthy();
          expect(doc!.esignClient).toBe('GOWSIGN');
          const deadline = Date.now() + 60_000;
          while (Date.now() < deadline && (!doc || doc.signedDateTime === null)) {
            await sleep(3_000);
            doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          }
          expect(doc!.signedDateTime, 'doc_signed_time_stamp set after signing').not.toBeNull();
        });

        await test.step('CT-08 activity log (rule #13): SIGNED transition recorded on the lead', async () => {
          const transitions = await getLeadStatusTransitions(db, Number(ctx.leadPk));
          expect(
            transitions.find((t) => t.to === 'SIGNED'),
            `expected a transition to SIGNED — got ${JSON.stringify(transitions.map((t) => `${t.from}→${t.to}`))}`,
          ).toBeTruthy();
          const signedNote = await findLeadNoteContaining(db, Number(ctx.leadPk), 'SIGNED');
          expect(signedNote, 'a lead note recording the SIGNED transition').not.toBeNull();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // Test 2 — CT-02..CT-06: content of the MA 16-MONTH contract
    //   (MA_2025_SAC_16_MONTHS). BLOCKED IN CI by the NeuroID gate on the only 16m
    //   route (Kornerstone ONLINE). Marked test.fixme() so qa-validator inherits an
    //   accurate picture (SPEC feasibility gate S1 + Open Questions #1/#2).
    //
    //   To validate: MCP-manual render (fill CC on the Kornerstone /complete page →
    //   reload → "Sign Contract" → GowSign iframe) then assert, against the FROZEN
    //   canonical wording (SPEC Assumption #3 — capture the real render first):
    //     CT-02 Item 4  "Promotional-Payoff Option:" (exercise-date daily-accrual;
    //                    NOT day-count/expiry/Cash-Price; no {{epoDays}}/{{epoExpiryDate}}).
    //     CT-03 Item 4a exercise-date EPO tail; nextPaymentDueAmount NON-empty; no %-discount.
    //     CT-04 tokens non-empty + no "{{ }}" + no "variables map missing" dispatch note.
    //     CT-05 lease-purchase-plan footnote (no EPO chart, no Options 1/2).
    //     CT-06 singular "EARLY PURCHASE OPTION" appendix (watch the "16-\nmonth" line
    //                    break, OH precedent); Item 14 ACH follows immediately, not duplicated.
    //   Reuse getGowSignTemplatesForState / assertSelectedTemplateForLead / the GowSign
    //   iframe render capture once a UOWN-gateway 16m route (or MCP-manual) is resolved.
    // ─────────────────────────────────────────────────────────────
    test.fixme(
      'MA 16m contract content (CT-02..CT-06) — BLOCKED: NeuroID gate on the Kornerstone 16m route (SPEC S1)',
      async () => {
        // Intentionally empty: the 16m render path is not CI-automatable today (NeuroID).
        // See the block comment above and `.claude/oracles/ma-16m-gowsign-template.md`.
        // Do NOT convert to a green pass without a real MA_2025_SAC_16_MONTHS render.
      },
    );

    // ─────────────────────────────────────────────────────────────
    // Test 3 — CT-09: SignWell fallback intact (mandatory regression per
    //   gowsign-knowledge). A lead in a state with NO GowSign template must still
    //   route to SIGNWELL — i.e. the MA migration did not break the fallback.
    //   Routing-level assertion (rule #14 cross-cutting DB validation): the fallback
    //   is fundamentally about uown_esign_document.client, not rendered content.
    //   The MA SignWell→GowSign clause-parity visual diff needs the prior MA SignWell
    //   render and is deferred to the discovery pass (SPEC Open Question, CT-09 [finding]).
    // ─────────────────────────────────────────────────────────────
    test(
      'CT-09: a no-template state still falls back to SIGNWELL (migration did not break the fallback)',
      async ({ api, ctx, db }, testInfo) => {
        test.setTimeout(240_000);

        const { merchant, applicant } = buildTestData({
          state: NO_TEMPLATE_STATE,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'MA #583 SignWell fallback regression',
          realistic: false,
          uniqueAddress: true,
        });

        await test.step(`drive a fresh ${NO_TEMPLATE_STATE} 13m lead to CONTRACT_CREATED via API`, async () => {
          // submitPaymentInfoViaApi drives past CC pre-auth so the esign_document
          // (and thus the provider routing decision) exists. Merchant preflight runs
          // inside createPreQualifiedApplication (rule #12).
          await createPreQualifiedApplication(
            api,
            merchant,
            applicant,
            ctx,
            { submitPaymentInfoViaApi: true },
            testInfo,
          );
        });

        await test.step('CT-09: esign_document.client is SIGNWELL (fallback intact)', async () => {
          let doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          const deadline = Date.now() + 90_000;
          while (Date.now() < deadline && !doc) {
            await sleep(3_000);
            doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          }
          expect(doc, `esign_document row for ${NO_TEMPLATE_STATE} lead`).toBeTruthy();
          expect(
            doc!.esignClient,
            `no-template state ${NO_TEMPLATE_STATE} must fall back to SIGNWELL — got ${doc!.esignClient}`,
          ).toBe('SIGNWELL');
        });

        await test.step('CT-09 activity log (rule #13): contract dispatch recorded on the lead', async () => {
          const note = await findLeadNoteContaining(db, Number(ctx.leadPk), 'CONTRACT_CREATED');
          expect(note, 'a lead note recording contract creation for the fallback lead').not.toBeNull();
        });
      },
    );
  },
);

/**
 * E2E — Tennessee GowSign Template (work item #557, milestone RU07.26.1.54.0)
 *
 * Covers the acceptance criteria of "UOWN | SVC | Add TN - Tennessee GowSign
 * Template" — a new TN 16-month SAC template (`TN_2025_SAC_16_MONTHS`) plus the
 * existing 13m standard SAC (`TN_2025_SAC`).
 *
 * BDD Oracle (rule #19): `.claude/oracles/tn-16m-gowsign-template.md` (CT-01..CT-08).
 * Content grounded in the canonical registry
 * `docs/business-rules/appendix-h-epo-template-registry.md` §H.2/H.3/H.4/H.5
 * (TN 16m Item 4a = R2 `exercise_date_epo_fl`).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO EXECUTION TIERS (dictated by the NeuroID blocker — SPEC Open Q3):
 *
 *   1. AUTOMATABLE (CI) — `TN_2025_SAC` (13m) via TerraceFinance (ONLINE, UOWN
 *      gateway, NO NeuroID gate). Covers:
 *        - CT-01 negative control: 13m TN lease → GOWSIGN / `TN_2025_SAC`
 *          (proves the TERM, not the state, drives selection) + template inventory.
 *        - CT-07 reference: standard TN SAC baseline clauses (Item 3 paycheck-based
 *          start, Item 7 reinstatement 90/180 @ 80%) are the diff reference for the 16m.
 *        - CT-08 (13m variant): full GowSign ceremony → SIGNED + activity log (rule #13).
 *
 *   2. MCP-MANUAL ONLY (NOT CI) — `TN_2025_SAC_16_MONTHS` (16m) via a Kornerstone
 *      ONLINE merchant whose `valid_states` includes TN. That `/complete` host
 *      carries the NeuroID behavioral gate; IL (#576) proved BOTH the API
 *      `submitApplication` AND the browser auto-advance are NeuroID-blocked for the
 *      Kornerstone 16m route (no `uown_esign_document`, lead stuck UW_APPROVED).
 *      → CT-02..CT-06 (16m content) + CT-08 (16m signing) are marked `test.fixme()`
 *        below: validatable today only by an MCP-manual render pass. The intended
 *        assertions ARE encoded so they run the moment the blocker is lifted.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ P0 ANTI-HOMOGENIZATION (SPEC Risk = High, CT-03):
 *   TN's Item 4a ownership tail is STRUCTURALLY DIFFERENT from the sibling states
 *   in this same milestone (IL #576, VA #568, IN #579, MA #583). TN uses a separate
 *   `plus $ [salesTax] in sales tax` line + "and you pay the processing fee"
 *   (appendix-h R2 `exercise_date_epo_fl`), NOT the siblings' `... (plus tax)` +
 *   "application fee" pattern (`current_date_epo_ca`). The CT-03 assertions below
 *   check the TN-specific wording AND assert the sibling `(plus tax)` / %-discount /
 *   standard-SAC-reference patterns are ABSENT — do NOT let this be copy-pasted flat
 *   from a sibling implementation.
 *
 * Routing recipe: TerraceFinance (OL90202-0001, ONLINE) + customer state TN + 13m →
 * GowSign `TN_2025_SAC`. `effectiveState = INSTORE ? merchant.state : customerState`;
 * TerraceFinance is ONLINE so the customer state (TN) drives the template lookup.
 *
 * Pre-req: DB tunnel active for the target env (stg primary per SPEC; qa2 secondary
 * for the 13m tier — its TN template availability is UNVERIFIED, CT-01 re-lists it).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/index.js';
import { TEST_CARDS, TEST_BANK } from '@config/constants.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import {
  signGowSignInFrame,
  installPostMessageRecorder,
} from '@helpers/gowsign-signing.helper.js';
import {
  waitForLeadStatus,
  getEsignDocumentByLeadPk,
  getLeadStatusTransitions,
  findLeadNoteContaining,
} from '@helpers/esign-db.helpers.js';
import {
  getGowSignTemplatesForState,
  assertSelectedTemplateForLead,
} from '@helpers/gowsign-template-db.helpers.js';
import { sleep } from '@helpers/common.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import type { FrameLocator, Page } from '@playwright/test';

const TN_TEMPLATE_13M = 'TN_2025_SAC';
const TN_TEMPLATE_16M = 'TN_2025_SAC_16_MONTHS';

const data13m = { state: 'TN', merchant: 'TerraceFinance', orderTotal: '900' };

/**
 * 16m Kornerstone route (fixme tier). The exact Kornerstone ONLINE merchant whose
 * `valid_states` includes TN + returns EligibleTerms 16 is UNCONFIRMED (SPEC Open Q3 —
 * the IL analogue was KS3015). Resolve via the discovery pass before un-fixme'ing.
 */
const data16m = { state: 'TN', merchant: 'KS3015', orderTotal: '1500' };

// Other US states whose presence in a TN contract body would be a wrong-state legal
// leak. Florida is intentionally EXCLUDED — it is the Lessor's domicile/forum
// boilerplate ("Tampa, FL"), expected in every contract.
const WRONG_STATE_LEAK =
  /\b(Texas|Ohio|California|Alabama|Georgia|Pennsylvania|Louisiana|North Carolina|Illinois|Indiana|Virginia|Massachusetts)\b/;

// ─────────────────────────────────────────────────────────────────────────────
// Setup helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Drive a fresh TN 13m lead (TerraceFinance) through CC pre-auth + Terms until the
 *  GowSign modal opens and the contract body has rendered. */
async function openTn13mGowSignContract(
  page: Page,
  api: import('@support/base-test.js').ApiClients,
  ctx: import('@fixtures/test-context.fixture.js').TestContext,
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  const { merchant, applicant } = buildTestData({
    state: data13m.state,
    merchant: data13m.merchant,
    orderTotal: data13m.orderTotal,
    orderDescription: 'TN GowSign template',
    // Deterministic clean address (avoids the "# <unit>" suffix that the backend
    // rejects ~50% of runs). Static per-state base + "Unit <id>" suffix.
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'redirectUrl required').toBeTruthy();

  return openContractModal(page, contractUrl, applicant);
}

/**
 * Drive a fresh TN 16m lead (Kornerstone + bankData + 16m program) to the GowSign
 * modal. Used ONLY by the fixme'd 16m content CTs — today this path is NeuroID-blocked
 * (SPEC Open Q3): `submitApplication` returns "Failed to verify identification." and no
 * `uown_esign_document` is created. Encoded so it runs when the blocker is lifted.
 */
async function openTn16mGowSignContract(
  page: Page,
  api: import('@support/base-test.js').ApiClients,
  ctx: import('@fixtures/test-context.fixture.js').TestContext,
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  const { merchant, applicant } = buildTestData({
    state: data16m.state,
    merchant: data16m.merchant,
    orderTotal: data16m.orderTotal,
    orderDescription: 'TN GowSign 16m template',
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  // Kornerstone requires bankData or sendApplication 400. 16m term comes from the
  // merchant program (NOT the SSN suffix) — ssn-test-modalities §2.
  await createPreQualifiedApplication(
    api,
    merchant,
    applicant,
    ctx,
    {
      skipPaymentInfo: true,
      bankData: { routingNumber: TEST_BANK.DEFAULT_ROUTING, accountNumber: TEST_BANK.DEFAULT_ACCOUNT },
    },
    testInfo,
  );
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  // Select the 16m plan (termInMonths=16), NOT the default 13m entry.
  const plans = invoiceResp.body?.paymentDetailsList ?? [];
  const plan16m = plans.find((p) => Number(p.termInMonths) === 16) ?? plans[0];
  const contractUrl = plan16m?.redirectUrl ?? '';
  expect(contractUrl, '16m redirectUrl required').toBeTruthy();

  return openContractModal(page, contractUrl, applicant);
}

/** Shared: from a contract redirect URL, fill CC + accept Terms, open the GowSign
 *  modal, and wait for the contract body to render (start-signature button visible). */
async function openContractModal(
  page: Page,
  contractUrl: string,
  applicant: { firstName: string; lastName: string },
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  // Cardholder last name MUST equal the applicant last name. Canonical approved
  // Mastercard (raw Visa 4111… is rejected by the qa pre-auth gateway).
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
  // State-agnostic readiness signal: the contract body has rendered once the
  // GowSign start-signature button is visible (works for any state/term title).
  await frame.locator('#startSignatureButton').waitFor({ state: 'visible', timeout: 30_000 });

  return { frame, applicant };
}

test.describe(
  'TN GowSign Template (#557)',
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-high'] },
  () => {
    // ─────────────────────────────────────────────────────────────────────────
    // AUTOMATABLE TIER — 13m via TerraceFinance (no NeuroID).
    // CT-01 (negative control + inventory) + CT-07 (standard-SAC reference) +
    // CT-08 (13m signature + activity log). Single fresh lead, end to end.
    // ─────────────────────────────────────────────────────────────────────────
    test(
      'CT-01/CT-07/CT-08 — TN 13m routes to GOWSIGN/TN_2025_SAC, renders the standard-SAC reference, and signs to completion',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        await test.step('CT-01: both TN templates exist in the target env with client_type=null', async () => {
          const templates = await getGowSignTemplatesForState(db, 'TN');
          const names = templates.map((t) => t.name);
          expect(names, `TN GowSign templates present (got: ${names.join(', ') || 'none'})`).toEqual(
            expect.arrayContaining([TN_TEMPLATE_13M, TN_TEMPLATE_16M]),
          );
          // No merchant restriction on either row (term, not client_type, routes here).
          for (const name of [TN_TEMPLATE_13M, TN_TEMPLATE_16M]) {
            const row = templates.find((t) => t.name === name);
            expect(row?.clientType, `${name} client_type must be null`).toBeNull();
          }
        });

        const { frame } = await openTn13mGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');

        await test.step('CT-01 (negative control): the 13m lease selected GOWSIGN / TN_2025_SAC (NOT the 16m template)', async () => {
          const { esignDoc, template } = await assertSelectedTemplateForLead(
            db,
            Number(ctx.leadPk),
            TN_TEMPLATE_13M,
          );
          expect(esignDoc.client, 'esign client is GOWSIGN (matrix row still says SIGNWELL — stale)').toBe('GOWSIGN');
          expect(template.name, 'the 13m term must NOT select the 16m template').not.toBe(TN_TEMPLATE_16M);
        });

        await test.step('CT-07 (reference): the standard TN SAC renders its non-EPO baseline clauses', () => {
          // Item 7 reinstatement — TN-specific tiers (90/180 days, 80% threshold).
          // These legitimately differ from other states' tiers; they are the same in
          // the standard SAC and the 16m template, so they form the diff reference.
          expect(bodyText, 'Item 7 reinstatement 90/180-day tiers').toMatch(/\b90\b[\s\S]*?\b180\b/);
          expect(bodyText, 'Item 7 reinstatement 80% threshold').toMatch(/80\s*%/);
          // Lessor party boilerplate present (rendered, not a raw token).
          expect(bodyText, 'Lessor party').toMatch(/Mollie,\s*LLC/i);
          // No wrong-state legal leak (Florida = Lessor domicile boilerplate is allowed).
          const leak = bodyText.match(WRONG_STATE_LEAK);
          expect(leak, `wrong-state leak found: "${leak?.[0]}"`).toBeNull();
        });

        await test.step('CT-04-lite: no raw {{token}} placeholders reach the standard-SAC render', () => {
          expect(bodyText, 'no raw {{token}} in the customer-visible contract').not.toMatch(/\{\{|\}\}/);
        });

        await test.step('CT-08: complete the GowSign signing ceremony (13m)', async () => {
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start clicked').toBe(true);
          expect(result.signClicked, 'final Sign clicked').toBe(true);
        });

        await test.step('CT-08: lead transitions to SIGNED', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 90_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('CT-08: esign_document is GOWSIGN and signed (doc_signed_time_stamp populated)', async () => {
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

        await test.step('CT-08 activity log (rule #13): signing transition recorded on the lead', async () => {
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

    // ─────────────────────────────────────────────────────────────────────────
    // MCP-MANUAL TIER — 16m content CTs. NeuroID-blocked (SPEC Open Q3): the
    // Kornerstone-TN 16m route cannot be driven via API/browser auto-advance in CI.
    // Marked `test.fixme()` so the validator inherits an accurate "known-blocked"
    // picture (NOT a silent gap). The assertions are the frozen acceptance contract
    // from the oracle — un-fixme once a stg NeuroID bypass / confirmed TN-16m
    // Kornerstone merchant lands.
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-02 — Item 4 Promotional-Payoff Option renders exercise-date accrual (NeuroID-blocked, SPEC Open Q3)',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);
        void db;
        const { frame } = await openTn16mGowSignContract(page, api, ctx, testInfo);
        const body = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');

        // MUST — heading + exercise-date narrative (appendix-h R1 exercise_date_promo).
        // Open Q1: AC asserts the hyphenated "Promotional-Payoff Option:"; freeze the
        // exact form from the real render before promoting to [confirmed].
        expect(body, 'Item 4 heading').toMatch(/Promotional-Payoff Option:/i);
        expect(body, 'buy at any time').toMatch(/at any time/i);
        expect(body, 'price = costPriceWithFeeNoTax plus tax').toMatch(/\$\s?[\d.,]+\s+plus tax/i);
        expect(body, 'less on-time rental payments, excluding taxes/fees').toMatch(
          /less all rental payments you have made on time[\s\S]*?not including any taxes or fees/i,
        );
        expect(body, 'accrual THROUGH THE DATE YOU EXERCISE (exercise-date donor)').toMatch(
          /through the date you exercise/i,
        );
        expect(body, 'late payments void the option').toMatch(/late payments will void this option/i);

        // MUST NOT — promo-window artifacts + wrong (current-date) donor.
        expect(body, 'no fixed-day promo window').not.toMatch(/During the first .* days/i);
        expect(body, 'no epoDays token (populated or blank)').not.toMatch(/\{\{\s*epoDays\s*\}\}|\d+-Day-Promotional/i);
        expect(body, 'no promo expiry').not.toMatch(/This option expires on/i);
        expect(body, 'NOT the current-date donor (TX/CA)').not.toMatch(/through the current date/i);
        expect(body, 'no standard-SAC promo language').not.toContain('Cash Price of the item(s)');
        expect(body, 'no numbered-options pointer').not.toContain('You have other purchase options described below');
      },
    );

    test.fixme(
      'CT-03 — Item 4a TN sales-tax + processing-fee tail (P0 anti-homogenization; NeuroID-blocked, SPEC Open Q3)',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);
        void db;
        const { frame } = await openTn16mGowSignContract(page, api, ctx, testInfo);
        const body = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');

        // MUST — TN ownership tail (appendix-h R2 exercise_date_epo_fl).
        expect(body, 'must be current to elect the EPO').toMatch(/you are current[\s\S]*?Early Purchase Option/i);
        expect(body, 'EPO accrual from inception through the exercise date').toMatch(
          /through the date you exercise the Early Purchase Option/i,
        );
        expect(body, 'late fees not included in purchase price').toMatch(
          /does not include other charges such as late fees/i,
        );
        expect(body, 'no ownership until paid in full').toMatch(
          /do not obtain any ownership rights until you have paid for the Property in full/i,
        );
        // The TN-specific tail: a SEPARATE sales-tax line (NOT "(plus tax)").
        expect(body, 'TN tail: N payments of $X plus $Y in sales tax').toMatch(
          /[\d,]+ payments of \$\s?[\d.,]+ plus \$\s?[\d.,]+ in sales tax/i,
        );
        expect(body, 'and you pay the processing fee').toMatch(/and you pay the processing fee/i);
        expect(body, 'Total Cost label').toMatch(/Total Cost/);
        expect(body, 'ends with ownership').toMatch(/and you will own the Property/i);

        // MUST NOT — the sibling-state homogenization patterns (IL/VA/IN/MA) + standard-SAC math.
        expect(body, 'ANTI-HOMOGENIZATION: NO sibling "(plus tax)" pattern (IL/VA/IN/MA)').not.toMatch(
          /of \$\s?[\d.,]+ \(plus tax\)/i,
        );
        expect(body, 'ANTI-HOMOGENIZATION: NO %-discount (payOffDiscountPercent)').not.toMatch(/\d+%\s*discount/i);
        expect(body, 'NO standard-SAC discount math').not.toMatch(/remaining lease payments for ownership/i);
        expect(body, 'NO standard-SAC [N]-Day-Promotional-Payoff Option (Item 4) reference').not.toMatch(
          /\d+-Day-Promotional-Payoff Option \(Item 4\)/i,
        );
      },
    );

    test.fixme(
      'CT-04 — Token render smoke: salesTax/nextPaymentDueAmount non-empty, zero {{ }} (NeuroID-blocked, SPEC Open Q3)',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);
        const { frame } = await openTn16mGowSignContract(page, api, ctx, testInfo);
        const body = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');
        const bodyNoCommas = body.replace(/,/g, '');

        // Cross-check every monetary token against the dispatch variables map.
        const row = await db.queryOne<{ request: string }>(
          'SELECT request::text AS request FROM uown_esign_document WHERE lead_pk=$1 AND request LIKE $2 ORDER BY pk DESC LIMIT 1',
          [Number(ctx.leadPk), '{%'],
        );
        expect(row?.request, 'esign_document.request present').toBeTruthy();
        const vars = (JSON.parse(row!.request).document?.variables ?? {}) as Record<string, string>;

        // AL/OH had `nextPaymentDueAmount` render blank; TN adds a SECOND blank-risk
        // token `salesTax`. Assert non-empty in the variables map AND rendered in the body.
        const MONEY_KEYS = ['costPriceWithFeeNoTax', 'nextPaymentDueAmount', 'salesTax', 'contractAmount'];
        for (const k of MONEY_KEYS) {
          const v = String(vars[k] ?? '').replace(/,/g, '');
          expect(v, `variable ${k} present + non-empty in the dispatch variables`).toBeTruthy();
          expect(bodyNoCommas, `rendered contract must show ${k}=${v}`).toContain(v);
        }
        expect(body, 'totalNumberOfPayments rendered').toContain(String(vars.totalNumberOfPayments));
        expect(body, 'brand phone rendered').toContain(String(vars.companyInfoBrandPhone));

        // No raw tokens; brand logo at the top.
        expect(body, 'no raw {{...}} token in the visible text').not.toMatch(/\{\{|\}\}/);
        const logo = frame.locator('img').first();
        expect(await logo.isVisible().catch(() => false), 'brand logo <img> present at top').toBe(true);

        // No "variables map missing" dispatch note for this lead (rule #13 negative guard).
        const missingNote = await findLeadNoteContaining(db, Number(ctx.leadPk), 'variables map missing');
        expect(missingNote, 'NO [DocumentDispatchService][GowSign] variables-map-missing note').toBeNull();
      },
    );

    test.fixme(
      'CT-05 — Lease-purchase plan footnote (Promotional Payoff option, no EPO chart; NeuroID-blocked, SPEC Open Q3)',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);
        void db;
        const { frame } = await openTn16mGowSignContract(page, api, ctx, testInfo);
        const body = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');

        // MUST (appendix-h R4 shared_footnote; TN has NO ca_chart per H.4 R5).
        expect(body, 'plan title Traditional [N] Month Lease Purchase Plan').toMatch(
          /Traditional\s+\d+\s+Month Lease Purchase Plan/i,
        );
        expect(body, 'footnote with a Promotional Payoff option').toMatch(/with a Promotional Payoff option/i);
        expect(body, 'Early Purchase Option Available Off Unpaid Balance').toMatch(
          /Early Purchase Option Available Off Unpaid Balance/i,
        );

        // MUST NOT — EPO payoff chart (ca_chart) or numbered-Options appendix language here.
        expect(body, 'NO EPO payoff chart / numbered options in the footnote').not.toMatch(
          /Option 1|Option 2/i,
        );
      },
    );

    test.fixme(
      'CT-06 — EARLY PURCHASE OPTION appendix is singular + hard-coded 16-month + page order (NeuroID-blocked, SPEC Open Q3)',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);
        void db;
        const { frame } = await openTn16mGowSignContract(page, api, ctx, testInfo);
        const body = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');

        // MUST (appendix-h R3 shared_16month_appendix). Allow the "16-\nmonth" line break
        // (OH render precedent) — collapsed whitespace turns it into "16- month".
        expect(body, 'appendix heading EARLY PURCHASE OPTION (singular)').toMatch(/EARLY PURCHASE OPTION\b/);
        expect(body, 'hard-coded 16-month term for ownership').toMatch(/16-\s*month term for ownership/i);
        expect(body, 'purchase the Property at any time').toMatch(/you may purchase the Property at any time/i);
        expect(body, 'EPO price formula intro for a 16-month lease').toMatch(
          /For a 16-\s*month lease, the EPO price is calculated as:/i,
        );
        expect(body, 'closing call-us line').toMatch(/To exercise this option, you must call us at/i);

        // MUST NOT — plural / numbered-options / promo-expiry / initials-block structure.
        expect(body, 'NOT plural EARLY PURCHASE OPTIONS').not.toMatch(/EARLY PURCHASE OPTIONS/);
        expect(body, 'NO numbered Option 1 / Option 2').not.toMatch(/Option 1|Option 2/i);
        expect(body, 'NO promo "Beginning [date]…" language').not.toMatch(/Beginning \w+ \d/i);
      },
    );

    test.fixme(
      'CT-08 (16m) — Full GowSign signature → SIGNED + activity log for the 16m template (NeuroID-blocked, SPEC Open Q3)',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);
        const { frame } = await openTn16mGowSignContract(page, api, ctx, testInfo);

        const result = await signGowSignInFrame(page, frame, {
          preauthChoice: 'yes',
          fontIndex: 0,
          waitForCompleted: true,
        });
        expect(result.signClicked, 'final Sign clicked').toBe(true);

        // The selected template must be the 16m one (routing under signature).
        await assertSelectedTemplateForLead(db, Number(ctx.leadPk), TN_TEMPLATE_16M);

        const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 120_000 });
        expect(status).toBe('SIGNED');

        // Activity log (rule #13): the three canonical signing notes.
        for (const pattern of [
          'isLeaseOrLeaseModSigned',
          'updateSignStatus',
          'parseCCPeekConsent',
        ]) {
          const note = await findLeadNoteContaining(db, Number(ctx.leadPk), pattern);
          expect(note, `lead note matching "${pattern}"`).not.toBeNull();
        }
      },
    );
  },
);

/**
 * E2E — Virginia (VA) GowSign Template  ·  work item #568
 *   "UOWN | SVC | Add VA - Virginia GowSign Template" (milestone RU07.26.1.54.0)
 *
 * SPEC:   docs/taskTestingUown/RU07.26.1.54.0_addVaGowSignTemplate_568/RU07.26.1.54.0_addVaGowSignTemplate_568-spec.md
 * Oracle: .claude/oracles/va-16m-gowsign-template.md (CT-01..CT-08, rule #19)
 *
 * ────────────────────────────────────────────────────────────────────────────
 * TWO-TRACK SPLIT (forced by the NeuroID automation blocker, inherited from the
 * AL/IL siblings — see docs/knowledge-base/illinois-gowsign-template.md):
 *
 *   Track A — AUTOMATABLE (this file, running tests):
 *     VA 13m via TerraceFinance (OL90202-0001, ONLINE, UOWN gateway
 *     secure-<env>.uownleasing.com — NO NeuroID). Reaches GowSign VA_2025_SAC.
 *     Covers: CT-01 negative control (13m → VA_2025_SAC, GOWSIGN),
 *             CT-04 token smoke on the 13m render,
 *             CT-07 sanity reference (VA state-law clauses common to both terms —
 *                   Item 3 delivery-date start, Item 7 reinstatement 5/21/45 at
 *                   2/3 Total Cost, return language; + cross-state copy guards),
 *             CT-08 full signing → SIGNED + activity log (rule #13).
 *     Conditional on a VA 13m template existing in the target env (discovery item,
 *     SPEC open question #2) — each Track A test probes the live DB inventory and
 *     test.skip()s if VA_2025_SAC is absent (16m-only rollout like OH) rather than
 *     asserting vacuously against a SignWell fallback.
 *
 *   Track B — NeuroID-BLOCKED, NOT CI (test.fixme below):
 *     VA 16m via a Kornerstone ONLINE merchant. Both automated entry paths are
 *     NeuroID-gated (API submitApplication → "Failed to verify identification",
 *     no esign doc, lead stuck UW_APPROVED; browser auto-advance blocked). The
 *     16m-specific content (CT-02 Item 4, CT-03 Item 4a tail, CT-04 16m tokens,
 *     CT-06 EPO appendix) is validatable ONLY via MCP-manual render today. Marked
 *     test.fixme with the SPEC open-question link so qa-validator inherits an
 *     accurate picture instead of a silent gap. See SPEC open question #1.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * VA-SPECIFIC deltas (do NOT confuse with the sibling states in this milestone —
 * IL #576, IN #579, TN #557, MA #583):
 *   - Item 7 reinstatement = 5 / 21 / 45 days at 2/3 Total Cost
 *     (NOT IL 16/60-day, NOT IN 120-day, NOT TN 90/180-day).
 *   - Item 4a tail uses nextPaymentDueAmount (TX-structured) — a NEW baseline.
 *
 * Pre-req: DB tunnel active for the target env; VA GowSign templates deployed.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  signGowSignInFrame,
  installPostMessageRecorder,
  getGowSignTemplatesForState,
  assertSelectedTemplateForLead,
  waitForLeadStatus,
  getEsignDocumentByLeadPk,
  getLeadStatusTransitions,
  findLeadNoteContaining,
  sleep,
} from '@helpers/index.js';
import { TEST_CARDS } from '@config/constants.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import type { FrameLocator, Page } from '@playwright/test';
import type { ApiClients, TestContext } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';

const data = { state: 'VA', merchant: 'TerraceFinance', orderTotal: '900' };

const VA_16M_TEMPLATE = 'VA_2025_SAC_16_MONTHS';
const VA_13M_TEMPLATE = 'VA_2025_SAC';

/**
 * Other US states whose full name in a VA contract body would be a wrong-state
 * legal leak. Florida is intentionally EXCLUDED — it is the Lessor's
 * domicile/forum boilerplate ("Tampa, FL"), expected in every contract (BR-01,
 * NY sibling). Virginia is excluded because it is the target state.
 * IL/IN/TN/MA/NY are the parallel-ticket states most likely to leak via a
 * copy-paste template error.
 */
const WRONG_STATE_LEAK =
  /\b(Texas|Ohio|California|Alabama|Georgia|Pennsylvania|Louisiana|North Carolina|Illinois|Indiana|Tennessee|Massachusetts|New York)\b/;

/**
 * Sibling-state reinstatement windows that must NOT appear in a VA contract.
 * VA is uniquely 5/21/45 days — the SPEC flags this as the single most likely
 * cross-state copy error (IL 16/60-day, IN 120-day, TN 90/180-day). Scoped to a
 * reinstatement context so an unrelated "120" (e.g. a dollar amount) does not
 * false-positive.
 */
const WRONG_REINSTATEMENT =
  /reinstate[\s\S]{0,120}\b(16|60|90|120|180)\b\s*(?:calendar\s*)?days/i;

/**
 * Probe the live DB inventory for a VA 13m GowSign template. Track A can only
 * reach a GowSign VA contract via TerraceFinance when VA_2025_SAC (13m) exists;
 * if VA shipped 16m-only (like OH), TerraceFinance falls back to SignWell and
 * every GowSign assertion would be vacuous. Callers test.skip() on false.
 */
async function va13mGowSignTemplateExists(db: DatabaseHelpers): Promise<boolean> {
  const templates = await getGowSignTemplatesForState(db, 'VA');
  return templates.some((t) => t.name === VA_13M_TEMPLATE);
}

/** Drive a fresh VA 13m lead through CC pre-auth + Terms until the GowSign modal opens. */
async function openVaGowSign13mContract(
  page: Page,
  api: ApiClients,
  ctx: TestContext,
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  const { merchant, applicant } = buildTestData({
    state: data.state,
    merchant: data.merchant,
    orderTotal: data.orderTotal,
    orderDescription: 'VA GowSign template',
    // Deterministic clean address (NY sibling BR): realistic mode randomly appends
    // a "# <unit>" suffix the backend rejects ~50% of runs. Static per-state base +
    // "Unit <id>" is valid and blacklist-immune.
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  // Setup via API → UW_APPROVED (merchant preflight runs automatically, rule #12).
  await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

  // TerraceFinance ONLINE caps at 13m; pick the 13m plan explicitly (WK13) so the
  // routing assertion targets VA_2025_SAC, falling back to the first offer.
  const details = invoiceResp.body?.paymentDetailsList ?? [];
  const plan13 = details.find((d) => d.termInMonths === 13 || d.planId === 'WK13') ?? details[0];
  const contractUrl = plan13?.redirectUrl ?? '';
  expect(contractUrl, 'redirectUrl required').toBeTruthy();

  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  // cardholder last name MUST equal the applicant last name (BR-02). Card: the
  // canonical approved Mastercard (BIN 5500) — raw Visa 4111… is rejected by the
  // qa2 pre-auth gateway ("Invalid card.").
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
  // If VA 13m routed to SignWell (template missing) this GowSign modal never
  // opens — the caller has already gated on the inventory probe, so a timeout
  // here is a genuine routing regression worth surfacing.
  await modal.waitForOpen(120_000);
  const frame = modal.getGowSignFrame();
  // Ensure the contract body actually rendered before reading innerText. The
  // signing entry button is env-stable (the VA title heading is not frozen yet).
  await frame
    .locator('#startSignatureButton')
    .waitFor({ state: 'visible', timeout: 30_000 });

  return { frame, applicant };
}

test.describe(
  'RU07.26.1.54.0_addVaGowSignTemplate_568 — VA GowSign Template',
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-high'] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // CT-01 — Routing & term→template selection.
    //   Hard: VA 16m template (the ticket deliverable) exists in the env.
    //   Automatable control: VA 13m lead via TerraceFinance → GOWSIGN/VA_2025_SAC.
    //   16m selection is NeuroID-blocked → covered in the Track B fixme.
    // ─────────────────────────────────────────────────────────────
    test(
      'CT-01: VA GowSign template inventory + 13m routing selection',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(300_000);

        const templateNames = await test.step('DB inventory: getGowSignTemplatesForState(VA)', async () => {
          const templates = await getGowSignTemplatesForState(db, 'VA');
          return templates.map((t) => t.name);
        });

        await test.step('CT-01: the VA 16m template (ticket deliverable) is deployed', () => {
          // Fail-fast S1: if the VA GowSign template was not deployed to this env,
          // the whole content suite is moot (the lead would silently sign on
          // SignWell). This is the routing entry gate.
          expect(
            templateNames,
            `VA templates in env: ${JSON.stringify(templateNames)} — expected ${VA_16M_TEMPLATE}`,
          ).toContain(VA_16M_TEMPLATE);
        });

        const has13m = templateNames.includes(VA_13M_TEMPLATE);
        // If VA is 16m-only (like OH) the 13m negative control collapses — document
        // it via skip (SPEC open question #2), do not assert vacuously.
        test.skip(
          !has13m,
          `VA is 16m-only in this env (no ${VA_13M_TEMPLATE}) — 13m control N/A; see SPEC open question #2`,
        );

        await test.step('CT-01: drive a VA 13m lead to CONTRACT_CREATED', async () => {
          await openVaGowSign13mContract(page, api, ctx, testInfo);
        });

        await test.step('CT-01: selected template is GOWSIGN / VA_2025_SAC', async () => {
          const { esignDoc, template } = await assertSelectedTemplateForLead(
            db,
            Number(ctx.leadPk),
            VA_13M_TEMPLATE,
          );
          expect(esignDoc.client, 'esign_document.client').toBe('GOWSIGN');
          expect(template.name).toBe(VA_13M_TEMPLATE);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // Track A combined — render smoke (CT-04) + sanity reference (CT-05/CT-07) +
    //   full signing (CT-08) on a single fresh VA 13m lead, end to end.
    // ─────────────────────────────────────────────────────────────
    test(
      'VA 13m contract routes GowSign, renders populated (no blank tokens), and signs to SIGNED',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        test.skip(
          !(await va13mGowSignTemplateExists(db)),
          `VA is 16m-only in this env (no ${VA_13M_TEMPLATE}) — Track A GowSign render/sign N/A; see SPEC open question #2`,
        );

        const { frame } = await openVaGowSign13mContract(page, api, ctx, testInfo);
        // Preserve single-newline structure for clause-scoped regexes; collapse only
        // horizontal whitespace.
        const bodyText = (await frame.locator('body').innerText()).replace(/[^\S\n]+/g, ' ');
        const bodyFlat = bodyText.replace(/\s+/g, ' ');
        const bodyNoCommas = bodyFlat.replace(/,/g, '');

        await test.step('CT-04: no raw template tokens reach the customer-visible contract', () => {
          expect(bodyFlat, 'no raw {{token}} should render in the PDF').not.toMatch(/\{\{|\}\}/);
        });

        await test.step('CT-04: money values and brand phone from the backend variables render', async () => {
          const row = await db.queryOne<{ request: string }>(
            "SELECT request::text AS request FROM uown_esign_document WHERE lead_pk=$1 AND client='GOWSIGN' AND request LIKE '{%' ORDER BY pk DESC LIMIT 1",
            [Number(ctx.leadPk)],
          );
          expect(row?.request, 'esign_document.request present').toBeTruthy();
          const vars = (JSON.parse(row!.request).document?.variables ?? {}) as Record<string, string>;

          // Concrete dollar amounts render at all (blank-token / BR-06 regression watch).
          expect(bodyFlat, 'at least one concrete dollar amount renders').toMatch(/\$\s?\d[\d,]*\.\d{2}/);

          // Core money tokens present in every SAC template — value-for-value cross-check.
          for (const k of ['contractAmount', 'costPriceWithFeeNoTax']) {
            const v = String(vars[k] ?? '').replace(/,/g, '');
            expect(v, `variable ${k} present in backend request`).toBeTruthy();
            expect(bodyNoCommas, `rendered contract must show ${k}=${v}`).toContain(v);
          }
          expect(bodyFlat, 'brand phone rendered').toContain(String(vars.companyInfoBrandPhone));
          expect(bodyFlat, 'totalNumberOfPayments rendered').toContain(String(vars.totalNumberOfPayments));
        });

        await test.step('CT-07: VA state anchor + no wrong-state legal leak', () => {
          // The header token is AGREEMENT-VA; the literal word "Virginia" may be
          // absent from the flatten (OH "Ohio" false-negative precedent) — anchor
          // tolerantly on either the state token or "Virginia".
          expect(bodyFlat, 'VA state anchor (AGREEMENT-VA or Virginia)').toMatch(
            /AGREEMENT-VA\b|Virginia/i,
          );
          const leak = bodyFlat.match(WRONG_STATE_LEAK);
          expect(leak, `wrong-state leak found: "${leak?.[0]}"`).toBeNull();
        });

        await test.step('CT-07: reinstatement is the VA-specific 5/21/45, not a sibling window', () => {
          // VA differentiator (state law, common to both 13m/16m terms). The exact
          // canonical wording is not yet frozen (checkpoints [EXPECTED] pending the
          // MCP render); assert the three windows appear in a reinstatement context
          // and guard against the sibling copy-error the SPEC flags.
          expect(bodyFlat, 'reinstatement clause present').toMatch(/reinstate/i);
          expect(bodyFlat, 'VA reinstatement window 5/21/45 days').toMatch(
            /reinstate[\s\S]{0,200}\b5\b[\s\S]{0,120}\b21\b[\s\S]{0,120}\b45\b/i,
          );
          const wrong = bodyFlat.match(WRONG_REINSTATEMENT);
          expect(
            wrong,
            `sibling-state reinstatement window leaked into VA: "${wrong?.[0]}" (VA must be 5/21/45)`,
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
          // capturedCompleted may be false on GowSign even when the backend signs via
          // redirect (testing.md § E-sign routing) — the authoritative signal is the
          // lead_status assertion below, not this postMessage.
        });

        await test.step('CT-08: lead transitions to SIGNED', async () => {
          const status = await waitForLeadStatus(db, Number(ctx.leadPk), 'SIGNED', { timeoutMs: 90_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('CT-08: esign_document is GOWSIGN and signed', async () => {
          let doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          expect(doc, 'esign_document row').toBeTruthy();
          expect(doc!.esignClient).toBe('GOWSIGN');
          const deadline = Date.now() + 60_000;
          while (Date.now() < deadline && (!doc || doc.signedDateTime === null)) {
            await sleep(3_000); // external redirect propagation delay
            doc = await getEsignDocumentByLeadPk(db, Number(ctx.leadPk));
          }
          expect(doc!.signedDateTime, 'doc_signed_time_stamp set after signing').not.toBeNull();
        });

        await test.step('CT-08 / rule #13: activity log records the SIGNED transition', async () => {
          const transitions = await getLeadStatusTransitions(db, Number(ctx.leadPk));
          expect(
            transitions.find((t) => t.to === 'SIGNED'),
            `expected a transition to SIGNED — got ${JSON.stringify(transitions.map((t) => `${t.from}→${t.to}`))}`,
          ).toBeTruthy();
          const signedNote = await findLeadNoteContaining(db, Number(ctx.leadPk), 'SIGNED');
          expect(signedNote, 'a lead note recording the SIGNED transition (rule #13)').not.toBeNull();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // Track B — VA 16m template content (VA_2025_SAC_16_MONTHS).
    //   BLOCKED BY NeuroID on the Kornerstone /complete host — NOT automatable in
    //   CI with current tooling (SPEC open question #1; IL/AL siblings). The 16m
    //   content (CT-02 Item 4, CT-03 Item 4a tail, CT-04 16m tokens, CT-06 EPO
    //   appendix) + CT-08 16m signing are validatable ONLY via MCP-manual render.
    //   test.fixme keeps this visible to qa-validator instead of a silent gap.
    //   Un-fixme once a Kornerstone NeuroID test-bypass lands in qa2/stg.
    // ─────────────────────────────────────────────────────────────
    test.fixme(
      'CT-02/03/04/06: VA 16m template content (VA_2025_SAC_16_MONTHS) — NeuroID-blocked, MCP-manual only',
      async ({ page, ctx, db }) => {
        // Reference implementation sketch for when a NeuroID bypass is available.
        // Route: a Kornerstone ONLINE merchant with VA in valid_states + active 16m
        // program, sendApplication with bankData (TEST_BANK) → ABB EligibleTerms 16 →
        // pick WK16 → /complete CC pre-auth (VISA_APPROVED, cardholder last name ==
        // applicant last name) → reload → "Sign Contract" (NeuroID reload trick,
        // AL BR-07) → Terms → Proceed → read the GowSign iframe body.
        //
        // Then assert (frozen from the MCP-manual render → oracle CT-02..CT-06):
        //   CT-02 Item 4: heading "Promotional-Payoff Option:"; "at any time";
        //     "$ [costPriceWithFeeNoTax] plus tax"; daily lease fees through the
        //     exercise date; late payments void it. MUST NOT: /During the first .* days/,
        //     "This option expires on", "Cash Price of the item(s)",
        //     "You have other purchase options described below", {{epoDays}}/{{epoExpiryDate}}.
        //   CT-03 Item 4a: "must be current to elect EPO"; tail
        //     /[\d,]+ payments of \$\s?[\d.,]+ \(plus tax\)/ +
        //     /\$\s?[\d.,]+ \(including tax\) ?\(including the application fee\)/ +
        //     "Total Cost," + "and you will own the Property"; nextPaymentDueAmount
        //     NON-empty (AL/OH BR-06 regression watch). MUST NOT: /\d+%\s*discount/,
        //     TN-style "plus $ [salesTax] in sales tax" + separate "processing fee".
        //   CT-04: every monetary token non-empty + no {{ }} + logo + cross-check vs
        //     uown_esign_document.request.document.variables + no "variables map
        //     missing" dispatch note.
        //   CT-06 EPO appendix: singular "EARLY PURCHASE OPTION";
        //     "This Agreement has a 16-month term for ownership.";
        //     "For a 16-\n?month lease, the EPO price is calculated as:"; 5 TN bullets;
        //     "call us at [phone]". MUST NOT: plural OPTIONS / Option 1&2 / promo
        //     deadline / sub-points a–e / customer initials; Item 14 (ACH) follows,
        //     single occurrence (no duplicate page).
        //
        // Placeholder so the fixme'd body references its params without side effects.
        void page;
        void ctx;
        void db;
      },
    );
  },
);

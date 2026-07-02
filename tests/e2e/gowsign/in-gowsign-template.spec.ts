/**
 * E2E — Indiana (IN) GowSign Template  (GitLab work item #579,
 * milestone RU07.26.1.54.0 "UOWN | SVC | Add Indiana GowSign Template").
 *
 * Template under test: `IN_2025_SAC_16_MONTHS` (State IN, term 16 months, SAC).
 * SPEC:   docs/taskTestingUown/RU07.26.1.54.0_addInGowSignTemplate_579/RU07.26.1.54.0_addInGowSignTemplate_579-spec.md
 * Oracle: .claude/oracles/in-16m-gowsign-template.md  (CT-01..CT-08 — rule #19)
 * Sibling recipe (same milestone): docs/knowledge-base/illinois-gowsign-template.md (#576)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTOMATION REALITY (inherited S1/architecture blocker from IL #576):
 *
 *   The ONLY route to an IN *16-month* lease is a Kornerstone ONLINE merchant
 *   whose CC pre-auth `/complete` page lives on the `*.kornerstoneliving.com`
 *   host, behind the NeuroID behavioural anti-bot gate. IL #576 proved LIVE
 *   (stg) that BOTH automated entry paths are blocked:
 *     - API `submitApplication` → "Failed to verify identification", no esign
 *       doc row, lead stuck UW_APPROVED (CC auth rolled back).
 *     - Headless browser auto-advance → same gate; the only known workaround
 *       (reload → "Sign Contract") is proven MCP-manual ONLY, no page object.
 *
 *   ⇒ The 16m-SPECIFIC deliverables of #579 — the rendered contract content
 *     (Item 4, Item 4a, singular EARLY PURCHASE OPTION appendix, Indiana body
 *     §1/§6(a)/§7/§14) and the signing ceremony — CANNOT be validated as CI
 *     tests with current tooling. They are marked `test.fixme()` with FULL,
 *     ready bodies (grounded in the oracle checkpoints) so that the moment a stg
 *     NeuroID test-merchant bypass exists, they run unchanged. See SPEC Open
 *     Question 1. Do NOT convert these to a green pass without a real render.
 *
 *   What IS CI-automatable (no NeuroID): the CT-01 routing selection for the IN
 *   13-month negative control via TerraceFinance (UOWN gateway) — see CT-01a.
 *   It is discovery-gated (rule #18): the IN GowSign template inventory is NOT
 *   DB-confirmed this cycle, so the test lists `getGowSignTemplatesForState`
 *   first and skips cleanly if the IN rollout has not landed in the target env.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pre-req: DB reachable for the target env (stg was the IL render env).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  signGowSignInFrame,
  installPostMessageRecorder,
  waitForLeadStatus,
  findLeadNoteContaining,
  getLeadStatusTransitions,
  getGowSignTemplatesForState,
  assertSelectedTemplateForLead,
  getEsignDocumentByLeadAndClient,
  getEsignDocumentByLeadPk,
} from '@helpers/index.js';
import { TEST_CARDS, TEST_BANK } from '@config/constants.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import type { FrameLocator, Page } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import type { ApiClients, TestContext } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';

const IN_16M_TEMPLATE = 'IN_2025_SAC_16_MONTHS';
const IN_13M_TEMPLATE = 'IN_2025_SAC';

const data = {
  state: 'IN',
  // UOWN gateway, ONLINE, non-NeuroID → reaches the 13m template (CT-01 control).
  merchant13m: 'TerraceFinance',
  // Kornerstone ONLINE, IN in valid_states, programs 13m+16m, +bankData → WK16.
  // Its /complete host is NeuroID-gated (blocked in CI — see header).
  merchant16m: 'FifthAveFurnitureNY',
  orderTotal: '900',
};

// ── Discovery (rule #18) ─────────────────────────────────────────────────────
interface InInventory {
  has13m: boolean;
  has16m: boolean;
  names: string[];
}

/** Live IN GowSign template inventory (authoritative over the stale matrix, rule #16). */
async function discoverInInventory(db: DatabaseHelpers): Promise<InInventory> {
  const rows = await getGowSignTemplatesForState(db, data.state);
  const names = rows.map((r) => r.name);
  return {
    has13m: names.includes(IN_13M_TEMPLATE),
    has16m: names.includes(IN_16M_TEMPLATE),
    names,
  };
}

/** Parsed dispatch variables map from `uown_esign_document.request` (appendix-H H.6 cross-check). */
async function readEsignVariables(
  db: DatabaseHelpers,
  leadPk: number,
): Promise<Record<string, string>> {
  const doc = await getEsignDocumentByLeadAndClient(db, leadPk, 'GOWSIGN');
  if (!doc?.request) return {};
  try {
    const parsed = JSON.parse(doc.request) as { document?: { variables?: Record<string, string> } };
    return parsed.document?.variables ?? {};
  } catch {
    return {};
  }
}

/**
 * Drive a fresh IN 16-month Kornerstone lead through CC pre-auth + Terms until
 * the GowSign modal opens, and return the iframe FrameLocator.
 *
 * 🔴 The redirectUrl is the Kornerstone host (`*.kornerstoneliving.com`), whose
 * `/complete` page is NeuroID-gated. In CI this drive does NOT auto-advance —
 * every caller is `test.fixme()`. Kept faithful so it runs unchanged once a
 * NeuroID test-merchant bypass exists (SPEC Open Question 1; IL #576).
 */
async function openIn16mGowSignContract(
  page: Page,
  api: ApiClients,
  ctx: TestContext,
  testInfo: TestInfo,
): Promise<{ frame: FrameLocator }> {
  const { merchant, applicant } = buildTestData({
    state: data.state,
    merchant: data.merchant16m,
    orderTotal: data.orderTotal,
    orderDescription: 'IN 16m GowSign template',
    // Deterministic clean address (avoids the realistic "# <unit>" suffix the
    // backend rejects ~50% of runs — see NY spec BR note).
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  // Kornerstone route: bankData required (else 400) + 16m program override → WK16.
  await createPreQualifiedApplication(
    api,
    merchant,
    applicant,
    ctx,
    {
      skipPaymentInfo: true,
      bankData: { routingNumber: TEST_BANK.DEFAULT_ROUTING, accountNumber: TEST_BANK.DEFAULT_ACCOUNT },
      application: { state: data.state, termMonths: 16 },
    },
    testInfo,
  );

  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

  const details = invoiceResp.body?.paymentDetailsList ?? [];
  // Pick the 16-month plan (WK16); fall back to [0] defensively.
  const plan16 =
    details.find((d) => d.termInMonths === 16 || /16/.test(d.planId ?? '')) ?? details[0];
  const contractUrl = plan16?.redirectUrl ?? '';
  expect(contractUrl, 'IN 16m redirectUrl (WK16) required').toBeTruthy();

  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
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
  await frame
    .getByRole('heading', { name: /CONSUMER LEASE-PURCHASE AGREEMENT-IN/i })
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });

  return { frame };
}

test.describe(
  'RU07.26.1.54.0_addInGowSignTemplate_579 — IN GowSign Template',
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@gowsign', '@priority-high'] },
  () => {
    // ─────────────────────────────────────────────────────────────────────────
    // CT-01a — Routing: IN 13-month negative control (AUTOMATABLE, discovery-gated)
    //
    // Reaches CONTRACT_CREATED via API on TerraceFinance (non-Kornerstone, no
    // NeuroID — cross-cutting DB routing setup, rule #14 exception (b)/(c)), then
    // asserts the esign-document selection is the IN 13m template (GOWSIGN) when
    // it exists, or the documented SIGNWELL fallback if IN has no 13m template.
    // This is CT-01's negative control + the routing half of the ticket. The 16m
    // routing (CT-01b) is NeuroID-blocked below.
    // ─────────────────────────────────────────────────────────────────────────
    test(
      'CT-01a: IN 13m routing selects the Indiana GowSign template (negative control)',
      async ({ page: _page, api, ctx, db }, testInfo) => {
        test.setTimeout(300_000);

        const inv = await test.step('Discovery (rule #18): list live IN GowSign templates', async () => {
          const found = await discoverInInventory(db);
          console.log(`[IN inventory] templates=${JSON.stringify(found.names)}`);
          return found;
        });

        // Open Question 2: whether IN routes GowSign at all this cycle is DB-driven,
        // not asserted from the stale matrix (IN row still reads SIGNWELL, rule #16).
        test.skip(
          !inv.has13m && !inv.has16m,
          `IN has no GowSign template in this env (getGowSignTemplatesForState='IN' → ${JSON.stringify(inv.names)}). ` +
            'IN GowSign rollout not landed here — SPEC Open Question 2.',
        );

        await test.step('Drive an IN 13m lead to CONTRACT_CREATED (TerraceFinance, no NeuroID)', async () => {
          const { merchant, applicant } = buildTestData({
            state: data.state,
            merchant: data.merchant13m,
            orderTotal: data.orderTotal,
            orderDescription: 'IN 13m routing control',
            realistic: false,
            uniqueAddress: true,
          });
          // submitPaymentInfoViaApi → CONTRACT_CREATED (the esign doc is born here,
          // NOT at UW_APPROVED). Merchant preflight runs automatically (rule #12).
          await createPreQualifiedApplication(
            api,
            merchant,
            applicant,
            ctx,
            { submitPaymentInfoViaApi: true },
            testInfo,
          );
          expect(ctx.leadPk, 'leadPk resolved').toBeTruthy();
        });

        const leadPk = Number(ctx.leadPk);

        await test.step('Assert routing selection matches live IN inventory', async () => {
          if (inv.has13m) {
            // IN 13m GowSign template exists → 13m lead must route GOWSIGN.
            const { esignDoc, template } = await assertSelectedTemplateForLead(
              db,
              leadPk,
              IN_13M_TEMPLATE,
            );
            expect(esignDoc.client, 'esign client is GOWSIGN').toBe('GOWSIGN');
            expect(template.name, 'selected template is the IN 13m template').toBe(IN_13M_TEMPLATE);
            // Never a wrong-state or SIGNWELL selection (CT-01 MUST NOT).
            expect(esignDoc.documentName ?? '', 'no wrong-state document_name').not.toMatch(
              /_(AL|OH|NY|IL|TX|CA|FL|VA|TN|MA)_/i,
            );
          } else {
            // IN has only a 16m template (no 13m) → the 13m lead falls back to
            // SIGNWELL. This is a valid, documented negative control (oracle CT-01).
            const doc = await getEsignDocumentByLeadPk(db, leadPk);
            expect(doc, 'esign_document row exists at CONTRACT_CREATED').toBeTruthy();
            expect(
              doc!.esignClient,
              `IN has no 13m GowSign template (${JSON.stringify(inv.names)}) → 13m control expected SIGNWELL fallback`,
            ).toBe('SIGNWELL');
          }
        });

        // Activity log (rule #13): the CONTRACT_CREATED transition must be recorded.
        await test.step('Activity log: CONTRACT_CREATED transition recorded on the lead', async () => {
          const note = await findLeadNoteContaining(db, leadPk, 'CONTRACT_CREATED');
          const transitions = await getLeadStatusTransitions(db, leadPk);
          const reached =
            note !== null || transitions.some((t) => t.to === 'CONTRACT_CREATED');
          expect(
            reached,
            `expected a CONTRACT_CREATED note/transition — got ${JSON.stringify(transitions.map((t) => `${t.from}→${t.to}`))}`,
          ).toBe(true);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // CT-01b — Routing: IN 16m selects IN_2025_SAC_16_MONTHS  [BLOCKED: NeuroID]
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-01b: IN 16m routing selects IN_2025_SAC_16_MONTHS (GOWSIGN) [BLOCKED: NeuroID — SPEC Open Q1]',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        // Reaching the 16m contract requires the Kornerstone host (NeuroID-gated)
        // — this helper cannot auto-advance in CI (IL #576). Kept ready.
        await openIn16mGowSignContract(page, api, ctx, testInfo);

        const leadPk = Number(ctx.leadPk);
        const { esignDoc, template } = await assertSelectedTemplateForLead(
          db,
          leadPk,
          IN_16M_TEMPLATE,
        );
        expect(esignDoc.client, 'esign client is GOWSIGN').toBe('GOWSIGN');
        expect(template.name, 'selected template is the IN 16m template').toBe(IN_16M_TEMPLATE);
      },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // CT-02 / CT-03 / CT-04 — Item 4 + Item 4a + token smoke  [BLOCKED: NeuroID]
    //   Oracle checkpoints for the rendered IN_2025_SAC_16_MONTHS body.
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-02/03/04: Item 4 + Item 4a Lease-Purchase Ownership + token smoke render [BLOCKED: NeuroID]',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { frame } = await openIn16mGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/[^\S\n]+/g, ' ');
        const bodyNoCommas = bodyText.replace(/,/g, '');
        const leadPk = Number(ctx.leadPk);

        await test.step('CT-02 (MUST): Item 4 Promotional-Payoff Option daily-accrual narrative', () => {
          expect(bodyText, 'Item 4 heading').toMatch(/Promotional-Payoff Option:/);
          expect(bodyText, 'buy at any time for costPriceWithFeeNoTax plus tax').toMatch(
            /buy the Property at any time/i,
          );
          expect(bodyText, 'daily lease fees through the exercise date').toMatch(
            /through the date you exercise the Early Purchase Option/i,
          );
          expect(bodyText, 'late payments void the option').toMatch(/void this option/i);
        });

        await test.step('CT-02 (MUST NOT): no day-count promo / expiry / lesser-of-Cash-Price', () => {
          expect(bodyText, 'no day-count promo').not.toMatch(/During the first\s+\d*\s*days/i);
          expect(bodyText, 'no expiry date wording').not.toMatch(/This option expires on/i);
          expect(bodyText, 'no other-purchase-options wording').not.toMatch(
            /You have other purchase options described below/i,
          );
          expect(bodyText, 'no epoDays/epoExpiryDate tokens').not.toMatch(
            /\{\{\s*(epoDays|epoExpiryDate)\s*\}\}/i,
          );
        });

        await test.step('CT-03 (MUST): Item 4a ownership tail (nextPaymentDueAmount + application fee)', () => {
          expect(bodyText, 'payments-of tail').toMatch(
            /[\d,]+ payments of \$\s?[\d.,]+\s*\(plus tax\)/i,
          );
          expect(bodyText, 'including the application fee').toMatch(/\(including the application fee\)/i);
          expect(bodyText, 'Total Cost').toMatch(/Total Cost/i);
          expect(bodyText, 'and you will own the Property').toMatch(/and you will own the Property/i);
        });

        await test.step('CT-03 (MUST NOT): no discount % / firstPaymentDueAmount / separate salesTax line', () => {
          expect(bodyText, 'no % discount clause').not.toMatch(/\d+%\s*discount/i);
          expect(bodyText, 'no firstPaymentDueAmount token').not.toMatch(
            /\{\{\s*firstPaymentDueAmount\s*\}\}/i,
          );
          expect(bodyText, 'no separate sales-tax line').not.toMatch(/plus \$\s?[\d.,]+ in sales tax/i);
        });

        await test.step('CT-04: tokens resolve — non-empty, zero {{ }}, money cross-checks dispatch', async () => {
          expect(bodyText, 'no raw {{token}} reaches the customer PDF').not.toMatch(/\{\{|\}\}/);

          const vars = await readEsignVariables(db, leadPk);
          // nextPaymentDueAmount is the AL/OH migration-regression watch — must be non-empty.
          expect(String(vars.nextPaymentDueAmount ?? ''), 'nextPaymentDueAmount non-empty').not.toBe('');
          for (const k of ['costPriceWithFeeNoTax', 'nextPaymentDueAmount', 'contractAmount']) {
            const v = String(vars[k] ?? '').replace(/,/g, '');
            expect(v, `dispatch variable ${k} present`).toBeTruthy();
            expect(bodyNoCommas, `rendered contract must show ${k}=${v}`).toContain(v);
          }
          expect(bodyText, 'brand phone rendered').toContain(String(vars.companyInfoBrandPhone ?? ''));
          // Logo present at top.
          await expect(frame.locator('img').first()).toBeVisible();
          // No dispatch "variables map missing" note for this lead (rule #13 negative).
          const missing = await findLeadNoteContaining(db, leadPk, 'variables map missing');
          expect(missing, 'no "variables map missing" dispatch note').toBeNull();
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // CT-05 — Singular EARLY PURCHASE OPTION appendix + plan footnote  [BLOCKED: NeuroID]
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-05: singular EARLY PURCHASE OPTION appendix + "*with a Promotional Payoff option" footnote [BLOCKED: NeuroID]',
      async ({ page, api, ctx }, testInfo) => {
        test.setTimeout(420_000);

        const { frame } = await openIn16mGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/[^\S\n]+/g, ' ');

        await test.step('CT-05 (MUST): singular appendix + 5-bullet formula + call phone', () => {
          expect(bodyText, 'singular EARLY PURCHASE OPTION heading').toMatch(
            /EARLY PURCHASE OPTION(?!S)/,
          );
          // "16-month" may carry a line break (OH lesson: `16-\nmonth`).
          expect(bodyText, '16-month term for ownership').toMatch(/16-\s*month/i);
          expect(bodyText, 'purchase at any time').toMatch(/purchase the Property at any time/i);
          expect(bodyText, 'accrued daily lease fees through the exercise date').toMatch(
            /through the date you exercise/i,
          );
          expect(bodyText, 'call to exercise').toMatch(/To exercise this option, you must call us at/i);
        });

        await test.step('CT-05: lease-plan footnote "*with a Promotional Payoff option"', () => {
          expect(bodyText, 'plan footnote').toMatch(/\*with a Promotional Payoff option/i);
        });

        await test.step('CT-05 (MUST NOT): not the plural dual-option page', () => {
          expect(bodyText, 'no plural EARLY PURCHASE OPTIONS').not.toMatch(/EARLY PURCHASE OPTIONS/);
          expect(bodyText, 'no numbered Option 1/2').not.toMatch(/Option\s+[12]\b/);
          expect(bodyText, 'no dual-option payoff tokens').not.toMatch(
            /\{\{\s*(payOffAmountBeforeEPOExpiry|payOffStartDateAfterEpoExpiry)\s*\}\}/i,
          );
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // CT-06 — Indiana state-specific body (§1/§6(a)/§7/§14 + brackets)  [BLOCKED: NeuroID]
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-06: Indiana state-specific body §1/§6(a) dynamic nsfFee/§7 120-day/§14 red ACH labels [BLOCKED: NeuroID]',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { frame } = await openIn16mGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/[^\S\n]+/g, ' ');
        const bodyNoCommas = bodyText.replace(/,/g, '');
        const leadPk = Number(ctx.leadPk);

        await test.step('CT-06 (MUST): Indiana header + §1 delivery-fee footnote + §7 120-day', () => {
          // Anchor on AGREEMENT-IN, NOT the word "Indiana" (OH-flatten lesson).
          expect(bodyText, 'Indiana header').toMatch(/CONSUMER LEASE-PURCHASE AGREEMENT-IN/i);
          expect(bodyText, 'lessee-should-read line').toMatch(
            /Lessee should read the contract in its entirety/i,
          );
          expect(bodyText, '§1 delivery-fee footnote').toMatch(/\(\*\)\s*Total delivery fee/i);
          expect(bodyText, '§7 120-day reinstatement').toMatch(/120 days/i);
        });

        await test.step('CT-06: §6(a) declined charge is the DYNAMIC nsfFee value, not hardcoded $15.00', async () => {
          // Assert the configured (dynamic) NSF fee value renders — sourced from the
          // dispatch variables, never a hardcoded literal (SPEC §6(a) note; nsf-fee
          // business rule / 05-pagamentos.md).
          const vars = await readEsignVariables(db, leadPk);
          const nsf = String(vars.nsfFee ?? '').replace(/,/g, '');
          expect(nsf, 'nsfFee dispatch variable present (dynamic config value)').toBeTruthy();
          expect(bodyNoCommas, `§6(a) shows the dynamic nsfFee value (${nsf})`).toContain(nsf);
          expect(bodyText, 'no literal {{nsfFee}} token').not.toMatch(/\{\{\s*nsfFee\s*\}\}/i);
          expect(bodyText, 'no hardcoded $15.00 NSF leftover').not.toContain('$15.00');
        });

        await test.step('CT-06 (MUST): pre-auth + consent brackets visible', () => {
          expect(bodyText, 'pre-auth forgo-debit brackets').toMatch(
            /\[late\/delinquency\/reinstatement\]/i,
          );
          expect(bodyText, 'consent [Click Here] brackets').toMatch(/\[Click Here\]/i);
        });

        await test.step('CT-06 (MUST): §14 ACH labels render in RED (computed style, not text)', async () => {
          // Color is a visual affordance (rule #14) — assert the computed color,
          // never mere string presence. Anchor on the label text, read its color.
          for (const label of ['CHANGE OF INFORMATION', 'RETURNS', 'CANCELLATION']) {
            const el = frame.getByText(label, { exact: false }).first();
            await el.waitFor({ state: 'visible', timeout: 10_000 });
            const color = await el.evaluate((node) => getComputedStyle(node as Element).color);
            // rgb/rgba red family: high R, low G/B.
            const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            expect(m, `§14 label "${label}" has a parseable rgb color (${color})`).not.toBeNull();
            if (m) {
              const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
              expect(r, `§14 label "${label}" is red (r>g,b): ${color}`).toBeGreaterThan(g);
              expect(r, `§14 label "${label}" is red (r>b): ${color}`).toBeGreaterThan(b);
            }
          }
        });

        await test.step('CT-06 (MUST NOT): no wrong-state header / 60-day / *(*) footnote', () => {
          expect(bodyText, 'no 60-day reinstatement').not.toMatch(/60 days/i);
          expect(bodyText, 'no *(*) delivery footnote form').not.toMatch(/\*\(\*\)/);
          expect(bodyText, 'no wrong-state AGREEMENT header').not.toMatch(
            /AGREEMENT-(AL|OH|NY|IL|TX|CA|FL|VA|TN|MA)\b/i,
          );
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────────
    // CT-08 — Signing completes + activity log (rule #13)  [BLOCKED: NeuroID]
    // ─────────────────────────────────────────────────────────────────────────
    test.fixme(
      'CT-08: signing completes → lead SIGNED + activity log (rule #13) [BLOCKED: NeuroID]',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { frame } = await openIn16mGowSignContract(page, api, ctx, testInfo);
        const leadPk = Number(ctx.leadPk);

        await test.step('Complete the GowSign signing ceremony', async () => {
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start clicked').toBe(true);
          expect(result.signClicked, 'final Sign clicked').toBe(true);
          expect(result.capturedCompleted, 'document reached "completed"').toBe(true);
        });

        await test.step('lead transitions to SIGNED', async () => {
          const status = await waitForLeadStatus(db, leadPk, 'SIGNED', { timeoutMs: 90_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('esign_document is GOWSIGN and signed (doc_signed_time_stamp set)', async () => {
          const doc = await getEsignDocumentByLeadPk(db, leadPk);
          expect(doc, 'esign_document row').toBeTruthy();
          expect(doc!.esignClient, 'GOWSIGN').toBe('GOWSIGN');
          expect(doc!.signedDateTime, 'doc_signed_time_stamp set after signing').not.toBeNull();
        });

        await test.step('Activity log (rule #13): signing notes present', async () => {
          const signed = await findLeadNoteContaining(db, leadPk, '[ContractService]');
          expect(signed, '[ContractService] signing note').not.toBeNull();
          const redirect = await findLeadNoteContaining(db, leadPk, '[EsignRedirectService][updateSignStatus]');
          expect(redirect, '[EsignRedirectService][updateSignStatus] note').not.toBeNull();
          const ccConsent = await findLeadNoteContaining(db, leadPk, '[ESIGNSERVICE][parseCCPeekConsent]');
          expect(ccConsent, '[ESIGNSERVICE][parseCCPeekConsent] note').not.toBeNull();
        });
      },
    );
  },
);

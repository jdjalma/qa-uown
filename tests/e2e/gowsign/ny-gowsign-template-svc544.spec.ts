/**
 * E2E qa2 — New York GowSign Template (svc#544)
 *
 * Covers the acceptance criteria of GitLab uown/backend/svc#544
 * "UOWN | SVC | Add New York GowSign Template" (Signwell → GowSign migration, NY).
 *
 *   AC-01 / Scenario 1  — contract signing flow + template rendering + signing completion
 *   AC-03 / AC-04       — calculated values / dynamic data populated (+ no raw placeholders)
 *   Scenario 4          — state validation: NY-scoped title, no wrong-state leak
 *
 * Routing recipe (see docs/knowledge-base/new-york-gowsign-template-svc544.md):
 *   TireAgent (OW90218-0001, ONLINE) + customer state NY + 13m → GowSign template
 *   NY_2025_SAC (qa2 only; NY has no 16m template). Signing ceremony driven by the
 *   shared `signGowSignInFrame` helper (Start → adopt → Sign All → confirmation-dialog Finish).
 *
 * Pre-req: DB tunnel qa2 active.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/index.js';
import { TEST_CARDS } from '@config/constants.js';
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
import { sleep } from '@helpers/common.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import type { FrameLocator, Page } from '@playwright/test';

const data = { state: 'NY', merchant: 'TireAgent', orderTotal: '900' };

// Other US states whose presence in an NY contract body would be a wrong-state
// legal leak. Florida is intentionally EXCLUDED — it is the Lessor's domicile/
// forum boilerplate ("Tampa, FL"), expected in every contract (svc#544 BR-01).
const WRONG_STATE_LEAK = /\b(Texas|Ohio|California|Alabama|Georgia|Pennsylvania|Louisiana|North Carolina)\b/;

/**
 * AC-02 / Scenario 3 baseline — content invariants of the legacy Signwell NY
 * contract (`NY_SAC_LEASE_AGREEMENT` v110, "Lease Agreement.docx"). Each string
 * was confirmed present in BOTH the parsed Signwell DOCX and the rendered GowSign
 * `NY_2025_SAC` contract during svc#544 discovery (see
 * docs/knowledge-base/new-york-gowsign-template-svc544.md "Content Parity").
 * Asserting GowSign contains all of them = "GowSign follows the same patterns and
 * text used in Signwell".
 */
const SIGNWELL_NY_BASELINE = [
  'PROPERTY PRICE TAG',
  'TOTAL OF PAYMENTS',
  'COST OF LEASE',
  'CASH PRICE',
  'Description of the Property',
  'Promotional Payoff Option',
  'EARLY PURCHASE OPTIONS',
  'Early Purchase Option',
  'Returned Payment',
  'Late Fee',
  'Reinstatement',
  'ACH Payment Authorization',
  'Income Interruption Rights',
  'Electronic Signatures',
  'Mollie, LLC',
];

/** Drive a fresh NY 13m lead through CC pre-auth + Terms until the GowSign modal opens. */
async function openNyGowSignContract(
  page: Page,
  api: import('@helpers/api-setup.helpers.js').ApiClients,
  ctx: import('@fixtures/test-context.fixture.js').TestContext,
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ frame: FrameLocator; applicant: { firstName: string; lastName: string } }> {
  const { merchant, applicant } = buildTestData({
    state: data.state,
    merchant: data.merchant,
    orderTotal: data.orderTotal,
    orderDescription: 'svc#544 NY GowSign template',
    // Deterministic clean address: realistic mode (default) randomly appends a
    // "# <unit>" suffix that the backend rejects ("mainAddress1 must match the
    // required address format") ~50% of runs. Static per-state base + "Unit <id>"
    // suffix is valid and blacklist-immune.
    realistic: false,
    uniqueAddress: true,
  });

  await installPostMessageRecorder(page);

  await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'redirectUrl required').toBeTruthy();

  await page.goto(contractUrl);
  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  // cardholder last name MUST equal the applicant last name (svc#544 BR-02).
  // Card: the canonical approved Mastercard (TEST_CARDS.MASTERCARD_APPROVED, BIN 5500)
  // — the raw Visa 4111… is rejected by the qa2 pre-auth gateway ("Invalid card.")
  // per the application-lifecycle rule ("use MASTERCARD_APPROVED, never raw Visa in qa").
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
  // Wait for the contract body to render its NY title heading
  await frame
    .getByRole('heading', { name: /CONSUMER RENTAL-PURCHASE AGREEMENT-NY/i })
    .first()
    .waitFor({ state: 'visible', timeout: 30_000 });

  return { frame, applicant };
}

test.describe(
  'svc#544 NY GowSign Template',
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-high'] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // Scenario 4 (state) + AC-01 + AC-04 (no raw placeholders) + Scenario 1
    //   (rendering + signing completion). Single fresh lead, end to end.
    // ─────────────────────────────────────────────────────────────
    test(
      'NY contract is state-scoped, populated, and signs to completion',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { frame } = await openNyGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');

        await test.step('Scenario 4: title is the NY consumer rental-purchase agreement', async () => {
          await expect(
            frame.getByRole('heading', { name: /CONSUMER RENTAL-PURCHASE AGREEMENT-NY/i }).first(),
          ).toBeVisible();
          expect(bodyText, 'lessee located in New York, NY').toMatch(/New York,\s*NY/i);
        });

        await test.step('Scenario 4: no wrong-state legal leak (Florida = Lessor domicile is allowed)', () => {
          const leak = bodyText.match(WRONG_STATE_LEAK);
          expect(leak, `wrong-state leak found: "${leak?.[0]}"`).toBeNull();
        });

        await test.step('AC-04: no raw template tokens / broken placeholders in the rendered contract', () => {
          expect(bodyText, 'no raw {{token}} should reach the customer-visible PDF').not.toMatch(/\{\{|\}\}/);
        });

        await test.step('AC-03/AC-04: parties, items and money values are populated', () => {
          expect(bodyText, 'Lessor party').toMatch(/Mollie,\s*LLC/i);
          expect(bodyText, 'leased items rendered').toMatch(/Seating:/i);
          expect(bodyText, 'concrete dollar amounts rendered').toMatch(/\$\s?\d[\d,]*\.\d{2}/);
          expect(bodyText, 'brand phone rendered').toContain('(877)357-5474');
          expect(bodyText, 'EARLY PURCHASE OPTIONS section present').toMatch(/EARLY PURCHASE OPTIONS/i);
        });

        await test.step('AC-01 / Scenario 1: complete the GowSign signing ceremony', async () => {
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start clicked').toBe(true);
          expect(result.signClicked, 'final Sign clicked').toBe(true);
          expect(result.capturedCompleted, 'document reached "completed"').toBe(true);
        });

        await test.step('AC-01: lead transitions to SIGNED', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 90_000 });
          expect(status).toBe('SIGNED');
        });

        await test.step('AC-01: esign_document is GOWSIGN/NY_2025_SAC and signed', async () => {
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

        await test.step('Activity log (rule #13): signing transition recorded on the lead', async () => {
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
    // AC-02 / Scenario 3 — content parity vs the Signwell NY baseline.
    // AC-03 / AC-04 — every calculated value from the backend variables map
    //   (uown_esign_document.request) actually renders in the contract.
    // ─────────────────────────────────────────────────────────────
    test(
      'AC-02/AC-03: content matches Signwell baseline + every backend value renders',
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(300_000);

        const { frame } = await openNyGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/\s+/g, ' ');
        const bodyNoCommas = bodyText.replace(/,/g, '');

        await test.step('AC-02 / Scenario 3: GowSign carries the Signwell NY content baseline', () => {
          expect(bodyText, 'NY rental-purchase title (parity with Signwell)').toMatch(
            /RENTAL-PURCHASE AGREEMENT-NY/i,
          );
          for (const clause of SIGNWELL_NY_BASELINE) {
            expect(bodyText, `Signwell-baseline clause missing from GowSign: "${clause}"`).toContain(clause);
          }
        });

        await test.step('AC-03/AC-04: every key calculated value from the backend renders', async () => {
          const row = await db.queryOne<{ request: string }>(
            'SELECT request::text AS request FROM uown_esign_document WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1',
            [Number(ctx.leadPk)],
          );
          expect(row?.request, 'esign_document.request present').toBeTruthy();
          const vars = (JSON.parse(row!.request).document?.variables ?? {}) as Record<string, string>;

          // Money values the customer must see — each confirmed renderable in
          // both providers (svc#544 Content Parity). Compared against the exact
          // value the backend computed for THIS lead, so it is value-for-value.
          const MONEY_KEYS = [
            'contractAmount', 'costPrice', 'costPriceWithFeeNoTax', 'costOfLease',
            'salesTax', 'processingFee', 'nextPaymentDueAmountWithTax',
            'firstPaymentDueAmount', 'payOffAmountBeforeEPOExpiry',
          ];
          for (const k of MONEY_KEYS) {
            const v = String(vars[k] ?? '').replace(/,/g, '');
            expect(v, `variable ${k} present in backend request`).toBeTruthy();
            expect(bodyNoCommas, `rendered contract must show ${k}=${v}`).toContain(v);
          }
          for (const k of ['totalNumberOfPayments', 'numOfMonths']) {
            expect(bodyText, `rendered contract must show ${k}=${vars[k]}`).toContain(String(vars[k]));
          }
          expect(bodyText, 'brand phone rendered').toContain(String(vars.companyInfoBrandPhone));
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // AC-03 / AC-04 — the Promotional-Payoff "Early Purchase Option" window
    //   must render its DAY COUNT (the `epoDays` template token).
    //
    // BR-06 history: this was a confirmed migration regression — the backend
    //   did NOT supply `epoDays` (`[DocumentDispatchService][GowSign] … missing
    //   … [epoDays]`), so the sentence rendered "within  days" (blank) where
    //   Signwell renders "within 90 days". FIXED in qa2 for R1.53.0
    //   (verified 2026-06-21: fresh NY lead 16812 carries `epoDays="90"` in the
    //   variables map and the missing-token log is gone). The guard is now a
    //   positive regression assertion — if it ever blanks again, this fails red.
    // ─────────────────────────────────────────────────────────────
    test(
      'AC-03/AC-04: EPO Promotional-Payoff renders the number of days (epoDays, BR-06 fixed)',
      async ({ page, api, ctx }, testInfo) => {
        test.setTimeout(300_000);

        const { frame } = await openNyGowSignContract(page, api, ctx, testInfo);
        const bodyText = (await frame.locator('body').innerText()).replace(/[^\S\n]+/g, ' ');

        // Target the EPO Promotional-Payoff sentences SPECIFICALLY (not the Late-Fee
        // clause "within 7 days if you pay monthly", which is a different context).
        // Correct: "Purchase the Property within <N> days from the date that your
        // Initial Payment…" / "During the first <N> days from the date of your Initial
        // Payment". Current bug: the number is blank.
        const epoWithNumber =
          /Purchase the Property within\s+\d+\s+days/i.test(bodyText) ||
          /During the first\s+\d+\s+days from the date of your Initial Payment/i.test(bodyText);
        expect(
          epoWithNumber,
          'EPO Promotional-Payoff must state a concrete number of days (epoDays token)',
        ).toBe(true);
      },
    );
  },
);

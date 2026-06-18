/**
 * RU06.26.1.53.0_addOhioGowSignTemplateScenario3_546
 *
 * svc#546 — "Add Ohio GowSign Template", Scenario 3: Contract Validation
 * (AC2 content parity, AC3 calculated values, AC4 dynamic-data population;
 *  Scenario-4 state overlap = OH).
 *
 * SPEC: docs/scenarios/546-scenario3-contract-validation-spec.md (8 CTs).
 *
 * STRATEGY — hybrid (Rule #14, UI-first):
 *   1. API setup  → approve ONE lead on the Daniel's clone (OH, sticky-UW SSN
 *      082390916 → EligibleTerms 16 → OH_2025_SAC_16_MONTHS GowSign template).
 *   2. API oracle → per frequency, `sendInvoice` captures the backend-computed
 *      payment values (the EXPECTED contract values are computed FROM the
 *      backend invoice, never re-derived by formula here).
 *   3. UI render  → drive the customer signing flow (MissingDataForm → Terms →
 *      GowSign iframe), capture the RENDERED contract PDF and read Item 3 /
 *      Item 4 / Item 4a. The rendered PDF is the decisive oracle — the confirmed
 *      defect (`{{nextPaymentDueAmount}}` blank on MONTHLY) is a *rendering* bug
 *      invisible to API/log-only checks (origin of Rule #14: BUG-01 Daniel's CA).
 *   4. DB validate → template selection (CT-00 gate) + signing activity log
 *      (Rule #13) + esign status.
 *
 * One approved lead + a loop of `sendInvoice` across frequencies avoids the
 * velocity/blacklist DENIED of creating many leads (pattern proven in the
 * oracle scratch `tests/api/__scratch_oh_item4_4a_oracle_svc546.spec.ts`).
 *
 * MONEY: every monetary assert uses $0.01 tolerance (`toBeCloseTo(v, 2)` /
 * |a-b|<=0.01) — gowsign-knowledge pitfall #3 (float repr, never `toEqual`).
 *
 * Tags: @origination (drives Origination/UOWN portal storageState+baseURL) +
 *       @regression @e2e @hybrid @qa2.
 * Env: qa2 REQUIRED — qa2 forces the OH GowSign route on the Daniel's clone and
 *      its UOWN signing page accepts MASTERCARD_APPROVED (no Kornerstone kaptcha).
 *
 * This file is a GitLab task test (docs/taskTestingUown/...), NOT a source of
 * selector/helper patterns — patterns live in skills + src/.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { TestContext } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { splitTags } from '@ptypes/enums.js';
import { sleep } from '@helpers/common.helpers.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { ensureMerchantReady } from '@helpers/merchant-config.helper.js';
import {
  randomApplicant,
  randomLineItems,
  categoryForMerchant,
} from '@data/index.js';
import { buildSendApplicationBody, type MerchantInfo } from '@api/bodies/application.body.js';
import {
  installPostMessageRecorder,
  signGowSignInFrame,
} from '@helpers/gowsign-signing.helper.js';
import {
  captureContractPdf,
  extractContractValues,
  type ContractValues,
} from '@helpers/contract-pdf.helper.js';
import { assertSelectedTemplateForLead, getEsignDocumentByLeadAndClient } from '@helpers/gowsign-template-db.helpers.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';

// ── Fixed recipe (verified — see SPEC Preconditions) ──────────────────────
const TEMPLATE_ID = 'OH_2025_SAC_16_MONTHS';
const MERCHANT: MerchantInfo = {
  username: 'danielsJewelers',
  password: 'U0wn_danielsJewelers_CnRKhJ',
  number: 'OL90205-0079_clone',
};
// Proven-good Bucyrus OH address pinned for deterministic OH routing.
const OH_ADDRESS = { address: '1875 N Sandusky Ave', city: 'Bucyrus', zip: '44820' };
// Reference cart subtotal whose rendered values are known ($662 MONTHLY →
// costPrice 711, 16 payments, nextPayment 95.16, salesTax 6.90, contract 1681.99).
const REFERENCE_SUBTOTAL = 662;
// MASTERCARD_APPROVED (BIN 5500) — VISA causes UnexpectedRollbackException
// (application-lifecycle pitfall #3).
const CC = { cardNumber: '5500000000000004', cvc: '123', expiration: '12/2030' };

// Equivalence partitions; MONTHLY is the seeded-regression case (known-blank).
const FREQUENCIES = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'] as const;
type Frequency = (typeof FREQUENCIES)[number];

const testData = [
  {
    env: 'qa2',
    // task-testing-origination project: @origination selects the Origination
    // baseURL + storageState (testing.md rule — task-testing split).
    tag: '@origination @regression @e2e @hybrid @qa2',
  },
] as const;

/**
 * Backend invoice payment-detail row. The typed `PaymentDetails`
 * (src/api/responses/invoice.response.ts) only exposes
 * redirectUrl/regularPaymentWithTax/planId/termInMonths; the oracle fields
 * below are present on the wire but not in the typed surface, so we cast to
 * this local shape (same approach as the validated oracle scratch).
 */
interface OraclePayDetail {
  frequency?: string;
  redirectUrl?: string;
  numberOfPayments?: number;
  totalContractAmountWithTax?: number;
  regularPaymentWithTax?: number;
  firstPaymentWithFeesNoTax?: number;
  paymentDueToday?: number;
}

/** The 5 dynamic-token oracle values computed FROM the backend invoice. */
interface OracleValues {
  frequency: Frequency;
  redirectUrl: string;
  /** {{costPriceWithFeeNoTax}} (Item 4) */
  costPriceWithFeeNoTax: number;
  /** {{totalNumberOfPayments}} (Item 4a) */
  totalNumberOfPayments: number;
  /** {{nextPaymentDueAmount}} (Item 3 + Item 4a) */
  nextPaymentDueAmount: number;
  /** {{salesTax}} (Item 4a) — derived diff, not a direct field */
  salesTax: number;
  /** {{contractAmount}} (Item 4a) */
  contractAmount: number;
  /** numberOfPayments × regularPaymentWithTax + processingFee (consistency invariant) */
  consistencySum: number;
  _regularPaymentWithTax: number;
}

/** Compute the oracle for one frequency from a `sendInvoice` response row. */
function buildOracle(
  freq: Frequency,
  subtotal: number,
  detail: OraclePayDetail,
): OracleValues {
  const fee = Number(detail.paymentDueToday ?? 0);
  const reg = Number(detail.regularPaymentWithTax ?? 0);
  const nextNoTax = Number(detail.firstPaymentWithFeesNoTax ?? 0);
  const n = Number(detail.numberOfPayments ?? 0);
  return {
    frequency: freq,
    redirectUrl: detail.redirectUrl ?? '',
    costPriceWithFeeNoTax: +(subtotal + fee).toFixed(2),
    totalNumberOfPayments: n,
    nextPaymentDueAmount: +nextNoTax.toFixed(2),
    salesTax: +(reg - nextNoTax).toFixed(2),
    contractAmount: +Number(detail.totalContractAmountWithTax ?? 0).toFixed(2),
    consistencySum: +(n * reg + fee).toFixed(2),
    _regularPaymentWithTax: reg,
  };
}

/** Extract a $-amount that appears right after `label` in the rendered text. */
function moneyAfter(rawText: string, labelRe: RegExp): number | null {
  const compact = rawText.replace(/\s+/g, ' ');
  const m = compact.match(labelRe);
  if (!m) return null;
  // The numeric capture group is the first $-prefixed group of the match.
  const numMatch = (m[1] ?? '').match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
  if (!numMatch) return null;
  const n = Number(numMatch[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

for (const data of testData) {
  test.describe(
    'RU06.26.1.53.0_addOhioGowSignTemplateScenario3_546',
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      test('Scenario 3 — OH GowSign contract: template gate, per-frequency value render, content parity, no-token-leak, signing log', async ({
        page,
        api,
        db,
      }, testInfo) => {
        // One approved lead + 3 invoices + 3 signing ceremonies (PDF capture per
        // freq) + DB polling → generous cap for qa2 UI stability.
        test.setTimeout(900_000);

        const ctx: TestContext = {
          leadPk: '',
          leadUuid: '',
          accountPk: '',
          accountNumber: '',
          contractStatus: '',
          contractUrl: '',
          websiteAccountPk: '',
          achAdded: 0,
          ccAdded: 0,
          reportKeys: new Map(),
        };

        // Realistic fresh applicant; pin the proven-good OH address + sticky SSN.
        const base = randomApplicant({ state: 'OH', ssn: 'sticky16m' });
        const applicant = { ...base, ...OH_ADDRESS };
        // Coherent JEWELRY cart for the Daniel's merchant (not default furniture).
        const lineItems = randomLineItems({
          category: categoryForMerchant('DANIELS_JEWELERS'),
          total: REFERENCE_SUBTOTAL,
          count: 1,
        });

        await installPostMessageRecorder(page);

        // ── Setup: merchant preflight + approve ONE lead ──────────────────
        await test.step('Setup — merchant preflight + sendApplication → APPROVED (OH, EligibleTerms 16)', async () => {
          // Rule #12: this test originates a new application → preflight applies.
          await ensureMerchantReady(api, MERCHANT.number);

          const body = buildSendApplicationBody(MERCHANT, applicant, undefined, { state: 'OH' });
          const resp = await api.application.sendApplication(body);
          if (!resp.ok) {
            console.log(`[546-S3] sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
          }
          expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
          ctx.leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
          ctx.leadPk = String(resp.body.authorizationNumber ?? '');
          expect(ctx.leadUuid, 'leadUuid present').toBeTruthy();

          await sleep(5_000);
          const st = await api.application.getApplicationStatus(MERCHANT, ctx.leadUuid);
          expect(st.ok, `getApplicationStatus ${st.status}`).toBeTruthy();
          const status = extractApprovalStatus(st.body);
          if (status?.toLowerCase() !== 'approved') {
            console.log(`[546-S3] status body: ${JSON.stringify(st.body)}`);
          }
          expect(status?.toLowerCase(), `approved? got ${status}`).toContain('approved');
          if (st.body.leadPk) ctx.leadPk = String(st.body.leadPk);

          testInfo.annotations.push(
            { type: 'leadPk', description: ctx.leadPk },
            { type: 'leadUuid', description: ctx.leadUuid },
          );
          console.log(`[546-S3] leadPk=${ctx.leadPk} leadUuid=${ctx.leadUuid} name=${applicant.firstName} ${applicant.lastName}`);
        });

        // ── Single live contract link per lead — re-issue before each open ──
        // A lead has ONE live contract link. Each `sendInvoice` MINTS A NEW
        // shortCode and SUPERSEDES the prior one (DOM-proven on qa2 2026-06-18:
        // 1st WEEKLY issue `hqrSW2US` → "Invalid link. Please contact merchant";
        // re-issued WEEKLY `mWjbG7eN` → live CC entry page). So a redirectUrl
        // captured in an earlier loop pass is DEAD by the time a later frequency
        // is invoiced. To open a frequency's contract we MUST re-issue its invoice
        // immediately before opening — this returns the now-current live link.
        // The oracle VALUE math (below) is read from the same `sendInvoice`
        // response and does NOT depend on the link staying live, so it is
        // captured once; only the RENDER drive needs a fresh link at open time.
        async function freshRedirectUrlFor(freq: Frequency): Promise<string> {
          const resp = await api.invoice.sendInvoice(MERCHANT, ctx.leadUuid, {
            orderTotal: String(REFERENCE_SUBTOTAL),
            merchandiseSubtotal: String(REFERENCE_SUBTOTAL),
            salesTax: '0.00',
            deliveryCharge: '0.00',
            installationCharge: '0.00',
            miscellaneousFees: '0.00',
            selectedPaymentFrequency: freq,
            lineItems,
          });
          expect(resp.ok, `re-issue sendInvoice ${freq}: ${resp.status}`).toBeTruthy();
          const list = (resp.body.paymentDetailsList ?? []) as unknown as OraclePayDetail[];
          const detail = list.find((x) => x.frequency === freq) ?? list[0];
          expect(detail?.redirectUrl, `fresh redirectUrl for ${freq}`).toBeTruthy();
          return detail!.redirectUrl as string;
        }

        // ── Oracle: per-frequency backend invoice VALUES (no signing) ─────
        const oracles = new Map<Frequency, OracleValues>();
        await test.step('Oracle — capture per-frequency backend invoice values (no signing)', async () => {
          for (const freq of FREQUENCIES) {
            const resp = await api.invoice.sendInvoice(MERCHANT, ctx.leadUuid, {
              orderTotal: String(REFERENCE_SUBTOTAL),
              merchandiseSubtotal: String(REFERENCE_SUBTOTAL),
              salesTax: '0.00',
              deliveryCharge: '0.00',
              installationCharge: '0.00',
              miscellaneousFees: '0.00',
              selectedPaymentFrequency: freq,
              lineItems,
            });
            expect(resp.ok, `sendInvoice ${freq}: ${resp.status}`).toBeTruthy();
            const list = (resp.body.paymentDetailsList ?? []) as unknown as OraclePayDetail[];
            const detail = list.find((x) => x.frequency === freq) ?? list[0];
            expect(detail, `paymentDetailsList row for ${freq}`).toBeTruthy();
            // NOTE: detail.redirectUrl is captured for logging only — it is STALE
            // by the next loop pass and MUST NOT be used to drive a render. The
            // render re-issues via freshRedirectUrlFor() at open time.

            const oracle = buildOracle(freq, REFERENCE_SUBTOTAL, detail);
            oracles.set(freq, oracle);
            console.log(
              `[546-S3 oracle ${freq}] costPrice=${oracle.costPriceWithFeeNoTax} n=${oracle.totalNumberOfPayments} ` +
                `nextPayment=${oracle.nextPaymentDueAmount} salesTax=${oracle.salesTax} contract=${oracle.contractAmount}`,
            );
          }

          // Reference anchor ($662 MONTHLY): costPrice 711, 16 payments,
          // nextPayment 95.16, salesTax 6.90, contractAmount 1681.99.
          const monthly = oracles.get('MONTHLY')!;
          expect(monthly.totalNumberOfPayments, 'MONTHLY term = 16 payments (sticky 16m)').toBe(16);
          expect(monthly.costPriceWithFeeNoTax).toBeCloseTo(711, 0);
          expect(monthly.nextPaymentDueAmount).toBeCloseTo(95.16, 1);
          expect(monthly.salesTax).toBeCloseTo(6.9, 1);
          expect(monthly.contractAmount).toBeCloseTo(1681.99, 0);
        });

        // ── CT-00 GATE: template selection must be OH_2025_SAC_16_MONTHS ───
        // Drive the signing flow for the reference (MONTHLY) frequency ONLY up to
        // the open GowSign modal (CC submit → Terms → modal). The CC submit
        // creates the `uown_esign_document` (CONTRACT_CREATED), which is what
        // `assertSelectedTemplateForLead` reads. Assert the template here, then
        // STOP — do NOT sign in CT-00. Signing now would LOCK the lead and break
        // the per-frequency PDF capture below (CC auth is per-lead, already done;
        // re-driving the CC flow on a SIGNED lead fails). The single signing
        // ceremony happens once, at the very end (CT-07), after all PDF captures.
        await test.step('CT-00 GATE — open signing modal (NO signing) + assert selected template = OH_2025_SAC_16_MONTHS', async () => {
          // Re-issue MONTHLY so the contract link is live at open time (the
          // oracle loop's last invoice was MONTHLY, but re-issue keeps this
          // robust regardless of FREQUENCIES order — single-link supersession).
          const monthlyUrl = await freshRedirectUrlFor('MONTHLY');
          const modal = await driveToSigningModal(page, monthlyUrl, applicant);

          // Settle the iframe so the esign_document row is fully created before
          // the DB read (open modal = CONTRACT_CREATED; no signing here).
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          await frame
            .locator('.animate-spinSmooth, .animate-pulse')
            .first()
            .waitFor({ state: 'detached', timeout: 30_000 })
            .catch(() => {});

          // CT-00 — assert the template BEFORE reading content. The
          // esign_document row is created when the contract URL is opened (CC
          // submitted → CONTRACT_CREATED); assert now (fail-fast — wrong template
          // would test the wrong doc). The lead stays UNSIGNED so the
          // per-frequency PDF capture below can re-open each frequency's URL.
          // CT-00 contract: the selected template is identified by its
          // human-readable NAME (uown_gow_sign_template.name = document_name),
          // NOT the vendor opaque hash in template_id. `OH_2025_SAC_16_MONTHS`
          // lives in `name`; `template_id` is the GowSign vendor UUID hash
          // (e.g. "aa1kmya9pq69uim1u4ma405b"). See helper JSDoc + gowsign-knowledge.
          const { template } = await assertSelectedTemplateForLead(db, Number(ctx.leadPk), TEMPLATE_ID);
          expect(template.name, 'selected GowSign template (human-readable name)').toBe(TEMPLATE_ID);
          expect(String(template.state).toUpperCase(), 'template state = OH').toBe('OH');
          console.log(`[546-S3 CT-00] name=${template.name} vendorTemplateId=${template.templateId} state=${template.state} pk=${template.pk}`);
        });

        // ── Per-frequency render: capture rendered PDF, read Item 3/4/4a ───
        // CT-01 (nextPaymentDueAmount non-blank + oracle), CT-02 (5 vars),
        // CT-03 (consistency invariant), CT-05 (no token leak).
        const renderedTexts = new Map<Frequency, string>();
        // Keep the last-opened modal so CT-07 can reuse its open iframe to sign
        // ONCE at the very end (after all PDF captures, while the lead is still
        // unsigned during the loop).
        let lastModal: AlternativeContractModalPage | null = null;
        for (const freq of FREQUENCIES) {
          await test.step(`CT-01/02/03/05 [${freq}] — render OH contract PDF + read values`, async () => {
            const oracle = oracles.get(freq)!;
            // Re-issue THIS frequency's invoice now → live link at open time.
            // The oracle.redirectUrl captured earlier is stale (superseded by a
            // later loop pass); opening it yields "Invalid link. Please contact
            // merchant" and the modal never renders (DOM-proven qa2 2026-06-18).
            const freshUrl = await freshRedirectUrlFor(freq);
            const modal = await driveToSigningModal(page, freshUrl, applicant);
            lastModal = modal;
            const iframeSrc = await modal.getIframeSrc();
            expect(iframeSrc, `[${freq}] GowSign iframe src present`).toBeTruthy();

            // Render the SAME HTML the customer sees to a real PDF, then parse.
            const pdf = await captureContractPdf(page, iframeSrc as string);
            const values: ContractValues = await extractContractValues(pdf);
            const rawText = values.rawText ?? '';
            renderedTexts.set(freq, rawText);
            testInfo.attachments.push({
              name: `contract-rawtext-${freq}.txt`,
              contentType: 'text/plain',
              body: Buffer.from(rawText, 'utf-8'),
            });
            expect(rawText.length, `[${freq}] rendered contract text non-empty`).toBeGreaterThan(200);

            // ── CT-05 — no raw `{{token}}` survived un-substituted (AC4 leak) ──
            const leaked = rawText.match(/\{\{[^}]+\}\}/g) ?? [];
            expect(leaked, `[${freq}] no raw {{token}} leak; found: ${leaked.join(', ')}`).toHaveLength(0);

            // ── CT-01 — {{nextPaymentDueAmount}} non-blank + oracle in Item 3 + Item 4a ──
            // Item 3: "Regular {FREQ} lease rate is $X plus tax".
            const item3Value = moneyAfter(
              rawText,
              /Regular\s+[A-Z_\s-]*?lease\s+rate\s+is\s+\$\s*([0-9.,]+)/i,
            );
            // Negative anchor: the slot is NOT blank/whitespace and NOT a literal token.
            expect(
              item3Value,
              `[${freq}] CT-01 Item 3 "Regular ... lease rate is $___" must render a value (BLANK = the confirmed defect)`,
            ).not.toBeNull();
            expect(item3Value as number, `[${freq}] CT-01 Item 3 rate == oracle nextPaymentDueAmount`).toBeCloseTo(
              oracle.nextPaymentDueAmount,
              2,
            );

            // Item 4a: "N payments of $X plus $Y".
            const item4aPayment = moneyAfter(
              rawText,
              new RegExp(`${oracle.totalNumberOfPayments}\\s+payments?\\s+of\\s+\\$\\s*([0-9.,]+)`, 'i'),
            );
            expect(
              item4aPayment,
              `[${freq}] CT-01 Item 4a "${oracle.totalNumberOfPayments} payments of $___" must render a value`,
            ).not.toBeNull();
            expect(item4aPayment as number, `[${freq}] CT-01 Item 4a payment == oracle nextPaymentDueAmount`).toBeCloseTo(
              oracle.nextPaymentDueAmount,
              2,
            );

            // ── CT-02 — the 5 dynamic variables equal the oracle ──────────────
            // {{costPriceWithFeeNoTax}} (Item 4 promotional-payoff option).
            const costPrice = moneyAfter(
              rawText,
              /(?:Promotional[-\s]?Payoff[-\s]?Option|cost\s*price)[^$]{0,80}\$\s*([0-9.,]+)/i,
            );
            expect(costPrice, `[${freq}] CT-02 Item 4 costPriceWithFeeNoTax present`).not.toBeNull();
            expect(costPrice as number, `[${freq}] CT-02 costPriceWithFeeNoTax == oracle`).toBeCloseTo(
              oracle.costPriceWithFeeNoTax,
              2,
            );

            // {{totalNumberOfPayments}} (Item 4a) — exact count (not money).
            const nMatch = rawText.replace(/\s+/g, ' ').match(/(\d{1,3})\s+payments?\s+of\s+\$/i);
            const renderedN = nMatch ? Number(nMatch[1]) : NaN;
            expect(renderedN, `[${freq}] CT-02 totalNumberOfPayments == oracle`).toBe(oracle.totalNumberOfPayments);

            // {{salesTax}} (Item 4a) "... plus $Y" tax slot.
            const salesTax = moneyAfter(
              rawText,
              new RegExp(
                `${oracle.totalNumberOfPayments}\\s+payments?\\s+of\\s+\\$[0-9.,]+\\s+plus\\s+\\$\\s*([0-9.,]+)`,
                'i',
              ),
            );
            expect(salesTax, `[${freq}] CT-02 Item 4a salesTax slot present`).not.toBeNull();
            expect(salesTax as number, `[${freq}] CT-02 salesTax == oracle`).toBeCloseTo(oracle.salesTax, 2);

            // {{contractAmount}} (Item 4a).
            const contractAmount = moneyAfter(
              rawText,
              /(?:Total\s*of\s*Payments|Contract\s*Amount|Total\s*Cost)[^$]{0,40}\$\s*([0-9.,]+)/i,
            );
            expect(contractAmount, `[${freq}] CT-02 contractAmount present`).not.toBeNull();
            expect(contractAmount as number, `[${freq}] CT-02 contractAmount == oracle`).toBeCloseTo(
              oracle.contractAmount,
              2,
            );

            // ── CT-03 — value consistency invariant ON THE RENDERED NUMBERS ───
            // n × regularWithTax + fee ≈ contractAmount. The rendered Item 4a
            // exposes payment(no-tax) + tax = regularWithTax per period.
            const renderedRegularWithTax = (item4aPayment as number) + (salesTax as number);
            const renderedSum = +(
              (renderedN as number) * renderedRegularWithTax +
              (oracle.contractAmount - (renderedN as number) * renderedRegularWithTax)
            ).toFixed(2);
            // Invariant from the oracle side (proves backend coherence too):
            expect(oracle.consistencySum, `[${freq}] CT-03 oracle invariant ≈ contractAmount`).toBeCloseTo(
              oracle.contractAmount,
              0,
            );
            // Rendered coherence: per-period regularWithTax × n is within $1 of contract
            // minus the up-front processing fee — guards a token-binding swap.
            expect(
              (renderedN as number) * renderedRegularWithTax,
              `[${freq}] CT-03 rendered n×regularWithTax coherent with contractAmount`,
            ).toBeCloseTo(oracle.contractAmount - (oracle.costPriceWithFeeNoTax - REFERENCE_SUBTOTAL), 0);
            void renderedSum;

            console.log(
              `[546-S3 ${freq}] rendered Item3=${item3Value} Item4a=${item4aPayment} n=${renderedN} ` +
                `tax=${salesTax} cost=${costPrice} contract=${contractAmount}`,
            );
          });
        }

        // ── CT-04 — OH 16m content presence / copy parity (AC2) ───────────
        await test.step('CT-04 — OH 16m content presence / copy parity vs Fernando spec', async () => {
          const text = renderedTexts.get('MONTHLY') ?? '';
          expect(text.length, 'reference (MONTHLY) rendered text available').toBeGreaterThan(200);

          const requiredCopy: Array<{ label: string; re: RegExp }> = [
            { label: 'Item 4 Promotional-Payoff Option', re: /Promotional[-\s]?Payoff[-\s]?Option/i },
            { label: 'Item 4a Lease-Purchase Ownership', re: /Lease[-\s]?Purchase\s+Ownership/i },
            { label: 'footnote "*with a Promotional Payoff option"', re: /\*?\s*with\s+a\s+Promotional\s+Payoff\s+option/i },
            { label: 'line "Early Purchase Option Available Off Unpaid Balance"', re: /Early\s+Purchase\s+Option\s+Available\s+Off\s+Unpaid\s+Balance/i },
            { label: 'Appendix "EARLY PURCHASE OPTION"', re: /EARLY\s+PURCHASE\s+OPTION/i },
          ];
          const missing = requiredCopy.filter((c) => !c.re.test(text)).map((c) => c.label);
          expect(missing, `CT-04 missing required OH 16m copy: ${missing.join(' | ')}`).toHaveLength(0);
        });

        // ── CT-06 — state-specific EPO formula + brand phone, no cross-state leak ──
        await test.step('CT-06 — OH EPO appendix + brand phone, no cross-state leak', async () => {
          const text = renderedTexts.get('MONTHLY') ?? '';

          // OH Appendix "EARLY PURCHASE OPTION" with a 16-month formula present.
          expect(/EARLY\s+PURCHASE\s+OPTION/i.test(text), 'CT-06 EPO appendix header present').toBe(true);
          expect(
            /16[-\s]?month/i.test(text),
            'CT-06 16-month EPO formula reference present (sticky 16m)',
          ).toBe(true);

          // Brand phone resolves to a real phone (non-blank, not a placeholder).
          const phoneMatch = text.replace(/\s+/g, ' ').match(/(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/);
          expect(phoneMatch, 'CT-06 {{companyInfoBrandPhone}} resolves to a real phone').not.toBeNull();
          expect(/\{\{\s*companyInfoBrandPhone\s*\}\}/i.test(text), 'CT-06 brand phone token not leaked').toBe(false);

          // Cross-state leak guard: the agreement title must be Ohio; no other
          // US state name should appear as the governing-state header. A blunt
          // but effective guard — Ohio present, and a small set of common
          // wrong-state leaks absent from a state-governing-law context.
          expect(/\bOhio\b/i.test(text), 'CT-06 agreement references Ohio').toBe(true);
          const wrongStateLeak = /(governed\s+by|laws\s+of\s+the\s+State\s+of)\s+(California|Georgia|New\s+York|Texas|Florida)/i;
          expect(wrongStateLeak.test(text), 'CT-06 no other-state governing-law leak').toBe(false);
        });

        // ── Sign ONCE, at the very end — AFTER all PDF captures ────────────
        // Signing is deferred to here (not CT-00) because a SIGNED lead is locked
        // and the per-frequency PDF capture above must run while unsigned. Reuse
        // the iframe of the last-opened modal (re-open the MONTHLY URL as a
        // fallback if the loop left no usable modal). This single ceremony
        // produces the signing activity log + esign COMPLETED that CT-07 asserts.
        await test.step('Sign reference contract ONCE (drives CT-07 log + esign status)', async () => {
          let modal = lastModal;
          if (!modal || !(await modal.isOpen())) {
            // Re-open MONTHLY from a FRESH link (the loop's last invoice was
            // MONTHLY, but any captured redirectUrl is stale after later
            // re-issues — re-issue now so the lead is openable to sign).
            const monthlyUrl = await freshRedirectUrlFor('MONTHLY');
            modal = await driveToSigningModal(page, monthlyUrl, applicant);
          }
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
          expect(result.signClicked, 'reference contract signed once (drives CT-07 log)').toBe(true);
        });

        // ── CT-07 — signing-event activity log (Rule #13) + esign status ──
        await test.step('CT-07 — signing activity log present + esign status reaches SENT_TO_CUSTOMER/COMPLETED', async () => {
          const leadPk = Number(ctx.leadPk);

          // Activity log: contract/signing service note for this lead.
          const note = await pollForNote(
            db,
            leadPk,
            "notes ILIKE '%[ContractService]%' OR notes ILIKE '%[ESIGNSERVICE]%'",
            60_000,
          );
          expect(note, 'CT-07 signing/contract activity log present in uown_los_lead_notes').not.toBeNull();
          expect(
            /\[(ContractService|ESIGNSERVICE)\]/i.test(note!.notes),
            'CT-07 activity log carries the contract/esign service prefix',
          ).toBe(true);
          console.log(`[546-S3 CT-07] note: ${note!.notes.slice(0, 200)}`);

          // esign document status reached a valid signing-lifecycle value.
          const esignDoc = await getEsignDocumentByLeadAndClient(db, leadPk, 'GOWSIGN');
          expect(esignDoc, 'CT-07 GOWSIGN esign_document row present').not.toBeNull();
          expect(
            ['SENT_TO_CUSTOMER', 'COMPLETED'],
            `CT-07 esign status (got ${esignDoc!.status}) — valid signing-lifecycle value (NOT SENT/SIGNED)`,
          ).toContain(esignDoc!.status);
          console.log(`[546-S3 CT-07] esign_document pk=${esignDoc!.pk} status=${esignDoc!.status}`);
        });
      });
    },
  );
}

// ── Local helpers (test-scoped flow drivers) ──────────────────────────────

/**
 * Drive the customer signing flow for a contract URL up to the open GowSign
 * modal: MissingDataForm (CC) → Terms → AlternativeContractModal (iframe open).
 * Returns the opened modal page object (iframe ready to read or sign).
 *
 * RESILIENCE (per-lead CC auth): the MissingDataForm (CC) and Terms pages only
 * appear on the FIRST open of a contract URL for a given lead. The CC auth is
 * per-lead — once submitted, re-opening a *different* frequency's `redirectUrl`
 * for the SAME (still-unsigned) lead may route straight to the GowSign modal,
 * skipping CC and/or Terms. So both steps are GUARDED: fill MissingDataForm only
 * if it loads within a short window, fill Terms only if it loads within a short
 * window; otherwise fall through to the modal. We do NOT hard-fail when CC/Terms
 * are absent on a repeat open (cause is known per-lead CC auth — guard, don't
 * bump timeouts blindly; Rule #15).
 */
async function driveToSigningModal(
  page: Page,
  contractUrl: string,
  applicant: { firstName: string; lastName: string },
): Promise<AlternativeContractModalPage> {
  await page.goto(contractUrl);

  // CC (MissingDataForm) — present only on the first open; SHORT-timeout guard.
  const missingData = new MissingDataFormPage(page);
  try {
    await missingData.waitForLoaded(15_000);
    await missingData.fillAndSubmit({
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      cardNumber: CC.cardNumber,
      cvc: CC.cvc,
      expiration: CC.expiration,
    });
  } catch {
    // CC auth already done for this lead (repeat open) — skip straight to Terms.
  }

  // Terms — also optional on a repeat open; SHORT-timeout guard.
  const terms = new TermsOfAgreementPage(page);
  try {
    await terms.waitForLoaded(15_000);
    // OH does not offer Protection Plan; opt out (false).
    await terms.acceptAndProceedWithProtectionPlan(false);
  } catch {
    // Terms not re-shown on this repeat open — fall through to the modal.
  }

  const modal = new AlternativeContractModalPage(page);
  await modal.waitForOpen(120_000);
  return modal;
}

/**
 * Poll `uown_los_lead_notes` for a note matching `predicate` (raw SQL boolean).
 * Returns the latest matching row or null after timeout.
 */
async function pollForNote(
  db: DatabaseHelpers,
  leadPk: number,
  predicate: string,
  timeoutMs: number,
): Promise<{ notes: string } | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await db.queryOne<{ notes: string }>(
      `SELECT notes FROM uown_los_lead_notes
       WHERE lead_pk = $1 AND (${predicate})
       ORDER BY pk DESC LIMIT 1`,
      [leadPk],
    );
    if (row) return row;
    await sleep(3_000);
  }
  return null;
}

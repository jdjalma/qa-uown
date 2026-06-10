/**
 * Task #488 — Return multiple payment options to merchants integrated via API based on a config
 * Milestone: RU04.26.1.50.2
 *
 * Feature: CalculatorStep checks config flag `allowMultipleOptionsFor` (default: "TERRACE_FINANCE").
 * When an API-integrated merchant's clientType is in the allowed list, sendApplication returns ALL
 * payment options (both 13-month and 16-month plans). Otherwise, only the max term (16m) is returned.
 *
 * Filtering applies ONLY when ALL conditions are true:
 *   1. eligibleTerms is not blank (GDS approved multiple terms)
 *   2. Merchant NOT in allowMultipleOptionsFor config list
 *   3. IntegrationType == API
 *   4. termMonths.size() > 1
 *
 * SSN 888888888 produces lambdaSegment=5 in GDS → eligible_terms="13,16"
 * Applicant profile: debra swarey, 121 Madison Ave 5, New York, NY 10016 (must match for DataMismatchStep)
 *
 * CT-01: TerraceFinance (TERRACE_FINANCE, in allowMultipleOptionsFor) → receives BOTH 13m and 16m
 * CT-02: PayPossible (PAY_POSSIBLE, NOT in allowMultipleOptionsFor) → receives ONLY max term (16m)
 * CT-03: DB validation — eligible_terms = "13,16" for both leads
 *
 * Run: npx playwright test docs/taskTestingUown/RU04.26.1.50.2_returnMultiplePaymentOptionsToMerchantsIntegratedViaApiBasedOnAConfig_488/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MERCHANTS } from '@data/merchants.js';
import { buildTestData } from '@helpers/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateTestPhone } from '@config/constants.js';
import type { ConfigEnvironment } from '@config/environment.js';

const TEST_NAME =
  'RU04.26.1.50.2_returnMultiplePaymentOptionsToMerchantsIntegratedViaApiBasedOnAConfig_488';

// ── Fixed applicant profile ─────────────────────────────────────────
// SSN 888888888 → GDS lambdaSegment=5 → eligible_terms="13,16"
// Address/name must match existing leads to pass DataMismatchStep
const FIXED_SSN = '888888888';
const APPLICANT_PROFILE = {
  firstName: 'debra',
  lastName: 'swarey',
  address: '121 Madison Ave 5',
  city: 'New York',
  state: 'NY',
  zip: '10016',
  dob: '02/01/1986',
} as const;

function buildApplicant(env: ConfigEnvironment) {
  return {
    ...APPLICANT_PROFILE,
    ssn: FIXED_SSN,
    phone: generateTestPhone(),
    email: env.uniqueEmailAlias,
  };
}

// ── Order with line items (required for calculator to run) ───────────
const ORDER = {
  orderTotal: '1361.37',
  orderDescription: `${TEST_NAME} test`,
  merchandiseSubtotal: '808.70',
  deliveryCharge: '57.00',
  installationCharge: '107.00',
  salesTax: '55.67',
  miscellaneousFees: '333.00',
};

// ── Build sendApplication body matching Postman format ───────────────
function buildBody(
  merchant: { username: string; password: string; number: string },
  applicant: ReturnType<typeof buildApplicant>,
  ctLabel: string,
) {
  const now = new Date();
  const nextPay = new Date(now);
  nextPay.setDate(nextPay.getDate() + 7);
  const lastPay = new Date(now);
  lastPay.setDate(lastPay.getDate() - 7);
  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${d.getFullYear()}`;
  const dob = applicant.dob.replace(/\//g, '');

  return {
    userName: merchant.username,
    setupPassword: merchant.password,
    merchantNumber: merchant.number,
    mainFirstName: applicant.firstName,
    mainLastName: applicant.lastName,
    mainSSN: applicant.ssn,
    mainCellPhone: applicant.phone,
    emailAddress: applicant.email,
    mainAddress1: applicant.address,
    mainCity: applicant.city,
    mainStateOrProvince: applicant.state,
    mainPostalCode: applicant.zip,
    mainDOB: dob,
    mainNextPayDate: fmt(nextPay),
    mainLastPayDate: fmt(lastPay),
    mainEmployerName: 'Best Buy',
    mainPastBankruptcy: false,
    mainCurrentOrFutureBankruptcy: false,
    languagePreference: 'E',
    iovationFingerprintText: 'fingerPrintText',
    ipaddress: '192.168.0.2',
    desiredPaymentFrequency: 'WEEKLY',
    mainAnnualIncome: 510000,
    mainPayFrequency: 'WEEKLY',
    mainEmploymentDuration: '_1_TO_2_YEARS',
    shipToSameAsConsumer: true,
    merchandiseSubtotal: ORDER.merchandiseSubtotal,
    discountAmount: '0.00',
    deliveryCharge: ORDER.deliveryCharge,
    installationCharge: ORDER.installationCharge,
    salesTax: ORDER.salesTax,
    miscellaneousFees: ORDER.miscellaneousFees,
    depositAmount: '0.00',
    orderTotal: ORDER.orderTotal,
    invoiceNumber: `INV-${ctLabel}-${Date.now()}`,
    lineItem: [
      {
        lineItemLineNumber: '317',
        lineItemSerialNumber: `S${Date.now()}`,
        lineItemProductNumber: 'A561SKU283',
        lineItemProductDescription: 'Ottoman',
        lineItemProductCategory: 'Seating',
        lineItemType: 'D',
        lineItemQuantityOrdered: '1',
        lineItemUnitPrice: '531.44',
        lineItemBasePrice: '499',
        lineItemTaxAmount: '32.44',
        lineItemExtendedPrice: '531.44',
      },
      {
        lineItemLineNumber: '318',
        lineItemSerialNumber: `M${Date.now()}`,
        lineItemProductNumber: 'A333SKU4444',
        lineItemProductDescription: 'Recliner',
        lineItemProductCategory: 'Seating',
        lineItemType: 'D',
        lineItemQuantityOrdered: '1',
        lineItemUnitPrice: '332.93',
        lineItemBasePrice: '309.70',
        lineItemTaxAmount: '23.23',
        lineItemExtendedPrice: '332.93',
      },
    ],
  };
}

// ── Test data ─────────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg' as const,
    /** TerraceFinance — TERRACE_FINANCE clientType, in allowMultipleOptionsFor → receives ALL terms */
    merchantMultipleOptions: 'TerraceFinance' as const,
    /** PayPossible — PAY_POSSIBLE clientType, NOT in allowMultipleOptionsFor → only max term */
    merchantSingleOption: 'PayPossible' as const,
    tag: buildTags(TestTag.STG, TestTag.REGRESSION),
  },
];

// ── Tests ─────────────────────────────────────────────────────────────

for (const td of testData) {
  test.describe(`${TEST_NAME} - ${td.env}`, { tag: splitTags(td.tag) }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: td.env });

    let ct01LeadPk = '';
    let ct02LeadPk = '';

    // ─────────────────────────────────────────────────────────────────
    // CT-01: TerraceFinance (allowMultipleOptionsFor = ON) receives both 13m and 16m
    // ─────────────────────────────────────────────────────────────────
    test('CT-01: TerraceFinance (flag ON) deve receber opcoes de 13m e 16m', async ({
      api,
      testEnv,
    }) => {
      test.setTimeout(120_000);

      const merchant = MERCHANTS[td.merchantMultipleOptions];
      const merchantInfo = {
        username: merchant.username,
        password: merchant.password,
        number: merchant.number,
      };
      const applicant = buildApplicant(testEnv);

      await test.step(
        'Enviar aplicacao via sendApplication (TerraceFinance, SSN 888888888)',
        async () => {
          const body = buildBody(merchantInfo, applicant, 'CT01');
          const resp = await api.application.sendApplication(body);

          console.log(`[CT-01] status=${resp.status} approval=${resp.body.appApprovalStatus} msg=${resp.body.transactionMessage}`);
          if (resp.body.appApprovalStatus !== 'APPROVED') {
            console.log(`[CT-01] FULL: ${JSON.stringify(resp.body, null, 2)}`);
          }
          expect(
            resp.ok,
            `sendApplication failed: ${resp.status} — ${JSON.stringify(resp.body)}`,
          ).toBeTruthy();
          expect(resp.body.appApprovalStatus, 'Status deve ser APPROVED').toBe('APPROVED');

          ct01LeadPk = String(resp.body.authorizationNumber ?? '');
          expect(Number(ct01LeadPk), 'leadPk deve ser > 0').toBeGreaterThan(0);

          console.log(`[CT-01] leadPk=${ct01LeadPk} lambdaScore=${resp.body.lambdaScore}`);

          // ── Core assertion: paymentDetailsList contains BOTH 13m and 16m entries ──
          const paymentDetails = resp.body.paymentDetailsList ?? [];
          expect(
            paymentDetails.length,
            'paymentDetailsList deve ter entries',
          ).toBeGreaterThan(0);

          const termMonths = paymentDetails
            .map((pd: { termInMonths?: number }) => pd.termInMonths)
            .filter((t: number | undefined): t is number => t !== undefined && t !== null);

          const uniqueTerms = [...new Set(termMonths)].sort((a, b) => a - b);
          console.log(`[CT-01] termInMonths: ${JSON.stringify(uniqueTerms)}`);
          console.log(`[CT-01] paymentDetailsList count: ${paymentDetails.length}`);

          expect(uniqueTerms, 'Deve conter termo de 13 meses').toContain(13);
          expect(uniqueTerms, 'Deve conter termo de 16 meses').toContain(16);

          // Verify planId in redirectUrl for each entry
          for (const pd of paymentDetails) {
            expect(
              pd.redirectUrl,
              `redirectUrl deve conter planId para termInMonths=${pd.termInMonths}`,
            ).toContain('planId=');
          }
        },
      );
    });

    // ─────────────────────────────────────────────────────────────────
    // CT-02: PayPossible (NOT in allowMultipleOptionsFor) receives ONLY max term (16m)
    // ─────────────────────────────────────────────────────────────────
    test('CT-02: PayPossible (flag OFF) deve receber apenas opcoes de 16m', async ({
      api,
      testEnv,
    }) => {
      test.setTimeout(120_000);

      const merchant = MERCHANTS[td.merchantSingleOption];
      const merchantInfo = {
        username: merchant.username,
        password: merchant.password,
        number: merchant.number,
      };
      const applicant = buildApplicant(testEnv);

      await test.step(
        'Enviar aplicacao via sendApplication (PayPossible, SSN 888888888)',
        async () => {
          const body = buildBody(merchantInfo, applicant, 'CT02');
          const resp = await api.application.sendApplication(body);

          expect(
            resp.ok,
            `sendApplication failed: ${resp.status} — ${JSON.stringify(resp.body)}`,
          ).toBeTruthy();
          expect(resp.body.appApprovalStatus, 'Status deve ser APPROVED').toBe('APPROVED');

          ct02LeadPk = String(resp.body.authorizationNumber ?? '');
          expect(Number(ct02LeadPk), 'leadPk deve ser > 0').toBeGreaterThan(0);

          console.log(`[CT-02] leadPk=${ct02LeadPk} lambdaScore=${resp.body.lambdaScore}`);

          // ── Core assertion: paymentDetailsList contains ONLY 16m entries ──
          const paymentDetails = resp.body.paymentDetailsList ?? [];
          expect(
            paymentDetails.length,
            'paymentDetailsList deve ter entries',
          ).toBeGreaterThan(0);

          const termMonths = paymentDetails
            .map((pd: { termInMonths?: number }) => pd.termInMonths)
            .filter((t: number | undefined): t is number => t !== undefined && t !== null);

          const uniqueTerms = [...new Set(termMonths)];
          console.log(`[CT-02] termInMonths: ${JSON.stringify(uniqueTerms)}`);
          console.log(`[CT-02] paymentDetailsList count: ${paymentDetails.length}`);

          // All entries must be 16m — no 13m entries (filtered by CalculatorStep)
          for (const term of uniqueTerms) {
            expect(term, 'Todos os termos devem ser 16 meses (max term)').toBe(16);
          }
          expect(uniqueTerms, 'Nao deve conter termo de 13 meses').not.toContain(13);
        },
      );
    });

    // ─────────────────────────────────────────────────────────────────
    // CT-03: DB validation — eligible_terms = "13,16" for both leads
    // ─────────────────────────────────────────────────────────────────
    test('CT-03: DB — eligible_terms deve ser "13,16" para ambos os leads', async ({ db }) => {
      test.setTimeout(60_000);

      expect(ct01LeadPk, 'CT-01 leadPk deve estar disponivel').toBeTruthy();
      expect(ct02LeadPk, 'CT-02 leadPk deve estar disponivel').toBeTruthy();

      let dbAvailable = false;
      try {
        await db.query('SELECT 1', []);
        dbAvailable = true;
      } catch {
        console.warn('[CT-03] DB nao disponivel — teste ignorado');
        test.skip();
        return;
      }

      await test.step('Consultar uown_los_uwdata para ambos os leads', async () => {
        const rows = await db.query(
          `SELECT lead_pk, eligible_terms, lambda_segment, uw_status
           FROM uown_los_uwdata
           WHERE lead_pk IN ($1::bigint, $2::bigint)
           ORDER BY lead_pk`,
          [ct01LeadPk, ct02LeadPk],
        );

        expect(rows.length, 'Deve encontrar uwdata para ambos os leads').toBe(2);

        for (const row of rows) {
          console.log(
            `[CT-03] lead_pk=${row.lead_pk} eligible_terms="${row.eligible_terms}" lambda=${row.lambda_segment} uw=${row.uw_status}`,
          );
          expect(row.eligible_terms, `eligible_terms deve conter "13"`).toContain('13');
          expect(row.eligible_terms, `eligible_terms deve conter "16"`).toContain('16');
          expect(row.uw_status, 'UW status deve ser APPROVED').toBe('APPROVED');
        }
      });
    });
    // ─────────────────────────────────────────────────────────────────
    // CT-04: Single eligible term ("13" only) — filter should NOT apply
    // When termMonths.size() == 1, CalculatorStep skips filtering entirely
    // ─────────────────────────────────────────────────────────────────
    test('CT-04: eligible_terms com apenas 1 termo — filtro nao deve ser aplicado', async ({
      api,
      testEnv,
    }) => {
      test.setTimeout(120_000);

      const merchant = MERCHANTS[td.merchantSingleOption]; // PayPossible (NOT in allow list)
      const merchantInfo = {
        username: merchant.username,
        password: merchant.password,
        number: merchant.number,
      };

      // Use a random SSN (not 888888888) → GDS returns lambda != 5 → eligible_terms = "13" only
      const { applicant, order } = buildTestData({
        env: td.env,
        state: 'FL',
        merchant: td.merchantSingleOption,
        orderTotal: '1000',
        orderDescription: 'CT-04 single term',
        approved: true,
      });

      await test.step(
        'Enviar aplicacao com SSN aleatorio (eligible_terms = "13" only)',
        async () => {
          const body = buildBody(merchantInfo, applicant, 'CT04');
          const resp = await api.application.sendApplication(body);

          console.log(
            `[CT-04] status=${resp.status} approval=${resp.body.appApprovalStatus} lambda=${resp.body.lambdaScore}`,
          );

          expect(
            resp.ok,
            `sendApplication failed: ${resp.status} — ${JSON.stringify(resp.body)}`,
          ).toBeTruthy();
          expect(resp.body.appApprovalStatus, 'Status deve ser APPROVED').toBe('APPROVED');

          const paymentDetails = resp.body.paymentDetailsList ?? [];
          const termMonths = paymentDetails
            .map((pd: { termInMonths?: number }) => pd.termInMonths)
            .filter((t: number | undefined): t is number => t !== undefined && t !== null);
          const uniqueTerms = [...new Set(termMonths)].sort((a, b) => a - b);

          console.log(`[CT-04] termInMonths: ${JSON.stringify(uniqueTerms)}`);
          console.log(`[CT-04] paymentDetailsList count: ${paymentDetails.length}`);
          console.log(`[CT-04] leadPk: ${resp.body.authorizationNumber}`);

          // With only 1 eligible term, filter condition (termMonths.size() > 1) is false
          // So ALL payment options for that term should be returned (not filtered)
          expect(paymentDetails.length, 'Deve ter payment options').toBeGreaterThan(0);
          expect(uniqueTerms.length, 'Deve ter exatamente 1 termo').toBe(1);
          expect(uniqueTerms[0], 'Termo deve ser 13 meses').toBe(13);

          for (const pd of paymentDetails) {
            expect(pd.redirectUrl, 'redirectUrl deve conter planId').toContain('planId=');
          }
        },
      );
    });
  });
}

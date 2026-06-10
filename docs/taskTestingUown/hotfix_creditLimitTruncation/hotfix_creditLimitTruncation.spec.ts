/**
 * Hotfix: creditLimit truncation fix in sendApplication response
 *
 * Bug: creditLimit was rounded UP (RoundingMode.HALF_EVEN) instead of truncated DOWN
 *      when max_approval_amount has decimal places caused by merchant approval_amount_increase.
 * Fix: ApplicationProcessor.java:267 — RoundingMode.HALF_EVEN → RoundingMode.DOWN
 * Deploy: dev1, qa1, sandbox (2026-03-26)
 * Reported by: Priyanka
 *
 * Example:
 *   UW approval_amount  = 1192
 *   max_approval_amount = 1192 × 1.05 = 1251.60 (stored in uown_los_lead)
 *   creditLimit (bug)   = 1252  (HALF_EVEN rounds .60 up)
 *   creditLimit (fix)   = 1251  (DOWN truncates)
 *
 * Run: npx playwright test tests/taskTestingUown/hotfix_creditLimitTruncation/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/index.js';
import { buildSendApplicationBody } from '@api/bodies';
import { generateRunId } from '@config/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const ORDER_WITH_DECIMALS = {
  merchandiseSubtotal: '652.50',
  discountAmount: '0.00',
  deliveryCharge: '57.00',
  installationCharge: '107.00',
  salesTax: '0',
  miscellaneousFees: '333.00',
  depositAmount: '0.00',
  orderTotal: '1149.50',
  invoiceNumber: 'R91931',
  lineItem: [
    {
      lineItemLineNumber: '317',
      lineItemSerialNumber: 'S94712065',
      lineItemProductNumber: 'A561SKU283',
      lineItemProductDescription: 'Ottoman',
      lineItemProductCategory: 'Seating',
      lineItemType: 'D',
      lineItemQuantityOrdered: '1',
      lineItemUnitPrice: '319.57',
      lineItemBasePrice: '299.00',
      lineItemTaxAmount: '20.57',
      lineItemExtendedPrice: '319.57',
    },
    {
      lineItemLineNumber: '318',
      lineItemSerialNumber: 'M68484397',
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

const testData = [
  {
    env: 'sandbox',
    state: 'CA',
    merchant: 'TireAgent', // OW90218-0001 — configured with approval_amount_increase = 5%
    orderTotal: '1149.50',
    runId: generateRunId(),
    tag: buildTags(TestTag.SANDBOX, TestTag.REGRESSION),
  },
];

for (const data of testData) {
  test.describe(`Hotfix: creditLimit Truncation — ${data.env} / ${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: data.env });

    let leadPk = '';
    let leadUuid = '';
    let creditLimitFromResponse = 0;

    // ──────────────────────────────────────────────────────────────────
    //  CT-01: sendApplication → creditLimit deve ser truncado (floor)
    // ──────────────────────────────────────────────────────────────────
    test('CT-01: creditLimit deve ser Math.floor(max_approval_amount) — não arredondado para cima', async ({ api, db }) => {
      test.setTimeout(120_000);

      const { merchant, applicant } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: data.orderTotal,
        orderDescription: 'Hotfix creditLimit truncation',
        approved: true,
      });

      // ── Pre-check: merchant config no DB ────────────────────────────
      await test.step('Pre-check: verificar approval_amount_increase do TireAgent no DB', async () => {
        const increaseStr = await db.getSingleString(
          `SELECT approval_amount_increase::text FROM uown_merchant WHERE ref_merchant_code = 'tireagent' LIMIT 1`,
          [],
        );
        const increaseVal = parseFloat(increaseStr ?? '0');
        console.log(`[Pre-check] TireAgent approval_amount_increase = ${increaseStr} (${increaseVal * 100}%)`);
        test.info().annotations.push({
          type: 'merchant_approval_increase',
          description: increaseStr ?? '0',
        });
        if (increaseVal === 0) {
          console.warn('[Pre-check] AVISO: approval_amount_increase = 0 — max_approval_amount será inteiro, sem diferença entre DOWN e HALF_EVEN');
        }
      });

      // ── Step 1: sendApplication ──────────────────────────────────────
      await test.step('Enviar sendApplication com TireAgent (sandbox)', async () => {
        const body = buildSendApplicationBody(merchant, applicant);
        // Override order fields with exact values — decimal amounts force truncation validation
        Object.assign(body, ORDER_WITH_DECIMALS);
        const resp = await api.application.sendApplication(body);
        expect(resp.ok, `sendApplication retornou ${resp.status}: ${JSON.stringify(resp.body)}`).toBeTruthy();

        leadPk = String(resp.body.authorizationNumber ?? '');
        leadUuid = resp.body.accountNumber ?? leadPk;
        creditLimitFromResponse = resp.body.creditLimit ?? 0;

        expect(leadPk, 'leadPk deve estar presente na resposta (authorizationNumber)').toBeTruthy();
        expect(creditLimitFromResponse, 'creditLimit deve estar na resposta').toBeGreaterThan(0);

        test.info().annotations.push(
          { type: 'leadPk', description: leadPk },
          { type: 'leadUuid', description: leadUuid },
          { type: 'creditLimit_response', description: String(creditLimitFromResponse) },
        );
        console.log(`[CT-01] leadPk=${leadPk}, leadUuid=${leadUuid}, creditLimit=${creditLimitFromResponse}`);
      });

      // ── Step 2: DB — max_approval_amount em uown_los_lead ───────────────
      await test.step('Verificar max_approval_amount em uown_los_lead (deve ter casas decimais)', async () => {
        const maxApprovalStr = await db.getSingleString(
          `SELECT max_approval_amount::text FROM uown_los_lead WHERE pk = $1`,
          [leadPk],
        );
        expect(maxApprovalStr, 'max_approval_amount deve estar em uown_los_lead').not.toBeNull();

        const maxApproval = parseFloat(maxApprovalStr ?? '0');
        const decimalPart = maxApproval % 1;

        console.log(`[CT-01] max_approval_amount no DB = ${maxApprovalStr}`);
        test.info().annotations.push({ type: 'max_approval_amount_db', description: maxApprovalStr ?? '' });

        // Verificar que tem casas decimais (confirma que o merchant increase está funcionando)
        expect(maxApproval, 'max_approval_amount deve ser positivo').toBeGreaterThan(0);
        if (decimalPart === 0) {
          console.warn('[CT-01] AVISO: max_approval_amount é inteiro — verificar se approval_amount_increase está configurado');
        } else {
          console.log(`[CT-01] ✅ max_approval_amount tem decimais: ${maxApproval} (parte decimal: .${String(maxApprovalStr ?? '').split('.')[1] ?? '00'})`);
        }
      });

      // ── Step 3: Asserção principal — creditLimit = Math.floor(max_approval_amount) ──
      await test.step('KEY ASSERTION: creditLimit deve ser Math.floor(max_approval_amount)', async () => {
        const maxApprovalStr = await db.getSingleString(
          `SELECT max_approval_amount::text FROM uown_los_lead WHERE pk = $1`,
          [leadPk],
        );
        const maxApproval = parseFloat(maxApprovalStr ?? '0');
        const expectedCreditLimit = Math.floor(maxApproval);
        const roundedUpValue = Math.ceil(maxApproval);

        console.log(`[CT-01] max_approval_amount    = ${maxApproval}`);
        console.log(`[CT-01] creditLimit (resposta) = ${creditLimitFromResponse}`);
        console.log(`[CT-01] Math.floor (esperado)  = ${expectedCreditLimit}`);
        if (maxApproval % 1 > 0) {
          console.log(`[CT-01] Math.ceil  (bug seria) = ${roundedUpValue}`);
        }

        test.info().annotations.push({ type: 'creditLimit_expected_floor', description: String(expectedCreditLimit) });

        // ASSERÇÃO PRINCIPAL: creditLimit deve ser o valor truncado (floor)
        expect(
          creditLimitFromResponse,
          `creditLimit (${creditLimitFromResponse}) deve ser Math.floor(${maxApproval}) = ${expectedCreditLimit}. ` +
          `Se retornou ${roundedUpValue}, o bug RoundingMode.HALF_EVEN ainda está presente.`,
        ).toBe(expectedCreditLimit);

        // Verificar explicitamente: não deve ser o valor arredondado para cima
        if (maxApproval % 1 > 0) {
          expect(
            creditLimitFromResponse,
            `creditLimit NÃO deve ser arredondado para cima. Bug original retornaria ${roundedUpValue}.`,
          ).toBeLessThan(roundedUpValue);

          console.log(`[CT-01] ✅ Fix confirmado: ${maxApproval} → truncado=${expectedCreditLimit} (bug teria dado ${roundedUpValue})`);
        } else {
          console.log(`[CT-01] ℹ️ max_approval_amount é inteiro — creditLimit correto mas não demonstra a diferença do fix`);
        }
      });

      // ── Step 4: DB — approval_amount original em uown_los_uwdata ────
      await test.step('Verificar approval_amount original no DB (uown_los_uwdata)', async () => {
        const uwApprovalStr = await db.getSingleString(
          `SELECT approval_amount::text FROM uown_los_uwdata WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [leadPk],
        );

        if (uwApprovalStr) {
          const uwApproval = parseFloat(uwApprovalStr);
          console.log(`[CT-01] UW approval_amount (base) = ${uwApprovalStr}`);
          test.info().annotations.push({ type: 'uw_approval_amount_db', description: uwApprovalStr });

          expect(uwApproval, 'UW approval_amount deve ser positivo').toBeGreaterThan(0);

          // Verificar relação: max_approval_amount ≥ uw_approval_amount (o aumento % só aumenta)
          const maxApprovalStr = await db.getSingleString(
            `SELECT max_approval_amount::text FROM uown_los_lead WHERE pk = $1`,
            [leadPk],
          );
          const maxApproval = parseFloat(maxApprovalStr ?? '0');
          expect(
            maxApproval,
            `max_approval_amount (${maxApproval}) deve ser ≥ UW approval_amount (${uwApproval}) — o aumento % sempre incrementa`,
          ).toBeGreaterThanOrEqual(uwApproval);
        } else {
          console.log('[CT-01] uown_los_uwdata não encontrado para este lead (GDS pode não ter retornado UW data)');
        }
      });
    });

    // ──────────────────────────────────────────────────────────────────
    //  CT-02: getFinalApprovalDetails — maxApprovalAmount consistente
    // ──────────────────────────────────────────────────────────────────
    test('CT-02: getFinalApprovalDetails deve retornar maxApprovalAmount consistente com DB', async ({ api, db }) => {
      test.setTimeout(60_000);

      expect(leadPk, 'leadPk deve estar preenchido pelo CT-01').toBeTruthy();

      await test.step('Chamar getFinalApprovalDetails e verificar maxApprovalAmount', async () => {
        const resp = await api.application.getFinalApprovalDetails(leadPk);
        expect(resp.ok, `getFinalApprovalDetails retornou ${resp.status}`).toBeTruthy();

        console.log(`[CT-02] getFinalApprovalDetails body: ${JSON.stringify(resp.body)}`);
        test.info().annotations.push({ type: 'finalApprovalDetails', description: JSON.stringify(resp.body) });

        if (resp.body.maxApprovalAmount !== undefined) {
          const apiVal = resp.body.maxApprovalAmount;
          const dbStr = await db.getSingleString(
            `SELECT max_approval_amount::text FROM uown_los_lead WHERE pk = $1`,
            [leadPk],
          );
          const dbVal = parseFloat(dbStr ?? '0');

          console.log(`[CT-02] maxApprovalAmount (API) = ${apiVal}`);
          console.log(`[CT-02] max_approval_amount (DB) = ${dbVal}`);

          expect(
            apiVal,
            `maxApprovalAmount (API: ${apiVal}) deve estar próximo ao valor do DB (${dbVal})`,
          ).toBeCloseTo(dbVal, 2);
        } else {
          console.log('[CT-02] maxApprovalAmount não presente na resposta do getFinalApprovalDetails');
        }
      });
    });
  });
}

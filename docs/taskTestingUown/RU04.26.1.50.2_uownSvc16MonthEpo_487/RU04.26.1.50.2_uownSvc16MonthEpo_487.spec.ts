/**
 * RU04.26.1.50.2_uownSvc16MonthEpo_487
 *
 * Validates hotfix #487: When EPO (Early Pay-Off) for 16-month accounts is negative
 * (customer overpaid), getAnytimeBuyout() now returns BigDecimal.ZERO instead of
 * fetching contractBalance (previous behavior from task #504).
 *
 * Routing logic in PayOffAmountService.getPayOffAmount():
 *   ├─ IF termInMonths == 16 → getAnytimeBuyout()   ← THE FIX
 *   ├─ ELSE IF KORNERSTONE  → getKornerstoneEpo()
 *   └─ ELSE                 → getEpoCalculation()
 *
 * getAnytimeBuyout() fix (commit f5f0d3af):
 *   kwBuyoutAmount = anytimeBuyoutAmountWithTax - actualPaymentAmount
 *   if (kwBuyoutAmount <= 0 || daysUsed <= 0) → return BigDecimal.ZERO  (was: contractBalance)
 *
 * CT-01 — EPO positivo 16m — comportamento normal (sem regressão)
 * CT-02 — EPO negativo 16m → retorna 0 (fix principal #487)
 * CT-03 — daysUsed <= 0 → retorna 0 (edge case: conta recém-ativada) [SKIPPED in STG — no natural accounts]
 * CT-04 — Kornerstone 13m → não afetado (regressão)
 * CT-05 — Breakdown 16m contém cálculo detalhado do Anytime Buyout
 *
 * STG variant: Uses existing accounts (read-only, no DB writes).
 *
 * GitLab: Task #487 — RU04.26.1.50.2 (Hotfix)
 * Pipeline: new-api (API + DB validation)
 * No browser required.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Test name ───────────────────────────────────────────────────────────
const TEST_NAME = 'RU04.26.1.50.2_uownSvc16MonthEpo_487';

// ── Test data ───────────────────────────────────────────────────────────
const testData = [
  {
    env: 'stg',
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.STG),
    // Existing STG accounts (read-only — no DB writes needed)
    accounts: {
      // 16m ACTIVE, EPO positivo: cost=5000, mf=2.25, buyout≈11250, paid=53.29 → EPO >> 0
      epoPositive16m: '587606',
      // 16m ACTIVE, EPO negativo: cost=3247.96, mf=2.0, paid=5634.48 → kwBuyoutAmount < 0 → fix returns 0
      epoNegative16m: '573800',
      // 13m KORNERSTONE ACTIVE, regression check
      kornerstone13m: '589027',
    },
  },
];

// ── Suite ───────────────────────────────────────────────────────────────

for (const data of testData) {

  test.describe(
    `${TEST_NAME} - ${data.env}/KS3015`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ════════════════════════════════════════════════════════════════════
      // CT-01: EPO positivo 16m — comportamento normal (sem regressão)
      // ════════════════════════════════════════════════════════════════════
      test('CT-01: EPO positivo 16m — getPayoffAmount retorna valor > 0', async ({ api, db }) => {
        test.setTimeout(60_000);
        const accountPk = data.accounts.epoPositive16m;

        await test.step('Verify term_in_months = 16', async () => {
          const termInMonths = await db.getSingleNumber(
            'SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = $1',
            [accountPk],
          );
          console.log(`[CT-01] accountPk=${accountPk} termInMonths=${termInMonths}`);
          expect(termInMonths, 'Expected 16-month term').toBe(16);
        });

        await test.step('getPayoffAmount returns HTTP 200 with positive value', async () => {
          const resp = await api.svcPayoff.getPayoffAmount(accountPk);
          console.log(`[CT-01] getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`);
          await test.info().attach('CT-01 getPayoffAmount', {
            body: JSON.stringify({ status: resp.status, body: resp.body }),
            contentType: 'application/json',
          });
          expect(resp.status).toBe(200);
          expect(resp.body, 'EPO should be positive when buyout > totalPayments').toBeGreaterThan(0);
        });

        await test.step('getAccountSummary returns positive epoBalance', async () => {
          const resp = await api.svcPayoff.getAccountSummary(accountPk);
          console.log(`[CT-01] getAccountSummary epoBalance=${resp.body.epoBalance}`);
          await test.info().attach('CT-01 getAccountSummary', {
            body: JSON.stringify({ status: resp.status, epoBalance: resp.body.epoBalance }),
            contentType: 'application/json',
          });
          expect(resp.status).toBe(200);
          expect(resp.body.epoBalance, 'epoBalance should be positive').toBeGreaterThan(0);
        });
      });

      // ════════════════════════════════════════════════════════════════════
      // CT-02: EPO negativo 16m → retorna 0 (FIX PRINCIPAL #487)
      // ════════════════════════════════════════════════════════════════════
      test('CT-02: EPO negativo 16m → getPayoffAmount retorna 0 (não contractBalance)', async ({ api, db }) => {
        test.setTimeout(60_000);
        const accountPk = data.accounts.epoNegative16m;

        await test.step('Verify term_in_months = 16 and overpayment scenario', async () => {
          const termInMonths = await db.getSingleNumber(
            'SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = $1',
            [accountPk],
          );
          console.log(`[CT-02] accountPk=${accountPk} termInMonths=${termInMonths}`);
          expect(termInMonths, 'Expected 16-month term').toBe(16);

          const totalPaid = await db.getSingleNumber(
            `SELECT COALESCE(SUM(payment_amount), 0) FROM uown_sv_payment WHERE account_pk = $1 AND status = 'PAID'`,
            [accountPk],
          );
          console.log(`[CT-02] totalPaid=${totalPaid}`);
        });

        await test.step('getPayoffAmount returns HTTP 200 with value = 0', async () => {
          const resp = await api.svcPayoff.getPayoffAmount(accountPk);
          console.log(`[CT-02] getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`);
          await test.info().attach('CT-02 getPayoffAmount', {
            body: JSON.stringify({ status: resp.status, body: resp.body }),
            contentType: 'application/json',
          });
          expect(resp.status, 'Should return HTTP 200').toBe(200);
          expect(
            resp.body,
            'Fix #487: EPO should be exactly 0 when customer overpaid (not contractBalance)',
          ).toBe(0);
        });

        await test.step('getAccountSummary returns epoBalance = 0', async () => {
          const summaryResp = await api.svcPayoff.getAccountSummary(accountPk);
          console.log(
            `[CT-02] getAccountSummary epoBalance=${summaryResp.body.epoBalance} contractBalance=${summaryResp.body.contractBalance}`,
          );
          await test.info().attach('CT-02 getAccountSummary', {
            body: JSON.stringify({
              status: summaryResp.status,
              epoBalance: summaryResp.body.epoBalance,
              contractBalance: summaryResp.body.contractBalance,
            }),
            contentType: 'application/json',
          });
          expect(summaryResp.status).toBe(200);
          expect(
            summaryResp.body.epoBalance,
            'Fix #487: epoBalance should be 0 (not contractBalance)',
          ).toBe(0);
        });
      });

      // ════════════════════════════════════════════════════════════════════
      // CT-03: daysUsed <= 0 — SKIPPED in STG
      // No natural accounts with activation_date >= today exist in STG.
      // This scenario was validated in qa1 with DB-manipulated accounts.
      // ════════════════════════════════════════════════════════════════════
      test.skip('CT-03: daysUsed = 0 (activation_date=today) → getPayoffAmount retorna 0', async () => {
        // STG: No accounts with activation_date >= today available.
        // Validated in qa1 with DB override (activation_date = CURRENT_DATE).
      });

      // ════════════════════════════════════════════════════════════════════
      // CT-04: Kornerstone 13m — não afetado pelo fix (regressão)
      // ════════════════════════════════════════════════════════════════════
      test('CT-04: Kornerstone 13m — EPO não afetado pelo fix 16m', async ({ api, db }) => {
        test.setTimeout(60_000);
        const accountPk = data.accounts.kornerstone13m;

        await test.step('Verify term_in_months = 13 and company = KORNERSTONE', async () => {
          const termInMonths = await db.getSingleNumber(
            'SELECT term_in_months FROM uown_sv_sched_summary WHERE account_pk = $1',
            [accountPk],
          );
          const company = await db.getSingleString(
            'SELECT company FROM uown_sv_account WHERE pk = $1',
            [accountPk],
          );
          console.log(`[CT-04] accountPk=${accountPk} termInMonths=${termInMonths} company=${company}`);
          expect(termInMonths, 'Should be 13-month term').toBe(13);
          expect(company, 'Should be KORNERSTONE').toBe('KORNERSTONE');
        });

        await test.step('getPayoffAmount returns HTTP 200 (getKornerstoneEpo path)', async () => {
          const resp = await api.svcPayoff.getPayoffAmount(accountPk);
          console.log(`[CT-04] getPayoffAmount status=${resp.status} body=${JSON.stringify(resp.body)}`);
          await test.info().attach('CT-04 getPayoffAmount', {
            body: JSON.stringify({ status: resp.status, body: resp.body }),
            contentType: 'application/json',
          });
          expect(resp.status, 'Kornerstone 13m should return HTTP 200').toBe(200);
          expect(resp.body, 'EPO should be >= 0 for Kornerstone 13m').toBeGreaterThanOrEqual(0);
        });

        await test.step('getAccountSummary returns epoBalance >= 0', async () => {
          const resp = await api.svcPayoff.getAccountSummary(accountPk);
          console.log(`[CT-04] getAccountSummary epoBalance=${resp.body.epoBalance}`);
          await test.info().attach('CT-04 getAccountSummary', {
            body: JSON.stringify({ status: resp.status, epoBalance: resp.body.epoBalance }),
            contentType: 'application/json',
          });
          expect(resp.status).toBe(200);
          expect(resp.body.epoBalance, 'epoBalance should be >= 0 for 13m').toBeGreaterThanOrEqual(0);
        });
      });

      // ════════════════════════════════════════════════════════════════════
      // CT-05: Breakdown 16m contém cálculo Anytime Buyout
      // ════════════════════════════════════════════════════════════════════
      test('CT-05: Breakdown 16m contém "16 Month Anytime Buyout"', async ({ api }) => {
        test.setTimeout(60_000);
        const accountPk = data.accounts.epoPositive16m;

        await test.step('getServicingInfo returns epoBreakdown with Anytime Buyout details', async () => {
          const resp = await api.svcPayoff.getServicingInfo(accountPk);
          console.log(`[CT-05] getServicingInfo status=${resp.status}`);
          await test.info().attach('CT-05 epoBreakdown', {
            body: JSON.stringify(resp.body.epoBreakdown),
            contentType: 'application/json',
          });
          expect(resp.status).toBe(200);
          expect(resp.body.epoBreakdown, 'epoBreakdown should be present').toBeDefined();
          expect(resp.body.epoBreakdown.length, 'epoBreakdown should have 2 rows (headers + values)').toBe(2);

          const headers = resp.body.epoBreakdown[0];
          const values = resp.body.epoBreakdown[1];
          console.log(`[CT-05] headers: ${JSON.stringify(headers)}`);
          console.log(`[CT-05] values: ${JSON.stringify(values)}`);

          // Verify expected Anytime Buyout headers
          expect(headers, 'Should contain ProgramType').toContain('ProgramType');
          expect(headers, 'Should contain MoneyFactor').toContain('MoneyFactor');
          expect(headers, 'Should contain Cost').toContain('Cost');
          expect(headers, 'Should contain DaysUsed label').toEqual(
            expect.arrayContaining([expect.stringContaining('DaysUsed')]),
          );
          expect(headers, 'Should contain Anytime buy out with tax').toContain('Anytime buy out with tax');
          expect(headers, 'Should contain TotalPaymentAmount').toContain('TotalPaymentAmount');
          expect(headers, 'Should contain Balance').toContain('Balance');

          // Verify ProgramType value is "16 Month Anytime Buyout"
          const programTypeIdx = headers.indexOf('ProgramType');
          expect(values[programTypeIdx], 'ProgramType should be "16 Month Anytime Buyout"').toBe('16 Month Anytime Buyout');
        });
      });
    },
  );
}

/**
 * Prorated Amount Calculator (Servicing Portal) — E2E
 *
 * Exercises the Prorated Amount modal opened from the calculator icon (#calculator)
 * on the Servicing Account Summary Bar (/customer-information/{accountPk}). A servicing
 * agent uses it to quote, on demand, the exact payoff a customer would owe if they paid
 * off the lease on any given date. A wrong figure is a customer-facing financial error,
 * so the displayed value is cross-checked against the system's own endpoint.
 *
 * BDD oracle (rule #19): docs/scenarios/prorated-amount.md (CT-01 → CT-04).
 *
 * Scenarios:
 *   CT-01 — Modal opens: header "Prorated Amount", "AS OF:" pre-filled with today
 *           (MM/DD/YYYY), result field shows "-" (no calc fired on open).
 *   CT-02 — Auto-calculation on a valid date: blur fires GET /uown/svc/getProrateAmount
 *           automatically → result shows a currency amount → matches the API response for
 *           that date (±$0.01) → AS OF retains the entered date → NO new uown_sv_activity_log
 *           row (read-only, rule #13 — absence assertion).
 *   CT-03 — Recalculation: a later date re-fires the calc → result differs from the earlier
 *           date, is higher (daily accrual, BR-ACC-4), and matches the API for the new date.
 *   CT-04 — Close: modal dismissed → account status unchanged (UI + DB) → NO new
 *           uown_sv_activity_log row.
 *
 * Strategy (rule #14 UI-first): drive the full modal flow via the browser; the direct API
 * call in CT-02/CT-03 is a COMPLEMENT (correctness oracle), not a replacement. Setup is via
 * automation (rule #9): one fresh FUNDED/ACTIVE lease (driveLeadToFunding → runs merchant
 * preflight, rule #12) is created ONCE and shared across the 4 read-only serial scenarios —
 * justified because every scenario is read-only (the calculator never mutates the account,
 * BR-ACC-5), so a fresh lease per scenario (~5 min each via driveLeadToFunding) would be
 * pure cost with no isolation benefit.
 *
 * Run: ENV=sandbox npx playwright test tests/e2e/servicing/prorated-amount.spec.ts --reporter=list
 */
import { test, expect } from '@support/base-test.js';
import { ServicingAccountSummaryPage } from '@pages/servicing/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  driveLeadToFunding,
  loginToPortalWithOptions,
  calculateDate,
  calculateDateISO,
  parseMoney,
} from '@helpers/index.js';

const PRORATED_DATA = {
  state: 'NY',
  merchant: 'TerraceFinance',
  orderTotal: '800',
  /** First quote date — within the lease term (today + 30d). */
  firstOffsetDays: 30,
  /** Second quote date — later than the first (today + 60d) so payoff is higher (BR-ACC-4). */
  secondOffsetDays: 60,
  tag: buildTags(TestTag.REGRESSION),
};

test.describe('Prorated Amount Calculator via Servicing Portal', { tag: splitTags(PRORATED_DATA.tag) }, () => {
  test.describe.configure({ mode: 'serial' });

  // Shared across the serial scenarios — the lease is created ONCE (CT-01's beforeEach).
  let accountPk = '';
  let leadPk = '';

  test.beforeEach(async ({ api, ctx, db, page, testEnv }) => {
    test.setTimeout(420_000);

    // Create the fresh FUNDED/ACTIVE lease only once — subsequent serial tests reuse it.
    if (!accountPk) {
      const { merchant, applicant } = buildTestData({
        state: PRORATED_DATA.state,
        merchant: PRORATED_DATA.merchant,
        orderTotal: PRORATED_DATA.orderTotal,
        orderDescription: 'Servicing prorated-amount test',
      });

      await test.step('Setup: application → FUNDING (account ACTIVE)', async () => {
        // createPreQualifiedApplication runs merchant preflight automatically (rule #12).
        await createPreQualifiedApplication(
          api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info(),
        );
        await driveLeadToFunding(api, merchant, ctx);
        leadPk = ctx.leadPk;

        const resolved = await db.waitForAccountByLeadPk(ctx.leadPk, 60_000);
        expect(resolved, `account not created for leadPk=${ctx.leadPk}`).toBeTruthy();
        accountPk = resolved!;
        ctx.accountPk = accountPk;
        console.log(`[Setup] leadPk=${leadPk} accountPk=${accountPk}`);
      });
    }

    // Each scenario gets a fresh page → log in and open the account page every time.
    await test.step('Login and open customer-information page', async () => {
      const summary = new ServicingAccountSummaryPage(page);
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, accountPk);
    });
  });

  test('CT-01 — modal opens with title, pre-filled today date, and initial dash', async ({ page }) => {
    test.setTimeout(120_000);
    const summary = new ServicingAccountSummaryPage(page);

    await test.step('Open the Prorated Amount modal from the calculator icon', async () => {
      await summary.openProratedAmountModal();
    });

    await test.step('Modal header reads "Prorated Amount"', async () => {
      const modal = summary.getProratedModal();
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Prorated Amount');
    });

    await test.step('"AS OF:" field is pre-filled with today in MM/DD/YYYY', async () => {
      const today = calculateDate(0); // MM/DD/YYYY, local TZ (same basis as the browser)
      const asOf = await summary.getProratedDateValue();
      console.log(`[CT-01] AS OF field="${asOf}" expectedToday="${today}"`);
      expect(asOf).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(asOf).toBe(today);
    });

    await test.step('Result field shows "-" before any calculation', async () => {
      const result = await summary.getProratedResultText();
      console.log(`[CT-01] initial result field="${result}"`);
      expect(result).toBe('-');
    });
  });

  test('CT-02 — system calculates the correct prorated payoff on date entry', async ({ page, api, db }) => {
    test.setTimeout(120_000);
    const summary = new ServicingAccountSummaryPage(page);
    const uiDate = calculateDate(PRORATED_DATA.firstOffsetDays);     // MM/DD/YYYY (UI)
    const isoDate = calculateDateISO(PRORATED_DATA.firstOffsetDays); // YYYY-MM-DD (API)

    await test.step('Open the Prorated Amount modal', async () => {
      await summary.openProratedAmountModal();
      expect(await summary.getProratedResultText(), 'result should start as "-"').toBe('-');
    });

    // Baseline activity-log count BEFORE the read-only calc — captured immediately before the
    // trigger so the only event in the window is the getProrateAmount call (rule #13 absence check).
    const logsBefore = (await db.getActivityLogsByAccount(accountPk)).length;

    let displayed = NaN;
    await test.step(`Enter ${uiDate} and let the calculation fire on blur`, async () => {
      await summary.setProratedDate(uiDate);
      const resultText = await summary.waitForProratedResult();
      displayed = parseMoney(resultText);
      console.log(`[CT-02] result text="${resultText}" → ${displayed}`);
      expect(resultText).toMatch(/\$/);          // a currency string, never "-"
      expect(displayed).toBeGreaterThan(0);
    });

    await test.step('Displayed amount matches the API value for that date (±$0.01)', async () => {
      const apiRes = await api.svcPayoff.getProrateAmount(accountPk, isoDate);
      expect(apiRes.ok, `getProrateAmount HTTP ${apiRes.status}`).toBeTruthy();
      const apiAmount = Number(apiRes.body);
      console.log(`[CT-02] API getProrateAmount(${isoDate})=${apiAmount} displayed=${displayed}`);
      expect(Number.isFinite(apiAmount)).toBeTruthy();
      expect(Math.abs(displayed - apiAmount)).toBeLessThanOrEqual(0.01);
    });

    await test.step('"AS OF:" field retains the entered date', async () => {
      expect(await summary.getProratedDateValue()).toBe(uiDate);
    });

    await test.step('No new uown_sv_activity_log row (read-only operation) — rule #13', async () => {
      const logsAfter = (await db.getActivityLogsByAccount(accountPk)).length;
      console.log(`[CT-02] activity-log count before=${logsBefore} after=${logsAfter}`);
      expect(logsAfter, 'a read-only prorate calc must not create an activity-log row').toBe(logsBefore);
    });
  });

  test('CT-03 — changing the date recalculates with a different, correct value', async ({ page, api }) => {
    test.setTimeout(120_000);
    const summary = new ServicingAccountSummaryPage(page);
    const earlierUi = calculateDate(PRORATED_DATA.firstOffsetDays);
    const laterUi = calculateDate(PRORATED_DATA.secondOffsetDays);
    const laterIso = calculateDateISO(PRORATED_DATA.secondOffsetDays);

    await test.step('Open the modal', async () => {
      await summary.openProratedAmountModal();
    });

    let earlierAmount = NaN;
    let earlierText = '';
    await test.step(`Quote the earlier date ${earlierUi}`, async () => {
      await summary.setProratedDate(earlierUi);
      earlierText = await summary.waitForProratedResult();
      earlierAmount = parseMoney(earlierText);
      console.log(`[CT-03] earlier ${earlierUi} → "${earlierText}" (${earlierAmount})`);
      expect(earlierAmount).toBeGreaterThan(0);
    });

    let laterAmount = NaN;
    let laterText = '';
    await test.step(`Change to the later date ${laterUi} → result recalculates (not cached)`, async () => {
      await summary.setProratedDate(laterUi);
      // Wait for the field to change AWAY from the EXACT earlier rendered text (it is itself a
      // currency string, so a plain "has a digit" wait would return the stale value).
      laterText = await summary.waitForProratedResult({ notEqualTo: earlierText });
      laterAmount = parseMoney(laterText);
      console.log(`[CT-03] later ${laterUi} → "${laterText}" (${laterAmount})`);
      expect(laterAmount).toBeGreaterThan(0);
      expect(laterAmount, 'later-date payoff must differ from the earlier-date payoff').not.toBe(earlierAmount);
    });

    await test.step('Later date yields a higher payoff (daily accrual, BR-ACC-4)', async () => {
      expect(laterAmount).toBeGreaterThan(earlierAmount);
    });

    await test.step('New amount matches the API value for the new date (±$0.01)', async () => {
      const apiRes = await api.svcPayoff.getProrateAmount(accountPk, laterIso);
      expect(apiRes.ok, `getProrateAmount HTTP ${apiRes.status}`).toBeTruthy();
      const apiAmount = Number(apiRes.body);
      console.log(`[CT-03] API getProrateAmount(${laterIso})=${apiAmount} displayed=${laterAmount}`);
      expect(Math.abs(laterAmount - apiAmount)).toBeLessThanOrEqual(0.01);
    });

    await test.step('"AS OF:" field shows the new date', async () => {
      expect(await summary.getProratedDateValue()).toBe(laterUi);
    });
  });

  test('CT-04 — closing the modal produces no change to the account', async ({ page, db }) => {
    test.setTimeout(120_000);
    const summary = new ServicingAccountSummaryPage(page);

    // Capture state BEFORE opening the modal: UI status, DB status, and activity-log count.
    const statusBeforeUi = await summary.getAccountStatusFromSummaryBar();
    const statusBeforeDb = await db.getAccountStatus(accountPk);
    const logsBefore = (await db.getActivityLogsByAccount(accountPk)).length;
    console.log(`[CT-04] before: uiStatus=${statusBeforeUi} dbStatus=${statusBeforeDb} logs=${logsBefore}`);

    await test.step('Open and then close the Prorated Amount modal', async () => {
      await summary.openProratedAmountModal();
      await expect(summary.getProratedModal()).toBeVisible();
      await summary.closeProratedAmountModal();
    });

    await test.step('Modal is no longer displayed', async () => {
      await expect(summary.getProratedModal()).toBeHidden();
    });

    await test.step('Account status is unchanged (Account Summary Bar — UI)', async () => {
      const statusAfterUi = await summary.getAccountStatusFromSummaryBar();
      console.log(`[CT-04] uiStatus after=${statusAfterUi}`);
      expect(statusAfterUi).toBe(statusBeforeUi);
    });

    await test.step('Account status is unchanged (DB — authoritative)', async () => {
      const statusAfterDb = await db.getAccountStatus(accountPk);
      expect(statusAfterDb).toBe(statusBeforeDb);
    });

    await test.step('No new uown_sv_activity_log row after closing — rule #13', async () => {
      const logsAfter = (await db.getActivityLogsByAccount(accountPk)).length;
      console.log(`[CT-04] activity-log count before=${logsBefore} after=${logsAfter}`);
      expect(logsAfter, 'opening/closing the read-only calculator must not create an activity-log row').toBe(logsBefore);
    });
  });
});

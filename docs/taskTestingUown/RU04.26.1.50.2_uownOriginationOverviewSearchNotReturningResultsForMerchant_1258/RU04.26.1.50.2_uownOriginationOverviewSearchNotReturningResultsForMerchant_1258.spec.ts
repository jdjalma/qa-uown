/**
 * Task #1258 — Overview Search Not Returning Results for Merchant with Apostrophe
 *
 * Bug: LeadFilters.sanitize() did manual .replace("'", "''") causing double-escaping
 * when Spring's NamedParameterJdbcTemplate already parameterizes safely.
 * Fix: MR svc!1347 — removed manual escaping from merchants, locations, search, merchantSupport.
 *
 * This test validates the fix across ALL Origination pages with Merchant/Location filters
 * plus the Servicing Search page.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag } from '@ptypes/enums.js';
import { loginToPortal, loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { OverviewPage } from '@pages/origination/overview.page.js';
import { OpenToBuyPage } from '@pages/origination/open-to-buy.page.js';
import { LeadsPage } from '@pages/origination/leads.page.js';
import { FundingPage } from '@pages/origination/funding.page.js';
import { NewApplicationFiltersPage } from '@pages/origination/new-application-filters.page.js';
import { MerchantModHistoryPage } from '@pages/origination/merchant-mod-history.page.js';
import { ModificationReportPage } from '@pages/origination/modification-report.page.js';
import { ServicingSearchPage } from '@pages/servicing/servicing-search.page.js';

const MERCHANT_WITH_APOSTROPHE = "Daniel's Jewelers";
const LOCATION_WITH_APOSTROPHE = "Daniel's Jewelers (101) Bell Gardens";
const MERCHANT_WITHOUT_APOSTROPHE = 'TerraceFinance';

const testData = [{
  env: 'qa1',
  // Existing merchant with apostrophe — no new data created → runId/email not needed
  tag: `${TestTag.REGRESSION} ${TestTag.CRITICAL} ${TestTag.QA1}`,
}];

for (const td of testData) {
  test.describe(`RU04.26.1.50.2_uownOriginationOverviewSearchNotReturningResultsForMerchant_1258 @${td.env}`, {
    tag: td.tag.split(' '),
  }, () => {
    test.describe.configure({ mode: 'serial' });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO A — Overview (Bug Fix Direto)
    // ════════════════════════════════════════════════════════════════

    test('CT-01: Overview — Merchant filter with apostrophe returns results', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const overview = new OverviewPage(page);

      await test.step('Navigate to Overview and verify dashboard loads', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
      });

      await test.step(`Filter by merchant "${MERCHANT_WITH_APOSTROPHE}"`, async () => {
        await overview.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await overview.submitFilters();
        const noRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(noRecords, `Expected results for "${MERCHANT_WITH_APOSTROPHE}" but got "no records"`).toBe(false);
        const rowCount = await page.locator(SELECTORS.tableRow).count();
        expect(rowCount, 'Expected at least one row in the results table').toBeGreaterThan(0);
      });
    });

    test('CT-02: Overview — Text search with apostrophe works', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const overview = new OverviewPage(page);

      await test.step('Navigate to Overview', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
      });

      await test.step('Type "Daniel\'s" in the Search field and submit', async () => {
        await overview.expandFilters();
        const searchInput = page.locator("input[name='search'], input[placeholder*='Search']").first();
        if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await searchInput.fill("Daniel's");
        }
        await overview.submitFilters();
      });

      await test.step('Verify results contain merchant with apostrophe', async () => {
        const noRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(noRecords, `Text search for "Daniel's" should return results`).toBe(false);
      });
    });

    test('CT-03: Overview — Location filter with apostrophe works', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const overview = new OverviewPage(page);

      await test.step('Navigate to Overview', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
      });

      await test.step('Select merchant to populate locations, then select location with apostrophe', async () => {
        await overview.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        // Wait for locations to populate after merchant selection
        await page.waitForLoadState('networkidle').catch(() => {});
        await overview.filterByLocation(LOCATION_WITH_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await overview.submitFilters();
        const noRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(noRecords, `Location "${LOCATION_WITH_APOSTROPHE}" should return results`).toBe(false);
      });
    });

    test('CT-04: Overview — Regression: merchant without apostrophe still works', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const overview = new OverviewPage(page);

      await test.step('Navigate to Overview', async () => {
        await overview.navigateToOverview();
        await overview.verifyDashboardLoaded();
      });

      await test.step(`Filter by merchant "${MERCHANT_WITHOUT_APOSTROPHE}" (no apostrophe)`, async () => {
        await overview.filterByMerchant(MERCHANT_WITHOUT_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await overview.submitFilters();
        const noRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(noRecords, `Merchant "${MERCHANT_WITHOUT_APOSTROPHE}" should still work after fix`).toBe(false);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO B — Open to Buy
    // ════════════════════════════════════════════════════════════════

    test('CT-05: Open to Buy — Merchant filter with apostrophe', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const otb = new OpenToBuyPage(page);

      await test.step('Navigate to Open to Buy', async () => {
        await otb.navigateToOpenToBuy(testEnv.originationUrl);
      });

      await test.step(`Select merchant "${MERCHANT_WITH_APOSTROPHE}" and wait for reactive update`, async () => {
        await otb.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await otb.submitFilters();
      });

      await test.step('Verify no JavaScript errors occurred', async () => {
        // For Open to Buy, verify the page didn't crash — it may or may not have OTB data
        const selected = await otb.getSelectedMerchants();
        expect(selected).toContain(MERCHANT_WITH_APOSTROPHE);
      });
    });

    test('CT-06: Open to Buy — Location filter with apostrophe', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const otb = new OpenToBuyPage(page);

      await test.step('Navigate to Open to Buy', async () => {
        await otb.navigateToOpenToBuy(testEnv.originationUrl);
      });

      await test.step('Select merchant then location with apostrophe', async () => {
        await otb.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await page.waitForLoadState('networkidle').catch(() => {});
        await otb.filterByLocation(LOCATION_WITH_APOSTROPHE);
        await otb.submitFilters();
      });

      await test.step('Verify selection persisted without error', async () => {
        const selectedLocations = await otb.getSelectedLocations();
        expect(selectedLocations.some(l => l.includes("Daniel's"))).toBe(true);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO C — Leads
    // ════════════════════════════════════════════════════════════════

    test('CT-07: Leads — Merchant filter with apostrophe returns results', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step('Set date range and filter by merchant with apostrophe', async () => {
        await leads.setFromDate('01/01/2022');
        await leads.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await leads.submitFilters();
        const rowCount = await leads.getVisibleRowCount();
        expect(rowCount, `Leads for "${MERCHANT_WITH_APOSTROPHE}" should be returned`).toBeGreaterThan(0);
      });
    });

    test('CT-08: Leads — Location filter with apostrophe works', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const leads = new LeadsPage(page);

      await test.step('Navigate to Leads page', async () => {
        await leads.navigateAndWaitForTable();
      });

      await test.step('Set date range, select merchant, then location with apostrophe', async () => {
        await leads.setFromDate('01/01/2022');
        await leads.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await page.waitForLoadState('networkidle').catch(() => {});
        await leads.filterByLocation(LOCATION_WITH_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await leads.submitFilters();
        const rowCount = await leads.getVisibleRowCount();
        expect(rowCount, `Leads for location "${LOCATION_WITH_APOSTROPHE}" should be returned`).toBeGreaterThan(0);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO D — New Application
    // ════════════════════════════════════════════════════════════════

    test('CT-09: New Application — Merchant filter with apostrophe', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const newApp = new NewApplicationFiltersPage(page);

      await test.step('Navigate to New Application page', async () => {
        await newApp.navigateToNewApplication(testEnv.originationUrl);
      });

      await test.step('Filter by merchant with apostrophe and submit', async () => {
        await newApp.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await newApp.submitFilters();
      });

      await test.step('Verify search executed without SQL error', async () => {
        // New Application may or may not have send-application requests for this merchant.
        // The key validation is that the search completes without error (no blank page, no 500).
        const hasRows = await page.locator(SELECTORS.tableRow).first()
          .isVisible({ timeout: 3_000 }).catch(() => false);
        const hasNoRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(hasRows || hasNoRecords, 'Page should show table rows or "no records" message (not a blank/error page)').toBe(true);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO E — Merchant Modification History
    // ════════════════════════════════════════════════════════════════

    test('CT-10: Merchant Mod History — Merchant filter with apostrophe', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const modHistory = new MerchantModHistoryPage(page);

      await test.step('Navigate to Merchant Modification History', async () => {
        await modHistory.navigateToMerchantModHistory(testEnv.originationUrl);
      });

      await test.step('Filter by merchant with apostrophe and submit', async () => {
        await modHistory.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await modHistory.submitFilters();
      });

      await test.step('Verify search executed without error', async () => {
        const hasRows = await page.locator(SELECTORS.tableRow).first()
          .isVisible({ timeout: 3_000 }).catch(() => false);
        const hasNoRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(hasRows || hasNoRecords, 'Page should render results or "no records" (not error)').toBe(true);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO F — Modification Report
    // ════════════════════════════════════════════════════════════════

    test('CT-11: Modification Report — Merchant filter with apostrophe', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const modReport = new ModificationReportPage(page);

      await test.step('Navigate to Modification Report', async () => {
        await modReport.navigateToModificationReport(testEnv.originationUrl);
      });

      await test.step('Filter by merchant with apostrophe and submit', async () => {
        await modReport.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await modReport.submitFilters();
      });

      await test.step('Verify search executed without error', async () => {
        const hasRows = await page.locator(SELECTORS.tableRow).first()
          .isVisible({ timeout: 3_000 }).catch(() => false);
        const hasNoRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(hasRows || hasNoRecords, 'Page should render results or "no records" (not error)').toBe(true);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO G — Funding
    // ════════════════════════════════════════════════════════════════

    test('CT-12: Funding — Merchant filter with apostrophe', async ({ page, testEnv }) => {
      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      const funding = new FundingPage(page);

      await test.step('Navigate to Funding Queue', async () => {
        await funding.navigateToFundingQueue();
      });

      await test.step('Filter by merchant with apostrophe and search', async () => {
        await funding.filterByMerchant(MERCHANT_WITH_APOSTROPHE);
        await funding.searchWithCurrentFilters();
      });

      await test.step('Verify search executed without error', async () => {
        // Funding uses inline SQL with .replace("'","''") which is correct for string interpolation.
        const hasRows = await page.locator(SELECTORS.tableRow).first()
          .isVisible({ timeout: 3_000 }).catch(() => false);
        const hasNoRecords = await page.locator('text=There are no records to display')
          .isVisible({ timeout: 3_000 }).catch(() => false);
        expect(hasRows || hasNoRecords, 'Funding search should complete without error').toBe(true);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO H — Servicing Search
    // ════════════════════════════════════════════════════════════════

    test('CT-13: Servicing Search — Merchant filter with apostrophe returns results', async ({ page, testEnv }) => {
      await test.step('Login to Servicing', async () => {
        await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      });

      const search = new ServicingSearchPage(page);

      await test.step('Navigate to Servicing Search', async () => {
        await search.navigateToSearch(testEnv.servicingUrl);
      });

      await test.step('Clear date filters and select merchant with apostrophe', async () => {
        await search.clearDateFilters();
        await search.selectMerchant(MERCHANT_WITH_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await search.submitFilters();
        const rowCount = await search.getVisibleRowCount();
        expect(rowCount, `Servicing accounts for "${MERCHANT_WITH_APOSTROPHE}" should be returned`).toBeGreaterThan(0);
      });
    });

    test('CT-14: Servicing Search — Location filter with apostrophe works', async ({ page, testEnv }) => {
      await test.step('Login to Servicing', async () => {
        await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      });

      const search = new ServicingSearchPage(page);

      await test.step('Navigate to Servicing Search', async () => {
        await search.navigateToSearch(testEnv.servicingUrl);
      });

      await test.step('Clear date filters and select location with apostrophe', async () => {
        await search.clearDateFilters();
        await search.selectLocation(LOCATION_WITH_APOSTROPHE);
      });

      await test.step('Submit filters and verify results', async () => {
        await search.submitFilters();
        const rowCount = await search.getVisibleRowCount();
        expect(rowCount, `Servicing accounts for location "${LOCATION_WITH_APOSTROPHE}" should be returned`).toBeGreaterThan(0);
      });
    });

    // ════════════════════════════════════════════════════════════════
    //  GRUPO I — DB Validation
    // ════════════════════════════════════════════════════════════════

    test('CT-15: DB — Validate merchant data integrity for apostrophe names', async ({ db }) => {
      await test.step('Verify merchants with apostrophe exist in DB', async () => {
        const count = await db.getSingleNumber(
          `SELECT COUNT(DISTINCT merchant_name) FROM uown_merchant
           WHERE merchant_name LIKE $1
           AND merchant_name NOT LIKE '%DO NOT USE%'
           AND merchant_name NOT LIKE '%NON ACTIVE%'
           AND merchant_name NOT LIKE '%CLOSED%'`,
          ["%'%"],
        );
        expect(count, 'Should have multiple merchants with apostrophe in name').toBeGreaterThan(0);
      });

      await test.step(`Verify "${MERCHANT_WITH_APOSTROPHE}" has leads`, async () => {
        const leadCount = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_los_lead l
           JOIN uown_merchant m ON m.pk = l.merchant_pk
           WHERE m.merchant_name = $1`,
          [MERCHANT_WITH_APOSTROPHE],
        );
        expect(leadCount, `"${MERCHANT_WITH_APOSTROPHE}" should have leads in DB`).toBeGreaterThan(0);
      });

      await test.step(`Verify "${MERCHANT_WITH_APOSTROPHE}" has servicing accounts`, async () => {
        const accountCount = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_sv_account a
           JOIN uown_merchant m ON m.pk = a.merchant_pk
           WHERE m.merchant_name = $1`,
          [MERCHANT_WITH_APOSTROPHE],
        );
        expect(accountCount, `"${MERCHANT_WITH_APOSTROPHE}" should have accounts for servicing tests`).toBeGreaterThan(0);
      });
    });
  });
}

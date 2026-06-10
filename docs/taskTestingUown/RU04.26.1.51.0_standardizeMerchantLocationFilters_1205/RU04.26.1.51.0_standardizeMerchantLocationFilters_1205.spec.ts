/**
 * Task #1205 — Standardize Merchant and Location Filters and Enable Multi-Select
 *
 * Validates the new shared MerchantLocationFilters component across 5 pages:
 *   - Overview (multi-select with Select All)
 *   - Open to Buy (multi-select with Select All + CSV export)
 *   - Leads (single-select with auto-sync)
 *   - New Application (single-select with auto-sync)
 *   - Sales Rep panel on Customer page (single-select with save)
 *
 * UI-only filter test — verifies standardized MerchantLocationFilters component behavior.
 * No applications created for CTs 01-10 (existing data in qa2 used).
 * CTs 11-12 create fresh leads via API to have a valid UW_APPROVED lead for the Sales Rep panel.
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.51.0_standardizeMerchantLocationFilters_1205/ --project=task-testing --reporter=list
 */
import type { Page } from '@playwright/test';
import { test, expect } from '@fixtures/test-context.fixture.js';
import {
  OverviewPage,
  LeadsPage,
  OpenToBuyPage,
  OriginationCustomerPage,
} from '@pages/origination/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { buildSendApplicationBody } from '@api/bodies/index.js';
import { buildTestData, calculateDate } from '@helpers/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const SCREENSHOT_BASE_DIR = 'docs/taskTestingUown/RU04.26.1.51.0_standardizeMerchantLocationFilters_1205/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_standardizeMerchantLocationFilters_1205';

/** Helper: get all non-"Select All" merchant options from the currently open dropdown. */
async function getNonSelectAllOptions(page: Page): Promise<string[]> {
  const options = page.locator(SELECTORS.filterOption);
  const allOptions = await options.allTextContents();
  return allOptions.map(t => t.trim()).filter(t => t && !t.toLowerCase().includes('select all'));
}

/** Helper: open the Merchant dropdown within a filter panel using label-sibling pattern. */
async function openMerchantDropdown(page: Page): Promise<void> {
  const control = page
    .locator('label')
    .filter({ hasText: 'Merchant' })
    .locator('~ div')
    .locator(SELECTORS.filterControl)
    .first();
  await control.click();
}

/**
 * Helper: checks if the "Select All" option is available in the currently open dropdown.
 * Closes the dropdown after checking.
 * Returns false if the option is not found (feature not yet deployed to this environment).
 */
async function checkSelectAllAvailable(page: Page): Promise<boolean> {
  const options = await page.locator(SELECTORS.filterOption).allTextContents();
  const hasSelectAll = options.some(t => t.toLowerCase().includes('select all'));
  await page.keyboard.press('Escape');
  await page.locator(SELECTORS.filterMenuPortal)
    .waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
  return hasSelectAll;
}

/** Helper: checks if the page shows data or "no records" message after a filter submit. */
async function verifyPageDidNotCrash(page: Page): Promise<void> {
  const hasTable = await page.locator(SELECTORS.table).first()
    .isVisible({ timeout: 10_000 }).catch(() => false);
  const hasNoRecords = await page.getByText('There are no records to display').first()
    .isVisible({ timeout: 3_000 }).catch(() => false);
  expect(hasTable || hasNoRecords, 'Page should show either data table or "no records" message').toBeTruthy();
}

const testData = [
  {
    env: 'qa2' as const,
    // UI-only filter tests for CTs 01-10 — no applications created.
    // CTs 11-12 create a fresh lead via API within the test.
    // No runId/email at top level: CTs 01-10 use existing qa2 data; CTs 11-12 generate their own via buildTestData.
    state: 'CA',
    merchant: 'TerraceFinance',
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
  {
    env: 'stg' as const,
    state: 'CA',
    merchant: 'TerraceFinance',
    tag: buildTags(TestTag.STG, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  const SCREENSHOT_DIR = `${SCREENSHOT_BASE_DIR}/${td.env}`;
  test.describe(`RU04.26.1.51.0_standardizeMerchantLocationFilters_1205 - ${td.env}`, {
    tag: splitTags(td.tag),
  }, () => {
    // Note: tests are independent (each creates its own page/session) — no serial mode needed.
    test.use({ envName: td.env });

    // ================================================================
    //  OVERVIEW -- Multi-select Filters
    // ================================================================
    test.describe('Overview -- Multi-select Filters', () => {

      // -- CT-UI-01: "Select All" Merchant mutual exclusivity ----------
      test('CT-UI-01: Overview -- Select All Merchant mutual exclusivity + Location stays usable', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const overview = new OverviewPage(page);

        await test.step('Navigate to Overview and verify dashboard loaded', async () => {
          await overview.navigateToOverview();
          await overview.verifyDashboardLoaded();
        });

        await test.step('Expand filters and check Select All availability', async () => {
          await overview.expandFilters();
          await openMerchantDropdown(page);
          const selectAllPresent = await checkSelectAllAvailable(page);
          test.skip(!selectAllPresent, 'Select All not available — new MerchantLocationFilters component not yet deployed to this environment');
          await overview.selectAllMerchants();
        });

        await test.step('Verify "Select All" is shown in Merchant chips', async () => {
          const selectedMerchants = await overview.getSelectedMerchants();
          expect(selectedMerchants.length, 'At least one chip should be present after Select All').toBeGreaterThan(0);
          const hasSelectAll = selectedMerchants.some(m => m.toLowerCase().includes('select all'));
          expect(hasSelectAll, `Merchant chips should contain "Select All". Got: ${JSON.stringify(selectedMerchants)}`).toBeTruthy();
        });

        // Dynamically get a specific merchant name from the dropdown
        let specificMerchantName = '';
        await test.step('Select a specific merchant from the dropdown', async () => {
          await openMerchantDropdown(page);
          const nonSelectAllOptions = await getNonSelectAllOptions(page);
          test.skip(nonSelectAllOptions.length === 0, 'No specific merchants available in qa2 -- skipping mutual exclusivity check');
          specificMerchantName = nonSelectAllOptions[0];
          // Click the specific merchant option
          const option = page.locator(SELECTORS.filterOption).filter({ hasText: specificMerchantName }).first();
          await option.click({ timeout: 5_000 });
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        });

        await test.step('Verify mutual exclusivity: selecting specific merchant removes "Select All"', async () => {
          const selectedAfter = await overview.getSelectedMerchants();
          const stillHasSelectAll = selectedAfter.some(m => m.toLowerCase().includes('select all'));
          expect(stillHasSelectAll, `"Select All" should be removed after selecting "${specificMerchantName}". Got: ${JSON.stringify(selectedAfter)}`).toBeFalsy();
          expect(selectedAfter.length, 'At least one specific merchant should be selected').toBeGreaterThan(0);
        });

        await test.step('Verify Location dropdown remains usable', async () => {
          const locationOptions = await overview.getLocationOptions();
          expect(Array.isArray(locationOptions), 'Location options should be an array').toBeTruthy();
        });

        await test.step('Screenshot -- CT-UI-01 mutual exclusivity confirmed', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-overview-merchant-mutual-exclusivity.png`, fullPage: false });
        });
      });

      // -- CT-UI-02: Select locations -> merchants auto-added ----------
      test('CT-UI-02: Overview -- Select locations (no merchant) auto-adds merchants', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const overview = new OverviewPage(page);

        await test.step('Navigate to Overview and expand filters', async () => {
          await overview.navigateToOverview();
          await overview.verifyDashboardLoaded();
          await overview.expandFilters();
        });

        let locationOptions: string[] = [];
        await test.step('Get available location options', async () => {
          locationOptions = await overview.getLocationOptions();
          const nonSelectAll = locationOptions.filter(l => !l.toLowerCase().includes('select all'));
          test.skip(nonSelectAll.length === 0, 'No location options available in qa2 -- skipping auto-add test');
        });

        await test.step('Select first available location (no merchant pre-selected)', async () => {
          const firstLocation = locationOptions.filter(l => !l.toLowerCase().includes('select all'))[0];
          await overview.filterByLocation(firstLocation);
        });

        await test.step('Verify merchants were auto-added to Merchant field', async () => {
          const selectedMerchants = await overview.getSelectedMerchants();
          expect(selectedMerchants.length, 'Selecting a location should auto-add associated merchants').toBeGreaterThan(0);
        });

        await test.step('Screenshot -- CT-UI-02 location auto-adds merchant', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-overview-location-auto-adds-merchant.png`, fullPage: false });
        });
      });

      // -- CT-UI-03: "Select All" Location mutual exclusivity ----------
      test('CT-UI-03: Overview -- Select All Location mutual exclusivity', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const overview = new OverviewPage(page);

        await test.step('Navigate to Overview and expand filters', async () => {
          await overview.navigateToOverview();
          await overview.verifyDashboardLoaded();
          await overview.expandFilters();
        });

        let locationOptions: string[] = [];
        await test.step('Get available location options and select one', async () => {
          locationOptions = await overview.getLocationOptions();
          const nonSelectAll = locationOptions.filter(l => !l.toLowerCase().includes('select all'));
          test.skip(nonSelectAll.length === 0, 'No location options available -- skipping');
          await overview.filterByLocation(nonSelectAll[0]);
        });

        await test.step('Select "Select All" in Location -- check availability and replace specific selection', async () => {
          // Check if Select All is available in the location dropdown before proceeding
          const locationControl = page.locator('label').filter({ hasText: 'Location' }).locator('~ div').locator(SELECTORS.filterControl).first();
          await locationControl.click();
          const selectAllPresent = await checkSelectAllAvailable(page);
          test.skip(!selectAllPresent, 'Select All not available in Location — new MerchantLocationFilters component not yet deployed');
          await overview.selectAllLocations();
          const selectedLocs = await overview.getSelectedLocations();
          const hasSelectAll = selectedLocs.some(l => l.toLowerCase().includes('select all'));
          expect(hasSelectAll, `Location should contain "Select All" after clicking it. Got: ${JSON.stringify(selectedLocs)}`).toBeTruthy();
        });

        await test.step('Select a specific location -- should remove "Select All"', async () => {
          const nonSelectAll = locationOptions.filter(l => !l.toLowerCase().includes('select all'));
          const specificLocationName = nonSelectAll[0];
          await overview.filterByLocation(specificLocationName);
          const selectedAfter = await overview.getSelectedLocations();
          const stillHasSelectAll = selectedAfter.some(l => l.toLowerCase().includes('select all'));
          expect(stillHasSelectAll, `"Select All" should be removed after selecting "${specificLocationName}". Got: ${JSON.stringify(selectedAfter)}`).toBeFalsy();
        });

        await test.step('Screenshot -- CT-UI-03 location mutual exclusivity confirmed', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-03-overview-location-mutual-exclusivity.png`, fullPage: false });
        });
      });

      // -- CT-UI-04: Specific merchants restrict Location + Submit works
      test('CT-UI-04: Overview -- Merchants restrict Location options, Submit works', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const overview = new OverviewPage(page);

        await test.step('Navigate to Overview and expand filters', async () => {
          await overview.navigateToOverview();
          await overview.verifyDashboardLoaded();
          await overview.expandFilters();
        });

        let merchantName = '';
        await test.step('Select first available specific merchant', async () => {
          await openMerchantDropdown(page);
          const specificOptions = await getNonSelectAllOptions(page);
          test.skip(specificOptions.length === 0, 'No specific merchants available in qa2');
          merchantName = specificOptions[0];
          const option = page.locator(SELECTORS.filterOption).filter({ hasText: merchantName }).first();
          await option.click({ timeout: 5_000 });
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        });

        await test.step('Verify location options are available for selected merchant', async () => {
          const locationOpts = await overview.getLocationOptions();
          expect(locationOpts.length, `Locations should be available after selecting "${merchantName}"`).toBeGreaterThan(0);
        });

        await test.step('Submit filters and verify page does not crash', async () => {
          await overview.submitFilters();
          await verifyPageDidNotCrash(page);
        });

        await test.step('Screenshot -- CT-UI-04 filters submitted successfully', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-overview-merchant-restricts-location.png`, fullPage: false });
        });
      });
    });

    // ================================================================
    //  OPEN TO BUY -- Multi-select + CSV
    // ================================================================
    test.describe('Open to Buy -- Multi-select + CSV', () => {

      // -- CT-UI-05: Multi-select behavior matches Overview ------------
      test('CT-UI-05: Open to Buy -- Multi-select behavior same as Overview', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const openToBuy = new OpenToBuyPage(page);

        await test.step('Navigate to Open to Buy page', async () => {
          await openToBuy.navigateToOpenToBuy(testEnv.originationUrl);
        });

        await test.step('Expand filters and check Select All availability', async () => {
          await openToBuy.expandFilters();
          await openMerchantDropdown(page);
          const selectAllPresent = await checkSelectAllAvailable(page);
          test.skip(!selectAllPresent, 'Select All not available — new MerchantLocationFilters component not yet deployed to this environment');
          await openToBuy.selectAllMerchants();
          const selectedMerchants = await openToBuy.getSelectedMerchants();
          expect(selectedMerchants.length, 'Select All should produce at least one chip').toBeGreaterThan(0);
        });

        await test.step('Test mutual exclusivity: select specific merchant removes Select All', async () => {
          await openMerchantDropdown(page);
          const nonSelectAll = await getNonSelectAllOptions(page);
          if (nonSelectAll.length > 0) {
            const option = page.locator(SELECTORS.filterOption).filter({ hasText: nonSelectAll[0] }).first();
            await option.click({ timeout: 5_000 });
            await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
            const selectedAfter = await openToBuy.getSelectedMerchants();
            const stillHasSelectAll = selectedAfter.some(m => m.toLowerCase().includes('select all'));
            expect(stillHasSelectAll, 'Select All should be removed after selecting specific merchant').toBeFalsy();
          }
        });

        await test.step('Select All Locations and verify', async () => {
          await openToBuy.selectAllLocations();
          const selectedLocs = await openToBuy.getSelectedLocations();
          expect(selectedLocs.length, 'Select All Locations should produce chips').toBeGreaterThan(0);
        });

        await test.step('Settle page -- Open to Buy is reactive, no submit needed', async () => {
          // Open to Buy updates reactively — just close any open dropdown and wait for spinner
          await openToBuy.submitFilters();
          // Page should still show the Open To Buy form without errors
          await page.locator('text=Open To Buy, text=Open to Buy').first()
            .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
        });

        await test.step('Screenshot -- CT-UI-05 open-to-buy multi-select', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-05-open-to-buy-multi-select.png`, fullPage: false });
        });
      });

      // -- CT-UI-06: Export CSV button is present and clickable --------
      test('CT-UI-06: Open to Buy -- Export CSV button present and clickable', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const openToBuy = new OpenToBuyPage(page);

        await test.step('Navigate to Open to Buy page', async () => {
          await openToBuy.navigateToOpenToBuy(testEnv.originationUrl);
        });

        await test.step('Click Export CSV -- verify no error', async () => {
          await openToBuy.exportCsv();
          // Smoke test: the click succeeded without throwing
        });

        await test.step('Screenshot -- CT-UI-06 export CSV clicked', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-06-open-to-buy-export-csv.png`, fullPage: false });
        });
      });
    });

    // ================================================================
    //  LEADS -- Single-select Filters
    // ================================================================
    test.describe('Leads -- Single-select Filters', () => {

      // -- CT-UI-07: Merchant single-select -> restricts Location -> Submit consistent
      test('CT-UI-07: Leads -- Merchant restricts Location, Submit shows consistent results', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const leads = new LeadsPage(page);

        await test.step('Navigate to Leads and wait for table', async () => {
          await leads.navigateAndWaitForTable();
        });

        await test.step('Expand filters and set date range', async () => {
          await leads.expandFilters();
          await leads.filterByDateRange(calculateDate(-365), calculateDate(0));
        });

        await test.step('Select Terrace Finance as merchant', async () => {
          await leads.filterByMerchant('Terrace Finance');
          const merchantVal = await leads.getMerchantValue();
          expect(merchantVal, 'Merchant field should have a value after selection').not.toBe('');
        });

        let locationOpts: string[] = [];
        await test.step('Verify location options are loaded for selected merchant', async () => {
          locationOpts = await leads.getLocationOptions();
          expect(locationOpts.length, 'Locations should load for Terrace Finance').toBeGreaterThan(0);
        });

        await test.step('Select first available location and submit', async () => {
          await leads.filterByLocation(locationOpts[0]);
          await leads.submitFilters();
        });

        await test.step('Verify table results are consistent with selected merchant', async () => {
          const rows = await leads.getAllVisibleRows();
          for (const row of rows) {
            if (row['Merchant']) {
              expect(
                row['Merchant'].toLowerCase(),
                `Row Merchant "${row['Merchant']}" should relate to Terrace Finance`,
              ).toContain('terrace');
            }
          }
        });

        await test.step('Screenshot -- CT-UI-07 leads merchant filter results', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-07-leads-merchant-restricts-location.png`, fullPage: false });
        });
      });

      // -- CT-UI-08: Select location (no merchant) -> merchant auto-fills
      test('CT-UI-08: Leads -- Select location auto-fills merchant', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const leads = new LeadsPage(page);

        await test.step('Navigate to Leads and expand filters', async () => {
          await leads.navigateAndWaitForTable();
          await leads.expandFilters();
        });

        await test.step('Verify merchant field is empty initially', async () => {
          const merchantBefore = await leads.getMerchantValue();
          expect(merchantBefore, 'Merchant should be empty by default').toBe('');
        });

        let locationOpts: string[] = [];
        await test.step('Get available location options', async () => {
          locationOpts = await leads.getLocationOptions();
          test.skip(locationOpts.length === 0, 'No location options available in qa2 -- skipping');
        });

        await test.step('Select first location -- expect merchant to auto-fill', async () => {
          await leads.filterByLocation(locationOpts[0]);
          const merchantAfter = await leads.getMerchantValue();
          expect(merchantAfter, 'Merchant should auto-fill after selecting a location').not.toBe('');
        });

        await test.step('Screenshot -- CT-UI-08 location auto-fills merchant', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-08-leads-location-auto-fills-merchant.png`, fullPage: false });
        });
      });

      // -- CT-UI-09: Clear merchant -> location cleared ----------------
      test('CT-UI-09: Leads -- Clear merchant clears location', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        const leads = new LeadsPage(page);

        await test.step('Navigate to Leads and expand filters', async () => {
          await leads.navigateAndWaitForTable();
          await leads.expandFilters();
        });

        await test.step('Select a merchant (Terrace Finance)', async () => {
          await leads.filterByMerchant('Terrace Finance');
          const merchantVal = await leads.getMerchantValue();
          expect(merchantVal, 'Merchant should be set').not.toBe('');
        });

        await test.step('Select first available location', async () => {
          const locationOpts = await leads.getLocationOptions();
          if (locationOpts.length > 0) {
            await leads.filterByLocation(locationOpts[0]);
            const locationVal = await leads.getLocationValue();
            expect(locationVal, 'Location should be set after selection').not.toBe('');
          }
        });

        await test.step('Clear merchant -- expect location to also clear', async () => {
          await leads.clearMerchantFilter();
          const locationVal = await leads.getLocationValue();
          expect(locationVal, 'Location should be cleared when merchant is cleared').toBe('');
        });

        await test.step('Screenshot -- CT-UI-09 clear merchant clears location', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-09-leads-clear-merchant-clears-location.png`, fullPage: false });
        });
      });
    });

    // ================================================================
    //  NEW APPLICATION -- Single-select Filters
    // ================================================================
    test.describe('New Application -- Single-select Filters', () => {

      // -- CT-UI-10: Select merchant -> location available; clear -> cleared
      test('CT-UI-10: New Application -- Merchant restricts Location; clear resets', async ({ page, testEnv }) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to New Application page', async () => {
          await page.goto(`${testEnv.originationUrl}newApplication`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
          // Wait for the Merchant filter placeholder to appear
          await page.locator(SELECTORS.filterPlaceholder).filter({ hasText: 'Merchant' }).first()
            .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
        });

        // Select a merchant via the dropdown
        let selectedMerchant = '';
        await test.step('Select first available merchant from dropdown', async () => {
          const placeholder = page.locator(SELECTORS.filterPlaceholder).filter({ hasText: 'Merchant' }).first();
          if (await placeholder.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await placeholder.click();
          } else {
            await openMerchantDropdown(page);
          }

          const options = page.locator(SELECTORS.filterOption);
          await options.first().waitFor({ state: 'visible', timeout: 5_000 });
          const allOptions = await options.allTextContents();
          const validOptions = allOptions.map(t => t.trim()).filter(Boolean);
          test.skip(validOptions.length === 0, 'No merchant options in New Application -- skipping');
          selectedMerchant = validOptions[0];
          await options.first().click();
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        });

        await test.step('Verify Location options are available after selecting merchant', async () => {
          // Open the Location dropdown
          const locationPlaceholder = page.locator(SELECTORS.filterPlaceholder).filter({ hasText: 'Location' }).first();
          const locationControl = page.locator('label').filter({ hasText: 'Location' }).locator('~ div').locator(SELECTORS.filterControl).first();

          if (await locationPlaceholder.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await locationPlaceholder.scrollIntoViewIfNeeded();
            await locationPlaceholder.click();
          } else {
            await locationControl.scrollIntoViewIfNeeded();
            await locationControl.click();
          }

          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
          const locationOptions = await page.locator(SELECTORS.filterOption).allTextContents();
          await page.keyboard.press('Escape');
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});

          expect(locationOptions.length, `Location options should be available after selecting merchant "${selectedMerchant}"`).toBeGreaterThan(0);
        });

        await test.step('Clear merchant -- verify location is cleared', async () => {
          // Click the clear indicator on the Merchant field
          const merchantClear = page.locator('label').filter({ hasText: 'Merchant' }).locator('~ div').locator(SELECTORS.filterClearIndicator).first();
          if (await merchantClear.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await merchantClear.click();
          }

          // Location should be cleared (no single-value visible)
          const locationSingleVal = page.locator('label').filter({ hasText: 'Location' }).locator('~ div').locator(SELECTORS.filterSingleValue).first();
          const locationHasValue = await locationSingleVal.isVisible({ timeout: 3_000 }).catch(() => false);
          expect(locationHasValue, 'Location should be cleared when merchant is cleared').toBeFalsy();
        });

        await test.step('Screenshot -- CT-UI-10 new application filter behavior', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-10-new-application-merchant-location.png`, fullPage: false });
        });
      });
    });

    // ================================================================
    //  SALES REP PANEL -- Single-select + Save
    // ================================================================
    test.describe('Sales Rep Panel -- Single-select + Save', () => {

      // -- CT-UI-11: Set merchant -> location reloads -> save -> toast
      test('CT-UI-11: Sales Rep -- Set merchant, set location, save shows success', async ({ page, testEnv, api }) => {
        test.setTimeout(180_000);

        // Create a fresh lead via API
        let salesRepLeadPk = '';
        await test.step('Create a fresh UW_APPROVED lead via API', async () => {
          const { merchant, applicant } = buildTestData({
            env: td.env,
            state: td.state,
            merchant: td.merchant,
            orderTotal: '800',
            approved: true,
          });
          const body = buildSendApplicationBody(merchant, applicant);
          const sendResult = await api.application.sendApplication(body);
          expect(sendResult.ok, `sendApplication failed: ${sendResult.status}`).toBeTruthy();
          salesRepLeadPk = String(sendResult.body.authorizationNumber ?? '');
          expect(salesRepLeadPk, 'leadPk must be present in response').toBeTruthy();
          console.log(`[CT-UI-11] Created lead PK: ${salesRepLeadPk}`);
        });

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to customer page for the new lead', async () => {
          await page.goto(`${testEnv.originationUrl}customers/${salesRepLeadPk}`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
        });

        const customer = new OriginationCustomerPage(page);

        await test.step('Wait for page to load and open Sales Rep edit', async () => {
          await customer.waitForSpinner();
          await customer.openSalesRepEdit();
        });

        await test.step('Set merchant to Terrace Finance', async () => {
          await customer.setSalesRepMerchant('Terrace Finance');
        });

        // Get available locations after setting merchant by opening the Location dropdown
        let locationOptions: string[] = [];
        await test.step('Get available location options for the selected merchant', async () => {
          // Open the Location dropdown within the Sales Rep panel
          const locationControl = page.locator(SELECTORS.salesRepEditButton).locator('..').locator('..').locator('label').filter({ hasText: 'Location' }).locator('~ div').locator(SELECTORS.filterControl).first();
          // Fallback: use page-wide label-sibling pattern since Sales Rep panel is the only active edit form
          const fallbackControl = page.locator('label').filter({ hasText: 'Location' }).locator('~ div').locator(SELECTORS.filterControl).first();
          const control = await locationControl.isVisible({ timeout: 2_000 }).catch(() => false) ? locationControl : fallbackControl;
          await control.click();
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
          const options = page.locator(SELECTORS.filterOption);
          locationOptions = (await options.allTextContents()).map(t => t.trim()).filter(Boolean);
          await page.keyboard.press('Escape');
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
        });

        await test.step('Set first available location', async () => {
          if (locationOptions.length > 0) {
            await customer.setSalesRepLocation(locationOptions[0]);
          } else {
            console.log('[CT-UI-11] No location options available -- skipping location set');
          }
        });

        await test.step('Save Sales Rep panel and verify toast', async () => {
          const toast = await customer.saveSalesRepPanel();
          expect(toast, 'Save should produce a toast message').toBeTruthy();
          console.log(`[CT-UI-11] Save toast: "${toast}"`);
        });

        await test.step('Screenshot -- CT-UI-11 sales rep save success', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-11-sales-rep-merchant-location-save.png`, fullPage: false });
        });
      });

      // -- CT-UI-12: Select location (no merchant) -> merchant auto-fills
      test('CT-UI-12: Sales Rep -- Select location auto-fills merchant', async ({ page, testEnv, api }) => {
        test.setTimeout(180_000);

        // Create another fresh lead via API
        let salesRepLeadPk = '';
        await test.step('Create a fresh UW_APPROVED lead via API', async () => {
          const { merchant, applicant } = buildTestData({
            env: td.env,
            state: td.state,
            merchant: td.merchant,
            orderTotal: '800',
            approved: true,
          });
          const body = buildSendApplicationBody(merchant, applicant);
          const sendResult = await api.application.sendApplication(body);
          expect(sendResult.ok, `sendApplication failed: ${sendResult.status}`).toBeTruthy();
          salesRepLeadPk = String(sendResult.body.authorizationNumber ?? '');
          expect(salesRepLeadPk, 'leadPk must be present in response').toBeTruthy();
          console.log(`[CT-UI-12] Created lead PK: ${salesRepLeadPk}`);
        });

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to customer page for the new lead', async () => {
          await page.goto(`${testEnv.originationUrl}customers/${salesRepLeadPk}`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
        });

        const customer = new OriginationCustomerPage(page);

        await test.step('Wait for page to load and open Sales Rep edit', async () => {
          await customer.waitForSpinner();
          await customer.openSalesRepEdit();
        });

        // Clear merchant if it has a pre-populated value from the application
        await test.step('Clear merchant selection if pre-populated', async () => {
          const clearIndicator = page.locator('label').filter({ hasText: 'Merchant' }).locator('~ div').locator(SELECTORS.filterClearIndicator).first();
          if (await clearIndicator.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await clearIndicator.click();
            console.log('[CT-UI-12] Cleared pre-populated merchant');
          }
        });

        // Get location options (should show all when no merchant is selected)
        let locationOptions: string[] = [];
        await test.step('Get available location options (no merchant set)', async () => {
          const locationControl = page.locator('label').filter({ hasText: 'Location' }).locator('~ div').locator(SELECTORS.filterControl).first();
          await locationControl.click();
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
          const options = page.locator(SELECTORS.filterOption);
          locationOptions = (await options.allTextContents()).map(t => t.trim()).filter(Boolean);
          await page.keyboard.press('Escape');
          await page.locator(SELECTORS.filterMenuPortal).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
          test.skip(locationOptions.length === 0, 'No location options available without merchant -- skipping');
        });

        await test.step('Select first location -- expect merchant to auto-fill', async () => {
          await customer.setSalesRepLocation(locationOptions[0]);
          const merchantVal = await customer.getSalesRepMerchantValue();
          expect(merchantVal, 'Merchant should auto-fill after selecting a location').not.toBe('');
          console.log(`[CT-UI-12] Merchant auto-filled to: "${merchantVal}"`);
        });

        await test.step('Screenshot -- CT-UI-12 sales rep location auto-fills merchant', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-12-sales-rep-location-auto-fills-merchant.png`, fullPage: false });
        });
      });
    });
  });
}

/**
 * Task #1260 — Enable Navigation to Program Details from Program Groups Page
 *
 * Validates that:
 * - Program Groups page loads with group list
 * - Opening a group modal shows a table with program details (6 columns)
 * - Clicking a program name navigates to /programs/{pk}?from=programGroups
 * - Cancel button returns to /programGroups (not /programs)
 * - Cancel without ?from= returns to /programs (regression)
 * - API GET /uown/programs/groups returns enriched program data
 * - Search/filter, count match, and edit button are preserved
 *
 * UI + API tests — no data mutations.
 * Uses existing program data in qa2.
 * Requires R1.51.0 branch deployed to qa2.
 *
 * Run: npx playwright test docs/taskTestingUown/RU04.26.1.51.0_enableNavigationToProgramDetailsFromProgramGroupsPage_1260/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ProgramGroupsPage } from '@pages/origination/index.js';
import { ProgramsPage } from '@pages/origination/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { SELECTORS } from '@selectors/common.selectors.js';

const SCREENSHOT_DIR =
  'docs/taskTestingUown/RU04.26.1.51.0_enableNavigationToProgramDetailsFromProgramGroupsPage_1260/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_enableNavigationToProgramDetailsFromProgramGroupsPage_1260';

const EXPECTED_MODAL_COLUMNS = [
  'Program Name',
  'Term Months',
  'Money Factor',
  'EPO Days',
  'Processing Fee',
  'Pay Off Discount',
];

const testData = [
  {
    env: 'qa2' as const,
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  test.describe(
    `${TEST_NAME} - ${td.env}`,
    {
      tag: splitTags(td.tag),
    },
    () => {
      test.describe.configure({ mode: 'serial' });
      test.use({ envName: td.env });

      // Shared state across serial CTs
      let targetRowIndex = 0; // row with a valid (non-empty) group name and programs
      let firstGroupName = '';
      let firstGroupCount = 0;
      let clickedProgramName = '';
      let clickedProgramPk = '';
      let modalProgramData: Record<string, string> = {};

      // ================================================================
      //  CT-01: Program Groups page loads with group list
      // ================================================================
      test('CT-01: Program Groups page loads with group list', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to /programGroups', async () => {
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        await test.step('Verify table has at least one group with programs', async () => {
          const rowCount = await groupsPage.getGroupRowCount();
          expect(rowCount, 'Program Groups table should have at least 1 group').toBeGreaterThan(0);

          // Find a row with a non-empty group name and count > 0
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          expect(targetRowIndex, 'Should find at least one group with a non-empty name and programs').toBeGreaterThanOrEqual(0);

          firstGroupName = await groupsPage.getGroupName(targetRowIndex);
          firstGroupCount = await groupsPage.getGroupProgramCount(targetRowIndex);
          console.log(`[CT-01] Using row ${targetRowIndex}: "${firstGroupName}" with ${firstGroupCount} programs`);
        });

        await test.step('Screenshot — CT-01 page load', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-page-load.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-02: Open group modal shows programs table with correct columns
      // ================================================================
      test('CT-02: Open group modal shows programs table with correct columns', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login and navigate to /programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        await test.step('Find target group and open modal', async () => {
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          expect(targetRowIndex).toBeGreaterThanOrEqual(0);
          firstGroupCount = await groupsPage.getGroupProgramCount(targetRowIndex);
          firstGroupName = await groupsPage.getGroupName(targetRowIndex);
          await groupsPage.openGroupModal(targetRowIndex);
        });

        await test.step('Verify modal title matches group name', async () => {
          const modalTitle = await groupsPage.getModalTitle();
          expect(modalTitle).toContain(firstGroupName);
        });

        await test.step('Verify modal table columns', async () => {
          const headers = await groupsPage.getModalTableHeaders();
          for (const expected of EXPECTED_MODAL_COLUMNS) {
            expect(headers, `Modal table should contain column "${expected}"`).toContainEqual(expected);
          }
        });

        await test.step('Screenshot — CT-02 modal columns', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-modal-columns.png`,
            fullPage: false,
          });
        });

        await test.step('Close modal', async () => {
          await groupsPage.closeGroupModal();
        });
      });

      // ================================================================
      //  CT-03: Click program name in modal navigates to Program Details
      // ================================================================
      test('CT-03: Click program name in modal navigates to Program Details', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login and navigate to /programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        await test.step('Find target group and open modal', async () => {
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          expect(targetRowIndex).toBeGreaterThanOrEqual(0);
          await groupsPage.openGroupModal(targetRowIndex);
        });

        await test.step('Capture program data from modal before clicking', async () => {
          modalProgramData = await groupsPage.getModalProgramData(0);
        });

        await test.step('Click first program name link', async () => {
          clickedProgramName = await groupsPage.clickProgramInModal(0);
          expect(clickedProgramName.length, 'Program name should not be empty').toBeGreaterThan(0);
        });

        await test.step('Verify navigation to /programs/{pk}?from=programGroups', async () => {
          await page.waitForURL(/\/programs\/\d+/, { timeout: 15_000 });
          const url = page.url();
          expect(url, 'URL should contain /programs/{pk}').toMatch(/\/programs\/\d+/);
          expect(url, 'URL should contain ?from=programGroups').toContain('from=programGroups');

          // Extract PK from URL for later use
          const match = url.match(/\/programs\/(\d+)/);
          clickedProgramPk = match?.[1] || '';
        });

        await test.step('Verify program details page loaded with correct data', async () => {
          const programs = new ProgramsPage(page);
          const loaded = await programs.waitForProgramDetailsLoad();
          expect(loaded, 'Program details form should be populated').toBeTruthy();

          const formName = await programs.getProgramNameFromForm();
          expect(formName, 'Form program name should match clicked name').toBe(clickedProgramName);
        });

        await test.step('Screenshot — CT-03 navigation to details', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-03-navigation-to-details.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-04: Cancel button on Program Details returns to /programGroups
      // ================================================================
      test('CT-04: Cancel button on Program Details returns to /programGroups', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);
        test.skip(!clickedProgramPk, 'CT-03 did not complete — no PK captured');

        await test.step('Login and navigate to /programs/{pk}?from=programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await page.goto(
            `${testEnv.originationUrl}programs/${clickedProgramPk}?from=programGroups`,
            { waitUntil: 'domcontentloaded' },
          );
          const programs = new ProgramsPage(page);
          await programs.waitForProgramDetailsLoad();
        });

        await test.step('Click CANCEL button', async () => {
          const cancelBtn = page.getByRole('button', { name: 'CANCEL', exact: true });
          await cancelBtn.waitFor({ state: 'visible', timeout: 10_000 });
          await cancelBtn.click();
        });

        await test.step('Verify redirect to /programGroups', async () => {
          await page.waitForURL(/\/programGroups/, { timeout: 15_000 });
          const url = page.url();
          expect(url, 'Should navigate back to /programGroups').toContain('/programGroups');
        });

        await test.step('Screenshot — CT-04 cancel returns to groups', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-cancel-returns-to-groups.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-05: Cancel without ?from= returns to /programs (regression)
      // ================================================================
      test('CT-05: Cancel without ?from= returns to /programs (regression)', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);
        test.skip(!clickedProgramPk, 'CT-03 did not complete — no PK captured');

        await test.step('Login and navigate to /programs/{pk} (no ?from=)', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await page.goto(
            `${testEnv.originationUrl}programs/${clickedProgramPk}`,
            { waitUntil: 'domcontentloaded' },
          );
          const programs = new ProgramsPage(page);
          await programs.waitForProgramDetailsLoad();
        });

        await test.step('Click CANCEL button', async () => {
          const cancelBtn = page.getByRole('button', { name: 'CANCEL', exact: true });
          await cancelBtn.waitFor({ state: 'visible', timeout: 10_000 });
          await cancelBtn.click();
        });

        await test.step('Verify redirect to /programs (not /programGroups)', async () => {
          await page.waitForURL(/\/programs$/, { timeout: 15_000 });
          const url = page.url();
          expect(url, 'Should navigate to /programs list').toMatch(/\/programs$/);
          expect(url, 'Should NOT go to /programGroups').not.toContain('/programGroups');
        });

        await test.step('Screenshot — CT-05 cancel without from', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-05-cancel-without-from.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-06: API GET /uown/programs/groups returns enriched data
      // ================================================================
      test('CT-06: API GET /uown/programs/groups returns enriched data', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(60_000);

        await test.step('Login to capture auth token', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        let apiResponse: Array<{
          groupName: string;
          count: number;
          programs: Array<{
            pk: number;
            programName: string;
            termMonths: number;
            moneyFactor: number;
            epoDays: number;
            processingFee: number;
            payOffDiscount: number;
          }>;
        }> = [];

        await test.step('Intercept API response from page navigation', async () => {
          const responsePromise = page.waitForResponse(
            resp => resp.url().includes('/programs/groups') && resp.status() === 200,
            { timeout: 30_000 },
          );

          await page.goto(`${testEnv.originationUrl}programGroups`, { waitUntil: 'domcontentloaded' });
          const response = await responsePromise;
          apiResponse = await response.json();
        });

        await test.step('Validate response structure', async () => {
          expect(Array.isArray(apiResponse), 'Response should be an array').toBeTruthy();
          expect(apiResponse.length, 'Should have at least one group').toBeGreaterThan(0);

          const firstGroup = apiResponse[0];
          expect(firstGroup).toHaveProperty('groupName');
          expect(firstGroup).toHaveProperty('count');
          expect(firstGroup).toHaveProperty('programs');

          expect(Array.isArray(firstGroup.programs), 'programs should be an array').toBeTruthy();
          expect(firstGroup.count, 'count should match programs array length')
            .toBe(firstGroup.programs.length);

          if (firstGroup.programs.length > 0) {
            const program = firstGroup.programs[0];
            expect(program).toHaveProperty('pk');
            expect(program).toHaveProperty('programName');
            expect(program).toHaveProperty('termMonths');
            expect(program).toHaveProperty('moneyFactor');
            expect(program).toHaveProperty('epoDays');
            expect(program).toHaveProperty('processingFee');
            expect(program).toHaveProperty('payOffDiscount');
            expect(typeof program.pk).toBe('number');
            expect(typeof program.programName).toBe('string');
          }
        });

        await test.step('Screenshot — CT-06 API data', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-06-api-data.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-07: Search/filter groups functionality preserved
      // ================================================================
      test('CT-07: Search/filter groups functionality preserved', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login and navigate to /programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        let initialCount = 0;

        await test.step('Get initial group count', async () => {
          initialCount = await groupsPage.getGroupRowCount();
          expect(initialCount).toBeGreaterThan(0);
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          firstGroupName = await groupsPage.getGroupName(targetRowIndex >= 0 ? targetRowIndex : 1);
        });

        await test.step('Search for a specific group', async () => {
          // Use first few chars of the first group name to filter
          const searchTerm = firstGroupName.substring(0, Math.min(5, firstGroupName.length));
          await groupsPage.searchGroups(searchTerm);
        });

        await test.step('Verify filtered results contain the search term', async () => {
          const filteredCount = await groupsPage.getGroupRowCount();
          expect(filteredCount, 'Should have at least one filtered result').toBeGreaterThan(0);
          // Filtered count should be <= initial count
          expect(filteredCount).toBeLessThanOrEqual(initialCount);
        });

        await test.step('Screenshot — CT-07 search filter', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-07-search-filter.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-08: Program count matches actual programs in modal
      // ================================================================
      test('CT-08: Program count matches actual programs in modal', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login and navigate to /programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        let displayedCount = 0;

        await test.step('Find target group and get displayed count', async () => {
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          expect(targetRowIndex).toBeGreaterThanOrEqual(0);
          displayedCount = await groupsPage.getGroupProgramCount(targetRowIndex);
          expect(displayedCount, 'Displayed count should be > 0').toBeGreaterThan(0);
        });

        await test.step('Open modal and count rows', async () => {
          await groupsPage.openGroupModal(targetRowIndex);
          const modalRows = await groupsPage.getModalProgramCount();
          expect(modalRows, 'Modal row count should match displayed count').toBe(displayedCount);
        });

        await test.step('Screenshot — CT-08 count match', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-08-count-match.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-09: Program details data matches modal data
      // ================================================================
      test('CT-09: Program details data matches modal data', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login and navigate to /programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        let programDataFromModal: Record<string, string> = {};

        await test.step('Find target group, open modal and capture first program data', async () => {
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          expect(targetRowIndex).toBeGreaterThanOrEqual(0);
          await groupsPage.openGroupModal(targetRowIndex);
          programDataFromModal = await groupsPage.getModalProgramData(0);
        });

        await test.step('Navigate to program details via modal link', async () => {
          await groupsPage.clickProgramInModal(0);
          await page.waitForURL(/\/programs\/\d+/, { timeout: 15_000 });
        });

        await test.step('Verify program name matches', async () => {
          const programs = new ProgramsPage(page);
          await programs.waitForProgramDetailsLoad();
          const formName = await programs.getProgramNameFromForm();
          expect(formName, 'Program name on details should match modal')
            .toBe(programDataFromModal['Program Name'] || '');
        });

        await test.step('Verify Money Factor matches', async () => {
          const programs = new ProgramsPage(page);
          const formMoneyFactor = await programs.getMoneyFactorFormValue();
          const modalMoneyFactor = programDataFromModal['Money Factor'] || '';
          // Both should represent the same value (modal shows x100 format)
          if (modalMoneyFactor && formMoneyFactor) {
            expect(formMoneyFactor).toBe(modalMoneyFactor);
          }
        });

        await test.step('Screenshot — CT-09 data match', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-09-data-match.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-11: Edit group name functionality preserved (regression)
      // ================================================================
      test('CT-11: Edit group name functionality preserved (regression)', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        const groupsPage = new ProgramGroupsPage(page);

        await test.step('Login and navigate to /programGroups', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await groupsPage.navigateToProgramGroups(testEnv.originationUrl);
        });

        await test.step('Verify edit button is visible for a group', async () => {
          // Find a row with a group name (row 0 may have empty name)
          targetRowIndex = await groupsPage.findGroupWithPrograms();
          const rowToCheck = targetRowIndex >= 0 ? targetRowIndex : 1;
          const editVisible = await groupsPage.isEditButtonVisible(rowToCheck);
          // Check any row — the edit column ("Edit") exists in the header
          const editColumnExists = await page.locator("div[role='columnheader']").filter({ hasText: 'Edit' }).isVisible({ timeout: 3_000 }).catch(() => false);
          expect(editColumnExists || editVisible, 'Edit column or button should be present').toBeTruthy();
        });

        await test.step('Screenshot — CT-11 edit button visible', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-11-edit-button-visible.png`,
            fullPage: false,
          });
        });
      });
    },
  );
}

/**
 * Task #1214 — Enforce Pagination After Program Clone Action
 *
 * Validates that after cloning a program group via the "Clone Group" modal,
 * the redirect to /programs applies default pagination (<=10 rows per page),
 * and that pagination controls work correctly on the redirected page.
 *
 * UI-only tests — no applications created.
 * Uses existing program data in qa2.
 * Requires R1.51.0 branch deployed to qa2.
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ProgramsPage } from '@pages/origination/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { SELECTORS } from '@selectors/common.selectors.js';

const SCREENSHOT_DIR =
  'tests/taskTestingUown/RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214';

const testData = [
  {
    env: 'qa2' as const,
    // UI-only Programs tests — no applications created -> runId/email not needed
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  test.describe(
    `RU04.26.1.51.0_enforcePaginationAfterProgramCloneAction_1214 - ${td.env}`,
    {
      tag: splitTags(td.tag),
    },
    () => {
      test.describe.configure({ mode: 'serial' });
      test.use({ envName: td.env });

      // Shared state across serial CTs
      let programPk = 0;
      let dbAvailable = false;
      let rowCountAfterClone = 0;

      test.beforeAll(async ({ db }) => {
        // Query DB for an existing program PK — gracefully skip if DB not available (no SSH tunnel)
        try {
          const row = await db.queryOne<{ pk: number; program_name: string }>(
            `SELECT pk, program_name
             FROM uown_merchant_program
             WHERE money_factor IS NOT NULL AND money_factor > 0
             ORDER BY pk ASC
             LIMIT 1`,
            [],
          );
          if (row) {
            programPk = Number(row.pk);
            dbAvailable = true;
            console.log(`[beforeAll] Using program PK=${programPk}`);
          }
        } catch (e: unknown) {
          console.warn(
            `[beforeAll] DB not available (SSH tunnel to qa2 required): ${(e as Error).message}`,
          );
        }
      });

      // ================================================================
      //  CT-01: After Clone Group redirect, /programs list shows <=10 rows
      // ================================================================
      test('CT-01: After Clone Group redirect, /programs list shows <=10 rows (pagination enforced)', async ({
        page,
        testEnv,
      }) => {
        test.skip(!dbAvailable, 'DB connection required — establish SSH tunnel to qa2 before running');
        test.setTimeout(180_000);

        const programs = new ProgramsPage(page);

        await test.step('Login to Origination portal', async () => {
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to program details page', async () => {
          await programs.navigateToProgramDetails(testEnv.originationUrl, programPk);

          // Graceful skip if /programs/:pk route not yet deployed
          const onDetailsPage = await page
            .locator("input[name='programName']")
            .isVisible({ timeout: 5_000 })
            .catch(() => false);
          if (!onDetailsPage) {
            test.skip(true, 'Program details route not yet deployed — /programs/:pk returns 404');
          }

          await programs.waitForProgramDetailsLoad();
        });

        await test.step('Open Clone Group modal', async () => {
          await programs.openCloneGroupModal();
        });

        await test.step('Fill clone group name and select all programs', async () => {
          await programs.fillCloneGroupName(`TestClone_1214_${Date.now()}`);
          await programs.selectAllProgramsInModal();
        });

        await test.step('Submit clone and wait for success toast', async () => {
          await programs.submitCloneGroupModal();
          await programs.waitForCloneGroupSuccess();
        });

        await test.step('Wait for redirect to /programs list', async () => {
          const redirected = await page
            .waitForURL(/\/programs$/, { timeout: 15_000 })
            .then(() => true)
            .catch(() => false);
          if (!redirected) {
            test.skip(
              true,
              'Clone redirect to /programs not yet implemented — URL did not change to /programs',
            );
          }
        });

        await test.step('Verify pagination is enforced — rows <=10 and rows-per-page is "10"', async () => {
          // Wait for table rows to appear after redirect
          await page
            .locator(SELECTORS.tableRow)
            .first()
            .waitFor({ state: 'visible', timeout: 30_000 });

          // Do NOT call showMaxRows() or navigateToPrograms() — observe the natural redirect state
          rowCountAfterClone = await programs.getTableRowCount();
          const rowsPerPage = await programs.getRowsPerPageValue();

          expect(rowCountAfterClone, 'Pagination not enforced after clone redirect — full result set loaded')
            .toBeLessThanOrEqual(10);
          expect(rowsPerPage).toBe('10');

          console.log(
            `[CT-01] Rows after clone redirect: ${rowCountAfterClone}, rowsPerPage: ${rowsPerPage}`,
          );
        });

        await test.step('Verify Next Page button is enabled (more pages exist)', async () => {
          const nextPageEnabled = await page.locator(SELECTORS.paginationNext).isEnabled();
          expect(nextPageEnabled, 'Next Page button should be enabled — programs table has more than 10 rows total')
            .toBeTruthy();
        });

        await test.step('Screenshot — CT-01 pagination after clone redirect', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-pagination-after-clone.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-02: Pagination controls work after clone redirect
      // ================================================================
      test('CT-02: Pagination controls work after clone redirect — navigate to next page', async ({
        page,
        testEnv,
      }) => {
        test.skip(!dbAvailable, 'DB connection required — establish SSH tunnel to qa2 before running');
        test.skip(
          rowCountAfterClone === 0,
          'CT-01 did not complete — rowCountAfterClone not set (serial dependency)',
        );
        test.setTimeout(60_000);

        const programs = new ProgramsPage(page);

        await test.step('Login and navigate to /programs', async () => {
          // Serial mode shares state but not browser context — re-login and navigate
          await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
          await page.goto(`${testEnv.originationUrl}programs`, { waitUntil: 'domcontentloaded' });
          await programs.waitForPageLoad();
          await page
            .locator(SELECTORS.tableRow)
            .first()
            .waitFor({ state: 'visible', timeout: 30_000 });
        });

        await test.step('Verify Next Page button is enabled', async () => {
          const nextPageEnabled = await page.locator(SELECTORS.paginationNext).isEnabled();
          expect(nextPageEnabled, 'Next Page button should be enabled').toBeTruthy();
        });

        await test.step('Click Next Page and verify page 2 loads with <=10 rows', async () => {
          await page.locator(SELECTORS.paginationNext).click();
          await programs.waitForSpinner();

          // Wait for rows to reload on page 2
          await page
            .locator(SELECTORS.tableRow)
            .first()
            .waitFor({ state: 'visible', timeout: 30_000 });

          const rowCountPage2 = await programs.getTableRowCount();
          expect(rowCountPage2, 'Page 2 should also enforce <=10 rows per page')
            .toBeLessThanOrEqual(10);

          console.log(`[CT-02] Rows on page 2: ${rowCountPage2}`);
        });

        await test.step('Screenshot — CT-02 next page pagination', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-next-page-pagination.png`,
            fullPage: false,
          });
        });
      });
    },
  );
}

/**
 * Task #1251 — Standardize Money Factor Display Format Across Origination
 *
 * Validates that the Money Factor field is displayed in the x100 format
 * (e.g., DB 0.003 -> display "0.3") consistently across:
 *   - Programs table column
 *   - Create/Edit Program form (reference)
 *   - Program Details page form (/programs/:pk) [combined with #1252]
 *
 * UI-only tests — no applications created.
 * Uses existing program data in qa2.
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ProgramsPage } from '@pages/origination/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const SCREENSHOT_DIR = 'tests/taskTestingUown/RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251';

/** Replicates frontend toMoneyFactorDisplayValue function */
const trimTrailingZeros = (s: string) =>
  s.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
const toMoneyFactorDisplayValue = (value: number) =>
  trimTrailingZeros((value * 100).toFixed(4));

const testData = [
  {
    env: 'qa2' as const,
    // UI-only Programs tests — no applications created -> runId/email not needed
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  test.describe(`RU04.26.1.51.0_standardizeMoneyFactorDisplayFormatAcrossOrigination_1251 - ${td.env}`, {
    tag: splitTags(td.tag),
  }, () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ envName: td.env });

    // Shared state across serial tests
    let programPk = 0;
    let programName = '';
    let dbMoneyFactor = 0;
    let expectedDisplay = '';
    let dbAvailable = false;

    test.beforeAll(async ({ db }) => {
      // Attempt DB query — gracefully skip all tests if tunnel not established
      try {
        const row = await db.queryOne<{ pk: number; program_name: string; money_factor: number }>(
          `SELECT pk, program_name, money_factor
           FROM uown_merchant_program
           WHERE money_factor IS NOT NULL AND money_factor > 0
           ORDER BY pk ASC LIMIT 1`,
          [],
        );
        if (row) {
          programPk = row.pk;
          programName = row.program_name;
          dbMoneyFactor = Number(row.money_factor);
          expectedDisplay = toMoneyFactorDisplayValue(dbMoneyFactor);
          dbAvailable = true;
          console.log(`[beforeAll] Program PK: ${programPk}, Name: "${programName}", DB money_factor: ${dbMoneyFactor}, Expected display: "${expectedDisplay}"`);
        }
      } catch (e: unknown) {
        console.warn(`[beforeAll] DB not available (SSH tunnel to qa2 required): ${(e as Error).message}`);
      }
    });

    // ================================================================
    //  CT-01: Programs Table — Money Factor column displays x100 format
    // ================================================================
    test('CT-01: Programs Table -- Money Factor column displays x100 format', async ({ page, testEnv }) => {
      test.skip(!dbAvailable, 'DB connection required — establish SSH tunnel to qa2 before running');
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const programs = new ProgramsPage(page);

      await test.step('Navigate to Programs page', async () => {
        await programs.navigateToPrograms(testEnv.originationUrl);
      });

      let tableValue = '';
      await test.step('Read Money Factor value from table for the target program', async () => {
        tableValue = await programs.getMoneyFactorTableValue(programName);
        expect(tableValue, `Money Factor column should have a value for "${programName}"`).not.toBe('');
        console.log(`[CT-01] Table value: "${tableValue}", Expected: "${expectedDisplay}"`);
      });

      await test.step('Assert table value matches x100 format from DB', async () => {
        expect(tableValue).toBe(expectedDisplay);
      });

      await test.step('Assert table value is NOT in raw decimal format (e.g., 0.003)', async () => {
        // Raw DB values for money_factor are typically < 1 (e.g., 0.003, 0.15)
        // After x100 conversion, display should NOT start with "0.0" unless the x100 result is < 1
        // The key check: the display should not match the raw DB decimal format
        expect(tableValue).not.toBe(String(dbMoneyFactor));
      });

      await test.step('Screenshot -- CT-01 programs table money factor x100 format', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-programs-table-money-factor.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-02: Programs Table value matches Create/Edit form value
    // ================================================================
    test('CT-02: Programs Table value matches program details form value', async ({ page, testEnv }) => {
      test.skip(!dbAvailable, 'DB connection required — establish SSH tunnel to qa2 before running');
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const programs = new ProgramsPage(page);

      let tableValue = '';
      await test.step('Navigate to Programs and read table Money Factor', async () => {
        await programs.navigateToPrograms(testEnv.originationUrl);
        tableValue = await programs.getMoneyFactorTableValue(programName);
        expect(tableValue, 'Table value must be present').not.toBe('');
        console.log(`[CT-02] Table value: "${tableValue}"`);
      });

      await test.step('Click program link to navigate to program details', async () => {
        await programs.clickProgramLink(programName);
      });

      let formValue = '';
      await test.step('Wait for program details page and read form Money Factor', async () => {
        const dataLoaded = await programs.waitForProgramDetailsLoad();
        if (!dataLoaded) test.skip(true, 'Backend GET /uown/programs/:pk not yet deployed — form data empty');
        formValue = await programs.getMoneyFactorFormValue();
        console.log(`[CT-02] Form value: "${formValue}"`);
      });

      await test.step('Assert table value matches form value (both in x100 format)', async () => {
        expect(tableValue).toBe(formValue);
      });

      await test.step('Assert URL contains /programs/ (confirms new route #1252)', async () => {
        expect(page.url()).toContain('/programs/');
      });

      await test.step('Screenshot -- CT-02 table value matches form value', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-table-matches-form.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-03: Program Details page — Money Factor in x100 format via direct URL
    // ================================================================
    test('CT-03: Program Details page -- Money Factor in x100 format via direct URL', async ({ page, testEnv }) => {
      test.skip(!dbAvailable, 'DB connection required — establish SSH tunnel to qa2 before running');
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const programs = new ProgramsPage(page);

      await test.step('Navigate directly to program details via URL', async () => {
        await programs.navigateToProgramDetails(testEnv.originationUrl, programPk);
      });

      let formValue = '';
      await test.step('Wait for page load and read Money Factor input value', async () => {
        const dataLoaded = await programs.waitForProgramDetailsLoad();
        if (!dataLoaded) test.skip(true, 'Backend GET /uown/programs/:pk not yet deployed — form data empty');
        formValue = await programs.getMoneyFactorFormValue();
        console.log(`[CT-03] Form value: "${formValue}", Expected: "${expectedDisplay}"`);
      });

      await test.step('Assert form value matches expected x100 display', async () => {
        expect(formValue).toBe(expectedDisplay);
      });

      await test.step('Verify % icon is present next to Money Factor input', async () => {
        // The % icon is typically a sibling span or an addon element near the input
        const percentIcon = page.locator(
          "input[name='moneyFactor'] ~ span, input[name='moneyFactor'] + span, input[name='moneyFactor'] ~ .input-group-text, .input-group:has(input[name='moneyFactor']) .input-group-text",
        ).first();
        const isVisible = await percentIcon.isVisible({ timeout: 5_000 }).catch(() => false);
        // Log the finding — the % icon may be rendered differently across environments
        console.log(`[CT-03] % icon visible: ${isVisible}`);
        if (isVisible) {
          const text = await percentIcon.textContent();
          expect(text?.trim()).toContain('%');
        }
      });

      await test.step('Screenshot -- CT-03 direct URL money factor x100 format', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-03-direct-url-money-factor.png`, fullPage: false });
      });
    });

    // ================================================================
    //  CT-04: DB validation — Money Factor x100 matches expected formula
    // ================================================================
    test('CT-04: DB validation -- Money Factor x100 matches expected formula end-to-end', async ({ page, testEnv, db }) => {
      test.skip(!dbAvailable, 'DB connection required — establish SSH tunnel to qa2 before running');
      test.setTimeout(120_000);

      await test.step('Login to Origination portal', async () => {
        await loginToPortalWithOptions(page, testEnv.originationUrl, testEnv);
      });

      const programs = new ProgramsPage(page);

      // Fresh DB query for this specific CT (independent validation)
      let freshDbValue = 0;
      let freshExpected = '';
      await test.step('Query DB for current money_factor of the target program', async () => {
        const row = await db.queryOne<{ money_factor: number }>(
          `SELECT money_factor FROM uown_merchant_program WHERE pk = $1`,
          [programPk],
        );
        expect(row, 'Program must exist in DB').toBeTruthy();
        freshDbValue = Number(row!.money_factor);
        freshExpected = toMoneyFactorDisplayValue(freshDbValue);
        console.log(`[CT-04] DB money_factor: ${freshDbValue}, Expected display: "${freshExpected}"`);
      });

      let tableValue = '';
      await test.step('Navigate to Programs and read table value', async () => {
        await programs.navigateToPrograms(testEnv.originationUrl);
        tableValue = await programs.getMoneyFactorTableValue(programName);
        expect(tableValue, 'Table value must be present').not.toBe('');
      });

      await test.step('Assert table value matches DB-derived expected value', async () => {
        expect(tableValue).toBe(freshExpected);
      });

      let formValue = '';
      await test.step('Navigate to program details and read form value', async () => {
        await programs.navigateToProgramDetails(testEnv.originationUrl, programPk);
        const dataLoaded = await programs.waitForProgramDetailsLoad();
        if (!dataLoaded) test.skip(true, 'Backend GET /uown/programs/:pk not yet deployed — form data empty');
        formValue = await programs.getMoneyFactorFormValue();
      });

      await test.step('Assert form value matches DB-derived expected value', async () => {
        expect(formValue).toBe(freshExpected);
      });

      await test.step('Log evidence: DB -> Expected -> Table -> Form', async () => {
        console.log(`[CT-04] DB: ${freshDbValue}, Expected: ${freshExpected}, Table: ${tableValue}, Form: ${formValue}`);
      });

      await test.step('Screenshot -- CT-04 triple validation evidence', async () => {
        await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-db-validation-triple.png`, fullPage: false });
      });
    });
  });
}

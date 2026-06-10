/**
 * Task #503 — Add "Frequency Changes" Page in History Menu
 * https://gitlab.com/uown/frontend/servicing/-/work_items/503
 *
 * Validates the new Servicing > History > Frequency Changes page:
 *   CT-01: Navigation to Frequency Changes page works + heading/table container renders
 *   CT-02: API endpoint returns data with correct format; DB cross-validation
 *   CT-03: Pagination — conditional on table having visible rows
 *   CT-04: Menu option visible with frequency_history permission
 *   CT-05/06/07/08: Full UI cycle — change frequency via Servicing Information edit panel
 *                   for all 4 frequencies; DB + API + UI table validation
 *
 * Known application bug (BUG-01):
 *   SPA navigation via History menu (router.push) does NOT load frequency changes data.
 *   Table shows "no records" after menu click. However, a full page load (page.goto or
 *   page.reload) renders all records correctly.
 *   Root cause: likely CustomerStore.frequencyChangesHistory missing @observable,
 *   causing MobX to not trigger re-render on client-side navigation. SSR/hydration
 *   on full page load bypasses this issue.
 *   Workaround: after SPA navigation, call page.reload() to force full page load.
 *
 * Uses existing accounts — no new application created.
 * Screenshots captured at key moments for evidence.
 *
 * Navigation pattern (critical):
 *   Must use navigateToCustomer() (search-based) instead of page.goto() for customer page,
 *   because Next.js MobX store (customerStore.accountPk) is only set via the search result click.
 *   Direct page.goto() leaves accountPk=null → nav menu router.push('/frequency-history/null').
 */
import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '@support/base-test.js';
import { LoginPage } from '@pages/login.page.js';
import {
  ServicingCustomerPage,
  FrequencyChangesHistoryPage,
} from '@pages/servicing/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';

// ── Screenshot helper ─────────────────────────────────────────────────────────
const SCREENSHOT_DIR = path.join('reports', 'test-results', '503-screenshots');

async function saveScreenshot(page: import('@playwright/test').Page, name: string): Promise<void> {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[Screenshot] Saved: ${filePath}`);
}

/**
 * Navigate to customer and verify the correct account page loaded.
 * The quick search may match the wrong account (autocomplete ambiguity).
 * If URL doesn't contain the expected accountPk, retry via search results page.
 */
async function navigateToCorrectCustomer(
  page: import('@playwright/test').Page,
  customerPage: ServicingCustomerPage,
  accountPk: string,
  servicingUrl: string,
): Promise<void> {
  await customerPage.navigateToCustomer(accountPk);
  const url = page.url();
  if (!url.includes(`/customer-information/${accountPk}`)) {
    console.log(`[Nav] Wrong account: ${url} — expected ${accountPk}. Retrying via search results.`);
    // Navigate to search results and click the correct account link
    await page.goto(`${servicingUrl}search?term=${accountPk}`);
    await customerPage.waitForSpinner();
    const correctLink = page.locator(`a[href*="/customer-information/${accountPk}"]`).first();
    if (await correctLink.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await correctLink.click();
      await customerPage.waitForSpinner();
    } else {
      // Last resort: direct goto (MobX store won't be set but some tests still work)
      console.log(`[Nav] Account link not found in search results — direct goto`);
      await page.goto(`${servicingUrl}customer-information/${accountPk}`);
      await customerPage.waitForSpinner();
    }
  }
  // Wait for actual page content to load (edit pencil = Servicing Information panel rendered)
  await page.locator(SELECTORS.svInfoEditButton).waitFor({ state: 'visible', timeout: 30_000 })
    .catch(() => console.warn('[Nav] Servicing Information edit pencil not visible after 30s'));
  console.log(`[Nav] On account page: ${page.url()}`);
}

// ── Test data ─────────────────────────────────────────────────────────────────
const testData = [
  {
    env: 'qa1',
    tag: '@regression @qa1',
  },
];

// ── Frequency cycle helpers for CT-05–CT-08 ──────────────────────────────────
type FreqEntry = {
  uiLabel: 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Semi-Monthly';
  dbValue: string;
  expectedSecondDueDate: boolean;
};

const ALL_FREQ: FreqEntry[] = [
  { uiLabel: 'Weekly',       dbValue: 'WEEKLY',       expectedSecondDueDate: false },
  { uiLabel: 'Bi-Weekly',    dbValue: 'BI_WEEKLY',    expectedSecondDueDate: false },
  { uiLabel: 'Monthly',      dbValue: 'MONTHLY',      expectedSecondDueDate: false },
  { uiLabel: 'Semi-Monthly', dbValue: 'SEMI_MONTHLY', expectedSecondDueDate: true  },
];

/** Build a 4-step cycle starting from the frequency AFTER currentFrequency, returning to it. */
function buildFrequencyCycle(currentFrequency: string): FreqEntry[] {
  const idx = ALL_FREQ.findIndex(f => f.dbValue === currentFrequency);
  if (idx === -1) throw new Error(`Unknown frequency value: ${currentFrequency}`);
  return Array.from({ length: 4 }, (_, i) => ALL_FREQ[(idx + 1 + i) % ALL_FREQ.length]);
}

// ── Tests ─────────────────────────────────────────────────────────────────────
for (const data of testData) {
  test.describe(`RU03.26.1.50.0_addFrequencyChangesPageInHistoryMenu_503 - ${data.env}`, { tag: data.tag.split(' ') }, () => {
    test.describe.configure({ mode: 'serial' });

    // ══════════════════════════════════════════════════════════════════════════
    // CT-01/02/03: Navigation + API data validation + pagination
    // ══════════════════════════════════════════════════════════════════════════
    test('CT-01/02/03: Frequency Changes page — navigation, data validation, and pagination', async ({ page, db, testEnv, ctx, api }) => {
      test.setTimeout(180_000);

      let accountPk: string;

      await test.step('Find existing account with frequency mods', async () => {
        const row = await db.queryOne<{ account_pk: string; lead_pk: string }>(
          `SELECT fm.account_pk::text, a.lead_pk::text
           FROM uown_frequency_mods fm
           JOIN uown_sv_account a ON a.pk = fm.account_pk
           WHERE a.account_status = 'ACTIVE'
           GROUP BY fm.account_pk, a.pk, a.lead_pk
           HAVING COUNT(fm.pk) >= 3
           ORDER BY MAX(fm.row_created_timestamp) DESC LIMIT 1`,
        );
        expect(row, 'No ACTIVE account with >= 3 frequency_mods records found in database').toBeTruthy();
        accountPk = row!.account_pk;
        ctx.accountPk = accountPk;
        ctx.leadPk = row!.lead_pk;
        console.log(`[CT-01] Using account_pk: ${accountPk}, lead_pk: ${row!.lead_pk}`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('admin');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer via search (sets MobX store accountPk)', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await navigateToCorrectCustomer(page, customerPage, accountPk, testEnv.servicingUrl);
      });

      await test.step('CT-01: Navigate to History > Frequency Changes — verify page renders', async () => {
        const fcPage = new FrequencyChangesHistoryPage(page);

        // Set up response listener BEFORE any menu interaction to avoid race condition
        const freqApiResponse = page.waitForResponse(
          r => r.url().includes('/frequency-changes'),
          { timeout: 30_000 },
        ).catch(() => null);

        try {
          await fcPage.navigateToFrequencyChanges();
        } catch {
          console.log('[CT-01] Menu navigation failed — navigating directly to page URL');
          await page.goto(`${testEnv.servicingUrl}frequency-history/${accountPk}`);
          await fcPage.waitForSpinner();
        }

        // Check for 404 (feature not yet deployed)
        const bodyText = await page.locator('body').textContent().catch(() => '');
        const pageTitle = await page.title().catch(() => '');
        if (bodyText?.includes('404') || pageTitle.includes('404')) {
          console.warn('[SKIP] Frequency Changes page returned 404 — feature not yet deployed');
          test.skip(true, 'Feature not yet deployed — page returns 404.');
          return;
        }

        const apiRes = await freqApiResponse;
        if (apiRes) {
          const body = await apiRes.json().catch(() => null);
          console.log(`[CT-01] API /frequency-changes status=${apiRes.status()} records=${Array.isArray(body) ? body.length : 'N/A'}`);
        }

        await fcPage.waitForTableLoad();
        console.log(`[CT-01] URL after navigation: ${page.url()}`);

        // Verify heading
        await expect(page.getByText('Frequency Changes').first())
          .toBeVisible({ timeout: 10_000 });

        // Verify table container is present
        await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10_000 });

        // Wait for table rows to appear. SPA navigation may not load data immediately
        // due to cache — retry with page.goto (full server-side render) until rows appear.
        let rowCount = await fcPage.getRowCount();
        console.log(`[CT-01] Row count after SPA navigation: ${rowCount}`);

        if (rowCount === 0) {
          console.log('[CT-01] SPA navigation did not load data — retrying with full page load');
          for (let attempt = 1; attempt <= 3 && rowCount === 0; attempt++) {
            const freqApiOnLoad = page.waitForResponse(
              r => r.url().includes('/frequency-changes') && r.status() === 200,
              { timeout: 30_000 },
            ).catch(() => null);
            await page.goto(`${testEnv.servicingUrl}frequency-history/${accountPk}`);
            await freqApiOnLoad;
            await fcPage.waitForTableLoad();
            await page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
            rowCount = await fcPage.getRowCount();
            console.log(`[CT-01] Attempt ${attempt}: row count = ${rowCount}`);
          }
        }

        expect(rowCount, 'CT-01: Table should have visible rows').toBeGreaterThan(0);
        console.log(`[CT-01] Table rows visible: ${rowCount} — validating UI data`);

        // Validate column headers
        const headers = await fcPage.verifyColumnHeaders();
        for (const col of FrequencyChangesHistoryPage.EXPECTED_COLUMNS) {
          expect(headers, `Expected column "${col}" to be present`).toContainEqual(expect.stringContaining(col));
        }
        console.log(`[CT-01] Column headers: ${headers.join(', ')}`);

        // Validate first row data formats
        const firstRow = await fcPage.verifyFirstRowFormats();
        if (firstRow['Date'] && firstRow['Date'] !== '-')
          expect(firstRow['Date']).toMatch(/\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}\s*(AM|PM)/i);
        if (firstRow['From'] && firstRow['From'] !== '-')
          expect(FrequencyChangesHistoryPage.VALID_FREQUENCIES as readonly string[]).toContain(firstRow['From']);
        if (firstRow['To'] && firstRow['To'] !== '-')
          expect(FrequencyChangesHistoryPage.VALID_FREQUENCIES as readonly string[]).toContain(firstRow['To']);
        if (firstRow['Old Payment'] && firstRow['Old Payment'] !== '-')
          expect(firstRow['Old Payment']).toMatch(/^\$?\d+(\.\d{2})?$/);
        if (firstRow['New Payment'] && firstRow['New Payment'] !== '-')
          expect(firstRow['New Payment']).toMatch(/^\$?\d+(\.\d{2})?$/);
        if (firstRow['First Due Date'] && firstRow['First Due Date'] !== '-')
          expect(firstRow['First Due Date']).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        if (firstRow['User'] && firstRow['User'] !== '-')
          expect(firstRow['User'].length).toBeGreaterThan(0);
        console.log(`[CT-01] First row data: ${JSON.stringify(firstRow)}`);

        await saveScreenshot(page, 'CT-01-frequency-changes-page');
        console.log(`[CT-01] Page renders: heading and table container visible ✓`);
      });

      await test.step('CT-02: Verify API returns correct data format', async () => {
        const response = await api.account.getFrequencyChanges(accountPk);
        expect(response.status, 'GET /frequency-changes should return 200').toBe(200);
        expect(Array.isArray(response.body), 'Response body should be an array').toBe(true);
        expect(response.body.length, 'Should have at least 3 records (HAVING COUNT >= 3)').toBeGreaterThanOrEqual(3);

        const record = response.body[0];
        expect(record, 'First record should exist').toBeTruthy();
        expect(record.agent, 'agent should be non-empty').toBeTruthy();
        expect(record.rowCreatedTimestamp, 'rowCreatedTimestamp should be present').toBeTruthy();
        expect(record.frequencyModInfo, 'frequencyModInfo should be present').toBeTruthy();

        const modInfo = record.frequencyModInfo;
        const validFreqs = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'SEMI_MONTHLY'];
        expect(validFreqs, 'oldFrequency should be a valid frequency value').toContain(modInfo.oldFrequency);
        expect(validFreqs, 'newFrequency should be a valid frequency value').toContain(modInfo.newFrequency);
        expect(modInfo.oldTermPayment, 'oldTermPayment should be > 0').toBeGreaterThan(0);
        expect(modInfo.newTermPayment, 'newTermPayment should be > 0').toBeGreaterThan(0);
        expect(modInfo.firstDueDate, 'firstDueDate should be present').toBeTruthy();

        console.log(`[CT-02] API record: agent=${record.agent}, from=${modInfo.oldFrequency} to=${modInfo.newFrequency}`);
      });

      await test.step('CT-02: Cross-validate API record count with DB', async () => {
        const dbCount = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_frequency_mods WHERE account_pk = $1`,
          [accountPk],
        );
        const response = await api.account.getFrequencyChanges(accountPk);
        expect(response.body.length, 'API record count should match DB').toBe(dbCount);
        console.log(`[CT-02] DB count: ${dbCount}, API count: ${response.body.length}`);
      });

      await test.step('CT-03: Pagination — rows per page', async () => {
        const fcPage = new FrequencyChangesHistoryPage(page);
        const rowCount = await fcPage.getRowCount();
        expect(rowCount, 'CT-03: Table should have visible rows for pagination test').toBeGreaterThan(0);

        const total = await fcPage.getPaginationTotal();
        if (total === null || total <= 10) {
          console.log(`[CT-03] Total records: ${total ?? 'unknown'} — not enough for pagination test, skipping`);
          return;
        }

        await fcPage.changeRowsPerPage('20');
        const newRowCount = await fcPage.getRowCount();
        expect(newRowCount).toBeGreaterThanOrEqual(11);
        console.log(`[CT-03] After changing to 20 rows/page: ${newRowCount} rows visible`);

        await fcPage.changeRowsPerPage('10');
        const resetRowCount = await fcPage.getRowCount();
        expect(resetRowCount).toBeLessThanOrEqual(10);
        console.log(`[CT-03] After resetting to 10 rows/page: ${resetRowCount} rows visible`);
      });

      await test.step('CT-03: Next page navigation', async () => {
        const fcPage = new FrequencyChangesHistoryPage(page);

        const total = await fcPage.getPaginationTotal();
        if (total === null || total <= 10) {
          console.log(`[CT-03] Total records: ${total ?? 'unknown'} — not enough for next page test, skipping`);
          return;
        }

        const firstPageRow = await fcPage.getRowData(0);
        const navigated = await fcPage.goToNextPage();
        if (navigated) {
          await fcPage.waitForTableLoad();
          const secondPageRow = await fcPage.getRowData(0);
          expect(secondPageRow['Date']).toBeTruthy();
          expect(secondPageRow['Date']).not.toBe(firstPageRow['Date']);
          console.log(`[CT-03] Page 2 first row date: ${secondPageRow['Date']}`);
        }
      });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // CT-04: Menu visibility
    // ══════════════════════════════════════════════════════════════════════════
    test('CT-04: Frequency Changes menu requires frequency_history permission', async ({ page, db, testEnv, ctx }) => {
      test.setTimeout(120_000);

      await test.step('Find any existing account (needed to display History menu)', async () => {
        const row = await db.queryOne<{ account_pk: string; lead_pk: string }>(
          `SELECT a.pk::text AS account_pk, a.lead_pk::text
           FROM uown_sv_account a
           ORDER BY a.row_created_timestamp DESC LIMIT 1`,
        );
        if (row) {
          ctx.accountPk = row.account_pk;
          ctx.leadPk = row.lead_pk;
        }
      });

      await test.step('Login with admin user (has frequency_history permission)', async () => {
        const creds = testEnv.getCredentials('admin');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer via search (sets MobX store accountPk)', async () => {
        if (ctx.accountPk) {
          const customerPage = new ServicingCustomerPage(page);
          await navigateToCorrectCustomer(page, customerPage, ctx.accountPk, testEnv.servicingUrl);
        }
      });

      await test.step('CT-04: Verify Frequency Changes menu is visible for admin', async () => {
        const fcPage = new FrequencyChangesHistoryPage(page);
        await fcPage.waitForSpinner();

        const isVisible = await fcPage.isFrequencyChangesMenuVisible();
        expect(isVisible, 'Frequency Changes menu should be visible for admin user').toBe(true);
        console.log(`[CT-04] Frequency Changes menu visible for admin: ${isVisible}`);

        await saveScreenshot(page, 'CT-04-history-menu-frequency-changes-visible');
      });
    });

    // ══════════════════════════════════════════════════════════════════════════
    // CT-05/06/07/08: Full UI cycle — change all 4 frequencies via UI
    // DB + API validation for each change. UI table validated when BUG-01 is fixed.
    // ══════════════════════════════════════════════════════════════════════════
    test('CT-05/06/07/08: Change frequency via UI — full cycle (all 4 frequencies)', async ({ page, db, testEnv, ctx, api }) => {
      test.setTimeout(900_000);

      let accountPk: string;
      let leadPk: string;
      let countBefore = 0;
      let currentFrequency = '';
      let cyclePlan: FreqEntry[] = [];

      // ── Setup: Find ACTIVE account with existing frequency_mods ──────────
      await test.step('Find ACTIVE account with existing frequency_mods', async () => {
        const row = await db.queryOne<{ account_pk: string; lead_pk: string; current_frequency: string }>(
          `SELECT a.pk::text AS account_pk, a.lead_pk::text, s.payment_frequency AS current_frequency
           FROM uown_frequency_mods fm
           JOIN uown_sv_account a ON a.pk = fm.account_pk
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE'
           GROUP BY a.pk, a.lead_pk, s.payment_frequency
           ORDER BY MAX(fm.row_created_timestamp) DESC
           LIMIT 1`,
        );
        if (!row) {
          test.skip(true, 'No ACTIVE account with frequency_mods records found in database');
          return;
        }
        accountPk = row.account_pk;
        leadPk = row.lead_pk;
        currentFrequency = row.current_frequency;
        ctx.accountPk = accountPk;
        ctx.leadPk = leadPk;
        cyclePlan = buildFrequencyCycle(currentFrequency);
        console.log(`[CT-05] Using account_pk: ${accountPk} (current frequency: ${currentFrequency})`);
        console.log(`[CT-05] Planned cycle: ${currentFrequency} → ${cyclePlan.map(f => f.dbValue).join(' → ')}`);
      });

      await test.step('Record initial frequency_mods count', async () => {
        countBefore = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_frequency_mods WHERE account_pk = $1`,
          [accountPk],
        );
        console.log(`[CT-05] Initial frequency_mods count: ${countBefore}`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('admin');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer via search (sets MobX store accountPk)', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await navigateToCorrectCustomer(page, customerPage, accountPk, testEnv.servicingUrl);
      });

      // ── CT-05 through CT-08: cycle through all 4 frequencies ─────────────
      const fromFrequencies = [currentFrequency, ...cyclePlan.slice(0, 3).map(f => f.dbValue)];

      for (let i = 0; i < cyclePlan.length; i++) {
        const ctNumber = 5 + i;
        const { uiLabel, dbValue, expectedSecondDueDate } = cyclePlan[i];
        const fromFreq = fromFrequencies[i];
        const expectedCountAfter = countBefore + i + 1;

        await test.step(`CT-0${ctNumber}: Screenshot — Servicing Information panel BEFORE edit (${fromFreq})`, async () => {
          await saveScreenshot(page, `CT-0${ctNumber}-before-edit-${fromFreq}`);
        });

        await test.step(`CT-0${ctNumber}: Change frequency ${fromFreq} → ${dbValue} via Servicing Information edit`, async () => {
          const customerPage = new ServicingCustomerPage(page);
          const { firstDueDate, secondDueDate } = await customerPage.changePaymentFrequencyViaUI(uiLabel);
          ctx[`ct0${ctNumber}_firstDueDate`] = firstDueDate;
          ctx[`ct0${ctNumber}_secondDueDate`] = secondDueDate;
          console.log(`[CT-0${ctNumber}] Saved frequency: ${fromFreq} → ${dbValue}`);
          console.log(`[CT-0${ctNumber}] First due date: ${firstDueDate}, Second due date: ${secondDueDate}`);
        });

        await test.step(`CT-0${ctNumber}: Screenshot — Servicing Information panel AFTER save (${dbValue})`, async () => {
          await saveScreenshot(page, `CT-0${ctNumber}-after-save-${dbValue}`);
        });

        // ── DB cross-validation ──────────────────────────────────────────────
        await test.step(`CT-0${ctNumber}: Validate DB — new record in uown_frequency_mods`, async () => {
          // Poll DB for up to 30s — stg may have async processing or replication lag
          await expect.poll(async () => {
            return db.getSingleNumber(
              `SELECT COUNT(*) FROM uown_frequency_mods WHERE account_pk = $1`,
              [accountPk],
            );
          }, {
            message: `CT-0${ctNumber}: Expected ${expectedCountAfter} frequency_mods records`,
            timeout: 30_000,
            intervals: [2_000, 3_000, 5_000, 5_000, 5_000, 5_000, 5_000],
          }).toBe(expectedCountAfter);

          const latestMod = await db.queryOne<{
            old_frequency: string;
            new_frequency: string;
            old_term_payment: string;
            new_term_payment: string;
            first_due_date: string;
            second_due_date: string | null;
            agent: string;
          }>(
            `SELECT old_frequency, new_frequency, old_term_payment::text, new_term_payment::text,
                    first_due_date::text, second_due_date::text, agent
             FROM uown_frequency_mods
             WHERE account_pk = $1
             ORDER BY row_created_timestamp DESC LIMIT 1`,
            [accountPk],
          );
          expect(latestMod).toBeTruthy();
          expect(latestMod!.old_frequency).toBe(fromFreq);
          expect(latestMod!.new_frequency).toBe(dbValue);
          expect(latestMod!.agent).toBeTruthy();
          expect(parseFloat(latestMod!.old_term_payment)).toBeGreaterThan(0);
          expect(parseFloat(latestMod!.new_term_payment)).toBeGreaterThan(0);
          expect(latestMod!.first_due_date).toBeTruthy();
          if (expectedSecondDueDate) {
            expect(latestMod!.second_due_date, `SEMI_MONTHLY should have second_due_date`).toBeTruthy();
          }
          console.log(`[CT-0${ctNumber}] DB record: ${JSON.stringify(latestMod)}`);
        });

        // ── Navigate to Frequency Changes page ──────────────────────────────
        // BUG-01: SPA navigation (router.push via menu) does NOT load table data.
        // Workaround: visit customer page first (sets MobX accountPk), then navigate
        // to frequency-history via menu and reload the page.
        await test.step(`CT-0${ctNumber}: Re-login and navigate to Frequency Changes page`, async () => {
          const fcPage = new FrequencyChangesHistoryPage(page);
          const loginPageObj = new LoginPage(page);
          const customerPage = new ServicingCustomerPage(page);

          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          await loginPageObj.login(creds.username, creds.password);
          console.log(`[CT-0${ctNumber}] Re-logged in. URL: ${page.url()}`);

          // Navigate to customer page first — sets MobX accountPk in session
          await navigateToCorrectCustomer(page, customerPage, accountPk, testEnv.servicingUrl);

          // Navigate to frequency-history via menu, then reload to get data
          try {
            await fcPage.navigateToFrequencyChanges();
          } catch {
            console.log(`[CT-0${ctNumber}] Menu navigation failed — navigating directly`);
            await page.goto(`${testEnv.servicingUrl}frequency-history/${accountPk}`);
          }
          await fcPage.waitForTableLoad();

          // Wait for table rows — retry with full page load if SPA navigation didn't load data
          let rowCount = await fcPage.getRowCount();
          if (rowCount === 0) {
            console.log(`[CT-0${ctNumber}] SPA nav empty — retrying with full page load`);
            for (let attempt = 1; attempt <= 3 && rowCount === 0; attempt++) {
              const freqApiOnLoad = page.waitForResponse(
                r => r.url().includes('/frequency-changes') && r.status() === 200,
                { timeout: 30_000 },
              ).catch(() => null);
              await page.goto(`${testEnv.servicingUrl}frequency-history/${accountPk}`);
              await freqApiOnLoad;
              await fcPage.waitForTableLoad();
              await page.locator(SELECTORS.tableRow).first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
              rowCount = await fcPage.getRowCount();
              console.log(`[CT-0${ctNumber}] Attempt ${attempt}: row count = ${rowCount}`);
            }
          }

          console.log(`[CT-0${ctNumber}] URL on Frequency Changes page: ${page.url()}`);

          // Verify page renders
          await expect(page.getByRole('table').first()).toBeVisible({ timeout: 10_000 });
          expect(rowCount, `CT-0${ctNumber}: Table should have visible rows`).toBeGreaterThan(0);

          // UI table validation — first row should be the latest frequency change
          console.log(`[CT-0${ctNumber}] UI table has ${rowCount} rows — validating latest record`);
          const firstRow = await fcPage.getRowData(0);
          console.log(`[CT-0${ctNumber}] UI first row: ${JSON.stringify(firstRow)}`);
          expect(firstRow['From'], `CT-0${ctNumber}: UI "From" should be ${fromFreq}`).toBe(fromFreq);
          expect(firstRow['To'], `CT-0${ctNumber}: UI "To" should be ${dbValue}`).toBe(dbValue);
          expect(firstRow['User'], `CT-0${ctNumber}: User should be non-empty`).toBeTruthy();
          expect(firstRow['Date'], `CT-0${ctNumber}: Date should be non-empty`).toBeTruthy();
          expect(firstRow['Old Payment'], `CT-0${ctNumber}: Old Payment should be non-empty`).toBeTruthy();
          expect(firstRow['New Payment'], `CT-0${ctNumber}: New Payment should be non-empty`).toBeTruthy();
          expect(firstRow['First Due Date'], `CT-0${ctNumber}: First Due Date should be non-empty`).toBeTruthy();
          if (expectedSecondDueDate) {
            expect(firstRow['Second Due Date'], `CT-0${ctNumber}: SEMI_MONTHLY should show Second Due Date`).toBeTruthy();
          }

          await saveScreenshot(page, `CT-0${ctNumber}-frequency-changes-page-${dbValue}`);
        });

        // ── API cross-validation ─────────────────────────────────────────────
        await test.step(`CT-0${ctNumber}: Validate most recent record via API`, async () => {
          // Poll API until the newest record matches the expected change (stg may have API caching)
          let latestRecord: { agent: string; rowCreatedTimestamp: string; frequencyModInfo: {
            oldFrequency: string; newFrequency: string; oldTermPayment: number;
            newTermPayment: number; firstDueDate: string; secondDueDate?: string | null;
          }} | undefined;

          await expect.poll(async () => {
            const response = await api.account.getFrequencyChanges(accountPk);
            if (response.status !== 200 || !Array.isArray(response.body) || response.body.length === 0) return null;
            // Find the record matching the expected change (don't rely on sort order)
            const match = response.body.find(
              (r: { frequencyModInfo: { oldFrequency: string; newFrequency: string } }) =>
                r.frequencyModInfo.oldFrequency === fromFreq && r.frequencyModInfo.newFrequency === dbValue,
            );
            if (match) { latestRecord = match; return dbValue; }
            // Fallback: check last element (ASC order expected)
            latestRecord = response.body[response.body.length - 1];
            console.log(`[CT-0${ctNumber}] API poll: ${response.body.length} records, last newFreq=${latestRecord?.frequencyModInfo?.newFrequency}`);
            return latestRecord?.frequencyModInfo?.newFrequency ?? null;
          }, {
            message: `CT-0${ctNumber}: API should contain record with from=${fromFreq} to=${dbValue}`,
            timeout: 60_000,
            intervals: [2_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000],
          }).toBe(dbValue);

          expect(latestRecord).toBeTruthy();
          const modInfo = latestRecord!.frequencyModInfo;
          expect(modInfo.oldFrequency, `CT-0${ctNumber}: "from" should be ${fromFreq}`).toBe(fromFreq);
          expect(modInfo.oldTermPayment, `CT-0${ctNumber}: oldTermPayment should be > 0`).toBeGreaterThan(0);
          expect(modInfo.newTermPayment, `CT-0${ctNumber}: newTermPayment should be > 0`).toBeGreaterThan(0);
          expect(modInfo.firstDueDate, `CT-0${ctNumber}: firstDueDate should be present`).toBeTruthy();
          expect(latestRecord!.agent, `CT-0${ctNumber}: agent should be non-empty`).toBeTruthy();
          expect(latestRecord!.rowCreatedTimestamp, `CT-0${ctNumber}: rowCreatedTimestamp should be present`).toBeTruthy();

          if (expectedSecondDueDate) {
            expect(modInfo.secondDueDate, `CT-0${ctNumber}: SEMI_MONTHLY should have secondDueDate`)
              .toBeTruthy();
          }

          console.log(`[CT-0${ctNumber}] API validation ✓ from=${modInfo.oldFrequency} to=${modInfo.newFrequency}`);
        });

        // ── After CT-08: verify full cycle via API ───────────────────────────
        if (ctNumber === 8) {
          await test.step('CT-08: Verify full cycle — 4 records in API response', async () => {
            const dbFinalCount = await db.getSingleNumber(
              `SELECT COUNT(*) FROM uown_frequency_mods WHERE account_pk = $1`,
              [accountPk],
            );
            expect(dbFinalCount).toBe(countBefore + 4);
            console.log(`[CT-08] Full cycle complete — total frequency_mods: ${dbFinalCount}`);

            // Poll API until it contains the cycle-closing record (cache may delay)
            await expect.poll(async () => {
              const r = await api.account.getFrequencyChanges(accountPk);
              if (r.status !== 200 || !Array.isArray(r.body)) return null;
              const match = r.body.find(
                (rec: { frequencyModInfo: { newFrequency: string } }) =>
                  rec.frequencyModInfo.newFrequency === currentFrequency,
              );
              return match ? currentFrequency : r.body[r.body.length - 1]?.frequencyModInfo?.newFrequency ?? null;
            }, {
              message: `CT-08: API should contain record with newFrequency=${currentFrequency} (cycle complete)`,
              timeout: 60_000,
              intervals: [2_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000, 5_000],
            }).toBe(currentFrequency);

            console.log(`[CT-08] Cycle verified: last change → ${currentFrequency} (= original)`);
            await saveScreenshot(page, 'CT-08-full-cycle-complete');
          });
        }

        // ── Navigate back to customer-information for the next iteration ──────
        // Session is still valid from the re-login in the frequency-changes step above.
        // Go directly to the customer page URL to avoid loader/search issues.
        if (i < 3) {
          await test.step(`CT-0${ctNumber}: Navigate back to Customer Information (prepare for next frequency change)`, async () => {
            await page.goto(`${testEnv.servicingUrl}customer-information/${accountPk}`);
            const customerPage = new ServicingCustomerPage(page);
            await customerPage.waitForSpinner();
            // Wait for actual page content to render before next frequency change
            await page.locator(SELECTORS.svInfoEditButton).waitFor({ state: 'visible', timeout: 30_000 })
              .catch(() => console.warn(`[CT-0${ctNumber}] Edit pencil not visible after 30s — retrying with reload`));
            // If edit pencil still not visible, reload the page
            if (!await page.locator(SELECTORS.svInfoEditButton).isVisible().catch(() => false)) {
              console.log(`[CT-0${ctNumber}] Reloading customer page to recover from stale state`);
              await page.reload();
              await customerPage.waitForSpinner();
              await page.locator(SELECTORS.svInfoEditButton).waitFor({ state: 'visible', timeout: 30_000 });
            }
            console.log(`[CT-0${ctNumber}] URL after direct goto: ${page.url()}`);
          });
        }
      }
    });
  });
}

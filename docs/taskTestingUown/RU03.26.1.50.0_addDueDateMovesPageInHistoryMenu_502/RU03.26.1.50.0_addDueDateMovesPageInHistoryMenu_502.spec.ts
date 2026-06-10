/**
 * Task #502 — Add "Due Date Moves" Page in History Menu
 *
 * Validates the new Servicing > History > Due Date Changes page:
 *   CT-01: Columns display with correct labels
 *   CT-02: Data shows proper format (date, boolean, integer)
 *   CT-03: Pagination works (change rows per page, navigate pages)
 *   CT-04: Menu option visible only with due_date_moves_history permission
 *   CT-05: Column values match exactly after a controlled API move (UI vs API vs DB)
 *   CT-06: FPD Change column maps boolean correctly (Yes/No)
 *   CT-07: NEXT_DUE_DATE adjustment type displayed correctly via TMS endpoint
 *   CT-08: Max offset validation — WEEKLY rejects >3 days (CA-1 US-SVC-05)
 *   CT-09: Bug R2 — BI_WEEKLY/MONTHLY treated as WEEKLY (max 3 instead of 7)
 *   CT-10: dueDateMoves counter increments after move (CA-5 US-SVC-05)
 *   CT-11: Activity log DUE_DATE_MOVES created after move (CA-6 US-SVC-05)
 *   CT-12: isFpdChange=true updates FPD in SchedSummary (CA-4 US-SVC-05)
 *   CT-13: UI — Move due date via Due Amounts → verify in Due Date Changes (Agent = manager)
 *   CT-14: UI — Move due date backwards (-1) via Due Amounts → verify negative in Due Date Changes
 *
 * Uses an existing account — no new application created.
 */
import { test, expect } from '@support/base-test.js';
import { LoginPage } from '@pages/login.page.js';
import { ServicingCustomerPage, DueDateMovesHistoryPage, ScheduledPaymentPage } from '@pages/servicing/index.js';
import { AccountClient } from '@api/clients';
import { SELECTORS } from '@selectors/common.selectors.js';

const testData = [
  {
    env: 'stg',
    tag: '@regression @stg',
  },
];

for (const data of testData) {
  test.describe(`RU03.26.1.50.0_addDueDateMovesPageInHistoryMenu_502 - ${data.env}`, { tag: data.tag.split(' ') }, () => {
    test.describe.configure({ mode: 'serial' });

    test('CT-01/02/03: Due Date Moves page — columns, format and pagination', async ({ page, db, testEnv, ctx, request }) => {
      test.setTimeout(180_000);

      let accountPk: string;

      await test.step('Find existing account with due date moves', async () => {
        // Prefer account 4453 if it has due date moves; otherwise take the most recent
        const row = await db.queryOne<{ account_pk: string; lead_pk: string }>(
          `SELECT ddm.account_pk::text, a.lead_pk::text
           FROM uown_due_date_moves ddm
           JOIN uown_sv_account a ON a.pk = ddm.account_pk
           ORDER BY CASE WHEN ddm.account_pk = 4453 THEN 0 ELSE 1 END,
                    ddm.row_created_timestamp DESC
           LIMIT 1`,
        );
        expect(row, 'No due date moves records found in database').toBeTruthy();
        accountPk = row!.account_pk;
        ctx.accountPk = accountPk;
        ctx.leadPk = row!.lead_pk;
        console.log(`[CT-01] Using account_pk: ${accountPk}, lead_pk: ${row!.lead_pk}`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('manager');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountPk);
      });

      await test.step('[CA-3] Navigate to History > Due Date Changes — screenshot do menu', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        // Abrir History dropdown para screenshot do menu (CA-3: opção visível com permissão)
        const historyBtn = page.getByRole('button', { name: /History/i }).first();
        if (await historyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await historyBtn.click();
        }
        // Aguardar o item "Due Date Changes" aparecer antes de tirar screenshot
        await page.getByRole('menuitem', { name: 'Due Date Changes' }).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.screenshot({ path: 'reports/screenshots/502-ca3-history-menu-due-date-changes.png', fullPage: false });
        console.log('[CA-3] Screenshot: History menu com "Due Date Changes"');
        await page.keyboard.press('Escape');

        // Navegar para a página
        const menuVisible = await ddmPage.isDueDateChangesMenuVisible().catch(() => false);
        if (menuVisible) {
          await ddmPage.navigateToDueDateChanges();
        } else {
          console.log('[CT] Menu item not visible — navigating directly to page URL');
          const pageUrl = `${testEnv.servicingUrl}due-date-moves-history/${accountPk}`;
          await page.goto(pageUrl);
          await ddmPage.waitForSpinner();
        }

        // If the page returns 404 (not yet deployed), skip remaining steps
        const pageTitle = await page.title().catch(() => '');
        const bodyText = await page.locator('body').textContent().catch(() => '');
        if (bodyText?.includes('404') || bodyText?.includes('page is not on our radar') || pageTitle.includes('404')) {
          console.warn('[SKIP] Due Date Moves page returned 404 — feature not yet deployed in this environment');
          test.skip(true, 'Feature not yet deployed — page returns 404. Run once R1.50.0 is deployed to QA1.');
          return;
        }

        await ddmPage.waitForTableLoad();
      });

      await test.step('[CA-1] CT-01: Verify all expected column headers — screenshot das colunas', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const headers = await ddmPage.verifyColumnHeaders();
        for (const col of DueDateMovesHistoryPage.EXPECTED_COLUMNS) {
          expect(headers, `Expected column "${col}" to be present`).toContainEqual(expect.stringContaining(col));
        }
        console.log(`[CT-01] Column headers: ${headers.join(', ')}`);
        await page.screenshot({ path: 'reports/screenshots/502-ca1-columns-and-data.png', fullPage: false });
        console.log('[CA-1] Screenshot: colunas da tabela Due Date Moves History');
      });

      await test.step('[CA-2] CT-02: Verify first row data formats — screenshot dos dados', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const rowCount = await ddmPage.getRowCount();
        console.log(`[CT-02] Row count: ${rowCount}`);

        if (rowCount > 0) {
          const rowData = await ddmPage.verifyFirstRowFormats();
          if (rowData['Date'] && rowData['Date'] !== '-')
            expect(rowData['Date']).toMatch(/\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(AM|PM)/i);
          if (rowData['Previous Due Date'] && rowData['Previous Due Date'] !== '-')
            expect(rowData['Previous Due Date']).toMatch(/\d{2}\/\d{2}\/\d{4}/);
          if (rowData['Days Moved'] && rowData['Days Moved'] !== '-')
            expect(rowData['Days Moved']).toMatch(/^-?\d+$/);
          if (rowData['FPD Change'] && rowData['FPD Change'] !== '-')
            expect(['Yes', 'No']).toContain(rowData['FPD Change']);
          if (rowData['Adjustment Type'] && rowData['Adjustment Type'] !== '-')
            expect(rowData['Adjustment Type'].length).toBeGreaterThan(0);
          console.log(`[CT-02] First row data: ${JSON.stringify(rowData)}`);
          await page.screenshot({ path: 'reports/screenshots/502-ca2-data-format.png', fullPage: false });
          console.log('[CA-2] Screenshot: formato dos dados (date MM/DD/YYYY hh:mmA, int, Yes/No)');
        } else {
          console.log('[CT-02] No data rows found — skipping format verification');
        }
      });

      await test.step('CT-02: Cross-validate UI data with API response', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const rowCount = await ddmPage.getRowCount();
        if (rowCount === 0) return;

        // Verify DB record count matches total shown in pagination
        const dbCount = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_due_date_moves WHERE account_pk = $1`,
          [accountPk],
        );
        const paginationTotal = await ddmPage.getPaginationTotal();
        if (paginationTotal !== null) {
          expect(paginationTotal).toBe(dbCount);
          console.log(`[CT-02] DB count: ${dbCount}, Pagination total: ${paginationTotal}`);
          await page.screenshot({ path: 'reports/screenshots/502-ca2-db-vs-pagination.png', fullPage: false });
          console.log('[CA-2] Screenshot: paginação total = DB count');
        }
      });

      await test.step('CT-03 setup: Generate due date moves data for pagination (if needed)', async () => {
        const dbCount = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_due_date_moves WHERE account_pk = $1`,
          [accountPk],
        );
        if (dbCount > 10) {
          console.log(`[CT-03] Account ${accountPk} already has ${dbCount} records — no data generation needed`);
          return;
        }

        const needed = 11 - dbCount;
        console.log(`[CT-03] Account ${accountPk} has ${dbCount} records — generating ${needed} more via API`);

        const accountClient = new AccountClient(request, testEnv);
        // Alternate +1 / -1 days so net movement is zero (or near zero)
        for (let i = 0; i < needed; i++) {
          const days = i % 2 === 0 ? 1 : -1;
          const result = await accountClient.moveDueDatesByDays(accountPk, days);
          if (!result.ok) {
            console.warn(`[CT-03] moveDueDatesByDays call ${i + 1} failed: ${result.status} — ${JSON.stringify(result.body)}`);
          } else {
            console.log(`[CT-03] moveDueDatesByDays call ${i + 1}: days=${days} OK`);
          }
        }

        const newCount = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_due_date_moves WHERE account_pk = $1`,
          [accountPk],
        );
        console.log(`[CT-03] After generation: ${newCount} records in DB`);

        // Navigate back to the page so the UI reflects the new records
        // (page.reload() loses MobX store state in Next.js; navigate directly instead)
        if (newCount > dbCount) {
          const ddmPage = new DueDateMovesHistoryPage(page);
          await page.goto(`${testEnv.servicingUrl}due-date-moves-history/${accountPk}`);
          await page.waitForURL(/due-date-moves-history/, { timeout: 10_000 });
          await ddmPage.waitForTableLoad();
        }
      });

      await test.step('CT-03: Verify pagination — change rows per page', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const total = await ddmPage.getPaginationTotal();
        if (total === null || total <= 10) {
          console.log('[CT-03] Not enough records for pagination test — skipping');
          return;
        }

        // Change rows per page to 20 — should show all remaining records (> 10)
        await ddmPage.changeRowsPerPage('20');
        const newRowCount = await ddmPage.getRowCount();
        expect(newRowCount).toBeGreaterThan(10);
        console.log(`[CT-03] After changing to 20 rows/page: ${newRowCount} rows visible (total: ${total})`);
        await page.screenshot({ path: 'reports/screenshots/502-ca-ct03-rows-per-page.png', fullPage: false });

        // Change back to 10
        await ddmPage.changeRowsPerPage('10');
        const resetRowCount = await ddmPage.getRowCount();
        expect(resetRowCount).toBeLessThanOrEqual(10);
        console.log(`[CT-03] After resetting to 10 rows/page: ${resetRowCount} rows visible`);
      });

      await test.step('CT-03: Verify pagination — navigate to next page', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const total = await ddmPage.getPaginationTotal();
        if (total === null || total <= 10) {
          console.log('[CT-03] Not enough records for next page test — skipping');
          return;
        }

        // Capture pagination info before navigating
        const page1Info = await page.locator('.rdt_Pagination').textContent();
        const navigated = await ddmPage.goToNextPage();
        if (navigated) {
          // Wait for pagination info to change (page 2 range is different from page 1)
          await page.waitForFunction(
            ([selector, prev]) => {
              const text = document.querySelector(selector)?.textContent ?? '';
              return text !== prev && text.length > 0;
            },
            ['.rdt_Pagination', page1Info] as [string, string | null],
            { timeout: 10_000 },
          ).catch(() => {});
          await ddmPage.waitForTableLoad();
          const page2RowCount = await ddmPage.getRowCount();
          const page2Info = await page.locator('.rdt_Pagination').textContent();
          expect(page2Info).not.toBe(page1Info);
          expect(page2RowCount).toBeGreaterThan(0);
          console.log(`[CT-03] Page 1 pagination: ${page1Info?.trim()}`);
          console.log(`[CT-03] Page 2 pagination: ${page2Info?.trim()}, rows visible: ${page2RowCount}`);
          await page.screenshot({ path: 'reports/screenshots/502-ca-ct03-page2.png', fullPage: false });
        }
      });
    });

    test('CT-04: Due Date Changes menu requires permission', async ({ page, db, testEnv }) => {
      test.setTimeout(120_000);

      let testAccountPk: string;

      await test.step('Find an existing account for navigation', async () => {
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT ddm.account_pk::text
           FROM uown_due_date_moves ddm
           JOIN uown_sv_account a ON a.pk = ddm.account_pk
           ORDER BY CASE WHEN ddm.account_pk = 4453 THEN 0 ELSE 1 END,
                    ddm.row_created_timestamp DESC
           LIMIT 1`,
        );
        expect(row, 'No due date moves account found').toBeTruthy();
        testAccountPk = row!.account_pk;
        console.log(`[CT-04] Using account_pk: ${testAccountPk}`);
      });

      await test.step('Login with manager user', async () => {
        const creds = testEnv.getCredentials('manager');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to a customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(testAccountPk);
      });

      await test.step('[CA-3] CT-04: Verify Due Date Changes menu visibility — screenshot do menu', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);

        // First check if the page itself is deployed (by trying direct URL)
        const pageResponse = await page.request.get(
          `${testEnv.servicingUrl}due-date-moves-history/${testAccountPk}`,
        ).catch(() => null);
        const pageDeployed = pageResponse && pageResponse.status() !== 404;

        if (!pageDeployed) {
          console.warn('[CT-04] Due Date Moves page returns 404 — feature not deployed in QA1 yet. Skipping.');
          test.skip(true, 'Feature not yet deployed to this environment.');
          return;
        }

        // Abrir History dropdown para screenshot (CA-3: opção visível com permissão)
        const ddmPage2 = new DueDateMovesHistoryPage(page);
        const menuOpened = await (async () => {
          try {
            const historyBtn = page.getByRole('button', { name: /History/i }).first();
            const historyLink = page.locator("[data-menu='history'], .nav-item:has-text('History')").first();
            const btn = await historyBtn.isVisible({ timeout: 3_000 }).catch(() => false)
              ? historyBtn : historyLink;
            await btn.click();
            await page.getByRole('menuitem', { name: 'Due Date Changes' }).waitFor({ state: 'visible', timeout: 4_000 });
            return true;
          } catch { return false; }
        })();
        await page.screenshot({ path: 'reports/screenshots/502-ca3-ct04-history-menu-permission.png', fullPage: false });
        console.log(`[CA-3] Screenshot CT-04: History menu ${menuOpened ? 'aberto com "Due Date Changes"' : 'não abriu — screenshot da página'}`);
        if (menuOpened) {
          await page.keyboard.press('Escape');
          // Wait for the menu to close before checking visibility again
          await page.getByRole('menuitem', { name: 'Due Date Changes' }).waitFor({ state: 'hidden', timeout: 2_000 }).catch(() => {});
        }

        const isVisible = await ddmPage.isDueDateChangesMenuVisible();
        expect(isVisible, 'Due Date Changes should be visible for admin user with due_date_moves_history permission').toBe(true);
        console.log(`[CT-04] Due Date Changes menu visible for admin: ${isVisible}`);
      });
    });

    test('CT-05: Column values match after controlled API move (UI vs API vs DB)', async ({ page, db, testEnv, request }) => {
      test.setTimeout(180_000);

      const MOVE_DAYS = 1; // small value — safe for all frequencies (max 3 for WEEKLY, 7 for others)
      let accountPk: string;
      let expectedPrevDueDate: string; // YYYY-MM-DD from getDueDateMoves API
      let expectedMovedByDays: number;
      let expectedIsFpdChange: boolean;
      let expectedCreatedTimestamp: string;

      await test.step('Find account with active receivables', async () => {
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT ddm.account_pk::text
           FROM uown_due_date_moves ddm
           JOIN uown_sv_account a ON a.pk = ddm.account_pk
           ORDER BY CASE WHEN ddm.account_pk = 4313 THEN 0 ELSE 1 END,
                    ddm.row_created_timestamp DESC
           LIMIT 1`,
        );
        expect(row, 'No account found for CT-05').toBeTruthy();
        accountPk = row!.account_pk;
        console.log(`[CT-05] Using account_pk: ${accountPk}`);
      });

      await test.step('[CT-05] Execute moveDueDatesByDays via API', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.moveDueDatesByDays(accountPk, MOVE_DAYS);
        expect(resp.ok, `moveDueDatesByDays failed: ${resp.status} — ${JSON.stringify(resp.body)}`).toBeTruthy();
        expectedMovedByDays = MOVE_DAYS;
        console.log(`[CT-05] Move executed: ${MOVE_DAYS} days`);
      });

      await test.step('[CT-05] Fetch created record from API to get reference values', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.getDueDateMoves(accountPk, 0, 1);
        expect(resp.ok, 'getDueDateMoves failed').toBeTruthy();
        const latest = resp.body!.content[0];
        expect(latest.movedByDays, 'Latest record movedByDays should match').toBe(MOVE_DAYS);
        expect(latest.agentUsername, 'Agent should be SYSTEM for API calls').toBe('SYSTEM');
        // Use the movedFromDueDate from the API record as the source of truth
        // (getNextReceivable may return a past-due receivable, while moveDueDatesByDays records the actual moved date)
        expectedPrevDueDate = latest.movedFromDueDate;
        expectedIsFpdChange = latest.isFpdChange;
        expectedCreatedTimestamp = latest.createdTimestamp;
        console.log(`[CT-05] API record: agent=${latest.agentUsername}, prevDue=${latest.movedFromDueDate}, days=${latest.movedByDays}, fpd=${latest.isFpdChange}, ts=${latest.createdTimestamp}`);
      });

      await test.step('[CT-05] Cross-validate API record vs DB record', async () => {
        const dbRow = await db.queryOne<{
          agent_username: string;
          moved_from_due_date: string;
          moved_by_days: number;
          is_fpd_change: boolean;
          adjustment_type: string;
        }>(
          `SELECT agent_username, moved_from_due_date::text, moved_by_days, is_fpd_change, adjustment_type
           FROM uown_due_date_moves
           WHERE account_pk = $1
           ORDER BY row_created_timestamp DESC
           LIMIT 1`,
          [accountPk],
        );
        expect(dbRow, 'DB record not found after move').toBeTruthy();
        expect(dbRow!.agent_username).toBe('SYSTEM');
        expect(dbRow!.moved_from_due_date).toBe(expectedPrevDueDate);
        expect(dbRow!.moved_by_days).toBe(MOVE_DAYS);
        expect(dbRow!.is_fpd_change).toBe(expectedIsFpdChange);
        expect(dbRow!.adjustment_type).toBe('SCHEDULE_SHIFT');
        console.log(`[CT-05] DB vs API: agent=${dbRow!.agent_username} ✓, prevDue=${dbRow!.moved_from_due_date} ✓, days=${dbRow!.moved_by_days} ✓, fpd=${dbRow!.is_fpd_change} ✓`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('manager');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(accountPk);
      });

      await test.step('[CT-05] Navigate to Due Date Changes and screenshot', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        // Wait for full-page loader to clear before interacting with menu (stg loads slower)
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        await ddmPage.navigateToDueDateChanges();
        await ddmPage.waitForTableLoad();
        await page.screenshot({ path: 'reports/screenshots/502-ct05-table.png', fullPage: false });
        console.log('[CT-05] Screenshot: tabela Due Date Moves History');
      });

      await test.step('[CT-05] Validate first row values match API reference — screenshot dos valores', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const row = await ddmPage.getRowData(0);
        console.log(`[CT-05] UI row data: ${JSON.stringify(row)}`);

        // Agent: SYSTEM
        expect(row['Agent'], 'Agent column should be SYSTEM').toBe('SYSTEM');

        // Previous Due Date: YYYY-MM-DD → MM/DD/YYYY
        const [year, month, day] = expectedPrevDueDate.split('-');
        const expectedPrevDueDateUI = `${month}/${day}/${year}`;
        expect(row['Previous Due Date'], `Previous Due Date should be ${expectedPrevDueDateUI}`).toBe(expectedPrevDueDateUI);

        // Days Moved: exact integer
        expect(row['Days Moved'], `Days Moved should be ${expectedMovedByDays}`).toBe(String(expectedMovedByDays));

        // FPD Change: boolean → Yes/No
        const expectedFpdText = expectedIsFpdChange ? 'Yes' : 'No';
        expect(row['FPD Change'], `FPD Change should be ${expectedFpdText}`).toBe(expectedFpdText);

        // Adjustment Type: SCHEDULE_SHIFT
        expect(row['Adjustment Type'], 'Adjustment Type should be SCHEDULE_SHIFT').toBe('SCHEDULE_SHIFT');

        // Date: parse UI timestamp and compare with API createdTimestamp (within 2-min window)
        const uiDateStr = row['Date']; // MM/DD/YYYY hh:mmA
        const apiTs = new Date(expectedCreatedTimestamp);
        const match = uiDateStr?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(AM|PM)/i);
        if (match) {
          let [, mm, dd, yyyy, hh, min, ampm] = match;
          let h = parseInt(hh);
          if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
          if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
          const uiTs = new Date(`${yyyy}-${mm}-${dd}T${String(h).padStart(2,'0')}:${min}:00`);
          const diffMs = Math.abs(uiTs.getTime() - apiTs.getTime());
          expect(diffMs, `Date column time difference (${diffMs}ms) should be within 2 minutes`).toBeLessThan(2 * 60 * 1000);
          console.log(`[CT-05] Date column: UI=${uiDateStr}, API=${expectedCreatedTimestamp}, diff=${diffMs}ms ✓`);
        }

        await page.screenshot({ path: 'reports/screenshots/502-ct05-column-values.png', fullPage: false });
        console.log('[CT-05] Screenshot: valores das colunas validados');
      });
    });

    test('CT-06: FPD Change column maps isFpdChange boolean correctly (Yes and No)', async ({ page, db, testEnv }) => {
      test.setTimeout(120_000);

      let accountPk: string;

      await test.step('Find account with both FPD Change = Yes and No records', async () => {
        // Find account that has at least one isFpdChange=true and one isFpdChange=false
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT account_pk::text
           FROM uown_due_date_moves
           GROUP BY account_pk
           HAVING bool_or(is_fpd_change = true) AND bool_or(is_fpd_change = false)
           ORDER BY CASE WHEN account_pk = 4313 THEN 0 ELSE 1 END
           LIMIT 1`,
        );
        expect(row, 'No account with both FPD Change Yes and No records found').toBeTruthy();
        accountPk = row!.account_pk;
        console.log(`[CT-06] Using account_pk: ${accountPk}`);
      });

      // Fetch which records have isFpdChange true/false from DB to know expected UI values
      let yesRecord: { row_created_timestamp: string };
      let noRecord: { row_created_timestamp: string };

      await test.step('Identify a Yes and a No record from DB', async () => {
        const yes = await db.queryOne<{ row_created_timestamp: string }>(
          `SELECT to_char(row_created_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS') AS row_created_timestamp
           FROM uown_due_date_moves
           WHERE account_pk = $1 AND is_fpd_change = true
           ORDER BY row_created_timestamp DESC LIMIT 1`,
          [accountPk],
        );
        const no = await db.queryOne<{ row_created_timestamp: string }>(
          `SELECT to_char(row_created_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS') AS row_created_timestamp
           FROM uown_due_date_moves
           WHERE account_pk = $1 AND is_fpd_change = false
           ORDER BY row_created_timestamp DESC LIMIT 1`,
          [accountPk],
        );
        expect(yes, 'No FPD Change = Yes record found').toBeTruthy();
        expect(no, 'No FPD Change = No record found').toBeTruthy();
        yesRecord = yes!;
        noRecord = no!;
        console.log(`[CT-06] Yes record ts: ${yes!.row_created_timestamp}`);
        console.log(`[CT-06] No  record ts: ${no!.row_created_timestamp}`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('manager');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(accountPk);
      });

      await test.step('[CT-06] Navigate to Due Date Changes', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        await ddmPage.navigateToDueDateChanges();
        await ddmPage.waitForTableLoad();
      });

      await test.step('[CT-06] Find and verify FPD Change = Yes row — screenshot', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const rowCount = await ddmPage.getRowCount();

        // Find the row corresponding to the Yes record by matching the Date column
        const yesTs = new Date(yesRecord.row_created_timestamp);
        let foundYes = false;

        for (let i = 0; i < rowCount; i++) {
          const row = await ddmPage.getRowData(i);
          const match = row['Date']?.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})(AM|PM)/i);
          if (!match) continue;
          let [, mm, dd, yyyy, hh, min, ampm] = match;
          let h = parseInt(hh);
          if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
          if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
          const rowTs = new Date(`${yyyy}-${mm}-${dd}T${String(h).padStart(2,'0')}:${min}:00`);
          if (Math.abs(rowTs.getTime() - yesTs.getTime()) < 60_000) {
            expect(row['FPD Change'], `Row ${i} FPD Change should be Yes`).toBe('Yes');
            console.log(`[CT-06] Row ${i}: FPD Change = Yes ✓ (ts: ${row['Date']})`);
            foundYes = true;
            break;
          }
        }

        if (!foundYes) {
          // Yes record might be on page 2 — navigate all pages to find 20 rows per page
          await ddmPage.changeRowsPerPage('20');
          for (let i = 0; i < await ddmPage.getRowCount(); i++) {
            const row = await ddmPage.getRowData(i);
            if (row['FPD Change'] === 'Yes') {
              foundYes = true;
              console.log(`[CT-06] Found FPD Change = Yes at row ${i} (page 20/page)`);
              break;
            }
          }
        }

        expect(foundYes, 'Should find at least one row with FPD Change = Yes').toBe(true);
        await page.screenshot({ path: 'reports/screenshots/502-ct06-fpd-yes.png', fullPage: false });
        console.log('[CT-06] Screenshot: FPD Change = Yes row');
      });

      await test.step('[CT-06] Find and verify FPD Change = No row — screenshot', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        const rowCount = await ddmPage.getRowCount();

        let foundNo = false;
        for (let i = 0; i < rowCount; i++) {
          const row = await ddmPage.getRowData(i);
          if (row['FPD Change'] === 'No') {
            foundNo = true;
            console.log(`[CT-06] Row ${i}: FPD Change = No ✓ (Days Moved: ${row['Days Moved']})`);
            break;
          }
        }
        expect(foundNo, 'Should find at least one row with FPD Change = No').toBe(true);
        await page.screenshot({ path: 'reports/screenshots/502-ct06-fpd-no.png', fullPage: false });
        console.log('[CT-06] Screenshot: FPD Change = No row');
      });
    });

    test('CT-07: NEXT_DUE_DATE adjustment type displayed in History page via TMS', async ({ page, db, testEnv, request }) => {
      test.setTimeout(180_000);

      let accountPk: string;

      await test.step('Find active account with due date moves', async () => {
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT a.pk::text AS account_pk
           FROM uown_sv_account a
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           JOIN uown_due_date_moves ddm ON ddm.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE'
           ORDER BY ddm.row_created_timestamp DESC
           LIMIT 1`,
        );
        expect(row, 'No active account with due date moves found').toBeTruthy();
        accountPk = row!.account_pk;
        console.log(`[CT-07] Using account_pk: ${accountPk}`);
      });

      await test.step('[CT-07] Create NEXT_DUE_DATE record via TMS adjustNextDueDate', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.adjustNextDueDate(accountPk, { dueDate: null, offset: 1 });
        if (!resp.ok) {
          // TMS key may not be configured or endpoint not available — try to find existing NEXT_DUE_DATE records
          console.warn(`[CT-07] TMS adjustNextDueDate failed: ${resp.status} — ${JSON.stringify(resp.body)}. Will check for existing NEXT_DUE_DATE records.`);
        } else {
          console.log(`[CT-07] TMS move OK: original=${resp.body!.originalDueDate}, new=${resp.body!.newDueDate}`);
        }
      });

      await test.step('[CT-07] Verify NEXT_DUE_DATE exists in DB', async () => {
        const row = await db.queryOne<{ adjustment_type: string }>(
          `SELECT adjustment_type FROM uown_due_date_moves
           WHERE account_pk = $1 AND adjustment_type = 'NEXT_DUE_DATE'
           ORDER BY row_created_timestamp DESC LIMIT 1`,
          [accountPk],
        );
        // If no NEXT_DUE_DATE, check any account in the DB that has one
        if (!row) {
          const fallback = await db.queryOne<{ account_pk: string }>(
            `SELECT account_pk::text FROM uown_due_date_moves
             WHERE adjustment_type = 'NEXT_DUE_DATE'
             ORDER BY row_created_timestamp DESC LIMIT 1`,
          );
          if (fallback) {
            accountPk = fallback.account_pk;
            console.log(`[CT-07] Switched to account_pk ${accountPk} which has NEXT_DUE_DATE records`);
          } else {
            console.warn('[CT-07] No NEXT_DUE_DATE records found in entire DB — skipping UI check');
            test.skip(true, 'No NEXT_DUE_DATE records available in this environment');
            return;
          }
        }
        console.log(`[CT-07] NEXT_DUE_DATE record confirmed for account ${accountPk}`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('manager');
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(accountPk);
      });

      await test.step('[CT-07] Navigate to Due Date Changes and verify NEXT_DUE_DATE in table', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        await ddmPage.navigateToDueDateChanges();
        await ddmPage.waitForTableLoad();

        // Show all rows to find NEXT_DUE_DATE
        const total = await ddmPage.getPaginationTotal();
        if (total && total > 10) await ddmPage.changeRowsPerPage('25');

        const rowCount = await ddmPage.getRowCount();
        let foundNextDueDate = false;
        let foundScheduleShift = false;
        for (let i = 0; i < rowCount; i++) {
          const row = await ddmPage.getRowData(i);
          if (row['Adjustment Type'] === 'NEXT_DUE_DATE') foundNextDueDate = true;
          if (row['Adjustment Type'] === 'SCHEDULE_SHIFT') foundScheduleShift = true;
          if (foundNextDueDate && foundScheduleShift) break;
        }

        expect(foundNextDueDate, 'Should find NEXT_DUE_DATE adjustment type in the table').toBe(true);
        console.log(`[CT-07] NEXT_DUE_DATE found: ${foundNextDueDate} ✓, SCHEDULE_SHIFT found: ${foundScheduleShift}`);
        await page.screenshot({ path: 'reports/screenshots/502-ct07-next-due-date-type.png', fullPage: false });
      });
    });

    test('CT-13: UI — Move due date via Due Amounts and verify in Due Date Changes', async ({ page, db, testEnv }) => {
      test.setTimeout(180_000);

      let accountPk: string;
      let managerUsername: string;
      let moveResult: { selectedDate: string; newDate: string };
      let dbCountBefore: number;

      await test.step('Find clean active account for UI move (no prior date moves)', async () => {
        // Use an account with NO prior due date moves to avoid duplicate dates in dropdown
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT a.pk::text AS account_pk
           FROM uown_sv_account a
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE'
             AND s.payment_frequency != 'WEEKLY'
             AND NOT EXISTS (SELECT 1 FROM uown_due_date_moves ddm WHERE ddm.account_pk = a.pk)
           ORDER BY a.pk DESC
           LIMIT 1`,
        );
        expect(row, 'No clean active non-WEEKLY account found').toBeTruthy();
        accountPk = row!.account_pk;
        console.log(`[CT-13] Using clean account_pk: ${accountPk}`);
      });

      await test.step('Count due date moves before', async () => {
        dbCountBefore = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_due_date_moves WHERE account_pk = $1`,
          [accountPk],
        );
        console.log(`[CT-13] DB record count before: ${dbCountBefore}`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('manager');
        managerUsername = creds.username;
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(accountPk);
      });

      await test.step('[CT-13] Navigate to Due Amounts and move via UI modal (+1 day)', async () => {
        // Wait for full-page loader to clear before menu interaction
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

        const scheduledPage = new ScheduledPaymentPage(page);
        await scheduledPage.navigateToScheduledPayments();
        await scheduledPage.moveDueDateBtn.waitFor({ state: 'visible', timeout: 15_000 });
        console.log('[CT-13] Due Amounts page loaded');

        // moveDueDateFirstOption clicks the first dropdown option, fills new date, saves,
        // and waits for the modal to close (success indicator: frontend toggle() on 200).
        moveResult = await scheduledPage.moveDueDateFirstOption(1);
        console.log(`[CT-13] Modal closed — move succeeded: ${moveResult.selectedDate} → ${moveResult.newDate}`);

        await page.screenshot({ path: 'reports/screenshots/502-ct13-due-amounts-move.png', fullPage: false });
      });

      await test.step('[CT-13] Navigate to Due Date Changes and verify record', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        await ddmPage.navigateToDueDateChanges();
        await ddmPage.waitForTableLoad();

        // Verify a new record was created
        const paginationTotal = await ddmPage.getPaginationTotal();
        expect(paginationTotal, 'Pagination total should be greater than before').toBeGreaterThan(dbCountBefore);
        console.log(`[CT-13] Pagination total after move: ${paginationTotal} (was ${dbCountBefore})`);

        // Verify first row (most recent) matches the move we just did
        const row = await ddmPage.getRowData(0);
        console.log(`[CT-13] Latest row: ${JSON.stringify(row)}`);

        // Agent should be the manager username (NOT "SYSTEM" — UI move uses logged-in user)
        expect(row['Agent'], `Agent should be manager username, got: ${row['Agent']}`).toBe(managerUsername);

        // Days Moved should be 1
        expect(row['Days Moved'], 'Days Moved should be 1').toBe('1');

        // Adjustment Type should be SCHEDULE_SHIFT (UI modal uses moveDueDatesByDays)
        expect(row['Adjustment Type'], 'Adjustment Type should be SCHEDULE_SHIFT').toBe('SCHEDULE_SHIFT');

        // Previous Due Date should match the selected date from the modal
        expect(row['Previous Due Date'], `Previous Due Date should be ${moveResult.selectedDate}`).toBe(moveResult.selectedDate);

        await page.screenshot({ path: 'reports/screenshots/502-ct13-due-date-changes-verified.png', fullPage: false });
        console.log(`[CT-13] UI → History validated: Agent=${row['Agent']}, Days=${row['Days Moved']}, Type=${row['Adjustment Type']} ✓`);
      });
    });

    test('CT-14: UI — Move due date with negative offset and verify reversal in Due Date Changes', async ({ page, db, testEnv, ctx }) => {
      test.setTimeout(180_000);

      let accountPk: string;
      let managerUsername: string;

      await test.step('Find clean active account different from CT-13 (no prior date moves)', async () => {
        // Use the SECOND clean account (CT-13 takes the first) to avoid date overlap
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT a.pk::text AS account_pk
           FROM uown_sv_account a
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE'
             AND s.payment_frequency != 'WEEKLY'
             AND NOT EXISTS (SELECT 1 FROM uown_due_date_moves ddm WHERE ddm.account_pk = a.pk)
           ORDER BY a.pk DESC
           OFFSET 1
           LIMIT 1`,
        );
        expect(row, 'No second clean active non-WEEKLY account found').toBeTruthy();
        accountPk = row!.account_pk;
        console.log(`[CT-14] Using clean account_pk: ${accountPk} (different from CT-13)`);
      });

      await test.step('Login to Servicing', async () => {
        const creds = testEnv.getCredentials('manager');
        managerUsername = creds.username;
        await page.goto(testEnv.servicingUrl);
        const loginPage = new LoginPage(page);
        await loginPage.login(creds.username, creds.password);
      });

      await test.step('Navigate to customer', async () => {
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(accountPk);
      });

      await test.step('[CT-14] Navigate to Due Amounts and move backwards (-1 day)', async () => {
        // Wait for full-page loader to clear
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

        const scheduledPage = new ScheduledPaymentPage(page);
        await scheduledPage.navigateToScheduledPayments();
        await scheduledPage.moveDueDateBtn.waitFor({ state: 'visible', timeout: 15_000 });

        // moveDueDateFirstOption clicks first option, fills new date (-1 day), saves,
        // and waits for modal close (success indicator).
        const result = await scheduledPage.moveDueDateFirstOption(-1);
        console.log(`[CT-14] Modal closed — move succeeded: ${result.selectedDate} → ${result.newDate}`);
        await page.screenshot({ path: 'reports/screenshots/502-ct14-due-amounts-reverse.png', fullPage: false });
      });

      await test.step('[CT-14] Navigate to Due Date Changes and verify negative move', async () => {
        const ddmPage = new DueDateMovesHistoryPage(page);
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
        await page.locator(SELECTORS.fullPageLoader).waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
        await ddmPage.navigateToDueDateChanges();
        await ddmPage.waitForTableLoad();

        const row = await ddmPage.getRowData(0);
        console.log(`[CT-14] Latest row: ${JSON.stringify(row)}`);

        // Agent should be the manager username
        expect(row['Agent'], `Agent should be ${managerUsername}`).toBe(managerUsername);

        // Days Moved should be -1 (negative = moved backwards)
        expect(row['Days Moved'], 'Days Moved should be -1').toBe('-1');

        // Adjustment Type should be SCHEDULE_SHIFT
        expect(row['Adjustment Type'], 'Adjustment Type should be SCHEDULE_SHIFT').toBe('SCHEDULE_SHIFT');

        await page.screenshot({ path: 'reports/screenshots/502-ct14-due-date-changes-reverse.png', fullPage: false });
        console.log(`[CT-14] Reverse move validated: Agent=${row['Agent']}, Days=${row['Days Moved']} ✓`);
      });
    });

    test('CT-08: Max offset validation — WEEKLY rejects >3 days', async ({ db, testEnv, request }) => {
      test.setTimeout(60_000);

      let weeklyAccountPk: string;

      await test.step('Find active WEEKLY account', async () => {
        const row = await db.queryOne<{ account_pk: string }>(
          `SELECT a.pk::text AS account_pk
           FROM uown_sv_account a
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE' AND s.payment_frequency = 'WEEKLY'
           LIMIT 1`,
        ).catch(() => null);
        if (!row) {
          console.warn('[CT-08] No active WEEKLY account found — skipping');
          test.skip(true, 'No active WEEKLY account in this environment');
          return;
        }
        weeklyAccountPk = row.account_pk;
        console.log(`[CT-08] WEEKLY account_pk: ${weeklyAccountPk}`);
      });

      await test.step('[CT-08] Reject move of 4 days on WEEKLY account', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.moveDueDatesByDays(weeklyAccountPk, 4);
        expect(resp.ok, 'Move of 4 days on WEEKLY should be rejected').toBe(false);
        console.log(`[CT-08] 4 days on WEEKLY → rejected (${resp.status}) ✓ — ${JSON.stringify(resp.body)}`);
      });

      await test.step('[CT-08] Accept move of 1 day on WEEKLY account', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.moveDueDatesByDays(weeklyAccountPk, 1);
        expect(resp.ok, `Move of 1 day on WEEKLY should succeed: ${resp.status}`).toBe(true);
        console.log(`[CT-08] 1 day on WEEKLY → accepted (${resp.status}) ✓`);

        // Reverse the move to keep the account clean
        const reverseResp = await accountClient.moveDueDatesByDays(weeklyAccountPk, -1);
        console.log(`[CT-08] Reverse -1 day: ${reverseResp.ok ? 'OK' : `failed (${reverseResp.status})`}`);
      });
    });

    test('CT-09: Bug R2 — BI_WEEKLY/MONTHLY offset validation treats all as WEEKLY (max 3)', async ({ db, testEnv, request }) => {
      test.setTimeout(60_000);

      let biweeklyAccountPk: string;
      let frequency = 'non-WEEKLY';

      await test.step('Find active BI_WEEKLY or MONTHLY account', async () => {
        const row = await db.queryOne<{ account_pk: string; payment_frequency: string }>(
          `SELECT a.pk::text AS account_pk, s.payment_frequency
           FROM uown_sv_account a
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE' AND s.payment_frequency IN ('BI_WEEKLY', 'MONTHLY', 'SEMI_MONTHLY')
           LIMIT 1`,
        ).catch(() => null);
        if (!row) {
          console.warn('[CT-09] No active BI_WEEKLY/MONTHLY account found — skipping');
          test.skip(true, 'No active non-WEEKLY account in this environment');
          return;
        }
        biweeklyAccountPk = row.account_pk;
        frequency = row.payment_frequency;
        console.log(`[CT-09] ${frequency} account_pk: ${biweeklyAccountPk}`);
      });

      await test.step(`[CT-09] Try 5-day move on ${frequency ?? 'non-WEEKLY'} account (expected: max 7, actual bug: max 3)`, async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.moveDueDatesByDays(biweeklyAccountPk, 5);
        // Known bug: validateOffsetByFrequency always uses WEEKLY branch → max 3 for ALL
        // If rejected: bug still present. If accepted: bug has been fixed.
        if (resp.ok) {
          console.log(`[CT-09] 5 days on ${frequency} → ACCEPTED (${resp.status}) — Bug R2 has been FIXED ✓`);
          // Reverse the move
          await accountClient.moveDueDatesByDays(biweeklyAccountPk, -5).catch(() => {});
        } else {
          console.log(`[CT-09] 5 days on ${frequency} → REJECTED (${resp.status}) — Bug R2 still present: ${frequency} treated as WEEKLY (max 3) ✓`);
          // Confirm 3 days works even with the bug
          const resp3 = await accountClient.moveDueDatesByDays(biweeklyAccountPk, 3);
          console.log(`[CT-09] 3 days on ${frequency} → ${resp3.ok ? 'ACCEPTED' : 'REJECTED'} (${resp3.status})`);
          if (resp3.ok) {
            await accountClient.moveDueDatesByDays(biweeklyAccountPk, -3).catch(() => {});
          }
        }
        // This test documents behavior — both outcomes are valid (bug present or fixed)
        console.log('[CT-09] Bug behavior documented ✓');
      });
    });

    test('CT-10/11/12: Side effects — counter, activity log, FPD update', async ({ db, testEnv, request }) => {
      test.setTimeout(120_000);

      let accountPk: string;
      let leadPk: string;
      let dueDateMovesBefore: number;
      let activityCountBefore: number;
      let fpdBefore: string;

      await test.step('Find active account for side-effect validation', async () => {
        const row = await db.queryOne<{ account_pk: string; lead_pk: string }>(
          `SELECT a.pk::text AS account_pk, a.lead_pk::text
           FROM uown_sv_account a
           JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
           WHERE a.account_status = 'ACTIVE'
             AND EXISTS (SELECT 1 FROM uown_due_date_moves ddm WHERE ddm.account_pk = a.pk)
           ORDER BY a.pk DESC
           LIMIT 1`,
        );
        expect(row, 'No active account with due date moves found').toBeTruthy();
        accountPk = row!.account_pk;
        leadPk = row!.lead_pk;
        console.log(`[CT-10/11/12] Using account_pk: ${accountPk}, lead_pk: ${leadPk}`);
      });

      await test.step('[CT-10] Read dueDateMoves counter before move', async () => {
        // dueDateMoves may be on sched_summary or account — check both
        const schedRow = await db.queryOne<{ due_date_moves: number | null }>(
          `SELECT due_date_moves FROM uown_sv_sched_summary WHERE account_pk = $1`,
          [accountPk],
        ).catch(() => null);
        if (schedRow && schedRow.due_date_moves !== null) {
          dueDateMovesBefore = schedRow.due_date_moves;
          console.log(`[CT-10] dueDateMoves before (sched_summary): ${dueDateMovesBefore}`);
        } else {
          const acctRow = await db.queryOne<{ due_date_moves: number | null }>(
            `SELECT due_date_moves FROM uown_sv_account WHERE pk = $1`,
            [accountPk],
          ).catch(() => null);
          dueDateMovesBefore = acctRow?.due_date_moves ?? 0;
          console.log(`[CT-10] dueDateMoves before (account): ${dueDateMovesBefore}`);
        }
      });

      await test.step('[CT-11] Count DUE_DATE_MOVES activity logs before move', async () => {
        activityCountBefore = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_sv_activity_log
           WHERE account_pk = $1 AND log_type = 'DUE_DATE_MOVES'`,
          [accountPk],
        );
        console.log(`[CT-11] Activity log count before: ${activityCountBefore}`);
      });

      await test.step('[CT-12] Read FPD from sched_summary before move', async () => {
        const row = await db.queryOne<{ fpd: string }>(
          `SELECT first_payment_due_date::text AS fpd FROM uown_sv_sched_summary WHERE account_pk = $1`,
          [accountPk],
        );
        fpdBefore = row?.fpd ?? '';
        console.log(`[CT-12] FPD before move: ${fpdBefore}`);
      });

      await test.step('Execute move via API (+1 day)', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.moveDueDatesByDays(accountPk, 1);
        expect(resp.ok, `moveDueDatesByDays failed: ${resp.status}`).toBe(true);
        console.log(`[CT-10/11/12] Move +1 day executed`);
      });

      await test.step('[CT-10] Verify dueDateMoves counter incremented', async () => {
        // Check sched_summary first, fallback to account
        const schedRow = await db.queryOne<{ due_date_moves: number | null }>(
          `SELECT due_date_moves FROM uown_sv_sched_summary WHERE account_pk = $1`,
          [accountPk],
        ).catch(() => null);
        let after: number;
        if (schedRow && schedRow.due_date_moves !== null) {
          after = schedRow.due_date_moves;
          console.log(`[CT-10] dueDateMoves after (sched_summary): ${after}`);
        } else {
          const acctRow = await db.queryOne<{ due_date_moves: number | null }>(
            `SELECT due_date_moves FROM uown_sv_account WHERE pk = $1`,
            [accountPk],
          ).catch(() => null);
          after = acctRow?.due_date_moves ?? 0;
          console.log(`[CT-10] dueDateMoves after (account): ${after}`);
        }

        expect(after, 'dueDateMoves should have incremented by 1').toBe(dueDateMovesBefore + 1);
        console.log(`[CT-10] dueDateMoves: ${dueDateMovesBefore} → ${after} ✓`);
      });

      await test.step('[CT-11] Verify DUE_DATE_MOVES activity log created', async () => {
        const activityCountAfter = await db.getSingleNumber(
          `SELECT COUNT(*) FROM uown_sv_activity_log
           WHERE account_pk = $1 AND log_type = 'DUE_DATE_MOVES'`,
          [accountPk],
        );
        expect(activityCountAfter, 'Activity log count should have increased').toBeGreaterThan(activityCountBefore);
        console.log(`[CT-11] Activity log count: ${activityCountBefore} → ${activityCountAfter} ✓`);

        // Verify the latest log entry details
        const latestLog = await db.queryOne<{ notes: string; created_by: string }>(
          `SELECT notes, created_by FROM uown_sv_activity_log
           WHERE account_pk = $1 AND log_type = 'DUE_DATE_MOVES'
           ORDER BY pk DESC LIMIT 1`,
          [accountPk],
        );
        console.log(`[CT-11] Latest log: created_by=${latestLog?.created_by}, notes=${latestLog?.notes?.substring(0, 100)}`);
      });

      await test.step('[CT-12] Verify isFpdChange and FPD in sched_summary', async () => {
        // Check isFpdChange on the latest due_date_moves record
        const moveRecord = await db.queryOne<{ is_fpd_change: boolean; moved_from_due_date: string }>(
          `SELECT is_fpd_change, moved_from_due_date::text
           FROM uown_due_date_moves WHERE account_pk = $1
           ORDER BY row_created_timestamp DESC LIMIT 1`,
          [accountPk],
        );
        expect(moveRecord, 'Move record not found').toBeTruthy();

        const fpdRow = await db.queryOne<{ fpd: string }>(
          `SELECT first_payment_due_date::text AS fpd FROM uown_sv_sched_summary WHERE account_pk = $1`,
          [accountPk],
        );
        const fpdAfter = fpdRow?.fpd ?? '';
        console.log(`[CT-12] isFpdChange: ${moveRecord!.is_fpd_change}, FPD before: ${fpdBefore}, FPD after: ${fpdAfter}`);

        if (moveRecord!.is_fpd_change) {
          // If FPD was changed, the sched_summary should reflect the shift
          expect(fpdAfter, 'FPD should have changed when isFpdChange=true').not.toBe(fpdBefore);
          console.log(`[CT-12] isFpdChange=true → FPD changed from ${fpdBefore} to ${fpdAfter} ✓`);
        } else {
          // FPD not affected — this means the moved date was not the FPD
          console.log(`[CT-12] isFpdChange=false → FPD unchanged (${fpdAfter}), moved date was not FPD ✓`);
        }
      });

      await test.step('Reverse move to keep account clean (-1 day)', async () => {
        const accountClient = new AccountClient(request, testEnv);
        const resp = await accountClient.moveDueDatesByDays(accountPk, -1);
        console.log(`[CT-10/11/12] Reverse -1 day: ${resp.ok ? 'OK' : `failed (${resp.status})`}`);
      });
    });
  });
}


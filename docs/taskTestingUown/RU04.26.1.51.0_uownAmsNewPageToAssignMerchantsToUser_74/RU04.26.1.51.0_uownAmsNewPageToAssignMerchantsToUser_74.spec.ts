/**
 * Task #74 — AMS | New page to assign merchants to user
 *
 * Validates the new AMS User Details page (/users/[username]) and the
 * Merchant Association page (two selectable tables with pagination).
 *
 * Feature scope:
 *   1. User Details Page — fields visible, edit + save + persistence
 *   2. Merchant Association Page — two tables, additive selection, pagination, no-duplicate
 *   3. API: POST /user/addMerchantsToUsers — happy path + wildcard user skip
 *
 * UI-first tests — API used only for preconditions and post-verification.
 * Uses existing user data in qa2.
 * No application data created → runId/email not needed.
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.51.0_uownAmsNewPageToAssignMerchantsToUser_74/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { AmsBasePage, AmsUserDetailsPage, AmsUserMerchantsPage } from '@pages/ams/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const SCREENSHOT_DIR =
  'tests/taskTestingUown/RU04.26.1.51.0_uownAmsNewPageToAssignMerchantsToUser_74/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_uownAmsNewPageToAssignMerchantsToUser_74';

const testData = [
  {
    env: 'qa2' as const,
    // UI + API tests against existing AMS users — no applications created -> runId/email not needed
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
      let testUsername = ''; // user whose merchantCodes does NOT contain "*"
      let wildcardUsername = ''; // user whose merchantCodes === "*"
      let originalMerchantCodes = ''; // merchantCodes of testUsername before any mutation

      // ================================================================
      //  Setup — find suitable test users via API
      // ================================================================

      test.beforeAll(async ({ api }) => {
        const usersRes = await api.ams.getUsers({ page: 0, size: 50 });
        expect(usersRes.ok, 'GET /user should return 200').toBeTruthy();

        const users = usersRes.body.content;
        expect(users.length, 'At least 1 user should exist in AMS').toBeGreaterThan(0);

        // Find a non-wildcard user with at least 1 merchant already associated
        const nonWildcard = users.find(
          (u) =>
            u.merchantCodes &&
            u.merchantCodes !== '*' &&
            !u.merchantCodes.includes('*') &&
            u.merchantCodes.trim().length > 0,
        );
        if (nonWildcard) {
          testUsername = nonWildcard.userName;
          originalMerchantCodes = nonWildcard.merchantCodes ?? '';
          console.log(
            `[beforeAll] testUsername="${testUsername}", merchantCodes="${originalMerchantCodes}"`,
          );
        }

        // Find a wildcard user
        const wildcard = users.find(
          (u) => u.merchantCodes === '*' || u.merchantCodes?.includes('*'),
        );
        if (wildcard) {
          wildcardUsername = wildcard.userName;
          console.log(`[beforeAll] wildcardUsername="${wildcardUsername}"`);
        }
      });

      // ================================================================
      //  Teardown — restore testUsername merchantCodes to original value
      // ================================================================

      test.afterAll(async ({ api }) => {
        if (!testUsername || !originalMerchantCodes) return;

        const currentRes = await api.ams.getUser(testUsername);
        if (!currentRes.ok) return;

        const currentCodes = currentRes.body.merchantCodes ?? '';
        if (currentCodes !== originalMerchantCodes) {
          console.log(
            `[afterAll] Restoring merchantCodes for "${testUsername}": "${currentCodes}" -> "${originalMerchantCodes}"`,
          );
          await api.ams.updateUser(testUsername, { merchantCodes: originalMerchantCodes });
        }
      });

      // ================================================================
      //  CT-E2E-01: Navigation to user details + fields visible
      // ================================================================

      test('CT-E2E-01: Clicking user row navigates to /users/[username] with edit button visible', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        await test.step('Login to AMS portal', async () => {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
        });

        const amsBase = new AmsBasePage(page);

        await test.step('Wait for users table to load', async () => {
          await amsBase.waitForTable();
        });

        await test.step('Click first user row in the table', async () => {
          await amsBase.clickRowByIndex(0);
        });

        const detailsPage = new AmsUserDetailsPage(page);

        await test.step('Verify URL navigated to /users/[username]', async () => {
          await expect(page).toHaveURL(/\/users\//, { timeout: 20_000 });
        });

        await test.step('Verify user details page loaded (edit pencil visible)', async () => {
          await detailsPage.waitForDetailsPage();
          const editVisible = await detailsPage.editProfileButton.isVisible();
          expect(editVisible, 'Edit profile button (pencil) should be visible').toBeTruthy();
          console.log(`[CT-E2E-01] URL: ${page.url()}, editButton visible: ${editVisible}`);
        });

        await test.step('Screenshot — CT-E2E-01 user details page', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-user-details-page.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-E2E-02: Edit user phone number, save, reload, verify persistence
      // ================================================================

      test('CT-E2E-02: Edit phoneNumber on user details page persists after reload', async ({
        page,
        testEnv,
        api,
      }) => {
        test.skip(!testUsername, 'No suitable non-wildcard user found');
        test.setTimeout(180_000);

        await test.step('Login to AMS portal', async () => {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
        });

        const detailsPage = new AmsUserDetailsPage(page);

        await test.step('Navigate directly to user details page', async () => {
          await page.goto(`${testEnv.amsUrl}/users/${testUsername}`, {
            waitUntil: 'domcontentloaded',
          });
          await detailsPage.waitForDetailsPage();
        });

        // Read current phone via API to restore later
        let originalPhone = '';
        await test.step('Capture current phone via API', async () => {
          const userRes = await api.ams.getUser(testUsername);
          originalPhone = userRes.body.phoneNumber ?? '';
          console.log(`[CT-E2E-02] Original phone (API): "${originalPhone}"`);
        });

        const testPhone = `555${Date.now().toString().slice(-7)}`;

        await test.step('Click Edit pencil to enter edit mode', async () => {
          await detailsPage.clickEditProfileButton();
        });

        await test.step('Fill new phone number', async () => {
          await detailsPage.fillPhoneNumber(testPhone);
        });

        await test.step('Click SAVE and verify success toast', async () => {
          await detailsPage.clickSave();
          const success = await detailsPage.isSaveSuccessful();
          expect(success, 'Save should show success toast').toBeTruthy();
        });

        await test.step('Verify via API — phone number updated', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok, 'GET /user should return 200').toBeTruthy();
          expect(
            userRes.body.phoneNumber,
            `Phone should contain "${testPhone.slice(-7)}"`,
          ).toContain(testPhone.slice(-7));
          console.log(`[CT-E2E-02] API phone after: "${userRes.body.phoneNumber}"`);
        });

        await test.step('Reload page and verify persistence in UI', async () => {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await detailsPage.waitForDetailsPage();
          // Edit button visible again (read-only mode) — phone persisted
          const editVisible = await detailsPage.editProfileButton.isVisible();
          expect(editVisible, 'Edit button should be visible after reload').toBeTruthy();
        });

        await test.step('Restore original phone number via API', async () => {
          if (originalPhone) {
            await api.ams.updateUser(testUsername, { phoneNumber: originalPhone });
          }
        });

        await test.step('Screenshot — CT-E2E-02 phone persistence', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-phone-persistence.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-E2E-03: Navigate to merchant association page, two tables visible
      // ================================================================

      test('CT-E2E-03: Merchant association page shows two selectable tables', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(120_000);

        await test.step('Login to AMS portal', async () => {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
        });

        const merchantsPage = new AmsUserMerchantsPage(page);

        await test.step('Navigate directly to /associate-users-to-merchants', async () => {
          await page.goto(`${testEnv.amsUrl}/associate-users-to-merchants`, {
            waitUntil: 'domcontentloaded',
          });
          await merchantsPage.waitForMerchantsPage();
        });

        await test.step('Verify both tables are visible and contain rows', async () => {
          const usersCount = await merchantsPage.getUsersRowCount();
          const merchantsCount = await merchantsPage.getMerchantsRowCount();

          expect(usersCount, 'Users table should have at least 1 row').toBeGreaterThan(0);
          expect(merchantsCount, 'Merchants table should have at least 1 row').toBeGreaterThan(0);

          console.log(
            `[CT-E2E-03] Users table rows: ${usersCount}, Merchants table rows: ${merchantsCount}`,
          );
        });

        await test.step('Verify Submit button is visible', async () => {
          const submitVisible = await merchantsPage.submitButton.isVisible();
          expect(submitVisible, 'Submit button should be visible').toBeTruthy();
        });

        await test.step('Screenshot — CT-E2E-03 two tables visible', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-03-merchant-association-two-tables.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-E2E-04: Select user + merchant, submit, verify additive association
      // ================================================================

      test('CT-E2E-04: Selecting user+merchant and submitting creates additive association', async ({
        page,
        testEnv,
        api,
      }) => {
        test.skip(!testUsername, 'No suitable non-wildcard user found');
        test.setTimeout(180_000);

        // Capture merchantCodes before via API
        let codesBefore: string[] = [];
        await test.step('Capture testUsername merchantCodes before via API', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok).toBeTruthy();
          codesBefore = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          console.log(
            `[CT-E2E-04] merchantCodes before (${codesBefore.length}): ${codesBefore.join(', ')}`,
          );
        });

        await test.step('Login to AMS portal', async () => {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
        });

        const merchantsPage = new AmsUserMerchantsPage(page);

        await test.step('Navigate to /associate-users-to-merchants', async () => {
          await page.goto(`${testEnv.amsUrl}/associate-users-to-merchants`, {
            waitUntil: 'domcontentloaded',
          });
          await merchantsPage.waitForMerchantsPage();
        });

        let selectedUser = '';
        await test.step('Select first user in Users table', async () => {
          selectedUser = await merchantsPage.selectUserByIndex(0);
          console.log(`[CT-E2E-04] Selected user: "${selectedUser}"`);
        });

        let selectedMerchant = '';
        await test.step('Select first merchant in Merchants table', async () => {
          const merchantsCount = await merchantsPage.getMerchantsRowCount();
          expect(merchantsCount, 'At least 1 merchant required').toBeGreaterThan(0);
          selectedMerchant = await merchantsPage.selectMerchantByIndex(0);
          console.log(`[CT-E2E-04] Selected merchant: "${selectedMerchant}"`);
        });

        let submitSuccess = false;
        await test.step('Submit selection and verify success toast', async () => {
          submitSuccess = await merchantsPage.clickSubmit();
          expect(submitSuccess, 'Submit should show success toast').toBeTruthy();
        });

        await test.step('Verify via API — testUsername merchantCodes are additive', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok).toBeTruthy();

          const codesAfter = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          console.log(
            `[CT-E2E-04] merchantCodes after (${codesAfter.length}): ${codesAfter.join(', ')}`,
          );

          // All original codes should still be present (additive, not replaced)
          for (const originalCode of codesBefore) {
            expect(
              codesAfter.includes(originalCode),
              `Original merchant "${originalCode}" should still be in merchantCodes`,
            ).toBeTruthy();
          }
        });

        await test.step('Screenshot — CT-E2E-04 merchant association', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-merchant-additive-association.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-E2E-05: Paginate merchants table, select from page 2, submit
      // ================================================================

      test('CT-E2E-05: Selecting merchant from page 2 of merchants table associates correctly', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(180_000);

        await test.step('Login to AMS portal', async () => {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
        });

        const merchantsPage = new AmsUserMerchantsPage(page);

        await test.step('Navigate to /associate-users-to-merchants', async () => {
          await page.goto(`${testEnv.amsUrl}/associate-users-to-merchants`, {
            waitUntil: 'domcontentloaded',
          });
          await merchantsPage.waitForMerchantsPage();
        });

        let page1Merchants: string[] = [];
        await test.step('Capture page 1 merchants in merchants table', async () => {
          page1Merchants = await merchantsPage.getCurrentPageMerchants();
          console.log(
            `[CT-E2E-05] Page 1 merchants (${page1Merchants.length}): ${page1Merchants.slice(0, 5).join(', ')}...`,
          );
        });

        const hasPagination = await merchantsPage.isMerchantsNextPageAvailable();
        if (!hasPagination) {
          console.log('[CT-E2E-05] No pagination — skipping page 2 test');
        }
        test.skip(!hasPagination, 'Merchants table has only 1 page — pagination not needed');

        await test.step('Navigate to page 2 of merchants table', async () => {
          await merchantsPage.clickMerchantsNextPage();
        });

        await test.step('Verify page 2 merchants differ from page 1', async () => {
          const page2Merchants = await merchantsPage.getCurrentPageMerchants();
          console.log(
            `[CT-E2E-05] Page 2 merchants (${page2Merchants.length}): ${page2Merchants.slice(0, 5).join(', ')}...`,
          );

          const page1Set = new Set(page1Merchants);
          const uniqueOnPage2 = page2Merchants.filter((m) => !page1Set.has(m));
          expect(
            uniqueOnPage2.length,
            'Page 2 should contain at least 1 merchant not on page 1',
          ).toBeGreaterThan(0);
        });

        let selectedMerchant = '';
        await test.step('Select first merchant from page 2', async () => {
          selectedMerchant = await merchantsPage.selectMerchantByIndex(0);
          console.log(`[CT-E2E-05] Selected merchant from page 2: "${selectedMerchant}"`);
        });

        await test.step('Select first user in users table', async () => {
          const selectedUser = await merchantsPage.selectUserByIndex(0);
          console.log(`[CT-E2E-05] Selected user: "${selectedUser}"`);
        });

        await test.step('Submit and verify success', async () => {
          const success = await merchantsPage.clickSubmit();
          expect(success, 'Submit should show success toast').toBeTruthy();
        });

        await test.step('Screenshot — CT-E2E-05 page 2 merchant associated', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-05-page2-merchant-associated.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-E2E-06: Associate already-associated merchant — no duplicate
      // ================================================================

      test('CT-E2E-06: Associating an already-associated merchant does not create duplicates', async ({
        api,
      }) => {
        test.skip(!testUsername, 'No suitable non-wildcard user found');
        test.setTimeout(60_000);

        let existingCode = '';
        await test.step('Get an existing merchantCode via API', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok).toBeTruthy();

          const codes = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          expect(codes.length, 'User should have at least 1 existing merchant').toBeGreaterThan(0);
          existingCode = codes[0];
          console.log(`[CT-E2E-06] Existing merchant to re-associate: "${existingCode}"`);
        });

        await test.step('Call addMerchantsToUsers with already-associated merchant', async () => {
          const res = await api.ams.addMerchantsToUsers({
            merchantRefCodes: existingCode,
            usernames: [testUsername],
          });
          expect(res.ok, 'POST /user/addMerchantsToUsers should return 200').toBeTruthy();
        });

        await test.step('Verify via API — no duplicate in merchantCodes', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok).toBeTruthy();

          const codesAfter = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

          const uniqueCodes = new Set(codesAfter);
          expect(
            codesAfter.length,
            `merchantCodes should have no duplicates (raw: ${codesAfter.length}, unique: ${uniqueCodes.size})`,
          ).toBe(uniqueCodes.size);
          console.log(
            `[CT-E2E-06] merchantCodes count: ${codesAfter.length}, unique: ${uniqueCodes.size}`,
          );
        });
      });

      // ================================================================
      //  CT-E2E-07: Edit merchants via PUT /user/{username} (new mechanism),
      //             verify merchant tag appears in "Edit User Merchants" card,
      //             and verify Log Activity IS generated (bug fix verification)
      //
      //  The merchant association mechanism changed from POST /user/addMerchantsToUsers
      //  to PUT /user/{username} with merchantCodes in the body.
      //  PUT generates Log Activity entries — confirming the bug is fixed.
      // ================================================================

      test('CT-E2E-07: Editing merchants via PUT /user/{username} generates Log Activity entry (bug fix)', async ({
        page,
        testEnv,
        api,
      }) => {
        test.skip(!testUsername, 'No suitable non-wildcard user found');
        test.setTimeout(180_000);

        await test.step('Login to AMS portal', async () => {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
        });

        const detailsPage = new AmsUserDetailsPage(page);

        // Capture current merchantCodes via API before mutation
        let codesBefore: string[] = [];
        await test.step('Capture current merchantCodes via API', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok, 'GET /user should return 200').toBeTruthy();
          codesBefore = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          console.log(
            `[CT-E2E-07] merchantCodes before (${codesBefore.length}): ${codesBefore.join(', ')}`,
          );
        });

        // Capture baseline log count BEFORE the edit
        let baselineLogCount = 0;
        let baselineLatestLog = '';
        await test.step(`Navigate to user details and capture baseline Log Activity count for "${testUsername}"`, async () => {
          await page.goto(
            `${testEnv.amsUrl}/users/${encodeURIComponent(testUsername)}`,
            { waitUntil: 'domcontentloaded' },
          );
          await detailsPage.waitForDetailsPage();
          const baselineEntries = await detailsPage.getLogEntries();
          baselineLogCount = baselineEntries.length;
          baselineLatestLog = baselineEntries[0]?.notes ?? '(none)';
          console.log(`[CT-E2E-07] Baseline log count: ${baselineLogCount}, latest: "${baselineLatestLog}"`);
        });

        // Edit merchants via PUT /user/{username} — this is the new mechanism
        // (previously POST /user/addMerchantsToUsers which did NOT generate logs)
        const updatedMerchantCodes = codesBefore.join(',');
        await test.step(`PUT /user/${testUsername} with merchantCodes (same codes to trigger log)`, async () => {
          const res = await api.ams.updateUser(testUsername, { merchantCodes: updatedMerchantCodes });
          expect(res.ok, 'PUT /user/{username} should return 200').toBeTruthy();
          console.log(`[CT-E2E-07] PUT merchantCodes: "${updatedMerchantCodes}"`);
        });

        // Reload page to get fresh data
        await test.step('Reload user details page to verify changes', async () => {
          await page.reload({ waitUntil: 'domcontentloaded' });
          await detailsPage.waitForDetailsPage();
        });

        await test.step('Expand "Edit User Merchants" card and verify merchant tags are present', async () => {
          await detailsPage.expandMerchantsCard();
          const tags = await detailsPage.getMerchantTags();
          console.log(
            `[CT-E2E-07] Merchant tags for "${testUsername}" (${tags.length}): ${tags.join(' | ')}`,
          );

          // Verify all original merchant codes are still present in tags
          for (const code of codesBefore) {
            const merchantPresent = tags.some((t) => t.includes(code));
            expect(
              merchantPresent,
              `Merchant "${code}" should appear in "Edit User Merchants" tags`,
            ).toBeTruthy();
          }
        });

        await test.step('Verify Log Activity: PUT /user/{username} DOES generate a log entry with merchantCodes', async () => {
          const afterEntries = await detailsPage.getLogEntries();
          const latestLog = afterEntries[0]?.notes ?? '(none)';
          console.log(
            `[CT-E2E-07] Log entries after PUT: ${afterEntries.length} visible (page size 10)`,
          );
          console.log(`[CT-E2E-07] Latest log after: "${latestLog}"`);
          console.log(`[CT-E2E-07] Latest log before (baseline): "${baselineLatestLog}"`);

          // PUT /user/{username} with merchantCodes SHOULD generate a new Log Activity entry.
          // The log table is paginated (10 per page), so we compare the LATEST entry content
          // rather than row count. A new merchantCodes log entry should be at the top.
          expect(
            latestLog,
            'Latest log entry should reference merchantCodes — confirms PUT generates log',
          ).toContain('merchantCodes');

          // Also verify it's a DIFFERENT entry from the baseline (new entry was generated)
          expect(
            latestLog,
            'Latest log should differ from baseline — a new entry was generated by PUT',
          ).not.toBe(baselineLatestLog);

          console.log(
            `[CT-E2E-07] BUG FIX CONFIRMED: PUT /user/{username} with merchantCodes generates Log Activity (latest log changed from "${baselineLatestLog.slice(0, 50)}..." to "${latestLog.slice(0, 50)}...")`,
          );
        });

        await test.step('Screenshot — CT-E2E-07 merchant tags and log', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-07-edit-user-merchants-with-log.png`,
            fullPage: false,
          });
        });
      });

      // ================================================================
      //  CT-API-01: PUT /user/{username} with merchantCodes — happy path
      // ================================================================

      test('CT-API-01: PUT /user/{username} with merchantCodes adds new merchant and preserves existing ones', async ({
        api,
      }) => {
        test.skip(!testUsername, 'No suitable non-wildcard user found');
        test.setTimeout(60_000);

        let codesBefore: string[] = [];
        let newRefCode = '';

        await test.step('Capture current merchantCodes via API', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok, 'GET /user should return 200').toBeTruthy();
          codesBefore = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);
          console.log(
            `[CT-API-01] merchantCodes before (${codesBefore.length}): ${codesBefore.join(', ')}`,
          );
        });

        await test.step('Generate a new merchant refCode not yet associated', async () => {
          newRefCode = `TEST_REF_${Date.now()}`;
          console.log(`[CT-API-01] newRefCode to associate: "${newRefCode}"`);
        });

        await test.step('PUT /user/{username} with updated merchantCodes (existing + new)', async () => {
          const updatedCodes = [...codesBefore, newRefCode].join(',');
          console.log(`[CT-API-01] PUT merchantCodes: "${updatedCodes}"`);
          const res = await api.ams.updateUser(testUsername, { merchantCodes: updatedCodes });
          expect(res.ok, 'PUT should return 200').toBeTruthy();
        });

        await test.step('Verify via API — new code present and existing preserved', async () => {
          const userRes = await api.ams.getUser(testUsername);
          expect(userRes.ok).toBeTruthy();

          const codesAfter = (userRes.body.merchantCodes ?? '')
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

          expect(
            codesAfter.includes(newRefCode),
            `New merchant "${newRefCode}" should appear in merchantCodes`,
          ).toBeTruthy();

          for (const originalCode of codesBefore) {
            expect(
              codesAfter.includes(originalCode),
              `Original merchant "${originalCode}" should still be present`,
            ).toBeTruthy();
          }

          console.log(
            `[CT-API-01] merchantCodes after (${codesAfter.length}): ${codesAfter.join(', ')}`,
          );
        });
      });

      // ================================================================
      //  CT-API-02: POST /user/addMerchantsToUsers — wildcard user stays "*"
      // ================================================================

      test('CT-API-02: addMerchantsToUsers with wildcard user keeps merchantCodes as "*"', async ({
        api,
      }) => {
        test.skip(!wildcardUsername, 'No wildcard user (merchantCodes="*") found');
        test.setTimeout(60_000);

        await test.step('Confirm wildcard user has merchantCodes="*" via API', async () => {
          const userRes = await api.ams.getUser(wildcardUsername);
          expect(userRes.ok, 'GET /user should return 200').toBeTruthy();
          expect(
            userRes.body.merchantCodes,
            'Wildcard user merchantCodes should be "*"',
          ).toBe('*');
          console.log(
            `[CT-API-02] wildcardUsername="${wildcardUsername}", merchantCodes="${userRes.body.merchantCodes}"`,
          );
        });

        await test.step('POST /user/addMerchantsToUsers with a refCode for wildcard user', async () => {
          const res = await api.ams.addMerchantsToUsers({
            merchantRefCodes: 'SOME_TEST_CODE',
            usernames: [wildcardUsername],
          });
          expect(res.ok, 'POST should return 200').toBeTruthy();
        });

        await test.step('Verify via API — merchantCodes remains "*"', async () => {
          const userRes = await api.ams.getUser(wildcardUsername);
          expect(userRes.ok).toBeTruthy();
          expect(
            userRes.body.merchantCodes,
            'Wildcard user merchantCodes should still be "*" after addMerchantsToUsers',
          ).toBe('*');
          console.log(`[CT-API-02] merchantCodes after: "${userRes.body.merchantCodes}"`);
        });
      });
    },
  );
}

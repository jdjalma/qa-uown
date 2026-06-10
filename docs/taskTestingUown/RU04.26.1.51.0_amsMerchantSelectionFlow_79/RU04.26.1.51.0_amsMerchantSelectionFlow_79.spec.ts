/**
 * Task #79 — AMS | Improve merchant selection flow in AMS
 *
 * Validates the new "Edit User Merchants" component on the user details page.
 * The old component was replaced with:
 *   - "Manage merchants" button → opens merchant management modal
 *   - "Delete All" button → removes all merchants
 *   - SAVE/CANCEL buttons for persisting changes
 *   - Merchant badges (read-only) with merchants-read_tag CSS class
 *
 * Run: npx playwright test docs/taskTestingUown/RU04.26.1.51.0_amsMerchantSelectionFlow_79/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { AmsUserDetailsPage } from '@pages/ams/index.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const SCREENSHOT_DIR =
  'docs/taskTestingUown/RU04.26.1.51.0_amsMerchantSelectionFlow_79/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_amsMerchantSelectionFlow_79';

const testData = [
  {
    env: 'qa2' as const,
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
    testUser: 'test.tester',
    wildcardUser: 'jmendes.gow',
  },
];

for (const td of testData) {
  test.describe(
    `${TEST_NAME} - ${td.env}`,
    { tag: splitTags(td.tag) },
    () => {
      test.describe.configure({ mode: 'serial' });
      test.use({ envName: td.env });

      let originalTestUserCodes = '';
      let loggedIn = false;

      test.beforeAll(async ({ api }) => {
        const testUserRes = await api.ams.getUser(td.testUser);
        expect(testUserRes.ok, `GET /user/${td.testUser}`).toBeTruthy();
        originalTestUserCodes = testUserRes.body.merchantCodes ?? '';
        console.log(`[beforeAll] ${td.testUser} merchantCodes="${originalTestUserCodes}"`);
      });

      test.afterAll(async ({ api }) => {
        const currentRes = await api.ams.getUser(td.testUser);
        if (currentRes.ok && currentRes.body.merchantCodes !== originalTestUserCodes) {
          console.log(`[afterAll] Restoring ${td.testUser}: "${currentRes.body.merchantCodes}" -> "${originalTestUserCodes}"`);
          await api.ams.updateUser(td.testUser, { merchantCodes: originalTestUserCodes });
        }
      });

      async function ensureLoggedIn(page: import('@playwright/test').Page, testEnv: import('@config/environment.js').ConfigEnvironment): Promise<void> {
        if (!loggedIn || page.url().includes('login') || page.url() === 'about:blank') {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
          loggedIn = true;
        }
        const isLoginPage = await page.locator('input[name="loginEmail"]').isVisible({ timeout: 1_000 }).catch(() => false);
        if (isLoginPage) {
          await loginToPortalWithOptions(page, testEnv.amsUrl, testEnv, 'admin');
          loggedIn = true;
        }
      }

      // ================================================================
      //  CT-01: Read-only view with specific merchants
      // ================================================================

      test('CT-01: Read-only view shows merchant badges for user with specific merchants', async ({
        page, testEnv,
      }) => {
        test.setTimeout(120_000);
        await ensureLoggedIn(page, testEnv);
        const detailsPage = new AmsUserDetailsPage(page);

        await test.step(`Navigate to /users/${td.testUser}`, async () => {
          await page.goto(`${testEnv.amsUrl}/users/${td.testUser}`, { waitUntil: 'networkidle' });
          await detailsPage.waitForDetailsPage();
        });

        await test.step('Expand merchants card', async () => {
          await detailsPage.expandMerchantsCard();
        });

        await test.step('Verify merchant badges are visible', async () => {
          const tags = await detailsPage.getMerchantTags();
          expect(tags.length, 'At least 2 merchant badges should be visible').toBeGreaterThanOrEqual(2);
          console.log(`[CT-01] Merchant badges (${tags.length}): ${tags.slice(0, 5).join(' | ')}`);
        });

        await test.step('Screenshot — CT-01', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-readonly-specific.png` });
        });
      });

      // ================================================================
      //  CT-02: Enter edit mode — "Manage merchants" and "Delete All" visible
      // ================================================================

      test('CT-02: Clicking pencil activates edit mode with "Manage merchants" and "Delete All" buttons', async ({
        page, testEnv,
      }) => {
        test.setTimeout(120_000);
        await ensureLoggedIn(page, testEnv);
        const detailsPage = new AmsUserDetailsPage(page);

        await test.step(`Navigate to /users/${td.testUser}`, async () => {
          await page.goto(`${testEnv.amsUrl}/users/${td.testUser}`, { waitUntil: 'networkidle' });
          await detailsPage.waitForDetailsPage();
          await detailsPage.expandMerchantsCard();
        });

        await test.step('Click pencil to enter edit mode', async () => {
          await detailsPage.clickEditMerchantsButton();
        });

        await test.step('Verify "Manage merchants" button visible', async () => {
          const visible = await detailsPage.isManageMerchantsVisible();
          expect(visible, '"Manage merchants" button should be visible').toBeTruthy();
        });

        await test.step('Verify "Delete All" button visible', async () => {
          const visible = await detailsPage.isDeleteAllVisible();
          expect(visible, '"Delete All" button should be visible').toBeTruthy();
        });

        await test.step('Verify SAVE and CANCEL buttons visible', async () => {
          const saveVisible = await page.locator('button:has-text("SAVE")').isVisible();
          const cancelVisible = await page.locator('button:has-text("CANCEL")').isVisible();
          expect(saveVisible, 'SAVE should be visible').toBeTruthy();
          expect(cancelVisible, 'CANCEL should be visible').toBeTruthy();
        });

        await test.step('Screenshot — CT-02 edit mode', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-edit-mode.png` });
        });

        await test.step('Click CANCEL', async () => {
          await detailsPage.cancelMerchantsEdit();
        });
      });

      // ================================================================
      //  CT-03: Cancel edit reverts changes
      // ================================================================

      test('CT-03: Cancelling edit reverts changes — no persistence', async ({
        page, testEnv,
      }) => {
        test.setTimeout(120_000);
        await ensureLoggedIn(page, testEnv);
        const detailsPage = new AmsUserDetailsPage(page);

        await test.step(`Navigate to /users/${td.testUser}`, async () => {
          await page.goto(`${testEnv.amsUrl}/users/${td.testUser}`, { waitUntil: 'networkidle' });
          await detailsPage.waitForDetailsPage();
          await detailsPage.expandMerchantsCard();
        });

        let tagsBefore: string[] = [];
        await test.step('Capture badges before edit', async () => {
          tagsBefore = await detailsPage.getMerchantTags();
          console.log(`[CT-03] Tags before: ${tagsBefore.join(' | ')}`);
        });

        await test.step('Enter edit mode and click Delete All', async () => {
          await detailsPage.clickEditMerchantsButton();
          await detailsPage.clickDeleteAll();
          await page.waitForTimeout(1000);
        });

        await test.step('Click CANCEL', async () => {
          await detailsPage.cancelMerchantsEdit();
        });

        await test.step('Verify badges are unchanged', async () => {
          const tagsAfter = await detailsPage.getMerchantTags();
          expect(tagsAfter.length, 'Badge count should remain the same after CANCEL').toBe(tagsBefore.length);
          console.log(`[CT-03] Tags after cancel: ${tagsAfter.join(' | ')}`);
        });

        await test.step('Screenshot — CT-03', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-03-cancel-reverts.png` });
        });
      });

      // ================================================================
      //  CT-04: Delete All removes all merchants, SAVE persists
      // ================================================================

      test('CT-04: Delete All removes all merchants and SAVE persists the change', async ({
        page, testEnv, api,
      }) => {
        test.setTimeout(180_000);
        await ensureLoggedIn(page, testEnv);
        const detailsPage = new AmsUserDetailsPage(page);

        await test.step(`Navigate to /users/${td.testUser}`, async () => {
          await page.goto(`${testEnv.amsUrl}/users/${td.testUser}`, { waitUntil: 'networkidle' });
          await detailsPage.waitForDetailsPage();
          await detailsPage.expandMerchantsCard();
        });

        let tagsBefore: string[] = [];
        await test.step('Capture badges before', async () => {
          tagsBefore = await detailsPage.getMerchantTags();
          expect(tagsBefore.length, 'Should have merchants to delete').toBeGreaterThan(0);
          console.log(`[CT-04] Tags before (${tagsBefore.length}): ${tagsBefore.join(' | ')}`);
        });

        await test.step('Enter edit mode and click Delete All', async () => {
          await detailsPage.clickEditMerchantsButton();
          await detailsPage.clickDeleteAll();
          await page.waitForTimeout(1000);
        });

        await test.step('Screenshot — badges marked for deletion', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-delete-all-marked.png` });
        });

        await test.step('Click SAVE', async () => {
          await detailsPage.saveMerchantsEdit();
        });

        await test.step('Verify via API — merchantCodes cleared', async () => {
          const userRes = await api.ams.getUser(td.testUser);
          expect(userRes.ok).toBeTruthy();
          const codes = (userRes.body.merchantCodes ?? '').trim();
          expect(codes === '' || codes === null, 'merchantCodes should be empty after Delete All').toBeTruthy();
          console.log(`[CT-04] API merchantCodes after Delete All: "${userRes.body.merchantCodes}"`);
        });

        await test.step('Restore merchantCodes via API', async () => {
          await api.ams.updateUser(td.testUser, { merchantCodes: originalTestUserCodes });
        });

        await test.step('Screenshot — CT-04', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-04-delete-all.png` });
        });
      });

      // ================================================================
      //  CT-05: API persistence verification
      // ================================================================

      test('CT-05: API round-trip — GET, PUT merchantCodes, GET verifies update', async ({
        api,
      }) => {
        test.setTimeout(60_000);

        let currentCodes = '';
        await test.step('GET current merchantCodes', async () => {
          const userRes = await api.ams.getUser(td.testUser);
          expect(userRes.ok).toBeTruthy();
          currentCodes = userRes.body.merchantCodes ?? '';
          console.log(`[CT-05] Current merchantCodes: "${currentCodes}"`);
        });

        const testCode = `TEST_API_${Date.now()}`;
        const updatedCodes = currentCodes ? `${currentCodes},${testCode}` : testCode;

        await test.step('PUT with appended test code', async () => {
          const putRes = await api.ams.updateUser(td.testUser, { merchantCodes: updatedCodes });
          expect(putRes.ok, 'PUT should return 200').toBeTruthy();
        });

        await test.step('GET and verify updated merchantCodes', async () => {
          const userRes = await api.ams.getUser(td.testUser);
          expect(userRes.ok).toBeTruthy();
          expect(userRes.body.merchantCodes, `Should contain "${testCode}"`).toContain(testCode);
          console.log(`[CT-05] Updated merchantCodes: "${userRes.body.merchantCodes}"`);
        });

        await test.step('Restore original merchantCodes', async () => {
          const putRes = await api.ams.updateUser(td.testUser, { merchantCodes: currentCodes });
          expect(putRes.ok, 'Restore PUT should return 200').toBeTruthy();
        });
      });

      // ================================================================
      //  CT-06: Manage merchants button opens modal
      // ================================================================

      test('CT-06: "Manage merchants" button opens merchant management interface', async ({
        page, testEnv,
      }) => {
        test.setTimeout(120_000);
        await ensureLoggedIn(page, testEnv);
        const detailsPage = new AmsUserDetailsPage(page);

        await test.step(`Navigate to /users/${td.testUser}`, async () => {
          await page.goto(`${testEnv.amsUrl}/users/${td.testUser}`, { waitUntil: 'networkidle' });
          await detailsPage.waitForDetailsPage();
          await detailsPage.expandMerchantsCard();
        });

        await test.step('Enter edit mode', async () => {
          await detailsPage.clickEditMerchantsButton();
        });

        await test.step('Click "Manage merchants"', async () => {
          await detailsPage.clickManageMerchants();
          await page.waitForTimeout(2000);
        });

        await test.step('Screenshot — CT-06 manage merchants', async () => {
          await page.screenshot({ path: `${SCREENSHOT_DIR}/${TEST_NAME}-06-manage-merchants.png`, fullPage: true });
        });

        // Check what opened (modal, new page, or inline)
        await test.step('Verify merchant management interface opened', async () => {
          // Check for modal
          const hasModal = await page.locator('.modal.show, [role="dialog"]').isVisible().catch(() => false);
          // Check for filter/search
          const hasFilter = await page.locator('.filter__control').isVisible().catch(() => false);
          // Check for table
          const hasTable = await page.locator('table, .rdt_Table').isVisible().catch(() => false);
          // Check URL changed
          const urlChanged = !page.url().includes(`/users/${td.testUser}`);

          console.log(`[CT-06] modal=${hasModal}, filter=${hasFilter}, table=${hasTable}, urlChanged=${urlChanged}`);
          // At least one of these should be true (some interface opened)
          expect(hasModal || hasFilter || hasTable || urlChanged, 'Some merchant management interface should open').toBeTruthy();
        });

        // Navigate back to cancel
        await test.step('Navigate back to user page', async () => {
          if (!page.url().includes(`/users/${td.testUser}`)) {
            await page.goto(`${testEnv.amsUrl}/users/${td.testUser}`, { waitUntil: 'networkidle' });
          } else {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(1000);
          }
        });
      });
    },
  );
}

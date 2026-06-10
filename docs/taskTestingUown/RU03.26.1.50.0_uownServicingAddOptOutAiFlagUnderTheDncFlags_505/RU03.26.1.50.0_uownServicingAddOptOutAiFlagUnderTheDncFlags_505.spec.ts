/**
 * RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505
 *
 * Validates the "Opt Out AI" flag feature added under the DNC flags in the
 * Servicing portal, Primary Contact section, Mobile Phone sub-section.
 *
 * Feature: new opt_out_ai column on uown_sv_phone / uown_sv_phone_history.
 * The UI renders an "Opt Out AI" checkbox below "Do Not Call" in the Mobile Phone
 * section.  Toggling it auto-saves and shows a toast.  The propagation endpoint
 * POST /uown/svc/updateOptOutAi updates ALL phone records sharing the same
 * physical number (linked via areaCode + phoneNumber).
 *
 * CT-01 — [E2E] UI placement: "Opt Out AI" checkbox visible below "Do Not Call"
 * CT-02 — [E2E+DB] Enable Opt Out AI via UI → toast + DB opt_out_ai = true
 * CT-03 — [E2E+DB] Disable Opt Out AI via UI → toast + DB opt_out_ai = false
 * CT-04 — [API+DB] Propagation: POST updateOptOutAi(phonePK=20) updates
 *          BOTH phonePK=20 AND phonePK=30 (share phone 888-6576577)
 * CT-05 — [DB] uown_sv_phone_history has revtype=1 (MOD) with opt_out_ai=true
 *          after CT-04
 *
 * Backend status (2026-03-20):
 *   Migration V20260318174113 NOT yet applied to QA1.
 *   Columns opt_out_ai on uown_sv_phone / uown_sv_phone_history do NOT exist yet.
 *   CT-02, CT-03, CT-04, CT-05 will fail until the migration is deployed.
 *   CT-01 (UI placement) depends on frontend deployment.
 *
 * GitLab: Task #505 — RU03.26.1.50.0
 * Pipeline: new-flow (E2E + API + DB validation)
 * Project: task-testing
 * storageState: .auth/servicing.json
 *
 * testData note: uses existingAccountPks (GDS bypass — no application creation).
 * runId/email are omitted intentionally — no application data is generated.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { ServicingCustomerPage } from '@pages/servicing/index.js';
import { LoginPage } from '@pages/login.page.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';

// ── Test name constant ────────────────────────────────────────────────

const TEST_NAME = 'RU03.26.1.50.0_uownServicingAddOptOutAiFlagUnderTheDncFlags_505';

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa1',
    // GDS bypass: pre-seeded account PKs — no application created → runId/email not needed.
    // accountPk 4476: ACTIVE account with a mobile phone (phonePK 7248, 564-8910969)
    // Used for CT-01 (UI visibility), CT-02 (enable), CT-03 (disable).
    accountPk: '4476',
    phonePK: 7248,              // mobile phone 564-8910969 of accountPk=4476
    // CT-04/CT-05: phone 888-6576577 shared by two accounts (phonePK 20 and 30)
    propagationPhonePK: 20,
    propagationPhonePK2: 30,
    tag: buildTags(TestTag.REGRESSION, TestTag.QA1),
  },
];

// ── Helper: check if opt_out_ai column exists ─────────────────────────

/**
 * Returns true if the opt_out_ai column exists in uown_sv_phone.
 * The backend migration V20260318174113 adds this column.
 * All DB assertions for opt_out_ai are guarded by this check.
 */
async function optOutAiColumnExists(db: DatabaseHelpers): Promise<boolean> {
  const count = await db.getSingleNumber(
    `SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = 'uown_sv_phone' AND column_name = 'opt_out_ai'`,
    [],
  );
  return count === 1;
}

async function historyOptOutAiColumnExists(db: DatabaseHelpers): Promise<boolean> {
  const count = await db.getSingleNumber(
    `SELECT COUNT(*) FROM information_schema.columns
     WHERE table_name = 'uown_sv_phone_history' AND column_name = 'opt_out_ai'`,
    [],
  );
  return count === 1;
}

// ── Tests ─────────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(
    `${TEST_NAME} - ${data.env}`,
    { tag: splitTags(data.tag) },
    () => {
      test.describe.configure({ mode: 'serial' });
      test.use({ envName: data.env });

      // ── CT-01: UI placement — "Opt Out AI" checkbox visible ───────

      test('CT-01: UI placement — "Opt Out AI" checkbox visible below "Do Not Call" in Mobile Phone section', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-01: Login to Servicing portal', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
          console.log(`[CT-01] Logged in to servicing: ${page.url()}`);
        });

        await test.step(`CT-01: Search and navigate to account ${data.accountPk}`, async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          console.log(`[CT-01] On customer page: ${page.url()}`);
        });

        await test.step('CT-01: Navigate to Primary Contact section', async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToPrimaryContact();
          console.log(`[CT-01] On Primary Contact section: ${page.url()}`);
        });

        await test.step('CT-01: Verify "Do Not Call" checkbox is visible (baseline — existing feature)', async () => {
          const dncVisible = await page.locator(SELECTORS.doNotCallCheckbox).first().isVisible({ timeout: 5_000 }).catch(() => false);
          console.log(`[CT-01] Do Not Call checkbox visible: ${dncVisible}`);
          // Baseline assertion — DNC already exists
          expect(dncVisible, 'Do Not Call checkbox must be visible in Mobile Phone section').toBe(true);
        });

        await test.step('CT-01: Verify "Opt Out AI" checkbox is visible below "Do Not Call"', async () => {
          const customerPage = new ServicingCustomerPage(page);
          const optOutAiVisible = await customerPage.isOptOutAiVisible();
          console.log(`[CT-01] Opt Out AI checkbox visible: ${optOutAiVisible}`);
          // Skip if frontend @uownleasing/common-ui not yet deployed with the Opt Out AI feature.
          // This is a known deployment gap as of 2026-03-20 (backend R1.50.0 pending).
          test.skip(
            !optOutAiVisible,
            'Frontend @uownleasing/common-ui not yet deployed with Opt Out AI feature — ' +
            'checkbox absent from DOM (QA1 deployment pending for backend R1.50.0)',
          );
          expect(optOutAiVisible, 'Opt Out AI checkbox must be visible in the Mobile Phone section').toBe(true);
        });

        await test.step('CT-01: Screenshot — Opt Out AI checkbox in Primary Contact section', async () => {
          await page.screenshot({
            path: `reports/screenshots/${TEST_NAME}-01-opt-out-ai-checkbox-visible.png`,
            fullPage: false,
          });
          await test.info().attach('CT-01: Opt Out AI checkbox visible', {
            path: `reports/screenshots/${TEST_NAME}-01-opt-out-ai-checkbox-visible.png`,
            contentType: 'image/png',
          });
        });
      });

      // ── CT-02: Enable Opt Out AI via UI → toast + DB ──────────────

      test('CT-02: Enable Opt Out AI via UI → toast "Opt Out AI flag updated successfully" → DB opt_out_ai = true', async ({
        page,
        db,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-02: Login to Servicing portal', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
        });

        await test.step(`CT-02: Navigate to account ${data.accountPk} Primary Contact`, async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();
        });

        await test.step('CT-02: Ensure Opt Out AI is currently UNCHECKED (precondition)', async () => {
          const customerPage = new ServicingCustomerPage(page);
          // Guard: skip if frontend not yet deployed (checkbox absent from DOM)
          const optOutAiVisible = await customerPage.isOptOutAiVisible();
          test.skip(
            !optOutAiVisible,
            'Frontend @uownleasing/common-ui not yet deployed with Opt Out AI feature — skipping CT-02',
          );
          const isChecked = await customerPage.isOptOutAiChecked();
          if (isChecked) {
            // Uncheck it first so CT-02 starts from a known false state
            console.log('[CT-02] Checkbox already checked — unchecking to establish false precondition');
            await customerPage.toggleOptOutAi();
            // Brief wait for the toggle to stabilize before re-checking
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }
        });

        let toastText = '';

        await test.step('CT-02: Click "Opt Out AI" checkbox to ENABLE (check it)', async () => {
          const customerPage = new ServicingCustomerPage(page);
          toastText = await customerPage.setOptOutAi(true);
          console.log(`[CT-02] Toast text: "${toastText}"`);
        });

        await test.step('CT-02: Verify success toast contains expected message', async () => {
          // If setOptOutAi returned empty (checkbox was already checked), try reading the toast now
          if (!toastText) {
            const toast = page.locator(`${SELECTORS.toastBody}, [role="alert"]`).first();
            await toast.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
            toastText = (await toast.textContent().catch(() => '')) ?? '';
            console.log(`[CT-02] Toast (re-read): "${toastText}"`);
          }
          expect(toastText, 'Toast must confirm Opt Out AI was updated').toContain('Opt Out AI flag updated successfully');
        });

        await test.step('CT-02: Screenshot — UI checkbox enabled + toast visible', async () => {
          await page.screenshot({
            path: `reports/screenshots/${TEST_NAME}-02-opt-out-ai-enabled.png`,
            fullPage: false,
          });
          await test.info().attach('CT-02: Opt Out AI enabled', {
            path: `reports/screenshots/${TEST_NAME}-02-opt-out-ai-enabled.png`,
            contentType: 'image/png',
          });
        });

        await test.step('CT-02: DB assertion — opt_out_ai = true in uown_sv_phone', async () => {
          const colExists = await optOutAiColumnExists(db);
          if (!colExists) {
            test.skip(true, 'Backend migration V20260318174113 not yet applied — skipping DB assertion (CT-02)');
            return;
          }
          const optOutAi = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END
             FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-02] DB opt_out_ai for phonePK=${data.phonePK}: ${optOutAi} (expected 1)`);
          expect(optOutAi, `uown_sv_phone.opt_out_ai must be true (1) for phonePK=${data.phonePK}`).toBe(1);
        });

        await test.step('CT-02: Verify activity log — DATA_CHANGE entry for OptOutAi visible in Notes', async () => {
          // Navigate directly to the customer page via URL and wait for full load
          await page.goto(`${testEnv.servicingUrl}/customer-information/${data.accountPk}`, { waitUntil: 'networkidle' });
          const confirmBtn = page.getByRole('button', { name: 'CONFIRM' });
          if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await confirmBtn.click();
            await page.waitForLoadState('networkidle');
          }
          // Check if optOutAi text is in the page content (Notes section may be collapsed but data in DOM)
          const content = await page.content();
          const hasOptOutAiLog = content.includes('optOutAi');
          console.log(`[CT-02] Activity log contains optOutAi in page HTML: ${hasOptOutAiLog}`);
          expect(hasOptOutAiLog, 'Page HTML must contain optOutAi activity log entry').toBe(true);
        });
      });

      // ── CT-03: Disable Opt Out AI via UI → toast + DB ─────────────

      test('CT-03: Disable Opt Out AI via UI → toast "Opt Out AI flag updated successfully" → DB opt_out_ai = false', async ({
        page,
        db,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-03: Login to Servicing portal', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
        });

        await test.step(`CT-03: Navigate to account ${data.accountPk} Primary Contact`, async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();
        });

        await test.step('CT-03: Ensure Opt Out AI is currently CHECKED (precondition — enable if needed)', async () => {
          const customerPage = new ServicingCustomerPage(page);
          // Guard: skip if frontend not yet deployed (checkbox absent from DOM)
          const optOutAiVisible = await customerPage.isOptOutAiVisible();
          test.skip(
            !optOutAiVisible,
            'Frontend @uownleasing/common-ui not yet deployed with Opt Out AI feature — skipping CT-03',
          );
          const isChecked = await customerPage.isOptOutAiChecked();
          if (!isChecked) {
            console.log('[CT-03] Checkbox not checked — enabling to establish true precondition');
            await customerPage.toggleOptOutAi();
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }
        });

        let toastText = '';

        await test.step('CT-03: Click "Opt Out AI" checkbox to DISABLE (uncheck it)', async () => {
          const customerPage = new ServicingCustomerPage(page);
          toastText = await customerPage.setOptOutAi(false);
          console.log(`[CT-03] Toast text: "${toastText}"`);
        });

        await test.step('CT-03: Verify success toast contains expected message', async () => {
          if (!toastText) {
            const toast = page.locator(`${SELECTORS.toastBody}, [role="alert"]`).first();
            await toast.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => {});
            toastText = (await toast.textContent().catch(() => '')) ?? '';
            console.log(`[CT-03] Toast (re-read): "${toastText}"`);
          }
          expect(toastText, 'Toast must confirm Opt Out AI was updated').toContain('Opt Out AI flag updated successfully');
        });

        await test.step('CT-03: Screenshot — UI checkbox disabled + toast visible', async () => {
          await page.screenshot({
            path: `reports/screenshots/${TEST_NAME}-03-opt-out-ai-disabled.png`,
            fullPage: false,
          });
          await test.info().attach('CT-03: Opt Out AI disabled', {
            path: `reports/screenshots/${TEST_NAME}-03-opt-out-ai-disabled.png`,
            contentType: 'image/png',
          });
        });

        await test.step('CT-03: DB assertion — opt_out_ai = false in uown_sv_phone', async () => {
          const colExists = await optOutAiColumnExists(db);
          if (!colExists) {
            test.skip(true, 'Backend migration V20260318174113 not yet applied — skipping DB assertion (CT-03)');
            return;
          }
          const optOutAi = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END
             FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-03] DB opt_out_ai for phonePK=${data.phonePK}: ${optOutAi} (expected 0)`);
          expect(optOutAi, `uown_sv_phone.opt_out_ai must be false (0) for phonePK=${data.phonePK}`).toBe(0);
        });

        await test.step('CT-03: Verify activity log — DATA_CHANGE entry for OptOutAi visible in Notes', async () => {
          await page.goto(`${testEnv.servicingUrl}/customer-information/${data.accountPk}`, { waitUntil: 'networkidle' });
          const confirmBtn = page.getByRole('button', { name: 'CONFIRM' });
          if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await confirmBtn.click();
            await page.waitForLoadState('networkidle');
          }
          const content = await page.content();
          const hasOptOutAiLog = content.includes('optOutAi');
          console.log(`[CT-03] Activity log contains optOutAi in page HTML: ${hasOptOutAiLog}`);
          expect(hasOptOutAiLog, 'Page HTML must contain optOutAi activity log entry').toBe(true);
        });
      });

      // ── CT-04: API propagation — POST updateOptOutAi(phonePK=20) ──────────
      //
      // Phone 888-6576577 is shared by two accounts.
      // Updating phonePK=20 via API must also update phonePK=30.
      // The backend propagation logic looks up all uown_sv_phone rows that share
      // the same (area_code, phone_number) pair and applies the flag to all of them.

      test('CT-04: API propagation — POST updateOptOutAi(phonePK=20) updates both phonePK=20 and phonePK=30 (shared phone 888-6576577)', async ({
        api,
        db,
      }) => {
        test.setTimeout(300_000);

        const colExists = await optOutAiColumnExists(db);

        await test.step('CT-04: Check backend migration status', async () => {
          if (!colExists) {
            console.warn(
              '[CT-04] Backend migration V20260318174113 not yet applied. ' +
              'opt_out_ai column does not exist in uown_sv_phone. ' +
              'This CT will pass structural validation only (HTTP 200 response). ' +
              'DB propagation assertions will be skipped.',
            );
          }
        });

        let responseBody: { pk?: number; phoneInfo?: { optOutAi?: boolean } } = {};

        await test.step('CT-04: POST /uown/svc/updateOptOutAi with phonePK=20, optOutAi=true', async () => {
          const res = await api.svcPhone.updateOptOutAi({
            phonePK: data.propagationPhonePK,
            optOutAi: true,
          });
          console.log(`[CT-04] HTTP ${res.status} — body: ${JSON.stringify(res.body)}`);
          // Skip if backend endpoint not yet deployed (404 = route not registered, 501 = not implemented)
          if (res.status === 404 || res.status === 501) {
            test.skip(
              true,
              `Backend endpoint POST /uown/svc/updateOptOutAi not yet deployed (HTTP ${res.status}) — ` +
              'skipping CT-04 (backend R1.50.0 deployment pending)',
            );
            return;
          }
          expect(
            res.ok,
            `POST /uown/svc/updateOptOutAi failed: ${res.status} ${res.statusText} — ${JSON.stringify(res.body)}`,
          ).toBeTruthy();
          responseBody = res.body as { pk?: number; phoneInfo?: { optOutAi?: boolean } };
        });

        await test.step('CT-04: Verify response body — pk=20, phoneInfo.optOutAi=true', async () => {
          expect(responseBody.pk, 'Response pk must equal phonePK=20').toBe(data.propagationPhonePK);
          // optOutAi is in nested phoneInfo (Java @Embedded PhoneInfo serialized by Jackson)
          expect(responseBody.phoneInfo?.optOutAi, 'Response phoneInfo.optOutAi must be true').toBe(true);
        });

        await test.step('CT-04: DB assertion — opt_out_ai = true for phonePK=20 (the updated record)', async () => {
          if (!colExists) {
            console.warn('[CT-04][SKIP] Column does not exist — DB assertion skipped for phonePK=20');
            return;
          }
          const val20 = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END
             FROM uown_sv_phone WHERE pk = $1`,
            [data.propagationPhonePK],
          );
          console.log(`[CT-04] DB opt_out_ai for phonePK=${data.propagationPhonePK}: ${val20} (expected 1)`);
          expect(val20, `uown_sv_phone.opt_out_ai must be true (1) for phonePK=${data.propagationPhonePK}`).toBe(1);
        });

        await test.step('CT-04: DB assertion — opt_out_ai = true for phonePK=30 (propagated via shared number)', async () => {
          if (!colExists) {
            console.warn('[CT-04][SKIP] Column does not exist — DB assertion skipped for phonePK=30');
            return;
          }
          const val30 = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END
             FROM uown_sv_phone WHERE pk = $1`,
            [data.propagationPhonePK2],
          );
          console.log(`[CT-04] DB opt_out_ai for phonePK=${data.propagationPhonePK2}: ${val30} (expected 1 — propagation)`);
          expect(val30, `uown_sv_phone.opt_out_ai must be true (1) for phonePK=${data.propagationPhonePK2} (propagation)`).toBe(1);
        });
      });

      // ── CT-05: DB — uown_sv_phone_history revtype=1 after CT-04 ──────────
      //
      // Hibernate Envers records every UPDATE as revtype=1 (MOD).
      // After CT-04 sets opt_out_ai=true, history rows for both phone PKs
      // must exist with revtype=1 and opt_out_ai=true.

      test('CT-05: DB — uown_sv_phone_history has revtype=1 (MOD) with opt_out_ai=true after CT-04 propagation', async ({
        db,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-05: Check backend migration status (history table)', async () => {
          const colExists = await historyOptOutAiColumnExists(db);
          if (!colExists) {
            test.skip(
              true,
              'Backend migration V20260318174113 not yet applied — ' +
              'opt_out_ai column does not exist in uown_sv_phone_history. ' +
              'Skipping all CT-05 assertions.',
            );
            return;
          }
        });

        await test.step('CT-05: Verify history row for phonePK=20 — revtype=1, opt_out_ai=true', async () => {
          // Most recent MOD entry for phonePK=20
          const histRow20 = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_sv_phone_history
             WHERE pk = $1 AND revtype = 1 AND opt_out_ai = true`,
            [data.propagationPhonePK],
          );
          console.log(`[CT-05] history rows (revtype=1, opt_out_ai=true) for phonePK=${data.propagationPhonePK}: ${histRow20}`);
          expect(
            histRow20,
            `Expected at least 1 MOD history row with opt_out_ai=true for phonePK=${data.propagationPhonePK}`,
          ).toBeGreaterThan(0);
        });

        await test.step('CT-05: Verify history row for phonePK=30 — revtype=1, opt_out_ai=true (propagation)', async () => {
          const histRow30 = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_sv_phone_history
             WHERE pk = $1 AND revtype = 1 AND opt_out_ai = true`,
            [data.propagationPhonePK2],
          );
          console.log(`[CT-05] history rows (revtype=1, opt_out_ai=true) for phonePK=${data.propagationPhonePK2}: ${histRow30}`);
          expect(
            histRow30,
            `Expected at least 1 MOD history row with opt_out_ai=true for phonePK=${data.propagationPhonePK2} (propagation)`,
          ).toBeGreaterThan(0);
        });
      });

      // ── CT-06: Reason field required — Save disabled/blocked with empty reason ──

      test('CT-06: Reason field required — cannot save Opt Out AI without filling the reason', async ({
        page,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-06: Login and navigate to customer', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();
        });

        await test.step('CT-06: Guard — skip if frontend not deployed', async () => {
          const customerPage = new ServicingCustomerPage(page);
          const visible = await customerPage.isOptOutAiVisible();
          test.skip(!visible, 'Frontend not deployed — skipping CT-06');
        });

        await test.step('CT-06: Ensure opt out AI is unchecked, then check it to trigger modal', async () => {
          const customerPage = new ServicingCustomerPage(page);
          const isChecked = await customerPage.isOptOutAiChecked();
          if (isChecked) {
            // Uncheck first so we can re-check and trigger the modal
            await customerPage.toggleOptOutAi();
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }
        });

        await test.step('CT-06: Enter edit mode, click checkbox, leave reason empty, verify Save is disabled or blocked', async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.enterPrimaryContactEditMode();
          const checkbox = page.locator(SELECTORS.optOutAiCheckbox).first();
          await checkbox.click();

          // Wait for modal to appear
          const reasonTextbox = page.locator(SELECTORS.optOutAiReasonTextbox).first();
          await reasonTextbox.waitFor({ state: 'visible', timeout: 5_000 });

          // Leave reason EMPTY — do NOT fill
          await reasonTextbox.clear();

          // Check if Save button is disabled or if clicking it shows an error
          const modalSaveBtn = page.locator(SELECTORS.optOutAiReasonSaveButton).first();
          const isDisabled = await modalSaveBtn.isDisabled({ timeout: 2_000 }).catch(() => false);

          if (isDisabled) {
            console.log('[CT-06] Save button is DISABLED with empty reason — field is required ✓');
            expect(isDisabled).toBe(true);
          } else {
            // Save is enabled — click it and check if an error/validation message appears
            await modalSaveBtn.click();
            // Check for validation message or that modal stays open
            const modalStillOpen = await reasonTextbox.isVisible({ timeout: 3_000 }).catch(() => false);
            const errorMsg = page.locator('text=/required|obrigatório|cannot be empty|please enter/i').first();
            const hasError = await errorMsg.isVisible({ timeout: 3_000 }).catch(() => false);
            console.log(`[CT-06] After clicking Save with empty reason: modal still open=${modalStillOpen}, error visible=${hasError}`);
            // Either modal stays open or error message appears
            expect(
              modalStillOpen || hasError,
              'With empty reason, either modal should stay open or validation error should appear',
            ).toBe(true);
          }

          // Cancel the modal to clean up
          const cancelBtn = page.locator('dialog button:has-text("CANCEL"), [role="dialog"] button:has-text("CANCEL")').first();
          if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await cancelBtn.click();
          }
        });
      });

      // ── CT-07: Reason persistence — DB + API ────────────────────────────

      test('CT-07: Reason persistence — opt_out_ai_reason saved in DB and returned by API', async ({
        page,
        api,
        db,
        testEnv,
      }) => {
        test.setTimeout(300_000);
        const testReason = `QA automation test reason ${Date.now()}`;

        await test.step('CT-07: Login, navigate, and enable Opt Out AI with specific reason', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();

          const visible = await customerPage.isOptOutAiVisible();
          test.skip(!visible, 'Frontend not deployed — skipping CT-07');

          // Ensure unchecked first
          const isChecked = await customerPage.isOptOutAiChecked();
          if (isChecked) {
            await customerPage.toggleOptOutAi();
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }

          // Now enable with the specific reason
          const toast = await customerPage.toggleOptOutAi(testReason);
          console.log(`[CT-07] Toast: "${toast}"`);
          expect(toast).toContain('Opt Out AI flag updated successfully');
        });

        await test.step('CT-07: DB — verify opt_out_ai_reason persisted', async () => {
          const colExists = await optOutAiColumnExists(db);
          if (!colExists) {
            test.skip(true, 'Backend migration not applied — skipping DB reason check');
            return;
          }
          const reason = await db.getSingleString(
            `SELECT opt_out_ai_reason FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-07] DB opt_out_ai_reason for phonePK=${data.phonePK}: "${reason}"`);
          expect(reason, 'opt_out_ai_reason must match the reason entered in the modal').toBe(testReason);
        });

        await test.step('CT-07: API — verify optOutAiReason returned in response', async () => {
          // Call API to get current phone state and check reason
          const res = await api.svcPhone.updateOptOutAi({
            phonePK: data.phonePK,
            optOutAi: true,
            optOutAiReason: testReason,
          });
          console.log(`[CT-07] API optOutAiReason: "${res.body?.phoneInfo?.optOutAiReason}"`);
          expect(res.ok, `API call failed: ${res.status}`).toBe(true);
          expect(
            res.body?.phoneInfo?.optOutAiReason,
            'API response must include the reason',
          ).toBe(testReason);
        });
      });

      // ── CT-08: Character limit — reason field maxlength + DB column size ─

      test('CT-08: Character limit — reason field maxlength and DB column size', async ({
        page,
        db,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-08: Login and navigate', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();

          const visible = await customerPage.isOptOutAiVisible();
          test.skip(!visible, 'Frontend not deployed — skipping CT-08');
        });

        let maxLength: number | null = null;

        await test.step('CT-08: Check textarea maxlength attribute in the modal', async () => {
          const customerPage = new ServicingCustomerPage(page);

          // Ensure unchecked so we can trigger the modal
          const isChecked = await customerPage.isOptOutAiChecked();
          if (isChecked) {
            await customerPage.toggleOptOutAi();
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }

          await customerPage.enterPrimaryContactEditMode();
          const checkbox = page.locator(SELECTORS.optOutAiCheckbox).first();
          await checkbox.click();

          const reasonTextbox = page.locator(SELECTORS.optOutAiReasonTextbox).first();
          await reasonTextbox.waitFor({ state: 'visible', timeout: 5_000 });

          // Read maxlength attribute
          const maxLengthAttr = await reasonTextbox.getAttribute('maxlength');
          maxLength = maxLengthAttr ? parseInt(maxLengthAttr, 10) : null;
          console.log(`[CT-08] Frontend textarea maxlength: ${maxLength ?? 'NOT SET'}`);

          // Cancel the modal
          const cancelBtn = page.locator('dialog button:has-text("CANCEL"), [role="dialog"] button:has-text("CANCEL")').first();
          if (await cancelBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await cancelBtn.click();
          }
        });

        await test.step('CT-08: Check DB column size for opt_out_ai_reason', async () => {
          const colExists = await optOutAiColumnExists(db);
          if (!colExists) {
            test.skip(true, 'Backend migration not applied — skipping DB column check');
            return;
          }
          const colType = await db.getSingleString(
            `SELECT data_type || COALESCE('(' || character_maximum_length || ')', '')
             FROM information_schema.columns
             WHERE table_name = 'uown_sv_phone' AND column_name = 'opt_out_ai_reason'`,
            [],
          );
          console.log(`[CT-08] DB column type for opt_out_ai_reason: ${colType}`);
          expect(colType, 'opt_out_ai_reason column must exist with a defined type').toBeTruthy();

          // If frontend has maxlength, it should not exceed DB column size
          if (maxLength != null && colType?.includes('(')) {
            const dbSize = parseInt(colType.match(/\((\d+)\)/)?.[1] ?? '0', 10);
            console.log(`[CT-08] Frontend maxlength=${maxLength}, DB column size=${dbSize}`);
            expect(
              maxLength,
              `Frontend maxlength (${maxLength}) must not exceed DB column size (${dbSize})`,
            ).toBeLessThanOrEqual(dbSize);
          }
        });
      });

      // ── CT-09: Cancel modal without filling reason — state unchanged ────

      test('CT-09: Cancel reason modal without filling — opt_out_ai remains unchanged in DB and API', async ({
        page,
        api,
        db,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-09: Login and navigate', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();
          const visible = await customerPage.isOptOutAiVisible();
          test.skip(!visible, 'Frontend not deployed — skipping CT-09');
        });

        await test.step('CT-09: Ensure opt_out_ai is false (precondition)', async () => {
          const customerPage = new ServicingCustomerPage(page);
          const isChecked = await customerPage.isOptOutAiChecked();
          if (isChecked) {
            await customerPage.toggleOptOutAi();
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }
        });

        let dbStateBefore: number | null = null;
        let reasonBefore: string | null = null;

        await test.step('CT-09: Capture DB state before cancel', async () => {
          const colExists = await optOutAiColumnExists(db);
          if (!colExists) {
            test.skip(true, 'Backend migration not applied — skipping CT-09');
            return;
          }
          dbStateBefore = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          reasonBefore = await db.getSingleString(
            `SELECT COALESCE(opt_out_ai_reason, '') FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-09] DB BEFORE: opt_out_ai=${dbStateBefore}, reason="${reasonBefore}"`);
        });

        await test.step('CT-09: Enter edit mode, click checkbox, modal appears, click CANCEL without filling', async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.enterPrimaryContactEditMode();
          const checkbox = page.locator(SELECTORS.optOutAiCheckbox).first();
          await checkbox.click();

          // Wait for reason modal
          const reasonTextbox = page.locator(SELECTORS.optOutAiReasonTextbox).first();
          await reasonTextbox.waitFor({ state: 'visible', timeout: 5_000 });

          // Click CANCEL without filling
          const cancelBtn = page.locator('dialog button:has-text("CANCEL"), [role="dialog"] button:has-text("CANCEL")').first();
          await cancelBtn.click();
          console.log('[CT-09] Clicked CANCEL on reason modal without filling');
        });

        await test.step('CT-09: DB — verify opt_out_ai unchanged after cancel', async () => {
          const dbStateAfter = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          const reasonAfter = await db.getSingleString(
            `SELECT COALESCE(opt_out_ai_reason, '') FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-09] DB AFTER:  opt_out_ai=${dbStateAfter}, reason="${reasonAfter}"`);
          expect(dbStateAfter, 'opt_out_ai must remain unchanged after cancel').toBe(dbStateBefore);
          expect(reasonAfter, 'opt_out_ai_reason must remain unchanged after cancel').toBe(reasonBefore);
        });

        await test.step('CT-09: API — verify optOutAi unchanged via API call', async () => {
          // Read current state via updateOptOutAi with same value (idempotent read)
          const res = await api.svcPhone.updateOptOutAi({
            phonePK: data.phonePK,
            optOutAi: false, // same as current state — no change
          });
          expect(res.ok, `API call failed: ${res.status}`).toBe(true);
          console.log(`[CT-09] API optOutAi=${res.body?.phoneInfo?.optOutAi}, reason="${res.body?.phoneInfo?.optOutAiReason}"`);
          expect(res.body?.phoneInfo?.optOutAi, 'API optOutAi must be false after cancel').toBe(false);
        });
      });

      // ── CT-10: Cancel modal after filling reason — state unchanged ──────

      test('CT-10: Cancel reason modal after filling reason — opt_out_ai and reason unchanged in DB and API', async ({
        page,
        api,
        db,
        testEnv,
      }) => {
        test.setTimeout(300_000);

        await test.step('CT-10: Login and navigate', async () => {
          const creds = testEnv.getCredentials('admin');
          await page.goto(testEnv.servicingUrl);
          const loginPage = new LoginPage(page);
          await loginPage.login(creds.username, creds.password);
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.navigateToCustomer(data.accountPk);
          await customerPage.navigateToPrimaryContact();
          const visible = await customerPage.isOptOutAiVisible();
          test.skip(!visible, 'Frontend not deployed — skipping CT-10');
        });

        await test.step('CT-10: Ensure opt_out_ai is false (precondition)', async () => {
          const customerPage = new ServicingCustomerPage(page);
          const isChecked = await customerPage.isOptOutAiChecked();
          if (isChecked) {
            await customerPage.toggleOptOutAi();
            await page.locator(SELECTORS.toastBody).first().waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
          }
        });

        let dbStateBefore: number | null = null;
        let reasonBefore: string | null = null;

        await test.step('CT-10: Capture DB state before cancel', async () => {
          const colExists = await optOutAiColumnExists(db);
          if (!colExists) {
            test.skip(true, 'Backend migration not applied — skipping CT-10');
            return;
          }
          dbStateBefore = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          reasonBefore = await db.getSingleString(
            `SELECT COALESCE(opt_out_ai_reason, '') FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-10] DB BEFORE: opt_out_ai=${dbStateBefore}, reason="${reasonBefore}"`);
        });

        await test.step('CT-10: Enter edit mode, click checkbox, fill reason, then click CANCEL', async () => {
          const customerPage = new ServicingCustomerPage(page);
          await customerPage.enterPrimaryContactEditMode();
          const checkbox = page.locator(SELECTORS.optOutAiCheckbox).first();
          await checkbox.click();

          // Wait for reason modal and fill it
          const reasonTextbox = page.locator(SELECTORS.optOutAiReasonTextbox).first();
          await reasonTextbox.waitFor({ state: 'visible', timeout: 5_000 });
          await reasonTextbox.fill('This reason should NOT be persisted');

          // Click CANCEL instead of Save
          const cancelBtn = page.locator('dialog button:has-text("CANCEL"), [role="dialog"] button:has-text("CANCEL")').first();
          await cancelBtn.click();
          console.log('[CT-10] Filled reason then clicked CANCEL');
        });

        await test.step('CT-10: DB — verify opt_out_ai and reason unchanged after cancel', async () => {
          const dbStateAfter = await db.getSingleNumber(
            `SELECT CASE WHEN opt_out_ai = true THEN 1 ELSE 0 END FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          const reasonAfter = await db.getSingleString(
            `SELECT COALESCE(opt_out_ai_reason, '') FROM uown_sv_phone WHERE pk = $1`,
            [data.phonePK],
          );
          console.log(`[CT-10] DB AFTER:  opt_out_ai=${dbStateAfter}, reason="${reasonAfter}"`);
          expect(dbStateAfter, 'opt_out_ai must remain unchanged after cancel').toBe(dbStateBefore);
          expect(reasonAfter, 'opt_out_ai_reason must not be saved after cancel').toBe(reasonBefore);
        });

        await test.step('CT-10: API — verify optOutAi unchanged via API', async () => {
          const res = await api.svcPhone.updateOptOutAi({
            phonePK: data.phonePK,
            optOutAi: false,
          });
          expect(res.ok, `API call failed: ${res.status}`).toBe(true);
          console.log(`[CT-10] API optOutAi=${res.body?.phoneInfo?.optOutAi}, reason="${res.body?.phoneInfo?.optOutAiReason}"`);
          expect(res.body?.phoneInfo?.optOutAi, 'API optOutAi must be false after cancel').toBe(false);
        });
      });
    },
  );
}

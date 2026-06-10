/**
 * Task #146 — Fix phone number update validation error in Customer Portal
 *
 * Bug: When updating phone in Account Settings > Update Contact Info, the frontend
 * called POST /uown/svc/sendVerificationCode/{newPhone} BEFORE saving the phone
 * via createOrUpdatePrimaryCustomerContactInfo, causing HTTP 500.
 *
 * Fix (frontend): save phone first via createOrUpdatePrimaryCustomerContactInfo,
 * then call sendVerificationCode.
 *
 * Scenarios:
 *   CT-01: Hybrid — update phone via UI, intercept network, verify DB
 *   CT-02: API — createOrUpdatePrimaryCustomerContactInfo accepts new phone
 *   CT-03: API — sendVerificationCode returns 200 after phone is saved (exact fix scenario)
 *   CT-04: E2E edge case — save without changing phone does not cause error
 *
 * GDS bypass: pre-seeded ACTIVE account (pk=10855) in QA2.
 * No application data created -> runId/email not needed for isolation.
 *
 * Run: npx playwright test tests/taskTestingUown/RU04.26.1.51.0_fixPhoneNumberUpdateValidationErrorInCustomerPortal_146/ --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { WebsiteBasePage } from '@pages/website/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateRunId } from '@config/constants.js';
import { sleep } from '@helpers/common.helpers.js';
import type { ContactInformationResponse, SvPhoneInContactResponse } from '@api/responses/svc-email.response.js';
import type { CreateOrUpdateContactInfoBody } from '@api/bodies/svc-contact.body.js';

const SCREENSHOT_DIR =
  'tests/taskTestingUown/RU04.26.1.51.0_fixPhoneNumberUpdateValidationErrorInCustomerPortal_146/screenshots';
const TEST_NAME = 'RU04.26.1.51.0_fixPhoneNumberUpdateValidationErrorInCustomerPortal_146';

const testData = [
  {
    env: 'qa2' as const,
    // GDS bypass: pre-seeded ACTIVE account for website portal (QA2).
    // account_pk=10855, email=fintechgroup777@gmail.com, status=ACTIVE
    accountPk: 10855,
    websiteEmail: 'fintechgroup777@gmail.com',
    tag: buildTags(TestTag.QA2, TestTag.REGRESSION),
  },
];

/**
 * Generates a unique phone area code + number based on runId.
 * Area code: 3 digits; Phone number: 7 digits.
 * Returns phoneNumber as a number to match Java Long type.
 */
function generateUniquePhone(runId: string): { areaCode: string; phoneNumber: number } {
  const digits = runId.replace(/\D/g, '');
  const last4 = digits.slice(-4).padStart(4, '0');
  return {
    areaCode: '407',
    phoneNumber: parseInt(`555${last4}`, 10),
  };
}

/**
 * Fetches the latest OTP verification code for a given email from the DB.
 * Used as a fallback when IMAP is unavailable.
 * Polls uown_login_attempt for up to 30s (sent within the last 2 minutes).
 */
async function getOtpFromDb(
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  email: string,
  timeoutMs = 30_000,
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = await db.queryOne<{ code: string }>(
      `SELECT code FROM uown_login_attempt
       WHERE email_phone_input = $1
         AND sent_time >= NOW() - INTERVAL '2 minutes'
         AND expiration_time > NOW()
       ORDER BY sent_time DESC
       LIMIT 1`,
      [email],
    );
    if (row?.code) return row.code;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  return null;
}

/** Builds a phone update body from an existing phone + new values */
function buildPhoneBody(
  accountPk: number,
  originalPhone: SvPhoneInContactResponse,
  newAreaCode: string,
  newPhoneNumber: number,
): CreateOrUpdateContactInfoBody {
  return {
    accountPk,
    phoneList: [
      {
        pk: originalPhone.pk,
        phoneInfo: {
          phonePK: originalPhone.phoneInfo.phonePK,
          customerPK: originalPhone.phoneInfo.customerPK,
          areaCode: newAreaCode,
          phoneNumber: newPhoneNumber,
          phoneType: originalPhone.phoneInfo.phoneType,
          doNotCall: originalPhone.phoneInfo.doNotCall,
          doNotText: originalPhone.phoneInfo.doNotText,
        },
      },
    ],
  };
}

for (const td of testData) {
  test.describe(
    `${TEST_NAME} - ${td.env}`,
    {
      tag: splitTags(td.tag),
    },
    () => {
      test.describe.configure({ mode: 'serial' });
      test.use({ envName: td.env });

      // Shared across serial tests
      let originalPhone: SvPhoneInContactResponse | null = null;
      let phoneAfterCt01Update: SvPhoneInContactResponse | null = null;
      const runId = generateRunId();

      // ================================================================
      //  CT-01: Hybrid — update phone via UI, intercept network, verify DB
      // ================================================================
      test('CT-01: Hybrid - update phone via UI, verify network + DB', async ({
        page,
        api,
        email,
        db,
        testEnv,
      }) => {
        test.setTimeout(720_000);

        const { areaCode: newAreaCode, phoneNumber: newPhoneNumber } = generateUniquePhone(runId);

        await test.step('Step 1 - Fetch current contact info via API (precondition)', async () => {
          const res = await api.svcContact.getContactInfo(td.accountPk);
          expect(res.ok, `getContactInfo should return 200, got ${res.status}`).toBeTruthy();
          expect(res.body.phoneList.length, 'Account should have at least one phone').toBeGreaterThan(0);
          originalPhone = res.body.phoneList[0];
          console.log(
            `[CT-01] Original phone: (${originalPhone.phoneInfo.areaCode}) ${originalPhone.phoneInfo.phoneNumber}, pk=${originalPhone.pk}`,
          );
        });

        await test.step('Step 2 - Navigate to website portal', async () => {
          await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        });

        await test.step('Step 3 - Login via email OTP', async () => {
          const websitePage = new WebsiteBasePage(page);
          await websitePage.loginWithEmail(td.websiteEmail);

          console.log(`[CT-01] Fetching verification code for ${td.websiteEmail}...`);
          // Try IMAP first; fall back to DB query (avoids IMAP auth dependency)
          let verificationCode = await email.getVerificationCode(td.websiteEmail).catch(() => null);
          if (!verificationCode) {
            console.log(`[CT-01] IMAP unavailable, fetching OTP from DB...`);
            verificationCode = await getOtpFromDb(db, td.websiteEmail);
          }
          expect(
            verificationCode,
            `Verification code not found (IMAP and DB both failed) for ${td.websiteEmail}`,
          ).toBeTruthy();
          console.log(`[CT-01] Got verification code: ${verificationCode}`);

          const loginSuccess = await websitePage.enterVerificationCode(verificationCode!);
          expect(loginSuccess, 'Website login should succeed with OTP code').toBe(true);
        });

        // Collected network responses for validation
        const capturedResponses: { url: string; status: number; body?: unknown }[] = [];

        await test.step('Step 4 - Set up network intercept for contact API calls', async () => {
          page.on('response', async (response) => {
            const url = response.url();
            if (
              url.includes('createOrUpdatePrimaryCustomerContactInfo') ||
              url.includes('sendVerificationCode')
            ) {
              let body: unknown = null;
              try {
                body = await response.json();
              } catch {
                // Response may have no body (204)
              }
              capturedResponses.push({ url, status: response.status(), body });
              console.log(`[CT-01][Network] ${response.status()} ${url.split('/').slice(-2).join('/')}`);
            }
          });
        });

        await test.step('Step 5 - Navigate to Update Contact Info and change phone', async () => {
          const websitePage = new WebsiteBasePage(page);
          await websitePage.updatePhoneNumber(newAreaCode, String(newPhoneNumber));
          await sleep(3_000);
        });

        await test.step('Step 6 - Verify createOrUpdatePrimaryCustomerContactInfo response', async () => {
          const saveResponses = capturedResponses.filter((r) =>
            r.url.includes('createOrUpdatePrimaryCustomerContactInfo'),
          );
          expect(saveResponses.length, 'At least one createOrUpdatePrimaryCustomerContactInfo call expected').toBeGreaterThan(0);

          const last = saveResponses[saveResponses.length - 1];
          expect(last.status, `createOrUpdatePrimaryCustomerContactInfo should return 200, got ${last.status}`).toBe(200);

          if (last.body && typeof last.body === 'object') {
            const respBody = last.body as ContactInformationResponse;
            if (respBody.phoneList?.length) {
              const updated = respBody.phoneList.find((p) => String(p.phoneInfo.areaCode) === newAreaCode);
              expect(updated, `Response phoneList should contain areaCode ${newAreaCode}`).toBeTruthy();
            }
          }
        });

        await test.step('Step 7 - Verify no sendVerificationCode returned 500', async () => {
          const verifyResponses = capturedResponses.filter((r) => r.url.includes('sendVerificationCode'));
          for (const resp of verifyResponses) {
            expect(resp.status, `sendVerificationCode should not return 500, got ${resp.status}`).not.toBe(500);
          }
          console.log(`[CT-01] sendVerificationCode calls: ${verifyResponses.length}, none returned 500`);
        });

        await test.step('Step 8 - Verify DB persistence', async () => {
          const dbPhone = await db.queryOne<{ area_code: string; phone_number: string }>(
            `SELECT area_code, phone_number FROM uown_sv_phone
             WHERE account_pk = $1
             ORDER BY row_updated_timestamp DESC NULLS LAST, pk DESC
             LIMIT 1`,
            [td.accountPk],
          );
          expect(dbPhone, 'Phone record should exist in DB').toBeTruthy();
          expect(String(dbPhone!.area_code), 'DB area_code should match new value').toBe(newAreaCode);
          expect(String(dbPhone!.phone_number), 'DB phone_number should match new value').toBe(String(newPhoneNumber));
          console.log(`[CT-01] DB verified: area_code=${dbPhone!.area_code}, phone_number=${dbPhone!.phone_number}`);

          // Refresh phone state for restore
          const refreshRes = await api.svcContact.getContactInfo(td.accountPk);
          if (refreshRes.ok && refreshRes.body.phoneList.length > 0) {
            phoneAfterCt01Update = refreshRes.body.phoneList[0];
          }
        });

        await test.step('Step 9 - Verify UI shows no error', async () => {
          const websitePage = new WebsiteBasePage(page);
          const hasError = await websitePage.isErrorVisible();
          expect(hasError, 'No error should be visible on the page after phone update').toBe(false);

          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-phone-updated-no-error.png`,
            fullPage: false,
          });
        });

        await test.step('Step 10 - Restore original phone via API', async () => {
          if (originalPhone) {
            // Use refreshed phone state (from Step 8) to avoid stale phonePK
            const base = phoneAfterCt01Update ?? originalPhone;
            const restoreBody = buildPhoneBody(
              td.accountPk,
              base,
              String(originalPhone.phoneInfo.areaCode),
              Number(originalPhone.phoneInfo.phoneNumber),
            );
            const restoreRes = await api.svcContact.createOrUpdateContactInfo(restoreBody);
            console.log(`[CT-01] Restore original phone: ${restoreRes.status}`);
          }
        });
      });

      // ================================================================
      //  CT-02: API — createOrUpdatePrimaryCustomerContactInfo accepts new phone
      // ================================================================
      test('CT-02: API - createOrUpdateContactInfo accepts new phone', async ({ api, db }) => {
        test.setTimeout(120_000);

        let currentPhone: SvPhoneInContactResponse | null = null;
        let updatedPhone: SvPhoneInContactResponse | null = null;
        const originalAreaCode: { value: string } = { value: '' };
        const originalPhoneNumber: { value: number } = { value: 0 };
        const { areaCode: newAreaCode, phoneNumber: newPhoneNumber } = generateUniquePhone(`${runId}-ct02`);

        await test.step('Step 1 - Get current contact info', async () => {
          const res = await api.svcContact.getContactInfo(td.accountPk);
          expect(res.ok, `getContactInfo should return 200, got ${res.status}`).toBeTruthy();
          expect(res.body.phoneList.length, 'Account should have at least one phone').toBeGreaterThan(0);
          currentPhone = res.body.phoneList[0];
          originalAreaCode.value = String(currentPhone.phoneInfo.areaCode);
          originalPhoneNumber.value = Number(currentPhone.phoneInfo.phoneNumber);
          console.log(
            `[CT-02] Current phone: (${originalAreaCode.value}) ${originalPhoneNumber.value}, pk=${currentPhone.pk}`,
          );
        });

        await test.step('Step 2 - Update phone with new values', async () => {
          const updateBody = buildPhoneBody(td.accountPk, currentPhone!, newAreaCode, newPhoneNumber);
          const updateRes = await api.svcContact.createOrUpdateContactInfo(updateBody);
          expect(updateRes.ok, `createOrUpdateContactInfo should return 200, got ${updateRes.status}`).toBeTruthy();

          const found = updateRes.body.phoneList.find(
            (p) => String(p.phoneInfo.areaCode) === newAreaCode,
          );
          expect(found, `Response should contain phone with areaCode ${newAreaCode}`).toBeTruthy();
          // Store the updated phone state (fresh phonePK for restore)
          updatedPhone = found!;
          console.log(`[CT-02] Update OK: areaCode=${newAreaCode}, phoneNumber=${newPhoneNumber}`);
        });

        await test.step('Step 3 - Verify via GET that phone was persisted', async () => {
          const verifyRes = await api.svcContact.getContactInfo(td.accountPk);
          expect(verifyRes.ok).toBeTruthy();
          const matching = verifyRes.body.phoneList.find(
            (p) => String(p.phoneInfo.areaCode) === newAreaCode &&
                   String(p.phoneInfo.phoneNumber) === String(newPhoneNumber),
          );
          expect(matching, 'GET should return updated phone in phoneList').toBeTruthy();
          // Refresh updatedPhone to get latest state
          updatedPhone = matching ?? updatedPhone;
        });

        await test.step('Step 4 - Verify DB persistence', async () => {
          const dbPhone = await db.queryOne<{ area_code: string; phone_number: string }>(
            `SELECT area_code, phone_number FROM uown_sv_phone WHERE pk = $1`,
            [currentPhone!.pk],
          );
          expect(dbPhone, 'Phone record should exist in DB').toBeTruthy();
          expect(String(dbPhone!.area_code)).toBe(newAreaCode);
          expect(String(dbPhone!.phone_number)).toBe(String(newPhoneNumber));
          console.log(`[CT-02] DB verified: area_code=${dbPhone!.area_code}, phone_number=${dbPhone!.phone_number}`);
        });

        await test.step('Step 5 - Restore original phone', async () => {
          // Use updatedPhone (fresh state) as base for restore — avoids stale phonePK
          const base = updatedPhone ?? currentPhone!;
          const restoreBody = buildPhoneBody(td.accountPk, base, originalAreaCode.value, originalPhoneNumber.value);
          const restoreRes = await api.svcContact.createOrUpdateContactInfo(restoreBody);
          expect(restoreRes.ok, `Restore should return 200, got ${restoreRes.status}`).toBeTruthy();
          console.log(`[CT-02] Restored phone: (${originalAreaCode.value}) ${originalPhoneNumber.value}`);
        });
      });

      // ================================================================
      //  CT-03: API — sendVerificationCode returns 200 after phone is saved
      // ================================================================
      test('CT-03: API - sendVerificationCode returns 200/204 after phone is saved (fix scenario)', async ({
        api,
      }) => {
        test.setTimeout(120_000);

        let currentPhone: SvPhoneInContactResponse | null = null;
        let savedPhone: SvPhoneInContactResponse | null = null;
        const originalAreaCode: { value: string } = { value: '' };
        const originalPhoneNumber: { value: number } = { value: 0 };
        const { areaCode: newAreaCode, phoneNumber: newPhoneNumber } = generateUniquePhone(`${runId}-ct03`);

        await test.step('Step 1 - Get current phone info', async () => {
          const res = await api.svcContact.getContactInfo(td.accountPk);
          expect(res.ok).toBeTruthy();
          currentPhone = res.body.phoneList[0];
          originalAreaCode.value = String(currentPhone.phoneInfo.areaCode);
          originalPhoneNumber.value = Number(currentPhone.phoneInfo.phoneNumber);
        });

        await test.step('Step 2 - Save new phone via createOrUpdateContactInfo', async () => {
          const updateBody = buildPhoneBody(td.accountPk, currentPhone!, newAreaCode, newPhoneNumber);
          const saveRes = await api.svcContact.createOrUpdateContactInfo(updateBody);
          expect(saveRes.ok, `Save phone should return 200, got ${saveRes.status}`).toBeTruthy();
          savedPhone = saveRes.body.phoneList.find((p) => String(p.phoneInfo.areaCode) === newAreaCode) ?? null;
          console.log(`[CT-03] Phone saved: (${newAreaCode}) ${newPhoneNumber}`);
        });

        await test.step('Step 3 - Call sendVerificationCode with the saved phone (exact fix scenario)', async () => {
          const formattedPhone = `${newAreaCode}${newPhoneNumber}`;
          console.log(`[CT-03] Calling sendVerificationCode with phone: ${formattedPhone}`);

          const verifyRes = await api.svcContact.sendVerificationCode(formattedPhone, 'UOWN');

          // The fix ensures this does NOT return 500 anymore
          expect(
            [200, 204].includes(verifyRes.status),
            `sendVerificationCode should return 200 or 204 (not 500), got ${verifyRes.status}`,
          ).toBe(true);
          console.log(`[CT-03] sendVerificationCode returned ${verifyRes.status} (not 500 — fix confirmed)`);
        });

        await test.step('Step 4 - Restore original phone', async () => {
          // Use savedPhone (fresh state) as base for restore
          const base = savedPhone ?? currentPhone!;
          const restoreBody = buildPhoneBody(td.accountPk, base, originalAreaCode.value, originalPhoneNumber.value);
          const restoreRes = await api.svcContact.createOrUpdateContactInfo(restoreBody);
          console.log(`[CT-03] Restore: ${restoreRes.status} → (${originalAreaCode.value}) ${originalPhoneNumber.value}`);
        });
      });

      // ================================================================
      //  CT-04: E2E edge case — save without changing phone
      // ================================================================
      test('CT-04: E2E - save without changing phone does not cause error', async ({
        page,
        api,
        email,
        db,
        testEnv,
      }) => {
        test.setTimeout(720_000);

        const capturedResponses: { url: string; status: number }[] = [];

        await test.step('Step 1 - Navigate to website portal', async () => {
          await page.goto(testEnv.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        });

        await test.step('Step 2 - Login via email OTP', async () => {
          const websitePage = new WebsiteBasePage(page);
          await websitePage.loginWithEmail(td.websiteEmail);

          console.log(`[CT-04] Fetching verification code for ${td.websiteEmail}...`);
          // Try IMAP first; fall back to DB query
          let verificationCode = await email.getVerificationCode(td.websiteEmail).catch(() => null);
          if (!verificationCode) {
            console.log(`[CT-04] IMAP unavailable, fetching OTP from DB...`);
            verificationCode = await getOtpFromDb(db, td.websiteEmail);
          }
          expect(verificationCode, `Verification code not found for ${td.websiteEmail}`).toBeTruthy();
          console.log(`[CT-04] Got verification code: ${verificationCode}`);

          const loginSuccess = await websitePage.enterVerificationCode(verificationCode!);
          expect(loginSuccess, 'Website login should succeed').toBe(true);
        });

        await test.step('Step 3 - Set up network intercept', async () => {
          page.on('response', (response) => {
            const url = response.url();
            if (url.includes('createOrUpdatePrimaryCustomerContactInfo')) {
              capturedResponses.push({ url, status: response.status() });
              console.log(`[CT-04][Network] ${response.status()} createOrUpdatePrimaryCustomerContactInfo`);
            }
          });
        });

        await test.step('Step 4 - Navigate to Update Contact Info and save without changes', async () => {
          const websitePage = new WebsiteBasePage(page);
          await websitePage.goToSidebarLink('update contact info');

          const saveBtn = page.locator(SELECTORS.wsSaveChangesButton).first();
          await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
          await saveBtn.click();
          await websitePage.waitForSpinner();
          await sleep(3_000);
        });

        await test.step('Step 5 - Verify no error is visible', async () => {
          const websitePage = new WebsiteBasePage(page);
          const hasError = await websitePage.isErrorVisible();
          expect(hasError, 'No error should be visible when saving without changes').toBe(false);

          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-02-save-no-changes-no-error.png`,
            fullPage: false,
          });
        });

        await test.step('Step 6 - Verify createOrUpdatePrimaryCustomerContactInfo returned 200 (if called)', async () => {
          if (capturedResponses.length > 0) {
            const last = capturedResponses[capturedResponses.length - 1];
            expect(
              last.status,
              `createOrUpdatePrimaryCustomerContactInfo should return 200, got ${last.status}`,
            ).toBe(200);
            console.log(`[CT-04] createOrUpdatePrimaryCustomerContactInfo returned 200`);
          } else {
            console.log(`[CT-04] createOrUpdatePrimaryCustomerContactInfo not called (frontend skipped — acceptable)`);
          }
        });
      });
    },
  );
}

/**
 * RU04.26.1.50.2_ccbinImageVerification_1256
 *
 * CT-01: Verify CCBIN image and instructional text are displayed
 * on the consumer-facing Send Application form (Step 2: Employment & Financial).
 *
 * Flow:
 *   1. Create application link via API (POST /uown/sendApplicationToCustomer)
 *   2. Navigate to /{shortCode}/start
 *   3. Fill Step 1 (Personal Info) to advance to Step 2
 *   4. Verify CCBIN image, instruction text, and field properties
 *
 * GitLab: Task #1256 — Add CCBIN Image and Instruction to Send Application Flow
 *
 * Run: ENV=dev1 npx playwright test docs/taskTestingUown/RU04.26.1.50.2_addCcbinImageAndInstructionToSendApplicationFlow_1256/RU04.26.1.50.2_ccbinImageVerification_1256 --project=task-testing --reporter=list
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateRunId, generateTestPhone } from '@config/index.js';

const TEST_NAME = 'RU04.26.1.50.2_ccbinImageVerification_1256';
const SCREENSHOT_DIR = `docs/taskTestingUown/RU04.26.1.50.2_addCcbinImageAndInstructionToSendApplicationFlow_1256/screenshots`;

const EXPECTED_INSTRUCTION_TEXT =
  'Enter the first 6 digits from the card you used for your payment. This helps us confirm your identity.';

const testData = [
  {
    env: 'qa1' as const,
    /** TerraceFinance — OL90202-0001, non-Kornerstone merchant */
    merchantCode: 'OL90202-0001',
    tag: buildTags(TestTag.QA1, TestTag.REGRESSION),
  },
];

for (const td of testData) {
  test.describe(
    `${TEST_NAME} - ${td.env}/TerraceFinance`,
    { tag: splitTags(td.tag) },
    () => {
      test.use({ envName: td.env });

      test('CT-01: CCBIN image and instruction text are displayed on Step 2', async ({
        page,
        api,
        testEnv,
      }) => {
        test.setTimeout(180_000);

        const runId = generateRunId();
        const phone = generateTestPhone();
        const email = `ccbin-test-${runId}@mailinator.com`;

        console.log(`[CT-01] runId=${runId}, email=${email}`);

        // ── Step 1: Create application link via API ──
        let shortCode = '';
        await test.step('Step 1 — Create application via sendApplicationToCustomer API', async () => {
          const body = {
            custEmailAddress: email,
            custPhoneNumber: phone,
            refMerchantCode: td.merchantCode,
          };

          const svcUrl = testEnv.svcApiUrl;
          const response = await page.request.post(`${svcUrl}/uown/sendApplicationToCustomer`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'x-api-key': testEnv.apiKey,
            },
            data: body,
          });
          const status = response.status();
          console.log(`[CT-01] sendApplicationToCustomer status: ${status}`);
          expect(status, 'sendApplicationToCustomer should return 200').toBe(200);

          // Response body is the application URL (full URL or shortCode)
          const responseText = await response.text();
          const rawResponse = responseText.replace(/"/g, '').trim();
          console.log(`[CT-01] Got response: ${rawResponse}`);

          // API may return full URL or just shortCode
          if (rawResponse.startsWith('http')) {
            shortCode = rawResponse; // Full URL — use directly
          } else {
            shortCode = `https://secure-${td.env}.uownleasing.com/${rawResponse}/start`;
          }
          expect(shortCode, 'application URL should not be empty').toBeTruthy();
        });

        // ── Step 2: Navigate to consumer-facing application form ──
        await test.step('Step 2 — Navigate to send application form', async () => {
          const formUrl = shortCode; // Already a full URL from API response
          console.log(`[CT-01] Navigating to: ${formUrl}`);
          await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
          await page.waitForLoadState('networkidle').catch(() => {});

          // Wait for the form to load (Step 1 fields)
          await page.locator(SELECTORS.naMainFirstName).waitFor({ state: 'visible', timeout: 30_000 });
          console.log('[CT-01] Application form loaded — Step 1 visible');
        });

        // ── Step 3: Fill Personal Info (Step 1) to advance to Step 2 ──
        await test.step('Step 3 — Fill Step 1 (Personal Info) and advance to Step 2', async () => {
          // Use label-based selectors — apply-* domain may have different field IDs
          const fillByLabel = async (label: string, value: string) => {
            const field = page.getByLabel(label, { exact: false }).first();
            if (await field.isVisible({ timeout: 3_000 }).catch(() => false)) {
              await field.fill(value);
            }
          };

          const fillById = async (id: string, value: string) => {
            const field = page.locator(id);
            if (await field.isVisible({ timeout: 3_000 }).catch(() => false)) {
              await field.fill(value);
            }
          };

          // Fill form fields using label-based approach with ID fallback
          await fillByLabel('First Name', 'TestCCBIN');
          await fillByLabel('Last Name', 'Verify');
          await fillByLabel('Social Security Number', '666123451');
          await fillById('#mainSsn', '666123451'); // fallback
          await fillByLabel('Birthdate', '01/15/1990');
          await fillById('#mainDob', '01/15/1990'); // fallback
          await fillByLabel('Mobile Phone', phone);
          await fillByLabel('Email', email);

          // Address fields: Street Address uses Google Places autocomplete
          // which disables Zip Code, City, State until an address is selected.
          // Use native React input setter to force values + trigger change events.
          const forceReactFill = async (selector: string, value: string) => {
            await page.evaluate(({ sel, val }) => {
              const input = document.querySelector(sel) as HTMLInputElement;
              if (!input) return;
              input.disabled = false;
              const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value',
              )!.set!;
              nativeSetter.call(input, val);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('blur', { bubbles: true }));
            }, { sel: selector, val: value });
          };

          // Fill address using ID selectors + React event dispatch
          await forceReactFill('#mainAddress1, [name="mainAddress1"]', '123 Test St');
          await forceReactFill('#mainPostalCode, [name="mainPostalCode"]', '75201');
          await forceReactFill('#mainCity, [name="mainCity"]', 'Dallas');
          // State field might be a dropdown or text input
          await forceReactFill('#mainState, [name="mainState"]', 'TX');

          // Click NEXT button to advance to Step 2
          const nextBtn = page.getByRole('button', { name: /next/i });
          await nextBtn.waitFor({ state: 'visible', timeout: 10_000 });
          await nextBtn.click();

          // Wait for Step 2 to load (employment section)
          await page.getByLabel('Employer Name', { exact: false }).first()
            .waitFor({ state: 'visible', timeout: 30_000 })
            .catch(() => {
              // Fallback: wait for CCBIN field directly
              return page.locator(SELECTORS.naCcBinField)
                .waitFor({ state: 'visible', timeout: 15_000 });
            });

          console.log('[CT-01] Step 1 completed — advanced to Step 2');
        });

        // ── Step 4: Verify CCBIN image is visible ──
        await test.step('CT-01a — Verify CCBIN image is visible on Step 2', async () => {
          const ccBinImage = page.locator(SELECTORS.naCcBinImage);
          await ccBinImage.waitFor({ state: 'visible', timeout: 15_000 });
          await expect(ccBinImage).toBeVisible();

          const src = await ccBinImage.getAttribute('src');
          expect(src, 'CCBIN image src should reference ccbin').toBeTruthy();
          console.log(`[CT-01] CCBIN image visible — src=${src}`);
        });

        // ── Step 5: Verify instruction text is visible ──
        await test.step('CT-01b — Verify instruction text is displayed', async () => {
          const instructionText = page.locator(SELECTORS.naCcBinInstructionText);
          await instructionText.first().waitFor({ state: 'visible', timeout: 10_000 });
          await expect(instructionText.first()).toBeVisible();

          const text = await instructionText.first().textContent();
          expect(text?.trim()).toContain('Enter the first 6 digits');
          expect(text?.trim()).toContain(EXPECTED_INSTRUCTION_TEXT);
          console.log(`[CT-01] Instruction text verified`);
        });

        // ── Step 6: Verify CCBIN field properties ──
        await test.step('CT-01c — Verify CCBIN field is present and accepts 6 digits', async () => {
          const ccBinField = page.locator(SELECTORS.naCcBinField);
          await expect(ccBinField).toBeVisible();

          const maxLength = await ccBinField.getAttribute('maxlength');
          expect(maxLength, 'CCBIN field maxlength should be 6').toBe('6');

          await ccBinField.fill('123456');
          const value = await ccBinField.inputValue();
          expect(value).toBe('123456');
          console.log('[CT-01] CCBIN field accepts 6-digit input');
          await ccBinField.clear();
        });

        // ── Step 7: Screenshot evidence ──
        await test.step('CT-01 — Screenshot evidence', async () => {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-ccbin-image-and-text.png`,
            fullPage: false,
          });
          test.info().attach('CT-01 — CCBIN image and instruction text', {
            path: `${SCREENSHOT_DIR}/${TEST_NAME}-01-ccbin-image-and-text.png`,
            contentType: 'image/png',
          });
          console.log('[CT-01] Screenshot saved');
        });
      });
    },
  );
}

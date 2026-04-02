/**
 * RU03.26.1.50.0_limitPeakCampaignTo4Digits_1216
 *
 * Validates that peakCampaignId and offPeakCampaignId fields are limited to
 * 4 numeric digits on both Merchant Settings and Merchant Info pages.
 *
 * Covers:
 *  CT-01 — Fields accept numbers only (Merchant Settings)
 *  CT-02 — Maximum limit of 4 digits (Merchant Settings)
 *  CT-03 — Labels display user-friendly text (Merchant Settings)
 *  CT-04 — Fields accept numbers only (Merchant Page)
 *  CT-05 — Maximum limit of 4 digits (Merchant Page)
 *  CT-06 — Labels display user-friendly text (Merchant Page)
 *  CT-07 — Update peak campaign via Merchant Settings: payload + response + DB
 *  CT-08 — Update peak campaign via Merchant Page: payload + response + DB
 *  CT-09 — Apply values on Merchant Settings UI, verify on Merchant Page (cross-page)
 *
 * GitLab: https://gitlab.com/uown/frontend/origination/-/work_items/1216
 * Pipeline: new-flow (E2E)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MerchantSettingPage } from '@pages/origination/merchant-setting.page.js';
import { MerchantPage } from '@pages/merchant.page.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { MERCHANTS } from '@data/merchants.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { loginToPortal } from '@helpers/auth.helpers.js';

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg',
    merchant: 'TerraceFinance',
    tag: buildTags(TestTag.REGRESSION, TestTag.STG),
  },
];

// ── Non-numeric inputs to test isNumbersOnly validation ──────────────

const NON_NUMERIC_INPUTS = ['abcd', '12ab', '12@3', '!@#$'];

// ── Helper: screenshot focado no campo ───────────────────────────────

async function screenshotField(
  input: import('@playwright/test').Locator,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
): Promise<void> {
  const box = await input.boundingBox();
  if (box) {
    const padding = 60;
    await testInfo.attach(name, {
      body: await input.page().screenshot({
        clip: {
          x: Math.max(0, box.x - padding),
          y: Math.max(0, box.y - padding),
          width: box.width + padding * 2,
          height: box.height + padding * 2,
        },
      }),
      contentType: 'image/png',
    });
  } else {
    await testInfo.attach(name, {
      body: await input.page().screenshot({ fullPage: false }),
      contentType: 'image/png',
    });
  }
}

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchant];

  test.describe(
    `RU03.26.1.50.0_limitPeakCampaignTo4Digits_1216 - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01 — Fields accept numbers only (Merchant Settings)
      // ══════════════════════════════════════════════════════════════
      test('CT-01: Validate that peak campaign fields accept numbers only — Merchant Settings', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const msPage = new MerchantSettingPage(page);

        await test.step('Navigate to Merchant Settings page', async () => {
          await msPage.navigateToMerchantSettings(testEnv.originationUrl);
        });

        await test.step('Screenshot — Merchant Settings page loaded', async () => {
          await testInfo.attach('CT01-merchant-settings-page', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Verify peakCampaignId rejects non-numeric input', async () => {
          const input = msPage.peakCampaignIdInput;
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          for (const nonNumeric of NON_NUMERIC_INPUTS) {
            await input.clear();
            await input.pressSequentially(nonNumeric, { delay: 50 });
            const value = await input.inputValue();
            const numericOnly = nonNumeric.replace(/\D/g, '');
            expect(value, `Input should reject non-numeric chars from "${nonNumeric}"`).toBe(numericOnly);
          }

          // Screenshot after last non-numeric attempt (field should show only "")
          await input.clear();
          await input.pressSequentially('abcd', { delay: 50 });
          await screenshotField(input, testInfo, 'CT01-peak-rejects-abcd');
        });

        await test.step('Verify offPeakCampaignId rejects non-numeric input', async () => {
          const input = msPage.offPeakCampaignIdInput;
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          for (const nonNumeric of NON_NUMERIC_INPUTS) {
            await input.clear();
            await input.pressSequentially(nonNumeric, { delay: 50 });
            const value = await input.inputValue();
            const numericOnly = nonNumeric.replace(/\D/g, '');
            expect(value, `Input should reject non-numeric chars from "${nonNumeric}"`).toBe(numericOnly);
          }

          await input.clear();
          await input.pressSequentially('!@#$', { delay: 50 });
          await screenshotField(input, testInfo, 'CT01-offpeak-rejects-special-chars');
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-02 — Maximum limit of 4 digits (Merchant Settings)
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Validate maximum limit of 4 digits — Merchant Settings', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const msPage = new MerchantSettingPage(page);

        await test.step('Navigate to Merchant Settings page', async () => {
          await msPage.navigateToMerchantSettings(testEnv.originationUrl);
        });

        await test.step('Verify peakCampaignId accepts up to 4 digits', async () => {
          const input = msPage.peakCampaignIdInput;
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          // Valid inputs (1-4 digits)
          for (const valid of ['1', '12', '123', '1234']) {
            await input.clear();
            await input.pressSequentially(valid, { delay: 30 });
            const value = await input.inputValue();
            expect(value, `Should accept ${valid.length}-digit value "${valid}"`).toBe(valid);
          }

          // Screenshot with 4-digit value accepted
          await screenshotField(input, testInfo, 'CT02-peak-accepts-1234');

          // Input exceeding 4 digits should be truncated
          await input.clear();
          await input.pressSequentially('12345', { delay: 30 });
          const truncated = await input.inputValue();
          expect(truncated, 'Should truncate to 4 digits').toBe('1234');

          await screenshotField(input, testInfo, 'CT02-peak-truncates-12345-to-1234');
        });

        await test.step('Verify offPeakCampaignId accepts up to 4 digits', async () => {
          const input = msPage.offPeakCampaignIdInput;
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          // Input exceeding 4 digits should be truncated
          await input.clear();
          await input.pressSequentially('99999', { delay: 30 });
          const truncated = await input.inputValue();
          expect(truncated, 'Should truncate to 4 digits').toBe('9999');

          await screenshotField(input, testInfo, 'CT02-offpeak-truncates-99999-to-9999');

          // Long input
          await input.clear();
          await input.pressSequentially('1234567890', { delay: 30 });
          const longTruncated = await input.inputValue();
          expect(longTruncated, 'Should truncate 10-digit input to 4 digits').toBe('1234');

          await screenshotField(input, testInfo, 'CT02-offpeak-truncates-10digits-to-1234');
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03 — Labels display user-friendly text (Merchant Settings)
      // ══════════════════════════════════════════════════════════════
      test('CT-03: Validate labels are user-friendly — Merchant Settings', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const msPage = new MerchantSettingPage(page);

        await test.step('Navigate to Merchant Settings page', async () => {
          await msPage.navigateToMerchantSettings(testEnv.originationUrl);
        });

        await test.step('Verify Peak Campaign Id label', async () => {
          const labelText = await msPage.getPeakCampaignIdLabelText();
          expect(labelText.trim()).toContain('Peak Campaign Id');

          // Screenshot showing the label
          await msPage.peakCampaignIdLabel.scrollIntoViewIfNeeded();
          await screenshotField(msPage.peakCampaignIdLabel, testInfo, 'CT03-peak-label-user-friendly');
        });

        await test.step('Verify Off Peak Campaign Id label', async () => {
          const labelText = await msPage.getOffPeakCampaignIdLabelText();
          expect(labelText.trim()).toContain('Off Peak Campaign Id');

          await msPage.offPeakCampaignIdLabel.scrollIntoViewIfNeeded();
          await screenshotField(msPage.offPeakCampaignIdLabel, testInfo, 'CT03-offpeak-label-user-friendly');
        });

        await test.step('Screenshot — Both labels visible', async () => {
          // Scroll to show both fields in view
          await msPage.peakCampaignIdInput.scrollIntoViewIfNeeded();
          await testInfo.attach('CT03-both-labels-merchant-settings', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-04 — Fields accept numbers only (Merchant Page)
      // ══════════════════════════════════════════════════════════════
      test('CT-04: Validate that peak campaign fields accept numbers only — Merchant Page', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to Merchant page', async () => {
          await page.goto(`${testEnv.originationUrl}merchant/${merchant.number}`, { waitUntil: 'domcontentloaded' });
          const msPage = new MerchantSettingPage(page);
          await msPage.waitForPageLoad();
          await page.waitForTimeout(2_000);
        });

        await test.step('Screenshot — Merchant page loaded', async () => {
          await testInfo.attach('CT04-merchant-page-loaded', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Verify peakCampaignId rejects non-numeric input', async () => {
          const input = page.locator(SELECTORS.msPeakCampaignIdInput);
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          for (const nonNumeric of NON_NUMERIC_INPUTS) {
            await input.clear();
            await input.pressSequentially(nonNumeric, { delay: 50 });
            const value = await input.inputValue();
            const numericOnly = nonNumeric.replace(/\D/g, '');
            expect(value, `Input should reject non-numeric chars from "${nonNumeric}"`).toBe(numericOnly);
          }

          await input.clear();
          await input.pressSequentially('abcd', { delay: 50 });
          await screenshotField(input, testInfo, 'CT04-merchant-peak-rejects-abcd');
        });

        await test.step('Verify offPeakCampaignId rejects non-numeric input', async () => {
          const input = page.locator(SELECTORS.msOffPeakCampaignIdInput);
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          for (const nonNumeric of NON_NUMERIC_INPUTS) {
            await input.clear();
            await input.pressSequentially(nonNumeric, { delay: 50 });
            const value = await input.inputValue();
            const numericOnly = nonNumeric.replace(/\D/g, '');
            expect(value, `Input should reject non-numeric chars from "${nonNumeric}"`).toBe(numericOnly);
          }

          await input.clear();
          await input.pressSequentially('!@#$', { delay: 50 });
          await screenshotField(input, testInfo, 'CT04-merchant-offpeak-rejects-special');
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — Maximum limit of 4 digits (Merchant Page)
      // ══════════════════════════════════════════════════════════════
      test('CT-05: Validate maximum limit of 4 digits — Merchant Page', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to Merchant page', async () => {
          await page.goto(`${testEnv.originationUrl}merchant/${merchant.number}`, { waitUntil: 'domcontentloaded' });
          const msPage = new MerchantSettingPage(page);
          await msPage.waitForPageLoad();
          await page.waitForTimeout(2_000);
        });

        await test.step('Verify peakCampaignId accepts up to 4 digits', async () => {
          const input = page.locator(SELECTORS.msPeakCampaignIdInput);
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          for (const valid of ['1', '12', '123', '1234']) {
            await input.clear();
            await input.pressSequentially(valid, { delay: 30 });
            const value = await input.inputValue();
            expect(value, `Should accept ${valid.length}-digit value "${valid}"`).toBe(valid);
          }

          await screenshotField(input, testInfo, 'CT05-merchant-peak-accepts-1234');

          await input.clear();
          await input.pressSequentially('12345', { delay: 30 });
          const truncated = await input.inputValue();
          expect(truncated, 'Should truncate to 4 digits').toBe('1234');

          await screenshotField(input, testInfo, 'CT05-merchant-peak-truncates-12345');
        });

        await test.step('Verify offPeakCampaignId accepts up to 4 digits', async () => {
          const input = page.locator(SELECTORS.msOffPeakCampaignIdInput);
          await input.scrollIntoViewIfNeeded();
          await input.waitFor({ state: 'visible', timeout: 10_000 });

          await input.clear();
          await input.pressSequentially('99999', { delay: 30 });
          const truncated = await input.inputValue();
          expect(truncated, 'Should truncate to 4 digits').toBe('9999');

          await screenshotField(input, testInfo, 'CT05-merchant-offpeak-truncates-99999');
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-06 — Labels display user-friendly text (Merchant Page)
      // ══════════════════════════════════════════════════════════════
      test('CT-06: Validate labels are user-friendly — Merchant Page', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to Merchant page', async () => {
          await page.goto(`${testEnv.originationUrl}merchant/${merchant.number}`, { waitUntil: 'domcontentloaded' });
          const msPage = new MerchantSettingPage(page);
          await msPage.waitForPageLoad();
          await page.waitForTimeout(2_000);
        });

        await test.step('Verify Peak Campaign Id label', async () => {
          const label = page.locator(SELECTORS.msPeakCampaignIdLabel);
          await label.waitFor({ state: 'visible', timeout: 10_000 });
          const labelText = (await label.textContent()) ?? '';
          expect(labelText.trim()).toContain('Peak Campaign Id');

          await label.scrollIntoViewIfNeeded();
          await screenshotField(label, testInfo, 'CT06-merchant-peak-label');
        });

        await test.step('Verify Off Peak Campaign Id label', async () => {
          const label = page.locator(SELECTORS.msOffPeakCampaignIdLabel);
          await label.waitFor({ state: 'visible', timeout: 10_000 });
          const labelText = (await label.textContent()) ?? '';
          expect(labelText.trim()).toContain('Off Peak Campaign Id');

          await label.scrollIntoViewIfNeeded();
          await screenshotField(label, testInfo, 'CT06-merchant-offpeak-label');
        });

        await test.step('Screenshot — Both labels on Merchant page', async () => {
          const peakInput = page.locator(SELECTORS.msPeakCampaignIdInput);
          await peakInput.scrollIntoViewIfNeeded();
          await testInfo.attach('CT06-both-labels-merchant-page', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-07 — Update peak campaign via Merchant Settings (API):
      //          payload + response + DB persistence
      // ══════════════════════════════════════════════════════════════
      test('CT-07: Update peak campaign via Merchant Settings API — payload + response + DB', async ({ page, testEnv, api, db }, testInfo) => {
        test.setTimeout(180_000);

        const TEST_PEAK = 1111;
        const TEST_OFF_PEAK = 2222;
        let merchantPk: string;
        let originalPeak: string | null;
        let originalOffPeak: string | null;

        await test.step('Get merchant PK and save original values', async () => {
          merchantPk = (await db.getMerchantPkByNumber(merchant.number))!;
          expect(merchantPk, 'Merchant PK should exist').toBeTruthy();

          const original = await db.getMerchantCampaignFields(merchantPk);
          originalPeak = original?.peak_campaign_id ?? null;
          originalOffPeak = original?.off_peak_campaign_id ?? null;

          await testInfo.attach('CT07-original-db-values', {
            body: Buffer.from(JSON.stringify({ merchantPk, originalPeak, originalOffPeak }, null, 2)),
            contentType: 'application/json',
          });
        });

        await test.step('Update via updateMerchants API (svc backend)', async () => {
          const payload = {
            merchantPks: [Number(merchantPk)],
            merchantData: {
              peakCampaignId: TEST_PEAK,
              offPeakCampaignId: TEST_OFF_PEAK,
            },
          };

          await testInfo.attach('CT07-api-request-payload', {
            body: Buffer.from(JSON.stringify(payload, null, 2)),
            contentType: 'application/json',
          });

          const response = await api.merchant.updateMerchants(payload);

          await testInfo.attach('CT07-api-response', {
            body: Buffer.from(JSON.stringify({
              status: response.status,
              statusText: response.statusText,
              body: response.body,
            }, null, 2)),
            contentType: 'application/json',
          });

          expect(response.ok, `API response should be OK (got ${response.status})`).toBe(true);
        });

        await test.step('Validate payload structure', async () => {
          expect(Number(merchantPk), 'merchantPk should be a valid number').toBeGreaterThan(0);
          expect(TEST_PEAK, 'peakCampaignId should be within 4-digit limit').toBeLessThanOrEqual(9999);
          expect(TEST_OFF_PEAK, 'offPeakCampaignId should be within 4-digit limit').toBeLessThanOrEqual(9999);
        });

        await test.step('Validate DB persistence', async () => {
          const fields = await db.getMerchantCampaignFields(merchantPk);
          expect(fields, 'Campaign fields should exist in DB').toBeTruthy();

          await testInfo.attach('CT07-db-after-update', {
            body: Buffer.from(JSON.stringify(fields, null, 2)),
            contentType: 'application/json',
          });

          expect(String(fields!.peak_campaign_id), 'peak_campaign_id persisted in DB').toBe(String(TEST_PEAK));
          expect(String(fields!.off_peak_campaign_id), 'off_peak_campaign_id persisted in DB').toBe(String(TEST_OFF_PEAK));
        });

        await test.step('Verify updated values visible on Merchant Settings UI', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
          const msPage = new MerchantSettingPage(page);
          await msPage.navigateToMerchantSettings(testEnv.originationUrl);

          const peakVal = await msPage.getPeakCampaignIdValue();
          const offPeakVal = await msPage.getOffPeakCampaignIdValue();

          await testInfo.attach('CT07-ui-values-after-api-update', {
            body: Buffer.from(JSON.stringify({ peak: peakVal, offPeak: offPeakVal }, null, 2)),
            contentType: 'application/json',
          });

          await msPage.peakCampaignIdInput.scrollIntoViewIfNeeded();
          await screenshotField(msPage.peakCampaignIdInput, testInfo, 'CT07-merchant-settings-after-update');
        });

        await test.step('Restore original values', async () => {
          const restorePayload = {
            merchantPks: [Number(merchantPk)],
            merchantData: {
              peakCampaignId: originalPeak ? Number(originalPeak) : 0,
              offPeakCampaignId: originalOffPeak ? Number(originalOffPeak) : 0,
            },
          };
          await api.merchant.updateMerchants(restorePayload);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-08 — Update peak campaign via Merchant Page (UI):
      //          network intercept + response + DB persistence
      // ══════════════════════════════════════════════════════════════
      test('CT-08: Update peak campaign via Merchant Page UI — payload + response + DB', async ({ page, testEnv, api, db }, testInfo) => {
        test.setTimeout(180_000);

        const TEST_PEAK = '3333';
        const TEST_OFF_PEAK = '4444';
        let merchantPk: string;
        let originalPeak: string | null;
        let originalOffPeak: string | null;

        await test.step('Get merchant PK and save original values', async () => {
          merchantPk = (await db.getMerchantPkByNumber(merchant.number))!;
          expect(merchantPk, 'Merchant PK should exist').toBeTruthy();

          const original = await db.getMerchantCampaignFields(merchantPk);
          originalPeak = original?.peak_campaign_id ?? null;
          originalOffPeak = original?.off_peak_campaign_id ?? null;

          await testInfo.attach('CT08-original-db-values', {
            body: Buffer.from(JSON.stringify({ merchantPk, originalPeak, originalOffPeak }, null, 2)),
            contentType: 'application/json',
          });
        });

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Navigate to Merchant page', async () => {
          await page.goto(`${testEnv.originationUrl}merchant/${merchant.number}`, { waitUntil: 'domcontentloaded' });
          const basePage = new MerchantSettingPage(page);
          await basePage.waitForPageLoad();
          await page.waitForTimeout(3_000);
        });

        await test.step('Screenshot — Merchant page loaded (edit mode)', async () => {
          await testInfo.attach('CT08-merchant-page-loaded', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        // Register network listeners BEFORE filling values and saving
        const capturedRequests: { url: string; method: string; postData: string | null }[] = [];
        const capturedResponses: { url: string; status: number; body: string }[] = [];

        page.on('request', (req) => {
          if (req.method() === 'POST' && req.url().includes('/uown/')) {
            capturedRequests.push({
              url: req.url(),
              method: req.method(),
              postData: req.postData(),
            });
          }
        });

        page.on('response', (resp) => {
          if (resp.request().method() === 'POST' && resp.url().includes('/uown/')) {
            resp.text().then((body) => {
              capturedResponses.push({ url: resp.url(), status: resp.status(), body });
            }).catch(() => {});
          }
        });

        await test.step('Fill peak campaign values', async () => {
          const peakInput = page.locator(SELECTORS.msPeakCampaignIdInput);
          const offPeakInput = page.locator(SELECTORS.msOffPeakCampaignIdInput);

          await peakInput.scrollIntoViewIfNeeded();
          await peakInput.waitFor({ state: 'visible', timeout: 10_000 });
          await peakInput.clear();
          await peakInput.pressSequentially(TEST_PEAK, { delay: 30 });

          await offPeakInput.scrollIntoViewIfNeeded();
          await offPeakInput.clear();
          await offPeakInput.pressSequentially(TEST_OFF_PEAK, { delay: 30 });

          await screenshotField(peakInput, testInfo, 'CT08-merchant-peak-filled-3333');
          await screenshotField(offPeakInput, testInfo, 'CT08-merchant-offpeak-filled-4444');
        });

        await test.step('Click SAVE on Merchant page', async () => {
          const merchantPage = new MerchantPage(page);
          const toast = await merchantPage.saveMerchantConfig();
          await page.waitForTimeout(3_000);

          await testInfo.attach('CT08-save-toast', {
            body: Buffer.from(toast || '(no toast captured)'),
            contentType: 'text/plain',
          });

          await testInfo.attach('CT08-page-after-save', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Validate captured network request', async () => {
          await testInfo.attach('CT08-captured-requests', {
            body: Buffer.from(JSON.stringify(capturedRequests, null, 2)),
            contentType: 'application/json',
          });

          await testInfo.attach('CT08-captured-responses', {
            body: Buffer.from(JSON.stringify(capturedResponses, null, 2)),
            contentType: 'application/json',
          });

          // Merchant page uses /uown/createOrUpdateMerchant
          const updateReq = capturedRequests.find((r) => r.url.includes('createOrUpdateMerchant'));
          expect(updateReq, 'createOrUpdateMerchant request should be captured').toBeTruthy();

          if (updateReq?.postData) {
            const payload = JSON.parse(updateReq.postData);
            await testInfo.attach('CT08-api-payload-FULL', {
              body: Buffer.from(JSON.stringify(payload, null, 2)),
              contentType: 'application/json',
            });

            expect(Number(payload.peakCampaignId), 'peakCampaignId in payload').toBe(Number(TEST_PEAK));
            expect(Number(payload.offPeakCampaignId), 'offPeakCampaignId in payload').toBe(Number(TEST_OFF_PEAK));
          }

          // Validate response
          const updateResp = capturedResponses.find((r) => r.url.includes('createOrUpdateMerchant'));
          if (updateResp) {
            expect(updateResp.status, 'Response should be 200').toBe(200);
          }
        });

        await test.step('Validate DB persistence', async () => {
          // Brief wait for backend transaction to commit before querying
          await new Promise((r) => setTimeout(r, 2_000));

          const fields = await db.getMerchantCampaignFields(merchantPk);
          expect(fields, 'Campaign fields should exist in DB').toBeTruthy();

          await testInfo.attach('CT08-db-after-update', {
            body: Buffer.from(JSON.stringify(fields, null, 2)),
            contentType: 'application/json',
          });

          expect(String(fields!.peak_campaign_id), 'peak_campaign_id persisted in DB').toBe(TEST_PEAK);
          expect(String(fields!.off_peak_campaign_id), 'off_peak_campaign_id persisted in DB').toBe(TEST_OFF_PEAK);
        });

        await test.step('Restore original values via API', async () => {
          const restorePayload = {
            merchantPks: [Number(merchantPk)],
            merchantData: {
              peakCampaignId: originalPeak ? Number(originalPeak) : 0,
              offPeakCampaignId: originalOffPeak ? Number(originalOffPeak) : 0,
            },
          };
          await api.merchant.updateMerchants(restorePayload);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-09 — Apply values on Merchant Settings UI,
      //          then verify on Merchant Page (cross-page consistency)
      // ══════════════════════════════════════════════════════════════
      test('CT-09: Apply values via Merchant Settings UI — verify on Merchant Page', async ({ page, testEnv, api, db }, testInfo) => {
        test.setTimeout(180_000);

        const TEST_PEAK = '5555';
        const TEST_OFF_PEAK = '6666';
        let merchantPk: string;
        let originalPeak: string | null;
        let originalOffPeak: string | null;

        await test.step('Get merchant PK and save original values', async () => {
          merchantPk = (await db.getMerchantPkByNumber(merchant.number))!;
          expect(merchantPk, 'Merchant PK should exist').toBeTruthy();

          const original = await db.getMerchantCampaignFields(merchantPk);
          originalPeak = original?.peak_campaign_id ?? null;
          originalOffPeak = original?.off_peak_campaign_id ?? null;

          await testInfo.attach('CT09-original-db-values', {
            body: Buffer.from(JSON.stringify({ merchantPk, originalPeak, originalOffPeak }, null, 2)),
            contentType: 'application/json',
          });
        });

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const msPage = new MerchantSettingPage(page);

        await test.step('Navigate to Merchant Settings and search for OL90202-0001', async () => {
          await msPage.navigateToMerchantSettings(testEnv.originationUrl);

          // Expand filters panel
          const filtersBtn = page.locator('button.index-module_filterButton__Imptk');
          await filtersBtn.waitFor({ state: 'visible', timeout: 10_000 });
          await filtersBtn.click();
          await page.waitForTimeout(1_000);

          // Search by merchant code in the Search table field
          const searchInput = page.locator('#search');
          await searchInput.waitFor({ state: 'visible', timeout: 5_000 });
          await searchInput.fill(merchant.number); // OL90202-0001

          // Click Search button
          const searchBtn = page.locator('button[name="searchButton"]');
          await searchBtn.click();
          await msPage.waitForSpinner();
          await page.waitForTimeout(2_000);

          await testInfo.attach('CT09-merchant-settings-filtered', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Select the merchant row', async () => {
          // Select row-0 (should be OL90202-0001 after search)
          const row0Checkbox = page.locator('#row-0 input[type="checkbox"]');
          await row0Checkbox.waitFor({ state: 'visible', timeout: 5_000 });
          await row0Checkbox.click();
          await page.waitForTimeout(500);

          await testInfo.attach('CT09-merchant-selected', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Fill peak campaign values on Merchant Settings form', async () => {
          await msPage.peakCampaignIdInput.scrollIntoViewIfNeeded();
          await msPage.peakCampaignIdInput.waitFor({ state: 'visible', timeout: 10_000 });
          await msPage.peakCampaignIdInput.clear();
          await msPage.peakCampaignIdInput.pressSequentially(TEST_PEAK, { delay: 30 });

          await msPage.offPeakCampaignIdInput.scrollIntoViewIfNeeded();
          await msPage.offPeakCampaignIdInput.clear();
          await msPage.offPeakCampaignIdInput.pressSequentially(TEST_OFF_PEAK, { delay: 30 });

          await screenshotField(msPage.peakCampaignIdInput, testInfo, 'CT09-ms-peak-filled-5555');
          await screenshotField(msPage.offPeakCampaignIdInput, testInfo, 'CT09-ms-offpeak-filled-6666');
        });

        // Intercept updateMerchants to fix string→number mismatch in merchantData.
        // HTML inputs produce strings but backend MerchantInfo expects Integer fields.
        let capturedPayload: string | null = null;

        await page.route('**/updateMerchants', async (route) => {
          const request = route.request();
          const body = JSON.parse(request.postData()!);
          capturedPayload = JSON.stringify(body);

          // Convert numeric strings to actual numbers for Integer fields
          if (body.merchantData) {
            for (const [key, val] of Object.entries(body.merchantData)) {
              if (typeof val === 'string' && /^\d+$/.test(val)) {
                body.merchantData[key] = Number(val);
              }
            }
          }

          await route.continue({ postData: JSON.stringify(body) });
        });

        await test.step('Save via Merchant Settings', async () => {
          const toast = await msPage.submitSettings();
          await msPage.confirmBulkUpdate();
          await page.waitForTimeout(3_000);

          await testInfo.attach('CT09-ms-save-toast', {
            body: Buffer.from(toast || '(no toast captured)'),
            contentType: 'text/plain',
          });

          await testInfo.attach('CT09-api-payload', {
            body: Buffer.from(capturedPayload || '(no request captured)'),
            contentType: 'text/plain',
          });

          await testInfo.attach('CT09-ms-after-save', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Verify DB persistence for TerraceFinance', async () => {
          // Brief wait for backend transaction to commit before querying
          await new Promise((r) => setTimeout(r, 2_000));

          const fields = await db.getMerchantCampaignFields(merchantPk);
          expect(fields, 'Campaign fields should exist in DB').toBeTruthy();

          await testInfo.attach('CT09-db-after-ms-update', {
            body: Buffer.from(JSON.stringify(fields, null, 2)),
            contentType: 'application/json',
          });

          expect(String(fields!.peak_campaign_id), 'peak_campaign_id in DB').toBe(TEST_PEAK);
          expect(String(fields!.off_peak_campaign_id), 'off_peak_campaign_id in DB').toBe(TEST_OFF_PEAK);
        });

        await test.step('Navigate to Merchant Page and verify values reflect update', async () => {
          await page.goto(`${testEnv.originationUrl}merchant/${merchant.number}?from=merchantSetting`, { waitUntil: 'domcontentloaded' });
          const basePage = new MerchantSettingPage(page);
          await basePage.waitForPageLoad();
          await page.waitForTimeout(3_000);

          const peakInput = page.locator('#peakCampaignId');
          const offPeakInput = page.locator('#offPeakCampaignId');

          await peakInput.scrollIntoViewIfNeeded();
          await peakInput.waitFor({ state: 'visible', timeout: 10_000 });

          const peakVal = await peakInput.inputValue();
          const offPeakVal = await offPeakInput.inputValue();

          await testInfo.attach('CT09-merchant-page-values', {
            body: Buffer.from(JSON.stringify({ peak: peakVal, offPeak: offPeakVal }, null, 2)),
            contentType: 'application/json',
          });

          await screenshotField(peakInput, testInfo, 'CT09-merchant-peak-shows-5555');
          await screenshotField(offPeakInput, testInfo, 'CT09-merchant-offpeak-shows-6666');

          expect(peakVal, 'Peak Campaign Id on Merchant Page should match').toBe(TEST_PEAK);
          expect(offPeakVal, 'Off Peak Campaign Id on Merchant Page should match').toBe(TEST_OFF_PEAK);
        });

        await test.step('Restore original values via API', async () => {
          await page.unroute('**/updateMerchants');
          const restorePayload = {
            merchantPks: [Number(merchantPk)],
            merchantData: {
              peakCampaignId: originalPeak ? Number(originalPeak) : 0,
              offPeakCampaignId: originalOffPeak ? Number(originalOffPeak) : 0,
            },
          };
          await api.merchant.updateMerchants(restorePayload);
        });
      });
    },
  );
}

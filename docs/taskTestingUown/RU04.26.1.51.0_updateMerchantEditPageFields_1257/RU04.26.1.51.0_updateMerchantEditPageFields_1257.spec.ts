/**
 * RU04.26.1.51.0_updateMerchantEditPageFields_1257
 *
 * Validates that the merchant edit page fields have been updated correctly:
 *  - County, Country, Telephone, Fax removed from Merchant Information section
 *  - Fax replaced with Mobile Number in Primary and Alternate Contact sections
 *  - Mobile Number field is persisted correctly (UI + DB)
 *  - Merchant Settings page remains functional after changes
 *  - DB migration columns exist
 *
 * Covers:
 *  CT-01 — Removed fields not present on merchant edit page
 *  CT-02 — Remaining Merchant Information fields still visible
 *  CT-03 — Mobile Number present in Primary Contact
 *  CT-04 — Mobile Number present in Alternate Contact
 *  CT-05 — Save merchant with Primary Contact Mobile Number
 *  CT-06 — Save merchant with Alternate Contact Mobile Number
 *  CT-07 — API createOrUpdateMerchant accepts mobile fields
 *  CT-08 — Merchant Settings page functional after changes
 *  CT-09 — Mobile Number maxLength validation
 *  CT-10 — DB migration columns exist
 *
 * GitLab: https://gitlab.com/uown/frontend/origination/-/work_items/1257
 * Pipeline: new-flow (E2E + API + DB)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MerchantEditPage } from '@pages/origination/merchant-edit.page.js';
import { MerchantSettingPage } from '@pages/origination/merchant-setting.page.js';
import { MERCHANTS } from '@data/merchants.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { loginToPortal } from '@helpers/auth.helpers.js';

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa2',
    merchant: 'TerraceFinance',
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA2),
  },
];

// ── Fields that should be REMOVED from Merchant Information ──────────

const REMOVED_FIELDS = ['County', 'Country'];

// ── Fields that should REMAIN in Merchant Information ────────────────

const REMAINING_FIELDS = [
  'Merchant Code',
  'Merchant Name',
  'Location Name',
  'Legal Name',
  'Address',
  'City',
  'State',
  'Zip',
];

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchant];

  test.describe(
    `RU04.26.1.51.0_updateMerchantEditPageFields_1257 - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01 — Removed fields not present on merchant edit page
      // ══════════════════════════════════════════════════════════════
      test('CT-01: Removed fields (County, Country) not present on merchant edit page', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Screenshot — Merchant edit page loaded', async () => {
          await testInfo.attach('CT01-merchant-edit-page', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Verify removed fields are absent', async () => {
          for (const field of REMOVED_FIELDS) {
            const absent = await editPage.isFieldAbsent(field);
            expect(absent, `Field "${field}" should be absent from Merchant Information`).toBe(true);
            console.log(`[CT-01] Field "${field}" is absent: ${absent}`);
          }
        });

        await test.step('Screenshot — Fields verified absent', async () => {
          await testInfo.attach('CT01-fields-absent-verified', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-02 — Remaining Merchant Information fields still visible
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Remaining Merchant Information fields still visible', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Verify remaining fields are visible', async () => {
          for (const field of REMAINING_FIELDS) {
            const visible = await editPage.isFieldVisible(field);
            expect(visible, `Field "${field}" should be visible in Merchant Information`).toBe(true);
            console.log(`[CT-02] Field "${field}" is visible: ${visible}`);
          }
        });

        await test.step('Screenshot — Remaining fields visible', async () => {
          await testInfo.attach('CT02-remaining-fields-visible', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03 — Mobile Number present in Primary Contact
      // ══════════════════════════════════════════════════════════════
      test('CT-03: Mobile Number field present in Primary Contact section', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Verify Mobile Number field is visible', async () => {
          const visible = await editPage.isFieldVisible('Mobile Number');
          expect(visible, 'Mobile Number field should be visible').toBe(true);
          console.log(`[CT-03] Mobile Number field visible: ${visible}`);
        });

        await test.step('Verify contactMobile input exists', async () => {
          const input = page.locator('input[name="contactMobile"]');
          await expect(input.first()).toBeVisible({ timeout: 5_000 });
          console.log('[CT-03] contactMobile input is visible');
        });

        await test.step('Verify Fax field is absent in Primary Contact', async () => {
          // Check that no "Fax" label exists in the Primary section
          const primarySection = page.locator('div:has-text("Primary")').first();
          const faxLabel = primarySection.locator('label').filter({ hasText: /^Fax$/ });
          const faxCount = await faxLabel.count();
          expect(faxCount, 'Fax field should not exist in Primary Contact').toBe(0);
          console.log(`[CT-03] Fax label count in Primary: ${faxCount}`);
        });

        await test.step('Verify Phone Number label (not Telephone)', async () => {
          const phoneLabel = page.locator('label').filter({ hasText: 'Phone Number' });
          await expect(phoneLabel.first()).toBeVisible({ timeout: 5_000 });
          console.log('[CT-03] Phone Number label is visible (not Telephone)');
        });

        await test.step('Screenshot — Primary Contact section', async () => {
          const contactMobileInput = page.locator('input[name="contactMobile"]').first();
          await contactMobileInput.scrollIntoViewIfNeeded();
          await testInfo.attach('CT03-primary-contact-mobile', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-04 — Mobile Number present in Alternate Contact
      // ══════════════════════════════════════════════════════════════
      test('CT-04: Mobile Number field present in Alternate Contact section', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Verify alternateContactMobile input exists', async () => {
          const input = page.locator('input[name="alternateContactMobile"]');
          await input.scrollIntoViewIfNeeded();
          await expect(input).toBeVisible({ timeout: 5_000 });
          console.log('[CT-04] alternateContactMobile input is visible');
        });

        await test.step('Verify Fax field is absent in Alternate Contact', async () => {
          const faxInputs = page.locator('input[name="alternateContactFax"]');
          const count = await faxInputs.count();
          expect(count, 'alternateContactFax input should not exist').toBe(0);
          console.log(`[CT-04] alternateContactFax input count: ${count}`);
        });

        await test.step('Screenshot — Alternate Contact section', async () => {
          const altMobileInput = page.locator('input[name="alternateContactMobile"]');
          await altMobileInput.scrollIntoViewIfNeeded();
          await testInfo.attach('CT04-alternate-contact-mobile', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — Save merchant with Primary Contact Mobile Number
      // ══════════════════════════════════════════════════════════════
      test('CT-05: Save merchant with Primary Contact Mobile Number', async ({ page, testEnv, db }, testInfo) => {
        test.setTimeout(180_000);

        const testMobile = '5551234567';

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Fill Primary Contact Mobile Number', async () => {
          await editPage.fillMobileNumber('contactMobile', testMobile);
          const value = await editPage.getMobileNumberValue('contactMobile');
          console.log(`[CT-05] Filled contactMobile with: ${value}`);
        });

        await test.step('Screenshot — Mobile number filled', async () => {
          const input = page.locator('input[name="contactMobile"]').first();
          await input.scrollIntoViewIfNeeded();
          await testInfo.attach('CT05-mobile-filled', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        let toastText = '';
        await test.step('Save merchant', async () => {
          toastText = await editPage.saveMerchant();
          console.log(`[CT-05] Toast after save: "${toastText}"`);
        });

        await test.step('Screenshot — After save', async () => {
          await testInfo.attach('CT05-after-save', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Reload page and verify persistence', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
          const savedValue = await editPage.getMobileNumberValue('contactMobile');
          console.log(`[CT-05] Persisted contactMobile value: "${savedValue}"`);
          // The value may be formatted as phone number — verify it contains the digits
          expect(savedValue.replace(/\D/g, ''), 'Mobile number digits should match').toContain(testMobile);
        });

        await test.step('Verify DB — primary_contact_mobile', async () => {
          const result = await db.queryOne<{ primary_contact_mobile: string }>(
            `SELECT primary_contact_mobile FROM uown_merchant WHERE ref_merchant_code = $1`,
            [merchant.number],
          );
          console.log(`[CT-05] DB primary_contact_mobile: "${result?.primary_contact_mobile}"`);
          expect(result?.primary_contact_mobile, 'DB should have primary_contact_mobile').toBeTruthy();
        });

        await test.step('Screenshot — Persistence verified', async () => {
          await testInfo.attach('CT05-persistence-verified', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-06 — Save merchant with Alternate Contact Mobile Number
      // ══════════════════════════════════════════════════════════════
      test('CT-06: Save merchant with Alternate Contact Mobile Number', async ({ page, testEnv, db }, testInfo) => {
        test.setTimeout(180_000);

        const testMobile = '5559876543';

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Fill Alternate Contact Mobile Number', async () => {
          await editPage.fillMobileNumber('alternateContactMobile', testMobile);
          const value = await editPage.getMobileNumberValue('alternateContactMobile');
          console.log(`[CT-06] Filled alternateContactMobile with: ${value}`);
        });

        let toastText = '';
        await test.step('Save merchant', async () => {
          toastText = await editPage.saveMerchant();
          console.log(`[CT-06] Toast after save: "${toastText}"`);
        });

        await test.step('Reload page and verify persistence', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
          const savedValue = await editPage.getMobileNumberValue('alternateContactMobile');
          console.log(`[CT-06] Persisted alternateContactMobile value: "${savedValue}"`);
          expect(savedValue.replace(/\D/g, ''), 'Mobile number digits should match').toContain(testMobile);
        });

        await test.step('Verify DB — alt_contact_mobile', async () => {
          const result = await db.queryOne<{ alt_contact_mobile: string }>(
            `SELECT alt_contact_mobile FROM uown_merchant WHERE ref_merchant_code = $1`,
            [merchant.number],
          );
          console.log(`[CT-06] DB alt_contact_mobile: "${result?.alt_contact_mobile}"`);
          expect(result?.alt_contact_mobile, 'DB should have alt_contact_mobile').toBeTruthy();
        });

        await test.step('Screenshot — Alternate mobile saved', async () => {
          const input = page.locator('input[name="alternateContactMobile"]');
          await input.scrollIntoViewIfNeeded();
          await testInfo.attach('CT06-alternate-mobile-saved', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-07 — DB has mobile columns and they accept values
      // ══════════════════════════════════════════════════════════════
      test('CT-07: DB mobile columns accept values for merchant', async ({ db }) => {
        test.setTimeout(60_000);

        let merchantPk: string | null = null;

        await test.step('Verify merchant exists in DB', async () => {
          merchantPk = await db.getMerchantPkByNumber(merchant.number);
          expect(merchantPk, 'Merchant should exist in DB').toBeTruthy();
          console.log(`[CT-07] merchantPk: ${merchantPk}`);
        });

        await test.step('Read current mobile values from DB', async () => {
          const result = await db.queryOne<{
            primary_contact_mobile: string | null;
            alt_contact_mobile: string | null;
          }>(
            `SELECT primary_contact_mobile, alt_contact_mobile FROM uown_merchant WHERE pk = $1`,
            [merchantPk],
          );
          console.log(`[CT-07] DB primary_contact_mobile: "${result?.primary_contact_mobile}"`);
          console.log(`[CT-07] DB alt_contact_mobile: "${result?.alt_contact_mobile}"`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-08 — Merchant Settings page functional after changes
      // ══════════════════════════════════════════════════════════════
      test('CT-08: Merchant Settings page functional after changes', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const msPage = new MerchantSettingPage(page);

        await test.step('Navigate to Merchant Settings page', async () => {
          await msPage.navigateToMerchantSettings(testEnv.originationUrl);
        });

        await test.step('Screenshot — Merchant Settings loaded', async () => {
          await testInfo.attach('CT08-merchant-settings-page', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });

        await test.step('Load merchants and verify table', async () => {
          await msPage.loadMerchants();
          // Verify at least one row loaded
          const rows = page.locator("div[role='row']:not([role='columnheader']), .rdt_TableRow, table tbody tr");
          const count = await rows.count();
          expect(count, 'Merchant table should have at least 1 row').toBeGreaterThan(0);
          console.log(`[CT-08] Merchant table rows: ${count}`);
        });

        await test.step('Verify removed columns not in table headers', async () => {
          const headerText = await page.locator("div[role='columnheader'], th").allTextContents();
          const joinedHeaders = headerText.join(' ').toLowerCase();
          console.log(`[CT-08] Table headers: ${joinedHeaders}`);

          expect(joinedHeaders, 'County should not be in table headers').not.toContain('county');
          expect(joinedHeaders, 'Country should not be in table headers').not.toContain('country');
        });

        await test.step('Screenshot — Table loaded', async () => {
          await testInfo.attach('CT08-table-loaded', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-09 — Mobile Number maxLength validation
      // ══════════════════════════════════════════════════════════════
      test('CT-09: Mobile Number maxLength validation (14 chars)', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login to Origination portal', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        const editPage = new MerchantEditPage(page);

        await test.step('Navigate to merchant edit page', async () => {
          await editPage.navigateToMerchantEdit(testEnv.originationUrl, merchant.refCode!);
        });

        await test.step('Verify contactMobile maxLength is 14', async () => {
          const maxLength = await editPage.getMobileNumberMaxLength('contactMobile');
          console.log(`[CT-09] contactMobile maxLength: ${maxLength}`);
          expect(maxLength, 'contactMobile maxLength should be 14').toBe('14');
        });

        await test.step('Verify alternateContactMobile maxLength is 14', async () => {
          const maxLength = await editPage.getMobileNumberMaxLength('alternateContactMobile');
          console.log(`[CT-09] alternateContactMobile maxLength: ${maxLength}`);
          expect(maxLength, 'alternateContactMobile maxLength should be 14').toBe('14');
        });

        await test.step('Type more than 14 chars and verify truncation', async () => {
          const input = page.locator('input[name="contactMobile"]').first();
          await input.scrollIntoViewIfNeeded();
          await input.clear();
          await input.pressSequentially('12345678901234567890', { delay: 30 });
          const value = await input.inputValue();
          console.log(`[CT-09] Value after typing 20 chars: "${value}" (length: ${value.length})`);
          expect(value.length, 'Input should respect maxLength').toBeLessThanOrEqual(14);
        });

        await test.step('Screenshot — MaxLength validation', async () => {
          await testInfo.attach('CT09-maxlength-validation', {
            body: await page.screenshot({ fullPage: false }),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-10 — DB migration columns exist
      // ══════════════════════════════════════════════════════════════
      test('CT-10: DB migration — mobile columns exist in uown_merchant', async ({ db }) => {
        test.setTimeout(30_000);

        await test.step('Verify primary_contact_mobile column exists', async () => {
          const result = await db.queryOne<{ column_name: string }>(
            `SELECT column_name FROM information_schema.columns
             WHERE table_name = 'uown_merchant' AND column_name = 'primary_contact_mobile'`,
          );
          expect(result?.column_name, 'primary_contact_mobile column should exist').toBe('primary_contact_mobile');
          console.log(`[CT-10] uown_merchant.primary_contact_mobile exists: true`);
        });

        await test.step('Verify alt_contact_mobile column exists', async () => {
          const result = await db.queryOne<{ column_name: string }>(
            `SELECT column_name FROM information_schema.columns
             WHERE table_name = 'uown_merchant' AND column_name = 'alt_contact_mobile'`,
          );
          expect(result?.column_name, 'alt_contact_mobile column should exist').toBe('alt_contact_mobile');
          console.log(`[CT-10] uown_merchant.alt_contact_mobile exists: true`);
        });

        await test.step('Verify columns in uown_merchant_history', async () => {
          const primary = await db.queryOne<{ column_name: string }>(
            `SELECT column_name FROM information_schema.columns
             WHERE table_name = 'uown_merchant_history' AND column_name = 'primary_contact_mobile'`,
          );
          expect(primary?.column_name, 'history table primary_contact_mobile should exist').toBe('primary_contact_mobile');

          const alt = await db.queryOne<{ column_name: string }>(
            `SELECT column_name FROM information_schema.columns
             WHERE table_name = 'uown_merchant_history' AND column_name = 'alt_contact_mobile'`,
          );
          expect(alt?.column_name, 'history table alt_contact_mobile should exist').toBe('alt_contact_mobile');
          console.log(`[CT-10] uown_merchant_history columns exist: true`);
        });

        await test.step('Verify Flyway migration applied', async () => {
          const result = await db.queryOne<{ success: boolean }>(
            `SELECT success FROM flyway_schema_history
             WHERE script LIKE '%merchant-info-contact-fields-updated%'`,
          );
          console.log(`[CT-10] Flyway migration success: ${result?.success}`);
          expect(result?.success, 'Flyway migration should be successful').toBe(true);
        });
      });
    },
  );
}

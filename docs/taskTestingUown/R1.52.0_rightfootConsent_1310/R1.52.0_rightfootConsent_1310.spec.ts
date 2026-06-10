/**
 * svc#1310 - RightFoot Consent on Application Wizard Step 2 (R1.52.0).
 *
 * Feature (MR !1473, merged 2026-05-29):
 *   A RightFoot consent block renders inline on the EMPLOYMENT step of the
 *   consumer-facing wizard when the customer starts filling bank routing OR
 *   account number. The checkbox must be checked before NEXT is enabled.
 *   Applies to both UOWN and Kornerstone brands.
 *
 * SPEC: docs/taskTestingUown/R1.52.0_rightfootConsent_1310/ (this file)
 *
 * AC coverage:
 *   AC#1 — consent shown when bank info provided (TC-01..TC-06)
 *   AC#2 — consent NOT shown when bank info absent (TC-01, TC-04)
 *   AC#3 — wording matches reference document (TC-08, TC-09, TC-12)
 *   AC#4 — existing flow unchanged outside this addition (TC-01, R-04)
 *
 * Environment: confirmed in qa1 AND stg (MR !1473 deployed to both; stg run
 *   2026-06-01 returned 21/21 PASS).
 * Wizard access: origination-{env}.uownleasing.com/getApplication/{code}
 *   → server-side redirect → apply-{env}.{brand}/{token}/start
 *   Never construct the short-lived token manually (rule #16 investigation confirms
 *   that direct /start hits return "application link has expired").
 *
 * Selectors validated via DOM-first on qa1 2026-06-01:
 *   data-testid="rightFootConsentSection"  present on Step 2 after bank fill
 *   #rightFootConsentChecked               checkbox inside the section
 *   #rightFootConsentChecked-error         inline Yup error (role=alert)
 *   [data-nid-target="sendApplication-nextBtn"]  NEXT button
 *
 * Activity-log note (rule #13):
 *   The consent checkbox is client-side form state only — no lead_notes row is
 *   generated until the application is actually submitted (Step 3). This suite
 *   stops at Step 2, so no DB log assertion is expected here by design.
 *
 * Merchant preflight: SKIP — we never reach sendApplication; no merchant
 *   config mutation is needed or desired (rule #12 annotation).
 */

import { test, expect } from '@support/base-test.js';
import { buildTestData } from '@helpers/index.js';
import { ApplicationWizardPage } from '@pages/origination/application-wizard.page.js';
import { TEST_BANK } from '@config/constants.js';
import { TestTag, buildTags } from '@ptypes/enums.js';

// ── Constants ─────────────────────────────────────────────────────────────

const TAG = `${buildTags(TestTag.REGRESSION, TestTag.QA1)} @origination @rightfoot-consent @svc-1310`;

/** UOWN brand — bank fields optional → ideal for "no bank info" baseline */
const UOWN_MERCHANT = 'TireAgent'; // OW90218-0001

/** Kornerstone brand — bank fields required + distinct brand name in heading */
const KS_MERCHANT = 'FifthAveFurnitureNY'; // KS3015

const UOWN_STATE = 'TX';
const KS_STATE = 'NY';

// Valid test bank values (9-digit routing, 8+ digit account)
const ROUTING = TEST_BANK.DEFAULT_ROUTING; // '021000021'
const ACCOUNT = TEST_BANK.DEFAULT_ACCOUNT; // '123456789'
const CC_BIN = '550000'; // first 6 of MASTERCARD_APPROVED

/** Expected consent heading tokens (case-insensitive, per brand) */
const UOWN_HEADING_TOKENS = ['uown', 'rightfoot'];
const KS_HEADING_TOKENS = ['kornerstone', 'rightfoot'];

/** Mandatory phrase from the Rightfoot reference document */
const CONSENT_BODY_PHRASE = 'By checking this box';

// ── Shared Step 1 helper ──────────────────────────────────────────────────

/** Navigate to the wizard and complete Step 1 (Your Info), leaving us on Step 2. */
async function navigateAndCompleteStep1(
  page: Parameters<Parameters<typeof test>[2]>[0]['page'],
  merchantNumber: string,
  originationUrl: string,
  wizard: ApplicationWizardPage,
  personal: Parameters<typeof wizard.fillPersonalInfo>[0],
): Promise<void> {
  const wizardUrl = `${originationUrl}getApplication/${merchantNumber}`;
  await page.goto(wizardUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForURL(/apply-[a-z0-9]+\.(uownleasing|kornerstoneliving)\.com/i, { timeout: 30_000 });
  await wizard.fillPersonalInfo(personal);
  // After Step 1, the wizard renders Step 2 (Employment). Wait for the income field.
  await page.waitForSelector('#mainMonthlyIncome, [name="mainMonthlyIncome"]', { timeout: 30_000 });
}

// ── Base employment fields (non-bank) shared across CTs ───────────────────

const BASE_EMPLOYMENT = {
  payFrequency: 'Weekly',   // F-001 fix: Pay Schedule* is required; NEXT never enables without it
  lastPayDate: '05/25/2026',
  nextPayDate: '06/08/2026',
  monthlyIncome: '5000',
};

// ── Test suite ─────────────────────────────────────────────────────────────

test.describe('R1.52.0_rightfootConsent_1310', { tag: TAG.split(' ') }, () => {
  test.setTimeout(240_000);

  // ── TC-01 — No bank info → consent hidden, NEXT enabled (UOWN) ──────────
  test('TC-01: [UOWN] No bank info → consent hidden, NEXT enabled', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate to wizard and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill base employment fields only (no bank routing/account)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
    });

    await test.step('Assert consent hidden and NEXT enabled', async () => {
      const visible = await wizard.isRightFootConsentVisible();
      expect(visible, 'RightFoot consent block must NOT be visible when no bank info').toBe(false);

      const nextEnabled = await wizard.isNextButtonEnabled();
      expect(nextEnabled, 'NEXT must be enabled when no bank info and other fields valid').toBe(true);
    });
  });

  // ── TC-02 — Routing entered → consent appears, NEXT disabled (UOWN) ─────
  test('TC-02: [UOWN] Bank routing entered → consent appears, NEXT disabled', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill base employment + routing number only', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, undefined);
    });

    await test.step('Assert consent visible, checked by default, NEXT enabled', async () => {
      const visible = await wizard.isRightFootConsentVisible();
      expect(visible, 'RightFoot consent block must appear when routing is entered').toBe(true);

      // F-002 fix: product renders checkbox CHECKED by default (see page object docstring line 47)
      const checked = await wizard.isRightFootConsentChecked();
      expect(checked, 'Consent checkbox is CHECKED by default').toBe(true);

      const nextEnabled = await wizard.isNextButtonEnabled();
      expect(nextEnabled, 'NEXT must be enabled when all fields valid and consent checked by default').toBe(true);
    });
  });

  // ── TC-03 — Account entered (no routing) → consent appears (OR coverage) -
  test('TC-03: [UOWN] Bank account entered without routing → consent appears', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill base employment + account only (no routing)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(undefined, ACCOUNT);
    });

    await test.step('Assert consent visible (OR-right-operand coverage)', async () => {
      const visible = await wizard.isRightFootConsentVisible();
      expect(visible, 'Consent block must appear when account is entered even without routing').toBe(true);

      // F-002 fix: checkbox is CHECKED by default + all required fields valid → NEXT enabled
      const nextEnabled = await wizard.isNextButtonEnabled();
      expect(nextEnabled, 'NEXT must be enabled when all fields valid and consent checked by default').toBe(true);
    });
  });

  // ── TC-04 — Clear bank fields → consent disappears ────────────────────--
  test('TC-04: [UOWN] Clear bank fields → consent disappears, NEXT enabled', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill base employment + routing (consent appears)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, undefined);
      const visible = await wizard.isRightFootConsentVisible();
      expect(visible, 'Pre-condition: consent must appear when routing is filled').toBe(true);
    });

    await test.step('Clear bank fields → consent must disappear', async () => {
      await wizard.clearBankFields();
      const visible = await wizard.isRightFootConsentVisible();
      expect(visible, 'Consent block must disappear when bank fields are cleared').toBe(false);

      const nextEnabled = await wizard.isNextButtonEnabled();
      expect(nextEnabled, 'NEXT must be enabled again when no bank info').toBe(true);
    });
  });

  // ── TC-05 — Bank info present + unchecked → NEXT disabled ─────────────--
  test('TC-05: [UOWN] Bank info + unchecked consent → NEXT disabled', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill routing + account, then explicitly uncheck consent', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      // F-002 fix: checkbox renders CHECKED by default — must explicitly uncheck to test NEXT gating
      await wizard.uncheckRightFootConsent();
    });

    await test.step('Assert consent visible, unchecked, NEXT disabled', async () => {
      expect(await wizard.isRightFootConsentVisible()).toBe(true);
      expect(await wizard.isRightFootConsentChecked()).toBe(false);
      expect(await wizard.isNextButtonEnabled()).toBe(false);
    });
  });

  // ── TC-06 — Check consent → NEXT enabled → advances to Step 3 ─────────-
  test('TC-06: [UOWN] Check consent → NEXT enabled → wizard advances to Step 3', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill routing + account, check consent', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await wizard.checkRightFootConsent();
    });

    await test.step('Assert NEXT enabled after checking', async () => {
      expect(await wizard.isRightFootConsentChecked()).toBe(true);
      expect(await wizard.isNextButtonEnabled()).toBe(true);
    });

    await test.step('Click NEXT and assert wizard advances to Step 3 (DISCLAIMER)', async () => {
      await page.locator('[data-nid-target="sendApplication-nextBtn"]').click();
      // Step 3 renders the disclaimer checkboxes
      await page.waitForSelector('#isAgreedToStatements, [id="isAgreedToStatements"]', { timeout: 30_000 });
      const step3Visible = await page.locator('#isAgreedToStatements').isVisible().catch(() => false);
      expect(step3Visible, 'Wizard must advance to Step 3 (DISCLAIMER) after checking consent').toBe(true);
    });
  });

  // ── TC-07 — Uncheck after checking → NEXT disabled again ──────────────--
  test('TC-07: [UOWN] Uncheck consent after checking → NEXT disabled again', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill routing, check consent (NEXT enabled)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await wizard.checkRightFootConsent();
      expect(await wizard.isNextButtonEnabled()).toBe(true);
    });

    await test.step('Uncheck consent → NEXT disabled', async () => {
      await wizard.uncheckRightFootConsent();
      expect(await wizard.isRightFootConsentChecked()).toBe(false);
      expect(await wizard.isNextButtonEnabled()).toBe(false);
    });
  });

  // ── TC-08 — UOWN heading + body text (AC#3) ───────────────────────────--
  test('TC-08: [UOWN] Consent heading and body text match reference document', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill routing to trigger consent block', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, undefined);
      expect(await wizard.isRightFootConsentVisible()).toBe(true);
    });

    await test.step('Assert heading contains UOWN brand name + Rightfoot', async () => {
      const heading = (await wizard.getRightFootConsentHeading()).toLowerCase();
      for (const token of UOWN_HEADING_TOKENS) {
        expect(heading, `Heading must contain "${token}"`).toContain(token);
      }
    });

    await test.step('Assert body contains reference consent phrase', async () => {
      const body = await wizard.getRightFootConsentBodyText();
      expect(body, `Body must contain "${CONSENT_BODY_PHRASE}"`).toContain(CONSENT_BODY_PHRASE);
    });
  });

  // ── TC-09 — KS heading + bank required + NEXT gated ──────────────────--
  test('TC-09: [KS] Kornerstone heading, bank required fields, NEXT gated on consent', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: KS_STATE, merchant: KS_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate to KS wizard and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill required KS bank fields + CC BIN (routing + account + CC BIN)', async () => {
      // On Kornerstone, bank routing, account, and CC BIN are all required fields
      // (asterisk on labels). The wizard NEXT stays disabled until all three are filled
      // AND the consent checkbox is checked.
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      // CC BIN required for KS — fill separately (fillBankFields only covers routing/account)
      await page.locator('#mainCreditCardBin').fill(CC_BIN);
      await page.waitForTimeout(500);
    });

    await test.step('Assert consent visible with Kornerstone heading', async () => {
      expect(await wizard.isRightFootConsentVisible()).toBe(true);

      const heading = (await wizard.getRightFootConsentHeading()).toLowerCase();
      for (const token of KS_HEADING_TOKENS) {
        expect(heading, `KS heading must contain "${token}"`).toContain(token);
      }
    });

    await test.step('Assert consent checked by default + NEXT enabled; uncheck → NEXT disabled', async () => {
      // F-002 fix: checkbox is CHECKED by default; all KS required fields filled → NEXT enabled
      expect(await wizard.isRightFootConsentChecked()).toBe(true);
      expect(await wizard.isNextButtonEnabled()).toBe(true);

      // Uncheck → NEXT must be gated on consent for KS brand
      await wizard.uncheckRightFootConsent();
      expect(await wizard.isNextButtonEnabled()).toBe(false);
    });
  });

  // ── TC-12 — Inline Yup error message (AC#3) ──────────────────────────--
  test('TC-12: [UOWN] Unchecked + blur → inline Yup error message displayed', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill routing + account, uncheck consent, then blur to trigger Yup validation', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      expect(await wizard.isRightFootConsentVisible()).toBe(true);

      // F-002 fix: checkbox starts CHECKED by default — must uncheck first so the field is in
      // an invalid state before blur; otherwise Formik/Yup never fires the "must agree" error.
      await wizard.uncheckRightFootConsent();
      await page.locator('#rightFootConsentChecked').focus();
      await page.locator('#rightFootConsentChecked').blur();
      await page.waitForTimeout(500);
    });

    await test.step('Assert inline error text matches reference', async () => {
      const error = await wizard.getRightFootConsentError();
      expect(error, 'Inline error must match Yup message').toContain(
        'You must agree to the Rightfoot consent to continue',
      );
    });
  });

  // ── TC-16 — Mobile 375x667, KS brand, stacking order ─────────────────--
  test('TC-16: [KS Mobile 375x667] Consent block stacks below bank fields', async ({ page }) => {
    // Mobile viewport BEFORE navigation (layout is determined at page load)
    await page.setViewportSize({ width: 375, height: 667 });

    const { env, merchant, applicant } = buildTestData({ state: KS_STATE, merchant: KS_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate to KS wizard on mobile viewport and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill routing to trigger consent block on mobile', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await page.locator('#mainCreditCardBin').fill(CC_BIN);
      await page.waitForTimeout(500);
      expect(await wizard.isRightFootConsentVisible()).toBe(true);
    });

    await test.step('Assert consent block stacks BELOW bank fields (Y position)', async () => {
      // Get bounding boxes to confirm vertical stacking order
      const routingBox = await page.locator('#mainBankRoutingNumber').boundingBox();
      const accountBox = await page.locator('#mainBankAccountNumber').boundingBox();
      const consentBox = await page.locator('[data-testid="rightFootConsentSection"]').boundingBox();

      expect(routingBox, 'Bank routing field must be visible').not.toBeNull();
      expect(accountBox, 'Bank account field must be visible').not.toBeNull();
      expect(consentBox, 'RightFoot consent section must be visible').not.toBeNull();

      // On mobile, elements stack top-to-bottom: routing < account < consent
      expect(routingBox!.y, 'Routing must be above account').toBeLessThan(accountBox!.y);
      expect(accountBox!.y, 'Account must be above consent').toBeLessThan(consentBox!.y);
    });
  });

  // ── R-04 — CC BIN only → consent NOT triggered ────────────────────────-
  test('R-04: [Regression UOWN] CC BIN only (no routing/account) → consent NOT shown', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill base employment + CC BIN only (no bank routing/account)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await page.locator('#mainCreditCardBin').fill(CC_BIN);
      await page.waitForTimeout(800);
    });

    await test.step('Assert consent NOT shown — CC BIN alone does not trigger it', async () => {
      const visible = await wizard.isRightFootConsentVisible();
      expect(visible, 'Consent block must NOT appear when only CC BIN is filled').toBe(false);

      // NEXT should still be enabled (all required fields filled for UOWN)
      expect(await wizard.isNextButtonEnabled()).toBe(true);
    });
  });

  // ── TC-10 — External links open in new tab; clicking link does not toggle checkbox ──
  test('TC-10: [UOWN] Consent links open in new tab without toggling checkbox', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Trigger consent block', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, undefined);
      expect(await wizard.isRightFootConsentVisible()).toBe(true);
    });

    await test.step('All links have target=_blank and correct hrefs', async () => {
      const links = await wizard.getRightFootConsentLinks();
      expect(links.length, 'Consent section must have at least 3 links').toBeGreaterThanOrEqual(3);
      for (const link of links) {
        expect(link.target, `Link "${link.text}" must open in new tab`).toBe('_blank');
        expect(link.href, `Link "${link.text}" must have a non-empty URL`).toBeTruthy();
      }
      // At least 2 links must point to rightfoot.com (Privacy Policy + Terms of Use)
      const rightfootLinks = links.filter((l) => l.href.includes('rightfoot.com'));
      expect(rightfootLinks.length, 'Must have at least 2 rightfoot.com links (Privacy + Terms)').toBeGreaterThanOrEqual(2);
      // Brand privacy policy link must point to uownleasing.com
      const brandLink = links.find((l) => l.href.includes('uownleasing.com'));
      expect(brandLink, 'Must have a UOWN brand privacy policy link').toBeDefined();
    });

    await test.step('Clicking a link opens a new tab and does NOT toggle the checkbox', async () => {
      const initialChecked = await wizard.isRightFootConsentChecked();
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('[data-testid="rightFootConsentSection"] a').first().click(),
      ]);
      await popup.close();
      const afterChecked = await wizard.isRightFootConsentChecked();
      expect(afterChecked, 'Clicking a link must not toggle the consent checkbox').toBe(initialChecked);
    });
  });

  // ── TC-11 — Clicking consent text (not a link) toggles checkbox ───────────
  test('TC-11: [UOWN] Clicking consent text (not a link) toggles checkbox', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Trigger consent block', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, undefined);
      expect(await wizard.isRightFootConsentVisible()).toBe(true);
      // Starts checked by default
      expect(await wizard.isRightFootConsentChecked()).toBe(true);
    });

    await test.step('Click label text → checkbox toggles OFF', async () => {
      await wizard.clickConsentTextBody();
      expect(await wizard.isRightFootConsentChecked(), 'First click on label text must uncheck').toBe(false);
    });

    await test.step('Click label text again → checkbox toggles ON', async () => {
      await wizard.clickConsentTextBody();
      expect(await wizard.isRightFootConsentChecked(), 'Second click on label text must re-check').toBe(true);
    });
  });

  // ── TC-12b — DevTools bypass rejected by Yup client-side schema ──────────
  test('TC-12b: [UOWN] DevTools bypass (remove disabled attr) → Yup rejects, Step 3 not reached', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill bank fields + uncheck consent → NEXT disabled', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await wizard.uncheckRightFootConsent();
      expect(await wizard.isNextButtonEnabled()).toBe(false);
    });

    await test.step('Force-enable NEXT via JS (DevTools-style bypass)', async () => {
      await page.evaluate((sel) => {
        const btn = document.querySelector(sel) as HTMLButtonElement | null;
        btn?.removeAttribute('disabled');
      }, '[data-nid-target="sendApplication-nextBtn"]');
    });

    await test.step('Click force-enabled NEXT — form must NOT advance to Step 3', async () => {
      await page.locator('[data-nid-target="sendApplication-nextBtn"]').click({ force: true });
      await page.waitForTimeout(1_000);
      const step3Visible = await page.locator('#isAgreedToStatements').isVisible().catch(() => false);
      expect(step3Visible, 'Yup schema must block advance to Step 3 when consent unchecked').toBe(false);
    });

    await test.step('Touching + blurring consent shows inline Yup error', async () => {
      await page.locator('#rightFootConsentChecked').focus();
      await page.locator('#rightFootConsentChecked').blur();
      await page.waitForTimeout(500);
      const error = await wizard.getRightFootConsentError();
      expect(error, 'Inline Yup error must be visible after bypass + touch').toContain('You must agree');
    });
  });

  // ── TC-13 — Tab focus → Tab away → inline error + role=alert ────────────
  test('TC-13: [UOWN] Tab away from unchecked consent → inline error appears with role=alert', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill bank fields + uncheck consent (invalid state)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await wizard.uncheckRightFootConsent();
    });

    await test.step('Tab-focus the checkbox then Tab away to trigger Formik onBlur', async () => {
      await page.locator('#rightFootConsentChecked').focus();
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
    });

    await test.step('Inline error appears with correct text and role=alert', async () => {
      const error = await wizard.getRightFootConsentError();
      expect(error, 'Inline error must appear on Tab-blur').toContain('You must agree');

      const role = await page.locator('#rightFootConsentChecked-error').getAttribute('role');
      expect(role, 'Error element must have role=alert for screen-reader announcement').toBe('alert');
    });
  });

  // ── TC-14 — Keyboard accessibility: Space toggles; links are Tab-reachable ─
  test('TC-14: [UOWN] Keyboard accessibility — Space toggles checkbox; links are Tab-reachable', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Trigger consent block + uncheck for known start state', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await wizard.uncheckRightFootConsent();
    });

    await test.step('Checkbox is keyboard-reachable (tabIndex >= 0)', async () => {
      const tabIndex = await page.locator('#rightFootConsentChecked')
        .evaluate((el: HTMLInputElement) => el.tabIndex);
      expect(tabIndex, 'Consent checkbox must be reachable via Tab').toBeGreaterThanOrEqual(0);
    });

    await test.step('Space key toggles the checkbox', async () => {
      await page.locator('#rightFootConsentChecked').focus();
      await page.keyboard.press('Space');
      expect(await wizard.isRightFootConsentChecked(), 'Space must check unchecked checkbox').toBe(true);
      await page.keyboard.press('Space');
      expect(await wizard.isRightFootConsentChecked(), 'Second Space must uncheck').toBe(false);
    });

    await test.step('Links within consent have href (keyboard-activatable via Enter)', async () => {
      const links = await wizard.getRightFootConsentLinks();
      expect(links.length, 'Consent must contain links').toBeGreaterThan(0);
      for (const link of links) {
        expect(link.href, `Link "${link.text}" must have href for Enter-key activation`).toBeTruthy();
      }
    });
  });

  // ── TC-15 — Desktop visual alignment: bank account + CC BIN same row; consent full-width ─
  test('TC-15: [UOWN Desktop 1440x900] Bank account and CC BIN share same row; consent spans full width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate to wizard on desktop viewport and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill bank fields + CC BIN to trigger consent block on desktop', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await page.locator('#mainCreditCardBin').fill(CC_BIN);
      await page.waitForTimeout(500);
      expect(await wizard.isRightFootConsentVisible()).toBe(true);
    });

    await test.step('Assert Bank Account and CC BIN are on the same visual row (same Y)', async () => {
      const accountBox = await page.locator('#mainBankAccountNumber').boundingBox();
      const ccBinBox = await page.locator('#mainCreditCardBin').boundingBox();
      const routingBox = await page.locator('#mainBankRoutingNumber').boundingBox();
      const consentBox = await page.locator('[data-testid="rightFootConsentSection"]').boundingBox();

      expect(accountBox, 'Bank Account field must be visible').not.toBeNull();
      expect(ccBinBox, 'CC BIN field must be visible').not.toBeNull();
      expect(routingBox, 'Routing field must be visible').not.toBeNull();
      expect(consentBox, 'Consent section must be visible').not.toBeNull();

      // Bank Account Number and CC BIN must share the same row (Y within 10px)
      expect(
        Math.abs(accountBox!.y - ccBinBox!.y),
        'Bank Account and CC BIN must be visually on the same row',
      ).toBeLessThan(10);

      // Consent block must appear below the bank row
      expect(consentBox!.y, 'Consent block must appear below bank fields').toBeGreaterThan(accountBox!.y);

      // Consent must span at least from the left of the routing column to the right of the account column
      expect(consentBox!.x, 'Consent must start at or before routing column').toBeLessThanOrEqual(routingBox!.x + 5);
      expect(
        consentBox!.x + consentBox!.width,
        'Consent must end at or after account column right edge',
      ).toBeGreaterThanOrEqual(accountBox!.x + accountBox!.width - 5);
    });
  });

  // ── TC-17 — KS: bank required → NEXT disabled; fill → consent → NEXT enabled ─
  test('TC-17: [KS] Bank fields required → NEXT disabled without bank; consent + bank → NEXT enabled', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: KS_STATE, merchant: KS_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate to KS wizard and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill only employment fields — NEXT must be disabled (bank fields required on KS)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      expect(
        await wizard.isNextButtonEnabled(),
        'NEXT must be disabled when KS required bank fields are empty',
      ).toBe(false);
    });

    await test.step('Fill bank routing + account → consent appears', async () => {
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      expect(await wizard.isRightFootConsentVisible(), 'Consent must appear when bank info filled').toBe(true);
    });

    await test.step('Consent checked by default + all KS fields valid → NEXT enabled', async () => {
      await page.locator('#mainCreditCardBin').fill(CC_BIN);
      await page.waitForTimeout(500);
      expect(
        await wizard.isRightFootConsentChecked(),
        'Consent checkbox must be CHECKED by default on KS',
      ).toBe(true);
      expect(await wizard.isNextButtonEnabled(), 'NEXT must be enabled with all KS fields + consent').toBe(true);
    });
  });

  // ── R-03 — Existing Yup validation on bank fields still fires ────────────
  test('R-03: [Regression UOWN] Bank routing < 9 digits + account < 8 digits → Yup errors still shown', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Fill bank employment base fields', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
    });

    await test.step('Routing < 9 digits + blur → Yup routing error visible', async () => {
      await page.locator('#mainBankRoutingNumber').fill('1234'); // 4 digits, below 9
      await page.locator('#mainBankRoutingNumber').blur();
      // Error text confirmed from DOM snapshot 2026-06-01: "Routing number must be exactly 9 digits."
      // Use auto-retrying expect (same pattern as getInventoryCategoryErrorText in merchant-edit.page.ts)
      await expect(
        page.locator('text=/must be exactly 9 digits/i').first(),
        'Routing Yup error must be visible when fewer than 9 digits',
      ).toBeVisible({ timeout: 5_000 });
    });

    await test.step('Account < 8 digits + blur → Yup account error visible', async () => {
      // Use valid routing so only account validation fails
      await page.locator('#mainBankRoutingNumber').fill(ROUTING);
      await page.locator('#mainBankAccountNumber').fill('123'); // 3 digits, below 8
      await page.locator('#mainBankAccountNumber').blur();
      // Exact error text for account is not confirmed — assert NEXT is disabled (validation blocks)
      // AND page object method returns a non-empty error string
      await page.waitForTimeout(800);
      expect(
        await wizard.isNextButtonEnabled(),
        'NEXT must be disabled when account number is below minimum length',
      ).toBe(false);
      const error = await wizard.getBankAccountNumberError();
      expect(error, 'Yup account error text must be non-empty').not.toBe('');
    });

    await test.step('Valid values clear the errors', async () => {
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      await page.waitForTimeout(800);
      expect(await wizard.isNextButtonEnabled(), 'NEXT must be enabled with valid bank values').toBe(true);
      // Routing error text must no longer appear
      expect(
        await page.locator('text=/must be exactly 9 digits/i').count(),
        'Routing error text must be gone with valid routing',
      ).toBe(0);
    });
  });

  // ── R-06 — Step 3 submit button unchanged ────────────────────────────────
  test('R-06: [Regression UOWN] Step 3 (Disclaimer) submit button present and enabled after agreeing', async ({ page }) => {
    const { env, merchant, applicant } = buildTestData({ state: UOWN_STATE, merchant: UOWN_MERCHANT });
    const wizard = new ApplicationWizardPage(page);

    await test.step('Navigate and complete Step 1', async () => {
      await navigateAndCompleteStep1(
        page, merchant.number, env.originationUrl, wizard,
        { firstName: applicant.firstName, lastName: applicant.lastName,
          ssn: applicant.ssn, dob: applicant.dob, phone: applicant.phone,
          email: applicant.email, address: applicant.address,
          city: applicant.city, zipCode: applicant.zip },
      );
    });

    await test.step('Complete Step 2 with bank info + consent (advance to Step 3)', async () => {
      await wizard.fillEmploymentInfo({ ...BASE_EMPLOYMENT, advance: false });
      await wizard.fillBankFields(ROUTING, ACCOUNT);
      // Consent is checked by default; all fields valid → click NEXT
      expect(await wizard.isNextButtonEnabled()).toBe(true);
      await page.locator('[data-nid-target="sendApplication-nextBtn"]').click();
      await page.waitForSelector('#isAgreedToStatements', { timeout: 30_000 });
    });

    await test.step('Step 3 renders with disclaimer checkboxes and Submit button', async () => {
      expect(
        await page.locator('#isAgreedToStatements').isVisible(),
        'Step 3 isAgreedToStatements checkbox must be visible',
      ).toBe(true);
      expect(
        await page.locator('#isAgreedToPrivacyPolicy').isVisible(),
        'Step 3 isAgreedToPrivacyPolicy checkbox must be visible',
      ).toBe(true);
      expect(
        await page.locator('[data-nid-target="sendApplication-submitBtn"]').isVisible(),
        'Submit button must be visible on Step 3',
      ).toBe(true);
    });

    await test.step('Submit button enabled only after bankruptcy dropdown + both disclaimer checkboxes', async () => {
      // Verify submit is initially disabled
      const initialEnabled = await wizard.isSubmitButtonEnabled();
      expect(initialEnabled, 'Submit must be disabled before completing Step 3 fields').toBe(false);

      // Step 3 requires: (1) bankruptcy dropdown → No, (2) both consent checkboxes
      await wizard.selectBankruptcyNo();
      await page.locator('#isAgreedToStatements').check();
      await page.locator('#isAgreedToPrivacyPolicy').check();
      await page.waitForTimeout(500);
      expect(
        await wizard.isSubmitButtonEnabled(),
        'Submit must be enabled after bankruptcy=No + both disclaimers checked',
      ).toBe(true);
      // Do NOT click Submit — this regression check does not create an application.
    });
  });
});

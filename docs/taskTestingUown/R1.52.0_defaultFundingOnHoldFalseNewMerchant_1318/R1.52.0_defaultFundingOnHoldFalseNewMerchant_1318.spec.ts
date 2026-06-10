/**
 * Task #1318 — Default Funding On Hold Flag to FALSE When Creating New Merchants
 *
 * Before fix: new merchants were created with hold_funding=true by default in Origination.
 * After fix: hold_funding defaults to false; users can override manually during creation.
 * Clone flow copies the source merchant's hold_funding value (intentional behavior).
 *
 * DOM investigation (qa1, 2026-06-02):
 *   input[name="holdFunding"] / id="checkbox-holdFunding"
 *   Section: Settings > Others
 *   Default state: checked=false (fix confirmed deployed)
 *
 * DB column: uown_merchant.hold_funding (boolean, DEFAULT false)
 *
 * AC coverage:
 *   AC1 — new merchant defaults to FALSE  (CT-001, CT-002)
 *   AC2 — existing merchants unchanged    (CT-004)
 *   AC3 — flow no longer defaults TRUE    (CT-001, CT-002)
 *   AC4 — manual override works           (CT-003, CT-005)
 *   AC5 — creation flow works normally    (CT-002, CT-003)
 *
 * Activity log: merchant creation does not generate uown_los_lead_notes (no lead_pk).
 *   uown_merchant_activity_log checked post-save — absence documented as gap, not failure.
 *
 * Merchant preflight: SKIP — test creates raw merchant records, no lease application involved.
 */

import { test, expect } from '@support/base-test.js';
import { MerchantEditPage } from '@pages/origination/merchant-edit.page.js';
import { generateRunId } from '@config/constants.js';
import { ConfigEnvironment } from '@config/index.js';
import { TestTag, buildTags } from '@ptypes/enums.js';

// ── Constants ─────────────────────────────────────────────────────────────

const TAG = `${buildTags(TestTag.REGRESSION, TestTag.QA1)} @origination @svc-1318`;

const ENV = 'qa1';

/** Merchant with hold_funding=true confirmed in qa1 DB (pk=3020). Used for CT-004 and CT-005. */
const FOH_TRUE_REF = '00000';

// Required react-select defaults that are already populated on a fresh form:
//   dealerRebateType=DAILY, integrationType=API, platFormFeeType=MONTHLY
//   allowedFrequencies=[WEEKLY, BI_WEEKLY], validStates=all states
// The following must be explicitly filled or picked:
const MERCHANT_STATE = 'CA';
const MERCHANT_ZIP = '90210';
const MERCHANT_CITY = 'Los Angeles';
const MERCHANT_ADDRESS = '123 QA Test St';
const PEAK_CAMPAIGN_ID = '100';
const CONTACT_PHONE = '3105550100';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Non-contact required fields. Filled first so react-select re-renders settle before contact fill. */
function formFields(runId: string) {
  return {
    refMerchantCode: `QA-FOH-${runId}`,
    merchantName: `QA FOH Test ${runId}`,
    locationName: `QA FOH Location ${runId}`,
    legalName: `QA FOH Legal ${runId}`,
    peakCampaignId: PEAK_CAMPAIGN_ID,
    offPeakCampaignId: PEAK_CAMPAIGN_ID,
    merchantAddress: MERCHANT_ADDRESS,
    merchantCity: MERCHANT_CITY,
    merchantState: MERCHANT_STATE,
    merchantZipCode: MERCHANT_ZIP,
    clientType: 'DIRECT',
  };
}

/** Contact fields filled last — after all react-select interactions — to avoid re-render clearing. */
function contactFields(runId: string, suffix = '') {
  return {
    contactName: `QA Agent ${runId}`,
    contactEmail: `qa-foh${suffix}-${runId}@test.uownleasing.com`,
    contactPhone: CONTACT_PHONE,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

test.describe('1318_defaultFundingOnHoldFalseNewMerchant', { tag: TAG.split(' ') }, () => {

  // ── CT-001: Default FALSE on empty form ───────────────────────────────────

  test('CT-001 — Funding on Hold defaults to FALSE on empty ADD NEW COMPANY form @smoke', async ({ page }) => {
    const env = new ConfigEnvironment(ENV);
    const merchantEdit = new MerchantEditPage(page);

    await test.step('Navigate to ADD NEW COMPANY', async () => {
      await merchantEdit.navigateToAddMerchant(env.originationUrl);
    });

    await test.step('Assert Funding on Hold checkbox is unchecked by default [AC1, AC3]', async () => {
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'Funding on Hold must default to false on a fresh form').toBe(false);
    });
  });

  // ── CT-002: Create merchant without touching flag → persists as FALSE ─────

  test('CT-002 — Creating merchant without changing flag persists hold_funding=false in DB [AC1, AC3, AC5]', async ({ page, db }) => {
    const env = new ConfigEnvironment(ENV);
    const merchantEdit = new MerchantEditPage(page);
    const runId = generateRunId();
    const fields = formFields(runId);
    const contact = contactFields(runId);
    const refCode = fields.refMerchantCode;

    await test.step('Navigate to ADD NEW COMPANY', async () => {
      await merchantEdit.navigateToAddMerchant(env.originationUrl);
    });

    await test.step('Fill non-contact fields + inventory category', async () => {
      await merchantEdit.fillMerchantForm(fields);
      await merchantEdit.selectInventoryCategory('OTHER');
    });

    await test.step('Fill contact fields directly (bypass PO waitForSpinner to avoid re-render race)', async () => {
      await page.locator("input[name='contactName']").fill(contact.contactName);
      await page.locator("input[name='contactEmail']").fill(contact.contactEmail);
      await page.locator("input[name='contactPhone']").fill(contact.contactPhone);
    });

    await test.step('Assert Funding on Hold still unchecked before save [AC1]', async () => {
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'Funding on Hold must remain false after form fill').toBe(false);
    });

    let toast = '';
    await test.step('Save merchant', async () => {
      toast = await merchantEdit.saveMerchant();
    });

    await test.step('Assert save success toast', async () => {
      expect(toast, 'Save should produce a success toast').toMatch(/success|saved|created/i);
    });

    await test.step('DB: hold_funding=false persisted [AC1]', async () => {
      const row = await db.queryOne<{ hold_funding: boolean }>(
        `SELECT hold_funding FROM uown_merchant WHERE ref_merchant_code = $1`,
        [refCode],
      );
      expect(row, 'Merchant row must exist in DB').not.toBeNull();
      expect(row!.hold_funding, 'hold_funding must be false when not set during creation').toBe(false);
    });

    await test.step('UI: re-open merchant and verify Funding on Hold still false [AC1]', async () => {
      await merchantEdit.navigateToMerchantEdit(env.originationUrl, refCode);
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'hold_funding must remain false after reopen').toBe(false);
    });

    await test.step('Activity log: check uown_merchant_activity_log for creation entry', async () => {
      const merchantRow = await db.queryOne<{ pk: number }>(
        `SELECT pk FROM uown_merchant WHERE ref_merchant_code = $1`,
        [refCode],
      );
      if (merchantRow) {
        const log = await db.queryOne(
          `SELECT pk, log_type, notes FROM uown_merchant_activity_log WHERE merchant_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [merchantRow.pk],
        );
        if (!log) {
          console.warn('[CT-002] uown_merchant_activity_log: no creation log — gap documented, not a failure');
        }
      }
    });
  });

  // ── CT-003: Manual override TRUE → persists as TRUE ───────────────────────

  test('CT-003 — Manually setting Funding on Hold to TRUE persists hold_funding=true in DB [AC4, AC5]', async ({ page, db }) => {
    const env = new ConfigEnvironment(ENV);
    const merchantEdit = new MerchantEditPage(page);
    const runId = generateRunId();
    const fields = {
      ...formFields(runId),
      refMerchantCode: `QA-FOH-T-${runId}`,
      merchantName: `QA FOH TRUE Test ${runId}`,
      locationName: `QA FOH TRUE Loc ${runId}`,
      legalName: `QA FOH TRUE Legal ${runId}`,
    };
    const contact = contactFields(runId, '-t');
    const refCode = fields.refMerchantCode;

    await test.step('Navigate to ADD NEW COMPANY', async () => {
      await merchantEdit.navigateToAddMerchant(env.originationUrl);
    });

    await test.step('Fill non-contact fields + inventory category', async () => {
      await merchantEdit.fillMerchantForm(fields);
      await merchantEdit.selectInventoryCategory('OTHER');
    });

    await test.step('Fill contact fields directly', async () => {
      await page.locator("input[name='contactName']").fill(contact.contactName);
      await page.locator("input[name='contactEmail']").fill(contact.contactEmail);
      await page.locator("input[name='contactPhone']").fill(contact.contactPhone);
    });

    await test.step('Manually set Funding on Hold to TRUE [AC4]', async () => {
      await merchantEdit.setFundingOnHold(true);
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'Checkbox must reflect TRUE after manual set').toBe(true);
    });

    let toast = '';
    await test.step('Save merchant', async () => {
      toast = await merchantEdit.saveMerchant();
    });

    await test.step('Assert save success toast [AC5]', async () => {
      expect(toast, 'Save should produce a success toast').toMatch(/success|saved|created/i);
    });

    await test.step('DB: hold_funding=true persisted [AC4]', async () => {
      const row = await db.queryOne<{ hold_funding: boolean }>(
        `SELECT hold_funding FROM uown_merchant WHERE ref_merchant_code = $1`,
        [refCode],
      );
      expect(row, 'Merchant row must exist in DB').not.toBeNull();
      expect(row!.hold_funding, 'hold_funding must be true when set manually during creation').toBe(true);
    });

    await test.step('UI: re-open merchant and verify Funding on Hold is TRUE [AC4]', async () => {
      await merchantEdit.navigateToMerchantEdit(env.originationUrl, refCode);
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'hold_funding must remain true after reopen').toBe(true);
    });
  });

  // ── CT-004: Existing merchant with hold_funding=true is unchanged ──────────

  test('CT-004 — Existing merchant with hold_funding=true is unchanged after fix [AC2]', async ({ page, db }) => {
    const env = new ConfigEnvironment(ENV);
    const merchantEdit = new MerchantEditPage(page);

    // Fixture confirmed in qa1 DB: pk=3020, ref='00000', "Sunshine Furniture DO NOT USE"
    await test.step('Verify fixture merchant still has hold_funding=true in DB [AC2]', async () => {
      const row = await db.queryOne<{ hold_funding: boolean }>(
        `SELECT hold_funding FROM uown_merchant WHERE ref_merchant_code = $1`,
        [FOH_TRUE_REF],
      );
      expect(row, `Fixture merchant '${FOH_TRUE_REF}' must exist in DB`).not.toBeNull();
      expect(row!.hold_funding, 'Existing merchant hold_funding must remain true (unchanged by fix)').toBe(true);
    });

    await test.step('Navigate to existing merchant edit page', async () => {
      await merchantEdit.navigateToMerchantEdit(env.originationUrl, FOH_TRUE_REF);
    });

    await test.step('Assert Funding on Hold shows TRUE in UI [AC2]', async () => {
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'Existing merchant with hold_funding=true must still show checked in UI').toBe(true);
    });
  });

  // ── CT-005: Clone inherits hold_funding value from source merchant ─────────

  test('CT-005 — Clone of merchant with hold_funding=true inherits the value (intentional) [AC4]', async ({ page }) => {
    const env = new ConfigEnvironment(ENV);
    const merchantEdit = new MerchantEditPage(page);

    await test.step('Navigate to ADD NEW COMPANY', async () => {
      await merchantEdit.navigateToAddMerchant(env.originationUrl);
    });

    await test.step('Clone from merchant with hold_funding=true (ref=00000)', async () => {
      await merchantEdit.openCloneDropdown();
      await merchantEdit.selectMerchantToClone('Sunshine');
    });

    await test.step('Assert Funding on Hold is TRUE — inherited from clone source [AC4]', async () => {
      const isChecked = await merchantEdit.getFundingOnHoldState();
      expect(isChecked, 'Clone should copy hold_funding=true from source merchant (intentional behavior)').toBe(true);
    });
  });

});

/**
 * S5 DISCOVERY (exploratory-testing-qa1-master) — Frequency Change + Scheduled Payment + Make Payment.
 *
 * UI-first (rule #18) / DOM-first (rule #15) observation of three Servicing features on qa1:
 *   A) Frequency Change  — Servicing Information edit panel on /customer-information/4452 (WEEKLY)
 *   B) Scheduled Payment — Servicing > Scheduled Payment (create future payment) for 3992
 *   C) Make Payment      — Make Payment modal on 3992 (CC ****4242 + bank, DPD 90)
 *
 * MCP browser was unstable this session (per S3 note); authorized fallback = headless discovery
 * spec exercising the REAL browser/DOM (rule #18 satisfied — real portal, real rendering).
 *
 * MUTATION POLICY:
 *   - (A) performs a REAL frequency change WEEKLY -> BI_WEEKLY via the product UI on test account
 *     4452 (Exception-3 authorized for the qa1 exploratory battery on test accounts, with DB
 *     registration), then RESTORES to WEEKLY. Verified via uown_frequency_mods + uown_sv_activity_log.
 *   - (B) and (C) are CAPTURE-ONLY (no submit). qa1 has a LIVE CC processor (gap-probe S0) — submitting
 *     a CC payment would be a real charge. Fields + validations are inspected via DOM, never submitted.
 *
 * Run: ENV=qa1 npx playwright test tests/e2e/servicing/_discovery-s5-frequency-scheduled-makepayment.spec.ts \
 *        --project=servicing-ui --reporter=list
 */
import { test, expect } from '@support/base-test.js';
import { ServicingAccountSummaryPage, ServicingCustomerPage, FrequencyChangesHistoryPage } from '@pages/servicing/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';

const FREQ_ACCOUNT = '4452'; // WEEKLY, test account, IMAP-owned
const PAY_ACCOUNT = '3992';  // BI_WEEKLY, CC ****4242 + bank, DPD 90

test.describe('S5 discovery — Frequency / Scheduled Payment / Make Payment (qa1)', () => {
  test.describe.configure({ mode: 'serial' });

  // ──────────────────────────────────────────────────────────────────────
  // A) FREQUENCY CHANGE — real change + verify + restore on 4452
  // ──────────────────────────────────────────────────────────────────────
  test('A) Frequency Change — change WEEKLY->BI_WEEKLY, verify DB + activity log, restore', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    test.skip(testEnv.env !== 'qa1', 'S5 discovery uses hardcoded qa1 accounts 4452/3992 — skip in other environments');
    const summary = new ServicingAccountSummaryPage(page);
    const customer = new ServicingCustomerPage(page);

    await test.step('Baseline frequency from DB', async () => {
      // CANONICAL servicing-side store is uown_sv_sched_summary (account_pk keyed).
      // The LOS-side uown_los_sched_summary (lead_pk keyed) is the origination-time
      // snapshot and is NOT updated by the Servicing Frequency Change feature — captured
      // for the cross-system sync observation below.
      const sv = await db.queryOne(
        `SELECT payment_frequency, frequency_changes FROM uown_sv_sched_summary WHERE account_pk = $1`, [FREQ_ACCOUNT]);
      const los = await db.queryOne(
        `SELECT ss.payment_frequency, ss.frequency_changes
         FROM uown_sv_account sa JOIN uown_los_sched_summary ss ON ss.lead_pk = sa.lead_pk
         WHERE sa.pk = $1`, [FREQ_ACCOUNT]);
      console.log(`[S5.A.BASELINE] SV=${JSON.stringify(sv)} LOS=${JSON.stringify(los)}`);
    });

    await test.step('Open /customer-information/4452', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, FREQ_ACCOUNT);
    });

    await test.step('Normalize baseline to WEEKLY if a prior run left it BI_WEEKLY (idempotent)', async () => {
      const cur = await db.queryOne(
        `SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1`, [FREQ_ACCOUNT]);
      if (cur?.payment_frequency !== 'WEEKLY') {
        console.log(`[S5.A.NORMALIZE] SV freq=${cur?.payment_frequency} -> resetting to Weekly`);
        await customer.changePaymentFrequencyViaUI('Weekly');
        await db.waitForRecord('uown_sv_sched_summary', "account_pk = $1 AND payment_frequency = 'WEEKLY'", [FREQ_ACCOUNT]);
        await summary.navigateToCustomerInformation(testEnv.servicingUrl, FREQ_ACCOUNT);
      }
      const sv = await db.queryOne(`SELECT payment_frequency FROM uown_sv_sched_summary WHERE account_pk = $1`, [FREQ_ACCOUNT]);
      expect(sv?.payment_frequency, 'baseline normalized to WEEKLY').toBe('WEEKLY');
    });

    await test.step('Inspect the frequency dropdown options (DOM capture)', async () => {
      // Open the Servicing Information edit panel and read what frequencies are offered.
      await page.locator(SELECTORS.svInfoEditButton).waitFor({ state: 'visible', timeout: 30_000 });
      await page.locator(SELECTORS.svInfoEditButton).click();
      await page.locator(`${SELECTORS.svInfoPayFrequencyDropdown} .filter__control`).waitFor({ state: 'visible', timeout: 5_000 });
      await page.locator(`${SELECTORS.svInfoPayFrequencyDropdown} .filter__control`).click();
      await page.locator(SELECTORS.filterOptionWithRole).first().waitFor({ state: 'visible', timeout: 5_000 });
      const options = await page.locator(SELECTORS.filterOptionWithRole).allTextContents();
      console.log(`[S5.A.OPTIONS] frequency dropdown options=${JSON.stringify(options.map(o => o.trim()))}`);
      // Close dropdown without selecting yet (Escape)
      await page.keyboard.press('Escape');
      await page.screenshot({ path: 'reports/s5-frequency-edit-4452.png', fullPage: true }).catch(() => {});
    });

    let changeResult: { firstDueDate: string; secondDueDate: string } | null = null;
    await test.step('Change frequency WEEKLY -> Bi-Weekly via product UI (cancel edit first if open)', async () => {
      // Cancel any open edit panel so changePaymentFrequencyViaUI re-opens cleanly.
      await page.keyboard.press('Escape').catch(() => {});
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, FREQ_ACCOUNT);
      changeResult = await customer.changePaymentFrequencyViaUI('Bi-Weekly');
      console.log(`[S5.A.CHANGE] result=${JSON.stringify(changeResult)}`);
    });

    await test.step('Verify SV store reflects BI_WEEKLY; capture LOS sync state', async () => {
      const ok = await db.waitForRecord(
        'uown_sv_sched_summary', "account_pk = $1 AND payment_frequency = 'BI_WEEKLY'", [FREQ_ACCOUNT]);
      const sv = await db.queryOne(
        `SELECT payment_frequency, frequency_changes, row_updated_timestamp FROM uown_sv_sched_summary WHERE account_pk = $1`, [FREQ_ACCOUNT]);
      const los = await db.queryOne(
        `SELECT ss.payment_frequency, ss.frequency_changes
         FROM uown_sv_account sa JOIN uown_los_sched_summary ss ON ss.lead_pk = sa.lead_pk
         WHERE sa.pk = $1`, [FREQ_ACCOUNT]);
      console.log(`[S5.A.VERIFY] waited=${ok} SV=${JSON.stringify(sv)} LOS=${JSON.stringify(los)}`);
      // OBSERVATION: LOS-side store is expected to remain WEEKLY (not synced) — logged, not failed.
      console.log(`[S5.A.SYNC-OBS] SV freq=${sv?.payment_frequency} vs LOS freq=${los?.payment_frequency} (synced=${sv?.payment_frequency === los?.payment_frequency})`);
      expect(sv?.payment_frequency).toBe('BI_WEEKLY');
    });

    await test.step('Verify uown_frequency_mods row written (WEEKLY -> BI_WEEKLY)', async () => {
      const mod = await db.queryOne(
        `SELECT pk, agent, old_frequency, new_frequency, old_term_payment, new_term_payment, first_due_date, second_due_date
         FROM uown_frequency_mods WHERE account_pk = $1 ORDER BY pk DESC LIMIT 1`, [FREQ_ACCOUNT]);
      console.log(`[S5.A.FREQMOD] latest=${JSON.stringify(mod)}`);
      expect(mod?.old_frequency).toBe('WEEKLY');
      expect(mod?.new_frequency).toBe('BI_WEEKLY');
    });

    await test.step('Activity log (rule #13) — capture sv_activity_log around the change', async () => {
      const rows = await db.query(
        `SELECT pk, log_type, notes, created_by, row_created_timestamp
         FROM uown_sv_activity_log WHERE account_pk = $1 ORDER BY pk DESC LIMIT 10`, [FREQ_ACCOUNT]);
      console.log(`[S5.A.LOG] last 10 sv_activity_log=${JSON.stringify(rows)}`);
    });

    await test.step('History -> Frequency Changes UI renders the change', async () => {
      const freqHist = new FrequencyChangesHistoryPage(page);
      await freqHist.navigateToFrequencyChanges();
      await freqHist.waitForTableLoad();
      const headers = await freqHist.verifyColumnHeaders().catch(() => []);
      const rowCount = await freqHist.getRowCount().catch(() => 0);
      console.log(`[S5.A.HISTORY] headers=${JSON.stringify(headers)} rowCount=${rowCount}`);
      if (rowCount > 0) {
        console.log(`[S5.A.HISTORY] row0=${JSON.stringify(await freqHist.getRowData(0).catch(() => ({})))}`);
      }
    });

    await test.step('RESTORE frequency Bi-Weekly -> Weekly', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, FREQ_ACCOUNT);
      const restore = await customer.changePaymentFrequencyViaUI('Weekly');
      console.log(`[S5.A.RESTORE] result=${JSON.stringify(restore)}`);
      await db.waitForRecord(
        'uown_sv_sched_summary', "account_pk = $1 AND payment_frequency = 'WEEKLY'", [FREQ_ACCOUNT]);
      const row = await db.queryOne(
        `SELECT payment_frequency, frequency_changes FROM uown_sv_sched_summary WHERE account_pk = $1`, [FREQ_ACCOUNT]);
      console.log(`[S5.A.RESTORE.VERIFY] ${JSON.stringify(row)}`);
      expect(row?.payment_frequency, '4452 SV store must be restored to WEEKLY').toBe('WEEKLY');
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // B) SCHEDULED PAYMENT — fields + validations, NO submit (live CC processor)
  // ──────────────────────────────────────────────────────────────────────
  test('B) Scheduled Payment — Servicing > Scheduled Payment form fields + validations (no submit)', async ({ page, testEnv }) => {
    test.setTimeout(180_000);
    test.skip(testEnv.env !== 'qa1', 'S5 discovery uses hardcoded qa1 accounts 4452/3992 — skip in other environments');
    const summary = new ServicingAccountSummaryPage(page);

    await test.step('Open customer-information/3992', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, PAY_ACCOUNT);
    });

    await test.step('Navigate Servicing > Scheduled Payment (capture availability)', async () => {
      // The "Scheduled Payment" menu item lives under the Servicing dropdown.
      const ok = await page.evaluate(() => {
        // Detect whether a "Scheduled Payment" menuitem/link exists at all.
        const items = Array.from(document.querySelectorAll('a, [role="menuitem"], button'));
        return items.some(i => /scheduled\s*payment/i.test((i.textContent || '')));
      });
      console.log(`[S5.B.NAV] 'Scheduled Payment' affordance present in DOM=${ok}`);
      try {
        await summary.topMenuNavigateTo('scheduled payments');
        console.log(`[S5.B.NAV] navigated, url=${page.url()}`);
      } catch (e) {
        console.log(`[S5.B.NAV] topMenuNavigateTo('scheduled payments') failed: ${String(e).slice(0, 200)}`);
      }
    });

    await test.step('Capture scheduled-payment form/page field inventory (DOM)', async () => {
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      const inventory = await page.evaluate(() => {
        const root = document.querySelector('.modal, [role="dialog"]') ?? document.body;
        const fields = Array.from(root.querySelectorAll('label, input, select, button, [role="radio"], [role="checkbox"], .filter__control'));
        return fields.map(f => ({
          tag: f.tagName.toLowerCase(),
          type: (f as HTMLInputElement).type || '',
          name: (f as HTMLInputElement).name || '',
          id: f.id || '',
          forAttr: f.getAttribute('for') || '',
          text: (f.textContent || '').trim().slice(0, 50),
          placeholder: (f as HTMLInputElement).placeholder || '',
          ariaLabel: f.getAttribute('aria-label') || '',
        })).filter(f => f.text || f.name || f.id || f.placeholder || f.ariaLabel);
      });
      console.log(`[S5.B.FIELDS] scheduled payment field inventory=${JSON.stringify(inventory)}`);
      const pageText = await page.evaluate(() => (document.body.textContent || '').slice(0, 2000));
      console.log(`[S5.B.TEXT] page text snippet=${JSON.stringify(pageText.replace(/\s+/g, ' ').slice(0, 600))}`);
      await page.screenshot({ path: 'reports/s5-scheduled-payment-3992.png', fullPage: true }).catch(() => {});
    });

    await test.step('Probe date validation hints (future date / 10-day window) without submit', async () => {
      const hints = await page.evaluate(() => {
        const text = (document.body.textContent || '');
        const matches = text.match(/(future|past|date[^.]{0,40}|days?[^.]{0,30}|required|invalid|\$[0-9,]+\.?[0-9]*)/gi) || [];
        return Array.from(new Set(matches.map(m => m.trim()))).slice(0, 40);
      });
      console.log(`[S5.B.VALIDATION] date/amount hints=${JSON.stringify(hints)}`);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // C) MAKE PAYMENT — modal fields + validations, NO submit (live CC processor)
  // ──────────────────────────────────────────────────────────────────────
  test('C) Make Payment modal — fields, one-time vs existing bank, validations (no submit)', async ({ page, testEnv }) => {
    test.setTimeout(180_000);
    test.skip(testEnv.env !== 'qa1', 'S5 discovery uses hardcoded qa1 accounts 4452/3992 — skip in other environments');
    const summary = new ServicingAccountSummaryPage(page);

    await test.step('Open customer-information/3992 (dismiss verify modal)', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, PAY_ACCOUNT);
    });

    await test.step('Open Make Payment modal; capture full field inventory', async () => {
      await page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
      await page.locator(SELECTORS.makePayment).click();
      await page.locator('.modal.show, [role="dialog"]').first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

      const inventory = await page.evaluate(() => {
        const modal = document.querySelector('.modal.show, .modal, [role="dialog"]') ?? document.body;
        const fields = Array.from(modal.querySelectorAll('label, input, select, button, [role="radio"], [role="checkbox"], .filter__control'));
        return fields.map(f => ({
          tag: f.tagName.toLowerCase(),
          type: (f as HTMLInputElement).type || '',
          name: (f as HTMLInputElement).name || '',
          id: f.id || '',
          forAttr: f.getAttribute('for') || '',
          text: (f.textContent || '').trim().slice(0, 50),
          placeholder: (f as HTMLInputElement).placeholder || '',
          ariaLabel: f.getAttribute('aria-label') || '',
          checked: (f as HTMLInputElement).checked ?? null,
        })).filter(f => f.text || f.name || f.id || f.placeholder || f.ariaLabel);
      });
      console.log(`[S5.C.FIELDS] Make Payment modal inventory=${JSON.stringify(inventory)}`);
      await page.screenshot({ path: 'reports/s5-make-payment-modal-3992.png', fullPage: true }).catch(() => {});
    });

    await test.step('Capture Payment Type options (ACH/CC/Check)', async () => {
      const ptDropdown = page.locator(SELECTORS.paymentTypeDropdown);
      if (await ptDropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await ptDropdown.click().catch(() => {});
        const options = await page.locator(SELECTORS.filterOptionWithRole).allTextContents().catch(() => []);
        console.log(`[S5.C.PAYTYPE] options=${JSON.stringify(options.map(o => o.trim()))}`);
        await page.keyboard.press('Escape').catch(() => {});
      } else {
        console.log('[S5.C.PAYTYPE] payment type dropdown not visible');
      }
    });

    await test.step('Capture Allocation Type options', async () => {
      const allocDropdown = page.locator(SELECTORS.allocationStrategyDropdown);
      if (await allocDropdown.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await allocDropdown.click().catch(() => {});
        const options = await page.locator(SELECTORS.filterOptionWithRole).allTextContents().catch(() => []);
        console.log(`[S5.C.ALLOC] options=${JSON.stringify(options.map(o => o.trim()))}`);
        await page.keyboard.press('Escape').catch(() => {});
      } else {
        console.log('[S5.C.ALLOC] allocation dropdown not visible');
      }
    });

    await test.step('Detect one-time vs existing-bank distinction', async () => {
      const banks = await page.evaluate(() => {
        const modal = document.querySelector('.modal.show, .modal, [role="dialog"]') ?? document.body;
        const radios = Array.from(modal.querySelectorAll('input[type="radio"], [role="radio"], label'))
          .map(r => (r.textContent || '').trim())
          .filter(t => /one[-\s]?time|existing|new\s*bank|saved/i.test(t));
        const existingSelect = modal.querySelector('select[name="bankAccountPk"]');
        return { radioTexts: Array.from(new Set(radios)).slice(0, 10), hasExistingBankSelect: !!existingSelect };
      });
      console.log(`[S5.C.BANK] one-time vs existing=${JSON.stringify(banks)}`);
    });

    await test.step('Capture money/validation hints rendered in modal (no submit)', async () => {
      const hints = await page.evaluate(() => {
        const modal = document.querySelector('.modal.show, .modal, [role="dialog"]') ?? document.body;
        const text = (modal.textContent || '');
        const matches = text.match(/(past\s*due|total[^.]{0,30}|max[^.]{0,20}|required|invalid|\$[0-9,]+\.?[0-9]*)/gi) || [];
        return Array.from(new Set(matches.map(m => m.trim()))).slice(0, 40);
      });
      console.log(`[S5.C.VALIDATION] modal money/validation hints=${JSON.stringify(hints)}`);
    });
  });
});

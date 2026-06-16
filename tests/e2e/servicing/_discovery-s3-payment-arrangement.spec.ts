/**
 * S3 DISCOVERY (exploratory-testing-qa1-master) — Payment Arrangement lifecycle.
 *
 * UI-first (rule #18) observation of the Payment Arrangement feature on qa1 Servicing,
 * account 4452 (3 pre-existing arrangements: pk271 NOT_STARTED, pk34/pk31 SUCCESS).
 *
 * Read-mostly: NO fresh arrangement is created here (4452 already exposes NOT_STARTED +
 * SUCCESS states for observation — test-data-hierarchy: reuse justified, no new data needed
 * to cover the requested states). The Make Payment modal is opened and its arrangement form
 * + validations are inspected WITHOUT submitting (no data mutation).
 *
 * Covers S3 objectives:
 *   1. Visualization — /payment-arrangement/4452 table columns, rows, expand-row sub-table
 *   2. Edit/Cancel affordance check (O-NEW-001 confirmation)
 *   3. Make Payment modal arrangement form fields + business validations (DOM capture only)
 *   4. dev3 comparison via captured DOM
 *
 * Run: ENV=qa1 npx playwright test tests/e2e/servicing/_discovery-s3-payment-arrangement.spec.ts \
 *        --project=servicing-ui --reporter=list
 */
import { test, expect } from '@support/base-test.js';
import { ServicingAccountSummaryPage, PaymentArrangementPage } from '@pages/servicing/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';

const ACCOUNT_PK = '4452';

test.describe('S3 discovery — Payment Arrangement lifecycle (qa1, account 4452)', () => {
  test.describe.configure({ mode: 'serial' });

  test('Visualization: /payment-arrangement display page — columns, rows, expand sub-table, Edit/Cancel affordance', async ({ page, testEnv }) => {
    test.setTimeout(180_000);
    test.skip(testEnv.env !== 'qa1', 'S3 discovery uses hardcoded qa1 account 4452 — skip in other environments');
    const paPage = new PaymentArrangementPage(page);

    await test.step('Navigate to /payment-arrangement/4452 (auth via storageState)', async () => {
      await paPage.navigateDirectly(testEnv.servicingUrl, ACCOUNT_PK);
    });

    await test.step('Capture main table columns', async () => {
      const headers = await paPage.getNormalizedHeaders();
      console.log(`[S3.VIEW] columns=${JSON.stringify(headers)}`);
      expect(headers.length, 'expected arrangement table columns').toBeGreaterThan(0);
    });

    await test.step('Capture all arrangement rows', async () => {
      const count = await paPage.getRowCount();
      console.log(`[S3.VIEW] row count=${count}`);
      for (let i = 0; i < count; i++) {
        const data = await paPage.getRowData(i);
        console.log(`[S3.VIEW] row[${i}]=${JSON.stringify(data)}`);
      }
      expect(count, 'expected 3 pre-existing arrangements on 4452').toBeGreaterThanOrEqual(1);
    });

    await test.step('Edit/Cancel affordance check (O-NEW-001) — scan whole table region for action buttons', async () => {
      // Capture EVERY button/link rendered in the arrangement table region + per-row,
      // to definitively confirm whether Edit/Cancel exist.
      const actionInventory = await page.evaluate(() => {
        const table = document.querySelector('.rdt_Table, [role="table"]');
        const root = table?.closest('div') ?? document.body;
        const controls = Array.from(root.querySelectorAll('button, a[role="button"], a'));
        return controls.map(c => ({
          tag: c.tagName.toLowerCase(),
          text: (c.textContent || '').trim().slice(0, 40),
          aria: c.getAttribute('aria-label') || '',
          title: c.getAttribute('title') || '',
          testid: c.getAttribute('data-testid') || '',
        })).filter(c => c.text || c.aria || c.title);
      });
      console.log(`[S3.EDIT] action inventory in table region: ${JSON.stringify(actionInventory)}`);
      const hasEdit = actionInventory.some(c => /edit/i.test(c.text + c.aria + c.title));
      const hasCancel = actionInventory.some(c => /cancel/i.test(c.text + c.aria + c.title));
      console.log(`[S3.EDIT] hasEdit=${hasEdit} hasCancel=${hasCancel}`);
    });

    await test.step('Expand NOT_STARTED arrangement pk271 and capture sub-table (receivables/payments)', async () => {
      const idx = await paPage.findRowByPk('271');
      console.log(`[S3.EXPAND] pk271 rowIndex=${idx}`);
      if (idx >= 0) {
        await paPage.expandRow(idx);
        const sections = await paPage.getExpandedSectionHeaders();
        console.log(`[S3.EXPAND] pk271 expanded section headers=${JSON.stringify(sections)}`);
        const ccData = await paPage.getCcPaymentsData();
        const achData = await paPage.getAchPaymentsData();
        console.log(`[S3.EXPAND] pk271 CC sub-rows=${ccData.length} ${JSON.stringify(ccData.slice(0, 3))}`);
        console.log(`[S3.EXPAND] pk271 ACH sub-rows=${achData.length} ${JSON.stringify(achData.slice(0, 3))}`);
        const subTableCount = await paPage.getSubTableCount();
        console.log(`[S3.EXPAND] pk271 sub-table count=${subTableCount}`);
        await paPage.collapseRow(idx).catch(() => {});
      }
    });

    await test.step('Expand SUCCESS arrangement pk34 (SETTLEMENT) and capture sub-table', async () => {
      const idx = await paPage.findRowByPk('34');
      console.log(`[S3.EXPAND] pk34 rowIndex=${idx}`);
      if (idx >= 0) {
        await paPage.expandRow(idx);
        const sections = await paPage.getExpandedSectionHeaders();
        console.log(`[S3.EXPAND] pk34 expanded section headers=${JSON.stringify(sections)}`);
        const ccData = await paPage.getCcPaymentsData();
        console.log(`[S3.EXPAND] pk34 CC sub-rows=${ccData.length} ${JSON.stringify(ccData.slice(0, 5))}`);
        await paPage.collapseRow(idx).catch(() => {});
      }
    });

    await test.step('Screenshot the display page', async () => {
      await page.screenshot({ path: 'reports/s3-payment-arrangement-view-4452.png', fullPage: true }).catch(() => {});
    });
  });

  test('Make Payment modal: arrangement form fields + business validations (DOM capture, no submit)', async ({ page, testEnv }) => {
    test.setTimeout(180_000);
    const summary = new ServicingAccountSummaryPage(page);

    await test.step('Open customer-information/4452 (dismiss verify modal)', async () => {
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACCOUNT_PK);
    });

    await test.step('Open Make Payment modal + enable Payment Arrangement; capture form fields', async () => {
      // DOM-confirmed selector (rule #15): the Make Payment trigger is id="#makePayment"
      // (NOT a role=button with accessible name "Make Payment"). Dismiss any lingering
      // Bootstrap backdrop first, same pattern as the page object's clickMakePayment().
      await page.locator(SELECTORS.modalBackdrop).waitFor({ state: 'hidden', timeout: 3_000 }).catch(() => {});
      await page.locator(SELECTORS.makePayment).click();
      // Modal renders; enable arrangement checkbox
      const arrangementCheckbox = page.locator(SELECTORS.paymentArrangementCheckbox);
      await arrangementCheckbox.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
      if (!await arrangementCheckbox.isChecked({ timeout: 3_000 }).catch(() => false)) {
        await arrangementCheckbox.click().catch(() => {});
      }

      // Capture the full modal field inventory (labels, inputs, selects, radios, buttons).
      const modalInventory = await page.evaluate(() => {
        const modal = document.querySelector('.modal, [role="dialog"]') ?? document.body;
        const fields = Array.from(modal.querySelectorAll('label, input, select, button, [role="radio"], [role="checkbox"]'));
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
      console.log(`[S3.MODAL] arrangement form inventory: ${JSON.stringify(modalInventory)}`);
      await page.screenshot({ path: 'reports/s3-arrangement-modal-4452.png', fullPage: true }).catch(() => {});
    });

    await test.step('Probe validation: past-due / down-payment hint text rendered in modal', async () => {
      // Capture any hint / max / past-due text the modal exposes near the amount fields.
      const hints = await page.evaluate(() => {
        const modal = document.querySelector('.modal, [role="dialog"]') ?? document.body;
        const text = (modal.textContent || '');
        // Extract dollar-amount mentions + key labels
        const matches = text.match(/(past\s*due|down\s*payment|total[^.]{0,30}|\$[0-9,]+\.?[0-9]*)/gi) || [];
        return Array.from(new Set(matches)).slice(0, 40);
      });
      console.log(`[S3.VALIDATION] modal money/label hints: ${JSON.stringify(hints)}`);
    });
  });
});

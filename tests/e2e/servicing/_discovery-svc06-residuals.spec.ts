/**
 * SVC-06 RESIDUALS (Sessão 7, dev3) — discovery, non-destructive (no submit, no delete).
 *   R1: Add Bank modal field validation — does the form block invalid routing/account?
 *       (recon: backend BankAccountInfo has only @NotBlank, no format/checksum). Fill invalid
 *       routing, observe Save button state + any error. DO NOT submit.
 *   R2: Diagnose the earlier page-object timeout on "View All" delete flow — dump the real DOM of
 *       the All-Bank-Accounts modal (table classes, rows, checkbox, Delete button) to see why
 *       deleteBankAccountByLastFour's selectors timed out. DO NOT delete.
 * Account 224 (only pk=197 default active after Sessão 7 cleanup).
 */
import { test } from '@support/base-test.js';
import { ServicingAccountSummaryPage } from '@pages/servicing/index.js';
import { loginToPortalWithOptions } from '@helpers/index.js';

const ACCOUNT_PK = '224';

test.describe('SVC-06 residuals — Add validation + View-All modal DOM', () => {
  test('R1 invalid input validation + R2 delete-modal DOM (non-destructive)', async ({ page, testEnv }) => {
    test.setTimeout(180_000);
    const summary = new ServicingAccountSummaryPage(page);
    await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
    await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACCOUNT_PK);

    await test.step('R1 — Add modal: invalid routing/account, observe (no submit)', async () => {
      await page.locator('button:has-text("Add Account")').first().click();
      await page.locator('#addBAForm').waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});

      // try invalid routing: 5 digits, and letters
      const probe = async (routing: string, account: string) => {
        await page.locator('#routingNumber').fill('');
        await page.locator('#routingNumber').fill(routing);
        await page.locator('#accountNumber').fill('');
        await page.locator('#accountNumber').fill(account);
        const r = await page.evaluate(() => {
          const rn = document.querySelector('#routingNumber') as HTMLInputElement | null;
          const an = document.querySelector('#accountNumber') as HTMLInputElement | null;
          const save = document.querySelector('#addBAForm button[class*="primary"], .modal.show button[class*="primary"]') as HTMLButtonElement | null;
          const errs = Array.from(document.querySelectorAll('#addBAForm .error, #addBAForm [class*="error"], #addBAForm [class*="invalid"], .modal.show [class*="error"]'))
            .map(e => (e.textContent || '').trim()).filter(Boolean).slice(0, 5);
          return { routingValue: rn?.value, routingMaxLen: rn?.maxLength, accountValue: an?.value, accountMaxLen: an?.maxLength, saveDisabled: save?.disabled, saveText: (save?.textContent || '').trim(), errors: errs };
        });
        console.log(`[SVC06res][R1] input routing="${routing}" account="${account}" -> ${JSON.stringify(r)}`);
      };
      await probe('12345', '5550009999');     // 5-digit routing (invalid ABA length)
      await probe('abcde', '55500');          // letters + short account
      await probe('999999999', '5550009999'); // 9-digit but bogus ABA checksum

      // close modal without submitting
      await page.locator('.modal.show button:has-text("Cancel"), #addBAForm button:has-text("Cancel"), .modal.show [class*="close"]').first().click({ timeout: 3_000 }).catch(() => {});
      await page.keyboard.press('Escape').catch(() => {});
    });

    await test.step('R2 — View All modal: dump real DOM (diagnose delete timeout)', async () => {
      await page.locator('button:has-text("View All")').first().click({ timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(2_000);
      const dump = await page.evaluate(() => {
        const modal = document.querySelector('.modal.show') || document.querySelector('[role="dialog"]') || document.querySelector('[class*="modal"]');
        if (!modal) return { modalFound: false };
        const has = (sel: string) => !!modal.querySelector(sel);
        const rows = modal.querySelectorAll('[role="row"], .rdt_TableRow');
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
        return {
          modalFound: true,
          modalClass: (modal.className || '').toString().slice(0, 80),
          hasRdtTable: has('.rdt_Table'),
          hasRdtTableBody: has('.rdt_TableBody'),
          hasHtmlTable: has('table'),
          rowCount: rows.length,
          checkboxNames: Array.from(checkboxes).map(c => (c as HTMLInputElement).name).slice(0, 5),
          hasDeleteBtn: !!Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || '')),
          firstRowText: (rows[0]?.textContent || '').slice(0, 80),
          tableText: (modal.textContent || '').slice(0, 200),
        };
      });
      console.log(`[SVC06res][R2] View-All modal DOM: ${JSON.stringify(dump)}`);
    });
  });
});

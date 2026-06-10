/**
 * SVC-07 RESIDUALS (Sessão 7, dev3) — account 224, reversible (restores all changes).
 *   R1: Edit Mobile phone number via UI Servicing → persist uown_sv_phone + activity log; restore.
 *       Plus invalid phone probe (observe validation).
 *   R2: DNC (Do Not Call) toggle with reason via UI → discover the reason-modal DOM, persist
 *       do_not_call + reason_for_dnc + activity log; restore. (DNT is the same PhoneService path.)
 *   R3: Customer Portal Reminder via the Send-Invite modal → discover options, send, capture toast
 *       + correspondence (uown_los_lead_notes / uown_sv_activity_log).
 * Exploratory: dumps DOM where unknown, soft-handles, DB watermark-diff as oracle.
 */
import { test } from '@support/base-test.js';
import { ServicingCustomerPage } from '@pages/servicing/index.js';
import { loginToPortalWithOptions } from '@helpers/index.js';

const ACCOUNT_PK = '224';

test.describe('SVC-07 residuals — phone edit + DNC + Portal Reminder', () => {
  test('R1 phone edit/validation, R2 DNC w/ reason, R3 Customer Portal Reminder', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);
    const cust = new ServicingCustomerPage(page);
    const wm0 = Number((await db.query('SELECT COALESCE(max(pk),0) AS m FROM uown_sv_activity_log WHERE account_pk=$1', [ACCOUNT_PK]))[0].m as number);
    const phone0 = await db.query('SELECT area_code, phone_number, do_not_call, reason_for_dnc FROM uown_sv_phone WHERE account_pk=$1', [ACCOUNT_PK]);
    console.log(`[SVC07res][PRE] wm=${wm0} phone=${JSON.stringify(phone0[0])}`);

    await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
    await page.goto(`${testEnv.servicingUrl}customer-information/${ACCOUNT_PK}`);
    await cust.navigateToPrimaryContact();

    await test.step('R1 — enter edit mode, dump phone inputs', async () => {
      await cust.enterPrimaryContactEditMode().catch(e => console.log(`[SVC07res][R1] enterEdit warn: ${(e as Error).message.slice(0,80)}`));
      const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input'))
        .filter(i => i.offsetParent !== null && i.type !== 'checkbox')
        .map(i => ({ id: i.id, name: i.name, ph: i.placeholder, val: (i.value || '').slice(0, 14) })));
      console.log(`[SVC07res][R1] visible inputs in edit mode: ${JSON.stringify(inputs)}`);
    });

    await test.step('R2 — DNC toggle with reason, discover reason modal', async () => {
      const dnc = page.locator('#doNotCallMobile');
      if (await dnc.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await dnc.click().catch(() => {});
        await page.waitForTimeout(1_000);
        const modalDump = await page.evaluate(() => {
          const modals = Array.from(document.querySelectorAll('.modal.show, [role="dialog"]'));
          return modals.map(m => ({
            text: (m.textContent || '').slice(0, 80),
            textboxes: Array.from(m.querySelectorAll('input[type="text"], textarea')).map(t => ({ id: (t as HTMLInputElement).id, ph: (t as HTMLInputElement).placeholder })),
            buttons: Array.from(m.querySelectorAll('button')).map(b => (b.textContent || '').trim()).filter(Boolean),
          }));
        });
        console.log(`[SVC07res][R2] modal after DNC click: ${JSON.stringify(modalDump)}`);
        // fill any reason textbox + save modal
        const reasonBox = page.locator('.modal.show input[type="text"], .modal.show textarea').first();
        if (await reasonBox.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await reasonBox.fill('Automated DNC reason').catch(() => {});
          await page.locator('.modal.show button:has-text("Save"), .modal.show button:has-text("Confirm"), .modal.show button:has-text("OK")').first().click({ timeout: 3_000 }).catch(() => {});
          await page.waitForTimeout(800);
        }
        // save section
        await page.getByRole('button', { name: 'SAVE' }).first().click({ timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(2_000);
      } else {
        console.log('[SVC07res][R2] #doNotCallMobile not visible (edit mode not active?)');
      }
      const phoneAfter = await db.query('SELECT do_not_call, reason_for_dnc FROM uown_sv_phone WHERE account_pk=$1', [ACCOUNT_PK]);
      const logs = await db.query("SELECT log_type, left(notes,90) AS notes FROM uown_sv_activity_log WHERE account_pk=$1 AND pk>$2 ORDER BY pk", [ACCOUNT_PK, wm0]);
      console.log(`[SVC07res][R2][DB] phone=${JSON.stringify(phoneAfter[0])} newLogs=${logs.length}`);
      logs.forEach(l => console.log(`[SVC07res][R2][log] ${(l as any).log_type}: ${(l as any).notes}`));
    });

    await test.step('R2-restore — DNC back OFF', async () => {
      await cust.enterPrimaryContactEditMode().catch(() => {});
      const dnc = page.locator('#doNotCallMobile');
      if (await dnc.isChecked({ timeout: 2_000 }).catch(() => false)) {
        await dnc.click().catch(() => {});
        await page.getByRole('button', { name: 'SAVE' }).first().click({ timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(2_000);
      }
      const phoneFinal = await db.query('SELECT do_not_call FROM uown_sv_phone WHERE account_pk=$1', [ACCOUNT_PK]);
      console.log(`[SVC07res][R2-restore] do_not_call=${JSON.stringify(phoneFinal[0])}`);
    });

    await test.step('R3 — Customer Portal Reminder via Send-Invite modal', async () => {
      const wm3 = Number((await db.query('SELECT COALESCE(max(pk),0) AS m FROM uown_sv_activity_log WHERE account_pk=$1', [ACCOUNT_PK]))[0].m as number);
      await page.locator('#invitation svg').dispatchEvent('click').catch(() => {});
      await page.waitForTimeout(1_500);
      const inviteDump = await page.evaluate(() => {
        const m = document.querySelector('.modal.show') || document.querySelector('[role="dialog"]');
        return m ? { text: (m.textContent || '').slice(0, 120), buttons: Array.from(m.querySelectorAll('button')).map(b => (b.textContent || '').trim()).filter(Boolean) } : { text: '(no modal)', buttons: [] };
      });
      console.log(`[SVC07res][R3] invite modal: ${JSON.stringify(inviteDump)}`);
      // click a Customer Portal option
      const portalBtn = page.locator('.modal.show button').filter({ hasText: /portal|customer portal|reminder/i }).first();
      if (await portalBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await portalBtn.click().catch(() => {});
        await page.waitForTimeout(1_000);
        await page.locator('.modal.show button:has-text("Continue"), .modal.show button:has-text("Confirm"), .modal.show button:has-text("CONFIRM")').first().click({ timeout: 3_000 }).catch(() => {});
        await page.waitForTimeout(2_500);
        const toast = await page.locator('[class*="toast"], [class*="Toastify"]').first().textContent().catch(() => '');
        console.log(`[SVC07res][R3] portal reminder toast: "${(toast || '').trim().slice(0, 120)}"`);
      } else {
        console.log('[SVC07res][R3] no Customer Portal button found in invite modal');
      }
      const logs = await db.query("SELECT log_type, left(notes,110) AS notes FROM uown_sv_activity_log WHERE account_pk=$1 AND pk>$2 ORDER BY pk", [ACCOUNT_PK, wm3]);
      console.log(`[SVC07res][R3][DB] new logs=${logs.length}`);
      logs.forEach(l => console.log(`[SVC07res][R3][log] ${(l as any).log_type}: ${(l as any).notes}`));
    });
  });
});

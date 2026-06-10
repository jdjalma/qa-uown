/**
 * SVC-06 DISCOVERY (Sessão 7, dev3) — Banking CRUD: add → soft-delete + activity-log + security oracle.
 *
 * Reversible (hybrid plan): adds a NON-DEFAULT 2nd bank (distinct routing+account → no UPSERT
 * collision, no flip of the existing default pk=197) then soft-deletes it → account 224 returns to
 * its prior state. Confirms LIVE in dev3 (rule #15 UI-first + rule #18 DB oracle):
 *   - ADD bank → activity log row? Recon (code grep) said createActivityLog for ADD is COMMENTED;
 *     earlier live observation on 224 showed a DATA_CHANGE "ADDED : BankAccount[...]" → re-confirm
 *     on a fresh add (account# last-4 masked, routing full).
 *   - SOFT DELETE → uown_sv_bank_account.is_deleted=true (row persists), gone from active set,
 *     and BANK_ACCOUNT log "Deleted Bank Account With Routing Number: <ROUTING>" — recon flagged
 *     the routing is logged in PLAINTEXT (P0-security observation). Capture it live.
 *
 * Conservative (rule #10): logged with watermark-diffed evidence; security note documents routing
 * (public, identifies bank) vs account-number (private, NOT logged on delete) distinction.
 */
import { test, expect } from '@support/base-test.js';
import { BankAccountPage, ServicingAccountSummaryPage } from '@pages/servicing/index.js';
import { loginToPortalWithOptions } from '@helpers/index.js';

const ACCOUNT_PK = '224';
const NEW_ROUTING = '121000248';   // valid Wells Fargo ABA, distinct from existing 021000021
const NEW_ACCOUNT = '5550001234';  // last-4 = 1234, distinct → no UPSERT collision

test.describe('SVC-06 discovery — banking CRUD oracles', () => {
  test('Add non-default bank → soft-delete; capture activity-log + plaintext-routing security oracle', async ({ page, testEnv, db }) => {
    test.setTimeout(240_000);

    const wm = Number((await db.query(
      'SELECT COALESCE(max(pk),0) AS m FROM uown_sv_activity_log WHERE account_pk = $1', [ACCOUNT_PK],
    ))[0].m as number);
    const pre = await db.query(
      'SELECT pk, right(account_number,4) AS last4, routing_number, auto_pay, is_deleted FROM uown_sv_bank_account WHERE account_pk = $1 ORDER BY pk', [ACCOUNT_PK],
    );
    const preTypes = await db.query('SELECT auto_pay_types FROM uown_sv_account WHERE pk = $1', [ACCOUNT_PK]);
    console.log(`[SVC06][PRE] wm=${wm} banks=${JSON.stringify(pre)} autopay_types=${JSON.stringify(preTypes[0])}`);

    const summary = new ServicingAccountSummaryPage(page);
    const bank = new BankAccountPage(page);

    await test.step('Login + open customer-information (dismiss verify modal)', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await summary.navigateToCustomerInformation(testEnv.servicingUrl, ACCOUNT_PK);
    });

    await test.step('ADD non-default 2nd bank via UI', async () => {
      await bank.openAddBankAccountModal();
      await bank.addBankAccount({
        routingNumber: NEW_ROUTING, accountNumber: NEW_ACCOUNT, accountType: 'CHECKING', setAsDefault: false,
      });
      const row = await db.query(
        'SELECT pk, right(account_number,4) AS last4, routing_number, auto_pay, is_deleted FROM uown_sv_bank_account WHERE account_pk = $1 AND routing_number = $2 ORDER BY pk DESC LIMIT 1', [ACCOUNT_PK, NEW_ROUTING],
      );
      console.log(`[SVC06][ADD] new bank row: ${JSON.stringify(row[0])}`);
      expect(row.length, 'new bank account row should exist').toBeGreaterThan(0);

      const addLogs = await db.query(
        "SELECT pk, log_type, left(notes,110) AS notes FROM uown_sv_activity_log WHERE account_pk = $1 AND pk > $2 ORDER BY pk", [ACCOUNT_PK, wm],
      );
      console.log(`[SVC06][ADD] new activity logs: ${addLogs.length}`);
      addLogs.forEach(l => console.log(`[SVC06][ADD][log] type=${(l as any).log_type} notes=${(l as any).notes}`));
      const addLog = addLogs.find(l => /ADDED : BankAccount/i.test(String((l as any).notes)));
      console.log(`[SVC06][ADD][VERDICT] ADD activity log present? ${addLog ? 'YES: ' + (addLog as any).notes : 'NO — audit gap candidate'}`);
    });

    let wm2 = wm;
    await test.step('SOFT-DELETE the added bank via UI', async () => {
      wm2 = Number((await db.query('SELECT COALESCE(max(pk),0) AS m FROM uown_sv_activity_log WHERE account_pk = $1', [ACCOUNT_PK]))[0].m as number);
      await bank.openAllBankAccountsModal();
      await bank.deleteBankAccountByLastFour('1234');

      const row = await db.query(
        'SELECT pk, is_deleted, auto_pay FROM uown_sv_bank_account WHERE account_pk = $1 AND routing_number = $2 ORDER BY pk DESC LIMIT 1', [ACCOUNT_PK, NEW_ROUTING],
      );
      console.log(`[SVC06][DEL] row after delete (should persist, is_deleted=true): ${JSON.stringify(row[0])}`);
      expect(String((row[0] as any).is_deleted), 'soft-delete: is_deleted=true (row persists in DB)').toBe('true');

      const delLogs = await db.query(
        "SELECT pk, log_type, left(notes,140) AS notes FROM uown_sv_activity_log WHERE account_pk = $1 AND pk > $2 ORDER BY pk", [ACCOUNT_PK, wm2],
      );
      delLogs.forEach(l => console.log(`[SVC06][DEL][log] type=${(l as any).log_type} notes=${(l as any).notes}`));
      const bankLog = delLogs.find(l => String((l as any).log_type) === 'BANK_ACCOUNT');
      console.log(`[SVC06][DEL][SECURITY] delete log: ${bankLog ? (bankLog as any).notes : '(no BANK_ACCOUNT log)'} | routing in plaintext? ${bankLog && String((bankLog as any).notes).includes(NEW_ROUTING) ? 'YES (' + NEW_ROUTING + ')' : 'no'}`);
    });

    await test.step('Verify account restored (original default bank intact)', async () => {
      const active = await db.query(
        'SELECT pk, right(account_number,4) AS last4, auto_pay FROM uown_sv_bank_account WHERE account_pk = $1 AND is_deleted = false ORDER BY pk', [ACCOUNT_PK],
      );
      const postTypes = await db.query('SELECT auto_pay_types FROM uown_sv_account WHERE pk = $1', [ACCOUNT_PK]);
      console.log(`[SVC06][POST] active banks=${JSON.stringify(active)} autopay_types=${JSON.stringify(postTypes[0])}`);
    });
  });
});

/**
 * SVC-06 cleanup + delete oracle. The UI "View All → Delete" flow timed out (page-object selector
 * drift on the All-Bank-Accounts modal — logged as a residual observation), leaving the added bank
 * (routing 121000248) ACTIVE on account 224. Restore via the product removeBankAccount API (NOT a
 * raw DB mutation) and capture the delete oracle the UI run missed: is_deleted=true + BANK_ACCOUNT
 * activity log with the routing number (recon's P0-security: routing logged in plaintext).
 */
import { test, expect } from '@support/base-test.js';

const ACCOUNT_PK = 224;
const ROUTING = '121000248';

test('SVC-06 cleanup — removeBankAccount via API + capture delete oracle', async ({ api, db }) => {
  test.setTimeout(60_000);

  const wm = Number((await db.query('SELECT COALESCE(max(pk),0) AS m FROM uown_sv_activity_log WHERE account_pk = $1', [ACCOUNT_PK]))[0].m as number);

  const list = await api.bankAccount.getBankAccounts(ACCOUNT_PK);
  const body: any = list.body;
  const accounts: any[] = Array.isArray(body) ? body : (body?.bankAccounts ?? body?.bankAccountInfos ?? body?.bankAccountInfoList ?? []);
  console.log(`[SVC06cleanup] getBankAccounts ok=${list.ok} status=${list.status} count=${accounts.length}`);
  console.log(`[SVC06cleanup] BODY SHAPE: ${JSON.stringify(accounts).slice(0, 700)}`);
  const info = (a: any) => a.bankAccountInfo ?? a;
  const target = accounts.find(a => String(info(a).routingNumber ?? '') === ROUTING);
  console.log(`[SVC06cleanup] target: ${JSON.stringify(target && info(target))}`);
  expect(target, 'leftover active bank (routing 121000248) should be present').toBeTruthy();

  const del = await api.bankAccount.deleteBankAccount(ACCOUNT_PK, info(target));
  console.log(`[SVC06cleanup] deleteBankAccount ok=${del.ok} status=${del.status}`);

  const row = await db.query('SELECT pk, is_deleted, auto_pay FROM uown_sv_bank_account WHERE account_pk = $1 AND routing_number = $2 ORDER BY pk DESC LIMIT 1', [ACCOUNT_PK, ROUTING]);
  console.log(`[SVC06cleanup][DB] after delete (is_deleted should be true): ${JSON.stringify(row[0])}`);

  const delLogs = await db.query("SELECT log_type, left(notes,150) AS notes FROM uown_sv_activity_log WHERE account_pk = $1 AND pk > $2 ORDER BY pk", [ACCOUNT_PK, wm]);
  delLogs.forEach(l => console.log(`[SVC06cleanup][log] ${(l as any).log_type}: ${(l as any).notes}`));
  const bankLog = delLogs.find(l => String((l as any).log_type) === 'BANK_ACCOUNT');
  console.log(`[SVC06cleanup][SECURITY] BANK_ACCOUNT delete log: ${bankLog ? (bankLog as any).notes : '(none)'} | routing plaintext? ${bankLog && String((bankLog as any).notes).includes(ROUTING) ? 'YES' : 'no'}`);

  const active = await db.query('SELECT pk, right(account_number,4) AS last4, auto_pay FROM uown_sv_bank_account WHERE account_pk = $1 AND is_deleted = false ORDER BY pk', [ACCOUNT_PK]);
  console.log(`[SVC06cleanup][RESTORED] active banks on 224: ${JSON.stringify(active)}`);
});

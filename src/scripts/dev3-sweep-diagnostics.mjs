import fs from 'node:fs';
import pg from 'pg';
const env = {};
for (const line of fs.readFileSync(new URL('../../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const url = new URL(env.UOWN_DB_URL_DEV3.replace(/^jdbc:/, ''));
url.username = env.UOWN_DB_USER_DEV3; url.password = env.UOWN_DB_PASS_DEV3 || '';
const pool = new pg.Pool({ connectionString: url.toString(), max: 1 });
const q = async (label, sql, params=[]) => { try { const r = await pool.query(sql, params); console.log(`\n### ${label} (${r.rows.length})`); console.dir(r.rows,{depth:null,maxArrayLength:null}); return r.rows; } catch(e){ console.log(`\n### ${label}\n  ERR: ${e.message}`); return []; } };

const sweeps = ['SendCreditCardPaymentsSweep','IdempotentCCSweep','rerunCCPaymentsSweep',
  'delinquencyRerunCCPaymentsSweep','dailyDelinquencyRerunCCSweep','CreateScheduledCreditCardPaymentsSweep'];
const rows = await q('scheduled_task defs', `SELECT scheduled_task_name AS name, is_active, last_trigger_time FROM uown_scheduled_task WHERE scheduled_task_name = ANY($1) ORDER BY 1`,[sweeps]);
for (const name of sweeps) {
  const r = await pool.query(`SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name=$1`,[name]);
  console.log(`\n--- SQL [${name}] ---\n${r.rows[0]?.sql_to_pick_accounts ?? '(no row)'}`);
}

await q('recent sweep_logs CC/Delinquency', `SELECT sweep_name, number_of_records_processed AS processed, start_time, left(coalesce(error,''),140) AS error FROM uown_sweep_logs WHERE sweep_name ILIKE '%CreditCard%' OR sweep_name ILIKE '%CC%' OR sweep_name ILIKE '%elinquency%' ORDER BY start_time DESC LIMIT 20`);

await q('autopay CC accounts ACTIVE (schedule candidates)', `SELECT cc.account_pk, a.account_status FROM uown_sv_credit_card cc JOIN uown_sv_account a ON a.pk=cc.account_pk WHERE cc.auto_pay=true AND cc.is_deleted=false AND a.account_status NOT IN ('PAID_OUT','CLOSED','SETTLED') ORDER BY cc.account_pk DESC LIMIT 20`);

await pool.end();

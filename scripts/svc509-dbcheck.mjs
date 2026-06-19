// Quick read-only DB check for svc#509 run #2 — accounts 4712..4716
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: '127.0.0.1',
  port: 5445,
  user: 'svc_user',
  password: process.env.PGPASSWORD,
  database: 'svc',
});

await client.connect();
console.log('connected qa1');

const accounts = [4712, 4713, 4714, 4715, 4716];
for (const ap of accounts) {
  console.log(`\n=== account_pk=${ap} ===`);
  const cc = await client.query(
    `SELECT pk, amount, status, posting_date::text, original_ccpk, charge_fee, allocation_strategy, row_created_timestamp::text
       FROM uown_sv_credit_card_transaction WHERE account_pk=$1
       ORDER BY pk DESC LIMIT 3`, [ap]);
  console.log(`CC tx (${cc.rows.length}):`, cc.rows);
  const ach = await client.query(
    `SELECT pk, amount, status, bank_account_pk, ach_process_type, ach_type, allocation_strategy
       FROM uown_sv_achpayment WHERE account_pk=$1 ORDER BY pk DESC LIMIT 3`, [ap]);
  console.log(`ACH (${ach.rows.length}):`, ach.rows);
  const recv = await client.query(
    `SELECT pk, receivable_type, base_amount, total_amount, allocation_status, status, row_created_timestamp::text
       FROM uown_sv_receivable WHERE account_pk=$1 ORDER BY pk DESC LIMIT 5`, [ap]);
  console.log(`Recv (${recv.rows.length}):`, recv.rows);
  const al = await client.query(
    `SELECT pk, log_type, notes, created_by, row_created_timestamp::text
       FROM uown_sv_activity_log WHERE account_pk=$1 ORDER BY pk DESC LIMIT 5`, [ap]);
  console.log(`ActivityLog (${al.rows.length}):`, al.rows);
  const il = await client.query(
    `SELECT pk, api, call_type, row_created_timestamp::text
       FROM uown_sv_inbound_api_log
      WHERE api LIKE 'com.uownleasing.svc.rest.tms.%'
        AND row_created_timestamp >= NOW() - INTERVAL '60 minutes'
      ORDER BY pk DESC LIMIT 5`);
  if (ap === accounts[0]) console.log(`Inbound TMS log recent (${il.rows.length}):`, il.rows);
}

await client.end();

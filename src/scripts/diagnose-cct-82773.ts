import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('sandbox');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const cct = await pool.query(
      `SELECT pk, account_pk, status, cc_vendor, cc_action, cc_transaction_type,
              agent_username, posting_date, error, comment, gateway_transaction_id
         FROM uown_sv_credit_card_transaction WHERE pk = 82773`,
    );
    console.log('cct 82773:');
    console.table(cct.rows);

    const acct = cct.rows[0] ? await pool.query(
      `SELECT pk, account_status, rating FROM uown_sv_account WHERE pk = $1`,
      [cct.rows[0].account_pk],
    ) : null;
    if (acct) {
      console.log('\naccount:');
      console.table(acct.rows);
    }

    const sweepLogs = await pool.query(
      `SELECT pk, start_time, end_time, number_of_records_processed AS processed,
              SUBSTRING(error FROM 1 FOR 200) AS error_excerpt
         FROM uown_sweep_logs WHERE sweep_name='StickyRecoverSweep'
         ORDER BY pk DESC LIMIT 5`,
    );
    console.log('\nrecent sweep_logs:');
    console.table(sweepLogs.rows);

    const outbound = cct.rows[0] ? await pool.query(
      `SELECT pk, account_pk, SUBSTRING(response FROM 1 FOR 200) AS resp,
              SUBSTRING(stack_trace FROM 1 FOR 300) AS stack_trace,
              row_created_timestamp
         FROM uown_sticky_outbound_log
        WHERE account_pk = $1
        ORDER BY pk DESC LIMIT 3`,
      [cct.rows[0].account_pk],
    ) : null;
    if (outbound) {
      console.log('\noutbound_log for account:');
      console.table(outbound.rows);
    }

    const sticky = cct.rows[0] ? await pool.query(
      `SELECT pk, cc_transaction_pk, account_pk, recovery_status, sticky_transaction_id,
              row_created_timestamp
         FROM uown_sticky WHERE cc_transaction_pk = 82773 OR account_pk = $1
         ORDER BY pk DESC LIMIT 3`,
      [cct.rows[0].account_pk],
    ) : null;
    if (sticky) {
      console.log('\nuown_sticky:');
      console.table(sticky.rows);
    }
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

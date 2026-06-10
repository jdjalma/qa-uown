import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const account = await pool.query(
      `SELECT pk, lead_pk, row_created_timestamp, row_updated_timestamp
         FROM uown_sv_account
        WHERE lead_pk = 12007`,
    );
    console.log('Account for lead 12007:');
    console.table(account.rows);

    if (account.rows.length === 0) return;
    const accountPk = Number(account.rows[0].pk);

    const ss = await pool.query(
      `SELECT account_pk, early_payoff_date_expiry, row_updated_timestamp
         FROM uown_sv_sched_summary
        WHERE account_pk = $1`,
      [accountPk],
    );
    console.log('\nSched summary:');
    console.table(ss.rows);

    const activityCols = await pool.query(
      `SELECT pk, log_type, notes, row_created_timestamp
         FROM uown_sv_activity_log
        WHERE account_pk = $1
        ORDER BY pk DESC
        LIMIT 8`,
      [accountPk],
    );
    console.log('\nActivity log (last 8):');
    console.table(activityCols.rows.map((r: any) => ({
      pk: r.pk, log_type: r.log_type, ts: r.row_created_timestamp, notes: String(r.notes ?? '').slice(0, 120)
    })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

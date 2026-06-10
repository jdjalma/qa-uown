import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const q = async (label: string, sql: string, params: unknown[] = []) => {
      const r = await pool.query(sql, params);
      console.log(`\n— ${label} —`);
      console.log(JSON.stringify(r.rows, null, 2).slice(0, 4000));
    };

    await q(
      'new sql_config entries (MR !1370 split)',
      `SELECT UPPER(sql_name) AS sql_name, length(sql_query) AS len
       FROM uown_sv_sql_config
       WHERE UPPER(sql_name) IN (
         'GETLOSSEARCH_BYLEADPK','GETLOSSEARCH_BYACCOUNTPK','GETLOSSEARCH_BYUUID',
         'GETLOSSEARCH_BYSSN','GETLOSSEARCH_BYEMAIL','GETLOSSEARCH_BYPHONE',
         'GETLOSSEARCH_BYINVOICENUM','GETLOSSEARCH_BYNAME','GETLOSSEARCH_BYLAST4CC',
         'GETLOSSEARCH_FREETEXT','GETLOSSIMPLESEARCHRESULTS'
       )
       ORDER BY sql_name`,
    );

    await q(
      'new expression indexes (MR !1370 migration V20260427115712)',
      `SELECT indexname, tablename FROM pg_indexes
       WHERE indexname IN ('idx_los_email_address_upper','idx_los_invoice_merchant_invoice_number_upper')
       ORDER BY indexname`,
    );

    await q(
      'flyway history for the migration',
      `SELECT version, description, installed_on, success FROM flyway_schema_history
       WHERE script ILIKE '%expression-indexes%' OR version = '20260427115712.1.51.0'
       ORDER BY installed_rank DESC LIMIT 5`,
    );

    await q(
      'all idx_los_* indexes that exist now',
      `SELECT indexname, tablename, indexdef
       FROM pg_indexes
       WHERE indexname LIKE 'idx_los_%' OR indexname LIKE 'idx_uown_los%'
       ORDER BY indexname LIMIT 40`,
    );
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

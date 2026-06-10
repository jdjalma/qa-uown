import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // 1. Read raw SQL of ByInvoiceNum to see if WHERE uses upper()
    const r1 = await pool.query(
      `SELECT sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) = 'GETLOSSEARCH_BYINVOICENUM'`,
    );
    console.log('=== Raw GETLOSSEARCH_BYINVOICENUM ===');
    console.log(r1.rows[0].sql_query);

    console.log('\n=== Indexes on uown_los_credit_card (last4CC search target) ===');
    const r2 = await pool.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'uown_los_credit_card' ORDER BY indexname`,
    );
    r2.rows.forEach((r) => console.log(`  ${r.indexname}: ${r.indexdef}`));

    console.log('\n=== Indexes on uown_los_invoice (invoice search target) ===');
    const r3 = await pool.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'uown_los_invoice' ORDER BY indexname`,
    );
    r3.rows.forEach((r) => console.log(`  ${r.indexname}: ${r.indexdef}`));

    console.log('\n=== Indexes on uown_los_email (for comparison — ByEmail works) ===');
    const r4 = await pool.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'uown_los_email' ORDER BY indexname`,
    );
    r4.rows.forEach((r) => console.log(`  ${r.indexname}: ${r.indexdef}`));

    // EXPLAIN ANALYZE if we MANUALLY add upper() on both sides — does it use the index?
    console.log('\n=== Hypothetical ByInvoiceNum with UPPER() on both sides — would use the index? ===');
    const hyp = `
      EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
      SELECT lead.pk, invoice.merchant_invoice_number
      FROM uown_los_invoice invoice
      JOIN uown_los_lead lead ON lead.pk = invoice.lead_pk
      WHERE UPPER(invoice.merchant_invoice_number) = UPPER('R1925054')
      LIMIT 10
    `;
    const e = await pool.query(hyp);
    e.rows.forEach((r) => console.log('  ', r['QUERY PLAN']));
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

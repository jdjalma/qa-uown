import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

// SearchResult DTO field names — the contract that the SQL aliases must match
// (derived from response observed live: leadPk, accountPk, uuid, leadStatus,
//  customerName, ssn, phoneNumber, email, invoiceNumber, last4CC, createdTimestamp,
//  contractNumber, accountStatus, rtoAccountNumber, etc.)
const EXPECTED_ALIASES = [
  'leadPk', 'accountPk', 'createdTimestamp', 'uuid', 'leadStatus',
  'firstName', 'lastName', 'ssn', 'email', 'areaCode', 'phone',
  'invoiceNumber', 'last4CC',
];

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const sqlNames = [
      'GETLOSSEARCH_BYLEADPK', 'GETLOSSEARCH_BYACCOUNTPK', 'GETLOSSEARCH_BYUUID',
      'GETLOSSEARCH_BYSSN', 'GETLOSSEARCH_BYEMAIL', 'GETLOSSEARCH_BYPHONE',
      'GETLOSSEARCH_BYINVOICENUM', 'GETLOSSEARCH_BYNAME', 'GETLOSSEARCH_BYLAST4CC',
      'GETLOSSEARCH_FREETEXT',
    ];
    const r = await pool.query(
      `SELECT sql_name, sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) = ANY($1::text[]) ORDER BY sql_name`,
      [sqlNames],
    );

    console.log('### Audit: alias consistency across the 10 new SQLs\n');
    const report: Record<string, { found: string[]; missing: string[] }> = {};
    for (const row of r.rows) {
      const q = row.sql_query as string;
      // Extract all `AS xxxx` aliases (camelCase) found in the SQL
      const aliases = new Set<string>();
      for (const m of q.matchAll(/\bAS\s+([a-z][a-zA-Z0-9_]*)/g)) {
        aliases.add(m[1]);
      }
      const found = EXPECTED_ALIASES.filter((a) => aliases.has(a));
      const missing = EXPECTED_ALIASES.filter((a) => !aliases.has(a));
      // Anomaly aliases: anything ending in lowercase that doesn't match camelCase contract
      const anomalies = Array.from(aliases).filter(
        (a) => !EXPECTED_ALIASES.includes(a) && /[A-Z]/.test(a) === false && !['totalresults','row_num','total_results'].includes(a.toLowerCase()),
      );
      report[row.sql_name] = { found, missing };
      console.log(`-- ${row.sql_name} (${q.length} chars)`);
      console.log(`   missing aliases: ${missing.join(', ') || '(none)'}`);
      console.log(`   non-contract aliases: ${anomalies.join(', ') || '(none)'}`);
      // Check for the specific known bug pattern
      if (/row_created_timestamp\s+AS\s+rowCreatedTime/.test(q)) {
        console.log(`   🚨 BUG: uses 'rowCreatedTime' alias (should be 'createdTimestamp')`);
      }
    }

    console.log('\n\n### EXPLAIN ANALYZE — new SQLs vs new indexes\n');

    // (1) ByEmail — should use idx_los_email_address_upper
    const sqlByEmail = (await pool.query(
      `SELECT sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) = 'GETLOSSEARCH_BYEMAIL'`,
    )).rows[0]?.sql_query as string;
    // Substitute :params with literals (this is for EXPLAIN only — params would be bound at runtime)
    const explainByEmail = sqlByEmail
      .replace(/:searchString/g, "'karen.rodriguez39@mailinator.com'")
      .replace(/:allMerchants/g, 'true')
      .replace(/:merchantRefCodes/g, "''")
      .replace(/:maxResults/g, '50')
      .replace(/:fromResults/g, '0');
    const e1 = await pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${explainByEmail}`);
    console.log('-- ByEmail (expected to use idx_los_email_address_upper)');
    e1.rows.forEach((r) => console.log('  ', r['QUERY PLAN']));

    // (2) ByInvoiceNum — should use idx_los_invoice_merchant_invoice_number_upper
    const sqlByInvoice = (await pool.query(
      `SELECT sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) = 'GETLOSSEARCH_BYINVOICENUM'`,
    )).rows[0]?.sql_query as string;
    const explainByInvoice = sqlByInvoice
      .replace(/:searchString/g, "'R1925054'")
      .replace(/:allMerchants/g, 'true')
      .replace(/:merchantRefCodes/g, "''")
      .replace(/:maxResults/g, '50')
      .replace(/:fromResults/g, '0');
    const e2 = await pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${explainByInvoice}`);
    console.log('\n-- ByInvoiceNum (expected to use idx_los_invoice_merchant_invoice_number_upper)');
    e2.rows.forEach((r) => console.log('  ', r['QUERY PLAN']));

    // (3) ByLast4CC — for comparison with old monolithic
    const sqlByLast4 = (await pool.query(
      `SELECT sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) = 'GETLOSSEARCH_BYLAST4CC'`,
    )).rows[0]?.sql_query as string;
    const explainByLast4 = sqlByLast4
      .replace(/:searchString/g, "'2225'")
      .replace(/:allMerchants/g, 'true')
      .replace(/:merchantRefCodes/g, "''")
      .replace(/:maxResults/g, '100')
      .replace(/:fromResults/g, '0');
    const e3 = await pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${explainByLast4}`);
    console.log('\n-- ByLast4CC');
    e3.rows.forEach((r) => console.log('  ', r['QUERY PLAN']));
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

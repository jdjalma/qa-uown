import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_los_customer' ORDER BY ordinal_position`,
    );
    console.log('uown_los_customer columns:');
    console.table(cols.rows.map((r: any) => r.column_name));

    // Recipe table for the 9 historical leads
    const LEADS_16M = [11259, 11382, 11442, 11489, 11516]; // EligibleTerms 16
    const LEADS_13M = [11017, 11019, 11032, 11040]; // EligibleTerms 13 (UOWN 16m programs but ended up 13)

    const allLeads = [...LEADS_16M, ...LEADS_13M];

    // Pull customer profile for each lead
    const customers = await pool.query(
      `SELECT lead_pk, first_name, last_name, date_of_birth, ssn, email_address
         FROM uown_los_customer
        WHERE lead_pk = ANY($1::int[])
        ORDER BY lead_pk`,
      [allLeads],
    );
    console.log('\nCustomer profiles for historical leads:');
    console.table(customers.rows.map((r: any) => ({
      lead_pk: r.lead_pk,
      first: String(r.first_name ?? '').slice(0, 14),
      last: String(r.last_name ?? '').slice(0, 14),
      dob: r.date_of_birth,
      ssn: r.ssn,
      email: String(r.email_address ?? '').slice(0, 35),
      result: LEADS_16M.includes(Number(r.lead_pk)) ? '16m ✓' : '13m ✗',
    })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

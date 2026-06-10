import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const leads = await pool.query(
      `SELECT l.pk           AS lead_pk,
              l.merchant_pk,
              l.customer_state,
              l.lead_status,
              l.merchant_program_pk,
              mp.program_name,
              mp.term_months,
              l.row_created_timestamp,
              a.pk            AS account_pk
         FROM uown_los_lead l
         LEFT JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
         LEFT JOIN uown_sv_account a ON a.lead_pk = l.pk
        WHERE (l.row_created_timestamp >= '2026-05-24 10:00:00'::timestamp
               AND l.merchant_pk = 7099
               AND l.lead_status IN ('FUNDED', 'ACTIVE'))
           OR l.pk IN (11904, 11908, 11911, 11912, 11913, 11914, 11925, 11926, 11927, 11928, 11929, 11945, 12007, 12009, 12011, 12012, 12013, 12014)
           OR a.pk IN (4868, 4878, 4900, 4936, 4937)
        ORDER BY l.pk DESC`,
    );
    console.log('All svc#531 candidate leads + their accounts:');
    console.table(leads.rows.map((r: any) => ({
      lead_pk: r.lead_pk,
      account_pk: r.account_pk ?? '-',
      merchant_pk: r.merchant_pk,
      state: r.customer_state,
      status: r.lead_status,
      program_pk: r.merchant_program_pk ?? '-',
      program_name: String(r.program_name ?? '-').slice(0, 35),
      term: r.term_months,
      created: String(r.row_created_timestamp).slice(11, 19),
    })));
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

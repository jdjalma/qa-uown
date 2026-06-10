import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Account 4745 is the KS3015 CA 16m account referenced in SPEC. Resolve its lead → program.
    const ref4745 = await pool.query(
      `SELECT a.pk             AS account_pk,
              a.lead_pk,
              l.customer_state AS lead_state,
              l.merchant_pk,
              l.merchant_program_pk,
              mp.program_name,
              mp.term_months
         FROM uown_sv_account a
         LEFT JOIN uown_los_lead l ON l.pk = a.lead_pk
         LEFT JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE a.pk = 4745`,
    );
    console.log('Account 4745 (SPEC reference, KS3015/CA/16m):');
    console.table(ref4745.rows);

    // What programs are USED by 16m leads in qa1 across all merchants?
    const sixteenLeads = await pool.query(
      `SELECT l.merchant_program_pk,
              mp.program_name,
              mp.term_months,
              COUNT(*) AS lead_count
         FROM uown_los_lead l
         JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE mp.term_months = 16
          AND l.row_created_timestamp > now() - interval '180 days'
        GROUP BY l.merchant_program_pk, mp.program_name, mp.term_months
        ORDER BY lead_count DESC`,
    );
    console.log('\n16m programs USED by recent leads (last 180d):');
    console.table(sixteenLeads.rows);

    // Pre-CA leads on each target merchant for 16m specifically
    const per16m = await pool.query(
      `SELECT l.merchant_pk,
              l.merchant_program_pk,
              mp.program_name,
              COUNT(*) AS lead_count
         FROM uown_los_lead l
         JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE mp.term_months = 16
          AND l.merchant_pk IN (566, 6108, 7098, 7099)
          AND l.customer_state = 'CA'
        GROUP BY l.merchant_pk, l.merchant_program_pk, mp.program_name
        ORDER BY l.merchant_pk, lead_count DESC`,
    );
    console.log('\n16m programs used per target merchant + CA:');
    console.table(per16m.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

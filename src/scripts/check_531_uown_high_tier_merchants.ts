import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Find UOWN merchants whose historical leads have BlackBox approval >= $3000
    // (the threshold for 16m eligibility), excluding the qa1-only test merchants.
    const candidates = await pool.query(
      `SELECT m.pk AS merchant_pk,
              m.ref_merchant_code,
              m.merchant_name,
              m.merchant_type,
              COUNT(l.pk) AS lead_count,
              MAX(l.max_approval_amount) AS max_approval_seen,
              AVG(l.max_approval_amount) AS avg_approval,
              MIN(l.max_approval_amount) AS min_approval
         FROM uown_los_lead l
         JOIN uown_merchant m ON m.pk = l.merchant_pk
        WHERE l.max_approval_amount >= 3000
          AND m.ref_merchant_code NOT ILIKE 'KS%'
          AND m.pk NOT IN (2812, 7043)
        GROUP BY m.pk, m.ref_merchant_code, m.merchant_name, m.merchant_type
        HAVING COUNT(l.pk) >= 2
        ORDER BY max_approval_seen DESC, lead_count DESC
        LIMIT 20`,
    );
    console.log('UOWN merchants (excluding 2812/7043) with leads approved >= $3000:');
    console.table(candidates.rows);

    // For each candidate, check if 16m program available (and CA-coverage)
    if (candidates.rows.length > 0) {
      const pks = candidates.rows.map((r: any) => Number(r.merchant_pk));
      const programs = await pool.query(
        `SELECT m.pk AS merchant_pk,
                m.ref_merchant_code,
                mp.pk AS program_pk,
                mp.program_name,
                mp.term_months,
                CASE WHEN mp.states IS NULL OR mp.states ILIKE '%CA%' THEN 'yes' ELSE 'no' END AS ca_eligible,
                mp.is_active
           FROM uown_merchant m
           JOIN uown_merchant_to_program mtp ON mtp.merchant_pk = m.pk
           JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk
          WHERE m.pk = ANY($1::int[])
            AND mp.term_months = 16
            AND mp.is_active = true
          ORDER BY m.pk, mp.program_name`,
        [pks],
      );
      console.log('\n16m programs available on those merchants:');
      console.table(programs.rows.map((r: any) => ({
        merchant_pk: r.merchant_pk,
        ref_code: r.ref_merchant_code,
        program_pk: r.program_pk,
        program: String(r.program_name ?? '').slice(0, 30),
        term: r.term_months,
        ca: r.ca_eligible,
        active: r.is_active,
      })));
    }

    // Cross-check: which of the candidate merchants have ALSO funded 16m leads historically?
    const sixteenFunded = await pool.query(
      `SELECT m.pk, m.ref_merchant_code, COUNT(l.pk) AS leads_16m
         FROM uown_los_lead l
         JOIN uown_merchant m ON m.pk = l.merchant_pk
         JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE mp.term_months = 16
          AND l.lead_status IN ('FUNDED', 'ACTIVE', 'CC_AUTH_PASSED', 'SIGNED', 'CONTRACT_CREATED')
          AND m.ref_merchant_code NOT ILIKE 'KS%'
          AND m.pk NOT IN (2812, 7043)
        GROUP BY m.pk, m.ref_merchant_code
        ORDER BY leads_16m DESC`,
    );
    console.log('\nUOWN merchants (excl 2812/7043) with historical 16m FUNDED/SIGNED leads:');
    console.table(sixteenFunded.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

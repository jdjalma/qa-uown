import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // All historical 16m FUNDED leads, grouped by merchant brand
    const all = await pool.query(
      `SELECT m.pk AS merchant_pk,
              m.ref_merchant_code,
              m.merchant_name,
              CASE WHEN m.ref_merchant_code ILIKE 'KS%' THEN 'KORNERSTONE' ELSE 'UOWN' END AS brand,
              mp.program_name,
              mp.term_months,
              COUNT(l.pk) AS lead_count,
              MIN(l.row_created_timestamp) AS earliest,
              MAX(l.row_created_timestamp) AS latest
         FROM uown_los_lead l
         JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
         JOIN uown_merchant m ON m.pk = l.merchant_pk
        WHERE mp.term_months = 16
          AND l.lead_status IN ('FUNDED', 'ACTIVE', 'CC_AUTH_PASSED', 'SIGNED', 'CONTRACT_CREATED')
        GROUP BY m.pk, m.ref_merchant_code, m.merchant_name, brand, mp.program_name, mp.term_months
        ORDER BY brand, lead_count DESC`,
    );
    console.log('All 16m leads in qa1 history (grouped by merchant + program):');
    console.table(all.rows.map((r: any) => ({
      brand: r.brand,
      merchant_pk: r.merchant_pk,
      ref_code: r.ref_merchant_code,
      program: String(r.program_name ?? '').slice(0, 30),
      count: r.lead_count,
      earliest: String(r.earliest).slice(0, 10),
      latest: String(r.latest).slice(0, 10),
    })));

    // Aggregate by brand
    const byBrand = await pool.query(
      `SELECT CASE WHEN m.ref_merchant_code ILIKE 'KS%' THEN 'KORNERSTONE' ELSE 'UOWN' END AS brand,
              COUNT(DISTINCT l.pk) AS lead_count,
              COUNT(DISTINCT m.pk) AS merchant_count
         FROM uown_los_lead l
         JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
         JOIN uown_merchant m ON m.pk = l.merchant_pk
        WHERE mp.term_months = 16
          AND l.lead_status IN ('FUNDED', 'ACTIVE', 'CC_AUTH_PASSED', 'SIGNED', 'CONTRACT_CREATED')
        GROUP BY brand`,
    );
    console.log('\nAggregate by brand:');
    console.table(byBrand.rows);

    // Show recent UOWN-brand 16m attempts (any lead, not just funded) to see what SSN/income worked
    const uownAttempts = await pool.query(
      `SELECT l.pk AS lead_pk,
              m.ref_merchant_code,
              l.lead_status,
              mp.program_name,
              l.row_created_timestamp
         FROM uown_los_lead l
         JOIN uown_merchant m ON m.pk = l.merchant_pk
         LEFT JOIN uown_merchant_program mp ON mp.pk = l.merchant_program_pk
        WHERE l.merchant_program_pk IN (
                SELECT pk FROM uown_merchant_program WHERE term_months = 16
              )
          AND m.ref_merchant_code NOT ILIKE 'KS%'
        ORDER BY l.pk DESC
        LIMIT 20`,
    );
    console.log('\nRecent UOWN-brand (non-KS) 16m leads (any status):');
    console.table(uownAttempts.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

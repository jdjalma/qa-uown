import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const programs = await pool.query(
      `SELECT mp.pk, mp.program_name, mp.term_months,
              mp.min_cart_amount, mp.max_cart_amount, mp.max_dollar_amount,
              mp.activation_date, mp.deactivation_date, mp.is_active
         FROM uown_merchant_program mp
         JOIN uown_merchant_to_program mtp ON mtp.program_pk = mp.pk
        WHERE mtp.merchant_pk = 6108
          AND mp.term_months IN (13, 16)
        ORDER BY mp.term_months, mp.min_cart_amount`,
    );
    console.log("Daniel's Jewelers (6108) — 13m + 16m programs with amount limits:");
    console.table(programs.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

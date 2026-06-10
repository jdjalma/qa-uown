import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const LEAD_PKS = [11259, 11382, 11442, 11489, 11516, 11017, 11019, 11032, 11040];

    // Find tables containing applicant/customer profile data
    const cols = await pool.query(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (column_name = 'lead_pk' OR column_name = 'pk')
          AND table_name IN (
            SELECT table_name FROM information_schema.columns
             WHERE table_schema = 'public'
               AND (column_name ILIKE '%ssn%' OR column_name ILIKE '%first_name%' OR column_name ILIKE '%dob%' OR column_name ILIKE '%income%')
          )
        ORDER BY table_name`,
    );
    console.log('Tables that likely hold applicant profile data:');
    console.table(cols.rows);

    // Sample lead 11259 — extract everything with profile data
    const directCols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'uown_los_lead'
          AND (column_name ILIKE '%ssn%' OR column_name ILIKE '%main_%' OR column_name ILIKE '%first%' OR column_name ILIKE '%last%' OR column_name ILIKE '%customer%' OR column_name ILIKE '%email%' OR column_name ILIKE '%dob%' OR column_name ILIKE '%income%' OR column_name ILIKE '%zip%' OR column_name ILIKE '%phone%' OR column_name ILIKE '%pay_freq%' OR column_name ILIKE '%employ%')
        ORDER BY column_name`,
    );
    console.log('\nuown_los_lead profile-related cols:');
    console.table(directCols.rows);
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

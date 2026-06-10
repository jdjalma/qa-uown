/**
 * check-537-program-ordering.ts
 *
 * For svc#537 — verify ordering of `findSACActiveProgramByStateAndCategory`
 * (order by row_created_timestamp DESC) for merchants targeted by tests.
 * Also captures `allowed_frequency_override` per program — relevant for the
 * qa1 16m + WEEKLY/BIWEEKLY/SEMI_MONTHLY SvcException limitation.
 *
 * READ-ONLY (SELECT). Regra de segurança: nenhum INSERT/UPDATE/DELETE.
 *
 * Usage: npx tsx src/scripts/check-537-program-ordering.ts qa1
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const cfg = new ConfigEnvironment(env);
  const connStr = cfg.dbConnectionString;
  if (!connStr) { console.error(`No DB conn for env=${env}`); process.exit(1); }

  const pool = new pg.Pool({ connectionString: connStr, max: 1 });
  try {
    for (const ref of ['KS3015', 'KS5936', 'OL90202-0001', 'KWC-2.3']) {
      console.log(`\n===== ${ref} — programs (order matches findSACActiveProgramByStateAndCategory) =====`);
      const r = await pool.query(`
        SELECT
          ump.pk,
          ump.program_name,
          ump.term_months,
          ump.states,
          ump.allowed_frequency_override,
          ump.program_type,
          ump.lending_category_type,
          ump.row_created_timestamp,
          umtp.is_active AS link_active,
          um.ref_merchant_code
        FROM uown_merchant_program ump
        JOIN uown_merchant_to_program umtp ON umtp.program_pk = ump.pk
        JOIN uown_merchant um ON um.pk = umtp.merchant_pk
        WHERE um.ref_merchant_code = $1
          AND umtp.is_active = true
        ORDER BY ump.row_created_timestamp DESC
      `, [ref]);
      console.table(r.rows.map(row => ({
        pk: row.pk,
        name: row.program_name,
        term: row.term_months,
        states: (row.states || '').slice(0, 40),
        freq_override: row.allowed_frequency_override || '(merchant default)',
        type: row.program_type,
        category: row.lending_category_type,
        created: row.row_created_timestamp?.toISOString?.()?.slice(0, 10),
      })));
    }

    console.log('\n===== uown_sv_sql_config — defaultMonthsWhen16Month override =====');
    const sc = await pool.query(`
      SELECT pk, sql_name, sql_value, row_created_timestamp, row_updated_timestamp
      FROM uown_sv_sql_config
      WHERE sql_name ILIKE '%DEFAULTMONTHSWHEN16MONTH%'
         OR sql_name ILIKE '%DEFAULTTO13MONTHPROGRAM%'
         OR sql_name ILIKE '%NUMBER.OF.PAYMENTS.16%'
      ORDER BY sql_name
    `);
    console.table(sc.rows.length ? sc.rows : [{ note: 'no env override — using code defaults' }]);
  } catch (e: any) {
    console.error('ERR:', e.message);
  } finally {
    await pool.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

async function probeSchema() {
  const env = process.argv[2] ?? 'qa1';
  const { ConfigEnvironment } = await import('../config/environment.js');
  const cfg = new ConfigEnvironment(env);
  const connStr = (cfg as any).dbConnectionString;
  const pool = new pg.Pool({ connectionString: connStr, max: 1 });
  try {
    console.log('\n===== uown_sv_sql_config columns =====');
    const cols = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_name = 'uown_sv_sql_config' ORDER BY ordinal_position
    `);
    console.table(cols.rows);

    console.log('\n===== sample row =====');
    const sample = await pool.query(`SELECT * FROM uown_sv_sql_config LIMIT 1`);
    console.log(JSON.stringify(sample.rows[0], null, 2));
  } finally { await pool.end(); }
}
probeSchema().catch(e => { console.error(e); process.exit(1); });

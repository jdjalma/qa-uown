/**
 * check-receivables.ts - Check ACTIVE accounts with UNPAID receivables
 * Usage: npx tsx src/scripts/check-receivables.ts qa1
 */
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'qa1';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });

  try {
    const result = await pool.query(`
      SELECT a.pk, count(r.pk) as recv_count
      FROM uown_sv_account a
      JOIN uown_sv_receivable r ON r.account_pk = a.pk
        AND r.receivable_type IN ('REGULAR_PAYMENT', 'PROCESSING_FEE')
        AND r.allocation_status IN ('PARTIALLY_PAID', 'UNPAID')
        AND r.status = 'ACTIVE'
      WHERE a.account_status = 'ACTIVE'
        AND (a.rating IS NULL OR a.rating NOT IN ('B','C'))
        AND NOT EXISTS (
          SELECT 1 FROM uown_sv_payment_arrangement pa
          WHERE pa.account_pk = a.pk AND pa.is_active = true
        )
      GROUP BY a.pk
      ORDER BY a.pk DESC
      LIMIT 10
    `);

    if (result.rows.length === 0) {
      console.log('NENHUMA conta ACTIVE com UNPAID receivables encontrada em ' + env);
    } else {
      console.log('ACTIVE accounts COM UNPAID receivables (sweep real funciona):');
      for (const r of result.rows) {
        console.log(`  pk=${r.pk}, unpaid_recv=${r.recv_count}`);
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

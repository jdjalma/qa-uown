/**
 * Exploratory: map all scheduled tasks + recent sweep logs in dev3.
 * Shows which sweeps ran recently, how many records they processed,
 * and the SQL they use to pick eligible accounts.
 */
import pg from 'pg';
async function main() {
  // dev3 uses port 5446 (kubectl port-forward postgresql-0 5446:5432 -n uown-dev3)
  const pool = new pg.Pool({
    host: '127.0.0.1', port: 5446, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
  });
  const env = 'dev3';

  try {
    console.log(`\n=== SCHEDULED TASKS (${env}) ===\n`);
    const tasks = await pool.query<{
      pk: number; template_name: string; is_active: boolean;
      cron_trigger: string; fixed_rate: string; last_trigger_time: Date;
    }>(`
      SELECT pk, template_name, is_active, cron_trigger, fixed_rate, last_trigger_time
      FROM uown_scheduled_task
      ORDER BY template_name
    `);

    for (const t of tasks.rows) {
      console.log(
        `pk=${t.pk}  active=${t.is_active}  name=${t.template_name}` +
        `  cron=${t.cron_trigger ?? t.fixed_rate ?? 'none'}` +
        `  last=${t.last_trigger_time?.toISOString().slice(0, 19) ?? 'never'}`
      );
    }

    console.log(`\n=== RECENT SWEEP LOGS (last 3 per sweep, ${env}) ===\n`);
    const logs = await pool.query<{
      sweep_name: string; pk: number; start_time: Date; end_time: Date;
      processed: number; error: string;
    }>(`
      SELECT sweep_name, pk, start_time, end_time,
             number_of_records_processed AS processed,
             SUBSTRING(error FROM 1 FOR 150) AS error
      FROM uown_sweep_logs
      WHERE pk IN (
        SELECT pk FROM (
          SELECT pk, ROW_NUMBER() OVER (PARTITION BY sweep_name ORDER BY pk DESC) rn
          FROM uown_sweep_logs
        ) ranked WHERE rn <= 3
      )
      ORDER BY sweep_name, pk DESC
    `);

    let currentSweep = '';
    for (const l of logs.rows) {
      if (l.sweep_name !== currentSweep) {
        currentSweep = l.sweep_name;
        console.log(`\n-- ${currentSweep} --`);
      }
      const dur = l.end_time && l.start_time
        ? Math.round((l.end_time.getTime() - l.start_time.getTime()) / 1000) + 's'
        : 'running?';
      console.log(
        `  pk=${l.pk}  start=${l.start_time?.toISOString().slice(0, 19) ?? '?'}  ` +
        `dur=${dur}  processed=${l.processed ?? 0}` +
        (l.error ? `  ERR: ${l.error}` : '')
      );
    }

    console.log(`\n=== SWEEP SQL SNIPPETS (first 300 chars each) ===\n`);
    const sqls = await pool.query<{ pk: number; template_name: string; sql_snippet: string }>(`
      SELECT pk, template_name,
             SUBSTRING(sql_to_pick_accounts FROM 1 FOR 300) AS sql_snippet
      FROM uown_scheduled_task
      WHERE sql_to_pick_accounts IS NOT NULL
      ORDER BY template_name
    `);
    for (const s of sqls.rows) {
      console.log(`\n[pk=${s.pk}] ${s.template_name}:\n  ${s.sql_snippet?.replace(/\s+/g, ' ')}`);
    }

  } finally {
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

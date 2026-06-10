import pg from 'pg';
import crypto from 'node:crypto';
import { request as pwRequest } from '@playwright/test';
import { ConfigEnvironment } from '../config/environment.js';
import { ScheduledTaskClient } from '../api/clients/scheduled-task.client.js';

const CCT_PKS = [82957, 82958];

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  const ctx = await pwRequest.newContext();
  const scheduledTask = new ScheduledTaskClient(ctx, config);

  const client = await pool.connect();
  try {
    // ── 1. UPDATE em transação
    await client.query('BEGIN');
    for (const pk of CCT_PKS) {
      const newGtid = `setup-${pk}-${crypto.randomBytes(8).toString('hex')}`;
      const r = await client.query(`
        UPDATE uown_sv_credit_card_transaction
           SET gateway_transaction_id = $2,
               idempotency_key = NULL,
               row_updated_timestamp = NOW()
         WHERE pk = $1
     RETURNING pk, gateway_transaction_id, idempotency_key
      `, [pk, newGtid]);
      console.log(`cct ${pk} update:`, r.rows[0]);
    }
    await client.query('COMMIT');

    // ── 2. snapshot último sweep antes do trigger
    const before = await pool.query(`
      SELECT pk FROM uown_sweep_logs WHERE sweep_name='StickyRecoverSweep' ORDER BY pk DESC LIMIT 1`);
    const sincePk = before.rows[0]?.pk ?? 0;
    console.log(`\n[snapshot] last sweep_log pk=${sincePk}`);

    // ── 3. trigger
    const t = await scheduledTask.triggerScheduledTask('StickyRecoverSweep');
    console.log(`[trigger] http=${t.status}`);

    // ── 4. esperar nova run
    let newRun: any = null;
    const deadline = Date.now() + 6 * 60 * 1000;
    while (Date.now() < deadline) {
      const r = await pool.query(`
        SELECT pk, start_time, end_time, number_of_records_processed AS processed,
               SUBSTRING(error FROM 1 FOR 400) AS err
          FROM uown_sweep_logs
         WHERE sweep_name='StickyRecoverSweep' AND pk > $1
         ORDER BY pk DESC LIMIT 1`, [sincePk]);
      if (r.rows[0]) { newRun = r.rows[0]; break; }
      await new Promise(f => setTimeout(f, 3000));
      process.stdout.write('.');
    }
    console.log('');
    console.log('[run]:'); console.table([newRun]);

    if (!newRun) return;

    // svc latency to persist sticky/outbound
    await new Promise(f => setTimeout(f, 6000));

    // ── 5. resultados
    const s = await pool.query(`
      SELECT pk, account_pk, cc_transaction_pk, recovery_status, sticky_transaction_id, row_created_timestamp
        FROM uown_sticky
       WHERE cc_transaction_pk = ANY($1)
       ORDER BY pk DESC`, [CCT_PKS]);
    console.log(`uown_sticky para ccts ${CCT_PKS}:`); console.table(s.rows);

    const ob = await pool.query(`
      SELECT pk, sticky_pk, account_pk,
             SUBSTRING(stack_trace FROM 1 FOR 300) AS stack,
             SUBSTRING(response FROM 1 FOR 300) AS resp,
             row_created_timestamp
        FROM uown_sticky_outbound_log
       WHERE account_pk = 17181
       ORDER BY pk DESC LIMIT 5`, []);
    console.log('outbound_log para account 17181:'); console.table(ob.rows);

    const elig = await pool.query(`
      SELECT cct.pk, cct.status, cct.gateway_transaction_id, cct.idempotency_key,
             EXISTS(SELECT 1 FROM uown_sticky st
                    WHERE st.cc_transaction_pk = cct.pk
                      AND st.sticky_transaction_id IS NOT NULL) AS has_sticky
        FROM uown_sv_credit_card_transaction cct
       WHERE cct.pk = ANY($1)
       ORDER BY cct.pk`, [CCT_PKS]);
    console.log('cct state pós-run:'); console.table(elig.rows);
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error(e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
    await ctx.dispose();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

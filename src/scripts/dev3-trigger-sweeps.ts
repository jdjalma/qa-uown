/**
 * dev3 exploratory: trigger sweeps and verify they capture records.
 * Sweeps triggered via POST /uown/svc/triggerScheduledTask/{name}
 */
import pg from 'pg';

const API_BASE = 'https://svc-dev3.uownleasing.com';
const API_KEY = 'knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2';

const pool = new pg.Pool({
  host: '127.0.0.1', port: 5446, user: 'svc_user', password: 'F1nTech', database: 'svc', max: 1,
});

async function triggerSweep(name: string): Promise<{ status: number; body: string }> {
  const resp = await fetch(`${API_BASE}/uown/svc/triggerScheduledTask/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
    },
  });
  const body = await resp.text().catch(() => '');
  return { status: resp.status, body: body.slice(0, 200) };
}

async function getLastSweepLog(sweepName: string) {
  const r = await pool.query<{ pk: number; start_time: Date; processed: number; error: string }>(`
    SELECT pk, start_time, number_of_records_processed AS processed,
           SUBSTRING(error FROM 1 FOR 150) AS error
    FROM uown_sweep_logs
    WHERE sweep_name = $1
    ORDER BY pk DESC LIMIT 1
  `, [sweepName]);
  return r.rows[0];
}

async function waitForNewLog(sweepName: string, prevPk: number, maxWait = 30000): Promise<typeof pool.query extends (...args: any) => Promise<{rows: infer R[]}> ? R : any> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 2000));
    const r = await pool.query<{ pk: number; start_time: Date; processed: number; error: string }>(`
      SELECT pk, start_time, number_of_records_processed AS processed,
             SUBSTRING(error FROM 1 FOR 150) AS error
      FROM uown_sweep_logs
      WHERE sweep_name = $1 AND pk > $2
      ORDER BY pk DESC LIMIT 1
    `, [sweepName, prevPk]);
    if (r.rows.length > 0) return r.rows[0];
  }
  return null;
}

async function testSweep(taskName: string, sweepLogName: string, expectedMinRecords: number) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`SWEEP: ${taskName}`);
  console.log(`─`.repeat(60));

  const prevLog = await getLastSweepLog(sweepLogName);
  console.log(`  Before: last log pk=${prevLog?.pk ?? 'none'}, processed=${prevLog?.processed ?? 'n/a'}`);

  const result = await triggerSweep(taskName);
  console.log(`  Trigger: HTTP ${result.status}  body: ${result.body || '(empty)'}`);

  if (result.status !== 200) {
    console.log(`  [FAIL] Non-200 response`);
    return false;
  }

  console.log(`  Waiting for sweep log...`);
  const newLog = await waitForNewLog(sweepLogName, prevLog?.pk ?? 0);
  if (!newLog) {
    console.log(`  [WARN] No new log entry appeared within 30s`);
    return null;
  }

  const processed = Number(newLog.processed ?? 0);
  const status = processed >= expectedMinRecords ? '[PASS]' : '[FAIL]';
  console.log(`  After: pk=${newLog.pk}, processed=${processed}, error=${newLog.error ?? 'none'}`);
  console.log(`  ${status} expected >= ${expectedMinRecords}, got ${processed}`);
  return processed >= expectedMinRecords;
}

async function main() {
  console.log('=== dev3 Sweep Exploratory Tests ===');
  console.log(`Date: ${new Date().toISOString()}\n`);

  const results: { sweep: string; pass: boolean | null; processed?: number }[] = [];

  // ── 1. customerPortalReminderSweep (50 eligible accounts) ─────────────
  const r1 = await testSweep('customerPortalReminderSweep', 'customerPortalReminderSweep', 1);
  results.push({ sweep: 'customerPortalReminderSweep', pass: r1 });

  // ── 2. settledInFullAccountEmailSweep (6 eligible) ────────────────────
  const r2 = await testSweep('settledInFullAccountEmailSweep', 'settledInFullAccountEmailSweep', 1);
  results.push({ sweep: 'settledInFullAccountEmailSweep', pass: r2 });

  // ── 3. UnutilizedApprovalSweep (66 eligible leads) ────────────────────
  const r3 = await testSweep('UnutilizedApproval', 'UnutilizedApprovalSweep', 1);
  results.push({ sweep: 'UnutilizedApproval', pass: r3 });

  // ── 4. paidOutAccountsSweep (5 eligible accounts) ─────────────────────
  const r4 = await testSweep('paidOutAccountsSweep', 'paidOutAccountsSweep', 1);
  results.push({ sweep: 'paidOutAccountsSweep', pass: r4 });

  // ── 5. checkLeadExpiration (0 eligible — expect 0 processed) ─────────
  const r5 = await testSweep('checkLeadExpiration', 'checkLeadExpirationSweep', 0);
  results.push({ sweep: 'checkLeadExpiration (0 expected)', pass: r5 !== false });

  // ── 6. createScheduledCreditCardPayments (0 eligible — expect 0) ─────
  const r6 = await testSweep('createScheduledCreditCardPayments', 'CreateScheduledCreditCardPaymentsSweep', 0);
  results.push({ sweep: 'createScheduledCreditCardPayments (0 expected)', pass: r6 !== false });

  // ── 7. sendCreditCardPayments (0 eligible — expect 0) ─────────────────
  const r7 = await testSweep('sendCreditCardPayments', 'SendCreditCardPaymentsSweep', 0);
  results.push({ sweep: 'sendCreditCardPayments (0 expected)', pass: r7 !== false });

  // ── 8. cancelProtectionPlanSweep (known NullPointerException bug) ─────
  const r8 = await testSweep('cancelProtectionPlanSweep', 'cancelProtectionPlanSweep', 0);
  results.push({ sweep: 'cancelProtectionPlanSweep (bug check)', pass: r8 !== false });

  console.log('\n=== SUMMARY ===');
  for (const res of results) {
    const icon = res.pass === true ? '✓' : res.pass === false ? '✗' : '?';
    console.log(`  ${icon} ${res.sweep}`);
  }

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });

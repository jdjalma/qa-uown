import { test, expect } from '@fixtures/test-context.fixture.js';
import { waitForStickyTransactionId, waitForStickyOutboundLog } from '@helpers/sticky.helpers.js';
import { sleep } from '@helpers/index.js';

const CCT_PK = 83244;
const ACCOUNT_PK = 17204;

test('Sticky E2E: trigger sweep on morphed CCT -> monitor recovery', async ({ api, db }) => {
  test.setTimeout(600_000);

  await test.step('1. trigger StickyRecoverSweep', async () => {
    const resp = await api.scheduledTask.triggerScheduledTask('StickyRecoverSweep');
    expect(resp.ok, `trigger ${resp.status}`).toBeTruthy();
    console.log('[E2E] sweep triggered');
  });

  let stickyPk = 0;
  await test.step('2. wait for sticky session with txnId (up to 6 min)', async () => {
    const session = await waitForStickyTransactionId(db, CCT_PK, 360_000);
    stickyPk = Number(session.pk);
    expect(session.sticky_transaction_id).toBeTruthy();
    console.log(`[E2E] session: stickyPk=${stickyPk} txnId=${session.sticky_transaction_id} status=${session.recovery_status}`);
  });

  await test.step('3. validate outbound log', async () => {
    const outbound = await waitForStickyOutboundLog(db, ACCOUNT_PK, { timeoutMs: 30_000 });
    console.log(`[E2E] outbound pk=${outbound.pk} response=${outbound.response ? 'present' : 'NULL'}`);
  });

  await test.step('4. monitor recovery (up to 5 min)', async () => {
    const start = Date.now();
    while (Date.now() - start < 300_000) {
      const row = await db.queryOne<{ recovery_status: string; number_of_attempts: string }>(
        `SELECT recovery_status, number_of_attempts::text FROM uown_sticky WHERE pk = $1`, [stickyPk],
      );
      const status = row?.recovery_status ?? '';
      const attempts = Number(row?.number_of_attempts ?? 0);
      console.log(`[E2E] status=${status} attempts=${attempts}`);
      if (status === 'RECOVERED') { console.log('[E2E] RECOVERY SUCCESSFUL!'); break; }
      if (status === 'FAILED' || status === 'CANCELED') { console.log(`[E2E] Recovery ended: ${status}`); break; }
      await sleep(15_000);
    }
  });

  await test.step('5. final state: webhooks + retries + activity log', async () => {
    const inbound = await db.query<{ event_type: string; status: string }>(
      `SELECT event_type, status FROM uown_sticky_inbound_log WHERE sticky_pk = $1 ORDER BY pk`, [stickyPk],
    );
    console.log(`[E2E] ${inbound.length} webhooks: ${inbound.map(r => `${r.event_type}=${r.status}`).join(', ') || 'none'}`);

    const retries = await db.query<{ attempt_number: string; retry_status: string; amount: string }>(
      `SELECT attempt_number, retry_status, amount FROM uown_sticky_retry_attempt WHERE sticky_pk = $1 ORDER BY attempt_number`, [stickyPk],
    );
    console.log(`[E2E] ${retries.length} retries: ${retries.map(r => `#${r.attempt_number}=${r.retry_status} $${r.amount}`).join(', ') || 'none'}`);

    const logs = await db.query<{ log_type: string; description: string }>(
      `SELECT log_type, description FROM uown_sv_activity_log WHERE account_pk = $1 AND description ILIKE '%sticky%' ORDER BY pk DESC LIMIT 5`, [ACCOUNT_PK],
    );
    console.log(`[E2E] ${logs.length} STICKY activity logs: ${logs.map(r => `[${r.log_type}] ${r.description.slice(0, 80)}`).join(', ') || 'none'}`);
  });
});

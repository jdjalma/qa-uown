import { test } from '@fixtures/test-context.fixture.js';
test.describe('check-stg-ach', () => {
  test.use({ envName: 'stg' });
  test('check ACH tasks + eligible accounts', async ({ db }) => {
    // All ACH/payment related tasks
    const tasks = await db.query<{ pk: string; scheduled_task_name: string; is_active: boolean; last_trigger_time: string }>(
      `SELECT pk, scheduled_task_name, is_active, last_trigger_time::date AS last_trigger_time
       FROM uown_scheduled_task
       WHERE scheduled_task_name ILIKE '%ach%' OR scheduled_task_name ILIKE '%profituity%'
          OR scheduled_task_name ILIKE '%creditcard%' OR scheduled_task_name ILIKE '%ccpayment%'
          OR scheduled_task_name ILIKE '%sweep%'
       ORDER BY scheduled_task_name`, []);
    console.log('\n=== Scheduled Tasks ACH/Sweep ===');
    tasks.forEach(t => console.log(`  ${t.is_active ? '✅' : '❌'} pk=${t.pk} | ${t.scheduled_task_name} | last: ${t.last_trigger_time ?? 'never'}`));

    // Eligible accounts for ACH tests (ACTIVE, no active arrangement, has receivables)
    const accounts = await db.query<{ pk: string; status: string; has_receivable: boolean }>(
      `SELECT a.pk, a.account_status AS status,
              EXISTS(SELECT 1 FROM uown_sv_receivable r
                     WHERE r.account_pk = a.pk AND r.status = 'ACTIVE'
                       AND r.allocation_status IN ('UNPAID','PARTIALLY_PAID')
                       AND r.receivable_type IN ('REGULAR_PAYMENT','PROCESSING_FEE')) AS has_receivable
       FROM uown_sv_account a
       WHERE a.account_status = 'ACTIVE'
         AND NOT EXISTS (SELECT 1 FROM uown_sv_payment_arrangement pa
                         WHERE pa.account_pk = a.pk AND pa.is_active = true)
       ORDER BY a.row_created_timestamp DESC LIMIT 10`, []);
    console.log('\n=== Eligible Accounts (ACTIVE, no active arrangement) ===');
    accounts.forEach((a, i) => console.log(`  [${i}] pk=${a.pk}  has_receivable=${a.has_receivable}`));
  });
});

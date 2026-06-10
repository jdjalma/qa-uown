import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  console.log(`env=${env}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const r1 = await client.query(`
      UPDATE uown_sv_credit_card_transaction
         SET posting_date = CURRENT_DATE - INTERVAL '7 days',
             cc_transaction_type = 'SCHEDULED',
             cc_action = 'SALE',
             comment = 'Sticky 485 manual setup',
             row_updated_timestamp = NOW()
       WHERE pk = 82934
   RETURNING pk, posting_date, cc_transaction_type, cc_action, comment
    `);
    console.log('cct update:', r1.rows);

    const r2 = await client.query(`
      UPDATE uown_sv_account
         SET rating = NULL,
             row_updated_timestamp = NOW()
       WHERE pk = 17169
   RETURNING pk, account_status, rating
    `);
    console.log('account update:', r2.rows);

    const r3 = await client.query(`
      UPDATE uown_sv_sched_summary
         SET delinquency_as_of_date = CURRENT_DATE - INTERVAL '7 days',
             row_updated_timestamp = NOW()
       WHERE account_pk = 17169
   RETURNING account_pk, delinquency_as_of_date
    `);
    console.log('sched_summary update:', r3.rows);

    // Re-evaluate the EXACT sweep WHERE clause against this cct alone
    const r4 = await client.query(`
      SELECT cct.pk AS cct_pk, a.pk AS account_pk,
             cct.status, cct.cc_vendor, cct.posting_date,
             cct.cc_transaction_type, cct.cc_action, cct.agent_username,
             a.account_status, a.rating,
             cct.error, cct.comment,
             s.delinquency_as_of_date,
             cc.auto_pay AS cc_auto_pay,
             EXISTS(
               SELECT 1 FROM uown_sticky st
                WHERE st.cc_transaction_pk = cct.pk
                  AND st.sticky_transaction_id IS NOT NULL
             ) AS already_in_sticky
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
        JOIN uown_sv_credit_card cc ON cc.account_pk = a.pk AND cc.auto_pay = true
       WHERE cct.pk = 82934
    `);
    console.log('post-update snapshot:');
    console.table(r4.rows);

    // Final eligibility check — runs the exact sweep query bounded to this cct
    const r5 = await client.query(`
      SELECT COUNT(*)::int AS eligible
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
        JOIN uown_sv_credit_card cc ON cc.auto_pay = true AND cc.account_pk = a.pk
       WHERE cct.pk = 82934
         AND cct.status = 'DENIED'
         AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
         AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
         AND cct.agent_username NOT IN ('SpecialProcess#5014')
         AND cct.cc_transaction_type = 'SCHEDULED'
         AND cct.cc_action = 'SALE'
         AND a.account_status = 'ACTIVE'
         AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))
         AND (cct.error IS NULL OR cct.error NOT IN (
              'Card is expired','Card number error','Closed account',
              'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
              'Withdrawal limit exceeded','PIN tries exceeded'))
         AND s.delinquency_as_of_date <= CURRENT_DATE
         AND cct.comment NOT LIKE 'Idempotent transaction was run. %'
         AND NOT EXISTS (
              SELECT 1 FROM uown_sticky st
               WHERE st.cc_transaction_pk = cct.pk
                 AND st.sticky_transaction_id IS NOT NULL
         )
    `);
    console.log(`SWEEP ELIGIBILITY for cct 82934: ${r5.rows[0].eligible === 1 ? '✅ PASSES' : '❌ STILL BLOCKED'}`);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ROLLBACK:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });

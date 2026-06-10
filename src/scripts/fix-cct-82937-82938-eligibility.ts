import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';
import crypto from 'node:crypto';

const ACCOUNT_PK = 17179;
const CCT_PKS = [82937, 82938];

async function q(c: pg.PoolClient, label: string, sql: string, params: any[] = []) {
  console.log(`\n=== ${label} ===`);
  const r = await c.query(sql, params);
  if (r.rows.length === 0) console.log('(0 rows)');
  else console.table(r.rows);
  return r;
}

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const config = new ConfigEnvironment(env);
  const pool = new pg.Pool({ connectionString: config.dbConnectionString, max: 1 });
  console.log(`env=${env} account=${ACCOUNT_PK} ccts=${CCT_PKS.join(',')}`);

  const client = await pool.connect();
  try {
    // ── pre-state
    await q(client, 'account', `
      SELECT pk, lead_pk, account_status, rating, auto_pay_types
        FROM uown_sv_account WHERE pk=$1`, [ACCOUNT_PK]);

    await q(client, 'sched_summary', `
      SELECT account_pk, delinquency_as_of_date
        FROM uown_sv_sched_summary WHERE account_pk=$1`, [ACCOUNT_PK]);

    await q(client, 'credit_card (auto_pay=true)', `
      SELECT pk, auto_pay, is_valid_card, cc_last_four_digit, is_deleted
        FROM uown_sv_credit_card WHERE account_pk=$1 ORDER BY pk DESC`, [ACCOUNT_PK]);

    await q(client, 'CCTs ALVO — pré', `
      SELECT pk, status, cc_transaction_type, cc_action, cc_vendor,
             posting_date, gateway_transaction_id,
             SUBSTRING(error FROM 1 FOR 60) AS error_excerpt,
             SUBSTRING(comment FROM 1 FOR 60) AS comment_excerpt,
             agent_username, amount, payment_arrangement_pk
        FROM uown_sv_credit_card_transaction WHERE pk = ANY($1) ORDER BY pk`, [CCT_PKS]);

    // ── UPDATEs em transação
    await client.query('BEGIN');

    // (1) garantir conta ACTIVE + rating fora de B/C/D/P
    const r1 = await client.query(`
      UPDATE uown_sv_account
         SET account_status = 'ACTIVE',
             rating = NULL,
             row_updated_timestamp = NOW()
       WHERE pk = $1
   RETURNING pk, account_status, rating
    `, [ACCOUNT_PK]);
    console.log('\naccount update:', r1.rows);

    // (2) sched_summary.delinquency_as_of_date <= today
    const r2 = await client.query(`
      UPDATE uown_sv_sched_summary
         SET delinquency_as_of_date = CURRENT_DATE - INTERVAL '7 days',
             row_updated_timestamp = NOW()
       WHERE account_pk = $1
   RETURNING account_pk, delinquency_as_of_date
    `, [ACCOUNT_PK]);
    console.log('sched_summary update:', r2.rows);

    // (3) garantir cc.auto_pay=true e is_valid_card=true e não deletado
    const r3 = await client.query(`
      UPDATE uown_sv_credit_card
         SET auto_pay = true,
             is_valid_card = true,
             is_deleted = false,
             row_updated_timestamp = NOW()
       WHERE account_pk = $1
   RETURNING pk, auto_pay, is_valid_card, is_deleted
    `, [ACCOUNT_PK]);
    console.log('credit_card update:', r3.rows);

    // (4) CCTs:
    //     - status=DENIED, cc_transaction_type=SCHEDULED, cc_action=SALE
    //     - posting_date=today-7d
    //     - gateway_transaction_id preenchido (requisito implícito de submissão)
    //     - error='Insufficient funds' (fora da lista de não-retentáveis)
    //     - comment='Sticky 82937/82938 manual setup' (não NULL e não LIKE 'Idempotent…')
    for (const pk of CCT_PKS) {
      const gatewayId = `setup-${pk}-${crypto.randomBytes(8).toString('hex')}`;
      const r = await client.query(`
        UPDATE uown_sv_credit_card_transaction
           SET status = 'DENIED',
               cc_transaction_type = 'SCHEDULED',
               cc_action = 'SALE',
               cc_vendor = 'CHANNEL_PAYMENTS_CC',
               posting_date = CURRENT_DATE - INTERVAL '7 days',
               gateway_transaction_id = $2,
               error = 'Insufficient funds',
               comment = 'Sticky manual setup — cct ' || $1::text,
               row_updated_timestamp = NOW()
         WHERE pk = $1
     RETURNING pk, status, cc_transaction_type, cc_action, posting_date,
               gateway_transaction_id, error, comment
      `, [pk, gatewayId]);
      console.log(`cct ${pk} update:`, r.rows);
    }

    // ── elegibilidade clause-by-clause via SQL canônico do sweep
    const elig = await client.query(`
      SELECT cct.pk AS cct_pk,
             (cct.status = 'DENIED')                                       AS c1_status,
             (cct.cc_vendor = 'CHANNEL_PAYMENTS_CC')                        AS c2_vendor,
             (cct.posting_date = CURRENT_DATE - INTERVAL '7 days')          AS c3_posting,
             (cct.agent_username NOT IN ('SpecialProcess#5014'))            AS c4_agent,
             (cct.cc_transaction_type = 'SCHEDULED')                        AS c5_tx_type,
             (cct.cc_action = 'SALE')                                       AS c6_action,
             (a.account_status = 'ACTIVE')                                  AS c7_acct,
             (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))        AS c8_rating,
             (cct.error IS NULL OR cct.error NOT IN (
                'Card is expired','Card number error','Closed account',
                'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
                'Withdrawal limit exceeded','PIN tries exceeded'))          AS c9_error,
             (s.delinquency_as_of_date <= CURRENT_DATE)                     AS c10_delinq,
             (cct.comment NOT LIKE 'Idempotent transaction was run. %')     AS c11_comment,
             (NOT EXISTS (SELECT 1 FROM uown_sticky st
                          WHERE st.cc_transaction_pk = cct.pk
                            AND st.sticky_transaction_id IS NOT NULL))     AS c12_dedupe,
             (cc.auto_pay = true)                                           AS c13_cc_autopay
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON s.account_pk = a.pk
        JOIN uown_sv_credit_card cc ON cc.account_pk = a.pk AND cc.auto_pay = true
       WHERE cct.pk = ANY($1)
       ORDER BY cct.pk
    `, [CCT_PKS]);
    console.log('\n=== Elegibilidade cláusula-por-cláusula (todas devem ser true) ===');
    console.table(elig.rows);

    const passCount = await client.query(`
      SELECT cct.pk AS cct_pk
        FROM uown_sv_credit_card_transaction cct
        JOIN uown_sv_account a ON a.pk = cct.account_pk
        JOIN uown_sv_sched_summary s ON a.pk = s.account_pk
        JOIN uown_sv_credit_card cc ON cc.auto_pay = true AND cc.account_pk = a.pk
       WHERE cct.pk = ANY($1)
         AND cct.status = 'DENIED' AND cct.cc_vendor = 'CHANNEL_PAYMENTS_CC'
         AND cct.posting_date = CURRENT_DATE - INTERVAL '7 days'
         AND cct.agent_username NOT IN ('SpecialProcess#5014')
         AND cct.cc_transaction_type = 'SCHEDULED' AND cct.cc_action = 'SALE'
         AND a.account_status = 'ACTIVE'
         AND (a.rating IS NULL OR a.rating NOT IN ('P','C','D','B'))
         AND (cct.error IS NULL OR cct.error NOT IN (
              'Card is expired','Card number error','Closed account',
              'Hold card (stolen)','Hold card (pick up card)','Hold card (lost)',
              'Withdrawal limit exceeded','PIN tries exceeded'))
         AND s.delinquency_as_of_date <= CURRENT_DATE
         AND cct.comment NOT LIKE 'Idempotent transaction was run. %'
         AND NOT EXISTS (SELECT 1 FROM uown_sticky st
                         WHERE st.cc_transaction_pk = cct.pk
                           AND st.sticky_transaction_id IS NOT NULL)
    `, [CCT_PKS]);
    console.log(`\nCCTs que PASSAM o SQL canônico do sweep (esperado=${CCT_PKS.length}):`,
                passCount.rows.map(r => r.cct_pk));

    await client.query('COMMIT');
    console.log('\nCOMMIT aplicado.');
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

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const acc = await p.query(`
      SELECT pk, lead_pk, account_status, rating, auto_pay_types
        FROM uown_sv_account WHERE pk = 17169`);
    console.log('account 17169:'); console.table(acc.rows);

    const lead = await p.query(`
      SELECT pk, status, partner_id FROM uown_los_lead
       WHERE pk = (SELECT lead_pk FROM uown_sv_account WHERE pk=17169)`);
    console.log('lead:'); console.table(lead.rows);

    const cc = await p.query(`
      SELECT pk, auto_pay, is_valid_card, cc_last_four_digit, cc_exp, is_deleted
        FROM uown_sv_credit_card WHERE account_pk = 17169 ORDER BY pk DESC`);
    console.log('credit cards:'); console.table(cc.rows);

    const pa = await p.query(`
      SELECT pk, account_pk, status, total_amount, number_of_installments,
             frequency, start_date, row_created_timestamp
        FROM uown_sv_payment_arrangement WHERE account_pk = 17169
       ORDER BY pk DESC LIMIT 5`);
    console.log('existing payment arrangements:'); console.table(pa.rows);

    // any receivable still open?
    const recCols = await p.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name='uown_sv_receivable' ORDER BY ordinal_position`);
    console.log('receivable cols:', recCols.rows.map(r => r.column_name).join(','));

    const rec = await p.query(`
      SELECT pk, receivable_type, due_date
        FROM uown_sv_receivable
       WHERE account_pk = 17169
       ORDER BY due_date LIMIT 8`);
    console.log('open receivables:'); console.table(rec.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

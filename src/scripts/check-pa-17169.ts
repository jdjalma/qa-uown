import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const c = new ConfigEnvironment(process.argv[2] ?? 'sandbox');
  const p = new pg.Pool({ connectionString: c.dbConnectionString, max: 1 });
  try {
    const cols = await p.query(`
      SELECT column_name FROM information_schema.columns
       WHERE table_name='uown_sv_payment_arrangement' ORDER BY ordinal_position`);
    console.log('PA cols:', cols.rows.map(r=>r.column_name).join(','));

    const pa = await p.query(`
      SELECT * FROM uown_sv_payment_arrangement
       WHERE account_pk=17169 ORDER BY pk DESC LIMIT 3`);
    console.log('PAs for 17169:'); console.table(pa.rows);

    // Pending CCTs created today
    const cct = await p.query(`
      SELECT pk, status, cc_transaction_type, cc_action, amount, posting_date,
             SUBSTRING(comment FROM 1 FOR 80) AS comment_excerpt, row_created_timestamp
        FROM uown_sv_credit_card_transaction
       WHERE account_pk=17169 AND row_created_timestamp > NOW() - INTERVAL '15 minutes'
       ORDER BY pk DESC LIMIT 10`);
    console.log('CCTs criadas nos últimos 15 min:'); console.table(cct.rows);

    // Lead notes
    const ln = await p.query(`
      SELECT pk, note_text_subject, row_created_timestamp,
             SUBSTRING(note_text FROM 1 FOR 120) AS note_excerpt
        FROM uown_los_lead_notes
       WHERE lead_pk = (SELECT lead_pk FROM uown_sv_account WHERE pk=17169)
         AND row_created_timestamp > NOW() - INTERVAL '15 minutes'
       ORDER BY pk DESC LIMIT 10`);
    console.log('Lead notes recentes:'); console.table(ln.rows);
  } finally {
    await p.end();
  }
}
main().catch(e => { console.error(e); process.exit(1); });

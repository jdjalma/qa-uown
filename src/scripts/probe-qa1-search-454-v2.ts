import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const q = async (label: string, sql: string, params: unknown[] = []) => {
      const r = await pool.query(sql, params);
      console.log(`\n— ${label} —`);
      console.log(JSON.stringify(r.rows, null, 2).slice(0, 4000));
    };

    await q('actual merchant count + sample', `SELECT COUNT(*) AS total FROM uown_merchant`);
    await q(
      'distinct merchant ref codes (top 12)',
      `SELECT ref_merchant_code, is_active FROM uown_merchant ORDER BY pk DESC LIMIT 12`,
    );

    await q(
      'target indexes existence in qa1',
      `SELECT indexname, tablename
       FROM pg_indexes
       WHERE indexname IN (
         'idx_phone_type','idx_los_email_email_type',
         'idx_merchant_support_lower_ccnew','idx_uown_merchant_client_type_ccnew',
         'idx_uown_merchant_is_active_ccnew','idx_uown_merchant_is_deleted_ccnew',
         'idx_uown_merchant_location_name_ccnew','idx_uown_merchant_merchant_name_ccnew',
         'idx_uown_merchant_ref_merchant_code_ccnew'
       )
       ORDER BY indexname`,
    );

    // Search-ready test lead: one with each searchable field populated
    await q(
      'fully-populated test lead (good for happy-path matrix)',
      `SELECT l.pk AS leadPk, l.account_pk AS accountPk, l.uuid,
              c.first_name, c.last_name, c.ssn,
              e.email_address AS email,
              (p.area_code || p.phone_number) AS phone,
              i.merchant_invoice_number AS invoiceNumber,
              (SELECT cc.cc_last_four_digit FROM uown_los_credit_card cc WHERE cc.lead_pk = l.pk LIMIT 1) AS last4cc,
              m.ref_merchant_code,
              l.lead_status
       FROM uown_los_lead l
       JOIN uown_merchant m ON l.merchant_pk = m.pk
       JOIN uown_los_customer c ON c.lead_pk = l.pk
       JOIN uown_los_email e ON e.lead_pk = l.pk AND e.email_type='PRIMARY'
       JOIN uown_los_phone p ON p.lead_pk = l.pk AND p.phone_type='MOBILE'
       JOIN uown_los_invoice i ON i.lead_pk = l.pk
       WHERE EXISTS (SELECT 1 FROM uown_los_credit_card cc WHERE cc.lead_pk = l.pk)
         AND l.lead_status = 'FUNDED'
       ORDER BY l.row_created_timestamp DESC
       LIMIT 3`,
    );

    // EXPLAIN of the dedup query for searchType=last4CC against lead 4019 (26 CCs)
    // Just count what the query would return for that lead pre-vs-post dedup
    await q(
      'simulated /simpleSearch by lead 4019 with searchType=last4CC — pre-dedup row count',
      `SELECT COUNT(*) AS rows_before_dedup
       FROM uown_los_lead l
       LEFT JOIN uown_los_credit_card cc ON cc.lead_pk = l.pk
       WHERE l.pk = 4019`,
    );

    // EXPLAIN ANALYZE the actual current query for default search by name
    await q(
      'EXPLAIN ANALYZE — current search by name (top-cost estimate)',
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
       WITH searchResults AS (
         SELECT DISTINCT ON (lead.pk)
           lead.pk, lead.account_pk,
           ROW_NUMBER() OVER (PARTITION BY lead.pk, NULL ORDER BY 1) AS row_num
         FROM uown_los_lead lead
         JOIN uown_merchant merchant ON lead.merchant_pk = merchant.pk
         JOIN uown_los_customer customer ON customer.lead_pk = lead.pk
         LEFT JOIN uown_los_email email ON email.lead_pk = lead.pk AND email.email_type='PRIMARY'
         LEFT JOIN uown_los_phone phone ON phone.lead_pk = lead.pk AND phone.phone_type='MOBILE'
         LEFT JOIN uown_los_invoice invoice ON invoice.lead_pk = lead.pk
         LEFT JOIN uown_los_credit_card cc ON cc.lead_pk = lead.pk
         WHERE UPPER('TEST') IN (UPPER(customer.first_name), UPPER(customer.last_name))
         ORDER BY lead.pk DESC
       )
       SELECT * FROM searchResults WHERE row_num=1 LIMIT 50`,
    );
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

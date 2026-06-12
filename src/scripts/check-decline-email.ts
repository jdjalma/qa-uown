import * as dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa2');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    // Buscar lead pelo email em uown_los_email (FK = lead_pk)
    const leads = await pool.query(
      `SELECT l.pk, l.internal_status, l.lead_status, l.row_created_timestamp,
              e.email_address, e.email_type
       FROM uown_los_lead l
       JOIN uown_los_email e ON e.lead_pk = l.pk
       WHERE UPPER(e.email_address) = UPPER('fibipo7876@lidugw.com')
       ORDER BY l.pk DESC LIMIT 5`
    );
    console.log('LEADS encontrados:', leads.rows.length);
    leads.rows.forEach((r: any) => console.log(JSON.stringify(r)));

    // Checar email_queue pelos leads encontrados
    if (leads.rows.length > 0) {
      const leadPks = leads.rows.map((r: any) => r.pk);
      const eq = await pool.query(
        `SELECT lead_pk, pk, template_name, to_email_addresses, status, sent_time, row_created_timestamp
         FROM uown_email_queue
         WHERE lead_pk = ANY($1)
         ORDER BY pk DESC LIMIT 10`,
        [leadPks]
      );
      console.log('\nEMAIL_QUEUE:', eq.rows.length);
      eq.rows.forEach((r: any) => console.log(JSON.stringify(r)));
    } else {
      // Fallback: últimos leads criados nas últimas 2h
      const recent = await pool.query(
        `SELECT l.pk, l.internal_status, l.lead_status, l.row_created_timestamp,
                e.email_address
         FROM uown_los_lead l
         JOIN uown_los_email e ON e.lead_pk = l.pk
         WHERE l.row_created_timestamp >= NOW() - INTERVAL '2 hours'
         ORDER BY l.pk DESC LIMIT 10`
      );
      console.log('\nLeads recentes (últimas 2h):', recent.rows.length);
      recent.rows.forEach((r: any) => console.log(JSON.stringify(r)));
    }
  } finally {
    await pool.end();
  }
}
main().catch(console.error);

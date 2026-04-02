import { DatabaseHelpers } from '../helpers/database.helpers.js';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const env = new ConfigEnvironment('stg');
  const db = new DatabaseHelpers(env.dbConnectionString);
  
  const rows = await db.query<{ merchant_name: string; location_name: string; account_count: string }>(`
    SELECT m.merchant_name, m.location_name, COUNT(a.pk)::text as account_count
    FROM uown_merchant m
    JOIN uown_los_lead l ON l.merchant_pk = m.pk
    JOIN uown_sv_account a ON a.lead_pk = l.pk
    WHERE m.is_deleted IS FALSE
      AND a.account_status = 'ACTIVE'
    GROUP BY m.merchant_name, m.location_name
    ORDER BY COUNT(a.pk) DESC LIMIT 10
  `);
  console.log('STG - Merchants with active accounts:');
  rows.forEach(r => console.log(`  "${r.merchant_name}" | "${r.location_name}" | ${r.account_count} accounts`));
  
  await db.close?.();
}
main().catch(console.error).finally(() => process.exit(0));

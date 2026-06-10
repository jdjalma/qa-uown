/**
 * Probe script for Settled In Full task 491.
 * Usage: ENVIRONMENT=qa2 node --loader tsx scripts/probe-sif-491.ts
 */
import { ConfigEnvironment } from '../src/config/environment.js';
import { DatabaseHelpers } from '../src/helpers/database.helpers.js';

async function main() {
  const env = new ConfigEnvironment(process.env.ENVIRONMENT || 'qa2');
  const db = new DatabaseHelpers(env.dbConnectionString);

  console.log('--- (a) Accounts the sweep predicate picks for TODAY ---');
  const eligible = await db.query(
    `SELECT a.pk, a.company, a.account_status, a.rating,
            a.settled_in_full_date_time::date AS sif_date
       FROM uown_sv_account a
      WHERE a.account_status = 'SETTLED_IN_FULL'
        AND a.settled_in_full_date_time IS NOT NULL
        AND (a.rating NOT IN ('E','F','U') OR a.rating IS NULL)
        AND (CASE
               WHEN extract(DOW FROM CURRENT_DATE) IN (1, 2) THEN a.settled_in_full_date_time::date = CURRENT_DATE - 4
               WHEN extract(DOW FROM CURRENT_DATE) = 3       THEN a.settled_in_full_date_time::date IN (CURRENT_DATE - 4, CURRENT_DATE - 3, CURRENT_DATE - 2)
               ELSE                                                a.settled_in_full_date_time::date = CURRENT_DATE - 2
             END)
      ORDER BY a.settled_in_full_date_time DESC
      LIMIT 20`,
  );
  console.table(eligible);
  console.log(`TOTAL eligible picks: ${eligible.length}`);

  console.log('\n--- (b) uown_email_queue rows in last 1 hour, grouped by template_name ---');
  const recent = await db.query(
    `SELECT template_name, COUNT(*) AS n, MIN(row_created_timestamp) AS earliest, MAX(row_created_timestamp) AS latest
       FROM uown_email_queue
      WHERE row_created_timestamp >= now() - INTERVAL '1 hour'
      GROUP BY template_name
      ORDER BY n DESC`,
  );
  console.table(recent);

  console.log('\n--- (c) Distinct template_name in last 2 hours matching SettledInFull ---');
  const sifTemplates = await db.query(
    `SELECT DISTINCT template_name
       FROM uown_email_queue
      WHERE row_created_timestamp >= now() - INTERVAL '2 hours'
        AND template_name ILIKE '%SettledInFull%'`,
  );
  console.table(sifTemplates);

  console.log('\n--- (d) Account 11263 snapshot ---');
  const acct11263 = await db.queryOne(
    `SELECT pk, settled_in_full_date_time, rating, company, account_status
       FROM uown_sv_account
      WHERE pk = 11263`,
  );
  console.log(acct11263);

  console.log('\n--- extra: today DOW and CURRENT_DATE from DB ---');
  const today = await db.queryOne(
    `SELECT CURRENT_DATE AS current_date, extract(DOW FROM CURRENT_DATE) AS dow`,
  );
  console.log(today);

  await db.close?.();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

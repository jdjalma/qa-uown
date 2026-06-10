// Probe queries for Settled In Full task 491 — SELECT-only.
// Usage: node scripts/probe-sif-491.mjs
import 'dotenv/config';
import pg from 'pg';

const jdbc = process.env.UOWN_DB_URL_QA2;
const user = process.env.UOWN_DB_USER_QA2;
const pass = process.env.UOWN_DB_PASS_QA2;
if (!jdbc || !user || !pass) {
  console.error('Missing UOWN_DB_*_QA2 env vars');
  process.exit(1);
}
// jdbc:postgresql://host:port/db -> postgresql://user:pass@host:port/db
const stripped = jdbc.replace(/^jdbc:/, '');
const url = new URL(stripped);
url.username = encodeURIComponent(user);
url.password = encodeURIComponent(pass);
const connectionString = url.toString();

const client = new pg.Client({ connectionString });
await client.connect();

async function q(label, sql, params = []) {
  const res = await client.query(sql, params);
  console.log(`\n=== ${label} (rows: ${res.rowCount}) ===`);
  if (res.rows.length > 0) console.table(res.rows);
  return res.rows;
}

await q(
  'today DOW / CURRENT_DATE',
  `SELECT CURRENT_DATE AS current_date, extract(DOW FROM CURRENT_DATE) AS dow`,
);

await q(
  '(a) Accounts sweep predicate picks for TODAY',
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

await q(
  '(b) uown_email_queue rows in last 1 hour, grouped by template_name',
  `SELECT template_name, COUNT(*)::int AS n, MIN(row_created_timestamp) AS earliest, MAX(row_created_timestamp) AS latest
     FROM uown_email_queue
    WHERE row_created_timestamp >= now() - INTERVAL '1 hour'
    GROUP BY template_name
    ORDER BY n DESC`,
);

await q(
  '(c) Distinct SettledInFull template_name in last 2 hours',
  `SELECT DISTINCT template_name
     FROM uown_email_queue
    WHERE row_created_timestamp >= now() - INTERVAL '2 hours'
      AND template_name ILIKE '%SettledInFull%'`,
);

await q(
  '(d) Account 11263 snapshot',
  `SELECT pk, settled_in_full_date_time, rating, company, account_status
     FROM uown_sv_account
    WHERE pk = 11263`,
);

await client.end();

import pg from 'pg';
import { ConfigEnvironment } from '../config/environment.js';

async function main() {
  const cfg = new ConfigEnvironment('qa1');
  const pool = new pg.Pool({ connectionString: cfg.dbConnectionString, max: 1 });
  try {
    const sinceUtc = '2026-05-24 10:00:00';
    const leadPks = [11904, 11908, 11911, 11912, 11913, 11914, 11925, 11926, 11927, 11928, 11929, 11945, 12007, 12009, 12011, 12012, 12013, 12014];
    const accountPks = [4868, 4878, 4900, 4936, 4937];

    for (const table of [
      'uown_los_outbound_api_log',
      'uown_los_inbound_api_log',
      'uown_sv_outbound_api_log',
      'uown_sv_inbound_api_log',
    ]) {
      console.log(`\n=== ${table} — rows with non-empty stack_trace since ${sinceUtc} ===`);
      const hasLeadCol = table === 'uown_los_outbound_api_log';
      const hasAcctCol = table === 'uown_sv_outbound_api_log';
      const extraCol = hasLeadCol ? ', lead_pk' : hasAcctCol ? ', account_pk' : '';
      const stackErrors = await pool.query(
        `SELECT pk, row_created_timestamp, api, call_type, url${extraCol},
                LEFT(stack_trace, 220) AS stack_excerpt
           FROM ${table}
          WHERE row_created_timestamp >= $1::timestamp
            AND stack_trace IS NOT NULL
            AND length(trim(stack_trace)) > 0
          ORDER BY pk DESC
          LIMIT 30`,
        [sinceUtc],
      );
      console.log(`  count with stack_trace: ${stackErrors.rows.length}`);
      for (const r of stackErrors.rows.slice(0, 12)) {
        console.log('   ', JSON.stringify({
          pk: r.pk, ts: r.row_created_timestamp, api: r.api, call_type: r.call_type,
          url: String(r.url ?? '').slice(0, 80), lead_pk: r.lead_pk, account_pk: r.account_pk,
          stack: String(r.stack_excerpt ?? '').replace(/\s+/g, ' ').slice(0, 180),
        }));
      }

      // Also scan response JSON for HTTP error indicators (4xx/5xx) or "error" keyword
      console.log(`\n--- ${table} — rows where response JSON contains error markers ---`);
      const jsonErrors = await pool.query(
        `SELECT pk, row_created_timestamp, api, call_type, url${extraCol},
                LEFT(response, 240) AS response_excerpt
           FROM ${table}
          WHERE row_created_timestamp >= $1::timestamp
            AND (
              response ILIKE '%"status":4%'
              OR response ILIKE '%"status":5%'
              OR response ILIKE '%"errorCode"%'
              OR response ILIKE '%"errorMessage"%'
              OR response ILIKE '%"error":%'
              OR response ILIKE '%BAD_REQUEST%'
              OR response ILIKE '%INTERNAL_SERVER_ERROR%'
              OR response ILIKE '%503%Service%Unavailable%'
            )
          ORDER BY pk DESC
          LIMIT 30`,
        [sinceUtc],
      );
      console.log(`  count: ${jsonErrors.rows.length}`);
      for (const r of jsonErrors.rows.slice(0, 12)) {
        console.log('   ', JSON.stringify({
          pk: r.pk, ts: r.row_created_timestamp, api: r.api,
          url: String(r.url ?? '').slice(0, 80), lead_pk: r.lead_pk, account_pk: r.account_pk,
          resp: String(r.response_excerpt ?? '').replace(/\s+/g, ' ').slice(0, 200),
        }));
      }

      // Cross-filter to OUR leads/accounts
      if (hasLeadCol) {
        const ourLeadErrors = await pool.query(
          `SELECT pk, row_created_timestamp, api, call_type, url, lead_pk,
                  LEFT(response, 240) AS response_excerpt,
                  LEFT(stack_trace, 220) AS stack_excerpt
             FROM ${table}
            WHERE lead_pk = ANY($1::int[])
              AND (
                (stack_trace IS NOT NULL AND length(trim(stack_trace)) > 0)
                OR response ILIKE '%"status":4%'
                OR response ILIKE '%"status":5%'
                OR response ILIKE '%errorMessage%'
                OR response ILIKE '%BAD_REQUEST%'
              )
            ORDER BY pk DESC
            LIMIT 30`,
          [leadPks],
        );
        console.log(`\n>>> ${table} — errors on OUR leadPks (${leadPks.length} leads): ${ourLeadErrors.rows.length}`);
        for (const r of ourLeadErrors.rows.slice(0, 12)) {
          console.log('   ', JSON.stringify({
            pk: r.pk, ts: r.row_created_timestamp, api: r.api, lead_pk: r.lead_pk,
            url: String(r.url ?? '').slice(0, 80),
            resp: String(r.response_excerpt ?? '').replace(/\s+/g, ' ').slice(0, 180),
            stack: String(r.stack_excerpt ?? '').replace(/\s+/g, ' ').slice(0, 100),
          }));
        }
      }
      if (hasAcctCol) {
        const ourAcctErrors = await pool.query(
          `SELECT pk, row_created_timestamp, api, call_type, url, account_pk,
                  LEFT(response, 240) AS response_excerpt,
                  LEFT(stack_trace, 220) AS stack_excerpt
             FROM ${table}
            WHERE account_pk = ANY($1::int[])
              AND (
                (stack_trace IS NOT NULL AND length(trim(stack_trace)) > 0)
                OR response ILIKE '%"status":4%'
                OR response ILIKE '%"status":5%'
                OR response ILIKE '%errorMessage%'
                OR response ILIKE '%BAD_REQUEST%'
              )
            ORDER BY pk DESC
            LIMIT 30`,
          [accountPks],
        );
        console.log(`\n>>> ${table} — errors on OUR accountPks (${accountPks.length}): ${ourAcctErrors.rows.length}`);
        for (const r of ourAcctErrors.rows.slice(0, 12)) {
          console.log('   ', JSON.stringify({
            pk: r.pk, ts: r.row_created_timestamp, api: r.api, account_pk: r.account_pk,
            url: String(r.url ?? '').slice(0, 80),
            resp: String(r.response_excerpt ?? '').replace(/\s+/g, ' ').slice(0, 180),
            stack: String(r.stack_excerpt ?? '').replace(/\s+/g, ' ').slice(0, 100),
          }));
        }
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

// Check CT-6 PA inbound log details (pks 74, 189 claimed by debugger) + recent
import pg from 'pg';
const { Client } = pg;
const client = new Client({ host: '127.0.0.1', port: 5445, user: 'svc_user', password: 'F1ntech', database: 'svc' });
await client.connect();

const r1 = await client.query(
  `SELECT pk, api, call_type, url, request, response, row_created_timestamp::text
     FROM uown_sv_inbound_api_log
    WHERE api LIKE '%TmsPaymentController.processPaymentArrangement%'
    ORDER BY pk DESC LIMIT 10`);
console.log(`PA inbound logs all-time (count=${r1.rows.length}):`);
for (const row of r1.rows) {
  console.log(`---\npk=${row.pk} ts=${row.row_created_timestamp} call=${row.call_type} url=${row.url}`);
  console.log(`request: ${(row.request || '').slice(0, 300)}`);
  console.log(`response: ${(row.response || '').slice(0, 300)}`);
}

const r2 = await client.query(`SELECT pk, api, call_type, request, response, row_created_timestamp::text FROM uown_sv_inbound_api_log WHERE pk IN (74, 189)`);
console.log(`\nDebugger-cited pks 74/189 (count=${r2.rows.length}):`);
for (const row of r2.rows) {
  console.log(`---\npk=${row.pk} api=${row.api} ts=${row.row_created_timestamp}`);
  console.log(`request: ${(row.request || '').slice(0, 400)}`);
  console.log(`response: ${(row.response || '').slice(0, 400)}`);
}

await client.end();

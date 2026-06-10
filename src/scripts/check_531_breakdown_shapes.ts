import { request } from 'playwright';
import { ConfigEnvironment } from '../config/environment.js';
import { SvcPayoffClient } from '../api/clients/svc-payoff.client.js';

async function main() {
  const env = new ConfigEnvironment('qa1');
  const ctx = await request.newContext({ extraHTTPHeaders: { 'Content-Type': 'application/json' } });
  const client = new SvcPayoffClient(ctx, env);

  for (const accountPk of [4936, 4937]) {
    console.log(`\n=== accountPk=${accountPk} ===`);
    const info = await client.getServicingInfo(accountPk);
    console.log('status:', info.status);
    if (!info.body?.epoBreakdown) {
      console.log('  (no epoBreakdown)');
      continue;
    }
    console.log('epoBreakdown:');
    for (let i = 0; i < info.body.epoBreakdown.length; i++) {
      console.log(`  row[${i}]:`, info.body.epoBreakdown[i]);
    }
  }

  await ctx.dispose();
}

main().catch((err) => { console.error(err); process.exit(1); });

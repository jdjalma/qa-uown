import { request } from 'playwright';
import { ConfigEnvironment } from '../config/environment.js';
import { SvcPayoffClient } from '../api/clients/svc-payoff.client.js';

async function main() {
  const env = new ConfigEnvironment('qa1');
  const ctx = await request.newContext({ extraHTTPHeaders: { 'Content-Type': 'application/json' } });
  const client = new SvcPayoffClient(ctx, env);

  const accountPk = 4936; // lead 12007, post-shift to yesterday

  const payoff = await client.getPayoffAmount(accountPk);
  console.log('getPayoffAmount:');
  console.log('  status:', payoff.status);
  console.log('  body:', payoff.body);

  const accSummary = await client.getAccountSummary(accountPk);
  console.log('\ngetAccountSummary:');
  console.log('  status:', accSummary.status);
  console.log('  epoBalance:', accSummary.body?.epoBalance);
  console.log('  contractBalance:', accSummary.body?.contractBalance);
  console.log('  epoBreakdown rows:', (accSummary.body?.epoBreakdown ?? []).length);

  const servicingInfo = await client.getServicingInfo?.(accountPk);
  if (servicingInfo) {
    console.log('\ngetServicingInfo:');
    console.log('  status:', servicingInfo.status);
    console.log('  epoBreakdown rows:', (servicingInfo.body?.epoBreakdown ?? []).length);
    console.log('  settlementAmount:', servicingInfo.body?.settlementAmount);
    console.log('  epoFeePercent:', servicingInfo.body?.epoFeePercent);
    console.log('  full body keys:', Object.keys(servicingInfo.body ?? {}));
    console.log('  epoBreakdown contents:');
    for (const row of (servicingInfo.body?.epoBreakdown ?? [])) console.log('    ', row);
    console.log('  settlementAmountBreakdown contents:');
    for (const row of (servicingInfo.body?.settlementAmountBreakdown ?? [])) console.log('    ', row);
  } else {
    console.log('\ngetServicingInfo not available on SvcPayoffClient');
  }

  await ctx.dispose();
}

main().catch((err) => { console.error(err); process.exit(1); });

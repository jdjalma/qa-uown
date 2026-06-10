import { ConfigEnvironment } from '../config/environment.js';
import { request as pwRequest } from '@playwright/test';

async function main() {
  const env = process.argv[2] ?? 'sandbox';
  const accountPk = Number(process.argv[3] ?? 17176);
  const config = new ConfigEnvironment(env);

  console.log(`[probe-sticky-endpoint] env=${env} accountPk=${accountPk}`);
  console.log(`svcApi=${config.svcApiUrl}`);

  const ctx = await pwRequest.newContext({
    baseURL: config.svcApiUrl,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': config.apiAuthorization,
      'x-api-key': config.svcApiKey,
      'X-API-KEY': config.svcApiKey,
      'api-key': config.svcApiKey,
      'Api-Key': config.svcApiKey,
    },
  });

  // Hit sticky-recoveries endpoint with same params FE uses
  const url = `/uown/svc/accounts/${accountPk}/sticky-recoveries?page=0&size=1000`;
  console.log(`\n--- GET ${url} ---`);
  const res = await ctx.get(url);
  console.log(`status=${res.status()}`);
  const body = await res.text();
  console.log('body:');
  console.log(body);

  // Also hit getCCTransactions to see row schema
  const url2 = `/uown/svc/getCCTransactions/${accountPk}`;
  console.log(`\n--- GET ${url2} ---`);
  const res2 = await ctx.get(url2);
  console.log(`status=${res2.status()}`);
  const body2 = await res2.text();
  // Just print first transaction for schema reference
  try {
    const arr = JSON.parse(body2);
    if (Array.isArray(arr) && arr.length > 0) {
      console.log('first txn (raw):');
      console.log(JSON.stringify(arr[0], null, 2));
    } else {
      console.log('no transactions or non-array');
      console.log(body2.slice(0, 800));
    }
  } catch {
    console.log(body2.slice(0, 800));
  }

  await ctx.dispose();
}

main().catch(e => { console.error(e); process.exit(1); });

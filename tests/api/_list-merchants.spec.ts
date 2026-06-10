import { test } from '@fixtures/test-context.fixture.js';

test.describe('list-merchants @explore', () => {
  test('get refCode for merchants 34 and 307', async ({ db }) => {
    const rows = await db.query<{
      pk: number; ref_merchant_code: string; merchant_name: string;
      client_type: string; esign_client: string;
      accept_new_apps: boolean; is_active: boolean;
    }>(
      `SELECT pk, ref_merchant_code, merchant_name, client_type, esign_client, accept_new_apps, is_active
       FROM uown_merchant WHERE pk IN (34, 307);`
    );
    console.log(`\n[merchants used by GowSign-tested leads]:`);
    for (const r of rows) {
      console.log(`  pk=${r.pk} refCode=${r.ref_merchant_code} | ${r.merchant_name}`);
      console.log(`    client_type=${r.client_type} esign_client=${r.esign_client} accept_new=${r.accept_new_apps} active=${r.is_active}`);
    }
  });
});

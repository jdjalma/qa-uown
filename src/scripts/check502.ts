import { request as playwrightRequest } from '@playwright/test';
import { ConfigEnvironment } from '@config/environment.js';
import { ApplicationClient } from '@api/clients/application.client.js';
import { buildSendApplicationBody, type ApplicantInfo, type MerchantInfo } from '@api/bodies/application.body.js';

(async () => {
  const cfg = new ConfigEnvironment('qa2');
  console.log('apiKey:', cfg.apiKey ? `${cfg.apiKey.slice(0, 10)}... len=${cfg.apiKey.length}` : '(empty)');
  console.log('apiAuth:', cfg.apiAuthorization ? `${cfg.apiAuthorization.slice(0, 10)}... len=${cfg.apiAuthorization.length}` : '(empty)');
  console.log('svcApiUrl:', cfg.svcApiUrl);

  const ctx = await playwrightRequest.newContext();
  const client = new ApplicationClient(ctx, cfg);

  const merchant: MerchantInfo = { username: 'tireAgent', password: 'U0wn_tireAgent_G4eDIH', number: 'OW90218-0001' };
  const applicant: ApplicantInfo = {
    firstName: 'TestFNxyz', lastName: 'TestLNxyz',
    email: `fintechgroup777+debug${Date.now()}@gmail.com`,
    ssn: '058804041', phone: '6467125831',
    address: '1120 S Grand Ave', city: 'Los Angeles', state: 'CA', zip: '90015',
    dob: '02/24/1987',
  };
  const body = buildSendApplicationBody(merchant, applicant, { orderTotal: '500', description: 'debug' });
  console.log('---BODY---'); console.log(JSON.stringify(body, null, 2));

  const resp = await client.sendApplication(body);
  console.log('---RESP---'); console.log('status:', resp.status, 'ok:', resp.ok);
  console.log('body:', JSON.stringify(resp.body).slice(0, 600));

  await ctx.dispose();
})();

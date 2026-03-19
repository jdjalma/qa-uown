import { MERCHANTS } from '../data/merchants.js';
import { generateTestSSN, generateTestPhone, generateRunId } from '../config/constants.js';
import { ConfigEnvironment } from '../config/environment.js';
import { buildSendApplicationBody } from '../api/bodies/application.body.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.qa1', override: true });
dotenv.config({ path: '.env' });

async function main() {
  const env = new ConfigEnvironment('qa1');
  const m = MERCHANTS['PayPossible'];
  const runId = generateRunId();
  const email = env.generateUniqueEmailAlias();
  const ssn = generateTestSSN(true);

  const body = buildSendApplicationBody(
    { username: m.username, password: m.password, number: m.number },
    {
      firstName: `InvFN${runId.slice(-4)}`,
      lastName: `InvLN${runId.slice(-4)}`,
      email, ssn,
      phone: generateTestPhone(),
      address: '123 Main St', city: 'New York', state: 'NY', zip: '10001', dob: '01/01/1984',
    },
    { orderTotal: '800', description: 'planId fix investigation' },
  );

  delete (body as unknown as Record<string, unknown>)['mainNextPayDate'];
  const svcUrl = `https://svc-qa1.uownleasing.com`;
  console.log('svcUrl:', svcUrl);
  console.log('email:', email, '| ssn:', ssn);
  const res = await fetch(`${svcUrl}/uown/los/sendApplication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const rb = await res.json() as Record<string, unknown>;
  console.log('status:', res.status);
  console.log('appApprovalStatus:', rb['appApprovalStatus']);
  console.log('sorErrorDescription:', rb['sorErrorDescription']);
  const pdl = rb['paymentDetailsList'] as Array<Record<string, unknown>> | undefined;
  console.log('pdl length:', pdl?.length);
  if (pdl?.length) {
    for (const item of pdl) {
      console.log('  planId:', item['planId'], '| redirectUrl:', item['redirectUrl']);
    }
  }
  console.log('providerURL:', rb['providerURL']);
  console.log('accountNumber:', rb['accountNumber']);
}

main().catch(console.error);

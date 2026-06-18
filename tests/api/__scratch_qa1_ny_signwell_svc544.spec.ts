import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

// Try multiple merchants to find one that works for NY in qa1
const MERCHANTS = ['TerraceFinance', 'TireAgent'];

for (const merchantName of MERCHANTS) {
  test(`svc#544 — NY Signwell URL qa1 [${merchantName}]`, async ({ api }) => {
    test.setTimeout(120_000);
    const td = buildTestData({
      state: 'NY', merchant: merchantName as any, orderTotal: '900',
      approved: true, realistic: false, uniqueAddress: true,
    });
    const { merchant, applicant } = td;
    console.log(`[NY-SW][${merchantName}] email=${applicant.email} ssn=${applicant.ssn}`);

    const sendResp = await api.application.sendApplication(merchant, applicant, td.order);
    console.log(`[NY-SW][${merchantName}] status=${sendResp.status} ok=${sendResp.ok}`);
    if (!sendResp.ok) {
      console.log(`[NY-SW][${merchantName}] body:`, JSON.stringify(sendResp.body).substring(0, 500));
    }
    expect(sendResp.ok, `sendApplication ${sendResp.status}`).toBeTruthy();

    const leadUuid = sendResp.body.accountNumber ?? String(sendResp.body.authorizationNumber ?? '');
    const leadPk = String(sendResp.body.authorizationNumber ?? '');
    await sleep(4_000);

    const invResp = await api.invoice.sendInvoice(merchant, leadUuid, { orderTotal: '900' });
    expect(invResp.ok, `sendInvoice ${invResp.status}`).toBeTruthy();
    const url = invResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
    console.log(`[NY-SW][${merchantName}] leadPk=${leadPk}`);
    console.log(`[NY-SW][${merchantName}] URL: ${url}`);
    expect(url, 'redirectUrl').toBeTruthy();
  });
}

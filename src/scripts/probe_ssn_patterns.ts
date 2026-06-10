/**
 * Probe SSN patterns against qa1 sendApplication to see if any specific
 * SSN/prefix unlocks a higher BlackBox approval (and therefore EligibleTerms
 * including 16m).
 *
 * Strategy: fire sendApplication for Daniel's Jewelers + CA with 8 different
 * SSNs (varied first digit + last digit). Report approved amount + which
 * terms appear in the invoice's `paymentDetailsList`.
 */
import { ApplicationClient } from '../api/clients/application.client.js';
import { InvoiceClient } from '../api/clients/invoice.client.js';
import { buildSendApplicationBody } from '../api/bodies/application.body.js';
import { buildTestData } from '../helpers/test-data.helpers.js';
import { ConfigEnvironment } from '../config/environment.js';
import { request } from 'playwright';
import { sleep } from '../helpers/common.helpers.js';

const SSN_PROBES = [
  '100000001', // low prefix, no special
  '200000002',
  '300000003',
  '400000004',
  '500000005',
  '600000006',
  '700000007',
  '800000008', // high prefix (888888888 is buggy)
  '888880917', // close cousin of 888880916 (the catalog 16m SSN)
  '777777771',
];

async function main() {
  const env = new ConfigEnvironment('qa1');
  const ctx = await request.newContext({
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  });
  const application = new ApplicationClient(ctx, env);
  const invoice = new InvoiceClient(ctx, env);

  const summary: Array<{ ssn: string; status: string; approved: number; terms: string }> = [];

  for (const ssn of SSN_PROBES) {
    const td = buildTestData({
      state: 'CA',
      merchant: 'DanielsJewelers',
      orderTotal: '3500',
      orderDescription: 'svc-531 SSN probe',
    });
    td.applicant.ssn = ssn;

    const body = buildSendApplicationBody(td.merchant, td.applicant, undefined, { state: 'CA' });
    const sendResp = await application.sendApplication(body);
    if (!sendResp.ok) {
      summary.push({ ssn, status: `sendApp ${sendResp.status}`, approved: 0, terms: '-' });
      continue;
    }
    const leadUuid = sendResp.body.accountNumber ?? String(sendResp.body.authorizationNumber ?? '');
    await sleep(4_000);
    const statusResp = await application.getApplicationStatus(td.merchant, leadUuid);
    const status = (statusResp.body.appApprovalStatus ?? statusResp.body.uwStatus ?? statusResp.body.currentStatus ?? statusResp.body.status ?? '').toString();
    const approved = Number(statusResp.body.approvedAmount ?? 0);
    let terms = '-';
    if (status.toLowerCase().includes('approved')) {
      const invResp = await invoice.sendInvoice(td.merchant, leadUuid, { orderTotal: String(approved) });
      if (invResp.ok) {
        terms = (invResp.body.paymentDetailsList ?? []).map((d: any) => d.termInMonths).join(',') || '-';
      } else {
        terms = `sendInvoice ${invResp.status}`;
      }
    }
    summary.push({ ssn, status, approved, terms });
    console.log(`ssn=${ssn} status=${status} approved=${approved} terms=${terms}`);
  }

  await ctx.dispose();
  console.log('\n=== SUMMARY ===');
  console.table(summary);
}

main().catch((err) => { console.error(err); process.exit(1); });

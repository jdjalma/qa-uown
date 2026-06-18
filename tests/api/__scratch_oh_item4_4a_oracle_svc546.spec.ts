/**
 * SCRATCH / THROWAWAY — svc#546 "OH GowSign Item 4 / 4a value oracle".
 *
 * Purpose: on the Daniel's clone OL90205-0079_clone (OH GowSign, only-16m,
 * UOWN signing flow), approve ONE lead and re-evaluate the invoice for several
 * cart subtotals (NO signing), dumping the backend-computed payment values so a
 * human can compare them against what Item 4 / 4a render in the contract.
 *
 * One approved lead + a loop of sendInvoice avoids the velocity/blacklist DENIED
 * that creating many leads with the same address/SSN triggers. The realistic
 * factory supplies a real random name; the SSN is the qa2 sticky-UW SSN that
 * forces EligibleTerms 16, paired with the proven-good Bucyrus OH address.
 *
 * Oracle mapping (the 5 dynamic tokens in Item 4 / 4a):
 *   {{costPriceWithFeeNoTax}}  (Item 4)  = merchandiseSubtotal + processingFee (≈ subtotal + paymentDueToday)
 *   {{totalNumberOfPayments}}  (Item 4a) = paymentDetailsList.numberOfPayments
 *   {{nextPaymentDueAmount}}   (Item 4a) = paymentDetailsList.firstPaymentWithFeesNoTax (regular, no tax)
 *   {{salesTax}}               (Item 4a) = regularPaymentWithTax − nextPaymentDueAmount
 *   {{contractAmount}}         (Item 4a) = paymentDetailsList.totalContractAmountWithTax
 * Consistency: numberOfPayments × regularPaymentWithTax + processingFee ≈ contractAmount (±$0.01)
 *
 * Run: ENV=qa2 SUBTOTALS=300,662,1200 npx playwright test tests/api/__scratch_oh_item4_4a_oracle_svc546.spec.ts --project=api-only
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { randomApplicant, randomLineItems, categoryForMerchant } from '@data/index.js';
import { buildSendApplicationBody, type MerchantInfo } from '@api/bodies/application.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const ENV = process.env.ENV ?? 'qa2';
const SUBTOTALS = (process.env.SUBTOTALS ?? '300,662,1200').split(',').map((s) => s.trim()).filter(Boolean);

const MERCHANT: MerchantInfo = {
  username: 'danielsJewelers',
  password: 'U0wn_danielsJewelers_CnRKhJ',
  number: 'OL90205-0079_clone',
};

interface PayDetail {
  frequency?: string;
  termInMonths?: number;
  numberOfPayments?: number;
  totalContractAmountWithTax?: number;
  regularPaymentWithTax?: number;
  firstPaymentWithFeesNoTax?: number;
  paymentDueToday?: number;
}

test(`svc#546 — Item 4/4a oracle [${ENV}] OL90205-0079_clone`, async ({ api }) => {
  test.setTimeout(240_000);

  // Realistic random name + the proven-good Bucyrus OH address + sticky-UW SSN (→16m).
  const base = randomApplicant({ state: 'OH', ssn: 'sticky16m' });
  const applicant = { ...base, address: '1875 N Sandusky Ave', city: 'Bucyrus', zip: '44820' };

  let leadUuid = '';
  let leadPk = '';

  await test.step('sendApplication + approve (single lead)', async () => {
    const body = buildSendApplicationBody(MERCHANT, applicant, undefined, { state: 'OH' });
    const resp = await api.application.sendApplication(body);
    if (!resp.ok) console.log(`[546-oracle] sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
    expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = String(resp.body.authorizationNumber ?? '');

    await sleep(5_000);
    const st = await api.application.getApplicationStatus(MERCHANT, leadUuid);
    expect(st.ok, `getApplicationStatus ${st.status}`).toBeTruthy();
    const status = extractApprovalStatus(st.body);
    if (status?.toLowerCase() !== 'approved') console.log(`[546-oracle] status body: ${JSON.stringify(st.body)}`);
    expect(status?.toLowerCase(), `approved? got ${status}`).toContain('approved');
    const approved = st.body.approvedAmount ?? st.body.creditLimit ?? 0;
    console.log(`[546-oracle] leadPk=${leadPk} approved=${approved} name=${applicant.firstName} ${applicant.lastName} email=${applicant.email}`);
  });

  const FREQS = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'];
  const rows: Record<string, unknown>[] = [];
  for (const sub of SUBTOTALS) {
    // Coherent items for the JEWELRY merchant (not the default Ottoman/Recliner).
    const items = randomLineItems({ category: categoryForMerchant('DANIELS_JEWELERS'), total: Number(sub), count: 1 });
    console.log(`[546-oracle] items($${sub}): ${items.map((i) => `${i.lineItemProductCategory}:${i.lineItemProductDescription} $${i.lineItemExtendedPrice}`).join(', ')}`);
    for (const freq of FREQS) {
      await test.step(`sendInvoice $${sub} ${freq}`, async () => {
        const resp = await api.invoice.sendInvoice(MERCHANT, leadUuid, {
          orderTotal: sub,
          merchandiseSubtotal: sub,
          salesTax: '0.00',
          deliveryCharge: '0.00',
          installationCharge: '0.00',
          miscellaneousFees: '0.00',
          selectedPaymentFrequency: freq,
          lineItems: items,
        });
        if (!resp.ok) {
          console.log(`[546-oracle] sendInvoice($${sub},${freq}) ${resp.status}: ${JSON.stringify(resp.body)}`);
          return;
        }
        const list = (resp.body.paymentDetailsList ?? []) as PayDetail[];
        const d = list.find((x) => x.frequency === freq) ?? list[0];
        if (!d) {
          console.log(`[546-oracle] no entry for $${sub} ${freq} (got: ${list.map((x) => x.frequency).join(',') || 'none'})`);
          return;
        }
        const fee = Number(d.paymentDueToday ?? 0);
        const reg = Number(d.regularPaymentWithTax ?? 0);
        const nextNoTax = Number(d.firstPaymentWithFeesNoTax ?? 0);
        const n = Number(d.numberOfPayments ?? 0);
        rows.push({
          subtotal: sub,
          freq: d.frequency,
          term: d.termInMonths,
          costPriceWithFeeNoTax: +(Number(sub) + fee).toFixed(2),
          totalNumberOfPayments: n,
          nextPaymentDueAmount: +nextNoTax.toFixed(2),
          salesTax: +(reg - nextNoTax).toFixed(2),
          contractAmount: +Number(d.totalContractAmountWithTax ?? 0).toFixed(2),
          _regularWithTax: reg,
          _consistency: +(n * reg + fee).toFixed(2),
        });
      });
    }
  }

  console.log('\n═══════════ ITEM 4 / 4a ORACLE — OL90205-0079_clone (OH 16m) ═══════════');
  console.table(rows);
  console.log('costPriceWithFeeNoTax = subtotal + processingFee(paymentDueToday) — confirm vs rendered Item 4.');
  console.log('contractAmount should ≈ _consistency (numPayments × regularWithTax + fee), ±$0.01.');
  expect(rows.length, 'captured at least one paymentDetailsList row').toBeGreaterThan(0);
});

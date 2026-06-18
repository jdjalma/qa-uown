/**
 * SCRATCH / THROWAWAY — svc#555 modify-lease / re-analysis WITH MORE ITEMS (AL GowSign).
 *
 * Drives an Alabama lead on TerraceFinance (qa2, GowSign), invoices it with the
 * default 2 items (contract A), then RE-INVOICES with 4 items (orderType='1' = modify)
 * to regenerate the contract (contract B) — the "re-análise com mais itens" path.
 * Captures both signing URLs so contract B can be rendered and inspected:
 *   - items table grows to 4 rows?
 *   - totals / EPO recalc correctly?
 *   - does the nextPaymentDueAmount (+ 13m epoDays/discount) blank regression persist?
 *
 * Run: ENV=qa2 STATE=AL npx playwright test tests/api/__scratch_alabama_modify_items_svc555.spec.ts --project=api-only
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { buildSendApplicationBody } from '@api/bodies/application.body.js';
import type { InvoiceLineItem } from '@api/bodies/invoice.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { sleep } from '@helpers/common.helpers.js';

const ENV = process.env.ENV ?? 'sandbox';
const STATE = (process.env.STATE ?? 'AL').toUpperCase();

const flat = (ln: string, serial: string, prod: string, desc: string, cat: string, price: string): InvoiceLineItem => ({
  lineItemLineNumber: ln, lineItemSerialNumber: serial, lineItemProductNumber: prod,
  lineItemProductDescription: desc, lineItemProductCategory: cat, lineItemType: 'D',
  lineItemQuantityOrdered: '1', lineItemUnitPrice: price, lineItemBasePrice: price,
  lineItemTaxAmount: '00.00', lineItemExtendedPrice: price,
});

// 4 items (sum 1800) for the modify/re-analysis invoice.
const FOUR_ITEMS: InvoiceLineItem[] = [
  flat('317', 'S94712065', 'A561SKU283', 'Ottoman', 'Seating', '500.00'),
  flat('318', 'M68484397', 'A333SKU4444', 'Recliner', 'Seating', '300.00'),
  flat('319', 'S55512999', 'A777SKU1212', 'Sofa', 'Seating', '600.00'),
  flat('320', 'D33344455', 'A888SKU3434', 'Dining Table', 'Furniture', '400.00'),
];

test(`svc#555 modify+more-items [${ENV} ${STATE}]`, async ({ api }) => {
  test.setTimeout(240_000);

  const td = buildTestData({
    state: STATE, merchant: 'TerraceFinance', orderTotal: '1500',
    orderDescription: `svc#555 ${STATE} modify+more-items`, approved: true, uniqueAddress: true,
  });
  const { applicant, merchant } = td;

  let leadPk = '', leadUuid = '', approvedAmount = 0;

  await test.step('sendApplication', async () => {
    const body = buildSendApplicationBody(merchant, applicant, undefined, { state: STATE });
    const resp = await api.application.sendApplication(body);
    if (!resp.ok) console.log(`[mod] sendApplication ${resp.status}: ${JSON.stringify(resp.body)}`);
    expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
    leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
    leadPk = String(resp.body.authorizationNumber ?? '');
    console.log(`[mod] leadPk=${leadPk} leadUuid=${leadUuid}`);
  });

  await test.step('getApplicationStatus → APPROVED', async () => {
    await sleep(5_000);
    const resp = await api.application.getApplicationStatus(merchant, leadUuid);
    expect(resp.ok).toBeTruthy();
    expect(extractApprovalStatus(resp.body)?.toLowerCase()).toContain('approved');
    if (resp.body.leadPk) leadPk = String(resp.body.leadPk);
    approvedAmount = resp.body.approvedAmount ?? 0;
    console.log(`[mod] approvedAmount=${approvedAmount}`);
  });

  let urlA = '';
  await test.step('invoice A — default 2 items', async () => {
    const resp = await api.invoice.sendInvoice(merchant, leadUuid, { orderTotal: '868' });
    expect(resp.ok, `invoice A ${resp.status}`).toBeTruthy();
    const list = resp.body.paymentDetailsList ?? [];
    urlA = (list[0]?.redirectUrl) ?? '';
    console.log(`[mod] A items=2 total=868 terms=${list.map(d=>d.termInMonths).join(',')} url=${urlA}`);
  });

  let urlB = '';
  await test.step('invoice B — MODIFY to 4 items (orderType=1)', async () => {
    const resp = await api.invoice.sendInvoice(merchant, leadUuid, {
      orderTotal: '1953', orderType: '1', lineItems: FOUR_ITEMS,
    });
    if (!resp.ok) console.log(`[mod] invoice B ${resp.status}: ${JSON.stringify(resp.body)}`);
    expect(resp.ok, `invoice B ${resp.status}`).toBeTruthy();
    const list = resp.body.paymentDetailsList ?? [];
    console.log(`[mod] B paymentDetailsList: ${JSON.stringify(list)}`);
    const pick = [...list].sort((a,b)=>(a.termInMonths??0)-(b.termInMonths??0))[0];
    urlB = pick?.redirectUrl ?? '';
    console.log(`[mod] B items=4 total=1953 term=${pick?.termInMonths} url=${urlB}`);
  });

  await test.step('submit B → render-ready', async () => {
    const u = new URL(urlB);
    const shortCode = u.pathname.split('/').filter(Boolean)[0] ?? '';
    const planId = u.searchParams.get('planId') ?? '';
    const missing = await api.application.getMissingFields(shortCode, planId ? { planId } : undefined);
    expect(missing.ok, `getMissingFields ${missing.status}`).toBeTruthy();
    const submit = await api.application.submitApplication(Number(leadPk), applicant.firstName, applicant.lastName);
    if (!submit.ok) console.log(`[mod] submit ${submit.status}: ${JSON.stringify(submit.body)}`);
    expect(submit.ok, `submit ${submit.status}`).toBeTruthy();
  });

  console.log('═══════════════════════════════════════════════');
  console.log(`[mod] leadPk=${leadPk} applicant=${applicant.firstName} ${applicant.lastName}`);
  console.log(`[mod] CONTRACT A (2 items): ${urlA}`);
  console.log(`[mod] CONTRACT B (4 items, modified): ${urlB}`);
  console.log('═══════════════════════════════════════════════');
  expect(urlB, 'modified signing URL captured').toBeTruthy();
});

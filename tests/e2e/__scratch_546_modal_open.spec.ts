/**
 * SCRATCH / THROWAWAY — svc#546 Scenario 3 cycle-2 fix verification.
 *
 * Proves the FIX reaches the render: for a FRESH OH lead, re-issue sendInvoice
 * per frequency immediately before opening, drive the real customer flow
 * (MissingDataForm CC → Terms → AlternativeContractModal) and confirm the
 * GowSign modal container (.alternative-contract-vendor_iframeContainer__yAn5c)
 * becomes visible for WEEKLY and MONTHLY.
 *
 * Run: ENV=qa2 npx playwright test __scratch_546_modal_open --project=cross-portal
 * DELETE after verification.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { randomApplicant } from '@data/index.js';
import { buildSendApplicationBody, type MerchantInfo } from '@api/bodies/application.body.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { ensureMerchantReady } from '@helpers/merchant-config.helper.js';
import { sleep } from '@helpers/common.helpers.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';

const MERCHANT: MerchantInfo = {
  username: 'danielsJewelers',
  password: 'U0wn_danielsJewelers_CnRKhJ',
  number: 'OL90205-0079_clone',
};
const OH_ADDRESS = { address: '1875 N Sandusky Ave', city: 'Bucyrus', zip: '44820' };
const REFERENCE_SUBTOTAL = 662;
const CC = { cardNumber: '5500000000000004', cvc: '123', expiration: '12/2030' };
const PROBE = ['WEEKLY', 'MONTHLY'] as const;
interface PayDetail { frequency?: string; redirectUrl?: string }

test.use({ envName: 'qa2' });

test('svc#546 fix: modal opens per-freq with fresh link [qa2]', async ({ page, api }) => {
  test.setTimeout(600_000);
  const base = randomApplicant({ state: 'OH', ssn: 'sticky16m' });
  const applicant = { ...base, ...OH_ADDRESS };

  await ensureMerchantReady(api, MERCHANT.number);
  const resp = await api.application.sendApplication(
    buildSendApplicationBody(MERCHANT, applicant, undefined, { state: 'OH' }),
  );
  expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
  const leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
  await sleep(5_000);
  const st = await api.application.getApplicationStatus(MERCHANT, leadUuid);
  expect(extractApprovalStatus(st.body)?.toLowerCase()).toContain('approved');
  console.log(`[modalopen] leadUuid=${leadUuid} leadPk=${st.body.leadPk}`);

  async function freshUrl(freq: string): Promise<string> {
    const r = await api.invoice.sendInvoice(MERCHANT, leadUuid, {
      orderTotal: String(REFERENCE_SUBTOTAL), merchandiseSubtotal: String(REFERENCE_SUBTOTAL),
      salesTax: '0.00', deliveryCharge: '0.00', installationCharge: '0.00', miscellaneousFees: '0.00',
      selectedPaymentFrequency: freq,
    });
    expect(r.ok, `sendInvoice ${freq} ${r.status}`).toBeTruthy();
    const list = (r.body.paymentDetailsList ?? []) as unknown as PayDetail[];
    return (list.find((x) => x.frequency === freq) ?? list[0])?.redirectUrl ?? '';
  }

  for (const freq of PROBE) {
    const url = await freshUrl(freq);
    console.log(`[modalopen ${freq}] url=${url}`);
    await page.goto(url);
    // CC (first open only) — guarded.
    try {
      const md = new MissingDataFormPage(page);
      await md.waitForLoaded(20_000);
      await md.fillAndSubmit({
        firstName: applicant.firstName, lastName: applicant.lastName,
        cardNumber: CC.cardNumber, cvc: CC.cvc, expiration: CC.expiration,
      });
    } catch { /* repeat open — CC already done */ }
    try {
      const terms = new TermsOfAgreementPage(page);
      await terms.waitForLoaded(20_000);
      await terms.acceptAndProceedWithProtectionPlan(false);
    } catch { /* terms not re-shown */ }
    const modal = new AlternativeContractModalPage(page);
    await modal.waitForOpen(60_000);
    const open = await modal.isOpen();
    console.log(`[modalopen ${freq}] modal open = ${open}`);
    expect(open, `[${freq}] GowSign modal container visible`).toBe(true);
  }
  console.log('[modalopen] PASS — modal opened for WEEKLY and MONTHLY with fresh links');
});

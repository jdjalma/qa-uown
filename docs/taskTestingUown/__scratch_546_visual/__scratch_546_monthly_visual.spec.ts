/**
 * SCRATCH — svc#546 CT-01 VISUAL confirmation (MONTHLY only, single drive).
 *
 * The multi-frequency render in the official spec is blocked: re-issuing the
 * invoice after the first CC submit advances the customer flow to the BANK
 * ACCOUNT/ACH missing-data step (DOM-confirmed), so the 2nd+ frequency never
 * reaches the GowSign modal. A SINGLE first drive reaches the modal (CT-00
 * proved it). The defect is MONTHLY-specific, so render MONTHLY once and read
 * the rendered Item 3 / Item 4a to confirm {{nextPaymentDueAmount}} is BLANK.
 *
 * Run: ENV=qa2 npx playwright test tests/e2e/__scratch_546_monthly_visual.spec.ts --project=task-testing-origination --timeout=600000
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { splitTags } from '@ptypes/enums.js';
import { sleep } from '@helpers/common.helpers.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { ensureMerchantReady } from '@helpers/merchant-config.helper.js';
import { randomApplicant, randomLineItems, categoryForMerchant } from '@data/index.js';
import { buildSendApplicationBody, type MerchantInfo } from '@api/bodies/application.body.js';
import { captureContractPdf, extractContractValues } from '@helpers/contract-pdf.helper.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';

const MERCHANT: MerchantInfo = {
  username: 'danielsJewelers',
  password: 'U0wn_danielsJewelers_CnRKhJ',
  number: 'OL90205-0079_clone',
};
const OH_ADDRESS = { address: '1875 N Sandusky Ave', city: 'Bucyrus', zip: '44820' };
const CC = { cardNumber: '5500000000000004', cvc: '123', expiration: '12/2030' };
const SUBTOTAL = 662;

test.describe('svc546 CT-01 MONTHLY visual', { tag: splitTags('@origination @qa2') }, () => {
  test.use({ envName: 'qa2' });

  test('MONTHLY contract renders {{nextPaymentDueAmount}} BLANK (bug visual)', async ({ page, api }) => {
    test.setTimeout(600_000);

    const applicant = { ...randomApplicant({ state: 'OH', ssn: 'sticky16m' }), ...OH_ADDRESS };
    const lineItems = randomLineItems({ category: categoryForMerchant('DANIELS_JEWELERS'), total: SUBTOTAL, count: 1 });

    let leadUuid = '';
    let signingUrl = '';

    await test.step('setup — approve OH 16m lead', async () => {
      await ensureMerchantReady(api, MERCHANT.number);
      const body = buildSendApplicationBody(MERCHANT, applicant, undefined, { state: 'OH' });
      const resp = await api.application.sendApplication(body);
      expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
      leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
      await sleep(5_000);
      const st = await api.application.getApplicationStatus(MERCHANT, leadUuid);
      expect(extractApprovalStatus(st.body)?.toLowerCase(), 'approved').toContain('approved');
      console.log(`[546-visual] leadPk=${st.body.leadPk ?? resp.body.authorizationNumber} name=${applicant.firstName} ${applicant.lastName}`);
    });

    await test.step('sendInvoice MONTHLY → signing URL', async () => {
      const resp = await api.invoice.sendInvoice(MERCHANT, leadUuid, {
        orderTotal: String(SUBTOTAL), merchandiseSubtotal: String(SUBTOTAL), salesTax: '0.00',
        deliveryCharge: '0.00', installationCharge: '0.00', miscellaneousFees: '0.00',
        selectedPaymentFrequency: 'MONTHLY', lineItems,
      });
      expect(resp.ok, `sendInvoice ${resp.status}`).toBeTruthy();
      const list = (resp.body.paymentDetailsList ?? []) as Array<{ frequency?: string; redirectUrl?: string; firstPaymentWithFeesNoTax?: number }>;
      const d = list.find((x) => x.frequency === 'MONTHLY') ?? list[0];
      signingUrl = d?.redirectUrl ?? '';
      expect(signingUrl, 'MONTHLY redirectUrl').toBeTruthy();
      console.log(`[546-visual] MONTHLY oracle nextPaymentDueAmount=${d?.firstPaymentWithFeesNoTax} url=${signingUrl}`);
    });

    await test.step('drive customer flow → open GowSign modal (first drive)', async () => {
      await page.goto(signingUrl);
      const missing = new MissingDataFormPage(page);
      await missing.waitForLoaded(60_000);
      await missing.fillAndSubmit({
        firstName: applicant.firstName, lastName: applicant.lastName,
        cardNumber: CC.cardNumber, cvc: CC.cvc, expiration: CC.expiration,
      });
      const terms = new TermsOfAgreementPage(page);
      await terms.waitForLoaded(120_000);
      await terms.acceptAndProceedWithProtectionPlan(false);
    });

    await test.step('capture rendered PDF + read Item 3 / Item 4a', async () => {
      const modal = new AlternativeContractModalPage(page);
      await modal.waitForOpen(120_000);
      const iframeSrc = await modal.getIframeSrc();
      expect(iframeSrc, 'GowSign iframe src').toBeTruthy();

      const pdf = await captureContractPdf(page, iframeSrc as string);
      const { rawText } = await extractContractValues(pdf);
      const text = (rawText ?? '').replace(/\s+/g, ' ');
      console.log(`[546-visual] rendered text length=${text.length}`);

      // Show the exact slots the customer reads.
      const item3 = text.match(/Regular\s+MONTHLY\s+lease\s+rate\s+is\s+\$[^.]{0,30}/i)?.[0] ?? '(Item3 not found)';
      const item4a = text.match(/16\s+payments?\s+of\s+\$[^.]{0,40}/i)?.[0] ?? '(Item4a not found)';
      console.log(`[546-visual] ITEM 3  → "${item3}"`);
      console.log(`[546-visual] ITEM 4a → "${item4a}"`);

      // Other variables that SHOULD render (to show only nextPaymentDueAmount is blank).
      const costPrice = text.match(/Promotional[-\s]?Payoff[-\s]?Option[^$]{0,60}\$\s*([0-9.,]+)/i)?.[1] ?? '(none)';
      const total = text.match(/total\s+of\s+\$\s*([0-9.,]+)/i)?.[1] ?? '(none)';
      console.log(`[546-visual] costPriceWithFeeNoTax(Item4)=$${costPrice}  contractAmount(Total)=$${total}`);

      // THE BUG (visual): the per-payment amount slot in Item 4a has NO number.
      const item4aHasNumber = /16\s+payments?\s+of\s+\$\s*[0-9]/i.test(text);
      console.log(`[546-visual] >>> Item 4a payment amount rendered? ${item4aHasNumber ? 'YES (value present)' : 'NO — BLANK (bug reproduced visually)'}`);

      // Assert the bug: this SHOULD be blank (bug). If it's present, the bug is gone.
      expect(item4aHasNumber, 'BUG: Item 4a "16 payments of $___" should render BLANK (nextPaymentDueAmount missing)').toBe(false);
    });
  });
});

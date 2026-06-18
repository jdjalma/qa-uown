/**
 * SCRATCH — svc#546 execute the BLOCKED CTs (one lead per frequency).
 *
 * F-003: multi-frequency render on ONE lead is impossible (the customer flow
 * advances missing-data CC→bank on re-issue). Fix: a fresh lead per frequency,
 * each does its single first-drive → modal → PDF. This runs the CTs that were
 * blocked: CT-01/02/03/05 per frequency, CT-04/06 (content) on MONTHLY, plus the
 * per-frequency dispatch-note check (BUG-01 scope) and CT-07 (esign status).
 *
 * Run: ENV=qa2 npx playwright test docs/taskTestingUown/__scratch_546_visual/__scratch_546_all_freq_cts.spec.ts --project=task-testing-origination --timeout=600000
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { splitTags } from '@ptypes/enums.js';
import { sleep } from '@helpers/common.helpers.js';
import { extractApprovalStatus } from '@helpers/api-setup.helpers.js';
import { ensureMerchantReady } from '@helpers/merchant-config.helper.js';
import { randomApplicant, randomLineItems, categoryForMerchant } from '@data/index.js';
import { buildSendApplicationBody, type MerchantInfo } from '@api/bodies/application.body.js';
import { captureContractPdf, extractContractValues } from '@helpers/contract-pdf.helper.js';
import { getEsignDocumentByLeadAndClient } from '@helpers/gowsign-template-db.helpers.js';
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
const FREQS = ['WEEKLY', 'BI_WEEKLY', 'MONTHLY'] as const;

function moneyHasDigit(text: string, re: RegExp): { matched: string; hasValue: boolean } {
  const compact = text.replace(/\s+/g, ' ');
  const m = compact.match(re);
  return { matched: m?.[0] ?? '(not found)', hasValue: m ? /\$\s*[0-9]/.test(m[0]) : false };
}

test.describe('svc546 all-freq CTs (one lead per frequency)', { tag: splitTags('@origination @qa2') }, () => {
  test.use({ envName: 'qa2' });

  for (const freq of FREQS) {
    test(`[${freq}] render contract → CT-01/02/05 + dispatch-note scope + CT-07`, async ({ page, api, db }) => {
      test.setTimeout(600_000);

      const applicant = { ...randomApplicant({ state: 'OH', ssn: 'sticky16m' }), ...OH_ADDRESS };
      const lineItems = randomLineItems({ category: categoryForMerchant('DANIELS_JEWELERS'), total: SUBTOTAL, count: 1 });
      let leadUuid = '';
      let leadPk = 0;
      const oracle = { nextPayment: 0, costPrice: 0, n: 0, contract: 0, salesTax: 0 };
      let signingUrl = '';

      await test.step('fresh lead + approve + invoice', async () => {
        await ensureMerchantReady(api, MERCHANT.number);
        const body = buildSendApplicationBody(MERCHANT, applicant, undefined, { state: 'OH' });
        const resp = await api.application.sendApplication(body);
        expect(resp.ok, `sendApplication ${resp.status}`).toBeTruthy();
        leadUuid = resp.body.accountNumber ?? String(resp.body.authorizationNumber ?? '');
        leadPk = Number(resp.body.authorizationNumber ?? 0);
        await sleep(5_000);
        const st = await api.application.getApplicationStatus(MERCHANT, leadUuid);
        expect(extractApprovalStatus(st.body)?.toLowerCase(), 'approved').toContain('approved');
        if (st.body.leadPk) leadPk = Number(st.body.leadPk);

        const inv = await api.invoice.sendInvoice(MERCHANT, leadUuid, {
          orderTotal: String(SUBTOTAL), merchandiseSubtotal: String(SUBTOTAL), salesTax: '0.00',
          deliveryCharge: '0.00', installationCharge: '0.00', miscellaneousFees: '0.00',
          selectedPaymentFrequency: freq, lineItems,
        });
        expect(inv.ok, `sendInvoice ${inv.status}`).toBeTruthy();
        const list = (inv.body.paymentDetailsList ?? []) as Array<Record<string, unknown>>;
        const d = (list.find((x) => x.frequency === freq) ?? list[0]) as Record<string, number | string>;
        oracle.nextPayment = Number(d.firstPaymentWithFeesNoTax ?? 0);
        oracle.n = Number(d.numberOfPayments ?? 0);
        oracle.contract = Number(d.totalContractAmountWithTax ?? 0);
        oracle.costPrice = +(SUBTOTAL + Number(d.paymentDueToday ?? 0)).toFixed(2);
        oracle.salesTax = +(Number(d.regularPaymentWithTax ?? 0) - oracle.nextPayment).toFixed(2);
        signingUrl = String(d.redirectUrl ?? '');
        expect(signingUrl, 'redirectUrl').toBeTruthy();
        console.log(`[546-all ${freq}] leadPk=${leadPk} oracle nextPayment=${oracle.nextPayment} n=${oracle.n} cost=${oracle.costPrice} contract=${oracle.contract}`);
      });

      let rawText = '';
      await test.step('drive single → modal → capture PDF', async () => {
        await page.goto(signingUrl);
        const missing = new MissingDataFormPage(page);
        await missing.waitForLoaded(60_000);
        await missing.fillAndSubmit({ firstName: applicant.firstName, lastName: applicant.lastName, ...CC });
        const terms = new TermsOfAgreementPage(page);
        await terms.waitForLoaded(120_000);
        await terms.acceptAndProceedWithProtectionPlan(false);
        const modal = new AlternativeContractModalPage(page);
        await modal.waitForOpen(120_000);
        const iframeSrc = await modal.getIframeSrc();
        const pdf = await captureContractPdf(page, iframeSrc as string);
        rawText = (await extractContractValues(pdf)).rawText ?? '';
        expect(rawText.length, 'rendered text').toBeGreaterThan(200);
      });

      await test.step(`CT-01 — nextPaymentDueAmount render (blank vs value) [${freq}]`, async () => {
        const item3 = moneyHasDigit(rawText, new RegExp(`Regular\\s+${freq.replace('_', '[-_ ]?')}\\s+lease\\s+rate\\s+is\\s+\\$[^.]{0,30}`, 'i'));
        const item4a = moneyHasDigit(rawText, new RegExp(`${oracle.n}\\s+payments?\\s+of\\s+\\$[^.]{0,40}`, 'i'));
        console.log(`[546-all ${freq}] ITEM3 "${item3.matched}" hasValue=${item3.hasValue}`);
        console.log(`[546-all ${freq}] ITEM4a "${item4a.matched}" hasValue=${item4a.hasValue}`);
        console.log(`[546-all ${freq}] >>> nextPaymentDueAmount rendered? Item3=${item3.hasValue} Item4a=${item4a.hasValue} (false=BLANK=bug)`);
      });

      await test.step(`CT-bug-scope — dispatch variables-map-missing note for this lead [${freq}]`, async () => {
        const note = await db.queryOne<{ notes: string }>(
          `SELECT notes FROM uown_los_lead_notes WHERE lead_pk=$1 AND notes ILIKE '%variables map missing%' ORDER BY pk DESC LIMIT 1`,
          [leadPk],
        );
        console.log(`[546-all ${freq}] dispatch missing-tokens note: ${note ? note.notes.replace(/.*GowSign\]/, 'GowSign]').slice(0, 140) : '(none — all tokens present)'}`);
      });

      await test.step(`CT-02 — costPrice/contract/salesTax/n vs oracle + CT-05 no token leak [${freq}]`, async () => {
        const leak = rawText.match(/\{\{[^}]+\}\}/g) ?? [];
        console.log(`[546-all ${freq}] CT-05 raw token leak: ${leak.length ? leak.join(',') : 'none'}`);
        const costM = moneyHasDigit(rawText, /Promotional[-\s]?Payoff[-\s]?Option[^$]{0,60}\$\s*([0-9.,]+)/i);
        const totalM = moneyHasDigit(rawText, /total\s+of\s+\$\s*([0-9.,]+)/i);
        console.log(`[546-all ${freq}] CT-02 costPrice rendered=${costM.matched.match(/\$\s*[0-9.,]+/)?.[0] ?? '?'} (oracle ${oracle.costPrice}) | contract ${totalM.matched.match(/\$\s*[0-9.,]+/)?.[0] ?? '?'} (oracle ${oracle.contract})`);
        expect(leak, `CT-05 no token leak [${freq}]`).toHaveLength(0);
      });

      if (freq === 'MONTHLY') {
        await test.step('CT-04/CT-06 — EPO copy parity + OH state + brand phone (MONTHLY render)', async () => {
          const required = [
            { l: 'Item4 Promotional-Payoff Option', re: /Promotional[-\s]?Payoff[-\s]?Option/i },
            { l: 'Item4a Lease-Purchase Ownership', re: /Lease[-\s]?Purchase\s+Ownership/i },
            { l: 'footnote', re: /with\s+a\s+Promotional\s+Payoff\s+option/i },
            { l: 'EPO Available Off Unpaid Balance', re: /Early\s+Purchase\s+Option\s+Available\s+Off\s+Unpaid\s+Balance/i },
            { l: 'Appendix EARLY PURCHASE OPTION', re: /EARLY\s+PURCHASE\s+OPTION/i },
            { l: '16-month term', re: /16[-\s]?month/i },
            { l: 'Ohio', re: /\bOhio\b/i },
          ];
          const missing = required.filter((c) => !c.re.test(rawText)).map((c) => c.l);
          const phone = rawText.replace(/\s+/g, ' ').match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] ?? '(none)';
          console.log(`[546-all MONTHLY] CT-04 copy missing: ${missing.length ? missing.join(' | ') : 'NONE (all present)'}`);
          console.log(`[546-all MONTHLY] CT-06 brand phone=${phone} | no-other-state-leak=${!/(governed\s+by|laws\s+of\s+the\s+State\s+of)\s+(California|Georgia|New\s+York|Texas|Florida)/i.test(rawText)}`);
          expect(missing, `CT-04 required OH copy missing: ${missing.join(' | ')}`).toHaveLength(0);
          expect(/\{\{\s*companyInfoBrandPhone\s*\}\}/i.test(rawText), 'CT-06 brand phone token not leaked').toBe(false);
        });
      }

      await test.step(`CT-07 — esign document status [${freq}]`, async () => {
        const doc = await getEsignDocumentByLeadAndClient(db, leadPk, 'GOWSIGN');
        expect(doc, 'CT-07 GOWSIGN esign_document present').not.toBeNull();
        expect(['STORED', 'SENT_TO_CUSTOMER', 'COMPLETED'], `CT-07 esign status ${doc!.status}`).toContain(doc!.status);
        console.log(`[546-all ${freq}] CT-07 esign pk=${doc!.pk} status=${doc!.status}`);
      });
    });
  }
});

/**
 * E2E qa2 — GowSign Recovery / Resilience (US-RES-*)
 *
 * Coverage:
 *   ✅ RES-04.1 Re-acesso ao link após signed → renderiza modo read-only
 *   ✅ RES-02.1 Cliente fecha browser e reabre — wizard state após reabrir
 *   ✅ RES-06.1 2 dispositivos simultâneos — sign em um, outro vê SIGNED
 *
 * Pre-req: DB tunnel qa2 ativo (porta 5445).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Page } from '@playwright/test';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { installPostMessageRecorder, signGowSignInFrame } from '@helpers/gowsign-signing.helper.js';
import { waitForLeadStatus } from '@helpers/esign-db.helpers.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';

const data = {
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  merchantRefCode: 'OW90218-0001',
  orderTotal: '800',
};

/**
 * Empirically (qa2 2026-04-28): after signing, the contract URL returns
 * "Invalid link. Please contact merchant" — the link is one-shot and
 * invalidated post-sign. This function returns whether the page is in a
 * post-sign locked state. Three equally valid post-sign UIs:
 *   (a) "Invalid link" error toast (the qa2 default behaviour observed)
 *   (b) Modal/iframe is gone, parent shows the Thank You screen
 *   (c) Modal is open but the in-iframe Start button is hidden/disabled
 */
async function isReadOnlyPostSign(page: Page): Promise<{ readOnly: boolean; reason: string }> {
  // (a) Invalid-link toast — strongest signal: the URL was revoked.
  const invalidToast = await page
    .getByText(/invalid\s+link/i)
    .first()
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (invalidToast) return { readOnly: true, reason: 'invalid-link-revoked' };

  // (b) Thank-you screen rendered after parent consumed the completed
  // postMessage.
  const thankYouVisible = await page
    .getByText(/thank\s*you/i)
    .first()
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (thankYouVisible) return { readOnly: true, reason: 'thank-you-screen' };

  // (c) Iframe still open but Start button absent — read-only iframe view.
  const modal = new AlternativeContractModalPage(page);
  const open = await modal.isOpen();
  if (open) {
    const frame = modal.getGowSignFrame();
    const startVisible = await frame
      .locator(SELECTORS.gsStartSignatureButton)
      .isVisible({ timeout: 5_000 })
      .catch(() => false);
    return { readOnly: !startVisible, reason: startVisible ? 'start-button-still-visible' : 'iframe-without-start' };
  }
  return { readOnly: false, reason: 'no-known-post-sign-state' };
}

test.describe(
  `GowSign Recovery - ${data.merchant}`,
  { tag: ['@regression', '@e2e', '@hybrid', '@db-validation', '@qa2', '@priority-medium'] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // RES-04.1 — Re-access após signed renderiza read-only.
    // ─────────────────────────────────────────────────────────────
    test(
      'RES-04.1 Re-access to contract URL after signing renders read-only state (no Start button)',
      { tag: ['@priority-high'] },
      async ({ page, api, ctx, db }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign RES-04.1 - re-access',
        });

        await installPostMessageRecorder(page);

        let contractUrl = '';

        await test.step('API + UI: drive to iframe and complete signing', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
          );
          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
          contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';

          await page.goto(contractUrl);
          const missingData = new MissingDataFormPage(page);
          await missingData.waitForLoaded(60_000);
          await missingData.fillAndSubmit({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            cardNumber: '5500000000000004',
            cvc: '123',
            expiration: '12/2030',
          });
          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);

          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.signClicked).toBe(true);

          await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
        });

        await test.step('Navigate AWAY then BACK to the original contract URL', async () => {
          await page.goto('about:blank');
          await sleep(1_000);
          await page.goto(contractUrl);
          await sleep(3_000);
        });

        await test.step('Re-access state: page is read-only (no Start button reachable)', async () => {
          const result = await isReadOnlyPostSign(page);
          console.log(`[RES-04.1] re-access state: readOnly=${result.readOnly} (${result.reason})`);
          expect(
            result.readOnly,
            `re-access must show read-only post-sign state — got reason=${result.reason}`,
          ).toBe(true);
        });

        await test.step('DB sanity: lead remains SIGNED (no regression)', async () => {
          const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 5_000 }).catch(() => null);
          expect(status).toBe('SIGNED');
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // RES-02.1 — Cliente fecha browser e reabre.
    // ─────────────────────────────────────────────────────────────
    test(
      'RES-02.1 Closing and reopening browser context re-accesses the contract URL',
      { tag: ['@priority-low'] },
      async ({ browser, api, ctx }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign RES-02.1 - close+reopen',
        });

        await createPreQualifiedApplication(
          api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
        );
        const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
        const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
        expect(contractUrl).toBeTruthy();

        await test.step('Context A: drive to iframe, then close', async () => {
          const ctxA = await browser.newContext();
          const pageA = await ctxA.newPage();
          await installPostMessageRecorder(pageA);

          await pageA.goto(contractUrl);
          const missingData = new MissingDataFormPage(pageA);
          await missingData.waitForLoaded(60_000);
          await missingData.fillAndSubmit({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            cardNumber: '5500000000000004',
            cvc: '123',
            expiration: '12/2030',
          });
          const terms = new TermsOfAgreementPage(pageA);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);
          const modal = new AlternativeContractModalPage(pageA);
          await modal.waitForOpen(120_000);

          await pageA.close();
          await ctxA.close();
        });

        await test.step('Context B (fresh): re-open same URL — flow restarts at one of the steps', async () => {
          const ctxB = await browser.newContext();
          const pageB = await ctxB.newPage();
          try {
            await pageB.goto(contractUrl);
            const html = await pageB.content();
            expect(html.length, 'contract URL should render content in fresh context').toBeGreaterThan(500);

            // Successful re-open: at least one of these reaches the user.
            const missingDataPage = new MissingDataFormPage(pageB);
            const termsPage = new TermsOfAgreementPage(pageB);
            const modal = new AlternativeContractModalPage(pageB);

            const missingDataReachable = await missingDataPage
              .waitForLoaded(10_000)
              .then(() => true)
              .catch(() => false);
            const termsReachable = !missingDataReachable
              ? await termsPage
                  .waitForLoaded(5_000)
                  .then(() => true)
                  .catch(() => false)
              : false;
            const iframeReachable = !missingDataReachable && !termsReachable
              ? await modal.isOpen()
              : false;

            expect(
              missingDataReachable || termsReachable || iframeReachable,
              'After reopen, must show one of: missingData / terms / iframe',
            ).toBe(true);

            await pageB.screenshot({
              path: testInfo.outputPath('res-02-reopened.png'),
              fullPage: false,
            });
          } finally {
            await pageB.close();
            await ctxB.close();
          }
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // RES-06.1 — 2 dispositivos simultâneos.
    // ─────────────────────────────────────────────────────────────
    test(
      'RES-06.1 Concurrent contexts: signing on device A makes device B see SIGNED state',
      { tag: ['@priority-low'] },
      async ({ browser, api, ctx, db }, testInfo) => {
        test.setTimeout(540_000);

        const { merchant, applicant } = buildTestData({
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'GowSign RES-06.1 - 2 devices',
        });

        await createPreQualifiedApplication(
          api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
        );
        const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
        const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
        expect(contractUrl).toBeTruthy();

        const ctxA = await browser.newContext();
        const ctxB = await browser.newContext();
        const pageA = await ctxA.newPage();
        const pageB = await ctxB.newPage();
        await installPostMessageRecorder(pageA);
        await installPostMessageRecorder(pageB);

        try {
          await test.step('Both devices: open contract URL', async () => {
            await Promise.all([pageA.goto(contractUrl), pageB.goto(contractUrl)]);
          });

          await test.step('Device A: complete missing-data + terms + sign', async () => {
            const missingData = new MissingDataFormPage(pageA);
            await missingData.waitForLoaded(60_000);
            await missingData.fillAndSubmit({
              firstName: applicant.firstName,
              lastName: applicant.lastName,
              cardNumber: '5500000000000004',
              cvc: '123',
              expiration: '12/2030',
            });
            const terms = new TermsOfAgreementPage(pageA);
            await terms.waitForLoaded(120_000);
            await terms.acceptAndProceedWithProtectionPlan(false);
            const modal = new AlternativeContractModalPage(pageA);
            await modal.waitForOpen(120_000);

            const frame = modal.getGowSignFrame();
            await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
            const result = await signGowSignInFrame(pageA, frame, {
              preauthChoice: 'yes',
              fontIndex: 0,
              waitForCompleted: true,
            });
            expect(result.signClicked).toBe(true);
          });

          await test.step('DB: lead reaches SIGNED (post-A action)', async () => {
            const status = await waitForLeadStatus(db, ctx.leadPk!, 'SIGNED', { timeoutMs: 60_000 });
            expect(status).toBe('SIGNED');
          });

          await test.step('Device B: refresh and verify document is read-only there too', async () => {
            await pageB.goto(contractUrl);
            await sleep(3_000);
            const result = await isReadOnlyPostSign(pageB);
            console.log(`[RES-06.1] device B re-access: readOnly=${result.readOnly} (${result.reason})`);
            expect(
              result.readOnly,
              `Device B must show read-only post-sign state once A signed — got reason=${result.reason}`,
            ).toBe(true);
          });
        } finally {
          await pageA.close();
          await pageB.close();
          await ctxA.close();
          await ctxB.close();
        }
      },
    );
  },
);

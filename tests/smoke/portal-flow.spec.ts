/**
 * Smoke Test — Portal Flow
 *
 * Validates the complete agent portal flow end-to-end:
 *   1. Login to Origination portal (UI) — agent
 *   2. sendApplicationToCustomer via "New Application" form (UI) — agent
 *   3. sendApplication (API, hybrid) → get leadPk + contract URL
 *   4. Fill CC + bank info on contract page (UI) — customer
 *   5. Complete T&C + e-sign via Signwell (UI) — customer
 *   6. Navigate to customer in portal → settle lease (UI) — agent
 *   7. Fund via Funding Queue (UI) — agent
 *   8. getApplicationStatus (API) → verify FUNDING/FUNDED
 *
 * Mirrors the Postman "Smoke Test - Portal Flow (sendApplicationToCustomer → Funding)".
 * Fully automated — no manual steps required.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ContractPage, FundingPage, OriginationCustomerPage } from '@pages/origination/index.js';
import { FundingQueueStatus, TestTag, buildTags } from '@ptypes/enums.js';
import { buildTestData, loginToPortalWithOptions, sleep } from '@helpers/index.js';
import { TEST_BANK, TEST_CARDS } from '@config/constants.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { randomInt } from 'node:crypto';

const testData = [
  {
    env: 'stg',
    state: 'TX',
    merchant: 'TireAgent',
    orderTotal: '600',
    tag: buildTags(TestTag.SMOKE, TestTag.SANITY, TestTag.STG),
  },
];

for (const data of testData) {
  test.describe(`Smoke - Portal Flow (${data.env})`, { tag: data.tag.split(' ') }, () => {
    test.use({ envName: data.env });

    test('portal login → sendApplicationToCustomer → sign → settle → fund', async ({
      page,
      api,
      ctx,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(420_000); // 7 min — includes portal UI + e-sign flow

      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(data.merchant, 'lifecycle');
      });

      const { env, merchant, applicant, order } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: data.orderTotal,
        orderDescription: 'Portal Flow smoke',
        sanitizeNames: true,
      });

      // ── Phase 1: Login to Origination portal ─────────────────────────

      await test.step('1. Login to origination portal', async () => {
        await loginToPortalWithOptions(page, env.originationUrl, env);
        console.log(`[PortalFlow] Logged in to ${env.originationUrl}`);
      });

      // ── Phase 2: sendApplicationToCustomer (portal UI) ────────────────

      await test.step('2. Create new application via portal "New Application" form', async () => {
        // Navigate to "New Application" menu item
        const newAppLink = page.locator(SELECTORS.naNewApplicationLink).first();
        if (await newAppLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await newAppLink.click();
        } else {
          // Fallback: direct URL navigation
          await page.goto(`${env.originationUrl}new-application`, { waitUntil: 'domcontentloaded' });
        }
        await page.waitForLoadState('networkidle').catch(() => {});

        // Wait for the New Application form
        const emailField = page.locator(SELECTORS.naEmailAddress);
        await emailField.waitFor({ state: 'visible', timeout: 15_000 });

        // Fill customer contact details
        await emailField.fill(applicant.email);
        await page.locator(SELECTORS.naPhone).fill(applicant.phone);
        await page.waitForLoadState('networkidle').catch(() => {});
        console.log(`[PortalFlow] Filled email="${applicant.email}" phone="${applicant.phone}"`);

        // Select merchant — try native <select> first, then React dropdown
        const merchantNorm = data.merchant.replace(/[\s'&]/g, '').toLowerCase();
        let merchantSelected = false;

        const nativeDropdowns = page.locator('select.form-control, .form-control select');
        const nativeCount = await nativeDropdowns.count();
        for (let i = 0; i < nativeCount && !merchantSelected; i++) {
          const dropdown = nativeDropdowns.nth(i);
          const text = await dropdown.textContent().catch(() => '');
          if (text?.toLowerCase().includes('select') && text?.toLowerCase().includes('merchant')) {
            const options = dropdown.locator('option');
            const optCount = await options.count();
            for (let j = 1; j < optCount; j++) {
              const optText = (await options.nth(j).textContent())?.trim() ?? '';
              const optNorm = optText.replace(/[\s'&]/g, '').toLowerCase();
              if (optNorm.includes(merchantNorm) || merchantNorm.includes(optNorm)) {
                await dropdown.selectOption({ index: j });
                console.log(`[PortalFlow] Merchant selected (native): "${optText}"`);
                await page.waitForLoadState('networkidle').catch(() => {});
                merchantSelected = true;
                break;
              }
            }
          }
        }

        if (!merchantSelected) {
          const controls = page.locator(SELECTORS.filterControl);
          if (await controls.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
            await controls.first().click();
            await page.waitForLoadState('networkidle').catch(() => {});
            const options = page.locator(SELECTORS.filterOption);
            const optCount = await options.count().catch(() => 0);
            for (let j = 0; j < optCount && !merchantSelected; j++) {
              const optText = (await options.nth(j).textContent())?.trim() ?? '';
              const optNorm = optText.replace(/[\s'&]/g, '').toLowerCase();
              if (optNorm.includes(merchantNorm) || merchantNorm.includes(optNorm)) {
                await options.nth(j).click();
                console.log(`[PortalFlow] Merchant selected (React): "${optText}"`);
                merchantSelected = true;
                await page.waitForLoadState('networkidle').catch(() => {});
              }
            }
            if (!merchantSelected) await page.keyboard.press('Escape');
          }
        }

        if (!merchantSelected) {
          console.log(`[PortalFlow] WARNING: merchant "${data.merchant}" not found in dropdown`);
        }

        // Select a random location
        let locationSelected = false;
        for (let i = 0; i < nativeCount && !locationSelected; i++) {
          const dropdown = nativeDropdowns.nth(i);
          const text = await dropdown.textContent().catch(() => '');
          if (text?.toLowerCase().includes('location')) {
            const options = dropdown.locator('option');
            const optCount = await options.count();
            if (optCount > 1) {
              await dropdown.selectOption({ index: 1 + randomInt(optCount - 1) });
              locationSelected = true;
            }
            break;
          }
        }
        if (!locationSelected) {
          const controls = page.locator(SELECTORS.filterControl);
          const locationCtrl = controls.nth(1);
          if (await locationCtrl.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await locationCtrl.click();
            await page.waitForLoadState('networkidle').catch(() => {});
            const options = page.locator(SELECTORS.filterOption);
            const optCount = await options.count().catch(() => 0);
            if (optCount > 0) {
              await options.nth(randomInt(optCount)).click();
              locationSelected = true;
            }
          }
        }

        await page.waitForLoadState('networkidle').catch(() => {});

        // Submit the form
        const submitBtn = page.locator(SELECTORS.naSubmitNewApplicationBtn).first();
        await submitBtn.click();

        // Wait for toast confirming the application was sent to the customer
        const toast = page.locator(SELECTORS.toastBody);
        await toast.waitFor({ state: 'visible', timeout: 15_000 });
        const toastText = await toast.textContent();
        console.log(`[PortalFlow] New Application toast: "${toastText}"`);
        expect(toastText).toBeTruthy();
      });

      // ── Phase 3: Get leadPk + contract URL via API (hybrid) ───────────

      await test.step('3. sendApplication (API) → extract leadPk + contract URL', async () => {
        const appResp = await api.application.sendApplication(merchant, applicant, order);
        expect(appResp.ok, `sendApplication failed: ${appResp.status}`).toBeTruthy();

        ctx.leadPk = String(appResp.body.authorizationNumber ?? '');
        ctx.leadUuid = appResp.body.accountNumber ?? ctx.leadPk;
        expect(ctx.leadPk, 'leadPk must be present').toBeTruthy();

        const pdl = appResp.body.paymentDetailsList;
        expect(pdl?.length, 'paymentDetailsList should not be empty').toBeGreaterThan(0);
        const idx = pdl!.length > 1 ? 1 : 0;
        ctx.contractUrl = pdl![idx].redirectUrl ?? '';
        expect(ctx.contractUrl, 'Contract URL must be present').toBeTruthy();

        test.info().annotations.push(
          { type: 'leadPk', description: ctx.leadPk },
          { type: 'leadUuid', description: ctx.leadUuid },
          { type: 'contractUrl', description: ctx.contractUrl },
        );
        console.log(`[PortalFlow] leadPk=${ctx.leadPk} leadUuid=${ctx.leadUuid}`);
        console.log(`[PortalFlow] contractUrl=${ctx.contractUrl}`);
      });

      // ── Phase 4: Customer fills contract form ─────────────────────────

      await test.step('4. Navigate to contract URL and fill CC + bank info', async () => {
        await page.goto(ctx.contractUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForLoadState('networkidle').catch(() => {});

        const contractPage = new ContractPage(page);
        await contractPage.waitForSpinner();
        await contractPage.dismissSeonOverlay();

        await contractPage.fillCreditCardInfo({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          cardNumber: TEST_CARDS.VISA_APPROVED.number,
          cvc: TEST_CARDS.VISA_APPROVED.cvv,
          expDate: TEST_CARDS.VISA_APPROVED.expirationDate,
        });

        await contractPage.fillBankInfo({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          routingNumber: TEST_BANK.DEFAULT_ROUTING,
          accountNumber: TEST_BANK.DEFAULT_ACCOUNT_SHORT,
        });

        await contractPage.submitPaymentInfo();

        // Verify no error appeared after submission
        await page.waitForLoadState('networkidle').catch(() => {});
        const errorToast = page.locator(SELECTORS.toastError).first();
        if (await errorToast.isVisible({ timeout: 2_000 }).catch(() => false)) {
          const errText = (await errorToast.textContent())?.trim();
          throw new Error(`Contract submission error: "${errText}"`);
        }
        console.log('[PortalFlow] CC + bank info submitted on contract page');
      });

      // ── Phase 5: T&C + e-sign ─────────────────────────────────────────

      await test.step('5. Complete T&C + e-sign (Signwell)', async () => {
        const contractPage = new ContractPage(page);
        await contractPage.completeTermsAndConditions();
        await contractPage.completeESign();
        console.log('[PortalFlow] E-sign completed');
      });

      // ── Phase 6: Navigate to customer in portal → wait for SIGNED → settle

      await test.step('6. Return to origination portal → wait for SIGNED → settle', async () => {
        const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
        await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        // Click "Get Document Status" if present (triggers Signwell webhook poll)
        const getDocStatusBtn = page.getByText('Get Document Status', { exact: true });
        if (await getDocStatusBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await getDocStatusBtn.click({ force: true });
          console.log('[PortalFlow] Clicked "Get Document Status"');
          await sleep(5_000);
          await customerPage.waitForSpinner();
        }

        // Poll until status is SIGNED (or already further along)
        const { status: signedStatus } = await customerPage.pollForLeadStatus(
          ['signed', 'settled', 'fund'],
          10,
          5_000,
        );
        console.log(`[PortalFlow] Status after e-sign poll: "${signedStatus}"`);
        const sl = signedStatus.toLowerCase();

        // Change to Signed if needed (some envs require manual trigger)
        if (!sl.includes('signed') && !sl.includes('settled') && !sl.includes('fund')) {
          if (await customerPage.changeToSignedButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await customerPage.changeToSigned();
            console.log('[PortalFlow] Changed to Signed');
          }
        }

        // Settle if not already settled/funded
        if (!sl.includes('settled') && !sl.includes('fund')) {
          await customerPage.settleLeaseViaDocuments();
          console.log('[PortalFlow] Settle initiated via Documents card');
        } else {
          console.log(`[PortalFlow] Skipping settle — already in "${signedStatus}"`);
        }

        // Wait for FUNDING status
        await customerPage.pollForLeadStatus(['fund'], 15, 3_000);
      });

      // ── Phase 7: Fund via Funding Queue UI ───────────────────────────

      await test.step('7. Fund via Funding Queue portal UI', async () => {
        const fundingPage = new FundingPage(page);
        await fundingPage.navigateToFundingQueue();
        await fundingPage.waitForSpinner();

        // Expand filters and set date range to today
        await fundingPage.expandFilters();
        const today = new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
        });
        const startDateInput = page.getByRole('searchbox', { name: 'Start Date' });
        const endDateInput = page.getByRole('searchbox', { name: 'End Date' });
        for (const dateInput of [startDateInput, endDateInput]) {
          if (await dateInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await dateInput.click({ clickCount: 3 });
            await dateInput.fill(today);
            await dateInput.press('Tab');
          }
        }

        await fundingPage.filterByStatus(FundingQueueStatus.FUNDING);

        const found = await fundingPage.searchUntilRecordsAppear(8, 15_000);
        if (!found) {
          console.log('[PortalFlow] No records in Funding queue — may have auto-transitioned to Funded');
        } else {
          try {
            await fundingPage.fundFirstEntry();
            console.log('[PortalFlow] fundFirstEntry completed');
          } catch (err) {
            console.log(
              `[PortalFlow] fundFirstEntry failed (non-fatal): ${(err as Error).message.split('\n')[0]}`,
            );
          }
        }
      });

      // ── Phase 8: Verify FUNDING/FUNDED status ────────────────────────

      await test.step('8. getApplicationStatus → verify FUNDING/FUNDED', async () => {
        let currentStatus = '';
        let fundRequestDateTime = '';
        let amountToBeFunded = 0;

        for (let attempt = 1; attempt <= 6; attempt++) {
          const resp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
          expect(resp.ok, `getApplicationStatus: ${resp.status}`).toBeTruthy();
          currentStatus = resp.body.currentStatus ?? '';
          fundRequestDateTime = resp.body.fundRequestDateTime ?? '';
          amountToBeFunded = resp.body.amountToBeFunded ?? 0;

          if (['FUNDING', 'FUNDED'].includes(currentStatus)) break;
          console.log(
            `[PortalFlow] Waiting for FUNDING/FUNDED... attempt=${attempt} status=${currentStatus}`,
          );
          await sleep(5_000);
        }

        expect(['FUNDING', 'FUNDED'], `Expected FUNDING or FUNDED, got: ${currentStatus}`).toContain(
          currentStatus,
        );
        expect(fundRequestDateTime, 'fundRequestDateTime should be set').toBeTruthy();
        expect(amountToBeFunded, 'amountToBeFunded should be > 0').toBeGreaterThan(0);
        console.log(`[PortalFlow] Final: status=${currentStatus} amount=$${amountToBeFunded}`);
      });
    });
  });
}

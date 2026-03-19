/**
 * TireAgent Unified Flow — E2E test covering the PayPair portal merchant flow.
 * Migrated from: TV_TireAgentUnifiedFlow.feature (Java/Cucumber)
 *
 * This test uses the PayPair merchant portal (dw93bg.paypair.com) instead of the
 * direct UOWN API to create applications. The flow:
 *   1. Navigate to PayPair portal → login → select merchant
 *   2. Fill personal info JSON + cart JSON → click "Get Lease"
 *   3. Handle phone OTP verification (network intercept)
 *   4. Fill application details (DOB, SSN, income, payment frequency)
 *   5. Validate prequalification → select plan → capture offer values
 *   6. Proceed to last step (pt-iframe) → complete payment info
 *   7. Switch back to origination portal → verify contract created
 *   8. Complete e-sign → verify document status
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OriginationCustomerPage, PayPairPortalPage } from '@pages/origination/index.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import { buildTestData, loginToPortalWithOptions, sleep } from '@helpers/index.js';
import {
  DEFAULT_TIRE_AGENT_PRODUCT,
  DEFAULT_PAYPAIR_CONFIG,
  buildPayPairPersonalInfoJson,
  buildPayPairCartJson,
  generatePayPairTestPhone,
} from '@data/index.js';

// ── Parameterized test data ──────────────────────────────────────────

const testData = [
  {
    env: 'sandbox',
    state: 'OH',
    merchant: 'TireAgent',
    paymentFrequency: 'Weekly' as const,
    tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX),
  },
];

// ── Test suite ───────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(`TireAgent Unified Flow - ${data.env} ${data.state}/${data.merchant}`, { tag: data.tag.split(' ') }, () => {
    test.use({ envName: data.env });

    test(`Creating Uown account via PayPair portal in "${data.env}"`, async ({ page, ctx }) => {
      test.setTimeout(720_000); // 12 min — PayPair flow is multi-step

      const { env, address, merchant, applicant, order } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: String(DEFAULT_TIRE_AGENT_PRODUCT.price + DEFAULT_TIRE_AGENT_PRODUCT.taxAmount),
        orderDescription: 'TireAgent unified flow',
        sanitizeNames: true,
      });

      // Override phone with PayPair-compatible prefix (111/222)
      applicant.phone = generatePayPairTestPhone();

      const paypair = new PayPairPortalPage(page);

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 1: PAYPAIR PORTAL — Navigate & Select Merchant
      //  (No login required — PayPair demo page is public)
      // ═══════════════════════════════════════════════════════════════

      await test.step('Navigate to PayPair portal', async () => {
        await paypair.navigateToPortal();
      });

      await test.step('Select TireAgent merchant and init widget', async () => {
        await paypair.selectMerchant('TireAgent');
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 2: FILL APPLICATION DATA (JSON textareas)
      // ═══════════════════════════════════════════════════════════════

      await test.step('Fill personal info and configuration', async () => {
        const personalInfoJson = buildPayPairPersonalInfoJson({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          email: applicant.email,
          street: address.street,
          city: address.city,
          state: data.state,
          postalCode: address.zipCode,
          country: 'US',
        });
        await paypair.fillPersonalInfo(personalInfoJson);
        await paypair.fillProviderAndConfig(
          DEFAULT_PAYPAIR_CONFIG.provider,
          DEFAULT_PAYPAIR_CONFIG.prequalification,
          DEFAULT_PAYPAIR_CONFIG.productSelectionType,
        );
      });

      await test.step('Fill cart info and send data', async () => {
        const cartJson = buildPayPairCartJson([DEFAULT_TIRE_AGENT_PRODUCT]);
        await paypair.fillCartInfo(cartJson);
        await paypair.clickGetLease();
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 3: PHONE OTP VERIFICATION
      // ═══════════════════════════════════════════════════════════════

      await test.step('Handle phone verification (OTP)', async () => {
        await paypair.handlePhoneVerification(applicant.phone);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 4: APPLICATION DETAILS + PLAN SELECTION
      // ═══════════════════════════════════════════════════════════════

      await test.step('Fill application details', async () => {
        await paypair.fillApplicationDetails(applicant.ssn);
      });

      await test.step('Wait for plans to load', async () => {
        await paypair.waitForPlansToLoad();
      });

      await test.step('Validate prequalification approved', async () => {
        await paypair.validatePrequalificationApproved();
      });

      await test.step('Open plan details', async () => {
        await paypair.openPlanDetails();
      });

      await test.step('Select payment frequency', async () => {
        await paypair.selectPaymentFrequency(data.paymentFrequency);
      });

      await test.step('Continue with Uown plan', async () => {
        await paypair.continueWithUown();
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 5: CAPTURE OFFER & PROCEED TO PAYMENT
      // ═══════════════════════════════════════════════════════════════

      await test.step('Capture offer values', async () => {
        const offerValues = await paypair.captureOfferValues();
        test.info().annotations.push({ type: 'approvalAmount', description: offerValues.approvalAmount });
        test.info().annotations.push({ type: 'cartTotal', description: offerValues.cartTotal });
        test.info().annotations.push({ type: 'recurringPayment', description: offerValues.recurringPayment });
        console.log(`[Phase 5] Offer — Approval: ${offerValues.approvalAmount}, Cart: ${offerValues.cartTotal}, Recurring: ${offerValues.recurringPayment}`);
      });

      await test.step('Proceed to last step (enter pt-iframe)', async () => {
        await paypair.proceedToLastStep();
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 6: COMPLETE PAYMENT INFO (inside pt-iframe)
      //  The pt-iframe contains the UOWN contract/payment form.
      //  After payment, the flow continues with signing.
      // ═══════════════════════════════════════════════════════════════

      await test.step('Complete payment info in pt-iframe', async () => {
        const ccNumber = process.env.CC_SUBSCRIPTION_CARD_NUMBER || '6011000993026909';
        const ccCvv = process.env.CC_SUBSCRIPTION_CVV || '996';
        const ccExpDate = process.env.CC_SUBSCRIPTION_EXPIRATION_DATE || '12/28';

        await paypair.completePaymentAndSigning(
          { firstName: applicant.firstName, lastName: applicant.lastName },
          { number: ccNumber, cvv: ccCvv, expDate: ccExpDate },
        );
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 7: OPEN NEW TAB → ORIGINATION PORTAL — Verify Status
      //  Keep the PayPair/signing tab open while checking origination
      // ═══════════════════════════════════════════════════════════════

      await test.step('Open origination portal in new tab and verify status', async () => {
        // Open a new tab for the origination portal (keep PayPair tab intact)
        const context = page.context();
        const originationPage = await context.newPage();
        console.log('[Phase 7] Opened new tab for origination portal');

        await originationPage.goto(env.originationUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await loginToPortalWithOptions(originationPage, env.originationUrl, env);
        await originationPage.waitForLoadState('networkidle').catch(() => {});

        // Wait for the Overview page table to load
        const table = originationPage.locator("table, [role='table']").first();
        await table.waitFor({ state: 'visible', timeout: 30_000 });
        await originationPage.waitForLoadState('networkidle').catch(() => {});

        // Find the lead row by email
        const findLeadRow = async () => {
          const row = originationPage.locator(`div[role='row']:has-text('${applicant.email}'), tr:has-text('${applicant.email}')`).first();
          if (await row.isVisible({ timeout: 5_000 }).catch(() => false)) return row;
          return null;
        };

        let leadRow = await findLeadRow();
        if (leadRow) {
          const refLink = leadRow.locator('a').first();
          const refText = await refLink.textContent();
          ctx.leadPk = refText?.trim() || '';
          test.info().annotations.push({ type: 'leadPk', description: ctx.leadPk });
          console.log(`[Phase 7] Found lead row, leadPk: ${ctx.leadPk}`);
        }

        // Poll for status to advance (max 180s — e-sign may still be processing)
        const maxPollSeconds = 180;
        let currentStatus = '';
        for (let elapsed = 0; elapsed < maxPollSeconds; elapsed += 5) {
          await originationPage.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
          await originationPage.waitForLoadState('networkidle').catch(() => {});

          leadRow = await findLeadRow();
          if (leadRow) {
            const statusCell = leadRow.locator("div[role='cell']:nth-child(7), td:nth-child(7)").first();
            currentStatus = (await statusCell.textContent())?.trim().toLowerCase() || '';
            console.log(`[Phase 7] Poll ${elapsed}s — status: "${currentStatus}"`);

            if (currentStatus.includes('signed') || currentStatus.includes('settled') || currentStatus.includes('fund')) {
              console.log(`[Phase 7] ✓ Status reached "${currentStatus}" — integration verified!`);
              break;
            }
          }
          await sleep(3_000);
        }

        // Navigate to the customer detail page
        leadRow = await findLeadRow();
        if (leadRow) {
          const refLink = leadRow.locator('a').first();
          await refLink.click();
          await originationPage.waitForLoadState('domcontentloaded');
        }

        const customerPage = new OriginationCustomerPage(originationPage);
        await customerPage.waitForSpinner();

        const urlMatch = originationPage.url().match(/\/customers\/(\d+)/);
        if (urlMatch) {
          ctx.leadPk = urlMatch[1];
          console.log(`[Phase 7] Customer page leadPk: ${ctx.leadPk}`);
        }

        const status = await customerPage.getLeadStatus();
        console.log(`[Phase 7] Lead status on detail page: "${status}"`);
        test.info().annotations.push({ type: 'leadStatus', description: status });

        // Verify the lead reached SIGNED (integration test — must sign via partner portal)
        expect(status.toLowerCase()).toMatch(
          /signed|settled|fund/,
        );
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 8: VERIFY FINAL STATUS (no manual overrides)
      // ═══════════════════════════════════════════════════════════════

      await test.step('Verify final integration status', async () => {
        // Use the origination tab (second page in context)
        const pages = page.context().pages();
        const originationPage = pages[pages.length - 1];
        const customerPage = new OriginationCustomerPage(originationPage);

        const finalStatus = await customerPage.getLeadStatus();
        console.log(`[Final] Lead status: "${finalStatus}"`);
        test.info().annotations.push({ type: 'finalStatus', description: finalStatus });

        // Integration test: status MUST be Signed or beyond — no manual fallbacks
        expect(finalStatus.toLowerCase()).toMatch(
          /signed|settled|fund/,
        );
      });
    });
  });
}

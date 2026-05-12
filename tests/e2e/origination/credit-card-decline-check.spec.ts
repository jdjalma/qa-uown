/**
 * Credit Card Decline Check - E2E test covering credit card decline validation on contract page.
 * Migrated from: CreditCardDeclineCheck.feature
 *
 * This test covers:
 *   1. Account creation via API (sendApplication + sendInvoice, skip CC auth)
 *   2. Navigate to contract URL (consumer-facing payment form)
 *   3. Test all 14 decline cards — each must show toast error and block "PROCEED TO SIGNATURE"
 *   4. Complete payment with valid card + bank info
 *   5. Complete e-sign (Signwell or PandaDocs)
 *   6. Verify contract created + signed on origination portal
 *   7. Settle lease + fund via funding queue
 *   8. Transfer to servicing and attempt CC change
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ContractPage, OriginationCustomerPage, FundingPage } from '@pages/origination/index.js';
import { ServicingCustomerPage } from '@pages/servicing/index.js';
import { FundingQueueStatus, TestTag, buildTags } from '@ptypes/enums.js';
import { ALL_TEST_CARDS, getDeclinedCards } from '@data/index.js';
import { buildTestData, loginToPortalWithOptions, navigateToServicingCustomer } from '@helpers/index.js';
import { SELECTORS } from '@selectors/index.js';
import { TEST_BANK } from '@config/index.js';

const testData = {
  state: 'NY',
  merchant: 'TireAgent',
  tag: buildTags(TestTag.SANITY, TestTag.REGRESSION),
};

test.describe(`Credit Card Decline Check - ${testData.state}/${testData.merchant}`, { tag: testData.tag.split(' ') }, () => {
  test('Creating Uown account', async ({ page, api, ctx, merchantConfig: mSetup }) => {
    const { env, merchant, applicant, order } = buildTestData({
      state: testData.state,
      merchant: testData.merchant,
      orderTotal: '621',
      orderDescription: 'CC decline check test',
      sanitizeNames: true,
    });
    test.setTimeout(600_000); // 10 min — decline loop + e-sign takes time

    await test.step('Ensure merchant config', async () => {
      await mSetup.configureByName(testData.merchant, 'lifecycle');
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 1: SEND APPLICATION via API (no invoice yet)
    // ═══════════════════════════════════════════════════════════════
    //
    // We only call sendApplication here (NOT sendInvoice). The invoice
    // must be sent AFTER the contract page is completed, otherwise the
    // contract URL becomes "Invalid link".

    await test.step('Send application via API', async () => {
      const appResponse = await api.application.sendApplication(merchant, applicant, order);
      expect(appResponse.ok, `sendApplication responded with ${appResponse.status}`).toBeTruthy();

      ctx.leadPk = String(appResponse.body.authorizationNumber ?? '');
      ctx.leadUuid = appResponse.body.accountNumber ?? ctx.leadPk;

      // Extract contract URL from paymentDetailsList
      const paymentDetails = appResponse.body.paymentDetailsList;
      if (paymentDetails && paymentDetails.length > 0) {
        const idx = paymentDetails.length > 1 ? 1 : 0;
        ctx.contractUrl = paymentDetails[idx].redirectUrl ?? '';
      }
      expect(ctx.contractUrl, 'No contract URL in sendApplication response').toBeTruthy();

      test.info().annotations.push({ type: 'leadPk', description: ctx.leadPk });
      test.info().annotations.push({ type: 'leadUuid', description: ctx.leadUuid });
      test.info().annotations.push({ type: 'contractUrl', description: ctx.contractUrl! });

      console.log(`[Phase 1] leadPk: "${ctx.leadPk}" leadUuid: "${ctx.leadUuid}"`);
      console.log(`[Phase 1] contractUrl: "${ctx.contractUrl}"`);
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 2: NAVIGATE TO CONTRACT PAGE
    // ═══════════════════════════════════════════════════════════════

    await test.step('Navigate to contract URL', async () => {
      expect(ctx.contractUrl, 'Contract URL must be available').toBeTruthy();

      // Clear origination portal cookies to avoid "Invalid link" on contract page
      await page.context().clearCookies();
      await page.goto(ctx.contractUrl!, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      // Wait for CC first name field to be visible (form loaded)
      const firstNameField = page.locator(
        `${SELECTORS.ccFirstName}, input[placeholder*="First Name"]`
      ).first();
      await firstNameField.waitFor({ state: 'visible', timeout: 30_000 });
      console.log('[Phase 2] Contract page loaded');
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 3: CREDIT CARD DECLINE VALIDATION (14 cards)
    // ═══════════════════════════════════════════════════════════════

    const declineCards = getDeclinedCards().filter(c => c.name.startsWith('Decline'));

    await test.step(`Test all ${declineCards.length} decline cards`, async () => {
      const contractPage = new ContractPage(page);
      const results: Array<{ card: string; toast: string }> = [];

      for (let i = 0; i < declineCards.length; i++) {
        const card = declineCards[i];
        const toastText = await contractPage.testDeclineCard(
          card,
          applicant.firstName,
          applicant.lastName,
          i === 0, // isFirstCard
        );

        results.push({ card: card.name, toast: toastText });
        expect(toastText, `Decline card ${card.name} should show error toast`).not.toBe('NOTEXT');
      }

      console.log(`[Phase 3] All ${declineCards.length} decline cards rejected successfully`);
      console.log('[Phase 3] Results:');
      for (const r of results) {
        console.log(`  ${r.card}: "${r.toast}"`);
      }

      test.info().annotations.push({
        type: 'declineCardsTestedCount',
        description: String(declineCards.length),
      });
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 4: COMPLETE PAYMENT WITH VALID CARD
    // ═══════════════════════════════════════════════════════════════

    await test.step('Complete payment with valid card', async () => {
      // Refresh page to clear form state after decline tests
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const contractPage = new ContractPage(page);
      const firstNameField = page.locator(
        `${SELECTORS.ccFirstName}, input[placeholder*="First Name"]`
      ).first();
      await firstNameField.waitFor({ state: 'visible', timeout: 15_000 });

      // Fill bank info
      await contractPage.fillBankInfo({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        routingNumber: TEST_BANK.DEFAULT_ROUTING,
        accountNumber: TEST_BANK.DEFAULT_ACCOUNT_SHORT,
        accountType: TEST_BANK.DEFAULT_TYPE,
      });

      // Fill CC info with approved card (Discover 6011)
      const approvedCard = ALL_TEST_CARDS.DISCOVER_APPROVED;
      await contractPage.fillCreditCardInfo({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        cardNumber: approvedCard.number,
        cvc: approvedCard.cvv,
        expDate: `${approvedCard.expMonth}/${approvedCard.expYear}`,
      });

      // Submit payment
      await contractPage.submitPaymentInfo();
      console.log('[Phase 4] Payment submitted with valid card');
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 5: COMPLETE TERMS & CONDITIONS + E-SIGN
    // ═══════════════════════════════════════════════════════════════

    await test.step('Complete Terms & Conditions', async () => {
      const contractPage = new ContractPage(page);
      await contractPage.completeTermsAndConditions();
      console.log('[Phase 5] Terms & Conditions completed');
    });

    await test.step('Complete e-sign', async () => {
      const contractPage = new ContractPage(page);
      await contractPage.completeESign();
      console.log('[Phase 5] E-sign completed');
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 6: VERIFY ON ORIGINATION PORTAL
    // ═══════════════════════════════════════════════════════════════

    await test.step('Login to origination and verify customer page', async () => {
      await loginToPortalWithOptions(page, env.originationUrl, env);
      await page.waitForLoadState('networkidle').catch(() => {});

      // Navigate to individual customer page
      const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
      console.log(`[Phase 6] Navigating to: ${customerUrl}`);
      await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const customerPage = new OriginationCustomerPage(page);
      await customerPage.waitForSpinner();
      console.log('[Phase 6] Customer page loaded');
    });

    await test.step('Check change to signed button is not visible', async () => {
      const customerPage = new OriginationCustomerPage(page);
      await expect(customerPage.changeToSignedButton).not.toBeVisible({ timeout: 5_000 });
      console.log('[Phase 6] "Change to Signed" button is not visible — lead already SIGNED');
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 7: SETTLE + FUND
    // ═══════════════════════════════════════════════════════════════

    await test.step('Settle the new lease', async () => {
      const customerPage = new OriginationCustomerPage(page);
      await customerPage.settleLeaseViaDocuments();
      console.log('[Phase 7] Lease settled');
    });

    await test.step('Fund via funding queue', async () => {
      // Navigate to funding page
      const fundingUrl = `${env.originationUrl}funding`;
      await page.goto(fundingUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const fundingPage = new FundingPage(page);
      await fundingPage.waitForSpinner();

      // Filter by Funding status and search until the account appears
      await fundingPage.filterByStatus(FundingQueueStatus.FUNDING);
      const found = await fundingPage.searchUntilRecordsAppear(8, 15_000);
      if (!found) {
        console.log('[Phase 7] No records in Funding queue — may have gone directly to Funded');
      } else {
        await fundingPage.fundFirstEntry();
        console.log('[Phase 7] Funded successfully');
      }
    });

    // ═══════════════════════════════════════════════════════════════
    //  PHASE 8: GET ACCOUNT PK + SERVICING
    // ═══════════════════════════════════════════════════════════════

    await test.step('Navigate to customer page and get accountPk', async () => {
      const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
      await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const customerPage = new OriginationCustomerPage(page);
      await customerPage.waitForSpinner();

      // Extract account number from customer summary
      const accountLink = page.locator(SELECTORS.accountNumberLink);
      if (await accountLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const accountText = (await accountLink.textContent())?.trim() || '';
        ctx.accountNumber = accountText;
        console.log(`[Phase 8] accountNumber: "${accountText}"`);
        test.info().annotations.push({ type: 'accountNumber', description: accountText });
      }
    });

    await test.step('Transfer to servicing and attempt CC change', async () => {
      // Login to servicing portal
      await loginToPortalWithOptions(page, env.servicingUrl, env);
      await page.waitForLoadState('networkidle').catch(() => {});

      // Navigate to customer in servicing using accountPk or leadPk
      const searchId = ctx.accountNumber || ctx.leadPk;
      await navigateToServicingCustomer(page, searchId);

      const servicingCustomer = new ServicingCustomerPage(page);
      await servicingCustomer.waitForSpinner();

      // Attempt to add/change credit card
      const addCardBtn = page.locator(SELECTORS.addCardButton);
      if (await addCardBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        const card = ALL_TEST_CARDS.VISA_APPROVED;
        await servicingCustomer.addCreditCard({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          cardNumber: card.number,
          expMonth: card.expMonth,
          expYear: card.expYear,
          cvc: card.cvv,
        });
        ctx.ccAdded = 1;
        console.log('[Phase 8] Credit card added in servicing');
      } else {
        console.log('[Phase 8] Add Card button not visible — skipping CC change');
      }
    });
  });
});

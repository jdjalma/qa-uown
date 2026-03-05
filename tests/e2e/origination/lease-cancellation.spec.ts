/**
 * Lease Cancellation — E2E tests covering cancellation workflows across multiple states.
 *
 * Scenarios:
 *   1. Invoice Cancellation at APPROVED — delete all invoice items, save, verify INVOICE_CANCELED
 *   2. Lease Cancellation at SIGNED — cancel via "Cancel Lease" button
 *   3. Lease Cancellation at FUNDING (no refund) — payments in servicing + customer portal, cancel, verify statuses
 *   4. Lease Cancellation at FUNDING (with refund) — payments in servicing + customer portal, cancel with refund, verify refunded values
 *
 * Note: "Cancel Lease" button is only available from SIGNED onwards.
 * FUNDED is out of scope — funded leases follow a separate refund flow (PayTomorrow portal).
 *
 * Strategy: Send application WITHOUT order data (pre-qualification), then retrieve
 * the approvedAmount from getApplicationStatus and use THAT for invoice. This avoids
 * 400 errors when the requested amount exceeds the sandbox approval limit.
 *
 * Run: node node_modules/.bin/playwright test tests/e2e/origination/lease-cancellation.spec.ts
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OriginationCustomerPage } from '@pages/origination/index.js';
import { ServicingCustomerPage } from '@pages/servicing/index.js';
import { WebsiteBasePage } from '@pages/website/index.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';
import type { ConfigEnvironment } from '@config/environment.js';
import {
  buildTestData,
  buildCcPaymentDetails,
  createPreQualifiedApplication,
  driveLeadToFunding,
  loginToPortal,
  navigateToOriginationCustomer,
  navigateToServicingCustomer,
  sleep,
} from '@helpers/index.js';
import { TEST_CARDS } from '@data/index.js';

// ── Shared helpers ───────────────────────────────────────────────────

/**
 * Navigates to servicing portal and validates the account status contains expectedStatus.
 */
async function verifyServicingAccountStatus(
  page: import('@playwright/test').Page,
  env: ConfigEnvironment,
  accountNumber: string,
  leadUuid: string,
  expectedStatus: string,
): Promise<void> {
  await sleep(5_000);

  await loginToPortal(page, env.servicingUrl, env);
  if (accountNumber) {
    await page.goto(`${env.servicingUrl}customer-information/${accountNumber}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.waitForLoadState('networkidle').catch(() => {});
  } else {
    await navigateToServicingCustomer(page, leadUuid);
  }
  const svcCustomerPage = new ServicingCustomerPage(page);
  await svcCustomerPage.waitForSpinner();
  const accountStatus = await svcCustomerPage.getAccountStatus();
  console.log(`[Test] Servicing account status: "${accountStatus}"`);
  expect(
    accountStatus.toUpperCase(),
    `Expected ${expectedStatus} but got: ${accountStatus}`,
  ).toContain(expectedStatus.toUpperCase());
}

/**
 * Logs in to the website (customer) portal via email OTP and makes a CC payment.
 */
async function makePaymentOnCustomerPortal(
  page: import('@playwright/test').Page,
  env: ConfigEnvironment,
  emailFixture: import('../../../src/helpers/email.helpers.js').EmailHelpers,
  applicantEmail: string,
  paymentAmount: string,
): Promise<void> {
  // Navigate to website portal
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto(env.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      break;
    } catch (err) {
      console.log(`[Website] Navigation attempt ${attempt}/3 failed: ${(err as Error).message.split('\n')[0]}`);
      if (attempt === 3) throw err;
      await sleep(3_000);
    }
  }

  // Login with email OTP
  const websitePage = new WebsiteBasePage(page);
  await websitePage.loginWithEmail(applicantEmail);
  console.log(`[Website] Waiting for verification code email for ${applicantEmail}...`);
  const verificationCode = await emailFixture.getVerificationCode(applicantEmail);
  expect(verificationCode, `Verification code not found for ${applicantEmail}`).toBeTruthy();
  console.log(`[Website] Got verification code: ${verificationCode}`);
  await websitePage.enterVerificationCode(verificationCode!);

  // Make CC payment
  await websitePage.makeCcPayment(paymentAmount);
  console.log(`[Website] CC payment of $${paymentAmount} submitted on customer portal`);
}

// ── Scenario 1: Invoice Cancellation at APPROVED ─────────────────────

const approvedCancellationData = [
  { env: 'sandbox', state: 'CA', merchant: 'ProgressMobility', tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX) },
];

for (const data of approvedCancellationData) {
  test.describe(`Invoice Cancellation at APPROVED - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('Cancel invoice items at APPROVED and verify INVOICE_CANCELED status', async ({ page, api, ctx }) => {
      test.setTimeout(300_000);
      const { env, merchant, applicant } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'Invoice cancellation test',
      });

      await test.step('Setup application at APPROVED with invoice', async () => {
        await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, test.info());
      });

      await test.step('Login to origination and access invoice to delete items', async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);

        // Access the invoice by clicking the "Invoice #XXXXX" link in the Documents card
        const invoiceLink = page.locator('button').filter({ hasText: /Invoice\s*#/i }).first();
        await invoiceLink.waitFor({ state: 'visible', timeout: 30_000 });
        const invoiceLinkText = await invoiceLink.textContent();
        console.log(`[Test] Clicking invoice link: "${invoiceLinkText?.trim()}"`);
        await invoiceLink.click();
        await customerPage.waitForSpinner();
        await page.waitForLoadState('networkidle').catch(() => {});

        // Delete all invoice items inside the invoice view
        const deletedCount = await customerPage.deleteAllInvoiceItems();
        console.log(`[Test] Deleted ${deletedCount} invoice items`);
        expect(deletedCount, 'Should have deleted at least 1 invoice item').toBeGreaterThan(0);

        // Save after deleting items — button text is "Save" (CSS text-uppercase displays as "SAVE")
        const saveBtn = page.getByRole('button', { name: /^save$/i }).first();
        await saveBtn.waitFor({ state: 'visible', timeout: 10_000 });
        await saveBtn.click();
        await customerPage.waitForSpinner();
        console.log('[Test] Saved invoice after deleting items');
      });

      await test.step('Cancel invoice via API (orderType 5)', async () => {
        // UI deletion removes items but doesn't change the invoice status.
        // The invoice cancellation is triggered by sendInvoice with orderType "5".
        // Build minimal cancel body — the API only needs credentials + orderType + accountNumber.
        const cancelBody = {
          userName: merchant.username,
          setupPassword: merchant.password,
          merchantNumber: merchant.number,
          localeString: 'en_US',
          storeNumber: '1',
          selectedPaymentFrequency: 'WEEKLY',
          accountNumber: ctx.leadUuid,
          invoiceNumber: 'R91931',
          orderType: '5',
          merchandiseSubtotal: '0.00',
          discountAmount: '0.00',
          deliveryCharge: '0.00',
          installationCharge: '0.00',
          salesTax: '0.00',
          miscellaneousFees: '0.00',
          depositAmount: '0.00',
          orderTotal: '0.00',
          lineItem: [],
        };
        const cancelResp = await api.invoice.sendInvoice(cancelBody);
        console.log(`[Test] Cancel invoice API response: status=${cancelResp.status}, body=${JSON.stringify(cancelResp.body)}`);
        expect(cancelResp.ok, `cancelInvoice responded with ${cancelResp.status}: ${JSON.stringify(cancelResp.body)}`).toBeTruthy();
      });

      await test.step('Verify application status is INVOICE_CANCELED', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();
        const internalStatus = await customerPage.getInternalStatus();
        console.log(`[Test] Internal status after invoice cancel: "${internalStatus}"`);
        expect(
          internalStatus.toUpperCase(),
          `Expected INVOICE_CANCELED but got: ${internalStatus}`,
        ).toContain('INVOICE_CANCEL');
      });
    });
  });
}

// ── Scenario 2: Lease Cancellation at SIGNED ─────────────────────────

const signedCancellationData = [
  { env: 'sandbox', state: 'CA', merchant: 'ProgressMobility', tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX) },
];

for (const data of signedCancellationData) {
  test.describe(`Lease Cancellation at SIGNED - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('Cancel lease at SIGNED and verify UW_APPROVED status', async ({ page, api, ctx }) => {
      test.setTimeout(300_000);
      const { env, merchant, applicant } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'Signed cancellation test',
      });

      await test.step('Setup application with payment info via API', async () => {
        await createPreQualifiedApplication(api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info());
      });

      await test.step('Change lead status to SIGNED via API', async () => {
        const response = await api.lead.changeLeadStatus(
          merchant, Number(ctx.leadPk), 'SIGNED', 'Automated test - setting to SIGNED',
        );
        expect(response.ok, `changeLeadStatus responded with ${response.status}`).toBeTruthy();
      });

      await test.step('Login to origination and cancel lease', async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);
        const toastText = await customerPage.cancelLease(
          'Automated lease cancellation test at SIGNED',
          false,
        );
        console.log(`[Test] Cancel toast: "${toastText}"`);
        expect(toastText.toLowerCase()).toContain('cancel');
      });

      await test.step('Verify internal status is UW_APPROVED after cancellation', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();
        const internalStatus = await customerPage.getInternalStatus();
        console.log(`[Test] Internal status after cancel: "${internalStatus}"`);
        expect(internalStatus.toUpperCase()).toContain('UW_APPROVED');
      });
    });
  });
}

// ── Scenario 3: Lease Cancellation at FUNDING — No Refund ────────────

const fundingNoRefundData = [
  {
    env: 'sandbox',
    state: 'CA',
    merchant: 'ProgressMobility',
    servicingPaymentAmount: '25',
    customerPaymentAmount: '15',
    tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX),
  },
];

for (const data of fundingNoRefundData) {
  test.describe(`Lease Cancellation at FUNDING (no refund) - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('Cancel lease at FUNDING after payments in servicing + customer portal, no refund', async ({ page, api, email, ctx }) => {
      test.setTimeout(600_000);
      const { env, merchant, applicant, address } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'Funding cancellation no refund test',
      });

      await test.step('Setup application to FUNDING via API', async () => {
        await createPreQualifiedApplication(api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info());
        await driveLeadToFunding(api, merchant, ctx);
      });

      await test.step('Make CC payment in servicing portal', async () => {
        await loginToPortal(page, env.servicingUrl, env);
        await navigateToServicingCustomer(page, ctx.leadPk);

        const svcCustomerPage = new ServicingCustomerPage(page);
        const card = TEST_CARDS.VISA_APPROVED;
        await svcCustomerPage.addCreditCard({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          cardNumber: card.number,
          expMonth: card.expMonth,
          expYear: card.expYear,
          cvc: card.cvv,
        });

        const billing = { address: address.street, city: address.city, state: data.state, zip: address.zipCode };
        await svcCustomerPage.makeCcPayment('0', data.servicingPaymentAmount, buildCcPaymentDetails(card, billing));
        console.log(`[Test] CC payment of $${data.servicingPaymentAmount} made in servicing portal`);
      });

      await test.step('Make CC payment in customer portal (website)', async () => {
        await makePaymentOnCustomerPortal(page, env, email, applicant.email, data.customerPaymentAmount);
      });

      let accountNumber = '';

      await test.step('Login to origination and cancel lease without refund', async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);
        const toastText = await customerPage.cancelLease(
          'Automated lease cancellation at FUNDING without refund',
          false,
        );
        console.log(`[Test] Cancel toast: "${toastText}"`);
        expect(toastText.toLowerCase()).toContain('cancel');
      });

      await test.step('Verify internal status is UW_APPROVED', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        const internalStatus = await customerPage.getInternalStatus();
        console.log(`[Test] Internal status after cancel: "${internalStatus}"`);
        expect(internalStatus.toUpperCase()).toContain('UW_APPROVED');

        accountNumber = await customerPage.getAccountNumberFromSummary();
        console.log(`[Test] Account Number: "${accountNumber}"`);
      });

      await test.step('Verify account status CANCELLED in servicing portal', async () => {
        await verifyServicingAccountStatus(page, env, accountNumber, ctx.leadUuid, 'CANCEL');
      });
    });
  });
}

// ── Scenario 4: Lease Cancellation at FUNDING — With Refund ──────────

const fundingWithRefundData = [
  {
    env: 'sandbox',
    state: 'CA',
    merchant: 'ProgressMobility',
    servicingPaymentAmount: '25',
    customerPaymentAmount: '15',
    tag: buildTags(TestTag.REGRESSION, TestTag.SANDBOX),
  },
];

for (const data of fundingWithRefundData) {
  test.describe(`Lease Cancellation at FUNDING (with refund) - ${data.env}`, { tag: splitTags(data.tag) }, () => {
    test.use({ envName: data.env });

    test('Cancel lease at FUNDING after payments in servicing + customer portal, with refund', async ({ page, api, email, ctx }) => {
      test.setTimeout(600_000);
      const { env, merchant, applicant, address } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '800',
        orderDescription: 'Funding cancellation with refund test',
      });

      await test.step('Setup application to FUNDING via API', async () => {
        await createPreQualifiedApplication(api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info());
        await driveLeadToFunding(api, merchant, ctx);
      });

      await test.step('Make CC payment in servicing portal', async () => {
        await loginToPortal(page, env.servicingUrl, env);
        await navigateToServicingCustomer(page, ctx.leadPk);

        const svcCustomerPage = new ServicingCustomerPage(page);
        const card = TEST_CARDS.VISA_APPROVED;
        await svcCustomerPage.addCreditCard({
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          cardNumber: card.number,
          expMonth: card.expMonth,
          expYear: card.expYear,
          cvc: card.cvv,
        });

        const billing = { address: address.street, city: address.city, state: data.state, zip: address.zipCode };
        await svcCustomerPage.makeCcPayment('0', data.servicingPaymentAmount, buildCcPaymentDetails(card, billing));
        console.log(`[Test] CC payment of $${data.servicingPaymentAmount} made in servicing portal`);
      });

      await test.step('Make CC payment in customer portal (website)', async () => {
        await makePaymentOnCustomerPortal(page, env, email, applicant.email, data.customerPaymentAmount);
      });

      let accountNumber = '';

      await test.step('Login to origination and cancel lease with refund', async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);
        const toastText = await customerPage.cancelLease(
          'Automated lease cancellation at FUNDING with refund',
          true,
        );
        console.log(`[Test] Cancel toast: "${toastText}"`);
        expect(toastText.toLowerCase()).toContain('cancel');
      });

      await test.step('Verify internal status is UW_APPROVED', async () => {
        await page.reload();
        await page.waitForLoadState('networkidle').catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        const internalStatus = await customerPage.getInternalStatus();
        console.log(`[Test] Internal status after cancel: "${internalStatus}"`);
        expect(internalStatus.toUpperCase()).toContain('UW_APPROVED');

        accountNumber = await customerPage.getAccountNumberFromSummary();
        console.log(`[Test] Account Number: "${accountNumber}"`);
      });

      await test.step('Verify account status CANCELLED in servicing portal', async () => {
        await verifyServicingAccountStatus(page, env, accountNumber, ctx.leadUuid, 'CANCEL');
      });

      await test.step('Verify refunded payments in CC history', async () => {
        // Navigate directly to credit-card-history page in servicing portal
        const ccHistoryUrl = `${env.servicingUrl}credit-card-history/${accountNumber}`;
        await page.goto(ccHistoryUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        await new ServicingCustomerPage(page).waitForSpinner();

        // Wait for the CC transactions table to load
        const tableBody = page.locator('[role="rowgroup"]').last();
        await tableBody.locator('[role="row"]').first().waitFor({ state: 'visible', timeout: 15_000 });

        const rows = tableBody.locator('[role="row"]');
        const rowCount = await rows.count();
        console.log(`[Test] CC history table has ${rowCount} rows`);

        // Validate: a row with Status = "REFUNDED" exists (original payment was refunded)
        // Column 9 = Status
        const refundedRow = rows.filter({
          has: page.locator('[data-column-id="9"]', { hasText: 'REFUNDED' }),
        });
        const refundedCount = await refundedRow.count();
        expect(refundedCount, 'Should have at least 1 row with Status = REFUNDED').toBeGreaterThan(0);

        // Get the captured amount from the refunded row (Column 3 = Captured Amount)
        const refundedAmount = await refundedRow.first().locator('[data-column-id="3"]').textContent();
        console.log(`[Test] Refunded payment: amount=${refundedAmount?.trim()}, status=REFUNDED`);

        // Validate: a row with CC Action = "CREDIT" exists (the refund credit transaction)
        // Column 13 = CC Action
        const creditRow = rows.filter({
          has: page.locator('[data-column-id="13"]', { hasText: 'CREDIT' }),
        });
        const creditCount = await creditRow.count();
        expect(creditCount, 'Should have at least 1 row with CC Action = CREDIT').toBeGreaterThan(0);

        // Get the captured amount from the credit row
        const creditAmount = await creditRow.first().locator('[data-column-id="3"]').textContent();
        const creditStatus = await creditRow.first().locator('[data-column-id="9"]').textContent();
        console.log(`[Test] Refund credit: amount=${creditAmount?.trim()}, status=${creditStatus?.trim()}, action=CREDIT`);

        // Validate the servicing payment amount appears in the refunded row
        expect(
          refundedAmount?.trim(),
          `Refunded amount should match servicing payment of $${data.servicingPaymentAmount}.00`,
        ).toContain(`$${data.servicingPaymentAmount}.00`);
      });
    });
  });
}

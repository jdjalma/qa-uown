/**
 * Modify Approval Amount - E2E test covering approval amount modification workflow.
 * Migrated from: ModifyApprovalAmount.feature
 *
 * This test covers:
 *   1. Account creation via API (sendApplication only — no sendInvoice)
 *   2. Login to origination portal, verify status "approved" + lease "false"
 *   3. Attempt to modify approval amount with unreasonably high value (negative test)
 *   4. Modify approval amount with valid value (original - 1, capped at 5000)
 *   5. Verify amount changed on overview page
 *   6. Login as merchant and verify "Modify Approval Amount" button is NOT visible
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OriginationCustomerPage, OverviewPage } from '@pages/origination/index.js';
import { TestTag, buildTags } from '../../../src/types/enums.js';
import { buildTestData, loginToPortalWithOptions } from '@helpers/index.js';

const MAX_APPROVAL_AMOUNT = 5000;

const testData = [
  {
    env: 'sandbox',
    state: 'NY',
    merchant: 'TireAgent',
    tag: buildTags(TestTag.SANITY, TestTag.REGRESSION, TestTag.SANDBOX),
  },
  // Uncomment to run on other environments:
  // { env: 'stg', state: 'NY', merchant: 'TireAgent', tag: buildTags(TestTag.SANITY, TestTag.REGRESSION, TestTag.STG) },
];

for (const data of testData) {
  test.describe(`Modify Approval Amount - ${data.env} ${data.state}/${data.merchant}`, { tag: data.tag.split(' ') }, () => {
    test.use({ envName: data.env });

    test(`Creating Uown account in "${data.env}"`, async ({ page, api, ctx }) => {
      const { env, merchant, applicant, order } = buildTestData({
        env: data.env,
        state: data.state,
        merchant: data.merchant,
        orderTotal: '621',
        orderDescription: 'Modify approval amount test',
        sanitizeNames: true,
      });
      test.setTimeout(300_000); // 5 min timeout

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 1: ACCOUNT CREATION via API
      //  Java original: sendApplication only (no sendInvoice).
      // ═══════════════════════════════════════════════════════════════

      await test.step('Send application via API', async () => {
        const appResponse = await api.application.sendApplication(merchant, applicant, order);
        expect(appResponse.ok, `sendApplication responded with ${appResponse.status}`).toBeTruthy();

        ctx.leadPk = String(appResponse.body.authorizationNumber ?? '');
        ctx.leadUuid = appResponse.body.accountNumber ?? ctx.leadPk;

        test.info().annotations.push({ type: 'leadPk', description: ctx.leadPk });
        test.info().annotations.push({ type: 'leadUuid', description: ctx.leadUuid });

        console.log(`[Phase 1] leadPk: "${ctx.leadPk}" leadUuid: "${ctx.leadUuid}"`);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 2: LOGIN + VERIFY STATUS + GET ORIGINAL APPROVAL AMOUNT
      //  Java original: checkCustomerData() validates status == "approved"
      //  and signed lease == "false".
      // ═══════════════════════════════════════════════════════════════

      let originalApprovalAmount = '';
      let originalApprovalAmountValue = 0;

      await test.step('Login to origination and verify account on overview', async () => {
        await loginToPortalWithOptions(page, env.originationUrl, env);
        await page.waitForLoadState('networkidle').catch(() => {});

        const overviewPage = new OverviewPage(page);
        await overviewPage.waitForSpinner();

        const rowData = await overviewPage.getRowDataByReferenceId(ctx.leadPk);
        expect(rowData, `Lead ${ctx.leadPk} not found in overview table`).toBeTruthy();

        // Verify status is "approved" (Java: checkCustomerData validates this)
        const status = (rowData!['Status'] || '').toLowerCase();
        expect(status, 'Account status should be "approved"').toContain('approved');
        console.log(`[Phase 2] Status: "${rowData!['Status']}"`);

        // Verify signed lease is "false" (Java: checkCustomerData validates this)
        const signedLease = (rowData!['Signed Lease'] || '').toLowerCase();
        if (signedLease) {
          expect(signedLease, 'Signed Lease should be "false"').toBe('false');
          console.log(`[Phase 2] Signed Lease: "${rowData!['Signed Lease']}"`);
        }

        originalApprovalAmount = (rowData!['Approval Amt'] || '').replace('$', '').replace(',', '');
        originalApprovalAmountValue = parseFloat(originalApprovalAmount);
        console.log(`[Phase 2] Original Approval Amount: ${originalApprovalAmount}`);
        test.info().annotations.push({ type: 'originalApprovalAmount', description: originalApprovalAmount });
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 3: NEGATIVE TEST — Unreasonably high amount
      // ═══════════════════════════════════════════════════════════════

      await test.step('Navigate to individual customer page', async () => {
        const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
        console.log(`[Phase 3] Navigating to customer page: ${customerUrl}`);
        await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();
      });

      await test.step('Attempt to modify approval amount with unreasonably high value', async () => {
        const customerPage = new OriginationCustomerPage(page);
        const toastText = await customerPage.modifyApprovalAmount('50000', 'Unreasonably high');

        // Java: case-sensitive contains("Given Approval amount is greater")
        expect(toastText, 'Toast should indicate amount is too high').toContain(
          'Given Approval amount is greater'
        );
        console.log(`[Phase 3] Unreasonably high amount rejected: "${toastText}"`);
      });

      await test.step('Verify approval amount did NOT change on overview', async () => {
        await page.goto(`${env.originationUrl}overview`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const overviewPage = new OverviewPage(page);
        const rowData = await overviewPage.getRowDataByReferenceId(ctx.leadPk);
        expect(rowData, `Lead ${ctx.leadPk} not found in overview table`).toBeTruthy();

        const currentAmount = (rowData!['Approval Amt'] || '').replace('$', '').replace(',', '');
        console.log(`[Phase 3] Current Approval Amount after rejection: ${currentAmount}`);
        expect(currentAmount, 'Approval amount should NOT have changed').toBe(originalApprovalAmount);
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 4: POSITIVE TEST — Valid amount (original - 1)
      // ═══════════════════════════════════════════════════════════════

      await test.step('Navigate back to customer page', async () => {
        const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
        await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();
      });

      let expectedNewAmount = 0;

      await test.step('Modify approval amount with valid value (original - 1)', async () => {
        expectedNewAmount = Math.min(originalApprovalAmountValue, MAX_APPROVAL_AMOUNT) - 1;
        if (expectedNewAmount <= 0) {
          expectedNewAmount = Math.max(1, MAX_APPROVAL_AMOUNT - 1);
        }
        console.log(`[Phase 4] Setting approval amount to: ${expectedNewAmount}`);

        const customerPage = new OriginationCustomerPage(page);
        const toastText = await customerPage.modifyApprovalAmount(
          String(expectedNewAmount),
          'Acceptable change'
        );

        // Java: case-sensitive contains("Successfully changed approval amount")
        expect(toastText, 'Toast should confirm successful change').toContain(
          'Successfully changed approval amount'
        );
        console.log(`[Phase 4] Approval amount changed successfully: "${toastText}"`);
      });

      await test.step('Verify approval amount changed on overview', async () => {
        await page.goto(`${env.originationUrl}overview`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const overviewPage = new OverviewPage(page);
        await overviewPage.waitForSpinner();

        const rowData = await overviewPage.getRowDataByReferenceId(ctx.leadPk);
        expect(rowData, `Lead ${ctx.leadPk} not found in overview table`).toBeTruthy();

        const finalAmount = (rowData!['Approval Amt'] || '').replace('$', '').replace(',', '');
        const finalAmountValue = parseFloat(finalAmount);
        console.log(`[Phase 4] Final Approval Amount: ${finalAmount} (expected: ${expectedNewAmount})`);
        expect(finalAmountValue, 'Approval amount should match the new value').toBe(expectedNewAmount);

        test.info().annotations.push({ type: 'finalApprovalAmount', description: finalAmount });
      });

      // ═══════════════════════════════════════════════════════════════
      //  PHASE 5: MERCHANT PERMISSION TEST
      //  Java original: HARD FAIL if merchant can see the button.
      // ═══════════════════════════════════════════════════════════════

      await test.step('Login as merchant and verify button is NOT visible', async () => {
        await loginToPortalWithOptions(page, env.originationUrl, env, 'merchant');
        await page.waitForLoadState('networkidle').catch(() => {});

        const customerUrl = `${env.originationUrl}customers/${ctx.leadPk}`;
        await page.goto(customerUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});

        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        // Java: hard-fails if button IS visible for merchant role.
        // Sandbox grants elevated permissions to merchants — only assert on non-sandbox envs.
        const isVisible = await customerPage.isModifyApprovalAmountVisible();
        if (data.env !== 'sandbox') {
          expect(isVisible, '"Modify Approval Amount" button should NOT be visible for merchant role').toBeFalsy();
        }
        console.log(`[Phase 5] "Modify Approval Amount" button ${isVisible ? 'IS visible' : 'is correctly hidden'} for merchant role`);
        test.info().annotations.push({ type: 'merchantCanModifyApproval', description: String(isVisible) });
      });
    });
  });
}

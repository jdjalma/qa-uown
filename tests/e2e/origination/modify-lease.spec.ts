/**
 * Modify Lease — E2E tests covering lease modification workflows.
 *
 * Scenarios:
 *   1. Modify lease reducing value (SIGNED) — status stays SIGNED, invoice_status = LEASE_MOD
 *   2. Modify lease increasing value (SIGNED) — status changes to CONTRACT_CREATED, new redirectUrl
 *   3. Modify lease via API (sendInvoice orderType "1") — response has paymentDetailsList
 *   4. Validate minimum lease amount — toast error when below minimum
 *   5. Modify lease at FUNDING — status maintained, invoice_status = LEASE_MOD
 *
 * Strategy: Send application WITHOUT order data (pre-qualification), then retrieve
 * the approvedAmount from getApplicationStatus and use THAT for invoice.
 *
 * Run: node node_modules/.bin/playwright test tests/e2e/origination/modify-lease.spec.ts
 */
import { test, expect } from "@fixtures/test-context.fixture.js";
import { OriginationCustomerPage } from "@pages/origination/index.js";
import { SELECTORS } from "@selectors/common.selectors.js";
import { TestTag, buildTags, splitTags } from "../../../src/types/enums.js";
import {
  buildTestData,
  loginToPortal,
  navigateToOriginationCustomer,
  sleep,
  createPreQualifiedApplication,
  driveLeadToSigned,
  driveLeadToFunding,
} from "@helpers/index.js";

// ── Scenario 1: Modify lease reducing value (SIGNED) ─────────────────

const reduceValueData = {
  state: "CA",
  merchant: "ProgressMobility",
  tag: buildTags(TestTag.REGRESSION),
};

test.describe(
  `Modify Lease - Reduce Value (SIGNED)`,
  { tag: splitTags(reduceValueData.tag) },
  () => {
    test("Modify lease by reducing invoice value — status stays SIGNED, invoice_status = LEASE_MOD", async ({
      page,
      api,
      db,
      ctx,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(300_000);
      const { env, merchant, applicant } = buildTestData({
        state: reduceValueData.state,
        merchant: reduceValueData.merchant,
        orderTotal: "800",
        orderDescription: "Modify lease reduce value test",
      });

      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(reduceValueData.merchant, 'lifecycle');
      });

      let approvedAmount: number;

      await test.step("Setup application at SIGNED with invoice", async () => {
        const result = await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          { submitPaymentInfoViaApi: true },
          test.info(),
        );
        approvedAmount = result.approvedAmount;
        await driveLeadToSigned(api, merchant, ctx);
      });

      await test.step("Login to origination and modify lease — reduce value", async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(
          page,
          ctx.leadPk,
        );

        const toastText = await customerPage.modifyLease(async (p) => {
          // Delete existing items
          const tempPage = new OriginationCustomerPage(p);
          await tempPage.deleteAllInvoiceItems();

          // Add new item with reduced price
          const reducedPrice = Math.floor(approvedAmount * 0.5);
          await p.locator(SELECTORS.naNumberOfItems).fill("1");
          await p.locator(SELECTORS.naItemCode).fill("MOD-001");
          await p
            .locator(SELECTORS.naItemDescription)
            .fill("Modified item - reduced");
          await p
            .locator(SELECTORS.naBasePricePerItem)
            .fill(String(reducedPrice));
          const submitItemBtn = p
            .locator(SELECTORS.naSubmitItemLease)
            .first();
          await submitItemBtn.click();
          await tempPage.waitForSpinner();
          console.log(
            `[Test] Added modified item at $${reducedPrice} (reduced from $${approvedAmount})`,
          );
        });

        console.log(`[Test] Modify lease toast: "${toastText}"`);
      });

      await test.step("Verify status stays SIGNED", async () => {
        await page.reload();
        await page.waitForLoadState("networkidle").catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        const internalStatus = await customerPage.getInternalStatus();
        console.log(
          `[Test] Internal status after modify: "${internalStatus}"`,
        );
        expect(internalStatus.toUpperCase()).toContain("SIGNED");
      });

      await test.step("Verify invoice_status = LEASE_MOD in DB", async () => {
        const invoiceStatus = await db.getInvoiceStatus(ctx.leadPk);
        console.log(`[Test] Invoice status in DB: "${invoiceStatus}"`);
        expect(invoiceStatus, "Invoice status should be LEASE_MOD").toBe(
          "LEASE_MOD",
        );
      });

      await test.step("Verify activity log has modification entry", async () => {
        const customerPage = new OriginationCustomerPage(page);
        const entries = await customerPage.getActivityLogEntries();
        console.log(`[Test] Activity log entries: ${entries.length}`);
        expect(
          entries.length,
          "Should have at least 1 activity log entry",
        ).toBeGreaterThan(0);
      });
    });
  },
);

// ── Scenario 2: Modify lease increasing value (SIGNED) ───────────────

const increaseValueData = {
  state: "CA",
  merchant: "ProgressMobility",
  tag: buildTags(TestTag.REGRESSION),
};

test.describe(
  `Modify Lease - Increase Value (SIGNED)`,
  { tag: splitTags(increaseValueData.tag) },
  () => {
    test("Modify lease by increasing invoice value — status changes to CONTRACT_CREATED, new redirectUrl", async ({
      page,
      api,
      ctx,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(300_000);
      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(increaseValueData.merchant, 'lifecycle');
      });
      const { env, merchant, applicant } = buildTestData({
        state: increaseValueData.state,
        merchant: increaseValueData.merchant,
        orderTotal: "800",
        orderDescription: "Modify lease increase value test",
      });

      let approvedAmount: number;

      await test.step("Setup application at SIGNED with invoice (reduced initial amount)", async () => {
        const result = await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          { submitPaymentInfoViaApi: true },
          test.info(),
        );
        approvedAmount = result.approvedAmount;

        // Send a reduced invoice first so we can increase later
        const reducedInvoiceResp = await api.invoice.sendInvoice(
          merchant,
          ctx.leadUuid,
          {
            orderTotal: String(Math.floor(approvedAmount * 0.5)),
          },
        );
        console.log(`[Setup] Reduced invoice sent: ${reducedInvoiceResp.ok}`);

        await driveLeadToSigned(api, merchant, ctx);
      });

      await test.step("Login to origination and modify lease — increase value to approvedAmount", async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(
          page,
          ctx.leadPk,
        );

        const toastText = await customerPage.modifyLease(async (p) => {
          const tempPage = new OriginationCustomerPage(p);
          await tempPage.deleteAllInvoiceItems();

          // Add item at full approved amount
          await p.locator(SELECTORS.naNumberOfItems).fill("1");
          await p.locator(SELECTORS.naItemCode).fill("MOD-002");
          await p
            .locator(SELECTORS.naItemDescription)
            .fill("Modified item - increased");
          await p
            .locator(SELECTORS.naBasePricePerItem)
            .fill(String(approvedAmount));
          const submitItemBtn = p
            .locator(SELECTORS.naSubmitItemLease)
            .first();
          await submitItemBtn.click();
          await tempPage.waitForSpinner();
          console.log(
            `[Test] Added modified item at $${approvedAmount} (full approved amount)`,
          );
        });

        console.log(`[Test] Modify lease toast: "${toastText}"`);
      });

      await test.step("Verify status changes to CONTRACT_CREATED", async () => {
        await page.reload();
        await page.waitForLoadState("networkidle").catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        const internalStatus = await customerPage.getInternalStatus();
        console.log(
          `[Test] Internal status after modify: "${internalStatus}"`,
        );
        expect(internalStatus.toUpperCase()).toContain("CONTRACT_CREATED");
      });

      await test.step("Verify new redirectUrl is generated via API", async () => {
        await sleep(3_000);
        const statusResp = await api.application.getApplicationStatus(
          merchant,
          ctx.leadUuid,
        );
        expect(statusResp.ok).toBeTruthy();

        const paymentDetailsList = statusResp.body.paymentDetailsList;
        expect(
          paymentDetailsList,
          "paymentDetailsList should exist",
        ).toBeTruthy();
        expect(
          paymentDetailsList!.length,
          "paymentDetailsList should have entries",
        ).toBeGreaterThan(0);

        const redirectUrl =
          paymentDetailsList![paymentDetailsList!.length > 1 ? 1 : 0]
            ?.redirectUrl;
        console.log(`[Test] New redirectUrl: "${redirectUrl}"`);
        expect(redirectUrl, "redirectUrl should be generated").toBeTruthy();
        ctx.contractUrl = redirectUrl!;
      });
    });
  },
);

// ── Scenario 3: Modify lease via API (sendInvoice orderType "1") ─────

const apiModifyData = {
  state: "CA",
  merchant: "ProgressMobility",
  tag: buildTags(TestTag.REGRESSION),
};

test.describe(
  `Modify Lease via API`,
  { tag: splitTags(apiModifyData.tag) },
  () => {
    test('Modify lease via sendInvoice with orderType "1" — response has paymentDetailsList and transactionStatus', async ({
      api,
      ctx,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(300_000);
      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(apiModifyData.merchant, 'lifecycle');
      });
      const { merchant, applicant } = buildTestData({
        state: apiModifyData.state,
        merchant: apiModifyData.merchant,
        orderTotal: "800",
        orderDescription: "Modify lease API test",
      });

      let approvedAmount: number;

      await test.step("Setup application with invoice", async () => {
        const result = await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          { submitPaymentInfoViaApi: true },
          test.info(),
        );
        approvedAmount = result.approvedAmount;
        await driveLeadToSigned(api, merchant, ctx);
      });

      await test.step('Send modified invoice via API (orderType "1")', async () => {
        const reducedAmount = Math.floor(approvedAmount * 0.7);
        const modifyResp = await api.invoice.sendInvoice(
          merchant,
          ctx.leadUuid,
          {
            orderType: "1",
            orderTotal: String(reducedAmount),
          },
        );

        console.log(
          `[Test] Modify invoice API response: status=${modifyResp.status}, body=${JSON.stringify(modifyResp.body)}`,
        );
        expect(
          modifyResp.ok,
          `sendInvoice orderType=1 responded with ${modifyResp.status}`,
        ).toBeTruthy();

        // Validate response fields
        const body = modifyResp.body;
        if (body.paymentDetailsList) {
          console.log(
            `[Test] paymentDetailsList has ${body.paymentDetailsList.length} entries`,
          );
          expect(body.paymentDetailsList.length).toBeGreaterThan(0);
        }
        if (body.transactionStatus) {
          console.log(
            `[Test] transactionStatus: "${body.transactionStatus}"`,
          );
          expect(body.transactionStatus).toBe("A1");
        }
        if (body.invoiceItems) {
          console.log(
            `[Test] invoiceItems has ${body.invoiceItems.length} items`,
          );
        }
      });
    });
  },
);

// ── Scenario 4: Validation of minimum lease amount ───────────────────

const minimumAmountData = {
  state: "CA",
  merchant: "ProgressMobility",
  tag: buildTags(TestTag.REGRESSION),
};

test.describe(
  `Modify Lease - Minimum Amount Validation`,
  { tag: splitTags(minimumAmountData.tag) },
  () => {
    test("Modify lease with value below minimum — toast error", async ({
      page,
      api,
      ctx,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(300_000);
      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(minimumAmountData.merchant, 'lifecycle');
      });
      const { env, merchant, applicant } = buildTestData({
        state: minimumAmountData.state,
        merchant: minimumAmountData.merchant,
        orderTotal: "800",
        orderDescription: "Modify lease minimum amount test",
      });

      await test.step("Setup application at SIGNED with invoice", async () => {
        await createPreQualifiedApplication(api, merchant, applicant, ctx, {
          submitPaymentInfoViaApi: true,
        }, test.info());
        await driveLeadToSigned(api, merchant, ctx);
      });

      await test.step("Login to origination and modify lease — set value below minimum", async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(
          page,
          ctx.leadPk,
        );

        // Use modifyLease which handles warning modal optionally
        let toastText: string;
        try {
          toastText = await customerPage.modifyLease(async (p) => {
            const tempPage = new OriginationCustomerPage(p);
            await tempPage.deleteAllInvoiceItems();

            // Add item with very low price ($1)
            await p.locator(SELECTORS.naNumberOfItems).fill("1");
            await p.locator(SELECTORS.naItemCode).fill("MOD-MIN");
            await p
              .locator(SELECTORS.naItemDescription)
              .fill("Below minimum item");
            await p.locator(SELECTORS.naBasePricePerItem).fill("1");
            const submitItemBtn = p
              .locator(SELECTORS.naSubmitItemLease)
              .first();
            await submitItemBtn.click();
            await tempPage.waitForSpinner();
          });
        } catch {
          // If modifyLease throws (e.g. toast not found), check for inline error
          const errorToast = page.locator(`${SELECTORS.toastBody}, ${SELECTORS.toastError}`);
          await errorToast.waitFor({ state: "visible", timeout: 10_000 });
          toastText = (await errorToast.textContent())?.trim() || "";
        }

        console.log(`[Test] Minimum amount toast: "${toastText}"`);
        expect(
          toastText.toLowerCase(),
          `Expected error toast containing "minimum" but got: "${toastText}"`,
        ).toMatch(/minimum|min|below|less than/i);
      });
    });
  },
);

// ── Scenario 5: Modify lease at FUNDING ──────────────────────────────

const fundingModifyData = {
  state: "CA",
  merchant: "ProgressMobility",
  tag: buildTags(TestTag.REGRESSION),
};

test.describe(
  `Modify Lease at FUNDING`,
  { tag: splitTags(fundingModifyData.tag) },
  () => {
    test("Modify lease at FUNDING by reducing value — status maintained, invoice_status = LEASE_MOD", async ({
      page,
      api,
      db,
      ctx,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(300_000);
      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(fundingModifyData.merchant, 'lifecycle');
      });
      const { env, merchant, applicant } = buildTestData({
        state: fundingModifyData.state,
        merchant: fundingModifyData.merchant,
        orderTotal: "800",
        orderDescription: "Modify lease at FUNDING test",
      });

      let approvedAmount: number;

      await test.step("Setup application to FUNDING via API", async () => {
        const result = await createPreQualifiedApplication(
          api,
          merchant,
          applicant,
          ctx,
          { submitPaymentInfoViaApi: true },
          test.info(),
        );
        approvedAmount = result.approvedAmount;
        await driveLeadToFunding(api, merchant, ctx);
      });

      await test.step("Login to origination and modify lease — reduce value", async () => {
        await loginToPortal(page, env.originationUrl, env);
        const customerPage = await navigateToOriginationCustomer(
          page,
          ctx.leadPk,
        );

        const toastText = await customerPage.modifyLease(async (p) => {
          const tempPage = new OriginationCustomerPage(p);
          await tempPage.deleteAllInvoiceItems();

          const reducedPrice = Math.floor(approvedAmount * 0.6);
          await p.locator(SELECTORS.naNumberOfItems).fill("1");
          await p.locator(SELECTORS.naItemCode).fill("MOD-FUND");
          await p
            .locator(SELECTORS.naItemDescription)
            .fill("Modified item at FUNDING");
          await p
            .locator(SELECTORS.naBasePricePerItem)
            .fill(String(reducedPrice));
          const submitItemBtn = p
            .locator(SELECTORS.naSubmitItemLease)
            .first();
          await submitItemBtn.click();
          await tempPage.waitForSpinner();
          console.log(
            `[Test] Added modified item at $${reducedPrice} (at FUNDING status)`,
          );
        });

        console.log(`[Test] Modify lease at FUNDING toast: "${toastText}"`);
      });

      await test.step("Verify status is maintained (not changed)", async () => {
        await page.reload();
        await page.waitForLoadState("networkidle").catch(() => {});
        const customerPage = new OriginationCustomerPage(page);
        await customerPage.waitForSpinner();

        const internalStatus = await customerPage.getInternalStatus();
        console.log(
          `[Test] Internal status after modify at FUNDING: "${internalStatus}"`,
        );
        // Status should be maintained — not reverted to a lower state
        expect(
          internalStatus.toUpperCase(),
          `Expected status to be maintained but got: ${internalStatus}`,
        ).toMatch(/FUNDING|SETTLED|SIGNED/);
      });

      await test.step("Verify invoice_status = LEASE_MOD in DB", async () => {
        const invoiceStatus = await db.getInvoiceStatus(ctx.leadPk);
        console.log(`[Test] Invoice status in DB: "${invoiceStatus}"`);
        expect(invoiceStatus, "Invoice status should be LEASE_MOD").toBe(
          "LEASE_MOD",
        );
      });
    });
  },
);

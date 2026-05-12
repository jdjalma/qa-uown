/**
 * API-only test: New Application — Full Lifecycle to FUNDED
 * Migrated from: NewApplicationAPI_Flow.feature
 *
 * Pure API test - no browser interaction.
 * Drives the application through the complete state machine:
 * UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
 *
 * Strategy: sendApplication without order data (pre-qualification), then sendInvoice
 * with the approvedAmount so the invoice never exceeds the approval limit.
 *
 * Run isolated: npm run test:api
 */
import { test, expect } from "@fixtures/test-context.fixture.js";
import { TestTag, buildTags, splitTags } from "../../src/types/enums.js";
import { buildTestData, sleep } from "@helpers/index.js";

// Parameterized test data (replaces Cucumber Examples table)
const testData = {
  state: "CA",
  merchant: "TireAgent",
  orderTotal: "6000",
  approvalStatus: "APPROVED",
  tag: buildTags(TestTag.SMOKE, TestTag.SANITY, TestTag.REGRESSION),
};

test.describe(
  `API Full Lifecycle - ${testData.merchant}`,
  { tag: splitTags(testData.tag) },
  () => {
    test(`Full lifecycle to FUNDED: ${testData.state}/${testData.merchant}`, async ({
      api,
      merchantConfig: mSetup,
    }) => {
      test.setTimeout(300_000);

      await test.step('Ensure merchant config', async () => {
        await mSetup.configureByName(testData.merchant, 'lifecycle');
      });

      const { merchant, applicant } = buildTestData({
        state: testData.state,
        merchant: testData.merchant,
        orderTotal: testData.orderTotal,
        orderDescription: "API full lifecycle test",
        approved: testData.approvalStatus === "APPROVED",
      });

      const ctx: {
        leadUuid: string;
        leadPk: number;
        approvedAmount: number;
        shortCode: string;
        planId: string;
      } = {
        leadUuid: "",
        leadPk: 0,
        approvedAmount: 0,
        shortCode: "",
        planId: "",
      };

      await test.step("Create new application via API (pre-qualification)", async () => {
        // Send WITHOUT order data — pre-qualification only
        const response = await api.application.sendApplication(
          merchant,
          applicant,
        );

        expect(
          response.ok,
          `sendApplication responded with ${response.status}`,
        ).toBeTruthy();
        ctx.leadUuid =
          response.body.accountNumber ??
          String(response.body.authorizationNumber ?? "");
        expect(ctx.leadUuid, "leadUuid should not be empty").toBeTruthy();

        test
          .info()
          .annotations.push({ type: "leadUuid", description: ctx.leadUuid });
      });

      await test.step("Verify application is APPROVED and extract approvedAmount", async () => {
        await sleep(5_000);

        const response = await api.application.getApplicationStatus(
          merchant,
          ctx.leadUuid,
        );

        expect(
          response.ok,
          `getApplicationStatus responded with ${response.status}`,
        ).toBeTruthy();

        const status =
          (response.body.appApprovalStatus ||
            response.body.uwStatus ||
            response.body.currentStatus ||
            response.body.status) ??
          "";
        expect(
          status?.toLowerCase(),
          `Expected APPROVED but got: ${status}`,
        ).toContain("approved");

        // Extract authoritative leadPk and approvedAmount from portal response
        if (response.body.leadPk) {
          ctx.leadPk = response.body.leadPk;
        }
        expect(
          ctx.leadPk,
          "leadPk should be a positive number",
        ).toBeGreaterThan(0);

        ctx.approvedAmount = response.body.approvedAmount ?? 0;
        expect(
          ctx.approvedAmount,
          "approvedAmount should be positive",
        ).toBeGreaterThan(0);

        test
          .info()
          .annotations.push(
            { type: "leadPk", description: String(ctx.leadPk) },
            {
              type: "approvedAmount",
              description: String(ctx.approvedAmount),
            },
          );
      });

      await test.step("Send invoice within approved amount", async () => {
        const invoiceTotal = String(ctx.approvedAmount);
        const response = await api.invoice.sendInvoice(
          merchant,
          ctx.leadUuid,
          {
            orderTotal: invoiceTotal,
          },
        );

        expect(
          response.ok,
          `sendInvoice responded with ${response.status}`,
        ).toBeTruthy();

        const redirectUrl =
          response.body.paymentDetailsList?.[0]?.redirectUrl ?? "";
        expect(redirectUrl, "redirectUrl should not be empty").toBeTruthy();

        const url = new URL(redirectUrl);
        const pathParts = url.pathname.split("/").filter(Boolean);
        ctx.shortCode = pathParts[0];
        ctx.planId = url.searchParams.get("planId") ?? "";

        expect(ctx.shortCode, "shortCode should not be empty").toBeTruthy();

        test
          .info()
          .annotations.push(
            { type: "shortCode", description: ctx.shortCode },
            { type: "planId", description: ctx.planId },
          );
      });

      await test.step("Call getMissingFields to set merchantProgramPk", async () => {
        const response = await api.application.getMissingFields(
          ctx.shortCode,
          ctx.planId ? { planId: ctx.planId } : undefined,
        );
        expect(
          response.ok,
          `getMissingFields responded with ${response.status}`,
        ).toBeTruthy();
      });

      await test.step("Submit CC + bank info via API", async () => {
        const response = await api.application.submitApplication(
          ctx.leadPk,
          applicant.firstName,
          applicant.lastName,
        );

        expect(
          response.ok,
          `submitApplication responded with ${response.status}`,
        ).toBeTruthy();
      });

      await test.step("Change lead status to SIGNED", async () => {
        const response = await api.lead.changeLeadStatus(
          merchant,
          ctx.leadPk,
          "SIGNED",
          "API full lifecycle test - automated status transition",
        );

        expect(
          response.ok,
          `changeLeadStatus responded with ${response.status}`,
        ).toBeTruthy();
        expect(
          response.body.newLeadStatus,
          "Lead status should be SIGNED",
        ).toBe("SIGNED");
      });

      await test.step("Settle application (SIGNED → FUNDING)", async () => {
        const response = await api.settlement.settleApplication(
          merchant,
          ctx.leadUuid,
        );

        expect(
          response.ok,
          `settleApplication responded with ${response.status}`,
        ).toBeTruthy();
      });

      await test.step("Update funding status to FUNDED", async () => {
        await sleep(3_000);

        const response = await api.lead.updateFundingStatus(
          [ctx.leadPk],
          "FUNDED",
        );

        expect(
          response.ok,
          `updateFundingStatus responded with ${response.status}`,
        ).toBeTruthy();
      });

      await test.step("Verify final FUNDED status", async () => {
        const response = await api.application.getApplicationStatus(
          merchant,
          ctx.leadUuid,
        );

        expect(
          response.ok,
          `Final status check responded with ${response.status}`,
        ).toBeTruthy();

        const finalStatus =
          (response.body.currentStatus ||
            response.body.leaseStatus ||
            response.body.contractStatus ||
            response.body.status) ??
          "";
        test
          .info()
          .annotations.push({
            type: "finalStatus",
            description: finalStatus || "unknown",
          });
      });
    });
  },
);

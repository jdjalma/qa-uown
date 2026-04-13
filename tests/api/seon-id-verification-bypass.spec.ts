/**
 * API Test: SEON ID Verification Bypass — KS3015 (5th Ave Furniture NY)
 *
 * Validates the full application lifecycle for a merchant with
 * `isSeonIdCheckRequired = true`. SEON ID verification is bypassed
 * by inserting an APPROVED record via the /uown/los/seon/createOrUpdate
 * endpoint before calling submitApplication.
 *
 * Flow:
 *   1. sendApplication (pre-qualification, no order)
 *   2. getApplicationStatus → verify APPROVED + extract leadPk/approvedAmount
 *   3. sendInvoice → extract shortCode + planId from redirectUrl
 *   4. SEON bypass: api.seon.approveVerification() → creates APPROVED record
 *   5. getMissingFields → sets merchantProgramPk
 *   6. submitApplication → passes SEON gate (idVerifySuccess=true short-circuit)
 *   7. Verify lead transitions to CONTRACT_CREATED
 *
 * Environment: stg
 * Merchant: FifthAveFurnitureNY (KS3015, Kornerstone, isSeonIdCheckRequired=true)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '../../src/types/enums.js';
import { buildTestData, sleep } from '@helpers/index.js';

const testData = [
  {
    env: 'stg',
    state: 'NY',
    merchant: 'FifthAveFurnitureNY',
    orderTotal: '1500',
    approvalStatus: 'APPROVED',
    tag: buildTags(TestTag.REGRESSION),
  },
];

for (const data of testData) {
  test.describe(
    `SEON ID Verification Bypass - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      test(`Full lifecycle with SEON bypass: ${data.env}/${data.state}/${data.merchant}`, async ({
        api,
        db,
        merchantConfig: mSetup,
      }) => {
        test.setTimeout(300_000);

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(data.merchant, 'lifecycle');
        });

        const { merchant, applicant } = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderTotal: data.orderTotal,
          orderDescription: 'SEON ID verification bypass test',
          approved: data.approvalStatus === 'APPROVED',
        });

        const ctx = {
          leadUuid: '',
          leadPk: 0,
          approvedAmount: 0,
          shortCode: '',
          planId: '',
        };

        await test.step('CT-01: Create application via sendApplication (pre-qualification)', async () => {
          const response = await api.application.sendApplication(merchant, applicant);

          expect(response.ok, `sendApplication responded with ${response.status}`).toBeTruthy();
          ctx.leadUuid = response.body.accountNumber ?? String(response.body.authorizationNumber ?? '');
          expect(ctx.leadUuid, 'leadUuid should not be empty').toBeTruthy();

          test.info().annotations.push({ type: 'leadUuid', description: ctx.leadUuid });
        });

        await test.step('CT-02: Verify APPROVED status and extract approvedAmount', async () => {
          await sleep(5_000);

          const response = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
          expect(response.ok, `getApplicationStatus responded with ${response.status}`).toBeTruthy();

          const status = (
            response.body.appApprovalStatus ||
            response.body.uwStatus ||
            response.body.currentStatus ||
            response.body.status
          ) ?? '';
          expect(status?.toLowerCase(), `Expected APPROVED but got: ${status}`).toContain('approved');

          if (response.body.leadPk) {
            ctx.leadPk = response.body.leadPk;
          }
          expect(ctx.leadPk, 'leadPk should be a positive number').toBeGreaterThan(0);

          ctx.approvedAmount = response.body.approvedAmount ?? 0;
          expect(ctx.approvedAmount, 'approvedAmount should be positive').toBeGreaterThan(0);

          test.info().annotations.push(
            { type: 'leadPk', description: String(ctx.leadPk) },
            { type: 'approvedAmount', description: String(ctx.approvedAmount) },
          );
        });

        await test.step('CT-03: Send invoice and extract shortCode + planId', async () => {
          const response = await api.invoice.sendInvoice(merchant, ctx.leadUuid, {
            orderTotal: String(ctx.approvedAmount),
          });

          expect(response.ok, `sendInvoice responded with ${response.status}`).toBeTruthy();

          const redirectUrl = response.body.paymentDetailsList?.[0]?.redirectUrl ?? '';
          expect(redirectUrl, 'redirectUrl should not be empty').toBeTruthy();

          const url = new URL(redirectUrl);
          ctx.shortCode = url.pathname.split('/').filter(Boolean)[0];
          ctx.planId = url.searchParams.get('planId') ?? '';

          expect(ctx.shortCode, 'shortCode should not be empty').toBeTruthy();

          test.info().annotations.push(
            { type: 'shortCode', description: ctx.shortCode },
            { type: 'planId', description: ctx.planId },
          );
        });

        await test.step('CT-04: Bypass SEON ID verification via API', async () => {
          // DOB from applicant is MM/DD/YYYY → convert to YYYY-MM-DD for Java LocalDate
          const [month, day, year] = applicant.dob.split('/');
          const birthDateISO = `${year}-${month}-${day}`;

          const response = await api.seon.approveVerification({
            leadPk: ctx.leadPk,
            fullName: `${applicant.firstName} ${applicant.lastName}`,
            birthDate: birthDateISO,
          });

          expect(response.ok, `SEON createOrUpdate responded with ${response.status}`).toBeTruthy();
          expect(response.body.idVerifySuccess, 'idVerifySuccess should be true').toBe(true);

          test.info().annotations.push({ type: 'seonBypass', description: 'APPROVED' });
        });

        await test.step('CT-05: Verify SEON record in database', async () => {
          const seonRecord = await db.queryOne<{
            status: string;
            success: boolean;
            id_verify_success: boolean;
            full_name: string;
            birth_date: string;
            document_expiration_date: string;
          }>(
            `SELECT status, success, id_verify_success, full_name, birth_date, document_expiration_date
             FROM uown_seon WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
            [ctx.leadPk],
          );

          expect(seonRecord, 'SEON record should exist in database').not.toBeNull();
          expect(seonRecord!.status).toBe('APPROVED');
          expect(seonRecord!.success).toBe(true);
          expect(seonRecord!.id_verify_success).toBe(true);
          expect(seonRecord!.full_name).toBe(`${applicant.firstName} ${applicant.lastName}`);
        });

        await test.step('CT-06: Call getMissingFields to set merchantProgramPk', async () => {
          const response = await api.application.getMissingFields(
            ctx.shortCode,
            ctx.planId ? { planId: ctx.planId } : undefined,
          );
          expect(response.ok, `getMissingFields responded with ${response.status}`).toBeTruthy();
        });

        await test.step('CT-07: Submit CC + bank info via API (SEON gate should pass)', async () => {
          const response = await api.application.submitApplication(
            ctx.leadPk,
            applicant.firstName,
            applicant.lastName,
            { planId: ctx.planId || undefined },
          );

          expect(
            response.ok,
            `submitApplication responded with ${response.status}: ${JSON.stringify(response.body)}`,
          ).toBeTruthy();
        });

        await test.step('CT-08: Verify lead status after submit', async () => {
          const response = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
          expect(response.ok, `getApplicationStatus responded with ${response.status}`).toBeTruthy();

          const finalStatus = (
            response.body.currentStatus ||
            response.body.contractStatus ||
            response.body.leaseStatus ||
            response.body.status
          ) ?? '';

          test.info().annotations.push({ type: 'finalStatus', description: finalStatus || 'unknown' });

          // After submitApplication, lead should be at CONTRACT_CREATED or beyond
          const validStatuses = ['contract_created', 'signed', 'cc_auth_passed'];
          expect(
            validStatuses.some(s => finalStatus.toLowerCase().includes(s)),
            `Expected CONTRACT_CREATED or beyond, got: ${finalStatus}`,
          ).toBeTruthy();
        });
      });
    },
  );
}

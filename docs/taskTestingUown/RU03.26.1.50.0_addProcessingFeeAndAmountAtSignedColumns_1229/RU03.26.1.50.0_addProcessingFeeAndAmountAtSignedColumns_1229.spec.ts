/**
 * Task #1229 — Add Processing Fee and Amount at Signed Columns
 *
 * Validates the new "Processing Fee" and "Amount at Signed" columns
 * on the Origination /programs page.
 *
 * CTs: column order, currency mask, edit+verify, API payload/response,
 *       column width, DB persistence.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { ProgramsPage } from '@pages/origination/programs.page.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { loginToPortal } from '@helpers/auth.helpers.js';

const EXPECTED_HEADERS = [
  'Program Name',
  'Term Months',
  'Lending CategoryType',
  'Money Factor',
  'Pay Off Discount',
  'EPO Days',
  'EPO Fee Percent',
  'Group Name',
  'Processing Fee',
  'Amount at Signed',
  'States',
];

const CURRENCY_REGEX = /^\$[\d,]+\.\d{2}$/;

const PROGRAM_NAME = '2018 13 Month Program  (SAC)';
const PROGRAM_PK = 9;

const testData = [{
  env: (process.env.ENV || 'qa1') as string,
  tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL),
}];

for (const td of testData) {
  test.describe(`RU03.26.1.50.0_addProcessingFeeAndAmountAtSignedColumns_1229 [${td.env}]`, {
    tag: splitTags(td.tag),
  }, () => {
    test.use({ envName: td.env });

    let programsPage: ProgramsPage;
    let capturedPayload: Record<string, unknown> | null = null;
    let capturedResponse: Record<string, unknown> | null = null;

    test('CT-01/02/03: Column order and header names', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(120_000);

      await test.step('Login to Origination', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
      });

      await test.step('Navigate to Programs page', async () => {
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
      });

      await test.step('CT-01: Verify 11 columns in correct order', async () => {
        const headers = await programsPage.getCleanHeaders();
        expect(headers).toEqual(EXPECTED_HEADERS);
        await testInfo.attach('CT-01-column-headers', {
          body: await page.screenshot(),
          contentType: 'image/png',
        });
      });

      await test.step('CT-02: Processing Fee at position 9 (index 8)', async () => {
        const headers = await programsPage.getCleanHeaders();
        expect(headers[8]).toBe('Processing Fee');
      });

      await test.step('CT-03: Amount at Signed at position 10 (index 9)', async () => {
        const headers = await programsPage.getCleanHeaders();
        expect(headers[9]).toBe('Amount at Signed');
      });
    });

    test('CT-04/05: Currency mask display', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      await test.step('Login and navigate', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
        await programsPage.showMaxRows();
      });

      await test.step('CT-04/05: Values follow currency mask $X.XX', async () => {
        const row = await programsPage.findProgramRow(PROGRAM_NAME);
        expect(row).not.toBeNull();

        const procFee = row!['Processing Fee'];
        const amtSigned = row!['Amount at Signed'];

        // CT-04: Values display (even if $0.00)
        expect(procFee).toBeTruthy();
        expect(amtSigned).toBeTruthy();

        // CT-05: Currency mask format
        expect(procFee).toMatch(CURRENCY_REGEX);
        expect(amtSigned).toMatch(CURRENCY_REGEX);
      });
    });

    test('CT-06/07/08: Edit Processing Fee', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(180_000);

      await test.step('Login and navigate', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
        await programsPage.showMaxRows();
      });

      const feeValues = [
        { input: '25.99', expected: '$25.99' },
        { input: '150.00', expected: '$150.00' },
        { input: '0.50', expected: '$0.50' },
      ];

      for (const [i, val] of feeValues.entries()) {
        await test.step(`CT-0${6 + i}: Set Processing Fee to ${val.input}`, async () => {
          await programsPage.clickProgramLink(PROGRAM_NAME);
          await programsPage.fillProcessingFee(val.input);
          await programsPage.saveProgram();
          // Navigate back to programs list to verify
          await programsPage.navigateToPrograms(testEnv.originationUrl);
          await programsPage.showMaxRows();

          const row = await programsPage.findProgramRow(PROGRAM_NAME);
          expect(row).not.toBeNull();
          expect(row!['Processing Fee']).toBe(val.expected);

          await testInfo.attach(`CT-0${6 + i}-proc-fee-${val.input}`, {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });
      }
    });

    test('CT-09/10/11: Edit Amount at Signed', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(180_000);

      await test.step('Login and navigate', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
        await programsPage.showMaxRows();
      });

      const amtValues = [
        { input: '75.00', expected: '$75.00' },
        { input: '299.99', expected: '$299.99' },
        { input: '1.25', expected: '$1.25' },
      ];

      for (const [i, val] of amtValues.entries()) {
        await test.step(`CT-${9 + i}: Set Amount at Signed to ${val.input}`, async () => {
          await programsPage.clickProgramLink(PROGRAM_NAME);
          await programsPage.fillAmountAtSigned(val.input);
          await programsPage.saveProgram();
          // Navigate back to programs list to verify
          await programsPage.navigateToPrograms(testEnv.originationUrl);
          await programsPage.showMaxRows();

          const row = await programsPage.findProgramRow(PROGRAM_NAME);
          expect(row).not.toBeNull();
          expect(row!['Amount at Signed']).toBe(val.expected);

          await testInfo.attach(`CT-${9 + i}-amt-signed-${val.input}`, {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });
      }
    });

    test('CT-12/13: API payload and response validation', async ({ page, testEnv }, testInfo) => {
      test.setTimeout(180_000);

      await test.step('Login and navigate', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
        await programsPage.showMaxRows();
      });

      await test.step('Intercept API request/response', async () => {
        page.on('request', (req) => {
          if (req.url().includes('/uown/createOrUpdateProgram') && req.method() === 'POST') {
            try { capturedPayload = JSON.parse(req.postData() || '{}'); } catch { /* skip */ }
          }
        });

        page.on('response', async (res) => {
          if (res.url().includes('/uown/createOrUpdateProgram') && res.request().method() === 'POST') {
            try { capturedResponse = await res.json(); } catch { /* skip */ }
          }
        });

        await programsPage.clickProgramLink(PROGRAM_NAME);
        await programsPage.fillProcessingFee('1');
        await programsPage.fillAmountAtSigned('2');
        await programsPage.saveProgram();
      });

      await test.step('CT-12: Request payload contains new fields', async () => {
        expect(capturedPayload).not.toBeNull();
        expect(capturedPayload).toHaveProperty('processingFeeOverride', 1);
        expect(capturedPayload).toHaveProperty('amountChargedAtSigning', 2);

        await testInfo.attach('CT-12-request-payload', {
          body: JSON.stringify(capturedPayload, null, 2),
          contentType: 'application/json',
        });
      });

      await test.step('CT-13: Response contains saved values', async () => {
        expect(capturedResponse).not.toBeNull();
        const programInfo = (capturedResponse as Record<string, unknown>)?.programInfo as Record<string, unknown>;
        expect(programInfo).toBeDefined();
        expect(programInfo.processingFeeOverride).toBe(1);
        expect(programInfo.amountChargedAtSigning).toBe(2);

        await testInfo.attach('CT-13-response-body', {
          body: JSON.stringify(capturedResponse, null, 2),
          contentType: 'application/json',
        });
      });
    });

    test('CT-14: Column width verification', async ({ page, testEnv }) => {
      test.setTimeout(120_000);

      await test.step('Login and navigate', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
      });

      await test.step('CT-14: Processing Fee and Amount at Signed min-width = 150px', async () => {
        const procFeeWidth = await programsPage.getColumnWidth('Processing Fee');
        const amtSignedWidth = await programsPage.getColumnWidth('Amount at Signed');
        expect(procFeeWidth).toBe('150px');
        expect(amtSignedWidth).toBe('150px');
      });
    });

    test('CT-15: DB persistence validation', async ({ page, testEnv, db }, testInfo) => {
      test.setTimeout(180_000);

      await test.step('Login and navigate', async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        programsPage = new ProgramsPage(page);
        await programsPage.navigateToPrograms(testEnv.originationUrl);
        await programsPage.showMaxRows();
      });

      await test.step('Set test values via UI', async () => {
        await programsPage.clickProgramLink(PROGRAM_NAME);
        await programsPage.fillProcessingFee('33.5');
        await programsPage.fillAmountAtSigned('77.25');
        await programsPage.saveProgram();
      });

      await test.step('CT-15: Validate DB columns', async () => {
        const row = await db.queryOne<{
          processing_fee_override: string | null;
          amount_charged_at_signing: string | null;
          program_name: string;
        }>(
          `SELECT program_name, processing_fee_override, amount_charged_at_signing
           FROM uown_merchant_program WHERE pk = $1`,
          [PROGRAM_PK],
        );

        expect(row).not.toBeNull();
        expect(row!.program_name).toContain('2018 13 Month Program');
        expect(row!.processing_fee_override).not.toBeNull();
        expect(parseFloat(row!.processing_fee_override!)).toBeCloseTo(33.5, 2);
        expect(row!.amount_charged_at_signing).not.toBeNull();
        expect(parseFloat(row!.amount_charged_at_signing!)).toBeCloseTo(77.25, 2);

        await testInfo.attach('CT-15-db-result', {
          body: JSON.stringify(row, null, 2),
          contentType: 'application/json',
        });
      });

      // Reset values to 0 after test
      await test.step('Cleanup: reset values to 0', async () => {
        await programsPage.navigateToPrograms(testEnv.originationUrl);
        await programsPage.showMaxRows();
        await programsPage.clickProgramLink(PROGRAM_NAME);
        await programsPage.fillProcessingFee('0');
        await programsPage.fillAmountAtSigned('0');
        await programsPage.saveProgram();
      });
    });
  });
}

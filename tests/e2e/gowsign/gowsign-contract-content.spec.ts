/**
 * E2E Hybrid — GowSign Contract Content (DOC-02..DOC-15)
 *
 * Validates the contract content rendered inside the GowSign iframe AFTER the
 * UOwn backend has built it. Covers US-DOC-02..DOC-15 with the exception of
 * DOC-01 (Property Price Tag) and DOC-13 (Smoke iframe load), both already
 * exercised by `gowsign-smoke-flow.spec.ts`.
 *
 * Architecture constraint:
 *   QA does NOT call the GowSign API directly (no `GOWSIGN_API_KEY` in QA).
 *   We drive a lead to `CC_AUTH_PASSED` via UOwn API and consume the
 *   `paymentDetailsList[0].redirectUrl` returned by `sendApplication` —
 *   the same entrypoint the real consumer uses.
 *
 * Setup helper:
 *   `setupApplicationViaApi` (extractContractUrl + submitPaymentInfoViaApi).
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage` (src/pages/gowsign/document-viewer.page.ts)
 *   - DB helpers:  `getEsignDocumentByLeadPk` (src/helpers/esign-db.helpers.ts)
 *
 * Spec source: docs/taskTestingUown/gowsign_integration/gowsign-integration-test-scenarios.md
 *
 * Skipped (with reasons inline): DOC-07, DOC-11, DOC-12, DOC-14, DOC-15.
 *
 * Tags: @regression @e2e @hybrid @priority-medium @sandbox
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { GowSignDocumentViewerPage } from '@pages/gowsign/document-viewer.page.js';
import { getEsignDocumentByLeadPk } from '@helpers/esign-db.helpers.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Local utility ───────────────────────────────────────────────────
/**
 * Convert money strings ("$1,234.56", "1234.56", "(1.00)") into integer cents
 * for tolerance comparisons. Non-numeric → NaN.
 */
function moneyToCents(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return Number.NaN;
  const s = String(raw).replace(/,/g, '').replace(/[()]/g, '-');
  const m = s.match(/-?\d+(\.\d+)?/);
  if (!m) return Number.NaN;
  return Math.round(Number(m[0]) * 100);
}

/** $0.01 tolerance helper. */
function moneyEqual(a: string | number, b: string | number): boolean {
  const ac = moneyToCents(a);
  const bc = moneyToCents(b);
  if (!Number.isFinite(ac) || !Number.isFinite(bc)) return false;
  return Math.abs(ac - bc) <= 1; // 1 cent
}

// ── Test data (low-risk, fresh fixture per test) ────────────────────
const baseTags = buildTags(TestTag.REGRESSION, TestTag.SANDBOX);
const extraTags = ['@e2e', '@hybrid', '@priority-medium', '@db-validation'];

const data = {
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
};

test.describe(
  `GowSign Contract Content - ${data.merchant}`,
  { tag: [...splitTags(baseTags), ...extraTags] },
  () => {

    // ─────────────────────────────────────────────────────────────
    // Local helper — drive a fresh lead to CC_AUTH_PASSED and return
    // the GowSign iframe URL + lead identifiers. Each test calls it
    // (independence — no shared state).
    // ─────────────────────────────────────────────────────────────
    type Setup = {
      contractUrl: string;
      applicantState: string;
      applicantFirstName: string;
      applicantLastName: string;
      orderTotal: string;
      leadPk: number;
    };

    async function preflight(
      api: Parameters<Parameters<typeof test>[2]>[0]['api'],
      ctx: Parameters<Parameters<typeof test>[2]>[0]['ctx'],
      mSetup: Parameters<Parameters<typeof test>[2]>[0]['merchantConfig'],
      testInfo: Parameters<Parameters<typeof test>[2]>[1],
      stateOverride?: string,
      labelSuffix = '',
    ): Promise<Setup> {
      const stateCode = stateOverride ?? data.state;
      const { merchant, applicant, order } = buildTestData({
        state: stateCode,
        merchant: data.merchant,
        orderTotal: data.orderTotal,
        orderDescription: `GowSign content - ${labelSuffix || stateCode}`,
      });

      await mSetup.configureByName(data.merchant, 'lifecycle');

      const result = await setupApplicationViaApi(
        api,
        {
          merchant,
          applicant,
          order,
          verifyApproval: true,
          extractContractUrl: true,
          submitPaymentInfoViaApi: true,
        },
        testInfo,
        ctx,
      );
      expect(result.contractUrl, 'paymentDetailsList[0].redirectUrl required').toBeTruthy();

      return {
        contractUrl: result.contractUrl ?? '',
        applicantState: stateCode,
        applicantFirstName: applicant.firstName,
        applicantLastName: applicant.lastName,
        orderTotal: data.orderTotal,
        leadPk: Number(ctx.leadPk),
      };
    }

    /**
     * Wait until the backend has finished building the contract content
     * (esign_document row exists for the lead). Mirrors the smoke flow.
     */
    async function waitForEsignDoc(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: any,
      leadPk: number,
      timeoutMs = 60_000,
    ): Promise<void> {
      const deadline = Date.now() + timeoutMs;
      let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
      while (!esignDoc && Date.now() < deadline) {
        await sleep(2_000);
        esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
      }
      expect(
        esignDoc,
        `uown_esign_document row not found for lead_pk=${leadPk}`,
      ).not.toBeNull();
    }

    // ═══════════════════════════════════════════════════════════════════
    // DOC-02 / 2.1 — LESSEE block matches applicant inputs
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-02/2.1 LESSEE block matches applicant name + address inputs',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: drive fresh lead to CC_AUTH_PASSED (CA)', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'lessee');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: LESSEE name + address match applicant inputs', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const lessee = await viewer.getLessee();
          console.log(`[GowSign] lessee=${JSON.stringify(lessee)}`);

          expect(lessee.name.toLowerCase()).toContain(setup.applicantFirstName.toLowerCase());
          expect(lessee.name.toLowerCase()).toContain(setup.applicantLastName.toLowerCase());
          expect(lessee.address, 'Lessee address must be populated').toBeTruthy();
          expect(lessee.city, 'Lessee city must be populated').toBeTruthy();
          expect(lessee.state).toBe(setup.applicantState);
          expect(lessee.zip).toMatch(/^\d{5}(-\d{4})?$/);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc02-lessee.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-03 / 3.1 — LESSOR for AK leads === "KW-Choice Alaska LLC"
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-03/3.1 LESSOR for AK lead is "KW-Choice Alaska LLC"',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh lead with state=AK', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'AK', 'lessor-AK');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: LESSOR name === "KW-Choice Alaska LLC"', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const lessor = await viewer.getLessor();
          console.log(`[GowSign] lessor(AK)=${JSON.stringify(lessor)}`);
          expect(lessor.name).toBe('KW-Choice Alaska LLC');

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc03-1-lessor-ak.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-03 / 3.2 — LESSOR for CA leads === "Mollie, LLC, dba Uown"
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-03/3.2 LESSOR for CA lead is "Mollie, LLC, dba Uown"',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh lead with state=CA', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'lessor-CA');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: LESSOR name === "Mollie, LLC, dba Uown"', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const lessor = await viewer.getLessor();
          console.log(`[GowSign] lessor(CA)=${JSON.stringify(lessor)}`);
          expect(lessor.name).toBe('Mollie, LLC, dba Uown');

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc03-2-lessor-ca.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-04 / 4.1 — Lease items grid matches invoice payload
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-04/4.1 Lease items grid renders the invoice items',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh lead', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'items');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: at least one item with description + total', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const items = await viewer.getLeaseItems();
          console.log(`[GowSign] leaseItems=${JSON.stringify(items)}`);

          expect(items.length, 'Lease items table must have at least 1 row').toBeGreaterThan(0);
          for (const item of items) {
            expect(item.description, 'Each item must have a description').toBeTruthy();
            expect(item.totalPrice, 'Each item must have a total price').toMatch(/\$?\d/);
          }

          // Sum of item prices ≈ orderTotal (within $0.01 tolerance per row + total)
          const sumCents = items
            .map((i) => moneyToCents(i.totalPrice))
            .filter((c) => Number.isFinite(c))
            .reduce((acc, c) => acc + c, 0);
          const orderCents = moneyToCents(setup.orderTotal);
          expect(
            Math.abs(sumCents - orderCents),
            `Items total (${sumCents} cents) must match orderTotal (${orderCents} cents) within $0.01`,
          ).toBeLessThanOrEqual(1);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc04-items.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-05 / 5.1 — Initial Payment Breakdown sums to total
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-05/5.1 Initial payment breakdown: initial+processing+tax+delivery == total ($0.01)',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh lead', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'breakdown');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: breakdown components sum to total within $0.01', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const bd = await viewer.getInitialPaymentBreakdown();
          console.log(`[GowSign] breakdown=${JSON.stringify(bd)}`);

          // Delivery fee is shown in a separate row when applicable; treat absent as 0.
          let deliveryCents = 0;
          try {
            const delivery = await viewer.getTotalDeliveryFee();
            const c = moneyToCents(delivery);
            deliveryCents = Number.isFinite(c) ? c : 0;
          } catch {
            deliveryCents = 0;
          }

          const initialCents = moneyToCents(bd.initialLeasePayment);
          const processingCents = moneyToCents(bd.processingFee);
          const taxCents = moneyToCents(bd.tax);
          const totalCents = moneyToCents(bd.totalInitialPayment);

          expect(Number.isFinite(initialCents), 'initialLeasePayment must parse').toBeTruthy();
          expect(Number.isFinite(processingCents), 'processingFee must parse').toBeTruthy();
          expect(Number.isFinite(taxCents), 'tax must parse').toBeTruthy();
          expect(Number.isFinite(totalCents), 'totalInitialPayment must parse').toBeTruthy();

          const sumCents = initialCents + processingCents + taxCents + deliveryCents;
          expect(
            Math.abs(sumCents - totalCents),
            `initial(${initialCents}) + processing(${processingCents}) + tax(${taxCents}) + delivery(${deliveryCents}) ` +
              `must equal total(${totalCents}) within $0.01`,
          ).toBeLessThanOrEqual(1);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc05-breakdown.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-06 / 6.1 — EPO chart row count matches numberOfPayments
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-06/6.1 EPO chart row count matches paymentDetailsList numberOfPayments',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        let numberOfPaymentsApi: number | null = null;

        await test.step('Setup: fresh lead + capture API numberOfPayments', async () => {
          const { merchant, applicant, order } = buildTestData({
            state: data.state,
            merchant: data.merchant,
            orderTotal: data.orderTotal,
            orderDescription: 'GowSign content - EPO',
          });
          await mSetup.configureByName(data.merchant, 'lifecycle');

          // Send application + capture paymentDetailsList[0].numberOfPayments before
          // letting setupApplicationViaApi continue. Easiest: make the call manually.
          const appResp = await api.application.sendApplication(merchant, applicant);
          expect(appResp.ok, `sendApplication: ${appResp.status}`).toBeTruthy();
          ctx.leadUuid =
            appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
          ctx.leadPk = String(appResp.body.authorizationNumber ?? '');
          await sleep(5_000);

          const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid, {
            orderTotal: data.orderTotal,
          });
          expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

          const paymentDetails = invoiceResp.body?.paymentDetailsList ?? [];
          const idx = paymentDetails.length > 1 ? 1 : 0;
          const pd = paymentDetails[idx] as
            | { redirectUrl?: string; numberOfPayments?: number | string }
            | undefined;
          expect(pd?.redirectUrl).toBeTruthy();
          numberOfPaymentsApi =
            pd?.numberOfPayments !== undefined ? Number(pd.numberOfPayments) : null;
          setup = {
            contractUrl: pd!.redirectUrl as string,
            applicantState: data.state,
            applicantFirstName: applicant.firstName,
            applicantLastName: applicant.lastName,
            orderTotal: data.orderTotal,
            leadPk: Number(ctx.leadPk),
          };
          // Drive to CC_AUTH_PASSED so backend builds EPO chart.
          const url = new URL(setup.contractUrl);
          const shortCode = url.pathname.split('/').filter(Boolean)[0] ?? '';
          const planId = url.searchParams.get('planId') ?? '';
          if (shortCode) {
            const missing = await api.application.getMissingFields(
              shortCode,
              planId ? { planId } : undefined,
            );
            expect(missing.ok).toBeTruthy();
          }
          const submitResp = await api.application.submitApplication(
            Number(ctx.leadPk),
            applicant.firstName,
            applicant.lastName,
          );
          expect(submitResp.ok).toBeTruthy();
          await waitForEsignDoc(db, setup.leadPk);
          console.log(`[GowSign] api numberOfPayments=${numberOfPaymentsApi}`);
        });

        await test.step('UI: EPO chart row count matches API numberOfPayments (and is in 13m WEEKLY range 53-57)', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const rowCount = await viewer.getEpoChartRowCount();
          console.log(`[GowSign] EPO row count=${rowCount}`);

          if (numberOfPaymentsApi !== null && Number.isFinite(numberOfPaymentsApi)) {
            expect(rowCount).toBe(numberOfPaymentsApi);
          }
          // 13m WEEKLY plan baseline range from spec.
          expect(rowCount).toBeGreaterThanOrEqual(53);
          expect(rowCount).toBeLessThanOrEqual(57);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc06-epo.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-07 — SKIPPED (3-Month Promo Payoff): buyoutFee config TBD
    // ═══════════════════════════════════════════════════════════════════
    test.skip(
      'DOC-07 3-Month Promo Payoff value cross-validates with buyoutFee — SKIPPED: buyoutFee config TBD',
      () => {
        // Skipped: requires merchant-level buyoutFee config that is not yet
        // confirmed for ProgressMobility in sandbox. Re-enable once the config
        // contract documents the expected promo formula.
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-08 / 8.1 — ACH grid: every row has the same totalCost
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-08/8.1 ACH grid: all rows share the same totalCost',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh lead', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'ach');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: every ACH row has identical totalCost', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const grid = await viewer.getAchGrid();
          console.log(`[GowSign] achGrid=${JSON.stringify(grid)}`);

          expect(grid.length, 'ACH grid must have at least 1 row').toBeGreaterThan(0);

          const firstTotal = grid[0].totalCost;
          for (const row of grid) {
            expect(
              moneyEqual(row.totalCost, firstTotal),
              `ACH row totalCost mismatch: ${row.totalCost} vs ${firstTotal}`,
            ).toBe(true);
          }

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc08-ach.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-09 / 9.1 — Agreement number format + account number === leadPk
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-09/9.1 Agreement number matches /^UOWN_\\d+_\\d+$/ and account number equals leadPk',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh lead', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'agreement');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: agreementNumber format + accountNumber === leadPk', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const agreementNumber = (await viewer.getAgreementNumber()).trim();
          const accountNumber = (await viewer.getAccountNumber()).trim();
          const contractDate = (await viewer.getContractDate()).trim();
          console.log(
            `[GowSign] agreement=${agreementNumber} account=${accountNumber} date=${contractDate}`,
          );

          expect(agreementNumber).toMatch(/^UOWN_\d+_\d+$/);
          // accountNumber may be wrapped/padded; use numeric comparison
          const accountDigits = accountNumber.replace(/\D/g, '');
          expect(
            accountDigits,
            `accountNumber=${accountNumber} should equal leadPk=${setup.leadPk}`,
          ).toBe(String(setup.leadPk));
          // Sanity — contract date should not be empty.
          expect(contractDate.length).toBeGreaterThan(0);

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc09-agreement.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-10 / 10.1 — Document title contains state-specific suffix
    // ═══════════════════════════════════════════════════════════════════
    test(
      'DOC-10/10.1 Document title contains "CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}" (CA)',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh CA lead', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'CA', 'title-CA');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: document title mentions CONSUMER LEASE-PURCHASE AGREEMENT-CA', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const title = (await viewer.getDocumentTitle()).toUpperCase();
          console.log(`[GowSign] title(CA)=${title}`);
          expect(title).toContain('CONSUMER LEASE-PURCHASE AGREEMENT');
          expect(title).toContain('CA');

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc10-1-title-ca.png'),
            fullPage: false,
          });
        });
      },
    );

    test(
      'DOC-10/10.1 Document title contains "CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}" (AK)',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        let setup!: Setup;
        await test.step('Setup: fresh AK lead', async () => {
          setup = await preflight(api, ctx, mSetup, testInfo, 'AK', 'title-AK');
          await waitForEsignDoc(db, setup.leadPk);
        });

        await test.step('UI: document title mentions CONSUMER LEASE-PURCHASE AGREEMENT-AK', async () => {
          await page.goto(setup.contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const title = (await viewer.getDocumentTitle()).toUpperCase();
          console.log(`[GowSign] title(AK)=${title}`);
          expect(title).toContain('CONSUMER LEASE-PURCHASE AGREEMENT');
          expect(title).toContain('AK');

          await page.screenshot({
            path: testInfo.outputPath('gowsign-doc10-2-title-ak.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-11 — SKIPPED (additional fees): requires specific template
    // ═══════════════════════════════════════════════════════════════════
    test.skip(
      'DOC-11 Additional fees rendered when applicable — SKIPPED: requires specific template',
      () => {
        // Skipped: validation depends on a contract template that surfaces
        // additional fee rows (e.g. liability damage waiver). Default template
        // for ProgressMobility/sandbox doesn't render them. Re-enable when a
        // dedicated template fixture is available.
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-12 — SKIPPED (cross-validation API ↔ PDF text)
    // ═══════════════════════════════════════════════════════════════════
    test.skip(
      'DOC-12 Cross-validate API values against extracted PDF text — SKIPPED: extractContractValues(pdf) TBD',
      () => {
        // Skipped: requires a PDF parsing helper `extractContractValues(pdf)`
        // that does not exist yet (would download the PDF and OCR/parse keys
        // for total/recurring/EPO). Re-enable once that helper lands.
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-14 — SKIPPED (audit trail post-signing)
    // ═══════════════════════════════════════════════════════════════════
    test.skip(
      'DOC-14 Audit trail rendered after signing — SKIPPED: requires signing helper',
      () => {
        // Skipped: depends on a UI signing helper that drives the GowSign
        // signature ceremony to completion (currently QA cannot sign without
        // calling the GowSign API directly, which is not allowed).
      },
    );

    // ═══════════════════════════════════════════════════════════════════
    // DOC-15 — SKIPPED (geo + device fingerprint after signing)
    // ═══════════════════════════════════════════════════════════════════
    test.skip(
      'DOC-15 Geo + device fingerprint captured on signing — SKIPPED: requires signing',
      () => {
        // Skipped: same blocker as DOC-14 — the fingerprint block only renders
        // after a successful signature, and we have no signing path in QA.
      },
    );
  },
);

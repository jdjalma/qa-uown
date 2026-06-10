/**
 * svc#527 — Incorrect "90-Day Promotional Payoff" and "Cash Price"
 *           References in 16-Month Lease Documents TEMPLATE (Texas)
 *
 * Validates that:
 *   1. TX 16-month lease documents use Anytime Buyout terminology (no "90-Day", no "Cash Price")
 *   2. TX 13-month (standard) lease documents retain original terminology (regression)
 *   3. Backend routes TX applications to GowSign template
 *
 * Environment: stg
 * Tags: @origination (setup via API + document viewer on consumer portal)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { GowSignDocumentViewerPage } from '@pages/gowsign/document-viewer.page.js';
import { getEsignDocumentByLeadPk } from '@helpers/esign-db.helpers.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

const baseTags = buildTags(TestTag.REGRESSION, TestTag.STG);
const extraTags = ['@e2e', '@hybrid', '@priority-high', '@origination'];

const testData = [{
  env: 'stg',
  tag: '@origination',
  state: 'TX',
  merchant: 'TerraceFinance',
  orderTotal: '800',
}];

const FORBIDDEN_TERMS_16M = [
  '90-Day Promotional',
  '90 Day Promotional',
  'Cash Price',
  'This option expires on',
];

const EXPECTED_SECTION_4_PHRASES = [
  'Promotional-Payoff Option',
  'You can buy the Property at any time',
  'plus daily lease fees from the inception of the lease through the date you exercise the Early Purchase Option',
  'less all rental payments you have made on time',
];

const EXPECTED_SECTION_4A_PHRASES = [
  'EPO price is calculated by adding the daily lease charges accrued',
  'number of days from lease inception through the date you exercise the Early Purchase Option',
  'together with all applicable fees and taxes',
  'less all rental payments you have made on time',
];

const EXPECTED_EPO_SECTION_PHRASES = [
  'EARLY PURCHASE OPTION',
  '16-month term for ownership',
  'you may purchase the Property at any time',
  'EPO price is calculated as',
  'The cost of the leased goods',
  'Plus taxes',
  'Plus applicable fees',
  'accrued daily lease fees from the lease inception date through the date you exercise the Early Purchase Option',
  'Minus any payments made, excluding taxes and fees',
  '(877)357-5474',
];

/** Generate SSN ending in 916 to force 16m eligibility via mock BlackBox. */
function generate16mSSN(): string {
  const prefix = Math.floor(100000 + Math.random() * 899999);
  return `${prefix}916`;
}

test.describe(
  'svc#527 — TX 16-Month Lease Document Terminology',
  { tag: [...splitTags(baseTags), ...extraTags] },
  () => {
    for (const td of testData) {

      type Setup = {
        contractUrl: string;
        embeddedSigningUrl?: string;
        esignClient?: string;
        leadPk: number;
      };

      async function createLead(
        api: Parameters<Parameters<typeof test>[2]>[0]['api'],
        ctx: Parameters<Parameters<typeof test>[2]>[0]['ctx'],
        testInfo: Parameters<Parameters<typeof test>[2]>[1],
        ssn: string,
        label: string,
      ): Promise<Setup> {
        const { merchant, applicant, order } = buildTestData({
          state: td.state,
          merchant: td.merchant,
          orderTotal: td.orderTotal,
          orderDescription: `svc527 ${label}`,
        });
        applicant.ssn = ssn;

        const result = await setupApplicationViaApi(
          api,
          {
            merchant,
            applicant,
            order,
            env: td.env,
            verifyApproval: true,
            extractContractUrl: true,
            submitPaymentInfoViaApi: true,
          },
          testInfo,
          ctx,
        );

        return {
          contractUrl: result.contractUrl ?? '',
          embeddedSigningUrl: result.embeddedSigningUrl,
          esignClient: result.esignClient,
          leadPk: Number(ctx.leadPk),
        };
      }

      async function waitForEsignDoc(
        db: Parameters<Parameters<typeof test>[2]>[0]['db'],
        leadPk: number,
        timeoutMs = 60_000,
      ): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        let doc = await getEsignDocumentByLeadPk(db, leadPk);
        while (!doc && Date.now() < deadline) {
          await sleep(2_000);
          doc = await getEsignDocumentByLeadPk(db, leadPk);
        }
        expect(doc, `uown_esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
      }

      async function getDocumentFullText(page: Parameters<Parameters<typeof test>[2]>[0]['page'], url: string): Promise<string> {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const viewer = new GowSignDocumentViewerPage(page);
        await viewer.waitForLoaded(90_000);
        const viewerRoot = viewer.viewerRoot.first();
        await viewerRoot.waitFor({ state: 'visible', timeout: 30_000 });
        return viewerRoot.innerText();
      }

      // ═══════════════════════════════════════════════════════════════
      // CT-01 + CT-05..CT-08: 16-Month Lease — Routing + Content
      // ═══════════════════════════════════════════════════════════════
      test(
        `CT-01/05-08: TX 16m lease — GowSign routing + Anytime Buyout terminology [${td.env}]`,
        { tag: ['@priority-high'] },
        async ({ page, api, db, ctx }, testInfo) => {
          test.setTimeout(420_000);

          let setup!: Setup;

          await test.step('CT-01: Create fresh TX 16m lead via API (SSN 916)', async () => {
            const ssn16m = generate16mSSN();
            console.log(`[svc527] SSN (16m): ${ssn16m}`);
            setup = await createLead(api, ctx, testInfo, ssn16m, 'TX-16m');
            expect(setup.contractUrl, 'contractUrl must be populated').toBeTruthy();
            console.log(`[svc527] leadPk=${setup.leadPk} esignClient=${setup.esignClient}`);
            console.log(`[svc527] contractUrl=${setup.contractUrl}`);
            if (setup.embeddedSigningUrl) {
              console.log(`[svc527] embeddedSigningUrl=${setup.embeddedSigningUrl}`);
            }
          });

          await test.step('CT-01: Verify backend routed to GOWSIGN', async () => {
            await waitForEsignDoc(db, setup.leadPk);
            const esignRow = await db.queryOne(
              `SELECT pk, client, status FROM uown_esign_document WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
              [setup.leadPk],
            );
            expect(esignRow, 'esign_document row must exist').toBeTruthy();
            console.log(`[svc527] esign_document: client=${esignRow.client} status=${esignRow.status}`);
            expect(esignRow.client).toBe('GOWSIGN');
          });

          await test.step('CT-01: Verify activity log for application (soft)', async () => {
            const notes = await db.query(
              `SELECT pk, notes FROM uown_los_lead_notes WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 5`,
              [setup.leadPk],
            );
            console.log(`[svc527] Activity logs found: ${notes.length}`);
            if (notes.length > 0) {
              notes.forEach((n: { pk: number; notes: string }) => console.log(`  note pk=${n.pk}: ${String(n.notes).slice(0, 120)}`));
            } else {
              console.warn('[svc527] No activity log found yet for lead — may be delayed. Continuing.');
            }
          });

          let fullText = '';

          await test.step('CT-05/06/07: Navigate to document and extract text', async () => {
            const url = setup.embeddedSigningUrl || setup.contractUrl;
            fullText = await getDocumentFullText(page, url);
            console.log(`[svc527] Document text length: ${fullText.length} chars`);
            expect(fullText.length, 'Document must have content').toBeGreaterThan(100);

            await page.screenshot({
              path: testInfo.outputPath('svc527-tx-16m-page1.png'),
              fullPage: false,
            });
          });

          await test.step('CT-05: Section 4 — Promotional-Payoff Option (Anytime Buyout wording)', async () => {
            for (const phrase of EXPECTED_SECTION_4_PHRASES) {
              expect(
                fullText,
                `Section 4 must contain: "${phrase}"`,
              ).toContain(phrase);
            }
            expect(fullText).not.toMatch(/90.Day Promotional/i);
          });

          await test.step('CT-06: Section 4a — EPO price formula (daily lease charges)', async () => {
            for (const phrase of EXPECTED_SECTION_4A_PHRASES) {
              expect(
                fullText,
                `Section 4a must contain: "${phrase}"`,
              ).toContain(phrase);
            }
            expect(fullText).not.toMatch(/total amount of remaining lease payments for ownership/i);
          });

          await test.step('CT-07: Early Purchase Option section (final pages)', async () => {
            for (const phrase of EXPECTED_EPO_SECTION_PHRASES) {
              expect(
                fullText,
                `EPO section must contain: "${phrase}"`,
              ).toContain(phrase);
            }
          });

          await test.step('CT-08: Forbidden terms ABSENT from 16m document', async () => {
            for (const term of FORBIDDEN_TERMS_16M) {
              expect(
                fullText,
                `16m document must NOT contain: "${term}"`,
              ).not.toContain(term);
            }
          });
        },
      );

      // ═══════════════════════════════════════════════════════════════
      // CT-02 + CT-11: 13-Month (Standard) — Routing + Regression
      // ═══════════════════════════════════════════════════════════════
      test(
        `CT-02/11: TX 13m standard lease — routing + original terminology preserved [${td.env}]`,
        { tag: ['@priority-high'] },
        async ({ page, api, db, ctx }, testInfo) => {
          test.setTimeout(420_000);

          let setup!: Setup;

          await test.step('CT-02: Create fresh TX 13m lead via API (standard SSN)', async () => {
            const { merchant, applicant, order } = buildTestData({
              state: td.state,
              merchant: td.merchant,
              orderTotal: td.orderTotal,
              orderDescription: 'svc527 TX-13m regression',
            });
            const result = await setupApplicationViaApi(
              api,
              {
                merchant,
                applicant,
                order,
                env: td.env,
                verifyApproval: true,
                extractContractUrl: true,
                submitPaymentInfoViaApi: true,
              },
              testInfo,
              ctx,
            );

            setup = {
              contractUrl: result.contractUrl ?? '',
              embeddedSigningUrl: result.embeddedSigningUrl,
              esignClient: result.esignClient,
              leadPk: Number(ctx.leadPk),
            };
            expect(setup.contractUrl, 'contractUrl must be populated').toBeTruthy();
            console.log(`[svc527-13m] leadPk=${setup.leadPk} esignClient=${setup.esignClient}`);
          });

          await test.step('CT-02: Verify GOWSIGN routing for 13m TX', async () => {
            await waitForEsignDoc(db, setup.leadPk);
            const esignRow = await db.queryOne(
              `SELECT pk, client, status FROM uown_esign_document WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
              [setup.leadPk],
            );
            expect(esignRow, 'esign_document row must exist').toBeTruthy();
            console.log(`[svc527-13m] esign_document: client=${esignRow.client} status=${esignRow.status}`);
            // TX now has GowSign template — 13m should also route to GowSign
            expect(esignRow.client).toBe('GOWSIGN');
          });

          let fullText = '';

          await test.step('CT-11: Navigate to 13m document and extract text', async () => {
            const url = setup.embeddedSigningUrl || setup.contractUrl;
            fullText = await getDocumentFullText(page, url);
            console.log(`[svc527-13m] Document text length: ${fullText.length} chars`);
            expect(fullText.length, 'Document must have content').toBeGreaterThan(100);

            await page.screenshot({
              path: testInfo.outputPath('svc527-tx-13m-page1.png'),
              fullPage: false,
            });
          });

          await test.step('CT-11: 13m document retains original promotional payoff terminology', async () => {
            const has90Day = fullText.includes('90-Day Promotional') || fullText.includes('90 Day Promotional');
            expect(has90Day, '13m document MUST contain "90-Day Promotional" or "90 Day Promotional"').toBeTruthy();
            expect(fullText).toContain('Cash Price');
          });

          await test.step('CT-11: 13m document has two-option EPO structure', async () => {
            // Standard 13m has: "1. Promotional Payoff Option" and "2. Early Purchase Option"
            const hasPromoOption = fullText.includes('Promotional Payoff Option') || fullText.includes('Promotional-Payoff Option');
            expect(hasPromoOption, '13m document must contain Promotional Payoff/Payoff Option').toBeTruthy();
          });
        },
      );
    }
  },
);

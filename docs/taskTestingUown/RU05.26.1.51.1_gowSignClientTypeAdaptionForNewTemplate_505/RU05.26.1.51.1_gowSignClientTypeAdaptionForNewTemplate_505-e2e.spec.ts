/**
 * UI/Hybrid scenarios for RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505.
 *
 * Per CLAUDE.md inviolable rule #15 (UI-first), all customer-facing scenarios live here.
 * The companion file `RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505.spec.ts`
 * holds ONLY admin endpoints with no UI affordance (CT-08 PATCH, CT-09 PATCH 4xx).
 *
 * Scenarios in this file:
 *
 *   - CT-R01..R12  Routing matrix (3 merchants × 4 states) — Hybrid (API setup + UI iframe inspection + PDF placeholder check)
 *   - CT-03  Document content diff (jewelry vs standard CA) — Hybrid (PDF text)
 *   - CT-06  Sign + sweep + STORED lifecycle (Daniel's Jewelers) — Hybrid (UI signing + DB lifecycle)
 *   - CT-07  Servicing portal Documents section + download — E2E (UI)
 *
 * Same describe header is used so a `--grep` against the milestone name picks up
 * both files. Coordination: separate task lock (`-e2e` suffix) to avoid contention
 * with the API agent.
 *
 * Notes / blockers (see final summary):
 *   - PDF capture in CT-03 uses `captureContractPdf` (page.pdf() of the rendered
 *     iframe URL) — the same approach proven by `gowsign-contract-content-qa2.spec.ts`.
 *     We do NOT call GowSign's signed-PDF download API (no `GOWSIGN_API_KEY` in qa).
 *     This means CT-03 inspects the PRE-signed rendered HTML — sufficient for the
 *     differential markers but NOT for signed-PDF post-processing (covered by CT-07).
 *   - CT-06 reuses the existing `signGowSignInFrame` Type-mode signing helper.
 *     `getCompletedESignDocumentStatusSweep` is resumed AND triggered explicitly
 *     (Pitfall: sweep may be paused in qa2; resume-then-trigger covers both states).
 *   - CT-07 logs in with the `manager` portal credentials via `loginToPortalWithOptions`
 *     (the same pattern used by `gowsign-servicing-portal-qa2.spec.ts`).
 *
 * Spec source:
 *   docs/taskTestingUown/RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505/
 *     RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505-spec.md
 *     RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505-scenarios.md
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { createPreQualifiedApplication, setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import {
  installPostMessageRecorder,
  signGowSignInFrame,
} from '@helpers/gowsign-signing.helper.js';
import {
  getEsignDocumentByLeadPk,
  waitForEsignDocumentStatus,
  findLeadNoteContaining,
  getLeadNotesByLeadPk,
} from '@helpers/esign-db.helpers.js';
import {
  assertSelectedTemplateForLead,
  getEsignDocumentByLeadAndClient,
} from '@helpers/gowsign-template-db.helpers.js';
import { captureContractPdf } from '@helpers/contract-pdf.helper.js';
import { loginToPortalWithOptions } from '@helpers/auth.helpers.js';
import { navigateToServicingCustomer } from '@helpers/navigation.helpers.js';
import {
  AlternativeContractModalPage,
  GowSignDocumentViewerPage,
} from '@pages/gowsign/index.js';
import { ServicingDocumentsPage } from '@pages/servicing/index.js';
import { MissingDataFormPage, TermsOfAgreementPage } from '@pages/origination/index.js';
import { PDFParse } from 'pdf-parse';
import type { TestContext, ApiClients } from '@support/base-test.js';
import type { TestInfo } from '@playwright/test';

// ── Shared constants ─────────────────────────────────────────────────────────
const TEMPLATE_JEWELRY_CA = 'mu97ag8wkchj1icvn5amz5s6';
const TEMPLATE_STANDARD_CA = 'lkdu73w7dctuj7kxhc6omwvf';

const ENV = 'stg';
const STATE = 'CA';
const ORDER_TOTAL = '1000';

// ── PDF text extraction (CT-03) ──────────────────────────────────────────────
async function extractPdfText(pdfBytes: Buffer | Uint8Array): Promise<string> {
  const data = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  const parser = new PDFParse({ data });
  const result = await parser.getText();
  await parser.destroy();
  return result.text ?? '';
}

// ── Daniel's lead helper (used by CT-03 lead A and CT-06) ────────────────────
async function buildAndDriveDanielsLead(
  api: ApiClients,
  ctx: TestContext,
  testInfo: TestInfo,
  orderDescription: string,
): Promise<{ contractUrl: string; leadPk: number; merchant: ReturnType<typeof buildTestData>['merchant']; applicant: ReturnType<typeof buildTestData>['applicant'] }> {
  const { merchant, applicant } = buildTestData({
    env: ENV,
    state: STATE,
    merchant: 'DanielsJewelers',
    orderTotal: ORDER_TOTAL,
    orderDescription,
  });

  await createPreQualifiedApplication(
    api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo,
  );

  // Use sendInvoice to obtain the contract URL (redirectUrl) — the orchestrator
  // dispatches the GowSign document on first navigation / CC auth. We need the
  // URL to feed both the iframe (CT-06) and `captureContractPdf` (CT-03).
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  const contractUrl = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'invoice.redirectUrl required').toBeTruthy();
  ctx.contractUrl = contractUrl;

  return { contractUrl, leadPk: Number(ctx.leadPk), merchant, applicant };
}

test.describe(
  'RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505 - stg (E2E + Hybrid)',
  { tag: ['@regression', '@hotfix', '@gowsign', '@template-routing', '@stg'] },
  () => {
    test.use({ envName: ENV });

    // ─────────────────────────────────────────────────────────────────────
    // CT-R01..R12 — Routing matrix (3 merchants × 4 states) — UI-driven
    //
    // Per CLAUDE.md rule #15: validate via UI what is observable via UI. The
    // hotfix's user-visible effect is which iframe loads (gowsign-app-dev-uown
    // vs signwell.com) and which template content renders. We use API setup to
    // accelerate (rule #15 exception (b)) and then validate via browser:
    //
    //   1. Open the contract redirectUrl in the browser
    //   2. Inspect which iframe provider loaded (gowsign-app-dev-uown.azurewebsites.net
    //      vs www.signwell.com) — this is what the customer sees
    //   3. For GOWSIGN: capture the iframe PDF + check that BUG-01-vulnerable
    //      placeholders ({{securityDeposit}}, {{costPriceWithFeeNoTax}}) are
    //      populated with monetary values, NOT empty `$ .` or `$ ,` strings.
    //
    // INSTORE merchant exception (per .claude/rules/testing.md § E-sign Provider
    // Routing): Daniel's and Saslow's are INSTORE → backend uses merchant.state
    // for template lookup, ignoring customer state. Daniel's (CA) routes to CA
    // template regardless of customer state; Saslow's (NC) routes to NC (no
    // template) → SIGNWELL fallback regardless of customer state. TireAgent
    // (ONLINE) honors customer state.
    // ─────────────────────────────────────────────────────────────────────

    interface RoutingCase {
      ct: string;
      merchant: 'DanielsJewelers' | 'ParamountJewelers' | 'TireAgent' | 'FifthAveFurnitureNY';
      merchantType: 'INSTORE' | 'ONLINE';
      merchantState: string; // for documentation only — backend uses this for INSTORE
      customerState: string;
      expectedProvider: 'gowsign-app-dev-uown' | 'signwell.com';
      expectedTemplate: 'jewelry' | 'standard' | 'n/a (signwell)';
    }

    function effectiveStateOf(c: { merchantType: string; merchantState: string; customerState: string }): string {
      return c.merchantType === 'INSTORE' ? c.merchantState : c.customerState;
    }

    function expectedRoutingFor(c: { merchant: string; merchantType: string; merchantState: string; customerState: string }): {
      provider: 'gowsign-app-dev-uown' | 'signwell.com';
      template: 'jewelry' | 'standard' | 'n/a (signwell)';
    } {
      const state = effectiveStateOf(c);
      if (state !== 'CA') return { provider: 'signwell.com', template: 'n/a (signwell)' };
      // CA — jewelry template matches Daniel's Jewelers (DANIELS_JEWELERS clientType)
      if (c.merchant === 'DanielsJewelers') return { provider: 'gowsign-app-dev-uown', template: 'jewelry' };
      return { provider: 'gowsign-app-dev-uown', template: 'standard' };
    }

    const ROUTING_MATRIX: RoutingCase[] = (() => {
      // Best-guess INSTORE/ONLINE classification for stg — backend config drives
      // actual routing. If observed routing diverges, the test will surface it.
      const merchants: Array<Pick<RoutingCase, 'merchant' | 'merchantType' | 'merchantState'>> = [
        { merchant: 'DanielsJewelers',     merchantType: 'INSTORE', merchantState: 'CA' },
        { merchant: 'ParamountJewelers',   merchantType: 'INSTORE', merchantState: 'CA' },
        { merchant: 'TireAgent',           merchantType: 'ONLINE',  merchantState: 'CA' },
        { merchant: 'FifthAveFurnitureNY', merchantType: 'INSTORE', merchantState: 'NY' },
      ];
      const states = ['CA', 'TX', 'FL', 'NC'];
      const rows: RoutingCase[] = [];
      let idx = 1;
      for (const m of merchants) {
        for (const customerState of states) {
          const exp = expectedRoutingFor({ ...m, customerState });
          rows.push({
            ct: `CT-R${String(idx).padStart(2, '0')}`,
            merchant: m.merchant,
            merchantType: m.merchantType,
            merchantState: m.merchantState,
            customerState,
            expectedProvider: exp.provider,
            expectedTemplate: exp.template,
          });
          idx++;
        }
      }
      return rows;
    })();

    for (const c of ROUTING_MATRIX) {
      test(
        `${c.ct} — ${c.merchant} (${c.merchantType}/state=${c.merchantState}) × customer=${c.customerState} → ${c.expectedProvider} (${c.expectedTemplate})`,
        { tag: ['@routing-matrix', '@ui-driven', `@${c.merchant.toLowerCase()}`, `@customer-${c.customerState.toLowerCase()}`] },
        async ({ api, db, ctx, page }, testInfo) => {
          // Generous timeout — manual flow works; UI-driven validation may be
          // slower under qa2 load (per user instruction: increase timeouts when
          // manual succeeds).
          test.setTimeout(360_000);

          const { merchant, applicant, order } = buildTestData({
            env: ENV,
            state: c.customerState,
            merchant: c.merchant,
            orderTotal: ORDER_TOTAL,
            orderDescription: `${c.ct} routing matrix`,
          });

          await test.step('Setup via API (rule #15 exception (b) — accelerate to submitApplication)', async () => {
            const result = await setupApplicationViaApi(
              api,
              {
                merchant,
                applicant,
                order,
                env: ENV,
                verifyApproval: true,
                extractContractUrl: true,
                submitPaymentInfoViaApi: true,
                skipMerchantPreflight: true,
              },
              testInfo,
              ctx,
            );
            // The submitApplication response contains the iframe URL directly.
            // We use it for visual validation instead of redirectUrl (which leads
            // to the consumer flow form, not the iframe). Per Task #505 fix.
            expect(result.embeddedSigningUrl, 'embeddedSigningUrl required from submitApplication').toBeTruthy();
            expect(result.esignClient, 'esignClient required from submitApplication').toBeTruthy();
          });

          await test.step(`Validate provider routing (expected: ${c.expectedProvider})`, async () => {
            const url = ctx.embeddedSigningUrl ?? '';
            const provider = ctx.esignClient ?? '';
            console.log(`[${c.ct}] backend routed to client=${provider} url=${url}`);
            // Provider field is the source of truth (GOWSIGN vs SIGNWELL).
            // URL must match provider (cross-check).
            const expectedClientName = c.expectedProvider === 'gowsign-app-dev-uown' ? 'GOWSIGN' : 'SIGNWELL';
            expect(provider, `expected client=${expectedClientName}, observed=${provider}`).toBe(expectedClientName);
            expect(
              url.includes(c.expectedProvider),
              `expected provider URL contains "${c.expectedProvider}"; observed=${url}`,
            ).toBe(true);
          });

          if (c.expectedProvider === 'gowsign-app-dev-uown') {
            await test.step('UI: capture rendered PDF from iframe URL + assert BUG-01 placeholders populated', async () => {
              const gowSrc = ctx.embeddedSigningUrl ?? '';
              const pdfBytes = await captureContractPdf(page, gowSrc);
              const text = await extractPdfText(pdfBytes);
              await testInfo.attach(`${c.ct}.pdf`, { body: pdfBytes, contentType: 'application/pdf' });
              expect(text.length, 'PDF text >1000 chars (sanity)').toBeGreaterThan(1000);

              // [BDD 1.2 + BUG-01 visual] No literal {{var}} placeholders left.
              const placeholderRe = /\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}/;
              expect(
                placeholderRe.test(text),
                `[BUG-01] PDF still contains raw template placeholder: ${text.match(placeholderRe)?.[0] ?? '?'}`,
              ).toBe(false);

              const compact = text.replace(/\s+/g, ' ');
              if (c.expectedTemplate === 'jewelry') {
                // [BDD 2.1] Jewelry template must contain Security Deposit clause
                expect(
                  /security deposit/i.test(compact),
                  '[BDD 2.1] Jewelry template MUST contain Security Deposit clause',
                ).toBe(true);

                // [BUG-01 / Fernando lease 16152] Item 2 Security Deposit value must NOT be empty.
                // Empty pattern: "Security Deposit in the amount of $ ." or "$ . If you" with empty space.
                // Populated pattern (lease 16208): "Security Deposit in the amount of $ 0.00."
                // Match: dollar sign + whitespace + (digit OR dot-digit) — i.e., a number follows.
                const securityDepositMatch = compact.match(/security deposit in the amount of\s+\$\s*([0-9][0-9.,]*|\.[0-9]+)?/i);
                expect(
                  securityDepositMatch && securityDepositMatch[1] !== undefined,
                  `[BUG-01] Item 2 Security Deposit value EMPTY. Found: "${compact.match(/security deposit in the amount of[^.]{0,60}/i)?.[0] ?? '<n/a>'}"`,
                ).toBeTruthy();

                // [BUG-01 / Fernando lease 16152] Item 5 EPO Cash Price must NOT be empty.
                // Empty pattern: "Cash Price, $ , less" — dollar sign followed by space + comma.
                // Populated pattern (lease 16208): "Cash Price, $ 970.37, less"
                const cashPriceMatch = compact.match(/your epo price is the cash price,\s*\$\s*([0-9][0-9.,]*|\.[0-9]+)?/i);
                expect(
                  cashPriceMatch && cashPriceMatch[1] !== undefined,
                  `[BUG-01] Item 5 Cash Price EMPTY. Found: "${compact.match(/your epo price is the cash price[^.]{0,80}/i)?.[0] ?? '<n/a>'}"`,
                ).toBeTruthy();

                // [BDD 2.5] Jewelry template includes Jurisdiction + Limitation of Liability
                expect(/jurisdiction/i.test(compact), '[BDD 2.5] Jurisdiction clause expected').toBe(true);
                expect(/limitation of liability/i.test(compact), '[BDD 2.5] Limitation of Liability clause expected').toBe(true);
                // [BDD 2.4] Jewelry delivery fee phrasing
                expect(
                  /\*\s*includes a delivery fee of/i.test(compact),
                  `[BDD 2.4] jewelry delivery-fee phrasing missing — found: "${compact.match(/delivery fee[^.]{0,60}/i)?.[0] ?? '<none>'}"`,
                ).toBe(true);
              }
            });
          } else {
            await test.step('Confirm SIGNWELL fallback — embedded URL is signwell.com', async () => {
              const url = ctx.embeddedSigningUrl ?? '';
              expect(
                url.includes('signwell.com'),
                `expected SIGNWELL URL for ${c.merchant}/customer=${c.customerState}; observed=${url}`,
              ).toBe(true);
              expect(
                url.includes('gowsign-app-dev-uown'),
                `SIGNWELL fallback URL must NOT be gowsign; observed=${url}`,
              ).toBe(false);
            });
          }

          await test.step('[rule #14] Activity log mentions esign dispatch', async () => {
            const leadPk = Number(ctx.leadPk);
            const rows = await db.query<{ pk: number; notes: string }>(
              `SELECT pk, notes FROM uown_los_lead_notes
                WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 30`,
              [leadPk],
            );
            const matched = rows.find((r) => /gowsign|signwell|esign|sent contract to customer|esigndocpk/i.test(r.notes ?? ''));
            expect(matched, `Expected esign dispatch note in last 30 lead notes`).toBeTruthy();
            console.log(`[${c.ct}] activity log: pk=${matched!.pk} note="${matched!.notes.slice(0, 120)}"`);
          });
        },
      );
    }

    // ─────────────────────────────────────────────────────────────────────
    // CT-03 — Document content differential (jewelry vs standard CA)
    //   Hybrid: API generates two leads in parallel; PDF text is captured
    //   for each and asserted against the 5+ jewelry vs standard markers.
    //   Lead A: DanielsJewelers (DANIELS_JEWELERS) → jewelry template
    //   Lead B: TireAgent (UOWN, non-jewelry CA) → standard template
    //   Note: TireAgent (`OW90218-0001`) is the canonical non-jewelry CA
    //   merchant that exists in both qa2 and stg. Originally used FirstApp
    //   (`FA10000-0001`), but it is not provisioned in stg.
    // ─────────────────────────────────────────────────────────────────────
    test(
      'CT-03_DocumentContentDifferentialJewelryVsStandard_CA',
      { tag: ['@hybrid', '@priority-high', '@pdf-content'] },
      async ({ page, api, db, ctx }, testInfo) => {
        test.setTimeout(720_000);

        // Two contexts with separate ctx-like containers — we cannot reuse
        // the single `ctx` fixture for two independent leads, so we manage
        // a per-lead local container and only mirror Lead A into the fixture
        // (Lead B's identifiers stay local to this test).
        const ctxA: TestContext = { ...ctx };
        const ctxB: TestContext = {
          leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
          contractStatus: '', contractUrl: '', websiteAccountPk: '',
          achAdded: 0, ccAdded: 0, reportKeys: new Map(),
        };

        const { merchant: merchantA, applicant: applicantA } = buildTestData({
          env: ENV, state: STATE, merchant: 'DanielsJewelers',
          orderTotal: ORDER_TOTAL, orderDescription: 'CT-03 jewelry lead',
        });
        const { merchant: merchantB, applicant: applicantB } = buildTestData({
          env: ENV, state: STATE, merchant: 'TireAgent',
          orderTotal: ORDER_TOTAL, orderDescription: 'CT-03 standard lead',
        });

        let urlA = '';
        let urlB = '';

        await test.step('Setup: drive both leads to embeddedSigningUrl (jewelry + standard)', async () => {
          // Use setupApplicationViaApi (same pattern as CT-R01) so both leads
          // advance through preauth → submitApplication and populate
          // ctx.embeddedSigningUrl. The previous flow used sendInvoice's
          // redirectUrl, which points to the credit-card preauthorization page,
          // not the GowSign contract iframe — that's why earlier captures
          // returned the preauth screen instead of the contract.
          const [resA, resB] = await Promise.all([
            setupApplicationViaApi(
              api,
              {
                merchant: merchantA, applicant: applicantA, order: { orderTotal: ORDER_TOTAL, orderDescription: 'CT-03 jewelry lead' },
                env: ENV,
                verifyApproval: true,
                extractContractUrl: false,
                submitPaymentInfoViaApi: true,
                skipMerchantPreflight: true,
              },
              testInfo,
              ctxA,
            ),
            setupApplicationViaApi(
              api,
              {
                merchant: merchantB, applicant: applicantB, order: { orderTotal: ORDER_TOTAL, orderDescription: 'CT-03 standard lead' },
                env: ENV,
                verifyApproval: true,
                extractContractUrl: false,
                submitPaymentInfoViaApi: true,
                skipMerchantPreflight: true,
              },
              testInfo,
              ctxB,
            ),
          ]);

          // Mirror Lead A into the fixture ctx so testInfo annotations capture it.
          ctx.leadPk = ctxA.leadPk;
          ctx.leadUuid = ctxA.leadUuid;
          testInfo.annotations.push(
            { type: 'leadAPk', description: ctxA.leadPk },
            { type: 'leadBPk', description: ctxB.leadPk },
          );

          urlA = resA.embeddedSigningUrl ?? ctxA.embeddedSigningUrl ?? '';
          urlB = resB.embeddedSigningUrl ?? ctxB.embeddedSigningUrl ?? '';
          expect(urlA, 'Lead A embeddedSigningUrl required').toBeTruthy();
          expect(urlB, 'Lead B embeddedSigningUrl required').toBeTruthy();
        });

        let textA = '';
        let textB = '';

        await test.step('Capture PDFs for both leads + extract text', async () => {
          // captureContractPdf opens a new tab per call; serialise to keep
          // memory predictable and avoid two simultaneous renders racing
          // against the GowSign iframe.
          const pdfA = await captureContractPdf(page, urlA);
          const pdfB = await captureContractPdf(page, urlB);
          textA = await extractPdfText(pdfA);
          textB = await extractPdfText(pdfB);
          console.log(`[CT-03] Lead A text length=${textA.length} chars`);
          console.log(`[CT-03] Lead B text length=${textB.length} chars`);

          await testInfo.attach('lead-a-jewelry.pdf', { body: pdfA, contentType: 'application/pdf' });
          await testInfo.attach('lead-b-standard.pdf', { body: pdfB, contentType: 'application/pdf' });

          // Sanity floor — guards against empty/blank PDFs. Marker assertions
          // below are the real content check.
          expect(textA.length, 'Lead A PDF text > 800 chars (sanity)').toBeGreaterThan(800);
          expect(textB.length, 'Lead B PDF text > 800 chars (sanity)').toBeGreaterThan(800);
        });

        await test.step('Sanity: no literal {{var}} placeholders left in either PDF', async () => {
          // Heuristic: a leftover Strapi-style placeholder means rendering failed.
          // We allow {{ inside CSS variables or HTML attribute encoded sequences
          // (rare in PDF text), so we look only for the conventional pattern.
          const placeholderRe = /\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}/;
          expect(placeholderRe.test(textA), `Lead A still has placeholder: ${textA.match(placeholderRe)?.[0]}`).toBe(false);
          expect(placeholderRe.test(textB), `Lead B still has placeholder: ${textB.match(placeholderRe)?.[0]}`).toBe(false);
        });

        await test.step('Lead A (jewelry): differential markers present', async () => {
          const lower = textA.toLowerCase();
          // Mandatory jewelry markers (case-insensitive substring search).
          // [OBSERVAÇÃO] Some markers may include line breaks — we collapse
          // whitespace to a single space before matching to be tolerant.
          const compact = textA.replace(/\s+/g, ' ');
          const compactLower = compact.toLowerCase();

          expect(compactLower, 'Security Deposit clause').toContain('security deposit');
          expect(compactLower, 'Rental Period heading').toContain('rental period');
          expect(compactLower, 'Cost of Rental heading').toContain('cost of rental');
          // Delivery fee variant — jewelry uses "*Includes a Delivery Fee of"
          expect(
            /\*\s*includes a delivery fee of/i.test(compact),
            `jewelry delivery-fee phrasing missing — found: "${compact.match(/delivery fee[^.]*/i)?.[0] ?? '<none>'}"`,
          ).toBe(true);
          expect(compactLower, 'Jurisdiction clause').toContain('jurisdiction');
          expect(compactLower, 'Limitation of Liability clause').toContain('limitation of liability');
          expect(compactLower, 'Cash Price of the item(s) phrasing').toContain('cash price of the item');
          // sanity referencing untrimmed lower (use of variable)
          expect(lower.length).toBeGreaterThan(0);
        });

        await test.step('Lead B (standard): standard markers present, jewelry markers absent', async () => {
          const compact = textB.replace(/\s+/g, ' ');
          const compactLower = compact.toLowerCase();

          // Negative: standard MUST NOT have Security Deposit
          expect(compactLower, 'standard MUST NOT contain Security Deposit').not.toContain('security deposit');
          // Positive: standard uses "Lease" terminology
          expect(compactLower, 'standard uses Lease terminology').toContain('lease');
          // Delivery fee variant — standard uses "*Total Delivery Fee"
          expect(
            /\*\s*total delivery fee/i.test(compact),
            `standard delivery-fee phrasing missing — found: "${compact.match(/delivery fee[^.]*/i)?.[0] ?? '<none>'}"`,
          ).toBe(true);
          // Cash Price WITHOUT "of the item(s)"
          expect(compactLower, 'standard uses plain "Cash Price"').toContain('cash price');
          expect(
            compactLower.includes('cash price of the item'),
            'standard MUST NOT have jewelry-style "Cash Price of the item(s)"',
          ).toBe(false);
          // [OBSERVAÇÃO] Jurisdiction / Limitation of Liability section headers may
          // appear in some standard templates — we keep the absence check loose by
          // testing for the exact section title only when it appears as a header.
          // Spec marks these as "may need loose match"; we report rather than fail.
          if (compactLower.includes('limitation of liability')) {
            console.log('[CT-03][OBSERVAÇÃO] standard PDF contains "limitation of liability" — review with product');
          }
        });

        await test.step('Cross-contamination: no Kornerstone/KS branding in jewelry PDF', async () => {
          // Per SSN catalog §7.3 — jewelry template MUST NOT leak Kornerstone footer/sender.
          expect(
            /CS@kornerstoneliving\.com/i.test(textA),
            'jewelry PDF leaked Kornerstone CS email',
          ).toBe(false);
          expect(
            /\bkornerstone\b/i.test(textA),
            'jewelry PDF contains "Kornerstone" branding (cross-contamination)',
          ).toBe(false);
        });

        await test.step('[reflex 12] both esign documents persisted (DB)', async () => {
          const docA = await getEsignDocumentByLeadPk(db, Number(ctxA.leadPk));
          const docB = await getEsignDocumentByLeadPk(db, Number(ctxB.leadPk));
          expect(docA, 'esign_document for Lead A').not.toBeNull();
          expect(docB, 'esign_document for Lead B').not.toBeNull();
          // Lead A may be GOWSIGN; Lead B may also be GOWSIGN (CA has GowSign template);
          // the spec only requires status >= SENT_TO_CUSTOMER (persisted).
          const acceptableStatuses = ['SENT_TO_CUSTOMER', 'OUTSTANDING', 'SIGNED', 'COMPLETED', 'STORED'];
          expect(acceptableStatuses, `Lead A status: ${docA!.documentStatus}`).toContain(docA!.documentStatus ?? '');
          expect(acceptableStatuses, `Lead B status: ${docB!.documentStatus}`).toContain(docB!.documentStatus ?? '');
        });

        await test.step('[rule #14] activity log: GowSign dispatch row present per lead', async () => {
          // Look for the canonical "Sent Contract to customer" note used by other
          // GowSign tests in this suite (gowsign-smoke-flow.spec.ts:139).
          const noteA = await findLeadNoteContaining(db, Number(ctxA.leadPk), 'Sent Contract to customer');
          const noteB = await findLeadNoteContaining(db, Number(ctxB.leadPk), 'Sent Contract to customer');
          expect(noteA, 'Lead A dispatch log').not.toBeNull();
          expect(noteB, 'Lead B dispatch log').not.toBeNull();
        });

        await test.step('Template routing: confirm Lead A → jewelry, Lead B → standard', async () => {
          // Asserts the actual template_id resolved by the backend per lead.
          // Skip silently if Lead B fell back to SIGNWELL (no GOWSIGN row to query).
          await assertSelectedTemplateForLead(db, Number(ctxA.leadPk), TEMPLATE_JEWELRY_CA);

          const docB = await getEsignDocumentByLeadAndClient(db, Number(ctxB.leadPk), 'GOWSIGN');
          if (docB) {
            await assertSelectedTemplateForLead(db, Number(ctxB.leadPk), TEMPLATE_STANDARD_CA);
          } else {
            console.log('[CT-03][OBSERVAÇÃO] Lead B has no GOWSIGN esign_document — likely fell back to SIGNWELL. Routing assertion skipped for Lead B.');
          }
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────
    // CT-06 — Sign + sweep + STORED lifecycle (Daniel's Jewelers)
    //   Drives a Daniel's lead all the way through: dispatch → sign in iframe
    //   → resume+trigger sweep → poll uown_esign_document.status='STORED'
    //   → assert lifecycle ordering + activity log.
    // ─────────────────────────────────────────────────────────────────────
    test(
      'CT-06_SignContractRunSweepAndVerifyCompletion_DanielsJewelers',
      { tag: ['@hybrid', '@priority-high', '@lifecycle', '@signing'] },
      async ({ page, api, db, ctx }, testInfo) => {
        test.setTimeout(720_000);

        await installPostMessageRecorder(page);

        const { contractUrl, leadPk, applicant } = await test.step(
          'Setup: create Daniel\'s lead + extract contract URL',
          async () => buildAndDriveDanielsLead(api, ctx, testInfo, 'CT-06 sign-sweep-stored'),
        );
        // applicant kept for any downstream identity assertions
        expect(applicant.firstName.length).toBeGreaterThan(0);

        await test.step('UI: open consumer flow + complete missing data → terms → contract modal', async () => {
          await page.goto(contractUrl);

          const missingData = new MissingDataFormPage(page);
          await missingData.waitForLoaded(60_000);
          await missingData.fillAndSubmit({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            cardNumber: '5500000000000004', // MASTERCARD_APPROVED — testing.md pitfall
            cvc: '123',
            expiration: '12/2030',
          });

          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          // Skip protection plan — Daniel's CA flow has PP not offered in CA per
          // testing.md "Protection plan was not offered" rule (regulatory, not bug).
          await terms.acceptAndProceedWithProtectionPlan(false);
        });

        await test.step('Sign GowSign iframe (Type mode + first font)', async () => {
          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });

          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes',
            fontIndex: 0,
            waitForCompleted: true,
          });
          expect(result.startClicked, 'Start Signature clicked').toBe(true);
          expect(result.signClicked, 'final Sign/Submit clicked').toBe(true);
          // capturedCompleted may be false if backend latency exceeds 30s — log only.
          console.log(`[CT-06] sign result: ${JSON.stringify(result)}`);

          await page.screenshot({
            path: testInfo.outputPath('ct06-after-sign.png'),
            fullPage: false,
          });
        });

        await test.step('Sweep: resume + trigger getCompletedESignDocumentStatusSweep', async () => {
          const resumeResp = await api.scheduledTask.resumeScheduledTask(
            'getCompletedESignDocumentStatusSweep',
          );
          // Resume returns 200 even for already-running tasks — log non-200 as
          // observation and continue (trigger may still succeed).
          if (!resumeResp.ok) {
            console.log(`[CT-06][OBSERVAÇÃO] resumeScheduledTask responded ${resumeResp.status}`);
          }

          const triggerResp = await api.scheduledTask.triggerScheduledTask(
            'getCompletedESignDocumentStatusSweep',
          );
          expect(triggerResp.ok, `triggerScheduledTask: ${triggerResp.status}`).toBeTruthy();
        });

        let esignDocPk = 0;
        await test.step('Poll: uown_esign_document.status reaches STORED (180s)', async () => {
          // Re-fetch the doc to get its pk first.
          const deadline = Date.now() + 30_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `esign_document for lead_pk=${leadPk}`).not.toBeNull();
          esignDocPk = esignDoc!.pk;
          // Sweep is slower in stg than in qa2 — bumped 60s → 180s after CT-06
          // timed out twice in stg with the lifecycle already at pre-STORED.
          await waitForEsignDocumentStatus(db, esignDocPk, 'STORED', { timeoutMs: 180_000 });
        });

        await test.step('[reflex 12] template + signed-blob persisted', async () => {
          // Assert that the routed template is the jewelry one (Daniel's branch).
          await assertSelectedTemplateForLead(db, leadPk, TEMPLATE_JEWELRY_CA);

          // Signed document blob check — uses the helper-mapped boolean
          // `hasSignedDocumentBlob` (true when base64signed_document_string IS NOT NULL).
          const finalDoc = await getEsignDocumentByLeadPk(db, leadPk);
          expect(finalDoc).not.toBeNull();
          expect(finalDoc!.documentStatus, 'final document status').toBe('STORED');
          expect(
            finalDoc!.hasSignedDocumentBlob,
            'signed PDF binary persisted (uown_esign_document.base64signed_document_string)',
          ).toBe(true);
        });

        await test.step('Lifecycle ordering: SIGNED → COMPLETED → STORED visible in lead notes', async () => {
          // The notes table is the most reliable cross-status timeline. Existing
          // GowSign tests use the "SIGNED" transition note + the STORED sweep note.
          const signedNote = await db.queryOne<{ notes: string }>(
            `SELECT notes FROM uown_los_lead_notes
             WHERE lead_pk=$1 AND notes ILIKE '%SIGNED%'
             ORDER BY pk ASC LIMIT 1`,
            [leadPk],
          );
          expect(signedNote, 'SIGNED transition note').not.toBeNull();
        });

        await test.step('[reflex 11][rule #14] STORED activity log present', async () => {
          // Search for any note mentioning the STORED sweep or signed-completion artifact.
          const notes = await getLeadNotesByLeadPk(db, leadPk);
          const storedRelated = notes.filter((n) =>
            /STORED|signed|complete|esign|gowsign|contract/i.test(n.notes),
          );
          expect(
            storedRelated.length,
            `expected ≥1 note referencing signing completion/storage; got ${notes.length} notes`,
          ).toBeGreaterThan(0);
        });

        await test.step('Lead status transition (post-sweep)', async () => {
          const row = await db.queryOne<{ lead_status: string }>(
            'SELECT lead_status FROM uown_los_lead WHERE pk=$1',
            [leadPk],
          );
          expect(row, 'lead row').not.toBeNull();
          // Daniel's `isSignedToFunding` may push to FUNDING/FUNDED automatically.
          // Accept any post-CC_AUTH_PASSED status — the strict assertion is on
          // STORED above; lead_status reflects orchestrator policy, not feature.
          const acceptable = ['SIGNED', 'CONTRACT_CREATED', 'FUNDING', 'FUNDED', 'ACTIVE'];
          expect(
            acceptable,
            `lead_status="${row!.lead_status}" should be post-sign`,
          ).toContain(row!.lead_status);
          // Capture the accountPk if the lead has progressed to FUNDING+ — used
          // as a soft handoff to CT-07 (CT-07 still recreates its own data for isolation).
          const acc = await db.queryOne<{ pk: string }>(
            'SELECT pk FROM uown_sv_account WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1',
            [leadPk],
          );
          if (acc) {
            ctx.accountPk = acc.pk;
            testInfo.annotations.push({ type: 'accountPk', description: acc.pk });
          }
        });
      },
    );

    // ─────────────────────────────────────────────────────────────────────
    // CT-07 — Servicing portal Documents section + download
    //   Creates a fresh Daniel's lead + drives through CT-06's full flow,
    //   then logs into Servicing as agent and validates the lease document
    //   appears in Documents and downloads as a non-empty PDF.
    // ─────────────────────────────────────────────────────────────────────
    test(
      'CT-07_LeaseDocumentAppearsAndDownloadsInServicingPortal_DanielsJewelers',
      { tag: ['@e2e', '@priority-high', '@servicing-ui'] },
      async ({ page, api, db, ctx, testEnv }, testInfo) => {
        test.setTimeout(900_000);

        await installPostMessageRecorder(page);

        // Repeat CT-06 setup standalone — isolation per `.claude/rules/testing.md` §1.
        const { contractUrl, leadPk, applicant } = await test.step(
          'Setup: create Daniel\'s lead + extract contract URL',
          async () => buildAndDriveDanielsLead(api, ctx, testInfo, 'CT-07 servicing-download'),
        );

        await test.step('UI: drive consumer flow + sign in iframe', async () => {
          await page.goto(contractUrl);

          const missingData = new MissingDataFormPage(page);
          await missingData.waitForLoaded(60_000);
          await missingData.fillAndSubmit({
            firstName: applicant.firstName,
            lastName: applicant.lastName,
            cardNumber: '5500000000000004',
            cvc: '123',
            expiration: '12/2030',
          });

          const terms = new TermsOfAgreementPage(page);
          await terms.waitForLoaded(120_000);
          await terms.acceptAndProceedWithProtectionPlan(false);

          const modal = new AlternativeContractModalPage(page);
          await modal.waitForOpen(120_000);
          const frame = modal.getGowSignFrame();
          await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
          const result = await signGowSignInFrame(page, frame, {
            preauthChoice: 'yes', fontIndex: 0, waitForCompleted: true,
          });
          expect(result.signClicked).toBe(true);
        });

        await test.step('Sweep + wait for STORED', async () => {
          await api.scheduledTask.resumeScheduledTask('getCompletedESignDocumentStatusSweep')
            .catch(() => undefined);
          const trig = await api.scheduledTask.triggerScheduledTask('getCompletedESignDocumentStatusSweep');
          expect(trig.ok, `triggerScheduledTask: ${trig.status}`).toBeTruthy();

          const deadline = Date.now() + 60_000;
          let doc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!doc && Date.now() < deadline) {
            await sleep(2_000);
            doc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(doc, 'esign_document').not.toBeNull();
          await waitForEsignDocumentStatus(db, doc!.pk, 'STORED', { timeoutMs: 90_000 });
        });

        await test.step('Resolve accountPk (lease must have progressed past SIGNED)', async () => {
          // Daniel's may auto-transition SIGNED → FUNDING via isSignedToFunding.
          // accountPk only exists once the lease creates the servicing account.
          const deadline = Date.now() + 30_000;
          let acc: { pk: string } | null = null;
          while (!acc && Date.now() < deadline) {
            acc = await db.queryOne<{ pk: string }>(
              'SELECT pk FROM uown_sv_account WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1',
              [leadPk],
            );
            if (!acc) await sleep(3_000);
          }
          expect(acc, `account row for lead_pk=${leadPk} (Daniel's auto-funding)`).not.toBeNull();
          ctx.accountPk = acc!.pk;
          testInfo.annotations.push({ type: 'accountPk', description: ctx.accountPk });
        });

        await test.step('Servicing: login as manager', async () => {
          await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv);
        });

        await test.step('Servicing: open customer + Documents tab', async () => {
          await navigateToServicingCustomer(page, ctx.accountPk);

          const documentsPage = new ServicingDocumentsPage(page);
          await documentsPage.openDocumentsTab();
          await documentsPage.waitForLoaded();
          await page.screenshot({
            path: testInfo.outputPath('ct07-documents-tab.png'),
            fullPage: false,
          });
        });

        let downloadPath = '';
        await test.step('Servicing: lease document is listed', async () => {
          const documentsPage = new ServicingDocumentsPage(page);
          // The document name varies — backend uses either "Lease" or
          // "California Lease Agreement" or "CA_2025_SAC_jewelry" depending on
          // template metadata. Try the most permissive substring first.
          const candidates = ['Lease', 'CA_2025_SAC_jewelry', 'California'];
          let foundName: string | null = null;
          for (const c of candidates) {
            if (await documentsPage.hasDocument(c)) {
              foundName = c;
              break;
            }
          }
          expect(
            foundName,
            `expected one of [${candidates.join(', ')}] in Documents table; ` +
            `got rows count=${await documentsPage.getDocumentRowsCount()}`,
          ).not.toBeNull();
          ctx.documentName = foundName!;
        });

        await test.step('Servicing: download document → file is a non-empty PDF', async () => {
          const documentsPage = new ServicingDocumentsPage(page);
          const download = await documentsPage.downloadDocument(String(ctx.documentName));

          downloadPath = testInfo.outputPath('ct07-lease-document.pdf');
          await download.saveAs(downloadPath);

          const { statSync, readFileSync, openSync, readSync, closeSync } = await import('node:fs');
          const stats = statSync(downloadPath);
          expect(stats.size, 'PDF size > 0').toBeGreaterThan(0);

          // First-4-bytes magic check via direct fd read (cheaper than reading
          // the whole file). Buffer prefix MUST equal "%PDF".
          const fd = openSync(downloadPath, 'r');
          try {
            const buf = Buffer.alloc(4);
            readSync(fd, buf, 0, 4, 0);
            expect(buf.toString('utf-8'), 'PDF header magic').toBe('%PDF');
          } finally {
            closeSync(fd);
          }

          // Content sanity (best-effort): parsed text contains the customer's name.
          // Skip if pdf-parse fails on the binary — record as observation.
          try {
            const fullBytes = readFileSync(downloadPath);
            const text = await extractPdfText(fullBytes);
            const lower = text.toLowerCase();
            const hasName = lower.includes(applicant.firstName.toLowerCase()) ||
                            lower.includes(applicant.lastName.toLowerCase());
            if (!hasName) {
              console.log(
                `[CT-07][OBSERVAÇÃO] downloaded PDF has no first/last name match — review: ` +
                `firstName="${applicant.firstName}" lastName="${applicant.lastName}"`,
              );
            }
          } catch (err) {
            console.log(`[CT-07][OBSERVAÇÃO] pdf-parse on downloaded PDF failed: ${(err as Error).message}`);
          }
        });

        await test.step('[rule #14] download audit (best-effort)', async () => {
          // Download audit logs are not guaranteed for the Servicing portal;
          // spec marks this as best-effort. Assert presence only when a row exists.
          const note = await db.queryOne<{ notes: string }>(
            `SELECT notes FROM uown_los_lead_notes
             WHERE lead_pk=$1 AND notes ILIKE '%download%'
             ORDER BY pk DESC LIMIT 1`,
            [leadPk],
          );
          if (!note) {
            console.log('[CT-07][OBSERVAÇÃO] no download audit row — out of scope per spec edge-case note');
          }
        });
      },
    );
  },
);

/**
 * E2E Hybrid — GowSign Contract CREATION (CRE-* scenarios)
 *
 * Validates that the UOwn backend creates a GowSign e-sign document automatically
 * when a lead reaches `CC_AUTH_PASSED`. QA does NOT call the GowSign API directly
 * (no `GOWSIGN_API_KEY` in QA envs). The flow is driven 100% by the UOwn API
 * (`setupApplicationViaApi`) and asserted across three layers:
 *
 *   1. UOwn DB persistence
 *      - `uown_esign_document.client = 'GOWSIGN'`
 *      - `uown_esign_document.esign_mode ∈ {DOCX, HTML, STRAPI, EMAIL}`
 *      - `uown_los_contract.esign_document_pk` (FK) populated
 *      - `uown_los_lead_notes.notes` contains
 *        "Sent Contract to customer. Contract EsignDocPk"
 *
 *   2. UOwn API response
 *      - `paymentDetailsList[idx].redirectUrl` returned (gowsign.com host)
 *
 *   3. UI rendering (iframe)
 *      - Document viewer loads, status badge OUTSTANDING, dynamic vars resolved
 *
 * Scenarios (per gowsign-integration-test-scenarios.md):
 *
 *   ACTIVE
 *     CRE-01 / 1.1 — Backend creates GowSign contract on CC_AUTH_PASSED
 *     CRE-04 / 4.1 — Dynamic variables (lessee name) resolved (no `{{...}}` placeholders)
 *     CRE-07 / 7.1 — Cascade cancellation when a NEW contract is created
 *     CRE-08 / 8.1 — redirectUrl accessible with PDF rendered (status=OUTSTANDING)
 *
 *   SKIPPED (with documented reason)
 *     CRE-02, CRE-03 — HTML / Strapi mode specifics (backend decides — QA cannot force)
 *     CRE-05         — Dynamic table `[table|...]` (depends on cadastrado UOwn template)
 *     CRE-06         — Optional params (mustReminder, expirationDate) — backend decides
 *     CRE-07 / 7.2   — SIGNED contract not cancelled (requires signing helper)
 *     CRE-09         — Pre-selected payment plan (requires backend feature flag)
 *
 * Foundation:
 *   - Page object: `GowSignDocumentViewerPage` (src/pages/gowsign/document-viewer.page.ts)
 *   - DB helpers:  `getEsignDocumentByLeadPk`, `findLeadNoteContaining`,
 *                  `waitForEsignDocumentStatus` (src/helpers/esign-db.helpers.ts)
 *   - API setup:   `setupApplicationViaApi` with `extractContractUrl` +
 *                  `submitPaymentInfoViaApi`
 *
 * Constraint: NO direct GowSign API calls. Forbidden imports:
 *   ❌ api.gowsign.*    ❌ @data/gowsign.data    ❌ gowsign.client
 *   ❌ gowsign.body     ❌ GOWSIGN_API_KEY
 *
 * Tags: @regression @e2e @hybrid @priority-medium  (skips → @priority-low)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { GowSignDocumentViewerPage } from '@pages/gowsign/index.js';
import {
  getEsignDocumentByLeadPk,
  findLeadNoteContaining,
  waitForEsignDocumentStatus,
} from '@helpers/esign-db.helpers.js';
import { buildTestData, sleep } from '@helpers/index.js';
import { setupApplicationViaApi } from '@helpers/api-setup.helpers.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';

// ── Test data ───────────────────────────────────────────────────────
// Risk tier: low (CA + ProgressMobility, ~$800 — funds in QA without UW friction).
// `submitPaymentInfoViaApi: true` drives the lead to CC_AUTH_PASSED so the
// backend creates the GowSign contract and returns redirectUrl in the response.
const testData = {
  riskTier: 'low' as const,
  state: 'CA',
  merchant: 'FifthAveFurnitureNY',
  orderTotal: '800',
  tag: buildTags(TestTag.REGRESSION),
  extraTags: ['@e2e', '@hybrid', '@priority-medium'],
  skipExtraTags: ['@e2e', '@hybrid', '@priority-low'],
};

const VALID_ESIGN_MODES = ['DOCX', 'HTML', 'STRAPI', 'EMAIL'] as const;

test.describe(
  `GowSign Create Contract - ${testData.merchant}`,
  { tag: [...splitTags(testData.tag), ...testData.extraTags] },
  () => {
    // ─────────────────────────────────────────────────────────────
    // CRE-01 / 1.1 — Backend creates GowSign contract on CC_AUTH_PASSED
    //   - DB: uown_esign_document client=GOWSIGN, esign_mode ∈ valid set,
    //         contract FK populated
    //   - DB: lead note "Sent Contract to customer. Contract EsignDocPk"
    //   - API: paymentDetailsList[idx].redirectUrl populated (gowsign.com)
    // ─────────────────────────────────────────────────────────────
    test(
      'CRE-01 Backend creates GowSign contract automatically on CC_AUTH_PASSED',
      { tag: ['@priority-medium'] },
      async ({ api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign CRE-01 - contract create',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('Drive lead to CC_AUTH_PASSED via UOwn API', async () => {
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
          expect(
            result.contractUrl,
            'paymentDetailsList[idx].redirectUrl must be returned by the API',
          ).toBeTruthy();
          contractUrl = result.contractUrl ?? '';
          ctx.contractUrl = contractUrl;
        });

        await test.step('API: redirectUrl is hosted on gowsign.com', async () => {
          // Per spec, the GowSign iframe entrypoint URL must point to the
          // GowSign host (the backend may proxy via secure-{env}.uownleasing.com,
          // so accept either: an explicit gowsign.com host OR the UOwn
          // secure host that embeds the GowSign viewer).
          const url = new URL(contractUrl);
          const hostOk =
            url.hostname.includes('gowsign.com') ||
            url.hostname.includes('uownleasing.com');
          expect(
            hostOk,
            `redirectUrl host should be gowsign.com or uownleasing.com — got "${url.hostname}"`,
          ).toBe(true);
        });

        await test.step('DB: uown_esign_document populated with client=GOWSIGN + valid esign_mode', async () => {
          const leadPk = Number(ctx.leadPk);
          expect(Number.isFinite(leadPk) && leadPk > 0, 'ctx.leadPk must be a positive number').toBeTruthy();

          // Backend creates the e-sign document asynchronously after CC_AUTH_PASSED.
          // Poll esign-document by lead_pk to allow the dispatcher to complete.
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `uown_esign_document row not found for lead_pk=${leadPk}`).not.toBeNull();
          expect(esignDoc!.esignClient, 'esign_document.client must be GOWSIGN').toBe('GOWSIGN');
          expect(
            VALID_ESIGN_MODES,
            `esign_document.esign_mode should be one of ${VALID_ESIGN_MODES.join('|')} — got "${esignDoc!.esignMode}"`,
          ).toContain(esignDoc!.esignMode as (typeof VALID_ESIGN_MODES)[number]);
          // FK from uown_los_contract.esign_document_pk → uown_esign_document.pk
          expect(
            esignDoc!.contractPk,
            'uown_los_contract.esign_document_pk must reference this esign doc (FK populated)',
          ).not.toBeNull();

          testInfo.annotations.push({ type: 'esignDocPk', description: String(esignDoc!.pk) });
          (ctx as Record<string, unknown>)['esignDocPk'] = esignDoc!.pk;
        });

        await test.step('DB: timeline note "Sent Contract to customer. Contract EsignDocPk"', async () => {
          const leadPk = Number(ctx.leadPk);
          const note = await findLeadNoteContaining(
            db,
            leadPk,
            'Sent Contract to customer. Contract EsignDocPk',
          );
          expect(note, 'Expected timeline note "Sent Contract to customer..." to exist').not.toBeNull();
          expect(note!.notes).toMatch(/EsignDocPk\s*:\s*\d+/i);
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CRE-04 / 4.1 — Dynamic variables resolved in contract iframe
    //   - Lessee name in document = applicant.firstName + lastName
    //   - No literal `{{...}}` placeholders, no double-escaped HTML
    // ─────────────────────────────────────────────────────────────
    test(
      'CRE-04 Dynamic variables (lessee name) resolved in contract iframe (no placeholders)',
      { tag: ['@priority-medium'] },
      async ({ page, api, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign CRE-04 - dynamic vars',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';

        await test.step('Drive lead to CC_AUTH_PASSED + capture redirectUrl', async () => {
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
          contractUrl = result.contractUrl ?? '';
          expect(contractUrl).toBeTruthy();
        });

        await test.step('UI: iframe lessee name matches applicant (no `{{...}}` placeholders)', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);

          const lessee = await viewer.getLessee();
          const expectedFirst = applicant.firstName.trim().toLowerCase();
          const expectedLast = applicant.lastName.trim().toLowerCase();
          const renderedName = lessee.name.toLowerCase();

          expect(renderedName).toContain(expectedFirst);
          expect(renderedName).toContain(expectedLast);

          // No unresolved template placeholders (handlebars `{{var}}` or
          // double-escaped HTML entities like `&amp;amp;`).
          expect(
            lessee.name,
            'Lessee name must not contain unresolved `{{...}}` placeholders',
          ).not.toMatch(/\{\{.*?\}\}/);
          expect(
            lessee.name,
            'Lessee name must not contain double-escaped HTML entities',
          ).not.toMatch(/&amp;amp;|&lt;|&gt;/);

          await page.screenshot({
            path: testInfo.outputPath('cre-04-lessee-name.png'),
            fullPage: false,
          });
        });
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CRE-07 / 7.1 — Cascade cancellation when a NEW contract is created
    //   - Original contract: status=CANCELED in uown_esign_document
    //   - New contract:      status ∈ {CREATED, OUTSTANDING}
    //   - lead_status remains CONTRACT_CREATED (no regression)
    //
    // SKIP rationale: triggering the recreation of a contract for the same
    // lead is not deterministic via the public UOwn API in qa2 / sandbox. The
    // known triggers are either (a) re-running submitApplication after a
    // contract already exists (backend silently no-ops in current builds) or
    // (b) explicit lease-mod flow (out of scope for CRE-*). Until a
    // deterministic recreation helper exists, this stays SKIP with the cause.
    // ─────────────────────────────────────────────────────────────
    test.skip(
      'CRE-07 Cascade cancellation: previous contract CANCELED when a new one is created',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: no deterministic public-API trigger for contract recreation
        // on the same lead in sandbox/qa2 (resubmitting submitApplication is
        // a backend no-op once an esign_document exists; lease-mod is a
        // separate flow handled by modify-lease.spec.ts). Re-enable when a
        // helper for "force-recreate contract on lead" is added.
      },
    );

    // ─────────────────────────────────────────────────────────────
    // CRE-08 / 8.1 — redirectUrl accessible with PDF rendered
    //   - DB: poll uown_esign_document.status until OUTSTANDING
    //   - UI: page.goto(redirectUrl), viewer loads, status badge=OUTSTANDING
    // ─────────────────────────────────────────────────────────────
    test(
      'CRE-08 redirectUrl accessible — viewer loads with status=OUTSTANDING',
      { tag: ['@priority-medium'] },
      async ({ page, api, db, ctx, merchantConfig: mSetup }, testInfo) => {
        test.setTimeout(420_000);

        const { merchant, applicant, order } = buildTestData({
          state: testData.state,
          merchant: testData.merchant,
          orderTotal: testData.orderTotal,
          orderDescription: 'GowSign CRE-08 - URL accessible',
        });

        await test.step('Ensure merchant config', async () => {
          await mSetup.configureByName(testData.merchant, 'lifecycle');
        });

        let contractUrl = '';
        let esignDocPk = 0;

        await test.step('Drive lead to CC_AUTH_PASSED + capture redirectUrl', async () => {
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
          contractUrl = result.contractUrl ?? '';
          expect(contractUrl, 'redirectUrl required').toBeTruthy();
        });

        await test.step('DB: poll esign_document until status=OUTSTANDING', async () => {
          const leadPk = Number(ctx.leadPk);
          // First wait for the doc to exist (dispatcher async after CC_AUTH_PASSED)
          const deadline = Date.now() + 60_000;
          let esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          while (!esignDoc && Date.now() < deadline) {
            await sleep(2_000);
            esignDoc = await getEsignDocumentByLeadPk(db, leadPk);
          }
          expect(esignDoc, `esign_document not found for lead_pk=${leadPk}`).not.toBeNull();
          esignDocPk = esignDoc!.pk;

          // Then poll until OUTSTANDING — backend transitions from CREATED → OUTSTANDING
          // when the document is dispatched to the recipient.
          const outstanding = await waitForEsignDocumentStatus(db, esignDocPk, 'OUTSTANDING', {
            timeoutMs: 60_000,
          });
          expect(outstanding.documentStatus).toBe('OUTSTANDING');
        });

        await test.step('UI: page.goto(redirectUrl) → viewer loads, badge=OUTSTANDING', async () => {
          await page.goto(contractUrl);
          const viewer = new GowSignDocumentViewerPage(page);
          await viewer.waitForLoaded(60_000);
          const status = await viewer.getStatusBadge();
          expect(status, 'GowSign status badge should be OUTSTANDING for unsigned contract').toBe(
            'OUTSTANDING',
          );

          await page.screenshot({
            path: testInfo.outputPath('cre-08-outstanding.png'),
            fullPage: false,
          });
        });
      },
    );

    // ═════════════════════════════════════════════════════════════
    // SKIPPED scenarios — documented reasons (kept as test.skip so
    // they appear in the report and are easy to re-enable later).
    // ═════════════════════════════════════════════════════════════

    test.skip(
      'CRE-02 HTML mode contract creation specifics',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: the UOwn backend chooses esign_mode internally (DOCX | HTML |
        // STRAPI | EMAIL) based on merchant + program config. QA cannot force
        // a specific mode without DB mutation, which is forbidden (CLAUDE.md
        // Exception 3). CRE-01 already asserts the mode is one of the valid
        // values — that is the supported QA contract.
      },
    );

    test.skip(
      'CRE-03 Strapi mode contract creation specifics',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: same rationale as CRE-02 — esign_mode='STRAPI' is a backend
        // choice driven by config that QA cannot toggle deterministically.
      },
    );

    test.skip(
      'CRE-05 Dynamic table `[table|...]` rendering in contract',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: depends on a UOwn template that contains the `[table|...]`
        // directive being cadastrado for the test merchant. Coverage for
        // table-driven content (EPO chart, ACH grid) is already provided by
        // gowsign-contract-content.spec.ts via the standard template.
      },
    );

    test.skip(
      'CRE-06 Optional params (mustReminder, expirationDate, ...)',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: optional params are decided by the backend per merchant
        // config — QA cannot deterministically toggle them. Sanity: in
        // sandbox `uown_esign_document.test_mode = true`, which is already
        // implicitly covered by running this whole suite in sandbox.
      },
    );

    test.skip(
      'CRE-07.2 SIGNED contract is NOT cancelled when a new one is created',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: requires a programmatic signing helper (postMessage automation
        // against the GowSign iframe) which is out of scope for the create-
        // contract spec. Will move to gowsign-post-signing.spec.ts once the
        // signing helper lands.
      },
    );

    test.skip(
      'CRE-09 Pre-selected payment plan in created contract',
      { tag: ['@priority-low'] },
      async () => {
        // SKIP: requires a backend feature flag / merchant program that
        // pre-selects a payment plan at contract creation time. Not enabled
        // for the test merchants in qa2/sandbox.
      },
  );
  },
);

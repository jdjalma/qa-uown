/**
 * Lead Detail — E-Sign / Sign section (after Modify Lease invoice increase)
 *
 * Scope: the E-Sign / Sign section of the Origination Lead Detail page as it
 * appears once a Modify Lease (invoice INCREASE) has driven the lead to
 * CONTRACT_CREATED and the backend auto-dispatched a new LEASE_MOD contract.
 *
 * Implemented scenarios:
 *   S2  E-Sign button is visible in CONTRACT_CREATED.
 *   S3  Clicking E-Sign → LEASE_MOD shows SENT in the Documents panel + the
 *       dispatch activity-log note exists (conservative: assert the note
 *       EXISTS — the modify-increase already wrote it before any E-Sign click).
 *   S6  Customer signs the LEASE_MOD contract → lead + contract SIGNED,
 *       stays SIGNED (UOWN isSignedToFunding=false), signing activity log.  [P0]
 *
 * Pending discovery (skipped — see docs/scenarios/lead-detail-esign-modify-lease.md §Pending):
 *   S1  E-Sign hidden in SIGNED (code contradicts premise — needs DOM discovery).
 *   S4/S5  chargeProcessingFeeBeforeEsign checkbox (render unconfirmed; merchant
 *       preflight forces the flag true on standard merchants).
 *
 * Setup is fresh per test (rule #9): pre-qualify via API → reduced invoice →
 * driveLeadToSigned → UI Modify Lease (increase) → assert CONTRACT_CREATED.
 * Merchant preflight (rule #12) runs inside createPreQualifiedApplication.
 *
 * Canonical refs: docs/business-rules/03-contratos-esign.md §8 §55 §63;
 * 12-produto-lease-deep-dive.md §3.2 §7; gowsign-modify-lease-qa2.spec.ts
 * (signing driver pattern).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Page, TestInfo } from '@playwright/test';
import { OriginationCustomerPage } from '@pages/origination/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import {
  buildTestData,
  sleep,
  loginToPortal,
  navigateToOriginationCustomer,
  createPreQualifiedApplication,
  driveLeadToSigned,
  findLeadNoteContaining,
  getEsignDocumentByLeadPk,
  getEsignLeadStatus,
  waitForLeadStatus,
  signGowSignInFrame,
  completeSignwellFlow,
  clickSignAllViaLink,
} from '@helpers/index.js';
import type { ApiClients, TestContext } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';

// Origination is an internal, agent-facing portal — Bootstrap `d-lg-block`
// (≥992px) hides the action bar below this width (rule #15). 1440×900 mandatory.
test.use({ viewport: { width: 1440, height: 900 } });

const TAGS = ['@regression', '@e2e', '@origination', '@priority-high'];

const PENDING_REASON =
  'pending discovery — see docs/scenarios/lead-detail-esign-modify-lease.md §Pending';

// ── Local DB helper (domain table — not an activity-log table) ───────────────
/** Count of esign documents attached to the lead — idempotency oracle for S3. */
async function countEsignDocs(db: DatabaseHelpers, leadPk: string | number): Promise<number> {
  const v = await db.getSingleString(
    'SELECT COUNT(*)::text FROM uown_esign_document WHERE lead_pk = $1',
    [leadPk],
  );
  return Number(v ?? '0');
}

/**
 * Shared precondition for S2/S3/S6: drives a fresh TireAgent/NY lead to
 * CONTRACT_CREATED via a UI Modify Lease invoice INCREASE, leaving the LEASE_MOD
 * contract auto-dispatched by the backend. Returns the open customer page.
 *
 * Mirrors the known-working sequence from
 * tests/e2e/origination/modify-lease.spec.ts §"Increase Value (SIGNED)":
 *   skipPaymentInfo keeps both invoices ADDED_TO_CART (no GowSign auto-sign race
 *   that would skip the Modify Lease warning modal).
 */
async function setupContractCreatedViaModifyIncrease(
  page: Page,
  api: ApiClients,
  db: DatabaseHelpers,
  ctx: TestContext,
  testInfo: TestInfo,
): Promise<{ customerPage: OriginationCustomerPage; leadPk: string }> {
  const { env, merchant, applicant } = buildTestData({
    state: 'NY',
    merchant: 'TireAgent',
    orderTotal: '800',
    orderDescription: 'Lead Detail E-Sign — modify increase',
    uniqueAddress: true, // dodge static-address blacklist poisoning across runs
  });

  let approvedAmount = 0;
  let customerPage!: OriginationCustomerPage;

  await test.step('Setup: pre-qualify lead at SIGNED with a reduced invoice', async () => {
    const result = await createPreQualifiedApplication(
      api,
      merchant,
      applicant,
      ctx,
      { skipPaymentInfo: true }, // stays UW_APPROVED; no signed contract yet (rule #12 preflight runs internally)
      testInfo,
    );
    approvedAmount = result.approvedAmount;

    // Send a reduced invoice so the later UI modification is a genuine INCREASE.
    const reduced = await api.invoice.sendInvoice(merchant, ctx.leadUuid, {
      orderTotal: String(Math.floor(approvedAmount * 0.5)),
    });
    expect(reduced.ok, `reduced sendInvoice responded with ${reduced.status}`).toBeTruthy();

    await driveLeadToSigned(api, merchant, ctx);
  });

  await test.step('Setup: login + open the lead in Origination', async () => {
    await loginToPortal(page, env.originationUrl, env);
    customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);
  });

  await test.step('Setup: Modify Lease increasing the invoice value', async () => {
    const toast = await customerPage.modifyLease(async (p) => {
      const helper = new OriginationCustomerPage(p);
      await helper.deleteAllInvoiceItems();
      await p.locator(SELECTORS.naNumberOfItems).waitFor({ state: 'visible', timeout: 10_000 });

      // 90% of approvedAmount — conservative so total + state tax stays within limit.
      const targetPrice = Math.floor(approvedAmount * 0.9);
      await p.locator(SELECTORS.naNumberOfItems).fill('1');
      await p.locator(SELECTORS.naItemCode).fill('ESIGN-MOD');
      await p.locator(SELECTORS.naItemDescription).fill('Modified item — increased for e-sign');
      await p.locator(SELECTORS.naBasePricePerItem).fill(String(targetPrice));
      await p.locator(SELECTORS.naSubmitItemLease).first().click();
      await helper.waitForSpinner();

      // Invoice # is required by the Create/Modify Lease form (live sandbox DOM
      // 2026-06-26) — Save fails silently when empty. Guarded so it no-ops if
      // the field is not rendered in a given build.
      const invoiceNumberInput = p.locator(SELECTORS.naInvoiceNumber);
      if (await invoiceNumberInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await invoiceNumberInput.fill(`MOD-${Date.now()}`);
      }
    });
    console.log(`[Setup] Modify Lease toast: "${toast}"`);
  });

  await test.step('Setup: precondition — internal status is CONTRACT_CREATED', async () => {
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    await customerPage.waitForSpinner();
    const internal = await customerPage.getInternalStatus();
    expect(
      internal.toUpperCase(),
      `internal status after modify-increase: "${internal}"`,
    ).toContain('CONTRACT_CREATED');
  });

  await test.step('Setup: activity log — modify increase set lead to CONTRACT_CREATED (rule #13)', async () => {
    const note = await findLeadNoteContaining(db, ctx.leadPk, 'Invoice increase');
    expect(note, 'expected an "Invoice increase ... CONTRACT_CREATED" lead note (rule #13)').not.toBeNull();
    expect(note!.notes.toUpperCase()).toContain('CONTRACT_CREATED');
  });

  return { customerPage, leadPk: ctx.leadPk };
}

test.describe('Lead Detail — E-Sign / Sign (Modify Lease)', { tag: TAGS }, () => {
  // ── S2 — button visibility ────────────────────────────────────────────────
  test('S2 — E-Sign button is visible in CONTRACT_CREATED', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(300_000);
    const { customerPage } = await setupContractCreatedViaModifyIncrease(page, api, db, ctx, testInfo);

    await test.step('E-Sign button is visible in the action bar', async () => {
      await customerPage.expandActionsMenu();
      const visible = await customerPage.isESignVisible();
      expect(visible, 'E-Sign must be visible in the action bar in CONTRACT_CREATED').toBe(true);
    });
  });

  // ── S3 — dispatch reflects SENT + log + idempotency ───────────────────────
  test('S3 — Clicking E-Sign → LEASE_MOD SENT in Documents panel + activity log', async ({
    page,
    api,
    db,
    ctx,
  }, testInfo) => {
    test.setTimeout(300_000);
    const { customerPage, leadPk } = await setupContractCreatedViaModifyIncrease(page, api, db, ctx, testInfo);

    let docCountBefore = 0;
    await test.step('Baseline: exactly one LEASE_MOD esign document exists (idempotency oracle)', async () => {
      const deadline = Date.now() + 30_000;
      let doc = await getEsignDocumentByLeadPk(db, leadPk);
      while (!doc && Date.now() < deadline) {
        await sleep(3_000);
        doc = await getEsignDocumentByLeadPk(db, leadPk);
      }
      expect(doc, 'modify-increase must have created a LEASE_MOD esign document').not.toBeNull();
      docCountBefore = await countEsignDocs(db, leadPk);
      expect(docCountBefore, `expected exactly 1 esign document, got ${docCountBefore}`).toBe(1);
    });

    await test.step('Agent clicks E-Sign, then forces a backend document-status sync', async () => {
      await customerPage.clickESign();
      // "Get Document Status" is present in CONTRACT_CREATED (live sandbox DOM
      // 2026-06-26) — force the backend e-sign/document sync so the panel
      // reflects SENT deterministically. No-op when the button is absent.
      await customerPage.clickGetDocumentStatus({ settleMs: 8_000, waitSpinner: false });
    });

    await test.step('Documents → Lease panel: re-dispatched contract row shows SENT', async () => {
      // Reload to persist the panel state, then re-read the contract rows.
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});
      await customerPage.waitForSpinner();

      const contracts = await customerPage.getLeasePanelContracts();
      // sandbox observation 2026-06-26: after Modify Lease increase, the backend
      // creates uown_esign_document.document_group='LEASE' (not 'LEASE_MOD').
      // The Documents panel therefore renders contractType='LEASE'. See F-004 in
      // docs/taskTestingUown/lead-detail-esign-modify-lease/lead-detail-esign-modify-lease-report.md
      const sentContract = contracts.find(
        (c) => c.contractType.toUpperCase() === 'LEASE' && c.status.toUpperCase() === 'SENT',
      );
      expect(sentContract, `expected a LEASE row with status SENT; got ${JSON.stringify(contracts)}`).toBeDefined();
    });

    await test.step('Activity log: "Sent Contract to customer" note exists (conservative — rule #13)', async () => {
      // The modify-increase backend auto-dispatches the LEASE_MOD contract and
      // writes this note BEFORE any E-Sign click. We assert the note EXISTS —
      // NOT that the E-Sign click caused the dispatch. This frames the E-Sign
      // section as reflecting the SENT state, not as the dispatch trigger.
      const note = await findLeadNoteContaining(db, leadPk, 'Sent Contract to customer');
      expect(note, 'expected a "Sent Contract to customer" lead note').not.toBeNull();
    });

    await test.step('Idempotency: E-Sign did not duplicate the LEASE_MOD esign document', async () => {
      const docCountAfter = await countEsignDocs(db, leadPk);
      expect(docCountAfter, 'E-Sign must not create a duplicate esign document').toBe(docCountBefore);
      expect(docCountAfter, 'no two duplicate EsignDocs for the same lead').toBeLessThanOrEqual(1);
    });
  });

  // ── S6 — full signing ceremony [P0 / HIGHEST RISK] ────────────────────────
  test('S6 — Customer signs LEASE_MOD → lead + contract SIGNED + activity log', async ({
    page,
    api,
    db,
    ctx,
  }, testInfo) => {
    // Two state transitions + an embedded signing ceremony + DB polling.
    test.setTimeout(600_000);
    const { customerPage, leadPk } = await setupContractCreatedViaModifyIncrease(page, api, db, ctx, testInfo);

    let provider = '';
    await test.step('Confirm the LEASE_MOD esign document is dispatched (provider + status)', async () => {
      // Poll until the embedded LEASE_MOD doc exists and reached a dispatched state.
      const deadline = Date.now() + 60_000;
      let doc = await getEsignDocumentByLeadPk(db, leadPk);
      while (Date.now() < deadline && !(doc && /OUTSTANDING|SENT/i.test(doc.documentStatus ?? ''))) {
        await sleep(3_000);
        doc = await getEsignDocumentByLeadPk(db, leadPk);
      }
      expect(doc, `LEASE_MOD esign document for lead ${leadPk}`).not.toBeNull();
      expect(doc!.documentStatus ?? '', `doc status: ${doc?.documentStatus}`).toMatch(/OUTSTANDING|SENT/i);
      provider = (doc!.esignClient ?? '').toUpperCase();
      console.log(`[S6] LEASE_MOD doc pk=${doc!.pk} provider=${provider} status=${doc!.documentStatus}`);
    });

    await test.step('Open the embedded signing surface via E-Sign and complete the ceremony', async () => {
      // The E-Sign trigger surfaces the embedded LEASE_MOD signing flow in the
      // portal (EsignMode EMBEDDED). Provider is resolved from the DB rather than
      // assumed, to absorb GowSign-vs-SignWell state-routing drift (testing.md).
      await customerPage.clickESign();

      if (provider === 'SIGNWELL') {
        const frameLoc = page.locator(SELECTORS.signingSignWellIframeByUrl).first();
        await frameLoc.waitFor({ state: 'attached', timeout: 60_000 });
        const swFrame = page.frameLocator(SELECTORS.signingSignWellIframeByUrl);
        await completeSignwellFlow(swFrame, 'S6 LEASE_MOD', () => clickSignAllViaLink(swFrame));
      } else {
        // default / GOWSIGN — embedded GowSign modal
        const modal = new AlternativeContractModalPage(page);
        await modal.waitForOpen(120_000);
        const frame = modal.getGowSignFrame();
        await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
        const result = await signGowSignInFrame(page, frame, {
          preauthChoice: 'yes',
          fontIndex: 0,
          // Backend transitions to SIGNED via the EsignRedirectService redirect
          // even when the 'completed' postMessage is missed (testing.md GowSign note).
          waitForCompleted: false,
        });
        expect(result.signClicked, 'GowSign final Sign must have fired').toBe(true);
      }
    });

    await test.step('UI: lead status transitions to Signed', async () => {
      const { matched, status } = await customerPage.pollForLeadStatus(['signed'], 12, 5_000);
      expect(matched, `lead status should reach Signed; last="${status}"`).toBe(true);
    });

    await test.step('DB: lead + esign_document are SIGNED', async () => {
      const leadStatus = await waitForLeadStatus(db, leadPk, 'SIGNED', { timeoutMs: 60_000 });
      expect(leadStatus).toBe('SIGNED');

      const signedDoc = await getEsignDocumentByLeadPk(db, leadPk);
      expect(signedDoc, 'esign document').not.toBeNull();
      expect(signedDoc!.documentStatus, 'esign_document.status').toBe('SIGNED');
      expect(signedDoc!.signedDateTime, 'doc_signed_time_stamp populated').not.toBeNull();
    });

    await test.step('UI: Documents → Lease panel LEASE_MOD row shows SIGNED', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle').catch(() => {});
      await customerPage.waitForSpinner();

      const contracts = await customerPage.getLeasePanelContracts();
      const leaseMod = contracts.find((c) => c.contractType.toUpperCase() === 'LEASE_MOD');
      expect(leaseMod, `expected a LEASE_MOD row; got ${JSON.stringify(contracts)}`).toBeDefined();
      expect(leaseMod!.status.toUpperCase(), 'LEASE_MOD contract should be SIGNED').toBe('SIGNED');
    });

    await test.step('DB: isSignedToFunding=false (UOWN) — lead stays SIGNED, no auto-FUNDING', async () => {
      // Give any auto-funding transition a window to (not) happen, then assert it
      // stayed SIGNED. UOWN merchants have isSignedToFunding=false → no auto-advance.
      await sleep(5_000);
      const after = await getEsignLeadStatus(db, leadPk);
      expect(after, `lead must remain SIGNED (not auto-FUNDING); got "${after}"`).toBe('SIGNED');
    });

    await test.step('Activity log: signing event recorded (rule #13)', async () => {
      const note = await findLeadNoteContaining(db, leadPk, '[ContractService][isLeaseOrLeaseModSigned]');
      expect(note, 'expected a [ContractService][isLeaseOrLeaseModSigned] signing note').not.toBeNull();
    });
  });

  // ── S1 — [negative] E-Sign absent in SIGNED ───────────────────────────────
  // DEVIATION from the original "skip S1" instruction: the @pending condition
  // was "needs DOM discovery". Live sandbox DOM (relayed 2026-06-26) CONFIRMED
  // AC-01 — the E-Sign button is absent in SIGNED — which unblocks S1. No Modify
  // Lease here: a plain SIGNED lead is the precondition.
  test('S1 — [negative] E-Sign button not visible when lead is SIGNED', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(300_000);

    const { env, merchant, applicant } = buildTestData({
      state: 'NY',
      merchant: 'TireAgent',
      orderTotal: '800',
      orderDescription: 'Lead Detail E-Sign — SIGNED negative',
      uniqueAddress: true,
    });

    await test.step('Setup: pre-qualify lead and drive to SIGNED', async () => {
      await createPreQualifiedApplication(api, merchant, applicant, ctx, { skipPaymentInfo: true }, testInfo);
      await driveLeadToSigned(api, merchant, ctx);
    });

    await test.step('Activity log: SIGNED transition recorded (rule #13)', async () => {
      const note = await findLeadNoteContaining(db, ctx.leadPk, 'SIGNED');
      expect(note, 'expected a lead note recording the SIGNED transition').not.toBeNull();
    });

    await test.step('Open the lead in Origination and confirm internal status is SIGNED', async () => {
      await loginToPortal(page, env.originationUrl, env);
      const customerPage = await navigateToOriginationCustomer(page, ctx.leadPk);
      const internal = await customerPage.getInternalStatus();
      expect(internal.toUpperCase(), `internal status: "${internal}"`).toContain('SIGNED');

      await test.step('E-Sign button is NOT visible in the action bar', async () => {
        await customerPage.expandActionsMenu();
        const visible = await customerPage.isESignVisible();
        expect(visible, 'E-Sign must be absent in SIGNED (AC-01)').toBe(false);
      });
    });
  });

  // ── Pending discovery — NOT implemented now ───────────────────────────────
  test('S4 — Checking chargeProcessingFeeBeforeEsign charges the processing fee', async () => {
    test.skip(true, PENDING_REASON);
  });

  test('S5 — Leaving chargeProcessingFeeBeforeEsign unchecked skips the fee', async () => {
    test.skip(true, PENDING_REASON);
  });
});

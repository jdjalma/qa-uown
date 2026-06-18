/**
 * RU06.26.1.53.0 — Prevent Repeated NeuroID Calls During Signing Retries (svc#554)
 *
 * Issue: GitLab Servicing #554
 * SPEC:  qa-planner handoff (in-conversation, not on disk)
 *
 * Feature under test
 * ------------------
 * When a customer returns to the signing portal after an initial submit (with CC
 * or bank already saved), a retry / continue MUST NOT trigger a NEW backend
 * NeuroID verification call. The first attempt calls NeuroID; subsequent returns
 * reuse the prior verification. A `NOT_ENOUGH_INTERACTION_DATA` outcome must not
 * deny the customer (AC-03). First-time path must still call NeuroID (AC-04,
 * regression guard).
 *
 * NeuroID call-count source of truth (DISCOVERY PROBE result)
 * -----------------------------------------------------------
 * Probe: src/scripts/probe-neuroid-554.ts (run vs qa2, 2026-06-15).
 *   - `uown_sv_outbound_api_log` DOES contain NeuroID rows
 *     (url ILIKE '%neuro%', https://api.neuro-id.com/v4.1/sites/.../profiles/{id})
 *     but has NO lead_pk / service column, and for every NeuroID row
 *     account_pk / source_uuid / return_uuid are NULL → NO usable correlation
 *     key to a fresh lead. SPEC Option A is NOT viable.
 *   - `uown_neuro_id_verification` HAS lead_pk and one row per backend NeuroID
 *     verification attempt → SPEC Option B (fallback) is the source of truth.
 *   ⇒ `db.countNeuroIdCalls(leadPk)` counts rows in uown_neuro_id_verification.
 *   "No new NeuroID call on retry" ⇒ count does not increase.
 *   Only neuro_id_status values present in qa2: SUCCESS, PROFILE_NOT_FOUND.
 *
 * Inviolable rule honors
 * ----------------------
 *   - Rule #9  (Test Data Hierarchy): fresh lead per CT via createPreQualifiedApplication.
 *   - Rule #12 (Merchant preflight): SKIPPED — `useNeuroIdCheck=true` lives in the
 *     preflight contract `mustBeFalse` set, so auto-heal would RESET the very flag
 *     this feature requires. Every createPreQualifiedApplication call passes
 *     `skipMerchantPreflight: true`. Env pre-check (beforeAll) asserts the flag is
 *     ON instead.
 *   - Rule #13 (Activity log): every NeuroID-triggering submit asserts a note in
 *     uown_los_lead_notes; CT-01/CT-03 assert ABSENCE of a NEW NeuroID note on retry.
 *   - Rule #14 (UI-first): the first NeuroID-triggering submit and every return-to-sign
 *     are driven through the real consumer signing flow (MissingDataForm → T&C →
 *     GowSign iframe). NeuroID is a behavioral-SDK feature — only the browser path
 *     exercises it. API is used solely for lead setup (Exception b) + DB assertions
 *     (Exception c).
 *   - Rule #15 (DOM-first): no new locators — reuses MissingDataFormPage,
 *     TermsOfAgreementPage, AlternativeContractModalPage, signGowSignInFrame
 *     (all DOM-validated upstream, gowsign-knowledge pitfalls #7/#8).
 *
 * Risk guard R5: every "no new call" assertion is preceded by `count1 >= 1` so a
 * vacuous 0 === 0 cannot pass as a green.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Page } from '@playwright/test';
import { TestTag, splitTags } from '@ptypes/enums.js';
import { NeuroIdStatus } from '@ptypes/enums.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { signGowSignInFrame } from '@helpers/gowsign-signing.helper.js';
import {
  MissingDataFormPage,
  TermsOfAgreementPage,
} from '@pages/origination/index.js';
import { AlternativeContractModalPage } from '@pages/gowsign/index.js';
import { TEST_BANK } from '@config/constants.js';
import type { TestContext, ApiClients } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';

// ── Constants ───────────────────────────────────────────────────────────────

const SASLOWS_MERCHANT_CODE = 'OW90337-0001';
const BODEGA_MERCHANT_CODE = 'KS1011';

const CC = {
  cardNumber: '4111111111111111',
  cvc: '123',
  expiration: '12/2030',
} as const;

const TAGS = splitTags(
  `${TestTag.REGRESSION} ${TestTag.QA2} @neuroid @signing @servicing @RU06.26.1.53.0`,
);

function annotate(type: string, description: string): void {
  test.info().annotations.push({ type, description });
  console.log(`[${type.toUpperCase()}] ${description}`);
}

/** True when the merchant has the NeuroID feature flag ON (env pre-check). */
async function neuroIdEnabled(db: DatabaseHelpers, refCode: string): Promise<boolean> {
  const val = await db.getSingleString(
    `SELECT use_neuro_id_check FROM uown_merchant WHERE ref_merchant_code = $1`,
    [refCode],
  );
  return val === 'true' || val === 't';
}

/** Latest NeuroID note in the lead activity log (Rule #13 evidence). */
async function latestNeuroIdNote(
  db: DatabaseHelpers,
  leadPk: string | number,
): Promise<{ pk: number; notes: string } | null> {
  return db.queryOne<{ pk: number; notes: string }>(
    `SELECT pk, notes FROM uown_los_lead_notes
      WHERE lead_pk = $1 AND notes ILIKE '%neuro%'
      ORDER BY pk DESC LIMIT 1`,
    [Number(leadPk)],
  );
}

interface SetupParams {
  merchantKey: 'SaslowsJewelersCA' | 'BodegaFurniture';
  state: string;
  label: string;
  withBank: boolean;
  /** Kornerstone merchants require bankData in sendApplication (lifecycle pitfall #5). */
  kornerstone?: boolean;
}

interface SetupResult {
  leadPk: string;
  leadUuid: string;
  applicant: { firstName: string; lastName: string; email: string };
  contractUrl: string;
}

/**
 * Fresh lead → invoice → returns the consumer contract URL (redirectUrl). Does
 * NOT submit payment info via API: the first NeuroID-triggering submit happens
 * through the browser (Rule #14). Merchant preflight is intentionally skipped
 * (see file header — Rule #12 exception for useNeuroIdCheck).
 */
async function setupFreshLead(
  api: ApiClients,
  ctx: TestContext,
  params: SetupParams,
  testInfo: import('@playwright/test').TestInfo,
): Promise<SetupResult> {
  const { merchant, applicant } = buildTestData({
    state: params.state,
    merchant: params.merchantKey,
    orderTotal: '1200',
    orderDescription: `NeuroID #554 ${params.label}`,
  });

  await createPreQualifiedApplication(
    api,
    merchant,
    applicant,
    ctx,
    {
      skipMerchantPreflight: true, // Rule #12 exception — useNeuroIdCheck is mustBeFalse in contract
      skipPaymentInfo: true, // first NeuroID-triggering submit is via UI
      ...(params.kornerstone
        ? {
            bankData: {
              routingNumber: TEST_BANK.DEFAULT_ROUTING,
              accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
            },
          }
        : {}),
    },
    testInfo,
  );

  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid);
  expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();
  const contractUrl: string = invoiceResp.body?.paymentDetailsList?.[0]?.redirectUrl ?? '';
  expect(contractUrl, 'redirectUrl required for UI signing flow').toBeTruthy();

  annotate('leadPk', String(ctx.leadPk));
  annotate('merchant', params.merchantKey);

  return {
    leadPk: ctx.leadPk,
    leadUuid: ctx.leadUuid,
    applicant: {
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
    },
    contractUrl,
  };
}

/**
 * Drive the consumer flow from the contract URL through the FIRST submit that
 * triggers the backend NeuroID call: MissingDataForm (CC, optionally bank) → T&C.
 * Stops at the GowSign modal open (does not sign).
 */
async function completeFirstSubmit(
  page: Page,
  setup: SetupResult,
  withBank: boolean,
): Promise<void> {
  await page.goto(setup.contractUrl);

  const missingData = new MissingDataFormPage(page);
  await missingData.waitForLoaded(60_000);
  await missingData.fillAndSubmit(
    {
      firstName: setup.applicant.firstName,
      lastName: setup.applicant.lastName,
      cardNumber: CC.cardNumber,
      cvc: CC.cvc,
      expiration: CC.expiration,
    },
    withBank
      ? {
          firstName: setup.applicant.firstName,
          lastName: setup.applicant.lastName,
          accountType: 'CHECKING',
          routingNumber: TEST_BANK.DEFAULT_ROUTING,
          accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
        }
      : undefined,
  );

  const terms = new TermsOfAgreementPage(page);
  await terms.waitForLoaded(120_000);
  await terms.acceptAndProceedWithProtectionPlan(false);
}

/** Open the GowSign modal frame (post T&C) and confirm no NeuroID denial modal. */
async function openSigningModal(page: Page): Promise<AlternativeContractModalPage> {
  const modal = new AlternativeContractModalPage(page);
  await modal.waitForOpen(120_000);
  const frame = modal.getGowSignFrame();
  await frame.locator('body').waitFor({ state: 'visible', timeout: 30_000 });
  return modal;
}

/**
 * Assert no NeuroID denial modal is shown to the customer. The denial surfaces
 * as a customer-facing modal; absence is part of every positive/negative CT.
 */
async function assertNoDenialModal(page: Page): Promise<void> {
  const denial = page
    .getByText(/neuro\s*id.*(deni|declin|not.*verified|unable to verify)/i)
    .first();
  const visible = await denial.isVisible({ timeout: 3_000 }).catch(() => false);
  expect(visible, 'NeuroID denial modal must NOT be shown to the customer').toBe(false);
}

/**
 * Return to the signing portal WITHOUT new interaction and trigger continue.
 * Reloading the contract URL re-enters the signing flow; the retry must reuse
 * the prior NeuroID verification (no new backend call).
 */
async function returnToSignNoInteraction(page: Page, contractUrl: string): Promise<void> {
  await page.goto(contractUrl);
  await page.waitForLoadState('domcontentloaded');
  // The lead is already past payment entry; the portal re-renders either the
  // T&C step or the signing modal. Advance through T&C if it re-appears, WITHOUT
  // re-entering payment data (no new interaction).
  const terms = new TermsOfAgreementPage(page);
  const termsVisible = await terms
    .waitForLoaded(15_000)
    .then(() => true)
    .catch(() => false);
  if (termsVisible) {
    await terms.acceptAndProceedWithProtectionPlan(false);
  }
}

test.describe('RU06.26.1.53.0 — Prevent Repeated NeuroID Calls During Signing Retries (#554)', { tag: TAGS }, () => {
  test.beforeAll(async ({ testEnv }) => {
    // Spec pins qa2 (NeuroID flag ON for both merchants; depth355/items340 sites).
    if (testEnv.env !== 'qa2') {
      annotate('env-gap', `spec targets qa2; current env=${testEnv.env}`);
    }
  });

  test.beforeEach(async ({ testEnv, db }) => {
    test.skip(
      testEnv.env !== 'qa2',
      '[ENV-GAP] svc#554 NeuroID spec is qa2-only (merchant flag + NeuroID sites configured there)',
    );
    const enabled = await neuroIdEnabled(db, SASLOWS_MERCHANT_CODE);
    test.skip(
      !enabled,
      `[ENV-GAP] useNeuroIdCheck=false on primary merchant ${SASLOWS_MERCHANT_CODE} — feature not exercisable`,
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CT-01 — [negative] NeuroID not called on retry (AC-01) — HIGH — 2 examples
  // Row 3 ("prior NeuroID data on account") is covered structurally by CT-05.
  // ───────────────────────────────────────────────────────────────────────────
  const ct01Rows: Array<{ row: string; withBank: boolean }> = [
    { row: 'Row1 CC saved', withBank: false },
    { row: 'Row2 Bank saved', withBank: true },
  ];

  for (const { row, withBank } of ct01Rows) {
    test(`CT-01 [${row}] no new NeuroID call on return-to-sign (AC-01)`, async ({ page, api, db, ctx }, testInfo) => {
      test.setTimeout(420_000);
      await page.setViewportSize({ width: 1440, height: 900 });

      const setup = await test.step('Setup: fresh lead + invoice', async () =>
        setupFreshLead(api, ctx, {
          merchantKey: 'SaslowsJewelersCA',
          state: 'CA',
          label: row,
          withBank,
        }, testInfo));

      await test.step('First submit via UI triggers NeuroID', async () => {
        await completeFirstSubmit(page, setup, withBank);
        await openSigningModal(page);
      });

      let count1 = 0;
      await test.step('Guard (R5): NeuroID was called at least once', async () => {
        await db.waitForNeuroIdRecord(setup.leadPk, 60_000);
        count1 = await db.countNeuroIdCalls(setup.leadPk);
        annotate('count1', String(count1));
        expect(count1, 'first NeuroID call must have happened before asserting "no new call"').toBeGreaterThanOrEqual(1);
      });

      const noteBefore = await test.step('Capture NeuroID activity-log watermark (Rule #13)', async () => {
        const note = await latestNeuroIdNote(db, setup.leadPk);
        expect(note, 'a NeuroID note must exist after the first call').toBeTruthy();
        annotate('neuroid-note', `pk=${note?.pk} "${(note?.notes ?? '').slice(0, 80)}"`);
        return note;
      });

      await test.step('Return to signing portal without new interaction + continue', async () => {
        await returnToSignNoInteraction(page, setup.contractUrl);
        await assertNoDenialModal(page);
      });

      await test.step('Assert: no NEW NeuroID call (count2 === count1)', async () => {
        const count2 = await db.countNeuroIdCalls(setup.leadPk);
        annotate('count2', String(count2));
        expect(count2, `retry must not add a NeuroID call (count1=${count1}, count2=${count2})`).toBe(count1);
      });

      await test.step('Assert: no NEW NeuroID note after retry (Rule #13 — absence)', async () => {
        const noteAfter = await latestNeuroIdNote(db, setup.leadPk);
        expect(noteAfter?.pk, 'no new NeuroID note row should be written on retry').toBe(noteBefore?.pk);
      });
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CT-02 — [negative] NOT_ENOUGH_INTERACTION_DATA does not deny (AC-03) — HIGH
  // ───────────────────────────────────────────────────────────────────────────
  test('CT-02 NOT_ENOUGH_INTERACTION_DATA does not deny the customer (AC-03)', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const setup = await test.step('Setup: fresh lead + invoice', async () =>
      setupFreshLead(api, ctx, {
        merchantKey: 'SaslowsJewelersCA',
        state: 'CA',
        label: 'CT-02 starved SDK',
        withBank: false,
      }, testInfo));

    await test.step('Starve the NeuroID SDK (abort its network)', async () => {
      // Block the behavioral SDK so the backend receives little/no interaction data.
      await page.route(/neuroid|neuro-id|nid\.io|nid\.com/i, (route) => route.abort());
    });

    await test.step('First submit via UI (CC + bank) with SDK starved', async () => {
      await completeFirstSubmit(page, setup, /* withBank */ true);
    });

    await test.step('Assert: customer not denied + signing still reachable', async () => {
      const row = await db.waitForNeuroIdRecord(setup.leadPk, 90_000);
      const status = row?.neuro_id_status ?? '(none)';
      annotate('neuro_id_status', status);

      if (status === NeuroIdStatus.NOT_ENOUGH_INTERACTION_DATA) {
        // AC-03 core path: low-interaction must NOT deny.
        const leadStatus = await db.getLeadStatus(setup.leadPk);
        annotate('lead-status', String(leadStatus));
        expect(leadStatus, 'lead must not be DENIED on NOT_ENOUGH_INTERACTION_DATA').not.toMatch(/DENIED/i);
        await assertNoDenialModal(page);
        await openSigningModal(page); // signing surface still reachable
      } else {
        // qa2 discovery only surfaced SUCCESS / PROFILE_NOT_FOUND. Record N/A
        // with the observed status (per SPEC) — do not fail the suite.
        annotate(
          'observation',
          `[N/A] NOT_ENOUGH_INTERACTION_DATA not reproduced in qa2 — observed neuro_id_status=${status}. ` +
            `AC-03 core assertion skipped; confirming customer still not denied.`,
        );
        const leadStatus = await db.getLeadStatus(setup.leadPk);
        expect(leadStatus, 'lead must not be DENIED regardless of NeuroID status').not.toMatch(/DENIED/i);
        await assertNoDenialModal(page);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CT-03 — [negative] Repeated retries do not accumulate calls (AC-01) — HIGH
  // ───────────────────────────────────────────────────────────────────────────
  test('CT-03 three return-to-sign retries do not accumulate NeuroID calls (AC-01)', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(480_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const setup = await test.step('Setup: fresh lead + invoice', async () =>
      setupFreshLead(api, ctx, {
        merchantKey: 'SaslowsJewelersCA',
        state: 'CA',
        label: 'CT-03 repeated retries',
        withBank: false,
      }, testInfo));

    await test.step('First submit via UI triggers NeuroID', async () => {
      await completeFirstSubmit(page, setup, /* withBank */ false);
      await openSigningModal(page);
    });

    let count1 = 0;
    await test.step('Guard (R5): NeuroID called at least once', async () => {
      await db.waitForNeuroIdRecord(setup.leadPk, 60_000);
      count1 = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count1', String(count1));
      expect(count1).toBeGreaterThanOrEqual(1);
    });

    for (let attempt = 1; attempt <= 3; attempt++) {
      await test.step(`Retry #${attempt}: return-to-sign + assert count unchanged`, async () => {
        await returnToSignNoInteraction(page, setup.contractUrl);
        await assertNoDenialModal(page);
        const countAfter = await db.countNeuroIdCalls(setup.leadPk);
        annotate(`count_after_retry_${attempt}`, String(countAfter));
        expect(countAfter, `retry #${attempt} must not add a NeuroID call`).toBe(count1);
      });
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CT-04 — [positive] First attempt calls NeuroID correctly (AC-04) — HIGH
  //         REGRESSION GUARD
  // ───────────────────────────────────────────────────────────────────────────
  test('CT-04 first attempt calls NeuroID correctly (AC-04, regression guard)', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const setup = await test.step('Setup: fresh lead + invoice (no prior NeuroID data)', async () =>
      setupFreshLead(api, ctx, {
        merchantKey: 'SaslowsJewelersCA',
        state: 'CA',
        label: 'CT-04 first attempt',
        withBank: false,
      }, testInfo));

    await test.step('Pre-assert: zero NeuroID calls before first submit', async () => {
      const before = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count_before', String(before));
      expect(before, 'fresh lead must have no NeuroID verification rows yet').toBe(0);
    });

    await test.step('First submit via UI (CC + bank)', async () => {
      await completeFirstSubmit(page, setup, /* withBank */ true);
    });

    await test.step('NeuroID verification row materializes (row_created_timestamp populated)', async () => {
      const row = await db.waitForNeuroIdRecord(setup.leadPk, 90_000);
      expect(row, 'a uown_neuro_id_verification row must be created on first attempt').toBeTruthy();
      expect(row?.row_created_timestamp, 'row_created_timestamp must be populated').toBeTruthy();
      annotate('neuro_id_status', row?.neuro_id_status ?? '(none)');
    });

    await test.step('Assert: count_after >= 1', async () => {
      const after = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count_after', String(after));
      expect(after, 'NeuroID must have been called on the first attempt').toBeGreaterThanOrEqual(1);
    });

    await test.step('Activity log: NeuroID outcome note present (Rule #13)', async () => {
      const note = await latestNeuroIdNote(db, setup.leadPk);
      expect(note, 'a NeuroID outcome note must exist in uown_los_lead_notes').toBeTruthy();
      annotate('neuroid-note', `pk=${note?.pk} "${(note?.notes ?? '').slice(0, 80)}"`);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CT-05 — [positive] Customer with prior NeuroID data completes signing without
  //         re-validation (AC-02) — MEDIUM
  // ───────────────────────────────────────────────────────────────────────────
  test('CT-05 prior NeuroID data → signing reached without re-validation (AC-02)', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(480_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const setup = await test.step('Setup: fresh lead + invoice', async () =>
      setupFreshLead(api, ctx, {
        merchantKey: 'SaslowsJewelersCA',
        state: 'CA',
        label: 'CT-05 prior data',
        withBank: true,
      }, testInfo));

    await test.step('First submit via UI establishes prior NeuroID data', async () => {
      // withBank: true — ensures portal skips bank form on return-to-sign
      await completeFirstSubmit(page, setup, /* withBank */ true);
    });

    let count1 = 0;
    await test.step('Guard (R5): NeuroID data exists (count1 >= 1)', async () => {
      await db.waitForNeuroIdRecord(setup.leadPk, 60_000);
      count1 = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count1', String(count1));
      expect(count1).toBeGreaterThanOrEqual(1);
    });

    await test.step('Return-to-sign → advance to documents (no re-validation)', async () => {
      await returnToSignNoInteraction(page, setup.contractUrl);
      await assertNoDenialModal(page);
      const modal = await openSigningModal(page);
      // signing documents presented without denial
      expect(modal, 'GowSign signing modal must be reachable for prior-data customer').toBeTruthy();
    });

    await test.step('Assert: signing presented without a new NeuroID call (count2 === count1)', async () => {
      const count2 = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count2', String(count2));
      expect(count2, 'no re-validation: NeuroID count must be unchanged').toBe(count1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CT-06 — [positive] Signing reaches post-signature status (AC-05) — MEDIUM
  // ───────────────────────────────────────────────────────────────────────────
  test('CT-06 signing reaches post-signature status, NeuroID called once (AC-05)', async ({ page, api, db, ctx }, testInfo) => {
    test.setTimeout(540_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    const setup = await test.step('Setup: fresh lead + invoice', async () =>
      setupFreshLead(api, ctx, {
        merchantKey: 'SaslowsJewelersCA',
        state: 'CA',
        label: 'CT-06 full signing',
        withBank: false,
      }, testInfo));

    await test.step('First submit via UI → T&C', async () => {
      await completeFirstSubmit(page, setup, /* withBank */ false);
    });

    let count1 = 0;
    await test.step('Guard (R5): NeuroID called once', async () => {
      await db.waitForNeuroIdRecord(setup.leadPk, 60_000);
      count1 = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count1', String(count1));
      expect(count1).toBeGreaterThanOrEqual(1);
    });

    await test.step('Complete e-sign in the GowSign iframe (no NeuroID denial)', async () => {
      const modal = await openSigningModal(page);
      const frame = modal.getGowSignFrame();
      const result = await signGowSignInFrame(page, frame, {
        preauthChoice: 'yes',
        waitForCompleted: true,
      });
      annotate('gowsign-result', JSON.stringify(result));
      await assertNoDenialModal(page);
    });

    await test.step('Lead reaches post-signing status (CONTRACT_CREATED or beyond)', async () => {
      const reached = await db
        .waitForValueEquals(
          `SELECT lead_status FROM uown_los_lead WHERE pk = $1`,
          [Number(setup.leadPk)],
          'CONTRACT_CREATED',
          120_000,
        )
        .catch(() => false);
      const status = await db.getLeadStatus(setup.leadPk);
      annotate('lead-status', String(status));
      // Accept CONTRACT_CREATED or any later signed/funding state.
      expect(
        reached || /CONTRACT_CREATED|SIGNED|FUNDING|FUNDED|SETTLED/i.test(status ?? ''),
        `expected a post-signing status, got ${status}`,
      ).toBeTruthy();
    });

    await test.step('DB: uown_esign_document.status === COMPLETED', async () => {
      const reached = await db
        .waitForValueEquals(
          `SELECT status FROM uown_esign_document WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
          [Number(setup.leadPk)],
          'COMPLETED',
          120_000,
        )
        .catch(() => false);
      const status = await db.getSingleString(
        `SELECT status FROM uown_esign_document WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [Number(setup.leadPk)],
      );
      annotate('esign-status', String(status));
      // gowsign-knowledge: enum is COMPLETED (NOT SIGNED). Tolerate async lag —
      // if not yet COMPLETED, surface as observation rather than masking.
      if (!reached && status !== 'COMPLETED') {
        annotate('observation', `[OBSERVAÇÃO] esign status=${status} (expected COMPLETED) — possible signing/sweep lag`);
      }
      expect(status, 'esign document status should be COMPLETED after signing').toBe('COMPLETED');
    });

    await test.step('Activity log: signing completion note (Rule #13)', async () => {
      const note = await db.queryOne<{ pk: number; notes: string }>(
        `SELECT pk, notes FROM uown_los_lead_notes
          WHERE lead_pk = $1 AND notes ILIKE '%[ContractService]%'
          ORDER BY pk DESC LIMIT 1`,
        [Number(setup.leadPk)],
      );
      expect(note, 'a [ContractService] signing note must be present').toBeTruthy();
      annotate('signing-note', `pk=${note?.pk} "${(note?.notes ?? '').slice(0, 80)}"`);
    });

    await test.step('Assert: NeuroID still called only once across the full signing (count unchanged)', async () => {
      const countFinal = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count_final', String(countFinal));
      expect(countFinal, 'full signing must not add NeuroID calls beyond the first').toBe(count1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CT-07 — [positive] No regression on alternative merchant (AC-04) — MEDIUM
  //         BodegaFurniture (KS1011) — Kornerstone → bankData required.
  // ───────────────────────────────────────────────────────────────────────────
  test('CT-07 first attempt calls NeuroID on alternative merchant BodegaFurniture (AC-04)', async ({ page, api, db, ctx, testEnv }, testInfo) => {
    test.setTimeout(420_000);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Per-merchant env pre-check (the beforeEach checks the primary merchant only).
    const enabled = await neuroIdEnabled(db, BODEGA_MERCHANT_CODE);
    test.skip(
      !enabled,
      `[ENV-GAP] useNeuroIdCheck=false on ${BODEGA_MERCHANT_CODE} (BodegaFurniture) — feature not exercisable`,
    );
    void testEnv;

    const setup = await test.step('Setup: fresh Kornerstone lead + invoice (bankData required)', async () =>
      setupFreshLead(api, ctx, {
        merchantKey: 'BodegaFurniture',
        state: 'CA',
        label: 'CT-07 alt merchant',
        withBank: true,
        kornerstone: true, // lifecycle pitfall #5 — Kornerstone needs bankData in sendApplication
      }, testInfo));

    await test.step('Pre-assert: zero NeuroID calls before first submit', async () => {
      const before = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count_before', String(before));
      expect(before).toBe(0);
    });

    await test.step('First submit via UI (CC + bank)', async () => {
      await completeFirstSubmit(page, setup, /* withBank */ true);
    });

    await test.step('NeuroID called on first attempt (count_after >= 1)', async () => {
      const row = await db.waitForNeuroIdRecord(setup.leadPk, 90_000);
      expect(row, 'NeuroID verification row must be created for the alternative merchant').toBeTruthy();
      const after = await db.countNeuroIdCalls(setup.leadPk);
      annotate('count_after', String(after));
      expect(after).toBeGreaterThanOrEqual(1);
    });

    await test.step('Activity log: NeuroID outcome note present (Rule #13)', async () => {
      const note = await latestNeuroIdNote(db, setup.leadPk);
      expect(note, 'a NeuroID note must exist for the alternative merchant').toBeTruthy();
      annotate('neuroid-note', `pk=${note?.pk} "${(note?.notes ?? '').slice(0, 80)}"`);
    });
  });
});

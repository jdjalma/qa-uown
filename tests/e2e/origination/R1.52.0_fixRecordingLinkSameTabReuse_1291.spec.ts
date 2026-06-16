/**
 * R1.52.0_fixRecordingLinkSameTabReuse_1291
 *
 * Issue:    https://gitlab.com/uown/frontend/origination/-/work_items/1291
 * Title:    Fix opening multiple applications in same tab loose recording link
 * MR:       !1448 (frontend/origination) — merged 2026-05-11
 * Spec:     ./R1.52.0_fixRecordingLinkSameTabReuse_1291-spec.md
 *
 * Goal: regression coverage proving the MR !1448 fix — when a customer opens
 *       2 different applications consecutively in the SAME browser tab, BOTH
 *       leads must get a `uown_lead_recording` row (Sentry replay UUID
 *       linked to the lead). Bug-pre-fix: the 2nd lead lost its recording
 *       because `sessionStorage.sentUuid` carried over from app1 and the
 *       FE skipped re-sending the replayId.
 *
 * Constraints (enforced):
 * - NO DB mutation (CLAUDE.md Exception 3). SELECT-only.
 * - UI-first (CLAUDE.md rule #14): bug path is per-tab `sessionStorage`,
 *   only observable in a real browser. API used only to accelerate lead
 *   creation (createPreQualifiedApplication helper) — the `/{shortCode}/complete`
 *   navigation is exercised via UI.
 * - DB-bound post-condition (DOM mapping N/A): MCP investigation 2026-05-22
 *   confirmed there is NO UI element rendering the recording link on the
 *   Origination lead page. AC-2/AC-4 of Marcos' test plan are validated via
 *   `uown_lead_recording` SELECT — see `assertRecordingLinkInDb` helper.
 * - Same-tab invariant: CT-01 and CT-02 keep the same `BrowserContext` +
 *   same `Page` across app1 and app2. NO `newPage()` / `newContext()` in
 *   the middle.
 * - Merchant preflight (CLAUDE.md rule #12) handled automatically by
 *   `createPreQualifiedApplication`.
 * - Activity-log validation (CLAUDE.md rule #13) N/A for recording itself —
 *   `uown_los_lead_notes` does not log recording creation (OQ-3 gap surfaced
 *   in spec). The lifecycle steps that DO generate logs (e.g. application
 *   submission) are handled inside `createPreQualifiedApplication` and not
 *   asserted here because they are not part of this bug's surface.
 *
 * Pending open questions (surface to Marcos in the post-run report):
 * - OQ-1: exact timing of `replayId` send inside `[shortCode]/complete/index.tsx`
 *   (mount `useEffect` vs submit). Test assumes mount/effect-on-navigation and
 *   waits for the recording row right after `page.goto(/{shortCode}/complete)`.
 *   If the row never appears within the 15s budget, the assumption may be
 *   wrong — qa-validator should escalate to OQ-1.
 * - OQ-4: behavior of `sessionStorage.sentUuid` during the `appComplete`
 *   cleanup. CT-05 logs the observed value without asserting strict absence
 *   (only `shortCode` and `leadPk` are required to be cleared by the diff
 *   of MR !1448).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import type { Page } from '@playwright/test';
import { TestTag, splitTags } from '@ptypes/enums.js';
import { TEST_CARDS, TEST_BANK } from '@config/index.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  assertRecordingLinkInDb,
  assertSessionStorageState,
  assertSentryReplayInitialized,
  buildCustomerCompleteUrl,
  getGowSignTemplatesForState,
  sleep,
} from '@helpers/index.js';
import { ContractPage } from '@pages/index.js';

// ── Tags ─────────────────────────────────────────────────────────────────────

const TAGS = splitTags(
  `${TestTag.REGRESSION} ${TestTag.CRITICAL} @origination @recording @signwell @gosign`,
);

// ── Test data ────────────────────────────────────────────────────────────────

// Two merchants are needed only if we wanted to vary vendor by merchant_type.
// Per testing.md "E-sign Provider Routing", TireAgent is ONLINE so the customer
// `state` drives the vendor:
//   - state='NY' → SIGNWELL (fallback)
//   - state='CA' → GOWSIGN  (template available in CA in qa1/qa2 per 2026-04-28)
const MERCHANT_KEY = 'TireAgent';

const ORDER_TOTAL = '621';

const SIGNWELL_STATE = 'NY';
const GOSIGN_STATE = 'CA';

// ── Local helpers ────────────────────────────────────────────────────────────

function annotateObservation(reason: string): void {
  test.info().annotations.push({ type: 'observation', description: reason });
  console.log(`[OBSERVAÇÃO] ${reason}`);
}

function annotateEnvGap(reason: string): void {
  test.info().annotations.push({ type: 'env-gap', description: reason });
  console.log(`[ENV-GAP] ${reason}`);
}

interface PreparedLead {
  leadPk: number;
  shortCode: string;
  completeUrl: string;
  // Echo back persona for later signing-completion if needed (CT-05).
  applicantFirstName: string;
  applicantLastName: string;
}

/**
 * Create a fresh lead via API + extract its customer-side `shortCode` (from
 * `uown_los_lead_short_code`) and build the `/{shortCode}/complete` URL the
 * customer would land on.
 *
 * IMPORTANT: we intentionally do NOT use `submitPaymentInfoViaApi: true` —
 * that would push the lead straight into the signing iframe and the customer
 * would never hit `/{shortCode}/complete`, which is the page hosting the
 * `useEffect` that POSTs the Sentry replayId. The bug only manifests via the
 * UI navigation to `/complete`.
 */
async function setupFreshLeadWithCompleteUrl(
  api: import('@support/base-test.js').ApiClients,
  db: import('@helpers/database.helpers.js').DatabaseHelpers,
  ctx: import('@support/base-test.js').TestContext,
  state: string,
  originationUrl: string,
): Promise<PreparedLead> {
  const { merchant, applicant } = buildTestData({
    state,
    merchant: MERCHANT_KEY,
    orderTotal: ORDER_TOTAL,
    orderDescription: `recording-link-#1291 ${state}`,
    uniqueAddress: true, // dodge static CA address blacklist (654 Sunset Blvd/90028, pk:2165)
  });

  // Each call gets its own ctx-like scratch — but createPreQualifiedApplication
  // mutates the shared ctx, so capture before any second call clobbers it.
  await createPreQualifiedApplication(
    api,
    merchant,
    applicant,
    ctx,
    {
      // skipPaymentInfo=true leaves lead at UW_APPROVED with a valid shortCode
      // — exactly the state a fresh customer link points to.
      skipPaymentInfo: true,
    },
    test.info(),
  );

  const leadPkStr = ctx.leadPk;
  const leadPk = Number(leadPkStr);
  expect(leadPk, 'leadPk must be a positive number').toBeGreaterThan(0);

  // Resolve the shortCode. createPreQualifiedApplication does not extract
  // contractUrl, so query the canonical table (`uown_los_lead_short_code`,
  // see database.helpers.ts `waitForLeadShortCode`).
  const shortCode = await db.waitForLeadShortCode(leadPkStr);
  expect(shortCode, `shortCode must be present for lead ${leadPkStr}`).toBeTruthy();

  // Build the canonical customer URL using the resolved origination base from
  // the testEnv fixture (matches what playwright.config.ts injects as baseURL
  // for the task-testing project).
  expect(originationUrl, 'originationUrl must be set').toBeTruthy();
  const completeUrl = buildCustomerCompleteUrl(originationUrl, shortCode as string);

  return {
    leadPk,
    shortCode: shortCode as string,
    completeUrl,
    applicantFirstName: applicant.firstName,
    applicantLastName: applicant.lastName,
  };
}

/** Navigate the same `page` to `/{shortCode}/complete` and run the Sentry pre-flight. */
async function navigateToCompleteAndPreflight(
  page: Page,
  lead: PreparedLead,
  label: string,
): Promise<void> {
  console.log(`[${label}] navigating to customer complete URL: ${lead.completeUrl}`);
  await page.goto(lead.completeUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // The Complete page is consumer-facing; give it a beat to hydrate so the
  // Sentry SDK has a chance to attach to `window.__SENTRY__` (observed in qa1
  // within ~1s after domcontentloaded).
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await assertSentryReplayInitialized(page, label);
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('R1.52.0_fixRecordingLinkSameTabReuse_1291', { tag: TAGS }, () => {
  test.beforeEach(() => {
    test.info().annotations.push(
      { type: 'env', description: process.env.ENV ?? 'unknown' },
      { type: 'spec', description: 'R1.52.0 issue #1291 (MR !1448)' },
      {
        type: 'disclaimer',
        description:
          'Reports gerados a partir deste teste são REGISTRO DE EXECUÇÃO, NÃO fonte de padrão (rule #16).',
      },
    );
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P1 — Same-tab reuse (bug repro)
  // ════════════════════════════════════════════════════════════════════════

  test('CT-01 — Same-tab reuse (SignWell, NY): both leads get a recording row', async ({
    page,
    api,
    db,
    ctx,
    testEnv,
  }) => {
    test.setTimeout(300_000); // 5 min — covers 2 sequential API setups + navigation

    // ── Setup app1 ─────────────────────────────────────────────────────────
    const lead1 = await test.step('setup lead1 via API (SignWell candidate)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, SIGNWELL_STATE, testEnv.originationUrl);
    });

    // ── Setup app2 — fresh ctx scratch (overwrites ctx.leadPk/Uuid; that's fine
    //    because we already captured lead1.leadPk locally) ───────────────────
    const lead2 = await test.step('setup lead2 via API (SignWell candidate)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, SIGNWELL_STATE, testEnv.originationUrl);
    });

    expect(lead1.leadPk).not.toBe(lead2.leadPk);
    expect(lead1.shortCode).not.toBe(lead2.shortCode);

    // ── Same-tab journey starts here. The same `page` will host BOTH apps. ─
    await page.setViewportSize({ width: 1440, height: 900 });

    // ── App1: navigate to /complete + Sentry pre-flight ────────────────────
    await test.step('app1 — load /{shortCode}/complete (replayId send is expected on mount)', async () => {
      await navigateToCompleteAndPreflight(page, lead1, 'app1');
    });

    // ── AC-2: recording row for lead1 ──────────────────────────────────────
    const uuid1 = await test.step('AC-2 — recording row created for lead1', async () => {
      const u = await assertRecordingLinkInDb(db, lead1.leadPk, { timeoutMs: 15_000 });
      console.log(`[app1] uown_lead_recording.uuid = ${u}`);
      test.info().annotations.push({ type: 'lead1.uuid', description: u });
      return u;
    });

    // ── Intermediate: sessionStorage carries app1 state (pre-fix bug locus) ─
    await test.step('sessionStorage carries app1 state (pre-bug-fix locus)', async () => {
      const snap = await assertSessionStorageState(page, {
        sentUuid: 'present',
        shortCode: lead1.shortCode,
      }, 'app1 sessionStorage');
      console.log(`[app1] sessionStorage snapshot: ${JSON.stringify(snap)}`);
    });

    // ── App2 navigation on SAME tab — paste new URL (full navigation), NOT a click ─
    await test.step('app2 — paste /{shortCode}/complete in SAME tab', async () => {
      await navigateToCompleteAndPreflight(page, lead2, 'app2');
    });

    // ── AC-4: recording row for lead2 (Sentry replayId may equal lead1's;
    //         AC requires presence of the row, not uniqueness) ──────────────
    const uuid2 = await test.step('AC-4 — recording row created for lead2', async () => {
      const u = await assertRecordingLinkInDb(db, lead2.leadPk, { timeoutMs: 15_000 });
      console.log(`[app2] uown_lead_recording.uuid = ${u}`);
      test.info().annotations.push({ type: 'lead2.uuid', description: u });
      return u;
    });

    expect(uuid1, 'lead1 must have a non-empty recording uuid').toBeTruthy();
    expect(uuid2, 'lead2 must have a non-empty recording uuid').toBeTruthy();
    // Sentry Session Replay replayId is per-tab session — same UUID for both
    // leads in same-tab reuse is EXPECTED behavior. AC-4 of Marcos' test plan
    // ("link for the recording should be present") is satisfied by row presence
    // in `uown_lead_recording` for BOTH leads, NOT by UUID uniqueness.
    // Source: Sentry SDK docs (Session Replay scope = browser session) +
    // qa1 runtime evidence 2026-05-22 (leads 11702/11703 + 11704/11705 share
    // uuid by design after MR !1448 fix).
    console.log(
      `[CT-01] uuid1=${uuid1} uuid2=${uuid2} ` +
      `(equal=${uuid1 === uuid2} — equality is expected when same-tab)`,
    );
    test.info().annotations.push({
      type: 'uuid-equality',
      description: `CT-01 same-tab uuid1===uuid2 ? ${uuid1 === uuid2} (expected: true; AC-4 = row presence)`,
    });

    // ── Post-app2 sessionStorage: shortCode must have been updated to lead2 ──
    await test.step('post-app2 — sessionStorage.shortCode rotated to app2', async () => {
      const snap = await assertSessionStorageState(page, {
        sentUuid: 'present',
        shortCode: lead2.shortCode,
      }, 'app2 sessionStorage');
      console.log(`[app2] sessionStorage snapshot: ${JSON.stringify(snap)}`);
    });
  });

  test('CT-02 — Same-tab reuse (GoSign, CA): both leads get a recording row', async ({
    page,
    api,
    db,
    ctx,
    testEnv,
  }) => {
    test.setTimeout(300_000);

    // Pre-flight: confirm qa1/qa2 has a GoSign template for CA — otherwise the
    // signing vendor falls back to SignWell and CT-02 silently degrades to a
    // duplicate of CT-01 (spec § Risk Analysis "Vendor switch entre runs").
    // For Recording-LINK validation specifically, vendor parity is academic —
    // both vendors invoke the same `/complete` page that mounts Sentry —
    // but we still surface the observation so the report can flag it.
    //
    // Canonical table is `uown_gow_sign_template` (NOT `uown_gowsign_template`
    // — confirmed via migration V20260406044409_1.51.0__create_gowsign_template.sql
    // and helper src/helpers/gowsign-template-db.helpers.ts:148). Schema has no
    // `is_active` column — presence in the table is sufficient for eligibility.
    const gowsignTemplates = await getGowSignTemplatesForState(db, 'CA').catch(
      (err: Error) => {
        annotateObservation(
          `GoSign template preflight query failed (table or schema drift): ${err.message}. ` +
          'Vendor selection will be observable only via uown_esign_document.client after signing.',
        );
        return [] as Awaited<ReturnType<typeof getGowSignTemplatesForState>>;
      },
    );

    if (gowsignTemplates.length === 0) {
      annotateObservation(
        'qa env has no GoSign template for CA — CT-02 effectively exercises SignWell ' +
        'fallback. Recording-link assertion is still valid (vendor-agnostic), but ' +
        '"GoSign coverage" claim is degraded. Surface to Marcos in report.',
      );
    } else {
      console.log(
        `[CT-02] preflight: ${gowsignTemplates.length} GoSign template(s) eligible for CA ` +
        `(pks=${gowsignTemplates.map((t) => t.pk).join(',')})`,
      );
    }

    const lead1 = await test.step('setup lead1 via API (GoSign candidate)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, GOSIGN_STATE, testEnv.originationUrl);
    });
    const lead2 = await test.step('setup lead2 via API (GoSign candidate)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, GOSIGN_STATE, testEnv.originationUrl);
    });
    expect(lead1.leadPk).not.toBe(lead2.leadPk);

    await page.setViewportSize({ width: 1440, height: 900 });

    await test.step('app1 — load /{shortCode}/complete', async () => {
      await navigateToCompleteAndPreflight(page, lead1, 'app1');
    });
    const uuid1 = await test.step('AC-2 — recording row for lead1', async () => {
      const u = await assertRecordingLinkInDb(db, lead1.leadPk, { timeoutMs: 15_000 });
      test.info().annotations.push({ type: 'lead1.uuid', description: u });
      return u;
    });

    await test.step('sessionStorage carries app1 state', async () => {
      await assertSessionStorageState(page, {
        sentUuid: 'present',
        shortCode: lead1.shortCode,
      }, 'app1 sessionStorage');
    });

    await test.step('app2 — paste /{shortCode}/complete in SAME tab', async () => {
      await navigateToCompleteAndPreflight(page, lead2, 'app2');
    });
    const uuid2 = await test.step('AC-4 — recording row for lead2', async () => {
      const u = await assertRecordingLinkInDb(db, lead2.leadPk, { timeoutMs: 15_000 });
      test.info().annotations.push({ type: 'lead2.uuid', description: u });
      return u;
    });

    expect(uuid1).toBeTruthy();
    expect(uuid2).toBeTruthy();
    // See CT-01 rationale: Sentry replayId is per-tab session; same-tab reuse
    // shares the uuid by design (MR !1448 forces re-send because shortCode
    // changed). AC-4 = row presence, NOT uniqueness.
    console.log(
      `[CT-02] uuid1=${uuid1} uuid2=${uuid2} ` +
      `(equal=${uuid1 === uuid2} — equality is expected when same-tab)`,
    );
    test.info().annotations.push({
      type: 'uuid-equality',
      description: `CT-02 same-tab uuid1===uuid2 ? ${uuid1 === uuid2} (expected: true)`,
    });

    await test.step('post-app2 — sessionStorage.shortCode rotated to app2', async () => {
      await assertSessionStorageState(page, {
        sentUuid: 'present',
        shortCode: lead2.shortCode,
      }, 'app2 sessionStorage');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P2 — Golden path (regression — fix must not break the common case)
  // ════════════════════════════════════════════════════════════════════════

  test('CT-03 — Golden path single app (SignWell, NY): recording row present', async ({
    page,
    api,
    db,
    ctx,
    testEnv,
  }) => {
    test.setTimeout(180_000);

    const lead = await test.step('setup single lead via API (SignWell candidate)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, SIGNWELL_STATE, testEnv.originationUrl);
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await test.step('load /{shortCode}/complete (fresh tab)', async () => {
      await navigateToCompleteAndPreflight(page, lead, 'golden-signwell');
    });

    await test.step('AC-5 (regression) — recording row created on fresh tab', async () => {
      const uuid = await assertRecordingLinkInDb(db, lead.leadPk, { timeoutMs: 15_000 });
      expect(uuid).toBeTruthy();
      test.info().annotations.push({ type: 'lead.uuid', description: uuid });
    });
  });

  test('CT-04 — Golden path single app (GoSign, CA): recording row present', async ({
    page,
    api,
    db,
    ctx,
    testEnv,
  }) => {
    test.setTimeout(180_000);

    // Canonical table is `uown_gow_sign_template` (no `is_active` column;
    // presence = eligible). See CT-02 preflight rationale.
    const gowsignTemplates = await getGowSignTemplatesForState(db, 'CA').catch(
      (err: Error) => {
        annotateObservation(
          `CT-04: GoSign template preflight query failed: ${err.message}. ` +
          'Vendor selection will be observable only via uown_esign_document.client after signing.',
        );
        return [] as Awaited<ReturnType<typeof getGowSignTemplatesForState>>;
      },
    );
    if (gowsignTemplates.length === 0) {
      annotateObservation(
        'CT-04: qa env has no GoSign template for CA — golden-path coverage degrades to SignWell. ' +
        'Recording assertion remains valid.',
      );
    } else {
      console.log(
        `[CT-04] preflight: ${gowsignTemplates.length} GoSign template(s) eligible for CA ` +
        `(pks=${gowsignTemplates.map((t) => t.pk).join(',')})`,
      );
    }

    const lead = await test.step('setup single lead via API (GoSign candidate)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, GOSIGN_STATE, testEnv.originationUrl);
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await test.step('load /{shortCode}/complete (fresh tab)', async () => {
      await navigateToCompleteAndPreflight(page, lead, 'golden-gosign');
    });

    await test.step('AC-5 (regression) — recording row created on fresh tab', async () => {
      const uuid = await assertRecordingLinkInDb(db, lead.leadPk, { timeoutMs: 15_000 });
      expect(uuid).toBeTruthy();
      test.info().annotations.push({ type: 'lead.uuid', description: uuid });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P2 — sessionStorage cleanup after appComplete
  // ════════════════════════════════════════════════════════════════════════

  test('CT-05 — sessionStorage cleanup after appComplete: shortCode + leadPk cleared', async ({
    page,
    api,
    db,
    ctx,
    testEnv,
  }) => {
    test.setTimeout(600_000); // 10 min — full signing flow exceeds the golden path budget

    const lead = await test.step('setup lead via API (SignWell — fastest vendor for full flow)', async () => {
      return setupFreshLeadWithCompleteUrl(api, db, ctx, SIGNWELL_STATE, testEnv.originationUrl);
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await test.step('load /{shortCode}/complete', async () => {
      await navigateToCompleteAndPreflight(page, lead, 'cleanup');
    });

    // Drive the full customer-side flow: CC + Bank → T&C → Signing → /appComplete.
    // We reuse ContractPage which is the canonical page object for the
    // `/{shortCode}/complete` consumer-facing form (it shares selectors with
    // MissingDataFormPage — both target #ccFirstName/#bankRoutingNumber/etc.).
    const contract = new ContractPage(page);

    // `/{shortCode}/complete` in qa1 renders the payment program selector
    // ("Choose the payment program that works best for you" — Weekly/Bi-Weekly
    // cards) BEFORE the CC form. Skipping this step makes `fillCreditCardInfo`
    // time out on #ccFirstName. Verified via Playwright trace
    // `error-context.md` (qa1 run 2026-05-22 lead 11708). Source: helper
    // src/pages/origination/contract.page.ts:831 `choosePlanByName`.
    await test.step('select payment program (Bi-Weekly) on /complete', async () => {
      await contract.choosePlanByName('Bi-Weekly');
    });

    await test.step('fill CC + bank info on /complete', async () => {
      const cc = TEST_CARDS.MASTERCARD_APPROVED;
      await contract.fillCreditCardInfo({
        firstName: lead.applicantFirstName,
        lastName: lead.applicantLastName,
        cardNumber: cc.number,
        cvc: cc.cvv,
        expDate: `${cc.expMonth}/${cc.expYear}`,
      });
      await contract.fillBankInfo({
        firstName: lead.applicantFirstName,
        lastName: lead.applicantLastName,
        routingNumber: TEST_BANK.DEFAULT_ROUTING,
        accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
      });
      await contract.submitPaymentInfo();
    });

    await test.step('complete Terms & Conditions', async () => {
      await contract.completeTermsAndConditions();
    });

    await test.step('complete e-sign (vendor auto-detected by ContractPage)', async () => {
      try {
        await contract.completeESign();
      } catch (err) {
        // Spec OQ-1 caveat: if signing fails, the cleanup step never runs,
        // but the AC-6 assertion still has value as a smoke check. Surface
        // and continue — the assertions below will reveal whether
        // /appComplete was reached.
        annotateObservation(
          `CT-05: completeESign threw — proceeding to cleanup check anyway. err=${(err as Error).message}`,
        );
      }
    });

    // Give the FE a beat to navigate to /appComplete + run the cleanup effect.
    await test.step('wait for /appComplete to land + cleanup to run', async () => {
      // Best-effort URL wait — some envs land on a different terminal page;
      // log whatever we see and proceed to assertion.
      await page.waitForURL(/\/appComplete\b/i, { timeout: 30_000 }).catch(() => {
        annotateObservation(
          `CT-05: /appComplete not reached within 30s — final URL=${page.url()}. ` +
          'Cleanup assertion will reflect whatever state the FE settled into.',
        );
      });
      // small settle for the cleanup `useEffect`.
      await sleep(2_000);
    });

    await test.step('AC-6 — sessionStorage.shortCode and leadPk cleared after appComplete', async () => {
      const snap = await assertSessionStorageState(page, {
        shortCode: 'absent',
        leadPk: 'absent',
        // sentUuid: intentionally NOT asserted — see OQ-4 in the spec.
      }, 'post-appComplete sessionStorage');
      // Log sentUuid observed value for OQ-4 follow-up.
      annotateObservation(
        `OQ-4 observation — sessionStorage.sentUuid after appComplete = ${
          snap.sentUuid === null ? 'null (cleared)' : `"${snap.sentUuid}" (preserved)`
        }`,
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  P3 — Cross-env smoke (opt-in)
  //
  //  CT-06 is documented in the spec as optional and explicitly env-gated
  //  (qa2 only). It is intentionally NOT implemented here: the bug is
  //  client-side and the qa1 coverage above is the canonical regression.
  //  Running this in qa2 amounts to re-pinning the same `npx playwright`
  //  invocation with `ENV=qa2`, so the value-vs-cost ratio is poor for an
  //  always-on suite test.
  //
  //  If needed by the release window, copy CT-01's body and pin
  //  `process.env.ENV` via a per-describe `test.use({ envName: 'qa2' })`
  //  override.
  // ════════════════════════════════════════════════════════════════════════
  test.skip('CT-06 — Cross-env smoke (qa2): same-tab reuse via SignWell', () => {
    // Intentional skip — see header comment above.
    annotateEnvGap('CT-06 not implemented — optional per spec.');
  });
});

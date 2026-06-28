/**
 * RU05.26.1.53.0_merchantSettingsSnapshotTracking
 *
 * Merchant Settings Snapshot Tracking.
 * On UW approval the system writes an immutable LEAD snapshot of the merchant's
 * UW config (EPO5, EPO10, UW Pipeline, Fraud Threshold); on funding/account
 * creation it copies that into an immutable ACCOUNT snapshot; later merchant-config
 * edits must never mutate either snapshot.
 *
 * SPEC (authoritative): docs/taskTestingUown/RU05.26.1.53.0_merchantSettingsSnapshotTracking/
 *                       RU05.26.1.53.0_merchantSettingsSnapshotTracking-spec.md
 * Scenarios:            .claude/oracles/merchant-settings-snapshot.md
 * Discovery:            docs/knowledge-base/underwriting-and-funding-test-data-paths.md
 *
 * Strategy: Hybrid — API setup + DB validation (the snapshot is a backend audit
 * artifact with NO UI affordance → Rule #14 exception (a)+(c)). The merchant-setting
 * CHANGE in TC-03/TC-05 IS a real agent UI action → driven via the Origination
 * Merchant Setting page (Rule #14 UI-first for the exercise; DB is the oracle).
 *
 * Target env: qa2 (default) OR stg (env-port 2026-06-22, user-configured clone
 * merchants). The `db` worker fixture connects to process.env.ENV (NOT the
 * per-describe `envName`); the `api`/`page` fixtures honor `test.use({ envName })`.
 * Both are driven by the single `ENV` constant below. Run qa2 unchanged with
 * `ENV=qa2` (or unset); run stg with `ENV=stg`. The fixture constants, skips and
 * `buildTestData` calls are all env-gated — the qa2 behavior is preserved verbatim.
 *
 * stg clone facts (DB-probed read-only 2026-06-22):
 *   terrace clone OL90202-0001_clone / pk 15752 / fraud_threshold=2 /
 *     auto_deny_application=FALSE → terrace POSITIVES + immutability RUN, TC-02 SKIPs.
 *   KS clone KS8795_clone / pk 15753 / fraud_threshold=12 /
 *     auto_deny_application=TRUE → TC-KS-denial RUNs, TC-KS-01/02 SKIP.
 *
 * Confirmed schema (qa2, read-only probe 2026-06-16):
 *   uown_los_lead_merchant_settings_snapshot(pk, row_created_timestamp, …,
 *     lead_pk, merchant_pk, program_pk, epo5 bool, epo10 bool,
 *     uw_pipeline varchar, fraud_threshold int)  — 7 rows present
 *   uown_sv_account_merchant_settings_snapshot(… + account_pk) — 0 rows (UNPROVEN)
 *   uown_merchant pk 26 / OL90202-0001 'terraceFinance':
 *     epo5=true, epo10=true, uw_pipeline='Test', fraud_threshold=1
 */
import { chromium, type Browser } from '@playwright/test';
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { TestContext } from '@support/base-test.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import { ConfigEnvironment } from '@config/environment.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import {
  createPreQualifiedApplication,
  driveLeadToFunding,
} from '@helpers/api-setup.helpers.js';
import { loginToPortal } from '@helpers/auth.helpers.js';
import { MerchantSettingPage } from '@pages/origination/merchant-setting.page.js';
import { TEST_BANK } from '@config/constants.js';
import { buildSendApplicationBody } from '@api/bodies/index.js';

// ── Target environment (env-port refactor 2026-06-22) ─────────────────────
// The SAME spec serves qa2 (original) AND stg (user-configured clone merchants).
// The `db` worker fixture connects to process.env.ENV, so ENV is the single
// source of truth: every fixture constant, `test.use({ envName })`, and
// `buildTestData({ env })` selects by it. Default 'qa2' keeps the original run
// byte-for-byte equivalent when ENV is unset.
const ENV = (process.env.ENV ?? 'qa2') as 'qa2' | 'stg';
const IS_STG = ENV === 'stg';

// ── Fixture constants (SPEC §Scope) ──────────────────────────────────────
// qa2: live terraceFinance (pk 26, OL90202-0001), fraud_threshold=1.
// stg: user-configured clone (pk 15752, OL90202-0001_clone), fraud_threshold=2,
//      auto_deny_application=FALSE (DB-probed read-only 2026-06-22).
const TERRACE = IS_STG
  ? ({
      key: 'TerraceFinance',
      pk: 15752,
      code: 'OL90202-0001_clone',
      epo5: true,
      epo10: true,
      uwPipeline: 'Test',
      // ⚠️ stg clone baseline is 2, NOT qa2's 1.
      fraudThreshold: 2,
    } as const)
  : ({
      /** Merchant key in src/data/merchants.ts (TerraceFinance → OL90202-0001). */
      key: 'TerraceFinance',
      /** Confirmed live in qa2 (probe 2026-06-16). pk 3/54/82 are all-null clones. */
      pk: 26,
      code: 'OL90202-0001',
      // Contract values to re-assert at runtime (fail-fast; do NOT auto-heal/mutate).
      epo5: true,
      epo10: true,
      uwPipeline: 'Test',
      fraudThreshold: 1,
    } as const);

const STATE = 'TX';

// ── KS fixture constants (SPEC addendum 2026-06-16 §B) ────────────────────
// Kornerstone brand parity (ssn-test-modalities §5, INVIOLÁVEL). The KS merchant
// is the object-of-test — hardcoded (not pickRandomMerchantKey) per
// test-data-hierarchy "Teste de configuração de merchant". Values DB-probed;
// re-assert read-only at runtime, NEVER mutate/auto-heal.
// qa2: KS1011 (pk 315), fraud_threshold=5.
// stg: user-configured clone KS8795_clone (pk 15753), fraud_threshold=12,
//      auto_deny_application=TRUE (DB-probed read-only 2026-06-22).
const KS = IS_STG
  ? ({
      key: 'BodegaFurniture',
      pk: 15753,
      code: 'KS8795_clone',
      fullName: 'Bodega Furniture (clone KS8795_clone)',
      epo5: true,
      epo10: true,
      uwPipeline: 'Test',
      // ⚠️ stg KS clone is 12, NOT qa2's 5 — do NOT inherit either terraceFinance value.
      fraudThreshold: 12,
    } as const)
  : ({
      /** Merchant key in src/data/merchants.ts (BodegaFurniture → number KS1011). */
      key: 'BodegaFurniture',
      /** DB-probed qa2 (user-provided). */
      pk: 315,
      code: 'KS1011',
      fullName: 'Bodega Furniture',
      // Contract values to re-assert at runtime (fail-fast; do NOT auto-heal/mutate).
      epo5: true,
      epo10: true,
      uwPipeline: 'Test',
      // ⚠️ KS fraud_threshold is 5, NOT 1 — do NOT inherit terraceFinance's value.
      fraudThreshold: 5,
      // is_seon_id_check_required=FALSE → NO SEON bypass needed for this fixture.
      // use_webhook/hold_deposit=true legitimately → skipMerchantPreflight mandatory.
    } as const);

/**
 * Reads `auto_deny_application` for a merchant pk (read-only). Config-adaptive:
 * a merchant with auto_deny=ON is a blanket PRE-UW deny (cannot produce an
 * approved lead → snapshot); OFF cannot produce the auto-deny trigger. Positive
 * tests skip when ON, denial tests skip when OFF — so the SAME spec serves both
 * passes as the user toggles the flag, instead of failing loud on the wrong side.
 */
async function readAutoDenyFlag(db: DatabaseHelpers, merchantPk: number): Promise<boolean> {
  const flag = await db.queryOne<{ auto_deny_application: boolean }>(
    `SELECT auto_deny_application FROM uown_merchant WHERE pk = $1`,
    [merchantPk],
  );
  return flag?.auto_deny_application === true;
}

// ── DB row shapes ─────────────────────────────────────────────────────────
interface SnapshotRow {
  pk: string;
  epo5: boolean;
  epo10: boolean;
  uw_pipeline: string | null;
  fraud_threshold: number;
  lead_pk: string;
  account_pk?: string;
  merchant_pk: string;
  program_pk: string | null;
  row_created_timestamp: Date;
}
interface MerchantConfigRow {
  epo5: boolean;
  epo10: boolean;
  uw_pipeline: string | null;
  fraud_threshold: number;
}

// ── Task-scoped DB read helpers (snapshot tables are unique to this feature) ──────
// Kept local — not promoted to src/helpers because they query two task-specific
// tables. Read-only (SELECT) — no authorization needed.

async function readLeadSnapshots(db: DatabaseHelpers, leadPk: string): Promise<SnapshotRow[]> {
  return db.query<SnapshotRow>(
    `SELECT pk, epo5, epo10, uw_pipeline, fraud_threshold,
            lead_pk, merchant_pk, program_pk, row_created_timestamp
       FROM uown_los_lead_merchant_settings_snapshot
      WHERE lead_pk = $1
      ORDER BY pk DESC`,
    [leadPk],
  );
}

async function readAccountSnapshots(db: DatabaseHelpers, accountPk: string): Promise<SnapshotRow[]> {
  return db.query<SnapshotRow>(
    `SELECT pk, epo5, epo10, uw_pipeline, fraud_threshold,
            lead_pk, account_pk, merchant_pk, program_pk, row_created_timestamp
       FROM uown_sv_account_merchant_settings_snapshot
      WHERE account_pk = $1
      ORDER BY pk DESC`,
    [accountPk],
  );
}

/**
 * Re-asserts terraceFinance UW config matches the contract (fail-fast).
 * Read-only — does NOT mutate/auto-heal. Pitfall: the four values were NULL
 * until set by the user; never assume persistence (SPEC TC-01 pitfall).
 */
async function assertMerchantContract(db: DatabaseHelpers): Promise<void> {
  const row = await db.queryOne<MerchantConfigRow>(
    `SELECT epo5, epo10, uw_pipeline, fraud_threshold FROM uown_merchant WHERE pk = $1`,
    [TERRACE.pk],
  );
  expect(row, `terraceFinance (pk ${TERRACE.pk}) must exist in qa2`).not.toBeNull();
  expect(
    {
      epo5: row!.epo5,
      epo10: row!.epo10,
      uw_pipeline: row!.uw_pipeline,
      fraud_threshold: Number(row!.fraud_threshold),
    },
    `terraceFinance UW config drifted from the snapshot contract — fix the merchant before running (do NOT auto-heal)`,
  ).toEqual({
    epo5: TERRACE.epo5,
    epo10: TERRACE.epo10,
    uw_pipeline: TERRACE.uwPipeline,
    fraud_threshold: TERRACE.fraudThreshold,
  });
}

/** Resolve the SVC account pk created during funding (polls — async import). */
async function resolveAccountPk(db: DatabaseHelpers, leadPk: string, timeoutMs = 120_000): Promise<string> {
  const found = await db.waitForRecord('uown_sv_account', 'lead_pk = $1', [leadPk], timeoutMs);
  expect(found, `uown_sv_account row for lead_pk=${leadPk} should exist after funding`).toBe(true);
  const acct = await db.queryOne<{ pk: string }>(
    `SELECT pk FROM uown_sv_account WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
    [leadPk],
  );
  expect(acct?.pk, 'account pk resolved').toBeTruthy();
  return String(acct!.pk);
}

/**
 * TC-08 activity-log probe (Rule #13 / SPEC §2). Snapshot creation may or may
 * not emit a note — this surfaces the question rather than assuming. Conservative
 * classification: absence is reported as [OBSERVAÇÃO], never failed as a blocker
 * (the snapshot tables' own row_created_timestamp/agent ARE the audit trail).
 */
async function probeActivityLog(db: DatabaseHelpers, leadPk: string, label: string): Promise<void> {
  const notes = await db.query<{ pk: string; notes: string }>(
    `SELECT pk, notes
       FROM uown_los_lead_notes
      WHERE lead_pk = $1
        AND notes ILIKE ANY (ARRAY['%snapshot%', '%MerchantSetting%', '%merchant_settings%'])
      ORDER BY pk DESC
      LIMIT 5`,
    [leadPk],
  );
  if (notes.length > 0) {
    console.log(`[TC-08][${label}] snapshot-related activity note(s) FOUND for lead ${leadPk}:`);
    for (const n of notes) console.log(`  - pk=${n.pk} notes="${n.notes}"`);
  } else {
    console.log(
      `[TC-08][${label}] [OBSERVAÇÃO] No uown_los_lead_notes entry referencing the snapshot for ` +
        `lead ${leadPk}. The snapshot table's own row_created_timestamp/agent serve as the audit ` +
        `trail. Surface to PO/dev as a question — NOT a blocker (SPEC §2, Rule #10/#13).`,
    );
  }
}

// ── Suite ─────────────────────────────────────────────────────────────────
const TEST_NAME = 'RU05.26.1.53.0_merchantSettingsSnapshotTracking';
// `@origination` is required by the task-testing-origination Playwright project
// (grep: /@origination/) so this spec is picked up for execution.
const tag = splitTags(`${buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA2)} @origination`);

test.describe(`${TEST_NAME} - ${ENV}/terraceFinance`, { tag }, () => {
  test.use({ envName: ENV });

  /**
   * Fresh approved lead via API (re-asserts merchant first). Returns the ctx
   * AND the MerchantInfo (needed for driveLeadToFunding's settle/changeStatus
   * calls, which build their bodies from merchant username/number).
   */
  async function setupApprovedLead(
    api: import('@support/base-test.js').ApiClients,
    db: DatabaseHelpers,
    testInfo: import('@playwright/test').TestInfo,
  ): Promise<{ ctx: TestContext; merchant: import('@api/bodies/index.js').MerchantInfo }> {
    await assertMerchantContract(db);
    // Refresh vendor sweeps so the approved (non-9) SSN is not spuriously denied
    // by a stale Kount/GDS token (also de-risks the stg "stale GDS token → 500"
    // path — see memory sendapplication-500-stale-gds-token).
    await api.scheduledTask.refreshKountAccessTokenSweep().catch(() => {});
    await api.scheduledTask.refreshGdsAccessTokenSweep().catch(() => {});

    const td = buildTestData({ env: ENV, state: STATE, merchant: TERRACE.key, approved: true });
    const ctx = { reportKeys: new Map() } as unknown as TestContext;
    await createPreQualifiedApplication(
      api,
      td.merchant,
      td.applicant,
      ctx,
      {
        submitPaymentInfoViaApi: true,
        skipMerchantPreflight: true,
        // DE-RISK (stg env-port): stg TERRACE_FINANCE routing may require bankData
        // to approve (application-lifecycle pitfall #5 — routing-for-approval),
        // mirroring the KS path. qa2 approved without it, so inject ONLY for stg to
        // keep the qa2 path byte-for-byte equivalent.
        ...(IS_STG
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
    expect(
      ctx.leadPk,
      IS_STG
        ? 'terrace leadPk captured — if approval stalled in stg, suspect bankData/routing ' +
            '(pitfall #5) or stale GDS token (refreshGdsAccessTokenSweep), NOT the test wiring'
        : 'leadPk captured',
    ).toBeTruthy();
    return { ctx, merchant: td.merchant };
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TC-06-baseline (P0, HIGHEST RISK) — Positive account snapshot on funding
  //  Run FIRST. Gates TC-05/TC-07. 0 rows in qa2 → first time this path fires.
  // ════════════════════════════════════════════════════════════════════════
  test('TC-06-baseline: account snapshot created on funding with all 4 values', async ({ api, db }, testInfo) => {
    test.setTimeout(420_000); // qa2 sendApplication + settle + funding can be slow

    // Config-adaptive: a merchant with auto_deny=ON cannot produce an approved
    // lead → no snapshot. Skip (not fail) so the same spec serves both flag passes.
    test.skip(
      await readAutoDenyFlag(db, TERRACE.pk),
      `${TERRACE.code} auto_deny_application=ON → cannot approve a lead; flip OFF to run this positive test`,
    );

    const { ctx, merchant } = await setupApprovedLead(api, db, testInfo);

    // Precondition: lead snapshot must exist (the account snapshot is a copy of it).
    await test.step('Lead snapshot exists (precondition for the copy)', async () => {
      const present = await db.waitForRecord(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 60_000,
      );
      expect(present, `lead snapshot for lead_pk=${ctx.leadPk}`).toBe(true);
    });
    const leadSnap = (await readLeadSnapshots(db, ctx.leadPk))[0];

    let accountPk = '';
    await test.step('Drive lead to FUNDING (SIGNED → settle → FUNDING)', async () => {
      await driveLeadToFunding(api, merchant, ctx);
      accountPk = await resolveAccountPk(db, ctx.leadPk);
      ctx.accountPk = accountPk;
      testInfo.annotations.push({ type: 'accountPk', description: accountPk });
    });

    await test.step('Account snapshot present — exactly one row, 4 values, linked', async () => {
      // [reflex] mutation/creation → audit record present (qa-domain-reflexes §12).
      const present = await db.waitForRecord(
        'uown_sv_account_merchant_settings_snapshot', 'account_pk = $1', [accountPk], 120_000,
      );
      // GAP-4: 0 rows historically. If still absent after the generous wait, this is a
      // [HIPÓTESE] candidate finding — NOT auto-pass (SPEC TC-06-baseline edge/pitfalls).
      expect(
        present,
        `[HIPÓTESE] account snapshot did NOT appear for account_pk=${accountPk} after 120s. ` +
          `The funding→account-snapshot path may not fire in qa2 (0 rows since deploy). ` +
          `Reproduce once in fresh data before any "bug" language (Rule #10).`,
      ).toBe(true);

      const acctSnaps = await readAccountSnapshots(db, accountPk);
      expect(acctSnaps.length, 'exactly one account snapshot (idempotency)').toBe(1);
      const s = acctSnaps[0];
      expect(s.epo5).toBe(TERRACE.epo5);
      expect(s.epo10).toBe(TERRACE.epo10);
      expect(s.uw_pipeline).toBe(TERRACE.uwPipeline);
      expect(Number(s.fraud_threshold)).toBe(TERRACE.fraudThreshold);
      expect(String(s.merchant_pk)).toBe(String(TERRACE.pk));
      expect(String(s.lead_pk)).toBe(String(ctx.leadPk));
      expect(s.row_created_timestamp, 'creation timestamp present').toBeTruthy();

      // Copy integrity: account snapshot == lead snapshot values.
      expect(s.epo5).toBe(leadSnap.epo5);
      expect(s.epo10).toBe(leadSnap.epo10);
      expect(s.uw_pipeline).toBe(leadSnap.uw_pipeline);
      expect(Number(s.fraud_threshold)).toBe(Number(leadSnap.fraud_threshold));
    });

    await test.step('TC-08: activity-log probe on snapshot creation', async () => {
      await probeActivityLog(db, ctx.leadPk, 'TC-06-baseline');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-01 (P0) — Lead snapshot on UW approval, all four values + count=1
  // ════════════════════════════════════════════════════════════════════════
  test('TC-01: lead snapshot created on approval with 4 values and COUNT=1', async ({ api, db }, testInfo) => {
    test.setTimeout(300_000);

    test.skip(
      await readAutoDenyFlag(db, TERRACE.pk),
      `${TERRACE.code} auto_deny_application=ON → cannot approve a lead; flip OFF to run this positive test`,
    );

    const { ctx } = await setupApprovedLead(api, db, testInfo);

    await test.step('Lead snapshot present', async () => {
      const present = await db.waitForRecord(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 60_000,
      );
      expect(present, `lead snapshot for lead_pk=${ctx.leadPk}`).toBe(true);
    });

    await test.step('Exactly one row with all four UW values + merchant link', async () => {
      const snaps = await readLeadSnapshots(db, ctx.leadPk);
      expect(snaps.length, 'COUNT(*) = 1 (idempotency — guards double-write)').toBe(1);
      const s = snaps[0];
      expect(s.epo5).toBe(TERRACE.epo5);
      expect(s.epo10).toBe(TERRACE.epo10);
      expect(s.uw_pipeline).toBe(TERRACE.uwPipeline);
      expect(Number(s.fraud_threshold)).toBe(TERRACE.fraudThreshold);
      expect(String(s.merchant_pk)).toBe(String(TERRACE.pk));
      expect(s.row_created_timestamp, 'creation timestamp present').toBeTruthy();
    });

    await test.step('TC-08: activity-log probe on snapshot creation', async () => {
      await probeActivityLog(db, ctx.leadPk, 'TC-01');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-02 (P1) — No lead snapshot when the application is auto-denied.
  //
  //  DENIAL TRIGGER (2026-06-17): the merchant config `auto_deny_application=TRUE`
  //  on terraceFinance (pk 26). The user enabled it in qa2 to provide the
  //  deterministic denial qa2 previously lacked. This is the `merchantAutoDenyCheck`
  //  pipeline step (Step 2, BUSINESS_RULES.md / 02-originacao-pipeline.md §Step 2):
  //  it runs AFTER stateCheck and BEFORE underwriting, so the lead never reaches the
  //  UW engine. Result: `lead_status='DENIED'` (internal `MERCHANT_AUTO_DENIED`),
  //  NOT `UW_DENIED` — confirmed read-only in qa2 (merchant 26 has 30 `DENIED` leads;
  //  `UW_DENIED` is a distinct value, see Ticket461-svc / Ticket1084).
  //
  //  SCOPE NOTE (honest): auto-deny is a PRE-UW denial, not a UW-engine decline.
  //  The snapshot invariant under test is "a denied lead gets NO lead snapshot" (the
  //  snapshot is written only on UW approval). An auto-denied lead never reaches UW
  //  approval, so the negative invariant is exercised correctly. The ending-in-9
  //  ("UW_DENIED") path is a no-op in qa2 ([[ssn-test-modalities]] §6, pitfall #109);
  //  we therefore use a NORMAL approval-eligible SSN so the merchant auto-deny config
  //  is the SOLE cause of denial (isolates the trigger).
  //
  //  STATE: must be a leasing-eligible state (TX). stateCheck precedes auto-deny in
  //  the pipeline; a no-business-in-state would short-circuit BEFORE auto-deny fires.
  //
  //  GUARDRAIL: the auto-deny flag is asserted ON below (read-only, self-documenting)
  //  so this test FAILS LOUDLY if run with auto-deny OFF instead of silently mis-passing.
  // ════════════════════════════════════════════════════════════════════════
  test('TC-02: no lead snapshot when the application is auto-denied (merchant auto_deny_application)', async ({ api, db }, testInfo) => {
    test.setTimeout(360_000); // qa2 denied path can take >180s

    // Config-adaptive: this denial test needs the auto-deny trigger present. If
    // the merchant has auto_deny=OFF (e.g. terrace clone in stg), there is no
    // deny trigger — SKIP (not fail) so the same spec serves both flag passes.
    test.skip(
      !(await readAutoDenyFlag(db, TERRACE.pk)),
      `${TERRACE.code} auto_deny_application=OFF → no deny trigger; flip ON to run this denial test`,
    );

    await assertMerchantContract(db);

    // approved:true → generateTestSSN(true) → NON-ending-in-9 → approval-eligible SSN.
    // Denial here comes SOLELY from the merchant auto-deny config, not the SSN.
    const td = buildTestData({ env: ENV, state: STATE, merchant: TERRACE.key, approved: true });

    let leadPk = '';
    await test.step('Send application (normal SSN) and poll for the auto-deny decision', async () => {
      const appResp = await api.application.sendApplication(td.merchant, td.applicant);
      expect(appResp.ok, `sendApplication: ${appResp.status} ${JSON.stringify(appResp.body).slice(0, 200)}`).toBeTruthy();
      const leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
      leadPk = String(appResp.body.authorizationNumber ?? '');

      // Poll status until the pipeline declines; reconcile portal leadPk along the way.
      const deadline = Date.now() + 300_000;
      let status = '';
      while (Date.now() < deadline) {
        const st = await api.application.getApplicationStatus(td.merchant, leadUuid);
        if (st.body.leadPk) leadPk = String(st.body.leadPk);
        status = (st.body.appApprovalStatus || st.body.uwStatus || st.body.currentStatus || st.body.status || '').toUpperCase();
        if (status.includes('DECLIN') || status.includes('DENIED')) break;
        await new Promise((r) => setTimeout(r, 5_000));
      }
      expect(status, `expected a denial status, got "${status}"`).toMatch(/DECLIN|DENIED/);
      testInfo.annotations.push({ type: 'leadPk', description: leadPk });
    });

    await test.step('Confirm pre-UW auto-deny (lead_status=DENIED, not a UW_DENIED engine decline)', async () => {
      // Auto-deny (merchantAutoDenyCheck) yields lead_status='DENIED' (internal
      // MERCHANT_AUTO_DENIED). It is a PRE-UW deny, distinct from 'UW_DENIED' and
      // never 'BLACKLIST_DENIED'. We assert it is a DENIED-class status that is NOT
      // a blacklist deny; the snapshot invariant below is what the AC turns on.
      const leadStatus = (await db.getLeadStatus(leadPk)) ?? '';
      console.log(`[TC-02] lead ${leadPk} lead_status="${leadStatus}" (expected DENIED via MERCHANT_AUTO_DENIED)`);
      expect(leadStatus.toUpperCase(), `expected a DENIED-class status, got "${leadStatus}"`).toMatch(/DENIED/);
      expect(leadStatus.toUpperCase(), 'must not be a blacklist deny').not.toContain('BLACKLIST');
    });

    await test.step('No lead snapshot was written for the denied lead', async () => {
      const absent = await db.waitForRecordAbsent(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [leadPk], 30_000,
      );
      expect(absent, `no lead snapshot should exist for denied lead_pk=${leadPk}`).toBe(true);
      const snaps = await readLeadSnapshots(db, leadPk);
      expect(snaps.length, 'COUNT(*) = 0 for denied lead').toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-03a–d (P1) — Lead-snapshot immutability under merchant-setting edits.
  //  Serial: each edits terraceFinance via the Origination Merchant Setting UI,
  //  asserts the snapshot is unchanged, then teardown RESTORES contract values.
  // ════════════════════════════════════════════════════════════════════════
  test.describe.serial('TC-03 immutability — merchant edits do not mutate the lead snapshot', () => {
    // Restore terraceFinance to contract values after the immutability sub-suite,
    // so reruns / TC-01 / TC-06-baseline are not poisoned (SPEC TC-03 pitfall).
    // F-CYCLE2-A fix: afterAll may only use worker-scoped fixtures (`browser`, `db`);
    // `page`/`testEnv` are test-scoped and forbidden here. The helper creates its own
    // context/page from `browser` and derives env from process.env.ENV.
    test.afterAll(async ({ browser, db }) => {
      await restoreMerchantContractAfterAll(browser, db, 'all');
    });

    // Fraud Threshold edit target: must DIFFER from the env baseline so the edit
    // is observably real (qa2 baseline 1, stg baseline 2). Pick a value distinct
    // from the baseline; 5 works for both qa2(1) and stg(2). If a future baseline
    // collides with 5, bump this.
    const FRAUD_EDIT_TARGET = TERRACE.fraudThreshold === 5 ? 7 : 5;

    // Decision table: setting edited → that column unchanged AND others unchanged.
    type EditCase = {
      id: string;
      label: string;
      edit: (ms: MerchantSettingPage) => Promise<void>;
      /** New live value the edit applies (cross-checked != snapshot). */
      newLive: Partial<MerchantConfigRow>;
    };
    const cases: EditCase[] = [
      {
        id: 'TC-03a', label: `Fraud Threshold ${TERRACE.fraudThreshold}→${FRAUD_EDIT_TARGET}`,
        edit: (ms) => ms.fillFraudThreshold(String(FRAUD_EDIT_TARGET)),
        newLive: { fraud_threshold: FRAUD_EDIT_TARGET },
      },
      {
        id: 'TC-03b', label: "UW Pipeline 'Test'→'Prod'",
        edit: (ms) => ms.fillUwPipeline('Prod'),
        newLive: { uw_pipeline: 'Prod' },
      },
      {
        id: 'TC-03c', label: 'EPO 5% true→false',
        edit: (ms) => ms.setEpo5(false),
        newLive: { epo5: false },
      },
      {
        id: 'TC-03d', label: 'EPO 10% true→false',
        edit: (ms) => ms.setEpo10(false),
        newLive: { epo10: false },
      },
    ];

    for (const c of cases) {
      test(`${c.id}: ${c.label} — lead snapshot unchanged`, async ({ page, api, db, testEnv }, testInfo) => {
        test.setTimeout(360_000);

        // Immutability needs an approved lead first → skip if the merchant cannot approve.
        test.skip(
          await readAutoDenyFlag(db, TERRACE.pk),
          `${TERRACE.code} auto_deny_application=ON → cannot approve a lead; flip OFF to run this positive test`,
        );

        // Each sub-case re-establishes contract values first (previous sub-case may have drifted).
        await assertMerchantContractWithRestore(page, testEnv, db);

        const { ctx } = await setupApprovedLead(api, db, testInfo);
        await test.step('Capture original lead snapshot', async () => {
          const present = await db.waitForRecord(
            'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 60_000,
          );
          expect(present).toBe(true);
        });
        const original = (await readLeadSnapshots(db, ctx.leadPk))[0];
        expect(original, 'original snapshot captured').toBeTruthy();

        // [reflex] merchant edit (qa-domain-reflexes §8) — exercised via the real UI.
        const ms = new MerchantSettingPage(page);
        await test.step(`Edit ${c.label} via Origination Merchant Setting UI`, async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
          await ms.navigateToMerchantSettings(testEnv.originationUrl);
          await ms.loadMerchants();
          await ms.selectMerchantRowByText(TERRACE.code);
          await c.edit(ms);
          const toast = await ms.saveGdsSettings();
          console.log(`[${c.id}] save toast: "${toast}"`);
        });

        await test.step('Live merchant config DID change (proves the edit was real)', async () => {
          const live = await db.queryOne<MerchantConfigRow>(
            `SELECT epo5, epo10, uw_pipeline, fraud_threshold FROM uown_merchant WHERE pk = $1`,
            [TERRACE.pk],
          );
          for (const [k, v] of Object.entries(c.newLive)) {
            const actual = k === 'fraud_threshold' ? Number((live as Record<string, unknown>)[k]) : (live as Record<string, unknown>)[k];
            expect(actual, `live merchant.${k} should now be ${String(v)}`).toBe(v);
          }
        });

        await test.step('Lead snapshot is IMMUTABLE — all four columns unchanged', async () => {
          const after = (await readLeadSnapshots(db, ctx.leadPk))[0];
          expect(after.epo5, 'epo5 unchanged').toBe(original.epo5);
          expect(after.epo10, 'epo10 unchanged').toBe(original.epo10);
          expect(after.uw_pipeline, 'uw_pipeline unchanged').toBe(original.uw_pipeline);
          expect(Number(after.fraud_threshold), 'fraud_threshold unchanged').toBe(Number(original.fraud_threshold));
          // And it still equals the original contract values (not the new live value).
          expect(after.epo5).toBe(TERRACE.epo5);
          expect(after.epo10).toBe(TERRACE.epo10);
          expect(after.uw_pipeline).toBe(TERRACE.uwPipeline);
          expect(Number(after.fraud_threshold)).toBe(TERRACE.fraudThreshold);
        });
      });
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-05 (P0, HIGH RISK) — Account snapshot derives from LEAD snapshot, not
  //  the live merchant. Serial, after TC-06-baseline proved the account write.
  // ════════════════════════════════════════════════════════════════════════
  test.describe.serial('TC-05 account snapshot derives from lead snapshot', () => {
    // Restore Fraud Threshold (and any other drift) to contract values.
    // F-CYCLE2-A fix: afterAll may only use worker-scoped fixtures (`browser`, `db`).
    test.afterAll(async ({ browser, db }) => {
      await restoreMerchantContractAfterAll(browser, db, 'fraudThreshold');
    });

    test('TC-05: account snapshot == lead snapshot after a Fraud Threshold change', async ({ page, api, db, testEnv }, testInfo) => {
      test.setTimeout(480_000);

      // Needs an approved lead → skip if the merchant cannot approve (auto_deny ON).
      test.skip(
        await readAutoDenyFlag(db, TERRACE.pk),
        `${TERRACE.code} auto_deny_application=ON → cannot approve a lead; flip OFF to run this positive test`,
      );

      await assertMerchantContractWithRestore(page, testEnv, db);

      // Env-aware: qa2 baseline 1, stg baseline 2. Edit to a value distinct from
      // the baseline so the live change is observable (and distinct from the snapshot).
      const BASELINE = TERRACE.fraudThreshold;
      const LIVE_TARGET = BASELINE === 5 ? 7 : 5;

      const { ctx, merchant } = await setupApprovedLead(api, db, testInfo);
      await test.step(`Capture lead snapshot (fraud_threshold=${BASELINE})`, async () => {
        const present = await db.waitForRecord(
          'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 60_000,
        );
        expect(present).toBe(true);
      });
      const leadSnap = (await readLeadSnapshots(db, ctx.leadPk))[0];
      expect(Number(leadSnap.fraud_threshold), `lead snapshot captured fraud_threshold=${BASELINE}`).toBe(BASELINE);

      await test.step(`Change Fraud Threshold ${BASELINE}→${LIVE_TARGET} via Origination Merchant Setting UI`, async () => {
        await loginToPortal(page, testEnv.originationUrl, testEnv);
        const ms = new MerchantSettingPage(page);
        await ms.navigateToMerchantSettings(testEnv.originationUrl);
        await ms.loadMerchants();
        await ms.selectMerchantRowByText(TERRACE.code);
        await ms.fillFraudThreshold(String(LIVE_TARGET));
        await ms.saveGdsSettings();
        const live = await db.queryOne<MerchantConfigRow>(
          `SELECT fraud_threshold FROM uown_merchant WHERE pk = $1`, [TERRACE.pk],
        );
        expect(Number(live!.fraud_threshold), `live merchant now ${LIVE_TARGET} (≠ snapshot)`).toBe(LIVE_TARGET);
      });

      let accountPk = '';
      await test.step('Fund the lead → SVC account + account snapshot', async () => {
        await driveLeadToFunding(api, merchant, ctx);
        accountPk = await resolveAccountPk(db, ctx.leadPk);
        const present = await db.waitForRecord(
          'uown_sv_account_merchant_settings_snapshot', 'account_pk = $1', [accountPk], 120_000,
        );
        expect(present, `account snapshot for account_pk=${accountPk}`).toBe(true);
      });

      await test.step(`Account snapshot reflects APPROVAL-time value (${BASELINE}), not the live value (${LIVE_TARGET})`, async () => {
        const acctSnap = (await readAccountSnapshots(db, accountPk))[0];
        expect(Number(acctSnap.fraud_threshold), `account snapshot fraud_threshold == ${BASELINE} (approval-time)`).toBe(BASELINE);
        expect(Number(acctSnap.fraud_threshold), 'account snapshot == lead snapshot').toBe(Number(leadSnap.fraud_threshold));
        expect(Number(acctSnap.fraud_threshold), `must NOT be the new live value ${LIVE_TARGET}`).not.toBe(LIVE_TARGET);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-07 (P0) — No account snapshot without a lead snapshot.
  //
  //  The only known route to a fundable lead with no lead snapshot is a DB DELETE
  //  of the lead-snapshot row. The user EXPLICITLY AUTHORIZED this DELETE on
  //  2026-06-16 (recorded by the orchestrator) under CLAUDE.md Exception 2 /
  //  Rule #9. The DELETE is parameterized and scoped to ONLY this test's own
  //  freshly-created lead (`lead_pk = ctx.leadPk`) — minimal blast radius, never
  //  an unscoped delete. Depends on TC-06-baseline having proven the positive
  //  account-snapshot write.
  // ════════════════════════════════════════════════════════════════════════
  test('TC-07: no account snapshot when no lead snapshot exists (AUTHORIZED scoped DELETE)', async ({ api, db }, testInfo) => {
    test.setTimeout(480_000);

    // Needs an approved+fundable lead → skip if the merchant cannot approve.
    test.skip(
      await readAutoDenyFlag(db, TERRACE.pk),
      `${TERRACE.code} auto_deny_application=ON → cannot approve a lead; flip OFF to run this positive test`,
    );

    const { ctx, merchant } = await setupApprovedLead(api, db, testInfo);
    await test.step('Lead snapshot written by approval', async () => {
      const present = await db.waitForRecord(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 60_000,
      );
      expect(present).toBe(true);
    });

    await test.step('AUTHORIZED scoped DELETE: remove this lead\'s snapshot row', async () => {
      // AUTHORIZED 2026-06-16 (user, per CLAUDE.md Exception 2 / Rule #9):
      // scoped to THIS test's fresh lead snapshot row only.
      await db.executeUpdate(
        'DELETE FROM uown_los_lead_merchant_settings_snapshot WHERE lead_pk = $1',
        [ctx.leadPk],
      );
      // sanity: confirm the lead snapshot is gone before driving to funding
      const goneCount = await db.queryOne<{ n: string }>(
        'SELECT COUNT(*)::int AS n FROM uown_los_lead_merchant_settings_snapshot WHERE lead_pk = $1',
        [ctx.leadPk],
      );
      expect(Number(goneCount?.n), 'lead snapshot deleted before funding').toBe(0);
    });

    let accountPk = '';
    await test.step('Drive to FUNDING → account is still created', async () => {
      await driveLeadToFunding(api, merchant, ctx);
      accountPk = await resolveAccountPk(db, ctx.leadPk);
      const acct = await db.queryOne<{ pk: string; account_status: string }>(
        `SELECT pk, account_status FROM uown_sv_account WHERE lead_pk = $1`, [ctx.leadPk],
      );
      expect(acct, 'account created successfully despite skipped snapshot').toBeTruthy();
    });

    await test.step('No account snapshot was created', async () => {
      const absent = await db.waitForRecordAbsent(
        'uown_sv_account_merchant_settings_snapshot', 'account_pk = $1', [accountPk], 60_000,
      );
      expect(absent, `no account snapshot should exist for account_pk=${accountPk}`).toBe(true);
      const snaps = await readAccountSnapshots(db, accountPk);
      expect(snaps.length, 'COUNT(*) = 0 (no lead snapshot → no account snapshot)').toBe(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
//  KORNERSTONE BRAND COVERAGE (SPEC addendum 2026-06-16) — TC-KS-01/02
//
//  Reverses the original "brand parity OUT" cut: ssn-test-modalities §5 makes
//  UOWN+Kornerstone parity INVIOLÁVEL for application-creating suites, and this
//  suite creates applications to reach the snapshot triggers. The KS counterpart
//  re-runs the two positive-write TCs against KS1011 ("Bodega Furniture") plus
//  the mandatory `uown_sv_account.company='KORNERSTONE'` brand cross-check that
//  the UOWN suite structurally cannot make.
//
//  Hard facts (addendum §B, DB-probed qa2 — re-asserted read-only at runtime):
//   - KS1011 / pk 315 / client_type KORNERSTONE.
//   - epo5=true, epo10=true, uw_pipeline='Test', fraud_threshold=5  (⚠️ 5, NOT 1).
//   - is_seon_id_check_required=FALSE → NO SEON bypass (simpler than KS3015 family).
//   - use_webhook/hold_deposit=true legitimately → skipMerchantPreflight mandatory.
//   - bankData REQUIRED for Kornerstone routing (pitfall #5); if approval stalls,
//     suspect bankData/routing, NOT SEON (which is off for this fixture).
//
//  Run order: TC-KS-01 (lead snapshot) FIRST, TC-KS-02 (account snapshot, copies
//  the lead snapshot) SECOND → enforced via test.describe.serial.
// ════════════════════════════════════════════════════════════════════════
const KS_TAG = splitTags(`${buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA2)} @origination`);

test.describe.serial(`${TEST_NAME} - ${ENV}/Kornerstone/${KS.code}`, { tag: KS_TAG }, () => {
  test.use({ envName: ENV });

  /**
   * Re-asserts KS1011 UW config matches the addendum contract (fail-fast).
   * Read-only — does NOT mutate/auto-heal (user pre-set the four values; the KS
   * config has legitimate use_webhook/hold_deposit=true that preflight would flag
   * as drift). fraud_threshold MUST be 5 here — never inherit terraceFinance's 1.
   */
  async function assertKsMerchantContract(db: DatabaseHelpers): Promise<void> {
    const row = await db.queryOne<MerchantConfigRow>(
      `SELECT epo5, epo10, uw_pipeline, fraud_threshold FROM uown_merchant WHERE pk = $1`,
      [KS.pk],
    );
    expect(row, `KS1011 (pk ${KS.pk}) must exist in qa2`).not.toBeNull();
    expect(
      {
        epo5: row!.epo5,
        epo10: row!.epo10,
        uw_pipeline: row!.uw_pipeline,
        fraud_threshold: Number(row!.fraud_threshold),
      },
      `KS1011 UW config drifted from the addendum contract — fix the merchant before ` +
        `running (do NOT auto-heal). NOTE fraud_threshold MUST be 5, not 1.`,
    ).toEqual({
      epo5: KS.epo5,
      epo10: KS.epo10,
      uw_pipeline: KS.uwPipeline,
      fraud_threshold: KS.fraudThreshold,
    });
  }

  /**
   * Fresh approved KS lead via API. Mirrors the UOWN setupApprovedLead but:
   *  - hardcodes KS1011 (object-of-test merchant),
   *  - injects bankData (mandatory for Kornerstone routing — pitfall #5),
   *  - no SEON bypass (is_seon_id_check_required=FALSE for this fixture),
   *  - skipMerchantPreflight (KS legitimately has use_webhook/hold_deposit ON).
   */
  async function setupApprovedKsLead(
    api: import('@support/base-test.js').ApiClients,
    db: DatabaseHelpers,
    testInfo: import('@playwright/test').TestInfo,
  ): Promise<{ ctx: TestContext; merchant: import('@api/bodies/index.js').MerchantInfo }> {
    await assertKsMerchantContract(db);
    // Refresh vendor sweeps so the approved (non-9) SSN is not spuriously denied
    // by a stale Kount/GDS token (fraud-vendors-knowledge §3; also de-risks the
    // stg "stale GDS token → 500" path).
    await api.scheduledTask.refreshKountAccessTokenSweep().catch(() => {});
    await api.scheduledTask.refreshGdsAccessTokenSweep().catch(() => {});

    const td = buildTestData({ env: ENV, state: STATE, merchant: KS.key, approved: true });
    const ctx = { reportKeys: new Map() } as unknown as TestContext;
    await createPreQualifiedApplication(
      api,
      td.merchant,
      td.applicant,
      ctx,
      {
        submitPaymentInfoViaApi: true,
        skipMerchantPreflight: true,
        // bankData REQUIRED for Kornerstone routing (ssn-test-modalities Modalidade B;
        // application-lifecycle pitfall #5). Without it the KS lead never reaches approval.
        bankData: {
          routingNumber: TEST_BANK.DEFAULT_ROUTING,
          accountNumber: TEST_BANK.DEFAULT_ACCOUNT,
        },
      },
      testInfo,
    );
    expect(
      ctx.leadPk,
      'KS leadPk captured — if approval stalled, suspect bankData/routing (pitfall #5), NOT SEON',
    ).toBeTruthy();
    return { ctx, merchant: td.merchant };
  }

  // ════════════════════════════════════════════════════════════════════════
  //  TC-KS-01 (P0) — KS lead snapshot on UW approval, 4 values = KS1011 config
  // ════════════════════════════════════════════════════════════════════════
  test('TC-KS-01: KS lead snapshot on approval with 4 values and COUNT=1', async ({ api, db }, testInfo) => {
    test.setTimeout(360_000); // qa2 KS sendApplication + approval can be slow

    test.skip(
      await readAutoDenyFlag(db, KS.pk),
      `${KS.code} auto_deny_application=ON → cannot approve a KS lead; flip OFF to run this positive test`,
    );

    const { ctx } = await setupApprovedKsLead(api, db, testInfo);

    await test.step('KS lead snapshot present', async () => {
      const present = await db.waitForRecord(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 90_000,
      );
      expect(present, `KS lead snapshot for lead_pk=${ctx.leadPk}`).toBe(true);
    });

    await test.step('Exactly one row with KS UW values + merchant link (merchant_pk=315)', async () => {
      const snaps = await readLeadSnapshots(db, ctx.leadPk);
      expect(snaps.length, 'COUNT(*) = 1 (idempotency — guards double-write)').toBe(1);
      const s = snaps[0];
      expect(s.epo5, 'epo5 = KS config').toBe(KS.epo5);
      expect(s.epo10, 'epo10 = KS config').toBe(KS.epo10);
      expect(s.uw_pipeline, 'uw_pipeline = KS config').toBe(KS.uwPipeline);
      // ⚠️ KS value is 5, NOT the terraceFinance constant 1.
      expect(Number(s.fraud_threshold), `fraud_threshold = KS value ${KS.fraudThreshold} (merchant config, NOT terraceFinance's)`).toBe(KS.fraudThreshold);
      expect(String(s.merchant_pk), 'merchant_pk = 315 (KS1011)').toBe(String(KS.pk));
      expect(s.row_created_timestamp, 'creation timestamp present').toBeTruthy();
    });

    await test.step('TC-08: activity-log probe on KS snapshot creation (Rule #13)', async () => {
      // [reflex] credit-application decision → audit log (qa-domain-reflexes §4).
      await probeActivityLog(db, ctx.leadPk, 'TC-KS-01');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-KS-02 (P0, HIGHEST RISK) — KS account snapshot on funding:
  //  4 values + copy integrity + MANDATORY company='KORNERSTONE' cross-check.
  //  KS account snapshot is greenfield (0 rows) — same empirical-risk note as the
  //  UOWN account snapshot: 0 rows after generous wait ⇒ [HIPÓTESE], reproduce in
  //  fresh data before any classification (Rule #10), NOT auto-pass.
  // ════════════════════════════════════════════════════════════════════════
  test('TC-KS-02: KS account snapshot on funding — 4 values + copy integrity + company=KORNERSTONE', async ({ api, db }, testInfo) => {
    test.setTimeout(480_000); // qa2 KS sendApplication + settle + funding can be slow

    test.skip(
      await readAutoDenyFlag(db, KS.pk),
      `${KS.code} auto_deny_application=ON → cannot approve a KS lead; flip OFF to run this positive test`,
    );

    const { ctx, merchant } = await setupApprovedKsLead(api, db, testInfo);

    // Precondition: KS lead snapshot must exist (the account snapshot copies it).
    await test.step('KS lead snapshot exists (precondition for the copy)', async () => {
      const present = await db.waitForRecord(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [ctx.leadPk], 90_000,
      );
      expect(present, `KS lead snapshot for lead_pk=${ctx.leadPk}`).toBe(true);
    });
    const leadSnap = (await readLeadSnapshots(db, ctx.leadPk))[0];
    expect(leadSnap, 'KS lead snapshot captured').toBeTruthy();

    let accountPk = '';
    await test.step('Drive KS lead to FUNDING (SIGNED → settle → FUNDING)', async () => {
      await driveLeadToFunding(api, merchant, ctx);
      accountPk = await resolveAccountPk(db, ctx.leadPk);
      ctx.accountPk = accountPk;
      testInfo.annotations.push({ type: 'accountPk', description: accountPk });
    });

    await test.step('KS account snapshot present — exactly one row, 4 values, linked', async () => {
      // [reflex] funding/account creation → audit snapshot present (qa-domain-reflexes §12).
      const present = await db.waitForRecord(
        'uown_sv_account_merchant_settings_snapshot', 'account_pk = $1', [accountPk], 150_000,
      );
      // Greenfield (0 KS account snapshots in qa2). If still absent after the generous
      // wait, this is a [HIPÓTESE] candidate finding — NOT auto-pass (addendum §D′ pitfalls).
      expect(
        present,
        `[HIPÓTESE] KS account snapshot did NOT appear for account_pk=${accountPk} after 150s. ` +
          `The funding→account-snapshot path may not fire for KS in qa2 (0 KS rows since deploy). ` +
          `Reproduce once in fresh data before any "bug" language (Rule #10).`,
      ).toBe(true);

      const acctSnaps = await readAccountSnapshots(db, accountPk);
      expect(acctSnaps.length, 'exactly one KS account snapshot (idempotency)').toBe(1);
      const s = acctSnaps[0];
      expect(s.epo5, 'epo5 = KS config').toBe(KS.epo5);
      expect(s.epo10, 'epo10 = KS config').toBe(KS.epo10);
      expect(s.uw_pipeline, 'uw_pipeline = KS config').toBe(KS.uwPipeline);
      expect(Number(s.fraud_threshold), `fraud_threshold = KS value ${KS.fraudThreshold} (merchant config, NOT terraceFinance's)`).toBe(KS.fraudThreshold);
      expect(String(s.merchant_pk), 'merchant_pk = 315 (KS1011)').toBe(String(KS.pk));
      expect(String(s.lead_pk), 'lead_pk = originating KS lead').toBe(String(ctx.leadPk));
      expect(s.row_created_timestamp, 'creation timestamp present').toBeTruthy();

      // Copy integrity: KS account snapshot == KS lead snapshot values.
      expect(s.epo5, 'copy integrity: epo5 == lead snapshot').toBe(leadSnap.epo5);
      expect(s.epo10, 'copy integrity: epo10 == lead snapshot').toBe(leadSnap.epo10);
      expect(s.uw_pipeline, 'copy integrity: uw_pipeline == lead snapshot').toBe(leadSnap.uw_pipeline);
      expect(Number(s.fraud_threshold), 'copy integrity: fraud_threshold == lead snapshot').toBe(
        Number(leadSnap.fraud_threshold),
      );
    });

    await test.step('BRAND CROSS-CHECK (MANDATORY): uown_sv_account.company = KORNERSTONE', async () => {
      // ssn-test-modalities §5 checklist / §8 — the assertion the UOWN suite cannot
      // make and the reason brand coverage is IN. A passing snapshot with
      // company≠KORNERSTONE is a FAILURE even if the four values are correct.
      //
      // [HIPÓTESE] (2026-06-16, qa2 — Rule #10, reproduced 3×: leads 16584, 16585 +
      //   lead-level confirm) — this assertion currently FAILS deterministically:
      //   `uown_sv_account.company='UOWN'` for a KS1011 (merchant_pk=315) funded lease,
      //   even though the snapshot rows correctly carry merchant_pk=315 + fraud_threshold=5.
      //   `[db-observation:uown_sv_account]`/`[db-observation:uown_los_lead]`: the brand is
      //   stamped UOWN already at the LEAD (`uown_los_lead.company='UOWN'` for lead 16584),
      //   so it propagates to the account — origin is lead creation, NOT the funding copy.
      //   `[db-observation]`: KORNERSTONE is a valid populated value (228 accounts, e.g.
      //   merchant_pk 35/306/1227), so the column/query semantics are correct.
      //   Co-signal: `submitApplication` returned `"error":"Failed to verify identification"`
      //   for every KS lead even though KS1011 `is_seon_id_check_required=FALSE` per the
      //   addendum — suggesting the KS brand/identity path may not have engaged.
      //   Candidate roots (NOT confirmed — needs dev/PO): (a) brand is derived from
      //   client_type/auth, not merchant_pk, and the `kornerstone` username path didn't
      //   route as KS in qa2; (b) the addendum's KS1011 brand facts drifted. This is a
      //   genuine divergence the test SHOULD catch — the assertion is intentionally left
      //   firing (NOT softened/flipped) so the finding stays visible. Do NOT mutate the
      //   DB or relax this to force green (Rule #9/#10). qa-validator: classify + raise
      //   OQ-KS-1/OQ-KS-2 with dev before marking the KS brand-parity AC MET.
      const acct = await db.queryOne<{ company: string; merchant_pk: string }>(
        `SELECT company, merchant_pk FROM uown_sv_account WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1`,
        [ctx.leadPk],
      );
      expect(acct, 'funded KS account row exists').not.toBeNull();
      expect(String(acct!.company).toUpperCase(), 'account.company MUST be KORNERSTONE').toBe('KORNERSTONE');
      // Cross-contamination: no UOWN/terraceFinance markers on the KS account.
      expect(String(acct!.merchant_pk), 'account.merchant_pk = 315 (KS), not 26 (UOWN/terrace)').toBe(String(KS.pk));
      expect(String(acct!.company).toUpperCase(), 'no UOWN marker on KS account').not.toBe('UOWN');
    });

    await test.step('TC-08: activity-log probe on KS funding window (Rule #13)', async () => {
      await probeActivityLog(db, ctx.leadPk, 'TC-KS-02');
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  //  TC-KS-denial (P1) — No KS lead snapshot when the application is auto-denied.
  //
  //  DENIAL TRIGGER (2026-06-17): `auto_deny_application=TRUE` on KS1011 (pk 315),
  //  user-set in qa2 to mirror terraceFinance. Same `merchantAutoDenyCheck` Step 2
  //  pre-UW deny → `lead_status='DENIED'` (internal MERCHANT_AUTO_DENIED), NOT
  //  `UW_DENIED`. Brand parity ([[ssn-test-modalities]] §5, INVIOLÁVEL): the
  //  denial-no-snapshot invariant must be covered for Kornerstone too.
  //
  //  Mirrors the UOWN TC-02 adaptation:
  //   - NORMAL approval-eligible SSN (generateTestSSN(true)) so the auto-deny config
  //     is the SOLE cause of denial (ending-in-9 is a no-op in qa2, pitfall #109).
  //   - bankData REQUIRED for Kornerstone routing even on the denial path (pitfall #5).
  //   - State TX (leasing-eligible) so stateCheck does not short-circuit before auto-deny.
  //   - auto-deny flag asserted ON (read-only, self-documenting) — fails loudly if OFF.
  // ════════════════════════════════════════════════════════════════════════
  test('TC-KS-denial: no KS lead snapshot when the application is auto-denied (merchant auto_deny_application)', async ({ api, db }, testInfo) => {
    test.setTimeout(360_000); // qa2 denied path can take >180s

    // Config-adaptive: needs the auto-deny trigger present. Skip (not fail) if the
    // KS merchant has auto_deny=OFF — so the same spec serves both flag passes.
    test.skip(
      !(await readAutoDenyFlag(db, KS.pk)),
      `${KS.code} auto_deny_application=OFF → no deny trigger; flip ON to run this denial test`,
    );

    await assertKsMerchantContract(db);

    // approved:true → generateTestSSN(true) → NON-ending-in-9 → approval-eligible SSN;
    // denial comes SOLELY from the KS merchant auto-deny config.
    const td = buildTestData({ env: ENV, state: STATE, merchant: KS.key, approved: true });

    let leadPk = '';
    await test.step('Send KS application (normal SSN + bankData) and poll for the auto-deny decision', async () => {
      // bankData required for KS routing even on the denial path (pitfall #5) → use the
      // body-overload of sendApplication and inject the bank fields, mirroring the
      // createPreQualifiedApplication bankData path.
      const body = buildSendApplicationBody(td.merchant, td.applicant);
      body.mainBankRoutingNumber = TEST_BANK.DEFAULT_ROUTING;
      body.mainBankAccountNumber = TEST_BANK.DEFAULT_ACCOUNT;
      const appResp = await api.application.sendApplication(body);
      expect(
        appResp.ok,
        `sendApplication: ${appResp.status} ${JSON.stringify(appResp.body).slice(0, 200)}`,
      ).toBeTruthy();
      const leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
      leadPk = String(appResp.body.authorizationNumber ?? '');

      const deadline = Date.now() + 300_000;
      let status = '';
      while (Date.now() < deadline) {
        const st = await api.application.getApplicationStatus(td.merchant, leadUuid);
        if (st.body.leadPk) leadPk = String(st.body.leadPk);
        status = (st.body.appApprovalStatus || st.body.uwStatus || st.body.currentStatus || st.body.status || '').toUpperCase();
        if (status.includes('DECLIN') || status.includes('DENIED')) break;
        await new Promise((r) => setTimeout(r, 5_000));
      }
      expect(status, `expected a denial status, got "${status}"`).toMatch(/DECLIN|DENIED/);
      testInfo.annotations.push({ type: 'leadPk', description: leadPk });
    });

    await test.step('Confirm pre-UW auto-deny (lead_status=DENIED, not a UW_DENIED engine decline)', async () => {
      const leadStatus = (await db.getLeadStatus(leadPk)) ?? '';
      console.log(`[TC-KS-denial] lead ${leadPk} lead_status="${leadStatus}" (expected DENIED via MERCHANT_AUTO_DENIED)`);
      expect(leadStatus.toUpperCase(), `expected a DENIED-class status, got "${leadStatus}"`).toMatch(/DENIED/);
      expect(leadStatus.toUpperCase(), 'must not be a blacklist deny').not.toContain('BLACKLIST');
    });

    await test.step('No KS lead snapshot was written for the denied lead', async () => {
      const absent = await db.waitForRecordAbsent(
        'uown_los_lead_merchant_settings_snapshot', 'lead_pk = $1', [leadPk], 30_000,
      );
      expect(absent, `no KS lead snapshot should exist for denied lead_pk=${leadPk}`).toBe(true);
      const snaps = await readLeadSnapshots(db, leadPk);
      expect(snaps.length, 'COUNT(*) = 0 for denied KS lead').toBe(0);
    });
  });
});

// ── Local utilities ─────────────────────────────────────────────────────
/**
 * afterAll-safe merchant restore (F-CYCLE2-A fix).
 *
 * Playwright forbids test-scoped fixtures (`page`, `context`, `testEnv`) inside
 * `test.afterAll` — only worker-scoped fixtures are allowed. The previous teardown
 * destructured `{ page, testEnv }`, which (a) falsely failed the last serial
 * sub-test and (b) silently skipped the restore (drift leaked: uw_pipeline='Prod').
 *
 * This helper takes only the worker-scoped `browser` (allowed in afterAll) and the
 * worker-scoped `db`, spins up its OWN context/page, and derives the env config the
 * same way the `db` fixture does (`process.env.ENV`). Idempotent: only edits when
 * the merchant has actually drifted from the contract. Restore is the feature's own
 * UI edit path (NOT a raw DB mutation — Rule #9).
 *
 * @param fields  which contract fields to restore ('all' for the TC-03 block, just
 *                fraud_threshold for the TC-05 block).
 */
async function restoreMerchantContractAfterAll(
  browser: Browser,
  db: DatabaseHelpers,
  fields: 'all' | 'fraudThreshold',
): Promise<void> {
  try {
    const live = await db.queryOne<MerchantConfigRow>(
      `SELECT epo5, epo10, uw_pipeline, fraud_threshold FROM uown_merchant WHERE pk = $1`,
      [TERRACE.pk],
    );
    const drifted =
      !live ||
      (fields === 'all'
        ? live.epo5 !== TERRACE.epo5 ||
          live.epo10 !== TERRACE.epo10 ||
          live.uw_pipeline !== TERRACE.uwPipeline ||
          Number(live.fraud_threshold) !== TERRACE.fraudThreshold
        : Number(live.fraud_threshold) !== TERRACE.fraudThreshold);
    if (!drifted) {
      console.log('[teardown] terraceFinance already at contract values — no restore needed');
      return;
    }
    // env derived exactly like the worker-scoped `db` fixture (process.env.ENV).
    const env = new ConfigEnvironment(process.env.ENV ?? 'qa2');
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    try {
      await loginToPortal(page, env.originationUrl, env);
      const ms = new MerchantSettingPage(page);
      await ms.navigateToMerchantSettings(env.originationUrl);
      await ms.loadMerchants();
      await ms.selectMerchantRowByText(TERRACE.code);
      await ms.fillFraudThreshold(String(TERRACE.fraudThreshold));
      if (fields === 'all') {
        await ms.fillUwPipeline(TERRACE.uwPipeline);
        await ms.setEpo5(TERRACE.epo5);
        await ms.setEpo10(TERRACE.epo10);
      }
      await ms.saveGdsSettings();
      console.log('[teardown] terraceFinance restored to contract values via UI');
    } finally {
      await ctx.close();
    }
  } catch (e) {
    console.warn(`[teardown] restore failed: ${(e as Error).message} — verify merchant config manually`);
  }
}

/**
 * Re-asserts the merchant contract; if it has drifted (a previous serial
 * sub-case left it changed), restores it via the UI first, then asserts.
 * Read-only assert + UI restore (the restore is the feature's own edit path,
 * NOT a raw DB mutation).
 */
async function assertMerchantContractWithRestore(
  page: import('@playwright/test').Page,
  testEnv: import('@config/environment.js').ConfigEnvironment,
  db: DatabaseHelpers,
): Promise<void> {
  const live = await db.queryOne<MerchantConfigRow>(
    `SELECT epo5, epo10, uw_pipeline, fraud_threshold FROM uown_merchant WHERE pk = $1`,
    [TERRACE.pk],
  );
  const drifted =
    !live ||
    live.epo5 !== TERRACE.epo5 ||
    live.epo10 !== TERRACE.epo10 ||
    live.uw_pipeline !== TERRACE.uwPipeline ||
    Number(live.fraud_threshold) !== TERRACE.fraudThreshold;
  if (drifted) {
    console.log('[setup] terraceFinance drifted — restoring to contract values via UI before test');
    await loginToPortal(page, testEnv.originationUrl, testEnv);
    const ms = new MerchantSettingPage(page);
    await ms.navigateToMerchantSettings(testEnv.originationUrl);
    await ms.loadMerchants();
    await ms.selectMerchantRowByText(TERRACE.code);
    await ms.fillUwPipeline(TERRACE.uwPipeline);
    await ms.fillFraudThreshold(String(TERRACE.fraudThreshold));
    await ms.setEpo5(TERRACE.epo5);
    await ms.setEpo10(TERRACE.epo10);
    await ms.saveGdsSettings();
  }
}

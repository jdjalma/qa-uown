/**
 * RU06.26.1.53.0 — Store Underwriting and Banking Scores Snapshot Data
 *
 * On underwriting via GDS the backend persists two integer snapshot scores in
 * `uown_los_uwdata` (lead) and `uown_sv_uwdata` (account):
 *   - `npm_segment` — written on any GDS 16m approval.
 *   - `tam_score`   — TireAgent-only branch.
 * No UI surface (silent backend write, like `lambda_segment`) → the observable
 * behavior is DB persistence. Rule #14 (UI-first) is satisfied by exercising the
 * real trigger (application → bank data → GDS underwriting decision); the two new
 * columns are a cross-cutting DB validation (Rule #14 exception c). The UW
 * decision is a status transition → its activity log is asserted (Rule #13).
 *
 * SPEC (authoritative):
 *   docs/taskTestingUown/RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData/
 *     RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData-spec.md
 * Discovery (env/engine routing, source-of-truth):
 *   docs/knowledge-base/npm-segment-tam-score-snapshot-routing.md
 * Reuse: the UW-approval cycle + qa2 caveats (stale sweep tokens, Kornerstone
 *   bank-data, skipMerchantPreflight) come straight from the merchant-settings snapshot spec.
 *
 * ── Scope of THIS file (qa2-runnable subset) ─────────────────────────────────
 *   CT-01 + CT-03 (FUSED, `npm_segment`) — RUNS in qa2 today.
 *       Recipe (live-proven 2026-06-19): KS16775 (Kornerstone 16m, pk 657) + bank
 *       data → GDS APPROVED eligible_terms=16 → `npm_segment` non-null, `tam_score`
 *       NULL (CT-03 control: TireAgent-only branch is a real branch, not a flake).
 *   CT-02 (`tam_score`, TireAgent) — test.skip, blocked by env (see stub below).
 *   CT-04 (`uown_sv_uwdata` on funding) — test.skip, blocked by env (see stub below).
 *
 * Target env: qa2. The `db` worker fixture connects to process.env.ENV (NOT the
 * per-describe envName), so run with ENV=qa2 for the DB assertions to hit qa2.
 *
 * Confirmed schema (qa2, read-only probe 2026-06-19):
 *   uown_los_uwdata.{npm_segment,tam_score} :: integer (32-col table, #31/#32)
 *   uown_sv_uwdata.{npm_segment,tam_score}  :: integer
 *   KS16775 / pk 657 / KORNERSTONE / ONLINE / NY / is_seon_id_check_required=false
 *     / auto_deny_application=false / use_webhook,hold_deposit=true → 16m GDS route.
 *
 * Run:
 *   ENV=qa2 npx playwright test --project=origination-ui \
 *     RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData.spec.ts --workers=1
 *   (This spec lives in tests/e2e/origination/ → it is covered by the `origination-ui`
 *    Playwright project, NOT `task-testing-origination` (which globs docs/taskTestingUown/).)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { TestContext } from '@support/base-test.js';
import type { DatabaseHelpers, UwScoresRow } from '@helpers/database.helpers.js';
import { buildTestData } from '@helpers/test-data.helpers.js';
import { createPreQualifiedApplication } from '@helpers/api-setup.helpers.js';
import { TEST_BANK } from '@config/constants.js';

// ── Fixture constants (SPEC §Env decision + discovery KB) ────────────────────
// KS16775 is the object-of-test merchant: the ONLY env-confirmed recipe that
// produces npm_segment in qa2 (Kornerstone 16m GDS). Hardcoded (not
// pickRandomMerchantKey) per test-data-hierarchy "Teste de configuração de
// merchant" — the merchant routing IS the object of the test. All values
// DB-probed in qa2 (2026-06-19); re-asserted read-only at runtime, NEVER mutated.
const KS16775 = {
  /** Merchant key in src/data/merchants.ts (BrooklynFurnitureKS16775 → number KS16775). */
  key: 'BrooklynFurnitureKS16775',
  /** DB-probed qa2. */
  pk: 657,
  code: 'KS16775',
  fullName: '#1 Brooklyn Furniture INC',
  // is_seon_id_check_required=FALSE → NO SEON bypass needed for this fixture.
  // use_webhook/hold_deposit=true legitimately → skipMerchantPreflight mandatory
  // (mutating Kornerstone config to match the UOWN contract would be a side effect).
  // auto_deny_application=FALSE → approval-eligible.
} as const;

// Customer state OH: confirmed live to route KS16775 to GDS APPROVED eligible_terms=16
// with npm_segment populated (qa2 leads 16656, 16640, 16636). CO/CA/IA also work.
const STATE = 'OH';

const TEST_NAME = 'RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData';
// Selection is by directory: this file lives in tests/e2e/origination/ → it runs under
// the `origination-ui` Playwright project (testDir ./tests/e2e/origination, no grep
// filter). The `@origination` tag is NOT required for selection here (it is the
// task-testing-origination project — testDir ./docs/taskTestingUown — that greps on it);
// kept only as a portal label, consistent with the merchant-settings snapshot sibling.
const tag = splitTags(`${buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA2)} @origination`);

// ── Suite ────────────────────────────────────────────────────────────────────
test.describe(`${TEST_NAME} - qa2/Kornerstone/KS16775`, { tag }, () => {
  test.use({ envName: 'qa2' });

  /**
   * Fresh approved KS16775 lead via API (Rule #9 — fresh data, unique email per run).
   * Mirrors the merchant-settings snapshot KS setup:
   *  - hardcodes KS16775 (object-of-test merchant),
   *  - injects bankData (mandatory for Kornerstone routing — application-lifecycle
   *    pitfall #5; without it the KS lead never reaches approval),
   *  - no SEON bypass (is_seon_id_check_required=FALSE for this fixture),
   *  - skipMerchantPreflight (KS legitimately has use_webhook/hold_deposit ON; the
   *    UOWN config-contract is NOT KS's — preflight would flag false drift / mutate).
   *  - refreshes the GDS + Kount sweep tokens first (qa2 stale tokens cause a
   *    spurious UW_DENIED — caveat confirmed; fraud-vendors-knowledge §3).
   */
  async function setupApprovedKs16775Lead(
    api: import('@support/base-test.js').ApiClients,
    testInfo: import('@playwright/test').TestInfo,
  ): Promise<{ ctx: TestContext; leadPk: string }> {
    // qa2: refresh vendor sweeps so the approval-eligible SSN is not spuriously
    // denied by a stale GDS/Kount token (the npm_segment recipe REQUIRES GDS approval).
    await api.scheduledTask.refreshGdsAccessTokenSweep().catch(() => {});
    await api.scheduledTask.refreshKountAccessTokenSweep().catch(() => {});

    const td = buildTestData({ env: 'qa2', state: STATE, merchant: KS16775.key, approved: true });
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
      'KS16775 leadPk captured — if approval stalled, suspect bankData/routing (pitfall #5) ' +
        'or a stale GDS sweep token (qa2 caveat), NOT SEON (off for this fixture)',
    ).toBeTruthy();
    const leadPk = String(ctx.leadPk);
    testInfo.annotations.push({ type: 'leadPk', description: leadPk });
    return { ctx, leadPk };
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CT-01 + CT-03 (FUSED, P0) — npm_segment populated on GDS 16m approval, and
  //  tam_score NULL on the non-TireAgent (Kornerstone) branch.
  //
  //  CT-01 asserts: npm_segment IS NOT NULL (integer) for the lead.
  //  CT-03 asserts: tam_score IS NULL on the SAME lead (the TireAgent-only branch
  //                 is a real branch, not a flake) — fused per SPEC §CT-03 ("Pode
  //                 fundir com CT-01; mantido nomeado p/ rastreabilidade").
  // ════════════════════════════════════════════════════════════════════════════
  test('CT-01+CT-03: npm_segment populated (GDS 16m) and tam_score NULL (non-TireAgent)', async ({ api, db }, testInfo) => {
    test.setTimeout(420_000); // qa2 KS sendApplication + GDS approval can be slow

    const { leadPk } = await setupApprovedKs16775Lead(api, testInfo);

    // ── GUARD (MANDATORY, SPEC §Pré-assert) — convert env/engine volatility into a
    // controlled skip, NEVER a red assert. If qa2 did not route this lead through
    // GDS at 16m, npm_segment legitimately stays NULL and asserting it would be a
    // false bug. We read the decision row first and skip with a clear reason if the
    // engine/term did not match the recipe.
    let guarded: UwScoresRow | null = null;
    await test.step('Guard: UW decision is GDS + eligible_terms ~ 16 (else skip, not fail)', async () => {
      // Poll for the async UW decision row first (the row itself appears after the
      // engine runs); use a short presence wait, then read engine/term.
      await db.waitForRecord('uown_los_uwdata', 'lead_pk = $1', [leadPk], 120_000);
      guarded = await db.getUwScoresByLeadPk(leadPk);
      const engine = (guarded?.decided_by_agent ?? '').toUpperCase();
      const terms = guarded?.eligible_terms ?? '';
      const routedGds16 = engine === 'GDS' && /16/.test(terms);
      test.skip(
        !routedGds16,
        `qa2 did not route lead ${leadPk} through GDS@16m ` +
          `(decided_by_agent='${guarded?.decided_by_agent}', eligible_terms='${terms}'). ` +
          `npm_segment is only written on the GDS 16m branch — env did not produce the recipe; ` +
          `skipping instead of a false-negative assert (SPEC §Pré-assert, Rule #10).`,
      );
    });

    await test.step('CT-01: npm_segment IS NOT NULL (integer) for the lead', async () => {
      // [reflex] credit-application decision → score persisted (qa-domain-reflexes §4).
      // The GDS write is async w.r.t. the decision row; poll until npm_segment populates.
      const row = await db.waitForUwNpmSegment(leadPk, 90_000);
      expect(
        row,
        `[CONFIRMADO-gated] npm_segment did not populate for GDS@16m lead ${leadPk} after 90s. ` +
          `The guard already confirmed GDS+16m routing, so an absent npm_segment here is a ` +
          `candidate finding (snapshot write failed) — qa-validator to classify (Rule #10).`,
      ).not.toBeNull();
      expect(row!.npm_segment, 'npm_segment must be a non-null integer').not.toBeNull();
      expect(Number.isInteger(Number(row!.npm_segment)), 'npm_segment is an integer').toBe(true);
      // Re-read with a fresh query (consequence oracle — do not trust the polled payload).
      const fresh = await db.getUwScoresByLeadPk(leadPk);
      expect(fresh?.npm_segment, 'fresh re-read confirms npm_segment persisted').not.toBeNull();
      expect(String(fresh?.decided_by_agent).toUpperCase(), 'engine still GDS on re-read').toBe('GDS');
    });

    await test.step('CT-03: tam_score IS NULL on the non-TireAgent (Kornerstone) branch [control]', async () => {
      // Control partition: tam_score is the TireAgent-only branch. KS16775 is
      // non-TireAgent, so it must be NULL even though npm_segment is populated.
      // This proves the caveat is a real branch, not a flake.
      const row = await db.getUwScoresByLeadPk(leadPk);
      expect(row, 'UW row present for the lead').not.toBeNull();
      expect(
        row!.tam_score,
        `tam_score must be NULL for a non-TireAgent (Kornerstone) lead — got ${row!.tam_score}. ` +
          `tam_score populated here would mean the TireAgent-only branch leaked.`,
      ).toBeNull();
    });

    await test.step('Activity log (Rule #13): UW decision note present for the lead', async () => {
      // The snapshot write itself is SILENT (no dedicated "snapshot" note — backend
      // writes it like lambda_segment; confirmed via live notes on lead 16656). So we
      // assert the DECISION note that the snapshot is written DURING: the UW approval
      // transition. Patterns confirmed live in qa2:
      //   [UnderwritingService][runUnderwriting] UW is run. Lead Status UW_APPROVED
      //   [ApplicationProcessor] Application approved for $...
      const note = await db.queryOne<{ pk: string; notes: string }>(
        `SELECT pk, notes
           FROM uown_los_lead_notes
          WHERE lead_pk = $1
            AND (notes ILIKE '%[UnderwritingService]%runUnderwriting%'
              OR notes ILIKE '%[UnderwritingService]%UW_APPROVED%'
              OR notes ILIKE '%[ApplicationProcessor]%approved%')
          ORDER BY pk DESC
          LIMIT 1`,
        [leadPk],
      );
      expect(
        note,
        `[Rule #13] no UW-decision activity note found for lead ${leadPk}. ` +
          `The snapshot is written during the UW decision; absent decision log = nothing happening.`,
      ).not.toBeNull();
      expect(note!.notes, 'decision note mentions the UW engine/approval').toMatch(/UnderwritingService|ApplicationProcessor/i);
      // Negative guard: the decision must not be a denial (would mean no npm_segment branch).
      expect(note!.notes, 'decision note must not report a denial').not.toMatch(/UW_DENIED|DECLINED|denied/i);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  //  CT-02 (P0, `tam_score`, TireAgent) — BLOCKED BY ENV in qa2.
  //
  //  Strengthened by the DECISIVE LIVE EXPERIMENT 2026-06-21 — the prior discovery
  //  only OBSERVED pre-existing 13m leads; this run actually DROVE fresh TireAgent
  //  applications WITH bank data targeting 16m. Findings:
  //
  //   1. tam_score NEVER populates in qa2 (count(tam_score)=0 in 6046 los + 2037 sv).
  //   2. eligible_terms=16 has happened on TireAgent EXACTLY ONCE in all qa2 history
  //      (1 of 474 rows): lead 15945 — CA, SSN ending 9916, GDS, 2026-04-28 — and
  //      even IT has tam_score=NULL (it predates the migration V20260603054943 of
  //      2026-06-03, so the column did not exist when it was decided).
  //   3. Fresh experiment, SAME recipe post-migration (TireAgent + CA + SSN-916 +
  //      bank data, lead 16794): GDS APPROVED but eligible_terms='13', tam_score NULL.
  //      The `916` suffix forces 16m only on the BlackBox MOCK (ssn-test-modalities
  //      §6, qa1); TireAgent in qa2 routes to the GDS ENGINE, which decides terms by
  //      real credit logic and returns 13m for synthetic test profiles.
  //   4. TireAgent + OH + SSN-916 (lead 16795): DENIED.
  //   5. Second Look 100000053 needs the pinned profile with a real street (the bare
  //      "92821" address 400s on mainAddress1 format); on TireAgent qa2 it DENIES and
  //      short-circuits (validated only in stg) → never completes the 16m 2nd stage.
  //   6. The merchant config is NOT the blocker — TireAgent's 16m programs (pk 4718
  //      KWC-2.3 + pk 4741 KWC-1.75) are is_active, in-window, and LIST CA/OH/NY. The
  //      cap is the GDS term DECISION for the TIRE_AGENT segment, which has NO lever
  //      in the updateMerchants surface (dealerDiscount/uwPipeline/fraudThreshold/
  //      maxApprovalAmount/isGdsEnabled/offerInsurance — none controls the granted term).
  //   ⇒ The combination TireAgent + 16m + GDS (the only one that yields tam_score)
  //     is UNREACHABLE in qa2 via ANY API lever. data-backed [CONFIRMADO].
  //
  //  Tried × eligible_terms obtained (qa2, 2026-06-21):
  //    TireAgent + CA + SSN-916 + bankData → GDS APPROVED, eligible_terms=13 (lead 16794)
  //    TireAgent + OH + SSN-916 + bankData → DENIED                          (lead 16795)
  //    TireAgent + Second Look 0053        → 400 (address) / historically DENIED
  //    (historical TireAgent 16m: 1/474, lead 15945, pre-migration → tam_score NULL)
  //
  //  ESCALATED to Marcos/dev (STOP): the only paths to tam_score are an env where
  //  Second-Look TireAgent approves 16m via GDS (candidate stg — unreachable from
  //  this host: STG=34.121.232.252:5432, no route/VPN; or dev2 — needs its own
  //  kubectl tunnel; .env reuses port 5445), a GDS mock override, or a backend
  //  change — all outside the QA-API surface.
  //
  //  Enable when the env is confirmed: change envName, set a TireAgent fixture, use
  //  the Second-Look SSN modality with a REAL pinned street, inject bank data,
  //  complete the 2nd submission, then assert npm_segment AND tam_score both non-null
  //  (same guard pattern as CT-01). Sketch below.
  // ════════════════════════════════════════════════════════════════════════════
  test.skip(
    'CT-02: tam_score populated (TireAgent, 16m, GDS) — BLOCKED by env (qa2: TireAgent+916 → GDS 13m, not 16m; tam_score unreachable via any API lever; needs stg/dev2, escalated to Marcos)',
    async () => {
      // ── RECIPE (enable on stg/dev2 once confirmed) ───────────────────────────
      // const TIREAGENT = { key: 'TireAgent', code: 'OW90218-0001' } as const;
      // // Second-Look SSN modality (ssn-test-modalities §C.2). Pinned profile MUST
      // // carry a real street (bare "92821" 400s on mainAddress1). On stg the Second
      // // Look completes the 16m approval that qa2 short-circuits.
      // const SECOND_LOOK_SSN = '100000053';
      // // 1) refresh GDS/Kount sweeps; 2) sendApplication TireAgent + Second-Look SSN
      // //    + bank data (TEST_BANK defaults); 3) complete the 2nd submission so the
      // //    16m GDS branch fires; 4) poll uown_los_uwdata.
      // // GUARD (mandatory): decided_by_agent='GDS' AND eligible_terms ~ '16' else skip
      // //   — the 2026-06-21 experiment proves a non-16m TireAgent reads tam_score=NULL,
      // //   which without the guard would be a false bug.
      // // ASSERT: npm_segment IS NOT NULL AND tam_score IS NOT NULL (both integers).
      // // Activity log (Rule #13): [UnderwritingService][runUnderwriting] UW_APPROVED note.
    },
  );

  // ════════════════════════════════════════════════════════════════════════════
  //  CT-04 (P1, `uown_sv_uwdata` snapshot on funding) — BLOCKED BY ENV in qa2.
  //
  //  The Servicing-side copy of npm_segment/tam_score is written on funding →
  //  account. The migration touched BOTH tables, but the most valuable CT-04
  //  assertion is the tam_score copy (TireAgent), which depends on CT-02 — and
  //  CT-02 is unreachable in qa2 (see above). The npm_segment-only sv copy COULD be
  //  attempted in qa2 by funding a KS16775 lead, but the SPEC scopes CT-04 to the
  //  full snapshot copy (npm_segment + tam_score) → kept skipped with CT-02 until
  //  the tam_score env is confirmed, to avoid a partial/misleading CT-04.
  //
  //  Enable on the tam_score env: drive the CT-02 lead to FUNDING
  //  (driveLeadToFunding → updateFundingStatus(FUNDED)), resolve the account
  //  (waitForAccountByLeadPk), then assert uown_sv_uwdata.{npm_segment,tam_score}
  //  carry the SAME values as the lead side (getSvUwScoresByAccountPk vs
  //  getUwScoresByLeadPk). If account NULL with lead populated → [OBSERVAÇÃO], not
  //  an auto-confirmed bug (Rule #10). Helper getSvUwScoresByAccountPk is already
  //  added to database.helpers.ts and ready.
  // ════════════════════════════════════════════════════════════════════════════
  test.skip(
    'CT-04: uown_sv_uwdata snapshot on funding carries the scores — BLOCKED by env (depends on CT-02 tam_score path; needs stg/dev2, escalated to Marcos)',
    async () => {
      // ── RECIPE (enable on stg/dev2 once CT-02 path is confirmed) ─────────────
      // const { ctx, merchant } = /* CT-02 setup */;
      // await driveLeadToFunding(api, merchant, ctx);
      // const accountPk = /* resolveAccountPk(db, ctx.leadPk) — see merchant-settings snapshot spec */;
      // const sv = await db.getSvUwScoresByAccountPk(accountPk);
      // const lead = await db.getUwScoresByLeadPk(String(ctx.leadPk));
      // expect(sv?.npm_segment).toBe(lead?.npm_segment);
      // expect(sv?.tam_score).toBe(lead?.tam_score);
      // // account NULL with lead populated → [OBSERVAÇÃO], not auto-confirmed bug (Rule #10).
    },
  );
});

/**
 * Source-of-truth data file for the multi-state signing regression suite.
 *
 * Routing rule (qa2 baseline):
 *   - A state routes to GOWSIGN when a GowSign template exists for it in qa2; else SIGNWELL
 *     (fallback via merchant.esign_client). The GowSign rollout is expanding state-by-state.
 *   - NJ, VT, MN, ME → BLOCKED (stateCheck denial — no esign_document created)
 *   - ⚠️ STALE-RISK (rule #16): the original 2026-04-28 baseline assumed "CA only" GowSign.
 *     As of 2026-06-17 the live qa2 map has GowSign templates for AL, CA, FL, GA, LA, NC, NY,
 *     OH, PA (see docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md). Only the
 *     CA, AL and TX rows below have been re-verified against the live DB (2026-06-18). The
 *     remaining states (FL/GA/LA/NC/NY/OH/PA still marked SIGNWELL here) are UNVERIFIED and
 *     likely stale — re-confirm with getGowSignTemplatesForState() before trusting them.
 *
 * Env-specific overrides (PROVIDER_ENV_OVERRIDES):
 *   - In stg the GoSign template for CA is NOT yet deployed (2026-04-29).
 *     CA falls back to SIGNWELL on stg, like every other allowed state.
 *   - Use `getExpectedProviderForEnv(row, env)` / `getGowsignStatesForEnv(env)` /
 *     `getSignwellStatesForEnv(env)` so consumers don't hardcode qa2 routing.
 *
 * Lessor rule (US-DOC-03):
 *   - AK → "KW-Choice Alaska LLC" (local licensee)
 *   - All other allowed states → "Mollie, LLC, dba Uown"
 *   - Blocked states → "" (no contract generated)
 *
 * DC: excluded — confirmed absent from STATE_ADDRESSES in src/data/state-address-mapper.ts;
 * UOWN does not operate in DC. Do not add without product sign-off.
 *
 * validMerchant:
 *   Default is 'TerraceFinance' (number: OL90202-0001, multi-state, ONLINE,
 *   esign_client=SIGNWELL fallback). CA uses 'TireAgent' (OW90218-0001) which has
 *   empirically confirmed GOWSIGN routing for CA in qa2 (leads 15741–15745, 15748+).
 *   AK coverage for TerraceFinance is unconfirmed — marked with TODO below.
 *   If TerraceFinance does not serve AK in qa2, swap to another ONLINE merchant that does.
 *
 * blockedReason:
 *   Exact substring in uown_los_lead_notes is NOT yet confirmed for any blocked state.
 *   Task #5 (smoke run) must capture the real log line and freeze it here.
 *   Do NOT invent log substrings — see CLAUDE.md inviolable rule #11.
 */

export type SigningProvider = 'GOWSIGN' | 'SIGNWELL';

export interface StateMatrixRow {
  /** 2-letter USPS postal code */
  state: string;
  /** false for NJ, VT, MN, ME (stateCheck blocks the application) */
  allowed: boolean;
  /** null when !allowed */
  expectedProvider: SigningProvider | null;
  /** "Mollie, LLC, dba Uown" | "KW-Choice Alaska LLC" | "" for blocked states */
  lessor: string;
  /** Merchant key from MERCHANTS record (src/data/merchants.ts) used for this state */
  validMerchant: string;
  /** When !allowed: substring expected in uown_los_lead_notes. Filled in by Task #5 smoke run. */
  blockedReason?: string;
}

/**
 * Full 50-state matrix (DC excluded).
 * Distribution: GOWSIGN=2, SIGNWELL=45, BLOCKED=4. Total=51 rows.
 */
export const STATE_MATRIX: readonly StateMatrixRow[] = [
  // ── SR-GOWSIGN ──────────────────────────────────────────────────────────────
  {
    state: 'CA',
    allowed: true,
    expectedProvider: 'GOWSIGN',
    lessor: 'Mollie, LLC, dba Uown',
    // TireAgent (OW90218-0001) empirically confirmed → GOWSIGN for CA in qa2.
    // TerraceFinance may also work but TireAgent has direct evidence.
    validMerchant: 'TireAgent',
  },

  // ── SR-SIGNWELL — KW-Choice Alaska LLC ──────────────────────────────────────
  {
    state: 'AK',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'KW-Choice Alaska LLC',
    // TODO(merchant-coverage): verify TerraceFinance covers AK in qa2.
    // If not, identify an ONLINE merchant that does and update this row.
    validMerchant: 'TerraceFinance',
  },

  // ── SR-SIGNWELL — Mollie, LLC, dba Uown (45 states) ─────────────────────────
  {
    state: 'AL',
    allowed: true,
    // GOWSIGN (qa2): AL templates AL_2025_SAC (pk25, 13m) + AL_2025_SAC_16_MONTHS (pk26, 16m)
    // are deployed. Live DB + UI confirmed 2026-06-18 (leads 16649 13m, 16653 16m →
    // uown_esign_document.client='GOWSIGN'). stg lags → SIGNWELL via override below.
    expectedProvider: 'GOWSIGN',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'AZ',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'AR',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'CO',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'CT',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // DE: tax=0, EPO state-specific — header assertion still applies; EPO not in scope of this SPEC.
    state: 'DE',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'FL',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'GA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // HI: EPO state-specific — not asserted in this SPEC (signing routing scope only).
    state: 'HI',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'ID',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'IL',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'IN',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'IA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'KS',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'KY',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'LA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'MD',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'MA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'MI',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'MS',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'MO',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // MT: tax=0 — not asserted in this SPEC.
    state: 'MT',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'NE',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'NV',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // NH: tax=0 — not asserted in this SPEC.
    state: 'NH',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'NM',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // NY: EPO state-specific — not asserted in this SPEC.
    state: 'NY',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // NC: last payment ≥ 11% baseCost — not asserted in this SPEC.
    state: 'NC',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'ND',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'OH',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'OK',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // OR: tax=0 — not asserted in this SPEC.
    state: 'OR',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'PA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'RI',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'SC',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'SD',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'TN',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'TX',
    allowed: true,
    // SIGNWELL: TX has NO GowSign template in qa2 (0 rows in uown_gow_sign_template,
    // live DB confirmed 2026-06-18) → falls back to merchant.esign_client.
    // TX is the EPO *content reference* for the AL/OH 16m templates, NOT a GowSign-routed state.
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'UT',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'VA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'WA',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    // WV: EPO state-specific — not asserted in this SPEC.
    state: 'WV',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'WI',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },
  {
    state: 'WY',
    allowed: true,
    expectedProvider: 'SIGNWELL',
    lessor: 'Mollie, LLC, dba Uown',
    validMerchant: 'TerraceFinance',
  },

  // ── SR-BLOCKED (NJ, VT, MN, ME) ─────────────────────────────────────────────
  // stateCheck rejects these states during origination.
  // No uown_esign_document is created (regulatory invariant).
  // blockedReason — invariant substring captured from qa2 smoke 2026-04-28 (lead 16022, NJ):
  //   "[ApplicationProcessor] Application denied at step: No business in state: <STATE>"
  // Only the trailing state code varies; the substring below is the stable invariant
  // shared by all 4 blocked states. Tests assert via case-insensitive includes().
  {
    state: 'NJ',
    allowed: false,
    expectedProvider: null,
    lessor: '',
    validMerchant: 'TerraceFinance',
    blockedReason: 'Application denied at step: No business in state: NJ',
  },
  {
    state: 'VT',
    allowed: false,
    expectedProvider: null,
    lessor: '',
    validMerchant: 'TerraceFinance',
    blockedReason: 'Application denied at step: No business in state: VT',
  },
  {
    state: 'MN',
    allowed: false,
    expectedProvider: null,
    lessor: '',
    validMerchant: 'TerraceFinance',
    blockedReason: 'Application denied at step: No business in state: MN',
  },
  {
    state: 'ME',
    allowed: false,
    expectedProvider: null,
    lessor: '',
    validMerchant: 'TerraceFinance',
    blockedReason: 'Application denied at step: No business in state: ME',
  },
] as const;

/** All 47 allowed states (GOWSIGN + SIGNWELL). */
export const ALLOWED_STATES: readonly StateMatrixRow[] = STATE_MATRIX.filter((r) => r.allowed);

/** The 4 blocked states (NJ, VT, MN, ME). */
export const BLOCKED_STATES: readonly StateMatrixRow[] = STATE_MATRIX.filter((r) => !r.allowed);

/**
 * qa2-baseline grouping. Use the env-aware helpers below when the suite
 * targets a specific env, since template availability differs per env.
 *
 * @deprecated for cross-env tests — prefer `getGowsignStatesForEnv(env)`.
 */
export const GOWSIGN_STATES: readonly StateMatrixRow[] = STATE_MATRIX.filter(
  (r) => r.expectedProvider === 'GOWSIGN',
);

/**
 * qa2-baseline grouping. See note on `GOWSIGN_STATES`.
 *
 * @deprecated for cross-env tests — prefer `getSignwellStatesForEnv(env)`.
 */
export const SIGNWELL_STATES: readonly StateMatrixRow[] = STATE_MATRIX.filter(
  (r) => r.expectedProvider === 'SIGNWELL',
);

// ──────────────────────────────────────────────────────────────────────
// Env-aware provider resolution
// ──────────────────────────────────────────────────────────────────────

/** Recognized envs for provider override resolution. Mirrors testConfig.env values. */
export type EnvName = 'sandbox' | 'qa1' | 'qa2' | 'stg' | 'dev1' | 'dev2' | 'dev3';

/**
 * Per-env overrides for `expectedProvider`. The default value of each row
 * encodes the qa2 baseline; this map flips specific (state, env) pairs when
 * template availability differs.
 *
 * Current entries:
 *   - CA on stg → SIGNWELL: GoSign template not yet deployed in stg (2026-04-29).
 *     Frontend falls back to merchant.esign_client (SIGNWELL).
 *   - AL on stg → SIGNWELL [inferred, 2026-06-18]: AL templates are live in qa2
 *     but stg almost certainly lags (stg DB unreachable to confirm — verify when reachable).
 *
 * When product distributes the GoSign template to a new env or state, add or
 * remove the entry here AND update the comment with the rollout date.
 */
const PROVIDER_ENV_OVERRIDES: Readonly<
  Record<string, Partial<Record<EnvName, SigningProvider>>>
> = {
  CA: {
    stg: 'SIGNWELL',
  },
  AL: {
    stg: 'SIGNWELL',
  },
};

/**
 * Resolve the expected provider for a row in the given env.
 * Returns null for blocked rows.
 */
export function getExpectedProviderForEnv(
  row: StateMatrixRow,
  env: string,
): SigningProvider | null {
  if (!row.allowed) return null;
  const override = PROVIDER_ENV_OVERRIDES[row.state]?.[env as EnvName];
  return override ?? row.expectedProvider;
}

/** Allowed rows whose resolved provider in `env` is GOWSIGN. */
export function getGowsignStatesForEnv(env: string): readonly StateMatrixRow[] {
  return STATE_MATRIX.filter((r) => getExpectedProviderForEnv(r, env) === 'GOWSIGN');
}

/** Allowed rows whose resolved provider in `env` is SIGNWELL. */
export function getSignwellStatesForEnv(env: string): readonly StateMatrixRow[] {
  return STATE_MATRIX.filter((r) => getExpectedProviderForEnv(r, env) === 'SIGNWELL');
}

/**
 * 4-row smoke subset for Task #5 validation.
 * Runs before enabling the full nightly suite.
 * Tag: @signing-smoke
 */
export const SMOKE_SUBSET: readonly StateMatrixRow[] = STATE_MATRIX.filter((r) =>
  ['CA', 'CO', 'AK', 'NJ'].includes(r.state),
);

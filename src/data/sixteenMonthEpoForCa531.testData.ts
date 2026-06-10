/**
 * Test data constants for svc#531 (16-month EPO for CA).
 *
 * Only constants — no env config (env is sourced from `.env` per project
 * convention, see commit e1c1f8b "testData is now test data only").
 *
 * Merchant PKs validated against `uown_merchant` rows referenced by the SPEC
 * (Section 6 Scenario Matrix). Brand is derived from `ref_merchant_code` at
 * runtime — never inferred from `merchant_name` (see project memory
 * `reference_kornerstone_brand_by_ref_code`).
 *
 * Environment-aware: PKs and program names differ between qa1 and stg.
 * Use `getIssue531Data(env)` to resolve the correct configuration.
 */

interface Issue531Config {
  merchants: {
    UOWN_DANIELS: number;
    UOWN_TIRE_AGENT: number;
    UOWN_PAY_POSSIBLE: number;
    KS3015_5TH_AVE: number;
    KS5936_GRIFFINS: number;
  };
  cashPriceUSD: number;
  state: { CA: 'CA'; NY: 'NY' };
  term: { THIRTEEN: 13; SIXTEEN: 16 };
  tolerance: number;
  programs: {
    DANIELS_CA_13M: string;
    DANIELS_CA_16M: string;
    DANIELS_NY_16M: string;
    KS3015_CA_16M: string;
    KS5936_CA_13M: string;
    KS5936_CA_16M: string;
    KS5936_NY_16M: string;
    PAY_POSSIBLE_CA_16M: string;
  };
}

const QA1_DATA: Issue531Config = {
  merchants: {
    UOWN_DANIELS: 6108,
    UOWN_TIRE_AGENT: 566,
    UOWN_PAY_POSSIBLE: 7048,
    KS3015_5TH_AVE: 7099,
    KS5936_GRIFFINS: 7098,
  },
  cashPriceUSD: 3500,
  state: { CA: 'CA', NY: 'NY' },
  term: { THIRTEEN: 13, SIXTEEN: 16 },
  tolerance: 0.01,
  programs: {
    DANIELS_CA_13M: '2016 CA Program (SAC 13mo Code 1)',
    DANIELS_CA_16M: 'KWC-2',
    DANIELS_NY_16M: 'KWC-2',
    KS3015_CA_16M: 'KWC-2.3',
    KS5936_CA_13M: 'GOW 13 month program',
    KS5936_CA_16M: 'GOW 16 month program',
    KS5936_NY_16M: 'GOW 16 month program',
    PAY_POSSIBLE_CA_16M: 'GOW 16 month program',
  },
};

/**
 * STG environment: KS5936 is NOT registered in origination API and has no 16m
 * programs. KS3015 (pk=10138) replaces it for all Kornerstone CTs.
 * PayPossible PK is 8011 (not 7048). Program names differ for 16m.
 * DanielsJewelers PK (6108) is the same but has no 16m program.
 * Validated against stg DB 2026-05-25.
 */
const STG_DATA: Issue531Config = {
  merchants: {
    UOWN_DANIELS: 6108,
    UOWN_TIRE_AGENT: 566,
    UOWN_PAY_POSSIBLE: 8011,
    KS3015_5TH_AVE: 10138,
    // KS5936 is NOT available in stg origination API; use KS3015 instead.
    // This PK is kept for type compat but CTs should use KS3015_5TH_AVE.
    KS5936_GRIFFINS: 10138,
  },
  cashPriceUSD: 3500,
  state: { CA: 'CA', NY: 'NY' },
  term: { THIRTEEN: 13, SIXTEEN: 16 },
  tolerance: 0.01,
  programs: {
    DANIELS_CA_13M: '2016 CA Program (SAC 13mo Code 1)',
    DANIELS_CA_16M: 'KWC-2',
    DANIELS_NY_16M: 'KWC-2',
    KS3015_CA_16M: 'KW-16-2.3',
    // KS5936 not available in stg; mapped to KS3015 programs.
    // pk=12 ('2016 CA Program') linked to KS3015 manually (2026-05-26).
    KS5936_CA_13M: '2016 CA Program (SAC 13mo Code 1)',
    KS5936_CA_16M: 'KW-16-2.3',
    KS5936_NY_16M: 'KW-16-2.3',
    PAY_POSSIBLE_CA_16M: 'KWC-2',
  },
};

export function getIssue531Data(env?: string): Issue531Config {
  const resolved = env || process.env.ENV || 'qa1';
  if (resolved === 'stg') return STG_DATA;
  return QA1_DATA;
}

/** @deprecated Use `getIssue531Data(env)` for env-aware config. Kept for backwards compat (defaults to qa1). */
export const ISSUE531_DATA = QA1_DATA;

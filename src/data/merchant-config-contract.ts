/**
 * Canonical merchant configuration contract used as preflight before creating
 * new applications. See `.claude/context/shared/application-lifecycle-protocol.md § Pitfall #10`.
 *
 * Rule: only checkboxes listed in `mustBeTrue` may be checked; every other
 * boolean flag known to the settings panel must be false. Enforces the minimal
 * program count so `sendApplication` / `getMissingFields` don't fail for lack
 * of a 13-month or 16-month plan.
 *
 * Contract is split per brand — the base reflects UOWN merchants (TireAgent
 * etc); Kornerstone carves out brand-specific legitimate differences
 * (webhook integration + hold deposit), confirmed against qa2 merchant KS3015.
 */
export interface MerchantConfigContract {
  mustBeTrue: readonly string[];
  mustBeFalse: readonly string[];
  minPrograms: { months13: number; months16: number };
  /**
   * Minimum number of programs per term that must be currently active (date window
   * covers today). Enforced via `uown_merchant_program.is_active=true` + date predicate.
   *
   * Added for the Schedule Program Activation/Deactivation feature: a 16-month program
   * may exist and count toward `minPrograms.months16` but have `deactivationDate` in the
   * past, which would break CT-DateSelect-* and CT-C-* preconditions.
   *
   * Defaults to `minPrograms` when omitted — preserving legacy behavior for other features.
   */
  minActivePrograms?: { months13?: number; months16?: number };
  /** Extra validations beyond boolean flags (e.g., non-empty string fields). */
  requiredNonEmpty?: readonly string[];
}

export type MerchantBrand = 'UOWN' | 'KORNERSTONE';

const BASE_MUST_BE_TRUE = [
  'isActive',
  'acceptNewApps',
  'isCcRequired',
  'isAchRequired',
  'chargeProcessingFee',
  'chargeProcessingFeeBeforeEsign',
  'allowChangeToExpired',
  'postMessage',
  'recordSigningFlow',
  'twoDayFundingException',
  'fiveDayFundingException',
  'epo10',
  'epo5',
] as const;

const BASE_MUST_BE_FALSE = [
  'isDeleted',
  'removeMerchantFromUsers',
  'isIntellicheckRequired',
  'isSeonIdCheckRequired',
  'isBankVerificationRequired',
  'verifyPhoneBeforeSigning',
  'holdDeposit',
  'isSignedToFunding',
  'checkUwForVerification',
  'returnLambdaScore',
  'useLexisNexis',
  'useNeuroIdCheck',
  'useWebhook',
  'isItemSplit',
  'offerInsurance',
  'autoDenyApplication',
  'isPlaidVerificationRequired',
  'isFraudCheckRequired',
  'verifyPhone',
  'verifyEmail',
  'verifyIp',
  'useNeustar',
  'useSentilink',
] as const;

export const UOWN_MERCHANT_CONFIG: MerchantConfigContract = {
  mustBeTrue: BASE_MUST_BE_TRUE,
  mustBeFalse: BASE_MUST_BE_FALSE,
  minPrograms: { months13: 2, months16: 2 },
  minActivePrograms: { months13: 1, months16: 1 },
};

/**
 * Kornerstone override — `useWebhook` and `holdDeposit` are legitimate true
 * for this brand (webhook URL points to `integrationsapidev.kornerstonecredit.com`
 * and the brand uses a deposit hold policy). When useWebhook is true the
 * `webhookUrl` field must be populated — enforced via `requiredNonEmpty`.
 */
const KORNERSTONE_MUST_BE_TRUE = [
  ...BASE_MUST_BE_TRUE,
  'useWebhook',
  'holdDeposit',
] as const;

const KORNERSTONE_MUST_BE_FALSE = BASE_MUST_BE_FALSE.filter(
  (flag) => flag !== 'useWebhook' && flag !== 'holdDeposit',
);

export const KORNERSTONE_MERCHANT_CONFIG: MerchantConfigContract = {
  mustBeTrue: KORNERSTONE_MUST_BE_TRUE,
  mustBeFalse: KORNERSTONE_MUST_BE_FALSE,
  minPrograms: { months13: 2, months16: 2 },
  minActivePrograms: { months13: 1, months16: 1 },
  requiredNonEmpty: ['webhookUrl'],
};

/** Back-compat alias — points at the UOWN base contract. */
export const REQUIRED_MERCHANT_CONFIG = UOWN_MERCHANT_CONFIG;

/**
 * Resolve which contract applies to a merchant based on clientType from
 * merchantInfo. qa2 observed values: `KORNERSTONE`, `TIRE_AGENT`, `API`, etc.
 */
export function resolveContract(clientType: string | null | undefined): MerchantConfigContract {
  if ((clientType ?? '').toUpperCase() === 'KORNERSTONE') {
    return KORNERSTONE_MERCHANT_CONFIG;
  }
  return UOWN_MERCHANT_CONFIG;
}

export function resolveBrand(clientType: string | null | undefined): MerchantBrand {
  return (clientType ?? '').toUpperCase() === 'KORNERSTONE' ? 'KORNERSTONE' : 'UOWN';
}

export type MerchantConfigDriftKind =
  | 'flag-should-be-true'
  | 'flag-should-be-false'
  | 'field-required-non-empty'
  | 'insufficient-programs-13m'
  | 'insufficient-programs-16m'
  | 'insufficient-active-programs-13m'
  | 'insufficient-active-programs-16m';

export interface MerchantConfigDrift {
  kind: MerchantConfigDriftKind;
  field?: string;
  actual?: unknown;
  expected?: unknown;
}

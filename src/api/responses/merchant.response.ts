import type { BaseResponseBody } from './base.response.js';

/**
 * svc LosLeadController.getMerchantsByRefCode returns `List<Merchant>` as a
 * JSON array. Each element wraps settings under `merchantInfo`.
 */
export interface MerchantInfoPayload {
  merchantPK?: number;
  refMerchantCode?: string;
  merchantName?: string;
  isSignedToFunding?: boolean;
  isActive?: boolean;
  acceptNewApps?: boolean;
  isCcRequired?: boolean;
  isAchRequired?: boolean;
  chargeProcessingFee?: boolean;
  chargeProcessingFeeBeforeEsign?: boolean;
  allowChangeToExpired?: boolean;
  postMessage?: boolean;
  recordSigningFlow?: boolean;
  twoDayFundingException?: boolean;
  fiveDayFundingException?: boolean;
  epo10?: boolean | null;
  epo5?: boolean | null;
  [key: string]: unknown;
}

export interface MerchantDetail {
  pk?: number;
  merchantInfo?: MerchantInfoPayload;
  isNew?: boolean;
  [key: string]: unknown;
}

/** Response body of svc `getMerchantsByRefCode` — JSON array. */
export type MerchantSettingsResponse = MerchantDetail[];

export interface MerchantSearchCriteria {
  merchant_name?: string;
  location_name?: string;
  ref_merchant_code?: string;
  search?: string;
  is_active?: boolean;
  rebate_type?: string;
  page_number?: number;
  max_results?: number;
  [key: string]: unknown;
}

export interface MerchantSearchResponse extends BaseResponseBody {
  merchants?: MerchantDetail[];
  totalRows?: number;
}

export interface UpdateMerchantsPayload {
  merchantPks: number[];
  merchantData: Record<string, unknown>;
  programsPks?: number[];
  removeOldPrograms?: boolean;
  runAsynchronously?: boolean;
}

export interface SubmitApplicationErrorLog {
  pk?: number;
  message?: string;
  leadPk?: number;
  merchantPk?: number;
  refMerchantCode?: string;
  merchantName?: string;
  locationName?: string;
  firstName?: string;
  lastName?: string;
  last4ssn?: string;
  first5Cc?: string;
  last4Cc?: string;
  rowCreatedTimestamp?: string;
  rowUpdatedTimestamp?: string;
  tenantId?: number;
  webUserId?: number;
  agent?: string;
}

export interface SubmitApplicationErrorLogSearchResults {
  logs?: SubmitApplicationErrorLog[];
  totalCount?: number;
  moreResults?: boolean;
}

export interface MerchantApiErrorLog {
  pk?: number;
  message?: string;
  leadPk?: number;
  merchantPk?: number;
  refMerchantCode?: string;
  merchantName?: string;
  locationName?: string;
  firstName?: string;
  lastName?: string;
  last4ssn?: string;
  rowCreatedTimestamp?: string;
  rowUpdatedTimestamp?: string;
  tenantId?: number;
  webUserId?: number;
  agent?: string;
}

export interface MerchantApiErrorLogSearchResults {
  logs?: MerchantApiErrorLog[];
  totalCount?: number;
  moreResults?: boolean;
}

/**
 * Shape returned by svc MerchantProgramController:
 * `@GetMapping("/uown/getMerchantProgramsByMerchant/{merchantPk}")` returns
 * `List<MerchantProgram>` where each item has an embedded `programInfo`.
 *
 * Mirrors `svc/pojo/ProgramInfo.java` (with LocalDate fields serialized as
 * `yyyy-MM-dd` via `@JsonFormat`). All fields are optional because the backend
 * populates defaults and JPA-level columns at persistence time — clients should
 * only read what they set or what is documented.
 */
export interface ProgramInfo {
  programPk?: number;
  programId?: string;
  programName?: string;
  termMonths?: number;
  programType?: string;
  /**
   * Reflects the current activation window (activationDate ≤ today ≤ deactivationDate).
   * Not source of truth — the dates are. Backend recomputes on save via
   * `ProgramActivationUtils.isActiveOnDate`.
   */
  active?: boolean;
  groupName?: string | null;
  /** ISO YYYY-MM-DD — null/undefined means no lower bound. */
  activationDate?: string | null;
  /** ISO YYYY-MM-DD — null/undefined means no upper bound. */
  deactivationDate?: string | null;
  peakCampaignId?: number;
  offPeakCampaignId?: number;
  moneyFactor?: number;
  quickPayPct?: number;
  payoffDiscount?: number;
  chargeAppFeeIfDeliveryIsZero?: boolean;
  dealerDiscount?: number;
  maxDollarAmount?: number;
  dealerRebate?: number;
  epoDays?: number;
  epoFeePercent?: number;
  minCartAmount?: number;
  maxCartAmount?: number;
  lendingCategoryType?: string;
  allowedFrequencyOverride?: string;
  /** Comma-separated state codes (backend uses raw TEXT column). */
  states?: string;
  processingFeeOverride?: number;
  amountChargedAtSigning?: number;
  [key: string]: unknown;
}

export interface MerchantProgram {
  pk?: number;
  programInfo?: ProgramInfo;
  [key: string]: unknown;
}

/** Response body of `getMerchantProgramsByMerchantPk` — plain JSON array. */
export type MerchantProgramsResponse = MerchantProgram[];

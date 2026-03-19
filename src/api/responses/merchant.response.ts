import type { BaseResponseBody } from './base.response.js';

export interface MerchantSettingsResponse extends BaseResponseBody {
  merchants?: MerchantDetail[];
}

export interface MerchantDetail {
  merchantPk?: number;
  merchantNumber?: string;
  merchantName?: string;
  isSignedToFunding?: boolean;
  isActive?: boolean;
  dealerDiscountOverride?: number | null;
  dealerRebateOverride?: number | null;
  dealerRebateType?: string | null;
  uwPipeline?: string | null;
  fraudThreshold?: number | null;
  maxApprovalAmount?: number | null;
  [key: string]: unknown;
}

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

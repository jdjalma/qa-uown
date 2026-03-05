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
  [key: string]: unknown;
}

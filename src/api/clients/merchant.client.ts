import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { MerchantSettingsResponse } from '../responses/merchant.response.js';

export class MerchantClient extends BaseClient {
  async getMerchantsByRefCode(merchantRefCodes: string): Promise<ApiResponse<MerchantSettingsResponse>> {
    return this.post<MerchantSettingsResponse>(
      '/uown/los/getMerchantsByRefCode',
      { merchantRefCodes },
      'origination',
    );
  }

  async isSignedToFundingEnabled(merchantRefCode: string): Promise<boolean> {
    const response = await this.getMerchantsByRefCode(merchantRefCode);
    const merchant = response.body?.merchants?.[0];
    return merchant?.isSignedToFunding === true;
  }
}

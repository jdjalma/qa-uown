import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  MerchantSettingsResponse,
  MerchantSearchCriteria,
  MerchantSearchResponse,
  UpdateMerchantsPayload,
  SubmitApplicationErrorLogSearchResults,
  MerchantApiErrorLogSearchResults,
} from '../responses/merchant.response.js';
import type { BaseResponseBody } from '../responses/base.response.js';

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

  async getMerchantsByCriteria(criteria: MerchantSearchCriteria): Promise<ApiResponse<MerchantSearchResponse>> {
    return this.post<MerchantSearchResponse>(
      '/uown/getMerchantsByCriteria',
      criteria,
      'origination',
    );
  }

  async updateMerchants(payload: UpdateMerchantsPayload): Promise<ApiResponse<BaseResponseBody>> {
    return this.post<BaseResponseBody>(
      '/uown/updateMerchants',
      payload,
      'svc',
    );
  }

  async getSubmitApplicationErrorLogs(
    from: string,
    to: string,
    options?: { search?: string; pageNumber?: number; maxResults?: number },
  ): Promise<ApiResponse<SubmitApplicationErrorLogSearchResults>> {
    const params = new URLSearchParams({ from, to });
    if (options?.search) params.set('search', options.search);
    if (options?.pageNumber !== undefined) params.set('pageNumber', String(options.pageNumber));
    if (options?.maxResults !== undefined) params.set('maxResults', String(options.maxResults));
    return this.get<SubmitApplicationErrorLogSearchResults>(
      `/uown/getSubmitApplicationErrorLogs?${params.toString()}`,
    );
  }

  async getMerchantApiErrorLogs(
    from: string,
    to: string,
    options?: { search?: string; pageNumber?: number; maxResults?: number },
  ): Promise<ApiResponse<MerchantApiErrorLogSearchResults>> {
    const params = new URLSearchParams({ from, to });
    if (options?.search) params.set('search', options.search);
    if (options?.pageNumber !== undefined) params.set('pageNumber', String(options.pageNumber));
    if (options?.maxResults !== undefined) params.set('maxResults', String(options.maxResults));
    return this.get<MerchantApiErrorLogSearchResults>(
      `/uown/getMerchantApiErrorLogs?${params.toString()}`,
    );
  }
}

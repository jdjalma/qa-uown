import { BaseClient } from './base.client.js';
import { type ApiResponse } from '../responses/api-response.js';
import type { FindCustomerBody } from '../bodies/customer.body.js';
import type {
  FindCustomerResponse,
  LegacyAccountSearchResponse,
} from '../responses/customer.response.js';

/**
 * IVR/TMS customer search client (Task #510).
 *
 * Both endpoints live under the TMS base path and require the FIVE9 TMS API
 * key for authorization (same pattern as `AccountClient.adjustNextDueDate`).
 */
export class CustomersClient extends BaseClient {
  /**
   * Legacy IVR/TMS customer search (Servicing only). Marked @Deprecated in Task #510.
   * Uses FIVE9_TMS_API_KEY auth header (same pattern as AccountClient.adjustNextDueDate).
   */
  async searchAccountsV1(body: FindCustomerBody): Promise<ApiResponse<LegacyAccountSearchResponse>> {
    return this.postTms<LegacyAccountSearchResponse>('/uown/tms/v1/accounts/search', body);
  }

  /**
   * New IVR/TMS customer search with Origination fallback (Task #510).
   * Returns FindCustomerResponse with leadPk, leadStatus, customerAccountDomain.
   */
  async searchCustomersV2(body: FindCustomerBody): Promise<ApiResponse<FindCustomerResponse>> {
    return this.postTms<FindCustomerResponse>('/uown/tms/v2/customers/search', body);
  }

  // postTms herdado de BaseClient (FIVE9 key).
}

import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  AccountSummaryResponse,
  ServicingInformationBody,
  ServicingInformationResponse,
} from '../responses/svc-payoff.response.js';

export class SvcPayoffClient extends BaseClient {
  async getPayoffAmount(accountPk: number | string): Promise<ApiResponse<number>> {
    return this.get<number>(`/uown/svc/getPayoffAmount/${accountPk}`);
  }

  async getAccountSummary(accountPk: number | string): Promise<ApiResponse<AccountSummaryResponse>> {
    return this.get<AccountSummaryResponse>(`/uown/svc/getAccountSummary/${accountPk}`);
  }

  async getServicingInfo(accountPk: number | string): Promise<ApiResponse<ServicingInformationResponse>> {
    return this.get<ServicingInformationResponse>(`/uown/svc/getServicingInfo/${accountPk}`);
  }

  /**
   * Update servicing information for an account. Used to shift
   * `_90DayExpirationDate` (EPO eligibility window) without rewriting the
   * schedule. Backend creates a `DATA_CHANGE` activity log entry on success.
   */
  async createOrUpdateServicingInfo(
    body: ServicingInformationBody,
  ): Promise<ApiResponse<ServicingInformationResponse>> {
    return this.post<ServicingInformationResponse>('/uown/svc/createOrUpdateServicingInfo', body);
  }
}

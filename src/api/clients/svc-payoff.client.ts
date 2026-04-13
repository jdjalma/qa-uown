import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { AccountSummaryResponse, ServicingInformationResponse } from '../responses/svc-payoff.response.js';

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
}

import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { AccountSummaryResponse } from '../responses/svc-payoff.response.js';

export class SvcPayoffClient extends BaseClient {
  async getPayoffAmount(accountPk: number | string): Promise<ApiResponse<number>> {
    return this.get<number>(`/uown/svc/getPayoffAmount/${accountPk}`);
  }

  async getAccountSummary(accountPk: number | string): Promise<ApiResponse<AccountSummaryResponse>> {
    return this.get<AccountSummaryResponse>(`/uown/svc/getAccountSummary/${accountPk}`);
  }
}

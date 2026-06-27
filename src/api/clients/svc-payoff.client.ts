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

  /**
   * Returns the prorated payoff amount for the given account as of the given date.
   * Backs the Prorated Amount calculator modal (#calculator on the Account Summary Bar).
   * Read-only — no activity log / mutation (BR-ACC-5). Source: docs/knowledge-base/
   * scheduled-payments.md BR-23.
   * @param onDate ISO date string YYYY-MM-DD (NOT the MM/DD/YYYY shown in the UI field).
   */
  async getProrateAmount(
    accountPk: number | string,
    onDate: string,
  ): Promise<ApiResponse<number>> {
    return this.get<number>(`/uown/svc/getProrateAmount/${accountPk}?onDate=${onDate}`);
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

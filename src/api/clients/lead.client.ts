import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { ChangeLeadStatusResponseBody, UpdateFundingStatusResponseBody } from '../responses/lead.response.js';
import type { MerchantInfo } from '../bodies/application.body.js';
import {
  type ChangeLeadStatusBody,
  buildChangeLeadStatusBody,
} from '../bodies/lead.body.js';

export class LeadClient extends BaseClient {

  async changeLeadStatus(body: ChangeLeadStatusBody): Promise<ApiResponse<ChangeLeadStatusResponseBody>>;
  async changeLeadStatus(merchant: MerchantInfo, leadPk: number, newStatus: string, comment?: string): Promise<ApiResponse<ChangeLeadStatusResponseBody>>;
  async changeLeadStatus(
    bodyOrMerchant: ChangeLeadStatusBody | MerchantInfo,
    leadPk?: number,
    newStatus?: string,
    comment?: string,
  ): Promise<ApiResponse<ChangeLeadStatusResponseBody>> {
    const body = leadPk !== undefined && newStatus !== undefined
      ? buildChangeLeadStatusBody(bodyOrMerchant as MerchantInfo, leadPk, newStatus, comment)
      : bodyOrMerchant as ChangeLeadStatusBody;

    return this.post<ChangeLeadStatusResponseBody>('/uown/los/changeLeadStatus', body);
  }

  /**
   * Update funding status for one or more leads.
   * Used to move leads from FUNDING → FUNDED (or to REQUEST_REFUND/REFUNDED).
   * Endpoint: /uown/los/updateFundingStatus
   */
  async updateFundingStatus(leadPks: number[], status: string): Promise<ApiResponse<UpdateFundingStatusResponseBody>> {
    return this.post<UpdateFundingStatusResponseBody>('/uown/los/updateFundingStatus', {
      leadPks,
      status,
    });
  }
}

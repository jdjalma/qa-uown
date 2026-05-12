import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  ChangeLeadStatusResponseBody,
  UpdateFundingStatusResponseBody,
  ModifyInvoiceResponseBody,
} from '../responses/lead.response.js';
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

  /**
   * Modify lease pos-signing — invokes the backend's modifyInvoiceForLead
   * flow that cancels the original contract, transitions the lead to
   * LEASE_MOD_REQUESTED, and creates a new lead with a fresh contract.
   *
   * Endpoint: POST /uown/los/modifyInvoiceForLead/{leadPk}
   * Pre-condition: lead must be SIGNED or beyond
   * Returns: { newLeadPk } where newLeadPk is the spawned lead's pk.
   */
  async modifyInvoiceForLead(leadPk: number): Promise<ApiResponse<ModifyInvoiceResponseBody>> {
    return this.post<ModifyInvoiceResponseBody>(`/uown/los/modifyInvoiceForLead/${leadPk}`, {});
  }
}

import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { FinalizeEmailRequest } from '../bodies/correspondence.body.js';

/**
 * Client for UOWN svc correspondence endpoints (merchant-portal-driven
 * notifications: Finalize Purchase emails/SMS, etc.).
 *
 * Backed by `com.uownleasing.svc.rest.MerchantPortalController` in the
 * `svc` repo. Uses the default `BaseClient` auth (Authorization + x-api-key
 * headers) — same as the other merchant-portal clients.
 */
export class CorrespondenceClient extends BaseClient {
  /**
   * Triggers the Finalize Purchase notification flow for a lead. Depending on
   * the lead state, svc will send either a `FinalizePurchaseEmail` or a
   * `FinalizePurchaseSms` to the primary customer.
   *
   * Backend: `MerchantPortalController#sendFinalizeEmailToCustomer`
   *          → `SendFinalizeService#sendFinalizeEmailToCustomer(long, String)`
   * Endpoint: `POST /uown/sendFinalizeEmailToCustomer`
   *
   * The controller returns `void` (HTTP 200 with empty body), so the parsed
   * body is `void`/empty — callers should branch on `response.status` /
   * `response.ok`.
   *
   * @param leadPk      PK of the lead in `uown_los_lead`.
   * @param redirectUrl URL the customer is sent to after finalizing.
   */
  async sendFinalizeEmailToCustomer(
    leadPk: number,
    redirectUrl: string,
  ): Promise<ApiResponse<void>> {
    const body: FinalizeEmailRequest = { leadPk, redirectUrl };
    return this.post<void>('/uown/sendFinalizeEmailToCustomer', body);
  }
}

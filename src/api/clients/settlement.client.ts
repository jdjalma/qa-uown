import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { SettleApplicationResponseBody } from '../responses/settlement.response.js';
import type { MerchantInfo } from '../bodies/application.body.js';
import {
  type SettleApplicationBody,
  buildSettleApplicationBody,
} from '../bodies/settlement.body.js';

export class SettlementClient extends BaseClient {

  async settleApplication(body: SettleApplicationBody): Promise<ApiResponse<SettleApplicationResponseBody>>;
  async settleApplication(merchant: MerchantInfo, leadUuid: string): Promise<ApiResponse<SettleApplicationResponseBody>>;
  async settleApplication(
    bodyOrMerchant: SettleApplicationBody | MerchantInfo,
    leadUuid?: string,
  ): Promise<ApiResponse<SettleApplicationResponseBody>> {
    const body = leadUuid !== undefined
      ? buildSettleApplicationBody(bodyOrMerchant as MerchantInfo, leadUuid)
      : bodyOrMerchant as SettleApplicationBody;

    return this.post<SettleApplicationResponseBody>('/uown/los/settleApplication', body);
  }
}

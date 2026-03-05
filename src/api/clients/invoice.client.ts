import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { SendInvoiceResponseBody } from '../responses/invoice.response.js';
import type { MerchantInfo } from '../bodies/application.body.js';
import {
  type SendInvoiceBody,
  type SendInvoiceOptions,
  buildSendInvoiceBody,
} from '../bodies/invoice.body.js';

export class InvoiceClient extends BaseClient {

  async sendInvoice(body: SendInvoiceBody): Promise<ApiResponse<SendInvoiceResponseBody>>;
  async sendInvoice(merchant: MerchantInfo, leadUuid: string, options?: SendInvoiceOptions): Promise<ApiResponse<SendInvoiceResponseBody>>;
  async sendInvoice(
    bodyOrMerchant: SendInvoiceBody | MerchantInfo,
    leadUuid?: string,
    options?: SendInvoiceOptions,
  ): Promise<ApiResponse<SendInvoiceResponseBody>> {
    const body = leadUuid !== undefined
      ? buildSendInvoiceBody(bodyOrMerchant as MerchantInfo, leadUuid, options)
      : bodyOrMerchant as SendInvoiceBody;

    return this.post<SendInvoiceResponseBody>('/uown/los/sendInvoice', body);
  }
}

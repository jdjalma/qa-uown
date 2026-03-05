import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { CancelAccountResponseBody } from '../responses/account.response.js';
import {
  type CancelAccountBody,
  buildCancelAccountBody,
} from '../bodies/account.body.js';

export class AccountClient extends BaseClient {

  async cancelAccount(accountPk: string | number, body: CancelAccountBody): Promise<ApiResponse<CancelAccountResponseBody>>;
  async cancelAccount(accountPk: string | number, comment: string, refundAllPayments: boolean): Promise<ApiResponse<CancelAccountResponseBody>>;
  async cancelAccount(
    accountPk: string | number,
    bodyOrComment: CancelAccountBody | string,
    refundAllPayments?: boolean,
  ): Promise<ApiResponse<CancelAccountResponseBody>> {
    const body = typeof bodyOrComment === 'string'
      ? buildCancelAccountBody(bodyOrComment, refundAllPayments!)
      : bodyOrComment;

    // accountPk = servicing account primary key (NOT leadPk)
    // Available from: customer page "Account Number" field, or DB query
    return this.post<CancelAccountResponseBody>(`/uown/svc/cancelAccount/${accountPk}`, body);
  }
}

import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { AuthorizeCreditCardResponseBody, CcTransaction, SvCreditCardResponse } from '../responses/credit-card.response.js';
import {
  type AuthorizeCreditCardBody,
  type AuthorizeCreditCardOptions,
  buildAuthorizeCreditCardBody,
} from '../bodies/credit-card.body.js';
import type { UpdateCcTransactionBody } from '../bodies/payment-arrangement.body.js';

export class CreditCardClient extends BaseClient {

  async authorizeCreditCard(body: AuthorizeCreditCardBody): Promise<ApiResponse<AuthorizeCreditCardResponseBody>>;
  async authorizeCreditCard(leadPk: string, firstName: string, lastName: string, options?: AuthorizeCreditCardOptions): Promise<ApiResponse<AuthorizeCreditCardResponseBody>>;
  async authorizeCreditCard(
    bodyOrLeadPk: AuthorizeCreditCardBody | string,
    firstName?: string,
    lastName?: string,
    options?: AuthorizeCreditCardOptions,
  ): Promise<ApiResponse<AuthorizeCreditCardResponseBody>> {
    const body = typeof bodyOrLeadPk === 'string'
      ? buildAuthorizeCreditCardBody(bodyOrLeadPk, firstName!, lastName!, options)
      : bodyOrLeadPk;

    return this.post<AuthorizeCreditCardResponseBody>('/uown/los/authorizeCreditCard', body, 'origination');
  }

  async updateCcTransaction(ccTxPk: number, body: UpdateCcTransactionBody): Promise<ApiResponse<void>> {
    return this.put<void>(`/uown/svc/payments/credit-cards/${ccTxPk}`, body);
  }

  async getCcTransactions(accountPk: number): Promise<ApiResponse<CcTransaction[]>> {
    return this.get<CcTransaction[]>(`/uown/svc/getCCTransactions/${accountPk}`);
  }

  /**
   * Tokenize + persist a credit card on a servicing account. Returns the
   * `SvCreditCard` with `creditCardInfo.creditCardPk` + `ccToken` populated,
   * which should be fed back into `makeCreditCardPayments` with
   * `useCardOnFile: true` to avoid the FK violation bug observed when the
   * plural endpoint handles tokenization + arrangement creation inline.
   * Backend: svc SvcCreditCardController.java:74.
   */
  async createOrUpdateCreditCard(ccInfo: {
    accountPk: number;
    ccFirstName: string;
    ccLastName: string;
    ccNumber: string;
    ccExp: string;
    cvc: string;
    ccType?: string;
    ccVendor?: string;
    autoPay?: boolean;
    leadPk?: number;
    [key: string]: unknown;
  }): Promise<ApiResponse<SvCreditCardResponse>> {
    return this.post<SvCreditCardResponse>('/uown/svc/createOrUpdateCreditCard', ccInfo);
  }
}

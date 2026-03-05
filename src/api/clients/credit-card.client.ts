import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { AuthorizeCreditCardResponseBody } from '../responses/credit-card.response.js';
import {
  type AuthorizeCreditCardBody,
  type AuthorizeCreditCardOptions,
  buildAuthorizeCreditCardBody,
} from '../bodies/credit-card.body.js';

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
}

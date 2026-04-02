import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import type { ConfigEnvironment } from '../../config/environment.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { CreateOrUpdateEmailBody } from '../bodies/svc-email.body.js';
import type { ContactInformationResponse, SvEmailUpdateResponse } from '../responses/svc-email.response.js';

export class SvcEmailClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env);
  }

  /** Returns contact info (email + phone lists) for an account. GET /uown/svc/getPrimaryCustomerContactInfo/{accountPk} */
  async getContactInfo(accountPk: string | number): Promise<ApiResponse<ContactInformationResponse>> {
    return this.get<ContactInformationResponse>(`/uown/svc/getPrimaryCustomerContactInfo/${accountPk}`);
  }

  /** Creates or updates an email record. POST /uown/svc/createOrUpdateEmail */
  async createOrUpdateEmail(body: CreateOrUpdateEmailBody): Promise<ApiResponse<SvEmailUpdateResponse>> {
    return this.post<SvEmailUpdateResponse>('/uown/svc/createOrUpdateEmail', body);
  }
}

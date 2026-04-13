import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import type { ConfigEnvironment } from '../../config/environment.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { ContactInformationResponse } from '../responses/svc-email.response.js';
import type { CreateOrUpdateContactInfoBody } from '../bodies/svc-contact.body.js';

export class SvcContactClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env);
  }

  /**
   * Returns contact info (email + phone lists) for an account.
   * GET /uown/svc/getPrimaryCustomerContactInfo/{accountPk}
   *
   * NOTE: Same endpoint as SvcEmailClient.getContactInfo(). Use this client
   * when the test is focused on contact/phone updates rather than email-only flows.
   */
  async getContactInfo(accountPk: string | number): Promise<ApiResponse<ContactInformationResponse>> {
    return this.get<ContactInformationResponse>(`/uown/svc/getPrimaryCustomerContactInfo/${accountPk}`);
  }

  /**
   * Creates or updates primary customer contact information (phone and/or email).
   * POST /uown/svc/createOrUpdatePrimaryCustomerContactInfo
   */
  async createOrUpdateContactInfo(
    body: CreateOrUpdateContactInfoBody,
  ): Promise<ApiResponse<ContactInformationResponse>> {
    return this.post<ContactInformationResponse>('/uown/svc/createOrUpdatePrimaryCustomerContactInfo', body);
  }

  /**
   * Sends a verification code to a phone number or email address.
   * POST /uown/svc/sendVerificationCode/{phoneOrEmail}?company={company}
   *
   * @param phoneOrEmail Phone number without hyphens (e.g. "5551230001") or email address
   * @param company Company identifier — 'UOWN' or 'KORNERSTONE'
   * @returns ApiResponse with no body (204/200)
   */
  async sendVerificationCode(
    phoneOrEmail: string,
    company: 'UOWN' | 'KORNERSTONE' = 'UOWN',
  ): Promise<ApiResponse<void>> {
    return this.post<void>(
      `/uown/svc/sendVerificationCode/${encodeURIComponent(phoneOrEmail)}?company=${company}`,
    );
  }
}

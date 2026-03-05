import { BaseClient } from './base.client.js';
import { type ApiResponse, parseResponse } from '../responses/api-response.js';
import type {
  SendApplicationResponseBody,
  ApplicationStatusResponseBody,
  SubmitApplicationResponseBody,
  CanContinueApplicationResponseBody,
  FinalApprovalDetailsResponseBody,
  MissingFieldsResponseBody,
} from '../responses/application.response.js';
import {
  type SendApplicationBody,
  type ApplicationStatusBody,
  type SubmitApplicationBody,
  type SubmitApplicationOptions,
  type MerchantInfo,
  type ApplicantInfo,
  type OrderInfo,
  buildSendApplicationBody,
  buildApplicationStatusBody,
  buildSubmitApplicationBody,
} from '../bodies/application.body.js';

export class ApplicationClient extends BaseClient {

  /**
   * Create a new application (account) via the sendApplication endpoint.
   * Host: svc-{env}.uownleasing.com (default)
   */
  async sendApplication(body: SendApplicationBody): Promise<ApiResponse<SendApplicationResponseBody>>;
  async sendApplication(merchant: MerchantInfo, applicant: ApplicantInfo, order?: OrderInfo): Promise<ApiResponse<SendApplicationResponseBody>>;
  async sendApplication(
    bodyOrMerchant: SendApplicationBody | MerchantInfo,
    applicant?: ApplicantInfo,
    order?: OrderInfo,
  ): Promise<ApiResponse<SendApplicationResponseBody>> {
    const body = applicant
      ? buildSendApplicationBody(bodyOrMerchant as MerchantInfo, applicant, order)
      : bodyOrMerchant as SendApplicationBody;

    return this.post<SendApplicationResponseBody>('/uown/los/sendApplication', body);
  }

  /**
   * Check the status of an existing application.
   * Host: svc-{env}.uownleasing.com (default)
   */
  async getApplicationStatus(body: ApplicationStatusBody): Promise<ApiResponse<ApplicationStatusResponseBody>>;
  async getApplicationStatus(merchant: MerchantInfo, leadUuid: string): Promise<ApiResponse<ApplicationStatusResponseBody>>;
  async getApplicationStatus(
    bodyOrMerchant: ApplicationStatusBody | MerchantInfo,
    leadUuid?: string,
  ): Promise<ApiResponse<ApplicationStatusResponseBody>> {
    const body = leadUuid !== undefined
      ? buildApplicationStatusBody(bodyOrMerchant as MerchantInfo, leadUuid)
      : bodyOrMerchant as ApplicationStatusBody;

    return this.post<ApplicationStatusResponseBody>('/uown/los/getApplicationStatus', body);
  }

  /**
   * Submit CC + bank info for an existing application (contract submission via API).
   * This is the programmatic equivalent of filling the contract URL form.
   * Endpoint: /uown/api/submitApplication (legacy unified endpoint)
   */
  async submitApplication(body: SubmitApplicationBody): Promise<ApiResponse<SubmitApplicationResponseBody>>;
  async submitApplication(leadPk: string | number, firstName: string, lastName: string, options?: SubmitApplicationOptions): Promise<ApiResponse<SubmitApplicationResponseBody>>;
  async submitApplication(
    bodyOrLeadPk: SubmitApplicationBody | string | number,
    firstName?: string,
    lastName?: string,
    options?: SubmitApplicationOptions,
  ): Promise<ApiResponse<SubmitApplicationResponseBody>> {
    const body = firstName !== undefined
      ? buildSubmitApplicationBody(bodyOrLeadPk as string | number, firstName, lastName!, options)
      : bodyOrLeadPk as SubmitApplicationBody;

    return this.post<SubmitApplicationResponseBody>('/uown/los/submitApplication', body);
  }

  /**
   * Check if an application can be continued using a UUID or short code.
   * Endpoint: POST /uown/los/canContinueApplication
   * Accepts UUID or short code (UUID split on underscore, first part used).
   */
  async canContinueApplication(accountNumber: string): Promise<ApiResponse<CanContinueApplicationResponseBody>> {
    return this.post<CanContinueApplicationResponseBody>('/uown/los/canContinueApplication', {
      accountNumber,
    });
  }

  /**
   * Get final approval details and trigger approval email/SMS.
   * Endpoint: GET /uown/los/getFinalApprovalDetails/{leadPk}
   * Requires Content-Type header even for GET (Spring backend requirement).
   * For approved leads: sends approval email + SMS.
   * For denied leads: returns non-approval message without email/SMS.
   */
  async getFinalApprovalDetails(leadPk: string | number): Promise<ApiResponse<FinalApprovalDetailsResponseBody>> {
    const url = this.resolveUrl(`/uown/los/getFinalApprovalDetails/${leadPk}`);
    const response = await this.request.get(url, {
      headers: { ...this.headers, 'Content-Type': 'application/json' },
    });
    return parseResponse<FinalApprovalDetailsResponseBody>(response);
  }

  /**
   * Get missing fields for a lead using its short code.
   * Endpoint: GET /missing-fields/{shortCode} (origination host)
   * Called automatically during the signing flow for pre-signature validation.
   * @param shortCode - The lead's short code identifier
   * @param options - Optional parameters (e.g. planId for program-specific missing fields)
   */
  async getMissingFields(
    shortCode: string,
    options?: { planId?: string },
  ): Promise<ApiResponse<MissingFieldsResponseBody>> {
    const queryString = options?.planId ? `?planId=${encodeURIComponent(options.planId)}` : '';
    return this.get<MissingFieldsResponseBody>(`/missing-fields/${shortCode}${queryString}`, 'origination');
  }
}

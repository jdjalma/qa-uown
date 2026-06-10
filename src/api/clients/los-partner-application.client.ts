import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import { parseResponse } from '@api/responses/api-response.js';
import type { ConfigEnvironment } from '@config/environment.js';
import type { ApiResponse } from '@api/responses/api-response.js';
import type { LosPartnerApplicationResponse } from '@api/responses/los-partner-application.response.js';

/**
 * Client for the LOS v2 merchant partner application endpoints.
 * Uses bearer token auth (not the default API key).
 * Token is set after construction via setBearerToken().
 */
export class LosPartnerApplicationClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment, bearerToken = '') {
    super(request, env, { injectAuth: false, injectApiKey: false });
    if (bearerToken) {
      this.headers['Authorization'] = `Bearer ${bearerToken}`;
    }
  }

  /** Set the bearer token for subsequent requests. */
  setBearerToken(token: string): this {
    this.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  /** Remove the bearer token (for negative testing). */
  clearBearerToken(): this {
    delete this.headers['Authorization'];
    return this;
  }

  /**
   * POST with per-request header overrides (does not mutate client state).
   * Used to inject X-API-Version or other one-off headers.
   */
  protected async postWithOverride<T>(
    url: string,
    body?: object,
    extraHeaders?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    const resolvedUrl = this.resolveUrl(url);
    const response = await this.request.post(resolvedUrl, {
      headers: { ...this.headers, 'Content-Type': 'application/json', ...extraHeaders },
      data: body ?? {},
      timeout: 300_000,
    });
    return parseResponse<T>(response);
  }

  /**
   * Create a new application via the merchant partner API.
   * POST /uown/los/merchant/applications
   * @param body - Application payload
   * @param apiVersion - X-API-Version header value (default '2'); pass null to omit the header (tests default-version injection)
   */
  async createApplication(
    body?: Record<string, unknown>,
    apiVersion: string | null = '2',
  ): Promise<ApiResponse<LosPartnerApplicationResponse>> {
    const extraHeaders: Record<string, string> = {};
    if (apiVersion !== null) {
      extraHeaders['X-API-Version'] = apiVersion;
    }
    return this.postWithOverride<LosPartnerApplicationResponse>(
      '/uown/los/merchant/applications',
      body ?? {},
      extraHeaders,
    );
  }

  /**
   * Search application status.
   * POST /uown/los/merchant/applications/search
   *
   * Auth: validated inline by `LosRequestMessageConstraintValidator.validateApplicationStatusRequest`
   * via body fields `userName`/`setupPassword`/`merchantNumber` (use `buildApplicationStatusBody`).
   * NO Spring Security / `@PreAuthorize` on `LosExternalMerchantController` — do NOT inject bearer token.
   *
   * @param body - Search criteria (use `buildApplicationStatusBody(merchant, leadUuid)`)
   * @param apiVersion - X-API-Version header value (default `'2'`); pass `null` to omit
   */
  async searchApplicationStatus(
    body?: Record<string, unknown>,
    apiVersion: string | null = '2',
  ): Promise<ApiResponse<LosPartnerApplicationResponse>> {
    const extraHeaders: Record<string, string> = {};
    if (apiVersion !== null) {
      extraHeaders['X-API-Version'] = apiVersion;
    }
    return this.postWithOverride<LosPartnerApplicationResponse>(
      '/uown/los/merchant/applications/search',
      body ?? {},
      extraHeaders,
    );
  }

  /**
   * Create an invoice for an application.
   * POST /uown/los/merchant/applications/{id}/invoices
   */
  async createInvoice(
    id: string,
    body?: Record<string, unknown>,
  ): Promise<ApiResponse<LosPartnerApplicationResponse>> {
    return this.post<LosPartnerApplicationResponse>(
      `/uown/los/merchant/applications/${id}/invoices`,
      body ?? {},
    );
  }

  /**
   * Settle an application.
   * POST /uown/los/merchant/applications/{id}/settlements
   */
  async settleApplication(
    id: string,
    body?: Record<string, unknown>,
  ): Promise<ApiResponse<LosPartnerApplicationResponse>> {
    return this.post<LosPartnerApplicationResponse>(
      `/uown/los/merchant/applications/${id}/settlements`,
      body ?? {},
    );
  }

  /**
   * Add a lease to an application.
   * POST /uown/los/merchant/applications/{id}/leases
   */
  async addLease(
    id: string,
    body?: Record<string, unknown>,
  ): Promise<ApiResponse<LosPartnerApplicationResponse>> {
    return this.post<LosPartnerApplicationResponse>(
      `/uown/los/merchant/applications/${id}/leases`,
      body ?? {},
    );
  }
}

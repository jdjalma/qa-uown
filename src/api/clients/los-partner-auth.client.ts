import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import type { ConfigEnvironment } from '@config/environment.js';
import type { ApiResponse } from '@api/responses/api-response.js';
import type { GetApiKeyResponse, CreateApiUserRequest, CreateApiUserResponse } from '@api/responses/los-partner-auth.response.js';

/**
 * Client for the LOS partner auth endpoint.
 * Does NOT inject default auth or API key — this endpoint issues bearer tokens.
 */
export class LosPartnerAuthClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env, { injectAuth: false, injectApiKey: false });
  }

  /**
   * Authenticate a merchant partner and obtain a bearer token.
   * POST /uown/auth/authorize
   */
  async authorize(username: string, password: string): Promise<ApiResponse<GetApiKeyResponse>> {
    return this.post<GetApiKeyResponse>('/uown/auth/authorize', { username, password });
  }

  /**
   * Create or update an API user in uown_api_user.
   * POST /uown/auth/createOrUpdateApiUser
   * No authentication required (open admin endpoint).
   * pk=0 creates; pk>0 updates (must match existing pk).
   */
  async createApiUser(body: CreateApiUserRequest): Promise<ApiResponse<CreateApiUserResponse>> {
    return this.post<CreateApiUserResponse>('/uown/auth/createOrUpdateApiUser', body);
  }
}

import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import type { ConfigEnvironment } from '@config/environment.js';
import type { ApiResponse } from '@api/responses/api-response.js';
import type { AmsUser, AmsUserPage } from '@api/responses/ams-user.response.js';
import type { MerchantToUserBody } from '@api/bodies/ams-user.body.js';

/**
 * AMS portal API client.
 *
 * AMS uses header-based authentication (HeaderBasedSecurityContextRepository):
 *   - sub-system: "ams-auth"  (SystemName.AMS — ams/src/main/java/.../enumeration/SystemName.java)
 *   - username: <admin_username>
 *
 * No session cookie or bearer token needed — these two headers are sufficient.
 * URLs are resolved against `ConfigEnvironment.amsApiUrl` (backend Java Spring app),
 * NOT `amsUrl` (which is the React frontend).
 */
export class AmsClient extends BaseClient {
  private readonly amsBaseUrl: string;

  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env, { injectAuth: false, injectApiKey: false });
    this.amsBaseUrl = env.amsApiUrl.replace(/\/+$/, '');

    // Inject AMS header-based auth headers on every request
    let adminUsername = '';
    try {
      adminUsername = env.getCredentials('admin').username;
    } catch {
      // No admin credentials configured — requests will fail with 401
    }
    this.withHeader('sub-system', 'ams-auth');
    if (adminUsername) {
      this.withHeader('username', adminUsername);
    }
  }

  protected override resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.amsBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  async getUsers(params?: {
    search?: string;
    roles?: string[];
    locked?: boolean;
    page?: number;
    size?: number;
  }): Promise<ApiResponse<AmsUserPage>> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.roles?.length) {
      for (const role of params.roles) {
        searchParams.append('roles', role);
      }
    }
    if (params?.locked !== undefined) searchParams.set('locked', String(params.locked));
    if (params?.page !== undefined) searchParams.set('page', String(params.page));
    if (params?.size !== undefined) searchParams.set('size', String(params.size));

    const qs = searchParams.toString();
    return this.get<AmsUserPage>(`/user${qs ? `?${qs}` : ''}`);
  }

  async getUser(username: string): Promise<ApiResponse<AmsUser>> {
    return this.get<AmsUser>(`/user/${encodeURIComponent(username)}`);
  }

  async updateUser(username: string, patch: Partial<AmsUser>): Promise<ApiResponse<AmsUser>> {
    return this.put<AmsUser>(`/user/${encodeURIComponent(username)}`, patch);
  }

  async addMerchantsToUsers(body: MerchantToUserBody): Promise<ApiResponse<void>> {
    return this.post<void>('/user/addMerchantsToUsers', body);
  }
}

import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import type { ConfigEnvironment } from '../../config/environment.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { UpdateOptOutAiBody, UpdateDncBody, UpdateDntBody } from '../bodies/svc-phone.body.js';
import type { SvPhoneResponse } from '../responses/svc-phone.response.js';

export class SvcPhoneClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env);
  }

  /** Updates AI opt-out flag for a phone record. POST /uown/svc/updateOptOutAi */
  async updateOptOutAi(body: UpdateOptOutAiBody): Promise<ApiResponse<SvPhoneResponse>> {
    return this.post<SvPhoneResponse>('/uown/svc/updateOptOutAi', body);
  }

  /** Updates Do Not Call flag for a phone record. POST /uown/svc/updateDnc */
  async updateDnc(body: UpdateDncBody): Promise<ApiResponse<SvPhoneResponse>> {
    return this.post<SvPhoneResponse>('/uown/svc/updateDnc', body);
  }

  /** Updates Do Not Text flag for a phone record. POST /uown/svc/updateDnt */
  async updateDnt(body: UpdateDntBody): Promise<ApiResponse<SvPhoneResponse>> {
    return this.post<SvPhoneResponse>('/uown/svc/updateDnt', body);
  }
}

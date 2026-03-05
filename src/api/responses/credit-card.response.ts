import type { BaseResponseBody } from './base.response.js';

export interface AuthorizeCreditCardResponseBody extends BaseResponseBody {
  authorizationCode?: string;
  preAuthStatus?: string;
}

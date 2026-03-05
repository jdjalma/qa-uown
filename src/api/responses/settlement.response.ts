import type { BaseResponseBody } from './base.response.js';

export interface SettleApplicationResponseBody extends BaseResponseBody {
  accountNumber?: string;
  settlementDate?: string;
}

import type { BaseResponseBody } from './base.response.js';

export interface CancelAccountResponseBody extends BaseResponseBody {
  accountPk?: number;
  cancelledDateTime?: string;
  refundedAmount?: number;
}

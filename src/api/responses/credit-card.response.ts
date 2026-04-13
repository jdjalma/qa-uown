import type { BaseResponseBody } from './base.response.js';

export interface AuthorizeCreditCardResponseBody extends BaseResponseBody {
  authorizationCode?: string;
  preAuthStatus?: string;
  creditCardTransactionPk?: number;
}

export interface CcTransaction {
  pk: number;
  accountPk: number;
  amount: number;
  postingDate: string;
  status: string;
  comment: string;
  rowCreatedTimestamp: string;
  creditCardTransactionInfo?: {
    pk: number;
  };
}

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

/**
 * svc `POST /uown/svc/createOrUpdateCreditCard` returns `SvCreditCard` with
 * the embedded `creditCardInfo` carrying the persisted `creditCardPk` and
 * `ccToken` (populated by the authorize+tokenize step). Needed to avoid the
 * `fk_uown_cc_transaction_arrangement` FK violation when creating payment
 * arrangements — see application-lifecycle-protocol.md § Pitfall #11.
 */
export interface SvCreditCardResponse {
  pk?: number;
  creditCardInfo?: {
    creditCardPk?: number;
    ccToken?: string;
    ccNumber?: string;
    ccExp?: string;
    ccType?: string;
    ccVendor?: string;
    accountPk?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Response types for Payment Arrangement API endpoints.
 *
 * Maps to Java POJOs: TmsPaymentArrangement, PaymentArrangementDto
 * Response structure validated against real Servicing Portal response (2026-03-04).
 */
import type { BaseResponseBody } from './base.response.js';
import type { ArrangementType } from '../bodies/payment-arrangement.body.js';

export interface CcTransactionCcInfoResult {
  leadPk?: number;
  accountPk?: number;
  creditCardPk?: number;
  ccFirstName?: string;
  ccLastName?: string;
  ccNumber?: string;
  ccExp?: string;
  ccType?: string;
  cvc?: string;
  ccToken?: string;
  autoPay?: boolean;
  isDeleted?: boolean;
  ccVendor?: string;
  preAuthStatus?: string;
  ccHash?: number;
  isValidCard?: boolean;
  invalidCardReason?: string;
  ccAddress?: Record<string, string>;
  expired?: boolean;
}

export interface CcTransactionResult {
  accountPk?: number;
  leadPk?: number;
  creditCardTransactionPk?: number;
  paymentPk?: number;
  originalCCPk?: number;
  postingDate?: string;
  numberOfTries?: number;
  rerunStatus?: string;
  rerunNsfStatus?: string;
  amount?: number;
  originalAmount?: number;
  remainingRefundableAmount?: number;
  chargedFeeAmount?: number;
  authCode?: string;
  vendor?: string;
  ccAction?: string;
  ccTransactionType?: string;
  gatewayTransactionId?: string;
  completedTime?: string;
  errorCode?: string;
  error?: string;
  useCardOnFile?: boolean;
  status?: string;
  isNsf?: boolean;
  ccInfo?: CcTransactionCcInfoResult;
  allocationStrategy?: string;
  isCustomRefund?: boolean;
  agentUsername?: string;
  idempotencyKey?: string;
  chargeFee?: boolean;
  sameDayTransaction?: boolean;
  isSettlementPayment?: boolean;
  paymentArrangementPk?: number;
}

export interface AchPaymentResult {
  pk?: number;
  accountPk?: number;
  amount?: string;
  status?: string;
  achPaymentDate?: string;
  paymentArrangementPk?: number;
}

export interface PaymentArrangementCcResponseBody extends BaseResponseBody {
  accountPk?: number;
  paymentArrangement?: boolean;
  arrangementType?: ArrangementType;
  creditCardTransactions?: CcTransactionResult[];
  achPayments?: AchPaymentResult[];
}

export interface PaymentArrangementAchResponseBody extends BaseResponseBody {
  accountPk?: number;
  paymentArrangement?: boolean;
  arrangementType?: ArrangementType;
  achPayments?: AchPaymentResult[];
}

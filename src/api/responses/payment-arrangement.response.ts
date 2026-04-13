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

// ── GET /uown/svc/accounts/{accountPk}/payment-arrangements ──────────

/** Single arrangement item returned in the paginated list. Maps to SvPaymentArrangement entity. */
export interface PaymentArrangementListItem {
  pk: number;
  accountPk: number;
  startDate: string;
  endDate: string;
  amount: number;
  arrangementType: string;
  paymentType: string;
  username: string;
  previousRating: string | null;
  currentRating: string;
  status: string;
  notes: string | null;
  active: boolean;
  rowCreatedTimestamp: string;
  rowUpdatedTimestamp: string | null;
}

/** Spring Data Page wrapper for arrangement list. */
export interface PaymentArrangementListResponse {
  content: PaymentArrangementListItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ── GET /uown/svc/payment-arrangements/{pk}/payments ─────────────────

/** ACH payment projection for display. */
export interface PaymentArrangementAchDisplay {
  paymentPk: number;
  postingDate: string;
  amount: number;
  status: string;
  type: string;
  errorMessage: string | null;
  accountNumber: string; // masked ****XXXX
}

/** CC payment projection for display. */
export interface PaymentArrangementCcDisplay {
  paymentPk: number;
  postingDate: string;
  amount: number;
  fee: number;
  status: string;
  vendor: string;
  card: string; // masked ****XXXX
}

/** Response wrapper for arrangement payments. */
export interface PaymentArrangementPaymentsResponse {
  ach: PaymentArrangementAchDisplay[];
  cc: PaymentArrangementCcDisplay[];
}

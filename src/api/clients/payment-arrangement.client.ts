/**
 * Payment Arrangement API Client
 *
 * Handles CC and ACH payment arrangements via:
 *   - POST /uown/svc/makeCreditCardPayments  (CC arrangement)
 *   - POST /uown/svc/createOrUpdateACHPayments (ACH arrangement)
 *   - GET  /uown/svc/accounts/{accountPk}/payment-arrangements (list — Task #500)
 *   - GET  /uown/svc/payment-arrangements/{pk}/payments (payments — Task #500)
 *
 * Both POST endpoints accept PaymentArrangementDto with paymentArrangement=true.
 */
import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  PaymentArrangementCcResponseBody,
  PaymentArrangementAchResponseBody,
  PaymentArrangementListResponse,
  PaymentArrangementPaymentsResponse,
} from '../responses/payment-arrangement.response.js';
import type {
  PaymentArrangementCcBody,
  PaymentArrangementAchBody,
  UpdateCcTransactionBody,
} from '../bodies/payment-arrangement.body.js';
import type { CcTransactionResult } from '../responses/payment-arrangement.response.js';

export class PaymentArrangementClient extends BaseClient {

  /**
   * Create a CC payment arrangement.
   * Sends multiple CC transactions linked to a single PaymentArrangement entity.
   * The first transaction tokenizes the card; subsequent reuse the token.
   *
   * IMPORTANT: chargeFee=true is REQUIRED on each CC transaction (Ticket363).
   */
  async makeCreditCardPayments(
    body: PaymentArrangementCcBody,
  ): Promise<ApiResponse<PaymentArrangementCcResponseBody>> {
    return this.post<PaymentArrangementCcResponseBody>(
      '/uown/svc/makeCreditCardPayments',
      body,
    );
  }

  /**
   * Create an ACH payment arrangement.
   * Sends multiple ACH payments linked to a single PaymentArrangement entity.
   */
  async createOrUpdateAchPayments(
    body: PaymentArrangementAchBody,
  ): Promise<ApiResponse<PaymentArrangementAchResponseBody>> {
    return this.post<PaymentArrangementAchResponseBody>(
      '/uown/svc/createOrUpdateACHPayments',
      body,
    );
  }

  /**
   * List payment arrangements for an account (paginated).
   * GET /uown/svc/accounts/{accountPk}/payment-arrangements?page={page}&size={size}
   * Returns Page<SvPaymentArrangement> sorted by pk DESC.
   */
  async getPaymentArrangements(
    accountPk: number | string,
    page = 0,
    size = 10,
  ): Promise<ApiResponse<PaymentArrangementListResponse>> {
    return this.get<PaymentArrangementListResponse>(
      `/uown/svc/accounts/${accountPk}/payment-arrangements?page=${page}&size=${size}`,
    );
  }

  /**
   * Update a CC transaction (edit amount/date/comment or cancel).
   * PUT /uown/svc/payments/credit-cards/{ccTransactionPk}
   * Response is void (200 OK with no body) on success.
   */
  async updateCcTransaction(
    ccTransactionPk: number | string,
    body: UpdateCcTransactionBody,
  ): Promise<ApiResponse<void>> {
    return this.put<void>(
      `/uown/svc/payments/credit-cards/${ccTransactionPk}`,
      body,
    );
  }

  /**
   * Get all CC transactions for an account.
   * GET /uown/svc/getCCTransactions/{accountPk}
   */
  async getCcTransactions(
    accountPk: number | string,
  ): Promise<ApiResponse<CcTransactionResult[]>> {
    return this.get<CcTransactionResult[]>(
      `/uown/svc/getCCTransactions/${accountPk}`,
    );
  }

  /**
   * Get only PENDING CC transactions for an account.
   * GET /uown/svc/getPendingCCTransactions/{accountPk}
   */
  async getPendingCcTransactions(
    accountPk: number | string,
  ): Promise<ApiResponse<CcTransactionResult[]>> {
    return this.get<CcTransactionResult[]>(
      `/uown/svc/getPendingCCTransactions/${accountPk}`,
    );
  }

  /**
   * Get payments (CC and/or ACH) for a specific payment arrangement.
   * GET /uown/svc/payment-arrangements/{paymentArrangementPk}/payments
   * Returns PaymentArrangementPaymentsDto with separate ach[] and cc[] arrays.
   */
  async getPaymentArrangementPayments(
    paymentArrangementPk: number | string,
  ): Promise<ApiResponse<PaymentArrangementPaymentsResponse>> {
    return this.get<PaymentArrangementPaymentsResponse>(
      `/uown/svc/payment-arrangements/${paymentArrangementPk}/payments`,
    );
  }
}

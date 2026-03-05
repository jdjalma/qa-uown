/**
 * Payment Arrangement API Client
 *
 * Handles CC and ACH payment arrangements via:
 *   - POST /uown/svc/makeCreditCardPayments  (CC arrangement)
 *   - POST /uown/svc/createOrUpdateACHPayments (ACH arrangement)
 *
 * Both endpoints accept PaymentArrangementDto with paymentArrangement=true.
 */
import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  PaymentArrangementCcResponseBody,
  PaymentArrangementAchResponseBody,
} from '../responses/payment-arrangement.response.js';
import type {
  PaymentArrangementCcBody,
  PaymentArrangementAchBody,
} from '../bodies/payment-arrangement.body.js';

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
}

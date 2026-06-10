/**
 * Response shapes for refactored TMS payment endpoints (svc#509).
 *
 * The refactor did NOT touch the response side; these interfaces reflect the
 * controller method signatures (`CCTransactionResult`, `AchPaymentResponse`,
 * `PaymentArrangementResponse`) at branch `R1.52.0_Refactor_RequestObjects-TMS`.
 *
 * Fields are typed loosely because (a) only a handful are asserted in CTs and
 * (b) downstream vendor integrations populate a long tail of optional fields
 * we do not validate at the wire layer (vendor-specific). A catch-all
 * `[key: string]: unknown` keeps callers flexible without forcing
 * `as unknown` casts at the test site.
 */

/** `POST /payments/credit-card` happy-path response (HTTP 200). */
export interface TmsCreditCardPaymentResponseBody {
  /** `uown_sv_credit_card_transaction.pk` — primary handle for DB assertions. */
  creditCardTransactionPk?: number;
  /** Persisted amount echoed back (may be returned as string by vendor). */
  amount?: number | string;
  status?: string;
  postingDate?: string;
  accountPk?: number;
  creditCardPk?: number;
  paymentPK?: number;
  [key: string]: unknown;
}

/** `POST /payments/ach` happy-path response (HTTP 200). */
export interface TmsAchPaymentResponseBody {
  /** `uown_sv_achpayment.pk` — primary handle for DB assertions. */
  achPaymentPk?: number;
  amount?: number | string;
  status?: string;
  postingDate?: string;
  accountPk?: number;
  bankAccountPk?: number;
  paymentPK?: number;
  [key: string]: unknown;
}

/** `POST /paymentArrangements` (legacy shape) happy-path response. */
export interface TmsPaymentArrangementResponseBody {
  paymentArrangementPk?: number;
  creditCardTransactions?: Array<Record<string, unknown>>;
  achPayments?: Array<Record<string, unknown>>;
  status?: string;
  arrangementType?: string;
  [key: string]: unknown;
}

/** Generic Spring 400 / bean-validation error envelope (best-effort shape). */
export interface TmsValidationErrorBody {
  status?: number;
  error?: string;
  message?: string;
  errors?: Array<{ field?: string; defaultMessage?: string; [k: string]: unknown }>;
  timestamp?: string;
  path?: string;
  [key: string]: unknown;
}

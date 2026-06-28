/**
 * TMS audit response shapes.
 *
 * Used by `TmsAuditClient` (v1 + legacy account-summary endpoints).
 * Field set is intentionally minimal — only the keys exercised by current
 * task tests are typed. The index signature keeps backwards compatibility
 * with call sites that read other fields untyped.
 *
 * `lastScheduleMovedDate` (with the extra "d") is the canonical Java field
 * spelling — do not "fix" to the issue-title spelling. Confirmed by dev
 * Marcos on 2026-05-22 (svc#536, MR !1444).
 *
 * `lastScheduleMovedDate` serializes as Java `LocalDateTime` without offset
 * (e.g. `"2026-05-22T12:05:20.756016"`). Server TZ is +3h relative to UTC
 * in qa1 — the DB stores the same moment as `timestamptz` in UTC. Use
 * `expectWithinTzWindow` for cross-source comparison.
 */
export interface TmsAccountSummaryResponse {
  /** Account primary key (numeric, but pg may return as string — typed permissive). */
  accountPk?: number | string;
  refAccountId?: number;
  customerFullName?: string;
  customerDob?: string;
  customerAddressLine1?: string;
  customerAddressLine2?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  accountStatus?: string;
  nextPaymentDueAmount?: number;
  nextDueDate?: string;
  contractBalance?: number;
  pastDueAmount?: number;
  daysPastDue?: number;
  numberOfPaymentsMade?: number;
  epoBalance?: number;
  customerPaymentFrequency?: string;
  eligibleForPromotionalPayOff?: boolean;
  /** Count of due-date moves; sourced from `uown_sv_sched_summary.due_date_moves`. */
  numberOfDueDateMoves?: number | null;
  /**
   * `row_created_timestamp` of the most-recent row in `uown_due_date_moves`.
   * `null` when the account has no moves yet (early-return path).
   * Serializes as Java `LocalDateTime` (no TZ offset).
   */
  lastScheduleMovedDate?: string | null;
  [key: string]: unknown;
}

/** Item shape returned by GET /payment-methods/credit-cards and /credit-cards/autopay. */
export interface TmsCreditCardOnFileItem {
  /** `uown_sv_credit_card.pk`. */
  id?: number;
  maskedCardNumber?: string;
  cardType?: string;
  expirationDate?: string;
  isAutoPay?: boolean;
  isValidCard?: boolean;
  lastUsedDate?: string;
  [key: string]: unknown;
}

/** Item shape returned by GET /payment-methods/bank-accounts. */
export interface TmsBankAccountOnFileItem {
  /** `uown_sv_bank_account.pk`. */
  id?: number;
  maskedAccountNumber?: string;
  maskedRoutingNumber?: string;
  bankName?: string;
  /** CHECKING | SAVINGS */
  bankAccountType?: string;
  isActive?: boolean;
  lastUsedDate?: string;
  [key: string]: unknown;
}

/** Response from GET /uown/tms/v1/accounts/{accountId}/payoff. */
export interface TmsPayoffResponse {
  accountPk?: number;
  amount?: number;
  [key: string]: unknown;
}

/** Response from POST /uown/tms/v1/accounts/{accountId}/due-dates/move. */
export interface TmsMoveDueDatesResponse {
  accountPk?: number;
  adjustedFromDate?: string;
  offset?: number;
  adjustedToDate?: string;
  adjustedDues?: number;
  [key: string]: unknown;
}

/** Single delivery result from POST /uown/tms/v1/accounts/{accountId}/paynearme/send. */
export interface TmsPayNearMeDeliveryResult {
  smartLink?: string;
  deliveryChannel?: string;
  recipientAddress?: string;
  deliveryReferenceId?: string;
  amountDue?: number;
  [key: string]: unknown;
}

/** Response from POST /uown/tms/v1/accounts/{accountId}/contactPreferences. */
export interface TmsContactPreferencesResponse {
  accountPk?: number;
  phoneNumber?: number;
  doNotCall?: boolean;
  doNotText?: boolean;
  optOutAi?: boolean;
  optOutAiReason?: string;
  [key: string]: unknown;
}

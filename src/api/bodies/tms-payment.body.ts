/**
 * Request bodies for the refactored TMS payment endpoints (svc#509).
 *
 * Covers the 3 endpoints on `com.uownleasing.svc.rest.tms.TmsPaymentController`:
 *
 *   - POST /uown/tms/v1/accounts/{accountId}/payments/credit-card   (CreditCardPaymentRequest)
 *   - POST /uown/tms/v1/accounts/{accountId}/payments/ach           (AchPaymentRequest)
 *   - POST /uown/tms/v1/accounts/{accountId}/paymentArrangements    (legacy PaymentArrangementDto — post-revert via 56b878299)
 *
 * Source mapping (svc branch R1.52.0_Refactor_RequestObjects-TMS, tip 58e480e72):
 *   - `CreditCardPaymentRequest.java`      → new request DTO
 *   - `AchPaymentRequest.java`             → new request DTO
 *   - `PaymentArrangementRequest.java`     → defined but NOT wired post-revert
 *   - `CardDetails.java`                   → nested in CreditCardPaymentRequest.card
 *   - `BankAccountDetails.java`            → nested in AchPaymentRequest.bankAccount
 *   - `BillingAddress.java`                → nested in CardDetails.billingAddress
 *
 * IMPORTANT — wire-contract details (SPEC svc-509 OBSERVATION-1 + OBSERVATION-2):
 *   - The top-level `card` field on the CC request carries `@JsonAlias("card")`
 *     AND `@JsonProperty("ccInfo")` (commit 58e480e72). Both keys deserialize.
 *   - Internal fields of CardDetails / BankAccountDetails have NO `@JsonAlias`.
 *     Clients sending legacy names (`creditCardPk`, `bankData.*`, `isAutoPay`)
 *     hit silent ignore + bean-validation 400 (covered by CT-08a/b + CT-09).
 *   - `/paymentArrangements` was REVERTED to legacy `PaymentArrangementDto`
 *     by commit 56b878299. Posting the "new" shape (`creditLines[]` /
 *     `achLines[]`) results in HTTP 200 + 0 transactions (silent no-op).
 *     CT-10 documents this behaviour.
 *
 * These types intentionally use partial / open shapes (`[key: string]: unknown`)
 * so the CTs can craft both the "happy" new payload and the OBSERVATION-style
 * legacy / malformed variants without TypeScript fighting us.
 */

// ── Cross-cutting enums ─────────────────────────────────────────────

/**
 * `AllocationStrategy` enum (svc-common). The wire values are the
 * human-readable display strings the Java `@JsonValue` / `@JsonCreator`
 * pair serializes.
 */
export type TmsAllocationStrategy = 'DEFAULT' | 'REGULAR_RECEIVABLES' | 'EPO_ONLY';

/** `ArrangementType` enum (svc-common) — used in legacy PA shape post-revert. */
export type TmsArrangementType = 'NORMAL' | 'SETTLEMENT';

// ── New: BillingAddress (nested in CardDetails) ─────────────────────

export interface TmsBillingAddress {
  streetAddress1?: string;
  streetAddress2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

// ── New: CardDetails (nested in CreditCardPaymentRequest.card) ──────

/**
 * Either `creditCardId` (on-file branch) OR keyed-card fields
 * (`ccNumber` + `ccExp` + `cvc` + names + `billingAddress`).
 *
 * `@AssertTrue isExclusiveCardMode` enforces exactly one branch.
 */
export interface TmsCardDetails {
  /** Card-on-file PK from `uown_sv_credit_card.pk`. Mutually exclusive with `ccNumber`. */
  creditCardId?: number;
  /** Keyed card number (PAN). Mutually exclusive with `creditCardId`. */
  ccNumber?: string;
  /** Cardholder first name (keyed branch only). */
  ccFirstName?: string;
  /** Cardholder last name (keyed branch only). */
  ccLastName?: string;
  /** Expiration in `MM/YY` (≤5 chars per Bean Validation). */
  ccExp?: string;
  /** Card verification value (keyed branch). */
  cvc?: string;
  /** Designate this card as auto-pay (renamed from legacy `isAutoPay` — NO alias). */
  autoPay?: boolean;
  /** Nested billing address (keyed branch). */
  billingAddress?: TmsBillingAddress;
  /** Escape hatch for CT-08b: legacy fields with NO alias (e.g. `creditCardPk`). */
  [key: string]: unknown;
}

// ── New: BankAccountDetails (nested in AchPaymentRequest.bankAccount) ─

/**
 * Either `bankAccountId` (on-file branch) OR keyed-bank fields
 * (`routingNumber` + `accountNumber` + holder names + bank name).
 *
 * `@AssertTrue isExclusiveBankInstrument` enforces exactly one branch.
 */
export interface TmsBankAccountDetails {
  /** Bank-account-on-file PK from `uown_sv_bank_account.pk`. Mutually exclusive with keyed fields. */
  bankAccountId?: number;
  /** ABA routing number (keyed branch). */
  routingNumber?: string;
  /** Account number (keyed branch). */
  accountNumber?: string;
  /** Bank name (keyed branch). */
  bankName?: string;
  /** Holder first name (renamed from legacy `customerFirstName` — NO alias). */
  accountHolderFirstName?: string;
  /** Holder last name (renamed from legacy `customerLastName` — NO alias). */
  accountHolderLastName?: string;
  /** Designate as auto-pay (renamed from legacy `isAutoPay` — NO alias). Default `false`. */
  designateAutoPay?: boolean;
  /** Escape hatch for CT-09 (legacy `bankData.*` fields). */
  [key: string]: unknown;
}

// ── New: CreditCardPaymentRequest (POST /payments/credit-card) ─────

export interface TmsCreditCardPaymentRequest {
  /** Monetary amount (BigDecimal on wire — use plain number for JSON). REQUIRED. */
  amount: number;
  /** ISO `YYYY-MM-DD`. REQUIRED. */
  postingDate: string;
  /** Allocation strategy enum (defaults to `Payment/EPO` when omitted). */
  allocationStrategy?: TmsAllocationStrategy;
  /** Charge processing fee. Java field initializer + `@Builder.Default` = `true`. */
  chargeFee?: boolean;
  /** Free-text comment (single — note ACH uses `comments` plural — OBSERVATION-3). */
  comment?: string;
  /**
   * Card details. Top-level field carries `@JsonAlias("card")` + `@JsonProperty("ccInfo")`
   * — both keys deserialize. Required on standalone endpoint (`@NotNull` enforced
   * by controller throwing 400 when null).
   */
  card?: TmsCardDetails;
  /** Escape hatch: lets CTs send extra/legacy keys (e.g. `ccInfo`). */
  [key: string]: unknown;
}

// ── New: AchPaymentRequest (POST /payments/ach) ────────────────────

export interface TmsAchPaymentRequest {
  amount: number;
  postingDate: string;
  allocationStrategy?: TmsAllocationStrategy;
  /** Free-text comments (plural — OBSERVATION-3). */
  comments?: string;
  /** `@Valid @NotNull` — required, no aliases at any level. */
  bankAccount?: TmsBankAccountDetails;
  /** Escape hatch for CT-09 legacy `bankData` envelope. */
  [key: string]: unknown;
}

// ── Legacy: PaymentArrangementDto (post-revert /paymentArrangements) ─
//
// CC line shape mirrors `com.uownleasing.svc.dto.PaymentArrangementDto.CreditCardTransactions`
// (legacy). Only the fields used by the post-revert mapper are required;
// every other field is optional and tolerated by Jackson.

export interface TmsLegacyCcLine {
  amount: number;
  postingDate: string;
  /** Legacy snake_case-ish field — PK of card on file. */
  creditCardPk?: number;
  chargeFee?: boolean;
  allocationStrategy?: string;
  ccAction?: string;
  ccTransactionType?: string;
  /** Free-form ccInfo nested for keyed mode. */
  ccInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface TmsLegacyAchLine {
  amount: number;
  postingDate: string;
  bankAccountPk?: number;
  bankData?: {
    routingNumber?: string;
    accountNumber?: string;
    bankAccountType?: string;
    [key: string]: unknown;
  };
  paymentArrangement?: boolean;
  achProcessType?: string;
  [key: string]: unknown;
}

export interface TmsLegacyPaymentArrangementRequest {
  creditCardTransactions?: TmsLegacyCcLine[];
  achPayments?: TmsLegacyAchLine[];
  arrangementType?: TmsArrangementType;
  paymentArrangement?: boolean;
  /** Escape hatch for CT-10 (sending "new" shape `creditLines[]` / `achLines[]`). */
  [key: string]: unknown;
}

// ── Builders (small, additive — most CTs hand-craft payloads) ──────

/**
 * Builds a minimal NEW-shape CreditCardPaymentRequest for the on-file branch.
 * `chargeFee` is intentionally LEFT OUT when undefined so CT-12 can observe
 * the Java field-initializer default (`true`).
 */
export function buildTmsCcOnFileBody(opts: {
  amount: number;
  postingDate: string;
  creditCardId: number;
  allocationStrategy?: TmsAllocationStrategy;
  chargeFee?: boolean;
  comment?: string;
}): TmsCreditCardPaymentRequest {
  const body: TmsCreditCardPaymentRequest = {
    amount: opts.amount,
    postingDate: opts.postingDate,
    card: { creditCardId: opts.creditCardId },
  };
  if (opts.allocationStrategy) body.allocationStrategy = opts.allocationStrategy;
  if (opts.chargeFee !== undefined) body.chargeFee = opts.chargeFee;
  if (opts.comment !== undefined) body.comment = opts.comment;
  return body;
}

/**
 * Builds a minimal NEW-shape CreditCardPaymentRequest for the keyed branch
 * (BillingAddress nested). Pitfall: `ccExp` must be ≤5 chars (`MM/YY`).
 */
export function buildTmsCcKeyedBody(opts: {
  amount: number;
  postingDate: string;
  ccNumber: string;
  ccExp: string;
  cvc: string;
  ccFirstName?: string;
  ccLastName?: string;
  billingAddress?: TmsBillingAddress;
  allocationStrategy?: TmsAllocationStrategy;
  chargeFee?: boolean;
}): TmsCreditCardPaymentRequest {
  const card: TmsCardDetails = {
    ccNumber: opts.ccNumber,
    ccExp: opts.ccExp,
    cvc: opts.cvc,
  };
  if (opts.ccFirstName !== undefined) card.ccFirstName = opts.ccFirstName;
  if (opts.ccLastName !== undefined) card.ccLastName = opts.ccLastName;
  if (opts.billingAddress) card.billingAddress = opts.billingAddress;

  const body: TmsCreditCardPaymentRequest = {
    amount: opts.amount,
    postingDate: opts.postingDate,
    card,
  };
  if (opts.allocationStrategy) body.allocationStrategy = opts.allocationStrategy;
  if (opts.chargeFee !== undefined) body.chargeFee = opts.chargeFee;
  return body;
}

/** Builds a NEW-shape AchPaymentRequest for the keyed bank branch. */
export function buildTmsAchKeyedBody(opts: {
  amount: number;
  postingDate: string;
  routingNumber: string;
  accountNumber: string;
  bankName?: string;
  accountHolderFirstName?: string;
  accountHolderLastName?: string;
  allocationStrategy?: TmsAllocationStrategy;
  comments?: string;
}): TmsAchPaymentRequest {
  const bankAccount: TmsBankAccountDetails = {
    routingNumber: opts.routingNumber,
    accountNumber: opts.accountNumber,
  };
  if (opts.bankName !== undefined) bankAccount.bankName = opts.bankName;
  if (opts.accountHolderFirstName !== undefined) {
    bankAccount.accountHolderFirstName = opts.accountHolderFirstName;
  }
  if (opts.accountHolderLastName !== undefined) {
    bankAccount.accountHolderLastName = opts.accountHolderLastName;
  }

  const body: TmsAchPaymentRequest = {
    amount: opts.amount,
    postingDate: opts.postingDate,
    bankAccount,
  };
  if (opts.allocationStrategy) body.allocationStrategy = opts.allocationStrategy;
  if (opts.comments !== undefined) body.comments = opts.comments;
  return body;
}

/** Builds a NEW-shape AchPaymentRequest for the bank-on-file branch. */
export function buildTmsAchOnFileBody(opts: {
  amount: number;
  postingDate: string;
  bankAccountId: number;
  allocationStrategy?: TmsAllocationStrategy;
}): TmsAchPaymentRequest {
  const body: TmsAchPaymentRequest = {
    amount: opts.amount,
    postingDate: opts.postingDate,
    bankAccount: { bankAccountId: opts.bankAccountId },
  };
  if (opts.allocationStrategy) body.allocationStrategy = opts.allocationStrategy;
  return body;
}

/**
 * Request body types for Bank Account API endpoints.
 *
 * Maps to the Java embeddable DTO: BankAccountInfo
 * Endpoints:
 *   - POST /uown/svc/createOrUpdateBankAccount (body: BankAccountInfo)
 *   - POST /uown/svc/removeBankAccount        (body: BankAccountInfoRequest)
 *   - GET  /uown/svc/getBankAccounts/{accountPk}
 *
 * Contracts verified against `../svc/` and `../common/` sources.
 */

// ── Enums ──────────────────────────────────────────────────────────

/** Matches Java enum BankAccountType. */
export type BankAccountType = 'CHECKING' | 'SAVINGS';

// ── BankAccountInfo (embeddable DTO) ───────────────────────────────

/**
 * Embeddable DTO representing a bank account record.
 * Mirrors the Java `BankAccountInfo` class used as the request body for
 * `createOrUpdateBankAccount` and nested inside `BankAccountInfoRequest`.
 */
export interface BankAccountInfo {
  /** Optional — PK of the bank account record (present on updates). */
  bankAccountPk?: number;
  /** Customer PK owning this bank account. Required. @Min(1) on backend. */
  customerPk: number;
  /** Account PK the bank account is linked to. Required. */
  accountPk: number;
  /** Optional — lead PK, if the bank account is also tied to a lead. */
  leadPk?: number;
  /** Account-holder name. Required. @NotBlank, max length 500. */
  name: string;
  /** Bank routing number (ABA). Required. */
  routingNumber: string;
  /** Bank account number. Required. */
  accountNumber: string;
  /** Bank name (free-form). Required. Max length 500. */
  bankName: string;
  /** Checking or savings. Defaults to CHECKING on the backend if omitted. */
  bankAccountType?: BankAccountType;
  /** Whether the account is enrolled in autopay. Defaults to true on the backend. */
  autoPay?: boolean;
  /** Soft-delete flag. Defaults to false on the backend. */
  isDeleted?: boolean;
  /** Optional — date the bank account was opened (ISO YYYY-MM-DD). */
  accountOpenedDate?: string;
  /** Optional — how long the customer has held the account (free-form, e.g. "2 years"). */
  bankAccountDuration?: string;
  /** Optional — source/origin of the bank account record (free-form). */
  bankAccountSource?: string;
  /** Optional — free-form comment. */
  comment?: string;
}

// ── BankAccountInfoRequest (removeBankAccount wrapper) ─────────────

/**
 * Request envelope for `removeBankAccount`.
 * The Java DTO `BankAccountInfoRequest` wraps the embedded `BankAccountInfo`
 * with the target `accountPk` at the top level.
 */
export interface BankAccountInfoRequest {
  /** Account PK the bank account belongs to. */
  accountPk: number;
  /** Embedded bank account info identifying which record to remove. */
  bankAccountInfo: BankAccountInfo;
}

// ── Builder Options ────────────────────────────────────────────────

/**
 * Options consumed by `BankAccountClient.createBankAccount` helper.
 * Anything omitted falls back to sensible test defaults.
 */
export interface CreateBankAccountOptions {
  /** Account-holder name. Defaults to "TEST ACCOUNT HOLDER". */
  name?: string;
  /** Bank routing number. Defaults to "021000021". */
  routingNumber?: string;
  /** Bank account number. Defaults to "123456789". */
  accountNumber?: string;
  /** Bank name. Defaults to "TEST BANK". */
  bankName?: string;
  /** Checking or savings. Defaults to CHECKING. */
  bankAccountType?: BankAccountType;
  /** Autopay enrollment. Defaults to true. */
  autoPay?: boolean;
  /** Optional — lead PK. */
  leadPk?: number;
  /** Optional — free-form comment. */
  comment?: string;
}

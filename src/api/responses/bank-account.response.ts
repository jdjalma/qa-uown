/**
 * Response types for Bank Account API endpoints.
 *
 * Maps to Java entities:
 *   - SvBankAccount (entity wrapper)
 *   - BankAccountInfo (embeddable — reused from bodies)
 *
 * Endpoints:
 *   - POST /uown/svc/createOrUpdateBankAccount → SvBankAccount
 *   - POST /uown/svc/removeBankAccount        → SvBankAccount | boolean | void
 *   - GET  /uown/svc/getBankAccounts/{accountPk} → SvBankAccount[]
 */
import type { BankAccountType } from '../bodies/bank-account.body.js';

// ── BankAccountPk (embedded bankAccountInfo on response) ───────────

/**
 * Represents the embedded `bankAccountInfo` section of `SvBankAccount`.
 * Named `BankAccountPk` per request to mirror the Java naming convention
 * where the embeddable carries the identifying PK(s) alongside the data.
 *
 * All fields are optional since the backend may omit defaults or masked
 * values depending on the endpoint.
 */
export interface BankAccountPk {
  bankAccountPk?: number;
  customerPk?: number;
  accountPk?: number;
  leadPk?: number;
  name?: string;
  routingNumber?: string;
  accountNumber?: string;
  bankName?: string;
  bankAccountType?: BankAccountType;
  autoPay?: boolean;
  isDeleted?: boolean;
  accountOpenedDate?: string;
  bankAccountDuration?: string;
  bankAccountSource?: string;
  comment?: string;
}

// ── Customer / Account references ──────────────────────────────────

/** Minimal customer reference embedded on SvBankAccount responses. */
export interface BankAccountCustomerRef {
  pk?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** Minimal account reference embedded on SvBankAccount responses. */
export interface BankAccountAccountRef {
  pk?: number;
  accountNumber?: string;
  status?: string;
}

// ── SvBankAccount (entity wrapper) ─────────────────────────────────

/**
 * Response wrapper matching the Java `SvBankAccount` entity.
 * Contains the row `pk`, the embedded `bankAccountInfo`, and optional
 * relationship references to the owning customer and account.
 */
export interface SvBankAccountResponse {
  /** Primary key of the SvBankAccount row. */
  pk?: number;
  /** Embedded bank account info (routing, account number, name, etc.). */
  bankAccountInfo?: BankAccountPk;
  /** Optional — owning customer reference. */
  customer?: BankAccountCustomerRef;
  /** Optional — owning account reference. */
  account?: BankAccountAccountRef;
  /** Optional — audit timestamps. */
  rowCreatedTimestamp?: string;
  rowUpdatedTimestamp?: string | null;
  /** Optional — whether the row is active (mirrors !isDeleted). */
  active?: boolean;
}

/** Convenience alias for the list endpoint. */
export type SvBankAccountListResponse = SvBankAccountResponse[];

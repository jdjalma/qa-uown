/**
 * Bank Account API Client
 *
 * Handles CRUD operations for customer bank accounts on the UOWN Servicing backend:
 *   - POST /uown/svc/createOrUpdateBankAccount  (create or update a bank account)
 *   - POST /uown/svc/removeBankAccount          (soft-delete a bank account)
 *   - GET  /uown/svc/getBankAccounts/{accountPk} (list active bank accounts)
 *
 * Backend contracts verified against `../svc/` and `../common/` sources.
 */
import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  BankAccountInfo,
  BankAccountInfoRequest,
  CreateBankAccountOptions,
} from '../bodies/bank-account.body.js';
import type {
  SvBankAccountResponse,
  SvBankAccountListResponse,
} from '../responses/bank-account.response.js';

export class BankAccountClient extends BaseClient {

  /**
   * Create or update a customer bank account.
   * POST /uown/svc/createOrUpdateBankAccount
   *
   * Body: `BankAccountInfo` embeddable DTO. When `bankAccountPk` is absent
   * the backend creates a new row; when present it updates the matching record.
   * Returns the persisted `SvBankAccount` entity.
   */
  async createOrUpdateBankAccount(
    body: BankAccountInfo,
  ): Promise<ApiResponse<SvBankAccountResponse>> {
    return this.post<SvBankAccountResponse>(
      '/uown/svc/createOrUpdateBankAccount',
      body,
    );
  }

  /**
   * Soft-delete a bank account.
   * POST /uown/svc/removeBankAccount
   *
   * Body: `BankAccountInfoRequest` — envelope containing `accountPk` and the
   * embedded `bankAccountInfo` identifying the record to remove.
   * Response may be void, a boolean confirmation, or the updated `SvBankAccount`;
   * callers should inspect `response.status` (2xx) before reading `body`.
   */
  async removeBankAccount(
    body: BankAccountInfoRequest,
  ): Promise<ApiResponse<SvBankAccountResponse | boolean | void>> {
    return this.post<SvBankAccountResponse | boolean | void>(
      '/uown/svc/removeBankAccount',
      body,
    );
  }

  /**
   * List active bank accounts for an account.
   * GET /uown/svc/getBankAccounts/{accountPk}
   *
   * Returns an array of `SvBankAccount` entities (only non-deleted rows).
   */
  async getBankAccounts(
    accountPk: number | string,
  ): Promise<ApiResponse<SvBankAccountListResponse>> {
    return this.get<SvBankAccountListResponse>(
      `/uown/svc/getBankAccounts/${accountPk}`,
    );
  }

  // ── Test helpers ────────────────────────────────────────────────

  /**
   * Helper: build a minimal `BankAccountInfo` body and POST it via
   * `createOrUpdateBankAccount`. Intended for tests that need a bank
   * account attached to an account/customer pair without caring about
   * every field.
   *
   * Defaults:
   *   bankName          = "TEST BANK"
   *   bankAccountType   = "CHECKING"
   *   autoPay           = true
   *   isDeleted         = false
   *   name              = "TEST ACCOUNT HOLDER"
   *   routingNumber     = "021000021"
   *   accountNumber     = "123456789"
   */
  async createBankAccount(
    accountPk: number,
    customerPk: number,
    options: CreateBankAccountOptions = {},
  ): Promise<ApiResponse<SvBankAccountResponse>> {
    const body: BankAccountInfo = {
      customerPk,
      accountPk,
      name: options.name ?? 'TEST ACCOUNT HOLDER',
      routingNumber: options.routingNumber ?? '021000021',
      accountNumber: options.accountNumber ?? '123456789',
      bankName: options.bankName ?? 'TEST BANK',
      bankAccountType: options.bankAccountType ?? 'CHECKING',
      autoPay: options.autoPay ?? true,
      isDeleted: false,
      ...(options.leadPk != null && { leadPk: options.leadPk }),
      ...(options.comment != null && { comment: options.comment }),
    };
    return this.createOrUpdateBankAccount(body);
  }

  /**
   * Helper: wrap a `BankAccountInfo` in the `BankAccountInfoRequest` envelope
   * expected by `removeBankAccount` and dispatch the request.
   *
   * Typical usage: pass the `bankAccountInfo` returned from an earlier
   * `createBankAccount` / `getBankAccounts` call.
   */
  async deleteBankAccount(
    accountPk: number,
    bankAccountInfo: BankAccountInfo,
  ): Promise<ApiResponse<SvBankAccountResponse | boolean | void>> {
    const body: BankAccountInfoRequest = {
      accountPk,
      bankAccountInfo: {
        ...bankAccountInfo,
        isDeleted: true,
      },
    };
    return this.removeBankAccount(body);
  }
}

import pg from 'pg';
import { TIMEOUTS } from '../config/constants.js';
import { sleep } from './common.helpers.js';

const { Pool } = pg;

export class DatabaseHelpers {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      throw new Error(this.formatDbError('query', sql, params, error as Error));
    }
  }

  async queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async getSingleString(sql: string, params: unknown[] = []): Promise<string | null> {
    const row = await this.queryOne(sql, params);
    if (!row) return null;
    const values = Object.values(row);
    const first = values[0];
    return first != null ? String(first) : null;
  }

  async getSingleNumber(sql: string, params: unknown[] = []): Promise<number> {
    const val = await this.getSingleString(sql, params);
    return val ? parseFloat(val) : 0;
  }

  async executeUpdate(sql: string, params: unknown[] = []): Promise<number> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rowCount ?? 0;
    } catch (error) {
      throw new Error(this.formatDbError('update', sql, params, error as Error));
    }
  }

  async existsWhere(table: string, whereClause: string, params: unknown[] = []): Promise<boolean> {
    const sql = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
    const rows = await this.query(sql, params);
    return rows.length > 0;
  }

  async waitForRecord(
    table: string,
    whereClause: string,
    params: unknown[] = [],
    timeoutMs = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const exists = await this.existsWhere(table, whereClause, params);
        return exists ? true : null;
      },
      timeoutMs,
      'waitForRecord',
    );
    return result === true;
  }

  async waitForRecordAbsent(
    table: string,
    whereClause: string,
    params: unknown[] = [],
    timeoutMs = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const exists = await this.existsWhere(table, whereClause, params);
        return !exists ? true : null;
      },
      timeoutMs,
      'waitForRecordAbsent',
    );
    return result === true;
  }

  async waitForValueEquals(
    sql: string,
    params: unknown[],
    expected: string,
    timeoutMs = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const value = await this.getSingleString(sql, params);
        return value === expected ? true : null;
      },
      timeoutMs,
      'waitForValueEquals',
    );
    return result === true;
  }

  // Kount operations
  async insertKountRecord(
    sessionId: string,
    decision: string,
    omniScore: number,
    transactionId: string,
    requestJson: string,
    responseJson: string,
  ): Promise<void> {
    await this.executeUpdate(
      `INSERT INTO uown_kount (session_id, kount_result, omni_score, transaction_id, request_params, response_params, row_created_timestamp, row_updated_timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [sessionId, decision, omniScore, transactionId, requestJson, responseJson],
    );
  }

  async updatePreAuthStatus(sessionId: string, status: string): Promise<number> {
    return this.executeUpdate(
      `UPDATE uown_sv_credit_card SET pre_auth_status = $1, row_updated_timestamp = NOW() WHERE kount_session_id = $2`,
      [status, sessionId],
    );
  }

  // Website verification code (email OTP)
  async getWebsiteVerificationCode(email: string, timeoutMs = 60_000): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        const code = await this.getSingleString(
          `SELECT verification_code FROM uown_website_verification
           WHERE email = $1 AND used = false
           ORDER BY row_created_timestamp DESC LIMIT 1`,
          [email],
        );
        return code ?? null;
      },
      timeoutMs,
      'getWebsiteVerificationCode',
    );
  }

  // Lead operations
  async getLeadByPk(leadPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne('SELECT * FROM uown_los_lead WHERE pk = $1', [leadPk]);
  }

  async getLeadStatus(leadPk: string): Promise<string | null> {
    return this.getSingleString('SELECT lead_status FROM uown_los_lead WHERE pk = $1', [leadPk]);
  }

  // LeadShortCode operations (table: uown_los_lead_short_code, migration V20260226100000)
  async getLeadShortCode(leadPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      'SELECT * FROM uown_los_lead_short_code WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  async getLeadShortCodeValue(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT short_code FROM uown_los_lead_short_code WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  async getLeadByShortCode(shortCode: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      `SELECT ull.*, ulsc.short_code
       FROM uown_los_lead ull
       JOIN uown_los_lead_short_code ulsc ON ulsc.lead_pk = ull.pk
       WHERE ulsc.short_code = $1`,
      [shortCode],
    );
  }

  async shortCodeTableExists(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'uown_los_lead_short_code'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  async shortCodeIndexExists(indexName: string): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = $1
      ) AS exists`,
      [indexName],
    );
    return row?.exists === true;
  }

  async shortCodeForeignKeyExists(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_lead_short_code_lead'
        AND table_name = 'uown_los_lead_short_code'
        AND constraint_type = 'FOREIGN KEY'
      ) AS exists`,
      [],
    );
    return row?.exists === true;
  }

  async shortCodeHistoryTableExists(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'uown_los_lead_short_code_history'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  async waitForLeadShortCode(leadPk: string, timeoutMs = TIMEOUTS.DB_WAIT): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        return this.getLeadShortCodeValue(leadPk);
      },
      timeoutMs,
      'waitForLeadShortCode',
    );
  }

  // Flyway migration validation
  async flywayMigrationApplied(version: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      `SELECT version, description, script, installed_on, success
       FROM flyway_schema_history
       WHERE version = $1`,
      [version],
    );
  }

  // Table structure validation
  async getTableColumns(tableName: string): Promise<Array<{ column_name: string; data_type: string; is_nullable: string }>> {
    return this.query<{ column_name: string; data_type: string; is_nullable: string }>(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [tableName],
    );
  }

  // Data integrity: leads with short_code in old table but missing in new table
  async getOrphanedShortCodes(): Promise<Array<{ lead_pk: number; short_code: string }>> {
    return this.query<{ lead_pk: number; short_code: string }>(
      `SELECT l.pk AS lead_pk, l.short_code
       FROM uown_los_lead l
       LEFT JOIN uown_los_lead_short_code lsc
         ON l.pk = lsc.lead_pk AND (l.short_code IS NOT DISTINCT FROM lsc.short_code)
       WHERE l.short_code IS NOT NULL
         AND lsc.pk IS NULL`,
    );
  }

  // UW Data operations (uown_los_uwdata)
  async getUwDataByLeadPk(leadPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      'SELECT * FROM uown_los_uwdata WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  async getLambdaSegment(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT lambda_segment FROM uown_los_uwdata WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  async waitForLambdaSegment(leadPk: string, timeoutMs = TIMEOUTS.DB_WAIT): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        return this.getLambdaSegment(leadPk);
      },
      timeoutMs,
      'waitForLambdaSegment',
    );
  }

  // Invoice operations
  async getInvoiceStatus(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT invoice_status FROM uown_los_invoice WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  async waitForInvoiceStatus(
    leadPk: string,
    expectedStatus: string,
    timeoutMs = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const status = await this.getInvoiceStatus(leadPk);
        return status === expectedStatus ? true : null;
      },
      timeoutMs,
      'waitForInvoiceStatus',
    );
    return result === true;
  }

  async getLeadModification(leadPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      'SELECT * FROM uown_los_lead_modification WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  // Program operations
  async deleteProgramsByNamePattern(pattern: string): Promise<number> {
    return this.executeUpdate('DELETE FROM uown_merchant_program WHERE program_name LIKE $1', [pattern]);
  }

  async findProgramPksByNamePattern(pattern: string): Promise<number[]> {
    const rows = await this.query<{ pk: number }>('SELECT pk FROM uown_merchant_program WHERE program_name LIKE $1 ORDER BY pk', [pattern]);
    return rows.map(r => r.pk);
  }

  // ── Payment Arrangement operations (table: uown_sv_payment_arrangement) ──

  async getPaymentArrangement(accountPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      `SELECT * FROM uown_sv_payment_arrangement
       WHERE account_pk = $1
       ORDER BY pk DESC LIMIT 1`,
      [accountPk],
    );
  }

  async getPaymentArrangementStatus(accountPk: string): Promise<string | null> {
    return this.getSingleString(
      `SELECT status FROM uown_sv_payment_arrangement
       WHERE account_pk = $1
       ORDER BY pk DESC LIMIT 1`,
      [accountPk],
    );
  }

  async getPaymentArrangementsByAccount(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_payment_arrangement
       WHERE account_pk = $1
       ORDER BY pk DESC`,
      [accountPk],
    );
  }

  async waitForPaymentArrangementStatus(
    accountPk: string,
    expectedStatus: string,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const status = await this.getPaymentArrangementStatus(accountPk);
        return status === expectedStatus ? true : null;
      },
      timeoutMs,
      'waitForPaymentArrangementStatus',
    );
    return result === true;
  }

  async paymentArrangementTableExists(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'uown_sv_payment_arrangement'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  async getPaymentArrangementColumns(): Promise<Array<{ column_name: string; data_type: string; is_nullable: string }>> {
    return this.getTableColumns('uown_sv_payment_arrangement');
  }

  /** Check if payment_arrangement_pk FK column exists in CC transaction table */
  async ccTransactionHasArrangementFk(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'uown_sv_credit_card_transaction'
        AND column_name = 'payment_arrangement_pk'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  /** Check if payment_arrangement_pk FK column exists in ACH payment table */
  async achPaymentHasArrangementFk(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'uown_sv_achpayment'
        AND column_name = 'payment_arrangement_pk'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  /** Get CC transactions linked to a payment arrangement */
  async getCcTransactionsByArrangement(arrangementPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_credit_card_transaction
       WHERE payment_arrangement_pk = $1
       ORDER BY pk`,
      [arrangementPk],
    );
  }

  /** Get ACH payments linked to a payment arrangement */
  async getAchPaymentsByArrangement(arrangementPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_achpayment
       WHERE payment_arrangement_pk = $1
       ORDER BY pk`,
      [arrangementPk],
    );
  }

  /** Check if payment_arrangement_pk FK column exists in LOS CC transaction table */
  async losCcTransactionHasArrangementFk(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'uown_los_credit_card_transaction'
        AND column_name = 'payment_arrangement_pk'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  /** Get FK constraint names for payment arrangement */
  async getPaymentArrangementFkConstraints(): Promise<Array<{ constraint_name: string; table_name: string }>> {
    return this.query<{ constraint_name: string; table_name: string }>(
      `SELECT tc.constraint_name, tc.table_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY'
       AND kcu.column_name = 'payment_arrangement_pk'
       ORDER BY tc.table_name`,
    );
  }

  /** Get payment arrangement by PK (not by account) */
  async getPaymentArrangementByPk(arrangementPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      'SELECT * FROM uown_sv_payment_arrangement WHERE pk = $1',
      [arrangementPk],
    );
  }

  /** Get activity logs for an account containing a search term */
  async getActivityLogsByAccount(
    accountPk: string,
    searchTerm?: string,
  ): Promise<Array<Record<string, unknown>>> {
    if (searchTerm) {
      return this.query(
        `SELECT * FROM uown_sv_activity_log
         WHERE account_pk = $1 AND LOWER(notes) LIKE LOWER($2)
         ORDER BY row_created_timestamp DESC`,
        [accountPk, `%${searchTerm}%`],
      );
    }
    return this.query(
      `SELECT * FROM uown_sv_activity_log
       WHERE account_pk = $1
       ORDER BY row_created_timestamp DESC`,
      [accountPk],
    );
  }

  /** Get account rating letter */
  async getAccountRating(accountPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT rating FROM uown_sv_account WHERE pk = $1',
      [accountPk],
    );
  }

  /** Get account status */
  async getAccountStatus(accountPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT account_status FROM uown_sv_account WHERE pk = $1',
      [accountPk],
    );
  }

  /** Wait for account status to reach expected value */
  async waitForAccountStatus(
    accountPk: string,
    expectedStatus: string,
    timeoutMs = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const status = await this.getAccountStatus(accountPk);
        return status === expectedStatus ? true : null;
      },
      timeoutMs,
      'waitForAccountStatus',
    );
    return result === true;
  }

  /** Get account PK from lead PK (cross-DB: LOS lead → SVC account) */
  async getAccountPkByLeadPk(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT pk FROM uown_sv_account WHERE lead_pk = $1',
      [leadPk],
    );
  }

  /** Wait for account to be created from lead */
  async waitForAccountByLeadPk(leadPk: string, timeoutMs = TIMEOUTS.DB_WAIT): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        return this.getAccountPkByLeadPk(leadPk);
      },
      timeoutMs,
      'waitForAccountByLeadPk',
    );
  }

  /** Get pending CC transactions for an account (sweep criteria) */
  async getPendingCcTransactions(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_credit_card_transaction
       WHERE account_pk = $1 AND status = 'PENDING'
       ORDER BY pk`,
      [accountPk],
    );
  }

  /** Get pending ACH payments for an account (sweep criteria) */
  async getPendingAchPayments(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_achpayment
       WHERE account_pk = $1 AND status = 'PENDING'
       ORDER BY pk`,
      [accountPk],
    );
  }

  /** Wait for all CC transactions of an arrangement to leave PENDING status */
  async waitForCcTransactionsProcessed(
    arrangementPk: string,
    timeoutMs = 60_000,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const rows = await this.query<{ status: string }>(
          `SELECT status FROM uown_sv_credit_card_transaction
           WHERE payment_arrangement_pk = $1`,
          [arrangementPk],
        );
        if (rows.length === 0) return null;
        const allProcessed = rows.every(r => r.status !== 'PENDING');
        return allProcessed ? true : null;
      },
      timeoutMs,
      'waitForCcTransactionsProcessed',
    );
    return result === true;
  }

  /** Wait for all ACH payments of an arrangement to leave PENDING status */
  async waitForAchPaymentsProcessed(
    arrangementPk: string,
    timeoutMs = 60_000,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const rows = await this.query<{ status: string }>(
          `SELECT status FROM uown_sv_achpayment
           WHERE payment_arrangement_pk = $1`,
          [arrangementPk],
        );
        if (rows.length === 0) return null;
        const allProcessed = rows.every(r => r.status !== 'PENDING');
        return allProcessed ? true : null;
      },
      timeoutMs,
      'waitForAchPaymentsProcessed',
    );
    return result === true;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async pollUntil<T>(
    check: () => Promise<T | null>,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
    logPrefix: string = 'poll',
  ): Promise<T | null> {
    const deadline = Date.now() + timeoutMs;
    let interval: number = TIMEOUTS.DB_POLL_INITIAL;
    while (Date.now() < deadline) {
      try {
        const result = await check();
        if (result !== null && result !== undefined) return result;
      } catch (error) {
        console.warn(`[${logPrefix}] poll error: ${(error as Error).message}`);
      }
      await sleep(interval);
      interval = Math.min(interval * TIMEOUTS.DB_POLL_BACKOFF, TIMEOUTS.DB_POLL_MAX);
    }
    return null;
  }

  private formatDbError(operation: string, sql: string, params: unknown[], error: Error): string {
    return `Database ${operation} failed: ${error.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`;
  }
}

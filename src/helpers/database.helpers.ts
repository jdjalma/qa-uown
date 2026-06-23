import pg from 'pg';
import { TIMEOUTS } from '../config/constants.js';
import { sleep, pollUntil as pollUntilShared } from './common.helpers.js';

const { Pool } = pg;

export interface NeuroIdVerificationRow {
  pk: number;
  lead_pk: number;
  neuro_id_status: string | null;
  status: string | null;
  success: boolean | null;
  notes: string | null;
  error_message: string | null;
  caller: string | null;
  site_id: string | null;
  identity: string | null;
  row_created_timestamp: Date | null;
  row_updated_timestamp: Date | null;
}

// ── Merchant program (scheduleProgramActivationDeactivationDates) ───────
//
// Table `uown_merchant_program` holds program definitions (NOT the merchant
// link). The merchant↔program relationship is in the junction table
// `uown_merchant_to_program` (merchant_pk, program_pk, is_active, …).
// A program's pk IS the program_pk — there is no separate program_pk column.
// There is no group_pk column either (only group_name).
// Columns (confirmed via JPA `MerchantProgram` + migration V20260327120000):
//   pk, program_id, program_name, term_months, money_factor, …
//   activation_date DATE NULL, deactivation_date DATE NULL,
//   is_active BOOLEAN NOT NULL DEFAULT TRUE (derived by sweep from dates),
//   group_name TEXT NULL,
//   row_created_timestamp, row_updated_timestamp, tenant_id
export interface MerchantProgramRecord {
  pk: number;
  programName: string;
  programId: string | null;
  termMonths: number;
  activationDate: string | null;       // ISO `YYYY-MM-DD` or null
  deactivationDate: string | null;     // ISO `YYYY-MM-DD` or null
  isActive: boolean;
  groupName: string | null;
  rowCreatedTimestamp: Date | null;
  rowUpdatedTimestamp: Date | null;
}

export interface MerchantProgramSnapshot {
  activationDate: string | null;
  deactivationDate: string | null;
  isActive: boolean;
}

// Log entry from table `uown_merchant_activity_log` (snake_case lowercase).
// Schema confirmed in qa2: columns include merchant_pk, program_pk (not _p_k),
// log_type, notes, created_by, agent, row_created_timestamp.
// Filtered here to PROGRAM_DATA_CHANGE log_type (audit trail emitted by
// MerchantProgramService + MerchantProgramActivationDeactivationSweepService).
export interface ProgramActivityLogRecord {
  pk: number;
  program_pk: number | null;
  merchant_pk: number | null;
  log_type: string;
  created_by: string | null;
  notes: string | null;
  row_created_timestamp: Date | null;
}

// ── Login attempt + activity log row shapes (SVC-460) ───────────────────
export interface LoginAttemptRow {
  pk: string;
  email_phone_input: string;
  code: string | null;
  given_codes: string | null;
  number_of_attempts: number;
  sms_id: string | null;
  account_found: boolean;
  account_pks: string | null;
  expiration_time: Date | null;
  sent_time: Date | null;
  row_created_timestamp: Date;
}

export interface LoginActivityLogRow {
  pk: string;
  log_type: string;
  created_by: string | null;
  agent: string | null;
  notes: string | null;
  row_created_timestamp: Date;
}

// ── Kount + GDS token row shapes (RU05.26.1.51.1 — issue #502) ──────────
export interface TokenRow {
  pk: number;
  row_created_timestamp: Date | null;
  row_updated_timestamp: Date | null;
  tenant_id: number | null;
  access_token: string;
  expiration_time: Date;
}
export type KountTokenRow = TokenRow;
export type GdsTokenRow = TokenRow;

// ── UW scores snapshot (npm_segment / tam_score) ───────────
// `uown_los_uwdata` (lead side) and `uown_sv_uwdata` (account side) gained
// `npm_segment` + `tam_score` (both integer) in migration V20260603054943_1.53.0.
// The GDS parser writes them on the 16m approval branch; `tam_score` is
// TireAgent-only. `decided_by_agent`/`eligible_terms` are the engine + term
// guards. Column names confirmed vs information_schema in qa2 (32-col table).
export interface UwScoresRow {
  lead_pk: number;
  npm_segment: number | null;
  tam_score: number | null;
  decided_by_agent: string | null;
  eligible_terms: string | null;
  uw_status: string | null;
}
export interface SvUwScoresRow {
  account_pk: number;
  npm_segment: number | null;
  tam_score: number | null;
  decided_by_agent: string | null;
  eligible_terms: string | null;
}

// ── Merchant-settings snapshot (immutable UW-config snapshot) ──
// On UW approval the system writes an immutable LEAD snapshot of the merchant's
// UW config; on funding/account creation it copies that into an immutable ACCOUNT
// snapshot. Columns are authoritative per Flyway V20260609155406 (the snapshot
// tables themselves), confirmed read-only against information_schema in qa2 (probe
// src/scripts/probe-merchant-settings-snapshot-rows.ts, 2026-06-16):
//   uown_los_lead_merchant_settings_snapshot — keyed by lead_pk (UNIQUE)
//   uown_sv_account_merchant_settings_snapshot — same + account_pk (UNIQUE) + lead_pk
// `epo5`/`epo10` are BOOLEAN; `uw_pipeline` is VARCHAR(10) [GDS|ABBR|TAKTILE]
// (qa2 fixture carries the literal 'Test'); `fraud_threshold` is INTEGER;
// `program_pk` is nullable. Read-only — SELECT only.
export interface LeadMerchantSettingsSnapshotRow {
  pk: number;
  lead_pk: number;
  merchant_pk: number;
  program_pk: number | null;
  epo5: boolean;
  epo10: boolean;
  uw_pipeline: string | null;
  fraud_threshold: number;
  row_created_timestamp: Date;
}
export interface AccountMerchantSettingsSnapshotRow extends LeadMerchantSettingsSnapshotRow {
  account_pk: number;
}

// Raw row shape returned by pg for MerchantProgram SELECT *
interface MerchantProgramRow {
  pk: number | string;
  program_name: string;
  program_id: string | null;
  term_months: number | string;
  activation_date: Date | string | null;
  deactivation_date: Date | string | null;
  is_active: boolean;
  group_name: string | null;
  row_created_timestamp: Date | null;
  row_updated_timestamp: Date | null;
}

export class DatabaseHelpers {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      // TCP keepalive probes keep idle pooled connections alive across long
      // query gaps (e.g. a 30s UI/PDF render between two DB reads), so a tunnel
      // /server idle-drop doesn't silently kill the socket (pitfall #113).
      keepAlive: true,
    });
    // CRITICAL (pitfall #113): a pg Pool emits 'error' when an IDLE pooled
    // client's socket dies (qa2 SSH-tunnel hiccup, server idle-drop). With NO
    // listener, Node treats it as an unhandled 'error' event and CRASHES the
    // worker — which tore down the Playwright context mid-test and surfaced as a
    // bogus "Target page/context/browser has been closed" elsewhere (the OH
    // MONTHLY render, 2026-06-22). Swallow it: the Pool discards the dead client
    // and lazily creates a fresh one for the next query, so reads transparently
    // recover. Do NOT rethrow here.
    this.pool.on('error', (err) => {
      console.warn(`[db-pool] idle client error (recovered, non-fatal): ${err.message}`);
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
    timeoutMs: number = TIMEOUTS.DB_WAIT,
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
    timeoutMs: number = TIMEOUTS.DB_WAIT,
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
    timeoutMs: number = TIMEOUTS.DB_WAIT,
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

  /**
   * Polls a single-string column until its value changes from `oldValue`.
   * Returns the new value when it changes; throws if timeout reached.
   *
   * @param sql SELECT returning a single string column (use LIMIT 1)
   * @param params query params
   * @param oldValue the value we want to see CHANGE
   * @param timeoutMs total wait budget (default 30_000)
   * @param intervalMs poll interval (default 500)
   */
  async waitForValueChange(
    sql: string,
    params: unknown[],
    oldValue: string,
    timeoutMs = 30_000,
    intervalMs = 500,
  ): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const current = await this.getSingleString(sql, params);
        if (current !== null && current !== oldValue) {
          return current;
        }
      } catch (error) {
        console.warn(`[waitForValueChange] poll error: ${(error as Error).message}`);
      }
      await sleep(intervalMs);
    }
    throw new Error(
      `waitForValueChange timed out after ${timeoutMs}ms (value still ${oldValue})`,
    );
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
  async getWebsiteVerificationCode(email: string, timeoutMs: number = 60_000): Promise<string | null> {
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

  async waitForLeadShortCode(leadPk: string, timeoutMs: number = TIMEOUTS.DB_WAIT): Promise<string | null> {
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

  /**
   * UW scores snapshot row for a lead (npm_segment / tam_score).
   * Projects only the columns under test, confirmed against information_schema in
   * qa2 (uown_los_uwdata has 32 cols; these are real column names, not entity fields).
   * `npm_segment`/`tam_score` are nullable integers; `decided_by_agent` is the engine
   * guard ('GDS' for the rows that carry these fields); `eligible_terms` is the 13/16
   * term string. Read-only.
   */
  async getUwScoresByLeadPk(leadPk: string): Promise<UwScoresRow | null> {
    return this.queryOne<UwScoresRow>(
      `SELECT lead_pk, npm_segment, tam_score, decided_by_agent, eligible_terms, uw_status
         FROM uown_los_uwdata
        WHERE lead_pk = $1
        ORDER BY pk DESC
        LIMIT 1`,
      [leadPk],
    );
  }

  /**
   * Same projection for the Servicing-side snapshot (CT-04, funding copy).
   * `uown_sv_uwdata` carries `account_pk`; the migration touched BOTH tables.
   */
  async getSvUwScoresByAccountPk(accountPk: string): Promise<SvUwScoresRow | null> {
    return this.queryOne<SvUwScoresRow>(
      `SELECT account_pk, npm_segment, tam_score, decided_by_agent, eligible_terms
         FROM uown_sv_uwdata
        WHERE account_pk = $1
        ORDER BY pk DESC
        LIMIT 1`,
      [accountPk],
    );
  }

  /**
   * Poll until the UW decision row exists AND npm_segment is populated for a lead.
   * The GDS decision is async (sweep → engine → persist); use this instead of a
   * single query + sleep ([[db-polling-pattern]]). Returns the row (npm_segment
   * non-null) or null on timeout. Read-only.
   */
  async waitForUwNpmSegment(leadPk: string, timeoutMs: number = TIMEOUTS.DB_WAIT): Promise<UwScoresRow | null> {
    return this.pollUntil<UwScoresRow>(
      async () => {
        const row = await this.getUwScoresByLeadPk(leadPk);
        return row && row.npm_segment != null ? row : null;
      },
      timeoutMs,
      'waitForUwNpmSegment',
    );
  }

  async getLambdaSegment(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT lambda_segment FROM uown_los_uwdata WHERE lead_pk = $1 ORDER BY pk DESC LIMIT 1',
      [leadPk],
    );
  }

  async waitForLambdaSegment(leadPk: string, timeoutMs: number = TIMEOUTS.DB_WAIT): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        return this.getLambdaSegment(leadPk);
      },
      timeoutMs,
      'waitForLambdaSegment',
    );
  }

  /**
   * Latest LEAD merchant-settings snapshot row for a lead. Projects
   * the snapshot table's OWN columns (Flyway V20260609155406), confirmed against
   * information_schema in qa2 — not entity field names. The snapshot is written
   * once on UW approval and is immutable; ORDER BY pk DESC LIMIT 1 returns the
   * latest in the (idempotent, expected COUNT=1) case. Read-only.
   */
  async getLeadMerchantSettingsSnapshot(leadPk: string): Promise<LeadMerchantSettingsSnapshotRow | null> {
    return this.queryOne<LeadMerchantSettingsSnapshotRow>(
      `SELECT pk, lead_pk, merchant_pk, program_pk, epo5, epo10,
              uw_pipeline, fraud_threshold, row_created_timestamp
         FROM uown_los_lead_merchant_settings_snapshot
        WHERE lead_pk = $1
        ORDER BY pk DESC
        LIMIT 1`,
      [leadPk],
    );
  }

  /**
   * Latest ACCOUNT merchant-settings snapshot row for an account.
   * The account snapshot is a copy of the lead snapshot, written on funding/account
   * creation; `uown_sv_account_merchant_settings_snapshot` adds `account_pk` (UNIQUE)
   * alongside the lead-table columns. Read-only.
   */
  async getAccountMerchantSettingsSnapshot(accountPk: string): Promise<AccountMerchantSettingsSnapshotRow | null> {
    return this.queryOne<AccountMerchantSettingsSnapshotRow>(
      `SELECT pk, account_pk, lead_pk, merchant_pk, program_pk, epo5, epo10,
              uw_pipeline, fraud_threshold, row_created_timestamp
         FROM uown_sv_account_merchant_settings_snapshot
        WHERE account_pk = $1
        ORDER BY pk DESC
        LIMIT 1`,
      [accountPk],
    );
  }

  /**
   * Poll until the LEAD merchant-settings snapshot row exists for a lead.
   * The snapshot write is async (UW approval branch), so use this instead
   * of a single query + sleep ([[db-polling-pattern]]). Returns the row or null on
   * timeout. Read-only. Mirror of waitForUwNpmSegment.
   */
  async waitForLeadMerchantSettingsSnapshot(
    leadPk: string,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<LeadMerchantSettingsSnapshotRow | null> {
    return this.pollUntil<LeadMerchantSettingsSnapshotRow>(
      async () => {
        return this.getLeadMerchantSettingsSnapshot(leadPk);
      },
      timeoutMs,
      'waitForLeadMerchantSettingsSnapshot',
    );
  }

  /**
   * Poll until the ACCOUNT merchant-settings snapshot row exists for an account.
   * The funding→account-snapshot copy is async; poll instead of
   * single query + sleep. Returns the row or null on timeout. Read-only.
   */
  async waitForAccountMerchantSettingsSnapshot(
    accountPk: string,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<AccountMerchantSettingsSnapshotRow | null> {
    return this.pollUntil<AccountMerchantSettingsSnapshotRow>(
      async () => {
        return this.getAccountMerchantSettingsSnapshot(accountPk);
      },
      timeoutMs,
      'waitForAccountMerchantSettingsSnapshot',
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
    timeoutMs: number = TIMEOUTS.DB_WAIT,
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
    timeoutMs: number = TIMEOUTS.DB_WAIT,
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

  /** Get account auto_pay_types (comma-separated, e.g. 'ACH,CC', 'NONE', 'ACH') */
  async getAccountAutoPayTypes(accountPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT auto_pay_types FROM uown_sv_account WHERE pk = $1',
      [accountPk],
    );
  }

  // ── Bank account operations (table: uown_sv_bank_account) ────────────

  /** Get all bank accounts (active + deleted) for the account, newest first */
  async getBankAccountsByAccountPk(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_bank_account
       WHERE account_pk = $1
       ORDER BY row_created_timestamp DESC`,
      [accountPk],
    );
  }

  /** Get only non-deleted bank accounts for the account, newest first */
  async getActiveBankAccountsByAccountPk(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_bank_account
       WHERE account_pk = $1 AND is_deleted = false
       ORDER BY row_created_timestamp DESC`,
      [accountPk],
    );
  }

  /** Get a single bank account by its PK */
  async getBankAccountByPk(bankAccountPk: string): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      'SELECT * FROM uown_sv_bank_account WHERE pk = $1',
      [bankAccountPk],
    );
  }

  /** Wait until the specified bank account is flagged is_deleted = true */
  async waitForBankAccountDeleted(
    bankAccountPk: string,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<boolean> {
    const result = await this.pollUntil<boolean>(
      async () => {
        const row = await this.queryOne<{ is_deleted: boolean }>(
          'SELECT is_deleted FROM uown_sv_bank_account WHERE pk = $1',
          [bankAccountPk],
        );
        return row?.is_deleted === true ? true : null;
      },
      timeoutMs,
      'waitForBankAccountDeleted',
    );
    return result === true;
  }

  /**
   * Wait for a new active bank_account row matching (account_pk, account_number).
   * Returns the new PK as string, or null on timeout.
   */
  async waitForBankAccountExists(
    accountPk: string,
    accountNumber: string,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        return this.getSingleString(
          `SELECT pk FROM uown_sv_bank_account
           WHERE account_pk = $1 AND account_number = $2 AND is_deleted = false
           ORDER BY row_created_timestamp DESC LIMIT 1`,
          [accountPk, accountNumber],
        );
      },
      timeoutMs,
      'waitForBankAccountExists',
    );
  }

  /** Get activity log entries scoped to bank account changes (log_type = 'BANK_ACCOUNT') */
  async getBankAccountActivityLogs(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_activity_log
       WHERE account_pk = $1 AND log_type = 'BANK_ACCOUNT'
       ORDER BY row_created_timestamp DESC`,
      [accountPk],
    );
  }

  /** Get DATA_CHANGE activity logs that reference rating letter changes */
  async getRatingChangeLogs(accountPk: string): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_activity_log
       WHERE account_pk = $1
         AND log_type = 'DATA_CHANGE'
         AND notes LIKE '%Rating letter changed%'
       ORDER BY row_created_timestamp DESC`,
      [accountPk],
    );
  }

  /** Get account PK from lead PK (cross-DB: LOS lead → SVC account) */
  async getAccountPkByLeadPk(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT pk FROM uown_sv_account WHERE lead_pk = $1',
      [leadPk],
    );
  }

  /** Wait for account to be created from lead */
  async waitForAccountByLeadPk(leadPk: string, timeoutMs: number = TIMEOUTS.DB_WAIT): Promise<string | null> {
    return this.pollUntil<string>(
      async () => {
        return this.getAccountPkByLeadPk(leadPk);
      },
      timeoutMs,
      'waitForAccountByLeadPk',
    );
  }

  /** Get a single CC transaction by PK */
  async getCcTransactionByPk(txPk: string | number): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      `SELECT * FROM uown_sv_credit_card_transaction WHERE pk = $1`,
      [txPk],
    );
  }

  /** Get all CC transactions for an account (ordered by pk DESC) */
  async getCcTransactionsByAccount(accountPk: string | number): Promise<Array<Record<string, unknown>>> {
    return this.query(
      `SELECT * FROM uown_sv_credit_card_transaction
       WHERE account_pk = $1
       ORDER BY pk DESC`,
      [accountPk],
    );
  }

  /** Get the latest activity log entry for an account matching a search term */
  async getLatestActivityLog(
    accountPk: string | number,
    searchTerm: string,
  ): Promise<Record<string, unknown> | null> {
    return this.queryOne(
      `SELECT * FROM uown_sv_activity_log
       WHERE account_pk = $1 AND LOWER(notes) LIKE LOWER($2)
       ORDER BY row_created_timestamp DESC
       LIMIT 1`,
      [accountPk, `%${searchTerm}%`],
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

  /**
   * Wait for a specific CC transaction to leave PENDING/PICKED_TO_SEND status.
   * Returns the final status (e.g. APPROVED, DENIED, ERROR) or 'TIMEOUT'.
   */
  async waitForCcTransactionProcessed(
    txnPk: string | number,
    timeoutMs: number = 30_000,
  ): Promise<string> {
    const result = await this.pollUntil<string>(
      async () => {
        const row = await this.queryOne<{ status: string }>(
          `SELECT status FROM uown_sv_credit_card_transaction WHERE pk = $1`,
          [txnPk],
        );
        if (!row || row.status === 'PENDING' || row.status === 'PICKED_TO_SEND') return null;
        return row.status;
      },
      timeoutMs,
      'waitForCcTransactionProcessed',
    );
    return result ?? 'TIMEOUT';
  }

  /** Wait for all CC transactions of an arrangement to leave PENDING status */
  async waitForCcTransactionsProcessed(
    arrangementPk: string,
    timeoutMs: number = 60_000,
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
    timeoutMs: number = 60_000,
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

  // ── Simulated CC sweep (bypasses nextreceivable JOIN) ─────────────────

  /**
   * Simulates CC sweep processing for a specific arrangement.
   * The real sweep (`sendCreditCardPaymentsSweep`) requires a
   * `JOIN nextreceivable` with UNPAID receivables — accounts without
   * them are silently skipped. This helper bypasses that constraint.
   *
   * Updates PENDING CC transactions with `posting_date <= CURRENT_DATE`
   * to APPROVED for the given arrangement.
   *
   * @returns Number of CC transactions processed (0 if none eligible).
   */
  async simulateCcSweepForArrangement(arrangementPk: string): Promise<number> {
    return this.executeUpdate(
      `UPDATE uown_sv_credit_card_transaction
       SET status = 'APPROVED'
       WHERE payment_arrangement_pk = $1
         AND status = 'PENDING'
         AND posting_date <= CURRENT_DATE`,
      [arrangementPk],
    );
  }

  /**
   * Authorized synthetic processor stand-in for MULTI-INSTALLMENT CC arrangements.
   *
   * A weekly CC arrangement (today → today+28) produces N CC SALEs: the one posting
   * today processes synchronously (APPROVED); the future-dated ones (today+7/14/21/28)
   * stay PENDING with `posting_date > CURRENT_DATE`. dev3 has no real processor sweep to
   * approve them when their posting date arrives, so the arrangement is stuck at
   * IN_PROGRESS forever — `simulateCcSweepForArrangement` (date-gated) cannot move them.
   *
   * This helper approves ALL remaining PENDING CC SALEs for the arrangement regardless of
   * posting_date — standing in for the processor callbacks that dev3 cannot emit. Same
   * authorized Exception-3 DB-mutation scope as S4/S5's ACH SETTLED/RETURNED stand-ins
   * (user authorization granted 2026-06-01, CLAUDE.md Exception 3). Caller then runs
   * `recalculateArrangementStatus` to derive the terminal SUCCESS state.
   *
   * Primary-source evidence (dev3, 2026-06-01): arrangement pk=100 had 5 CC SALEs —
   * pk3328 APPROVED (posting today) + pk3329-3332 PENDING (posting +7/+14/+21/+28),
   * arrangement stuck at IN_PROGRESS.
   *
   * @returns Number of CC SALE transactions approved (0 if none pending).
   */
  async approveAllPendingCcSalesForArrangement(arrangementPk: string): Promise<number> {
    return this.executeUpdate(
      `UPDATE uown_sv_credit_card_transaction
       SET status = 'APPROVED'
       WHERE payment_arrangement_pk = $1
         AND status = 'PENDING'
         AND cc_action = 'SALE'`,
      [arrangementPk],
    );
  }

  /**
   * Recalculates arrangement status based on its CC transaction states.
   * Mirrors the Java state machine in `BootstrapService`:
   *
   *   hasFailure  → FAILED  (is_active=false)
   *   hasPending  → IN_PROGRESS (is_active=true)
   *   all done + SETTLEMENT → SUCCESS (is_active=false) + account SETTLED_IN_FULL
   *   all done + NORMAL    → SUCCESS (is_active=false)
   *
   * @returns The new arrangement status.
   */
  async recalculateArrangementStatus(arrangementPk: string): Promise<string> {
    const txns = await this.getCcTransactionsByArrangement(arrangementPk);

    const hasFailed = txns.some(t =>
      ['DENIED', 'ERROR', 'FAILED'].includes(String(t.status)),
    );
    const hasPending = txns.some(t =>
      ['PENDING', 'PICKED_TO_SEND', 'FUTURE_PENDING'].includes(String(t.status)),
    );

    let newStatus: string;
    let isActive: boolean;

    if (hasFailed) {
      newStatus = 'FAILED';
      isActive = false;
    } else if (hasPending) {
      newStatus = 'IN_PROGRESS';
      isActive = true;
    } else {
      newStatus = 'SUCCESS';
      isActive = false;
    }

    await this.executeUpdate(
      `UPDATE uown_sv_payment_arrangement
       SET status = $1, is_active = $2
       WHERE pk = $3`,
      [newStatus, isActive, arrangementPk],
    );

    // SETTLEMENT + SUCCESS → account transitions to SETTLED_IN_FULL
    if (newStatus === 'SUCCESS') {
      const arrangement = await this.getPaymentArrangementByPk(arrangementPk);
      if (arrangement && String(arrangement.arrangement_type) === 'SETTLEMENT') {
        await this.executeUpdate(
          `UPDATE uown_sv_account
           SET account_status = 'SETTLED_IN_FULL'
           WHERE pk = $1`,
          [arrangement.account_pk],
        );
      }
    }

    return newStatus;
  }

  /**
   * Recalculates arrangement status based on its ACH payment states.
   * Mirrors the Java logic in `PaymentArrangementACHListener` from MR !1368:
   *
   *   PENDING_STATUSES  = PENDING | SENT | ACK_RECEIVED | PICKED_TO_SEND
   *                       | STATUS_UPDATE_PENDING | PENDING_TO_RERUN
   *   SUCCESS_STATUSES  = SETTLED | COMPLETED | SETTLED_IN_RERUN
   *   isFailure         = !PENDING && !SUCCESS (residual — anything else)
   *
   *   hasFailed   → FAILED       (is_active=false)
   *   hasPending  → IN_PROGRESS  (is_active=true)
   *   all success → SUCCESS      (is_active=false)
   *     + SETTLEMENT type → account SETTLED_IN_FULL
   *
   * @returns The new arrangement status.
   */
  async recalculateAchArrangementStatus(arrangementPk: string): Promise<string> {
    const PENDING_STATUSES = [
      'PENDING',
      'SENT',
      'ACK_RECEIVED',
      'PICKED_TO_SEND',
      'STATUS_UPDATE_PENDING',
      'PENDING_TO_RERUN',
    ];
    const SUCCESS_STATUSES = ['SETTLED', 'COMPLETED', 'SETTLED_IN_RERUN'];

    const payments = await this.getAchPaymentsByArrangement(arrangementPk);

    const hasFailed = payments.some(
      p => !PENDING_STATUSES.includes(String(p.status)) && !SUCCESS_STATUSES.includes(String(p.status)),
    );
    const hasPending = payments.some(p => PENDING_STATUSES.includes(String(p.status)));

    let newStatus: string;
    let isActive: boolean;

    if (hasFailed) {
      newStatus = 'FAILED';
      isActive = false;
    } else if (hasPending) {
      newStatus = 'IN_PROGRESS';
      isActive = true;
    } else {
      newStatus = 'SUCCESS';
      isActive = false;
    }

    await this.executeUpdate(
      `UPDATE uown_sv_payment_arrangement
       SET status = $1, is_active = $2
       WHERE pk = $3`,
      [newStatus, isActive, arrangementPk],
    );

    // SETTLEMENT + SUCCESS → account transitions to SETTLED_IN_FULL
    if (newStatus === 'SUCCESS') {
      const arrangement = await this.getPaymentArrangementByPk(arrangementPk);
      if (arrangement && String(arrangement.arrangement_type) === 'SETTLEMENT') {
        await this.executeUpdate(
          `UPDATE uown_sv_account
           SET account_status = 'SETTLED_IN_FULL'
           WHERE pk = $1`,
          [arrangement.account_pk],
        );
      }
    }

    return newStatus;
  }

  // ── Merchant dealer fields ────────────────────────────────────────────

  async getMerchantDealerFields(merchantPk: number | string): Promise<{
    dealer_discount_override: string | null;
    dealer_rebate_override: string | null;
    dealer_rebate_type: string | null;
  } | null> {
    return this.queryOne<{
      dealer_discount_override: string | null;
      dealer_rebate_override: string | null;
      dealer_rebate_type: string | null;
    }>(
      `SELECT dealer_discount_override, dealer_rebate_override, dealer_rebate_type
       FROM uown_merchant WHERE pk = $1`,
      [merchantPk],
    );
  }

  async getMerchantCampaignFields(merchantPk: number | string): Promise<{
    peak_campaign_id: string | null;
    off_peak_campaign_id: string | null;
  } | null> {
    return this.queryOne<{
      peak_campaign_id: string | null;
      off_peak_campaign_id: string | null;
    }>(
      `SELECT peak_campaign_id, off_peak_campaign_id
       FROM uown_merchant WHERE pk = $1`,
      [merchantPk],
    );
  }

  // ── Merchant GDS config fields ────────────────────────────────────────

  async getMerchantGdsFields(merchantPk: number | string): Promise<{
    uw_pipeline: string | null;
    fraud_threshold: string | null;
    max_approval_amount: string | null;
  } | null> {
    return this.queryOne<{
      uw_pipeline: string | null;
      fraud_threshold: string | null;
      max_approval_amount: string | null;
    }>(
      `SELECT uw_pipeline, fraud_threshold::text AS fraud_threshold, max_approval_amount::text AS max_approval_amount
       FROM uown_merchant WHERE pk = $1`,
      [merchantPk],
    );
  }

  // ── GDS outbound log ──────────────────────────────────────────────────

  async getGdsOutboundLogForLead(leadPk: string | number): Promise<{
    pk: number;
    lead_pk: number;
    request: string | null;
    url: string | null;
    response: string | null;
    row_created_timestamp: Date | null;
  } | null> {
    return this.queryOne<{
      pk: number;
      lead_pk: number;
      request: string | null;
      url: string | null;
      response: string | null;
      row_created_timestamp: Date | null;
    }>(
      `SELECT pk, lead_pk, request, url, response, row_created_timestamp
       FROM uown_los_outbound_api_log
       WHERE lead_pk = $1 AND url LIKE '%dataview360%'
       ORDER BY pk DESC LIMIT 1`,
      [leadPk],
    );
  }

  async getMerchantPkByNumber(merchantNumber: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT pk FROM uown_merchant WHERE ref_merchant_code = $1 LIMIT 1',
      [merchantNumber],
    );
  }

  async getMerchantActivityLog(merchantPk: string | number): Promise<Array<{
    pk: number;
    merchant_pk: number;
    merchant_ref_code: string;
    log_type: string;
    notes: string;
    agent: string;
  }>> {
    return this.query(
      `SELECT pk, merchant_pk, merchant_ref_code, log_type, notes, agent
       FROM uown_merchant_activity_log
       WHERE merchant_pk = $1
       AND log_type = 'MERCHANT_DATA_CHANGE'
       ORDER BY pk DESC LIMIT 5`,
      [merchantPk],
    );
  }

  async getLatestMerchantActivityLog(merchantPk: string | number): Promise<{
    pk: number;
    merchant_pk: number;
    merchant_ref_code: string;
    log_type: string;
    notes: string;
    agent: string;
  } | null> {
    return this.queryOne(
      `SELECT pk, merchant_pk, merchant_ref_code, log_type, notes, agent
       FROM uown_merchant_activity_log
       WHERE merchant_pk = $1
       AND log_type = 'MERCHANT_DATA_CHANGE'
       ORDER BY pk DESC LIMIT 1`,
      [merchantPk],
    );
  }

  // ── Merchant inventory category (task #1262) ──────────────────────

  /**
   * Returns full merchant row for verification of inventory_category persistence,
   * audit fields, and clone linkage. Used by CT-03, CT-04, CT-06, CT-07.
   *
   * `uown_merchant` uses `row_created_timestamp`/`row_updated_timestamp` and a
   * single `agent` column for the acting user (no `created_at`/`updated_at` /
   * `created_by`/`updated_by`).
   */
  async getMerchantByRefCode(refMerchantCode: string): Promise<{
    pk: number;
    ref_merchant_code: string;
    merchant_name: string | null;
    inventory_category: string | null;
    is_active: boolean;
    row_created_timestamp: Date | null;
    row_updated_timestamp: Date | null;
    agent: string | null;
    cloned_from: number | null;
  } | null> {
    return this.queryOne(
      `SELECT pk, ref_merchant_code, merchant_name, inventory_category, is_active,
              row_created_timestamp, row_updated_timestamp, agent, cloned_from
       FROM uown_merchant
       WHERE ref_merchant_code = $1`,
      [refMerchantCode],
    );
  }

  /**
   * Count of merchants with the given ref code. Used by CT-02 and CT-04 to assert
   * that a blocked save persisted nothing (returns 0).
   */
  async countMerchantByRefCode(refMerchantCode: string): Promise<number> {
    return this.getSingleNumber(
      `SELECT COUNT(*) FROM uown_merchant WHERE ref_merchant_code = $1`,
      [refMerchantCode],
    );
  }

  // ── Index validation helpers ──────────────────────────────────────

  async indexExistsOnTable(indexName: string, tableName: string): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = $1 AND tablename = $2
      ) AS exists`,
      [indexName, tableName],
    );
    return row?.exists === true;
  }

  /** Returns simple column names for an index. Does NOT work for expression indexes — use getSingleString on pg_indexes.indexdef instead. */
  async getIndexColumns(indexName: string): Promise<string[]> {
    const rows = await this.query<{ attname: string }>(
      `SELECT a.attname
       FROM pg_index i
       JOIN pg_class c ON c.oid = i.indrelid
       JOIN pg_class idx ON idx.oid = i.indexrelid
       JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
       WHERE idx.relname = $1
       ORDER BY array_position(i.indkey, a.attnum)`,
      [indexName],
    );
    return rows.map(r => r.attname);
  }

  // ── Lead UUID helpers ──────────────────────────────────────────────

  async getLeadPkByUuid(leadUuid: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT pk FROM uown_los_lead WHERE uuid = $1',
      [leadUuid],
    );
  }

  async getLeadInternalStatus(leadPk: string): Promise<string | null> {
    return this.getSingleString(
      'SELECT internal_status FROM uown_los_lead WHERE pk = $1',
      [leadPk],
    );
  }

  // ── Account brand helper (task #518 — Finalize Purchase Email) ──────
  //
  // `uown_sv_account.company` stores the brand string ("UOWN", "KORNERSTONE",
  // possibly others). Used in brand-mismatch pre-condition checks per
  // ssn-test-catalog §7.2 — CT-02/CT-04 of task #518 assert the
  // Kornerstone-flavored template was queued for a KS-brand account.
  //
  // Single-shot read (no polling) — the account row exists by the time the
  // test reaches the brand-check assertion. Returns null when the account
  // does not exist or `company` is NULL.

  /**
   * Returns the `company` (brand) string from `uown_sv_account` for the
   * given account PK.
   *
   * @param accountPk Numeric or string PK of `uown_sv_account.pk`.
   * @returns `'UOWN' | 'KORNERSTONE' | string | null` — actual values are
   *          taken verbatim from the column; callers should compare against
   *          known brand constants (see SsnTestCatalog §7.2).
   */
  async getAccountCompanyByPk(
    accountPk: number | string,
  ): Promise<string | null> {
    return this.getSingleString(
      'SELECT company FROM uown_sv_account WHERE pk = $1',
      [accountPk],
    );
  }

  // ── Lead lookup by applicant email (task #518) ─────────────────────
  //
  // After the UI new-application wizard submits, the lead row is persisted
  // asynchronously (a few seconds). This helper polls until the lead↔email
  // pair appears, then returns the lead PK, account PK (if account row was
  // already created), and the `uuid` (application short-code).
  //
  // Schema notes (verified against docs/taskTestingUown/database-schema.md):
  //   - `uown_los_lead` has NO `email` column directly. The applicant email
  //     lives in `uown_los_email.email_address` keyed by `lead_pk`.
  //   - `uown_sv_account.lead_pk` is the FK back to the lead (1:1 in
  //     practice; the LEFT JOIN tolerates the gap between lead creation and
  //     account materialization).
  //   - "applicationShortCode" maps to `uown_los_lead.uuid` (the
  //     varchar(255) column used as the public-facing short code; the
  //     separate `uown_los_lead_short_code` table is a newer audit trail
  //     and not the wizard-time short code).

  /**
   * Resolves the lead just created via the UI new-application wizard from
   * the applicant's email address. Polls with exponential backoff (default
   * 30 s) because the lead row is persisted asynchronously after wizard
   * submit.
   *
   * @param email Applicant email used in the wizard (matched
   *              case-insensitively against `uown_los_email.email_address`).
   * @param opts.minCreatedAfter Optional defense-in-depth filter — only
   *              consider leads whose `row_created_timestamp` is `>=` this
   *              instant. Useful to avoid matching older runs that recycled
   *              the same email.
   * @param opts.timeoutMs Total polling budget (default 30_000 ms).
   * @returns `{ leadPk, accountPk, applicationShortCode }`.
   * @throws When no matching lead appears within the timeout.
   */
  async resolveLeadFromApplicantEmail(
    email: string,
    opts: { minCreatedAfter?: Date; timeoutMs?: number } = {},
  ): Promise<{
    leadPk: number;
    accountPk: number | null;
    applicationShortCode: string;
  }> {
    const { minCreatedAfter, timeoutMs = 30_000 } = opts;

    const params: unknown[] = [email];
    let timestampClause = '';
    if (minCreatedAfter) {
      params.push(minCreatedAfter.toISOString());
      timestampClause = 'AND l.row_created_timestamp >= $2';
    }

    const sql = `
      SELECT l.pk AS lead_pk,
             a.pk AS account_pk,
             l.uuid AS application_short_code
        FROM uown_los_lead l
        JOIN uown_los_email e ON e.lead_pk = l.pk
        LEFT JOIN uown_sv_account a ON a.lead_pk = l.pk
       WHERE UPPER(e.email_address) = UPPER($1)
         ${timestampClause}
       ORDER BY l.row_created_timestamp DESC NULLS LAST, l.pk DESC
       LIMIT 1
    `;

    const result = await this.pollUntil<{
      leadPk: number;
      accountPk: number | null;
      applicationShortCode: string;
    }>(
      async () => {
        const row = await this.queryOne<{
          lead_pk: number | string;
          account_pk: number | string | null;
          application_short_code: string | null;
        }>(sql, params);
        if (!row || row.application_short_code == null) return null;
        return {
          leadPk: Number(row.lead_pk),
          accountPk: row.account_pk != null ? Number(row.account_pk) : null,
          applicationShortCode: row.application_short_code,
        };
      },
      timeoutMs,
      'resolveLeadFromApplicantEmail',
    );

    if (!result) {
      throw new Error(
        `resolveLeadFromApplicantEmail: no lead found for email=${email} ` +
          `within ${timeoutMs}ms` +
          (minCreatedAfter
            ? ` (minCreatedAfter=${minCreatedAfter.toISOString()})`
            : ''),
      );
    }
    return result;
  }

  // ── NeuroID verification helpers ───────────────────────────────────

  async getNeuroIdVerification(leadPk: string | number): Promise<NeuroIdVerificationRow | null> {
    return this.queryOne<NeuroIdVerificationRow>(
      `SELECT pk, lead_pk, neuro_id_status, status, success, notes, error_message,
              caller, site_id, identity, row_created_timestamp, row_updated_timestamp
         FROM uown_neuro_id_verification
        WHERE lead_pk = $1
        ORDER BY pk DESC
        LIMIT 1`,
      [Number(leadPk)],
    );
  }

  async waitForNeuroIdRecord(
    leadPk: string | number,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<NeuroIdVerificationRow | null> {
    return this.pollUntil<NeuroIdVerificationRow>(
      async () => this.getNeuroIdVerification(leadPk),
      timeoutMs,
      'waitForNeuroIdRecord',
    );
  }

  /**
   * Count NeuroID verification rows for a lead (prevent repeated
   * NeuroID calls during signing retries).
   *
   * IMPLEMENTATION CHOICE — Option B (uown_neuro_id_verification by lead_pk).
   * Decided after the NeuroID discovery probe (src/scripts/probe-neuroid.ts,
   * run against qa2 2026-06-15):
   *   - `uown_sv_outbound_api_log` does have NeuroID rows
   *     (url ILIKE '%neuro%', e.g. https://api.neuro-id.com/v4.1/sites/.../profiles/{id}),
   *     BUT it has NO `lead_pk` / `service` column AND for every NeuroID row
   *     `account_pk`, `source_uuid` and `return_uuid` are all NULL. There is no
   *     reliable key to correlate those rows to a freshly created lead, so
   *     Option A from the SPEC is NOT viable.
   *   - `uown_neuro_id_verification` HAS `lead_pk` and one row is written per
   *     backend NeuroID verification attempt for the lead. This is the
   *     correlatable source of truth for "was NeuroID called again?".
   *
   * The NeuroID assertion model: a backend NeuroID call materializes a row here.
   * "No new NeuroID call on retry" ⇒ this COUNT does not increase between the
   * first submit and the post-retry observation.
   *
   * SELECT-only (CLAUDE.md Exception 3 respected).
   */
  async countNeuroIdCalls(leadPk: string | number): Promise<number> {
    return this.getSingleNumber(
      `SELECT COUNT(*) FROM uown_neuro_id_verification WHERE lead_pk = $1`,
      [Number(leadPk)],
    );
  }

  // ── Query plan helpers ─────────────────────────────────────────────

  async getTableRowEstimate(tableName: string): Promise<number> {
    const val = await this.getSingleString(
      `SELECT reltuples::bigint FROM pg_class WHERE relname = $1`,
      [tableName],
    );
    return val ? parseFloat(val) : 0;
  }

  async explainAnalyze(sql: string, params: unknown[] = []): Promise<string> {
    const rows = await this.query<{ 'QUERY PLAN': string }>(
      `EXPLAIN (ANALYZE, FORMAT TEXT) ${sql}`,
      params,
    );
    return rows.map(r => r['QUERY PLAN']).join('\n');
  }

  // ── Login attempt helpers (table: uown_login_attempt) ───────────────
  //
  // Source: SVC-460 perf optimization. The Website portal customer login
  // generates one row per OTP request. The exact query under audit is:
  //   SELECT * FROM uown_login_attempt
  //   WHERE UPPER(email_phone_input)=UPPER($1)
  //   ORDER BY row_created_timestamp DESC LIMIT $2
  // Index in qa2: idx_login_attempt_email_upper_created on
  //   (upper(email_phone_input), row_created_timestamp DESC).

  /** Latest login attempt row for an email or phone (mirrors the ticket query). */
  async getLatestLoginAttempt(emailOrPhone: string): Promise<LoginAttemptRow | null> {
    return this.queryOne<LoginAttemptRow>(
      `SELECT pk, email_phone_input, code, given_codes, number_of_attempts,
              sms_id, account_found, account_pks, expiration_time, sent_time,
              row_created_timestamp
       FROM uown_login_attempt
       WHERE UPPER(email_phone_input) = UPPER($1)
       ORDER BY row_created_timestamp DESC
       LIMIT 1`,
      [emailOrPhone],
    );
  }

  /**
   * Snapshot the highest existing PK for an email/phone — call BEFORE the action
   * that triggers a new OTP, then pass to waitForFreshOtpCode. Pk-based watermark
   * avoids timezone pitfalls (the app inserts row_created_timestamp in a non-UTC
   * tz while pg session reads as GMT, which breaks naive timestamp comparisons).
   */
  async getMaxLoginAttemptPk(emailOrPhone: string): Promise<bigint> {
    const val = await this.getSingleString(
      `SELECT COALESCE(MAX(pk), 0)::text
       FROM uown_login_attempt
       WHERE UPPER(email_phone_input) = UPPER($1)`,
      [emailOrPhone],
    );
    return BigInt(val ?? '0');
  }

  /**
   * Wait for a fresh OTP code to land in uown_login_attempt for a given
   * email/phone. "Fresh" = pk > sincePk.
   * Returns the row when found, or null on timeout.
   */
  async waitForFreshOtpCode(
    emailOrPhone: string,
    sincePk: bigint,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<LoginAttemptRow | null> {
    return this.pollUntil<LoginAttemptRow>(
      async () => {
        const row = await this.queryOne<LoginAttemptRow>(
          `SELECT pk, email_phone_input, code, given_codes, number_of_attempts,
                  sms_id, account_found, account_pks, expiration_time, sent_time,
                  row_created_timestamp
           FROM uown_login_attempt
           WHERE UPPER(email_phone_input) = UPPER($1)
             AND pk > $2
           ORDER BY pk DESC
           LIMIT 1`,
          [emailOrPhone, sincePk.toString()],
        );
        return row && row.code ? row : null;
      },
      timeoutMs,
      'waitForFreshOtpCode',
    );
  }

  /** Run EXPLAIN (ANALYZE, BUFFERS) on the ticket query for a given input. */
  async explainLoginAttemptQuery(emailOrPhone: string): Promise<string> {
    const rows = await this.query<{ 'QUERY PLAN': string }>(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
       SELECT * FROM public.uown_login_attempt
       WHERE UPPER(email_phone_input) = UPPER($1)
       ORDER BY row_created_timestamp DESC
       LIMIT $2`,
      [emailOrPhone, 1],
    );
    return rows.map(r => r['QUERY PLAN']).join('\n');
  }

  /** Confirms the qa2 optimization index exists. */
  async loginAttemptUpperIndexExists(): Promise<boolean> {
    const row = await this.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'uown_login_attempt'
          AND indexname = 'idx_login_attempt_email_upper_created'
      ) AS exists`,
    );
    return row?.exists === true;
  }

  // ── Customer-portal login activity logs (table: uown_sv_activity_log) ──
  //
  // Generated when a Website customer requests/uses an OTP code:
  //   - 'CORRESPONDENCE' / created_by='SYSTEM'        → "Created VerificationCode to be sent as EMAIL"
  //   - 'CORRESPONDENCE' / created_by='SYSTEM'        → "Sent VerificationCode. Subject : ... To : <email>"
  //   - 'CORRESPONDENCE' / created_by='customer portal' → "LOGIN ATTEMPT: Verification Code Sent to <phone>"  (SMS path)
  //   - 'INTERNAL'       / created_by='customer portal' → "Login Success using code <6digits> at <ts>; Attempt <N>."
  //
  // Wrong-code attempts do NOT generate any log (current product behavior).

  /**
   * Snapshot the highest activity-log PK for an account — call BEFORE the action,
   * then pass the value to getLoginActivityLogs / waitForLoginSuccessLog.
   * Pk-based watermark avoids the timezone mismatch documented above.
   */
  async getMaxActivityLogPk(accountPk: string | number): Promise<bigint> {
    const val = await this.getSingleString(
      `SELECT COALESCE(MAX(pk), 0)::text
       FROM uown_sv_activity_log
       WHERE account_pk = $1`,
      [accountPk],
    );
    return BigInt(val ?? '0');
  }

  /**
   * All login-related logs for an account with pk greater than the given watermark.
   *
   * Backends emit slightly different copy across envs — qa2 uses 'VerificationCode'
   * (single word), qa1 uses 'Verification Code' (with space). The filter accepts
   * both via LIKE '%verification%code%' (case-insensitive).
   */
  async getLoginActivityLogs(
    accountPk: string | number,
    sincePk: bigint,
  ): Promise<LoginActivityLogRow[]> {
    return this.query<LoginActivityLogRow>(
      `SELECT pk, log_type, created_by, agent, notes, row_created_timestamp
       FROM uown_sv_activity_log
       WHERE account_pk = $1
         AND pk > $2
         AND (
           (log_type = 'CORRESPONDENCE' AND (
             LOWER(notes) LIKE '%verification%code%' OR notes LIKE '%LOGIN ATTEMPT:%'
           ))
           OR (log_type = 'INTERNAL' AND notes LIKE 'Login Success using code%')
         )
       ORDER BY pk ASC`,
      [accountPk, sincePk.toString()],
    );
  }

  /**
   * Poll until a login-flow activity log matching `predicate` shows up.
   * Returns the matched row or null on timeout.
   */
  async waitForLoginActivityLog(
    accountPk: string | number,
    sincePk: bigint,
    predicate: (row: LoginActivityLogRow) => boolean,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<LoginActivityLogRow | null> {
    return this.pollUntil<LoginActivityLogRow>(
      async () => {
        const logs = await this.getLoginActivityLogs(accountPk, sincePk);
        return logs.find(predicate) ?? null;
      },
      timeoutMs,
      'waitForLoginActivityLog',
    );
  }

  /** Wait for the "Login Success" log to appear after a successful OTP entry. */
  async waitForLoginSuccessLog(
    accountPk: string | number,
    sincePk: bigint,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<LoginActivityLogRow | null> {
    return this.pollUntil<LoginActivityLogRow>(
      async () => {
        return this.queryOne<LoginActivityLogRow>(
          `SELECT pk, log_type, created_by, agent, notes, row_created_timestamp
           FROM uown_sv_activity_log
           WHERE account_pk = $1
             AND pk > $2
             AND log_type = 'INTERNAL'
             AND notes LIKE 'Login Success using code%'
           ORDER BY pk DESC
           LIMIT 1`,
          [accountPk, sincePk.toString()],
        );
      },
      timeoutMs,
      'waitForLoginSuccessLog',
    );
  }

  // ── Merchant program (scheduleProgramActivationDeactivationDates) ────
  //
  // Source-of-truth rule: `is_active` is derived from the sweep
  // (`MerchantProgramActivationDeactivationSweepService`) which reconciles
  // the flag from activation_date / deactivation_date vs CURRENT_DATE.
  // Until the sweep runs, a freshly edited program may have stale is_active —
  // prefer the computed predicate when asserting "active today".
  //
  // Backend native SQL (ProgramActivationUtils#isActiveOnDate):
  //   (activation_date   IS NULL OR activation_date   <= CURRENT_DATE)
  //   AND
  //   (deactivation_date IS NULL OR deactivation_date >= CURRENT_DATE)

  private static mapMerchantProgramRow(row: MerchantProgramRow): MerchantProgramRecord {
    const toIsoDate = (v: Date | string | null): string | null => {
      if (v == null) return null;
      if (v instanceof Date) return v.toISOString().slice(0, 10);
      // pg may return DATE as 'YYYY-MM-DD' string under some drivers
      return String(v).slice(0, 10);
    };
    return {
      pk: Number(row.pk),
      programName: row.program_name,
      programId: row.program_id,
      termMonths: Number(row.term_months),
      activationDate: toIsoDate(row.activation_date),
      deactivationDate: toIsoDate(row.deactivation_date),
      isActive: row.is_active === true,
      groupName: row.group_name,
      rowCreatedTimestamp: row.row_created_timestamp,
      rowUpdatedTimestamp: row.row_updated_timestamp,
    };
  }

  /**
   * All programs assigned to a merchant via active junction rows in
   * `uown_merchant_to_program` (mirrors `MerchantProgramRepo#findByMerchantPk`).
   * Only programs where the junction row is_active = true are returned; the
   * returned `isActive` reflects the PROGRAM flag, not the junction flag.
   */
  async getMerchantPrograms(merchantPk: number | string): Promise<MerchantProgramRecord[]> {
    const rows = await this.query<MerchantProgramRow>(
      `SELECT mp.pk, mp.program_name, mp.program_id, mp.term_months,
              mp.activation_date, mp.deactivation_date, mp.is_active,
              mp.group_name, mp.row_created_timestamp, mp.row_updated_timestamp
         FROM uown_merchant_program mp
         JOIN uown_merchant_to_program mtp
           ON mtp.program_pk = mp.pk AND mtp.is_active = true
         WHERE mtp.merchant_pk = $1
         ORDER BY mp.row_created_timestamp DESC`,
      [merchantPk],
    );
    return rows.map(DatabaseHelpers.mapMerchantProgramRow);
  }

  /** Single program by pk. */
  async getMerchantProgramByPk(pk: number | string): Promise<MerchantProgramRecord | null> {
    const row = await this.queryOne<MerchantProgramRow>(
      `SELECT pk, program_name, program_id, term_months,
              activation_date, deactivation_date, is_active,
              group_name, row_created_timestamp, row_updated_timestamp
         FROM uown_merchant_program
         WHERE pk = $1`,
      [pk],
    );
    return row ? DatabaseHelpers.mapMerchantProgramRow(row) : null;
  }

  /**
   * Programs active TODAY for a merchant — evaluates the same predicate as
   * `ProgramActivationUtils#isActiveOnDate`, independent of the stale
   * persisted flag. Use this for assertions that must not depend on the
   * nightly sweep having run.
   */
  async getActiveMerchantPrograms(merchantPk: number | string): Promise<MerchantProgramRecord[]> {
    const rows = await this.query<MerchantProgramRow>(
      `SELECT mp.pk, mp.program_name, mp.program_id, mp.term_months,
              mp.activation_date, mp.deactivation_date, mp.is_active,
              mp.group_name, mp.row_created_timestamp, mp.row_updated_timestamp
         FROM uown_merchant_program mp
         JOIN uown_merchant_to_program mtp
           ON mtp.program_pk = mp.pk AND mtp.is_active = true
         WHERE mtp.merchant_pk = $1
           AND (mp.activation_date   IS NULL OR mp.activation_date   <= CURRENT_DATE)
           AND (mp.deactivation_date IS NULL OR mp.deactivation_date >= CURRENT_DATE)
         ORDER BY mp.row_created_timestamp DESC`,
      [merchantPk],
    );
    return rows.map(DatabaseHelpers.mapMerchantProgramRow);
  }

  /** Programs filtered by term_months (useful to isolate 13m vs 16m in CT-DateSelect-*). */
  async getMerchantProgramsByTerm(
    merchantPk: number | string,
    termMonths: number,
  ): Promise<MerchantProgramRecord[]> {
    const rows = await this.query<MerchantProgramRow>(
      `SELECT mp.pk, mp.program_name, mp.program_id, mp.term_months,
              mp.activation_date, mp.deactivation_date, mp.is_active,
              mp.group_name, mp.row_created_timestamp, mp.row_updated_timestamp
         FROM uown_merchant_program mp
         JOIN uown_merchant_to_program mtp
           ON mtp.program_pk = mp.pk AND mtp.is_active = true
         WHERE mtp.merchant_pk = $1
           AND mp.term_months = $2
         ORDER BY mp.row_created_timestamp DESC`,
      [merchantPk, termMonths],
    );
    return rows.map(DatabaseHelpers.mapMerchantProgramRow);
  }

  /**
   * Polls until `uown_merchant_program.is_active` for the given pk matches
   * `expectedActive`. Use after triggering the sweep via
   * `scheduledTask.triggerScheduledTask('merchantProgramActivationDeactivationSweep')`.
   *
   * Uses exponential backoff via the shared `pollUntil` (initial 100 ms →
   * max 2 000 ms, governed by TIMEOUTS.DB_POLL_* — matching every other
   * waitFor* in this helper).
   */
  async waitForProgramActiveState(
    pk: number | string,
    expectedActive: boolean,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
  ): Promise<MerchantProgramRecord> {
    const result = await this.pollUntil<MerchantProgramRecord>(
      async () => {
        const p = await this.getMerchantProgramByPk(pk);
        return p && p.isActive === expectedActive ? p : null;
      },
      timeoutMs,
      'waitForProgramActiveState',
    );
    if (!result) {
      throw new Error(
        `[waitForProgramActiveState] program pk=${pk} did not reach is_active=${expectedActive} within ${timeoutMs} ms`,
      );
    }
    return result;
  }

  /**
   * Captures the mutable state of a program for later restoration in `afterEach`.
   * Read-only — no authorization required.
   */
  async snapshotMerchantProgram(pk: number | string): Promise<MerchantProgramSnapshot> {
    const p = await this.getMerchantProgramByPk(pk);
    if (!p) throw new Error(`[snapshotMerchantProgram] no program with pk=${pk}`);
    return {
      activationDate: p.activationDate,
      deactivationDate: p.deactivationDate,
      isActive: p.isActive,
    };
  }

  /**
   * DIRECT UPDATE on `uown_merchant_program` — authorized by user on
   * 2026-04-22 (see scheduleProgramActivationDeactivationDates-spec.md
   * §Preconditions · "DB UPDATE direto autorizado"). Used exclusively
   * by CT-18..CT-25 / CT-DateSelect-* to set up boundary conditions that
   * the UI cannot produce (e.g. deactivation_date = yesterday).
   *
   * The caller MUST pass an `authorizedBy` string naming the authorization
   * record (e.g. 'user-authorization-2026-04-22'). Any other call site
   * should use `MerchantClient.createOrUpdateProgram` instead.
   *
   * @throws if `authorizedBy` is empty — prevents accidental mutation.
   */
  async updateMerchantProgramDates(
    pk: number | string,
    dates: { activationDate?: string | null; deactivationDate?: string | null; isActive?: boolean },
    authorizedBy: string,
  ): Promise<void> {
    if (!authorizedBy || !authorizedBy.trim()) {
      throw new Error(
        '[updateMerchantProgramDates] authorizedBy is required — direct UPDATE on uown_merchant_program needs explicit user authorization (see CLAUDE.md Exception 3).',
      );
    }
    const sets: string[] = [];
    const params: unknown[] = [];
    if (Object.prototype.hasOwnProperty.call(dates, 'activationDate')) {
      params.push(dates.activationDate ?? null);
      sets.push(`activation_date = $${params.length}::date`);
    }
    if (Object.prototype.hasOwnProperty.call(dates, 'deactivationDate')) {
      params.push(dates.deactivationDate ?? null);
      sets.push(`deactivation_date = $${params.length}::date`);
    }
    if (Object.prototype.hasOwnProperty.call(dates, 'isActive')) {
      params.push(dates.isActive);
      sets.push(`is_active = $${params.length}::boolean`);
    }
    if (sets.length === 0) return;
    sets.push('row_updated_timestamp = NOW()');
    params.push(pk);
    const sql = `UPDATE uown_merchant_program SET ${sets.join(', ')} WHERE pk = $${params.length}`;
    console.warn(
      `[updateMerchantProgramDates] AUTHORIZED DB MUTATION — pk=${pk} authorizedBy=${authorizedBy} dates=${JSON.stringify(dates)}`,
    );
    await this.executeUpdate(sql, params);
  }

  /**
   * Restores a program to a previously captured snapshot. Also authorized
   * under the same 2026-04-22 umbrella — used from `afterEach` of sweep CTs.
   * Restores `is_active` directly (NOT relying on the sweep to reconcile).
   */
  async restoreMerchantProgram(
    pk: number | string,
    snapshot: MerchantProgramSnapshot,
    authorizedBy: string,
  ): Promise<void> {
    if (!authorizedBy || !authorizedBy.trim()) {
      throw new Error(
        '[restoreMerchantProgram] authorizedBy is required — direct UPDATE on uown_merchant_program needs explicit user authorization (see CLAUDE.md Exception 3).',
      );
    }
    console.warn(
      `[restoreMerchantProgram] AUTHORIZED DB MUTATION — pk=${pk} authorizedBy=${authorizedBy} snapshot=${JSON.stringify(snapshot)}`,
    );
    await this.executeUpdate(
      `UPDATE uown_merchant_program
          SET activation_date   = $1::date,
              deactivation_date = $2::date,
              is_active         = $3,
              row_updated_timestamp = NOW()
        WHERE pk = $4`,
      [snapshot.activationDate, snapshot.deactivationDate, snapshot.isActive, pk],
    );
  }

  // ── Program activity log (PROGRAM_DATA_CHANGE) ───────────────────────
  //
  // Table `"MerchantActivityLog"` (quoted, PascalCase). Hibernate snake-case
  // maps the camelCase fields `merchantPK` / `programPK` to columns
  // `merchant_pk` / `program_pk` (matches existing getMerchantActivityLog
  // in this helper). `notes`, `log_type`, `created_by` come from the embedded
  // ActivityLogInfo.

  /**
   * Logs of `PROGRAM_DATA_CHANGE` (or any filtered subset) for a program.
   * Emitted by MerchantProgramService (on program create/update) and by
   * MerchantProgramActivationDeactivationSweepService (on flag flip).
   *
   * `sinceTimestamp` accepts ISO string or epoch ms — useful to scope to
   * "logs created after my test started" and avoid flakiness from prior runs.
   */
  async getProgramActivityLogs(
    programPk: number | string,
    options: { sinceTimestamp?: string | Date; logTypes?: string[] } = {},
  ): Promise<ProgramActivityLogRecord[]> {
    const params: unknown[] = [programPk];
    const where: string[] = ['program_pk = $1'];
    const logTypes = options.logTypes && options.logTypes.length > 0
      ? options.logTypes
      : ['PROGRAM_DATA_CHANGE'];
    params.push(logTypes);
    where.push(`log_type = ANY($${params.length}::text[])`);
    if (options.sinceTimestamp !== undefined) {
      params.push(options.sinceTimestamp);
      where.push(`row_created_timestamp >= $${params.length}`);
    }
    return this.query<ProgramActivityLogRecord>(
      `SELECT pk, program_pk, merchant_pk, log_type, created_by, notes,
              row_created_timestamp
         FROM uown_merchant_activity_log
         WHERE ${where.join(' AND ')}
         ORDER BY row_created_timestamp DESC, pk DESC`,
      params,
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // Delega ao pollUntil compartilhado (common.helpers) — preserva os call sites `this.pollUntil`.
  private async pollUntil<T>(
    check: () => Promise<T | null>,
    timeoutMs: number = TIMEOUTS.DB_WAIT,
    logPrefix: string = 'poll',
  ): Promise<T | null> {
    return pollUntilShared(check, { timeoutMs, logPrefix });
  }

  private formatDbError(operation: string, sql: string, params: unknown[], error: Error): string {
    return `Database ${operation} failed: ${error.message}\nSQL: ${sql}\nParams: ${JSON.stringify(params)}`;
  }
}

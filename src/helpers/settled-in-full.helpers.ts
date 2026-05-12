/**
 * Helpers for SPEC RU04.26.1.51.0 — Settled In Full email template (task #491).
 *
 * Read-only helpers (SELECT only) against qa2 DB. Cover eligibility lookup,
 * email_queue inspection, correspondence_logs inspection, and polling with
 * exponential backoff for async sweep verification.
 *
 * Column mapping notes (verified against docs/taskTestingUown/database-schema.md):
 *   uown_email_queue:
 *     - to_email        → column `to_email_addresses`
 *     - body            → column `email_body`
 *     - subject         → column `subject`
 *     - createdAt       → column `row_created_timestamp`
 *   uown_correspondence_logs (NOT `correspondence_logs`):
 *     - createdAt       → column `row_created_timestamp`
 *     - updatedAt       → column `row_updated_timestamp`
 *     - recipient/status are NOT columns of uown_correspondence_logs; they
 *       are derived via a LEFT JOIN against uown_email_queue matched on
 *       (account_pk, template_name) and closest row_created_timestamp.
 *   uown_sv_account:
 *     - company column IS present (character varying, stores 'UOWN'/'KORNERSTONE')
 *     - settled_in_full_date_time is `timestamp without time zone`
 */

import { TIMEOUTS } from '../config/constants.js';
import { sleep } from './common.helpers.js';
import type { DatabaseHelpers } from './database.helpers.js';

// ── Types ─────────────────────────────────────────────────────────────

export interface EligibleAccount {
  accountPk: number;
  customerPk: number;
  firstName: string;
  lastName: string;
  accountStatus: string;
  rating: string | null;
  company: 'UOWN' | 'KORNERSTONE';
  settledInFullDateTime: Date | null;
}

export interface EmailQueueRow {
  pk: number;
  accountPk: number | null;
  customerPk: number | null;
  leadPk: number | null;
  merchantPk: number | null;
  toEmail: string;
  fromEmailAddress: string | null;
  fromEmailName: string | null;
  subject: string | null;
  body: string | null;
  bodyType: string | null;
  templateName: string | null;
  templateVersion: number | null;
  status: string | null;
  queueType: string | null;
  priority: number | null;
  sentTime: Date | null;
  pickedAtTime: Date | null;
  sendByTime: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
  dataMap: string | null;
  errorDesc: string | null;
  response: string | null;
  sentFromServer: string | null;
  createdBy: string | null;
  location: string | null;
  hasAttachments: boolean | null;
  id: string | null;
}

/**
 * Row from `uown_correspondence_logs` (NB: prefixed `uown_`). Native columns
 * are `row_created_timestamp` / `row_updated_timestamp`; `recipient` and
 * `status` are not native — they are joined from `uown_email_queue` when
 * available. If no matching queue row is found, they are null.
 */
export interface CorrespondenceLogRow {
  pk: number;
  accountPk: number;
  leadPk: number | null;
  templateName: string;
  correspondenceType: string | null;
  source: number | null;
  error: string | null;
  dataMap: string | null;
  agent: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  // Derived via LEFT JOIN uown_email_queue on (account_pk, template_name)
  recipient: string | null;
  status: string | null;
}

// ── Internal raw row shapes ───────────────────────────────────────────

interface EligibleAccountRaw {
  account_pk: string | number;
  account_status: string;
  rating: string | null;
  settled_in_full_date_time: Date | string | null;
  company: string;
  customer_pk: string | number;
  first_name: string;
  last_name: string;
}

interface EmailQueueRaw {
  pk: string | number;
  account_pk: string | number | null;
  customer_pk: string | number | null;
  lead_pk: string | number | null;
  merchant_pk: string | number | null;
  to_email_addresses: string;
  from_email_address: string | null;
  from_email_name: string | null;
  subject: string | null;
  email_body: string | null;
  email_body_type: string | null;
  template_name: string | null;
  template_version: string | number | null;
  status: string | null;
  queue_type: string | null;
  priority: number | null;
  sent_time: Date | string | null;
  picked_at_time: Date | string | null;
  send_by_time: Date | string | null;
  row_created_timestamp: Date | string;
  row_updated_timestamp: Date | string | null;
  data_map: string | null;
  error_desc: string | null;
  response: string | null;
  sent_from_server: string | null;
  created_by: string | null;
  location: string | null;
  has_attachments: boolean | null;
  id: string | null;
}

interface CorrespondenceLogRaw {
  pk: string | number;
  account_pk: string | number;
  lead_pk: string | number | null;
  template_name: string;
  correspondence_type: string | null;
  source: number | null;
  error: string | null;
  data_map: string | null;
  agent: string | null;
  row_created_timestamp: Date | string;
  row_updated_timestamp: Date | string | null;
  recipient: string | null;
  status: string | null;
}

// ── Mapping utilities ─────────────────────────────────────────────────

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value);
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : Number(value);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value : new Date(value);
}

function mapEligibleAccount(row: EligibleAccountRaw): EligibleAccount {
  const company = row.company as 'UOWN' | 'KORNERSTONE';
  return {
    accountPk: toNumber(row.account_pk),
    customerPk: toNumber(row.customer_pk),
    firstName: row.first_name,
    lastName: row.last_name,
    accountStatus: row.account_status,
    rating: row.rating,
    company,
    settledInFullDateTime: toDate(row.settled_in_full_date_time),
  };
}

function mapEmailQueue(row: EmailQueueRaw): EmailQueueRow {
  return {
    pk: toNumber(row.pk),
    accountPk: toNullableNumber(row.account_pk),
    customerPk: toNullableNumber(row.customer_pk),
    leadPk: toNullableNumber(row.lead_pk),
    merchantPk: toNullableNumber(row.merchant_pk),
    toEmail: row.to_email_addresses,
    fromEmailAddress: row.from_email_address,
    fromEmailName: row.from_email_name,
    subject: row.subject,
    body: row.email_body,
    bodyType: row.email_body_type,
    templateName: row.template_name,
    templateVersion: toNullableNumber(row.template_version),
    status: row.status,
    queueType: row.queue_type,
    priority: row.priority,
    sentTime: toDate(row.sent_time),
    pickedAtTime: toDate(row.picked_at_time),
    sendByTime: toDate(row.send_by_time),
    createdAt: toDate(row.row_created_timestamp) ?? new Date(0),
    updatedAt: toDate(row.row_updated_timestamp),
    dataMap: row.data_map,
    errorDesc: row.error_desc,
    response: row.response,
    sentFromServer: row.sent_from_server,
    createdBy: row.created_by,
    location: row.location,
    hasAttachments: row.has_attachments,
    id: row.id,
  };
}

function mapCorrespondenceLog(row: CorrespondenceLogRaw): CorrespondenceLogRow {
  return {
    pk: toNumber(row.pk),
    accountPk: toNumber(row.account_pk),
    leadPk: toNullableNumber(row.lead_pk),
    templateName: row.template_name,
    correspondenceType: row.correspondence_type,
    source: row.source,
    error: row.error,
    dataMap: row.data_map,
    agent: row.agent,
    createdAt: toDate(row.row_created_timestamp) ?? new Date(0),
    updatedAt: toDate(row.row_updated_timestamp),
    recipient: row.recipient,
    status: row.status,
  };
}

// ── Polling helper ────────────────────────────────────────────────────

/**
 * Poll `check` with exponential backoff until it yields a non-null value or
 * `timeoutMs` elapses. Mirrors the private pollUntil pattern in
 * `DatabaseHelpers` (initial 100ms, x1.5 backoff, capped at 2s). Returns null
 * on timeout rather than throwing — callers decide whether to skip or fail.
 */
async function pollUntil<T>(
  check: () => Promise<T | null>,
  timeoutMs: number,
  logPrefix: string,
): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;
  let interval: number = TIMEOUTS.DB_POLL_INITIAL;
  while (Date.now() < deadline) {
    try {
      const result = await check();
      if (result !== null && result !== undefined) return result;
    } catch (error) {
      // reason: mirror DatabaseHelpers.pollUntil — log and retry on transient DB errors
      console.warn(`[${logPrefix}] poll error: ${(error as Error).message}`);
    }
    await sleep(interval);
    interval = Math.min(interval * TIMEOUTS.DB_POLL_BACKOFF, TIMEOUTS.DB_POLL_MAX);
  }
  return null;
}

// ── Eligibility lookups ───────────────────────────────────────────────

/**
 * Returns the most recent SETTLED_IN_FULL account eligible for the sweep in
 * the current day-of-week window (Mon/Tue: <=4d, Wed: 2-4d, Thu/Fri: <=2d).
 * Filters out rating E/F/U. Returns null on weekends or when no match.
 *
 * @param company  'UOWN' or 'KORNERSTONE'
 * @param opts.excludePks  optional account PKs to skip (reuse across CTs)
 */
export async function findEligibleSettledInFullAccount(
  db: DatabaseHelpers,
  company: 'UOWN' | 'KORNERSTONE',
  opts?: { excludePks?: number[] },
): Promise<EligibleAccount | null> {
  const excludePks = opts?.excludePks ?? null;
  const row = await db.queryOne<EligibleAccountRaw>(
    `SELECT a.pk              AS account_pk,
            a.account_status,
            a.rating,
            a.settled_in_full_date_time,
            a.company,
            c.pk              AS customer_pk,
            c.first_name,
            c.last_name
       FROM uown_sv_account a
       JOIN uown_sv_customer c ON c.account_pk = a.pk
      WHERE a.account_status = 'SETTLED_IN_FULL'
        AND a.settled_in_full_date_time IS NOT NULL
        AND (a.rating NOT IN ('E','F','U') OR a.rating IS NULL)
        AND a.company = $1
        AND (CASE
               WHEN extract(DOW FROM CURRENT_DATE) IN (1, 2) THEN a.settled_in_full_date_time::date = CURRENT_DATE - 4
               WHEN extract(DOW FROM CURRENT_DATE) = 3       THEN a.settled_in_full_date_time::date IN (CURRENT_DATE - 4, CURRENT_DATE - 3, CURRENT_DATE - 2)
               ELSE                                                a.settled_in_full_date_time::date = CURRENT_DATE - 2
             END)
        AND ($2::bigint[] IS NULL OR NOT (a.pk = ANY($2::bigint[])))
      ORDER BY a.settled_in_full_date_time DESC
      LIMIT 1`,
    [company, excludePks],
  );
  return row ? mapEligibleAccount(row) : null;
}

/**
 * Finds a SETTLED_IN_FULL account with the given ineligible rating (E/F/U)
 * whose settlement date still falls inside a 4-day window. Used by CT-04
 * to verify the sweep skips rating-E/F/U accounts.
 */
export async function findIneligibleSettledInFullAccount(
  db: DatabaseHelpers,
  rating: 'E' | 'F' | 'U',
): Promise<EligibleAccount | null> {
  const row = await db.queryOne<EligibleAccountRaw>(
    `SELECT a.pk              AS account_pk,
            a.account_status,
            a.rating,
            a.settled_in_full_date_time,
            a.company,
            c.pk              AS customer_pk,
            c.first_name,
            c.last_name
       FROM uown_sv_account a
       JOIN uown_sv_customer c ON c.account_pk = a.pk
      WHERE a.account_status = 'SETTLED_IN_FULL'
        AND a.rating = $1
        AND a.settled_in_full_date_time IS NOT NULL
        AND (CASE
               WHEN extract(DOW FROM CURRENT_DATE) IN (1, 2) THEN a.settled_in_full_date_time::date = CURRENT_DATE - 4
               WHEN extract(DOW FROM CURRENT_DATE) = 3       THEN a.settled_in_full_date_time::date IN (CURRENT_DATE - 4, CURRENT_DATE - 3, CURRENT_DATE - 2)
               ELSE                                                a.settled_in_full_date_time::date = CURRENT_DATE - 2
             END)
      ORDER BY a.settled_in_full_date_time DESC
      LIMIT 1`,
    [rating],
  );
  return row ? mapEligibleAccount(row) : null;
}

// ── Email queue inspection ────────────────────────────────────────────

/**
 * Returns the most recent uown_email_queue row for a given (toEmail, accountPk).
 * If `templateHint` is provided, filters by `template_name ILIKE '%hint%'`.
 */
export async function getEmailQueueRecord(
  db: DatabaseHelpers,
  toEmail: string,
  accountPk: number,
  templateHint?: string,
): Promise<EmailQueueRow | null> {
  const row = templateHint
    ? await db.queryOne<EmailQueueRaw>(
        `SELECT pk, account_pk, customer_pk, lead_pk, merchant_pk,
                to_email_addresses, from_email_address, from_email_name,
                subject, email_body, email_body_type,
                template_name, template_version, status, queue_type, priority,
                sent_time, picked_at_time, send_by_time,
                row_created_timestamp, row_updated_timestamp,
                data_map, error_desc, response, sent_from_server,
                created_by, location, has_attachments, id
           FROM uown_email_queue
          WHERE to_email_addresses = $1
            AND account_pk = $2
            AND template_name ILIKE '%' || $3 || '%'
          ORDER BY row_created_timestamp DESC
          LIMIT 1`,
        [toEmail, accountPk, templateHint],
      )
    : await db.queryOne<EmailQueueRaw>(
        `SELECT pk, account_pk, customer_pk, lead_pk, merchant_pk,
                to_email_addresses, from_email_address, from_email_name,
                subject, email_body, email_body_type,
                template_name, template_version, status, queue_type, priority,
                sent_time, picked_at_time, send_by_time,
                row_created_timestamp, row_updated_timestamp,
                data_map, error_desc, response, sent_from_server,
                created_by, location, has_attachments, id
           FROM uown_email_queue
          WHERE to_email_addresses = $1
            AND account_pk = $2
          ORDER BY row_created_timestamp DESC
          LIMIT 1`,
        [toEmail, accountPk],
      );
  return row ? mapEmailQueue(row) : null;
}

/**
 * Polls uown_email_queue until a matching row appears or timeoutMs elapses.
 * Uses exponential backoff (100ms → 2s). Returns null on timeout.
 */
export async function waitForEmailQueueRecord(
  db: DatabaseHelpers,
  toEmail: string,
  accountPk: number,
  templateHint: string,
  timeoutMs: number,
): Promise<EmailQueueRow | null> {
  return pollUntil<EmailQueueRow>(
    () => getEmailQueueRecord(db, toEmail, accountPk, templateHint),
    timeoutMs,
    'waitForEmailQueueRecord',
  );
}

/**
 * Polls a previously-enqueued email queue row by primary key until it has
 * been dispatched (sent_time IS NOT NULL). The status terminology in qa2 is
 * `STORED` for delivered rows (verified via probe), with `SENT` also seen.
 * Returns the dispatched row, or null on timeout.
 *
 * Pipeline note: emailSweep is the worker that picks up PENDING rows and
 * pushes them to SendGrid; only after that does sent_time get populated and
 * the email actually reach the inbox. Use this AFTER triggering emailSweep.
 */
export async function waitForEmailQueueDispatched(
  db: DatabaseHelpers,
  queuePk: number,
  timeoutMs: number,
): Promise<EmailQueueRow | null> {
  return pollUntil<EmailQueueRow>(
    async () => {
      const row = await db.queryOne<EmailQueueRaw>(
        `SELECT pk, account_pk, customer_pk, lead_pk, merchant_pk,
                to_email_addresses, from_email_address, from_email_name,
                subject, email_body, email_body_type,
                template_name, template_version, status, queue_type, priority,
                sent_time, picked_at_time, send_by_time,
                row_created_timestamp, row_updated_timestamp,
                data_map, error_desc, response, sent_from_server,
                created_by, location, has_attachments, id
           FROM uown_email_queue
          WHERE pk = $1
            AND sent_time IS NOT NULL`,
        [queuePk],
      );
      return row ? mapEmailQueue(row) : null;
    },
    timeoutMs,
    'waitForEmailQueueDispatched',
  );
}

/**
 * Count uown_email_queue rows for an account, optionally created after
 * `sinceTimestamp`. Used for baseline snapshots (CT-01/02 step 5, CT-04 step 3).
 */
export async function countEmailQueueRows(
  db: DatabaseHelpers,
  accountPk: number,
  sinceTimestamp?: Date,
): Promise<number> {
  if (sinceTimestamp) {
    return db.getSingleNumber(
      `SELECT COUNT(*) FROM uown_email_queue
        WHERE account_pk = $1
          AND row_created_timestamp > $2`,
      [accountPk, sinceTimestamp],
    );
  }
  return db.getSingleNumber(
    `SELECT COUNT(*) FROM uown_email_queue WHERE account_pk = $1`,
    [accountPk],
  );
}

// ── Correspondence log inspection ─────────────────────────────────────

const CORRESPONDENCE_LOG_SELECT = `
  SELECT cl.pk,
         cl.account_pk,
         cl.lead_pk,
         cl.template_name,
         cl.correspondence_type,
         cl.source,
         cl.error,
         cl.data_map,
         cl.agent,
         cl.row_created_timestamp,
         cl.row_updated_timestamp,
         eq.to_email_addresses AS recipient,
         eq.status             AS status
    FROM uown_correspondence_logs cl
    LEFT JOIN LATERAL (
      SELECT to_email_addresses, status
        FROM uown_email_queue
       WHERE account_pk = cl.account_pk
         AND template_name = cl.template_name
       ORDER BY ABS(EXTRACT(EPOCH FROM (row_created_timestamp - cl.row_created_timestamp))) ASC
       LIMIT 1
    ) eq ON TRUE
`;

/**
 * Returns the most recent uown_correspondence_logs row for an account.
 * Recipient/status are derived via LEFT JOIN LATERAL on uown_email_queue
 * matching account_pk + template_name (closest-in-time row).
 */
export async function getCorrespondenceLog(
  db: DatabaseHelpers,
  accountPk: number,
  templateName?: string,
): Promise<CorrespondenceLogRow | null> {
  const row = templateName
    ? await db.queryOne<CorrespondenceLogRaw>(
        `${CORRESPONDENCE_LOG_SELECT}
          WHERE cl.account_pk = $1
            AND cl.template_name = $2
          ORDER BY cl.row_created_timestamp DESC
          LIMIT 1`,
        [accountPk, templateName],
      )
    : await db.queryOne<CorrespondenceLogRaw>(
        `${CORRESPONDENCE_LOG_SELECT}
          WHERE cl.account_pk = $1
          ORDER BY cl.row_created_timestamp DESC
          LIMIT 1`,
        [accountPk],
      );
  return row ? mapCorrespondenceLog(row) : null;
}

/**
 * Polls uown_correspondence_logs until a row with the given template_name
 * appears for accountPk, or timeoutMs elapses.
 */
export async function waitForCorrespondenceLog(
  db: DatabaseHelpers,
  accountPk: number,
  templateName: string,
  timeoutMs: number,
): Promise<CorrespondenceLogRow | null> {
  return pollUntil<CorrespondenceLogRow>(
    () => getCorrespondenceLog(db, accountPk, templateName),
    timeoutMs,
    'waitForCorrespondenceLog',
  );
}

// ── Preflight: template SQL + sweep window ────────────────────────────

/**
 * Re-executes the full JOIN chain required by the `SettledInFullEmail`
 * template SQL (`svc/.../fieldsSQL/settled-in-full.sql`). The sweep enqueues
 * a row only when all five INNER JOINs (account, primary customer, primary
 * email with do_not_email=false, HOME address, PAID payment) return data AND
 * the rating gate passes. If this returns `false`, the sweep will log
 * `"No data associated with correspondence request"` in `uown_correspondence_logs`
 * and silently skip the enqueue — visible only in the error column.
 *
 * Use in preflight steps to fail fast (or wait) when fixtures haven't had a
 * real payment applied or when the sif_date has drifted outside the sweep
 * window.
 */
export async function checkTemplateQueryReturnsData(
  db: DatabaseHelpers,
  accountPk: number,
): Promise<boolean> {
  const row = await db.queryOne<{ account_pk: string }>(
    `SELECT a.pk AS account_pk
       FROM uown_sv_account a
       JOIN uown_sv_customer c ON c.account_pk = a.pk AND c.customer_type = 'PRIMARY'
       JOIN uown_sv_email email ON email.account_pk = a.pk AND email.do_not_email = false AND email_type = 'PRIMARY'
       JOIN uown_sv_address address ON address.account_pk = a.pk AND address.address_type = 'HOME'
       JOIN uown_sv_payment payment ON payment.account_pk = a.pk AND payment.status = 'PAID'
      WHERE a.pk = $1 AND (a.rating NOT IN ('E','F','U') OR a.rating IS NULL)
      LIMIT 1`,
    [accountPk],
  );
  return row !== null;
}

/**
 * Returns the sweep-window target date (YYYY-MM-DD) for the current DOW,
 * matching `settledInFullAccountEmailSweep` behavior:
 *   - Mon (1) / Tue (2) → CURRENT_DATE − 4
 *   - Wed (3)           → CURRENT_DATE − 4 (also accepts −3, −2)
 *   - Thu (4) / Fri (5) → CURRENT_DATE − 2
 *
 * Used to tell the user which `settled_in_full_date_time` value to set when
 * manually preparing a fixture (Opção A / Opção B in the preflight log).
 */
export function getSweepWindowDate(date: Date = new Date()): string {
  const dow = date.getUTCDay();
  const daysBack = dow === 1 || dow === 2 ? 4 : dow === 3 ? 4 : 2;
  const target = new Date(date);
  target.setUTCDate(target.getUTCDate() - daysBack);
  return target.toISOString().slice(0, 10);
}

/**
 * Polls `checkTemplateQueryReturnsData` every 10s until the fixture satisfies
 * the full template SQL (all JOINs return a row) or `timeoutMs` elapses.
 * Returns `true` on success, `false` on timeout. Callers typically follow up
 * with `test.skip()` on `false`.
 *
 * Unlike the generic `pollUntil`, this uses a fixed 10s interval — the user
 * action (UI payment or authorized UPDATE) is not a fast-polling signal.
 */
export async function waitForFixtureReady(
  db: DatabaseHelpers,
  accountPk: number,
  timeoutMs: number = 600_000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkTemplateQueryReturnsData(db, accountPk)) return true;
    await sleep(10_000);
  }
  return false;
}

/**
 * Count uown_correspondence_logs rows for an account, optionally matching
 * a template_name ILIKE pattern and/or created after `sinceTimestamp`.
 */
export async function countCorrespondenceLogs(
  db: DatabaseHelpers,
  accountPk: number,
  templatePattern?: string,
  sinceTimestamp?: Date,
): Promise<number> {
  const clauses: string[] = ['account_pk = $1'];
  const params: unknown[] = [accountPk];
  if (templatePattern) {
    params.push(templatePattern);
    clauses.push(`template_name ILIKE $${params.length}`);
  }
  if (sinceTimestamp) {
    params.push(sinceTimestamp);
    clauses.push(`row_created_timestamp > $${params.length}`);
  }
  return db.getSingleNumber(
    `SELECT COUNT(*) FROM uown_correspondence_logs WHERE ${clauses.join(' AND ')}`,
    params,
  );
}

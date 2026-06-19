/**
 * E-sign / GowSign DB validation helpers.
 *
 * Read-only SELECT queries + polling helpers (exponential backoff via the
 * private `pollUntil` in `DatabaseHelpers`) to validate state and transitions
 * around the e-sign integration (GowSign / SignWell / PandaDoc).
 *
 * Tables covered (verified against `docs/taskTestingUown/database-schema.md`):
 *   - uown_esign_document             (51 cols, cross-provider doc state)
 *   - uown_esign_event_trigger_log    (17 cols, iframe events)
 *   - uown_los_lead                   (78 cols, lead_status)
 *   - uown_los_lead_notes             ( 8 cols, free-text timeline)
 *   - uown_los_contract               (22 cols, used to JOIN doc ↔ lead)
 *   - uown_los_activity_log           (18 cols, structured lease log)
 *
 * Schema deviations from the original spec request (kept honest with the DB):
 *   - `uown_esign_document` has NO `external_id` / `uuid` column. Lookups are
 *     by `pk` (esign_document.pk), `lead_pk`, or via `uown_los_contract.esign_document_pk`.
 *   - The cross-provider client column is named `client`, not `esign_client`.
 *     The spec name `esign_client` is preserved on the TS type for clarity,
 *     but maps to the SQL column `client`.
 *   - `uown_esign_document` has NO `signed_pdf_hash` / `created_pdf_hash` columns.
 *     The closest signed-state signal is `doc_signed_time_stamp` and the raw
 *     `base64signed_document_string`, exposed here as `signedDateTime` and
 *     `hasSignedDocumentBlob`.
 *   - The lead-status column is `lead_status` (not `status`).
 *
 * Security: SELECT-only. NO INSERT/UPDATE/DELETE. See `.claude/rules/security.md`
 * and CLAUDE.md Exception 3.
 */

import { TIMEOUTS } from '../config/constants.js';
import { pollUntil } from './common.helpers.js';
import type { DatabaseHelpers } from './database.helpers.js';

// ── Types ────────────────────────────────────────────────────────────────

/** Cross-provider e-sign client identifier. */
export type ExpectedEsignClient = 'GOWSIGN' | 'SIGNWELL' | 'PANDADOC';

export interface EsignDocument {
  pk: number;
  leadPk: number | null;
  contractPk: number | null;        // resolved via uown_los_contract.esign_document_pk
  /** Cross-provider client identifier (column `client`). */
  esignClient: string | null;        // raw text, may be 'GOWSIGN' | 'SIGNWELL' | 'PANDADOC' | other
  esignMode: string | null;          // 'DOCX' | 'HTML' | 'STRAPI' | 'EMAIL' | other
  documentStatus: string | null;     // column `status`
  documentName: string | null;
  contractNumber: string | null;
  /** ISO timestamp of `doc_signed_time_stamp`, null until signed. */
  signedDateTime: Date | null;
  /** True iff the table holds a non-null base64 signed-document blob. */
  hasSignedDocumentBlob: boolean;
  /** True iff the table holds a non-null base64 source-document blob. */
  hasSourceDocumentBlob: boolean;
  rowCreatedTimestamp: Date | null;
  rowUpdatedTimestamp: Date | null;
}

export interface EsignEvent {
  pk: number;
  esignDocPk: number | null;
  leadPk: number | null;
  losContractPk: number | null;
  eventName: string | null;
  deviceInfo: string | null;
  embeddedUrl: string | null;
  locationName: string | null;
  rowCreatedTimestamp: Date | null;
}

export interface LeadNote {
  pk: number;
  leadPk: number;
  notes: string;
  agent: string | null;
  rowCreatedTimestamp: Date | null;
}

export interface LeadStatusTransition {
  /** Source status, null when only the new status was logged (e.g. "LeadStatus SIGNED"). */
  from: string | null;
  to: string;
  timestamp: Date | null;
  /** Original note text (for debugging / asserting context). */
  rawNote: string;
}

// ── Internal row shapes (snake_case as returned by pg) ───────────────────

interface EsignDocRow {
  pk: number | string;
  lead_pk: number | string | null;
  contract_pk: number | string | null;
  client: string | null;
  esign_mode: string | null;
  status: string | null;
  document_name: string | null;
  contract_number: string | null;
  doc_signed_time_stamp: Date | string | null;
  has_signed_blob: boolean;
  has_source_blob: boolean;
  row_created_timestamp: Date | null;
  row_updated_timestamp: Date | null;
}

interface EsignEventRow {
  pk: number | string;
  esign_doc_pk: number | string | null;
  lead_pk: number | string | null;
  los_contract_pk: number | string | null;
  event_name: string | null;
  device_info: string | null;
  embedded_url: string | null;
  location_name: string | null;
  row_created_timestamp: Date | null;
}

interface LeadNoteRow {
  pk: number | string;
  lead_pk: number | string;
  notes: string | null;
  agent: string | null;
  row_created_timestamp: Date | null;
}

// ── Mapping helpers ──────────────────────────────────────────────────────

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  return Number(v);
}

function toDateOrNull(v: Date | string | null | undefined): Date | null {
  if (v === null || v === undefined) return null;
  return v instanceof Date ? v : new Date(v);
}

function mapEsignDoc(row: EsignDocRow): EsignDocument {
  return {
    pk: Number(row.pk),
    leadPk: toNumOrNull(row.lead_pk),
    contractPk: toNumOrNull(row.contract_pk),
    esignClient: row.client,
    esignMode: row.esign_mode,
    documentStatus: row.status,
    documentName: row.document_name,
    contractNumber: row.contract_number,
    signedDateTime: toDateOrNull(row.doc_signed_time_stamp),
    hasSignedDocumentBlob: row.has_signed_blob === true,
    hasSourceDocumentBlob: row.has_source_blob === true,
    rowCreatedTimestamp: row.row_created_timestamp,
    rowUpdatedTimestamp: row.row_updated_timestamp,
  };
}

function mapEsignEvent(row: EsignEventRow): EsignEvent {
  return {
    pk: Number(row.pk),
    esignDocPk: toNumOrNull(row.esign_doc_pk),
    leadPk: toNumOrNull(row.lead_pk),
    losContractPk: toNumOrNull(row.los_contract_pk),
    eventName: row.event_name,
    deviceInfo: row.device_info,
    embeddedUrl: row.embedded_url,
    locationName: row.location_name,
    rowCreatedTimestamp: row.row_created_timestamp,
  };
}

function mapLeadNote(row: LeadNoteRow): LeadNote {
  return {
    pk: Number(row.pk),
    leadPk: Number(row.lead_pk),
    notes: row.notes ?? '',
    agent: row.agent,
    rowCreatedTimestamp: row.row_created_timestamp,
  };
}

// ── Polling primitive (exponential backoff, same shape as DatabaseHelpers#pollUntil) ──

interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Poll-until-non-null com backoff. Delega ao `pollUntil` compartilhado
 * (common.helpers). Retorna null no timeout — callers que precisam de throw
 * embrulham com mensagem própria (ver `waitForEsignDocumentStatus`).
 */
async function pollUntilEsign<T>(
  check: () => Promise<T | null>,
  logPrefix: string,
  options: PollOptions = {},
): Promise<T | null> {
  return pollUntil(check, {
    timeoutMs: options.timeoutMs,
    intervalMs: options.intervalMs,
    logPrefix,
  });
}

// SELECT shared by every esign_document lookup — keeps blob columns OUT of
// the network payload (they are large) and exposes booleans instead.
const SELECT_ESIGN_DOC = `
  SELECT ed.pk,
         ed.lead_pk,
         lc.pk AS contract_pk,
         ed.client,
         ed.esign_mode,
         ed.status,
         ed.document_name,
         ed.contract_number,
         ed.doc_signed_time_stamp,
         (ed.base64signed_document_string IS NOT NULL) AS has_signed_blob,
         (ed.base64document_string IS NOT NULL) AS has_source_blob,
         ed.row_created_timestamp,
         ed.row_updated_timestamp
    FROM uown_esign_document ed
    LEFT JOIN uown_los_contract lc ON lc.esign_document_pk = ed.pk
`;

// ============================================================
// uown_esign_document
// ============================================================

/**
 * Fetch an e-sign document by its PK (the spec referred to this as
 * `external_id`, but the schema has no such column — only the bigint `pk`).
 */
export async function getEsignDocumentByPk(
  db: DatabaseHelpers,
  esignDocPk: number | string,
): Promise<EsignDocument | null> {
  const row = await db.queryOne<EsignDocRow>(
    `${SELECT_ESIGN_DOC} WHERE ed.pk = $1`,
    [esignDocPk],
  );
  return row ? mapEsignDoc(row) : null;
}

/**
 * Fetch the latest e-sign document attached to a lead (latest by row_created_timestamp,
 * pk DESC tiebreak). Most leads have a single doc; LEASE_MOD flows can produce more.
 */
export async function getEsignDocumentByLeadPk(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<EsignDocument | null> {
  const row = await db.queryOne<EsignDocRow>(
    `${SELECT_ESIGN_DOC}
     WHERE ed.lead_pk = $1
     ORDER BY ed.row_created_timestamp DESC NULLS LAST, ed.pk DESC
     LIMIT 1`,
    [leadPk],
  );
  return row ? mapEsignDoc(row) : null;
}

/**
 * Fetch the e-sign document referenced by a `uown_los_contract` row
 * (via `uown_los_contract.esign_document_pk`).
 */
export async function getEsignDocumentByContractPk(
  db: DatabaseHelpers,
  contractPk: number | string,
): Promise<EsignDocument | null> {
  const row = await db.queryOne<EsignDocRow>(
    `${SELECT_ESIGN_DOC}
     WHERE lc.pk = $1`,
    [contractPk],
  );
  return row ? mapEsignDoc(row) : null;
}

/**
 * Wait for `uown_esign_document.status` of the doc identified by `esignDocPk`
 * to equal `expected`. Throws on timeout with a descriptive message.
 */
export async function waitForEsignDocumentStatus(
  db: DatabaseHelpers,
  esignDocPk: number | string,
  expected: string,
  options: PollOptions = {},
): Promise<EsignDocument> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.DB_WAIT;
  const result = await pollUntilEsign<EsignDocument>(
    async () => {
      const doc = await getEsignDocumentByPk(db, esignDocPk);
      return doc && doc.documentStatus === expected ? doc : null;
    },
    'waitForEsignDocumentStatus',
    options,
  );
  if (!result) {
    throw new Error(
      `Timed out waiting for esign_document.status='${expected}' (pk=${esignDocPk}) in uown_esign_document after ${timeoutMs}ms`,
    );
  }
  return result;
}

/**
 * Wait for `uown_esign_document.client` (the cross-provider identifier) to
 * equal one of the known values. Useful for US-CUT-01 (verifying the
 * dispatcher selected the configured client).
 */
export async function waitForEsignClient(
  db: DatabaseHelpers,
  esignDocPk: number | string,
  expected: ExpectedEsignClient,
  options: PollOptions = {},
): Promise<EsignDocument> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.DB_WAIT;
  const result = await pollUntilEsign<EsignDocument>(
    async () => {
      const doc = await getEsignDocumentByPk(db, esignDocPk);
      return doc && doc.esignClient === expected ? doc : null;
    },
    'waitForEsignClient',
    options,
  );
  if (!result) {
    throw new Error(
      `Timed out waiting for esign_document.client='${expected}' (pk=${esignDocPk}) in uown_esign_document after ${timeoutMs}ms`,
    );
  }
  return result;
}

// ============================================================
// uown_esign_event_trigger_log
// ============================================================

const SELECT_ESIGN_EVENT = `
  SELECT pk,
         esign_doc_pk,
         lead_pk,
         los_contract_pk,
         event_name,
         device_info,
         embedded_url,
         location_name,
         row_created_timestamp
    FROM uown_esign_event_trigger_log
`;

/**
 * Latest event for a doc, optionally filtered by event_name. Order is
 * row_created_timestamp DESC then pk DESC for deterministic last-row.
 */
export async function getLatestEsignEventByDocPk(
  db: DatabaseHelpers,
  esignDocPk: number | string,
  eventName?: string,
): Promise<EsignEvent | null> {
  const row = eventName
    ? await db.queryOne<EsignEventRow>(
        `${SELECT_ESIGN_EVENT}
         WHERE esign_doc_pk = $1 AND event_name = $2
         ORDER BY row_created_timestamp DESC NULLS LAST, pk DESC
         LIMIT 1`,
        [esignDocPk, eventName],
      )
    : await db.queryOne<EsignEventRow>(
        `${SELECT_ESIGN_EVENT}
         WHERE esign_doc_pk = $1
         ORDER BY row_created_timestamp DESC NULLS LAST, pk DESC
         LIMIT 1`,
        [esignDocPk],
      );
  return row ? mapEsignEvent(row) : null;
}

/** All events for a doc, oldest-first (chronological replay). */
export async function getEsignEventsByDocPk(
  db: DatabaseHelpers,
  esignDocPk: number | string,
): Promise<EsignEvent[]> {
  const rows = await db.query<EsignEventRow>(
    `${SELECT_ESIGN_EVENT}
     WHERE esign_doc_pk = $1
     ORDER BY row_created_timestamp ASC NULLS LAST, pk ASC`,
    [esignDocPk],
  );
  return rows.map(mapEsignEvent);
}

/**
 * Wait for at least one event with `expectedEventName` to appear for the
 * given esign_doc_pk. Throws on timeout.
 */
export async function waitForEsignEvent(
  db: DatabaseHelpers,
  esignDocPk: number | string,
  expectedEventName: string,
  options: PollOptions = {},
): Promise<EsignEvent> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.DB_WAIT;
  const result = await pollUntilEsign<EsignEvent>(
    async () => getLatestEsignEventByDocPk(db, esignDocPk, expectedEventName),
    'waitForEsignEvent',
    options,
  );
  if (!result) {
    throw new Error(
      `Timed out waiting for event_name='${expectedEventName}' on esign_doc_pk=${esignDocPk} in uown_esign_event_trigger_log after ${timeoutMs}ms`,
    );
  }
  return result;
}

/** Count of events with the given name — used to assert idempotency (== 1). */
export async function countEsignEvents(
  db: DatabaseHelpers,
  esignDocPk: number | string,
  eventName: string,
): Promise<number> {
  const rows = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM uown_esign_event_trigger_log
      WHERE esign_doc_pk = $1 AND event_name = $2`,
    [esignDocPk, eventName],
  );
  return rows[0] ? parseInt(rows[0].count, 10) : 0;
}

// ============================================================
// uown_los_lead_notes  (free-text timeline, substring matching)
// ============================================================

const SELECT_LEAD_NOTE = `
  SELECT pk, lead_pk, notes, agent, row_created_timestamp
    FROM uown_los_lead_notes
`;

/** Lead notes (newest first), with optional limit. */
export async function getLeadNotesByLeadPk(
  db: DatabaseHelpers,
  leadPk: number | string,
  options: { limit?: number } = {},
): Promise<LeadNote[]> {
  const limit = options.limit ?? 100;
  const rows = await db.query<LeadNoteRow>(
    `${SELECT_LEAD_NOTE}
     WHERE lead_pk = $1
     ORDER BY row_created_timestamp DESC NULLS LAST, pk DESC
     LIMIT $2`,
    [leadPk, limit],
  );
  return rows.map(mapLeadNote);
}

/**
 * Find the most recent lead note containing `substring` (ILIKE, case-insensitive).
 * Returns null if no match. Substring is escaped against ILIKE wildcards.
 */
export async function findLeadNoteContaining(
  db: DatabaseHelpers,
  leadPk: number | string,
  substring: string,
): Promise<LeadNote | null> {
  const row = await db.queryOne<LeadNoteRow>(
    `${SELECT_LEAD_NOTE}
     WHERE lead_pk = $1
       AND notes ILIKE '%' || $2 || '%'
     ORDER BY row_created_timestamp DESC NULLS LAST, pk DESC
     LIMIT 1`,
    [leadPk, substring],
  );
  return row ? mapLeadNote(row) : null;
}

/**
 * Count of lead notes containing `substring` — for idempotency assertions.
 * (Re-running the same backend action should NOT duplicate timeline entries.)
 */
export async function countLeadNotesContaining(
  db: DatabaseHelpers,
  leadPk: number | string,
  substring: string,
): Promise<number> {
  const rows = await db.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
       FROM uown_los_lead_notes
      WHERE lead_pk = $1
        AND notes ILIKE '%' || $2 || '%'`,
    [leadPk, substring],
  );
  return rows[0] ? parseInt(rows[0].count, 10) : 0;
}

/**
 * Wait until at least one lead note containing `substring` exists for the lead.
 * Throws on timeout with a descriptive message including the substring.
 */
export async function waitForLeadNoteSubstring(
  db: DatabaseHelpers,
  leadPk: number | string,
  substring: string,
  options: PollOptions = {},
): Promise<LeadNote> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.DB_WAIT;
  const result = await pollUntilEsign<LeadNote>(
    async () => findLeadNoteContaining(db, leadPk, substring),
    'waitForLeadNoteSubstring',
    options,
  );
  if (!result) {
    throw new Error(
      `Timed out waiting for lead note containing "${substring}" on lead_pk=${leadPk} in uown_los_lead_notes after ${timeoutMs}ms`,
    );
  }
  return result;
}

// ============================================================
// uown_los_lead.lead_status  (current status; wraps the lead-status column)
// ============================================================

/**
 * Current `lead_status` for a lead. Wraps `uown_los_lead.lead_status` (the
 * column is `lead_status`, NOT `status` — this helper preserves the spec's
 * function name `getLeadStatus` but is namespaced under `getEsignLeadStatus`
 * to avoid colliding with `DatabaseHelpers#getLeadStatus`).
 */
export async function getEsignLeadStatus(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<string | null> {
  return db.getSingleString(
    'SELECT lead_status FROM uown_los_lead WHERE pk = $1',
    [leadPk],
  );
}

/**
 * Wait for `uown_los_lead.lead_status` to equal `expected`. Throws on timeout.
 */
export async function waitForLeadStatus(
  db: DatabaseHelpers,
  leadPk: number | string,
  expected: string,
  options: PollOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? TIMEOUTS.DB_WAIT;
  const result = await pollUntilEsign<string>(
    async () => {
      const status = await getEsignLeadStatus(db, leadPk);
      return status === expected ? status : null;
    },
    'waitForLeadStatus',
    options,
  );
  if (!result) {
    throw new Error(
      `Timed out waiting for uown_los_lead.lead_status='${expected}' (lead_pk=${leadPk}) after ${timeoutMs}ms`,
    );
  }
  return result;
}

// ============================================================
// Composite parsers (regex over uown_los_lead_notes free text)
// ============================================================

/**
 * Parse the canonical "Sent Contract to customer" note and extract the
 * `EsignDocPk : {N}` value. Returns null if the note is absent or the regex
 * does not match (caller decides whether to treat as fatal).
 *
 * Matches substring: `Sent Contract to customer. Contract EsignDocPk : 12345`
 */
export async function extractEsignDocPkFromContractNote(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<number | null> {
  const note = await findLeadNoteContaining(db, leadPk, 'Sent Contract to customer');
  if (!note) return null;
  const match = note.notes.match(/EsignDocPk\s*:\s*(\d+)/i);
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parse the same "Sent Contract to customer" note for `LeaseType : {X}` and
 * `EsignMode : {Y}`. Both values are required for a match — returns null if
 * either is missing.
 */
export async function extractLeaseTypeAndEsignModeFromNote(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<{ leaseType: string; esignMode: string } | null> {
  const note = await findLeadNoteContaining(db, leadPk, 'Sent Contract to customer');
  if (!note) return null;
  const leaseTypeMatch = note.notes.match(/LeaseType\s*:\s*([A-Z_]+)/i);
  const esignModeMatch = note.notes.match(/EsignMode\s*:\s*([A-Z_]+)/i);
  if (!leaseTypeMatch || !esignModeMatch) return null;
  return {
    leaseType: leaseTypeMatch[1].toUpperCase(),
    esignMode: esignModeMatch[1].toUpperCase(),
  };
}

// ============================================================
// Lead status transition audit (parsed from uown_los_lead_notes)
// ============================================================

const TRANSITION_PATTERNS: Array<{
  re: RegExp;
  build: (m: RegExpMatchArray) => { from: string | null; to: string };
}> = [
  // "Change lead status from NEW to PENDING_UW"
  {
    re: /Change\s+lead\s+status\s+from\s+([A-Z_]+)\s+to\s+([A-Z_]+)/i,
    build: (m) => ({ from: m[1].toUpperCase(), to: m[2].toUpperCase() }),
  },
  // "OldLeadStatus : SIGNED New LeadStatus : FUNDING"
  {
    re: /OldLeadStatus\s*:\s*([A-Z_]+)\s+New\s+LeadStatus\s*:\s*([A-Z_]+)/i,
    build: (m) => ({ from: m[1].toUpperCase(), to: m[2].toUpperCase() }),
  },
  // GowSign flow — "Updating lead status to SIGNED from CONTRACT_CREATED ..."
  {
    re: /Updating\s+lead\s+status\s+to\s+([A-Z_]+)\s+from\s+([A-Z_]+)/i,
    build: (m) => ({ from: m[2].toUpperCase(), to: m[1].toUpperCase() }),
  },
  // GowSign EsignRedirectService — "Update lead {pk} status instantly from CONTRACT_CREATED to SIGNED"
  {
    re: /Update\s+lead\s+\d+\s+status\s+(?:instantly\s+)?from\s+([A-Z_]+)\s+to\s+([A-Z_]+)/i,
    build: (m) => ({ from: m[1].toUpperCase(), to: m[2].toUpperCase() }),
  },
  // "UW is run. Lead Status UW_APPROVED"  (terminal status only)
  {
    re: /UW\s+is\s+run\.\s+Lead\s+Status\s+([A-Z_]+)/i,
    build: (m) => ({ from: null, to: m[1].toUpperCase() }),
  },
  // Bare "LeadStatus SIGNED" (terminal status only) — keep last so the more
  // specific OldLeadStatus pattern wins.
  {
    re: /(?:^|\b)LeadStatus\s+([A-Z_]+)(?!\s*:)/,
    build: (m) => ({ from: null, to: m[1].toUpperCase() }),
  },
];

/**
 * Parse the lead's note timeline into a chronological list of status
 * transitions. Each note is matched against the patterns in priority order;
 * the first match wins. Notes that do not match any pattern are ignored.
 *
 * Output is ordered oldest → newest (insertion order on the lease timeline).
 */
export async function getLeadStatusTransitions(
  db: DatabaseHelpers,
  leadPk: number | string,
): Promise<LeadStatusTransition[]> {
  const rows = await db.query<LeadNoteRow>(
    `${SELECT_LEAD_NOTE}
     WHERE lead_pk = $1
     ORDER BY row_created_timestamp ASC NULLS LAST, pk ASC`,
    [leadPk],
  );
  const transitions: LeadStatusTransition[] = [];
  for (const row of rows) {
    const text = row.notes ?? '';
    for (const pattern of TRANSITION_PATTERNS) {
      const m = text.match(pattern.re);
      if (m) {
        const { from, to } = pattern.build(m);
        transitions.push({
          from,
          to,
          timestamp: row.row_created_timestamp,
          rawNote: text,
        });
        break;
      }
    }
  }
  return transitions;
}

/**
 * GowSign template DB validation helpers (svc-config concern).
 *
 * Read-only SELECT helpers for `uown_gow_sign_template` plus the small set of
 * `uown_esign_document` helpers needed to assert WHICH template was selected
 * for a given lead during the GowSign client-type adaption rollout
 * (task RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505).
 *
 * Kept in its own file (NOT merged into `esign-db.helpers.ts`) because:
 *   - Templates are svc-config (catalog of available documents) — concern is
 *     "which template is eligible for state X / client_type Y".
 *   - `esign-db.helpers.ts` covers per-lease document lifecycle (status
 *     transitions, signed blob, event log) — concern is "what happened to
 *     this lease's document".
 * Keeping the two concerns separated avoids coupling template-catalog reads
 * to per-lease lifecycle assertions.
 *
 * Schema verified against:
 *   - Migration `V20260406044409_1.51.0__create_gowsign_template.sql`
 *     (creates `uown_gow_sign_template` with cols pk, name, template_id,
 *     variables, sender, state + audit cols)
 *   - Migration `V20260429051650_1.51.0__add_footer_to_gow_sign_template.sql`
 *     (adds `footer_template TEXT`)
 *   - JPA entity `svc/.../db/entity/GowSignTemplate.java`
 *   - `docs/taskTestingUown/database-schema.md` (uown_esign_document, 51 cols,
 *     `request` is text col #43, `response` is col #44, `client` is the
 *     cross-provider identifier — not `esign_client`)
 *
 * IMPORTANT — `client_type` column is NOT yet present in the production
 * schema (no migration creates it as of 2026-05-06; the JPA entity does not
 * declare it either). This helper SELECTs the column with a defensive
 * `to_jsonb` extraction so that:
 *   - When the column exists (post-migration introduced by RU05.26.1.51.1),
 *     it returns its text value.
 *   - When the column is missing (pre-migration), the helper throws a clear
 *     "column does not exist" error from PostgreSQL — the caller then knows
 *     the schema change has not landed.
 * The simpler `client_type AS "clientType"` projection would also surface a
 * clear PostgreSQL error pre-migration, so we use that for clarity. Tests
 * targeting CT-01..CT-11 must run against an env where the migration has
 * been applied; that is a precondition documented in the test plan.
 *
 * Security: SELECT-only. NO INSERT/UPDATE/DELETE. See `.claude/rules/security.md`
 * (Exception 3 — DML requires explicit user authorization).
 */

import type { DatabaseHelpers } from './database.helpers.js';

// ── Types ────────────────────────────────────────────────────────────────

export interface GowSignTemplateRow {
  pk: number;
  templateId: string;
  name: string;
  variables: string;
  sender: string;
  state: string;
  /** CSV of client types (e.g. "PRIMARY,COSIGNER"). Null until the row is
   *  populated; nullable in the new schema (RU05.26.1.51.1). */
  clientType: string | null;
  footerTemplate: string | null;
  rowCreatedTimestamp: Date | null;
  rowUpdatedTimestamp: Date | null;
}

export interface EsignDocumentMinimalRow {
  pk: number;
  leadPk: number;
  client: string;
  status: string;
  documentName: string | null;
  contractNumber: string | null;
  request: string | null;
  response: string | null;
}

// ── Internal raw row shapes (snake_case as returned by pg) ───────────────

interface GowSignTemplateRawRow {
  pk: number | string;
  template_id: string;
  name: string;
  variables: string;
  sender: string;
  state: string;
  client_type: string | null;
  footer_template: string | null;
  row_created_timestamp: Date | null;
  row_updated_timestamp: Date | null;
}

interface EsignDocumentMinimalRawRow {
  pk: number | string;
  lead_pk: number | string;
  client: string;
  status: string;
  document_name: string | null;
  contract_number: string | null;
  request: string | null;
  response: string | null;
}

// ── Mappers ──────────────────────────────────────────────────────────────

function mapTemplate(row: GowSignTemplateRawRow): GowSignTemplateRow {
  return {
    pk: Number(row.pk),
    templateId: row.template_id,
    name: row.name,
    variables: row.variables,
    sender: row.sender,
    state: row.state,
    clientType: row.client_type,
    footerTemplate: row.footer_template,
    rowCreatedTimestamp: row.row_created_timestamp,
    rowUpdatedTimestamp: row.row_updated_timestamp,
  };
}

function mapEsignDocMinimal(row: EsignDocumentMinimalRawRow): EsignDocumentMinimalRow {
  return {
    pk: Number(row.pk),
    leadPk: Number(row.lead_pk),
    client: row.client,
    status: row.status,
    documentName: row.document_name,
    contractNumber: row.contract_number,
    request: row.request,
    response: row.response,
  };
}

// Shared SELECT — keep column list explicit to fail loudly if `client_type`
// or `footer_template` are missing (pre-migration). Callers running against
// a pre-RU05.26.1.51.1 env will see a clear PG error rather than a silent
// `undefined` from `row.client_type`.
const SELECT_TEMPLATE = `
  SELECT pk,
         template_id,
         name,
         variables,
         sender,
         state,
         client_type,
         footer_template,
         row_created_timestamp,
         row_updated_timestamp
    FROM uown_gow_sign_template
`;

const SELECT_ESIGN_DOC_MINIMAL = `
  SELECT pk,
         lead_pk,
         client,
         status,
         document_name,
         contract_number,
         request,
         response
    FROM uown_esign_document
`;

// ============================================================
// uown_gow_sign_template
// ============================================================

/**
 * Fetch a template by its business-key `template_id` (UNIQUE constraint).
 * Used by CT-01 / CT-09 / CT-11 to confirm the row created by `POST
 * /uown/svc/gowsign-templates` matches what was sent.
 */
export async function getGowSignTemplate(
  db: DatabaseHelpers,
  templateId: string,
): Promise<GowSignTemplateRow | null> {
  const row = await db.queryOne<GowSignTemplateRawRow>(
    `${SELECT_TEMPLATE} WHERE template_id = $1 LIMIT 1`,
    [templateId],
  );
  return row ? mapTemplate(row) : null;
}

/**
 * All templates eligible for a customer state. Mirrors the backend's
 * `state` lookup (case-insensitive, trim-tolerant) so the test can enumerate
 * the candidate set BEFORE the backend selection runs and confirm the
 * routing decision afterwards. Used by CT-01..CT-11.
 *
 * Order is `pk ASC` (insertion order) — the backend's
 * `findEligibleByStateAndClientOrdered` adds its own ordering on top.
 */
export async function getGowSignTemplatesForState(
  db: DatabaseHelpers,
  state: string,
): Promise<GowSignTemplateRow[]> {
  const rows = await db.query<GowSignTemplateRawRow>(
    `${SELECT_TEMPLATE}
     WHERE UPPER(TRIM(state)) = UPPER(TRIM($1))
     ORDER BY pk`,
    [state],
  );
  return rows.map(mapTemplate);
}

// ============================================================
// client_type CSV parsing (mirrors backend `findEligibleByStateAndClientOrdered`)
// ============================================================

/**
 * Pure predicate — true iff the template's `clientType` CSV contains
 * `expectedClientType` (case-insensitive, trim-tolerant). Mirrors the parsing
 * rule in the backend's `findEligibleByStateAndClientOrdered`:
 *
 *   1. Trim the CSV
 *   2. Split on `,`
 *   3. Trim each token
 *   4. Compare case-insensitively
 *
 * Returns false when `clientType` is null/blank — a template with no
 * declared client_type is NOT eligible for any specific client (matches
 * backend behaviour where the column is required for routing).
 */
export function templateClientTypeContains(
  template: GowSignTemplateRow,
  expectedClientType: string,
): boolean {
  if (template.clientType == null) return false;
  const csv = template.clientType.trim();
  if (csv.length === 0) return false;
  const target = expectedClientType.trim().toUpperCase();
  return csv
    .split(',')
    .map((token) => token.trim().toUpperCase())
    .some((token) => token.length > 0 && token === target);
}

/**
 * Assertion helper — throws with a clear, contextual message if the
 * template's `clientType` CSV does NOT contain `expectedClientType`.
 * Use this in `test.step()` when you want a fail-fast error; use
 * `templateClientTypeContains()` when you want to compose with `expect()`.
 */
export function assertTemplateClientTypeContains(
  template: GowSignTemplateRow,
  expectedClientType: string,
): void {
  if (templateClientTypeContains(template, expectedClientType)) return;
  throw new Error(
    `Template "${template.templateId}" (pk=${template.pk}) does not list client_type="${expectedClientType}". ` +
      `Actual client_type=${template.clientType === null ? 'null' : `"${template.clientType}"`}. ` +
      `Parsing rule: trim → split(',') → trim each token → case-insensitive compare.`,
  );
}

// ============================================================
// uown_esign_document — minimal lookups for templateId extraction
// ============================================================

/**
 * Most-recent `uown_esign_document` row for a lead filtered by client
 * (cross-provider identifier; column name is `client`, NOT `esign_client`).
 * Order is `pk DESC` for the latest insert; lease modifications can produce
 * multiple rows per lead.
 *
 * NOTE: a similar but heavier helper exists in `esign-db.helpers.ts`
 * (`getEsignDocumentByLeadPk`), but it does NOT filter by client and it
 * suppresses the `request`/`response` blob columns (large). This helper
 * is purposefully minimal and includes `request`/`response` because the
 * caller needs to parse the JSON payload.
 */
export async function getEsignDocumentByLeadAndClient(
  db: DatabaseHelpers,
  leadPk: number,
  esignClient: 'GOWSIGN' | 'SIGNWELL',
): Promise<EsignDocumentMinimalRow | null> {
  // Filter to dispatch rows (request is a JSON object). The sweep inserts a
  // sibling row whose `request` is the plain string "getCompletedDocument";
  // returning that row would break templateId extraction. Confirmed in stg
  // 2026-05-07 (lead 6559359 had pk=510904 dispatch + pk=510905 sweep row).
  const row = await db.queryOne<EsignDocumentMinimalRawRow>(
    `${SELECT_ESIGN_DOC_MINIMAL}
     WHERE lead_pk = $1 AND client = $2 AND request LIKE '{%'
     ORDER BY pk DESC
     LIMIT 1`,
    [leadPk, esignClient],
  );
  return row ? mapEsignDocMinimal(row) : null;
}

/**
 * Extract `templateId` from the JSON payload stored in
 * `uown_esign_document.request`.
 *
 * JSON shape (verified against svc backend
 *   `service/gowsign/CreateRequestBuilder.java#buildDocument` lines 90-103
 *   and `service/gowsign/DocumentDispatchService.java#dispatch` lines 67-77):
 *
 *   {
 *     "requester":           { ... },
 *     "document": {
 *       "templateId":        "<the value we want>",
 *       "variables":         { ... },
 *       "footerTemplate":    "...",
 *       "expirationDate":    "YYYY-MM-DD",
 *       "callback":          { "environment": "..." }
 *     },
 *     "sendSignatureEmail":  true | false
 *   }
 *
 * The DTOs `GowSignCreateRequest` / `GowSignDocument` use Lombok defaults
 * (no `@JsonProperty` overrides) so Jackson serializes Java field names
 * as-is → camelCase keys `document` / `templateId`.
 *
 * Defensive fallback: if the canonical path is missing, look at top-level
 * `templateId` (some legacy code paths or other clients may store the field
 * at the root).
 *
 * Returns `null` (does NOT throw) when:
 *   - `esignDocumentRequest` is null/undefined/blank
 *   - JSON parse fails
 *   - neither `document.templateId` nor top-level `templateId` is a non-empty string
 *
 * Caller decides whether absence is fatal.
 */
export function extractTemplateIdFromEsignDocumentRequest(
  esignDocumentRequest: string | null | undefined,
): string | null {
  if (esignDocumentRequest == null) return null;
  const trimmed = esignDocumentRequest.trim();
  if (trimmed.length === 0) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object') return null;

  // Canonical path: request.document.templateId
  const root = parsed as Record<string, unknown>;
  const document = root.document;
  if (document !== null && typeof document === 'object') {
    const templateId = (document as Record<string, unknown>).templateId;
    if (typeof templateId === 'string' && templateId.length > 0) return templateId;
  }

  // Defensive fallback: root.templateId
  const rootTemplateId = root.templateId;
  if (typeof rootTemplateId === 'string' && rootTemplateId.length > 0) return rootTemplateId;

  return null;
}

// ============================================================
// Convenience composite — assert "lead got template X"
// ============================================================

/**
 * Composite helper: load the latest GOWSIGN esign document for a lead,
 * extract its vendor `templateId` from the request payload, fetch the matching
 * template row, and assert it is the expected template.
 *
 * IMPORTANT — a GowSign template has TWO distinct identifiers, never equal:
 *   - `uown_gow_sign_template.template_id` is the GowSign VENDOR opaque hash
 *     (e.g. "aa1kmya9pq69uim1u4ma405b"). It is also what the dispatch payload
 *     carries at `request.document.templateId`, so it is always the JOIN KEY
 *     used to find the row — but it is NOT human-readable.
 *   - `uown_gow_sign_template.name` is the human-readable business name
 *     (e.g. "OH_2025_SAC_16_MONTHS"), matching `uown_esign_document.document_name`.
 *   (Verified in qa2: zero rows where `name = template_id` — the two columns
 *    never collide, so accepting either as the expected identifier is
 *    unambiguous.)
 *
 * Callers legitimately identify "the selected template" by EITHER convention:
 *   - Pass the human NAME (e.g. "OH_2025_SAC_16_MONTHS"), matching `document_name`.
 *   - Pass the vendor HASH (e.g. "mu97ag8wkchj1icvn5amz5s6") from the DB column.
 * So `expectedTemplate` is matched against `template.name` OR
 * `template.templateId` — whichever the caller passes. Both rows are returned
 * so the caller can chain further assertions (e.g.
 * `assertTemplateClientTypeContains(template, 'PRIMARY')`) without re-querying.
 *
 * Throws (fail-fast) when:
 *   - No GOWSIGN esign document exists for the lead
 *   - The request payload is missing or unparseable
 *   - The extracted vendor templateId does not exist in `uown_gow_sign_template`
 *   - The matched template's `name` AND `templateId` both differ from
 *     `expectedTemplate`
 */
export async function assertSelectedTemplateForLead(
  db: DatabaseHelpers,
  leadPk: number,
  expectedTemplate: string,
): Promise<{ esignDoc: EsignDocumentMinimalRow; template: GowSignTemplateRow }> {
  const esignDoc = await getEsignDocumentByLeadAndClient(db, leadPk, 'GOWSIGN');
  if (!esignDoc) {
    throw new Error(
      `assertSelectedTemplateForLead: no GOWSIGN row found in uown_esign_document for lead_pk=${leadPk}`,
    );
  }
  const extractedTemplateId = extractTemplateIdFromEsignDocumentRequest(esignDoc.request);
  if (!extractedTemplateId) {
    throw new Error(
      `assertSelectedTemplateForLead: could not extract vendor templateId from uown_esign_document.request ` +
        `(esign_doc.pk=${esignDoc.pk}, lead_pk=${leadPk}). ` +
        `Expected JSON shape: { "document": { "templateId": "..." } }.`,
    );
  }
  const template = await getGowSignTemplate(db, extractedTemplateId);
  if (!template) {
    throw new Error(
      `assertSelectedTemplateForLead: extracted vendor templateId="${extractedTemplateId}" ` +
        `(from esign_doc.pk=${esignDoc.pk}, lead_pk=${leadPk}) does not exist in uown_gow_sign_template`,
    );
  }
  // Accept a match on EITHER the human-readable name or the vendor hash — both
  // uniquely identify the row (they never coincide). This is the
  // least-surprising contract: the human name "OH_2025_SAC_16_MONTHS" lives in
  // `name`, NOT `template_id` (which is the opaque vendor hash).
  if (template.name !== expectedTemplate && template.templateId !== expectedTemplate) {
    throw new Error(
      `assertSelectedTemplateForLead: lead_pk=${leadPk} got template name="${template.name}" ` +
        `(vendor template_id="${template.templateId}") but expected "${expectedTemplate}" ` +
        `to match either the name or the vendor template_id (esign_doc.pk=${esignDoc.pk})`,
    );
  }
  return { esignDoc, template };
}

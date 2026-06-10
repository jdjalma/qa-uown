/**
 * Response shape for `POST /uown/los/simpleSearch/{searchString}` (Origination)
 * and `GET /uown/svc/simpleSearch/{searchString}` (Servicing).
 *
 * Reference: svc#454 SPEC §8 (CT-BUG-1 about `createdTimestamp` aliasing) and
 * `src/scripts/audit-search-sqls.ts` (EXPECTED_ALIASES list).
 *
 * IMPORTANT — shape (qa-debugger live verification 2026-05-24):
 *   Backend returns a WRAPPER `{ searchResults, count, moreResults }`, NOT a
 *   flat array. Older drafts of this file declared it as a flat array — that
 *   was incorrect and broke the `Array.isArray(parsed)` parsers in the
 *   simple-search specs. Source-tag: MCP browser fetch live response @ qa1
 *   Origination 2026-05-24 (see report.md F-03 unblock).
 *
 *   Category: DRIFT-PRONE (volatile). Re-validate response shape against live
 *   svc whenever this file is touched — see [[volatile-knowledge-registry]].
 *
 * The `createdTimestamp` field on each `SimpleSearchResult` is the one
 * impacted by BUG-1 (FreeText SQL uses the legacy alias `rowCreatedTime`).
 */
export interface SimpleSearchResult {
  leadPk?: number | null;
  accountPk?: number | null;
  uuid?: string | null;
  leadStatus?: string | null;
  customerName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  ssn?: string | null;
  phoneNumber?: string | null;
  areaCode?: string | null;
  phone?: string | null;
  email?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  contractNumber?: string | null;
  invoiceNumber?: string | null;
  last4CC?: string | null;
  accountStatus?: string | null;
  rtoAccountNumber?: string | null;
  accountActivationDate?: string | null;
  nextPaymentAmount?: number | string | null;
  company?: string | null;
  /** Driven by SQL alias (CT-BUG-1: FreeText returns `null` until alias is fixed). */
  createdTimestamp?: string | null;
  /** Legacy alias still emitted by `GETLOSSEARCH_FREETEXT` — proof of BUG-1. */
  rowCreatedTime?: string | null;
  [key: string]: unknown;
}

/**
 * Backend wrapper. `searchResults` is the array of matches.
 *
 * Helpers/tests that need the flat list MUST access `.searchResults` — never
 * `Array.isArray(body)` (the body is always the wrapper object).
 */
export interface SimpleSearchResponseBody {
  searchResults: SimpleSearchResult[];
  count?: number;
  moreResults?: boolean;
  [key: string]: unknown;
}

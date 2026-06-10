export interface AccountSummaryResponse {
  epoBalance: number;
  contractBalance: number;
  epoBreakdown?: string[][];
  [key: string]: unknown;
}

/**
 * Servicing Information response (GET /uown/svc/getServicingInfo/{accountPk}).
 *
 * Settlement Amount fields added by svc R1.52.0 / frontend!689 (issue
 * uown/frontend/servicing#512). `settlementAmount` is the numeric value
 * displayed in the "Account & Contract Overview" sub-panel; clicking the
 * label opens a modal rendering the rows in `settlementAmountBreakdown`.
 *
 * `settlementAmountBreakdown` is intentionally typed loosely
 * (`(string[] | null)[]`) because:
 *   - backend can return `null` rows (e.g. Protection Plan Fee absent)
 *   - frontend `breakdown.tsx` accepts both the legacy EPO `string[][]`
 *     and the new settlement format with optional `null` rows
 *   - ineligible accounts may surface `null` or `[]` (BUG-1 / Q-D3)
 */
/**
 * Request body for `POST /uown/svc/createOrUpdateServicingInfo`.
 *
 * Only the fields needed by current automation are typed; backend accepts a
 * superset and ignores unknown keys. `_90DayExpirationDate` is consumed by
 * `ServicingInformationService.setEarlyPayoffDateExpiry` to shift the EPO
 * window without touching the schedule or payment frequency (regra #9 — no
 * direct DB UPDATE; activity log `DATA_CHANGE` is generated automatically).
 *
 * The `_90DayExpirationDate` field name mirrors the Java DTO; the leading
 * underscore is part of the wire format.
 */
export interface ServicingInformationBody {
  accountPk: number;
  /** ISO date `yyyy-MM-dd`. When in the past, EPO reverts to legacy `anytimeBuyOut`. */
  _90DayExpirationDate?: string;
  [key: string]: unknown;
}

export interface ServicingInformationResponse {
  epoBreakdown: string[][];
  epoFeePercent: number;
  /** Numeric settlement amount displayed in the panel. Absent or `0` for ineligible accounts (rating B/C, non-ACTIVE). */
  settlementAmount?: number;
  /**
   * Per-line breakdown rendered in the Settlement modal.
   * Each row is `[label, value]` (or extra trailing tokens). Rows may be
   * `null` when the line item is not applicable (e.g. Protection Plan Fee).
   */
  settlementAmountBreakdown?: (string[] | null)[];
  [key: string]: unknown;
}

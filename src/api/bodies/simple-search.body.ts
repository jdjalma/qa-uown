/**
 * Request body for the LOS simple-search endpoint.
 *
 * `FilterRequest` (Java) is read by `MerchantCodeAspect` (AOP) before reaching
 * the controller. Multi-tenancy is controlled by `merchantRefCodes`:
 *   - non-empty array → restrict to those refCodes
 *   - empty array OR ["*"] → wildcard / no filter (contract Q3, spec §3)
 *   - absent body → today the endpoint still returns 200 (anomaly #4 — flagged)
 *
 * Reference: svc#454 SPEC §3 AMBIGUOUS / Questions for PO.
 */
export interface SimpleSearchLosBody {
  /** Backend currently treats empty array / ["*"] as wildcard. See spec Q3. */
  merchantRefCodes?: string[];
  /** Optional override for pagination. Defaults applied server-side. */
  pageNumber?: number;
  maxResults?: number;
  [key: string]: unknown;
}

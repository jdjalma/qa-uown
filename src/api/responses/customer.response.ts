/**
 * Response shapes for the IVR/TMS customer search endpoints (Task #510).
 *
 * Contract confirmed by inspecting qa2 runtime responses + svc V1 reference
 * (InboundIVRController.java / FindAccountResponse / AccountProfile). The V2
 * endpoint reuses the V1 page-envelope: { content: CustomerProfile[], size }.
 * New V2 fields (customerAccountDomain, leadPk, leadStatus) live INSIDE each
 * profile entry, not at the root.
 */

export type CustomerAccountDomain = 'SERVICING' | 'ORIGINATION';

export interface CustomerProfile {
  accountPk?: number;
  accountStatus?: string;
  firstName?: string;
  lastName?: string;
  /** Last 4 digits of SSN — camelCase "Ssn" (matches backend `AccountProfile.last4Ssn`). */
  last4Ssn?: string;
  /** Date of birth in ISO format (YYYY-MM-DD). */
  dob?: string;
  zip?: string;
  phone?: string;
  email?: string;
  /** V2-only (task #510): resolved domain per profile. */
  customerAccountDomain?: CustomerAccountDomain;
  /** V2-only (task #510). */
  leadPk?: number;
  /** V2-only (task #510). */
  leadStatus?: string;
  /** Escape hatch: backend may return additional fields not yet typed here. */
  [key: string]: unknown;
}

/**
 * Response envelope for POST /uown/tms/v2/customers/search.
 *
 * Mirrors V1's FindAccountResponse(List<AccountProfile> content, long size).
 * Empty match → HTTP 200 with { content: [], size: 0 }.
 */
export interface FindCustomerResponse {
  content: CustomerProfile[];
  size: number;
  [key: string]: unknown;
}

/**
 * Legacy response shape for POST /uown/tms/v1/accounts/search.
 *
 * Marked @Deprecated by Task #510 — kept opaque on purpose so tests can
 * assert against the raw payload without committing to a stable contract.
 */
export type LegacyAccountSearchResponse = Record<string, unknown>;

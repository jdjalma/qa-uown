/**
 * Responses for Sticky Recover client (svc#485).
 *
 * Both schemas are intentionally permissive (open via index signature) because
 * Q3 of the SPEC (RU05.26.1.52.0) marks them as "discover-empirically — first
 * run fixes the contract". Tests should snapshot the payload + assert the
 * minimum-known fields only; future PRs tighten the typing as fields become
 * confirmed by Gustavo / svc-sticky.
 */

export interface StickyCancelRecoveryResponseBody {
  /** Sticky's response status (`CANCELED`, `RESOLVED`, `DEFERRED`, etc.) */
  status?: string;
  /** Same transactionId echoed back */
  transactionId?: string;
  /** Free-form audit message */
  message?: string;
  [key: string]: unknown;
}

/**
 * Single attempt entry inside `attempts[]` of GET sticky-recoveries.
 * Schema discovered empirically — extend as fields are confirmed.
 */
export interface StickyRecoveryAttempt {
  attemptNumber?: number;
  httpStatus?: number;
  gatewayTransactionId?: string | null;
  retryStatus?: string;
  rowCreatedTimestamp?: string;
  [key: string]: unknown;
}

/**
 * Single session entry returned by GET /uown/svc/accounts/{accountPk}/sticky-recoveries.
 * Maps to `uown_sticky` row + nested `uown_sticky_retry_attempt` rows.
 */
export interface StickyRecoverySession {
  stickyPk?: number;
  ccTransactionPk?: number;
  accountPk?: number;
  stickyTransactionId?: string | null;
  recoveryStatus?: string;
  dunningProfileId?: number | string;
  attempts?: StickyRecoveryAttempt[];
  rowCreatedTimestamp?: string;
  rowUpdatedTimestamp?: string;
  [key: string]: unknown;
}

/**
 * GET /uown/svc/accounts/{accountPk}/sticky-recoveries — top-level response.
 *
 * Confirmed empirically (sandbox 2026-05-20, account 17176): the endpoint
 * returns a Spring `Page<StickyRecoverySession>` shape — sessions live in
 * `content[]`. Defensive fallbacks (`recoveries[]`, bare array) are kept
 * in the union so future contract changes do not break consumers.
 *
 * The Page session entry uses different field casing than `uown_sticky`:
 *   - `creditCardTransactionPk` (not `ccTransactionPk`)
 *   - `status` (e.g. "SUBMITTED"), distinct from `recoveryStatus`
 *   - `numberOfAttempts`, `lastRetryAttemptTime`, `externalId`
 */
export type StickyRecoveriesResponseBody =
  | StickyRecoverySession[]
  | { content?: StickyRecoverySession[]; recoveries?: StickyRecoverySession[]; [key: string]: unknown };

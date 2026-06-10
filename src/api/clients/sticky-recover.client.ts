/**
 * Sticky Recover API client — svc#485 (RU05.26.1.52.0).
 *
 * Endpoints:
 *  - POST `/processing-hub/v2/api/recovery/cancel` — cancel an active recovery session (CT-09, R9).
 *      Routed to Sticky's processing-hub host; URL passed verbatim (BaseClient
 *      uses the configured `svcApiUrl` only when the path is relative-only).
 *      Sandbox: hits `/processing-hub/v2/api/recovery/cancel` on the same svc
 *      host (svc-sticky proxies to vendor). Q2 of the SPEC clarifies the
 *      schema empirically — see `buildStickyCancelRecoveryBody`.
 *  - GET `/uown/svc/accounts/{accountPk}/sticky-recoveries` — agent-facing
 *      Sticky history (CT-11, R11). Backed by `StickyController` in svc.
 *
 * Why a dedicated client (no reuse): both endpoints are svc#485-only; no
 * existing client maps to `/processing-hub/v2/api/recovery/**` or to the
 * sticky-recoveries read path.
 */
import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import {
  buildStickyCancelRecoveryBody,
  type StickyCancelReason,
} from '../bodies/sticky-recover.body.js';
import type {
  StickyCancelRecoveryResponseBody,
  StickyRecoveriesResponseBody,
  StickyRecoverySession,
} from '../responses/sticky-recover.response.js';

export class StickyRecoverClient extends BaseClient {
  /**
   * Cancel an active Sticky recovery session.
   *
   * @param transactionId Sticky-side `uown_sticky.sticky_transaction_id`
   * @param reason         `CANCELED` (default), `RESOLVED`, or `DEFERRED` — Q2
   * @param note           optional free-form audit note
   */
  async cancelRecovery(
    transactionId: string,
    reason: StickyCancelReason = 'CANCELED',
    note?: string,
  ): Promise<ApiResponse<StickyCancelRecoveryResponseBody>> {
    const body = buildStickyCancelRecoveryBody(transactionId, reason, note);
    return this.post<StickyCancelRecoveryResponseBody>(
      '/processing-hub/v2/api/recovery/cancel',
      body,
    );
  }

  /**
   * Fetch the Sticky recovery history for a given account (used by the
   * Servicing CC Transactions view + as the API contract probe for CT-11).
   */
  async getStickyRecoveries(
    accountPk: string | number,
  ): Promise<ApiResponse<StickyRecoveriesResponseBody>> {
    return this.get<StickyRecoveriesResponseBody>(
      `/uown/svc/accounts/${accountPk}/sticky-recoveries`,
    );
  }
}

/**
 * Convenience unwrapper: normalises the response body to a flat array.
 *
 * Confirmed empirically (sandbox 2026-05-20, account 17176): the backend
 * returns a Spring `Page<StickyRecoverySession>` with `content[]` +
 * `pageable`/`totalElements`/`number`/`size`. Earlier guesses about
 * `{ recoveries: [...] }` or a bare array were wrong — kept as defensive
 * fallbacks. Returns `[]` when the payload is none of these shapes.
 */
export function unwrapStickyRecoveries(
  body: StickyRecoveriesResponseBody | undefined | null,
): StickyRecoverySession[] {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  const rec = body as { content?: unknown; recoveries?: unknown };
  if (Array.isArray(rec.content)) return rec.content as StickyRecoverySession[];
  if (Array.isArray(rec.recoveries)) return rec.recoveries as StickyRecoverySession[];
  return [];
}

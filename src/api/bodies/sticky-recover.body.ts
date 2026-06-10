/**
 * Bodies for Sticky Recover client (svc#485).
 *
 * Q2 (SPEC RU05.26.1.52.0): exact schema for `POST /processing-hub/v2/api/recovery/cancel`
 * is to be discovered empirically — first run fixes the contract. Until then, we
 * pass a minimal `{ transactionId, reason }` shape; extend this interface when
 * Gustavo / Sticky doc confirms additional required fields.
 */

export type StickyCancelReason = 'CANCELED' | 'RESOLVED' | 'DEFERRED';

export interface StickyCancelRecoveryBody {
  /** Sticky-side transaction id captured from `uown_sticky.sticky_transaction_id` */
  transactionId: string;
  /** Cancel reason (default `CANCELED` — see Q2 in spec) */
  reason?: StickyCancelReason;
  /** Optional free-form note for audit */
  note?: string;
}

export function buildStickyCancelRecoveryBody(
  transactionId: string,
  reason: StickyCancelReason = 'CANCELED',
  note?: string,
): StickyCancelRecoveryBody {
  return {
    transactionId,
    reason,
    ...(note !== undefined && { note }),
  };
}

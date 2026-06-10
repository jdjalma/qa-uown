/**
 * Sticky Recover — domain constants (svc#485, RU05.26.1.52.0).
 *
 * Source of truth: svc commit `d4bc38a52` + Gustavo Martins call 2026-05-20.
 *
 * Dunning profile IDs are resolved per `payment_frequency` (see
 * `resolveDunningProfileIdForFrequency` in svc-sticky). Payment profile is
 * sandbox-only (Sticky vendor config); other envs must inject via env-config
 * once provisioned.
 */

/** WEEKLY payment frequency → dunning profile 223 */
export const DUNNING_PROFILE_WEEKLY = 223;

/** BI_WEEKLY payment frequency → dunning profile 224 */
export const DUNNING_PROFILE_BI_WEEKLY = 224;

/** MONTHLY payment frequency → dunning profile 225 (also the value Sticky overrides to — see Improvement #5) */
export const DUNNING_PROFILE_MONTHLY = 225;

/** Sandbox-only Sticky payment profile id sent in `/recover` outbound payload */
export const PAYMENT_PROFILE_SANDBOX = 153;

/** pk of `uown_scheduled_task` row holding `StickyRecoverSweep` (sandbox) */
export const STICKY_RECOVER_SWEEP_PK = 80;

export const STICKY_RECOVER_SWEEP_NAME = 'StickyRecoverSweep';
export const STICKY_RECOVER_CANCEL_SWEEP_NAME = 'StickyRecoverCancelSweep';

/** Friendly map from payment_frequency → dunning profile id (UOWN-side, NOT what Sticky honors) */
export const DUNNING_PROFILE_BY_FREQUENCY: Record<string, number> = {
  WEEKLY: DUNNING_PROFILE_WEEKLY,
  BI_WEEKLY: DUNNING_PROFILE_BI_WEEKLY,
  MONTHLY: DUNNING_PROFILE_MONTHLY,
};

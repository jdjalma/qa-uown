/**
 * Account aging helpers — for boundary-value testing of delinquency-driven
 * features (Settlement Amount %, delinquency offer email sweep, etc.).
 *
 * The backend computes `days_delinquent` as
 * `CURRENT_DATE − uown_sv_sched_summary.delinquency_as_of_date`. To exercise
 * off-by-one boundaries (60/61, 90/91, 150/151) we mutate
 * `delinquency_as_of_date` on dedicated SEED accounts and restore the
 * original value after the test.
 *
 * USER AUTHORIZATION:
 *   The SPEC for uown/frontend/servicing#512 §5 explicitly authorizes
 *   UPDATEs on `uown_sv_sched_summary` for the aging seeds (4353/4355/
 *   4358/4359). All other accounts MUST NOT be aged via this helper.
 *
 * USAGE PATTERN (try/finally is MANDATORY — SPEC §11):
 *
 *   const originalDays = 60;
 *   try {
 *     await ageAccount(db, accountPk, 91);
 *     // ... test ...
 *   } finally {
 *     await restoreAccount(db, accountPk, originalDays);
 *   }
 *
 * `withAgedAccount` wraps this pattern for convenience.
 */
import type { DatabaseHelpers } from './database.helpers.js';

/**
 * Default delinquency baseline for the aging seed accounts (4353, 4355,
 * 4358, 4359 in qa1). Each starts at 60 days delinquent — restoring to
 * this value is the documented post-test state per SPEC §11.
 */
export const SEED_DELINQUENCY_DAYS = 60;

/**
 * Forces an account to `days` days delinquent by setting
 * `delinquency_as_of_date = CURRENT_DATE − days`.
 *
 * Returns the number of rows updated (typically 1 — the active summary
 * row). Throws if no row was updated (account has no summary — likely
 * not a valid seed).
 */
export async function ageAccount(
  db: DatabaseHelpers,
  accountPk: number | string,
  days: number,
): Promise<number> {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error(`ageAccount: invalid days=${days} (must be non-negative integer)`);
  }
  const rows = await db.executeUpdate(
    `UPDATE uown_sv_sched_summary
        SET delinquency_as_of_date = CURRENT_DATE - $1::int
      WHERE account_pk = $2`,
    [days, accountPk],
  );
  if (rows === 0) {
    throw new Error(
      `ageAccount: no uown_sv_sched_summary row found for account_pk=${accountPk} ` +
        `— is it a valid aging seed?`,
    );
  }
  return rows;
}

/**
 * Restores an account to its baseline delinquency. Defaults to
 * `SEED_DELINQUENCY_DAYS` (60 — matches the seed accounts).
 *
 * Always called in `finally` after `ageAccount`. Errors are NOT swallowed
 * — a restoration failure must surface so test data drift is visible.
 */
export async function restoreAccount(
  db: DatabaseHelpers,
  accountPk: number | string,
  originalDays: number = SEED_DELINQUENCY_DAYS,
): Promise<number> {
  return ageAccount(db, accountPk, originalDays);
}

/**
 * Convenience wrapper: ages → runs the action → restores in `finally`.
 * Use when the test body is a single block; for multi-step tests prefer
 * an explicit `try/finally` so `test.step` is visible in the trace.
 */
export async function withAgedAccount<T>(
  db: DatabaseHelpers,
  accountPk: number | string,
  days: number,
  action: () => Promise<T>,
  originalDays: number = SEED_DELINQUENCY_DAYS,
): Promise<T> {
  try {
    await ageAccount(db, accountPk, days);
    return await action();
  } finally {
    await restoreAccount(db, accountPk, originalDays);
  }
}

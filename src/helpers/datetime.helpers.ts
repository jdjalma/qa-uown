/**
 * Datetime assertion helpers.
 *
 * Added for svc#536 (LevelAI: `lastScheduleMovedDate` / `numberOfDueDateMoves`).
 * The API returns Java `LocalDateTime` (no offset) while the DB persists
 * `timestamptz` (UTC). Observed delta on qa1 is ~3h between API and DB for
 * the same business instant — comparing the two requires a TZ-tolerant
 * window rather than an exact-equality assertion.
 */

import { expect } from '@playwright/test';

export interface TzWindowOptions {
  /**
   * Maximum acceptable absolute server-TZ offset, in hours.
   * Default 5 — covers UTC-4..UTC+4 plus DST drift, sufficient for any
   * deployment we run today.
   */
  maxOffsetHours?: number;
  /** Extra tolerance for sub-second / clock-skew jitter, in milliseconds. */
  toleranceMs?: number;
}

/**
 * Asserts that an API `LocalDateTime` string (no TZ) corresponds to the
 * same business instant as a DB UTC timestamp, up to a TZ window.
 *
 * The check is symmetric: we accept any offset in
 * `[-maxOffsetHours, +maxOffsetHours]` hours (plus `toleranceMs`).
 *
 * @param apiLocalDateTime ISO-like Java `LocalDateTime`, e.g. `"2026-05-22T12:05:20.756016"`.
 * @param dbTimestampUtc DB `timestamptz` value (UTC) — `Date` or ISO string.
 * @param options TZ window + jitter tolerance overrides.
 */
export function expectWithinTzWindow(
  apiLocalDateTime: string,
  dbTimestampUtc: Date | string,
  options: TzWindowOptions = {},
): void {
  const { maxOffsetHours = 5, toleranceMs = 2_000 } = options;

  // Parse the LocalDateTime as if it were UTC — this gives us the same epoch
  // shape as the DB, off by exactly the server TZ offset.
  const apiAsUtc = apiLocalDateTime.endsWith('Z') ? apiLocalDateTime : `${apiLocalDateTime}Z`;
  const apiEpoch = Date.parse(apiAsUtc);
  if (Number.isNaN(apiEpoch)) {
    throw new Error(`expectWithinTzWindow: unparseable API LocalDateTime "${apiLocalDateTime}"`);
  }

  const dbDate = dbTimestampUtc instanceof Date ? dbTimestampUtc : new Date(dbTimestampUtc);
  const dbEpoch = dbDate.getTime();
  if (Number.isNaN(dbEpoch)) {
    throw new Error(`expectWithinTzWindow: unparseable DB timestamp "${String(dbTimestampUtc)}"`);
  }

  const deltaMs = Math.abs(apiEpoch - dbEpoch);
  const windowMs = maxOffsetHours * 3_600_000 + toleranceMs;

  expect(
    deltaMs,
    `expectWithinTzWindow: |API ${apiLocalDateTime} − DB ${dbDate.toISOString()}| = ${deltaMs}ms ` +
    `exceeds window ${windowMs}ms (maxOffsetHours=${maxOffsetHours}, toleranceMs=${toleranceMs})`,
  ).toBeLessThanOrEqual(windowMs);
}

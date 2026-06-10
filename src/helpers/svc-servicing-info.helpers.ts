/**
 * Helpers around `SvcPayoffClient.createOrUpdateServicingInfo`.
 *
 * `setEarlyPayoffDateExpiry` is the canonical way to simulate the 90-day EPO
 * window expiring (or being extended) in tests, without mutating the schedule
 * or the payment frequency, and without direct DB writes (regra #9). Backend
 * generates a `DATA_CHANGE` activity log row automatically (regra #13).
 */
import type { ApiClients } from '../support/base-test.js';

/**
 * Normalizes a date input to an ISO `yyyy-MM-dd` string in UTC. Accepts
 * either a string already in that format or a `Date` instance. Strings are
 * returned as-is when they match `^\d{4}-\d{2}-\d{2}$` to avoid unintended
 * timezone shifts.
 */
function toIsoDate(date: string | Date): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`setEarlyPayoffDateExpiry: invalid date string "${date}"`);
    }
    return parsed.toISOString().slice(0, 10);
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error('setEarlyPayoffDateExpiry: invalid Date instance');
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Shifts the EPO eligibility window for the given account.
 *
 * Backed by `POST /uown/svc/createOrUpdateServicingInfo` with
 * `_90DayExpirationDate` populated. Throws when the response is not 2xx so
 * callers can fail fast (no silent reverts).
 *
 * Typical uses (SPEC svc#531 §6.C):
 *   - Today: `setEarlyPayoffDateExpiry(api, accountPk, calculateDateISO(0))`
 *     keeps the lease inside the window (boundary CT C1).
 *   - Yesterday: `setEarlyPayoffDateExpiry(api, accountPk, calculateDateISO(-1))`
 *     reverts EPO to legacy `anytimeBuyOut` (CT C2).
 */
export async function setEarlyPayoffDateExpiry(
  api: ApiClients,
  accountPk: number,
  date: string | Date,
): Promise<void> {
  const isoDate = toIsoDate(date);
  const response = await api.svcPayoff.createOrUpdateServicingInfo({
    accountPk,
    _90DayExpirationDate: isoDate,
  });
  if (!response.ok) {
    const bodyPreview = JSON.stringify(response.body).slice(0, 300);
    throw new Error(
      `setEarlyPayoffDateExpiry: accountPk=${accountPk} date=${isoDate} responded ${response.status} ${response.statusText} body=${bodyPreview}`,
    );
  }
}

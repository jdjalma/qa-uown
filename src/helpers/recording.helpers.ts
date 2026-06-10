/**
 * Recording Helpers — assertions for Sentry Session Replay recording links
 * persisted by the customer-facing `[shortCode]/complete` flow.
 *
 * Used by `R1.52.0_fixRecordingLinkSameTabReuse_1291` (issue
 * https://gitlab.com/uown/frontend/origination/-/work_items/1291) and any
 * future test that needs to validate the `uown_lead_recording` row created
 * after the customer reaches the application-complete page.
 *
 * Design notes (2026-05-22 MCP investigation in qa1):
 * - There is NO UI element rendering the recording link on the Origination
 *   lead page. The recording is internal state — a row in
 *   `uown_lead_recording (lead_pk, uuid)` mapping the lead to its Sentry
 *   replay UUID. Agents access replays via the Sentry dashboard, not via
 *   Origination FE.
 * - Therefore the primary assertion of AC-2 / AC-4 (Marcos' test plan) is a
 *   DB SELECT, not a DOM check. Rule #14 (UI-first) remains satisfied — the
 *   bug path (filling the app, navigating between apps in the same tab)
 *   continues to be exercised via UI. Only the post-condition validation is
 *   DB-bound because there is no UI to validate.
 * - `uown_los_lead_notes` does NOT log recording creation — rule #13 N/A for
 *   recording itself (gap surfaced in OQ-3 of the spec).
 *
 * Schema (`uown_lead_recording`, svc DB):
 *   pk BIGINT, row_created_timestamp TIMESTAMP, row_updated_timestamp TIMESTAMP,
 *   tenant_id BIGINT, lead_pk BIGINT, uuid VARCHAR
 */
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { DatabaseHelpers } from './database.helpers.js';
import { sleep } from './common.helpers.js';

// ── DB validation ─────────────────────────────────────────────────────

export interface AssertRecordingLinkOptions {
  /** Total polling budget in ms. Default: 10_000. */
  timeoutMs?: number;
  /** Poll interval in ms. Default: 500. */
  intervalMs?: number;
  /**
   * Optional minimum creation time (e.g. start of the CT) — used in same-tab
   * reuse cenarios to ensure we pick the recording for app2, not a leftover
   * row from app1 that was reused if the schema ever changes.
   */
  minCreatedAfter?: Date;
}

interface RecordingRow {
  pk: number;
  uuid: string;
  lead_pk: number;
  row_created_timestamp: Date | null;
}

/**
 * Polls `uown_lead_recording` until a row appears for the given `leadPk`,
 * then returns the most recent `uuid`. Fails if no row appears within the
 * timeout.
 *
 * @param db DatabaseHelpers fixture instance (from `test-context.fixture`).
 * @param leadPk Numeric PK from `uown_los_lead.pk`.
 * @param opts Polling configuration overrides.
 * @returns The non-empty `uuid` string (Sentry replay ID).
 * @throws When no recording row is observed within `timeoutMs`.
 */
export async function assertRecordingLinkInDb(
  db: DatabaseHelpers,
  leadPk: number | string,
  opts: AssertRecordingLinkOptions = {},
): Promise<string> {
  const { timeoutMs = 10_000, intervalMs = 500, minCreatedAfter } = opts;
  const numericLeadPk = Number(leadPk);
  if (!Number.isFinite(numericLeadPk) || numericLeadPk <= 0) {
    throw new Error(`assertRecordingLinkInDb: invalid leadPk "${leadPk}"`);
  }

  const sql = minCreatedAfter
    ? `SELECT pk, uuid, lead_pk, row_created_timestamp
         FROM uown_lead_recording
        WHERE lead_pk = $1 AND row_created_timestamp >= $2
        ORDER BY pk DESC
        LIMIT 1`
    : `SELECT pk, uuid, lead_pk, row_created_timestamp
         FROM uown_lead_recording
        WHERE lead_pk = $1
        ORDER BY pk DESC
        LIMIT 1`;
  const params: unknown[] = minCreatedAfter
    ? [numericLeadPk, minCreatedAfter.toISOString()]
    : [numericLeadPk];

  const deadline = Date.now() + timeoutMs;
  let lastError: Error | null = null;
  while (Date.now() < deadline) {
    try {
      const row = await db.queryOne<RecordingRow>(sql, params);
      if (row && row.uuid && row.uuid.trim().length > 0) {
        return row.uuid;
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`[assertRecordingLinkInDb] poll error: ${lastError.message}`);
    }
    await sleep(intervalMs);
  }

  const suffix = lastError ? ` (last error: ${lastError.message})` : '';
  throw new Error(
    `Recording link missing for lead ${numericLeadPk} — no row in uown_lead_recording ` +
    `after ${timeoutMs}ms${suffix}. Either Sentry replay was not initialized in the ` +
    `customer browser OR the [shortCode]/complete page did not POST the replayId.`,
  );
}

// ── SessionStorage state assertion ────────────────────────────────────

/**
 * Snapshot of the sessionStorage keys the customer Complete flow manages.
 * `null` means the key is absent (returned as `null` by `sessionStorage.getItem`).
 */
export interface RecordingSessionStorageState {
  sentUuid: string | null;
  shortCode: string | null;
  leadPk: string | null;
}

export type RecordingSessionStorageExpectation = {
  [K in keyof RecordingSessionStorageState]?:
    | string
    | null
    | 'present'   // any non-null value
    | 'absent';   // strictly null
};

/**
 * Reads the recording-related sessionStorage keys (`sentUuid`, `shortCode`,
 * `leadPk`) from the customer-side page and asserts against `expected`.
 *
 * Each key in `expected` supports four modes:
 *   - `string` → strict equality with `sessionStorage.getItem(key)`
 *   - `null` or `'absent'` → key must be missing (`getItem` returns `null`)
 *   - `'present'` → any non-null value accepted
 *   - omitted → skipped (no assertion for that key)
 *
 * Returns the full snapshot for logging/annotations.
 */
export async function assertSessionStorageState(
  page: Page,
  expected: RecordingSessionStorageExpectation,
  label = 'recording sessionStorage',
): Promise<RecordingSessionStorageState> {
  const snapshot = await page.evaluate<RecordingSessionStorageState>(() => ({
    sentUuid: window.sessionStorage.getItem('sentUuid'),
    shortCode: window.sessionStorage.getItem('shortCode'),
    leadPk: window.sessionStorage.getItem('leadPk'),
  }));

  for (const key of Object.keys(expected) as (keyof RecordingSessionStorageState)[]) {
    const want = expected[key];
    if (want === undefined) continue;
    const actual = snapshot[key];
    const tag = `${label}.${String(key)}`;
    if (want === 'absent' || want === null) {
      expect(actual, `${tag} must be absent (null), got "${actual}"`).toBeNull();
    } else if (want === 'present') {
      expect(actual, `${tag} must be present (non-null), got null`).not.toBeNull();
      if (actual !== null) {
        expect(actual.length, `${tag} must be a non-empty string`).toBeGreaterThan(0);
      }
    } else {
      expect(actual, `${tag} must equal "${want}"`).toBe(want);
    }
  }

  return snapshot;
}

// ── Sentry Session Replay pre-flight ──────────────────────────────────

/**
 * Pre-flight check confirming Sentry Session Replay SDK is initialized in the
 * customer-facing page. Failing fast here prevents a misleading "recording
 * missing" downstream assertion when the real cause is the env not having
 * Sentry enabled at all.
 *
 * Detection probes both shapes observed in qa1 (2026-05-22):
 *   - `window.__SENTRY__?.hub` — internal hub object (always present when SDK loaded)
 *   - `window.Sentry?.getReplay?.()` — public SDK accessor (present on newer builds)
 *
 * @returns `true` if any probe succeeds; never returns `false` (throws instead).
 */
export async function assertSentryReplayInitialized(
  page: Page,
  envLabel = 'current env',
): Promise<boolean> {
  const present = await page.evaluate(() => {
    const w = window as unknown as {
      __SENTRY__?: { hub?: unknown };
      Sentry?: { getReplay?: () => unknown };
    };
    return Boolean(w.__SENTRY__?.hub) || typeof w.Sentry?.getReplay === 'function';
  });

  if (!present) {
    throw new Error(
      `Sentry Session Replay not initialized in ${envLabel}. ` +
      `Recording link cannot be generated without the SDK loaded on the customer page. ` +
      `Verify the [shortCode]/complete bundle includes Sentry SDK and replay integration.`,
    );
  }
  return true;
}

// ── URL helpers ───────────────────────────────────────────────────────

/**
 * Extract the customer-side `shortCode` from a `contractUrl` returned by
 * `setupApplicationViaApi({ extractContractUrl: true })` or by the
 * `sendInvoice` response.
 *
 * The URL shape is:
 *   `https://origination-{env}.uownleasing.com/{shortCode}/complete?planId=...`
 * (or `/{shortCode}` without `/complete` in some responses — both are handled
 * by stripping leading slash and taking the first path segment).
 *
 * @throws When the URL has no shortCode segment.
 */
export function extractShortCodeFromContractUrl(contractUrl: string): string {
  if (!contractUrl) {
    throw new Error('extractShortCodeFromContractUrl: empty contractUrl');
  }
  let pathParts: string[];
  try {
    const url = new URL(contractUrl);
    pathParts = url.pathname.split('/').filter(Boolean);
  } catch {
    throw new Error(`extractShortCodeFromContractUrl: invalid URL "${contractUrl}"`);
  }
  const shortCode = pathParts[0] ?? '';
  if (!shortCode) {
    throw new Error(`extractShortCodeFromContractUrl: no shortCode segment in "${contractUrl}"`);
  }
  return shortCode;
}

/**
 * Build the customer-facing complete URL for a given env + shortCode.
 *
 * Pattern (confirmed via MCP in qa1):
 *   `https://origination-{env}.uownleasing.com/{shortCode}/complete`
 *
 * The `originationUrl` config value already includes the `origination-{env}`
 * host; we just append the shortCode path.
 */
export function buildCustomerCompleteUrl(originationUrl: string, shortCode: string): string {
  if (!originationUrl) throw new Error('buildCustomerCompleteUrl: empty originationUrl');
  if (!shortCode) throw new Error('buildCustomerCompleteUrl: empty shortCode');
  const base = originationUrl.replace(/\/+$/, '');
  return `${base}/${shortCode}/complete`;
}

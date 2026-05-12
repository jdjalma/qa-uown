/**
 * Network Intercept Helper — NeuroID Traffic Capture
 *
 * Installs Playwright listeners to capture HTTP traffic related to NeuroID
 * (frontend SDK + backend endpoints that consume NeuroID verification results).
 *
 * Designed for the NeuroID bypass test (task #496) where the QA request is to
 * "detect NeuroID in the network requests with all info and status".
 *
 * Filter scope:
 *   - Frontend SDK domains: neuroid, neuro-id, nid
 *   - Known siteids in qa2: items340 (SEND_APP), depth355 (SUBMIT_APP)
 *   - Backend endpoints that run NeuroID verification: sendApplication, submitApplication
 *
 * Safety:
 *   - Response body capture is best-effort (some responses are not readable mid-flight)
 *   - Body size truncated at MAX_BODY_BYTES to keep artifacts small
 *   - PII fields (ssn, dob, accountNumber, routingNumber, cvc) scrubbed from captured payloads
 */

import type { Page, Request, Response } from '@playwright/test';

const MAX_BODY_BYTES = 50_000;

/** URL substrings that identify NeuroID traffic (frontend SDK + backend endpoints). */
const NEUROID_URL_HINTS = [
  'neuroid',
  'neuro-id',
  'nid.com',
  '/uown/los/sendApplication',
  '/uown/los/submitApplication',
] as const;

/** Known qa2 siteids — appear in URL querystring or payload for NeuroID SDK calls. */
const NEUROID_SITEID_HINTS = ['items340', 'depth355'] as const;

/** Keys scrubbed from captured payloads to avoid leaking PII into artifacts. */
const PII_KEYS_LOWER = new Set([
  'ssn',
  'dob',
  'dateofbirth',
  'birthdate',
  'accountnumber',
  'routingnumber',
  'cvc',
  'cardnumber',
  'password',
]);

export interface CapturedNetworkEntry {
  timestamp: string;
  url: string;
  method: string;
  status?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  kind: 'frontend-sdk' | 'backend-endpoint' | 'other-match';
  /** Extracted NeuroID status, if discoverable from the response body. */
  neuroIdStatusHint?: string;
}

export interface NeuroIdCapture {
  entries: CapturedNetworkEntry[];
  detach: () => void;
}

function matchesNeuroId(url: string): { matched: boolean; kind: CapturedNetworkEntry['kind'] } {
  const lower = url.toLowerCase();
  if (
    lower.includes('/uown/los/sendapplication') ||
    lower.includes('/uown/los/submitapplication')
  ) {
    return { matched: true, kind: 'backend-endpoint' };
  }
  if (NEUROID_URL_HINTS.some(h => lower.includes(h.toLowerCase()))) {
    return { matched: true, kind: 'frontend-sdk' };
  }
  if (NEUROID_SITEID_HINTS.some(s => lower.includes(s))) {
    return { matched: true, kind: 'other-match' };
  }
  return { matched: false, kind: 'other-match' };
}

function truncate(body: string | undefined): string | undefined {
  if (!body) return body;
  if (body.length <= MAX_BODY_BYTES) return body;
  return `${body.slice(0, MAX_BODY_BYTES)}...[TRUNCATED ${body.length - MAX_BODY_BYTES} bytes]`;
}

function scrubPii(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  try {
    const parsed = JSON.parse(raw);
    const walker = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(walker);
      if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          out[k] = PII_KEYS_LOWER.has(k.toLowerCase()) ? '[REDACTED]' : walker(v);
        }
        return out;
      }
      return value;
    };
    return JSON.stringify(walker(parsed));
  } catch {
    return raw;
  }
}

function extractStatusHint(body: string | undefined): string | undefined {
  if (!body) return undefined;
  const matchNeuro = body.match(/"neuro[_-]?id[_-]?status"\s*:\s*"([^"]+)"/i);
  if (matchNeuro) return matchNeuro[1];
  const matchFraud = body.match(/"fraudStatus"\s*:\s*"([^"]+)"/i);
  if (matchFraud) return matchFraud[1];
  const matchStatus = body.match(/"status"\s*:\s*"(SUCCESS|PROFILE_NOT_FOUND|FAILED|APPROVE|DECLINE)"/i);
  if (matchStatus) return matchStatus[1];
  return undefined;
}

/**
 * Attach listeners on the given Playwright Page to capture NeuroID-related traffic.
 * Call the returned `detach()` to stop listening (e.g., in test teardown).
 *
 * Example:
 *   const capture = attachNeuroIdListeners(page);
 *   await page.goto(contractUrl);
 *   // ... actions ...
 *   capture.detach();
 *   const json = dumpCaptured(capture);
 *   await test.info().attach('network-neuroid.json', { body: json, contentType: 'application/json' });
 */
export function attachNeuroIdListeners(page: Page): NeuroIdCapture {
  const entries: CapturedNetworkEntry[] = [];

  const onRequest = (request: Request): void => {
    const { matched, kind } = matchesNeuroId(request.url());
    if (!matched) return;
    entries.push({
      timestamp: new Date().toISOString(),
      url: request.url(),
      method: request.method(),
      requestHeaders: request.headers(),
      requestBody: scrubPii(truncate(request.postData() ?? undefined)),
      kind,
    });
  };

  const onResponse = async (response: Response): Promise<void> => {
    const url = response.url();
    const { matched, kind } = matchesNeuroId(url);
    if (!matched) return;

    let bodyText: string | undefined;
    try {
      bodyText = await response.text();
    } catch {
      bodyText = undefined;
    }

    const scrubbed = scrubPii(truncate(bodyText));
    const hint = extractStatusHint(bodyText);

    // Try to attach response data to an existing request entry (same URL+method)
    const match = [...entries].reverse().find(
      e => e.url === url && e.method === response.request().method() && e.status === undefined,
    );
    if (match) {
      match.status = response.status();
      match.responseHeaders = response.headers();
      match.responseBody = scrubbed;
      match.neuroIdStatusHint = hint;
    } else {
      entries.push({
        timestamp: new Date().toISOString(),
        url,
        method: response.request().method(),
        status: response.status(),
        responseHeaders: response.headers(),
        responseBody: scrubbed,
        kind,
        neuroIdStatusHint: hint,
      });
    }
  };

  page.on('request', onRequest);
  page.on('response', onResponse);

  return {
    entries,
    detach: () => {
      page.off('request', onRequest);
      page.off('response', onResponse);
    },
  };
}

/** Serialize the capture to JSON (pretty-printed) for `test.info().attach(...)`. */
export function dumpCaptured(capture: NeuroIdCapture): string {
  return JSON.stringify(
    {
      capturedAt: new Date().toISOString(),
      count: capture.entries.length,
      entries: capture.entries,
    },
    null,
    2,
  );
}

/**
 * Classify overall NeuroID outcome from captured entries.
 * Returns the first non-null status hint, falling back to 'UNKNOWN' if nothing found.
 */
export function classifyNeuroIdOutcome(capture: NeuroIdCapture): string {
  for (const e of capture.entries) {
    if (e.neuroIdStatusHint) return e.neuroIdStatusHint;
  }
  return 'UNKNOWN';
}

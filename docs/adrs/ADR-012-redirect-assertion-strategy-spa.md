# ADR-012 — Redirect Assertion Strategy for SPA Routes

**Date:** 2026-05-20  
**Status:** Accepted  
**Context:** Task #1293 — redirect of invalid/inactive `/getApplication/{code}` links

## Context

UOWN Origination uses Next.js. Routes that redirect invalid codes do so **client-side** via `next/router` `replaceState` — the initial HTTP response is 200, not a 3xx. Server-side 3xx redirects exist only on the generic `/getApplication` (no segment) route.

Testing these two cases requires different strategies:

| Case | HTTP behavior | Correct assertion |
|------|--------------|-------------------|
| Client-side redirect (invalid/inactive code) | 200 → JS `replaceState` | `page.waitForURL(regex)` |
| Server-side 3xx (generic route) | 307 redirect | `request.get({ maxRedirects: 0 })` + assert `.status()` |
| `page.goto` on 4xx/5xx endpoint | Throws `ERR_HTTP_RESPONSE_CODE_FAILURE` | Wrap in try/catch; use `request.get` for status-only checks |

## Decision

1. **Client-side redirects** — assert final URL via `page.waitForURL(pattern)`. Do NOT assert HTTP response status (it is always 200 for the landing page load).
2. **Server-side 3xx redirects** — assert via `request.get(url, { maxRedirects: 0 })` and check `.status()` (301/302/307). Do NOT use `page.goto` for this purpose.
3. **Error routes (4xx/5xx)** — use `request.get` for status assertions. If `page.goto` is necessary (e.g., SPA that renders an error page), wrap in try/catch — Chromium throws on non-2xx by default.
4. The canonical helpers `assertRedirectedToFindMerchant` and `assertRendersApplicationForm` (see [[helpers-catalog]]) implement rule #1 for the known UOWN redirect destination.

## Consequences

- Tests that assert redirect behavior are portable across environments without hardcoding HTTP status codes that may vary by CDN/proxy.
- `page.goto` in test setup blocks (preconditions) that hit error routes must always be guarded with try/catch or use `request.get` instead.
- New redirect tests must declare in a comment whether the redirect is client-side or server-side, and choose the corresponding assertion path.

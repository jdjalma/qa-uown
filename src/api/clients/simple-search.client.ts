/**
 * SimpleSearchClient — wraps the two simple-search endpoints under audit by
 * svc#454 (R1.52.0):
 *   - `POST /uown/los/simpleSearch/{searchString}` (Origination, multi-tenant via body)
 *   - `GET  /uown/svc/simpleSearch/{searchString}` (Servicing regression — no body)
 *
 * Special behaviours required by the SPEC (RU05.26.1.52.0):
 *   - `searchType` is OPTIONAL (null → backend pre-detect: @/UUID/alpha/FreeText)
 *   - `sendBody` flag exposes API-EDGE-01 (POST sem body returns 200 today)
 *   - Returns the parsed body + raw response so contract-edge tests can assert
 *     status codes and content-type drift (anomalies #4-#7).
 */
import { BaseClient } from './base.client.js';
import type { APIResponse } from '@playwright/test';
import type { ApiResponse } from '../responses/api-response.js';
import { parseResponse } from '../responses/api-response.js';
import type { SimpleSearchLosBody } from '../bodies/simple-search.body.js';
import type { SimpleSearchResponseBody } from '../responses/simple-search.response.js';

export interface SearchLosOptions {
  /** Backend filter: `Lead`, `Email`, `Phone`, `SSN`, `InvoiceNum`, `Name`, `UUID`, `Last4CC`, etc. Omit/null to trigger pre-detect. */
  searchType?: string | null;
  /** Multi-tenancy filter; see body docs. */
  merchantRefCodes?: string[];
  pageNumber?: number;
  maxResults?: number;
  /**
   * When `false`, POST is sent WITHOUT body (covers API-EDGE-01 anomaly #4).
   * Default `true`.
   */
  sendBody?: boolean;
  /** Override `Content-Type` header. `null` removes the header (covers API-EDGE-02). */
  contentType?: string | null;
  /** When provided, sends this raw string as the request body (covers API-EDGE-03 invalid JSON). */
  rawBody?: string;
}

export interface SearchSvcOptions {
  searchType?: string | null;
  pageNumber?: number;
  maxResults?: number;
}

export class SimpleSearchClient extends BaseClient {
  /**
   * POST /uown/los/simpleSearch/{searchString} — Origination.
   * Returns the parsed array body AND raw response (for edge cases that need
   * to inspect non-JSON payloads / unexpected status codes).
   */
  async searchLos(
    input: string,
    opts: SearchLosOptions = {},
  ): Promise<ApiResponse<SimpleSearchResponseBody>> {
    const {
      searchType,
      merchantRefCodes,
      pageNumber,
      maxResults,
      sendBody = true,
      contentType,
      rawBody,
    } = opts;

    const qs = searchType != null && searchType !== ''
      ? `?searchType=${encodeURIComponent(searchType)}`
      : '';
    const url = this.resolveUrl(
      `/uown/los/simpleSearch/${encodeURIComponent(input)}${qs}`,
      'origination',
    );

    // Build the request body unless explicitly suppressed.
    let body: SimpleSearchLosBody | undefined;
    if (sendBody) {
      body = {
        ...(merchantRefCodes !== undefined ? { merchantRefCodes } : {}),
        ...(pageNumber !== undefined ? { pageNumber } : {}),
        ...(maxResults !== undefined ? { maxResults } : {}),
      };
    }

    // Compose headers, honouring contentType overrides (null → remove).
    const headers: Record<string, string> = { ...this.headers };
    if (contentType === null) {
      // Explicit removal for API-EDGE-02.
      delete headers['Content-Type'];
    } else if (contentType !== undefined) {
      headers['Content-Type'] = contentType;
    } else if (sendBody || rawBody !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Choose data payload: rawBody (string) overrides body (object).
    let response: APIResponse;
    if (rawBody !== undefined) {
      response = await this.request.post(url, {
        headers,
        data: rawBody,
        timeout: 300_000,
      });
    } else if (body !== undefined) {
      response = await this.request.post(url, {
        headers,
        data: body,
        timeout: 300_000,
      });
    } else {
      // No body at all (API-EDGE-01).
      response = await this.request.post(url, {
        headers,
        timeout: 300_000,
      });
    }

    return parseResponse<SimpleSearchResponseBody>(response);
  }

  /**
   * GET /uown/svc/simpleSearch/{searchString} — Servicing regression.
   * No body; no multi-tenancy.
   */
  async searchSvc(
    input: string,
    opts: SearchSvcOptions = {},
  ): Promise<ApiResponse<SimpleSearchResponseBody>> {
    const params: string[] = [];
    if (opts.searchType != null && opts.searchType !== '') params.push(`searchType=${encodeURIComponent(opts.searchType)}`);
    if (opts.pageNumber !== undefined) params.push(`pageNumber=${opts.pageNumber}`);
    if (opts.maxResults !== undefined) params.push(`maxResults=${opts.maxResults}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.get<SimpleSearchResponseBody>(`/uown/svc/simpleSearch/${encodeURIComponent(input)}${qs}`);
  }
}

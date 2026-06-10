/**
 * TMS payment client (svc#509 — Refactor Request Objects for TMS Payment Endpoints).
 *
 * Covers the 3 refactored endpoints on
 * `com.uownleasing.svc.rest.tms.TmsPaymentController`:
 *
 *   - POST /uown/tms/v1/accounts/{accountId}/payments/credit-card
 *     → processCreditCardPayment(@RequestBody CreditCardPaymentRequest)
 *   - POST /uown/tms/v1/accounts/{accountId}/payments/ach
 *     → processACHPayment(@RequestBody AchPaymentRequest)
 *   - POST /uown/tms/v1/accounts/{accountId}/paymentArrangements
 *     → processPaymentArrangement(@RequestBody PaymentArrangementDto)  // post-revert
 *
 * These endpoints are the **external partner surface** (Five9, IVR, readme.io).
 * Cross-repo investigation (2026-05-21) confirmed zero internal callers. We
 * authenticate with the FIVE9 TMS API key (same pattern as `TmsAuditClient`).
 *
 * Design notes:
 *
 * 1. The client accepts an OPAQUE `unknown` body (`postRaw(... body)`) to let
 *    individual CTs hand-craft malformed / legacy payloads (CT-7, CT-8a/b, CT-9,
 *    CT-10). Typed convenience methods wrap the raw call for the happy paths.
 *
 * 2. We deliberately do NOT swallow non-2xx responses — every CT inspects
 *    `response.status` + `response.body` explicitly.
 *
 * 3. `BaseClient` is constructed with `injectAuth: false / injectApiKey: false`
 *    because the TMS surface rejects the default LOS auth headers. The TMS
 *    key is supplied per-request via the `tmsHeaders` helper, matching
 *    `TmsAuditClient`.
 */
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseClient } from './base.client.js';
import { parseResponse, type ApiResponse } from '../responses/api-response.js';
import type { ConfigEnvironment } from '../../config/environment.js';
import type {
  TmsCreditCardPaymentRequest,
  TmsAchPaymentRequest,
  TmsLegacyPaymentArrangementRequest,
} from '../bodies/tms-payment.body.js';
import type {
  TmsCreditCardPaymentResponseBody,
  TmsAchPaymentResponseBody,
  TmsPaymentArrangementResponseBody,
} from '../responses/tms-payment.response.js';

export class TmsPaymentClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env, { injectAuth: false, injectApiKey: false });
  }

  /** Resolve TMS headers (Bearer key + Accept), merging optional caller overrides. */
  private tmsHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.headers,
      Accept: 'application/json',
      Authorization: this.env.tmsApiKey,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  /**
   * Raw POST helper — any JSON-serializable body (including intentionally
   * malformed / legacy shapes for CT-7..CT-10). Returns the underlying
   * `APIResponse` so callers can inspect both 2xx and non-2xx without
   * triggering JSON parsing for plain-text error bodies.
   */
  private async postRawTms(
    path: string,
    body: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<APIResponse> {
    const url = this.resolveUrl(path);
    return this.request.post(url, {
      headers: this.tmsHeaders(extraHeaders),
      data: body as Record<string, unknown>,
      timeout: 120_000,
    });
  }

  // ── Credit-card payment ──────────────────────────────────────────

  /**
   * `POST /uown/tms/v1/accounts/{accountId}/payments/credit-card`
   *
   * Typed happy-path call — body conforms to the new
   * `CreditCardPaymentRequest`. For CT-7 (bean-validation negatives),
   * CT-8a (`{"ccInfo":{...}}` top-level alias) and CT-8b (legacy
   * `creditCardPk` inside card), use `postCreditCardPaymentRaw`.
   */
  async postCreditCardPayment(
    accountId: number | string,
    body: TmsCreditCardPaymentRequest,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsCreditCardPaymentResponseBody>> {
    const response = await this.postRawTms(
      `/uown/tms/v1/accounts/${accountId}/payments/credit-card`,
      body,
      extraHeaders,
    );
    return parseResponse<TmsCreditCardPaymentResponseBody>(response);
  }

  /**
   * Variant that accepts an arbitrary opaque body — used by CTs that need
   * to send malformed / legacy / alias-only payloads while still exercising
   * the real endpoint URL + auth.
   */
  async postCreditCardPaymentRaw(
    accountId: number | string,
    body: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const response = await this.postRawTms(
      `/uown/tms/v1/accounts/${accountId}/payments/credit-card`,
      body,
      extraHeaders,
    );
    return parseResponse<unknown>(response);
  }

  // ── ACH payment ──────────────────────────────────────────────────

  /**
   * `POST /uown/tms/v1/accounts/{accountId}/payments/ach`
   *
   * Mapper hardcodes `achProcessType=REQUEST` + `achType=ACHDebit`
   * (SPEC §C). The TMS public surface never supported refund / rerun /
   * scheduled flows; those live on `/uown/svc/...` and Quartz sweeps.
   */
  async postAchPayment(
    accountId: number | string,
    body: TmsAchPaymentRequest,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsAchPaymentResponseBody>> {
    const response = await this.postRawTms(
      `/uown/tms/v1/accounts/${accountId}/payments/ach`,
      body,
      extraHeaders,
    );
    return parseResponse<TmsAchPaymentResponseBody>(response);
  }

  /** Opaque-body variant — see `postCreditCardPaymentRaw`. */
  async postAchPaymentRaw(
    accountId: number | string,
    body: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const response = await this.postRawTms(
      `/uown/tms/v1/accounts/${accountId}/payments/ach`,
      body,
      extraHeaders,
    );
    return parseResponse<unknown>(response);
  }

  // ── Payment Arrangement (legacy shape post-revert) ───────────────

  /**
   * `POST /uown/tms/v1/accounts/{accountId}/paymentArrangements`
   *
   * Commit `56b878299` reverted this endpoint to consume the LEGACY
   * `PaymentArrangementDto` (`creditCardTransactions[]` / `achPayments[]`).
   * Posting the new shape (`creditLines[]` / `achLines[]`) results in
   * HTTP 200 + 0 transactions persisted (SPEC §D — silent no-op).
   * CT-10 documents that behaviour using `postPaymentArrangementRaw`.
   */
  async postPaymentArrangement(
    accountId: number | string,
    body: TmsLegacyPaymentArrangementRequest,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsPaymentArrangementResponseBody>> {
    const response = await this.postRawTms(
      `/uown/tms/v1/accounts/${accountId}/paymentArrangements`,
      body,
      extraHeaders,
    );
    return parseResponse<TmsPaymentArrangementResponseBody>(response);
  }

  /** Opaque-body variant — see `postCreditCardPaymentRaw`. */
  async postPaymentArrangementRaw(
    accountId: number | string,
    body: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const response = await this.postRawTms(
      `/uown/tms/v1/accounts/${accountId}/paymentArrangements`,
      body,
      extraHeaders,
    );
    return parseResponse<unknown>(response);
  }
}

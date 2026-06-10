import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import { parseResponse, type ApiResponse } from '../responses/api-response.js';
import type { TmsAccountSummaryResponse } from '../responses/tms-audit.response.js';
import type { ConfigEnvironment } from '../../config/environment.js';
import type {
  AddActivityLogBody,
  AddLogNoteLegacyBody,
} from '../bodies/tms-audit.body.js';

/**
 * TMS audit-trail client — created for WI-525 (TMS/LOS controllers not
 * written to `uown_sv_inbound_api_log`).
 *
 * Targets the controllers covered by the post-fix `AspectInboundApiLog`
 * SV/TMS pointcut:
 *   - S1 — legacy `com.uownleasing.svc.rest.svc.TmsController`
 *           (base `/uown/tms`)
 *   - S2 — modern `com.uownleasing.svc.rest.tms.*` package:
 *           - `TmsAccountController` (`/uown/tms/v1/accounts/{id}`)
 *           - `TmsPaymentController` (`/uown/tms/v1/accounts/{id}/payment-methods/*`)
 *           - `TmsDueDateController` (`/uown/tms/v1/accounts/{id}/activity-logs`,
 *             `.../due-dates/move`)
 *
 * All endpoints authenticate with the FIVE9 TMS API key
 * (`env.tmsApiKey`) — same pattern as `AccountClient.adjustNextDueDate` and
 * `CustomersClient.postTms`.
 *
 * The `BaseClient` constructor is invoked with `injectAuth: false /
 * injectApiKey: false` because the TMS endpoints reject the default LOS
 * auth headers; the TMS key is supplied per-request via the override
 * helpers.
 */
export class TmsAuditClient extends BaseClient {
  constructor(request: APIRequestContext, env: ConfigEnvironment) {
    super(request, env, { injectAuth: false, injectApiKey: false });
  }

  // ── Header helpers ───────────────────────────────────────────────

  /** Resolve TMS headers, merging optional caller overrides (e.g. `X-Run-Id`). */
  private tmsHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.headers,
      Accept: 'application/json',
      Authorization: this.env.tmsApiKey,
      ...extra,
    };
  }

  // ── S2: TmsAccountController ────────────────────────────────────

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/summary`
   * Maps to `TmsAccountController.getAccountSummary` (`:27`).
   * Idempotent read — primary smoke probe for CT-02 / CT-11 / CT-12.
   */
  async getAccountSummary(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsAccountSummaryResponse>> {
    const url = this.resolveUrl(`/uown/tms/v1/accounts/${accountId}/summary`);
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<TmsAccountSummaryResponse>(response);
  }

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/payoff`
   * Maps to `TmsAccountController.getPayoffAmount` (`:35`).
   * Idempotent read.
   */
  async getPayoffAmount(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl(`/uown/tms/v1/accounts/${accountId}/payoff`);
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }

  // ── S2: TmsPaymentController ────────────────────────────────────

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/payment-methods/bank-accounts`
   * Maps to `TmsPaymentController.getBankAccounts` (`:35`).
   * Idempotent read.
   */
  async getBankAccounts(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/payment-methods/bank-accounts`,
    );
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/payment-methods/credit-cards`
   * Maps to `TmsPaymentController.getCreditCards` (`:43`).
   * Idempotent read.
   */
  async getCreditCards(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/payment-methods/credit-cards`,
    );
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }

  // ── S2: TmsDueDateController ────────────────────────────────────

  /**
   * POST `/uown/tms/v1/accounts/{accountId}/activity-logs`
   * Maps to `TmsDueDateController.addActivityLog` (`:43`).
   * Append-only — minimal side-effect; writes a row to
   * `uown_sv_activity_log` with `created_by` carrying the `TMS-` prefix
   * (validated in CT-10a).
   */
  async addActivityLog(
    accountId: number | string,
    body: AddActivityLogBody,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/activity-logs`,
    );
    const response = await this.request.post(url, {
      headers: {
        ...this.tmsHeaders(extraHeaders),
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }

  // ── S1: legacy TmsController ────────────────────────────────────

  /**
   * GET `/uown/tms/getPayoffAmount/{accountPk}`
   * Maps to legacy `TmsController.getPayoffAmount` (`:80`).
   * Idempotent read — primary probe for CT-01.
   */
  async getPayoffAmountLegacy(
    accountPk: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl(`/uown/tms/getPayoffAmount/${accountPk}`);
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }

  /**
   * GET `/uown/tms/getAccountSummary/{accountPk}` — legacy `TmsController.getAccountSummary`.
   *
   * Mirrors the v1 endpoint (`/uown/tms/v1/accounts/{accountId}/summary`).
   * Added for svc#536 (LevelAI: return `lastScheduleMovedDate` and
   * `numberOfDueDateMoves`) — used to assert cross-endpoint parity.
   */
  async getAccountSummaryLegacy(
    accountPk: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsAccountSummaryResponse>> {
    const url = this.resolveUrl(`/uown/tms/getAccountSummary/${accountPk}`);
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<TmsAccountSummaryResponse>(response);
  }

  /**
   * GET `/uown/tms/getBankAccounts/{accountPk}` (legacy `TmsController`).
   * Fallback for CT-01 if `getPayoffAmount` is not enabled in the target env.
   */
  async getBankAccountsLegacy(
    accountPk: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl(`/uown/tms/getBankAccounts/${accountPk}`);
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }

  /**
   * POST `/uown/tms/addLogNote` — legacy `TmsController.addLogNote` (`:131`).
   * Append-only — writes to `uown_sv_activity_log`. Used by CT-10b to
   * prove the FQCN-comparison fix works for the legacy controller.
   */
  async addLogNoteLegacy(
    body: AddLogNoteLegacyBody,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<unknown>> {
    const url = this.resolveUrl('/uown/tms/addLogNote');
    const response = await this.request.post(url, {
      headers: {
        ...this.tmsHeaders(extraHeaders),
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 120_000,
    });
    return parseResponse<unknown>(response);
  }
}

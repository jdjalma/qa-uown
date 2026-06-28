import type { APIRequestContext } from '@playwright/test';
import { BaseClient } from './base.client.js';
import { parseResponse, type ApiResponse } from '../responses/api-response.js';
import type {
  TmsAccountSummaryResponse,
  TmsCreditCardOnFileItem,
  TmsBankAccountOnFileItem,
  TmsPayoffResponse,
  TmsMoveDueDatesResponse,
  TmsPayNearMeDeliveryResult,
  TmsContactPreferencesResponse,
} from '../responses/tms-audit.response.js';
import type { ConfigEnvironment } from '../../config/environment.js';
import type {
  AddActivityLogBody,
  AddLogNoteLegacyBody,
  TmsContactPreferencesBody,
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

  // tmsHeaders herdado de BaseClient (FIVE9 key + Accept) — usado nos GETs abaixo.

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
   * Returns `{ accountPk, amount }`.
   */
  async getPayoffAmount(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsPayoffResponse>> {
    const url = this.resolveUrl(`/uown/tms/v1/accounts/${accountId}/payoff`);
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<TmsPayoffResponse>(response);
  }

  // ── S2: TmsPaymentController ────────────────────────────────────

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/payment-methods/bank-accounts`
   * Maps to `TmsPaymentController.getBankAccounts` (`:35`).
   * Returns array of `TmsBankAccountOnFileItem`.
   */
  async getBankAccounts(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsBankAccountOnFileItem[]>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/payment-methods/bank-accounts`,
    );
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<TmsBankAccountOnFileItem[]>(response);
  }

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/payment-methods/credit-cards`
   * Maps to `TmsPaymentController.getCreditCards` (`:43`).
   * Returns array of `TmsCreditCardOnFileItem`.
   */
  async getCreditCards(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsCreditCardOnFileItem[]>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/payment-methods/credit-cards`,
    );
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<TmsCreditCardOnFileItem[]>(response);
  }

  /**
   * GET `/uown/tms/v1/accounts/{accountId}/payment-methods/credit-cards/autopay`
   * Returns the single card configured for auto-pay, or 404 if none.
   */
  async getAutopayCreditCard(
    accountId: number | string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsCreditCardOnFileItem>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/payment-methods/credit-cards/autopay`,
    );
    const response = await this.request.get(url, {
      headers: this.tmsHeaders(extraHeaders),
      timeout: 120_000,
    });
    return parseResponse<TmsCreditCardOnFileItem>(response);
  }

  // ── S2: TmsDueDateController ────────────────────────────────────

  /**
   * POST `/uown/tms/v1/accounts/{accountId}/due-dates/move`
   * Maps to `TmsDueDateController.moveDueDates`.
   * Adjusts ALL future receivable due dates forward or backward.
   *
   * Query params (no body):
   *   - `moveNumberOfDays` (required): positive = forward, negative = backward
   *   - `fromDueDate` (optional): only moves dues on/after this date (ISO YYYY-MM-DD)
   *
   * Different from `AccountClient.moveDueDatesByDays` (which targets the SVC endpoint
   * `/uown/svc/moveDueDatesByDays/{pk}` — internal). This is the external TMS surface.
   */
  async moveDueDates(
    accountId: number | string,
    moveNumberOfDays: number,
    fromDueDate?: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsMoveDueDatesResponse>> {
    let path = `/uown/tms/v1/accounts/${accountId}/due-dates/move?moveNumberOfDays=${moveNumberOfDays}`;
    if (fromDueDate) path += `&fromDueDate=${fromDueDate}`;
    const url = this.resolveUrl(path);
    const response = await this.request.post(url, {
      headers: {
        ...this.tmsHeaders(extraHeaders),
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    });
    return parseResponse<TmsMoveDueDatesResponse>(response);
  }

  /**
   * POST `/uown/tms/v1/accounts/{accountId}/paynearme/send`
   * Creates a PayNearMe payment link and delivers it via SMS and/or email.
   *
   * @param deliveryChannel - one or more channels: `'SMS'` | `'EMAIL'`
   * @param amountOverride  - optional amount override (defaults to next payment due)
   */
  async sendPayNearMePaymentLink(
    accountId: number | string,
    deliveryChannel: Array<'SMS' | 'EMAIL'>,
    amountOverride?: number,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsPayNearMeDeliveryResult[]>> {
    const channelParams = deliveryChannel.map(c => `deliveryChannel=${c}`).join('&');
    let path = `/uown/tms/v1/accounts/${accountId}/paynearme/send?${channelParams}`;
    if (amountOverride !== undefined) path += `&amountOverride=${amountOverride}`;
    const url = this.resolveUrl(path);
    const response = await this.request.post(url, {
      headers: {
        ...this.tmsHeaders(extraHeaders),
        'Content-Type': 'application/json',
      },
      timeout: 120_000,
    });
    return parseResponse<TmsPayNearMeDeliveryResult[]>(response);
  }

  /**
   * POST `/uown/tms/v1/accounts/{accountId}/contactPreferences`
   * Updates TCPA and AI opt-out preferences for a phone number on the account.
   */
  async updateContactPreferences(
    accountId: number | string,
    body: TmsContactPreferencesBody,
    extraHeaders: Record<string, string> = {},
  ): Promise<ApiResponse<TmsContactPreferencesResponse>> {
    const url = this.resolveUrl(
      `/uown/tms/v1/accounts/${accountId}/contactPreferences`,
    );
    const response = await this.request.post(url, {
      headers: {
        ...this.tmsHeaders(extraHeaders),
        'Content-Type': 'application/json',
      },
      data: body,
      timeout: 120_000,
    });
    return parseResponse<TmsContactPreferencesResponse>(response);
  }

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

import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import { parseResponse } from '../responses/api-response.js';
import type {
  CancelAccountResponseBody,
  FrequencyModsResponse,
  SvcReceivableResponse,
  DueDateMovesPage,
  DueDateAdjustmentResponse,
  PodiumInvitationResponse,
  AccountSearchCriteriaResponse,
} from '../responses/account.response.js';
import {
  type CancelAccountBody,
  type NextDueDateAdjustmentBody,
  type AccountSearchCriteriaBody,
  buildCancelAccountBody,
} from '../bodies/account.body.js';

export class AccountClient extends BaseClient {

  async cancelAccount(accountPk: string | number, body: CancelAccountBody): Promise<ApiResponse<CancelAccountResponseBody>>;
  async cancelAccount(accountPk: string | number, comment: string, refundAllPayments: boolean): Promise<ApiResponse<CancelAccountResponseBody>>;
  async cancelAccount(
    accountPk: string | number,
    bodyOrComment: CancelAccountBody | string,
    refundAllPayments?: boolean,
  ): Promise<ApiResponse<CancelAccountResponseBody>> {
    // accountPk goes in the request body (CancelAccountRequest.accountPk), not in the path.
    const body = typeof bodyOrComment === 'string'
      ? buildCancelAccountBody(accountPk, bodyOrComment, refundAllPayments!)
      : bodyOrComment;

    return this.post<CancelAccountResponseBody>('/uown/svc/cancelAccount', body);
  }

  async getFrequencyChanges(accountPk: string | number): Promise<ApiResponse<FrequencyModsResponse[]>> {
    return this.get<FrequencyModsResponse[]>(`/uown/svc/accounts/${accountPk}/frequency-changes`);
  }

  /** Returns the next unpaid receivable for an account (dueDate, amount, status). */
  async getNextReceivable(accountPk: string | number): Promise<ApiResponse<SvcReceivableResponse>> {
    return this.get<SvcReceivableResponse>(`/uown/svc/getNextReceivable/${accountPk}`);
  }

  /** Returns paginated due date moves history for an account (page 0-indexed, size default 10). */
  async getDueDateMoves(accountPk: string | number, page = 0, size = 10): Promise<ApiResponse<DueDateMovesPage>> {
    return this.get<DueDateMovesPage>(`/uown/svc/accounts/${accountPk}/due-date-moves?page=${page}&size=${size}`);
  }

  /**
   * Moves all future receivable due dates by the given number of days.
   * Creates a record in uown_due_date_moves.
   * Use positive days to move forward, negative to move back.
   * Requires scheduled_payments [move_due_date] permission.
   */
  async moveDueDatesByDays(accountPk: string | number, moveNumberOfDays: number): Promise<ApiResponse<unknown>> {
    return this.post<unknown>(`/uown/svc/moveDueDatesByDays/${accountPk}?moveNumberOfDays=${moveNumberOfDays}`);
  }

  /**
   * IVR/TMS endpoint: adjusts next due date for a single receivable (NEXT_DUE_DATE type).
   * Returns DueDateAdjustmentResponse with originalDueDate and newDueDate.
   * dueDate can be null — backend resolves from next receivable.
   * Offset limits: WEEKLY max 3, others max 7.
   */
  async adjustNextDueDate(
    accountPk: string | number,
    body: NextDueDateAdjustmentBody,
  ): Promise<ApiResponse<DueDateAdjustmentResponse>> {
    // TMS endpoints require a separate API key (FIVE9_TMS_API_KEY)
    const url = this.resolveUrl(`/uown/tms/v1/accounts/${accountPk}/next-due-date/adjustments`);
    const response = await this.request.post(url, {
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
        'Authorization': this.env.tmsApiKey,
      },
      data: body,
      timeout: 120_000,
    });
    return parseResponse<DueDateAdjustmentResponse>(response);
  }

  /** Sends a Podium review invite to the primary customer of the account (Task #442). */
  async sendPodiumLink(accountPk: string | number): Promise<ApiResponse<PodiumInvitationResponse>> {
    return this.post<PodiumInvitationResponse>(`/uown/svc/accounts/${accountPk}/podium-link`);
  }

  /**
   * Searches accounts by filter criteria (Task #501).
   * New fields: merchantName (exact case-insensitive) and location (exact case-insensitive).
   * null/blank fields are treated as "no filter" by the backend (blankToNull()).
   */
  async getAccountsByCriteria(body: AccountSearchCriteriaBody): Promise<ApiResponse<AccountSearchCriteriaResponse>> {
    return this.post<AccountSearchCriteriaResponse>('/uown/svc/getAccountsByCriteria', body);
  }
}

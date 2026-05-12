import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  TriggerScheduledTaskResponseBody,
  ScheduledTaskMetadataResponseBody,
} from '../responses/scheduled-task.response.js';

export class ScheduledTaskClient extends BaseClient {

  async triggerScheduledTask(taskName: string): Promise<ApiResponse<TriggerScheduledTaskResponseBody>> {
    return this.post<TriggerScheduledTaskResponseBody>(`/uown/svc/triggerScheduledTask/${taskName}`);
  }

  /**
   * Resumes a previously paused scheduled task by name.
   *
   * Used by CT-06 of RU05.26.1.51.1_gowSignClientTypeAdaptionForNewTemplate_505 to wake
   * the GowSign client-type sweep before triggering it. Same auth/headers as
   * `triggerScheduledTask`; returns 200 with no meaningful body on success.
   */
  async resumeScheduledTask(taskName: string): Promise<ApiResponse<unknown>> {
    return this.post<unknown>(`/uown/svc/resumeScheduledTask/${taskName}`);
  }

  async getScheduledTaskByName(taskName: string): Promise<ApiResponse<ScheduledTaskMetadataResponseBody>> {
    return this.get<ScheduledTaskMetadataResponseBody>(`/uown/svc/getScheduledTaskByName/${encodeURIComponent(taskName)}`);
  }

  /** Directly trigger the CC payments sweep (processes PENDING CC transactions with posting_date <= today) */
  async sendCreditCardPaymentsSweep(): Promise<ApiResponse<unknown>> {
    return this.post<unknown>('/uown/svc/sendCreditCardPaymentsSweep');
  }

  /** Directly trigger the ACH send sweep (submits ACH payments to the processor) */
  async sendAchPaymentsSweep(): Promise<ApiResponse<unknown>> {
    return this.post<unknown>('/uown/svc/sendACHPaymentsSweep');
  }

  /** Directly trigger the ACH status sweep (polls processor for final ACH statuses) */
  async getStatusDatePaymentsListSweep(): Promise<ApiResponse<unknown>> {
    return this.post<unknown>('/uown/svc/getStatusDatePaymentsListSweep');
  }

  /** Trigger the email queue processing sweep (sends all PENDING emails) */
  async sendEmailsSweep(): Promise<ApiResponse<unknown>> {
    return this.post<unknown>('/uown/svc/sendEmailsSweep');
  }

  /** Manually trigger the Kount access token refresh sweep (replaces in-request token regen). */
  async refreshKountAccessTokenSweep(): Promise<ApiResponse<unknown>> {
    return this.post<unknown>('/uown/svc/refreshKountAccessTokenSweep');
  }

  /** Manually trigger the GDS access token refresh sweep (replaces in-request token regen). */
  async refreshGdsAccessTokenSweep(): Promise<ApiResponse<unknown>> {
    return this.post<unknown>('/uown/svc/refreshGdsAccessTokenSweep');
  }
}

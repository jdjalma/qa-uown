import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { TriggerScheduledTaskResponseBody } from '../responses/scheduled-task.response.js';

export class ScheduledTaskClient extends BaseClient {

  async triggerScheduledTask(taskName: string): Promise<ApiResponse<TriggerScheduledTaskResponseBody>> {
    return this.post<TriggerScheduledTaskResponseBody>(`/uown/svc/triggerScheduledTask/${taskName}`);
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
}

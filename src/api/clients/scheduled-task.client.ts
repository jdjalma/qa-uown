import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type {
  TriggerScheduledTaskResponseBody,
  ScheduledTaskMetadataResponseBody,
} from '../responses/scheduled-task.response.js';
import type { CreateOrUpdateScheduledTaskBody } from '../bodies/scheduled-task.body.js';

/**
 * Exact backend Quartz task names for the R1.53.0 RightFoot ACH balance-check
 * sweeps. Use these with `triggerScheduledTask`/`getScheduledTaskByName` so the
 * Quartz name lives in ONE place (drift-prone — see [[volatile-knowledge-registry]]
 * "sweep names"). Reference cron/process-type seeds (backend, NOT asserted here):
 *   DailyAchBalanceCheckSweep — cron `0 0 15 * * ?`,  process type DAILY_RERUN_DELINQUENT
 *   RerunAchBalanceCheckSweep — cron `0 0 9 ? * THU`, process type RERUN
 */
export const SCHEDULED_TASK_NAMES = {
  DAILY_ACH_BALANCE_CHECK: 'DailyAchBalanceCheckSweep',
  RERUN_ACH_BALANCE_CHECK: 'RerunAchBalanceCheckSweep',
} as const;

export class ScheduledTaskClient extends BaseClient {

  async triggerScheduledTask(taskName: string): Promise<ApiResponse<TriggerScheduledTaskResponseBody>> {
    return this.post<TriggerScheduledTaskResponseBody>(`/uown/svc/triggerScheduledTask/${taskName}`);
  }

  /**
   * Creates or updates a scheduled task (Quartz sweep) by posting the
   * `ScheduledTask` JPA entity. The canonical test use is narrowing a sweep's
   * `sqlToPickAccounts` to a single target row before triggering it — see
   * `buildCreateOrUpdateScheduledTaskBody`.
   *
   * ⚠️ Heavy, suite-wide side effect (mutates a shared scheduled task). Callers
   * MUST restore the original `sqlToPickAccounts` in a try/finally. Used only by
   * the opt-in destructive CT-M1-LIVE.
   */
  async createOrUpdateScheduledTask(
    body: CreateOrUpdateScheduledTaskBody,
  ): Promise<ApiResponse<ScheduledTaskMetadataResponseBody>> {
    return this.post<ScheduledTaskMetadataResponseBody>('/uown/svc/createOrUpdateScheduledTask', body);
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

  /**
   * Trigger the R1.53.0 daily RightFoot ACH balance-check sweep (process type
   * DAILY_RERUN_DELINQUENT; backend cron `0 0 15 * * ?`). Convenience wrapper over
   * the generic `triggerScheduledTask` with the exact Quartz task name.
   */
  async dailyAchBalanceCheckSweep(): Promise<ApiResponse<TriggerScheduledTaskResponseBody>> {
    return this.triggerScheduledTask(SCHEDULED_TASK_NAMES.DAILY_ACH_BALANCE_CHECK);
  }

  /**
   * Trigger the R1.53.0 RightFoot ACH balance-check RERUN sweep (process type
   * RERUN; backend cron `0 0 9 ? * THU`). Convenience wrapper over the generic
   * `triggerScheduledTask` with the exact Quartz task name.
   */
  async rerunAchBalanceCheckSweep(): Promise<ApiResponse<TriggerScheduledTaskResponseBody>> {
    return this.triggerScheduledTask(SCHEDULED_TASK_NAMES.RERUN_ACH_BALANCE_CHECK);
  }
}

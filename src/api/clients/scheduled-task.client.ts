import { BaseClient } from './base.client.js';
import type { ApiResponse } from '../responses/api-response.js';
import type { TriggerScheduledTaskResponseBody } from '../responses/scheduled-task.response.js';

export class ScheduledTaskClient extends BaseClient {

  async triggerScheduledTask(taskName: string): Promise<ApiResponse<TriggerScheduledTaskResponseBody>> {
    return this.post<TriggerScheduledTaskResponseBody>(`/uown/svc/triggerScheduledTask/${taskName}`);
  }
}

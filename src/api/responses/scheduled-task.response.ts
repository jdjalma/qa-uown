import type { BaseResponseBody } from './base.response.js';

export interface TriggerScheduledTaskResponseBody extends BaseResponseBody {
  taskName?: string;
}

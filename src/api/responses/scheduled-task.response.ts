import type { BaseResponseBody } from './base.response.js';

export interface TriggerScheduledTaskResponseBody extends BaseResponseBody {
  taskName?: string;
}

/**
 * Response for GET /uown/svc/getScheduledTaskByName/{name}
 * Maps to ScheduledTask JPA entity (Jackson-serialized).
 */
export interface ScheduledTaskMetadataResponseBody {
  pk?: number;
  scheduledTaskName: string;
  groupName?: string;
  fixedRate?: number | null;
  cronTrigger: string;
  sqlToPickAccounts: string;
  templateName?: string | null;
  templateVersion?: number | null;
  lastTriggerTime?: string | null;
  isActive?: boolean;
  isNativeQuery?: boolean;
  [key: string]: unknown;
}

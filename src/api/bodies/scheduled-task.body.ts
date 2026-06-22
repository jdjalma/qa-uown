import type { ScheduledTaskMetadataResponseBody } from '../responses/scheduled-task.response.js';

/**
 * Request body for POST /uown/svc/createOrUpdateScheduledTask.
 *
 * The backend accepts the `ScheduledTask` JPA entity verbatim (same camelCase
 * shape that GET /uown/svc/getScheduledTaskByName/{name} returns). The
 * canonical write path for tests is: read the task via `getScheduledTaskByName`,
 * mutate one field (typically `sqlToPickAccounts`), and POST it back.
 *
 * `pk` MUST be preserved so the backend UPDATEs the existing row rather than
 * INSERTing a duplicate. All other fields are passed through unchanged.
 *
 * ⚠️ Mutating a shared scheduled task is a heavy, suite-wide side effect — used
 * ONLY by the opt-in destructive CT (svc#559 CT-M1-LIVE) under a try/finally
 * that restores the original `sqlToPickAccounts`. Not for the read-only suite.
 */
export interface CreateOrUpdateScheduledTaskBody extends ScheduledTaskMetadataResponseBody {
  scheduledTaskName: string;
  cronTrigger: string;
  sqlToPickAccounts: string;
}

/**
 * Builds a createOrUpdate body from a metadata snapshot, overriding only the
 * provided fields. Preserves `pk` (in-place UPDATE) and every other column.
 */
export function buildCreateOrUpdateScheduledTaskBody(
  snapshot: ScheduledTaskMetadataResponseBody,
  overrides: Partial<CreateOrUpdateScheduledTaskBody> = {},
): CreateOrUpdateScheduledTaskBody {
  return {
    ...snapshot,
    scheduledTaskName: snapshot.scheduledTaskName,
    cronTrigger: snapshot.cronTrigger,
    sqlToPickAccounts: snapshot.sqlToPickAccounts,
    ...overrides,
  };
}

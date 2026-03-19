/**
 * Worker-Scoped Unique ID Helper
 *
 * Guarantees unique data per process/worker — no collisions in parallel execution.
 * Combines process.pid (unique per terminal) + TEST_WORKER_INDEX (unique per Playwright worker).
 */

const PID_PART = process.pid.toString().slice(-5).padStart(5, '0');
const WORKER_PART = (process.env.TEST_WORKER_INDEX ?? '0').padStart(2, '0');

/** Unique identifier for this process + worker combination */
export const RUN_ID = `${PID_PART}${WORKER_PART}`;

/**
 * Returns a numeric seed unique to this worker run.
 * Useful for generating unique numeric data (e.g. amounts, IDs).
 */
export function uniqueSeed(index = 0): number {
  const ts = Date.now() % 100000;
  const run = parseInt(RUN_ID) % 10000;
  return run * 100000 + ts + index;
}

/**
 * Returns a unique email address scoped to this worker.
 * Format: `{prefix}_{RUN_ID}_{timestamp}_{index}@e2e.test`
 */
export function uniqueEmail(prefix = 'test', index = 0): string {
  const ts = Date.now().toString().slice(-6);
  const idx = index > 0 ? `_${index}` : '';
  return `${prefix}_${RUN_ID}_${ts}${idx}@e2e.test`;
}

/**
 * Returns a unique name scoped to this worker.
 * Format: `{base} {RUN_ID}{index}`
 */
export function uniqueName(base = 'Empresa', index = 0): string {
  const idx = index > 0 ? ` ${index}` : '';
  return `${base} ${RUN_ID}${idx}`;
}

/**
 * Returns the worker run ID (PID + worker index).
 * Useful for diagnostic logs: `[worker=${getWorkerRunId()}]`
 */
export function getWorkerRunId(): string {
  return RUN_ID;
}

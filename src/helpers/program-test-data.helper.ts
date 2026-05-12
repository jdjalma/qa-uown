/**
 * Helper functions for creating, cleaning up, and snapshotting test programs
 * in the scheduleProgramActivationDeactivationDates feature test suite.
 *
 * All operations target the merchant API via `MerchantClient` — no direct DB
 * mutations (per security rules). DB SELECTs for validation are allowed and
 * performed in individual CTs via `DatabaseHelpers`.
 *
 * Snapshot/restore pattern (`withProgramSnapshot`) is designed for CTs that
 * exercise the sweep endpoint or other operations that mutate activation dates
 * on an existing program — it restores the original state after the test body
 * completes (or throws).
 */

import type { ApiClients } from '../support/base-test.js';
import type { ProgramInfo } from '../api/responses/merchant.response.js';
import { buildProgramInfoBody, type ProgramInfoBodyOverrides } from '../api/bodies/program-info.body.js';
import { generateTestProgramName } from '../data/test-programs.js';

// ── Types ────────────────────────────────────────────────────────────

export interface CreateTestProgramOptions {
  /** Human-readable CT identifier, e.g. "CT-01". Used in program name. */
  ctId: string;
  /** Worker-scoped run ID from `RUN_ID` / `getWorkerRunId()`. */
  runId: string;
  /** Target merchant PK (numeric, obtained from getMerchantsByRefCode or DB). */
  merchantPk: number;
  /** Term in months. Defaults to 13. */
  termMonths?: 13 | 16;
  /** Additional overrides applied on top of defaults (dates, moneyFactor, etc.). */
  overrides?: Omit<ProgramInfoBodyOverrides, 'merchantPk' | 'programName' | 'termMonths'>;
}

// ── Create ───────────────────────────────────────────────────────────

/**
 * Creates a new test program via `POST /uown/createOrUpdateProgram`.
 *
 * The program name is generated from `ctId` + `runId` to avoid collisions
 * across parallel workers. Returns the persisted `ProgramInfo` from the response.
 *
 * @throws if the API returns a non-successful status or if `programInfo` is absent.
 */
export async function createTestProgram(
  api: ApiClients,
  options: CreateTestProgramOptions,
): Promise<ProgramInfo> {
  const { ctId, runId, merchantPk, termMonths = 13, overrides = {} } = options;

  const programName = generateTestProgramName(ctId, runId);
  const body = buildProgramInfoBody({
    merchantPk,
    programName,
    termMonths,
    ...overrides,
  });

  const response = await api.merchant.createOrUpdateProgram(body);

  if (!response.body?.programInfo) {
    throw new Error(
      `createTestProgram: API did not return programInfo. ` +
      `Status: ${response.status}. Program: ${programName}`,
    );
  }

  return response.body.programInfo;
}

// ── Cleanup ──────────────────────────────────────────────────────────

/**
 * Soft-deactivates a test program by setting `deactivationDate` to a past date.
 *
 * The backend does not expose a DELETE endpoint for programs — deactivation is
 * the correct way to retire a test program without affecting other merchants
 * that may share the program entry.
 *
 * Note: if `programPk` was obtained from `MerchantProgram.pk` (the junction PK),
 * use `programInfo.programPk` instead — they are different columns.
 */
export async function cleanupTestProgram(
  api: ApiClients,
  programPk: number,
): Promise<void> {
  const body = buildProgramInfoBody({
    programPk,
    // Set deactivation to past date so the program becomes inactive immediately.
    // activationDate left undefined (no change) to preserve audit trail.
    deactivationDate: '2020-01-01',
    active: false,
  });

  await api.merchant.createOrUpdateProgram(body);
}

// ── Snapshot / restore ───────────────────────────────────────────────

/**
 * Snapshot + restore pattern for CTs that mutate activation/deactivation dates
 * on an existing program (e.g., sweep CTs that call the sweep endpoint directly).
 *
 * Captures `activationDate`, `deactivationDate`, and `active` before the test
 * body runs, then restores them after — regardless of whether the body throws.
 *
 * Usage:
 *   const result = await withProgramSnapshot(api, programPk, programInfo, async () => {
 *     // mutate the program, run assertions
 *     return someValue;
 *   });
 *
 * @param api         - ApiClients fixture from the test
 * @param programPk   - `programInfo.programPk` of the program to snapshot
 * @param snapshot    - The ProgramInfo captured before mutation (from getMerchantProgramsByMerchantPk)
 * @param fn          - Async test body; receives no arguments
 */
export async function withProgramSnapshot<T>(
  api: ApiClients,
  programPk: number,
  snapshot: Pick<ProgramInfo, 'activationDate' | 'deactivationDate' | 'active'>,
  fn: () => Promise<T>,
): Promise<T> {
  let result: T;

  try {
    result = await fn();
  } finally {
    // Always restore — even if fn() throws.
    const restoreBody = buildProgramInfoBody({
      programPk,
      activationDate: snapshot.activationDate ?? undefined,
      deactivationDate: snapshot.deactivationDate ?? undefined,
      active: snapshot.active,
    });
    await api.merchant.createOrUpdateProgram(restoreBody);
  }

  return result!;
}

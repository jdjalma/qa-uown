/**
 * Test program pool for the scheduleProgramActivationDeactivationDates feature.
 *
 * Each CT creates programs with a unique name prefix to avoid collisions between
 * parallel runs. Names follow the pattern:
 *   QA-SCHED-{ctId}-{runId}
 *
 * Date variants (PROGRAM_DATE_VARIANTS) are evaluated at runtime so they always
 * reflect today's date — never import and cache at module load time.
 *
 * Usage:
 *   import { generateTestProgramName, PROGRAM_DATE_VARIANTS } from '@data/test-programs.js';
 *   import { buildProgramInfoBody } from '@api/bodies/program-info.body.js';
 *   import { calculateDateISO } from '@helpers/date.helpers.js';
 *
 *   const name = generateTestProgramName('CT-01', RUN_ID);
 *   const body = buildProgramInfoBody({
 *     merchantPk,
 *     programName: name,
 *     termMonths: 13,
 *     ...PROGRAM_DATE_VARIANTS.active_today(),
 *   });
 */

import { calculateDateISO } from '../helpers/date.helpers.js';

// ── Prefix ───────────────────────────────────────────────────────────

export const TEST_PROGRAM_PREFIX = 'QA-SCHED';

// ── Name generator ───────────────────────────────────────────────────

/**
 * Generates a unique, collision-safe program name for a given CT and run.
 *
 * @param ctId  - CT identifier, e.g. "CT-01" or "CT-DateSelect-13to16-UOWN"
 * @param runId - Worker-scoped run ID from `getWorkerRunId()` / `RUN_ID`
 */
export function generateTestProgramName(ctId: string, runId: string): string {
  return `${TEST_PROGRAM_PREFIX}-${ctId}-${runId}`;
}

// ── Spec type ────────────────────────────────────────────────────────

export interface TestProgramSpec {
  /** CT identifier used as part of the generated program name. */
  id: string;
  termMonths: 13 | 16;
  /** ISO date string or null (null = no lower bound). */
  initialActivation?: string | null;
  /** ISO date string or null (null = no upper bound). */
  initialDeactivation?: string | null;
  /** Human-readable description of this spec's purpose. */
  purpose: string;
}

// ── Date variants ────────────────────────────────────────────────────

/**
 * Runtime-evaluated date variant factories for program activation/deactivation.
 *
 * Each property is a function — call it at test time to get ISO dates reflecting
 * the actual today. Never call at module load time or cache the result.
 *
 * Matches the variants documented in src/fixtures/api-templates/program-info-variants.json.
 */
export const PROGRAM_DATE_VARIANTS = {
  /**
   * Program active right now.
   * activationDate = yesterday, deactivationDate = tomorrow.
   * Backend recomputes active=true from the window.
   */
  active_today: () => ({
    activationDate: calculateDateISO(-1),
    deactivationDate: calculateDateISO(1),
    active: true as const,
  }),

  /**
   * Program with future activation (not yet active).
   * activationDate = today+30, deactivationDate = null.
   * active flag is overridden by backend — date window makes it inactive.
   * Use for CT-API-05.
   */
  inactive_future: () => ({
    activationDate: calculateDateISO(30),
    deactivationDate: null,
    active: true as const,
  }),

  /**
   * Program with past deactivation (already inactive).
   * activationDate = null, deactivationDate = yesterday.
   * Backend recomputes active=false.
   */
  inactive_past: () => ({
    activationDate: null,
    deactivationDate: calculateDateISO(-1),
    active: true as const,
  }),

  /**
   * No date bounds — program always active.
   * activationDate = null, deactivationDate = null.
   */
  both_null: () => ({
    activationDate: null,
    deactivationDate: null,
    active: true as const,
  }),

  /**
   * Invalid date order: activationDate > deactivationDate.
   * Backend must respond 400. Use for CT-API-06.
   * Fixed dates (not runtime) to ensure they remain in the correct order for the assertion.
   */
  invalid_order: () => ({
    activationDate: '2026-12-01',
    deactivationDate: '2026-01-01',
  }),

  /**
   * Same-day window: activationDate == deactivationDate == today.
   * Program is active for exactly one day. Use for CT-24.
   */
  same_day: () => ({
    activationDate: calculateDateISO(0),
    deactivationDate: calculateDateISO(0),
    active: true as const,
  }),
} as const;

export type ProgramDateVariantKey = keyof typeof PROGRAM_DATE_VARIANTS;

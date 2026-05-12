/**
 * Centralized Test Configuration
 *
 * Single source of truth for all test configuration values.
 * Reads from environment variables with sensible defaults.
 */

export interface TestConfig {
  /** Target environment: sandbox, qa1, qa2, stg, dev */
  env: string;

  /** Default test timeout in milliseconds */
  timeout: number;

  /** Timeout multiplier for slow environments */
  timeoutMultiplier: number;

  /** Action timeout (click, fill, etc.) */
  actionTimeout: number;

  /** Navigation timeout (goto, waitForURL) */
  navigationTimeout: number;

  /** Number of parallel workers */
  workers: number;

  /** Number of retries on failure */
  retries: number;

  /** Whether running in CI/CD */
  ci: boolean;

  /** Enable strict mode (fail on warnings) */
  strictMode: boolean;

  /** Enable Allure reporting */
  allureEnabled: boolean;

  /** Screenshots: 'off' | 'on' | 'only-on-failure' */
  screenshots: 'off' | 'on' | 'only-on-failure';

  /** Video recording: 'off' | 'on' | 'on-first-retry' | 'retain-on-failure' */
  video: 'off' | 'on' | 'on-first-retry' | 'retain-on-failure';

  /** Trace recording: 'off' | 'on' | 'on-first-retry' | 'retain-on-failure' */
  trace: 'off' | 'on' | 'on-first-retry' | 'retain-on-failure';
}

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === 'true' || val === '1';
}

function envInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function envFloat(key: string, fallback: number): number {
  const val = process.env[key];
  if (val === undefined) return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

export function loadTestConfig(): TestConfig {
  const ci = envBool('CI', false);
  const timeoutMultiplier = envFloat('TIMEOUT_MULTIPLIER', 1);

  return {
    env: process.env.ENV || 'sandbox',
    timeout: 120_000 * timeoutMultiplier,
    timeoutMultiplier,
    actionTimeout: 15_000 * timeoutMultiplier,
    navigationTimeout: 30_000 * timeoutMultiplier,
    workers: envInt('WORKERS', 1),
    retries: ci ? 2 : envInt('RETRIES', 0),
    ci,
    strictMode: envBool('STRICT_MODE', false),
    allureEnabled: envBool('ALLURE', false),
    screenshots: ci
      ? 'only-on-failure'
      : (process.env.SCREENSHOTS as TestConfig['screenshots']) || 'only-on-failure',
    video: ci
      ? 'retain-on-failure'
      : (process.env.VIDEO as TestConfig['video']) || 'off',
    trace: ci
      ? 'retain-on-failure'
      : (process.env.TRACE as TestConfig['trace']) || 'on-first-retry',
  };
}

/** Singleton config instance */
export const testConfig = loadTestConfig();

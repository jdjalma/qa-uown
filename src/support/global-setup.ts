/**
 * Global Setup
 *
 * Runs once before any test worker starts. Validates that the required
 * environment variables are present so tests fail fast with a clear message
 * instead of cryptic errors deep inside a test run.
 */
import { VALID_ENVS } from '../config/environment.js';

interface EnvCheck {
  key: string;
  description: string;
  required: boolean;
}

function buildChecks(env: string): EnvCheck[] {
  const suffix = env === 'sandbox' ? 'SBX' : env.toUpperCase();

  return [
    // Auth
    { key: 'UOWN_API_KEY', description: 'UOWN SVC API key', required: true },
    { key: 'UOWN_API_AUTHORIZATION', description: 'UOWN API Authorization header', required: true },
    // DB — at least one of the two patterns must be set
    {
      key: `UOWN_DB_URL_${suffix}`,
      description: `PostgreSQL JDBC URL for ${env} (or DB_CONNECTION_STRING)`,
      required: false,
    },
    { key: 'DB_CONNECTION_STRING', description: 'Direct pg connection string (overrides UOWN_DB_URL_*)', required: false },
    // Email — only warn, not fatal (email tests are optional)
    { key: 'EMAIL', description: 'Gmail address for IMAP OTP checks', required: false },
  ];
}

export default async function globalSetup(): Promise<void> {
  const env = process.env.ENV || 'sandbox';

  // Validate env name early
  if (!VALID_ENVS.includes(env as (typeof VALID_ENVS)[number])) {
    throw new Error(
      `[global-setup] Invalid ENV="${env}". Valid values: ${VALID_ENVS.join(', ')}`,
    );
  }

  const checks = buildChecks(env);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const check of checks) {
    const value = process.env[check.key];
    if (!value) {
      if (check.required) {
        errors.push(`  ❌ ${check.key} — ${check.description}`);
      } else {
        warnings.push(`  ⚠️  ${check.key} — ${check.description} (optional)`);
      }
    }
  }

  // DB requires at least one of the two patterns
  const suffix = env === 'sandbox' ? 'SBX' : env.toUpperCase();
  const hasDb = !!process.env[`UOWN_DB_URL_${suffix}`] || !!process.env.DB_CONNECTION_STRING;
  if (!hasDb) {
    errors.push(`  ❌ UOWN_DB_URL_${suffix} or DB_CONNECTION_STRING — PostgreSQL connection for ${env}`);
  }

  if (warnings.length > 0) {
    console.warn(`\n[global-setup] Optional env vars missing for ENV=${env}:\n${warnings.join('\n')}\n`);
  }

  if (errors.length > 0) {
    throw new Error(
      `\n[global-setup] Missing required env vars for ENV=${env}:\n${errors.join('\n')}\n` +
      `\nCopy .env.example → .env and fill in the required values.\n`,
    );
  }

  console.log(`[global-setup] ENV=${env} — configuration OK`);
}

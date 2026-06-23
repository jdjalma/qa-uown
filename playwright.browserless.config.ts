import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE config (the main playwright.config.ts does this; the spec's
// beforeAll reads process.env.UOWN_DB_*_SBX directly, so it must be loaded).
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * TEMPORARY browserless config to run the Sticky recover/cancel-sweep DB/API-only task spec.
 * No browser, no auth dependency, single worker, serial. Delete after the run.
 * (There is no permanent browserless task-testing project — both task-testing-*
 * projects require a portal tag + browser auth.)
 */
export default defineConfig({
  testDir: './docs/taskTestingUown/RU06.26.1.53.0_stickyRecoverCancelSweepMarksCanceledLocally',
  timeout: 600_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  projects: [{ name: 'sticky', use: {} }],
});

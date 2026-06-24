/**
 * Test context fixture - single entry point for all test imports.
 * Re-exports from the authoritative source (base-test.ts).
 */
export { test, expect } from '../support/base-test.js';
export type { TestContext, ApiClients, BaseTestFixtures as TestFixtures, TestFixtureOptions } from '../support/base-test.js';
export type {
  SetupFixtureOptions,
  ApprovedApplicationResult,
  FundedAccountResult,
} from '../support/base-test.js';
export type { TestOptions } from '../config/test-options.js';

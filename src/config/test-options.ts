/**
 * Test Options & Fixtures for API-only tests (no browser hooks).
 *
 * For E2E tests with hooks (animations, screenshots, etc.), use:
 *   import { test, expect } from '../support/base-test.js';
 *
 * This file re-exports from base-test to avoid duplication.
 */
export { test, expect } from '../support/base-test.js';
export type { TestContext, ApiClients, BaseTestFixtures as TestFixtures, TestFixtureOptions } from '../support/base-test.js';

export interface TestOptions {
  env: string;
  state: string;
  merchant: string;
  achPaymentDate: string;
  achPaymentAmount: string;
  ccPaymentDate: string;
  ccPaymentAmount: string;
  timeoutMultiplier: number;
  checksEnabled: boolean;
  strictMode: boolean;
  servicingEnabled: boolean;
  websiteEnabled: boolean;
}

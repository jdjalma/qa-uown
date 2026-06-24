/**
 * Unified barrel export for fintech-playwright
 *
 * Single entry point that re-exports all public APIs from every module.
 * Use this for convenient imports when you need symbols from multiple modules:
 *
 *   import { BasePage, ApplicationClient, SELECTORS, test, expect } from '@src/index.js';
 *
 * For module-specific imports (preferred in tests), continue using path aliases:
 *
 *   import { test, expect } from '@support/base-test.js';
 *   import { SELECTORS } from '@selectors/index.js';
 *
 * ── Conflict Resolution ─────────────────────────────────────────────
 *
 * Several modules re-export symbols from other modules for backwards
 * compatibility. To avoid ambiguous re-exports at the unified level:
 *
 *  - TEST_CARDS, ALL_TEST_CARDS, VALID_TEST_CARDS, INVALID_TEST_CARDS
 *    → canonical source is src/data/test-cards.ts (via data barrel)
 *    → config/constants.ts and types/payment.types.ts re-export them,
 *      so config and types use selective exports to avoid duplication.
 *
 *  - test, expect, TestContext, ApiClients, TestFixtures
 *    → canonical source is src/support/ (via base-test.ts)
 *    → fixtures/ and config/test-options.ts re-export them,
 *      so fixtures uses a namespace export.
 *
 *  - TestOptions is unique to config/test-options.ts and is exported
 *    directly from the config barrel.
 */

// ── Pages ──────────────────────────────────────────────────────────
// Page Object Model: BasePage, LoginPage, SearchPage, MerchantPage,
// plus all portal-specific pages (Origination, Servicing, Website, AMS).
// NOTE: ContractPage IS exported from origination/index.ts barrel.
export * from './pages/index.js';

// ── API Layer ──────────────────────────────────────────────────────
// API clients (BaseClient, ApplicationClient, etc.),
// request bodies, and typed response interfaces.
export * from './api/index.js';

// ── Helpers ────────────────────────────────────────────────────────
// Utility functions: common, date, downloads, email, table, validation,
// template-engine, test-data, auth, navigation, api-setup.
// NOTE: DatabaseHelpers is now re-exported from the helpers barrel
// (src/helpers/index.ts) — prefer '@helpers/index.js' over the module.
export * from './helpers/index.js';

// ── Selectors ──────────────────────────────────────────────────────
// Centralized SELECTORS constant and all selector type definitions.
export * from './selectors/index.js';

// ── Test Data ──────────────────────────────────────────────────────
// Merchants, test cards (canonical source), test accounts,
// state/address mappings, TireAgent/PayPair data.
export * from './data/index.js';

// ── Types ──────────────────────────────────────────────────────────
// Enums (Portal, LeadStatus, TestTag, FeeType, etc.),
// status types, and payment types.
// EXCLUDES: VALID_TEST_CARDS, INVALID_TEST_CARDS (re-exported from
// data/test-cards.ts — canonical source is data barrel above).
export * from './types/enums.js';
export * from './types/status.types.js';
export { FeeType, type CreditCardInfo, type PaymentData } from './types/payment.types.js';

// ── Support ────────────────────────────────────────────────────────
// Test runner (test, expect), config singleton, hooks, browser profiles.
// This is the canonical source for test/expect/TestContext/ApiClients.
export * from './support/index.js';

// ── Config ─────────────────────────────────────────────────────────
// Environment config, constants, test options, legacy BaseApiClient.
// EXCLUDES: TEST_CARDS (re-exported from data/test-cards.ts — canonical
// source is data barrel above).
export {
  ConfigEnvironment,
  type UserRole,
  type Credentials,
  type EnvironmentConfig,
} from './config/environment.js';
export {
  TIMEOUTS,
  INVOICE_DEFAULTS,
  TEST_BANK,
  generateTestSSN,
  generateRunId,
  generateTestPhone,
} from './config/constants.js';
export { type TestOptions } from './config/test-options.js';
export { BaseApiClient, type ApiClientOptions } from './config/base-api-client.js';

// ── Fixtures (namespace) ───────────────────────────────────────────
// Re-exports test/expect/types from support — exposed as namespace
// to avoid duplicate symbol conflicts with the support barrel above.
// Use for explicit fixture-scoped imports:
//   import { Fixtures } from '@src/index.js';
//   const { TestOptions } = Fixtures;
export * as Fixtures from './fixtures/index.js';

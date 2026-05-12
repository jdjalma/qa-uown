/**
 * Centralized constants for the entire test framework.
 * All hard-coded values should live here.
 */
import { randomInt } from 'node:crypto';
import { RUN_ID } from '@helpers/worker-id.helper.js';

// ── Timeouts (ms) ───────────────────────────────────────────────────

export const TIMEOUTS = {
  /** Default spinner wait */
  SPINNER: 30_000,
  /**
   * Helper-level navigation timeout (15s).
   * NOTE: The Playwright config navigation timeout is 30s (in support/config.ts)
   * and is multiplied by TIMEOUT_MULTIPLIER. This constant is used by page object
   * helpers and is NOT multiplied — keep them in sync if you change one.
   */
  NAVIGATION: 15_000,
  /** Toast notification visibility */
  TOAST: 5_000,
  /** Toast dismiss click */
  TOAST_DISMISS: 2_000,
  /** Modal open wait */
  MODAL: 10_000,
  /** Element presence check */
  ELEMENT_PRESENCE: 3_000,
  /** Database polling interval (initial) */
  DB_POLL_INITIAL: 100,
  /** Database polling interval (max after backoff) */
  DB_POLL_MAX: 2_000,
  /** Database polling backoff factor */
  DB_POLL_BACKOFF: 1.5,
  /** Default database wait timeout */
  DB_WAIT: 30_000,
} as const;

// ── Test Credit Cards ───────────────────────────────────────────────
// Consolidated in src/data/test-cards.ts — re-exported here for backwards compat.
export { TEST_CARDS } from '@data/index.js';

// ── Application Defaults ────────────────────────────────────────────

/** Default IP address used in test application submissions */
export const DEFAULT_TEST_IP = '192.168.0.2';

// ── Invoice / Payment Defaults ──────────────────────────────────────

export const INVOICE_DEFAULTS = {
  LOCALE: 'en_US',
  STORE_NUMBER: '1',
  PAYMENT_FREQUENCY: 'WEEKLY',
  INVOICE_NUMBER: 'R91931',
  ORDER_TYPE: '1',
  MERCHANDISE_SUBTOTAL: '800.00',
  DISCOUNT_AMOUNT: '0.00',
  DELIVERY_CHARGE: '50.00',
  INSTALLATION_CHARGE: '100.00',
  SALES_TAX: '60.00',
  MISCELLANEOUS_FEES: '300.00',
  DEPOSIT_AMOUNT: '0.00',
  ORDER_TOTAL: '1310.00',
} as const;

// ── Bank / ACH Test Data ────────────────────────────────────────────

export const TEST_BANK = {
  /** Legacy bank account number (used by PayTomorrow portal) */
  ACCOUNT_NUMBER: '123456789',
  /** Legacy routing number */
  ROUTING_NUMBER: '021000021',
  /** Standard test routing number — used across contract pages, API submissions, and partner portals */
  DEFAULT_ROUTING: '123456780',
  /** Standard test account number (12 digits) — used in contract pages and API submissions */
  DEFAULT_ACCOUNT: '160781900000',
  /** Short test account number (8 digits) — used in CC decline checks and some contract pages */
  DEFAULT_ACCOUNT_SHORT: '16078190',
  /** Default bank account type */
  DEFAULT_TYPE: 'CHECKING',
} as const;

// ── SSN Generation ──────────────────────────────────────────────────

/**
 * Generates a unique test SSN.
 * SSN not ending in 9 = APPROVED, ending in 9 = DENIED.
 */
export function generateTestSSN(approved: boolean): string {
  if (approved) {
    return `${100000000 + randomInt(899999998)}`;
  }
  // 8 random digits (10000000..99999999, 9-digit space starting at 1) + "9" suffix = 9 chars total.
  // Backend rejects SSNs without exactly 9 digits — earlier `100000000 + randomInt(89999999) + '9'`
  // produced 10 chars and surfaced as `sorErrorDescription="SSN should have 9 digits"` (pitfall #12).
  return `${10000000 + randomInt(89999999)}9`;
}

/**
 * Generates a unique run ID to avoid timestamp collisions in parallel tests.
 * Uses worker-scoped PID + worker index for parallel safety.
 */
export function generateRunId(): string {
  return `${RUN_ID}-${Date.now().toString().slice(-6)}-${randomInt(0, 46656).toString(36).padStart(3, '0')}`;
}

/**
 * Generates a random 10-digit phone number to avoid duplicate detection.
 */
export function generateTestPhone(): string {
  return `${200 + randomInt(799)}${1000000 + randomInt(9000000)}`;
}

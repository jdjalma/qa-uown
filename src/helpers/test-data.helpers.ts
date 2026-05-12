/**
 * Test Data Builder
 *
 * Eliminates repeated test data generation patterns across E2E and hybrid tests.
 * Consolidates: ConfigEnvironment creation, address lookup, merchant config,
 * runId generation, and applicant/order object construction.
 */
import { ConfigEnvironment, type EnvName, generateRunId, generateTestSSN, generateTestPhone } from '@config/index.js';
import { getAddressForState, type AddressData, getMerchant, type MerchantConfig } from '@data/index.js';
import type { MerchantInfo, ApplicantInfo, OrderInfo } from '@api/bodies/index.js';

// ── Options ─────────────────────────────────────────────────────────

export interface BuildTestDataOptions {
  /**
   * Environment name. Optional — defaults to `process.env.ENV || 'sandbox'`.
   * Tests should usually omit this and let the env come from `.env`.
   */
  env?: string;
  /** US state code (e.g. 'NY', 'FL', 'CA') */
  state: string;
  /** Merchant key from merchants.ts (e.g. 'TireAgent', 'ProgressMobility') */
  merchant: string;
  /** Order total as string (e.g. '621', '6000') */
  orderTotal: string;
  /** Order description prefix (default: 'Test') */
  orderDescription?: string;
  /** Whether the SSN should produce an APPROVED result (default: true) */
  approved?: boolean;
  /**
   * @deprecated No longer needed — names are always alpha-only now.
   * Kept for backwards compatibility; has no effect.
   */
  sanitizeNames?: boolean;
  /**
   * Custom email override. If not provided, generates a unique alias via
   * ConfigEnvironment.uniqueEmailAlias.
   */
  emailOverride?: string;
  /**
   * Custom date of birth in MM/DD/YYYY format.
   * Default: '01/01/1984'
   */
  dob?: string;
}

// ── Result ──────────────────────────────────────────────────────────

export interface TestData {
  /**
   * ConfigEnvironment instance for this env.
   * NOTE: In tests, prefer the `testEnv` fixture (from base-test) for page/API calls —
   * it is scoped to the test worker. This field is useful for URL/key access in
   * helper functions that don't have fixture access.
   */
  env: ConfigEnvironment;
  address: AddressData;
  merchantConfig: MerchantConfig;
  merchant: MerchantInfo;
  applicant: ApplicantInfo;
  order: OrderInfo;
  runId: string;
}

// ── Builder ─────────────────────────────────────────────────────────

export function buildTestData(options: BuildTestDataOptions): TestData {
  const {
    env: envOverride,
    state,
    merchant: merchantName,
    orderTotal,
    orderDescription = 'Test',
    approved = true,
    emailOverride,
    dob = '01/01/1984',
  } = options;

  const envName = envOverride ?? process.env.ENV ?? 'sandbox';

  const env = new ConfigEnvironment(envName as EnvName);
  const address = getAddressForState(state);
  const merchantConfig = getMerchant(merchantName, envName);
  const runId = generateRunId();

  const merchant: MerchantInfo = {
    username: merchantConfig.username,
    password: merchantConfig.password,
    number: merchantConfig.number,
  };

  // Name suffix is always alpha-only (no numbers/hyphens) — required by application name fields
  const nameSuffix = runId.replace(/[^a-zA-Z]/g, '').slice(0, 8) || 'abcdef';

  const applicant: ApplicantInfo = {
    firstName: `TestFN${nameSuffix}`,
    lastName: `TestLN${nameSuffix}`,
    email: emailOverride ?? env.uniqueEmailAlias,
    ssn: generateTestSSN(approved),
    phone: generateTestPhone(),
    address: address.street,
    city: address.city,
    state,
    zip: address.zipCode,
    dob,
  };

  const order: OrderInfo = {
    orderTotal,
    description: `${orderDescription} - ${runId}`,
  };

  return { env, address, merchantConfig, merchant, applicant, order, runId };
}

/**
 * Test Data Builder
 *
 * Eliminates repeated test data generation patterns across E2E and hybrid tests.
 * Consolidates: ConfigEnvironment creation, address lookup, merchant config,
 * runId generation, and applicant/order object construction.
 */
import { ConfigEnvironment, type EnvName, generateRunId, generateTestSSN, generateTestPhone } from '@config/index.js';
import {
  getAddressForState, type AddressData, getMerchant, type MerchantConfig,
  randomPerson, type SsnStrategy,
} from '@data/index.js';
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
  /** Order total as string (e.g. '621', '6000'). Optional — defaults to '1000'. */
  orderTotal?: string;
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
  /**
   * Append a unique unit/suite suffix to the per-state street address so that
   * `streetAddress1` differs every run.
   *
   * Why: the underwriting `blacklistCheck` matches on `streetAddress1` + `zipCode`.
   * The per-state fixture addresses in `state-address-mapper.ts` are STATIC and
   * SHARED across all tests, so a single sandbox blacklist entry on, e.g.,
   * `654 Sunset Blvd / 90028` (CA) poisons EVERY fresh CA application →
   * deterministic `BLACKLIST_DENIED` even with fresh SSN/email/name.
   * Discovered 2026-06-12 (modify-lease all-DENIED, blacklist pk:2165 from leadPk:97436).
   *
   * Default: false (legacy behavior — static address). Set true for tests that
   * create fresh applications and must be immune to stale blacklist entries.
   */
  uniqueAddress?: boolean;
  /**
   * Use the realistic random-data factory for the applicant: a real-looking
   * random name, a random VALID address (real city/ZIP for the state + random
   * house number/unit — inherently blacklist-immune, so `uniqueAddress` is
   * redundant), and a random adult DOB. Email still comes from the worker-unique
   * inbox alias; SSN/state are unchanged.
   * **Default: `true`.** Opt out with `realistic: false` to get the legacy
   * deterministic `TestFN…/TestLN…` name + static `STATE_ADDRESSES` fixture
   * (only when a test specifically needs a pinned name/address).
   */
  realistic?: boolean;
  /**
   * SSN strategy when `realistic` is set: `'approve'` | `'deny'` | `'sticky16m'`
   * | a literal SSN. Defaults follow `approved` (`'approve'`/`'deny'`).
   */
  ssn?: SsnStrategy;
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
    orderTotal = '1000',
    orderDescription = 'Test',
    approved = true,
    emailOverride,
    dob,
    uniqueAddress = false,
    realistic = true,
    ssn: ssnStrategy,
  } = options;

  const envName = envOverride ?? process.env.ENV ?? 'sandbox';

  const env = new ConfigEnvironment(envName as EnvName);
  const merchantConfig = getMerchant(merchantName, envName);
  const runId = generateRunId();

  const merchant: MerchantInfo = {
    username: merchantConfig.username,
    password: merchantConfig.password,
    number: merchantConfig.number,
  };

  // Person + address. Realistic mode (default) delegates to `randomPerson` (real
  // name, real blacklist-immune city/ZIP, valid SSN/phone/DOB) instead of
  // re-inlining the primitives. The email PRESERVES the current behavior
  // (`emailOverride ?? env.uniqueEmailAlias`) via override — email generation
  // does NOT change. Legacy mode keeps the static fixture + alpha-only TestFN names.
  let address: AddressData;
  let applicant: ApplicantInfo;
  if (realistic) {
    const person = randomPerson({
      state,
      ssn: ssnStrategy ?? (approved ? 'approve' : 'deny'),
      dob,
      email: emailOverride ?? env.uniqueEmailAlias,
    });
    address = { street: person.address, city: person.city, zipCode: person.zip };
    applicant = {
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      ssn: person.ssn,
      phone: person.phone,
      address: person.address,
      city: person.city,
      state,
      zip: person.zip,
      dob: person.dob,
    };
  } else {
    const baseAddress = getAddressForState(state);
    address = uniqueAddress
      ? { ...baseAddress, street: `${baseAddress.street} Unit ${runId.slice(-5)}` }
      : baseAddress;
    const nameSuffix = runId.replace(/[^a-zA-Z]/g, '').slice(0, 8) || 'abcdef';
    applicant = {
      firstName: `TestFN${nameSuffix}`,
      lastName: `TestLN${nameSuffix}`,
      email: emailOverride ?? env.uniqueEmailAlias,
      ssn: generateTestSSN(approved),
      phone: generateTestPhone(),
      address: address.street,
      city: address.city,
      state,
      zip: address.zipCode,
      dob: dob ?? '01/01/1984',
    };
  }

  const order: OrderInfo = {
    orderTotal,
    description: `${orderDescription} - ${runId}`,
  };

  return { env, address, merchantConfig, merchant, applicant, order, runId };
}

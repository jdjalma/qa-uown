/**
 * Barrel export for src/data/
 *
 * Centralizes all test data exports: merchants, test cards, test accounts,
 * state/address mappings, and TireAgent/PayPair portal data.
 */
export * from './merchants.js';
export * from './state-address-mapper.js';
export * from './state-merchant-matrix.js';
export * from './test-cards.js';
export * from './tire-agent.data.js';
export * from './sticky.js';

// Realistic random-data factory — surface only the high-level API here (the
// RNG primitives `int`/`pick`/… stay namespaced under '@data/realistic').
export {
  randomApplicant,
  randomPerson,
  randomPayPairPersonalInfo,
  randomPayPairCart,
  randomLineItems,
  randomCart,
  cartToLineItems,
  cartToPayPair,
  cartTotal,
  categoryForMerchant,
  MERCHANT_PRODUCT_CATEGORY,
  randomAddress,
  randomFullName,
  randomFirstName,
  randomLastName,
  randomAdultDob,
  randomIncome,
  randomEmployer,
  resolveSsn,
  PRODUCT_CATALOG,
  EMPLOYERS,
} from './realistic/index.js';
export type {
  RandomPerson,
  RandomPersonOptions,
  SsnStrategy,
  RandomCartOptions,
  CartLine,
  CatalogProduct,
  RealisticAddress,
} from './realistic/index.js';

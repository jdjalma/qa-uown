/**
 * Realistic test-data factory — random but VALID data for anything the
 * application needs: people, names, addresses, products, and the two cart
 * shapes (UOWN `lineItem` + PayPair Cart).
 *
 * Design goals:
 *   - **Real**: names, city/ZIP pairs and products are plausible; SSN/phone use
 *     the existing valid test generators; DOB is an adult; city/ZIP match the state.
 *   - **Random**: every call varies (crypto-backed RNG).
 *   - **Unique**: addresses randomize house number + unit (dodges shared-fixture
 *     blacklist); emails use the worker-unique alias.
 *   - **Reuses** existing infra (`generateTestSSN/Phone`, `uniqueEmail`,
 *     `buildPayPair*Json`, `TireAgentProduct`) — nothing duplicated.
 *
 * Quick start:
 *   import { randomApplicant, randomLineItems, randomPayPairCart,
 *            randomPayPairPersonalInfo } from '@data/realistic/index.js';
 *   const applicant = randomApplicant({ state: 'OH', ssn: 'sticky16m' });
 *   const lineItems = randomLineItems({ total: 900, maxQuantity: 3 });
 *   const cart = randomPayPairCart({ category: 'Tires', total: 800 });
 */
export * from './random.js';
export * from './names.js';
export * from './addresses.js';
export * from './products.js';
export * from './person.js';

/**
 * Unified test card definitions.
 *
 * Consolidates card data previously duplicated across:
 *   - src/config/constants.ts  (TEST_CARDS object)
 *   - src/types/payment.types.ts  (VALID_TEST_CARDS / INVALID_TEST_CARDS arrays)
 *
 * Every card lives in ALL_TEST_CARDS. Convenience exports preserve backwards
 * compatibility so existing consumers keep working with minimal import changes.
 */
import type { CreditCardInfo } from '../types/payment.types.js';

// ── Unified card interface ──────────────────────────────────────────

export type CardBrand = 'visa' | 'mastercard' | 'discover' | 'amex';

export interface TestCard {
  /** Human-readable label (e.g. "Mastercard Approved 5146") */
  name: string;
  /** Full card number */
  number: string;
  /** Two-digit expiration month (e.g. "12") */
  expMonth: string;
  /** Four-digit expiration year (e.g. "2028") */
  expYear: string;
  /** Expiration in MM/YYYY format (e.g. "12/2028") — used by CreditCardInfo consumers */
  expirationDate: string;
  /**
   * Card verification value.
   * Exposed as `cvv` (industry standard name). Legacy callers that used `cvc`
   * should migrate to `cvv`; the old `cvc` accessor is kept on TEST_CARDS for
   * backwards compatibility.
   */
  cvv: string;
  /** Whether the test gateway approves this card */
  approved: boolean;
  /** Card brand / network */
  cardBrand: CardBrand;
  /** Gateway decline code (only for declined cards) */
  declineCode?: string;
  /** Gateway decline message (only for declined cards) */
  message?: string;
}

// ── Card catalogue ──────────────────────────────────────────────────

export const ALL_TEST_CARDS: Record<string, TestCard> = {
  /**
   * Mastercard approved (BIN 5146).
   * NOTE: Previously labelled "VISA_APPROVED" in constants.ts — the BIN 5146
   * is actually a Mastercard range. The key name is kept for backwards compat.
   */
  VISA_APPROVED: {
    name: 'Mastercard Approved 5146',
    number: '5146315000000055',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '998',
    approved: true,
    cardBrand: 'mastercard',
  },

  /** Mastercard approved (BIN 5500) */
  MASTERCARD_APPROVED: {
    name: 'Mastercard Approved 5500',
    number: '5500000000000004',
    expMonth: '12',
    expYear: '2030',
    expirationDate: '12/2030',
    cvv: '123',
    approved: true,
    cardBrand: 'mastercard',
  },

  /** Discover approved (BIN 6011) — used on contract page */
  DISCOVER_APPROVED: {
    name: 'Discover Approved 6011',
    number: '6011000993026909',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '996',
    approved: true,
    cardBrand: 'discover',
  },

  /** Visa declined — gateway returns decline code "D" */
  VISA_DECLINED: {
    name: 'Visa Declined 4000',
    number: '4000000000000002',
    expMonth: '12',
    expYear: '2030',
    expirationDate: '12/2030',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: 'D',
    message: 'Declined',
  },

  // ── Decline cards (from Java CreditCardValidation enum A-N) ───────
  // Used by CreditCardDeclineCheck flow to validate each decline code on the contract page.

  /** Decline — generic "Declined" */
  DECLINE_A: {
    name: 'Decline A - Declined',
    number: '4000300011112220',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '-',
    message: 'Declined',
  },
  /** Decline 04 — Pickup Card */
  DECLINE_B: {
    name: 'Decline B - Pickup Card',
    number: '4000300001112222',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '04',
    message: 'Pickup Card',
  },
  /** Decline 05 — Do not Honor */
  DECLINE_C: {
    name: 'Decline C - Do not Honor',
    number: '4000300211112228',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '05',
    message: 'Do not Honor',
  },
  /** Decline 12 — Invalid Transaction */
  DECLINE_D: {
    name: 'Decline D - Invalid Transaction',
    number: '4000300311112227',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '12',
    message: 'Invalid Transaction',
  },
  /** Decline 15 — Invalid Issuer */
  DECLINE_E: {
    name: 'Decline E - Invalid Issuer',
    number: '4000300411112226',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '15',
    message: 'Invalid Issuer',
  },
  /** Decline 25 — Unable to locate Record */
  DECLINE_F: {
    name: 'Decline F - Unable to locate Record',
    number: '4000300511112225',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '25',
    message: 'Unable to locate Record',
  },
  /** Decline 51 — Insufficient funds */
  DECLINE_G: {
    name: 'Decline G - Insufficient funds',
    number: '4000300611112224',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '51',
    message: 'Insufficient funds',
  },
  /** Decline 55 — Invalid Pin */
  DECLINE_H: {
    name: 'Decline H - Invalid Pin',
    number: '4000300711112223',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '55',
    message: 'Invalid Pin',
  },
  /** Decline 57 — Transaction Not Permitted */
  DECLINE_I: {
    name: 'Decline I - Transaction Not Permitted',
    number: '4000300811112222',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '57',
    message: 'Transaction Not Permitted',
  },
  /** Decline 62 — Restricted Card */
  DECLINE_J: {
    name: 'Decline J - Restricted Card',
    number: '4000300911112221',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '62',
    message: 'Restricted Card',
  },
  /** Decline 65 — Excess withdrawal count */
  DECLINE_K: {
    name: 'Decline K - Excess withdrawal count',
    number: '4000301011112228',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '65',
    message: 'Excess withdrawal count',
  },
  /** Decline 75 — Allowable number of pin tries exceeded */
  DECLINE_L: {
    name: 'Decline L - Pin tries exceeded',
    number: '4000301111112227',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '75',
    message: 'Allowable number of pin tries exceeded',
  },
  /** Decline 78 — No checking account */
  DECLINE_M: {
    name: 'Decline M - No checking account',
    number: '4000301211112226',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '78',
    message: 'No checking account',
  },
  /** Decline 97 — Declined for CVV failure */
  DECLINE_N: {
    name: 'Decline N - CVV failure',
    number: '4000301311112225',
    expMonth: '12',
    expYear: '2028',
    expirationDate: '12/2028',
    cvv: '123',
    approved: false,
    cardBrand: 'visa',
    declineCode: '97',
    message: 'Declined for CVV failure',
  },
} as const satisfies Record<string, TestCard>;

// ── Keyed export (backwards compat with constants.ts TEST_CARDS) ────
//
// Adds a `cvc` alias and `expiry` alias so callers that did
//   TEST_CARDS.VISA_APPROVED.cvc   or   TEST_CARDS.VISA_APPROVED.expiry
// continue to compile without changes.

type TestCardWithLegacy = TestCard & {
  /** @deprecated Use `cvv` instead */
  readonly cvc: string;
  /** @deprecated Use `expirationDate` instead */
  readonly expiry: string;
};

function withLegacyFields(card: TestCard): TestCardWithLegacy {
  return Object.defineProperties({ ...card }, {
    cvc: { get() { return this.cvv; }, enumerable: false },
    expiry: { get() { return this.expirationDate; }, enumerable: false },
  }) as TestCardWithLegacy;
}

/**
 * Keyed access to test cards — drop-in replacement for the old
 * `TEST_CARDS` from `src/config/constants.ts`.
 *
 * Usage unchanged:
 * ```ts
 * const card = TEST_CARDS.VISA_APPROVED;
 * card.number;   // '5146315000000055'
 * card.cvc;      // '998'  (legacy alias for cvv)
 * card.expiry;   // '12/2028' (legacy alias for expirationDate)
 * card.cvv;      // '998'
 * ```
 */
export const TEST_CARDS: Record<string, TestCardWithLegacy> = Object.fromEntries(
  Object.entries(ALL_TEST_CARDS).map(([key, card]) => [key, withLegacyFields(card)]),
);

// ── Convenience accessors ───────────────────────────────────────────

/** All cards the test gateway approves */
export function getApprovedCards(): TestCard[] {
  return Object.values(ALL_TEST_CARDS).filter((c) => c.approved);
}

/** All cards the test gateway declines */
export function getDeclinedCards(): TestCard[] {
  return Object.values(ALL_TEST_CARDS).filter((c) => !c.approved);
}

// ── CreditCardInfo-shaped arrays (backwards compat with payment.types.ts) ──

/**
 * Drop-in replacement for the old `VALID_TEST_CARDS` array from `payment.types.ts`.
 * Shape: `CreditCardInfo[]`.
 */
export const VALID_TEST_CARDS: CreditCardInfo[] = Object.values(ALL_TEST_CARDS)
  .filter((c) => c.approved)
  .map((c) => ({
    cardNumber: c.number,
    expirationDate: c.expirationDate,
    cvv: c.cvv,
    approved: true,
  }));

/**
 * Drop-in replacement for the old `INVALID_TEST_CARDS` array from `payment.types.ts`.
 * Shape: `CreditCardInfo[]`.
 */
export const INVALID_TEST_CARDS: CreditCardInfo[] = Object.values(ALL_TEST_CARDS)
  .filter((c) => !c.approved)
  .map((c) => ({
    cardNumber: c.number,
    expirationDate: c.expirationDate,
    cvv: c.cvv,
    approved: false,
    declineCode: c.declineCode,
    message: c.message,
  }));

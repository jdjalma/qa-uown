export enum FeeType {
  EARLY_PAY_OFF = 'Early Pay-Off',
  REGULAR_PAYMENT = 'Regular Payment',
  PROCESSING_FEE = 'Processing Fee',
  PROTECTION_PLAN_FEE = 'Protection Plan Fee',
  NSF_FEE = 'NSF Fee',
  REINSTATEMENT_FEE = 'Reinstatement Fee',
  MANUAL_FEE = 'Manual Fee',
  MISC_FEE = 'Misc Fee',
}

export interface CreditCardInfo {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  approved: boolean;
  declineCode?: string;
  message?: string;
}

// ── Test card arrays ────────────────────────────────────────────────
// Consolidated in src/data/test-cards.ts — re-exported here for backwards compat.
export { VALID_TEST_CARDS, INVALID_TEST_CARDS } from '@data/index.js';

export interface PaymentData {
  amount: string;
  date: string;
  type: 'ach' | 'credit_card';
  [key: string]: string;
}

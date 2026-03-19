/**
 * Request body types for Payment Arrangement API endpoints.
 *
 * Maps to the Java DTO: PaymentArrangementDto
 * Endpoints:
 *   - POST /uown/svc/makeCreditCardPayments (CC arrangement)
 *   - POST /uown/svc/createOrUpdateACHPayments (ACH arrangement)
 *
 * Body structure validated against real Servicing Portal request (2026-03-04).
 */
import { TEST_BANK } from '../../config/constants.js';

// ── Enums ──────────────────────────────────────────────────────────

export type ArrangementType = 'NORMAL' | 'SETTLEMENT';

// ── CC Address ────────────────────────────────────────────────────

export interface CcAddress {
  streetAddress1?: string;
  streetAddress2?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

// ── CC Info (nested in each CC transaction) ───────────────────────

export interface CcTransactionCcInfo {
  creditCardPk?: number;
  autoPay?: boolean;
  ccFirstName: string;
  ccLastName: string;
  ccNumber: string;
  ccType?: string;
  ccExp: string;
  ccVendor?: string;
  cvc?: string;
  leadPk?: number;
  ccToken?: string;
  ccAddress?: CcAddress;
}

// ── CC Transaction (element of creditCardTransactions array) ──────

export interface CreditCardTransactionInfo {
  amount: number;
  accountPk: number;
  allocationStrategy: string;
  postingDate: string;
  useCardOnFile: boolean;
  saveCardToFile: boolean;
  ccAction: string;
  ccTransactionType: string;
  chargeFee: boolean;
  ccInfo: CcTransactionCcInfo;
}

// ── ACH Payment ────────────────────────────────────────────────────

export interface AchPaymentInfo {
  accountPk: number;
  amount: string;
  postingDate: string;
  bankData: {
    routingNumber: string;
    accountNumber: string;
    bankAccountType: string;
  };
  username?: string;
  paymentArrangement?: boolean;
  comments?: string;
  /** Required for the sendACHPaymentsSweep to pick up this payment regardless of due-date window.
   * Payment arrangement ACH must use 'REQUEST' — without it, the sweep only picks up payments
   * when a receivable is due within 1 day (auto-pay condition).
   */
  achProcessType?: string;
}

// ── Payment Arrangement DTO (request body) ────────────────────────

export interface PaymentArrangementCcBody {
  accountPk: number;
  paymentArrangement: boolean;
  arrangementType?: ArrangementType;
  creditCardTransactions: CreditCardTransactionInfo[];
}

export interface PaymentArrangementAchBody {
  accountPk: number;
  paymentArrangement: boolean;
  arrangementType: ArrangementType;
  achPayments: AchPaymentInfo[];
}

// ── Builders ───────────────────────────────────────────────────────

export interface BuildCcArrangementOptions {
  accountPk: number;
  arrangementType?: ArrangementType;
  /** Lead PK — used in ccInfo for each transaction */
  leadPk?: number;
  /** Credit card PK on file (from uown_los_credit_card) */
  creditCardPk?: number;
  /** CC token for card on file */
  ccToken?: string;
  /** Card number (masked or full for tokenization) */
  ccNumber?: string;
  /** Card expiration (MM/YYYY) */
  ccExp?: string;
  /** Card CVV */
  cvc?: string;
  /** Card type (e.g. "OTHER", "VISA", "MASTERCARD") */
  ccType?: string;
  /** CC vendor (e.g. "CHANNEL_PAYMENTS_CC") */
  ccVendor?: string;
  /** Cardholder first name */
  ccFirstName?: string;
  /** Cardholder last name */
  ccLastName?: string;
  /** Use existing card on file (requires creditCardPk + ccToken) */
  useCardOnFile?: boolean;
  /** Allocation strategy (default: REGULAR_RECEIVABLES) */
  allocationStrategy?: string;
  /** Array of { amount, date } for each installment */
  installments: Array<{ amount: string; date: string }>;
}

export function buildCcArrangementBody(options: BuildCcArrangementOptions): PaymentArrangementCcBody {
  const useCardOnFile = options.useCardOnFile ?? !!options.ccToken;

  return {
    accountPk: options.accountPk,
    paymentArrangement: true,
    ...(options.arrangementType && { arrangementType: options.arrangementType }),
    creditCardTransactions: options.installments.map((inst) => ({
      amount: parseFloat(inst.amount),
      accountPk: options.accountPk,
      allocationStrategy: options.allocationStrategy ?? 'REGULAR_RECEIVABLES',
      postingDate: inst.date,
      useCardOnFile,
      saveCardToFile: false,
      ccAction: 'SALE',
      ccTransactionType: 'REQUEST',
      chargeFee: true,
      ccInfo: {
        ccFirstName: options.ccFirstName ?? '',
        ccLastName: options.ccLastName ?? '',
        ccNumber: options.ccNumber ?? '',
        ccExp: options.ccExp ?? '',
        cvc: options.cvc ?? '',
        ccType: options.ccType ?? 'OTHER',
        ccVendor: options.ccVendor ?? 'CHANNEL_PAYMENTS_CC',
        autoPay: true,
        ...(options.leadPk != null && { leadPk: options.leadPk }),
        ...(options.creditCardPk != null && { creditCardPk: options.creditCardPk }),
        ...(options.ccToken && { ccToken: options.ccToken }),
        ccAddress: {
          streetAddress1: '',
          streetAddress2: '',
          zipCode: '',
          city: '',
          state: '',
        },
      },
    })),
  };
}

export interface BuildAchArrangementOptions {
  accountPk: number;
  arrangementType?: ArrangementType;
  username?: string;
  routingNumber?: string;
  accountNumber?: string;
  bankAccountType?: string;
  /** Array of { amount, date } for each installment */
  installments: Array<{ amount: string; date: string }>;
}

export function buildAchArrangementBody(options: BuildAchArrangementOptions): PaymentArrangementAchBody {
  return {
    accountPk: options.accountPk,
    paymentArrangement: true,
    arrangementType: options.arrangementType ?? 'SETTLEMENT',
    achPayments: options.installments.map((inst) => ({
      accountPk: options.accountPk,
      amount: inst.amount,
      postingDate: inst.date,
      bankData: {
        routingNumber: options.routingNumber ?? TEST_BANK.DEFAULT_ROUTING,
        accountNumber: options.accountNumber ?? TEST_BANK.DEFAULT_ACCOUNT,
        bankAccountType: options.bankAccountType ?? TEST_BANK.DEFAULT_TYPE,
      },
      username: options.username ?? 'automation',
      paymentArrangement: true,
      comments: 'Automated test - ACH payment arrangement',
      // REQUEST type ensures the sendACHPaymentsSweep SQL picks up this payment
      // regardless of whether a receivable is due within 1 day (bypasses the auto-pay condition).
      achProcessType: 'REQUEST',
    })),
  };
}

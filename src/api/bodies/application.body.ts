import { randomInt } from 'node:crypto';
import type { InvoiceLineItem } from './invoice.body.js';
import { formatDateCompact } from '../../helpers/date.helpers.js';
import { DEFAULT_TEST_IP, INVOICE_DEFAULTS, TEST_BANK } from '../../config/constants.js';

export interface MerchantInfo {
  username: string;
  password: string;
  number: string;
}

export interface ApplicantInfo {
  firstName: string;
  lastName: string;
  email: string;
  ssn: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dob: string;
}

export interface OrderInfo {
  orderTotal: string;
  description: string;
  lineItems?: InvoiceLineItem[];
}

// ── Shared merchant credentials helper ──────────────────────────────

export function extractMerchantCredentials(merchant: MerchantInfo) {
  return {
    userName: merchant.username,
    setupPassword: merchant.password,
    merchantNumber: merchant.number,
  } as const;
}

// ── sendApplication (create new account) ────────────────────────────

export interface SendApplicationBody {
  userName: string;
  setupPassword: string;
  merchantNumber: string;
  mainFirstName: string;
  mainLastName: string;
  mainDOB: string;
  mainSSN: string;
  mainAddress1: string;
  mainCity: string;
  mainStateOrProvince: string;
  mainPostalCode: string;
  mainCellPhone: string;
  emailAddress: string;
  mainEmployerName: string;
  mainPastBankruptcy: boolean;
  mainCurrentOrFutureBankruptcy: boolean;
  languagePreference: string;
  iovationFingerprintText: string;
  ipaddress: string;
  desiredPaymentFrequency: string;
  mainAnnualIncome: number;
  equalOrAboveThreshold?: boolean;
  mainPayFrequency: string;
  mainNextPayDate: string;
  mainLastPayDate: string;
  mainEmploymentDuration: string;
  shipToSameAsConsumer: boolean;
  merchandiseSubtotal?: string;
  discountAmount?: string;
  deliveryCharge?: string;
  installationCharge?: string;
  salesTax?: string;
  miscellaneousFees?: string;
  depositAmount?: string;
  orderTotal?: string;
  invoiceNumber?: string;
  lineItem?: InvoiceLineItem[];
}

// ── getApplicationStatus ────────────────────────────────────────────

export interface ApplicationStatusBody {
  userName: string;
  setupPassword: string;
  merchantNumber: string;
  localeString: string;
  accountNumber: string;
}

// ── submitApplication (complete with bank/CC info) ──────────────────

export interface SubmitApplicationCcInfo {
  leadPk: number;
  ccFirstName: string;
  ccLastName: string;
  ccNumber: string;
  cvc: string;
  ccType: string;
  ccExp: string;
  autoPay: boolean;
  preAuthStatus: string;
}

export interface SubmitApplicationBody {
  leadPk: number;
  bankAccountNumber: string;
  bankRoutingNumber: string;
  bankAccountType: string;
  bankAccountCustomerFirstName: string;
  bankAccountCustomerLastName: string;
  achAutoPay: boolean;
  ccInfo: SubmitApplicationCcInfo;
  desiredPaymentFrequency: string;
}

// ── Default line items for lease applications ───────────────────────

export const DEFAULT_LINE_ITEMS: InvoiceLineItem[] = [
  {
    lineItemLineNumber: '317',
    lineItemSerialNumber: 'S94712065',
    lineItemProductNumber: 'A561SKU283',
    lineItemProductDescription: 'Ottoman',
    lineItemProductCategory: 'TIRES_&_WHEELS',
    lineItemType: 'D',
    lineItemQuantityOrdered: '1',
    lineItemUnitPrice: '531.44',
    lineItemBasePrice: '499',
    lineItemTaxAmount: '32.44',
    lineItemExtendedPrice: '531.44',
  },
  {
    lineItemLineNumber: '318',
    lineItemSerialNumber: 'M68484397',
    lineItemProductNumber: 'A333SKU4444',
    lineItemProductDescription: 'Recliner',
    lineItemProductCategory: 'Seating',
    lineItemType: 'D',
    lineItemQuantityOrdered: '1',
    lineItemUnitPrice: '332.93',
    lineItemBasePrice: '309.70',
    lineItemTaxAmount: '23.23',
    lineItemExtendedPrice: '332.93',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  return `R${10000 + randomInt(90000)}`;
}

// ── Builders ────────────────────────────────────────────────────────

export function buildSendApplicationBody(
  merchant: MerchantInfo,
  applicant: ApplicantInfo,
  order?: OrderInfo,
): SendApplicationBody {
  const now = new Date();
  const lastPayDate = new Date(now);
  lastPayDate.setDate(lastPayDate.getDate() - 7);
  const nextPayDate = new Date(now);
  nextPayDate.setDate(nextPayDate.getDate() + 7);

  // DOB: remove slashes → MMDDYYYY format
  const dob = applicant.dob.replace(/\//g, '');

  const body: SendApplicationBody = {
    ...extractMerchantCredentials(merchant),
    mainFirstName: applicant.firstName,
    mainLastName: applicant.lastName,
    mainDOB: dob,
    mainSSN: applicant.ssn,
    mainAddress1: applicant.address,
    mainCity: applicant.city,
    mainStateOrProvince: applicant.state,
    mainPostalCode: applicant.zip,
    mainCellPhone: applicant.phone,
    emailAddress: applicant.email,
    mainEmployerName: 'Uown TEST',
    mainPastBankruptcy: false,
    mainCurrentOrFutureBankruptcy: false,
    languagePreference: 'E',
    iovationFingerprintText: 'fingerPrintText',
    ipaddress: DEFAULT_TEST_IP,
    desiredPaymentFrequency: 'WEEKLY',
    mainAnnualIncome: 56000,
    mainPayFrequency: 'WEEKLY',
    mainNextPayDate: formatDateCompact(nextPayDate),
    mainLastPayDate: formatDateCompact(lastPayDate),
    mainEmploymentDuration: '_1_TO_2_YEARS',
    shipToSameAsConsumer: true,
  };

  if (order) {
    // Build charges that sum exactly to orderTotal (following API contract)
    const subtotal = parseFloat(order.orderTotal) || 621;
    const deliveryCharge = 25;
    const salesTax = +(subtotal * 0.085).toFixed(2); // ~8.5% tax
    const merchandiseSubtotal = +(subtotal - deliveryCharge - salesTax).toFixed(2);
    const orderTotal = +(merchandiseSubtotal + deliveryCharge + salesTax).toFixed(2);

    body.merchandiseSubtotal = merchandiseSubtotal.toFixed(2);
    body.discountAmount = '0.00';
    body.deliveryCharge = deliveryCharge.toFixed(2);
    body.installationCharge = '0.00';
    body.salesTax = salesTax.toFixed(2);
    body.miscellaneousFees = '0.00';
    body.depositAmount = '0.00';
    body.orderTotal = orderTotal.toFixed(2);
    body.invoiceNumber = generateInvoiceNumber();

    body.lineItem = order.lineItems ?? [{
      lineItemLineNumber: '1',
      lineItemSerialNumber: `SKU-TEST-${Date.now()}`,
      lineItemProductNumber: 'TEST-ITEM-001',
      lineItemProductDescription: 'Test Lease Item',
      lineItemProductCategory: 'Appliances',
      lineItemType: 'D',
      lineItemQuantityOrdered: '1',
      lineItemUnitPrice: (merchandiseSubtotal + salesTax).toFixed(2),
      lineItemBasePrice: merchandiseSubtotal.toFixed(2),
      lineItemTaxAmount: salesTax.toFixed(2),
      lineItemExtendedPrice: (merchandiseSubtotal + salesTax).toFixed(2),
    }];
  }

  return body;
}

export function buildApplicationStatusBody(
  merchant: MerchantInfo,
  leadUuid: string,
): ApplicationStatusBody {
  return {
    ...extractMerchantCredentials(merchant),
    localeString: INVOICE_DEFAULTS.LOCALE,
    accountNumber: leadUuid,
  };
}

// ── submitApplication (CC + bank info submission) ────────────────────

export interface SubmitApplicationOptions {
  ccNumber?: string;
  cvc?: string;
  ccType?: string;
  ccExp?: string;
  autoPay?: boolean;
  preAuthStatus?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankAccountType?: string;
  achAutoPay?: boolean;
  desiredPaymentFrequency?: string;
}

export function buildSubmitApplicationBody(
  leadPk: string | number,
  firstName: string,
  lastName: string,
  options: SubmitApplicationOptions = {},
): SubmitApplicationBody {
  const pk = typeof leadPk === 'string' ? parseInt(leadPk, 10) : leadPk;
  return {
    leadPk: pk,
    bankAccountNumber: options.bankAccountNumber ?? TEST_BANK.DEFAULT_ACCOUNT,
    bankRoutingNumber: options.bankRoutingNumber ?? TEST_BANK.DEFAULT_ROUTING,
    bankAccountType: options.bankAccountType ?? TEST_BANK.DEFAULT_TYPE,
    bankAccountCustomerFirstName: firstName,
    bankAccountCustomerLastName: lastName,
    achAutoPay: options.achAutoPay ?? true,
    ccInfo: {
      leadPk: pk,
      ccFirstName: firstName,
      ccLastName: lastName,
      ccNumber: options.ccNumber ?? '6011000993026909',
      cvc: options.cvc ?? '996',
      ccType: options.ccType ?? 'VISA',
      ccExp: options.ccExp ?? '12/2028',
      autoPay: options.autoPay ?? true,
      preAuthStatus: options.preAuthStatus ?? 'SUCCESS',
    },
    desiredPaymentFrequency: options.desiredPaymentFrequency ?? 'WEEKLY',
  };
}

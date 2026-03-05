import { type MerchantInfo, DEFAULT_LINE_ITEMS, extractMerchantCredentials } from './application.body.js';
import { INVOICE_DEFAULTS } from '../../config/constants.js';

export interface InvoiceLineItem {
  lineItemLineNumber: string;
  lineItemSerialNumber: string;
  lineItemProductNumber: string;
  lineItemProductDescription: string;
  lineItemProductCategory: string;
  lineItemType: string;
  lineItemQuantityOrdered: string;
  lineItemUnitPrice?: string;
  lineItemBasePrice?: string;
  lineItemTaxAmount: string;
  lineItemExtendedPrice: string;
}

export interface SendInvoiceBody {
  userName: string;
  setupPassword: string;
  merchantNumber: string;
  localeString: string;
  storeNumber: string;
  selectedPaymentFrequency: string;
  accountNumber: string;
  invoiceNumber: string;
  orderType: string;
  merchandiseSubtotal: string;
  discountAmount: string;
  deliveryCharge: string;
  installationCharge: string;
  salesTax: string;
  miscellaneousFees: string;
  depositAmount: string;
  orderTotal: string;
  lineItem: InvoiceLineItem[];
}

export interface SendInvoiceOptions {
  storeNumber?: string;
  selectedPaymentFrequency?: string;
  invoiceNumber?: string;
  orderType?: string;
  merchandiseSubtotal?: string;
  discountAmount?: string;
  deliveryCharge?: string;
  installationCharge?: string;
  salesTax?: string;
  miscellaneousFees?: string;
  depositAmount?: string;
  orderTotal?: string;
  lineItems?: InvoiceLineItem[];
}

/**
 * Invoice-specific line items derived from DEFAULT_LINE_ITEMS.
 * Uses simplified pricing (no unit/base price breakdown on the first item,
 * flat pricing on the second) as required by the sendInvoice API contract.
 */
export const INVOICE_DEFAULT_LINE_ITEMS: InvoiceLineItem[] = DEFAULT_LINE_ITEMS.map((item) => {
  if (item.lineItemLineNumber === '317') {
    // Ottoman: invoice uses simplified pricing without unit/base breakdown
    return {
      lineItemLineNumber: item.lineItemLineNumber,
      lineItemSerialNumber: item.lineItemSerialNumber,
      lineItemProductNumber: item.lineItemProductNumber,
      lineItemProductDescription: item.lineItemProductDescription,
      lineItemProductCategory: 'Seating',
      lineItemType: item.lineItemType,
      lineItemQuantityOrdered: item.lineItemQuantityOrdered,
      lineItemTaxAmount: '',
      lineItemExtendedPrice: '500.00',
    };
  }
  // Recliner: invoice uses flat pricing
  return {
    lineItemLineNumber: item.lineItemLineNumber,
    lineItemSerialNumber: item.lineItemSerialNumber,
    lineItemProductNumber: item.lineItemProductNumber,
    lineItemProductDescription: item.lineItemProductDescription,
    lineItemProductCategory: item.lineItemProductCategory,
    lineItemType: item.lineItemType,
    lineItemQuantityOrdered: item.lineItemQuantityOrdered,
    lineItemUnitPrice: '300.00',
    lineItemBasePrice: '300.00',
    lineItemTaxAmount: '00.00',
    lineItemExtendedPrice: '300.00',
  };
});

export function buildSendInvoiceBody(
  merchant: MerchantInfo,
  leadUuid: string,
  options: SendInvoiceOptions = {},
): SendInvoiceBody {
  // When orderTotal is provided but sub-fields are not, recalculate so the
  // charges sum exactly to orderTotal (avoids "Cost > approved amount" errors).
  const orderTotal = options.orderTotal ?? INVOICE_DEFAULTS.ORDER_TOTAL;
  let merchandiseSubtotal = options.merchandiseSubtotal ?? INVOICE_DEFAULTS.MERCHANDISE_SUBTOTAL;
  let deliveryCharge = options.deliveryCharge ?? INVOICE_DEFAULTS.DELIVERY_CHARGE;
  let salesTax = options.salesTax ?? INVOICE_DEFAULTS.SALES_TAX;
  let miscellaneousFees = options.miscellaneousFees ?? INVOICE_DEFAULTS.MISCELLANEOUS_FEES;
  let installationCharge = options.installationCharge ?? INVOICE_DEFAULTS.INSTALLATION_CHARGE;

  if (options.orderTotal && !options.merchandiseSubtotal) {
    // Recalculate: keep delivery/install/misc at 0, compute tax and subtotal from orderTotal
    const total = parseFloat(options.orderTotal);
    deliveryCharge = '0.00';
    installationCharge = '0.00';
    miscellaneousFees = '0.00';
    salesTax = (+(total * 0.085 / 1.085).toFixed(2)).toFixed(2);
    merchandiseSubtotal = (+(total - parseFloat(salesTax)).toFixed(2)).toFixed(2);
  }

  return {
    ...extractMerchantCredentials(merchant),
    localeString: INVOICE_DEFAULTS.LOCALE,
    storeNumber: options.storeNumber ?? INVOICE_DEFAULTS.STORE_NUMBER,
    selectedPaymentFrequency: options.selectedPaymentFrequency ?? INVOICE_DEFAULTS.PAYMENT_FREQUENCY,
    accountNumber: leadUuid,
    invoiceNumber: options.invoiceNumber ?? INVOICE_DEFAULTS.INVOICE_NUMBER,
    orderType: options.orderType ?? INVOICE_DEFAULTS.ORDER_TYPE,
    merchandiseSubtotal,
    discountAmount: options.discountAmount ?? INVOICE_DEFAULTS.DISCOUNT_AMOUNT,
    deliveryCharge,
    installationCharge,
    salesTax,
    miscellaneousFees,
    depositAmount: options.depositAmount ?? INVOICE_DEFAULTS.DEPOSIT_AMOUNT,
    orderTotal,
    lineItem: options.lineItems ?? INVOICE_DEFAULT_LINE_ITEMS,
  };
}

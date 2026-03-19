import type { BaseResponseBody } from './base.response.js';

export interface PaymentDetails {
  redirectUrl?: string;
  regularPaymentWithTax?: string;
  planId?: string;
  termInMonths?: number;
}

export interface InvoiceLineItemResponse {
  lineItemLineNumber?: string;
  lineItemSerialNumber?: string;
  lineItemProductNumber?: string;
  lineItemProductDescription?: string;
  lineItemProductCategory?: string;
  lineItemType?: string;
  lineItemQuantityOrdered?: string;
  lineItemUnitPrice?: string;
  lineItemBasePrice?: string;
  lineItemTaxAmount?: string;
  lineItemExtendedPrice?: string;
}

export interface SendInvoiceResponseBody extends BaseResponseBody {
  invoiceNumber?: string;
  invoicePk?: number;
  accountNumber?: string;
  transactionStatus?: string;
  transactionMessage?: string;
  paymentDetailsList?: PaymentDetails[];
  invoiceItems?: InvoiceLineItemResponse[];
}

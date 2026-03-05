import { type MerchantInfo, DEFAULT_LINE_ITEMS, extractMerchantCredentials } from './application.body.js';
import type { InvoiceLineItem } from './invoice.body.js';
import { INVOICE_DEFAULTS } from '../../config/constants.js';

export interface SettleApplicationBody {
  userName: string;
  setupPassword: string;
  merchantNumber: string;
  localeString: string;
  accountNumber: string;
  lineItem: InvoiceLineItem[];
}

export function buildSettleApplicationBody(
  merchant: MerchantInfo,
  leadUuid: string,
  lineItems?: InvoiceLineItem[],
): SettleApplicationBody {
  return {
    ...extractMerchantCredentials(merchant),
    localeString: INVOICE_DEFAULTS.LOCALE,
    accountNumber: leadUuid,
    lineItem: lineItems ?? DEFAULT_LINE_ITEMS,
  };
}

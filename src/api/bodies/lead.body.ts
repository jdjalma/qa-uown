import { type MerchantInfo, extractMerchantCredentials } from './application.body.js';

export interface ChangeLeadStatusBody {
  userName: string;
  setupPassword: string;
  merchantNumber: string;
  leadPk: number;
  newLeadStatus: string;
  comment?: string;
}

export function buildChangeLeadStatusBody(
  merchant: MerchantInfo,
  leadPk: number,
  newLeadStatus: string,
  comment?: string,
): ChangeLeadStatusBody {
  return {
    ...extractMerchantCredentials(merchant),
    leadPk,
    newLeadStatus,
    ...(comment !== undefined && { comment }),
  };
}

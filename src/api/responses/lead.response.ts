import type { BaseResponseBody } from './base.response.js';

export interface ChangeLeadStatusResponseBody extends BaseResponseBody {
  leadPk?: number;
  newLeadStatus?: string;
  previousLeadStatus?: string;
}

export interface UpdateFundingStatusResponseBody extends BaseResponseBody {
  updatedCount?: number;
  leadPks?: number[];
}

export interface ModifyInvoiceResponseBody extends BaseResponseBody {
  newLeadPk?: number;
}

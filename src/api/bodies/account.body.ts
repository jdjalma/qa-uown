/**
 * Request body for POST /uown/svc/getAccountsByCriteria (Task #501).
 * All fields optional — null/blank means "no filter" (blankToNull in backend).
 * merchantName and location use exact case-insensitive match (SQL LOWER() = LOWER()).
 */
export interface AccountSearchCriteriaBody {
  fromDate?: string;
  toDate?: string;
  pageNumber?: string;
  maxResults?: string;
  ssn?: string;
  refAccountId?: string | null;
  email?: string;
  accountPk?: string | null;
  phoneNumber?: string;
  givenName?: string;
  last4CC?: string;
  company?: string;
  merchantName?: string;
  location?: string;
}

export interface CancelAccountBody {
  accountPk: number;
  comment: string;
  refundAllPayments: boolean;
}

/** Request body for TMS/IVR endpoint: POST /uown/tms/v1/accounts/{accountPk}/next-due-date/adjustments */
export interface NextDueDateAdjustmentBody {
  dueDate: string | null; // ISO date YYYY-MM-DD or null (auto-resolve from next receivable)
  offset: number;         // 0-7 (WEEKLY max 3, others max 7)
}

export function buildCancelAccountBody(
  accountPk: string | number,
  comment: string,
  refundAllPayments: boolean,
): CancelAccountBody {
  return { accountPk: Number(accountPk), comment, refundAllPayments };
}

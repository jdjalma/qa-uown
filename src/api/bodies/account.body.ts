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

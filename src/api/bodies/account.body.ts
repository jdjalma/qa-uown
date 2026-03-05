export interface CancelAccountBody {
  comment: string;
  refundAllPayments: boolean;
}

export function buildCancelAccountBody(
  comment: string,
  refundAllPayments: boolean,
): CancelAccountBody {
  return { comment, refundAllPayments };
}

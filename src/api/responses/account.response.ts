import type { BaseResponseBody } from './base.response.js';

export interface CancelAccountResponseBody extends BaseResponseBody {
  accountPk?: number;
  cancelledDateTime?: string;
  refundedAmount?: number;
}

export interface FrequencyModInfo {
  accountPk: number;
  oldFrequency: string;
  newFrequency: string;
  oldTermPayment: number;
  newTermPayment: number;
  firstDueDate: string;
  secondDueDate: string | null;
}

export interface FrequencyModsResponse {
  pk?: number;
  agent: string;
  rowCreatedTimestamp: string;
  frequencyModInfo: FrequencyModInfo;
}

export interface ReceivableInfo {
  receivablePk: number;
  accountPk: number;
  dueDate: string; // ISO date: YYYY-MM-DD
  baseAmount: number;
  totalAmount: number;
  status: string;
  allocationStatus: string;
  receivableType: string;
}

export interface SvcReceivableResponse {
  pk: number;
  rowCreatedTimestamp: string;
  receivableInfo: ReceivableInfo;
}

export interface DueDateMoveRecord {
  pk: number;
  agentUsername: string;
  movedFromDueDate: string; // ISO date: YYYY-MM-DD
  movedByDays: number;
  isFpdChange: boolean;
  adjustmentType: string;
  createdTimestamp: string; // ISO datetime: YYYY-MM-DDTHH:mm:ss
}

export interface DueDateMovesPage {
  content: DueDateMoveRecord[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/** Response from TMS/IVR endpoint: POST /uown/tms/v1/accounts/{accountPk}/next-due-date/adjustments */
export interface DueDateAdjustmentResponse {
  accountPk: number;
  originalDueDate: string; // ISO date: YYYY-MM-DD
  newDueDate: string;      // ISO date: YYYY-MM-DD
}

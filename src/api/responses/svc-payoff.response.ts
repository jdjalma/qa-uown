export interface AccountSummaryResponse {
  epoBalance: number;
  contractBalance: number;
  epoBreakdown?: string[][];
  [key: string]: unknown;
}

export interface AccountSummaryResponse {
  epoBalance: number;
  contractBalance: number;
  epoBreakdown?: string[][];
  [key: string]: unknown;
}

export interface ServicingInformationResponse {
  epoBreakdown: string[][];
  epoFeePercent: number;
  [key: string]: unknown;
}

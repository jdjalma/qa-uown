/**
 * Merchant Configuration Bodies & Presets
 *
 * Typed interfaces for merchant settings that can be applied via API
 * (POST /uown/updateMerchants on svc host).
 *
 * Usage:
 *   await merchantConfig.configure('tireagent', 'signedToFunding');
 *   await merchantConfig.configure('tireagent', { fraudThreshold: 500 });
 *   await merchantConfig.configureWith('tireagent', 'withDealerFees', { maxApprovalAmount: 15000 });
 */

/** Fields that can be changed via updateMerchants API */
export interface MerchantDesiredState {
  dealerDiscountOverride?: number;
  dealerRebateType?: 'FIXED' | 'PERCENTAGE' | null;
  dealerRebateOverride?: number;
  uwPipeline?: string;
  fraudThreshold?: number;
  maxApprovalAmount?: number;
  isSignedToFunding?: boolean;
  peakCampaignId?: string;
  offPeakCampaignId?: string;
  isGdsEnabled?: boolean;
  offerInsurance?: boolean;
  [key: string]: unknown;
}

/** Reusable presets for common merchant configurations */
export const MERCHANT_PRESETS = {
  /** Clean/default merchant state */
  default: {
    dealerDiscountOverride: 0,
    dealerRebateType: null,
    dealerRebateOverride: 0,
    fraudThreshold: 900,
    maxApprovalAmount: 5000,
  },

  /** Standard lifecycle — ensures merchant supports full APPROVED → FUNDED flow */
  lifecycle: {
    maxApprovalAmount: 5000,
    fraudThreshold: 900,
  },

  /** Signed-to-funding enabled */
  signedToFunding: {
    isSignedToFunding: true,
  },

  /** Dealer discount + rebate for financial tests */
  withDealerFees: {
    dealerDiscountOverride: 5,
    dealerRebateType: 'PERCENTAGE' as const,
    dealerRebateOverride: 3,
  },

  /** High fraud threshold — no leads blocked */
  noFraudBlock: {
    fraudThreshold: 999,
  },

  /** High approval for large order tests */
  highApproval: {
    maxApprovalAmount: 25000,
  },

  /** Insurance enabled on merchant */
  withInsurance: {
    offerInsurance: true,
  },

  /** Insurance disabled on merchant */
  noInsurance: {
    offerInsurance: false,
  },
} satisfies Record<string, MerchantDesiredState>;

export type MerchantPreset = keyof typeof MERCHANT_PRESETS;

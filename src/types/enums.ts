export enum Portal {
  ORIGINATION = 'origination',
  SERVICING = 'servicing',
  WEBSITE = 'website',
  AMS = 'ams',
}

export enum LeadStatus {
  CANCELLED_DUP_SSN = 'CANCELLED_DUP_SSN',
  CANCELLED_DUP_DENIAL = 'CANCELLED_DUP_DENIAL',
  UW_APPROVED = 'UW_APPROVED',
  UW_DENIED = 'UW_DENIED',
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  READY_TO_FUND = 'READY_TO_FUND',
  FUNDING = 'FUNDING',
  FUNDED = 'FUNDED',
  DENIED = 'DENIED',
  CANCELLED = 'CANCELLED',
  CANCELLED_CONTRACT = 'CANCELLED_CONTRACT',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  NEURO_ID_APPROVED = 'NEURO_ID_APPROVED',
  NEURO_ID_ERROR = 'NEURO_ID_ERROR',
  NEURO_ID_DENIED = 'NEURO_ID_DENIED',
}

export enum NeuroIdStatus {
  SUCCESS = 'SUCCESS',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  FAILED = 'FAILED',
}

export enum FraudStatus {
  APPROVE = 'APPROVE',
  DECLINE = 'DECLINE',
  REVIEW = 'REVIEW',
}

export enum ContractStatus {
  SIGNED = 'SIGNED',
}

export enum LeaseStatus {
  SIGNED = 'SIGNED',
  FUNDING = 'FUNDING',
  FUNDED = 'FUNDED',
  REVERSED = 'REVERSED',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  UW_APPROVED = 'UW_APPROVED',
}

export enum RecordStatus {
  ACTIVE = 'ACTIVE',
}

export enum UwStatus {
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
}

export enum InvoiceStatus {
  SENT = 'SENT',
  SIGNED = 'SIGNED',
  LEASE_MOD = 'LEASE_MOD',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
  NEW = 'NEW',
}

export enum InvoiceType {
  LEASE = 'LEASE',
  LEASE_MOD = 'LEASE_MOD',
}

export enum FundingQueueStatus {
  FUNDING = 'Funding',
  FUNDED = 'Funded',
  REQUEST_REFUND = 'Request Refund',
  REFUNDED = 'Refunded',
}


export enum ReverseReason {
  REVERSE = 'Reverse',
  FULLY_REFUND = 'Fully Refund',
  PARTIAL_REFUND = 'Partial Refund',
}

export enum QuickSearchOption {
  LEAD = 'LEAD',
  ACCOUNT = 'ACCOUNT',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CUSTOMER_NAME = 'CUSTOMER_NAME',
  LAST4CC = 'LAST4CC',
  SSN = 'SSN',
  INVOICE = 'INVOICE',
  UUID = 'UUID',
}

export enum AllocationStrategy {
  DEFAULT = 'Payment/EPO',
  REGULAR_RECEIVABLES = 'Payment',
  EPO_ONLY = 'EPO Only',
}

export enum PageConfig {
  OVERVIEW = 'overview',
  CUSTOMERS = 'customers',
  LEADS = 'leads',
  FUNDING = 'funding',
  FUNDING_HISTORY = 'funding-history',
  MERCHANT_LIST = 'merchant-list',
  MERCHANT_DETAIL = 'merchant-detail',
  PROGRAMS = 'programs',
  USERS = 'users',
  NEW_APP = 'new-app',
  SEARCH = 'search',
  CUSTOMER_INFORMATION = 'customer-information',
}

// ── Test Pyramid Tags ────────────────────────────────────────────────
/**
 * Test pyramid tags for categorizing tests by scope and criticality.
 *
 * Usage: add to test.describe() or testData[].tag as space-separated string.
 * Run with: npx playwright test --grep @smoke
 *
 * Pyramid (bottom → top):
 *   @regression  → Full coverage, all tests (broadest)
 *   @sanity      → Core business flows, post-deploy validation
 *   @smoke       → Quick health check, API-only or minimal UI
 *   @critical    → Business-critical, must never fail (orthogonal to pyramid)
 *
 * Environment tags: @sandbox, @qa1, @qa2, @stg, @dev1, @dev2, @dev3
 * Pipeline tags: @cicd
 */
export enum TestTag {
  // ── Pyramid tags ──
  SMOKE = '@smoke',
  SANITY = '@sanity',
  REGRESSION = '@regression',
  CRITICAL = '@critical',

  // ── Pipeline tags ──
  CICD = '@cicd',

  // ── Environment tags ──
  SANDBOX = '@sandbox',
  QA1 = '@qa1',
  QA2 = '@qa2',
  STG = '@stg',
  DEV1 = '@dev1',
  DEV2 = '@dev2',
  DEV3 = '@dev3',
}

/**
 * Helper to build a tag string from multiple TestTag values.
 * @example buildTags(TestTag.CRITICAL, TestTag.REGRESSION, TestTag.CICD, TestTag.SANDBOX)
 *          → '@critical @regression @cicd @sandbox'
 */
export function buildTags(...tags: TestTag[]): string {
  return tags.join(' ');
}

/**
 * Helper to split a tag string into an array for Playwright's tag option.
 * @example splitTags('@critical @regression @cicd') → ['@critical', '@regression', '@cicd']
 */
export function splitTags(tagString: string): string[] {
  return tagString.split(/\s+/).filter(Boolean);
}

/**
 * API Setup Helpers
 *
 * Eliminates repeated API setup sequences across E2E and hybrid tests.
 * Consolidates: sendApplication + (optional) verify approval + sendInvoice + authorizeCreditCard.
 *
 * Each test uses the same core sequence but may add extra steps (e.g. extracting contractUrl).
 * This helper covers the common denominator and returns enough data for tests to continue.
 */
import { expect } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import type { ApiClients, TestContext } from '@support/base-test.js';
import type { MerchantInfo, ApplicantInfo, OrderInfo } from '@api/bodies/index.js';
import { sleep } from './common.helpers.js';

/**
 * The API may return a contract URL with the wrong host
 * (e.g. secure-sandbox when the test runs on dev3).
 * This normalizes the URL to match the current environment.
 */
function normalizeContractUrlHost(url: string, env: string): string {
  // Pattern: https://secure-{envSlug}.uownleasing.com/...
  const match = url.match(/^(https:\/\/secure-)([\w-]+)(\.uownleasing\.com\/.*)$/);
  if (match && match[2] !== env) {
    const corrected = `${match[1]}${env}${match[3]}`;
    console.log(`[API Setup] Contract URL host corrected: "${match[2]}" → "${env}"`);
    return corrected;
  }
  return url;
}

// ── Options ─────────────────────────────────────────────────────────

export interface ApiSetupOptions {
  /** Merchant credentials for API calls */
  merchant: MerchantInfo;
  /** Applicant personal info */
  applicant: ApplicantInfo;
  /** Order details */
  order: OrderInfo;
  /**
   * Environment name (e.g. 'sandbox', 'dev3') — used to normalize the contract URL host.
   * If not provided, the contract URL is used as-is from the API response.
   */
  env?: string;
  /**
   * Wait and verify that the application was approved after sendApplication.
   * Adds a 5s delay + getApplicationStatus check.
   * Default: false
   */
  verifyApproval?: boolean;
  /**
   * Extract the contract URL (redirectUrl) from the sendApplication response.
   * The URL is found in paymentDetailsList[idx].redirectUrl
   * (idx=1 if >1 entry, else idx=0).
   * Default: false
   */
  extractContractUrl?: boolean;
  /**
   * Skip the authorizeCreditCard API call. Set to true when the test
   * will use the contract URL to fill CC info via the UI — pre-authorizing
   * the CC via API invalidates the contract URL.
   * Default: false
   */
  skipCreditCardAuth?: boolean;
  /**
   * Skip the sendInvoice call (step 3).
   * Use when sendApplication already includes order data — calling sendInvoice
   * again regenerates the payment plan and invalidates the already-extracted
   * contractUrl (redirectUrl), causing "Invalid link" on the consumer portal.
   * Default: false
   */
  skipInvoice?: boolean;
  /**
   * Submit CC + bank info via API (submitApplication endpoint) instead of
   * relying on the contract URL. This is more reliable as it bypasses the
   * consumer-facing form which can show "Invalid link" errors.
   * When true, automatically skips CC auth (since submitApplication handles it).
   * Default: false
   */
  submitPaymentInfoViaApi?: boolean;
}

// ── Result ──────────────────────────────────────────────────────────

export interface ApiSetupResult {
  /** Lead primary key (numeric) from authorizationNumber */
  leadPk: string;
  /** Lead UUID from accountNumber */
  leadUuid: string;
  /** Contract redirect URL (only populated if extractContractUrl was true) */
  contractUrl?: string;
}

// ── Main function ───────────────────────────────────────────────────

/**
 * Executes the standard API setup sequence for creating a new application:
 *   1. sendApplication → extract leadPk and leadUuid
 *   2. (optional) getApplicationStatus → verify approval
 *   3. sendInvoice
 *   4. authorizeCreditCard
 *
 * Optionally annotates testInfo with leadPk, leadUuid, and contractUrl.
 * Optionally populates ctx with the same values.
 *
 * @param api - ApiClients fixture instance
 * @param options - Setup configuration
 * @param testInfo - Optional TestInfo for annotations
 * @param ctx - Optional TestContext to populate with leadPk, leadUuid, contractUrl
 * @returns ApiSetupResult with extracted identifiers
 */
/** Extract contract URL from paymentDetailsList in the API response */
function extractContractUrlFromResponse(
  paymentDetailsList: Array<{ redirectUrl?: string }> | undefined,
  envName?: string,
): string {
  if (!paymentDetailsList || paymentDetailsList.length === 0) return '';
  console.log(`[API Setup] paymentDetailsList (${paymentDetailsList.length} entries): ${JSON.stringify(paymentDetailsList)}`);
  const idx = paymentDetailsList.length > 1 ? 1 : 0;
  let url = paymentDetailsList[idx].redirectUrl ?? '';
  if (url && envName) {
    url = normalizeContractUrlHost(url, envName);
  }
  return url;
}

/** Populate ctx and testInfo with result data */
function propagateResult(
  result: ApiSetupResult,
  testInfo?: TestInfo,
  ctx?: TestContext,
): void {
  if (ctx) {
    ctx.leadPk = result.leadPk;
    ctx.leadUuid = result.leadUuid;
    if (result.contractUrl) ctx.contractUrl = result.contractUrl;
  }
  if (testInfo) {
    testInfo.annotations.push({ type: 'leadPk', description: result.leadPk });
    testInfo.annotations.push({ type: 'leadUuid', description: result.leadUuid });
    if (result.contractUrl) {
      testInfo.annotations.push({ type: 'contractUrl', description: result.contractUrl });
    }
  }
}

/** Reconcile portal leadPk with the one from sendApplication */
async function reconcilePortalLeadPk(
  api: ApiClients,
  merchant: MerchantInfo,
  result: ApiSetupResult,
  testInfo?: TestInfo,
  ctx?: TestContext,
): Promise<void> {
  const statusResponse = await api.application.getApplicationStatus(merchant, result.leadUuid);
  if (!statusResponse.ok) {
    console.log(`[API Setup] getApplicationStatus failed: ${statusResponse.status} ${statusResponse.statusText}`);
    return;
  }
  const portalLeadPk = statusResponse.body.leadPk ? String(statusResponse.body.leadPk) : '';
  if (portalLeadPk && portalLeadPk !== result.leadPk) {
    console.log(`[API Setup] Portal leadPk="${portalLeadPk}" differs from authorizationNumber="${result.leadPk}" — using portal value`);
    result.leadPk = portalLeadPk;
    if (ctx) ctx.leadPk = portalLeadPk;
    if (testInfo) testInfo.annotations.push({ type: 'portalLeadPk', description: portalLeadPk });
  }
}

// ── Status extraction ────────────────────────────────────────────

/**
 * Extracts the approval status from an API response body.
 * Checks common field names in order: appApprovalStatus, uwStatus, currentStatus, status.
 * Accepts the typed ApplicationStatusResponseBody or any object with those optional fields.
 */
export function extractApprovalStatus(body: { appApprovalStatus?: string; uwStatus?: string; currentStatus?: string; status?: string }): string {
  return (body.appApprovalStatus || body.uwStatus || body.currentStatus || body.status) ?? '';
}

// ── Pre-qualification flow ───────────────────────────────────────

export interface PreQualifiedOptions {
  /** Submit payment info via submitApplication API (moves to CONTRACT_CREATED) */
  submitPaymentInfoViaApi?: boolean;
  /** Skip CC auth entirely (stays at UW_APPROVED) */
  skipPaymentInfo?: boolean;
}

export interface PreQualifiedResult {
  approvedAmount: number;
}

/**
 * Creates an application via pre-qualification pattern (no order data),
 * verifies approval, and sends invoice with approvedAmount.
 *
 * Used by lease-cancellation, modify-lease, and similar tests that need
 * the approved amount to build their invoice.
 */
export async function createPreQualifiedApplication(
  api: ApiClients,
  merchant: MerchantInfo,
  applicant: ApplicantInfo,
  ctx: TestContext,
  options: PreQualifiedOptions = {},
  testInfo?: TestInfo,
): Promise<PreQualifiedResult> {
  // 1. Send application WITHOUT order (pre-qualification)
  const appResp = await api.application.sendApplication(merchant, applicant);
  expect(appResp.ok, `sendApplication responded with ${appResp.status}`).toBeTruthy();
  ctx.leadUuid = appResp.body.accountNumber ?? String(appResp.body.authorizationNumber ?? '');
  ctx.leadPk = String(appResp.body.authorizationNumber ?? '');
  expect(ctx.leadUuid).toBeTruthy();
  if (testInfo) {
    testInfo.annotations.push(
      { type: 'leadPk', description: ctx.leadPk },
      { type: 'leadUuid', description: ctx.leadUuid },
    );
  }
  console.log(`[Setup] leadPk="${ctx.leadPk}" leadUuid="${ctx.leadUuid}"`);

  // 2. Wait for approval + get approvedAmount
  await sleep(5_000);
  const statusResp = await api.application.getApplicationStatus(merchant, ctx.leadUuid);
  expect(statusResp.ok, `getApplicationStatus responded with ${statusResp.status}`).toBeTruthy();
  const status = extractApprovalStatus(statusResp.body);
  expect(status?.toLowerCase(), `Expected APPROVED but got: ${status}`).toContain('approved');

  // Reconcile portal leadPk
  if (statusResp.body.leadPk) {
    ctx.leadPk = String(statusResp.body.leadPk);
  }

  const approvedAmount = statusResp.body.approvedAmount ?? 0;
  expect(approvedAmount, 'approvedAmount should be positive').toBeGreaterThan(0);
  console.log(`[Setup] approvedAmount=${approvedAmount}`);

  // 3. Send invoice with approved amount
  const invoiceResp = await api.invoice.sendInvoice(merchant, ctx.leadUuid, {
    orderTotal: String(approvedAmount),
  });
  expect(invoiceResp.ok, `sendInvoice responded with ${invoiceResp.status}`).toBeTruthy();

  // 4. CC auth or submit payment info (unless skipped)
  if (options.skipPaymentInfo) {
    console.log('[Setup] Skipping payment info — staying at UW_APPROVED');
  } else if (options.submitPaymentInfoViaApi) {
    const submitResp = await api.application.submitApplication(
      Number(ctx.leadPk), applicant.firstName, applicant.lastName,
    );
    console.log(`[Setup] submitApplication ${submitResp.ok ? 'succeeded' : 'failed'}`);
  } else {
    const ccResp = await api.creditCard.authorizeCreditCard(ctx.leadPk, applicant.firstName, applicant.lastName);
    expect(ccResp.ok, `CC auth responded with ${ccResp.status}`).toBeTruthy();
  }

  return { approvedAmount };
}

// ── Lead state transitions ───────────────────────────────────────

/**
 * Drives a lead to SIGNED status via API.
 */
export async function driveLeadToSigned(
  api: ApiClients,
  merchant: MerchantInfo,
  ctx: TestContext,
): Promise<void> {
  const resp = await api.lead.changeLeadStatus(
    merchant, Number(ctx.leadPk), 'SIGNED', 'Automated - SIGNED',
  );
  expect(resp.ok, `changeLeadStatus SIGNED: ${resp.status}`).toBeTruthy();
}

/**
 * Drives a lead from current state to FUNDING:
 *   SIGNED → settle → updateFundingStatus(FUNDING)
 */
export async function driveLeadToFunding(
  api: ApiClients,
  merchant: MerchantInfo,
  ctx: TestContext,
): Promise<void> {
  const signedResp = await api.lead.changeLeadStatus(
    merchant, Number(ctx.leadPk), 'SIGNED', 'Automated - SIGNED',
  );
  expect(signedResp.ok, `changeLeadStatus SIGNED: ${signedResp.status}`).toBeTruthy();

  const settleResp = await api.settlement.settleApplication(merchant, ctx.leadUuid);
  expect(settleResp.ok, `settleApplication: ${settleResp.status}`).toBeTruthy();

  await sleep(3_000);
  const fundingResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDING');
  expect(fundingResp.ok, `updateFundingStatus: ${fundingResp.status}`).toBeTruthy();
}

// ── Main setup function ──────────────────────────────────────────

export async function setupApplicationViaApi(
  api: ApiClients,
  options: ApiSetupOptions,
  testInfo?: TestInfo,
  ctx?: TestContext,
): Promise<ApiSetupResult> {
  const {
    merchant,
    applicant,
    order,
    env: envName,
    verifyApproval = false,
    extractContractUrl = false,
    skipCreditCardAuth = false,
    submitPaymentInfoViaApi = false,
    skipInvoice = false,
  } = options;

  const result: ApiSetupResult = { leadPk: '', leadUuid: '' };

  // 1. Send application
  const appResponse = await api.application.sendApplication(merchant, applicant, order);
  expect(appResponse.ok, `Send application responded with ${appResponse.status}`).toBeTruthy();
  result.leadPk = String(appResponse.body.authorizationNumber ?? '');
  result.leadUuid = appResponse.body.accountNumber ?? result.leadPk;
  console.log(`[API Setup] leadPk="${result.leadPk}" leadUuid="${result.leadUuid}"`);

  // Extract contract URL if requested
  if (extractContractUrl) {
    result.contractUrl = extractContractUrlFromResponse(appResponse.body.paymentDetailsList, envName);
    expect(result.contractUrl, 'No contract URL (redirectUrl) in sendApplication response').toBeTruthy();
    console.log(`[API Setup] contractUrl: "${result.contractUrl}"`);
  }

  propagateResult(result, testInfo, ctx);

  // 2. Verify approval if requested
  if (verifyApproval) {
    await sleep(5_000);
    const statusResponse = await api.application.getApplicationStatus(merchant, result.leadUuid);
    expect(statusResponse.ok, `Status check responded with ${statusResponse.status}`).toBeTruthy();
    const status = extractApprovalStatus(statusResponse.body);
    expect(status?.toLowerCase()).toContain('approved');
  }

  // 3. Send invoice (skip when sendApplication already included order — avoids invalidating contractUrl)
  if (!skipInvoice) {
    const invoiceResponse = await api.invoice.sendInvoice(merchant, result.leadUuid, {
      orderTotal: order.orderTotal,
    });
    expect(invoiceResponse.ok, `Send invoice responded with ${invoiceResponse.status}`).toBeTruthy();
  } else {
    console.log('[API Setup] Skipping sendInvoice — order was included in sendApplication');
  }

  // 4. Authorize credit card (skip if submitting payment info via API or using contract URL)
  if (!skipCreditCardAuth && !submitPaymentInfoViaApi) {
    const ccResponse = await api.creditCard.authorizeCreditCard(result.leadPk, applicant.firstName, applicant.lastName);
    expect(ccResponse.ok, `CC auth responded with ${ccResponse.status}`).toBeTruthy();
  } else {
    console.log(`[API Setup] Skipping CC auth — ${submitPaymentInfoViaApi ? 'submitApplication will handle it' : 'test will use contract URL for CC entry'}`);
  }

  // 4b. Submit CC + bank info via API (replaces contract URL form)
  if (submitPaymentInfoViaApi) {
    const submitResponse = await api.application.submitApplication(result.leadPk, applicant.firstName, applicant.lastName);
    console.log(`[API Setup] submitApplication ${submitResponse.ok ? 'succeeded' : 'failed'}: ${JSON.stringify(submitResponse.body)}`);
  }

  // 5. Reconcile portal leadPk
  await reconcilePortalLeadPk(api, merchant, result, testInfo, ctx);

  return result;
}

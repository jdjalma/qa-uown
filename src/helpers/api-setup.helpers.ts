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
import { buildSendApplicationBody } from '@api/bodies/index.js';
import { sleep } from './common.helpers.js';
import { ensureMerchantReady } from './merchant-config.helper.js';

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
  /** Direct iframe URL returned by submitApplication (only when submitPaymentInfoViaApi=true). */
  embeddedSigningUrl?: string;
  /** Provider chosen by backend routing — 'GOWSIGN' | 'SIGNWELL' (only when submitPaymentInfoViaApi=true). */
  esignClient?: string;
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

/**
 * Application-shape overrides exposed to callers (SPEC svc#531 §12 G1).
 * Defaults remain WEEKLY frequency + whatever program the backend resolves
 * from merchant config; passing `termMonths` does NOT mutate the wire body
 * by itself — pair it with `programName` so the backend resolves the
 * matching `uown_merchant_program`. `merchantPk` / `programPk` are accepted
 * for caller bookkeeping (no silent injection into the body).
 */
export interface PreQualifiedApplicationOptions {
  termMonths?: 13 | 16;
  state?: string;
  merchantPk?: number;
  programPk?: number;
  programName?: string;
  desiredPaymentFrequency?: string;
  /**
   * Override `mainAnnualIncome` (default 56000). Higher income raises
   * `BlackBoxApproval`, which in turn drives `EligibleTerms` from the
   * underwriter. Required when forcing 16m in qa1 (memory
   * `reference_qa1_16m_eligibility_blocked`).
   */
  mainAnnualIncome?: number;
}

export interface PreQualifiedOptions {
  /** Submit payment info via submitApplication API (moves to CONTRACT_CREATED) */
  submitPaymentInfoViaApi?: boolean;
  /** Skip CC auth entirely (stays at UW_APPROVED) */
  skipPaymentInfo?: boolean;
  /**
   * Banking data to inject in sendApplication body.
   * Required for Kornerstone flow (merchant + BIN + banking → KORNERSTONE routing).
   * When set, helper uses the body-overload of sendApplication and appends these fields.
   */
  bankData?: { routingNumber: string; accountNumber: string };
  /**
   * Skip merchant preflight (ensureMerchantReady). Use when the caller
   * already validated the merchant or is intentionally testing drift.
   */
  skipMerchantPreflight?: boolean;
  /**
   * Explicit overrides for term / state / program. No silent defaults — if
   * omitted, legacy behavior is preserved (default WEEKLY, backend resolves
   * program). See `PreQualifiedApplicationOptions`.
   */
  application?: PreQualifiedApplicationOptions;
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
  // 0. Merchant preflight — ensure settings + programs match the contract
  // before sendApplication. Pitfall #10: stale merchant config (missing flag,
  // unchecked checkbox) causes sendApplication 400/500 with opaque errors.
  await ensureMerchantReady(api, merchant.number, {
    skip: options.skipMerchantPreflight,
  });

  // 1. Send application WITHOUT order (pre-qualification)
  // reason: when bankData is provided, build body manually so we can inject
  // mainBankRoutingNumber + mainBankAccountNumber (required for Kornerstone routing).
  // application overrides (term / state / program) also force the body-overload
  // path so the overrides actually reach the wire body.
  let appResp;
  const appOverrides = options.application;
  const buildOverrides = appOverrides
    ? {
        state: appOverrides.state,
        programName: appOverrides.programName,
        desiredPaymentFrequency: appOverrides.desiredPaymentFrequency,
        mainAnnualIncome: appOverrides.mainAnnualIncome,
      }
    : undefined;
  if (options.bankData || appOverrides) {
    const body = buildSendApplicationBody(merchant, applicant, undefined, buildOverrides);
    if (options.bankData) {
      body.mainBankRoutingNumber = options.bankData.routingNumber;
      body.mainBankAccountNumber = options.bankData.accountNumber;
    }
    appResp = await api.application.sendApplication(body);
  } else {
    appResp = await api.application.sendApplication(merchant, applicant);
  }
  if (!appResp.ok) {
    // reason: log response body when sendApplication fails — otherwise the test
    // fails with a generic "400" and no indication of the actual validation error.
    console.log(`[Setup] sendApplication ${appResp.status} body: ${JSON.stringify(appResp.body)}`);
  }
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
    // reason: submitApplication fails with "Merchant program is required" on brand-new
    // leads without prior merchantProgramPk. getMissingFields MUST be called first —
    // it reads shortCode + planId from the invoice redirectUrl and resolves the program.
    // When `application.termMonths` is set, prefer the matching paymentDetailsList
    // entry — otherwise `[0]` is the default (auto-resolved by svc, typically 13m
    // for Daniel's Jewelers + CA). See memory `reference_merchant_program_resolution`.
    const detailsList = invoiceResp.body?.paymentDetailsList ?? [];
    const desiredTerm = appOverrides?.termMonths;
    const matched = desiredTerm
      ? detailsList.find((d: { termInMonths?: number }) => d.termInMonths === desiredTerm)
      : undefined;
    if (desiredTerm && !matched) {
      const available = detailsList.map((d: { termInMonths?: number }) => d.termInMonths).join(',');
      throw new Error(
        `[Setup] application.termMonths=${desiredTerm} requested but paymentDetailsList only has terms [${available}]`,
      );
    }
    const redirectUrl = (matched ?? detailsList[0])?.redirectUrl ?? '';
    if (redirectUrl) {
      const url = new URL(redirectUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const shortCode = pathParts[0] ?? '';
      const planId = url.searchParams.get('planId') ?? '';
      if (shortCode) {
        const missingResp = await api.application.getMissingFields(
          shortCode,
          planId ? { planId } : undefined,
        );
        expect(missingResp.ok, `getMissingFields responded with ${missingResp.status}`).toBeTruthy();
        console.log(`[Setup] getMissingFields ok (shortCode=${shortCode}, planId=${planId || '(none)'})`);
      } else {
        console.warn('[Setup] Could not extract shortCode from invoice redirectUrl');
      }
    } else {
      console.warn('[Setup] No redirectUrl in invoice response — submitApplication may fail');
    }

    const submitResp = await api.application.submitApplication(
      Number(ctx.leadPk), applicant.firstName, applicant.lastName,
    );
    console.log(`[Setup] submitApplication ${submitResp.ok ? 'succeeded' : 'failed'}: ${JSON.stringify(submitResp.body)}`);
    expect(submitResp.ok, `submitApplication responded with ${submitResp.status}`).toBeTruthy();
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

  // 1. Send application — retry up to 3x on qa2 transient 5xx (Task #505 OBS-02:
  //    `sendApplication 500: 401 Unauthorized: [no body]` from svc → downstream service,
  //    intermittent under qa2 load). Permanent 4xx (validation errors) propagate immediately.
  let appResponse = await api.application.sendApplication(merchant, applicant, order);
  let attempt = 1;
  while (!appResponse.ok && appResponse.status >= 500 && attempt < 3) {
    console.log(`[API Setup] sendApplication transient ${appResponse.status} (attempt ${attempt}/3) — retrying after backoff`);
    await sleep(2_000 * attempt);
    appResponse = await api.application.sendApplication(merchant, applicant, order);
    attempt++;
  }
  expect(appResponse.ok, `Send application responded with ${appResponse.status} after ${attempt} attempt(s) body=${JSON.stringify(appResponse.body).slice(0, 200)}`).toBeTruthy();
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
  // Lifted declaration: invoice response is consumed by step 4b (shortCode for getMissingFields).
  let invoiceResponse: Awaited<ReturnType<typeof api.invoice.sendInvoice>> | null = null;
  if (!skipInvoice) {
    invoiceResponse = await api.invoice.sendInvoice(merchant, result.leadUuid, {
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
    // 4b.i Resolve merchantProgramPk via getMissingFields — required before submitApplication,
    // otherwise backend rejects with "Merchant program is required to determine fee" (500).
    // shortCode + planId are embedded in the sendInvoice redirectUrl.
    const invoiceBody = invoiceResponse?.body ?? null;
    const redirectUrl = invoiceBody?.paymentDetailsList?.[0]?.redirectUrl ?? '';
    if (redirectUrl) {
      const url = new URL(redirectUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const shortCode = pathParts[0] ?? '';
      const planId = url.searchParams.get('planId') ?? '';
      if (shortCode) {
        const missingResp = await api.application.getMissingFields(
          shortCode,
          planId ? { planId } : undefined,
        );
        expect(
          missingResp.ok,
          `getMissingFields responded with ${missingResp.status}`,
        ).toBeTruthy();
      } else {
        console.warn('[API Setup] Could not extract shortCode from invoice redirectUrl');
      }
    } else {
      console.warn('[API Setup] No invoice response available for shortCode extraction');
    }

    // submitApplication — retry up to 3x on qa2 transient 5xx (UnexpectedRollbackException).
    let submitResponse = await api.application.submitApplication(result.leadPk, applicant.firstName, applicant.lastName);
    let submitAttempt = 1;
    while (!submitResponse.ok && submitResponse.status >= 500 && submitAttempt < 3) {
      console.log(`[API Setup] submitApplication transient ${submitResponse.status} (attempt ${submitAttempt}/3) — retrying after backoff`);
      await sleep(2_000 * submitAttempt);
      submitResponse = await api.application.submitApplication(result.leadPk, applicant.firstName, applicant.lastName);
      submitAttempt++;
    }
    console.log(`[API Setup] submitApplication ${submitResponse.ok ? 'succeeded' : 'failed'} after ${submitAttempt} attempt(s): ${JSON.stringify(submitResponse.body)}`);
    // Capture iframe URL + esign provider chosen by backend routing.
    // Per Task #505 (UI-first restructure): tests need direct iframe URL to validate
    // visually — `redirectUrl` (paymentDetailsList) leads to consumer flow form, not iframe.
    if (submitResponse.ok && submitResponse.body) {
      const body = submitResponse.body as Record<string, unknown>;
      if (typeof body.embeddedSigningUrl === 'string') {
        result.embeddedSigningUrl = body.embeddedSigningUrl;
        if (ctx) ctx.embeddedSigningUrl = body.embeddedSigningUrl;
      }
      if (typeof body.esignClient === 'string') {
        result.esignClient = body.esignClient;
        if (ctx) ctx.esignClient = body.esignClient;
      }
      console.log(`[API Setup] esignClient=${result.esignClient ?? '(none)'} embeddedSigningUrl=${result.embeddedSigningUrl ?? '(none)'}`);
    }
  }

  // 5. Reconcile portal leadPk
  await reconcilePortalLeadPk(api, merchant, result, testInfo, ctx);

  return result;
}

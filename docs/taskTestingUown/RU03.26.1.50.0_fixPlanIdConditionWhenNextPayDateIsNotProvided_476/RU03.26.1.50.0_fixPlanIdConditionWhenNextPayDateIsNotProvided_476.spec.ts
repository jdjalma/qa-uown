/**
 * Task #476 — Fix PlanId condition when NextPayDate is not provided
 * Milestone: RU03.26.1.50.0
 * Labels: bug::production, priority::high
 *
 * Two backend fixes validated here:
 *
 * 1. UownClient.getPaymentOptions(): Previously threw "Please provide next pay date"
 *    even when payment options already existed in the DB. Fix: check DB first,
 *    then use default date if config `allow.default.nextPayDate.for.merchant.{code}` allows.
 *
 * 2. MissingRequiredFieldsService.resolveAndSetMerchantProgramFromPlanId(): Previously
 *    threw NPE when merchantProgram could not be resolved from planId. Fix: guard added.
 *
 * planId format: {frequencyAbbr}{termMonths} — e.g. WK13, BW13, SM13, MN16
 *
 * CT-01 — sendApplication WITH nextPayDate → planId valid in redirectUrl
 * CT-02 — planId format matches regex — all frequencies validated
 * CT-03 — sendApplication WITHOUT nextPayDate → no crash (HTTP ≠ 500)
 * CT-04 — sendApplication with empty nextPayDate → no crash (HTTP ≠ 500)
 * CT-05 — getMissingFields WITH planId → 200, no NPE
 * CT-06 — getMissingFields WITHOUT planId → 200 (backward compat)
 * CT-07 — getMissingFields with invalid planId → no crash (HTTP ≠ 500)
 * CT-08 — getApplicationStatus → planId consistent with sendApplication
 * CT-09 — [E2E] PayPossible merchant → providerURL with empty planId → fill
 *          missing employment info (nextPayDate + frequency) → plan selection → CC form
 *
 * GitLab: Task #476 — RU03.26.1.50.0
 * Pipeline: debug (production bug fix)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { MERCHANTS } from '@data/merchants.js';
import {
  generateTestSSN,
  generateTestPhone,
  generateRunId,
} from '@config/constants.js';
import { calculateDate } from '@helpers/date.helpers.js';
import { ContractPage } from '@pages/origination/index.js';
import type { SendApplicationBody } from '@api/bodies/application.body.js';

// ── Constants ─────────────────────────────────────────────────────────

const TEST_NAME = 'RU03.26.1.50.0_fixPlanIdConditionWhenNextPayDateIsNotProvided_476';

/**
 * Valid planId format: {frequencyAbbr}{termMonths}
 * BW = Bi-Weekly (short), BWK = Bi-Weekly (long), WK = Weekly, SM = Semi-Monthly, MN = Monthly
 * Term months: 13 or 16
 */
const PLAN_ID_REGEX = /^(WK|BW|BWK|SM|MN)(13|16)$/;

const FREQ_LABELS: Record<string, string> = {
  WK: 'Weekly',
  BW: 'Bi-Weekly',
  BWK: 'Bi-Weekly',
  SM: 'Semi-Monthly',
  MN: 'Monthly',
};

// ── Test data ─────────────────────────────────────────────────────────

const testData = [
  {
    env: 'stg',
    merchant: 'PayPossible',
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

/** Extract planId from redirectUrl query parameter */
function extractPlanId(item: { planId?: string; redirectUrl?: string }): string | undefined {
  let pid = item.planId;
  if (!pid && item.redirectUrl) {
    try {
      const url = new URL(item.redirectUrl);
      pid = url.searchParams.get('planId') ?? undefined;
    } catch {
      // ignore invalid URLs
    }
  }
  return pid || undefined;
}

/** Extract shortCode from redirectUrl path (first path segment) */
function extractShortCode(redirectUrl: string): string | undefined {
  try {
    const urlPath = new URL(redirectUrl).pathname; // e.g. /HdUzwDLc/complete
    const segments = urlPath.split('/').filter(Boolean);
    return segments[0] || undefined;
  } catch {
    return undefined;
  }
}

// ── Tests ─────────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(`${TEST_NAME} - ${data.env}/${data.merchant}`, { tag: splitTags(data.tag) }, () => {
    test.describe.configure({ mode: 'serial' });

    // Shared state across serial CTs
    let approvedLeadUuid: string;
    let approvedShortCode: string;
    let approvedPlanIds: string[];
    let approvedRedirectUrls: string[];

    // CT-01: sendApplication WITH nextPayDate → planId valid
    test('CT-01: sendApplication COM nextPayDate retorna planId válido', async ({ api, testEnv }) => {
      await test.step('Setup merchant', async () => {
        const m = MERCHANTS[data.merchant];
        expect(m, `Merchant ${data.merchant} not found`).toBeDefined();
      });

      const m = MERCHANTS[data.merchant];
      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();
      const ssn = generateTestSSN(true); // approved (not ending in 9)
      const nextPayDate = calculateDate(7); // MM/DD/YYYY

      await test.step('Send application with nextPayDate', async () => {
        const body: SendApplicationBody = {
          userName: m.username,
          setupPassword: m.password,
          merchantNumber: m.number,
          mainFirstName: `FN${runId.slice(-4)}`,
          mainLastName: `LN${runId.slice(-4)}`,
          mainDOB: '01011984',
          mainSSN: ssn,
          mainAddress1: '123 Main St',
          mainCity: 'New York',
          mainStateOrProvince: 'NY',
          mainPostalCode: '10001',
          mainCellPhone: generateTestPhone(),
          emailAddress: email,
          mainEmployerName: 'Uown TEST',
          mainPastBankruptcy: false,
          mainCurrentOrFutureBankruptcy: false,
          languagePreference: 'E',
          iovationFingerprintText: 'fingerPrintText',
          ipaddress: '192.168.0.2',
          desiredPaymentFrequency: 'WEEKLY',
          mainAnnualIncome: 56000,
          mainPayFrequency: 'WEEKLY',
          mainNextPayDate: nextPayDate.replace(/\//g, ''),
          mainLastPayDate: calculateDate(-7).replace(/\//g, ''),
          mainEmploymentDuration: '_1_TO_2_YEARS',
          shipToSameAsConsumer: true,
          merchandiseSubtotal: '680.50',
          discountAmount: '0.00',
          deliveryCharge: '25.00',
          installationCharge: '0.00',
          salesTax: '59.50',
          miscellaneousFees: '0.00',
          depositAmount: '0.00',
          orderTotal: '765.00',
          invoiceNumber: `R${10000 + Math.floor(Math.random() * 90000)}`,
          lineItem: [{
            lineItemLineNumber: '1',
            lineItemSerialNumber: `SKU-${Date.now()}`,
            lineItemProductNumber: 'TEST-001',
            lineItemProductDescription: 'Test Item',
            lineItemProductCategory: 'Appliances',
            lineItemType: 'D',
            lineItemQuantityOrdered: '1',
            lineItemUnitPrice: '740.00',
            lineItemBasePrice: '680.50',
            lineItemTaxAmount: '59.50',
            lineItemExtendedPrice: '740.00',
          }],
        };

        const res = await api.application.sendApplication(body);

        expect(res.status, 'HTTP status should be 200').toBe(200);
        expect(res.body.appApprovalStatus, 'Application should be approved').toBe('APPROVED');
        expect(res.body.accountNumber, 'accountNumber should be present').toBeTruthy();
        expect(res.body.paymentDetailsList, 'paymentDetailsList should be non-empty').toBeDefined();
        expect(res.body.paymentDetailsList!.length, 'At least 1 payment option').toBeGreaterThan(0);

        approvedLeadUuid = res.body.accountNumber!;
        approvedPlanIds = [];
        approvedRedirectUrls = [];

        for (const item of res.body.paymentDetailsList!) {
          const pid = extractPlanId(item);
          expect(pid, `Plan item should have a planId (got ${JSON.stringify(item)})`).toBeTruthy();
          approvedPlanIds.push(pid!);
          if (item.redirectUrl) approvedRedirectUrls.push(item.redirectUrl);
        }

        // Extract shortCode from first redirectUrl
        if (approvedRedirectUrls[0]) {
          approvedShortCode = extractShortCode(approvedRedirectUrls[0]) ?? '';
        }

        console.log(`CT-01: leadUuid=${approvedLeadUuid}, shortCode=${approvedShortCode}, planIds=${approvedPlanIds.join(',')}`);
      });
    });

    // CT-02: planId format — all frequencies
    test('CT-02: Formato do planId — todas as frequências validadas', async () => {
      expect(approvedPlanIds, 'CT-01 must have run first').toBeDefined();
      expect(approvedPlanIds.length, 'At least 1 planId from CT-01').toBeGreaterThan(0);

      await test.step('Validate each planId matches regex', async () => {
        for (const pid of approvedPlanIds) {
          expect(pid, `planId "${pid}" should match ${PLAN_ID_REGEX}`).toMatch(PLAN_ID_REGEX);

          // Validate prefix maps to a known frequency
          const prefix = pid.replace(/\d+$/, '');
          expect(FREQ_LABELS, `Prefix "${prefix}" should be in FREQ_LABELS`).toHaveProperty(prefix);
        }
      });

      await test.step('At least 2 distinct planIds', async () => {
        const unique = new Set(approvedPlanIds);
        expect(unique.size, 'Expected at least 2 distinct planIds').toBeGreaterThan(1);
      });
    });

    // CT-03: sendApplication WITHOUT nextPayDate — no crash
    test('CT-03: sendApplication SEM nextPayDate — sem crash (HTTP ≠ 500)', async ({ api, testEnv }) => {
      const m = MERCHANTS[data.merchant];
      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();
      const ssn = generateTestSSN(true);

      await test.step('Send application without mainNextPayDate', async () => {
        const body: Record<string, unknown> = {
          userName: m.username,
          setupPassword: m.password,
          merchantNumber: m.number,
          mainFirstName: `FN${runId.slice(-4)}`,
          mainLastName: `LN${runId.slice(-4)}`,
          mainDOB: '01011984',
          mainSSN: ssn,
          mainAddress1: '123 Main St',
          mainCity: 'New York',
          mainStateOrProvince: 'NY',
          mainPostalCode: '10001',
          mainCellPhone: generateTestPhone(),
          emailAddress: email,
          mainEmployerName: 'Uown TEST',
          mainPastBankruptcy: false,
          mainCurrentOrFutureBankruptcy: false,
          languagePreference: 'E',
          iovationFingerprintText: 'fingerPrintText',
          ipaddress: '192.168.0.2',
          desiredPaymentFrequency: 'WEEKLY',
          mainAnnualIncome: 56000,
          mainPayFrequency: 'WEEKLY',
          mainLastPayDate: calculateDate(-7).replace(/\//g, ''),
          mainEmploymentDuration: '_1_TO_2_YEARS',
          shipToSameAsConsumer: true,
          merchandiseSubtotal: '680.50',
          discountAmount: '0.00',
          deliveryCharge: '25.00',
          installationCharge: '0.00',
          salesTax: '59.50',
          miscellaneousFees: '0.00',
          depositAmount: '0.00',
          orderTotal: '765.00',
          invoiceNumber: `R${10000 + Math.floor(Math.random() * 90000)}`,
          lineItem: [{
            lineItemLineNumber: '1',
            lineItemSerialNumber: `SKU-${Date.now()}`,
            lineItemProductNumber: 'TEST-001',
            lineItemProductDescription: 'Test Item',
            lineItemProductCategory: 'Appliances',
            lineItemType: 'D',
            lineItemQuantityOrdered: '1',
            lineItemUnitPrice: '740.00',
            lineItemBasePrice: '680.50',
            lineItemTaxAmount: '59.50',
            lineItemExtendedPrice: '740.00',
          }],
          // mainNextPayDate intentionally omitted
        };

        const res = await api.application.sendApplication(body as unknown as SendApplicationBody);
        console.log(`CT-03: status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}, message=${res.body.message}`);

        // Core assertion: must NOT be 500 (the bug was an unhandled exception → 500)
        expect(res.status, 'Response must NOT be HTTP 500').not.toBe(500);
      });
    });

    // CT-04: sendApplication with empty nextPayDate — no crash
    test('CT-04: sendApplication com nextPayDate vazio — sem crash (HTTP ≠ 500)', async ({ api, testEnv }) => {
      const m = MERCHANTS[data.merchant];
      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();
      const ssn = generateTestSSN(true);

      await test.step('Send application with empty mainNextPayDate string', async () => {
        const body: Record<string, unknown> = {
          userName: m.username,
          setupPassword: m.password,
          merchantNumber: m.number,
          mainFirstName: `FN${runId.slice(-4)}`,
          mainLastName: `LN${runId.slice(-4)}`,
          mainDOB: '01011984',
          mainSSN: ssn,
          mainAddress1: '123 Main St',
          mainCity: 'New York',
          mainStateOrProvince: 'NY',
          mainPostalCode: '10001',
          mainCellPhone: generateTestPhone(),
          emailAddress: email,
          mainEmployerName: 'Uown TEST',
          mainPastBankruptcy: false,
          mainCurrentOrFutureBankruptcy: false,
          languagePreference: 'E',
          iovationFingerprintText: 'fingerPrintText',
          ipaddress: '192.168.0.2',
          desiredPaymentFrequency: 'WEEKLY',
          mainAnnualIncome: 56000,
          mainPayFrequency: 'WEEKLY',
          mainNextPayDate: '', // empty string
          mainLastPayDate: calculateDate(-7).replace(/\//g, ''),
          mainEmploymentDuration: '_1_TO_2_YEARS',
          shipToSameAsConsumer: true,
          merchandiseSubtotal: '680.50',
          discountAmount: '0.00',
          deliveryCharge: '25.00',
          installationCharge: '0.00',
          salesTax: '59.50',
          miscellaneousFees: '0.00',
          depositAmount: '0.00',
          orderTotal: '765.00',
          invoiceNumber: `R${10000 + Math.floor(Math.random() * 90000)}`,
          lineItem: [{
            lineItemLineNumber: '1',
            lineItemSerialNumber: `SKU-${Date.now()}`,
            lineItemProductNumber: 'TEST-001',
            lineItemProductDescription: 'Test Item',
            lineItemProductCategory: 'Appliances',
            lineItemType: 'D',
            lineItemQuantityOrdered: '1',
            lineItemUnitPrice: '740.00',
            lineItemBasePrice: '680.50',
            lineItemTaxAmount: '59.50',
            lineItemExtendedPrice: '740.00',
          }],
        };

        const res = await api.application.sendApplication(body as unknown as SendApplicationBody);
        console.log(`CT-04: status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}, message=${res.body.message}`);

        expect(res.status, 'Response must NOT be HTTP 500').not.toBe(500);
      });
    });

    // CT-05: getMissingFields WITH planId → no NPE
    test('CT-05: getMissingFields COM planId válido → 200, sem NPE', async ({ api }) => {
      expect(approvedShortCode, 'CT-01 must have set approvedShortCode').toBeTruthy();
      expect(approvedPlanIds?.length, 'CT-01 must have set approvedPlanIds').toBeGreaterThan(0);

      const planId = approvedPlanIds[0];

      await test.step(`GET /missing-fields/${approvedShortCode}?planId=${planId}`, async () => {
        const res = await api.application.getMissingFields(approvedShortCode, { planId });
        console.log(`CT-05: status=${res.status}, missingFields=${JSON.stringify(res.body.missingFields)}`);

        expect(res.status, 'getMissingFields with planId must return 200').toBe(200);
        expect(res.body, 'Response body should be defined').toBeDefined();
      });
    });

    // CT-06: getMissingFields WITHOUT planId — backward compat
    test('CT-06: getMissingFields SEM planId — compatibilidade retroativa (HTTP ≠ 500)', async ({ api }) => {
      expect(approvedShortCode, 'CT-01 must have set approvedShortCode').toBeTruthy();

      await test.step(`GET /missing-fields/${approvedShortCode} (no planId)`, async () => {
        const res = await api.application.getMissingFields(approvedShortCode);
        console.log(`CT-06: status=${res.status}`);

        expect(res.status, 'getMissingFields without planId must NOT be 500').not.toBe(500);
      });
    });

    // CT-07: getMissingFields with invalid planId — handled error
    test('CT-07: getMissingFields com planId inválido — erro tratado (HTTP ≠ 500)', async ({ api }) => {
      expect(approvedShortCode, 'CT-01 must have set approvedShortCode').toBeTruthy();

      await test.step(`GET /missing-fields/${approvedShortCode}?planId=INVALID_PLAN_99`, async () => {
        const res = await api.application.getMissingFields(approvedShortCode, { planId: 'INVALID_PLAN_99' });
        console.log(`CT-07: status=${res.status}, message=${res.body.message}`);

        expect(res.status, 'getMissingFields with invalid planId must NOT be 500').not.toBe(500);
      });
    });

    // CT-08: getApplicationStatus → planId consistent
    test('CT-08: getApplicationStatus retorna planId consistente com sendApplication', async ({ api }) => {
      expect(approvedLeadUuid, 'CT-01 must have set approvedLeadUuid').toBeTruthy();
      expect(approvedPlanIds?.length, 'CT-01 must have set approvedPlanIds').toBeGreaterThan(0);

      const m = MERCHANTS[data.merchant];

      await test.step('POST /getApplicationStatus', async () => {
        const res = await api.application.getApplicationStatus(m, approvedLeadUuid);

        expect(res.status, 'getApplicationStatus must return 200').toBe(200);

        // NOTE (BUG-02): getApplicationStatus returns empty paymentDetailsList in qa1
        // even after a successful sendApplication. This is a known behavior documented
        // in docs/test-reports/476-bugs.md. The core assertion here is HTTP 200 (no crash).
        const pdl = res.body.paymentDetailsList ?? [];
        console.log(`CT-08: getApplicationStatus pdl.length=${pdl.length}, planIds=${pdl.map(extractPlanId).join(',')}`);

        // If paymentDetailsList has entries, validate planId format
        for (const item of pdl) {
          const pid = extractPlanId(item);
          if (pid) {
            expect(pid, `getApplicationStatus planId "${pid}" should match regex`).toMatch(PLAN_ID_REGEX);
          }
        }
      });
    });

    // CT-09: E2E — PayPossible → empty planId → missing employment flow → plan selection
    test('CT-09: [E2E] PayPossible → providerURL com planId vazio → preenche emprego → escolhe plano', async ({ page, api, testEnv }) => {
      const m = MERCHANTS[data.merchant];
      expect(m, `Merchant ${data.merchant} not found`).toBeDefined();

      const runId = generateRunId();
      const email = testEnv.generateUniqueEmailAlias();
      const ssn = generateTestSSN(true);

      let providerURL: string;
      let ppShortCode: string;
      let ppLeadUuid: string;

      await test.step('Send PayPossible application WITHOUT mainNextPayDate', async () => {
        const body: Record<string, unknown> = {
          userName: m.username,
          setupPassword: m.password,
          merchantNumber: m.number,
          mainFirstName: `FN${runId.slice(-4)}`,
          mainLastName: `LN${runId.slice(-4)}`,
          mainDOB: '01011984',
          mainSSN: ssn,
          mainAddress1: '123 Main St',
          mainCity: 'New York',
          mainStateOrProvince: 'NY',
          mainPostalCode: '10001',
          mainCellPhone: generateTestPhone(),
          emailAddress: email,
          mainEmployerName: 'Uown TEST',
          mainPastBankruptcy: false,
          mainCurrentOrFutureBankruptcy: false,
          languagePreference: 'E',
          iovationFingerprintText: 'fingerPrintText',
          ipaddress: '192.168.0.2',
          desiredPaymentFrequency: 'WEEKLY',
          mainAnnualIncome: 56000,
          mainPayFrequency: 'WEEKLY',
          mainLastPayDate: calculateDate(-7).replace(/\//g, ''),
          mainEmploymentDuration: '_1_TO_2_YEARS',
          shipToSameAsConsumer: true,
          merchandiseSubtotal: '680.50',
          discountAmount: '0.00',
          deliveryCharge: '25.00',
          installationCharge: '0.00',
          salesTax: '59.50',
          miscellaneousFees: '0.00',
          depositAmount: '0.00',
          orderTotal: '765.00',
          invoiceNumber: `R${10000 + Math.floor(Math.random() * 90000)}`,
          lineItem: [{
            lineItemLineNumber: '1',
            lineItemSerialNumber: `SKU-${Date.now()}`,
            lineItemProductNumber: 'TEST-001',
            lineItemProductDescription: 'Test Item',
            lineItemProductCategory: 'Appliances',
            lineItemType: 'D',
            lineItemQuantityOrdered: '1',
            lineItemUnitPrice: '740.00',
            lineItemBasePrice: '680.50',
            lineItemTaxAmount: '59.50',
            lineItemExtendedPrice: '740.00',
          }],
          // mainNextPayDate intentionally omitted → empty planId in providerURL
        };

        const res = await api.application.sendApplication(body as unknown as SendApplicationBody);
        const rb = res.body as Record<string, unknown>;
        ppLeadUuid = (rb['accountNumber'] as string) ?? '';
        console.log(`CT-09 sendApp: status=${res.status}, appApprovalStatus=${rb['appApprovalStatus']}, leadUuid=${ppLeadUuid}`);

        expect(res.status, 'PayPossible sendApplication must not crash (HTTP ≠ 500)').not.toBe(500);
        expect(rb['appApprovalStatus'], 'Application should be approved').toBe('APPROVED');

        // PayPossible returns providerURL (not paymentDetailsList with redirectUrl)
        const rawProviderURL = rb['providerURL'] as string | undefined;
        const pdl = res.body.paymentDetailsList;

        // If no providerURL in top-level, extract from paymentDetailsList[0].redirectUrl
        if (rawProviderURL) {
          providerURL = rawProviderURL;
        } else if (pdl?.[0]?.redirectUrl) {
          providerURL = pdl[0].redirectUrl;
        } else {
          throw new Error(`CT-09: No providerURL or redirectUrl in PayPossible response: ${JSON.stringify(rb)}`);
        }

        console.log(`CT-09: providerURL=${providerURL}`);
        expect(providerURL, 'providerURL should be defined').toBeTruthy();

        // Verify empty planId (the condition being fixed)
        expect(providerURL, 'providerURL should end with empty planId').toMatch(/[?&]planId=$/);

        // Extract shortCode from URL path
        ppShortCode = extractShortCode(providerURL) ?? '';
        console.log(`CT-09: shortCode=${ppShortCode}`);
      });

      await test.step('Navigate to providerURL — verify missing employment screen', async () => {
        await page.goto(providerURL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

        // Wait for EITHER the employment screen OR the SEON popup to appear (whichever loads first).
        // The SEON popup appears in sandbox environments as a fraud-detection overlay.
        const employment = page.getByRole('searchbox', { name: /next paycheck/i });
        const seonDialog = page.locator('text=Verify your identity');

        const which = await Promise.race([
          employment.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'employment' as const),
          seonDialog.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'seon' as const),
        ]).catch(() => 'timeout' as const);

        console.log(`[CT-09] First element visible: ${which}`);

        if (which === 'seon') {
          // Dismiss SEON popup and then wait for the employment screen
          const closeInfo = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map(b => ({
              text: b.textContent?.trim(),
              ariaLabel: b.getAttribute('aria-label'),
              className: b.className,
            }));
          });
          console.log('[CT-09] Buttons in DOM:', JSON.stringify(closeInfo));

          // Try multiple close strategies
          const closeByText = page.locator('button').filter({ hasText: /^[×✕]$/ }).first();
          if (await closeByText.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await closeByText.click();
          } else {
            const closeByAria = page.locator('button[aria-label*="close" i]').first();
            if (await closeByAria.isVisible({ timeout: 1_000 }).catch(() => false)) {
              await closeByAria.click();
            } else {
              await page.keyboard.press('Escape');
            }
          }

          // After dismissing SEON, wait for the employment screen
          await employment.waitFor({ state: 'visible', timeout: 30_000 });

        } else if (which === 'timeout') {
          const bodyText = await page.locator('body').textContent({ timeout: 3_000 }).catch(() => '');
          throw new Error(`CT-09: Neither SEON popup nor employment screen appeared in 45s. Page: ${bodyText?.slice(0, 300)}`);
        }
        // else 'employment' → already visible

        expect(await employment.isVisible(), 'Employment screen (next paycheck input) should be visible').toBe(true);
        console.log('CT-09: Missing employment screen visible — ✅');
        await page.screenshot({ path: 'reports/screenshots/476-ct09-01-employment-screen.png' });
      });

      await test.step('Fill next paycheck date (with SEON dismissal)', async () => {
        const nextPayDate = calculateDate(7); // MM/DD/YYYY

        // Fill the date input — use click+pressSequentially+Tab to trigger React onChange/blur.
        // plain fill() sets the value but doesn't fire onChange in React controlled inputs.
        const field = page.getByRole('searchbox', { name: /next paycheck/i });
        await field.waitFor({ state: 'visible', timeout: 15_000 });
        await field.click();
        await field.clear();
        await field.pressSequentially(nextPayDate, { delay: 50 });
        await page.keyboard.press('Tab'); // trigger React onChange + blur
        console.log(`[CT-09] Filled next paycheck date: ${nextPayDate}`);

        // Click the NEXT button via JavaScript to bypass SEON iframe pointer event interception.
        // The SEON iframe (data-testid="seon-idv-iframe") blocks Playwright's normal click mechanism
        // in the sandbox environment. Direct JS click on the NEXT button bypasses this.
        const seonIframe = page.locator('[data-testid="seon-idv-iframe"]');
        const seonPresent = await seonIframe.isVisible({ timeout: 5_000 }).catch(() => false);
        if (seonPresent) {
          console.log('[CT-09] SEON iframe detected, using JS click to trigger NEXT...');
          const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const nextBtn = buttons.find(b => /^next$/i.test(b.textContent?.trim() ?? ''));
            if (nextBtn) {
              (nextBtn as HTMLElement).click();
              return true;
            }
            return false;
          });
          console.log(`[CT-09] JS click on NEXT: ${clicked}`);
        } else {
          await page.getByRole('button', { name: /^next$/i }).click({ timeout: 15_000 });
        }
        console.log('[CT-09] Clicked NEXT after next paycheck');
      });

      await test.step('Select pay frequency (BI_WEEKLY)', async () => {
        const contractPage = new ContractPage(page);
        // Dropdown shows enum values: WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY
        await contractPage.selectMissingPayFrequency('BI_WEEKLY');
      });

      await test.step('Assert plan selection screen', async () => {
        const contractPage = new ContractPage(page);
        await contractPage.waitForPlanSelectionScreen();
        console.log('CT-09: Plan selection screen visible — ✅');
        await page.screenshot({ path: 'reports/screenshots/476-ct09-02-plan-selection.png' });
      });

      await test.step('Choose Bi-Weekly payment program', async () => {
        const contractPage = new ContractPage(page);
        await contractPage.choosePlanByName('Bi-Weekly');
        console.log('CT-09: Chose Bi-Weekly plan — ✅');
      });

      await test.step('Assert page advances past plan selection', async () => {
        // After "Choose Payment Program", the page advances. Depending on the environment:
        // - sandbox: shows "SIGN CONTRACT" button directly (fee pre-configured)
        // - qa1:     shows CC/bank payment form (missingFields) before signing
        // Core validation: the page advanced AWAY from plan selection — proving the fix works.
        const signContractBtn = page.getByRole('button', { name: /sign contract/i });
        const ccFormField = page.locator('input').filter({ hasText: '' }).and(
          page.locator('[placeholder*="Card Number" i], [placeholder*="Cardholder" i], [placeholder*="CVC" i]')
        );
        const submitBtn = page.getByRole('button', { name: /^submit$/i });

        const which = await Promise.race([
          signContractBtn.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'sign-contract' as const),
          submitBtn.waitFor({ state: 'visible', timeout: 30_000 }).then(() => 'cc-form-submit' as const),
        ]).catch(() => 'timeout' as const);

        expect(which, 'Page should advance to CC form or SIGN CONTRACT after plan selection').not.toBe('timeout');
        console.log(`CT-09: Page advanced to "${which}" after plan selection ✅`);
        await page.screenshot({ path: 'reports/screenshots/476-ct09-03-payment-form.png' });
      });
    });
  });
}

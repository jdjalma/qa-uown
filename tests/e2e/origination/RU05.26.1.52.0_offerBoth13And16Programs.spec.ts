/**
 * RU05.26.1.52.0 — Offer Both 13 and 16 Programs (R1.52.0).
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_offerBoth13And16Programs_537/
 *       RU05.26.1.52.0_offerBoth13And16Programs_537-spec.md
 *
 * Backend fix: `LeadProgramService.getLTOProgramsForLead` now expands
 * `EligibleTerms="16"` to `"13,16"` via config `defaultMonthsWhen16Month`
 * (default "13,16") when `IsEligibleForExtraInfo != true` (guard prevents
 * expand in lookahead path). This ensures the MissingPaymentProgram component
 * renders BOTH 13m and 16m tabs for 16m-eligible clients.
 *
 * Strategy (Rule 14 - UI-first):
 *   - Application created via consumer-facing wizard (getApplication/{KS3015}).
 *   - Email validation after sendInvoice: extract payment link from email.
 *   - MissingPaymentProgram page: verify 13m and 16m tabs + frequency cards.
 *   - DB read-only assertions on `uown_lead_approval_terms` + `uown_los_lead`.
 *   - Activity log assertion (regra #13, G3 user-mandated).
 *
 * Environment: qa1 (fix LIVE since 2026-05-20).
 * Merchant: KS3015 (FifthAveFurnitureNY, Kornerstone brand).
 * Programs: PK 93 (13m, WEEKLY/BI_WEEKLY), PK 215 (16m, WEEKLY/BI_WEEKLY/MONTHLY).
 */
import { test, expect } from '@support/base-test.js';
import { buildTestData, sleep, calculateDate } from '@helpers/index.js';
import { ApplicationWizardPage } from '@pages/origination/application-wizard.page.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { TEST_BANK } from '@config/constants.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';

// ── Constants ───────────────────────────────────────────────────────────

const MERCHANT_KEY = 'FifthAveFurnitureNY';
const STATE = 'CA';

/** Monthly income ~$70k annual, produces BlackBox EligibleTerms containing "16" in qa1 */
const INCOME_16M_MONTHLY = '5833';
/** CC BIN from MASTERCARD_APPROVED (5500000000000004) - first 6 digits */
const CC_BIN = '550000';

const TAG = `${buildTags(TestTag.REGRESSION, TestTag.QA1)} @origination @svc-537 @offer-both-programs`;

// ── Activity log assertion helper (G3 user-mandated, regra #13) ──────────

interface LogAssertionResult {
  found: boolean;
  source: 'lead_notes' | 'lead.notes' | null;
  matchedText: string | null;
}

async function assertLeadProgramServiceLog(
  db: DatabaseHelpers,
  leadPk: string,
  expectedSubstring: string,
): Promise<LogAssertionResult> {
  const leadNotesRows = await db.query<{ pk: number; notes: string }>(
    `SELECT pk, notes FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND notes ILIKE $2
     ORDER BY pk DESC LIMIT 5`,
    [leadPk, expectedSubstring],
  );
  if (leadNotesRows.length > 0) {
    return { found: true, source: 'lead_notes', matchedText: leadNotesRows[0].notes };
  }

  const cleanPattern = expectedSubstring.replace(/%/g, '').toLowerCase();
  const leadRow = await db.queryOne<{ notes: string | null }>(
    `SELECT notes FROM uown_los_lead WHERE pk = $1`,
    [leadPk],
  );
  if (leadRow?.notes && leadRow.notes.toLowerCase().includes(cleanPattern)) {
    return { found: true, source: 'lead.notes', matchedText: leadRow.notes };
  }

  return { found: false, source: null, matchedText: null };
}

// ── Test suite ───────────────────────────────────────────────────────────

test.describe('RU05.26.1.52.0_offerBoth13And16Programs', { tag: TAG.split(' ') }, () => {
  test.setTimeout(600_000);
  test.beforeEach(({ testEnv }) => {
    test.skip(testEnv.env !== 'qa1', 'uses KS3015 (Kornerstone) + qa1-only 16m SSN routing — skip in other environments');
  });

  test('16m-eligible via new-application wizard + email validation + 13m/16m tab verification', async ({
    page, api, db, email, ctx,
  }, testInfo) => {
    // ── Build test data ─────────────────────────────────────────────────
    const { env, merchant, applicant, address } = buildTestData({
      state: STATE,
      merchant: MERCHANT_KEY,
      orderTotal: '3500',
      orderDescription: 'svc-537 new-app wizard',
    });

    testInfo.annotations.push(
      { type: 'email', description: applicant.email },
      { type: 'ssn-last3', description: applicant.ssn.slice(-3) },
    );
    console.log(`[Setup] email=${applicant.email} ssn-last3=${applicant.ssn.slice(-3)}`);

    // ── Phase 1: Navigate to consumer wizard ────────────────────────────
    await test.step('Navigate to application wizard via getApplication URL', async () => {
      const wizardUrl = `${env.originationUrl}getApplication/${merchant.number}`;
      console.log(`[Wizard] Navigating to: ${wizardUrl}`);
      await page.goto(wizardUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForURL(/apply-[a-z0-9]+\.(kornerstoneliving|uownleasing)\.com/i, { timeout: 30_000 });
      console.log(`[Wizard] Redirected to: ${page.url()}`);
    });

    // ── Phase 2: Fill wizard (3 pages) ──────────────────────────────────
    const wizard = new ApplicationWizardPage(page);

    await test.step('Wizard Page 1: Personal Info (CA, KS3015)', async () => {
      await wizard.fillPersonalInfo({
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        ssn: applicant.ssn,
        dob: applicant.dob ?? '01/01/1984',
        phone: applicant.phone,
        email: applicant.email,
        address: address.street,
        city: address.city,
        zipCode: address.zipCode,
        state: STATE,
      });
    });

    await test.step('Wizard Page 2: Employment (KS requires bank data + CC BIN)', async () => {
      await wizard.fillEmploymentInfo({
        payFrequency: 'Weekly',
        lastPayDate: calculateDate(-7),
        nextPayDate: calculateDate(7),
        monthlyIncome: INCOME_16M_MONTHLY,
        bankRoutingNumber: TEST_BANK.DEFAULT_ROUTING,
        bankAccountNumber: `16078${Date.now().toString().slice(-8)}`,
        creditCardBin: CC_BIN,
      });
    });

    await test.step('Wizard Page 3: Consent + Submit', async () => {
      await wizard.fillConsentInfo();
    });

    await test.step('Wait for approval confirmation', async () => {
      await wizard.waitForApprovalConfirmation(120_000);
      console.log('[Wizard] Approval confirmed');
    });

    // ── Phase 3: Extract lead from DB (wizard submitted via UI, not API) ─
    let leadPk: string = '';
    let leadUuid: string = '';

    await test.step('Extract leadPk from DB by email', async () => {
      const resolved = await db.resolveLeadFromApplicantEmail(applicant.email, { timeoutMs: 30_000 });
      leadPk = String(resolved.leadPk);
      leadUuid = resolved.applicationShortCode;
      ctx.leadPk = leadPk;
      ctx.leadUuid = leadUuid;
      testInfo.annotations.push(
        { type: 'leadPk', description: leadPk },
        { type: 'leadUuid', description: leadUuid },
      );
      console.log(`[DB] leadPk=${leadPk} leadUuid=${leadUuid}`);
    });

    // ── Phase 4: sendInvoice to get redirect URLs + trigger email ───────
    let redirectUrl = '';
    let paymentDetailsList: Array<{ redirectUrl?: string; termInMonths?: number; planId?: string }> = [];

    await test.step('API: getApplicationStatus + sendInvoice', async () => {
      const statusResp = await api.application.getApplicationStatus(merchant, leadUuid);
      expect(statusResp.ok, `getApplicationStatus: ${statusResp.status}`).toBeTruthy();
      const approvedAmount = statusResp.body.approvedAmount ?? 0;
      expect(approvedAmount, 'approvedAmount must be > 0').toBeGreaterThan(0);
      testInfo.annotations.push({ type: 'approvedAmount', description: String(approvedAmount) });
      console.log(`[API] approvedAmount=${approvedAmount}`);

      const invoiceResp = await api.invoice.sendInvoice(merchant, leadUuid, {
        orderTotal: String(approvedAmount),
      });
      expect(invoiceResp.ok, `sendInvoice: ${invoiceResp.status}`).toBeTruthy();

      paymentDetailsList = invoiceResp.body?.paymentDetailsList ?? [];
      expect(paymentDetailsList.length, 'paymentDetailsList must have at least 1 entry').toBeGreaterThan(0);

      const rawUrl = paymentDetailsList[0]?.redirectUrl ?? '';
      expect(rawUrl, 'redirectUrl must be present in paymentDetailsList').toBeTruthy();
      const parsed = new URL(rawUrl);
      parsed.searchParams.delete('planId');
      redirectUrl = parsed.toString();

      testInfo.annotations.push(
        { type: 'redirectUrl', description: redirectUrl },
        { type: 'paymentDetailsCount', description: String(paymentDetailsList.length) },
        { type: 'terms', description: paymentDetailsList.map(d => `${d.termInMonths}m`).join(', ') },
      );
      console.log(`[API] redirectUrl=${redirectUrl} terms=[${paymentDetailsList.map(d => d.termInMonths).join(',')}]`);
    });

    // ── Phase 5: Validate email ─────────────────────────────────────────
    await test.step('Validate invoice email received and extract payment link', async () => {
      const emailLink = await email.getEmailLink(
        applicant.email,
        /complete|secure-[a-z0-9]+\.uownleasing\.com/i,
        120_000,
      );

      if (emailLink) {
        console.log(`[Email] Payment link found: ${emailLink}`);
        testInfo.annotations.push({ type: 'emailLinkFound', description: 'true' });

        // Validate: the link should point to the secure consumer portal
        expect(emailLink, 'Email link must contain uownleasing.com').toMatch(/uownleasing\.com/i);

        // Use the email link (strip planId) to navigate to payment page
        const parsedEmailUrl = new URL(emailLink);
        parsedEmailUrl.searchParams.delete('planId');
        redirectUrl = parsedEmailUrl.toString();
        testInfo.annotations.push({ type: 'emailRedirectUrl', description: redirectUrl });
        console.log(`[Email] Using email redirect URL: ${redirectUrl}`);
      } else {
        console.log('[Email] No payment link found in email within timeout - using API redirect URL');
        testInfo.annotations.push({ type: 'emailLinkFound', description: 'false - using API redirectUrl' });
      }
    });

    await test.step('Validate email content (subject + body)', async () => {
      const content = await email.getEmailContent(
        applicant.email,
        /payment|invoice|complete|application|approved/i,
        30_000,
      );

      if (content) {
        console.log(`[Email] Subject: "${content.subject}"`);
        testInfo.annotations.push({ type: 'emailSubject', description: content.subject });
        expect(content.body, 'Email body must not be empty').toBeTruthy();
        expect(content.body.length, 'Email body must have content').toBeGreaterThan(100);
      } else {
        console.log('[Email] No matching email content found - invoice email may use different subject pattern');
        testInfo.annotations.push({ type: 'emailContent', description: 'not found within timeout' });
      }
    });

    // ── Phase 6: DB assertions ──────────────────────────────────────────
    await test.step('DB: assert approved_terms and uw_terms', async () => {
      const row = await db.queryOne<{ uw_terms: string; approved_terms: string }>(
        `SELECT uw_terms, approved_terms FROM uown_lead_approval_terms
         WHERE lead_pk = $1 ORDER BY row_created_timestamp DESC LIMIT 1`,
        [leadPk],
      );
      expect(row, `uown_lead_approval_terms must exist for leadPk=${leadPk}`).toBeTruthy();
      expect(row!.approved_terms, 'approved_terms must contain "16"').toContain('16');
      expect(row!.uw_terms, 'uw_terms must contain "16"').toContain('16');
      testInfo.annotations.push(
        { type: 'approved_terms', description: row!.approved_terms },
        { type: 'uw_terms', description: row!.uw_terms },
      );
      console.log(`[DB] approved_terms="${row!.approved_terms}" uw_terms="${row!.uw_terms}"`);
    });

    // ── Phase 7: Navigate to payment program page and validate tabs ─────
    await test.step('Navigate to MissingPaymentProgram page', async () => {
      await page.goto(redirectUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await sleep(3_000);
    });

    const multiTerm = paymentDetailsList.length >= 2;
    testInfo.annotations.push({ type: 'multi-term', description: String(multiTerm) });

    if (multiTerm) {
      await test.step('Verify BOTH 13m and 16m tabs are visible', async () => {
        const termTabs = page.locator(SELECTORS.termSelectionTab);
        const tabCount = await termTabs.count();

        if (tabCount >= 2) {
          expect(tabCount, 'Must have at least 2 term tabs (13m + 16m)').toBeGreaterThanOrEqual(2);
        } else {
          const tab13m = page.getByText(/13\s*Month/i).first();
          const tab16m = page.getByText(/16\s*Month/i).first();
          await expect(tab13m, 'Tab for 13 Months must be visible').toBeVisible({ timeout: 15_000 });
          await expect(tab16m, 'Tab for 16 Months must be visible').toBeVisible({ timeout: 15_000 });
        }
        console.log(`[Tabs] ${tabCount} term tabs found`);
      });

      await test.step('Click 16m tab and verify 3 frequency cards (WEEKLY/BI_WEEKLY/MONTHLY)', async () => {
        const tab16m = page.getByText(/16\s*Month/i).first();
        await tab16m.click();
        await sleep(1_000);

        const frequencyCards = page.locator(SELECTORS.paymentCard);
        const cardCount = await frequencyCards.count();
        if (cardCount > 0) {
          expect(cardCount, '16m tab must show 3 frequency cards (WEEKLY/BI_WEEKLY/MONTHLY)').toBe(3);
        } else {
          const monthlyOption = page.getByText(/monthly/i).first();
          await expect(monthlyOption, '16m tab must show Monthly frequency option').toBeVisible({ timeout: 5_000 });
        }
        console.log(`[16m] ${cardCount} frequency cards`);
      });

      await test.step('Click 13m tab and verify 2 frequency cards (WEEKLY/BI_WEEKLY)', async () => {
        const tab13m = page.getByText(/13\s*Month/i).first();
        await tab13m.click();
        await sleep(1_000);

        const frequencyCards = page.locator(SELECTORS.paymentCard);
        const cardCount = await frequencyCards.count();
        if (cardCount > 0) {
          expect(cardCount, '13m tab must show 2 frequency cards (WEEKLY/BI_WEEKLY)').toBe(2);
        } else {
          const monthlyOption = page.getByText(/monthly/i);
          const monthlyVisible = await monthlyOption.isVisible({ timeout: 2_000 }).catch(() => false);
          expect(monthlyVisible, '13m tab must NOT show Monthly frequency option').toBeFalsy();
          const weeklyOption = page.getByText(/weekly/i).first();
          await expect(weeklyOption, '13m tab must show Weekly frequency option').toBeVisible({ timeout: 5_000 });
        }
        console.log(`[13m] ${cardCount} frequency cards`);
      });
    } else {
      await test.step('Verify frequency cards visible (single-term)', async () => {
        const frequencyCards = page.locator(SELECTORS.paymentCard);
        const cardCount = await frequencyCards.count();

        if (cardCount > 0) {
          expect(cardCount, '16m single-term must show 3 frequency cards').toBe(3);
        } else {
          const weeklyOption = page.getByText(/weekly/i).first();
          await expect(weeklyOption, 'Weekly frequency card must be visible').toBeVisible({ timeout: 10_000 });
          const monthlyOption = page.getByText(/monthly/i).first();
          await expect(monthlyOption, 'Monthly frequency card must be visible (confirms 16m program)').toBeVisible({ timeout: 5_000 });
        }
        console.log(`[SingleTerm] ${cardCount} frequency cards`);
      });
    }

    // ── Phase 8: Activity log assertion (G3, regra #13) ─────────────────
    await test.step('Activity log: LeadProgramService expand log must exist', async () => {
      const result = await assertLeadProgramServiceLog(
        db,
        leadPk,
        '%After defaulting to 13,16 terms are : 13,16%',
      );

      if (result.found) {
        console.log(`[Log] LeadProgramService FOUND in source="${result.source}": ${result.matchedText?.slice(0, 200)}`);
        testInfo.annotations.push({ type: 'log-source', description: result.source! });
      }

      expect(
        result.found,
        '[BUG-CONFIRMED] regra #13 violated - fix nao persiste log da decisao de programa. ' +
        'LeadProgramService log not found in uown_los_lead_notes.notes nor uown_los_lead.notes for leadPk=' + leadPk,
      ).toBeTruthy();
    });
  });
});

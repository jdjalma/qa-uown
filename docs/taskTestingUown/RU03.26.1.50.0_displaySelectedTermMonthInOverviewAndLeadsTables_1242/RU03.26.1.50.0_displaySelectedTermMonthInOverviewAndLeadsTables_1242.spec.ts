/**
 * RU03.26.1.50.0_displaySelectedTermMonthInOverviewAndLeadsTables_1242
 *
 * Validates that the new "Term Month" column in the Origination portal
 * Overview and Leads tables displays the term selected by the applicant.
 *
 * Covers:
 *  CT-01 — Lead with 13-month eligibility (TerraceFinance), selects 13 → displays "13"
 *  CT-02 — Lead with 16-month eligibility (TerraceFinance), selects 16 → displays "16"
 *  CT-03 — Lead without completed application → displays blank
 *
 * GitLab: https://gitlab.com/uown/frontend/origination/-/work_items/1242
 * Pipeline: new-flow (hybrid — API setup + E2E UI verification)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OverviewPage } from '@pages/origination/overview.page.js';
import { OriginationBasePage } from '@pages/origination/origination-base.page.js';
import { MERCHANTS } from '@data/merchants.js';
import { TEST_CARDS } from '@data/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { loginToPortal } from '@helpers/auth.helpers.js';
import { generateTestPhone, generateTestSSN } from '@config/constants.js';
import {
  type MerchantInfo,
  type ApplicantInfo,
  type OrderInfo,
} from '@api/bodies/application.body.js';
import { getTableHeaders } from '@helpers/table.helpers.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { waitForSpinner } from '@helpers/common.helpers.js';

// ── Constants ────────────────────────────────────────────────────────

const TEST_NAME = 'RU03.26.1.50.0_displaySelectedTermMonthInOverviewAndLeadsTables_1242';
const TERM_MONTH_COLUMN = 'Term Month';
const STATE_COLUMN = 'State';

/**
 * Extracts planId from the redirectUrl query parameter.
 * Format: https://secure-{env}.uownleasing.com/{shortCode}/complete?planId=WK13
 */
function extractPlanId(redirectUrl: string): string | null {
  try {
    const url = new URL(redirectUrl);
    return url.searchParams.get('planId');
  } catch {
    return null;
  }
}

/**
 * Extracts shortCode from the redirectUrl path.
 * Format: https://secure-{env}.uownleasing.com/{shortCode}/complete?planId=WK13
 */
function extractShortCode(redirectUrl: string): string | null {
  try {
    const url = new URL(redirectUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

// ── Applicant builder ────────────────────────────────────────────────

function buildApplicant(email: string, ssn: string): ApplicantInfo {
  console.log(`[buildApplicant] email=${email}, ssn=${ssn}`);
  return {
    firstName: 'TermTest',
    lastName: `Auto${Date.now().toString().slice(-4)}`,
    email,
    ssn,
    phone: generateTestPhone(),
    address: '123 Test Ave',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    dob: '01/15/1990',
  };
}

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa1',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    tag: buildTags(TestTag.REGRESSION, TestTag.QA1),
  },
  {
    env: 'stg',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
    tag: buildTags(TestTag.REGRESSION, TestTag.STG),
  },
];

// ── Leads table helper ───────────────────────────────────────────────

/**
 * Searches for a row in the Leads table by Lead #.
 * Navigates to Leads page and uses paginated search.
 */
async function findLeadInLeadsTable(
  page: import('@playwright/test').Page,
  leadPk: string,
): Promise<Record<string, string> | null> {
  // Navigate to Leads via sidebar
  const origPage = new OriginationBasePage(page);
  await origPage.navigateToLeads();
  await waitForSpinner(page);

  // Wait for the table to render (don't silently swallow errors)
  await expect(page.locator(SELECTORS.tableRow).first())
    .toBeVisible({ timeout: 30_000 });
  await waitForSpinner(page);

  // Leads table headers include sort indicators (▲/▼) — search by cell content directly
  const headers = await getTableHeaders(page);
  // Strip sort indicators from headers for matching
  const cleanHeaders = headers.map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim());
  const leadColIndex = cleanHeaders.findIndex(h => h === 'Lead #');

  const rows = page.locator(SELECTORS.tableRow);
  const rowCount = await rows.count();

  for (let r = 0; r < rowCount; r++) {
    const cells = await rows.nth(r).locator(SELECTORS.tableCell).allTextContents();
    const cellValue = cells[leadColIndex]?.trim();
    if (cellValue === leadPk) {
      // Build row data with clean headers
      const data: Record<string, string> = {};
      cleanHeaders.forEach((header, i) => {
        data[header || `#empty-${i + 1}`] = cells[i]?.trim() || '';
      });
      return data;
    }
  }

  return null;
}

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchant];
  const order: OrderInfo = { orderTotal: data.orderTotal, description: 'Term Month QA Test' };

  test.describe(
    `${TEST_NAME} - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });
      test.describe.configure({ mode: 'serial' });

      // Shared state across serial tests
      const leads = {
        ct01: { pk: '', planId: '', shortCode: '', firstName: '', lastName: '' },
        ct02: { pk: '', planId: '', shortCode: '', firstName: '', lastName: '' },
        ct03: { pk: '' },
      };

      // ══════════════════════════════════════════════════════════════
      //  Setup: Create leads via API
      // ══════════════════════════════════════════════════════════════
      test('Setup: Create test leads via API (CT-01: 13-month, CT-02: 16-month, CT-03: sem submitApplication)', async ({ api, testEnv }) => {
        test.setTimeout(300_000);

        await test.step('CT-01: sendApplication WITH order → TerraceFinance retorna opção de 13 meses (WK13)', async () => {
          const applicant = buildApplicant(testEnv.generateUniqueEmailAlias(), generateTestSSN(true));
          // Save names for submitApplication (CC last name must match lead's last name)
          leads.ct01.firstName = applicant.firstName;
          leads.ct01.lastName = applicant.lastName;

          const res = await api.application.sendApplication(
            merchant as MerchantInfo,
            applicant,
            order,
          );
          console.log(`[CT-01] sendApplication status=${res.status}`);
          expect(res.ok, `sendApplication failed: ${res.status} — ${JSON.stringify(res.body)}`).toBe(true);

          const body = res.body!;
          const pdl = body.paymentDetailsList ?? [];
          console.log(`[CT-01] paymentDetailsList: ${pdl.map(p => `${p.termInMonths}mo(${extractPlanId(p.redirectUrl ?? '')})`).join(', ')}`);

          const option13 = pdl.find(p => p.termInMonths === 13);
          expect(option13, 'Expected a 13-month payment option').toBeDefined();
          const planId13 = extractPlanId(option13!.redirectUrl ?? '');
          expect(planId13, '13-month option must have a planId').toBeTruthy();
          const shortCode13 = extractShortCode(option13!.redirectUrl ?? '');
          expect(shortCode13, '13-month option must have a shortCode').toBeTruthy();

          const statusRes = await api.application.getApplicationStatus(
            merchant as MerchantInfo,
            body.accountNumber!,
          );
          expect(statusRes.ok).toBe(true);
          leads.ct01.pk = String(statusRes.body!.leadPk);
          leads.ct01.planId = planId13!;
          leads.ct01.shortCode = shortCode13!;
          console.log(`[CT-01] leadPk=${leads.ct01.pk}, planId=${leads.ct01.planId}, shortCode=${leads.ct01.shortCode}`);
        });

        await test.step('CT-01: getMissingFields (define merchantProgramPk) + submitApplication com Mastercard → CONTRACT_CREATED, term_in_months=13', async () => {
          // getMissingFields sets merchantProgramPk (required before submitApplication)
          const mfRes = await api.application.getMissingFields(
            leads.ct01.shortCode,
            { planId: leads.ct01.planId },
          );
          expect(mfRes.ok, `getMissingFields failed: ${mfRes.status}`).toBe(true);
          console.log(`[CT-01] getMissingFields response: ${JSON.stringify(mfRes.body)}`);

          const card = TEST_CARDS.MASTERCARD_APPROVED; // Mastercard 5500 — approved (5146/VISA_APPROVED causes rollback in qa1)
          // MUST reuse exact firstName/lastName from sendApplication (CC last name match check)
          const res = await api.application.submitApplication(
            leads.ct01.pk,
            leads.ct01.firstName,
            leads.ct01.lastName,
            {
              planId: leads.ct01.planId,
              ccNumber: card.number,
              cvc: card.cvv,
              ccType: 'MASTERCARD',
              ccExp: card.expirationDate,
            },
          );
          expect(res.ok, `submitApplication failed: ${res.status} — ${JSON.stringify(res.body)}`).toBe(true);
          const submitBody = res.body;
          console.log(`[CT-01] submitApplication response: ${JSON.stringify(submitBody)}`);
          // Verify no error in response body (HTTP 200 doesn't guarantee success)
          if (submitBody?.message) {
            console.log(`[CT-01] WARNING: submitApplication message = "${submitBody.message}"`);
          }
        });

        await test.step('CT-02: sendApplication WITH order + SSN terminando em 916 → sistema aprova elegibilidade de 16 meses naturalmente', async () => {
          // SSN ending in 916 triggers 16-month eligibility in the UW system (task precondition).
          // Random prefix (100000–899999) avoids duplicate SSN errors.
          const ssn16 = `${100000 + Math.floor(Math.random() * 800000)}916`;
          const applicant = buildApplicant(testEnv.generateUniqueEmailAlias(), ssn16);
          leads.ct02.firstName = applicant.firstName;
          leads.ct02.lastName = applicant.lastName;

          const res = await api.application.sendApplication(
            merchant as MerchantInfo,
            applicant,
            order,
          );
          console.log(`[CT-02] sendApplication status=${res.status}`);
          expect(res.ok, `sendApplication failed: ${res.status} — ${JSON.stringify(res.body)}`).toBe(true);

          const body = res.body!;
          const pdl = body.paymentDetailsList ?? [];
          console.log(`[CT-02] paymentDetailsList: ${pdl.map(p => `${p.termInMonths}mo(${extractPlanId(p.redirectUrl ?? '')})`).join(', ')}`);

          const option16 = pdl.find(p => p.termInMonths === 16);
          expect(option16, 'Expected a 16-month payment option — SSN ending in 916 must trigger 16-month eligibility').toBeDefined();
          const planId16 = extractPlanId(option16!.redirectUrl ?? '');
          expect(planId16, '16-month option must have a planId').toBeTruthy();
          const shortCode16 = extractShortCode(option16!.redirectUrl ?? '');
          expect(shortCode16, '16-month option must have a shortCode').toBeTruthy();

          const statusRes = await api.application.getApplicationStatus(
            merchant as MerchantInfo,
            body.accountNumber!,
          );
          expect(statusRes.ok).toBe(true);
          leads.ct02.pk = String(statusRes.body!.leadPk);
          leads.ct02.planId = planId16!;
          leads.ct02.shortCode = shortCode16!;
          console.log(`[CT-02] leadPk=${leads.ct02.pk}, planId=${leads.ct02.planId}, shortCode=${leads.ct02.shortCode}`);
        });

        await test.step('CT-02: getMissingFields (define merchantProgramPk) + submitApplication com Discover → CONTRACT_CREATED, term_in_months=16', async () => {
          const mfRes = await api.application.getMissingFields(
            leads.ct02.shortCode,
            { planId: leads.ct02.planId },
          );
          console.log(`[CT-02] getMissingFields status=${mfRes.status}`);
          expect(mfRes.ok, `getMissingFields failed: ${mfRes.status}`).toBe(true);

          const card = TEST_CARDS.DISCOVER_APPROVED; // 6011000993026909, cvv 996, exp 12/2028
          const res = await api.application.submitApplication(
            leads.ct02.pk,
            leads.ct02.firstName,
            leads.ct02.lastName,
            {
              planId: leads.ct02.planId,
              ccNumber: card.number,
              cvc: card.cvv,
              ccType: 'DISCOVER',
              ccExp: card.expirationDate,
            },
          );
          expect(res.ok, `submitApplication failed: ${res.status} — ${JSON.stringify(res.body)}`).toBe(true);
          const submitBody = res.body;
          console.log(`[CT-02] submitApplication termInMonths=${submitBody?.termInMonths} error=${submitBody?.error}`);
          expect(submitBody?.termInMonths, 'Expected termInMonths=16').toBe(16);
        });

        await test.step('CT-03: sendApplication WITH order apenas (sem submitApplication → sem sched_summary → term_in_months não gerado)', async () => {
          const applicant = buildApplicant(testEnv.generateUniqueEmailAlias(), generateTestSSN(true));
          const res = await api.application.sendApplication(
            merchant as MerchantInfo,
            applicant,
            order,
          );
          expect(res.ok, `sendApplication failed: ${res.status}`).toBe(true);

          const statusRes = await api.application.getApplicationStatus(
            merchant as MerchantInfo,
            res.body!.accountNumber!,
          );
          expect(statusRes.ok).toBe(true);
          leads.ct03.pk = String(statusRes.body!.leadPk);
          console.log(`[CT-03] leadPk=${leads.ct03.pk} (no submitApplication)`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-01: Term Month = "13" in Overview and Leads tables
      // ══════════════════════════════════════════════════════════════
      test('CT-01: Coluna "Term Month" exibe "13" nas tabelas Overview e Leads para lead com plano de 13 meses', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login no portal Origination como manager', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Tabela Overview — coluna "Term Month" posicionada após "State" e exibe "13"', async () => {
          const overviewPage = new OverviewPage(page);
          await overviewPage.navigateToOverview();
          // getRowDataByReferenceId waits for the table to load
          const row = await overviewPage.getRowDataByReferenceId(leads.ct01.pk);
          expect(row, `Lead ${leads.ct01.pk} not found in Overview table`).not.toBeNull();
          // Check column order — table already loaded at this point
          const headers = await getTableHeaders(page);
          const stateIdx = headers.findIndex(h => h === STATE_COLUMN);
          const termIdx = headers.findIndex(h => h === TERM_MONTH_COLUMN);
          expect(stateIdx, `"${STATE_COLUMN}" column not found in Overview headers: ${JSON.stringify(headers)}`).toBeGreaterThanOrEqual(0);
          expect(termIdx, `"${TERM_MONTH_COLUMN}" column not found in Overview headers: ${JSON.stringify(headers)}`).toBeGreaterThanOrEqual(0);
          expect(termIdx, `"${TERM_MONTH_COLUMN}" must be immediately after "${STATE_COLUMN}" — got State@${stateIdx}, TermMonth@${termIdx}`).toBe(stateIdx + 1);
          console.log(`[CT-01] Overview column order OK: State@${stateIdx}, Term Month@${termIdx}`);
          // Check value
          expect(row).toHaveProperty(TERM_MONTH_COLUMN);
          expect(row![TERM_MONTH_COLUMN], `Expected Term Month "13" for leadPk ${leads.ct01.pk}`).toBe('13');
          console.log(`[CT-01] Overview Term Month = "${row![TERM_MONTH_COLUMN]}"`);

          await testInfo.attach('CT-01-overview-term-month-13', {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });

        await test.step('Tabela Leads — coluna "Term Month" posicionada após "State" e exibe "13"', async () => {
          const row = await findLeadInLeadsTable(page, leads.ct01.pk);
          expect(row, `Lead ${leads.ct01.pk} not found in Leads table`).not.toBeNull();
          // Check column order — table already loaded after findLeadInLeadsTable
          const leadsHeaders = (await getTableHeaders(page)).map(h => h.replace(/[▲▼△▽↑↓]/g, '').trim());
          const stateIdx = leadsHeaders.findIndex(h => h === STATE_COLUMN);
          const termIdx = leadsHeaders.findIndex(h => h === TERM_MONTH_COLUMN);
          expect(stateIdx, `"${STATE_COLUMN}" column not found in Leads headers: ${JSON.stringify(leadsHeaders)}`).toBeGreaterThanOrEqual(0);
          expect(termIdx, `"${TERM_MONTH_COLUMN}" column not found in Leads headers: ${JSON.stringify(leadsHeaders)}`).toBeGreaterThanOrEqual(0);
          expect(termIdx, `"${TERM_MONTH_COLUMN}" must be immediately after "${STATE_COLUMN}" — got State@${stateIdx}, TermMonth@${termIdx}`).toBe(stateIdx + 1);
          console.log(`[CT-01] Leads column order OK: State@${stateIdx}, Term Month@${termIdx}`);
          // Check value
          expect(row).toHaveProperty(TERM_MONTH_COLUMN);
          expect(row![TERM_MONTH_COLUMN], `Expected Term Month "13" for leadPk ${leads.ct01.pk}`).toBe('13');
          console.log(`[CT-01] Leads Term Month = "${row![TERM_MONTH_COLUMN]}"`);

          await testInfo.attach('CT-01-leads-term-month-13', {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-02: Term Month = "16" in Overview and Leads tables
      //  Setup: sendApplication WITH order + SSN ending in 916 (task precondition for 16-month
      //  eligibility) → system naturally approves 16-month → submitApplication with Discover.
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Coluna "Term Month" exibe "16" nas tabelas Overview e Leads para lead com plano de 16 meses', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login no portal Origination como manager', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Tabela Overview — coluna "Term Month" existe e exibe "16" para o lead', async () => {
          const overviewPage = new OverviewPage(page);
          await overviewPage.navigateToOverview();
          const row = await overviewPage.getRowDataByReferenceId(leads.ct02.pk);
          expect(row, `Lead ${leads.ct02.pk} not found in Overview table`).not.toBeNull();
          expect(row).toHaveProperty(TERM_MONTH_COLUMN);
          expect(row![TERM_MONTH_COLUMN], `Expected Term Month "16" for leadPk ${leads.ct02.pk}`).toBe('16');
          console.log(`[CT-02] Overview Term Month = "${row![TERM_MONTH_COLUMN]}"`);

          await testInfo.attach('CT-02-overview-term-month-16', {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });

        await test.step('Tabela Leads — coluna "Term Month" existe e exibe "16" para o lead', async () => {
          const row = await findLeadInLeadsTable(page, leads.ct02.pk);
          expect(row, `Lead ${leads.ct02.pk} not found in Leads table`).not.toBeNull();
          expect(row).toHaveProperty(TERM_MONTH_COLUMN);
          expect(row![TERM_MONTH_COLUMN], `Expected Term Month "16" for leadPk ${leads.ct02.pk}`).toBe('16');
          console.log(`[CT-02] Leads Term Month = "${row![TERM_MONTH_COLUMN]}"`);

          await testInfo.attach('CT-02-leads-term-month-16', {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03: Term Month blank for incomplete application
      // ══════════════════════════════════════════════════════════════
      test('CT-03: Coluna "Term Month" fica vazia nas tabelas Overview e Leads para lead sem aplicação completa (sem submitApplication)', async ({ page, testEnv }, testInfo) => {
        test.setTimeout(120_000);

        await test.step('Login no portal Origination como manager', async () => {
          await loginToPortal(page, testEnv.originationUrl, testEnv);
        });

        await test.step('Tabela Overview — coluna "Term Month" existe e está vazia para o lead', async () => {
          const overviewPage = new OverviewPage(page);
          await overviewPage.navigateToOverview();
          const row = await overviewPage.getRowDataByReferenceId(leads.ct03.pk);
          expect(row, `Lead ${leads.ct03.pk} not found in Overview table`).not.toBeNull();
          expect(row).toHaveProperty(TERM_MONTH_COLUMN);
          expect(row![TERM_MONTH_COLUMN], `Expected Term Month blank for leadPk ${leads.ct03.pk}`).toBe('');
          console.log(`[CT-03] Overview Term Month = "${row![TERM_MONTH_COLUMN]}" (expected blank)`);

          await testInfo.attach('CT-03-overview-term-month-blank', {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });

        await test.step('Tabela Leads — coluna "Term Month" existe e está vazia para o lead', async () => {
          const row = await findLeadInLeadsTable(page, leads.ct03.pk);
          expect(row, `Lead ${leads.ct03.pk} not found in Leads table`).not.toBeNull();
          expect(row).toHaveProperty(TERM_MONTH_COLUMN);
          expect(row![TERM_MONTH_COLUMN], `Expected Term Month blank for leadPk ${leads.ct03.pk}`).toBe('');
          console.log(`[CT-03] Leads Term Month = "${row![TERM_MONTH_COLUMN]}" (expected blank)`);

          await testInfo.attach('CT-03-leads-term-month-blank', {
            body: await page.screenshot(),
            contentType: 'image/png',
          });
        });
      });
    },
  );
}

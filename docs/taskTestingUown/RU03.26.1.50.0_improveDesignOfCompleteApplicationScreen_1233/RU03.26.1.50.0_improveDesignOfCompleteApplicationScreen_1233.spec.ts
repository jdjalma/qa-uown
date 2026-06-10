/**
 * RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233
 *
 * Validates the redesigned MissingPaymentProgram screen on the completeApplication flow.
 * MR !1408 (merged) replaced the plain white modal with a modern card-based layout:
 *   - Title/subtitle wrapper
 *   - Payment cards with emoji icons and frequency-specific labels
 *   - Term selection tabs (13/16 months) when multiple terms available
 *   - Footer with contact information
 *
 * Covers:
 *   CT-01 — New payment program screen displayed with redesigned UI elements
 *   CT-02 — Payment program selection advances to CC/bank form
 *   CT-03 — Term selection tabs (conditional — depends on merchant programs)
 *   CT-04 — Descriptive labels per payment frequency
 *   CT-05 — Full flow: program selection → CC/bank → T&C → e-sign
 *   CT-06 — Footer with contact information
 *
 * Note: CT-01/02/03/04/06 share the same page context (single test with steps).
 * CT-05 is a separate test with its own application.
 *
 * GitLab: https://gitlab.com/uown/frontend/origination/-/work_items/1233
 *
 * Pipeline: new-flow (E2E hybrid: API + browser)
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { buildTestData } from '@helpers/index.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { ContractPage } from '@pages/origination/index.js';
import { ALL_TEST_CARDS } from '@data/test-cards.js';
import { TEST_BANK } from '@config/constants.js';

// ── Constants ────────────────────────────────────────────────────────

const EXPECTED_TITLE = 'Choose the payment program that works best for you';
const EXPECTED_SUBTITLE = 'Select the option that fits your budget';
const EXPECTED_FOOTER_TEXT = "Questions? We're here to help";
const EXPECTED_FOOTER_PHONE = '(877) 353-8696';

/** Frequency label mapping — from frontend source */
const FREQUENCY_LABELS: Record<string, { title: string; description: string }> = {
  Weekly: { title: 'Weekly Payment Program', description: 'Pay more often, smaller amounts' },
  'Bi-Weekly': { title: 'Bi-Weekly Payment Program', description: 'Most popular' },
  'Twice a Month': { title: 'Twice a Month Payment Program', description: 'Lower frequency, larger payments' },
  Monthly: { title: 'Monthly Payment Program', description: 'Lower frequency, larger payments' },
};

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env: 'qa1',
    state: 'NY',
    merchantKey: 'TerraceFinance',
    orderTotal: '800',
    // Fernando's instructions specify SSN 888888888, but it causes a backend 500
    // (NullPointerException). Using auto-generated approved SSN instead.
    // See BUG-01 in docs/test-reports/1233-bugs.md
    tag: buildTags(TestTag.REGRESSION, TestTag.CRITICAL, TestTag.QA1),
  },
];

// ── Helper ───────────────────────────────────────────────────────────

/** Strip planId from redirectUrl so MissingPaymentProgram screen renders */
function stripPlanId(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.searchParams.delete('planId');
  return url.toString();
}

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  test.describe(
    `RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233 - ${data.env}/${data.merchantKey}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01/04/06/03/02 — UI validation (single page context)
      // ══════════════════════════════════════════════════════════════
      test('CT-01/02/03/04/06: Redesigned payment program screen — UI validation and selection', async ({ api, page }) => {
        test.setTimeout(120_000);

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchantKey,
          orderTotal: data.orderTotal,
          orderDescription: 'Design validation #1233',
        });
        console.log(`[CT-01] runId=${td.runId}, email=${td.applicant.email}, ssn=${td.applicant.ssn}`);

        // ── CT-01: Send application and navigate ────────────────
        let redirectUrl: string;

        await test.step('CT-01: Send application via API (approved SSN → UW_APPROVED)', async () => {
          const res = await api.application.sendApplication(td.merchant, td.applicant, td.order);
          console.log(`[CT-01] sendApplication status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
          if (res.status !== 200) {
            console.log(`[CT-01] ERROR body: ${JSON.stringify(res.body).substring(0, 500)}`);
          }
          expect(res.status, 'sendApplication should return HTTP 200').toBe(200);

          const pdl = res.body.paymentDetailsList;
          expect(pdl?.length, 'paymentDetailsList should have entries').toBeGreaterThan(0);

          const firstEntry = pdl!.find(item => item.redirectUrl);
          expect(firstEntry?.redirectUrl, 'redirectUrl should be present').toBeTruthy();
          redirectUrl = stripPlanId(firstEntry!.redirectUrl!);
          console.log(`[CT-01] redirectUrl (no planId)=${redirectUrl.substring(0, 100)}...`);
        });

        await test.step('CT-01: Navigate to completeApplication screen', async () => {
          await page.goto(redirectUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.waitForLoadState('networkidle').catch(() => {});

          const container = page.locator(SELECTORS.paymentProgramContainer);
          await container.waitFor({ state: 'visible', timeout: 30_000 });
          console.log('[CT-01] Payment program container visible');
          await page.screenshot({ path: 'reports/screenshots/1233-ct01-01-payment-program-screen.png', fullPage: false });
        });

        await test.step('CT-01: Verify logo, title, and subtitle', async () => {
          await expect(page.locator(SELECTORS.paymentProgramLogo)).toBeVisible({ timeout: 10_000 });

          const title = page.locator(SELECTORS.paymentProgramTitle).first();
          const subtitle = page.locator(SELECTORS.paymentProgramSubtitle).first();
          await expect(title).toBeVisible();
          await expect(subtitle).toBeVisible();

          expect((await title.textContent())?.trim()).toBe(EXPECTED_TITLE);
          expect((await subtitle.textContent())?.trim()).toBe(EXPECTED_SUBTITLE);
          console.log('[CT-01] Logo, title, subtitle verified');
        });

        await test.step('CT-01: Verify payment cards structure', async () => {
          const cards = page.locator(SELECTORS.paymentCard);
          const cardCount = await cards.count();
          expect(cardCount, 'At least 1 payment card should be visible').toBeGreaterThan(0);

          const firstCard = cards.first();
          await expect(firstCard.locator(SELECTORS.paymentCardTitle)).toBeVisible();
          await expect(firstCard.locator(SELECTORS.paymentCardPrice)).toBeVisible();
          await expect(firstCard.locator(SELECTORS.paymentCardButton)).toBeVisible();

          const detailRows = firstCard.locator(SELECTORS.paymentCardDetailRow);
          expect(await detailRows.count(), 'Card should have >= 3 detail rows').toBeGreaterThanOrEqual(3);
          console.log(`[CT-01] ${cardCount} card(s) verified with structure`);
          await page.screenshot({ path: 'reports/screenshots/1233-ct01-02-payment-cards-structure.png', fullPage: false });
        });

        await test.step('CT-01: Verify "Choose Payment Program" button text', async () => {
          const buttons = page.locator(SELECTORS.paymentCardButton);
          const buttonCount = await buttons.count();
          for (let i = 0; i < buttonCount; i++) {
            expect((await buttons.nth(i).textContent())?.trim()).toBe('Choose Payment Program');
          }
          console.log(`[CT-01] ${buttonCount} button(s) verified`);
        });

        // ── CT-04: Frequency-specific labels ────────────────────
        await test.step('CT-04: Verify descriptive labels per payment frequency', async () => {
          const cards = page.locator(SELECTORS.paymentCard);
          const cardCount = await cards.count();
          let matchedFrequencies = 0;

          for (let i = 0; i < cardCount; i++) {
            const card = cards.nth(i);
            const titleText = (await card.locator(SELECTORS.paymentCardTitle).textContent())?.trim();
            const descText = (await card.locator(SELECTORS.paymentCardDescription).textContent())?.trim();

            console.log(`[CT-04] Card ${i}: title="${titleText}", description="${descText}"`);

            for (const [freq, labels] of Object.entries(FREQUENCY_LABELS)) {
              if (titleText === labels.title) {
                expect(descText, `${freq} card description should match`).toBe(labels.description);
                matchedFrequencies++;
                console.log(`[CT-04] Matched: ${freq}`);
                break;
              }
            }
          }

          expect(matchedFrequencies, 'At least 1 frequency should match').toBeGreaterThan(0);
          console.log(`[CT-04] ${matchedFrequencies}/${cardCount} cards matched`);
          await page.screenshot({ path: 'reports/screenshots/1233-ct04-03-frequency-labels.png', fullPage: false });
        });

        // ── CT-06: Footer information ───────────────────────────
        await test.step('CT-06: Verify footer text and phone number', async () => {
          const footerText = page.locator(SELECTORS.paymentProgramFooterText);
          const footerPhone = page.locator(SELECTORS.paymentProgramFooterPhone);

          await expect(footerText).toBeVisible();
          await expect(footerPhone).toBeVisible();

          expect((await footerText.textContent())?.trim()).toBe(EXPECTED_FOOTER_TEXT);
          expect((await footerPhone.textContent())?.trim()).toBe(EXPECTED_FOOTER_PHONE);
          console.log('[CT-06] Footer verified');
          await page.screenshot({ path: 'reports/screenshots/1233-ct06-04-footer.png', fullPage: true });
        });

        // ── CT-03: Term selection tabs (conditional) ─────────────
        await test.step('CT-03: Check term selection tabs', async () => {
          const tabs = page.locator(SELECTORS.termSelectionTab);
          const tabCount = await tabs.count();

          if (tabCount === 0) {
            console.log('[CT-03] No tabs — merchant has single term. Skipping.');
            return;
          }

          console.log(`[CT-03] ${tabCount} tab(s) found`);

          for (let i = 0; i < tabCount; i++) {
            const tabText = await tabs.nth(i).textContent();
            expect(tabText).toContain('Months Terms');
            console.log(`[CT-03] Tab ${i}: "${tabText?.trim()}"`);
          }

          const selectedTab = page.locator(SELECTORS.termSelectionTabSelected);
          await expect(selectedTab).toBeVisible();

          if (tabCount > 1) {
            const cardsBefore = await page.locator(SELECTORS.paymentCard).count();
            await tabs.nth(1).click();
            await page.waitForTimeout(500);
            const cardsAfter = await page.locator(SELECTORS.paymentCard).count();
            console.log(`[CT-03] Tab switch: ${cardsBefore} → ${cardsAfter} cards`);
            expect(cardsAfter).toBeGreaterThan(0);

            // Switch back
            await tabs.first().click();
            await page.waitForTimeout(500);
          }
        });

        // ── CT-02: Select program → CC/bank form ────────────────
        await test.step('CT-02: Click "Choose Payment Program" and verify CC/bank form', async () => {
          const firstButton = page.locator(SELECTORS.paymentCardButton).first();
          await firstButton.click();
          console.log('[CT-02] Clicked "Choose Payment Program"');

          const ccField = page.locator(
            `${SELECTORS.ccFirstName}, input[placeholder*="First Name"], input[placeholder*="Cardholder"]`,
          ).first();
          await ccField.waitFor({ state: 'visible', timeout: 30_000 });

          const container = page.locator(SELECTORS.paymentProgramContainer);
          await expect(container).not.toBeVisible({ timeout: 5_000 });
          console.log('[CT-02] CC/bank form visible, payment program hidden');
          await page.screenshot({ path: 'reports/screenshots/1233-ct02-05-cc-bank-form.png', fullPage: false });
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — Full flow: program → CC/bank → T&C → e-sign
      // ══════════════════════════════════════════════════════════════
      test('CT-05: Full flow — program selection to e-sign', async ({ api, page, db }) => {
        test.setTimeout(300_000);

        const td = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchantKey,
          orderTotal: data.orderTotal,
          orderDescription: 'Full flow #1233',
          sanitizeNames: true,
        });
        console.log(`[CT-05] runId=${td.runId}, email=${td.applicant.email}`);

        let contractUrl: string;
        let leadPk: string;

        await test.step('Send application via API', async () => {
          const res = await api.application.sendApplication(td.merchant, td.applicant, td.order);
          console.log(`[CT-05] sendApplication status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
          expect(res.status).toBe(200);

          const pdl = res.body.paymentDetailsList;
          expect(pdl?.length).toBeGreaterThan(0);

          const entry = pdl!.find(item => item.redirectUrl);
          expect(entry?.redirectUrl).toBeTruthy();
          contractUrl = stripPlanId(entry!.redirectUrl!);

          const uuid = res.body.accountNumber!;
          leadPk = await db.getSingleString(
            `SELECT pk::text FROM uown_los_lead WHERE uuid = $1`,
            [uuid],
          ) ?? '';
          console.log(`[CT-05] contractUrl=${contractUrl.substring(0, 80)}..., leadPk=${leadPk}`);
        });

        await test.step('Navigate and select payment program', async () => {
          await page.goto(contractUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
          await page.waitForLoadState('networkidle').catch(() => {});

          const container = page.locator(SELECTORS.paymentProgramContainer);
          await container.waitFor({ state: 'visible', timeout: 30_000 });

          const firstButton = page.locator(SELECTORS.paymentCardButton).first();
          await firstButton.click();
          console.log('[CT-05] Payment program selected');
          await page.screenshot({ path: 'reports/screenshots/1233-ct05-01-program-selected.png', fullPage: false });
        });

        await test.step('Fill CC and bank info', async () => {
          const contractPage = new ContractPage(page);

          const card = ALL_TEST_CARDS.VISA_APPROVED;
          await contractPage.fillCreditCardInfo({
            firstName: td.applicant.firstName,
            lastName: td.applicant.lastName,
            cardNumber: card.number,
            cvc: card.cvv,
            expDate: `${card.expMonth}/${card.expYear}`,
          });

          await contractPage.fillBankInfo({
            firstName: td.applicant.firstName,
            lastName: td.applicant.lastName,
            routingNumber: TEST_BANK.DEFAULT_ROUTING,
            accountNumber: TEST_BANK.DEFAULT_ACCOUNT_SHORT,
            accountType: TEST_BANK.DEFAULT_TYPE,
          });
          console.log('[CT-05] CC and bank info filled');
        });

        await test.step('Submit payment info', async () => {
          const contractPage = new ContractPage(page);
          await contractPage.submitPaymentInfo();
          console.log('[CT-05] Payment info submitted');
        });

        await test.step('Complete Terms & Conditions', async () => {
          const contractPage = new ContractPage(page);
          await contractPage.completeTermsAndConditions();
          console.log('[CT-05] T&C completed');
        });

        await test.step('Complete e-sign', async () => {
          const contractPage = new ContractPage(page);
          await contractPage.completeESign();
          console.log('[CT-05] E-sign completed');
        });

        await test.step('Verify lead status is SIGNED or beyond', async () => {
          if (!leadPk) {
            console.log('[CT-05] WARN: leadPk not available — skipping DB status check');
            return;
          }

          let status = '';
          for (let attempt = 1; attempt <= 10; attempt++) {
            status = await db.getLeadStatus(leadPk) ?? '';
            console.log(`[CT-05] Lead status (attempt ${attempt}): ${status}`);
            if (['CONTRACT_CREATED', 'SIGNED', 'SETTLED', 'FUNDING', 'FUNDED'].includes(status)) {
              break;
            }
            await page.waitForTimeout(3_000);
          }

          expect(
            ['CONTRACT_CREATED', 'SIGNED', 'SETTLED', 'FUNDING', 'FUNDED'],
            `Lead should be in signed/post-signed state, got: ${status}`,
          ).toContain(status);
          console.log(`[CT-05] Final lead status: ${status}`);
          await page.screenshot({ path: 'reports/screenshots/1233-ct05-02-esign-completed.png', fullPage: false });
        });
      });
    },
  );
}

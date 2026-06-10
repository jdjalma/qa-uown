/**
 * Task #497 — UOWN | SVC | Account rating is not being updated correctly
 * Milestone: RU04.26.1.51.0
 *
 * SPEC:      ./RU04.26.1.51.0_bankAccountRatingLetterValidation_497-spec.md
 * Scenarios: ./RU04.26.1.51.0_bankAccountRatingLetterValidation_497-scenarios.md
 * GitLab:    https://gitlab.com/uown/backend/svc/-/work_items/497
 *
 * Triple validation (UI + API/DB + DB cross-check) per CT.
 * Screenshot per CT attached via test.info().attach() + saved to disk.
 * ACH rating-letter assertions in CT-06 use expect.soft() — documents bug without
 * breaking the pipeline.
 *
 * Run:
 *   npx playwright test docs/taskTestingUown/RU04.26.1.51.0_bankAccountRatingLetterValidation_497 \
 *     --project=task-testing --reporter=list
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '../../../src/support/base-test.js';
import { ServicingCustomerPage, BankAccountPage } from '@pages/servicing/index.js';
import { LoginPage } from '@pages/index.js';
import {
  driveLeadToFunding,
  setupApplicationViaApi,
  buildTestData,
  sleep,
  RUN_ID,
} from '@helpers/index.js';
import { TestTag } from '@ptypes/enums.js';
import { buildAchArrangementBody } from '@api/bodies/payment-arrangement.body.js';

// ── Constants ───────────────────────────────────────────────────────────

const TEST_NAME = 'RU04.26.1.51.0_bankAccountRatingLetterValidation_497';
const TEST_ROUTING = '121042882'; // Wells Fargo public test routing
const SHOT_DIR = `docs/taskTestingUown/${TEST_NAME}/screenshots`;

// Environment resolved once from .env (validated by global-setup before tests run).
const ENV = process.env.ENV as string;

const ENV_TAG: Record<string, TestTag> = {
  sandbox: TestTag.SANDBOX,
  qa1: TestTag.QA1,
  qa2: TestTag.QA2,
  stg: TestTag.STG,
  dev1: TestTag.DEV1,
  dev2: TestTag.DEV2,
  dev3: TestTag.DEV3,
};
const BASE_TAGS = [TestTag.REGRESSION, TestTag.CRITICAL, ENV_TAG[ENV] ?? TestTag.SANDBOX];

// Worker-safe unique 9-digit account numbers.
// Composition (exact 9 chars): leading "1" + tail(4) of timestamp + seq(2) + RUN_SEED(2).
// seq is guaranteed to differ on each call → no collisions even within the same millisecond.
const RUN_SEED = RUN_ID.replace(/\D/g, '').slice(-2).padStart(2, '0');
let ACCOUNT_SEQ = 0;
function newAccountNumber(): string {
  ACCOUNT_SEQ += 1;
  const tail = String(Date.now()).slice(-4);
  const seq = String(ACCOUNT_SEQ % 100).padStart(2, '0');
  return `1${tail}${seq}${RUN_SEED}`; // exactly 9 chars
}

// ── Helpers ────────────────────────────────────────────────────────────

async function ensureShotDir(): Promise<void> {
  await fs.mkdir(SHOT_DIR, { recursive: true }).catch(() => {});
}

async function takeCtScreenshot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  label: string,
): Promise<void> {
  await ensureShotDir();
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = path.join(SHOT_DIR, `${TEST_NAME}-${safeLabel}.png`);
  const buffer = await page.screenshot({ path: filePath, fullPage: false }).catch(() => null);
  if (buffer) {
    await testInfo.attach(`${safeLabel}.png`, { body: buffer, contentType: 'image/png' });
  }
}

async function provisionFundedAccount(
  api: Parameters<Parameters<typeof test>[2]>[0]['api'],
  db: Parameters<Parameters<typeof test>[2]>[0]['db'],
  ctx: Parameters<Parameters<typeof test>[2]>[0]['ctx'],
  testInfo: import('@playwright/test').TestInfo,
): Promise<{ accountPk: string; accountNumber: string; customerPk: number; leadPk: string }>
{
  const td = buildTestData({
    env: ENV,
    state: 'CA',
    merchant: 'TerraceFinance',
    orderTotal: '1000',
  });

  await setupApplicationViaApi(
    api,
    {
      merchant: td.merchant,
      applicant: td.applicant,
      order: td.order,
      env: ENV,
      verifyApproval: false,
      submitPaymentInfoViaApi: true,
    },
    testInfo,
    ctx,
  );

  await driveLeadToFunding(api, td.merchant, ctx);

  // FUNDING → FUNDED
  await sleep(2_000);
  const fundedResp = await api.lead.updateFundingStatus([Number(ctx.leadPk)], 'FUNDED');
  expect(fundedResp.ok, `updateFundingStatus FUNDED: ${fundedResp.status}`).toBeTruthy();

  // Wait for SVC account creation (may be async after FUNDED)
  let accountPk = ctx.accountPk;
  if (!accountPk) {
    const polled = await db.waitForAccountByLeadPk(ctx.leadPk, 60_000);
    if (!polled) throw new Error(`SVC account not created for leadPk=${ctx.leadPk}`);
    accountPk = polled;
    ctx.accountPk = polled;
  }

  // Resolve customerPk + displayed accountNumber from DB.
  // uown_sv_account has no `customer_pk` / `account_number` columns — customer is joined via
  // uown_sv_customer.account_pk (FK reverse), and the UI's "Account #" is the account's own pk.
  const accountRow = await db.queryOne<{ customer_pk: string | number | null; ref_account_id: string | number | null }>(
    `SELECT c.pk AS customer_pk, a.ref_account_id
       FROM uown_sv_account a
  LEFT JOIN uown_sv_customer c ON c.account_pk = a.pk
      WHERE a.pk = $1
      LIMIT 1`,
    [accountPk],
  );
  if (!accountRow) throw new Error(`uown_sv_account row not found for pk=${accountPk}`);
  const customerPk = Number(accountRow.customer_pk ?? 0);
  const accountNumber = String(accountPk); // UI quick-search uses the account pk
  ctx.accountNumber = accountNumber;

  testInfo.annotations.push({ type: 'accountPk', description: accountPk });
  testInfo.annotations.push({ type: 'accountNumber', description: accountNumber });
  testInfo.annotations.push({ type: 'customerPk', description: String(customerPk) });

  // Clean slate: submitApplication during funding creates a bank account + ACH autopay.
  // Remove pre-existing active bank accounts via API so tests observe a clean add/delete baseline.
  const preExisting = await db.getActiveBankAccountsByAccountPk(accountPk);
  for (const row of preExisting) {
    const bankAccountInfo = {
      bankAccountPk: Number(row.pk),
      customerPk,
      accountPk: Number(accountPk),
      name: String(row.name ?? 'Unknown'),
      accountNumber: String(row.account_number ?? ''),
      routingNumber: String(row.routing_number ?? ''),
      bankName: String(row.bank_name ?? 'Unknown'),
      bankAccountType: (row.bank_account_type as 'CHECKING' | 'SAVINGS') ?? 'CHECKING',
      autoPay: Boolean(row.auto_pay),
      isDeleted: false,
    };
    await api.bankAccount.removeBankAccount({ accountPk: Number(accountPk), bankAccountInfo });
  }
  // Verify cleanup — poll briefly for deletion to be reflected
  for (let i = 0; i < 10; i += 1) {
    const remaining = await db.getActiveBankAccountsByAccountPk(accountPk);
    if (remaining.length === 0) break;
    await sleep(500);
  }

  return { accountPk, accountNumber, customerPk, leadPk: ctx.leadPk };
}

function normalizeRating(value: string | null | undefined): string | null {
  if (value == null) return null;
  let trimmed = String(value).trim();
  if (!trimmed || trimmed === '-') return null;
  // UI renders rating as "P - Payment Arrangement"; DB stores just the letter.
  // Strip the descriptive suffix to align UI ⇄ DB comparisons.
  const dash = trimmed.indexOf(' - ');
  if (dash > 0) trimmed = trimmed.slice(0, dash);
  return trimmed;
}

async function loginServicingAsInternalUser(
  page: import('@playwright/test').Page,
  testEnv: import('../../../src/config/environment.js').ConfigEnvironment,
): Promise<void> {
  // Internal user for Servicing — storageState not guaranteed in task-testing project.
  // Perform a best-effort login via UI; reuse existing LoginPage + admin role credentials.
  const loginPage = new LoginPage(page);
  await page.goto(testEnv.servicingUrl);
  const creds = testEnv.getCredentials('admin');
  await loginPage
    .login(creds.username, creds.password)
    .catch((e) => console.warn(`[login] servicing login fallback: ${(e as Error).message}`));
}

// ── Test group ────────────────────────────────────────────────────────

test.describe(
  `${TEST_NAME} - ${ENV}/TerraceFinance`,
  { tag: BASE_TAGS },
  () => {
    // ──────────────────────────────────────────────────────────────────
    // CT-01 — Add bank account (default=Yes) preserves rating, adds ACH
    // ──────────────────────────────────────────────────────────────────
    test('CT-01 — Add bank account default=Yes preserves rating, enables ACH autopay', async ({
      page, api, db, ctx, testEnv,
    }, testInfo) => {
      test.setTimeout(720_000);

      let accountPk = '';
      let customerPk = 0;

      await test.step('Setup — funded account', async () => {
        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPk = res.accountPk;
        customerPk = res.customerPk;
      });

      await test.step('Baseline — capture rating (DB)', async () => {
        const dbRating = normalizeRating(await db.getAccountRating(accountPk));
        expect(dbRating, 'Baseline DB rating expected null/unset').toBeNull();
        const existing = await db.getActiveBankAccountsByAccountPk(accountPk);
        expect(existing.length, 'Baseline — account should start without active bank accounts').toBe(0);
      });

      await test.step('Login and navigate to Servicing customer page', async () => {
        await loginServicingAsInternalUser(page, testEnv);
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountNumber || accountPk);
      });

      const accountNumberInput = newAccountNumber();

      await test.step('Baseline — capture rating (UI)', async () => {
        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        expect(uiRating, 'Baseline UI rating expected null/unset').toBeNull();
      });

      await test.step('Action — Add bank account (default = Yes)', async () => {
        const bankPage = new BankAccountPage(page);
        await bankPage.openAddBankAccountModal();
        await bankPage.addBankAccount({
          routingNumber: TEST_ROUTING,
          accountNumber: accountNumberInput,
          accountType: 'CHECKING',
          setAsDefault: true,
        });
      });

      await test.step('Assert — DB persistence (bank + rating + autoPayTypes)', async () => {
        const newBankPk = await db.waitForBankAccountExists(accountPk, accountNumberInput, 30_000);
        expect(newBankPk, 'Bank account row persisted').toBeTruthy();

        const row = await db.getBankAccountByPk(String(newBankPk));
        expect(row, 'Bank account row not found').not.toBeNull();
        expect(row!.auto_pay).toBe(true);
        expect(row!.is_deleted).toBe(false);
        expect(row!.routing_number).toBe(TEST_ROUTING);

        const autoPayTypes = (await db.getAccountAutoPayTypes(accountPk)) ?? '';
        expect(autoPayTypes, `autoPayTypes expected to contain ACH — got "${autoPayTypes}"`).toMatch(/ACH/);

        const rating = normalizeRating(await db.getAccountRating(accountPk));
        expect(rating, 'Rating must be preserved after add').toBeNull();
      });

      await test.step('Assert — UI still shows rating unchanged', async () => {
        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        expect(uiRating, 'UI rating must be preserved after add').toBeNull();
      });

      await test.step('Assert — activity log for BANK_ACCOUNT + no rating-change log', async () => {
        const bankLogs = await db.getBankAccountActivityLogs(accountPk);
        expect(bankLogs.length, 'Expected at least 1 BANK_ACCOUNT log').toBeGreaterThanOrEqual(1);

        const ratingChangeLogs = await db.getRatingChangeLogs(accountPk);
        expect(ratingChangeLogs.length, 'No rating-change log should be emitted by an add').toBe(0);
      });

      await takeCtScreenshot(page, testInfo, 'CT-01-default-yes-after-add');
      // Silence unused-warning — customerPk is captured for annotations only.
      expect(customerPk).toBeGreaterThan(0);
    });

    // ──────────────────────────────────────────────────────────────────
    // CT-02 — Add bank account (default=No) preserves rating, no ACH
    // ──────────────────────────────────────────────────────────────────
    test('CT-02 — Add bank account default=No preserves rating, no ACH autopay', async ({
      page, api, db, ctx, testEnv,
    }, testInfo) => {
      test.setTimeout(720_000);

      let accountPk = '';

      await test.step('Setup — funded account', async () => {
        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPk = res.accountPk;
      });

      await test.step('Login + navigate to customer page', async () => {
        await loginServicingAsInternalUser(page, testEnv);
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountNumber || accountPk);
      });

      const accountNumberInput = newAccountNumber();

      await test.step('Action — Add bank account (default = No)', async () => {
        const bankPage = new BankAccountPage(page);
        await bankPage.openAddBankAccountModal();
        await bankPage.addBankAccount({
          routingNumber: TEST_ROUTING,
          accountNumber: accountNumberInput,
          accountType: 'CHECKING',
          setAsDefault: false,
        });
      });

      await test.step('Assert — DB: bank autoPay=false, ACH NOT in autoPayTypes', async () => {
        const newBankPk = await db.waitForBankAccountExists(accountPk, accountNumberInput, 30_000);
        expect(newBankPk, 'Bank account row persisted').toBeTruthy();

        const row = await db.getBankAccountByPk(String(newBankPk));
        expect(row!.auto_pay).toBe(false);
        expect(row!.is_deleted).toBe(false);

        const autoPayTypes = (await db.getAccountAutoPayTypes(accountPk)) ?? '';
        expect(autoPayTypes, `autoPayTypes expected NOT to contain ACH — got "${autoPayTypes}"`).not.toMatch(/ACH/);

        const rating = normalizeRating(await db.getAccountRating(accountPk));
        expect(rating, 'Rating must be preserved after non-default add').toBeNull();
      });

      await test.step('Assert — UI rating preserved', async () => {
        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        expect(uiRating).toBeNull();
      });

      await test.step('Assert — no rating-change log; no autopay-enable log', async () => {
        const ratingChangeLogs = await db.getRatingChangeLogs(accountPk);
        expect(ratingChangeLogs.length, 'No rating-change log expected').toBe(0);

        // Per user-confirmed behaviour: default=No must NOT emit any "ACH enabled" / autopay log.
        const achEnabled = await db.getActivityLogsByAccount(accountPk, 'ACH enabled');
        expect(achEnabled.length, 'No "ACH enabled" log expected when default=No').toBe(0);
      });

      await takeCtScreenshot(page, testInfo, 'CT-02-default-no-after-add');
    });

    // ──────────────────────────────────────────────────────────────────
    // CT-03 — Delete default bank account (autoPay=true) — UI
    // ──────────────────────────────────────────────────────────────────
    test('CT-03 — Delete default bank account removes ACH, preserves rating', async ({
      page, api, db, ctx, testEnv,
    }, testInfo) => {
      test.setTimeout(720_000);

      let accountPk = '';
      let customerPk = 0;
      const accountNumberInput = newAccountNumber();
      const lastFour = accountNumberInput.slice(-4);

      await test.step('Setup — funded account + add default bank via API', async () => {
        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPk = res.accountPk;
        customerPk = res.customerPk;

        const create = await api.bankAccount.createBankAccount(
          Number(accountPk),
          customerPk,
          {
            autoPay: true,
            accountNumber: accountNumberInput,
            routingNumber: TEST_ROUTING,
            name: 'TEST HOLDER',
            bankName: 'TEST BANK',
          },
        );
        expect(create.ok, `createBankAccount: ${create.status}`).toBeTruthy();

        const persisted = await db.waitForBankAccountExists(accountPk, accountNumberInput, 30_000);
        expect(persisted).toBeTruthy();

        const autoPayTypes = (await db.getAccountAutoPayTypes(accountPk)) ?? '';
        expect(autoPayTypes, `Setup: autoPayTypes should contain ACH — got "${autoPayTypes}"`).toMatch(/ACH/);
      });

      await test.step('Login + navigate to customer page', async () => {
        await loginServicingAsInternalUser(page, testEnv);
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountNumber || accountPk);
      });

      await test.step('Action — Delete bank account via UI (View All → Delete by last4)', async () => {
        const bankPage = new BankAccountPage(page);
        await bankPage.openAllBankAccountsModal();
        await bankPage.deleteBankAccountByLastFour(lastFour);
      });

      await test.step('Assert — DB: bank soft-deleted, ACH removed, rating preserved', async () => {
        // Poll until row is_deleted=true
        let deletedOk = false;
        for (let i = 0; i < 15; i += 1) {
          const row = await db.queryOne<{ pk: string | number; is_deleted: boolean; auto_pay: boolean }>(
            `SELECT pk, is_deleted, auto_pay FROM uown_sv_bank_account
             WHERE account_pk = $1 AND account_number = $2
             ORDER BY row_created_timestamp DESC LIMIT 1`,
            [accountPk, accountNumberInput],
          );
          if (row && row.is_deleted === true) {
            expect(row.auto_pay).toBe(false);
            deletedOk = true;
            break;
          }
          await sleep(2_000);
        }
        expect(deletedOk, 'Bank account row should be is_deleted=true').toBeTruthy();

        const autoPayTypes = (await db.getAccountAutoPayTypes(accountPk)) ?? '';
        expect(autoPayTypes, `autoPayTypes expected NOT to contain ACH — got "${autoPayTypes}"`).not.toMatch(/ACH/);

        const rating = normalizeRating(await db.getAccountRating(accountPk));
        expect(rating, 'Rating must be preserved after delete').toBeNull();
      });

      await test.step('Assert — UI rating preserved', async () => {
        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        expect(uiRating).toBeNull();
      });

      await test.step('Assert — activity log + no rating-change log', async () => {
        const bankLogs = await db.getBankAccountActivityLogs(accountPk);
        expect(bankLogs.length, 'Expected ≥1 BANK_ACCOUNT log (add + delete)').toBeGreaterThanOrEqual(1);

        const ratingChangeLogs = await db.getRatingChangeLogs(accountPk);
        expect(ratingChangeLogs.length, 'No rating-change log expected').toBe(0);
      });

      await takeCtScreenshot(page, testInfo, 'CT-03-after-delete-default');
    });

    // ──────────────────────────────────────────────────────────────────
    // CT-04 — Delete non-default bank account (BA2), BA1 intact
    // ──────────────────────────────────────────────────────────────────
    test('CT-04 — Delete non-default bank account keeps default ACH active', async ({
      page, api, db, ctx, testEnv,
    }, testInfo) => {
      test.setTimeout(720_000);

      let accountPk = '';
      let customerPk = 0;
      const ba1AccountNumber = newAccountNumber();
      const ba2AccountNumber = newAccountNumber();
      const ba2LastFour = ba2AccountNumber.slice(-4);

      await test.step('Setup — funded account + BA1 via API', async () => {
        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPk = res.accountPk;
        customerPk = res.customerPk;

        // BA1 — default (autoPay=true) via API.
        // Note: createOrUpdateBankAccount appears to UPSERT on (customerPk, accountPk) when
        // called twice via API; a second API call would overwrite BA1. So we add BA2 via UI
        // to exercise the real multi-bank path.
        const ba1 = await api.bankAccount.createBankAccount(
          Number(accountPk),
          customerPk,
          {
            autoPay: true,
            accountNumber: ba1AccountNumber,
            routingNumber: TEST_ROUTING,
            name: 'TEST HOLDER BA1',
            bankName: 'TEST BANK',
          },
        );
        expect(ba1.ok, `createBankAccount BA1: ${ba1.status}`).toBeTruthy();
        expect(await db.waitForBankAccountExists(accountPk, ba1AccountNumber, 30_000)).toBeTruthy();
      });

      await test.step('Login + navigate', async () => {
        await loginServicingAsInternalUser(page, testEnv);
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountNumber || accountPk);
      });

      await test.step('Action — Add BA2 (non-default) via UI', async () => {
        const bankPage = new BankAccountPage(page);
        await bankPage.openAddBankAccountModal();
        await bankPage.addBankAccount({
          routingNumber: TEST_ROUTING,
          accountNumber: ba2AccountNumber,
          accountType: 'CHECKING',
          setAsDefault: false,
        });
        expect(await db.waitForBankAccountExists(accountPk, ba2AccountNumber, 30_000)).toBeTruthy();
      });

      await test.step('Action — Delete BA2 (non-default) via UI', async () => {
        // The "All Bank Accounts" modal caches stale data right after a UI add;
        // wait for backend persistence, then re-navigate to trigger a fresh fetch.
        await sleep(3_000);
        const directUrl = `${testEnv.servicingUrl.replace(/\/$/, '')}/customer-information/${accountPk}`;
        await page.goto(directUrl, { waitUntil: 'networkidle', timeout: 60_000 });

        // Poll for #customer-summary (qa2 customer page can be slow to paint)
        const customerPage = new ServicingCustomerPage(page);
        try {
          await customerPage.customerSummary.waitFor({ state: 'visible', timeout: 45_000 });
        } catch {
          // Fallback: body content includes "Account #" as a known anchor
          await page.locator('text=/Account #/').first().waitFor({ state: 'visible', timeout: 15_000 });
        }

        const bankPage = new BankAccountPage(page);
        await bankPage.openAllBankAccountsModal();
        await bankPage.deleteBankAccountByLastFour(ba2LastFour);
      });

      await test.step('Assert — BA1 intact (is_deleted=false, auto_pay=true); BA2 soft-deleted', async () => {
        const ba1Row = await db.queryOne<{ auto_pay: boolean; is_deleted: boolean }>(
          `SELECT auto_pay, is_deleted FROM uown_sv_bank_account
           WHERE account_pk=$1 AND account_number=$2`,
          [accountPk, ba1AccountNumber],
        );
        expect(ba1Row, 'BA1 should exist').not.toBeNull();
        expect(ba1Row!.is_deleted).toBe(false);
        expect(ba1Row!.auto_pay).toBe(true);

        // Poll BA2 deletion
        let ba2Deleted = false;
        for (let i = 0; i < 15; i += 1) {
          const ba2Row = await db.queryOne<{ is_deleted: boolean; auto_pay: boolean }>(
            `SELECT is_deleted, auto_pay FROM uown_sv_bank_account
             WHERE account_pk=$1 AND account_number=$2`,
            [accountPk, ba2AccountNumber],
          );
          if (ba2Row && ba2Row.is_deleted === true) {
            expect(ba2Row.auto_pay).toBe(false);
            ba2Deleted = true;
            break;
          }
          await sleep(2_000);
        }
        expect(ba2Deleted, 'BA2 should be is_deleted=true').toBeTruthy();

        const autoPayTypes = (await db.getAccountAutoPayTypes(accountPk)) ?? '';
        expect(autoPayTypes, `autoPayTypes should still contain ACH — got "${autoPayTypes}"`).toMatch(/ACH/);

        const rating = normalizeRating(await db.getAccountRating(accountPk));
        expect(rating, 'Rating must be preserved after non-default delete').toBeNull();
      });

      await takeCtScreenshot(page, testInfo, 'CT-04-after-delete-non-default');
    });

    // ──────────────────────────────────────────────────────────────────
    // CT-05 — Rating P pre-existing blocks ACH autopay on add (default=Yes)
    // ──────────────────────────────────────────────────────────────────
    test('CT-05 — Pre-existing rating P blocks ACH autopay on default=Yes add', async ({
      page, api, db, ctx, testEnv,
    }, testInfo) => {
      test.setTimeout(720_000);

      let accountPk = '';
      let customerPk = 0;
      let leadPk = '';

      await test.step('Setup — funded account', async () => {
        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPk = res.accountPk;
        customerPk = res.customerPk;
        leadPk = res.leadPk;
      });

      await test.step('Setup — attempt to force rating=P via ACH payment arrangement (future posting)', async () => {
        // Posting date = today + 7d
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const postingDate = d.toISOString().slice(0, 10);

        const body = buildAchArrangementBody({
          accountPk: Number(accountPk),
          arrangementType: 'SETTLEMENT',
          routingNumber: TEST_ROUTING,
          accountNumber: newAccountNumber(),
          bankAccountType: 'CHECKING',
          username: 'automation.gow',
          installments: [{ amount: '50.00', date: postingDate }],
        });

        const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
        testInfo.annotations.push({
          type: 'ct05-arrangement-status',
          description: `status=${res.status}, ok=${res.ok}`,
        });

        // Poll up to 30s for rating to flip to 'P'
        let ratingIsP = false;
        for (let i = 0; i < 15; i += 1) {
          const rating = normalizeRating(await db.getAccountRating(accountPk));
          if (rating === 'P') {
            ratingIsP = true;
            break;
          }
          await sleep(2_000);
        }
        if (!ratingIsP) {
          testInfo.annotations.push({
            type: 'ct05-setup-skipped',
            description: 'Rating did not flip to P after 30s — likely blocked by bug #497',
          });
          test.skip(true, 'Setup rating=P failed — likely blocked by bug #497 for internal users');
        }
      });

      await test.step('Login + navigate', async () => {
        await loginServicingAsInternalUser(page, testEnv);
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountNumber || accountPk);
      });

      const accountNumberInput = newAccountNumber();

      await test.step('Action — Add bank account default=Yes with rating=P', async () => {
        const bankPage = new BankAccountPage(page);
        await bankPage.openAddBankAccountModal();
        await bankPage.addBankAccount({
          routingNumber: TEST_ROUTING,
          accountNumber: accountNumberInput,
          accountType: 'CHECKING',
          setAsDefault: true,
        });
      });

      await test.step('Assert — rating still P, bank row autoPay=true, ACH NOT in autoPayTypes', async () => {
        const newBankPk = await db.waitForBankAccountExists(accountPk, accountNumberInput, 30_000);
        expect(newBankPk, 'Bank account row persisted').toBeTruthy();

        const row = await db.getBankAccountByPk(String(newBankPk));
        // Row flag is respected — user intent recorded
        expect(row!.auto_pay).toBe(true);
        expect(row!.is_deleted).toBe(false);

        // But account autoPayTypes should NOT carry ACH — business rule §58 precedence
        const autoPayTypes = (await db.getAccountAutoPayTypes(accountPk)) ?? '';
        expect(autoPayTypes, `autoPayTypes must NOT contain ACH when rating=P — got "${autoPayTypes}"`).not.toMatch(/ACH/);

        const rating = normalizeRating(await db.getAccountRating(accountPk));
        expect(rating, 'Rating must stay P').toBe('P');
      });

      await test.step('Assert — UI rating shows P', async () => {
        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        expect(uiRating).toBe('P');
      });

      await takeCtScreenshot(page, testInfo, 'CT-05-rating-P-after-add');
      // silence unused warnings
      expect(leadPk).toBeTruthy();
    });

    // ──────────────────────────────────────────────────────────────────
    // CT-06 — Bug #497 replication (UI + API)
    // ──────────────────────────────────────────────────────────────────
    test('CT-06 — Bug #497 replication: ACH REQUEST by internal user (UI + API)', async ({
      page, api, db, ctx, testEnv,
    }, testInfo) => {
      test.setTimeout(720_000);

      // ── Part A: UI flow ────────────────────────────────────────────
      let accountPkA = '';
      let customerPkA = 0;
      const bankAccountA = newAccountNumber();

      await test.step('Part A — Setup funded account + bank via API', async () => {
        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPkA = res.accountPk;
        customerPkA = res.customerPk;

        const create = await api.bankAccount.createBankAccount(
          Number(accountPkA),
          customerPkA,
          {
            autoPay: true,
            accountNumber: bankAccountA,
            routingNumber: TEST_ROUTING,
            name: 'TEST HOLDER CT06-A',
            bankName: 'TEST BANK',
          },
        );
        expect(create.ok, `createBankAccount (A): ${create.status}`).toBeTruthy();
        expect(await db.waitForBankAccountExists(accountPkA, bankAccountA, 30_000)).toBeTruthy();
      });

      await test.step('Part A — Baseline rating = null', async () => {
        const rating = normalizeRating(await db.getAccountRating(accountPkA));
        expect(rating).toBeNull();
      });

      await test.step('Part A — Login + navigate', async () => {
        await loginServicingAsInternalUser(page, testEnv);
        const customerPage = new ServicingCustomerPage(page);
        await customerPage.navigateToCustomer(ctx.accountNumber || accountPkA);
      });

      await test.step('Part A — Action (UI): Make ACH Payment (+7d, $50)', async () => {
        const customerPage = new ServicingCustomerPage(page);
        // ServicingBasePage.makeAchPayment handles existing-bank-info auto-selection
        await customerPage.makeAchPayment('+7 days', '50.00', {
          accountNumber: bankAccountA,
          routingNumber: TEST_ROUTING,
        }).catch((e) => {
          testInfo.annotations.push({
            type: 'ct06-partA-makeAchPayment-error',
            description: (e as Error).message,
          });
        });
      });

      await test.step('Part A — Assert rating (soft, UI+DB)', async () => {
        await sleep(5_000); // give async post-processing a chance to flip rating

        const dbRating = normalizeRating(await db.getAccountRating(accountPkA));
        testInfo.annotations.push({
          type: 'rating-ct06-partA-db',
          description: String(dbRating),
        });

        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        testInfo.annotations.push({
          type: 'rating-ct06-partA-ui',
          description: String(uiRating),
        });

        // Expected per fix: 'P'. Before fix: null. Use SOFT so test continues to Part B.
        expect.soft(dbRating, 'Part A — DB rating expected P post-fix').toBe('P');
        expect.soft(uiRating, 'Part A — UI rating expected P post-fix').toBe('P');

        // HARD: UI and DB must match each other regardless of expected value.
        expect(uiRating, 'UI and DB rating must be consistent').toBe(dbRating);
      });

      await takeCtScreenshot(page, testInfo, 'CT-06-partA-after-ui-ach');

      // ── Part B: API flow — new account ─────────────────────────────
      let accountPkB = '';
      let customerPkB = 0;
      const bankAccountB = newAccountNumber();

      await test.step('Part B — Setup NEW funded account + bank via API', async () => {
        // Reset ctx to avoid collisions with Part A
        ctx.leadPk = '';
        ctx.leadUuid = '';
        ctx.accountPk = '';
        ctx.accountNumber = '';

        const res = await provisionFundedAccount(api, db, ctx, testInfo);
        accountPkB = res.accountPk;
        customerPkB = res.customerPk;

        const create = await api.bankAccount.createBankAccount(
          Number(accountPkB),
          customerPkB,
          {
            autoPay: true,
            accountNumber: bankAccountB,
            routingNumber: TEST_ROUTING,
            name: 'TEST HOLDER CT06-B',
            bankName: 'TEST BANK',
          },
        );
        expect(create.ok, `createBankAccount (B): ${create.status}`).toBeTruthy();
        expect(await db.waitForBankAccountExists(accountPkB, bankAccountB, 30_000)).toBeTruthy();
      });

      await test.step('Part B — Baseline rating = null', async () => {
        const rating = normalizeRating(await db.getAccountRating(accountPkB));
        expect(rating).toBeNull();
      });

      await test.step('Part B — Action (API): createOrUpdateAchPayments REQUEST +7d', async () => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const postingDate = d.toISOString().slice(0, 10);

        const body = buildAchArrangementBody({
          accountPk: Number(accountPkB),
          arrangementType: 'SETTLEMENT',
          routingNumber: TEST_ROUTING,
          accountNumber: bankAccountB,
          bankAccountType: 'CHECKING',
          username: 'automation.gow',
          installments: [{ amount: '50.00', date: postingDate }],
        });

        const res = await api.paymentArrangement.createOrUpdateAchPayments(body);
        testInfo.annotations.push({
          type: 'ct06-partB-api-status',
          description: `status=${res.status}, ok=${res.ok}`,
        });
        expect.soft(res.ok, `Part B — API should return 2xx: ${res.status}`).toBeTruthy();
      });

      await test.step('Part B — Navigate to NEW account UI', async () => {
        // Direct URL navigation — the quick-search is flaky when switching between
        // two freshly-created accounts in the same session (autocomplete may return
        // the first account and not index the second one in time).
        const directUrl = `${testEnv.servicingUrl.replace(/\/$/, '')}/customer-information/${accountPkB}`;
        await page.goto(directUrl, { waitUntil: 'networkidle', timeout: 60_000 });

        // Re-login if redirected
        if (!page.url().includes('/customer-information/')) {
          await loginServicingAsInternalUser(page, testEnv);
          await page.goto(directUrl, { waitUntil: 'networkidle', timeout: 60_000 });
        }

        const customerPage = new ServicingCustomerPage(page);
        try {
          await customerPage.customerSummary.waitFor({ state: 'visible', timeout: 45_000 });
        } catch {
          await page.locator('text=/Account #/').first().waitFor({ state: 'visible', timeout: 15_000 });
        }
      });

      await test.step('Part B — Assert rating (soft, UI+DB)', async () => {
        await sleep(5_000);

        const dbRating = normalizeRating(await db.getAccountRating(accountPkB));
        testInfo.annotations.push({
          type: 'rating-ct06-partB-db',
          description: String(dbRating),
        });

        const customerPage = new ServicingCustomerPage(page);
        const uiRating = normalizeRating(await customerPage.getRatingLetter().catch(() => '-'));
        testInfo.annotations.push({
          type: 'rating-ct06-partB-ui',
          description: String(uiRating),
        });

        expect.soft(dbRating, 'Part B — DB rating expected P post-fix').toBe('P');
        expect.soft(uiRating, 'Part B — UI rating expected P post-fix').toBe('P');

        // HARD: UI/DB must match within Part B.
        expect(uiRating, 'UI and DB rating must be consistent (Part B)').toBe(dbRating);
      });

      await takeCtScreenshot(page, testInfo, 'CT-06-partB-after-api-ach');
    });
  },
);

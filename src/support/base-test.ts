/**
 * Base Test
 *
 * Unified test fixture that combines:
 *  - Environment configuration (ConfigEnvironment)
 *  - API clients (ApplicationClient, InvoiceClient, etc.)
 *  - Database helpers (DatabaseHelpers)
 *  - E2E hooks (animations, screenshots, console logs)
 *  - Browser profiles (via context options)
 *  - Test context (shared state across steps)
 *
 * Usage in E2E tests:
 *   import { test, expect } from '@support/base-test';
 *
 * Usage in API-only tests (no browser hooks):
 *   import { test, expect } from '@fixtures/test-context.fixture';
 */
import { test as base } from '@playwright/test';
import { ConfigEnvironment } from '../config/environment.js';
import { DatabaseHelpers } from '../helpers/database.helpers.js';
import { EmailHelpers } from '../helpers/email.helpers.js';
import { BaseApiClient } from '../config/base-api-client.js';
import { ApplicationClient } from '../api/clients/application.client.js';
import { InvoiceClient } from '../api/clients/invoice.client.js';
import { LeadClient } from '../api/clients/lead.client.js';
import { SettlementClient } from '../api/clients/settlement.client.js';
import { CreditCardClient } from '../api/clients/credit-card.client.js';
import { ScheduledTaskClient } from '../api/clients/scheduled-task.client.js';
import { MerchantClient } from '../api/clients/merchant.client.js';
import { AccountClient } from '../api/clients/account.client.js';
import { PaymentArrangementClient } from '../api/clients/payment-arrangement.client.js';
import {
  disableCssAnimations,
  captureConsoleLogs,
  attachScreenshotOnFailure,
  attachTestMetadata,
  waitForPageReady,
} from './hooks.js';

// ── Interfaces ──────────────────────────────────────────────────────

export interface TestContext {
  leadPk: string;
  leadUuid: string;
  accountPk: string;
  accountNumber: string;
  contractStatus: string;
  contractUrl: string;
  websiteAccountPk: string;
  achAdded: number;
  ccAdded: number;
  reportKeys: Map<string, string>;
  [key: string]: unknown;
}

export interface ApiClients {
  application: ApplicationClient;
  invoice: InvoiceClient;
  lead: LeadClient;
  settlement: SettlementClient;
  creditCard: CreditCardClient;
  scheduledTask: ScheduledTaskClient;
  merchant: MerchantClient;
  account: AccountClient;
  paymentArrangement: PaymentArrangementClient;
}

export interface TestFixtureOptions {
  envName: string;
}

export interface BaseTestFixtures {
  testEnv: ConfigEnvironment;
  apiClient: BaseApiClient;
  api: ApiClients;
  db: DatabaseHelpers;
  email: EmailHelpers;
  ctx: TestContext;
  consoleLogs: () => string[];
}

// ── Test Extension ──────────────────────────────────────────────────

export const test = base.extend<BaseTestFixtures & TestFixtureOptions>({
  // --- Fixture option: per-describe environment override ---
  envName: ['', { option: true }],

  // --- Environment ---
  testEnv: async ({ envName }, use) => {
    const env = envName || process.env.ENV || 'sandbox';
    await use(new ConfigEnvironment(env));
  },

  // --- Legacy API client (backwards compatible) ---
  apiClient: async ({ testEnv, request }, use) => {
    await use(new BaseApiClient(request, testEnv));
  },

  // --- Typed API clients ---
  api: async ({ testEnv, request }, use) => {
    await use({
      application: new ApplicationClient(request, testEnv),
      invoice: new InvoiceClient(request, testEnv),
      lead: new LeadClient(request, testEnv),
      settlement: new SettlementClient(request, testEnv),
      creditCard: new CreditCardClient(request, testEnv),
      scheduledTask: new ScheduledTaskClient(request, testEnv),
      merchant: new MerchantClient(request, testEnv),
      account: new AccountClient(request, testEnv),
      paymentArrangement: new PaymentArrangementClient(request, testEnv),
    });
  },

  // --- Database ---
  db: async ({ testEnv }, use) => {
    const db = new DatabaseHelpers(testEnv.dbConnectionString);
    await use(db);
    await db.close();
  },

  // --- Email (IMAP) ---
  email: async ({ testEnv }, use) => {
    await use(new EmailHelpers({
      user: testEnv.email,
      password: testEnv.emailPassword,
    }));
  },

  // --- Test context (shared state) ---
  ctx: async ({}, use) => {
    await use({
      leadPk: '',
      leadUuid: '',
      accountPk: '',
      accountNumber: '',
      contractStatus: '',
      contractUrl: '',
      websiteAccountPk: '',
      achAdded: 0,
      ccAdded: 0,
      reportKeys: new Map(),
    });
  },

  // --- Console log capture ---
  consoleLogs: async ({ page }, use, testInfo) => {
    // Only capture for E2E tests that have a page
    let getLogs: () => string[] = () => [];
    if (page) {
      getLogs = captureConsoleLogs(page);
    }
    await use(getLogs);
  },

  // --- Auto-hooks via page fixture override ---
  page: async ({ page }, use, testInfo) => {
    // BEFORE: disable animations and set up page
    await disableCssAnimations(page);

    // Run the test
    await use(page);

    // AFTER: attach artifacts on failure
    await attachScreenshotOnFailure(page, testInfo);
    await attachTestMetadata(testInfo, {
      env: process.env.ENV || 'sandbox',
      url: page.url(),
    });
  },
});

export { expect } from '@playwright/test';
export { waitForPageReady };

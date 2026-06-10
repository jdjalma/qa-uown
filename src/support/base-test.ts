/**
 * Base Test
 *
 * Unified test fixture that combines:
 *  - Environment configuration (ConfigEnvironment)
 *  - API clients (ApplicationClient, InvoiceClient, etc.)
 *  - Database helpers (DatabaseHelpers) — worker-scoped (one pg pool per parallel worker)
 *  - Email helpers (EmailHelpers) — worker-scoped (one IMAP connection per parallel worker)
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
import { ApplicationClient } from '../api/clients/application.client.js';
import { InvoiceClient } from '../api/clients/invoice.client.js';
import { LeadClient } from '../api/clients/lead.client.js';
import { SettlementClient } from '../api/clients/settlement.client.js';
import { CreditCardClient } from '../api/clients/credit-card.client.js';
import { ScheduledTaskClient } from '../api/clients/scheduled-task.client.js';
import { MerchantClient } from '../api/clients/merchant.client.js';
import { AccountClient } from '../api/clients/account.client.js';
import { PaymentArrangementClient } from '../api/clients/payment-arrangement.client.js';
import { SvcPayoffClient } from '../api/clients/svc-payoff.client.js';
import { SvcPhoneClient } from '../api/clients/svc-phone.client.js';
import { SvcEmailClient } from '../api/clients/svc-email.client.js';
import { SvcContactClient } from '../api/clients/svc-contact.client.js';
import { AmsClient } from '../api/clients/ams.client.js';
import { LosPartnerAuthClient } from '../api/clients/los-partner-auth.client.js';
import { LosPartnerApplicationClient } from '../api/clients/los-partner-application.client.js';
import { SeonClient } from '../api/clients/seon.client.js';
import { BankAccountClient } from '../api/clients/bank-account.client.js';
import { CustomersClient } from '../api/clients/customers.client.js';
import { GowSignTemplateClient } from '../api/clients/gowsign-template.client.js';
import { CorrespondenceClient } from '../api/clients/correspondence.client.js';
import { TmsAuditClient } from '../api/clients/tms-audit.client.js';
import { TmsPaymentClient } from '../api/clients/tms-payment.client.js';
import { StickyRecoverClient } from '../api/clients/sticky-recover.client.js';
import { SimpleSearchClient } from '../api/clients/simple-search.client.js';
import { MerchantConfigurator } from './merchant-configurator.js';
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
  /** GowSign/SignWell iframe URL captured from submitApplication response (when submitPaymentInfoViaApi=true). */
  embeddedSigningUrl?: string;
  /** Provider chosen by backend routing — 'GOWSIGN' | 'SIGNWELL'. */
  esignClient?: string;
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
  svcPayoff: SvcPayoffClient;
  svcPhone: SvcPhoneClient;
  svcEmail: SvcEmailClient;
  svcContact: SvcContactClient;
  ams: AmsClient;
  losPartnerAuth: LosPartnerAuthClient;
  losPartnerApplication: LosPartnerApplicationClient;
  seon: SeonClient;
  bankAccount: BankAccountClient;
  customers: CustomersClient;
  gowSignTemplate: GowSignTemplateClient;
  correspondence: CorrespondenceClient;
  tmsAudit: TmsAuditClient;
  tmsPayment: TmsPaymentClient;
  stickyRecover: StickyRecoverClient;
  simpleSearch: SimpleSearchClient;
}

export interface TestFixtureOptions {
  envName: string;
}

/** Test-scoped fixtures (re-created per test). */
export interface BaseTestFixtures {
  testEnv: ConfigEnvironment;
  api: ApiClients;
  merchantConfig: MerchantConfigurator;
  ctx: TestContext;
  consoleLogs: () => string[];
}

/**
 * Worker-scoped fixtures (shared across all tests in a parallel worker).
 * `db` and `email` are expensive to create — a single connection per worker
 * avoids per-test pg pool and IMAP session overhead.
 *
 * NOTE: These fixtures read ENV directly from process.env at worker startup.
 * If you use `test.use({ envName })` to target a different environment in one
 * describe block, `db` and `email` still connect to the global ENV. This is
 * intentional — DB validation queries always run against the same env as API calls.
 */
export interface BaseWorkerFixtures {
  db: DatabaseHelpers;
  email: EmailHelpers;
}

// ── Test Extension ──────────────────────────────────────────────────

export const test = base.extend<BaseTestFixtures & TestFixtureOptions, BaseWorkerFixtures>({
  // --- Worker-scoped: Database ---
  // One pg connection pool per parallel worker — not torn down between tests.
  db: [async ({}, use) => {
    const env = process.env.ENV || 'sandbox';
    const cfg = new ConfigEnvironment(env);
    const db = new DatabaseHelpers(cfg.dbConnectionString);
    await use(db);
    await db.close();
  }, { scope: 'worker' }],

  // --- Worker-scoped: Email (IMAP) ---
  // One IMAP session per parallel worker — avoids repeated auth handshakes.
  email: [async ({}, use) => {
    const env = process.env.ENV || 'sandbox';
    const cfg = new ConfigEnvironment(env);
    await use(new EmailHelpers({
      user: cfg.email,
      password: cfg.emailPassword,
    }));
  }, { scope: 'worker' }],

  // --- Fixture option: per-describe environment override ---
  envName: ['', { option: true }],

  // --- Environment ---
  testEnv: async ({ envName }, use) => {
    const env = envName || process.env.ENV || 'sandbox';
    await use(new ConfigEnvironment(env));
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
      svcPayoff: new SvcPayoffClient(request, testEnv),
      svcPhone: new SvcPhoneClient(request, testEnv),
      svcEmail: new SvcEmailClient(request, testEnv),
      svcContact: new SvcContactClient(request, testEnv),
      ams: new AmsClient(request, testEnv),
      losPartnerAuth: new LosPartnerAuthClient(request, testEnv),
      losPartnerApplication: new LosPartnerApplicationClient(request, testEnv),
      seon: new SeonClient(request, testEnv),
      bankAccount: new BankAccountClient(request, testEnv),
      customers: new CustomersClient(request, testEnv),
      gowSignTemplate: new GowSignTemplateClient(request, testEnv),
      correspondence: new CorrespondenceClient(request, testEnv),
      tmsAudit: new TmsAuditClient(request, testEnv),
      tmsPayment: new TmsPaymentClient(request, testEnv),
      stickyRecover: new StickyRecoverClient(request, testEnv),
      simpleSearch: new SimpleSearchClient(request, testEnv),
    });
  },

  // --- Merchant configurator (setup/teardown via API) ---
  merchantConfig: async ({ api }, use) => {
    const configurator = new MerchantConfigurator(api.merchant);
    await use(configurator);
    await configurator.restoreAll();
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
  consoleLogs: async ({ page }, use) => {
    // Only capture for E2E tests that have a page
    let getLogs: () => string[] = () => [];
    if (page) {
      getLogs = captureConsoleLogs(page);
    }
    await use(getLogs);
  },

  // --- Auto-hooks via page fixture override ---
  page: async ({ page, testEnv }, use, testInfo) => {
    // BEFORE: disable animations and set up page
    await disableCssAnimations(page);

    // Run the test
    await use(page);

    // AFTER: attach artifacts on failure
    await attachScreenshotOnFailure(page, testInfo);
    await attachTestMetadata(testInfo, {
      env: testEnv.env,
      url: page.url(),
    });
  },
});

export { expect } from '@playwright/test';
export { waitForPageReady };

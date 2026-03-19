import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import {
  DESKTOP_CHROME,
  DESKTOP_CHROME_HEADLESS,
  DESKTOP_FIREFOX,
  DESKTOP_SAFARI,
  IPHONE_12_PRO,
  PIXEL_5,
  IPAD_PRO,
  isCI,
} from './src/support/browser-factory.js';
import { testConfig } from './src/support/config.js';

const env = testConfig.env;
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`), override: true });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const browserProfile = isCI() ? DESKTOP_CHROME_HEADLESS : DESKTOP_CHROME;

export default defineConfig({
  globalSetup: './src/support/global-setup.ts',
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: testConfig.ci,
  retries: testConfig.retries,
  workers: testConfig.workers,
  timeout: testConfig.timeout,

  reporter: [
    ['html', { open: 'never', outputFolder: 'reports/html' }],
    ['list'],
    ['./src/support/custom-reporter.ts', { outputDir: 'reports' }],
    ...(testConfig.allureEnabled ? [['allure-playwright', { outputFolder: 'reports/allure-results' }] as const] : []),
  ],

  outputDir: 'reports/test-results',

  // Global assertion timeout: applies to all expect(...).toBeVisible() etc.
  // Higher than Playwright's default (5 s) to accommodate slow fintech pages.
  expect: { timeout: 5_000 },

  use: {
    // baseURL is intentionally omitted at the global level — each project defines its own.
    // Setting a global baseURL here would silently override projects that forget to set it.
    trace: testConfig.trace,
    screenshot: testConfig.screenshots,
    video: testConfig.video,
    actionTimeout: testConfig.actionTimeout,
    navigationTimeout: testConfig.navigationTimeout,
    ignoreHTTPSErrors: true,
    launchOptions: browserProfile.launchOptions,
    ...browserProfile.contextOptions,
  },

  projects: [
    // ── Auth Setup ────────────────────────────────────────────────
    {
      name: 'auth-origination',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.ORIGINATION_URL,
      },
    },
    {
      name: 'auth-servicing',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.SERVICING_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  CROSS-PORTAL — tests spanning multiple portals (tests/e2e/ root)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'cross-portal',
      testDir: './tests/e2e',
      testIgnore: ['origination/**', 'servicing/**', 'website/**', 'ams/**'],
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.ORIGINATION_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  DESKTOP — Chrome (default)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'origination-ui',
      testDir: './tests/e2e/origination',
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.ORIGINATION_URL,
        storageState: '.auth/origination.json',
      },
      dependencies: ['auth-origination'],
    },
    {
      name: 'servicing-ui',
      testDir: './tests/e2e/servicing',
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.SERVICING_URL,
        storageState: '.auth/servicing.json',
      },
      dependencies: ['auth-servicing'],
    },
    {
      name: 'website-ui',
      testDir: './tests/e2e/website',
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.WEBSITE_URL,
      },
    },
    {
      name: 'ams-ui',
      testDir: './tests/e2e/ams',
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.AMS_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  DESKTOP — Firefox (cross-browser)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'website-firefox',
      testDir: './tests/e2e/website',
      use: {
        ...DESKTOP_FIREFOX.contextOptions,
        baseURL: process.env.WEBSITE_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  DESKTOP — Safari / WebKit (cross-browser)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'website-webkit',
      testDir: './tests/e2e/website',
      use: {
        ...DESKTOP_SAFARI.contextOptions,
        baseURL: process.env.WEBSITE_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  MOBILE — iPhone 12 Pro (iOS / WebKit)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'website-mobile-ios',
      testDir: './tests/e2e/website',
      use: {
        ...IPHONE_12_PRO.contextOptions,
        baseURL: process.env.WEBSITE_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  MOBILE — Pixel 5 (Android / Chromium)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'website-mobile-android',
      testDir: './tests/e2e/website',
      use: {
        ...PIXEL_5.contextOptions,
        baseURL: process.env.WEBSITE_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  TABLET — iPad Pro 11
    // ════════════════════════════════════════════════════════════════
    {
      name: 'website-tablet',
      testDir: './tests/e2e/website',
      use: {
        ...IPAD_PRO.contextOptions,
        baseURL: process.env.WEBSITE_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  API-Only Tests (no browser)
    // ════════════════════════════════════════════════════════════════
    {
      name: 'api-only',
      testDir: './tests/api',
      use: {
        baseURL: process.env.SERVICING_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  CI Tests — Critical path tests for CI/CD pipeline
    // ════════════════════════════════════════════════════════════════
    {
      name: 'ci-tests',
      testDir: './tests/ci',
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.ORIGINATION_URL,
      },
    },

    // ════════════════════════════════════════════════════════════════
    //  Task Testing — tests from tracked GitLab issues
    // ════════════════════════════════════════════════════════════════
    {
      name: 'task-testing',
      testDir: './tests/taskTestingUown',
      use: {
        ...browserProfile.contextOptions,
        baseURL: process.env.ORIGINATION_URL,
      },
    },
  ],
});

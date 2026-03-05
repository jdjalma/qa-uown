/**
 * Browser / Driver Factory
 *
 * Centralized browser configuration profiles for E2E tests.
 * Migrated from Browser.java in fintech-qaautomation which managed
 * WebDriver initialization, proxy setup, and device emulation.
 *
 * In Playwright, browser management is handled by the config, but this
 * factory provides reusable device/viewport profiles and launch options
 * that can be applied per-project or per-test.
 *
 * Multi-device strategy (inspired by ui-softex):
 *  - Desktop: Chrome, Firefox, Safari (cross-browser coverage)
 *  - Mobile:  iPhone 12 Pro (iOS), Pixel 5 (Android)
 *  - Tablet:  iPad Pro 11
 *
 * Each test project in playwright.config.ts references a profile from here.
 */
import { type LaunchOptions, type BrowserContextOptions, devices } from '@playwright/test';

export interface BrowserProfile {
  name: string;
  launchOptions: LaunchOptions;
  contextOptions: BrowserContextOptions;
}

// ── Shared defaults ──────────────────────────────────────────────────

const SHARED_CONTEXT: Partial<BrowserContextOptions> = {
  locale: 'en-US',
  timezoneId: 'America/New_York',
  ignoreHTTPSErrors: true,
  acceptDownloads: true,
};

// ── Desktop Profiles ─────────────────────────────────────────────────

/**
 * Desktop Chrome - default profile for origination/servicing/AMS portals.
 * Mirrors the Java project's Chrome setup with automation flags.
 */
export const DESKTOP_CHROME: BrowserProfile = {
  name: 'Desktop Chrome',
  launchOptions: {
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-notifications',
      '--no-first-run',
      '--disable-gpu',
      '--process-per-site',
      '--window-position=0,0',
      '--window-size=1920,1080',
    ],
  },
  contextOptions: {
    ...SHARED_CONTEXT,
    userAgent: devices['Desktop Chrome'].userAgent,
    viewport: null, // null lets --window-size control the viewport
  },
};

/**
 * Desktop Chrome in headless mode - for CI/CD pipelines.
 */
export const DESKTOP_CHROME_HEADLESS: BrowserProfile = {
  name: 'Desktop Chrome Headless',
  launchOptions: {
    ...DESKTOP_CHROME.launchOptions,
    headless: true,
  },
  contextOptions: {
    ...DESKTOP_CHROME.contextOptions,
    viewport: { width: 1366, height: 900 }, // Explicit viewport for headless (prevents responsive/mobile layout)
  },
};

/**
 * Desktop Firefox - cross-browser coverage.
 */
export const DESKTOP_FIREFOX: BrowserProfile = {
  name: 'Desktop Firefox',
  launchOptions: {},
  contextOptions: {
    ...devices['Desktop Firefox'],
    ...SHARED_CONTEXT,
  },
};

/**
 * Desktop Safari (WebKit) - cross-browser coverage.
 */
export const DESKTOP_SAFARI: BrowserProfile = {
  name: 'Desktop Safari',
  launchOptions: {},
  contextOptions: {
    ...devices['Desktop Safari'],
    ...SHARED_CONTEXT,
  },
};

// ── Mobile Profiles ──────────────────────────────────────────────────

/**
 * iPhone 12 Pro - iOS mobile emulation (WebKit engine).
 */
export const IPHONE_12_PRO: BrowserProfile = {
  name: 'iPhone 12 Pro',
  launchOptions: {},
  contextOptions: {
    ...devices['iPhone 12 Pro'],
    ...SHARED_CONTEXT,
    acceptDownloads: false,
  },
};

/**
 * Pixel 5 - Android mobile emulation (Chromium engine).
 */
export const PIXEL_5: BrowserProfile = {
  name: 'Pixel 5',
  launchOptions: {},
  contextOptions: {
    ...devices['Pixel 5'],
    ...SHARED_CONTEXT,
    acceptDownloads: false,
  },
};

/**
 * Galaxy S24 - Samsung Android mobile emulation (Chromium engine).
 */
export const GALAXY_S24: BrowserProfile = {
  name: 'Galaxy S24',
  launchOptions: {},
  contextOptions: {
    ...devices['Galaxy S24'],
    ...SHARED_CONTEXT,
    acceptDownloads: false,
  },
};

// ── Tablet Profiles ──────────────────────────────────────────────────

/**
 * iPad Pro 11 - tablet emulation for responsive tests.
 */
export const IPAD_PRO: BrowserProfile = {
  name: 'iPad Pro 11',
  launchOptions: {},
  contextOptions: {
    ...devices['iPad Pro 11'],
    ...SHARED_CONTEXT,
  },
};

// ── Profile Registry ─────────────────────────────────────────────────

/**
 * All available browser profiles, keyed by a short name.
 */
export const BROWSER_PROFILES: Record<string, BrowserProfile> = {
  'chrome': DESKTOP_CHROME,
  'chrome-headless': DESKTOP_CHROME_HEADLESS,
  'firefox': DESKTOP_FIREFOX,
  'safari': DESKTOP_SAFARI,
  'iphone': IPHONE_12_PRO,
  'pixel': PIXEL_5,
  'samsung': GALAXY_S24,
  'ipad': IPAD_PRO,
};

/**
 * Returns a browser profile by name.
 * Falls back to Desktop Chrome if the name is not found.
 */
export function getBrowserProfile(name: string): BrowserProfile {
  return BROWSER_PROFILES[name.toLowerCase()] ?? DESKTOP_CHROME;
}

/**
 * Builds context options for a given viewport size.
 * Useful for ad-hoc viewport testing without a full profile.
 */
export function buildViewportOptions(width: number, height: number): BrowserContextOptions {
  return {
    ...SHARED_CONTEXT,
    viewport: { width, height },
  };
}

/**
 * Utility to detect if running in CI/CD environment.
 */
export function isCI(): boolean {
  return !!process.env.CI || !!process.env.GITHUB_ACTIONS || !!process.env.JENKINS_URL;
}

/**
 * Returns the recommended browser profile based on the environment.
 * CI/CD -> headless, local -> headed.
 */
export function getDefaultProfile(): BrowserProfile {
  return isCI() ? DESKTOP_CHROME_HEADLESS : DESKTOP_CHROME;
}

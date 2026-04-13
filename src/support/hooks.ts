/**
 * E2E Test Hooks
 *
 * Lifecycle hooks for Playwright E2E tests, migrated from
 * CommonSteps.java @Before / @After hooks in the legacy Java/Cucumber project.
 *
 * Provides:
 *  - CSS animation disabling for faster, deterministic tests
 *  - Console log capture for debugging
 *  - Screenshot on failure (attached to report)
 *  - Test metadata tracking (timing, environment)
 *  - Automatic cleanup
 */
import { type Page, type TestInfo } from '@playwright/test';
import { waitForSpinner } from '../helpers/common.helpers.js';

const DISABLE_ANIMATIONS_STYLE = `
  *, *::before, *::after {
    animation-duration: 0.01s !important;
    animation-delay: 0s !important;
    transition-duration: 0.01s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
`;

/**
 * Disables CSS animations and transitions on the page for faster, flake-free tests.
 * Equivalent to the Java project's disableCssAnimations() hook.
 */
export async function disableCssAnimations(page: Page): Promise<void> {
  try {
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_STYLE });
  } catch {
    // Context may be destroyed during navigation — retry after load
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await page.addStyleTag({ content: DISABLE_ANIMATIONS_STYLE }).catch(() => {});
  }
}

/**
 * Captures browser console messages and attaches them to the test report on failure.
 * Call this in a beforeEach hook to start capturing.
 * Returns a function to retrieve collected messages.
 */
export function captureConsoleLogs(page: Page): () => string[] {
  const logs: string[] = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      logs.push(`[${type.toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    logs.push(`[PAGE_ERROR] ${error.message}`);
  });

  return () => [...logs];
}

/**
 * Attaches a full-page screenshot to the test report.
 * Intended for afterEach hooks on failure.
 */
export async function attachScreenshotOnFailure(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
    if (screenshot) {
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  }
}

/**
 * Attaches captured console logs to the test report on failure.
 */
export async function attachConsoleLogsOnFailure(
  testInfo: TestInfo,
  getLogs: () => string[],
): Promise<void> {
  if (testInfo.status !== testInfo.expectedStatus) {
    const logs = getLogs();
    if (logs.length > 0) {
      await testInfo.attach('console-logs', {
        body: logs.join('\n'),
        contentType: 'text/plain',
      });
    }
  }
}

/**
 * Attaches test timing and environment metadata to the report.
 */
export async function attachTestMetadata(
  testInfo: TestInfo,
  metadata: Record<string, string>,
): Promise<void> {
  const data = {
    ...metadata,
    testTitle: testInfo.title,
    project: testInfo.project.name,
    status: testInfo.status ?? 'unknown',
    duration: `${testInfo.duration}ms`,
    retries: `${testInfo.retry}/${testInfo.project.retries}`,
  };

  await testInfo.attach('test-metadata', {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json',
  });
}

/**
 * Waits for the page to reach a stable, loaded state.
 * Combines networkidle + spinner wait for fintech portals.
 * Delegates to the single waitForSpinner implementation in common.helpers.
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await waitForSpinner(page);
}

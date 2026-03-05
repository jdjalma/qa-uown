/**
 * Test Artifact Helpers
 *
 * Utilities for attaching data to Playwright test reports.
 */
import { test } from '@playwright/test';

/**
 * Attaches a JSON object to the current test report.
 * Useful for debugging — shows up in the Playwright HTML report.
 */
export async function attachJson(name: string, data: unknown): Promise<void> {
  await test.info().attach(name, {
    body: JSON.stringify(data, null, 2),
    contentType: 'text/plain',
  });
}

/**
 * Route Intercept Helpers
 *
 * Intercepts browser requests to public UOWN URLs and redirects them to
 * internal cluster URLs when running in CI (Kubernetes runner).
 *
 * Problem: React SPAs loaded via internal cluster URLs make AJAX calls to
 * public URLs (hardcoded in the frontend build). The WAF blocks these
 * requests from the CI runner's IP, causing the SPA to fail to render.
 *
 * Solution: Use Playwright's page.route() to intercept these requests and
 * redirect them to the corresponding internal cluster service URLs.
 */
import type { Page } from '@playwright/test';
import type { ConfigEnvironment } from '@config/index.js';

interface UrlMapping {
  publicPattern: RegExp;
  internalUrl: string;
}

/**
 * Builds URL mappings from the current environment config.
 * Only creates mappings when the configured URL is an internal cluster URL
 * (i.e., differs from the default public URL pattern).
 */
function buildUrlMappings(env: ConfigEnvironment): UrlMapping[] {
  const envName = env.env;
  const mappings: UrlMapping[] = [];

  // SVC API: svc-{env}.uownleasing.com → internal
  const defaultSvcApi = `https://svc-${envName}.uownleasing.com`;
  if (env.svcApiUrl !== defaultSvcApi) {
    mappings.push({
      publicPattern: new RegExp(`https://svc-${envName}\\.uownleasing\\.com`),
      internalUrl: env.svcApiUrl,
    });
  }

  // Origination: origination-{env}.uownleasing.com → internal
  const defaultOrigination = `https://origination-${envName}.uownleasing.com/`;
  if (env.originationUrl !== defaultOrigination) {
    mappings.push({
      publicPattern: new RegExp(`https://origination-${envName}\\.uownleasing\\.com`),
      internalUrl: env.originationUrl.replace(/\/$/, ''),
    });
  }

  // Servicing: svc-website-{env}.uownleasing.com → internal
  const defaultServicing = `https://svc-website-${envName}.uownleasing.com/`;
  if (env.servicingUrl !== defaultServicing) {
    mappings.push({
      publicPattern: new RegExp(`https://svc-website-${envName}\\.uownleasing\\.com`),
      internalUrl: env.servicingUrl.replace(/\/$/, ''),
    });
  }

  // Website: website-{env}.uownleasing.com → internal
  const defaultWebsite = `https://website-${envName}.uownleasing.com/`;
  if (env.websiteUrl !== defaultWebsite) {
    mappings.push({
      publicPattern: new RegExp(`https://website-${envName}\\.uownleasing\\.com`),
      internalUrl: env.websiteUrl.replace(/\/$/, ''),
    });
  }

  return mappings;
}

/**
 * Sets up route interception on a Playwright page to redirect public UOWN
 * URLs to internal cluster URLs. Only activates when internal URLs are
 * configured (via {ENV}_*_URL environment variables).
 *
 * Call this once per page, before navigating to any UOWN portal.
 *
 * @example
 * ```typescript
 * await setupRouteIntercept(page, env);
 * await page.goto(env.originationUrl); // works with internal URL
 * ```
 */
export async function setupRouteIntercept(page: Page, env: ConfigEnvironment): Promise<void> {
  const mappings = buildUrlMappings(env);

  if (mappings.length === 0) return; // No internal URLs configured — nothing to intercept

  await page.route('**/*.uownleasing.com/**', async (route) => {
    const originalUrl = route.request().url();

    for (const mapping of mappings) {
      if (mapping.publicPattern.test(originalUrl)) {
        const newUrl = originalUrl.replace(mapping.publicPattern, mapping.internalUrl);
        await route.continue({ url: newUrl });
        return;
      }
    }

    // No mapping matched — continue with original URL
    await route.continue();
  });
}

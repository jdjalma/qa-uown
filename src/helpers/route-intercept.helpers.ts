/**
 * Route Intercept Helpers
 *
 * Intercepts browser API requests from React SPAs loaded via internal
 * cluster URLs and redirects them to the correct backend service.
 *
 * Problem: The internal Origination/Servicing/Website Kubernetes services
 * are frontend-only (nginx serving React). They don't have API endpoints.
 * When the React app makes API calls using relative URLs (same origin),
 * those calls hit the frontend service and return 404/401/403.
 *
 * Solution: Use Playwright's page.route() to intercept API calls from
 * the frontend service and redirect them to the SVC API backend service.
 *
 * Example flow:
 *   1. Browser loads: http://uown-sandbox-uown-origination.../customers/123
 *   2. React calls:   POST http://uown-sandbox-uown-origination.../getCustomerInformation
 *   3. page.route() intercepts → redirects to: http://uown-sandbox-svc.../getCustomerInformation
 *   4. SVC API responds → React renders correctly
 */
import type { Page } from '@playwright/test';
import type { ConfigEnvironment } from '@config/index.js';

/** Known API path prefixes used by the UOWN React frontends. */
const API_PATH_PATTERNS = [
  '/uown/',
  '/getCustomerInformation',
  '/getLeadFilterOptions',
  '/getLeadsInDateRange',
  '/getAllClientTypes',
  '/getLocationNamesByMerchant',
  '/users-on-page',
  '/api/',
];

/**
 * Checks if a URL path looks like an API call (not a static asset or page navigation).
 */
function isApiCall(url: string): boolean {
  const path = new URL(url).pathname;
  return API_PATH_PATTERNS.some(pattern => path.startsWith(pattern) || path.includes(pattern));
}

/**
 * Checks if a URL is an internal cluster URL (.svc.cluster.local).
 */
function isInternalUrl(url: string): boolean {
  return url.includes('.svc.cluster.local');
}

/**
 * Sets up route interception on a Playwright page to redirect API calls
 * from frontend-only internal services to the SVC API backend.
 *
 * Only activates when internal URLs are configured (detected by
 * .svc.cluster.local in the portal URLs).
 *
 * @example
 * ```typescript
 * await setupRouteIntercept(page, env);
 * await page.goto(env.originationUrl); // React API calls get redirected
 * ```
 */
export async function setupRouteIntercept(page: Page, env: ConfigEnvironment): Promise<void> {
  // Only activate when using internal cluster URLs
  const portalUrls = [env.originationUrl, env.servicingUrl, env.websiteUrl];
  const hasInternalPortals = portalUrls.some(url => isInternalUrl(url));

  if (!hasInternalPortals) return;

  const svcApiBase = env.svcApiUrl.replace(/\/$/, '');

  // Build list of internal frontend origins to intercept
  const internalOrigins = portalUrls
    .filter(url => isInternalUrl(url))
    .map(url => {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}`;
    });

  // Intercept all requests to internal cluster URLs
  await page.route('**/*.svc.cluster.local/**', async (route) => {
    const request = route.request();
    const originalUrl = request.url();
    const method = request.method();

    // Only intercept API calls, not page navigations or static assets
    if (method === 'GET' && request.resourceType() === 'document') {
      await route.continue();
      return;
    }

    // Check if this is an API call from a frontend service
    const isFromFrontend = internalOrigins.some(origin => originalUrl.startsWith(origin));

    if (isFromFrontend && isApiCall(originalUrl)) {
      // Replace the frontend origin with the SVC API origin
      const parsed = new URL(originalUrl);
      const frontendOrigin = `${parsed.protocol}//${parsed.host}`;
      const newUrl = originalUrl.replace(frontendOrigin, svcApiBase);

      console.log(`[RouteIntercept] ${method} ${parsed.pathname} → ${svcApiBase}`);
      await route.continue({ url: newUrl });
      return;
    }

    await route.continue();
  });
}

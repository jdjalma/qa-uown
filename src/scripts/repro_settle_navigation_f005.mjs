// Reproduce the EXACT test navigation pattern from svc#530 spec.ts:485-489.
// Test does: page.goto(`customers/{leadPk}`, { waitUntil: 'domcontentloaded' })
//            → customerPage.waitForSpinner()
//            → settleLeaseViaDocuments() → first action is locator with timeout 30s
// Question: does the Lease header appear within 30s after goto+waitForSpinner?
import { chromium } from 'playwright';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const AUTH_FILE = path.join(ROOT, '.auth', 'origination.json');
const BASE_URL = 'https://origination-qa1.uownleasing.com';

const CANDIDATES = [
  { axis: 'UOWN-Daniels-Wk13-SIGNED-CT06-equiv', leadPk: '11846' },
  { axis: 'KS3015-SIGNED-CT07-equiv',             leadPk: '11852' },
  { axis: 'KS3015-baseline-11839',                leadPk: '11839' },
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  storageState: AUTH_FILE,
  viewport: { width: 1440, height: 900 },
});

for (const c of CANDIDATES) {
  console.log(`\n>>> ${c.axis}  (lead ${c.leadPk}) — fresh page, NO root-boot`);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });
  page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message.slice(0, 150)));

  // EXACT pattern from test
  const t0 = Date.now();
  await page.goto(`${BASE_URL}/customers/${c.leadPk}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const t1 = Date.now();
  console.log(`  goto: ${t1 - t0}ms  url=${page.url()}  title=${await page.title()}`);

  // Mimic waitForSpinner — check spinner-border absence within 30s
  await page.waitForSelector('.spinner-border, .spinner-grow', { state: 'detached', timeout: 30_000 }).catch(() => {});
  console.log(`  spinner gone @ ${Date.now() - t0}ms`);

  // NOW poll for the Lease header — what the test does next:
  // `locator('[class*="documentsItemHeader__"]').filter({ hasText: /Lease/i }).first()` waitFor visible 30s
  const lease = page.locator('[class*="customer-info-panels_documentsItemHeader__"]').filter({ hasText: /Lease/i }).first();
  let foundAt = null;
  try {
    await lease.waitFor({ state: 'visible', timeout: 30_000 });
    foundAt = Date.now() - t0;
    console.log(`  Lease header VISIBLE @ ${foundAt}ms ✅`);
  } catch (e) {
    console.log(`  Lease header NOT FOUND after 30s — taking probe`);
    const probe = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      bodyTextHead: (document.body?.innerText || '').slice(0, 300),
      docItemHeaderCount: document.querySelectorAll('[class*="documentsItemHeader"]').length,
      cardBodyCount: document.querySelectorAll('.card-body').length,
      anyDocsItemHeaderClasses: Array.from(document.querySelectorAll('[class*="documentsItemHeader"]')).map(e => ({ cls: e.className.slice(0,80), text: (e.textContent||'').slice(0,40) })),
      hasLogin: !!document.querySelector('input[type="password"]'),
    }));
    console.log('  probe:', JSON.stringify(probe, null, 2));
  }
  console.log(`  errors during run (first 5): ${errors.slice(0,5).join(' || ')}`);
  await page.close();
}

await browser.close();

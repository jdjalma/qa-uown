import { chromium } from 'playwright';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const AUTH_FILE = path.join(ROOT, '.auth', 'origination.json');
const BASE_URL = 'https://origination-qa1.uownleasing.com';
const USER = 'manager';
const PASS = 'P@ssw0rdu0wn';

const CANDIDATES = [
  { axis: 'BASELINE-v4-KS3015-lead11839', leadPk: '11839' },
  { axis: 'E-UOWN-Daniels-WK13-SIGNED',   leadPk: '11846' },
  { axis: 'C-KS3015-WK13-fresh-SIGNED',   leadPk: '11852' },
  { axis: 'B-UOWN-NPDpop-Griffins-WK13',  leadPk: '11103' },
  { axis: 'D-FUNDING-Daniels-acct4824',   leadPk: '11844' },
];

const browser = await chromium.launch({ headless: true });
let ctx = await browser.newContext({
  storageState: AUTH_FILE,
  viewport: { width: 1440, height: 900 },
});
let page = await ctx.newPage();

console.log('Booting at root...');
await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30_000 });
await page.waitForTimeout(2000);
const title1 = await page.title();
console.log('Booted. url=', page.url(), 'title=', title1);

// If saw login, re-auth
const isLogin = await page.locator('input[type="password"]').first().isVisible({ timeout: 3000 }).catch(() => false);
if (isLogin) {
  console.log('Auth expired — re-authenticating...');
  await page.locator('input[type="email"], input[name*="email"]').first().fill(USER);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('button:has-text("LOG IN"), button:has-text("Login"), button:has-text("Log in")').first().click();
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await page.waitForTimeout(3000);
  console.log('Re-auth done. url=', page.url(), 'title=', await page.title());
  await ctx.storageState({ path: AUTH_FILE });
  console.log('Saved fresh storage state.');
}

const PROBE_FN = () => {
  const allHeaders = Array.from(document.querySelectorAll('[class*="documentsItemHeader"]'));
  const cardBodies = Array.from(document.querySelectorAll('.card-body'));
  if (allHeaders.length === 0) {
    return {
      panelsCount: 0,
      url: location.href,
      title: document.title,
      cardBodyCount: cardBodies.length,
      cardBodyHeads: cardBodies.slice(0, 12).map(c => {
        const firstChild = c.firstElementChild;
        return firstChild ? {
          tag: firstChild.tagName,
          text: (firstChild.textContent || '').trim().slice(0, 60),
          cls: (firstChild.className || '').slice(0, 100),
        } : { empty: true };
      }),
    };
  }
  return {
    panelsCount: allHeaders.length,
    url: location.href,
    title: document.title,
    panels: allHeaders.map(h => {
      const sib = h.nextElementSibling;
      const buttons = sib ? sib.querySelectorAll('button[class*="contractItem__titleButton__"]') : [];
      const allButtonsInSib = sib ? sib.querySelectorAll('button') : [];
      return {
        headerText: h.textContent ? h.textContent.trim() : '',
        leaseRegex: /Lease/i.test(h.textContent || ''),
        documentsRegex: /Documents/i.test(h.textContent || ''),
        contractRegex: /Contract/i.test(h.textContent || ''),
        cls: h.className,
        visible: h.offsetParent !== null,
        sibTag: sib ? sib.tagName : null,
        sibCls: sib ? (sib.className || '').slice(0, 120) : null,
        btnContractCount: buttons.length,
        btnAnyCount: allButtonsInSib.length,
        btnTexts: Array.from(buttons).map(b => (b.textContent || '').trim()),
      };
    }),
  };
};

const results = [];
for (const c of CANDIDATES) {
  console.log(`\n>>> ${c.axis} (lead ${c.leadPk})`);
  await page.goto(`${BASE_URL}/customers/${c.leadPk}`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(e => console.log('goto:', e.message));
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(4500);
  const probe = await page.evaluate(PROBE_FN).catch(e => ({ evalErr: e.message }));
  console.log(JSON.stringify(probe, null, 2));
  results.push({ ...c, probe });
}

console.log('\n\n===== CROSS-STATE SUMMARY =====');
for (const r of results) {
  if (r.probe.panels) {
    r.probe.panels.forEach((p, i) => {
      console.log(`${r.axis} | lead=${r.leadPk} | panel[${i}] | text="${p.headerText}" | leaseRX=${p.leaseRegex} | docsRX=${p.documentsRegex} | btnCount=${p.btnContractCount} | btns=${JSON.stringify(p.btnTexts)}`);
    });
  } else {
    console.log(`${r.axis} | lead=${r.leadPk} | NO PANELS | cardBodies=${r.probe.cardBodyCount} | url=${r.probe.url} | err=${r.probe.evalErr ?? ''}`);
  }
}

await browser.close();

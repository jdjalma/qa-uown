/**
 * TEMP DIAGNOSTIC — DOM inspection for refund-payment-servicing failure (CLAUDE.md #18).
 * Inspects the real Payment History + CC Transactions grids for the failing account.
 * DELETE after investigation.
 */
import { test } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { PaymentHistoryPage } from '@pages/servicing/index.js';
import { SELECTORS } from '../../../src/selectors/common.selectors.js';

const ACCOUNT_PK = process.env.DIAG_ACCOUNT_PK ?? '139';

test('DIAG: dump payment-history + cc-transactions DOM', async ({ page, testEnv }) => {
  test.setTimeout(180_000);
  await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');

  // ── Payment History grid — via the SAME path the page object uses (menu nav) ──
  const ph = new PaymentHistoryPage(page);
  await ph.navigateByUrl(testEnv.servicingUrl, ACCOUNT_PK);
  await page.waitForTimeout(1500);
  console.log('\n===== AFTER navigateByUrl (menu path) =====');
  {
    const r = page.locator(SELECTORS.paymentHistoryRows);
    const c = await r.count();
    console.log(`menu-path payment-history row count = ${c}`);
    for (let i = 0; i < c; i++) {
      console.log(`  menuPH row[${i}]: ${(await r.nth(i).textContent())?.replace(/\s+/g, ' ').trim()}`);
    }
  }

  // ── Payment History grid via DIRECT URL (control) ──
  await page.goto(`${testEnv.servicingUrl}/payment-history/${ACCOUNT_PK}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  console.log('\n===== PAYMENT-HISTORY URL =====');
  console.log('url=', page.url());

  const phRows = page.locator(SELECTORS.paymentHistoryRows);
  const phCount = await phRows.count();
  console.log(`payment-history .rdt_TableRow count = ${phCount}`);
  for (let i = 0; i < phCount; i++) {
    const t = (await phRows.nth(i).textContent())?.replace(/\s+/g, ' ').trim();
    console.log(`  PH row[${i}]: ${t}`);
  }

  const reverseIcons = page.locator(SELECTORS.paymentHistoryReverseIcon);
  console.log(`paymentHistoryReverseIcon (arrow-rotate-left) count = ${await reverseIcons.count()}`);

  // header text
  const headers = page.locator('div[role="columnheader"]');
  const hcount = await headers.count();
  const htexts: string[] = [];
  for (let i = 0; i < hcount; i++) htexts.push(((await headers.nth(i).textContent()) || '').trim());
  console.log(`payment-history headers: ${JSON.stringify(htexts)}`);

  // any svg icons present in the grid
  const allSvgs = page.locator('.rdt_TableRow svg');
  const svgCount = await allSvgs.count();
  console.log(`total svg icons inside rows = ${svgCount}`);
  const iconNames = new Set<string>();
  for (let i = 0; i < Math.min(svgCount, 40); i++) {
    const di = await allSvgs.nth(i).getAttribute('data-icon');
    if (di) iconNames.add(di);
  }
  console.log(`distinct data-icon in rows: ${JSON.stringify([...iconNames])}`);

  // body text snapshot (truncated)
  const bodyText = (await page.locator('body').textContent())?.replace(/\s+/g, ' ').trim() ?? '';
  console.log(`page contains "$100": ${bodyText.includes('$100')}  contains "100.00": ${bodyText.includes('100.00')}  contains "No records"/"no records": ${/no records/i.test(bodyText)}`);

  // ── CC Transactions grid ──
  await page.goto(`${testEnv.servicingUrl}/credit-card-history/${ACCOUNT_PK}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  console.log('\n===== CC-TRANSACTIONS URL =====');
  console.log('url=', page.url());
  const ccRows = page.locator(SELECTORS.tableRow);
  const ccCount = await ccRows.count();
  console.log(`cc .rdt_TableRow count = ${ccCount}`);
  for (let i = 0; i < ccCount; i++) {
    const t = (await ccRows.nth(i).textContent())?.replace(/\s+/g, ' ').trim();
    console.log(`  CC row[${i}]: ${t}`);
  }
  const ccReverse = page.locator(SELECTORS.paymentHistoryReverseIcon);
  console.log(`CC grid arrow-rotate-left count = ${await ccReverse.count()}`);

  // Map data-column-id -> text for the first CC row (verify implementer hypothesis
  // 9=Status, 13=CC Action, 3=Amount).
  console.log('\n===== CC ROW data-column-id MAP (row 0) =====');
  const firstRow = ccRows.first();
  const cells = firstRow.locator('[data-column-id]');
  const cc = await cells.count();
  for (let i = 0; i < cc; i++) {
    const id = await cells.nth(i).getAttribute('data-column-id');
    const txt = ((await cells.nth(i).textContent()) || '').replace(/\s+/g, ' ').trim();
    console.log(`  data-column-id="${id}" -> "${txt}"`);
  }
});

/**
 * S7 DISCOVERY (exploratory qa1 master) — Servicing checklist:
 *   signing/documents, sticky recover, protection plan, reverse-payment,
 *   account-sale, history dropdowns (PayNearMe / Email).
 *
 * UI-first (regra #15/#18): drives the REAL rendered Servicing portal (qa1) via
 * stable `page.goto(route)` + `page.evaluate` DOM extraction (the reliable
 * discovery path documented in memory `reference_dev3_discovery_workflow` —
 * MCP browser is unavailable this session). DB is read-only oracle via the
 * injected `db` fixture (no mutation — regra #9).
 *
 * Reference accounts (read-only, exploratory exception — regra #10):
 *   4452 — ACTIVE, DPD 58, WEEKLY, terraceFinance/NY, leadPk L10907
 *   3992 — ACTIVE, DPD 90, Progress Mobility/IL, protection plan COMPLETED
 *   4945 / 4946 — accounts with uown_sticky rows (sticky recover)
 *
 * NO business action is triggered (no signing fired, no reverse submitted) —
 * pure observation. Logs printed with [S7] prefix for the report.
 */
import { test, expect } from '@support/base-test.js';
import { loginToPortalWithOptions } from '@helpers/index.js';
import { dismissCustomerInfoConfirmation } from '../../../src/helpers/servicing-dialogs.helpers.js';

const ACC_REF = '4452';     // our terraceFinance account
const ACC_PP = '3992';      // protection plan COMPLETED
const ACC_STICKY_A = '4945';
const ACC_STICKY_B = '4946';

// DOM snapshot helper — extracts headings, buttons, links, tabs, table headers,
// and any text matching a probe set. Runs in-page (real render), stable across
// layout drift. Returns a compact JSON we log for the report.
const DOM_PROBE = `() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const take = (sel, attr) => Array.from(document.querySelectorAll(sel))
    .map(e => norm(attr ? e.getAttribute(attr) : e.textContent))
    .filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 60);
  const bodyText = norm(document.body.innerText || '');
  const has = (re) => re.test(bodyText);
  return {
    url: location.pathname + location.search,
    title: norm(document.title),
    h1h2: take('h1, h2, h3'),
    buttons: take('button'),
    links: take('a'),
    tabs: take('[role=tab], .nav-link, .nav-item'),
    tableHeaders: take('th, [role=columnheader]'),
    sidebar: take('.sidebar-item'),
    dropdownItems: take('.dropdown-item, [role=menuitem]'),
    flags: {
      reverseIcon: !!document.querySelector('svg[data-icon=\"arrow-rotate-left\"]'),
      accountSale: has(/account sale/i),
      protectionPlan: has(/protection plan/i),
      sticky: has(/sticky/i),
      payNearMe: has(/pay\\s*near\\s*me/i),
      noRecords: has(/no records to display/i),
      loginGate: has(/servicing login|sign in|login/i),
      cancelBtn: has(/\\bcancel\\b/i),
    },
  };
}`;

test.describe('S7 discovery — Servicing checklist (qa1, read-only)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('S7 Servicing: signing/documents, sticky, protection plan, reverse, account-sale, history', async ({ page, testEnv, db }) => {
    test.setTimeout(300_000);
    const base = testEnv.servicingUrl.replace(/\/$/, '');

    await test.step('Login Servicing (manager)', async () => {
      await loginToPortalWithOptions(page, testEnv.servicingUrl, testEnv, 'manager');
      await page.waitForLoadState('domcontentloaded');
      console.log(`[S7][login] url=${page.url()}`);
    });

    // ── Item 1: Documents tab + signing context (account 4452) ────────────
    await test.step('Documents tab — account 4452', async () => {
      await page.goto(`${base}/documents/${ACC_REF}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(DOM_PROBE));
      console.log(`[S7][documents-4452] ${JSON.stringify(dom)}`);
    });

    // ── Item 5a: Reverse payment affordance (payment-history) ─────────────
    await test.step('Payment-history — reverse affordance (account 4452)', async () => {
      await page.goto(`${base}/customer-information/${ACC_REF}`, { waitUntil: 'domcontentloaded' });
      await dismissCustomerInfoConfirmation(page).catch(() => {});
      await page.goto(`${base}/payment-history/${ACC_REF}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(DOM_PROBE));
      console.log(`[S7][payment-history-4452] ${JSON.stringify(dom)}`);
    });

    // ── Item 5b: Account Sale button (search page) ────────────────────────
    await test.step('Search page — Account Sale affordance', async () => {
      await page.goto(`${base}/search`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(DOM_PROBE));
      console.log(`[S7][search] ${JSON.stringify(dom)}`);
    });

    // ── Item 5c/5d: History dropdown — PayNearMe & Email (customer-info) ───
    await test.step('Customer-information 4452 — sidebar/history affordances', async () => {
      await page.goto(`${base}/customer-information/${ACC_REF}`, { waitUntil: 'domcontentloaded' });
      await dismissCustomerInfoConfirmation(page).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(DOM_PROBE));
      console.log(`[S7][customer-info-4452] ${JSON.stringify(dom)}`);
    });

    // ── Item 4: Protection Plan section (account 3992 — COMPLETED) ────────
    await test.step('Protection Plan — account 3992 (COMPLETED)', async () => {
      await page.goto(`${base}/customer-information/${ACC_PP}`, { waitUntil: 'domcontentloaded' });
      await dismissCustomerInfoConfirmation(page).catch(() => {});
      await page.waitForLoadState('networkidle').catch(() => {});
      const dom = await page.evaluate(eval(DOM_PROBE));
      // Targeted protection-plan region scrape
      const pp = await page.evaluate(() => {
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const nodes = Array.from(document.querySelectorAll('*'));
        const anchor = nodes.find(n => /protection plan/i.test(norm(n.textContent || '')) && norm(n.textContent || '').length < 200);
        if (!anchor) return { found: false };
        let region = anchor;
        for (let i = 0; i < 4 && region.parentElement; i++) region = region.parentElement;
        return { found: true, text: norm(region.textContent || '').slice(0, 600) };
      });
      console.log(`[S7][protection-plan-3992] dom=${JSON.stringify(dom.flags)} region=${JSON.stringify(pp)}`);
    });

    // ── Item 2: Sticky Recover — CC transaction history (4945 & 4946) ─────
    for (const acc of [ACC_STICKY_A, ACC_STICKY_B]) {
      await test.step(`Sticky — credit-card-history account ${acc}`, async () => {
        await page.goto(`${base}/credit-card-history/${acc}`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle').catch(() => {});
        const dom = await page.evaluate(eval(DOM_PROBE));
        // Capture full table text to look for "Sticky Recovery Status" / "Sticky Txn"
        const stickyCols = await page.evaluate(() => {
          const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
          const heads = Array.from(document.querySelectorAll('th, [role=columnheader]')).map(e => norm(e.textContent));
          const bodySticky = /sticky/i.test(norm(document.body.innerText || ''));
          return { heads, bodySticky };
        });
        console.log(`[S7][cc-history-${acc}] flags=${JSON.stringify(dom.flags)} headers=${JSON.stringify(stickyCols.heads)} bodyHasSticky=${stickyCols.bodySticky}`);
      });
    }

    // ── DB oracle re-confirm (read-only) ──────────────────────────────────
    await test.step('DB oracle — sticky + protection plan + esign state', async () => {
      const sticky = await db.query(
        `SELECT s.pk, s.account_pk, s.recovery_status, s.status, s.number_of_attempts,
                a.account_status, cct.status AS cc_status, cct.amount
         FROM uown_sticky s JOIN uown_sv_account a ON s.account_pk = a.pk
         LEFT JOIN uown_sv_credit_card_transaction cct ON s.cc_transaction_pk = cct.pk
         ORDER BY s.pk`, [],
      );
      console.log(`[S7][db][sticky] ${JSON.stringify(sticky)}`);

      const ppActive = await db.query(
        `SELECT count(*) AS active FROM uown_sv_protection_plan WHERE status = 'ACTIVE'`, [],
      );
      const pp3992 = await db.query(
        `SELECT pk, account_pk, status, enrollment_date FROM uown_sv_protection_plan WHERE account_pk = $1 ORDER BY pk`, [ACC_PP],
      );
      console.log(`[S7][db][pp] active_count=${JSON.stringify(ppActive[0])} acc3992=${JSON.stringify(pp3992)}`);

      const approved = await db.query(
        `SELECT count(*) AS c FROM uown_los_lead WHERE lead_status = 'UW_APPROVED'`, [],
      );
      console.log(`[S7][db][approved] uw_approved=${JSON.stringify(approved[0])}`);

      // Sample activity log for 4452 (regra #13 context)
      const log4452 = await db.query(
        `SELECT pk, log_type, left(notes,90) AS notes FROM uown_sv_activity_log WHERE account_pk = $1 ORDER BY pk DESC LIMIT 8`, [ACC_REF],
      );
      console.log(`[S7][db][log-4452] ${JSON.stringify(log4452)}`);
    });

    expect(page.url()).toContain('qa1');
  });
});

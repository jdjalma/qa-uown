/**
 * R1.53.0 — Fix "SYSTEM" in Modification Report agent_username (#1315)
 *
 * Bug: `uown_lead_modifications.agent_username` recorded "SYSTEM" for
 * LEAD_STATUS_CHANGE transitions that were in fact triggered by a human agent in
 * the Origination portal. Root cause: `ChangeLeadStatusService.changeLeadStatus`
 * read the agent name from `ThreadAttributes.getUsername()` AFTER an outbound
 * webhook corrupted the ThreadLocal, so the blank username defaulted to "SYSTEM".
 * Fix (MR svc!1464 + svc!1470): capture `agentName` at the very start of the
 * method, before any call that can corrupt the ThreadLocal.
 *
 * Why UI is mandatory (rule #14): the portal SPA sends the agent identity as the
 * HTTP header `username`. Direct API calls to `changeLeadStatus` WITHOUT that
 * header reproduce the SYSTEM artifact (test-simulation gap, see discovery KB
 * docs/knowledge-base/modification-report-agent-name-bug.md, BR-05). The status
 * change MUST therefore be driven through the browser so the header is present.
 *
 * Strategy: API setup creates a fresh lead per CT (rule #9 — fresh data, no
 * reuse). The status change is exercised exclusively via the portal, logged in
 * as `jmendes.gow` so the SPA sends `username: jmendes.gow`. Assertion reads
 * `uown_lead_modifications` directly (deterministic) and validates
 * `agent_username = 'jmendes.gow'` and `!== 'SYSTEM'`, plus the activity-log
 * note in `uown_los_lead_notes` (rule #13).
 *
 * CT-01 — UW_APPROVED → EXPIRED via "Set to Expired".
 * CT-02 — UW_APPROVED → SIGNED via "Change to Signed" (INVOICE_CREATED path).
 * CT-03 — Modification Report UI shows the real agent (jmendes.gow), not SYSTEM,
 *          for a fresh post-fix UW_APPROVED → EXPIRED transition. Covers AC3 /
 *          Scenario 3 (existing Modification Report behavior remains functional —
 *          the screen renders the correct Agent Name). UI-first: the value the
 *          customer/auditor sees is the rendered table cell, not the DB row.
 * CT-04 — Modification Report UI shows SYSTEM for a legitimate system-generated
 *          action (CONTRACT_CREATED → SIGNED, GowSign webhook — no human actor).
 *          Covers AC2 / Scenario 2. Uses a pre-existing SYSTEM record (read-only,
 *          no fresh lead) located by DB SELECT; skips if QA2 has none.
 *
 * Run: node node_modules/.bin/playwright test \
 *   tests/e2e/origination/R1.53.0_fixSystemAgentUsernameInModificationReport_1315.spec.ts
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { OriginationCustomerPage, ModificationReportPage } from '@pages/origination/index.js';
import { LoginPage } from '@pages/index.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import type { ConfigEnvironment } from '@config/environment.js';
import type { DatabaseHelpers } from '@helpers/database.helpers.js';
import type { TestContext } from '@support/base-test.js';
import {
  buildTestData,
  createPreQualifiedApplication,
  calculateDate,
  formatDate,
  sleep,
} from '@helpers/index.js';

// username é o sujeito do teste de atribuição (asserido abaixo) — não é segredo.
// A senha vem do .env (MODREPORT_AGENT_PASSWORD) — nunca hardcoded.
const PORTAL_AGENT = {
  username: process.env.MODREPORT_AGENT_USERNAME ?? 'jmendes.gow',
  password: process.env.MODREPORT_AGENT_PASSWORD ?? '',
};

const testData = {
  env: 'qa2',
  state: 'CA',
  merchant: 'TireAgent',
  orderDescription: 'fix SYSTEM agent_username #1315',
  tag: buildTags(TestTag.QA2, TestTag.REGRESSION, TestTag.CRITICAL),
};

interface LeadModificationRow {
  pk: number;
  agent_username: string | null;
  mod_type: string | null;
  old_status: string | null;
  new_status: string | null;
}

/**
 * Forces a fresh portal session as the given agent so the SPA sends the
 * `username` HTTP header with THAT username. The `origination-ui` project ships
 * a storageState for the default user — without this reset, the recorded
 * `agent_username` would be the storageState user, not the agent under test.
 */
async function loginAsAgentFresh(
  page: import('@playwright/test').Page,
  env: ConfigEnvironment,
  agent: { username: string; password: string },
): Promise<void> {
  await page.context().clearCookies();
  await page.goto(env.originationUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try { window.localStorage.clear(); } catch { /* origin not yet available */ }
    try { window.sessionStorage.clear(); } catch { /* ignore */ }
  });
  await page.goto(env.originationUrl, { waitUntil: 'domcontentloaded' });
  const loginPage = new LoginPage(page);
  await loginPage.login(agent.username, agent.password);
  await page.waitForLoadState('networkidle').catch(() => {});
}

/**
 * Polls `uown_lead_modifications` for the latest LEAD_STATUS_CHANGE row of a
 * lead matching the expected `new_status`. Column is `mod_type` (NOT
 * `modification_type`) — verified against database-schema.md to avoid the
 * silent-0-rows projection drift ([[db-polling-pattern]] pitfall #7).
 */
async function waitForLatestStatusChange(
  db: DatabaseHelpers,
  leadPk: string | number,
  newStatus: string,
  timeoutMs = 30_000,
): Promise<LeadModificationRow> {
  const sql = `SELECT pk, agent_username, mod_type, old_status, new_status
               FROM uown_lead_modifications
               WHERE lead_pk = $1
                 AND mod_type = 'LEAD_STATUS_CHANGE'
                 AND new_status = $2
               ORDER BY pk DESC
               LIMIT 1`;
  const deadline = Date.now() + timeoutMs;
  let last: LeadModificationRow | null = null;
  while (Date.now() < deadline) {
    last = await db.queryOne<LeadModificationRow>(sql, [leadPk, newStatus]);
    if (last) return last;
    await sleep(1_000);
  }
  throw new Error(
    `[#1315] No LEAD_STATUS_CHANGE→${newStatus} row for lead ${leadPk} within ${timeoutMs}ms`,
  );
}

for (const data of [testData]) {
  test.describe(
    `R1.53.0_fixSystemAgentUsernameInModificationReport_1315 - ${data.env}/${data.merchant}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ════════════════════════════════════════════════════════════════
      //  CT-01 — UW_APPROVED → EXPIRED via portal "Set to Expired"
      // ════════════════════════════════════════════════════════════════
      test('CT-01: "Set to Expired" records the real agent, not SYSTEM', async ({ page, api, db }) => {
        test.setTimeout(300_000);
        const ctx: TestContext = {
          leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
          contractStatus: '', contractUrl: '', websiteAccountPk: '',
          achAdded: 0, ccAdded: 0, reportKeys: new Map(),
        };

        const { env, merchant, applicant } = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderDescription: data.orderDescription,
        });

        await test.step('Setup: fresh lead at UW_APPROVED via API', async () => {
          // skipPaymentInfo → lead stays at UW_APPROVED (no CC submit).
          // createPreQualifiedApplication runs merchant preflight (rule #12).
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, test.info(),
          );
          const status = await db.getLeadStatus(ctx.leadPk);
          expect(status, 'lead should be UW_APPROVED before the UI action').toBe('UW_APPROVED');
        });

        const customerPage = new OriginationCustomerPage(page);

        await test.step('Login to Origination as jmendes.gow (fresh session)', async () => {
          await loginAsAgentFresh(page, env, PORTAL_AGENT);
        });

        await test.step('Navigate to the lead customer page', async () => {
          await page.goto(`${env.originationUrl}customers/${ctx.leadPk}`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
          await customerPage.waitForSpinner();
          const status = await customerPage.getLeadStatus();
          expect(status.toLowerCase(), 'customer page should show Approved').toContain('approved');
        });

        await test.step('Click "Set to Expired" and confirm (UI — sends username header)', async () => {
          await customerPage.setToExpired();
        });

        await test.step('UI: status transitions to Expired', async () => {
          const { status, matched } = await customerPage.pollForLeadStatus(['expired'], 8, 4_000);
          expect(matched, `expected status "Expired" but got "${status}"`).toBeTruthy();
        });

        await test.step('DB: agent_username is jmendes.gow (not SYSTEM)', async () => {
          const row = await waitForLatestStatusChange(db, ctx.leadPk, 'EXPIRED');
          expect(row.agent_username, 'agent_username must be the real portal agent').toBe(PORTAL_AGENT.username);
          expect(row.agent_username, 'agent_username must NOT regress to SYSTEM').not.toBe('SYSTEM');
          expect(row.old_status, 'transition should originate from UW_APPROVED').toBe('UW_APPROVED');
        });

        await test.step('DB: no LEAD_STATUS_CHANGE→EXPIRED row attributes SYSTEM for this lead', async () => {
          const systemRows = await db.query<{ pk: number }>(
            `SELECT pk FROM uown_lead_modifications
             WHERE lead_pk = $1 AND mod_type = 'LEAD_STATUS_CHANGE'
               AND new_status = 'EXPIRED' AND agent_username = 'SYSTEM'`,
            [ctx.leadPk],
          );
          expect(systemRows.length, 'no SYSTEM-attributed EXPIRED row should exist for this fresh lead').toBe(0);
        });

        await test.step('Activity log: status-change note present (rule #13)', async () => {
          const note = await db.queryOne<{ pk: number; notes: string }>(
            `SELECT pk, notes FROM uown_los_lead_notes
             WHERE lead_pk = $1 AND notes ILIKE '%EXPIRED%'
             ORDER BY pk DESC LIMIT 1`,
            [ctx.leadPk],
          );
          expect(note, 'an activity-log note for the EXPIRED transition must exist').toBeTruthy();
          expect(note!.notes).toMatch(/EXPIRED/i);
        });
      });

      // ════════════════════════════════════════════════════════════════
      //  CT-02 — UW_APPROVED → SIGNED via portal "Change to Signed"
      //          (INVOICE_CREATED / CC_AUTH_PASSED path)
      // ════════════════════════════════════════════════════════════════
      test('CT-02: "Change to Signed" records the real agent, not SYSTEM', async ({ page, api, db }) => {
        test.setTimeout(300_000);
        const ctx: TestContext = {
          leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
          contractStatus: '', contractUrl: '', websiteAccountPk: '',
          achAdded: 0, ccAdded: 0, reportKeys: new Map(),
        };

        const { env, merchant, applicant } = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderDescription: data.orderDescription,
        });

        await test.step('Setup: fresh lead at UW_APPROVED with CC submitted via API', async () => {
          // submitPaymentInfoViaApi → submitApplication with CC (Mastercard,
          // BIN 5500) → internal status INVOICE_CREATED/CC_AUTH_PASSED, lead
          // status UW_APPROVED. SIGNED is NOT driven here — it must happen via
          // the UI "Change to Signed" action so the username header is present.
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { submitPaymentInfoViaApi: true }, test.info(),
          );
          const status = await db.getLeadStatus(ctx.leadPk);
          expect(status, 'lead should be UW_APPROVED before the UI action').toBe('UW_APPROVED');
        });

        const customerPage = new OriginationCustomerPage(page);

        await test.step('Login to Origination as jmendes.gow (fresh session)', async () => {
          await loginAsAgentFresh(page, env, PORTAL_AGENT);
        });

        await test.step('Navigate to the lead customer page', async () => {
          await page.goto(`${env.originationUrl}customers/${ctx.leadPk}`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
          await customerPage.waitForSpinner();
          const status = await customerPage.getLeadStatus();
          expect(status.toLowerCase(), 'customer page should show Approved').toContain('approved');
        });

        await test.step('Click "Change to Signed", fill required comment, CONFIRM (UI — sends username header)', async () => {
          await customerPage.changeToSigned('Automated - #1315 Change to Signed');
        });

        await test.step('UI: status transitions to Signed', async () => {
          const { status, matched } = await customerPage.pollForLeadStatus(['signed'], 8, 4_000);
          expect(matched, `expected status "Signed" but got "${status}"`).toBeTruthy();
        });

        await test.step('DB: agent_username is jmendes.gow (not SYSTEM)', async () => {
          const row = await waitForLatestStatusChange(db, ctx.leadPk, 'SIGNED');
          expect(row.agent_username, 'agent_username must be the real portal agent').toBe(PORTAL_AGENT.username);
          expect(row.agent_username, 'agent_username must NOT regress to SYSTEM').not.toBe('SYSTEM');
        });

        await test.step('DB negative guard: no SYSTEM-attributed SIGNED row for this lead', async () => {
          const systemRows = await db.query<{ pk: number }>(
            `SELECT pk FROM uown_lead_modifications
             WHERE lead_pk = $1 AND mod_type = 'LEAD_STATUS_CHANGE'
               AND new_status = 'SIGNED' AND agent_username = 'SYSTEM'`,
            [ctx.leadPk],
          );
          expect(systemRows.length, 'no SYSTEM-attributed SIGNED row should exist for this fresh lead').toBe(0);
        });

        await test.step('Activity log: status-change note present (rule #13)', async () => {
          const note = await db.queryOne<{ pk: number; notes: string }>(
            `SELECT pk, notes FROM uown_los_lead_notes
             WHERE lead_pk = $1 AND notes ILIKE '%SIGNED%'
             ORDER BY pk DESC LIMIT 1`,
            [ctx.leadPk],
          );
          expect(note, 'an activity-log note for the SIGNED transition must exist').toBeTruthy();
          expect(note!.notes).toMatch(/SIGNED/i);
        });
      });

      // ════════════════════════════════════════════════════════════════
      //  CT-03 — Modification Report UI renders the real agent (jmendes.gow),
      //          NOT SYSTEM, for a fresh UW_APPROVED → EXPIRED transition.
      //          AC3 / Scenario 3 — existing report behavior remains functional.
      //
      //  UI-first (rule #14): the assertion target is the rendered "Agent Name"
      //  cell that an auditor sees in the portal — a rendering/display bug is
      //  only catchable by reading the table, not the DB row. The transition is
      //  driven via the portal (same flow as CT-01) so the `username` header is
      //  present; the DB row is checked as a cross-cutting guard, then the
      //  /modificationReport screen is filtered and the cell is asserted.
      // ════════════════════════════════════════════════════════════════
      test('CT-03: Modification Report UI shows the real agent (not SYSTEM)', async ({ page, api, db }) => {
        test.setTimeout(300_000);
        const ctx: TestContext = {
          leadPk: '', leadUuid: '', accountPk: '', accountNumber: '',
          contractStatus: '', contractUrl: '', websiteAccountPk: '',
          achAdded: 0, ccAdded: 0, reportKeys: new Map(),
        };

        const { env, merchant, applicant } = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderDescription: data.orderDescription,
        });

        await test.step('Setup: fresh lead at UW_APPROVED via API', async () => {
          await createPreQualifiedApplication(
            api, merchant, applicant, ctx, { skipPaymentInfo: true }, test.info(),
          );
          const status = await db.getLeadStatus(ctx.leadPk);
          expect(status, 'lead should be UW_APPROVED before the UI action').toBe('UW_APPROVED');
        });

        const customerPage = new OriginationCustomerPage(page);

        await test.step('Login to Origination as jmendes.gow (fresh session)', async () => {
          await loginAsAgentFresh(page, env, PORTAL_AGENT);
        });

        await test.step('Navigate to the lead and Set to Expired (UI — sends username header)', async () => {
          await page.goto(`${env.originationUrl}customers/${ctx.leadPk}`, { waitUntil: 'domcontentloaded' });
          await page.waitForLoadState('networkidle').catch(() => {});
          await customerPage.waitForSpinner();
          const status = await customerPage.getLeadStatus();
          expect(status.toLowerCase(), 'customer page should show Approved').toContain('approved');
          await customerPage.setToExpired();
          const { status: after, matched } = await customerPage.pollForLeadStatus(['expired'], 8, 4_000);
          expect(matched, `expected status "Expired" but got "${after}"`).toBeTruthy();
        });

        await test.step('DB guard: row records jmendes.gow (not SYSTEM)', async () => {
          const row = await waitForLatestStatusChange(db, ctx.leadPk, 'EXPIRED');
          expect(row.agent_username, 'DB row must record the real portal agent').toBe(PORTAL_AGENT.username);
          expect(row.agent_username, 'DB row must NOT regress to SYSTEM').not.toBe('SYSTEM');
        });

        const report = new ModificationReportPage(page);

        await test.step('Open Modification Report and filter (today + agent jmendes.gow)', async () => {
          await report.navigateToModificationReport(env.originationUrl);
          const today = calculateDate('TODAY'); // MM/DD/YYYY
          await report.filterByDateRange(today, today);
          await report.filterByAgentName(PORTAL_AGENT.username);
          await report.search();
        });

        await test.step('UI: the lead row shows Agent Name = jmendes.gow and Modification Type = LEAD_STATUS_CHANGE', async () => {
          const row = await report.getRowByLeadPk(ctx.leadPk);
          expect(row, `lead ${ctx.leadPk} must appear in the filtered Modification Report`).toBeTruthy();
          expect(row!['Agent Name'], 'rendered Agent Name must be the real agent, not SYSTEM').toBe(PORTAL_AGENT.username);
          expect(row!['Agent Name'], 'rendered Agent Name must NOT be SYSTEM').not.toBe('SYSTEM');
          expect(row!['Modification Type']).toBe('LEAD_STATUS_CHANGE');
          // Display mapping (KB): UW_APPROVED → "Approved", EXPIRED → "Expired".
          expect(row!['New Status']).toMatch(/Expired/i);
        });

        await test.step('Activity log: status-change note present (rule #13)', async () => {
          const note = await db.queryOne<{ pk: number; notes: string }>(
            `SELECT pk, notes FROM uown_los_lead_notes
             WHERE lead_pk = $1 AND notes ILIKE '%EXPIRED%'
             ORDER BY pk DESC LIMIT 1`,
            [ctx.leadPk],
          );
          expect(note, 'an activity-log note for the EXPIRED transition must exist').toBeTruthy();
          expect(note!.notes).toMatch(/EXPIRED/i);
        });
      });

      // ════════════════════════════════════════════════════════════════
      //  CT-04 — Modification Report UI shows SYSTEM for a legitimate
      //          system-generated action: CONTRACT_CREATED → SIGNED is the
      //          GowSign/SignWell webhook callback (no human actor in the HTTP
      //          context → ThreadAttributes.username blank → "SYSTEM", which is
      //          CORRECT per BR-02). AC2 / Scenario 2.
      //
      //  Data: read-only reuse of a PRE-EXISTING SYSTEM record (no fresh lead —
      //  this transition cannot be produced deterministically via the portal,
      //  it requires a real customer self-signing webhook). Justified exception
      //  to the fresh-data default ([[test-data-hierarchy]]): the record is only
      //  READ, never mutated, and the assertion is about a legitimate-SYSTEM
      //  display, not a transition the test triggers. Skips if QA2 has none.
      // ════════════════════════════════════════════════════════════════
      test('CT-04: Modification Report UI shows SYSTEM for a system-generated action', async ({ page, db }) => {
        test.setTimeout(180_000);

        const { env } = buildTestData({
          env: data.env,
          state: data.state,
          merchant: data.merchant,
          orderDescription: data.orderDescription,
        });

        interface SystemRecord { lead_pk: string; record_date: string }
        let record: SystemRecord | null = null;

        await test.step('Setup: locate a CONTRACT_CREATED → SIGNED SYSTEM record (read-only)', async () => {
          record = await db.queryOne<SystemRecord>(
            `SELECT lead_pk,
                    to_char(row_created_timestamp AT TIME ZONE 'America/New_York', 'MM/DD/YYYY') AS record_date
               FROM uown_lead_modifications
              WHERE mod_type = 'LEAD_STATUS_CHANGE'
                AND old_status = 'CONTRACT_CREATED'
                AND new_status = 'SIGNED'
                AND agent_username = 'SYSTEM'
              ORDER BY pk DESC
              LIMIT 1`,
          );
        });

        test.skip(
          record === null,
          'No CONTRACT_CREATED → SIGNED SYSTEM record available in QA2 DB',
        );
        const rec = record as unknown as SystemRecord;

        const report = new ModificationReportPage(page);

        await test.step('Login to Origination as jmendes.gow (fresh session)', async () => {
          await loginAsAgentFresh(page, env, PORTAL_AGENT);
        });

        await test.step('Open Modification Report and filter around the record date + type LEAD_STATUS_CHANGE', async () => {
          await report.navigateToModificationReport(env.originationUrl);
          // Widen the window by ±1 day so an EST/UTC boundary record can't fall
          // outside the filter (the row date is rendered in EST, the filter is
          // an inclusive MM/DD/YYYY range).
          const [mm, dd, yyyy] = rec.record_date.split('/').map(Number);
          const mid = new Date(yyyy, mm - 1, dd);
          const start = new Date(mid); start.setDate(mid.getDate() - 1);
          const end = new Date(mid); end.setDate(mid.getDate() + 1);
          await report.filterByDateRange(formatDate(start), formatDate(end));
          await report.filterByModificationType('LEAD_STATUS_CHANGE');
          await report.filterByAgentName('SYSTEM');
          await report.search();
        });

        await test.step('UI: the system record renders Agent Name = SYSTEM with the legitimate transition', async () => {
          const row = await report.getRowByLeadPk(rec.lead_pk);
          expect(row, `lead ${rec.lead_pk} (SYSTEM record) must appear in the filtered report`).toBeTruthy();
          expect(row!['Agent Name'], 'a system-generated action must render SYSTEM').toBe('SYSTEM');
          // Display mapping (KB): CONTRACT_CREATED → "Contract Created", SIGNED → "Signed".
          expect(row!['Old Status']).toMatch(/Contract Created/i);
          expect(row!['New Status']).toMatch(/Signed/i);
          expect(row!['Modification Type']).toBe('LEAD_STATUS_CHANGE');
        });
      });
    },
  );
}

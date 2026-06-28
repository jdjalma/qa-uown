/**
 * Task #1309 (RU05.26.1.52.0) — Add GDS Data Fields on Config Columns on Merchant Page.
 *
 * SPEC:      docs/taskTestingUown/RU05.26.1.52.0_addGdsDataFieldsConfigColumnsMerchant_1309/
 *            RU05.26.1.52.0_addGdsDataFieldsConfigColumnsMerchant_1309-spec.md
 * Gherkin:   .claude/oracles/1309-add-gds-data-fields-config-columns-merchants.md
 * Discovery: docs/knowledge-base/merchants-config-columns-export.md
 *
 * Feature (Origination /merchant): the Config Columns panel gains 3 new options —
 * `UW Pipeline`, `Fraud Threshold`, `Max Approval Amount` — sourced from
 * `uown_merchant.uw_pipeline / fraud_threshold / max_approval_amount` (GDS Data).
 * They render as table columns, are exportable to CSV, and are auto-included by
 * default when exporting the Active merchant book (`isActive: true`).
 *
 * ⚠️ NOT DEPLOYED IN QA1 YET (as of discovery 2026-06-15). The 3 GDS checkboxes do
 *    NOT exist in QA1 Config Columns until #1309 lands. CT-01 (panel presence) and
 *    CT-05 (Active auto-default) are the DEPLOY GATE (P0): they WILL FAIL until the
 *    feature is deployed. That failure is EXPECTED pre-deploy and is the signal that
 *    the build has not shipped — it is NOT a test defect. Full run after #1309 lands.
 *
 * Mandatory-rule posture (SPEC § "Mandatory Rules Verification"):
 *  - Rule #12 (merchant preflight): N/A — no application is created. The GDS-value
 *    SETUP (CT-02) edits an EXISTING active merchant via the UI form; preflight is
 *    intentionally NOT run (mutating out-of-scope merchant config = side effect).
 *  - Rule #13 (activity log): N/A — Config Columns toggles and CSV export are
 *    UI-view/read operations, they do NOT mutate lead/lease/account state and do NOT
 *    write uown_los_lead_notes. The only mutation is the GDS-value setup (merchant
 *    edit); validating its merchant activity log is OPTIONAL (setup, not under test).
 *    Documented N/A with reason — not silently skipped.
 *  - Rule #14 (UI-first): ENFORCED. NULL-cell render (CT-03) and CSV content
 *    (CT-04/05/06/09) are render-based assertions — Daniel's Jewelers precedent.
 *    DB SELECT is used ONLY as a read-only value oracle (rule #9 compliant).
 *  - Rule #16 (DOM-first): selectors derived from the discovery MCP investigation.
 *    The 3 NEW GDS checkboxes must be MCP-re-snapshotted post-deploy before locking
 *    their selectors (they were absent in QA1 at discovery time).
 *
 * Serial: MANDATORY (test.describe.serial). All CTs operate on the same /merchant
 * table and toggle shared session Config Columns state (immediate, no Apply — BR-01).
 * Running in parallel would cross-contaminate the checked-column set. Each CT resets
 * Config Columns to a known state at start instead of assuming prior state.
 *
 * Environment: qa1. The DB value-oracle SELECT (read-only) runs against the global
 * ENV connection — run with ENV=qa1. If the qa1 DB tunnel is unreachable
 * (SPEC § Test Strategy connectivity caveat), the UI/CSV assertions still hold; the
 * DB cross-check degrades to a soft skip and is flagged in the report.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags } from '@ptypes/enums.js';
import { SELECTORS } from '@selectors/common.selectors.js';
import { MerchantListPage, MerchantSettingPage } from '@pages/origination/index.js';
import { ConfigEnvironment, generateRunId } from '@config/index.js';
import fs from 'fs';

// ── Test data ────────────────────────────────────────────────────────
const testData = {
  env: 'qa1',
  // task-testing-origination project is selected by the literal `@origination`
  // tag (playwright.config.ts grep). `@regression @qa1` come from TestTag.
  tag: `${buildTags(TestTag.REGRESSION, TestTag.QA1)} @origination`,
  runId: generateRunId(),
};

const VIEWPORT = { width: 1440, height: 900 } as const;

// The 3 new GDS Config-Columns options under test (discovery + ticket).
const GDS_COLUMNS = ['UW Pipeline', 'Fraud Threshold', 'Max Approval Amount'] as const;

// Deterministic GDS values written via the UI in the setup CT (fresh-data
// default — SPEC § Test Data Strategy, prefer option (a)).
const GDS_SETUP = {
  uwPipeline: `QA-1309-${testData.runId}`,
  fraudThreshold: '15',
  maxApprovalAmount: '5000',
} as const;

// A representative sample of pre-existing columns for the regression CTs (AC-04/05).
const PREEXISTING_DEFAULT_SAMPLE = ['Merchant Code', 'Merchant Name', 'State'] as const;
const PREEXISTING_EXTRA_SAMPLE = ['Merchant PK', 'Category', 'Platform Fee'] as const;

// ── Shared context (serial run) ──────────────────────────────────────
interface Ctx {
  populatedMerchantCode: string; // active merchant we SET GDS values on (CT-02)
  nullMerchantCode: string;      // active merchant with all 3 GDS NULL (CT-03)
}
const ctx: Ctx = { populatedMerchantCode: '', nullMerchantCode: '' };

// ── CSV helpers (local — small + spec-specific) ──────────────────────
function parseCsvHeader(csvContent: string): string[] {
  const firstLine = csvContent.split(/\r?\n/)[0] ?? '';
  return firstLine.split(',').map(h => h.replace(/"/g, '').trim());
}

/** Parses a CSV into header + rows (naive split — values may contain commas only
 * inside quotes; merchant report uses simple values, sufficient for assertions). */
function parseCsvRows(csvContent: string): { header: string[]; rows: string[][] } {
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseCsvHeader(csvContent);
  const rows = lines.slice(1).map(l => splitCsvLine(l));
  return { header, rows };
}

/** Splits a single CSV line honouring double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim()); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function findCsvRowByMerchantCode(
  parsed: { header: string[]; rows: string[][] },
  merchantCode: string,
): string[] | null {
  const codeIdx = parsed.header.findIndex(h => h.toLowerCase() === 'merchant code');
  if (codeIdx === -1) return null;
  return parsed.rows.find(r => (r[codeIdx] ?? '').trim() === merchantCode) ?? null;
}

// ── DB value oracle (read-only — rule #9 compliant) ──────────────────
async function selectGdsRaw(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  merchantCode: string,
): Promise<{ uw_pipeline: string | null; fraud_threshold: string | null; max_approval_amount: string | null } | null> {
  return db.queryOne(
    `SELECT uw_pipeline, fraud_threshold::text AS fraud_threshold,
            max_approval_amount::text AS max_approval_amount
       FROM uown_merchant
      WHERE ref_merchant_code = $1`,
    [merchantCode],
  );
}

// ─────────────────────────────────────────────────────────────────────
test.describe.serial(
  'RU05.26.1.52.0 — #1309 GDS Config Columns',
  { tag: testData.tag.split(' ') },
  () => {
    test.use({ envName: testData.env });

    test.beforeEach(async ({ page }) => {
      // Origination internal portal — Bootstrap d-lg-block ≥992px (rule #15).
      await page.setViewportSize({ width: VIEWPORT.width, height: VIEWPORT.height });
    });

    // ── SETUP (UI, fresh-data default) ───────────────────────────────
    // Set deterministic GDS values on an active merchant + resolve a NULL one.
    test('SETUP — seed populated merchant GDS values + resolve NULL merchant @origination', async ({ page, db }) => {
      test.setTimeout(180_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);

      await test.step('Resolve a populated + a NULL active merchant', async () => {
        await list.navigateToMerchantList(env.originationUrl);

        // First active row → we will SET deterministic GDS values on it (CT-02/04/05 oracle).
        ctx.populatedMerchantCode = await list.getMerchantCodeAtRow(0);
        expect(ctx.populatedMerchantCode, 'populated merchant code resolved').toBeTruthy();

        // NULL merchant: prefer DB resolution (abundant). Fall back to the 2nd row
        // (most merchants have NULL GDS per discovery) if DB is unreachable.
        const nullByDb = await db.getSingleString(
          `SELECT ref_merchant_code FROM uown_merchant
            WHERE uw_pipeline IS NULL AND fraud_threshold IS NULL
              AND max_approval_amount IS NULL AND is_active = true
              AND ref_merchant_code <> $1
            ORDER BY pk LIMIT 1`,
          [ctx.populatedMerchantCode],
        ).catch(() => null);
        ctx.nullMerchantCode = nullByDb ?? await list.getMerchantCodeAtRow(1);
        expect(ctx.nullMerchantCode, 'NULL merchant code resolved').toBeTruthy();
        expect(ctx.nullMerchantCode).not.toBe(ctx.populatedMerchantCode);
      });

      await test.step('Set deterministic GDS values via Merchant Settings UI', async () => {
        const settings = new MerchantSettingPage(page);
        await settings.navigateToMerchantSettings(env.originationUrl);
        await settings.loadMerchants();
        // Select the populated merchant row (row 0 — same ordering source as list)
        await settings.selectMerchantRow(0);
        await settings.fillUwPipeline(GDS_SETUP.uwPipeline);
        await settings.fillFraudThreshold(GDS_SETUP.fraudThreshold);
        await settings.fillMaxApprovalAmount(GDS_SETUP.maxApprovalAmount);
        const toast = await settings.submitSettings();
        await settings.confirmBulkUpdate();
        console.log(`[#1309 SETUP] merchant=${ctx.populatedMerchantCode} GDS set; toast="${toast}"`);
      });

      await test.step('DB oracle: confirm GDS values persisted (read-only)', async () => {
        const raw = await selectGdsRaw(db, ctx.populatedMerchantCode).catch(() => null);
        if (!raw) {
          console.warn('[#1309 SETUP] qa1 DB unreachable — UI/CSV assertions still hold, DB cross-check skipped');
          return;
        }
        expect(raw.uw_pipeline).toBe(GDS_SETUP.uwPipeline);
        expect(Number(raw.fraud_threshold)).toBe(Number(GDS_SETUP.fraudThreshold));
        expect(Number(raw.max_approval_amount)).toBe(Number(GDS_SETUP.maxApprovalAmount));
      });
    });

    // ── CT-01 [P0/smoke, DEPLOY GATE] ────────────────────────────────
    test('CT-01 — GDS fields appear as selectable Config Columns options @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);

      await test.step('Navigate to /merchant', async () => {
        await list.navigateToMerchantList(env.originationUrl);
      });

      await test.step('Open Config Columns and assert the 3 GDS options exist + are toggleable', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) {
          const checkbox = page.locator(`input[type='checkbox'][name=${JSON.stringify(col)}]`).first();
          // DEPLOY GATE: fails loudly here until #1309 ships to qa1 (expected pre-deploy).
          await expect(checkbox, `'${col}' checkbox must exist in Config Columns (deploy gate)`)
            .toBeAttached({ timeout: 8_000 });
          await expect(checkbox, `'${col}' checkbox must be enabled`).toBeEnabled();
        }
        await list.closeConfigColumns();
      });
    });

    // ── CT-02 [P1] table shows correct GDS values for populated merchant ─
    test('CT-02 — Table shows correct GDS values for a populated merchant @origination', async ({ page, db }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('Check the 3 GDS columns', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) await list.setColumn(col, true);
        await list.closeConfigColumns();
      });

      await test.step('Assert table cells == GDS setup values', async () => {
        const uw = await list.getCellValueForMerchant(ctx.populatedMerchantCode, 'UW Pipeline');
        const fraud = await list.getCellValueForMerchant(ctx.populatedMerchantCode, 'Fraud Threshold');
        const maxAmt = await list.getCellValueForMerchant(ctx.populatedMerchantCode, 'Max Approval Amount');

        expect(uw, 'UW Pipeline cell').toBe(GDS_SETUP.uwPipeline);
        // Fraud Threshold numeric — compare numerically (tolerant of trailing zeros).
        expect(Number(fraud), 'Fraud Threshold cell').toBe(Number(GDS_SETUP.fraudThreshold));
        // Max Approval Amount: format unknown pre-deploy (Q2 — raw vs $5,000.00).
        // Strip currency/grouping and compare numerically.
        const maxNumeric = Number((maxAmt ?? '').replace(/[$,]/g, ''));
        expect(maxNumeric, 'Max Approval Amount cell (numeric)').toBe(Number(GDS_SETUP.maxApprovalAmount));
      });

      await test.step('DB cross-check (read-only oracle)', async () => {
        const raw = await selectGdsRaw(db, ctx.populatedMerchantCode).catch(() => null);
        if (!raw) { console.warn('[CT-02] DB unreachable — UI assertion stands'); return; }
        expect(raw.uw_pipeline).toBe(GDS_SETUP.uwPipeline);
      });
    });

    // ── CT-03 [P0] NULL merchant renders empty cells ─────────────────
    test('CT-03 — New columns render EMPTY for a merchant with no GDS Data @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('Ensure the 3 GDS columns are checked', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) await list.setColumn(col, true);
        await list.closeConfigColumns();
      });

      await test.step('Assert NULL merchant cells are empty + no leaked null/undefined/NaN', async () => {
        for (const col of GDS_COLUMNS) {
          const cell = await list.getCellValueForMerchant(ctx.nullMerchantCode, col);
          // [ASSUNÇÃO] Q-G2: NULL renders as empty string. Adjust if deploy shows '—'/'0'.
          expect(cell, `${col} cell for NULL merchant must be empty`).toBe('');
          // Rule #14 / Daniel's Jewelers: no literal null/undefined/NaN leak to the user.
          expect(['null', 'undefined', 'NaN']).not.toContain((cell ?? '').toLowerCase());
        }
      });
    });

    // ── CT-04 [P1] manual selection → correct CSV values ─────────────
    test('CT-04 — Manual selection exports correct GDS values in CSV @origination', async ({ page, db }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('Check the 3 GDS columns', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) await list.setColumn(col, true);
        await list.closeConfigColumns();
      });

      await test.step('Download CSV and assert header + populated values', async () => {
        const csvPath = await list.downloadCsv();
        expect(csvPath, 'CSV saved').toBeTruthy();
        expect(csvPath.endsWith('merchant-report.csv'), `file name: ${csvPath}`).toBeTruthy();

        const content = fs.readFileSync(csvPath, 'utf-8');
        const parsed = parseCsvRows(content);
        for (const col of GDS_COLUMNS) {
          expect(parsed.header, `CSV header must contain '${col}'`).toContain(col);
        }

        const row = findCsvRowByMerchantCode(parsed, ctx.populatedMerchantCode);
        expect(row, `populated merchant row in CSV: ${ctx.populatedMerchantCode}`).not.toBeNull();
        const uwIdx = parsed.header.indexOf('UW Pipeline');
        const fraudIdx = parsed.header.indexOf('Fraud Threshold');
        const maxIdx = parsed.header.indexOf('Max Approval Amount');
        expect(row![uwIdx]).toBe(GDS_SETUP.uwPipeline);
        expect(Number(row![fraudIdx])).toBe(Number(GDS_SETUP.fraudThreshold));
        expect(Number((row![maxIdx] ?? '').replace(/[$,]/g, ''))).toBe(Number(GDS_SETUP.maxApprovalAmount));
      });

      await test.step('DB cross-check (read-only oracle)', async () => {
        const raw = await selectGdsRaw(db, ctx.populatedMerchantCode).catch(() => null);
        if (!raw) { console.warn('[CT-04] DB unreachable — CSV assertion stands'); return; }
        expect(raw.uw_pipeline).toBe(GDS_SETUP.uwPipeline);
      });
    });

    // ── CT-05 [P0/smoke, DEPLOY GATE] Active export auto-includes GDS ─
    test('CT-05 — Active export auto-includes the 3 GDS fields by default @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('LINCHPIN — assert/ensure the 3 GDS checkboxes are UNCHECKED', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) {
          // If a prior serial CT left it checked, uncheck — auto-default must come
          // from isActive:true, NOT from leftover manual selection.
          await list.setColumn(col, false);
          expect(await list.isColumnChecked(col), `${col} must be unchecked before Active export`).toBe(false);
        }
        await list.closeConfigColumns();
      });

      await test.step('Ensure Active filter = Active', async () => {
        await list.setActiveFilter('Active');
      });

      await test.step('Download CSV and assert the 3 GDS columns auto-included (once each)', async () => {
        const csvPath = await list.downloadCsv();
        const content = fs.readFileSync(csvPath, 'utf-8');
        const parsed = parseCsvRows(content);

        for (const col of GDS_COLUMNS) {
          const occurrences = parsed.header.filter(h => h === col).length;
          // DEPLOY GATE: proves auto-default despite no manual selection.
          expect(occurrences, `'${col}' must appear exactly once in Active export (auto-default + de-dup)`).toBe(1);
        }

        // Populated merchant correct + NULL merchant empty (no serialization break).
        const popRow = findCsvRowByMerchantCode(parsed, ctx.populatedMerchantCode);
        if (popRow) {
          const uwIdx = parsed.header.indexOf('UW Pipeline');
          expect(popRow[uwIdx]).toBe(GDS_SETUP.uwPipeline);
        }
        const nullRow = findCsvRowByMerchantCode(parsed, ctx.nullMerchantCode);
        if (nullRow) {
          const uwIdx = parsed.header.indexOf('UW Pipeline');
          expect(['', 'null', 'undefined', 'NaN']).toContain(nullRow[uwIdx] ?? '');
          expect(nullRow[uwIdx] ?? '').toBe(''); // [ASSUNÇÃO] Q-G2: empty
        }
      });
    });

    // ── CT-06 [P1] Inactive export does NOT auto-include GDS ──────────
    test('CT-06 — Inactive export does NOT auto-include the GDS fields @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('Ensure the 3 GDS checkboxes are UNCHECKED', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) {
          await list.setColumn(col, false);
          expect(await list.isColumnChecked(col), `${col} unchecked`).toBe(false);
        }
        await list.closeConfigColumns();
      });

      await test.step('Switch Active filter to Inactive (isActive:false)', async () => {
        await list.setActiveFilter('Inactive');
      });

      await test.step('Download CSV and assert the 3 GDS columns are ABSENT', async () => {
        const csvPath = await list.downloadCsv();
        const content = fs.readFileSync(csvPath, 'utf-8');
        const header = parseCsvHeader(content);
        for (const col of GDS_COLUMNS) {
          expect(header, `'${col}' must NOT be auto-included on Inactive export`).not.toContain(col);
        }
      });
    });

    // ── CT-07 [P1/regression] pre-existing options intact ────────────
    test('CT-07 — All pre-existing Config Columns options remain present & selectable @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('Open Config Columns; assert default-checked sample present + checked', async () => {
        await list.openConfigColumns();
        for (const col of PREEXISTING_DEFAULT_SAMPLE) {
          const cb = page.locator(`input[type='checkbox'][name=${JSON.stringify(col)}]`).first();
          await expect(cb, `default column '${col}' present`).toBeAttached({ timeout: 8_000 });
          expect(await list.isColumnChecked(col), `default column '${col}' checked`).toBe(true);
        }
      });

      await test.step('Assert selectable-extra sample present + toggleable', async () => {
        for (const col of PREEXISTING_EXTRA_SAMPLE) {
          const cb = page.locator(`input[type='checkbox'][name=${JSON.stringify(col)}]`).first();
          await expect(cb, `extra column '${col}' present`).toBeAttached({ timeout: 8_000 });
          await expect(cb, `extra column '${col}' enabled`).toBeEnabled();
        }
        await list.closeConfigColumns();
      });
    });

    // ── CT-08 [P1/regression] enabling a pre-existing column applies it ─
    test('CT-08 — Enabling a pre-existing column still applies it to the table @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      await test.step('Enable a pre-existing column not shown by default (Merchant PK)', async () => {
        await list.openConfigColumns();
        await list.setColumn('Merchant PK', true);
        await list.closeConfigColumns();
      });

      await test.step('Assert the toggled column appears in the table headers', async () => {
        const headers = await list.getTableHeaders();
        expect(headers, "toggled column 'Merchant PK' must appear in the table")
          .toContain('Merchant PK');
      });
    });

    // ── CT-09 [P2/regression] mixed new + pre-existing CSV is valid ───
    test('CT-09 — Mixed new + pre-existing columns export a valid, complete CSV @origination', async ({ page }) => {
      test.setTimeout(120_000);
      const env = new ConfigEnvironment(testData.env);
      const list = new MerchantListPage(page);
      await list.navigateToMerchantList(env.originationUrl);

      const mixedPreexisting = ['Merchant Name', 'State'] as const;

      await test.step('Check the 3 GDS columns + 2 pre-existing columns', async () => {
        await list.openConfigColumns();
        for (const col of GDS_COLUMNS) await list.setColumn(col, true);
        for (const col of mixedPreexisting) await list.setColumn(col, true);
        await list.closeConfigColumns();
      });

      await test.step('Download CSV; assert all selected columns present + rows well-formed', async () => {
        const csvPath = await list.downloadCsv();
        const content = fs.readFileSync(csvPath, 'utf-8');
        const parsed = parseCsvRows(content);

        for (const col of [...GDS_COLUMNS, ...mixedPreexisting]) {
          expect(parsed.header, `CSV header must contain '${col}'`).toContain(col);
        }

        // No malformed rows: each data row's cell count == header count.
        const headerCount = parsed.header.length;
        const malformed = parsed.rows.filter(r => r.length !== headerCount);
        expect(malformed.length, `all rows must have ${headerCount} cells (no broken quoting)`).toBe(0);

        // Pre-existing values intact: populated merchant row has its Merchant Name non-empty.
        const popRow = findCsvRowByMerchantCode(parsed, ctx.populatedMerchantCode);
        if (popRow) {
          const nameIdx = parsed.header.indexOf('Merchant Name');
          expect((popRow[nameIdx] ?? '').length, 'Merchant Name preserved').toBeGreaterThan(0);
        }
      });
    });
  },
);

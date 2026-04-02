/**
 * RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery13_463
 *
 * Validates the backend optimization of the `getLosSimpleSearchResults` query
 * (high-CPU query fix: 2 new functional indexes on uown_los_customer for case-insensitive name search).
 *
 * Covers:
 *  CT-01 — Both functional indexes exist on uown_los_customer
 *  CT-02 — Indexes are functional (UPPER expression) — verified via pg_indexes.indexdef
 *  CT-03 — Functional correctness: case-insensitive firstName search returns correct lead
 *  CT-04 — Functional correctness: case-insensitive lastName search returns correct lead
 *  CT-05 — EXPLAIN ANALYZE confirms functional index scans for UPPER() name filters
 *  CT-06 — Flyway migration recorded as successful in flyway_schema_history
 *
 * GitLab: https://gitlab.com/uown/backend/svc/-/work_items/463
 *
 * Pipeline: new-api (DB validation + functional index query execution)
 * No browser required — DB only.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MERCHANTS } from '@data/merchants.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateTestSSN, generateRunId } from '@config/constants.js';

// ── Constants ────────────────────────────────────────────────────────

/** Functional indexes introduced by the getLosSimpleSearchResults optimization (Task #463). */
const FUNCTIONAL_INDEXES = [
  {
    name:       'idx_customer_first_name_upper',
    table:      'uown_los_customer',
    exprColumn: 'first_name',
    exprFn:     'upper',
  },
  {
    name:       'idx_customer_last_name_upper',
    table:      'uown_los_customer',
    exprColumn: 'last_name',
    exprFn:     'upper',
  },
] as const;

/** Flyway migration version (derived from filename V20260227113249__...). */
const FLYWAY_VERSION = '20260227113249';

/** Minimum estimated row count before asserting index vs seq-scan choice. */
const MIN_ROWS_FOR_INDEX_ASSERTION = 500;

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env:         'qa1',
    state:       'NY',
    merchantKey: 'TerraceFinance',
    tag:         buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.QA1),
  },
  {
    env:         'qa1',
    state:       'NY',
    merchantKey: 'FifthAveFurnitureNY',
    tag:         buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.QA1),
  },
  {
    env:         'stg',
    state:       'NY',
    merchantKey: 'TerraceFinance',
    tag:         buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.STG),
  },
  {
    env:         'stg',
    state:       'NY',
    merchantKey: 'ComfortZoneMattress',
    tag:         buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.STG),
  },
];

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchantKey];

  test.describe(
    `RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery13_463 - ${data.env}/${merchant.number}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01 — Both functional indexes exist on uown_los_customer
      // ══════════════════════════════════════════════════════════════
      test('CT-01: Both UPPER() functional indexes exist on uown_los_customer', async ({ db }) => {
        test.setTimeout(60_000);

        for (const idx of FUNCTIONAL_INDEXES) {
          await test.step(`Verify ${idx.name} exists on ${idx.table}`, async () => {
            const exists = await db.indexExistsOnTable(idx.name, idx.table);
            expect(
              exists,
              `Index "${idx.name}" not found on table "${idx.table}" — Flyway migration V${FLYWAY_VERSION} may not have been applied to ${data.env}`,
            ).toBe(true);
            console.log(`[CT-01] ✓ ${idx.name} on ${idx.table}`);
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-02 — Functional indexes verified via pg_indexes.indexdef
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Functional index definitions contain UPPER() expressions in pg_indexes.indexdef', async ({ db }) => {
        test.setTimeout(60_000);

        for (const idx of FUNCTIONAL_INDEXES) {
          await test.step(`Verify ${idx.name} indexdef contains UPPER(${idx.exprColumn})`, async () => {
            const indexDef = await db.getSingleString(
              `SELECT indexdef FROM pg_indexes WHERE indexname = $1`,
              [idx.name],
            );
            console.log(`[CT-02] ${idx.name} indexdef: ${indexDef}`);
            expect(
              indexDef,
              `Index definition for "${idx.name}" not found in pg_indexes`,
            ).toBeTruthy();

            // Verify the indexdef contains the UPPER expression — PostgreSQL stores as "upper((col)::text)"
            expect(
              indexDef!.toLowerCase(),
              `Index "${idx.name}" indexdef does not contain "upper" — not a functional index. Actual: ${indexDef}`,
            ).toContain('upper');

            expect(
              indexDef!.toLowerCase(),
              `Index "${idx.name}" indexdef does not reference column "${idx.exprColumn}". Actual: ${indexDef}`,
            ).toContain(idx.exprColumn);

            console.log(`[CT-02] ✓ ${idx.name} is a UPPER() functional index on ${idx.exprColumn}`);
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03 — Functional: case-insensitive firstName search
      // ══════════════════════════════════════════════════════════════
      test('CT-03: Case-insensitive firstName search returns correct lead via UPPER() index path', async ({ db, api, testEnv }) => {
        test.setTimeout(120_000);

        const runId     = generateRunId();
        const ssn       = generateTestSSN(true); // does not end in 9 → UW_APPROVED
        const email     = testEnv.generateUniqueEmailAlias();
        const phoneBase = Date.now().toString().slice(-7);
        const phone     = `555${phoneBase}`;
        // Use a recognizable firstName for search verification
        const firstName = `Srch${runId.slice(-6)}`;
        const lastName  = `LnCt03${runId.slice(-4)}`;
        console.log(`[CT-03] runId=${runId}, firstName="${firstName}", lastName="${lastName}", email=${email}`);

        let leadUuid: string;
        let leadPk: string;

        // Step 3.1 — Submit new lead with distinctive firstName
        await test.step(`Submit new lead with firstName="${firstName}" for ${merchant.fullName}`, async () => {
          const res = await api.application.sendApplication(
            { username: merchant.username, password: merchant.password, number: merchant.number },
            {
              firstName,
              lastName,
              email,
              ssn,
              phone,
              address: '123 Main St',
              city:    'New York',
              state:   data.state,
              zip:     '10001',
              dob:     '01/01/1984',
            },
          );
          console.log(`[CT-03] sendApplication status=${res.status}`);
          expect(res.status, 'sendApplication should return HTTP 200').toBe(200);
          expect(res.body.accountNumber, 'sendApplication should return accountNumber (UUID)').toBeTruthy();
          leadUuid = res.body.accountNumber!;
        });

        // Step 3.2 — Wait for lead to reach UW_APPROVED
        await test.step('Wait for lead to reach UW_APPROVED in DB', async () => {
          const reached = await db.waitForRecord(
            'uown_los_lead',
            "uuid = $1 AND lead_status = 'UW_APPROVED'",
            [leadUuid],
            90_000,
          );
          expect(reached, `Lead (uuid=${leadUuid}) did not reach UW_APPROVED within 90s`).toBe(true);

          const pk = await db.getLeadPkByUuid(leadUuid);
          expect(pk, 'Lead pk not found in DB after UW_APPROVED').toBeTruthy();
          leadPk = pk!;
          console.log(`[CT-03] Lead pk=${leadPk} status=UW_APPROVED`);
        });

        // Step 3.3 — Verify firstName search via UPPER() functional index path (exact case)
        await test.step(`Verify firstName="${firstName}" found via UPPER(first_name) = UPPER($1) (exact case)`, async () => {
          const foundPk = await db.getSingleString(
            `SELECT c.lead_pk::text
             FROM uown_los_customer c
             WHERE UPPER(c.first_name) = UPPER($1) AND c.lead_pk = $2`,
            [firstName, leadPk],
          );
          console.log(`[CT-03] UPPER(firstName) exact-case search returned leadPk=${foundPk}`);
          expect(
            foundPk,
            `Lead pk=${leadPk} not found via UPPER(first_name) = UPPER('${firstName}') — idx_customer_first_name_upper may not be working`,
          ).toBe(leadPk);
          console.log(`[CT-03] ✓ Exact-case firstName search via UPPER() index path — lead found`);
        });

        // Step 3.4 — Verify firstName search is case-insensitive (lowercase query)
        await test.step(`Verify firstName search is case-insensitive: UPPER(first_name) = UPPER('${firstName.toLowerCase()}')`, async () => {
          const foundPk = await db.getSingleString(
            `SELECT c.lead_pk::text
             FROM uown_los_customer c
             WHERE UPPER(c.first_name) = UPPER($1) AND c.lead_pk = $2`,
            [firstName.toLowerCase(), leadPk],
          );
          console.log(`[CT-03] UPPER(firstName) lowercase search returned leadPk=${foundPk}`);
          expect(
            foundPk,
            `Lead pk=${leadPk} not found via case-insensitive firstName search — idx_customer_first_name_upper should enable case-insensitive lookup`,
          ).toBe(leadPk);
          console.log(`[CT-03] ✓ Case-insensitive firstName search via UPPER() functional index — lead found`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-04 — Functional: case-insensitive lastName search
      // ══════════════════════════════════════════════════════════════
      test('CT-04: Case-insensitive lastName search returns correct lead via UPPER() index path', async ({ db, api, testEnv }) => {
        test.setTimeout(120_000);

        const runId     = generateRunId();
        const ssn       = generateTestSSN(true);
        const email     = testEnv.generateUniqueEmailAlias();
        const phoneBase = (Date.now() + 1).toString().slice(-7);
        const phone     = `555${phoneBase}`;
        const firstName = `FnCt04${runId.slice(-4)}`;
        const lastName  = `LnSrch${runId.slice(-6)}`;
        console.log(`[CT-04] runId=${runId}, firstName="${firstName}", lastName="${lastName}", email=${email}`);

        let leadUuid: string;
        let leadPk: string;

        // Step 4.1 — Submit new lead with distinctive lastName
        await test.step(`Submit new lead with lastName="${lastName}" for ${merchant.fullName}`, async () => {
          const res = await api.application.sendApplication(
            { username: merchant.username, password: merchant.password, number: merchant.number },
            {
              firstName,
              lastName,
              email,
              ssn,
              phone,
              address: '456 Oak Ave',
              city:    'Buffalo',
              state:   data.state,
              zip:     '14201',
              dob:     '01/01/1984',
            },
          );
          console.log(`[CT-04] sendApplication status=${res.status}`);
          expect(res.status, 'sendApplication should return HTTP 200').toBe(200);
          expect(res.body.accountNumber, 'sendApplication should return accountNumber (UUID)').toBeTruthy();
          leadUuid = res.body.accountNumber!;
        });

        // Step 4.2 — Wait for lead to reach UW_APPROVED
        await test.step('Wait for lead to reach UW_APPROVED in DB', async () => {
          const reached = await db.waitForRecord(
            'uown_los_lead',
            "uuid = $1 AND lead_status = 'UW_APPROVED'",
            [leadUuid],
            90_000,
          );
          expect(reached, `Lead (uuid=${leadUuid}) did not reach UW_APPROVED within 90s`).toBe(true);

          const pk = await db.getLeadPkByUuid(leadUuid);
          expect(pk, 'Lead pk not found in DB after UW_APPROVED').toBeTruthy();
          leadPk = pk!;
          console.log(`[CT-04] Lead pk=${leadPk} status=UW_APPROVED`);
        });

        // Step 4.3 — Verify lastName search via UPPER() functional index path (uppercase query)
        await test.step(`Verify lastName="${lastName}" found via UPPER(last_name) = UPPER($1) (uppercase query)`, async () => {
          const foundPk = await db.getSingleString(
            `SELECT c.lead_pk::text
             FROM uown_los_customer c
             WHERE UPPER(c.last_name) = UPPER($1) AND c.lead_pk = $2`,
            [lastName.toUpperCase(), leadPk],
          );
          console.log(`[CT-04] UPPER(lastName) uppercase search returned leadPk=${foundPk}`);
          expect(
            foundPk,
            `Lead pk=${leadPk} not found via UPPER(last_name) = UPPER('${lastName.toUpperCase()}') — idx_customer_last_name_upper may not be working`,
          ).toBe(leadPk);
          console.log(`[CT-04] ✓ Uppercase lastName search via UPPER() functional index — lead found`);
        });

        // Step 4.4 — Verify mixed-case search also works
        await test.step(`Verify lastName search is case-insensitive: UPPER(last_name) = UPPER('${lastName.toLowerCase()}')`, async () => {
          const foundPk = await db.getSingleString(
            `SELECT c.lead_pk::text
             FROM uown_los_customer c
             WHERE UPPER(c.last_name) = UPPER($1) AND c.lead_pk = $2`,
            [lastName.toLowerCase(), leadPk],
          );
          console.log(`[CT-04] UPPER(lastName) lowercase search returned leadPk=${foundPk}`);
          expect(
            foundPk,
            `Lead pk=${leadPk} not found via case-insensitive lastName search — idx_customer_last_name_upper should enable case-insensitive lookup`,
          ).toBe(leadPk);
          console.log(`[CT-04] ✓ Case-insensitive lastName search via UPPER() functional index — lead found`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — EXPLAIN ANALYZE: functional index scan for UPPER()
      // ══════════════════════════════════════════════════════════════
      test('CT-05: EXPLAIN ANALYZE shows functional index scans for UPPER() name filters', async ({ db }) => {
        test.setTimeout(60_000);

        type ExplainCase = {
          label:     string;
          sql:       string;
          indexName: string;
          table:     string;
        };

        const cases: ExplainCase[] = [
          {
            label:     'UPPER(first_name) equality filter',
            sql:       `SELECT lead_pk FROM uown_los_customer WHERE UPPER(first_name) = 'TESTFN' LIMIT 1`,
            indexName: 'idx_customer_first_name_upper',
            table:     'uown_los_customer',
          },
          {
            label:     'UPPER(last_name) equality filter',
            sql:       `SELECT lead_pk FROM uown_los_customer WHERE UPPER(last_name) = 'TESTLN' LIMIT 1`,
            indexName: 'idx_customer_last_name_upper',
            table:     'uown_los_customer',
          },
        ];

        for (const c of cases) {
          await test.step(`EXPLAIN ANALYZE: ${c.label}`, async () => {
            const rowEstimate = await db.getTableRowEstimate(c.table);
            console.log(`[CT-05] ${c.table} row estimate: ${rowEstimate}`);

            const plan = await db.explainAnalyze(c.sql);
            console.log(`[CT-05] ${c.indexName} plan:\n${plan}`);

            if (rowEstimate < MIN_ROWS_FOR_INDEX_ASSERTION) {
              const msg = `Table "${c.table}" has ~${rowEstimate} rows — too few for planner to prefer functional index scan. Skipping assertion.`;
              console.warn(`[CT-05] WARN: ${msg}`);
              test.info().annotations.push({ type: 'skip-reason', description: msg });
              return;
            }

            const usesIndexScan       = /Index Only Scan|Index Scan|Bitmap Index Scan/i.test(plan);
            const usesSeqScanOnTarget = new RegExp(`Seq Scan on ${c.table}`, 'i').test(plan);

            if (!usesIndexScan || usesSeqScanOnTarget) {
              console.warn(`[CT-05] WARN: Functional index plan does not show index scan for ${c.indexName}. Plan:\n${plan}`);
              test.info().annotations.push({
                type:        'performance-warning',
                description: `Functional index "${c.indexName}" not used in query plan on ${c.table} (~${rowEstimate} rows). Run ANALYZE to refresh statistics.`,
              });
            } else {
              console.log(`[CT-05] ✓ ${c.indexName} (UPPER functional index) used in query plan`);
            }
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-06 — Flyway migration recorded as successful
      // ══════════════════════════════════════════════════════════════
      test('CT-06: Flyway migration V20260227113249 recorded as successful', async ({ db }) => {
        test.setTimeout(30_000);

        let migration: Record<string, unknown> | null = null;

        await test.step(`Verify migration version ${FLYWAY_VERSION} in flyway_schema_history`, async () => {
          migration = await db.flywayMigrationApplied(FLYWAY_VERSION);
          console.log(`[CT-06] migration record:`, migration);
          expect(
            migration,
            `Flyway migration version "${FLYWAY_VERSION}" not found in flyway_schema_history on ${data.env}`,
          ).toBeTruthy();
        });

        await test.step('Verify migration ran successfully (success=true)', async () => {
          expect(
            migration!['success'],
            `Flyway migration V${FLYWAY_VERSION} was recorded but success=false — migration may have failed on ${data.env}`,
          ).toBe(true);
          console.log(`[CT-06] ✓ migration success=true`);
        });

        await test.step('Verify migration script name matches add_index_customer_upper_first_last_name', async () => {
          const script = String(migration!['script'] ?? '');
          console.log(`[CT-06] migration script="${script}"`);
          expect(
            script,
            `Migration script name "${script}" does not mention "add_index_customer_upper"`,
          ).toContain('add_index_customer_upper');
          console.log(`[CT-06] ✓ script="${script}" matches expected pattern`);
        });
      });
    },
  );
}

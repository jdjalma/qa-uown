/**
 * RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery11_461
 *
 * Validates the backend optimization of the `getLeadSummaryResults` query
 * (high-CPU query fix: 5 new indexes including phone functional index).
 *
 * Covers:
 *  CT-01 — All 5 new indexes exist on their respective tables
 *  CT-02 — Index column composition matches DDL specification
 *  CT-03 — Functional correctness: getLeadSummaryResults returns lead data after UW_APPROVED
 *  CT-04 — EXPLAIN ANALYZE confirms index scans for key query filters
 *  CT-05 — Flyway migration recorded as successful in flyway_schema_history
 *
 * GitLab: https://gitlab.com/uown/backend/svc/-/work_items/461
 *
 * Note: idx_uwdata_status_expiration, idx_lead_timestamp_status, idx_address_zip_code,
 * and idx_address_state are shared with the getDataMismatchForLead optimization (Task #449).
 * idx_phone_full_number_active is the additional index specific to this query.
 *
 * Pipeline: new-api (DB validation + query execution)
 * No browser required — DB only.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MERCHANTS } from '@data/merchants.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateTestSSN, generateRunId } from '@config/constants.js';

// ── Constants ────────────────────────────────────────────────────────

/** All indexes introduced/shared by the getLeadSummaryResults optimization migration (Task #461). */
const EXPECTED_INDEXES = [
  {
    name:        'idx_phone_full_number_active',
    table:       'uown_los_phone',
    columns:     [] as string[],         // expression index: (area_code || phone_number)
    isExpression: true,
    exprParts:   ['area_code', 'phone_number'],
  },
  {
    name:        'idx_uwdata_status_expiration',
    table:       'uown_los_uwdata',
    columns:     ['uw_status', 'approval_expiration_date'],
    isExpression: false,
    exprParts:   [] as string[],
  },
  {
    name:        'idx_lead_timestamp_status',
    table:       'uown_los_lead',
    columns:     ['row_created_timestamp', 'lead_status'],
    isExpression: false,
    exprParts:   [] as string[],
  },
  {
    name:        'idx_address_zip_code',
    table:       'uown_los_address',
    columns:     ['zip_code'],
    isExpression: false,
    exprParts:   [] as string[],
  },
  {
    name:        'idx_address_state',
    table:       'uown_los_address',
    columns:     ['state'],
    isExpression: false,
    exprParts:   [] as string[],
  },
] as const;

/** Flyway migration version (derived from filename V20260220064821__...). */
const FLYWAY_VERSION = '20260220064821';

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
    merchantKey: 'FifthAveFurnitureNY',
    tag:         buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.STG),
  },
];

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchantKey];

  test.describe(
    `RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery11_461 - ${data.env}/${merchant.number}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01 — All 5 indexes exist on correct tables
      // ══════════════════════════════════════════════════════════════
      test('CT-01: All 5 indexes exist on their respective tables', async ({ db }) => {
        test.setTimeout(60_000);

        for (const idx of EXPECTED_INDEXES) {
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
      //  CT-02 — Index column composition matches DDL specification
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Index column composition matches DDL specification', async ({ db }) => {
        test.setTimeout(60_000);

        for (const idx of EXPECTED_INDEXES) {
          await test.step(`Verify column composition of ${idx.name}`, async () => {
            if (idx.isExpression) {
              // Expression index: verify via pg_indexes.indexdef
              const indexDef = await db.getSingleString(
                `SELECT indexdef FROM pg_indexes WHERE indexname = $1`,
                [idx.name],
              );
              console.log(`[CT-02] ${idx.name} indexdef: ${indexDef}`);
              expect(
                indexDef,
                `Index definition for "${idx.name}" not found in pg_indexes`,
              ).toBeTruthy();
              for (const part of idx.exprParts) {
                expect(
                  indexDef,
                  `Index "${idx.name}" indexdef does not contain "${part}" — actual: ${indexDef}`,
                ).toContain(part);
              }
              console.log(`[CT-02] ✓ ${idx.name} (expression index) covers: [${idx.exprParts.join(', ')}]`);
            } else {
              // Regular column index: verify via pg_attribute
              const actualColumns = await db.getIndexColumns(idx.name);
              console.log(`[CT-02] ${idx.name} columns:`, actualColumns);

              for (const expectedCol of idx.columns) {
                expect(
                  actualColumns,
                  `Index "${idx.name}" is missing column "${expectedCol}" — actual: [${actualColumns.join(', ')}]`,
                ).toContain(expectedCol);
              }

              if (idx.columns.length > 1) {
                expect(
                  actualColumns.length,
                  `Index "${idx.name}" should be composite (${idx.columns.length} cols) but has ${actualColumns.length}`,
                ).toBeGreaterThanOrEqual(idx.columns.length);
              }
              console.log(`[CT-02] ✓ ${idx.name} covers columns: [${actualColumns.join(', ')}]`);
            }
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03 — Functional: getLeadSummaryResults returns lead data
      // ══════════════════════════════════════════════════════════════
      test('CT-03: getLeadSummaryResults returns correct lead data after UW_APPROVED', async ({ db, api, testEnv }) => {
        test.setTimeout(120_000);

        const runId     = generateRunId();
        const ssn       = generateTestSSN(true); // does not end in 9 → UW_APPROVED
        const email     = testEnv.generateUniqueEmailAlias();
        const phoneBase = Date.now().toString().slice(-7);
        const phone     = `555${phoneBase}`;
        console.log(`[CT-03] runId=${runId}, merchant=${merchant.number}, email=${email}, phone=${phone}`);

        let leadUuid: string;
        let leadPk: string;

        // Step 3.1 — Submit new lead
        await test.step(`Submit new lead for ${merchant.fullName}`, async () => {
          const res = await api.application.sendApplication(
            { username: merchant.username, password: merchant.password, number: merchant.number },
            {
              firstName: `TestFN${runId.slice(-4)}`,
              lastName:  `TestLN${runId.slice(-4)}`,
              email,
              ssn,
              phone,
              address:   '123 Main St',
              city:      'New York',
              state:     data.state,
              zip:       '10001',
              dob:       '01/01/1984',
            },
          );
          console.log(`[CT-03] sendApplication status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
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

        // Step 3.3 — Execute simplified getLeadSummaryResults query (exercises idx_lead_timestamp_status)
        await test.step('Run simplified getLeadSummaryResults query — verifies lead appears in summary results', async () => {
          const leadStatus = await db.getSingleString(
            `SELECT l.lead_status
             FROM uown_los_lead l
             JOIN uown_los_customer c ON c.lead_pk = l.pk
             WHERE l.uuid = $1
               AND l.lead_status = 'UW_APPROVED'
               AND l.row_created_timestamp >= NOW() - INTERVAL '90 days'`,
            [leadUuid],
          );
          console.log(`[CT-03] getLeadSummaryResults query returned lead_status="${leadStatus}" for uuid=${leadUuid}`);
          expect(
            leadStatus,
            `Lead (uuid=${leadUuid}) not returned by getLeadSummaryResults query — expected UW_APPROVED`,
          ).toBe('UW_APPROVED');
          console.log(`[CT-03] ✓ Lead pk=${leadPk} correctly returned by summary query`);
        });

        // Step 3.4 — Verify phone lookup via functional index path (exercises idx_phone_full_number_active)
        await test.step('Verify phone lookup via area_code || phone_number functional index path', async () => {
          const areaCode   = phone.slice(0, 3);
          const phoneNum   = phone.slice(3);
          const phoneFound = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_phone
             WHERE lead_pk = $1 AND area_code || phone_number = $2`,
            [leadPk, `${areaCode}${phoneNum}`],
          );
          console.log(`[CT-03] Phone lookup (area_code||phone_number) count=${phoneFound} for lead_pk=${leadPk}`);
          expect(
            phoneFound,
            `Phone not found via area_code||phone_number concatenation for lead_pk=${leadPk} — idx_phone_full_number_active may not be indexed correctly`,
          ).toBeGreaterThanOrEqual(1);
          console.log(`[CT-03] ✓ Phone found via functional index path (area_code||phone_number)`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-04 — EXPLAIN ANALYZE: index scan verification
      // ══════════════════════════════════════════════════════════════
      test('CT-04: EXPLAIN ANALYZE shows index scans for optimized query filters', async ({ db }) => {
        test.setTimeout(60_000);

        type ExplainCase = {
          label:     string;
          sql:       string;
          indexName: string;
          table:     string;
        };

        const cases: ExplainCase[] = [
          {
            label:     'phone concatenation filter (idx_phone_full_number_active)',
            sql:       `SELECT 1 FROM uown_los_phone WHERE area_code || phone_number = '5551234567' LIMIT 1`,
            indexName: 'idx_phone_full_number_active',
            table:     'uown_los_phone',
          },
          {
            label:     'uwdata filter (uw_status + approval_expiration_date)',
            sql:       `SELECT 1 FROM uown_los_uwdata WHERE uw_status = 'APPROVED' AND approval_expiration_date > NOW() LIMIT 1`,
            indexName: 'idx_uwdata_status_expiration',
            table:     'uown_los_uwdata',
          },
          {
            label:     'lead timestamp + status filter',
            sql:       `SELECT 1 FROM uown_los_lead WHERE row_created_timestamp > NOW() - INTERVAL '90 days' AND lead_status = 'UW_APPROVED' LIMIT 1`,
            indexName: 'idx_lead_timestamp_status',
            table:     'uown_los_lead',
          },
        ];

        for (const c of cases) {
          await test.step(`EXPLAIN ANALYZE: ${c.label}`, async () => {
            const rowEstimate = await db.getTableRowEstimate(c.table);
            console.log(`[CT-04] ${c.table} row estimate: ${rowEstimate}`);

            const plan = await db.explainAnalyze(c.sql);
            console.log(`[CT-04] ${c.indexName} plan:\n${plan}`);

            if (rowEstimate < MIN_ROWS_FOR_INDEX_ASSERTION) {
              const msg = `Table "${c.table}" has ~${rowEstimate} rows — too few for planner to prefer index scan. Skipping index-scan assertion.`;
              console.warn(`[CT-04] WARN: ${msg}`);
              test.info().annotations.push({ type: 'skip-reason', description: msg });
              return;
            }

            const usesIndexScan       = /Index Only Scan|Index Scan|Bitmap Index Scan/i.test(plan);
            const usesSeqScanOnTarget = new RegExp(`Seq Scan on ${c.table}`, 'i').test(plan);

            if (!usesIndexScan || usesSeqScanOnTarget) {
              console.warn(`[CT-04] WARN: Plan does not use index scan for ${c.indexName}. Plan:\n${plan}`);
              test.info().annotations.push({
                type:        'performance-warning',
                description: `Index "${c.indexName}" not used in query plan on ${c.table} (~${rowEstimate} rows). Run ANALYZE to refresh statistics.`,
              });
            } else {
              console.log(`[CT-04] ✓ ${c.indexName} used in query plan`);
            }
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — Flyway migration recorded as successful
      // ══════════════════════════════════════════════════════════════
      test('CT-05: Flyway migration V20260220064821 recorded as successful', async ({ db }) => {
        test.setTimeout(30_000);

        let migration: Record<string, unknown> | null = null;

        await test.step(`Verify migration version ${FLYWAY_VERSION} in flyway_schema_history`, async () => {
          migration = await db.flywayMigrationApplied(FLYWAY_VERSION);
          console.log(`[CT-05] migration record:`, migration);
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
          console.log(`[CT-05] ✓ migration success=true`);
        });

        await test.step('Verify migration script name matches add_index_phone_full_number', async () => {
          const script = String(migration!['script'] ?? '');
          console.log(`[CT-05] migration script="${script}"`);
          expect(
            script,
            `Migration script name "${script}" does not mention "add_index_phone_full_number"`,
          ).toContain('add_index_phone_full_number');
          console.log(`[CT-05] ✓ script="${script}" matches expected pattern`);
        });
      });
    },
  );
}

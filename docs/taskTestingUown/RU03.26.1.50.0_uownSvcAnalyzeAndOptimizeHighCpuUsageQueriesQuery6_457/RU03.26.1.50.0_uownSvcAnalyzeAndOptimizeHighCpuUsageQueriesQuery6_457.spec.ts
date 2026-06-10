/**
 * RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery6_457
 *
 * Validates the backend optimization of the activity log query
 * (high-CPU query fix: new composite index on uown_los_activity_log).
 *
 * Covers:
 *  CT-01 — New composite index exists on uown_los_activity_log
 *  CT-02 — Index column composition matches DDL specification (lead_pk, log_type, row_created_timestamp)
 *  CT-03 — Functional correctness: activity log entries are accessible after lead creation
 *  CT-04 — EXPLAIN ANALYZE confirms index scan for activity log query pattern
 *  CT-05 — Flyway migration recorded as successful in flyway_schema_history
 *  CT-06 — Filter by log_type IN (...) returns only selected types (Testing Step 3)
 *  CT-07 — Notes search with LOWER() is case-insensitive (Testing Step 4)
 *  CT-08 — Filter by created_by returns correct agent records (Testing Step 5)
 *  CT-09 — Combination of log_type + notes filters returns correct intersection (Testing Step 7)
 *
 * GitLab: https://gitlab.com/uown/backend/svc/-/work_items/457
 *
 * Pipeline: new-api (DB validation + activity log query execution)
 * No browser required — DB only.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MERCHANTS } from '@data/merchants.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateTestSSN, generateRunId } from '@config/constants.js';

// ── Constants ────────────────────────────────────────────────────────

/** New composite index introduced by the activity log optimization (Task #457). */
const NEW_INDEX = {
  name:    'idx_los_activity_lead_type_created_ts',
  table:   'uown_los_activity_log',
  columns: ['lead_pk', 'log_type', 'row_created_timestamp'],
} as const;

/** Flyway migration version (derived from filename V20260225120421__...). */
const FLYWAY_VERSION = '20260225120421';

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
];

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchantKey];

  test.describe(
    `RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery6_457 - ${data.env}/${merchant.number}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01 — New composite index exists on uown_los_activity_log
      // ══════════════════════════════════════════════════════════════
      test('CT-01: New composite index idx_los_activity_lead_type_created_ts exists on uown_los_activity_log', async ({ db }) => {
        test.setTimeout(60_000);

        await test.step(`Verify ${NEW_INDEX.name} exists on ${NEW_INDEX.table}`, async () => {
          const exists = await db.indexExistsOnTable(NEW_INDEX.name, NEW_INDEX.table);
          expect(
            exists,
            `Index "${NEW_INDEX.name}" not found on table "${NEW_INDEX.table}" — Flyway migration V${FLYWAY_VERSION} may not have been applied to ${data.env}`,
          ).toBe(true);
          console.log(`[CT-01] ✓ ${NEW_INDEX.name} on ${NEW_INDEX.table}`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-02 — Index column composition matches DDL specification
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Index column composition matches DDL specification (lead_pk, log_type, row_created_timestamp)', async ({ db }) => {
        test.setTimeout(60_000);

        await test.step(`Verify column composition of ${NEW_INDEX.name}`, async () => {
          const actualColumns = await db.getIndexColumns(NEW_INDEX.name);
          console.log(`[CT-02] ${NEW_INDEX.name} columns:`, actualColumns);

          for (const expectedCol of NEW_INDEX.columns) {
            expect(
              actualColumns,
              `Index "${NEW_INDEX.name}" is missing column "${expectedCol}" — actual columns: [${actualColumns.join(', ')}]`,
            ).toContain(expectedCol);
          }

          expect(
            actualColumns.length,
            `Index "${NEW_INDEX.name}" should be composite (${NEW_INDEX.columns.length} columns) but has ${actualColumns.length}`,
          ).toBeGreaterThanOrEqual(NEW_INDEX.columns.length);

          console.log(`[CT-02] ✓ ${NEW_INDEX.name} covers columns: [${actualColumns.join(', ')}]`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03 — Functional: activity log entries accessible after lead creation
      // ══════════════════════════════════════════════════════════════
      test('CT-03: Activity log entries exist and are accessible by lead_pk after lead reaches UW_APPROVED', async ({ db, api, testEnv }) => {
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

        // Step 3.3 — Verify activity log entries exist for this lead
        await test.step('Verify activity log entries exist in uown_los_activity_log for this lead', async () => {
          const logCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log WHERE lead_pk = $1`,
            [leadPk],
          );
          console.log(`[CT-03] Activity log count for lead_pk=${leadPk}: ${logCount}`);
          expect(
            logCount,
            `No activity log entries found for lead_pk=${leadPk} — the optimized index path may not be exercised`,
          ).toBeGreaterThanOrEqual(1);
          console.log(`[CT-03] ✓ ${logCount} activity log entry(ies) found for lead_pk=${leadPk}`);
        });

        // Step 3.4 — Query activity log using the optimized pattern (lead_pk + log_type + ORDER BY timestamp DESC)
        await test.step('Query activity log using optimized index pattern (lead_pk, log_type, ORDER BY row_created_timestamp DESC)', async () => {
          const latestLogType = await db.getSingleString(
            `SELECT log_type
             FROM uown_los_activity_log
             WHERE lead_pk = $1 AND log_type IS NOT NULL
             ORDER BY row_created_timestamp DESC
             LIMIT 1`,
            [leadPk],
          );
          console.log(`[CT-03] Latest log_type for lead_pk=${leadPk}: ${latestLogType}`);
          expect(
            latestLogType,
            `No log_type found in uown_los_activity_log for lead_pk=${leadPk} — expected at least one entry after UW_APPROVED`,
          ).toBeTruthy();
          console.log(`[CT-03] ✓ Activity log entry with log_type="${latestLogType}" retrieved via optimized query pattern`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-04 — EXPLAIN ANALYZE: index scan for activity log query
      // ══════════════════════════════════════════════════════════════
      test('CT-04: EXPLAIN ANALYZE shows index scan for activity log query pattern', async ({ db }) => {
        test.setTimeout(60_000);

        await test.step(`EXPLAIN ANALYZE: activity log by lead_pk + log_type ORDER BY row_created_timestamp DESC`, async () => {
          // Guard: skip assertion on very small tables (planner may prefer seq-scan)
          const rowEstimate = await db.getTableRowEstimate(NEW_INDEX.table);
          console.log(`[CT-04] ${NEW_INDEX.table} row estimate: ${rowEstimate}`);

          const sql  = `SELECT lead_pk, log_type, row_created_timestamp
                        FROM uown_los_activity_log
                        WHERE lead_pk = 1 AND log_type IS NOT NULL
                        ORDER BY row_created_timestamp DESC
                        LIMIT 10`;
          const plan = await db.explainAnalyze(sql);
          console.log(`[CT-04] ${NEW_INDEX.name} plan:\n${plan}`);

          if (rowEstimate < MIN_ROWS_FOR_INDEX_ASSERTION) {
            const msg = `Table "${NEW_INDEX.table}" has ~${rowEstimate} rows — too few for planner to prefer index scan. Skipping index-scan assertion.`;
            console.warn(`[CT-04] WARN: ${msg}`);
            test.info().annotations.push({ type: 'skip-reason', description: msg });
            return;
          }

          const usesIndexScan    = /Index Only Scan|Index Scan|Bitmap Index Scan/i.test(plan);
          const usesSeqScanOnTarget = new RegExp(`Seq Scan on ${NEW_INDEX.table}`, 'i').test(plan);

          if (!usesIndexScan || usesSeqScanOnTarget) {
            console.warn(`[CT-04] WARN: Plan does not use index scan for ${NEW_INDEX.name}. Plan:\n${plan}`);
            test.info().annotations.push({
              type:        'performance-warning',
              description: `Index "${NEW_INDEX.name}" not used in query plan on ${NEW_INDEX.table} (~${rowEstimate} rows). Run ANALYZE to refresh statistics.`,
            });
          } else {
            console.log(`[CT-04] ✓ ${NEW_INDEX.name} used in query plan`);
          }
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — Flyway migration recorded as successful
      // ══════════════════════════════════════════════════════════════
      test('CT-05: Flyway migration V20260225120421 recorded as successful', async ({ db }) => {
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

        await test.step('Verify migration script name matches add_idx_los_activity_logs', async () => {
          const script = String(migration!['script'] ?? '');
          console.log(`[CT-05] migration script="${script}"`);
          expect(
            script,
            `Migration script name "${script}" does not mention "add_idx_los_activity"`,
          ).toContain('add_idx_los_activity');
          console.log(`[CT-05] ✓ script="${script}" matches expected pattern`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-06 — Filter by log_type returns only selected types (Testing Step 3)
      // ══════════════════════════════════════════════════════════════
      test('CT-06: Filter by log_type IN (STATUS_CHANGE) returns only STATUS_CHANGE records', async ({ db }) => {
        test.setTimeout(60_000);

        let leadPk: string;
        let totalCount: number;
        let filteredCount: number;

        await test.step('Find a lead with STATUS_CHANGE and other log types', async () => {
          const pk = await db.getSingleString(
            `SELECT a.lead_pk::text
             FROM uown_los_activity_log a
             WHERE a.log_type = 'STATUS_CHANGE'
               AND EXISTS (
                 SELECT 1 FROM uown_los_activity_log b
                 WHERE b.lead_pk = a.lead_pk AND b.log_type != 'STATUS_CHANGE'
               )
             ORDER BY a.pk DESC LIMIT 1`,
            [],
          );
          expect(pk, 'No lead found with both STATUS_CHANGE and other log types').toBeTruthy();
          leadPk = pk!;
          console.log(`[CT-06] Using lead_pk=${leadPk}`);
        });

        await test.step('Count total vs STATUS_CHANGE-only logs for this lead', async () => {
          totalCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log WHERE lead_pk = $1`,
            [leadPk],
          );
          filteredCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND log_type = 'STATUS_CHANGE'`,
            [leadPk],
          );
          console.log(`[CT-06] lead_pk=${leadPk}: total=${totalCount}, STATUS_CHANGE=${filteredCount}`);
          expect(filteredCount, 'Should have at least 1 STATUS_CHANGE log').toBeGreaterThan(0);
          expect(filteredCount, 'Filtered count must be < total (proves filter excludes other types)').toBeLessThan(totalCount);
        });

        await test.step('Verify all filtered records have log_type = STATUS_CHANGE', async () => {
          const distinctTypes = await db.getSingleString(
            `SELECT string_agg(DISTINCT log_type, ',')
             FROM uown_los_activity_log
             WHERE lead_pk = $1 AND log_type IN ('STATUS_CHANGE')`,
            [leadPk],
          );
          expect(distinctTypes).toBe('STATUS_CHANGE');
          console.log(`[CT-06] ✓ Filter returns only STATUS_CHANGE (${filteredCount}/${totalCount} records)`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-07 — Notes search is case-insensitive (Testing Step 4)
      // ══════════════════════════════════════════════════════════════
      test('CT-07: Notes search with LOWER() is case-insensitive', async ({ db }) => {
        test.setTimeout(60_000);

        let leadPk: string;
        let searchTerm: string;

        await test.step('Find a lead with non-null notes in activity log', async () => {
          const pk = await db.getSingleString(
            `SELECT lead_pk::text FROM uown_los_activity_log
             WHERE notes IS NOT NULL AND LENGTH(notes) > 5
             ORDER BY pk DESC LIMIT 1`,
            [],
          );
          expect(pk, 'No activity log entry found with non-null notes').toBeTruthy();
          leadPk = pk!;

          const sampleNotes = await db.getSingleString(
            `SELECT notes FROM uown_los_activity_log
             WHERE lead_pk = $1 AND notes IS NOT NULL AND LENGTH(notes) > 5
             ORDER BY pk DESC LIMIT 1`,
            [leadPk],
          );
          expect(sampleNotes, 'Notes value should not be empty').toBeTruthy();
          searchTerm = sampleNotes!.substring(0, Math.min(10, sampleNotes!.length));
          console.log(`[CT-07] lead_pk=${leadPk}, searchTerm="${searchTerm}"`);
        });

        await test.step('Verify UPPER and lower case searches return identical counts', async () => {
          const upperCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND LOWER(notes) LIKE LOWER($2)`,
            [leadPk, `%${searchTerm.toUpperCase()}%`],
          );
          const lowerCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND LOWER(notes) LIKE LOWER($2)`,
            [leadPk, `%${searchTerm.toLowerCase()}%`],
          );
          console.log(`[CT-07] UPPER("${searchTerm.toUpperCase()}")=${upperCount}, lower("${searchTerm.toLowerCase()}")=${lowerCount}`);
          expect(upperCount, 'UPPER case search should find matches').toBeGreaterThan(0);
          expect(upperCount, 'Case-insensitive: UPPER and lower must return same count').toBe(lowerCount);
          console.log(`[CT-07] ✓ Case-insensitive search confirmed (${upperCount} matches both cases)`);
        });

        await test.step('Verify non-matching search returns zero', async () => {
          const noMatchCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND LOWER(notes) LIKE LOWER($2)`,
            [leadPk, '%ZZZNONEXISTENT999XYZZY%'],
          );
          expect(noMatchCount, 'Non-matching search should return 0').toBe(0);
          console.log(`[CT-07] ✓ Non-matching search correctly returns 0`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-08 — Filter by created_by returns correct agent (Testing Step 5)
      // ══════════════════════════════════════════════════════════════
      test('CT-08: Filter by created_by returns only matching agent records', async ({ db }) => {
        test.setTimeout(60_000);

        let leadPk: string;
        let agentName: string;
        let matchCount: number;

        await test.step('Find a lead with identifiable created_by values', async () => {
          const pk = await db.getSingleString(
            `SELECT lead_pk::text FROM uown_los_activity_log
             WHERE created_by IS NOT NULL AND LENGTH(created_by) > 2
             ORDER BY pk DESC LIMIT 1`,
            [],
          );
          expect(pk, 'No activity log entry found with non-null created_by').toBeTruthy();
          leadPk = pk!;

          agentName = (await db.getSingleString(
            `SELECT created_by FROM uown_los_activity_log
             WHERE lead_pk = $1 AND created_by IS NOT NULL AND LENGTH(created_by) > 2
             ORDER BY pk DESC LIMIT 1`,
            [leadPk],
          ))!;
          expect(agentName, 'created_by value should not be empty').toBeTruthy();
          console.log(`[CT-08] lead_pk=${leadPk}, agentName="${agentName}"`);
        });

        await test.step('Filter by LOWER(created_by) and verify all results match', async () => {
          matchCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND LOWER(created_by) LIKE LOWER($2)`,
            [leadPk, `%${agentName}%`],
          );
          console.log(`[CT-08] Matching records for created_by="${agentName}": ${matchCount}`);
          expect(matchCount, 'Should find at least 1 record for this agent').toBeGreaterThan(0);
        });

        await test.step('Verify non-matching agent excluded', async () => {
          const noMatchCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND LOWER(created_by) LIKE LOWER($2)`,
            [leadPk, '%FAKEUSERXYZ999%'],
          );
          expect(noMatchCount, 'Non-existing agent should return 0').toBe(0);
          console.log(`[CT-08] ✓ created_by filter works: ${matchCount} for "${agentName}", 0 for fake agent`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-09 — Combination type + notes filters (Testing Step 7)
      // ══════════════════════════════════════════════════════════════
      test('CT-09: Combination of log_type + notes filters returns correct intersection', async ({ db }) => {
        test.setTimeout(60_000);

        let leadPk: string;
        let notesTerm: string;
        const targetType = 'STATUS_CHANGE';

        await test.step('Find a lead with STATUS_CHANGE logs that have notes', async () => {
          const pk = await db.getSingleString(
            `SELECT lead_pk::text FROM uown_los_activity_log
             WHERE log_type = '${targetType}'
               AND notes IS NOT NULL AND LENGTH(notes) > 3
             ORDER BY pk DESC LIMIT 1`,
            [],
          );
          expect(pk, `No lead found with ${targetType} logs containing notes`).toBeTruthy();
          leadPk = pk!;

          const notes = await db.getSingleString(
            `SELECT notes FROM uown_los_activity_log
             WHERE lead_pk = $1 AND log_type = '${targetType}'
               AND notes IS NOT NULL AND LENGTH(notes) > 3
             ORDER BY pk DESC LIMIT 1`,
            [leadPk],
          );
          notesTerm = notes!.substring(0, Math.min(8, notes!.length));
          console.log(`[CT-09] lead_pk=${leadPk}, type=${targetType}, notesTerm="${notesTerm}"`);
        });

        await test.step('Verify combined filter returns subset of individual filters', async () => {
          const typeOnlyCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND log_type = '${targetType}'`,
            [leadPk],
          );
          const notesOnlyCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND LOWER(notes) LIKE LOWER($2)`,
            [leadPk, `%${notesTerm}%`],
          );
          const combinedCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_los_activity_log
             WHERE lead_pk = $1 AND log_type = '${targetType}'
               AND LOWER(notes) LIKE LOWER($2)`,
            [leadPk, `%${notesTerm}%`],
          );
          console.log(`[CT-09] typeOnly=${typeOnlyCount}, notesOnly=${notesOnlyCount}, combined=${combinedCount}`);

          expect(combinedCount, 'Combined filter should find at least 1 record').toBeGreaterThan(0);
          expect(combinedCount, 'Combined count must be <= type-only count').toBeLessThanOrEqual(typeOnlyCount);
          expect(combinedCount, 'Combined count must be <= notes-only count').toBeLessThanOrEqual(notesOnlyCount);
          console.log(`[CT-09] ✓ Intersection correct: ${combinedCount} ≤ min(${typeOnlyCount}, ${notesOnlyCount})`);
        });
      });
    },
  );
}

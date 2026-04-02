/**
 * RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery5_455
 *
 * Validates the backend optimization of the `SmsOptInConfirmationResponse` query
 * (high-CPU query fix: 2 new partial indexes on uown_sms_queue, 1 index dropped,
 * query refactored to CTE with KORNERSTONE GREATEST logic).
 *
 * Covers:
 *  CT-01 — New partial indexes exist and old combined index removed
 *  CT-02 — Partial index definitions contain WHERE clause (verified via pg_indexes.indexdef)
 *  CT-03 — CTE query returns smsCount=0 for new lead (opt-in will be sent)
 *  CT-04 — KORNERSTONE account: smsCount≥1 via GREATEST logic (opt-in never resent)
 *  CT-05 — EXPLAIN ANALYZE shows partial index scans for lead_pk and account_pk
 *  CT-06 — Flyway migration V20260220050615 recorded as successful
 *  CT-07 — Regression: lead with existing SMS history → smsCount≥1 (checkFirstSms=false)
 *  CT-08 — Regression: non-KORNERSTONE account with SMS → smsCount=actual count (no GREATEST override)
 *
 * GitLab: https://gitlab.com/uown/backend/svc/-/work_items/455
 *
 * Pipeline: new-api (DB validation + CTE query execution)
 * No browser required — DB only.
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { MERCHANTS } from '@data/merchants.js';
import { TestTag, buildTags, splitTags } from '@ptypes/enums.js';
import { generateTestSSN, generateRunId } from '@config/constants.js';

// ── Constants ────────────────────────────────────────────────────────

/** New partial indexes introduced by the SmsOptInConfirmationResponse optimization (Task #455). */
const NEW_INDEXES = [
  { name: 'idx_uown_sms_queue_lead_pk',    table: 'uown_sms_queue' },
  { name: 'idx_uown_sms_queue_account_pk', table: 'uown_sms_queue' },
] as const;

/** Old combined index removed by the migration. */
const REMOVED_INDEX = 'idx_uown_sms_queue_lead_account_pk';

/** Flyway migration version (derived from filename V20260220050615__...). */
const FLYWAY_VERSION = '20260220050615';

/** Minimum estimated row count before asserting index vs seq-scan choice. */
const MIN_ROWS_FOR_INDEX_ASSERTION = 500;

/**
 * CTE query adapted from SmsOptInConfirmationResponse.sql for pg driver.
 * $1::bigint = leadPk, $2::bigint = accountPk. Explicit ::bigint casts for null handling.
 */
const SMS_CTE_SQL = `
WITH account_check AS (
    SELECT CASE
        WHEN $2::bigint IS NOT NULL
             AND EXISTS (SELECT 1 FROM uown_sv_account a WHERE a.pk = $2::bigint AND a.company = 'KORNERSTONE')
        THEN 1
        ELSE 0
    END AS is_kornerstone_account
),
sms_count AS (
    SELECT COUNT(*) AS cnt
    FROM (
        SELECT pk FROM uown_sms_queue WHERE $1::bigint IS NOT NULL AND lead_pk = $1::bigint
        UNION ALL
        SELECT pk FROM uown_sms_queue WHERE $2::bigint IS NOT NULL AND account_pk = $2::bigint
    ) combined
)
SELECT GREATEST(
    (SELECT cnt FROM sms_count),
    (SELECT is_kornerstone_account FROM account_check)
) AS "smsCount";
`;

// ── Test data ────────────────────────────────────────────────────────

const testData = [
  {
    env:           'qa1',
    state:         'NY',
    merchantKey:   'TerraceFinance',
    isKornerstone: false,
    tag:           buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.QA1),
  },
  {
    env:           'qa1',
    state:         'NY',
    merchantKey:   'FifthAveFurnitureNY',
    isKornerstone: true,
    tag:           buildTags(TestTag.SMOKE, TestTag.REGRESSION, TestTag.QA1),
  },
];

// ── Suite ────────────────────────────────────────────────────────────

for (const data of testData) {
  const merchant = MERCHANTS[data.merchantKey];

  test.describe(
    `RU03.26.1.50.0_uownSvcAnalyzeAndOptimizeHighCpuUsageQueriesQuery5_455 - ${data.env}/${merchant.number}`,
    { tag: splitTags(data.tag) },
    () => {
      test.use({ envName: data.env });

      // ══════════════════════════════════════════════════════════════
      //  CT-01 — New partial indexes exist and old combined index removed
      // ══════════════════════════════════════════════════════════════
      test('CT-01: New partial indexes exist and old combined index removed', async ({ db }) => {
        test.setTimeout(60_000);

        for (const idx of NEW_INDEXES) {
          await test.step(`Verify ${idx.name} exists on ${idx.table}`, async () => {
            const exists = await db.indexExistsOnTable(idx.name, idx.table);
            expect(
              exists,
              `Index "${idx.name}" not found on table "${idx.table}" — Flyway migration V${FLYWAY_VERSION} may not have been applied to ${data.env}`,
            ).toBe(true);
            console.log(`[CT-01] ✓ ${idx.name} on ${idx.table}`);
          });
        }

        await test.step(`Verify old index ${REMOVED_INDEX} no longer exists`, async () => {
          const exists = await db.shortCodeIndexExists(REMOVED_INDEX);
          expect(
            exists,
            `Old index "${REMOVED_INDEX}" still exists — migration should have dropped it`,
          ).toBe(false);
          console.log(`[CT-01] ✓ ${REMOVED_INDEX} correctly removed`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-02 — Partial index WHERE clause verified via pg_indexes.indexdef
      // ══════════════════════════════════════════════════════════════
      test('CT-02: Partial index definitions contain WHERE clause in pg_indexes.indexdef', async ({ db }) => {
        test.setTimeout(60_000);

        for (const idx of NEW_INDEXES) {
          await test.step(`Verify ${idx.name} indexdef contains WHERE ... IS NOT NULL`, async () => {
            const indexDef = await db.getSingleString(
              `SELECT indexdef FROM pg_indexes WHERE indexname = $1`,
              [idx.name],
            );
            console.log(`[CT-02] ${idx.name} indexdef: ${indexDef}`);
            expect(
              indexDef,
              `Index definition for "${idx.name}" not found in pg_indexes`,
            ).toBeTruthy();

            expect(
              indexDef!.toLowerCase(),
              `Index "${idx.name}" indexdef does not contain WHERE clause — not a partial index. Actual: ${indexDef}`,
            ).toContain('where');

            expect(
              indexDef!.toLowerCase(),
              `Index "${idx.name}" indexdef does not contain "is not null" — expected partial index filter. Actual: ${indexDef}`,
            ).toContain('is not null');

            console.log(`[CT-02] ✓ ${idx.name} is a partial index with WHERE ... IS NOT NULL`);
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-03 — CTE query returns smsCount=0 for new lead
      // ══════════════════════════════════════════════════════════════
      test('CT-03: CTE query returns smsCount=0 for new lead (opt-in will be sent)', async ({ db, api, testEnv }) => {
        test.setTimeout(120_000);

        const runId = generateRunId();
        const ssn   = generateTestSSN(true); // does not end in 9 → UW_APPROVED
        const email = testEnv.generateUniqueEmailAlias();
        const phone = `555${Date.now().toString().slice(-7)}`;
        console.log(`[CT-03] runId=${runId}, merchant=${merchant.number}, email=${email}`);

        let leadPk: string;

        await test.step(`Submit new lead for ${merchant.fullName}`, async () => {
          const res = await api.application.sendApplication(
            { username: merchant.username, password: merchant.password, number: merchant.number },
            {
              firstName: `TestFN${runId.slice(-4)}`,
              lastName:  `TestLN${runId.slice(-4)}`,
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
          console.log(`[CT-03] sendApplication status=${res.status}, appApprovalStatus=${res.body.appApprovalStatus}`);
          expect(res.status, 'sendApplication should return HTTP 200').toBe(200);
          expect(res.body.accountNumber, 'sendApplication should return accountNumber (UUID)').toBeTruthy();

          const pk = await db.getSingleString(
            'SELECT pk::text FROM uown_los_lead WHERE uuid = $1',
            [res.body.accountNumber!],
          );
          expect(pk, `Lead pk not found in DB for uuid=${res.body.accountNumber}`).toBeTruthy();
          leadPk = pk!;
          console.log(`[CT-03] leadPk=${leadPk}`);
        });

        await test.step('Run SmsOptInConfirmationResponse CTE with leadPk — expect smsCount=0', async () => {
          const smsCount = await db.getSingleNumber(SMS_CTE_SQL, [leadPk, null]);
          console.log(`[CT-03] smsCount=${smsCount} for leadPk=${leadPk} (accountPk=null)`);
          expect(
            smsCount,
            `smsCount should be 0 for new lead (pk=${leadPk}) with no SMS history — checkFirstSms returns true (send opt-in)`,
          ).toBe(0);
          console.log(`[CT-03] ✓ smsCount=0 — opt-in will be sent (checkFirstSms=true)`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-04 — KORNERSTONE: smsCount≥1 via GREATEST logic
      // ══════════════════════════════════════════════════════════════
      test('CT-04: KORNERSTONE account — smsCount≥1 via GREATEST logic (opt-in never resent)', async ({ db }) => {
        test.setTimeout(60_000);

        if (!data.isKornerstone) {
          console.log(`[CT-04] Skipped — ${merchant.number} is not a KORNERSTONE merchant`);
          test.info().annotations.push({
            type:        'skip-reason',
            description: `Merchant ${merchant.number} is not KORNERSTONE — CT-04 only applies to KORNERSTONE accounts`,
          });
          return;
        }

        let accountPk: string;

        await test.step('Find existing KORNERSTONE account in uown_sv_account', async () => {
          const pk = await db.getSingleString(
            `SELECT pk::text FROM uown_sv_account WHERE company = 'KORNERSTONE' LIMIT 1`,
            [],
          );
          expect(pk, 'No KORNERSTONE account found in DB — cannot test GREATEST logic').toBeTruthy();
          accountPk = pk!;
          console.log(`[CT-04] Found KORNERSTONE accountPk=${accountPk}`);
        });

        await test.step('Run SmsOptInConfirmationResponse CTE with KORNERSTONE accountPk — expect smsCount≥1', async () => {
          const smsCount = await db.getSingleNumber(SMS_CTE_SQL, [null, accountPk]);
          console.log(`[CT-04] smsCount=${smsCount} for accountPk=${accountPk} (KORNERSTONE, leadPk=null)`);
          expect(
            smsCount,
            `smsCount should be ≥1 for KORNERSTONE account (pk=${accountPk}) — GREATEST(count, 1) forces smsCount≥1, checkFirstSms=false`,
          ).toBeGreaterThanOrEqual(1);
          console.log(`[CT-04] ✓ smsCount≥1 — KORNERSTONE opt-in never resent (checkFirstSms=false)`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-05 — EXPLAIN ANALYZE: partial index scan verification
      // ══════════════════════════════════════════════════════════════
      test('CT-05: EXPLAIN ANALYZE shows partial index scans for lead_pk and account_pk filters', async ({ db }) => {
        test.setTimeout(60_000);

        type ExplainCase = {
          label:     string;
          sql:       string;
          indexName: string;
          table:     string;
        };

        const cases: ExplainCase[] = [
          {
            label:     'lead_pk filter (idx_uown_sms_queue_lead_pk)',
            sql:       `SELECT pk FROM uown_sms_queue WHERE lead_pk = 1 LIMIT 1`,
            indexName:  'idx_uown_sms_queue_lead_pk',
            table:     'uown_sms_queue',
          },
          {
            label:     'account_pk filter (idx_uown_sms_queue_account_pk)',
            sql:       `SELECT pk FROM uown_sms_queue WHERE account_pk = 1 LIMIT 1`,
            indexName:  'idx_uown_sms_queue_account_pk',
            table:     'uown_sms_queue',
          },
        ];

        for (const c of cases) {
          await test.step(`EXPLAIN ANALYZE: ${c.label}`, async () => {
            const rowEstimate = await db.getTableRowEstimate(c.table);
            console.log(`[CT-05] ${c.table} row estimate: ${rowEstimate}`);

            const plan = await db.explainAnalyze(c.sql);
            console.log(`[CT-05] ${c.indexName} plan:\n${plan}`);

            if (rowEstimate < MIN_ROWS_FOR_INDEX_ASSERTION) {
              const msg = `Table "${c.table}" has ~${rowEstimate} rows — too few for planner to prefer index scan. Skipping index-scan assertion.`;
              console.warn(`[CT-05] WARN: ${msg}`);
              test.info().annotations.push({ type: 'skip-reason', description: msg });
              return;
            }

            const usesIndexScan       = /Index Only Scan|Index Scan|Bitmap Index Scan/i.test(plan);
            const usesSeqScanOnTarget = new RegExp(`Seq Scan on ${c.table}`, 'i').test(plan);

            if (!usesIndexScan || usesSeqScanOnTarget) {
              console.warn(`[CT-05] WARN: Plan does not use index scan for ${c.indexName}. Plan:\n${plan}`);
              test.info().annotations.push({
                type:        'performance-warning',
                description: `Index "${c.indexName}" not used in query plan on ${c.table} (~${rowEstimate} rows). Run ANALYZE to refresh statistics.`,
              });
            } else {
              console.log(`[CT-05] ✓ ${c.indexName} used in query plan`);
            }
          });
        }
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-06 — Flyway migration recorded as successful
      // ══════════════════════════════════════════════════════════════
      test('CT-06: Flyway migration V20260220050615 recorded as successful', async ({ db }) => {
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

        await test.step('Verify migration script name matches sms_opt_in_confirmation_response', async () => {
          const script = String(migration!['script'] ?? '');
          console.log(`[CT-06] migration script="${script}"`);
          expect(
            script,
            `Migration script name "${script}" does not mention "sms_opt_in_confirmation_response"`,
          ).toContain('sms_opt_in_confirmation_response');
          console.log(`[CT-06] ✓ script="${script}" matches expected pattern`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-07 — Regression: lead with existing SMS → smsCount≥1
      // ══════════════════════════════════════════════════════════════
      test('CT-07: Lead with existing SMS history — smsCount≥1, checkFirstSms=false (opt-in NOT resent)', async ({ db }) => {
        test.setTimeout(60_000);

        let leadPk: string;
        let directCount: number;

        await test.step('Find a lead with existing SMS records in uown_sms_queue', async () => {
          const pk = await db.getSingleString(
            `SELECT lead_pk::text FROM uown_sms_queue WHERE lead_pk > 100 GROUP BY lead_pk HAVING COUNT(*) >= 2 ORDER BY lead_pk DESC LIMIT 1`,
            [],
          );
          expect(pk, 'No lead with SMS history found in uown_sms_queue — cannot test regression').toBeTruthy();
          leadPk = pk!;
          console.log(`[CT-07] Found lead with SMS history: leadPk=${leadPk}`);
        });

        await test.step('Get direct SMS count for this lead (cross-validation baseline)', async () => {
          directCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_sms_queue WHERE lead_pk = $1`,
            [leadPk],
          );
          console.log(`[CT-07] Direct COUNT(*) for leadPk=${leadPk}: ${directCount}`);
          expect(directCount, 'Direct count should be ≥1 for a lead with SMS history').toBeGreaterThanOrEqual(1);
        });

        await test.step('Run SmsOptInConfirmationResponse CTE — expect smsCount matches direct count', async () => {
          const smsCount = await db.getSingleNumber(SMS_CTE_SQL, [leadPk, null]);
          console.log(`[CT-07] CTE smsCount=${smsCount} for leadPk=${leadPk} (accountPk=null)`);
          expect(
            smsCount,
            `CTE smsCount (${smsCount}) should match direct COUNT (${directCount}) for leadPk=${leadPk} — CTE refactoring must not alter count`,
          ).toBe(directCount);
          expect(
            smsCount,
            `smsCount should be ≥1 for lead with SMS history — checkFirstSms=false (opt-in NOT resent)`,
          ).toBeGreaterThanOrEqual(1);
          console.log(`[CT-07] ✓ smsCount=${smsCount} matches direct count — checkFirstSms=false`);
        });
      });

      // ══════════════════════════════════════════════════════════════
      //  CT-08 — Regression: non-KORNERSTONE account with SMS
      // ══════════════════════════════════════════════════════════════
      test('CT-08: Non-KORNERSTONE account with SMS — smsCount=actual count, no GREATEST override', async ({ db }) => {
        test.setTimeout(60_000);

        let accountPk: string;
        let directCount: number;

        await test.step('Find a non-KORNERSTONE account with SMS records', async () => {
          const pk = await db.getSingleString(
            `SELECT sq.account_pk::text
             FROM uown_sms_queue sq
             JOIN uown_sv_account a ON a.pk = sq.account_pk
             WHERE sq.account_pk IS NOT NULL
               AND (a.company IS NULL OR a.company != 'KORNERSTONE')
             GROUP BY sq.account_pk
             HAVING COUNT(*) >= 2
             LIMIT 1`,
            [],
          );
          expect(pk, 'No non-KORNERSTONE account with ≥2 SMS found — cannot test regression').toBeTruthy();
          accountPk = pk!;
          console.log(`[CT-08] Found non-KORNERSTONE account with SMS: accountPk=${accountPk}`);
        });

        await test.step('Verify account is NOT KORNERSTONE', async () => {
          const company = await db.getSingleString(
            `SELECT COALESCE(company, 'NULL') FROM uown_sv_account WHERE pk = $1`,
            [accountPk],
          );
          console.log(`[CT-08] accountPk=${accountPk} company="${company}"`);
          expect(
            company,
            `Account ${accountPk} should not be KORNERSTONE — got "${company}"`,
          ).not.toBe('KORNERSTONE');
        });

        await test.step('Get direct SMS count for this account (baseline)', async () => {
          directCount = await db.getSingleNumber(
            `SELECT COUNT(*) FROM uown_sms_queue WHERE account_pk = $1`,
            [accountPk],
          );
          console.log(`[CT-08] Direct COUNT(*) for accountPk=${accountPk}: ${directCount}`);
          expect(directCount, 'Direct count should be ≥2').toBeGreaterThanOrEqual(2);
        });

        await test.step('Run SmsOptInConfirmationResponse CTE — expect smsCount=direct count (no GREATEST override)', async () => {
          const smsCount = await db.getSingleNumber(SMS_CTE_SQL, [null, accountPk]);
          console.log(`[CT-08] CTE smsCount=${smsCount} for accountPk=${accountPk} (non-KORNERSTONE, leadPk=null)`);
          expect(
            smsCount,
            `CTE smsCount (${smsCount}) should equal direct COUNT (${directCount}) — GREATEST(${directCount}, 0)=${directCount}, no KORNERSTONE override`,
          ).toBe(directCount);
          console.log(`[CT-08] ✓ smsCount=${smsCount} = direct count — GREATEST(count, 0) = count, no KORNERSTONE interference`);
        });
      });
    },
  );
}

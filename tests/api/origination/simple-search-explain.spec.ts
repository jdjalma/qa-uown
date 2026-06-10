/**
 * DB-direct EXPLAIN ANALYZE tests for svc#454 (R1.52.0).
 *
 * SPEC: docs/taskTestingUown/RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454/spec.md
 *       §8.6 (CT-BUG-2, CT-BUG-3)
 *
 * SCOPE (post strategy revision 2026-05-24):
 *   - CT-BUG-2 — `ByInvoiceNum` plan must use `idx_los_invoice_merchant_invoice_number_upper`
 *   - CT-BUG-3 — `ByLast4CC` plan must use a `cc_last_four_digit` index
 *
 *   The original API-PRE-* / API-MT-* / API-EDGE-* CTs were REMOVED — they
 *   exercised the Next.js BFF proxy + cookie session machinery, not the
 *   backend SQL. The same backend behaviour is covered by the UI specs
 *   (regra inviolável #14 — UI-first; see spec §15). CT-BUG-1 moved to a
 *   browser-fetch E2E (`tests/e2e/origination/simple-search-bug1.spec.ts`).
 *
 * Why DB-direct (justification per regra #14 §b):
 *   EXPLAIN ANALYZE is a side-channel proof of query plan — no HTTP, no UI
 *   affordance can substitute. Validating that the optimizer picks the
 *   expression index is exactly the kind of "cross-cutting DB validation"
 *   the rule whitelists.
 *
 * Activity log (regra #13): N/A — pure read-only EXPLAIN, no business action.
 *
 * Environment: env-agnostic (uses ENV= from .env or CLI). The
 * `uown_sv_sql_config` rows + expression indexes from MR !1370 must be
 * deployed. Source-tag for fixture choices: live qa1 data 2026-05-24
 * (Karen invoice R1925054, lead 4019 dedup gold case with 26 CCs).
 */
import { test, expect } from '@fixtures/test-context.fixture.js';
import { TestTag, buildTags, splitTags } from '../../../src/types/enums.js';
import { explainAnalyzeSqlConfig } from '@helpers/search-sql-explain.helpers.js';

const BASE_TAG = `${buildTags(TestTag.REGRESSION)} @svc-454 @simple-search @db-direct`;

// Fixed invoice — Karen's invoice in qa1. Lower drift risk than leadPk because
// invoices are persistent strings (not reseed-reassigned). Still, if the
// optimizer plan stops referencing the upper-index, that's the bug we want
// to surface (BUG-2 regression), not a fixture rot.
const KAREN_INVOICE = 'R1925054';

// Lead 4019 has 26 CCs sharing last4 `2225` — dedup gold case for BUG-3.
const DEDUP_LAST4 = '2225';

test.describe(
  'RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454 — DB-direct EXPLAIN (LOS search SQLs)',
  { tag: splitTags(BASE_TAG) },
  () => {
    test(
      '[BUG-2] CT-BUG-2 — ByInvoiceNum must not Seq Scan uown_los_invoice',
      async ({ db }) => {
        const result = await explainAnalyzeSqlConfig(db, 'GETLOSSEARCH_BYINVOICENUM', {
          searchString: KAREN_INVOICE,
        });
        expect(
          result.hasSeqScan('uown_los_invoice'),
          `BUG-2: plan must not contain Seq Scan on uown_los_invoice. Plan:\n${result.plan.join('\n')}`,
        ).toBe(false);
        const indexLines = result.plan.filter(
          (l) => /Index Scan|Bitmap Index Scan/.test(l) && /uown_los_invoice/i.test(l),
        );
        expect(
          indexLines.length,
          'BUG-2: at least one Index/Bitmap Scan line must reference uown_los_invoice',
        ).toBeGreaterThan(0);
      },
    );

    test(
      '[BUG-3] CT-BUG-3 — ByLast4CC must use a cc_last_four_digit index',
      async ({ db }) => {
        const result = await explainAnalyzeSqlConfig(db, 'GETLOSSEARCH_BYLAST4CC', {
          searchString: DEDUP_LAST4,
        });
        expect(
          result.hasSeqScan('uown_los_credit_card'),
          `BUG-3: plan must not Seq Scan uown_los_credit_card. Plan:\n${result.plan.join('\n')}`,
        ).toBe(false);
        // The exact index name is not pinned — the fix MR may pick any name.
        // Require at least one Index/Bitmap line referencing cc_last_four_digit.
        const indexLines = result.plan.filter(
          (l) => /Index Scan|Bitmap Index Scan/.test(l) && /cc_last_four_digit/i.test(l),
        );
        expect(
          indexLines.length,
          'BUG-3: at least one Index/Bitmap Scan line must reference cc_last_four_digit',
        ).toBeGreaterThan(0);
      },
    );
  },
);

/**
 * EXPLAIN ANALYZE helper for the SQLs stored in `uown_sv_sql_config`.
 *
 * Used by CT-BUG-2 / CT-BUG-3 of svc#454 (SPEC §8.6) to prove that:
 *   - `GETLOSSEARCH_BYINVOICENUM` uses the expression index
 *     `idx_los_invoice_merchant_invoice_number_upper` (not Seq Scan)
 *   - `GETLOSSEARCH_BYLAST4CC` is supported by a `cc_last_four_digit` index
 *     and dedups by `lead_pk` (lead 4019 = 1 row, not 26)
 *
 * The helper substitutes the named `:param` placeholders found in the SQL
 * config with PostgreSQL literals so that `EXPLAIN ANALYZE` can be run
 * directly (named params cannot be bound to EXPLAIN by pg in the same shape).
 *
 * Pattern lifted from `src/scripts/audit-search-sqls.ts` (already in the repo)
 * so behaviour stays consistent. SELECT-only — no mutation.
 */
import type { DatabaseHelpers } from './database.helpers.js';

export interface ExplainParams {
  /** Raw search string — substituted for `:searchString`. */
  searchString: string;
  /** Substituted for `:allMerchants`. Default `'true'` (literal SQL boolean). */
  allMerchants?: string;
  /** Substituted for `:merchantRefCodes`. Default `''` (literal empty string). */
  merchantRefCodes?: string;
  /** Substituted for `:maxResults`. Default `100`. */
  maxResults?: number;
  /** Substituted for `:fromResults`. Default `0`. */
  fromResults?: number;
}

export interface ExplainAnalyzeResult {
  /** Full plan returned by `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)`. */
  plan: string[];
  /** The SQL that was executed (post substitution). Useful for debug output. */
  executedSql: string;
  /** Parsed `Execution Time: N ms` line (PostgreSQL emits it last). */
  executionTimeMs: number;
  /** Returns true if any line of the plan references the index by name. */
  usesIndex(indexName: string): boolean;
  /** Returns true if the plan contains `Seq Scan on {table}`. */
  hasSeqScan(table: string): boolean;
}

/**
 * Fetches the SQL stored in `uown_sv_sql_config` by name (case-insensitive —
 * the backend uppercases). Returns the raw SQL text.
 */
export async function getSqlByName(db: DatabaseHelpers, sqlName: string): Promise<string> {
  const row = await db.queryOne<{ sql_query: string }>(
    `SELECT sql_query FROM uown_sv_sql_config WHERE UPPER(sql_name) = UPPER($1) LIMIT 1`,
    [sqlName],
  );
  if (!row) {
    throw new Error(`SQL config "${sqlName}" not found in uown_sv_sql_config (env mismatch?)`);
  }
  return row.sql_query;
}

/**
 * Substitutes `:param` placeholders with literal values and runs EXPLAIN
 * ANALYZE. The substituted SQL is intended for `EXPLAIN` only — production
 * code paths bind parameters at runtime.
 *
 * Search strings are wrapped in single quotes; embedded apostrophes are
 * doubled (basic SQL escape). The other parameters (`allMerchants`,
 * `merchantRefCodes`, `maxResults`, `fromResults`) are injected as raw
 * literals — callers supply pre-escaped values.
 */
export async function explainAnalyzeSqlConfig(
  db: DatabaseHelpers,
  sqlName: string,
  params: ExplainParams,
): Promise<ExplainAnalyzeResult> {
  const rawSql = await getSqlByName(db, sqlName);
  const escapedSearch = `'${params.searchString.replace(/'/g, "''")}'`;
  const allMerchants = params.allMerchants ?? 'true';
  const merchantRefCodes = params.merchantRefCodes ?? "''";
  const maxResults = params.maxResults ?? 100;
  const fromResults = params.fromResults ?? 0;

  const substituted = rawSql
    .replace(/:searchString/g, escapedSearch)
    .replace(/:allMerchants/g, allMerchants)
    .replace(/:merchantRefCodes/g, merchantRefCodes)
    .replace(/:maxResults/g, String(maxResults))
    .replace(/:fromResults/g, String(fromResults));

  const rows = await db.query<{ 'QUERY PLAN': string }>(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${substituted}`,
  );
  const plan = rows.map((r) => r['QUERY PLAN']);

  // PostgreSQL emits "Execution Time: 0.123 ms" near the end of the plan.
  let executionTimeMs = NaN;
  for (let i = plan.length - 1; i >= 0; i--) {
    const m = plan[i].match(/Execution Time:\s*([\d.]+)\s*ms/);
    if (m) {
      executionTimeMs = parseFloat(m[1]);
      break;
    }
  }

  return {
    plan,
    executedSql: substituted,
    executionTimeMs,
    usesIndex(indexName: string): boolean {
      return plan.some((line) => line.includes(indexName));
    },
    hasSeqScan(table: string): boolean {
      const needle = `Seq Scan on ${table}`;
      return plan.some((line) => line.includes(needle));
    },
  };
}

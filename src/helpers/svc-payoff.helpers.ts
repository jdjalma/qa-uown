/**
 * Helpers for parsing svc payoff/EPO data.
 *
 * `parseEpoBreakdown` consumes the `epoBreakdown` field returned by
 * `SvcPayoffClient.getAccountSummary()` (typed `string[][]` in the canonical
 * response, but tolerated as `(string | null)[][]` here because the parallel
 * `settlementAmountBreakdown` shape in `ServicingInformationResponse` accepts
 * null rows and frontends share the same renderer).
 *
 * Each inner row is conventionally `[label, value]`. Labels are matched by
 * case-insensitive substring so cosmetic backend changes (extra spaces,
 * trailing units) do not silently break the parse.
 */

export interface EpoBreakdown {
  cashPrice: number;
  processingFee: number;
  buyoutFee: number;
  /** Tax rate as a percentage (e.g. 8.25 for 8.25%). */
  taxRate: number;
  /** Computed tax amount: `(cashPrice - processingFee - buyoutFee) * taxRate / 100`. */
  taxAmount: number;
  /** Computed EPO total: `cashPrice + taxAmount`. */
  computed90DayTotal: number;
  /** Raw rows as received from the API (for debugging or downstream rendering). */
  rawBreakdown: (string | null)[][];
}

interface LabelMatcher {
  key: keyof Omit<EpoBreakdown, 'taxAmount' | 'computed90DayTotal' | 'rawBreakdown'>;
  /** Substrings to look for (case-insensitive). First match wins. */
  needles: string[];
}

const MATCHERS: LabelMatcher[] = [
  { key: 'cashPrice', needles: ['cash price', 'cost price', 'cost/cash price'] },
  { key: 'processingFee', needles: ['processing fee'] },
  { key: 'buyoutFee', needles: ['buyout fee', 'buy out fee', 'buy-out fee'] },
  { key: 'taxRate', needles: ['tax rate'] },
];

/**
 * Parses a numeric value from a string cell. Tolerates currency symbols,
 * thousand separators, trailing percent signs, and whitespace. Returns 0
 * when the value cannot be parsed (caller decides whether to treat that as
 * a hard failure).
 */
function parseNumericCell(value: string | null | undefined): number {
  if (value == null) return 0;
  const cleaned = value.replace(/[$,%\s]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Maps an `epoBreakdown` payload (rows of `[label, value]`) into a typed
 * object with the canonical fields plus a computed 90-day total.
 *
 * Behavior:
 *   - Unmatched rows are kept in `rawBreakdown` but do not populate fields.
 *   - Missing fields default to 0 (no exception).
 *   - `taxAmount` is derived from `(cashPrice - processingFee - buyoutFee) * taxRate / 100`.
 *   - `computed90DayTotal = cashPrice + taxAmount`.
 */
export function parseEpoBreakdown(
  epoBreakdown: (string | null)[][] | null | undefined,
): EpoBreakdown {
  const rows: (string | null)[][] = epoBreakdown ?? [];

  const parsed: Record<LabelMatcher['key'], number> = {
    cashPrice: 0,
    processingFee: 0,
    buyoutFee: 0,
    taxRate: 0,
  };

  for (const row of rows) {
    if (!row || row.length < 2) continue;
    const label = (row[0] ?? '').toString().toLowerCase();
    if (!label) continue;

    for (const matcher of MATCHERS) {
      if (matcher.needles.some((needle) => label.includes(needle))) {
        parsed[matcher.key] = parseNumericCell(row[1]);
        break;
      }
    }
  }

  const netCash = parsed.cashPrice - parsed.processingFee - parsed.buyoutFee;
  const taxAmount = +(netCash * (parsed.taxRate / 100)).toFixed(2);
  const computed90DayTotal = +(parsed.cashPrice + taxAmount).toFixed(2);

  return {
    cashPrice: parsed.cashPrice,
    processingFee: parsed.processingFee,
    buyoutFee: parsed.buyoutFee,
    taxRate: parsed.taxRate,
    taxAmount,
    computed90DayTotal,
    rawBreakdown: rows,
  };
}

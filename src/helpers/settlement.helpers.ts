/**
 * Settlement Amount calculation helpers — independent oracle for
 * uown/frontend/servicing#512 (R1.52.0 SettlementAmountService).
 *
 * The backend formula (see SPEC §1 + business-rules):
 *
 *   discountRate = offerPercent(daysDelinquent) / 100
 *   settlement   = (TCA − totalPayments) × (1 − discountRate)
 *                  + totalFees + protectionPlanFee
 *
 * `offerPercent` is the DISCOUNT offered (0/30/50/65) — NOT what the
 * customer pays. Days-delinquent band map (canonical):
 *
 *   days ≤ 60   → 0%   (no discount — full balance)
 *   61 ≤ d ≤ 90 → 30%
 *   91 ≤ d ≤ 150→ 50%
 *   d ≥ 151     → 65%
 *
 * Used as a CORRECTNESS ORACLE in tests — we compute the expected
 * settlement independently of the API response and compare to both the
 * UI rendered value AND the API value. Divergence between any pair
 * surfaces a bug in either backend SQL (`getSettlementAmount.sql`),
 * frontend formatting (BUG-4, BUG-5), or our oracle.
 */

export interface CalculateSettlementInput {
  /** Total Contract Amount (TCA) — RAW lease amount before fees. */
  tca: number;
  /** Sum of all customer payments to date. */
  totalPayments: number;
  /** Days delinquent (from `uown_sv_sched_summary.delinquency_as_of_date`). */
  daysDelinquent: number;
  /** Total fees (late fees, NSF, etc.) included in settlement. */
  totalFees: number;
  /** Protection Plan fee (when active and due). 0 when no PP. */
  ppFee?: number;
}

/**
 * Returns the discount percent (0/30/50/65) for the given days-delinquent.
 * Exposed for tests that need to assert the band label rendered in the modal.
 */
export function offerPercentForDays(daysDelinquent: number): 0 | 30 | 50 | 65 {
  if (daysDelinquent <= 60) return 0;
  if (daysDelinquent <= 90) return 30;
  if (daysDelinquent <= 150) return 50;
  return 65;
}

/**
 * Compute the expected Settlement Amount for the given inputs.
 *
 * Returns a number rounded to 2 decimals (matches USD currency precision).
 * Floating-point IEEE 754 noise is silenced by `Math.round(x * 100) / 100`
 * — callers should compare via `toBeCloseTo(expected, 2)` regardless to
 * stay robust against backend rounding (see memory `feedback_float_repr_not_bug`).
 */
export function calculateSettlement(input: CalculateSettlementInput): number {
  const { tca, totalPayments, daysDelinquent, totalFees } = input;
  const ppFee = input.ppFee ?? 0;
  const discount = offerPercentForDays(daysDelinquent) / 100;
  const remainingPrincipal = tca - totalPayments;
  const discounted = remainingPrincipal * (1 - discount);
  const raw = discounted + totalFees + ppFee;
  return Math.round(raw * 100) / 100;
}

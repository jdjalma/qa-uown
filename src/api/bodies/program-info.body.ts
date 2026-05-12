/**
 * Request body for POST /uown/createOrUpdateProgram.
 *
 * Maps to svc `ProgramInfo.java` DTO (com.uownleasing.svc.pojo.ProgramInfo).
 * Controller: `MerchantProgramController.addProgramToMerchant` (line 130-133)
 * Service: `MerchantProgramService.createOrUpdate` — validates
 *   `activationDate <= deactivationDate` and recomputes `active` from the
 *   window on every save (dates are source of truth, not the flag).
 *
 * Notes on Java ↔ JSON mapping:
 * - `activationDate` / `deactivationDate` are `LocalDate` with
 *   `@JsonFormat(pattern = "yyyy-MM-dd")` — send strings in `YYYY-MM-DD`.
 * - `states` in the Java DTO is a raw comma-separated `String`, not an array.
 *   The builder accepts `string | string[]` for ergonomics and normalizes.
 * - `allowedFrequencyOverride` is also a `String` (comma-separated) in Java.
 * - `programPk`: omit (or 0) to create; include an existing PK to update.
 */
export interface ProgramInfoBody {
  /** Foreign-key target merchant. Required for create flows. */
  merchantPk?: number;
  /** Omit (or 0) for create; pass existing PK for update. */
  programPk?: number;
  programId?: string;
  programName?: string;
  termMonths?: number;
  programType?: string;
  /** Reflects the window but backend overwrites from `activationDate`/`deactivationDate`. */
  active?: boolean;
  groupName?: string | null;
  /** ISO YYYY-MM-DD. `null` clears the lower bound (program active immediately). */
  activationDate?: string | null;
  /** ISO YYYY-MM-DD. `null` clears the upper bound (program never auto-deactivates). */
  deactivationDate?: string | null;
  moneyFactor?: number;
  quickPayPct?: number;
  payoffDiscount?: number;
  dealerDiscount?: number;
  maxDollarAmount?: number;
  dealerRebate?: number;
  epoDays?: number;
  epoFeePercent?: number;
  minCartAmount?: number;
  maxCartAmount?: number;
  lendingCategoryType?: string;
  /** Comma-separated string as stored by backend (e.g. "WEEKLY,BI_WEEKLY"). */
  allowedFrequencyOverride?: string;
  /** Comma-separated state codes (e.g. "AL,AK,CA"). */
  states?: string;
  processingFeeOverride?: number;
  amountChargedAtSigning?: number;
  peakCampaignId?: number;
  offPeakCampaignId?: number;
  chargeAppFeeIfDeliveryIsZero?: boolean;
}

/** Ergonomic override shape — lets callers pass string[] for list fields. */
export interface ProgramInfoBodyOverrides extends Omit<ProgramInfoBody, 'states' | 'allowedFrequencyOverride'> {
  states?: string | string[];
  allowedFrequencyOverride?: string | string[];
}

function normalizeList(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value.join(',') : value;
}

/**
 * Builds a `ProgramInfoBody` with sensible defaults that match the backend's
 * own JPA defaults (so a create call with no overrides yields a valid program).
 *
 * Required override for create: `merchantPk`, `programName`, `termMonths`.
 * For update: pass `programPk` plus whichever fields to change.
 */
export function buildProgramInfoBody(
  overrides: ProgramInfoBodyOverrides = {},
): ProgramInfoBody {
  const { states, allowedFrequencyOverride, ...rest } = overrides;

  const defaults: ProgramInfoBody = {
    termMonths: 13,
    programType: 'SAME_AS_CASH',
    lendingCategoryType: 'LTO',
    moneyFactor: 0,
    quickPayPct: 0,
    payoffDiscount: 0,
    dealerDiscount: 0,
    dealerRebate: 0,
    epoDays: 90,
    epoFeePercent: 0,
    minCartAmount: 0,
    maxCartAmount: 0,
    amountChargedAtSigning: 0,
    active: true,
  };

  const normalizedStates = normalizeList(states);
  const normalizedFrequency = normalizeList(allowedFrequencyOverride);

  return {
    ...defaults,
    ...rest,
    ...(normalizedStates !== undefined && { states: normalizedStates }),
    ...(normalizedFrequency !== undefined && { allowedFrequencyOverride: normalizedFrequency }),
  };
}

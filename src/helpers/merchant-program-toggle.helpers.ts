/**
 * Temporarily restricts a merchant to a single term by deactivating every
 * program whose `termMonths` does not match the desired term.
 *
 * Why this exists (svc#531 R1.52.0 — 16m EPO for CA):
 *   In qa1, `sendApplication` for Daniel's Jewelers + CA + random SSN approves
 *   at ~$1820, and the BlackBox underwriter only declares 13m as the eligible
 *   term at that amount cap. The `paymentDetailsList` returned by `sendInvoice`
 *   therefore contains a single entry with `termInMonths=13`, blocking any
 *   16m test path.
 *
 *   The SSNs documented in skill `ssn-test-modalities` as "16m-direct"
 *   (`888880916`) are profile-bound in qa1 (`DataMismatchStep` / `FutureFpdCheckStep`)
 *   and cannot be reused with a fresh test profile.
 *
 *   The cleanest workaround that does NOT require seeded credentials is to
 *   deactivate every 13m program on the merchant for the duration of the
 *   `sendApplication` window. With only 16m programs active, the BlackBox
 *   amount cap can only resolve to 16m, and `paymentDetailsList` returns the
 *   16m entry. The 13m programs are restored immediately after the lead is
 *   approved so other concurrent tests are not affected longer than needed.
 *
 * Mechanism:
 *   Backend `MerchantProgramService.createOrUpdate` recomputes
 *   `programInfo.active` from `activationDate` / `deactivationDate` on every
 *   save (skill `application-lifecycle` pitfall + body docstring). Setting
 *   `deactivationDate` to yesterday immediately deactivates the program;
 *   restoring it to the captured original value (`null` if it had none)
 *   reactivates it.
 *
 * NOTE: this helper mutates merchant configuration. Always wrap calls in a
 * try/finally so `restore()` runs even on failure — leaving programs in
 * altered state breaks downstream tests on the same merchant.
 */
import type { ApiClients } from '../support/base-test.js';
import type { ProgramInfo } from '../api/responses/merchant.response.js';
import type { ProgramInfoBody } from '../api/bodies/program-info.body.js';
import { calculateDateISO } from './date.helpers.js';

interface ProgramSnapshot {
  programPk: number;
  termMonths: number;
  /** Original `activationDate` (null/undefined means no lower bound). */
  originalActivationDate: string | null;
  /** Full sanitized ProgramInfo captured before mutation (used during restore). */
  snapshot: ProgramInfoBody;
}

/**
 * Maps a `ProgramInfo` (server-side shape) into a `ProgramInfoBody` (request
 * shape). Drops fields the backend does not accept on update and normalises
 * `null` → `undefined` for date fields so the JSON body matches what svc
 * persisted originally.
 */
function sanitizeProgramInfo(info: ProgramInfo): ProgramInfoBody {
  return {
    programPk: info.programPk,
    programId: info.programId,
    programName: info.programName,
    termMonths: info.termMonths,
    programType: info.programType,
    active: info.active,
    groupName: info.groupName ?? null,
    activationDate: info.activationDate ?? null,
    deactivationDate: info.deactivationDate ?? null,
    peakCampaignId: info.peakCampaignId,
    offPeakCampaignId: info.offPeakCampaignId,
    moneyFactor: info.moneyFactor,
    quickPayPct: info.quickPayPct,
    payoffDiscount: info.payoffDiscount,
    chargeAppFeeIfDeliveryIsZero: info.chargeAppFeeIfDeliveryIsZero,
    dealerDiscount: info.dealerDiscount,
    maxDollarAmount: info.maxDollarAmount,
    dealerRebate: info.dealerRebate,
    epoDays: info.epoDays,
    epoFeePercent: info.epoFeePercent,
    minCartAmount: info.minCartAmount,
    maxCartAmount: info.maxCartAmount,
    lendingCategoryType: info.lendingCategoryType,
    allowedFrequencyOverride: info.allowedFrequencyOverride,
    states: info.states,
    processingFeeOverride: info.processingFeeOverride,
    amountChargedAtSigning: info.amountChargedAtSigning,
  };
}

export interface ProgramToggleResult {
  /** Programs that were touched (and need restoring). */
  deactivated: ProgramSnapshot[];
  /** All 16m programs that remain active (sanity for the caller). */
  remainingForTerm: ProgramSnapshot[];
  /** Restores every deactivated program back to its captured `deactivationDate`. */
  restore: () => Promise<void>;
}

/**
 * Snapshots the merchant's current programs, deactivates everything not in
 * `desiredTerm`, and returns a `restore()` closure that rewinds the change.
 *
 * Throws when no program for `desiredTerm` remains active after the toggle —
 * that means the merchant cannot run an application in that term at all, and
 * the test would only fail later in `sendApplication` for an unrelated reason.
 */
export async function restrictMerchantToSingleTerm(
  api: ApiClients,
  merchantPk: number,
  desiredTerm: number,
): Promise<ProgramToggleResult> {
  const listResp = await api.merchant.getMerchantProgramsByMerchantPk(merchantPk);
  if (!listResp.ok) {
    throw new Error(
      `restrictMerchantToSingleTerm: getMerchantProgramsByMerchant(${merchantPk}) responded ${listResp.status}`,
    );
  }

  const today = calculateDateISO(0);
  // svc rejects `deactivationDate` <= today (validator
  // `MerchantProgramService.createOrUpdate` — "deactivationDate must be in
  // the future"). Use `activationDate` set far in the future instead: that
  // makes `today < activationDate` so the program window evaluates to
  // inactive immediately. Restored on tear-down from the original snapshot.
  const farFutureActivation = '9999-12-31';

  const deactivated: ProgramSnapshot[] = [];
  const remainingForTerm: ProgramSnapshot[] = [];

  for (const wrapper of listResp.body ?? []) {
    const info = wrapper.programInfo;
    if (!info?.programPk || info.termMonths === undefined) continue;

    const isCurrentlyActive = isActiveOnDate(info.activationDate, info.deactivationDate, today);

    if (info.termMonths === desiredTerm) {
      if (isCurrentlyActive) {
        remainingForTerm.push({
          programPk: info.programPk,
          termMonths: info.termMonths,
          originalActivationDate: info.activationDate ?? null,
          snapshot: sanitizeProgramInfo(info),
        });
      }
      continue;
    }

    if (!isCurrentlyActive) continue;

    // Send the existing programInfo back with ONLY `deactivationDate` changed.
    // svc validates `program_name` uniqueness on every save; if we send a
    // skinny body, svc populates defaults from the builder (e.g. termMonths=13)
    // and treats the row as a NEW program with a name that already exists →
    // 400 "Program with the given name already exists". Including the full
    // existing record keeps the update path stable.
    const updateResp = await api.merchant.createOrUpdateProgram({
      ...sanitizeProgramInfo(info),
      programPk: info.programPk,
      activationDate: farFutureActivation,
      deactivationDate: farFutureActivation,
    });
    if (!updateResp.ok) {
      throw new Error(
        `restrictMerchantToSingleTerm: failed to deactivate programPk=${info.programPk} (${info.programName}): ${updateResp.status} ${JSON.stringify(updateResp.body).slice(0, 200)}`,
      );
    }
    deactivated.push({
      programPk: info.programPk,
      termMonths: info.termMonths,
      originalActivationDate: info.activationDate ?? null,
      snapshot: sanitizeProgramInfo(info),
    });
  }

  if (remainingForTerm.length === 0) {
    // Roll back what we already did before raising — otherwise the merchant
    // ends up with everything off.
    await restoreSnapshots(api, deactivated);
    throw new Error(
      `restrictMerchantToSingleTerm: merchant ${merchantPk} has no active program for termMonths=${desiredTerm}; aborting`,
    );
  }

  return {
    deactivated,
    remainingForTerm,
    restore: () => restoreSnapshots(api, deactivated),
  };
}

async function restoreSnapshots(
  api: ApiClients,
  snapshots: ProgramSnapshot[],
): Promise<void> {
  const failures: string[] = [];
  for (const snap of snapshots) {
    const resp = await api.merchant.createOrUpdateProgram({
      ...snap.snapshot,
      activationDate: snap.originalActivationDate,
    });
    if (!resp.ok) {
      failures.push(`programPk=${snap.programPk} status=${resp.status} body=${JSON.stringify(resp.body).slice(0, 120)}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `restoreSnapshots: failed to restore ${failures.length} program(s): ${failures.join('; ')}`,
    );
  }
}

function isActiveOnDate(
  activationDate: string | null | undefined,
  deactivationDate: string | null | undefined,
  todayIso: string,
): boolean {
  if (activationDate && todayIso < activationDate) return false;
  if (deactivationDate && todayIso > deactivationDate) return false;
  return true;
}

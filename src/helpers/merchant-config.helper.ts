/**
 * Merchant preflight: ensure merchant settings + program catalog match the
 * brand-specific contract before creating a new application.
 * See `.claude/context/shared/application-lifecycle-protocol.md § Pitfall #10`.
 *
 * Invoked automatically by `createPreQualifiedApplication`. Env flags:
 *   - `AUTO_HEAL_MERCHANT` (default: true) — auto-fix drift via svc APIs
 *   - `MERCHANT_PREFLIGHT_DRY_RUN` (default: false) — only log drift, no mutation
 *
 * Skipped automatically when caller passes `skip: true` (e.g., flows that
 * operate on already-created leases/accounts).
 */

import type { ApiClients } from '../support/base-test.js';
import {
  resolveContract,
  resolveBrand,
  type MerchantConfigContract,
  type MerchantConfigDrift,
} from '../data/merchant-config-contract.js';
import type { MerchantProgram } from '../api/responses/merchant.response.js';

export interface EnsureMerchantReadyOptions {
  skip?: boolean;
  /** Override AUTO_HEAL_MERCHANT env flag for a single call. */
  autoHeal?: boolean;
  /** Override MERCHANT_PREFLIGHT_DRY_RUN env flag for a single call. */
  dryRun?: boolean;
}

export interface EnsureMerchantReadyResult {
  merchantPk: number;
  drift: MerchantConfigDrift[];
  healed: boolean;
}

function countProgramsByTerm(programs: MerchantProgram[], term: number): number {
  return programs.filter((p) => {
    const info = p.programInfo;
    if (!info || info.termMonths !== term) return false;
    return info.active !== false;
  }).length;
}

/**
 * Count programs that are currently active on today's date based on the
 * activation/deactivation date window. This is stricter than `countProgramsByTerm`:
 * a program may be `active: true` but have `deactivationDate` in the past, which
 * counts as "not currently active" per the Source of Truth rule (dates prevail over flag).
 *
 * Used for `minActivePrograms` contract enforcement.
 */
function countActiveProgramsByTerm(programs: MerchantProgram[], term: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return programs.filter((p) => {
    const info = p.programInfo;
    if (!info || info.termMonths !== term) return false;
    if (info.active === false) return false;
    // Date predicate mirrors backend `ProgramActivationUtils.isActiveOnDate`:
    //   (activation <= today OR null) AND (deactivation >= today OR null)
    const activation = info.activationDate ? new Date(info.activationDate) : null;
    const deactivation = info.deactivationDate ? new Date(info.deactivationDate) : null;
    if (activation && activation.getTime() > today.getTime()) return false;
    if (deactivation && deactivation.getTime() < today.getTime()) return false;
    return true;
  }).length;
}

function isAutoHealEnabled(override?: boolean): boolean {
  if (override !== undefined) return override;
  const v = process.env.AUTO_HEAL_MERCHANT;
  if (v === undefined || v === '') return true;
  return v.toLowerCase() !== 'false' && v !== '0';
}

function isDryRunEnabled(override?: boolean): boolean {
  if (override !== undefined) return override;
  const v = process.env.MERCHANT_PREFLIGHT_DRY_RUN;
  if (v === undefined || v === '') return false;
  return v.toLowerCase() === 'true' || v === '1';
}

function collectFlagDrift(
  info: Record<string, unknown>,
  contract: MerchantConfigContract,
): MerchantConfigDrift[] {
  const drift: MerchantConfigDrift[] = [];
  for (const flag of contract.mustBeTrue) {
    if (info[flag] !== true) {
      drift.push({ kind: 'flag-should-be-true', field: flag, actual: info[flag], expected: true });
    }
  }
  for (const flag of contract.mustBeFalse) {
    if (info[flag] === true) {
      drift.push({ kind: 'flag-should-be-false', field: flag, actual: true, expected: false });
    }
  }
  for (const field of contract.requiredNonEmpty ?? []) {
    const v = info[field];
    if (typeof v !== 'string' || v.trim() === '') {
      drift.push({ kind: 'field-required-non-empty', field, actual: v, expected: 'non-empty string' });
    }
  }
  return drift;
}

/**
 * Find an active program for a given term_months by calling the svc global
 * search endpoint and filtering client-side. Used to pick a program to add
 * when a merchant is under-provisioned. Returns the first match or undefined.
 */
async function findActiveProgramByTerm(
  api: ApiClients,
  termMonths: number,
  excludePks: Set<number>,
): Promise<{ programPk: number; programName: string } | undefined> {
  // reason: /uown/getAllMerchantPrograms supports pagination but not a
  // server-side term filter — fetch a page and filter client-side. Page size
  // 500 is plenty for qa2 (typical catalog size is well below that).
  const resp = await api.merchant.getAllMerchantPrograms({ maxResults: 500, pageNumber: 0 });
  if (!resp.ok) return undefined;
  const body = resp.body as { merchantPrograms?: MerchantProgram[]; programs?: MerchantProgram[] } | undefined;
  const list: MerchantProgram[] = body?.merchantPrograms ?? body?.programs ?? [];
  for (const p of list) {
    const info = p.programInfo;
    if (!info) continue;
    if (info.termMonths !== termMonths) continue;
    if (info.active === false) continue;
    const pk = Number(info.programPk ?? p.pk ?? 0);
    if (!pk || excludePks.has(pk)) continue;
    return { programPk: pk, programName: info.programName ?? '(unnamed)' };
  }
  return undefined;
}

export async function ensureMerchantReady(
  api: ApiClients,
  merchantRefCode: string,
  options: EnsureMerchantReadyOptions = {},
): Promise<EnsureMerchantReadyResult> {
  // Global escape hatch: when MERCHANT_PREFLIGHT_SKIP=true (e.g. while qa2
  // RBAC is broken on getMerchantsByRefCode), skip the preflight entirely.
  const envSkip = (process.env.MERCHANT_PREFLIGHT_SKIP ?? '').toLowerCase() === 'true';
  if (options.skip || envSkip) {
    if (envSkip && !options.skip) {
      console.log(
        `[merchant-preflight] ${merchantRefCode} bypassed via MERCHANT_PREFLIGHT_SKIP=true`,
      );
    }
    return { merchantPk: 0, drift: [], healed: false };
  }

  const resp = await api.merchant.getMerchantsByRefCode(merchantRefCode);
  const list = Array.isArray(resp.body) ? resp.body : [];
  if (!resp.ok || list.length === 0) {
    throw new Error(
      `[merchant-preflight] getMerchantsByRefCode failed for ${merchantRefCode} (status=${resp.status})`,
    );
  }
  const entity = list[0];
  const info = (entity.merchantInfo ?? {}) as Record<string, unknown>;
  const merchantPk = Number(info.merchantPK ?? entity.pk ?? 0);
  if (!merchantPk) {
    throw new Error(`[merchant-preflight] merchantPk missing for ${merchantRefCode}`);
  }

  const brand = resolveBrand(info.clientType as string | null | undefined);
  const contract = resolveContract(info.clientType as string | null | undefined);

  const drift = collectFlagDrift(info, contract);

  const programsResp = await api.merchant.getMerchantProgramsByMerchantPk(merchantPk);
  if (!programsResp.ok) {
    throw new Error(
      `[merchant-preflight] getMerchantProgramsByMerchantPk failed for merchantPk=${merchantPk} (status=${programsResp.status})`,
    );
  }
  const programs: MerchantProgram[] = Array.isArray(programsResp.body) ? programsResp.body : [];
  const count13 = countProgramsByTerm(programs, 13);
  const count16 = countProgramsByTerm(programs, 16);
  const { months13, months16 } = contract.minPrograms;
  if (count13 < months13) {
    drift.push({ kind: 'insufficient-programs-13m', actual: count13, expected: months13 });
  }
  if (count16 < months16) {
    drift.push({ kind: 'insufficient-programs-16m', actual: count16, expected: months16 });
  }

  // Check that enough programs are ACTIVE today (date window covers today).
  // Gap identified during Phase 5 Round 1 (2026-04-22): a 16-month program may
  // exist and pass the count check but have deactivation_date in the past, breaking
  // CT-DateSelect-* / CT-C-* preconditions. Enforce `minActivePrograms` when set.
  if (contract.minActivePrograms) {
    const minActive13 = contract.minActivePrograms.months13;
    const minActive16 = contract.minActivePrograms.months16;
    if (minActive13 !== undefined) {
      const active13 = countActiveProgramsByTerm(programs, 13);
      if (active13 < minActive13) {
        drift.push({
          kind: 'insufficient-active-programs-13m',
          actual: active13,
          expected: minActive13,
        });
      }
    }
    if (minActive16 !== undefined) {
      const active16 = countActiveProgramsByTerm(programs, 16);
      if (active16 < minActive16) {
        drift.push({
          kind: 'insufficient-active-programs-16m',
          actual: active16,
          expected: minActive16,
        });
      }
    }
  }

  if (drift.length === 0) {
    console.log(`[merchant-preflight] ${merchantRefCode} ok — no drift (brand=${brand} pk=${merchantPk})`);
    return { merchantPk, drift: [], healed: false };
  }

  const dryRun = isDryRunEnabled(options.dryRun);
  const autoHeal = isAutoHealEnabled(options.autoHeal);
  console.log(
    `[merchant-preflight] ${merchantRefCode} (brand=${brand} pk=${merchantPk}) drift=${drift.length} dryRun=${dryRun} autoHeal=${autoHeal}`,
  );
  for (const d of drift) {
    const label = d.field ? d.field : d.kind;
    console.log(`[merchant-preflight]   - ${label}: expected=${d.expected} actual=${JSON.stringify(d.actual)}`);
  }

  if (dryRun) {
    console.log(`[merchant-preflight] ${merchantRefCode} DRY RUN — no mutation, proceeding to application flow`);
    return { merchantPk, drift, healed: false };
  }

  if (!autoHeal) {
    const lines = drift.map((d) => {
      const label = d.field ? d.field : d.kind;
      return `  - ${label}: expected=${d.expected} actual=${JSON.stringify(d.actual)}`;
    });
    throw new Error(
      `[merchant-preflight] ${merchantRefCode} configuration drift detected (AUTO_HEAL_MERCHANT=false).\n${lines.join('\n')}\nSet AUTO_HEAL_MERCHANT=true or fix the merchant manually in origination-qa2.`,
    );
  }

  const flagDrift = drift.filter(
    (d) =>
      d.kind === 'flag-should-be-true' ||
      d.kind === 'flag-should-be-false' ||
      d.kind === 'field-required-non-empty',
  );
  if (flagDrift.length > 0) {
    const payload: Record<string, unknown> = { ...info };
    for (const flag of contract.mustBeTrue) payload[flag] = true;
    for (const flag of contract.mustBeFalse) payload[flag] = false;
    const fieldDrift = flagDrift.find((d) => d.kind === 'field-required-non-empty');
    if (fieldDrift) {
      throw new Error(
        `[merchant-preflight] ${merchantRefCode} requires non-empty "${fieldDrift.field}" but it is missing. ` +
          `Auto-heal cannot fabricate this value (it is brand integration config). Set it manually in origination-qa2.`,
      );
    }
    const healResp = await api.merchant.createOrUpdateMerchant(payload);
    if (!healResp.ok) {
      throw new Error(
        `[merchant-preflight] createOrUpdateMerchant failed for ${merchantRefCode}: ${healResp.status} — ${JSON.stringify(healResp.body)}`,
      );
    }
    console.log(`[merchant-preflight] ${merchantRefCode} flags healed (${flagDrift.length} fields)`);
  }

  const programDrift = drift.filter(
    (d) => d.kind === 'insufficient-programs-13m' || d.kind === 'insufficient-programs-16m',
  );
  if (programDrift.length > 0) {
    const existingPks = new Set<number>(
      programs
        .map((p) => Number(p.programInfo?.programPk ?? p.pk ?? 0))
        .filter((pk) => pk > 0),
    );
    const programsToAdd: number[] = [];
    for (const d of programDrift) {
      const term = d.kind === 'insufficient-programs-13m' ? 13 : 16;
      const missing = Number(d.expected) - Number(d.actual);
      for (let i = 0; i < missing; i++) {
        const candidate = await findActiveProgramByTerm(api, term, existingPks);
        if (!candidate) {
          throw new Error(
            `[merchant-preflight] could not find an active ${term}-month program in the svc catalog to attach to ${merchantRefCode}`,
          );
        }
        existingPks.add(candidate.programPk);
        programsToAdd.push(candidate.programPk);
        console.log(
          `[merchant-preflight] ${merchantRefCode} queued program pk=${candidate.programPk} name="${candidate.programName}" term=${term}`,
        );
      }
    }
    const addResp = await api.merchant.addProgramsToMerchant(merchantPk, programsToAdd, false);
    if (!addResp.ok) {
      throw new Error(
        `[merchant-preflight] addProgramsToMerchant failed for ${merchantRefCode}: ${addResp.status} — ${JSON.stringify(addResp.body)}`,
      );
    }
    console.log(`[merchant-preflight] ${merchantRefCode} programs attached (${programsToAdd.length}: ${programsToAdd.join(',')})`);
  }

  // Heal programs that exist but are not active today (deactivationDate in past or
  // activationDate in future). Strategy: attach additional programs of the needed term
  // via the same catalog lookup — this avoids mutating existing program dates, which
  // could affect other merchants sharing those programs. If the catalog has no active
  // candidates left, fail fast — manual intervention required.
  const activeProgramDrift = drift.filter(
    (d) =>
      d.kind === 'insufficient-active-programs-13m' ||
      d.kind === 'insufficient-active-programs-16m',
  );
  if (activeProgramDrift.length > 0) {
    const existingPks = new Set<number>(
      programs
        .map((p) => Number(p.programInfo?.programPk ?? p.pk ?? 0))
        .filter((pk) => pk > 0),
    );
    const activeToAdd: number[] = [];
    for (const d of activeProgramDrift) {
      const term = d.kind === 'insufficient-active-programs-13m' ? 13 : 16;
      const missing = Number(d.expected) - Number(d.actual);
      for (let i = 0; i < missing; i++) {
        const candidate = await findActiveProgramByTerm(api, term, existingPks);
        if (!candidate) {
          throw new Error(
            `[merchant-preflight] ${merchantRefCode} needs ${missing} more active ${term}-month program(s) but the catalog has no active candidates left. ` +
              `Manually attach programs or extend the deactivation_date of an existing ${term}-month program in origination-qa2.`,
          );
        }
        existingPks.add(candidate.programPk);
        activeToAdd.push(candidate.programPk);
        console.log(
          `[merchant-preflight] ${merchantRefCode} queued ACTIVE program pk=${candidate.programPk} name="${candidate.programName}" term=${term}`,
        );
      }
    }
    if (activeToAdd.length > 0) {
      const addResp = await api.merchant.addProgramsToMerchant(merchantPk, activeToAdd, false);
      if (!addResp.ok) {
        throw new Error(
          `[merchant-preflight] addProgramsToMerchant (active heal) failed for ${merchantRefCode}: ${addResp.status} — ${JSON.stringify(addResp.body)}`,
        );
      }
      console.log(
        `[merchant-preflight] ${merchantRefCode} active programs attached (${activeToAdd.length}: ${activeToAdd.join(',')})`,
      );
    }
  }

  const healed =
    flagDrift.length > 0 || programDrift.length > 0 || activeProgramDrift.length > 0;
  return { merchantPk, drift, healed };
}

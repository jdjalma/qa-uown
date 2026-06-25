# Execution Plan — DRY / Reuse / Best-Practices in agent-generated code

> **Status:** Tier 0 + Tier 1.1/1.2 + Cross-cutting **COMPLETED** (2026-06-23); Tiers 1.3/2/3 pending · **Initial owner:** orchestrator (CLAUDE.md)
> **Goal:** make the code the agents generate DRY and best-practice-compliant — attacking the **root causes**, not just the symptoms.
> This file is the living plan. Update the status per item as it progresses.

## ✅ Progress 2026-06-23 (verified)

**Tier 0 (enforcement) — DONE.** ESLint flat config + `eslint-plugin-playwright` + targeted rules (all warn/ratchet); `noUnusedLocals`+`noUnusedParameters` (error, 0 violations); `database.helpers` added to the barrel; `.jscpd.json`; **`quality` job in CI** (preserves `ci-tests`). Verified: `tsc` 0 errors outside `src/scripts`; `eslint` **0 errors / 1759 warnings**; jscpd. ESLint ratchet = **1780** (baseline 1759 + buffer of 21 to avoid blocking an incidental MR; lower to 1759 = strict). jscpd threshold = **10** (real measured baseline **9.09%**, NOT 8.84% — corrected).

**Tier 1.1 fixtures — DONE.** `approvedApplication` + `fundedAccount` (lazy, compose `createPreQualifiedApplication`+`driveLeadToFunding`, preflight via helper, NOT re-inlined) in `base-test.ts`. Adversarial review: composes, does not reimplement.

**Tier 1.2 oracle — DONE.** `src/helpers/activity-log.helpers.ts` covers `uown_los_activity_log` (reuses `pollUntil`+`db`, verified columns) + re-exports the lead-notes helpers (does not copy them). In the barrel + catalog.

**X.1/X.2 routing — DONE.** `e2e-examples` (§0 prefer-fixtures), `common-operations` (oracle), `qa-implementer` (reuse-first gate). A routing defect caught in review (fictitious `uniqueName`/`getWorkerRunId()`) **fixed** in `e2e-examples` §6 + `.claude/rules/helpers.md`.

**Duplication metric:** 597 → **494 clones** (effect of the earlier items 5/6). Next target: Tier 1.3 (runUnifiedFlow, ~595 lines) and Tier 2.3 (intra-spec CTs).

## ✅ Progress 2026-06-23 — part 2 (type-health + selector type + 2.1/3.3/3.4)

**BIG DISCOVERY:** when excluding `src/scripts` from `tsc` (item 3.4) the incremental cache stopped masking it — **the repo NEVER type-checked clean**: 125 latent errors (CI never ran `tsc`, only `ci-tests`; locally `.tsbuildinfo` hid them). All PRE-EXISTING (none reference my changes). Resolved:

- **`AppSelectors` derived from the object** (`type AppSelectors = typeof SELECTORS`) — it was a 992-line parallel interface maintained by hand that drifted and produced **41 phantom TS2339 errors**. Single source now; the type never desyncs again. **(DRY win — Tier 2.4-adjacent.)**
- **53 dead-code** (TS6133/6196 — unused imports/locals/methods/params) removed by 2 parallel agents. `noUnusedLocals`/`noUnusedParameters` are now real errors with 0 violations.
- **15 residual errors** fixed: `goToNextPage` overrides (Promise<void>→<boolean>), wrong `ApiClients` import path, `buildTestData.orderTotal` → optional with default, missing `SELECTORS` import, unknown casts, nonexistent `testData.env`. (+9 from `seon-negative-scenarios` resolved in cascade by the derive.)

**Result:** `tsc --noEmit` **genuine EXIT 0** (clean cache, no filter) — 125 → **0**. The Tier 0 gate is now true. ESLint ratchet re-tuned to **1775** (baseline 1754 post-cleanup). jscpd 597 → **491 clones**.

**Tier 3.4 DONE** (src/scripts + scratch `_*.spec.ts` excluded from tsconfig — they are not framework). **Tier 3.3 DONE** (scratch already gitignored, left in place). **Tier 2.1 DONE** (selector policy reconciled in `selectors.md` + `selector-hardening` + `page-objects.md`: co-location in the page object is OK; `common.selectors.ts` cross-cutting only; specs never inline).

## ✅ Progress 2026-06-23 — part 3 (3.1 + oracle adoption, behavior-preserving)

**Tier 3.1 DONE** — `makeTestContext(overrides?)` in `base-test.ts`; the 2 `ctx as any`/double-cast (specs 531, storeUW) swapped for typed ctx; the `ctx` fixture itself now uses the factory (single source). `seon-widget` unused param-property fixed.

**Tier 1.2 oracle — ADOPTION** (the biggest debt from the 2nd audit: 20+ raw activity-log SELECTs). **13 inline queries → oracle** (`findLeadNoteContaining`/`findActivityLogContaining`): #1315 (4), gowsign/servicing (8), Pii/PP (1). Behavior-preserving (the oracle runs the identical query; `ILIKE '%'||$2||'%'` preserves embedded wildcards). **14 left inline ON PURPOSE** — they did not match the oracle's semantics (multiple ILIKE OR, case-sensitive `LIKE`, `LIMIT 5`, multi-table). Discipline via 2 agents with the "only-if-exact-match" rule + spot-check.

`tsc` **0** · `eslint` **0 errors / 1758 warnings** (ceiling 1775) · jscpd **494 clones** (~flat — the oracle gain was reuse/maintenance, not line-count, since most queries did not match and stayed inline).

> Documented nuance: the activity-log oracle filters `deleted IS NOT TRUE` — for an existence assertion this is *more* correct (a soft-deleted log is not an observable consequence); it differs from inline only in the rare case of a matching soft-deleted row.

### Still pending (need to run the suite / DOM / big refactor)
Tier 1.3 (runUnifiedFlow, 12-min suite), 1.4 (payment builders), 2.2 (god-objects — splitting a 1.5k-line page object used by CI, risky without a run), 2.3 (intra-spec CTs — only where they are real data-variations; #1315 was NOT), 2.4 (~38 structural XPath in page objects → sibling selectors need DOM/MCP). The LEFT activity-log queries with case-sensitive `LIKE` in `modify-lease` could become a follow-up (case-insensitive variant of the oracle).

## Root-cause diagnosis

The agents generate non-DRY code due to **two mutually reinforcing causes**:

1. **No mechanical enforcement.** Every DRY rule is advisory (skills + CLAUDE.md). Without ESLint, without `tsc`/sonar/jscpd in CI (which only runs `--project=ci-tests`), nothing *prevents* duplication. A rule without a gate = drift.
2. **Helpers exist but the skills don't route to them.** `setupApplicationViaApi`, `findLeadNoteContaining`, `buildCcArrangementBody` exist and are good — and almost no one uses them (1 / 2 / 2 specs). The agent only uses what the skill mandates AND the lint enforces.

> **The two levers:** a skill that **routes** to reuse + a lint that **blocks** non-reuse. Every item below anchors to one of these two.

## Measured baseline (2026-06-23)

| Metric | Value | Source |
|---|---|---|
| Duplicated lines (jscpd, tests+src) | **8.84%** (597 clones) | `npx jscpd tests src --min-lines 5 --min-tokens 50` |
| Inline locators in `src/pages/` | **1,110** | grep |
| `common.selectors.ts` | 1,049 lines / 565 keys | wc |
| Inline locators in specs | 104 (15 files) | grep |
| XPath in specs | 2 | grep |
| Individual `@helpers/*` import in specs | 115 (98 excl. `database`) | grep |
| `await sleep()` in specs | 120 (~30 in a loop) | grep |
| `as any`/`as unknown` in tests | 16 | grep |
| ESLint | **nonexistent** | — |
| CI gates | only `playwright --project=ci-tests` | `.gitlab-ci.yml` |
| `noUnusedLocals`/`noUnusedParameters` if turned on | **0 new errors** | `tsc` |

Duplication goal: **bring it down from 8.84% to < 5%** after Tiers 1–2; gate it in CI so it doesn't climb.

---

## TIER 0 — Mechanical enforcement (the multiplier)

> Converts the already-written rules into real gates. Without this, everything else regresses.

| # | Item | Files | Calibration | Status |
|---|---|---|---|---|
| 0.1 | ESLint flat config + `typescript-eslint` + `eslint-plugin-playwright` | `eslint.config.mjs`, `package.json` (devDeps + `lint:es` script) | base | ☐ |
| 0.2 | Rule: no XPath in specs | eslint `no-restricted-syntax` | **error** (2 violations → fix) | ☐ |
| 0.3 | Rule: runtime helper imports only via the barrel | eslint `no-restricted-imports` (`@helpers/*.helpers.js`, `*.helper.js`; except `database.helpers.js` OR add it to the barrel) | **warn** (ratchet) | ☐ |
| 0.4 | Custom rule: `sleep()` inside `for/while` | `eslint-rules/no-sleep-in-loop.mjs` | **warn** (~30) | ☐ |
| 0.5 | Rule: inline locator in specs (`page.locator/getBy*` in `tests/**`) | eslint `no-restricted-syntax` | **warn** (104) | ☐ |
| 0.6 | Rule: `as any`/`as unknown`/`@ts-ignore` in tests | eslint | **warn** (16) | ☐ |
| 0.7 | `noUnusedLocals` + `noUnusedParameters` in tsconfig | `tsconfig.json` | **error** (0 violations) | ☐ |
| 0.8 | `.jscpd.json` + threshold at the baseline (9%) | `.jscpd.json`, `package.json` `dup` script | ratchet gate | ☐ |
| 0.9 | `quality` job in CI: `tsc --noEmit` + `eslint` (fails only on ERROR) + `jscpd --threshold` | `.gitlab-ci.yml` | blocks regression | ☐ |
| 0.10 | Pre-push hook running lint on changed files | existing hooks framework | local feedback | ☐ |

**Tier 0 acceptance:** `npx eslint .` runs with no ERROR; CI has a `quality` job; `tsc` green (after fixing the 2 broken `src/scripts` — item 3.4); jscpd gated at 9%.

---

## TIER 1 — Reusable building blocks (biggest line cut)

| # | Item | Files | Impact | Status |
|---|---|---|---|---|
| 1.1 | Ready-state fixtures: `approvedApplication` + `fundedAccount` (compose `setupApplicationViaApi` + `driveLeadToFunding` — do NOT reimplement inline) | `src/support/base-test.ts` (+ types) | ~19 specs, thousands of lines | ☐ |
| 1.2 | Activity-log oracle: `assertLeadNote(db, leadPk, pattern)` / `waitForActivityLog(...)` wrapping `esign-db.helpers` + generic queries on `uown_los_activity_log` (no helper today) | `src/helpers/activity-log.helpers.ts` (new) + barrel + catalog | 20+ raw SQLs in 10 specs; rule #13 guarantees growth | ☐ |
| 1.3 | `runUnifiedFlow` shared runner (parameterizes the `ci/` and `e2e/` unified-flow) | `tests/_shared/unified-flow.runner.ts` | 595-line clone (top jscpd) | ☐ (requires running the 12-min suite) |
| 1.4 | Adopt the payment builders + the `waitForCcTransactionStatus` helper | `src/api/bodies/`, `src/helpers/database.helpers.ts` | builder in 2 specs; repeated polling | ☐ |

**Tier 1 acceptance:** fixtures used by ≥1 new spec; oracle in the barrel + catalog; jscpd drops vs baseline.

---

## TIER 2 — Structural debt that feeds duplication

| # | Item | Evidence | Status |
|---|---|---|---|
| 2.1 | **Reconcile the selector policy**: redefine the "everything in common.selectors.ts" rule. Decision: a page-owned selector is **co-located** in the page object (semantic getter OK); `common.selectors.ts` for cross-cutting only; split `common` by portal. Update `.claude/rules/selectors.md` + `selector-hardening` | 1,110 inline vs the rule; god-file 1,049 lines | ☐ |
| 2.2 | Break god-objects by composition (`paytomorrow` 1,540, `customer` 1,525, `contract` 966) | wc | ☐ |
| 2.3 | Parameterize intra-spec CTs (`for...of testData` instead of copy-pasting a block) | jscpd self-clones: svc-509 (348), #1315 (237), 531 (118), 525 (103) | ☐ |
| 2.4 | Fix the ~38 remaining XPath in page objects → semantic | grep | ☐ |

## TIER 3 — Type-safety & hygiene

| # | Item | Evidence | Status |
|---|---|---|---|
| 3.1 | `makeTestContext()` factory so specs stop building a partial ctx + casting | 2 `ctx as any`/double-cast (531, storeUnderwritingScores) | ☐ |
| 3.2 | Audit the remaining `as any` (16 in tests) | grep | ☐ |
| 3.3 | Remove scratch/probe specs (`__scratch_la_signing_url`, `_sticky_multi_fresh` — that one with a raw `UPDATE`) | grep | ☐ |
| 3.4 | Fix the 2 broken `src/scripts` (markdown with `.ts`) that leave `tsc` red | tsc | ☐ |

## CROSS-CUTTING — close the loop in the agent system

| # | Item | Status |
|---|---|---|
| X.1 | Every new fixture/helper/oracle enters the skills (`helpers-catalog`, `e2e-examples`, `common-operations`) so the agent can REACH it | ☐ |
| X.2 | "Reuse-first" gate in `qa-implementer`: before writing setup/assertion, use an existing fixture/oracle | ☐ |
| X.3 | New `prefer-fixtures` skill (or a section in `test-data-hierarchy`): a ready-state fixture > inline setup | ☐ |

---

## Execution sequence

1. **Tier 0** (enforcement) — the multiplier, first.
2. **Tier 1.1 + 1.2** (fixtures + oracle) + **X.1/X.2** (routing in the skills) — biggest cut + closes the loop.
3. **Tier 2.1** (selector policy) — unblocks the contradiction the agent faces.
4. **Tier 1.3, 2.2–2.4, 3.x** — the rest (some require running the suite).

## How to measure progress

```bash
npx jscpd tests src --min-lines 5 --min-tokens 50   # % duplication (baseline 8.84%)
npx eslint .                                          # ERRORs = 0; warnings ratchet
npx tsc --noEmit                                      # green (after 3.4)
```

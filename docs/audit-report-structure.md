# Structure Audit Report
**Date:** 2026-04-13
**Scope:** Full project — `.claude/` directory, barrel exports, orphaned files
**Mode:** STRUCTURE

---

## Summary: 9 issues | 0 contradictions | 4 gaps | 1 duplication | 1 ambiguity | 0 wrong deps | 1 scope | 2 stale

---

## 1. Agent Existence Check (CLAUDE.md Catalog vs `.claude/agents/`)

All 13 agents listed in CLAUDE.md exist in `.claude/agents/`. No missing or extra agents.

| Agent | File | Status |
|-------|------|--------|
| subagent-fetch-task | `.claude/agents/subagent-fetch-task.md` | OK |
| subagent-spec-test | `.claude/agents/subagent-spec-test.md` | OK |
| subagent-impl-e2e | `.claude/agents/subagent-impl-e2e.md` | OK |
| subagent-impl-api | `.claude/agents/subagent-impl-api.md` | OK |
| subagent-impl-api-client | `.claude/agents/subagent-impl-api-client.md` | OK |
| subagent-impl-page-object | `.claude/agents/subagent-impl-page-object.md` | OK |
| subagent-impl-db-validation | `.claude/agents/subagent-impl-db-validation.md` | OK |
| subagent-refactor-page-object | `.claude/agents/subagent-refactor-page-object.md` | OK |
| subagent-debug-flaky | `.claude/agents/subagent-debug-flaky.md` | OK |
| subagent-audit | `.claude/agents/subagent-audit.md` | OK |
| subagent-data | `.claude/agents/subagent-data.md` | OK |
| subagent-validate-results | `.claude/agents/subagent-validate-results.md` | OK |
| subagent-docs-update | `.claude/agents/subagent-docs-update.md` | OK |

---

## 2. Commands Check (`.claude/commands/`)

CLAUDE.md references only `/qa-flow`. Three additional command files exist but are not documented in CLAUDE.md.

| Command file | Referenced in CLAUDE.md | Status |
|--------------|------------------------|--------|
| `qa-flow.md` | Yes | OK |
| `new-page-object.md` | No | Undocumented |
| `new-api-client.md` | No | Undocumented |
| `new-payment-flow.md` | No | Undocumented |

---

## 3. Context Files Check (`.claude/context/`)

All files listed in `INDEX.md` exist. Cross-referenced against actual files on disk.

| File | In INDEX.md | Exists on disk | Status |
|------|-------------|---------------|--------|
| `project-overview.md` | Yes | Yes | OK |
| `project-structure.md` | Yes | Yes | OK |
| `coding-standards.md` | Yes | Yes | OK |
| `architecture.md` | Yes | Yes | OK |
| `test-patterns.md` | Yes | Yes | OK |
| `business-rules.md` | Yes | Yes | OK |
| `environments.md` | Yes | Yes | OK |
| `glossary.md` | Yes | Yes | OK |
| `app-repos.md` | Yes | Yes | OK |
| `orchestration.md` | Not in INDEX.md | Yes | Gap — see §Gaps |
| `shared/agent-coordination.md` | Yes | Yes | OK |
| `shared/e2e-agent-responsibilities.md` | Yes | Yes | OK |
| `shared/e2e-test-examples.md` | Yes | Yes | OK |
| `shared/e2e-test-plan-template.md` | Yes | Yes | OK |
| `shared/e2e-checklist.md` | Yes | Yes | OK |
| `shared/e2e-test-report-standard.md` | Yes | Yes | OK |
| `shared/common-operations.md` | Yes | Yes | OK |

---

## 4. Rules Files Check (`.claude/rules/`)

CLAUDE.md lists 6 domain rule files. All 6 exist.

| Rule file | Referenced in CLAUDE.md | Exists | Status |
|-----------|------------------------|--------|--------|
| `page-objects.md` | Yes | Yes | OK |
| `api-clients.md` | Yes | Yes | OK |
| `selectors.md` | Yes | Yes | OK |
| `testing.md` | Yes | Yes | OK |
| `helpers.md` | Yes | Yes | OK |
| `security.md` | Yes | Yes | OK |

---

## 5. Barrel Export Audit

### 5a. `src/api/clients/index.ts`

All `.ts` files in `src/api/clients/` (excluding `index.ts`) are exported. No orphans.

| Client file | Exported | Status |
|-------------|----------|--------|
| `base.client.ts` | Yes | OK |
| `application.client.ts` | Yes | OK |
| `invoice.client.ts` | Yes | OK |
| `lead.client.ts` | Yes | OK |
| `settlement.client.ts` | Yes | OK |
| `credit-card.client.ts` | Yes | OK |
| `scheduled-task.client.ts` | Yes | OK |
| `merchant.client.ts` | Yes | OK |
| `account.client.ts` | Yes | OK |
| `payment-arrangement.client.ts` | Yes | OK |
| `svc-payoff.client.ts` | Yes | OK |
| `svc-phone.client.ts` | Yes | OK |
| `svc-email.client.ts` | Yes | OK |
| `svc-contact.client.ts` | Yes | OK |
| `ams.client.ts` | Yes | OK |
| `los-partner-auth.client.ts` | Yes | OK |
| `los-partner-application.client.ts` | Yes | OK |
| `seon.client.ts` | Yes | OK |

### 5b. `src/api/bodies/index.ts`

**Gap found:** `seon.body.ts` exists on disk but is NOT exported from `src/api/bodies/index.ts`.

| Body file | Exported | Status |
|-----------|----------|--------|
| `application.body.ts` | Yes | OK |
| `invoice.body.ts` | Yes | OK |
| `lead.body.ts` | Yes | OK |
| `settlement.body.ts` | Yes | OK |
| `credit-card.body.ts` | Yes | OK |
| `account.body.ts` | Yes | OK |
| `payment-arrangement.body.ts` | Yes | OK |
| `svc-phone.body.ts` | Yes | OK |
| `svc-email.body.ts` | Yes | OK |
| `svc-contact.body.ts` | Yes | OK |
| `ams-user.body.ts` | Yes | OK |
| `merchant-config.body.ts` | Yes | OK |
| **`seon.body.ts`** | **No** | **GAP — missing export** |

### 5c. `src/api/responses/index.ts`

**Gap found:** `seon.response.ts` exists on disk but is NOT exported from `src/api/responses/index.ts`.

| Response file | Exported | Status |
|---------------|----------|--------|
| `api-response.ts` | Yes | OK |
| `base.response.ts` | Yes | OK |
| `application.response.ts` | Yes | OK |
| `invoice.response.ts` | Yes | OK |
| `lead.response.ts` | Yes | OK |
| `settlement.response.ts` | Yes | OK |
| `credit-card.response.ts` | Yes | OK |
| `scheduled-task.response.ts` | Yes | OK |
| `merchant.response.ts` | Yes | OK |
| `account.response.ts` | Yes | OK |
| `payment-arrangement.response.ts` | Yes | OK |
| `svc-payoff.response.ts` | Yes | OK |
| `svc-phone.response.ts` | Yes | OK |
| `svc-email.response.ts` | Yes | OK |
| `svc-contact.response.ts` | Yes | OK |
| `ams-user.response.ts` | Yes | OK |
| `los-partner-auth.response.ts` | Yes | OK |
| `los-partner-application.response.ts` | Yes | OK |
| **`seon.response.ts`** | **No** | **GAP — missing export** |

### 5d. `src/pages/index.ts` (portal sub-barrels)

All page objects in `src/pages/` are reachable via their portal barrel. No orphans.

| Page file | Barrel | Status |
|-----------|--------|--------|
| `base.page.ts` | `src/pages/index.ts` | OK |
| `login.page.ts` | `src/pages/index.ts` | OK |
| `search.page.ts` | `src/pages/index.ts` | OK |
| `merchant.page.ts` | `src/pages/index.ts` | OK |
| `origination/origination-base.page.ts` | `origination/index.ts` (via OriginationBasePage) | OK |
| `origination/customer.page.ts` | `origination/index.ts` | OK |
| `origination/contract.page.ts` | `origination/index.ts` | OK |
| `origination/funding.page.ts` | `origination/index.ts` | OK |
| `origination/lease-agreement.page.ts` | `origination/index.ts` | OK |
| `origination/overview.page.ts` | `origination/index.ts` | OK |
| `origination/metrics-calculator.page.ts` | `origination/index.ts` | OK |
| `origination/paytomorrow-portal.page.ts` | `origination/index.ts` | OK |
| `origination/paypair-portal.page.ts` | `origination/index.ts` | OK |
| `origination/application-wizard.page.ts` | `origination/index.ts` | OK |
| `origination/merchant-setting.page.ts` | `origination/index.ts` | OK |
| `origination/error-log.page.ts` | `origination/index.ts` | OK |
| `origination/leads.page.ts` | `origination/index.ts` | OK |
| `origination/programs.page.ts` | `origination/index.ts` | OK |
| `origination/open-to-buy.page.ts` | `origination/index.ts` | OK |
| `origination/new-application-filters.page.ts` | `origination/index.ts` | OK |
| `origination/merchant-mod-history.page.ts` | `origination/index.ts` | OK |
| `origination/modification-report.page.ts` | `origination/index.ts` | OK |
| `servicing/servicing-base.page.ts` | `servicing/index.ts` | OK |
| `servicing/customer.page.ts` | `servicing/index.ts` | OK |
| `servicing/payment-transaction.page.ts` | `servicing/index.ts` | OK |
| `servicing/ach-history.page.ts` | `servicing/index.ts` | OK |
| `servicing/scheduled-payment.page.ts` | `servicing/index.ts` | OK |
| `servicing/log.page.ts` | `servicing/index.ts` | OK |
| `servicing/due-date-moves-history.page.ts` | `servicing/index.ts` | OK |
| `servicing/frequency-changes-history.page.ts` | `servicing/index.ts` | OK |
| `servicing/payment-arrangement.page.ts` | `servicing/index.ts` | OK |
| `servicing/servicing-search.page.ts` | `servicing/index.ts` | OK |
| `servicing/credit-card-history.page.ts` | `servicing/index.ts` | OK |
| `ams/ams-base.page.ts` | `ams/index.ts` | OK |
| `ams/ams.page.ts` | `ams/index.ts` | OK |
| `ams/ams-user-details.page.ts` | `ams/index.ts` | OK |
| `ams/ams-user-merchants.page.ts` | `ams/index.ts` | OK |
| `website/website-base.page.ts` | `website/index.ts` | OK |

---

## 6. Findings by Dimension

### Gaps

| Location | What's missing | Impact | Suggestion |
|----------|---------------|--------|------------|
| `src/api/bodies/index.ts` | `seon.body.ts` not exported | Any consumer importing from barrel won't access Seon body types | Add `export * from './seon.body.js';` |
| `src/api/responses/index.ts` | `seon.response.ts` not exported | Same — Seon response types inaccessible via barrel | Add `export * from './seon.response.js';` |
| `.claude/context/INDEX.md` | `orchestration.md` not listed in the index table | Agents loading context from INDEX.md won't discover the orchestration protocol | Add entry for `orchestration.md` to INDEX.md |
| `docs/database-schema.md` | File referenced in CLAUDE.md Detailed References table but does not exist on disk | Any agent instructed to consult the DB schema will hit a dead link | Create the file or remove the reference from CLAUDE.md |

### Stale Content

| File | Reference | Status | Action |
|------|-----------|--------|--------|
| `CLAUDE.md` (Detailed References) | `docs/database-schema.md` | File does not exist | Create file or remove reference |
| `CLAUDE.md` (Detailed References) | `docs/user-stories/jornada-completa-lease.md` | File does not exist | Create file or remove reference |

### Duplications

| Information | File 1 | File 2 | Suggested source of truth |
|-------------|--------|--------|--------------------------|
| Agent catalog (names, models, roles) | `CLAUDE.md` §Catalog table | `docs/AGENTS.md` | `docs/AGENTS.md` — CLAUDE.md should reference it rather than duplicating the full table |

### Ambiguities

| File:section | Ambiguous text | Suggestion |
|--------------|---------------|------------|
| `CLAUDE.md` §Commands | Only `/qa-flow` is documented. Three other commands (`new-page-object`, `new-api-client`, `new-payment-flow`) exist in `.claude/commands/` but are not mentioned | Either add them to the Commands section or add a note explaining they are available but unlisted |

### Ill-defined Scope

| Agent(s) | Problem | Suggestion |
|----------|---------|------------|
| `.claude/commands/new-page-object.md` & `.claude/commands/new-api-client.md` | Commands duplicate pipeline types already defined in the CLAUDE.md Pipeline Types table (`new-page-object`, `new-api-client`). Unclear whether the command or the pipeline table governs behavior | Designate the command file as canonical for slash invocation; CLAUDE.md pipeline table for programmatic orchestration; document this distinction |

---

## 7. Top 5 Fixes (ordered by impact)

1. **Add `seon.body.ts` and `seon.response.ts` to their barrel exports** — `SeonClient` is already in `clients/index.ts` but its types can't be imported via barrel. This is a compilation hazard if any consumer uses the barrel. Two one-line additions.

2. **Create or stub `docs/database-schema.md`** — Referenced in CLAUDE.md as a primary reference for DB work. A missing file will silently fail for any agent that attempts to read it. Either create the schema document or update CLAUDE.md to point to the actual location.

3. **Create or stub `docs/user-stories/jornada-completa-lease.md`** — Used as required context by `spec-test` and `validate-results` agents (per `orchestration.md`). Missing file will cause agent failures mid-pipeline for the most critical flows.

4. **Add `orchestration.md` to `INDEX.md`** — The orchestration protocol is loaded by every agent run but is invisible in the INDEX. This creates a discoverability gap when agents or developers consult the index to understand available context.

5. **Document or deprecate undocumented commands** — `new-page-object.md`, `new-api-client.md`, and `new-payment-flow.md` exist as slash commands but are absent from CLAUDE.md. Users invoking these get no documented contract; the orchestrator has no awareness of them. Add a Commands section entry or a brief note pointing to `.claude/commands/`.

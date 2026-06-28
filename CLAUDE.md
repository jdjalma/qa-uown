# CLAUDE.md — fintech-playwright

> **Summary:** Test automation framework with Playwright + TypeScript for the UOWN Leasing fintech platform. Covers 4 portals (Origination, Servicing, Website, AMS) with API, E2E, and hybrid tests. Claude is fully autonomous — proceed without asking for confirmation. Exceptions: do NOT delete files outside the project, do NOT execute INSERT/UPDATE/DELETE on the DB without authorization.

Test automation framework with **Playwright + TypeScript** for the UOWN Leasing fintech platform. Covers 4 portals (Origination, Servicing, Website, AMS) with API, E2E, and hybrid tests.

## Stack

* **Playwright** `^1.50.0`, **TypeScript** `^5.6.0` strict, **Node.js** ESModules.
* **Database**: PostgreSQL via `pg`. **Email**: IMAP via `imapflow` (Gmail).
* **Environments**: `sandbox` (default), `qa1`, `qa2`, `stg`, `dev1`, `dev2`, `dev3`.

> **Domain-specific rules** (path-scoped, load automatically when editing matching files):
> [`.claude/rules/`](.claude/rules/) — `page-objects.md` · `api-clients.md` · `selectors.md` · `testing.md` · `helpers.md` · `security.md`

## Autonomy

* Claude is **fully autonomous** — proceed without asking for confirmation.
* **Multi-part flows (BDD Part 1 → Part 2, pipeline stages, multi-step tasks):** after completing one part, advance directly to the next — do NOT pause to ask "should I continue?", "can I proceed?", or "do you want me to go on?". Asking for permission mid-flow is a protocol violation.
* **EXCEPTION 1:** Do NOT delete files outside the project directory.
* **EXCEPTION 2:** Do NOT execute INSERT, UPDATE, or DELETE directly on the database without explicit user authorization. SELECT (read-only) is always allowed.

## Architecture: 5 agents + ~35 QA skills

Agents are **QA professionals**, not pipelines. Each agent loads relevant skills autonomously based on context signals. All skills are available for automatic agent use; they can also be invoked directly by the user.

### Agents

| Agent | Role | Model | Writes code? |
|-------|------|-------|--------------|
| [`qa-planner`](.claude/agents/qa-planner.md) | QA Strategist — scope, AC review, risk-based design, strategy decision, SPEC | opus | No |
| [`qa-implementer`](.claude/agents/qa-implementer.md) | QA Engineer — implements tests, page objects, API clients, helpers, DB validation | opus | Yes |
| [`qa-debugger`](.claude/agents/qa-debugger.md) | QA Investigator — DOM-first, root-cause, conservative classification, catalog feed | opus | Yes |
| [`qa-validator`](.claude/agents/qa-validator.md) | QA Reviewer — runs tests, validates vs AC/risk, produces task report | opus | No (report) |
| [`qa-doc-keeper`](.claude/agents/qa-doc-keeper.md) | Knowledge Curator — catalogs, pitfalls, ADRs (ALWAYS last) | opus | Yes (docs) |

### Skills

Skills live in `.claude/skills/{slug}/SKILL.md` with `disable-model-invocation: true` — agents load them autonomously when their `description` matches the task context. Organized in 5 layers:

| Layer | Purpose | Examples |
|-------|---------|----------|
| **A — Strategic** | QA cognitive skills (analysis, design, triage) | `scope-analysis`, `acceptance-criteria-review`, `risk-based-prioritization`, `test-strategy-decision`, `test-design-techniques`, `exploratory-heuristics`, `defect-triage`, `user-journey-perspective` |
| **B — Domain** | UOWN fintech knowledge | `qa-domain-reflexes`, `application-lifecycle`, `bug-classification`, `dom-investigation`, `merchant-preflight`, `activity-log-validation`, `ui-first-principle`, `test-data-hierarchy`, `ssn-test-modalities`, `gowsign-knowledge`, `payment-flows`, `fraud-vendors-knowledge`, `regression-suites-map`, `email-templates-catalog`, `volatile-knowledge-registry` |
| **C — Patterns** | Code conventions | `page-object-pattern`, `api-client-pattern`, `db-polling-pattern`, `selector-hardening`, `helpers-catalog`, `e2e-examples`, `common-operations` |
| **D — Standards** | Output formats | `test-plan-template`, `test-report-standard`, `e2e-checklist`, `task-evidence-report` |
| **E — Workflows** | Procedures | `fetch-gitlab-task` |
| **F — Planning & Docs** | Scenario writing, investigation, reporting, UI quality | `test-scenarios` (Gherkin → `.claude/oracles/`), `discovery` (UI investigation via Playwright → `docs/knowledge-base/`), `test-report` (executive report → `docs/reports/`), `qa-lens` (UI quality from user perspective), `check-points` (consequence oracle for Then steps) |

Full skill list: [`.claude/skills/`](.claude/skills/)

## Orchestration (this file = orchestrator)

When you receive a task, classify the **signal** and dispatch to agents. No slash commands — read the request and decide:

| Signal | Dispatch chain |
|--------|---------------|
| New feature / new test request, GitLab URL, AC list | `qa-planner` → `qa-implementer` → `qa-validator` → `qa-doc-keeper` |
| "Test X is failing / flaky", trace/screenshot, timeout error | `qa-debugger` → (`qa-validator` if test is in `docs/taskTestingUown/`) → `qa-doc-keeper` |
| "Refactor page object Y" / "this is duplicated" | `qa-implementer` (refactor mode) → `qa-doc-keeper` |
| "Update docs" / "catalog this helper" / "add ADR" | `qa-doc-keeper` |
| "Audit selectors" / "find dead code" | `qa-debugger` with `selector-hardening` skill in audit mode → `qa-doc-keeper` |
| Setup data / new merchant / new test account | `qa-implementer` (data subset) → `qa-doc-keeper` |
| **"Run existing test" / "execute spec" / "rodar o teste X"** | **BDD oracle check FIRST** (read `_index.md` → staleness check → validate oracles) → `qa-validator` → `qa-doc-keeper`. NEVER dispatch directly to `npx playwright test` without oracle pre-check. |
| **"Create a lease" / "crie um novo lease" / perform a portal operation manually** | **Not the same as running a test.** Read `_index.md` → if operation listed, read BDD → perform operation via MCP Playwright → validate oracle → report PASS/FAIL. |
| Ambiguous request | Default to `qa-planner` — it will scope and propose |

**Real parallelization**: when scope allows, invoke multiple `qa-implementer` instances in parallel for independent artifacts (page object + API client + test file). The orchestrator decides parallelization, not the agents.

### Signal → canonical docs (inject into the Task prompt)

Beyond the skills (`[[slug]]`), the orchestrator **must** resolve the canonical docs for the signal and inject them into the Task prompt — the agent starts from the right source instead of rediscovering relevance.

**Mandatory protocol before dispatching any agent:**
1. For each task signal, run `node scripts/docs-tooling.mjs resolve <topic>` (use the table below).
2. Copy the output into the Task prompt under the `## Relevant canonical docs` section.
3. No resolve = the agent rediscovers already-documented knowledge.
4. If `resolve` returns an unknown topic or "no doc covers it": read `docs/business-rules/BUSINESS_RULES.md` as a chapter map and `docs/business-rules/_index.md` to identify the closest chapter.

(full protocol in [`docs/_docs-conventions.md`](docs/_docs-conventions.md) §5–§7)

| Task signal | Suggested `resolve <topic>` |
|---------------|------------------------------|
| Signing / contract / GowSign / SignWell | `gowsign-routing` · `esign` · `template-rendering` |
| Funding / merchant / webhook | `funding-queue` · `merchant-config` · `webhooks` · `merchant-snapshot` |
| Payment / CC / ACH / sweep | `cc-payments` · `ach-payments` · `nsf-fee` · `sweeps` |
| Underwriting / fraud / SSN | `underwriting` · `fraud-vendors` · `ssn` |
| EPO / payoff / calculation | `epo` · `payoff` · `payment-calculator` |
| Account modification | `settlement` · `due-date-move` · `additional-lease` |
| Rating / auto-pay / delinquency | `rating-letters` · `auto-pay` · `delinquency` |

Rule: a **behavior** question → `resolve` (canonical business-rules); "**how do I drive the test**" → skill; "**recent gotcha**" → knowledge-base.

### Parallel execution limits

- **Max 3 simultaneous agents.** Beyond that, context switching and file conflicts outweigh the gain.
- **Parallel agents CANNOT edit the same file.** If two implementers need the same page object, serialize (one creates, the other consumes).
- **Lock protocol:** before editing a shared file (`src/pages/`, `src/helpers/`, `src/selectors/common.selectors.ts`), the agent checks whether another agent is editing it via a PID lock in `.claude/locks/`. Full protocol in `.claude/context/shared/agent-coordination.md`.
- **Conflict detected at runtime:** if two agents edited the same file, the orchestrator does a manual merge or asks the user to resolve it.

### Skill loading enforcement

- **Subagents do not have the `Skill` tool** — for them, loading a skill = `Read` on `.claude/skills/{slug}/SKILL.md` (loading protocol defined in each `.claude/agents/*.md`).
- **When dispatching an agent, include in the Task prompt the skills (`[[<slug>]]`) that the task signal already points to** (e.g., signing → `[[gowsign-knowledge]]`; locator failure → `[[dom-investigation]]`). The agent still decides on additional loads via its own protocol.
- **Every agent output MUST end with the line `**Skills loaded:**`** listing the SKILL.md files actually read. Output without this line → return it to the agent ONCE, requiring the declaration before accepting the result.
- A technical claim justified by a skill missing from the declaration degrades to `[HYPOTHESIS]` (rule #16).
- **Mechanical layer:** the `SubagentStop` hook (`.claude/scripts/verify-skills-loaded.mjs`, registered in `.claude/settings.json`) blocks a `qa-*` agent from terminating if (a) no `.claude/skills/*/SKILL.md` was read via `Read` in the transcript OR (b) the final output does not contain `Skills loaded:`. It blocks at most 1× per cycle (`stop_hook_active` guard); non-QA agents pass straight through. Decisions are logged in `.claude/logs/skills-hook.log`.

### Pipeline loop cap

- **Max 3 validator-debugger cycles per pipeline.** Each return from the validator to the debugger counts as 1 cycle.
- On the 3rd cycle without resolution: the validator produces a partial report and escalates to the user.
- Independent of the debugger's 3-strike rule (which is per hypothesis, not per cycle).

## Inviolable Rules

1. **Never skip planning** — any non-trivial test work starts with `qa-planner`. `qa-implementer` does not write tests without a SPEC.
2. **Existing artifacts are not recreated** — always check catalogs (`helpers-catalog`, `page-object-pattern`, `api-client-pattern`) before creating new.
3. **Fail-fast**: fix `tsc --noEmit` before handing off.
4. **`qa-doc-keeper` runs last in every pipeline** — no exceptions. Catalogs and pitfalls must stay in sync.
5. **Atomic scope**: each agent does ONE thing. Don't mix planning + implementation in one invocation.
6. **Real parallelization**: spawn agents in parallel when work is independent.
7. **Task report `docs/taskTestingUown/{testName}/{testName}-report.md` MUST be updated after every test execution** — never leave PENDING values after a successful run. Owned by `qa-validator`.
8. **QA domain reflexes are MANDATORY for every test creation or modification** — agents must consult [[qa-domain-reflexes]] skill regardless of task signal. Every business action step gets a corresponding validation.
9. **Test Data Hierarchy applies at every level** — spec design, implementation, orchestration, direct analysis. Fresh data via automation is DEFAULT; reusing existing record is EXCEPTION with written justification + fresh reproduction before classifying as bug. Direct UPDATE on DB is forbidden without explicit user authorization (Exception 3). See [[test-data-hierarchy]].
10. **Conservative bug classification** — isolated observation in pre-existing data is NOT a bug. Bug requires: (a) reproduction in fresh data, (b) check of existing task/issue (ask the user), (c) ruling out artifact indicators. Report language prefers `[OBSERVATION]` / `[HYPOTHESIS]` over `[CONFIRMED]`. See [[bug-classification]].
11. **Implicit requirements discovered during debug MUST become rules before pipeline closes.** If a test failed because of an undocumented requirement (non-obvious backend validation, hidden mandatory field, specific call order, unexpected timeout, environment config), the fix is only complete after: (a) code fix AND (b) pitfall added to [[application-lifecycle]] (or corresponding domain skill). Feeding the catalog is mandatory for the agent/orchestrator that discovered it, not optional.
12. **Merchant preflight before every new application.** Every application creation via API or UI must ensure merchant config (checkboxes + 13m/16m programs) matches [`src/data/merchant-config-contract.ts`](src/data/merchant-config-contract.ts). `createPreQualifiedApplication` calls `ensureMerchantReady` automatically; tests using other paths must invoke the helper before `sendApplication`. Default: auto-heal via `createOrUpdateMerchant` (flag `AUTO_HEAL_MERCHANT=true` in `.env`; set `false` to disable heal and fail-fast with drift list). Tests operating on existing lease/account should NOT run preflight — mutating out-of-scope merchant config is a side effect (pass `skipMerchantPreflight: true` or skip the helper). See [[merchant-preflight]].
13. **ALWAYS validate Activity Log — no log = nothing is happening.** Every relevant business action (signing event, payment attempt, refund, recovery, status transition, vendor callback) MUST have a corresponding activity log/note in `uown_los_lead_notes` or equivalent table. Absent log is an implementation failure, not acceptable behavior. Applies to ALL agents. Every test step that triggers a business action MUST include validation of the generated log (presence + expected content). Spec/report without log coverage is incomplete. Origin: daily UOWN 2026-04-28 (Priyanka Namburu): *"If there is no activity log, that means nothing is happening."* See [[activity-log-validation]].
14. **UI-first as default. API only when feature has no UI affordance.** If the feature has a user flow in the portal (Origination/Servicing/Website/AMS), the test MUST exercise that flow via browser. API-only is restricted EXCEPTION to: (a) admin/ops endpoints with no UI exposed (e.g. `PATCH /uown/svc/gowsign-templates/{id}`, scheduled task sweeps, internal CRUD); (b) preconditions/setup that accelerate the test (creating a lead via `sendApplication` before exercising the UI signing flow); (c) cross-cutting DB validations (assertion queries). Visual validation (rendered placeholders, badges, GowSign iframe content, PDFs) CANNOT be replaced by backend log reading — rendering bugs only become detectable when the customer sees them. Origin: 2026-05-06 — BUG-01 (empty placeholders in PDF of Daniel's Jewelers/CA) discovered manually by Fernando because API-only tests only read logs without rendering PDF. See [[ui-first-principle]].
15. **DOM-first on selector failures — inspect via MCP Playwright BEFORE proposing fix.** When a test fails with `TimeoutError`/`not visible`/`not found`/`strict mode violation` in a UI locator, the FIRST ACTION is to navigate the real portal via `mcp__playwright__browser_*`, authenticate, and use `browser_snapshot` + `browser_evaluate` to extract `tagName`, `role`, `accessible name`, `visible`, and ancestor chain of the element. **Viewport is portal-aware:** Origination/Servicing/AMS (internal, agent-facing portals) = single `1440×900` (Bootstrap `d-lg-block` ≥992px); Website (customer portal, customer-facing) = inspect at `375×667` + `768×1024` + `1440×900` in sequence — a mobile-heavy flow (OTP, signing, application form on mobile); a mobile-only bug is a silent regression if never inspected. Build a "Real DOM vs Current Selector" table and ONLY THEN propose a fix. Increasing timeout, adding retry, `force: true`, or `waitForTimeout` as first reaction is FORBIDDEN — masks root cause. Applies to `qa-debugger`, `qa-implementer`, and direct analysis. Fallback (CI without network): trace + screenshot from `reports/test-results/` + HTML pasted by user. Origin: 2026-05-11 — `unified-flow.spec.ts` "Items Purchased" timeout was wrong selector (`<a>` vs `<button>`), not timing; MCP investigation resolved in 10 minutes. Portal-aware viewport added 2026-05-22 (Website mobile gap). See [[dom-investigation]].
16. **Reports in `docs/taskTestingUown/` are history, not a source of patterns.** Agents must NOT read old reports as a source of patterns (selectors, helpers, classification, page objects). The source of patterns is the skills (`.claude/skills/`) and the code (`src/`, `tests/`). Re-reading a report is allowed ONLY for: (a) `qa-validator` updating it after a new run, (b) manual reproduction via leadPk/accountPk, (c) an audit requested by the user. **Inferring a pattern from a report = an agent bug.** Every generated report carries the disclaimer "This file is an execution record, NOT a source of patterns" at the top (template in [[test-report-standard]] section 1). Source-tagging is mandatory on every technical assertion — without an accompanying primary-source tag, the classification degrades from `[CONFIRMED]` to `[HYPOTHESIS]` (taxonomy in [[test-report-standard]] section 9). Drift-prone categories (sweep SQL, merchant config, rating letters, env provisioning, vendor health, activity log schema, portal naming) are listed in [[volatile-knowledge-registry]] — always verify the primary source before asserting. Memories (`.claude/projects/.../memory/`) are dated records — they may be stale and require cross-checking. Origin: 2026-05-22 — risk identified by the user that agents might infer a pattern from an old report with a pre-rule-#10 classification or deprecated helpers/selectors.

17. **When CLOSING a test pipeline, generate `{testName}-evidence.md` (stakeholder-facing) in addition to the `-report.md` (technical history).** The evidence is the artifact that gets pasted into the GitLab/Jira comment as proof of QA validation: product-focused, TL;DR + TOC + badges + `<details>` for findings + grouping by status (Observations / Blockers). Distinct from the `-report.md` (technical, for internal QA). Generate it ONLY once per task cycle, when: (a) the last PASS is validated, (b) there are no blocking bugs pending re-execution, (c) the user signaled "pipeline closed", "ready to paste into the ticket", "final report", or equivalent. Do NOT generate it on an intermediate run. Owner: `qa-validator` Phase 6.5. Template + checklist + style rules (do NOT use em-dash `—`; scenarios DESCRIBED in prose, not in a cramped table) in [[task-evidence-report]]. Origin: 2026-05-24 — the user formalized the style after 3 manual iterations with different evidence formats.

18. **Discovery and investigation follow the UI → API → DB hierarchy — no exception.** Any agent (orchestrator or subagent) that needs to discover how a feature works, map states, understand data flow, or investigate a behavior MUST go through the steps in this order: **(1) UI via MCP Playwright** — navigate the portal, click the features, walk through ALL relevant screens and options, capture snapshots; **(2) API** — inspect endpoints, payloads, responses, and headers; **(3) Database** — query tables and records to confirm persistence. Skipping the UI layer and going straight to the API or DB is FORBIDDEN when the portal exposes the feature — the behavior seen by the real user is the primary source of truth. The hierarchy ensures that visual bugs, broken flows, and rendering inconsistencies are not masked by reading the internal state directly. Allowed exceptions: (a) a feature with no known UI (internal/admin endpoint with no visual affordance), in which case start from the API, explicitly documenting the absence of a UI; (b) CI without network (trace/screenshot fallback). Applies to `qa-planner`, `qa-debugger`, `qa-implementer`, `qa-validator`, and the orchestrator. Origin: 2026-06-01 — user instruction to ensure discovery always starts from the real portal behavior.

19. **BDD Oracle — validate every named operation against its acceptance contract.** Full protocol in [`.claude/oracles/_index.md`](.claude/oracles/_index.md). **Trigger: do NOT rely on keyword matching alone** — after any action that produces a state change in a portal (navigation to a new route, form submission, button click that triggers a backend call, **or running `npx playwright test` on any spec that exercises a registered operation**), check `_index.md` regardless of how the request was phrased. **Running an existing spec IS performing the operations it exercises — it is not exempt.** Classifying "run this test" as purely a technical operation to skip BDD is a protocol violation. If the outcome matches a listed operation, the oracle applies. Summary: **(a) Operation listed in `_index.md`:** read the BDD file → run staleness check (command embedded in each `### Oracle` section) → if stale, prepend `[BDD MAY BE STALE]` → validate every checkpoint → report PASS/FAIL before declaring the action complete. **(b) Operation NOT listed (ANY context — ad-hoc request OR QA pipeline, no distinction):** STOP before performing. Author the BDD first via the `test-scenarios` skill (ground checkpoints in the canonical business rules; run a `discovery` pass per rule #18 if the expected behavior is unknown), register it in `_index.md` (new row + `covers`/`last-reviewed` frontmatter), THEN perform the operation and validate every checkpoint → report `Oracle: CT-XX — PASS/FAIL`. **Nothing reaches a validated state without an oracle** — the former "proceed and append `[UNVALIDATED — no BDD oracle registered]`" escape hatch is RETIRED. An unlisted operation is never a license to proceed unvalidated; it is the trigger to create the missing oracle first. **(c) Oracle checkpoint FAILS:** inspect real DOM first → check if `covers` files changed intentionally → if yes, BDD is stale (update it); if no, report as `[BUG]`. Never confirm a bug without ruling out BDD staleness. **(d) Orchestrator dispatching an agent** that will perform a listed operation: include `> BDD Oracle applies (rule #19) — read .claude/oracles/_index.md before marking the operation complete.` in the task prompt. **(e) "Create a lease" / "perform X in portal" vs "run the test for X":** these are different requests with the same oracle obligation — do not conflate them. "Create a lease via new application" = manual portal operation via MCP Playwright; "run new-application.spec.ts" = automated test execution. Both require oracle pre-check. Applies to every agent and the orchestrator, including ad-hoc requests. Origin: 2026-06-26; extended 2026-06-26 (Bash/playwright test gap); (b) unified to STOP-and-create for ad-hoc + `[UNVALIDATED]` escape retired 2026-06-27.

## Detailed References

| Topic | File |
|-------|------|
| Domain-specific rules (path-scoped) | [`.claude/rules/`](.claude/rules/) |
| Skills (all 30+) | [`.claude/skills/`](.claude/skills/) |
| Agents | [`.claude/agents/`](.claude/agents/) |
| Structure, API clients, path aliases | [`.claude/context/project.md`](.claude/context/project.md) |
| Environments, URLs, env vars, timeouts, PW projects | [`docs/claude/environments.md`](docs/claude/environments.md) |
| Test patterns, fixtures, tags, best practices | Skills [[e2e-examples]] · [[common-operations]] · [[page-object-pattern]] · [[api-client-pattern]] |
| Agents and sub-agents | [`docs/AGENTS.md`](docs/AGENTS.md) |
| Complete business rules | [`docs/business-rules/`](docs/business-rules/) |
| BDD scenarios + Oracle index (Gherkin + post-action validation, rule #19) | [`.claude/oracles/_index.md`](.claude/oracles/_index.md) · [`.claude/oracles/`](.claude/oracles/) |
| Stakeholder test reports (from `/test-report`) | [`docs/reports/`](docs/reports/) |
| Per-feature investigation knowledge (from `/discovery`) | [`docs/knowledge-base/`](docs/knowledge-base/) |
| User Stories + Lease Risks (full journey) | [`docs/user-stories/jornada-completa-lease.md`](docs/user-stories/jornada-completa-lease.md) |
| Testing guide and conventions | [`docs/TESTING.md`](docs/TESTING.md) |
| ADRs (Architecture Decision Records) | [`docs/adrs/`](docs/adrs/) |
| Project context | [`.claude/context/project.md`](.claude/context/project.md) |
| Java ↔ TypeScript glossary | [`.claude/context/glossary.md`](.claude/context/glossary.md) |
| Application source repos | [`.claude/context/app-repos.md`](.claude/context/app-repos.md) |
| Database schema | [`docs/taskTestingUown/database-schema.md`](docs/taskTestingUown/database-schema.md) |
| Agent coordination (locks) | [`.claude/context/shared/agent-coordination.md`](.claude/context/shared/agent-coordination.md) |
| Personal settings overrides | [`.claude/settings.local.json`](.claude/settings.local.json) (gitignored — create locally) |

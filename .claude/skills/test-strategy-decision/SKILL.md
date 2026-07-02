---
name: test-strategy-decision
description: Load before choosing how to implement each scenario — decides E2E vs API vs hybrid vs DB-only, smoke vs full, parallelization and environment (sandbox/qa1/qa2/stg). Applies inviolable rule #14 (UI-first).
disable-model-invocation: true
---

# Test Strategy Decision — choose the right test level

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO CHOOSE** — E2E vs API vs hybrid, smoke vs full, environment, parallelization. For **canonical portal names** (Website/Servicing/Origination/AMS) run `node scripts/docs-tooling.mjs resolve customer-portal` or read `docs/business-rules/01-fundamentos.md` (portal naming is in [[volatile-knowledge-registry]] — cross-check mandatory). For **env URLs, variables and timeouts**, read `docs/claude/environments.md`. **Do not duplicate env configuration here** — it drifts.

> Inviolable project rule #14: a feature with a UI affordance REQUIRES a browser test. API-only is the exception, not the default.

## When to apply

- After `scope-analysis` + `risk-based-prioritization`, before the SPEC.
- You are tempted to write API-only "because it's faster" — stop here.
- You are about to choose an environment: sandbox? qa1? qa2? stg? (each has trade-offs)
- You are about to decide parallelization (`test.describe.parallel`, `workers`, sharding).
- The `qa-flow` pipeline needs to define smoke vs full before CI.

## Principles

1. **UI-first as default** (rule #14). API-only only with written justification.
2. **Test level = where the risk lives.** Visual risk → UI. Contract risk → API. Invariant risk → DB.
3. **Hybrid is the rule, not the exception.** Setup via API + assertion via UI is the UOWN standard (creates a lead via `sendApplication`, exercises signing via the browser).
4. **Environment matters.** Sandbox = isolated; qa1 = shared; qa2 = shared, more stable; stg = pre-prod, the source of truth for DoD.

## Procedure

### Step 0 — BDD Oracle pre-check (rule #19)

Before deciding the level, check `.claude/oracles/_index.md` for the scenario's operation. If an oracle exists, its UI-vs-API split may already dictate the exercise level. If not, flag oracle authorship as a SPEC dependency before implementation starts.

### Step 1 — Decide the level (UI / API / DB / hybrid)

Checklist question per scenario:

| Question | If YES → |
|---|---|
| Does the feature have a button / page / flow in the portal (Origination/Servicing/Website/AMS)? | UI mandatory (rule #14) |
| Was the historical bug about visual rendering (placeholders, PDF, badges, layout)? | UI mandatory (Daniel's Jewelers case) |
| Is there an assertion that only makes sense via UI (PDF preview, GowSign iframe, toast text)? | UI mandatory |
| Is the operation admin/ops with no exposed UI (PATCH gowsign-templates, sweep scheduled task, internal CRUD)? | API-only OK |
| Is setup expensive via UI (create a lead, propagate to a state)? | API for setup + UI for assertion (hybrid) |
| Is the assertion cross-cutting (validate an invariant across N rows, schedule aggregation)? | DB for assertion |
| Is an activity log expected (rule #13)? | DB assertion mandatory (`uown_los_lead_notes`) |

Rule of thumb (decision tree):

```
[Feature has UI?]
├── YES
│ ├── [Setup expensive?]
│ │ ├── YES → hybrid (API setup + UI exercise + DB assert)
│ │ └── NO → pure UI (UI exercise + DB assert)
│ └── (UI mandatory on the customer path)
└── NO
 ├── [Admin/sweep endpoint?]
 │ ├── YES → API-only (justify in 1 line)
 │ └── NO → reconsider — maybe there is a hidden UI
 └── (API-only with DB assert)
```

### Step 2 — Setup vs Exercise vs Assertion (separate them)

For each scenario, declare 3 phases:

- **Setup** (precondition): as fast as possible. API `sendApplication`, helpers like `createPreQualifiedApplication`, factories. Does not exercise what is under test.
- **Exercise** (the thing under test): respects rule #14 — if it has a UI, exercise the UI.
- **Assertion** (oracle): UI render + DB row + log + email/SMS when applicable. Activity log assertion is not optional (rule #13).

Example:
```
Setup: API sendApplication (UOWN happy path) → lead in PRE_QUALIFIED
Exercise: UI Origination → complete Personal Info → submit
Assertion: UI shows confirmation + uown_los_lead.status = QUALIFIED + uown_los_lead_notes(note_type=PERSONAL_INFO_SUBMITTED)
```

### Step 3 — Decide smoke vs full

Smoke (≤10min, blocker on merge):
- 1 P0 happy-path scenario per brand
- 1 main error scenario
- No deep regression

Full (running on scheduled / pre-release):
- All P0 + P1
- Regression of the impacted flows (DoD)
- Visual diff when applicable (GoSign vs SignWell)

Decide explicitly: **does this scenario go into smoke or only into full?**

### Step 4 — Choose the environment

| Environment | When to use | When NOT to use |
|---|---|---|
| **sandbox** (default) | Local dev, fast debug, own synthetic data | When you need shared config (real vendor, IMAP) |
| **qa1** | Tests against the first shared env | When there is a known outage (`project_dv360_uat_qa1_outage_2026_05_18` — sendApplication 500 in qa1) |
| **qa2** | More stable tests, preferred env for validation | OK as default when qa1 is unstable |
| **stg** | Final validation, DoD requires it (`project_qa_task_structure` — DoD = QA + Staging) | Do not run destructive exploration tests |
| **dev1/2/3** | When a specific dev is iterating | Unpredictable state, do not rely on it for a report |

Ground rule: **DoD requires stg**. Whoever closes a task with only qa does not meet the DoD.

### Step 5 — Parallelization

| Scenario | Parallelize? |
|---|---|
| Scenarios share the same lead/account | NO — serialize |
| Scenarios share a merchant with potential config drift | NO — or use `skipMerchantPreflight` (rule #12) |
| Scenarios use a shared IMAP inbox (`fintechgroup777@gmail.com`) | YES with plus-addressing per `runId` (`reference_imap_fintechgroup777`) |
| Independent scenarios with fresh data | YES |
| CI with limited workers | Configure `workers: N` based on the project (PW projects in `docs/claude/environments.md`) |

Playwright default: `fullyParallel: true` when data is fresh. Mark `test.describe.serial` if there is shared state.

### Step 6 — Output

```markdown
## Test Strategy — {task-id}

### Scenario 1: {name}
- Level: pure UI | API-only | hybrid | DB-only
- Level justification: ...
- Setup: ... (fast path, without exercising what is under test)
- Exercise: ... (respects UI-first)
- Assertion: UI: ... | DB: ... | Activity log: ... | Email: ...
- Smoke or full: smoke | full
- Recommended environment: qa2 (and stg for DoD)
- Parallelization: yes/no — justification

### Scenario 2: ...

### Global decisions
- Smoke set: scenarios {ids}
- Full set: all
- Workers/sharding: ...
- Run environments: qa2 (primary) + stg (DoD validation)
```

## Heuristics

- **"If the customer sees it, the test exercises what they see."** Validate via UI render, not only via the log.
- **"PDF / iframe / placeholder → UI mandatory."** The Daniel's Jewelers CA case closed that door: API-only that read the log missed a column gone from the PDF.
- **"Setup is UI when setup IS the feature."** If what is under test is the new-application, do not create a lead via API — create it via UI (`feedback_setup_via_ui_new_application`).
- **"Email = IMAP + click the link."** Do not take the URL from the API payload (`feedback_email_imap_click_link`).
- **"Stg or nothing"** — without running on stg, the DoD is not closed.
- **"qa1 today may be down"** — check `project_dv360_uat_qa1_outage_2026_05_18`; if the outage is active, fall back to qa2.
- **"Existing helpers first"** — before creating a new helper, consult `skill [[helpers-catalog]]`.

## Expected output

A markdown block structured per scenario (template above). Size proportional to the number of scenarios. Always ends with **Global decisions**.

## Anti-patterns

- API-only "because it's faster" when the feature has a UI — violates rule #14.
- Setup via UI when setup is not the feature (and the UI path is expensive / flake-prone).
- Skipping stg "because qa passed" — DoD violated.
- Parallelizing scenarios that share a merchant without preflight care — config drift causes flake.
- Running tests on dev1/2/3 and reporting it as DoD evidence — dev is unstable.
- Mixing Setup/Exercise/Assertion in a single call, blurring what is under test.
- Implementing a heavy smoke (≥30min) — smoke is a fast blocker; heavy becomes full.

## References

- `.claude/rules/testing.md` § UI-First Principle
- `docs/claude/environments.md`
- `skill [[helpers-catalog]]`
- `skill [[api-client-pattern]]`
- memory: `feedback_setup_via_ui_new_application`, `feedback_email_imap_click_link`, `project_dv360_uat_qa1_outage_2026_05_18`, `reference_imap_fintechgroup777`

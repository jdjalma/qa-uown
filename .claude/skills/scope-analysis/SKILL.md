---
name: scope-analysis
description: Load BEFORE generating a SPEC or implementing a test for a new feature/bug — breaks the feature into testable units, separates IN/OUT, surfaces implicit requirements (locales, perms, prior states, vendor integrations) and generates questions for the PO/dev before touching code.
disable-model-invocation: true
---

# Scope Analysis — think like a QA Lead before testing

> This skill swaps the reflex "I read the ticket, I'll write the test" for the reflex "I read the ticket, I know what is NOT stated and where it will break".

## When to apply

Explicit signals that this skill is relevant:

- A new task arrived (skill [[fetch-gitlab-task]] returned a GitLab issue) and there is no SPEC yet.
- The user asked "create a test for X", "test this fix", "validate this feature" — any entry into the `new-flow`, `new-api`, `qa-flow` pipeline.
- Bug report without fresh reproduction (inviolable rule #10 — before classifying a bug, map scope).
- Hotfix landed and needs regression (GoSign / Daniel's Jewelers CA case — the real scope was multi-state, not just the changed state).
- Refactor that touches a critical handler (`submitApplication`, `MissingDataPanel`, OTP gen) — the real scope is dual-brand + lease-edit, not smoke.

Do NOT apply when: a validated SPEC already exists and the work is just a 1:1 implementation of the SPEC.

## Principles

1. **Declared scope ≠ real scope.** The ticket describes the happy path; the test covers the happy path + the non-obvious paths.
2. **Asking before testing is cheaper than retesting.** Each question sent to the PO/dev at analysis time saves a "it failed, it was an implicit requirement" cycle.
3. **Coverage is negotiation, not exhaustion.** This skill's output is a defensible IN/OUT matrix, not a list of every possible scenario.
4. **Every discovery of an implicit requirement must become a rule** (CLAUDE.md #12).

## Procedure

### Step 1 — Read the input as a skeptic, not as an executor

Read the ticket / request and mark:
- What is **explicitly declared** (AC, description, screenshots)?
- What is **tacitly assumed** (locale = EN-US? portal = Origination? merchant = UOWN? device = desktop?)
- What is **absent** (rollback path, error path, role perms, behavior if feature flag off)?

If explicit AC are missing: **block the pipeline** and return to the user asking for AC (memory `project_qa_task_structure` — no AC = no testing).

### Step 2 — Break into testable units

Every feature decomposes into:

| Layer | Guiding question |
|---|---|
| **Entry points** | How does the user/system trigger this? (UI button, API endpoint, scheduled job, vendor webhook) |
| **Inputs** | Which fields, payloads, prior states? Valid range? Invalid range? Empty? Null? Unicode? |
| **Processing** | What code runs? Which services/DB tables are touched? What is the synchronous vs async path? |
| **Outputs** | UI render, response shape, DB row, email, activity log (rule #13), outbound webhook, side-effects |
| **Reversal** | Is there an undo / cancel / rollback? What happens if it fails midway? |

For each unit, note: does existing coverage already exist? Where? (Consult `skill [[page-object-pattern]]`, `helpers-catalog.md`, `api-clients-catalog.md`.)

### Step 3 — IN / OUT matrix

Produce two explicit columns:

**IN scope (I will test):**
- AC happy path
- Edge cases mapped in the ticket
- Regression of the impacted flows (DoD — `project_qa_task_structure`)
- Integration points touched by the diff

**OUT of scope (won't test now, but I record it):**
- Adjacent features that share code but were not changed (unless regression is required — e.g., SignWell when the feature is GoSign — `project_gosign_rollout`)
- Locales / brands / portals outside the diff (unless dual-brand is mandatory — `feedback_qa_flow_scope_dual_brand_lease_edit`)
- Performance / load (unless the feature is about throughput)

Each OUT item must have a 1-line justification. If the justification is "I figured it wasn't needed", move it back to IN.

### Step 4 — Hunting list (non-obvious)

Mandatory checklist questions, sweeping the dimensions that tend to hide bugs in the UOWN domain:

1. **Brands / portals**: does the feature run in UOWN and Kornerstone? Customer portal (Website) AND Servicing? Origination? AMS?
2. **Merchant config**: does it depend on a checkbox / 13m vs 16m program vs both? Does it need `merchant-config-contract.ts` preflight? (rule #12)
3. **Prior lead states**: pre-qualified, qualified, leased, signed, funded, charged-off — which ones does the feature accept? Reject? Silently ignore?
4. **Locales / states**: does behavior change by state (CA, FL, GA, TX...)? Does the contract template change? (GoSign vs SignWell by state)
5. **Roles / perms**: customer vs agent vs admin? Agent with role "Approval" vs "Support" vs "Read-Only"?
6. **Device / viewport**: ≥1440px (rule #15 — Bootstrap `d-lg-block`)? Customer's real mobile?
7. **Vendor integrations**: Kount, SEON, Plaid, MX, GowSign, SignWell, Tilled, Repay, EasyPay, DocuSign, Twilio — which one is touched? Mocked? Does it have a sandbox?
8. **Timing / async**: scheduled task? Polling? Webhook? What is the DB propagation SLA?
9. **Activity log** (rule #13): which row in `uown_los_lead_notes` should appear? Expected content?
10. **Email / SMS**: does it trigger a communication? Is IMAP polling needed? Template name?
11. **Money / float**: monetary values in the path? Does float repr (`18.46` vs `18.459999...` — `feedback_float_repr_not_bug`) need tolerance?
12. **Feature flags / SQL config**: does behavior depend on `uown_sv_sql_config`? Which key? (`reference_sqlconfig_admin_endpoint`)
13. **Submit idempotency**: does the path include `submitApplication` or re-submit (lease-edit)? The `single-flight ref` must reset between invoices — double-submit guard is mandatory (`feedback_qa_flow_scope_dual_brand_lease_edit`).

Each "yes" becomes a candidate testable unit; each "I don't know" becomes a question for the PO.

### Step 5 — Questions for PO/dev (before the SPEC)

Format as an enumerated list, grouped by urgency:

**Blockers** (without an answer, I don't write the SPEC):
- Missing explicit AC
- Undocumented API/payload contract
- Expected behavior on the error path not defined

**Strong** (I'll assume a default and mark it `[ASSUMPTION]`):
- Default locale / brand
- Perm matrix

**Informational** (I proceed, I record the answer in the SPEC):
- Edge cases I discovered beyond the ticket

### Step 6 — Formal output

Deliver to the orchestrator / `qa-planner` the following block:

```markdown
## Scope Analysis — {task-id}

### Testable Units
1. {unit} — entry: {how}, IN/OUT: IN, justification: {why}
2. ...

### IN Scope
- [unit 1] {one-line summary}
- [unit 2] ...

### OUT of Scope
- [adjacent feature] {why not now}

### Non-obvious Requirements (hunting list)
- Brands: {UOWN | KS | both}
- Merchant config: {requires preflight | not applicable}
- Lead state preconditions: {list}
- Locale/state matrix: {list}
- Vendor integrations touched: {list}
- Activity log expected: {table.column = value}
- Money handling: {tolerance needed Y/N}

### Open Questions
**Blockers:**
- Q1: ...
**Strong assumptions:**
- A1: ... (marking [ASSUMPTION])
**Informative:**
- ...

### Recommended Pipeline
new-flow | new-api | new-page-object | debug | qa-flow | ...
```

## Heuristics

- **"The ticket says X. What else breaks X without saying so?"** — always run this question before signing off on the IN/OUT.
- **The 3-portals rule**: if the feature touches a lead/lease, ask yourself "Does Origination see it? Does Servicing see it? Does Website (customer) see it?" — if the answer is "yes in 2+" but the ticket only mentions 1, that's a red flag.
- **The multi-state hotfix rule**: bug in CA → test CA + 1 representative SignWell state (regression) + 1 GoSign state (coverage) — never just the bug's state.
- **The submit handler rule**: any change that touches `submitApplication` requires dual-brand + lease-edit (`feedback_qa_flow_scope_dual_brand_lease_edit`).
- **The "implicit config" rule**: if the feature depends on SQL config / merchant flag / feature toggle, list the config as a precondition in IN scope. Do not trust "it's enabled today".

## Expected output

Structured markdown (template above) that the orchestrator attaches to the SPEC. Typical size: 30–80 lines. If the feature is genuinely a 1-liner (typo fix), the output can be proportionally short — but the 6 checklist questions must appear even if empty.

## Anti-patterns (do NOT do)

- Writing a test before having the IN/OUT documented.
- Accepting a ticket without AC and "inventing" the AC out of nowhere (memory `project_qa_task_structure`).
- Assuming a default locale/brand/state without recording it as `[ASSUMPTION]`.
- Treating adjacent features as OUT without checking whether they share code with the in-scope feature (classic case: submitApplication handler).
- Skipping the hunting list "because the feature is small" — small features are where implicit requirements hide most.
- Mixing scope analysis with scenario design (scenario is the work of `test-design-techniques` + `risk-based-prioritization`).

## Cross-references

- `.claude/rules/testing.md` § Test Data Hierarchy
- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- `docs/user-stories/jornada-completa-lease.md`
- `src/data/merchant-config-contract.ts`
- memory: `project_qa_task_structure`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `project_gosign_rollout`

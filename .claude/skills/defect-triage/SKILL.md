---
name: defect-triage
description: Load when classifying an observation during a test/run — decides bug vs improvement vs debt, severity S1-S4 × priority P0-P3, requires a fresh repro before [CONFIRMED] (inviolable rule #10). Yuri has the final word in a dispute.
disable-model-invocation: true
---

# Defect Triage — classify rigorously before reporting

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO TRIAGE** — severity×priority matrix, classification protocol. For domain states and enums that ground severity (account states, payment states, funding states), run `node scripts/docs-tooling.mjs resolve enums` (or `account-status`, `payments`) or read `docs/business-rules/appendix-d-constantes-enums.md` + `appendix-g-cenarios-risco.md`. **Do not duplicate domain rules here** — they drift.

> Inviolable rule #10: an isolated observation in pre-existing data is NOT a bug. A bug requires a fresh repro + a check for an existing issue + ruling out an artifact.

## When to apply

- A test failed or returned unexpected behavior.
- An exploratory session produced `[OBSERVATION]` / `[HYPOTHESIS]` (from `exploratory-heuristics`).
- A customer/agent reported strange behavior.
- Before opening a ticket in GitLab or noting it in a report.
- Disagreement between QAs over whether something is a bug — the dispute goes to Yuri (`project_qa_task_structure`).

## Principles

1. **Conservative language.** Prefer `[OBSERVATION]` / `[HYPOTHESIS]` over `[CONFIRMED]` (rule #10).
2. **Reproduce first, classify after.** No fresh repro, no `[CONFIRMED]`.
3. **Symptom ≠ root cause.** Triage includes a minimal cause hypothesis; it does not require full debugging, but asks for more than "it's wrong".
4. **Severity × Priority are orthogonal.** Severity = technical/functional impact; Priority = business urgency.
5. **Yuri decides a dispute** between bug / improvement / debt (`project_qa_task_structure`).
6. **No DB mutation to force a pass** (`feedback_no_db_mutation_to_force_pass`). If a precondition does not exist, a skip/timeout is a valid result — it does not classify as a bug.

## Procedure

### Step 1 — Capture the observation

Minimal format:
```
Symptom: what I saw vs what I expected
Environment: env + browser + viewport + data context
Repro steps: exact steps
Frequency: 1/1, 1/3, ...?
Evidence: screenshot/log/DB dump
```

### Step 2 — Apply the gates of rule #10

Before promoting to `[CONFIRMED]`:

- [ ] **Fresh repro:** reproduced in data created now (not in a pre-existing record whose history is unknown)?
- [ ] **Existing issue:** is there already an open ticket for this? (ask the user / search GitLab)
- [ ] **Artifact ruled out:**
 - It is not a Playwright framework flake (local timing).
 - It is not a pre-existing data state (lead in state X created in 2025, etc.).
 - It is not env-specific (current qa1 outage — `project_dv360_uat_qa1_outage_2026_05_18`).
 - It is not merchant config drift (rule #12).
- [ ] **UI matches expected oracle:** is what the customer sees REALLY a problem? (Float repr `18.4599...` is UX, not a functional bug — `feedback_float_repr_not_bug`).

If any item failed: the classification stays at `[HYPOTHESIS]` or `[OBSERVATION]`.

### Step 3 — Classify the type

| Type | Criterion |
|---|---|
| **Bug** | The system deviates from a clear AC / spec / oracle. Regression. |
| **Improvement** | The system meets the AC, but UX/perf/clarity could be better. |
| **Technical debt** | Known issue, consciously decided, recorded. |
| **Observation without action** | None of the above — discard or record for a future session. |

Dispute: Yuri decides (`project_qa_task_structure`).

### Step 4 — Severity (technical/functional)

| Severity | Criterion | UOWN example |
|---|---|---|
| **S1 — Critical/Blocker** | Blocks revenue or violates compliance/legal | `submitApplication` returns 500 prod-wide; legally wrong lease document; NACHA bug |
| **S2 — High** | Core feature broken with a difficult workaround | GoSign CA signing omits columns; OTP does not arrive in 100% of cases |
| **S3 — Medium** | Functional bug with a viable workaround | Refresh resolves it; specific states affected; misaligned UI |
| **S4 — Cosmetic** | Visual, non-functional, low impact | Ugly float repr on screen; spacing; typography |

### Step 5 — Priority (business/urgency)

| Priority | Criterion | Example |
|---|---|---|
| **P0 — Urgent** | Hotfix now, halts release | Blocks revenue or compliance |
| **P1 — High** | Next release, sprint blocker | Core feature affected, customer-facing |
| **P2 — Medium** | Prioritized backlog, upcoming releases | Edge case, reversible customer-facing |
| **P3 — Low** | When possible | Cosmetic; minor agent-only |

S × P are independent. S1/P3 does not exist in practice; S4/P0 does (e.g. a legal typo in the PDF that a regulator would notice).

### Step 6 — Symptom vs root cause (minimal hypothesis)

Does not require full debugging, but at least:
- **Symptom:** what appears to the user.
- **Cause hypothesis:** "Probably because {module X} does not handle {edge Y}." Mark it as `[HYPOTHESIS]`.
- **Likely location:** suspect file/function/table.

This speeds up the dev and avoids "QA reported it, dev sent it back asking for more info".

### Step 7 — Formal output

```markdown
## Defect Triage — {short-title}

### Classification
- Type: BUG | IMPROVEMENT | TECHNICAL DEBT | OBSERVATION
- Status: [OBSERVATION] | [HYPOTHESIS] | [CONFIRMED]
- Severity: S1 | S2 | S3 | S4
- Priority: P0 | P1 | P2 | P3

### Symptom
{1-2 sentences — what was seen vs what was expected}

### Repro
- Environment: {env, browser, viewport, data}
- Steps: {numbered, from scratch}
- Observed frequency: {1/1, 2/3...}
- Fresh data? {yes/no — if no, classify as HYPOTHESIS}

### Oracle violated (HICCUPPS)
{which letter justifies calling it a bug}

### Rule #10 gates
- [x] Fresh repro
- [x] Existing issue checked (none found)
- [x] Artifact ruled out: flake/env/config/data

### Cause hypothesis
{suspect module/file/table}

### Evidence
{paths to screenshots, logs, dumps}

### Recommendation
- Open ticket: GitLab issue draft (suggested title + body)
- OR: record as observation in the report without opening a ticket
- OR: escalate to Yuri for disputable classification
```

## Heuristics

- **"Can I reproduce it from scratch in 5min?"** If not, the first task is to improve the repro before classifying.
- **"Does the current behavior violate an explicit AC?"** If yes → bug; if no → possibly an improvement.
- **"Would Yuri agree it is a bug?"** If there is doubt, escalate. Do not absorb the dispute.
- **"Ugly float on the UI"** → S4 / P3. Do not invent that it is a functional bug (`feedback_float_repr_not_bug`).
- **"Missing activity log"** (rule #13) → implementation bug, not acceptable behavior. Minimum S3.
- **"Irreversible customer-facing"** (lease signed wrong, payment charged wrong) → S1 or S2 depending on scope.
- **"Env-specific in qa1 today"** → check the outage (`project_dv360_uat_qa1_outage_2026_05_18`) before classifying.

## When NOT to open a ticket

- Failure due to a known env outage (qa1 sendApplication 500 today) — record an observation, do not open a ticket.
- Cosmetic float repr with no functional impact — record as a UX suggestion.
- Observation that could not be freshly reproduced — stays as `[HYPOTHESIS]` in the report, open a ticket ONLY if the repro appears.
- Behavior consciously decided as technical debt — do not open a bug, record it in the debt doc.

## Expected output

A markdown block (template above). 30–80 lines. Always ends with an explicit `### Recommendation`.

## Anti-patterns

- Reporting `[CONFIRMED]` without a fresh repro → violates rule #10.
- Mixing severity with priority as if they were the same axis.
- Skipping "existing issue" → creates a duplicate.
- Inventing a root cause as if it were certain → write `[HYPOTHESIS]`, the dev will investigate.
- Asking for a DB mutation to "make the test pass" and classifying a missing precondition as a system bug (`feedback_no_db_mutation_to_force_pass`).
- Classifying ugly UX as S1 — severity inflation destroys credibility.
- Deciding bug vs improvement alone in a disputable case — Yuri decides.

## Short examples (UOWN domain)

### Example 1 — "GoSign PDF omits a column in CA"

- Symptom: the payment schedule in the GoSign CA PDF shows 3 columns; SignWell CA shows 5.
- Fresh repro: yes (lead created now, same merchant, same state).
- Oracle: History (vs SignWell) + Product (self-consistency).
- Classification: BUG / `[CONFIRMED]` / S2 / P0 (customer-facing, financial document, halts GoSign rollout).
- Hypothesis: the GoSign CA template in `gosign-templates` does not have all the columns configured.
- Recommendation: open a hotfix ticket; cross-link with `project_gosign_rollout`.

### Example 2 — "Total $18.46 vs schedule sum $18.4599..."

- Symptom: on the UI, the displayed total is `$18.46`; the sum of the installments displayed elsewhere is `$18.459999...`.
- Fresh repro: yes.
- Oracle: Image (ugly UX), not Product (the math is correct within float tolerance).
- Classification: IMPROVEMENT / `[CONFIRMED]` / S4 / P3.
- Hypothesis: the currency formatter is not applied in this render.
- Recommendation: open a UX improvement ticket; does not block the release.

### Example 3 — "Lead in qa1 did not submit — 500 Apache HTML"

- Symptom: `sendApplication` returns 500 with Apache HTML.
- Fresh repro: yes, any merchant.
- Gate `[Artifact ruled out]`: known qa1 env outage (`project_dv360_uat_qa1_outage_2026_05_18`).
- Classification: OBSERVATION (env outage) — not a product bug.
- Recommendation: workaround on qa2; do not open a ticket; wait for restoration.

### Example 4 — "Missing activity log after signing"

- Symptom: signing completed (UI confirmation, DB lead.status=SIGNED), but `uown_los_lead_notes` has no row of type SIGNATURE_COMPLETED.
- Fresh repro: yes.
- Oracle: Claims (project rule #13 — no log = nothing happened).
- Classification: BUG / `[CONFIRMED]` / S3 / P1.
- Hypothesis: the signing-completed handler is not calling `addLeadNote`.
- Recommendation: open a ticket; impacts: audit, customer support, regression.

### Example 5 — "KS3015 does not accept 16m"

Before classifying a bug, remember `feedback_16m_eligibility_merchant_config` — 16m depends on merchant config, not on brand. Check `uown_merchant_program(merchant_id, term_in_months=16, is_active=true)`. If absent, it is config drift (rule #12) or expected — not a bug.

### Example 6 — "Submit double-fire on lease-edit"

- Symptom: the customer reopens the Complete page after an invoice edit; submit fires `submitApplication` 2x.
- Fresh repro: yes (`feedback_qa_flow_scope_dual_brand_lease_edit` — the single-flight ref persisted).
- Oracle: Product (idempotency expected) + Image (creates 2 contracts).
- Classification: BUG / `[CONFIRMED]` / S2 / P0.
- Hypothesis: the `useRef` in MissingDataPanel is not resetting between invoices.
- Recommendation: hotfix; dual-brand regression mandatory.

## References

- `skill [[bug-classification]]`
- `skill [[qa-domain-reflexes]]`
- memory: `project_qa_task_structure`, `feedback_float_repr_not_bug`, `feedback_no_db_mutation_to_force_pass`, `project_dv360_uat_qa1_outage_2026_05_18`, `project_gosign_rollout`, `feedback_qa_flow_scope_dual_brand_lease_edit`, `feedback_16m_eligibility_merchant_config`

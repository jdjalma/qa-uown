---
name: bug-classification
description: Load before reporting a finding as a bug. Requires fresh reproduction in data created via automation before elevating [OBSERVATION]/[HYPOTHESIS] to [CONFIRMED]. An observation in pre-existing data is NOT a bug — it may be an artifact.
disable-model-invocation: true
---

# Bug Classification Rules — UOWN Leasing

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO CLASSIFY** — evidence rules, fresh repro, taxonomy. For canonical enums and states (`arrangement=SUCCESS`, `BLOCKED_ACCOUNT`, status codes), run `node scripts/docs-tooling.mjs resolve enums` (or `payments`, `account-status`) or read `docs/business-rules/appendix-d-constantes-enums.md`. **Do not rewrite state rules here** — they drift.

> **Purpose:** prevent premature classification of "Application Bug" by agents and direct flows. An isolated observation in pre-existing data is a HYPOTHESIS, not a bug. A bug only after reproduction + checking for an existing task.
>
> **Applicable to:** `qa-validator`, `qa-debugger`, `/qa-flow`, `/new-*` commands, and Claude's direct analyses. **It is not optional.**
>
> **Why this file exists:** a false bug costs the dev team's time, pollutes reports, and wears down the relationship between QA and engineering. In pipeline #491 (2026-04-21), a "critical inconsistency" (BUG-APP-A: arrangement=SUCCESS + installments=BLOCKED_ACCOUNT in account 11263) turned into 4 hours of investigation + a fix recommendation to the dev before reproducing in a fresh account — where the behavior was CORRECT. It was an artifact of an old fixture, already covered by a task in the backlog.

---

## Rule 1 — Don't classify as a bug without reproduction in fresh data

An isolated occurrence in a pre-existing record is an **observation**, not a bug.

- To become an "Application Bug" it requires reproduction in an **account/lead/data created from scratch by the test execution itself** (preferably) or in fresh data from the current day.
- If it didn't reproduce in fresh data → classify as `INVESTIGATE` or `OBSERVATION TO CONFIRM`, never "bug".
- If the case was observed in a pre-existing record (old fixture, seed data, manual QA account), the suspicion holds but requires:
 1. An attempt at reproduction in an account created by the test itself, OR
 2. Confirmation in the source code of a deterministic inconsistency (not just circumstantial correlation).

---

## Rule 2 — Distinguish test artifact vs. production defect

**Artifact indicators (not a production defect):**

- `agent='SYSTEM'` throughout the record's history
- PK in a known fixtures range (created by smoke collection, seed scripts)
- Activity log dominated by `SYSTEM` with sparse human revisions
- Lead created via Postman collection / automation helper
- Use of a test bank (`routing=123456780`, `account=160781900000`, etc.)
- Customer name in the pattern `TestFN<hash>`, `TestLN<hash>`
- Record dates > 24 hours before the current execution (inherited data)

**Protocol:** If 2 or more indicators are present → **assume artifact** until proven otherwise. Reproduce in fresh data before classifying as a bug.

---

## Rule 3 — Check for an existing task/issue BEFORE reporting

Before writing a `## Application Bugs Found` section or recommending a fix:

1. **Ask the user:** "Is there an open task/issue validating this behavior?"
2. **Search in GitLab** (use skill [[fetch-gitlab-task]] if applicable): filter by labels `workflow::ready-for-qa`, `type::bug`, `validation`, `flaky`; search by a keyword from the module involved.
3. If an existing task/issue exists → do NOT create a new report; just reference it in the text (`> Observation: behavior already tracked in #NNN`).

---

## Rule 4 — Do NOT recommend a code fix on single evidence

Code suggestions (`entityManager.clear`, JPA hints, service refactors) are accepted ONLY when:

- The bug was reproduced ≥ 2 times independently, OR
- Static analysis of the code proves a deterministic inconsistency (not just race-condition plausibility), OR
- The user explicitly requests "give me a fix suggestion".

Otherwise → just describe the symptom + evidence + handoff: "this warrants investigation by the dev team".

---

## Rule 5 — Conservative language in reports

Prefer description over assertion; hypothesis over certainty.

| ❌ Not accepted | ✅ Preferred |
|---------------|--------------|
| "BUG-01 (Critical): dispatcher does not populate `data_map`" | "Observation: dispatcher records `correspondence_logs.error="..."`. This warrants investigation — it could be a deployment gap, inconsistent data in qa2, or a real defect" |
| "Confirmed: arrangement ends SUCCESS with BLOCKED installments" | "Observed 1x in account 11263. Reproduction in a fresh account (11391) shows correct behavior (FAILED). Possible intermittent race condition OR old-fixture artifact — investigate before classifying" |
| "Root cause: stale JPA cache" | "Technical hypothesis: potential stale read between multiple concurrent `@TransactionalEventListener(AFTER_COMMIT)`. Requires controlled reproduction to confirm" |

---

## Mandatory checklist before writing `## Application Bugs Found`

- [ ] Did I reproduce the behavior in fresh data created by the test itself?
- [ ] Did I check whether there is an open task/issue for the case (ask the user + GitLab search)?
- [ ] Did I rule out the old-fixture artifact indicators?
- [ ] Do I have ≥ 2 independent occurrences OR static proof of a deterministic inconsistency?
- [ ] Does the classification reflect the real level of confidence (observation ≠ bug)?

**If any answer is NO → downgrade to `> Observation: ...` in the relevant scenario and do NOT include it in the bugs section.**

---

## Examples (project lessons)

### ✅ Correct case — BUG-01 of pipeline #491

- Behavior: `correspondence_logs.error = "No data associated with correspondence request"` blocking enqueuing.
- **Reproduction in fresh:** tested with account 11386 (fresh UOWN) + 11403 (fresh Kornerstone) — SAME error in both.
- **Existing task:** asked the user — there was no known task.
- **Code:** `CorrespondenceService.createCorrespondence` visibly depends on `CommonDataPojo` populated by the template's SQL query; a query returning 0 rows is an observable deterministic inconsistency.
- **Verdict:** Legitimate bug — reproducible, no prior task, static cause identified.

### ❌ Incorrect case — BUG-APP-A of pipeline #491

- Behavior: `arrangement=SUCCESS` + installments `BLOCKED_ACCOUNT` in account 11263.
- **Reproduction in fresh:** I did NOT test before classifying it as "Critical". When I did (account 11391), the behavior was CORRECT (arrangement=FAILED).
- **Existing task:** I did NOT ask the user. Later it was revealed there was a validation task in the backlog.
- **Code:** Hypothesis of "stale JPA cache" based on speculation about timing — not deterministic proof.
- **Verdict:** Premature classification. It was an artifact + a bug already tracked. The fix recommendation was unnecessary.

---

## How agents should signal

When writing reports, use explicit confidence tags:

```markdown
### [CONFIRMED] BUG-01 — Title
[when it passed the full checklist]

### [OBSERVATION] Behavior X
[when fresh reproduction was missing OR the user confirms an open task — does NOT go in the bugs section]

### [HYPOTHESIS] Possible race condition in Y
[when the evidence is plausible but single — does NOT go in the bugs section]
```

Only `[CONFIRMED]` goes into `## Application Bugs Found`. `[OBSERVATION]` and `[HYPOTHESIS]` go as footnotes in the scenarios.

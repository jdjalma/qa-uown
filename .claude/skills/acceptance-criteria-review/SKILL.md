---
name: acceptance-criteria-review
description: Load when evaluating the AC of a UOWN ticket (GitLab issue, DoR draft, conversation with the PO) — tests each AC against Given/When/Then, detects missing implicit ACs, validates the team's DoR/DoD, and blocks tickets without AC.
disable-model-invocation: true
---

# Acceptance Criteria Review — unblock (or block) the pipeline

> The UOWN QA team agreed: **without explicit AC, a ticket does not enter testing** (`project_qa_task_structure`). This skill is the guard at that gate.

## When to apply

- skill [[fetch-gitlab-task]] returned a GitLab issue.
- The user asked "create task X" / "open a ticket for Y" — you are PRODUCING the ticket in the DoR format.
- You are reviewing the AC the PO wrote before generating the SPEC.
- The AC look complete but you suspect otherwise ("is this testable?", "how do I know it passed?").
- Bug ticket without fresh reproduction: turn the bug into AC ("when reproducing X under conditions Y, the system must respond Z").

## Principles

1. **Non-testable AC = absent AC.** "The system must be fast" is not an AC.
2. **Implicit AC is the biggest source of rework** (inviolable rule #11 — discovering a requirement during debug mandates a protocol update).
3. **Given/When/Then is not dogma — it's a diagnostic.** If you can't format an AC into GWT, it is probably poorly defined.
4. **DoR/DoD are contracts, not suggestions** (`project_qa_task_structure`).

## Procedure

### Step 1 — Inventory of declared AC

List each AC of the ticket. If the ticket has no explicit "AC" section, try to extract it from the description. If there is none:

> **HALT.** Return to the user with the message: "Ticket {id} has no explicit AC. DoR requires AC. I can (a) block until the PO writes it, or (b) propose a draft AC based on the description for your review. Which do you prefer?"

Do not invent AC silently.

### Step 2 — Testability score per AC

For each AC, apply this rubric (each question is worth ✓):

| Criterion | Question |
|---|---|
| **Observable** | Can I verify it with browser / API / DB / log? Or is it subjective ("fast", "intuitive")? |
| **Specific** | Is there a concrete value? ("processes in <2s", not "fast") |
| **Clear initial state** | Does the AC say which state it starts from? (lead pre-qualified? active account? agent logged in?) |
| **Clear action** | Is the action described with a concrete verb, with inputs? |
| **Measurable result** | Is the result assertable? (exact UI render, DB row, response code) |
| **Reversibility** | If it fails, what is the expected state? (does it keep the AC or have an error-path AC?) |

Score 6/6 = ready. Score ≤4 = return / refine. Score 5 with a clear gap = propose refinement and mark it `[REFINED BY QA]`.

### Step 3 — Reformat to Given/When/Then

Rewrite each AC in GWT:

```
Given <concrete initial state, including brand/portal/role/lead state>
And <additional preconditions — merchant config, sql config, feature flag>
When <single action, with concrete inputs>
Then <main observable result>
And <expected side-effects — activity log, email, DB row>
```

If you can't fill a field without inventing, the AC has a hole. Mark the hole as an Open Question.

### Step 4 — Detect implicit AC

Most common implicit AC in UOWN:

| Implicit | Trigger question |
|---|---|
| **Activity log** (rule #13) | Which row in `uown_los_lead_notes` should appear? Content? |
| **Idempotency** | If the action runs twice, behavior? (the `submitApplication` single-flight case) |
| **Cross-portal visibility** | Does the change appear in the Servicing portal? Customer Website? Origination? |
| **Email / SMS** | Does it trigger a communication? Template? When? |
| **Locale/state matrix** | Does behavior change by state (CA, FL, GA)? |
| **Brand parity** | Does it work in KS3015 the same as in UOWN? (`feedback_qa_flow_scope_dual_brand_lease_edit`) |
| **Permissions** | Can an agent with role X do it? Can a customer? |
| **Error path** | A vendor (Kount/SEON/Plaid) returns an error — behavior? |
| **Rollback** | How do you undo it? Is there an undo? |
| **Audit trail** | Is whoever performed the action recorded? |
| **Money invariants** | Float repr (`feedback_float_repr_not_bug`) — is the tolerance specified? |
| **Feature flag fallback** | Behavior if SQL config = off? |

Each absent implicit becomes a **proposed additional AC** (not imposed — returned to the PO to confirm).

### Step 5 — Validate against DoR

DoR checklist (from `project_qa_task_structure`):

- [ ] Clear description of the problem + solution
- [ ] Explicit AC (after step 3)
- [ ] Edge cases mapped (after step 4)
- [ ] Build deployed (which env? qa1/qa2/stg?)
- [ ] External dependencies documented (Kount, GowSign etc.)
- [ ] Dev did basic testing (ask if absent)
- [ ] Scope changes documented
- [ ] T-shirt size (S/M/L) estimated by QA — you estimate it

Incomplete DoR → the ticket goes back. Don't test.

### Step 6 — Validate against DoD (to flag upfront what regression requires)

- [ ] AC will be tested in **QA AND in Staging**, not just QA
- [ ] Edge cases will be covered
- [ ] **Regression in the impacted flows** — list which flows will regress
- [ ] Planned evidence (screenshot/video/text per type)
- [ ] Item goes to Stage Verified

### Step 7 — Output

Deliver:

```markdown
## AC Review — {task-id}

### AC Inventory
1. Original AC: "<text>"
 - Testability score: X/6
 - Holes: {list}
 - GWT reformat: ...
2. ...

### Proposed Implicit AC
- [IMPLICIT] expected activity log: ...
- [IMPLICIT] dual-brand: ...

### Open Questions for the PO
- Q1: ...

### DoR Status
- ✅ Description
- ❌ Explicit AC (needs refinement — see above)
- ...

### Anticipated DoD
- Mandatory regression: {list of flows}
- Planned evidence: {type per AC}
- T-shirt size: S | M | L

### Decision
PROCEED | BLOCK | PROCEED WITH MARKED ASSUMPTIONS
```

## Heuristics

- **The silent GWT test**: if you can write the test without reading the AC twice, the AC is good. If you need to "interpret" it, it's bad.
- **The absurdity test**: read the AC in bad faith. "The system must show a success message" — show WHICH message? WHERE? for HOW long? What does the customer see?
- **Each AC has 1 main verb.** If it has "and... and... and...", it's multiple masked AC — split them.
- **An AC with no assert on a side-effect is a partial AC.** If the feature triggers an email, an AC that doesn't mention the email is incomplete.
- **Yuri has the final word on bug vs improvement** (`project_qa_task_structure`). If the AC seems to describe an improvement beyond the original bug, flag it — don't absorb it silently.

## Expected output

A 40–120 line markdown document attached to the SPEC (or returned to the orchestrator as a blocking signal). Always ends with an explicit `### Decision`.

## Anti-patterns

- "I'll just assume the implicit AC exists" — no, write it down and return it to the PO.
- Accepting AC with "must be fluid" / "good UX" / "fast" — not testable.
- Not estimating the t-shirt size because "it's small" — DoR requires it.
- Mixing AC with technical design ("uses endpoint X with payload Y") — the AC is about observable behavior, not implementation.
- Skipping step 4 (implicit) — that is the step where most future bugs are born.
- Approving AC because "the PO wrote it, it must be right" — a review is a review.

## References

- `.claude/rules/testing.md`
- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- memory: `project_qa_task_structure`, `feedback_float_repr_not_bug`, `feedback_email_imap_click_link`

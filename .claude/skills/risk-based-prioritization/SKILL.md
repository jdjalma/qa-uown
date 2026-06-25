---
name: risk-based-prioritization
description: Load when there are more candidate scenarios than time to implement them — produces a top-N prioritized by risk (novelty, integration, boundary, historical regression) with a traceable justification.
disable-model-invocation: true
---

# Risk-Based Prioritization — test what is most likely to break first

> Total coverage is a myth. This skill returns an ordered queue where the top-N concentrate the real risk.

## When to apply

- The `scope-analysis` output has >5 candidate testable units and the t-shirt size is S/M.
- The `qa-flow` pipeline needs to decide what goes to smoke vs full vs regression.
- Post-refactor regression: the diff touches a lot, you need to decide where to focus.
- Tight release window: what ships now vs what goes to the next sprint.
- Bug in prod: prioritize which reproduction to attempt first (Daniel's Jewelers CA case — `project_gosign_rollout`).

## Principles

1. **Risk = Probability × Impact.** Coverage follows the risk, not the size of the diff.
2. **History beats theory.** If the module has already regressed 3x, it will regress again. The project's memory is worth gold.
3. **External customer > internal regression > nice-to-have.** A bug visible to the end customer weighs more than a bug visible only to the agent.
4. **Explicit justification** — each priority has 1 line of "why P0 / why P3", auditable.

## Risk dimensions (rubric)

For each candidate scenario, score 0–3 in each dimension:

### Probability (of breaking)
- **N — Novelty (new code / just changed)**
 - 0: code untouched for >6 months
 - 1: recent cosmetic refactor
 - 2: logic changed in the current release
 - 3: new greenfield feature
- **I — Integration points**
 - 0: pure in-process
 - 1: 1 DB query
 - 2: 1 external vendor (Kount, SEON, GowSign, Plaid, Twilio, Tilled, Repay, EasyPay, MX)
 - 3: 2+ vendors or asynchronous orchestration (webhook + scheduled task)
- **B — Boundary / edge density**
 - 0: closed input (2-value enum)
 - 1: input with 1 range
 - 2: input with multiple ranges (term 13m/16m, money, dates)
 - 3: free input / unicode / locales / float
- **H — Bug history**
 - 0: clean module
 - 1: 1 bug closed >6m ago
 - 2: recent bug (<3 months)
 - 3: recurring regression / recent hotfix (GoSign CA case — `project_gosign_rollout`)

### Impact (if it breaks)
- **C — Does the end customer hit it?**
 - 0: only the agent sees it (internal Origination/Servicing/AMS)
 - 1: customer-facing but reversible
 - 2: customer-facing with a financial effect (signing, payment, schedule)
 - 3: customer-facing irreversible or regulated (lease signed wrong, NACHA, NSF)
- **F — Critical business function?**
 - 0: cosmetic
 - 1: secondary feature
 - 2: core feature (origination, signing, payment)
 - 3: blocks revenue (can't submit, can't sign, can't pay)
- **A — Audit / compliance?**
 - 0: nothing
 - 1: internal log
 - 2: agent audit trail
 - 3: legal/regulatory (lease document, NACHA, sanctions, ECOA)

**Total score = (N + I + B + H) × (C + F + A)**

Range: 0 to 108. Suggested bucket:
- **P0 (critical):** ≥60 — always test, blocker if it fails
- **P1 (high):** 30–59 — test in this release
- **P2 (medium):** 10–29 — test if there's time; otherwise, next
- **P3 (low):** <10 — backlog

## Procedure

### Step 1 — Receive candidates

Take the `scope-analysis` output (IN scope + edge cases). List each candidate scenario in 1 line (ID + short description).

### Step 2 — Score

Table:

| ID | Scenario | N | I | B | H | C | F | A | Score | Bucket |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | submit happy UOWN | 2 | 2 | 1 | 1 | 2 | 3 | 1 | 36 | P1 |
| 2 | submit happy KS | 2 | 2 | 1 | 2 | 2 | 3 | 1 | 42 | P1 |
| 3 | submit lease-edit UOWN | 3 | 2 | 2 | 3 | 2 | 3 | 1 | 60 | P0 |

Justification per row: 1 sentence explaining the dominant N and C ("3-novelty: new refactored handler; 3-customer: double submission generates the wrong contract").

### Step 3 — Validate against the project history

Before closing, sweep:
- `.claude/agent-memory/` — did any recent agent report a bug in this module?
- `docs/taskTestingUown/*/report.md` — did any recent task fail here?
- User memories (`feedback_*`, `project_*`) — any direct learning from the user?

Promote the score by +5 if there's a recent hit. Document the hit as justification.

### Step 4 — Apply floor rules

Some situations force P0 regardless of the score:

- Touches `submitApplication`, `MissingDataPanel`, the Complete page → P0 dual-brand + lease-edit (`feedback_qa_flow_scope_dual_brand_lease_edit`)
- Touches a GoSign template of state X → P0 includes SignWell regression + visual diff (`project_gosign_rollout`)
- Touches the activity log (rule #13) → P0 includes log validation
- Touches a money flow → P0 includes float tolerance
- Touches OTP / email → P0 includes the real IMAP click-link (`feedback_email_imap_click_link`)

### Step 5 — Output

```markdown
## Risk-Based Prioritization — {task-id}

### Top-N (prioritized)
**P0 (must-have):**
1. [score=60] submit lease-edit UOWN — novelty: refactored handler, customer-facing irreversible
2. [score=60] submit lease-edit KS — mandatory brand parity (dual-brand rule)
3. ...

**P1 (should-have):**
4. [score=42] submit happy KS — core feature, no direct change but different merchant config
...

**P2 (nice-to-have, if there's room):**
...

**P3 (defer):**
...

### Forces applied
- Dual-brand rule (feedback_qa_flow_scope_dual_brand_lease_edit) — promoted IDs 2 and 4
- CA template history (project_gosign_rollout) — promoted ID X

### Chosen coverage
I will implement: P0 + P1 = N scenarios. P2/P3 are left for the next sprint.
```

## Heuristics

- **The 80/20 rule**: the top 20% of scenarios by score normally capture 80% of the risk. If you need to cut, cut from the bottom up.
- **The "if it breaks now, who screams?" rule**: a scenario where the external customer notices = goes up; a scenario only for the agent = stays; an internal dev scenario = goes down.
- **The hotfix rule**: post-hotfix in prod, +1 on H for the entire affected module for 30 days.
- **The "first time" rule**: if the vendor / integration has never been tested on this path before, +1 on I.
- **The "happy but with 3 prior states" rule**: a happy path with mandatory preconditions is more fragile than it looks — worth checking B.

## Expected output

Table + prioritized list (template above). 40–100 lines. Always ends with an explicit **Chosen coverage** — which P-buckets enter this delivery.

## Anti-patterns

- Prioritizing by "ticket order" — the ticket order doesn't reflect risk.
- Prioritizing by "this one is easier to implement" — easy is not risk. Implementing the easy one when it's P3 and leaving a P0 out.
- "Total" coverage — if you promised 100%, you promised wrong.
- A score without a 1-line justification — a score is only worth it if it's auditable.
- Ignoring project memories — `feedback_*` and `project_*` are mandatory input.
- Not promoting lease-edit / dual-brand when it applies — violates an inviolable rule.

## References

- `skill [[qa-domain-reflexes]]`
- `skill [[application-lifecycle]]`
- `docs/taskTestingUown/`
- memory: `feedback_qa_flow_scope_dual_brand_lease_edit`, `project_gosign_rollout`

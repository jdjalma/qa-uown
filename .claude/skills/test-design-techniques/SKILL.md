---
name: test-design-techniques
description: Load when designing test cases from the SPEC — applies equivalence partitioning, boundary value analysis, decision tables, state transition, pairwise, with a concrete UOWN example per technique (lease term, lead lifecycle, merchant config combinations).
disable-model-invocation: true
---

# Test Design Techniques — moving from "happy + 1 error" to designed coverage

> **Authority boundary** (`docs/_docs-conventions.md` §7): this skill covers **HOW TO DESIGN** — techniques, partition tables, examples. The **canonical enums and states** used in the examples (LeadStatus, lease term boundaries, merchant config flags) do NOT live here — run `node scripts/docs-tooling.mjs resolve enums` (or `originacao`) or read `docs/business-rules/appendix-d-constantes-enums.md` + `02-originacao-pipeline.md`. **Do not duplicate enum values here** — they drift.

> A designed scenario >> an improvised scenario. This skill packages classic techniques adapted to the UOWN domain.

## When to apply

- After `scope-analysis` + `risk-based-prioritization`, before the final SPEC.
- The scenario has multiple inputs or multiple states — improvising leaves a coverage hole.
- You are about to write "happy + 1 sad path" — stop. Which technique fits here?
- A recurring bug pattern seems to have been missed due to poor design — redo the design.

## Principles

1. **The right technique = fewer cases, more coverage.** It is not virtuous to have 50 cases when 12 cover the same risk.
2. **Every technique has an assumption.** Equivalence partitioning assumes uniformity within the partition — if the domain breaks that, choose another technique.
3. **Combining techniques is normal.** BVA + decision table gives BVA per table row.
4. **Document the technique used** — auditable; another QA can reproduce the reasoning.

## Technique catalog

### 1. Equivalence Partitioning (EP)

**Idea:** divide the input domain into partitions where the system "treats alike"; test 1 representative per partition.

**When to use:**
- Input has continuous ranges or categories.
- System logic is by category, not by exact value.

**Procedure:**
1. Identify the input.
2. List valid + invalid partitions.
3. Choose 1 representative value from each.
4. Cases = N(partitions).

**UOWN example:** lease term in months.
- Valid partition 1: 13 (13m program)
- Valid partition 2: 16 (16m Second Look program)
- Invalid partition 1: <13 (not supported)
- Invalid partition 2: >16 (not supported)
- Invalid partition 3: float (15.5)

Caution: 13 and 16 are boundary values — they are not just representatives, they count for BVA too.

**Anti-pattern:** assuming merchant config treats 13 and 16 equally — `merchant-config-contract.ts` defines independent programs; each is its own partition.

### 2. Boundary Value Analysis (BVA)

**Idea:** bugs cluster at the edges. Test min, min-1, min+1, max, max-1, max+1.

**When to use:**
- Numeric inputs with limits.
- Range validations (age, money, dates, term).
- String limits (length).

**Procedure:**
- For each boundary B, cases: B-1, B, B+1.
- Add the min and max of the domain.

**UOWN example:** the OEP (Original Early Payoff) window is 60 days.
- Lower boundary (start day 0): cases at day 0, day 1.
- Upper boundary (day 60): cases at day 59, day 60, day 61.
- Beyond: day 90 (still EPO bucket).

**UOWN example — money:** processing fee minimum $X, maximum $Y. Test $X-0.01, $X, $X+0.01, $Y-0.01, $Y, $Y+0.01. Remember float tolerance (`feedback_float_repr_not_bug`).

### 3. Decision Table

**Idea:** a table with row=condition, column=combination of conditions, cell=expected action. Useful when logic is AND/OR of several flags.

**When to use:**
- Eligibility logic (merchant config + state + lead status + program term).
- Routing rules (which signing vendor? which template?).
- Calculations with multiple modifiers (OEP × promo × NSF).

**UOWN example — signing vendor routing:**

| Condition | C1 | C2 | C3 | C4 | C5 |
|---|---|---|---|---|---|
| state == CA | Y | Y | N | N | Y |
| merchant uses GoSign | Y | N | Y | N | Y |
| feature flag GoSign on | Y | Y | Y | N | N |
| → vendor | GoSign | SignWell | SignWell | SignWell | SignWell |

C1 and C5 are interesting: C1 confirms the GoSign happy path; C5 validates that with the flag off, even with the merchant configured, it falls back to SignWell. **Each column is a candidate test case.**

Once built, apply:
- Minimum: all columns distinct in outcome (action coverage).
- Maximum: all columns (combinatorial coverage).

### 4. State Transition Diagram

**Idea:** the system has named states; test valid transitions + attempts at invalid transitions.

**When to use:**
- Entity lifecycle with named states (lead, lease, account, payment).
- Recurring bug in "the state ended up X but should be Y".

**UOWN example — lead lifecycle:**

```
[NEW] → [PRE_QUALIFIED] → [QUALIFIED] → [LEASED] → [SIGNED] → [ACTIVATED]
 ↓
 [DECLINED] (terminal)
```

Cases:
- Valid transition: each arrow = 1 minimum test (a complete happy path covers them all).
- Invalid transition: try to skip a state (e.g., NEW → LEASED directly via admin API) — expect an error.
- Reverse transition: try to go back (LEASED → NEW) — expect error / no-op.
- Terminal state: try to trigger a transition from DECLINED — expect a block.
- Activity log: each valid transition creates 1 row in `uown_los_lead_notes` (rule #13).

### 5. Pairwise / All-Pairs

**Idea:** when there are N parameters with M values each, total combinations explode (M^N); pairwise guarantees that every PAIR of values is tested with far fewer cases.

**When to use:**
- 3+ configurable parameters (brand × state × term × portal × role).
- Total combination impossible to cover.

**UOWN example — merchant config combinations:**

Parameters:
- brand: UOWN, KS
- program: 13m, 16m, both
- state: CA, FL, NY, TX, GA
- origin portal: Origination, Website (customer)

Total combinations: 2×3×5×2 = 60. Pairwise generates ~12 cases covering every PAIR.

Tools: `npx pict` (Microsoft PICT) or spreadsheets. Manual pairwise is acceptable for ≤4 params.

**Caution:** pairwise does NOT cover triple interactions — if you know that (UOWN × 16m × CA) has a historical bug, add it as a seeded case in addition to the pairwise.

### 6. Cause-Effect Graphing (lightweight)

Useful when a decision table gets large. Maps causes (inputs) to effects (outputs) with AND/OR/NOT. In UOWN it rarely pays off vs a direct decision table — recorded as an option.

### 7. Use Case Testing

**Idea:** follows the user story's use case; each step of the use case is a test, each extension (alt flow) is an additional test.

**When to use:**
- The spec comes from a user story in the style of `docs/user-stories/jornada-completa-lease.md`.
- End-to-end scenario.

**UOWN example:** the complete lease journey.
- Main flow: apply → pre-qualify → complete → submit → leased → signed → activated.
- Alt 1: declined at pre-qualification.
- Alt 2: missing data forces back to Complete page.
- Alt 3: customer abandons at signing, returns 24h later.

Each alt = a case. Document entry/exit conditions.

### 8. Error Guessing (informal)

**Idea:** based on experience, list places where bugs tend to appear. Does not replace formal techniques; it complements them.

**UOWN catalog — where guess-able bugs live:**
- Float repr in money (`feedback_float_repr_not_bug`)
- Assumed EN-US locale (empty text in another locale)
- OTP timing (link clicked after expiry)
- Race condition between scheduled task and UI action
- Activity log absent on a transition (rule #13)
- Merchant config drift (rule #12)
- Single-flight ref persisting across invoices (`feedback_qa_flow_scope_dual_brand_lease_edit`)

## Procedure

### Step 1 — Inventory of inputs and states

List per scenario: inputs (with range/category), precondition states, flags/configs.

### Step 2 — Map technique by dimension

| Dimension | Technique |
|---|---|
| Numeric input with range | EP + BVA |
| Multiple AND/OR flags | Decision Table |
| Entity lifecycle | State Transition |
| 3+ configurable parameters | Pairwise |
| End-to-end journey | Use Case + Error Guessing |

### Step 3 — Generate cases by technique

For each technique, generate an explicit table. Include case ID, technique, values, expected.

### Step 4 — De-duplicate and combine

Cases generated by different techniques may coincide. Keep 1 instance, note all the techniques that cover it (more value per case).

### Step 5 — Output

```markdown
## Test Design — {scenario}

### Dimensions identified
- Input: lease term {13, 16, edge cases} → EP + BVA
- Flag: GoSign vs SignWell × state × merchant → Decision Table
- Lifecycle: lead {NEW...ACTIVATED} → State Transition

### Cases by technique

**EP/BVA — lease term**
| ID | term | partition | expected |
|---|---|---|---|
| TC-01 | 13 | valid 13m | accepted, 13m program activated |
| TC-02 | 16 | valid 16m Second Look | accepted |
| TC-03 | 12 | invalid below | rejected with error X |
| TC-04 | 17 | invalid above | rejected |
| TC-05 | 15.5 | invalid float | rejected / rounded |

**Decision Table — vendor signing**
... (complete table)

**State Transition — lead lifecycle**
... (valid + invalid transitions)

### Consolidated cases
TC-01...TC-NN — total of N cases covering M dimensions.
```

## Heuristics

- **"If one case covers 2 techniques, it is worth more than two cases."** Optimize value per case.
- **"A historical bug becomes a seeded case."** Pairwise/EP do not catch specific known bugs — add them manually.
- **"Terminal states deserve an explicit test."** DECLINED, CHARGED_OFF, FUNDED-with-error are places where "nothing happens" is assumed — and sometimes something does.
- **"Each technique forces a question."** A decision table forces "all relevant combinations?"; State Transition forces "all valid transitions?".
- **"Erring by exhaustion"** — if full coverage costs more than the risk, pairwise + seed.

## Expected output

A markdown block with tables per technique + consolidated cases. Size proportional to the complexity of the scenario. Do not inflate — 1 technique may be enough for a trivial scenario.

## Anti-patterns

- Applying all the techniques to everything — overhead with no gain.
- EP without BVA when there is a boundary — misses the bugs where they cluster most.
- Decision Table without identifying redundant columns — tests the same thing 3x.
- State Transition only with valid transitions — misses the blocks on invalid transitions.
- Pairwise without a seed for a known historical bug — misses the regression.
- Inventing "random values" instead of boundaries — random ≠ designed.

## References

- `skill [[ssn-test-modalities]]` (3 program modalities)
- `skill [[application-lifecycle]]` (real state transitions)
- `docs/business-rules/12-produto-lease-deep-dive.md`
- memory: `feedback_float_repr_not_bug`, `feedback_16m_eligibility_merchant_config`

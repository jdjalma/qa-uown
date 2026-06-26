# Scenario Quality Checklist

Run on **each** scenario before saving (step 7 of the Process). Found a violation → fix and re-validate. Only save when all pass. Complements the **Rules** in SKILL.md — does not replace them.

## Self-validation per scenario

- [ ] **One behavior, one `When`** — no conjunctive step (two actions joined with "and").
- [ ] **No mechanics** — no clicks/buttons/selectors/IDs/URLs/HTTP/SQL or automation verbs (`wait for`, `scroll`, `wait to load`).
- [ ] **Describes the starting state**, not the navigation to reach it.
- [ ] **`Then` is specific and observable** — asserts a concrete business result. Generic **without an object** is forbidden: "works", "loads", "appears" alone. *(✅ valid: "the message 'Coupon expired' appears", "the coupon appears as applied" — there is a concrete object.)*
- [ ] **`Then` three-question gate** (run per Then — all three must be Yes):
  - *Value:* does it state **what** value/text/state should appear, not just that something appeared?
  - *Decision point:* does it land where the user makes a real business decision (not an intermediate step)?
  - *Failure detection:* would it catch the most likely failure mode for this scenario?
- [ ] **Side effects covered** — if the action mutates state (save, submit, status change, payment), at least one `Then`/`And` verifies the side effect (log, balance, counter, notification, derived value). For explicitly read-only actions, assert the *absence* of side effects instead.
- [ ] **No Then anti-pattern** — none of the following: "the amount is displayed" (missing correctness), "the operation is successful" (no evidence), "the page refreshes" (implementation detail), "no error is shown" alone (pair with a positive consequence).
- [ ] **Order `Given → When → Then`** without repeating phases; `And`/`But` continue the same type of step.
- [ ] **Domain terms** consistent and **concrete/realistic data** (no foo/bar).
- [ ] **Short** — ideally < ~8-10 steps. A long scenario signals mixed behaviors or narrated navigation.
- [ ] **Single concern** — do not mix functional + performance + accessibility in the same scenario.
- [ ] **Title** prefixed with `[negative]`/`[positive]`, describing the behavior.
- [ ] **Traceable** — covers at least one AC from the matrix (not an orphan).

## Ambiguity detection (trap words)

If an acceptance criterion uses these words **or** does not allow writing a `Then` with unambiguous pass/fail, it is ambiguous → becomes a **Pending** item and triggers `/discovery` (do not guess the behavior):

> fast, slow, efficient, friendly, easy, intuitive, normal, robust, adequate, appropriate, few, several, most, "if possible", "when applicable", "etc.", pronouns without a clear referent ("it", "this").

The inability to write an observable `Then` **is** the detection of the gap.

# Exploration Tactics

Experiment generators for step 5 (test in the UI) and lenses for step 4 (hypotheses). Focus always on **discovering RULES**, not on hunting bugs. Navigation only via Playwright MCP.

- [Provocations by Field Type](#provocations-by-field-type)
- [Exploration Tours](#exploration-tours)
- [Consistency Oracles](#consistency-oracles)

## Provocations by Field Type

Reproducible battery to reveal validations, limits, and required status. Apply to each relevant field/operation:

- **Empty** — leave a possibly required field blank.
- **Limits** — minimum, minimum−1, maximum, maximum+1.
- **Invalid format** — malformed email/SSN/date.
- **Duplicate** — value that must be unique (reveals uniqueness rule).
- **Special character / visual injection** — quotes, `<`, emoji.
- **Negative value / zero** — where only positive makes sense.
- **Past/future date** — where there is a validity window.

Principles:
- **1 hypothesis, 1 experiment** — isolate one variable at a time (one invalid field). `[confirmed]` only if **reproducible**.
- **Couch Potato** — minimum effort: only defaults, empty fields, clicking straight through "Next/Save". Reveals default values and actual required status.
- **Destructive operation** (delete/send/pay) — classify before executing and prefer a safe environment.

## Exploration Tours

Angles to choose when "stuck" at step 4. Each is a lens; use whichever fits:

- **Follow the data (FedEx)** — create a record and follow it through the UI: where it originates, where it reappears (lists, reports, other screens), what transforms it, what side effects it triggers (email/notification). Elevates findings from `[inferred]` to `[confirmed]`.
- **Money / permissions** — walk the flow with different profiles to see where the rule changes by role.
- **Garbage Collector / boundaries** — visit every field/screen touching the limits and invalid values.
- **Guidebook / Claims** — read tooltips, placeholders, help texts, and messages: source of hypothesis **and** consistency oracle.
- **First use / empty states** — zeroed account, empty list: reveals preconditions and setup validations.
- **Couch Potato** — only defaults, to map default behavior.

## Consistency Oracles

For step 6 (triangulate): is what was observed **consistent**? If not, record as a **POSSIBLE DIVERGENCE**, not as a rule. Consistency types (FEW HICCUPPS):

- **Purpose** — does it match what the feature is for?
- **Claims / texts** — does it match what the screen itself says (help, labels)?
- **History** — does it match the previous version / already known behavior?
- **Comparable products** — does it match how other products solve this?
- **User expectation** — does it match what a reasonable user would expect?
- **Standards** — does it match domain conventions/norms?

Inconsistency is a signal: either it is the discovery of a new rule, or it is a divergence to investigate/report — decide with the evidence.

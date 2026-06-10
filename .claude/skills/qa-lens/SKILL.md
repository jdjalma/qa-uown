---
name: qa-lens
description: Use when testing, reviewing, or validating a screen, flow, or change acting as QA — to evaluate usability, consistency with the existing standard, accessibility, special states (empty, error, no permission), and clarity, from the user's perspective rather than the developer's. Applies the QA lens: the dev validates that it "works"; the QA ensures it serves the user, is easy to use, and is consistent with what already exists. Reinforces feature investigation and test scenario generation. Apply whenever evaluating or delivering a screen or UI change.
user-invocable: false
---

# QA Lens

**Principle:** act as a **user**, not as a dev. "No error / compiles / the API responds" is the dev's view. QA ensures the thing **serves the user, is easy to use, and is consistent with what already exists** in the product. Always ask: *could a real user accomplish, understand, and trust this?*

## Dimensions to check

When validating a screen or flow, verify:

- **Ease of use** — intuitive flow, minimum steps, clear labels; necessary information and options are visible (recognize, don't recall — doesn't require remembering data from a previous step); can it be used without a manual?
- **Pattern consistency** — layout, buttons, colors, icons, position, and naming follow what **already exists** in the product (sibling screens / pattern from `/discovery`) **and** the conventions the user already knows from other products (standard icon/position/gesture — don't reinvent the known, Jakob's Law); components reused, not reinvented.
- **Behavioral consistency** — the same action behaves the same way across different screens (navigation, shortcuts, feedback).
- **Error prevention and recovery** — clear and actionable messages; confirmation on destructive actions; inline validation before failure.
- **Special states** — empty list, first use, no permission, offline, loading: all handled?
- **Content / microcopy** — correct text, no spelling errors, consistent tone; uses the user's/domain language and terms (not the system's), in the natural flow order; no technical jargon leaking through.
- **Accessibility** — contrast, visible focus, keyboard navigation, labels and alt text (images/icons) for screen readers; information never conveyed by color alone.
- **Responsiveness** — works across different screen sizes and zoom levels.
- **Data and formatting** — currency, dates, numbers; no broken, truncated, or layout-overflowing data with long text.
- **Reversibility** — can the user cancel, undo, or exit without losing data?
- **Perceived performance** — fast response, no freezing, with feedback during wait.

## Delegates

This skill provides the **lens** (what to observe). Execution stays with the specific skills:

- Confirm the **consequence** of an action → `/check-points`.
- **Discover** an unknown rule or feature in the UI → `/discovery`.
- **Generate** test scenarios → `/test-scenarios`.

## Avoid

- Validating as a dev: stopping at "no error" / "the screen loads" without looking at usability and consistency.
- Accepting inconsistency "because it works" — but also don't treat **every** difference as a defect: report it; a divergence only passes if there is a clear reason that benefits the user (anchor on the standard/heuristic, not on personal preference).
- Ignoring empty, error, and no-permission states — that's where the experience breaks.

---
name: check-points
description: Use when writing BDD/Then scenarios, validating an action in the UI, or defining what to check after adding, editing, deleting, saving, or changing a field — including actions with side effects (log, notification, counter/total). Applies the consequence oracle principle: after every relevant action, confirm the observable consequence (persistence on reload/reopen, value, state, side effect) at the point where the real user checks. Reinforces scenario generation (each Then lands on a real check point), feature investigation, and behavior verification.
user-invocable: false
---

# Check Points (consequence oracle)

**Principle:** an action is not complete when the screen stops showing errors — it is complete when you confirm, **at the place where the real user checks** (where they make decisions), that the consequence occurred. **Never assume it worked just because there was no error.**

## Catalog — after X, check Y

| After… | Check… |
|---|---|
| **Changing a field** | the value reflects the change in that field **and** wherever else it appears (list, detail, header) |
| **Adding / editing** | **persistence**: reload/reopen/go back to the list and the value is still there. May not be immediate (cache, queue, optimistic UI) — check again after reloading; a value that disappears or reverts **is not** persistence |
| **Any action** | **feedback**: confirmation message/status with the correct object |
| **Action with effect** | **side effects**: log/audit/history, email/notification, balance, counter, total |
| **Repeatable action / action with effect** | that there was **no** unintended effect: nothing duplicated, only the correct record changed (resend/double-click does not create 2 records or charge 2×) |
| **Editing something that feeds a calculation** | **derived values** updated (total, subtotal, commission, interest) |
| **Changing a situation** | **state/status** changed (badge, flow step) |
| **Creating/modifying a record** | **metadata**: who did it, when (date/time, user, version) |
| **Value visible in more than one place** | **cross-screen consistency**: matches in the list, the detail, and the report |

## How to derive the specific check point

For each action, ask: **where does the user look to confirm this? what decision do they make based on that value/location?** That place is the check point — the verification must land there.

## How to apply

- **Generating test scenarios:** every `Then` lands on a concrete check point — never a generic "it works"/"it saved". After an action with a side effect, include verification of the effect (value, persistence, log) as `Then` or `And`.
- **Investigating a feature:** capture *which* points the user checks in that flow — they reveal the rule and serve as evidence.
- **Verifying an action:** don't stop at "no error" — confirm the consequence at the real point where the user looks.

## Avoid

- Generic `Then`/verification that doesn't check a consequence ("the operation works", "saved successfully" without saying **where** it is visible).
- Assuming persistence without reloading/reopening.
- Confusing a confirmation dialog ("Are you sure?") or the absence of an error with **evidence** of the consequence — that is prevention, not proof.
- Ignoring side effects (log, total, notification) that the user relies on to make decisions.

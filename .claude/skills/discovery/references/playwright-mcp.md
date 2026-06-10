# Navigation Mechanics with Playwright MCP

How to observe and act reliably during discovery. Reliability here is what separates a real `[confirmed]` finding from a hallucination about a transitioning screen.

- [Observation: snapshot-first](#observation-snapshot-first)
- [Deterministic Action](#deterministic-action)
- [Evidence Collection and Special Cases](#evidence-collection-and-special-cases)

## Observation: snapshot-first

1. **Always observe via `browser_snapshot`** — the textual accessibility tree (role + accessible name + `disabled`/`required`/`checked` state + `ref`). It is deterministic and is the source of truth.
2. **`browser_take_screenshot` is only supplementary visual evidence** (color, layout, chart). Do not act from a screenshot, and do not conclude field/requirement status from appearance.
3. **Derive from the snapshot, not the screen**: fields, types, required status, and state for the Operations table come from the snapshot — cite `ref` + accessible name as evidence.

## Deterministic Action

4. **Golden rule — re-snapshot after every action/navigation.** The `ref` values become *stale* when the page changes; **never** reuse a `ref` from an old snapshot.
5. **Interact via the `ref` from the immediately preceding snapshot** or by semantic locator (accessible role/label). CSS/XPath guessing is prohibited.
6. **Wait for a stable state before collecting evidence**: `browser_wait_for` by `text` (e.g.: "Saved successfully") or `textGone` (e.g.: "Loading…"). Prefer content signal over fixed wait — do not record a half-loaded screen as `[confirmed]`.
7. **Navigate in short, explicit steps**, confirming arrival by a stable anchor (heading/landmark in the snapshot). Use `browser_navigate` for a known URL when possible.

**Standard cycle:** `snapshot → act → wait_for → re-snapshot`.

## Evidence Collection and Special Cases

- **Error message = statement of the rule.** When testing an invalid operation, read the **exact** text in the snapshot (role `alert`/`status` or text near the field) and cite it verbatim as evidence for the BR.
- **Console** (`browser_console_messages`, filtering `error`): distinguishes **business validation** (rule) from **technical error** (signal of bug/gap, not a rule).
- **Network** (`browser_network_requests`): evidences data origin and integrations (e.g.: `/api/clients`, payment gateway). Mark `[inferred]` what comes only from the network without UI confirmation.
- **Dialogs**: distinguish HTML modal (appears in the snapshot with role `dialog` → interact via `ref`) from native dialog (`browser_handle_dialog`, accept/cancel). On destructive operations (delete/send/pay), capture the confirmation text and decide consciously.
- **Tabs** (`browser_tabs` list/select): when a new tab opens (report, receipt, OAuth), select it before taking the snapshot.
- **Forms**: `browser_fill_form` fills everything at once; then vary **only the field under test** (isolate one variable).
- **Session/login**: validate authentication via snapshot (username/menu) **before** investigating. If it lands on login without credentials/session state configured, **stop and ask for config** — same logic as the missing Playwright MCP gate.

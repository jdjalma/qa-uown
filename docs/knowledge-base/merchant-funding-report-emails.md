# Merchant Edit — Send Automated Funding Report / Funding Report Emails

> Charter: Explore the "Funding Report Emails" field in Merchant Edit via Playwright MCP to discover toggle behavior, field type, validation rules, and multi-email support.
> Origin: Task #1301 — Improve Invalid Email Validation Message for Funding Report Emails · Overall confidence: high

## Purpose

The "Send Automated Funding Report" feature allows Origination admins to configure a list of email addresses that receive automated funding reports for a given merchant. It is a subsection of the Merchant Edit page.

Actors: Origination admin (manager role).

## Available Operations

| Operation | Available? | Notes |
|---|---|---|
| Add emails | ✅ | Type email in react-select input and press Tab to create chip |
| Remove email | ✅ | Each chip has "Remove {email}" button |
| View current config | ✅ | Chips render existing emails on page load |
| Toggle feature on/off | ✅ | react-switch toggle enables/disables the whole section |

## Flow and States

### Toggle controls field visibility [confirmed]

- Toggle **OFF** → "Funding Report Frequency" and "Funding Report Emails" fields are **not rendered** in the DOM (`offsetParent === null`)
- Toggle **ON** → both fields become **visible**
- Both fields appear in the same row below the toggle

DOM observation: toggle is a `<input type="checkbox" role="switch">` wrapped in `react-switch-bg`. The `<div class="col">` intercepts pointer events — must click `.react-switch-bg` element directly to toggle.

### Email field structure [confirmed]

- `<div id="fundingReportEmails" class="...css-b62m3t-container">` — react-select container
- Inner input: `<input role="combobox" aria-haspopup="true">` — ID is dynamic (`react-select-{N}-input`)
- Stable selector: `#fundingReportEmails input`
- Placeholder text: "Report Emails"
- Type: **multi-value creatable** react-select (multiple chips allowed)

### Funding Report Frequency field structure [confirmed]

- `<div id="fundingReportFrequency">` — also a react-select (multi-value)
- Placeholder: "Select Frequency"
- Options include: WEEKLY, BI_WEEKLY, LTO (observed as existing chips on merchant "Synchrony")

## Business Rules

- BR-01: When the "Send Automated Funding Report" toggle is OFF, "Funding Report Emails" and "Funding Report Frequency" fields are not visible *(evidence: `offsetParent === null` when toggle OFF, both visible when ON)* `[confirmed]`
- BR-02: "Funding Report Emails" is a react-select multi-value creatable field. Multiple email addresses are added as individual chips by typing and pressing Tab `[confirmed]`
- BR-03: Each chip is independently removable via a "Remove {email}" button (aria-label) `[confirmed]`
- BR-04: The field label is "Funding Report Emails\*" — asterisk indicates required when toggle is ON `[confirmed]`
- BR-05: Tab key confirms a typed value. If the value is a **valid email** → chip is created, no error. If the value is **invalid** → chip is NOT created, error message displayed `[confirmed]`
- BR-06: Invalid email cases that trigger the validation: malformed format (`notanemail`), leading blank space (` test@example.com`), trailing blank space (`test@example.com `) — all rejected, no chip created `[confirmed]`
- BR-07: Current validation message for invalid input: **"Please enter a valid email address."** — displayed in red (`rgb(229, 0, 0)`) below the field, class `index-module_inputField__textError__5fU9J` `[confirmed]`
- BR-08: The fix from task #1301 appears to be **already deployed in qa2**. Davi Artur (dev) confirmed he could not reproduce the original error message in dev2, qa2, stg. The current message "Please enter a valid email address." is user-friendly and short `[inferred]`

## Logic and Exceptions

| Input | Tab result | Error shown |
|---|---|---|
| `valid@email.com` | Chip created, input cleared | None |
| `notanemail` | No chip, value stays in input | "Please enter a valid email address." |
| ` test@example.com` (leading space) | No chip, value stays in input | "Please enter a valid email address." |
| `test@example.com ` (trailing space) | No chip, value stays in input | "Please enter a valid email address." |

Multiple valid emails: tested with 2 chips (`valid@email.com` + `second@email.com`) — both accepted, no limit observed.

## Connections with What Was Already Known

- Confirms: `funding_report_emails` is a column on `uown_merchant` DB table (already noted in `src/scripts/check-trigger-sweep-eligibility.ts` line 209)
- Confirms: field is scoped to the "Send Automated Funding Report" toggle (task screenshot)
- New discovery: field is a multi-value react-select (not a plain text input) — impact on test automation: use `#fundingReportEmails input` + Tab to add chips
- New discovery: Toggle click requires `.react-switch-bg` CSS selector or JS `.click()` — direct `input[role="switch"]` click is intercepted by overlay `<div class="col">`

## Gaps / To Investigate

- **G1**: What validation message appears when the toggle is ON, the field is empty (no chips), and Save is clicked? Testing showed form submission via GET occurred — unclear if "Valid email is required" is the empty-state message
- **G2**: Is there a maximum number of email chips allowed?
- **G3**: Does the "Funding Report Frequency" field also have validation (required when toggle ON)?
- **G4**: What does the backend do with `funding_report_emails` — is it stored as a comma-separated string or array?

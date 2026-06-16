# Test Scenarios — #1301 Improve Invalid Email Validation Message for Funding Report Emails

> Origin: https://gitlab.com/uown/frontend/origination/-/work_items/1301
> Milestone: Uown | RU06.26.1.53.0 — environments dev2, qa2 — Ready for QA: 2026-06-16

## Demand summary

A Zendesk ticket (6911) reported that the "Funding Report Emails" field on the Merchant Edit page displayed a large, internal Yup schema validation error when an invalid email was entered. The dev assigned (Davi Artur) could not reproduce the error in dev2, qa2, or stg and sent the task to QA for validation. **No code change was made.** QA must attempt to reproduce the original error and confirm whether it still occurs in the target environments.

## Root cause of the reported error

The field is a react-select multi-value component. The Formik/Yup schema expects an **array** (list of confirmed chips). When the user typed an email string in the input and clicked Save WITHOUT pressing Tab to confirm it as a chip, Yup received a plain string instead of an array, cast it to `null`, and exposed the internal schema error directly on screen:

> `fundingReportEmails must be a \`array\` type, but the final value was: \`null\` (cast from the value "toni@pfpnow.com"). If \`null\` is intended as an empty value be sure to mark the schema as \`.nullable()\``

This was triggered regardless of whether the email format was valid or not — the issue was a data-type mismatch (string vs. array).

## Impact analysis

| Rule | Source |
|------|--------|
| `funding_report_emails` is a DB column on `uown_merchant`; updated via Merchant Edit form | `src/scripts/check-trigger-sweep-eligibility.ts` line 209 |
| Toggle OFF: "Funding Report Emails" AND "Funding Report Frequency" fields are NOT visible | `docs/knowledge-base/merchant-funding-report-emails.md` BR-01 `[confirmed]` |
| Toggle ON: both fields become visible | `docs/knowledge-base/merchant-funding-report-emails.md` BR-01 `[confirmed]` |
| "Funding Report Emails" is a react-select multi-value creatable — expects array, not string | `docs/knowledge-base/merchant-funding-report-emails.md` BR-02 `[confirmed]` |
| Tab confirms a typed value as a chip; Enter in some contexts submits the form | `docs/knowledge-base/merchant-funding-report-emails.md` BR-05 `[confirmed]` |
| Invalid email + Tab → inline message: "Please enter a valid email address." | `docs/knowledge-base/merchant-funding-report-emails.md` BR-07 `[confirmed]` |
| Dev could not reproduce the original Yup error in dev2, qa2, stg — no code change made | Task #1301 — Davi Artur comment `[confirmed]` |

## Scenarios

```gherkin
Feature: Validation behavior of the Funding Report Emails field in Merchant Edit
  As a QA engineer
  I want to validate the Funding Report Emails field behavior in dev2 and qa2
  So that I can confirm whether the reported Yup schema error still occurs or not

  Background:
    Given I am logged in to the Origination portal as an admin
    And I am on the Merchant Edit page
    And the "Send Automated Funding Report" toggle is ON

  # ── Reproduction attempt — core reported bug ─────────────────────────────────
  # Steps from Zendesk ticket 6911 / task #1301 Steps to Reproduce.
  # Expected result AFTER QA validation: no Yup schema error visible.

  Scenario: [negative] Typing an email in the field without confirming and saving does not show the Yup technical error
    Given the "Funding Report Emails" field has no chips
    When I type "toni@pfpnow.com" in the "Funding Report Emails" field without pressing Tab or Enter
    And I save the Merchant Edit form
    Then the internal Yup schema error is not displayed on screen

  Scenario: [negative] Typing a malformed email without confirming and saving does not show the Yup technical error
    Given the "Funding Report Emails" field has no chips
    When I type "notanemail" in the "Funding Report Emails" field without pressing Tab or Enter
    And I save the Merchant Edit form
    Then the internal Yup schema error is not displayed on screen

  # ── AC-02: blank spaces ───────────────────────────────────────────────────────

  Scenario: [negative] Leading blank space before email does not show the Yup technical error on save
    Given the "Funding Report Emails" field has no chips
    When I type an email address preceded by a blank space in the "Funding Report Emails" field without pressing Tab or Enter
    And I save the Merchant Edit form
    Then the internal Yup schema error is not displayed on screen

  Scenario: [negative] Trailing blank space after email does not show the Yup technical error on save
    Given the "Funding Report Emails" field has no chips
    When I type an email address followed by a blank space in the "Funding Report Emails" field without pressing Tab or Enter
    And I save the Merchant Edit form
    Then the internal Yup schema error is not displayed on screen

  # ── Inline validation (Tab) ───────────────────────────────────────────────────

  Scenario Outline: [negative] Invalid email format is rejected when confirming with Tab
    Given the "Funding Report Emails" field has no chips
    When I type "<invalid_email>" in the "Funding Report Emails" field
    And I press Tab to confirm
    Then the typed value is not added as an email chip
    And a validation message is displayed below the "Funding Report Emails" field

    Examples:
      | invalid_email      | equivalence class           |
      | notanemail         | missing @ symbol and domain |
      | @domain.com        | missing local part          |
      | user@              | missing domain              |

  Scenario: [negative] Leading blank space is rejected as invalid when confirming with Tab
    Given the "Funding Report Emails" field has no chips
    When I type an email address preceded by a blank space in the "Funding Report Emails" field
    And I press Tab to confirm
    Then the typed value is not added as an email chip
    And a validation message is displayed below the "Funding Report Emails" field

  Scenario: [negative] Trailing blank space is rejected as invalid when confirming with Tab
    Given the "Funding Report Emails" field has no chips
    When I type an email address followed by a blank space in the "Funding Report Emails" field
    And I press Tab to confirm
    Then the typed value is not added as an email chip
    And a validation message is displayed below the "Funding Report Emails" field

  # ── AC-04: valid email flows ──────────────────────────────────────────────────

  Scenario: [positive] Valid email is added as a chip when pressing Tab
    Given the "Funding Report Emails" field has no chips
    When I type a correctly formatted email address in the "Funding Report Emails" field
    And I press Tab to confirm
    Then the email address is added as a chip in the "Funding Report Emails" field
    And no validation error is displayed below the field

  Scenario: [positive] Valid email is retained as a chip when pressing Enter
    Given the "Funding Report Emails" field has no chips
    When I type a correctly formatted email address in the "Funding Report Emails" field
    And I press Enter to confirm
    Then the email address is retained as a chip in the "Funding Report Emails" field
    And no validation error is displayed below the field

  Scenario: [positive] Valid email is retained as a chip when clicking outside the field
    Given the "Funding Report Emails" field has no chips
    When I type a correctly formatted email address in the "Funding Report Emails" field
    And I click outside the field
    Then the email address is retained as a chip in the "Funding Report Emails" field
    And no validation error is displayed below the field

  Scenario: [positive] Multiple valid email addresses can be added as separate chips
    Given the "Funding Report Emails" field has no chips
    When I add a first correctly formatted email address to the "Funding Report Emails" field
    And I add a second correctly formatted email address to the "Funding Report Emails" field
    Then both email addresses are displayed as individual chips in the field
    And each chip has an option to be individually removed
    And no validation error is displayed

  Scenario: [positive] Merchant settings save successfully when Funding Report Emails has at least one valid chip
    Given the "Funding Report Emails" field contains at least one correctly formatted email address as a chip
    When I save the Merchant Edit form
    Then the form is submitted successfully
    And no validation error is displayed for the "Funding Report Emails" field
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) that cover it | Status |
|---|---|---|
| AC-01 — Invalid email input displays a user-friendly validation message | [negative] Inline validation Outline (3 rows), [negative] Blank space + Tab | ✅ |
| AC-02 — Adding blank spaces before/after triggers validation correctly | [negative] Leading blank space (on save + on Tab), [negative] Trailing blank space (on save + on Tab) | ✅ |
| AC-03 — Technical or large error messages are no longer displayed | [negative] Yup error not shown (4 scenarios — valid format, invalid format, leading space, trailing space without Tab) | ✅ |
| AC-04 — Existing validation behavior continues functioning correctly | [positive] Tab, [positive] Enter, [positive] Click outside, [positive] Multiple chips, [positive] Form saves | ✅ |
| Toggle visibility — BR-01 (discovered) | Note: toggle OFF behavior confirmed in discovery but scenarios assume toggle ON via Background | ✅ |
| Multi-email support — BR-02 (discovered) | [positive] Multiple valid email addresses as separate chips | ✅ |

## Resolved pending items

- **P1 — Multiple emails:** CONFIRMED supported via chips. Scenario added.
- **P2 — Exact validation message text:** CONFIRMED in qa2 for inline (Tab) validation: "Please enter a valid email address." For the save-without-chip case, QA validation will determine the actual behavior.
- **P3 — Field visibility when toggle is OFF:** CONFIRMED hidden (discovery). Background assumes toggle ON; toggle OFF behavior documented in `docs/knowledge-base/merchant-funding-report-emails.md`.

## Open gaps

- **G1 — Yup error on save without chip:** QA must verify whether the original Yup error still occurs in any environment (sandbox, qa1) where the history of the bug was reported. If it does occur, that is a blocker; if it does not, the task can be closed as "cannot reproduce."
- **G2 — Enter and click-outside chip creation:** In qa2, Enter in certain contexts submitted the form instead of creating a chip. Verify with dev whether these scenarios produce a chip or submit the form.
- **G3 — Empty required field on Save:** When toggle is ON and no chips exist and no text is typed, the behavior on Save needs verification.

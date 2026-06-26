---
last-reviewed: 2026-06-26
covers:
  - src/pages/login.page.ts
  - src/pages/website/website-base.page.ts
  - src/helpers/auth.helpers.ts
---

# Login — BDD Scenarios

> **Acceptance contract** for the login operation across all portals.
> Any change to a file listed in `covers` must trigger a review of this BDD and an update to `last-reviewed`.

---

## Feature: Login — Agent Portals (Origination / Servicing / AMS)

> Username/password-based. Roles: `manager` (default) · `merchant`.
> Helper: `loginToPortal(page, url, env, role)` · `LoginPage.login(email, password)`

```gherkin
Feature: Login — Agent Portals (Origination / Servicing / AMS)
  As an agent (manager or merchant role)
  In order to access the platform and perform operations
  The agent must authenticate with valid credentials

  Background:
    Given the agent portal login page is open at the environment URL

  Scenario: [negative] CT-02 — Login rejected with incorrect password
    When the agent submits an incorrect password for a valid email
    Then an error message is displayed on the login page
    And the login page remains visible

  Scenario: [negative] CT-03 — Account locked after consecutive failed attempts
    When the agent submits incorrect credentials 5 times in a row for the same account
    Then the account is locked
    And a lock or "too many attempts" message is displayed
    And subsequent login attempts with valid credentials are also rejected

  Scenario: [positive] CT-01 — Successful login with valid credentials
    When the agent submits valid credentials for the role
    Then the dashboard is displayed
    And the login form is no longer visible
```

### Oracle: CT-01 — Successful login (agent portals)

> Staleness check (run first): `git log --after="2026-06-26" -- src/pages/login.page.ts src/helpers/auth.helpers.ts`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

After clicking LOG IN with valid credentials, validate ALL of the following:

| Checkpoint | How to verify |
|---|---|
| URL changed to dashboard | URL contains `/overview` and does NOT contain `/login` |
| Login form is gone | No `input[type='password']` visible on the page |
| Navigation menu is present | Items "Overview", "Leads", "Funding" are visible |
| Username displayed | Top navigation bar shows the authenticated username |

### Oracle: CT-02 — Login rejected

> Staleness check (run first): `git log --after="2026-06-26" -- src/pages/login.page.ts src/helpers/auth.helpers.ts`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

After clicking LOG IN with incorrect password, validate ALL of the following:

| Checkpoint | How to verify |
|---|---|
| Still on login page | URL still contains `/login` or has not changed |
| Error message visible | Text about invalid credentials or wrong password is visible |
| Login form still present | Email input + password input + LOG IN button are still visible |

### Oracle: CT-03 — Account locked

> Staleness check (run first): `git log --after="2026-06-26" -- src/pages/login.page.ts src/helpers/auth.helpers.ts`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

After 5 failed attempts, validate ALL of the following:

| Checkpoint | How to verify |
|---|---|
| Lock message visible | Text contains "locked", "too many attempts", or equivalent |
| Correct credentials also rejected | Login with valid credentials returns an error (no redirect to dashboard) |

---

## Feature: Login — Website Portal (Customer, OTP-based)

> One-time password sent via email or SMS. No stored password.
> Helper: `WebsiteBasePage.loginWithEmailOrPhone(emailOrPhone)` + `enterVerificationCode(code)`

```gherkin
Feature: Login — Website Portal (Customer, OTP-based)
  As a customer
  In order to access a lease account without a password
  The customer must authenticate via a one-time code sent to email or phone

  Scenario: [negative] CT-07 — Invalid OTP code rejected
    Given the OTP entry modal is displayed
    When the customer submits an incorrect 6-digit code
    Then an error message is displayed within the OTP modal
    And the OTP modal remains open

  Scenario: [positive] CT-04 — OTP modal displayed after email submission
    Given the website portal login page is open
    When the customer submits a registered email address
    Then a 6-digit verification code is sent to that email
    And the OTP entry modal is displayed

  Scenario: [positive] CT-05 — OTP modal displayed after phone submission
    Given the website portal login page is open
    When the customer submits a registered phone number
    Then a 6-digit verification code is sent by SMS
    And the OTP entry modal is displayed

  Scenario: [positive] CT-04b / CT-05b — Customer authenticated after correct OTP
    Given the OTP entry modal is displayed
    When the customer submits the correct 6-digit code
    Then the customer dashboard is displayed
    And the OTP modal is no longer visible

  Scenario: [positive] CT-06 — New OTP code requested and accepted
    Given the OTP entry modal is displayed with a pending code
    When the customer requests a new verification code
    Then the OTP inputs are cleared
    And a new 6-digit code is sent to the registered email or phone
```

### Oracle: CT-04 / CT-05 — Successful OTP login (email or phone)

> Staleness check (run first): `git log --after="2026-06-26" -- src/pages/website/website-base.page.ts src/helpers/auth.helpers.ts`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

**After submitting email or phone (before OTP):**

| Checkpoint | How to verify |
|---|---|
| OTP modal is open | 6 single-digit input fields are visible |
| Email/phone form is gone | The initial email/phone input is no longer visible |

**After entering the correct OTP:**

| Checkpoint | How to verify |
|---|---|
| Authenticated | URL no longer contains `/login`; customer dashboard is displayed |
| OTP modal is closed | The 6-digit input fields are no longer visible |

### Oracle: CT-06 — Resend OTP code

> Staleness check (run first): `git log --after="2026-06-26" -- src/pages/website/website-base.page.ts`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

| Checkpoint | How to verify |
|---|---|
| OTP inputs are cleared | All 6 input fields are empty after clicking "Resend" |
| Modal remains open | 6 input fields still visible (user can enter the new code) |

### Oracle: CT-07 — Invalid OTP code

> Staleness check (run first): `git log --after="2026-06-26" -- src/pages/website/website-base.page.ts`
> Non-empty output = BDD may be stale. Prepend `[BDD MAY BE STALE]` to this oracle report.

| Checkpoint | How to verify |
|---|---|
| Error message visible | Error text is displayed inside the OTP modal |
| Modal remains open | 6 input fields are still visible |
| Not authenticated | URL still contains `/login` or the customer dashboard is NOT displayed |

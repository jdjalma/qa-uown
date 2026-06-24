# Test Scenarios — PayNearMe: correct brand logo via ext_brand

> Origin: GitLab uown/backend/svc#562 · "UOWN | PayNearMe | Display correct brand logo on payment page via ext_brand" · Milestone `Uown | RU06.26.1.53.0` · XS
> Knowledge base: `docs/business-rules/05-pagamentos.md` §72 (ExtBrand entry) · `docs/api-reference/sendpaynearmepaymentlink.md` · exploratory report `docs/taskTestingUown/exploratory-dev3-2026-06-03/servicing-gaps-2026-06-03-report.md` §5
> Portal: Servicing (agent-facing) + PayNearMe smart payment page (customer-facing) · Interface: **UI-first** (logo is a rendering artifact — only visible when the customer opens the real payment page)
> Scope confirmed: **KORNERSTONE company** and **UOWN company** accounts · stg environment

## Demand summary

The `ext_brand` parameter sent in the PayNearMe `create_order` call was using the raw Java enum name (`KORNERSTONE` / `UOWN`), which does not match the logo filenames configured in PayNearMe (`kornerstone.png` / `uown.png`). The fix maps the company to the correct lowercase filename via `PayNearMeConfig.getExtBrandForCompany()`, so customers see the correct brand logo (Kornerstone Living or Uown Leasing) on the smart payment page. Accounts with null company fall back to `uown.png`.

## Impact analysis

| Area | Impact | Risk | Source |
|---|---|---|---|
| PayNearMe create_order `ext_brand` value | Was `KORNERSTONE`/`UOWN` (enum); now `kornerstone.png`/`uown.png` (logo filename) | **High** — wrong/missing logo undermines brand trust | `docs/business-rules/05-pagamentos.md` §72; `svc/config/PayNearMeConfig.java:76-81` |
| Kornerstone Living logo display | KORNERSTONE accounts must show the Kornerstone Living logo on the PayNearMe payment page | **High** — primary AC from ticket | Task #562 Steps-to-Reproduce |
| Uown Leasing logo display | UOWN accounts must show the Uown Leasing logo on the PayNearMe payment page | **High** — primary AC from ticket | Task #562 Steps-to-Reproduce |
| Null company fallback | If the account has no company, ext_brand defaults to `uown.png` | Medium — edge case; not reproducible via normal UI flow | `docs/business-rules/05-pagamentos.md` §72 |
| DB attempt record | `uown_pay_near_me_attempt` must record `success=true`, `error_summary=null` after each link delivery | Medium — verifies create_order completed without error | Lucas Elias QA report (TC-04 / TC-05) |
| Servicing UI PayNearMe history | After sending the link, the Attempts tab shows the delivery status | Low — secondary observability check | `docs/taskTestingUown/exploratory-dev3-2026-06-03` §5 |

## Scenarios

```gherkin
Feature: PayNearMe payment page shows correct brand logo based on account company
  As a servicing agent
  I want to send a PayNearMe payment link to a customer
  So that the customer sees the correct company branding on the payment page

  Background:
    Given the servicing agent is authenticated in the Servicing portal in the staging environment
    And the staging PayNearMe sandbox has brand images configured for Kornerstone Living and Uown Leasing

  # ---------- Brand logo — happy path (AC-01, AC-02) ----------

  Scenario Outline: [positive] payment page displays the brand logo that matches the account company
    Given a servicing account belonging to company <company> with an amount due greater than $0
    When the agent sends a PayNearMe payment link from the account's Send Invite options
    Then the smart payment link opens a PayNearMe payment page showing the <brand_logo> logo
    And the PayNearMe Attempts history for that account shows a successful delivery with no error

    Examples:
      | company      | brand_logo         |
      | KORNERSTONE  | Kornerstone Living |
      | UOWN         | Uown Leasing       |

  # ---------- Delivery attempt persistence (AC-04) ----------

  Scenario Outline: [positive] the PayNearMe order identifier carries the staging environment prefix
    Given a servicing account belonging to company <company> with an amount due greater than $0
    And the agent has sent a PayNearMe payment link from the account's Send Invite options
    When the agent reviews the PayNearMe Attempts history for that account
    Then the most recent attempt record shows an order identifier that includes the staging prefix

    Examples:
      | company      |
      | KORNERSTONE  |
      | UOWN         |
```

## Coverage matrix

| # | Acceptance Criterion | Scenario(s) | Priority |
|---|---|---|---|
| AC-01 | KORNERSTONE account → Kornerstone Living logo on PayNearMe page | `[positive] payment page displays brand logo … (KORNERSTONE row)` | P0 |
| AC-02 | UOWN account → Uown Leasing logo on PayNearMe page | `[positive] payment page displays brand logo … (UOWN row)` | P0 |
| AC-03 | `success=true`, `error_summary=null` in `uown_pay_near_me_attempt` | `[positive] payment page displays brand logo … (Then And …)` | P1 |
| AC-04 | Order identifier carries the env prefix (`{pk}-stg`) | `[positive] order identifier carries the staging environment prefix` | P1 |

Forward coverage: AC-01 through AC-04 each have at least one scenario.
Backward coverage: both scenarios trace to ACs; no orphans.

## Pending items

- **P1 — Null company fallback (AC-05 implicit).** Business rule: `company == null → ext_brand = uown.png` (fallback). Reproducing this requires a servicing account with no company set. Confirm whether such an account exists in stg before marking this AC testable. If not found, document as untestable-in-stg with code-review coverage only.
- **P2 — amount_due = 0 rejection behavior.** The ticket prerequisite states "amount due > $0" but does not specify the system response when amount_due = 0 (guard at API level? silent no-op? UI disable?). Trigger `/discovery` if boundary validation is in scope.
- **P3 — Smart payment link accessibility.** The smart payment link is delivered via SMS and/or email to the customer's registered contact. In stg, confirm the tester has access to a phone number or inbox that can receive the link — or that the link is also returned in the API response / shown in the Servicing portal so it can be opened directly.
```

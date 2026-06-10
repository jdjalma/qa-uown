# Test Scenarios — #1316 Add Platform Fee Fields to Merchant Settings

> Origin: https://gitlab.com/uown/frontend/origination/-/work_items/1316
> Milestone: Uown | RU06.26.1.53.0 — environments dev2, qa2 — Ready for QA: 2026-06-16

## Demand summary

The Business team requested that Platform Fee and Platform Fee Type — fields already available on the Merchant Edit page — also appear on the Merchant Settings page, enabling bulk updates across multiple merchants without requiring developer involvement.

## Impact analysis

| Rule | Source |
|------|--------|
| `platform_fee` is `numeric(19,2)` and `plat_form_fee_type` is `varchar(255)` in `uown_merchant` — columns already exist, no migration expected | `docs/database-schema.md` rows 55-56 |
| Platform Fee default is 2% (UOwn's cut) | `docs/business-rules/08-funding-merchants.md` |
| Platform Fee Type valid enum: `MONTHLY`, `DAILY`, `QUARTERLY`, `YEARLY` | `docs/business-rules/appendix-d-constantes-enums.md §D.17` |
| On Merchant Edit, `platformFee` is a numeric text input (`fillByName`) and `platFormFeeType` is a react-select (`pickReactSelectOption`) | `src/pages/origination/merchant-edit.page.ts` |
| Merchant Settings already handles bulk update via Save → confirmation modal → success toast | `src/pages/origination/merchant-setting.page.ts` — `submitSettings()` + `confirmBulkUpdate()` |
| Merchant Settings existing fields: Dealer Discount, Dealer Rebate Type, Dealer Rebate Override, Peak/Off-Peak Campaign IDs, UW Pipeline, Fraud Threshold, Max Approval Amount, GDS Data toggle | `src/pages/origination/merchant-setting.page.ts` |
| Merchant table requires filter/Apply to populate rows before selection is possible | `MerchantSettingPage.loadMerchants()` |

**Gaps flagged (see Pending items):**
- G1: Behavior when Save is clicked with zero merchants selected (button disabled vs. error toast vs. no-op)
- G2: Validation constraints for Platform Fee (min, max, negative, non-numeric input)
- G3: Partial update behavior — if Platform Fee Type is left blank, does the bulk update skip it or reset it to null
- G4: UI control type for Platform Fee Type in Merchant Settings (react-select vs. native `<select>`) — Merchant Edit uses react-select; Merchant Settings Dealer Rebate Type uses native select; new control type unknown until UI is deployed

## Scenarios

```gherkin
Feature: Platform Fee bulk configuration in Merchant Settings
  As a Business Admin
  I want to update Platform Fee and Platform Fee Type for multiple merchants at once in Merchant Settings
  So that I can manage platform fee configurations without requiring technical team involvement

  Background:
    Given I am logged in to the Origination portal as an admin
    And the Merchant Settings page is loaded with at least 3 merchants visible in the table

  # ── Visibility / presence ──────────────────────────────────────────────────

  Scenario: [positive] Platform Fee field is present and accepts numeric input in Merchant Settings
    Given no merchants are selected
    When I view the bulk update form in Merchant Settings
    Then a "Platform Fee" field is visible
    And the "Platform Fee" field accepts numeric values

  Scenario: [positive] Platform Fee Type selector is present with all valid options in Merchant Settings
    Given no merchants are selected
    When I open the Platform Fee Type selector in the bulk update form
    Then the following options are available:
      | Option    |
      | MONTHLY   |
      | DAILY     |
      | QUARTERLY |
      | YEARLY    |

  # ── Bulk update — Platform Fee ────────────────────────────────────────────

  Scenario: [positive] Bulk update applies Platform Fee to all selected merchants
    Given I have selected 2 merchants from the list
    And the Platform Fee is set to "3.50"
    When I save and confirm the bulk update
    Then a success notification is displayed
    And the Merchant Edit page for each selected merchant shows "3.50" in the Platform Fee field

  Scenario: [positive] Bulk update with minimum valid Platform Fee (zero) applies to selected merchants
    Given I have selected 1 merchant from the list
    And the Platform Fee is set to "0.00"
    When I save and confirm the bulk update
    Then a success notification is displayed
    And the Merchant Edit page for the selected merchant shows "0.00" in the Platform Fee field

  # ── Bulk update — Platform Fee Type ──────────────────────────────────────

  Scenario Outline: [positive] Bulk update applies each Platform Fee Type to selected merchants
    Given I have selected 2 merchants from the list
    And the Platform Fee Type is set to "<type>"
    When I save and confirm the bulk update
    Then a success notification is displayed
    And the Merchant Edit page for each selected merchant shows "<type>" as the Platform Fee Type

    Examples:
      | type      |
      | MONTHLY   |
      | DAILY     |
      | QUARTERLY |
      | YEARLY    |

  # ── Bulk update — both fields simultaneously ──────────────────────────────

  Scenario: [positive] Bulk update applies both Platform Fee and Platform Fee Type simultaneously
    Given I have selected 3 merchants from the list
    And the Platform Fee is set to "4.00"
    And the Platform Fee Type is set to "YEARLY"
    When I save and confirm the bulk update
    Then a success notification is displayed
    And the Merchant Edit page for each selected merchant shows "4.00" as Platform Fee
    And the Merchant Edit page for each selected merchant shows "YEARLY" as Platform Fee Type

  # ── Persistence ──────────────────────────────────────────────────────────

  Scenario: [positive] Platform Fee updated via bulk save persists in Merchant Edit page
    Given merchant "terraceFinance" has Platform Fee set to "2.50" via a completed bulk update in Merchant Settings
    When I open the Merchant Edit page for "terraceFinance"
    Then the Platform Fee field displays "2.50"
    And the database column "platform_fee" for "terraceFinance" contains the value 2.50

  Scenario: [positive] Platform Fee Type updated via bulk save persists in Merchant Edit page
    Given merchant "terraceFinance" has Platform Fee Type set to "QUARTERLY" via a completed bulk update in Merchant Settings
    When I open the Merchant Edit page for "terraceFinance"
    Then the Platform Fee Type shows "QUARTERLY"
    And the database column "plat_form_fee_type" for "terraceFinance" contains "QUARTERLY"

  # ── Logic consistency (AC-04) ─────────────────────────────────────────────

  Scenario: [positive] Platform Fee Type options in Merchant Settings match those on Merchant Edit page
    Given I note the Platform Fee Type options in the Merchant Settings bulk form
    When I open the Platform Fee Type selector on the Merchant Edit page for any merchant
    Then both pages offer exactly the same options: MONTHLY, DAILY, QUARTERLY, YEARLY
    And no option present in one page is absent from the other

  # ── Regression — existing Merchant Settings fields ────────────────────────

  Scenario: [positive] Existing Merchant Settings fields remain functional after new Platform Fee fields are added
    Given I have selected 2 merchants from the list
    And the Dealer Discount is set to "5"
    And the Dealer Rebate Type is set to "FLAT"
    When I save and confirm the bulk update
    Then a success notification is displayed
    And each selected merchant reflects the updated Dealer Discount and Dealer Rebate Type in Merchant Edit
    And the Platform Fee and Platform Fee Type fields are also visible in the bulk form without errors
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — Platform Fee field available in Merchant Settings | [positive] Platform Fee field is present and accepts numeric input | ✅ |
| AC-02 — Platform Fee Type field available in Merchant Settings | [positive] Platform Fee Type selector is present with all valid options | ✅ |
| AC-03 — Bulk updates correctly apply values to merchants | [positive] applies Platform Fee · [positive] applies PFT (Outline 4 rows) · [positive] both fields simultaneously | ✅ |
| AC-04 — Logic matches Merchant Edit page | [positive] PFT options match Merchant Edit · Outline exercises same enum values from both pages | ✅ |
| AC-05 — Merchant updates persist correctly after saving | [positive] Platform Fee persists · [positive] Platform Fee Type persists | ✅ |
| AC-06 — Existing functionality unaffected | [positive] Existing fields remain functional | ✅ |

**Boundary / extra coverage:**
| Scenario | AC | Rationale |
|---|---|---|
| [positive] zero Platform Fee (0.00) | AC-03 / AC-05 | Boundary: zero is the conceptual minimum — free merchant |

## Pending items

| ID | Gap | Recommended action |
|----|-----|--------------------|
| G1 | Behavior when Save is clicked with 0 merchants selected (disabled button, error toast, or no-op?) | `/discovery` — navigate to Merchant Settings in dev2, select no merchants, click Save, observe |
| G2 | Validation for Platform Fee: negative value, non-numeric input, value > 100 — accepted or rejected? | `/discovery` — try entering negative and text values in the Platform Fee field on Merchant Edit and on Merchant Settings once deployed |
| G3 | Partial update: if Platform Fee Type is left empty during bulk update, does the backend skip the field or set it to null? | `/discovery` — check backend behavior or inspect API payload sent on Save |
| G4 | UI control type for Platform Fee Type in Merchant Settings (react-select as on Merchant Edit, or native `<select>` as Dealer Rebate Type?) — affects selector strategy | `/discovery` — inspect DOM via MCP Playwright on dev2 once deployed (`browser_snapshot` + `browser_evaluate` for tagName/role) |

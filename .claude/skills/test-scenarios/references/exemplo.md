# Complete Examples

- [1. Simple scenario (coupon)](#1-simple-scenario-coupon)
- [2. Scenario Outline with boundary values (age)](#2-scenario-outline-with-boundary-values-age)
- [3. Real pending item triggering /discovery](#3-real-pending-item-triggering-discovery)

## 1. Simple scenario (coupon)

**Demand:**
> As a customer, I want to apply a discount coupon in the cart to pay less. Coupons can be expired or have a minimum purchase amount.

**Generated file** (`.claude/oracles/discount-coupon-application.md`):

````markdown
# Test Scenarios — Discount coupon application

> Origin: customer user story

## Demand summary
Customer applies a coupon in the cart, respecting expiration and minimum purchase amount.

## Impact analysis
Product rule: coupon is validated in the cart before payment; expiration and minimum amount block the application without changing the total.

## Scenarios

```gherkin
Feature: Discount coupon application
  As a customer
  I want to apply a coupon in the cart
  So that I pay a lower amount

  Background:
    Given I am logged in as a customer
    And I have items in the cart totalling $100.00
    And I am on the cart screen

  Scenario: [negative] Expired coupon is rejected
    Given a coupon "TENOFF" that is expired
    When I enter the coupon in the cart
    Then I see the message "Coupon expired"
    And the total remains $100.00

  Scenario: [negative] Coupon below minimum amount is rejected
    Given a coupon "SHIP50" with a minimum amount of $150.00
    When I enter the coupon in the cart
    Then I see the message "Minimum amount not reached"
    And the total remains $100.00

  Scenario: [positive] Valid coupon applies discount
    Given a valid coupon "TENOFF" for 10%
    When I enter the coupon in the cart
    Then the total becomes $90.00
    And the coupon appears as applied
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — Valid coupon applies discount | [positive] Valid coupon applies discount | ✅ |
| AC-02 — Expired coupon blocked | [negative] Expired coupon is rejected | ✅ |
| AC-03 — Minimum amount respected | [negative] Coupon below minimum amount is rejected | ✅ |

## Pending items
None. (The "non-existent coupon" case was not in the demand — confirm whether that rule exists; otherwise, discovery.)
````

## 2. Scenario Outline with boundary values (age)

Shows how to vary **only the data** with equivalence classes / boundaries (min−1 / min / max / max+1) in a single behavior.

**Demand:**
> As a visitor, I want to register; registration is only allowed for users aged 18 or older and under 100.

```gherkin
Feature: Age restriction on registration
  As a visitor
  I want to register
  So that I can use the platform

  Background:
    Given I am on the registration screen

  Scenario Outline: [negative] Age outside the allowed range is rejected
    Given I enter the age <age>
    When I confirm the registration
    Then I see the message "Age not permitted"

    Examples:
      | age |
      | 17  |
      | 100 |

  Scenario Outline: [positive] Age within the allowed range is accepted
    Given I enter the age <age>
    When I confirm the registration
    Then the registration is completed

    Examples:
      | age |
      | 18  |
      | 99  |
```

## 3. Real pending item triggering /discovery

When a required rule **is not** in the knowledge base: do not guess — record the Pending item and trigger `/discovery`.

**Demand:**
> As a customer, I want to pay in installments at checkout.

**Generated file** (`.claude/oracles/checkout-installments.md`):

````markdown
# Test Scenarios — Installments at checkout

> Origin: customer user story

## Demand summary
Customer splits the purchase amount into installments at checkout.

## Impact analysis
Source: no installment rules found in docs/knowledge-base/. Maximum number of installments, minimum installment amount, and interest charges are **unknown**.

## Scenarios
```gherkin
Feature: Installments at checkout
  As a customer
  I want to pay in installments
  So that I can spread payments over time

  Background:
    Given I am logged in as a customer
    And I am on the checkout screen

  Scenario: [positive] Customer pays in installments
    Given a purchase eligible for installments
    When I choose to pay in installments
    Then the purchase is recorded as installment-based
```

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — Customer can pay in installments | [positive] Customer pays in installments | ✅ |
| AC-02 — Installment limits/interest respected | — | ⚠️ pending (discovery required) |

## Pending items
Installment rules unknown (max. installments, minimum installment amount, interest charges). **Trigger `/discovery`** to investigate the checkout via Playwright MCP and document in `docs/knowledge-base/` before writing the boundary scenarios (AC-02).
````

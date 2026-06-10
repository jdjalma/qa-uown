# End-to-end example

Shows the complete path: **scenarios file** (output of `/test-scenarios`) + **reported results** → **final report**. Intentionally includes a **caveat** (⚠️) and a **not tested** Acceptance Criterion (—) to demonstrate the honesty rule (anti-"watermelon report").

- [1. Input: the scenarios file](#1-input-the-scenarios-file)
- [2. Results reported by the team](#2-results-reported-by-the-team)
- [3. Output: the generated report](#3-output-the-generated-report)

## 1. Input: the scenarios file

`docs/scenarios/discount-coupon-application.md` (summarized):

```gherkin
# language: en
Feature: Discount coupon application

  Scenario: [negative] Expired coupon is rejected
    Given an expired coupon "TENOFF"
    When I enter the coupon in the cart
    Then I see the message "Coupon expired"

  Scenario: [negative] Coupon below minimum order value is rejected
    Given a coupon "SHIP50" with a minimum order of $150.00
    When I enter the coupon in the cart
    Then I see the message "Minimum order not reached"

  Scenario: [positive] Valid coupon applies discount
    Given a valid 10% coupon "TENOFF"
    When I enter the coupon in the cart
    Then the total becomes $90.00
```

Coverage matrix from the file:

| Acceptance criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — Valid coupon applies discount | [positive] Valid coupon applies discount | ✅ |
| AC-02 — Expired coupon is blocked | [negative] Expired coupon is rejected | ✅ |
| AC-03 — Minimum order value is enforced | [negative] Coupon below minimum order value is rejected | ✅ |
| AC-04 — Non-existent coupon is handled | — | ⚠️ pending |

## 2. Results reported by the team

| Scenario | Result | Note |
|---|---|---|
| [positive] Valid coupon applies discount | Passed | — |
| [negative] Expired coupon is rejected | Passed | — |
| [negative] Coupon below minimum order value is rejected | Passed with observation | The message appears, but does not tell the customer what the minimum is or how much is missing |
| (AC-04 — non-existent coupon) | Not tested | No scenario existed; current behavior unknown |

## 3. Output: the generated report

`docs/reports/discount-coupon-application.md`:

````markdown
# Test report — Discount coupon application

> Demand: Discount coupon application in the cart
> Scenarios source: docs/scenarios/discount-coupon-application.md
> Version/environment tested: staging version of the day · Test date: 06/03/2026 · Tested by: QA

## Verdict

**🟡 Ready to release with caveats**

The discount coupon in the cart was tested and works: 3 out of 4 agreed items work (1 with a caveat) and there are no serious issues. One item still needs to be checked — what happens when a customer types a coupon that does not exist — before releasing with full confidence.

### By the numbers
| Agreed items (AC) met | Behaviors verified | Points of attention | Serious issues |
|---|---|---|---|
| 3 out of 4 (75%), 1 with caveat | 3 out of 3 tested | 1 | 0 |

## Signal legend
- ✅ **Meets** — works as expected.
- ⚠️ **Meets with caveat** — works, but with a limitation that needs attention.
- ❌ **Does not meet** — does not work as expected.
- — **Not tested** — was not possible to verify.

## What was verified
The discount coupon application in the cart: valid coupon, expired coupon, and coupon when the purchase is below the required minimum order value.

## What was NOT verified
What the system does when a customer types a coupon that **does not exist**: there was no defined behavior to test, so we do not know how the system reacts today. **Recommended to verify before releasing.**

## Coverage of agreed items
| Agreed item (AC) | Behavior(s) that prove it | Result |
|---|---|---|
| AC-01 — A valid coupon applies the discount | The customer receives the discount when entering a valid coupon | ✅ Meets |
| AC-02 — An expired coupon is blocked | The system rejects an expired coupon and keeps the original value | ✅ Meets |
| AC-03 — Purchase below minimum order blocks the coupon | The system rejects the coupon when the purchase does not reach the minimum | ⚠️ Meets with caveat |
| AC-04 — A non-existent coupon is handled | — no linked behavior | — Not tested |

**Coverage: 3 out of 4 items met (75%)** — 1 with caveat, 1 not tested.

## Behaviors tested
| Behavior | Result |
|---|---|
| The customer receives the discount when entering a valid coupon | ✅ |
| The system rejects an expired coupon and keeps the purchase value | ✅ |
| The system rejects the coupon when the purchase does not reach the minimum order value | ⚠️ |

## Points of attention
> ⚠️ Minimum order message is unclear

When the purchase is below the coupon's minimum order value, the system alerts the customer that the coupon cannot be used, but **does not tell them what the minimum is or how much is missing** to reach it — the customer is left not knowing what to do to get the discount. Low severity: does not prevent the purchase, but causes frustration and doubt.

## Recommendation and next steps
> **Release with caveats.**

1. **Before releasing:** verify how the system reacts to a coupon that does not exist (item not yet tested) — owner: QA.
2. **Next version:** improve the minimum order message, showing how much is still needed for the customer to get the discount — owner: Product and Development.

---

## For those who want to go deeper (technical detail)
- Full scenarios and coverage matrix: docs/scenarios/discount-coupon-application.md
````

# Complete Example

**Investigation question:**
> How does discount coupon registration work in the administrative panel? What are the rules?

**Process (summary of the researcher loop):**

1. **Review of what is known:** Glob in `docs/knowledge-base/` found nothing about "coupon". Investigation starts from scratch.
2. **Observation (Playwright MCP):** navigated to *Admin → Coupons → New*. Observed the fields: code, type (% or fixed value), expiration date, minimum purchase value.
3. **Hypothesis:** "code must be unique" and "expiration date is required".
4. **Test in the UI:** attempted to save with an already existing code → error "Code already registered". Attempted to save without expiration date → error "Required field". Hypotheses confirmed.
5. **Triangulation:** the minimum value connects with the already known cart scenario — coherent.
6. **Conclusion + documentation:** saved the file below, with confidence levels and gaps.

**Generated file** (`docs/knowledge-base/discount-coupon.md`):

````markdown
# Discount Coupon

> Charter: Explore coupon registration with Playwright MCP to discover uniqueness and validity rules
> Origin: question when creating coupon application scenarios · Overall confidence: high

## Purpose
Allows the administrator to create coupons that the customer applies at checkout to get a discount. Used by the marketing team.

## Available Operations
| Operation | Available? | Notes |
|---|---|---|
| Add | ✅ | Fields: code, type (% or fixed value), expiration date, minimum value. Access only for Admin profile. |
| Edit | ✅ | Does not allow changing the code after creation. |
| View | ✅ | List with filter by status (active/expired). |
| Delete | ❌ | Can only be deactivated, not deleted. |

## Flow and States (step by step in the UI)
Admin → Coupons → New → fill in fields → Save. Coupon is created as "active".

| From → To | Triggering event | Allowed? |
|---|---|---|
| Active → Expired | expiration date passed | ✅ (automatic) |
| Active → Inactive | admin deactivates | ✅ |
| Expired → Active | — | ❌ prohibited (evidence: expired coupon does not reappear for the customer) |

## Business Rules
- BR-01: Coupon code is unique — *(evidence: New Coupon screen, save with repeated code → "Code already registered")* `[confirmed]`
- BR-02: Expiration date is required — *(evidence: save without expiration date → "Required field")* `[confirmed]`
- BR-03: Minimum purchase value blocks application at checkout below the value — *(cross-referenced evidence with the cart flow)* `[inferred]`

## Logic and Exceptions
Type "%" calculates on the subtotal; type "fixed value" subtracts from the total. Expired coupon does not appear for the customer.

## Connections with What Was Already Known
- Confirms: the "minimum value" behavior used in cart test scenarios.
- Contradicts: nothing.

## Gaps / To Investigate
- Is there a per-customer usage limit? There was no visible field — check with the team or on another screen.
- What happens to applied coupons when the coupon is deactivated mid-purchase?
````

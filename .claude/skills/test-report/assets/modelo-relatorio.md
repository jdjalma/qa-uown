# Test report — <demand name>

> Demand: <ticket / user story / feature name>
> Scenarios source: docs/scenarios/<demand>.md
> Version/environment tested: <in plain words> · Test date: <mm/dd/yyyy> · Tested by: <name / team>

## Verdict

**<🟢 Ready to release | 🟡 Ready with caveats | 🔴 Not ready to release>**

<1 to 3 sentences: what was tested, whether it is ready, and the confidence level.>
<Ex.: "Customer registration: ready to release with caveats — 9 out of 10 agreed items met (90%), 1 point of attention, no serious issues.">

### By the numbers
| Agreed items (AC) met | Behaviors verified | Points of attention | Serious issues |
|---|---|---|---|
| <9 out of 10 (90%)> | <14 out of 15> | <1> | <0> |

## Signal legend
- ✅ **Meets** — works as expected.
- ⚠️ **Meets with caveat** — works, but with a limitation that needs attention.
- ❌ **Does not meet** — does not work as expected.
- — **Not tested** — was not possible to verify.

## What was verified
<features and flows exercised, in everyday language; e.g.: "customer registration, login, password recovery". No technical detail.>

## What was NOT verified
<what was left out and why — no time, depends on an integration, outside this demand. Include here any Acceptance Criterion with no linked scenario.>
<If nothing was left out: "All agreed items were verified.">

## Coverage of agreed items
Each agreed item (Acceptance Criterion) and the result of its verification:

| Agreed item (AC) | Behavior(s) that prove it | Result |
|---|---|---|
| AC-01 — <acceptance criterion text> | <behavior sentence> | ✅ Meets |
| AC-02 — <acceptance criterion text> | <behavior sentence> | ⚠️ Meets with caveat |
| AC-03 — <acceptance criterion text> | — no linked behavior | — Not tested |

**Coverage: <9 out of 10 items met (90%)>** — <X with caveat, Y not tested>.

## Behaviors tested
Each behavior verified and its result:

| Behavior | Result |
|---|---|
| <The customer is able to register with valid data> | ✅ |
| <The system prevents registration with an already existing ID> | ✅ |
| <The customer recovers their password via email> | ⚠️ |

## Points of attention
> <Highlight for serious points, in language that describes the consequence for the user/business.>

<what failed or requires care, and what the impact is. Ex.: "⚠️ When entering a coupon below the minimum order value, the message does not say how much is missing — the customer does not know what to do.">
<If none: "No points of attention.">

## Recommendation and next steps
> **<Actionable recommendation: can release / release with caveats / fix before releasing.>**

<what to fix first, who does it, and in what order.>

---

## For those who want to go deeper (technical detail)
- Full scenarios and coverage matrix: docs/scenarios/<demand>.md
- <evidence, technical observations, links — all detail goes here, not above>

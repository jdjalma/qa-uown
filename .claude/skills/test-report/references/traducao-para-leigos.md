# Translation to business language (reference guide)

Use this when building the report, whenever a technical term or execution result needs to be turned into language that any team can understand. Load this file during the translation step (step 5 of the Process).

- [1. Banned technical terms → how to write instead](#1-banned-technical-terms--how-to-write-instead)
- [2. Execution status → business language](#2-execution-status--business-language)
- [3. Technical failure → user/business impact](#3-technical-failure--userbusiness-impact)

## 1. Banned technical terms → how to write instead

| Technical term | Do NOT write | Write instead |
|---|---|---|
| Gherkin / BDD / Cucumber | "scenario in Gherkin" | "behavior tested" |
| Given / When / Then | the scenario steps | a behavior sentence: *"the customer is able to…"* |
| Test case / TC | "test case TC-12" | "verification" / "behavior" |
| Regression | "regression test" | "we verified that what already worked still works" |
| Smoke test | "smoke test" | "quick check of the essentials" |
| Mock / stub | "service mock" | "we simulated the external service" |
| Flaky | "flaky test" | "unstable result — sometimes it works, sometimes it does not" |
| Endpoint / API / route | "error on endpoint /cart" | "when saving the cart" |
| Error code (500, 404…) | "error 500" | describe what the user sees or loses |
| Stack trace / log | "stack trace attached" | "technical detail" (move to the appendix) |
| Deploy / build / environment | "in the staging build" | "in the tested version" |
| Code coverage | "70% code coverage" | "coverage of agreed items (acceptance criteria)" |
| Bug / defect | "critical bug" | "issue" / "failure" (with the impact) |

> General rule: if a term is **unavoidable**, explain it the first time it appears, in one sentence.

## 2. Execution status → business language

| Execution result | In the report | Signal |
|---|---|---|
| Passed (OK) | Works as expected · Meets | ✅ |
| Passed with observation (Pass with warning) | Works with caveat | ⚠️ |
| Failed | Does not work as expected · Does not meet | ❌ |
| Blocked | Was not possible to test (depends on something) | — |
| Not executed / skipped (Skipped / Not run) | Not tested | — |

## 3. Technical failure → user/business impact

Always describe the **consequence** that the user or the business experiences, not the technical cause.

| Technical failure | Impact (write it this way) |
|---|---|
| "error 500 when completing the purchase" | "the customer cannot complete the purchase" |
| "CPF validation does not trigger" | "the system accepts an invalid CPF in the registration" |
| "search timeout" | "the search is slow and the customer may give up" |
| "total field does not recalculate" | "the displayed total amount is incorrect" |
| "confirmation email is not sent" | "the customer does not receive confirmation and is unsure whether it worked" |
| "session expires mid-flow" | "the customer is logged out and loses what they were filling in" |

> When useful, combine impact + severity: *"the customer cannot complete the purchase — prevents use, must be fixed before releasing."*

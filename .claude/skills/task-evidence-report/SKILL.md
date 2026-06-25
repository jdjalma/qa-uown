---
name: task-evidence-report
description: Load when CLOSING a test pipeline (last validated PASS, no blocking bugs pending re-execution) to generate `docs/taskTestingUown/{testName}/{testName}-evidence.md` - a product-focused report that will be pasted into the task comment (GitLab/Jira) as evidence of QA validation. Do NOT generate on every intermediate run; this artifact is the "final stamp" of the validation cycle. Distinct from `{testName}-report.md` (technical history) - evidence is stakeholder-facing.
disable-model-invocation: true
---

# Task Evidence Report

> Evidence report that gets pasted into the ticket (GitLab/Jira) at the end of the validation cycle. Stakeholder-facing - the primary reader is PO/Tech Lead/Dev, not QA.

## ⚠️ When to generate

Generate **only once per task cycle**, at the moment the pipeline closes:

- Last `qa-validator` PASS already recorded in `{testName}-report.md`.
- No blocking bugs pending re-execution (bugs cataloged as OBS/follow-up are accepted).
- The user (or orchestrator) signaled "pipeline closed", "ready to paste into the ticket", "final report", or equivalent.

**DO NOT** generate:
- After every intermediate run - that is the role of `{testName}-report.md`.
- When there are still CTs with PENDING/SKIP status due to undecided test debt.
- As a duplication of the technical report - if the content is execution history, it goes in `-report.md`, not here.

If `{testName}-evidence.md` already exists in the task folder, **overwrite** it with the updated version (do not accumulate versions).

## ⚠️ Reports = history, not pattern source (rule #16)

Same disclaimer as the other reports: this file is a **record of the validation cycle**, not a source of patterns. Source-tagging remains mandatory in every technical assertion (taxonomy in [[test-report-standard]] §9).

## Writing principles

1. **Product-focused, not test-mechanic.** The reader is PO/Dev/TL - they want to know "is the ticket addressed? Yes/no" and "what improvements were discovered?". Do NOT list test mechanics in the body: page object, fixtures, selectors, `page.evaluate`, `page.on('response')`, "live snapshot", "Playwright annotation", "captured via curl", helper function names (`calculateDate`, `buildTestData`, etc), or any automation jargon. Instead of "captured via `page.on('response')` in the real browser", write "the 4 requests to the proxy responded 200". Instead of "live snapshot via Playwright annotation", write "the loader exposed the expected fields". Product language, not framework language.
2. **Tiered visual hierarchy.** A reader scanning in 30s should see: header + TL;DR + Coverage table (requirements × scenarios) and already know the answer. A reader who wants to dig deeper reads in order (Summary → Scenarios → Recommendation) and expands `<details>` on long findings. NEVER bury important content inside a `<details>` collapsed by default (summary, classification, recommendation always stay visible).
3. **Scannable size, not absolute line count.** Content visible at the first scroll should allow a verdict in 30s. Technical details go in collapsed `<details>`, do not inflate fatigue. Reports with 5+ findings or long cross-brand content can exceed 300 total lines without harm if the visual structure preserves scannability.
4. **English.** Only technical values (URLs, enums, classes, queries) in original form.
5. **Source-tagging.** Every non-trivial technical assertion references primary evidence (leadPk, accountPk, file:line, SQL query). Without a source tag → downgrade to `[HYPOTHESIS]` or `[OBSERVATION]` (taxonomy in [[test-report-standard]] §9 + rule #10).
6. **Conservative classification (rule #10).** `[CONFIRMED]` requires a fresh repro. Isolated observation in pre-existing data = `[OBSERVATION]` or `[HYPOTHESIS]`.
7. **Verdict in ONE line** in the header. No "depends"/"maybe". If there is a blocker, it is Block; if there is a caveat but it does not block, it is Approve with follow-up.
8. **Do NOT use em-dash (`—`).** Use instead: hyphen (`-`), colon (`:`), parentheses, or period. Also applies to table headers, indexes and bullets. Applies to ALL generated reports (this artifact, `-report.md`, `-spec.md` and any ticket comment).
9. **Do not repeat the environment in the body.** Env is already in the header (`**Environment:** qa1`). Do NOT write "The validation in qa1...", "The fix works in qa1...", "ran in qa1" in the Summary, Scenarios or Recommendation. When you need to reference env-specific URLs in the scenarios (e.g. `apply-qa1.uownleasing.com`), use the direct technical URL without the narrative prefix "in qa1".
10. **Do not use comparative references to a previous MR/PR** (e.g. "the bug before MR !1464", "before !XYZ", "the old version"). Describe the current behavior positively: what the system does now, not what was broken. The MR is already in the header; the body is about the validated state, not about bug history. Exception: the "Summary" section may mention the corrected problem in product terms ("the fingerprint script did not execute"), without citing the MR number.

## Template

**File path:** `docs/taskTestingUown/{testName}/{testName}-evidence.md`

```markdown
# QA Validation - #{taskId} {taskTitle}

**Environment:** {env} (build {YYYY-MM-DD or MR/commit ref})
**Result:** {✅ Approved / ⚠️ Approved with follow-up / ❌ Blocked} **- {1-line verdict}**

---

> ### TL;DR
> {1 line: how many requirements confirmed, across which brands/frequencies}.
> {1 line: observations or blockers found, or "No findings outside scope"}.
> **Action:** {1 sentence: approve deploy / wait for fix / discuss with PO}.

---

## Summary

{1-2 short paragraphs in business language:
 - What the fix/feature does and what the original problem was.
 - Did it work? Across which brands/frequencies/scenarios?
 Do NOT describe test mechanics here. Do NOT repeat TL;DR.}

---

## Coverage: requirements x scenarios

> Cross-reference table between each task requirement + acceptance criterion (row) and the scenario(s) described below that validated that item (column "Scenario(s)"). Do NOT use only abbreviated codes (e.g. "AC-02", "CT-03") in the scenario column — always include the full scenario title so the table is readable without needing to scroll back. Source-tag mandatory where applicable (leadPk, accountPk, SQL query, doc:line).

| # | Requirement + acceptance criterion | Scenario(s) that validated | Status |
|---|-----------------------------------|---------------------------|--------|
| R1 | {task requirement in short prose, with concrete expected value - e.g. "IGLOO loader initializes with canonical shape `version=general5`, `subkey=IOVATION_KEY`"} | "{full scenario title that validates}" + source-tag (leadPk=X, accountPk=Y, doc:line) | ✅ CONFIRMED / ⚠️ PARTIAL / ❌ FAILED |
| R2 | {next requirement} | "{scenario}" | ✅ |
| ... | ... | ... | ... |

**When there are OBS/BUG items outside the requirements scope** (UX improvements, cross-cutting observations, adjacent bugs found during validation), list them in a separate **Observations** section below (see template) - do NOT mix with the coverage table, which covers only ticket requirements.

---

## Validated scenarios

> Scenarios are DESCRIBED in prose (one sub-section per requirement). Each block has a numbered heading, status badge in a quote block, prose description, and an Evidence line.

### Task requirements

#### 1. {Descriptive title of the requirement - 1 line}

> ✅ **PASSED** · {where tested: brand / merchant / URL / frequency}

{1-3 sentences describing what was tested and what was observed. Business language, not test mechanics.}

**Evidence:** leadPk={N} / accountPk={N} / merchantCode `OW90218-0001` / log entry / query

#### 2. {Next requirement}

> ✅ **PASSED** · {where tested}

{same}

**Evidence:** ...

### Additional scenarios explored

> Coverage beyond the AC (expanded scope, edge cases, security, dual-brand regression, mobile-only). Omit if none. Same prose structure, more concise.

#### 7. {Extra scenario title}

> ⚠️ **Improvement identified** · see [OBS-1](#obs-1)
> (or `> ✅ **PASSED**` if it raises no observation)

{1-2 sentences.}

---

## Observations (do not block release)

> Omit this entire section when there are no OBS.

### OBS-1: {Short finding title}

> {1-line summary of the observation, in plain prose}

<details>
<summary><b>Root cause, reproduction, and proposed fix</b></summary>

**Root cause:** {technical explanation in 1-3 sentences, with reference to file:line where applicable}

**When it triggers:** {minimum reproduction condition: frequency, brand, call sequence}

**Impact:** {visible effect for customer/agent/integration; real severity}

**Evidence:** leadPk={N} / accountPk={N} / query / log entry

**Reproduction:**
\`\`\`{sql|ts|js|http}
{minimal snippet that reproduces - copy-pasteable}
\`\`\`

**Proposed fix:** {optional, include if the finding has an obvious fix in ≤5 lines; otherwise leave to dev}

</details>

**Classification:** {[CONFIRMED] / [HYPOTHESIS] / [OBSERVATION]}. {UX Improvement | Performance | Security | Observability}

---

## Blockers

> Always include this section, even when empty (explicitly signals "validation found no blocker"). When there is a BUG, apply the same OBS structure, but with badge `> ❌ **BLOCKER**` at the top.

_None in this validation._

---

## Recommendation

> ✅ **{Approve QA deploy → Staging / Approve with follow-up / Block release}**

- {bullet 1: confirmed coverage point}
- {bullet 2: covered regression}
- {bullet 3: dual-brand / dual-frequency scope if applicable}

**Non-blocking pending items:**

- {item 1: link to child task if already created}
- {item 2: manual validation recommendation or follow-up}

---
```

### Rendering notes

- **`<details>`** works natively in GitLab and Jira Cloud (markdown comments). The content inside remains valid markdown. The `<summary>` is what stays visible when collapsed.
- **Quote blocks** (`>`) with a badge at the top of each requirement give visual scannability without needing to open a table. Works in any renderer.
- **TL;DR** inside a blockquote (`> ### TL;DR`) creates a highlighted visual box; the reader sees the verdict before any prose.

## Field mapping

| Placeholder | Source |
| --------------------- | --------------------------------------------------------------- |
| `{taskId}` | GitLab/Jira number (e.g. 530, 1293) |
| `{taskTitle}` | short title of the issue |
| `{testName}` | same slug used in `-spec.md`/`-report.md` |
| `{env}` | qa1 / qa2 / stg |

## Checklist before closing the file

- Verdict in ONE line in the header - no ambiguity.
- Every `[CONFIRMED]` assertion has leadPk/accountPk/query as primary source.
- Dual-brand coverage (UOWN + Kornerstone) made explicit when applicable (rule #4 of QA-flow).
- Activity log validation cited if the flow generates a log (inviolable rule #13).
- No long per-CT prose - test mechanics stay in `-report.md`.
- ≤250 lines. Beyond that, move technical detail to `-report.md`.
- No pattern inference from `-report.md` - that file is history, not a source (rule #16).
- Disclaimer/source-tagging following [[test-report-standard]] §1 + §9.
- Non-blocking pending items with a follow-up suggestion (child task / discussion with PO).

## Signals of "pipeline closed"

The orchestrator (CLAUDE.md) or the user explicitly signals one of these:
- "pipeline closed" / "ready to paste into the ticket" / "final report" / "final evidence"
- "I'm going to paste it into GitLab/Jira now"
- `qa-validator` reports the last cycle as PASS with no pending re-execution follow-up

Without an explicit signal → do NOT generate. When in doubt, ask the user.

## Cross-references

- [[test-report-standard]] - format of `-report.md` (complementary technical history).
- [[bug-classification]] - taxonomy `[CONFIRMED] / [HYPOTHESIS] / [OBSERVATION]`.
- [[volatile-knowledge-registry]] - drift-prone categories require a source-code source tag.
- Current examples (consult as a style reference, not a pattern reference):
 - `docs/taskTestingUown/RU05.26.1.52.0_redirectInvalidOrInactiveApplicationLinks_1293/gitlab-comment.md` (simple, ~70 lines)
 - `docs/taskTestingUown/RU05.26.1.52.0_settleApplicationFailsWhenNextPayDateMissing_530/gitlab-comment.md` (cross-brand, ~150 lines)
 - `docs/taskTestingUown/RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454/gitlab-comment.md` (3 technical findings, ~250 lines)

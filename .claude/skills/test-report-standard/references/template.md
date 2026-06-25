# Test Report Standard - Full Template & Examples

> Reference extracted from SKILL.md. For rules and structure overview, see [../SKILL.md](../SKILL.md).

## Full Report Template (validate-results)

**File path:** `docs/taskTestingUown/{testName}/{testName}-report.md`

```markdown
# Test Report: {testName}

> ⚠️ **This file is an execution record, NOT a pattern source.**
> Pattern source = skills (`.claude/skills/`) + code (`src/`, `tests/`).
> Volatile categories (drift-prone) → [[volatile-knowledge-registry]].
> Re-reading allowed only for: (a) historical audit, (b) reproducing the test via leadPk/accountPk.
> NEVER infer a pattern from this file.

## Task Information

| Field | Value |
|-------|-------|
| **Title** | {taskTitle} |
| **GitLab URL** | {taskUrl} |
| **Milestone** | {taskMilestone} |
| **Labels** | {taskLabels} |
| **Pipeline** | {pipelineType} |

## Description

{taskDescription — full description in markdown}

## Test Execution

| Field | Value |
|-------|-------|
| **Test File** | `{testFilePath}` |
| **Environment** | {environment} |
| **Playwright Project** | {project} |
| **Execution Date** | {YYYY-MM-DD HH:mm} |
| **Duration** | {duration} |
| **Result** | {N passed / N failed / N skipped} |
| **Video** | Recorded (`VIDEO=on`) |
| **Trace** | Enabled (`TRACE=on-first-retry`) |

> For API-only tests (no browser): replace the Video and Trace lines with `N/A (API-only)`.

## Evidence (Data Used/Created)

> **MANDATORY** — every execution MUST list the evidence PKs (leads and/or accounts) used or created during the test. These values allow manual tracing and reproduction of the test.

| Type | PK | Role in Test | Created/Existing |
|------|----|--------------|:----------------:|
| Lead | leadPk={N} | {description — e.g. approved application, low-risk CA} | Created / Existing |
| Account | accountPk={N} | {description — e.g. ACTIVE account for CC payment} | Created / Existing |
| Arrangement | arrangementPk={N} | {description — e.g. SETTLEMENT 3 installments CC} | Created |

> **Rules:**
> - Include ALL leadPk and accountPk extracted from execution logs
> - If the test uses pre-existing accounts (GDS bypass), mark as "Existing"
> - If the test creates new leads/accounts, mark as "Created"
> - Also include relevant auxiliary PKs: arrangementPk, ccTransactionPk, achPk, fundingTransactionPk
> - If no lead/account is used (e.g. config test), use: `> No lead/account evidence — configuration test.`

## Screenshots

| CT | File | Description |
|----|------|-------------|
| CT-XX | `docs/taskTestingUown/{testName}/{testName}-NN-desc.png` | {captured state — proof of the acceptance criterion} |

> For API-only tests (no browser): replace the block with `> No screenshots — API-only test.`

## Scenarios

{scenarios in the standard format — see section 2}

## Requirements Coverage

> Include this section when the task has explicit acceptance criteria or requirements in the GitLab issue.

| Requirement | Covered | Scenario |
|-------------|:-------:|---------|
| {task requirement} | YES | CT-XX |

## Application Bugs Found

> Include this section only when bugs are identified during execution. Omit entirely if there are no bugs.

{bugs in the standard format — see section 7}

## Validation Summary

{validation table — see section 4}
```

## Scenario Output Format

Each scenario follows this exact pattern:

```markdown
### CT-XX

**Objective:** {one sentence — what the scenario validates}

**What is verified:** {system behavior in business language — what the system does, not what the test does; mentions the data source when relevant}

Examples:
| Column1 | Column2 |
|----------|----------|
| {value1} | {value2} |

#### How to verify manually

1. {numbered step — specific URL, route, navigation action}
2. {numbered step — expected value and where to find it}
3. {for API: curl/Postman instruction; for DB: SQL query; for UI: click-by-click navigation}

**PASSED**

---
```

### Golden Rule Examples

**Objective** states what it validates. **What is verified** describes the system behavior. **How to verify manually** has the exact technical values.

Bad - vague Objective (not accepted):
```
Verifies the endpoint behavior.
```

Bad - technical What is verified (not accepted):
```
`rows.length > 0` — at least one row returned after the filter
`row["Invoice Number"] === "R45701"` — all rows display the invoice
```

Good:
```
**Objective:** Verify that filtering by invoice number returns only leads that have that invoice.

**What is verified:** When searching by an existing invoice number, the table returns only leads whose `merchant_invoice_number` matches the filtered value — confirming that the filter is functional and precise.
```

## Parsing Rules (extracting values from test output)

| Log Pattern | Extract |
|-------------|---------|
| `[CT-XX] runId={id}, email={e}` | runId, email |
| `[CT-XX] leadPk={N}` | leadPk |
| `[CT-XX] accountPk={N}` | accountPk |
| `[CT-XX] leadUuid={UUID}` | leadUuid |
| `[CT-XX] short_code="{code}"` | shortCode |
| `[CT-XX] redirectUrl="{url}"` | redirectUrl |
| `[CT-XX] status={S}` | status |
| `[CT-XX] response: {json}` | response body fields |
| `[CT-XX] Flyway migration: version={V}, script={S}, success={B}` | version, script, success |
| `✓ {test title} ({duration}ms)` | pass, duration |
| `✘ {test title} ({duration}ms)` | fail, duration |
| `- {test title}` (list reporter) | skipped |

## Validation Summary Template

```markdown
## Validation Summary

| Check | Result |
| ----- | ------ |
| All task scenarios covered | YES / NO |
| API contracts match Postman | YES / NO / N/A |
| DB schema matches migration | YES / NO / N/A |
| Business rules validated | YES / NO / N/A |
| Application bugs found | YES ({N} bugs) / NO |
| Total scenarios | {N} |
| Passed | {N} |
| Failed | {N} |
| Skipped | {N} |
| Video recorded | YES / N/A (API-only) |
| Screenshots saved | YES ({N} files in reports/screenshots/) / N/A (API-only) |
```

## Screenshots Rules

**Path:** `docs/taskTestingUown/{testName}/{testName}-{NN}-{desc}.png`

Screenshots MUST be saved inside the task folder alongside the report and spec files. This keeps all artifacts co-located and prevents cleanup by Playwright between runs.

- Saved via `page.screenshot({ path: 'docs/taskTestingUown/{testName}/{testName}-{NN}-{desc}.png', fullPage: false })`
- Naming: sequential two-digit number + short description, e.g. `1233-ct01-01-payment-screen.png`
- At least 1 per CT — taken immediately after the key assertion (proves the acceptance criterion)
- Focus: screenshot must show the state that proves the CT passed (not generic page captures)
- API-only tests: no screenshot needed (no browser)
- Reference in `.md` Screenshots table: `docs/taskTestingUown/{testName}/{file}.png`
- **NEVER use `reports/screenshots/` or `reports/test-results/`** — those are cleaned by Playwright between runs

## Bug Report Format (Application Bugs Only)

**Section name:** always `## Application Bugs Found` — no variations allowed.

Each bug within the section:

```markdown
### BUG-{N} — {descriptive bug title}

**Status:** OPEN / RESOLVED / PARTIALLY RESOLVED
**Severity:** Critical / High / Medium / Low

**Description:** {what was expected vs. what happened}
**How to Reproduce:**
1. {numbered step}
2. {numbered step}
**Evidence:** {API response, screenshot path, DB query result}
**Scenario that detected it:** CT-XX
**Probable cause:** {brief technical analysis}
```

Rules:
- Bugs numbered sequentially within the report: BUG-01, BUG-02...
- Include only bugs found during THIS execution (not pre-existing known bugs unless still open)
- If a bug from a previous execution is still open, preserve it and update status if changed
- Omit the entire section if no bugs found

## Requirements Coverage (optional section)

Include when the task has explicit acceptance criteria or a requirements list in the GitLab issue.

```markdown
## Requirements Coverage

| Requirement | Covered | Scenario |
|-------------|:-------:|---------|
| {requirement 1 — exact text or paraphrase from task} | YES | CT-01 |
| {requirement 2} | YES | CT-02, CT-03 |
| {requirement 3 — not implemented or out of scope} | NO | — |
```

Rules:
- One row per acceptance criterion from the GitLab issue
- "Covered" = YES only if there is a CT that directly validates the requirement
- Multiple CTs per requirement allowed (comma-separated)
- If not covered: NO + note why (out of scope, environment limitation, etc.)

## Source-Tagging Examples

Bad - no tag (not accepted as `[CONFIRMED]`):
```
**Probable cause:** The sweep does not consider scheduled SALE.
```

Good - with tags (accepted as `[CONFIRMED]`):
```
**Probable cause:** The sweep filters only COMPLETED, ignoring SCHEDULED SALE.
[svc-source:StickyRecoverScheduledTask.java:78]
[db-observation:uown_scheduled_task WHERE pk=80, column sql_to_pick_accounts]
[user-provided:Priyanka 2026-05-15]
```

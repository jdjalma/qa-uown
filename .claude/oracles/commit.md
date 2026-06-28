---
last-reviewed: 2026-06-28
last-reviewed-sha: 7805e73
covers:
  - .gitignore
---

# Git Commit

> Claude stages files and runs `git commit`. Before staging, Claude prepares the diff: removes task-specific references (ticket IDs, issue numbers, inline "added for task X" comments) that rot over time, while preserving every rule, learning, or pitfall extracted during the work in its canonical location (skill, knowledge-base, pitfalls doc). The oracle verifies preparation quality, commit correctness, message compliance, absence of sensitive content, and no hook bypass.

## Acceptance Criteria

| ID | Criterion | Oracle |
|---|---|---|
| AC-01 | A new commit SHA appears in `git log` after `git commit` completes | CT-01 |
| AC-02 | Commit message follows `type(scope): description` pattern | CT-02 |
| AC-03 | All intended files appear in `git show --stat HEAD` and no unintended files are included | CT-03 |
| AC-04 | No sensitive file (`.env`, `*.pem`, credentials) is present in the commit | CT-04 |
| AC-05 | `--no-verify` was NOT used — pre-commit hooks ran without bypass | CT-05 |
| AC-06 | Before staging, the diff was reviewed and task-specific references (ticket IDs, issue numbers, "added for task X" inline comments) were removed from code and docs | CT-06 |
| AC-07 | Any rule, learning, or pitfall extracted during the task was persisted to its canonical location (skill pitfall, knowledge-base doc, or SKILL.md) before committing | CT-07 |

## Scenarios

```gherkin
Feature: Git Commit
  As the QA automation system
  In order to persist code changes with traceability and without exposing secrets
  Claude must commit only the intended files with a compliant message and no hook bypass

  Background:
    Given Claude has staged a set of files using `git add`

  Scenario: [negative] CT-06 — Diff contains task-specific references that were not removed
    Given the diff includes inline comments such as "// added for task #123", "// fix for issue #456", or "// TODO: remove after ticket X is closed"
    When `git diff HEAD` is inspected before push
    Then those references appear in the committed code or docs
    And the codebase now contains comments that will rot as the task closes and the context is lost

  Scenario: [negative] CT-07 — Learning extracted during the task was not persisted before committing
    Given a non-obvious rule or pitfall was discovered during the work (e.g. a hidden validation, an unexpected timeout, a broken selector pattern)
    When the commit diff is inspected
    Then no corresponding entry exists in `.claude/skills/application-lifecycle/references/pitfalls/`, `docs/knowledge-base/`, or the relevant SKILL.md
    And the learning exists only in the conversation context and will be lost after the session ends

  Scenario: [negative] CT-04a — Commit includes a sensitive file
    Given a file named `.env` or with extension `.pem` was staged
    When `git show --name-only HEAD` is inspected after the commit
    Then the sensitive file appears in the commit diff
    And the commit must be reverted before the branch is pushed

  Scenario: [negative] CT-05 — Pre-commit hook was bypassed
    Given the commit was run with the `--no-verify` flag
    When the Bash command used is inspected
    Then `--no-verify` is present in the command without explicit user authorization

  Scenario: [negative] CT-02a — Commit message does not follow project convention
    Given a commit was created with a free-form message such as "fix stuff" or "updates"
    When `git log -1 --pretty=%s` is inspected
    Then the subject line does not match the pattern `type(scope): description`

  Scenario: [positive] CT-01 — Commit created successfully with a new SHA
    Given Claude staged the intended files
    When `git commit` completes without error
    Then `git log -1 --pretty=%H` shows a SHA not present before the commit
    And `git status` reports "nothing to commit, working tree clean"

  Scenario: [positive] CT-02b — Commit message follows project convention
    Given Claude ran `git commit` with a structured message
    When `git log -1 --pretty=%s` is inspected
    Then the subject line matches `type(scope): description` where type is one of feat, fix, wip, chore, docs, refactor, or test
    And `git log -1 --pretty=%B` contains the `Co-Authored-By: Claude` trailer

  Scenario: [positive] CT-03 — Commit contains exactly the intended files
    Given Claude staged a specific set of files before committing
    When `git show --stat HEAD` is inspected
    Then every staged file appears in the diff output
    And no file outside the staged set appears in the diff output

  Scenario: [positive] CT-04b — Commit contains no sensitive files
    Given Claude reviewed the staged files before committing
    When `git show --name-only HEAD` is inspected
    Then no file matching `.env`, `*.pem`, `*credentials*`, or `*secret*` appears in the output

  Scenario: [positive] CT-06b — Diff reviewed and task references removed before staging
    Given the diff contained inline comments referencing a task ID or issue number
    When Claude reviews and cleans the diff before running `git add`
    Then `git diff HEAD` contains no patterns such as `// .*#\d+`, `// added for task`, `// fix for issue`, or `// TODO:.*ticket`
    And the code intent is expressed through naming and structure, not through task-specific annotations

  Scenario: [positive] CT-07b — Knowledge extracted during the task is present in the commit
    Given a non-obvious rule or pitfall was discovered during the work
    When the commit diff is inspected
    Then a corresponding entry appears in `.claude/skills/application-lifecycle/references/pitfalls/`, `docs/knowledge-base/`, or the relevant SKILL.md
    And the rule is expressed as a reusable, context-free statement that future agents can apply without the original task context
```

## Oracles

> **Staleness check (run before any Oracle):**
> `git log 7805e73..HEAD -- .gitignore`
> Non-empty output → prepend `[BDD MAY BE STALE]` to this oracle report.

### Oracle: CT-01 — Commit created with new SHA

| Checkpoint | Expected value | How to verify |
|---|---|---|
| New SHA in log | A SHA that did not exist before the commit | `git log -1 --pretty=%H` |
| Working tree clean | "nothing to commit, working tree clean" | `git status` |
| Commit count increased | Previous count + 1 | `git rev-list HEAD --count` |

### Oracle: CT-02a / CT-02b — Commit message

| Checkpoint | Expected value | How to verify |
|---|---|---|
| Subject line format | Matches `^(feat\|fix\|wip\|chore\|docs\|refactor\|test)(\([a-z0-9-]+\))?: .+` | `git log -1 --pretty=%s` |
| No trailing period | Subject does not end with `.` | `git log -1 --pretty=%s` |
| Co-author trailer present | Body contains `Co-Authored-By: Claude` | `git log -1 --pretty=%B` |

### Oracle: CT-03 — Commit contains exactly the intended files

| Checkpoint | Expected value | How to verify |
|---|---|---|
| All staged files present | Every file in the original `git add` list appears in the commit | `git show --stat HEAD` |
| No unintended files | No extra file outside the staged set | `git show --name-only HEAD` |

### Oracle: CT-04a / CT-04b — No sensitive files in commit

| Checkpoint | Expected value | How to verify |
|---|---|---|
| No `.env` file | `.env` absent from the commit | `git show --name-only HEAD \| grep -E '(^\.env$\|\.env\.)' → empty` |
| No PEM / key / credential file | No `*.pem`, `*.key`, `*.cert`, `*credentials*`, `*secret*` | `git show --name-only HEAD \| grep -iE '\.(pem\|key\|cert)$\|credentials\|secret' → empty` |

### Oracle: CT-05 — No hook bypass

| Checkpoint | Expected value | How to verify |
|---|---|---|
| `--no-verify` absent in commit command | Bash call for `git commit` does not contain `--no-verify` | Inspect Bash tool call in transcript |
| Hook output present | Terminal output from `git commit` shows hook execution (no "hooks skipped" message) | Terminal output of `git commit` |

### Oracle: CT-06 / CT-06b — Task references removed from diff

| Checkpoint | Expected value | How to verify |
|---|---|---|
| No ticket/issue ID in comments | Diff contains no `// .*#\d+`, `// added for task`, `// fix for issue`, `// handles the case from` | `git diff HEAD \| grep -iE '//.*#[0-9]+\|added for task\|fix for issue\|handles the case from'` → empty |
| No TODO referencing a ticket | No `// TODO:.*ticket`, `// TODO:.*issue`, `// TODO:.*task` in diff | `git diff HEAD \| grep -iE 'TODO.*ticket\|TODO.*issue\|TODO.*task'` → empty |
| Code intent expressed without task context | Naming, structure, and canonical doc (pitfall/KB) carry the meaning — not inline task refs | Manual review of the diff |

### Oracle: CT-07 / CT-07b — Knowledge persisted before commit

| Checkpoint | Expected value | How to verify |
|---|---|---|
| Pitfall entry present (if applicable) | If a non-obvious constraint was found, a new numbered entry exists in `.claude/skills/application-lifecycle/references/pitfalls/` | `git show --name-only HEAD \| grep pitfalls` → non-empty when pitfall was added |
| Knowledge-base doc present (if applicable) | If a feature behavior was discovered, a doc exists in `docs/knowledge-base/` | `git show --name-only HEAD \| grep knowledge-base` → non-empty when KB was updated |
| Rule is context-free | The added entry makes sense without reading the original task — no reference to a specific ticket or account PK | Read the added pitfall/KB entry |
| No "discovered during task X" phrasing | The entry does not contain "this was found in task #", "issue #", or "during the work on ticket" | `git diff HEAD \| grep -iE 'found in task|during.*task|issue #|ticket #'` → empty |

## Coverage matrix

| Acceptance Criterion | Scenario(s) | Status |
|---|---|---|
| AC-01 — New commit SHA in log | CT-01: [positive] Commit created with new SHA | Covered |
| AC-02 — Message follows `type(scope)` convention | CT-02b: [positive] Message compliant; CT-02a: [negative] Message non-compliant | Covered |
| AC-03 — Exactly the intended files in commit | CT-03: [positive] Commit contains exactly the intended files | Covered |
| AC-04 — No sensitive files | CT-04b: [positive] No sensitive files; CT-04a: [negative] Sensitive file detected | Covered |
| AC-05 — No hook bypass | CT-05: [negative] Hook bypassed without authorization | Covered |
| AC-06 — Task references removed from diff | CT-06b: [positive] Task references removed; CT-06: [negative] Task refs left in code | Covered |
| AC-07 — Knowledge persisted to canonical location | CT-07b: [positive] Knowledge in commit; CT-07: [negative] Learning not persisted | Covered |

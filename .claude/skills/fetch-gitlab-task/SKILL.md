---
name: fetch-gitlab-task
description: Load when the user's input contains a GitLab issue URL (https://*/issues/{iid}). Fetches via API v4, extracts title/description/labels/comments/milestone, classifies the pipeline type, generates a standardized test name.
disable-model-invocation: true
---

# Fetch GitLab Task

## When to apply

The user's input contains a URL of the form `https://{host}/{project_path}/-/issues/{iid}`.

Detection pattern: regex `/-/issues/\d+`.

## Procedure

### 1. Check the token

```bash
test -n "$GITLAB_TOKEN" && echo OK || echo "MISSING — abort"
```

`GITLAB_TOKEN` must be in `.env`. If missing, **stop** and ask the user.

### 2. Parse the URL

```
https://{host}/{project_path}/-/issues/{iid}
```

`project_path` needs URL-encoding (`/` → `%2F`).

### 3. Fetch issue

```bash
curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
 "https://{host}/api/v4/projects/{encoded_path}/issues/{iid}"
```

Extract:
- `title`
- `description`
- `labels[]`
- `milestone.title` (e.g.: `R1.49.1`)
- `assignee.name`
- `state`
- `web_url`
- `related_merge_requests`

### 4. Fetch comments

```bash
curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
 "https://{host}/api/v4/projects/{encoded_path}/issues/{iid}/notes?sort=asc"
```

Filter `system=false` — human comments only.

### 5. Classify the pipeline type

| Labels present | Suggested pipeline |
|------------------|-------------------|
| `e2e`, `test`, `automation` | new-flow |
| `api`, `endpoint`, `integration` | new-api |
| `bug`, `flaky`, `broken` | debug |
| `refactor`, `tech-debt` | refactor |
| `docs`, `documentation` | docs |
| No clear match | custom |

### 6. Generate the test name

Project convention:

```
{milestone}_{camelCaseTitle}_{iid}
```

Example: `R1.49.1_separateShortCodeInANewEntity_469`

camelCase rule:
- lowercase the first word
- capitalize the first letter of each subsequent word
- remove spaces and special chars

File name identical + `.spec.ts`.

## Expected output

```markdown
## Issue: {title}
- URL: {web_url}
- Labels: {labels}
- Milestone: {milestone}
- Issue Number: {iid}
- State: {state}
- Suggested pipeline: {pipeline_type}

## Description
{description}

## Detected ACs
{list ACs extracted from the description — if there is no explicit AC, FLAG: "task has no AC — do not test before defining it with the PO"}

## Relevant comments
{summarized human comments}

## Test naming
- describe: `{milestone}_{camelCaseTitle}_{iid}`
- file: `{milestone}_{camelCaseTitle}_{iid}.spec.ts`

## Next step
Forward to qa-planner with this context.
```

## DoR check (memory `project_qa_task_structure`)

Before proceeding:

- Explicit AC? If not, **flag** "no AC = no test".
- Scenarios defined? If not, the agent will generate them via [[scope-analysis]] + [[test-design-techniques]].
- Clear DoD? If not, flag — the project's DoD requires QA + Staging + regression.

## Pitfalls

- An expired token returns 401 → friendly message.
- A private issue without access → 404 — ask the user to check permissions.
- A URL with a `#note_123` fragment → ignore the fragment, use only `/issues/{iid}`.

## Cross-links

- Memory: `project_qa_task_structure`
- Skill [[scope-analysis]] — consumes this output
- Skill [[acceptance-criteria-review]] — analyzes the extracted AC

# E2E Test Plan Template

> Template for User Stories and Test Scenarios used by `subagent-spec-test` and `qa-flow`.

## User Story Format

```markdown
## US-[PREFIX]-[NN]: [Descriptive title]

**As** [role/persona],
**I want** [action],
**So that** [benefit].

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Test Scenarios
| ID | Scenario | Priority | Type |
|----|----------|----------|------|
| CT-01 | Description | High/Medium/Low | API/E2E/Hybrid |
```

### Rules for User Stories
- Focus on **user behavior**, not technical implementation
- Include **happy path** AND **error paths**
- Include **permission** scenarios (who can/cannot do)
- Include **state transition** scenarios (when applicable)
- Use `docs/business-rules/` as source of truth

## Test Scenario Format (CT-XX)

```markdown
### CT-[ID]: [Scenario title]

**Type:** API / E2E / Hybrid / DB
**Portal:** Origination / Servicing / Website / AMS
**Pre-condition:** [Required initial state]

**Steps:**
1. [Action 1]
2. [Action 2]
3. [Verification]

**Expected result:**
- API returns [status code] with [message/payload]
- UI displays [element/feedback]
- DB reflects [state change]

**Tags:** @regression @critical
```

### Scenario Categories

| Category | What to cover |
|----------|---------------|
| Happy path | Main successful flow |
| Validation errors | Required fields, invalid formats, boundary values |
| Permissions | 403/401 for unauthorized roles |
| State transitions | `UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → ...` |
| Edge cases | Concurrent access, duplicate data, timeout scenarios |
| Cross-domain | Side effects (e.g., creating an application affects servicing) |

## Test Plan Output Location

| Type | Location |
|------|----------|
| Task tests (GitLab) | `docs/taskTestingUown/{testName}/{testName}.spec.ts` |
| Portal E2E tests | `tests/e2e/{portal}/{feature}.spec.ts` |
| API-only tests | `tests/api/{feature}-api.spec.ts` |
| Relatório de execução | `docs/taskTestingUown/{testName}/{testName}-report.md` |
| Cenários de planejamento | `docs/taskTestingUown/{testName}/{testName}-scenarios.md` |

## Naming Convention (Task Tests)

```
Pattern:   {milestone}_{camelCaseTitle}_{taskNumber}
Example:   R1.49.1_separateShortCodeInANewEntity_469
```

| Component | Rule |
|-----------|------|
| `milestone` | Exact from GitLab (e.g., `R1.49.1`) |
| `camelCaseTitle` | Task title: 1st word lowercase, subsequent capitalized |
| `taskNumber` | GitLab issue iid (numeric) |

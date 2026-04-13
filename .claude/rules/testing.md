---
paths:
  - "tests/**/*.ts"
---

# Test Rules

## Naming Convention (task tests from GitLab issues)

```
Pattern:   {milestone}_{camelCaseTitle}_{taskNumber}
Example:   R1.49.1_separateShortCodeInANewEntity_469
Location:  docs/taskTestingUown/{testName}/{testName}.spec.ts
Project:   task-testing
```

Non-task tests: `tests/e2e/{portal}/` or `tests/api/`

## Mandatory Principles

1. **Independence**: Every test creates its own data — no shared state between tests
2. **DRY**: Reusable logic in helpers or page objects — never duplicate
3. **Own setup**: Tests call API to create preconditions, never rely on existing DB data
4. **Implicit cleanup**: Use unique `runId` + `email` — no manual teardown needed
5. **Tags**: `@smoke`/`@sanity`/`@regression` + `@critical` when applicable — use `TestTag` enum

## Lease State Machine

```
UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

- SSN not ending in 9 → `UW_APPROVED`
- SSN ending in 9 → `UW_DENIED`
- Contract URL: `sendApplication` → `paymentDetailsList[idx].redirectUrl`
- E-sign: auto-detects PandaDocs vs Signwell via iframe polling
- Refund: `FUNDED → REQUEST_REFUND → REFUNDED` (UI only via PayTomorrow portal)

## Risk Tier Selection (when test creates applications)

| Tier | SSN | State | Merchant | Amount | Expected |
|------|-----|-------|----------|--------|----------|
| low | ≠9 | CA, CO, FL | TerraceFinance | $800–$1.500 | FUNDED |
| high (denied) | =9 | any | any | any | UW_DENIED |
| blocked-state | ≠9 | NJ, VT, MN, ME | ONLINE merchant | any | DENIED |

## testData Structure

```typescript
const testData = [{
  env: 'sandbox',
  riskTier: 'low',
  state: 'CA',
  merchant: 'TerraceFinance',
  merchandiseAmount: 1000,
  runId: generateRunId(),
  email: generateUniqueEmail(),
  tag: '@cicd @sandbox',
}];
```

## Anti-Patterns

```
❌ page.waitForTimeout() — use .waitFor({ state: 'visible' }) or db.waitForRecord()
❌ Assertions in page objects — assert in test, return values from page objects
❌ Import from @playwright/test directly — use @support/base-test or @fixtures/test-context.fixture
❌ ctx shared across tests — ctx is per-test only
❌ Relative imports (../../../src/...) — always use path aliases (@support/base-test.js, @config/constants.js, etc.)
❌ body as never casts — use the correct typed builder (buildSendApplicationBody, buildSubmitApplicationBody) instead
```

## Definition of Done

- `tsc --noEmit` passes
- `test.step()` wraps every logical action
- `testData` has `env`, `tag`, `runId`, `email` (see note below)
- Selectors use `SELECTORS` constant
- `ctx` used for cross-step state

## testData — runId and email

The standard `testData` pattern MUST include `runId` and `email` for test isolation:

```typescript
const testData = [{
  env: 'sandbox',
  runId: generateRunId(),
  email: generateUniqueEmail(),
  tag: '@cicd @sandbox',
}];
```

**Exception:** Tests that use `existingAccountPks` (GDS bypass, no new application created) may omit `runId`/`email` since no application data is generated. Document this explicitly in a comment:

```typescript
const testData = [{
  env: 'qa1',
  // GDS bypass: pre-seeded account PKs, no application created → runId/email not needed
  existingAccountPks: ['4442', '4439'],
  tag: '@qa1',
}];
```

Note this as a deviation from the standard pattern in a comment — do not silently omit the fields.

---
paths:
  - "src/helpers/**/*.ts"
---

# Helper Rules

## Worker-Scoped Unique IDs

Always use worker-scoped helpers for parallel-safe unique data:

```typescript
import { uniqueEmail, getWorkerRunId, RUN_ID } from '@helpers/index.js';
```

The real worker-id exports are exactly these three (`src/helpers/worker-id.helper.ts`): there is
**no** `uniqueName` / `generateUniqueEmailAlias` helper — do not import them. They combine
`process.pid` + `TEST_WORKER_INDEX` for uniqueness across parallel workers and terminals.
`uniqueEmail()` derives a unique alias from `RUN_ID` internally; for a unique name build it from
`getWorkerRunId()`. (`generateRunId()` is a separate helper in `@config/constants`, not here.)

## Lock Files (Multi-Terminal Coordination)

When multiple Claude Code terminals edit the same repository, use PID-based locks:

```
.claude/locks/{file_path_with_underscores}.lock
```

Full protocol: orchestrator (CLAUDE.md) coordinates agent invocation

## Payment Arrangement Signatures (CRITICAL — common source of errors)

See skill [[common-operations]] for complete cookbook.

Quick reference — these are the CORRECT signatures:

| Function | Correct | Common Mistake |
|----------|---------|----------------|
| `buildCcArrangementBody` | `(options: object)` | `([...], boolean)` |
| `makeCreditCardPayments` | `(body)` | `(accountPk, body)` |
| `waitForCcTransactionsProcessed` | `(arrangementPk)` | `(accountPk)` |
| `calculateDateISO(0)` | returns `YYYY-MM-DD` | `isoDate()` doesn't exist |
| `driveLeadToFunding` | `(api, merchant, ctx)` | `driveToFundedAndGetAccountPk()` doesn't exist |

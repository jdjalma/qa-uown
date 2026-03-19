---
paths:
  - "src/helpers/**/*.ts"
---

# Helper Rules

## Worker-Scoped Unique IDs

Always use worker-scoped helpers for parallel-safe unique data:

```typescript
import { uniqueEmail, uniqueName, getWorkerRunId, RUN_ID } from '@helpers/index.js';
```

These combine `process.pid` + `TEST_WORKER_INDEX` for uniqueness across parallel workers and terminals.
`generateRunId()` and `generateUniqueEmailAlias()` already use `RUN_ID` internally.

## Lock Files (Multi-Terminal Coordination)

When multiple Claude Code terminals edit the same repository, use PID-based locks:

```
.claude/locks/{file_path_with_underscores}.lock
```

Full protocol: `.claude/context/shared/agent-coordination.md`

## Payment Arrangement Signatures (CRITICAL — common source of errors)

See `.claude/context/shared/common-operations.md` for complete cookbook.

Quick reference — these are the CORRECT signatures:

| Function | Correct | Common Mistake |
|----------|---------|----------------|
| `buildCcArrangementBody` | `(options: object)` | `([...], boolean)` |
| `makeCreditCardPayments` | `(body)` | `(accountPk, body)` |
| `waitForCcTransactionsProcessed` | `(arrangementPk)` | `(accountPk)` |
| `calculateDateISO(0)` | returns `YYYY-MM-DD` | `isoDate()` doesn't exist |
| `driveLeadToFunding` | `(api, merchant, ctx)` | `driveToFundedAndGetAccountPk()` doesn't exist |

<!-- PT-BR: Decisão de usar polling com backoff exponencial para validações de banco de dados. -->

# ADR-006: Polling with Exponential Backoff for DB Validations

## Status
Accepted

## Date
2025-02-01

## Context
Many UOWN platform operations are asynchronous: lead status changes via backend processing, scheduled jobs update tables, payments are processed in the background. Tests need to wait for these states without using fixed `setTimeout` (slow and flaky).

Options considered:
- **Fixed `setTimeout`**: simple, but either waits too long (slow) or too little (flaky)
- **Retry with fixed interval**: better, but overloads the DB with frequent queries
- **Polling with exponential backoff**: starts fast, slows down progressively — balances speed and load

## Decision
Implement polling with exponential backoff in `DatabaseHelpers`:

```typescript
await db.pollUntil(
  async () => {
    const result = await db.query('SELECT ... WHERE pk = $1', [pk]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },
  { timeout: 30_000, interval: 100, maxInterval: 2_000 }
);
```

Default parameters:
- **initial interval**: 100ms (fast response for instantaneous operations)
- **maxInterval**: 2s (cap to avoid long waits between polls)
- **total timeout**: 30s (declared failure if not resolved)

Absolute rule: **never** use generic `setTimeout` to wait for database data.

## Consequences

**Positive:**
- Fast tests when data is available immediately
- No DB overload (interval grows)
- Clear timeout — fast failure vs infinite waiting
- Parameterized queries mandatory (security)

**Negative:**
- More complex than simple setTimeout
- Requires managed connection pool

**Mitigations:**
- `DatabaseHelpers` encapsulates all complexity
- Pool managed centrally — agents never create standalone pools
- `subagent-impl-db-validation` agent generates correct code

## References
- `src/helpers/database.helpers.ts`
- ADR-007 (PostgreSQL via pg)

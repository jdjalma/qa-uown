<!-- PT-BR: Decisão de usar pg (node-postgres) com connection pool para validações de banco. -->

# ADR-007: PostgreSQL via pg with Connection Pool

## Status
Accepted

## Date
2025-02-01

## Context
Tests need to validate database state (lead statuses, accounts, payments). The UOWN platform uses PostgreSQL in all environments. The connection needs to support multiple environments (sandbox, qa1, qa2, stg) with different credentials.

Options considered:
- **ORM (Prisma, TypeORM)**: high-level abstraction, but unnecessary overhead for simple validation queries
- **pg (node-postgres) directly**: lightweight, native connection pool, parameterized queries
- **Knex.js**: query builder, but intermediate abstraction without clear benefit

## Decision
Use **`pg`** (node-postgres) with connection pool managed by `DatabaseHelpers`:

- Pool created once per environment via `db` fixture
- JDBC URLs auto-converted to node-pg format
- Credentials via variables: `UOWN_DB_URL_{SUFFIX}`, `UOWN_DB_USER_{SUFFIX}`, `UOWN_DB_PASS_{SUFFIX}`
- Queries always parameterized (`$1`, `$2`)

## Consequences

**Positive:**
- Lightweight (no ORM overhead)
- Connection pool reused between steps
- Native support for parameterized queries (SQL injection prevention)
- Compatible with all environments via variable suffix

**Negative:**
- Raw SQL — no schema validation at compile time
- Manual pool lifecycle management

**Mitigations:**
- `DatabaseHelpers` encapsulates pool lifecycle
- `db` fixture ensures cleanup on teardown
- ADR-006 (polling with backoff) ensures correct usage

## References
- `src/helpers/database.helpers.ts`
- `src/config/environment.ts`
- ADR-006 (polling with backoff)

# Security Rules

> No `paths:` — these rules load in every session.

## Credentials

- Store in `.env` (gitignored) — never commit
- API keys go in `.env`, passed via `BaseClient` headers — never in logs or test output
- Never write to: `**/.env`, `**/*.pem`, `node_modules/**`

## Database

- `SELECT` (read-only) is always allowed
- `INSERT`, `UPDATE`, `DELETE` require **explicit user authorization** before executing
- Use `db.getSingleRow()`, `db.waitForRecord()` for validation — not raw mutations

## Secrets in Code

- If a credential appears in generated code, flag it immediately and remove
- Test card numbers are pre-defined constants (see `src/config/constants.ts`) — safe to use

<!-- PT-BR: Ambientes suportados, variáveis de ambiente, configuração de DB e scripts disponíveis. -->

# Environments and Configuration

## Supported Environments

| Environment | URL Pattern | DB Suffix |
|-------------|-------------|-----------|
| `sandbox` (default) | `*-sandbox.uownleasing.com` | `SBX` |
| `qa1` | `*-qa1.uownleasing.com` | `QA1` |
| `qa2` | `*-qa2.uownleasing.com` | `QA2` |
| `stg` | `*-stg.uownleasing.com` | `STG` |
| `dev1`-`dev3` | `*-dev{n}.uownleasing.com` | — |

## Environment Variables

- `.env` for secrets (gitignored), `.env.example` as template
- Overrides: `.env.sandbox`, `.env.qa1`, etc.
- Credentials: `{ROLE}_USERNAME`, `{ROLE}_PASSWORD` (admin, manager, readonly, merchant, supervisor, agent)
- DB: `UOWN_DB_URL_{SUFFIX}`, `UOWN_DB_USER_{SUFFIX}`, `UOWN_DB_PASS_{SUFFIX}`
- CI: `CI=true` → headless, 1 retry, screenshots only-on-failure

## Scripts

```
test                    → npx playwright test
test:origination        → --project=origination-ui
test:servicing          → --project=servicing-ui
test:website            → --project=website-ui
test:ams                → --project=ams-ui
test:api                → --project=api-only
test:cicd               → --grep @cicd
test:website:all-devices → [ui + firefox + webkit + ios + android + tablet]
lint                    → tsc --noEmit
report                  → npx playwright show-report reports/html
```

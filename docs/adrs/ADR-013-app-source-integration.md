<!-- PT-BR: Decisão de integrar código-fonte das aplicações no pipeline de agentes para consulta durante geração de SPEC e validação. -->

# ADR-013: Application Source Code Integration in Agent Pipeline

## Status
Accepted

## Date
2026-03-04

## Context
The fintech-playwright agents generate test SPECs and validate results using internal documentation (business rules, Postman collection, DB schema). However, they did **not** automatically consult the source code of the 14 application repositories that live as sibling directories under `projects./`.

This led to:
- SPECs generated without verifying actual endpoint implementations
- Validation results not cross-referenced against Flyway migrations or entity classes
- Agents unaware of new enums, constants, or configuration changes in the application
- DB validation queries written without consulting the actual migration SQL

## Decision
Integrate the 14 application source repositories into the agent pipeline by:

1. **Cataloging repos** in `.claude/context/app-repos.md` — a context file that maps each repo's type, path, branch, and key directories, plus ready-to-use grep patterns for common search tasks.

2. **Syncing repos** before task analysis — the orchestrator runs `git pull --ff-only` on all 14 repos in Phase 0 (before fetch-task). Failures are logged but do not block the pipeline.

3. **Referencing from agents** — `spec-test`, `validate-results`, `docs-update`, and `impl-db-validation` gain `app-repos.md` as optional context, enabling them to consult source code during their work.

Key design decisions:
- **No new subagent** — `git pull` is too simple to warrant a dedicated agent. It runs inline in the orchestrator.
- **`--ff-only`** — avoids creating merge conflicts. If the local branch has diverged, the pull fails cleanly and the repo stays at its current version.
- **Fail-safe** — failure to sync one repo does not block the pipeline. Agents can read stale repos if needed.
- **Context file, not script** — agents already have Read/Grep/Glob tools. They need a "map" telling them where to look, not a script that runs searches for them.
- **DB schema refresh is conditional** — only when the task involves DB changes (keywords: migration, table, column, entity, flyway).

## Consequences

### Positive
- Agents can verify endpoint implementations against actual controller code
- DB validation queries can be cross-referenced with Flyway migration SQL
- SPECs include source code references, improving accuracy
- Three knowledge sources unified: Postman collection + DB schema + app source code
- Repos stay up-to-date with minimal overhead (fast-forward pull)

### Negative
- Additional time in Phase 0 for git pull across 14 repos (~5-15s)
- Agents may reference code that has changed since the last pull (stale reads)
- Repo availability depends on local clone existence (no auto-clone)

### Mitigations
- `--ff-only` ensures pulls are fast and conflict-free
- Sync failures are non-blocking — logged as warnings
- `app-repos.md` includes fallback guidance (stale is better than no source)

## References
- `.claude/context/app-repos.md` — repository catalog
- ADR-012 (Java/Cucumber migration — references `fintech-qaautomation` repo)
- `docs/UOWN Leasing API Documentation (FULL API).postman_collection.json` — Postman collection
- `docs/database-schema-qa2.md` — DB schema reference

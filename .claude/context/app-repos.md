<!-- PT-BR: Catálogo dos repositórios da aplicação. Usado pelos agentes para consultar código-fonte durante geração de SPEC e validação de resultados. -->

# Application Source Repositories

The UOWN Leasing platform source code lives under `projects/uown/` (sibling `uown/` directory next to this `qa-uown/` repo). Agents can read these repos to cross-reference endpoint implementations, DB migrations, frontend components, and business logic.

> **Branches/paths verificados em 2026-06-23 nesta máquina.** Branch é volátil — confirme com `git -C ../uown/<repo> rev-parse --abbrev-ref HEAD` antes de citar.

## Repository Catalog

| Repo | Type | Branch | Relative Path | Key Directories |
|------|------|--------|---------------|-----------------|
| **svc** | Java/Spring backend | R1.53.0 | `../uown/svc/` | `rest/`, `service/`, `db/`, `migration/`, `dto/`, `enumeration/` |
| **origination** | Node.js frontend | R1.51.1 | `../uown/origination/` | `pages/`, `components/`, `hooks/`, `domain/`, `enums/` |
| **servicing** | Node.js frontend | R1.50.2 | `../uown/servicing/` | `pages/`, `components/`, `api/`, `domain/`, `enums/` |
| **ams** | Java/Spring | master | `../uown/ams/` | `src/main/java/com/uownleasing/ams/` |
| **uwengine** | Java/Spring | master | `../uown/uwengine/` | `src/main/java/com/uownleasing/uwengine/` (service/, db/, enumeration/) |
| **common** | Java shared lib | master | `../uown/common/` | `src/main/java/com/uownleasing/common/` (enumeration/, utils/, db/, service/) |
| **los-common** | Java shared lib | master | `../uown/los-common/` | `src/main/java/com/uownleasing/los/common/` |
| **svc-common** | Java shared lib | master | `../uown/svc-common/` | `src/main/java/com/uownleasing/svc/common/` |
| **configuration** | Config | uown-qa1 | `../uown/configuration/` | Root (FAQ.md, README.md) |
| **website** | Node.js/React | — (não clonado nesta máquina) | `../uown/website/` | `pages/`, `components/`, `api/`, `domain/`, `layout/` |
| **ams-website** | Node.js/React | — (não clonado nesta máquina) | `../uown/ams-website/` | `pages/`, `components/`, `layouts/` |
| **payment-gateway** | Java/Spring | — (não clonado nesta máquina) | `../uown/payment-gateway/` | `src/main/java/com/uownleasing/payment/` |
| **ccverification** | Java/Spring | — (não clonado nesta máquina) | `../uown/ccverification/` | `src/main/java/com/uownleasing/CCVerification/` (service/, db/, enumeration/) |

> **All paths are relative to the qa-uown root.** Use `../uown/svc/` etc. in Grep/Glob/Read tool calls.
>
> **Repos ausentes:** `website`, `ams-website`, `payment-gateway`, `ccverification` **não estão clonados** nesta máquina (nem em `../uown/` nem em `../`). Se precisar deles, clone sob `../uown/` ou trate como indisponível (fallback: Postman collection / business-rules).
>
> **Branches stale em libs compartilhadas:** `common`/`uwengine`/`los-common`/`svc-common` locais estão em `master` — alguns valores R1.53.0 (ex.: `ACHProcessType.DAILY_RERUN_DELINQUENT`, `UWInfo.npmSegment`/`tamScore`) só existem em `origin/R1.53.0`. Leia via `git show origin/R1.53.0:<path>`. Há também checkouts standalone duplicados em `../{ams,common,los-common,svc-common,uwengine}` — prefira os de `../uown/`.

## Search Guide by Task Type

### Endpoint / API behavior

Search the **svc** backend for REST controllers and service logic:

```
# Find controller for an endpoint (e.g., /api/leases)
Grep pattern: @.*Mapping.*leases    path: ../uown/svc/src/main/java/  type: java
Grep pattern: @RequestMapping       path: ../uown/svc/src/main/java/com/uownleasing/svc/rest/  type: java

# Find service implementation
Grep pattern: class.*Service        path: ../uown/svc/src/main/java/com/uownleasing/svc/service/  type: java
```

### Database / Migration / Entity

Search **svc** for Flyway migrations and JPA entities:

```
# Find migration for a table (e.g., payment_arrangement)
Grep pattern: payment_arrangement   path: ../uown/svc/src/main/resources/db/migration/  glob: *.sql

# Find entity class
Grep pattern: @Table.*table_name    path: ../uown/svc/src/main/java/com/uownleasing/svc/db/  type: java
Grep pattern: @Entity               path: ../uown/svc/src/main/java/com/uownleasing/svc/db/  type: java

# Find latest migrations
Glob pattern: ../uown/svc/src/main/resources/db/migration/V2026*.sql
```

### Enumerations / Constants

Search **common**, **svc**, or domain-specific repos:

```
# Find enum definition (e.g., LeadStatus)
Grep pattern: enum LeadStatus       path: ../uown/common/src/main/java/  type: java
Grep pattern: enum LeadStatus       path: ../uown/svc/src/main/java/  type: java

# Find constants
Grep pattern: static final.*CONSTANT_NAME  path: ../uown/svc/  type: java
```

### Underwriting / Credit Check

Search **uwengine** and **ccverification**:

```
# UW rules and decision logic
Grep pattern: class.*Service        path: ../uown/uwengine/src/main/java/com/uownleasing/uwengine/service/  type: java

# CC verification logic (ccverification ausente — ver nota acima)
Grep pattern: class.*Service        path: ../uown/ccverification/src/main/java/com/uownleasing/CCVerification/service/  type: java
```

### Payment Gateway

Search **payment-gateway** (ausente — ver nota acima):

```
Grep pattern: @.*Mapping            path: ../uown/payment-gateway/src/main/java/  type: java
Grep pattern: class.*Service        path: ../uown/payment-gateway/src/main/java/  type: java
```

### Frontend Components (UI behavior)

Search the portal-specific frontend repo:

```
# Origination portal UI
Grep pattern: ComponentName         path: ../uown/origination/components/  glob: *.{js,jsx,ts,tsx}
Grep pattern: export.*function      path: ../uown/origination/pages/  glob: *.{js,jsx,ts,tsx}

# Servicing portal UI
Grep pattern: ComponentName         path: ../uown/servicing/components/  glob: *.{js,jsx,ts,tsx}

# Website (consumer-facing — ausente, ver nota acima)
Grep pattern: ComponentName         path: ../uown/website/components/  glob: *.{js,jsx,ts,tsx}

# AMS portal (ams-website ausente, ver nota acima)
Grep pattern: ComponentName         path: ../uown/ams-website/components/  glob: *.{js,jsx,ts,tsx}
```

### Configuration / Feature Flags

```
Grep pattern: feature_flag_name     path: ../uown/configuration/
Grep pattern: FEATURE_              path: ../uown/svc/src/main/java/com/uownleasing/svc/config/  type: java
```

## Cross-Reference Sources

| Source | Path | Complements |
|--------|------|-------------|
| **Postman collection** | `docs/UOWN Leasing API Documentation (FULL API).postman_collection.json` | Endpoint contracts → verify against svc controllers |
| **DB schema doc** | `docs/database-schema.md` | Table structure → verify against Flyway migrations in svc |
| **Business rules** | `docs/business-rules/` | Business logic → verify against service implementations |
| **Appendix C** | `docs/business-rules/appendix-c-tabelas-banco.md` | DB tables → verify against entity classes in svc |

## Sync Protocol

Before any task analysis, the orchestrator runs `git pull --ff-only` on all repos:

```bash
# Executed by orchestrator in Phase 0a (repos clonados sob ../uown/)
for repo in svc origination servicing ams uwengine common los-common svc-common configuration; do
  git -C "../uown/$repo" pull --ff-only 2>&1 || echo "WARN: $repo sync failed (using stale)"
done
# website, ams-website, payment-gateway, ccverification: ausentes nesta máquina (clone sob ../uown/ se necessário)
```

- Uses `--ff-only` to avoid creating merge conflicts
- Failures are logged but do NOT block the pipeline
- Agents read repos as-is if sync fails (stale is better than no source)

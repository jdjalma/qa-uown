<!-- PT-BR: Catálogo dos repositórios da aplicação. Usado pelos agentes para consultar código-fonte durante geração de SPEC e validação de resultados. -->

# Application Source Repositories

The UOWN Leasing platform source code lives in sibling directories under `projects./`. Agents can read these repos to cross-reference endpoint implementations, DB migrations, frontend components, and business logic.

## Repository Catalog

| Repo | Type | Branch | Relative Path | Key Directories |
|------|------|--------|---------------|-----------------|
| **svc** | Java/Spring backend | HEAD (detached) | `../svc/` | `rest/`, `service/`, `db/`, `migration/`, `dto/`, `enumeration/` |
| **origination** | Node.js frontend | R1.49.0 | `../origination/` | `pages/`, `components/`, `hooks/`, `domain/`, `enums/` |
| **servicing** | Node.js frontend | master | `../servicing/` | `pages/`, `components/`, `api/`, `domain/`, `enums/` |
| **website** | Node.js/React | R1.49.0 | `../website/` | `pages/`, `components/`, `api/`, `domain/`, `layout/` |
| **ams** | Java/Spring | master | `../ams/` | `src/main/java/com/uownleasing/ams/` |
| **ams-website** | Node.js/React | master | `../ams-website/` | `pages/`, `components/`, `layouts/` |
| **payment-gateway** | Java/Spring | master | `../payment-gateway/` | `src/main/java/com/uownleasing/payment/` |
| **uwengine** | Java/Spring | R1.49.1 | `../uwengine/` | `src/main/java/com/uownleasing/uwengine/` (service/, db/, enumeration/) |
| **ccverification** | Java/Spring | R1.49.1 | `../ccverification/` | `src/main/java/com/uownleasing/CCVerification/` (service/, db/, enumeration/) |
| **common** | Java shared lib | R1.49.1 | `../common/` | `src/main/java/com/uownleasing/common/` (enumeration/, utils/, db/, service/) |
| **los-common** | Java shared lib | R1.49.1 | `../los-common/` | `src/main/java/com/uownleasing/los/common/` |
| **svc-common** | Java shared lib | R1.49.1 | `../svc-common/` | `src/main/java/com/uownleasing/svc/common/` |
| **configuration** | Config | main | `../configuration/` | Root (FAQ.md, README.md) |
| **fintech-qaautomation** | Legacy Java/Cucumber | dev | `../fintech-qaautomation/` | `src/test/` |

> **All paths are relative to fintech-playwright root.** Use `../svc/` etc. in Grep/Glob/Read tool calls.

## Search Guide by Task Type

### Endpoint / API behavior

Search the **svc** backend for REST controllers and service logic:

```
# Find controller for an endpoint (e.g., /api/leases)
Grep pattern: @.*Mapping.*leases    path: ../svc/src/main/java/  type: java
Grep pattern: @RequestMapping       path: ../svc/src/main/java/com/uownleasing/svc/rest/  type: java

# Find service implementation
Grep pattern: class.*Service        path: ../svc/src/main/java/com/uownleasing/svc/service/  type: java
```

### Database / Migration / Entity

Search **svc** for Flyway migrations and JPA entities:

```
# Find migration for a table (e.g., payment_arrangement)
Grep pattern: payment_arrangement   path: ../svc/src/main/resources/db/migration/  glob: *.sql

# Find entity class
Grep pattern: @Table.*table_name    path: ../svc/src/main/java/com/uownleasing/svc/db/  type: java
Grep pattern: @Entity               path: ../svc/src/main/java/com/uownleasing/svc/db/  type: java

# Find latest migrations
Glob pattern: ../svc/src/main/resources/db/migration/V2026*.sql
```

### Enumerations / Constants

Search **common**, **svc**, or domain-specific repos:

```
# Find enum definition (e.g., LeadStatus)
Grep pattern: enum LeadStatus       path: ../common/src/main/java/  type: java
Grep pattern: enum LeadStatus       path: ../svc/src/main/java/  type: java

# Find constants
Grep pattern: static final.*CONSTANT_NAME  path: ../svc/  type: java
```

### Underwriting / Credit Check

Search **uwengine** and **ccverification**:

```
# UW rules and decision logic
Grep pattern: class.*Service        path: ../uwengine/src/main/java/com/uownleasing/uwengine/service/  type: java

# CC verification logic
Grep pattern: class.*Service        path: ../ccverification/src/main/java/com/uownleasing/CCVerification/service/  type: java
```

### Payment Gateway

Search **payment-gateway**:

```
Grep pattern: @.*Mapping            path: ../payment-gateway/src/main/java/  type: java
Grep pattern: class.*Service        path: ../payment-gateway/src/main/java/  type: java
```

### Frontend Components (UI behavior)

Search the portal-specific frontend repo:

```
# Origination portal UI
Grep pattern: ComponentName         path: ../origination/components/  glob: *.{js,jsx,ts,tsx}
Grep pattern: export.*function      path: ../origination/pages/  glob: *.{js,jsx,ts,tsx}

# Servicing portal UI
Grep pattern: ComponentName         path: ../servicing/components/  glob: *.{js,jsx,ts,tsx}

# Website (consumer-facing)
Grep pattern: ComponentName         path: ../website/components/  glob: *.{js,jsx,ts,tsx}

# AMS portal
Grep pattern: ComponentName         path: ../ams-website/components/  glob: *.{js,jsx,ts,tsx}
```

### Legacy Java Tests

Compare with existing Java/Cucumber tests:

```
Grep pattern: Scenario.*flow_name   path: ../fintech-qaautomation/src/test/  glob: *.feature
Grep pattern: @Given.*step_name     path: ../fintech-qaautomation/src/test/  type: java
```

### Configuration / Feature Flags

```
Grep pattern: feature_flag_name     path: ../configuration/
Grep pattern: FEATURE_              path: ../svc/src/main/java/com/uownleasing/svc/config/  type: java
```

## Cross-Reference Sources

| Source | Path | Complements |
|--------|------|-------------|
| **Postman collection** | `docs/UOWN Leasing API Documentation (FULL API).postman_collection.json` | Endpoint contracts → verify against svc controllers |
| **DB schema doc** | `docs/database-schema-qa2.md` | Table structure → verify against Flyway migrations in svc |
| **Business rules** | `docs/business-rules/` | Business logic → verify against service implementations |
| **Appendix C** | `docs/business-rules/appendix-c-tabelas-banco.md` | DB tables → verify against entity classes in svc |

## Sync Protocol

Before any task analysis, the orchestrator runs `git pull --ff-only` on all repos:

```bash
# Executed by orchestrator in Phase 0a
for repo in svc origination servicing website ams ams-website payment-gateway uwengine ccverification common los-common svc-common configuration fintech-qaautomation; do
  git -C "../$repo" pull --ff-only 2>&1 || echo "WARN: $repo sync failed (using stale)"
done
```

- Uses `--ff-only` to avoid creating merge conflicts
- Failures are logged but do NOT block the pipeline
- Agents read repos as-is if sync fails (stale is better than no source)

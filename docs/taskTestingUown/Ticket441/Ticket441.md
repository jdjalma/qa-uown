---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/441

UOWN | SVC | Configuration of Flyway DB in SVC project
Aberto
  Tíquete criado 1 semana atrás por Marcus Braga
Description
Configure Flyway in the SVC project to manage database index scripts during deployment.

Background
The project currently uses Hibernate with ddl-auto: update for schema management. Flyway is not configured. Indexes are defined in JPA entities (@index), but there is no versioned migration system for index creation and management.

Objective
Set up Flyway to handle database index migrations in a controlled, versioned way during deployment.

Steps-to-Reproduce
Deploy the application to the QA environment.
Verify that the migration V20260126050514__test_flyway_baseline_validation.sql was executed successfully.
Check the flyway_schema_history table in the QA database:
Query: SELECT * FROM flyway_schema_history WHERE script = 'V20260126050514__test_flyway_baseline_validation.sql';
Expected result: The migration should appear in the table with:

version: 20260126050514
description: test flyway baseline validation
type: SQL
installed_on: Timestamp of when the migration was executed
Expected Behavior:

The migration runs automatically on application startup

The migration creates a temporary test table, inserts a validation record, and drops the table (no permanent schema changes)

The migration is recorded in flyway_schema_history table

Note: This is a validation migration that confirms Flyway is working correctly with the baseline configuration. It does not make any permanent changes to the database schema.

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

## **UOWN | SVC | Configuração do Flyway DB no projeto SVC**

**Status:** Aberto
**Criado por:** Marcus Braga
**Criado há:** 1 semana

---

### **Descrição**

Configurar o **Flyway** no projeto **SVC** para gerenciar scripts de banco de dados (especialmente índices) de forma versionada e controlada durante o processo de deploy.

---

### **Contexto**

Atualmente, o projeto utiliza **Hibernate** com a configuração `ddl-auto: update` para gerenciamento de schema.
O **Flyway não estava configurado**, e embora existam índices definidos nas entidades JPA (via `@Index`), **não havia um sistema de migração versionado** para criação e manutenção desses índices no banco de dados.

Isso gera risco em deploys, falta de rastreabilidade e inconsistência entre ambientes.

---

### **Objetivo**

Configurar o **Flyway** para:

* Gerenciar migrações de banco de dados de forma **versionada**
* Garantir execução **automática** das migrações no startup da aplicação
* Permitir controle seguro de alterações estruturais (ex.: índices)
* Operar em conjunto com o Hibernate configurado apenas para **validação de schema**

---

### **Passos para Reprodução / Validação**

1. Realizar o deploy da aplicação no ambiente **QA**
2. Verificar se a migration de validação
   `V20260126050514__test_flyway_baseline_validation.sql`
   foi executada com sucesso
3. Consultar a tabela de histórico do Flyway no banco de dados QA:

```sql
SELECT *
FROM flyway_schema_history
WHERE script = 'V20260126050514__test_flyway_baseline_validation.sql';
```

---

### **Resultado Esperado**

A migration deve aparecer registrada na tabela `flyway_schema_history` com os seguintes dados:

* **version:** `20260126050514`
* **description:** `test flyway baseline validation`
* **type:** `SQL`
* **installed_on:** timestamp correspondente ao momento do deploy

---

### **Comportamento Esperado**

* A migration é executada **automaticamente no startup da aplicação**
* A migration:

  * cria uma tabela temporária de teste
  * insere um registro de validação
  * remove a tabela em seguida
* **Nenhuma alteração permanente** é feita no schema do banco
* A execução da migration é registrada corretamente na tabela `flyway_schema_history`

---

### **Observação**

Esta migration tem finalidade **exclusivamente de validação**, servindo para confirmar que o **Flyway está corretamente configurado**, incluindo o uso de **baseline** e validação de versões.

Ela **não realiza alterações permanentes** no banco de dados e não impacta o schema final da aplicação.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 5 arquivos
+
91
−
4
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

src/main/
‎resources‎

con
‎fig‎

applica
‎tion.yml‎
+14 -1

db/mig
‎ration‎

V20260126050514__test_flyw
‎ay_baseline_validation.sql‎
+26 -0

.giti
‎gnore‎
+1 -1

Make
‎file‎
+49 -2

build.
‎gradle‎
+1 -0

 src/main/resources/config/application.yml 
+
14
−
1

Visualizado
@@ -136,11 +136,24 @@ spring:
        session_factory:
          interceptor: com.uownleasing.svc.config.hibernate.HibernateInterceptor
    hibernate:
      ddl-auto: update
      ddl-auto: validate
      naming:
        physical-strategy: com.uownleasing.svc.config.hibernate.SvcNamingStrategy
    #show-sql: true

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 1
    validate-on-migrate: true
    clean-disabled: true
    schemas: public
    table: flyway_schema_history
    sql-migration-prefix: V
    sql-migration-separator: __
    sql-migration-suffixes: .sql

  main:
    allow-bean-definition-overriding: true
  output:
 src/main/resources/db/migration/V20260126050514__test_flyway_baseline_validation.sql  0 → 100644
+
26
−
0

Visualizado
-- =====================================================
-- Flyway Migration: V20260126050514__test_flyway_baseline_validation.sql
-- Created: 2026-01-26 05:05:14 PST/PDT
-- Description: Test migration to validate Flyway baseline-version configuration
-- This is a safe, idempotent migration that validates Flyway is working correctly
-- with baseline-version: 1. It performs a simple DDL operation and then cleans up,
-- leaving no permanent changes in the database.
-- =====================================================

-- Test migration: Create a temporary test table, insert a record, then drop it
-- This operation is completely safe and leaves no traces in the database
-- If this executes successfully, it confirms Flyway has proper permissions
-- Flyway executes all statements in a transaction, so if any fails, everything rolls back

DROP TABLE IF EXISTS flyway_test_temp_validation;

CREATE TABLE flyway_test_temp_validation (
    test_id INTEGER PRIMARY KEY,
    test_message VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO flyway_test_temp_validation (test_id, test_message)
VALUES (1, 'Flyway baseline validation test - Migration executed successfully');

DROP TABLE flyway_test_temp_validation;
 .gitignore 
+
1
−
1

Visualizado
@@ -137,4 +137,4 @@ charts/*/charts
charts/*/Chart.lock


.history/
 Makefile 
+
49
−
2

Visualizado
.PHONY: up clean app stack stackd docker-build down app-down services servicesd services-down postgres stack-postgres
.PHONY: up clean app stack stackd docker-build down app-down services servicesd services-down postgres stack-postgres new-migration

LOCAL_REPOSITORY = airblackbox
APP_NAME = svc
CHARTS_DIRECTORY := charts/${APP_NAME}
PREVIEW_DIRECTORY := charts/preview
OS := $(shell uname)
ifeq ($(OS),Windows_NT)
  DETECTED_OS := Windows
else
  DETECTED_OS := $(shell uname 2>/dev/null || echo Unknown)
endif
OS := $(DETECTED_OS)
ENVIRONMENT ?= local-preview

export APP_BOOT_WAIT=0
@@ -178,3 +183,45 @@ destroy:
	@echo "| ACTION:  destroying applications"
	@echo "-----------------------------------------"
	@cd ${PREVIEW_DIRECTORY} && helmfile --environment ${ENVIRONMENT} destroy

#####################
# FLYWAY MIGRATIONS #
#####################

# Create a new Flyway migration file with PST/PDT timestamp
# Usage: make new-migration [MIGRATION_NAME="migration_name"]
# Example: make new-migration MIGRATION_NAME="add_column_email_t_users"
# The file will be created in src/main/resources/db/migration/V{timestamp}__{name}.sql
MIGRATION_NAME ?=
new-migration:
ifeq ($(OS),Darwin)
	@$(MAKE) _create-migration-unix
else ifeq ($(OS),Linux)
	@$(MAKE) _create-migration-unix
else ifeq ($(OS),Windows)
	@echo "Creating new migration with PST/PDT timestamp (Windows)..."
	@powershell -NoProfile -ExecutionPolicy Bypass -Command "$$migrationDir = 'src/main/resources/db/migration'; if (-not (Test-Path $$migrationDir)) { New-Item -ItemType Directory -Path $$migrationDir -Force | Out-Null }; $$tz = [TimeZoneInfo]::FindSystemTimeZoneById('Pacific Standard Time'); $$now = [TimeZoneInfo]::ConvertTimeFromUtc([DateTime]::UtcNow, $$tz); $$timestamp = $$now.ToString('yyyyMMddHHmmss'); $$migrationName = '$(MIGRATION_NAME)'; if ($$migrationName -eq '') { $$migrationFileName = 'V' + $$timestamp + '__{Migration_Name}.sql' } else { $$migrationFileName = 'V' + $$timestamp + '__' + $$migrationName + '.sql' }; $$migrationFile = Join-Path $$migrationDir $$migrationFileName; $$header1 = '-- ====================================================='; $$header2 = '-- Flyway Migration: ' + $$migrationFileName; $$header3 = '-- Created: ' + $$now.ToString('yyyy-MM-dd HH:mm:ss PST/PDT'); $$header4 = '-- Description: '; $$header5 = '-- ====================================================='; $$header6 = ''; $$header7 = '-- Add your SQL changes here'; $$lines = @($$header1, $$header2, $$header3, $$header4, $$header5, $$header6, $$header7); Set-Content -Path $$migrationFile -Value $$lines; Write-Host ('Migration created: ' + $$migrationFile)"
else
	@echo "Unsupported OS: $(OS). Please use Windows, Darwin, or Linux."
	@exit 1
endif

_create-migration-unix:
	@echo "Creating new migration with PST/PDT timestamp..."
	@mkdir -p src/main/resources/db/migration; \
	TIMESTAMP=$$(TZ=America/Los_Angeles date +%Y%m%d%H%M%S); \
	if [ -z "$(MIGRATION_NAME)" ]; then \
		MIGRATION_FILE="src/main/resources/db/migration/V$$TIMESTAMP__{Migration_Name}.sql"; \
		MIGRATION_NAME_DISPLAY="V$$TIMESTAMP__{Migration_Name}.sql"; \
	else \
		MIGRATION_FILE="src/main/resources/db/migration/V$$TIMESTAMP__$(MIGRATION_NAME).sql"; \
		MIGRATION_NAME_DISPLAY="V$$TIMESTAMP__$(MIGRATION_NAME).sql"; \
	fi; \
	echo "-- =====================================================" > $$MIGRATION_FILE; \
	echo "-- Flyway Migration: $$MIGRATION_NAME_DISPLAY" >> $$MIGRATION_FILE; \
	echo "-- Created: $$(TZ=America/Los_Angeles date)" >> $$MIGRATION_FILE; \
	echo "-- Description: " >> $$MIGRATION_FILE; \
	echo "-- =====================================================" >> $$MIGRATION_FILE; \
	echo "" >> $$MIGRATION_FILE; \
	echo "-- Add your SQL changes here" >> $$MIGRATION_FILE; \
	echo "Migration created: $$MIGRATION_FILE"

---------------------------------------------------------------------------------------------------------------------------------------------------------

---
Foi executada a **pipeline mais recente da MR `[R1.49.0_FlywaySetup → R1.49.0]`**, com deploy bem-sucedido no ambiente **QA (`uown-qa2`)**.

**Evidências do deploy:**

* Pipeline ID: `2288953515`
* Versão implantada do serviço: `1.49.0-4dd9cb18`
* Deploy realizado via ArgoCD, com aplicação `svc` sincronizada e saudável no namespace `uown-qa2`
* Job finalizado com status **Succeeded**

**Validação do Flyway:**

* O Flyway foi executado automaticamente no startup da aplicação (nenhuma execução manual necessária).
* A migration de validação foi aplicada com sucesso e registrada corretamente no banco.

Query executada no banco QA:

```sql
SELECT *
FROM flyway_schema_history
WHERE script = 'V20260126050514__test_flyway_baseline_validation.sql';
```

**Resultado obtido:**

* `version`: `20260126050514`
* `description`: `test flyway baseline validation`
* `type`: `SQL`
* `installed_on`: `2026-01-29 19:39:25`
* `execution_time`: `47 ms`
* `success`: `true`
* `checksum`: `1126699942`

A migration foi aplicada apenas para validação do funcionamento do Flyway (criação e remoção de estrutura temporária), **sem impacto permanente no schema**, conforme esperado.

**Conclusão:**
✔️ Flyway está corretamente configurado
✔️ Migrations são executadas automaticamente no startup
✔️ Baseline e validação funcionando corretamente
✔️ Hibernate operando apenas em modo `validate`

---

---------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in qa2


---
### Scenario: Flyway baseline validation on application startup
```markdown
- Given the SVC application is deployed to the QA environment
- And Flyway is enabled with baseline and validation configuration
- When the application starts
- Then the Flyway migration V20260126050514__test_flyway_baseline_validation.sql must be executed
- And the migration must be recorded in the flyway_schema_history table
- And no permanent schema changes must remain in the database
```

Screenshot

**PASS**

---

Foi executada a **pipeline mais recente da MR `[R1.49.0_FlywaySetup → R1.49.0]`**, com deploy realizado com sucesso no ambiente **QA (`uown-qa2`)**.

**Evidências do deploy:**

* Pipeline ID: `2288953515`
* Versão implantada do serviço: `1.49.0-4dd9cb18`
* Deploy realizado via **ArgoCD**, com a aplicação **svc** sincronizada e saudável no namespace `uown-qa2`
* Job de deploy finalizado com status **Succeeded**

**Validação do Flyway:**

* O **Flyway foi executado automaticamente no startup da aplicação**, sem necessidade de execução manual.
* A migration de validação foi aplicada com sucesso e registrada corretamente no banco de dados.

Query executada no banco QA:

```sql
SELECT *
FROM flyway_schema_history
WHERE script = 'V20260126050514__test_flyway_baseline_validation.sql';
```

**Resultado obtido:**

* `version`: `20260126050514`
* `description`: `test flyway baseline validation`
* `type`: `SQL`
* `installed_on`: `2026-01-29 19:39:25`
* `execution_time`: `47 ms`
* `success`: `true`
* `checksum`: `1126699942`

A migration foi aplicada **exclusivamente para validação do funcionamento do Flyway**, realizando a criação e remoção de estrutura temporária, **sem qualquer impacto permanente no schema do banco**, conforme esperado.

---------------------------------------------------------------------------------------------------------------------------------------------------------

````markdown
## Tests in qa2


---
### Scenario: Flyway baseline validation on application startup
```markdown
- Given the SVC application is deployed to the QA environment
- And Flyway is enabled with baseline and validation configuration
- When the application starts
- Then the Flyway migration V20260126050514__test_flyway_baseline_validation.sql must be executed
- And the migration must be recorded in the flyway_schema_history table
- And no permanent schema changes must remain in the database
````

Screenshot

**PASS**

---

The **latest pipeline from the MR `[R1.49.0_FlywaySetup → R1.49.0]`** was executed, with a successful deployment to the **QA environment (`uown-qa2`)**.

**Deployment evidence:**

* Pipeline ID: `2288953515`
* Deployed service version: `1.49.0-4dd9cb18`
* Deployment performed via **ArgoCD**, with the **svc** application synced and healthy in the `uown-qa2` namespace
* Deployment job finished with status **Succeeded**

**Flyway validation:**

* **Flyway was executed automatically on application startup**, with no manual execution required.
* The validation migration was successfully applied and correctly recorded in the database.

Query executed on the QA database:

```sql
SELECT *
FROM flyway_schema_history
WHERE script = 'V20260126050514__test_flyway_baseline_validation.sql';
```

**Observed result:**

* `version`: `20260126050514`
* `description`: `test flyway baseline validation`
* `type`: `SQL`
* `installed_on`: `2026-01-29 19:39:25`
* `execution_time`: `47 ms`
* `success`: `true`
* `checksum`: `1126699942`

The migration was applied **exclusively to validate Flyway’s functionality**, performing the creation and removal of a temporary structure, **with no permanent impact on the database schema**, as expected.

```
::contentReference[oaicite:0]{index=0}
```


---------------------------------------------------------------------------------------------------------------------------------------------------------

SELECT 
fsh.installed_rank ,fsh.version,fsh.description,fsh.type,fsh.script,fsh.installed_on ,fsh.execution_time ,fsh.success ,fsh.checksum ,
fsh.*
FROM flyway_schema_history fsh
WHERE script = 'V20260126050514__test_flyway_baseline_validation.sql';
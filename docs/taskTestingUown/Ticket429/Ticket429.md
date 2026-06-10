---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/429

UOWN | SVC | Download and store all Lease Agreements for Kornerstone accounts

Synopsis
Create a process to download ALL Lease Agreements for Kornerstone Accounts and store them in our system, at the account level.
Any additional required information (such as technical details, specific flows, or credentials) will be provided directly to the responsible developer soon.

Feature Request | Business Requirements
1. Download Lease Agreements
The system must download all Lease Agreements associated with Kornerstone Accounts.
2. Store on our side
Lease Agreements must be stored internally, linked directly to the account.
Storage must occur at the account level.

---------------------------------------------------------------------------------------------------------------------------------------------------------

---

**UOWN | SVC | Download e armazenamento de todos os Contratos de Locação para contas Kornerstone**

### **Sinopse**

Criar um processo para baixar **TODOS** os Contratos de Locação (Lease Agreements) das contas Kornerstone e armazená-los em nosso sistema, no nível da conta.
Quaisquer informações adicionais necessárias (como detalhes técnicos, fluxos específicos ou credenciais) serão fornecidas diretamente ao desenvolvedor responsável em breve.

### **Solicitação de Funcionalidade | Requisitos de Negócio**

**1. Download dos Contratos de Locação**
O sistema deve realizar o download de todos os Contratos de Locação associados às contas Kornerstone.

**2. Armazenamento interno**
Os Contratos de Locação devem ser armazenados internamente, vinculados diretamente à conta.
O armazenamento deve ocorrer no nível da conta.

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 5 arquivos
+
137
−
43
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

src/main/java/com/uownleasi
‎ng/svc/migration/kornerstone‎

re
‎st‎

MigrationCon
‎troller.java‎
+10 -17

ser
‎vice‎

LeaseDocsMigrat
‎ionService.java‎
+106 -7

RtrClie
‎nt.java‎
+2 -2

swe
‎eps‎

DailyImportSwe
‎epService.java‎
+18 -16

KSLease
‎Doc.java‎
+1 -1

 src/main/java/com/uownleasing/svc/migration/kornerstone/rest/MigrationController.java 
+
10
−
17

Visualizado
package com.uownleasing.svc.migration.kornerstone.rest;


import com.uownleasing.svc.migration.kornerstone.KSLeaseDoc;
import com.uownleasing.svc.migration.kornerstone.service.LeaseDocsMigrationService;
import com.uownleasing.svc.migration.kornerstone.service.LogsMigrationService;
import com.uownleasing.svc.migration.kornerstone.service.MigrationService;
@@ -10,8 +9,6 @@ import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController()
@RequestMapping(value = "/migration/kornerstone", produces = MediaType.APPLICATION_JSON_VALUE)
@@ -24,25 +21,23 @@ public class MigrationController {

    private final LeaseDocsMigrationService leaseDocsMigrationService;


    /**
     * Import basic contract data from Kornerstone.
     */
    @PostMapping("/import/contracts")
    public ResponseEntity<String> importBasicDataForContracts(@RequestBody ContractImportRequest request) {
         migrationService.importBasicDataForContractsAsync(request.contractIds());
         return ResponseEntity.accepted().body("Import started");
        migrationService.importBasicDataForContractsAsync(request.contractIds());
        return ResponseEntity.accepted().body("Import started");
    }


   @GetMapping({"/loadSqls", "/loadSqls/{sqlName}"})
    @GetMapping({"/loadSqls", "/loadSqls/{sqlName}"})
    public void loadsqls(@PathVariable(required = false) String sqlName) {
         migrationService.loadSqls(sqlName);
        migrationService.loadSqls(sqlName);
    }

    @PostMapping("/getLogs")
    public void getLogs(@RequestBody ContractImportRequest request) {
         logsMigrationService.processLogsAndNotify(request.contractIds());
        logsMigrationService.processLogsAndNotify(request.contractIds());
    }

    @GetMapping("/loadfrom/{env}")
@@ -50,13 +45,11 @@ public class MigrationController {
        migrationService.loadFromDB(env);
    }

    @PostMapping("/getLeaseDocs")
    public Map<String, KSLeaseDoc> getLeaseDocs(@RequestBody ContractImportRequest request) {
        return leaseDocsMigrationService.getLeaseDocs(request.contractIds());
    @PostMapping("/import/leaseDocs")
    public void importLeaseDocs(@RequestBody ContractImportRequest request) {
        leaseDocsMigrationService.processLeaseDocsAndNotify(request.contractIds());
    }


    public record ContractImportRequest(String contractIds) {}


    public record ContractImportRequest(String contractIds) {
    }
}
 src/main/java/com/uownleasing/svc/migration/kornerstone/service/LeaseDocsMigrationService.java 
+
106
−
7

Visualizado
package com.uownleasing.svc.migration.kornerstone.service;

import com.uownleasing.common.service.ConfigurationManagementService;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.service.AccountService;
import com.uownleasing.svc.migration.kornerstone.KSLeaseDoc;
import com.uownleasing.svc.migration.kornerstone.KSLog;
import com.uownleasing.svc.service.DocumentService;
import com.uownleasing.svc.service.ScheduledTaskHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeaseDocsMigrationService {
    private final AccountService accountService;
    private final DocumentService documentService;
    private final ConfigurationManagementService configurationManagementService;
    private final ScheduledTaskHelper scheduledTaskHelper;

    private final String CONFIG_PATH = "com.uownleasing.svc.migration.kornerstone.service.LeaseDocsMigrationService.";
    private final String LOG_PREFIX = "[LeaseDocsMigrationService][getLeaseDocs]";
    private static final String CONFIG_PATH = "com.uownleasing.svc.migration.kornerstone.service.LeaseDocsMigrationService.";
    private static final String LOG_PREFIX = "[LeaseDocsMigrationService][getLeaseDocs]";

    private final RtrClient rtrClient;

    @Async
    public void processLeaseDocsAndNotify(String contractIds) {
        LocalDateTime startTime = LocalDateTime.now();

    //@Async
    public Map<String, KSLeaseDoc> getLeaseDocs(String contractIds) {
        Map<String, KSLeaseDoc> leaseDocsForContractIds = rtrClient.getLeaseDocsForContractIds(contractIds);
        return leaseDocsForContractIds;
        // Load dynamic configuration
        int threadCount = configurationManagementService.getInteger(CONFIG_PATH + "thread.count", 10);
        int accountBatchSize = configurationManagementService.getInteger(CONFIG_PATH + "account.batch.size", 50);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        try {
            int totalProcessed = 0;
            List<String> contractIdList = Arrays.stream(contractIds.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
            log.info("{} Starting lease contract document import: totalContracts={}, batchSize={}, maxThreads={}", LOG_PREFIX, contractIdList.size(), accountBatchSize, threadCount);

            for (int i = 0; i < contractIdList.size(); i += accountBatchSize) {
                if (isStopRequested()) {
                    log.info(LOG_PREFIX + " Stop requested, halting import at account batch starting index: {}", i);
                    break;
                }
                List<String> batchIds = contractIdList.subList(i, Math.min(i + accountBatchSize, contractIdList.size()));
                Map<String, KSLeaseDoc> leaseDocsForContractIds = rtrClient.getLeaseDocsForContractIds(String.join(",", batchIds));
                List<CompletableFuture<Void>> futures = batchIds.stream()
                    .map(contractId -> CompletableFuture.runAsync(() -> importLeaseContractDoc(contractId, leaseDocsForContractIds.get(contractId)), executor))
                    .toList();

                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

                // Update cumulative total
                totalProcessed += batchIds.size();

                // Log batch-level completion
                log.info(LOG_PREFIX + " Completed processing batch starting at index {} with {} accounts.", i, batchIds.size());

                // Log cumulative progress every logInterval accounts
                if (totalProcessed % 1000 == 0 || totalProcessed == contractIdList.size()) {
                    log.info(LOG_PREFIX + " Total processed so far: {} / {}", totalProcessed, contractIdList.size());
                }
            }

            double mins = Duration.between(startTime, LocalDateTime.now()).toMillis() / 60000.0;

            scheduledTaskHelper.sendSweepCorrespondence(
                "IMPORT LEASE CONTRACT DOCUMENTS RESULTS" + (isStopRequested() ? " – Stop Requested" : ""),
                String.format("Lease contract documents imported successfully for %d accounts. Time Taken: %.2f min",
                    contractIdList.size(), mins),
                null,
                null
            );

            log.info("{} IMPORT LEASE CONTRACT DOCUMENTS DONE", LOG_PREFIX);
        } catch (Exception e) {
            log.error(LOG_PREFIX + " Failed to process lease contract documents", e);
        } finally {
            executor.shutdown();
            try {
                if (!executor.awaitTermination(30, TimeUnit.MINUTES)) {
                    log.warn(LOG_PREFIX + " Executor did not terminate in time, forcing shutdown");
                    executor.shutdownNow();
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
        }
    }

    private void importLeaseContractDoc(String contractId, KSLeaseDoc leaseDoc) {
        try {
            if (isStopRequested() || leaseDoc == null) {
                log.debug("{} import lease contract document process halted for {}", LOG_PREFIX, contractId);
                return;
            }
            SvAccount svAccount = accountService.getKSImportedAccountByRefID(Long.valueOf(contractId));
            if (svAccount == null) {
                log.debug("{} accountPk:{} not found, import lease contract document process halted", LOG_PREFIX, contractId);
                return;
            }
            var doc = leaseDoc.toStoredDocInfo(svAccount.getAccountInfo().getAccountPk(), svAccount.getAccountInfo().getMerchantPk());
            log.debug("{} import lease contract document successfully uploaded {}", LOG_PREFIX, doc.getFilePath());
            documentService.uploadFile(doc);
        } catch (Exception e) {
            log.error(LOG_PREFIX + " Error processing account {}", contractId, e);
        }
    }

    private boolean isStopRequested() {
        return configurationManagementService.getBoolean(CONFIG_PATH + "stop.lease.import", false);
    }
}

---------------------------------------------------------------------------------------------------------------------------------------------------------


curl --location 'https://svc-{{env}}.uownleasing.com/migration/kornerstone/import/leaseDocs' \
--header 'Content-Type: application/json' \
--header 'Authorization: knQ9MeLBQhxl3gKnOszKq7ZaRxaHY23G2iddtlH2' \
--data '{
    "contractIds": "12345,67890,11223"
}'

---

## 1️⃣ Regras de dados (pré-condições obrigatórias)

Para que a importação funcione corretamente, **os contratos devem mapear para contas que atendam TODAS as condições abaixo na tabela `uown_sv_account`:**

### 📌 Tabela: `uown_sv_account`

| Campo            | Regra                                            |
| ---------------- | ------------------------------------------------ |
| `ref_account_id` | Deve ser usado como referência para a importação |
| `lead_pk`        | Deve ser **igual a 1**                           |
| `company`        | Deve ser **`kornerstone`**                       |

⚠️ Se qualquer uma dessas regras não for atendida:

* O documento **não será importado**
* O endpoint ainda pode retornar **200**
* Nenhum registro será criado

---

## 2️⃣ Regra de volume – comportamento diferente acima de 50 registros

### Até 50 registros

* Fluxo simples
* Processamento direto (assíncrono)
* Sem batch engine

### Acima de 50 registros

* **Fluxo obrigatório via batch**
* Código e estratégia de execução são diferentes
* Processamento ocorre fora do request HTTP

📌 **Regra de validação obrigatória**:

> Para validar corretamente o comportamento de batch, **devem ser importados pelo menos 100 registros**.

Importações com menos de 50 **não validam o comportamento real esperado para produção**.

---

## 3️⃣ Cenário obrigatório – body vazio

### Importação sem `contractIds`

```json
{}
```

ou

```json
{
  "contractIds": ""
}
```

Comportamento esperado:

* Nenhuma importação realizada
* Nenhum documento criado
* Nenhum erro não tratado
* Endpoint pode retornar 200 (request aceito)

Esse cenário é **esperado e válido**.

---

## 4️⃣ Onde os documentos são armazenados (storage)

### 🗂️ Bucket

```
uown-documents
```

### 📁 Estrutura do path

```
KORNERSTONE/
  SVC/
    <accountPk>/
      <fileName>
```

### Path completo (regra técnica)

```java
"KORNERSTONE" + "/" +
SystemSource.SVC + "/" +
storedDocDetails.getAccountPk() + "/" +
storedDocDetails.getFileName()
```

📌 **Validação importante**:

* O `accountPk` deve corresponder à conta importada
* O **nome do arquivo no path** deve ser validado
* O prefixo **KORNERSTONE/SVC** é obrigatório

---

## 5️⃣ Onde o registro da importação é persistido

### 📌 Tabela de auditoria / evidência

```
uown_stored_doc
```

### Query de validação

```sql
select *
from uown_stored_doc usd
order by usd.pk desc;
```

O que validar nessa tabela:

* Novo registro criado após a execução
* `account_pk` correto
* Nome do arquivo compatível com o path no bucket
* Data/hora de criação coerente com a execução

⚠️ Importante:

* **Não existe tabela de “importação”**
* O sucesso é evidenciado **apenas pelo registro do documento**

---

## 6️⃣ Como validar corretamente uma execução (checklist)

### ✅ Pré-validação

* Existem ≥ 100 registros válidos
* Todos atendem:

  * `lead_pk = 1`
  * `company = 'kornerstone'`
  * `ref_account_id` válido

### ▶️ Execução

* Chamar o endpoint `/import/leaseDocs`
* Aguardar processamento (batch)

### 🔎 Pós-validação

1. Verificar logs do batch
2. Verificar registros em `uown_stored_doc`
3. Validar path no bucket `uown-documents`
4. Conferir nome do arquivo no path
5. Confirmar associação correta ao `accountPk`

---

## 7️⃣ Conclusão objetiva

* ✔️ O comportamento muda **obrigatoriamente** acima de 50 registros
* ✔️ “BET” mencionado pelo dev refere-se a **batch**
* ✔️ Evidência de sucesso:

  * `uown_stored_doc`
  * arquivo no bucket
* ❌ O HTTP 200 **não garante importação**
* ❌ Não existe status de importação dedicado

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in qa2


---
### Cenário 1 – Disparo da importação com payload válido
```markdown
- Given que o endpoint `/migration/kornerstone/import/leaseDocs` está disponível
- And o payload contém `contractIds` válidos
- When a requisição POST é enviada
- Then o endpoint deve retornar HTTP 200
- And o processamento deve ser iniciado de forma assíncrona
- And o body da resposta não deve conter status de importação

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 2 – Importação com body vazio ou contractIds vazio
```markdown
- Given que a requisição é enviada sem `contractIds` ou com valor vazio
- When o endpoint é acionado
- Then nenhuma importação deve ser executada
- And nenhum erro não tratado deve ocorrer
- And nenhum registro deve ser gerado em `uown_stored_doc`
- And nenhum documento deve ser importado

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 3 – Importação com conta válida
```markdown
**Given** que existe registro em `uown_sv_account`
**And** `ref_account_id` corresponde ao contractId
**And** `lead_pk = 1`
**And** `company = 'kornerstone'`
**When** o Lease Agreement é processado
**Then** o documento deve ser importado com sucesso
**And** deve ser gerado registro em `uown_stored_doc`

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 4 – Conta inválida para importação (Scenario Outline)
```markdown
Scenario Outline: Conta inválida para importação de Lease Agreement
  Given que o contrato existe na Kornerstone
  And a conta associada apresenta a condição "<condicao_conta>"
  When o processamento de importação é executado
  Then o documento não deve ser importado
  And nenhum registro deve ser criado em uown_stored_doc

Examples:
  | condicao_conta                   |
  | conta inexistente no sistema     |
  | lead_pk diferente de 1           |
  | company diferente de kornerstone |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 5 – Importação acima de 50 registros via batch (Scenario Outline)
```markdown
Scenario Outline: Importação de Lease Agreements via batch acima de 50 registros
  Given que a importação contém <quantidade> contractIds válidos
  And todas as contas atendem às regras de dados
  When o endpoint /migration/kornerstone/import/leaseDocs é acionado
  Then o processamento deve ocorrer via batch
  And o processamento deve ocorrer fora do ciclo do request HTTP
  And todos os registros válidos devem ser processados

Examples:
  | quantidade |
  | 65         |
  | 100        |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 6 – Validação do path e nome do arquivo armazenado
```markdown
**Given** que o documento foi armazenado
**When** o path no banco de dados é verificado
**Then** o path deve seguir o padrão:`KORNERSTONE/SVC/<accountPk>/<fileName>`
**And** o nome do arquivo deve corresponder ao Lease Agreement retornado pela Kornerstone

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 7 – Registro criado em uown_stored_doc
```markdown
**Given** que o documento foi importado com sucesso
**When** a tabela `uown_stored_doc` é consultada
**Then** deve existir um novo registro
**And** o campo `account_pk` deve corresponder à conta processada

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 8 – Nenhum registro persistido em falha de importação
```markdown
**Given** que a importação não atende às regras de dados ou não possui documento
**When** o processamento é executado
**Then** nenhum registro deve ser criado em `uown_stored_doc`

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Cenário 9 – Erro durante upload de documento
```markdown
**Given** que ocorre erro durante `documentService.uploadFile`
**When** o erro acontece para um contrato específico
**Then** o erro deve ser registrado em log
**And** o processamento dos demais contratos deve continuar
**And** não deve ser criado registro em `uown_stored_doc` para esse contrato

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---
### Scenario Outline 10: Importação de Lease Agreement para contas Kornerstone com diferentes status
```markdown
- Given que o contrato existe na Kornerstone
- And existe registro correspondente em uown_sv_account
- And o ref_account_id corresponde ao contractId
- And o lead_pk é igual a 1
- And a company é igual a "kornerstone"
- And o status da conta é "<status_conta>"
- When o processamento de importação do Lease Agreement é executado
- Then o documento deve ser importado com sucesso
- And deve ser gerado registro em uown_stored_doc
- And o registro deve estar associado ao account_pk da conta

Examples:
  | status_conta           |
  | ACTIVE                 |
  | PAID_OUT               |
  | PAID_OUT_EARLY         |
  | PAID_OUT_EARLY_EPO     |
  | CHARGED_OFF            |
  | CLOSED                 |
  | CANCELLED              |
  | SOLD                   |
  | SETTLED_IN_FULL        |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screeshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in QA2

---
### Scenario 1 – Import trigger with valid payload
```markdown
- Given the `/migration/kornerstone/import/leaseDocs` endpoint is available
- And the payload contains valid `contractIds`
- When the POST request is sent
- Then the endpoint must return HTTP 200
- And the processing must be started asynchronously
- And the response body must not contain import status information

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 2 – Import with empty body or empty contractIds
```markdown
- Given the request is sent without `contractIds` or with an empty value
- When the endpoint is triggered
- Then no import must be executed
- And no unhandled error must occur
- And no record must be created in `uown_stored_doc`
- And no document must be imported

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 3 – Import with a valid account
```markdown
- Given a record exists in `uown_sv_account`
- And `ref_account_id` matches the contractId
- And `lead_pk = 1`
- And `company = 'kornerstone'`
- When the Lease Agreement is processed
- Then the document must be successfully imported
- And a record must be created in `uown_stored_doc`

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 4 – Invalid account for import (Scenario Outline)
```markdown
Scenario Outline: Invalid account for Lease Agreement import
  Given the contract exists in Kornerstone
  And the associated account meets the condition "<account_condition>"
  When the import processing is executed
  Then the document must not be imported
  And no record must be created in uown_stored_doc

Examples:
  | account_condition              |
  | account does not exist         |
  | lead_pk different from 1       |
  | company different from kornerstone |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 5 – Import above 50 records via batch (Scenario Outline)
```markdown
Scenario Outline: Lease Agreements import via batch above 50 records
  Given the import contains <quantity> valid contractIds
  And all accounts meet the data rules
  When the /migration/kornerstone/import/leaseDocs endpoint is triggered
  Then the processing must occur via batch
  And the processing must occur outside the HTTP request lifecycle
  And all valid records must be processed

Examples:
  | quantity |
  | 65       |
  | 100      |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 6 – Validation of stored file path and file name
```markdown
- Given the document has been stored
- When the database path is verified
- Then the path must follow the pattern: `KORNERSTONE/SVC/<accountPk>/<fileName>`
- And the file name must match the Lease Agreement returned by Kornerstone

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 7 – Record created in uown_stored_doc
```markdown
- Given the document was successfully imported
- When the `uown_stored_doc` table is queried
- Then a new record must exist
- And the `account_pk` field must match the processed account

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 8 – No record persisted on import failure
```markdown
- Given the import does not meet data rules or has no document
- When the processing is executed
- Then no record must be created in `uown_stored_doc`

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario 9 – Error during document upload
```markdown
- Given an error occurs during `documentService.uploadFile`
- When the error happens for a specific contract
- Then the error must be logged
- And the processing of other contracts must continue
- And no record must be created in `uown_stored_doc` for that contract

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---
### Scenario Outline 10 – Lease Agreement import for Kornerstone accounts with different statuses
```markdown
- Given the contract exists in Kornerstone
- And a corresponding record exists in uown_sv_account
- And the ref_account_id matches the contractId
- And the lead_pk equals 1
- And the company equals "kornerstone"
- And the account status is "<account_status>"
- When the Lease Agreement import processing is executed
- Then the document must be successfully imported
- And a record must be created in uown_stored_doc
- And the record must be associated with the account's account_pk

Examples:
  | account_status       |
  | ACTIVE               |
  | PAID_OUT             |
  | PAID_OUT_EARLY       |
  | PAID_OUT_EARLY_EPO   |
  | CHARGED_OFF          |
  | CLOSED               |
  | CANCELLED            |
  | SOLD                 |
  | SETTLED_IN_FULL      |

|    Data    | Value |
|------------|-------|
| LeadPk     |       |
| AccountPk  |       |
```

Screenshot

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------





--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/433

Abaixo está a **entrega da tarefa em Português e em Inglês**, estruturada de forma objetiva, focada em comportamento e validação, adequada para QA, DEV e stakeholders.

---

## 🇧🇷 **PORTUGUÊS — Entrega da Tarefa**

### **Título**

UOWN | SVC | Investigar e Melhorar rerunCCPayments

### **Contexto**

O processo **rerunCCPayments** é executado diariamente e, ao final, deve gerar um relatório. Desde **01/01/2026**, foi identificado que o relatório não está sendo gerado, mesmo com a execução do sweep ocorrendo sem falhas aparentes. É necessário investigar a causa raiz e corrigir o problema, garantindo a geração correta do relatório.

---

### **Objetivo**

Garantir que:

* O sweep **rerunCCPayments** seja executado com segurança e robustez.
* O relatório seja gerado corretamente após a conclusão do sweep.
* Nenhuma exceção silenciosa impeça a geração do relatório.
* Logs e métricas de execução estejam consistentes.

---

### **Escopo da Correção**

* Investigação da causa raiz da falha na geração do relatório.
* Melhoria da defensividade do serviço `rerunCCPayments`.
* Garantia de execução completa do sweep, independentemente de volume de dados.
* Manutenção do comportamento funcional já existente.
* Correção aplicada no backend (SVC).

---

### **Critérios de Aceite**

#### 1. Execução do Sweep

* O sweep pode ser acionado via endpoint REST.
* Logs indicam início e término da execução.
* A duração da execução é registrada.
* Nenhuma exceção não tratada ocorre durante o processo.
* Transações encontradas são processadas corretamente.
* A execução do sweep não bloqueia a geração do relatório.

#### 2. Geração do Relatório

* O relatório pode ser obtido via endpoint REST.
* Logs confirmam a criação e conclusão do relatório.
* Nenhum timeout ou erro ocorre durante a geração.
* O relatório é enviado por e-mail aos destinatários configurados.
* O arquivo Excel contém:

  * Dados (quando existentes)
  * Cabeçalhos corretos
  * Nome no padrão esperado

---

### **Passos de Teste**

#### Teste 1 — Execução do Sweep

**Via REST**

```
POST https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/rerunCCPaymentsSweep
```

**Validar:**

* Logs de início e fim do sweep.
* Ausência de exceções.
* Registro de duração.
* Processamento correto de transações.
* Confirmação de que o relatório foi disparado após o sweep.

---

#### Teste 2 — Geração do Relatório

**Via REST**

```
GET /uown/rerunCCPaymentsReport
```

**Validar:**

* Logs de criação e sucesso do relatório.
* Recebimento de e-mail com:

  * Assunto correto
  * Anexo no formato `.xlsx`
* Conteúdo válido no Excel.

---

### **Observações**

* Problemas de timeout e volume de dados não podem ser totalmente reproduzidos fora de produção.
* O foco do QA deve ser validar estabilidade, consistência de logs e preservação do comportamento funcional.
* Monitorar atentamente logs após a refatoração.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

## 🇺🇸 **ENGLISH — Task Delivery**

### **Title**

UOWN | SVC | Investigate and Improve rerunCCPayments

### **Context**

The **rerunCCPayments** sweep runs daily and is expected to generate a report upon completion. Since **01/01/2026**, the report has not been generated, even though the sweep execution appears to complete without visible errors. The root cause must be identified and fixed to ensure reliable report generation.

---

### **Objective**

Ensure that:

* The **rerunCCPayments** sweep runs safely and reliably.
* The report is generated successfully after the sweep completes.
* No silent exceptions prevent report creation.
* Execution logs and metrics are consistent and reliable.

---

### **Scope of Fix**

* Root cause investigation of the missing report.
* Improved defensiveness in the `rerunCCPayments` service.
* Guaranteed full sweep execution regardless of data volume.
* Preservation of existing functional behavior.
* Backend (SVC)–level fix.

---

### **Acceptance Criteria**

#### 1. Sweep Execution

* The sweep can be triggered via REST endpoint.
* Logs indicate sweep start and completion.
* Execution duration is logged.
* No unhandled exceptions occur.
* Transactions are processed correctly when present.
* Sweep execution does not block report generation.

#### 2. Report Generation

* The report can be retrieved via REST endpoint.
* Logs confirm report creation and successful completion.
* No timeouts or exceptions occur.
* The report email is sent to configured recipients.
* The Excel report includes:

  * Data (when applicable)
  * Correct column headers
  * Expected file naming format

---

### **Testing Steps**

#### Test 1 — Sweep Execution

**Via REST**

```
POST https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/runCCPaymentsSweep
```

**Validate:**

* Sweep start and completion logs.
* No exceptions.
* Execution duration logged.
* Correct transaction handling.
* Confirmation that the report is triggered after the sweep.

---

#### Test 2 — Report Generation

**Via REST**

```
GET /uown/rerunCCPaymentsReport
```

**Validate:**

* Logs indicating report creation and success.
* Email received with:

  * Correct subject
  * `.xlsx` attachment
* Valid Excel content.

---

### **Notes**

* Original timeout and connection issues cannot be fully reproduced outside production due to data volume differences.
* QA focus should be on execution stability, log consistency, and functional parity.
* Monitor logs closely for any new issues introduced by refactoring.

---



--------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 4 arquivos
+
298
−
125
Arquivos
4
Pesquisar (por exemplo, *.vue) (F)

src/main/java/co
‎m/uownleasing/svc‎

quartz
‎/tasks‎

QuartzT
‎ask.java‎
+4 -1

re
‎st‎

testContr
‎oller.java‎
+3 -1

ser
‎vice‎

sweeps/pay
‎mentSweeps‎

RerunCCPaymentsS
‎weepService.java‎
+290 -0

ScheduledTas
‎kService.java‎
+1 -123

 src/main/java/com/uownleasing/svc/quartz/tasks/QuartzTask.java 
+
4
−
1

Visualizado
@@ -12,6 +12,7 @@ import com.uownleasing.svc.service.reportsweeps.GenerateMerchantLeaseReport;
import com.uownleasing.svc.service.sweeps.paymentSweeps.DailyTaxCloudPaymentsSync;
import com.uownleasing.svc.service.sweeps.paymentSweeps.DailyTaxCloudRefundsSync;
import com.uownleasing.svc.service.sweeps.paymentSweeps.DelinquencyRerunCCPaymentsSweepService;
import com.uownleasing.svc.service.sweeps.paymentSweeps.RerunCCPaymentsSweepService;
import com.uownleasing.svc.service.utilitysweeps.CheckLeadExpirationSweepService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.DisallowConcurrentExecution;
@@ -45,6 +46,8 @@ public class QuartzTask extends QuartzJobBean {
    @Autowired
    private DelinquencyRerunCCPaymentsSweepService delinquencyRerunCCPaymentsSweepService;
    @Autowired
    private RerunCCPaymentsSweepService rerunCCPaymentsSweepService;
    @Autowired
    private CCIdempotentService ccIdempotentService;
    @Autowired
    private CCDailyScheduledDeniedRerun ccDailyScheduledDeniedRerun;
@@ -79,7 +82,7 @@ public class QuartzTask extends QuartzJobBean {
            case "rerunACHPaymentsSweep": taskService.rerunACHPayments(); break;
            case "updateContractStatusSweep": taskService.updateContractStatusSweep(); break;
            case "updateTaxRatesSweep": taskService.updateTaxRatesSweep(); break;
            case "rerunCCPaymentsSweep": taskService.rerunCCPayments(); break;
            case "rerunCCPaymentsSweep": rerunCCPaymentsSweepService.run(); break;
            case "delinquencyRerunCCPaymentsSweep": delinquencyRerunCCPaymentsSweepService.run("delinquencyRerunCCPaymentsSweep"); break;
            case "dailyDelinquencyRerunCCSweep": delinquencyRerunCCPaymentsSweepService.run("dailyDelinquencyRerunCCSweep"); break;
            case "delinquencyOfferEmailSweep": taskService.delinquencyOfferEmailSweep(); break;
 src/main/java/com/uownleasing/svc/rest/testController.java 
+
3
−
1

Visualizado
@@ -5,6 +5,7 @@ import com.uownleasing.dms.common.db.entity.EmailQueue;
import com.uownleasing.svc.common.service.EmailService;
import com.uownleasing.svc.pojo.rest.FundingQueueDetails;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.sweeps.paymentSweeps.RerunCCPaymentsSweepService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
@@ -17,6 +18,7 @@ import java.util.List;
public class testController {

    private final ScheduledTaskService scheduledTaskService;
    private final RerunCCPaymentsSweepService rerunCCPaymentsSweepService;

    private final ApplicationService applicationService;

@@ -82,7 +84,7 @@ public class testController {

    @GetMapping(value="/rerunCCPaymentsReport")
    public void rerunCCPaymentsReport(){
        scheduledTaskService.generateReRunCCPaymentsReports();
        rerunCCPaymentsSweepService.generateReport();
    }

}

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

---

- The sweep must complete its execution after being manually triggered.
- Isolated processing failures must not interrupt the overall execution.
- The sweep execution must not block or prevent report generation.
- It must be possible to manually generate the **rerunCCPayments** report via the `/uown/rerunCCPaymentsReport` endpoint.
- The report must be generated in Excel (`.xlsx`) format.
- The file must follow the expected naming convention defined in the task:
  **`Rerun_CC_YYYY-MM-DD.xlsx`**.

![Screenshot_at_Jan_12_01-29-26](/uploads/3847ee92ce9e59ae5f26c1415507ed45/Screenshot_at_Jan_12_01-29-26.png){width=900 height=307}

![Screenshot_at_Jan_12_04-24-51](/uploads/03173c5767c985fb7ded0a69a95f4796/Screenshot_at_Jan_12_04-24-51.png){width=900 height=129}

![Screenshot_at_Jan_12_01-30-54](/uploads/91a313a6fbc0a9e08dd6f8d0222cbe5d/Screenshot_at_Jan_12_01-30-54.png){width=900 height=265}

![Screenshot_at_Jan_12_01-33-33](/uploads/624691380e75b1f5c3c2178cb29e04f4/Screenshot_at_Jan_12_01-33-33.png){width=900 height=49}

![Screenshot_at_Jan_12_04-36-51](/uploads/d41f1b2230e2a10c5f50e490986cb539/Screenshot_at_Jan_12_04-36-51.png){width=179 height=42}

![image](/uploads/802545821d8b6e091d80834a2fd5fdfd/image.png){width=774 height=345}

**| PASS |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in stg

---

- The sweep must complete its execution after being manually triggered.
- Isolated processing failures must not interrupt the overall execution.
- The sweep execution must not block or prevent report generation.
- It must be possible to manually generate the **rerunCCPayments** report via the `/uown/rerunCCPaymentsReport` endpoint.
- The report must be generated in Excel (`.xlsx`) format.
- The file must follow the expected naming convention defined in the task:
  **`Rerun_CC_YYYY-MM-DD.xlsx`**.



**| PASS |**

---

https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/rerunCCPaymentsSweep
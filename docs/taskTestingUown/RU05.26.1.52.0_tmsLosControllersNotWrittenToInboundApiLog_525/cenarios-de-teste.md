# Tests in qa1

**Conta utilizada:** 4524

---

## Resultado geral

✅ **Correção validada e funcionando.** Os 3 pontos do `## FIX` da tarefa foram exercitados em qa1:

- Controllers modernos `rest.tms.`* (`TmsAccountController` / `TmsPaymentController` / `TmsDueDateController`) — registros confirmados em `uown_sv_inbound_api_log` 
- Correção do prefixo `TMS-` (comparação por FQCN) — verificada nas anotações de atividade da conta, tanto para o controller legado quanto para os novos
- Extensão do pointcut LOS com `LosExternalMerchantController` — os **5 endpoints** servidos por esse controller foram chamados e cada um gerou registro em `uown_los_inbound_api_log`

---

## Cenários executados

### Endpoints do sistema TMS 


| Cenário    | O que foi testado                                                                                                | Resultado                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **CT-01**  | Chamada ao endpoint de consulta de saldo (`getPayoffAmount`)                                                     | ✅ Registro criado corretamente |
| **CT-02**  | Chamada ao endpoint **novo** de resumo de conta (`/v1/accounts/{id}/summary`)                                    | ✅ Registro criado              |
| **CT-03a** | Chamada ao endpoint novo do **módulo de Pagamentos** (`TmsPaymentController` — `/payment-methods/bank-accounts`) | ✅ Registro criado              |
| **CT-03b** | Chamada ao endpoint novo do **módulo de Alteração de Vencimento** (`TmsDueDateController` — `/activity-logs`)    | ✅ Registro criado              |


---

### Endpoints do `LosExternalMerchantController` 


| Cenário    | Endpoint                         | O que foi testado                                                   | Resultado         |
| ---------- | -------------------------------- | ------------------------------------------------------------------- | ----------------- |
| **CT-04a** | `POST` Send application          | Submissão de aplicação de crédito do cliente para underwriting Uown | ✅ Registro criado |
| **CT-04b** | `POST` Settle application (      | Finalização (settle) de aplicação previamente aprovada              | ✅ Registro criado |
| **CT-04c** | `POST` Search application status | Consulta de status de aplicação                                     | ✅ Registro criado |
| **CT-04d** | `POST` Send invoice              | Envio de invoice associada a uma aplicação                          | ✅ Registro criado |
| **CT-04e** | `POST` Add lease                 | Criação de lease vinculado a uma aplicação aprovada                 | ✅ Registro criado |


---

### Sem regressão (endpoints já existentes continuam funcionando)


| Cenário   | O que foi testado                                                                                                  | Resultado                  |
| --------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| **CT-05** | Endpoint já existente do sistema LOS (`canContinueApplication`) continua gerando exatamente 1 registro por chamada | ✅ Comportamento preservado |
| **CT-08** | Mesma verificação acima, em variação separada para confirmar ausência de duplicação                                | ✅ Sem duplicação           |


---

### Identidade do agente (prefixo `TMS-`)


| Cenário    | O que foi testado                                                                                                         | Resultado                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **CT-10a** | Quando uma chamada ao endpoint novo do TMS cria uma anotação na conta, o nome do agente é registrado com o prefixo `TMS-` | ✅ Prefixo aparece nas anotações geradas |
| **CT-10b** | Mesma verificação para o endpoint legado do TMS                                                                           | ✅ Prefixo aparece corretamente          |
| **CT-10c** | Verificação inversa: chamadas feitas por outros canais (que **não** são TMS) **não devem** receber o prefixo `TMS-`       | ✅ Comportamento correto                 |


---


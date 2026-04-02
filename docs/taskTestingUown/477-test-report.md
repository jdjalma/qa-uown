# Relatório de Teste: RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477

## Informações da Tarefa

| Campo | Valor |
|-------|-------|
| **Titulo** | UOWN \| SVC \| New TireAgent Flow (return 16-month) and (second look) |
| **URL GitLab** | https://gitlab.com/uown/backend/svc/-/work_items/477 |
| **Milestone** | RU03.26.1.50.0 |
| **Labels** | dev::backend, priority::high, type::development, workflow::qa-in-process |
| **Pipeline** | new-api |

## Descricao

O TireAgent chama a API `sendApplication` com invoice (sem dados bancarios). A requisicao e encaminhada ao GDS que executa o modelo de decisao. Se o GDS determina que o consumidor e elegivel para um "second look", a resposta retorna `is_eligible_for_extra_info = true`. O backend entao adiciona `isEligibleForExtraInfo` na resposta e, quando `true`, retorna `paymentOptionsList` para um plano de 16 meses (approval amount = invoice amount).

## Execucao do Teste

| Campo | Valor |
|-------|-------|
| **Arquivo de Teste** | `tests/taskTestingUown/Tasks/RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477/RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477.spec.ts` |
| **Ambiente** | sandbox (execucao 1) + qa1 (execucao 2 + testes manuais) |
| **Projeto Playwright** | task-testing |
| **Data de Execucao** | 2026-03-23 |
| **Duracao** | ~6s (CT-01 falha no primeiro assert apos resposta) |
| **Resultado** | 1 falhou / 2 nao executaram / 3 skipped |
| **Video** | N/A (API-only) |
| **Trace** | N/A (API-only) |

## Evidencias (Dados Utilizados/Criados)

| Tipo | PK | Papel no Teste | Criado/Existente |
|------|----|----------------|:----------------:|
| Lead | leadPk=95697 | Aplicacao negada sandbox — SSN 100000053 sem bank data | Criado |
| Lead | leadPk=11132 | Aplicacao negada qa1 (manual) — SSN 100000053 sem bank data | Criado |
| Lead | leadPk=11131 | Aplicacao negada qa1 (manual) — SSN 100000053 sem bank data | Criado |
| Lead | leadPk=11130 | Aplicacao negada qa1 (manual) — SSN 100000053 sem bank data | Criado |
| Lead | leadPk=11129 | Aplicacao negada qa1 (manual) — SSN 100000053 sem bank data | Criado |
| Lead | leadPk=11128 | Aplicacao negada qa1 (manual) — SSN 100000053 sem bank data | Criado |
| Merchant | pk=566 | Tire Agent (OW90218-0001), client_type=TIRE_AGENT | Existente |
| Program | pk=207 | KW-16-1, term_months=16, LTO | Existente |
| Program | pk=208 | KW-16-2, term_months=16, LTO | Existente |
| Program | pk=213 | KWC-2, term_months=16, LTO | Existente |

> Sem capturas de tela — teste API-only.

## Cenarios

### Cenario: Cenario 1 — CT-01

**O que e feito:** Chama `POST /uown/los/sendApplication` no sandbox (`svc-sandbox.uownleasing.com`) com merchant TireAgent (OW90218-0001), SSN `100000053`, `orderTotal=1000.00`, sem `mainBankAccountNumber` / `mainBankRoutingNumber`.

**O que acontece:** O SVC encaminha ao GDS (DataView360, campaign 137). O GDS retorna `decision=REJECT`, `isEligibleForExtraInfo=false`, `creditLimit=0`. O SVC repassa na resposta `appApprovalStatus=DECLINED`, `isEligibleForExtraInfo=false`, `paymentDetailsList=[]`.

**O que e verificado:**
- HTTP 200 — PASSOU
- `appApprovalStatus=DECLINED` — PASSOU
- `isEligibleForExtraInfo=true` — **FALHOU** (recebido: `false`)
- `paymentDetailsList` com entrada `termInMonths=16` — NAO EXECUTADO (dependia do assert anterior)

| Campo | Esperado | Recebido (sandbox) | Recebido (qa1) |
|-------|----------|-------------------|----------------|
| `appApprovalStatus` | DECLINED | DECLINED | DECLINED |
| `isEligibleForExtraInfo` | true | **false** | **false** |
| `paymentDetailsList` | [...16m preview] | `[]` | `[]` |
| `transactionMessage` | — | Denied due to address mismatch | Application denied (UW) |
| `authorizationNumber` | leadPk | 95697 | 11132 |

> **Causa raiz do "Denied due to address mismatch" (sandbox):** O CEP `90001` e classificado como **high-risk** pelo modelo do GDS. Aplicacoes com esse CEP sao negadas automaticamente **SEM** `isEligibleForExtraInfo=true`. Informacao confirmada pelo dev responsavel: *"Please don't use this zip 90001, it's a high risk one so it's just denied without eligible for extra info"*. O teste foi corrigido para usar CEP `90015`.
>
> **Status do GDS (atualizado):** O dev confirmou que o time do GDS esta configurando o modelo para retornar `isEligibleForExtraInfo=true`: *"it's on GDS. Checking with him"*.

#### Como verificar manualmente

1. Enviar `POST https://svc-qa1.uownleasing.com/uown/los/sendApplication` com header `Authorization: knQ9MeL...` e body contendo `userName=tireAgent`, `merchantNumber=OW90218-0001`, `mainSSN=100000053`, `orderTotal=1000.00`, sem campos de bank data
2. Verificar na resposta: `isEligibleForExtraInfo` deve ser `true` (atualmente retorna `false`)
3. Consultar DB: `SELECT decided_by_agent, campaign_id, is_eligible_for_extra_info FROM uown_los_uwdata WHERE lead_pk = {leadPk}`

**FALHOU**

> Falha: `isEligibleForExtraInfo` retorna `false` em ambos os ambientes (sandbox e qa1). O modelo do GDS (DataView360, campaign 137) nao esta configurado para retornar `is_eligible_for_extra_info=true` para o SSN 100000053. Nenhum lead em todo o qa1 possui `is_eligible_for_extra_info=true` (9416 null + 237 false = 0 true).

---

### Cenario: Cenario 2 — CT-02

**O que e feito:** Consulta `uown_los_uwdata` para o lead negado do CT-01, verificando os campos `is_eligible_for_extra_info` e `eligible_terms`.

**O que acontece:** Nao executado — depende do CT-01 (serial mode).

**O que e verificado:**
- `is_eligible_for_extra_info = true` no banco — NAO EXECUTADO
- `eligible_terms = NULL` — NAO EXECUTADO

#### Como verificar manualmente

1. Executar: `SELECT is_eligible_for_extra_info, eligible_terms, decided_by_agent, campaign_id FROM uown_los_uwdata WHERE lead_pk = 11132`
2. Resultado atual: `is_eligible_for_extra_info=false`, `eligible_terms=NULL`, `decided_by_agent=GDS`, `campaign_id=137`

**NAO EXECUTADO**

> Motivo: CT-01 falhou (serial mode), CT-02 nao foi executado.

---

### Cenario: Cenario 3 — CT-03

**O que e feito:** Chama `POST /uown/los/sendApplication` com mesmo SSN 100000053, incluindo `mainBankAccountNumber=160781900000` e `mainBankRoutingNumber=123456780`.

**O que acontece:** Nao executado — depende do CT-01 (serial mode).

**O que e verificado:**
- `appApprovalStatus = APPROVED` — NAO EXECUTADO
- `creditLimit = 1000` — NAO EXECUTADO

#### Como verificar manualmente

1. Enviar `POST /uown/los/sendApplication` com body identico ao CT-01 mas adicionando `mainBankAccountNumber: "160781900000"` e `mainBankRoutingNumber: "123456780"`
2. Verificar `appApprovalStatus=APPROVED` e `creditLimit=1000`

**NAO EXECUTADO**

> Motivo: CT-01 falhou (serial mode), CT-03 nao foi executado.

---

### Cenario: Cenario 4 — CT-04

**O que e feito:** Enviar `sendApplication` para um merchant TireAgent que possua apenas programa de 13 meses (sem 16 meses).

**O que acontece:** Nao executado — bloqueado por falta de merchant sem programa de 16 meses.

**O que e verificado:**
- `paymentDetailsList` vazio quando merchant nao tem programa de 16 meses — NAO EXECUTADO

#### Como verificar manualmente

1. Identificar merchant TireAgent sem programa de 16 meses: `SELECT m.ref_merchant_code, mp.term_months FROM uown_merchant m JOIN uown_merchant_to_program mtp ON mtp.merchant_pk = m.pk JOIN uown_merchant_program mp ON mp.pk = mtp.program_pk WHERE m.client_type = 'TIRE_AGENT' AND mtp.is_active = true GROUP BY m.ref_merchant_code, mp.term_months`
2. Enviar `sendApplication` para esse merchant e verificar `paymentDetailsList=[]`

**SKIPPED**

> Motivo: Bloqueado — precisa identificar ou configurar merchant TireAgent sem programa de 16 meses.

---

### Cenario: Cenario 5 — CT-05

**O que e feito:** Enviar `sendApplication` sem bank data usando SSN especial (da Becky) que retorna `isEligibleForExtraInfo=true` mas e negado com bank data.

**O que acontece:** Nao executado — bloqueado por falta de SSN de teste.

**O que e verificado:**
- `DECLINED` + `isEligibleForExtraInfo=true` — NAO EXECUTADO

#### Como verificar manualmente

1. Obter SSN de teste da Becky
2. Enviar `sendApplication` sem bank data e verificar resposta

**SKIPPED**

> Motivo: Bloqueado — aguardando SSN de teste da Becky.

---

### Cenario: Cenario 6 — CT-06

**O que e feito:** Enviar `sendApplication` com bank data usando mesmo SSN do CT-05 — espera negativa no programa de 16 meses.

**O que acontece:** Nao executado — bloqueado por falta de SSN de teste.

**O que e verificado:**
- `DECLINED` mesmo com bank data — NAO EXECUTADO

#### Como verificar manualmente

1. Usar mesmo SSN do CT-05, adicionar bank data, verificar `DECLINED`

**SKIPPED**

> Motivo: Bloqueado — aguardando SSN de teste da Becky.

---

## Cobertura dos Requisitos

| Requisito | Coberto | Cenario |
|-----------|:-------:|---------|
| TireAgent chama sendApplication sem bank data, request vai ao GDS | SIM (parcial) | CT-01 — API funciona, GDS e chamado, porem retorna false |
| Novo atributo `isEligibleForExtraInfo` na resposta (true/false baseado no GDS) | SIM | CT-01 — campo existe na resposta (MR !1302 deployado) |
| Quando `is_eligible_for_extra_info=true`, retornar `paymentOptionsList` para 16 meses | NAO | CT-01 — GDS nao retorna true em nenhum ambiente |
| Approval amount do 16m = invoice amount | NAO | CT-03 — nao executado (depende do CT-01) |
| Second submission com bank data → approval $1000 | NAO | CT-03 — nao executado |
| Merchant sem programa 16m → paymentDetailsList vazio | NAO | CT-04 — bloqueado (precisa merchant) |
| Negativa no programa de 16m com bank data | NAO | CT-05/CT-06 — bloqueado (precisa SSN Becky) |

## Investigacao do Banco de Dados

### Distribuicao global de `is_eligible_for_extra_info` em qa1

```sql
SELECT is_eligible_for_extra_info, COUNT(*) FROM uown_los_uwdata GROUP BY is_eligible_for_extra_info;
```

| is_eligible_for_extra_info | count |
|:--------------------------:|:-----:|
| NULL | 9.416 |
| false | 237 |
| **true** | **0** |

### Resposta completa do GDS para lead 11131 (qa1)

```json
{
    "decision": "REJECT",
    "adverseReasonDescription": "['Rejected by CR Lambda Model']; UW_DENIED",
    "campaignId": 137,
    "lambdaSegment": 20,
    "isEligibleForExtraInfo": false,
    "creditLimit": 0,
    "decisionAgent": "GDS",
    "internalDecision": "UW_DENIED"
}
```

### Programas do merchant TireAgent (pk=566)

| program_pk | program_name | term_months | lending_category_type |
|:----------:|:-------------|:-----------:|:---------------------:|
| 207 | KW-16-1 | 16 | LTO |
| 208 | KW-16-2 | 16 | LTO |
| 213 | KWC-2 | 16 | LTO |

## Resumo da Validacao

| Verificacao | Resultado |
|-------------|-----------|
| Todos os cenarios da tarefa cobertos | NAO — bloqueado pelo GDS |
| Contratos de API conferem com Postman | SIM — campo `isEligibleForExtraInfo` presente na resposta |
| Schema do BD confere com migration | SIM — coluna `is_eligible_for_extra_info` existe em `uown_los_uwdata` |
| Regras de negocio validadas | NAO — GDS nao retorna `true` para testar o fluxo |
| Bugs de aplicacao encontrados | NAO (ver nota abaixo) |
| Total de cenarios | 6 |
| Passaram | 0 |
| Falharam | 1 (CT-01) |
| Skipped | 3 (CT-04, CT-05, CT-06) |
| Nao executados | 2 (CT-02, CT-03 — dependiam do CT-01) |
| Video gravado | N/A (API-only) |
| Screenshots salvos | N/A (API-only) |

> **Nota:** O CT-01 falha porque o GDS retorna `isEligibleForExtraInfo=false`. Isto NAO e um bug do SVC — o campo existe na resposta e o SVC repassa fielmente o valor do GDS. O bloqueio esta no modelo do GDS (DataView360, campaign 137) que precisa ser configurado para retornar `true` para o SSN 100000053.

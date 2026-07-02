---
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8bfd07cf5275f605c259a88838168e6a09
status: pending-implementation
covers:
  - docs/business-rules/01-fundamentos.md
  - docs/business-rules/02-originacao-pipeline.md
  - docs/business-rules/08-funding-merchants.md
target-implementation-files:
  # feature not built yet — add these to `covers:` (and drop the business-rules docs)
  # once the code exists, then bump last-reviewed + last-reviewed-sha:
  - svc/src/main/java/com/uownleasing/svc/service/application/ApplicationProcessor.java
  - svc/src/main/java/com/uownleasing/svc/service/application/GetSendApplicationService.java
  - svc/src/main/java/com/uownleasing/svc/pojo/ApplicationRequest.java
  - "<new> customer_identity table + Flyway migration (ssn_normalized UNIQUE, customer_uuid)"
  - "<new> HubSpot outbound integration (customer_uuid as external id)"
  - "<origination FE> customer detail surface for customer_uuid (UI location TBD)"
---

# Oracle: Identificador Único de Cliente — `customer_uuid` (Origination `#1340`)

> **STATUS: IMPLEMENTAÇÃO PENDENTE.** Esta feature **ainda não foi construída** (card `origination#1340`,
> milestone `RU07.26.1.54.0`, `workflow::ready-for-development`). Todo checkpoint abaixo é um
> **contrato de aceitação ALVO** fundamentado nas regras de negócio canônicas — **não** é uma
> observação validada ao vivo. NÃO reportar nenhum CT como PASS até a feature ser entregue E o
> checkpoint ser verificado em um ambiente real. Quando o código for entregue: trocar `covers:` pelos
> arquivos de implementação reais, rodar uma passagem de `discovery` (regra #18) para confirmar a
> superfície de UI, e atualizar `last-reviewed` + `last-reviewed-sha`.

> Operação: ao salvar a aplicação, o sistema atribui um identificador de cliente persistente e
> compartilhável externamente (`customer_uuid`, UUID v7) chaveado por SSN — reutilizado para clientes
> recorrentes — que propaga para o servicing e para o HubSpot. Validado a partir da visão do agente de
> Origination em `/customers/{leadPk}`, do registro de cliente no servicing, do reporting, e do payload
> de saída para o HubSpot.

## Resumo da demanda

- **Ator:** agente de Origination (observa) · cliente/applicant (dispara via nova aplicação) · negócio/marketing (consome via reporting + HubSpot).
- **Objetivo:** dar a cada cliente um identificador persistente único que sobrevive entre aplicações e leases, **sem depender do SSN**, de modo que a mesma pessoa seja reconhecível ao longo do tempo.
- **Valor:** integração com HubSpot + reporting de ciclo de vida do cliente sobre uma chave segura para PII (o SSN nunca sai do sistema).

## Decisão de escopo (usuário, 2026-07-01)

- **SEM backfill de dados legados.** Linhas históricas NÃO são agrupadas retroativamente. Consequência aceita: um
  cliente recorrente real cujos leases anteriores são anteriores à feature recebe um `customer_uuid`
  **novo** na próxima aplicação; leases antigos ficam desvinculados. O reporting tem uma descontinuidade de transição.
- **Chave de match = SSN** (normalizado, somente dígitos — mesma representação de `mainSSN`). **Identificador
  entregue = surrogate UUID v7** — nunca o próprio SSN.

## Análise de impacto

| Regra / fato | Impacto nesta feature | Fonte |
|---|---|---|
| O SSN já é a chave da pessoa no submit — o map Hazelcast **`Application Request: SSN → UUID`** previne aplicações duplicadas *simultâneas* | A atribuição do UUID persistente DEVE reutilizar/estender esse lock (ou um `UNIQUE(ssn)` no DB) para que submits simultâneos do mesmo SSN resolvam para **um** UUID. Essa é a proteção contra race condition. | `01-fundamentos.md:316` `[confirmed]` |
| **`previousLeadsCheck`** (Step 6) já varre todos os leads anteriores do mesmo SSN e os cancela / soma `consumedApprovalAmount` | A lógica de "encontrar leads do mesmo cliente" já existe; a feature persiste sua chave, não inventa o matching. | `12-produto-lease-deep-dive.md:657` `[confirmed]` |
| **`CANCELLED_DUP_SSN`** = "Cancelado por um lead mais novo com o mesmo SSN" | Tensão semântica: hoje SSN duplicado → cancela; a feature quer SSN duplicado → **reutilizar o UUID**. Ambos precisam valer: o lead mais novo cancela o mais antigo E ambos compartilham o mesmo `customer_uuid`. | `06-conta-ciclo-vida.md:276` · `08-funding-merchants.md:806` `[confirmed]` |
| **Step 9 Duplicate Check** = velocity de email/phone/bank (limite 3) — **NÃO** por SSN | NÃO deve ser usado como a chave de cliente; NÃO deve ser alterado pela nova atribuição (regressão, AC-08). | `02-originacao-pipeline.md:148-160` `[confirmed]` |
| O import LOS→SVC já **deduplica clientes** | `customer_uuid` precisa sobreviver ao import e cair no `uown_sv_customer` já existente (nenhuma linha de cliente nova para uma pessoa recorrente); o valor no LOS precisa ser igual ao valor no SVC. | `08-funding-merchants.md:72` `[confirmed]` |
| Additional-lease = mesmo cliente, outro lease | Um additional lease precisa herdar o mesmo `customer_uuid`. | `07-modificacoes-conta.md` (additional-lease) `[confirmed]` |
| O svc gera todos os UUIDs com `UUID.randomUUID()` (**v4**); nenhuma lib v7 presente | UUID v7 precisa de uma dependência nova (ex: `uuid-creator`) ou do `uuidv7()` do PG18 — **confirmar versão do PG/JDK**. O v7 vaza o timestamp de criação externamente (HubSpot) — aceitar ou usar fallback para v4. | `svc/.../ApplicationRequest.java:418`, `GetSendApplicationService.java:129` `[confirmed 2026-07-01]` |
| Activity Log obrigatório — "sem log = nada aconteceu" (regra #13) | Reconhecer um cliente recorrente / atribuir um identificador é uma ação de negócio → espera-se uma nota. `[assumed]` — confirmar o log exato na execução. | CLAUDE.md regra #13 |
| PII: o SSN nunca deve ser compartilhado externamente | O identificador entregue é um surrogate UUID; um hash determinístico do SSN (UUID v5) é **proibido** — um SSN de 9 dígitos é sujeito a brute-force, então um hash vaza o SSN. | Objetivo de negócio do card + `.claude/rules/security.md` |

## Critérios de Aceitação

| ID | Critério (resultado observável) | Testável? |
|---|---|---|
| AC-01 | Um novo cliente (SSN nunca visto) recebe um `customer_uuid` recém-gerado e válido. | Sim |
| AC-02 | Um cliente existente (mesmo SSN) reutiliza o **mesmo** `customer_uuid` em uma nova aplicação/lease. | Sim |
| AC-03 | Dois clientes diferentes (SSN diferente) recebem valores de `customer_uuid` **diferentes**. | Sim |
| AC-04 | Todas as aplicações/leases de um cliente são correlacionáveis pelo `customer_uuid` compartilhado. | Sim |
| AC-05 | `customer_uuid` propaga sem alteração do LOS para `uown_sv_customer` no import (valor do LOS == valor do SVC). | Sim |
| AC-06 | O reporting consegue agrupar/distinguir clientes por `customer_uuid`. | Sim |
| AC-07 | `customer_uuid` (não o SSN) é enviado ao HubSpot como o external customer id; o SSN nunca está no payload. | Sim |
| AC-08 | Fluxos existentes não afetados: `CANCELLED_DUP_SSN`, `previousLeadsCheck`, os gates de velocity do Step 9, underwriting — todos se comportam como antes. | Sim |
| AC-09 | Submissões concorrentes do mesmo SSN resolvem para um **único** `customer_uuid` (sem split). | Sim |
| AC-10 | Cliente sem SSN (ITIN) — comportamento definido e determinístico. | **Pendente** (discovery) |
| AC-11 | SSN corrigido em um lead existente — comportamento de re-mapeamento definido. | **Pendente** (discovery) |

## Cenários

```gherkin
Feature: Identificador de cliente persistente e único entre aplicações e leases
  As the UOWN business
  In order to recognize the same customer over time and share that identity safely with HubSpot
  The system must assign one persistent identifier per customer, keyed by SSN, reused across applications and leases

  Background:
    Given a merchant configured for new applications
    And the customer identifier feature is enabled

  Scenario: [negative] O cancelamento por SSN duplicado ainda dispara, e o lead cancelado e o novo compartilham um identificador
    Given a customer with SSN 100000053 already has a lead with a customer identifier
    When the same customer submits a newer application with the same SSN
    Then the older lead moves to status CANCELLED_DUP_SSN
    And the newer lead carries the exact same customer identifier as the cancelled lead

  Scenario: [negative] Duas aplicações simultâneas para o mesmo SSN resolvem para um único identificador
    Given no customer identifier exists yet for SSN 100000061
    When two applications for SSN 100000061 are submitted at the same time
    Then both leads end up with one and the same customer identifier
    And no second customer identifier is created for that SSN

  Scenario: [negative] Um cliente sem SSN é tratado pela regra definida de ausência de SSN
    Given an applicant with no SSN on file (ITIN customer)
    When the applicant submits an application
    Then the customer identifier behaves per the defined no-SSN rule
    And the outcome is deterministic across repeated submissions by the same applicant

  Scenario: [negative] Corrigir o SSN em um lead existente re-mapeia o identificador conforme a regra definida
    Given a lead was created under SSN 100000053 with a customer identifier
    When the agent corrects the SSN on that lead to 100000079
    Then the lead's customer identifier follows the defined SSN-correction rule
    And the identifier is consistent with any other lead that already carries SSN 100000079

  Scenario: [negative] O SSN nunca é compartilhado com a integração externa
    Given a customer has a customer identifier
    When the customer record is synchronized to HubSpot
    Then the outbound payload contains the customer identifier as the external id
    And the outbound payload contains no SSN in any field

  Scenario: [positive] Um cliente totalmente novo recebe um identificador recém-gerado
    Given no customer identifier exists yet for SSN 100000053
    When the customer submits their first application
    Then the lead shows a valid customer identifier
    And that identifier is registered against SSN 100000053

  Scenario: [positive] Um cliente recorrente reutiliza o mesmo identificador em uma segunda aplicação
    Given a customer with SSN 100000053 already has a customer identifier
    When the same customer submits a second, separate application
    Then the second lead shows the exact same customer identifier as the first
    And a returning-customer recognition note is written to the activity log

  Scenario: [positive] Dois clientes diferentes recebem identificadores diferentes
    Given customer A with SSN 100000053 and customer B with SSN 100000061 each submit an application
    Then customer A and customer B have different customer identifiers

  Scenario: [positive] Todos os leases de um cliente são correlacionados pelo identificador compartilhado
    Given a customer with SSN 100000053 has three leads over time
    When the leads are grouped by customer identifier
    Then all three leads return under the single identifier for that customer

  Scenario: [positive] O identificador propaga sem alteração para o servicing no import
    Given a lead with a customer identifier is moved to servicing
    When the servicing customer record is created for that lead
    Then the servicing customer record shows the exact same customer identifier as the origination lead

  Scenario: [positive] O reporting distingue clientes pelo identificador
    Given several customers each have leases under their own customer identifier
    When a report is grouped by customer identifier
    Then each customer's leases roll up under exactly one identifier
    And no two distinct customers share an identifier in the report

  Scenario: [positive] Atribuir o identificador não perturba o pipeline existente
    Given a customer submits an application that would pass underwriting normally
    When the application is processed
    Then the customer identifier is assigned
    And the previous-leads check, duplicate velocity limits, and underwriting result are unchanged from before the feature
```

## Checkpoints

### Oracle

> Toda linha é um **ALVO** (feature pendente). `customer_uuid` = o UUID v7 entregue; `customer_identity`
> = a tabela de mapeamento proposta `(ssn_normalized UNIQUE, customer_uuid)`. A superfície de UI para o
> valor é um gap confirmado (ver Pendências). Preferir asserir sobre o valor/consistência, não apenas presença.

| CT | AC | Descrição | Esperado (alvo) | Onde / como verificar |
|---|---|---|---|---|
| CT-01 | AC-01 | Cliente novo recebe um identificador válido | `customer_uuid` não-nulo, UUID **v7** bem formado (nibble de versão = 7), único | Registro de cliente do lead (localização de UI TBD) + linha `customer_identity` para `ssn_normalized='100000053'` |
| CT-02 | AC-02 / AC-04 | Cliente recorrente reutiliza o identificador | `customer_uuid` do 2º lead **byte a byte igual** ao do 1º lead | Comparar o valor nos registros de cliente de ambos os leads; linha única de `customer_identity` para aquele SSN |
| CT-03 | AC-03 | Clientes diferentes divergem | `customer_uuid(A) != customer_uuid(B)` para SSNs distintos | Dois registros de cliente; duas linhas `customer_identity` distintas |
| CT-04 | AC-04 | Todos os leases se correlacionam | Agrupar N leads de um SSN por `customer_uuid` retorna todos os N sob um único valor | Reporting / query agrupada por `customer_uuid` |
| CT-05 | AC-05 | Consistência LOS→SVC | `uown_sv_customer.customer_uuid` == `customer_uuid` do lead de origination (mesmo valor, não um novo) | Valor do registro de cliente em Origination vs valor do registro de cliente em servicing para a mesma pessoa |
| CT-06 | AC-06 | Reporting distingue clientes | Os leases de cada cliente se consolidam sob exatamente um identificador; nenhum identificador compartilhado entre clientes distintos | Report agrupado por `customer_uuid` |
| CT-07 | AC-07 | HubSpot recebe UUID, nunca SSN | Campo external-id do payload de saída ao HubSpot == `customer_uuid`; **nenhum** SSN presente em qualquer campo | Requisição da integração de saída (captura de network/log) |
| CT-08 | AC-08 | DUP_SSN coexiste com a reutilização | Lead mais antigo → `CANCELLED_DUP_SSN`; lead mais novo carrega o **mesmo** `customer_uuid` do cancelado | Status do lead mais antigo + `customer_uuid` igual em ambos os leads |
| CT-09 | AC-09 | Concorrência → identificador único | Dois submits simultâneos do mesmo SSN → exatamente **uma** linha `customer_identity`; ambos os leads a compartilham | `SELECT count(*) FROM customer_identity WHERE ssn_normalized=…` retorna 1; valores iguais em ambos os leads |
| CT-10 | AC-08 | Pipeline existente não afetado | `previousLeadsCheck`, limites de velocity do Step 9 (`EMAIL_COUNT_FAILED`/`PHONE_COUNT_FAILED`), resultado de underwriting idêntico à baseline pré-feature | Rodar um lead de baseline conhecido; comparar status/decisões |
| CT-11 | AC-08 / regra #13 | Reconhecimento de cliente recorrente logado | Nota de activity log gravada quando um identificador existente é reutilizado `[assumed — confirmar texto/superfície exata na execução]` | `uown_los_activity_log` / notas do lead + a superfície de log na UI |
| CT-12 | AC-10 | Comportamento no-SSN (ITIN) | Corresponde à regra definida de ausência de SSN; determinístico entre repetições | **Pendente** — definir com o PO, depois verificar |
| CT-13 | AC-11 | Re-mapeamento na correção de SSN | Corresponde à regra definida de correção de SSN; consistente com leads existentes do SSN corrigido | **Pendente** — definir com o PO, depois verificar |

### Comando de verificação de obsolescência

```bash
# Feature pendente — covers atualmente aponta para as regras de negócio canônicas que fundamentam este contrato.
git log cd2d2c8bfd07cf5275f605c259a88838168e6a09..HEAD -- \
  docs/business-rules/01-fundamentos.md \
  docs/business-rules/02-originacao-pipeline.md \
  docs/business-rules/08-funding-merchants.md
```

> Rodar a partir da raiz do repo qa-uown. Sem output = regras de fundamentação inalteradas. Com output = uma
> regra coberta mudou → prefixar `[BDD MAY BE STALE]`. **Após a implementação**, substituir `covers:` pelos
> arquivos de código reais e reapontar este comando para os repos origination/svc.

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) / CT | Status |
|---|---|---|
| AC-01 — cliente novo recebe identificador | CT-01 · [positive] cliente totalmente novo | Coberto (alvo) |
| AC-02 — cliente recorrente reutiliza identificador | CT-02 · [positive] cliente recorrente reutiliza | Coberto (alvo) |
| AC-03 — clientes diferentes divergem | CT-03 · [positive] dois clientes diferentes | Coberto (alvo) |
| AC-04 — leases se correlacionam pelo identificador | CT-02, CT-04 · [positive] todos os leases se correlacionam | Coberto (alvo) |
| AC-05 — consistência LOS→SVC | CT-05 · [positive] propaga para servicing | Coberto (alvo) |
| AC-06 — reporting distingue clientes | CT-06 · [positive] reporting distingue | Coberto (alvo) |
| AC-07 — external id do HubSpot, sem SSN | CT-07 · [negative] SSN nunca compartilhado | Coberto (alvo) |
| AC-08 — fluxos existentes não afetados | CT-08, CT-10, CT-11 · [negative] DUP_SSN + [positive] pipeline não perturbado | Coberto (alvo) |
| AC-09 — concorrência → identificador único | CT-09 · [negative] mesmo SSN simultâneo | Coberto (alvo) |
| AC-10 — comportamento no-SSN (ITIN) | CT-12 · [negative] regra no-SSN | Pendente (discovery) |
| AC-11 — re-mapeamento na correção de SSN | CT-13 · [negative] correção de SSN | Pendente (discovery) |

## Pendências

1. **Superfície de UI para `customer_uuid` (gap de frontend):** o card é do frontend de Origination mas não especifica **onde** o identificador é exibido (header do detalhe do cliente? um campo novo? não exibido, só query?). Rodar `/discovery` em `/customers/{leadPk}` assim que o FE for entregue para ancorar os checkpoints CT-01/CT-02 a uma localização real do DOM.
2. **Clientes sem SSN / ITIN (AC-10):** esse tipo de cliente existe neste produto? Se sim, definir a chave (sem reutilização? chave composta de fallback?). Decisão do PO → depois o cenário.
3. **Correção de SSN pós-criação (AC-11):** o portal permite edições do primary applicant incluindo SSN. Definir se corrigir o SSN re-mapeia o identificador, faz merge, ou é bloqueado. Decisão do PO → depois o cenário.
4. **Co-applicant / applicant conjunto:** a chave de match é o `mainSSN` primário; um co-applicant não tem identificador próprio. Confirmar se isso é aceitável ou adicionar uma regra.
5. **Activity log de cliente recorrente (CT-11):** confirmar se o reconhecimento grava uma nota e seu texto/superfície exatos (a regra #13 espera uma; atualmente `[assumed]`).
6. **Versão + geração do UUID (design):** v7 precisa de uma dependência nova (svc hoje é v4-only) ou do PG18; v7 vaza o timestamp de criação para o HubSpot. Confirmar versão do PG/JDK e aprovação de segurança, senão usar fallback para v4.

# Task #477 — UOWN | SVC | New TireAgent Flow (return 16-month) and (second look)

> **GitLab:** https://gitlab.com/uown/backend/svc/-/work_items/477
> **Milestone:** RU03.26.1.50.0
> **Responsáveis:** Marcus Braga, Priyanka Namburu, Sowjanya Kaligineedi
> **Labels:** dev::backend, priority::high, type::development, workflow::qa-in-process
> **Data:** 2026-03-23
> **MR:** !1302 (merged)

---

## Resumo da Feature

O TireAgent chama a API `sendApplication` com invoice (sem dados bancários). A requisição é encaminhada ao GDS que executa o modelo de decisão. Se o GDS determina que o consumidor é elegível para um "second look" (pode ser considerado para outro prazo se fornecer informações bancárias), a resposta retorna `is_eligible_for_extra_info = true`.

**Mudanças na ApplicationResponse:**
1. Novo atributo `isEligibleForExtraInfo` (true/false baseado na resposta do GDS)
2. Quando `is_eligible_for_extra_info = true`, retornar `paymentOptionsList` para um plano de 16 meses
3. O approval amount do plano de 16 meses = valor da invoice

---

## Contexto do Negócio

| Ponto | Detalhe |
|-------|---------|
| **Prioridade de termo** | O programa de 13 meses é sempre preferido (prazo mais curto). O de 16 meses só é oferecido quando o cliente **não é elegível** para o de 13. |
| **eligible_terms** | Quando negado no programa de 13 meses, `eligible_terms` vem **NULL** do GDS. Backend: se `eligible_terms=null` **E** `isEligibleForExtraInfo=true` → busca programa de 16 meses e retorna `paymentDetailsList`. |
| **Cálculo de pagamento** | Os detalhes de pagamento do programa de 16 meses são calculados pelo **backend**, NÃO pelo GDS. |
| **EPO** | 13 meses tem oferta especial de 90 dias (pelo custo da fatura). 16 meses **NÃO tem** oferta de 90 dias — sempre cálculo normal. |
| **Ambiente teste vs. produção** | Em teste, enviar bank data = aprovação. Em produção, mesmo com bank data o cliente pode ser negado no 16m. |

---

## Dados da Investigação (DB qa1)

| Dado | Valor | Evidência |
|------|-------|-----------|
| Merchant TireAgent | pk=566, `ref_merchant_code=OW90218-0001`, `client_type=TIRE_AGENT` | `uown_merchant` |
| Campaign ID (peak) | 137 | `uown_merchant.peak_campaign_id` |
| Programas 16 meses | KW-16-1 (pk=207), KW-16-2 (pk=208), KWC-2 (pk=213) | `uown_merchant_to_program` + `uown_merchant_program` |
| SSN 100000053 — resultado atual | `REJECT`, `isEligibleForExtraInfo=false`, `lambdaSegment=20` | `uown_los_uwdata.abb_uw_response` (lead 11131) |
| Leads com `is_eligible_for_extra_info=true` em qa1 | **0 (zero)** | 9416 null + 237 false, nenhum true |

> **Bloqueio:** O GDS (DataView360, campaign 137) retorna `isEligibleForExtraInfo=false` para o SSN 100000053 em qa1. O modelo precisa ser configurado pelo time do GDS para retornar `true`.

---

## User Stories

### US-477-01: Second Look — Primeira Submissão sem Dados Bancários

**Como** merchant TireAgent,
**Quero** enviar uma aplicação via `sendApplication` sem dados bancários e receber a indicação de que o consumidor é elegível para second look,
**Para** saber se devo solicitar informações bancárias ao cliente e oferecer o programa de 16 meses.

#### Critérios de Aceite
- [ ] A resposta contém o novo atributo `isEligibleForExtraInfo` (true/false)
- [ ] Quando `isEligibleForExtraInfo=true`, a resposta contém `paymentDetailsList` com preview do programa de 16 meses
- [ ] O `appApprovalStatus` é `DECLINED` (negado no programa de 13 meses)
- [ ] No banco, `eligible_terms` é NULL e `is_eligible_for_extra_info` é true
- [ ] Os detalhes de pagamento do 16 meses são calculados pelo backend (approval amount = invoice amount)

---

### US-477-02: Second Look — Segunda Submissão com Dados Bancários

**Como** merchant TireAgent,
**Quero** reenviar a aplicação incluindo dados bancários do consumidor após receber `isEligibleForExtraInfo=true`,
**Para** obter a aprovação do consumidor no programa de 16 meses.

#### Critérios de Aceite
- [ ] A segunda submissão com bank data (mesmo SSN) retorna `APPROVED`
- [ ] O `creditLimit` é igual ao valor da invoice ($1000)
- [ ] O `paymentDetailsList` contém detalhes do programa de 16 meses

---

### US-477-03: Merchant sem Programa de 16 Meses

**Como** sistema,
**Quero** que, quando o merchant não possua programa de 16 meses configurado, a resposta retorne `paymentDetailsList` vazio mesmo com `isEligibleForExtraInfo=true`,
**Para** evitar exibir opções de pagamento inexistentes.

#### Critérios de Aceite
- [ ] `isEligibleForExtraInfo=true` (decisão do GDS, independente do merchant)
- [ ] `paymentDetailsList` vazio (`[]`) quando merchant não tem programa de 16 meses

---

### US-477-04: Negativa no Programa de 16 Meses

**Como** sistema,
**Quero** que, mesmo quando o consumidor é elegível para second look, a aplicação possa ser negada no programa de 16 meses após envio de bank data,
**Para** refletir a decisão real do GDS quando o perfil de crédito não atende os critérios do programa de 16 meses.

#### Critérios de Aceite
- [ ] Primeira submissão: `DECLINED` + `isEligibleForExtraInfo=true`
- [ ] Segunda submissão com bank data: `DECLINED` (negado no programa de 16 meses também)
- [ ] `creditLimit` ausente ou 0

---

## Cenários de Teste

### CT-01: Negativa + Second Look + Preview 16 meses (sendApplication SEM bank data)

**Tipo:** API
**Portal:** N/A (API-only)
**User Story:** US-477-01
**Pré-condição:** GDS habilitado em qa1, merchant TireAgent (OW90218-0001) com programa de 16 meses ativo

**Passos:**
1. Enviar `POST /uown/los/sendApplication` com SSN 100000053, invoice `orderTotal=1000.00`, **SEM** `mainBankAccountNumber` / `mainBankRoutingNumber`
2. Verificar `appApprovalStatus = DECLINED`
3. Verificar `isEligibleForExtraInfo = true`
4. Verificar `paymentDetailsList` com pelo menos 1 entrada com `termInMonths = 16`

**Resultado esperado:**
- HTTP 200
- `appApprovalStatus = DECLINED` (negado no programa de 13 meses)
- `isEligibleForExtraInfo = true` (elegível para second look / programa de 16 meses)
- `paymentDetailsList` não vazio, com preview do programa de 16 meses

**Tags:** @regression @critical

---

### CT-02: DB — eligible_terms nulo após negativa no programa de 13 meses

**Tipo:** DB
**User Story:** US-477-01
**Pré-condição:** CT-01 executado (lead negado com isEligibleForExtraInfo=true)

**Passos:**
1. Consultar `uown_los_uwdata` para o lead do CT-01
2. Verificar `is_eligible_for_extra_info = true`
3. Verificar `eligible_terms = NULL`

**Resultado esperado:**
- `is_eligible_for_extra_info = true` no banco
- `eligible_terms = NULL` (quando null + flag true → backend busca programa de 16 meses)

**Tags:** @regression

---

### CT-03: Aprovação com dados bancários (sendApplication COM bank data, mesmo SSN)

**Tipo:** API
**User Story:** US-477-02
**Pré-condição:** CT-01 executado (first look negado)

**Passos:**
1. Enviar `POST /uown/los/sendApplication` com **mesmo SSN** 100000053, invoice, **COM** `mainBankAccountNumber=160781900000` e `mainBankRoutingNumber=123456780`
2. Verificar `appApprovalStatus = APPROVED`
3. Verificar `creditLimit = 1000`

**Resultado esperado:**
- HTTP 200
- `appApprovalStatus = APPROVED` (aprovado no programa de 16 meses)
- `creditLimit = 1000` (igual ao valor da invoice)

**Tags:** @regression @critical

---

### CT-04: Merchant sem programa 16m — paymentDetailsList vazio

**Tipo:** API
**User Story:** US-477-03
**Pré-condição:** Merchant TireAgent com **apenas** programa de 13 meses (sem 16 meses ativo)
**Status:** BLOQUEADO — precisa identificar ou configurar merchant sem programa de 16 meses

**Passos:**
1. Identificar merchant TireAgent sem programa de 16 meses
2. Enviar `POST /uown/los/sendApplication` com SSN 100000053, invoice, SEM bank data
3. Verificar `appApprovalStatus = DECLINED`
4. Verificar `isEligibleForExtraInfo = true` (decisão do GDS, independente do merchant)
5. Verificar `paymentDetailsList` vazio (`[]`)

**Resultado esperado:**
- HTTP 200
- `DECLINED` + `isEligibleForExtraInfo = true`
- `paymentDetailsList` vazio — não existe programa de 16 meses para gerar preview

**Tags:** @regression

---

### CT-05: First look — elegível para second look mas negado no 16m (primeira submissão)

**Tipo:** API
**User Story:** US-477-04
**Pré-condição:** SSN de teste da Becky que retorna eligible=true mas é negado mesmo com bank data
**Status:** BLOQUEADO — aguardando SSN de teste da Becky

**Passos:**
1. Enviar `POST /uown/los/sendApplication` com SSN especial (da Becky), invoice, SEM bank data
2. Verificar `appApprovalStatus = DECLINED`
3. Verificar `isEligibleForExtraInfo = true`

**Resultado esperado:**
- HTTP 200
- `DECLINED` + `isEligibleForExtraInfo = true` (elegível para second look)

**Tags:** @regression

---

### CT-06: Second look — negativa definitiva no programa de 16 meses

**Tipo:** API
**User Story:** US-477-04
**Pré-condição:** CT-05 executado

**Passos:**
1. Enviar `POST /uown/los/sendApplication` com **mesmo SSN** da Becky, invoice, **COM** bank data
2. Verificar `appApprovalStatus = DECLINED`
3. Verificar `creditLimit` ausente ou 0

**Resultado esperado:**
- HTTP 200
- `DECLINED` (negado no programa de 16 meses também)
- Negativa definitiva — consumidor não é elegível em nenhum programa

**Tags:** @regression

---

## Mapeamento: CT ↔ US ↔ Requisito da Task

| CT | US | Requisito da Task #477 | Status |
|----|-----|------------------------|--------|
| CT-01 | US-477-01 | "TireAgent will call sendApplication... if GDS determines eligible for second look, response returns is_eligible_for_extra_info=true" + "return paymentOptionsList for 16-month term" | BLOQUEADO (GDS) |
| CT-02 | US-477-01 | "Add new attribute isEligibleForExtraInfo... set to true or false based on GDS response" (validação DB) | BLOQUEADO (GDS) |
| CT-03 | US-477-02 | "Submit a lead with same SSN with bank data... should receive an approval for $1000" | BLOQUEADO (GDS) |
| CT-04 | US-477-03 | Cenário derivado — merchant sem programa de 16 meses | BLOQUEADO (merchant) |
| CT-05 | US-477-04 | Cenário derivado — negativa no 16m (produção) | BLOQUEADO (SSN Becky) |
| CT-06 | US-477-04 | Cenário derivado — negativa no 16m (produção) | BLOQUEADO (SSN Becky) |

---

## Mapeamento: CT ↔ Código Backend

| CT | Verificação | Código Backend |
|----|-------------|----------------|
| CT-01 | `isEligibleForExtraInfo=true` | `GdsResponseParser.setExtraInfoEligibility()` — parseia `is_eligible_for_extra_info` do GDS |
| CT-01 | `paymentDetailsList` com 16m quando eligible | `ApplicationProcessor` (linha 128): se `!isUwApproved && isEligibleForExtraInfo` → roda `calculatorCheck` |
| CT-01 | `eligible_terms = NULL` | GDS retorna null quando negado → `UWInfo.eligibleTerms` fica null |
| CT-01 | Backend busca programa 16m | `CalculatorStep` (linhas 90-121): filtra `paymentDetailsList` para max term (16m) para merchants API |
| CT-03 | Skip denial reuse | `PreviousUwDeniedStep` (linhas 32-40): se lead anterior `isEligibleForExtraInfo=true` + novo lead tem bank data → skip denied UW reuse |
| CT-03 | Detecta bank data | `ApplicationRequest` (linha 480): sets `isBankingDataPresent=true` quando bank data fornecido |
| CT-04 | PaymentDetails vazio sem 16m | `CalculatorStep`: não encontra programa de 16 meses → `paymentDetailsList` vazio |
| CT-02 | Persistência flag | `LosUWService.createOrUpdateUnderwritingData(uwInfo)` → salva em `uown_los_uwdata` |

---

## Restrições de Dados de Teste

> **IMPORTANTE (informado pelo dev):** O CEP `90001` é **high-risk** no modelo do GDS. Aplicações com esse CEP são negadas automaticamente **SEM** `isEligibleForExtraInfo=true`. Usar CEP alternativo (ex: `90015`).

## Dependências e Bloqueios

| Item | Status | Detalhe |
|------|--------|---------|
| Config GDS habilitado no qa1 | FEITO | Commit `cabd56f` no `configuration` repo — `use.taktile.for.decision: false`, `use.gds.for.decision: true` |
| Config GDS habilitado no sandbox | FEITO | Branch `uown-sandbox` já tem `use.gds.for.decision: true` |
| CEP high-risk 90001 | FEITO | Substituído por `90015` nos testes (90001 causa denial sem eligible=true) |
| GDS model para SSN 100000053 | **EM ANDAMENTO** | Dev confirmou: "it's on GDS. Checking with him" — time do GDS está configurando |
| SSN para CT-05/CT-06 (denial no 16m) | **BLOQUEADO** | Precisa pedir SSN de teste para a Becky — SSN que retorne eligible=true mas negado mesmo com bank data |
| Merchant sem programa 16m (CT-04) | **BLOQUEADO** | Precisa identificar merchant TireAgent sem `term_months=16` ou desabilitar temporariamente |

---

## Steps to Reproduce (formato task — para colar na task do GitLab)

| Step | O que testa | Passos / Resultado Esperado |
|------|-------------|----------------------------|
| 1 | Configuração GDS | **Pré-condição:** Nas configurações do DevOps, garantir que o Taktile esteja desabilitado e o GDS habilitado. (Padrão do Ticket #419) |
| 2 | Merchant Tire Agent SSN 100000053, com programa de 16 meses | Selecionar um merchant TireAgent que possua o programa de 16 meses configurado. *(TireAgent operava com 16 meses no Cornerstone, agora migrado para UOWN.)* |
| 3 | Negativa + Second Look + Preview de pagamento | Enviar o payload inicial. **Resultado esperado:** A resposta deve retornar negativa para o programa de 13 meses, a flag `isEligibleForExtraInfo: true` e os detalhes de pagamento do programa de 16 meses como prévia. |
| 3 | `eligible_terms` nulo | Validar no banco que o campo `eligible_terms` retorna `null` após a negativa no programa de 13 meses. **Comportamento esperado:** Quando `eligible_terms` for nulo e `isEligibleForExtraInfo` for `true`, o backend busca o programa de 16 meses e retorna os detalhes de pagamento — sem dependência do GDS para esse cálculo. |
| 4 | Aprovação com dados bancários | Enviar o segundo payload incluindo as informações bancárias do cliente. **Resultado esperado:** A aplicação deve retornar aprovação no programa de 16 meses. |
| 5 | Merchant sem programa de 16 meses | Utilizar um SSN vinculado a um merchant TireAgent que possua **apenas** o programa de 13 meses. **Resultado esperado:** Os detalhes de pagamento do programa de 16 meses devem retornar vazios/nulos. |
| 6 | Negativa também no programa de 16 meses | Simular o cenário em que, mesmo após o envio das informações bancárias, o cliente é negado no programa de 16 meses. **Resultado esperado:** A resposta deve retornar negativa definitiva. *(Solicitar conta de teste adequada à Becky.)* |

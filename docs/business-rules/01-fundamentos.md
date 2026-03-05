# Fundamentos e Visao Geral
## UOwn Leasing - SVC Platform

Visao geral do negocio, conceitos financeiros fundamentais, programas de merchant e gestao de configuracoes.

---

## 1. Visao Geral do Negocio

### O Que e a UOwn Leasing

A UOwn Leasing e uma empresa de **lease-to-own** (aluguel com opcao de compra). Ela se posiciona entre **lojistas (merchants)** e **consumidores (customers)**, permitindo que clientes adquiram produtos parcelados mesmo sem credito tradicional.

### Como o Modelo de Negocio Funciona

1. **O lojista** se cadastra na plataforma e configura seus programas de financiamento (termos, taxas, prazos)
2. **O cliente** vai ao lojista, escolhe produtos e aplica para um lease
3. **A UOwn** avalia o risco do cliente (underwriting), aprova ou nega
4. Se aprovado, o cliente **assina eletronicamente** o contrato de lease
5. **A UOwn paga o lojista** (funding) - o lojista recebe o valor dos produtos
6. **O cliente faz pagamentos periodicos** para a UOwn ate quitar o lease
7. **Opcao de compra antecipada (EPO):** Se o cliente pagar o valor original do produto em ate 90 dias, ele quita o lease sem pagar o markup total

### Empresas Operadas

| Empresa | Descricao |
|---------|-----------|
| **UOwn Leasing** | Empresa principal. Templates, emails, portal com branding UOwn |
| **Kornerstone Living** | Subsidiaria. Templates proprios, portal em `kornerstoneliving.com`, regras EPO diferenciadas com formula baseada em moneyFactor |

### Tipos de Merchant

| Tipo | Descricao | Como o estado e determinado |
|------|-----------|---------------------------|
| **ONLINE** | Lojista opera via internet. Codigos comecam com "OL" ou "ON" | Usa o estado do **cliente** para impostos e programas |
| **INSTORE** | Lojista opera presencialmente | Usa o estado do **merchant** para impostos e programas |

### Fluxo Completo do Ciclo de Vida

```
ORIGINACAO (LOS)
================
1. Cliente aplica no site do lojista
2. Pipeline de 17 steps valida a aplicacao
3. Underwriting avalia risco de credito
4. Se aprovado: cliente recebe limite e opcoes de pagamento
5. Cliente completa dados, escolhe frequencia, confirma itens
6. Contrato gerado e enviado para assinatura eletronica
7. Cliente assina -> Lead status = SIGNED
8. Funding: UOwn paga o lojista
9. Lead importado para sistema de servicing

SERVICING (SVC)
===============
10. Conta ativa criada com cronograma de recebiveis
11. Pagamentos coletados automaticamente (ACH ou CC)
12. Se cliente paga EPO em 90 dias -> conta quitada com desconto
13. Se nao -> pagamentos continuam ate fim do contrato
14. Fim do contrato -> conta paga (PAID_OUT)
```

---

## 2. Conceitos Financeiros Fundamentais

### 2.1 Money Factor (Fator de Multiplicacao)

**O que e:** O money factor e o multiplicador que define quanto o cliente pagara **a mais** sobre o valor original do produto ao longo do lease. E o equivalente a uma taxa de juros no mundo do leasing.

**Como funciona:**
```
Valor do Contrato = Custo Base x Money Factor x Meses do Termo
```

**Exemplo pratico:**
- Produto custa **$1.000**
- Money Factor = **0.15** por mes
- Termo = **12 meses**
- Valor total do contrato = $1.000 x 0.15 x 12 = **$1.800**
- O cliente paga $1.800 por um produto de $1.000 (markup de $800)

**Onde e configurado:** No programa do merchant (`ProgramInfo.moneyFactor`). Cada programa pode ter um money factor diferente, permitindo diferentes niveis de preco para diferentes segmentos de risco ou categorias de produtos.

**Impacto no EPO:** O money factor tambem e usado inversamente para calcular quanto dos pagamentos do cliente foram para "principal" (custo do produto) vs "lease charge" (lucro da UOwn). Na formula Kornerstone: `valorPagoParaEPO = totalPagamentos / moneyFactor`.

### 2.2 Security Deposit (Deposito de Seguranca)

**O que e:** Um valor pequeno (ex: $40) cobrado do cliente **antes** de assinar o lease. NAO e um custo adicional -- e creditado contra o ultimo pagamento do cliente.

**Para que serve:** Funciona como garantia de compromisso do cliente e cobertura inicial de risco para a UOwn.

**De onde vem o valor:** O valor do security deposit e configurado **por estado** no campo `securityDeposit` da tabela `state_configurations`. Este e um campo **separado** do `processingFee` na mesma tabela. Pode ser consultado via `GET /getAllStateConfigurations` ou `POST /getStateConfigurationsByState/{state}` -- o campo aparece como `securityDeposit` dentro de `stateConfigurationsInfo`.

**Quando e cobrado (logica em `CalculatorService.getSecurityDepositForLead`):**

1. **Condicao 1 (holdDeposit):** Merchant tem `holdDeposit = true` E o estado tem `securityDeposit` configurado (nao nulo)
2. **Condicao 2 (checkUwForVerification):** Merchant tem `checkUwForVerification = true` E o Underwriting sinalizou `chargeProcessingFee = true` no UWData E o estado tem `securityDeposit` configurado (nao nulo)
3. **Exclusao:** Se o programa tiver `processingFeeOverride > 0` ou `amountChargedAtSigning > 0`, o security deposit NAO e cobrado (retorna $0)

**Hierarquia de cobranca pre-assinatura (logica em `CalculatorService.getFeeToBeChargedForLead`):**

O sistema determina UMA unica taxa para cobrar antes do e-sign, nesta ordem de prioridade:
1. `amountChargedAtSigning` do programa (se > 0)
2. `processingFee` do estado (se merchant tem chargeProcessingFee habilitado)
3. `securityDeposit` do estado (fallback se os dois acima forem $0)

**Impacto no contrato:** O deposito aparece no documento de lease ("You have agreed to give us a Security Deposit in the amount of...") e e aplicado como credito no ultimo pagamento (`lastPaymentNoTaxWithFees = lastPaymentNoTaxNoFees - securityDeposit`).

### 2.3 Processing Fee (Taxa de Processamento)

**O que e:** Taxa cobrada pela UOwn pelo processamento do lease.

**Como e determinada (ordem de prioridade):**
1. Se merchant tem `chargeProcessingFee = false` -> $0
2. Se programa tem `amountChargedAtSigning > 0` -> $0
3. Se programa tem `processingFeeOverride > 0` -> usa esse valor
4. Valor configurado no StateConfigurations para o estado
5. Fallback: $0

**Impacto:** Gera um recebivel separado do tipo `PROCESSING_FEE` na conta.

### 2.4 Buyout Fee (Taxa de Compra Antecipada)

**O que e:** Taxa fixa cobrada do cliente se ele exercer a opcao de compra antecipada (EPO).

**Onde e configurado:** No merchant (`MerchantInfo.buyoutFee`, default: $0).

**Impacto:** Somado ao valor do EPO. NAO incide imposto sobre o buyout fee (imposto calculado apenas sobre o custo do produto).


## 3. Programas de Merchant (Termos do Lease)

### O Que e um Programa

Um **Merchant Program** e o template financeiro que define os termos de um lease. Cada merchant pode ter multiplos programas ativos, e o sistema seleciona o programa adequado baseado no estado do cliente, valor do carrinho e categoria.

### Campos Principais do Programa

| Campo | Descricao | Exemplo |
|-------|-----------|---------|
| `programName` | Nome legivel do programa | "Furniture 13 months" |
| `programType` | SAME_AS_CASH ou QUICK_PAY | SAME_AS_CASH |
| `termMonths` | Duracao do lease em meses | 13 |
| `moneyFactor` | Multiplicador mensal de custo | 0.15 |
| `epoDays` | Janela de compra antecipada (dias) | 90 |
| `epoFeePercent` | Taxa % sobre EPO | 0.05 |
| `dealerDiscount` | % retido do valor pago ao merchant | 5% |
| `dealerRebate` | % devolvido ao merchant como incentivo | 2% |
| `maxDollarAmount` | Valor maximo do lease | $5,000 |
| `minCartAmount` / `maxCartAmount` | Faixa de valor do carrinho | $200 - $3,000 |
| `processingFeeOverride` | Override da taxa de processamento | $49.99 |
| `states` | Estados onde o programa e valido | "CA,TX,NY,FL" |

### SAME_AS_CASH vs QUICK_PAY

| Aspecto | SAME_AS_CASH | QUICK_PAY |
|---------|-------------|-----------|
| **Conceito** | Se pagar tudo em 90 dias, paga o preco "a vista" | Paga um percentual fixo do preco original |
| **EPO** | Sim, baseado no custo original | Sim, baseado em `quickPayPct` |
| **Money Factor** | Usado para calcular contrato completo | Pode usar percentual alternativo |
| **Uso tipico** | Programa padrao para maioria dos merchants | Programa promocional simplificado |

### Como o Programa e Selecionado

1. Cliente aplica em um merchant
2. Sistema identifica o estado (do cliente se ONLINE, do merchant se INSTORE)
3. Filtra programas do merchant por: estado, tipo (`SAME_AS_CASH`), faixa de valor do carrinho, categoria
4. Se existem multiplos programas validos, a selecao considera o resultado do underwriting (segment/risk)

### Roteamento de Programa por Fluxo (Task #439)

Apos o underwriting, o sistema avalia **routing inputs** para decidir o fluxo e programa:

| Input | Descricao |
|-------|-----------|
| Banking data | Presenca de routing number + account number |
| BIN elegivel | Primeiros 6 digitos do cartao de credito atendem criterios de elegibilidade |

**Fluxos:**

| Condicao | Fluxo | Avaliacao de programa |
|----------|-------|----------------------|
| Banking data presente **E** BIN elegivel | Kornerstone | 16 meses primeiro → fallback 13 meses |
| Banking data ausente **OU** BIN nao elegivel | UOWN | Apenas 13 meses |

**Importante:** Programas sao **pre-definidos** no cadastro do merchant. O underwriting **seleciona** entre os disponiveis — nao constroi programas dinamicamente.

### Identificacao por planId (Task #439)

Cada combinacao de frequencia + termo e identificada por um `planId`:

**Formato:** `{abreviacao_frequencia}{termo_meses}`

| Frequencia | Abreviacao | Exemplo |
|------------|------------|---------|
| WEEKLY | WK | WK13, WK16 |
| BI_WEEKLY | BWK | BWK13, BWK16 |
| SEMI_MONTHLY | SM | SM13, SM16 |
| MONTHLY | MN | MN13, MN16 |

O `planId` e usado em: `SchedSummaryInfo`, redirect URL, endpoint `missing-fields`, e `SubmitApplicationService`.

### Valor Minimo do Lease (Minimum Lease Amount)

**O que e:** Valor minimo que um lease precisa ter para ser aceito pelo sistema. Protege contra leases de valor muito baixo que nao sao economicamente viaveis.

**Valor default:** `$250.00 USD` (campo `minimumLeaseAmount` em `MerchantInfo`, default `new BigDecimal("250")`).

**Configuracao por merchant:** Cada merchant pode configurar um valor minimo diferente, acima ou igual ao default. O campo e editavel na configuracao do merchant.

**Onde e validado:** No `LosRequestMessageConstraintValidator.validateMinimumLeaseValue()`, chamado em dois pontos:

| Endpoint | Quando valida |
|----------|--------------|
| `sendApplication` | Ao processar invoice dentro da aplicacao (`validateInvoiceDetails`) |
| `sendInvoice` | Ao receber nova invoice para lead existente (`validateInvoiceInformation`) |

**O que e comparado:** O sistema compara o `merchandiseSubtotal` (valor da mercadoria, sem impostos/taxas) contra o `minimumLeaseAmount` do merchant.

**Regra de validacao:**
```
SE merchandiseSubtotal < minimumLeaseAmount DO merchant:
  REJEITA com erro: "The merchandise amount requested, {valor}, is less than the minimum lease amount, {minimo}."
```

**Controle de ativacao:** Configuravel via `verifyMinimumLeaseValue` -- se desativado, a validacao e ignorada.

**Cenarios importantes:**
- Valor $249.99 em merchant com minimo $250 → **rejeitado**
- Valor $250.00 em merchant com minimo $250 → **aceito**
- Invoice cancelada + nova invoice abaixo do minimo → **rejeitada** (cada invoice e validada independentemente)
- Merchant com minimo customizado de $500 → valida contra $500, nao $250

---

## 33. Gestao de Configuracoes e Ativacao de Funcionalidades

### O Que e

O sistema possui uma camada de configuracao dinamica construida sobre Spring Cloud Context e Hazelcast, permitindo alterar configuracoes em **tempo real sem reiniciar** o servidor.

### Para Que Serve

Permite que administradores ativem/desativem funcionalidades, ajustem thresholds, modifiquem comportamento de sweeps e controlem features sem necessidade de deploy ou restart da aplicacao.

### Arquitetura de Configuracao

**Arquivo principal:** `ConfigurationManagement.java`
- Recuperacao type-safe de configuracoes (String, Integer, Long, Double, Boolean)
- Suporte a defaults duplos (producao vs. teste)
- Armazenamento distribuido via Hazelcast IMap
- Cache com `@RefreshScope` para hot-reload

### Como Alterar Configuracoes em Tempo Real

#### Via REST API (Recomendado)

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `POST /ConfigurationManagement/createOrUpdateConfig` | POST | Cria ou atualiza configuracao. Body: `{"key": "chave", "value": "valor"}` |
| `GET /ConfigurationManagement/forceReloadConfig` | GET | Forca reload de TODAS as configuracoes, limpa cache e reinjecta campos |

**Exemplo de uso:**
```
POST /ConfigurationManagement/createOrUpdateConfig
Content-Type: application/json
{"key": "sendCCPeek", "value": "true"}
```

#### Via Banco de Dados

Alterar diretamente na tabela de configuracoes e depois chamar `/forceReloadConfig`.

### Padrao de Nomes de Configuracoes

A maioria segue o padrao:
```
com.uownleasing.svc.service.{NomeDoServico}.{chaveConfig}
```

**Exemplos reais:**
- `com.uownleasing.svc.service.RewindPaymentsService.statuses.to.active.for.rewind`
- `com.uownleasing.svc.service.MissingRequiredFieldsService.items.can.be.empty.for.merchant.*`
- `com.uownleasing.svc.service.Five9Service.updateContactPreferences`
- `sendCCPeek` (controla CC Peek)
- `ccPeekOn` (liga/desliga CC Peek globalmente)
- `no.business.in.state` (estados bloqueados)
- `useTaxCloudApi` (escolha entre TaxCloud e TaxJar)
- `cancel.protection.plan` (habilita cancelamento de plano de protecao)
- `create.nsf.fee.receivable.on.rerun` (cria taxa NSF no rerun)

### Mapas Distribuidos Hazelcast

O sistema mantem tres mapas em memoria distribuida para controle de concorrencia:

| Mapa | Chave | Uso |
|------|-------|-----|
| **Application Request** | SSN -> UUID | Impede aplicacoes duplicadas simultaneas |
| **Settlement Request** | leadPk -> UUID | Impede ofertas de settlement duplicadas |
| **Authorization Request** | leadPk -> UUID | Impede autorizacoes de invoice duplicadas |

**Endpoints de gerenciamento de mapas (Admin):**
- `GET /uown/clearApplicationRequestMap` - Limpa mapa de aplicacoes
- `GET /uown/clearSettlementRequestMap` - Limpa mapa de settlements
- `GET /uown/clearAuthorizationRequestMap` - Limpa mapa de autorizacoes

### Gestao de Scheduled Tasks (Sweeps)

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `POST /uown/svc/triggerScheduledTask/{taskName}` | POST | **Dispara** um sweep manualmente agora |
| `POST /uown/svc/pauseScheduledTask/{taskName}` | POST | **Pausa** um sweep (nao executa mais ate resumir) |
| `POST /uown/svc/resumeScheduledTask/{taskName}` | POST | **Resume** um sweep pausado |
| `POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger={cron}` | POST | **Reagenda** com novo cron |
| `POST /uown/svc/deleteScheduledTask/{taskName}` | POST | **Deleta** um sweep |
| `GET /uown/svc/getAllScheduledTasks` | GET | Lista todos os sweeps com status |
| `GET /uown/svc/getScheduledTaskByName/{name}` | GET | Detalhes de um sweep especifico |
| `POST /uown/svc/updateScheduleTaskSqlByName/{name}` | POST | **Atualiza SQL** do sweep (multipart file) |

### Via Banco de Dados (Tabela `uown_scheduled_task`)

| Campo | Descricao |
|-------|-----------|
| `scheduled_task_name` | Nome identificador do sweep |
| `cron_trigger` | Expressao cron de agendamento |
| `sql_to_pick_accounts` | SQL que seleciona contas para processar |
| `is_active` | `true` = ativo, `false` = pausado |
| `template_name` | Template DMS a executar |
| `last_trigger_time` | Ultima execucao (auditoria) |

**Para pausar um sweep via banco:**
```sql
UPDATE uown_scheduled_task SET is_active = false WHERE scheduled_task_name = 'nomeSweep';
```

**Para alterar o SQL de um sweep:**
```sql
UPDATE uown_scheduled_task SET sql_to_pick_accounts = 'SELECT ...' WHERE scheduled_task_name = 'nomeSweep';
```

### Como Verificar se um Sweep Executou

**Tabela de logs:** `uown_sweep_logs`

```sql
SELECT * FROM uown_sweep_logs
WHERE sweep_name = 'nomeSweep'
ORDER BY created_date DESC
LIMIT 10;
```

Mostra: data de execucao, hostname do pod, quantidade de registros processados, erros.

---


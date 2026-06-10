# UOwn Leasing - SVC (Servicing) Platform
## Documentacao Completa de Regras de Negocio

**Plataforma:** Sistema de Lease-to-Own (Aluguel com Opcao de Compra)
**Stack:** Java 17, Spring Boot, PostgreSQL, Hazelcast
**Ultima atualizacao:** 2026-02-20

---

## Indice

1. [Visao Geral do Negocio](#1-visao-geral-do-negocio)
2. [Conceitos Financeiros Fundamentais](#2-conceitos-financeiros-fundamentais)
3. [Programas de Merchant (Termos do Lease)](#3-programas-de-merchant-termos-do-lease)
4. [Pipeline de Aplicacao (17 Steps)](#4-pipeline-de-aplicacao-17-steps)
5. [Sistema de Verificacao de Fraude e Identidade](#5-sistema-de-verificacao-de-fraude-e-identidade)
6. [Underwriting (Analise de Credito)](#6-underwriting-analise-de-credito)
7. [Calculadora de Pagamentos](#7-calculadora-de-pagamentos)
8. [Contratos e Assinatura Eletronica (E-sign)](#8-contratos-e-assinatura-eletronica-e-sign)
9. [Fila de Financiamento (Funding)](#9-fila-de-financiamento-funding)
10. [Importacao LOS para SVC](#10-importacao-los-para-svc)
11. [Pagamentos com Cartao de Credito](#11-pagamentos-com-cartao-de-credito)
12. [CC Peek (Captura Parcial de Cartao)](#12-cc-peek-captura-parcial-de-cartao)
13. [Pagamentos ACH (Debito Bancario)](#13-pagamentos-ach-debito-bancario)
14. [Pos-Pagamento e Alocacao de Recebiveis](#14-pos-pagamento-e-alocacao-de-recebiveis)
15. [EPO - Early Pay Off (Quitacao Antecipada em 90 Dias)](#15-epo---early-pay-off-quitacao-antecipada-em-90-dias)
16. [Recebiveis e Cronograma de Pagamentos](#16-recebiveis-e-cronograma-de-pagamentos)
17. [Rewind/Replay (Motor de Correcao de Pagamentos)](#17-rewindreplay-motor-de-correcao-de-pagamentos)
18. [Auto-Pay (Pagamento Automatico)](#18-auto-pay-pagamento-automatico)
19. [Rating Letters (Classificacao de Risco da Conta)](#19-rating-letters-classificacao-de-risco-da-conta)
20. [Inadimplencia e Cobranca](#20-inadimplencia-e-cobranca)
21. [Status de Conta (Account Status)](#21-status-de-conta-account-status)
22. [Status de Lead (Lead Status)](#22-status-de-lead-lead-status)
23. [Plano de Protecao (Buddy Insurance)](#23-plano-de-protecao-buddy-insurance)
24. [Taxas e Impostos (TaxCloud / TaxJar)](#24-taxas-e-impostos-taxcloud--taxjar)
25. [Five9 (Call Center e IVR)](#25-five9-call-center-e-ivr)
26. [TMS (Sistema para Agentes Telefonicos)](#26-tms-sistema-para-agentes-telefonicos)
27. [Portal do Cliente](#27-portal-do-cliente)
28. [Webhooks (Notificacoes para Merchants)](#28-webhooks-notificacoes-para-merchants)
29. [Correspondencia (Email/SMS)](#29-correspondencia-emailsms)
30. [Blacklist (Lista Negra)](#30-blacklist-lista-negra)
31. [Item Split (Divisao de Carrinho)](#31-item-split-divisao-de-carrinho)
32. [Second Opportunity (Segunda Chance)](#32-second-opportunity-segunda-chance)
33. [Gestao de Configuracoes e Ativacao de Funcionalidades](#33-gestao-de-configuracoes-e-ativacao-de-funcionalidades)
34. [Processamento em Lote (Sweeps) - Guia Completo](#34-processamento-em-lote-sweeps---guia-completo)
35. [Settlement (Acordo de Quitacao)](#35-settlement-acordo-de-quitacao)
36. [Modificacao de Invoice](#36-modificacao-de-invoice)
37. [PayWallet (Pagamentos via Folha de Pagamento)](#37-paywallet-pagamentos-via-folha-de-pagamento)
38. [Limpeza de Dados (Cleanup)](#38-limpeza-de-dados-cleanup)
39. [Validacao Pre-Assinatura (Missing Required Fields)](#39-validacao-pre-assinatura-missing-required-fields)
40. [Valores Aprovados por Segmento de Risco](#40-valores-aprovados-por-segmento-de-risco)
41. [Modificacao de Frequencia de Pagamento](#41-modificacao-de-frequencia-de-pagamento)
42. [Movimentacao de Data de Vencimento (Due Date Move)](#42-movimentacao-de-data-de-vencimento-due-date-move)
43. [RTR (Real Time Reporting / Migracao Kornerstone)](#43-rtr-real-time-reporting--migracao-kornerstone)
44. [Proget (Bloqueio de Dispositivos)](#44-proget-bloqueio-de-dispositivos)
45. [Skit.ai (Bot de Cobranca Automatizado)](#45-skitai-bot-de-cobranca-automatizado)
46. [Autenticacao de API](#46-autenticacao-de-api)
47. [CC Idempotent (Retentativa de CC Timeout)](#47-cc-idempotent-retentativa-de-cc-timeout)
48. [Gestao de Merchants (Lojistas)](#48-gestao-de-merchants-lojistas)
49. [Gestao de Leads](#49-gestao-de-leads)
50. [Painel Administrativo](#50-painel-administrativo)
51. [API de Integracao para Merchants (Full API)](#51-api-de-integracao-para-merchants-full-api)
52. [Cancelamento de Conta](#52-cancelamento-de-conta-account-cancellation)
53. [Reembolso de Pagamentos](#53-reembolso-de-pagamentos-refund-payment)
54. [Arranjo de Pagamentos](#54-arranjo-de-pagamentos-payment-arrangement)
55. [Taxa de Assinatura (Signing Fee)](#55-taxa-de-assinatura-signing-fee)
56. [Calculo de Payoff](#56-calculo-de-payoff-payoff-amount)
57. [Taxa NSF por Estado](#57-taxa-nsf-por-estado-nsf-fee)
58. [Gestao de AutoPay e Instrumentos Financeiros](#58-gestao-de-autopay-e-instrumentos-financeiros)
59. [Alteracao de Valor de Aprovacao](#59-alteracao-de-valor-de-aprovacao-approval-amount-override)
60. [Lease Adicional (Add Lease)](#60-lease-adicional-add-lease)
61. [Gestao de Consentimento](#61-gestao-de-consentimento-consent-management)
62. [Continuacao e Finalizacao de Aplicacao](#62-continuacao-e-finalizacao-de-aplicacao)
63. [Redirect de E-sign e Pos-Assinatura](#63-redirect-de-e-sign-e-pos-assinatura)
64. [Verificacao de Endereco (Melissa Data)](#64-verificacao-de-endereco-melissa-data)
65. [Geolocalizacao por CEP](#65-geolocalizacao-por-cep)
66. [Convite para Portal do Cliente](#66-convite-para-portal-do-cliente)
67. [Auditoria de Modificacoes de Funding](#67-auditoria-de-modificacoes-de-funding)
68. [Ajuste de Data do Primeiro Pagamento](#68-ajuste-de-data-do-primeiro-pagamento-first-payment-due-date)
69. [Elegibilidade para Auto Paid-Out](#69-elegibilidade-para-auto-paid-out)
70. [Regras Detalhadas de Calculo EPO por Estado](#70-regras-detalhadas-de-calculo-epo-por-estado)

**Deep Dive:**
71. [Produto Lease — Deep Dive Tecnico](12-produto-lease-deep-dive.md) *(formulas com precisao decimal, alocacao de pagamentos, importacao LOS→SVC, rewind/replay, sweeps, CC/ACH lifecycle, SMS rules, customer portal, merchant config flags, blacklist, funding lifecycle, invoice modification)*

**Apendices:**
- [Apendice A: Integracoes com Terceiros](#apendice-a-integracoes-com-terceiros)
- [Apendice B: Referencia Rapida de Endpoints](#apendice-b-referencia-rapida-de-endpoints-para-ativacao)
- [Apendice C: Tabelas de Banco Importantes](#apendice-c-tabelas-de-banco-importantes-para-verificacao)
- [Apendice D: Constantes de Negocio e Enumeracoes](#apendice-d-constantes-de-negocio-e-enumeracoes)
- [Apendice E: Referencia de Campanhas de Underwriting](#apendice-e-referencia-de-campanhas-de-underwriting)

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

---

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

---

## 4. Pipeline de Aplicacao (17 Steps)

### Visao Geral

Quando um cliente submete uma aplicacao, ela passa por um **pipeline sequencial de 17 steps**. Se qualquer step retornar `DECLINED`, o pipeline **para imediatamente** -- steps seguintes nao executam.

### Controle de Concorrencia

O sistema mantem um `ConcurrentHashMap` indexado por SSN. Se ja existe uma aplicacao em andamento para o mesmo SSN, retorna erro `"Application already in progress"`. O SSN e removido do mapa em um bloco `finally`.

### Ordem Configuravel por Client Type

A ordem dos steps e configuravel por tipo de merchant via:
```
application.steps.{ClientType} = "stateCheck, merchantAutoDenyCheck, ..."
```

Isso permite que merchants especificos pulem ou reordenem steps conforme necessidade do negocio.

### Toggles Individuais por Step

Cada step pode ser habilitado/desabilitado individualmente via configuracao:

| Config | Step | Default |
|--------|------|---------|
| `check.valid.states` | State Check | true |
| `check.black.list` | Blacklist Check | true |
| `check.for.previous.denied.uw` | Previous UW Denied | true |
| `check.for.previous.signed` | Future FPD Check | true |
| `check.duplicate.info` | Duplicate Check | true |
| `check.previous.leads.for.delinquency` | Eligible for Reapproval | true |
| `check.neuroid.on.send.application` | NeuroID Check | true |

### Step 1: State Check (Verificacao de Estado)

**O que e:** Verifica se a UOwn opera no estado do cliente e se existem programas de lease disponiveis naquele estado.

**Para que serve:** Compliance regulatorio -- alguns estados proibem ou restringem operacoes de lease-to-own.

**Como funciona para o usuario interno:** Configuravel via `no.business.in.state` (default: NJ, VT, MN, ME). Admins podem adicionar/remover estados bloqueados sem deploy.

**Como afeta o cliente:** Cliente recebe mensagem "We do not offer leasing in {estado}".

**Resultado se negado:** Status `DENIED`, interno `NO_BUSINESS_IN_STATE` ou `NO_PROGRAM_IN_STATE`. Sem email de negacao.

### Step 2: Merchant Auto Deny

**O que e:** Verifica se o merchant foi sinalizado para negar automaticamente todas as aplicacoes.

**Para que serve:** Usado quando um merchant e suspenso, desativado ou investigado por fraude. Permite bloquear novas aplicacoes sem desativar o merchant completamente.

**Como funciona para o usuario interno:** Admin ativa a flag `autoDenyApplication = TRUE` no cadastro do merchant.

**Como afeta o cliente:** Cliente recebe negacao generica "Denied". Sem email de negacao.

**Resultado:** Status `DENIED`, interno `MERCHANT_AUTO_DENIED`.

### Step 3: Source Check (Verificacao de Fonte de Trafego)

**O que e:** Negacao **probabilistica** baseada na fonte/canal de trafego do cliente. Certas categorias de trafego tem taxas de negacao configuradas.

**Para que serve:** Controle de qualidade de trafego. Se uma campanha de marketing especifica gera muita fraude, a taxa de negacao pode ser aumentada sem desligar a campanha inteira.

**Como funciona:** Gera um numero aleatorio e compara com a taxa de negacao da categoria. Ex: categoria "111706798993" tem 80% de negacao -- 8 em cada 10 aplicacoes dessa fonte sao negadas.

**Aplicavel apenas a:** Merchants do tipo `BUY_ON_TRUST` (configuravel).

**Resultado se negado:** Status `DENIED`, interno `SOURCE_INELIGIBLE`. Sem email de negacao.

### Step 4: Blacklist Check (Verificacao de Lista Negra)

**O que e:** Verifica se os dados pessoais do cliente correspondem a qualquer entrada na lista negra de fraude.

**Para que serve:** Prevencao de fraude. Clientes previamente identificados como fraudadores sao impedidos de aplicar novamente.

**Campos verificados:** Nome, sobrenome, email, celular, SSN, CEP, numero de conta bancaria, routing number, endereco.

**Como funciona para o usuario interno:** Agentes podem adicionar/remover entradas na blacklist via Admin Panel. Tambem podem blacklistar um lead inteiro (todos os dados de uma vez).

**Como afeta o cliente:** Cliente recebe "Fraud check failed". **Sem email de negacao** (para nao alertar fraudadores).

**Resultado:** Status `DENIED`, interno `BLACKLIST_DENIED`.

### Step 5: Data Mismatch Check (Verificacao de Divergencia de Dados)

**O que e:** Compara dados da aplicacao atual com dados de aplicacoes anteriores do mesmo cliente. Detecta mudancas suspeitas de nome, endereco, etc.

**Para que serve:** Fraude por impersonacao -- alguem usando o SSN de outra pessoa pode mudar nome/endereco para receber a mercadoria.

**Ativado por:** Codigos de merchant especificos ou flag por `clientName`.

**Resultado se divergencia:** Status `DENIED`, **email de negacao enviado**.

### Step 6: Previous Leads (Busca de Leads Anteriores)

**O que e:** Busca e cancela leads anteriores do mesmo cliente, calculando quanto da aprovacao ja foi consumida.

**Para que serve:** Garante que um cliente nao tenha multiplos leads ativos e calcula credito remanescente.

**IMPORTANTE:** Este step **NUNCA nega**. E puramente de coleta de dados.

**Efeitos:** Leads anteriores sao cancelados. `consumedApprovalAmount` e calculado para uso em steps posteriores.

### Step 7: Previous UW Denied (UW Anterior Negado)

**O que e:** Verifica se o cliente ja foi negado pelo underwriting anteriormente.

**Para que serve:** Evita reprocessamento desnecessario -- se o cliente foi negado recentemente, nao faz sentido rodar UW novamente (a menos que haja override).

**Resultado se negado:** Status `UW_DENIED`, **email de negacao enviado**.

### Step 8: Future FPD Check (Lease Assinado com Pagamento Futuro)

**O que e:** Impede nova aplicacao se o cliente tem um lease assinado cuja primeira data de pagamento (FPD) ainda esta no futuro.

**Para que serve:** Previne que o cliente obtenha multiplos leases simultaneamente antes que o primeiro comece a gerar pagamentos.

**Condicoes de negacao (TODAS devem ser verdadeiras):**
- Lead anterior com status `SIGNED`
- `accountPk` e null (ainda nao virou conta)
- `firstPaymentDueDate` e posterior a hoje

**Resultado:** Status `DENIED`, interno `SIGNED_FPD_IN_FUTURE`. Sem email.

### Step 9: Duplicate Check (Verificacao de Duplicidade)

**O que e:** Verifica se o cliente tem multiplas aplicacoes usando o mesmo email, telefone ou dados bancarios.

**Para que serve:** Previne abuso -- um mesmo individuo tentando obter multiplos leases usando variantes de contato.

| Verificacao | Limite Default | O que acontece |
|-------------|---------------|----------------|
| Emails duplicados | 3 usos | `EMAIL_COUNT_FAILED` |
| Telefones duplicados | 3 usos | `PHONE_COUNT_FAILED` |
| Contas duplicadas por email | Via servico | `{status}_DUP_EMAIL` |
| Contas duplicadas por telefone | Via servico | `{status}_DUP_PHONE` |
| Contas duplicadas por banco | Via servico | `{status}_DUP_BANK_INFO` |

### Step 10: Eligible for Reapproval (Elegibilidade para Re-aprovacao)

**O que e:** Verifica se um cliente que ja tem contas existentes esta inadimplente nelas.

**Para que serve:** Impede que clientes inadimplentes obtenham novos leases.

**Como funciona:** Se o cliente tem contas existentes, verifica se alguma esta em atraso. Se sim, nega com "Ineligible for re-approval".

### Step 11: NeuroID Check (Biometria Comportamental)

**O que e:** Analisa **como** o cliente preencheu o formulario (velocidade de digitacao, movimentos de mouse, padroes de copiar/colar, hesitacoes). Descrito em detalhes na secao 5.

### Step 12: Underwriting (Analise de Credito)

Descrito em detalhes na secao 6.

### Step 13: Invoice Placeholder

**O que e:** Para merchants especificos (ex: `SYNCHRONY`), cria uma invoice usando o valor de aprovacao como total do pedido.

**Para que serve:** Alguns merchants nao enviam invoice antecipadamente. O sistema cria um placeholder para que o calculo possa prosseguir.

### Step 14: Calculate Max Approval (Calculo de Valor Maximo)

**O que e:** Calcula o valor maximo de aprovacao considerando credito ja consumido em leads anteriores.

**Resultado se <= 0:** Negado com "No credit remaining", interno `NO_REMAINING_AMOUNT`.

### Step 15: Compare Cost Check (Comparacao Custo vs Aprovacao)

**O que e:** Compara o custo do carrinho com o valor de aprovacao.

| Cenario | Resultado |
|---------|-----------|
| Custo <= aprovacao | Passa |
| Custo > aprovacao, elegivel para item split | Passa com flag para split |
| Client type isento (PAY_TOMORROW, TIRE_AGENT, PAY_POSSIBLE) | Passa sem checagem |
| Custo > aprovacao, sem split | Negado, mas cliente recebe notificacao de aprovacao |

### Step 16: Item Split (Divisao de Carrinho)

Descrito em detalhes na secao 31.

### Step 17: Calculator (Calculadora de Pagamentos)

Descrito em detalhes na secao 7.

---

## 5. Sistema de Verificacao de Fraude e Identidade

### Visao Geral da Estrategia de Defesa

A UOwn utiliza uma estrategia de **defesa em camadas** com multiplos servicos terceirizados, cada um verificando um angulo diferente. Nenhum servico decide sozinho -- a combinacao de resultados forma a decisao final.

### 5.1 Sentilink (Deteccao de Identidade Sintetica)

**O que e:** Servico especializado em detectar **identidades sinteticas** (identidades fabricadas misturando dados reais e falsos de diferentes pessoas) e **roubo de identidade** (uso dos dados de outra pessoa real).

**Para que serve:** Fraude de identidade sintetica e o tipo de fraude financeira que mais cresce. Identidades sinteticas podem passar em verificacoes de credito tradicionais porque constroem historico real ao longo do tempo. O Sentilink detecta o que bureaus de credito nao conseguem.

**Quando roda:** Primeiro step do engine de UW -- se a identidade e falsa, nao faz sentido rodar os demais checks.

**Dados enviados:** Nome, sobrenome, data de nascimento, SSN, email, telefone, endereco completo.

**Tres scores analisados:**
- **Synthetic Score** -- probabilidade da identidade ser fabricada
- **Identity Theft Score** -- probabilidade de impersonacao
- **Abuse Score** -- probabilidade de fraude de primeira pessoa (aplica com dados proprios mas intencao de default)

**Configuracao:** Thresholds sao **por merchant** -- diferentes merchants toleram diferentes niveis de risco. Resultados anteriores podem ser reutilizados dentro de uma janela configuravel de dias.

**Possiveis resultados:** APPROVE, DECLINE (score acima do threshold), SSN_TYPO (SSN parece manipulado), ERROR.

### 5.2 Neustar (Verificacao de Dados de Contato)

**O que e:** Plataforma de inteligencia de dados que cruza telefone, email, endereco e nome do cliente contra bases massivas de telecom e dados de consumidores.

**Para que serve:** Fraudadores nao conseguem montar um conjunto perfeitamente consistente de dados de contato. O telefone pode ser pre-pago, o endereco nao corresponde aos registros da operadora, ou o email foi criado dias antes. O Neustar detecta essas inconsistencias.

**Quando roda:** Segundo step do engine de UW.

**Verificacoes realizadas (cada uma pode negar independentemente):**
- Telefone nao corresponde ao nome
- Endereco nao corresponde ao telefone
- Email nao corresponde ao telefone
- Email nao corresponde ao nome
- Telefone e pre-pago/burner
- Tempo de servico do telefone muito curto
- Uso do telefone muito baixo (2 meses)
- Mudanca de nome recente suspeita
- Email invalido ou muito novo
- Endereco invalido (USPS), vago, ou de prisao
- Falha na validacao DPV (Delivery Point Validation)

**Configuracao:** Cada verificacao pode ser habilitada/desabilitada por merchant. Thresholds por merchant.

### 5.3 LexisNexis (Risco de Identidade e Registros Publicos)

**O que e:** Servico de score de risco baseado em registros publicos, registros judiciais, registros de propriedade e dados de credito.

**Para que serve:** Adiciona uma camada que nem Sentilink nem Neustar cobrem: analise profunda de registros publicos. Detecta se um SSN foi emitido recentemente (possivelmente a um menor), se o candidato tem historico de fraude em registros judiciais, ou se multiplas aplicacoes vem de enderecos ligados a fraude conhecida.

**Quando roda:** Terceiro step do engine de UW.

**Possiveis resultados:** PASS (score abaixo do threshold), FAIL -> `LEXISNEXIS_DENIED`, ERROR.

### 5.4 SEON (Motor de Fraude Digital)

**O que e:** Motor de fraude que analisa a **pegada digital** do candidato -- email, telefone, IP e device fingerprint.

**Para que serve:** Captura a "camada digital" da fraude. Um fraudador pode ter montado uma identidade convincente no papel, mas seu comportamento digital o trai: usando VPN de outro pais, email temporario criado no mesmo dia, telefone VoIP, ou nenhuma presenca em redes sociais.

**Quando roda:** Quarto e ultimo step do engine de UW -- atua como rede de seguranca final.

**O que analisa:**
- **Email:** Vinculado a redes sociais? Idade? Provedor descartavel? Score de fraude?
- **Telefone:** Real? Vinculado a redes sociais? Numero VoIP?
- **IP:** VPN, proxy ou Tor? Geolocalizacao? IP de data center?
- **Device fingerprint:** Comportamento do dispositivo/navegador

**Quatro scores independentes:** Email, IP, telefone e score geral de fraude, cada um com threshold **por merchant**.

### 5.5 NeuroID (Biometria Comportamental)

**O que e:** Analisa **como** o candidato preenche o formulario de aplicacao, nao **o que** ele digita.

**Para que serve:** Inovacao em deteccao de fraude. Um fraudador pode ter a identidade roubada perfeita com documentos correspondentes, mas nao consegue replicar os padroes comportamentais da pessoa real. Alguem digitando seu proprio nome e SSN de memoria se comporta fundamentalmente diferente de alguem lendo de uma tela ou colando de um banco de dados.

**O que monitora:**
- Velocidade e ritmo de digitacao
- Padroes de movimento de mouse
- Padroes de hesitacao (pausa antes de digitar SSN, como se estivesse lendo de algum lugar)
- Comportamento de copiar/colar
- Padroes de interacao com o dispositivo

**Quando roda:** O SDK JavaScript coleta dados durante o preenchimento do formulario. A verificacao e consultada durante a submissao.

**Possiveis resultados:** APPROVE, DECLINE, PROFILE_NOT_FOUND (JS desabilitado), ERROR.

### 5.6 Intellicheck (Autenticacao de Documento de Identidade)

**O que e:** Servico de autenticacao de documentos de identidade que le o **codigo de barras** na parte traseira de carteiras de motorista e IDs.

**Para que serve:** Fraudadores podem criar IDs visualmente convincentes, mas acertar a codificacao do codigo de barras no padrao exato do estado emissor e extremamente dificil. O Intellicheck detecta documentos forjados, alterados e falsificados.

**Como o cliente usa:** Durante a submissao da aplicacao, o cliente fotografa a frente e o verso de sua carteira de motorista. As imagens sao enviadas ao Intellicheck.

**O que verifica:**
- Dados do codigo de barras sao consistentes com a frente do documento
- Formato do documento corresponde ao padrao do estado emissor
- Documento nao esta expirado
- Sem sinais de adulteracao

**Verificacao adicional:** Apos o Intellicheck, o sistema faz **fuzzy name matching** entre o nome no documento e o nome na aplicacao, e opcionalmente verifica data de nascimento.

### 5.7 SEON ID (Verificacao de ID via SEON)

**O que e:** Alternativa ao Intellicheck. O cliente fotografa seu ID e o SEON extrai dados e verifica correspondencia.

**Verificacoes:** Nome corresponde? Estado corresponde? CEP corresponde? Data de nascimento corresponde?

**Configuracao:** Merchant escolhe entre Intellicheck ou SEON ID via flags `isIntellicheckRequired` e `isSeonIdCheckRequired`.

### 5.8 Kount (Fraude de Cartao de Credito)

**O que e:** Servico de deteccao de fraude para transacoes de cartao de credito. Avalia o risco **antes** de cobrar o cartao.

**Para que serve:** Mesmo apos aprovar a aplicacao, a UOwn precisa garantir que o cartao usado para pagamento nao e roubado. O Kount previne chargebacks e fraude de pagamento.

**Quando roda:** No momento do **pagamento** (nao durante a aplicacao). Tanto para novos leads quanto para contas existentes.

**O que analisa:**
- BIN do cartao (primeiros 6 digitos) e ultimos 4
- Sessao do dispositivo (fingerprint via SDK JavaScript)
- IP do pagador
- Nome, endereco, email e data de nascimento do titular
- Valor e detalhes da transacao

**Possiveis resultados:** APPROVE (risco baixo), DECLINE (risco alto), ERROR.

**Cache inteligente:** Verifica se ja existe decisao recente para a mesma pessoa + cartao. Se sim, reutiliza sem nova chamada de API.

### 5.9 Plaid (Verificacao Bancaria e de Renda)

**O que e:** Servico que se conecta diretamente a **conta bancaria** do cliente (com permissao dele) para verificar propriedade, renda, e saude financeira.

**Para que serve:** Verificacoes de credito tradicionais perdem muitos clientes com credito limitado (thin-file). O Plaid fornece dados alternativos baseados em transacoes bancarias reais para determinar capacidade de pagamento.

**Quando roda:** **Condicionalmente** -- apenas quando:
1. Merchant habilitou Plaid (`isPlaidVerificationRequired`)
2. Underwriting colocou o lead em "lambda segment" dentro de uma faixa configurada
3. Status do lead e `UW_REVIEW` (underwriting incerto)

Ou seja, Plaid e um **mecanismo de segunda chance** para candidatos na zona cinzenta.

**Como o cliente usa:**
1. Recebe link para conectar seu banco via widget do Plaid
2. Autentica com suas credenciais bancarias
3. Plaid analisa 180 dias de historico bancario

**Possiveis resultados:** PLAID_SUCCESS (aprovado via banco), PLAID_FAILED (negado), PLAID_ABANDONED (cliente desistiu), PLAID_ERROR.

### Ordem de Execucao Completa

```
PREENCHIMENTO DO FORMULARIO
  -> NeuroID coleta biometria comportamental silenciosamente

UPLOAD DE ID
  -> Intellicheck OU SEON ID autentica documento

SUBMISSAO (Engine de UW)
  1. Sentilink -> Identidade sintetica/roubada?
  2. Neustar   -> Dados de contato consistentes?
  3. LexisNexis -> Red flags em registros publicos?
  4. SEON Fraud -> Pegada digital indica fraude?

DECISAO DE CREDITO
  -> Se engine passa: roda BlackBox (modelo de credito)
  -> Se BlackBox incerto: Plaid como segunda chance

PAGAMENTO
  -> Kount pre-autoriza transacao de cartao
```

---

## 6. Underwriting (Analise de Credito)

### O Que e Underwriting

Apos os checks de fraude passarem, o sistema avalia a **capacidade de credito** do cliente. Tres engines de decisao estao disponiveis:

| Engine | Descricao | Prioridade |
|--------|-----------|------------|
| **GDS** | Motor de decisao externo | 1 (se habilitado) |
| **Taktile** | Motor de decisao alternativo | 2 (se habilitado) |
| **ABB** | Motor de decisao padrao (BlackBox) | Default |

### Decisao de Rodar vs Reusar UW

| Condicao | Acao |
|----------|------|
| Lead status: NEW, EXPIRED, PENDING_UW, UW_DENIED, UW_ERROR | Roda UW novo |
| Dados de UW nao existem | Roda UW novo |
| Aprovacao expirada | Roda UW novo |
| Caso contrario | Reusa UW anterior |

### Skip UW (Bypass para Merchants Especificos)

Alguns merchants podem pular o UW inteiramente. Condicoes (TODAS devem ser verdadeiras):
- `clientType` na lista de skip-UW
- Threshold check nao requerido OU lead atende threshold
- Score check nao requerido OU lead tem score

Resultado do skip: `decision = "ACCEPT"`, `creditLimit = loanAmount`.

### Expiracao da Aprovacao

`approvalExpirationDate = hoje + merchant.numDaysApprovalExp dias`

### Selecao de Programa e Roteamento (13 vs 16 Meses) — Task #439

Apos a decisao de credito, o underwriting avalia **routing inputs** para determinar qual fluxo e programa usar:

**Routing Inputs:**
1. Presenca de dados bancarios (routing number + account number)
2. Elegibilidade do BIN do cartao de credito (primeiros 6 digitos)

**Cenarios de Roteamento:**

| Cenario | Condicao | Fluxo | Programa |
|---------|----------|-------|----------|
| 1 | Banking data presente **E** BIN elegivel | **Kornerstone** | Avalia 16 meses primeiro, fallback para 13 meses |
| 2 | Banking data ausente **OU** BIN nao elegivel | **UOWN** | Apenas 13 meses |

**Regras importantes:**
- Programas sao **pre-definidos** — o underwriting **seleciona**, nao constroi
- No cenario Kornerstone, se o programa de 16 meses nao atende os criterios (valor, estado, etc.), cai para 13 meses automaticamente
- A selecao de programa usa `planId` (novo formato) para identificar unicamente a combinacao frequencia + termo
- O `planId` e composto por: abreviacao da frequencia + termo em meses (ex: `WK13`, `BWK16`, `SM13`, `MN16`)

**Formato do planId:**

| Frequencia | Abreviacao | Exemplo 13m | Exemplo 16m |
|------------|------------|-------------|-------------|
| WEEKLY | WK | WK13 | WK16 |
| BI_WEEKLY | BWK | BWK13 | BWK16 |
| SEMI_MONTHLY | SM | SM13 | SM16 |
| MONTHLY | MN | MN13 | MN16 |

**Impacto no backend:**
- `planId` adicionado ao `SchedSummaryInfo`
- `setMerchantProgramForLead` removido do `UnderwritingService` (programas pre-selecionados)
- `buildScheduleForFrequency` agora gera `planId` = frequencia + termo
- `SubmitApplicationService` usa `planId` para localizar o `PaymentOption` correto
- Redirect URL atualizado para incluir `planId`

### Campanhas Peak/Off-Peak

Em producao, entre `peakStartHour` e `peakEndHour` usa `peakCampaignId`, senao usa `offPeakCampaignId`. Em ambientes de teste, sempre usa peak.

---

## 7. Calculadora de Pagamentos

### O Que Faz

Calcula o cronograma completo de pagamentos do lease: valor de cada parcela, numero de parcelas, EPO, taxas, impostos, e URL de redirecionamento.

### Formulas Principais

```
baseCost = totalInvoiceAmount - taxAmount - depositAmount
contractAmountBeforeTax = baseCost * moneyFactor * termMonths
contractAmountAfterTax = contractAmountBeforeTax + contractTax + processingFee - companyDiscount
regularPayment = contractAmountBeforeTax / numberOfPayments
```

### Numero de Parcelas por Frequencia

| Frequencia | Abreviacao (planId) | Como e determinado |
|------------|--------------------|--------------------|
| WEEKLY | WK | Config `numOfPayments.{term}.WEEKLY` |
| BI_WEEKLY | BWK | Config `numOfPayments.{term}.BI_WEEKLY` |
| SEMI_MONTHLY | SM | Config `numOfPayments.{term}.SEMI_MONTHLY` |
| MONTHLY | MN | `termMonths` (se nenhum config) |

### planId no Calculo (Task #439)

A calculadora agora gera um `planId` para cada combinacao de frequencia + termo via `buildScheduleForFrequency`. O `planId` e incluido no `SchedSummaryInfo` retornado e segue o formato `{abreviacao}{termo}` (ex: `WK13`, `BWK16`).

O `planId` permite que o `SubmitApplicationService` localize o `PaymentOption` exato, substituindo a busca apenas por `selectedPaymentFrequency`. Ambos os parametros continuam funcionando para compatibilidade.

### Calculo do EPO

```
epoStartDate = firstPaymentDate ou hoje
epoExpiry = startDate + meses configurados ou epoDays do programa
epoAmount = costWithFeesNoTax + epoFeeAmount + buyoutFee
```

**Termo especial de 16 meses (configuravel via `changeEpoForTermMonths`):**
```
totalMoneyFactor = moneyFactor * termMonths   (ex: 0.15 * 16 = 2.40)
leaseAmount = (baseCost * totalMoneyFactor) - baseCost
leaseDays = dias totais do lease (calculado a partir de firstPaymentDate, numOfPayments e frequency)
dailyLeaseAmount = leaseAmount / leaseDays
epoAmount = baseCost + (dailyLeaseAmount * epoDays) + processingFee + epoFeeAmount + buyoutFee
```

**Nota:** O `moneyFactor` usado nesta formula e o fator **total** do contrato (`moneyFactor * termMonths`), NAO o fator mensal.

### Pagamento Minimo Final (Especifico por Estado)

Certos estados (ex: NC) exigem que o ultimo pagamento nao seja inferior a um percentual do custo base (default: 11%).

---

## 8. Contratos e Assinatura Eletronica (E-sign)

### Fluxo de Contrato

1. **Contrato gerado** com numero `UOWN_<random>_<leadPk>`
2. **Template selecionado** por estado (INSTORE = estado merchant, ONLINE = estado cliente)
3. **Enviado para e-sign** via SignWell (default) ou PandaDoc
4. **Cliente assina** eletronicamente
5. **CC Peek consent** e extraido do documento assinado
6. **Lead atualizado** para SIGNED
7. **Contratos anteriores** com status SENT sao cancelados

### Mapeamento Status E-sign -> Status Contrato

| E-sign | Contrato |
|--------|----------|
| SENT_TO_CUSTOMER, IN_PROGRESS, VIEWED | `SENT` |
| COMPLETED, SIGNED | `SIGNED` |
| CANCELLED | `CANCELLED` |
| ERROR | `ERROR` |
| EXPIRED | `EXPIRED` |

### Auto-Move para Funding

Se merchant tem `isSignedToFunding = true`, apos assinatura o lead move automaticamente para `FUNDING`.

---

## 9. Fila de Financiamento (Funding)

### O Que e Funding

Funding e o processo pelo qual **a UOwn paga o merchant** pelo produto que o cliente levou. E o momento em que a UOwn assume o risco financeiro.

### Como o Merchant e Pago

```
Valor liquido ao merchant = Invoice Amount
  - Dealer Discount (% retido)
  - Platform Fee (% da UOwn, default 2%)
  - CC Processing Fee (% de processamento)
  + Dealer Rebate (% devolvido como incentivo)
```

### Transicoes de Status

```
FUNDING ──────> FUNDED ──────> REQUEST_REFUND ──────> REFUNDED
    ^               |
    └───────────────┘
    (Reversao: FUNDED -> FUNDING)
```

| Transicao | O que acontece |
|-----------|---------------|
| -> FUNDING | Lead importado para SVC, conta criada, `fundRequestDateTime` registrado |
| FUNDING -> FUNDED | Merchant recebeu pagamento, transacao FUNDED criada, lead -> FUNDED |
| FUNDED -> FUNDING | Reversao (erro), status revertido |
| REQUEST_REFUND -> REFUNDED | Dinheiro clawback do merchant |

### Mudanca de Invoice Apos Funding

| Se lead em | Acao |
|-----------|------|
| FUNDING | Transacoes existentes canceladas, novas criadas |
| FUNDED | Transacao REQUEST_REFUND criada |

---

## 10. Importacao LOS para SVC

### O Que Acontece

Quando um lead e financiado, seus dados sao importados do sistema de originacao (LOS) para o sistema de servicing (SVC), criando uma conta ativa.

### Dados Importados

Conta, clientes, enderecos, emails, telefones, emprego, contas bancarias (deduplicadas), transacoes CC (apenas APPROVED), recebiveis, plano de protecao.

### Regras Especiais

| Regra | Detalhe |
|-------|---------|
| Termo 16 meses | EPO desabilitado (`earlyPayoffDateExpiry = hoje`) |
| Security deposit > 0 | Pagamento tipo `DEPOSIT` |
| Email de boas-vindas | Enviado apos importacao |
| Conta cancelada apos update | Trigger cancelamento com reembolso |

---

## 11. Pagamentos com Cartao de Credito

### Fluxo de Autorizacao

1. **Pre-autorizacao Kount** (verificacao de fraude)
2. Se Kount DECLINED -> transacao negada, sem chamada ao gateway
3. **Token do gateway** obtido se necessario
4. **Chamada ao gateway** para autorizar/cobrar
5. **Processamento da resposta** (token, auth code, decision)

### Deteccao de NSF (Fundos Insuficientes)

Uma transacao e marcada como NSF se:
- Mensagem contem "Insufficient funds"
- Codigo de erro em "50051, 57852"
- Ultimos 2 digitos do codigo = "51"

### Rerun de CC (Retentativa)

| Situacao | Acao |
|----------|------|
| Primeiro rerun | Cria receivable de NSF fee + transacao separada RERUN_NSF |
| Reruns seguintes | Incrementa numberOfTries |
| Past due rerun | Se aprovado, tenta cobrar recebiveis vencidos ate limite de $10,000 |

### Daily Denied Rerun (Retentativa Automatica Diaria)

Executa diariamente, retentando CCs negados/erro do dia. Exclui permanentemente: cartoes expirados, numeros invalidos, contas fechadas, cartoes roubados.

---

## 12. CC Peek (Captura Parcial de Cartao)

### O Que e

CC Peek e um mecanismo que permite cobrar o cartao do cliente por **menos que o valor total** quando o cartao nao tem saldo suficiente, em vez de falhar a transacao inteira.

### Para Que Serve

Sem CC Peek, uma cobranca de $200 em um cartao com $150 disponiveis falha completamente (coleta $0). Com CC Peek, o gateway "espia" o saldo disponivel, captura $150, e o sistema depois retenta os $50 restantes. Isso reduz inadimplencia e melhora o fluxo de caixa.

### Como o Consentimento e Capturado

1. **Na assinatura do contrato:** Documento e-sign contem checkboxes `preauthyes` e `preauthno`
2. **Default:** Consentimento = `true` (se o cliente nao marcar `preauthno`)
3. O `EsignService` salva o consentimento no lead e depois na conta

### Quando CC Peek e Ativado

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Config `sendCCPeek` = true |
| Conta tem `ccPeekConsent = true` |
| Config `ccPeekOn` = true |
| Nao e transacao same-day request (tem toggle proprio) |

### Impacto na Retentativa

Se uma transacao CC Peek foi aprovada mas capturou valor parcial, o rerun e feito pelo valor restante: `rerunAmount = originalAmount - capturedAmount`.

### Como Modificar o Consentimento

Agentes internos podem alterar o CC Peek consent via `ServicingInformationService`. Toda mudanca e registrada em activity log.

---

## 13. Pagamentos ACH (Debito Bancario)

### O Que e

ACH (Automated Clearing House) e o sistema americano de transferencia bancaria. A UOwn debita valores diretamente da conta bancaria do cliente via Profituity (processador ACH).

### Criacao de Pagamento ACH

| Validacao | Detalhe |
|-----------|---------|
| Bank data obrigatorio | Erro se null |
| Auto-pay default | `false` se null |
| Nome do cliente | Preenchido automaticamente se vazio |
| Tipo de conta default | CHECKING |

### Rating Letter via Customer Portal

Se o pagamento e do tipo REQUEST, com data futura, feito pelo "customer portal": rating atualizada para `P` (Promise to pay).

### NSF Fee no ACH

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Config `create.nsf.fee.receivable.on.rerun` = true |
| Tipo: SCHEDULED |
| Nao e rerun (originalACHPk = null) |
| Primeira tentativa (numberOfTries = 1) |

**Valor:** Especifico por estado (StateConfigurations), fallback $15.00. INSTORE = estado merchant, ONLINE = estado cliente.

### Reembolso ACH

Cria novo pagamento com `achType = ACHCredit`. Se parcial, cria novo PAID com restante.

---

## 14. Pos-Pagamento e Alocacao de Recebiveis

### Estrategias de Alocacao

| Estrategia | Comportamento |
|------------|--------------|
| DEFAULT | Aloca para recebiveis vencidos e proximo a vencer |
| EPO_ONLY | Aloca apenas ao recebivel EPO |
| Catch-all | Aloca para TODOS os recebiveis nao pagos |

### Pagamento Sem Recebivel

Se nao ha recebivel para alocar: cria alerta "Payment received but is not allocated to any receivable or epo".

---

## 15. EPO - Early Pay Off (Quitacao Antecipada em 90 Dias)

### O Que e

EPO e a opcao que permite ao cliente **quitar o lease antecipadamente pagando o valor original do produto** (ou proximo disso) dentro de uma janela de tempo limitada -- tipicamente 90 dias. E o diferencial do modelo "Same as Cash".

### Para Que Serve (Beneficio ao Cliente)

O custo total do lease (com money factor) e significativamente maior que o preco original. Exemplo: um produto de $1.000 pode custar $1.800 no lease de 12 meses. Se o cliente pagar ~$1.000 + taxas dentro de 90 dias, ele economiza ~$800.

### Elegibilidade para EPO de 90 Dias

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Recebivel EPO ativo deve existir |
| `earlyPayoffDateExpiry` nao expirou |
| Override nao definida (ou override = true) |
| Estado em bypass list (CA): pula verificacao de atraso |
| Delinquency-as-of date nao anterior a hoje |
| Sem transacoes de pagamento em atraso |

### Calculo do EPO (Cascata por Estado)

| Prioridade | Regra |
|------------|-------|
| 1 | Desconto estadual sobre valor pago |
| 2 | Desconto estadual sobre saldo restante |
| 3 | Percentual estadual sobre saldo restante |
| 4 | Formula estados (CA, HI, NY, WV): `EPO = cost * (remainingPayments / totalPayments)` |
| 5 | Desconto do programa ou percentual global |

**NC:** EPO nao pode ser menor que a ultima parcela.

### EPO Kornerstone (Formula Especial)

```
kwBuyout = EpoNoTax - ((TotalPaid - PPFees - OtherFees) / MoneyFactor) + PastDueRegular
```

### O Que Acontece Quando EPO e Quitado

1. Todos os pagamentos sao **rewound** (desfeitos)
2. Pagamentos realocados ao recebivel EPO
3. EPO marcado como `PAID_IN_FULL`
4. Status da conta -> `PAID_OUT_EARLY_EPO`
5. Data de quitacao registrada
6. Se houve overpayment: alerta criado

---

## 16. Recebiveis e Cronograma de Pagamentos

### Tipos de Recebiveis

| Tipo | Descricao | Quando criado |
|------|-----------|---------------|
| `REGULAR_PAYMENT` | Parcela regular do lease | Sempre (cronograma) |
| `PROCESSING_FEE` | Taxa de processamento | Se fee > 0 |
| `EARLY_PAY_OFF` | Valor do EPO | Se EPO calculado |
| `PROTECTION_PLAN_FEE` | Taxa do plano de protecao | Contas Kornerstone migradas |
| `NSF_FEE` | Taxa de fundos insuficientes | Evento de NSF (ACH/CC) |

### Calculo de Imposto nos Recebiveis

```
taxAmount = baseAmount * taxRate
totalAmount = baseAmount + taxAmount
```

### Next Due Amount (Proximo Vencimento)

Soma todas as taxas anteriores ao primeiro recebivel regular + valor da primeira parcela regular + recebiveis no mesmo due date.

### Past Due Amount (Valor em Atraso)

```
pastDue = SUM(totalAmount - partialPaymentAmount) para recebiveis com dueDate <= hoje
```

---

## 17. Rewind/Replay (Motor de Correcao de Pagamentos)

### O Que e

Mecanismo para corrigir ou reestruturar alocacoes de pagamentos. Funciona como "desfazer todas as alocacoes, depois refazer do zero na ordem correta".

### Para Que Serve

Quando algo muda apos pagamentos terem sido alocados (reversao, mudanca de frequencia, regeneracao de schedule), as alocacoes podem nao estar mais corretas. Em vez de corrigir cirurgicamente, o sistema desfaz tudo e refaz.

### Como Funciona

| Fase | Acao |
|------|------|
| **Rewind** | Reverte alocacoes de todos os pagamentos PAID. Se conta estava quitada (PAID_OUT, etc), volta para ACTIVE |
| **Replay** | Reaplica todos os pagamentos em ordem cronologica, reavaliando EPO, alocacao, taxas |

### Quando e Usado

- Reversao de pagamento (cheque devolvido, NSF)
- Mudanca de frequencia
- Regeneracao de cronograma
- Quitacao EPO (realocacao para recebivel EPO)

---

## 18. Auto-Pay (Pagamento Automatico)

### Tipos Suportados

`ACH` (debito bancario), `CC` (cartao de credito), `NONE`

### Validacoes

| Auto-Pay | Requer |
|----------|--------|
| ACH | Conta bancaria ativa com auto-pay habilitado |
| CC | Cartao de credito ativo com auto-pay habilitado |

### Remocao Automatica por Rating

Ratings que desligam auto-pay (default: C, P, M):
- Se rating corresponde e ACH ativo -> Remove ACH, cria log e alerta
- Se rating corresponde e CC ativo -> Remove CC, cria log e alerta

---

## 19. Rating Letters (Classificacao de Risco da Conta)

### O Que e

O rating letter e uma classificacao de uma unica letra que indica o **status de risco/comportamento** da conta. Funciona como um "estado de cobranca" da conta.

### Significado de Cada Rating

> **Fonte de verdade:** `common/src/main/java/com/uownleasing/common/enumeration/RatingLetter.java`. Esta tabela espelha o enum e os filtros SQL reais nos sweeps do svc; em caso de divergencia, o enum prevalece.

| Rating | Significado (enum) | Impacto sistemico (filtros SQL reais) |
|--------|--------------------|--------------------------------------|
| `NULL` | Conta sem rating — saudavel | Sem exclusao. Processamento padrao. |
| **P** | Payment Arrangement | Excluido de `ScheduledACHPayments`, `ScheduledCreditCardPayments`, `RerunACH/CC`, `CCDailyScheduledDeniedRerun`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. Removido automaticamente apos 60 dias. |
| **C** | Confirmed Bankruptcy | Maior exclusao do sistema (Scheduled, Rerun, Reminder, Sticky, CCVintage, DelinquencyRerun, CustomerPortalReminder). |
| **D** | Pending Bankruptcy | Excluido de `RerunACH/CC`, `CCDailyScheduledDeniedRerun`, `CustomerPortalReminder`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. NAO excluido do scheduled inicial. |
| **B** | Discharged Bankruptcy | Excluido de `FirstPaymentReminder`, `ScheduledACH/CC`, `CustomerPortalReminder`, `StickyRecoverSweep`, `CCVintageRun`, `DelinquencyRerunCC`. NAO excluido de `RerunACH/CC`. |
| **M** | MR Money Owed | **Nao consta em nenhum filtro SQL conhecido.** Doc historica afirmava que desliga auto-pay; codigo nao evidencia via SQL — TBD investigacao confirmatoria. |
| **F** | Fraud | Excluido de email "Settled in Full" + `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. NAO excluido de Scheduled/Rerun/Sticky. |
| **E** | Pickup Requested | Excluido de email "Settled in Full" + `CCVintageRun` + `DelinquencyRerunCC`. |
| **U** | Pickup Completed Product | Excluido de email "Settled in Full" + `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. |
| **G** | Pickup Completed Settlement | Excluido de `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. |
| **S** | Sold Accounts (vendida a debt buyer) | Excluido de `CustomerPortalReminder` + `CCVintageRun` + `DelinquencyRerunCC`. NAO excluido de Scheduled/Rerun/Sticky. |
| **R** | DNC Dialer/Revoke | Sem exclusao SQL conhecida — bloqueia discador/SMS via flag separada nao-SQL. |
| **J** | Opt Out Payment Reminders | Usado em `= 'J'` no `CreateSkitDelinquentSweep` (bypassa Skit/dialer/SMS). |
| **L** | Legal | Excluido de `CCVintageRun` + `DelinquencyRerunCC`. |

> **Observacoes importantes:**
>
> 1. **Nao existe letra "Standard"** — conta normal tem `rating IS NULL`. A letra **S** indica `Sold Accounts`.
> 2. **Nenhum filtro SQL exclui `M`** — comportamento de "M desliga auto-pay" precisa investigacao adicional para confirmar via que mecanismo (possivel toggle separado em `cc.auto_pay`).
> 3. **Sweeps de rerun/recovery tem listas de exclusao diferentes** — `StickyRecoverSweep` exclui apenas `B,C,D,P`; `DelinquencyRerunCC` exclui `B,C,P,S,D,E,F,G,L,U`. Inconsistencia candidata a revisao de produto.

### Como o Rating Muda

| Evento | Novo Rating |
|--------|------------|
| Payment arrangement criado | P |
| Pagamento ACH via customer portal com data futura | P |
| Conta vendida para debt buyer | S (Sold) |
| Agente muda manualmente | Qualquer |

---

## 20. Inadimplencia e Cobranca

### Como a Inadimplencia e Rastreada

O campo `delinquencyAsOfDate` no schedule summary representa a data do recebivel mais antigo nao pago. `daysPastDue = dias entre delinquencyAsOfDate e hoje`.

### Faixas de Inadimplencia e Acoes

| Dias em Atraso | Acao Automatica |
|---------------|----------------|
| 31-60 | Email Delinquency30DayOffer |
| 61-90 | Email + SMS Delinquency60DayOffer |
| 91-150 | Email + SMS Delinquency90DayOffer |
| 150+ | Email + SMS Delinquency150DayOffer |
| 100 | CC rerun especial `_100_DAY_DELINQUENCY_RUN` |
| Diario | CC rerun `DAILY_DELINQUENCY_RUN` em contas inadimplentes |

### Lembretes Adicionais

- `delinquencyReminderEmailSweep`: lembretes genericos "Past Due"
- `latePaymentNoticeEmailSweep`: avisos mensais com dias exatos em atraso

---

## 21. Status de Conta (Account Status)

### ACTIVE

**O que significa:** Lease ativo, cliente devendo dinheiro e fazendo pagamentos.
**Quando acontece:** Conta criada/importada do LOS. Tambem quando conta quitada e revertida.
**Impacto:** Processamento normal de pagamentos, monitoramento de inadimplencia, auto-pay ativo.

### PAID_OUT

**O que significa:** Cliente completou todos os pagamentos ate o fim do contrato. Lease concluido normalmente.
**Quando acontece:** Automaticamente quando saldo restante e menor ou igual a uma parcela E data atual >= ultima data de pagamento.
**Impacto:** Nenhum pagamento futuro coletado. Email "Paid in Full" enviado. Conta encerrada.

### PAID_OUT_EARLY

**O que significa:** Cliente quitou antecipadamente pagando o saldo total (mas FORA da janela de 90 dias do EPO).
**Quando acontece:** Pagamento causa alocacao que cobre o valor total de payoff.
**Impacto:** Conta encerrada. Data de payoff registrada.

### PAID_OUT_EARLY_EPO

**O que significa:** Cliente exerceu a opcao de compra antecipada em 90 dias (EPO). Pagou o preco "a vista" do produto.
**Quando acontece:** Total de pagamentos (menos taxas) >= valor do EPO, dentro da janela de elegibilidade.
**Impacto:** Todos os pagamentos sao rewindados e realocados ao EPO. Conta encerrada com status especial.

### CANCELLED

**O que significa:** Lease cancelado. Contrato anulado.
**Quando acontece:** Fraude, pedido do merchant, periodo de cooling-off, acao administrativa.
**Impacto:** `cancelledDateTime` registrado. Opcionalmente todos pagamentos reembolsados. Nenhum pagamento futuro.

### SETTLED_IN_FULL

**O que significa:** A UOwn aceitou um pagamento negociado (tipicamente menor que o total devido) para encerrar a conta. Comum para contas muito inadimplentes onde um agente de IA ou humano liga para o cliente e oferece um acordo de quitacao.
**Quando acontece:** Transacao CC do tipo SALE, same-day, marcada como `isSettlementPayment = true`, e aprovada.
**Impacto:** Email "Settled in Full" enviado. `settledInFullDateTime` registrado. Se pagamento revertido, conta volta para ACTIVE.

### CHARGED_OFF

**O que significa:** Conta lançada como perda contabil. A UOwn determinou que a divida e incobravel (tipicamente 180+ dias em atraso).
**Quando acontece:** Processo administrativo/batch de charge-off.
**Impacto:** Excluida de processamento normal de pagamentos. Pode ser vendida (-> SOLD).

### SOLD

**O que significa:** A divida da conta foi vendida a um comprador de divida (debt buyer) externo.
**Quando acontece:** Processo de venda de portfolio via `DocumentService.setDataForSoldAccount()`.
**Impacto:** Documentos da conta enviados ao comprador via SharePoint. Rating -> S (Sold). `soldDateTime` registrado.

### CLOSED

**O que significa:** Conta encerrada por motivos administrativos genericos.
**Impacto:** Sem processamento de pagamentos.

---

## 22. Status de Lead (Lead Status)

### Fase de Aplicacao/Underwriting

| Status | Significado |
|--------|-----------|
| `NEW` | Aplicacao recebida, nenhum processamento iniciado |
| `PENDING_UW` | Checks iniciais passaram, underwriting em andamento |
| `UW_APPROVED` | Aprovado pelo underwriting. Elegivel para contrato |
| `UW_DENIED` | Negado pelo underwriting (risco de credito) |
| `UW_REVIEW` | Requer revisao manual ou verificacao adicional (Plaid) |
| `UW_ERROR` | Erro no processo de underwriting |
| `DENIED` | Negado em step pre-underwriting (fraude, estado, duplicidade) |
| `ERROR` | Erro de sistema durante processamento |

### Fase de Contrato/Assinatura

| Status | Significado |
|--------|-----------|
| `CONTRACT_CREATED` | Contrato gerado e enviado para assinatura |
| `SIGNED` | Cliente assinou o contrato eletronicamente |
| `EXPIRED_CONTRACT` | Contrato expirou sem assinatura |
| `CANCELLED_CONTRACT` | Contrato cancelado antes do funding |
| `ORDER_CANCELLED` | Pedido/invoice do merchant cancelado |

### Fase de Funding

| Status | Significado |
|--------|-----------|
| `READY_TO_FUND` | Pronto para fila de funding |
| `FUNDING` | Processo de funding iniciado, dinheiro em transito |
| `FUNDED` | Merchant recebeu pagamento. Conta criada no SVC |

### Status Terminais

| Status | Significado |
|--------|-----------|
| `EXPIRED` | Aprovacao expirou sem acao |
| `INCOMPLETE` | Aplicacao abandonada antes do UW |
| `CANCELLED_DUP_SSN` | Cancelado por lead mais novo com mesmo SSN |
| `CANCELLED_DUP_DENIAL` | Cancelado por duplicidade de SSN negado |
| `BLACKLISTED` | Todos os dados do cliente adicionados a lista negra |

### Status Internos de Fraude (internalStatus)

| Prefixo | Servico |
|---------|---------|
| `SENTILINK_DENIED/ERROR/SSN_TYPO` | Sentilink |
| `NEUSTAR_DENIED/ERROR` | Neustar |
| `FRAUD_DENIED/ERROR` | SEON |
| `LEXISNEXIS_DENIED/ERROR` | LexisNexis |
| `NEURO_ID_DENIED/APPROVED/ERROR` | NeuroID |
| `INTELLICHECK_FAILED/ERRORED` | Intellicheck |
| `SEON_ID_FAILED/APPROVED` | SEON ID |
| `BLACKLIST_DENIED/APPROVED` | Blacklist |
| `PLAID_PENDING/SUCCESS/FAILED/ABANDONED` | Plaid |

---

## 23. Plano de Protecao (Buddy Insurance)

### O Que e

O plano de protecao e um **produto de seguro opcional** oferecido ao cliente, operado pela **Buddy Insurance** (parceira da AON). O produto e `AON_PURCHASEPROTECTION` -- seguro de protecao de compra para a mercadoria alugada.

### Para Que Serve

Protege o cliente contra danos, roubo ou perda do produto alugado durante o periodo do lease.

### Preco

**$12.99/mes** (mensal), $38.97 (trimestral), $155.88 (pagamento unico). A Buddy coleta diretamente via token de cartao do cliente.

### Como o Cliente Seleciona

**Canal 1 - Na Originacao (durante assinatura):**
O formulario de e-sign apresenta a oferta do plano. O cliente marca `optIn = true` para participar ou `optIn = false` para recusar.

**Canal 2 - No Portal do Cliente (pos-funding):**
Endpoint `GET /getPlanEligibilityForAccount/{accountPk}` verifica elegibilidade, e `POST /enrollAccountInProtectionPlan` efetua a inscricao.

### Verificacao de Elegibilidade (Portal)

| Condicao | Requerido |
|----------|-----------|
| Conta ACTIVE | Sim |
| Merchant tem `offerInsurance = true` | Sim |
| Estado do cliente na lista de estados permitidos | Sim |
| Nao esta ja inscrito | Sim |
| Nenhuma outra conta com mesmo email ja tem plano ativo | Sim |

### Fluxo de Inscricao (Opt-In)

1. **Tokenizacao do cartao:** Cria token de pagamento via USA ePay para que a Buddy possa cobrar diretamente
2. **Chamada ao Buddy:** POST para `https://partners.buddyinsurance.com/v3/policy` com dados do cliente e token de pagamento
3. **Resposta:** Recebe `policyId` e `customerId`
4. **Status:** COMPLETED com `enrollmentDate = hoje`

### Cross-Coverage (Cobertura Cruzada)

Se o cliente optou por NAO participar, o sistema verifica se ele ja tem cobertura via outro lead/conta com o mesmo email. Se sim, marca `alreadyCovered = true` e copia os dados da policia existente.

### Impacto nos Pagamentos e Financeiro

| Aspecto | Impacto |
|---------|---------|
| Recebiveis | Para contas UOWN atuais: Buddy coleta diretamente (sem receivable). Para Kornerstone migradas: receivable `PROTECTION_PLAN_FEE` criado |
| EPO | Taxas do plano sao **excluidas** do calculo de pagamentos para EPO |
| Saldo do contrato | Taxas do plano somadas como "Protection Plan AddOn To Date" |
| Funding | Fee incluido no calculo de custo de funding |

### Cancelamento

**Por parte da UOwn:** Quando lease e cancelado/expirado, sistema autentica com Buddy via OAuth e chama API de cancelamento. Cancela em cascata para todos os leads associados.

**Por parte da Buddy:** Buddy envia CSVs via SFTP para pasta `buddy/cancellations`. Sweep semanal (sexta 8h) processa os arquivos.

### Configuracoes Principais

| Config | Descricao |
|--------|-----------|
| `cancel.protection.plan` | Kill switch para cancelamento (default: true) |
| `offer.insurance.in.states` | Estados onde o plano e oferecido |
| `BuddyClient.base.url` | URL da API da Buddy |
| `BuddyClient.partner.id` | ID do parceiro (producao: `p-19g61kzm0yy7d`) |

---

## 24. Taxas e Impostos (TaxCloud / TaxJar)

### O Que e

O sistema de impostos calcula automaticamente a **taxa de imposto sobre vendas** (sales tax) para cada transacao baseado no endereco do cliente ou merchant.

### Para Que Serve

Compliance fiscal. Nos EUA, cada estado, condado e cidade pode ter taxas diferentes. A UOwn precisa calcular e recolher o imposto correto para cada jurisdicao.

### Como o Roteamento Funciona

O `TaxService` e a camada de roteamento:

1. **Verifica isencao:** Se merchant e `taxExempted` para o estado do cliente -> taxa = 0%
2. **Roteia para provedor:** Config `useTaxCloudApi` (default: true)
   - True -> TaxCloud
   - False -> TaxJar

### TaxCloud (Provedor Principal)

**O que faz:**
1. **Rate lookup:** Dado endereco completo, retorna taxa combinada (estado + condado + cidade + distrito)
2. **Compliance reporting:** Recebe dados de cada pagamento e reembolso diariamente para filing automatico

**Cache:** Resultados armazenados na tabela `TaxForZip`. Se existir resultado nao expirado para o mesmo endereco, nao faz chamada de API.

**Sweeps diarios:**
- `DailyTaxCloudPaymentsSync`: Envia todas as alocacoes de pagamento do dia para TaxCloud (10 threads)
- `DailyTaxCloudRefundsSync`: Envia todos os pagamentos revertidos do dia para TaxCloud (5 threads)

**Como o usuario interno usa:** Admin pode consultar taxa via `GET /getTaxForZip/{zipCode}`. Sweeps rodam automaticamente.

**Como afeta o cliente:** Imposto e calculado transparentemente em cada parcela do lease.

### TaxJar (Provedor Alternativo/Legado)

**O que faz:** Apenas rate lookup (sem compliance reporting).

**Diferenciais:**
- Suporta override por zip code (util para correcoes)
- Cache com expiracao configuravel (default 30 dias)
- Armazena mais detalhes (nome do condado, resposta completa)

**Quando usar:** Se TaxCloud tiver problemas, admin pode trocar via config flag sem deploy.

---

## 25. Five9 (Call Center e IVR)

### O Que e

Five9 e uma plataforma de **call center na nuvem** que opera o sistema IVR (Interactive Voice Response) da UOwn -- o sistema telefonica automatizado.

### Para Que Serve

Permite que clientes interajam com a UOwn por telefone e que agentes facam discagem de cobranca. A integracao sincroniza preferencias do cliente entre Five9 e o sistema da UOwn.

### Como o Cliente Interage

O cliente liga para o numero da UOwn. Durante o fluxo IVR, pode ser perguntado sobre preferencias de comunicacao (ex: "Deseja continuar recebendo mensagens de texto?"). A resposta e capturada e enviada automaticamente para o sistema da UOwn.

### Como Funciona Tecnicamente

Five9 envia um POST para `POST /uown/tms/updateContactPreferences` com:
- Numero de telefone
- Flag `doNotText`

O sistema busca todos os registros de telefone correspondentes, atualiza a flag, e cria log de atividade nas contas associadas.

### Impacto

Quando cliente opta por nao receber textos via IVR, `doNotText = true` e setado em seus registros de telefone, prevenindo futuras comunicacoes SMS.

---

## 26. TMS (Sistema para Agentes Telefonicos)

### O Que e

TMS (Telephony Management System) e a API dedicada para agentes de call center e bots de cobranca (como Skit.ai). Fornece endpoints otimizados para operacoes durante chamadas telefônicas.

### Para Que Serve

Da aos agentes tudo que precisam durante uma ligacao: ver resumo da conta, processar pagamentos, calcular quitacao, mover datas de vencimento, e registrar notas -- tudo sem sair da interface do telefone.

### O Que um Agente Pode Fazer via TMS

| Endpoint | Funcao | Descricao |
|----------|--------|-----------|
| `getAccountSummary` | Ver resumo | Nome, status, proximo vencimento, saldo, dias em atraso, EPO, merchant |
| `getPayoffAmount` | Calcular quitacao | Valor para quitar a conta (EPO) |
| `makeCreditCardPayment` | Cobrar CC | Processar pagamento de cartao |
| `makeCreditCardPayments` | Arranjo CC | Multiplas transacoes (payment arrangement) |
| `makeAchPayment` | Cobrar ACH | Iniciar debito bancario |
| `moveDueDatesByDays` | Mover vencimentos | Adiar parcelas por N dias |
| `getBankAccounts` | Ver bancos | Contas bancarias em arquivo |
| `getCreditCards` | Ver cartoes | Cartoes tokenizados em arquivo |
| `addLogNote` | Registrar nota | Nota da ligacao (Skit.ai usa tipo `SKIT_CALL_LOG`) |

### Como o Cliente e Impactado

O cliente nunca ve o TMS diretamente. Ele interage com o agente ou bot por telefone, e o TMS e o backend que torna tudo possivel em tempo real.

---

## 27. Portal do Cliente

### O Que e

Interface web de autoatendimento onde clientes gerenciam suas contas de lease.

### Para Que Serve

Reduz volume do call center permitindo autoatendimento 24/7.

### Autenticacao

| Metodo | Descricao |
|--------|-----------|
| Dados pessoais | Nome, sobrenome, ultimos 4 do SSN, data de nascimento |
| Verificacao por codigo | Envia codigo de 6 digitos por SMS ou email. Expira em 5 minutos |

### O Que o Cliente Pode Fazer

| Funcao | Descricao |
|--------|-----------|
| **Ver pagamentos** | Historico completo de pagamentos da conta |
| **Fazer pagamentos** | Criar ou modificar pagamentos |
| **Suporte** | Enviar ticket de suporte (integrado com Zendesk) |
| **Plano de protecao** | Ver elegibilidade e inscrever-se (se elegivel) |
| **Correspondencia** | Rastreamento de emails/SMS enviados |

### Branding por Empresa

| Empresa | Portal |
|---------|--------|
| UOwn | URL padrao UOwn |
| Kornerstone | `portal.kornerstoneliving.com` (prod) / `website-{env}.kornerstoneliving.com` |

---

## 28. Webhooks (Notificacoes para Merchants)

### O Que e

Sistema de callbacks HTTP que envia notificacoes em tempo real para sistemas de merchants parceiros quando status de leads mudam.

### Para Que Serve

Merchants precisam saber quando coisas acontecem: cliente assinou, deal financiado, aplicacao expirou. Em vez de merchants consultarem a UOwn constantemente, a UOwn envia updates proativamente.

### Status que Disparam Webhook

Default: `CONTRACT_CREATED, EXPIRED, CANCELLED_DUP_SSN, FUNDING, FUNDED, SIGNED`

### Como Funciona

1. Status do lead muda
2. Sistema verifica se merchant tem `useWebhook = true`
3. Se merchant requer autenticacao: obtem token OAuth primeiro
4. Payload JSON construido a partir de query SQL configuravel (customizavel por merchant sem code change)
5. POST enviado para URL do merchant com headers de autorizacao

### Impacto no Merchant

Quando webhook de FUNDED dispara, o merchant sabe que pode liberar a mercadoria ao cliente. Quando EXPIRED dispara, merchant para de segurar inventario.

---

## 29. Correspondencia (Email/SMS)

### Templates por Empresa

| Empresa | Prefixo | From Email (prod) |
|---------|---------|-------------------|
| UOwn | (nenhum) | `CustomerService@uownleasing.com` |
| Kornerstone | `KORNERSTONE_` | `CS@kornerstoneliving.com` |

### Tipos de Correspondencia Observados

| Tipo | Quando |
|------|--------|
| Welcome Email | Apos importacao para SVC |
| Approval Email/SMS | Apos aprovacao de UW |
| Decline Email | Apos negacao de UW |
| First Payment Reminder | Antes do primeiro pagamento |
| Past Due Reminder | Conta em atraso |
| Delinquency Offer (30/60/90/150 dias) | Faixas de inadimplencia |
| Paid in Full | Conta quitada |
| Settled in Full | Conta liquidada por acordo |
| Bank Verification Declined | Verificacao bancaria negada |
| Finalize Purchase | Apos verificacao, link para finalizar |
| Portal Invitation | Convite para portal do cliente |

### Envio

| Modo | Descricao |
|------|-----------|
| Imediato | Enviado na hora |
| Enfileirado | Adicionado a fila de envio |
| Async | Delay configuravel antes do envio (default 3s) |
| SMS | Via Twilio, se telefone valido |

---

## 30. Blacklist (Lista Negra)

### O Que e

Base de dados de identificadores de clientes fraudulentos. Qualquer nova aplicacao com dados correspondentes e automaticamente negada.

### Campos Verificados

Nome, SSN, email, telefone, conta bancaria, routing number, endereco, CC BIN (6 digitos)

### Como Usar (Usuario Interno)

Via Admin Panel:
- Adicionar/remover entradas individuais
- Blacklistar lead inteiro (todos os dados de uma vez -> lead status `BLACKLISTED`)

### Validacoes

- CC BIN deve ser exatamente 6 digitos
- BINs duplicados nao permitidos

---

## 31. Item Split (Divisao de Carrinho)

### O Que e

Quando o custo do carrinho excede o valor de aprovacao, o sistema pode dividir os itens em: **itens para lease** (financiados) e **itens para compra imediata** (cobrados no cartao na hora).

### Para Que Serve

Permite que o cliente leve todos os seus itens mesmo se o valor total excede a aprovacao. Os itens que "sobram" sao pagos imediatamente no cartao.

### Elegibilidade

| Condicao (TODAS devem ser verdadeiras) | |
|---|---|
| Merchant tem `isItemSplit = true` |
| Diferenca `(custo - aprovacao) <= threshold` (default: $300) |

### Como Funciona

1. Servico determina quais itens sao financiados vs compra imediata
2. Invoice atualizada: `purchaseTotal = soma dos itens PURCHASED`
3. `merchandiseAmount` e `totalInvoiceAmount` reduzidos pelo purchaseTotal
4. Na submissao, itens PURCHASE_NOW geram transacao CC SALE separada

---

## 32. Second Opportunity (Segunda Chance)

### O Que e

Sistema para rastrear e potencialmente re-aprovar clientes que foram **anteriormente blacklistados** ou que tiveram contas charged-off.

### Para Que Serve

Alguns clientes defaultam mas depois melhoram de situacao financeira. O sistema permite re-engajar esses clientes sob condicoes controladas.

### Como Funciona

- Armazena historico do cliente: razao do blacklist, data, CLV (Customer Lifetime Value)
- Permite definir `maxPrice` ou `creditLimit` reduzidos
- Permite whitelist seletivo: `isBlacklisted = false, isWhitelisted = true`
- Rastreia por `rtoAccountNumber` para identificar clientes recorrentes

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

## 34. Processamento em Lote (Sweeps) - Guia Completo

### O Que e

Sweeps sao **jobs agendados** que executam operacoes em massa no sistema: processar pagamentos, retentar cobracas negadas, enviar emails, gerar relatorios, sincronizar impostos, etc. Sao o motor operacional do servicing.

### Para Que Serve

Automatiza operacoes que seriam impossiveis de fazer manualmente: cobrar milhares de cartoes por dia, enviar emails de inadimplencia, sincronizar impostos com TaxCloud, gerar relatorios diarios para parceiros.

### Infraestrutura Tecnica

| Config | Default | Descricao |
|--------|---------|-----------|
| Thread count | 5 | Threads paralelas por sweep |
| Thread size | 50 | Itens por batch de thread |
| Fetch size | 500 | Limite de busca por execucao |
| Interrupt | false | Flag para parar sweep em andamento |
| Quartz Thread Pool | 25 | Total de threads do scheduler |
| Quartz Clustering | Habilitado | Distribui sweeps entre pods |

**Registro:** Todos os 74 sweeps sao registrados no `BootstrapService.createScheduledTasks()` durante startup.
**Despacho:** `QuartzTask.java` roteia cada sweep para o servico correto via switch/case.
**Persistencia:** Quartz usa JDBC com PostgreSQL (tabelas `qrtz_*`).

### Como Disparar Qualquer Sweep Manualmente

```
POST /uown/svc/triggerScheduledTask/{nomeDoSweep}
```

Ou usar os endpoints especificos listados abaixo para cada sweep.

### Como Pausar/Resumir Qualquer Sweep

```
POST /uown/svc/pauseScheduledTask/{nomeDoSweep}
POST /uown/svc/resumeScheduledTask/{nomeDoSweep}
```

### O Que Verificar Apos Disparar

1. **Logs do sweep:** `SELECT * FROM uown_sweep_logs WHERE sweep_name = '{nome}' ORDER BY created_date DESC LIMIT 5;`
2. **Alertas criados:** Verificar tabela de alertas para erros
3. **Registros processados:** Verificar as tabelas afetadas pelo sweep

---

### CATEGORIA: PAGAMENTOS CC (Cartao de Credito)

#### 34.1 SendCreditCardPaymentsSweep

**O que faz:** Processa pagamentos de cartao de credito agendados para hoje. E o sweep principal de cobranca CC.
**Cron:** `0 0 14 ? * MON-FRI` (2:00 PM Seg-Sex)
**Endpoint manual:** `POST /uown/svc/sendCCPaymentsSweep`
**O que verificar:** Tabela `uown_sv_cctransaction` para transacoes APPROVED/DENIED do dia. Alertas de falha.
**SQL:** Busca contas com receivables vencidos hoje que tem CC com auto-pay ativo.

#### 34.2 rerunCCPaymentsSweep

**O que faz:** Retenta cobracas CC que falharam. Primeira retentativa apos falha.
**Cron:** `0 0 17 ? * MON-FRI` (5:00 PM Seg-Sex)
**Endpoint manual:** `POST /uown/svc/rerunCCPaymentsSweep`
**O que verificar:** Transacoes com numberOfTries > 1 e status APPROVED. Receivables de NSF fee criados.

#### 34.3 CCDailyScheduledDeniedRerun

**O que faz:** Retenta CCs que foram negados no dia, excluindo erros permanentes (cartao expirado, roubado, conta fechada).
**Cron:** Diario
**Endpoint manual:** Via trigger generico
**O que verificar:** Transacoes que mudaram de DENIED para APPROVED.

#### 34.4 delinquencyRerunCCPaymentsSweep

**O que faz:** Retenta CC especificamente em contas **inadimplentes**. Tenta cobrar valor de past due.
**Cron:** Configuravel
**Endpoint manual:** Via trigger generico
**O que verificar:** Contas inadimplentes que tiveram pagamento aprovado. Reducao de daysPastDue.

#### 34.5 dailyDelinquencyRerunCCSweep

**O que faz:** Rerun diario em contas inadimplentes. Complementa o sweep anterior com frequencia diaria.
**Cron:** Diario
**Endpoint manual:** Via trigger generico

#### 34.6 IdempotentCCSweep

**O que faz:** Retenta transacoes CC que deram **timeout** (sem resposta do gateway). Garante idempotencia -- nao cobra duas vezes.
**Cron:** Configuravel
**Endpoint manual:** Via trigger generico
**O que verificar:** Transacoes com status TIMEOUT que foram resolvidas.

#### 34.7 CCVintageRun e SecondVintageRun (On-Demand)

**O que faz:** Analise vintage de transacoes CC por coorte. NAO e agendado -- e disparado manualmente.
**Endpoints:**
- `POST /uown/svc/executeCCVintageRun/{startDate}/{endDate}`
- `POST /uown/svc/executeSecondvintageRunAndReport/{startDate}/{endDate}`
- `POST /uown/svc/sendVintageRunReport/{sendToEmails}`
**O que verificar:** Relatorio de vintage gerado por email.

---

### CATEGORIA: PAGAMENTOS ACH (Debito Bancario)

#### 34.8 CreateScheduledACHPaymentsSweep

**O que faz:** Cria registros de pagamento ACH agendados para contas com auto-pay ACH ativo.
**Cron:** `0 0 8 ? * MON-FRI` (8:00 AM Seg-Sex)
**Endpoint manual:** `POST /uown/svc/createScheduledACHPaymentsSweep`
**O que verificar:** Novos registros em `uown_sv_achpayment` com status SCHEDULED.

#### 34.9 SendACHPaymentsSweep

**O que faz:** Envia pagamentos ACH criados para o processador Profituity.
**Cron:** `0 0 12 ? * MON-FRI` (12:00 PM Seg-Sex)
**Endpoint manual:** `POST /uown/svc/sendACHPaymentsSweep`
**O que verificar:** ACH com status SENT. Erros de envio nos alertas.

#### 34.10 getSendACHPaymentsStatusSweep

**O que faz:** Consulta status dos pagamentos ACH enviados (aprovado, negado, NSF).
**Cron:** `0 0 16 ? * MON-FRI` (4:00 PM Seg-Sex)
**Endpoint manual:** Via trigger generico
**O que verificar:** ACH com status APPROVED ou DENIED. NSF fees criados.

#### 34.11 getStatusDatePaymentsListSweep

**O que faz:** Busca lista de pagamentos por data de status no processador ACH.
**Cron:** Configuravel
**Endpoint manual:** Via trigger generico

#### 34.12 rerunACHPaymentsSweep

**O que faz:** Retenta pagamentos ACH que falharam. Executa nas quintas-feiras.
**Cron:** `0 0 11 ? * THU` (11:00 AM Quinta)
**Endpoint manual:** `POST /uown/svc/rerunACHSweep`
**O que verificar:** ACH reruns com status APPROVED.

#### 34.13 reverseAchPaymentsSweep

**O que faz:** Reverte pagamentos ACH que falharam ou precisam ser devolvidos.
**Cron:** `0 30 21 * * ?` (9:30 PM diario)
**Endpoint manual:** `POST /uown/svc/reverseAchPaymentsSweep`
**O que verificar:** ACH com status REVERSED. Alocacoes desfeitas.

#### 34.14 processPayWalletPaymentsSweep

**O que faz:** Processa pagamentos recebidos via PayWallet (desconto em folha). Le arquivo XLSX do SFTP.
**Cron:** `0 0 0 * * ?` (Meia-noite diario)
**Endpoint manual:** Via trigger generico
**O que verificar:** Novos pagamentos criados a partir do arquivo. Arquivo movido para pasta `/pw/`.

---

### CATEGORIA: PAGAMENTOS - COBRANCA DE TAXAS

#### 34.15 chargeSigningFeeSweep

**O que faz:** Cobra taxas de assinatura/documentacao pendentes em contas.
**Cron:** `0 0/2 * * * ?` (A cada 2 minutos)
**Endpoint manual:** Via trigger generico
**O que verificar:** Transacoes de signing fee criadas e cobradas.

#### 34.16 CreateScheduledCreditCardPaymentsSweep

**O que faz:** Cria registros de pagamento CC agendados para contas com auto-pay CC ativo.
**Cron:** `0 0 10 ? * MON-FRI` (10:00 AM Seg-Sex)
**Endpoint manual:** `POST /uown/svc/createScheduledCCPaymentsSweep`
**O que verificar:** Novos registros de transacao CC programados.

---

### CATEGORIA: STATUS DE CONTA

#### 34.17 paidOutAccountsSweep

**O que faz:** Verifica contas elegiveis para status PAID_OUT (todas parcelas pagas). Atualiza automaticamente.
**Cron:** `0 0/1 * * ?` (A cada hora)
**Endpoint manual:** Via trigger generico
**O que verificar:** Contas que mudaram para PAID_OUT. `SELECT * FROM uown_sv_account WHERE status = 'PAID_OUT' ORDER BY modified_date DESC;`

#### 34.18 checkLeadExpirationSweep

**O que faz:** Expira leads que nao foram financiados a tempo. Leads em NEW/UW_APPROVED com data expirada e leads SIGNED/CONTRACT_CREATED nao financiados dentro do prazo.
**Cron:** `0 0 22 * * ?` (10:00 PM diario)
**Endpoint manual:** `POST /uown/svc/checkLeadExpirationSweep`
**O que verificar:** Leads com status EXPIRED. `SELECT * FROM uown_los_lead WHERE status = 'EXPIRED' ORDER BY modified_date DESC;`

#### 34.19 updateContractStatusSweep

**O que faz:** Atualiza status de contratos baseado em mudancas de status da conta.
**Cron:** A cada 15 minutos (configuravel via `BootstrapService.update.contract.status.sweep`)
**Endpoint manual:** Via trigger generico
**O que verificar:** Tabela `uown_sv_contract` para atualizacoes recentes.

#### 34.20 removeRatingLetterSweep

**O que faz:** Remove/arquiva rating letters apos periodo estatutario.
**Cron:** `0 0 0 ? * FRI` (Meia-noite Sexta)
**Endpoint manual:** Via trigger generico
**O que verificar:** Contas com rating removido/resetado.

---

### CATEGORIA: CORRESPONDENCIA (Email/SMS)

#### 34.21 emailSweep

**O que faz:** Processa fila de emails pendentes e envia via SendGrid.
**Cron:** Frequente (minutos)
**Endpoint manual:** Via trigger generico
**O que verificar:** Emails em `uown_email_queue` com status SENT.

#### 34.22 FirstPaymentReminderSweep

**O que faz:** Envia lembretes de primeiro pagamento para contas novas.
**Cron:** Diario
**Endpoint manual:** Via trigger generico
**O que verificar:** Emails de "First Payment Reminder" na fila.

#### 34.23 RecurringPaymentReminderSweep

**O que faz:** Envia lembretes de pagamento recorrente para contas ativas.
**Cron:** Diario
**Endpoint manual:** Via trigger generico
**O que verificar:** Emails de lembrete na fila.

#### 34.24 delinquencyOfferEmailSweep

**O que faz:** Envia ofertas de negociacao por email/SMS baseado na faixa de inadimplencia (30, 60, 90, 150+ dias).
**Cron:** `0 0 12 ? * MON-FRI` (12:00 PM Seg-Sex)
**Endpoint manual:** Via trigger generico
**O que verificar:** Emails de Delinquency30/60/90/150DayOffer enviados.

#### 34.25 delinquencyReminderEmailSweep

**O que faz:** Envia lembretes genericos "Past Due" para contas inadimplentes.
**Cron:** `0 0 13 ? * WED` (1:00 PM Quarta)
**Endpoint manual:** Via trigger generico

#### 34.26 latePaymentNoticeEmailSweep

**O que faz:** Envia avisos mensais com dias exatos de atraso.
**Cron:** `0 0 13 ? * 2L` (1:00 PM ultima Segunda do mes)
**Endpoint manual:** Via trigger generico

#### 34.27 UnutilizedApprovalSweep

**O que faz:** Envia notificacao para clientes com aprovacoes nao utilizadas prestes a expirar.
**Cron:** `0 0 21 * * ?` (9:00 PM diario)
**Endpoint manual:** `POST /uown/svc/sendUnutilizedApprovalsSweep`
**O que verificar:** Emails de "Unutilized Approval" enviados.

#### 34.28 customerPortalReminderSweep

**O que faz:** Envia convites/lembretes para clientes usarem o portal de autoatendimento.
**Cron:** `0 0 0 * * ?` (Meia-noite diario)
**Endpoint manual:** Via trigger generico

#### 34.29 paidInFullAccountEmailSweep

**O que faz:** Envia email "Paid in Full" quando conta e quitada.
**Cron:** `0 0 1 ? * MON-FRI` (1:00 AM Seg-Sex)
**Endpoint manual:** Via trigger generico
**O que verificar:** Emails "Paid in Full" enviados para contas recentemente quitadas.

#### 34.30 settledInFullAccountEmailSweep

**O que faz:** Envia email "Settled in Full" quando conta e liquidada por acordo.
**Cron:** `0 0 2 ? * MON-FRI` (2:00 AM Seg-Sex)
**Endpoint manual:** Via trigger generico
**O que verificar:** Emails "Settled in Full" enviados.

---

### CATEGORIA: DOCUMENTOS E E-SIGN

#### 34.31 storedDocServiceSweep

**O que faz:** Processa documentos pendentes e armazena no sistema de gerenciamento de documentos (DMS).
**Cron:** `0 0/2 * * * ?` (A cada 2 minutos)
**Endpoint manual:** `POST /uown/svc/storedDocServiceSweep`
**O que verificar:** Documentos em `uown_email_queue` com status STORED.

#### 34.32 storedDocSmsServiceSweep

**O que faz:** Envia SMS com links de documentos para clientes.
**Cron:** `0 0/2 * * * ?` (A cada 2 minutos)
**Endpoint manual:** `POST /uown/svc/storedDocSmsServiceSweep`

#### 34.33 eSignDocumentStatusSweep

**O que faz:** Verifica status de documentos enviados para assinatura eletronica (SignWell/PandaDoc).
**Cron:** `0 0/3 * * * ?` (A cada 3 minutos)
**Endpoint manual:** `POST /uown/svc/eSignDocumentStatusSweep`
**O que verificar:** Contratos com status atualizado (SENT, SIGNED, EXPIRED).

#### 34.34 getCompletedESignDocumentStatusSweep

**O que faz:** Busca documentos e-sign completados/assinados e atualiza o sistema.
**Cron:** `0 0/2 * * * ?` (A cada 2 minutos)
**Endpoint manual:** `POST /uown/svc/getCompletedESignDocumentStatusSweep`
**O que verificar:** Leads com status SIGNED recente.

#### 34.35 sendLeaseDocsToBankSweep

**O que faz:** Envia documentos de lease assinados para o banco financiador e/ou Vervent.
**Cron:** `0 0 2 ? * MON-FRI` (2:00 AM Seg-Sex)
**Endpoint manual:** `POST /uown/svc/sendLeaseDocsToBankSweep?sendToBank={bool}&sendToVervent={bool}`
**O que verificar:** Logs de envio SFTP/email para banco.

---

### CATEGORIA: IMPOSTOS

#### 34.36 dailyTaxCloudPaymentsSync

**O que faz:** Envia alocacoes de pagamento do dia para TaxCloud para compliance fiscal. Roda em 10 threads.
**Cron:** `0 15 22 ? * *` (10:15 PM diario)
**Endpoint manual:** Via trigger generico
**O que verificar:** Logs de TaxCloud para order submissions. Erros de sincronizacao.

#### 34.37 dailyTaxCloudRefundsSync

**O que faz:** Envia reembolsos do dia para TaxCloud para ajuste fiscal. Roda em 5 threads.
**Cron:** `0 0 23 ? * *` (11:00 PM diario)
**Endpoint manual:** Via trigger generico
**O que verificar:** TaxCloud refund order submissions.

#### 34.38 updateTaxRatesSweep

**O que faz:** Atualiza taxas de imposto (mensal no ultimo dia do mes).
**Cron:** `0 0 0 L * ? *` (Meia-noite no ultimo dia do mes)
**Endpoint manual:** Via trigger generico

#### 34.39 monthlyTaxReportSweep

**O que faz:** Gera relatorio mensal de impostos para reconciliacao.
**Cron:** `0 0 0 1 * ?` (Meia-noite no dia 1 de cada mes)
**Endpoint manual:** Via trigger generico

---

### CATEGORIA: PLANO DE PROTECAO

#### 34.40 cancelProtectionPlanSweep

**O que faz:** Processa cancelamentos de plano de protecao. Le CSVs enviados pela Buddy Insurance via SFTP na pasta `buddy/cancellations`.
**Cron:** `0 0 8 ? * FRI` (8:00 AM Sexta)
**Endpoint manual:** `POST /uown/svc/cancelProtectionPlanSweep` ou `POST /uown/svc/cancelProtectionPlanSweep/{fileName}`
**O que verificar:** `uown_sv_protection_plan` e `uown_los_protection_plan` com status CANCELLED.

---

### CATEGORIA: INADIMPLENCIA E COBRANCA

#### 34.41 createSkitDelinquentFileSweep

**O que faz:** Gera arquivo para o Skit.ai (bot de cobranca) com dados de contas inadimplentes. Enviado via SFTP.
**Cron:** `0 0 0 * * ?` (Meia-noite diario)
**Endpoint manual:** Via trigger generico
**O que verificar:** Arquivo gerado no SFTP. Logs de envio.

#### 34.42 createSkitDelinquentOfferFileSweep

**O que faz:** Gera arquivo Skit.ai com contas inadimplentes elegiveis para ofertas de settlement.
**Cron:** `0 0 0 * * ?` (Meia-noite diario)
**Endpoint manual:** Via trigger generico

#### 34.43 redistributeDelinquentEpoPoolSweep

**O que faz:** Redistribui reserva de EPO pool para contas inadimplentes. Rebalanceia alocacoes.
**Cron:** `0 0 3 ? * SUN` (3:00 AM Domingo)
**Endpoint manual:** Via trigger generico

#### 34.44 pastDueEpoPoolAmountReportSweep

**O que faz:** Gera relatorio de valores EPO pool para contas em atraso.
**Cron:** `0 0 2 ? * SUN` (2:00 AM Domingo)
**Endpoint manual:** Via trigger generico

#### 34.45 progetDeviceLockingSweep

**O que faz:** Bloqueia dispositivos (IoT/GPS) de contas inadimplentes via sistema Proget.
**Cron:** `0 0 0 ? * * *` (Meia-noite diario)
**Endpoint manual:** Via trigger generico
**O que verificar:** Status de bloqueio no Proget.

---

### CATEGORIA: RELATORIOS FINANCEIROS

#### 34.46 dailyFundingReportSweep / dailyFundingReportSharepointSweep

**O que faz:** Gera relatorio diario de funding e opcionalmente envia para SharePoint.
**Cron:** `0 0 1 * * ?` (1:00 AM) / `0 0 3 * * ?` (3:00 AM para SharePoint)
**Endpoint manual:** Via trigger generico
**O que verificar:** Relatorio no email/SharePoint.

#### 34.47 dailyFundedReportSweep

**O que faz:** Relatorio de contas financiadas no dia.
**Cron:** `0 0 3 * * ?` (3:00 AM)

#### 34.48 dailyRefundReportSweep / dailyRefundedReportSweep

**O que faz:** Relatorio de reembolsos processados no dia.
**Cron:** `0 0 3 * * ?` (3:00 AM)

#### 34.49 dailyAgentTransactionReportSweep

**O que faz:** Relatorio de transacoes feitas por agentes no dia.
**Cron:** `0 30 3 * * ?` (3:30 AM)
**Endpoint manual:** `POST /uown/svc/sendDailyAgentTransactionReportSweep`

#### 34.50 weeklyFundingReportSweep

**O que faz:** Relatorio semanal consolidado de funding.
**Cron:** `0 0 1 ? * SUN` (1:00 AM Domingo)

#### 34.51 monthlyFundingReportSweep / monthlyConsolidatedFundingReportSweep

**O que faz:** Relatorio mensal de funding e versao consolidada multi-entidade.
**Cron:** `0 0 1 1 * ?` (1:00 AM dia 1) / `0 0 4 1 * ?` (4:00 AM dia 1)

#### 34.52 sendDailyPaymentsSharepointSweep

**O que faz:** Envia resumo diario de pagamentos para SharePoint.
**Cron:** `0 16 7 ? * * *` (7:16 AM)

#### 34.53 sendDailyBorrowingBaseReport

**O que faz:** Envia relatorio diario de base de emprestimo para parceiros financeiros.
**Cron:** `0 37 7 ? * * *` (7:37 AM)
**Endpoint manual:** `POST /uown/svc/sendDailyBorrowingBaseReport`

#### 34.54 activeLeaseDailyReport

**O que faz:** Relatorio diario de leases ativos para tracking de portfolio.
**Cron:** `0 2 7 ? * * *` (7:02 AM)

#### 34.55 rerunACHWeeklyReport

**O que faz:** Relatorio semanal de retentativas ACH falhadas.
**Cron:** `0 15 7 ? * MON` (7:15 AM Segunda)

#### 34.56 generateDelinquencyReport

**O que faz:** Gera relatorio completo de inadimplencia.
**Cron:** `0 0 8 * * ?` (8:00 AM diario)

#### 34.57 generateDueDateMovesReport

**O que faz:** Relatorio de auditoria de movimentacoes de data de vencimento.
**Cron:** `0 0 3 * * ?` (3:00 AM)

#### 34.58 generateExportBlacklistReport

**O que faz:** Exporta entradas de blacklist para compliance.
**Cron:** `0 0 0 1 * ?` (Meia-noite dia 1 do mes)

#### 34.59 generateMerchantLeaseReport

**O que faz:** Relatorio de leases por merchant para reconciliacao.
**Cron:** `0 0 8 * * ?` (8:00 AM diario)

---

### CATEGORIA: RELATORIOS PARA PARCEIROS ESPECIFICOS

#### 34.60 sendDailyReportsToBBWheelsSweep

**O que faz:** Envia relatorios diarios para BB Wheels (parceiro especifico).
**Cron:** `0 0 4 * * ?` (4:00 AM)
**Endpoint manual:** `POST /uown/svc/sendDailyReportsToBBWheelsSweep`

#### 34.61 danielJewelersLeadReportSweep

**O que faz:** Gera relatorio de leads para Daniel Jewelers (merchant especifico).
**Cron:** `0 30 0 * * ?` (12:30 AM)

#### 34.62 saleFileGenerationSweep

**O que faz:** Gera arquivos de vendas/transacoes para vendors/parceiros.
**Cron:** `0 0 4 * * ?` (4:00 AM)

---

### CATEGORIA: INTEGRACOES EXTERNAS

#### 34.63 generateVerventOnBoardingFileSweep

**O que faz:** Gera arquivo de onboarding para Vervent (parceiro de documentos de lease).
**Cron:** `0 0 2 ? * *` (2:00 AM)

#### 34.64 kornerstoneDailyImportSweep

**O que faz:** Importa dados diarios do sistema legado Kornerstone (migracao). Chama `MigrationService.importBasicDataForContracts()`.
**Cron:** `0 0 22 ? * *` (10:00 PM)
**O que verificar:** Novas contas importadas em `uown_sv_account`.

#### 34.65 refreshTrustPilotAccessKeySweep

**O que faz:** Renova credenciais de API do TrustPilot.
**Cron:** `0 0 0 * * ?` (Meia-noite)

---

### CATEGORIA: MONITORAMENTO E MANUTENCAO

#### 34.66 monitorSweep

**O que faz:** Health check do sistema. Registra metricas de monitoramento.
**Cron:** `0 0 23 * * ?` (11:00 PM)

#### 34.67 paymentGatewayFixSweep

**O que faz:** Corrige problemas de sincronizacao com gateways de pagamento.
**Cron:** `0 0 21 * * ?` (9:00 PM)

#### 34.68 checkSignedAndFundingLeaseCountSweep

**O que faz:** Monitora quantidade de leases assinados e em funding (compliance/auditoria).
**Cron:** `0 0/15 9-21 ? * * *` (A cada 15 min das 9h as 21h)
**Endpoint manual:** `POST /uown/svc/checkSignedAndFundingLeaseCountSweep`

#### 34.69 bankVerificationSweep

**O que faz:** Verifica validade e precisao de contas bancarias.
**Cron:** `0 0/5 * * * ?` (A cada 5 minutos)

---

## 35. Settlement (Acordo de Quitacao)

### O Que e

Settlement e o processo de **negociacao de divida** onde a UOwn aceita um valor menor que o total devido para encerrar a conta. Tipicamente usado para contas muito inadimplentes.

### Para Que Serve

Recupera parte do valor em contas que provavelmente seriam charged-off (perda total). Melhor receber parte do que nada.

### Como Funciona

1. **Agente ou bot (Skit.ai) liga para cliente** inadimplente
2. **Oferece acordo de quitacao** com valor reduzido (ex: deve $1.500, oferta de $800)
3. **Cliente aceita** e fornece dados de cartao de credito
4. **Transacao processada** como CC SALE com flag `isSettlementPayment = true`
5. **Se aprovada:** Conta muda para `SETTLED_IN_FULL`, email enviado
6. **Se pagamento revertido:** Conta volta para ACTIVE

### Como Ativar/Disparar

- **Via agente humano:** TMS endpoint `makeCreditCardPayment` com flag de settlement
- **Via bot Skit.ai:** Automatico atraves de arquivo de ofertas gerado pelo sweep `createSkitDelinquentOfferFileSweep`
- **Via API:** `POST /uown/los/settleApplication` com `ApplicationSettleRequest`

### Controle de Concorrencia

O sistema usa Hazelcast Settlement Request Map para impedir ofertas duplicadas simultaneas para o mesmo lead.

### O Que Verificar

- Conta com status `SETTLED_IN_FULL` e `settledInFullDateTime` preenchido
- Email "Settled in Full" enviado
- Transacao CC com `isSettlementPayment = true`

---

## 36. Modificacao de Invoice

### O Que e

Servico que permite modificar os termos de um lease **apos a assinatura** criando uma nova referencia de lease.

### Para Que Serve

Quando um acordo de settlement e aceito ou os termos do lease precisam mudar, o sistema cria um novo lead com os termos modificados vinculado ao original.

### Como Funciona

1. Valida que lead esta SIGNED ou adiante
2. Cancela a conta associada (se existir)
3. Se FUNDED: Cria request de refund ao merchant
4. Cria nova aplicacao a partir dos dados originais
5. Copia metodos de pagamento (CC/ACH) para o novo lead
6. Vincula novo lead a oferta de settlement

### Como Disparar

```
POST /uown/los/modifyInvoiceForLead/{leadPk}
```
**Resposta:** `ModifyInvoiceResponse` com `newLeadPk`

### O Que Verificar

- Novo lead criado com status correto
- Conta anterior cancelada
- Metodos de pagamento copiados

---

## 37. PayWallet (Pagamentos via Folha de Pagamento)

### O Que e

PayWallet e um servico de **desconto em folha de pagamento** onde o empregador do cliente deduz o valor do lease diretamente do salario.

### Para Que Serve

Alternativa ao cartao de credito e ACH. Pagamentos via folha tem taxa de inadimplencia muito menor pois sao deduzidos antes do cliente receber o salario.

### Como Funciona

1. **PayWallet gera arquivo Excel** (.xlsx) com pagamentos coletados
2. **Arquivo depositado via SFTP** na pasta `/paywallet`
3. **Sweep diario** (`processPayWalletPaymentsSweep`) le o arquivo
4. **Processamento paralelo:** ParseIA cada linha com ExecutorService
5. **Dados extraidos:** Data, nome do cliente, conta de coleta, conta de disbursement, referencia do lease, valor, trace number
6. **Deduplicacao:** Verifica pagamentos existentes por data + trace number
7. **Registro:** Converte para `PaymentInfo` e posta na conta
8. **Arquivamento:** Move arquivo processado para `/pw/`, deleta original

### Como Ativar

- O sweep roda automaticamente a meia-noite
- Para processar manualmente: `POST /uown/svc/triggerScheduledTask/processPayWalletPaymentsSweep`
- O servico depende de conexao SFTP configurada

### O Que Verificar

- Novos pagamentos com source "PayWallet" na conta
- Arquivo movido de `/paywallet` para `/pw/`
- Logs de processamento para erros de parsing

---

## 38. Limpeza de Dados (Cleanup)

### O Que e

Servico automatizado de **retencao e purga de dados** para conformidade regulatoria e performance do sistema.

### Para Que Serve

Dados antigos (logs de API, emails processados, documentos assinados) acumulam e degradam performance. O cleanup garante retencao minima de 3 meses e remove dados mais antigos.

### Dados Removidos

| Alvo | Descricao | Retencao Minima |
|------|-----------|-----------------|
| API Logs (LOS/SVC/3rd party) | Chamadas de API entrada/saida | 3 meses |
| Correspondence Logs | Historico de email/SMS | 3 meses |
| Sweep Logs | Logs de processamento ACH/CC | 3 meses |
| Merchant Error Logs | Erros de integracao | 3 meses |
| Login Attempts | Auditoria de autenticacao | 3 meses |
| Esign Events | Eventos de assinatura de contrato | 3 meses |
| Esign Documents | Contratos assinados | 3 meses |
| Email Queue | Emails processados | 3 meses |
| Import Records | Registros de importacao | 3 meses |

### Como Disparar

```
DELETE /uown/cleanupLogEntries?to=2025-11-19        (Logs de API)
DELETE /uown/cleanupFunctionalEntities?to=2025-11-19 (Dados operacionais)
```

**PROTECAO:** A data `to` deve ser pelo menos 3 meses no passado. O sistema rejeita tentativas de deletar dados recentes.

### O Que Verificar

- Logs no console confirmando quantidade de registros deletados
- Performance de queries melhorada apos limpeza

---

## 39. Validacao Pre-Assinatura (Missing Required Fields)

### O Que e

Servico **gatekeeper** que valida se todos os dados obrigatorios estao preenchidos antes de permitir que o cliente assine o contrato.

### Para Que Serve

Impede que contratos sejam assinados com dados incompletos, o que causaria problemas no funding e servicing.

### Campos Validados

| Campo | Condicao | Config |
|-------|----------|--------|
| Itens/Carrinho | Nao pode ser vazio (exceto merchants configurados) | `items.can.be.empty.for.merchant.*` |
| Valor da Invoice | Deve ser > $0 | Direto |
| Verificacao de ID | Requerido por merchant (Intellicheck/SEON) | Flag do merchant |
| Dados ACH | Routing + Account number se ACH habilitado | Flag do merchant |
| Verificacao Bancaria | Opcional mas configuravel por merchant | Flag do merchant |
| Dados CC | Requerido se pagamento CC habilitado | Flag do merchant |
| Data Primeiro Pagamento | Requerido por merchant | `isFpdRequired` |
| Emprego | Proximo pagamento + frequencia (se ACH) | Validacao |
| Frequencia de Pagamento | Selecao obrigatoria | `desiredPaymentFrequency` |
| NeuroID Check | Verificacao de fraude opcional | `useNeuroIdCheck` |
| Oferta de Seguro | Dependente do estado | `offer.insurance.in.states` |
| Item Split Payment | Divisao lease vs. compra imediata | `isItemSplit` |

### Como e Acionado

Chamado automaticamente durante o fluxo de assinatura:
- **Endpoint legado:** `GET /missing-fields/{shortCode}` (usa `selectedPaymentFrequency`)
- **Endpoint com planId (Task #439):** `GET /missing-fields/{shortCode}?planId={planId}` (aceita `planId` no lugar de `selectedPaymentFrequency`)

**Compatibilidade:** Ambos `selectedPaymentFrequency` e `planId` funcionam. O `planId` contem tanto a frequencia quanto o termo (ex: `WK13`), enquanto `selectedPaymentFrequency` contem apenas a frequencia (ex: `WEEKLY`).

### O Que Retorna

`RequiredFields` contendo: lista de campos faltantes, taxas calculadas, security deposit, data do primeiro pagamento, elegibilidade para seguro.

---

## 40. Valores Aprovados por Segmento de Risco

### O Que e

Sistema de **limites maximos de aprovacao** baseados no segmento de risco do cliente.

### Para Que Serve

Controla exposicao a risco. Clientes de alto risco recebem limites menores; clientes de baixo risco recebem limites maiores.

### Como Funciona

Dados carregados de arquivo CSV (`combined_approval_amounts.csv`):

| Campo | Descricao |
|-------|-----------|
| `lambdaSegment` | Segmento de risco 1-10 (1 = melhor) |
| `riskType` | PRIME, GOOD, FAIR, POOR, etc. |
| `maxApprovedAmountCR` | Valor maximo aprovado |

### Como Atualizar

```
POST /uown/loadApprovedAmountsFromExcel
```
Upload de novo arquivo CSV com limites atualizados.

### Impacto

O valor de aprovacao do cliente e limitado ao `maxApprovedAmountCR` do seu segmento. Afeta diretamente quanto o cliente pode financiar.

---

## 41. Modificacao de Frequencia de Pagamento

### O Que e

Servico que permite **alterar a frequencia de pagamento** de um lease (ex: semanal para quinzenal) e registra trilha de auditoria.

### Para Que Serve

Clientes podem precisar mudar a frequencia para alinhar com seu ciclo de pagamento de salario.

### Dados Registrados

| Campo | Descricao |
|-------|-----------|
| `fromFrequency` | Frequencia anterior (WEEKLY, BI_WEEKLY, etc.) |
| `toFrequency` | Nova frequencia |
| `modDate` | Data da modificacao |
| `agentUsername` | Quem fez a alteracao |

### Como Disparar

Via interface administrativa ou endpoint de mudanca de frequencia. O `ChangeFrequencyService` chama automaticamente o registro de auditoria.

### Impacto

- Cronograma de recebiveis e **regenerado** (Rewind/Replay executado)
- Valores das parcelas mudam (mais parcelas menores ou menos parcelas maiores)
- Historico de mudanca registrado em `uown_frequency_mods`

---

## 42. Movimentacao de Data de Vencimento (Due Date Move)

### O Que e

Permite **adiar ou antecipar** datas de vencimento de recebiveis por N dias.

### Para Que Serve

- **Skip payment:** Pular uma parcela em caso de hardship
- **Payment arrangement:** Reorganizar datas para alinhar com salario
- **Alinhamento:** Ajustar todas as parcelas futuras

### Como Disparar

```
POST /uown/svc/moveDueDatesByDays/{accountPk}?moveNumberOfDays=7&fromDueDate=2026-02-28
```

Ou via TMS: `POST /uown/tms/moveDueDatesByDays`

### Dados Registrados

| Campo | Descricao |
|-------|-----------|
| `movedFromDueDate` | Data original |
| `movedByDays` | Quantidade de dias (positivo = adiar) |
| `adjustmentType` | Tipo (SCHEDULE_SHIFT, etc.) |
| `agentUsername` | Quem fez |

### Restricoes

- Apenas pode ajustar recebiveis com data passada
- Todas as parcelas futuras sao deslocadas pelo mesmo numero de dias

### O Que Verificar

- Recebiveis com datas atualizadas
- Relatorio de due date moves (sweep `generateDueDateMovesReport`)

---

## 43. RTR (Real Time Reporting / Migracao Kornerstone)

### O Que e

Integracao com sistema externo RTR para importacao de dados do legado Kornerstone/Katerba.

### Para Que Serve

Migra portfolios do sistema antigo (Kornerstone) para o novo sistema UOwn. Sincroniza contas, dados de clientes e transacoes.

### Como Funciona

**Servidor remoto:** `http://34.69.198.41:8080`

| Metodo | Funcao |
|--------|--------|
| `getAccountsThatChanged()` | Busca contas com dados alterados |
| `getImportPojoByRtrAccounData()` | Importa dados completos da conta |
| `getImportPojoByApplicationId()` | Busca por ID de aplicacao |
| `getAllCompanyInfo()` | Dados de referencia de empresas |
| `processRtoData()` | Processa dados RTO |
| `processKatabatData()` | Importa de arquivo Katabat |

### Como Disparar

- **Sweep automatico:** `kornerstoneDailyImportSweep` (10:00 PM diario)
- **Manual:** Via API interna do MigrationService

---

## 44. Proget (Bloqueio de Dispositivos)

### O Que e

Integracao com sistema **Proget** para bloqueio remoto de dispositivos (IoT/GPS tracking) associados a mercadorias em lease.

### Para Que Serve

Quando um cliente fica inadimplente, os dispositivos associados ao produto podem ser bloqueados remotamente como incentivo ao pagamento.

### Como Funciona

Sweep diario `progetDeviceLockingSweep` identifica contas inadimplentes e envia comandos de bloqueio ao Proget.

### Como Ativar

- Sweep roda automaticamente a meia-noite
- Requer integracao Proget configurada no merchant
- Para disparar manualmente: `POST /uown/svc/triggerScheduledTask/progetDeviceLockingSweep`

---

## 45. Skit.ai (Bot de Cobranca Automatizado)

### O Que e

Integracao com **Skit.ai**, plataforma de bot de voz para cobranca automatizada.

### Para Que Serve

O bot liga para clientes inadimplentes automaticamente, oferece acordos de pagamento e processa transacoes via TMS -- sem necessidade de agente humano.

### Como Funciona

1. **Sweeps geram arquivos** com dados de clientes inadimplentes:
   - `createSkitDelinquentFileSweep` - Lista de inadimplentes
   - `createSkitDelinquentOfferFileSweep` - Lista com ofertas de settlement
2. **Arquivos enviados via SFTP** para Skit.ai
3. **Bot liga para clientes** e negocia
4. **Se cliente aceita:** Bot usa TMS para processar pagamento
5. **Notas registradas** com tipo `SKIT_CALL_LOG` via `addLogNote`

### Como Ativar

- Sweeps rodam automaticamente a meia-noite
- Para gerar arquivo manualmente: `POST /uown/svc/triggerScheduledTask/createSkitDelinquentFileSweep`
- SQL do sweep define criterios de selecao (configuravel via banco)

---

## 46. Autenticacao de API

### O Que e

Sistema de chaves de API para autenticacao de servicos externos.

### Como Funciona

1. **Geracao:** Cria chave hex de 128 caracteres + expiracao (24 horas)
2. **Armazenamento:** Vinculada a conta ApiUser
3. **Validacao:** `isValid(key)` verifica existencia, expiracao e status do usuario
4. **Uso:** Passada no header de requests

### Autenticacao por Servico

| Servico | Metodo de Auth |
|---------|---------------|
| Five9 | Header `Username: Five9` |
| Webhooks | Bearer token ou OAuth endpoint |
| Config Management | Spring Security padrao |
| TMS | API key ou credenciais do agente |

---

## 47. CC Idempotent (Retentativa de CC Timeout)

### O Que e

Servico que **retenta transacoes CC que deram timeout** (sem resposta do gateway) garantindo **idempotencia** -- nao cobra duas vezes.

### Para Que Serve

Gateways de pagamento podem nao responder (timeout de rede, indisponibilidade). O sistema precisa saber se a cobranca foi efetivada ou nao antes de retentar.

### Como Funciona

1. Sweep identifica transacoes com status TIMEOUT
2. Para cada, consulta gateway sobre status real
3. Se cobrada: atualiza para APPROVED
4. Se nao cobrada: retenta com mesma referencia (idempotent key)
5. Se inconclusivo: marca para revisao manual

### Como Ativar

Sweep `IdempotentCCSweep` roda automaticamente. Para disparar: `POST /uown/svc/triggerScheduledTask/IdempotentCCSweep`

---

## 48. Gestao de Merchants (Lojistas)

### Criacao

| Campo | Requerido | Descricao |
|-------|-----------|-----------|
| clientType | Sim | Tipo de integracao |
| refMerchantCode | Sim | Codigo de referencia |
| username, apiKey, merchantUrl | Default do clientType | Credenciais |

### Ativacao/Desativacao

| Acao | Como Ativar | Impacto |
|------|-------------|---------|
| Desativacao | Admin Panel -> Merchant -> Desativar | Lock de usuarios via AMS. Novas aplicacoes continuam mas podem ser auto-denied |
| Ativacao | Admin Panel -> Merchant -> Ativar | Unlock de usuarios |
| Remover de usuarios | Admin Panel (so se inativo) | Remove merchant de todos os perfis |
| Auto-Deny | Setar `autoDenyApplication = TRUE` no merchant | Nega todas as aplicacoes automaticamente |

### Clone

Cria copia do merchant: `pk = 0`, `clonedFrom = originalPk`, codigo += `_clone`. Programas copiados.

### Como Disparar

- **Criar:** `POST /uown/createMerchant`
- **Atualizar:** `POST /uown/updateMerchant`
- **Clonar:** `POST /uown/cloneMerchant/{merchantPk}`
- **Desativar:** `POST /uown/deactivateMerchant/{merchantPk}`

---

## 49. Gestao de Leads

### Transicoes Permitidas via ChangeLeadStatus

Somente para: `UW_APPROVED`, `EXPIRED`, `SIGNED`

### Regras Especiais

| Transicao | Regra |
|-----------|-------|
| EXPIRED -> UW_APPROVED | Requer nova expiration date |
| UW_DENIED -> UW_APPROVED | Altera valor de aprovacao |
| -> SIGNED (com conta existente) | Cancela conta se configurado, reembolsa se configurado |
| Status nao elegivel -> UW_APPROVED | Re-executa steps de UW restantes com reset de servicos de fraude |

### Como Disparar

- **Mudar status:** `POST /uown/los/changeLeadStatus`
- **Blacklistar lead:** `POST /uown/los/blacklistLead/{leadPk}`
- **Re-aprovar:** Via Admin Panel ou endpoint de change status

---

## 50. Painel Administrativo

### Capacidades Principais

| Area | O Que o Admin Pode Fazer | Como Acessar |
|------|-------------------------|-------------|
| **Merchants** | Criar, atualizar, clonar, bulk update, gerenciar contas bancarias | `/uown/createMerchant`, `/uown/updateMerchant` |
| **Programas** | Criar, atualizar, clonar, importar Excel, associar a merchants | `/uown/createProgram`, `/uown/updateProgram` |
| **State Config** | Configurar regras por estado (taxas, limites regulatorios) | `/uown/updateStateConfig` |
| **Templates** | Gerenciar templates de correspondencia (email, contrato) | `/uown/loadTemplates` |
| **Blacklist** | Adicionar, remover, pesquisar entradas | `/uown/addToBlacklist`, `/uown/removeFromBlacklist` |
| **SQL Config** | Gerenciar queries SQL usadas por sweeps e relatorios | `/uown/svc/updateScheduleTaskSqlByName/{name}` |
| **Impostos** | Consultar taxa de imposto por ZIP code | `/uown/getTaxForZip/{zipCode}` |
| **Sistema** | Limpar logs, limpar cache, gerenciar mapas | `/uown/cleanupLogEntries`, `/ConfigurationManagement/forceReloadConfig` |
| **Leads** | Verificar elegibilidade para re-aprovacao | `/uown/los/checkReapprovalEligibility` |
| **Configuracoes** | Alterar configs em tempo real | `/ConfigurationManagement/createOrUpdateConfig` |
| **Sweeps** | Disparar, pausar, resumir, reagendar sweeps | `/uown/svc/triggerScheduledTask/{name}` |
| **Approved Amounts** | Carregar limites de aprovacao por segmento | `/uown/loadApprovedAmountsFromExcel` |

---

## 51. API de Integracao para Merchants (Full API)

### O Que e

A UOwn Leasing API permite integracao completa com a plataforma de financiamento UOwn, habilitando merchants a automatizar submissao de aplicacoes, processamento de invoices, gerenciamento de contratos e rastreamento de status -- tudo via API sem necessidade de interacao manual com o Merchant Portal.

### Para Que Serve

Merchants que possuem sistemas proprios (e-commerce, POS, ERP) podem integrar diretamente com a UOwn para oferecer financiamento aos seus clientes sem sair da plataforma do merchant.

### Autenticacao

Toda requisicao deve incluir credenciais de autenticacao no body:

| Campo | Descricao | Obrigatorio |
|-------|-----------|-------------|
| `userName` | Username atribuido ao merchant | Sim |
| `setupPassword` | Senha de autenticacao | Sim |
| `merchantNumber` | Identificador unico do merchant (ex: `OL90202-0001`) | Sim |

**Como obter credenciais:**
1. Contatar a equipe UOwn
2. Fornecer dados do merchant e caso de uso
3. Receber `userName`, `setupPassword` e `merchantNumber`

**Requisitos de rede:** IPs de egresso devem ser whitelistados. Fornecer a UOwn: nome do merchant, ambiente (Sandbox/Producao), tipo de acesso, e IPs estaticos. Recomendado usar NAT Gateway para IPs consistentes.

### Fluxos de Integracao

#### Fluxo 1: Aplicacao Completa (Com Invoice/Carrinho)

```
1. Merchant envia sendApplication COM itens do carrinho
2. UOwn processa aplicacao + underwriting
3. Se aprovado: retorna link para finalizacao do lease
4. Cliente completa dados de pagamento e assina contrato via link
5. Merchant chama settleApplication para iniciar funding
```

**Quando usar:** Quando o cliente ja escolheu os itens antes de aplicar. Mais rapido para finalizacao.

#### Fluxo 2: Pre-Aprovacao (Sem Invoice)

```
1. Merchant envia sendApplication SEM itens (pre-aprovacao)
2. UOwn retorna valor aprovado (creditLimit)
3. Cliente escolhe itens com base no credito aprovado
4. Merchant envia sendInvoice com os itens selecionados
5. UOwn retorna link para finalizacao do lease
6. Cliente completa dados de pagamento e assina contrato
7. Merchant chama settleApplication para iniciar funding
```

**Quando usar:** Quando o merchant quer dar ao cliente um limite de credito antes da compra. Mais flexibilidade.

### Finalizacao do Lease (Assinatura)

Apos aprovacao, o cliente deve completar:
1. Inserir dados de pagamento (CC ou ACH)
2. Revisar termos do lease
3. Decidir sobre plano de protecao (opt-in/opt-out)
4. Assinar contrato digital

**Duas formas de finalizacao:**

| Metodo | Descricao |
|--------|-----------|
| **Portal UOwn** | Cliente acessa link retornado pela API (`redirectUrl`) e completa no site da UOwn |
| **Pagina Embarcada (Iframe)** | Merchant embarca as paginas de finalizacao dentro da propria plataforma via iframe |

### Notificacoes de Finalizacao

Apos o cliente assinar ou recusar o contrato, a UOwn notifica o merchant de 3 formas:

#### 1. URL Redirect

O cliente e redirecionado para o `returnUrl` fornecido pelo merchant com parametros:
- `event=completed` (assinou) ou `event=cancelled` (recusou)
- `ata={UUID}` (identificador unico da aplicacao)

**Exemplo:** `{returnUrl}?event=completed&ata=892828a0-f766-4183-add7-781cbbc1ac83`

#### 2. PostMessage do Iframe

Se a assinatura ocorre em iframe embarcado, a UOwn envia `postMessage` ao completar. O merchant escuta o evento e atualiza seu sistema.

#### 3. Webhook

A UOwn envia POST para URL de webhook configurada com status atualizado do lease. Mensagem e URL configuraveis por merchant.

---

### Endpoints da API

#### 51.1 POST /uown/los/sendApplication

**O que faz:** Submete aplicacao de cliente para avaliacao de credito. Pode incluir ou nao os itens do carrinho.

**Campos obrigatorios do request:**

| Campo | JSON Tag | Obrigatorio | Formato/Notas |
|-------|----------|-------------|---------------|
| Username | `userName` | Sim | |
| Senha | `setupPassword` | Sim | |
| Merchant Number | `merchantNumber` | Sim | |
| Nome | `mainFirstName` | Sim | |
| Sobrenome | `mainLastName` | Sim | |
| Data Nascimento | `mainDOB` | Sim | MMDDYYYY |
| SSN | `mainSSN` | Sim | Apenas digitos, sem hifens |
| Endereco | `mainAddress1` | Sim | |
| Cidade | `mainCity` | Sim | |
| CEP | `mainPostalCode` | Sim | Apenas digitos |
| Celular | `mainCellPhone` | Sim | Apenas digitos, 10 digitos |
| Empregador | `mainEmployerName` | Sim | |
| Renda (mensal ou anual) | `mainMonthlyIncome` ou `mainAnnualIncome` | Sim | Um dos dois obrigatorio |
| Email | `emailAddress` | Sim | |
| IP | `ipaddress` | Sim | |
| SEON Fingerprint | `seonFingerprintText` | Sim | Protecao contra fraude |

**Campos opcionais importantes:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| URL de retorno | `returnUrl` | Redirect apos assinatura |
| ID externo | `externalReferenceId` | Identificador do merchant por aplicacao |
| UUID | `uuid` | Identificador unico gerado pelo merchant |
| Codigo do cliente | `customerCode` | ID do cliente no sistema do merchant |
| Frequencia desejada | `desiredPaymentFrequency` | WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| Proxima data pagamento | `mainNextPayDate` | MMDDYYYY (configuravel por merchant) |
| Frequencia salarial | `mainPayFrequency` | WEEKLY, BI_WEEKLY, SEMI_MONTHLY, MONTHLY |
| Ultimo pagamento | `mainLastPayDate` | MMDDYYYY |
| Idioma | `languagePreference` | E = English, S = Spanish |
| Indicador individual/joint | `individualJointIndicator` | I = Individual, J = Joint |
| Locale | `localeString` | Default: en_US |
| Deposito | `depositAmount` | Decimal, ate 10 digitos |
| Total do pedido | `orderTotal` | Decimal (obrigatorio se com carrinho) |
| Subtotal merchandise | `merchandiseSubtotal` | Soma antes de imposto |
| Sales Tax | `salesTax` | Decimal |
| Desconto | `discountAmount` | Ate 10 digitos |
| Frete | `deliveryCharge` | Decimal |
| Instalacao | `installationCharge` | Decimal |
| Taxas diversas | `miscellaneousFees` | Decimal |
| Valor solicitado | `requestedLoanAmount` | Decimal |
| Falencia passada | `mainPastBankruptcy` | boolean |
| Falencia atual/futura | `mainCurrentOrFutureBankruptcy` | boolean |
| Envio = endereco cliente | `shipToSameAsConsumer` | boolean |

**Campos opcionais de endereco e residencia:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| Estado | `mainStateOrProvince` | Sigla do estado |
| Complemento | `mainAddress2` | |
| Morando desde | `mainAtAddressFrom` | Formato MMYY |
| Telefone residencial | `mainHomePhone` | Apenas digitos |
| Status habitacional | `mainHousingStatus` | O=Owner, R=Renter, PR=Parents/Relatives, OT=Other |
| Pagamento mensal moradia | `mainMonthlyHousingPayment` | Decimal |
| Saldo da hipoteca | `mainMortgageBalance` | Inteiro |
| Valor do imovel | `mainHomeValue` | Inteiro |
| Endereco anterior 1 | `mainPrevAddress1` | |
| Endereco anterior 2 | `mainPrevAddress2` | |
| Cidade anterior | `mainPrevCity` | |
| Estado anterior | `mainPrevStateOrProvince` | |
| CEP anterior | `mainPrevPostalCode` | Apenas digitos |
| Morando endereco anterior desde | `mainAtPrevAddressFrom` | Formato MMYY |

**Campos opcionais bancarios:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| Conta corrente | `mainCheckingAccount` | Y ou N |
| Conta poupanca | `mainSavingsAccount` | Y ou N |
| Duracao da conta | `mainBankAccountDuration` | Enum |
| Numero da conta | `mainBankAccountNumber` | Apenas digitos |
| Routing number | `mainBankRoutingNumber` | Apenas digitos |
| Data abertura da conta | `mainBankAccountOpenedDate` | MMDDYYYY |
| Tipo de conta | `mainBankAccountType` | CHECKING ou SAVINGS |

**Campos opcionais de emprego:**

| Campo | JSON Tag | Notas |
|-------|----------|-------|
| Status emprego | `mainEmplStatus` | D=Disabled, E=Employed, etc. |
| Empregado desde | `mainAtEmployerFrom` | Formato MMYY |
| Ocupacao | `mainOccupation` | |
| Telefone empregador | `mainEmployerPhone` | Apenas digitos |
| Renda liquida mensal | `mainMonthlyNetIncome` | Inteiro |
| Estado civil | `mainMaritalStatus` | M=Married, U=Unmarried |
| Nome solteira da mae | `mainMotherMaidenName` | |

**Campos de itens do carrinho (se incluidos):**

| Campo | JSON Tag | Obrigatorio | Notas |
|-------|----------|-------------|-------|
| Numero da linha | `lineItemLineNumber` | Sim | |
| Numero do produto | `lineItemProductNumber` | Sim | SKU |
| Descricao | `lineItemProductDescription` | Sim | |
| Categoria | `lineItemProductCategory` | Sim | |
| Tipo | `lineItemType` | Sim | D = Debito/Venda, C = Credito/Devolucao |
| Quantidade | `lineItemQuantityOrdered` | Sim | |
| Preco unitario | `lineItemUnitPrice` | Sim | Ate 10 digitos, 2 decimais |
| Preco total | `lineItemExtendedPrice` | Sim | Preco x quantidade |
| Numero serial | `lineItemSerialNumber` | Nao | Numero de serie do produto |
| Preco base | `lineItemBasePrice` | Nao | Decimal |
| Imposto do item | `lineItemTaxAmount` | Nao | Decimal |

**SEON Fingerprint (Protecao contra Fraude):**
A UOwn usa a plataforma SEON para protecao contra fraude via device fingerprinting. Merchants devem implementar o SEON SDK em seus sites/apps:
- **Websites:** Incluir SEON JavaScript Agent, chamar `seon.config()` e `seon.getBase64Session()`
- **iOS:** Integrar via CocoaPods
- **Android:** Integrar via Gradle
O valor gerado deve ser passado como `seonFingerprintText`.

**Exemplo de request (com carrinho):**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "mainFirstName": "Joe",
    "mainLastName": "Sample",
    "mainDOB": "01011998",
    "mainSSN": "881469868",
    "emailAddress": "joesample@outlook.com",
    "mainAddress1": "666 Test Street",
    "mainCity": "Test City",
    "mainPostalCode": "77494",
    "mainCellPhone": "5038784427",
    "languagePreference": "E",
    "mainEmployerName": "BestBuy",
    "mainNextPayDate": "05252025",
    "mainPayFrequency": "MONTHLY",
    "seonFingerprintText": "fingerPrintText",
    "ipaddress": "192.168.0.2",
    "desiredPaymentFrequency": "WEEKLY",
    "mainAnnualIncome": 510000,
    "merchandiseSubtotal": 1200.00,
    "salesTax": 0.00,
    "orderTotal": 1200.00,
    "lineItem": [
        {
            "lineItemLineNumber": "101",
            "lineItemProductNumber": "SKU98765",
            "lineItemProductDescription": "Smart TV 55-inch 4K",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200.00,
            "lineItemExtendedPrice": 1200.00
        }
    ]
}
```

**Exemplo de resposta (aprovado):**

```json
{
    "faults": false,
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "authorizationNumber": "8280",
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "orderTotal": 1200,
    "transactionStatus": "E0",
    "appApprovalStatus": "APPROVED",
    "creditLimit": 5136,
    "programType": "LTO",
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2857.73,
            "regularPaymentWithTax": 50.32,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentDate": "2025-03-25",
            "paymentDueToday": 40
        },
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2857.73,
            "regularPaymentWithTax": 100.63,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentDate": "2025-03-25",
            "paymentDueToday": 40
        }
    ]
}
```

**Exemplo de resposta (negada - SSN termina em 9):**

```json
{
    "faults": false,
    "fieldInError1": "SSN : ending with 9 is rejected on test server",
    "accountNumber": "b5444312-2c6e-4238-8bf7-37088d9d527b",
    "authorizationNumber": "8279",
    "transactionStatus": "E4",
    "appApprovalStatus": "DECLINED",
    "creditLimit": 0,
    "programType": "LTO"
}
```

**Exemplo de resposta (erro de validacao - 400):**

```json
{
    "faults": true,
    "fieldInError1": "mainNextPayDate",
    "sorErrorDescription": "NextPayDate should be in the future. Received 2025-03-05",
    "transactionStatus": "E3",
    "appApprovalStatus": "DECLINED"
}
```

**Campos importantes da resposta:**

| Campo | Descricao |
|-------|-----------|
| `accountNumber` | UUID da aplicacao (usar em chamadas futuras) |
| `appApprovalStatus` | APPROVED ou DECLINED |
| `creditLimit` | Valor maximo aprovado |
| `transactionStatus` | E0 = nao aprovado para transacao, E1 = aprovado, E3 = erro validacao, E4 = negado |
| `paymentDetailsList` | Opcoes de pagamento com `redirectUrl` para finalizacao |
| `redirectUrl` | Link para o cliente completar a assinatura |
| `totalContractAmountWithTax` | Valor total do contrato com imposto |
| `totalContractAmountNoTax` | Valor total do contrato sem imposto |
| `regularPaymentWithTax` | Valor da parcela regular |
| `numberOfPayments` | Total de parcelas |
| `firstPaymentWithFeesAndTax` | Primeiro pagamento incluindo taxas e impostos |
| `firstPaymentWithFeesNoTax` | Primeiro pagamento incluindo taxas sem impostos |
| `firstPaymentDate` | Data do primeiro pagamento |
| `paymentDueToday` | Valor a pagar hoje (security deposit) |
| `purchaseNowTotal` | Total para compra imediata |
| `faults` | true = erro, false = sucesso |
| `fieldInError1` | Campo com erro (em caso de falha) |
| `sorErrorDescription` | Descricao detalhada do erro |

---

#### 51.2 POST /uown/los/sendInvoice

**O que faz:** Envia invoice separadamente quando nao incluida no sendApplication. Tambem usado para cancelar, devolver ou modificar invoices.

**Operacoes suportadas via `orderType`:**

| orderType | Operacao | Descricao |
|-----------|----------|-----------|
| `1` | **Submeter Invoice** | Envia itens para completar lease |
| `5` | **Cancelar Invoice** | Remove invoice mas mantem aprovacao ativa |
| `1` (com itens tipo C) | **Devolver Itens** | Devolucao parcial ou total |
| `1` (itens modificados) | **Modificar Invoice** | Atualiza itens/valores existentes |

**Campos do request:**

| Campo | JSON Tag | Obrigatorio | Descricao |
|-------|----------|-------------|-----------|
| Username | `userName` | Sim | |
| Senha | `setupPassword` | Sim | |
| Merchant Number | `merchantNumber` | Sim | |
| Account Number | `accountNumber` | Sim | UUID retornado do sendApplication |
| Order Type | `orderType` | Sim | 1 = venda, 5 = cancelamento |
| Invoice Number | `invoiceNumber` | Recomendado | Numero de referencia do merchant |
| Order Total | `orderTotal` | Sim | Total do pedido |
| Frequencia | `selectedPaymentFrequency` | Opcional | WEEKLY, BI_WEEKLY, etc. |
| Line Items | `lineItem` | Sim (para vendas) | Array de itens |

**Exemplo - Submeter Invoice:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "orderType": "1",
    "invoiceNumber": "INV123456",
    "orderTotal": 1200.00,
    "selectedPaymentFrequency": "WEEKLY",
    "lineItem": [
        {
            "lineItemLineNumber": "101",
            "lineItemProductNumber": "SKU98765",
            "lineItemProductDescription": "Smart TV 55-inch 4K",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200.00,
            "lineItemExtendedPrice": 1200.00
        }
    ]
}
```

**Exemplo - Cancelar Invoice:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "orderType": "5",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "orderTotal": "0.00"
}
```

**Exemplo - Devolver Itens (Parcial):**

Para devolucao parcial, incluir itens devolvidos com `lineItemType: "C"` e itens mantidos com `lineItemType: "D"`:

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "orderType": "1",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "invoiceNumber": "INV123456",
    "orderTotal": 300.00,
    "lineItem": [
        {
            "lineItemLineNumber": "001",
            "lineItemProductNumber": "SKU67890",
            "lineItemProductDescription": "Wireless Headphones",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "C",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemExtendedPrice": 300.00
        },
        {
            "lineItemLineNumber": "002",
            "lineItemProductNumber": "SKU67891",
            "lineItemProductDescription": "Mouse",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "D",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemExtendedPrice": 300.00
        }
    ]
}
```

**Para devolucao total:** Deixar lista de itens vazia e `orderTotal = 0.00`.

**Exemplo - Modificar Invoice:**

Enviar `orderType: "1"` com `invoiceNumber` existente, `orderTotal` atualizado e lista de itens atualizada. Nao incluir itens cancelados/devolvidos. Garantir que totais calculados correspondam a lista de itens.

**Resposta de sucesso - submeter invoice (`transactionStatus: "A1"`):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1200,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15993,
            "lineItemLineNumber": 101,
            "lineItemProductNumber": "SKU98765",
            "lineItemSerialNumber": "SN12345678",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1200,
            "lineItemExtendedPrice": 1200,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Smart TV 55-inch 4K"
        }
    ],
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 2817.73,
            "totalContractAmountNoTax": 2651.97,
            "regularPaymentWithTax": 50.32,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 50.32,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        }
    ]
}
```

**Resposta de sucesso - modificar invoice:**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1800,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15996,
            "lineItemLineNumber": 1,
            "lineItemProductNumber": "SKU12345",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1500,
            "lineItemExtendedPrice": 1500,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Laptop"
        },
        {
            "lineItemId": 15997,
            "lineItemLineNumber": 2,
            "lineItemProductNumber": "SKU67890",
            "lineItemProductCategory": "Accessories",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemExtendedPrice": 300,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Wireless Mouse"
        }
    ]
}
```

**Resposta de sucesso - devolver item:**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "orderTotal": 1500,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "invoiceItems": [
        {
            "lineItemId": 15998,
            "lineItemLineNumber": 1,
            "lineItemProductNumber": "SKU12345",
            "lineItemProductCategory": "Electronics",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 1500,
            "lineItemExtendedPrice": 1500,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Laptop"
        },
        {
            "lineItemId": 15999,
            "lineItemLineNumber": 2,
            "lineItemProductNumber": "SKU67890",
            "lineItemProductCategory": "Accessories",
            "lineItemType": "CREDIT_RETURN",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemExtendedPrice": 300,
            "lineItemStatus": "RETURNED",
            "lineitemProductDescription": "Wireless Mouse"
        }
    ]
}
```

**Resposta de erro (conta nao encontrada - 400):**

```json
{
    "faults": true,
    "fieldInError1": "CustomerCode Or AccountNumber",
    "sorErrorDescription": "Lead could not be found with the given parameters",
    "transactionStatus": "A0",
    "authApprovalStatus": "DECLINED"
}
```

---

#### 51.3 POST /uown/los/getApplicationStatus

**O que faz:** Consulta status atual de uma aplicacao de lease. Permite rastrear progresso, confirmar transicoes de estado, e verificar dados do lease.

**Request:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "localeString": "en_US",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

**Campos importantes da resposta:**

| Campo | JSON Tag | Descricao |
|-------|----------|-----------|
| Aplicacao encontrada | `applicationFound` | true/false |
| Status atual | `currentStatus` | UW_APPROVED, UW_DENIED, DENIED, CONTRACT_CREATED, SIGNED, FUNDING, FUNDED, etc. |
| Descricao do status | `statusDescription` | Detalhes adicionais |
| Lease assinado | `hasSignedLease` | true/false |
| Pode continuar | `canContinue` | Se a aplicacao pode prosseguir ao proximo step |
| Valor aprovado | `approvedAmount` | Limite de credito aprovado |
| Open to Buy | `openToBuy` | Credito remanescente disponivel |
| Saldo da conta | `accountBalance` | Saldo atual do lease |
| Ultimo pagamento | `lastPayment` / `lastPaymentDate` | Valor e data |
| Proximo vencimento | `paymentDueDate` | Data do proximo pagamento |
| Valor a ser financiado | `amountToBeFunded` | Total que sera pago ao merchant |
| Data request funding | `fundRequestDateTime` | Quando funding foi solicitado |
| Data funded | `fundedDateTime` | Quando merchant recebeu pagamento |
| Desconto merchant | `merchantDiscountPercent` / `merchantDiscountAmount` | % ou valor de desconto |
| Rebate merchant | `merchantRebatePercent` / `merchantRebateAmount` | % ou valor de rebate |
| ID externo | `externalReferenceId` | Identificador do merchant |
| Itens | `lineItem` | Lista de itens do lease |

**Valores possiveis de `currentStatus`:**

| Status | Descricao |
|--------|-----------|
| `UW_APPROVED` | Aprovado pelo underwriting |
| `UW_DENIED` | Negado pelo underwriting |
| `DENIED` | Negado |
| `CONTRACT_CREATED` | Contrato criado |
| `SIGNED` | Contrato assinado |
| `FUNDING` | Em processo de financiamento |
| `FUNDED` | Financiado com sucesso |
| `CANCELLED_DUP_SSN` | Cancelado por SSN duplicado |

**Exemplo de resposta (UW_APPROVED):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "applicationFound": true,
    "applicationSubmitted": true,
    "applicationCreatedTimestamp": "2025-04-08T19:40:20.777815",
    "appUuid": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "leadPk": 8365,
    "currentStatus": "UW_APPROVED",
    "canContinue": true,
    "approvedAmount": 5136,
    "openToBuy": 3936,
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "merchantName": "Progress Mobility Acquisition LLC",
    "refMerchantCode": "OL90294-0001",
    "totalInvoiceAmount": 1200,
    "merchantInvoiceNumber": "R123456",
    "transactionStatus": "I0",
    "merchantDiscountPercent": 0.5,
    "merchantRebatePercent": 0,
    "merchantRebateType": "DAILY"
}
```

**Exemplo de resposta (FUNDING - apos assinatura e settlement):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "applicationFound": true,
    "applicationSubmitted": true,
    "currentStatus": "FUNDING",
    "hasSignedLease": true,
    "canContinue": true,
    "approvedAmount": 5136,
    "openToBuy": 3936,
    "paymentDueDate": "2025-04-15",
    "fundRequestDateTime": "2025-04-08T20:29:53.727201",
    "fundedDateTime": null,
    "amountToBeFunded": 600,
    "merchantDiscountPercent": 0.5,
    "merchantDiscountAmount": 600,
    "merchantRebatePercent": 0,
    "merchantRebateAmount": 0,
    "merchantRebateType": "DAILY"
}
```

---

#### 51.4 POST /uown/los/settleApplication

**O que faz:** Finaliza uma aplicacao de lease apos o cliente assinar o contrato e os produtos terem sido entregues. Dispara o processo de **funding** (pagamento ao merchant).

**Quando usar:** Somente apos:
1. Cliente ter assinado o lease digitalmente
2. Merchant ter entregue a mercadoria

**Request:**

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

**Campos da resposta:**

| Campo | JSON Tag | Descricao |
|-------|----------|-----------|
| Transaction Status | `transactionStatus` | A0 = nao settled, A1 = settled |
| Amount | `amount` | Valor envolvido na transacao |
| Transaction Message | `transactionMessage` | Mensagem descritiva (em caso de A0) |
| Payment Details | `paymentDetailsList` | Detalhes dos pagamentos |
| Account Number | `accountNumber` | Mesmo do request |
| Authorization Number | `authorizationNumber` | Se sucesso (A1) |

**Exemplo de resposta (nao elegivel - A0):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "transactionMessage": "LeadStatus UW_APPROVED is not eligible for settlement",
    "transactionStatus": "A0",
    "amount": 0,
    "paymentDetailsList": []
}
```

**Exemplo de resposta (settled com sucesso - A1):**

```json
{
    "faults": false,
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9",
    "authorizationNumber": "8365",
    "transactionStatus": "A1",
    "amount": 1200,
    "paymentDetailsList": []
}
```

---

#### 51.5 POST /uown/los/addLease

**O que faz:** Cria um **lease adicional** usando o credito remanescente de um lease previamente financiado do mesmo cliente.

**Pre-condicoes:**
1. Lease original deve estar **FUNDED**
2. Cliente deve ter feito o **primeiro pagamento** em dia
3. Deve existir **credito remanescente** disponivel (`openToBuy > 0`)

**Request:** Estrutura identica ao sendInvoice, mas usando endpoint diferente.

```json
{
    "userName": "merchant_user",
    "setupPassword": "merchant_pass",
    "merchantNumber": "OL90202-0001",
    "accountNumber": "c60b6434-29ef-43ac-bd0e-594a72741b53",
    "customerCode": "ABC123",
    "orderType": "1",
    "invoiceNumber": "R91931",
    "orderTotal": "250.00",
    "selectedPaymentFrequency": "WEEKLY",
    "lineItem": [
        {
            "lineItemLineNumber": "1",
            "lineItemProductNumber": "A123SKU5987",
            "lineItemProductDescription": "Product test description",
            "lineItemProductCategory": "Cat1",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "250",
            "lineItemExtendedPrice": "250.00"
        }
    ]
}
```

**Resposta de erro (lease nao finalizado):**

```json
{
    "faults": false,
    "sorErrorDescription": "Cannot add a lease before the lease contract is finalized.",
    "transactionStatus": "A0",
    "authApprovalStatus": "DECLINED"
}
```

**Resposta de sucesso (add lease aprovado):**

```json
{
    "faults": false,
    "accountNumber": "049819e0-c4fe-47a1-a2d7-613bed206c08",
    "authorizationNumber": "8367",
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Joe",
    "customerLastName": "Sample",
    "orderTotal": 250,
    "purchaseNowTotal": 0,
    "transactionStatus": "A1",
    "authApprovalStatus": "APPROVED",
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 587.03,
            "totalContractAmountNoTax": 552.48,
            "regularPaymentWithTax": 10.49,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 10.49,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        },
        {
            "redirectUrl": "https://origination.uownleasing.com/completeApplication?uuid=...",
            "totalContractAmountWithTax": 587.03,
            "totalContractAmountNoTax": 552.50,
            "regularPaymentWithTax": 20.96,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentWithFeesAndTax": 20.96,
            "firstPaymentDate": "2025-04-15",
            "paymentDueToday": 0
        }
    ]
}
```

---

#### 51.6 POST /uown/los/merchant/changeMerchant

**O que faz:** Altera o merchant associado a uma aplicacao. Usado quando uma aplicacao precisa ser transferida para outro merchant.

**NOTA:** Este endpoint usa campos de autenticacao diferentes dos demais (`username`/`password` em vez de `userName`/`setupPassword`).

**Request:**

```json
{
    "username": "admin_user",
    "password": "admin_pass",
    "refMerchantCode": "OL90294-0002",
    "accountNumber": "235c48df-7ae0-4fa5-a93a-e7f65e8cffd9"
}
```

| Campo | JSON Tag | Obrigatorio | Descricao |
|-------|----------|-------------|-----------|
| Username | `username` | Sim | Diferente dos demais endpoints (lowercase) |
| Password | `password` | Sim | Diferente dos demais endpoints |
| Codigo Merchant | `refMerchantCode` | Sim | Codigo do novo merchant |
| Account Number | `accountNumber` | Sim | UUID da aplicacao |

---

### Requisito de IP Whitelisting

Os IPs de saida (egress) do sistema do merchant devem ser registrados e liberados pela UOwn antes de poder acessar a API. Para provedores de nuvem, recomenda-se usar **NAT Gateway** para garantir IPs consistentes de saida.

---

### Regras do Sandbox para Testes

| Regra | Descricao |
|-------|-----------|
| **SSN terminando em 9** | Aplicacao sera **negada** (simula falha) |
| **SSN terminando em 0-8** | Aplicacao sera **aprovada** (simula sucesso) |
| **Valor minimo do lease** | **$250** - aplicacoes abaixo deste valor nao serao aprovadas |

### Resumo de Endpoints

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/uown/los/sendApplication` | POST | Submete aplicacao (com ou sem carrinho) |
| `/uown/los/sendInvoice` | POST | Envia/cancela/devolve/modifica invoice |
| `/uown/los/getApplicationStatus` | POST | Consulta status da aplicacao |
| `/uown/los/settleApplication` | POST | Finaliza lease e dispara funding |
| `/uown/los/addLease` | POST | Cria lease adicional com credito remanescente |
| `/uown/los/merchant/changeMerchant` | POST | Transfere aplicacao para outro merchant |

### Codigos de Status da Resposta

| Codigo | Campo | Significado |
|--------|-------|-------------|
| `E0` | `transactionStatus` | Aplicacao recebida, nao aprovada para transacao |
| `E1` | `transactionStatus` | Aplicacao aprovada para transacao |
| `E3` | `transactionStatus` | Erro de validacao (campo invalido no request) |
| `E4` | `transactionStatus` | Aplicacao negada (declined) |
| `A0` | `transactionStatus` | Settlement nao realizado / invoice nao processada |
| `A1` | `transactionStatus` | Settlement realizado / invoice processada com sucesso |
| `I0` | `transactionStatus` | Status informativo (consulta) |
| `APPROVED` | `appApprovalStatus` / `authApprovalStatus` | Aprovado |
| `DECLINED` | `appApprovalStatus` / `authApprovalStatus` | Negado |

---

## Apendice A: Integracoes com Terceiros

| Servico | Funcao | Momento de Uso | Como Ativar/Configurar |
|---------|--------|---------------|----------------------|
| **Sentilink** | Deteccao de identidade sintetica | Aplicacao (UW engine step 1) | Thresholds por merchant |
| **Neustar** | Verificacao de dados de contato | Aplicacao (UW engine step 2) | Checks habilitaveis por merchant |
| **LexisNexis** | Score de risco via registros publicos | Aplicacao (UW engine step 3) | Threshold por merchant |
| **SEON** | Motor de fraude digital (email/phone/IP) | Aplicacao (UW engine step 4) | 4 thresholds por merchant |
| **NeuroID** | Biometria comportamental | Preenchimento do formulario | `useNeuroIdCheck` por merchant |
| **Intellicheck** | Autenticacao de documento de ID | Submissao da aplicacao | `isIntellicheckRequired` por merchant |
| **Kount** | Fraude de cartao de credito | Pagamento | Automatico em todas transacoes CC |
| **Plaid** | Verificacao bancaria e de renda | Segunda chance (UW_REVIEW) | `isPlaidVerificationRequired` por merchant |
| **GDS / Taktile / ABB** | Engines de underwriting | Decisao de credito | Selecao via config por merchant |
| **TaxCloud** | Calculo + compliance de impostos | Toda transacao | `useTaxCloudApi = true` (default) |
| **TaxJar** | Calculo de impostos (alternativo) | Backup do TaxCloud | `useTaxCloudApi = false` |
| **Buddy Insurance** | Plano de protecao | Assinatura ou portal | `offerInsurance = true` no merchant + estados permitidos |
| **Five9** | Call center / IVR | Ligacoes telefonicas | Header `Username: Five9` |
| **Skit.ai** | Bot de cobranca automatizado | Ligacoes via TMS | Sweeps `createSkitDelinquent*` geram arquivos |
| **SignWell / PandaDoc** | Assinatura eletronica | Contrato | Config por merchant |
| **Profituity** | Processamento ACH | Pagamentos bancarios | Automatico via sweeps ACH |
| **Channel Payments / USAePay** | Gateway de CC | Pagamentos cartao | Automatico via sweeps CC |
| **SendGrid** | Envio de emails | Correspondencia | Automatico |
| **Twilio** | Envio de SMS | Correspondencia | Automatico |
| **SharePoint** | Armazenamento de documentos | Relatorios e venda de contas | Sweeps de relatorio |
| **Zendesk** | Tickets de suporte | Portal do cliente | Automatico via portal |
| **RTR** | Importacao de dados RTO/Kornerstone | Migracao de portfolios | Sweep `kornerstoneDailyImportSweep` |
| **PayWallet** | Desconto em folha de pagamento | Pagamentos | Sweep `processPayWalletPaymentsSweep` |
| **TrustPilot** | Avaliacoes de clientes | Pos-servicing | Sweep `refreshTrustPilotAccessKeySweep` |
| **Proget** | Bloqueio de dispositivos IoT/GPS | Inadimplencia | Sweep `progetDeviceLockingSweep` |
| **Vervent** | Documentos de lease para banco | Funding | Sweep `generateVerventOnBoardingFileSweep` |
| **PayPair** | Marketplace de financiamento (widget) | Originacao via merchant externo | Portal publico `dw93bg.paypair.com`, iframe `#llapp-iframe` |

---

## Apendice B: Referencia Rapida de Endpoints para Ativacao

### Configuracoes

| Acao | Endpoint |
|------|----------|
| Alterar configuracao | `POST /ConfigurationManagement/createOrUpdateConfig` body: `{"key":"...", "value":"..."}` |
| Recarregar todas configs | `GET /ConfigurationManagement/forceReloadConfig` |

### Sweeps

| Acao | Endpoint |
|------|----------|
| Disparar sweep | `POST /uown/svc/triggerScheduledTask/{taskName}` |
| Pausar sweep | `POST /uown/svc/pauseScheduledTask/{taskName}` |
| Resumir sweep | `POST /uown/svc/resumeScheduledTask/{taskName}` |
| Reagendar sweep | `POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger={cron}` |
| Listar todos | `GET /uown/svc/getAllScheduledTasks` |
| Detalhes | `GET /uown/svc/getScheduledTaskByName/{name}` |

### Pagamentos

| Acao | Endpoint |
|------|----------|
| CC Vintage Run | `POST /uown/svc/executeCCVintageRun/{startDate}/{endDate}` |
| CC Payment Sweep | `POST /uown/svc/sendCCPaymentsSweep` |
| ACH Payment Sweep | `POST /uown/svc/sendACHPaymentsSweep` |
| Rewind & Replay | `POST /uown/svc/rewindAndReplayAccount/{accountPk}` |
| Calcular EPO | Via `getPayoffAmount` no TMS |

### Contas

| Acao | Endpoint |
|------|----------|
| Mover due dates | `POST /uown/svc/moveDueDatesByDays/{accountPk}?moveNumberOfDays=N` |
| Cancelar conta | `POST /uown/svc/cancelAccount/{accountPk}` |
| Settlement | `POST /uown/los/settleApplication` |
| Modify Invoice | `POST /uown/los/modifyInvoiceForLead/{leadPk}` |

### Administracao

| Acao | Endpoint |
|------|----------|
| Cleanup logs | `DELETE /uown/cleanupLogEntries?to=YYYY-MM-DD` |
| Cleanup dados | `DELETE /uown/cleanupFunctionalEntities?to=YYYY-MM-DD` |
| Limpar maps | `GET /uown/clearApplicationRequestMap` |
| Carregar approved amounts | `POST /uown/loadApprovedAmountsFromExcel` |

---

## Apendice C: Tabelas de Banco Importantes para Verificacao

| Tabela | Uso | Quando Consultar |
|--------|-----|-----------------|
| `uown_sv_account` | Contas de servicing | Verificar status, saldo, rating |
| `uown_los_lead` | Leads de aplicacao | Verificar status do lead, UW result |
| `uown_sv_cctransaction` | Transacoes CC | Apos sweeps de CC |
| `uown_sv_achpayment` | Pagamentos ACH | Apos sweeps de ACH |
| `uown_sv_receivable` | Recebiveis | Verificar parcelas, EPO, due dates |
| `uown_sweep_logs` | Logs de sweep | Verificar execucao de qualquer sweep |
| `uown_scheduled_task` | Definicao de sweeps | Verificar cron, SQL, is_active |
| `uown_email_queue` | Fila de emails | Verificar correspondencia enviada |
| `uown_sv_protection_plan` | Plano de protecao | Verificar inscricoes/cancelamentos |
| `uown_sv_contract` | Contratos | Verificar status de e-sign |
| `uown_blacklist_*` | Listas negras | Verificar entradas de fraude |
| `uown_frequency_mods` | Mudancas de frequencia | Auditoria de mudancas |
| `uown_due_date_moves` | Movimentacoes de due date | Auditoria de ajustes |
| `qrtz_*` | Quartz scheduler | Estado dos jobs agendados |

---

## 52. Cancelamento de Conta (Account Cancellation)

### O Que e

Processo de encerramento de uma conta de lease, anulando o contrato. Pode incluir reembolso total de todos os pagamentos realizados.

### Para Que Serve

Usado quando ha fraude confirmada, pedido do merchant, periodo de cooling-off legal, ou acao administrativa que exija anulacao do contrato.

### Como Funciona

1. **Status da conta** muda para `CANCELLED`
2. **Timestamp** de cancelamento registrado (`cancelledDateTime = now()`)
3. **Comentario obrigatorio** explicando a razao do cancelamento
4. **Activity log** criado com o evento de mudanca de status
5. **Reembolso opcional:** Se `refundAllPayments = true`, todos os pagamentos aplicados sao reembolsados via `RefundPaymentService`

### Cancelamento de Conta via Lead

Quando o cancelamento e iniciado a partir de um lead (sistema LOS):

| Passo | Acao |
|-------|------|
| 1 | Valida existencia do lead e vinculo com conta |
| 2 | Opcionalmente reembolsa transacoes CC do LOS (config-driven) |
| 3 | Apenas transacoes com `action = SALE` e `status = APPROVED` sao reembolsadas |
| 4 | Transacoes reembolsadas recebem status `REFUNDED` |
| 5 | Executa cancelamento padrao da conta |

**Configuracao:** `com.uownleasing.svc.service.CancelAccountService.refund.los.payments` (default: `false`)

### Como Disparar

```
POST /uown/svc/cancelAccount/{accountPk}
Body: CancelAccountRequest { comment, refundAllPayments }
```

---

## 53. Reembolso de Pagamentos (Refund Payment)

### O Que e

Servico que processa reembolsos de pagamentos ja realizados, suportando tanto pagamentos ACH quanto CC, com capacidade de reembolso parcial ou total.

### Para Que Serve

Necessario quando um pagamento deve ser revertido -- por erro, cancelamento de conta, fraude, ou acordo com o cliente.

### Tipos de Reembolso

| Tipo | Metodo de Pagamento | Acao |
|------|---------------------|------|
| **Reembolso Total** | ACH ou CC | Reverte o valor integral do pagamento |
| **Reembolso Parcial** | ACH ou CC | Reverte parte do valor, criando novo registro para o restante |

### Logica de Reembolso CC

1. Recupera a transacao CC associada ao pagamento
2. Chama `CCRunRefundService` para executar o reembolso no gateway
3. **Somente prossegue** se a transacao de reembolso retornar status `APPROVED`
4. Detecta re-reembolso verificando se a transacao original ja tinha status `REFUNDED` ou `PARTIALLY_REFUNDED`

### Logica de Reembolso Parcial

Quando o valor de reembolso e menor que o valor original do pagamento:

1. Pagamento original marcado como `REVERSED` com data e timestamp de reversao
2. **Novo registro de pagamento** criado para o valor restante (`valorOriginal - valorReembolso`)
3. Novo pagamento herda: estrategia de alocacao, data de pagamento, status `PAID`

### Reembolso em Lote

O servico aceita lista de PKs de pagamento (separados por virgula) e processa cada um individualmente. Se um reembolso falhar, os demais continuam -- falhas sao coletadas e retornadas na resposta consolidada.

### Como Disparar

```
POST /uown/svc/refundPayment/{paymentPk}?amount={valor}&comment={motivo}
```

---

## 54. Arranjo de Pagamentos (Payment Arrangement)

### O Que e

Mecanismo para criar acordos de pagamento com clientes inadimplentes, processando multiplas transacoes CC ou ACH de uma vez e atualizando o status da conta.

### Para Que Serve

Quando um cliente esta em atraso, um agente pode negociar um plano de pagamento. O arranjo permite agendar e processar multiplos pagamentos em uma unica operacao.

### Como Funciona

#### Transacoes CC

1. **Primeira transacao:** Cartao e autorizado e tokenizado (`authorizeAndTokenizeCard`)
2. **Transacoes subsequentes:** Usam o mesmo token da primeira transacao
3. Cada transacao e processada independentemente apos tokenizacao
4. Username do agente registrado em cada transacao para auditoria

#### Pagamentos ACH

1. Cada pagamento ACH recebe o username do agente atual
2. Pagamentos sao criados ou atualizados individualmente via `createOrUpdateAchPayment`

### Impacto no Rating

Se a flag `paymentArrangement = true`:
- **Rating letter da conta** atualizado para `P` (Promise to Pay)
- **Auto-pay existente** e preservado e mantido

### Como Disparar

- **Via TMS:** `POST /uown/tms/makeCreditCardPayments` (CC)
- **Via TMS:** `POST /uown/tms/makeAchPayment` (ACH)
- **Via Admin:** Interface do agente de cobranca

---

## 55. Taxa de Assinatura (Signing Fee)

### O Que e

Servico que gerencia o calculo e cobranca de taxas no momento da assinatura do contrato -- inclui processing fee, security deposit e taxa do plano de protecao.

### Para Que Serve

Garante que o cliente pague a taxa obrigatoria antes de finalizar o contrato. Funciona como barreira de comprometimento e cobertura inicial de risco.

### Calculo do Valor

O valor cobrado e o **MAXIMO** entre:

| Componente | Fonte |
|------------|-------|
| Amount Charged at Signing | Programa do merchant |
| Processing Fee | Estado ou programa |
| Security Deposit | Estado |
| Protection Plan Fee | Plano de protecao |
| Zero | Valor minimo (floor) |

Se nao houver schedule summary, delega para `CalculatorService`.

### Pre-requisitos para Cobranca

| Condicao | Obrigatorio |
|----------|-------------|
| Taxa > $0 | Sim |
| Taxa nao ja cobrada (idempotencia) | Sim |
| CC ativo no arquivo via auto-pay | Sim |
| Transacao AUTHENTICATION aprovada existente | Sim |

### Fluxo de Cobranca

1. **Verificacao de idempotencia:** Busca transacoes existentes do tipo `CAPTURE` ou `SALE` com valor da taxa, tipo `FEE` e status `APPROVED`
2. **Se ja cobrada:** Retorna `true` sem processar novamente
3. **Se CC nao existe:** Status do lead muda para `SIGNING_FEE_DENIED`, retorna `false`
4. **Captura da transacao:** Cria transacao `CAPTURE` vinculada a autorizacao, valor arredondado com `HALF_EVEN`
5. **Se captura falhar:** Lead recebe status `SIGNING_FEE_DENIED`, nota adicionada com erro
6. **Se captura aprovada:** Envia recibo de pagamento ao cliente

### Recibo de Pagamento

- **Template:** `InitialPaymentReceipt`
- **Numero do recibo:** `UOWNCC{PaymentPk}`
- **Envio:** Configuravel (sincrono ou assincrono com delay configuravel, default 1000ms)

### Configuracoes

| Config | Default | Descricao |
|--------|---------|-----------|
| `check.if.cc.is.charged` | true | Verifica se taxa ja foi cobrada |
| `checkTimedOutCaptures` | false | Reutiliza capturas com timeout |
| `send.payment.receipt` | true | Envia recibo ao cliente |
| `send.payment.receipt.in.async` | true | Envio assincrono |

---

## 56. Calculo de Payoff (Payoff Amount)

### O Que e

Calcula o valor total necessario para quitar completamente um lease. Suporta logica diferenciada para contas Kornerstone vs contas padrao UOwn.

### Para Que Serve

Quando um cliente deseja quitar o lease fora da janela de 90 dias do EPO, ou quando um agente precisa informar o valor de quitacao total.

### Formula Kornerstone (KW Buyout)

Aplicavel apenas para programas Kleverwise, Prime10 ou KWChoice:

```
KwBuyoutAmount = EpoAmountWithTax
    - ((TotalPayments - ProtectionPlanFees - OtherFees) / MoneyFactor)
    + PastDueRegularPayments
```

| Componente | Descricao |
|------------|-----------|
| `TotalPayments` | Todos os pagamentos realizados ate a data |
| `ProtectionPlanFees` | Taxas do plano de protecao ate a data atual (NAO futuras) |
| `OtherFees` | NSF e outras taxas (passadas E futuras) |
| `MoneyFactor` | Do schedule summary (se zero, divisao retorna zero) |
| `PastDueRegularPayments` | Apenas parcelas regulares em atraso (exclui processing fees) |

**Arredondamento:** `CEILING` para o centavo mais proximo.

### Calculo Padrao (UOwn)

Usa query SQL configuravel armazenada em `SvSqlConfig` com nome `getEpoBalance`. A query retorna dados de breakdown separados por virgula.

### Validacao contra Saldo do Contrato

**Config:** `com.uownleasing.svc.service.PayOffAmountService.check.contract.balance.for.epo`

Se habilitado e o EPO calculado exceder o saldo do contrato, o saldo do contrato e usado como valor de payoff.

### Como Consultar

- **Via TMS:** `POST /uown/tms/getPayoffAmount/{accountPk}`
- **Via Admin:** Interface de detalhes da conta

---

## 57. Taxa NSF por Estado (NSF Fee)

### O Que e

Determina o valor da taxa de NSF (Non-Sufficient Funds / Fundos Insuficientes) para uma conta, com suporte a valores especificos por estado.

### Para Que Serve

Quando um pagamento ACH ou CC falha por insuficiencia de fundos, uma taxa e cobrada. O valor pode variar por estado conforme regulamentacao local.

### Logica de Determinacao

1. **Valor default:** Config `com.uownleasing.svc.service.AccountFeeService.nsfFee` (default: `$15.00`)
2. **Determinacao do estado:**
   - Merchant `INSTORE` -> usa estado do **merchant**
   - Merchant `ONLINE` -> usa estado do **endereco do cliente**
3. **Override estadual:** Se o `StateConfigurations` do estado tiver NSF fee configurado e > $0, usa o valor estadual
4. **Fallback:** Se nao houver override estadual, usa o valor default

---

## 58. Gestao de AutoPay e Instrumentos Financeiros

### O Que e

Servico que sincroniza automaticamente os metodos de pagamento automatico (AutoPay) da conta com base nos instrumentos financeiros disponiveis (contas bancarias e cartoes de credito).

### Para Que Serve

Garante que o AutoPay reflita corretamente os metodos de pagamento disponiveis. Quando um cartao e adicionado ou removido, o AutoPay se ajusta automaticamente.

### Regras de Sincronizacao

| Evento | Acao no AutoPay |
|--------|----------------|
| Conta bancaria adicionada | ACH habilitado automaticamente (se nao presente) |
| Ultima conta bancaria removida | ACH removido do AutoPay |
| Cartao de credito adicionado | CC habilitado automaticamente (se nao presente) |
| Ultimo cartao de credito ativo removido | CC removido do AutoPay |
| Conta bancaria removida mas CC existe | CC permanece ativo |
| CC removido mas conta bancaria existe | ACH permanece ativo |

### Impacto do Rating Letter

| Evento | Acao |
|--------|------|
| Rating alterado para `C` (Confirmed Bankruptcy) ou `P` (Payment Arrangement) | **Excluido de todos os sweeps de pagamento** via filtros SQL (`ScheduledACH/CC`, `RerunACH/CC`, `StickyRecoverSweep`) — equivalente a "AutoPay desligado" |
| Rating alterado para `M` (MR Money Owed) | **Comportamento sistemico nao confirmado** — doc historica afirmava que desliga AutoPay; nenhum filtro SQL atual exclui `M`. Investigar toggle separado em `cc.auto_pay` |
| Rating removido (setado para `NULL`) | Conta volta ao processamento padrao; AutoPay recalculado |
| Rating alterado para outro valor | Impacto varia por filtro SQL — ver tabela §19 |

### Auditoria

Toda mudanca de rating ou AutoPay gera activity log com valores anteriores e novos. Mudancas so sao logadas se o valor realmente mudar.

---

## 59. Alteracao de Valor de Aprovacao (Approval Amount Override)

### O Que e

Permite que administradores alterem o valor de aprovacao de credito de um lead apos o underwriting.

### Para Que Serve

Quando o valor aprovado pelo UW nao e adequado (muito alto ou muito baixo), um admin pode fazer override manual com justificativa.

### Pre-requisitos

| Condicao | Obrigatorio |
|----------|-------------|
| Valor de aprovacao nao nulo | Sim |
| Valor <= limite maximo por client type | Sim (default: $5.000) |
| UW data existente no lead | Sim |
| Lead status `UW_APPROVED` ou `CONTRACT_CREATED` | Sim |

### Limite Maximo por Client Type

Configuravel via `max.approval.amount.{ClientType}` (ex: `max.approval.amount.RETAIL`). Default geral: $5.000.

### O Que Acontece na Alteracao

1. **UW Response atualizado:** `creditLimit` muda para novo valor, `decision = "ACCEPT"`, adverse reasons limpos
2. **Dados antigos preservados:** UW data anterior salvo nas notas do lead como "Old UW data [JSON]"
3. **maxApprovalAmount:** Atualizado apenas se novo valor > valor atual
4. **Alerta criado** com valores antigo/novo e comentario do admin
5. **LeadModification registrado** com tipo `APPROVAL_AMOUNT_CHANGE`

### Como Disparar

```
POST /uown/los/overrideApprovalAmount
Body: LeadApprovalAmountOverrideRequest { leadPk, approvalAmount, comment }
```

---

## 60. Lease Adicional (Add Lease)

### O Que e

Permite que um cliente adicione um novo lease usando o credito remanescente de um lease previamente financiado.

### Para Que Serve

Clientes com credito remanescente (open-to-buy) podem financiar produtos adicionais sem precisar de nova aplicacao completa.

### Pre-requisitos

| Condicao | Obrigatorio |
|----------|-------------|
| Lead original com status `FUNDED` (configuravel) | Sim |
| Credito remanescente disponivel (`openToBuy > 0`) | Sim |
| ApplicationRequest recuperavel do lead original | Sim |

**Config:** `com.uownleasing.svc.service.AddLeaseService.valid.statuses.for.add.lease` (default: `"FUNDED"`)

### Como Funciona

1. **Valida status** do lead original
2. **Recupera ApplicationRequest** cached do lead original
3. **Limpa dados** de invoice e itens anteriores do request
4. **Configura vendor skips** (para evitar checks redundantes):
   - `skip.sentilink`: false (default -- executa Sentilink novamente)
   - `skip.neustar`: true (default -- pula Neustar)
   - `skip.seon`: true (default -- pula SEON)
   - `skip.lexisnexis`: true (default -- pula LexisNexis)
5. **Cria nova aplicacao** via `SendApplicationService`
6. **Se aprovado:**
   - Novo lead recebe `refLeadPk` apontando para lead original
   - Lead original marcado com `addedSecondLease = TRUE`
   - Activity logs criados em ambos os leads

### Como Disparar

```
POST /uown/los/addLease
```

---

## 61. Gestao de Consentimento (Consent Management)

### O Que e

Gerencia preferencias de consentimento do cliente, especificamente o consentimento para CC Peek (captura parcial de cartao).

### Para Que Serve

O consentimento de CC Peek controla se a UOwn pode capturar um valor parcial do cartao quando o saldo nao e suficiente para o valor total. O cliente pode permitir ou negar essa pratica.

### Como Funciona

- **Comparacao null-safe** usando `Objects.equals()` para verificar mudanca
- **Activity log** criado apenas se o valor realmente mudar (idempotente)
- **Mensagem de log:** `"CC Peek Consent changed from [anterior] to [novo]"`
- **Tipo de log:** `DATA_CHANGE`
- **Username** do operador registrado via `ThreadAttributes`

### Como Alterar

Via interface administrativa ou `ServicingInformationService`. Toda mudanca e registrada em activity log.

---

## 62. Continuacao e Finalizacao de Aplicacao

### 62.1 Continuacao de Aplicacao (Can Continue)

**O que e:** Verifica se uma aplicacao pode ser continuada, validando existencia do lead e requisitos pendentes.

**Logica de busca do lead:**
- Aceita UUID ou short code
- UUID e dividido no underscore e apenas a primeira parte e usada

**Verificacoes:**

| Verificacao | Resultado |
|-------------|-----------|
| Lead nao encontrado | `leadFound = false`, retorna |
| Merchant nao encontrado | Retorna incompleto |
| Cliente primario nao existe | Pode continuar (`canContinue = true`) |
| Cliente existe | Verifica elegibilidade para Plaid |

**Verificacao Plaid:**
- Depende do status do lead, flag `isPlaidVerificationRequired` do merchant, e dados de UW
- Se Plaid requerido e config habilitada, verificacao de telefone tambem e requerida

**Endpoint:** `POST /uown/los/canContinueApplication`

### 62.2 Finalizacao de Aplicacao

**O que e:** Recupera campos obrigatorios faltantes e envia comunicacoes de aprovacao.

**Campos de emprego verificados:**
- `nextPayDate` (proxima data de pagamento)
- `payFrequency` (frequencia salarial)
- `employer` (nome do empregador)

**Se lead DENIED:** Mensagem de nao aprovacao retornada, sem email/SMS enviado.

**Se lead aprovado:**
- **Email de aprovacao** enviado (sincrono ou assincrono, configuravel)
- **SMS de aprovacao** enviado se telefone com area code valido existir
- Formato do telefone: `areaCode + phoneNumber`

**Endpoint:** `GET /uown/los/getFinalApprovalDetails/{leadPk}`

---

## 63. Redirect de E-sign e Pos-Assinatura

### O Que e

Gerencia o fluxo de redirecionamento apos assinatura eletronica, mapeando eventos do provedor de e-sign para acoes no sistema.

### Para Que Serve

Apos o cliente assinar (ou cancelar) o contrato, o sistema precisa: redirecionar o cliente de volta ao merchant, atualizar o status do lead, e iniciar fluxos pos-assinatura.

### Mapeamento de Eventos

| Provedor | Evento Assinado | Evento Cancelado |
|----------|----------------|-----------------|
| **SignWell** | `completed` (config: `sw.esign.event.signed`) | `declined, closed, error` (config: `sw.esign.event.canceled`) |
| **PandaDoc** | `completed` (config: `pd.esign.event.signed`) | `exception` (config: `pd.esign.event.canceled`) |

### Construcao da URL de Redirect

**Prioridade de URL base:**
1. Variavel de ambiente `SVC_URL` (ex: `svc-dev1` -> `origination-dev1.uownleasing.com`)
2. Config `redirect.base.url` (fallback)
3. `merchantRedirectUrl` do merchant (se configurado)

**Formato da URL para merchant:**
```
{merchantRedirectUrl}?event={completed|canceled}&ata={uuid}
```

**Post-Message:** Se merchant tem `postMessage = true`, adiciona `&postMessage=true` para fluxos em iframe.

### Fluxo Pos-Assinatura

1. **Verificacao de assinatura:** Chama `isLeaseOrLeaseModSigned()`
2. **Atualizacao de status:** Se assinado, atualiza status do lead
3. **Execucao sincrona/assincrona:** Merchants especificos executam sincrono (por ref code ou client type), demais usam `CompletableFuture`
4. **Plano de protecao:** Iniciado assincronamente apos atualizacao de status

---

## 64. Verificacao de Endereco (Melissa Data)

### O Que e

Servico de verificacao e padronizacao de enderecos usando o servico externo Melissa Data, com mecanismo de cache para evitar chamadas redundantes.

### Para Que Serve

Garante que enderecos fornecidos pelos clientes sao validos e padronizados conforme USPS. Enderecos invalidos podem indicar fraude ou causar problemas de entrega.

### Mecanismo de Cache

| Condicao | Acao |
|----------|------|
| Endereco nao verificado anteriormente | Executa Melissa Data |
| Verificacao existente, `lastRun` > 30 dias atras | Executa Melissa Data novamente |
| Verificacao existente, `lastRun` <= 30 dias atras | Retorna resultado em cache |

**Config:** `days.past.last.run` (default: 30 dias)

### Correspondencia de Endereco

Busca por quatro componentes:
- Street Address 1
- City
- State
- ZIP Code

---

## 65. Geolocalizacao por CEP

### O Que e

Servico que converte CEP (ZIP code) em informacao de condado (county) usando fonte externa.

### Para Que Serve

A informacao de condado e necessaria para calculo correto de impostos, pois nos EUA cada condado pode ter taxas diferentes. Tambem usado para compliance regulatorio.

### Como Funciona

- **Fonte:** `https://www.getzips.com/cgi-bin/ziplook.exe?Zip={zipcode}`
- **Parser:** JSoup para extrair condado do HTML retornado
- **Fallback:** Retorna `null` silenciosamente em caso de erro
- **Sem cache:** Cada consulta faz chamada HTTP

---

## 66. Convite para Portal do Cliente

### O Que e

Servico que envia convites por email e SMS para que clientes acessem o portal de autoatendimento.

### Para Que Serve

Aumenta a adocao do portal, reduzindo o volume de ligacoes ao call center.

### Logica de Envio

| Canal | Config de Habilitacao | Template | Condicao de Envio |
|-------|----------------------|----------|-------------------|
| **Email** | `send.customer.portal.link.email` (default: true) | `CustomerPortalReminderEmail` | Email existe E `doNotEmail = false` |
| **SMS** | `send.customer.portal.link.sms` (default: true) | `CustomerPortalReminderSms` | Telefone existe E `doNotText = false` |

### Respeito ao Opt-Out

O sistema respeita duas camadas de opt-out:
1. **Configuracao global:** Admin pode desabilitar envio por canal
2. **Preferencia do cliente:** `doNotEmail` e `doNotText` no registro do cliente

### Mensagens de Resposta

| Cenario | Mensagem |
|---------|----------|
| Ambos enviados | "Customer portal reminder email and SMS sent successfully." |
| Apenas email | "Email sent successfully. SMS not sent due to [opt-out/disabled]." |
| Apenas SMS | "SMS sent successfully. Email not sent due to [opt-out/disabled]." |
| Nenhum enviado | "Email not sent due to [reason], SMS not sent due to [reason]." |

---

## 67. Auditoria de Modificacoes de Funding

### O Que e

Registra e rastreia todas as modificacoes de status no processo de funding, mantendo trilha de auditoria completa.

### Para Que Serve

Compliance e troubleshooting. Permite reconstruir o historico completo de mudancas de status de funding para qualquer lead.

### Dados Registrados

| Campo | Descricao |
|-------|-----------|
| `leadPk` | Identificador do lead |
| `oldFundingQueueStatus` | Status anterior (FUNDING, FUNDED, etc.) |
| `newFundingQueueStatus` | Novo status |
| `oldLeadStatus` | Status anterior do lead |
| `newLeadStatus` | Novo status do lead |
| `username` | Usuario que fez a alteracao |
| `timestamp` | Data/hora da modificacao |

### Transicoes Validas de Funding

| Transicao | Descricao |
|-----------|-----------|
| `FUNDING -> FUNDED` | Merchant recebeu pagamento (fluxo normal) |
| `FUNDED -> FUNDING` | Reversao (erro ou correcao) |
| `REQUEST_REFUND -> REFUNDED` | Reembolso completado |
| Outra | Transicao invalida/default |

### Como Consultar

```
POST /uown/svc/getFundingModifications
Body: FundingModificationsRequest { leadPk, oldStatus, newStatus, username, startDate, endDate }
```

Suporta paginacao e filtros opcionais (todos os campos sao nullable).

---

## 68. Ajuste de Data do Primeiro Pagamento (First Payment Due Date)

### O Que e

Logica que garante que a data do primeiro pagamento (FPD) esteja sempre a uma distancia minima no futuro, ajustando automaticamente quando necessario.

### Para Que Serve

Evita que recebiveis sejam criados com datas de vencimento ja passadas ou muito proximas, o que causaria inadimplencia imediata.

### Regra de Ajuste

1. A FPD deve ser pelo menos **N dias no futuro** (config: `difference.in.days.between.first.receivable.next.pay.date`, default: 3)
2. Se a FPD nao atender ao minimo, e empurrada para a **proxima data de pagamento** baseada na frequencia (do emprego ou da frequencia de pagamento)
3. O ajuste e **recursivo** -- repete ate encontrar uma data valida no futuro
4. Contas SVC possuem config separada para o intervalo minimo

### Impacto

- Afeta criacao de recebiveis tanto no LOS quanto no SVC
- Garante que o primeiro pagamento sempre caia em data futura valida

---

## 69. Elegibilidade para Auto Paid-Out

### O Que e

Servico que determina automaticamente se uma conta e elegivel para status `PAID_OUT` (quitada), baseado no saldo restante e datas de vencimento.

### Para Que Serve

Automatiza o encerramento de contas que ja pagaram o suficiente, sem necessidade de acao manual.

### Criterios de Elegibilidade

| Criterio | Descricao |
|----------|-----------|
| **Data minima** | Data atual deve ser >= ultima data de vencimento regular (conta nao pode ser encerrada antes do vencimento programado) |
| **Saldo restante** | `Saldo = Total do Contrato - Total de Pagamentos Realizados` |
| **Threshold de pagamento** | Saldo restante <= valor de uma parcela regular programada |
| **OU Threshold de taxa** | Saldo restante <= total de taxas elegiveis (MANUAL_FEE, MISC_FEE, NSF_FEE) |

### Tipos de Taxa Elegiveis

Configuravel via `eligibility.fee.types` (default: `MANUAL_FEE, MISC_FEE, NSF_FEE`). Apenas esses tipos de taxa sao considerados no threshold de taxa para elegibilidade.

### Resultado

Se elegivel: conta muda para `PAID_OUT`, email "Paid in Full" enviado, data de quitacao registrada.

---

## 70. Regras Detalhadas de Calculo EPO por Estado

### O Que e

O calculo do EPO segue uma cascata de regras estaduais que determinam descontos e formulas especificas.

### Cascata de Prioridade (verificada no codigo)

| Prioridade | Regra | Config | Exemplo |
|------------|-------|--------|---------|
| 1 | Desconto fixo sobre valor pago | `epo.discount.for.state.{STATE}` | Ex: TX = $50 desconto |
| 2 | Desconto sobre saldo restante | `epo.remaining.amount.discount.for.state.{STATE}` | Ex: FL = $30 |
| 3 | Percentual sobre saldo restante | `epo.discount.on.remaining.for.state.{STATE}` | Ex: GA = 5% |
| 4 | Formula especial (CA, HI, NY, WV) | Hardcoded | `EPO = cost * (remainingPayments / totalPayments)` |
| 5 | Desconto do programa | `merchantProgram.payoffDiscount` | Fallback |

### Regras Especiais por Estado

| Estado | Regra Especial |
|--------|---------------|
| **NC** | EPO nao pode ser menor que o valor da ultima parcela (`lastPaymentNoTaxWithFees`) |
| **CA, HI, NY, WV** | Formula proporcional: `cost * (remainingPayments / totalPayments)` |

### Desativacao de Recebiveis

Ao criar novos recebiveis (ex: mudanca de frequencia), o sistema desativa os anteriores:
- **Para leads:** Desativa TODOS os recebiveis nao pagos
- **Para contas:** Desativa apenas tipos especificos: `PROCESSING_FEE`, `PROTECTION_PLAN_FEE`, `EARLY_PAY_OFF`, `REGULAR_PAYMENT`

---

## Apendice D: Constantes de Negocio e Enumeracoes

### D.1 Status de Aprovacao de Aplicacao (AppApprovalStatus)

| Valor | Codigo | Descricao |
|-------|--------|-----------|
| `APPROVED` | E0 | Aplicacao aprovada |
| `DELAYED` | E1 | Aprovacao atrasada/pendente de revisao |
| `EDIT_ERROR` | E2 | Erro nos dados da aplicacao requerendo correcao |
| `SYSTEM_ERROR` | E3 | Erro de sistema durante processamento |
| `DECLINED` | E4 | Aplicacao negada |

**Mapeamento de UnderwritingStatus:**
- APPROVED -> AppApprovalStatus.APPROVED
- DENIED -> AppApprovalStatus.DECLINED
- REVIEW -> AppApprovalStatus.DELAYED
- OTHER -> AppApprovalStatus.SYSTEM_ERROR

### D.2 Status de Autorizacao (AuthApprovalStatus)

| Valor | Codigo | Descricao |
|-------|--------|-----------|
| `APPROVED` | A1 | Autorizacao aprovada |
| `PRE_QUALIFIED` | A2 | Pre-qualificacao concedida |
| `DECLINED` | A0 | Autorizacao negada |

### D.3 Status de Pagamento do Cliente (CustomerPaymentStatus)

| Valor | Descricao |
|-------|-----------|
| `PAID` | Pagamento recebido e processado |
| `REVERSED` | Pagamento revertido/chargeback |
| `CANCELLED` | Pagamento cancelado antes do processamento |
| `RETURNED` | Pagamento devolvido (ex: cheque NSF) |
| `ERROR` | Erro no processamento |
| `DENIED` | Pagamento negado/recusado |
| `PENDING` | Aguardando processamento |
| `PENDING_REFUND` | Reembolso pendente |
| `REFUNDED` | Pagamento reembolsado |
| `SENT_TO_BANK` | Enviado ao sistema bancario |
| `UNKNOWN` | Status indeterminado |

### D.4 Status da Fila de Funding (FundingQueueStatus)

| Valor | Descricao | Lead Status Correspondente |
|-------|-----------|---------------------------|
| `FUNDING` | Em processo de funding | LeadStatus.FUNDING |
| `FUNDED` | Financiado com sucesso | LeadStatus.FUNDED |
| `REQUEST_REFUND` | Reembolso solicitado | LeadStatus.OTHER |
| `REFUNDED` | Reembolsado | LeadStatus.OTHER |

### D.5 Status de Transacao de Funding (FundingTransactionStatus)

| Valor | Descricao |
|-------|-----------|
| `ACTIVE` | Transacao ativa |
| `INACTIVE` | Transacao inativa |
| `CANCELLED` | Transacao cancelada |

### D.6 Tipos de Programa do Merchant (MerchantProgramType)

| Valor | Descricao |
|-------|-----------|
| `SAME_AS_CASH` | Financiamento "mesmo que dinheiro" -- se pago em 90 dias, paga preco a vista |
| `QUICK_PAY` | Plano de pagamento acelerado com percentual fixo |

### D.7 Tipo de Merchant (MerchantType)

| Valor | Descricao | Regra de Determinacao |
|-------|-----------|----------------------|
| `ONLINE` | E-commerce/internet | Codigos iniciando com "OL" ou "ON", ou "OW90218" |
| `INSTORE` | Loja fisica | Todos os demais codigos |

**Impacto:** Determina se o estado usado para impostos/programas e do **cliente** (ONLINE) ou do **merchant** (INSTORE).

### D.8 Tipo de Ordem (OrderType)

| Valor | Codigo | Descricao |
|-------|--------|-----------|
| `SALE` | 1 | Venda padrao |
| `RETURN` | 2 | Devolucao |
| `EXCHANGE` | 3 | Troca |
| `ADJUSTMENTS` | 4 | Ajuste |
| `CANCEL` | 5 | Cancelamento |

### D.9 Tipo de Item de Linha (LineItemType)

| Valor | Codigo | Descricao |
|-------|--------|-----------|
| `DEBIT_SALE` | D | Item de venda/debito |
| `CREDIT_RETURN` | C | Item de devolucao/credito |

### D.10 Status de Verificacao Bancaria (BvStatus)

| Valor | Descricao |
|-------|-----------|
| `PENDING` | Verificacao aguardando processamento |
| `COMPLETE` | Verificacao concluida |
| `ERROR` | Erro durante verificacao |
| `INVALID` | Informacoes bancarias invalidas |
| `PENDING_LENDING_ATTRIBUTES` | Aguardando atributos adicionais |

### D.11 Status do NeuroID (NeuroIdStatus)

| Valor | Descricao |
|-------|-----------|
| `SUCCESS` | Verificacao comportamental concluida |
| `PROFILE_NOT_FOUND` | Perfil nao encontrado (JS desabilitado) |
| `ERROR` | Erro na verificacao |

### D.12 Status de Settlement (SettlementTransactionStatus)

| Valor | Codigo | Descricao |
|-------|--------|-----------|
| `REJECTED` | A0 | Transacao de settlement rejeitada |
| `ACCEPTED` | A1 | Transacao de settlement aceita |

### D.13 Tipos de Contato (ContactType)

| Valor | Descricao |
|-------|-----------|
| `MOBILE_PHONE` | Telefone movel |
| `SMS` | Mensagem de texto |
| `EMAIL` | Email eletronico |
| `CELL_PHONE` | Celular (alternativo) |
| `HOME_PHONE` | Telefone residencial |
| `WORK_PHONE` | Telefone comercial |

### D.14 Categorias de Produto (Category)

| Valor | Descricao |
|-------|-----------|
| `FURNITURE` | Moveis |
| `TIRE` | Pneus |
| `RETAIL` | Varejo geral |
| `OTHER` | Outros |

### D.15 Tipo de Modificacao (ModType)

| Valor | Descricao |
|-------|-----------|
| `LEAD_STATUS_CHANGE` | Mudanca de status do lead |
| `LEASE_MOD` | Modificacao do lease |
| `APPROVAL_AMOUNT_CHANGE` | Alteracao do valor de aprovacao |

### D.16 Tipo de Rebate do Dealer (DealerRebateType)

| Valor | Descricao |
|-------|-----------|
| `DAILY` | Rebate diario |
| `MONTHLY` | Rebate mensal |
| `QUARTERLY` | Rebate trimestral |
| `YEARLY` | Rebate anual |

### D.17 Tipo de Taxa de Plataforma (PlatformFeeType)

| Valor | Descricao |
|-------|-----------|
| `MONTHLY` | Cobranca mensal |
| `DAILY` | Cobranca diaria |
| `QUARTERLY` | Cobranca trimestral |
| `YEARLY` | Cobranca anual |

### D.18 Origem de Importacao (ImportSource)

| Valor | Descricao |
|-------|-----------|
| `LOS` | Loan Origination System |
| `UOWN_V1` | Sistema legado UOwn v1 |
| `KORNERSTONE` | Sistema Kornerstone |

### D.19 Tipo de Integracao (IntegrationType)

| Valor | Descricao |
|-------|-----------|
| `API` | Integracao via API (server-to-server) |
| `PORTAL` | Integracao via portal web (manual) |
| `HYBRID` | Combinacao API + portal |

### D.20 ZIP Codes em Fronteiras Estaduais

O sistema mantem mapeamento especial para CEPs que cruzam fronteiras estaduais:

| ZIP Code | Estados |
|----------|---------|
| 02861 | MA / RI |
| 42223 | KY / TN |
| 59221 | MT / ND |
| 63673 | IL / MO |
| 71749 | AR / LA |
| 73949 | OK / TX |
| 81137 | CO / NM |
| 84536 | AZ / UT |
| 86044 | AZ / UT |
| 86515 | AZ / NM |
| 88063 | NM / TX |
| 89439 | CA / NV |
| 97635 | CA / OR |

### D.21 Tipos de Cliente Integrados (ClientType)

O sistema suporta 34 tipos de clientes/merchants, cada um com campanhas e configuracoes proprias:

| ClientType | Nome | Segmento |
|------------|------|----------|
| `RWS` | Retailer Web Services | Varejo geral |
| `PAY_TOMORROW` | Pay Tomorrow | Plataforma financeira |
| `PAY_TOMORROW_FRASER` | Frasier Auto | Automotivo |
| `TIRE_AGENT` | Tire Agent | Pneus |
| `TERRACE_FINANCE` | Terrace Finance | Financeira |
| `STORIS` | Storis | Moveis (POS) |
| `V1_UOWN` | UOwn v1 (legado) | Legado |
| `WE_GET_FINANCING` | We Get Financing | Financeira |
| `FIRST_APP` | First App | Plataforma |
| `DANIELS_JEWELERS` | Daniel's Jewelers | Joalheria |
| `SASLOW_JEWELERS` | Saslow's Jewelers | Joalheria |
| `EPC_VIP` | EPC VIP | Varejo |
| `FORM_PIPER` | Form Piper | Plataforma |
| `FLEXX_BUY` | Flexx Buy | Financeira |
| `RTB_SHOPPER` | RTB Shopper | Varejo |
| `TIRE_BROS` | Tire Bros | Pneus |
| `JEWELRY` | UOwn Jewellers | Joalheria |
| `VERACITY` | Veracity | Varejo |
| `BRIDGE` | Bridge | Financeira |
| `EVERLY` | Everly | Varejo |
| `LEND_PRO` | Lend Pro | Financeira |
| `SWEET_PAY` | Sweet Pay | Financeira |
| `WATSCO` | Watsco | HVAC/Refrigeracao |
| `360_FINANCE` | 360 Finance | Financeira |
| `MY_EYE_MED` | My Eye Med | Saude/Otica |
| `CHOICE_PAY` | Choice Pay | Financeira |
| `PAY_POSSIBLE` | Pay Possible | Financeira |
| `SYNCHRONY` | Synchrony | Financeira |
| `BUY_ON_TRUST` | Buy on Trust | Confianca |
| `SKEPS` | Skeps | Plataforma |
| `CONECTA_MOBILE` | Conecta Mobile | Telecom |
| `KORNERSTONE` | Kornerstone | Senior Living |
| `BIG_HORN_GOLF` | Big Horn Golf | Esporte/Lazer |
| `OTHER` | Outros | Catch-all |

---

## Apendice E: Referencia de Campanhas de Underwriting

Cada ClientType possui IDs de campanha para horarios de pico (peak) e fora de pico (off-peak):

| ID | Campanha |
|----|----------|
| 137 | Tires Peak |
| 141-146 | Core Furniture |
| 149 | Shed |
| 150 | Tires Off Peak |
| 151 | Pay Tomorrow Peak |
| 152 | Pay Tomorrow Off Peak |
| 153 | Electro Peak |
| 154 | Electro Off Peak |
| 155 | Pricebusters |
| 156 | Frasier Auto |
| 157 | Saslow Jewelers |
| 159 | Daniels Jewelers |
| 160 | UOwn Jewellers |
| 164 | Eye/Optical |
| 170 | Conecta / Kornerstone (Senior Living) |

**Regra de selecao:** Em producao, entre `peakStartHour` e `peakEndHour` usa `peakCampaignId`, caso contrario usa `offPeakCampaignId`. Em ambientes de teste, sempre usa peak.

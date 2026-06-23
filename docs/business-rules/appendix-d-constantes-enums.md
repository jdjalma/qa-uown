---
title: "Apendice D: Constantes de Negocio e Enumeracoes"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/types/enums.ts#FundingQueueStatus
  - code: src/types/enums.ts#LeadStatus
  - svc-source: enumeration/ClientType.java
  - svc-source: analytics/enumeration/JourneyStatus.java
  - env: qa2
covers: [enums, constantes, status, funding-queue, lead-status, approval-status, magwitch, rightfoot, customer-journey]
---

# Apendice D: Constantes de Negocio e Enumeracoes
## UOwn Leasing - SVC Platform

Todos os enums, constantes e valores de referencia do sistema.

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

> **Atencao — E0/E1 em campos distintos:** No campo `AppApprovalStatus`, `E0` = APROVADO e `E1` = aprovacao atrasada. No campo `transactionStatus` (mesmo response JSON), `E0` = "recebida, nao aprovada para transacao" e `E1` = "aprovada para transacao". Sao campos distintos com semanticas opostas para o mesmo codigo — nunca usar `E0` como sinonimo de "aprovado" ao inspecionar `transactionStatus`.

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
| `NOT_ENOUGH_INTERACTION_DATA` | **(R1.53.0)** Dados comportamentais insuficientes — tratado como **pass-through nao-bloqueante** (`success=true`); fraude segue por outros sinais. Toggle de simulacao: `...NeuroIdVerificationService.simulate.not.enough.interaction.data` (default false) |

> **[ATENCAO — drift]** O guard "prevent repeated NeuroID calls" (`preventRepeatedNeuroIdCallsSigningRetry`) **NAO esta merge na R1.53.0** (branch `R1.53.0_neuro_id`, revertido). Detalhe em [02-originacao-pipeline.md §5.5](02-originacao-pipeline.md).

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

### D.18 Abreviacoes de Frequencia de Pagamento (PaymentFrequency) — Task #439

| Frequencia | Valor enum | Abreviacao |
|------------|-----------|------------|
| Semanal | `WEEKLY` | `WK` |
| Quinzenal | `BI_WEEKLY` | `BWK` |
| Bimensal | `SEMI_MONTHLY` | `SM` |
| Mensal | `MONTHLY` | `MN` |

### D.19 Formato do planId — Task #439

O `planId` identifica unicamente uma combinacao de frequencia de pagamento e termo do programa.

**Formato:** `{abreviacao_frequencia}{termo_meses}`

**Exemplos:**

| planId | Significado |
|--------|-------------|
| `WK13` | Semanal, 13 meses |
| `BWK13` | Quinzenal, 13 meses |
| `SM16` | Bimensal, 16 meses |
| `MN16` | Mensal, 16 meses |

**Uso:**
- Incluido no `SchedSummaryInfo` retornado pela calculadora
- Aceito como parametro no endpoint `missing-fields` (alternativa a `selectedPaymentFrequency`)
- Usado pelo `SubmitApplicationService` para localizar o `PaymentOption` correto
- Presente na redirect URL do contrato

### D.20 Tipo de Arranjo de Pagamento (ArrangementType) -- Task #446

| Valor | Descricao |
|-------|-----------|
| `NORMAL` | Acordo de pagamento padrao (promise to pay). Conta permanece ACTIVE apos conclusao |
| `SETTLEMENT` | Acordo de quitacao negociada. Conta transiciona para SETTLED_IN_FULL apos conclusao |

### D.21 Status do Arranjo de Pagamento (PaymentArrangementStatus) -- Task #446

| Valor | Descricao |
|-------|-----------|
| `NOT_STARTED` | Arranjo criado, nenhuma transacao processada |
| `IN_PROGRESS` | Transacoes em andamento, restam pendentes |
| `SUCCESS` | Todas as transacoes concluidas com sucesso |
| `FAILED` | Pelo menos uma transacao falhou. Arranjo desativado, rating resetado |

### D.22 Origem de Importacao (ImportSource)

| Valor | Descricao |
|-------|-----------|
| `LOS` | Loan Origination System |
| `UOWN_V1` | Sistema legado UOwn v1 |
| `KORNERSTONE` | Sistema Kornerstone |

### D.23 Tipo de Integracao (IntegrationType)

| Valor | Descricao |
|-------|-----------|
| `API` | Integracao via API (server-to-server) |
| `PORTAL` | Integracao via portal web (manual) |
| `HYBRID` | Combinacao API + portal |

### D.24 ZIP Codes em Fronteiras Estaduais

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

### D.25 Categorias de Antiguidade de Conta Bancaria (BankAccountAges)

Usado no portal Servicing para classificar o tempo de existencia da conta bancaria do cliente. Utilizado em avaliacao de risco ao cadastrar dados bancarios.

| Valor | Descricao |
|-------|-----------|
| `LESS_THAN_6_MONTHS` | Menos de 6 meses |
| `_6_TO_12_MONTHS` | De 6 a 12 meses |
| `_1_TO_2_YEARS` | De 1 a 2 anos |
| `_2_YEARS_OR_MORE` | 2 anos ou mais |
| `UNKNOWN` | Nao informado / desconhecido |

### D.26 Grupos de Documento (DocumentGroup)

Classifica os tipos de documentos que podem ser anexados a um lead ou conta no portal Servicing.

| Valor | Descricao |
|-------|-----------|
| `DRIVERSLICENSE` | Carteira de habilitacao / documento de identidade com foto |
| `PAYSTUB` | Contracheque / comprovante de renda |
| `BANKSTATEMENT` | Extrato bancario |
| `SIGNEDPOD` | POD assinado (Proof of Delivery — comprovante de entrega) |
| `CORRESPONDENCE` | Correspondencia generica (carta bancaria, comprovante de residencia, etc.) |
| `LEASE` | Contrato de lease assinado |

**Regras de acesso:**
- Upload requer permissao `upload_file_for_account`
- Edicao de metadados requer permissao `edit_document`
- Exclusao requer permissao `delete_file`
- Reenvio de documento armazenado requer permissao `resend_stored_doc`
- Visibilidade ao cliente controlada por flag `isVisibleToBorrower`

### D.27 Tipos de Cliente Integrados (ClientType)

O sistema suporta 35 tipos de clientes/merchants, cada um com campanhas e configuracoes proprias (fonte: `svc ClientType.java`):

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
| `MAGWITCH` | Magwitch | A confirmar (novo em R1.53.0) |
| `OTHER` | Outros | Catch-all |

> **`MAGWITCH` (R1.53.0, svc#566)** — adicionado em `ClientType.java` imediatamente antes de `OTHER`. Comportamento 100% genérico: usa `PayTomorrowClient` (sem subclasse própria), campanha peak/off-peak **142** (faixa "Core Furniture", sem distinção peak/off-peak), classificação de risco `DEFAULT`, **roda underwriting normalmente** (sem skip-UW), sem roteamento especial de programa (13m/16m), sem cap de aprovação ou provider de assinatura próprios. Difere dos demais brands genéricos (EPC_VIP, FORM_PIPER, FLEXX_BUY, etc.) apenas pelos campos de identidade: `username=magwitch`, `apiKey=U0wn_Magwitch_K7pN4x`, `clientUrl=https://magwitch.com/`. Segmento de negócio ainda não definido no código — confirmar com produto.

---

### D.28 Status de Item de Invoice (ItemStatus)

Status de cada item de linha dentro de uma invoice.

| Valor | Descricao |
|-------|-----------|
| `PENDING` | Item adicionado ao carrinho, aguardando entrega |
| `DELIVERED` | Item entregue ao cliente |
| `PAID` | Item pago (conta quitada) |
| `CANCELLED` | Item cancelado (devolvido ou cancelado pelo merchant) |

**Regra de settlement:** Para `settleApplication`, todos os itens devem estar com status `DELIVERED`. Itens `CANCELLED` ou `PAID` bloqueiam o processo.

### D.29 Tipo de Invoice (InvoiceType)

Classifica se a invoice e de um produto financiado ou comprado a vista.

| Valor | Descricao |
|-------|-----------|
| `LEASE` | Produto financiado via lease-to-own |
| `PURCHASED` | Produto comprado a vista (sem financiamento) |

Usado como filtro na fila de funding e em relatorios.

### D.30 Tipo de Conta Bancaria do Merchant (BankTypeEnum)

Tipo de conta bancaria usada para receber funding.

| Valor | Descricao |
|-------|-----------|
| `COMMERCIAL` | Conta bancaria comercial (business checking/savings) |
| `INVESTMENT` | Conta de investimento |

### D.31 Categorias de Produto do Merchant (MerchantCategory)

Tipos de produto que um merchant pode oferecer via lease.

| Valor | Descricao |
|-------|-----------|
| `FURNITURE` | Moveis |
| `TIRES` | Pneus |
| `SHED` | Galpoes / garagens pre-fabricadas |
| `LIVINGROOM` | Sala de estar |
| `BEDROOM` | Quarto |
| `DININGROOM` | Sala de jantar |
| `APPLIANCES` | Eletrodomesticos |
| `ELECTRONICS` | Eletronicos |
| `TIRE_PARTS` | Pecas e acessorios de pneus |
| `AUTOMOTIVES` | Automotivos |
| `AUTOMOTIVE_ACCESSORIES` | Acessorios automotivos |
| `OTHER` | Outros |

### D.32 Tipo de Cartao de Credito (CcOptions)

Bandeiras de cartao de credito aceitas no sistema.

| Valor | Descricao |
|-------|-----------|
| `AmericanExpress` | American Express |
| `MasterCard` | MasterCard |
| `Visa` | Visa |
| `Discover` | Discover |
| `Other` | Outras bandeiras |

### D.33 Categoria de Emprestimo (LendingCategoryType)

Classifica a categoria de risco do cliente para decisoes de programa e pricing.

| Valor | Descricao |
|-------|-----------|
| `LTO` | Lease-To-Own (categoria padrao da plataforma) |
| `PRIME` | Cliente prime (baixo risco) |
| `NEAR_PRIME` | Cliente near-prime (risco moderado) |

### D.34 Tipo de Taxa Cobravel (FeeType) — Visao Completa

Tipos de taxa que podem ser adicionados manualmente por agentes no portal Servicing.

| Valor | Descricao | Como Adicionar |
|-------|-----------|----------------|
| `PROTECTION_PLAN_FEE` | Taxa do plano de protecao Buddy Insurance | Automatico (via plano) |
| `NSF_FEE` | Taxa de fundos insuficientes | Automatico (evento NSF) |
| `REINSTATEMENT_FEE` | Taxa de reativacao | Manual (via Add Fee no Servicing) |
| `MANUAL_FEE` | Taxa manual generica | Manual (via Add Fee no Servicing) |
| `MISC_FEE` | Taxa diversa / miscelanea | Manual (via Add Fee no Servicing) |

**Validacoes ao adicionar taxa manual:**
- Data de vencimento >= hoje (nao pode ser no passado)
- Valor > $0
- Comentario obrigatorio (max 500 caracteres)
- `baseAmount = totalAmount = feeAmount` (sem calculo de imposto adicional)

---

### D.35 Tipo de Processo ACH (ACHProcessType)

Enum em `common` (`enumeration/ACHProcessType.java`). Indica a origem/natureza de cada linha `uown_sv_achpayment`.

| Valor | Significado |
|-------|-------------|
| `SCHEDULED` | Debito agendado regular do cronograma |
| `RERUN` | Retentativa de ACH retornado/revertido (sweep semanal) |
| `RERUN_NSF` | Retentativa especifica de NSF |
| `REQUEST` | ACH solicitado pontualmente (inclui arranjos SETTLEMENT) |
| `REFUND` | Estorno/reembolso ACH |
| `DAILY_RERUN_DELINQUENT` | **(R1.53.0, svc#540)** ACH criado pelo fluxo RightFoot apos confirmacao de saldo bancario suficiente -- ver secao 48 de [09-integracoes-externas.md](09-integracoes-externas.md) |

> **[OBSERVACAO]** O valor `DAILY_RERUN_DELINQUENT` vive na branch `R1.53.0` de `common` (commit `bfad466`); o checkout `master` local nao o contem.

### D.36 Status do Balance Check RightFoot (R1.53.0)

Coluna `uown_right_foot_balance_check.status`. Unico valor confirmado em codigo svc e o que o gate do ACH consome:

| Valor | Significado |
|-------|-------------|
| `SUCCESS` | Saldo confirmado pelo RightFoot; habilita a criacao do ACH se `exposure + amount + $100 <= balance` |

> **[HIPOTESE]** Demais valores (PENDING/FAILED/etc.) e o parser do webhook vivem na lib `com.uownleasing:rightfoot` (nao disponivel em disco). Nao assumir valores alem de `SUCCESS` sem inspecao live.

### D.37 Status da Jornada do Cliente (JourneyStatus) — R1.53.0

Enum `svc analytics/enumeration/JourneyStatus.java` (telemetria do funil de originacao, origination#1308). Coluna `uown_customer_journey.status`.

| Valor | Significado |
|-------|-------------|
| `IN_PROGRESS` | Jornada aberta (estado inicial) |
| `COMPLETED` | Cliente concluiu e foi redirecionado ao merchant (set apenas no evento `REDIRECT_COMPLETED`, idempotente) |
| `ABANDONED` | **Declarado mas nunca atribuido por codigo svc** -- nenhum sweep/job o seta em R1.53.0 (drop-off teria de ser derivado de `last_activity_at`). **[OBSERVACAO]** |

### D.38 Tipos de Evento de Customer Journey (event_type) — R1.53.0

`uown_customer_event.event_type` e **VARCHAR livre** na svc -- o vocabulario (~50 valores) vive no frontend `origination` (`lib/analytics/events.ts`, mapa `EV`). A svc interpreta apenas dois server-side: `PAGE_REFRESHED` (incrementa contadores de refresh) e `REDIRECT_COMPLETED` (marca a jornada como `COMPLETED`).

Grupos de eventos (frontend): page-views (`*_PAGE_VIEWED`), protection-plan (`PROTECTION_PLAN_OPTED_IN/OUT/SUBMITTED/SUBMIT_ERROR`), acoes do cliente (`ID_SCAN_*`, `SUBMIT_CLICKED`, `RETRY_CLICKED`), submit (`SUBMIT_RESPONSE_RECEIVED/ERROR`), friccao (`ERROR_DISPLAYED`, `PAGE_REFRESHED`, `RAGE_CLICK`, `LONG_RUNNING_API`), iframe (`IFRAME_LOAD_STARTED/COMPLETED/FAILED`), esign (`ESIGN_OPENED/COMPLETED/CLOSED/DECLINED/ERROR/OPEN_FAILED`), integracao merchant (`POSTMESSAGE_SENT/RECEIVED`, `REDIRECT_STARTED`, `REDIRECT_COMPLETED`).

---


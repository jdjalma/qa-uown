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

### D.25 Tipos de Cliente Integrados (ClientType)

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


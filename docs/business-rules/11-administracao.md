# Administracao e Operacoes
## UOwn Leasing - SVC Platform

Blacklist, item split, second opportunity, sweeps (processamento em lote), limpeza de dados, autenticacao de API e painel administrativo.

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

## 49. Modelo de Permissoes (Portal Servicing)

### O Que e

O portal Servicing implementa um modelo de permissoes granular que controla quais acoes cada agente pode executar. Permissoes sao verificadas por feature + acao.

### Permissoes de Visualizacao Restrita

| Permissao | O Que Controla |
|-----------|----------------|
| `restricted.view.full.dob` | Exibicao da data de nascimento completa |
| `restricted.view.full.ssn` | Exibicao do SSN completo |
| `restricted.view.partial.account_number` | Exibicao mascarada do numero de conta bancaria |
| `restricted.view.servicing_redirect` | Redirecionamento para o portal Servicing a partir do Origination |

### Permissoes de Modificacao por Feature

| Feature | Permissoes de Modificacao |
|---------|--------------------------|
| **account_sale** | `get_documents_for_sold_accounts_with_file` |
| **ach_history** | `disable_ach_payment` |
| **documents** | `edit_document`, `resend_stored_doc`, `upload_file_for_account`, `delete_file` |
| **payment** | `create_or_update_ach_payment`, `make_credit_card_payment` |
| **payment_transaction** | `reverse_payment`, `refund_payments`, `email_csv`, `download_csv` |
| **scheduled_payments** | `create_or_update_receivable` |
| **customer_information** | `create_or_update_primary_customer_info`, `create_or_update_employment`, `create_or_update_primary_customer_contact_info`, `create_or_update_servicing_information`, `create_or_update_bank_account`, `create_or_update_credit_card` |

### Permissoes do Portal Origination

| Feature | Permissoes |
|---------|------------|
| **customers** | `move_to_servicing`, `resend_lease`, `modify_lease`, `settle_application`, `change_lead_status`, `override_approval_amount`, `run_underwriting` |
| **documents** | `upload_file_for_lead`, `delete_file`, `get_document_status` |
| **funding** | `update_funding_status` |
| **newApplication** | `send_application_to_customer` |
| **calculator** | `get_calculator_results` |
| **alerts** | (modify geral) |
| **admin** | (operacoes administrativas) |

### Permissoes Especiais (Restricted Modify)

Permissoes adicionais necessarias para acoes criticas:

| Permissao | Acao Controlada |
|-----------|-----------------|
| `lead_status_to_expired` | Alterar status do lead para EXPIRED |
| `lead_status_denied_to_approved` | Reverter status DENIED para UW_APPROVED |
| `lead_status_approved_to_signed` | Mover lead de aprovado para SIGNED sem e-sign |

### Permissoes de Visualizacao Especiais

| Permissao | O Que Exibe |
|-----------|-------------|
| `customers.view.internal_status` | Campo `internalStatus` do lead |
| `documents.view.internal_notes` | Notas internas em documentos |

### Tracking de Login (Segurança)

A tabela `uown_login_attempt` registra todas as tentativas de autenticacao com:
- `username` — usuario que tentou login
- `success` — se o login foi bem sucedido
- `created_date` — timestamp da tentativa
- `ip_address` — IP de origem

O index `idx_uown_login_attempt` (V20260306062454) otimiza consultas de rate limiting e auditoria de seguranca.

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

## 51. Portal AMS — Associacao de Merchants a Usuarios (Task #74, R1.51.0)

### O Que e

O portal AMS (Account Management System) possui uma pagina dedicada para associar merchants a usuarios internos em lote: `/associate-users-to-merchants`. Esta funcionalidade permite que administradores atribuam quais merchants um usuario AMS pode acessar.

### Endpoints Envolvidos

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `POST /user/addMerchantsToUsers` | POST | Associa merchants a usuarios em lote (bulk assign) |
| `PUT /user/{username}` | PUT | Atualiza dados do usuario (dispara Log Activity) |
| `GET /user/{username}` | GET | Consulta detalhes do usuario |

### Regra de Negocio: Log Activity

- `POST /user/addMerchantsToUsers` **NAO** gera entrada no Log Activity do usuario.
- A UI "Edit User Merchants" (card accordion em `/users/[username]`) **tambem NAO** gera entrada no Log Activity.
- Apenas `PUT /user/{username}` (updateUser) gera uma entrada com tipo `"UPDATED user info: {...}"` no Log Activity.
- O Log Activity e exibido na pagina `/users/[username]` como uma tabela `react-data-table-component` com 4 colunas: `date`, `type`, `userId`, `notes`.

### Regra de Negocio: Edit User Merchants (UI)

O card "Edit User Merchants" na pagina `/users/[username]` permite editar diretamente a lista de merchants de um usuario:

- A operacao e de **OVERWRITE** — substitui toda a lista de merchants do usuario. Nao e aditiva.
- Fluxo: expandir o card (chevron no cabecalho) → clicar no icone de lapis (`span#EditUserMerchants-edit`) → selecionar merchants no React Select `#merchants` → clicar em SAVE.
- Ao entrar em modo de edicao, `span#EditUserMerchants-edit` e removido do DOM; o botao SAVE deve ser localizado via `.card:has(#merchants)`.
- As opcoes do React Select sao renderizadas em um portal — navegar via ArrowDown+Enter.
- Esta acao **NAO** gera entrada no Log Activity (confirmado via CT-E2E-07, tarefa #74).

### Fluxo de Associacao em Lote (UI — `/associate-users-to-merchants`)

1. Usuario navega para `/associate-users-to-merchants`
2. Seleciona usuarios na tabela esquerda (paginada)
3. Seleciona merchants na tabela direita (paginada)
4. Clica em "Submit" — abre modal Bootstrap de confirmacao
5. Clica em "Confirm" no modal
6. Toast de sucesso exibido (`.Toastify__toast--success`)

A operacao via `POST /user/addMerchantsToUsers` e **aditiva** — nunca remove associacoes existentes.

### Observacoes Tecnicas

- Ambas as tabelas de `/associate-users-to-merchants` usam `react-data-table-component` (`.rdt_Table`). O container de paginacao (`.rdt_Pagination`) e sibling do `.rdt_Table`, nao filho — escopo obrigatorio por `nth(0)` / `nth(1)` para nao misturar tabelas.
- A tabela de merchants carrega de forma assincrona apos a tabela de usuarios — aguardar primeiro row de ambas as tabelas antes de interagir.

---


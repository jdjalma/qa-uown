# User Stories — Jornada Completa do Lease
## UOwn Leasing — Da Aplicacao ao Pagamento Final

Mapeamento completo dos fluxos reais dos usuarios nas plataformas UOWN, com riscos de negocio do produto lease em cada etapa.

**Personas:**
- **Cliente** — consumidor final que aplica para o lease
- **Agente UOwn** — operador do portal Servicing que gerencia contas
- **Sistema** — sweeps automatizados e regras de negocio

**Ultima atualizacao:** 2026-03-20

---

# FASE 1: ORIGINACAO (Cliente + Merchant)

## US-ORI-01: Cliente Aplica para Lease no Site do Merchant

**Persona:** Cliente
**Portal:** Website do Merchant (Origination embed)
**Trigger:** Cliente escolhe produtos e clica "Apply for Lease"

### Fluxo do Usuario
1. Cliente preenche formulario: nome, SSN, endereco, telefone, email, emprego, renda
2. Envia aplicacao → pipeline de 18 steps executa em segundos
3. **Se aprovado:** recebe tela com limite de credito, opcoes de pagamento (frequencias), e link para completar
4. **Se negado:** recebe mensagem generica de negacao + email de adverse action (se UW denied)
5. **Se revisao:** pode ser redirecionado para Plaid (verificacao bancaria)

### Criterios de Aceite
- [ ] Lead criado com status inicial `NEW` → transiciona ate `UW_APPROVED` ou `UW_DENIED`
- [ ] Response contem `creditLimit`, `providerURL`, `paymentDetailsList`
- [ ] Email de aprovacao/negacao enviado conforme o resultado
- [ ] Concorrencia: mesmo SSN em paralelo → "Application already in progress"
- [ ] Leads anteriores do mesmo SSN cancelados automaticamente (`CANCELLED_DUP_SSN`)

### Riscos de Lease

| # | Risco | Tipo | Mitigacao na Plataforma | Cenario de Teste |
|---|-------|------|------------------------|-----------------|
| R1 | **Identidade sintetica** — fraudador usa SSN fabricado combinando dados reais de multiplas pessoas | Fraude | Sentilink (score de synthetic ID), SEON (pegada digital), blacklist check | Aplicar com dados na blacklist → Step 4 `BLACKLIST_DENIED` |
| R2 | **Stacking** — cliente faz multiplas aplicacoes simultaneas para acumular credito | Fraude/Credito | Step 6 `previousLeadsCheck` calcula `consumedApprovalAmount`; Step 9 limita 3 emails/phones | Aplicar 4x com mesmo email → 4a deve retornar `EMAIL_COUNT_FAILED` |
| R3 | **Estado sem regulamentacao** — lease em estado que proibe ou restringe RTO | Compliance | Step 1 `stateCheck` bloqueia NJ, VT, MN, ME; Step 1b verifica programas por estado | Aplicar com endereco NJ em merchant ONLINE → `NO_BUSINESS_IN_STATE` |
| R4 | **Carrinho inflado** — merchant submete invoice com valor acima do que o cliente pode pagar | Credito | Step 15 `calculateMaxApprovalAmount`; Step 16 `compareCostCheck` (cost > approval) | Enviar invoice de $5.000 com aprovacao de $1.400 → deve negar ou split |
| R5 | **Reaprovacao de inadimplente** — cliente com conta existente em atraso tenta novo lease | Credito | Step 10 `eligibleForReapprovalCheck` verifica delinquency em contas existentes | Aplicar com SSN que tem conta inadimplente → `DELINQUENCY_DENIED` |
| R6 | **Aprovacao expirada** — cliente demora para completar e aprovacao vence | Operacional | `numDaysApprovalExp` por merchant; `checkLeadExpirationSweep` | Verificar lead com aprovacao antiga → status `EXPIRED` |

---

## US-ORI-02: Cliente Completa Dados e Escolhe Plano de Pagamento

**Persona:** Cliente
**Portal:** Origination (pagina /complete)
**Trigger:** Cliente clica link do `providerURL` recebido na aprovacao

### Fluxo do Usuario
1. Sistema carrega `missing-fields` → mostra campos faltantes (bank info, CC, frequencia, FPD)
2. Cliente seleciona frequencia de pagamento (Weekly, Bi-Weekly, Semi-Monthly, Monthly)
3. Visualiza cronograma: valor da parcela, numero de parcelas, EPO, total do contrato
4. Informa dados do cartao de credito (se `isCcRequired`)
5. Informa dados bancarios (se `isAchRequired`)
6. Se ID check requerido: faz upload de documento (Intellicheck ou SEON selfie)
7. Se oferta de seguro: aceita ou recusa Protection Plan

### Criterios de Aceite
- [ ] `missing-fields` retorna apenas campos realmente faltantes
- [ ] `planId` resolve o `merchantProgramPk` corretamente (sem isso: "Merchant program is required")
- [ ] Link valido por 36 horas (config); apos expiracao → erro
- [ ] Frequencias exibidas respeitam `merchant.allowedFrequencies`
- [ ] Cronograma calculado corretamente (baseCost * moneyFactor * termMonths)

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Fraude de cartao** — cliente usa cartao roubado para signing fee/security deposit | Fraude | CC auth ($0.01 ou config) + tokenizacao + CC last name match + Kount pre-auth | Submeter CC com lastName diferente do aplicante → `CC_AUTH_FAILED` |
| R2 | **CC BIN mismatch** — BIN do cartao na assinatura difere do BIN na aplicacao | Fraude | `SubmitApplicationService` compara BINs → `CC_BIN_MISMATCH` | Aplicar com Visa, assinar com Discover → deve bloquear |
| R3 | **Conta bancaria fraudulenta** — dados bancarios invalidos para habilitar ACH | Fraude | Bank account blacklist check no submit; Plaid verification se habilitado | Submeter routing number da blacklist → `BLACKLIST_APPROVED` (rejected) |
| R4 | **Selecao de frequencia desfavoravel** — cliente escolhe MONTHLY (parcelas altas) sem entender PTI | Credito | Calculadora mostra valores por frequencia; merchant pode restringir `allowedFrequencies` | Verificar que MONTHLY mostra valor visivelmente maior que WEEKLY |
| R5 | **Link compartilhado** — cliente compartilha link de assinatura com terceiro | Fraude/Compliance | Link contem `shortCode` unico; ID check (Intellicheck/SEON) valida identidade | Acessar link com ID diferente do aplicante → ID check falha |

---

## US-ORI-03: Cliente Assina Contrato Eletronico (E-Sign)

**Persona:** Cliente
**Portal:** Origination (SignWell embed ou email)
**Trigger:** Cliente completa dados e sistema gera contrato

### Fluxo do Usuario
1. Sistema chama `CreateAndSendContractService` → contrato gerado
2. **Modo EMBEDDED (iframe):** SignWell embed aparece na mesma pagina
3. **Modo EMAIL:** cliente recebe email com link para assinar
4. Cliente le termos, marca checkboxes (CC Peek consent, protection plan)
5. Assina eletronicamente
6. Redirect para pagina de sucesso ("Thank you for signing")
7. Lead status → `SIGNED` → `READY_TO_FUND`

### Criterios de Aceite
- [ ] Contrato numero `UOWN_{random5}_{leadPk}` gerado
- [ ] `embeddedSigningUrl` contem SignWell URL
- [ ] Eventos SignWell (completed/closed/declined) tratados corretamente
- [ ] CC Peek consent capturado (checkbox `preauthyes`/`preauthno`)
- [ ] `postMessage('uown_success')` enviado ao parent window (suporte iframe)

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Cooling-off legal** — em alguns estados cliente pode cancelar dentro de X dias apos assinar | Compliance | Cancelamento de conta disponivel; invoice mod limitada a 80 dias | Verificar que conta pode ser cancelada logo apos signing |
| R2 | **Contrato expirado** — cliente nao assina a tempo | Operacional | `numDaysLeaseDocExp` por merchant; status → `EXPIRED_CONTRACT` | Verificar que apos expiracao, contrato anterior e cancelado se novo for gerado |
| R3 | **E-sign recusado** — cliente abre e recusa o contrato | Operacional | Evento `declined` capturado; lead permanece em `CONTRACT_CREATED` | Verificar que apos decline, cliente pode re-iniciar sem duplicar contrato |
| R4 | **Consent CC Peek nao capturado** — se cliente nao marca checkbox, CC Peek nao funciona em pagamentos futuros | Receita | Default `consent = true` (se nao marcar `preauthno`); salvo na conta SVC | Verificar `ccPeekConsent` na conta importada |
| R5 | **Lease Mod apos assinatura** — merchant muda invoice apos cliente assinar | Operacional | `ModifyInvoiceService`: cancela conta, cria novo lead, re-executa pipeline | Verificar que invoice mod gera novo contrato (`ContractType.LEASE_MOD`) |

---

## US-ORI-04: Funding — UOwn Paga o Merchant

**Persona:** Sistema + Equipe de Funding
**Portal:** Servicing (Funding Queue)
**Trigger:** Lead atinge status SIGNED/READY_TO_FUND

### Fluxo do Usuario (Agente de Funding)
1. Lead aparece na Funding Queue com status `FUNDING`
2. Agente verifica documentos, invoice, valores
3. Sistema importa lead para SVC (`LosToSvcImportService` — 16 entidades criadas)
4. Agente confirma funding → lead status `FUNDED`
5. Merchant recebe transferencia bancaria

### Criterios de Aceite
- [ ] 16 entidades criadas na importacao (Account, Customer, Address, Email, Phone, Employment, BankAccount, UWData, Invoice, Items, SchedSummary, Receivables, CreditCards, CCTransactions, ProtectionPlan, Welcome email)
- [ ] `FundingTransaction` criada com `amountToBeFunded = invoice - (invoice * ccProcessingFeePercent)`
- [ ] Conta SVC criada com status `ACTIVE`
- [ ] Cronograma de recebiveis gerado (REGULAR + PROCESSING_FEE + EPO)

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Funding de lease fraudulento** — merchant submete invoice ficticia, recebe funding, cliente nunca recebe produto | Fraude merchant | Processo de onboarding do merchant; audit trail em `FundingModification` | Verificar que `FundingModification` registra cada mudanca de status |
| R2 | **Merchant com funding exception** — merchant tem historico de problemas, precisa de hold | Operacional | Flags `twoDayFundingException` / `fiveDayFundingException` por merchant | Verificar que merchant com flag aparece com indicador na Funding Queue |
| R3 | **Invoice modificada apos funding** — invoice muda depois do merchant ja receber | Financeiro | `refundOrCancelFundingTransaction`: FUNDING → cancela; FUNDED → REQUEST_REFUND | Modificar invoice em lead FUNDED → verificar FundingTransaction REQUEST_REFUND |
| R4 | **Re-importacao** — lead importado 2x pode duplicar entidades SVC | Dados | `updateAccountFromLead` usado na re-importacao; regenera items/invoice/schedule | Importar mesmo lead 2x → verificar que conta SVC nao tem duplicatas |
| R5 | **Conta 16 meses sem EPO 90 dias** — Kornerstone 16m tem `earlyPayoffDateExpiry = today` (desabilita EPO window) | Produto | `noEpoForTermMonths` config (default "16"); usa Anytime Buyout formula | Verificar que conta 16m nao tem EPO receivable ativo apos importacao |

---

# FASE 2: SERVICING (Agente UOwn)

## US-SVC-01: Agente Visualiza Resumo da Conta (Dashboard)

**Persona:** Agente UOwn
**Portal:** Servicing
**Trigger:** Agente busca conta por nome, telefone, email, account number

### Fluxo do Usuario
1. Agente busca cliente na barra de pesquisa
2. Abre conta → visualiza dashboard com:
   - **Customer Summary:** nome, telefone, email, endereco
   - **Account Summary:** status, rating, saldo, proximo vencimento, dias em atraso
   - **Financial Info:** total contrato, total pago, saldo restante, auto-pay status
   - **Payment Schedule:** cronograma de recebiveis (paid/unpaid/overdue)
   - **Payment History:** todos pagamentos com status
   - **Activity Log:** historico de acoes e eventos

### Criterios de Aceite
- [ ] `daysPastDue = DAYS.between(delinquencyAsOfDate, today)` calculado corretamente
- [ ] `contractBalance = totalContractAmount + ppFees + otherFees - totalPayments`
- [ ] Next due amount = fees anteriores + proxima parcela regular + recebiveis no mesmo due date
- [ ] Past due amount = SUM(total - partial) para recebiveis com dueDate <= hoje
- [ ] EPO eligibility indicator visivel (se dentro da janela)

### Insights do Agente

O dashboard da ao agente visibilidade imediata sobre:

| Insight | O que Indica | Acao Tipica do Agente |
|---------|-------------|----------------------|
| `daysPastDue > 0` | Cliente em atraso | Contatar cliente, oferecer arrangement |
| `rating = P` | Acordo de pagamento ativo | Verificar arrangement status |
| `rating = C ou D` | Bankruptcy | Nao cobrar, verificar documentacao legal |
| `autoPayType = NONE` | Sem pagamento automatico | Incentivar cliente a habilitar auto-pay |
| EPO elegivel | Cliente pode quitar pelo preco original | Informar cliente sobre oportunidade de economia |
| `overPaymentAmount > 0` | Cliente pagou a mais | Verificar se e candidato a PAID_OUT |

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Delinquency mascarada** — `delinquencyAsOfDate` nao atualizado apos reversao de pagamento | Credito | `UownTransactionService` recalcula em cada payment/reversal | Reverter pagamento → verificar que `daysPastDue` aumenta |
| R2 | **EPO window perdida** — agente nao informa cliente sobre EPO antes de expirar | Receita/Atendimento | Indicator de EPO no dashboard; email automatico de lembrete | Verificar que conta dentro da janela EPO mostra indicator |
| R3 | **Auto-pay inativo sem percepcao** — rating P desligou auto-pay, agente nao sabe | Operacional | Dashboard mostra `autoPayType` e `rating` lado a lado | Criar arrangement → verificar que auto-pay mostra NONE |

---

## US-SVC-02: Agente Faz Pagamento Manual com CC

**Persona:** Agente UOwn
**Portal:** Servicing → Make Payment modal
**Trigger:** Cliente liga pedindo para fazer pagamento por telefone

### Fluxo do Usuario
1. Agente abre conta → clica "Make Payment"
2. Modal abre com campos: valor, CC no arquivo, data de postagem
3. Agente informa valor (parcela regular ou valor customizado)
4. Submete → CC processado **sincronamente** via gateway
5. Toast "Payment processed successfully"
6. Pagamento alocado automaticamente aos recebiveis (mais antigos primeiro)

### Criterios de Aceite
- [ ] CC SALE processado em tempo real (nao via sweep)
- [ ] `SvPayment` criado com status `PAID`
- [ ] Alocacao segue estrategia DEFAULT: recebiveis nao-EPO por due date ASC, depois EPO
- [ ] Se pagamento cobre payoff → conta `PAID_OUT_EARLY`
- [ ] Se EPO elegivel e total pago >= EPO → rewind + realoca ao EPO → `PAID_OUT_EARLY_EPO`
- [ ] Receipt gerado (`PaymentReceiptService.createCCPaymentReceipt`)
- [ ] Activity log com tipo `CREDIT_CARD`

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Cartao expirado** — CC no arquivo esta expirado | Operacional | Gateway rejeita → `DENIED`; agente precisa solicitar novo cartao | Tentar pagamento com CC expirado → verificar resposta de erro |
| R2 | **Overpayment** — cliente paga mais do que deve | Financeiro | Valor excedente salvo em `overPaymentAmount` na conta | Pagar $500 em conta com saldo de $200 → verificar `overPaymentAmount = $300` |
| R3 | **EPO triggered involuntariamente** — pagamento grande aciona EPO sem intencao | Receita | EPO so aciona se conta elegivel E total pago >= EPO total | Pagar valor alto em conta fora da janela EPO → deve virar `PAID_OUT_EARLY` (nao EPO) |
| R4 | **NSF no cartao** — saldo insuficiente no cartao | Credito | Deteccao NSF (msg "Insufficient funds" ou codigos 50051/57852); NSF fee receivable criado | Verificar que NSF fee aparece no cronograma apos CC denied por insufficient funds |
| R5 | **Pagamento duplicado** — agente clica 2x acidentalmente | Financeiro | CC idempotent key previne duplicacao no gateway; `overPaymentAmount` captura excesso | Submeter mesmo pagamento 2x rapidamente → verificar comportamento |

---

## US-SVC-03: Agente Cria Payment Arrangement (Acordo de Pagamento)

**Persona:** Agente UOwn
**Portal:** Servicing → Make Payment modal (checkbox Payment Arrangement)
**Trigger:** Cliente inadimplente liga pedindo acordo para regularizar conta

### Fluxo do Usuario
1. Agente abre conta inadimplente → Make Payment
2. Marca checkbox "Payment Arrangement"
3. Seleciona tipo: **NORMAL** (parcela) ou informa via API **SETTLEMENT** (quitacao)
4. Define: data inicio, data fim, frequencia (Weekly/BiWeekly/Monthly/SemiMonthly)
5. Tabela de parcelas auto-populada (installments)
6. Agente ajusta valores/datas se necessario
7. Submete → sistema processa primeiro pagamento CC imediatamente
8. Toast "Payment Arrangement scheduled successfully"

### Criterios de Aceite
- [ ] `SvPaymentArrangement` criado com status `NOT_STARTED`
- [ ] Rating automaticamente setado para `P` (Promise-to-Pay)
- [ ] `previousRating` salvo no arrangement (para restauracao futura)
- [ ] Auto-pay ACH e CC desabilitados (rating P)
- [ ] Pagamentos CC processados sequencialmente por posting date
- [ ] Ultimo pagamento dispara `publishEvent` para listener de resultado
- [ ] NORMAL: account status nao muda apos sucesso
- [ ] SETTLEMENT: account status → `SETTLED_IN_FULL` apos todos pagamentos succedem

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Settlement via UI impossivel** — Modal "Make Payment" **nunca envia** `arrangementType`, backend default = NORMAL | Produto/UI | Settlement so possivel via API com `arrangementType: 'SETTLEMENT'` explicito | Criar arrangement via UI → verificar que tipo e NORMAL (nao SETTLEMENT) |
| R2 | **Rating P persistente** — apos arrangement SUCCESS ou FAILED, rating P **nao e resetado automaticamente** | Operacional | Requer acao manual ou `removeRatingLetterSweep` | Completar arrangement com sucesso → verificar que rating ainda e P |
| R3 | **Auto-pay desligado permanentemente** — rating P desliga auto-pay; se rating nao e limpo, auto-pay nao volta | Receita | Agente deve manualmente resetar rating e reativar auto-pay | Verificar que `autoPayType = NONE` durante arrangement |
| R4 | **Falha parcial em CC arrangement** — primeiro pagamento OK, segundo falha | Financeiro | `BasePaymentArrangementListener`: qualquer falha → status `FAILED`, `isActive = false` | Simular falha no 2o pagamento → verificar status FAILED |
| R5 | **Cliente faz pagamento manual durante arrangement** — confunde alocacao | Financeiro | Pagamentos manuais alocam normalmente; arrangement continua independente | Fazer pagamento manual com arrangement ativo → verificar que ambos alocam corretamente |

---

## US-SVC-04: Agente Muda Frequencia de Pagamento

**Persona:** Agente UOwn
**Portal:** Servicing → Account Details
**Trigger:** Cliente pede para mudar de Weekly para Monthly (parcelas maiores, menos frequentes)

### Fluxo do Usuario
1. Agente abre conta → secao Financial Info
2. Seleciona nova frequencia (Weekly, Bi-Weekly, Semi-Monthly, Monthly)
3. Define nova data de primeiro pagamento e proximo pagamento
4. Submete → cronograma inteiro recalculado
5. Novos recebiveis gerados com novos valores e datas

### Criterios de Aceite
- [ ] Se frequencia nova = atual: no-op (retorna schedule existente)
- [ ] Cronograma recalculado via `CalculatorService.calculateForAccount()`
- [ ] `frequencyChanges` incrementado (contador)
- [ ] Registro em `FrequencyMods` (old/new freq, old/new amount, dates)
- [ ] Activity log `FREQUENCY_CHANGE`
- [ ] EPO expiry date mantida do schedule antigo

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **PTI estourado** — mudanca de WEEKLY para MONTHLY quadruplica o valor da parcela | Credito | Calculadora mostra novo valor antes da confirmacao; agente avalia capacidade | Mudar WEEKLY→MONTHLY em contrato de $1.950 (56 parcelas → 13): parcela sobe de ~$35 para ~$150 |
| R2 | **Recebiveis pagos vs nao pagos** — recalculo pode gerar inconsistencia com pagamentos ja feitos | Financeiro | Recebiveis antigos substituidos; pagamentos existentes passam por rewind/replay | Verificar que pagamentos existentes sao realocados corretamente ao novo cronograma |
| R3 | **NC last payment rule** — mudanca de frequencia pode violar regra de NC (ultimo pagamento >= 11% baseCost) | Compliance | `CalculatorService` aplica regra NC independente da frequencia | Mudar frequencia em conta NC → verificar que ultimo pagamento respeita 11% |
| R4 | **EPO window afetada** — nova frequencia muda numero de parcelas dentro da janela EPO | Receita | EPO expiry date mantida do schedule antigo; calculo EPO usa recebiveis atuais | Mudar frequencia dentro da janela EPO → verificar que EPO amount recalcula corretamente |

---

## US-SVC-05: Agente Move Data de Vencimento (Due Date Move)

**Persona:** Agente UOwn
**Portal:** Servicing → Move Due Date modal
**Trigger:** Cliente pede para alinhar vencimento com dia de pagamento do emprego

### Fluxo do Usuario
1. Agente abre conta → clica "Move Due Date"
2. Seleciona due date atual no dropdown React Select (`#moveFromDueDate`)
3. Informa nova data (formato MM/DD/YYYY)
4. Seleciona tipo: `SCHEDULE_SHIFT` (todas futuras) ou `NEXT_DUE_DATE` (apenas proxima)
5. Submete → sistema valida offset maximo
6. Recebiveis atualizados

### Criterios de Aceite
- [ ] WEEKLY: max offset **3 dias**; outros: max **7 dias**
- [ ] `SCHEDULE_SHIFT` move todas recebiveis futuras
- [ ] `NEXT_DUE_DATE` move apenas proxima recebivel
- [ ] Se data movida = FPD, `isFpdChange = true` e FPD atualizada no SchedSummary
- [ ] `dueDateMoves` incrementado
- [ ] Activity log `DUE_DATE_MOVES`
- [ ] Registro em `uown_due_date_moves`

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Adiamento infinito** — cliente pede due date move todo mes para nunca pagar | Receita | Offset maximo (3 ou 7 dias); `dueDateMoves` contador rastreia quantas vezes | Fazer 5 due date moves consecutivos → verificar que contador incrementa |
| R2 | **Bug de validacao** — `validateOffsetByFrequency` trata TODAS frequencias como WEEKLY (max 3 dias) | Produto | Bug conhecido: BI_WEEKLY/MONTHLY deveria permitir 7 dias mas permite apenas 3 | Tentar mover 5 dias em conta BI_WEEKLY → verificar se aceita ou rejeita |
| R3 | **Desalinhamento com auto-pay** — due date movida mas sweep de auto-pay usa data antiga | Operacional | Sweeps usam `dueDate` do receivable atualizado | Mover due date → verificar que proximo sweep processa na nova data |

---

## US-SVC-06: Agente Gerencia Inadimplencia (Delinquency Workflow)

**Persona:** Agente UOwn
**Portal:** Servicing
**Trigger:** Conta aparece na lista de delinquentes / cliente liga apos receber aviso

### Fluxo do Usuario (Agente)
1. Agente visualiza contas inadimplentes no dashboard (filtro por `daysPastDue`)
2. Abre conta → ve dias em atraso, past due amount, rating
3. Opcoes do agente:
   - **Contatar cliente** → oferecer pagamento ou arrangement
   - **Criar Payment Arrangement** → parcela o valor em atraso
   - **Mover due date** → se atraso e pequeno (1-3 dias)
   - **Adicionar nota** → registrar tentativa de contato no activity log
   - **Mudar rating** → F (fraude), E (pickup), L (legal), etc.
4. Se cliente nao responde: sistema automatico toma acoes progressivas

### Acoes Automaticas do Sistema (Sweeps)

| Dias em Atraso | Acao Automatica | Sweep |
|---------------|----------------|-------|
| 1-30 | Skit.AI outreach file + reminder email | `createSkitDelinquentFileSweep` |
| 31-60 | Email Delinquency30DayOffer | `delinquencyOfferEmailSweep` |
| 61-90 | Email + SMS Delinquency60DayOffer (12h-19h) | `delinquencyOfferEmailSweep` + SMS |
| 91-150 | Email + SMS Delinquency90DayOffer | `delinquencyOfferEmailSweep` + SMS |
| 100+ | CC rerun automatico (100-day) | `delinquencyRerunCCPaymentsSweep` |
| 150+ | Email + SMS Delinquency150DayOffer + Skit settlement offer | `delinquencyOfferEmailSweep` |
| Diario | CC rerun em contas com pagamento aprovado hoje mas ainda inadimplentes | `dailyDelinquencyRerunCCPaymentsSweep` |

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Charge-off tardio** — conta fica 180+ dias em atraso sem acao de charge-off | Financeiro | Nao ha servico automatico de charge-off — requer acao manual | Verificar contas com 180+ dias → devem estar com rating ou status indicando cobranca |
| R2 | **CC rerun em conta protegida** — rerun tenta cobrar conta em bankruptcy | Legal/Compliance | SQL exclui ratings B,C,P,S,D,E,F,G,L,U do rerun | Verificar que conta com rating C (bankruptcy) nao aparece no rerun |
| R3 | **SMS fora de horario** — envio de SMS de cobranca fora da janela permitida | Compliance (TCPA) | Janela configuravel default 12:00-19:00; SMS nao enviados fora | Verificar que SMS de delinquency nao sao enviados antes das 12h |
| R4 | **Rerun em cartao bloqueado** — CC rerun em cartao reportado como roubado/perdido | Operacional | `rerunCCPaymentsSweep` exclui: cartoes expirados, numeros invalidos, contas fechadas, cartoes roubados | Verificar filtro no SQL do sweep |
| R5 | **Proget nao desbloqueia apos pagamento** — dispositivo permanece bloqueado mesmo apos cliente pagar | Atendimento | `UownTransactionService` chama `progetService.unlockDeviceForAccount` quando `delinquencyAsOfDate >= today` | Fazer pagamento que zera atraso → verificar chamada ao Proget |
| R6 | **NSF fee cobrado indevidamente** — daily CC rerun cobra NSF fee quando nao deveria | Financeiro | NSF fee no daily rerun apenas se executado antes das 9h (config) | Verificar que rerun apos 9h nao cria NSF fee |

---

## US-SVC-07: Agente Cancela Conta

**Persona:** Agente UOwn (com permissao)
**Portal:** Servicing → Change Account Status
**Trigger:** Fraude confirmada, pedido do merchant, ou cooling-off legal

### Fluxo do Usuario
1. Agente abre conta → Change Status → seleciona "CANCELLED"
2. Informa comentario obrigatorio (motivo)
3. Marca checkbox "Refund All Payments" (opcional)
4. Confirma → conta cancelada
5. Se refund: todos pagamentos PAID sao reembolsados (CC via gateway, ACH via Credit)

### Criterios de Aceite
- [ ] Comment obrigatorio (campo nao pode estar vazio)
- [ ] `accountStatus = CANCELLED`, `cancelledDateTime = now()`
- [ ] Se `refundAllPayments = true`: cada CC refundado via gateway; cada ACH recebe ACH Credit
- [ ] Activity log `STATUS_CHANGE` com motivo
- [ ] Funding: se lead FUNDED, `FundingTransaction` separada como `REQUEST_REFUND`

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Perda total sem recuperacao** — merchant ja recebeu funding, cliente recebe refund, UOwn perde dos dois lados | Financeiro | Funding refund e processo manual separado; `REQUEST_REFUND` criado | Cancelar conta FUNDED com refund → verificar que funding refund e separado |
| R2 | **Cooling-off abuse** — cliente usa produto 89 dias e cancela antes do EPO expirar para recuperar todo o dinheiro | Receita | Cancelamento nao tem limite de tempo (diferente de invoice mod que tem 80 dias) | Cancelar conta com 89 dias de uso e refund total → verificar valores |
| R3 | **Reativacao com refunds pendentes** — CANCELLED→ACTIVE mas ACH Credits ainda nao processados | Financeiro | UI mostra warning: "Refunded payments will NOT be cancelled. Pending ACH refunds will be marked cancelled" | Reativar conta → verificar que ACH Credits pendentes sao cancelados |
| R4 | **Refund parcial falha no batch** — 1 de 10 refunds falha, restante ja processado | Consistencia | `refundPayments` usa try/catch por payment; `failedRefunds` map retornado | Verificar response com falhas parciais |

---

## US-SVC-08: Agente Negocia Settlement (Quitacao por Acordo)

**Persona:** Agente UOwn
**Portal:** Servicing (via API — UI nao suporta SETTLEMENT direto)
**Trigger:** Conta muito inadimplente (90+ dias), UOwn prefere recuperar parte do valor

### Fluxo do Usuario
1. Agente calcula valor de settlement (ex: 60% do saldo devedor)
2. Via API: cria Payment Arrangement com `arrangementType: 'SETTLEMENT'`
3. Pagamentos CC processados sequencialmente
4. Se todos aprovados: conta → `SETTLED_IN_FULL`
5. Email "Settled in Full" enviado ao cliente (sweep Mon-Fri 02:00)

### Diferenca NORMAL vs SETTLEMENT

| Aspecto | NORMAL | SETTLEMENT |
|---------|--------|------------|
| Objetivo | Parcelar atraso | Quitar conta por valor reduzido |
| Conta apos sucesso | Permanece ACTIVE | → SETTLED_IN_FULL |
| Disponivel na UI | Sim (Make Payment modal) | Nao (apenas via API) |
| Email | Nenhum especifico | "Settled in Full" |

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Settlement muito baixo** — agente aceita valor muito abaixo do justo | Receita | Sem validacao automatica de % minimo; depende de politica interna | Verificar que settlement de $50 em conta de $2.000 e aceito (sistema nao bloqueia) |
| R2 | **Refund desfaz settlement** — refund apos SETTLED_IN_FULL reabre conta | Financeiro | Rewind reseta para ACTIVE; arrangement mantém status SUCCESS | Refundar pagamento de conta settled → verificar que volta para ACTIVE |
| R3 | **Arrangement FAILED sem notificacao** — pagamento CC falha, arrangement FAILED, mas rating P permanece | Operacional | Rating P nao e auto-limpo; `isActive = false` no arrangement | Simular CC denied no 2o pagamento → verificar arrangement FAILED e rating P persiste |
| R4 | **Settlement duplicado** — dois agentes criam settlement para mesma conta | Dados | Sem lock de concorrencia no `PaymentArrangementService` | Criar 2 arrangements simultaneos → verificar comportamento |

---

# FASE 3: PAGAMENTOS DO CLIENTE (Portal do Cliente + Auto-Pay)

## US-PAY-01: Cliente Faz Pagamento pelo Portal

**Persona:** Cliente
**Portal:** Customer Portal
**Trigger:** Cliente acessa portal para pagar parcela manualmente

### Fluxo do Usuario
1. Cliente autentica: email/telefone + codigo de verificacao
2. Visualiza saldo, proximo vencimento, cronograma
3. Seleciona "Make Payment"
4. Informa valor e metodo (CC no arquivo ou novo CC; ACH no arquivo)
5. Submete pagamento
6. Confirmacao exibida

### Criterios de Aceite
- [ ] Autenticacao: `sendVerificationCode` → `verifyCode` → `CustomerLoginResult`
- [ ] `getAllCustomerPayments` mostra historico completo
- [ ] Pagamento criado via `createOrUpdateCustomerPayment`
- [ ] Se CC/ACH com data futura: rating automaticamente setado para `P` (Promise-to-Pay)
- [ ] Auto-pay desligado apos rating P

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Promise-to-Pay indevido** — pagamento futuro pelo portal seta rating P, desligando auto-pay | Operacional | Config `ach.customer.portal.add.rating.letter` / `cc.customer.portal.add.rating.letter` (default true) | Fazer pagamento com data futura → verificar que rating vira P e auto-pay desliga |
| R2 | **Pagamento insuficiente** — cliente paga menos que a parcela, criando partial allocation | Financeiro | Alocacao parcial: receivable fica `PARTIALLY_PAID`, saldo restante continua devendo | Pagar $20 em parcela de $50 → verificar receivable `PARTIALLY_PAID` com partial amount |
| R3 | **Cartao roubado no portal** — terceiro com acesso ao portal usa cartao roubado | Fraude | Kount pre-auth; CC tokenizado no sistema; verificacao de codigo no login | Verificar que pagamento passa por Kount antes do gateway |
| R4 | **ACH bounce apos pagamento** — cliente paga via ACH, banco retorna por NSF em 2-3 dias | Credito | `getStatusDatePaymentsListSweep` processa RETURNED; `reverseAchPaymentsSweep` reverte; NSF fee criado | Verificar fluxo completo: PAID → RETURNED → REVERSED + NSF fee |

---

## US-PAY-02: Auto-Pay Processa Parcela Automaticamente (CC)

**Persona:** Sistema (sweep automatico)
**Portal:** N/A (background)
**Trigger:** Data de vencimento de recebivel chega

### Fluxo do Sistema
1. `CreateScheduledCreditCardPaymentsSweep`: cria transacoes CC para contas com vencimento hoje
2. `SendCreditCardPaymentsSweep`: processa transacoes via gateway (async thread pool)
3. Se APPROVED: pagamento criado, alocado aos recebiveis
4. Se DENIED: NSF check, rerun schedule ativado
5. Se CC Peek habilitado: tenta cobrar valor parcial se saldo insuficiente

### Criterios de Aceite
- [ ] Apenas contas com `autoPayType` incluindo CC sao processadas
- [ ] Valor cobrado = proxima parcela regular (including tax)
- [ ] Receipt gerado para pagamento aprovado
- [ ] CC Peek: se consent=true e config ativa, tenta saldo parcial
- [ ] Transacoes DENIED geram `RERUN` no dia seguinte

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Cartao expirado sem atualizacao** — auto-pay falha repetidamente ate charge-off | Credito | CC rerun tenta dia seguinte; delinquency emails progressivos; Skit.AI outreach | Verificar que apos CC denied, delinquency emails sao enviados |
| R2 | **CC Peek cobrou menos** — cliente nao percebe que pagou parcial, saldo cresce | Atendimento | CC Peek cria pagamento parcial; receivable fica PARTIALLY_PAID | Verificar que CC Peek parcial gera aviso ao cliente |
| R3 | **Representment excessivo** — CC denied rerun tenta muitas vezes, cliente reclama ao banco | Compliance | Rerun 1 (dia seguinte), Rerun 100 dias, Daily Delinquency — regras de exclusao por status | Verificar que conta com cartao "account closed" nao entra em rerun |

---

## US-PAY-03: Auto-Pay Processa Parcela Automaticamente (ACH)

**Persona:** Sistema (sweep automatico)
**Portal:** N/A (background)
**Trigger:** Data de vencimento de recebivel chega

### Fluxo do Sistema
1. `CreateScheduledACHPaymentsSweep`: cria registros ACH para contas com vencimento hoje
2. `SendACHPaymentsSweep`: envia arquivo ao Profituity (batch)
3. `getSendACHPaymentsStatusSweep`: aguarda ACK (~5 min)
4. `getStatusDatePaymentsListSweep`: poll resultado (2-3 dias uteis)
5. Se COMPLETED: `addPaymentAfterAch` cria SvPayment com status PAID
6. Se RETURNED: pagamento revertido, NSF fee criado, rerun agendado

### Criterios de Aceite
- [ ] Apenas contas com `autoPayType` incluindo ACH, status ACTIVE, rating NOT IN (B,C)
- [ ] `achType = ACHDebit`, `achProcessType = SCHEDULED`
- [ ] Pagamento so criado apos settlement do ACH (nao antes)
- [ ] NSF fee criado apenas na primeira ocorrencia (`numberOfTries == 1`, `originalACHPk == null`)
- [ ] Rerun: novo ACH com `ACHProcessType.RERUN` + opcional `RERUN_NSF` para cobrar fee

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **NSF cascata** — ACH bounce, rerun bounce, rerun bounce → fees acumulam | Credito/Atendimento | NSF fee criado apenas na primeira vez (`numberOfTries == 1`); reruns subsequentes sem fee adicional | Verificar que 2o rerun NAO cria novo NSF fee |
| R2 | **R08 Stop Payment** — cliente colocou stop payment no banco | Operacional | Alerta criado: "R08: Customer placed a stop on payment"; agente deve contatar | Verificar que R08 gera alerta visivel no activity log |
| R3 | **ACH em conta Profituity inativa** — ambiente de teste sem Profituity ativo | Teste | qa1: `is_active=false` em todas ACH sweep tasks; full ACH flow nao testavel em qa1 | Verificar ambiente antes de testar ACH — usar sandbox ou qa2 |
| R4 | **Rating P bloqueia auto-pay ACH** — pagamento via portal setou rating P, sweep ignora conta | Operacional | Sweep SQL exclui rating P (exceto `achProcessType IN (REQUEST, RERUN, RERUN_NSF, REFUND)`) | Verificar que conta com rating P nao aparece no `CreateScheduledACHPaymentsSweep` |

---

## US-PAY-04: Cliente Exerce EPO (Early Pay Off — Quitacao em 90 Dias)

**Persona:** Cliente (via Portal ou telefone com Agente)
**Portal:** Customer Portal / Servicing
**Trigger:** Cliente decide pagar o valor original do produto dentro da janela de 90 dias

### Fluxo do Usuario
1. Cliente verifica elegibilidade EPO (janela nao expirada, sem atraso exceto CA)
2. Faz pagamento >= valor EPO
3. Sistema detecta: total pago (- fees - PP) >= EPO receivable total
4. **Rewind** de todos pagamentos anteriores
5. **Replay** realocando tudo ao EPO receivable
6. Conta → `PAID_OUT_EARLY_EPO`
7. Email "Paid in Full" enviado

### Criterios de Aceite
- [ ] `EpoEligibleService.is90DayPayoffEligible` retorna true
- [ ] EPO receivable ativo e nao expirado
- [ ] `delinquencyAsOfDate >= today` (exceto CA — bypass list)
- [ ] Rewind reverte todas alocacoes anteriores
- [ ] Replay aloca tudo ao EPO receivable
- [ ] Account status → `PAID_OUT_EARLY_EPO`
- [ ] `payOffDate = today`

### Cenarios EPO por Estado

| Estado | Formula EPO | Particularidade |
|--------|------------|-----------------|
| **CA, HI, NY, WV** | `cost * (remainingPayments / totalPayments)` | Formula proporcional — EPO diminui a cada pagamento |
| **NC** | Default formula, mas EPO >= ultimo pagamento | Minimo: lastPaymentNoTaxWithFees |
| **MI** | Padrao, mas `overdueAmount = pastDue * 0.55` | Inadimplencia parcialmente descontada |
| **Kornerstone** | `epoWithTax - (totalPaid / moneyFactor) + pastDueRegular` | Formula especial com money factor invertido |
| **16 meses** | Anytime Buyout: `baseCost + (dailyLeaseAmount * daysUsed) + fees` | Nao tem janela 90 dias — buyout a qualquer momento |

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **EPO com ACH bounce** — cliente paga EPO via ACH, conta fecha, banco retorna pagamento 3 dias depois | Financeiro | `reverseAchPaymentsSweep` reverte e reabre conta → `ACTIVE` | Verificar: ACTIVE → ACH → PAID_OUT_EARLY_EPO → RETURNED → ACTIVE |
| R2 | **EPO perdido por 1 dia** — cliente paga no dia apos expiracao | Receita | `earlyPayoffDateExpiry >= today` e check estrito; pagamento vira `PAID_OUT_EARLY` (sem desconto EPO) | Pagar apos EPO expirar → verificar que status e `PAID_OUT_EARLY` (nao EPO) |
| R3 | **CA bypass delinquency** — cliente inadimplente em CA pode exercer EPO | Produto (by design) | CA esta na bypass list; clientes inadimplentes podem quitar pelo valor original | Conta CA com 30 dias de atraso → verificar que EPO ainda e elegivel |
| R4 | **Kornerstone EPO errado** — formula usa CEILING, pode haver centavos de diferenca | Financeiro | Arredondamento CEILING no calculo KW; `check.contract.balance.for.epo` cap | Calcular EPO Kornerstone manualmente e comparar com sistema |
| R5 | **16 meses sem janela EPO** — cliente acha que tem 90 dias, mas `earlyPayoffDateExpiry = today` | Atendimento | Termo 16m usa Anytime Buyout (formula diaria, nao janela fixa) | Verificar que conta 16m nao mostra "EPO eligible" no dashboard |

---

## US-PAY-05: Conta Atinge Fim do Contrato (Paid Out)

**Persona:** Sistema (automatico)
**Portal:** N/A
**Trigger:** Cliente completou todos os pagamentos programados

### Fluxo do Sistema
1. Pagamento alocado → `AutoPaidOutEligibilityService.isAccountEligibleForAutoPaidOut()`
2. Verifica: data atual >= ultima data de recebivel regular
3. Verifica: saldo restante <= valor de 1 parcela regular OU saldo <= total de fees elegiveis
4. Se elegivel: conta → `PAID_OUT`
5. Email "Paid in Full" enviado
6. `payOffDate` e `payOffDateTime` registrados

### Criterios de Aceite
- [ ] Saldo restante <= 1 parcela regular (threshold)
- [ ] OU saldo restante <= total de MANUAL_FEE + MISC_FEE + NSF_FEE
- [ ] Data do pagamento >= ultima due date do cronograma
- [ ] Account status → `PAID_OUT`
- [ ] Email enviado (sweep `paidInFullAccountEmailSweep`)

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Paid Out com fees pendentes** — conta fecha mas NSF/MISC fees nao foram pagos | Financeiro | Threshold inclui fee types (MANUAL_FEE, MISC_FEE, NSF_FEE) — conta pode fechar com fees pendentes se saldo <= fee total | Conta com NSF fee nao pago e saldo <= fee → verificar que fecha como PAID_OUT |
| R2 | **Overpayment nao devolvido** — cliente pagou a mais, conta fechou, excesso nao devolvido | Atendimento | `overPaymentAmount` registrado na conta; requer refund manual pelo agente | Verificar que conta PAID_OUT com overPayment mostra valor no dashboard |
| R3 | **Security deposit nao creditado** — deposito de seguranca deveria ser creditado contra ultimo pagamento | Financeiro | Formula: `lastPaymentNoTaxWithFees = lastPaymentNoTaxNoFees - securityDeposit` | Verificar que ultimo pagamento tem desconto do security deposit |

---

# FASE 4: REEMBOLSOS (Agente UOwn)

## US-REF-01: Agente Reembolsa Pagamento CC (Total)

**Persona:** Agente UOwn
**Portal:** Servicing → Payment History → Reverse/Refund modal
**Trigger:** Erro de cobranca, cancelamento, ou solicitacao do cliente

### Fluxo do Usuario
1. Agente abre historico de pagamentos
2. Seleciona pagamento CC → clica "Fully Refund"
3. Marca checkbox "Refund Fee" (optional — refunda convenience fee junto)
4. Informa comentario obrigatorio
5. Sistema processa CREDIT no gateway
6. Pagamento revertido → Rewind/Replay executa
7. Recebiveis voltam a UNPAID

### Criterios de Aceite
- [ ] CC original → `REFUNDED`, `remainingRefundableAmount = 0`
- [ ] `SvPayment` → `REVERSED`
- [ ] Novo CC transaction `CREDIT` criado e aprovado
- [ ] Rewind/Replay: alocacoes revertidas, recebiveis reabertas
- [ ] Se conta era PAID_OUT/SETTLED_IN_FULL: volta para `ACTIVE`
- [ ] TaxCloud sync no dia seguinte (`DailyTaxCloudRefundsSync`)
- [ ] Activity log registra refund com amount, fee, remaining

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Reativacao de conta quitada** — refund em PAID_OUT/SETTLED_IN_FULL reverte para ACTIVE | Financeiro | Rewind reseta status automaticamente; alerta criado | Refundar pagamento em conta PAID_OUT → verificar que volta para ACTIVE |
| R2 | **Double refund** — mesmo pagamento refundado 2x | Financeiro | Check: status deve ser `APPROVED` ou `PARTIALLY_REFUNDED`; `REFUNDED` bloqueia | Tentar refund em CC ja REFUNDED → deve retornar erro |
| R3 | **Refund sem autorizacao** — agente refunda indevidamente | Fraude interna | Permissao `refund_payments` obrigatoria; comment obrigatorio (1-500 chars); audit trail | Verificar que modal exige comentario e permissao |
| R4 | **TaxCloud inconsistente** — refund processado mas TaxCloud nao notificado | Compliance | `DailyTaxCloudRefundsSync` roda diariamente para payments REVERSED do dia | Verificar `uown_tax_cloud` atualizado no dia seguinte |

---

## US-REF-02: Agente Reembolsa Pagamento CC (Parcial)

**Persona:** Agente UOwn
**Portal:** Servicing → Reverse/Refund modal
**Trigger:** Cobranca parcialmente incorreta; devolucao de parte do valor

### Fluxo do Usuario
1. Seleciona pagamento → "Partially Refund"
2. Informa valor (entre $0.01 e valor original)
3. Sistema processa CREDIT parcial no gateway
4. Pagamento original revertido
5. Novo SvPayment criado com valor restante (original - refund), status PAID
6. Rewind/Replay realoca o valor restante

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Saldo contabil incorreto** — novo payment do restante aloca a receivable errado | Financeiro | Replay realoca por due date ASC; allocation strategy copiada do original | Partial refund $20 de $50 → verificar novo payment de $30 aloca corretamente |
| R2 | **Fee nao refundado no partial** — UI hardcoda `refundFee=false` para partial | Financeiro | Convenience fee permanece; apenas endpoint single (`refundFee=true`) permite | Verificar que partial refund nao devolve fee |
| R3 | **Gateway exige card details** — partial precisa enviar numero do cartao (full nao) | Tecnico | `CCRefundService` envia card data completo para partial; apenas `captureRequestID` para full | Verificar que partial com cartao tokenizado funciona |

---

## US-REF-03: Agente Reembolsa Pagamento ACH

**Persona:** Agente UOwn
**Portal:** Servicing → Reverse/Refund modal
**Trigger:** ACH precisa ser devolvido (erro, cancelamento)

### Fluxo do Usuario
1. Seleciona pagamento ACH → "Fully Refund"
2. Sistema cria ACH Credit (REFUND)
3. Pagamento original revertido → Rewind/Replay
4. ACH Credit enviado ao Profituity no proximo sweep
5. Dinheiro devolvido ao cliente em 2-3 dias uteis

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Erro silencioso** — `refundACH` engole excecoes (try/catch com apenas log.error) | Confiabilidade | `failedRefunds` map pode estar vazio mesmo com falha; apenas log interno | Verificar logs quando ACH refund falha — UI nao mostra erro |
| R2 | **Conta bancaria encerrada** — ACH Credit sera retornado pelo banco | Financeiro | ACH Credit retornado → processado como RETURNED no sweep | Refund para conta fechada → verificar tratamento do retorno |
| R3 | **Inadimplencia reaberta** — refund desfaz pagamento, `delinquencyAsOfDate` recalculado | Credito | Rewind atualiza `delinquencyAsOfDate`; delinquency sweeps reativados | Refundar unico pagamento em dia → verificar que conta volta a estar em atraso |

---

# FASE 5: MODIFICACOES DE CONTA (Agente UOwn)

## US-MOD-01: Agente Altera Valor de Aprovacao

**Persona:** Agente UOwn
**Portal:** Servicing → Lead Details
**Trigger:** Merchant solicita aumento de aprovacao para cliente adicionar itens

### Fluxo do Usuario
1. Agente localiza lead com status `UW_APPROVED` ou `CONTRACT_CREATED`
2. Informa novo valor de aprovacao
3. Sistema valida: valor <= `max.approval.amount.{clientType}` (default $5.000)
4. UW status setado para APPROVED, `adverseReasonDescription` limpo
5. Se novo valor > `maxApprovalAmount`: atualiza max
6. Alerta criado + activity log DATA_CHANGE

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Override acima da capacidade** — agente aumenta aprovacao alem do que UW calculou | Credito | Cap maximo por clientType (default $5.000); alerta criado para audit | Tentar override de $10.000 → deve rejeitar |
| R2 | **Override em status errado** — tentar alterar em lead ja SIGNED/FUNDED | Operacional | Validacao: apenas `UW_APPROVED` ou `CONTRACT_CREATED` | Tentar override em lead FUNDED → deve retornar erro |

---

## US-MOD-02: Agente Modifica Invoice (Lease Mod)

**Persona:** Agente UOwn
**Portal:** Servicing
**Trigger:** Merchant ou cliente precisa alterar itens/valores do lease apos assinatura

### Fluxo do Usuario
1. Lead em status SIGNED ou alem
2. Agente modifica itens da invoice
3. Sistema cancela conta atual (sem refund)
4. Novo lead criado re-executando pipeline completo
5. CC e bank account linkados do lead antigo
6. Merchant notificado

### Riscos de Lease

| # | Risco | Tipo | Mitigacao | Cenario |
|---|-------|------|-----------|---------|
| R1 | **Modificacao apos 80 dias** — lease mod tardio em conta ja ativa ha meses | Financeiro | Bloqueio: `num.days.past.creation.for.lease.mod` (default 80 dias) | Tentar mod em conta com 81 dias → deve bloquear |
| R2 | **Novo lead negado** — UW pode negar na re-execucao do pipeline | Operacional | Conta original ja cancelada; se novo lead negado, cliente fica sem lease | Verificar comportamento quando novo lead e negado apos invoice mod |
| R3 | **Funding duplo** — lead original FUNDED + novo lead precisa de funding | Financeiro | Lead original recebe `REQUEST_REFUND` se FUNDED; novo lead segue funding normal | Verificar que REQUEST_REFUND e criado para o lead original |

---

# RESUMO: MATRIZ DE RISCOS POR FASE

| Fase | Risco Predominante | Exemplos |
|------|-------------------|----------|
| **Originacao** | Fraude + Credito | Identidade sintetica, stacking, estado bloqueado, carrinho inflado |
| **Funding** | Fraude merchant + Financeiro | Invoice ficticia, funding exception, invoice mod pos-funding |
| **Servicing (Agente)** | Operacional + Atendimento | Rating P persistente, EPO window perdida, settlement via UI impossivel |
| **Pagamentos (Auto)** | Credito + Compliance | Cartao expirado, NSF cascata, ACH bounce, representment excessivo |
| **Pagamentos (Manual)** | Financeiro + Fraude | Overpayment, cartao roubado, EPO acidental |
| **EPO** | Receita + Financeiro | ACH bounce pos-EPO, CA bypass, Kornerstone formula, 16m sem janela |
| **Reembolsos** | Financeiro + Compliance | Reativacao de conta, double refund, TaxCloud sync, erro silencioso ACH |
| **Modificacoes** | Operacional + Financeiro | Override acima do cap, lease mod apos 80 dias, funding duplo |

---

## Fontes e Referencias Cruzadas

| Topico | Arquivo |
|--------|---------|
| Cenarios de risco (dados de teste) | `docs/business-rules/appendix-g-cenarios-risco.md` |
| Deep dive tecnico do produto | `docs/business-rules/12-produto-lease-deep-dive.md` |
| Pipeline 18 steps | `docs/business-rules/02-originacao-pipeline.md` |
| Calculos financeiros | `docs/business-rules/04-calculos-financeiros.md` |
| Pagamentos | `docs/business-rules/05-pagamentos.md` |
| Ciclo de vida da conta | `docs/business-rules/06-conta-ciclo-vida.md` |
| Modificacoes de conta | `docs/business-rules/07-modificacoes-conta.md` |
| Merchants de teste | `src/data/merchants.ts` |

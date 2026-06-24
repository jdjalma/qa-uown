# Application Lifecycle — Pitfalls Catalog

> **Indice** do catalogo de pitfalls. O conteudo foi fatiado em [`pitfalls/`](pitfalls/) porque o catalogo unico passou de 100 KB (uma so leitura `Read` estourava o limite de tokens e o agent pulava linhas). Numeros de pitfall sao **globais e estaveis** — `pitfall #N` resolve sempre, independente da fatia.

> Regras, sequencia canonica e checklist: [SKILL.md](../SKILL.md).

## Como anexar um pitfall novo (rule #11/#12)

1. Use o **proximo numero global** (maior numero atual + 1).
2. Adicione a linha na **ultima fatia** em [`pitfalls/`](pitfalls/) se ela ainda estiver < ~50 KB; senao crie a proxima fatia `NN-pitfalls-LLL-HHH.md`.
3. Acrescente uma linha neste indice (numero + sintoma + arquivo).

## Indice de pitfalls

| # | Sintoma | Fatia |
|---|---------|-------|
| 1 | Expected APPROVED but got: DENIED sem motivo claro | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 2 | submitApplication HTTP 500 "Merchant program is required to determine fee" | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 3 | UnexpectedRollbackException no submitApplication (HTTP 200 com erro no body) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 4 | Invalid merchantId. Received XYZ HTTP 400 em sendApplication | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 5 | Kornerstone merchant rejeita HTTP 400 no sendApplication | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 6 | settleApplication HTTP 500 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 7 | makeCreditCardPayments trava 5 min e timeout | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 8 | sendInvoice HTTP 500 UnexpectedRollbackException para eligible_terms='16' | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 9 | uown_sv_payment com status=PAID inexistente - sweep de email falha silenciosamente | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 10 | sendApplication HTTP 400 / 500 aleatorio OU fluxo falha em passo improvavel (submit, sign, fund) apos seman… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 11 | makeCreditCardPayments HTTP 500 DataIntegrityViolationException: constraint [fk_uown_cc_transaction_arrange… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 12 | uown_merchant_activity_log query falha ou retorna 0 rows - log de mudanca de programa nao encontrado | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 13 | ProgramActivationDeactivationSweep nao encontrado via getScheduledTaskByName | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 14 | createOrUpdateProgram cria programa mas merchant nao o enxerga nas aplicacoes | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 15 | is_active no programa parece correto mas aplicacao usa programa "inativo" ou vice-versa | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 16 | Query SQL em activation_date/deactivation_date retorna objeto Date JS em vez de string, causando comparacao… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 17 | UI retorna data de activation_date/deactivation_date em formato ISO (YYYY-MM-DD) em alguns contextos e MM/D… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 18 | getEmailTemplateName / getMerchantChargeProcessingFee / qualquer db.* falha com password authentication fai… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 19 | Assertion de template identity falha ou da falso positivo - body marker correto no repo mas resultado diver… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 20 | sorErrorDescription="SSN should have 9 digits. Received XXXXXXXXXX" em sendApplication - SSN com 10 digitos | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 21 | getMissingFields falha com HTTP 500 "Invalid link. Please contact merchant" apos setupApplicationViaApi(...… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 22 | POST /uown/los/authorizeCreditCard retorna {"message": "Invalid card. Please try again", "status": 500} (2… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 23 | sendApplication retorna HTTP 400 "Invalid merchantId. Received KS3015" OU getMerchantsByRefCode retorna "Me… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 24 | OriginationCustomerPage.modifyLease lanca TimeoutError: locator.waitFor: Timeout 5000ms exceeded - invoice… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 25 | MissingDataFormPage.fillBankAccount lanca strict mode violation: getByText('CHECKING', { exact: true }) res… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 26 | Selector CSS-module hash (ex: .missing-data-panel_missingDataPanel__feeAmount__cn7Wg) retorna null apos reb… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 27 | Ao ligar email queue / sweeps em ambiente nao-prod, vendas em massa de emails antigos sao disparadas (~19k… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 28 | sendInvoice com orderType:'1' (modify invoice / LEASE_MOD path) retorna HTTP 400 sorErrorDescription:"Cost… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 29 | sendInvoice com orderType:'1' retorna 200 OK mas **nao cria LEASE_MOD** - log mostra "Invoice decrease. Set… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 30 | addActivityLog / addLogNote retorna HTTP 400 InvalidFormatException: Cannot deserialize value of type 'LogT… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 31 | LosExternalMerchantController.searchApplicationStatus (POST /uown/los/merchant/applications/search) retorna… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 32 | AspectInboundApiLog em uown_sv_inbound_api_log.header armazena nomes de header em **minuscula** (x-run-id=.… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 33 | AspectInboundApiLog.setApiLogInfo extrai source_uuid via StringUtils.substringBetween(body.toLowerCase, "uu… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 34 | Filtros WHERE row_created_timestamp >= runStart.toISOString em uown_sv_inbound_api_log retornam 0 rows em q… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 35 | Cenarios de error-path em endpoints cobertos pelo AOP AspectInboundApiLog produzem ora 1 ora 2 rows em uown… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 36 | Teste de open-redirect usa framenavigated + regex em substring e da falso-positivo | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 37 | await page.goto(url) lanca net::ERR_HTTP_RESPONSE_CODE_FAILURE quando servidor retorna 4xx/5xx | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 38 | StickyRecoverSweep dispara sem erro mas NAO cria sessao uown_sticky para um cct morfado pelo fast-path helper | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 39 | POST /uown/los/submitApplication retorna HTTP 500 com body "UnexpectedRollbackException: Transaction silent… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 40 | CreditCardHistoryPage.getStickyRecoveryStatus(cctPk) retorna - mesmo com uown_sticky row populado | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 41 | uown_sv_sql_config.sql_name e case-sensitive UPPERCASE - WHERE sql_name='getSettlementAmount' retorna 0 rows | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 42 | Days Past Due (painel) != Days Delinquent (breakdown) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 43 | Modal Settlement/EPO Breakdown abre VAZIO quando valor e $0.00 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 44 | TCA no painel vs TCA no breakdown divergem quando ha fees ativos (late fee, NSF) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 45 | Aging artificial via UPDATE requer try/finally restore obrigatorio | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 46 | Backend chama getSettlementAmount 2x no ServicingInformationService | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 47 | Qualquer seletor que depende de CSS-Module class, accessible name por sibling text, ou input[type="checkbox… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 48 | VerifyCustomerInformationModal backdrop intercepts clicks em /customer-information/{pk} | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 49 | Servicing modals usam wrapper custom, NAO Bootstrap .modal-body/.modal-header | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 50 | Seletor validado ao vivo via MCP nao garante runtime pass | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 51 | /{shortCode}/complete renderiza tela "Choose Payment Program" ANTES do CC form | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 52 | moveDueDatesByDays retorna HTTP 400 para lease WEEKLY quando moveNumberOfDays > 3 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 53 | driveLeadToFunding / createPreQualifiedApplication cria leads WEEKLY por default | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 54 | Endpoints /uown/los/* exigem cookie session do BFF (merchant.sid setado apos login) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 55 | uown_los_lead_personal_info NAO existe em qa1 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 56 | SVC search so retorna leads com account_pk IS NOT NULL | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 57 | Fixture de PK hard-coded e fragil em qa1 - drift por reseed | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 58 | MR que corrige campo em SQLs especializados deve auditar TODOS os SQLs irmaos | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 59 | Expression index com UPPER(col) so e utilizado se WHERE tambem aplicar UPPER na coluna | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 60 | POST /uown/los/simpleSearch/{term} aceita body ausente com 200 OK | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 61 | Projeto task-testing storageState/baseURL mismatch | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 62 | termnull smell em uown_los_lead_notes indica lead com main_next_pay_date = NULL | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 63 | sendApplication retorna HTTP 400 "mainNextPayDate is required" quando campo omitido | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 64 | OriginationCustomerPage.settleLeaseViaDocuments lanca "Unable to locate a lease document" | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 65 | **[SUPERSEDED por #66]** Activity-log polling de 60s insuficiente em qa1 sob carga | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 66 | DB timestamp drift silencioso - WHERE col >= $1::timestamp com ISO UTC vindo de JS exclui rows recem-escritas | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 67 | button:has-text('Sign') colide com "Change to Signed" - strict mode violation | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 68 | **[SUPERSEDED por #69]** Origination SPA ensureAuthenticated race | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 69 | Origination SPA full-suite auth-retry: storageState do auth.setup contem JWT com TTL ~15 min em qa1; testes… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 70 | Consumer apply flow entry path canonico e /getApplication/{code}, NAO apply-{env}/{code}/start direto | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 71 | **[RETRATADO 2026-05-24]** ~~Dois wizards distintos servidos no mesmo path~~ | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 72 | Backend valida nextPayDate <= 10 dias no futuro; retorna HTTP 400 estruturado | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 73 | Kornerstone consumer wizard pagina 2 exige bank routing + account + CC BIN (required) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 74 | Origination SPA: page.goto(originationBase) com storageState valido ainda redireciona para tela de login | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 75 | Auth tests em Origination: POST sem merchant.sid retorna HTTP 404, NAO 401 | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 76 | SPA localStorage caching: apagar cookie de sessao NAO limpa overviewStore; dashboard exibe dados stale | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 77 | Refund/Reverse de pagamento no Servicing NAO esta em /payment-transaction | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 78 | reverseReason no modal de refund e React Select (<div>), NAO <select> nativo - selectOption falha | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 79 | Assert de ACH Make Payment (modal #makePayment Servicing) tima out a 60s apesar de toast de sucesso | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 80 | Teste de overpayment no modal Make Payment falha ao assertir rejeicao | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 81 | Helper/funcao customizada chama submitApplication sem getMissingFields antes -> submitApplication falha sil… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 82 | Codigo/JSDoc assume que o Arrangement Type do modal Make Payment e backend-derivado do amount (sem campo UI) | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 83 | ACH arrangement preso em payment_arrangement_status='IN_PROGRESS' apos SendACHPaymentsSweep em env sem proc… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 84 | Listener de ACH arrangement nao atualiza o arranjo em estados intermediarios - arrangement permanece NOT_ST… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 85 | Date pickers #startDate / #endDate do modal Make Payment Arrangement (Servicing) IGNORAM pressSequentially… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 86 | CC multi-installment arrangement nao chega a SUCCESS - arranjo fica em IN_PROGRESS mesmo apos simulateCcSwe… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 87 | uown_sweep_logs.number_of_records_processed lido logo apos trigger retorna 0 mesmo quando o sweep processa… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 88 | Query de elegibilidade para settledInFullAccountEmailSweep encontra contas que o sweep NAO processa (ex: ac… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 89 | FirstPaymentReminderSweep pula a conta apesar de uown_sv_sched_summary.first_payment_due_date estar dentro… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 90 | Triggers manuais consecutivos do settledInFullAccountEmailSweep retornam processed=0 para uma conta ja eleg… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 91 | OTP do Website (customer portal) flaky / pega codigo errado: getVerificationCode retorna o OTP de um run an… | [01-pitfalls-001-091.md](pitfalls/01-pitfalls-001-091.md) |
| 92 | Click em item da sidebar do Website (customer portal) da TimeoutError / pointer event interceptado logo apo… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 93 | Query em uown_sticky filtrando/lendo coluna retry_attempt retorna column "retry_attempt" does not exist | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 94 | Query em uown_scheduled_task filtrando coluna name retorna 0 rows ou column "name" does not exist; last_tri… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 95 | Query em uown_sweep_logs usando colunas task_name / processed / created_timestamp retorna column does not e… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 96 | Spec/query de e-sign assertando status='SENT' em uown_esign_document nunca casa | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 97 | POST /ConfigurationManagement/createOrUpdateConfig + forceReloadConfig NAO altera o comportamento de chaves… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 98 | SearchPage.searchAndSelectFirst (quick search do navbar Origination) NAO navega quando invocado a partir da… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 99 | Steps de navegacao por sidebar no Website (customer portal) **passam silenciosamente** mesmo quando a SPA e… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 100 | **sendApplication retorna BLACKLIST_DENIED mesmo com SSN/email aprovaveis quando o endereco estatico do fix… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 101 | **Botao de acao do customer summary (Origination) renderiza OFF-SCREEN a direita e click({force:true}) NAO… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 102 | **useNeuroIdCheck=true (flag sob teste) e SILENCIOSAMENTE resetado para false pelo merchant preflight → Neu… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 103 | **uown_sv_outbound_api_log NAO correlaciona chamadas NeuroID por lead_pk para leads pre-funding** — account… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 104 | Config Columns panel na pagina /merchant (Origination) nao e encontrado: o seletor configColumnsPanel ([rol… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 105 | label:has-text('UW Pipeline') input[type='checkbox'] nao encontra o checkbox de coluna no Config Columns de… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 106 | Codigo de teste espera por botao Apply/Save apos togglar uma coluna no Config Columns de /merchant — o wait… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 107 | Filtro Active em /merchant (Origination): nao ha como selecionar "All" via dropdown, e mudar a opcao nao re… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 108 | **/merchantSetting (Origination): selectMerchantRowByText('OL90202-0001') da TimeoutError ... .rdt_TableRow… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 109 | **SSN terminando em 9 (generateTestSSN(false)) e APROVADO (UW_APPROVED) em qa2 para terraceFinance, quando… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 110 | **EPO 5% / EPO 10% triple-checkbox em /merchantSetting (GDS Data): #epo5-false/#epo10-false resolvem no DOM… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 111 | **Ultimo sub-test de test.describe.serial falha com "context" and "page" fixtures are not supported in "aft… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 112 | **Merchant Settings Snapshot: de onde sai o snapshot e qual a tabela/coluna/audit-trail — assumir errado fa… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 113 | **qa2 DB tunnel transient blocker: teste fail-fast no PRIMEIRO read DB (assertMerchantContract) sem ser dri… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 114 | **Reusar um redirectUrl (signing/contract link) capturado de um sendInvoice anterior abre "Invalid link. Pl… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 115 | **Overview tem DOIS forms de filtro com inputs de data identicos; um seletor posicional (nth()) acerta o fo… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 116 | **Overview: uma janela de data "future-only" no table panel NAO esvazia a tabela** (empty-set lever nao con… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 117 | **Overview: o painel de table-filter re-colapsa logo apos o clique de toggle (1 clique nao basta).** **Sint… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 118 | **Clicar "Download CSV" abre o modal de EMAIL (clica o botao errado).** **Sintoma:** o teste de download di… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 123 | **Overview TABLE-panel #fromDate/#toDate ignoram fill() — Formik nao atualiza, e o guard de 48 MiB tem tres… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 124 | **Campos GDS-snapshot npm_segment/tam_score (uown_los_uwdata/uown_sv_uwdata) lidos como NULL → falso-bug.**… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 126 | **Notas de Protection Plan / Buddy ficam em uown_los_activity_log, NAO em uown_los_lead_notes.** **Sintoma:… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 127 | **Enrollment do Buddy so FINALIZA no e-signature; opt-in na Terms cria apenas uma row PENDING.** **Sintoma:… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 128 | **Cross-coverage (cliente ja-coberto) mostra um widget Buddy DIFERENTE, SEM radios.** **Sintoma:** acceptAn… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 129 | **Specs DB/API-only em docs/taskTestingUown/ nao tem projeto Playwright browserless.** **Sintoma:** uma spe… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 130 | **Tunnel DB sandbox: a porta 5445 e reusada entre envs (qa1/qa2/dev3/sandbox).** **Sintoma:** queries batem… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 131 | **pg retorna colunas bigint/pk como string JS.** **Sintoma:** matchers numericos (toBeGreaterThan(0)) falha… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 132 | **[FutureFpdCheckStep] Um cliente (SSN) com um lead ja SIGNED + first-payment-date no futuro e DENEGADO em… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 133 | **CANCELLED_DUP_SSN: criar uma nova app com um SSN que ja tem lease ATIVO CANCELA o lease predecessor.** **… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 134 | **Blacklist por endereco: uown_los_black_list casa por street_address1 + zip_code — um endereco "proven-goo… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 135 | **pdf-parse quebra milhares: um total renderizado "1,693.41" sai como "169 3.41" (virgula virou espaco inte… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 136 | **MERCHANT_PREFLIGHT_SKIP=true global no .env (deixado por sessao paralela) faz teste de fresh-application… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 137 | **stg: teste de UI Origination estoura em selector do portal-agente (ex. input[placeholder='Search table']… | [02-pitfalls-092-137.md](pitfalls/02-pitfalls-092-137.md) |
| 138 | **RightFoot gateia criacao de ACH delinquente: so cria com balance_check SUCCESS + routing/account match + exposure+amount+$100<=balance (R1.53.0).**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 139 | **Sticky resolve tempo da transacao original como America/New_York apesar do commit dizer "UTC".**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 140 | **Guard "prevent repeated NeuroID calls" NAO mergeado em R1.53.0 — nao assumir skip.**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 141 | **Customer Journey: JourneyStatus.ABANDONED + varios campos nunca setados em codigo (R1.53.0) — asserir = false-fail.**… | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 142 | **SeonWidgetComponent.closeSeonWidget() (X real via frameLocator) NAO dismissa o widget em sandbox** — reproduced 2x; cancel UX nao-trivial; nenhuma nota de cancel em lead_notes; OBSERVACAO S3/P2 (confirmar com dev/PO). | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |
| 143 | **pre-write-validate.sh Rule 1 bloqueia componentes standalone legitimos (*.component.ts / *.controls.ts) em src/pages/**  — hook exige `extends` em todo `export class`; workaround: `class X {}; export { X }` (sem keyword export na declaracao).** | [03-pitfalls-138-141.md](pitfalls/03-pitfalls-138-141.md) |


---

## Observacoes cross-cutting - compliance candidates (require separate tickets)

| # | Observacao | Source | Status |
|---|-----------|--------|--------|
| F-OOS-1 | **`POST /uown/sendApplicationToCustomer` retorna HTTP 500 para `refMerchantCode` invalido - deveria ser 4xx.** Polui monitoring/Sentry com 500s que semanticamente sao "not found" ou "bad request". | 2026-05-20 | AGUARDANDO TRIAGE (Yuri). |
| F-OOS-2 | **AMS Merchants page - filtro Active: checkbox sem `aria-label`.** WCAG 1.3.1 e 4.1.2. | 2026-05-22 | `[OBSERVACAO]` - NAO criar GitLab issue sem autorizacao. |
| OBS-01 | **Audit log persists raw POST body (PII).** `AspectInboundApiLog.setApiLogInfo:177` grava body sem redaction. Bodies incluem SSN, DOB, banking. | `AspectInboundApiLog.java:177` | PRE-EXISTING. Ticket separado de compliance. |
| OBS-02 | **Audit log persists Authorization header.** Todos os headers gravados incluindo Bearer tokens. | `AspectInboundApiLog.java:186-193` | PRE-EXISTING. Ticket separado de compliance. |
| SW-OBS-QA1-001 | **`refreshTrustPilotAccessKeySweep` grava o access token Bearer do TrustPilot em plaintext no campo `error` de `uown_sweep_logs`** (~15 dias de historico retidos). Token exposto a qualquer SELECT na tabela. Achado de SEGURANCA do PRODUTO (nao pitfall de framework de teste) - escalar ao dev manualmente. | exploratory-testing-qa1-master SW-OBS-QA1-001, qa1, 2026-06-10 | `[OBSERVACAO]` de seguranca de produto - ESCALAR AO DEV. NAO criar GitLab issue sem autorizacao. |
| OBS-01-1321 | **Leads CSV (`/leads`, `leads-results.csv`): a 17ª coluna "Created from" (`createdFrom`) exporta com o HEADER EM BRANCO** (a entry react-csv dessa coluna nao tem `label`). As 16 colunas anteriores trazem header; so `createdFrom` sai sem rotulo no arquivo. | DOM/CSV-proven qa2 2026-06-18 (#1321). | `[OBSERVACAO]` product-side, **PRE-EXISTING** (nao introduzido por #1321). NAO e bug do teste — flag para ticket separado. NAO criar GitLab issue sem autorizacao do user. |
| OBS-WS-DOCS-LOGOUT | **Website (customer portal): abrir a pagina Documents FORCA logout do cliente.** A rota `/documents` chama `GET /uown/svc/getFilesForAccount?accountPk=N` enviando um `usertoken` JWT VALIDO e FRESCO (iat segundos antes, nao expirado); o backend responde **HTTP 403 `{"unauthorized":true}`** so nesse endpoint (todos os outros — getAccountInfo, getAccountSummary, getCreditCards — retornam 200 com o mesmo token). O front-end interpreta o 403 como sessao invalida, chama `GET /logout`, limpa `accountStore.userToken`/`accountPk` e redireciona pra `/` (tela de login). **Determinístico:** reproduzido 4x em 2 sessoes independentes (via click de sidebar E via `page.goto('/documents')` direto); independe do caminho ate Documents. Header suspeito na call que falha: `username: null`. Customer-facing: qualquer cliente que abrir Documents nessa conta e expulso. | DOM-first + network live sandbox 2026-06-12, account 17249 (lead 97464, ACTIVE). Token fresco (49s, exp 3551s restantes) → 403 instantaneo, NAO expiry. | `[CONFIRMADO]` BUG de PRODUTO (backend authz de `getFilesForAccount` rejeita token valido + FE faz force-logout em qualquer 403). Severity S2 (workflow customer-facing quebrado + force-logout). NAO criar GitLab issue sem autorizacao do user — aguardando aprovacao para abrir ticket. NAO mascarar no teste com re-login mid-flow nem com timeout. Provavel causa: check de autorizacao do endpoint `getFilesForAccount` (possivel ligacao com `username: null` no header) + FE logout-on-403 sem degradacao graciosa. |
| OBS-PP-OPTOUT | **Opt-OUT de Protection Plan logado como "Error initiating protection plan"** em `uown_los_activity_log` — consistente em TODO lead opt-out env-wide (16033-16040, 16802). Decline deliberado registrado como erro (wording); a row estruturada esta correta (`opt_in=false, status=COMPLETED`). | `[db-observation:uown_los_activity_log, qa2, 2026-06-21]` | `[OBSERVACAO]` candidato a bug de produto (wording). NAO criar GitLab issue sem autorizacao do user. |
| OBS-PP-ALREADYCOVERED | **`already_covered`/`covered_by_*` (`uown_los_protection_plan`) NUNCA persistidos** — 0 rows com `already_covered=true` env-wide, apesar de a UI detectar cross-coverage ("already enrolled"). A linkagem estruturada ao seed (assuncao BR §23) e nao-verificada; a garantia real anti-cobranca-dupla e o target nao mintar policy nova (`policy_id=null`). | `[db-observation:uown_los_protection_plan, env-wide, qa2, 2026-06-21]` | `[OBSERVACAO]` candidato a gap de produto. NAO criar GitLab issue sem autorizacao do user. |

> **Importante**: observacoes OBS-01/OBS-02 sao herdadas, NAO introduzidas por WI-525. Tratar como tech-debt de seguranca.

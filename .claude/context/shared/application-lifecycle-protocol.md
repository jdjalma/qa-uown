# Application Lifecycle Protocol — UOWN Leasing

> **Propósito:** sequência canônica de chamadas para criar uma aplicação end-to-end via API + catálogo de pitfalls conhecidos. OBRIGATÓRIO para qualquer teste/feature que envolva `sendApplication` ou transições de estado de lease.
>
> **Por que existe:** cada nova task que cria aplicação costuma sangrar 20-60 min redescobrindo os mesmos 7 requisitos implícitos (email único, `getMissingFields` antes de `submitApplication`, `MASTERCARD_APPROVED` em vez de `VISA_APPROVED`, etc.). Este arquivo é a memória institucional que evita isso.
>
> **Quem consulta:** `subagent-spec-test`, `subagent-impl-e2e`, `subagent-impl-api`, `subagent-debug-flaky`, `/qa-flow`, e análises diretas.
>
> **Como alimentar:** toda vez que um requisito implícito causar falha não-óbvia em teste novo, adicionar aqui. Ver § 6 "Contribution Template" abaixo — é obrigação do agent que descobriu (per CLAUDE.md rule #12).

---

## 1. Sequência canônica (happy path end-to-end)

Para criar uma conta partindo do zero até `ACTIVE` (ou `SETTLED_IN_FULL` via SETTLEMENT):

| # | Chamada | Resultado | Exige |
|---|---------|-----------|-------|
| 1 | `buildTestData({ env, state, merchant, orderTotal })` | `applicant.email` único, SSN aprovado | NÃO passar `emailOverride` — causa DataMismatchStep se email reusado |
| 2 | `api.application.sendApplication(merchant, applicant, order)` | retorna `leadPk`, `leadUuid`, `paymentDetailsList` | Para Kornerstone: `body.mainBankRoutingNumber` + `body.mainBankAccountNumber` obrigatórios (usar overload `sendApplication(body)` + `buildSendApplicationBody`) |
| 3 | `sleep(5000)` + `api.application.getApplicationStatus(merchant, leadUuid)` | status contém `"approved"` + `approvedAmount > 0` | SSN não-terminando-em-9 + merchant não bloqueado no estado |
| 4 | `api.invoice.sendInvoice(merchant, leadUuid, { orderTotal })` | retorna `paymentDetailsList[0].redirectUrl` com `shortCode` + `planId` | sendApplication aprovado antes |
| 5 | Extrair `shortCode` + `planId` de `invoiceResp.body.paymentDetailsList[0].redirectUrl` | `shortCode = url.pathname.split('/')[1]`, `planId = url.searchParams.get('planId')` | — |
| 6 | `api.application.getMissingFields(shortCode, { planId })` | seta `merchantProgramPk` no lead | Passo 5 ok |
| 7 | `api.application.submitApplication(leadPk, firstName, lastName, { planId, ccNumber, ccType, ccExp, cvc })` | lead transita para CC_AUTH_PASSED/CONTRACT_CREATED | **ccNumber = `TEST_CARDS.MASTERCARD_APPROVED.number` (BIN 5500)** — NUNCA `VISA_APPROVED` (causa `UnexpectedRollbackException`) |
| 8 | `api.lead.changeLeadStatus(merchant, leadPk, 'SIGNED', 'Automated')` | lead → SIGNED | submitApplication ok |
| 9 | `api.settlement.settleApplication(merchant, leadUuid)` | lead → SETTLED | Lead em SIGNED |
| 10 | `sleep(3000)` + `api.lead.updateFundingStatus([leadPk], 'FUNDING')` | lead → FUNDING | Lead em SETTLED |
| 11 | `api.lead.updateFundingStatus([leadPk], 'FUNDED')` | lead → FUNDED, cria `uown_sv_account` | Lead em FUNDING |
| 12 | `db.waitForAccountByLeadPk(leadPk, 60_000)` | retorna `accountPk` | Passo 11 ok |
| 13 | `db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000)` | account ACTIVE | Account criado |

**Para chegar em `SETTLED_IN_FULL` (email de Settled in Full depende disso):**

| # | Chamada | Resultado |
|---|---------|-----------|
| 14 | `api.paymentArrangement.makeCreditCardPayments(buildCcArrangementBody({ accountPk, arrangementType: 'SETTLEMENT', ccNumber, ccExp, cvc, installments }))` | payment processa síncrono (CC), listener transiciona account |
| 15 | `db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000)` | arrangement SUCCESS |
| 16 | `db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000)` | account SETTLED_IN_FULL + `uown_sv_payment(PAID)` populado |

**Para trocar primary email (testes de email template):**

| # | Chamada | Quando |
|---|---------|--------|
| 17 | `api.svcEmail.getContactInfo(accountPk)` → extrair `emailPK` + `customerPK` da entry PRIMARY | Após ACTIVE (ou SETTLED_IN_FULL) |
| 18 | `api.svcEmail.createOrUpdateEmail({ emailPK, customerPK, emailAddress: INBOX, emailType: 'PRIMARY', doNotEmail: false })` | — |

---

## 2. Pitfalls (causas de falhas bobas)

| # | Sintoma | Causa | Fix |
|---|---------|-------|-----|
| 1 | `Expected APPROVED but got: DENIED` sem motivo claro | Email reusado entre runs → DataMismatchStep (ADDRESS_MISMATCH) | `buildTestData` SEM `emailOverride` — email único por run. Trocar primary email DEPOIS do drive via `createOrUpdateEmail` (passo 17-18) |
| 2 | `submitApplication` HTTP 500 "Merchant program is required to determine fee" | Sem `getMissingFields` antes | Passo 6 obrigatório |
| 3 | `UnexpectedRollbackException` no submitApplication (HTTP 200 com erro no body) | `TEST_CARDS.VISA_APPROVED` (BIN 5146) causa rollback em qa1/qa2 | Usar `TEST_CARDS.MASTERCARD_APPROVED` (BIN 5500) |
| 4 | `Invalid merchantId. Received XYZ` HTTP 400 em sendApplication | Merchant não provisionado no LOS endpoint (só em Servicing) | Verificar com DevOps se merchant tem `ref_merchant_code` cadastrado no LOS. Se não, pedir provisionamento OU usar outro merchant já cadastrado |
| 5 | Kornerstone merchant rejeita HTTP 400 no sendApplication | Sem `mainBankRoutingNumber` + `mainBankAccountNumber` | Kornerstone routing (per business rule #439) exige banking data no body. Usar overload `sendApplication(body)` + `buildSendApplicationBody`: `body.mainBankRoutingNumber = TEST_BANK.DEFAULT_ROUTING; body.mainBankAccountNumber = TEST_BANK.DEFAULT_ACCOUNT;` |
| 6 | `settleApplication` HTTP 500 | Lead não está em SIGNED | Chamar `changeLeadStatus(leadPk, 'SIGNED')` antes (passo 8) |
| 7 | `makeCreditCardPayments` trava 5 min e timeout | Gateway issue qa2 OU body mal formado OU conta não em ACTIVE | Verificar account_status=ACTIVE antes. Se persistir, usar `arrangementType: 'NORMAL'` (não SETTLEMENT) — síncrono mas menos side-effects |
| 8 | `sendInvoice` HTTP 500 `UnexpectedRollbackException` para `eligible_terms='16'` | Config qa1 incompleto para frequências não-MONTHLY + 16 meses | Usar `selectedPaymentFrequency='MONTHLY'` (bypass fallback) + DB-patch: `eligible_terms='16'` + `merchant_program_pk=207` |
| 9 | `uown_sv_payment` com status=PAID inexistente → sweep de email falha silenciosamente | Conta forçada para SETTLED_IN_FULL via UPDATE direto (sem passar por SETTLEMENT payment real) | SEMPRE quitar via `makeCreditCardPayments(SETTLEMENT)` — o listener popula uown_sv_payment. UPDATE direto no status NÃO popula a tabela de pagamentos, e o template SQL (`settled-in-full.sql`) tem INNER JOIN exigindo esse payment |
| 10 | `sendApplication` HTTP 400 / 500 aleatório OU fluxo falha em passo improvável (submit, sign, fund) após semanas funcionando | Drift na configuração do merchant em qa2 — alguém desmarcou `isCcRequired`, `chargeProcessingFee`, `epo10` etc, ou programas 13m/16m foram removidos | `createPreQualifiedApplication` chama `ensureMerchantReady` antes do `sendApplication` (auto). Contrato em `src/data/merchant-config-contract.ts`. Auto-heal via `createOrUpdateMerchant` por default; desligar com `AUTO_HEAL_MERCHANT=false` no `.env` quando não quiser mutar estado compartilhado. Programas 13m/16m insuficientes = fail-fast (precisa correção manual) |
| 11 | `makeCreditCardPayments` HTTP 500 `DataIntegrityViolationException: constraint [fk_uown_cc_transaction_arrangement]` em toda nova conta (UOWN + Kornerstone) | **Bug confirmado no svc** em qa2 — `/uown/svc/makeCreditCardPayments` (plural, criação de payment arrangement com CC) roll-backa todo o `@Transactional` de `PaymentArrangementService.runTransactions`, mesmo com card pré-tokenizado + `useCardOnFile=true`. Reproduzível via UI em `svc-website-qa2.uownleasing.com/customer-information/{accountPk}`. DB forense mostra 0 arrangements + cc_transaction órfã de $1.01 da tokenização. Root cause desconhecida — provável issue de ordering de flush Hibernate ou trigger DB; o FK é só o gatilho visível do rollback | **Sem workaround automation** — teste deve falhar honestamente até o svc ser corrigido. Workarounds investigados e descartados: (a) tokenização prévia via `createOrUpdateCreditCard` + `useCardOnFile:true` NÃO evita (mesmo resultado); (b) endpoint singular `/makeCreditCardPayment` funciona mas não cria arrangement nem dispara listener de `SETTLED_IN_FULL`; (c) UPDATE direto no DB conflita com pitfall #9 (sweep depende de `uown_sv_payment(PAID)` criado pelo listener real). Reportar bug no projeto svc; reexecutar quando fix chegar. |
| 12 | `uown_merchant_activity_log` query falha ou retorna 0 rows — log de mudança de programa não encontrado | Tabela é snake_case `uown_merchant_activity_log` — NÃO `"MerchantActivityLog"` (PascalCase como a JPA entity annotation sugere). Colunas de referência: `merchant_pk` e `program_pk` (não `merchantPk`/`programPk`). `log_type` para mudanças de programa = `PROGRAM_DATA_CHANGE`. <!-- descoberto na task scheduleProgramActivationDeactivationDates, 2026-04-22 --> | Usar snake_case no SQL: `SELECT * FROM uown_merchant_activity_log WHERE program_pk = $1 AND log_type = 'PROGRAM_DATA_CHANGE'` |
| 13 | `ProgramActivationDeactivationSweep` não encontrado via `getScheduledTaskByName` | Nome correto do scheduled task é `ProgramActivationDeactivationSweep` — NÃO `merchantProgramActivation...` nem `programActivationDeactivation...` sem o prefixo completo. <!-- descoberto na task scheduleProgramActivationDeactivationDates, 2026-04-22 --> | Usar `api.scheduledTask.getScheduledTaskByName('ProgramActivationDeactivationSweep')` |
| 14 | `createOrUpdateProgram` cria programa mas merchant não o enxerga nas aplicações | `createOrUpdateProgram` cria/atualiza o registro em `uown_merchant_program` mas NÃO faz a associação merchant↔program. Requer chamada separada a `addProgramsToMerchant` para inserir em `uown_merchant_to_program`. <!-- descoberto na task scheduleProgramActivationDeactivationDates, 2026-04-22 --> | Sempre encadear: `createOrUpdateProgram(body)` → `addProgramsToMerchant(merchantPk, [programPk])` |
| 15 | `is_active` no programa parece correto mas aplicação usa programa "inativo" ou vice-versa | O flag `is_active` em `uown_merchant_program` é SEMPRE sobrescrito pelo backend via `ProgramActivationUtils.isActiveOnDate(activationDate, deactivationDate, today)`. Source of Truth são as datas `activation_date` e `deactivation_date` — não o campo booleano. UPDATE direto em `is_active` sem ajustar datas pode criar estado inconsistente. <!-- descoberto na task scheduleProgramActivationDeactivationDates, 2026-04-22 --> | Para ativar/desativar programa via testes: setar `activation_date`/`deactivation_date` via `updateMerchantProgramDates(pk, {...}, authorizedBy)` — nunca atualizar `is_active` diretamente |
| 16 | Query SQL em `activation_date`/`deactivation_date` retorna objeto Date JS em vez de string, causando comparação falhar | Colunas `date` do PostgreSQL retornam como `Date` objects no driver `pg`. Comparações string diretas falham. <!-- descoberto na task scheduleProgramActivationDeactivationDates, 2026-04-22 --> | Usar cast `::text` nas queries: `SELECT activation_date::text, deactivation_date::text FROM uown_merchant_program WHERE pk = $1` |
| 17 | UI retorna data de `activation_date`/`deactivation_date` em formato ISO (`YYYY-MM-DD`) em alguns contextos e `MM/DD/YYYY` em outros | `ProgramDetailsPage` date inputs alternam entre formatos dependendo do browser locale e do tipo do campo HTML (`date` vs `text`). <!-- descoberto na task scheduleProgramActivationDeactivationDates, 2026-04-22 --> | Usar `normalizeDateInputValue(raw)` de `program-details.page.ts` para normalizar antes de comparar |
| 18 | `getEmailTemplateName` / `getMerchantChargeProcessingFee` / qualquer `db.*` falha com `password authentication failed for user "svc_user"` | Sandbox PostgreSQL em `127.0.0.1:5445` requer Cloud SQL proxy ativo. Sem o tunnel, toda chamada DB falha. Em developer machine fora do contexto CI, o proxy precisa ser tunelado manualmente. <!-- descoberto em task #489 qa-flow, 2026-04-23 --> | (a) Envolver DB calls em try/catch e emitir anotação `[ENV-GAP]` se proxy inativo — assertions primárias de conteúdo (email body) continuam; OU (b) pré-verificar conectividade DB em global setup com graceful skip. Specs que esquecem isso se manifestam como skips silenciosos em cascata em blocos serial. **[env-blocker]** |
| 19 | Assertion de template identity falha ou dá falso positivo — body marker correto no repo mas resultado diverge do email real | `uown_template.template_content` em sandbox pode divergir da versão commitada no repo. Marker único (ex: slogan `"you've got this"`) pode não estar no conteúdo DB deployado. <!-- descoberto em task #489 qa-flow, 2026-04-23 --> | Assertions de template devem cobrir: (1) body NÃO contém banner text que deve ser suprimido, (2) placeholder `merchantLocationName` resolve para o nome esperado (confirma roteamento backend correto), (3) footer confirma UOWN vs Kornerstone. Verificar `uown_template.template_content` diretamente antes de escrever assertions de slogan/copy específico. |
| 20 | `sorErrorDescription="SSN should have 9 digits. Received XXXXXXXXXX"` em `sendApplication` — SSN com 10 dígitos | `generateTestSSN(false)` gerava SSNs de 10 dígitos. Causa: base era `100000000 + randomInt(89999999)` (9 dígitos) + sufixo `"9"` = 10 dígitos total. <!-- descoberto em task #505 CT-10 denied SSN regression, 2026-05-06 --> | Fix aplicado em `src/config/constants.ts:88-93`: base mudada para `10000000 + randomInt(89999999)` (8 dígitos) + `"9"` = 9 dígitos. Verificar sempre que testar SSN "denied" path que o SSN gerado tem exatamente 9 dígitos. |
| 21 | `getMissingFields` falha com HTTP 500 `"Invalid link. Please contact merchant"` após `setupApplicationViaApi(..., { extractContractUrl: true })` | `setupApplicationViaApi` extrai `redirectUrl` de `sendApplication.paymentDetailsList` (linha ~402 de `src/helpers/api-setup.helpers.ts`). Se `sendInvoice` rodar em seguida (o default — só pula via `skipInvoice: true`), o backend regenera o plano de pagamento e invalida a URL anterior. O `shortCode` daquela URL torna-se stale. <!-- descoberto em Task #507 stg run, 2026-05-07 — `getMissingFields` 500 "Invalid link" após `extractContractUrl: true` + default `sendInvoice` --> | Quando `sendApplication` já inclui dados de pedido (caso comum em testes) E é necessário usar o `redirectUrl` retornado pelo helper, passar `skipInvoice: true` junto com `extractContractUrl: true`. O fluxo interno `submitPaymentInfoViaApi: true` não sofre desse problema porque extrai o `redirectUrl` da resposta do invoice (linha ~444) — não do `sendApplication`. |
| 22 | `POST /uown/los/authorizeCreditCard` retorna `{"message": "Invalid card. Please try again", "status": 500}` (2 keys) em vez do slim DTO `{status, error, errorCode, preAuthStatus}` (4 keys) | Quando o body é inválido (ex: `ccNumber="4111"` incompleto, `ccExp` expirado, `cvc` com comprimento errado), a requisição é rejeitada ANTES de `ApplicationService.authorizeCreditCard()` pelo global exception handler do Spring. O `status` no envelope é o HTTP status code como número (não o enum `CCTransactionStatus`). <!-- descoberto em Task #507 stg run, 2026-05-07 — CT-04 (`ccNumber="4111"`) e CT-06 (`ccExp="01/2020"`) retornaram este envelope. Ver `docs/taskTestingUown/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507/RU05.26.1.51.1_removeCcInformationReturnedFromAuthorizeEndpoint_507-stg-report.md` --> | Testes que assertam o shape de `/authorizeCreditCard` DEVEM tratar DOIS formatos: (a) slim DTO 4-key quando o controller foi alcançado (aprovado, negado, last-name mismatch, BIN mismatch) — assertar com strict shape; (b) envelope Spring 2-key quando validação rejeitou o input pré-controller — assertar presença de `message`. Dispatch por `Object.keys(body).length === 4`. A garantia de segurança (sem vazamento de gateway/token/CC) vale para ambos — usar deep deny-list traversal como verificação mínima comum antes do dispatch. |

---

## 3. Helpers que já implementam a sequência completa

| Helper | Completo até | Notas |
|--------|--------------|-------|
| `setupApplicationViaApi` (`src/helpers/api-setup.helpers.ts`) | Passo 7 (submitApplication via `submitPaymentInfoViaApi: true`) | Inclui `getMissingFields` — pode encadear `driveLeadToFunding` depois |
| `createPreQualifiedApplication` (idem) | Passo 7 | Agora inclui `getMissingFields`. Aceita `bankData` para Kornerstone |
| `driveLeadToSigned(api, merchant, ctx)` | Passo 8 | Chama `changeLeadStatus('SIGNED')` |
| `driveLeadToFunding(api, merchant, ctx)` | Passo 10 | Inclui SIGNED → settle → FUNDING |

**Para ir de FUNDING → FUNDED → ACTIVE → SETTLED_IN_FULL:**

Encadear manualmente no spec:
```typescript
await driveLeadToFunding(api, merchant, ctx);                                // passos 8-10
const fundedResp = await api.lead.updateFundingStatus([leadPk], 'FUNDED');   // passo 11
const accountPk = await db.waitForAccountByLeadPk(leadPk, 60_000);           // passo 12
await db.waitForAccountStatus(accountPk, 'ACTIVE', 180_000);                 // passo 13
// Para SETTLED_IN_FULL:
const ccBody = buildCcArrangementBody({ accountPk, arrangementType: 'SETTLEMENT', ... });
await api.paymentArrangement.makeCreditCardPayments(ccBody);                 // passo 14
await db.waitForPaymentArrangementStatus(accountPk, 'SUCCESS', 60_000);      // passo 15
await db.waitForAccountStatus(accountPk, 'SETTLED_IN_FULL', 60_000);         // passo 16
```

---

## 4. Checklist rápido antes de implementar

Ao escrever teste novo que envolve `sendApplication`:

- [ ] `buildTestData` sem `emailOverride` (evita pitfall #1)
- [ ] Kornerstone merchant? → adicionar `bankData` no `createPreQualifiedApplication` (pitfall #5)
- [ ] `submitApplication` chamado? → confirmar `getMissingFields` no helper OU chamar manualmente (pitfall #2)
- [ ] CC test card usado? → `MASTERCARD_APPROVED`, NUNCA `VISA_APPROVED` (pitfall #3)
- [ ] Merchant está provisionado no LOS do ambiente alvo? (pitfall #4 — confirmar com DevOps)
- [ ] Ordem `SIGNED → settle → FUNDING → FUNDED` respeitada (pitfall #6)
- [ ] Testando email template? → usar `makeCreditCardPayments(SETTLEMENT)` (pitfall #9) — nunca forçar `SETTLED_IN_FULL` via UPDATE direto
- [ ] Merchant preflight roda automático via `createPreQualifiedApplication` (pitfall #10). Se o teste NÃO usa esse helper e cria aplicação direto, chamar `ensureMerchantReady(api, merchant.number)` manualmente
- [ ] Testando SETTLED_IN_FULL via `makeCreditCardPayments(SETTLEMENT)`? → pitfall #11 — bug svc ativo em qa2 bloqueia o fluxo. Teste falha 500 FK violation. Documentar como bloqueio conhecido até fix chegar

---

## 6. Contribution Template — como alimentar o catálogo (MANDATORY)

Per [`CLAUDE.md` rule #12](../../../CLAUDE.md), quando um agent/orquestrador descobre um requisito implícito NÃO documentado nos § Pitfalls, é **obrigação** (não opcional) adicioná-lo antes de fechar o pipeline.

### Passo-a-passo para adicionar novo pitfall

1. **Identificar o sintoma exato** — copy-paste da mensagem de erro (HTTP code + body snippet + stack trace key line):
   ```
   Ex: "HTTP 500: UnexpectedRollbackException" em submitApplication (qa1)
   ```

2. **Adicionar linha na tabela § 2 Pitfalls** (na posição numérica imediata — não reordenar anteriores):
   ```markdown
   | #N | {sintoma exato — uma linha} | {causa raiz — uma linha} | {fix/workaround — comando ou config} |
   ```

3. **Se o fix exige mudança na sequência canônica** (§ 1): adicionar um novo passo ou anotar inline no passo afetado com a tag `**[pitfall #N]**`:
   ```markdown
   | 7 | `submitApplication(...)` | lead transita para CC_AUTH_PASSED | **[pitfall #N]** ccNumber = MASTERCARD_APPROVED (ver pitfall) |
   ```

4. **Se o fix exige helper novo ou ajuste em helper existente**: atualizar § 3 Helpers com a signature e onde vive o código.

5. **Incluir referência de descoberta** no fim da linha do pitfall ou em comentário HTML:
   ```markdown
   | #N | ... | ... | ... | <!-- descoberto em #491 run13, 2026-04-21 -->
   ```

6. **Checklist de contribuição:**
   - [ ] Sintoma é reproducible (copiável do log, não paráfrase)
   - [ ] Causa raiz é deterministic (evitar "às vezes", "pode ser" — se não-deterministic, tratar como HIPÓTESE e NÃO adicionar ainda)
   - [ ] Fix é aplicável sem intervenção manual adicional (se depende de config DevOps, marcar `**[env-blocker]**`)
   - [ ] Reference ao pipeline/task descobridor incluída

### Exemplos de contribuições reais

Esta tabela já tem pitfalls #1-#9 coletados das descobertas do pipeline #491 (runs 1-13). Use como modelo — especialmente pitfalls #1 (email reusado → DENIED) e #5 (Kornerstone sem banking) que foram as duas descobertas mais custosas da sessão.

### Não documentar aqui

- Bugs de aplicação reais (vão para relatório do pipeline com tag `[CONFIRMADO]`)
- Test bugs (falhas de código do teste — corrigir o teste, não documentar como pitfall)
- Ambiente inacessível transitoriamente (timeout de DB, VPN caiu) — é flaky, não pitfall

## 7. Referências cruzadas

- Modalidades 13m / 13m+16m / 16m Second Look: [`ssn-test-catalog.md`](./ssn-test-catalog.md)
- Risk tiers + state-specific rules: `docs/business-rules/appendix-g-cenarios-risco.md`
- Test bank constants: `src/config/constants.ts` — `TEST_BANK.DEFAULT_ROUTING` = `'123456780'`, `TEST_BANK.DEFAULT_ACCOUNT` = `'160781900000'`
- Test cards: `src/data/test-cards.ts` — use `MASTERCARD_APPROVED` (BIN 5500)
- Payment arrangement patterns: [`../test-patterns-arrangements.md`](../test-patterns-arrangements.md)
- Test Data Hierarchy: [`../../rules/testing.md § Test Data Hierarchy`](../../rules/testing.md)
- Brand coverage (UOWN + Kornerstone): [`ssn-test-catalog.md § 7`](./ssn-test-catalog.md)

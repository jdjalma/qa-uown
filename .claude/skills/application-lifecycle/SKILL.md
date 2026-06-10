---
name: application-lifecycle
description: Carregue quando o teste cria/manipula uma application UOWN (lead -> pre-qualified -> qualified -> leased -> signed). Define os 13+ steps do ciclo, ordem obrigatoria de chamadas, pitfalls conhecidos (merchant config, OTP timing, fraud callbacks).
disable-model-invocation: true
---

# Application Lifecycle Protocol - UOWN Leasing

> **Proposito:** sequencia canonica de chamadas para criar uma aplicacao end-to-end via API + catalogo de pitfalls conhecidos. OBRIGATORIO para qualquer teste/feature que envolva `sendApplication` ou transicoes de estado de lease.
>
> **Por que existe:** cada nova task que cria aplicacao costuma sangrar 20-60 min redescobrindo os mesmos requisitos implicitos. Este arquivo e a memoria institucional que evita isso.
>
> **Quem consulta:** `qa-planner`, `qa-implementer`, `qa-debugger`, `/qa-flow`, e analises diretas.

> Detalhes completos dos steps: [references/canonical-sequence-detail.md](references/canonical-sequence-detail.md)
>
> Catalogo completo de pitfalls (#1 a #90): [references/pitfalls.md](references/pitfalls.md)

---

## 1. Sequencia canonica (overview)

| # | Chamada | Resultado |
|---|---------|-----------|
| 1 | `buildTestData({ env, state, merchant, orderTotal })` | email unico, SSN aprovado |
| 2 | `api.application.sendApplication(merchant, applicant, order)` | `leadPk`, `leadUuid` |
| 3 | `sleep(5000)` + `getApplicationStatus(merchant, leadUuid)` | status approved |
| 4 | `api.invoice.sendInvoice(merchant, leadUuid, { orderTotal })` | `redirectUrl` |
| 5 | Extrair `shortCode` + `planId` de `redirectUrl` | - |
| 6 | `api.application.getMissingFields(shortCode, { planId })` | seta `merchantProgramPk` |
| 7 | `submitApplication(leadPk, ..., { ccNumber: MASTERCARD_APPROVED })` | CC_AUTH_PASSED |
| 8 | `changeLeadStatus(merchant, leadPk, 'SIGNED')` | SIGNED |
| 9 | `settleApplication(merchant, leadUuid)` | SETTLED |
| 10 | `updateFundingStatus([leadPk], 'FUNDING')` | FUNDING |
| 11 | `updateFundingStatus([leadPk], 'FUNDED')` | FUNDED, cria account |
| 12 | `db.waitForAccountByLeadPk(leadPk)` | accountPk |
| 13 | `db.waitForAccountStatus(accountPk, 'ACTIVE')` | ACTIVE |

**SETTLED_IN_FULL:** steps 14-16 via `makeCreditCardPayments(SETTLEMENT)`.
**Email swap:** steps 17-18 via `createOrUpdateEmail`.

---

## 2. Principios

- **Ordem e inviolavel:** pular steps causa 400/500 silencioso
- **MASTERCARD_APPROVED (BIN 5500) apenas:** VISA causa `UnexpectedRollbackException` (pitfall #3)
- **`getMissingFields` obrigatorio:** sem ele, `submitApplication` retorna 500 (pitfall #2)
- **Email unico por run:** reuso causa `ADDRESS_MISMATCH` denial (pitfall #1)
- **Kornerstone exige bank data:** `mainBankRoutingNumber` + `mainBankAccountNumber` (pitfall #5)
- **SETTLED_IN_FULL via payment real:** UPDATE direto nao popula `uown_sv_payment` (pitfall #9)
- **Merchant preflight automatico:** `createPreQualifiedApplication` chama `ensureMerchantReady` (pitfall #10)
- **`mainNextPayDate` obrigatorio:** pos svc#530, campo validado no body (pitfall #63)

---

## 3. Helpers que implementam a sequencia

| Helper | Completo ate | Notas |
|--------|--------------|-------|
| `setupApplicationViaApi` | Passo 7 | Inclui `getMissingFields` |
| `createPreQualifiedApplication` | Passo 7 | Inclui `getMissingFields` + merchant preflight |
| `driveLeadToSigned` | Passo 8 | `changeLeadStatus('SIGNED')` |
| `driveLeadToFunding` | Passo 10 | SIGNED - settle - FUNDING |

---

## 4. Checklist rapido antes de implementar

- [ ] `buildTestData` sem `emailOverride` (pitfall #1)
- [ ] Kornerstone? bankData no `createPreQualifiedApplication` (pitfall #5)
- [ ] `getMissingFields` chamado antes de `submitApplication` (pitfall #2)
- [ ] CC = `MASTERCARD_APPROVED`, NUNCA `VISA_APPROVED` (pitfall #3)
- [ ] Merchant provisionado no LOS do ambiente alvo (pitfall #4)
- [ ] Ordem `SIGNED - settle - FUNDING - FUNDED` (pitfall #6)
- [ ] Email template? `makeCreditCardPayments(SETTLEMENT)` (pitfall #9)
- [ ] Merchant preflight se nao usa `createPreQualifiedApplication` (pitfall #10)
- [ ] Default payment frequency e WEEKLY (pitfall #53); override se necessario

---

## 5. Pitfalls mais criticos (quick reference)

| # | Sintoma | Fix rapido |
|---|---------|------------|
| 1 | DENIED sem motivo | Email unico (sem `emailOverride`) |
| 2 | 500 "Merchant program required" | `getMissingFields` antes |
| 3 | `UnexpectedRollbackException` | MASTERCARD (BIN 5500) |
| 5 | 400 Kornerstone | Adicionar bank data |
| 9 | Sweep falha silenciosamente | `makeCreditCardPayments(SETTLEMENT)` |
| 10 | 400/500 aleatorio | Merchant preflight / config drift |
| 39 | 500 rollback todos merchants | **[env-blocker]** bug svc (mitigado qa1) |
| 48 | Backdrop intercepts clicks | `dismissCustomerInfoConfirmation()` |
| 66 | 0 rows em timestamp filter | TZ drift: usar PK monoton. ou AT TIME ZONE |
| 69 | Auth fails apos CT-10 | ensureAuthenticated v8 (JWT exp check) |
| 87 | `sweep_logs.processed=0` em leitura imediata | Assertir `uown_email_queue` (PK monoton.), nao sweep_logs |
| 88 | Sweep nao processa conta "elegivel" | Usar query EXATA do sweep (CASE-WHEN DOW) |
| 89 | FirstPaymentReminder pula conta | Alinhar sched_summary + receivable.due_date |
| 90 | Re-trigger retorna processed=0 | Dedup same-day Java; assertir row de hoje |
| 91 | OTP Website pega codigo de outro run | `snapshotInboxUid()` antes + `getVerificationCode({ sinceUid })` |
| 92 | Click sidebar Website intercepted pos-pagamento | `goToSidebarLink` chama `waitForSpinner()` antes |

> Catalogo completo com 90 pitfalls + observacoes cross-cutting: [references/pitfalls.md](references/pitfalls.md)

---

## 6. Contribution Template

Per CLAUDE.md rule #12, quando um agent descobre requisito implicito NAO documentado, e **obrigacao** adiciona-lo em [references/pitfalls.md](references/pitfalls.md) antes de fechar o pipeline.

### Passo-a-passo

1. Identificar sintoma exato (copy-paste da mensagem de erro)
2. Adicionar linha na tabela de pitfalls (proximo numero sequencial)
3. Se o fix exige mudanca na sequencia: anotar inline com `**[pitfall #N]**`
4. Se exige helper novo: atualizar secao 3 Helpers acima
5. Incluir referencia de descoberta (task/pipeline/data)

### Nao documentar aqui

- Bugs de aplicacao reais (vao para relatorio com tag `[CONFIRMADO]`)
- Test bugs (corrigir o teste, nao documentar como pitfall)
- Ambiente inacessivel transitoriamente (timeout, VPN) - e flaky, nao pitfall

---

## 7. Referencias cruzadas

- Modalidades 13m / 13m+16m / 16m Second Look: [[ssn-test-modalities]]
- Risk tiers + state-specific rules: `docs/business-rules/appendix-g-cenarios-risco.md`
- Test bank constants: `src/config/constants.ts` - `TEST_BANK.DEFAULT_ROUTING` / `DEFAULT_ACCOUNT`
- Test cards: `src/data/test-cards.ts` - use `MASTERCARD_APPROVED` (BIN 5500)
- Payment arrangement patterns: `test-patterns-arrangements.md`
- Test Data Hierarchy: `../../rules/testing.md`
- Brand coverage (UOWN + Kornerstone): [[ssn-test-modalities]] secao 7

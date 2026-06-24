---
name: payment-flows
description: Use when a test or task touches payment in the UOWN platform — CC/ACH arrangements, EPO/payoff, allocation strategy, settled-in-full, refund, 13m vs 16m program eligibility, due amounts, CC sweep, receivables. Triggers on file paths like `tests/**/*payment*`, `tests/**/*epo*`, `tests/**/*cc*`, `tests/**/*finalize*`, `src/api/clients/payment-arrangement.client.ts`, `src/api/clients/credit-card.client.ts`, `src/api/clients/svc-payoff.client.ts`, `src/pages/servicing/payment-transaction.page.ts`, or business mentions of "pay credit card today", "make ACH payment", "EPO Only", "Payment/EPO", "payoff amount", "settle in full", "16 meses", "Kornerstone payment".
disable-model-invocation: true
---

# Payment Flows — UOWN domain knowledge

> Tudo que um teste de payment precisa saber. Para tabelas detalhadas de endpoints, DB columns, enums, e activity log patterns, ver [references/endpoints-tables.md](references/endpoints-tables.md).

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO TEST** — patterns, sequências, pitfalls. O **comportamento canônico do produto** (enums `PaymentStatus`/`AllocationStrategy`, máquina de estado, regras de sweep) NÃO mora aqui — é fonte única em `docs/business-rules/05-pagamentos.md` + `04-calculos-financeiros.md` e `src/api/clients/payment-arrangement.client.ts`. Para resolver um tópico, rode `node scripts/docs-tooling.mjs resolve cc-payments` (ou `ach-payments`, `nsf-fee`, `sweeps`). Investigações recentes: `docs/knowledge-base/*sticky*`. **Não duplique regras de produto aqui** — elas driftam.

## Quando aplicar

Aplicar quando teste/PR toca:
- Origination contract page (CC_AUTH_PASSED flow)
- Servicing portal payments (CC/ACH, Payment History, CC Transactions, Due Amounts)
- API payment arrangement (`PaymentArrangementClient`)
- EPO/Payoff (`SvcPayoffClient`)
- Settled In Full (sweep, email, correspondence)
- Refund flows (PT refund, status revert)
- 13m vs 16m program selection

NAO aplicar para: signing (use `gowsign-knowledge`), fraud-vendor (use `fraud-vendors-knowledge`), merchant-config (use `merchant-preflight`).

## Lease state machine (payment context)

```
UW_APPROVED -> CC_AUTH_PASSED -> CONTRACT_CREATED -> SIGNED -> SETTLED -> FUNDING -> FUNDED -> ACTIVE
 |
 SETTLED_IN_FULL
```

- `CC_AUTH_PASSED`: CC + bank info submitted via `authorizeCreditCard`. E-sign becomes active.
- `FUNDED`: becomes `uown_sv_account`. Receivables created. All payments via `/uown/svc/...`.
- `SETTLED_IN_FULL`: payoff completed. Sweep email runs.

**Rule: no servicing payment before FUNDED** — `makeCreditCardPayments` on a lead still in `CONTRACT_CREATED` returns 400.

## Canonical setup sequence

Always prefer `driveLeadToFunding` from `src/helpers/api-setup.helpers.ts`:

```typescript
const { merchant, applicant, order } = buildTestData({ state: 'NY', merchant: 'TireAgent', orderTotal: '1500' });
const ctx = await driveLeadToFunding(api, merchant, applicant, order);
// ctx.accountPk ready for payment arrangement
```

Calls `ensureMerchantReady` (rule 12), fills bank info for Kornerstone, avoids timing pitfalls.

## Payment types summary

| Type | Client method | Key notes |
|------|--------------|-----------|
| CC arrangement | `paymentArrangement.makeCreditCardPayments` | `chargeFee=true` mandatory (Pitfall #4) |
| ACH arrangement | `paymentArrangement.createOrUpdateAchPayments` | |
| CC auth (contract) | `creditCard.authorizeCreditCard` | Pre-CC_AUTH_PASSED, Origination only |
| CC tokenize | `creditCard.createOrUpdateCreditCard` | Returns `creditCardPk` + `ccToken` for card-on-file |
| Payoff | `svcPayoff.getPayoffAmount` | Integer/decimal cents |
| Settlement | `svcPayoff.getServicingInfo` | `settlementAmount` field (when eligible) |

> Full endpoint table with all methods: [references/endpoints-tables.md](references/endpoints-tables.md)

## Refund / Reverse via Servicing (dev3 2026-06-01)

**Tela correta:** `/payment-history/{accountPk}` (History - Payments), NAO `/payment-transaction`. A tela Transaction mostra resumo financeiro mas NAO tem icone de reverse por linha.

- **Page object:** `PaymentHistoryPage` (`src/pages/servicing/payment-history.page.ts`)
- **Icone de reverse:** `svg[data-icon="arrow-rotate-left"]` (NAO `.fa-undo`)
- **`reverseReason` e React Select** (`<div>`, NAO `<select>` nativo): selecionar via clique no controle + clique na opcao. `selectOption` NAO funciona. Confirmar `tagName` via `browser_evaluate` antes de qualquer assert.
- **Opcoes do dropdown (texto exato no DOM):** "Reverse", "Fully Refund", "**Partially** Refund" (NAO "Partial Refund" - o enum `ReverseReason.PARTIAL_REFUND` tem valor de texto errado)
- **Campo amount (`#paymentAmount`)** visivel APENAS quando "Partially Refund" e selecionado
- **Activity log:** refund vai para `uown_sv_activity_log` (acao de Servicing), NAO `uown_los_lead_notes` (LOS) - mesma tabela do Move Due Date

Cross-links: application-lifecycle pitfalls #77 (tela) e #78 (React Select). Page object catalog em [[page-object-pattern]].

## Make Payment via Servicing (modal `#makePayment`, dev3 2026-06-01)

**ACH Make Payment e ASSINCRONO.** Ao submeter ACH pelo modal `#makePayment`, o efeito IMEDIATO (sincrono) e:
- `uown_sv_achpayment` com `status='PENDING'`, `amount=X`, `ach_process_type='REQUEST'`
- Activity log sincrono em `uown_sv_activity_log`: `ADDED : ACHPayment[...status=PENDING...amount=X...]`

O que NAO existe imediatamente (so pos-sweep, via cron `CreateScheduledACHPaymentsSweep` 19:00 diario):
- `uown_sv_payment` row
- `ADDED : Payment[paymentType=ACH...]` DATA_CHANGE log
- `status='PICKED_TO_SEND'` em `uown_sv_achpayment`

**Regra para testes:** Assertir `uown_sv_achpayment WHERE status='PENDING'` + `ADDED : ACHPayment` log. NUNCA assertir `uown_sv_payment` para ACH dentro de timeout razoavel. Sinal de diagnostico: assert de ACH tima out a 60s apesar de toast de sucesso = esperando estado pos-sweep.

**Make Payment aceita overpayment INTENCIONALMENTE.** O modal `#makePayment` NAO tem validacao de teto de valor. Amount > saldo restante (ou > EPO payoff) e aceito: CC SALE APPROVED no valor submetido, `uown_sv_payment` row criada, log `ADDED : Payment[...]`, conta transiciona para `PAID_OUT_EARLY_EPO` se amount >= EPO amount. Confirmado pelo usuario como comportamento esperado - reembolso do excedente e back-office separado. Testes de overpayment devem assertir o comportamento positivo (payment criado, CC APPROVED), NAO rejeicao.

Cross-links: application-lifecycle pitfalls #79 (ACH async) e #80 (overpayment aceito).

## Payment Arrangement via Servicing UI (modal Make Payment, dev3 2026-06-01)

Criar um **Payment Arrangement** (parcelamento) pelo modal Make Payment do Servicing. Diferente do Make Payment one-shot acima: aqui o checkbox "Payment Arrangement" abre Start Date / End Date / Frequency + tabela de parcelas auto-populada.

- **Page objects:** `ServicingBasePage.makeCcPaymentArrangement` (CC) e `ServicingBasePage.makeAchPaymentArrangement` (ACH, criado 2026-06-01). Schedule comum via privado `fillArrangementSchedule`.

- **Arrangement Type e React Select UI EXPLICITO, NAO backend-derivado.** O modal tem `label[for="paymentArrangementType"]` com opcoes `NORMAL` / `SETTLEMENT`. O JSDoc antigo de `makeCcPaymentArrangement` (2026-03-17) dizia "UI does NOT expose an explicit arrangementType field; backend derives it from amount" — esse comentario estava ERRADO/desatualizado. Selector: `SELECTORS.arrangementTypeDropdown` (label-scoped `label[for=paymentArrangementType] ~ div[class*=control]`). Confirmado via DOM-first dev3 2026-06-01.

- **Frequency dropdown:** opcoes `Weekly` | `BiWeekly` | `Monthly` | `SemiMonthly` — usar **exact regex** ("Weekly" como substring tambem casa "BiWeekly").

- **Date pickers `#startDate` / `#endDate` IGNORAM `fill` / `type` / `pressSequentially`.** Sao date pickers React renderizados como `<input type="search">` (mesma DatePicker de `application-wizard.page.ts`). Escrever via `fill`/`type` NAO dispara o `onChange` que o React observa → endDate fica = startDate = today → **1 parcela sempre** (foi a raiz dos bugs F-001 e F-007/S7). Setar via native `HTMLInputElement.prototype.value` setter + dispatch de `input`/`change` events (padrao ja existente em `application-wizard.page.ts`). Cross-link: application-lifecycle pitfall #85.

- **Auto-distribuicao:** `totalPaymentAmount` (input editavel, auto-populado do schedule) e distribuido automaticamente pelas parcelas geradas. Com o date picker corretamente preenchido via native setter, `today → today+28` Weekly gera **5 parcelas** (F-007/S7 RESOLVIDO 2026-06-01 - nao era bug de produto, era o date picker ignorando o texto).

- **ACH vs CC (estado pos-submit):**
 - **ACH** = arrangement `status=NOT_STARTED` + `uown_sv_achpayment` parcelas `PENDING` (ASSINCRONO — promove a `PICKED_TO_SEND` so pos-sweep diario). DB-confirmado dev3: arrangement pk77 acct138.
 - **CC single-installment** = SINCRONO, arrangement `status=SUCCESS` na mesma request; SALE transaction criada com `payment_arrangement_pk` setado. DB-confirmado dev3: arrangement pk72 acct141 → SALE APPROVED.
 - **CC multi-installment** = arrangement fica em **`IN_PROGRESS`**, NAO `SUCCESS`. So a parcela de `posting_date = today` processa sincronamente (APPROVED); as parcelas futuras (`posting_date > today`) ficam `PENDING` ate o posting date chegar. **Comportamento CORRETO do produto** - NAO bug. `simulateCcSweepForArrangement` (date-gated `posting_date <= CURRENT_DATE`) NAO destrava as futuras. Em env sem processor (dev3): usar `db.approveAllPendingCcSalesForArrangement(arrangementPk)` (sem date gate, stand-in autorizado Exception 3, mesmo padrao S4/S5) + `recalculateArrangementStatus`. DB-confirmado dev3: arrangement pk100 com 5 SALEs (pk3328 APPROVED + pk3329-3332 PENDING). Cross-link: application-lifecycle pitfall #86.

Cross-links: application-lifecycle pitfalls #82 (Arrangement Type UI explicito), #85 (date picker native setter), #86 (CC multi-installment IN_PROGRESS). Page object catalog em [[page-object-pattern]]. Helper catalog em [[helpers-catalog]].

## ACH sweep chain + finalizacao do arranjo (dev3 2026-06-01)

**Cron chain confirmada (ACH arrangement → terminal):**

| Sweep / Listener | Schedule | Efeito |
|------------------|----------|--------|
| `SendACHPaymentsSweep` | a cada 5 min | `PENDING → PICKED_TO_SEND` |
| `getSendACHPaymentsStatusSweep` | a cada 6 min | polling do Profituity (status do envio) |
| `getStatusDatePaymentsListSweep` | diario 20:30 | status final do dia |
| `PaymentArrangementACHListener` | callback do processor | so em `SETTLED` / `RETURNED` / `ACK_ERROR` → atualiza o arranjo |

**Estados intermediarios NAO promovem o arranjo.** `PENDING → PICKED_TO_SEND → SENT` deixam o arrangement em `NOT_STARTED`. So um estado terminal do payment (`SETTLED`/`RETURNED`/`ACK_ERROR`) dispara a atualizacao do arranjo (app-lifecycle pitfall #84). Confirmado dev3: arranjos 63/64/65 com payments `SENT` e arrangement `NOT_STARTED`.

**Env sem processor real (dev3): ACH fica preso em `PICKED_TO_SEND`.** Sem Profituity real, nao ha callback - o payment nunca atinge terminal, e `recalculateAchArrangementStatus` retorna `IN_PROGRESS` (pois `PICKED_TO_SEND ∈ PENDING_STATUSES`). Para sintetizar terminal: UPDATE payments para `SETTLED` (Exception 3 - autorizacao explicita do user) ANTES do recalc → arranjo avanca para `SUCCESS` (app-lifecycle pitfall #83).

**`@blocked-by-missing-log` em paths sinteticos.** Os logs de finalizacao (`Arrangement finalized as SUCCESS`/`FAILED`) so sao emitidos pelo `PaymentArrangementACHListener` em callback REAL do processor - **nunca** pelos paths sinteticos (`recalculateAchArrangementStatus` / UPDATE + recalc), que escrevem direto na tabela do arranjo sem executar o listener Java. Em testes nesses paths: assert HARD do estado DB (status + is_active) e do log de CRIACAO ("ACH Arrangement created", organico pre-sweep); marcar o log de FINALIZACAO como `@blocked-by-missing-log` (NAO remover - documenta divida vs rule #13). Prova cruzada: o path CC SETTLEMENT sincrono REAL **gera** o log de finalizacao - confirma que o log vem da execucao backend, nao do recalc helper.

## RightFoot ACH balance-check rerun (R1.53.0)

Fornecedor de verificacao de saldo bancario que **gateia o rerun de ACH** para contas delinquentes (auto-pay ACH). Cadeia:

| Sweep / Service | Schedule | Efeito |
|-----------------|----------|--------|
| `DailyAchBalanceCheckSweep` | `0 0 15 * * ?` | submete balance-checks (`process_type=DAILY_RERUN_DELINQUENT`) ao RightFoot |
| `RerunAchBalanceCheckSweep` | `0 0 9 ? * THU` | balance-check para reruns (`process_type=RERUN`) |
| `DailyRerunAchCreationService` | evento `RightFootBatchCompleteEvent` (AFTER_COMMIT), **nao-Quartz** | cria os ACH apos o webhook do RightFoot |

ACH so e criado quando o balance check tem `status='SUCCESS'`, mesmo routing+account number, e `exposure + amount + $100 <= balance`; o ACH carrega FK `right_foot_balance_check_pk`. Guard de duplicidade: nenhum novo ACH se ja houver um in-flight. Cliente: `scheduledTask.dailyAchBalanceCheckSweep()` / `.rerunAchBalanceCheckSweep()` (constantes `SCHEDULED_TASK_NAMES`). Regra completa: `09-integracoes-externas.md §48`.

## Sticky — Recovery / Cancel / Refund (R1.53.0)

Motor de recovery/dunning de CC recusado (`uown_sticky.recovery_status`). Mudancas R1.53.0 (code-confirmed):

- **Cancel nao-cancelavel:** `StickyRecoverCancelSweep` so cancela nao-terminais (`recovery_status NOT IN ('RECOVERED','FAILED','CANCELED')`); se o Sticky responde "Cannot cancel transaction", svc marca CANCELED **localmente** + grava log INTERNAL/SYSTEM (ver [[activity-log-validation]]).
- **Prior attempts (svc#564):** envia historico de declines + contagem via `StickyPriorAttempts.sql`. ⚠️ **timezone**: o tempo da transacao original e resolvido como **`America/New_York`** (apesar do commit dizer "UTC") — verificar no DB antes de asserir horarios.
- **Duplicate payment:** >1 SvPayment PAID por `ccPk` => WARN + usa o mais recente (**nao bloqueia**).
- **Refund idempotente:** sem chave dedicada — protege via maquina de estado PAID (refund so se `STICKY`+`PAID`; reverter remove PAID → 2a tentativa rejeitada). Refund/recovery happy-path = **sandbox-only** (KB `sticky-payment-refund.md`).

Regra de produto: `05-pagamentos.md §53b`.

## Recibo de pagamento — Balance & "You Save" (R1.53.0)

`balance` no recibo agora **inclui todas as fees** (PP/NSF/reinstatement/misc); "You Save" (`balance - payoffBeforeEPOExpiry`) so renderiza quando `> 0`. Corrige balance negativo/corrompido com fees. **ExtBrand**: logo PayNearMe email/SMS = `company.name().toLowerCase()+".png"`. Detalhe: `05-pagamentos.md §72`.

## Email Sweep validation + selection conditions (dev3 2026-06-02)

Sweeps de email (`settledInFullAccountEmailSweep`, `RecurringPaymentReminderSweep`, `FirstPaymentReminderSweep`) escrevem em `uown_email_queue` e `uown_correspondence_logs`. Validados em `email-sweeps-servicing.spec.ts` (3 cenarios, 5/5 PASS).

**Template names confirmados (case-sensitive, dev3 2026-06-02):**

| Sweep | `template_name` em `uown_email_queue` |
|-------|----------------------------------------|
| `settledInFullAccountEmailSweep` | `SettledInFullEmail` |
| `RecurringPaymentReminderSweep` | `RecurringPaymentReminder` |
| `FirstPaymentReminderSweep` | `FirstPaymentReminder` |

> `src/scripts/dev3-trigger-sweeps.ts` usa template ERRADO (`SettledInFullAccountEmail`) e porta ERRADA (`5446`). NAO copiar desse arquivo. Catalogo canonico em [[email-templates-catalog]].

**Tabelas de audit:**
- `uown_email_queue`: `pk, account_pk, lead_pk, template_name, status (STORED/SENT/PICKED_TO_STORE), sent_time, row_created_timestamp` — evidencia PRIMARIA (PK monotonico).
- `uown_correspondence_logs`: `pk, account_pk, lead_pk, correspondence_type ('EMAIL'), template_name, error, row_created_timestamp` — campo `error` carrega texto informativo MESMO em sucesso; NAO assertir `error IS NULL`.
- `uown_sweep_logs`: `pk, sweep_name, number_of_records_processed, row_created_timestamp`.

**Regra 1 — `uown_sweep_logs.number_of_records_processed` NAO e confiavel em leitura imediata.** O Java cria a row com `processed=0` ANTES de processar e atualiza DEPOIS. Leitura `< 5s` apos trigger pega o valor pre-processamento. Usar `uown_email_queue` (row nova de hoje, PK monotonico) como evidencia primaria, NUNCA `processed >= 1` via leitura imediata (app-lifecycle pitfall #87).

**Regra 2 — `settledInFullAccountEmailSweep` tem janela DOW na data de settlement.** A query do sweep tem CASE-WHEN em `settled_in_full_date_time`:
- DOW 1/2 (Seg/Ter): `DATE(settled_in_full_date_time) = CURRENT_DATE - 4`
- DOW 3 (Qua): `DATE(...) IN (CURRENT_DATE-4, CURRENT_DATE-3, CURRENT_DATE-2)`
- DOW 4/5 (Qui/Sex): `DATE(...) = CURRENT_DATE - 2`
- Fim de semana (`DOW NOT BETWEEN 1 AND 5`): sweep NAO roda.

Usar a query EXATA do sweep para selecionar a conta de teste; query simplificada superestima o conjunto elegivel (app-lifecycle pitfall #88).

**Regra 3 — `FirstPaymentReminderSweep` exige `sched_summary` E `receivable` alinhados.** Condicoes:
```sql
AND schedSummary.first_payment_due_date <= CURRENT_DATE + 3
AND receivable.due_date = schedSummary.first_payment_due_date
AND receivable.receivable_type IN ('REGULAR_PAYMENT')
AND receivable.allocation_status IN ('UNPAID')
AND receivable.status IN ('ACTIVE')
```
Atualizar so `uown_sv_sched_summary.first_payment_due_date` deixa o JOIN em 0 rows. Atualizar TAMBEM a `uown_sv_receivable.due_date` do primeiro REGULAR_PAYMENT UNPAID ACTIVE para o mesmo valor `<= today+3` (UPDATE — Exception 3, autorizacao explicita). Contas fresh tem `first_payment_due_date = today+7` (fora da janela) (app-lifecycle pitfall #89).

**Regra 4 — dedup same-day (Java-side) em `settledInFullAccountEmailSweep`.** O sweep pula contas que ja tem email `STORED`/`SENT`/`PICKED_TO_STORE` hoje. Re-triggers do mesmo dia retornam `processed=0`. Assertir PRESENCA de row em `uown_email_queue` de hoje (NAO `>= triggerTs`) e tolerar `processed=0` (app-lifecycle pitfall #90).

Cross-links: application-lifecycle pitfalls #87-#90; [[email-templates-catalog]]; [[activity-log-validation]] (email audit tables).

## Rating letter em Payment Arrangement (CORRIGIDO dev3 2026-06-01)

**`uown_sv_account.rating='P'` (Promise to Pay) E PERSISTIDO na criacao do arranjo** - tanto ACH quanto CC. Isto **corrige** business-rule §54, que documentava como "BUG CONHECIDO" a NAO-persistencia do campo. DB-confirmado em dev3 (2026-06-01): o campo PERSISTE corretamente. §54 estava documentando o bug de forma incorreta.

- **Criacao do arranjo (ACH e CC):** `rating='P'` gravado em `uown_sv_account`; `previous_rating` salvo no arranjo para auditoria; auto-pay existente preservado.
- **CC arrangement SUCCESS:** `rating` resetado para `null` + autopay re-ligado. Isto e **comportamento correto de negocio** (conta voltou ao normal apos quitar), NAO bug.
- **Arrangement FAILED:** `current_rating` volta para `null` (reset).

**Regra para testes:** assertir `rating='P'` apos criar arranjo (e HARD assert, nao `@blocked`). Apos CC SUCCESS, assertir `rating IS NULL` + autopay ativo.

## AllocationStrategy (CRITICAL)

```typescript
enum AllocationStrategy {
 DEFAULT = 'Payment/EPO', // pays regular + EPO together
 REGULAR_RECEIVABLES = 'Payment', // regular receivables only
 EPO_ONLY = 'EPO Only', // EPO only
}
```

**UI location (2026-05):** Payment History "Update Payment" modal (NOT CC Transactions pencil). Set via `PaymentTransactionPage.editAllocationStrategy(rowIndex, strategy)`.

## Key principles

1. **`chargeFee=true`** mandatory in every CC transaction (via builder, not literal)
2. **`TEST_CARDS.MASTERCARD_APPROVED`** (BIN 5500) for CC payments; VISA rolled back in qa
3. **Float assertions:** use `toBeCloseTo` or `Number` comparison, never `toBe` for monetary values
4. **Activity log mandatory** for every payment action (CLAUDE.md rule 13)
5. **UI-first** when feature has a portal screen (CLAUDE.md rule 14)
6. **`accountPk` only after FUNDED** — distinct from `leadPk`
7. **16m eligibility is merchant-config, not brand** — any merchant with `term_in_months=16 AND is_active=true`
8. **Move Due Date cap:** WEEKLY=3d, others=7d. Safe universal offset=3
9. **`getMissingFields` before `submitApplication`** — sets `merchantProgramPk`, without it 400

## Pitfalls

| # | Pitfall | Fix |
|---|---------|-----|
| 1 | FK violation `fk_uown_cc_transaction_arrangement` | First `createOrUpdateCreditCard` to tokenize, then `useCardOnFile: true` |
| 2 | `sendInvoice` invalidates `contractUrl` | Never call before contract page is completed |
| 3 | VISA_APPROVED rolled back in qa | Use `MASTERCARD_APPROVED` (BIN 5500) |
| 4 | Missing `chargeFee=true` | Use `buildCcArrangementBody` builder |
| 5 | SETTLED_IN_FULL via direct UPDATE | Must use `makeCreditCardPayments(SETTLEMENT)` for sweep to work |
| 6 | Allocation strategy moved from CC Transactions | Now in Payment History "Update Payment" modal |
| 7 | Float in assertions | Use `toBeCloseTo(b, 2)` or `Number` |
| 8 | CC sweep row not at pk=1 | Use `ORDER BY pk DESC LIMIT 1` |
| 9 | Confusing accountPk/leadPk/leadUuid | leadPk for LOS, accountPk for SVC (only after FUNDED) |
| 10 | Missing `getMissingFields` call | Required before `submitApplication` |
| 11 | Refund procurado em `/payment-transaction` (sem icone reverse) | Usar `/payment-history/{accountPk}` + `PaymentHistoryPage` (app-lifecycle #77) |
| 12 | `selectOption` no `reverseReason` (React Select) no-op | Clique no controle + clique na opcao "Partially Refund" (app-lifecycle #78) |
| 13 | Assert de ACH Make Payment tima out a 60s apesar de toast de sucesso | ACH e assincrono: assertir `uown_sv_achpayment WHERE status='PENDING'` + `ADDED : ACHPayment` log; NUNCA `uown_sv_payment` (so pos-sweep 19:00) (app-lifecycle #79) |
| 14 | Teste assertando rejeicao de overpayment no modal Make Payment falha | Modal NAO valida teto de valor - overpayment e aceito de proposito; assertir comportamento positivo (payment criado, CC APPROVED) (app-lifecycle #80) |
| 15 | Codigo/JSDoc assume Arrangement Type backend-derivado do amount | Arrangement Type e React Select UI explicito (`label[for=paymentArrangementType]`, NORMAL/SETTLEMENT). Selecionar via `SELECTORS.arrangementTypeDropdown`. JSDoc antigo de `makeCcPaymentArrangement` (2026-03-17) estava errado (app-lifecycle #82) |
| 16 | Em env sem processor real (dev3), transicao terminal de ACH arrangement sintetizada via `recalculateAchArrangementStatus`/`recalculateArrangementStatus` + UPDATE autorizado **NAO gera activity log** de finalizacao ("Arrangement finalized as SUCCESS"/failure). Causa: esses helpers escrevem direto em `uown_sv_payment_arrangement` e nunca executam o `PaymentArrangementACHListener` Java — codigo que escreveria o log so e disparado por callback REAL do processor (SETTLED/RETURNED). Sintoma: estado FAILED/SUCCESS + `is_active` corretos, mas assert de log rule #13 falha. NAO e bug de produto. | Validacao terminal: estado DB (status + is_active) e HARD assert. Log de criacao ("ACH Arrangement created") e organico (pre-sweep) → HARD assert. Log de **finalizacao** no path sintetico → `@blocked-by-missing-log` (NAO remover, rule #13) + comentario explicativo + Q ao dev para env com processor. Confirmacao: S6 (CC SETTLEMENT, path sincrono REAL) **gera** o log de finalizacao — prova que o log vem da execucao backend, nao do recalc helper. (S4/S5 do payment-arrangement-servicing, dev3 2026-06-01) |
| 17 | ACH arrangement preso em `IN_PROGRESS` apos `SendACHPaymentsSweep` em env sem processor (dev3); recalc nunca chega a `SUCCESS` | Payment para em `PICKED_TO_SEND` (sem callback Profituity) e `PICKED_TO_SEND ∈ PENDING_STATUSES`. UPDATE payments → `SETTLED` (Exception 3, autorizacao explicita) ANTES do recalc → arranjo avanca para `SUCCESS`. Estados intermediarios (`PENDING/PICKED_TO_SEND/SENT`) deixam o arranjo em `NOT_STARTED` - so terminais (`SETTLED/RETURNED/ACK_ERROR`) o promovem (app-lifecycle #83/#84). |
| 18 | Assert de rating letter trata `rating='P'` como nao-persistido seguindo "BUG CONHECIDO" de §54 | **§54 estava errado** - `uown_sv_account.rating='P'` PERSISTE na criacao do arranjo (ACH e CC), DB-confirmado dev3 2026-06-01. Assertir `rating='P'` como HARD assert. CC SUCCESS reseta `rating` para `null` + re-liga autopay (comportamento correto, nao bug). Ver secao "Rating letter em Payment Arrangement". |
| 19 | Date pickers `#startDate`/`#endDate` do arrangement modal ignoram `fill`/`type`/`pressSequentially` → endDate=startDate=today → 1 parcela sempre (raiz de F-001 e F-007/S7) | `<input type="search">` controlado por React; `fill`/`type` nao disparam o `onChange`. Setar via native `HTMLInputElement.prototype.value` setter + dispatch de `input`/`change` (padrao em `application-wizard.page.ts`). Com o fix, `today→today+28` Weekly gera 5 parcelas (app-lifecycle #85). |
| 20 | CC multi-installment arrangement preso em `IN_PROGRESS`, nao chega a `SUCCESS` apos `simulateCcSweepForArrangement` | So a parcela `posting_date=today` processa sincronamente (APPROVED); futuras (`posting_date>today`) ficam `PENDING` - comportamento CORRETO do produto. `simulateCcSweepForArrangement` e date-gated. Em env sem processor (dev3): `db.approveAllPendingCcSalesForArrangement(arrangementPk)` (sem date gate, Exception 3) + `recalculateArrangementStatus` (app-lifecycle #86). |
| 21 | `uown_sweep_logs.number_of_records_processed=0` em leitura imediata apesar de sweep processar contas | Java escreve `processed` DEPOIS de processar; row inicial e `0`. Evidencia primaria = `uown_email_queue` row nova de hoje (PK monotonico), nao `processed>=1` imediato (app-lifecycle #87). |
| 22 | `settledInFullAccountEmailSweep` nao processa conta "elegivel" | Sweep tem CASE-WHEN DOW na `settled_in_full_date_time` (Seg/Ter=today-4, Qua=today-4/-3/-2, Qui/Sex=today-2, fds=nao roda). Usar query EXATA do sweep para selecionar conta (app-lifecycle #88). |
| 23 | `FirstPaymentReminderSweep` pula conta apesar de `first_payment_due_date <= today+3` | Sweep exige `receivable.due_date = schedSummary.first_payment_due_date` (REGULAR_PAYMENT/UNPAID/ACTIVE). Atualizar TAMBEM `uown_sv_receivable.due_date` (Exception 3). Fresh = today+7 (fora) (app-lifecycle #89). |
| 24 | Re-trigger do `settledInFullAccountEmailSweep` retorna `processed=0` | Dedup same-day Java (STORED/SENT/PICKED_TO_STORE de hoje). Assertir presenca de row em `uown_email_queue` de hoje (nao `>= triggerTs`); tolerar `processed=0` (app-lifecycle #90). |

## Checklist (pre-merge)

- [ ] Setup via `driveLeadToFunding` or `createPreQualifiedApplication` (fresh data)
- [ ] `MASTERCARD_APPROVED` where applicable
- [ ] `chargeFee=true` in all CC tx (via builder)
- [ ] Float assertions use `toBeCloseTo`
- [ ] Activity log validated for each payment action
- [ ] AllocationStrategy via Payment History modal
- [ ] `accountPk` extracted post-FUNDED
- [ ] 13m vs 16m confirmed via `uown_merchant_program` query
- [ ] UI-first respected
- [ ] Move Due Date: checked frequency before choosing offset; WEEKLY cap=3d
- [ ] Move Due Date activity log: `uown_sv_activity_log` (NOT `uown_los_lead_notes`)
- [ ] Refund/Reverse via `/payment-history/{accountPk}` (NOT `/payment-transaction`); reverse reason via React Select click; refund log in `uown_sv_activity_log`

> Detailed endpoints, DB tables, enums, sweep timing, activity log patterns: [references/endpoints-tables.md](references/endpoints-tables.md)

## Cross-links

- [[application-lifecycle]] — pitfall #11 (FK violation), full state machine
- [[common-operations]] — `buildCcPaymentDetails`, reusable patterns
- [[bug-classification]] — float divergence classification
- [[ssn-test-modalities]] — 16m SSN modalities
- [[merchant-preflight]] — `ensureMerchantReady` before application creation
- [[activity-log-validation]] — assertion templates

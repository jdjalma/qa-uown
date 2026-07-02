---
operation: servicing-cc-rerun-sweep
description: Contrato de elegibilidade + mecanismo para os 5 sweeps (scheduled tasks) de RERUN/RETRY de cartão de crédito do portal Servicing, disparados por `api.scheduledTask.triggerScheduledTask(name)` (POST `/uown/svc/triggerScheduledTask/{name}` → 200). Cada sweep seleciona contas/transações de CC via SQL vivo (`uown_scheduled_task.sql_to_pick_accounts`) e tenta re-cobrar o cartão em arquivo. A evidência determinística é dupla — (1) ELEGIBILIDADE: a conta/transação semeada é selecionada pela SQL EXATA do sweep; (2) MECANISMO: uma nova linha em `uown_sweep_logs`. O desfecho real da re-cobrança (nova transação RERUN, mudança de status) é `[OBSERVAÇÃO]` assíncrona, EXCETO o sweep account-level `delinquencyRerunCCPaymentsSweep` (S4), que processa contas de fato (observado processed=16). RAIL = CARTÃO DE CRÉDITO (`uown_sv_credit_card_transaction`), distinto do rerun ACH (S6 `rerunACHPaymentsSweep`, `uown_sv_achpayment`) coberto em servicing-business-sweeps.md — sem sobreposição. SEM superfície de UI — scheduled tasks admin/ops (Regra #14 exceção a); observabilidade é a persistência no DB (Regra #14 exceção c). Cobre S1..S5 no arquivo `cc-rerun-sweeps-servicing.spec.ts`.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts
  - src/helpers/sweep-fixture.helpers.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/05-pagamentos.md
  - docs/business-rules/appendix-d-constantes-enums.md
---

# Oracle BDD — CC Rerun Sweeps (Servicing) — 5 scheduled tasks

> **Natureza (UI/API/DB): API-trigger + DB-assert. NÃO há superfície de UI.**
> Estes 5 sweeps são scheduled tasks (Quartz) administrativas/ops de RECUPERAÇÃO DE PAGAMENTO
> de cartão de crédito, disparadas por `POST /uown/svc/triggerScheduledTask/{taskName}`
> (`scheduled-task.client.ts:24-25`; `spec:116,158,197,232,274`). A Regra #14 exceção (a) —
> endpoint admin/ops sem UI exposta — **isenta estes sweeps do UI-first**; a Regra #14 exceção
> (c) — validação DB cross-cutting — cobre a asserção do efeito. **Decisão explícita do usuário
> (2026-07-02): a isenção de UI-first NÃO isenta da Regra #19** — todo sweep nomeado exige um
> oracle registrado. Por isso este oracle é o contrato **elegibilidade + mecanismo** no DB, sem
> passos Gherkin de UI. Isso é esperado e correto, não uma lacuna.
>
> **Gatilho:** disparar `triggerScheduledTask(name)` para qualquer um dos 5 nomes de sweep de CC
> abaixo, OU **rodar** `tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts` — rodar o spec É
> executar as operações que ele exercita (Regra #19), incluindo as mutações DB autorizadas de
> setup (Exceção 3), a auto-validação via SQL de seleção viva e o disparo dos 5 sweeps. Também
> dispara este oracle qualquer execução manual via MCP de um desses sweeps no Servicing.
>
> **Nomes de sweep cobertos (case-sensitive — `spec:8-14,109,151,190,225,267`):**
> `rerunCCPaymentsSweep` (S1) · `CCDailyScheduledDeniedRerun` (S2) · `dailyDelinquencyRerunCCSweep` (S3) ·
> `delinquencyRerunCCPaymentsSweep` (S4) · `IdempotentCCSweep` (S5).
>
> **SEM sobreposição com o rerun ACH (S6):** `servicing-business-sweeps.md` cobre
> `rerunACHPaymentsSweep` (S6) — rail ACH, tabela `uown_sv_achpayment`, evidência = linha
> `ach_process_type IN ('RERUN','RERUN_NSF')`. ESTE spec é rail **cartão de crédito**, tabela
> `uown_sv_credit_card_transaction`, e os 5 nomes de sweep são Quartz tasks DISTINTAS de
> `rerunACHPaymentsSweep`. Nenhum dos 11 business sweeps daquele oracle repete estes 5 nomes →
> zero duplicação. Fonte: `spec:8-16` vs `servicing-business-sweeps.md:219-239`.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts \
>   src/helpers/sweep-fixture.helpers.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/05-pagamentos.md \
>   docs/business-rules/appendix-d-constantes-enums.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (`ENV=dev3` — `spec:33-37`). O worker fixture `db` conecta em
> `process.env.ENV`; rodar com `ENV=dev3` para as asserções DB baterem no mesmo banco que o
> SVC API svc-dev3 dispara. Timeout 300s (`--timeout=300000`, `spec:35-36`); cada teste
> `setTimeout(120_000)`. Modo **serial** (`test.describe.configure({ mode: 'serial' })`, `spec:74`).
>
> **Contas/token de fixture (hardcoded dev3, descartável):** contas 219–223 (S1..S3, S5) +
> conta 67 (S4, ver CT-S4 para por que 222 é estruturalmente inelegível). Token MASTERCARD
> chargeable `CARD_TOKEN='545f5afc-1e51-4960-99a5-5fd173cefbe0'` (card pk=291 da conta 219,
> capturado 2026-06-03), reusado nas transações semeadas para dar um token cobrável ao rerun.
> Fonte: `spec:43-45`. Em ambiente compartilhado (qa1) use a descoberta dinâmica de
> `sweep-fixture.helpers.ts` (`findIdleActiveAccountWithCard`) + `restore*`/`deleteSyntheticRow`
> no teardown — NÃO usados por ESTE spec (só `sweepLogBaseline`/`triggerAndWaitSweepLog` são
> importados aqui, `spec:40`), mas parte do mesmo módulo `covers`.

---

## Modelo de evidência (por que estes CTs são fortes SEM asserir a re-cobrança)

> O spec documenta explicitamente um modelo de evidência determinístico de DOIS estágios
> (`spec:18-29`), aplicado identicamente a S1..S5:
>
> 1. **ELEGIBILIDADE (gate primário).** O teste lê a coluna `sql_to_pick_accounts` VIVA do sweep
>    em `uown_scheduled_task` e RODA essa SQL exata; asserta que a conta/transação semeada aparece
>    entre as linhas selecionadas. Isso prova (a) que a mutação de setup torna o registro elegível
>    E (b) que a lógica de seleção REAL do sweep o escolhe — sem WHERE hand-copiado que possa
>    driftar. Helper spec-local `sweepSelectsAccount(db, sweepName, accountPk)` (`spec:56-69`).
> 2. **MECANISMO.** `triggerScheduledTask` produz uma nova linha `uown_sweep_logs` (`pk > baseline`).
>
> **A re-cobrança em si (nova transação RERUN, transição de status, `number_of_records_processed`)
> é `[OBSERVAÇÃO]` assíncrona** — exige um processador de CC vivo executando a retentativa, que o
> dev3 NÃO executa de forma determinística para reruns em nível de transação (S1, S2, S3, S5).
> A EXCEÇÃO é o sweep account-level `delinquencyRerunCCPaymentsSweep` (S4), que processa contas de
> fato no dev3 (observado `processed=16`) — sua contagem é logada quando `> 0`, mas **não é
> asserida** `>= 1` (mesmo motivo do contrato base: escrita assíncrona). Fonte: `spec:18-29,233-234`.

---

## Mecanismo comum a TODOS os sweeps de CC (S1..S5) — contrato base

> Cada sweep é disparado pelo helper compartilhado `triggerAndWaitSweepLog(api, db, name, prevPk)`
> (`sweep-fixture.helpers.ts:99-120`), idêntico ao usado pelos business sweeps. O contrato mecânico
> é o mesmo para os 5:

```gherkin
Dado que o baseline MAX(pk) de uown_sweep_logs para o sweep de CC é capturado antes do disparo
Quando o sweep é disparado via triggerScheduledTask(name)
Então a resposta HTTP é 200
E uma NOVA linha aparece em uown_sweep_logs com sweep_name = name e pk > baseline em até 30s
```

### Oracle (mecanismo — todos os sweeps de CC)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP do trigger | `resp.status === 200` (propriedade, NÃO método — nunca `resp.status()`) | `sweep-fixture.helpers.ts:105-106` |
| Endpoint disparado | `POST /uown/svc/triggerScheduledTask/{taskName}` | `scheduled-task.client.ts:24-25` |
| Nova linha em `uown_sweep_logs` | `db.waitForRecord('uown_sweep_logs', 'sweep_name = $1 AND pk > $2', [name, prevPk], 30_000)` truthy | `sweep-fixture.helpers.ts:107-113` |
| Baseline | `sweepLogBaseline(db, name)` = `COALESCE(MAX(pk),0)` de `uown_sweep_logs WHERE sweep_name=$1` | `sweep-fixture.helpers.ts:47-52` |
| Contagem `number_of_records_processed` | **NUNCA asserida `>= 1`** — escrita assíncrona APÓS o processamento; só logada via `console.log` (`processed=...`) | `spec:117-118,159,198,234,275`; `sweep-fixture.helpers.ts:95-98,114-119` |

### Oracle (elegibilidade — auto-validação via SQL viva, todos os sweeps de CC)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| SQL de seleção viva lida do sweep | `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1` retorna SQL não-vazio | `spec:61-65` |
| Conta/transação semeada é selecionada | `sweepSelectsAccount(db, name, accountPk)` === `true` — o `accountPk` aparece em ALGUM valor de ALGUMA linha retornada pela SQL exata do sweep | `spec:66-68` |
| Asserção de gate | `expect(selected, '<conta> must be selected by <sweep> SQL').toBeTruthy()` | `spec:110,152,191,226,268` |

> **Por que a elegibilidade é o oráculo primário (Regra #10):** a re-cobrança de CC é assíncrona e
> depende de um processador vivo ausente no dev3 para reruns transação-a-transação. Asserir a nova
> transação RERUN aqui seria um red-assert dependente de infra → falso-bug. O gate honesto é: a
> mutação de setup torna o registro elegível PELA SQL REAL DO SWEEP (não uma cópia), e o sweep
> executou (linha `sweep_log`). Fonte: `spec:18-29`.

---

## CT-S1 — rerunCCPaymentsSweep → seleciona + roda em SALE SCHEDULED DENIED/NSF

> Conta **219**. **Mutação DB autorizada (Exceção 3):** `auto_pay_types='CC'` (o sweep exige
> `LIKE '%CC%' AND NOT LIKE '%ACH%'`), `delinquency_as_of_date=NULL`, e INSERT de uma transação
> `status='DENIED'`, `is_nsf=true`, `cc_action='SALE'`, `cc_transaction_type='SCHEDULED'`,
> `number_of_tries=0`, `posting_date=CURRENT_DATE-1` (janela DOW), `amount=50.00`,
> `vendor='CHANNEL_PAYMENTS_CC'`, `cc_type='MASTERCARD'`, token cobrável. Idempotente: só insere
> se ainda não existir a linha equivalente. Fonte: `spec:85-105`.

```gherkin
Dado que a conta 219 tem auto_pay_types='CC' (não ACH) e nenhuma delinquência (setup autorizado Exceção 3)
E existe uma transação de CC DENIED/NSF/SALE/SCHEDULED postada ontem com um token cobrável para a conta 219
Quando a SQL de seleção viva do rerunCCPaymentsSweep é executada
Então a conta 219 aparece entre as linhas selecionadas pelo sweep
E ao disparar rerunCCPaymentsSweep, uma nova linha uown_sweep_logs para rerunCCPaymentsSweep aparece com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE auto_pay_types='CC'` (pk=219) + `UPDATE delinquency_as_of_date=NULL` + INSERT DENIED/NSF/SCHEDULED SALE (`posting_date=CURRENT_DATE-1`) idempotente | `spec:87-103` |
| Elegibilidade (gate primário) | `sweepSelectsAccount(db, 'rerunCCPaymentsSweep', '219')` truthy | `spec:109-111` |
| Mecanismo `sweep_log` | contrato base | `spec:115-117` |
| Re-cobrança | `[OBSERVAÇÃO]` assíncrona — `processed` só logado, não asserido | `spec:117-118` |

---

## CT-S2 — CCDailyScheduledDeniedRerun → seleciona + roda em SALE SCHEDULED DENIED de hoje

> Conta **220**. **Mutação DB autorizada (Exceção 3):** `delinquency_as_of_date=CURRENT_DATE-5`
> (delinquência `<= hoje`), `auto_pay_types='CC'`, e INSERT de uma transação `status='DENIED'`,
> `cc_action='SALE'`, `cc_transaction_type='SCHEDULED'`, `posting_date=CURRENT_DATE`,
> `error='Insufficient funds'` (não na lista de cartão expirado), `comment='regular tx'` (não
> `Idempotent`). Idempotente. Fonte: `spec:130-148`. Alinha com "Daily Denied Rerun" —
> `05-pagamentos.md:70-72` (retentativa diária de CCs negados/errados do dia, excluindo
> permanentemente cartões expirados/inválidos/contas fechadas/roubados).

```gherkin
Dado que a conta 220 tem auto_pay_types='CC' e delinquência anterior a hoje (setup autorizado Exceção 3)
E existe uma transação de CC DENIED/SALE/SCHEDULED postada hoje, com erro "Insufficient funds" e comentário não-Idempotent, para a conta 220
Quando a SQL de seleção viva do CCDailyScheduledDeniedRerun é executada
Então a conta 220 aparece entre as linhas selecionadas pelo sweep
E ao disparar CCDailyScheduledDeniedRerun, uma nova linha uown_sweep_logs para CCDailyScheduledDeniedRerun aparece com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE delinquency_as_of_date=CURRENT_DATE-5` + `UPDATE auto_pay_types='CC'` (pk=220) + INSERT DENIED/SCHEDULED SALE (`posting_date=CURRENT_DATE`, `error='Insufficient funds'`, `comment='regular tx'`) idempotente | `spec:131-146` |
| Elegibilidade (gate primário) | `sweepSelectsAccount(db, 'CCDailyScheduledDeniedRerun', '220')` truthy | `spec:151-153` |
| Mecanismo `sweep_log` | contrato base | `spec:157-159` |
| Re-cobrança | `[OBSERVAÇÃO]` assíncrona — `processed` só logado | `spec:159` |

---

## CT-S3 — dailyDelinquencyRerunCCSweep → seleciona + roda em conta delinquente

> Conta **221**. **Mutação DB autorizada (Exceção 3):** `delinquency_as_of_date=CURRENT_DATE-5`
> (conta delinquente) + INSERT de uma transação `status='APPROVED'`, `cc_action='SALE'`,
> `cc_transaction_type='SCHEDULED'`, `posting_date=CURRENT_DATE`. Note: aqui a transação semeada é
> **APPROVED** (não DENIED) — este sweep de delinquência diária seleciona pela combinação
> SALE-de-hoje + conta ACTIVE delinquente, não por negação. Idempotente. Fonte: `spec:171-187`.

```gherkin
Dado que a conta 221 está delinquente (delinquency_as_of_date anterior a hoje) e ACTIVE (setup autorizado Exceção 3)
E existe uma transação de CC APPROVED/SALE postada hoje para a conta 221
Quando a SQL de seleção viva do dailyDelinquencyRerunCCSweep é executada
Então a conta 221 aparece entre as linhas selecionadas pelo sweep
E ao disparar dailyDelinquencyRerunCCSweep, uma nova linha uown_sweep_logs para dailyDelinquencyRerunCCSweep aparece com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE delinquency_as_of_date=CURRENT_DATE-5` (account_pk=221) + INSERT APPROVED/SALE/SCHEDULED (`posting_date=CURRENT_DATE`) idempotente | `spec:172-185` |
| Elegibilidade (gate primário) | `sweepSelectsAccount(db, 'dailyDelinquencyRerunCCSweep', '221')` truthy | `spec:190-192` |
| Mecanismo `sweep_log` | contrato base | `spec:196-198` |
| Re-cobrança | `[OBSERVAÇÃO]` assíncrona — `processed` só logado | `spec:198` |

---

## CT-S4 — delinquencyRerunCCPaymentsSweep → processa contas long-delinquent (account-level)

> Conta **67** (NÃO 222). **Mutação DB autorizada (Exceção 3):** `delinquency_as_of_date=CURRENT_DATE-110`
> E `last_payment_date=CURRENT_DATE-110` (envelhecidas > 100 dias). Este é um sweep **em nível de
> conta** (não transação): delinquência > 100d, última pagamento > 100d, ACTIVE, CC não deletado.
> **Este sweep processa contas de fato no dev3** (observado `processed=16`) — a exceção ao modelo
> assíncrono. Fonte: `spec:207-235`.
>
> **Por que conta 67 e não 222 (Regra #10 — rastreabilidade documentada no código):** o seed
> anterior 222 é **estruturalmente inelegível** no dev3 — `rating='P'` (excluído pelo
> `NOT IN ('P','C','D')` do sweep) E ambos os cartões `is_deleted=true` (falha o JOIN
> `cc.is_deleted IS NOT TRUE`) → nunca seria selecionado independentemente do aging. Conta 67:
> ACTIVE, `rating NULL`, CC não-deletado → satisfaz o JOIN + filtro de rating. Fonte: `spec:209-214`.

```gherkin
Dado que a conta 67 está ACTIVE, com rating NULL e um CC não-deletado em arquivo (setup autorizado Exceção 3)
E a delinquência e a data do último pagamento da conta 67 foram envelhecidas para 110 dias atrás
Quando a SQL de seleção viva do delinquencyRerunCCPaymentsSweep é executada
Então a conta 67 aparece entre as linhas selecionadas pelo sweep
E ao disparar delinquencyRerunCCPaymentsSweep, uma nova linha uown_sweep_logs para delinquencyRerunCCPaymentsSweep aparece com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE delinquency_as_of_date=CURRENT_DATE-110, last_payment_date=CURRENT_DATE-110 WHERE account_pk=67` | `spec:217-220` |
| Elegibilidade (gate primário) | `sweepSelectsAccount(db, 'delinquencyRerunCCPaymentsSweep', '67')` truthy | `spec:225-227` |
| Mecanismo `sweep_log` | contrato base | `spec:231-232` |
| Processamento de contas | `[OBSERVAÇÃO]` — `processed` logado; quando `> 0` = contas reprocessadas (desfecho real, observado 16 no dev3). **Não asserido `>= 1`** (escrita assíncrona) | `spec:232-234` |

---

## CT-S5 — IdempotentCCSweep → seleciona + roda em SALE de gateway-timeout

> Conta **223**. **Mutação DB autorizada (Exceção 3):** INSERT de uma transação `status='ERROR'`,
> `cc_action='SALE'`, `cc_transaction_type='SCHEDULED'`, `posting_date=CURRENT_DATE`,
> `vendor='CHANNEL_PAYMENTS_CC'`, `gateway_response='Request timeout occurred'` (casa `ILIKE '%timeout%'`).
> Idempotente. Fonte: `spec:247-264`. Alinha com o serviço canônico **CC Idempotent (CC Timeout
> Retry)** — `05-pagamentos.md:270-290`: retenta transações que deram timeout (sem resposta do
> gateway) garantindo idempotência (não cobra duas vezes); disparo
> `POST /uown/svc/triggerScheduledTask/IdempotentCCSweep`.

```gherkin
Dado que existe uma transação de CC SALE de hoje com vendor CHANNEL_PAYMENTS_CC e gateway_response de timeout para a conta 223 (setup autorizado Exceção 3)
Quando a SQL de seleção viva do IdempotentCCSweep é executada
Então a conta 223 aparece entre as linhas selecionadas pelo sweep
E ao disparar IdempotentCCSweep, uma nova linha uown_sweep_logs para IdempotentCCSweep aparece com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | INSERT ERROR/SALE/SCHEDULED (`posting_date=CURRENT_DATE`, `vendor='CHANNEL_PAYMENTS_CC'`, `gateway_response='Request timeout occurred'`) idempotente | `spec:248-262` |
| Elegibilidade (gate primário) | `sweepSelectsAccount(db, 'IdempotentCCSweep', '223')` truthy | `spec:267-269` |
| Mecanismo `sweep_log` | contrato base | `spec:273-275` |
| Re-cobrança idempotente | `[OBSERVAÇÃO]` assíncrona — `processed` só logado; a idempotência (não cobrar duas vezes) NÃO é asserida por este spec | `spec:275`; `05-pagamentos.md:280-286` |

---

## Log de Atividade (Regra #13)

Para estes sweeps de recuperação de CC, o efeito de negócio é a re-cobrança do cartão, que é
**assíncrona** e depende de um processador vivo ausente no dev3 (exceto S4 account-level). O spec
**não** asserta uma nota textual em `uown_los_lead_notes` nem a nova transação RERUN — a evidência
de que o sweep executou é a própria linha `uown_sweep_logs` (registro de que a scheduled task
rodou) + a elegibilidade pela SQL viva. A Regra #13 é satisfeita **no nível de scheduled task**
(linha `sweep_log`), da mesma forma que os business sweeps de pagamento/transição
(`servicing-business-sweeps.md:373-381`). A nota de decisão da re-cobrança individual (nova
`uown_sv_credit_card_transaction` RERUN/RERUN_NSF, `05-pagamentos.md:62-68`) é `[OBSERVAÇÃO]`
não-gating aqui — veja [Gaps](#gaps--hypothesis).

---

## Pré-condições

- **Ambiente dev3** (`ENV=dev3`) — PKs hardcoded (contas 219–223, 67) e o `CARD_TOKEN` são
  específicos do dev3 (sandbox descartável, token capturado 2026-06-03, `spec:43-45`). Em ambiente
  compartilhado (qa1) usar `findIdleActiveAccountWithCard` + `restore*`/`deleteSyntheticRow` do
  `sweep-fixture.helpers.ts` (não usados por ESTE spec, mas do mesmo módulo `covers`).
- **Mutações DB (Exceção 3):** os 5 CTs dependem de INSERT/UPDATE autorizados pelo usuário para
  criar dados elegíveis no dev3 (`spec:30-31`). Sem essa autorização, os CTs não têm entrada
  elegível. `SELECT` (leitura da SQL viva + seleção) é sempre permitido.
- **Modo serial obrigatório** (`spec:74`) — cada CT usa uma conta dedicada (219/220/221/223/67)
  justamente para não colidir; rodar em paralelo arriscaria contenção de estado.
- **Token cobrável no cartão** — o rerun precisa de um `cc_token` válido em arquivo; as transações
  semeadas reusam o `CARD_TOKEN` MASTERCARD da conta 219 (`spec:43-45,101,144,182,259`).
- **Sem preflight de merchant** — estes sweeps operam sobre contas de Servicing existentes, não
  criam aplicações; a hierarquia de dados frescos (Regra #9) cede legitimamente ao input elegível
  semeado via mutação autorizada (padrão dos sweep specs), sem criar aplicação fresca.

---

## Gaps / [HYPOTHESIS]

- **Desfecho da re-cobrança NÃO é asserido em S1, S2, S3, S5** (não `[HYPOTHESIS]` — limitação de
  ambiente documentada): a nova transação RERUN/RERUN_NSF, a transição de status e a contagem
  `number_of_records_processed` dependem de um processador de CC vivo que o dev3 não executa
  deterministicamente para reruns transação-a-transação. Cobertura de negócio destes 4: **parcial**
  (elegibilidade-pela-SQL-viva + `sweep_log` provados; a cobrança efetiva não). O ramo de negócio
  completo (transação RERUN criada, receivable de NSF, `numberOfTries` incrementado —
  `05-pagamentos.md:62-72`) só é verificável em ambiente com processador de CC ativo (stg/prod).
  Flag para o orquestrador considerar um run em stg se a cobrança efetiva for exigida pelo PO.
- **S4 é a exceção com desfecho real** — `delinquencyRerunCCPaymentsSweep` processa contas no dev3
  (observado `processed=16`, `spec:233`), mas o valor é apenas **logado**, não asserido `>= 1`
  (escrita assíncrona; mesma disciplina do contrato base). Um cenário que asseverasse a mutação
  específica por conta processada seria trabalho de spec novo, não coberto aqui.
- **Idempotência do IdempotentCCSweep (S5) NÃO é testada** — `05-pagamentos.md:280-286` descreve a
  garantia central "não cobra duas vezes" (consulta o gateway pelo status real antes de retentar).
  ESTE spec só prova elegibilidade + mecanismo; não há cenário de dupla-execução que confirme a
  ausência de cobrança duplicada. `[HYPOTHESIS]` de que a garantia se mantém por analogia com o
  serviço canônico. Se a prova de idempotência for exigida, é spec novo.
- **Semântica das colunas de seleção (janela DOW, listas de exclusão de cartão) é `[HYPOTHESIS]`**
  onde não lida da SQL viva — o spec confia na SQL `sql_to_pick_accounts` como fonte de verdade
  (auto-validante, evita drift), mas os comentários sobre "janela DOW" (S1), "erro não na lista de
  cartão expirado" (S2) e "comment não Idempotent" (S2) refletem o entendimento do autor do spec,
  não uma extração linha-a-linha da SQL neste backfill. `appendix-d-constantes-enums.md:451-458`
  cataloga apenas os tipos de processo ACH (`SCHEDULED/RERUN/RERUN_NSF/DAILY_RERUN_DELINQUENT`) —
  **não** os enums de `uown_sv_credit_card_transaction` (`cc_action`, `cc_transaction_type`,
  `status`) usados aqui; cross-check contra a fonte de código svc antes de reusar o mapeamento em
  outro ambiente (categoria volatile — Regra #16).
- **Sem cobertura de UI** — não há tela para estes sweeps (scheduled tasks admin/ops). Se o produto
  algum dia expuser um painel de reruns de CC no Servicing, adicionar um CT de render e revisar a
  nota "sem superfície de UI" no cabeçalho (Regra #14/#18).

---

**Skills loaded:** `.claude/skills/test-scenarios/SKILL.md`

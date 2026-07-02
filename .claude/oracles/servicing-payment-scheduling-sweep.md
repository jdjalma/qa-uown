---
operation: servicing-payment-scheduling-sweep
description: Contrato de elegibilidade + mecanismo + resultado-de-negócio para os 4 sweeps (scheduled tasks) do CICLO de agendamento/envio/status/reversão de autopay do portal Servicing, disparados por `api.scheduledTask.triggerScheduledTask(name)` (POST `/uown/svc/triggerScheduledTask/{name}` → 200). Cobre o rail CC (criar+enviar carga agendada) e o rail ACH (poll de status + reversão), distinto dos RERUNs de CC (servicing-cc-rerun-sweep.md) e dos sweeps ACH create/rerun (servicing-business-sweeps.md). S1 (`getSendACHPaymentsStatusSweep`) é um UPDATE puro sem processador → asserção DETERMINÍSTICA da transição de status. S2/S3/S4 (`SendCreditCardPaymentsSweep`, `reverseAchPaymentsSweep`, `CreateScheduledCreditCardPaymentsSweep`) exigem conector CC/ACH ausente no dev3 → a evidência determinística é dupla: (1) ELEGIBILIDADE pela SQL EXATA de seleção lida ao vivo de `uown_scheduled_task.sql_to_pick_accounts` e (2) MECANISMO (nova linha `uown_sweep_logs`); o desfecho real (PICKED_TO_SEND / REVERSED / nova carga CC) é `[OBSERVAÇÃO]`. SEM superfície de UI — scheduled tasks admin/ops (Regra #14 exceção a); observabilidade é a persistência no DB (Regra #14 exceção c). Cobre S1..S4 no arquivo `payment-scheduling-sweeps-servicing.spec.ts`.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/payment-scheduling-sweeps-servicing.spec.ts
  - src/helpers/sweep-fixture.helpers.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/11-administracao.md
  - docs/business-rules/05-pagamentos.md
  - docs/business-rules/appendix-b-endpoints.md
---

# Oracle BDD — Payment Scheduling Sweeps (Servicing) — 4 scheduled tasks

> **Natureza (UI/API/DB): API-trigger + DB-assert. NÃO há superfície de UI.**
> Estes 4 sweeps são scheduled tasks (Quartz) administrativas/ops disparadas por
> `POST /uown/svc/triggerScheduledTask/{taskName}` (`scheduled-task.client.ts:24-25`).
> A Regra #14 exceção (a) — endpoint admin/ops sem UI exposta — **isenta estes sweeps do
> UI-first**; a Regra #14 exceção (c) — validação DB cross-cutting — cobre a asserção do
> efeito. **Decisão explícita do usuário (2026-07-02): a isenção de UI-first NÃO isenta da
> Regra #19** — todo sweep nomeado exige um oracle registrado. Por isso este oracle é o
> contrato **elegibilidade + mecanismo + resultado-de-negócio** no DB, sem passos Gherkin de
> UI. Isso é esperado e correto, não uma lacuna.
>
> **Money-adjacent (grounding preciso):** estes sweeps criam/enviam/estornam cargas de
> autopay. Todos os valores/datas semeados (carga CC de **$75.00** com `posting_date`=hoje;
> recebível movido para `CURRENT_DATE+2`) são **mutações DB autorizadas (Exceção 3)** escopadas
> a contas de teste dedicadas (219, 220) e linhas-fixtura existentes no dev3 — nunca a
> população de produção. O oracle assevera transição de status/seleção exata, não valor
> monetário derivado (a carga real depende do conector CC ausente).
>
> **Gatilho:** disparar `triggerScheduledTask(name)` para qualquer um dos 4 nomes de sweep
> abaixo, OU **rodar** `tests/e2e/servicing/payment-scheduling-sweeps-servicing.spec.ts` — rodar
> o spec É executar as operações que ele exercita (Regra #19), incluindo as mutações DB de
> setup (Exceção 3). Também dispara este oracle qualquer execução manual via MCP de um desses
> sweeps no Servicing.
>
> **Nomes de sweep cobertos (case-sensitive — confirmado no dev3, `spec:7-11,68,111,166,207`):**
> `getSendACHPaymentsStatusSweep` (S1) · `SendCreditCardPaymentsSweep` (S2) ·
> `reverseAchPaymentsSweep` (S3) · `CreateScheduledCreditCardPaymentsSweep` (S4).
>
> **SEM sobreposição com os outros oracles de sweep (verificado 2026-07-02):**
> - `servicing-business-sweeps.md` cobre os 11 business sweeps, incluindo o rail ACH
>   `CreateScheduledACHPaymentsSweep` (S5) e `rerunACHPaymentsSweep` (S6). Nenhum desses 11
>   nomes coincide com os 4 aqui.
> - `servicing-cc-rerun-sweep.md` cobre os 5 sweeps de **RERUN/RETRY** de CC
>   (`rerunCCPaymentsSweep`, `CCDailyScheduledDeniedRerun`, `dailyDelinquencyRerunCCSweep`,
>   `delinquencyRerunCCPaymentsSweep`, `IdempotentCCSweep`). Este oracle cobre o rail
>   **CREATE + SEND** de CC (S4 `CreateScheduledCreditCardPaymentsSweep`, S2
>   `SendCreditCardPaymentsSweep` — a carga principal, não um retry) + o rail ACH de **STATUS +
>   REVERSE** (S1, S3). São etapas distintas do ciclo de vida de pagamento, não reruns.
> - Ver [Sobreposição](#sobreposição-com-outros-oracles) para o mapeamento fino.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/payment-scheduling-sweeps-servicing.spec.ts \
>   src/helpers/sweep-fixture.helpers.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/11-administracao.md \
>   docs/business-rules/05-pagamentos.md \
>   docs/business-rules/appendix-b-endpoints.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (`ENV=dev3` — `spec:28,30-31`). O worker fixture `db` conecta em
> `process.env.ENV`; rodar com `ENV=dev3` para as asserções DB baterem no mesmo banco que o
> SVC API svc-dev3 dispara. Timeout 300s (`--timeout=300000`); cada teste `setTimeout(120_000)`.
> Modo **serial** (`test.describe.configure({ mode: 'serial' })`, `spec:61`).
>
> **Modelo de evidência (`spec:16-23`):**
> - **S1 é DETERMINÍSTICO** — `getSendACHPaymentsStatusSweep` é um UPDATE puro de DB SEM
>   dependência de processador; a transição da linha semeada (`SENT`+`ReadyToProcess` →
>   `STATUS_UPDATE_PENDING`) é asseverada diretamente.
> - **S2/S3/S4 tentam uma ação real de processador CC/ACH** (send / reverse / charge). O dev3
>   NÃO tem processador vivo para essas ações → a ação não completa (`processed=0`). O gate
>   determinístico é (1) ELEGIBILIDADE pela SQL EXATA de seleção do sweep (lida ao vivo de
>   `uown_scheduled_task.sql_to_pick_accounts`) e (2) MECANISMO (nova linha `uown_sweep_logs`).
>   A mudança de status real / a nova linha é reportada como `[OBSERVAÇÃO]`, NUNCA como bug
>   (Regra #10).

---

## Mecanismo comum a TODOS os sweeps (S1..S4) — contrato base

> Cada sweep é disparado pelo helper compartilhado `triggerAndWaitSweepLog(api, db, name, prevPk)`
> (`sweep-fixture.helpers.ts:99-120`). O contrato mecânico é idêntico para os 4:

```gherkin
Dado que o baseline MAX(pk) de uown_sweep_logs para o sweep é capturado antes do disparo
Quando o sweep é disparado via triggerScheduledTask(name)
Então a resposta HTTP é 200
E uma NOVA linha aparece em uown_sweep_logs com sweep_name = name e pk > baseline em até 30s
```

### Oracle (mecanismo — todos os sweeps)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP do trigger | `resp.status === 200` (propriedade, NÃO método — nunca `resp.status()`) | `sweep-fixture.helpers.ts:105-106` |
| Endpoint disparado | `POST /uown/svc/triggerScheduledTask/{taskName}` | `scheduled-task.client.ts:24-25` |
| Nova linha em `uown_sweep_logs` | `db.waitForRecord('uown_sweep_logs', 'sweep_name = $1 AND pk > $2', [name, prevPk], 30_000)` truthy | `sweep-fixture.helpers.ts:107-113` |
| Baseline | `sweepLogBaseline(db, name)` = `COALESCE(MAX(pk),0)` de `uown_sweep_logs WHERE sweep_name=$1` | `sweep-fixture.helpers.ts:47-52` |
| Contagem `number_of_records_processed` | **NUNCA asserida `>= 1`** — escrita de forma assíncrona APÓS o processamento; ler logo após o trigger pode retornar 0 mesmo com linhas tocadas (dev3 sem processador retorna 0 em S2/S3/S4 legitimamente) | `sweep-fixture.helpers.ts:95-98,114-119`; `spec:19-23` |

> **Por que a contagem não é o oráculo (Regra #10):** em S1 a evidência primária é a **transição
> da linha de negócio** (`uown_send_sv_ach_payment.status`); em S2/S3/S4 é a **elegibilidade pela
> SQL exata** + a linha `uown_sweep_logs`. A contagem de `sweep_log` é apenas prova de que o
> sweep executou, não de quantos registros tocou.

---

## Elegibilidade via SQL viva — contrato base (S2, S3, S4)

> S2/S3/S4 provam a seleção com o helper local `sweepSelects(db, sweepName, value)`
> (`spec:42-56`): lê a coluna `sql_to_pick_accounts` de `uown_scheduled_task` para o sweep,
> executa essa SQL EXATA ao vivo e confirma que `value` aparece em alguma linha selecionada.
> Isso vincula a asserção ao critério de seleção REAL do produto (não a uma cópia reescrita da
> SQL no teste — se o produto mudar a SQL, a asserção acompanha).

```gherkin
Dado que a conta de teste foi semeada no estado exigido pelo sweep (setup autorizado Exceção 3)
Quando a SQL viva de seleção do sweep (uown_scheduled_task.sql_to_pick_accounts) é executada
Então a conta de teste aparece entre as linhas selecionadas pela SQL do sweep
```

### Oracle (elegibilidade — S2/S3/S4)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| SQL de seleção lida ao vivo | `SELECT sql_to_pick_accounts FROM uown_scheduled_task WHERE scheduled_task_name = $1` retorna SQL não-vazia | `spec:48-53` |
| Conta selecionada | executar a SQL viva e `selected.some(r => Object.values(r).map(String).includes(value))` === `true` | `spec:54-55` |

---

## CT-S1 — getSendACHPaymentsStatusSweep → promove SENT+ReadyToProcess → STATUS_UPDATE_PENDING

> **DETERMINÍSTICO — o CT mais forte deste spec.** UPDATE puro de DB, SEM processador:
> `UPDATE uown_send_sv_ach_payment SET status='STATUS_UPDATE_PENDING' WHERE status='SENT' AND
> vendor_achstatus='ReadyToProcess'` (`spec:64-66`). **Mutação DB autorizada (Exceção 3):** força
> a linha `send_sv_ach_payment` mais recente para o estado elegível (`SENT`+`ReadyToProcess`).
> Catálogo: 34.10 (`11-administracao.md:208-213`) — cron `0 0 16 ? * MON-FRI`, consulta status de
> ACH enviados. `05-pagamentos.md:508` — a cada 6 min, polls Profituity.

```gherkin
Dado que a linha send_sv_ach_payment mais recente foi forçada para status=SENT e vendor_achstatus=ReadyToProcess (setup autorizado Exceção 3)
Quando getSendACHPaymentsStatusSweep é disparado
Então a linha de sweep_log é criada
E essa linha send_sv_ach_payment transiciona para status=STATUS_UPDATE_PENDING
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `targetPk === 0` (sem linhas `uown_send_sv_ach_payment` no dev3) | `spec:74-78` |
| Setup autorizado | `UPDATE uown_send_sv_ach_payment SET status='SENT', vendor_achstatus='ReadyToProcess' WHERE pk=$1` na linha de maior pk | `spec:79-83` |
| Mecanismo `sweep_log` | contrato base acima | `spec:86-91` |
| Transição de status (gating determinístico) | `db.waitForRecord('uown_send_sv_ach_payment', "pk = $1 AND status = 'STATUS_UPDATE_PENDING'", [targetPk], 30_000)` truthy | `spec:93-102` |

```sql
-- Validação DB CT-S1 (substituir $pk) — projeção read-only
SELECT pk, status, vendor_achstatus
  FROM uown_send_sv_ach_payment
 WHERE pk = $pk;
-- Esperado após o sweep: status = 'STATUS_UPDATE_PENDING'
```

> **Por que S1 é determinístico e S2/S3/S4 não:** S1 não chama processador externo — o sweep
> promove o status internamente. S2 (send), S3 (reverse) e S4 (create charge) precisam do
> conector CC/ACH que o dev3 não executa → o desfecho é `[OBSERVAÇÃO]` e o gate recai sobre
> elegibilidade+mecanismo. Fonte: `spec:16-23`.

---

## CT-S2 — SendCreditCardPaymentsSweep → seleciona carga CC PENDING vencida (conta 219)

> **Mutação DB autorizada (Exceção 3):** conta 219 = ACTIVE, `rating=NULL`, autopay CC, com um
> recebível `REGULAR_PAYMENT` UNPAID ACTIVE (o `nextreceivable` exigido). Semeia uma
> `uown_sv_credit_card_transaction` PENDING de **$75.00** com `posting_date=CURRENT_DATE` e
> `comment='pay-sched-s2'` (idempotente entre runs via o marcador). O sweep seleciona CC PENDING
> (`posting <= hoje`) em contas autopay ATIVAS com next receivable e as envia (→ PICKED_TO_SEND).
> Envio exige o conector CC (ausente no dev3) → **selection + mechanism são o gate**. Catálogo:
> 34.1 (`11-administracao.md:139-145`) — carga principal de CC do dia.

```gherkin
Dado que a conta 219 é autopay CC ativa com uma carga CC PENDING de $75.00 postando hoje (setup autorizado Exceção 3)
Quando a SQL viva de seleção do SendCreditCardPaymentsSweep é executada
Então a conta 219 aparece entre as linhas selecionadas
E ao disparar SendCreditCardPaymentsSweep, uma nova linha uown_sweep_logs aparece com pk > baseline
E a transição da carga para PICKED_TO_SEND é observada como [OBSERVAÇÃO] não-gating (conector CC ausente no dev3)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado (conta autopay CC) | `UPDATE uown_sv_account SET auto_pay_types='CC', rating=NULL WHERE pk=219` | `spec:119` |
| Setup autorizado (carga PENDING semeada) | INSERT/reuso de `uown_sv_credit_card_transaction` (`status='PENDING'`, `cc_action='SALE'`, `posting_date=CURRENT_DATE`, `amount=75.00`, `comment='pay-sched-s2'`); `expect(txPk).toBeGreaterThan(0)` | `spec:120-139` |
| Elegibilidade (gate primário) | `sweepSelects(db, 'SendCreditCardPaymentsSweep', '219')` truthy | `spec:142-146` |
| Mecanismo `sweep_log` | contrato base | `spec:148-151` |
| Transição PICKED_TO_SEND | `[OBSERVAÇÃO]` não-gating — `COUNT(*) WHERE pk=$txPk AND status='PICKED_TO_SEND'`; só loga (conector CC não roda no dev3) | `spec:152-157` |

---

## CT-S3 — reverseAchPaymentsSweep → seleciona ACH RETURNED em pagamento PAID

> **Mutação DB autorizada (Exceção 3):** localiza um ACH ligado a um `uown_sv_payment` PAID e o
> força para `status='RETURNED'`, `row_updated_timestamp=NOW()` (para cair na janela today/yesterday
> do sweep). O sweep seleciona contas cujo ACH (não SENT/SETTLED) num pagamento PAID foi atualizado
> hoje/ontem e os reverte. Reverso exige o processador ACH (ausente no dev3) → **selection +
> mechanism são o gate**. Catálogo: 34.13 (`11-administracao.md:228-233`) — cron `0 30 21 * * ?`,
> ACH → REVERSED, alocações desfeitas.

```gherkin
Dado que um ACH ligado a um pagamento PAID foi forçado para status=RETURNED e atualizado agora (setup autorizado Exceção 3)
Quando a SQL viva de seleção do reverseAchPaymentsSweep é executada
Então a conta desse ACH aparece entre as linhas selecionadas
E ao disparar reverseAchPaymentsSweep, uma nova linha uown_sweep_logs aparece com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `achPk === 0` (sem ACH ligado a pagamento PAID no dev3) | `spec:173-180` |
| Setup autorizado | `UPDATE uown_sv_achpayment SET status='RETURNED', row_updated_timestamp=NOW() WHERE pk=$1` no ACH ligado ao pagamento PAID de maior pk | `spec:181-185` |
| Elegibilidade (gate primário) | `sweepSelects(db, 'reverseAchPaymentsSweep', achAccountPk)` truthy | `spec:188-192` |
| Mecanismo `sweep_log` | contrato base | `spec:194-198` |
| Transição REVERSED / alocação desfeita | `[OBSERVAÇÃO]` não-gating — reverse precisa do processador ACH (não roda no dev3); só selection+mechanism são o gate | `spec:194-198`; `11-administracao.md:233` |

---

## CT-S4 — CreateScheduledCreditCardPaymentsSweep → seleciona conta autopay vencendo em +2 dias (conta 220)

> **Mutação DB autorizada (Exceção 3):** conta 220 = autopay CC-only (`auto_pay_types='CC'`,
> `rating=NULL`), sem delinquência (`delinquency_as_of_date=NULL`), com o primeiro recebível
> `REGULAR_PAYMENT` UNPAID ACTIVE movido para `due_date=CURRENT_DATE+2`, e cargas CC/ACH in-flight
> (`PENDING`/`FUTURE_PENDING`/`PICKED_TO_SEND`/`STATUS_UPDATE_PENDING`) canceladas para desbloquear
> o guard "sem cargas em voo". O sweep cria uma carga CC para conta autopay CC-only cujo recebível
> vence em +2 dias. Criação exige o conector CC (ausente no dev3) → **selection + mechanism são o
> gate**. Catálogo: 34.16 (`11-administracao.md:253-258`) — cron `0 0 10 ? * MON-FRI`, cria
> registros de CC agendado.

```gherkin
Dado que a conta 220 é autopay CC-only sem delinquência, com um recebível vencendo em +2 dias e nenhuma carga em voo (setup autorizado Exceção 3)
Quando a SQL viva de seleção do CreateScheduledCreditCardPaymentsSweep é executada
Então a conta 220 aparece entre as linhas selecionadas
E ao disparar CreateScheduledCreditCardPaymentsSweep, uma nova linha uown_sweep_logs aparece com pk > baseline
E a criação de uma nova carga CC agendada é observada como [OBSERVAÇÃO] não-gating (conector CC ausente no dev3)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado (autopay CC-only) | `UPDATE uown_sv_account SET auto_pay_types='CC', rating=NULL WHERE pk=220` | `spec:212` |
| Setup autorizado (sem delinquência) | `UPDATE uown_sv_sched_summary SET delinquency_as_of_date=NULL WHERE account_pk=220` | `spec:213` |
| Setup autorizado (recebível +2 dias) | `UPDATE uown_sv_receivable SET due_date=CURRENT_DATE+2` no 1º `REGULAR_PAYMENT`/`UNPAID`/`ACTIVE`; `expect(moved).toBe(1)` | `spec:214-223` |
| Setup autorizado (limpa cargas em voo) | `UPDATE ... credit_card_transaction`/`achpayment` para `CANCELLED` nos status pendentes da conta 220 | `spec:224-234` |
| Elegibilidade (gate primário) | `sweepSelects(db, 'CreateScheduledCreditCardPaymentsSweep', '220')` truthy | `spec:239-247` |
| Mecanismo `sweep_log` | contrato base | `spec:249-252` |
| Nova carga CC criada | `[OBSERVAÇÃO]` não-gating — `COUNT(*) WHERE account_pk=220 AND pk>prevCcPk`; só loga (conector CC não roda no dev3) | `spec:238-257` |

---

## Log de Atividade (Regra #13)

Para sweeps de pagamento/transição, a **própria tabela de negócio** É o log da ação — não há
nota textual separada em `uown_los_lead_notes`:
- **S1** — a transição `uown_send_sv_ach_payment.status → STATUS_UPDATE_PENDING` é o registro da
  ação (asseverada como gating).
- **S2/S3/S4** — a linha `uown_sweep_logs` é o registro de que o sweep executou (Regra #13
  satisfeita no nível de scheduled task); a mutação de negócio (PICKED_TO_SEND / REVERSED / nova
  carga) fica `[OBSERVAÇÃO]` porque o conector CC/ACH não roda no dev3. Nenhum log textual de
  atividade adicional é exigido — a evidência é a linha de `uown_sweep_logs` + a elegibilidade
  pela SQL viva.

---

## Sobreposição com outros oracles

| Sweep (este oracle) | Rail / etapa do ciclo | Coberto em outro lugar? |
|---|---|---|
| `getSendACHPaymentsStatusSweep` (S1) | ACH — poll de status de envio (34.10) | **NÃO** — `servicing-business-sweeps.md` cobre create (`CreateScheduledACHPaymentsSweep`) e rerun (`rerunACHPaymentsSweep`), não o status-poll. Fresh. |
| `SendCreditCardPaymentsSweep` (S2) | CC — envio da carga principal (34.1) | **NÃO** — `servicing-cc-rerun-sweep.md` cobre 5 RERUNs de CC, não a carga principal de envio. Fresh. |
| `reverseAchPaymentsSweep` (S3) | ACH — reversão (34.13) | **NÃO** — nenhum oracle cobre reversão ACH. Fresh. |
| `CreateScheduledCreditCardPaymentsSweep` (S4) | CC — criação da carga agendada (34.16) | **NÃO** — `servicing-cc-rerun-sweep.md` cobre reruns; `servicing-business-sweeps.md` cobre o análogo ACH (`CreateScheduledACHPaymentsSweep`), não o CC. Fresh. |

**Conclusão:** os 4 sweeps são etapas distintas do ciclo de vida de pagamento (agendar CC →
enviar CC → poll status ACH → reverter ACH), sem sobreposição de NOME com os 11 business sweeps
(`servicing-business-sweeps.md`) nem com os 5 CC reruns (`servicing-cc-rerun-sweep.md`). O par
CC (S2/S4) complementa os reruns cobrindo o caminho create+send (não retry); o par ACH (S1/S3)
complementa o create/rerun ACH cobrindo status-poll+reverse.

---

## Pré-condições

- **Ambiente dev3** (`ENV=dev3`) — PKs hardcoded (contas 219, 220) e o `CARD_TOKEN`
  (`545f5afc-1e51-4960-99a5-5fd173cefbe0`, `spec:38`) são específicos do dev3 (sandbox
  descartável). Em ambiente compartilhado (qa1), usar as funções de descoberta dinâmica de
  `sweep-fixture.helpers.ts` (`findIdleActiveAccount*`) + os helpers `restore*` no teardown —
  **NÃO** usadas por ESTE spec (só `sweepLogBaseline`/`triggerAndWaitSweepLog` são importados
  aqui), mas parte do mesmo módulo `covers`.
- **Mutações DB (Exceção 3):** os 4 CTs dependem de INSERT/UPDATE autorizados pelo usuário para
  criar dados elegíveis no dev3. Sem essa autorização, S1/S3 pulam (guard `test.skip`) e S2/S4
  não têm entrada elegível. `SELECT` (leitura da SQL viva) é sempre permitido.
- **Modo serial obrigatório** (`spec:61`) — S2 usa a conta 219 e S4 a conta 220 (contas
  distintas para não colidir); rodar em paralelo quebraria as asserções de estado. S3 opera
  sobre um ACH descoberto dinamicamente (não uma conta hardcoded).
- **Sem preflight de merchant** — estes sweeps operam sobre contas ATIVAS existentes, não criam
  aplicações; a hierarquia de dados frescos (Regra #9) cede legitimamente ao input elegível
  existente + mutação autorizada, sem criar aplicação fresca (documentado `spec:25-27`).
- **Conector CC/ACH ausente no dev3** — S2/S3/S4 não completam a ação de processador; isso é
  comportamento de ambiente documentado, NÃO uma lacuna do teste (`spec:19-23`).

---

## Gaps / [HYPOTHESIS] / cobertura fina

- **S2/S3/S4 têm o desfecho de negócio final como `[OBSERVAÇÃO]` não-gating** (transição
  PICKED_TO_SEND / REVERSED / criação de nova carga CC) por dependerem do conector CC/ACH ausente
  no dev3. O gate real é **elegibilidade-pela-SQL-viva + `sweep_log`**, não a mutação observada.
  Cobertura do desfecho de negócio destes três: **parcial** — a seleção correta é provada, o
  efeito de cobrança/reversão real só é verificável em stg/prod (ou num env com processador CC/ACH).
  Flag para o orquestrador considerar um run em stg se o desfecho de cobrança precisar ser asserido.
- **S1 tem cobertura de negócio forte** — a transição `SENT+ReadyToProcess → STATUS_UPDATE_PENDING`
  é asseverada diretamente (UPDATE puro sem processador). É o CT mais determinístico dos 4.
- **Discrepância nome-do-sweep vs manual endpoint no catálogo (`[HYPOTHESIS]`, não gating):** o
  spec dispara todos os 4 via `triggerScheduledTask/{name}` (`scheduled-task.client.ts:24-25`),
  mas o catálogo `11-administracao.md` lista alguns endpoints manuais dedicados alternativos
  (S2 `POST /uown/svc/sendCCPaymentsSweep` — 34.1:143; S3 `POST /uown/svc/reverseAchPaymentsSweep`
  — 34.13:232; S4 `POST /uown/svc/createScheduledCCPaymentsSweep` — 34.16:257). Ambas as vias
  disparam o mesmo Quartz job; o spec usa a via genérica `triggerScheduledTask`, que é a asseverada
  aqui. Não cruzado com o código svc neste backfill — cross-check antes de reusar a via dedicada.
- **Nome do sweep vs tabela do catálogo (`[HYPOTHESIS]`):** o catálogo 34.1 cita a tabela
  `uown_sv_cctransaction`, enquanto o spec usa `uown_sv_credit_card_transaction`. A SQL viva de
  seleção (lida de `uown_scheduled_task`) é a fonte autoritativa em runtime — a asserção de
  elegibilidade não depende do nome da tabela hardcoded, então a divergência de nomenclatura no
  catálogo não afeta o gate. Cross-check em `appendix-c-tabelas-banco.md` antes de reusar o nome.
- **Sem cobertura de UI** — se o produto expuser o status dessas cargas em alguma tela do
  Servicing (ex.: aba Payments/Activity da conta), adicionar um CT de render e revisar a nota
  "sem superfície de UI" no cabeçalho (Regras #14/#18).

---

**Skills loaded:** `.claude/skills/test-scenarios/SKILL.md`

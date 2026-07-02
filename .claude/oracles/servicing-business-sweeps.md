---
operation: servicing-business-sweeps
description: Contrato de mecanismo + resultado-de-negócio para os 11 sweeps (scheduled tasks) de negócio do portal Servicing, disparados por `api.scheduledTask.triggerScheduledTask(name)` (POST `/uown/svc/triggerScheduledTask/{name}` → 200). Cada sweep grava uma linha em `uown_sweep_logs` (mecanismo comum) e produz um efeito de negócio específico (linha em `uown_email_queue` / `uown_sv_achpayment`, transição de `uown_sv_account`/`uown_los_lead`/`uown_los_contract`). SEM superfície de UI — scheduled tasks admin/ops (Regra #14 exceção a); observabilidade é a persistência no DB (Regra #14 exceção c). Cobre S1..S11 no arquivo `business-sweeps-servicing.spec.ts`.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/business-sweeps-servicing.spec.ts
  - src/helpers/sweep-fixture.helpers.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/11-administracao.md
  - docs/business-rules/appendix-b-endpoints.md
  - docs/business-rules/appendix-d-constantes-enums.md
---

# Oracle BDD — Business Sweeps (Servicing) — 11 scheduled tasks

> **Natureza (UI/API/DB): API-trigger + DB-assert. NÃO há superfície de UI.**
> Estes 11 sweeps são scheduled tasks (Quartz) administrativas/ops disparadas por
> `POST /uown/svc/triggerScheduledTask/{taskName}` (`scheduled-task.client.ts:24-25`).
> A Regra #14 exceção (a) — endpoint admin/ops sem UI exposta — **isenta estes sweeps do
> UI-first**; a Regra #14 exceção (c) — validação DB cross-cutting — cobre a asserção do
> efeito. **Decisão explícita do usuário (2026-07-02): a isenção de UI-first NÃO isenta da
> Regra #19** — todo sweep nomeado exige um oracle registrado. Por isso este oracle é o
> contrato **mecanismo + resultado-de-negócio** no DB, sem passos Gherkin de UI. Isso é
> esperado e correto, não uma lacuna.
>
> **Gatilho:** disparar `triggerScheduledTask(name)` para qualquer um dos 11 nomes de sweep
> abaixo, OU **rodar** `tests/e2e/servicing/business-sweeps-servicing.spec.ts` — rodar o spec
> É executar as operações que ele exercita (Regra #19). Também dispara este oracle qualquer
> execução manual via MCP de um desses sweeps no Servicing.
>
> **Nomes de sweep cobertos (case-sensitive — confirmado no dev3, `spec:52-65`):**
> `latePaymentNoticeEmailSweep` · `customerPortalReminderSweep` · `delinquencyOfferEmailSweep` ·
> `delinquencyReminderEmailSweep` · `CreateScheduledACHPaymentsSweep` · `rerunACHPaymentsSweep` ·
> `checkLeadExpirationSweep` · `UnutilizedApprovalSweep` · `paidOutAccountsSweep` ·
> `paidInFullAccountEmailSweep` · `eSignDocumentStatusSweep`.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/business-sweeps-servicing.spec.ts \
>   src/helpers/sweep-fixture.helpers.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/11-administracao.md \
>   docs/business-rules/appendix-b-endpoints.md \
>   docs/business-rules/appendix-d-constantes-enums.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (`ENV=dev3` — `spec:36-39`). O worker fixture `db` conecta em
> `process.env.ENV`; rodar com `ENV=dev3` para as asserções DB baterem no mesmo banco que o
> SVC API svc-dev3 dispara. Timeout 300s (`--timeout=300000`); cada teste `setTimeout(120_000)`.
> Modo **serial** (`test.describe.configure({ mode: 'serial' })`, `spec:81`).
>
> **Grupos (`spec:83-345`):**
> - **GROUP A** — sweeps de email com dados elegíveis reais no dev3 (S1, S2, S3, S4).
> - **GROUP B** — sweep de pagamento (S5).
> - **GROUP C** — testes reais via mutações DB autorizadas (Exceção 3, autorização do usuário)
>   para criar dados elegíveis (S6..S11).

---

## Mecanismo comum a TODOS os sweeps (S1..S11) — contrato base

> Cada sweep é disparado pelo helper compartilhado `triggerAndWaitSweepLog(api, db, name, prevPk)`
> (`sweep-fixture.helpers.ts:99-120`). O contrato mecânico é idêntico para os 11:

```gherkin
Dado que o baseline MAX(pk) de uown_sweep_logs para o sweep é capturado antes do disparo
Quando o sweep é disparado via triggerScheduledTask(name)
Então a resposta HTTP é 200
E uma NOVA linha aparece em uown_sweep_logs com sweep_name = name e pk > baseline em até 30s
```

### Oracle (mecanismo — todos os sweeps)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP do trigger | `resp.status === 200` (propriedade, NÃO método — nunca `resp.status()`) | `sweep-fixture.helpers.ts:105-106`; `spec:33-34` |
| Endpoint disparado | `POST /uown/svc/triggerScheduledTask/{taskName}` | `scheduled-task.client.ts:24-25` |
| Nova linha em `uown_sweep_logs` | `db.waitForRecord('uown_sweep_logs', 'sweep_name = $1 AND pk > $2', [name, prevPk], 30_000)` truthy | `sweep-fixture.helpers.ts:107-113` |
| Baseline | `sweepLogBaseline(db, name)` = `COALESCE(MAX(pk),0)` de `uown_sweep_logs WHERE sweep_name=$1` | `sweep-fixture.helpers.ts:47-52` |
| Contagem `number_of_records_processed` | **NUNCA asserida `>= 1`** — é escrita de forma assíncrona APÓS o processamento; ler logo após o trigger pode retornar 0 mesmo com linhas processadas (confirmado 2026-06-02) | `spec:30-34,106-107`; `sweep-fixture.helpers.ts:95-98,114-119` |

> **Por que a contagem não é o oráculo (Regra #10):** a evidência primária de cada sweep é a
> **linha da tabela de negócio** (email_queue / achpayment / transição de status), com filtro
> de PK monotônico `pk > baseline` (TZ-agnóstico, evita drift de timestamp). A contagem de
> `sweep_log` é apenas prova de que o sweep executou, não de quantos registros tocou.

---

## CT-S1 — latePaymentNoticeEmailSweep → enfileira `DaysPastDueMonthlyEmail`

> GROUP A. 35 contas elegíveis; o SQL do sweep NÃO tem restrição de DOW (só cron).
> **Atenção ao template real:** o sweep grava `DaysPastDueMonthlyEmail` (NÃO `LatePaymentNoticeEmail`)
> — confirmado 2026-06-02 (`spec:53-54`). As asserções usam `SWEEP.latePayment.template = 'DaysPastDueMonthlyEmail'`.

```gherkin
Dado que o baseline MAX(pk) de uown_email_queue para o template DaysPastDueMonthlyEmail é capturado
Quando latePaymentNoticeEmailSweep é disparado
Então uma nova linha DaysPastDueMonthlyEmail aparece em uown_email_queue com pk > baseline
E a linha carrega um account_pk (a conta para a qual o aviso foi enfileirado)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo `sweep_log` | contrato base acima | `spec:103-108` |
| Email enfileirado (evidência primária) | `db.waitForRecord('uown_email_queue', "template_name = $1 AND pk > $2", ['DaysPastDueMonthlyEmail', prevEmailPk], 60_000)` truthy | `spec:114-120` |
| Conta alvo capturada | `SELECT account_pk ... ORDER BY pk DESC LIMIT 1` retorna account_pk não-vazio | `spec:121-127` |
| `correspondence_log` (Regra #13) | **informacional, NÃO-gating**: o sweep pode NÃO escrever em `uown_correspondence_logs` para `DaysPastDueMonthlyEmail` (confirmado 2026-06-02: email_queue criado, correspondence_log = 0). Só loga a contagem | `spec:130-140` |

---

## CT-S2 — customerPortalReminderSweep → valida via linhas de hoje (`CustomerPortalReminderEmail`)

> GROUP A. 14 já processadas hoje. O dedup same-day do Java impede uma linha NOVA no re-trigger,
> então o mecanismo é validado por linhas existentes do dia + `sweep_log` + `correspondence_log`.
> `test.skip` se não houver linhas nos últimos 2 dias (cron não rodou ou sem elegíveis).

```gherkin
Dado que existem linhas CustomerPortalReminderEmail em uown_email_queue nos últimos 2 dias (evidência do cron)
Quando customerPortalReminderSweep é disparado
Então a linha de sweep_log é criada (processed=0 esperado — dedup same-day)
E linhas CustomerPortalReminderEmail existem em uown_email_queue nos últimos 2 dias
E uma linha de correspondência EMAIL para CustomerPortalReminderEmail existe nos últimos 2 dias (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de elegibilidade | `test.skip` se `COUNT(*) uown_email_queue` (2 dias) = 0 | `spec:152-162` |
| Mecanismo `sweep_log` | contrato base; `processed=0` esperado (dedup) — não asserir linha nova pós-trigger | `spec:165-172` |
| Email do dia presente | `db.waitForRecord('uown_email_queue', "template_name=$1 AND row_created_timestamp >= NOW() - INTERVAL '2 days'", ['CustomerPortalReminderEmail'], 15_000)` truthy | `spec:175-183` |
| `correspondence_log` (Regra #13) | `db.waitForRecord('uown_correspondence_logs', "correspondence_type='EMAIL' AND template_name=$1 AND row_created_timestamp >= NOW() - INTERVAL '2 days'", [...], 15_000)` truthy — **gating** aqui | `spec:186-194` |

---

## CT-S3 — delinquencyOfferEmailSweep → mecanismo (mechanism-only no dev3)

> GROUP A. DOW=5 (sexta) no SQL. JOIN em `uown_accounts_to_be_sold`, **tabela AUSENTE no dev3**
> (existe em stg/prod — confirmado 2026-06-03) → 0 contas selecionadas no dev3 independente do DOW.
> **Mechanism-only no dev3** (comportamento de ambiente documentado, NÃO lacuna): a linha de
> `sweep_log` existe mas a coluna `error` pode carregar a falha de provisioning; classificamos
> o erro honestamente em vez de passar na existência da linha crua.

```gherkin
Dado que o baseline MAX(pk) de uown_email_queue para DelinquencyOfferEmail é capturado
Quando delinquencyOfferEmailSweep é disparado
Então a linha de sweep_log é criada
E o erro do sweep é classificado: se 'provisioning' (uown_accounts_to_be_sold ausente) o cenário é pulado, NÃO falha
E o erro NÃO é 'product' (uma exceção genuína de código faria o cenário falhar alto)
E o enfileiramento de DelinquencyOfferEmail é documentado como [OBSERVAÇÃO] não-gating (gate DOW=5 sexta)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo `sweep_log` | contrato base | `spec:214-217` |
| Classificação do erro | `classifySweepError(getSweepError(...))` — `provisioning` (relation/column não existe) → `test.skip`; `environment` → tolerado; `product` → **falha alto** | `spec:222-231`; `sweep-fixture.helpers.ts:85-92` |
| Guard `provisioning` (dev3) | `test.skip` com motivo: `uown_accounts_to_be_sold` ausente no dev3 → validar em stg | `spec:225-229` |
| Guard `product` | `expect(kind).not.toBe('product')` | `spec:231` |
| Email enfileirado | `[OBSERVAÇÃO]` não-gating — só loga contagem de `pk > baseline` | `spec:234-240` |

---

## CT-S4 — delinquencyReminderEmailSweep → mecanismo (mechanism-only no dev3)

> GROUP A. DOW=3 (quarta) no SQL. Mesmo gap de provisioning do S3: JOIN em
> `uown_accounts_to_be_sold` (ausente no dev3) → 0 contas mesmo na quarta. **Mechanism-only no dev3.**
> Estrutura idêntica ao CT-S3 (template `DelinquencyReminderEmail`).

```gherkin
Dado que o baseline MAX(pk) de uown_email_queue para DelinquencyReminderEmail é capturado
Quando delinquencyReminderEmailSweep é disparado
Então a linha de sweep_log é criada
E o erro é classificado: 'provisioning' → skip; nunca 'product'
E o enfileiramento de DelinquencyReminderEmail é documentado como [OBSERVAÇÃO] não-gating (gate DOW=3 quarta)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo `sweep_log` | contrato base | `spec:259-262` |
| Classificação do erro | `provisioning` → `test.skip`; `expect(kind).not.toBe('product')` | `spec:264-272`; `sweep-fixture.helpers.ts:85-92` |
| Email enfileirado | `[OBSERVAÇÃO]` não-gating — só loga contagem | `spec:275-281` |

---

## CT-S5 — CreateScheduledACHPaymentsSweep → cria pagamentos ACH agendados

> GROUP B. 44 ACH criados hoje (cron das 19:19). Evidência = novas linhas `uown_sv_achpayment`
> (`pk > baseline`). Se o cron já criou o lote do dia e o agendamento same-day deduplica → 0
> linhas frescas → fallback: linhas nas últimas 24h provam o mecanismo (`test.skip` se 0).

```gherkin
Dado que o baseline MAX(pk) de uown_sv_achpayment é capturado
Quando CreateScheduledACHPaymentsSweep é disparado
Então há novas linhas uown_sv_achpayment com pk > baseline (evidência preferida)
E se não houver linhas frescas (dedup), há linhas de ACH agendado nas últimas 24h (prova de mecanismo)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo `sweep_log` | contrato base | `spec:307-311` |
| Linhas ACH frescas (preferida) | `COUNT(*) uown_sv_achpayment WHERE pk > baseline` > 0 → `expect(freshRows).toBeGreaterThan(0)` e retorna | `spec:316-324` |
| Fallback linhas do dia | se 0 frescas: `COUNT(*) ... row_created_timestamp >= NOW() - INTERVAL '24 hours'`; `test.skip` se 0; senão `expect(todayRows).toBeGreaterThan(0)` | `spec:325-336` |

---

## CT-S6 — rerunACHPaymentsSweep → reprocessa ACH RETURNED

> GROUP C. **Mutação DB autorizada (Exceção 3):** INSERT de linha ACH `status=RETURNED`,
> `return_code=R01`, `ach_process_type=SCHEDULED`, `number_of_tries=0`, `posting_date=CURRENT_DATE-2`
> para a conta 86 (ACTIVE, `rating=null`, sem delinquência). O sweep cria uma linha RERUN para
> cada ACH RETURNED/SCHEDULED elegível.

```gherkin
Dado que uma linha ACH RETURNED/R01/SCHEDULED foi inserida para a conta 86 (setup autorizado Exceção 3)
Quando rerunACHPaymentsSweep é disparado
Então uma nova linha uown_sv_achpayment com ach_process_type IN ('RERUN','RERUN_NSF') aparece para a conta 86 com pk > baseline
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | INSERT retorna; `insertedAchPk > 0` para conta 86 (SCHEDULED/RETURNED) | `spec:357-374` |
| Mecanismo `sweep_log` | contrato base | `spec:377-380` |
| Linha RERUN criada (evidência primária) | `db.waitForRecord('uown_sv_achpayment', "account_pk = 86 AND ach_process_type IN ('RERUN','RERUN_NSF') AND pk > $1", [prevAchPk], 60_000)` truthy | `spec:383-393` |

---

## CT-S7 — checkLeadExpirationSweep → expira leads vencidos

> GROUP C. **Mutação DB autorizada (Exceção 3):** `UPDATE uown_los_lead SET expiration_date =
> CURRENT_DATE-1 WHERE pk=1009` (lead UW_APPROVED). O sweep marca leads vencidos como EXPIRED.
> A transição EXPIRED é processada de forma assíncrona → a evidência primária é `sweep_log` +
> elegibilidade do lead; o EXPIRED em si é `[OBSERVAÇÃO]` (não gating por timing).

```gherkin
Dado que expiration_date do lead 1009 foi setado para ontem (setup autorizado Exceção 3)
Quando checkLeadExpirationSweep é disparado
Então a linha de sweep_log é criada
E o lead 1009 é elegível pelo SQL do sweep (status IN (NEW,UW_APPROVED) AND expiration_date < CURRENT_DATE) OU já está EXPIRED
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE` afeta exatamente 1 linha (lead 1009) | `spec:405-413` |
| Mecanismo `sweep_log` | contrato base | `spec:416-419` |
| Elegibilidade OU EXPIRED (gating) | `expect(isEligible > 0 || currentStatus > 0).toBeTruthy()` — elegível pelo SQL do sweep OU já EXPIRED | `spec:428-444` |
| Transição EXPIRED | `[OBSERVAÇÃO]` não-gating — pode processar async ou só notificar | `spec:437-441` |

---

## CT-S8 — UnutilizedApprovalSweep → email a aprovações de 7 dias

> GROUP C. **Mutação DB autorizada (Exceção 3):** `UPDATE uown_los_uwdata SET decision_made_at =
> CURRENT_DATE-7 WHERE lead_pk=1278` (lead UW_APPROVED, uw_status=APPROVED, com email emailável).
> Evidência primária = elegibilidade do lead pelo SQL do sweep + `sweep_log`; o email enfileirado
> é `[OBSERVAÇÃO]` (Java pode usar outra via de entrega ou ter dedup adicional).

```gherkin
Dado que decision_made_at do lead 1278 foi setado para CURRENT_DATE-7 (setup autorizado Exceção 3)
Quando UnutilizedApprovalSweep é disparado
Então a linha de sweep_log é criada
E o lead 1278 satisfaz o SQL do sweep (uw_status=APPROVED, decision_made_at IN (CURRENT_DATE-7, CURRENT_DATE-21), do_not_email=false)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE` afeta 1 linha (lead 1278) | `spec:457-468` |
| Mecanismo `sweep_log` | contrato base | `spec:471-474` |
| Elegibilidade (gating) | `expect(leadEligible).toBeGreaterThan(0)` — JOIN lead+uwdata+email confirmando uw_status=APPROVED, `date(decision_made_at) IN (CURRENT_DATE-7, CURRENT_DATE-21)`, `do_not_email=false` | `spec:483-492` |
| Email `UnutilizedApproval` | `[OBSERVAÇÃO]` não-gating — só loga contagem `pk > baseline` | `spec:494-503` |

> **Nota de discrepância (Regra #10):** o comentário do setup cita `CURRENT_DATE-7 OR
> CURRENT_DATE-14` (`spec:459`), mas o SQL de elegibilidade asserido usa `CURRENT_DATE-7,
> CURRENT_DATE-21` (`spec:488`). A asserção real (‑7/‑21) é o contrato; o setup grava ‑7, que
> satisfaz ambas. Divergência de comentário, não de comportamento.

---

## CT-S9 — paidOutAccountsSweep → marca contas quitadas como PAID_OUT

> GROUP C. **Mutação DB autorizada (Exceção 3):** `UPDATE uown_sv_sched_summary SET
> total_contract_amount_with_tax_and_fees = 0 WHERE account_pk=84` (conta 84 ACTIVE, usa-se 84
> e não 86 para evitar conflito com o CT-S6). Condição do sweep: `total_contract - (paid - fees) <= 0`.
> **Asserção determinística** — a mais forte dos 11.

```gherkin
Dado que total_contract_amount da conta 84 foi setado para 0 (setup autorizado Exceção 3)
Quando paidOutAccountsSweep é disparado
Então a conta 84 transiciona para account_status = 'PAID_OUT'
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE` afeta 1 linha (conta 84) | `spec:515-525` |
| Mecanismo `sweep_log` | contrato base | `spec:528-531` |
| Transição PAID_OUT (gating determinístico) | `db.waitForRecord('uown_sv_account', "pk = 84 AND account_status = 'PAID_OUT'", [], 60_000)` truthy | `spec:534-542` |

---

## CT-S10 — paidInFullAccountEmailSweep → enfileira `PaidInFullEmail`

> GROUP C. **Mutação DB autorizada (Exceção 3):** `UPDATE uown_sv_account SET pay_off_date_time`
> para a data da janela DOW da conta 87 (PAID_OUT) + `DELETE` dos `PaidInFullEmail` obsoletos da
> conta 87 para desbloquear o dedup Java. Janela DOW do sweep: DOW 1/2 → `CURRENT_DATE-4`;
> DOW 3 → `IN (CURRENT_DATE-4,-3,-2)`; senão → `CURRENT_DATE-2`.

```gherkin
Dado que pay_off_date_time da conta 87 foi setado para a data da janela DOW atual e os PaidInFullEmail obsoletos foram removidos (setup autorizado Exceção 3)
Quando paidInFullAccountEmailSweep é disparado
Então uma linha PaidInFullEmail aparece em uown_email_queue para account_pk=87 com pk > baseline
E se não aparecer em 60s, a conta 87 satisfaz o SQL de elegibilidade do sweep (fallback [OBSERVAÇÃO])
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado (pay_off + dedup unblock) | `UPDATE` afeta 1 linha; `DELETE` remove `PaidInFullEmail` obsoletos da conta 87; novo baseline recapturado | `spec:556-588` |
| Mecanismo `sweep_log` | contrato base | `spec:591-594` |
| Email `PaidInFullEmail` (evidência preferida) | `db.waitForRecord('uown_email_queue', "account_pk = 87 AND template_name = 'PaidInFullEmail' AND pk > $1", [prevEmailPk], 60_000)` truthy | `spec:597-606` |
| Fallback elegibilidade | se sem linha em 60s: `expect(eligible).toBeGreaterThan(0)` pelo SQL exato do sweep (PAID_OUT/PAID_OUT_EARLY, rating NOT IN (B,C) ou NULL, janela DOW de pay_off_date_time) → `[OBSERVAÇÃO]` Java async | `spec:607-622` |

---

## CT-S11 — eSignDocumentStatusSweep → atualiza contratos SENT para STATUS_UPDATE

> GROUP C. **Mutação DB autorizada (Exceção 3):** reseta o contrato mais recente (esign doc
> criado nos últimos 2 dias) para `contract_status='SENT'`, `esign_mode='EMAIL'`. Idempotente
> entre runs. `test.skip` se nenhum contrato recente existir no dev3. A transição STATUS_UPDATE
> é compartilhada com cron + fluxos de signing e o handler Java é async → reportada como
> `[OBSERVAÇÃO]` (não gating, evita flakiness de estado concorrente).

```gherkin
Dado que um contrato recente foi resetado para SENT + esign_mode=EMAIL (setup autorizado Exceção 3)
Quando eSignDocumentStatusSweep é disparado
Então a linha de sweep_log é criada
E o contrato satisfaz o SQL de elegibilidade do sweep (esign doc <= 2 dias, esign_mode=EMAIL OU contract_type=LEASE_MOD)
E a transição para STATUS_UPDATE é observada como [OBSERVAÇÃO] não-gating
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `targetContractPk === 0` (sem contrato com esign doc < 2 dias no dev3) | `spec:644-654` |
| Setup autorizado | `UPDATE ... SET contract_status='SENT', esign_mode='EMAIL'` afeta 1 linha | `spec:655-660` |
| Mecanismo `sweep_log` | contrato base | `spec:663-666` |
| Elegibilidade (gating determinístico) | `expect(eligible).toBeGreaterThan(0)` — esign doc `>= CURRENT_DATE-1` E (`esign_mode='EMAIL'` OU `contract_type='LEASE_MOD'`) | `spec:676-685` |
| Transição STATUS_UPDATE | `[OBSERVAÇÃO]` não-gating — `waitForRecord(..., 30_000)` só loga; handler Java async / estado compartilhado com cron | `spec:687-698` |

---

## Log de Atividade (Regra #13)

Sweeps de email escrevem em `uown_correspondence_logs` (`correspondence_type='EMAIL'`) — asserido
como **gating** no CT-S2 (`spec:186-194`). No CT-S1 o `correspondence_log` é **informacional**
(o `DaysPastDueMonthlyEmail` pode não escrever ali — confirmado 2026-06-02) e a evidência de
negócio é a linha `uown_email_queue`. Para os sweeps de pagamento/transição (S5, S6, S9), a
própria tabela de negócio (`uown_sv_achpayment`, `uown_sv_account.account_status`) É o log da
ação — não há nota textual separada. A linha `uown_sweep_logs` é o registro de que o sweep
executou (Regra #13 satisfeita no nível de scheduled task).

---

## Pré-condições

- **Ambiente dev3** (`ENV=dev3`) — PKs hardcoded (contas 84/86/87, leads 1009/1278) são
  específicos do dev3 (sandbox descartável). Em ambiente compartilhado (qa1), usar as funções
  de descoberta dinâmica de `sweep-fixture.helpers.ts` (`findIdleActiveAccount*`,
  `findExpirableLead`, `findUwApprovedLeadForUnutilized`) + os helpers `restore*` no teardown —
  **NÃO** usadas por ESTE spec (só `sweepLogBaseline`/`triggerAndWaitSweepLog`/`classifySweepError`/
  `getSweepLogError` são importados aqui), mas parte do mesmo módulo `covers`.
- **Mutações DB (Exceção 3):** S6..S11 dependem de INSERT/UPDATE/DELETE autorizados pelo usuário
  para criar dados elegíveis no dev3. Sem essa autorização, esses CTs não têm entrada elegível
  e degradam para mechanism-only. `SELECT` (S1..S5 leitura) é sempre permitido.
- **Modo serial obrigatório** (`spec:81`) — S9 usa a conta 84 e S6 a conta 86 justamente para
  não colidir; rodar em paralelo quebraria as asserções de estado.
- **Sem preflight de merchant** — estes sweeps operam sobre a população global de contas/leads,
  não criam aplicações; a hierarquia de dados frescos (Regra #9) cede legitimamente ao input
  elegível existente (documentado `spec:22-25`), sem criar aplicação fresca.

---

## Gaps / [HYPOTHESIS] / cobertura fina

- **S3 e S4 são mechanism-only no dev3** (não `[HYPOTHESIS]` — comportamento de ambiente
  documentado): `uown_accounts_to_be_sold` ausente → 0 contas elegíveis; o enqueue de email
  NÃO é validado no dev3. O ramo de negócio completo (email enfileirado) só é verificável em
  **stg/prod**. Cobertura de negócio real destes dois: **ausente no dev3** — flag para o
  orquestrador considerar um run em stg.
- **S7, S8, S11 têm o efeito de negócio final como `[OBSERVAÇÃO]` não-gating** (transição
  EXPIRED / email UnutilizedApproval / transição STATUS_UPDATE) por serem assíncronos ou
  compartilhados com cron. O gating real é elegibilidade-pelo-SQL + `sweep_log`, não a mutação
  observada. Cobertura do desfecho de negócio: **parcial** (elegibilidade provada, efeito não
  garantido no timeout).
- **S1, S2, S5, S6, S9, S10 têm cobertura de negócio forte** — S9 é a mais determinística
  (transição PAID_OUT asserida diretamente); S6 e S10 asseveram a linha de negócio criada
  (RERUN ACH / PaidInFullEmail); S1/S2/S5 asseveram email/ACH enfileirado.
- **Discrepância de comentário em S8** (‑7/‑14 no setup vs ‑7/‑21 na asserção) documentada no
  CT-S8 — divergência de comentário, não de comportamento; a asserção (‑7/‑21) é o contrato.
- **Semântica dos templates é `[HYPOTHESIS]`** onde o nome do sweep diverge do template real
  (S1: `latePaymentNoticeEmailSweep` → `DaysPastDueMonthlyEmail`); confirmado por observação
  live 2026-06-02 no dev3, mas o mapeamento nome→template não foi cruzado com a fonte canônica
  de código svc neste backfill — cross-check em `11-administracao.md` (catálogo de sweeps) antes
  de reusar o mapeamento em outro ambiente.

---

**Skills loaded:** `.claude/skills/test-scenarios/SKILL.md`

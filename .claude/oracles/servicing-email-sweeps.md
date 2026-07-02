---
operation: servicing-email-sweeps
description: Contrato de mecanismo + resultado-de-negócio para os 3 sweeps de EMAIL do portal Servicing exercitados por `email-sweeps-servicing.spec.ts`, disparados por `api.scheduledTask.triggerScheduledTask(name)` (POST `/uown/svc/triggerScheduledTask/{name}` → 200). Cada sweep grava uma linha em `uown_sweep_logs` (mecanismo comum), enfileira o template correto em `uown_email_queue` e escreve o log de atividade em `uown_correspondence_logs` (`correspondence_type='EMAIL'`, Regra #13). Cobre S1..S3. Sweeps GENUINAMENTE DIFERENTES dos 11 de `servicing-business-sweeps.md` — SEM sobreposição de nome de sweep. SEM superfície de UI — scheduled tasks admin/ops (Regra #14 exceção a); observabilidade é a persistência no DB (Regra #14 exceção c).
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/email-sweeps-servicing.spec.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - src/helpers/api-setup.helpers.ts
  - src/helpers/test-data.helpers.ts
  - docs/business-rules/10-portal-comunicacoes.md
  - docs/business-rules/11-administracao.md
  - docs/business-rules/appendix-b-endpoints.md
  - docs/business-rules/appendix-d-constantes-enums.md
---

# Oracle BDD — Email Sweeps (Servicing) — 3 scheduled tasks de email

> **Natureza (UI/API/DB): API-trigger + DB-assert. NÃO há superfície de UI.**
> Estes 3 sweeps são scheduled tasks (Quartz) administrativas/ops disparadas por
> `POST /uown/svc/triggerScheduledTask/{taskName}` (`scheduled-task.client.ts:24-25`),
> gerando emails. A Regra #14 exceção (a) — endpoint admin/ops sem UI exposta — **isenta
> estes sweeps do UI-first**; a Regra #14 exceção (c) — validação DB cross-cutting — cobre a
> asserção do efeito (linha `uown_email_queue` + `uown_correspondence_logs`). **Decisão
> explícita do usuário (2026-07-02): a isenção de UI-first NÃO isenta da Regra #19** — todo
> sweep nomeado exige um oracle registrado. Por isso este oracle é o contrato **mecanismo +
> resultado-de-negócio** no DB, sem passos Gherkin de UI. Isso é esperado e correto, não uma
> lacuna. O corpo do email renderizado (HTML/placeholders) NÃO é validado aqui — apenas o
> enfileiramento; render é [HYPOTHESIS]/gap (ver [Gaps](#gaps--hypothesis)).
>
> **Gatilho:** disparar `triggerScheduledTask(name)` para qualquer um dos 3 nomes de sweep de
> email abaixo, OU **rodar** `tests/e2e/servicing/email-sweeps-servicing.spec.ts` — rodar o
> spec É executar as operações que ele exercita (Regra #19), incluindo `createPreQualifiedApplication`
> + `driveLeadToFunding` (S3) e as mutações DB autorizadas (Exceção 3) de S3. Também dispara
> este oracle qualquer execução manual via MCP de um desses sweeps no Servicing.
>
> **Nomes de sweep cobertos (case-sensitive — confirmado no dev3, `spec:50-64`):**
> `settledInFullAccountEmailSweep` (→ `SettledInFullEmail`) · `RecurringPaymentReminderSweep`
> (→ `RecurringPaymentReminder`) · `FirstPaymentReminderSweep` (→ `FirstPaymentReminder`).
>
> **SEM sobreposição com `servicing-business-sweeps.md`:** aquele oracle cobre 11 sweeps de
> negócio (incluindo `paidInFullAccountEmailSweep` → `PaidInFullEmail`); ESTES 3 nomes de sweep
> e seus 3 templates são disjuntos daquele conjunto. `settledInFullAccountEmailSweep`
> (template `SettledInFullEmail`) é um sweep DISTINTO de `paidInFullAccountEmailSweep`
> (template `PaidInFullEmail`) — nomes e templates diferentes, apenas partilham a mecânica de
> janela DOW. Confirmado: zero colisão de nome de sweep entre os dois arquivos.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/email-sweeps-servicing.spec.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   src/helpers/api-setup.helpers.ts \
>   src/helpers/test-data.helpers.ts \
>   docs/business-rules/10-portal-comunicacoes.md \
>   docs/business-rules/11-administracao.md \
>   docs/business-rules/appendix-b-endpoints.md \
>   docs/business-rules/appendix-d-constantes-enums.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (`ENV=dev3` — `spec:36-39`). O worker fixture `db` conecta em
> `process.env.ENV`; rodar com `ENV=dev3` para as asserções DB baterem no mesmo banco que o
> SVC API svc-dev3 dispara. Timeout 300s (`--timeout=300000`); `setTimeout` por teste:
> S1/S2 = 120s, S3 = 420s (`spec:113,193,272`). Modo **serial**
> (`test.describe.configure({ mode: 'serial' })`, `spec:106`).
>
> **Grupos por estratégia de dados:**
> - **S1** — dados elegíveis EXISTENTES (janela DOW + `settled_in_full_date_time`); `test.skip`
>   se nenhuma conta na janela hoje.
> - **S2** — evidência de cron (linhas do dia); `test.skip` se nenhuma linha
>   `RecurringPaymentReminder` hoje.
> - **S3** — dados FRESCOS via automação (`createPreQualifiedApplication` + `driveLeadToFunding`)
>   + mutação DB autorizada (Exceção 3) para trazer a conta à janela do sweep.

---

## Mecanismo comum a TODOS os sweeps (S1..S3) — contrato base

> Diferente de `business-sweeps-servicing.spec.ts` (que usa o helper `triggerAndWaitSweepLog`),
> ESTE spec **inline-a** o baseline + trigger + waitForRecord dentro de cada teste (não importa
> `sweep-fixture.helpers.ts`). O contrato mecânico é idêntico para os 3:

```gherkin
Dado que o baseline MAX(pk) de uown_sweep_logs para o sweep é capturado antes do disparo
Quando o sweep de email é disparado via triggerScheduledTask(name)
Então a resposta HTTP é 200
E uma NOVA linha aparece em uown_sweep_logs com sweep_name = name e pk > baseline em até 30s
```

### Oracle (mecanismo — todos os sweeps de email)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP do trigger | `resp.status === 200` (propriedade, NÃO método — nunca `resp.status()`) | `spec:128-129,214-215,344-345`; `scheduled-task.client.ts:24-25` |
| Endpoint disparado | `POST /uown/svc/triggerScheduledTask/{taskName}` | `scheduled-task.client.ts:24-25` |
| Baseline de sweep_log | `db.getSingleNumber("SELECT COALESCE(MAX(pk),0) FROM uown_sweep_logs WHERE sweep_name = $1")` capturado ANTES do trigger | `spec:124-127,210-213,332-335` |
| Nova linha em `uown_sweep_logs` | `db.waitForRecord('uown_sweep_logs', 'sweep_name = $1 AND pk > $2', [name, prevPk], 30_000)` truthy | `spec:135-141,219-225,352-358` |
| Contagem `number_of_records_processed` | **NUNCA asserida `>= 1`** — escrita de forma assíncrona APÓS o processamento; `processed=0` é válido (dedup same-day: o cron das 05:00/12:00/15:15 já enfileirou hoje e o Java pula quando existe linha PENDING/STORED). S1/S2 só a logam; S3 nem a lê (é escrita após o enqueue) | `spec:142-149,226-232,349-351` |

> **Por que a contagem não é o oráculo (Regra #10):** a evidência primária de cada sweep é a
> **linha em `uown_email_queue`** (template correto) mais o **`uown_correspondence_logs`**
> (Regra #13). A contagem de `sweep_log` é apenas prova de que o sweep executou, não de quantos
> registros tocou. Em S3 (dados frescos), a evidência definitiva é `uown_email_queue.pk > baseline`
> para a conta fresca (filtro monotônico TZ-agnóstico, evita drift de timestamp — pitfall #66).

---

## CT-S1 — settledInFullAccountEmailSweep → enfileira `SettledInFullEmail`

> Dados EXISTENTES. Conta `SETTLED_IN_FULL` elegível pela janela DOW + CASE-WHEN de data de
> settlement. Devido ao **dedup same-day**, a linha de `uown_email_queue` pode ter origem no
> cron das 05:00 OU neste trigger manual — por isso o oracle asserta **presença HOJE**
> (`row_created_timestamp::date = CURRENT_DATE`), NÃO frescor (`pk > baseline`). `test.skip`
> quando nenhuma conta cai na janela DOW hoje (skip válido, não falha).

```gherkin
Dado que existe ao menos uma conta SETTLED_IN_FULL elegível pela janela DOW do sweep hoje (rating fora de E/F/U, settled_in_full_date_time na janela de data)
Quando settledInFullAccountEmailSweep é disparado
Então a linha de sweep_log é criada (processed=0 aceito — dedup same-day)
E existe uma linha SettledInFullEmail em uown_email_queue criada hoje (do cron das 05:00 OU deste trigger)
E a linha carrega um account_pk (a conta para a qual o email foi enfileirado)
E uma linha de correspondência EMAIL para SettledInFullEmail existe para aquele account_pk (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de elegibilidade (skip, NÃO fail) | `settledSweepHasEligibleAccounts(db)` → `test.skip` se `false`. SQL usa a MESMA cláusula do sweep: `account_status='SETTLED_IN_FULL'` AND `rating NOT IN ('E','F','U') OR rating IS NULL` AND `extract(DOW) BETWEEN 1 AND 5` AND `settled_in_full_date_time IS NOT NULL` AND janela DOW (1/2→`CURRENT_DATE-4`; 3→`IN (-4,-3,-2)`; senão→`CURRENT_DATE-2`) | `spec:83-101,115-120` |
| Mecanismo `sweep_log` | contrato base; `processed=0` aceito (dedup) — só logado | `spec:122-149` |
| Email `SettledInFullEmail` (evidência primária) | `db.waitForRecord('uown_email_queue', "template_name = $1 AND row_created_timestamp::date = CURRENT_DATE", ['SettledInFullEmail'], 30_000)` truthy | `spec:152-162` |
| Conta alvo capturada | `SELECT account_pk ... WHERE template_name='SettledInFullEmail' AND row_created_timestamp::date=CURRENT_DATE ORDER BY pk DESC LIMIT 1` retorna account_pk | `spec:163-168` |
| `correspondence_log` (Regra #13, gating) | `db.waitForRecord('uown_correspondence_logs', "account_pk = $1 AND correspondence_type = 'EMAIL' AND template_name = $2", [accountPk, 'SettledInFullEmail'], 15_000)` truthy | `spec:171-181` |

> **Nota `error` (Regra #13, `spec:27-30`):** a coluna `error` de `uown_correspondence_logs`
> carrega texto informacional (accountPK/leadPK) MESMO em sucesso — asseverar **presença da
> linha** apenas, NUNCA `error IS NULL`.

---

## CT-S2 — RecurringPaymentReminderSweep → enfileira `RecurringPaymentReminder`

> Dados EXISTENTES via **evidência de cron**. Contas frescas dia-0 não satisfazem a condição de
> data de vencimento do receivable (janela ainda não alcançada), então o mecanismo é validado
> pela presença de linhas do DIA (cron 12:00/15:15) + `sweep_log` + `correspondence_log`.
> `test.skip` se nenhuma linha `RecurringPaymentReminder` hoje (env sem elegíveis / cron não rodou).

```gherkin
Dado que existem linhas RecurringPaymentReminder em uown_email_queue criadas hoje (evidência do cron)
Quando RecurringPaymentReminderSweep é disparado
Então a linha de sweep_log é criada (processed=0 aceito — dedup por sent_time)
E existe uma linha RecurringPaymentReminder em uown_email_queue criada hoje
E uma linha de correspondência EMAIL para RecurringPaymentReminder existe hoje (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de elegibilidade (skip, NÃO fail) | `test.skip` se `COUNT(*) uown_email_queue WHERE template_name='RecurringPaymentReminder' AND row_created_timestamp::date=CURRENT_DATE` === 0 | `spec:195-206` |
| Mecanismo `sweep_log` | contrato base; `processed=0` aceito (dedup por janela de `sent_time`) — só logado | `spec:208-233` |
| Email `RecurringPaymentReminder` (evidência primária) | `db.waitForRecord('uown_email_queue', "template_name = $1 AND row_created_timestamp::date = CURRENT_DATE", ['RecurringPaymentReminder'], 15_000)` truthy | `spec:235-245` |
| Conta amostra capturada | `SELECT DISTINCT account_pk ... LIMIT 1` (amostra, não gating) | `spec:246-251` |
| `correspondence_log` (Regra #13, gating) | `db.waitForRecord('uown_correspondence_logs', "correspondence_type = 'EMAIL' AND template_name = $1 AND row_created_timestamp::date = CURRENT_DATE", ['RecurringPaymentReminder'], 15_000)` truthy | `spec:254-264` |

> **Causação trigger→enqueue é [OBSERVAÇÃO] em S2 (e S1):** por asseverar "linha existe HOJE"
> (não `pk > baseline`), o oracle prova que a **cadeia** sweep→email_queue→correspondence_log
> está operacional no dev3, mas NÃO que ESTE trigger manual específico enfileirou a linha (a
> origem pode ser o cron). Isso é uma escolha deliberada por causa do dedup same-day, não uma
> falha de cobertura. A causação forte (trigger→enqueue) só é garantida em **S3** (`pk > baseline`
> em conta fresca). Ver [Gaps](#gaps--hypothesis).

---

## CT-S3 — FirstPaymentReminderSweep → enfileira `FirstPaymentReminder`

> Dados FRESCOS via automação + **mutação DB autorizada (Exceção 3, pré-autorizada no brief do
> teste)**. Conta ACTIVE fresca via `createPreQualifiedApplication` + `driveLeadToFunding`;
> `first_payment_due_date` default = hoje+7 (fora da janela `<= hoje+3`) → UPDATE traz para
> `CURRENT_DATE+2`. **Cobertura de negócio mais forte dos 3** (causação por `pk > baseline`).

```gherkin
Dado uma conta ACTIVE fresca criada via automação (merchant TerraceFinance, estado NY, order $800)
E o first_payment_due_date da conta e o due_date do primeiro receivable REGULAR_PAYMENT/UNPAID/ACTIVE foram setados para CURRENT_DATE+2 (setup autorizado Exceção 3, trazendo a conta à janela do sweep)
E os PKs baseline de sweep_log, email_queue e correspondence_log da conta são capturados antes do disparo
Quando FirstPaymentReminderSweep é disparado
Então a linha de sweep_log é criada
E uma linha FirstPaymentReminder aparece em uown_email_queue para a conta fresca com pk > baseline
E uma linha de correspondência EMAIL para FirstPaymentReminder aparece para a conta com pk > baseline (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup fresco (Regra #9/#12) | `createPreQualifiedApplication` (roda merchant preflight automático) + `driveLeadToFunding`; `db.waitForAccountByLeadPk(ctx.leadPk, 60_000)` truthy → `accountPk` resolvido | `spec:276-294` |
| Mutação autorizada #1 (sched_summary) | `db.executeUpdate("UPDATE uown_sv_sched_summary SET first_payment_due_date = CURRENT_DATE + 2 WHERE account_pk = $1")` afeta **exatamente 1 linha** (`toBe(1)`) | `spec:296-306` |
| Mutação autorizada #2 (receivable) | `UPDATE uown_sv_receivable SET due_date = CURRENT_DATE + 2` no primeiro `REGULAR_PAYMENT`/`UNPAID`/`ACTIVE` (ORDER BY due_date ASC LIMIT 1) afeta **1 linha** (`toBe(1)`) — condição do sweep exige `receivable.due_date = schedSummary.first_payment_due_date` (ambos em sync) | `spec:308-323` |
| Baselines de PK (TZ-agnóstico) | `prevSweepLogPk`, `prevEmailQueuePk` (`account_pk=$1 AND template_name='FirstPaymentReminder'`), `prevCorrLogPk` capturados ANTES do trigger via `COALESCE(MAX(pk),0)` | `spec:326-343` |
| Mecanismo `sweep_log` | `db.waitForRecord('uown_sweep_logs', 'sweep_name = $1 AND pk > $2', [...], 30_000)` truthy; `number_of_records_processed` **NÃO lido/asserido** (escrito após o processamento) | `spec:348-360` |
| Email `FirstPaymentReminder` (evidência PRIMÁRIA) | `db.waitForRecord('uown_email_queue', 'account_pk = $1 AND template_name = $2 AND pk > $3', [accountPk, 'FirstPaymentReminder', prevEmailQueuePk], 60_000)` truthy — 60s absorve o lag async do sweep Java | `spec:362-377` |
| `correspondence_log` (Regra #13, gating) | `db.waitForRecord('uown_correspondence_logs', "account_pk = $1 AND correspondence_type = 'EMAIL' AND template_name = $2 AND pk > $3", [accountPk, 'FirstPaymentReminder', prevCorrLogPk], 15_000)` truthy | `spec:379-388` |

```sql
-- Validação DB CT-S3 (substituir $account_pk) — projeção read-only da conta fresca
SELECT pk, account_pk, template_name, row_created_timestamp
  FROM uown_email_queue
 WHERE account_pk = $account_pk
   AND template_name = 'FirstPaymentReminder'
 ORDER BY pk DESC
 LIMIT 1;
-- Esperado: linha com pk > baseline capturado antes do trigger
```

---

## Log de Atividade (Regra #13)

Os 3 sweeps de email escrevem em `uown_correspondence_logs` (`correspondence_type='EMAIL'`,
`template_name` = template do sweep) — asserido como **gating** nos 3 CTs (S1 `spec:171-181`,
S2 `spec:254-264`, S3 `spec:379-388`). A cadeia completa validada é
`triggerScheduledTask → uown_sweep_logs → uown_email_queue → uown_correspondence_logs`
(`spec:4-6,27-30`). A coluna `error` carrega texto informacional (accountPK/leadPK) mesmo em
sucesso → **presença apenas, nunca `error IS NULL`** (`spec:27-30`). A linha `uown_sweep_logs`
é o registro de que o scheduled task executou (Regra #13 no nível de scheduled task).

```gherkin
Dado que um sweep de email foi disparado e enfileirou seu template em uown_email_queue
Quando o log de atividade de correspondência é consultado em uown_correspondence_logs
Então existe uma linha correspondence_type='EMAIL' com o template_name do sweep para o account_pk
E a linha existe independentemente do conteúdo da coluna error (informacional mesmo em sucesso)
```

---

## Pré-condições

- **Ambiente dev3** (`ENV=dev3`, `spec:36`) — o fixture `db` conecta em `process.env.ENV`;
  rodar com `ENV=dev3` para as asserções DB baterem no banco disparado pela SVC API svc-dev3.
- **Modo serial obrigatório** (`spec:106`) — os 3 testes compartilham o banco dev3 e S3 muta
  dados; serial evita colisão de estado.
- **S1/S2 cedem à hierarquia de dados frescos legitimamente (Regra #9):** sweeps operam sobre a
  população global de contas; a modalidade "linha existe hoje" é documentada no header
  (`spec:10-25`) — não criam aplicação fresca. Só **S3** cria dados frescos (`buildTestData` →
  email único → `createPreQualifiedApplication` → `driveLeadToFunding`).
- **S3 dados frescos (`FRESH_DATA`, `spec:66-70`):** estado `NY`, merchant `TerraceFinance`,
  `orderTotal` `$800`. `createPreQualifiedApplication` roda merchant preflight automático
  (Regra #12).
- **S3 mutações DB (Exceção 3):** `UPDATE` em `uown_sv_sched_summary` + `uown_sv_receivable`
  pré-autorizado no brief do teste; escopado à conta fresca criada acima — nenhum dado
  out-of-scope tocado (`spec:296-323`). `SELECT` (S1/S2 leitura + baselines) é sempre permitido.
- **Guards de skip válidos:** S1 pula se nenhuma conta na janela DOW hoje; S2 pula se nenhuma
  linha `RecurringPaymentReminder` hoje — skip é resultado válido de ambiente, NÃO falha
  (Regra #10).
- **Templates case-sensitive** (`spec:50-64`): `SettledInFullEmail`, `RecurringPaymentReminder`,
  `FirstPaymentReminder` — confirmados no dev3.

---

## Gaps / [HYPOTHESIS]

- **Render do email NÃO é validado** — o oracle prova o **enfileiramento** (`uown_email_queue`)
  + o log (`uown_correspondence_logs`), NÃO o corpo HTML renderizado, placeholders resolvidos,
  ou entrega real. Um bug de placeholder vazio (análogo ao BUG-01 de 2026-05-06) NÃO seria
  pego por este spec. Cobertura de render: **ausente** (fora do escopo de sweep API-only;
  exigiria um teste de render de template de email — trabalho de spec novo).
- **Causação trigger→enqueue é [OBSERVAÇÃO] em S1 e S2** — por asseverarem "linha existe HOJE"
  (`row_created_timestamp::date = CURRENT_DATE`) em vez de `pk > baseline`, a origem da linha
  pode ser o cron (05:00 para S1; 12:00/15:15 para S2), não o trigger manual. Prova a cadeia
  operacional, não a causação do disparo específico. Apenas **S3** garante causação forte
  (`pk > baseline` em conta fresca). Escolha deliberada por causa do dedup same-day, documentada
  no header (`spec:10-20,187-190`).
- **Mapeamento nome-do-sweep → template é [HYPOTHESIS]** — "confirmado no dev3" por observação
  live (`spec:50-64`), mas o mapeamento `settledInFullAccountEmailSweep→SettledInFullEmail`,
  `RecurringPaymentReminderSweep→RecurringPaymentReminder`,
  `FirstPaymentReminderSweep→FirstPaymentReminder` NÃO foi cruzado com a fonte canônica de
  código svc neste backfill. Cross-check em `10-portal-comunicacoes.md` (catálogo de templates)
  / `11-administracao.md` (catálogo de sweeps) antes de reusar o mapeamento em outro ambiente.
- **Cobertura de negócio por CT:** S3 é a mais forte (dados frescos + `pk > baseline` +
  `correspondence_log` gating); S1 e S2 são cadeia-operacional-do-dia (email do dia + log
  gating), fortes o suficiente para provar o mecanismo mas não a causação do trigger manual.
- **`number_of_records_processed`** é escrito async após o processamento; nunca é oráculo
  (`processed=0` é válido — dedup). Documentado no contrato base; consistente com
  `servicing-business-sweeps.md`.

---

**Skills loaded:** `.claude/skills/test-scenarios/SKILL.md`

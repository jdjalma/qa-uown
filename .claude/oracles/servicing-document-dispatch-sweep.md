---
operation: servicing-document-dispatch-sweep
description: Contrato de mecanismo + resultado-de-negócio determinístico para os 6 sweeps (scheduled tasks) de documento/dispatch do portal Servicing, disparados por `api.scheduledTask.triggerScheduledTask(name)` (POST `/uown/svc/triggerScheduledTask/{name}` → 200). Diferente dos sweeps de pagamento, estes são operações UPDATE/derive puras, SEM dependência de processador externo, então o desfecho de negócio é asseverado diretamente. Cada sweep grava uma linha em `uown_sweep_logs` (mecanismo comum) e avança uma linha de fila/documento pelo seu pipeline (email_queue / sms_queue / esign_document SENT|PENDING|SIGNED → sai do status de entrada), remove uma rating letter obsoleta, ou seleciona uma transação CC ERROR órfã. SEM superfície de UI — scheduled tasks admin/ops (Regra #14 exceção a); a observabilidade é a persistência no DB (Regra #14 exceção c). Cobre S1..S6 no arquivo `document-dispatch-sweeps-servicing.spec.ts`.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/document-dispatch-sweeps-servicing.spec.ts
  - src/helpers/sweep-fixture.helpers.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/11-administracao.md
  - docs/business-rules/appendix-b-endpoints.md
  - docs/business-rules/appendix-d-constantes-enums.md
---

# Oracle BDD — Document / Dispatch Sweeps (Servicing) — 6 scheduled tasks

> **Natureza (UI/API/DB): API-trigger + DB-assert. NÃO há superfície de UI.**
> Estes 6 sweeps são scheduled tasks (Quartz) administrativas/ops disparadas por
> `POST /uown/svc/triggerScheduledTask/{taskName}` (`scheduled-task.client.ts:24-25`).
> A Regra #14 exceção (a) — endpoint admin/ops sem UI exposta — **isenta estes sweeps do
> UI-first**; a Regra #14 exceção (c) — validação DB cross-cutting — cobre a asserção do
> efeito. **Decisão explícita do usuário (2026-07-02): a isenção de UI-first NÃO isenta da
> Regra #19** — todo sweep nomeado exige um oracle registrado. Por isso este oracle é o
> contrato **mecanismo + resultado-de-negócio determinístico** no DB, sem passos Gherkin de UI.
> Isso é esperado e correto, não uma lacuna.
>
> **O que "document dispatch" significa aqui (confirmado no código, não assumido):** o cabeçalho
> do spec (`spec:1-20`) define a família como *"pure DB-state sweeps that advance documents,
> emails, SMS, and rating letters through their processing pipelines"* — operações UPDATE/derive
> **determinísticas**, sem processador externo. Concretamente:
> - **S1/S2/S3 — pipeline de documento/e-sign** (categoria "DOCUMENTS AND E-SIGN",
>   `11-administracao.md:366-393`): armazenar o documento (`storedDocServiceSweep`, 34.31),
>   enviar o SMS com link do documento (`storedDocSmsServiceSweep`, 34.32), buscar o e-sign
>   completado (`getCompletedESignDocumentStatusSweep`, 34.34).
> - **S4 — dispatch de e-mail** (`emailSweep`, categoria CORRESPONDENCE 34.21): processa a fila
>   de e-mail PENDING e envia via SendGrid (`11-administracao.md:297-302`).
> - **S5 — remoção de rating letter** (`removeRatingLetterSweep`, 34.20, `11-administracao.md:286-291`):
>   remove/arquiva a rating letter após o período estatutário.
> - **S6 — correção de gateway** (`paymentGatewayFixSweep`, 34.67, `11-administracao.md:623-627`):
>   seleciona transações CC ERROR órfãs (sem gateway id) para re-submissão.
>
> A família NÃO é uma única capacidade de produto; é o grupo de sweeps *dispatch/documento
> determinísticos* que o spec agrupa por terem **desfecho asseverável diretamente** (ao contrário
> dos sweeps de pagamento, que dependem de connector). Este oracle é o contrato desse grupo.
>
> **Gatilho:** disparar `triggerScheduledTask(name)` para qualquer um dos 6 nomes de sweep
> abaixo, OU **rodar** `tests/e2e/servicing/document-dispatch-sweeps-servicing.spec.ts` — rodar o
> spec É executar as operações que ele exercita (Regra #19). Também dispara este oracle qualquer
> execução manual via MCP de um desses sweeps no Servicing.
>
> **Nomes de sweep cobertos (case-sensitive — confirmado no dev3, `spec:79,107,135,167,198,241`):**
> `storedDocServiceSweep` · `storedDocSmsServiceSweep` · `getCompletedESignDocumentStatusSweep` ·
> `emailSweep` · `removeRatingLetterSweep` · `paymentGatewayFixSweep`.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/document-dispatch-sweeps-servicing.spec.ts \
>   src/helpers/sweep-fixture.helpers.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/11-administracao.md \
>   docs/business-rules/appendix-b-endpoints.md \
>   docs/business-rules/appendix-d-constantes-enums.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (`ENV=dev3` — `spec:26,28-29`). O worker fixture `db` conecta em
> `process.env.ENV`; rodar com `ENV=dev3` para as asserções DB baterem no mesmo banco que o
> SVC API svc-dev3 dispara. Timeout 300s (`--timeout=300000`); cada teste `setTimeout(120_000)`.
> Modo **serial** (`test.describe.configure({ mode: 'serial' })`, `spec:74`).
>
> **Setup via mutações DB autorizadas (Exceção 3, autorização do usuário — `spec:22-23`):** todos
> os 6 CTs semeiam sua entrada elegível via `db.executeUpdate`/`INSERT` sobre linhas de fixture
> existentes do dev3 e as contas dedicadas 219 (S5) / 220 (S6). `SELECT` (leitura) é sempre
> permitido.
>
> **Gate determinístico "saiu do status de entrada" (`spec:17-20,49-69`):** os sweeps de dispatch
> (S1/S2/S3/S4) movem a linha para um status-alvo imediato, mas um worker downstream pode avançá-la
> ainda mais dentro da mesma janela (ex.: `SENT → PICKED_TO_STORE → STORED`). Por isso o oráculo
> asseverado NÃO é o status-alvo exato, e sim **"a linha deixou o status de entrada"** (avançou pelo
> pipeline) via `waitForStatusToLeave(db, table, pk, fromStatus)` — que prova que o sweep processou
> a linha sem depender do timing do worker seguinte. Os status-alvo imediatos nomeados abaixo vêm
> dos comentários do spec (`spec:10-15,77,105,133,164`), NÃO são asseverados — ver [Gaps](#gaps--hypothesis).

---

## Mecanismo comum a TODOS os sweeps (S1..S6) — contrato base

> Cada sweep é disparado pelo helper compartilhado `triggerAndWaitSweepLog(api, db, name, prevPk)`
> (`sweep-fixture.helpers.ts:99-120`). O contrato mecânico é idêntico para os 6:

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
| Contagem `number_of_records_processed` | **NUNCA asserida `>= 1`** — é escrita de forma assíncrona APÓS o processamento; ler logo após o trigger pode retornar 0 mesmo com linhas processadas | `sweep-fixture.helpers.ts:95-98,114-119` |

> **Por que a contagem não é o oráculo (Regra #10):** a evidência primária de cada sweep é a
> **linha da tabela de negócio** (email_queue / sms_queue / esign_document que saiu do status de
> entrada; rating removido; tx CC selecionada pelo SQL do sweep). A contagem de `sweep_log` é
> apenas prova de que o sweep executou, não de quantos registros tocou.
>
> **[OBSERVAÇÃO] endpoint dedicado vs genérico (Regra #10):** `11-administracao.md` lista para
> S1/S2/S3 um endpoint manual dedicado (`POST /uown/svc/storedDocServiceSweep`,
> `/storedDocSmsServiceSweep`, `/getCompletedESignDocumentStatusSweep` — `11-administracao.md:372,379,392`).
> O spec dispara TODOS os 6 pela via genérica `triggerScheduledTask/{name}`
> (`sweep-fixture.helpers.ts:105`). Ambas as vias executam a mesma scheduled task; o contrato
> asseverado aqui é a via genérica. Não é uma divergência de comportamento.

---

## CT-S1 — storedDocServiceSweep → avança um e-mail SENT para fora de SENT

> **Setup autorizado (Exceção 3):** seta a linha mais recente de `uown_email_queue` para
> `status='SENT'`. O sweep armazena o documento e avança a linha (`SENT → PICKED_TO_STORE → STORED`,
> status-alvo documentado em `spec:77,10`, **não asseverado**). Gate determinístico: a linha saiu de
> SENT. `test.skip` se não houver linhas de `email_queue` no dev3.

```gherkin
Dado que a linha de e-mail mais recente foi setada para o status SENT (setup autorizado Exceção 3)
Quando storedDocServiceSweep é disparado
Então a linha de sweep_log é criada (contrato base)
E a mesma linha de e-mail deixa o status SENT em até 30s (avançou pelo pipeline de armazenamento)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `targetPk === 0` (sem linha em `uown_email_queue` no dev3) | `spec:86` |
| Setup autorizado | `UPDATE uown_email_queue SET status='SENT' WHERE pk=$1` afeta a linha alvo | `spec:87` |
| Mecanismo `sweep_log` | contrato base | `spec:91-95` |
| Saída de SENT (gating determinístico) | `waitForStatusToLeave(db, 'uown_email_queue', targetPk, 'SENT')` → `expect(newStatus).not.toBe('SENT')` | `spec:97-101,49-69` |

```sql
-- Validação DB CT-S1 (substituir $pk): status DEVE ter saído de 'SENT'
SELECT pk, status FROM uown_email_queue WHERE pk = $pk;
-- Esperado: status <> 'SENT' (ex.: PICKED_TO_STORE ou STORED)
```

---

## CT-S2 — storedDocSmsServiceSweep → avança um SMS SENT para fora de SENT

> **Setup autorizado (Exceção 3):** seta a linha mais recente de `uown_sms_queue` para
> `status='SENT'`. O sweep envia o SMS com link do documento e avança a linha
> (`SENT → PICKED_TO_STORE → STORED`, status-alvo documentado em `spec:105,11`, **não asseverado**).
> Gate determinístico: a linha saiu de SENT. `test.skip` se não houver linhas de `sms_queue` no dev3.

```gherkin
Dado que a linha de SMS mais recente foi setada para o status SENT (setup autorizado Exceção 3)
Quando storedDocSmsServiceSweep é disparado
Então a linha de sweep_log é criada (contrato base)
E a mesma linha de SMS deixa o status SENT em até 30s (avançou pelo pipeline de envio)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `targetPk === 0` (sem linha em `uown_sms_queue` no dev3) | `spec:114` |
| Setup autorizado | `UPDATE uown_sms_queue SET status='SENT' WHERE pk=$1` afeta a linha alvo | `spec:115` |
| Mecanismo `sweep_log` | contrato base | `spec:119-123` |
| Saída de SENT (gating determinístico) | `waitForStatusToLeave(db, 'uown_sms_queue', targetPk, 'SENT')` → `expect(newStatus).not.toBe('SENT')` | `spec:125-129,49-69` |

```sql
-- Validação DB CT-S2 (substituir $pk): status DEVE ter saído de 'SENT'
SELECT pk, status FROM uown_sms_queue WHERE pk = $pk;
-- Esperado: status <> 'SENT'
```

---

## CT-S3 — getCompletedESignDocumentStatusSweep → move um esign SIGNED para fora de SIGNED

> **Setup autorizado (Exceção 3):** seta o esign doc mais recente para `status='SIGNED'`. O sweep
> busca o e-sign completado e o avança (`SIGNED → STATUS_UPDATE`; no dev3, que **não tem provedor
> real de esign**, um worker de status-poll downstream pode então avançá-lo para `ERROR` —
> `spec:154-156`, **status-alvo não asseverado**). Gate determinístico: a linha saiu de SIGNED.
> `test.skip` se não houver esign docs no dev3.

```gherkin
Dado que o esign document mais recente foi setado para o status SIGNED (setup autorizado Exceção 3)
Quando getCompletedESignDocumentStatusSweep é disparado
Então a linha de sweep_log é criada (contrato base)
E o mesmo esign document deixa o status SIGNED em até 30s (o sweep o processou)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `targetPk === 0` (sem linha em `uown_esign_document` no dev3) | `spec:142` |
| Setup autorizado | `UPDATE uown_esign_document SET status='SIGNED' WHERE pk=$1` afeta a linha alvo | `spec:143` |
| Mecanismo `sweep_log` | contrato base | `spec:147-151` |
| Saída de SIGNED (gating determinístico) | `waitForStatusToLeave(db, 'uown_esign_document', targetPk, 'SIGNED')` → `expect(newStatus).not.toBe('SIGNED')` | `spec:153-160,49-69` |

```sql
-- Validação DB CT-S3 (substituir $pk): status DEVE ter saído de 'SIGNED'
SELECT pk, status FROM uown_esign_document WHERE pk = $pk;
-- Esperado: status <> 'SIGNED' (ex.: STATUS_UPDATE; ou ERROR no dev3 sem provedor real)
```

---

## CT-S4 — emailSweep → avança um e-mail PENDING para fora de PENDING

> **Setup autorizado (Exceção 3):** seta a linha mais recente de `uown_email_queue` para
> `status='PENDING'`, `template_name='Welcome'`, `send_by_time=NULL`. O template **Welcome**
> (não-reminder) evita que o filtro de hora-do-dia do sweep exclua a linha (`spec:165`); `send_by_time=NULL`
> evita o gate de agendamento. O sweep processa a fila PENDING e envia (`PENDING → PICKED_TO_BE_SENT →
> onward`, status-alvo documentado em `spec:164,13`, **não asseverado**). Gate determinístico: a
> linha saiu de PENDING. `test.skip` se não houver linhas de `email_queue` no dev3.

```gherkin
Dado que a linha de e-mail mais recente foi setada para PENDING com template Welcome e sem hora de envio (setup autorizado Exceção 3)
Quando emailSweep é disparado
Então a linha de sweep_log é criada (contrato base)
E a mesma linha de e-mail deixa o status PENDING em até 30s (entrou na fila de envio)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard de disponibilidade | `test.skip` se `targetPk === 0` (sem linha em `uown_email_queue` no dev3) | `spec:174` |
| Setup autorizado | `UPDATE uown_email_queue SET status='PENDING', template_name='Welcome', send_by_time=NULL WHERE pk=$1` afeta a linha alvo | `spec:175-178` |
| Mecanismo `sweep_log` | contrato base | `spec:182-186` |
| Saída de PENDING (gating determinístico) | `waitForStatusToLeave(db, 'uown_email_queue', targetPk, 'PENDING')` → `expect(newStatus).not.toBe('PENDING')` | `spec:188-192,49-69` |

```sql
-- Validação DB CT-S4 (substituir $pk): status DEVE ter saído de 'PENDING'
SELECT pk, status, template_name FROM uown_email_queue WHERE pk = $pk;
-- Esperado: status <> 'PENDING' (ex.: PICKED_TO_BE_SENT ou SENT)
```

> **Por que o template Welcome (Regra #10):** um template de reminder cairia no filtro de
> hora-do-dia do `emailSweep` e a linha não seria selecionada — falso "sweep não processou".
> Welcome + `send_by_time=NULL` neutraliza os dois gates de seleção, isolando o CT ao mecanismo
> de dispatch. Fonte: `spec:165,171-178`.

---

## CT-S5 — removeRatingLetterSweep → remove uma rating 'P' obsoleta (conta 219)

> **Setup autorizado (Exceção 3):** `UPDATE uown_sv_account SET rating='P', last_rating_time=CURRENT_DATE-40
> WHERE pk=219`. O SQL do sweep seleciona contas ACTIVE com `rating='P'`, `last_rating_time < today-30`
> e SEM pagamento PAID nos últimos 60 dias — a conta 219 não tem pagamento PAID recente (`spec:203-204`).
> **Asserção determinística** (a mais forte deste spec, ao lado do gate de saída-de-status): a rating
> é limpa (`P → NULL`). Elegibilidade é confirmada rodando o SQL de seleção real do sweep ANTES do trigger.

```gherkin
Dado que a conta 219 foi setada para rating='P' com last_rating_time de 40 dias atrás e sem pagamento PAID recente (setup autorizado Exceção 3)
E a conta 219 é selecionada pelo SQL de seleção real do removeRatingLetterSweep
Quando removeRatingLetterSweep é disparado
Então a linha de sweep_log é criada (contrato base)
E a rating da conta 219 é removida (rating IS NULL)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado | `UPDATE uown_sv_account SET rating='P', last_rating_time=CURRENT_DATE-40 WHERE pk=219` | `spec:205-208` |
| Elegibilidade via SQL real do sweep | `sweepSelects(db, 'removeRatingLetterSweep', '219')` truthy — lê `sql_to_pick_accounts` de `uown_scheduled_task` e confirma que '219' está no resultado | `spec:212-216,38-47` |
| Mecanismo `sweep_log` | contrato base | `spec:218-222` |
| Rating removida (gating determinístico) | `db.waitForRecord('uown_sv_account', 'pk = 219 AND rating IS NULL', [], 30_000)` truthy | `spec:224-233` |

```sql
-- Validação DB CT-S5: a rating 'P' DEVE ter sido removida
SELECT pk, rating, last_rating_time FROM uown_sv_account WHERE pk = 219;
-- Esperado: rating IS NULL (P removida)
```

---

## CT-S6 — paymentGatewayFixSweep → seleciona uma tx CC SALE ERROR órfã (conta 220)

> **Setup autorizado (Exceção 3):** garante conta 220 ACTIVE e INSERT de uma
> `uown_sv_credit_card_transaction` `status='ERROR'`, `cc_action='SALE'`, `cc_transaction_type='SCHEDULED'`,
> `posting_date=CURRENT_DATE`, `gateway_transaction_id=''` (órfã — sem id de gateway). O fix re-submete
> a tx ao gateway, o que **exige o connector** (ausente no dev3) — portanto o gate determinístico é
> **seleção pelo SQL do sweep + mecanismo (`sweep_log`)**, NÃO a re-submissão em si. O desfecho
> completo (tx corrigida/re-submetida) só é verificável onde há gateway real (stg/prod).

```gherkin
Dado que uma transação CC SALE em ERROR sem gateway id, com posting hoje, foi inserida para a conta 220 (setup autorizado Exceção 3)
E a transação é selecionada pelo SQL de seleção real do paymentGatewayFixSweep
Quando paymentGatewayFixSweep é disparado
Então a linha de sweep_log é criada (contrato base — mecanismo)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup autorizado (conta ACTIVE) | `UPDATE uown_sv_account SET account_status='ACTIVE' WHERE pk=220` | `spec:246` |
| Setup autorizado (tx órfã) | INSERT retorna `txPk`; `expect(txPk).toBeGreaterThan(0)` — ERROR/SALE/SCHEDULED, posting hoje, `gateway_transaction_id=''` para conta 220 | `spec:247-257` |
| Elegibilidade via SQL real do sweep | `sweepSelects(db, 'paymentGatewayFixSweep', String(txPk))` truthy — lê `sql_to_pick_accounts` e confirma que `txPk` está no resultado | `spec:260-264,38-47` |
| Mecanismo `sweep_log` (gate) | contrato base — a re-submissão precisa do connector; seleção + mecanismo são o gate | `spec:266-270` |

```sql
-- Validação DB CT-S6 (substituir $tx_pk): a tx órfã DEVE ser selecionável pelo SQL do sweep
--   (executar o texto de uown_scheduled_task.sql_to_pick_accounts do paymentGatewayFixSweep
--    e confirmar que $tx_pk aparece no resultado — ver helper sweepSelects, spec:38-47)
SELECT pk, status, cc_action, gateway_transaction_id
  FROM uown_sv_credit_card_transaction WHERE pk = $tx_pk;
-- Esperado: status='ERROR', cc_action='SALE', gateway_transaction_id='' (órfã elegível)
```

> **Por que sem asserção de desfecho (Regra #10):** o `paymentGatewayFixSweep` re-submete a tx ao
> gateway, que não existe no dev3; asseverar "tx corrigida" seria um red-assert dependente de infra
> ausente. O contrato honesto no dev3 é **seleção + mecanismo**; o desfecho de correção real é
> `[HYPOTHESIS]` até verificação em ambiente com connector. Fonte: `spec:237-239,266-270`.

---

## Log de Atividade (Regra #13)

Para esta família, a **própria linha de fila/documento é o log da ação de dispatch** — não há nota
textual separada em `uown_los_lead_notes`:

- **S1/S2/S3/S4** — a transição de status da linha (`email_queue`/`sms_queue`/`esign_document` saindo
  do status de entrada) É a evidência de que o documento/e-mail/SMS/esign foi despachado pelo pipeline.
- **S5** — a mudança de `uown_sv_account.rating` (`P → NULL`) É o registro observável da remoção da
  rating letter.
- **S6** — a seleção da tx pelo SQL do sweep + a linha `uown_sweep_logs` são o registro de que o
  mecanismo de fix executou.

A linha `uown_sweep_logs` é o registro de que o sweep executou (Regra #13 satisfeita no nível de
scheduled task para os 6). Não há `uown_correspondence_logs` gating neste spec — diferente do
`business-sweeps-servicing` (S2 lá), estes sweeps de dispatch validam o desfecho pela transição de
status da fila, não pela nota de correspondência.

---

## Pré-condições

- **Ambiente dev3** (`ENV=dev3`, `spec:26,28-29`) — as contas 219 (S5) e 220 (S6) e a estratégia
  "linha mais recente da fila" (S1/S2/S3/S4) são específicas do sandbox descartável dev3. Em ambiente
  compartilhado (qa1), usar as funções de descoberta dinâmica de idle records + `restore*` de
  `sweep-fixture.helpers.ts` (não usadas por ESTE spec — só `sweepLogBaseline`/`triggerAndWaitSweepLog`
  são importados aqui, `spec:33`, mas parte do mesmo módulo `covers`).
- **Mutações DB (Exceção 3):** os 6 CTs dependem de INSERT/UPDATE autorizados pelo usuário para criar
  a entrada elegível no dev3 (`spec:22-23`). Sem essa autorização, os CTs não têm entrada elegível.
  `SELECT` (leitura) é sempre permitido.
- **Modo serial obrigatório** (`spec:74`) — S1 e S4 mutam a mesma "linha mais recente" de
  `uown_email_queue`; rodar em paralelo faria os dois brigarem pela mesma linha. S5 usa a conta 219 e
  S6 a conta 220 (contas distintas para não colidir).
- **Sem preflight de merchant** — estes sweeps operam sobre filas/documentos/contas existentes, não
  criam aplicações; a hierarquia de dados frescos (Regra #9) cede legitimamente ao input elegível
  semeado via Exceção 3 (documentado `spec:22-23`), sem criar aplicação fresca.
- **Guard de disponibilidade em S1/S2/S3/S4** (`test.skip` quando `targetPk === 0`, `spec:86,114,142,174`):
  no dev3 vazio de filas/esign, o CT pula honestamente em vez de falhar (Regra #10).

---

## Gaps / [HYPOTHESIS] / cobertura fina

- **Status-alvo imediato NÃO é asseverado (S1/S2/S3/S4).** O gate é "saiu do status de entrada"
  (`waitForStatusToLeave`, `spec:49-69`), não o status-alvo exato. Os alvos nomeados
  (`PICKED_TO_STORE`/`STORED` para S1/S2; `STATUS_UPDATE` para S3; `PICKED_TO_BE_SENT` para S4) vêm dos
  **comentários do spec** (`spec:10-15,77,105,133,164`), NÃO das asserções — são `[HYPOTHESIS]` quanto
  ao valor exato do enum. Cross-check em `appendix-d-constantes-enums.md` antes de reusar os nomes de
  status em outro contexto. Cobertura do desfecho fino de status: **parcial por design** (evita
  flakiness do worker downstream que avança a linha mais um passo dentro da mesma janela).
- **S6 é mechanism+selection-only no dev3** (não `[HYPOTHESIS]` — comportamento de ambiente
  documentado): a re-submissão ao gateway exige o connector (ausente no dev3), então a **correção real
  da tx não é asseverada** aqui. O ramo de negócio completo (tx re-submetida/corrigida) só é
  verificável em **stg/prod**. Flag para o orquestrador considerar um run em stg.
- **S3 no dev3 não tem provedor de esign real** — a linha pode avançar `SIGNED → STATUS_UPDATE → ERROR`
  dentro da janela (`spec:154-156`); por isso o gate é "saiu de SIGNED", não o status final. O
  desfecho de negócio real (esign completado sincronizado com sucesso) é `[HYPOTHESIS]` no dev3.
- **Cobertura de negócio forte: S1, S2, S4, S5.** S5 é a mais determinística (rating `P → NULL`
  asseverada diretamente, `spec:224-233`); S1/S2/S4 asseveram a saída determinística do status de
  entrada da fila. S3 e S6 têm o desfecho final degradado por limitação de ambiente (esign/connector),
  com o mecanismo + elegibilidade como gate honesto.
- **Semântica/mapeamento nome-do-sweep → tabela** confirmado contra `11-administracao.md` (catálogo
  34.20/34.21/34.31/34.32/34.34/34.67) neste backfill; o SQL de seleção real vive em
  `uown_scheduled_task.sql_to_pick_accounts` (lido em runtime por `sweepSelects` para S5/S6). Volatile —
  cross-check a fonte primária (`11-administracao.md`) antes de reusar o mapeamento em outro ambiente.

---

**Skills loaded:** `.claude/skills/test-scenarios/SKILL.md`

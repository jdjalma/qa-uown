---
operation: servicing-report-sweeps
description: Smoke de execução dos 17 sweeps de GERAÇÃO DE RELATÓRIO do Servicing (daily/weekly/monthly funding/funded/refund/refunded, consolidated funding, merchant-lease, due-date-moves, export-blacklist, danielJewelers lead, sharepoint payments, rerun ACH weekly, past-due EPO pool, monitor, monthly tax, Vervent onboarding file). Cada sweep é uma tarefa agendada (Quartz) disparada via POST /uown/svc/triggerScheduledTask/{name} que roda uma query e despacha o resultado a um sink EXTERNO (e-mail, SharePoint, S3, canal de monitoramento) — não há linha de negócio consultável para asseverar. A cobertura determinística é: (1) TRIGGER aceito (HTTP 200); (2) EXECUÇÃO sem erro (nova linha em uown_sweep_logs — pega SQL quebrado / tabela dropada / migration ruim que falharia silenciosamente em produção); (3) classificação do error column (provisioning vs product) apenas observacional. SEM superfície de UI — sweep admin/ops (Regra #14 exceção a). A observabilidade é a linha de log de execução no DB.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/report-sweeps-servicing.spec.ts
  - src/helpers/sweep-fixture.helpers.ts
  - src/api/clients/scheduled-task.client.ts
---

# Oracle BDD — Report Sweeps (Servicing, smoke de execução)

> **Natureza (UI/API/DB):** operação **admin/ops de tarefa agendada, SEM superfície de UI**. Cada sweep é uma tarefa Quartz disparada por `POST /uown/svc/triggerScheduledTask/{name}` — nenhum agente/cliente interage com ela por tela de portal. A **Regra #14 exceção (a)** (endpoints admin/ops sem afordância de UI, exatamente como `PATCH /uown/svc/gowsign-templates/{id}` e demais `triggerScheduledTask`) se aplica: NÃO é violação de UI-first porque não existe render a validar visualmente — o relatório é despachado a um sink externo (e-mail, SharePoint, S3, canal de monitoramento), não renderizado em portal. A observabilidade é a **linha de execução em `uown_sweep_logs`** (setup via API — o trigger; asserção via DB — a linha de log). **A Regra #19 (registro de oracle) continua valendo mesmo assim** — decisão explícita do usuário 2026-07-02: sweeps são isentos da UI-first (#14a) mas NÃO da obrigação de oracle registrado (#19). Este arquivo satisfaz #19 para os 17 report sweeps.
>
> **Gatilho:** qualquer operação que dispare um dos 17 report sweeps via `api.scheduledTask.triggerScheduledTask(name)` / `POST /uown/svc/triggerScheduledTask/{name}`, OU **rodar** `report-sweeps-servicing.spec.ts` — rodar o spec É executar as operações que ele exercita (Regra #19), incluindo o disparo de todos os 17 sweeps e as queries de baseline/poll em `uown_sweep_logs`. Lista dos sweeps cobertos (`spec:38-56`): `dailyFundingReportSweep`, `dailyFundedReportSweep`, `dailyRefundReportSweep`, `dailyRefundedReportSweep`, `weeklyFundingReportSweep`, `monthlyFundingReportSweep`, `monthlyConsolidatedFundingReportSweep`, `generateMerchantLeaseReport`, `generateDueDateMovesReport`, `generateExportBlacklistReport`, `danielJewelersLeadReportSweep`, `sendDailyPaymentsSharepointSweep`, `rerunACHWeeklyReport`, `pastDueEpoPoolAmountReportSweep`, `monitorSweep`, `monthlyTaxReportSweep`, `generateVerventOnBoardingFileSweep`.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/report-sweeps-servicing.spec.ts \
>   src/helpers/sweep-fixture.helpers.ts \
>   src/api/clients/scheduled-task.client.ts
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (DB `127.0.0.1:5445`, SVC API `svc-dev3`) — `spec:29`. Comando (`spec:31-32`):
> ```bash
> ENV=dev3 node node_modules/@playwright/test/cli.js test \
>   tests/e2e/servicing/report-sweeps-servicing.spec.ts --reporter=list --timeout=300000
> ```
> Tag: `@regression` (`buildTags(TestTag.REGRESSION)`, `spec:60`). Timeout do teste: 300 s (`spec:64`).
>
> **Natureza read-only deste spec (diferente dos outros sweep specs):** este spec NÃO muta estado — apenas dispara os sweeps e lê `uown_sweep_logs`. Do `sweep-fixture.helpers.ts` ele importa **somente `sweepLogBaseline`** (`spec:35`) — não usa nenhuma das discovery/restore/pause helpers (`findIdleActiveAccount*`, `restore*`, `triggerPossiblyPausedSweep`). Não há `afterAll`/teardown de restauração porque nada foi mutado. As Exception-3 UPDATEs que vivem naquele helper NÃO são exercidas por este caminho.
>
> **Escopo — este é o smoke de EXECUÇÃO, não de CONTEÚDO (sem overlap com o funding-report spec):** este oracle cobre "o sweep dispara e roda até o fim sem crashar" (trigger aceito + linha de log + sem exceção de SQL). Ele NÃO valida o CONTEÚDO de nenhum relatório (linhas/colunas/valores do arquivo gerado). A validação de conteúdo do relatório diário de Funding/Funded/Refund é uma feature SEPARADA, coberta por `funding-refund-report-content-sweeps-servicing.spec.ts` (oracle próprio). Os 4 nomes `dailyFunding/Funded/Refund/RefundedReportSweep` aparecem em ambos os specs, mas em **capacidades distintas** (smoke-existência aqui vs correção-de-conteúdo lá) — não é duplicata; é o split legítimo "smoke-de-todos" vs "conteúdo-de-um" (regra de escopo de oracle: uma feature por arquivo). Se algum dia este spec passar a asseverar linhas/colunas de um relatório, revisar esta nota.

---

## CT-01 — Todos os 17 report sweeps aceitam o trigger (HTTP 200)

> Ramo positivo (mecanismo de disparo). Prova que cada tarefa agendada existe e é acionável via o endpoint admin de trigger. Asserção HARD por sweep (`spec:79`).

```gherkin
Dado que o ambiente dev3 tem os 17 report sweeps registrados como tarefas agendadas
E o baseline MAX(pk) de uown_sweep_logs foi capturado para cada sweep antes do disparo
Quando cada um dos 17 report sweeps é disparado pelo endpoint admin de tarefa agendada
Então cada disparo é aceito com HTTP 200
E nenhum sweep retorna um status diferente de 200 (um trigger recusado significa tarefa ausente ou nome de Quartz renomeado)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Baseline pré-disparo por sweep | `sweepLogBaseline(db, name)` = `SELECT COALESCE(MAX(pk),0) FROM uown_sweep_logs WHERE sweep_name = $1` capturado para os 17 nomes ANTES de qualquer trigger (monotonicidade do pk é a base do "nova linha") | `spec:68-73`; `sweep-fixture.helpers.ts:47-52` |
| Trigger aceito por sweep (HARD) | `api.scheduledTask.triggerScheduledTask(name)` → `resp.status === 200` para CADA um dos 17 sweeps; falha em qualquer um falha o teste | `spec:76-82`; `scheduled-task.client.ts:24-25` (`POST /uown/svc/triggerScheduledTask/{name}`) |
| Contagem de sweeps disparados | os 17 nomes de `REPORT_SWEEPS` (`spec:38-56`) são todos disparados no laço | `spec:77-81` |

```sql
-- Baseline CT-01 (por sweep_name, antes do disparo) — projeção read-only
SELECT COALESCE(MAX(pk), 0) AS baseline
  FROM uown_sweep_logs
 WHERE sweep_name = $1;  -- ex.: 'dailyFundingReportSweep'
```

---

## CT-02 — A maioria (>= 60%) produz uma nova linha de execução em `uown_sweep_logs`

> Evidência de EXECUÇÃO sem erro. Uma nova linha de log acima do baseline prova que o sweep rodou sua query até o fim (pega SQL quebrado / coluna renomeada / tabela dropada / migration ruim que falharia silenciosamente em prod). O gate é **>= 60%** (não 100%) porque report sweeps são lentos (geração de arquivo/e-mail) e alguns podem exceder a janela de 180 s — isso é `[OBSERVAÇÃO]`, não falha. Asserção HARD sobre a contagem (`spec:143-146`).

```gherkin
Dado que os 17 report sweeps foram disparados com HTTP 200 (CT-01)
Quando o teste faz poll em uown_sweep_logs por uma nova linha (pk acima do baseline) de cada sweep, numa janela compartilhada de 180 segundos
Então ao menos 11 dos 17 sweeps (>= 60%) produzem uma nova linha de log de execução dentro da janela
E os sweeps que não logaram dentro de 180 s são reportados como observação (geração lenta de arquivo/e-mail — trigger já aceito com 200), não como falha
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecânica do poll | janela COMPARTILHADA de 180 s (`Date.now() + 180_000`); a cada iteração lê `SELECT COALESCE(MAX(pk),0) FROM uown_sweep_logs WHERE sweep_name = $1` e considera "logado" quando `latest > baseline`; sweeps pendentes re-testados a cada 3 s | `spec:87-102` |
| Gate de execução (HARD) | `expect(logged.length).toBeGreaterThanOrEqual(Math.ceil(17 * 0.6))` → **>= 11** dos 17 devem ter linha fresca | `spec:142-147` |
| Sweeps não logados = observação, NÃO falha | os pendentes vão para `notLogged` e são reportados via `console.log` como `[OBSERVAÇÃO]` (geração lenta) — Regra #10: nunca red-assert por lentidão de sink externo | `spec:103-108` |

```sql
-- Evidência de execução CT-02 (por sweep, após o disparo) — nova linha acima do baseline
SELECT pk, sweep_name, error, number_of_records_processed, row_created_timestamp
  FROM uown_sweep_logs
 WHERE sweep_name = $1
   AND pk > $2  -- baseline capturado no CT-01
 ORDER BY pk DESC
 LIMIT 1;
-- Esperado (para >= 11 dos 17): ao menos uma linha nova (pk > baseline)
```

> **Por que 60% e não 100% (Regra #10):** o gate deliberadamente tolera até 6 sweeps sem log na janela para não ficar flaky por conta de geração lenta de arquivo/e-mail em sinks externos. Um sweep que só passa do limite de 180 s ainda aceitou o trigger (HTTP 200 asseverado no CT-01) — o não-log é sinal de latência do sink, não de SQL quebrado. Fonte: `spec:16-18,138-146`.

---

## CT-03 — Classificação do `error` column: provisioning gap vs product exception `[OBSERVAÇÃO — não-gating]`

> Uma linha de `uown_sweep_logs` NÃO é, por si só, prova de sucesso — ela pode carregar um `SQLGrammarException` (tabela/coluna ausente em dev3) ou uma exceção de código. Este passo **lê e classifica** o `error` de cada sweep logado e reporta honestamente via `console.log`. **É observacional: NÃO há `expect()` aqui** — nada neste CT falha o teste. Provisioning gaps (ambiente) e product errors são escalados a dev, não tratados como falha de teste. Marcado `[OBSERVAÇÃO]` conforme Regra #10.

```gherkin
Dado que um sweep produziu uma nova linha em uown_sweep_logs (CT-02)
Quando o error column da linha mais recente daquele sweep é lido e classificado
Então uma mensagem de "relation/column does not exist" é reportada como PROVISIONING GAP (dev3 — validar em stg), não como bug
E uma mensagem informacional/de-ambiente (No transactions found, FAIL : N, Failed to send, TaxCloud, Bearer, gateway/processor/connector) é ignorada como ruído de ambiente esperado
E qualquer outra exceção de código é reportada como [OBSERVAÇÃO — possível product issue] para revisão de dev, sem falhar o teste
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Leitura do error por sweep logado | `SELECT error FROM uown_sweep_logs WHERE sweep_name = $1 AND pk > $2 ORDER BY pk DESC LIMIT 1` para cada nome em `logged` | `spec:116-121` |
| Bucket PROVISIONING | `error` casa `/relation "(\w+)" does not exist\|column ([\w.]+) does not exist/i` → reportado como `[PROVISIONING GAP — dev3] ... (validate in stg)` (console) | `spec:123-125,130-132` |
| Bucket ENVIRONMENT (ignorado) | `error` casa `/No transactions found\|No recoveries found\|FAIL : \d+\|Failed to send\|TaxCloud\|Bearer \|gateway\|processor\|connector/i` → não reportado (ruído de ambiente esperado) | `spec:126` |
| Bucket PRODUCT `[OBSERVAÇÃO]` | qualquer outro `error` não-vazio → `[OBSERVAÇÃO — possible product issue]` (console) | `spec:127,133-135` |
| **Não-gating** | nenhum `expect()` neste passo; provisioning + product são apenas reportados, jamais falham o teste (escalados a dev) | `spec:113-136,140-141` |

> **Nota sobre a helper `classifySweepError`:** `sweep-fixture.helpers.ts:85-92` expõe a MESMA taxonomia (`clean`/`provisioning`/`environment`/`product`) como função reutilizável. Este spec, porém, faz a classificação **inline** (`spec:123-127`) em vez de chamar a helper — a lógica é equivalente (mesmos regexes), mas se a helper for atualizada, este inline NÃO acompanha automaticamente. `[HYPOTHESIS]` de que os dois permanecem em sincronia; ver [Gaps](#gaps--hypothesis).

---

## Log de Atividade (Regra #13)

Report sweeps são tarefas agendadas SEM entidade de negócio (lead/account) — não gravam nota em `uown_los_lead_notes`. O **log de execução equivalente** exigido pela Regra #13 ("sem log, nada aconteceu") é a própria **linha em `uown_sweep_logs`** asseverada no CT-02: ela é a prova, com timestamp, de que o sweep rodou. A ausência de nova linha para um sweep (dentro do gate de 60%) é justamente o que o teste detecta. Não há segundo log a validar além deste — o "activity log" de um report sweep É o `uown_sweep_logs` row.

---

## Pré-condições

- **Ambiente dev3** com os 17 report sweeps registrados como tarefas agendadas Quartz (`spec:29`).
- **Sem preflight de merchant / sem criação de aplicação (Regra #12 N/A):** este spec não cria lead/account nem muta config de merchant — apenas dispara sweeps e lê logs. `createPreQualifiedApplication`/`ensureMerchantReady` NÃO se aplicam.
- **Sem `runId`/`email` (Regra #9 — exceção documentada):** nenhum dado de aplicação é gerado; o teste opera sobre a infraestrutura de sweeps existente. A isolação vem do baseline monotônico de pk por sweep (cada run só considera linhas `pk > baseline`), não de e-mail único.
- **Timeout estendido:** `test.setTimeout(300_000)` (`spec:64`) — report sweeps geram arquivo/e-mail e são lentos; a janela de poll compartilhada é 180 s (`spec:88`).
- **Fixture `db`** conecta em `process.env.ENV` → rodar com `ENV=dev3` para as queries de `uown_sweep_logs` baterem em dev3.

---

## Gaps / [HYPOTHESIS]

- **Sem validação de CONTEÚDO do relatório.** Este smoke prova apenas que o sweep roda sem crashar (trigger 200 + linha de log + sem SQLGrammarException). Ele NÃO abre o arquivo/e-mail gerado nem verifica linhas/colunas/valores. Correção de conteúdo do relatório diário Funding/Funded/Refund é cobertura SEPARADA (`funding-refund-report-content-sweeps-servicing.spec.ts`). Se o PO exigir asserção de conteúdo dos demais 13 report sweeps, é trabalho de spec novo — não coberto aqui.
- **Classificação inline vs helper `classifySweepError` — `[HYPOTHESIS]` de sincronia.** O CT-03 replica a taxonomia de erro inline (`spec:123-127`) em vez de chamar `classifySweepError` (`sweep-fixture.helpers.ts:85-92`). Os regexes conferem hoje, mas uma edição futura da helper não propaga ao inline. Consolidar o inline para usar a helper eliminaria o risco de drift (Regra #2 — sem duplicata).
- **CT-03 é não-gating por design.** Provisioning gaps e product exceptions são reportados só via `console.log` e NÃO falham o teste (`spec:140-141`). Isso é correto para um smoke em ambiente inferior (dev3 não é migrado como stg/prod), mas significa que uma regressão de produto que caia no bucket "product" NÃO quebra o CI — ela apenas aparece no log da run. `[OBSERVAÇÃO]`: se o objetivo for gate rígido de saúde de produto, promover o bucket "product" a `expect(productErrors).toHaveLength(0)` seria uma mudança de spec (fora do escopo deste backfill).
- **`number_of_records_processed` NÃO é asseverado.** A DATA AVAILABILITY mencionada no cabeçalho do spec (`spec:11`, "the report's underlying query returns rows") NÃO tem asserção correspondente no corpo do teste — não há `expect` sobre a contagem de registros processados. O smoke se limita a trigger-200 + existência-de-linha. `[OBSERVAÇÃO]`: a "data availability" descrita no comentário é aspiracional, não testada.
- **Sem cobertura de UI (esperado).** Report sweeps não têm afordância de portal (Regra #14a). Se o produto algum dia expuser esses relatórios numa tela do Servicing/AMS (ex.: aba de downloads de relatório), adicionar um CT de render e revisar a nota "sem superfície de UI" no cabeçalho (Regra #18).

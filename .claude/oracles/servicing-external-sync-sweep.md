---
operation: servicing-external-sync-sweep
description: Cobertura de **trigger-acceptance** (HTTP 200) para os 7 sweeps de sincronização com sistemas de terceiros / operações sem saída de DB determinística em dev3 — TaxCloud (dailyTaxCloudPaymentsSync, dailyTaxCloudRefundsSync, updateTaxRatesSweep), TrustPilot (refreshTrustPilotAccessKeySweep), ativação/desativação de programa (MerchantProgramActivationDeactivationSweep, ProgramActivationDeactivationSweep) e redistribuição do pool de EPO (redistributeDelinquentEpoPoolSweep). São tarefas agendadas Quartz disparadas via `POST /uown/svc/triggerScheduledTask/{name}` (admin/ops, SEM superfície de UI — Regra #14 exceção (a)). A única asserção determinística e honesta neste ambiente é que o endpoint de trigger ACEITA a tarefa (HTTP 200), o que pega uma tarefa removida/renomeada ou uma rota admin quebrada. Uma nova linha em `uown_sweep_logs`, quando aparece, é reportada como [OBSERVAÇÃO] não-gatilho (o sync externo é no-op em dev3 e frequentemente não loga na janela do teste).
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/external-sync-sweeps-servicing.spec.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/11-administracao.md
  - docs/business-rules/09-integracoes-externas.md
  - docs/business-rules/appendix-a-integracoes.md
---

# Oracle BDD — External-Sync Sweeps (Servicing, trigger-acceptance)

> **Natureza (UI/API/DB):** operação de **tarefa agendada / admin-ops, SEM superfície de UI**. Não há tela, botão ou badge no portal Servicing que dispare estes sweeps — eles rodam por cron Quartz no backend e só são acionáveis manualmente via `POST /uown/svc/triggerScheduledTask/{name}` (`scheduled-task.client.ts:24-26`; `11-administracao.md:117`). A **Regra #14 exceção (a)** (endpoints admin/ops sem UI exposta) se aplica: NÃO é uma violação da UI-first, pois não existe fluxo de portal a exercer nem render a validar visualmente. **A Regra #19, porém, continua valendo** — a operação exige um oráculo registrado, mesmo sem UI. Decisão explícita do usuário 2026-07-02: "sweeps precisam de oráculo mesmo sem UI? SIM". Este oráculo é, por natureza, **API-trigger + DB-observe-only** — a ausência de passos Gherkin de UI é esperada e correta, não uma lacuna.
>
> **Gatilho:** qualquer operação que dispare um destes 7 sweeps via `triggerScheduledTask`, OU **rodar** `external-sync-sweeps-servicing.spec.ts` — rodar o spec É executar as operações que ele exercita (Regra #19), a saber: a captura de baselines em `uown_sweep_logs`, os 7 POSTs de trigger e a observação best-effort de novas linhas de log.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/external-sync-sweeps-servicing.spec.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/11-administracao.md \
>   docs/business-rules/09-integracoes-externas.md \
>   docs/business-rules/appendix-a-integracoes.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **dev3** (DB `127.0.0.1:5445`, SVC API `svc-dev3`). O worker fixture `db` conecta em `process.env.ENV` → rodar com `ENV=dev3`. Comando (`spec:24-25`):
> ```bash
> ENV=dev3 node node_modules/@playwright/test/cli.js test \
>   tests/e2e/servicing/external-sync-sweeps-servicing.spec.ts --reporter=list --timeout=300000
> ```
> `test.setTimeout(180_000)` (`spec:44`); a janela compartilhada de observação de logs é de 30 s (`spec:69`).
>
> **O que "external sync" significa aqui (confirmado do código, `spec:5-16`):** um sweep cujo trabalho é um **push/pull para um sistema de TERCEIRO** ou uma operação de ativação-de-programa / pool-de-EPO que **não produz um resultado de DB observável em dev3** (sem conexão externa, dados no-op). Os 7 sweeps e seu destino externo:
>
> | Sweep (`EXTERNAL_SWEEPS`, `spec:30-38`) | Destino / natureza | Fonte canônica |
> |---|---|---|
> | `dailyTaxCloudPaymentsSync` | Push das alocações de pagamento do dia ao **TaxCloud** (compliance fiscal), 10 threads | `11-administracao.md:406-411` |
> | `dailyTaxCloudRefundsSync` | Push dos refunds do dia ao **TaxCloud** (ajuste fiscal), 5 threads | `11-administracao.md:413-418` |
> | `updateTaxRatesSweep` | Atualiza as alíquotas de imposto (mensal, último dia do mês) | `11-administracao.md:420-424` |
> | `refreshTrustPilotAccessKeySweep` | Renova as credenciais da API do **TrustPilot** (token) | `11-administracao.md:607-611`; `appendix-a-integracoes.md:51` |
> | `MerchantProgramActivationDeactivationSweep` | Ativação/desativação de programa de merchant `[HYPOTHESIS]` | ver [Gaps](#gaps--hypothesis) |
> | `ProgramActivationDeactivationSweep` | Ativação/desativação de programa `[HYPOTHESIS]` | ver [Gaps](#gaps--hypothesis) |
> | `redistributeDelinquentEpoPoolSweep` | Rebalanceia a reserva do pool de EPO para contas inadimplentes | `11-administracao.md:460-464` |
>
> Este spec fecha o inventário de sweeps ativos em **57/57** com ao menos cobertura de trigger-acceptance (`spec:17`).
>
> **Por que só HTTP 200 é gatilho (Regra #10):** estes sweeps não podem ser asseverados sobre uma linha de negócio nem sobre uma mudança de estado determinística em dev3 — não há conexão externa (TaxCloud/TrustPilot) nem dados que gerem outcome. A ÚNICA verificação honesta e determinística é que a tarefa é aceita pelo agendador (`spec:6-9`). Asseverar uma linha de `uown_sweep_logs` como gatilho aqui produziria flakes (external sync = no-op, quase nunca loga na janela de 30 s) — por isso a observação de log é explicitamente **não-gatilho** (`spec:67`).

---

## CT-01 — Todos os 7 external-sync sweeps aceitam o trigger (HTTP 200)

> Ramo positivo e ÚNICA asserção com gatilho (`expect`) do spec. Cada sweep é uma **classe de equivalência** de "tarefa agendada externa/no-op"; um 200 prova que a tarefa Quartz está registrada e a rota admin responde. Um não-200 pega uma tarefa removida/renomeada ou uma rota admin quebrada (`spec:8-9,62`).

```gherkin
Dado que o ambiente dev3 tem os 7 external-sync sweeps registrados como tarefas agendadas Quartz
E o valor máximo de pk em uown_sweep_logs por sweep_name foi capturado como baseline
Quando cada external-sync sweep é disparado individualmente pelo endpoint de trigger de tarefa agendada
Então cada disparo retorna HTTP 200, confirmando que a tarefa está registrada e a rota admin responde
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Lista exata de sweeps disparados | os 7 nomes de `EXTERNAL_SWEEPS`: `dailyTaxCloudPaymentsSync`, `dailyTaxCloudRefundsSync`, `updateTaxRatesSweep`, `refreshTrustPilotAccessKeySweep`, `MerchantProgramActivationDeactivationSweep`, `ProgramActivationDeactivationSweep`, `redistributeDelinquentEpoPoolSweep` | `spec:30-38` |
| Captura de baseline (pré-trigger, não-gatilho) | por sweep: `db.getSingleNumber("SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $1", [name])` | `spec:47-57`; `database.helpers.ts:248` |
| Endpoint de trigger | `api.scheduledTask.triggerScheduledTask(name)` → `POST /uown/svc/triggerScheduledTask/{name}` | `spec:61`; `scheduled-task.client.ts:24-26` |
| **Asserção gatilho (a única)** | `expect(resp.status).toBe(200)` para CADA um dos 7 sweeps — mensagem "triggerScheduledTask {name} must return 200 (task registered)" | `spec:62` |
| Iteração completa | o laço percorre TODOS os 7 (nenhum `break`/skip antecipado); um único não-200 falha o teste | `spec:60-64` |

```sql
-- Baseline / observação read-only CT-01 (substituir $name) — projeção usada pelo spec
SELECT COALESCE(MAX(pk), 0) FROM uown_sweep_logs WHERE sweep_name = $name;
-- CT-01 NÃO assevera esta query; o gatilho é o HTTP 200 do trigger.
```

---

## CT-02 — Observação best-effort de novas linhas de sweep_log ([OBSERVAÇÃO], não-gatilho)

> Passo explicitamente **não-gatilho** (`spec:67`) — NÃO contém `expect`. Após uma janela compartilhada de 30 s, o spec reconta `MAX(pk)` por sweep e reporta quantos logaram uma linha nova acima do baseline. Como o sync externo é no-op em dev3, a maioria NÃO loga — por isso o resultado é registrado como `[OBSERVAÇÃO]` via `console.log`, jamais como falha (Regra #10: não red-assert em rota env-dependente/não-determinística).

```gherkin
Dado que os 7 external-sync sweeps foram disparados e aceitos com HTTP 200
Quando uma janela compartilhada de observação decorre e o máximo de pk de uown_sweep_logs por sweep é reconsultado
Então cada sweep cujo máximo de pk subiu acima do baseline é registrado como observação de log presente
E os sweeps que não logaram são registrados como no-op esperado em dev3, sem falhar o teste
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Janela de observação | espera compartilhada de `30_000` ms antes da releitura (não é polling gatilho; delay de propagação documentado) | `spec:69` |
| Releitura por sweep | `db.getSingleNumber("SELECT COALESCE(MAX(pk),0) FROM uown_sweep_logs WHERE sweep_name = $1", [name])` | `spec:72-75` |
| Critério de "logou" | `latest > (baseline ?? 0)` → nome entra na lista `logged` | `spec:76` |
| Natureza do resultado | `console.log("[external-sync] [OBSERVAÇÃO] logged N/7 ...")` — **sem `expect`**; N=0 é resultado válido ("external sync é no-op em dev3") | `spec:78` |
| Classificação | qualquer divergência (0 logs, N logs) é `[OBSERVAÇÃO]`, NUNCA `[BUG]` auto-confirmado | `spec:18-19,67` |

---

## Log de Atividade (Regra #13)

Estes sweeps são operações de **sistema/admin sem lead** — não geram nota de atividade em `uown_los_lead_notes` (não há lead nem account no fluxo). O trilho de auditoria nativo de um sweep é uma linha em **`uown_sweep_logs`** (`sweep_name`), verificada no CT-02. Contudo, para os external-sync sweeps essa linha é **não-determinística em dev3** (sync externo = no-op, quase nunca loga na janela de 30 s) — por isso a Regra #13 é satisfeita aqui apenas em base **best-effort/[OBSERVAÇÃO]**, não como asserção gatilho. `[HYPOTHESIS]`: em um ambiente com conexão externa real (stg/prod), espera-se uma linha `uown_sweep_logs` por execução — não asseverável a partir de dev3 com este spec. A verificação operacional canônica de cada sweep é "checar os logs do TaxCloud / submissões / erros de sync" (`11-administracao.md:411,418,131`), fora do alcance de uma asserção de DB em dev3.

---

## Pré-condições

- **Ambiente dev3** com os 7 sweeps registrados no Quartz (`ENV=dev3`; DB `127.0.0.1:5445`, SVC `svc-dev3`). Fonte: `spec:22`.
- **Fixtures `api` + `db`** de `@support/base-test.js`; `api.scheduledTask` é o `ScheduledTaskClient`. Fonte: `spec:27,43`.
- **SEM merchant preflight, SEM criação de lead/account** — a operação não toca dados de aplicação; a Regra #12 (preflight de merchant) não se aplica a um sweep sem lead. `runId`/`email` legitimamente omitidos (nenhuma aplicação criada), análogo à exceção documentada em `.claude/rules/testing.md` (§ testData — GDS bypass).
- **Tag:** `buildTags(TestTag.REGRESSION)` → suíte de regressão. Fonte: `spec:40`.
- **Sem mutação de estado compartilhado gatilho** — diferente de `createOrUpdateScheduledTask` (que reescreve `sqlToPickAccounts` e exige restore em try/finally), `triggerScheduledTask` apenas dispara a tarefa; nenhum restore é necessário. Fonte: `scheduled-task.client.ts:24-26,38-42`.

---

## Gaps / [HYPOTHESIS]

- **HTTP 200 prova registro/rota, NÃO sucesso do sync externo.** Um 200 confirma que a tarefa Quartz existe e que a rota admin responde — NÃO que o push ao TaxCloud/TrustPilot foi bem-sucedido, nem que o pool de EPO foi rebalanceado. A validação do outcome real exige inspeção dos logs do vendor / dados externos, fora do alcance de dev3 (`11-administracao.md:411,418`). Cobertura de outcome verdadeiro = trabalho de spec novo em ambiente com conexão externa.
- **`MerchantProgramActivationDeactivationSweep` e `ProgramActivationDeactivationSweep` — semântica `[HYPOTHESIS]`.** Estes dois nomes de tarefa NÃO aparecem no catálogo de sweeps canônico por nome exato (`11-administracao.md`); o adjacente documentado é a mecânica de "Activation/Deactivation" de programa de merchant em `08-funding-merchants.md:123`. O comentário do próprio spec os classifica como "program activation ... que produz NENHUM outcome de DB observável em dev3" (`spec:14`). A descrição "ativação/desativação de programa" é `[HYPOTHESIS]` por analogia; o que É asseverado é somente o trigger-acceptance (HTTP 200), que não depende da semântica.
- **CT-02 é intrinsecamente não-determinístico em dev3.** N=0 logs é o resultado esperado ("external sync é no-op em dev3", `spec:78`). Não use CT-02 como sinal de saúde do sync — apenas de que o sweep, SE logar, o faz sob seu `sweep_name`. Um sinal determinístico de execução exigiria um ambiente com conexão externa real.
- **Sem cobertura de UI (por natureza).** Não há tela de portal para estes sweeps (Regra #14 exceção (a)). Se algum dia o Servicing expuser um botão/painel de "run sweep" com feedback visual, adicionar um CT de UI e revisar a nota "SEM superfície de UI" do cabeçalho (Regra #15/#18).

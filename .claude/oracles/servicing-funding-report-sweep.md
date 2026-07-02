---
operation: servicing-funding-report-sweep
description: Contrato de MECANISMO + corretude do recipient-selector dos 4 daily funding/funded/refund/refunded report sweeps disparados por `api.scheduledTask.triggerScheduledTask(name)` (POST `/uown/svc/triggerScheduledTask/{name}` → 200). Cada sweep grava uma linha em `uown_sweep_logs` (mecanismo comum, `error` classificado provisioning vs environment vs product; no-op limpo processed=0 é PASS) e o `dailyFundingReportSweep` seleciona os merchants destinatários via `sql_to_pick_accounts` lido em runtime de `uown_scheduled_task` (CT-05, self-validating). SEM superfície de UI — scheduled tasks admin/ops (Regra #14 exceção a); observabilidade é a persistência em `uown_sweep_logs` (Regra #14 exceção c). Cobre CT-01..05 + os stubs bloqueados CT-06 (IMAP) / CT-10 (Refunded content).
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts
  - src/helpers/sweep-fixture.helpers.ts
  - src/api/clients/scheduled-task.client.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/08-funding-merchants.md
  - docs/business-rules/appendix-d-constantes-enums.md
---

# Oracle BDD — Funding/Funded/Refund/Refunded Report Sweeps (Servicing) — mecanismo + recipient-SQL

> **Natureza (UI/API/DB): API-trigger + DB-assert. NÃO há superfície de UI.**
> Os 4 report sweeps (`dailyFundingReportSweep` · `dailyFundedReportSweep` ·
> `dailyRefundReportSweep` · `dailyRefundedReportSweep`) são scheduled tasks (Quartz)
> administrativas/ops disparadas por `POST /uown/svc/triggerScheduledTask/{taskName}`
> (`scheduled-task.client.ts`). A Regra #14 exceção (a) — endpoint admin/ops sem UI exposta —
> **isenta estes sweeps do UI-first**; a Regra #14 exceção (c) — validação DB cross-cutting —
> cobre a asserção. O próprio artefato de report **não passa por `uown_email_queue` nem
> `uown_correspondence_logs`** (SPEC Achado-chave 3) → a única evidência DB é `uown_sweep_logs`.
> **Decisão explícita do usuário (2026-07-02): a isenção de UI-first NÃO isenta da Regra #19** —
> todo sweep nomeado exige um oracle registrado. Por isso este oracle é DB/API-only na estrutura,
> sem passos Gherkin de UI. Isso é esperado e correto, não uma lacuna.
>
> ## ⚠️ Split de escopo com `origination-funding-refund-report.md` (nomes de arquivo quase idênticos)
>
> Existem DOIS oracles para a família "funding/refund report". Eles particionam limpo, **sem
> duplicação** — não confunda pelos nomes:
>
> | Oracle | Cobre | Spec | Natureza |
> |---|---|---|---|
> | **`origination-funding-refund-report.md`** (irmão, Tier 3) | **CONTEÚDO via proxy-UI**: grid da Funding Queue (`/funding`, Origination) filtrado por Status, reconciliado contra `uown_funding_transaction.funding_queue_status` (CT-07 FUNDING / CT-08 FUNDED / CT-09 REQUEST_REFUND) + Download CSV | `tests/e2e/origination/funding-refund-report-content-ui-origination.spec.ts` | E2E (browser) + DB-oracle |
> | **`servicing-funding-report-sweep.md`** (ESTE) | **MECANISMO do sweep** (trigger → linha em `uown_sweep_logs`, `error` classificado) + **corretude do recipient-SQL** de `dailyFundingReportSweep` (CT-01..05) + os stubs bloqueados CT-06/CT-10 | `tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts` | API-trigger + DB-assert |
>
> O oracle irmão **deferiu explicitamente** o escopo deste arquivo: *"O mecanismo do sweep + a
> SQL de destinatários (CT-01..05) são API-only e vivem em
> `tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts` — fora do escopo
> deste oracle."* Este oracle é o outro lado desse split. O stub `test.fixme()` do CT-10
> (Refunded content) vive **neste** spec de servicing (não no de origination) — o oracle irmão
> aponta para cá para o CT-10.
>
> **Gatilho:** disparar `triggerScheduledTask(name)` para qualquer um dos 4 nomes de report
> sweep abaixo, OU **rodar** `tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts`
> — rodar o spec É executar as operações que ele exercita (Regra #19). Também dispara este oracle
> qualquer execução manual via MCP de um desses report sweeps no Servicing, ou a leitura runtime
> de `sql_to_pick_accounts` de `uown_scheduled_task` para validar o recipient-selector.
>
> **Nomes de sweep cobertos (case-sensitive — `spec:65-71`):**
> `dailyFundingReportSweep` · `dailyFundedReportSweep` · `dailyRefundReportSweep` ·
> `dailyRefundedReportSweep`.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/servicing/funding-refund-report-content-sweeps-servicing.spec.ts \
>   src/helpers/sweep-fixture.helpers.ts \
>   src/api/clients/scheduled-task.client.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/08-funding-merchants.md \
>   docs/business-rules/appendix-d-constantes-enums.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE — <file> changed since e4713f2]`.
>
> **Ambiente alvo:** **sandbox** primário (SPEC §Test Strategy — `dailyFundingReportSweep` pk30
> ACTIVE lá, cron real). O worker fixture `db` conecta em `process.env.ENV`; rodar com
> `ENV=sandbox`. **Nota de provisioning (para qa-validator, NÃO mudança de código):** o SPEC +
> memória `sticky-refund-tests-sandbox-only` registram o DB tunnel sandbox em `127.0.0.1:5445`
> LIVE (`5446` STALE); `UOWN_DB_URL_SBX` no `.env` aponta hoje para `5446` — se os CTs falharem
> a conexão, apontar o ENV para o tunnel em `5445` ou corrigir a porta do `.env` (config
> compartilhada, não editada aqui). `test.describe.configure({ mode: 'serial' })` (`spec:81`) —
> os 4 CTs de mecanismo disparam sweeps na mesma tabela `uown_sweep_logs`; rodar serial mantém a
> janela de baseline por-sweep inequívoca. Timeout por teste: `setTimeout(120_000)`
> (`spec:104,196`); comando sugerido `--timeout=300000`.
>
> **Base canônica:** SPEC `docs/taskTestingUown/dailyFundingRefundReportSweeps_contentValidation/dailyFundingRefundReportSweeps_contentValidation.spec.md`
> (AC1..AC5 derivados por QA, Achados-chave 1-5, Q1-Q6) · `08-funding-merchants.md` (funding
> queue / funding report) · enum `FundingQueueStatus` em `appendix-d-constantes-enums.md`. Os AC
> deste oracle são **`[AC-DERIVADO POR QA]`** — não há AC do PO (suíte de validação de
> comportamento existente, não feature nova); ver SPEC §AC Coverage.

## Critérios de Aceitação (derivados por QA — SPEC §AC Coverage)

| ID | Critério `[DERIVADO]` | CT |
|---|---|---|
| AC1 | Cada um dos 4 sweeps aceita trigger (HTTP 200) e produz uma linha nova em `uown_sweep_logs` (`pk > baseline`) sem exceção **de produto** | CT-01..04 |
| AC2 | `dailyFundingReportSweep` seleciona **exatamente** os merchants que satisfazem o `sql_to_pick_accounts` vigente (recipient correctness), e cada merchant selecionado satisfaz os guards de elegibilidade de forma independente | CT-05 |
| AC3 | Dado uma txn `FULLY_FUNDED` dated `CURRENT_DATE-1` para TireAgent, o report é enviado e o email/anexo referencia o lease funded | CT-06 (**BLOCKED**) |
| AC4 | Conteúdo Refunded visível casa com o oráculo DB derivado | CT-10 (**BLOCKED**) — split: o conteúdo Funding/Funded/Request-Refund via UI é do oracle irmão |
| AC5 | Report com 0 itens elegíveis → `processed=0` sem `error` (no-op limpo, não crash) é **PASS** | CT-01..04 (empty) + CT-05 (recipient set vazio) |

---

## Mecanismo comum a CT-01..04 — contrato base

> Diferente do `servicing-business-sweeps.md` (que usa o helper compartilhado
> `triggerAndWaitSweepLog`, janela 30s), ESTE spec **inline-a** o trigger + poll com janela de
> **60s** (report sweeps são lentos — geração de arquivo/email, `spec:139-144`). Importa de
> `sweep-fixture.helpers.ts`: `sweepLogBaseline`, `getSweepLogError`, `classifySweepError`
> (`spec:58-62`). Para cada sweep: captura `MAX(pk)` baseline → trigger (200) → poll linha NOVA
> (`pk > baseline`) em 60s → lê e classifica `error`.

```gherkin
Feature: Report sweeps de funding/funded/refund/refunded — mecanismo por sweep
  Como ops/QA administrando o portal Servicing
  Para garantir que cada report sweep dispara, registra sua execução e não crasha
  O operador dispara cada sweep individualmente e inspeciona sua linha em uown_sweep_logs

  Background:
    Dado que o operador está autenticado na API admin do Servicing no ambiente sandbox
    E o baseline MAX(pk) de uown_sweep_logs para o sweep alvo foi capturado antes do disparo

  Scenario Outline: [positive] Cada report sweep dispara, loga e não carrega exceção de produto
    Dado que o baseline MAX(pk) de uown_sweep_logs para "<sweep>" foi capturado
    Quando o operador dispara o sweep "<sweep>"
    Então a resposta HTTP do trigger é 200
    E uma nova linha aparece em uown_sweep_logs com sweep_name "<sweep>" e pk maior que o baseline em até 60s
    E o erro dessa linha é classificado como limpo, environment ou provisioning (nunca product)
    E um no-op limpo (processed=0, sem erro) é aceito como sucesso (AC5)

    Examples:
      | ct    | sweep                    |
      | CT-01 | dailyFundingReportSweep  |
      | CT-02 | dailyFundedReportSweep   |
      | CT-03 | dailyRefundReportSweep   |
      | CT-04 | dailyRefundedReportSweep |

  Scenario: [boundary] dailyFundedReportSweep loga mesmo sem uown_scheduled_task row
    Dado que dailyFundedReportSweep NÃO existe como linha em uown_scheduled_task (selector Java-only, SPEC Achado 2)
    Quando o operador dispara dailyFundedReportSweep
    Então uma nova linha em uown_sweep_logs ainda aparece (o handler roda mesmo sem task registrada)
    E o surgimento de uma uown_scheduled_task row para esse sweep é registrado como [OBSERVAÇÃO] (SPEC Achado 2 pode ter ficado stale)
```

### Oracle (mecanismo — CT-01..04)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Baseline por sweep | `sweepLogBaseline(db, sweep)` = `COALESCE(MAX(pk),0)` de `uown_sweep_logs WHERE sweep_name=$1` | `spec:107-110`; `sweep-fixture.helpers.ts:48-52` |
| Status HTTP do trigger | `resp.status === 200` (propriedade, NÃO método) — `expect(resp.status).toBe(200)` | `spec:136-137` |
| Endpoint disparado | `POST /uown/svc/triggerScheduledTask/{sweep}` | `scheduled-task.client.ts` |
| Nova linha em `uown_sweep_logs` (evidência de mecanismo) | `db.waitForRecord('uown_sweep_logs', 'sweep_name = $1 AND pk > $2', [sweep, baseline], 60_000)` truthy → `expect(newRowExists).toBe(true)`. Janela 60s (não 30s) — report sweeps são lentos | `spec:139-153` |
| Classificação do `error` (gating conservador) | `classifySweepError(getSweepLogError(db, sweep, baseline))` → `expect(kind).not.toBe('product')`. `product` → `[OBSERVAÇÃO]` para dev (não falha o CT de mecanismo); `provisioning` → `[PROVISIONING GAP]` anotado (validar em stg); `clean`/`environment` → PASS | `spec:155-182`; `sweep-fixture.helpers.ts:57-98` |
| No-op limpo é PASS (AC5) | `processed=0` sem `error` é aceito — a existência da linha já prova que o SQL rodou até o fim; a contagem NUNCA é asserida `>= 1` (P-1: escrita async) | `spec:40-44,87-89,175-181` |
| Edge CT-02 — sem `uown_scheduled_task` row | `SELECT COUNT(*) FROM uown_scheduled_task WHERE scheduled_task_name = 'dailyFundedReportSweep'` — se `> 0` → `[OBSERVAÇÃO]` (Achado 2 stale); se `0` → confirmado Java-only selector. **Não-gating** (nunca falha) | `spec:112-132` |

> **Por que a contagem não é o oráculo (Regra #10):** `number_of_records_processed` é escrito de
> forma assíncrona APÓS o processamento (SPEC pitfall P-1, `spec:42-44`) — ler logo após o trigger
> pode retornar 0 mesmo com merchants emailados. A evidência primária é a **linha nova**
> (`pk > baseline`), TZ-agnóstica via filtro de PK monotônico. Um no-op limpo, um gap de
> environment ou um gap de provisioning são todos desfechos aceitáveis de mecanismo num env
> inferior — só uma exceção genuína de código (`product`) falha o CT.

---

## CT-01 — `dailyFundingReportSweep`: trigger → nova linha sweep_log → error classificado

> `spec:96,102-183`. O único dos 4 com `uown_scheduled_task` row ATIVA (pk30) em sandbox — o
> recipient-selector é validado à parte no CT-05. Contrato de mecanismo idêntico ao base acima.

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo | contrato base (200 → linha nova em 60s → `error` não-`product`) | `spec:102-183` |

---

## CT-02 — `dailyFundedReportSweep`: loga mesmo SEM uown_scheduled_task row

> `spec:97,112-132`. **Edge (SPEC Achado-chave 2):** `dailyFundedReportSweep` NÃO é registrado em
> `uown_scheduled_task` — o selector é 100% Java, sem introspecção DB — mas o handler ainda roda e
> loga em `uown_sweep_logs` (confirmado 2026-06-19). O CT asserta a **ausência** da task row como
> `[OBSERVAÇÃO]` (não-gating), de modo que uma regressão futura que adicione/remova a row seja
> observável.

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo | contrato base | `spec:102-183` |
| Ausência de task row | `COUNT(*) uown_scheduled_task WHERE scheduled_task_name='dailyFundedReportSweep'` — `> 0` → `[OBSERVAÇÃO]` "Achado 2 pode estar stale"; `0` → confirmado Java-only. Nunca falha | `spec:115-132` |

---

## CT-03 — `dailyRefundReportSweep`: trigger → nova linha sweep_log → error classificado

> `spec:98,102-183`. Task disabled em sandbox (pk45, cron 2099) mas o trigger manual funciona e
> loga. Contrato de mecanismo base; conteúdo (REQUEST_REFUND) é proxy-UI do oracle irmão.

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo | contrato base | `spec:102-183` |

---

## CT-04 — `dailyRefundedReportSweep`: trigger → nova linha sweep_log → error classificado

> `spec:99,102-183`. Task disabled (pk46, cron 2099); trigger manual loga. Prova que o sweep
> Refunded dispara e loga limpo mesmo sobre dados vazios (`refunded_date_time`=0 em sandbox) — o
> CT-10 (conteúdo Refunded) fica bloqueado por ausência de dados, mas o mecanismo é verde aqui.

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Mecanismo | contrato base | `spec:102-183` |

---

## CT-05 (P0) — corretude do recipient-SQL de `dailyFundingReportSweep` (runtime, self-validating)

> `spec:195-328`. O SQL de destinatários é **editável via endpoint admin** (categoria volatile #2)
> → o CT lê `sql_to_pick_accounts` em RUNTIME de `uown_scheduled_task` (Regra #16 — NUNCA
> hard-coda o texto), executa-o para obter o set de merchant PKs, e valida CADA merchant
> selecionado de forma **independente** contra os guards de elegibilidade. Um set vazio é um
> desfecho legítimo (AC5) quando não há txn funded-ontem, não uma falha.

```gherkin
Feature: Recipient-selector do dailyFundingReportSweep
  Como ops/QA garantindo que o report diário vai só para quem deve recebê-lo
  Para evitar que um merchant receba o report errado ou deixe de recebê-lo
  O operador lê o SQL de destinatários vigente, executa-o e valida cada destinatário independentemente

  Background:
    Dado que o operador está autenticado na API/DB do Servicing no ambiente sandbox

  Scenario: [positive] Cada merchant selecionado pelo SQL vigente satisfaz todos os guards de elegibilidade
    Dado que o SQL de destinatários vigente é lido de uown_scheduled_task para a linha ATIVA (cron sem 2099) do dailyFundingReportSweep
    E o SQL vigente ainda contém os guards estruturais send_automated_funding_report e funding_report_frequency LIKE '%DAILY%'
    Quando o operador executa o SQL de destinatários vigente
    Então todo merchant retornado tem send_automated_funding_report verdadeiro, funding_report_frequency contendo DAILY, um email de contato ou de funding report, está ativo, e possui uma transação FULLY_FUNDED datada de ontem
    E nenhum merchant selecionado viola qualquer um desses guards (lista de infratores vazia)

  Scenario: [boundary] Set de destinatários vazio é aceito quando não há funded-ontem
    Dado que nenhuma transação FULLY_FUNDED está datada de CURRENT_DATE-1 no ambiente (SPEC Achado-chave 5)
    Quando o operador executa o SQL de destinatários vigente
    Então o set de merchants retornado é vazio
    E isso é registrado como [OBSERVAÇÃO] (AC5 clean-empty), a validação por-merchant é vacuamente satisfeita, e o teste não falha

  Scenario: [boundary] Drift do SQL de destinatários é registrado como observação, não falha cega
    Dado que o SQL de destinatários vigente perdeu um guard não-estrutural em relação ao snapshot documentado
    Quando o operador inspeciona o SQL vigente
    Então a divergência é registrada como [OBSERVAÇÃO] (categoria volatile #2 — SQL editável via admin)
    E apenas a ausência dos dois guards estruturais (send_automated_funding_report, funding_report_frequency LIKE '%DAILY%') falha alto
```

### Oracle (CT-05)

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Selecionar a linha ATIVA (não a clone 2099-disabled) | `queryOne` em `uown_scheduled_task WHERE scheduled_task_name='dailyFundingReportSweep' AND COALESCE(cron_trigger,'') NOT LIKE '%2099%' ORDER BY pk ASC LIMIT 1` — selecionar pela ausência do 2099, **NUNCA por PK** (drift-prone). `expect(pickSql.length).toBeGreaterThan(0)` | `spec:199-217` |
| Drift guard estrutural (hard-assert) | O SQL vigente DEVE conter `send_automated_funding_report` **E** casar `/funding_report_frequency\s+like\s+'%daily%'/` — `expect(...).toBe(true)` para ambos. A ausência de qualquer um torna o recipient set sem sentido | `spec:224-252` |
| Drift guard tolerante (observação) | guards adicionais (`primary_contact_email`/`funding_report_emails`, `current_date - 1`, `fully_funded`) ausentes → `[OBSERVAÇÃO]` "verificar contra o snapshot da SPEC antes de tratar como bug", **sem hard-fail** (edit cosmético tolerado) | `spec:224-244` |
| Executar o SQL vigente (read-only) | `db.query('SELECT pk FROM ( ${pickSql} ) AS recipients')` — wrap como subquery; o SQL é SELECT-only (sem mutação); `recipientPks` = pks numéricos | `spec:256-264` |
| Set vazio = AC5 clean-empty | `recipientPks.length === 0` → `[OBSERVAÇÃO]` "nenhum FULLY_FUNDED dated CURRENT_DATE-1 (Achado 5)"; a validação por-merchant é `test.skip` (vacuamente satisfeita), **não falha** | `spec:266-280,283-285` |
| Re-derivação independente por merchant (gating) | Para cada `mpk`: `uown_merchant` deve ter `send_automated_funding_report=true`, `funding_report_frequency ~ /DAILY/i`, email (`primary_contact_email` OU `funding_report_emails`), `is_active != false`, **E** `COUNT(*) uown_funding_transaction WHERE merchant_pk=mpk AND funding_status='FULLY_FUNDED' AND date(fund_date_time)=CURRENT_DATE-1 >= 1`. `expect(offenders).toEqual([])` | `spec:282-327` |

```sql
-- Validação DB CT-05 — re-derivação independente por merchant selecionado (substituir $mpk)
-- Deve retornar 0 linhas de "infrator": todo destinatário satisfaz os guards.
SELECT send_automated_funding_report, funding_report_frequency,
       primary_contact_email, funding_report_emails, is_active
  FROM uown_merchant WHERE pk = $mpk;
SELECT COUNT(*) FROM uown_funding_transaction t
 WHERE t.merchant_pk = $mpk
   AND t.funding_status = 'FULLY_FUNDED'
   AND t.fund_date_time IS NOT NULL
   AND date(t.fund_date_time) = CURRENT_DATE - 1;
-- Esperado: flags de report presentes E >= 1 txn FULLY_FUNDED datada de ontem.
```

> **Por que a re-derivação é independente (Regra #10):** o CT NÃO confia no texto do
> `sql_to_pick_accounts` — ele re-deriva cada guard num SELECT próprio sobre `uown_merchant` +
> `uown_funding_transaction`. Isso pega um selector que retorna merchants que NÃO deveria
> (falso-positivo do recipient set), que uma comparação byte-a-byte com o snapshot não pegaria.

---

## CT-06 (BLOCKED — `test.fixme()`) — Funding report EMAIL artifact via IMAP (TireAgent)

> `spec:346-359`. **Stub `test.fixme()` intencionalmente não-implementado** — NÃO é uma lacuna
> deste backfill; é bloqueio de dados/autorização documentado no próprio spec.
>
> **Motivo documentado (do spec):** requer um lease **FUNDED ONTEM** para TireAgent
> (`OW90218-0001` → inbox `fintechgroup777`) para que o daily funding report seja não-vazio. SPEC
> Achado-chave 5: sandbox tem **0** txns `FULLY_FUNDED` dated `CURRENT_DATE-1`. Dirigir um lead
> fresh até FUNDED NÃO produz nativamente um `fund_date_time` de ONTEM → alcançar o caminho
> não-vazio provavelmente exige **Exceção 3** (`UPDATE fund_date_time = CURRENT_DATE-1` na txn
> fresh) — que **NÃO está autorizada** (CLAUDE.md Exceção 2 / regra de security). Bloqueia nas
> SPEC Q1 (critério canônico de "Funded") + Q6 (aprovação da Exceção 3), a resolver pelo user/PO.
>
> **Marcador `@blocked-by-missing-log` (Regra #13):** o artefato de EMAIL do funding report seria
> a ação de negócio aqui; o SPEC hipotetiza que NENHUM `correspondence_log`/lead-note é escrito
> para ele. Quando/se o caminho for exercido, o assert de log NÃO deve ser silenciosamente
> removido — escalar ao dev (SPEC Risk "Activity log ausente").
>
> **Quando desbloqueado (roteiro do spec):** drive lead fresh (TireAgent `OW90218-0001`) → FUNDED →
> `fund_date_time = CURRENT_DATE-1` → trigger `dailyFundingReportSweep` → snapshot UID da inbox
> `fintechgroup777` → poll pelo email de funding report → asserar que referencia o lease funded
> (`customer_name`/`invoice_amount` do oráculo DB) → validar (ou escalar a AUSÊNCIA de) o log de
> correspondência (Regra #13). **Status: BLOCKED — não conta como cobertura, conta como limitação
> registrada.**

---

## CT-10 (BLOCKED — `test.fixme()`) — Refunded report content vs DB oracle

> `spec:371-379`. **Stub `test.fixme()` intencionalmente não-implementado** — limitação de
> **dados de ambiente**, NÃO gap de código.
>
> **Motivo documentado (do spec):** `refunded_date_time` está populado em **0** transações em
> sandbox (SPEC Achado-chave 5) — não existe transação REFUNDED completa para observar. Um refund
> completo só roda em sandbox via sessão **RECOVERED** (sticky) + webhook inbound (memória
> `sticky-refund-tests-sandbox-only`) e exigiria um seed dedicado. O conteúdo do Refunded report é
> portanto não-verificável sem esse seed → **limitação de ambiente registrada, não falha de teste**.
> O CT-04 (mecanismo) acima já prova que `dailyRefundedReportSweep` dispara e loga limpo sobre
> dados vazios.
>
> **Split (nota anti-confusão):** o conteúdo Funding/Funded/Request-Refund via UI é do oracle
> irmão `origination-funding-refund-report.md` (CT-07/08/09). O CT-10 (Refunded) vive NESTE spec
> de servicing como `test.fixme()` porque o oracle irmão deferiu o REFUNDED para cá (0 linhas
> REFUNDED no sandbox). **Status: BLOCKED por dados — limitação registrada.**

---

## Log de Atividade (Regra #13)

Os report sweeps **NÃO** escrevem `uown_los_lead_notes`, `uown_correspondence_logs` nem
`uown_email_queue` (SPEC Achado-chave 3) — o único registro DB é a linha em `uown_sweep_logs`,
que É o log de que o sweep executou (Regra #13 satisfeita no nível de scheduled task). NÃO
asserimos um activity log de negócio nos CT-01..05 porque nenhum é esperado para um sweep de
**geração de report** (SPEC §Achado 3 + Risk "Activity log ausente"). O gap de observabilidade do
artefato EMAIL fica atrás do marcador `@blocked-by-missing-log` no CT-06 (bloqueado) e deve ser
escalado ao dev SE/QUANDO esse caminho for exercido — ver SPEC Q5. **[HYPOTHESIS]** de que o
envio do report deveria gerar um correspondence log: registrada, aguarda confirmação do PO (Q5).

---

## Pré-condições

- **Ambiente sandbox** (`ENV=sandbox`) — único env onde `dailyFundingReportSweep` pk30 está ACTIVE
  (cron real), TireAgent aponta para a inbox observável `fintechgroup777`, e o DB tunnel SELECT
  está confirmado. Ver a nota de provisioning de porta (`5445` LIVE vs `5446` STALE) no cabeçalho.
- **Modo serial obrigatório** (`spec:81`) — os 4 CTs de mecanismo disparam sweeps na mesma tabela
  `uown_sweep_logs`; rodar serial mantém cada baseline por-sweep inequívoco.
- **Sem application-creation → sem merchant preflight (Regra #12)** — estes CTs são READ-ONLY sobre
  a população global de funding + triggers de sweep admin; NENHUMA aplicação é criada e NENHUMA
  mutação de DB é feita. A hierarquia de dados frescos (Regra #9) cede legitimamente ao input
  existente porque não há caminho de criação de lead aqui (`spec:30-33`).
- **Helpers reusados (Regra #2):** `sweepLogBaseline`, `getSweepLogError`, `classifySweepError` de
  `sweep-fixture.helpers.ts` (`spec:58-62`) — a MESMA taxonomia de erro do `business-sweeps-servicing.spec.ts`
  (consolidada 2026-06-23, sem duplicação). Este spec NÃO usa `triggerAndWaitSweepLog` (janela 30s);
  inline-a o trigger + `waitForRecord` com janela de **60s** (report sweeps são lentos).
- **P-1 (sweep_log async):** `number_of_records_processed` é escrito APÓS o processamento — NUNCA
  asserir `processed >= 1` logo após o trigger; a evidência de mecanismo é a linha nova
  (`pk > baseline`) (`spec:42-44`).

---

## Gaps / [HYPOTHESIS] / limitações registradas

- **CT-06 BLOCKED (autorização + dados):** email artifact via IMAP inatingível sem uma txn
  `FULLY_FUNDED` dated `CURRENT_DATE-1` para TireAgent; alcançar o caminho não-vazio provavelmente
  exige Exceção 3 (não autorizada) — SPEC Q1/Q6. **Não é cobertura, é limitação registrada.**
- **CT-10 BLOCKED (dados de ambiente):** `refunded_date_time`=0 em sandbox; sem refund completo
  para observar. Requer seed dedicado (RECOVERED sticky + webhook, sandbox-only). **Limitação de
  ambiente, não falha.**
- **[HYPOTHESIS] — oráculo de conteúdo "Funded":** `dailyFundedReportSweep` não tem SQL
  inspeccionável (selector 100% Java, SPEC Achado 2) → o critério exato (status + janela de data +
  dedup) é hipótese até o PO confirmar (SPEC Q1). Este oracle contrata só o **mecanismo** do sweep
  Funded (CT-02), NÃO o conteúdo — o conteúdo Funded (UI proxy) é do oracle irmão.
- **[HYPOTHESIS] — activity/correspondence log do report:** o report não passa por
  `email_queue`/`correspondence_logs` (Achado 3); se isso é um gap a corrigir (Regra #13) ou o
  comportamento pretendido é `[HYPOTHESIS]` pendente do PO (SPEC Q5).
- **[HYPOTHESIS] — inclusão de merchants `'DAILY,MONTHLY'`:** o guard `LIKE '%DAILY%'` do
  recipient-SQL incluiria merchants com frequency `'DAILY,MONTHLY'` (SPEC Q2, ~1176 merchants) — o
  CT-05 aceita isso como válido (o guard casa), mas a intenção de negócio aguarda confirmação do PO.
- **[HYPOTHESIS] — contagens de população** (FULLY_FUNDED 3525, REQUEST_REFUND 83, REFUNDED 0) vêm
  do §DB da SPEC (sandbox 2026-06-23, volátil) — servem só como ordem de grandeza, não como valores
  a asserir. Cross-check antes de reusar (Regra #16).

---

**Skills loaded:** `.claude/skills/test-scenarios/SKILL.md`

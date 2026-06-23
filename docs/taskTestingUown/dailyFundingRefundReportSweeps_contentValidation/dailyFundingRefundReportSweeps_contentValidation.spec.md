# SPEC — Daily Funding / Funded / Refund / Refunded Report Sweeps — Content Validation (delta over smoke)

> **Este arquivo é um SPEC de planejamento (qa-planner). NÃO é fonte de padrão de código.** Patterns vivem em `.claude/skills/` e `src/`. PKs e contagens DB abaixo são state volátil capturado em sandbox 2026-06-23 (DB tunnel `127.0.0.1:5445`, SELECT-only) — cross-check antes de reusar.

## Source

Pedido interno do user (2026-06-23): elevar a cobertura dos 4 report sweeps de Servicing/AMS de **Nível C (trigger-acceptance)** para validação de **conteúdo/comportamento** — ou provar honestamente que o artefato não é observável e registrar a limitação.

Sweeps em escopo:
- `dailyFundingReportSweep`
- `dailyFundedReportSweep`
- `dailyRefundReportSweep`
- `dailyRefundedReportSweep`

Não há issue GitLab única; é uma **suíte de validação focada** nesses 4 sweeps. Artefatos correlatos que tocam o mesmo domínio (já cobertos, fora de escopo aqui): #1301 (funding report emails validation — UI Merchant Edit), #1319 (multi-select filters MMH/ModReport/Funding), #1315 (mod report agent name).

Cobertura de smoke pré-existente (NÃO recriar — regra #2): `tests/e2e/servicing/report-sweeps-servicing.spec.ts` (Nível C, ≥60% geram row em `uown_sweep_logs` sem `error`).

---

## Discovery realizada (regra #18 — UI → API → DB)

### (1) UI — Funding Queue / Mod Report no portal
Fonte: `docs/knowledge-base/multi-select-filters-mmh-modreport-funding.md` (qa2, 2026-06-18, live DOM) + `docs/knowledge-base/merchant-funding-report-emails.md` (qa2, 2026-06-15).

- **OQ-03 [confirmado]:** o Funding Queue (`/funding`) **NÃO tem botão "generate report" / "gerar relatório on-demand"**. As únicas afordâncias são **Email CSV** e **Download CSV**, ambas operando sobre o grid filtrado.
- O grid de Funding Queue tem filtro de **Status** multi-select com 4 opções que mapeiam 1:1 nos 4 sweeps: **Funding / Funded / Request Refund / Refunded** (`FundingQueueStatus`).
- A configuração de quem recebe o relatório automático é UI (Merchant Edit → "Send Automated Funding Report" toggle → `funding_report_emails` + `funding_report_frequency`), já coberta por #1301.

**Conclusão UI:** o *report sweep em si* (job que gera e envia o relatório diário) **não tem afordância de disparo/visualização no portal** — é admin/ops (regra #14 exceção (a)). O que TEM UI é (a) a config de destinatários (Merchant Edit) e (b) a visualização equivalente do mesmo dado via Funding Queue grid + Download CSV. O **Download CSV do grid filtrado por status é o proxy-UI do conteúdo** que o sweep emailaria — é o ponto onde validação visual UI-first é possível e barata.

### (2) API
- `POST /uown/svc/triggerScheduledTask/{name}` (`ScheduledTaskClient.triggerScheduledTask`) → 200, body vazio.
- `GET /uown/svc/getScheduledTaskByName/{name}` (`ScheduledTaskClient.getScheduledTaskByName`) → metadata.
- Não há endpoint que retorne o **conteúdo** do relatório (o report é side-effect externo).

### (3) DB — definição e oráculo (`uown_scheduled_task`, sandbox 2026-06-23)

| Sweep (smoke name) | task row? | cron | `sql_to_pick_accounts` |
|---|---|---|---|
| `dailyFundingReportSweep` | **pk30 ATIVO** (`0 0 0 * * ?`) + pk44 disabled (cron 2099) | diário 00:00 | seleciona **MERCHANTS** (recipients) |
| `dailyFundedReportSweep` | **0 rows** (não existe como task) | — | **n/a — selector em Java** |
| `dailyRefundReportSweep` | pk45 (cron 2099 — disabled) | desativado | seleciona **MERCHANTS** (idêntico ao funding) |
| `dailyRefundedReportSweep` | pk46 (cron 2099 — disabled) | desativado | seleciona **MERCHANTS** (idêntico ao funding) |

> **Achado-chave 1:** o `sql_to_pick_accounts` dos 3 que têm row é **idêntico** e seleciona **merchants elegíveis a receber o email** (recipient selector), NÃO o conteúdo do relatório:
> ```sql
> select distinct m.pk from uown_funding_transaction t
> join uown_merchant m on m.pk = t.merchant_pk
> where t.status='ACTIVE' and t.funding_status='FULLY_FUNDED' and t.fund_date_time is not null
>   and m.is_active=true and (m.is_deleted is null or m.is_deleted=false)
>   and m.send_automated_funding_report=true
>   and (m.primary_contact_email is not null or m.funding_report_emails is not null)
>   AND m.funding_report_frequency LIKE '%DAILY%'
>   AND date(t.fund_date_time) = CURRENT_DATE - 1
> ```
> O **conteúdo por merchant** (as linhas de leases funded / refunds) é montado em código Java por merchant — **não há SQL inspeccionável** para o conteúdo. Logo o oráculo de conteúdo precisa ser **derivado por nós** como uma query determinística sobre `uown_funding_transaction`.

> **Achado-chave 2:** `dailyFundedReportSweep` NÃO existe como scheduled task, mas `triggerScheduledTask('dailyFundedReportSweep')` **ainda registra row em `uown_sweep_logs`** (visto 2026-06-19) → handler existe, selector é Java-only, **zero introspecção DB do critério**. Tratar como caixa-preta: oráculo só por `funding_queue_status='FUNDED'` derivado.

> **Achado-chave 3 (observabilidade do artefato):** o relatório **NÃO passa por `uown_email_queue`** (0 templates `%fund%`/`%refund%`) nem por `uown_correspondence_logs`. É enviado por mecanismo externo (SMTP direto/anexo CSV/SharePoint). **A única evidência DB do sweep é `uown_sweep_logs`** (`number_of_records_processed` = nº de merchants emailados, escrito async). O conteúdo só é observável (a) por IMAP se o destinatário for uma inbox que pollamos, ou (b) pelo proxy Download-CSV do grid Funding Queue.

> **Achado-chave 4 (inbox observável existe):** o merchant **TireAgent `OW90218-0001` (mpk 34)** já tem `funding_report_emails = fintechgroup777@gmail.com` — a **inbox IMAP compartilhada que o framework já polla** (`reference_imap_fintechgroup777`). Esse é o único caminho viável para observar o **email/anexo real** em sandbox.

> **Achado-chave 5 (lacuna de dados):** `FULLY_FUNDED` txns com `date(fund_date_time)=CURRENT_DATE-1` em sandbox = **0**. Total FULLY_FUNDED = 3525, mas o último fund de TireAgent foi 2026-05-11. `refunded_date_time` populado em **0** txns; `refund_request_date_time` em 19. → **Os relatórios diários sairiam VAZIOS hoje** sem seed/drive. A última cron real (2026-06-23 03:00) logou `processed=0 sem erro` — confirma "rodou, nada elegível".

### Distribuição de status (oráculo de conteúdo derivado) — `uown_funding_transaction`
| `funding_queue_status` | count | mapeia em |
|---|---|---|
| FUNDING | 11.609 | `dailyFundingReportSweep` |
| FUNDED | 3.902 | `dailyFundedReportSweep` |
| REQUEST_REFUND | 83 | `dailyRefundReportSweep` |
| (null) | 6 | — |
| REFUNDED via `refunded_date_time` | 0 | `dailyRefundedReportSweep` |

Colunas-oráculo confirmadas: `funding_queue_status`, `funding_status`, `fund_date_time`, `refund_request_date_time`, `refunded_date_time`, `merchant_pk`, `lead_pk`, `customer_name`, `invoice_amount`, `amount_to_be_funded`.

---

## Scope

**IN:**
- **Oráculo de conteúdo derivado** para cada um dos 4 sweeps: query determinística sobre `uown_funding_transaction` que reproduz o critério do report (status + janela de data + elegibilidade de merchant) — porque é a única forma de afirmar "o report contém o que deveria".
- **Validação do recipient-selector** (`dailyFundingReportSweep` pk30): o conjunto de merchants que o sweep escolhe = nosso oráculo SQL re-executado em runtime (lido de `uown_scheduled_task.sql_to_pick_accounts`, auto-validante — não hard-coded). Catches drift de SQL.
- **Validação do artefato emailado via IMAP** para TireAgent (mpk 34 → fintechgroup777 inbox), QUANDO houver uma txn `FULLY_FUNDED` dated `CURRENT_DATE-1` para ele (Nível A alcançável só aqui).
- **Proxy-UI Funding Queue**: Download CSV filtrado por status (Funding/Funded/Request Refund/Refunded) e comparação das linhas/contagem com o oráculo DB — cobertura UI-first do mesmo dado (regra #14), independente do envio do email.
- **`uown_sweep_logs` mechanism check** por sweep: row nova pós-trigger + `error` classificado (provisioning gap vs product exception) — herda o helper `classifySweepError`.
- **Activity/correspondence log** onde aplicável (ver regra #13 abaixo — gap documentado).

**OUT (com justificativa):**
- Recriar o smoke trigger-acceptance — já existe (`report-sweeps-servicing.spec.ts`), regra #2.
- `weekly/monthly/monthlyConsolidated FundingReportSweep` (34.50/34.51) — fora dos 4 pedidos; mesma família, deixar para extensão futura. Suas tasks estão disabled/stale em sandbox (last trigger 2023).
- `dailyFundingReportSharepointSweep` — variante SharePoint, sink não-observável; só smoke.
- A config UI de destinatários (Merchant Edit toggle/emails) — já coberta por #1301 (`merchant-funding-report-emails.md`).
- Validação do **layout/formatação do CSV** (colunas, headers) além de presença de linhas-chave — nice-to-have; promover se o user pedir paridade de schema.
- Testar o envio em produção/SharePoint real — não observável.

**AMBÍGUO / Questions for PO:**
- Q1 (BLOQUEADORA-leve): qual é a **definição canônica de cada report** no svc? `dailyFundedReportSweep` não tem SQL inspeccionável — precisamos do critério Java (status, janela de data, dedup) para o oráculo de "Funded" ser fiel. Sem isso, o oráculo "Funded" é hipótese (`funding_queue_status='FUNDED'` ± janela).
- Q2: o report **inclui ou exclui** merchants com `funding_report_frequency` contendo `DAILY` mas também `MONTHLY` (`'DAILY,MONTHLY'` = 1176 merchants)? O `LIKE '%DAILY%'` sugere inclusão — confirmar.
- Q3: o sweep deve **emailar mesmo quando o conteúdo é vazio** (0 funded ontem)? Ou suprime o email? (Define se "processed=0 + email enviado" é correto ou bug.)
- Q4: o relatório "Refund" (`dailyRefundReportSweep`) usa `refund_request_date_time` e o "Refunded" usa `refunded_date_time`? Confirmar o discriminador exato.

---

## AC Coverage

> Não há AC do PO (suíte de validação, não feature). Por regra do projeto (sem AC = não testa **feature nova**), mas isto é **validação de comportamento existente** — aplicamos AC **derivados** do comportamento documentado (business-rules 34.46-34.48 + SQL live), marcados `[AC-DERIVADO POR QA]`. Decisão: PROSSEGUIR COM ASSUNÇÕES MARCADAS.

| AC derivado | Cenário(s) |
|---|---|
| AC1 `[DERIVADO]`: cada um dos 4 sweeps aceita trigger (200) e executa sem `error` em `uown_sweep_logs` | CT-01..04 (mechanism) — herdado do smoke, aqui re-verificado por sweep individual |
| AC2 `[DERIVADO]`: `dailyFundingReportSweep` seleciona exatamente os merchants que satisfazem o `sql_to_pick_accounts` vigente (recipient correctness) | CT-05 |
| AC3 `[DERIVADO]`: dado uma txn `FULLY_FUNDED` dated `CURRENT_DATE-1` para TireAgent, o report diário é enviado ao destinatário e o anexo/email contém a referência ao lease funded | CT-06 (IMAP, Nível A) |
| AC4 `[DERIVADO]`: o conteúdo visível ao usuário no Funding Queue (Download CSV) por status casa com o oráculo DB derivado para Funding/Funded/Request Refund/Refunded | CT-07..10 (UI proxy) |
| AC5 `[DERIVADO]`: report com 0 itens elegíveis → `processed=0` sem `error` (no-op limpo, não crash) | CT-01..04 (negative/empty) |

---

## Risk Analysis

| Área | Risco | Por quê | Cobertura |
|---|---|---|---|
| Recipient SQL (`dailyFundingReportSweep`) | **Alto** | SQL editável via endpoint admin; drift entre envs (volatile-registry cat. #2); seleção errada = merchant recebe report errado ou não recebe | CT-05 (SQL runtime auto-validante) |
| Conteúdo "Funded" sem SQL inspeccionável | **Alto** | selector 100% Java, caixa-preta; oráculo é hipótese até PO confirmar | CT-06 (IMAP) + CT-08 (UI) + Q1 |
| Artefato externo não observável | **Médio-Alto** | report não passa por email_queue; só IMAP (1 merchant) ou Download CSV | CT-06 limitado a TireAgent; CT-07..10 cobrem via UI |
| Lacuna de dados (0 funded ontem / 0 refunded) | **Alto** | sem seed/drive, todos os reports saem vazios → teste não exercita o caminho de conteúdo | requer Test Data (ver abaixo) |
| Refund/Refunded discriminador de data | **Médio** | `refund_request_date_time` vs `refunded_date_time`; 0 refunded em sandbox | CT-09/CT-10 + Q4 |
| Activity log ausente (regra #13) | **Médio** | report sweeps não geram lead_note nem correspondence_log → gap de observabilidade | documentado como gap, escalar |
| `processed` async (P-1) | Baixo | já catalogado | usar `uown_sweep_logs` row + oráculo de negócio, nunca `processed>=1` imediato |

---

## Test Strategy

**Approach global: HÍBRIDO + DB-oracle, escalonado por nível alcançável por sweep.**

- **UI-first (regra #14)** é honrado via o **proxy Funding Queue Download CSV**: o report sweep em si é admin/ops (sem UI), mas o *dado que ele reporta* TEM superfície UI (grid + CSV). Validar o conteúdo via CSV do grid = exercitar o que o usuário/merchant efetivamente vê, sem depender do email externo.
- **Setup** via Test Data Hierarchy: PADRÃO = **drive de um lead fresh até FUNDED** para TireAgent (mpk 34) num caminho que produza `funding_queue_status='FUNDED'` + `fund_date_time` de ontem. Se o caminho fresh não alcançar `CURRENT_DATE-1` sem mutar data → **PARAR e pedir autorização Exception 3** (mutar `fund_date_time` para ontem). NÃO assumir.
- **Exercise**: `triggerScheduledTask` (admin) + abrir Funding Queue UI.
- **Assertion**: (a) oráculo DB derivado; (b) `uown_sweep_logs` row + error class; (c) IMAP attachment (só TireAgent); (d) UI CSV linhas.

**Ambiente recomendado:**
- **Sandbox (primary)** — único env onde: (1) DB tunnel SELECT confirmado (`5445`), (2) TireAgent aponta para a inbox `fintechgroup777` observável, (3) `dailyFundingReportSweep` pk30 está **ativo** (cron real). Memórias confirmam sandbox como o env com IMAP/decrypt funcional para fluxos correlatos (sticky refund).
- **qa2 (secundário)** para o proxy-UI (Funding Queue grid multi-select confirmado deployado em qa2 — KB #1319) e para reconfirmar o `sql_to_pick_accounts` (categoria volatile — drift entre envs).
- **stg (DoD)** — onde os artefatos de report rodam "prod-like"; validar o mechanism (sweep_log) e, se houver destinatário observável, o email. DoD exige stg (test-strategy-decision §4).
- **dev3 NÃO** — matriz confirma que dev3 não observa o artefato externo (Nível C teto).

**Suites to activate (regression-suites-map §8 — "Mudou sweep / scheduled task"):**
- Trigger manual via API + DB validation `ORDER BY pk DESC LIMIT 1`.
- NÃO confiar em `number_of_records_processed` como evidência primária (P-1).
- Não há email_queue para esses → evidência primária = `uown_sweep_logs` + oráculo `uown_funding_transaction` + IMAP (TireAgent).

---

## Níveis alcançáveis por sweep (resumo honesto)

| Sweep | Nível alcançável | Por quê | Automatizar? |
|---|---|---|---|
| `dailyFundingReportSweep` | **B+ (sandbox) / A (TireAgent + IMAP)** | recipient SQL inspeccionável (B: seleção provada via SQL runtime); A só se TireAgent tiver funded-ontem + email IMAP chega | **SIM** — CT-05 (SQL) sempre; CT-06 (IMAP) condicional a dados |
| `dailyFundedReportSweep` | **B (UI proxy) / C (sweep_log)** | sem SQL (Java-only); oráculo de conteúdo = hipótese; UI CSV `FUNDED` é a melhor evidência | **SIM** — CT-08 (UI CSV) + CT-02 (mechanism); marcar oráculo `[HIPÓTESE]` até Q1 |
| `dailyRefundReportSweep` | **B (UI proxy) / C** | task disabled (cron 2099); trigger manual funciona; 83 REQUEST_REFUND observáveis | **PARCIAL** — CT-09 (UI CSV `Request Refund`) + CT-03 mechanism |
| `dailyRefundedReportSweep` | **C (limitação de dados)** | `refunded_date_time` = 0 em sandbox; sem refund completado para observar | **NÃO (documentar limitação)** — CT-04 mechanism only; conteúdo bloqueado por ausência de dados REFUNDED. Requer seed de refund completo (Exception 3 / drive de refund real — só sandbox per memory sticky-refund) |

> **O que vale automatizar vs limitação de ambiente:**
> - **Automatizar agora:** CT-05 (recipient SQL drift — alto valor, determinístico), CT-07..09 (UI CSV proxy para Funding/Funded/Request-Refund — UI-first, dado já existe), CT-01..04 (mechanism per-sweep com error-class).
> - **Automatizar condicional a dados/autorização:** CT-06 (IMAP TireAgent — precisa funded-ontem; se exigir mutar `fund_date_time`, pedir Exception 3).
> - **Limitação documentada (NÃO forçar):** CT-10 (Refunded content) — sem dado REFUNDED em sandbox e refund completo só roda em sandbox via sessão RECOVERED + webhook (memory `sticky-refund-tests-sandbox-only`). Conteúdo do Refunded report = **não-verificável sem seed dedicado**; registrar como gap de ambiente, não como falha.

---

## Scenarios (prioritized)

### CT-01..04 — Mechanism + error-class por sweep individual (P1)
- **Tipo:** API + DB. **Portal:** Servicing (admin). **Técnica:** state/transition trivial + error guessing (SQLGrammar/missing table).
- **Persona:** ops/QA (admin).
- **Setup:** baseline `MAX(pk)` de `uown_sweep_logs` por sweep (helper `sweepLogBaseline`).
- **Steps:** trigger cada sweep individualmente → assert 200 → poll row nova → classificar `error` (provisioning vs product).
- **Validações:**
  - `uown_sweep_logs` row nova com `pk > baseline`, `sweep_name` correto.
  - `error` vazio OU classificado (reusar `classifySweepError`).
  - **AC5 (empty):** `processed=0 sem error` é PASS (no-op limpo), não falha.
- **Edge:** `dailyFundedReportSweep` sem task row → trigger ainda loga (confirmado 2026-06-19); assert que a row aparece mesmo sem `uown_scheduled_task`.
- **Pitfalls:** P-1 (não assertar `processed>=1`); regra #16 (ler SQL de runtime, não de report antigo).
- **Delta vs smoke:** smoke agrega ≥60% num batch; aqui é **per-sweep determinístico com error-class** — isola qual dos 4 quebrou.

### CT-05 — Recipient SQL correctness (`dailyFundingReportSweep`) (P0)
- **Tipo:** DB-oracle (auto-validante). **Técnica:** decision-table implícita (status × frequency × email presence × data window).
- **Setup:** ler `sql_to_pick_accounts` de `uown_scheduled_task WHERE template_name='dailyFundingReportSweep' AND cron_trigger NOT LIKE '%2099%'` (pk30) em runtime.
- **Steps:** executar o SQL lido → obter set de merchant_pks elegíveis → comparar contra uma re-derivação independente do mesmo critério (paridade), e contra `uown_sweep_logs.number_of_records_processed` da execução cron real (eventual).
- **Validações:**
  - set de merchants = não-vazio quando há funded-ontem; vazio quando não há.
  - cada merchant retornado satisfaz: `send_automated_funding_report=true`, `funding_report_frequency LIKE '%DAILY%'`, email presente, txn FULLY_FUNDED dated ontem.
  - **drift guard:** se o SQL lido divergir do snapshot esperado, `[OBSERVAÇÃO]` (categoria volatile #2), não falha cega.
- **Pitfalls:** SQL é editável (não hard-codar o texto — ler de runtime).

### CT-06 — Funding report email artifact via IMAP (TireAgent) (P0, condicional a dados)
- **Tipo:** Híbrido (setup drive→funded + trigger + IMAP). **Persona:** merchant recipient.
- **Setup (Test Data Hierarchy #1 PADRÃO):** drive lead fresh em TireAgent `OW90218-0001` até `funding_queue_status='FUNDED'` com `fund_date_time` de ontem. **Se o fresh não alcançar `CURRENT_DATE-1`** → STOP, pedir Exception 3 para `UPDATE fund_date_time = CURRENT_DATE-1` na txn fresh recém-criada (escopo restrito à txn do teste).
- **Steps:** trigger `dailyFundingReportSweep` → snapshot inbox UID `fintechgroup777@gmail.com` → poll novo email (subject de funding report) → abrir anexo/CSV.
- **Validações:**
  - email recebido (`getEmailContent`) com o lease funded referenciado (customer_name / invoice_amount do oráculo).
  - `uown_sweep_logs` `processed>=1` (eventual, async — pollar) confirmando merchant selecionado.
  - **Activity log (regra #13):** verificar se há `uown_los_lead_notes`/`uown_sv_activity_log`/`uown_correspondence_logs` para o envio do report. **HIPÓTESE:** ausente (report não passa por email_queue/correspondence) → **gap de observabilidade documentado** (não remover assert; marcar `@blocked-by-missing-log`, escalar ao dev — conforme `.claude/rules/testing.md`).
- **Pitfalls:** plus-addressing não aplicável (inbox é fixa do merchant); serializar com outros testes que usam a mesma inbox; janela `CURRENT_DATE-1` é DOW-sensível (não rodar de forma a cair em data sem cobertura).
- **Nota:** este é o ÚNICO caminho para Nível A real de conteúdo emailado em sandbox.

### CT-07..10 — UI proxy: Funding Queue Download CSV por status (P1, UI-first)
- **Tipo:** E2E (browser) + DB-oracle. **Portal:** Servicing/Origination Funding Queue (`/funding`). **Técnica:** equivalence partitioning por `FundingQueueStatus`.
- **Persona:** agent/admin que consome a fila.
- **Setup:** dados existentes (FUNDING 11.6k / FUNDED 3.9k / REQUEST_REFUND 83) — leitura, sem mutação; OU o lead fresh do CT-06 para asserção determinística de uma linha conhecida.
- **Steps (por status):**
  - CT-07 Funding · CT-08 Funded · CT-09 Request Refund · CT-10 Refunded
  - filtrar grid por status (multi-select) → Download CSV → parsear → comparar contagem/linhas-chave com oráculo DB derivado (`funding_queue_status = X`).
- **Validações:**
  - UI: grid renderiza linhas do status; CSV baixa.
  - contagem CSV ≈ oráculo DB (tolerância de paginação/janela de data se aplicável).
  - linha do lease fresh (se usada) presente no CSV do status correto.
- **Edge / limitação:**
  - **CT-10 (Refunded):** `refunded_date_time=0` em sandbox → grid/CSV provavelmente vazio. **Documentar como limitação de dados** (não falha): conteúdo Refunded não-verificável sem seed de refund completo (só sandbox via RECOVERED+webhook — memory sticky-refund).
- **Pitfalls (volatile-registry cat. #4):**
  - **NÃO** usar `MerchantLocationFilterPO` no Funding Queue (DOM custom — usar métodos próprios da `FundingPage`).
  - **CSV button CSS-module prefix drift** — verificar `el.className` real via DOM antes de usar selector class-based (`isDownloadCsvEnabled` pode retornar sempre `false`).
- **Justificativa UI-first:** cobre regra #14 sem depender do email externo; é o ponto onde um bug de renderização/conteúdo do dado de funding seria visível ao usuário real.

---

## Out-of-scope decisions
- **Não** validar layout/colunas do CSV além de linhas-chave (promover se PO pedir paridade de schema).
- **Não** cobrir weekly/monthly/sharepoint/consolidated (família correlata, tasks stale em sandbox).
- **Não** forçar conteúdo do Refunded report — limitação de dados de ambiente documentada (CT-10).
- **Não** recriar o smoke batch (`report-sweeps-servicing.spec.ts`).

## Open questions (para PO/dev)
- Q1: definição canônica Java de cada report (status + janela + dedup), especialmente `dailyFundedReportSweep` (sem SQL).
- Q2: merchants `'DAILY,MONTHLY'` (1176) entram no daily? (`LIKE '%DAILY%'` sugere sim — confirmar).
- Q3: report vazio (0 funded ontem) → email enviado ou suprimido?
- Q4: discriminador de data Refund vs Refunded (`refund_request_date_time` vs `refunded_date_time`).
- Q5: o envio do report deve gerar activity/correspondence log? (regra #13 — hoje parece NÃO; confirmar se é gap a corrigir).
- Q6 (autorização): aprovação de Exception 3 para `UPDATE fund_date_time=CURRENT_DATE-1` na txn fresh do CT-06, caso o drive happy-path não produza data de ontem nativamente.

---

## Resumo executivo do delta

A cobertura atual (Nível C) só prova que o sweep **dispara e não crasha**. Este SPEC adiciona, na ordem de valor:
1. **CT-05** — correção do *recipient selector* (alto risco de drift, 100% determinístico, automatizar já).
2. **CT-07..09** — *conteúdo visível ao usuário* (Funding/Funded/Request Refund) via Funding Queue Download CSV (UI-first, dado já existe).
3. **CT-01..04** — mechanism per-sweep com error-class (isola qual sweep quebrou).
4. **CT-06** — *email artifact real* via IMAP TireAgent (único Nível A de email; condicional a dados / possível Exception 3).
5. **Limitações honestas:** conteúdo do **Refunded** report não-verificável em sandbox (0 dados REFUNDED); oráculo do **Funded** é hipótese até PO confirmar o critério Java; report **não gera activity log** (provável gap regra #13, escalar).

**Ready for:** `qa-implementer` (CT-05, CT-07..09, CT-01..04 são implementáveis já; CT-06 e CT-10 dependem de respostas Q1/Q4/Q6 e autorização Exception 3). Recomendo o orquestrador resolver Q1+Q6 com o user antes de despachar CT-06/CT-10.

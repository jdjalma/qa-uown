---
title: "1313 — npm_segment / tam_score snapshot: env & engine routing"
domain: knowledge-base
status: stable
volatility: volatile
last_verified: 2026-06-21
sources:
  - env: qa2
  - db: uown_los_uwdata
  - db: uown_sv_uwdata
  - mr: "svc!1469 (migration V20260603054943_1.53.0)"
covers: [npm-segment, tam-score, gds-snapshot, uwdata]
---

# 1313 — `npm_segment` / `tam_score` snapshot: env & engine routing

> **Categoria:** volatile (engine routing, env reachability, GDS mock). Verificar fonte primária antes de reusar. Este é registro de discovery datado, NÃO fonte de padrão.
> **Discovery:** 2026-06-19 · método: read-only DB probes (UI→API→DB; UI/portal não exercido — questão era "o campo popula em qual env", respondível por estado persistido). Túnel kubectl `127.0.0.1:5445` = **qa2** (ancorado no report 1314 + continuidade de lead PK; `.env` mapeia QA2/DEV1/DEV2 todos a 5445 → env = cluster do túnel ativo).
> **Probes reutilizáveis:** `src/scripts/_probe_1313_uwdata.ts <env>` · `src/scripts/_probe_1313_tireagent.ts <env>`.
> **Update 2026-06-21:** experimento DECISIVO via API em qa2 (apps frescas, post-migration, com bank data) — fecha a hipótese "destravar `tam_score` configurando o merchant via API". Ver seção dedicada abaixo (§ "Experimento via API 2026-06-21"). Probes throwaway: `src/scripts/_probe_1313_experiment.ts`, `_probe_1313_916.ts`, `_probe_1313_bankdata.ts`, `_probe_1313_lead15945.ts`, `_probe_1313_programs.ts`.

## Pergunta
Task 1313 grava `npm_segment` e `tam_score` (resposta GDS) em `uown_los_uwdata`/`uown_sv_uwdata` no underwriting. Marcos: "send bank data, SSN ending 953, 16-month program; `tam_score` só TireAgent." **Em qual env esse caminho realmente roda?**

## Achados (qa2, 2026-06-19) — `[CONFIRMADO]` por dados

### 1. Colunas existem em qa2
`uown_los_uwdata.{npm_segment,tam_score}` e `uown_sv_uwdata.{npm_segment,tam_score}` — todas `integer`, presentes (migration `V20260603054943_1.53.0` aplicada). `uown_los_uwdata` tem 32 colunas (npm_segment/tam_score = #31/#32).

### 2. `npm_segment` POPULA em qa2 — via GDS, 16m, **não-TireAgent**
- 46/6046 leads em `uown_los_uwdata` têm `npm_segment` não-nulo; 6 em `uown_sv_uwdata`. **Todos `decided_by_agent='GDS'`, `uw_status='APPROVED'`, `eligible_terms='16'`.**
- Merchants que produzem: **KORNERSTONE** (KS16008, KS16775, KS1011, KS14299, KS3015 — `scoring_company_group='4'`), **V1_UOWN** (QA_LUCAS_UOWN), **PAY_TOMORROW** (MSA Powersports, Progress Mobility).
- SSN dos leads npm_segment: **espalhado** (237, 234, 663, 916, ...) — `npm_segment` **NÃO** está amarrado ao sufixo 953; vem em qualquer decisão **GDS 16m**.
- → **CT-01/CT-03 (npm_segment) são plenamente rodáveis em qa2.** Receita: merchant Kornerstone 16m (ex. **KS16775**) + bank data → GDS APPROVED eligible_terms=16 → `npm_segment` populado, `tam_score` NULL.

### 3. `tam_score` NUNCA popula em qa2 — `[CONFIRMADO]` 0/6046
- `count(tam_score)=0` em `uown_los_uwdata` (6046 linhas) E `uown_sv_uwdata` (2037 linhas).
- **Por quê (mecanismo, provado por dados):**
  - **TireAgent (OW90218-0001) em qa2 É decidido por GDS e APROVADO, mas trava em `eligible_terms='13'`** (15 leads recentes, todos 13m, `npm_segment`/`tam_score` NULL). O branch GDS que retorna esses campos é o de **16m** — TireAgent nunca chega a 16m em qa2.
  - **Second Look (SSN `100000053`, ending `0053`/"953") em TireAgent → `UW_DENIED`** (9+ leads, `eligible_terms=null`, tam_score null). Second Look **short-circuita em qa2** (validado só em stg, discovery 2026-04-22) → a 2ª submissão com bank data que aprovaria 16m **nunca completa**.
  - Logo a combinação **TireAgent + 16m + GDS** (única que gera `tam_score`) é **inalcançável em qa2**.

### 4. Engine distribution (qa2, todo `uown_los_uwdata`)
`TAKTILE` 2292 · `BLACKBOX` 2229 · `GDS` 1499 · `INTERNAL` 26. `npm_segment` só nos 46 GDS-16m; `tam_score` zero em todos.

## Resolução das open questions do SPEC
- **Q1 (SSN "953"):** `[CONFIRMADO]` = família **Second Look `100000053`** (ending `0053`). Presente em qa2 em leads TireAgent, todos DENIED (1ª etapa). Para `tam_score` é preciso a Second Look **completar a 16m APPROVED com bank data** — não ocorre em qa2.
- **Q2 (env que roteia TireAgent 16m por GDS retornando tam_score):** `[CONFIRMADO]` **NÃO é qa2.** Candidato = **stg** (Second Look validado lá) — **inalcançável deste host** (`UOWN_DB_URL_STG=34.121.232.252:5432`, sem rota/VPN; connection timeout). **dev2** desconhecido (precisa de túnel kubectl próprio; `.env` reusa porta 5445).

## Implicação para o SPEC 1313
- **CT-01 / CT-03 (`npm_segment`, não-TireAgent):** rodáveis em **qa2** hoje. Recipe Kornerstone 16m + bank data.
- **CT-02 / CT-04 (`tam_score`, TireAgent):** **bloqueados em qa2**. Precisam de env onde Second Look TireAgent aprova 16m via GDS (**stg**, ou **dev2** a confirmar). **Escalar a Marcos/dev:** (a) SSN literal exato; (b) env-alvo confirmado para o caminho `tam_score`; (c) abrir túnel dev2/stg para QA validar.
- Guard pré-assert do SPEC (`decided_by_agent='GDS'` + `eligible_terms ~ '16'`) é **essencial** — sem ele, um TireAgent 13m (qa2) leria `tam_score=NULL` e falsamente acusaria bug.

## Experimento via API 2026-06-21 — `[CONFIRMADO por dados]` (qa2, túnel `127.0.0.1:5445`)

> **Diferença vs discovery 2026-06-19:** a discovery anterior só OBSERVOU leads antigos no DB (read-only). Este experimento CRIOU aplicações frescas via API com bank data (post-migration `V20260603054943`) tentando ativamente destravar `tam_score` (TireAgent + 16m + GDS) por todos os levers de API disponíveis. Conclusão: o caminho é **genuinamente env-blocked em qa2** e a hipótese "configurar via API" **NÃO procede**.

### (a) Merchant-config NÃO é o lever do cap 13m — `[CONFIRMADO por dados]`
TireAgent `OW90218-0001` (merchant pk **34**) **já tem 2 programas 16m ativos e in-window**: `KWC-2.3` (program pk **4718**) + `KWC-1.75` (program pk **4741**), tipo LTO/SAME_AS_CASH, cobrindo CA/OH/NY — link confirmado em `uown_merchant_to_program` (merchant_pk=34). Ou seja, **o merchant está habilitado para 16m** e mesmo assim o GDS retorna `eligible_terms='13'`. O cap é a **decisão de termo do GDS para o segmento `TIRE_AGENT`**, não config de merchant. Nenhum campo do surface `updateMerchants`/`MerchantDesiredState` (`dealerDiscountOverride`, `uwPipeline`, `fraudThreshold`, `maxApprovalAmount`, `isGdsEnabled`, `offerInsurance`) controla o termo concedido pelo GDS.

### (b) SSN sufixo `916` é mock-only (BlackBox, qa1/sandbox) — `[CONFIRMADO por dados]`
`916` força EligibleTerms 16 **apenas no mock BlackBox** (qa1/sandbox). TireAgent em qa2 roteia para **GDS**, que **ignora o mock** e decide o termo por lógica de crédito real → retorna 13m (ou nega). Provas frescas (apps criadas com bank data):
- Lead **16794** (TireAgent + CA + `…916` + bankData) = GDS **APPROVED** `eligible_terms='13'` `tam_score=NULL`.
- Lead **16795** (TireAgent + OH + `…916` + bankData) = **DENIED**.

### (c) Lead 15945 — único TireAgent `eligible_terms=16` histórico, pré-migration — `[CONFIRMADO por dados]`
Único TireAgent com `eligible_terms=16` em qa2 = lead **15945** (1 em 474, SSN `…9916`, 2026-04-28) e **mesmo assim `tam_score=NULL`** porque é **anterior à migration `V20260603054943`** (2026-06-03). Confirma que nem o único caso 16m histórico ajudaria — o campo só passou a ser gravado pós-migration.

### (d) Second Look `0053` continua DENIED em qa2 — `[CONFIRMADO por dados]`
SSN `100000053` (Marcos "ending 953" / sufixo `0053`) em TireAgent qa2 → **DENIED + short-circuit** (aprova 16m só em **stg**). Reconfirmado neste experimento.

### (e) Tabela — tentado × `eligible_terms` resultante (TireAgent qa2, apps frescas 2026-06-21)

| Tentativa | SSN sufixo | Estado | Bank data | Resultado | `eligible_terms` | `tam_score` |
|-----------|-----------|--------|-----------|-----------|------------------|-------------|
| Lead 16794 | `916` | CA | sim | GDS APPROVED | `13` | NULL |
| Lead 16795 | `916` | OH | sim | DENIED | — | NULL |
| Second Look | `0053` | CA | sim (2ª) | DENIED / short-circuit | — | NULL |
| Lead 15945 (histórico) | `9916` | — | — | APPROVED 16 (pré-migration) | `16` | NULL |
| Merchant config levers (updateMerchants) | n/a | — | — | nenhum afeta o termo do GDS | inalterado | NULL |

### Conclusão fechada
**TireAgent + 16m + GDS (única combinação que gera `tam_score`) é inalcançável em qa2 por QUALQUER lever de API.** Path para `tam_score`: env **stg**/**dev2**, mock GDS, ou mudança de backend — **fora do surface QA**. CT-02/CT-04 permanecem `.skip` com o guard pré-assert `decided_by_agent='GDS'` AND `eligible_terms ~ '16'` (Rule #10 — nunca assert vermelho num path env-blocked). Não re-investigar via API.

## Corrige/atualiza
- `[[ssn-test-modalities]]`: `100000053` (Second Look) é o gatilho de `tam_score`; só completa onde Second Look não short-circuita (stg). qa2 mantém DENIED.
- Memória `qa2-16m-eligibility-kornerstone-route`: reforçada — TireAgent em qa2 = GDS+13m (não 16m); 16m via Kornerstone (não-TireAgent) → dá `npm_segment` mas nunca `tam_score`.

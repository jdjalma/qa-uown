---
operation: origination-uw-banking-snapshot
description: Persistência dos scores de snapshot de underwriting/banking `npm_segment` e `tam_score` (ambos integer) gravados pela engine GDS durante a decisão de UW no ramo de aprovação 16m. `npm_segment` é gravado em qualquer aprovação GDS 16m (não-TireAgent); `tam_score` é o ramo exclusivo TireAgent. Snapshot em `uown_los_uwdata` (lead) copiado para `uown_sv_uwdata` (account) no import LOS→SVC no funding. Feature R1.53.0 (migration V20260603054943_1.53.0). SEM superfície de UI — write silencioso de backend (como `lambda_segment`); a observabilidade é a persistência no DB (Regra #14 exceção c).
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/origination/RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData.spec.ts
  - src/helpers/database.helpers.ts
  - src/helpers/api-setup.helpers.ts
  - src/helpers/test-data.helpers.ts
  - src/config/constants.ts
  - docs/business-rules/02-originacao-pipeline.md
  - docs/knowledge-base/npm-segment-tam-score-snapshot-routing.md
  - docs/knowledge-base/underwriting-and-funding-test-data-paths.md
---

# Oracle BDD — Snapshot de Scores de Underwriting/Banking (npm_segment / tam_score)

> **Gatilho:** qualquer operação que leve um lead através da decisão de underwriting pela engine **GDS** no ramo de aprovação **16m** e que leia/asseverem as colunas `uown_los_uwdata.{npm_segment,tam_score}` (lado lead) ou `uown_sv_uwdata.{npm_segment,tam_score}` (lado account, no funding). Aplica-se também a **rodar** `RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData.spec.ts` — rodar o spec É executar as operações que ele exercita (regra #19), incluindo a criação da aplicação (`createPreQualifiedApplication`), os sweeps de refresh de token GDS/Kount e as queries de persistência.
>
> **Natureza (UI/API/DB):** predominantemente **API-setup + DB-assert**. NÃO há superfície de UI para os dois scores — o backend os grava de forma silenciosa (análogo a `lambda_segment`), sem badge/campo no portal. O gatilho de negócio (aplicação → dados bancários → decisão GDS) é exercido via API (Regra #14 exceção b — precondição/setup); os dois campos são uma **validação DB cross-cutting** (Regra #14 exceção c). Não é uma violação da UI-first: não existe render a validar visualmente. A decisão de UW É uma transição de status → seu log de atividade é asseverado (Regra #13). Se um dia a UI expuser esses scores (ex.: aba de detalhe do lead no Origination), esta observação deve ser revista.
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/origination/RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData.spec.ts \
>   src/helpers/database.helpers.ts \
>   src/helpers/api-setup.helpers.ts \
>   src/helpers/test-data.helpers.ts \
>   src/config/constants.ts \
>   docs/business-rules/02-originacao-pipeline.md \
>   docs/knowledge-base/npm-segment-tam-score-snapshot-routing.md \
>   docs/knowledge-base/underwriting-and-funding-test-data-paths.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Ambiente alvo:** **qa2** (`test.use({ envName: 'qa2' })`). O worker fixture `db` conecta em `process.env.ENV`, NÃO no `envName` por-describe → rodar com `ENV=qa2` para as asserções DB baterem em qa2. Comando: `ENV=qa2 npx playwright test --project=origination-ui RU06.26.1.53.0_storeUnderwritingAndBankingScoresSnapshotData.spec.ts --workers=1` (`spec:39-43`).
>
> **O que "snapshot" garante:** captura **point-in-time** dos scores da resposta GDS no momento da decisão de UW, persistida junto aos demais outputs de UW em `uown_los_uwdata`; o mesmo objeto `UWInfo` é copiado para `uown_sv_uwdata` na importação LOS→SVC na criação do account (`02-originacao-pipeline.md:592`). A imutabilidade sob mudança posterior do score no vendor NÃO é asseverada por este spec — ver [Gaps](#gaps--hypothesis). Fonte: `02-originacao-pipeline.md:583-594`.
>
> **Esquema confirmado (qa2, probe read-only 2026-06-19):**
> - `uown_los_uwdata.{npm_segment,tam_score}` :: `integer` (nullable) — colunas #31/#32 da tabela de 32 colunas.
> - `uown_sv_uwdata.{npm_segment,tam_score}` :: `integer` (nullable).
> - Origem: nós `out.npm_segment` / `out.tam_score` da resposta GDS → `GdsResponseParser` → `UnderwritingService.toUWInfo` → persist. Fonte: `02-originacao-pipeline.md:587-594`; `npm-segment-tam-score-snapshot-routing.md:28-29`.
>
> **Roteamento por engine/segmento (canônico — volatile, cross-check antes de reusar):**
>
> | Score | Quando popula | Segmento/rota | Alcançável em qa2? |
> |---|---|---|---|
> | `npm_segment` | qualquer aprovação **GDS + eligible_terms=16** | não-TireAgent (Kornerstone, V1_UOWN, PAY_TOMORROW) | **SIM** — recipe KS16775 16m + bank data |
> | `tam_score` | aprovação **GDS + 16m + segmento TIRE_AGENT** | TireAgent exclusivo | **NÃO** — TireAgent qa2 = GDS mas capa em 13m; combinação inatingível por qualquer alavanca de API |
>
> Fonte: `npm-segment-tam-score-snapshot-routing.md:31-42,56-85`; `02-originacao-pipeline.md:589-593`.

---

## CT-01 — `npm_segment` populado em aprovação GDS 16m (lado lead)

> Ramo positivo (happy path). Recipe live-proven 2026-06-19: **KS16775** (Kornerstone 16m, pk 657) + dados bancários + estado do cliente **OH** → GDS APPROVED `eligible_terms=16` → `npm_segment` não-nulo.

```gherkin
Dado que uma aplicação fresca do merchant Kornerstone KS16775 é criada via API com dados bancários (TEST_BANK padrão) e estado do cliente OH em qa2
E os tokens de sweep GDS e Kount foram atualizados antes do envio (evita UW_DENIED espúrio por token stale)
E a decisão de underwriting foi resolvida pela engine GDS com eligible_terms contendo "16" (guard de pré-assert; caso contrário o cenário é pulado, não falha)
Quando o snapshot de UW do lead é consultado em uown_los_uwdata
Então a coluna npm_segment do lead é um inteiro não-nulo
E uma releitura fresca de uown_los_uwdata confirma que npm_segment persistiu e que decided_by_agent permanece "GDS"
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard: engine + termo (senão skip, NÃO fail) | `decided_by_agent` (uppercase) === `'GDS'` **E** `eligible_terms` casa `/16/` — caso contrário `test.skip` com motivo (Regra #10: nunca red-assert em rota env-dependente) | `spec:158-173` |
| Presença assíncrona da linha de decisão | `db.waitForRecord('uown_los_uwdata', 'lead_pk = $1', [leadPk], 120_000)` retorna a linha antes de ler engine/termo | `spec:161` |
| `npm_segment` não-nulo | `db.waitForUwNpmSegment(leadPk, 90_000)` retorna linha com `npm_segment != null` (poll até popular; write GDS é assíncrono à linha de decisão) | `spec:178-184`; `database.helpers.ts:561-570` |
| `npm_segment` é inteiro | `Number.isInteger(Number(row.npm_segment)) === true` | `spec:186` |
| Releitura fresca (consequence oracle) | `db.getUwScoresByLeadPk(leadPk)` → `npm_segment` não-nulo E `decided_by_agent` (uppercase) === `'GDS'` (não confiar no payload polido) | `spec:188-190`; `database.helpers.ts:529-538` |

```sql
-- Validação DB CT-01 (substituir $lead_pk) — projeção read-only, ORDER BY pk DESC LIMIT 1
SELECT lead_pk, npm_segment, tam_score, decided_by_agent, eligible_terms, uw_status
  FROM uown_los_uwdata
 WHERE lead_pk = $lead_pk
 ORDER BY pk DESC
 LIMIT 1;
-- Esperado: npm_segment IS NOT NULL (integer), decided_by_agent='GDS', eligible_terms ~ '16'
```

> **Por que o guard é essencial (Regra #10):** `npm_segment` só é escrito no ramo GDS 16m. Se qa2 rotear o lead por outra engine/termo (TAKTILE/BLACKBOX/INTERNAL, ou GDS 13m), `npm_segment` legitimamente fica NULL e asseverar seria um falso-bug. O guard converte volatilidade de ambiente em skip controlado, nunca em red-assert. Fonte: `spec:152-172`; `npm-segment-tam-score-snapshot-routing.md:54`.

---

## CT-02 — `tam_score` populado (TireAgent, 16m, GDS) — BLOCKED by env (qa2)

> **`test.skip` permanente em qa2** (`spec:281-299`). Ramo positivo do score exclusivo TireAgent, mantido nomeado para rastreabilidade e como contrato para o dia em que um ambiente alcançável (stg/dev2) for confirmado.

```gherkin
Dado um ambiente onde o TireAgent aprova 16m via engine GDS (candidato stg/dev2 — inalcançável em qa2)
E uma aplicação TireAgent com a modalidade SSN Second Look (perfil pinado com rua real) e dados bancários é levada à segunda submissão que dispara o ramo GDS 16m
Quando o snapshot de UW do lead é consultado em uown_los_uwdata
Então tanto npm_segment quanto tam_score são inteiros não-nulos
E o log de atividade contém a nota de decisão [UnderwritingService][runUnderwriting] UW_APPROVED (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Guard obrigatório (mesmo padrão do CT-01) | `decided_by_agent='GDS'` **E** `eligible_terms ~ '16'`; senão skip — um TireAgent não-16m lê `tam_score=NULL` e sem o guard seria falso-bug | `spec:294-295` (comentário do stub) |
| `npm_segment` E `tam_score` não-nulos (inteiros) | ambos `IS NOT NULL`; recipe a habilitar em stg/dev2 | `spec:296` |
| Bloqueio de ambiente (`[CONFIRMADO por dados]`) | `count(tam_score)=0` em 6046 linhas `uown_los_uwdata` + 2037 `uown_sv_uwdata` (qa2); TireAgent qa2 = GDS APPROVED mas capa em `eligible_terms='13'`; Second Look `100000053` = DENIED/short-circuit em qa2 (só completa em stg); combinação TireAgent+16m+GDS inatingível por qualquer alavanca de API (`updateMerchants` não controla o termo concedido pela GDS) | `spec:236-299`; `npm-segment-tam-score-snapshot-routing.md:37-42,56-85` |

> **Por que está bloqueado:** experimento decisivo via API 2026-06-21 (apps frescas, pós-migration, com bank data) provou: (1) lead 16794 TireAgent+CA+SSN916+bank → GDS APPROVED `eligible_terms='13'`, `tam_score=NULL`; (2) lead 16795 TireAgent+OH+SSN916 → DENIED; (3) config de merchant NÃO é a alavanca (TireAgent já tem 2 programas 16m ativos KWC-2.3/KWC-1.75); (4) sufixo SSN 916 é mock-only (BlackBox qa1/sandbox) — em qa2 TireAgent roteia pela GDS que ignora o mock. ESCALADO para Marcos/dev. Fonte: `npm-segment-tam-score-snapshot-routing.md:56-89`; `spec:236-279`.

---

## CT-03 — `tam_score` NULL no ramo não-TireAgent (Kornerstone) [controle]

> Partição de controle, **fundido com CT-01 no código** sobre o MESMO lead (`spec:138-146,193-204`) — mantido nomeado para rastreabilidade. Prova que o ramo TireAgent-only é um ramo real, não um flake.

```gherkin
Dado o mesmo lead KS16775 aprovado do CT-01 (GDS 16m, npm_segment populado)
Quando o snapshot de UW do lead é consultado em uown_los_uwdata
Então a coluna tam_score do lead é NULL
E a coexistência de npm_segment não-nulo com tam_score NULL confirma que tam_score é exclusivo do ramo TireAgent (não vazou para Kornerstone)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Linha de UW presente | `db.getUwScoresByLeadPk(leadPk)` !== null | `spec:197-198` |
| `tam_score` é NULL (controle) | `row.tam_score` === `null` para lead Kornerstone (não-TireAgent); um `tam_score` populado aqui significaria vazamento do ramo TireAgent-only | `spec:199-203` |

```sql
-- Validação DB CT-03 (mesmo lead do CT-01): tam_score DEVE ser NULL
SELECT tam_score FROM uown_los_uwdata WHERE lead_pk = $lead_pk ORDER BY pk DESC LIMIT 1;
-- Esperado: NULL (ramo não-TireAgent)
```

---

## CT-04 — snapshot em `uown_sv_uwdata` no funding carrega os scores — BLOCKED by env (qa2)

> **`test.skip`** (`spec:320-333`). Cópia lado-Servicing de `npm_segment`/`tam_score`, escrita no funding → account. O SPEC escopa CT-04 à cópia COMPLETA (npm_segment + tam_score), que depende do CT-02 (tam_score) — inatingível em qa2 → mantido pulado junto com CT-02 para evitar um CT-04 parcial/enganoso.

```gherkin
Dado o lead aprovado do CT-02 (npm_segment E tam_score populados no lado lead)
Quando o lead é levado a FUNDING via driveLeadToFunding → updateFundingStatus(FUNDED) e o account é resolvido
E o snapshot de UW do account é consultado em uown_sv_uwdata
Então uown_sv_uwdata.npm_segment do account é igual ao npm_segment do lead
E uown_sv_uwdata.tam_score do account é igual ao tam_score do lead
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Cópia de `npm_segment` | `db.getSvUwScoresByAccountPk(accountPk).npm_segment` === `db.getUwScoresByLeadPk(leadPk).npm_segment` | `spec:327-330`; `database.helpers.ts:544-553` |
| Cópia de `tam_score` | `sv.tam_score` === `lead.tam_score` | `spec:330` |
| Account NULL com lead populado | classificar como `[OBSERVAÇÃO]`, NÃO como bug auto-confirmado (Regra #10) | `spec:331` |
| Mecânica da cópia | o snapshot do account copia o objeto `UWInfo` do lead na importação LOS→SVC na criação do account, NÃO a config viva do vendor | `02-originacao-pipeline.md:585,592` |

```sql
-- Validação DB CT-04 (substituir $account_pk) — projeção read-only
SELECT account_pk, npm_segment, tam_score, decided_by_agent, eligible_terms
  FROM uown_sv_uwdata
 WHERE account_pk = $account_pk
 ORDER BY pk DESC
 LIMIT 1;
-- Esperado: mesmos npm_segment/tam_score do lado lead (uown_los_uwdata)
```

---

## Log de Atividade (Regra #13)

O write dos dois scores é **silencioso** — o backend os grava como `lambda_segment`, sem nota dedicada de "snapshot" em `uown_los_lead_notes` (confirmado ao vivo no lead 16656, qa2). Portanto a Regra #13 é satisfeita asseverando a nota da **DECISÃO de UW** durante a qual o snapshot é gravado: a transição de aprovação de underwriting.

```gherkin
Dado que o lead KS16775 do CT-01 foi aprovado pela engine GDS
Quando o log de atividade do lead é consultado em uown_los_lead_notes
Então existe ao menos uma nota de decisão de UW (runUnderwriting / UW_APPROVED / ApplicationProcessor approved)
E nenhuma nota reporta uma negação (UW_DENIED / DECLINED / denied) — negação significaria ausência do ramo npm_segment
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Nota de decisão de UW presente | `uown_los_lead_notes` WHERE `lead_pk=$1` com `notes ILIKE '%[UnderwritingService]%runUnderwriting%'` OU `'%[UnderwritingService]%UW_APPROVED%'` OU `'%[ApplicationProcessor]%approved%'` → não-nulo | `spec:206-228` |
| Nota casa engine/aprovação | `note.notes` casa `/UnderwritingService\|ApplicationProcessor/i` | `spec:229` |
| Guard negativo | `note.notes` **não** casa `/UW_DENIED\|DECLINED\|denied/i` | `spec:230-231` |

```sql
-- Validação DB Log de Atividade (substituir $lead_pk)
SELECT pk, notes
  FROM uown_los_lead_notes
 WHERE lead_pk = $lead_pk
   AND (notes ILIKE '%[UnderwritingService]%runUnderwriting%'
     OR notes ILIKE '%[UnderwritingService]%UW_APPROVED%'
     OR notes ILIKE '%[ApplicationProcessor]%approved%')
 ORDER BY pk DESC
 LIMIT 1;
-- Esperado: nota presente, mencionando a engine/aprovação de UW; NÃO uma negação
```

---

## Pré-condições

- **Merchant object-of-test (hardcoded, NÃO `pickRandomMerchantKey`):** KS16775 (`BrooklynFurnitureKS16775`, pk 657, `KORNERSTONE`, `ONLINE`, 16m GDS route). O roteamento do merchant É o objeto do teste (Test-Data Hierarchy "teste de configuração de merchant"). Todos os valores DB-probed em qa2 2026-06-19; re-asseverados read-only em runtime, NUNCA mutados. Fonte: `spec:53-70`.
- **Estado do cliente OH:** confirmado live para rotear KS16775 a GDS APPROVED `eligible_terms=16` com `npm_segment` populado (leads qa2 16656/16640/16636). CO/CA/IA também funcionam. Fonte: `spec:72-74`.
- **`skipMerchantPreflight: true` obrigatório (Regra #12):** KS16775 legitimamente tem `use_webhook`/`hold_deposit=true`; mutar a config Kornerstone para casar o contrato UOWN seria efeito colateral / drift falso. Fonte: `spec:96-97,114`.
- **Dados bancários obrigatórios (Modalidade B / pitfall #5 do application-lifecycle):** `bankData` com `TEST_BANK.DEFAULT_ROUTING` + `DEFAULT_ACCOUNT` no corpo de `createPreQualifiedApplication` — sem isso o lead Kornerstone nunca alcança a aprovação. Fonte: `spec:118-126`; `constants.ts:73,75`.
- **Sem bypass de SEON:** `is_seon_id_check_required=FALSE` para KS16775 → nenhum bypass necessário. Fonte: `spec:66`.
- **Refresh de sweeps GDS + Kount ANTES do envio (caveat qa2):** tokens stale causam `UW_DENIED` espúrio; a recipe do npm_segment EXIGE aprovação GDS. `api.scheduledTask.refreshGdsAccessTokenSweep()` + `refreshKountAccessTokenSweep()` (fraud-vendors-knowledge §3). Fonte: `spec:105-107`; `underwriting-and-funding-test-data-paths.md:140`.
- **Timeout estendido:** `test.setTimeout(420_000)` — `sendApplication` KS + aprovação GDS em qa2 podem ser lentos. Fonte: `spec:148`.
- **Dados frescos (Regra #9):** email único por run via `buildTestData`/`createPreQualifiedApplication`; leadPk capturado em `ctx.leadPk` e anotado. Fonte: `spec:88-135`.
- **Projeto Playwright:** o spec vive em `tests/e2e/origination/` → coberto pelo projeto `origination-ui` (não `task-testing-origination`). A tag `@origination` é apenas rótulo de portal aqui, não seletor. Fonte: `spec:76-82`.

---

## Gaps / [HYPOTHESIS]

- **Imutabilidade sob mudança posterior do vendor NÃO é testada.** O nome "snapshot" e `02-originacao-pipeline.md:592` implicam captura point-in-time; a cópia lado-account (`uown_sv_uwdata`) preserva os valores do lead no funding. Porém ESTE spec **não** contém um cenário que altere o score no vendor após a decisão e reconfirme que a coluna persistida não muda — diferente do `underwriting-and-funding-test-data-paths.md` (merchant-settings snapshot), que testa imutabilidade sob edição de merchant. `[HYPOTHESIS]` de que o mesmo se aplica aos scores GDS por analogia (mesma mecânica LOS→SVC copy). Se um cenário de imutabilidade for exigido pelo PO, é trabalho de spec novo, não coberto aqui.
- **Semântica/faixa dos scores é `[HYPOTHESIS]`.** `npm_segment` (risk segment) e `tam_score` (model score, TireAgent-only; valor 475 observado ao vivo em stg) não têm semântica/range documentados no código svc — a asserção é apenas "inteiro não-nulo" / "NULL no controle", NÃO um valor exato. Fonte: `02-originacao-pipeline.md:589-590`.
- **CT-02 e CT-04 bloqueados por ambiente** (`test.skip`) — `tam_score` inatingível em qa2 por qualquer alavanca de API (`[CONFIRMADO por dados]` 2026-06-21). Habilitar apenas quando stg/dev2 for confirmado alcançável a partir do host de teste (STG `34.121.232.252:5432` sem rota/VPN hoje; dev2 exige tunnel kubectl próprio). Escalado a Marcos/dev. Fonte: `npm-segment-tam-score-snapshot-routing.md:47-53,84-85`.
- **Sem cobertura de UI** — se o produto expuser esses scores em alguma tela do Origination futuramente, adicionar um CT de render e revisar a nota "sem superfície de UI" no cabeçalho (Regra #14/#18).

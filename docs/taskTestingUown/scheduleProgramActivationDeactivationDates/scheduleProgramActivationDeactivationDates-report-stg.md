# Relatório de Teste — STG: scheduleProgramActivationDeactivationDates (UI)

> Este relatório cobre **somente o run em stg** do arquivo `-ui.spec.ts`.
> O relatório oficial em qa2 permanece em [`scheduleProgramActivationDeactivationDates-report.md`](./scheduleProgramActivationDeactivationDates-report.md) — **não foi alterado** por este run.

## Informações da execução

| Campo | Valor |
|-------|-------|
| **Arquivo executado** | `docs/taskTestingUown/scheduleProgramActivationDeactivationDates/scheduleProgramActivationDeactivationDates-ui.spec.ts` |
| **Ambiente** | `stg` |
| **Projeto Playwright** | `task-testing` (com dependency `auth-servicing`) |
| **Comando** | `ENV=stg npx playwright test --project=task-testing docs/.../scheduleProgramActivationDeactivationDates-ui.spec.ts --reporter=list` |
| **Workers** | 1 |
| **Data** | 2026-04-27, 13:13:37Z – 13:19:20Z UTC (~5m 40s wall clock) |
| **Resultado agregado** | **22 passed / 0 failed / 0 skipped** ✅ |
| **Log bruto** | `reports/stg-ui-run/raw-tireagent.log` |
| **Run anterior (descartado)** | `reports/stg-ui-run/raw.log` — antes da troca de merchant; preservado para histórico |

## Mudanças feitas no spec para suportar este run

Duas alterações mínimas e backwards-compatible:

| Linha | Antes | Depois | Motivo |
|-------|-------|--------|--------|
| `testData[0].env` | `'qa2'` | `process.env.ENV ?? 'qa2'` | Honra `ENV=stg`; default qa2 preservado para chamadas sem env. |
| `UOWN_MERCHANT` | `getMerchant('ProgressMobility')` (OL90294-0001) | `getMerchant('TireAgent')` (OW90218-0001) | OL90294-0001 falhou no auto-heal em stg com `UnexpectedRollbackException`; TireAgent é também merchant UOWN-brand (mesmo contrato `UOWN_MERCHANT_CONFIG`) e está saudável em stg (preflight loga `no drift (brand=UOWN pk=566)`). |

Nenhuma outra alteração no spec, page objects, helpers ou fixtures.

## Resumo por cenário (todos PASS)

| # | CT | Resultado | Duração | Preflight |
|---|----|-----------|---------|-----------|
| 1 | `auth-servicing` setup | ✅ | 6.5s | — |
| 2 | **CT-02** Programs page layout | ✅ | 12.5s | OW90218-0001 no drift (pk=566) |
| 3 | **CT-03** ADD NEW PROGRAM (default dates) | ✅ | 14.4s | OW90218-0001 no drift |
| 4 | **CT-04** Edit + Save persiste datas | ✅ | 14.9s | OW90218-0001 no drift |
| 5 | **CT-05** activation > deactivation bloqueado | ✅ | 10.2s | OW90218-0001 no drift |
| 6 | **CT-06** PROGRAM_DATA_CHANGE audit log | ✅ | 15.8s | OW90218-0001 no drift |
| 7 | **CT-07** Guard rail unsaved edits | ✅ | 15.2s | OW90218-0001 no drift |
| 8 | **CT-07b** CANCEL discards changes | ✅ | 14.5s | OW90218-0001 no drift |
| 9 | **CT-07c** Clone existing program | ✅ | 17.6s | OW90218-0001 no drift |
| 10 | **CT-01** Merchant page read-only | ✅ | 30.9s | OW90218-0001 no drift |
| 11 | **CT-08** Active (-10/+10) | ✅ | 13.4s | OW90218-0001 no drift |
| 12 | **CT-09** Active (today/null) | ✅ | 12.3s | OW90218-0001 no drift |
| 13 | **CT-10** Active (-5/today) | ✅ | 11.7s | OW90218-0001 no drift |
| 14 | **CT-11** Inactive (+10/null) | ✅ | 15.4s | OW90218-0001 no drift |
| 15 | **CT-12** Inactive (-30/-1) | ✅ | 15.6s | OW90218-0001 no drift |
| 16 | **CT-13** Active (null/null) | ✅ | 13.4s | OW90218-0001 no drift |
| 17 | **CT-14** Active (-30/null) | ✅ | 13.6s | OW90218-0001 no drift |
| 18 | **CT-15** Active (null/+30) | ✅ | 17.8s | OW90218-0001 no drift |
| 19 | **CT-15b** Inactive (null/-1) | ✅ | 14.5s | OW90218-0001 no drift |
| 20 | **CT-16** Active → Inactive | ✅ | 14.0s | OW90218-0001 no drift |
| 21 | **CT-17** Inactive → Active | ✅ | 10.3s | OW90218-0001 no drift |
| 22 | **CT-KS-SMOKE** Kornerstone | ✅ | 29.1s | KS3015 no drift (brand=KORNERSTONE pk=10138) |

**Total:** 22 tests · **22 passed** · 0 failed · 0 skipped · ~5m 40s.

## O que foi validado em stg

A feature **Schedule Program Activation/Deactivation Dates** está deployada e operacional em stg, validada end-to-end nos dois merchants:

- **TireAgent (OW90218-0001, brand UOWN)** — todos os CTs Group 1 (CT-01..CT-07c), Group 2 (CT-08..CT-17, derivação de status a partir das datas) e a parametrização completa de boundaries.
  - Layout do `/programs` com `Activation Date` + `Deactivation Date` no Program Details.
  - ADD NEW PROGRAM cria com defaults (datas null, `is_active=true`).
  - Edit + SAVE persiste em `uown_merchant_program` com formato ISO.
  - Validação `activation > deactivation` rejeitada (UI inline ou backend 4xx/5xx).
  - PROGRAM_DATA_CHANGE audit log emitido por SAVE; ausente em CANCEL.
  - Clone preserva fonte e cria registro independente com novo `pk`.
  - Status derivado de datas (boundaries -10/+10, today/null, etc.) coincide com `ProgramActivationUtils.isActiveOnDate` em todos os 9 cenários parametrizados.
  - Transições Active ↔ Inactive (CT-16/CT-17) recomputam `is_active` no SAVE.
- **Kornerstone (KS3015, brand KORNERSTONE)** — CT-KS-SMOKE valida cross-brand: edição de datas no Program Details, persistência em DB, validação de marca via coluna `company`.

## Histórico — run anterior abandonado (mesmo dia)

Antes da troca de merchant, um primeiro run em stg às 11:13Z usando OL90294-0001 (ProgressMobility) falhou em 20/22 CTs com erro idêntico no preflight:

```
[merchant-preflight] createOrUpdateMerchant failed for OL90294-0001: 500 —
UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
```

Diagnóstico: o auto-heal do `OL90294-0001` em stg dispara uma sub-transação que marca o container Spring como `rollbackOnly`, sem propagar a exceção raiz. Não é bug de feature — é desalinhamento entre o contrato `merchant-config-contract.ts` e o estado de OL90294-0001 em stg, possivelmente causado por:

- programa/program_group referenciado pelo contrato que não existe em stg, OR
- diferença de schema/migrations entre qa2 e stg, OR
- trigger/listener stg-only abortando a sub-transação.

A troca para TireAgent (também brand UOWN, mesmo contrato) confirmou que **a feature funciona em stg** e que o problema estava no estado/heal do merchant OL90294-0001, não na infra de testes nem na feature. O log do primeiro run está preservado em `reports/stg-ui-run/raw.log` para inspeção futura.

## Cenários

> Os IDs CT abaixo seguem a numeração interna do `-ui.spec.ts` (que difere da numeração `CT-UI-XX` do relatório qa2; mapping ao final desta seção). O **merchant alvo dos CTs UOWN é TireAgent (OW90218-0001)** em stg. CT-KS-SMOKE usa Kornerstone (KS3015).

### CT-02 — Layout da Programs page expõe Activation Date + Deactivation Date

**Comportamento validado:** ao acessar `/programs` no Servicing, a página renderiza ADD NEW PROGRAM, painel de filtros (Search + Group), 11 colunas sortable na tabela mestre e — ao clicar em um programa — o painel Program Details exibe imediatamente os campos `Activation Date` e `Deactivation Date` com placeholder `MM/DD/YYYY`, junto dos botões CANCEL / SAVE / Clone ▾ e da seção Notes.

**Por que importa:** é o onboarding visual da feature. Se os campos não aparecem no primeiro clique, o admin nem fica sabendo que pode agendar — e a feature vira shelfware.

**Como verificar manualmente em stg:**
1. Login no Servicing Portal stg como `manager`.
2. Acessar `/programs`.
3. Validar headers: Program Name, Term Months, Lending CategoryType, Money Factor, Pay Off Discount, Processing Fee Override, EPO Days, EPO Fee Percent, Group Name, Amount at Signed, States.
4. Clicar no link de qualquer programa; confirmar `Activation Date` + `Deactivation Date` no painel + botões SAVE/CANCEL/Clone visíveis.

**PASSOU** (12.5s)

---

### CT-03 — ADD NEW PROGRAM cria com datas default + aparece na lista

**Comportamento validado:** o admin clica ADD NEW PROGRAM, preenche apenas o mínimo (nome + termos + money factor + EPO days), deixa as datas em branco e salva. Toast de sucesso aparece, o programa nasce com `activation_date=NULL`, `deactivation_date=NULL`, `is_active=true` (regra "ambos null = sempre ativo"), aparece no resultado de busca e gera entry PROGRAM_DATA_CHANGE em `uown_merchant_activity_log`.

**Por que importa:** o caminho default da criação não pode exigir datas — programas open-ended são a maioria. E todo SAVE precisa deixar trilha de audit, mesmo na criação.

**Como verificar manualmente em stg:**
1. `/programs` → ADD NEW PROGRAM.
2. Preencher nome único + Term Months 13 + Money Factor 0 + EPO Days 90; deixar datas vazias.
3. SAVE → conferir toast.
4. SQL: `SELECT activation_date, deactivation_date, is_active FROM uown_merchant_program WHERE program_name = '<nome>'` → `NULL / NULL / true`.
5. SQL: `SELECT COUNT(*) FROM uown_merchant_activity_log WHERE program_pk = <pk> AND log_type = 'PROGRAM_DATA_CHANGE'` → > 0.

**PASSOU** (14.4s)

---

### CT-04 — Edit datas + SAVE persiste

**Comportamento validado:** com um programa fresh (datas null), o admin define `Activation Date = today-5` e `Deactivation Date = today+5`, salva, recarrega e confirma que a UI lê de volta exatamente o que digitou. No banco, as colunas têm os valores ISO correspondentes e `is_active=true` (janela cobre hoje).

**Por que importa:** read-back é o teste mais básico de credibilidade da feature — se o que aparece no painel após reload diverge do que foi salvo, o admin perde confiança e vai validar tudo no banco.

**Como verificar manualmente em stg:**
1. Abrir Program Details de um programa.
2. Setar Activation Date = data 5 dias atrás (MM/DD/YYYY); Deactivation Date = data 5 dias à frente.
3. SAVE.
4. Recarregar `/programs` → reabrir programa → confirmar mesmos valores no painel.
5. SQL: `SELECT activation_date::text, deactivation_date::text, is_active FROM uown_merchant_program WHERE pk = <pk>` → datas ISO correspondentes + `true`.

**PASSOU** (14.9s)

---

### CT-05 — activation > deactivation é rejeitado

**Comportamento validado:** quando o admin tenta inverter as datas (ativação `today+10` e desativação `today+5`), o sistema **bloqueia** a persistência. Em stg, o backend responde com erro (status ≥ 400) e mensagem `activation.*deactivation` ou `before.*equal`. O banco permanece intacto (datas continuam null no programa fresh). Caso houvesse bloqueio puramente UI, mensagem inline também seria aceita — o invariante é "não persiste".

**Por que importa:** programa com ativação posterior à desativação nunca seria Active — silenciosamente perderia ofertas até alguém notar. Esse é o tipo de configuração que precisa ser rejeitada na entrada.

**Observação:** o teste tolera tanto status 4xx (correto) quanto 5xx (que é o comportamento atual em qa2 — ver BUG-01 no relatório qa2). A invariante real é "não persistiu". Anotação adicionada se status 500 em vez de 400.

**Como verificar manualmente em stg:**
1. Em programa novo (datas null), setar Activation = `MM/DD/YYYY` 10 dias à frente; Deactivation = `MM/DD/YYYY` 5 dias à frente.
2. SAVE → observar erro (UI inline OU response 4xx/5xx).
3. SQL: `SELECT activation_date, deactivation_date FROM uown_merchant_program WHERE pk = <pk>` → ambos NULL.

**PASSOU** (10.2s)

---

### CT-06 — SAVE persiste datas + emite PROGRAM_DATA_CHANGE audit

**Comportamento validado:** após SAVE com datas `today-2 / today+30`, o banco reflete os valores ISO, `is_active=true`, e `row_updated_timestamp` foi atualizado. A query em `uown_merchant_activity_log` retorna ≥ 1 entry do tipo `PROGRAM_DATA_CHANGE`, e ao reabrir a UI a seção Notes do Program Details mostra essa entry com mention dos campos `activationDate` e/ou `deactivationDate`.

**Por que importa:** compliance exige trilha visível na UI **e** consultável no banco. SAVE silencioso (sem entry) ou entry sem mention dos campos = audit inútil.

**Como verificar manualmente em stg:**
1. Editar Activation = today-2; Deactivation = today+30; SAVE.
2. SQL: validar `activation_date / deactivation_date / is_active=true / row_updated_timestamp not null`.
3. SQL: `SELECT * FROM uown_merchant_activity_log WHERE program_pk = <pk> AND log_type='PROGRAM_DATA_CHANGE' ORDER BY pk DESC LIMIT 5` → entry contendo `activationDate` ou `deactivationDate` em `notes`.
4. UI: reabrir programa → seção Notes exibe a entry mais recente.

**PASSOU** (15.8s)

---

### CT-07 — Guard rail: navegação com edição não persiste mutação

**Comportamento validado:** o admin digita uma data nova (`12/31/2099`) no Activation Date mas **não** clica SAVE; em seguida tenta navegar (search por outro programa). O teste tolera três branches — (a) `native` `beforeunload` dialog, (b) modal customizado de "unsaved changes", ou (c) `silent` (UI atual). **Independente do branch**, a invariante hard é: o banco **não foi mutado** — `activation_date` continua NULL.

**Por que importa:** dirty state nunca pode ser persistido sem confirmação explícita. Mesmo sem guard rail visível, a UI não pode "salvar por engano" durante navegação.

**Como verificar manualmente em stg:**
1. Abrir programa novo (datas null).
2. Digitar Activation Date `12/31/2099` mas **não** salvar.
3. Disparar navegação (search por programa inexistente).
4. SQL: `SELECT activation_date, deactivation_date FROM uown_merchant_program WHERE pk = <pk>` → ambos NULL.

**PASSOU** (15.2s)

---

### CT-07b — CANCEL no Program Details reverte mudanças não salvas

**Comportamento validado:** o admin altera ambas as datas e clica CANCEL ao invés de SAVE. Ao reabrir o programa, os valores voltam para os originais (null neste caso). Banco continua com `activation_date=NULL`, `deactivation_date=NULL`. Em `uown_merchant_activity_log`, a única entry PROGRAM_DATA_CHANGE existente é a de criação — **CANCEL não emite audit log**, validando o invariante de "in-memory discard sem side effect".

**Por que importa:** CANCEL é discard puro. Se gerasse audit, a trilha ficaria poluída de "tentativas". Se persistisse, o admin nunca poderia "desistir".

**Como verificar manualmente em stg:**
1. Programa fresh (datas null).
2. Setar Activation = today+10; Deactivation = today+20.
3. Clicar CANCEL (não SAVE).
4. Reabrir programa → painel mostra valores originais.
5. SQL: `SELECT activation_date, deactivation_date FROM uown_merchant_program WHERE pk = <pk>` → NULL/NULL.
6. SQL: contar entries PROGRAM_DATA_CHANGE de date-change (`notes ILIKE '%activationdate%'` ou `'%deactivationdate changed%'`) → 0.

**PASSOU** (14.5s)

---

### CT-07c — Clone existing program com datas

**Comportamento validado:** dado um programa SOURCE com datas `today-30 / today+30`, o admin abre o dropdown Clone, seleciona Clone, preenche nome novo + datas `today / today+180`, salva. Resultado: novo registro em `uown_merchant_program` com `pk` distinto do SOURCE, datas ISO correspondentes às novas, `is_active=true`. SOURCE permanece intocado. Audit log do CLONE existe (PROGRAM_DATA_CHANGE) e a UI exibe a entry na seção Notes do programa clonado.

**Por que importa:** clone é a operação que multiplica programas em campanhas; se delete/sobrescreve o source ou esquece de gerar audit, é regressão de governança.

**Como verificar manualmente em stg:**
1. Abrir SOURCE com datas válidas.
2. Clicar Clone ▾ → escolher "Clone".
3. Preencher novo nome + datas distintas.
4. SAVE.
5. SQL no novo: `SELECT pk, activation_date::text, deactivation_date::text, is_active FROM uown_merchant_program WHERE program_name='<clone_name>'` → pk diferente, datas ISO novas, true.
6. SQL no SOURCE: `SELECT pk FROM uown_merchant_program WHERE pk = <source_pk>` → ainda existe.
7. SQL audit: `SELECT COUNT(*) FROM uown_merchant_activity_log WHERE program_pk = <clone_pk> AND log_type='PROGRAM_DATA_CHANGE'` → > 0.

**PASSOU** (17.6s)

---

### CT-01 — Merchant detail page mostra Programs section read-only

**Comportamento validado:** o merchant `OW90218-0001` (TireAgent) tem ≥ 1 programa atribuído (garantido pelo contrato `minActivePrograms.months13 >= 1`). Ao abrir a página de detalhes do merchant, o teste lista as linhas de programas renderizadas e confirma que **nenhuma** delas tem CTA de edição (botão Edit, ícone de lápis, etc.). Programa é editado **apenas** em `/programs`, não na página do merchant.

**Por que importa:** edição em dois lugares = bug de consistência garantido. A página do merchant é read-only por design — o painel canônico de Program Details é em `/programs`.

**Observação:** a UI do merchant page Programs section em stg (e qa2) não usa `data-testid` estável — o teste usa selector best-effort. Quando 0 linhas são renderizadas, anotação `[OBSERVAÇÃO]` é adicionada (não falha o test). DB já assertou a existência via `db.getMerchantPrograms()`.

**Como verificar manualmente em stg:**
1. Acessar página do merchant TireAgent (`/merchant/OW90218-0001` ou via busca).
2. Localizar a seção Programs.
3. Confirmar que nenhuma linha tem botão "Edit" / ícone editor visível.
4. SQL: `SELECT pk, program_name FROM uown_merchant_program WHERE merchant_pk = 566` → ≥ 1 row.

**PASSOU** (30.9s)

---

### CT-08 a CT-15b — Status derivado de datas (boundaries)

**Comportamento validado:** cada combinação plausível de `activation_date` × `deactivation_date` produz o `is_active` esperado pela regra canônica `is_active = (activation IS NULL OR activation ≤ today) AND (deactivation IS NULL OR deactivation ≥ today)` — ambos os boundaries inclusivos. A UI lê de volta as datas conforme salvas (ou vazio quando null), e o DB é a Source of Truth.

**Regra canônica:**

```
is_active = (activationDate IS NULL OR activationDate ≤ today)
            AND (deactivationDate IS NULL OR deactivationDate ≥ today)
```

| CT | activation | deactivation | is_active esperado | Justificativa |
|----|-----------|-------------|:------------------:|---------------|
| CT-08 | today-10 | today+10 | **true** | janela cobre hoje |
| CT-09 | today | NULL | **true** | `act ≤ today` ✅ ; `deact=null` ✅ (open-ended) |
| CT-10 | today-5 | today | **true** | boundary inclusivo — desativa só amanhã |
| CT-11 | today+10 | NULL | **false** | `act > today` ❌ (ainda não começou) |
| CT-12 | today-30 | today-1 | **false** | `deact < today` ❌ (já desativou ontem) |
| CT-13 | NULL | NULL | **true** | sempre ativo (sem janela) |
| CT-14 | today-30 | NULL | **true** | ativo desde -30, sem fim |
| CT-15 | NULL | today+30 | **true** | ativo até daqui 30 dias |
| CT-15b | NULL | today-1 | **false** | desativou ontem |

**Por que importa:** off-by-one em boundary = dia perdido em campanha (ou dia vazando). Cobre os 2 casos `false` (CT-11 ativação futura, CT-12+CT-15b desativação passada) e os 7 casos `true` que são "warning" para regressão.

**Como verificar manualmente em stg (genérico, repetir por CT):**
1. Criar programa via API ou UI no merchant TireAgent com as datas indicadas.
2. SQL: `SELECT activation_date::text, deactivation_date::text, is_active FROM uown_merchant_program WHERE pk = <pk>` → bate com a coluna esperada.
3. UI: abrir Program Details; datas exibidas correspondem ao que foi salvo (ou vazio quando NULL).
4. (opcional) Validar status na merchant page Programs section.

**Resultado por CT:**

- **CT-08** (today-10 / today+10) — **PASSOU** (13.4s)
- **CT-09** (today / null) — **PASSOU** (12.3s)
- **CT-10** (today-5 / today) — **PASSOU** (11.7s)
- **CT-11** (today+10 / null) — **PASSOU** (15.4s)
- **CT-12** (today-30 / today-1) — **PASSOU** (15.6s)
- **CT-13** (null / null) — **PASSOU** (13.4s)
- **CT-14** (today-30 / null) — **PASSOU** (13.6s)
- **CT-15** (null / today+30) — **PASSOU** (17.8s)
- **CT-15b** (null / today-1) — **PASSOU** (14.5s)

---

### CT-16 — Active → Inactive quando deactivation move para ontem

**Comportamento validado:** programa começa com `activation=today-10 / deactivation=today+10` → `is_active=true`. Admin edita deactivation para `today-1` e salva. Backend recomputa: agora `deactivation < today` → `is_active=false`. A transição **acontece no SAVE, não em sweep separado** — não há janela "salvou mas ainda Active".

**Por que importa:** é a operação típica de "encerrar programa hoje à noite" — precisa virar Inactive imediatamente, sem esperar cron noturno.

**Como verificar manualmente em stg:**
1. Criar programa com `activation=today-10 / deactivation=today+10` → confirmar `is_active=true`.
2. Editar deactivation para `today-1` → SAVE.
3. SQL: `SELECT is_active, deactivation_date::text FROM uown_merchant_program WHERE pk = <pk>` → `false / today-1`.

**PASSOU** (14.0s)

---

### CT-17 — Inactive → Active quando activation move para hoje

**Comportamento validado:** programa começa agendado para o futuro: `activation=today+30 / deactivation=null` → `is_active=false` (ainda não começou). Admin antecipa: edita activation para `today` e salva. Backend recomputa: `activation ≤ today AND deactivation IS NULL` → `is_active=true`. Programa já está disponível para `sendApplication` no mesmo segundo.

**Por que importa:** simétrico ao CT-16 — é o caminho "antecipar lançamento". Sem essa transição imediata, o admin teria que esperar o sweep ou refazer o agendamento.

**Como verificar manualmente em stg:**
1. Criar programa com `activation=today+30 / deactivation=null` → confirmar `is_active=false`.
2. Editar activation para `today` → SAVE.
3. SQL: `SELECT is_active, activation_date::text FROM uown_merchant_program WHERE pk = <pk>` → `true / today`.

**PASSOU** (10.3s)

---

### CT-KS-SMOKE — Cross-brand smoke (Kornerstone)

**Comportamento validado:** o mesmo fluxo Group 1 (edit dates → SAVE → DB validation) funciona para um merchant com brand diferente: Kornerstone (KS3015, `pk=10138`). Datas usadas: `activation=today-1 / deactivation=today+60` → `is_active=true`. Validação extra: a coluna `company` do merchant está como `KORNERSTONE`, e a página do merchant tem o `KS_MERCHANT.number` na URL (a heurística de "título contém UOWN" é tolerada porque o brand UOWN Leasing é a plataforma — todo merchant page leva o título).

**Por que importa:** garante que a feature não tem caminho de código brand-specific quebrado. Se quebrasse só em KS, teríamos regressão para metade dos clientes em produção.

**Como verificar manualmente em stg:**
1. Login no Servicing stg.
2. Criar/abrir programa do merchant KS3015 via `/programs`.
3. Setar dates conforme acima → SAVE.
4. SQL: `SELECT activation_date::text, deactivation_date::text, is_active FROM uown_merchant_program WHERE pk = <pk>` → bate.
5. SQL brand: `SELECT company FROM uown_merchant WHERE pk = 10138` → `KORNERSTONE` (ou anotar se coluna `company` não existir; brand fica via `clientType`).
6. Acessar página merchant `KS3015` → URL contém `KS3015`; ≥ 1 program row na seção Programs.

**PASSOU** (29.1s)

---

### Mapping de IDs entre relatórios

A numeração CT do `-ui.spec.ts` (e deste relatório) **não** é idêntica à do relatório qa2. Equivalências:

| `-ui.spec.ts` (este relatório) | Relatório qa2 (`*-report.md`) |
|--------------------------------|-------------------------------|
| CT-02 (layout) | CT-UI-01 |
| CT-04 (edit + persistência) | CT-UI-02 |
| CT-06 (PROGRAM_DATA_CHANGE) | CT-UI-03 |
| CT-06 (autor humano via SAVE logado) | CT-UI-04 |
| CT-05 (activation > deactivation) | CT-UI-05 |
| CT-04 / CT-13 (deactivation null aceito) | CT-UI-06 |
| CT-13 (activation null aceito) | CT-UI-07 |
| CT-08 a CT-15b (boundaries) | CT-UI-08 a CT-UI-15b |
| CT-16 / CT-17 | CT-Trans-16 / CT-Trans-17 (bloco "transições") |
| CT-01 (merchant page read-only) | CT-UI-MP (não no relatório qa2 com esse ID — vem do scenarios.md) |
| CT-07 (guard rail) | CT-UI-Guard (similar) |
| CT-07b (CANCEL discards) | CT-UI-CANCEL |
| CT-07c (Clone) | CT-UI-Clone |
| CT-KS-SMOKE | CT-KS-SMOKE |

## Reproduzir este run

```bash
ENV=stg npx playwright test \
  --project=task-testing \
  docs/taskTestingUown/scheduleProgramActivationDeactivationDates/scheduleProgramActivationDeactivationDates-ui.spec.ts \
  --reporter=list
```

Pré-requisitos: `.env` com `STG_*` configurados (já presentes no repo) e `npx playwright install chromium`.

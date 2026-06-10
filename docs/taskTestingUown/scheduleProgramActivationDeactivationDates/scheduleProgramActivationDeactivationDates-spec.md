# SPEC: scheduleProgramActivationDeactivationDates

> **Planejamento formal derivado de** `scheduleProgramActivationDeactivationDates-scenarios.md` (aprovado pelo user em 2026-04-22).
>
> Este SPEC é o contrato que `subagent-impl-e2e`, `subagent-impl-api`, `subagent-page-object`, `subagent-impl-api-client` e `subagent-impl-db-validation` consomem. Nenhum desvio das receitas (SSN/merchant/banking/brand) é permitido sem registrar a divergência como `[OBSERVAÇÃO]` / `[HIPÓTESE]` no relatório.

## Task Origin

| Campo | Valor |
|-------|-------|
| Milestone | *(não-GitLab — task interna descoberta via QA)* |
| Task | Schedule Program Activation and Deactivation Dates |
| Number | — |
| Standardized Name | `scheduleProgramActivationDeactivationDates` |
| File Name (E2E) | `scheduleProgramActivationDeactivationDates.spec.ts` |
| File Name (API) | `scheduleProgramActivationDeactivationDates.api.spec.ts` |
| Environment alvo | `qa2` |

---

## User Story Mapping

> Source: `docs/user-stories/jornada-completa-lease.md` + `scenarios.md §User Stories`

| Campo | Valor |
|-------|-------|
| US ID(s) | US-MERCH-PROG-01 (agendamento), US-MERCH-PROG-02 (status derivado), US-MERCH-PROG-03 (sweep), US-MERCH-PROG-04 (seleção por data em sendApplication) |
| Phase | Originacao (configuração de merchant/programa) + interface com pipeline de criação de aplicação |
| Persona | Admin Origination (configuração), Cliente (quando o runtime aplica as datas em sendApplication), Sistema (sweep noturno) |
| User Flow | Admin abre `/programs` → seleciona programa → define `activationDate` / `deactivationDate` no Program Details → Save → sweep reconcilia `is_active` → em nova aplicação, `sendApplication` só oferece programas ativos na data |
| Lease Risks Addressed | R-Revenue: oferecer programa desativado → contrato errado. R-Compliance: audit trail de mudança de programa (`PROGRAM_DATA_CHANGE`). R-Operational: divergência DB↔UI causa admin operar em estado stale. R-Financial: Second Look seleciona 16m desativado |
| Risk Coverage in CTs | R-Revenue: CT-DateSelect-* + CT-Reselect-*. R-Compliance: CT-02 (Notes/audit), CT-06 (`merchant_activity_log`). R-Operational: CT-API-13 (SoT datas > flag), CT-KS-SMOKE (cross-brand). R-Financial: CT-C-02, CT-C-03 |

---

## Preconditions — globais (todo o SPEC)

| Item | Detalhe |
|------|---------|
| Ambiente | `qa2` (`svc-qa2.uownleasing.com`, `origination-qa2.uownleasing.com`) |
| Auth admin | Usuário com role `manager` ou superior no Origination (com permissão de editar programas) |
| Auth API | Token svc válido (injetado via `BaseClient` apiAuthorization header) |
| Merchant UOWN | `OL90294-0001` (Progress Mobility) com ≥ 2 programas atribuídos — 1 com term 13m, 1 com term 16m. Se só tiver 1, `beforeAll` do Grupo 4 usa `addProgramsToMerchant` |
| Merchant KS | `KS3015` (FifthAveFurnitureNY) com ≥ 2 programas atribuídos (term 13 + term 16). Preflight obrigatório (pitfall #10) |
| Merchant TireAgent | `OW90218-0001` com programa 16m atribuído + ativo hoje (datas cobrindo today ou ambas null). `use.taktile.for.decision=false` + `use.gds.for.decision=true` (confirmar antes de CT-C-00) |
| DB UPDATE direto autorizado | `uown_merchant_program.activation_date` / `deactivation_date` — autorização explícita do user 2026-04-22. Registrado em `.claude/rules/security.md` via este SPEC |
| Tabela real | Validar no 1º run via `SELECT to_regclass('uown_merchant_program')` vs `uown_merchant_to_program` (backend usa a primeira; docs/schema pode ter a segunda). CT-18 guarda essa descoberta |
| Merchant preflight | `ensureMerchantReady(OL90294-0001)` e `ensureMerchantReady(KS3015)` no `globalSetup` (pitfall #10) antes de rodar qualquer CT de Grupo 4 ou Grupo 5. `skipMerchantPreflight: true` nos CTs que só mutam programa (Grupos 1-3) |

---

## Interaction Strategy (UI-first)

Em conformidade com a regra INVIOLÁVEL do CLAUDE.md:

- **UI primeiro** em Grupos 1, 2, 3b, 4 (DateSelect / Reselect UOWN), e validações cross-page.
- **API direta** somente quando UI não expõe o caminho: Grupo 3 (sweep endpoint não tem botão UI), Grupo 5 (contrato do endpoint `createOrUpdateProgram`), Grupo 4 CT-C-* (Second Look exige payloads fixos que UI não permite modelar).
- **Híbrido (UI + API + DB)**: Grupo 3 usa UI para setup inicial, API para sweep, DB para assertions.

Cada CT tem validações em 3 camadas:

1. **Payload / Response** — HTTP status + body fields
2. **DB Persistence** — `SELECT` direto no Postgres de qa2 confirma persistência e derivação correta de `is_active`
3. **UI Rendering** — Status badge + tooltip + listagem refletem estado após reload

---

## Program × Brand Coverage

| | UOWN (OL90294-0001) | Kornerstone (KS3015) | TireAgent (OW90218-0001) |
|-|:-:|:-:|:-:|
| **Modalidade A — 13m apenas** | N/A como CT dedicado¹ | N/A como CT dedicado¹ | N/A |
| **Modalidade B — 13m+16m (seleção por data)** | CT-DateSelect-13to16-UOWN, CT-DateSelect-16to13-UOWN, CT-Reselect-UOWN | CT-DateSelect-13to16-KS, CT-DateSelect-16to13-KS, CT-Reselect-KS | N/A |
| **Modalidade C — 16m Second Look** | N/A | N/A | CT-C-00 (smoke), CT-C-01, CT-C-02, CT-C-03 |
| **Modalidade D — Denied** | N/A como CT dedicado¹ | N/A como CT dedicado¹ | N/A |

**¹ Justificativas (conforme aprovação do user 2026-04-22):**
- **Modalidade A pura (UOWN 13m apenas)** — removida do escopo: validação happy path sem componente date-driven não é objetivo desta feature. Modalidade A é testada **indiretamente** em CT-DateSelect-16to13-UOWN (quando 16m é desativado, aplicação cai para 13m-only).
- **Modalidade A pura (KS 13m apenas, sem banking)** — removida: mesmo motivo.
- **Modalidade B pura sem mutação de data** — removida: mesma razão.
- **Modalidade D** — removida: UW_DENIED sem relação com datas de programa não testa a feature. Cobertura de denial existe no catálogo geral do projeto (fora desta feature).

**UI Modal (side panel de Program Details):**

| | UOWN | Kornerstone |
|-|:-:|:-:|
| Smoke estrutura | CT-02, CT-03, CT-04 | (compartilhado — feature é merchant-agnostic na UI) |
| Cross-brand smoke | — | CT-KS-SMOKE |

**Pré-condição obrigatória em CTs Kornerstone** (CT-KS-SMOKE, CT-DateSelect-*-KS, CT-Reselect-KS):

```sql
SELECT company FROM uown_sv_account WHERE pk = $accountPk;
-- expected: 'KORNERSTONE' quando merchant.ref_merchant_code começa com 'KS'
```

Se divergente → **STOP, logar `[CT-XX] BRAND_MISMATCH`, pedir autorização ao usuário** para `UPDATE uown_sv_account SET company='KORNERSTONE'` (precedente pipeline #491). Sem autorização → `ENV-GAP`, não bug.

---

## Risk Tier Decision

> Aplicável apenas aos CTs do Grupo 4 que criam aplicação (CT-C-*, CT-DateSelect-*, CT-Reselect-*).

| Campo | Choice | Reason |
|-------|--------|--------|
| **riskTier (UOWN aplicações)** | `low` | Feature testa seleção de programa ativo, não boundaries de underwriting. `low` garante `FUNDED` determinístico. |
| **riskTier (KS aplicações)** | `kornerstone-low` | Modalidade B exige merchant KS + banking + BIN elegível. `low` dentro desse tier. |
| **riskTier (TireAgent CT-C-*)** | (fixo) | SSN `100000053` + profile Brian/Columbus/92821/CA — receita canônica §2 do ssn-catalog, não usa risk tier genérico. |
| **SSN strategy (UOWN, KS)** | `generateTestSSN(true)` | Aprovado (não termina em 9). |
| **SSN strategy (TireAgent)** | `'100000053'` fixo | Second Look canônico. |
| **State (UOWN)** | `CA` | Dentro de faixa Progress Mobility; sem regras especiais de EPO para esta feature. |
| **State (KS)** | `CA` | Elegível KS; simplifica comparabilidade UOWN↔KS. |
| **State (TireAgent)** | `CA` | Obrigatório pelo ssn-catalog §2 — ZIP 92821 casado com state CA. |
| **Merchant** | conforme tabela Preconditions | Task fixou com user 2026-04-22. |
| **Cart value** | `$1.000` padrão (800-1500) | Dentro de low tier; evita boundaries de PTI. |

**Regras EPO/tax:** CA → sem tax peculiarity para esta feature. Feature NÃO exercita EPO — validação de EPO é fora do escopo.

---

## testData (canônico — usar em todos os CTs de Grupo 4)

```ts
const testData = [
  {
    env: 'qa2',
    riskTier: 'low',
    state: 'CA',
    merchantRefCode: 'OL90294-0001',     // Progress Mobility — UOWN
    merchandiseAmount: 1000,
    ssnStrategy: 'generateTestSSN(true)',
    runId: generateRunId(),
    email: generateUniqueEmail(),        // pitfall #1 — unique per run
    card: 'MASTERCARD_APPROVED',         // pitfall #3 — VISA fails in qa
    bankRouting: TEST_BANK.DEFAULT_ROUTING,
    bankAccount: TEST_BANK.DEFAULT_ACCOUNT,
    tag: '@qa2',
  },
  {
    env: 'qa2',
    riskTier: 'kornerstone-low',
    state: 'CA',
    merchantRefCode: 'KS3015',           // FifthAveFurnitureNY — KORNERSTONE
    merchandiseAmount: 1000,
    ssnStrategy: 'generateTestSSN(true)',
    runId: generateRunId(),
    email: generateUniqueEmail(),
    card: 'MASTERCARD_APPROVED',
    bankRouting: TEST_BANK.DEFAULT_ROUTING,  // pitfall #5 — Kornerstone needs banking
    bankAccount: TEST_BANK.DEFAULT_ACCOUNT,
    tag: '@qa2 @kornerstone',
  },
  {
    env: 'qa2',
    ssnStrategy: 'fixed:100000053',      // Second Look canônico — ssn-catalog §2
    state: 'CA',
    merchantRefCode: 'OW90218-0001',     // TireAgent
    profile: {
      firstName: 'Brian', lastName: 'hayden', dob: '02241987',
      address: '135 Buckeye Blvd', city: 'Columbus', zip: '92821',
      employer: 'Costco Wholesale', phone: '7653072625',
    },
    runId: generateRunId(),
    email: generateUniqueEmail(),
    tag: '@qa2 @second-look',
  },
];
```

---

## Artifact Dependencies

| Type | Name | Status | Notas |
|------|------|--------|-------|
| Page Object | `ProgramsPage` (rota `/programs`) | **To create** | Listagem esquerda + Program Details à direita. Methods: `goto()`, `selectProgramRow(programName\|rowIndex)`, `clickAddNewProgram()`, `fillActivationDate(date)`, `fillDeactivationDate(date)`, `clickSave()`, `clickCancel()`, `getValidationError()`, `getToastMessage()`, `getNotesEntries()`. Selectors: 11 colunas da listagem + `[id=activationDate]` + `[id=deactivationDate]` + botões `Clone`/`Clone Group`/`CANCEL`/`SAVE` + `Notes` accordion |
| Page Object | `MerchantProgramsSectionPage` (merchant detail read-only) | **To create** | Apenas read-only: `getProgramStatus(programName)`, `getStatusTooltip(programName)`, `assertNoEditControls()` |
| Page Object | `NewApplicationOriginationPage` (para CT-DateSelect-*) | **Reutilizar** | Confirmar existência em `src/pages/` antes da impl; se não existir, reusar helper `createPreQualifiedApplication` via API |
| API Client | `MerchantClient.createOrUpdateProgram` | **To create (extensão)** | `POST /uown/createOrUpdateProgram` com body `ProgramInfo { merchantPk, programPk, activationDate?: string (ISO LocalDate), deactivationDate?: string, active?: boolean }`. Extends existing `MerchantClient` (file `src/api/clients/merchant.client.ts`). Request body type em `src/api/bodies/merchant.body.ts` (`CreateOrUpdateProgramBody`). Response body em `src/api/responses/merchant.response.ts` extends `BaseResponseBody` |
| API Client | `MerchantClient.getMerchantProgramsByMerchantPk` | **Exists — typings a ampliar** | Response type `MerchantProgramsResponse` precisa incluir `activationDate: string \| null`, `deactivationDate: string \| null`, `isActive: boolean` em `ProgramInfo` |
| API Client | `ScheduledTaskClient.triggerScheduledTask('merchantProgramActivationDeactivationSweep')` | **Exists** | `src/api/clients/scheduled-task.client.ts:10` — nenhuma mudança necessária |
| DB helper | `merchant-program.db.ts` | **To create** | Methods: `getMerchantProgramsForMerchant(merchantPk)`, `getMerchantProgramByPk(pk)`, `updateMerchantProgramDates(pk, activation, deactivation)` (com guard: log + require AUTHORIZED env flag), `snapshotMerchantProgram(pk)` / `restoreMerchantProgram(snapshot)` para afterEach |
| DB helper | `merchant-activity-log.db.ts` | **To create** | `getLogsForProgramSince(programPk, sinceTimestamp)`, `getLatestSweepLog()`, `assertProgramDataChangeEntry(programPk)` |
| DB helper | `uown-los-lead.db.ts` (ou equivalente) | **Reutilizar** | `getLeadByEmail(email)`, `getLeadByPk(pk)` — checar se já existe em `src/db/` |
| Selectors | `programsPage.selectors.ts` | **To create** | `programsList`, `programRowByIndex`, `addNewProgramButton`, `searchInput`, `programGroupsDropdown`, `programDetailsPanel`, `activationDateInput (#activationDate)`, `deactivationDateInput (#deactivationDate)`, `cloneDropdown`, `cloneGroupButton`, `cancelButton`, `saveButton`, `toastSuccess`, `validationError`, `notesAccordion`, `notesRows` |
| Selectors | `merchantProgramsSection.selectors.ts` | **To create** | `programsSection`, `programRow`, `statusBadge`, `statusTooltip` (on hover) |
| Helpers | `date-helpers.ts` | **Reutilizar ou criar** | `todayIso()`, `todayPlusDaysIso(n)`, `todayMinusDaysIso(n)` — datas ISO-8601 (`YYYY-MM-DD`) para Jackson LocalDate |
| Fixtures | `globalSetup` para garantir ambos programas (13m + 16m) em OL90294-0001 e KS3015 | **To create (pipeline step)** | Via `addProgramsToMerchant` existente |
| Test helper | `createPreQualifiedApplication` (já existe) | **Reutilizar** | Chamado em CT-DateSelect-*-* e CT-Reselect-* — `skipMerchantPreflight: false` padrão |
| Test helper | `withAuthorizedDbUpdate` | **To create** | Wrapper que: (a) valida flag env `DB_UPDATE_AUTHORIZED=true`, (b) snapshot antes, (c) executa UPDATE, (d) registra no `afterEach` para restauração |

---

## Source Code References

| Source | File | Key findings |
|--------|------|--------------|
| Backend (DTO) | `../svc/src/main/java/.../dto/ProgramInfo.java` | Campos `activationDate: LocalDate`, `deactivationDate: LocalDate`, `active: Boolean` — confirmar anotações (`@JsonFormat`?) |
| Backend (service) | `../svc/src/main/java/.../MerchantProgramService.java:56-58` | Validação `activationDate > deactivationDate` → `"activationDate must be before or equal to deactivationDate"` |
| Backend (repo) | `../svc/src/main/java/.../MerchantProgramRepo.reconcileMerchantProgramActiveFlags` | SQL de sweep: `UPDATE ... SET is_active = (activation ≤ today OR null) AND (deactivation ≥ today OR null) WHERE is_active IS DISTINCT FROM (...)` |
| Backend (selection) | `../svc/src/main/java/.../ApplicationProcessor.java:296-305` | Seleção de programa em `sendApplication` — validar empiricamente em CT-DateSelect-* (risco 2 do scenarios) |
| Backend (controller) | `../svc/.../MerchantProgramController.java` | `POST /uown/createOrUpdateProgram` + `GET /uown/getMerchantProgramsByMerchant/{pk}` |
| Backend (sweep) | `../svc/.../ScheduledTaskController.java` | `POST /uown/svc/triggerScheduledTask/merchantProgramActivationDeactivationSweep` |
| Backend (sweep impl) | `../svc/.../MerchantProgramActivationDeactivationSweep.java` (buscar) | Log format `activated/deactivated` — confirmar no 1º run de CT-18 |
| Frontend | `../origination/pages/programs/...` | Layout master-detail; `#activationDate`, `#deactivationDate` inputs; `PROGRAM_DATA_CHANGE` no Notes accordion |
| Migration | `../svc/src/main/resources/db/migration/V20260327120000__merchant_program_activation_columns.sql` | Adicionou `activation_date DATE NULL` + `deactivation_date DATE NULL` em `uown_merchant_program` |
| DB schema existente | `docs/taskTestingUown/database-schema.md` | Pode referenciar `uown_merchant_to_program` (legado). Validar em CT-18 com `information_schema.tables` |

---

# Steps — por grupo

## Grupo 1 — Programs page (modal/side panel) — CT-01..CT-07, CT-07b, CT-07c

### CT-01 — Merchant page exibe Status + tooltip read-only

**Tipo:** E2E UI (read-only)
**Dependências de data:** nenhuma (não mutação)
**Paralelizável:** sim

| # | test.step label | Action (UI/API) | Validation (payload/DB/UI) | Timeout |
|---|-----------------|-----------------|-----------------------------|---------|
| 1 | Arrange: garantir ≥ 2 programas no merchant | API: `getMerchantProgramsByMerchantPk(OL90294-0001.pk)` — se <2, `addProgramsToMerchant` | Payload: response body has `programs.length ≥ 2`; DB: `SELECT ... WHERE merchant_pk=... ` retorna ≥ 2 rows | 10s |
| 2 | Navegar para merchant detail | UI: `page.goto(/merchants/OL90294-0001)` | UI: `page.url()` contém o merchant; seção Programs visível | 15s |
| 3 | Inspecionar badges Status | UI: `getProgramStatus(programA)`, `getProgramStatus(programB)` | UI: badge A coerente com datas (today ∈ [act, deact] → Active); badge B (ambas null) → Active | 5s |
| 4 | Hover tooltip programa A | UI: hover → `getStatusTooltip(programA)` | UI: texto exato `Activation: <dd/MM/yyyy>` + `Deactivation: <dd/MM/yyyy>` (2 linhas) | 5s |
| 5 | Hover tooltip programa B | UI: hover → `getStatusTooltip(programB)` | UI: `Activation: —` + `Deactivation: —` | 5s |
| 6 | [reflex #8] Confirmar ausência de CTAs de mutação | UI: `assertNoEditControls()` | UI: nenhum pencil/trash/add button na seção Programs | 3s |

**Cleanup:** nenhum (read-only)
**Tags:** `@regression @e2e @origination @merchant-page @read-only`

---

### CT-02 — `/programs` Program Details expõe campos novos

**Tipo:** E2E UI (smoke de deploy)
**Paralelizável:** sim

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Navegar para `/programs` | UI: `programsPage.goto()` | UI: url final `origination-qa2.uownleasing.com/programs`; painel `PROGRAMS` visível | 15s |
| 2 | Validar 11 colunas da tabela | UI: `programsPage.getColumnHeaders()` | UI: array = `['Program Name','Term Months','Lending CategoryType','Money Factor','Pay Off Discount','Processing Fee Override','EPO Days','EPO Fee Percent','Group Name','Amount at Signed','States']` | 5s |
| 3 | Validar botão ADD NEW PROGRAM + filtros | UI: `addNewProgramButton.isVisible()` + `searchInput.isVisible()` + `programGroupsDropdown.isVisible()` | UI: todos visíveis e habilitados | 3s |
| 4 | Clicar em `row-0` | UI: `programsPage.selectProgramRow(0)` | UI: painel direito `PROGRAM DETAILS` renderiza com dados populados | 10s |
| 5 | **[DELIVERABLE PRINCIPAL]** validar campos novos | UI: locators `#activationDate`, `#deactivationDate` | UI: ambos visíveis, `type=search`, `maxlength=10`, `placeholder=MM/DD/YYYY`, editáveis | 5s |
| 6 | Validar botões de ação | UI: Clone ▾, Clone Group, CANCEL, SAVE visíveis | UI: 4 botões presentes | 3s |
| 7 | Rolar até Notes + validar headers | UI: `notesAccordion.scrollIntoView()` + `getColumnHeaders()` | UI: headers = `['Date','Type','User ID','Notes']` | 5s |
| 8 | Validar entries `PROGRAM_DATA_CHANGE` | UI: `notesRows.filter(type='PROGRAM_DATA_CHANGE')` | UI: ≥ 1 entry (evidência de audit trail built-in) | 5s |

**Cleanup:** nenhum (read-only)
**Tags:** `@smoke @critical @e2e @programs-page`

---

### CT-03 — Adicionar programa novo ao merchant (side panel)

**Tipo:** E2E UI (mutação)
**Dependências:** catálogo global tem programa `X` + `Y` não atribuídos
**Paralelizável:** NÃO (muta merchant OL90294-0001 compartilhado — serial com CT-04..CT-07c)

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Arrange: capturar programas disponíveis | API: `getAllMerchantPrograms({searchKey:''})` | Payload: response tem programas não atribuídos; capturar `X.pk`, `Y.pk` | 10s |
| 2 | Abrir Programs page → ADD NEW PROGRAM flow (merchant context) | UI: `page.goto(/merchants/OL90294-0001/programs)` (ou fluxo equivalente) | UI: dropdown "Add program" carrega opções | 15s |
| 3 | Expandir dropdown | UI: `addProgramDropdown.click()` | UI: lista inclui `X.name`, `Y.name`; **não** inclui programas já atribuídos | 3s |
| 4 | Selecionar `X` | UI: `dropdown.selectOption(X.name)` | UI: `X` aparece no **topo** da tabela; dropdown reset; `X` removido das opções | 5s |
| 5 | Selecionar `Y` | UI: `dropdown.selectOption(Y.name)` | UI: `Y` aparece **acima** de `X` (ordem top-first) | 5s |
| 6 | Save footer | UI: `clickSave()` | UI: toast com `"Program(s) saved."` (ou texto equivalente pinado no 1º run); modal fecha | 10s |
| 7 | **[reflex #11]** Validar persistência DB | DB: `SELECT pk, program_pk, activation_date, deactivation_date, is_active FROM uown_merchant_program WHERE merchant_pk=<ol90294.pk> AND program_pk IN (X.pk, Y.pk)` | DB: 2 rows, `activation_date IS NULL`, `deactivation_date IS NULL`, `is_active=true` | 5s |
| 8 | Validar filtragem no dropdown | UI: reabrir dropdown → `X` e `Y` não aparecem | UI: opções filtradas corretamente | 5s |
| 9 | **[reflex #11]** `merchant_activity_log` | DB: `SELECT * FROM merchant_activity_log WHERE merchant_pk=... ORDER BY pk DESC LIMIT 5` | DB: 2 entries recentes para adds | 3s |

**Cleanup (obrigatório — merchant compartilhado):** `removePrograms(merchantPk, [X.pk, Y.pk])` via API (ou trash + save na UI)
**Tags:** `@regression @e2e @programs-page @critical`

---

### CT-04 — Editar inline datas (happy path)

**Tipo:** E2E UI
**Paralelizável:** NÃO (serial com outros CTs do grupo 1)

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Arrange: programa `P` atribuído com datas null | setup idem CT-03 ou usar Y do CT anterior | DB: `activation_date IS NULL`, `deactivation_date IS NULL` | 5s |
| 2 | Abrir modal | UI: idem CT-03 | UI: tabela renderiza linha de `P` | 10s |
| 3 | Clicar pencil em `P` | UI: `editRowDates(P.name)` | UI: inputs ativos; ícones check + cancel aparecem | 3s |
| 4 | Preencher datas | UI: `fillActivationDate(today-5d)`, `fillDeactivationDate(today+5d)` | UI: inputs preenchidos | 5s |
| 5 | Clicar check (commit local) | UI: `saveEdit()` | UI: linha volta read-only; datas exibidas no lugar dos placeholders; Status = Active | 3s |
| 6 | Validar que NÃO há request backend | Network interceptor: `expect(requests).toHaveLength(0)` para `createOrUpdateProgram` | Payload: nenhuma chamada disparada | 3s |
| 7 | Clicar cancel em outra edição (counter-test) | UI: editar, modificar, `cancelEdit()` | UI: valores revertem aos originais sem mutação | 5s |

**Cleanup:** (nenhuma persistência ainda — Save não foi clicado). Se CT-04 incluir Save, restaurar datas originais.
**Tags:** `@regression @e2e @critical @programs-page`

---

### CT-05 — UI bloqueia `activation > deactivation`

**Tipo:** E2E UI (validação defensiva)
**Paralelizável:** NÃO (serial)

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Abrir modal + entrar edit mode | UI: idem CT-04 | UI: edit mode ativo | 10s |
| 2 | Preencher datas invertidas | UI: `fillActivationDate(today+10d)`, `fillDeactivationDate(today+5d)` | UI: inputs preenchidos | 3s |
| 3 | Clicar check | UI: `saveEdit()` | UI: mensagem erro `"Activation Date must be on or before Deactivation Date"` (pinar texto 1º run); linha permanece em edit mode | 5s |
| 4 | Confirmar ausência de request | Network interceptor | Payload: nenhuma chamada `createOrUpdateProgram` | 3s |
| 5 | **Defense-in-depth:** força chamada direta API com mesmas datas | API: `createOrUpdateProgram({..., activationDate: today+10d, deactivationDate: today+5d})` | Payload: HTTP 400 com body `"activationDate must be before or equal to deactivationDate"` (espelha `MerchantProgramService.java:56-58`) | 10s |

**Cleanup:** nenhum
**Tags:** `@regression @e2e @validation @programs-page`

---

### CT-06 — Save transacional (add + edit + delete)

**Tipo:** E2E UI (transação)
**Paralelizável:** NÃO

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Inspecionar helper text | UI: `getHelperText()` | UI: texto `"Edit dates in the table, then click Save."` (pinar 1º run) visível | 3s |
| 2 | Add programa novo | UI: (CT-03) | UI: nova linha no topo | 5s |
| 3 | Edit 1 programa existente | UI: (CT-04) | UI: linha editada read-only | 5s |
| 4 | Save footer | UI: `clickSave()` | Payload: 1 request `POST /uown/createOrUpdateProgram` com status 200 (validar via network interceptor) | 10s |
| 5 | Toast + fecha modal | UI: `toastSuccess.isVisible()` | UI: toast `"Program(s) saved."` | 5s |
| 6 | Persistência 1 — reabrir modal | UI: reabrir | UI: tabela idêntica ao pós-save; helper text continua presente | 10s |
| 7 | Persistência 2 — merchant detail page | UI: `page.goto(/merchants/OL90294-0001)` | UI: seção Programs reflete novo programa + edição | 15s |
| 8 | **[reflex #11]** DB — timestamps + audit | DB: `SELECT row_created_timestamp, row_updated_timestamp FROM uown_merchant_program WHERE pk=<editedPk>` + `SELECT * FROM merchant_activity_log WHERE merchant_pk=... ORDER BY pk DESC LIMIT 10` | DB: `row_updated_timestamp > row_created_timestamp` na row editada; ≥ 1 novo log `PROGRAM_DATA_CHANGE` | 5s |

**Cleanup:** remover add + restaurar datas do edited
**Tags:** `@smoke @critical @e2e @programs-page`

---

### CT-07 — Popup "unsaved edits"

**Tipo:** E2E UI (guard rail)
**Paralelizável:** NÃO

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Entrar edit mode em `A` | UI: pencil click | UI: edit mode ativo | 5s |
| 2 | Alterar valor sem commit | UI: fill activation (sem check/cancel) | UI: linha em edit com valor pendente | 3s |
| 3 | Save footer | UI: `clickSave()` | UI: popup aparece | 5s |
| 4 | Capturar texto + labels exatos | UI: `getConfirmationPopup().text/buttons` | UI: texto candidato `"One row has unsaved edits. If you continue, those changes will be lost. Go back to save or cancel the edit, or continue to save the table."`; botões `Go back` + `Continue` (pinar labels 1º run) | 3s |
| 5 | **Branch Go back** — clicar volta | UI: `popup.clickGoBack()` | UI: popup fecha; modal aberto; `A` continua edit mode com valor pendente; nenhuma request backend | 5s |
| 6 | **Branch Continue** — Save novamente + Continue | UI: `clickSave()` → `popup.clickContinue()` | UI: popup fecha; request save dispara ignorando edição pendente; modal fecha | 10s |
| 7 | DB state | DB: `SELECT activation_date FROM uown_merchant_program WHERE pk=<A.pk>` | DB: valor = **antes** da edição pendente (descarte confirmado) | 3s |

**Cleanup:** nenhum (sem mutação efetiva)
**Tags:** `@regression @e2e @programs-page`

---

### CT-07b — Cancel + Delete

**Tipo:** E2E UI
**Paralelizável:** NÃO

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Add `Z` sem Save + CANCEL footer | UI: add dropdown + `clickCancel()` | UI: modal fecha; nenhum request | 10s |
| 2 | Reabrir modal | UI: reopen | UI: `Z` NÃO está na tabela | 10s |
| 3 | Trash em `W` existente | UI: `deleteRow(W.name)` | UI: `W` some da tabela local | 5s |
| 4 | Save footer | UI: `clickSave()` | UI: toast sucesso | 10s |
| 5 | Cross-page | UI: `page.goto(/merchants/OL90294-0001)` | UI: `W` não aparece em Programs | 15s |
| 6 | DB — soft delete ou hard delete? | DB: `SELECT * FROM uown_merchant_program WHERE merchant_pk=... AND program_pk=W.pk` | DB: row ausente OU flag `deleted=true` (1º run descobre pattern) | 5s |

**Cleanup:** re-adicionar `W` via `addProgramsToMerchant`
**Tags:** `@regression @e2e @programs-page`

---

### CT-07c — ADD + Clone com datas definidas

**Tipo:** E2E UI (feature principal do add flow)
**Paralelizável:** NÃO

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Arrange: `SOURCE` atribuído com datas today-30/today+30; `NEW` no catálogo | API setup | DB confirma estado inicial | 10s |
| 2 | **Parte A (ADD):** abrir modal + dropdown → NEW | UI | UI: `NEW` aparece no topo | 10s |
| 3 | Editar datas de NEW: activation=today+7, deactivation=today+90 | UI: `editRowDates(NEW.name, today+7d, today+90d)` + check | UI: linha commitada | 5s |
| 4 | **Parte B (CLONE):** clicar Clone em SOURCE | UI: `cloneRow(SOURCE.name)` | UI: `CLONE_OF_SOURCE` aparece no topo com datas pré-populadas OU vazias (descobrir empírico) | 5s |
| 5 | Editar datas do clone: activation=today, deactivation=today+180 | UI + check | UI: linha commitada | 5s |
| 6 | **Parte C:** Save footer | UI | UI: toast; modal fecha | 10s |
| 7 | Reabrir + validar persistência UI | UI | UI: NEW Inactive (activation futuro); clone Active | 10s |
| 8 | Cross-page validação | UI | UI: merchant page mostra ambos Status correto + tooltip correto | 10s |
| 9 | **[reflex #11]** DB | DB: 2 novas rows; SOURCE intacto; `is_active` calculado pelo backend (NEW=false, clone=true); `merchant_activity_log` 2 entries | DB assertions | 5s |
| 10 | **Negative:** clone com `activation > deactivation` | UI | UI: mesma validação CT-05 | 5s |

**Cleanup:** `deleteMerchantProgram(NEW.pk)` + `deleteMerchantProgram(clone.pk)` via API; SOURCE inalterado
**Tags:** `@regression @e2e @critical @programs-page @clone`

---

## Grupo 2 — Derivação de Status (CT-08..CT-17, CT-15b)

**Padrão de cada CT (parametrizado):**

```ts
test.describe.configure({ mode: 'serial' });  // merchant compartilhado

for (const tc of [
  { id: 'CT-08', activation: todayMinus(10), deactivation: todayPlus(10), expectedStatus: 'Active', tooltip: 'both-dates' },
  { id: 'CT-09', activation: today(),        deactivation: null,            expectedStatus: 'Active', tooltip: 'activation+dash' },
  { id: 'CT-10', activation: todayMinus(5),  deactivation: today(),         expectedStatus: 'Active', tooltip: 'both-dates' },
  { id: 'CT-11', activation: todayPlus(10),  deactivation: null,            expectedStatus: 'Inactive', tooltip: 'activation+dash' },
  { id: 'CT-12', activation: todayMinus(30), deactivation: todayMinus(1),   expectedStatus: 'Inactive', tooltip: 'both-dates' },
  { id: 'CT-13', activation: null,           deactivation: null,            expectedStatus: 'Active', tooltip: 'dash-dash' },
  { id: 'CT-14', activation: todayMinus(30), deactivation: null,            expectedStatus: 'Active', tooltip: 'activation+dash' },
  { id: 'CT-15', activation: null,           deactivation: todayPlus(30),   expectedStatus: 'Active', tooltip: 'dash+deactivation' },
  { id: 'CT-15b', activation: null,          deactivation: todayMinus(1),   expectedStatus: 'Inactive', tooltip: 'dash+deactivation' },
]) {
  test(`${tc.id}: status derivation`, ...);
}
```

**Steps comuns:**

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Arrange: abrir `/programs` → Program Details | UI | UI: painel aberto | 15s |
| 2 | Setar datas via inline edit (ou API se UI bloquear — CT-15b) | UI: `fillActivationDate + fillDeactivationDate + check + Save` | UI: toast + persistência | 10s |
| 3 | Merchant page read-only | UI: `page.goto(/merchants/OL90294-0001)` | UI: Status badge == `expectedStatus` | 10s |
| 4 | Tooltip | UI: hover | UI: conteúdo match `tc.tooltip` | 3s |
| 5 | **Triple validation — DB** | DB: `SELECT activation_date, deactivation_date, is_active FROM uown_merchant_program WHERE pk=<pk>` | DB: datas persistidas + `is_active` derivado corretamente | 3s |
| 6 | Reload merchant page | UI | UI: Status persiste após reload (sem cache stale) | 10s |

**CT-16 (transição Active→Inactive):**
- Start Active (CT-08 state) → editar `deactivation=yesterday` + Save → validar transição no mesmo carregamento + reload.

**CT-17 (transição Inactive→Active):**
- Start Inactive (CT-12 state) → editar `activation=today` + Save → validar transição.

**CT-15b fallback:** se UI bloquear `activation=null + deactivation=past`, usar DB UPDATE direto autorizado + sweep (mesma autorização do Grupo 3). Documentar qual caminho foi usado no 1º run.

**Cleanup (afterEach):** restaurar snapshot `{activation_before, deactivation_before, is_active_before}` via `updateMerchantProgramDates` + sweep.

**Tags:** `@regression @e2e @status-derivation`

---

## Grupo 3 — Sweep job (CT-18..CT-25)

**Configuração:** `test.describe.configure({ mode: 'serial' })` — UPDATE direto no DB, programas compartilhados entre testes.

**Hook `beforeEach`:**
```ts
const snapshot = await snapshotMerchantProgram(targetPk);
// ... test mutations ...
```

**Hook `afterEach`:**
```ts
await restoreMerchantProgram(snapshot);
await scheduledTaskClient.triggerScheduledTask('merchantProgramActivationDeactivationSweep');
const verify = await getMerchantProgramByPk(targetPk);
expect(verify.isActive).toBe(snapshot.isActive);  // confirm restore
```

### CT-18 — Endpoint sweep smoke

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Validar nome real da tabela | DB: `SELECT to_regclass('uown_merchant_program')` | DB: não-null (risco #1 mitigado) | 3s |
| 2 | Pegar um `pk` qualquer | API: `getMerchantProgramsByMerchantPk(OL90294-0001.pk)` | Payload: response com programas | 5s |
| 3 | POST sweep | API: `scheduledTaskClient.triggerScheduledTask('merchantProgramActivationDeactivationSweep')` | Payload: HTTP 200, body `{}` ou `{success:true}` | 30s |
| 4 | **[reflex #11]** Log de execução | DB: `SELECT * FROM merchant_activity_log WHERE log_type LIKE '%SWEEP%' ORDER BY pk DESC LIMIT 1` (ou query equivalente — descobrir schema real 1º run) | DB: ≥ 1 entry recente com timestamp > request start | 5s |

**Tags:** `@smoke @api @sweep`

### CT-19 — Active → Inactive via deactivation_date movido para passado

| # | test.step label | Action | Validation | Timeout |
|---|-----------------|--------|-----------|---------|
| 1 | Arrange: snapshot do programa + garantir `is_active=true` | DB + snapshot | DB initial state captured | 5s |
| 2 | **AUTORIZADO:** `UPDATE uown_merchant_program SET deactivation_date = CURRENT_DATE - INTERVAL '1 day' WHERE pk=<pk>` | DB | DB: deactivation_date atualizado; `is_active` ainda true (sweep não rodou) | 3s |
| 3 | Validar pré-sweep | DB: `SELECT is_active FROM uown_merchant_program WHERE pk=<pk>` | DB: `is_active=true` (divergência intencional) | 3s |
| 4 | POST sweep | API | Payload: HTTP 200 | 30s |
| 5 | Assert DB | DB: mesmo SELECT | DB: `is_active=false` | 3s |
| 6 | Assert UI | UI: merchant page reload | UI: Status = Inactive | 10s |

**Cleanup (afterEach):** restore snapshot + sweep
**Tags:** `@regression @hybrid @sweep`

### CT-20 — Inactive → Active quando activation = today

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: programa com `activation=today+30d`, `deactivation=null`, `is_active=false` | DB snapshot + UPDATE autorizado | DB | 5s |
| 2 | UPDATE: `activation_date = CURRENT_DATE` | DB autorizado | DB | 3s |
| 3 | POST sweep | API | 200 | 30s |
| 4 | Assert `is_active=true` | DB + UI | Active | 10s |

**Tags:** `@regression @hybrid @sweep`

### CT-21 — Boundary `deactivation=today` → Active (inclusivo)

Arrange: `activation<=today OR null`, `deactivation=CURRENT_DATE`. Act: sweep. Assert: `is_active=true`.
**Tags:** `@regression @hybrid @boundary @sweep`

### CT-22 — Boundary `deactivation=yesterday` → Inactive

Arrange: `activation<=yesterday OR null`, `deactivation=CURRENT_DATE-1`. Act: sweep. Assert: `is_active=false`.
**Tags:** `@regression @hybrid @boundary @sweep`

### CT-23 — Boundary `activation=today` → Active (inclusivo)

Arrange: `activation=CURRENT_DATE`, `deactivation=null OR >=today`, `is_active=false`. Act: sweep. Assert: `is_active=true`.
**Tags:** `@regression @hybrid @boundary @sweep`

### CT-24 — Overlap same-day `activation=today AND deactivation=today` → Active

Arrange: ambas datas = `CURRENT_DATE`. Act: sweep. Assert: `is_active=true`; tooltip UI mostra mesma data em 2 linhas.
**Tags:** `@regression @hybrid @boundary @sweep`

### CT-25 — Idempotência (3 sweeps consecutivos)

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: 2 programas (1 should-Active, 1 should-Inactive) | DB autorizado | DB | 5s |
| 2 | Sweep x3 em sequência (< 5s entre calls) | API: `triggerScheduledTask` 3x | Todos 200 | 90s |
| 3 | Estado final | DB | DB: consistente com 1ª execução — zero flips | 5s |
| 4 | `merchant_activity_log` | DB | DB: 3 entries de sweep MAS apenas 1ª com `activated/deactivated` substantivo; 2ª+3ª no-op | 5s |

**Tags:** `@regression @hybrid @idempotency @sweep`

---

## Grupo 3b — Cross-brand smoke

### CT-KS-SMOKE — Modal funciona em merchant Kornerstone

**Tipo:** E2E UI (cross-brand)
**Paralelizável:** sim (merchant distinto de OL90294)

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | **[Brand pre-check]** DB check company dos programas do KS3015 | DB: `SELECT pk FROM uown_merchant WHERE ref_merchant_code='KS3015'` | DB: merchant existe; programas atribuídos ≥ 1 | 5s |
| 2 | Abrir merchant page KS3015 | UI | UI: header/title mostra Kornerstone (não UOWN) | 15s |
| 3 | Abrir Programs page no contexto KS3015 | UI | UI: modal/side panel abre; tabela renderiza colunas esperadas | 15s |
| 4 | Editar datas de 1 programa | UI: `editRowDates + check` | UI: commit local | 5s |
| 5 | Save footer | UI | UI: toast sucesso; modal fecha | 10s |
| 6 | **[reflex #11]** DB persistência | DB | DB: datas persistidas no programa KS | 5s |
| 7 | Cross-contamination check | UI | UI: página não tem marcadores UOWN (logo, copy, título) | 3s |

**Cleanup:** restaurar datas originais do programa KS editado
**Tags:** `@regression @e2e @kornerstone @cross-brand`

---

## Grupo 4 — Seleção de programa por data na criação de aplicação

### CT-C-00 — Second Look smoke (guard para CT-C-01/02/03)

**Tipo:** API smoke
**Risco:** se falhar → CT-C-01/02/03 recebem `test.skip` condicional + ENV-GAP no relatório.

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: confirmar config DevOps | API: `GET /uown/config?key=use.gds.for.decision` (se exposto) OU log inspection | `use.taktile.for.decision=false` + `use.gds.for.decision=true` | 10s |
| 2 | Cleanup leads anteriores APPROVED com SSN `100000053` | API: `expireOrCancelLead` equivalent (ssn-catalog §2 — spec.ts:259) | API state | 10s |
| 3 | `sendApplication` SEM bank data | API: payload canônico ssn-catalog §2 | Payload: HTTP 200 | 30s |
| 4 | **Assert Second Look reconhecido** | Payload | `status=UW_DENIED` em 13m; `isEligibleForExtraInfo=true`; `paymentDetailsList` preview 16m | 5s |
| 5 | Se falhar (`isEligibleForExtraInfo=false` ou denial genérico) | test runner | Marcar `envSupportsSecondLookInQa2=false`; CT-C-01/02/03 skip; relatório ENV-GAP | — |

**Tags:** `@smoke @api @second-look @env-check`

### CT-C-01 — 1ª submissão Second Look → UW_DENIED 13m + preview 16m

**Pré-condição:** CT-C-00 passou; TireAgent tem programa 16m ativo hoje.

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: confirmar programa 16m TireAgent Active | DB: `SELECT is_active, activation_date, deactivation_date FROM uown_merchant_program WHERE merchant_pk=<OW90218.pk> AND program_pk=<16m.pk>` | DB: `is_active=true` | 5s |
| 2 | Cleanup leads prévios | API | state | 10s |
| 3 | `sendApplication` SEM bank data | API: profile fixo ssn-catalog §2 | Payload: 200 | 30s |
| 4 | Response assertions | Payload | `status=UW_DENIED` 13m; `isEligibleForExtraInfo=true`; `paymentDetailsList` com entry `planId=*16` | 5s |
| 5 | DB lead | DB: `SELECT status, merchant_program_pk FROM uown_los_lead WHERE ...` | DB: status=UW_DENIED; merchant_program_pk pode ser null ou 16m (empírico) | 5s |

**Tags:** `@critical @api @second-look @modalidade-C`

### CT-C-02 — 2ª submissão → UW_APPROVED 16m + programa 16m respeita datas

**Pré-condição:** CT-C-01 passou; programa 16m TireAgent Active.

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | `sendApplication` MESMO SSN + profile **EXATO** + bank data | API | Payload: 200 | 30s |
| 2 | Avançar `getMissingFields` + `submitApplication` com MASTERCARD_APPROVED + planId 16m | API (pitfall #3) | Payload: 200 | 60s |
| 3 | Drive até FUNDED | helpers canônicos | DB lead FUNDED | 120s |
| 4 | Response 2ª submissão | Payload | `status=UW_APPROVED` 16m | 5s |
| 5 | DB lead | DB: `SELECT merchant_program_pk, company FROM uown_los_lead WHERE pk=<leadPk>` | DB: `merchant_program_pk=<16m.pk>` | 5s |
| 6 | DB schedule | DB: `SELECT term_in_months FROM uown_los_sched_summary WHERE lead_pk=<leadPk>` | DB: 16 | 5s |
| 7 | **[validação-chave]** programa 16m tem `is_active=true` + datas OK | DB: mesmo SELECT do CT-C-01 step 1 | DB: prova que backend respeita datas | 3s |

**Tags:** `@critical @api @second-look @modalidade-C @program-selection @date-driven`

### CT-C-03 — Second Look com 16m desativado por data (discovery)

**Objetivo:** discovery — testa interseção Second Look × feature de datas.

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: CT-C-01 executado (preview 16m recebido) | — | lead_state captured | — |
| 2 | Capturar `pk_16m_TireAgent` + snapshot | DB | snapshot guardado | 3s |
| 3 | **AUTORIZADO:** `UPDATE uown_merchant_program SET deactivation_date=CURRENT_DATE-1 WHERE pk=<pk_16m_TireAgent>` | DB | DB atualizado | 3s |
| 4 | POST sweep | API | 200 | 30s |
| 5 | Validar `is_active=false` | DB | DB: 16m Inactive | 3s |
| 6 | 2ª submissão idêntica ao CT-C-02 | API | Payload: status? | 60s |
| 7 | **Discovery:** registrar comportamento observado | — | — | — |

**Hipóteses documentadas no relatório:**
- **Hipótese A:** 2ª sub denied ou erro → feature respeita datas mesmo em Second Look (comportamento esperado) → `[OBSERVAÇÃO]` consistente.
- **Hipótese B:** 2ª sub retorna 200 UW_APPROVED 16m mesmo com programa Inactive → `[HIPÓTESE possível bug]`. Classificação conservadora: rodar 1x em fresh setup, pedir autorização ao user + checar task/issue existente antes de `[CONFIRMADO]`.

**Cleanup (obrigatório):** `UPDATE ... SET deactivation_date=<original> WHERE pk=<pk_16m_TireAgent>` + sweep + validar `is_active=true`.
**Tags:** `@critical @api @second-look @modalidade-C @program-selection @date-driven @discovery`

### CT-DateSelect-13to16-UOWN — Desativar 13m → aplicação pega 16m

**Tipo:** E2E (UI: New Application) + DB + API setup

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: capturar `pk_13m` e `pk_16m` do OL90294-0001 | DB: query merchant + programs | DB | 5s |
| 2 | Snapshot ambos programas | DB | snapshots captured | 3s |
| 3 | **AUTORIZADO:** `UPDATE ... SET deactivation_date=CURRENT_DATE-1 WHERE pk=<pk_13m>` | DB | DB: 13m deactivation_date=ontem | 3s |
| 4 | POST sweep | API | 200 | 30s |
| 5 | Validar DB: 13m `is_active=false`, 16m `is_active=true` | DB | DB | 3s |
| 6 | UI cross-validation: `/programs` filtrar por 13m → abrir Program Details → Notes accordion | UI | UI: deactivation no passado; entry `PROGRAM_DATA_CHANGE` `active: true → false` | 15s |
| 7 | **ACT:** iniciar New Application (UI) | UI: Origination New Application flow | UI: form aberto | 30s |
| 8 | Preencher fresh data: email único, SSN `generateTestSSN(true)`, profile válido | UI | UI: form preenchido | 30s |
| 9 | Submeter primeiro step | UI | UI: decisão UW = Approved | 60s |
| 10 | Avançar até Complete Application + MASTERCARD + banking | UI | UI: complete | 60s |
| 11 | Submit final | UI | UI: confirmação | 30s |
| 12 | **[reflex #4 Credit Application]** Capturar leadPk | DB: `SELECT pk, merchant_program_pk, status, company FROM uown_los_lead WHERE email_primary=<email> ORDER BY pk DESC LIMIT 1` | DB: lead recente | 5s |
| 13 | **Assertion PRINCIPAL:** `paymentDetailsList` veio só com 16m | API log / response capture (via test proxy ou via re-request `getApplicationStatus(shortCode)`) | Payload: entradas só `planId=*16`; zero `*13` | 5s |
| 14 | DB lead program | DB: `merchant_program_pk=<pk_16m>` | DB match | 3s |
| 15 | **Contra-prova:** `merchant_program_pk ≠ pk_13m` | DB | DB != | 3s |
| 16 | DB schedule | DB: `term_in_months=16` em `uown_los_sched_summary` | DB | 3s |
| 17 | DB company | DB: `uown_los_lead.company=UOWN` | DB | 3s |

**Cleanup (obrigatório):** restore snapshot 13m (`deactivation_date=<original>`) + sweep + validar `is_active=true`.
**Tags:** `@critical @e2e @uown @program-selection @date-driven @modalidade-B`

### CT-DateSelect-16to13-UOWN — Desativar 16m → aplicação pega 13m

Mesmo padrão do anterior invertendo 13↔16. `paymentDetailsList` esperado: só `*13`. `merchant_program_pk=pk_13m`. `term_in_months=13`.

**Tags:** `@critical @e2e @uown @program-selection @date-driven`

### CT-DateSelect-13to16-KS — Kornerstone desativar 13m → 16m

**Pré-condição extra:** KS3015 preflight + `uown_sv_account.company` check após funding.

**Validações extra:**
- `uown_los_lead.company=KORNERSTONE`
- `paymentDetailsList` 16m depende de bank data presente (pitfall #5) — o testData inclui banking
- Se `paymentDetailsList` vazio → documentar se é comportamento esperado (merchant KS sem 13m ativo e sem elegibilidade 16m forçaria lead a falhar) OU `[HIPÓTESE]`

**Tags:** `@critical @e2e @kornerstone @program-selection @date-driven @modalidade-B`

### CT-DateSelect-16to13-KS — Kornerstone desativar 16m → 13m

Inverso do anterior. Valida `uown_sv_account.company=KORNERSTONE` pós-funding.
**Tags:** `@critical @e2e @kornerstone @program-selection @date-driven`

### CT-DateSelect-BothInactive — Edge case ambos desativados

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | `UPDATE uown_merchant_program SET deactivation_date=CURRENT_DATE-1 WHERE merchant_pk=<OL90294>` (todos) + sweep | DB + API | DB: todos Inactive | 10s |
| 2 | Confirmar estado | DB | DB | 3s |
| 3 | Tentar nova aplicação via API (UI opcional) | API: `sendApplication` | Payload: observar response | 30s |
| 4 | **Discovery:** documentar um dos 3 comportamentos | — | A: 400 "No active program" / B: 200 payload vazio + lead blocked / C: ignora e pega recente (BUG) | — |

**Cleanup:** restore todos os programas + sweep
**Tags:** `@regression @e2e @edge-case @program-selection @date-driven`

### CT-Reselect-UOWN — Desativar P1 via UI e nova aplicação pega P2

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Arrange: merchant tem P1 + P2 ambos Active | DB snapshot | DB | 5s |
| 2 | Abrir Programs page → editar P1 → `deactivation=today-1d` → Save | UI | UI: toast | 20s |
| 3 | Validar P1 Status=Inactive na merchant page | UI | UI | 10s |
| 4 | Criar nova aplicação fresh (via UI) | UI: buildTestData + form | UI | 120s |
| 5 | Capturar newLeadPk | DB | leadPk | 3s |
| 6 | Assert: `merchant_program_pk ≠ P1.pk` | DB | DB | 3s |
| 7 | Assert: `merchant_program_pk = P2.pk` | DB | DB | 3s |
| 8 | `is_active` do programa escolhido | DB | `true` | 3s |

**Cleanup:** reativar P1 (UPDATE autorizado + sweep)
**Tags:** `@critical @e2e @origination @program-selection`

### CT-Reselect-KS — idem para Kornerstone

Mesmo padrão com KS3015 + check `uown_sv_account.company=KORNERSTONE`.
**Tags:** `@critical @e2e @kornerstone @program-selection`

---

## Grupo 5 — API (CT-API-01..CT-API-16)

**Endpoint:** `POST /uown/createOrUpdateProgram` (svc)
**Body:** `{merchantPk, programPk, activationDate?: string ISO, deactivationDate?: string ISO, active?: boolean}`
**Hook `afterEach`:** restore snapshot via `updateMerchantProgramDates`.

### CT-API-01-UOWN — Happy path UOWN

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | Snapshot programa UOWN | DB | snapshot | 3s |
| 2 | POST body `{merchantPk: OL90294.pk, programPk: <P>, activationDate: "2026-05-01", deactivationDate: "2026-06-01", active: true}` | API | Payload: 200, body ecoa campos | 10s |
| 3 | DB | SELECT | DB: activation/deactivation/is_active corretos; `is_active` calculado (hoje=2026-04-22 < 2026-05-01 → `is_active=false`) | 3s |
| 4 | UI verificação (opcional) | UI: Program Details | UI: Status = Inactive (ainda não começou) | 10s |

**Cleanup:** restore
**Tags:** `@smoke @api @uown`

### CT-API-01-KS — Happy path Kornerstone

Mesma lógica para programa de KS3015. Extra: DB tenant isolation — mudança KS não afeta OL90294.
**Tags:** `@smoke @api @kornerstone`

### CT-API-02 — `activationDate: null`

Body: `{..., activationDate: null, deactivationDate: "2026-12-31", active: true}`. Expected: 200; DB `activation_date IS NULL`; `is_active=true`.
**Tags:** `@regression @api @null-fields`

### CT-API-03 — `deactivationDate: null`

Body: `{..., activationDate: "2026-01-01", deactivationDate: null, active: true}`. Expected: 200; DB `deactivation_date IS NULL`; `is_active=true`.
**Tags:** `@regression @api @null-fields`

### CT-API-04 — Ambos null

Body: `{..., activationDate: null, deactivationDate: null, active: true}`. Expected: 200; ambos null; `is_active=true`; tooltip `—/—`.
**Tags:** `@regression @api @null-fields`

### CT-API-05 — Omissão total dos campos de data

Body: `{merchantPk, programPk, active: true}` (sem as chaves). Expected: 200; DB ambos null (Jackson trata omit como null); comportamento idêntico ao CT-API-04.
**Tags:** `@regression @api @null-fields @omit-fields`

### CT-API-06 — `activation > deactivation` → 400

Body: `{activationDate: "2026-12-01", deactivationDate: "2026-01-01"}`. Expected: 400; body contém `"activationDate must be before or equal to deactivationDate"`; DB unchanged.
**Tags:** `@regression @api @validation @critical`

### CT-API-07 — `activation = deactivation` → 200 (inclusivo)

Body: `{activationDate: "2026-05-15", deactivationDate: "2026-05-15"}`. Expected: 200; se hoje=2026-05-15 → `is_active=true`; caso contrário `false`.
**Tags:** `@regression @api @validation @boundary`

### CT-API-08 — Backdated activation

Body: `{activationDate: "2020-01-01", deactivationDate: null}`. Expected: 200; `is_active=true`.
**Tags:** `@regression @api`

### CT-API-09 — deactivation passado sem activation

Body: `{activationDate: null, deactivationDate: "2020-12-31", active: true}`. Expected: 200; DB `is_active=false` mesmo com `active:true` no request (backend sobrescreve). Se backend respeita flag → `[HIPÓTESE]` bug.
**Tags:** `@regression @api @validation @conflict-flags`

### CT-API-10 — merchantPk inválido

Cases:
- Sem merchantPk → 400 (campo obrigatório)
- merchantPk inexistente (`99999999`) → 404 ou 400
- merchantPk tipo errado (`"abc"`) → 400 parse

DB: unchanged. Mensagens não vazam stack trace.
**Tags:** `@regression @api @validation @negative`

### CT-API-11 — programPk inválido

Idem CT-API-10 para programPk.
**Tags:** `@regression @api @validation @negative`

### CT-API-12 — Formato de data inválido

Cases:
- `"not-a-date"` → 400
- `"2026-13-45"` → 400
- `"05/15/2026"` (MM/DD/YYYY) → confirmar (Jackson LocalDate espera ISO-8601; provavelmente 400)
- `1684108800` (timestamp) → 400 ou conversão? (confirmar)

Expected: 400 em todos; mensagem indica campo + formato esperado.
**Tags:** `@regression @api @validation @format`

### CT-API-13 — Datas prevalecem sobre flag `active` (CRÍTICO)

**Cenário A** — `active:false` mas datas indicam Active → expected `is_active=true` no DB. Falha → `[CONFIRMADO]` BUG.

**Cenário B** — `active:true` mas deactivation no passado → expected `is_active=false`. Falha → `[CONFIRMADO]` BUG.

**Cenário C** — campo `active` omitido → backend calcula 100% das datas → `is_active=true` (datas englobam today).

**Cenário D** — Frontend↔Backend consistência: após cada cenário, `/programs` → abrir programa → status UI = `is_active` DB. Divergência → `[CONFIRMADO]` BUG de sincronização.

| # | Step | Action | Validation | Timeout |
|---|------|--------|-----------|---------|
| 1 | (A) POST body cenário A | API | 200 | 10s |
| 2 | DB `is_active=true` (datas prevaleceram) | DB | DB assertion | 3s |
| 3 | UI: `/programs` → programa → status=Active | UI | UI | 10s |
| 4 | (B) POST body cenário B | API | 200 | 10s |
| 5 | DB `is_active=false` | DB | DB | 3s |
| 6 | UI: status=Inactive | UI | UI | 10s |
| 7 | (C) POST sem `active` | API | 200 | 10s |
| 8 | DB `is_active=true` | DB | DB | 3s |

**Cleanup:** restore snapshot
**Tags:** `@critical @regression @api @validation @source-of-truth @business-rule`

### CT-API-14 — Datas extremas

Cases: `1900-01-01`, `9999-12-31`, `0001-01-01`. Expected: aceito sem overflow; DB persiste exato; UI/tooltip não quebra ao exibir.
**Tags:** `@regression @api @edge-case @boundary`

### CT-API-15 — Idempotência UPSERT

Steps: POST body X → 200; POST body X idêntico → 200. Expected: DB 1 row apenas; `row_updated_timestamp` atualiza na 2ª; `row_created_timestamp` permanece; `merchant_activity_log` pode registrar 2 entries (audit) mas programa não duplica.
**Tags:** `@regression @api @idempotency`

### CT-API-16 — Auth + tenant isolation

Cases:
- Sem Authorization header → 401
- Token role readonly → 403
- Token tenant A mutando tenant B → 403 ou 404

Expected: controle de acesso funciona; mensagens não vazam dados entre tenants.
**Tags:** `@regression @api @security @permissions`

---

## Data Dependencies — paralelização

| Grupo | Serial/Parallel | Motivo |
|-------|-----------------|--------|
| Grupo 1 (CT-01..CT-07c) | **Serial** | Todos mutam merchant OL90294-0001 (mesmo contexto de programa) |
| Grupo 2 (CT-08..CT-17) | **Serial** | Muta mesmo programa em loops; snapshot/restore em afterEach |
| Grupo 3 (CT-18..CT-25) | **Serial** | UPDATE direto no DB em programas compartilhados; sweep global |
| Grupo 3b (CT-KS-SMOKE) | Paralelizável com Grupo 1/2 (merchant distinto) | KS3015 não conflita com OL90294-0001 |
| Grupo 4 CT-C-* | **Serial entre si** (mesmo SSN Second Look) | Reuso de SSN `100000053` exige cleanup sequencial |
| Grupo 4 CT-DateSelect-*-UOWN | **Serial** (mutam OL90294 programs) | Paralelizar com -KS (merchant distinto) ok |
| Grupo 4 CT-DateSelect-*-KS | Paralelizável com UOWN | Merchant distinto |
| Grupo 4 CT-DateSelect-BothInactive | **Bloqueia** todos os outros CT-DateSelect de UOWN durante execução | Muta todos os programas do merchant |
| Grupo 4 CT-Reselect-* | Serial dentro da brand | mesma lógica |
| Grupo 5 (CT-API-*) | Paralelizável entre si desde que cada CT use programa distinto | snapshot/restore por CT |

**Configuração Playwright recomendada:**
```ts
// spec.ts
test.describe.configure({ mode: 'serial' });  // default deste SPEC

// exceções paralelas explícitas:
// - CT-KS-SMOKE: mover para arquivo dedicado OU test.describe('@kornerstone', { mode: 'default' })
// - CT-API-* com programas distintos: test.describe.configure({ mode: 'default' }) se reservarem programa próprio
```

---

## Edge Cases

1. **Segunda Look em qa2 pode não estar habilitado** (ssn-catalog §2 confirma só em stg) → CT-C-00 detecta; CT-C-01/02/03 skip condicional.
2. **Tabela real: `uown_merchant_program` vs `uown_merchant_to_program`** → CT-18 valida schema no 1º run.
3. **`ApplicationProcessor.java:296-305` comentado em branch local** → CT-DateSelect-* valida empiricamente; se seleção por data NÃO funcionar, documentar `[HIPÓTESE]` possível feature não deployada em qa2.
4. **Pitfall #10 merchant config drift** → `ensureMerchantReady` no globalSetup para OL90294 + KS3015.
5. **Pitfall #1 (email único)** → `generateUniqueEmail()` em todo CT que cria aplicação.
6. **Pitfall #3 (MASTERCARD em qa)** → VISA falha silenciosamente; sempre usar MASTERCARD_APPROVED.
7. **Pitfall #5 (Kornerstone banking)** → Sem banking + BIN elegível, backend não oferece 16m mesmo em merchant KS.
8. **Brand mismatch Kornerstone (ssn-catalog §7.2)** → pré-check `uown_sv_account.company` após funding em CTs KS. Divergência → STOP + pedir autorização UPDATE ao user (precedente pipeline #491).
9. **UPDATE direto concorrente** → `test.describe.configure({ mode: 'serial' })` + snapshot/restore atômico por CT.
10. **DST/timezone** — operar sempre em datas ISO (`YYYY-MM-DD`, sem horário). Backend usa `LocalDate` (sem timezone). `CURRENT_DATE` no PG usa timezone do server — validar que server e Playwright runner batem.
11. **CT-15b** pode exigir fallback DB UPDATE (mesmo flag de autorização do Grupo 3) se UI bloquear activation=null+deactivation=past.
12. **Second Look com 16m desativado (CT-C-03)** — discovery. Classificação conservadora: bug só após reprodução em fresh setup + confirmação do user (regra 11 CLAUDE.md).

---

## Riscos e mitigações (pré-implementação)

Replicados do scenarios, explicitados aqui como lista de ação:

| # | Risco | Mitigação |
|---|-------|-----------|
| 1 | Nome real da tabela | CT-18 valida `information_schema.tables`; atualiza docs schema se necessário |
| 2 | Seleção de programa por data não deployada em qa2 | CT-DateSelect-* é canário; se falhar todos → `[HIPÓTESE]` feature não live + pedir confirmação DevOps |
| 3 | UPDATE concorrente | serial mode + snapshot/restore |
| 4 | Merchant config drift (pitfall #10) | globalSetup `ensureMerchantReady` |
| 5 | Second Look só em stg | CT-C-00 guard; skip condicional |
| 6 | `use.gds.for.decision` pode não estar em qa2 | CT-C-00 detecta; solicita DevOps ou roda em stg |
| 7 | Kornerstone brand mismatch | pré-check DB + protocolo de autorização |
| 8 | Frontend deploy em qa2 | confirmado deployado (scenarios linha 152); se regredir, CT-02 falha imediatamente |

---

## Estimated Timeout

| Grupo | CTs | Soma aproximada |
|-------|-----|-----------------|
| Grupo 1 (9 CTs UI com add/edit/save) | CT-01..CT-07c | ~12 min |
| Grupo 2 (10 CTs status) | CT-08..CT-17, CT-15b | ~18 min |
| Grupo 3 (8 CTs hybrid sweep) | CT-18..CT-25 | ~15 min |
| Grupo 3b (1 CT) | CT-KS-SMOKE | ~2 min |
| Grupo 4 Second Look (4 CTs API) | CT-C-00..CT-C-03 | ~10 min |
| Grupo 4 DateSelect (6 CTs E2E criação app) | | ~35 min (UI fluxo completo ~5min cada) |
| Grupo 5 (17 CTs API) | CT-API-01..CT-API-16 | ~10 min |
| **Total estimado** | ~55 CTs | **~100 min** (serial) / ~60 min (com paralelização de KS + API) |

Justificativa: CTs de criação de aplicação (UI → FUNDED) dominam o tempo; sweep chamadas + DB queries são rápidas. Timeout global por CT default 120s; CTs com criação completa até 180s.

---

## Checklist (DoD) — spec-test

- [x] Cada CT tem `test.step()` label, action, validation
- [x] `testData` inclui `env`, `tag`, `runId`, `email`; artifact deps listados (exists/create)
- [x] Edge cases identificados; timeout estimado com justificativa
- [x] Business rules (scenarios + ssn-catalog + application-lifecycle + qa-domain-reflexes + testing.md) cross-referenced
- [x] Naming: `scheduleProgramActivationDeactivationDates` no SPEC title + file name
- [x] Interaction strategy em cada step: UI vs API labeled; UI-first onde existe
- [x] Triple validation em cada CT: payload/response + DB + UI (quando aplicável)
- [x] Risk Tier Decision table preenchida para CTs de criação
- [x] State-specific EPO/tax rules: N/A (CA sem peculiaridades aplicáveis à feature)
- [x] Cada CT mapeia a requirement do scenarios aprovado pelo user
- [x] User Story Mapping preenchido (US-MERCH-PROG-01..04)
- [x] QA domain reflexes aplicados: `[reflex #4]` Credit Application (CT-DateSelect-*), `[reflex #8]` Merchant (CT-01), `[reflex #11]` Mutation (CT-03, CT-06, CT-07c, CT-KS-SMOKE, CT-API-15)
- [x] Program Modality Coverage preenchida com justificativas de N/A explícitas (Modalidade A pura e D removidas pelo user)
- [x] Brand Coverage preenchida: UOWN + Kornerstone + TireAgent; pré-check `uown_sv_account.company` em CTs KS
- [x] DB UPDATE autorizado registrado + snapshot/restore em todos os CTs mutantes
- [x] Pitfalls #1, #3, #5, #10 referenciados
- [x] Paralelização/serial documentada por grupo

---

## Próximos passos (ordem de implementação sugerida)

1. **pre-docs (docs-update)** — atualizar `helpers-catalog.md`, `api-clients-catalog.md`, `page-objects-catalog.md` com os novos artefatos ("To create").
2. **subagent-impl-api-client** — estender `MerchantClient.createOrUpdateProgram` + ampliar typings de `getMerchantProgramsByMerchantPk` (paralelizável com page object).
3. **subagent-page-object** (`mode: create`) — `ProgramsPage` + `MerchantProgramsSectionPage` + selectors (paralelizável com api-client).
4. **subagent-impl-db-validation** — `merchant-program.db.ts` + `merchant-activity-log.db.ts` + `withAuthorizedDbUpdate` helper.
5. **subagent-impl-api** — Grupo 5 (CT-API-01..CT-API-16) primeiro — não depende de UI; valida contrato fundamental.
6. **subagent-impl-api** — Grupo 3 (CT-18..CT-25) — hybrid sweep.
7. **subagent-impl-e2e** — Grupo 1 + Grupo 2 + Grupo 3b (UI modal + status derivation).
8. **subagent-impl-api** — CT-C-00 smoke (guard antes de 01/02/03).
9. **subagent-impl-api** — CT-C-01/02/03 se CT-C-00 passou.
10. **subagent-impl-e2e** — Grupo 4 CT-DateSelect-* + CT-Reselect-* (mais pesado).
11. **subagent-validate-results** — gerar relatório `docs/taskTestingUown/scheduleProgramActivationDeactivationDates/scheduleProgramActivationDeactivationDates-report.md`.
12. **subagent-docs-update** (post-pipeline) — documentar pitfalls descobertos + schema (`uown_merchant_program` vs `_to_program`) + atualizar `application-lifecycle-protocol.md` com qualquer novo pitfall (regra 12 CLAUDE.md).

---

> **SPEC final.** Qualquer desvio em execução (merchant não encontrado, schema divergente, Second Look indisponível, brand mismatch, seleção por data não funcional) deve ser reportado no relatório como `[OBSERVAÇÃO]` / `[HIPÓTESE]` conforme `bug-classification-rules.md`, e escalado ao orquestrador antes de classificar como `[CONFIRMADO]`.

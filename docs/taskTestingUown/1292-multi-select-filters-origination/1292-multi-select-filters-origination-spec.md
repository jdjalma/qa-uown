# SPEC — 1292 Multi-Select on Merchant/Location Filters (Origination, all pages)

## Source

- **GitLab**: uown/frontend/origination#1292 — *UOWN | Origination | Add Multi-Select on Merchant/Location filters in all pages*
- **Author / Assignee**: Yuri Araujo / Davi Artur
- **Status / Workflow**: opened / qa-in-process
- **Priority**: high
- **Milestone**: RU05.26.1.52.0 (due 2026-05-26)
- **Pipeline classification**: frontend usability standardization (multi-select pattern roll-out across Origination pages) — UI-first E2E with DB-as-truth fallback.
- **Date**: 2026-05-20
- **Author of SPEC**: qa-planner

---

## 0. Open Questions — RESOLVED via MCP DOM-first investigation (qa1, 2026-05-20)

> Investigation evidence: `qa1-overview-bottom-filter.png`, screenshots e queries DOM via `mcp__playwright__browser_*`. Environment **qa1** (não qa2 — vide nota em §5).

### Findings consolidated

- **OQ-01 — New Application page**: **RESOLVIDO ✅ — `/newApplication` JÁ TEM multi-select implementado no front**. DOM em `react-select-8` (filter de baixo) confirma `filter__value-container--is-multi`, 757 merchants com `<input type="checkbox">` por opção. **Observação importante**: New Application **NÃO TEM "Select All"** (Overview bottom tem). Inconsistência de UX entre páginas — registrar como `[OBSERVAÇÃO]` no report, escalar para Davi/Yuri.
- **OQ-02 — Search dentro do dropdown**: **RESOLVIDO ✅ — NÃO há campo de busca separado**. O próprio combobox (`role="combobox" aria-autocomplete="list"`) aceita digitação e filtra a lista. Teste empírico: digitar "mobil" reduziu 758 → 8 opções em Overview/bottom. Cobre type-ahead search natural do `react-select`. CT-14 (search dedicada) é redundante — deletar/rebaixar.
- **OQ-03 — Trigger do filtro**: **RESOLVIDO ✅ — botão "Search" explícito** (azul, à direita do bloco de filtros). Marcar checkbox NÃO aplica filtro automaticamente. Comportamento adicional: **clicar uma opção FECHA o dropdown** (usuário precisa reabrir para marcar a próxima — anti-pattern de UX, mas é o que está em produção; registrar como `[OBSERVAÇÃO]` no report). Estado de marcação É preservado entre reabrir/fechar (AC3 ✅).
- **OQ-04 — Empty selection (0 selecionados)**: **RESOLVIDO ✅ — comportamento (a) "mostra todas as rows"**. Teste empírico: clicar `filter__clear-indicator` (X) limpa todas as marcações; clicar Search retorna a tabela ao default (10 rows). Não há "clear all" botão separado — o X do `react-select` é o clear-all.
- **OQ-08 — Apresentação visual das seleções**: **RESOLVIDO ✅ — formato "N items selected"** (texto contado, NÃO chips). Exemplo: marquei 2 merchants → campo mostra `"2 items selected"`. Nada de chips/pills. Selector: `[class*="filter__value-container--is-multi"]`. Não há overflow porque é texto contado, não chips.

### Achados adicionais (não previstos no SPEC original)

- **Overview tem DOIS componentes de filtro independentes** (alerta do usuário durante investigação):
  - Topo: KPIs Overview com filtro SINGLE-select (não foi contemplado nesta tarefa — UI antiga).
  - Baixo: tabela tipo Leads/Funnel com filtro MULTI-select (componente contemplado pelo MR !1456 + shared `getMerchantLocationFilterOptions`).
  - Conclusão: o "Overview" no escopo do ticket = **só o filtro de baixo**. O de cima é fora de escopo.
- **Página `/funding`** TAMBÉM tem multi-select (3 multi-containers, mesmo padrão visual). NÃO está em nenhum MR da lista que mapeei. Hipótese: ou veio em release anterior, ou consome o shared component sem MR dedicado. Adicionar smoke regressão.
- **Página `/alerts`** abre Filters mas combos contam 0 — provavelmente Alerts não tem Merchant/Location filter, fora de escopo natural.
- **Permissão**: usuário **`manager`** (env var `DEFAULT_MANAGER_USERNAME` / `DEFAULT_MANAGER_PASSWORD`) tem acesso a `/merchant`, `/merchantSetting`, `/openToBuy`, `/rebate`. Decisão do usuário 2026-05-20: usar `manager` para TODOS os CTs. AutotestAgent não cobre os 4 admin views.
- **"Select All" ausente em New Application**: **comportamento intencional** (decisão de produto confirmada 2026-05-20). Não tratar como bug. Documentar no report como diferença consciente entre views.
- **Anti-pattern UX (dropdown fecha ao marcar)**: **comportamento esperado** (decisão de produto confirmada 2026-05-20). Page object DEVE reabrir o dropdown antes de cada nova marcação. Não tentar workaround.

### Strong (mantidas como `[ASSUNÇÃO]` até confirmação)

- **OQ-05 — Outras páginas com Merchant/Location filter fora do release**: confirmado parcialmente — Funding também tem multi-select e não estava na lista. Reports/Dashboard/OTB Settings ainda em aberto (não-acessíveis por AutotestAgent).
- **OQ-06 — Persistência através de navegação**: não testado (sessão caiu duas vezes durante investigação por navegação direta deep-link). `[ASSUNÇÃO]`: não persiste — cada página tem seu próprio store. CT-12 segue como exploratório.
- **OQ-07 — Cap de seleção**: dropdown mostra 757 opções sem cap visual. `[ASSUNÇÃO]`: sem cap. CT-10 ainda válido como BVA.
- **OQ-09 — CSV export filename/columns**: a confirmar pelo implementer ao codar CT-09.

> **Action**: As 4 OQs bloqueadoras foram resolvidas via MCP. **Novo bloqueador**: credenciais de agente com acesso a `/merchant`, `/merchantSetting`, `/openToBuy`, `/rebate` em qa1 — escalar com Yuri/Davi antes de codar CT-01/CT-02/CT-04/CT-05.

---

## 1. Scope

### IN

- **Overview page (baseline / smoke regression)** — already had multi-select; must not have regressed.
- **5 newly converted pages** (R1.52.0):
  - `pages/openToBuy/index.tsx` (MR !1460)
  - `pages/rebate/index.tsx` + `utils/rebate-table-config` (MR !1459/!1460)
  - `pages/leads/index.tsx` + `get-leads-by-criteria-table-config` (MR !1456)
  - `pages/merchant/index.tsx` (MR !1459)
  - `pages/merchantSetting/index.tsx` (MR !1459)
- **Shared component**: `components/merchant-location-filters/getMerchantLocationFilterOptions.ts` (single point of regression — covered indirectly by each page's CT).
- **Filter result correctness**: the rendered table must match the union of selected Merchant ⨯ Location filter values (AC #4 / Scenario 4 of ticket).
- **Visual persistence**: selected checkboxes/chips survive close/reopen of the dropdown on every one of the 6 pages.
- **CSV export on Leads** — backend MR !1436 changed `CSVFileService` + `GetLeadsByCriteriaFilter` + `getLeadsByCriteria.sql` to accept arrays. Silent regression risk: export ignoring multi-select and returning all rows OR breaking on array param. Dedicated CT.
- **Edge cases**: select-all, deselect-individual, clear-all, combined Merchant+Location, 0-selected, large-selection (boundary).
- **Environment**: **qa1** — decisão do usuário (2026-05-20). R1.52.0 está deployado em qa1; qa2 não tem o release (Overview/bottom em qa2 não mostra checkboxes — confirmado via MCP). O outage DV360 em qa1 afeta `sendApplication`, não a leitura de filtros — não interfere neste SPEC.

### OUT (explicitly excluded, with justification)

- **`pages/newApplication`** — backend prepared (MR !1437) but no frontend MR for the page in R1.52.0. Out until OQ-01 resolved. **Will not test multi-select here**; CT-16 (optional smoke) only verifies the page still loads & filters with single values (backend regression check).
- **Reports / Dashboard / OTB Settings / other pages** with Merchant/Location filter that did NOT get a MR — out of scope per `[ASSUNÇÃO]` OQ-05. Will be visited as 60-second smoke (page loads, old filter still works) but not deep-tested.
- **Application creation, signing, payment flows** — feature does not touch these pipelines. Merchant preflight (Rule #12) explicitly **SKIPPED** — we are consuming filter dropdowns over existing data; no application is created, no merchant config mutated. Side-effect-free.
- **Activity Log validation (Rule #13)** — filtering a list view is a UI navigation action, not a business action. No row in `uown_los_lead_notes` is expected. **Justification documented per Rule #13**: the rule says "every relevant business action ... MUST have a corresponding log"; selecting filter checkboxes is not a state-changing business action (no lead, lease, payment, or contract is mutated). Skip is intentional, not an oversight.
- **API-only path** — feature is 100% UI consumption. Rule #14 enforces UI-first. No API-only test in this SPEC.
- **Performance / load** — selecting N merchants where N is huge: only spot-checked as boundary (CT-10), not load-tested.
- **Mobile viewport** — Origination is agent-facing desktop (Bootstrap `d-lg-block`, viewport ≥ 1440×900 per Rule #15). Mobile is out.
- **Roles other than default agent**: SPEC assumes the test user is a standard Origination agent with access to all 6 pages. Per-role permission matrix (e.g. Read-Only) — out (would be a separate task).
- **Accessibility (WCAG)** — out beyond sanity (`aria-checked` reflects state).

### AMBIGUOUS

- See Open Questions section. Top ambiguity: OQ-01 (newApplication scope), OQ-02 (search-in-dropdown), OQ-03 (apply trigger).

---

## 2. Acceptance Criteria — restated from ticket + derived

### AC explicit (from ticket)

- **AC1** — Multi-select available on **all applicable Origination filter pages**.
- **AC2** — Dropdown uses **checkbox** UI per option.
- **AC3** — Selections **persist visually** after closing and reopening the dropdown.
- **AC4** — User can select **multiple merchants AND/OR multiple locations simultaneously**, and the table reflects the union/correct intersection of the selection.

### AC derived (implicit / from MR diff + product reflexes)

- **AC5 (implicit)** — Shared component `getMerchantLocationFilterOptions.ts` returns options consistently across all 6 pages (no per-page divergence in option list shape).
- **AC6 (implicit, from MR !1436)** — Leads **CSV export** honors multi-select filter (rows in CSV ⊆ rows shown in table after filter applied).
- **AC7 (implicit)** — Backend endpoints handle **array params** without 500/400 (MRs !1442, !1437, !1436 changed payload shape).
- **AC8 (implicit, regression)** — Overview multi-select continues to work after the shared-component refactor (no smoke-level regression on the previously working page).

---

## 3. AC Coverage Matrix

| AC | Covered by |
|----|-----------|
| AC1 | CT-01, CT-02, CT-03, CT-04, CT-05 (one per new page) |
| AC2 | CT-01 (DOM checkbox role assertion as canonical; reused as helper across CTs) |
| AC3 | CT-06 (persistence per page), CT-07 (chip/list rendering) |
| AC4 | CT-08 (Merchant + Location combined, table assertion) |
| AC5 | Implicit — covered by uniform behavior across CT-01..CT-05 |
| AC6 | CT-09 (CSV export Leads) |
| AC7 | Implicit — every CT-01..CT-05 triggers the backend; lack of 500 is asserted |
| AC8 | CT-00 (Overview smoke regression) |

---

## 4. Risk Analysis (rubric: N, I, B, H | C, F, A — see skill `risk-based-prioritization`)

| Area | N | I | B | H | C | F | A | Score | Bucket | Rationale |
|------|---|---|---|---|---|---|---|-------|--------|-----------|
| Shared component refactor (`getMerchantLocationFilterOptions`) used by 5 pages | 3 | 1 | 2 | 1 | 0 | 1 | 0 | 7 | P2 | Code is new; agent-only; but powering 5 pages means a single bug fans out |
| Leads page filter + CSV export | 3 | 1 | 2 | 0 | 0 | 2 | 1 | 21 | P1 | New filter UI + new array-aware SQL + new CSV path; CSV is data exfiltration to external tool, mismatch = audit issue |
| Merchant page filter | 3 | 1 | 1 | 0 | 0 | 1 | 0 | 5 | P2 | Refactor of admin list view |
| Merchant Setting page filter | 3 | 2 | 1 | 0 | 0 | 2 | 0 | 10 | P2 | Backend repo + service changed; affects merchant config visibility |
| Open To Buy page filter | 3 | 1 | 1 | 0 | 0 | 2 | 0 | 10 | P2 | Financial view (credit limits) — wrong filter = wrong dashboard |
| Rebate page filter | 3 | 1 | 1 | 0 | 0 | 2 | 1 | 12 | P2 | Money flow visibility (rebate amounts to merchants); minor audit angle |
| Overview baseline regression | 1 | 1 | 1 | 1 | 0 | 2 | 0 | 4 | P3 | Pre-existing, but refactored downstream — quick smoke is cheap |
| New Application page (OQ-01) | 2 | 1 | 1 | 0 | 0 | 3 | 0 | 12 | P2 | Only if in scope; backend touched but front maybe not |
| Combined Merchant+Location filter (AC4) | 3 | 2 | 2 | 0 | 0 | 2 | 0 | 14 | P2 | Two array params interacting; classic place for AND-vs-OR confusion |
| CSV export honoring filter (AC6) | 3 | 1 | 1 | 0 | 0 | 1 | 2 | 12 | P2 | Silent regression — agent thinks export is filtered but it's not |
| Boundary: select 50+ merchants | 2 | 1 | 3 | 0 | 0 | 1 | 0 | 6 | P2 | URL/query length, UI overflow |
| Empty selection behavior | 2 | 0 | 2 | 0 | 0 | 1 | 0 | 4 | P3 | OQ-04 unresolved |

### Floor rules applied

- **Cross-page uniformity (5 new pages)** — each new page is a P1 floor regardless of individual score: a bug isolated to one page is exactly the kind of regression this multi-page refactor introduces.
- **CSV export** is promoted to **P1** floor: silent regression class (agent sees filtered table, exports unfiltered data, makes decision on stale view).

### Final priority decision

- **P0**: none — feature is not customer-facing, not financial, not blocking revenue. No CT meets P0 floor.
- **P1**: CT-01..CT-05 (one per new page, multi-select happy path + persistence + filter-correct), CT-09 (CSV export Leads).
- **P2**: CT-06, CT-07, CT-08, CT-10, CT-11, CT-12, CT-13, CT-14 — edge cases & combined filter.
- **P3**: CT-00 (Overview smoke regression), CT-15 (search-in-dropdown if exists), CT-16 (newApplication smoke if OQ-01 says "keep").

**Coverage delivered this sprint**: P1 + the highest-value P2 (CT-08 combined filter, CT-10 select-all, CT-11 empty/clear, CT-12 navigation persistence). Total: ~11 CTs. P3 deferred unless time allows.

---

## 5. Test Strategy

- **Approach**: **E2E (browser-driven Playwright)** — feature is 100% UI usability across agent-facing portal pages. Rule #14 (UI-first) makes this non-negotiable.
- **No API-only**: even though backend MRs (!1436, !1437, !1442) shipped array-aware payloads, validating the array contract is implicitly covered by the UI driving real requests. A separate API-only test would not catch UI bugs (checkbox state, chip rendering, persistence) and would duplicate coverage.
- **DB usage**: read-only `SELECT` as **support assertion** only — when UI does not give clean visibility into the underlying filter result (e.g. very large lists, hidden columns). Per Rule #9 / Security Rules, no `INSERT/UPDATE/DELETE`.
- **Test data hierarchy** (Rule #9): consume **pre-existing** merchants/locations in qa2. Do NOT create new applications, leads, or merchants — filtering is read-only over existing data; fresh data via automation is **not** the right default here because (a) the feature consumes already-indexed data, (b) creating data would inflate dropdown options and pollute other tests, (c) no state mutation occurs in the feature. Justification documented per Rule #9.
- **Merchant preflight** (Rule #12): **EXPLICITLY SKIPPED**. Test does not create applications and does not mutate merchant config. Per the rule's own exception: "Tests operating on existing lease/account should NOT run preflight". Pass `skipMerchantPreflight: true` (or simply do not invoke the helper).
- **Environment**: **qa2** primary. Rationale: qa1 has DV360 outage (memory `project_dv360_uat_qa1_outage_2026_05_18`); even though that outage is in `sendApplication`, qa1 reliability is shaky for this whole release. qa2 is healthy and has the same code.
- **Viewport**: **1440 × 900** minimum (Rule #15 — Bootstrap `d-lg-block`). Sidebar/filter regions hide on smaller viewports.
- **Auth**: usuário **`manager`** (env `DEFAULT_MANAGER_USERNAME` / `DEFAULT_MANAGER_PASSWORD`). AutotestAgent não tem permissão para Merchant/MerchantSetting/OpenToBuy/Rebate. Implementer deve adicionar/parametrizar manager no `auth.setup.ts` para o projeto origination-ui ou em fixture dedicada deste spec.
- **DOM-first**: per Rule #15, every selector failure is investigated via `mcp__playwright__browser_*` before retry/timeout fixes.
- **Regression suites to activate**: none beyond Overview smoke (CT-00). No dual-brand expansion (filter is brand-agnostic; merchant list contains both UOWN and KS merchants). No signing-regression (out of code path). No payment-regression (out of code path).

---

## 6. Scenarios (prioritized, numbered)

> Each CT lists: **type**, **portal**, **page**, **technique** (per `test-design-techniques`), **persona**, **pre-condition**, **steps**, **expected result**, **edge cases**, **pitfalls considered**, **priority**, **tags**.

### CT-00 — Overview multi-select smoke (regression)

- **Type**: E2E
- **Portal / Page**: Origination / `pages/overview`
- **Technique**: Use Case (smoke happy path)
- **Persona**: Origination agent
- **Pre-condition**: agent logged in, viewport ≥ 1440×900, qa2; at least 3 distinct merchants and 3 distinct locations exist in the qa2 dataset (confirmed via DB probe by implementer if uncertain).
- **Steps**:
  1. Navigate to Origination Overview.
  2. Open Merchant filter dropdown.
  3. Tick 2 merchants (record names).
  4. Close dropdown (click outside or apply per OQ-03).
  5. Reopen dropdown.
  6. Open Location filter dropdown; tick 2 locations.
  7. Apply / close.
- **Expected**:
  - After step 3 and reopen (step 5), the 2 ticked checkboxes are still `aria-checked="true"`.
  - Merchant input field shows chips/text reflecting 2 selections (per OQ-08).
  - After step 7, Overview table rows are filtered to (merchants ∈ {M1, M2}) AND (locations ∈ {L1, L2}).
  - No 500 in network panel; no console error.
- **Edge cases**: none here — this is regression smoke.
- **Pitfalls**: confirm Overview hasn't silently regressed when the shared component was extracted.
- **Priority**: P3
- **Tags**: `@origination @filters @smoke @regression`

### CT-01 — Multi-select Merchant on Open To Buy

- **Type**: E2E
- **Page**: `pages/openToBuy/index.tsx`
- **Technique**: Equivalence partitioning (valid class: N selections in {1, 2, many}); BVA (1 vs 2 to confirm "multi" really is multi)
- **Persona**: Origination agent reviewing credit limits
- **Pre-condition**: same as CT-00; at least 3 merchants visible in OTB table.
- **Steps**:
  1. Navigate to Origination → Open To Buy.
  2. Open Merchant filter; verify each option row is a **checkbox** (DOM: `role="checkbox"` or `<input type="checkbox">`) — assert `aria-checked` reflects state.
  3. Tick M1.
  4. Tick M2.
  5. Close dropdown; reopen.
  6. Apply filter.
  7. Read the resulting OTB table rows.
- **Expected**:
  - Step 2: each option has a checkbox affordance (AC2).
  - Step 5: M1 and M2 remain `aria-checked="true"` (AC3).
  - Input field shows two selections (chips/text per OQ-08).
  - Step 7: every visible row has `merchant ∈ {M1, M2}`. Table count > 0 (assumes data exists for selected merchants in qa2; implementer picks merchants with non-zero rows).
- **Edge cases**: covered by CT-10, CT-11 separately.
- **Pitfalls**: do NOT trust a "displayed text" assertion alone — checkbox state must come from `aria-checked` (Rule #15 DOM-first); chip text may render the same after a bug where state silently lost.
- **Priority**: **P1**
- **Tags**: `@origination @filters @openToBuy @multiSelect`

### CT-02 — Multi-select Merchant on Rebate

- **Type**: E2E
- **Page**: `pages/rebate/index.tsx` (+ `utils/rebate-table-config`)
- **Technique**: EP (valid)
- **Persona**: Origination agent reconciling rebates
- **Pre-condition**: same as CT-01.
- **Steps**: identical structure to CT-01 but on Rebate page.
- **Expected**: same assertions (checkboxes, persistence, filter applied) on Rebate table.
- **Pitfalls**: Rebate row contains monetary values — if implementer cross-checks DB, use `toBeCloseTo` for floats (memory `feedback_float_repr_not_bug`); UI assertion is on row count + merchant column.
- **Priority**: **P1**
- **Tags**: `@origination @filters @rebate @multiSelect`

### CT-03 — Multi-select Merchant on Leads

- **Type**: E2E
- **Page**: `pages/leads/index.tsx` (+ `get-leads-by-criteria-table-config`)
- **Technique**: EP (valid) + state-aware data choice
- **Persona**: Origination agent triaging leads
- **Pre-condition**: at least 2 merchants with leads of varied statuses present.
- **Steps**: as CT-01 on Leads.
- **Expected**: table shows leads only for ticked merchants. Network panel: backend request payload contains array of merchant IDs (not single string) — implementer captures as evidence.
- **Priority**: **P1**
- **Tags**: `@origination @filters @leads @multiSelect`

### CT-04 — Multi-select Merchant on Merchant page

- **Type**: E2E
- **Page**: `pages/merchant/index.tsx`
- **Technique**: EP (valid)
- **Pre-condition**: standard.
- **Steps**: as CT-01.
- **Expected**: same assertions. Note: this is the "list of merchants" page — filtering merchants by merchant ID is meta but valid. Sanity: verify result count matches selection count when each merchant is unique (i.e. ticking 2 distinct merchants returns ≤ 2 rows of merchants themselves).
- **Priority**: **P1**
- **Tags**: `@origination @filters @merchant @multiSelect`

### CT-05 — Multi-select Merchant on Merchant Setting

- **Type**: E2E
- **Page**: `pages/merchantSetting/index.tsx`
- **Technique**: EP (valid)
- **Pre-condition**: standard.
- **Steps**: as CT-01.
- **Expected**: same assertions on Merchant Setting page.
- **Pitfalls**: this page is wired to `domain/stores/merchant-setting.tsx` + `hooks/userMerchantSettingFormik.ts` — refactor of those touches form state; a regression could leak previous-selection into form on row select. Watch for cross-talk between filter state and any per-row edit form on the page.
- **Priority**: **P1**
- **Tags**: `@origination @filters @merchantSetting @multiSelect`

### CT-06 — Persistence on close/reopen (every page)

- **Type**: E2E (parameterized over the 5 new pages)
- **Technique**: State transition (dropdown OPEN → CLOSED → REOPENED, state must be preserved)
- **Pre-condition**: standard.
- **Steps** (per page):
  1. Open Merchant dropdown.
  2. Tick 3 merchants.
  3. Close dropdown.
  4. Reopen dropdown.
  5. Assert all 3 still `aria-checked="true"`.
  6. Tick 2 locations.
  7. Close & reopen Location dropdown.
  8. Assert location state preserved.
- **Expected**: full persistence; no clearing on close.
- **Edge case covered**: AC3 directly. This CT generalizes the persistence assertion that lives inline in CT-01..CT-05; keeping it separate enables parameterization across all 5 pages in a single test loop.
- **Priority**: **P2**
- **Tags**: `@origination @filters @persistence @multiSelect`

### CT-07 — Selected items visible in input field (chip/list rendering)

- **Type**: E2E
- **Technique**: Equivalence partitioning over count {0, 1, 2, many} of selections
- **Pre-condition**: standard; one page (Leads — highest-traffic) is sufficient as canonical, since shared component renders the same chips.
- **Steps**:
  1. Empty state: open Merchant dropdown without ticking; close. Read input.
  2. Single: tick 1; close. Read input.
  3. Multi: tick 3; close. Read input.
  4. Many: tick 10+ (if dataset allows); close. Read input.
- **Expected**:
  - Step 1: input shows placeholder or "All / Select Merchants" (per OQ-08).
  - Step 2: input shows the 1 chosen merchant (chip or text).
  - Step 3: input shows 3 chips OR a summary like "(3) selected" (per OQ-08 finding).
  - Step 4: input does not overflow viewport; either truncates with ellipsis or shows count summary.
- **Pitfalls**: OQ-08 must be resolved first; implementer should not hardcode chip vs. count assumption.
- **Priority**: **P2**
- **Tags**: `@origination @filters @ui @multiSelect`

### CT-08 — Combined Merchant + Location multi-select (AC4)

- **Type**: E2E
- **Technique**: Decision Table (Merchant: 0 or N selected × Location: 0 or N selected) — 4 combinations; this CT covers the (N, N) cell, the most interactive one. (0,0), (N,0), (0,N) are covered by CT-01/03/05/11.
- **Pre-condition**: a page with both filters AND non-empty intersection of (merchant ⨯ location). Recommended: Leads (rich dataset).
- **Steps**:
  1. Navigate to Leads.
  2. Open Merchant dropdown; tick M1, M2.
  3. Apply.
  4. Open Location dropdown; tick L1, L2.
  5. Apply.
  6. Inspect resulting table.
- **Expected**: every row satisfies `(merchant ∈ {M1, M2}) AND (location ∈ {L1, L2})`. Row count > 0 (implementer picks intersection that exists in qa2 — verify with a pre-run DB SELECT or by trying a known combination).
- **Optional DB cross-check**: `SELECT count(*) FROM <leads_view> WHERE merchant_id IN (...) AND location_id IN (...)` to confirm UI count matches DB truth.
- **Pitfalls**: classic AND-vs-OR confusion in backend SQL — verify it's AND (intersection), not OR (union). If union is observed, that's an `[OBSERVAÇÃO]` — escalate, do not classify as bug without confirming intended behavior.
- **Priority**: **P2** (high-end of P2 — borderline P1)
- **Tags**: `@origination @filters @leads @combined @multiSelect`

### CT-09 — Leads CSV export honors multi-select filter (AC6)

- **Type**: E2E + file inspection
- **Technique**: Use Case + Error Guessing (silent-regression class)
- **Pre-condition**: Leads page; at least 2 merchants with leads.
- **Steps**:
  1. Navigate to Leads.
  2. Tick 2 merchants (M1, M2).
  3. Apply filter; record visible row count (N_ui).
  4. Trigger CSV export (button/menu item — implementer locates via DOM).
  5. Download intercepted via Playwright (`page.waitForEvent('download')`).
  6. Parse CSV.
- **Expected**:
  - CSV row count (excluding header) equals N_ui.
  - Every row's merchant column ∈ {M1, M2}.
  - No row from an unselected merchant.
- **Pitfalls**: silent regression — agent UI shows filtered count but CSV dumps everything. Backend MR !1436 explicitly changed `CSVFileService` to consume the array filter; this CT exists because that change is exactly the kind that ships without UI verification.
- **Priority**: **P1**
- **Tags**: `@origination @filters @leads @csvExport @multiSelect`

### CT-10 — Select-all boundary (large selection)

- **Type**: E2E
- **Technique**: BVA (max), Error Guessing (URL/query length)
- **Pre-condition**: a page with many merchants in the dropdown (Leads recommended; OTB also dense).
- **Steps**:
  1. Open Merchant dropdown.
  2. If a "Select all" affordance exists (OQ to discover), use it. Otherwise, tick every visible option.
  3. Apply.
  4. Observe network request payload (array length).
  5. Observe table renders without error and without HTTP 414 (URI Too Long) / 400.
- **Expected**: all options ticked persist on reopen; table renders; backend response OK; no console error.
- **Pitfalls**: query string serialization — `?merchantIds=1&merchantIds=2&...` can hit URL length cap; if backend uses POST body, this is moot — observe and document.
- **Priority**: **P2**
- **Tags**: `@origination @filters @boundary @multiSelect`

### CT-11 — Deselect individual + Clear all

- **Type**: E2E
- **Technique**: State transition (TICKED → UNTICKED) + Decision Table (empty-state behavior — OQ-04)
- **Pre-condition**: standard.
- **Steps**:
  1. Tick 3 merchants; apply.
  2. Reopen dropdown; untick 1.
  3. Apply; assert table updated to reflect the 2 remaining.
  4. Reopen; untick remaining 2 (or use "Clear all" if present).
  5. Apply.
  6. Observe table.
- **Expected**:
  - Step 3: rows now only show merchants from the remaining 2.
  - Step 6 (after empty selection): behavior per OQ-04 — `[ASSUNÇÃO]` until resolved: table shows ALL rows (no filter). If observed behavior differs, record as `[OBSERVAÇÃO]` (Rule #10 — conservative classification).
- **Priority**: **P2**
- **Tags**: `@origination @filters @clear @multiSelect`

### CT-12 — Navigation persistence (exploratory)

- **Type**: E2E (exploratory)
- **Technique**: Error Guessing (state-leak across pages)
- **Pre-condition**: standard.
- **Steps**:
  1. On OTB, tick M1+M2 in Merchant filter; apply.
  2. Navigate to Rebate via sidebar (do NOT use browser back).
  3. Observe Rebate's Merchant filter: ticked? empty? defaults?
  4. Navigate back to OTB.
  5. Observe OTB's Merchant filter state.
- **Expected** (`[ASSUNÇÃO]` per OQ-06): selections **do not** persist across pages — each page owns its own filter state (different stores: `domain/stores/lead`, `merchant`, `merchant-setting`, etc.). If observed differently, record as `[OBSERVAÇÃO]`.
- **Priority**: **P2** (exploratory; output feeds OQ-06 resolution)
- **Tags**: `@origination @filters @exploratory @multiSelect`

### CT-13 — Backend request shape (array payload)

- **Type**: E2E with network capture
- **Technique**: Contract observation (AC7 derived)
- **Pre-condition**: one representative page (Leads).
- **Steps**:
  1. Open Network panel via Playwright `page.on('request', ...)` or HAR.
  2. Tick 2 merchants; apply.
  3. Capture outbound request to backend.
- **Expected**: request payload contains `merchantIds` (or equivalent) as **array** of 2 elements, not a comma-joined string or repeated query param semantics that backend doesn't understand. Backend responds 200.
- **Pitfalls**: this is the only CT that asserts directly on the array-aware backend contract. If it fails (single value sent), the UI is broken in the new shared component, not the backend. Record as `[OBSERVAÇÃO]` and pair with CT-09 failure if it occurs.
- **Priority**: **P2**
- **Tags**: `@origination @filters @network @multiSelect`

### CT-14 — Search-within-dropdown (conditional on OQ-02)

- **Type**: E2E
- **Technique**: EP (search hit / no-match / partial match) + BVA (single char, full name)
- **Pre-condition**: OQ-02 confirms search field exists.
- **Steps**:
  1. Open Merchant dropdown.
  2. Type a partial merchant name in the search field.
  3. Observe filtered option list.
  4. Tick filtered result.
  5. Clear search; observe full list returns.
  6. Observe ticked option remained ticked.
- **Expected**: search narrows list; tick state preserved when search cleared.
- **Priority**: **P3** (P2 if OQ-02 confirms widely-used)
- **Tags**: `@origination @filters @search @multiSelect`

### CT-15 — New Application multi-select (conditional on OQ-01)

- **Type**: E2E or smoke-only
- **Pre-condition**: OQ-01 resolved.
- **Steps** (if frontend shipped):
  1. Navigate to New Application.
  2. Tick 2 merchants in any filter.
  3. Apply; verify.
- **Steps** (if frontend deferred):
  1. Navigate to New Application.
  2. Apply a single-value filter (old UI).
  3. Verify page does not 500 and renders rows.
- **Expected**: matches scenario per OQ-01 answer.
- **Priority**: **P3**
- **Tags**: `@origination @filters @newApplication @conditional`

---

## 7. Test data (existing data consumption — no fresh creation)

- **Merchants**: pick 3+ existing in qa2 with diverse names; record their IDs/names in the implementer's data file.
- **Locations**: pick 3+ existing in qa2 with diverse names.
- **Leads**: ensure qa2 has leads across the picked merchants/locations (probe via DB SELECT — read-only, see Security Rules).
- **No application creation**, **no merchant config mutation**, **no preflight** — Rule #12 explicit exception.
- **No DB INSERT/UPDATE/DELETE** — Rule #9, Security Rules.

Suggested probe query (read-only, for implementer to populate the data file):

```sql
-- Probe qa2: find merchants and locations with non-zero lead counts (for filter test data choice)
SELECT m.pk AS merchant_id, m.name AS merchant_name, count(*) AS lead_count
FROM uown_los_lead l
JOIN uown_merchant m ON m.pk = l.merchant_pk
WHERE l.created_time > now() - interval '90 days'
GROUP BY m.pk, m.name
HAVING count(*) > 10
ORDER BY lead_count DESC
LIMIT 10;
```
(Implementer adapts table/column names to actual schema — see `docs/taskTestingUown/database-schema.md`.)

---

## 8. Pitfalls & Domain Reflexes (pre-resolved)

- **Rule #12 — Merchant preflight**: SKIPPED (documented in Section 5). Test does not create applications.
- **Rule #13 — Activity log**: SKIPPED with justification (Section 1 OUT). Filtering is not a business action.
- **Rule #14 — UI-first**: ENFORCED. No API-only CT.
- **Rule #15 — DOM-first**: every selector goes through `mcp__playwright__browser_*` snapshot before being committed to the page object. Checkbox state asserted via `aria-checked`, not visible CSS class.
- **Rule #9 — Test data hierarchy**: existing-data is the correct default here (justified Section 5). No fresh data.
- **Rule #10 — Conservative classification**: any unexpected behavior during exploration (e.g. CT-12 persists state across pages; CT-11 empty=clears table instead of showing all) is `[OBSERVAÇÃO]` or `[HIPÓTESE]`, not `[CONFIRMADO]`. Confirm intent with PO.
- **Rule #11 — Implicit-requirement-to-rule**: if any CT discovers an undocumented requirement (e.g. "must apply Merchant before Location can be enabled"), the fix completes only when added to a domain skill / rule.
- **Viewport ≥ 1440×900**: enforced in browser context config (no need for explicit assertion per CT).
- **Memory `project_dv360_uat_qa1_outage_2026_05_18`**: avoid qa1 for the implementation; default to qa2.
- **Memory `feedback_portal_naming`**: this is Origination (agent portal) — not Website (customer). Avoid mis-labeling.

---

## 9. Test outputs & deliverables

- **Test file location** (implementer): `tests/e2e/origination/multi-select-filters.spec.ts` (canonical location per `test-plan-template`).
- **Page objects** (implementer): one shared `MerchantLocationFilterPO` consumed by 6 page objects (Overview, OTB, Rebate, Leads, Merchant, MerchantSetting). Check `helpers-catalog` and `page-object-pattern` skills for existing filter abstractions BEFORE creating new (Inviolable Rule #2).
- **Helpers**: download interception for CT-09 — check if `helpers-catalog` has a CSV download helper before writing one.
- **Report**: `docs/taskTestingUown/1292-multi-select-filters-origination/1292-multi-select-filters-origination-report.md` (created by `qa-validator`, Rule #7).

---

## 10. Out-of-scope decisions (consolidated)

- New Application page (pending OQ-01)
- Reports / Dashboard / OTB Settings / other adjacent pages not in MR list (per `[ASSUNÇÃO]` OQ-05)
- Mobile / responsive
- Per-role permission matrix (Read-Only agents)
- WCAG accessibility beyond aria-state sanity
- Performance / load
- Activity log (Section 1 OUT)
- Application creation, signing, payment side-effects (not in this feature)

---

## 11. Pipeline status

**Ready for**: `qa-implementer` (after escalation de credenciais)

Status atualizado 2026-05-20 pós-MCP investigation:
- OQ-01..04, OQ-08 RESOLVIDOS (vide §0).
- Usuário: **`manager`** (`DEFAULT_MANAGER_USERNAME`/`DEFAULT_MANAGER_PASSWORD`) cobre todas as 6+ rotas. Bloqueador resolvido.
- CT-00 (Overview smoke), CT-03 (Leads = Overview/bottom na realidade), CT-15→CT-01' (New Application) e CT-09 (CSV) **podem ser implementados imediatamente** com AutotestAgent.
- CT-14 (search-in-dropdown) **DELETAR/REBAIXAR** — search está embutido no combobox (`aria-autocomplete=list`), não há campo separado.

**Selectors recomendados para o page object compartilhado:**

```ts
// MerchantLocationFilterPO — shared
filterButton: 'button.index-module_filterButton__Imptk'  // bottom filter container
merchantCombo: 'input[role="combobox"]'                    // by index ou by adjacent label
optionByText: (txt) => '[id^="react-select-"][id*="option-"]:has-text("' + txt + '")'
optionCheckbox: '[id^="react-select-"][id*="option-"] input[type="checkbox"]'
selectedCountText: '.filter__value-container--is-multi'    // contains "N items selected"
clearAllX: '.filter__clear-indicator'
applyButton: 'button:has-text("Search")'                   // ATENÇÃO: pode haver múltiplos Search; usar role+nth ou container scope
```

**Pitfalls extras descobertos**:
- Clique em opção fecha dropdown — reabrir antes de cada nova marcação no PO.
- `react-select` IDs (`react-select-N-input`) podem variar com a ordem de mount dos selects na página. Não hardcodar — buscar por label/contexto adjacente.
- Texto "N items selected" é a única afirmação possível de count (não há lista de chips para inspecionar). Para checar QUAIS estão marcados, abrir o dropdown e ler `aria-checked`/`.checked` em cada option visible.

---

*Author: qa-planner · 2026-05-20*

---
name: application-lifecycle
description: Carregue quando o teste cria/manipula uma application UOWN (lead -> pre-qualified -> qualified -> leased -> signed). Define os 13+ steps do ciclo, ordem obrigatoria de chamadas, pitfalls conhecidos (merchant config, OTP timing, fraud callbacks).
disable-model-invocation: true
---

# Application Lifecycle Protocol - UOWN Leasing

> **Proposito:** sequencia canonica de chamadas para criar uma aplicacao end-to-end via API + catalogo de pitfalls conhecidos. OBRIGATORIO para qualquer teste/feature que envolva `sendApplication` ou transicoes de estado de lease.
>
> **Por que existe:** cada nova task que cria aplicacao costuma sangrar 20-60 min redescobrindo os mesmos requisitos implicitos. Este arquivo e a memoria institucional que evita isso.
>
> **Quem consulta:** `qa-planner`, `qa-implementer`, `qa-debugger`, `/qa-flow`, e analises diretas.

> **Authority boundary** (fronteira de autoridade — `docs/_docs-conventions.md` §7): esta skill cobre **HOW TO TEST** — canonical sequence, pitfalls catalog, helpers list. O **comportamento canônico do produto** (máquina de estado do lease, enums de `LeadStatus`, regras de UW) NÃO mora aqui — é fonte única em `docs/business-rules/02-originacao-pipeline.md` + `06-conta-ciclo-vida.md` e `src/helpers/api-setup.helpers.ts`. Para resolver um tópico, rode `node scripts/docs-tooling.mjs resolve pipeline` (ou `account-lifecycle`, `underwriting`). Investigações recentes: `docs/knowledge-base/underwriting-and-funding-test-data-paths.md`. **Não duplique regras de produto aqui** — elas driftam.

> Detalhes completos dos steps: [references/canonical-sequence-detail.md](references/canonical-sequence-detail.md)
>
> Catalogo completo de pitfalls (#1 a #137, indice + fatias): [references/pitfalls.md](references/pitfalls.md)

---

## 1. Sequencia canonica (overview)

| # | Chamada | Resultado |
|---|---------|-----------|
| 1 | `buildTestData({ env, state, merchant, orderTotal })` | email unico, SSN aprovado |
| 2 | `api.application.sendApplication(merchant, applicant, order)` | `leadPk`, `leadUuid` |
| 3 | `sleep(5000)` + `getApplicationStatus(merchant, leadUuid)` | status approved |
| 4 | `api.invoice.sendInvoice(merchant, leadUuid, { orderTotal })` | `redirectUrl` |
| 5 | Extrair `shortCode` + `planId` de `redirectUrl` | - |
| 6 | `api.application.getMissingFields(shortCode, { planId })` | seta `merchantProgramPk` |
| 7 | `submitApplication(leadPk, ..., { ccNumber: MASTERCARD_APPROVED })` | CC_AUTH_PASSED |
| 8 | `changeLeadStatus(merchant, leadPk, 'SIGNED')` | SIGNED |
| 9 | `settleApplication(merchant, leadUuid)` | SETTLED |
| 10 | `updateFundingStatus([leadPk], 'FUNDING')` | FUNDING |
| 11 | `updateFundingStatus([leadPk], 'FUNDED')` | FUNDED, cria account |
| 12 | `db.waitForAccountByLeadPk(leadPk)` | accountPk |
| 13 | `db.waitForAccountStatus(accountPk, 'ACTIVE')` | ACTIVE |

**SETTLED_IN_FULL:** steps 14-16 via `makeCreditCardPayments(SETTLEMENT)`.
**Email swap:** steps 17-18 via `createOrUpdateEmail`.

---

## 2. Principios

- **Ordem e inviolavel:** pular steps causa 400/500 silencioso
- **MASTERCARD_APPROVED (BIN 5500) apenas:** VISA causa `UnexpectedRollbackException` (pitfall #3)
- **`getMissingFields` obrigatorio:** sem ele, `submitApplication` retorna 500 (pitfall #2)
- **Email unico por run:** reuso causa `ADDRESS_MISMATCH` denial (pitfall #1)
- **Kornerstone exige bank data:** `mainBankRoutingNumber` + `mainBankAccountNumber` (pitfall #5)
- **SETTLED_IN_FULL via payment real:** UPDATE direto nao popula `uown_sv_payment` (pitfall #9)
- **Merchant preflight automatico:** `createPreQualifiedApplication` chama `ensureMerchantReady` (pitfall #10)
- **`mainNextPayDate` obrigatorio:** pos , campo validado no body (pitfall #63)

---

## 3. Helpers que implementam a sequencia

| Helper | Completo ate | Notas |
|--------|--------------|-------|
| `setupApplicationViaApi` | Passo 7 | Inclui `getMissingFields` |
| `createPreQualifiedApplication` | Passo 7 | Inclui `getMissingFields` + merchant preflight |
| `driveLeadToSigned` | Passo 8 | `changeLeadStatus('SIGNED')` |
| `driveLeadToFunding` | Passo 10 | SIGNED - settle - FUNDING |

---

## 4. Checklist rapido antes de implementar

- [ ] `buildTestData` sem `emailOverride` (pitfall #1)
- [ ] Kornerstone? bankData no `createPreQualifiedApplication` (pitfall #5)
- [ ] `getMissingFields` chamado antes de `submitApplication` (pitfall #2)
- [ ] CC = `MASTERCARD_APPROVED`, NUNCA `VISA_APPROVED` (pitfall #3)
- [ ] Merchant provisionado no LOS do ambiente alvo (pitfall #4)
- [ ] Ordem `SIGNED - settle - FUNDING - FUNDED` (pitfall #6)
- [ ] Email template? `makeCreditCardPayments(SETTLEMENT)` (pitfall #9)
- [ ] Merchant preflight se nao usa `createPreQualifiedApplication` (pitfall #10)
- [ ] Default payment frequency e WEEKLY (pitfall #53); override se necessario

---

## 5. Pitfalls mais criticos (quick reference)

| # | Sintoma | Fix rapido |
|---|---------|------------|
| 1 | DENIED sem motivo | Email unico (sem `emailOverride`) |
| 2 | 500 "Merchant program required" | `getMissingFields` antes |
| 3 | `UnexpectedRollbackException` | MASTERCARD (BIN 5500) |
| 5 | 400 Kornerstone | Adicionar bank data |
| 9 | Sweep falha silenciosamente | `makeCreditCardPayments(SETTLEMENT)` |
| 10 | 400/500 aleatorio | Merchant preflight / config drift |
| 39 | 500 rollback todos merchants | **[env-blocker]** bug svc (mitigado qa1) |
| 48 | Backdrop intercepts clicks | `dismissCustomerInfoConfirmation` |
| 66 | 0 rows em timestamp filter | TZ drift: usar PK monoton. ou AT TIME ZONE |
| 69 | Auth fails apos CT-10 | ensureAuthenticated v8 (JWT exp check) |
| 87 | `sweep_logs.processed=0` em leitura imediata | Assertir `uown_email_queue` (PK monoton.), nao sweep_logs |
| 88 | Sweep nao processa conta "elegivel" | Usar query EXATA do sweep (CASE-WHEN DOW) |
| 89 | FirstPaymentReminder pula conta | Alinhar sched_summary + receivable.due_date |
| 90 | Re-trigger retorna processed=0 | Dedup same-day Java; assertir row de hoje |
| 91 | OTP Website pega codigo de outro run | `snapshotInboxUid` antes + `getVerificationCode({ sinceUid })` |
| 92 | Click sidebar Website intercepted pos-pagamento | `goToSidebarLink` chama `waitForSpinner` antes |
| 98 | Quick search nao navega a partir de /funding (3x retry) | `searchAndSelectFirst` faz `input.click` (foco) antes de fill — dropdown so renderiza com input focado |
| 99 | Sidebar Website "passa" mas update-contact da timeout/spinner infinito | `page.goto` fallback perde auth + `waitForSpinner` engole timeout → pass silencioso. Causa real: força-logout em /documents (OBS-WS-DOCS-LOGOUT) |
| 102 | NeuroID nunca dispara / `count>=1` guard falha (falso-negativo) | `useNeuroIdCheck=true` em `mustBeFalse` → auto-heal reseta. `skipMerchantPreflight:true` + pre-assert read-only da flag |
| 103 | Contagem NeuroID por `uown_sv_outbound_api_log WHERE lead_pk` retorna 0 | Sem correlação `lead_pk` pré-funding (NULLs). Usar `countNeuroIdCalls` (`uown_neuro_id_verification`) |
| 104 | `configColumnsPanel` retorna 0 elementos em `/merchant` | Bootstrap dropdown, não dialog. Usar `configColumnsPanelMerchants` |
| 105 | `label:has-text(...) input[type=checkbox]` não acha coluna em `/merchant` | Checkboxes nativos sem `<label>`; `input[type=checkbox][name="<label>"]` |
| 106 | Wait por Apply/Save após toggle de coluna em `/merchant` nunca resolve | Seleção imediata (BR-01); não há Apply |
| 107 | Filtro Active `/merchant` sem "All"; mudança não re-filtra | react-select `#isActive` (Active/Inactive); aplicar via Search (BR-06) |
| 108 | `/merchantSetting` row timeout — merchant não está nas ~20 rows default | Digitar o código na caixa "Search table" (`msMerchantSearchTableInput`) + aplicar ANTES de selecionar a row; tabela não carrega todos por padrão |
| 109 | ending-in-9 SSN APROVA em qa2 (esperava UW_DENIED) | Short-circuit ending-in-9 é da engine UW MOCKADA; TERRACE_FINANCE em qa2 pode rotear engine real → mock não dispara. Sem trigger UW_DENIED determinístico confirmado em qa2 (≠ qa1) |
| 110 | `#epo5-false`/`#epo10-false` "not visible" em `/merchantSetting` (check timeout) | EPO triple é dropdown `.collapse`: True/False vivem em painel `display:none`. Checar `-main` NÃO revela; clicar o **caret-down** (`#toggler:has(#epoN-main) svg.fa-caret-down`) abre. Depois check SEM `force:true` |
| 111 | Último sub-test de `describe.serial` falha com `"context"/"page"/"testEnv" fixtures are not supported in afterAll` + teardown não executa (drift vaza) | `afterAll` só aceita fixtures **worker-scoped**. `db` é worker (OK); `page`/`context`/`testEnv` são test-scoped (PROIBIDO). Usar `{ browser, db }` e criar o próprio `browser.newContext()`; derivar env via `new ConfigEnvironment(process.env.ENV)` |
| 112 | Merchant-settings snapshot não em `lead_notes` / account snapshot não reflete merchant vivo | Lead snapshot no `ApplicationApprovedEvent` (só APROVADAS); account snapshot **copia** o lead (não re-lê merchant), gated na existência do lead snapshot (ausente → conta criada, snapshot pulado silenciosamente). Audit = logs INFO/WARN da app, **NÃO `uown_los_lead_notes`**. Tabelas `uown_los_lead_merchant_settings_snapshot`/`uown_sv_account_merchant_settings_snapshot` (`epo5,epo10,uw_pipeline,fraud_threshold`). Escopo audit/reporting only |
| 113 | qa2 fail-fast no 1º read DB (`assertMerchantContract`) | Tunnel qa2 `127.0.0.1:5445` cai mid-run / `svc_user` rejeita transitoriamente. **Infra, não drift de contrato nem feature** — re-probar DB e re-rodar (≈ #18) |
| 115 | Overview: `nth()` em input de data acerta o form ERRADO (KPI vs tabela) | Overview tem 2 forms: top-bar KPI (`#from`/`#to`, toggle `overview_filterButton__`, drives cards) vs TABLE panel (`#fromDate`/`#toDate`, toggle `index-module_filterButton__`, drives tabela+CSV). Alvejar table-panel por **id**, nunca posicional. Ver [[selector-hardening]] |
| 116 | Overview: janela de data future-only NÃO esvazia a tabela | `#fromDate` (table panel) **reseta para hoje** (Formik default) → não é lever de empty-set confiável. Usar `searchTable(value)` com valor não-existente (free-text "Search table" `overviewTableSearch`) |
| 117 | Overview: painel de table-filter re-colapsa logo após o toggle | `verifyDashboardLoaded` retorna no Promise.race quando o botão Filters aparece, ANTES da tabela carregar em QA2; painel é width-collapse animation → re-render re-colapsa. `expandTableFilters` precisa de **retry loop**, não 1 clique |
| 118 | "Download CSV" abre o modal de EMAIL (clica o botão errado) | Email CSV e Download CSV compartilham `filtered-csv-download_csvButton`; Email é 1º no DOM → class nua + `.first()` resolve Email. Desambiguar Download por `:has-text('Download CSV')`. Ver [[selector-hardening]] / [[page-object-pattern]] |
| 119 | Leads CSV 17ª coluna "Created from" exporta header EM BRANCO | **[OBSERVAÇÃO]** `createdFrom` — entry react-csv sem `label`. Pré-existente, product-side; flag p/ ticket separado. NÃO é bug do teste (OBS-01 #1321) |
| 120 | Origination "Download CSV" ausente para certos usuários — qual permissão controla? | Gate = AMS → **Roles → aba Origination** → clicar role → "Edit Role Permissions" (chips = perms CONCEDIDAS; ausente ⇒ role não tem). Perms: `overview download csv` → `/overview`; `leads download csv` → `/leads`. **TÊM perm:** `admin`, `manager`. **NÃO têm:** `agent`, `isr`, `auditor`. NÃO confundir com `overview csv [modify]` (governa config de filtro/coluna, não o botão). `email csv` é independente — Email CSV renderiza sempre que tabela não está vazia. Conta candidate sem perm: `evedovatto.gow_clone` (role `agent`, sandbox, password desconhecida). Recipe CT-09: AMS → Add User com role `agent`/`isr` → login no Origination → confirmar Download CSV ausente. (sandbox 2026-06-18, #1321 / MR !1481) |
| 121 | Location filter "not visible"/disabled em `/merchantModificationHistory` e `/modificationReport` mesmo com a página carregada | **Divergência intra-componente** — em MMH e ModReport o Location recebe `filter__control--is-disabled` até ≥1 Merchant ser selecionado (BR-01). No **Funding Queue** (`/funding`) Location é INDEPENDENTE (não disabled, BR-02). Testes de Location em MMH/ModReport DEVEM selecionar Merchant primeiro; não copiar o assumption do Funding. (qa2 2026-06-18, #1319 — `[CONFIRMADO]` via MCP DOM) |
| 122 | Funding Queue retorna só leads FUNDING ao filtrar por Funded/Refunded | Status filter tem **"Funding" PRÉ-SELECIONADO** ao carregar `/funding` (BR-03). Quem usa `selectOptions('Status', ...)` direto soma ao default e o resultado fica contaminado. `FundingPage.filterByStatuses()` chama `clearStatusFilter` antes — usar o método, não o `selectOptions` cru. (qa2 2026-06-18, #1319 — `[CONFIRMADO]` via MCP DOM) |
| 123 | Overview TABLE-panel `#fromDate`/`#toDate` ignoram `fill()` — Formik não atualiza | Inputs são `type="search"`. `fill()` seta DOM mas NÃO dispara `onChange` do Formik → query submitted usa valor anterior. Fix: acessar `element.__reactProps.onChange` via `page.evaluate`, com `setTimeout(150ms)` entre fromDate e toDate (re-render do fromDate recria o nó toDate). Adicionalmente: `submitFilters()` detecta `<tr>` do spinner como "row visible" em datasets grandes (79k rows) — usar `page.waitForFunction` aguardando paginação `>1000` antes de checar estado de botões. Tooltip do guard é portal Bootstrap (`div[role='tooltip'].tooltip.show`), não texto interno do span wrapper. (sandbox 2026-06-18, #1321) |
| 124 | Origination "Set to Expired" confirm clica nada — modal abre mas `changeLeadStatus` nunca dispara (lead não expira) | A ação abre o modal **"Add a Comment"** dentro de `.modal.fade.show` (`role="dialog"`). O botão de confirmar é **"Save"** (`button[type='submit']`) — NÃO "CONFIRM"/"Yes" e SEM classe `.submit-button`. Campo comment (`input[name='comment']`, placeholder "Type here...") é **OPCIONAL** (Save fica habilitado vazio), mas o texto digitado VAI para o activity log (`uown_los_activity_log.notes` = "ChangeLeadStatus requested from X to EXPIRED. Reason : {comment}"). Selector antigo (`CONFIRM`/`Yes`/`.submit-button`) casava 0 elementos; a espera de visibilidade tinha `.catch(()=>false)` → falha silenciosa, método retornava sem clicar. Fix: `setToExpiredConfirm` ancora em `button[type='submit']`+`Save`; método preenche o comment opcional e remove o swallow. **NÃO confundir** com o "Move Contract to Signed" modal (CT-02), que tem comment OBRIGATÓRIO e botão CONFIRM. (qa2 lead 16728, 2026-06-18, #1315 — `[CONFIRMADO]` via DOM live + XHR 200 + status UW_APPROVED→EXPIRED + `uown_lead_modifications.mod_type=LEAD_STATUS_CHANGE`. Ver [[selector-hardening]]) |
| 125 | Modification Report (`/modificationReport`) filtra e a tabela volta com o set inteiro (filtro ignorado), OU a linha do lead recém-criado "não aparece" | Dois requisitos implícitos do painel de filtros: **(a)** os campos `input#agentName`, `input#from`, `input#to` são **React/Formik-controlled** — `page.fill()` é **no-op silencioso** (sem `TimeoutError`); o `onChange` nunca dispara e a busca roda com o campo vazio. Setar via native-setter (`forceReactInputValue`): prototype value setter + `input`/`change`/`blur`. Datas em `MM/DD/YYYY`. **(b)** a tabela é **rdt paginada em 10 linhas/página** — `getRowByLeadPk` DEVE caminhar as páginas (`goToNextPage` até Next desabilitar); um `getAllRows().find(...)` de página única perde silenciosamente o lead em page 2+. `filterByAgentName`/`filterByDateRange`/`getRowByLeadPk` já encapsulam ambos. (qa2 `jmendes.gow`, 2026-06-18, #1315 — `[CONFIRMADO]` via DOM live, CT-03/CT-04 PASS. Ver [[selector-hardening]] "React-controlled date/text input" + [[page-object-pattern]] catálogo `ModificationReportPage`) |

> Catalogo completo (132 pitfalls, #1–#137) + observacoes cross-cutting: [references/pitfalls.md](references/pitfalls.md) — indice navegavel; conteudo fatiado em [references/pitfalls/](references/pitfalls/) (cada fatia cabe numa leitura `Read`).

---

## 6. Contribution Template

Per CLAUDE.md rule #12, quando um agent descobre requisito implicito NAO documentado, e **obrigacao** adiciona-lo ao catalogo (via [references/pitfalls.md](references/pitfalls.md)) antes de fechar o pipeline.

### Passo-a-passo

1. Identificar sintoma exato (copy-paste da mensagem de erro)
2. Adicionar a linha na **ultima fatia** em [references/pitfalls/](references/pitfalls/) usando o **proximo numero global** (maior atual + 1); se a fatia ja estiver > ~50 KB, criar a proxima `NN-pitfalls-LLL-HHH.md`
3. Acrescentar a linha-indice correspondente em [references/pitfalls.md](references/pitfalls.md) (numero + sintoma + fatia)
4. Se o fix exige mudanca na sequencia: anotar inline com `**[pitfall #N]**`
5. Se exige helper novo: atualizar secao 3 Helpers acima
6. Incluir referencia de descoberta (task/pipeline/data)

### Nao documentar aqui

- Bugs de aplicacao reais (vao para relatorio com tag `[CONFIRMADO]`)
- Test bugs (corrigir o teste, nao documentar como pitfall)
- Ambiente inacessivel transitoriamente (timeout, VPN) - e flaky, nao pitfall

---

## 7. Referencias cruzadas

- Modalidades 13m / 13m+16m / 16m Second Look: [[ssn-test-modalities]]
- Risk tiers + state-specific rules: `docs/business-rules/appendix-g-cenarios-risco.md`
- Test bank constants: `src/config/constants.ts` - `TEST_BANK.DEFAULT_ROUTING` / `DEFAULT_ACCOUNT`
- Test cards: `src/data/test-cards.ts` - use `MASTERCARD_APPROVED` (BIN 5500)
- Payment arrangement patterns: `test-patterns-arrangements.md`
- Test Data Hierarchy: `../../rules/testing.md`
- Brand coverage (UOWN + Kornerstone): [[ssn-test-modalities]] secao 7

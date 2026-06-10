# SPEC: multiStateSigningRegression

> **Resumo (PT-BR):** Suite paralela de regressão de assinatura cobrindo todos os 47 estados US permitidos pelo UOWN em qa2. Cada teste cria fresh lead, dirige até `CONTRACT_CREATED`, verifica que o provedor real (`uown_esign_document.esign_client`) bate com o esperado pela matriz estado→provedor, valida header do PDF (`CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}`), nome do LESSOR (Mollie vs KW-Choice Alaska), nota auto-gerada em `uown_los_lead_notes`, e load do iframe via page object provider-agnóstico. Quatro estados bloqueados (NJ, VT, MN, ME) viram CTs negativos — `stateCheck` denial, sem `uown_esign_document`. **Realidade qa2 (2026-04-28):** somente CA tem template GowSign distribuído; 46 dos 47 estados permitidos caem no fallback SignWell. A matriz é a única coisa que muda quando produto distribuir mais templates — os testes ficam.

## Task Origin

| Campo | Valor |
|------|-------|
| Milestone | (interno — sem GitLab issue, demanda do standup 2026-04-28) |
| Task | Multi-state signing regression (47 allowed states) for GowSign rollout |
| Number | n/a (interno) |
| Source | StandUp - UOWN (26) — SK reforçou que rollout GowSign exige regressão SignWell completa por causa do refactor; GowSign pode acabar servindo só CA |
| Standardized Name | `multiStateSigningRegression` |
| File Name | `tests/e2e/signing-regression/multi-state-signing.spec.ts` |
| Suite Name | `multiStateSigningRegression` |

## User Story Mapping

> Source: `docs/user-stories/jornada-completa-lease.md` + `docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md`

| Field | Value |
|-------|-------|
| US ID(s) | US-CUT-01 (`esign_client` populado), US-CUT-02 (coexistência multi-provedor sem cross-talk), US-DOC-03 (LESSOR name por estado), US-DOC-10.1 (header `CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}` por estado), US-EMB-01 (iframe load auto-detect), US-LSE-* (logs auto-gerados em `uown_los_lead_notes`); cobertura tangencial de Originação (denial em `stateCheck` para NJ/VT/MN/ME) |
| Phase | Origination (post-UW, pre-signed) — fluxo cobre `UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED` para 47 happy-path rows e `PENDING_UW → DENIED` para 4 blocked-state rows |
| Persona | Cliente (C) acessa link do contrato; Backend (B) cria documento via provedor; Sistema GowSign/SignWell (G) processa |
| User Flow | Aplicação criada via API (sendApplication) → submit/CC auth (`submitApplication`) → CONTRACT_CREATED dispara criação de e-sign → cliente abre link/`paymentDetailsList[idx].redirectUrl` → iframe do provedor carrega → validações DB+UI executadas SEM completar a assinatura (escopo é roteamento + render do contrato, não signing happy path completo — esse já é coberto por `tests/e2e/gowsign/gowsign-signing-completion.spec.ts` em CA) |
| Lease Risks Addressed | R-Compliance: contrato com header errado de estado viola UETA/ESIGN regulatory mapping (US-DOC-10.1); R-Compliance: LESSOR errado para AK invalida contrato (KW-Choice tem licença local, Mollie não — US-DOC-03); R-Operacional: cross-talk entre provedores (US-CUT-02) corrompe auditoria; R-Fraude/Revenue: estado bloqueado (NJ/VT/MN/ME) NÃO pode gerar `uown_esign_document` — se gerar, há vazamento regulatório; R-Operacional: rollout do refactor GowSign pode ter quebrado SignWell silenciosamente nos 46 estados que hoje caem no fallback |
| Risk Coverage in CTs | SR-GOWSIGN (CA): R-Compliance (header CA + GOWSIGN client). SR-SIGNWELL × 45 não-AK: R-Operacional (regressão SignWell pós-refactor) + R-Compliance (header correto). SR-SIGNWELL-AK: R-Compliance (LESSOR=KW-Choice). SR-BLOCKED × 4: R-Fraude/Revenue (no esign_document quando state bloqueado) + R-Compliance (rejeição em `uown_los_lead_notes`) |

## Preconditions

| Item | Detail |
|------|--------|
| Environment | qa2 (sandbox tier não usado; matriz de templates GowSign é específica de qa2) |
| Auth | API auth via `BaseClient` (test data factory já gerencia) — sem login UI pré-existente |
| Test data file | `tests/e2e/signing-regression/multi-state-matrix.ts` (criado pela Task #2 — NÃO faz parte deste SPEC, listado em "Artifact Dependencies") |
| Page object | `src/pages/website/SigningPageDetector.ts` (criado pela Task #3 — NÃO faz parte deste SPEC) com métodos `waitForLoaded()`, `getDetectedProvider(): 'GOWSIGN' \| 'SIGNWELL' \| 'PANDADOC'`, `getStatusBadge()` |
| Merchant config | `merchant-config-contract.ts` deve ter ao menos um merchant que (a) atende todos 47 estados, (b) tem `esign_client = 'SIGNWELL'` no fallback, (c) tem programa 13m apenas (escopo deste SPEC é signing regression — modalidade fica fora). TerraceFinance é candidato natural; matrix data file decide merchant por estado conforme cobertura disponível |
| Database | qa2 reachable via `db` fixture; queries são SELECT-only (Inviolable Rule #10 — sem UPDATE direto) |
| State universe | 50 US states + DC. UOWN trata só os 50 estados (DC não é servido). Confirmado em scan do codebase: `STATE_LIST` em `src/data/` e `merchant-config-contract.ts` listam os 50 estados nominais; DC fica fora do escopo |

> **Decisão sobre DC:** após confirmar com codebase (TASK #2 deliverable), se DC aparecer em alguma config, vira 51ª linha = SR-BLOCKED com justificativa "UOWN não opera em DC". Default deste SPEC: DC NÃO é incluído na matriz.

## Test Data Hierarchy Compliance (Inviolable Rule #10)

| Aspecto | Decisão |
|---------|---------|
| Origem do lead/account | **CRIADO via automação** em todo CT — `setupApplicationViaApi` ou `createPreQualifiedApplication` com `runId` + `email` únicos por linha |
| Reuso de dados existentes | **PROIBIDO** — não há justificativa para reuso em regressão de signing (cada teste é independente, fluxo cabe em < 90s por linha) |
| Mutação direta DB | **PROIBIDA** (Inviolable Rule #10 + CLAUDE.md Exception 3). Todas as queries DB são SELECT |
| `runId` / `email` | Únicos por linha da matriz (`generateRunId()` + `generateUniqueEmail()` por iteração `forEach`) |
| Cleanup | Implícito via unique data — sem teardown manual |

## Steps (per CT — same skeleton, parameterized by matrix row)

### Skeleton compartilhado (SR-GOWSIGN e SR-SIGNWELL)

| # | test.step label | Action | Layer | Validation | Timeout |
|---|----------------|--------|-------|-----------|---------|
| 1 | `API: pre-qualifies lead with {merchant} state={state}` | API: `setupApplicationViaApi({ env: 'qa2', state, merchant, orderTotal: '1000' })` → encadeia `sendApplication` + `submitApplication` + `getMissingFields` + lead drive até `CONTRACT_CREATED` | API (preconditions) | Response: lead.shortCode válido, `paymentDetailsList[idx].redirectUrl` retornado. DB: `uown_los_lead.status = 'CONTRACT_CREATED'`, `uown_los_lead.state = {state}` | 90s |
| 2 | `DB: assert esign_document created with expected provider` | Query: `SELECT esign_client, esign_mode, document_key FROM uown_esign_document WHERE pk = (SELECT esign_document_pk FROM uown_los_contract WHERE lead_pk = $leadPk)` | DB | `esign_client === row.expectedProvider`; `esign_mode IN ('DOCX','HTML','STRAPI','EMAIL')`; `document_key` matches UUID v4 regex when `expectedProvider==='GOWSIGN'` | 5s |
| 3 | `DB: assert FK consistency uown_los_contract.esign_document_pk → uown_esign_document.pk` | Query JOIN: `c.esign_document_pk = d.pk` | DB | rowcount === 1; FK match exato | 5s |
| 4 | `DB: assert lead note auto-generated [reflex]` | `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = $1 AND notes LIKE '%Sent Contract to customer. Contract EsignDocPk : ' || $2 || '%' ORDER BY pk DESC` | DB | rowcount ≥ 1; nota contém substring `EsignMode : ` (DOCX\|HTML\|EMAIL) — invariante US-LSE; reflexo do bloco "12. Geração de Documento" + "11. Qualquer Mutation" do catálogo qa-domain-reflexes | 5s |
| 5 | `UI: navigate to redirectUrl and wait for signing iframe` | `await page.goto(contractUrl); await detector.waitForLoaded()` | UI | `detector.getDetectedProvider() === row.expectedProvider`; iframe é o provider correto (sem cross-talk — US-CUT-02) | 60s |
| 6 | `UI/PDF: assert document header text "CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}"` | Localizar header do contrato dentro do iframe (page object expõe `getDocumentHeaderText()`) | UI (renders state-specific PDF) | `headerText === 'CONSUMER LEASE-PURCHASE AGREEMENT-' + row.state` (US-DOC-10.1) | 30s |
| 7 | `UI/PDF: assert LESSOR name matches matrix entry` | Page object expõe `getLessorName()` | UI | `lessorName === row.lessor` (Mollie ou KW-Choice — US-DOC-03) | 15s |
| 8 | `[reflex] DB: audit trail (Geração de Documento)` | Verificar `uown_esign_document.row_created_timestamp >= lead.row_created_timestamp` (timestamp monotônico, US-LSE invariant) | DB | timestamp coerente; `esign_client` não-null | 3s |
| 9 | `[reflex] no cross-talk: events log only references our doc_pk` | `SELECT COUNT(*) FROM uown_esign_event_trigger_log WHERE lead_pk = $1 AND esign_doc_pk != $expectedDocPk` | DB | count === 0 (US-CUT-02 — coexistência sem cross-talk) | 3s |

### Skeleton para SR-BLOCKED (NJ, VT, MN, ME)

| # | test.step label | Action | Layer | Validation | Timeout |
|---|----------------|--------|-------|-----------|---------|
| 1 | `API: sendApplication with blocked state {state} expects denial` | API: `sendApplication` com state bloqueado | API | Response retorna decision = `DENIED` (ou status `UW_DENIED` no lead após pipeline); HTTP pode ser 200 com payload de denial — confirmar contrato real durante implementação (Task #4) | 60s |
| 2 | `DB: assert no uown_esign_document was created` | `SELECT COUNT(*) FROM uown_esign_document d JOIN uown_los_contract c ON c.esign_document_pk = d.pk WHERE c.lead_pk = $leadPk` | DB | count === 0 (estado bloqueado NÃO gera esign_document — invariante regulatória crítica) | 5s |
| 3 | `DB: assert lead note records stateCheck rejection [reflex]` | `SELECT notes FROM uown_los_lead_notes WHERE lead_pk = $1 AND (notes ILIKE '%stateCheck%' OR notes ILIKE '%state not allowed%' OR notes ILIKE '%no business in state%') ORDER BY pk` | DB | rowcount ≥ 1; substring exata a confirmar via lease log inspection (regra `.claude/rules/testing.md § Debug de Erro/Divergência`) — capturar substring real durante smoke (Task #5) e congelar no test data file | 5s |
| 4 | `[reflex] decision audit (Credit Application / Origination)` | `SELECT status FROM uown_los_lead WHERE pk = $leadPk` | DB | status = `'UW_DENIED'` ou `'DENIED'` (confirmar contrato exato no smoke); reason code persistido em `uown_los_lead_notes` (compliance ECOA/FCRA — bloco "4. Credit Application" do catálogo) | 3s |

## State Matrix (50 states, 0 DC)

> **Coluna `validMerchantSuggestion`:** sugestão inicial baseada em conhecimento do `merchant-config-contract.ts` (TerraceFinance é multi-state, ONLINE; KS3015/Kornerstone é multi-state KS). A Task #2 (data file) deve confirmar quais merchants efetivamente cobrem cada estado em qa2 e ajustar — algumas células podem precisar trocar para outro merchant ONLINE. Para AK e estados pouco comuns, validar com codebase scan antes de commitar a matriz.
>
> **Coluna `expectedProvider`:** reflete a realidade qa2 em 2026-04-28. Quando produto distribuir mais templates GowSign, **só essa coluna muda** — os 9 steps acima permanecem.

| # | State | Code | Bucket | expectedProvider | lessor | validMerchantSuggestion |
|--|-------|------|--------|------------------|--------|--------------------------|
| 1 | Alabama | AL | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 2 | Alaska | AK | SR-SIGNWELL | SIGNWELL | **KW-Choice Alaska LLC** | TerraceFinance (confirmar cobertura AK) |
| 3 | Arizona | AZ | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 4 | Arkansas | AR | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 5 | California | CA | **SR-GOWSIGN** | **GOWSIGN** | Mollie, LLC, dba Uown | TerraceFinance ou TireAgent (OW90218-0001) |
| 6 | Colorado | CO | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 7 | Connecticut | CT | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 8 | Delaware | DE | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (DE: tax=0, EPO state-specific) |
| 9 | Florida | FL | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 10 | Georgia | GA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 11 | Hawaii | HI | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (HI: EPO state-specific) |
| 12 | Idaho | ID | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 13 | Illinois | IL | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 14 | Indiana | IN | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 15 | Iowa | IA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 16 | Kansas | KS | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 17 | Kentucky | KY | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 18 | Louisiana | LA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 19 | Maine | ME | **SR-BLOCKED** | null (no document) | n/a | — (denial expected) |
| 20 | Maryland | MD | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 21 | Massachusetts | MA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 22 | Michigan | MI | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 23 | Minnesota | MN | **SR-BLOCKED** | null (no document) | n/a | — (denial expected) |
| 24 | Mississippi | MS | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 25 | Missouri | MO | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 26 | Montana | MT | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (MT: tax=0) |
| 27 | Nebraska | NE | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 28 | Nevada | NV | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 29 | New Hampshire | NH | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (NH: tax=0) |
| 30 | New Jersey | NJ | **SR-BLOCKED** | null (no document) | n/a | — (denial expected) |
| 31 | New Mexico | NM | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 32 | New York | NY | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (NY: EPO state-specific) |
| 33 | North Carolina | NC | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (NC: last payment ≥ 11% baseCost) |
| 34 | North Dakota | ND | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 35 | Ohio | OH | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 36 | Oklahoma | OK | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 37 | Oregon | OR | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (OR: tax=0) |
| 38 | Pennsylvania | PA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 39 | Rhode Island | RI | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 40 | South Carolina | SC | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 41 | South Dakota | SD | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 42 | Tennessee | TN | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 43 | Texas | TX | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 44 | Utah | UT | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 45 | Vermont | VT | **SR-BLOCKED** | null (no document) | n/a | — (denial expected) |
| 46 | Virginia | VA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 47 | Washington | WA | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 48 | West Virginia | WV | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance (WV: EPO state-specific) |
| 49 | Wisconsin | WI | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |
| 50 | Wyoming | WY | SR-SIGNWELL | SIGNWELL | Mollie, LLC, dba Uown | TerraceFinance |

**Distribution:**
- SR-GOWSIGN: 1 row (CA)
- SR-SIGNWELL: 45 rows (everyone except CA, NJ, VT, MN, ME and not counting AK lessor variant separately) + AK as 46th = **46 rows total**
- SR-BLOCKED: 4 rows (NJ, VT, MN, ME)
- **Total: 51 happy-path-or-blocked rows = 47 non-blocked + 4 blocked. DC excluded.**

> **Quando produto distribuir mais templates GowSign:** alterar a coluna `expectedProvider` na linha do estado afetado. Os steps + assertions ficam idênticos.

## Risk Tier Decision

> Aplicado por linha da matriz. Resumo abaixo; o data file (Task #2) materializa por estado.

| Field | Choice | Reason |
|-------|--------|--------|
| riskTier (SR-GOWSIGN, SR-SIGNWELL) | low | SSN não termina em 9 → APPROVED; merchandise $1000 dentro do range low (Appendix G) |
| riskTier (SR-BLOCKED) | blocked-state | NJ, VT, MN, ME → DENIED via stateCheck (Appendix G § blocked-state) |
| SSN strategy | `generateTestSSN(true)` em todas as 51 linhas | Goal é APPROVED em 47 e BLOCKED-via-state nos 4 (não denied-via-SSN); SSN ending in 9 confunde com state denial |
| State | um por linha (column `state` do data file) | Cobertura exaustiva é o ponto |
| Merchant | TerraceFinance default; data file ajusta se merchant-config-contract revelar gaps | TerraceFinance é multi-state, ONLINE, esign_client=SIGNWELL no fallback. CA pode usar TireAgent (OW90218-0001) — empiricamente confirmado para GOWSIGN |
| Cart value | $1000 fixo | Dentro do PTI low; sem efeito em routing de signing; reduz variáveis ​​durante regressão |

**State-specific rules a validar (já cobertos por header `CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}` US-DOC-10.1):**
- AK: lessor difere → **smoke obrigatório** para esse caso (ver "Smoke Subset")
- CA, NY, HI, WV: EPO formula state-specific (não asserted neste SPEC — escopo é signing routing/render, não EPO; mantido aqui só como nota para evitar false positives)
- OR, AK, DE, MT, NH: tax=0 (idem nota — não assert aqui)
- NC: last payment ≥ 11% baseCost (idem)

## testData

```typescript
// Importa de tests/e2e/signing-regression/multi-state-matrix.ts (Task #2 deliverable)
// Cada row é gerada pelo data file. Exemplo de uma row:
//
// {
//   env: 'qa2',
//   state: 'CA',
//   stateCode: 'CA',
//   bucket: 'SR-GOWSIGN',           // 'SR-GOWSIGN' | 'SR-SIGNWELL' | 'SR-BLOCKED'
//   expectedProvider: 'GOWSIGN',    // 'GOWSIGN' | 'SIGNWELL' | null (blocked)
//   expectedLessor: 'Mollie, LLC, dba Uown',  // ou 'KW-Choice Alaska LLC' p/ AK
//   merchant: 'TerraceFinance',
//   merchantRefCode: 'TFD-OW-001',  // confirmar no data file
//   orderTotal: '1000',
//   riskTier: 'low',                // 'low' | 'blocked-state'
//   runId: generateRunId(),         // unique per row, generated at test time
//   email: generateUniqueEmail(),   // unique per row
//   tag: '@regression @signing-regression @multi-state @hybrid @qa2',
// }
//
// Estrutura final do file: export const MULTI_STATE_SIGNING_MATRIX: MatrixRow[] = [...51 rows]
```

**Nota de geração:** `runId` e `email` são gerados **no momento da execução do teste**, não na construção do matrix data file estático. Isso evita que o matrix file pré-determine valores que ficariam stale entre runs (Inviolable Rule #10 — fresh data por execução).

## Artifact Dependencies

| Type | Name | Status |
|------|------|--------|
| Page Object | `SigningPageDetector` (em `src/pages/website/SigningPageDetector.ts`) com `waitForLoaded()`, `getDetectedProvider()`, `getStatusBadge()`, `getDocumentHeaderText()`, `getLessorName()` | **To create — Task #3** |
| Data file | `tests/e2e/signing-regression/multi-state-matrix.ts` exporta `MULTI_STATE_SIGNING_MATRIX: MatrixRow[]` (51 rows) e `type MatrixRow` | **To create — Task #2** |
| API Helper | `setupApplicationViaApi` (em helpers) | Exists — confirmar interface aceita `state` e `merchant` |
| API Helper | `createPreQualifiedApplication` | Exists |
| Helper | `buildTestData` | Exists |
| Helper | `generateRunId`, `generateUniqueEmail` | Exists |
| Test file | `tests/e2e/signing-regression/multi-state-signing.spec.ts` | **To create — Task #4 (subagent-impl-e2e)** |
| DB queries | Inline no spec test (SELECT-only) usando `db.getSingleRow` / `db.getRows` | Exists |

## Source Code References

| Source | File | Key findings |
|--------|------|-------------|
| Routing rule | `.claude/rules/testing.md § E-sign Provider Routing — Por Disponibilidade de Template` | Provider depende de template per-state em qa2; só CA tem template hoje |
| Existing skip evidence | `tests/e2e/gowsign/gowsign-signing-completion.spec.ts:1023-1031` | CO routes to SIGNWELL (lead 15747); CA routes to GOWSIGN (leads 15741+) |
| US source for header | `docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md § US-DOC-10.1` | Header format `CONSUMER LEASE-PURCHASE AGREEMENT-{STATE}` |
| US source for lessor | `docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md § US-DOC-03` | Mollie default; KW-Choice Alaska LLC para AK |
| US source for esign_client | `docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md § US-CUT-01, US-CUT-02` | `esign_client` enum + cross-talk isolation |
| Lead notes pattern | `docs/taskTestingUown/gowsign_integration/gowsign-integration-user-stories.md § Padrão Comum: Validação de Log no Lease` | Substring exato `Sent Contract to customer. Contract EsignDocPk : {N}` |
| Application lifecycle | `.claude/context/shared/application-lifecycle-protocol.md` | Sequência canônica `sendApplication` → `submitApplication` → `getMissingFields` → CONTRACT_CREATED |
| QA reflexes | `.claude/context/shared/qa-domain-reflexes.md § 4 (Credit App), § 11 (Mutation), § 12 (Documento)` | Aplicáveis nas 51 linhas |

## Edge Cases

- **AK lessor variant:** AK é a única linha SR-SIGNWELL onde `expectedLessor !== 'Mollie, LLC, dba Uown'`. **MUST** ser parte do smoke (Task #5) para detectar regressão de configuração de lessor antes de rodar a suite completa
- **CA + qa2-only routing:** se algum dia a equipe distribuir GowSign template para outro estado em qa2, a matriz fica stale e a primeira linha SR-SIGNWELL afetada vai falhar com "expected SIGNWELL got GOWSIGN". Isso é **feature, não bug** — sinaliza que a matriz precisa atualizar. Mensagem de erro do test deve ser explícita: `expectedProvider mismatch — likely product distributed a new template for {state}; update multi-state-matrix.ts`
- **Blocked state denial substring:** o log exato em `uown_los_lead_notes` para NJ/VT/MN/ME ainda não está confirmado. Capturar durante smoke (Task #5) e congelar substring exato no data file
- **Webhook race:** depois de criar o e-sign document, eventos de webhook podem chegar entre os steps 5 e 9 e poluir `uown_esign_event_trigger_log`. O assert do step 9 (`COUNT esign_doc_pk != $expectedDocPk = 0`) é o que importa — eventos do nosso doc podem existir, eventos de outros docs não. Não usar `COUNT(*) = 0`
- **Sharding e ordem:** linhas SR-BLOCKED podem rodar em qualquer shard; SR-GOWSIGN (CA) deve idealmente rodar primeiro num shard dedicado para ter feedback rápido se GowSign quebrou
- **Buddy widget loop em qa2:** `.claude/rules/testing.md § Buddy Insurance Widget` — alguns merchants em qa2 disparam loop CORS do Buddy. Como este SPEC usa TerraceFinance (sem Buddy widget no fluxo padrão de application sem PP) e não testa Protection Plan, não deve ser afetado. Se Task #4 detectar regressão por causa disso, marcar `@flaky-tracked` na linha específica
- **Iframe load timeout em qa2:** SignWell iframes podem demorar mais que GowSign. Step 5 timeout = 60s para abranger o pior caso
- **Merchant cobertura per-state:** se TerraceFinance não cobre AK ou outro estado pequeno em qa2, Task #2 deve trocar para outro merchant ONLINE que cubra. **Open question for orchestrator** — ver final do SPEC

## Estimated Timeout

- **Per CT (SR-GOWSIGN ou SR-SIGNWELL):** ~3 min (90s setup + 60s navigation + 30s header check + 15s lessor check + ~5s × 5 DB checks = ~200s + buffer = 180s, arredondado **300_000ms / 5 min** com folga para retry de iframe)
- **Per CT (SR-BLOCKED):** ~2 min (60s denial + DB asserts) → **120_000ms / 2 min**
- **Suite total (sequencial):** 47 × 3 min + 4 × 2 min = ~149 min ≈ **2h30**
- **Com sharding** (estratégia abaixo): 8 shards × workers=4 → ~5 min de wall-clock para a suite

## Sharding Strategy

| Mecanismo | Decisão |
|-----------|---------|
| Playwright workers | `workers: 4` por shard (testes são independentes — Inviolable Rule #1 garante isolamento) |
| Playwright shards | `--shard=N/8` × 8 shards = 64 paralelos (4 workers × 8 jobs) |
| Distribuição | Default (`shard` Playwright divide em buckets contíguos) é OK; a matriz não tem ordering dependency |
| CA (SR-GOWSIGN) | Não isolar em shard próprio — rota normal; se quiser feedback rápido, rodar smoke (Task #5) antes da suite full |
| SR-BLOCKED | Pode misturar com SR-SIGNWELL (cargas diferentes — denial é mais rápido) |
| CI integration | Nightly job (não @smoke) — `@regression @signing-regression @multi-state @qa2` |
| Reporting | Playwright HTML report consolida shards via `merge-reports`; relatório agregado bate `tests planned: 51, passed: X, failed: Y` |

## Smoke Subset (Task #5 validation)

**4 representative rows** para validação end-to-end da pipeline (data file + page object + spec) antes de habilitar os 51:

| Row | State | Bucket | Why this row |
|-----|-------|--------|-------------|
| 1 | CA | SR-GOWSIGN | Único path GOWSIGN em qa2 — valida que o detector reconhece GowSign + header CA + Mollie lessor |
| 2 | CO | SR-SIGNWELL | Caminho SignWell mais comum (default), Mollie lessor — sanity check do fallback |
| 3 | AK | SR-SIGNWELL | **Lessor variant** — única linha onde lessor != Mollie. Critical para detectar regressão de config Alaska antes de rodar full suite |
| 4 | NJ | SR-BLOCKED | Caminho denial — valida que stateCheck rejeita corretamente, NÃO cria esign_document, e log substring é o esperado (capturar exato durante smoke e congelar no data file) |

**Smoke pass criteria:** as 4 rows passam end-to-end → libera execução da suite completa de 51 (47 happy + 4 blocked).

## Tags

```typescript
test.describe('Multi-State Signing Regression', {
  tag: ['@regression', '@signing-regression', '@multi-state', '@hybrid', '@qa2'],
}, () => { ... });
```

**Não incluir** `@smoke` (47 rows é heavy demais para smoke nightly que precisa rodar < 10 min). Subset smoke (4 rows) pode ser tag separada `@signing-smoke` se Task #5 quiser CI hook.

## Program × Brand Coverage

> Não aplicável neste SPEC. Justificativa: o foco é **routing de e-sign por estado**, não modalidade de programa (13m/16m/Second Look) nem brand (UOWN/Kornerstone). Todas as linhas usam programa 13m apenas (modalidade A do `ssn-test-catalog.md`) com merchant UOWN não-Kornerstone (TerraceFinance). Isso é deliberado — ortogonalizar a dimensão programa/brand evita explosão combinatória (51 × 4 modalidades × 2 brands = 408 testes).
>
> **Cobertura complementar** das outras dimensões fica em outras suites:
> - Modalidades 13m/16m/Second Look: `tests/api/ssn-program-modalities.spec.ts` (cobertura existente, fora do escopo)
> - Brand UOWN vs Kornerstone (signing): adicionar US futura (Kornerstone × CA × GOWSIGN) é trabalho separado
>
> Se durante Task #4 surgir necessidade de cobrir Kornerstone × CA × GOWSIGN, abrir nova task — não inflar este SPEC.

## QA Domain Reflexes Applied

> Cross-checked com `.claude/context/shared/qa-domain-reflexes.md`. Reflexos selecionados são MANDATÓRIOS no spec test (steps marcados `[reflex]`).

| Reflex Block | Aplicado em | Validação no spec |
|-------------|-------------|--------------------|
| **§ 4. Credit Application / Origination** | SR-BLOCKED (4 rows) | Step 4 do skeleton blocked: decision = DENIED, status final = UW_DENIED, reason code persistido em `uown_los_lead_notes` (compliance ECOA/FCRA) |
| **§ 11. Qualquer Mutation (genérico)** | Todas 51 rows (criação de lead) | Step 4 do skeleton: nota auto-gerada em `uown_los_lead_notes` com prefixo `[Service][Method]` (audit trail). Mais a invariante de timestamp monotônico no step 8 |
| **§ 12. Geração de Documento** | SR-GOWSIGN + SR-SIGNWELL (47 rows) | Step 8 do skeleton: `uown_esign_document.row_created_timestamp` populado, FK consistente com `uown_los_contract.esign_document_pk`. Step 6 valida que PDF contém dados corretos (header de estado). Step 7 valida lessor name (PDF contém dados corretos) |

**No reflex applies (justificativa):** Steps 5 (UI navigate) e 9 (cross-talk) não têm reflex direto no catálogo — são validações específicas da US-CUT-02 (coexistência multi-provedor). Mantidos como assertions sem tag `[reflex]`.

## Triple Validation Mapping

| Layer | Coverage |
|-------|----------|
| **Payload / Response** | Step 1 (sendApplication response: shortCode, redirectUrl). SR-BLOCKED step 1 (denial decision) |
| **DB Persistence** | Steps 2, 3, 4, 8, 9 (esign_document, contract FK, lead notes, timestamps, event trigger log). SR-BLOCKED steps 2, 3, 4 (no esign_document, denial note, lead status) |
| **UI Rendering** | Steps 5, 6, 7 (iframe load via detector, header text, lessor name) |

Todas as 51 linhas cobrem os 3 layers (com SR-BLOCKED pulando UI por design — não há iframe a renderizar).

## Open Questions for Orchestrator

1. **DC inclusion:** confirmar via codebase scan (Task #2) se `STATE_LIST` ou `merchant-config-contract.ts` lista DC. Default deste SPEC: NÃO incluir. Se incluir, vira 51ª linha SR-BLOCKED.
2. **TerraceFinance cobre todos os 47 estados em qa2?** Checar `merchant-config-contract.ts`. Se gaps (especialmente AK), Task #2 precisa escolher merchant alternativo por linha.
3. **Lessor source of truth:** o LESSOR é renderizado a partir de qual config? Merchant? Programa? Backend hardcoded por estado? Confirmar com lead 15741 (CA) e um lead AK de teste — se lessor vem de config de programa, talvez precise garantir que AK programa tem KW-Choice configurado em qa2.
4. **SR-BLOCKED denial substring:** capturar substring exato em `uown_los_lead_notes` para NJ/VT/MN/ME durante o smoke (Task #5) e congelar no data file. Sem substring real o step 3 do skeleton blocked é flaky.
5. **Smoke run gating:** os 4 smoke rows devem rodar como pre-check obrigatório no CI antes de habilitar nightly de 51? Recomendação: sim, com `@signing-smoke` tag em workflow separado.
6. **Sharding alocação CA-first:** vale a pena forçar CA no primeiro shard para feedback rápido em PR builds? Trivial de fazer com `test.describe.configure({ mode: 'serial' })` por shard, mas adiciona complexidade. Recomendação: deixar default por ora; reavaliar após primeira execução completa.
7. **What happens when product distributes a new GowSign template?** Confirmar fluxo de comunicação product → QA. Recomendação: ADR curto explicando "matriz é source of truth; PR para alterar `multi-state-matrix.ts` é o trigger oficial de re-validação".

## Definition of Done (este SPEC)

- [x] State matrix das 50 linhas (47 happy + 3 SR-BLOCKED [NJ, VT, MN] + 1 SR-BLOCKED [ME] = 51 com 47 estados permitidos cobertos)
- [x] Buckets SR-GOWSIGN (1), SR-SIGNWELL (46), SR-BLOCKED (4) declarados
- [x] qa2-specific routing reality explícita + nota de evolução quando templates mudam
- [x] Triple validation per-row (payload + DB + UI), com SR-BLOCKED pulando UI por design
- [x] Test Data Hierarchy (Inviolable Rule #10) — todas as rows criam fresh, sem reuso, sem UPDATE direto
- [x] QA reflexes aplicados (§ 4, § 11, § 12 do catálogo) marcados como `[reflex]` nos steps
- [x] Smoke subset definido (CA, CO, AK, NJ)
- [x] Sharding strategy declarada
- [x] Tags corretas (`@regression @signing-regression @multi-state @hybrid @qa2`; sem `@smoke`)
- [x] Artefatos a criar listados (data file Task #2, page object Task #3, test file Task #4)
- [x] Open questions documentadas para orchestrator

---

**Sequência do pipeline (next):**
1. Task #2 — `subagent-data` cria `tests/e2e/signing-regression/multi-state-matrix.ts` materializando 51 rows com matrix data confirmada vs `merchant-config-contract.ts`
2. Task #3 — `subagent-page-object` cria `SigningPageDetector` provider-agnóstico
3. Task #4 — `subagent-impl-e2e` implementa `tests/e2e/signing-regression/multi-state-signing.spec.ts` lendo data file + usando page object
4. Task #5 — smoke run (CA, CO, AK, NJ) → confirma SR-BLOCKED substring + valida pipeline antes do nightly full
5. Task #6 — habilitar nightly run + reporting

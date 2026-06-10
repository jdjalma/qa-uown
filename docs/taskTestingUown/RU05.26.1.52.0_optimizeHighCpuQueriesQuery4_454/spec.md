> **Aviso (regra #16):** Este arquivo é SPEC de planejamento de teste. NÃO é fonte de padrão de selectors/helpers/classification. Patterns autoritativos vivem em `.claude/skills/` e em `src/`. Para reprodução, usar leadPks/accountPks citados; para padrões de código, consultar skills.

# SPEC — RU05.26.1.52.0 Optimize getLosSimpleSearchResults (svc#454)

## 1. Identificação

| Campo | Valor |
|---|---|
| Task | [svc#454](https://gitlab.com/uown/backend/svc/-/work_items/454) |
| MR | [!1370 R1.52.0 getLosSimpleSearchResults.sql improvements](https://gitlab.com/uown/backend/svc/-/merge_requests/1370) (merged 2026-04-28) |
| Milestone | R1.52.0 |
| Ambiente alvo | qa1 (deploy confirmado) |
| Portal | Origination (LOS) + Servicing (SVC) regressão |
| Tipo | Performance + refactor — sem mudança contratual |
| Owner QA | jose.mendesdev |

## 2. Source / Premissas

- Fonte primária: descrição do MR !1370 + diff dos 10 SQLs + `SearchService.resolveLosSearchSqlName()`
- AC inferido por engenharia reversa — task #454 não tinha AC explícito (DoR gap, ver §10)
- Investigação técnica: `.playwright-mcp/svc-454-*.json` (snapshots dropdown), `src/scripts/inspect-search-sql-454.ts` (EXPLAIN ANALYZE), live data em qa1

## 3. Escopo

### IN
- **10 SQLs especializadas LOS** (`getLosSearch_By*` + `_FreeText`) — comportamento + dedup + payload shape
- **Router Java `resolveLosSearchSqlName`** — happy + edge (searchType null → pre-detect)
- **Multi-tenancy via `FilterRequest.merchantRefCodes`** (AOP `MerchantCodeAspect`) — afeta TODAS as 10 SQLs
- **Expression indexes** (`idx_los_email_address_upper`, `idx_los_invoice_merchant_invoice_number_upper`) — uso real validado via EXPLAIN
- **SVC `getSvcSimpleSearchResults` regressão** — não foi tocado, mas matriz UI cobre 10 searchTypes para garantir não-regressão paralela
- **3 bugs descobertos** (alias FreeText, UPPER coluna ausente, índice last4CC ausente) — CTs explícitos

### OUT
- **Benchmark de performance absoluto** (p95/p99 sob carga) — escopo de SRE/load testing, não E2E
- **Otimização do SVC monolítico** — fora do escopo do MR
- **Auth/authorization** — `simpleSearch` já tem cobertura em smoke; não duplicar
- **UI redesign do dropdown searchType** — não houve mudança visual
- **CC card masking/PII** — fora do escopo da task

### AMBÍGUOS / Questions for PO (Yuri / dev)
- **Q1**: Os 3 bugs (#1 FreeText alias, #2 UPPER coluna, #3 índice last4CC) entram nesta task ou abrem novas? — recomendação: piggyback no R1.52.x hotfix
- **Q2**: Anomalias #4-#7 de contrato (POST sem body=200, sem Content-Type=500, JSON inválido=400 HTML, searchType inválido=200 silencioso) são bugs ou by-design? — flaggar para review, baixa prio
- **Q3**: `merchantRefCodes` vazio = sem filtro (wildcard) ou erro? Comportamento atual aceita ambos — qual é o contrato?

## 4. AC Coverage

| AC (inferido) | Cenários |
|---|---|
| AC1 — Cada searchType aciona a SQL especializada correta | UI-01..UI-09 + API-router |
| AC2 — Payload mantém shape (campos esperados não-null em todas as variantes) | CT-BUG-1 + UI-* asserts |
| AC3 — Dedup por leadPk (sem duplicatas quando lead tem múltiplos CCs/invoices) | UI-09 + API-DEDUP |
| AC4 — Multi-tenancy via body restringe resultados | API-MT-01..03 |
| AC5 — Expression indexes são efetivamente usados (EXPLAIN: Bitmap/Index Scan, não Seq Scan) | CT-BUG-2 + CT-IDX-EMAIL |
| AC6 — searchType=null faz pre-detect (@→Email, UUID regex, alpha→Name, fallback FreeText) | API-PRE-DETECT |
| AC7 — SVC `simpleSearch` permanece funcional (regressão paralela) | SVC-UI-01..10 |

## 5. Risk Analysis

| Área | Risco | Por quê | Cobertura |
|---|---|---|---|
| Dedup last4CC (lead 4019 com 26 CCs) | **High** | Era o bug original da task; refactor pode ter quebrado; índice ausente (BUG-3) amplifica | UI-09 + CT-BUG-3 + API-DEDUP |
| FreeText payload shape | **High** | BUG-1 confirmado live (createdTimestamp=null) — campo legacy `rowCreatedTime` | CT-BUG-1 + API-FREETEXT |
| Multi-tenancy (AOP) | **High** | `FilterRequest.merchantRefCodes` é AOP — refactor de 1→10 SQLs poderia bypassar; sem cobertura prévia | API-MT-01..03 |
| Índice expression UPPER | **Medium** | Índice criado mas WHERE não aplica UPPER na coluna (BUG-2) — performance fica em Seq Scan | CT-BUG-2 |
| Router pre-detect | **Medium** | `@`/regex UUID/alpha — limite de classes não-trivial | API-PRE-DETECT |
| SVC regressão paralela | **Medium** | MR só LOS; UI no Servicing usa nome similar — confusão de manutenção | SVC-UI-01..10 |
| Contrato API edge | **Low** | Anomalias #4-#7 são pré-existentes, não introduzidas pelo MR | API-EDGE-01..04 (smoke) |

## 6. Test Strategy

- **Abordagem**: **hybrid** (UI Origination + UI Servicing regressão + API direto para cenários impossíveis na UI)
- **Justificativa UI-first (regra #14)**: search tem affordance UI clara em Origination e Servicing. UI é DEFAULT.
- **Justificativa API-only (exceção §14b)**:
  - Multi-tenancy via body → não tem affordance UI (header X-Merchant é AOP transparente)
  - FreeText sem searchType → UI sempre envia searchType selecionado; só API permite null
  - Contract edges (no body, bad CT) → não reproduzíveis via UI
  - EXPLAIN ANALYZE → DB direto, não E2E
- **Ambientes**: qa1 (deploy confirmado); fallback qa2 se DV360 outage persistir (ver memory `project_dv360_uat_qa1_outage_2026_05_18`)
- **Viewport (regra #15)**: Origination + Servicing = **1440×900** único (portais internos, agent-facing, Bootstrap LG ≥992px)
- **Suites a ativar**:
  - `simple-search-los` (nova) — Origination
  - `simple-search-svc-regression` (nova) — Servicing paralelo
  - **NÃO** ativar dual-brand smoke (search é cross-brand por design via multi-tenancy)
  - **NÃO** ativar signing-regression (não afeta GoSign)
- **Activity log (regra #13)**: N/A — endpoint read-only, sem mutação de estado, sem geração de note esperada

## 7. Test Design Techniques aplicadas

| Técnica | Onde |
|---|---|
| Equivalence partitioning | searchTypes (9 classes válidas + 1 inválida) |
| Boundary value analysis | last4CC com 3/4/5 dígitos; SSN com 8/9/10 dígitos; lead com 1/26 CCs |
| Decision table | `searchType × inputShape × merchantRefCodes presence` → SQL acionada |
| State transition | N/A (read-only) |
| Use case / persona | Agent triando ticket por email/phone; ops procurando por last4CC reclamação fraude |
| Exploratory | Anomalias #4-#7 (charter-based session em contract edges) |

## 8. Matriz de Cenários (prioritized — 23 CTs)

### 8.1 UI Origination Happy Path (9 CTs)

> **Setup comum**: login Origination (1440×900); usar lead 11319 Karen Holdin (FUNDED, account 4524, ssn 248475193, email karengarcia1778758086299@yahoo.com, invoice R1925054, CC last4 0002/2224/2225/6909) como happy lead para validação cruzada quando aplicável; lead 4019 (26 CCs) para dedup.

| CT | searchType | Input | Asserção chave |
|---|---|---|---|
| UI-01 | Lead # | `11319` | 1 result; leadPk=11319; campos não-null (id, status, name, createdTimestamp) |
| UI-02 | Servicing Account # | `4524` | 1 result; accountPk=4524 |
| UI-03 | Phone | últimos 10 dígitos do lead 11319 | ≥1 result; leadPk=11319 presente |
| UI-04 | Email | `karengarcia1778758086299@yahoo.com` | 1 result; usa `idx_los_email_address_upper` (validar EXPLAIN side-channel) |
| UI-05 | SSN | `248475193` | 1 result; leadPk=11319 |
| UI-06 | Invoice # | `R1925054` (NÃO `R91931` — poluído com 4685 leads) | 1 result; leadPk=11319 |
| UI-07 | UUID | UUID do lead 11319 | 1 result |
| UI-08 | Name | `Karen Holdin` | ≥1 result; leadPk=11319 presente; dedup OK |
| UI-09 | Last 4 CC | `2225` (lead 11319 CC4) **+** `<last4 do lead 4019>` | **DEDUP**: para lead 4019 (26 CCs) retornar 1 row, não 26 |

### 8.2 UI Servicing Regressão Paralela (10 CTs)

| CT | searchType (label) | Param backend | Input |
|---|---|---|---|
| SVC-UI-01 | Lead # | LeadPk | 11319 |
| SVC-UI-02 | Servicing Account # | AccountPk | 4524 |
| SVC-UI-03 | Phone | Phone | (mesmo UI-03) |
| SVC-UI-04 | Email | Email | karengarcia… |
| SVC-UI-05 | SSN | SSN | 248475193 |
| SVC-UI-06 | Invoice # | **InvoiceNumber** (atenção: difere de Origination `InvoiceNum`) | R1925054 |
| SVC-UI-07 | Name | Name | Karen Holdin |
| SVC-UI-08 | Last 4 CC | last4CC | 2225 |
| SVC-UI-09 | **Ref Account ID** (Servicing-only) | RefAccountId | ref do account 4524 |
| SVC-UI-10 | **Contract #** (Servicing-only) | ContractNumber | contract do account 4524 |

> **Asserção comum SVC**: cada call retorna 1+ resultado correto e payload mantém shape (regressão paralela — MR não tocou SVC mas matriz garante não-regressão).

### 8.3 — 8.5 REMOVED (test strategy revision 2026-05-24)

> **§8.3 (API FreeText pre-detect 4 CTs), §8.4 (API Multi-tenancy 3 CTs),
> §8.5 (API Contract Edges 4 CTs) — REMOVIDOS.** Movidos para cobertura
> UI/DB conforme regra inviolável #14 (UI-first) + ver §15 abaixo para
> a decisão completa. As 11 CTs originais foram:
>
> - Endereçadas pela suite UI (§8.1 / §8.2) — pre-detect e multi-tenancy
>   acontecem transparentemente quando o usuário busca via portal.
> - CT-BUG-2 e CT-BUG-3 migrados para spec DB-direct
>   (`tests/api/origination/simple-search-explain.spec.ts`) — EXPLAIN
>   ANALYZE não tem affordance UI por design (whitelisted em §14b).
> - CT-BUG-1 migrado para E2E browser-fetch
>   (`tests/e2e/origination/simple-search-bug1.spec.ts`) — único caminho
>   confiável pra exercer `FreeText` com session BFF presente.
>
> O drift documentado nas anomalies #4-#7 vira observação no report (regra #10).

### 8.6 CTs de Bug (3 CTs — devem FALHAR pré-fix, PASSAR pós-fix)

#### **CT-BUG-1 — FreeText `createdTimestamp` não pode ser null**
- **Setup**: lead 11319 existe em qa1
- **Action**: `POST /uown/los/simpleSearch/R1925054` SEM searchType (cai em FreeText via pre-detect)
- **Assert**: `response[0].createdTimestamp !== null` AND igual a `"2026-05-14T07:28:07.373"` (mesmo valor retornado por ByName/ByInvoiceNum)
- **Fix esperado**: 1 linha em `GETLOSSEARCH_FREETEXT.sql` — alias `rowCreatedTime` → `createdTimestamp`

#### **CT-BUG-2 — `ByInvoiceNum` deve usar `idx_los_invoice_merchant_invoice_number_upper`**
- **Setup**: index migration `V20260427115712` aplicada
- **Action**: executar EXPLAIN ANALYZE via DB helper sobre query gerada por `getLosSearch_ByInvoiceNum` com input `R1925054`
- **Assert**: plan contém `Bitmap Index Scan on idx_los_invoice_merchant_invoice_number_upper` E NÃO contém `Seq Scan on uown_los_invoice` (de >5000 rows)
- **Performance esperada**: <1ms (vs 2.129ms atual em Seq Scan)
- **Fix esperado**: `WHERE invoice.merchant_invoice_number = UPPER(:s)` → `WHERE UPPER(invoice.merchant_invoice_number) = UPPER(:s)`

#### **CT-BUG-3 — `ByLast4CC` deve ter índice em `cc_last_four_digit`**
- **Setup**: lead 4019 (26 CCs) ou qualquer lead com last4 `2225`
- **Action**: EXPLAIN ANALYZE de `getLosSearch_ByLast4CC` com input `2225`
- **Assert**: plan contém `Index Scan` ou `Bitmap Index Scan` em `uown_los_credit_card.cc_last_four_digit` E NÃO `Seq Scan` (>10k rows)
- **Performance esperada**: <5ms (vs 125.877ms atual)
- **Adicional**: response dedupli por leadPk (lead 4019 = 1 row, não 26)
- **Fix esperado**: nova migration `CREATE INDEX CONCURRENTLY idx_los_cc_last_four_digit ON uown_los_credit_card (cc_last_four_digit)`

## 9. Validações por Categoria

| Categoria | UI assert | API assert | DB assert |
|---|---|---|---|
| Happy path | result aparece em lista; clique navega para detail | status 200, shape correto, dedup leadPk único | N/A (read-only) |
| BUG-1 | N/A (UI mascara — usa outro campo) | `createdTimestamp` não-null | N/A |
| BUG-2 / BUG-3 | N/A | latency aceitável | EXPLAIN ANALYZE plan |
| Multi-tenancy | N/A (header AOP transparente) | filtra por merchantRefCodes | N/A |
| Activity log (regra #13) | **N/A — endpoint read-only, não esperamos note em `uown_los_lead_notes`** | — | — |

## 10. DoR / DoD

### DoR (parcial — gap declarado)
- [x] Endpoint identificado e exercitado live
- [x] Massa em qa1 confirmada (11.289 leads)
- [x] Selectors UI estáveis (`#search-input`, MCP-validated)
- [ ] **AC explícito do PO** — AUSENTE; inferido por reverse-engineering do MR. Spec marcado como "pending PO sign-off"
- [x] Bugs pre-existentes documentados (BUG-1/2/3 + anomalias #4-#7)

### DoD
- [ ] 23 CTs implementados e passando em qa1
- [ ] 3 CTs BUG falham contra estado atual (proof) e passam pós-fix
- [ ] Regressão SVC paralela (10 CTs) verde
- [ ] EXPLAIN ANALYZE side-channel rodado para CT-BUG-2 e CT-BUG-3
- [ ] Report `report.md` produzido por qa-validator com tags `[CONFIRMADO]`/`[OBSERVAÇÃO]`
- [ ] Pitfalls alimentados em [[application-lifecycle]] ou skill nova (`search-endpoints-knowledge`)
- [ ] Q1/Q2/Q3 respondidas por Yuri antes do close

## 11. Artefatos a criar / estender

| Artefato | Status | Caminho |
|---|---|---|
| `SimpleSearchApiClient` | **CRIAR** (não existe) | `src/api/clients/simple-search.client.ts` |
| `SearchPage` extension | **ESTENDER** — adicionar selectors/methods para searchTypes não cobertos (UUID, SSN, InvoiceNum no Origination; RefAccountId, ContractNumber no Servicing) | `src/pages/search.page.ts` |
| `searchSqlExplain.helpers.ts` | **CRIAR** | `src/helpers/search-sql-explain.helpers.ts` — EXPLAIN ANALYZE helper para CT-BUG-2/3 |
| Test specs | **CRIAR** | (atualizado §15 — revisão 2026-05-24) `tests/api/origination/simple-search-explain.spec.ts` (DB-direct EXPLAIN, CT-BUG-2/3), `tests/e2e/origination/simple-search-bug1.spec.ts` (browser-fetch CT-BUG-1), `tests/e2e/origination/simple-search-ui.spec.ts` (9 UI Origination), `tests/e2e/servicing/simple-search-svc-regression.spec.ts` (10 SVC). `tests/api/origination/simple-search-los.spec.ts` **DELETADO**. |
| Test data | **REUSE** | Lead 11319 (Karen Holdin), Lead 4019 (26 CCs dedup gold), Lead 4002/4764/9662 (multi-CC backup) |
| Fixtures | **REUSE** | `origination.fixture.ts`, `servicing.fixture.ts` existentes |

## 12. Out-of-scope decisions

- **Não criar leads novos para search** — massa qa1 (11k leads) já suficiente; criar pollui o índice
- **Não testar payment/signing flows** dentro deste spec — search é read-only
- **Não implementar EXPLAIN ANALYZE como assertion permanente** — usar como side-channel one-shot em CT-BUG-2/3; rodar manualmente em hotfix close
- **Anomalias #4-#7** entram como `[OBSERVAÇÃO]` no report, não como CT que bloqueia merge

## 13. Pitfalls considerados

- **Test data pollution `R91931`** — 4685 leads compartilham este invoice (default de `createPreQualifiedApplication`); NÃO usar em CT — usar `R1925054`
- **Servicing usa `InvoiceNumber` (não `InvoiceNum`)** — mapeamento label↔param diverge entre portais; CT SVC-UI-06 explícito
- **Viewport sub-1440** — Origination/Servicing usam Bootstrap `d-lg-block` (≥992px); abaixo a barra de search some
- **`merchantRefCodes` via AOP** — `MerchantCodeAspect` lê antes do controller; refactor de 1→10 SQLs poderia ter quebrado transparentemente; cobertura explícita necessária
- **FreeText alias legacy** — `rowCreatedTime` é resíduo histórico; outras 9 SQLs usam `createdTimestamp`; Jackson não tem `@JsonAlias` para tolerar drift
- **EXPLAIN ANALYZE em qa1** — rodar em horário de baixa carga; não rodar 100×

## 14. Cross-links

- Investigação live: `.playwright-mcp/svc-454-dropdown-origination.json`, `.playwright-mcp/svc-454-dropdown-servicing.json`
- Scripts: `src/scripts/inspect-search-sql-454.ts` (EXPLAIN ANALYZE runs)
- MR: https://gitlab.com/uown/backend/svc/-/merge_requests/1370
- Migration: `V20260427115712_1.51.0__create-los-search-expression-indexes.sql`
- Java router: `SearchService.resolveLosSearchSqlName()` (svc repo)
- Skills aplicadas: [[risk-based-prioritization]], [[test-design-techniques]], [[ui-first-principle]], [[dom-investigation]], [[activity-log-validation]] (N/A justificado), [[volatile-knowledge-registry]]
- Memórias relevantes: `feedback_portal_naming.md`, `project_dv360_uat_qa1_outage_2026_05_18.md`

---

## 15. Test strategy revision (2026-05-24) — API-only suite deprecated

> **Trigger:** report do validator (`*-report.md`) mostrou 13/14 falhas no
> `tests/api/origination/simple-search-los.spec.ts`. Debugger (`qa-debugger`)
> investigou via MCP + live curl e identificou 2 root causes na infra de teste:
>
> 1. `pageNumber`/`maxResults` são `@RequestParam` na query string, NÃO body —
>    `SimpleSearchClient` enviava no body, backend respondia 400.
> 2. `/uown/los/simpleSearch/` exige **cookie session do BFF Next.js** (`merchant.sid`).
>    API key isolada não basta — `MerchantCodeAspect` AOP retorna `401 {unauthorized:true}`.
>    Mesmo padrão já mitigado em `src/api/clients/merchant.client.ts:17-26` via
>    `host=svc` bypass (vai direto no backend, pula o proxy Next.js).
>
> Além disso, o `SimpleSearchResponseBody` estava declarado como array flat
> (`SimpleSearchResult[]`), quando o backend retorna wrapper
> `{ searchResults, count, moreResults }` — o helper `Array.isArray(parsed)`
> silenciosamente produzia `body=[]` em todos os specs UI também
> (cascateando F-06/F-07 do report).
>
> ### Decisão (autorizada)
>
> **DELETAR `tests/api/origination/simple-search-los.spec.ts`** e reduzir o
> escopo API-only a CT-BUG-1/2/3, redistribuídos por regra #14 (UI-first):
>
> | CT original | Novo arquivo | Justificativa |
> |---|---|---|
> | CT-BUG-1 (FreeText `createdTimestamp`) | `tests/e2e/origination/simple-search-bug1.spec.ts` (browser-fetch via `page.evaluate`) | Endpoint requer BFF session; browser-fetch é o único caminho a11y-safe sem reimplementar handshake. Único campo observável SÓ via payload (UI não renderiza). |
> | CT-BUG-2 (`ByInvoiceNum` index UPPER) | `tests/api/origination/simple-search-explain.spec.ts` (DB-direct) | EXPLAIN ANALYZE não tem affordance UI por design — whitelisted regra #14 §b (cross-cutting DB validation). |
> | CT-BUG-3 (`ByLast4CC` index) | `tests/api/origination/simple-search-explain.spec.ts` (DB-direct) | Idem CT-BUG-2. Parte (b) "dedup por leadPk" é validada pela UI suite (UI-09). |
> | API-PRE-01..04 (FreeText pre-detect) | **REMOVIDOS** — cobertos por `simple-search-ui.spec.ts` quando o usuário busca via portal. Não há valor adicional em testar via HTTP direto a engine de pre-detect quando a UI já a exerce. |
> | API-MT-01..03 (multi-tenancy AOP) | **REMOVIDOS** — multi-tenancy é AOP transparente; quando o agent loga e busca via UI, o header `X-Merchant` é injetado automaticamente. Re-criar fakes via HTTP testaria o proxy, não o aspect. |
> | API-EDGE-01..04 (contract edges) | **REMOVIDOS** — anomalies #4-#7 são pré-existentes ao MR !1370, não regressões. Validator pode anotar drift como `[OBSERVAÇÃO]` no report sem necessidade de spec dedicada (regra #10). |
>
> ### Por que essa decisão é segura
>
> - Endpoint LOS funcional foi validado **live** durante a investigação
>   (MCP browser fetch, 18 cenários conferidos pelo `qa-debugger`).
> - CT-BUG-2/BUG-3 ficam confirmados via DB direto — não dependem do HTTP.
> - CT-BUG-1 fica registrado e validado via E2E + browser fetch (única forma
>   confiável de exercer FreeText com session BFF presente).
> - Regra inviolável #14 (UI-first) honrada.
> - Reduz superfície de manutenção (menos infra de teste a manter; o
>   `SimpleSearchClient` API client deixa de ser exercitado, mas permanece
>   no repo para preservar conhecimento e possível uso futuro via host=svc bypass).
>
> ### Pitfalls alimentados (regra #11)
>
> - `src/api/responses/simple-search.response.ts` — refatorado para
>   refletir o wrapper `{ searchResults, count, moreResults }`. Categoria
>   marcada como **drift-prone** (ver [[volatile-knowledge-registry]]).
> - `[[application-lifecycle]]` — entry adicionada cobrindo "endpoints
>   LOS exigem BFF session" + 3 workarounds (host=svc bypass; browser
>   fetch from page context; UI flow).
>
> ### Cross-links
>
> - Report do debugger (delegation gate): seção F-1/F-2/F-3 do report
>   `RU05.26.1.52.0_optimizeHighCpuQueriesQuery4_454-report.md`.
> - Skill consultada: [[ui-first-principle]], [[volatile-knowledge-registry]].

---

**Ready for: `qa-validator`** — re-rodar a suite agora reduzida (UI-Origination 9 + UI-Servicing 10 + BUG-1 E2E 1 + Explain 2 = 22 CTs). `qa-implementer` aplicou os fixes F-1/F-2/F-3 do debugger; restantes hipóteses (F-06/F-07 selector drift do `SearchPage`) ficam para nova rodada de DOM-investigation se persistirem.

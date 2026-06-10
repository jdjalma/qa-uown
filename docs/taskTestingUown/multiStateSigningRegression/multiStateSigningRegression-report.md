# Relatório de Execução — multiStateSigningRegression (smoke subset)

## Informações da Tarefa

| Campo | Valor |
|------|-------|
| Suite | Multi-State Signing Regression — smoke subset (4 cases) |
| Origem | StandUp UOWN (26) — gap de cobertura confirmado em 2026-04-28 |
| Spec | [`docs/taskTestingUown/multiStateSigningRegression/multiStateSigningRegression-spec.md`](./multiStateSigningRegression-spec.md) |
| Implementação | [`tests/e2e/signing-regression/multi-state-signing.spec.ts`](../../../tests/e2e/signing-regression/multi-state-signing.spec.ts) |
| Data file | [`src/data/state-merchant-matrix.ts`](../../../src/data/state-merchant-matrix.ts) (51 rows: 1 GOWSIGN + 46 SIGNWELL + 4 BLOCKED) |
| Suite total | 50 casos (47 happy + 4 blocked, AK como variante de lessor dentro dos 47) |
| Subset rodado | 4 cases via `--grep @signing-smoke` (CA, CO, AK, NJ) |
| Ambiente | qa2 |
| Project Playwright | `cross-portal` |
| Workers | 1 (Playwright reduziu de 2 → 1 antes de `Ensure merchant config` falhar; mesmo comportamento se forçássemos 2 já que a falha é determinística no primeiro step) |
| Data da execução | 2026-04-28 |
| RunId / Lock | n/a — execução abortada pré-criação de leads |

## Descrição

Smoke gating do nightly que rodaria a regressão completa de roteamento de e-sign por estado. O smoke valida o **framework + 4 cases representativos** (1 por bucket) antes de habilitar os 50 cases do nightly:

- **CA** — único path GOWSIGN em qa2 (template GowSign disponível somente para CA em 2026-04-28).
- **CO** — caminho SIGNWELL fallback default (lessor Mollie).
- **AK** — variante de lessor (KW-Choice Alaska LLC) — única linha não-Mollie do bucket SR-SIGNWELL.
- **NJ** — caminho denial via `stateCheck`, deveria capturar a substring exata em `uown_los_lead_notes` para feedar `STATE_MATRIX[].blockedReason` (placeholder `undefined` hoje).

## Execução do Teste

| Item | Valor |
|------|-------|
| Comando | `ENV=qa2 npx playwright test tests/e2e/signing-regression/multi-state-signing.spec.ts --grep @signing-smoke --workers=2 --reporter=list` |
| Tempo total | ~4s (todos falharam imediatamente no primeiro step) |
| Status agregado | **4/4 FAILED** — mesma causa raiz |
| Vídeo | Não gravado (falha pré-navegação; Playwright manteve apenas screenshot de falha onde browser estava disponível) |
| Trace | Não gerado (falha em fixture/setup, não em browser context) |

> **Nota sobre `--workers=2`:** Playwright global-setup do projeto reduziu para 1 worker antes de iniciar (output: `Running 4 tests using 1 worker`). Como a falha ocorre determinística no `test.step('Ensure merchant config')` antes de qualquer chamada API que pudesse race-condition, o número de workers é irrelevante para este resultado.

## Evidências (Dados Utilizados/Criados)

| Tipo | Identificador | Origem | Status |
|------|---------------|--------|--------|
| leadPk | n/a | — | **Nenhum lead criado** — falha pré-`sendApplication` em todos os 4 casos |
| esignDocPk | n/a | — | Nenhum |
| esign_client observado | n/a | — | Não consultável (sem lead) |
| document_status | n/a | — | Não consultável |
| Detected provider via SigningPage | n/a | — | UI nunca foi navegada |
| Notes em `uown_los_lead_notes` (NJ) | n/a | — | **NÃO capturado** — bloqueador para `STATE_MATRIX.blockedReason` |
| Cobertura AK / TerraceFinance | n/a | — | **Não validado** — falha antes do `sendApplication` |

> Per `.claude/rules/testing.md § Test Data Hierarchy` esses cases criariam **fresh data** (leads + emails únicos via `buildTestData`). Nenhum dado existente foi reusado e nenhum dado novo foi criado: a execução abortou antes do step de criação.

## Capturas de Tela

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `reports/test-results/signing-regression-multi-s-6077e-lessor-Mollie-LLC-dba-Uown--cross-portal/test-failed-1.png` | CA — falha no `Ensure merchant config` (refCode `tireagent`) |
| 2 | `reports/test-results/signing-regression-multi-s-33925-essor-KW-Choice-Alaska-LLC--cross-portal/test-failed-1.png` | AK — falha no `Ensure merchant config` (refCode `terraceFinance`) |
| 3 | `reports/test-results/signing-regression-multi-s-93b7b-lessor-Mollie-LLC-dba-Uown--cross-portal/test-failed-1.png` | CO — falha no `Ensure merchant config` (refCode `terraceFinance`) |
| 4 | n/a (NJ) | NJ é API-only no skeleton blocked (sem `page` na fixture) — Playwright não emitiu screenshot |

> Screenshots foram gerados pelo Playwright em `reports/test-results/` (cleanup automático no próximo run). Não copiados para `docs/taskTestingUown/multiStateSigningRegression/` porque mostram apenas a página em branco do origination antes do erro de fixture — sem valor diagnóstico além do que está nos logs.

## Cenários

### CT-CA (SR-GOWSIGN)

**Objetivo:** Confirmar que o estado CA roteia o e-sign para GowSign em qa2 com lessor Mollie.

**O que é verificado:** Após uma aplicação CA atingir `CC_AUTH_PASSED`, o sistema cria um `uown_esign_document` com `esign_client = 'GOWSIGN'`, gera a nota canônica `Sent Contract to customer. Contract EsignDocPk : N` em `uown_los_lead_notes`, e a UI de assinatura renderiza o iframe GowSign com badge `OUTSTANDING`. Header e lessor do PDF estão sob `test.fixme` aguardando o helper `extractContractValues`.

> **Falha:** `Error: Merchant not found for refCode: "tireagent"` em `src/support/merchant-configurator.ts:42`, lançada por `merchantConfig.configureByName('TireAgent', 'lifecycle')` durante o step `Ensure merchant config`. A execução abortou antes do `sendApplication`.
>
> Status: **FALHOU (framework / merchant resolution)**

#### Como verificar manualmente

1. Logar no portal Origination de qa2 com merchant **TireAgent (OW90218-0001)**.
2. Submeter aplicação com applicant em CA, SSN não terminando em 9, valor $1.000.
3. Após `CC_AUTH_PASSED`, executar:
   ```sql
   SELECT d.pk, d.esign_client, d.esign_mode, d.document_status
   FROM uown_esign_document d
   JOIN uown_los_contract c ON c.esign_document_pk = d.pk
   WHERE c.lead_pk = $LEAD_PK;
   ```
   Esperado: `esign_client = 'GOWSIGN'`.
4. Abrir o `redirectUrl` retornado por `sendApplication.paymentDetailsList[idx].redirectUrl`. Iframe GowSign deve carregar com badge `OUTSTANDING`.
5. Validar nota:
   ```sql
   SELECT pk, notes FROM uown_los_lead_notes
   WHERE lead_pk = $LEAD_PK
     AND notes LIKE '%Sent Contract to customer. Contract EsignDocPk : ' || $ESIGN_DOC_PK || '%'
   ORDER BY pk DESC;
   ```

### CT-CO (SR-SIGNWELL)

**Objetivo:** Confirmar fallback SignWell para o estado CO em qa2 com lessor Mollie.

**O que é verificado:** Aplicação CO chega a `CC_AUTH_PASSED`, `uown_esign_document.esign_client = 'SIGNWELL'`, nota canônica registrada e iframe SignWell renderiza (badge não é asserted — `SigningPage.getStatusBadge()` retorna `null` para SIGNWELL por contrato; status é coberto via DB).

> **Falha:** `Error: Merchant not found for refCode: "terraceFinance"` (mesma causa que CA, refCode diferente).
>
> Status: **FALHOU (framework / merchant resolution)**

#### Como verificar manualmente

1. Repetir CT-CA com applicant CO e merchant **TerraceFinance (OL90202-0001)**.
2. Esperado: `esign_client = 'SIGNWELL'` no `uown_esign_document`.
3. Iframe SignWell deve carregar; sem badge OUTSTANDING (não existe no chrome do SignWell).

### CT-AK (SR-SIGNWELL — variante de lessor)

**Objetivo:** Confirmar que AK usa lessor `KW-Choice Alaska LLC` (não Mollie) e ainda roteia para SIGNWELL.

**O que é verificado:** Mesmo skeleton de CT-CO, com a verificação adicional de que o LESSOR no PDF é `KW-Choice Alaska LLC` (atualmente `test.fixme` aguardando `extractContractValues`).

> **Falha:** `Error: Merchant not found for refCode: "terraceFinance"`. Não foi possível validar a cobertura de AK pelo TerraceFinance em qa2 (open question #2 do SPEC permanece em aberto).
>
> Status: **FALHOU (framework / merchant resolution)** — cobertura AK / TerraceFinance permanece não confirmada.

#### Como verificar manualmente

1. Repetir CT-CO com applicant AK.
2. Confirmar que TerraceFinance aceita applicant AK em qa2 (open question #2). Se denial vier com `merchant-not-allowed`, é gap de cobertura — trocar `validMerchant` na linha AK do `STATE_MATRIX` para outro merchant ONLINE que atenda AK.
3. Quando o helper de PDF existir, validar que `LESSOR == 'KW-Choice Alaska LLC'`.

### CT-NJ (SR-BLOCKED)

**Objetivo:** Confirmar que aplicação NJ é negada em `stateCheck`, sem `uown_esign_document`, e capturar a substring exata da nota de denial para alimentar `STATE_MATRIX.blockedReason`.

**O que é verificado:** `sendApplication` para NJ retorna decision DENIED (HTTP 200 com payload de denial OU lead persistido que não progride além de UW). `uown_esign_document` NÃO é criado (invariante regulatória). `uown_los_lead_notes` registra a rejeição com substring que contenha algum de: `denied`, `stateCheck`, `NO_BUSINESS_IN_STATE`, `state not allowed` (case-insensitive). Atualmente os 5 últimos notes são logados via `console.log` para que o smoke congele a substring exata em `STATE_MATRIX[NJ].blockedReason`.

> **Falha:** `Error: Merchant not found for refCode: "terraceFinance"`. Nenhum lead foi criado, nenhum log de denial capturado. **A substring real para `STATE_MATRIX[NJ].blockedReason` permanece desconhecida.**
>
> Status: **FALHOU (framework / merchant resolution)** — deliverable principal do smoke (NJ denial substring) **NÃO ENTREGUE**.

#### Como verificar manualmente

1. Submeter `sendApplication` em qa2 com applicant NJ + merchant TerraceFinance + SSN não-9.
2. Capturar `lead_pk` (se persistido).
3. Rodar:
   ```sql
   SELECT pk, notes FROM uown_los_lead_notes
   WHERE lead_pk = $LEAD_PK
   ORDER BY pk DESC LIMIT 10;
   ```
4. Identificar a linha que contém marker de denial regulatório de estado e copiar a substring **exata** para `STATE_MATRIX[NJ].blockedReason` em `src/data/state-merchant-matrix.ts`. Repetir para VT, MN, ME quando o smoke for re-executado.

## Cobertura dos Requisitos

| Requisito do brief | Status | Observação |
|--------------------|:------:|------------|
| 4 testes `@signing-smoke` listados (CA, CO, AK, NJ) | ✅ | `--list` confirma exatamente os 4 cases esperados |
| 4 testes executados em qa2 | ⚠️ | Executados, mas todos abortados em fixture step pré-business |
| `tsc --noEmit` passa | ✅ | Zero erros |
| `--workers=2` aplicado | ⚠️ | Playwright global-setup forçou 1 worker; irrelevante porque falha é em fixture determinística |
| Lead PK + esign_doc PK capturados (4 casos) | ❌ | Nenhum lead foi criado |
| `uown_esign_document.esign_client` observado vs esperado | ❌ | Não consultável (sem lead) |
| `uown_esign_document.document_status` capturado | ❌ | Idem |
| Detected provider via SigningPage observado | ❌ | UI não navegada |
| **NJ denial substring para `STATE_MATRIX.blockedReason`** | ❌ | **Deliverable principal do smoke NÃO entregue** |
| AK / TerraceFinance coverage validado | ❌ | Open question #2 permanece aberta |

## Bugs de Aplicação Encontrados

> Aplicado o **Bug Triage Protocol** + Inviolable Rule #11 (classificação conservadora).
> Não há bugs **de aplicação** confirmados — a falha observada é em **framework de teste**, não em comportamento UOWN. Documentada na seção "Pitfalls" abaixo.

## Pitfalls Encontrados Durante Execução

> Per CLAUDE.md rule #12 — requisitos implícitos descobertos durante esta execução. Cada entrada precisa ir para `application-lifecycle-protocol.md § Pitfalls` (ou rules/testing.md) antes do próximo nightly.

| # | Sintoma | Causa descoberta | Fix recomendado | Adicionado ao protocol? |
|---|---------|-------------------|-----------------|:-----------------------:|
| 1 | `Error: Merchant not found for refCode: "tireagent"` (CA) e `Error: Merchant not found for refCode: "terraceFinance"` (AK, CO, NJ) lançado em `MerchantConfigurator.resolve()` para todos os 4 casos | `MerchantConfigurator.configureByName(merchantName, ...)` resolve `refCode` via `getMerchant(merchantName).refCode` (em `src/data/merchants.ts`) e chama `client.getMerchantsByRefCode(refCode)` que **retorna lista vazia em qa2** para esses refCodes (`tireagent`, `terraceFinance`). O codebase JÁ documenta o problema em `src/helpers/merchant-config.helper.ts:142-152`: *"qa2 RBAC is broken on getMerchantsByRefCode"* com escape hatch `MERCHANT_PREFLIGHT_SKIP=true` — mas esse env var **só é honrado em `ensureMerchantReady`**, NÃO em `MerchantConfigurator.resolve()`. O step `Ensure merchant config` usa o `MerchantConfigurator` direto e portanto não tem fallback. | **Curto prazo:** propagar `MERCHANT_PREFLIGHT_SKIP` (ou flag equivalente `MERCHANT_CONFIG_SKIP`) para `MerchantConfigurator.configure*` para tornar o `Ensure merchant config` no-op em qa2 enquanto RBAC não está corrigido. **Médio prazo:** `subagent-debug-flaky` deve investigar se `getMerchantsByRefCode` em qa2 é mesmo RBAC (token sem permissão) ou se os refCodes `tireagent`/`terraceFinance` simplesmente não casam com o que está no DB qa2 (case sensitivity, ou refCode diferente). **Longo prazo:** alinhar com dev se em qa2 deve haver `merchant-config-contract` checked-in e auto-heal via `createOrUpdateMerchant` tal como em sandbox. | **NÃO** — bloqueador para smoke; precisa virar pitfall #11 em `application-lifecycle-protocol.md` ou rule em `testing.md § Merchant Resolution` |
| 2 | Smoke não captura NJ blocked-state substring porque falha antes do `sendApplication` | Mesmo bloqueador do #1 cascateia: sem merchant config resolvida, o test step do `sendApplication` nunca executa, então o `console.log(latestNotes)` nunca dispara, então `STATE_MATRIX[NJ/VT/MN/ME].blockedReason` permanece `undefined` para sempre — bloqueia também o suite nightly de 50 cases (Inviolable Rule #11 proíbe inventar substring) | Mesmo fix do #1 destrava esse — assim que `Ensure merchant config` virar no-op honrando flag, o blocked-state test sobe ao step de `sendApplication`, dispara denial, e o `console.log(recent.map(...))` no step `activity log: stateCheck denial recorded` (multi-state-signing.spec.ts:508) imprime exatamente o que precisa ir para `blockedReason` | NÃO |

## Resumo da Validação

| Item | Resultado |
|------|-----------|
| Testes solicitados | 4 |
| Testes executados | 4 |
| Passed | **0** |
| Failed | **4** (mesma causa raiz — `Merchant not found for refCode`) |
| Skipped | 0 |
| `test.fixme` aplicáveis | 0 dos 4 atingidos (todos os fixmes ficam **depois** do primeiro step UI; nenhum teste chegou perto) — note que o suite total tem fixmes de PDF lessor/header em 47 dos 51 casos (CA + 46 SIGNWELL) aguardando helper `extractContractValues` |
| Vídeo gravado | 0 (falha pré-navegação) |
| Screenshots salvos | 3 em `reports/test-results/` (NJ não gerou screenshot — fixture API-only) |
| Bugs de aplicação encontrados | **0** (a falha é de framework, não de aplicação) |
| Pitfalls de framework | **2** (ver seção acima) — nenhum catalogado ainda |
| Reflexos QA cobertos no smoke | **Indeterminado** — nenhum step de validação foi executado. Os reflexos `[reflex]` planejados (§ 4 Credit App, § 11 Mutation, § 12 Geração de Documento) ficaram em código mas nunca rodaram |
| Reflexos QA não cobertos (gap) | Audit log via `uown_los_lead_notes` (todas as 4 rows), denial decision audit (NJ), `esign_document` FK + timestamp (CA/CO/AK) — **gap por framework, não por design**. Volta a ser coberto assim que pitfall #1 for resolvido |

## Recomendação

🛑 **NÃO habilitar nightly de 50 casos.**

### Lista de fixes obrigatórios antes do nightly

1. **[BLOQUEADOR] Pitfall #1** — destravar `Ensure merchant config` em qa2. Sugestão de fix mínimo:
   ```typescript
   // Em src/support/merchant-configurator.ts → wrap configureByName em early-return
   if ((process.env.MERCHANT_CONFIG_SKIP ?? '').toLowerCase() === 'true') {
     console.log(`[merchant-configurator] ${merchantName} bypassed via MERCHANT_CONFIG_SKIP=true`);
     return {} as MerchantDetail;
   }
   ```
   E rodar smoke novamente com `MERCHANT_CONFIG_SKIP=true ENV=qa2 npx playwright test ... --grep @signing-smoke`. Se em qa2 o auto-heal da config de merchant já estiver garantido por outro path (preset `lifecycle` é só ajuste de flags pós-existência), o by-pass deve passar limpo.

2. **[BLOQUEADOR] Re-executar smoke** após fix do #1 para coletar:
   - leadPk + esignDocPk (CA, CO, AK)
   - `esign_client` observado em cada um (CA esperado `GOWSIGN`, CO/AK esperados `SIGNWELL`)
   - `document_status` (esperado `OUTSTANDING` ou equivalente)
   - **NJ denial substring** — copiar do `console.log(latest notes)` do step `activity log: stateCheck denial recorded` e congelar em `STATE_MATRIX[NJ].blockedReason`. Repetir para VT, MN, ME (executar o subset blocked-only para isso, ex: `--grep "BLOCKED states"`).
   - **AK coverage** — confirmar que TerraceFinance atende AK em qa2 (Open Question #2 do SPEC). Se denial vier por `merchant-not-allowed`, escolher merchant ONLINE alternativo e atualizar a row AK do matrix.

3. **[NÃO BLOQUEADOR — gap conhecido]** PDF lessor/header (US-DOC-03 / US-DOC-10.1): 47 casos têm `test.fixme(true, 'PDF lessor/header — needs extractContractValues helper')`. O nightly vai marcar 47 fixmes como skipped. Aceitável para a primeira corrida do nightly desde que o resto (`esign_client` routing + activity log + iframe load) seja exercitado para todos os estados. Track separadamente — não bloqueia o gating.

4. **[NÃO BLOQUEADOR]** Atualizar este relatório após o re-run com os dados reais (Inviolable Rule #8 — sem PENDING após run bem-sucedido).

### Critério de green-light para o nightly

✅ Smoke passar nos 4 cases end-to-end (incluindo iframe load).
✅ `STATE_MATRIX[NJ/VT/MN/ME].blockedReason` populado com substrings reais (capturadas via run dedicado dos 4 blocked tests).
✅ AK validado com `validMerchant` real (TerraceFinance ou substituto).
✅ Pitfall #1 viralizado em `application-lifecycle-protocol.md § Pitfalls` ou nova seção em `rules/testing.md § Merchant Resolution`.

### Resposta direta ao brief

| Pergunta | Resposta |
|----------|----------|
| (a) Test results summary | passed=0, failed=4, skipped=0. Causa única: framework merchant resolution. |
| (b) NJ denial substring (deliverable para `STATE_MATRIX.blockedReason`) | **NÃO CAPTURADO**. Smoke abortou em fixture pré-`sendApplication`. Bloqueia também VT/MN/ME (mesmo path). |
| (c) AK status (TerraceFinance coverage) | **NÃO VALIDADO**. Open Question #2 do SPEC permanece em aberto. |
| (d) Divergências observadas vs SPEC | SPEC presume `Ensure merchant config` executando; em qa2 esse step falha por refCode não resolvível (RBAC ou data). SPEC não menciona o env var `MERCHANT_PREFLIGHT_SKIP` documentado em `merchant-config.helper.ts:142-152` — nem o fato de que esse flag não cobre o `MerchantConfigurator` direto (apenas `ensureMerchantReady`). |
| (e) Recomendação | **NÃO LIBERAR nightly.** Fix bloqueante: propagar `MERCHANT_CONFIG_SKIP` (ou equivalente) para `MerchantConfigurator`, re-rodar smoke, capturar substrings reais e validar cobertura AK. Detalhes em "Lista de fixes obrigatórios" acima. |

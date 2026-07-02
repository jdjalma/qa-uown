---
operation: ams-merchant-search
description: Listagem e busca de merchants no portal AMS (página /merchants) via GET /uown/merchants — carga default (isActive=true, page=0), busca por substring case-insensitive sobre merchantCode/merchantName/merchantLocation, negativa city-não-buscada, tri-state isActive, e lazy-load de getAllAvailableMerchants na página /users (Add User). Primeiro oracle do portal AMS.
last-reviewed: 2026-07-02
last-reviewed-sha: e4713f2
covers:
  - tests/e2e/ams/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint.spec.ts
  - src/pages/ams/ams-merchants.page.ts
  - src/pages/ams/ams-users.page.ts
  - src/selectors/common.selectors.ts
  - docs/business-rules/01-fundamentos.md
  - docs/knowledge-base/merchants-config-columns-export.md
---

# Oracle BDD — Busca de Merchants no AMS (AMS Merchant Search)

> **Gatilho:** qualquer operação que abra a página **Merchants** do portal AMS (`/merchants`), digite um termo na caixa de busca, alterne o filtro Active/Inactive, ou abra o modal "Add User" na página **Users** (`/users`) — todas exercem o endpoint `GET /uown/merchants` (svc#504 / R1.52.0, MR!1430) ou `GET /uown/getAllAvailableMerchants` (MR!170). Aplica-se também à execução do spec `RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint.spec.ts` (rodar o spec É executar as operações que ele exercita — rule #19).
>
> **Verificação de obsolescência:**
> ```bash
> git log e4713f2..HEAD -- \
>   tests/e2e/ams/RU05.26.1.52.0_updateGetMerchantsByCriteriaEndpoint.spec.ts \
>   src/pages/ams/ams-merchants.page.ts \
>   src/pages/ams/ams-users.page.ts \
>   src/selectors/common.selectors.ts \
>   docs/business-rules/01-fundamentos.md \
>   docs/knowledge-base/merchants-config-columns-export.md
> ```
> Sem output = oracle está atual. Com output = prefixar `[BDD MAY BE STALE]` e revalidar os checkpoints contra o spec antes de reportar PASS/FAIL.
>
> **Viewport:** AMS é um portal interno voltado para agentes/ops. Obrigatório **1440×900** (regra #15) — o spec fixa `test.use({ viewport: { width: 1440, height: 900 } })` para evitar a armadilha do breakpoint Bootstrap `d-lg-block` (≥992 px) que oculta a sidebar/hamburger (`spec:97-98`).
>
> **Distinção de contexto:** este oracle cobre o endpoint **novo** `GET /uown/merchants` (AMS, paginado, Spring `Page<BasicMerchantInfo>`). NÃO cobre o legado `POST /uown/getMerchantsByCriteria` (consumido pela página Origination `/merchant`, coberto pela sibling `#1292`) — apenas asserta que o legado permanece **silencioso** na página AMS (CT-01).
>
> **Escopo de colunas de busca — ressalva:** a SPEC de origem (`spec.md` AC-3) declara 6 colunas de busca no JPA (`refMerchantCode`, `merchantName`, `locationName`, `legalName`, `zipCode`, `primaryContactName`). O envelope JSON vivo de `GET /uown/merchants` expõe apenas **3 colunas buscáveis** — `merchantCode` / `merchantName` / `merchantLocation` (`spec:60-73`, `spec:262-266`). Os checkpoints deste oracle validam APENAS as 3 colunas realmente asseridas pelo spec. Cobertura de `legalName` / `zipCode` / `primaryContactName` está **[HYPOTHESIS]** (adiada pela SPEC até confirmação de Marcos — ver Gaps abaixo).

---

## CT-01 — Página Merchants consome o novo GET /uown/merchants (legado POST silencioso)

```gherkin
Dado que o agente de ops está autenticado no portal AMS em qa1 com viewport 1440×900
Quando o agente navega para a página Merchants
Então a página dispara um GET /uown/merchants que retorna HTTP 200
E a requisição default carrega o trio canônico isActive=true, page=0 e um parâmetro size numérico
E o corpo da resposta é um envelope Spring Page com content (array) e totalElements maior que zero
E nenhuma chamada ao legado POST /uown/getMerchantsByCriteria é disparada por esta página
E a tabela de merchants renderiza ao menos 1 linha visível
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP do GET | `200` | `spec:160` |
| Query default — isActive | URL casa `/isActive=true/i` | `spec:163` |
| Query default — page | URL casa `/page=0/` | `spec:164` |
| Query default — size | URL casa `/size=\d+/` | `spec:165` |
| Envelope — content | `body.content` é `Array` | `spec:170` |
| Envelope — totalElements | `body.totalElements > 0` | `spec:171` |
| Legado silencioso | array de POSTs a `/uown/getMerchantsByCriteria` capturados = `[]` | `spec:173-177` |
| Render da tabela (UI-first, regra #14) | `getTableRowCount() > 0` após `waitForTable()` | `spec:179-183` |
| Endpoint gate | GET casa `/uown/merchants` E NÃO casa `/uown/getAllAvailableMerchants` nem `/uown/getMerchantsByCriteria` | `spec:139-148` |

> **Nota de captura:** o listener `page.on('request')` do POST legado e o `waitForResponse` do GET são inscritos **antes** da navegação (`spec:133`, `spec:139`) — padrão race-safe. Reproduzir esse padrão ao revalidar manualmente via MCP, senão a resposta pode disparar antes da inscrição.

---

## CT-02 — Busca por substring case-insensitive sobre merchantCode / merchantName / merchantLocation

```gherkin
Dado que a página Merchants do AMS está carregada com a tabela renderizada
Quando o agente digita um termo de busca e submete
Então o GET /uown/merchants retorna HTTP 200 com search={termo} na querystring
E o content da resposta é um array com ao menos 1 resultado
E ao menos uma linha contém o substring esperado em um de {merchantCode, merchantName, merchantLocation}
E a tabela visível renderiza ao menos uma linha correspondente ao termo (paridade UI)
```

**Classes de equivalência cobertas (Scenario Outline — `spec:213-218`):**

| Termo buscado | Substring esperado | Classe de coluna |
|---|---|---|
| `synchrony` (minúsculo) | `Synchrony` | merchantName — case-insensitive |
| `5348121` | `5348121` | merchantCode — substring |
| `hawaii qpo` (multi-palavra) | `Hawaii QPO` | locationName / merchantLocation |
| `ks3015` | `5th Ave Furniture (NY)` | merchantCode → resolve para nome |

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP da busca | `200` | `spec:254` |
| Querystring | contém `search=` E, decodificado (encoding-agnóstico `+`/`%20`), `search={termo}` minúsculo | `spec:237-247` |
| content não-vazio | `body.content` é `Array` E `length > 0` | `spec:257-258` |
| Match de coluna | ≥1 linha com `expectedSubstring` (case-insensitive) em `[merchantCode, merchantName, merchantLocation].join(' | ')` | `spec:268-277` |
| Paridade UI (regra #14) | `rowContaining(expectedSubstring).first()` visível em ≤10 s | `spec:280-283` |

> **Ressalva de encoding (F-002b):** o predicado de match gateia apenas a forma estrutural (método GET + path + `search=` presente + 200) e decodifica a URL antes do substring-match, aceitando `+` ou `%20` para espaço (`spec:226-247`). Não acoplar correção do teste à minúcia de encoding de URL.

---

## CT-02b — [negativo] Busca por "Tampa" NÃO retorna Synchrony (city não é coluna buscada)

```gherkin
Dado que a página Merchants do AMS está carregada com a tabela renderizada
Quando o agente busca pelo termo "Tampa"
Então o GET /uown/merchants retorna HTTP 200
E o merchant Synchrony (pk=7049), cuja city é "Tampa", NÃO aparece nos pks retornados
E toda linha retornada contém "tampa" em um de {merchantCode, merchantName, merchantLocation} — nunca apenas em city ou state
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP | `200` | `spec:332` |
| Âncora negativa — Synchrony | `pks` do content NÃO contém `7049` (`SYNCHRONY_PK_QA1`) | `spec:335-342` |
| Contrato de colunas buscadas | para TODA linha retornada, `[merchantCode, merchantName, merchantLocation].join(' | ')` (lowercase) inclui `tampa` | `spec:352-361` |

> **Por que P1/negativo importa:** confirma que `city` e `state` estão FORA do contrato de busca. Um vazamento silencioso de `city` para o predicado de busca seria invisível para ops mas quebraria o modelo mental deles (`spec:14-16`, `spec:54-57`). A âncora Synchrony (city="Tampa") é o oráculo definitivo; a linha joe-testy-furniture-tampa (pk=1328) casa legitimamente porque "Tampa" está no merchantName/merchantLocation (`spec:349-351`).
>
> **[HYPOTHESIS]** o pk 7049 de Synchrony e o pk 1328 foram registrados via MCP em qa1 (2026-05-22, `spec:54-57`). São específicos de qa1 — em outro ambiente o oracle da âncora precisa ser rerresolvido via SELECT. Não fabricar esses pks para outros envs.

---

## CT-03 — Filtro isActive tri-state (true | false | omitido) dirige URL + totalElements

```gherkin
Dado que a página Merchants do AMS está carregada em qa1
Quando o agente aceita a carga default (Active)
Então o GET carrega isActive=true e totalElements_active maior que zero
Quando o agente troca o combobox para "Inactive" e busca
Então o GET carrega isActive=false e totalElements_inactive maior que zero
E totalElements_inactive é maior que totalElements_active (baseline qa1: ~1124 active vs ~3795 inactive)
Quando o agente limpa o filtro Active e busca
Então o GET dispara SEM o parâmetro isActive
E totalElements_all é aproximadamente igual a active + inactive (tolerância ±1 para races entre passos)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Ambiente | qa1 apenas (`test.skip` fora de qa1 — asserção depende de contagens qa1-específicas) | `spec:368` |
| Estado 1 — default | URL contém `isActive=true`; `activeTotal > 0` | `spec:374-385` |
| Estado 2 — Inactive | URL contém `isActive=false`; `inactiveTotal > 0` | `spec:389-400` |
| Ordem de grandeza | `inactiveTotal > activeTotal` | `spec:405-408` |
| Estado 3 — omitido | URL NÃO casa `/[?&]isActive=/`; dispara após `clearActiveFilter()` + Search | `spec:411-426` |
| Conservação de total | `abs(allTotal - (activeTotal + inactiveTotal)) <= 1` | `spec:432-435` |

> **Nota de widget (a11y):** o combobox Active é um react-select customizado — o `<input type="checkbox">` nativo não tem accessible name; o handler `onClick` fica na ROW `<div>` (`[class*="customOptionStyles"]`), não no input (`ams-merchants.page.ts:81-109`). Limpar o filtro = destogglar via clique na row + `Escape` (`ams-merchants.page.ts:143-160`). A cobertura automatizada tri-state via UI foi originalmente reclassificada como OBSERVAÇÃO na SPEC (`spec.md` linha 700) por defeito de a11y do widget, mas o spec-código a implementa em S3 — este CT reflete o comportamento realmente asserido.

---

## CT-04 — Página Users: getAllAvailableMerchants é lazy-loaded só no clique "Add User"

```gherkin
Dado que o agente de ops está autenticado no AMS em qa1 com viewport 1440×900
Quando o agente navega para a página Users e a tabela renderiza
Então ZERO chamadas a GET /uown/getAllAvailableMerchants ocorrem durante a carga da página
Quando o agente clica em "Add User"
Então exatamente 1 GET /uown/getAllAvailableMerchants é disparado e retorna HTTP 200
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Ambiente | qa1 apenas (`test.skip` fora de qa1) | `spec:442` |
| Carga da página — zero eager | array de chamadas a `/getAllAvailableMerchants` durante load = `[]` | `spec:466-471` |
| Clique Add User — status | `GET /uown/getAllAvailableMerchants` retorna `200` | `spec:473-482` |
| Clique Add User — contagem | exatamente `1` GET a `/getAllAvailableMerchants` após o clique | `spec:483-489` |
| Path novo (não legado) | endpoint é `/uown/getAllAvailableMerchants`, NÃO `/uown/los/getAllAvailableMerchants` (movido no MR!1430) | `spec:52`, `ams-users.page.ts:1-8` |

> **Regressão que este CT protege:** reverter o MR!170 reintroduziria carga eager (N+1 / page-load lento) na página Users (`spec:18-19`, `spec.md` linha 145). O listener é inscrito ANTES de qualquer navegação (`spec:454`).

---

## Log de Atividade (Regra #13)

**N/A por design.** `GET /uown/merchants` e `GET /uown/getAllAvailableMerchants` são operações de **listagem/leitura** — não são business actions e não escrevem em `uown_los_lead_notes` nem em tabela de auditoria conhecida (`spec.md` §Activity Log / linha 168, 588). A exceção da regra #13 (passos puramente read-only) aplica-se explicitamente. Se Marcos confirmar futuramente que existe uma tabela "merchant viewed" audit, adicionar um CT S_LOG — até lá, ausência de log é comportamento esperado, não falha.

---

## Pré-condições

- **Login AMS:** o spec loga fresco a cada teste via `LoginPage` com credenciais `manager` (`spec:105-115`) — o AMS não tem projeto de auth-setup / storageState ainda.
- **Viewport 1440×900** obrigatório (`spec:98`, regra #15).
- **Merchant preflight (regra #12): PULADO** — teste de listagem/busca não pode mutar config de merchant. Não invocar `ensureMerchantReady` (`spec:32`).
- **Test data hierarchy (regra #9): exceção documentada** — a feature é um endpoint de listagem sobre a tabela canônica `uown_merchant`; âncoras existentes (Synchrony, KS3015, Hawaii QPO, `5348121`) são as fixtures de contrato. Criar merchants frescos não exercitaria a busca-por-substring melhor (`spec:33-35`).
- **Ambiente:** qa1 (R1.52.0 deployado). qa2 ainda no POST legado — fora de escopo (`spec:39`). CT-03 e CT-04 têm `test.skip` fora de qa1.

## Gaps / [HYPOTHESIS] — decisões de follow-up

- **[HYPOTHESIS] Colunas de busca `legalName` / `zipCode` / `primaryContactName`:** a SPEC AC-3 declara 6 colunas no JPA, mas o envelope JSON vivo expõe só 3 (`merchantCode`/`merchantName`/`merchantLocation`). Cobertura das 3 restantes está adiada até Marcos confirmar se fazem parte do contrato público (`spec:68-73`, `spec.md` linha 677 PENDING-CONTEXT). Este oracle NÃO asserta essas 3 colunas — não fabricar checkpoints para elas.
- **[HYPOTHESIS] Sort default `refMerchantCode ASC` (AC-5):** a SPEC lista como AC, mas o spec-código deste pass **não asserta** ordenação. Sem checkpoint — gap de cobertura conhecido.
- **[HYPOTHESIS] `lastAccessTime` / "Last Login" (AC-6):** observado NULL para todo merchant em qa1 (`spec:36-37`, `spec.md` F-OOS-1). Não asserted como falha neste pass (rule #10 — observação em dado pré-existente não é bug). Sem checkpoint.
- **[HYPOTHESIS] Exclusão `is_deleted=true` (AC-4 parcial):** não coberto — sem mutação DB e sem linha flaggeada confirmada (`spec:24`).
- **Âncoras pk (7049, 1328) são qa1-específicas** — rerresolver via SELECT em outro ambiente antes de reusar (CT-02b).
- **`GET /uown/merchants` não está no `appendix-b-endpoints.md`** — o appendix cataloga endpoints SVC de config/sweep/pagamento, não o endpoint AMS de merchants. Grounding do contrato vem do spec + comentário de Marcos na SPEC, não de business-rules canônica. Recomenda-se backfill do endpoint no appendix-b pelo time.

---
name: ssn-test-modalities
description: Carregue ao planejar teste de application por programa: 13m, 13m+16m, ou 16m Second Look. Define SSNs de teste, regras de elegibilidade por merchant config, expected approval path.
disable-model-invocation: true
---

# SSN Test Modalities - UOWN Leasing

> **Proposito:** tabela de decisao para SSNs de teste e receitas para criar aplicacoes nas 3 modalidades de programa (13m apenas / 13m+16m / 16m apenas).
>
> **Mandatario para:** `qa-planner`, `qa-implementer`, `qa-debugger`, e `/qa-flow`.

> Catalogo completo de SSN values, ambientes, e brand coverage: [references/ssn-values.md](references/ssn-values.md)

---

## 1. Tabela de decisao - qual SSN usar

| Cenario | SSN | Merchant | Notas |
|---------|-----|----------|-------|
| Aprovacao generica (qualquer modalidade) | `generateTestSSN(true)` | qualquer | Default para maioria dos testes |
| Denial generico | `generateTestSSN(false)` (termina em 9) | qualquer | UW_DENIED imediato **so em sandbox/qa1** (mock). Em qa2 TERRACE_FINANCE aprova via BlackBox/ABB - ver caveat qa2 §6 |
| 16m direto (single submission) | `888880916` (ou qualquer sufixo `916`) | qualquer com 16m ativo | NAO amarrado a profile |
| Second Look (denied 13m -> approved 16m) | `100000053` | TireAgent + CA + profile Brian | Amarrado a profile especifico |
| 13m + 16m (cliente escolhe) | `generateTestSSN(true)` | Kornerstone com 16m + bank data | planId seleciona modalidade |
| BUGGY - evitar | `888888888` | - | NullPointerException no svc |

---

## 2. Regra de elegibilidade 16m - INVIOLAVEL

> **Axioma:** a possibilidade de criar aplicacao 16 meses depende **exclusivamente da configuracao do merchant**, NAO da brand (UOWN vs Kornerstone).

### Condicao necessaria e suficiente

Merchant suporta 16m se tem `uown_merchant_program` com `term_in_months=16` + `is_active=true` + janela de data valida.

### Implicacoes

- **Qualquer merchant** (UOWN ou Kornerstone) com 16m configurado suporta
- NAO existe "brand X nao oferece 16m por design"
- `ensureMerchantReady` valida o contrato automaticamente
- Contrato canonico: `src/data/merchant-config-contract.ts`

---

## 3. Modalidades de programa - receitas

### Modalidade A - 13m apenas

| Campo | Valor |
|-------|-------|
| SSN | `generateTestSSN(true)` |
| Merchant | qualquer sem 16m ativo |
| Bank data | NAO enviar |

**Expected:** `paymentDetailsList` contem apenas `planId` padrao `*13`.

### Modalidade B - 13m + 16m (cliente escolhe)

| Campo | Valor |
|-------|-------|
| SSN | `generateTestSSN(true)` |
| Merchant | Kornerstone (ex: `KS3015`) com 13m E 16m ativos |
| Bank data | `TEST_BANK.DEFAULT_ROUTING` + `TEST_BANK.DEFAULT_ACCOUNT` |

**Fluxo:** `sendApplication` retorna ambos -> `getMissingFields(shortCode, planId)` -> `submitApplication` com planId escolhido.

### Modalidade C.1 - 16m direto (preferida)

| Campo | Valor |
|-------|-------|
| SSN | `888880916` (sufixo `916` forca EligibleTerms 16) |
| Merchant | qualquer com 16m ativo |
| Profile | qualquer valido |

> **Route B — merchant 16m-only por programa (Daniel's clone `OL90205-0079_clone`, qa2, 2026-06-22):** neste clone EligibleTerms 16 vem do merchant ser **16m-only por programa** (não do sufixo SSN). Logo **QUALQUER SSN aprovador** rende 16m — um `generateTestSSN(true)` com sufixo `916` fresco funciona; **NÃO está amarrado** ao sticky `082390916`. Preferir SSN fresco aqui (ver caveat de routing de assinatura abaixo e [[application-lifecycle]] #132). `[test-execution:qa2, leads 16865/16866/16867]`.

### Modalidade C.2 - 16m Second Look

| Campo | Valor |
|-------|-------|
| SSN | `100000053` |
| Merchant | TireAgent |
| Profile | Brian/hayden/Columbus/92821/CA (INVIOLAVEL) |

**Fluxo:** 1a submissao sem bank data -> UW_DENIED + preview 16m -> 2a submissao com bank data -> UW_APPROVED 16m.

> **Gatilho do `tam_score` (GDS snapshot):** a familia Second Look `100000053` (TireAgent) e o caminho que produz `tam_score` em `uown_los_uwdata`/`uown_sv_uwdata` — mas SO quando a 2a submissao aprova 16m. Em **qa2 essa modalidade DENEGA e short-circuita** (Second Look validado so em **stg**), logo `tam_score` e **inalcancavel em qa2** (`count=0` sobre 6046+2037 linhas, discovery 2026-06-19). O env-alvo p/ `tam_score` (stg vs dev2) esta **PENDENTE de confirmacao do Marcos** — nao afirmar como fato. O outro campo, `npm_segment`, vem de **qualquer decisao GDS 16m** (Kornerstone/UOWN/PayTomorrow) e NAO esta amarrado a SSN. Detalhe: `docs/knowledge-base/npm-segment-tam-score-snapshot-routing.md`.

### Modalidade D - Denied

| Campo | Valor |
|-------|-------|
| SSN | `generateTestSSN(false)` |

**Expected:** UW_DENIED imediato.

---

## 4. Checklist obrigatorio (spec-test)

Ao planejar CTs de feature que envolve `sendApplication`:

- [ ] CT para **Modalidade A (13m apenas)** planejado?
- [ ] CT para **Modalidade B (13m+16m)** planejado?
- [ ] CT para **Modalidade C (16m)** planejado?
- [ ] CT para **Modalidade D (denied)** planejado?
- [ ] Cada modalidade tem CT para UOWN E Kornerstone?

### Quando omitir modalidade

- Feature 100% servicing/portal-only (sem sendApplication) - todas N/A
- Feature especifica de uma modalidade - justificar no SPEC
- Fixture limitada no ambiente-alvo - documentar como `test.skip` condicional

Toda omissao DEVE ser explicita. Silent skips nao sao aceitos.

---

## 5. Brand coverage - UOWN + Kornerstone (INVIOLAVEL)

> Toda feature que cria aplicacao DEVE ter CTs para **ambas as brands**.

### Matriz brand x modalidade

| Modalidade | UOWN | Kornerstone |
|------------|------|-------------|
| A - 13m | merchant UOWN sem 16m | merchant KS sem banking/BIN |
| B - 13m+16m | UOWN com ambos + banking | `KS3015` + banking + BIN |
| C.1 - 16m direto | UOWN com 16m + SSN 916 | KS1337 + SSN 916 |
| C.2 - Second Look | TireAgent + 100000053 | N/A documentado |
| D - Denied | `generateTestSSN(false)` | `generateTestSSN(false)` |

### Checklist de brand coverage

- [ ] Cada modalidade tem CT para UOWN?
- [ ] Cada modalidade tem CT para Kornerstone?
- [ ] Cada CT Kornerstone valida `uown_sv_account.company='KORNERSTONE'`?
- [ ] CTs com UI/email tem assertions de styling por brand?
- [ ] Cross-contamination check (brand A nao tem marcadores de brand B)?

Silent skip de brand = violacao.

### 5.1. Kornerstone brand-parity findings — abertos, NAO confirmados

> Descobertos ao validar snapshot por brand. Ambos `[HIPÓTESE]`/`[OBSERVAÇÃO]` — NAO tratar como bug confirmado; candidatos a confirmar com dev/PO.

- **OQ-KS-1 `[HIPÓTESE]`:** `uown_los_lead.company='UOWN'` (propagando para `uown_sv_account.company`) em leads funded de **KS1011 / merchant_pk=315**, apesar de `client_type=KORNERSTONE`. Hipotese: a **brand e carimbada na CRIACAO do lead**, NAO no funding/copia do snapshot — o proprio snapshot carrega corretamente `merchant_pk=315` + `fraud_threshold=5`. Reproduzido **3×** em qa2. Candidato a app issue — confirmar com dev/PO antes de classificar como bug. Impacta o checklist de brand coverage (§5): a assertion `uown_sv_account.company='KORNERSTONE'` pode falhar legitimamente por este motivo — investigar a fonte antes de marcar o teste como red. Tag: `[db-observation:qa2,2026-06-17]` + `[test-execution:qa2, KS1011/merchant_pk=315]`.
- **OQ-KS-2 `[OBSERVAÇÃO]`:** KS `submitApplication` retorna `"Failed to verify identification"` apesar de `is_seon_id_check_required=FALSE`. Co-sinal de OQ-KS-1 (ambos em fluxo Kornerstone qa2). Tag: `[api-response:submitApplication]` + `[test-execution:qa2]`.

---

## 6. Principios

- `generateTestSSN(true|false)` e o gerador canonico - NUNCA fixar SSN para testes genericos
- Ultimo digito `9` forca denial no motor UW mockado (convencao sandbox/qa1 — caveat qa2 §6: no-op em qa2; e a memoria datada `ssn9-denial-gate-off-sandbox-qa1` indica gate OFF tambem em sandbox/qa1 desde 2026-06-17 → cross-check antes de assumir denial). Para denial deterministico em qa2 usar `auto_deny_application` (§6.1)
- Sufixo `916` forca EligibleTerms 16 no mock BlackBox (qa1 confirmado 2026-05-24)

### Caveat qa2 - UW denial determinism e environment-specific (INVIOLAVEL)

> O "ending-in-9 -> UW_DENIED" e um gate de **test-server** controlado por config boolean, NAO uma propriedade da credit engine. So dispara em **nao-prod** e quando a flag `deny.ssn.ending.with.9` esta `true`. Em **sandbox/qa1** a flag esta efetivamente `true` (nega); em **qa2** esta efetivamente `false` (aprova).

- **Config que controla:** `com.uownleasing.svc.service.SendApplicationService.deny.ssn.ending.with.9` (boolean, default no codigo `true`). Codigo: `svc/.../application/SendApplicationService.java:361-365` — nega se `!isProduction()` **E** flag `true` **E** `mainSSN.endsWith("9")`. Store: tabela `uown_configuration_management(key,value)` (key ausente em qa2 → default `true` deveria valer; override `false` vem de properties de deploy acima da tabela, `[HIPÓTESE]`). **TESTADO 2026-06-16: setar a key `=true` (via `POST /ConfigurationManagement/createOrUpdateConfig` + `forceReloadConfig`) NAO bastou em qa2** — ending-in-9 ainda aprovou (lead 16583). A denial tambem exige `!isProduction()`; qa2 e tratado como prod p/ esse gate (ou build defasado). Config sozinha NAO habilita denial em qa2 → usar sandbox/qa1 ou escalar dev/DevOps. (Config foi revertida.)
- `[CONFIRMADO]` (2026-06-16, qa2): um lead terraceFinance com SSN ending-in-9 retornou **UW_APPROVED** com **0 vendor calls** em `uown_los_outbound_api_log` (o gate nao disparou → BlackBox decidiu) - `[db-observation:uown_los_lead_notes]`. Reproduzir com `src/scripts/probe-uw-denial-engine.ts <env> <leadPk>`.
- **Antes de usar ending-in-9 como trigger de denial fora de sandbox/qa1:** confirmar a engine decisora via `uown_los_outbound_api_log` / `uown_los_lead_notes`. Se a engine real decide, o mock nao dispara.
- **SUPERSEDED (parcialmente):** o ending-in-9 mock e no-op em qa2, mas **agora EXISTE um trigger de denial deterministico em qa2** — `uown_merchant.auto_deny_application=TRUE` (ver §6.1 abaixo). Isso substitui o gap anterior que dizia "sem trigger UW_DENIED deterministico em qa2". Nuance: auto-deny e PRE-UW, NAO exercita o decline literal da engine UW (ver §6.1).
- Para testes que precisam de um **lead DENIED** em qa2: usar `auto_deny_application` (§6.1). Para testar o **decline literal da engine de underwriting** em qa2/prod-like: rodar o cenario negativo em sandbox/qa1 (mock honrado) OU obter trigger `UW_DENIED` da engine confirmado pela PO/dev — auto-deny e pre-UW e nao substitui esse AC especifico. Pre-UW deny (Blacklist button -> BLACKLIST_DENIED, no-business-in-state) NAO e "denied by underwriting" e nao substitui o AC de decline da engine.
- Cross-link: [[application-lifecycle]] Pitfall #109; `docs/knowledge-base/underwriting-and-funding-test-data-paths.md`; [[fraud-vendors-knowledge]] §5; memoria datada `ssn9-denial-gate-off-sandbox-qa1` (gate OFF tambem em sandbox/qa1 desde 2026-06-17 — cross-check, nao copiar cego).

---

### 6.1. Receita de denial DETERMINISTICO em qa2 — `auto_deny_application` (INVIOLAVEL)

> **`uown_merchant.auto_deny_application = TRUE` e o trigger de denial deterministico e vendor-independent para qa2.** Independe da engine UW (real ou mock), independe de SSN.

- **Onde dispara:** origination pipeline **Step 2 `merchantAutoDenyCheck`** — **PRE-UW**, ANTES do underwriting engine.
- **Resultado:** `uown_los_lead.lead_status='DENIED'` (motivo interno `MERCHANT_AUTO_DENIED`) — **distinto de `UW_DENIED`** (o decline da engine UW). Ambos os valores existem como estados separados em qa2.
- **Activity log:** `Executed: merchantAutoDenyCheck → Application denied as merchant is set to be auto denied`.
- **Quando usar:** quando o teste precisa de um lead **DENIED** em qa2 (o mock ending-in-9 e no-op em qa2 — ver §6 e memoria `ssn9-denial-gate-off-sandbox-qa1`).
- **Nuance critica:** auto-deny e denial **PRE-UW** — **NAO exercita um decline literal da engine de underwriting**. Para AC que exige especificamente "denied BY underwriting", isto NAO substitui (usar sandbox/qa1 ou trigger de engine confirmado).
- **Mutacao do merchant:** ligar/desligar `auto_deny_application` e UPDATE no DB (Exception 2/3 do CLAUDE.md) — exige autorizacao explicita do user; preferir setup via UI de merchant config quando disponivel. NAO deixar o flag ligado apos o teste se outras suites usam o mesmo merchant.
- **Tag:** `[db-observation:qa2,2026-06-17]` + `[test-execution:qa2, leads 16597/16598]`.
- SSN `100000053` e amarrado a profile exato - reusar com dados diferentes causa ADDRESS_MISMATCH
- Kornerstone (KS*) sempre recebe 16m por rota separada (independente de sufixo SSN)
- Brand e ortogonal a modalidade - depende da config do merchant, nao do nome

### Routing do template por CUSTOMER state — Daniel's clone `OL90205-0079_clone` (qa2, 2026-06-22)

> **CORREÇÃO da nota antiga "INSTORE → store-state CA template" (resolve Open Question Q1 do SPEC `docs/scenarios/ohio-scenario3-contract-validation-spec.md`):** o clone roteia o template GowSign pelo **CUSTOMER state**, NÃO pelo store state CA. Customer OH → `OH_2025_SAC_16_MONTHS`. `[CONFIRMADO]` em qa2 (leads 16865/16866/16867) — contradiz a regra documentada "INSTORE roteia por merchant state". Antes de confiar na regra INSTORE→merchant-state para este clone, **assertar o template selecionado** (`assertSelectedTemplateForLead`). Cross-link: [[gowsign-knowledge]] OH render facts, [[volatile-knowledge-registry]] §17 (GowSign state-routing).

---

## 7. Referencias cruzadas

- Business rule: `docs/business-rules/02-originacao-pipeline.md`
- Brand/company enum: `Company.java` (`UOWN`, `KORNERSTONE`)
- Merchant data: `src/data/merchants.ts`
- Test cards (BINs): `src/data/test-cards.ts`
- Test bank: `src/config/constants.ts`
- SSN generator: `src/config/constants.ts` - `generateTestSSN(approved: boolean)`
- Application lifecycle: [[application-lifecycle]]

> Detalhes de SSN values, ambientes confirmados, queries de validacao, e brand styling checks: [references/ssn-values.md](references/ssn-values.md)

---
paths:
  - "tests/**/*.ts"
---

# Test Rules

## Naming Convention (task tests from GitLab issues)

```
Pattern:   {milestone}_{camelCaseTitle}
Example:   R1.49.1_separateShortCodeInANewEntity
Location:  docs/taskTestingUown/{testName}/{testName}.spec.ts
Project:   task-testing-origination  OR  task-testing-servicing  (tag-selected — see below)
```

> Test/dir names carry the milestone + a descriptive camelCase title only — **do not append the GitLab task number** (task IDs are not committed). Track the source task in your tracker, not in the filename.

Non-task tests: `tests/e2e/{portal}/` or `tests/api/`

### task-testing project split — MANDATORY tag (discovered 2026-05-24)

O projeto `task-testing` foi splitado em `task-testing-origination` e `task-testing-servicing` para evitar `storageState`/`baseURL` mismatch quando uma spec cobre os dois portais.

**Regra:** toda spec em `docs/taskTestingUown/` DEVE declarar `@origination` OU `@servicing` no campo `tag` do `testData`:

```typescript
const testData = [{
  env: 'qa1',
  tag: '@origination',   // seleciona task-testing-origination (baseURL + storageState Origination)
  // ou
  tag: '@servicing',    // seleciona task-testing-servicing (baseURL + storageState Servicing)
}];
```

Se uma spec usa AMBOS os portais: separar os CTs que acessam Origination (tag `@origination`) dos que acessam Servicing (tag `@servicing`) — nunca misturar no mesmo CT. Sem essa tag, o Playwright seleciona o projeto errado e a página carregada não corresponde ao portal esperado. Ver [[application-lifecycle]] pitfall #61.

## Mandatory Principles

1. **Independence**: Every test creates its own data — no shared state between tests
2. **DRY**: Reusable logic in helpers or page objects — never duplicate
3. **Own setup**: Tests call API to create preconditions — see § Test Data Hierarchy below
4. **Implicit cleanup**: Use unique `runId` + `email` — no manual teardown needed
5. **Tags**: `@smoke`/`@sanity`/`@regression` + `@critical` when applicable — use `TestTag` enum
6. **UI-first** (CLAUDE.md inviolable rule #15): default UI; API only when feature has no UI affordance — see § UI-First Principle below

## UI-First Principle (MANDATORY — CLAUDE.md rule #15)

> **Regra inviolável:** se a feature tem fluxo de usuário no portal, o teste DEVE exercer esse fluxo via browser. API-only é EXCEÇÃO restrita.

### Quando UI é obrigatório

- Feature tem tela ou interação de usuário (Origination/Servicing/Website/AMS/Merchant portal)
- Validação visual: placeholders renderizados, badges, conteúdo de iframe (GowSign/SignWell), PDFs gerados, emails formatados
- Fluxo customer-facing: completeApplication, signing, payment, refund, support actions

### Quando API-only é aceitável (EXCEÇÕES)

- **Endpoints admin/ops sem UI:** `PATCH /uown/svc/gowsign-templates/{id}`, `triggerScheduledTask`, `resumeScheduledTask`, internal CRUD
- **Setup/precondição:** acelerar teste criando lead via `sendApplication` antes de exercer o fluxo de signing UI
- **Validação DB cross-cutting:** queries de assertion sobre rows persistidos (status transition, log presence)
- **API-only com justificativa explícita no spec** quando o resultado da feature SÓ é observável via API (ex: webhooks, response payloads)

### O que NÃO pode ser substituído por API

- **Conteúdo renderizado** (PDF, email body, iframe content): bug de rendering só é detectável visualmente. Ler log de backend ≠ confirmar que o usuário vê o valor correto
- **Brand/styling** (logos, cores, footers): exige inspeção visual
- **Interação fluida** (modal abre, redirect funciona, click muda estado): comportamento UI

### Origem da regra

2026-05-06 — BUG-01 (placeholders `{{securityDeposit}}`/`{{costPriceWithFeeNoTax}}` vazios em documentos legais) foi descoberto **manualmente pelo Fernando** porque os testes automatizados API-only só liam log de backend (`[DocumentDispatchService][GowSign] missing N tokens`) sem renderizar o PDF. Tests UI-driven teriam falhado visivelmente no iframe GowSign — bug seria caught em CI antes de qualquer tester manual.

### Checklist para spec-test / impl-e2e / impl-api

Antes de marcar um teste como pronto:

- [ ] A feature tem UI? Se sim, o test exerce o fluxo via browser?
- [ ] Validações visuais (renderização de PDF, conteúdo de iframe, badges) usam page object + assertions sobre o DOM/PDF, não só logs?
- [ ] Se o teste é API-only, o spec/comentário JUSTIFICA explicitamente por que UI não é viável?
- [ ] Se um helper API foi escolhido para acelerar setup, o spec deixa claro qual parte do fluxo ainda é UI (ex: "criar lead via API → assinar via UI")?

### Anti-padrões

```
❌ "API-only é mais rápido" — sem justificar perda de cobertura visual
❌ Validar bug de rendering via log de backend (`expect(notes).not.toContain('missing'))`)
❌ Skip do iframe GowSign/SignWell porque "é flaky"
❌ Setup via API + assert via API quando o usuário interage via UI no fluxo real
```

```
✅ Setup via API (criar lead em CC_AUTH_PASSED) + UI completa o resto (signing iframe, download)
✅ API-only para PATCH /admin endpoints (sem UI exposta) com comentário justificando
✅ Hybrid: drive lead via UI completa quando o defeito a caçar pode ser de UI/render
```

## Application Lifecycle Protocol (MANDATORY when feature creates applications)

> **Regra inviolável:** qualquer teste que envolva `sendApplication` DEVE seguir a sequência canônica documentada em skill [[application-lifecycle]]. Violações conhecidas causam falhas bobas recorrentes (DENIED, 400, 500, timeouts).
>
> Agents que criam testes OU debug (`qa-planner`, `qa-implementer`, `qa-debugger`) DEVEM carregar esse protocolo antes de escrever/corrigir código.

**Checklist rápido (detalhes no protocolo):**

- [ ] `buildTestData` sem `emailOverride` (email único por run — evita DataMismatchStep)
- [ ] Kornerstone merchant → `bankData` no body do sendApplication
- [ ] `submitApplication` sempre precedido de `getMissingFields(shortCode, { planId })` **e `submitResp.ok` assertido explicitamente** (falha silenciosa → lead preso em `CC_AUTH_PASSED` → `settleApplication` 500; ver [[application-lifecycle]] pitfall #81)
- [ ] CC: `TEST_CARDS.MASTERCARD_APPROVED` (nunca VISA_APPROVED — rollback em qa)
- [ ] Ordem: `SIGNED → settle → FUNDING → FUNDED → ACTIVE`
- [ ] SETTLED_IN_FULL via `makeCreditCardPayments(SETTLEMENT)` — nunca UPDATE direto (sem payment history → email template falha)

## E-sign Provider Routing — Por Disponibilidade de Template

> **Regra (qa2, confirmada por dev 2026-04-28):** o e-sign provider é determinado pela **disponibilidade de template GowSign para o estado do lead**, NÃO por uma flag global no merchant.
>
> **Comportamento observado:**
> - Existe template GowSign para o estado → `uown_esign_document.client = 'GOWSIGN'`
> - Não existe template GowSign para o estado → fallback para `merchant.esign_client` (default `SIGNWELL`)
>
> **Estados com template GowSign em qa2 (28-04-2026):** somente **CA**. Todos os outros caem no fallback Signwell.
>
> **🔄 SUPERADO (2026-06-21):** templates GowSign foram distribuídos para MAIS estados desde abril. Live-proven: TerraceFinance (`OL90202-0001`, ONLINE) com **customer state NY** assina via **GowSign** (`uown_esign_document.client='GOWSIGN'`, status SIGNED via `[EsignRedirectService][updateSignStatus]` + `[ContractService][isLeaseOrLeaseModSigned]`), NÃO o fallback Signwell. → **NÃO assumir `state != 'CA' → Signwell`**; verificar `uown_esign_document.client` real para o estado/env alvo antes de escolher merchant para cobertura GowSign vs Signwell. Nota: na cerimônia GowSign, `signGowSignInFrame` loga `completedMessage=false` (postMessage "completed" não capturado) mas o backend AINDA transiciona para SIGNED via redirect — **não é falha**. Ver [[volatile-knowledge-registry]] (GowSign state-routing drift).
>
> **⚠️ INSTORE merchant exception (descoberto 2026-05-06:** para merchants com `merchant_type='INSTORE'`, o backend usa `merchant.state` (estado da loja física) ao invés do customer state para o lookup de template. Verificado em `EsignService.loadLeadEsignContext()` linhas 194-197 (svc R1.51.1):
>
> ```java
> if (merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE) {
>     state = merchant.getMerchantInfo().getState();
> }
> ```
>
> **Implicações:**
> - Daniel's Jewelers (`OL90205-0079*`, INSTORE, state=CA) → SEMPRE roteia por CA, qualquer customer state
> - Saslow's Jewelers CA (`OW90337-0001`, INSTORE, state=NC) → SEMPRE roteia por NC, qualquer customer state → SIGNWELL fallback
> - TireAgent (`OW90218-0001`, ONLINE, state=CA) → usa customer state (comportamento normal)
>
> **Como descobrir merchant_type:** `SELECT pk, ref_merchant_code, merchant_type, state FROM uown_merchant WHERE ref_merchant_code = $1`. INSTORE em qa2 = 34 merchants (1.5k ONLINE).
>
> **Para testes parametrizados por estado:** validar `merchant.merchant_type` ANTES de assumir que customer state determina routing — INSTORE merchants ignoram customer state. Não usar INSTORE merchant para multi-state coverage de routing GowSign vs SignWell.
>
> **Evidência empírica — TireAgent (OW90218-0001) qa2:**
> - leads CA 15741–15745, 15748+ → GOWSIGN
> - leads CO 15746–15747 → SIGNWELL
> - `uown_merchant.pk=34.esign_client = 'SIGNWELL'` (mesmo valor durante ambos os waves)
>
> **Implicações para testes:**
> - Teste de **GowSign signing** → `state: 'CA'` (único estado com template até nova distribuição)
> - Teste de **Signwell signing** → qualquer estado válido `≠ CA`
> - Teste de **Protection Plan** + **GowSign** simultâneos → bloqueado em qa2 enquanto:
>   - (a) CA não tem PP oferecido (log do lease "Protection plan was not offered" — restrição regulatória/legal de CA, não bug)
>   - (b) Demais estados onde PP funciona caem no Signwell (sem template GowSign)
> - Quando time de produto distribuir templates GowSign para outros estados, **revalidar essa regra** e atualizar com lead_pk de evidência

## Buddy Insurance Widget — Loop Conhecido em qa2 STAGING

> **Bug ativo (origination/components/purchase-insurance/index.tsx:107-127):** Em qa2, o `BuddyOfferElement` carrega de `staging.embed.buddy.insure` que tenta enviar analytics para `aggregate-analytics.netlify.app/api/send` — endpoint sem `Access-Control-Allow-Origin` → CORS error. Pode corromper o `offerElementResponse`, fazendo `utilityStore.createProtectionPlan` falhar.
>
> **Sintoma:** opt-in/opt-out clica → submit "engole" sem feedback visível → usuário acha que voltou para Terms. Frontend só destrava no 3º clique consecutivo (`if (submitFailCount > 1)`).
>
> **Como aplicar em testes automatizados:**
> - Teste que precisa passar pelo Buddy widget em qa2 deve considerar até 3 cliques no botão Submit antes de assumir falha de timeout
> - `TermsOfAgreementPage.acceptAndProceedWithProtectionPlan(true)` em qa2 pode necessitar retry; em qa1 funciona direto (Buddy não falha)
> - Reportado ao dev em 2026-04-28; até correção, marcar testes Buddy-dependentes como `@flaky-tracked` se rodarem em qa2

## Activity Log Validation (MANDATORY — every business action)

> **Regra inviolável (CLAUDE.md #14):** *"If there is no activity log, that means nothing is happening."* — Priyanka Namburu, daily UOWN 2026-04-28.
>
> Toda ação de negócio executada pelo teste DEVE ter validação explícita do activity log/note gerado. Ausência de log = falha de implementação, não comportamento esperado.

### O que conta como "ação de negócio"

Disparou um destes? → Precisa validar log:

- `sendApplication` / `submitApplication`
- Signing event (SignWell, GoSign, redirect, webhook callback)
- Payment attempt (CC, ACH, PayNearMe, Sticky retry)
- Refund (full/partial, CC/ACH)
- Recovery attempt (Sticky webhook recebido)
- Status transition do lease/account (UW_APPROVED → SIGNED → SETTLED → FUNDING → FUNDED, etc.)
- Vendor callback (qualquer webhook recebido de provedor externo)
- Mutação via SVC (e-mail enviado, SMS, link de cobrança, opt-out)

### Como validar

Toda fase do pipeline deve aplicar:

**Planning (`qa-planner`)**
- Cada cenário lista o(s) log(s) esperado(s) na seção "Validações"
- Formato: `uown_los_lead_notes` (ou tabela específica do domínio) — pattern textual + ordem cronológica

**Implementação (`qa-implementer`)**
- `test.step('validate activity log', ...)` após cada ação de negócio
- Use `db.waitForRecord` / `db.getSingleRow` consultando `uown_los_lead_notes WHERE lead_pk = $1 ORDER BY pk DESC` (ou tabela correspondente)
- Assert presença do pattern esperado + assert ausência de patterns negativos quando relevante (`"not offered"`, `"rejected"`, `"skipped"`, `"denied"`)

**Validação de resultado (`qa-validator`)**
- Relatório DEVE listar log capturado por step (cita PK + texto)
- Step sem log capturado → marcar como `[INCOMPLETO]`, não `[OK]`

**Debug (`qa-debugger`)**
- Antes de hipotetizar, ler logs do lease (regra abaixo). Se a ação esperada não tem log → bug de backend (reportar) ou step não disparou (corrigir).

### Padrões mínimos de assert

```typescript
// Após sendApplication
await test.step('activity log: application submitted', async () => {
  const note = await db.waitForRecord(
    `SELECT pk, notes FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND notes ILIKE '%application%submitted%'
     ORDER BY pk DESC LIMIT 1`,
    [ctx.leadPk],
  );
  expect(note, 'application submission log must be present').toBeTruthy();
});

// Após signing event
await test.step('activity log: contract signed', async () => {
  const note = await db.waitForRecord(
    `SELECT pk, notes FROM uown_los_lead_notes
     WHERE lead_pk = $1 AND notes ILIKE '%[ContractService]%signed%'
     ORDER BY pk DESC LIMIT 1`,
    [ctx.leadPk],
  );
  expect(note).toBeTruthy();
});
```

### Quando o log NÃO é gerado

Se o backend não registra log para uma ação que deveria — isso é bug de produto, não de teste:

1. Documentar em `[ContractService][...]` ou domínio correspondente como gap
2. Abrir ticket para dev adicionar o log
3. Marcar o step de validação como `@blocked-by-missing-log` no comentário do código
4. NÃO remover o assert. NÃO marcar teste como passou. Aguardar dev incluir o log.

### Exception (única)

Steps puramente de leitura (GET, query SELECT, consulta de UI sem mutação) não precisam validar log — não geram ação de negócio.

## Debug de Erro/Divergência em Criação ou Assinatura — Inspecionar Logs do Lease ANTES de Hipotetizar

> **Regra inviolável:** quando um teste de criação de aplicação ou assinatura falhar/divergir do esperado, a **PRIMEIRA AÇÃO** é abrir o lease/conta criados e ler os logs/notes na DB (`uown_los_lead_notes` ordenado por `pk`) ou no portal Servicing (Activity tab). NÃO hipotetizar nem refatorar antes de ter lido o log.
>
> **Por quê:** o backend já registra a causa raiz em texto plano com timestamp em EST. Exemplos reais que pouparam horas:
> - "Protection plan was not offered" → revelou bloqueio por estado (CA), não por flag de merchant
> - "DataMismatchStep" → revelou email duplicado entre runs
> - "[ContractService][isLeaseOrLeaseModSigned]" → confirmou rota de signing (Webhook vs EsignRedirectService)
>
> **Como aplicar:**
> - Falha em `sendApplication`/`submitApplication`/signing → query `SELECT pk, notes FROM uown_los_lead_notes WHERE lead_pk = $1 ORDER BY pk` e leia os últimos 30
> - Comportamento ausente (PP não criado, contrato não assinado, status não progrediu) → mesma query, procurar negações: "not offered", "rejected", "blocked", "denied", "skipped"
> - Citar o log na conversa antes de propor solução. Se não houver log, citar isso explicitamente
> - Documentar a causa descoberta como nova regra (estado bloqueado, flag obrigatória, ordem de chamadas) — alimentar `application-lifecycle-protocol.md § Pitfalls`

## Test Data Hierarchy (MANDATORY — all levels: spec / implementation / orchestration / direct analysis)

> **Criar dados fresh é PADRÃO. Reusar registros existentes é EXCEÇÃO com justificativa.**
> Esta regra não é opcional e vale para spec-test, impl-e2e, impl-api, validate-results,
> debug-flaky, qa-flow command, e análises diretas. Violar esta hierarquia foi a causa
> raiz de 4 horas desperdiçadas no pipeline #491 investigando um "bug" que era apenas
> artefato de uma fixture antiga.

**Preferência (do mais ao menos preferido):**

1. ✅ **Criar conta/lead NOVO via automação (happy path completo)** — PADRÃO. Use
   `driveLeadToFunding`, `buildTestData`, `sendApplication` + `submitApplication` + `changeLeadStatus`
   encadeados. Vantagens: dados previsíveis, estado limpo, teste reproduzível, independente.

2. ⚠️ **Criar via automação + mutação via API oficial** (ex: `SvcEmailClient.createOrUpdateEmail`
   para trocar primary email após funding) — aceitável quando a mutação por API é mais rápida
   do que refazer o fluxo completo. Sempre documentar o porquê num comentário curto.

3. 🚨 **Usar conta/lead existente (fixture pré-existente)** — EXCEÇÃO. Aceito SOMENTE se:
   - Teste é GDS bypass documentado (já sem dados de aplicação), OU
   - Setup via automação levaria > 10 min por CT (custo inaceitável), OU
   - Fixture impossível de criar via automação (ex: rating computado pelo sistema
     requer histórico de pagamentos reais).

   Mesmo na exceção: requer **comentário no spec** justificando, E requer **reprodução
   em conta fresh** ANTES de classificar qualquer comportamento como bug (ver
   skill [[bug-classification]]).

4. ❌ **UPDATE direto no DB em conta existente** — PROIBIDO por padrão (CLAUDE.md
   Exception 3). Aceito somente com autorização explícita do usuário registrada na
   conversa. Mesmo autorizado, é a última opção — sempre prefere reproduzir via
   automação antes.

### Por quê

Dados pré-existentes trazem estado herdado imprevisível:
- Artefatos de pipelines/execuções anteriores
- Bugs de dados já conhecidos (ou não) por outras tasks
- Race conditions históricas que não refletem o código atual
- Estado inconsistente produzido por fixes manuais

Fresh data prova o comportamento do **código**, não do **banco**. É reproduzível,
confiável e elimina falsos positivos.

### Enforcement checklist

Aplicar em toda fase do pipeline:

- [ ] Spec tem setup via API/automação (não hardcode de PK)?
- [ ] Implementação cria fresh data via `buildTestData` / `sendApplication` / etc.?
- [ ] Evidência no relatório marca `Criado` (não `Existente`) como padrão?
- [ ] Se reuso de conta existente: comentário no código justifica + reprodução em fresh validou o comportamento?
- [ ] Se UPDATE direto no DB: autorização do user registrada na conversa?

Se qualquer resposta for NÃO → **violação**. Voltar à fase correspondente e corrigir
antes de prosseguir.

### Ver também

- skill [[bug-classification]] — regras para classificar
  comportamento como bug (exige reprodução em fresh).

## Lease State Machine

```
UW_APPROVED → CC_AUTH_PASSED → CONTRACT_CREATED → SIGNED → SETTLED → FUNDING → FUNDED
```

- SSN not ending in 9 → `UW_APPROVED`
- SSN ending in 9 → `UW_DENIED`
- Contract URL: `sendApplication` → `paymentDetailsList[idx].redirectUrl`
- E-sign: auto-detects PandaDocs vs Signwell via iframe polling
- Refund: `FUNDED → REQUEST_REFUND → REFUNDED` (UI only via PayTomorrow portal)

## Risk Tier Selection (when test creates applications)

| Tier | SSN | State | Merchant | Amount | Expected |
|------|-----|-------|----------|--------|----------|
| low | ≠9 | CA, CO, FL | TerraceFinance | $800–$1.500 | FUNDED |
| high (denied) | =9 | any | any | any | UW_DENIED |
| blocked-state | ≠9 | NJ, VT, MN, ME | ONLINE merchant | any | DENIED |

## testData Structure

```typescript
const testData = [{
  env: 'sandbox',
  riskTier: 'low',
  state: 'CA',
  merchant: 'TerraceFinance',
  merchandiseAmount: 1000,
  runId: generateRunId(),
  email: generateUniqueEmail(),
  tag: '@cicd @sandbox',
}];
```

## Anti-Patterns

```
❌ page.waitForTimeout() — use .waitFor({ state: 'visible' }) or db.waitForRecord()
❌ Assertions in page objects — assert in test, return values from page objects
❌ Import from @playwright/test directly — use @support/base-test or @fixtures/test-context.fixture
❌ ctx shared across tests — ctx is per-test only
❌ Relative imports (../../../src/...) — always use path aliases (@support/base-test.js, @config/constants.js, etc.)
❌ body as never casts — use the correct typed builder (buildSendApplicationBody, buildSubmitApplicationBody) instead
```

## Definition of Done

- `tsc --noEmit` passes
- `test.step()` wraps every logical action
- `testData` has `env`, `tag`, `runId`, `email` (see note below)
- Selectors use `SELECTORS` constant
- `ctx` used for cross-step state

## testData — runId and email

The standard `testData` pattern MUST include `runId` and `email` for test isolation:

```typescript
const testData = [{
  env: 'sandbox',
  runId: generateRunId(),
  email: generateUniqueEmail(),
  tag: '@cicd @sandbox',
}];
```

**Exception:** Tests that use `existingAccountPks` (GDS bypass, no new application created) may omit `runId`/`email` since no application data is generated. Document this explicitly in a comment:

```typescript
const testData = [{
  env: 'qa1',
  // GDS bypass: pre-seeded account PKs, no application created → runId/email not needed
  existingAccountPks: ['4442', '4439'],
  tag: '@qa1',
}];
```

Note this as a deviation from the standard pattern in a comment — do not silently omit the fields.

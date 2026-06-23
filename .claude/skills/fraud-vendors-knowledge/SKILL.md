---
name: fraud-vendors-knowledge
description: Use when a test or task touches a fraud/identity-verification vendor integrated to UOWN — SEON (ID document + selfie), Kount (login-attempt scoring + token refresh sweep), DV360 / DataView360 (UW underwriting). Triggers on file paths `src/api/clients/seon.client.ts`, `src/api/bodies/seon.body.ts`, `tests/**/*seon*`, `tests/**/*kount*`, `tests/**/*fraud*`, or mentions of "ID verification", "SEON bypass", "isSeonIdCheckRequired", "Kount token", "refreshKountAccessTokenSweep", "GDS token", "DataView360", "DV360 UAT outage", "dataview360", "outbound_api_log", "login attempt schema", "selfie liveness", "document scan QR overlay", "NeuroID simulate toggle", "neuroid repeated-call guard".
disable-model-invocation: true
---

# Fraud / Identity Vendors — UOWN domain knowledge

> SEON, Kount, DV360 — quando cada um ativa no fluxo, como simular respostas em teste, DB tables tocadas, schemas de bypass, e o outage corrente do DV360 UAT.

## Quando aplicar

- Teste de aplicação envolvendo merchant com `isSeonIdCheckRequired=true` (Kornerstone family, e.g. KS3015).
- Falha em `sendApplication` retornando 500 Apache HTML → suspeita DV360 UAT outage.
- Token expiry sweep tests — Kount / GDS.
- Login-attempt scoring (Kount) — `uown_login_attempt` joins.
- Activity log de UW mostrando `[Sentilink]`/`[Lexis]`/`[Kount]`/`[GDS]`/`[Neustar]` em `uown_los_lead_notes`.

NÃO aplicar para signing (use `gowsign-knowledge`), payment processing (use `payment-flows`), nem para Buddy widget (cobertura em `.claude/rules/testing.md § Buddy Insurance Widget`).

## Conhecimento essencial

### 1. Vendor catalog — onde cada um pesa

| Vendor | Função | Quando ativa | Bypass / simulação |
|--------|--------|--------------|---------------------|
| **SEON** | ID document scan + selfie liveness | Pré-`submitApplication`, somente se `merchant.isSeonIdCheckRequired = true` | API `POST /uown/los/seon/createOrUpdate` com `idVerifySuccess: true` (skip total) |
| **Kount** | Login attempt scoring + device fingerprint | Origination login / risk decision | Token sweep `refreshKountAccessTokenSweep` — SSN catalog cobre bypass paths |
| **DV360 (DataView360)** | UW backbone (mediator: Sentilink, LexisNexis, GDS, Neustar) | `sendApplication` → svc → DV360 UAT → UW decision | Não há bypass; depende do ambiente externo |
| **NeuroID** | Behavioral/interaction fraud signal durante signing | Signing flow, gate-ado por `merchant.useNeuroIdCheck = true` | Sem bypass; observar via DB. **Fonte de truth de contagem = `uown_neuro_id_verification WHERE lead_pk=$1`** (helper `countNeuroIdCalls`), NÃO `uown_sv_outbound_api_log` |

> **NeuroID — não usar `uown_sv_outbound_api_log` para correlação por `lead_pk`.** A tabela tem linhas de chamadas NeuroID (`url ILIKE '%neuro-id.com%'`), mas para **leads pré-funding** `account_pk`, `source_uuid` e `return_uuid` são todos **NULL** — não há chave de correlação com o `lead_pk`. Assertivas de "NeuroID foi/não foi chamado N vezes" devem usar `uown_neuro_id_verification WHERE lead_pk = $1` (`countNeuroIdCalls`, helpers-catalog). Confirmado por discovery probe `src/scripts/probe-neuroid.ts`. Valores de `neuro_id_status` observados em qa2: só `SUCCESS` e `PROFILE_NOT_FOUND` — o enum `NeuroIdStatus.NOT_ENOUGH_INTERACTION_DATA` está `@unconfirmed` em `src/types/enums.ts`. **`useNeuroIdCheck=true` está em `mustBeFalse` no merchant preflight contract** — ver Pitfall #9 abaixo e [[application-lifecycle]] Pitfall #102. **R1.53.0:** existe um simulate-toggle de config `...NeuroIdVerificationService.simulate.not.enough.interaction.data` (default false) que força `NOT_ENOUGH_INTERACTION_DATA` (pass-through não-bloqueante, `success=true`); e o guard "prevent repeated NeuroID calls" (skip-on-prior-approval) **NÃO foi mergeado em R1.53.0** (branch revertido) — não escrever testes assumindo o skip. Ver [[application-lifecycle]] Pitfall #140.

Verificar em `src/data/merchant-config-contract.ts:54-74` — quais flags fraud-related o merchant pode ter ON/OFF:

```typescript
BASE_MUST_BE_FALSE = [
 'isIntellicheckRequired',
 'isSeonIdCheckRequired', // SEON OFF para UOWN base
 'isBankVerificationRequired',
 // ...
 'useLexisNexis',
 'useNeuroIdCheck',
 // ...
 'isFraudCheckRequired',
 'useNeustar',
 'useSentilink',
];
```

A regra: UOWN base merchants têm fraud flags OFF. Kornerstone tem `useWebhook=true` + `holdDeposit=true` legitimamente ON. **Mudar uma fraud flag para true em qa quebra preflight contract** (`ensureMerchantReady`) — auto-heal vai resetar.

### 2. SEON — ID Verification

#### Onde ativa

- Merchant tem `isSeonIdCheckRequired = true` → pre-`submitApplication`.
- Backend chama `IdVerificationService.verifySeon` que **short-circuita em `idVerifySuccess == true`** (linha 173 do svc) — pula todos os name/DOB/expiration checks.
- SDK SEON exige camera (document scan + selfie/liveness) → impossível em headless. Bypass via API é o padrão para automação.

#### Endpoint de bypass

```
POST /uown/los/seon/createOrUpdate
```

Client: `src/api/clients/seon.client.ts` → `api.seon.approveVerification({ leadPk, fullName, birthDate })`.

Body completo (`src/api/bodies/seon.body.ts:46-62`):

```typescript
{
 leadPk,
 referenceId: crypto.randomUUID,
 fullName,
 status: 'APPROVED',
 success: true,
 idVerifySuccess: true, // ← este é o flag-chave do short-circuit
 documentType: 'DRIVERS_LICENSE',
 nameMatchCheckResult: 'PASS',
 stateCheckResult: 'PASS',
 postalCodeResult: 'PASS',
 dateOfBirthResult: 'PASS',
 birthDate, // ISO YYYY-MM-DD (Java LocalDate)
 documentExpirationDate: '2030-01-01',
}
```

#### Conversão de DOB (pitfall comum)

`applicant.dob` vem em `MM/DD/YYYY` (test data). Java LocalDate exige `YYYY-MM-DD`:

```typescript
const [month, day, year] = applicant.dob.split('/');
const birthDateISO = `${year}-${month}-${day}`;
```

Ver `tests/api/seon-id-verification-bypass.spec.ts:124-127` e `tests/e2e/origination/seon-e2e-flow.spec.ts:120-122`.

#### Validação no DB

```sql
SELECT status, success, id_verify_success, full_name, birth_date, document_expiration_date
FROM uown_seon
WHERE lead_pk = $1
ORDER BY pk DESC LIMIT 1;
```

Expected após bypass: `status='APPROVED' AND success=true AND id_verify_success=true`. Ver `tests/api/seon-id-verification-bypass.spec.ts:141-160`.

#### UI flow com SEON ativo

`tests/e2e/origination/seon-e2e-flow.spec.ts` mostra padrão híbrido completo:

1. `sendApplication` → extrai `contractUrl` + `leadPk`
2. `getApplicationStatus` → confirma `APPROVED`
3. `api.seon.approveVerification(...)` → bypass via API
4. `page.goto(contractUrl)` → UI
5. `contract.dismissSeonOverlay` — modal QR code do SEON pode aparecer mesmo após bypass; o page object precisa fechar
6. Fill CC + bank → submit → T&C → e-sign
7. Origination portal → poll status até `CONTRACT_CREATED+`

Step 5 é o bug-fix recente: SEON SDK injeta overlay com QR code mesmo quando backend já considera APPROVED. Dismiss explícito necessário.

#### Response interface (`src/api/responses/seon.response.ts`)

```typescript
interface SeonInfoResponseBody {
 seonIdPk, leadPk, referenceId, fullName, status, success, idVerifySuccess,
 documentType, nameMatchCheckResult, stateCheckResult, postalCodeResult,
 dateOfBirthResult, birthDate, documentExpirationDate, error
}
```

### 3. Kount — Login Attempt Scoring + Token Refresh

#### Onde aparece no projeto

- Token storage: `uown_kount_token` (`pk`, `access_token`, `expiration_time` — `timestamp WITHOUT time zone`).
- Sweep service: `RefreshKountAccessTokenSweepService` — Quartz job, runs every ~10 min.
- API trigger manual: `POST /uown/svc/refreshKountAccessTokenSweep` (`ScheduledTaskClient.refreshKountAccessTokenSweep`).
- Login attempts join: `uown_login_attempt` join com `uown_user` (probe-login-attempt-schema.ts já não existe, mas a tabela continua).

#### Patterns conhecidos

`src/scripts/check-cc-sweep-eligibility.ts` e `.claude/skills/common-operations/SKILL.md:423-449` cobrem queries.

**Pitfall central** (`.claude/skills/common-operations/SKILL.md:488`):

> `RefreshKountAccessTokenSweepService` e `RefreshGdsAccessTokenSweepService` (commit `213b96b54`) chamam `loadOrCreateToken.setPk(...)` seguido de `repo.save(...)`. Como entity usa `@GeneratedValue`, o `setPk` explícito é **IGNORADO** no INSERT — DB assigna novo PK. Consequência: **após delete pk=1 + sweep recreate, o row novo NÃO está em pk=1**. Tests com `WHERE pk = 1` quebram.

**Fix:**

```typescript
// ❌
const row = await db.getSingleRow<KountTokenRow>(
 'SELECT expiration_time FROM uown_kount_token WHERE pk = 1'
);

// ✅
const row = await db.getSingleRow<KountTokenRow>(
 'SELECT expiration_time FROM uown_kount_token ORDER BY pk DESC LIMIT 1'
);
```

#### Timestamp comparison pitfall

`uown_kount_token.expiration_time` é `timestamp without time zone`. `pg-node` retorna `Date` JS cujo valor depende do locale do sistema. Solução: comparar PG-side, não JS-side:

```typescript
const result = await db.getSingleRow<{ ok: boolean }>(
 `SELECT (expiration_time > now + interval '30 seconds') AS ok
 FROM uown_kount_token WHERE pk = $1`,
 [pk],
);
```

Detalhes em `.claude/skills/common-operations/SKILL.md § Timestamp Comparisons` e `.claude/skills/helpers-catalog/SKILL.md:42-45`.

#### SSN catalog e fraud bypass

`skill [[ssn-test-modalities]]` documenta SSNs específicos que passam por bypass / cache para evitar dependência do downstream UW (Sentilink/Lexis/GDS/Kount). Pitfall reportado:

> Se o cron `getKountAccessTokenSweep`/`getGdsAccessTokenSweep` (Quartz, cada ~10min) não conseguir renovar a tempo, SSNs FORA do catálogo podem retornar UW_DENIED espúrio.

**Workaround:** trigger manual antes da suite:

```typescript
await api.scheduledTask.refreshKountAccessTokenSweep;
await api.scheduledTask.refreshGdsAccessTokenSweep;
```

### 4. DV360 / DataView360 — UW Backbone

#### O que é

DV360 (alias DataView360) é o mediator externo do UW: orquestra Sentilink, LexisNexis, GDS, Neustar. UOWN svc chama o ambiente UAT (`alb.uown.uat.me.dataview360.com`) para todas as decisões de UW em ambientes não-prod.

#### Onde aparece

- `uown_los_outbound_api_log.url LIKE '%dataview360%'` — todas chamadas svc→DV360 gravadas.
- Query helper: `database.helpers.ts:1115-1139`:

```typescript
async getDv360OutboundLog(leadPk: number) {
 return this.queryOne(
 `SELECT pk, lead_pk, request, url, response, row_created_timestamp
 FROM uown_los_outbound_api_log
 WHERE lead_pk = $1 AND url LIKE '%dataview360%'
 ORDER BY pk DESC LIMIT 1`,
 [leadPk],
);
}
```

#### 2026-05-18 OUTAGE — qa1 UAT (Memory: `project_dv360_uat_qa1_outage_2026_05_18`)

**Sintoma:**

`POST /uown/los/sendApplication` em **qa1** retorna 500 do Apache do DV360 UAT **independentemente do merchant** testado.

```
500 Internal Server Error: <html>...Apache/2.4.58 (Ubuntu) Server at alb.uown.uat.me.dataview360.com Port 80
```

Caminho da chamada:

```
Browser → apply-qa1.uownleasing.com (svc qa1)
 → svc chama DV360 UAT (alb.uown.uat.me.dataview360.com)
 → Apache 500 (HTML genérico, não JSON estruturado)
 → svc embrulha como 500 e devolve
```

**Evidência de svc saudável:** `uown_los_inbound_api_log` mostra `canContinueApplication` voltando 200 com payload completo. Diferença: `canContinueApplication` NÃO chama DV360 — só consulta lead local.

**Workarounds (in order of preference):**

1. **Aguardar** — UAT externos costumam voltar em minutos-horas.
2. **Trocar env para qa2 ou stg** — DV360 UAT pode estar instável só em qa1 routing, ou pode ser instância separada.
3. **Usar leads pré-existentes aprovados** quando o teste é sobre estado pós-UW (email template, signing, payment). Requer autorização explícita do user à exceção da Rule 10 (Test Data Hierarchy).

**Classificação correta:** `[ENV-GAP] DV360 UAT instability`, **NÃO** `[CONFIRMADO] bug`. Não tente "consertar" via mudança de payload do sendApplication (employer null etc) — causa raiz é externa.

#### Health probe rápido

```typescript
// Run BEFORE qa-flow / E2E pipeline em qa1 que envolve sendApplication
const probe = await api.application.sendApplication(merchant, applicant, order);
if (probe.status === 500 && /Apache.*dataview360/i.test(JSON.stringify(probe.body))) {
 test.skip(true, '[ENV-GAP] DV360 UAT instability — qa1 outage detected');
}
```

#### Tabelas DB envolvidas

| Tabela | Conteúdo |
|--------|----------|
| `uown_los_outbound_api_log` | TODA chamada svc→externo. `url LIKE '%dataview360%'` filtra DV360. Tem `request` e `response` raw. |
| `uown_los_inbound_api_log` | Chamadas recebidas por svc (browser → svc, e webhooks). Não passa por DV360. |
| `uown_los_lead_notes` | Activity log do lead — incluem patterns `[UWService]`, `[Sentilink]`, `[Lexis]`, `[Neustar]`, `[GDS]`. |
| `uown_kount_token` | Token Kount, ver § Kount acima. |
| `uown_gds_token` | Token GDS — mesmo padrão de sweep. |

### 5. Atalhos de bypass para SSN catalog

`skill [[ssn-test-modalities]]` — SSNs que evitam dependência de DV360/Kount/GDS:

| SSN ending | Resultado UW | Uso |
|------------|--------------|-----|
| `≠ 9` | `UW_APPROVED` | Caminho feliz |
| `= 9` | `UW_DENIED` | Teste de denied |
| `888880916` | force 16m program | Modalidade A (catalog §5) |
| `100000053` | Second Look (GDS bypass) | Modalidade C (TireAgent only) |

Use `generateTestSSN(true)` ou os fixos acima — NÃO inventar SSN aleatório porque cai no path UW completo (que depende de DV360).

## Pitfalls conhecidos

### Pitfall #1 — DV360 UAT outage classificado como bug

**Sintoma:** sendApplication 500 com Apache HTML. **Não confundir com bug do UOWN.** Verificar log outbound:

```sql
SELECT pk, url, response FROM uown_los_outbound_api_log
WHERE lead_pk = $1 AND url LIKE '%dataview360%'
ORDER BY pk DESC LIMIT 1;
```

Se response contém `Apache/2.4.58 (Ubuntu)` ou similar → ENV-GAP, não bug.

### Pitfall #2 — SEON DOB format

`applicant.dob = "01/15/1990"` (MM/DD/YYYY) → SEON precisa `"1990-01-15"`. Use `[month, day, year] = applicant.dob.split('/')` e remonte.

### Pitfall #3 — SEON overlay UI mesmo após bypass

`ContractPage.dismissSeonOverlay` é mandatório no fluxo UI mesmo quando `idVerifySuccess=true` no DB. SDK do SEON injeta QR modal independente do estado do backend.

### Pitfall #4 — Kount/GDS sweep pk=1 assumption

`@GeneratedValue` ignora `setPk(1)`. Use `ORDER BY pk DESC LIMIT 1` ou `waitForValueChange` apontando para latest row.

### Pitfall #5 — `uown_kount_token.expiration_time` timezone

`timestamp without time zone` + pg-node `Date` parsing é locale-dependent. Comparar PG-side com `(expiration_time > now + interval '30 seconds')`, não JS-side.

### Pitfall #6 — Mudar fraud flag em merchant quebra preflight

`isSeonIdCheckRequired`, `useLexisNexis`, `useSentilink` etc estão em `mustBeFalse` para UOWN base (`merchant-config-contract.ts:51-75`). Setar manualmente via portal → `ensureMerchantReady` no próximo teste vai resetar (auto-heal default). Para testar com flag ON: configurar `AUTO_HEAL_MERCHANT=false` no .env OU usar merchant que já legitimamente tem flag ON (e.g. FifthAveFurnitureNY tem `isSeonIdCheckRequired=true` por design de produto).

### Pitfall #7 — Confundir SEON status com lead status

`response.body.status` do SEON é `"APPROVED"|"REJECTED"|...` para a verificação de identidade. **NÃO** é o `uwStatus` do lead. Lead status vem de `api.application.getApplicationStatus`.

### Pitfall #8 — Kornerstone merchant exige bankData no sendApplication

Tangencial mas relevante: KS3015 (FifthAveFurnitureNY) tem `isSeonIdCheckRequired=true` E exige `bankData` no body do sendApplication (`.claude/rules/testing.md § Application Lifecycle`). Esquecer um dos dois faz o lead nem chegar no SEON step.

### Pitfall #9 — `useNeuroIdCheck` resetado pelo merchant preflight (falso-negativo NeuroID)

`useNeuroIdCheck=true` está no conjunto `mustBeFalse` do contrato de merchant preflight (`merchant-config-contract.ts`). Auto-heal via `createOrUpdateMerchant` **reseta a flag para `false`**, desabilitando o NeuroID silenciosamente: NeuroID nunca dispara, todos os `count >= 1` guards falham, e o teste reporta **falso-negativo**. **Fix:** `skipMerchantPreflight: true` em TODA chamada `createPreQualifiedApplication` quando `useNeuroIdCheck=true` é a flag sob teste; compensar com pre-assert read-only inline (`SELECT use_neuro_id_check FROM uown_merchant WHERE ref_merchant_code='OW90337-0001'` + `test.skip` se `false`). Detalhe completo em [[application-lifecycle]] Pitfall #102. Análogo ao Pitfall #6 (qualquer fraud flag em `mustBeFalse` é resetada pelo auto-heal).

### Pitfall #10 — `uown_sv_outbound_api_log` sem correlação `lead_pk` para leads pré-funding

A tabela tem linhas de chamadas NeuroID (`url ILIKE '%neuro-id.com%'`) mas, para leads pré-funding, `account_pk`/`source_uuid`/`return_uuid` são NULL — nenhuma chave de correlação com o `lead_pk`. Usar essa tabela para assertivas de contagem NeuroID é impossível nesse contexto. **Fix:** usar `uown_neuro_id_verification WHERE lead_pk = $1` (`countNeuroIdCalls`) como fonte de truth. Confirmado via discovery probe: `src/scripts/probe-neuroid.ts`.

## Exemplos do projeto

### A. API-only SEON bypass (full lifecycle)

`/home/jose/projects/uown/automation/tests/api/seon-id-verification-bypass.spec.ts`

- Linhas 56-62: ctx structure com `leadPk`, `approvedAmount`, `shortCode`, `planId`
- Linhas 64-72: `sendApplication` pre-qualification (NO order)
- Linhas 74-100: `getApplicationStatus` → confirma APPROVED + extrai leadPk + approvedAmount
- Linhas 102-122: `sendInvoice` → extrai `shortCode` + `planId` do redirectUrl
- Linhas 124-139: SEON bypass via `api.seon.approveVerification`
- Linhas 141-160: DB validation de `uown_seon`
- Linhas 162-167: `getMissingFields(shortCode, { planId })` ← obrigatório antes de submit (vide payment-flows pitfall #10)
- Linhas 170-182: `submitApplication` passa SEON gate
- Linhas 184-203: verify lead status `CONTRACT_CREATED+`

### B. Hybrid E2E (API bypass + UI contract)

`/home/jose/projects/uown/automation/tests/e2e/origination/seon-e2e-flow.spec.ts`

- Linhas 35-46: testData (NY + FifthAveFurnitureNY + orderTotal 1500)
- Linhas 48-55: merchantConfig com try/catch defensivo (qa2 RBAC issue em `getMerchantsByRefCode`)
- Linhas 119-136: SEON bypass via API
- Linha 169: `await contract.dismissSeonOverlay` ← mandatório no UI
- Linhas 215-250: poll de lead status com `Get Document Status` button para forçar sync backend

### C. SEON client + body builder

- `/home/jose/projects/uown/automation/src/api/clients/seon.client.ts` — duas funções: `createOrUpdate(body)` e `approveVerification(options)` (conveniência)
- `/home/jose/projects/uown/automation/src/api/bodies/seon.body.ts` — `buildSeonApprovedBody(options)` retorna body completo com defaults sensatos
- `/home/jose/projects/uown/automation/src/api/responses/seon.response.ts` — `SeonInfoResponseBody` mirror de `com.uownleasing.svc.pojo.SeonInfo`

### D. DV360 outbound log helper

`/home/jose/projects/uown/automation/src/helpers/database.helpers.ts:1115-1139` — `getDv360OutboundLog(leadPk)`. Use em debug de UW failures para inspecionar request/response raw enviado pra DataView360.

### E. Kount token query patterns

`/home/jose/projects/uown/automation/.claude/skills/common-operations/SKILL.md:423-490`

- Query latest token (não pk=1)
- PG-side timestamp comparison
- Trigger manual de sweep via `api.scheduledTask.refreshKountAccessTokenSweep`

## Checklist antes de marcar fraud-vendor test como pronto

- [ ] Antes de qa-flow em qa1 com `sendApplication`: rodou probe de DV360 — sem 500 Apache HTML
- [ ] Se merchant tem `isSeonIdCheckRequired=true`: bypass via `api.seon.approveVerification` antes de `submitApplication`
- [ ] DOB convertido para `YYYY-MM-DD` (Java LocalDate)
- [ ] DB validation em `uown_seon` confirma `status='APPROVED', success=true, id_verify_success=true`
- [ ] UI test inclui `contract.dismissSeonOverlay` mesmo após bypass
- [ ] Queries em `uown_kount_token` / `uown_gds_token` usam `ORDER BY pk DESC LIMIT 1`, não `WHERE pk = 1`
- [ ] Comparações de `expiration_time` feitas PG-side, não JS-side
- [ ] Falha 500 com Apache HTML classificada como `[ENV-GAP] DV360 UAT instability`, não `[CONFIRMADO] bug`
- [ ] SSN escolhido respeita catalog (não inventou aleatório, fora os patterns `≠9`/`=9`/`888880916`/`100000053`)
- [ ] Activity log validado em `uown_los_lead_notes` (CLAUDE.md regra 13)

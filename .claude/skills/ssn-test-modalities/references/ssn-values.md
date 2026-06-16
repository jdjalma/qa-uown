# SSN Test Values - Detailed Catalog

> Para tabela de decisao, principios e quando usar qual SSN, ver [SKILL.md](../SKILL.md).

---

## 1. Geradores programaticos

```ts
import { generateTestSSN } from '@config/constants.js';

generateTestSSN(true) // SSN aleatorio NAO terminado em 9 -> UW_APPROVED
generateTestSSN(false) // SSN aleatorio terminado em 9 -> UW_DENIED
```

**Convencao do sandbox/qa:** ultimo digito `9` forca denial no motor de UW mockado. Qualquer outro digito passa pelo fluxo normal (aprovado por default em qa). Producao usa Sentilink/Lexis real.

---

## 2. SSN 100000053 - Second Look (13m denied -> preview 16m -> 16m approved)

**Fonte:** `docs/taskTestingUown/RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477/`

### Comportamento no GDS

| Submissao | Bank data? | Resultado |
|-----------|:----------:|-----------|
| 1a | Nao | `UW_DENIED` em 13m + `isEligibleForExtraInfo=true` + `paymentDetailsList` populado com preview 16m |
| 2a (mesmo SSN) | Sim | `UW_APPROVED` em **16m** |

### Pre-condicoes (inviolavel)

| Campo | Valor obrigatorio |
|-------|-------------------|
| Merchant | `TireAgent` (configurado com programa 16m) |
| State | `CA` |
| First name | `Brian` |
| Last name | `hayden` |
| DOB | `02241987` |
| Address | `135 Buckeye Blvd` |
| City | `Columbus` |
| ZIP | `92821` (NAO usar `90001` - high-risk, nega sem second-look) |
| Employer | `Costco Wholesale` |
| Phone | `7653072625` |
| Environment | `stg` (confirmado); outros ambientes precisam validar |
| Config DevOps | `use.taktile.for.decision=false` + `use.gds.for.decision=true` |

### Override via env var

```bash
TIRE_AGENT_SECOND_LOOK_SSN=100000053 # default; permite trocar sem editar codigo
```

### Regras de reuso do SSN

- Reusar o mesmo SSN em uma **diferente** combinacao (ZIP/state/address) dispara `DataMismatchStep` com `ADDRESS_MISMATCH`.
- **Cleanup obrigatorio:** antes de submeter a primeira request, expirar/cancelar leads ANTERIORES com esse SSN em status APPROVED.

---

## 3. SSN 888880916 - Aprovacao direta apenas em 16 meses (single submission)

**Fonte:** `docs/taskTestingUown/RU02.26.1.49.2_displayTermMonthsInMerchantSectionCustomersPage_1239.md`

### Regra real descoberta 2026-05-24

Mock BlackBox em qa1 usa ultimos 3 digitos do SSN: `XXXXXX916` -> EligibleTerms 16 em QUALQUER UOWN merchant. Outros sufixos -> 13. Random prefix evita profile-lock do 888880916 fixo. Kornerstone (KS*) sempre 16m por rota separada.

### Comportamento no GDS

| Submissao | Bank data? | Resultado |
|-----------|:----------:|-----------|
| 1a (unica) | qualquer | `UW_APPROVED` em **16m apenas** |

### Dados gravados em DB e API

| Campo | Valor |
|-------|-------|
| `uown_lead_approval_terms.uw_terms` | `"16"` |
| `uown_lead_approval_terms.merchant_terms` | `"16"` |
| `uown_lead_approval_terms.approved_terms` | `"16"` |
| `getMerchantInfo.approvedTermMonthsDisplay` | `"16 months"` |
| UI (Customer page - Merchant Info) | `"16 months"` |

> Compare com SSN `888888888` da mesma familia - aprova em **ambos** (`approved_terms="13,16"`). Mas `888888888` tem bug de NullPointerException no `sendApplication` (ver secao 5).

### Pre-condicoes

| Campo | Valor |
|-------|-------|
| Merchant | qualquer merchant com programa **16m ativo** |
| Profile (name/DOB/address) | **nao amarrado** - diferente do `100000053` |
| Formato SSN | sem tracos: `888880916`, NAO `888-88-0916` |

### Ambientes confirmados

| Env | Merchant | Status | Referencia |
|-----|----------|:------:|------------|
| qa2 | `TerraceFinance` (OL90202-0001) | Confirmado | Scenario B da task 1239 |
| qa2 | `Kornerstone KS1337` | Confirmado | Scenario D |
| stg | `Kornerstone KS1337-001` | Confirmado | Scenario F (leadPk=6558872) |
| qa1 | PayPossible | Confirmado | CT-A5, lead 12016, approval $4,430, planId WK16 |

---

## 4. SSN para "denied em 16m mesmo com bank data" - BLOQUEADO

Registrado como pendente: precisa pedir SSN de teste para a Becky. Quando Becky fornecer, adicionar aqui com receita completa.

---

## 5. SSN `888888888` - BUGGY (evitar em testes)

Causa `HTTP 500 NullPointerException` no backend ao chamar `sendApplication`. Usar **apenas** para validar o bug especifico. Para qualquer outro teste usar `generateTestSSN(true)`.

---

## 6. qa2 sendApplication retornou 500/401 com SSN random (2026-05-06)

**Janela observada:** ~5 horas (~13:06-18:30 UTC de 2026-05-06).

**Reproducao deterministica:**
- SSN random (6/6 testados) -> 500/401
- SSN especificos `660015551` e `100000053` -> 200 OK

**Causa hipotetica:** token de auth do svc para downstream UW service (Sentilink/Lexis/GDS/Kount) expirou.

**Mitigacao correta (NAO mudar test code):**
1. Trigger manual de refresh: `POST /uown/svc/refreshKountAccessTokenSweep` + `POST /uown/svc/refreshGdsAccessTokenSweep`
2. Triagem Ops: investigar por que o cron Quartz nao esta prevenindo a expiracao

**Nunca mudar `applicant.ssn` para fixo** - viola principio de fresh data.

---

## 7. Elegibilidade 16m - query de confirmacao runtime

```sql
SELECT
 mp.pk,
 mp.term_in_months,
 mp.is_active,
 mp.activation_date,
 mp.deactivation_date
FROM uown_merchant m
JOIN uown_merchant_program mp ON mp.merchant_pk = m.pk
WHERE m.merchant_number = $1 — ex: 'OL90205-0079'
 AND mp.term_in_months = 16
 AND mp.is_active = true
 AND (mp.activation_date IS NULL OR mp.activation_date <= NOW)
 AND (mp.deactivation_date IS NULL OR mp.deactivation_date >= NOW);
```

Resultado >= 1: suporta 16m. Resultado 0: nao suporta agora (corrigivel via Origination admin - Programs).

---

## 8. Brand coverage - validacao obrigatoria por brand

### Validacao de `uown_sv_account.company` (DB cross-check)

Pre-condicao em toda criacao de account via merchant Kornerstone:

```sql
SELECT company FROM uown_sv_account WHERE pk = $accountPk;
-- expected: 'KORNERSTONE' quando merchant.ref_merchant_code comeca com 'KS'
-- expected: 'UOWN' caso contrario
```

**Protocolo de divergencia:**
1. Se `company` NAO bate: STOP o teste
2. Logar: `[CT-XX] BRAND_MISMATCH expected=KORNERSTONE actual=UOWN merchantCode=KS3015`
3. Pedir autorizacao ao usuario para UPDATE
4. So prosseguir apos autorizacao + UPDATE executado
5. Registrar como **ENV-GAP**

### Validacao de estilo por brand (UI + email)

**Email (Gmail IMAP / HTML body):**

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| `From:` header | `CustomerService@uownleasing.com` | `CS@kornerstoneliving.com` |
| Nome do remetente | `UOWN Leasing` | `Kornerstone Living` |
| Template name (DB) | `<TemplateName>` sem prefixo | `KORNERSTONE_<TemplateName>` |
| Logo (alt text / src) | contem `uown` | contem `kornerstone` |
| Footer legal | menciona "UOWN Leasing" | menciona "Kornerstone" |
| Imagens | `storage.googleapis.com/...uown...` | `storage.googleapis.com/...kornerstone...` |
| **Cross-contamination** | body NAO contem Kornerstone | body NAO contem UOWN |

**Portal (Origination / Servicing / Website):**

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| Logo no header | UOWN logo | Kornerstone logo |
| Cor primaria (CSS) | consultar spec visual | consultar spec visual |
| Favicon | UOWN | Kornerstone |
| Titulo da aba | contem `UOWN` | contem `Kornerstone` |

---

## 9. Observacoes de ambiente por SSN/merchant

| Data | Ambiente | Merchant | SSN | Observacao |
|------|----------|----------|-----|------------|
| 2026-04-22 | qa2 | TireAgent (OW90218-0001) | 100000053 | Second Look parece short-circuit em qa2. Validado apenas em `stg`. |

---

## 10. Referencias cruzadas

- Business rule completa: `docs/business-rules/02-originacao-pipeline.md`
- Brand/company enum: `Company.java` (`UOWN`, `KORNERSTONE`)
- Merchant data: `src/data/merchants.ts`
- Email templates Kornerstone: `docs/business-rules/10-portal-comunicacoes.md`
- Test cards (BINs): `src/data/test-cards.ts`
- Test bank: `src/config/constants.ts` - `TEST_BANK.DEFAULT_ROUTING` / `DEFAULT_ACCOUNT`
- SSN generator: `src/config/constants.ts` - `generateTestSSN(approved: boolean)`
- Risk tiers: `docs/business-rules/appendix-g-cenarios-risco.md`

# SSN Test Catalog — UOWN Leasing

> **Propósito:** catálogo canônico de SSNs de teste, suas semânticas, e **receitas completas** para criar aplicações nas 3 modalidades de programa (13m apenas / 13m+16m / 16m apenas).
>
> **Mandatário para:** `subagent-spec-test` (planejar CTs das 3 modalidades sempre que o cenário envolver criação de aplicação), `subagent-impl-e2e`, `subagent-impl-api` (usar a receita correta conforme o SPEC), e `/qa-flow`.
>
> **Como alimentar:** ao descobrir um novo SSN funcional (via QA manual, dev, ou Becky), adicionar aqui com receita completa. Se o projeto tem uma regra "para tal cenário de teste usa-se SSN X", ela vive aqui.

---

## 1. Geradores programáticos (padrão para UW_APPROVED / UW_DENIED binários)

```ts
import { generateTestSSN } from '@config/constants.js';

generateTestSSN(true)   // SSN aleatório NÃO terminado em 9 → UW_APPROVED
generateTestSSN(false)  // SSN aleatório terminado em 9       → UW_DENIED
```

**Convenção do sandbox/qa:** último dígito `9` força denial no motor de UW mockado. Qualquer outro dígito passa pelo fluxo normal (aprovado por default em qa). Produção usa Sentilink/Lexis real — a convenção é apenas de teste.

### Uso

- **Aplicações que só precisam de aprovação/negação** → use `generateTestSSN(true|false)`.
- **Aplicações que precisam reproduzir cenário específico** (second look, denial mesmo com bank data, programa 16m) → NÃO use o gerador; use SSN fixo do catálogo abaixo.

---

## 2. SSN 100000053 — Second Look (13m denied → preview 16m → 16m approved)

**Fonte:** `docs/taskTestingUown/RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477/`

### Comportamento no GDS

| Submissão | Bank data? | Resultado |
|-----------|:----------:|-----------|
| 1ª | ❌ | `UW_DENIED` em 13m + `isEligibleForExtraInfo=true` + `paymentDetailsList` populado com preview 16m |
| 2ª (mesmo SSN) | ✅ | `UW_APPROVED` em **16m** |

### Pré-condições (inviolável — o GDS só reconhece esse SSN com esse conjunto)

| Campo | Valor obrigatório |
|-------|-------------------|
| Merchant | `TireAgent` (configurado com programa 16m) |
| State | `CA` |
| First name | `Brian` |
| Last name | `hayden` |
| DOB | `02241987` |
| Address | `135 Buckeye Blvd` |
| City | `Columbus` |
| ZIP | `92821` (NÃO usar `90001` — é high-risk e nega sem second-look) |
| Employer | `Costco Wholesale` |
| Phone | `7653072625` |
| Environment | `stg` (confirmado); outros ambientes precisam validar disponibilidade do SSN no GDS |
| Config DevOps | `use.taktile.for.decision=false` + `use.gds.for.decision=true` |

### Override via env var

```bash
TIRE_AGENT_SECOND_LOOK_SSN=100000053  # default; permite trocar sem editar código
```

### Regras de reuso do SSN

- Reusar o mesmo SSN em uma **diferente** combinação (ZIP/state/address) dispara `DataMismatchStep` com `ADDRESS_MISMATCH` — aplicação nega **antes** do GDS.
- **Cleanup obrigatório:** antes de submeter a primeira request, expirar/cancelar leads ANTERIORES com esse SSN em status APPROVED (ver `spec.ts` linha 259).

---

## 3. SSN para "denied em 16m mesmo com bank data" — BLOQUEADO

Registrado em `test-steps-updated.md:271` como pendente:

> **SSN para CT-05/CT-06 (denial no 16m) — BLOQUEADO** — precisa pedir SSN de teste para a Becky.

Quando Becky fornecer, adicionar aqui com receita completa.

---

## 3.1. ⚠️ qa2 — sendApplication retornou 500/401 com SSN random (2026-05-06 ~13h-18h UTC)

**Sintoma observado:** entre ~13:06 e ~18:30 UTC de 2026-05-06, `POST /uown/los/sendApplication` em qa2 retornou HTTP 500 com body:

```
"Request processing failed; nested exception is
 org.springframework.web.client.HttpClientErrorException$Unauthorized: 401 Unauthorized: [no body]"
```

**Janela observada:** ~5 horas. Antes (manhã) e depois (a confirmar) `generateTestSSN(true)` random funciona normalmente.

**Reprodução determinística (probes diretos 18:25-18:29 UTC):**
- SSN random (`160747926`, `607217455`, `115240965`, `666123456`, `555447777`, `777889999`) → 6/6 retornaram 500/401
- SSN específicos `660015551` e `100000053` (do catálogo §2/§5) → 200 OK

**Causa hipotética:** token de auth do svc para downstream UW service (Sentilink/Lexis/GDS/Kount) expirou, e o cron `getKountAccessTokenSweep`/`getGdsAccessTokenSweep` (Quartz a cada 10min, per Task #502) não conseguiu renovar a tempo. SSNs específicos do catálogo provavelmente passam por bypass / cache.

**Mitigação correta (NÃO mudar test code):**
1. **Trigger manual de refresh** antes da suite: `POST /uown/svc/refreshKountAccessTokenSweep` + `POST /uown/svc/refreshGdsAccessTokenSweep` (endpoints do Task #502)
2. **Triagem Ops:** investigar por que o cron Quartz não está prevenindo a expiração

**Nunca mudar `applicant.ssn` para fixo** — viola princípio de fresh data. `generateTestSSN(true)` é o gerador canônico do projeto.

**Tracking:** task de Ops a abrir após confirmar com dev se 401 é intermitente em outros tests qa2.

---

## 4. SSN `888888888` — BUGGY (evitar em testes)

Causa `HTTP 500 NullPointerException` no backend ao chamar `sendApplication`. Fonte: `docs/taskTestingUown/RU03.26.1.50.0_improveDesignOfCompleteApplicationScreen_1233/*.md`.

Usar **apenas** para validar o bug específico. Para qualquer outro teste → usar `generateTestSSN(true)`.

---

## 5. Modalidades de Programa — Receitas Completas

> **Regra inviolável para `subagent-spec-test`:** quando o cenário envolver criação de aplicação (sendApplication), **DEVE planejar CTs para as 3 modalidades abaixo** (ou justificar explicitamente por que uma modalidade não se aplica à feature sob teste). `subagent-impl-e2e` e `subagent-impl-api` seguem o SPEC sem desviar das receitas.

### Modalidade A — 13m apenas (fluxo UOWN)

**Critério de seleção (backend task #439):** `uown_los_lead.company = 'UOWN'`, apenas 13 meses disponível.

**Receita:**

| Campo | Valor |
|-------|-------|
| SSN | `generateTestSSN(true)` |
| Merchant | qualquer UOWN não-Kornerstone (ex: `TerraceFinance`, `TireAgent` sem programa 16m) |
| State | qualquer active state (`CA`, `TX`, `OH`, `GA`) |
| Bank data | **NÃO enviar** `mainBankAccountNumber` / `mainBankRoutingNumber` OU enviar BIN não-elegível no `creditCardNumber` |
| Cart value | `$800–$1.500` |

**Expected:** `paymentDetailsList` contém apenas entradas com `planId` padrão `*13` (ex: `WK13`, `MN13`). Lead em `uown_los_lead.company='UOWN'`.

### Modalidade B — 13m + 16m (cliente escolhe via getMissingFields + planId)

**Critério de seleção:** `uown_los_lead.company = 'KORNERSTONE'` com banking data presente E BIN elegível → backend avalia 16m primeiro, fallback 13m. Se ambos atendem aos critérios de valor/estado, os dois são oferecidos.

**Receita:**

| Campo | Valor |
|-------|-------|
| SSN | `generateTestSSN(true)` |
| Merchant | Kornerstone (ex: `FifthAveFurnitureNY` com código `KS3015`) |
| State | `CA`, `TX` (dentro da faixa elegível Kornerstone) |
| Bank data | **enviar:** `mainBankRoutingNumber=TEST_BANK.DEFAULT_ROUTING` (`123456780`) + `mainBankAccountNumber=TEST_BANK.DEFAULT_ACCOUNT` (`160781900000`) |
| Credit card (BIN) | use `TEST_CARDS.VISA_APPROVED` (BIN 5146) OU `MASTERCARD_APPROVED` (5500) OU `DISCOVER_APPROVED` (6011) |
| Cart value | `$800–$1.500` |

**Fluxo do cliente:**

1. `sendApplication` → response com `paymentDetailsList` contendo entradas 13m E 16m (`planId=MN13` + `planId=MN16`, ou equivalente para outras frequências)
2. `getMissingFields(shortCode, planId)` — cliente escolhe `planId` (ex: `MN16`)
3. `submitApplication` com o `planId` selecionado → contrato criado com `term_in_months=16`

**Expected:** `uown_los_sched_summary.term_in_months = 16` (ou 13, conforme `planId` escolhido).

### Modalidade C — 16m apenas (via Second Look)

**Critério de seleção:** não existe criação direta de aplicação 16m-only. Obtém-se via **Second Look** — primeira sub nega em 13m com preview 16m, segunda sub aprova em 16m.

**Receita:** ver **§2. SSN 100000053**. A sequência é:

1. `sendApplication` SEM bank data, usando SSN `100000053` + profile Brian/Columbus/92821/CA/TireAgent → `UW_DENIED` 13m + preview 16m
2. `sendApplication` com **mesmo SSN + mesmo profile + bank data** → `UW_APPROVED` 16m

**Limitação de ambiente:**
- Só validado em `stg`. Outros ambientes requerem confirmar com dev se o GDS reconhece o SSN.
- `getNumberOfPayments(16, WEEKLY|BI_WEEKLY|SEMI_MONTHLY)` lança `SvcException` em qa1 — apenas `MN16` funciona naturalmente em qa1. Em qa2 com merchant Kornerstone, todas as frequências funcionam.

### Modalidade D — Denied (qualquer modalidade)

**Receita:**

| Campo | Valor |
|-------|-------|
| SSN | `generateTestSSN(false)` (termina em 9) |

**Expected:** `UW_DENIED` imediato, sem programa selecionado. `paymentDetailsList` pode vir vazio ou com `null`.

---

## 6. Checklist obrigatório (spec-test)

Ao planejar CTs de uma feature que envolve `sendApplication`:

- [ ] CT para **Modalidade A (13m apenas)** planejado? Se não, justificar: "Feature não depende do fluxo UOWN 13m-only porque ..."
- [ ] CT para **Modalidade B (13m+16m Kornerstone)** planejado? Se não, justificar.
- [ ] CT para **Modalidade C (16m via Second Look)** planejado? Se não, justificar (pode ser "fora do escopo" se a feature não testa fluxo TireAgent/GDS).
- [ ] CT para **Modalidade D (denied)** planejado? Se não, justificar.

Modalidades podem ser combinadas em menos CTs via parametrização (`testData` array iterando as modalidades) — desde que cada modalidade receba validação dedicada.

### Quando é aceitável omitir modalidade

- Feature é 100% servicing/portal-only (não cria aplicação) — todas as modalidades N/A
- Feature é específica de uma modalidade (ex: "16m-only EPO" = só precisa Modalidade C)
- Fixture limitada no ambiente-alvo (ex: Second Look bloqueado em qa2) — documentar no SPEC como `test.skip` condicional

Toda omissão DEVE ser explícita no SPEC. Silent skips não são aceitos.

---

## 7. Brand Coverage — UOWN + Kornerstone (INVIOLÁVEL)

> **Axioma:** toda feature que cria aplicação DEVE ter CTs para **ambas as brands** (UOWN **E** Kornerstone). As modalidades A/B/C do §5 cobrem a dimensão "programa"; esta seção cobre a dimensão "marca". As duas dimensões se combinam — uma feature de criação de aplicação tem CTs para `UOWN 13m`, `Kornerstone 13m+16m`, etc.
>
> **Por que:** a plataforma é multi-tenant (UOWN + Kornerstone). Ignorar uma brand em teste pode esconder regressões de templates, remetentes, imagens GCS, cores, footers legais, ou lógicas de roteamento específicas. No pipeline #491 foi descoberto que accounts criadas via Postman smoke com merchant Kornerstone ficavam com `uown_sv_account.company='UOWN'` — só pegamos porque rodamos as duas brands e comparamos.

### 7.1 Matriz brand × modalidade

| Modalidade | UOWN | Kornerstone |
|------------|:----:|:-----------:|
| A — 13m apenas | merchant UOWN não-KS (TerraceFinance, TireAgent sem 16m) | merchant Kornerstone sem banking OU sem BIN elegível |
| B — 13m+16m | N/A (UOWN não oferece 16m) | merchant Kornerstone (`FifthAveFurnitureNY KS3015`) + banking + BIN elegível |
| C — 16m Second Look | N/A (fluxo é TireAgent migrado do Kornerstone) | TireAgent + SSN 100000053 |
| D — Denied | SSN `generateTestSSN(false)` + merchant UOWN | SSN `generateTestSSN(false)` + merchant Kornerstone |

**Regra de planejamento:** o SPEC deve explicitar para CADA modalidade aplicável à feature qual(is) brand(s) recebem CT. Omissão de brand exige justificativa escrita.

### 7.2 Validação obrigatória de `uown_sv_account.company` (DB cross-check)

**Pré-condição** em toda criação de account via merchant Kornerstone:

```sql
SELECT company FROM uown_sv_account WHERE pk = $accountPk;
-- expected: 'KORNERSTONE' quando merchant.ref_merchant_code começa com 'KS'
-- expected: 'UOWN' caso contrário
```

**Protocolo de divergência:**

1. Se `company` NÃO bate com o esperado → STOP o teste (não prosseguir com assertions de template/email/styling).
2. Logar claramente: `[CT-XX] BRAND_MISMATCH expected=KORNERSTONE actual=UOWN merchantCode=KS3015`.
3. **Pedir autorização ao usuário** (via orquestrador) para executar:
   ```sql
   UPDATE uown_sv_account SET company='KORNERSTONE' WHERE pk=$accountPk;
   UPDATE uown_los_lead SET company='KORNERSTONE' WHERE pk=$leadPk;
   ```
4. Só prosseguir após autorização + UPDATE executado.
5. Registrar no relatório como **ENV-GAP** (não como bug de teste) — é gap de provisionamento do happy path do Postman (conhecido).

Essa verificação é **obrigatória em pré-condições** (não em validações finais) — evita que o teste rode template UOWN numa conta que deveria ser Kornerstone e vice-versa.

### 7.3 Validação de estilo por brand (UI + email)

Toda feature que renderiza conteúdo visual (email, portal, receipts, contratos) DEVE validar os marcadores de brand abaixo por CT:

#### Email (Gmail IMAP / HTML body)

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| `From:` header | `CustomerService@uownleasing.com` | `CS@kornerstoneliving.com` |
| Nome do remetente | `UOWN Leasing` (ou variante) | `Kornerstone Living` (ou variante) |
| Template name (DB `uown_email_queue.template_name` / `uown_correspondence_logs.template_name`) | `<TemplateName>` sem prefixo | `KORNERSTONE_<TemplateName>` |
| Logo (alt text / src) | contém `uown` / `UOWN` | contém `kornerstone` / `Kornerstone` |
| Footer legal | menciona "UOWN Leasing" / endereço UOWN | menciona "Kornerstone" / endereço KS |
| Imagens | `https://storage.googleapis.com/...uown...` | `https://storage.googleapis.com/...kornerstone...` |
| **Cross-contamination check** | body **NÃO** contém `CS@kornerstoneliving.com` nem "Kornerstone" | body **NÃO** contém `CustomerService@uownleasing.com` nem "UOWN Leasing" |

#### Portal (Origination / Servicing / Website)

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| Logo no header | UOWN logo | Kornerstone logo |
| Cor primária (CSS) | consultar spec visual do projeto | consultar spec visual |
| Favicon | UOWN | Kornerstone |
| Título da aba (`<title>`) | contém `UOWN` | contém `Kornerstone` |
| Texto de boas-vindas / marketing | UOWN copy | Kornerstone copy |

> **Nota sobre cores exatas:** valores hex/RGB não estão catalogados neste arquivo. Ao implementar validação de cor, o agent deve: (a) consultar design system se existir em `../website/` ou `../servicing/`, OU (b) usar cor do primeiro render como baseline (snapshot test), OU (c) pedir ao usuário os valores canônicos se críticos.

#### Receipts / contratos (PDF ou HTML gerado)

| Axis | UOWN | Kornerstone |
|------|------|-------------|
| Cabeçalho do documento | branding UOWN | branding Kornerstone |
| Rodapé legal | UOWN legal text | Kornerstone legal text |
| URLs no documento | apontam para domínios UOWN | apontam para domínios Kornerstone |

### 7.4 Checklist de brand coverage (spec-test + impl)

Antes de finalizar SPEC que envolve `sendApplication`:

- [ ] Cada modalidade aplicável tem CT para UOWN?
- [ ] Cada modalidade aplicável tem CT para Kornerstone?
- [ ] Se alguma brand foi omitida → justificativa escrita no SPEC (ex: "feature é UOWN-only por design — Kornerstone não aplicável")?
- [ ] Cada CT Kornerstone inclui validação de `uown_sv_account.company='KORNERSTONE'` em pré-condições?
- [ ] Cada CT validando UI/email tem assertions de styling específicas da brand (logo, from, footer)?
- [ ] Cada CT inclui cross-contamination check (brand A não deve ter marcadores de brand B)?

Silent skip de uma brand = violação.

---

## 8. Observações de ambiente por SSN/merchant

| Data | Ambiente | Merchant | SSN | Observação |
|------|----------|----------|-----|------------|
| 2026-04-22 | qa2 | TireAgent (OW90218-0001) | 100000053 | Second Look com 16m parece short-circuit em qa2 — pipeline scheduleProgramActivationDeactivationDates registrou comportamento inesperado. Validado como funcionando apenas em `stg` (confirmado §4). Verificar com DevOps antes de usar qa2 para CTs de Second Look. |

---

## 9. Referências cruzadas

- Business rule completa: `docs/business-rules/02-originacao-pipeline.md § Selecao de Programa e Roteamento (13 vs 16 Meses) — Task #439`
- Brand/company enum: `../common/src/main/java/com/uownleasing/common/enumeration/Company.java` (`UOWN`, `KORNERSTONE`)
- Merchant data (incluindo `KS3015`): `src/data/merchants.ts` (constantes como `MERCHANT_KORNERSTONE_*`)
- Email templates Kornerstone (prefixo `KORNERSTONE_`): `docs/business-rules/10-portal-comunicacoes.md § 66`
- Test cards (BINs): `src/data/test-cards.ts` — `ALL_TEST_CARDS`
- Test bank (routing/account): `src/config/constants.ts` — `TEST_BANK.DEFAULT_ROUTING` / `DEFAULT_ACCOUNT`
- SSN generator: `src/config/constants.ts` — `generateTestSSN(approved: boolean)`
- Risk tiers (estado/merchant/cart value por modalidade): `docs/business-rules/appendix-g-cenarios-risco.md`
- Task que usa Second Look: `docs/taskTestingUown/RU03.26.1.50.0_newTireAgentFlowReturn16MonthAndSecondLook_477/`
- Precedente de `company` misconfigurado em Kornerstone account: pipeline #491 (accounts 11403-11413 tinham merchant KS3015 mas `company='UOWN'` — corrigido via UPDATE autorizado pelo user)

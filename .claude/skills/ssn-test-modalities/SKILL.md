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
| Denial generico | `generateTestSSN(false)` (termina em 9) | qualquer | UW_DENIED imediato |
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

### Modalidade C.2 - 16m Second Look

| Campo | Valor |
|-------|-------|
| SSN | `100000053` |
| Merchant | TireAgent |
| Profile | Brian/hayden/Columbus/92821/CA (INVIOLAVEL) |

**Fluxo:** 1a submissao sem bank data -> UW_DENIED + preview 16m -> 2a submissao com bank data -> UW_APPROVED 16m.

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

---

## 6. Principios

- `generateTestSSN(true|false)` e o gerador canonico - NUNCA fixar SSN para testes genericos
- Ultimo digito `9` forca denial no motor UW mockado (convencao sandbox/qa)
- Sufixo `916` forca EligibleTerms 16 no mock BlackBox (qa1 confirmado 2026-05-24)
- SSN `100000053` e amarrado a profile exato - reusar com dados diferentes causa ADDRESS_MISMATCH
- Kornerstone (KS*) sempre recebe 16m por rota separada (independente de sufixo SSN)
- Brand e ortogonal a modalidade - depende da config do merchant, nao do nome

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

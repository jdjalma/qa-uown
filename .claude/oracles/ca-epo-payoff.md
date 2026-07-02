---
operation: ca-epo-payoff
description: Cálculo do valor de quitação antecipada (EPO — Early Pay Off) de 90 dias para leases de 16 meses no estado da Califórnia, exibido no painel EPO do portal Servicing, no card "Balance if Paid Off Today" do Customer Portal e via API getAccountSummary/getServicingInfo. A correção svc#531 passou os leases 16m/CA pela mesma fórmula CA usada nos 13m enquanto today <= earlyPayoffDateExpiry (janela de 90 dias); após a expiração, reverte para o cálculo legado anytimeBuyOut.
last-reviewed: 2026-07-01
last-reviewed-sha: 7b8edac
covers:
  - tests/e2e/servicing/RU05.26.1.52.0_sixteenMonthEpoForCa.spec.ts
  - src/pages/servicing/account-summary.page.ts
  - src/pages/website/customer-portal-overview.page.ts
  - src/api/clients/svc-payoff.client.ts
  - src/helpers/svc-payoff.helpers.ts
  - src/helpers/svc-servicing-info.helpers.ts
  - docs/business-rules/04-calculos-financeiros.md
---

# Oracle BDD — Quitação Antecipada EPO 16m para Califórnia (CA EPO Payoff)

> **Gatilho:** qualquer operação que leia o valor de EPO (Early Pay Off / quitação de 90 dias) de um lease **16 meses + CA** — seja abrindo o painel EPO na página `/customer-information/{accountPk}` do portal Servicing, lendo o card "Balance if Paid Off Today" no `/overview` do Customer Portal, ou chamando `GET /uown/svc/getAccountSummary/{accountPk}` / `GET /uown/svc/getServicingInfo/{accountPk}`. Aplica-se também a rodar `RU05.26.1.52.0_sixteenMonthEpoForCa.spec.ts` (rodar o spec É executar as operações que ele exercita — regra #19).
>
> **Verificação de obsolescência:**
> ```bash
> git log 7b8edac..HEAD -- \
>   tests/e2e/servicing/RU05.26.1.52.0_sixteenMonthEpoForCa.spec.ts \
>   src/pages/servicing/account-summary.page.ts \
>   src/pages/website/customer-portal-overview.page.ts \
>   src/api/clients/svc-payoff.client.ts \
>   src/helpers/svc-payoff.helpers.ts \
>   src/helpers/svc-servicing-info.helpers.ts \
>   docs/business-rules/04-calculos-financeiros.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Viewport (regra #15):** o painel EPO do Servicing é um portal interno de agentes → **1440×900**. O card "Balance if Paid Off Today" do Customer Portal é voltado ao cliente e majoritariamente mobile → **375×667**. O spec lê o Servicing em 1440×900 e o Portal em 375×667 (`account-summary.page.ts` e `customer-portal-overview.page.ts`).
>
> **Distinção de escopo — NÃO confundir com o oracle `prorated-amount.md`:**
> - **`prorated-amount.md` (outro oracle):** calculadora "AS OF" — o agente informa uma data arbitrária e o sistema devolve o valor proporcional de quitação para *aquela* data (`GET /uown/svc/getProrateAmount/{accountPk}?onDate=...`). É um cálculo pro-rata por data, disparado no picker, somente leitura, sem relação com a fórmula EPO de 90 dias.
> - **`ca-epo-payoff.md` (este oracle):** valor de EPO de 90 dias (`EPO Balance` / `90-day Total`), derivado da fórmula CA fixa a partir de `Cost/Cash Price`, `Processing Fee`, `Buyout Fee` e `Tax Rate`, válido enquanto `today <= earlyPayoffDateExpiry`. É a quitação "same as cash", não o proporcional por data.
>
> **Fórmula CA (canônica — regra CA/HI/NY/WV, `04-calculos-financeiros.md` §15/§70; valores verificados via MCP na stg account 589122 em 2026-05-26):**
> ```
> netCash  = cashPrice - processingFee - buyoutFee
> epoBalance = cashPrice + (netCash * taxRate / 100)
> ```
> O imposto incide sobre o **cash price líquido** (fees excluídos), não sobre o bruto. Exemplo verificado: `cashPrice=$1892.32`, `processingFee=$49`, `buyoutFee=$0`, `taxRate=9.75%` → `epoBalance = 1892.32 + (1843.32 * 9.75/100) = $2072.04`.
>
> **Tolerância de tri-superfície:** `ISSUE531_DATA.tolerance = $0.01` — Servicing, Portal e API devem coincidir dentro de ±$0.01.
>
> **Log de atividade (regra #13):** a exibição do EPO é um getter somente leitura → NÃO gera nota em `uown_los_lead_notes` / `uown_sv_activity_log` (esperado; SPEC §9 OBS-2/OBS-4). A mutação de `_90DayExpirationDate` via `createOrUpdateServicingInfo` (Grupo C) SIM gera uma linha `DATA_CHANGE` em `uown_sv_activity_log` — asseverada em CT-C1.

---

## CT-A1 — UOWN + CA + 16m dentro da janela segue a fórmula CA e exclui o Total Contract Amount

```gherkin
Dado que um lease UOWN em CA com programa de 16 meses foi levado a ACTIVE (viewport Servicing 1440×900, Customer Portal 375×667)
E hoje está dentro da janela de 90 dias (today <= earlyPayoffDateExpiry)
Quando o agente abre o painel EPO na página Customer Information do lease
E o cliente abre o card "Balance if Paid Off Today" no Customer Portal
E o sistema é consultado para o resumo de quitação do account
Então o "EPO Balance" no Servicing é exatamente cashPrice + ((cashPrice - processingFee - buyoutFee) * taxRate / 100)
E o "90-day Total" no Servicing é igual ao "EPO Balance"
E o "Balance if Paid Off Today" do Customer Portal coincide com o "EPO Balance" dentro de ±$0.01
E o epoBalance retornado pelo sistema coincide com o "EPO Balance" dentro de ±$0.01
E o "EPO Balance" é estritamente menor que o "Total Contract Amount" (AC4)
E a flag "Eligible for 90-day Pay Off" está marcada e a "90-day Expiration Date" está preenchida
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Fórmula CA no Servicing | `epoBalance == cashPrice + ((cashPrice - processingFee - buyoutFee) * taxRate/100)` (tolerância $0.01) | `spec:406-409` (`expectCaFormula`); painel `Cost/Cash Price`/`Processing Fee`/`Buyout Fee`/`Tax Rate (%)`/`EPO Balance` (`account-summary.page.ts:104-117`) |
| `90-day Total` == `EPO Balance` | `ninetyDayTotal` = mesmo valor computado (tolerância $0.01) | `spec:410`; label `90-day Total` (`account-summary.page.ts:106`) |
| Servicing == Customer Portal | `abs(servicing.epoBalance - portal "Balance if Paid Off Today") <= $0.01` | `spec:411`; `readBalanceIfPaidOffToday` label `Balance if Paid Off Today` (`customer-portal-overview.page.ts:63-65`) |
| Servicing == API | `abs(servicing.epoBalance - api.epoBalance) <= $0.01` | `spec:412`; `getAccountSummary` body `epoBalance` (`svc-payoff.client.ts:28-30`) |
| EPO Balance < Total Contract Amount (AC4) | `epoBalance < totalContractAmount` | `spec:471`; label `Total Contract Amount` (`account-summary.page.ts:113`) |
| Elegibilidade + expiração populadas | `eligible === true` E `expirationDate !== ''` | `spec:475-476`; labels `Eligible for 90-day Pay Off` / `90-day Expiration Date` (`account-summary.page.ts:111-112`) |

---

## CT-A2 — UOWN + CA + 13m baseline equivale ao 16m para a mesma cesta de fees

```gherkin
Dado que um lease UOWN (Daniel's Jewelers) em CA com programa de 13 meses foi levado a ACTIVE
Quando o agente lê o painel EPO no Servicing, o cliente lê o Customer Portal e o sistema é consultado
Então o "EPO Balance" segue a mesma fórmula CA aplicada ao 16m (paridade 13m ≡ 16m para a mesma cesta de fees)
E Servicing, Customer Portal e API coincidem dentro de ±$0.01
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Fórmula CA aplicada ao 13m | `expectCaFormula` passa com tolerância $0.01 | `spec:497` |
| Paridade 13m ≡ 16m | registrada como annotation `CT-A2-baseline` (CTs rodam independentes — regra #9; não é assert acoplado cross-CT) | `spec:501-504` |
| Tri-superfície coincide | Servicing == Portal == API dentro de $0.01 (embutido em `expectCaFormula`) | `spec:411-412` |

---

## CT-A3 — Kornerstone KS3015 + CA + 16m segue a fórmula CA (cross-brand)

```gherkin
Dado que um lease Kornerstone (KS3015 / Fifth Ave Furniture) em CA com programa de 16 meses foi levado a ACTIVE
Quando o agente lê o painel EPO, o cliente lê o Customer Portal e o sistema é consultado
Então o "EPO Balance" segue a fórmula CA idêntica à das marcas UOWN (a correção svc#531 é agnóstica de marca)
E Servicing, Customer Portal e API coincidem dentro de ±$0.01
E o "EPO Balance" é estritamente menor que o "Total Contract Amount"
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Fórmula CA em Kornerstone | `expectCaFormula` passa (tolerância $0.01) | `spec:523` |
| EPO Balance < Total Contract Amount | `epoBalance < totalContractAmount` | `spec:524` |

---

## CT-A4 — Tri-superfície: Servicing == Customer Portal == API breakdown (perna PDF é observação soft)

```gherkin
Dado que um lease UOWN em CA com programa de 16 meses foi levado a ACTIVE
Quando o valor de EPO é lido nas três superfícies (Servicing, Customer Portal, API)
Então o "EPO Balance" do Servicing coincide com o "Balance if Paid Off Today" do Portal dentro de ±$0.01
E o "EPO Balance" do Servicing coincide com o epoBalance da API dentro de ±$0.01
E a perna PDF (contrato assinado) é registrada como [OBSERVAÇÃO] quando a assinatura foi conduzida via API (uown_esign_document ausente), não como falha dura
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Servicing == Portal | `abs(servicing.epoBalance - portalBalance) <= $0.01` | `spec:543-545` |
| Servicing == API | `abs(servicing.epoBalance - apiSurface.epoBalance) <= $0.01` | `spec:547-550` |
| Perna PDF (soft) | se `uown_esign_document` ausente para o `lead_pk` → registrar `[OBSERVAÇÃO]` e continuar (assinatura via API); se presente → registrar snapshot; NUNCA falha dura (extractor regex ainda não validado ao vivo) | `spec:555-571` |

> **Ressalva PDF:** o extractor de "90-day Total" do PDF é sensível ao template e ainda não foi validado contra um render GowSign fresco em qa1 (SPEC §PDF leg). A tri-superfície Servicing/Portal/API permanece hard-assert; o PDF é `[OBSERVAÇÃO]` na primeira execução.

---

## CT-A5 — Marca UOWN estrita (PayPossible) + CA + 16m segue a fórmula CA (AC5)

```gherkin
Dado que um lease PayPossible (PP00001-0001, marca UOWN nativa com "GOW 16 month program" em CA) foi levado a ACTIVE
E a aplicação usou SSN com sufixo 916 para forçar EligibleTerms=16 no mock BlackBox de qa1
Quando o agente lê o painel EPO, o cliente lê o Customer Portal e o sistema é consultado
Então o "EPO Balance" segue a fórmula CA (validação estrita de marca UOWN, sem inferência via Kornerstone)
E Servicing, Customer Portal e API coincidem dentro de ±$0.01
E o "EPO Balance" é estritamente menor que o "Total Contract Amount" (AC4)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Fórmula CA em marca UOWN estrita | `expectCaFormula` passa (tolerância $0.01) | `spec:597-598` |
| EPO Balance < Total Contract Amount (AC4) | `epoBalance < totalContractAmount` | `spec:601-602` |
| Anotação de evidência AC5 | annotation `AC5-strict-uown` com `epoBalance`, `cashPrice`, `taxRate` | `spec:605-608` |

---

## CT-B1 — UOWN + CA + 13m NÃO regrediu (ainda segue a fórmula CA)

```gherkin
Dado que um lease UOWN (Daniel's Jewelers) em CA com programa de 13 meses foi levado a ACTIVE
Quando o valor de EPO é lido nas três superfícies
Então o "EPO Balance" ainda segue a fórmula CA (a correção svc#531 do 16m não quebrou o caminho 13m já existente)
E Servicing, Customer Portal e API coincidem dentro de ±$0.01
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| 13m não regrediu | `expectCaFormula` passa (tolerância $0.01) | `spec:637` |

---

## CT-B2 — UOWN + NY + 16m controle negativo: EPO NÃO segue a fórmula CA

```gherkin
Dado que um lease Kornerstone em NY (não-CA) com programa de 16 meses foi levado a ACTIVE
Quando o valor de EPO é lido nas três superfícies
Então o "EPO Balance" NÃO segue a fórmula CA — diverge do valor CA por mais do que a tolerância (a regra CA não vaza para NY)
E, ainda assim, Servicing, Customer Portal e API concordam entre si dentro de ±$0.01 (sem drift de tri-superfície em NY)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| EPO NÃO é a fórmula CA | `abs(epoBalance - caFormula) > $0.01` (`expectNotCaFormula`); `epoBalance` não é NaN | `spec:415-428` (`expectNotCaFormula`), `spec:656` |
| Tri-superfície ainda coincide em NY | `abs(servicing.epoBalance - portalBalance) <= $0.01` E `abs(servicing.epoBalance - api.epoBalance) <= $0.01` | `spec:659-660` |

---

## CT-B3 — Kornerstone KS5936 + CA + 13m smoke (cross-brand 13m)

```gherkin
Dado que um lease Kornerstone (KS5936 / Griffins) em CA com programa de 13 meses foi levado a ACTIVE
Quando o valor de EPO é lido nas três superfícies
Então o "EPO Balance" segue a fórmula CA (cobertura cross-brand do caminho 13m)
E Servicing, Customer Portal e API coincidem dentro de ±$0.01
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Fórmula CA cross-brand 13m | `expectCaFormula` passa (tolerância $0.01) | `spec:686` |
| Ressalva stg | em stg, KS3015 + CA + 13m recebe UW_DENIED (cap de valor do programa 13m não cobre $3500 cashPrice) → CT pulado em stg; limitação de config de ambiente, não bug de código | `spec:667-673` |

---

## CT-C1 — today == earlyPayoffDateExpiry ainda dentro da janela (fórmula CA permanece)

```gherkin
Dado que um lease Kornerstone em CA com programa de 16 meses foi levado a ACTIVE
Quando o _90DayExpirationDate é ajustado para hoje via o endpoint oficial createOrUpdateServicingInfo
Então o breakdown de EPO permanece no regime "ca" no dia de fronteira (EpoEligibleService usa !isBefore(now) → estrito-na-igualdade)
E a flag "Eligible for 90-day Pay Off" permanece marcada no Servicing no dia de fronteira
E uma linha DATA_CHANGE é gravada em uown_sv_activity_log referenciando "90DayExpirationDate" (regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Regime permanece CA na fronteira | `detectEpoRegime(getServicingInfo.epoBreakdown) === 'ca'` após shift para hoje (`calculateDateISO(0)`) | `spec:713-730` (`detectEpoRegime` `spec:373-396`) |
| Flag de elegibilidade permanece true | `servicing.eligible === true` | `spec:734-737` |
| Log DATA_CHANGE (regra #13) | linha em `uown_sv_activity_log` WHERE `account_pk=$1 AND notes ILIKE '%90DayExpirationDate%'`; se ausente → `[OBSERVACAO]` (filtro específico evita as linhas genéricas LIFECYCLE emitidas no FUNDED→ACTIVE) | `spec:741-763` |

```sql
-- Validação DB CT-C1 (substituir $accountPk)
SELECT pk, notes
  FROM uown_sv_activity_log
 WHERE account_pk = $accountPk
   AND notes ILIKE '%90DayExpirationDate%'
 ORDER BY pk DESC
 LIMIT 1;
```

> **Nota de mecânica de regime (não asseverar por valor numérico):** para um lease recém-ativado (`DaysUsed = 0`) e KS5936 (`processingFee = buyoutFee = 0`), a fórmula legada `anytimeBuyOut` COINCIDE numericamente com a fórmula CA (`DailyLeaseAmount*0 = 0` → ambas reduzem a `cashPrice + tax`). Por isso a fronteira é validada pelo **rótulo/shape do `epoBreakdown`** (`detectEpoRegime`), não por divergência numérica.

---

## CT-C2 — yesterday para earlyPayoffDateExpiry reverte o EPO ao legado (16m ≠ fórmula CA)

```gherkin
Dado que um lease Kornerstone em CA com programa de 16 meses foi levado a ACTIVE e está no regime "ca"
Quando o _90DayExpirationDate é ajustado para ontem via createOrUpdateServicingInfo (janela de 90 dias expirada)
Então o regime do breakdown de EPO vira de "ca" para "legacy16m" (a fórmula reverte ao anytimeBuyOut legado após a expiração)
E a flag "Eligible for 90-day Pay Off" vira para não-marcada (false) no Servicing
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Regime pré-shift é CA | `detectEpoRegime(preInfo.epoBreakdown) === 'ca'` | `spec:788-804` |
| Regime pós-shift é legacy16m | após shift para ontem (`calculateDateISO(-1)`), `detectEpoRegime(postInfo.epoBreakdown) === 'legacy16m'` | `spec:799-805` |
| Flag de elegibilidade vira false | `servicing.eligible === false` | `spec:811-812` |

---

## Fingerprints de regime (detectEpoRegime — `spec:373-396`)

O `epoBreakdown` retornado por `getServicingInfo` é uma matriz `string[][]` (row[0] = cabeçalhos, row[1] = valores) cujo **shape difere** por regime:

- **Regime CA (dentro de 90d):** cabeçalho contém `"90 Day Payoff Eligible"` / `"90 Day Payoff Amount"`; célula de fórmula menciona `"90 Day Payoff Amount - Total Paid Amount + Fees"`.
- **Regime legado 16m (pós-expiração):** row label `"16 Month Anytime Buyout"`; célula de fórmula menciona `"DailyLeaseAmount"` / `"anytime buy out"`.

`detectEpoRegime` retorna `'ca'`, `'legacy16m'` ou `'unknown'` — as fronteiras C1/C2 são validadas por esse fingerprint, robusto para leases recém-ativados onde as fórmulas coincidem numericamente.

---

## Pré-condições

- **Preflight do merchant** (regra #12): `createPreQualifiedApplication` chama `ensureMerchantReady` automaticamente; setup usa a cadeia canônica `createPreQualifiedApplication → driveLeadToFunding → updateFundingStatus FUNDED → waitForAccountStatus ACTIVE`.
- **Restrição de termo por merchant:** `restrictMerchantToSingleTerm(api, merchantPk, termMonths)` desativa programas de outro termo imediatamente antes de `sendApplication`, restaurando-os assim que o lead é APPROVED — obrigatório porque o mock BlackBox de qa1 e os merchants Kornerstone aprovam ambos os termos e o svc escolhe o primeiro elegível (`spec:194-240`).
- **Regra do SSN 916:** para 16m em merchants UOWN (não-Kornerstone), o SSN deve terminar em `916` para forçar `EligibleTerms=16` no mock BlackBox de qa1; gerar prefixo aleatório de 6 dígitos + `916` (evitar o literal `888880916`, profile-bound → DataMismatchStep) (`spec:150-157`).
- **Income override para 16m:** `mainAnnualIncome=150_000` empurra o BlackBoxApproval acima do corte do tier 16m (`spec:225-231`).
- **Rotação de conta bancária Kornerstone:** número de conta único por run (`16078` + timestamp) para evitar DENIED por reaprovação (`PreviousLeadsService` — primeira parcela não paga) (`spec:160-172`).
- **Ambientes:** somente **qa1** e **stg** têm os merchants KS + programas necessários; demais ambientes são pulados (`spec:433-438`). Em stg, KS5936 não está registrado na API de origination → usar KS3015 (FifthAveFurnitureNY) (`spec:76-79`).
- **Viewport:** Servicing 1440×900; Customer Portal 375×667 (regra #15).
- **Invalidação de cache:** aguardar ~5 s após `setEarlyPayoffDateExpiry` antes de reler o regime (`spec:716, 796`).

## Log de Atividade (Regra #13)

A leitura do EPO (painel Servicing, card do Portal, API) é somente leitura → **não** gera nota de atividade (esperado; SPEC §9 OBS-2/OBS-4). A única mutação do fluxo — ajustar `_90DayExpirationDate` via `createOrUpdateServicingInfo` (Grupo C) — SIM emite `DATA_CHANGE` em `uown_sv_activity_log` (coluna `notes`, referenciando `90DayExpirationDate`), asseverada em CT-C1. Ausência dessa linha em C1 é registrada como `[OBSERVACAO]`.

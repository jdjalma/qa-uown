---
title: Terms of Agreement — Página de Revisão do Contrato (Consumer Portal)
domain: knowledge-base
status: snapshot
volatility: volatile
last_verified: 2026-06-28
sources:
  - env: stg
  - lead: 5ARIwnGc (TireAgent OW90218-0001, CA, $462/13m, planId WK13)
covers: [terms-of-agreement, contract-complete, toa-page, protection-plus-flow, see-protection-benefits, sign-contract-button, missingDataPanel]
promoted_to: []
---

# Terms of Agreement — Página de Revisão do Contrato (`/{shortCode}/complete`)

> Discovery ao vivo — stg, 2026-06-28. Lead shortCode `5ARIwnGc` (TireAgent OW90218-0001, CA).
> Mesmo URL da página CC/ACH — estados diferentes conforme `lead_status`.

---

## O que é

A "Terms of Agreement page" é o **estado intermediário** da contract URL
(`/{shortCode}/complete?planId={planId}`) entre o submit do CC/ACH e a cerimônia de assinatura.
A **mesma URL** exibe conteúdos distintos conforme o estado atual do lead:

| Estado do lead | O que a URL renderiza |
|---|---|
| `UW_APPROVED / INVOICE_CREATED` | Formulário CC/ACH (ver `cc-ach-contract-complete-page.md`) |
| `CONTRACT_CREATED` (URL revisitada antes de clicar) | Estado A — banner "SIGN CONTRACT" |
| `CONTRACT_CREATED` (após clicar "SIGN CONTRACT") | Estado B — Terms of Agreement completo |
| `CONTRACT_CREATED` + PP ofertado + checkbox OK | Estado D — overlay Buddy Protection Plus |

---

## Máquina de estados (live stg 2026-06-28)

### Estado A — Revisita pós-CC/ACH ("SIGN CONTRACT")

Quando o lead já está em `CONTRACT_CREATED` e a URL é aberta novamente
(ex: cliente volta ao link do e-mail):

```
#missingDataPanel visível
  header: "Thank you for selecting Uown Leasing as your lease financing partner!"
  subtext: "Please review your Terms of Agreement by clicking the button below..."
  botão: #completeApplication-submit  →  texto "SIGN CONTRACT"
  #missingDataForm vazio (sem campos CC/ACH)
  iframe#ibody (Kaptcha)
```

Clicar **SIGN CONTRACT** → revela o Estado B inline (sem reload de página).

### Estado B — Terms of Agreement (após clicar "SIGN CONTRACT")

Conteúdo dentro de `#termsOfAgreementForm`:

**Seção First Payment**
- Texto: "Your initial Lease payment is $X due on MM/DD/YYYY"
- Subtexto: "(includes tax and processing fee if applicable)"
- Seletor dos valores: `[class*="termsOfAgreement__form__container__body__span"]`
  - nth(0) = initialPayment (ex: `$30.22`)
  - nth(1) = initialPaymentDueDate (ex: `08/01/2026`)
- Texto auxiliar: data ajustada para dia útil se cair em feriado/fim-de-semana
- Número de contato do suporte

**Seção 90 Day Early Purchase Option**
- Valor EPO: `.font-family-gotham-bold.font-size_18px` (primeiro match, ex: `$871.33`)
- Texto descritivo do EPO

**Seção "N Months to Ownership"**
- Seletor das linhas: `[class*="termsOfAgreement__form__container__body__description"]`
  - nth(0) = paymentFrequency (ex: `Weekly`)
  - nth(1) = numberOfPayments (ex: `56`)
  - nth(2) = paymentAmount (ex: `$30.22`)
  - nth(3) = totalPaymentAmount (ex: `$1,732.57`)
  - nth(4) = `"90 Day Early Purchase Option"` (ignorado no `getSummary()`)
- Texto de Early Purchase Options (descrição)

**Tabela Items on Lease** (react-data-table-component)
- Rows: `.rdt_TableBody .rdt_TableRow` (1 row por item)
- Colunas por row: `[data-column-id="1"]` = Model #, `[data-column-id="2"]` = Description, `[data-column-id="3"]` = Item Price

**Checkboxes de consentimento**
- `#isInfoConfirmed` — "I confirm all information is true and complete"
- `#isEverythingAgreed` — "I agree to Privacy Policy, T&C, Electronic Disclosures"

**Botão primary (depende do merchant)**
- **PP ofertado** (`offerInsurance=true`): `button:has-text("See Protection Benefits")` (`SELECTORS.seeProtectionBenefitsBtn`)
- **PP não ofertado**: botão "Proceed to signature" (`getByRole('button', {name:/proceed to signature/i})`) — **NÃO é HTML-disabled** (`button.disabled === false`) antes dos checkboxes. A validação é via React submit handler → toast "You must confirm that all information is true and complete." se clicado sem ambos os checkboxes marcados. Confirmado live stg 2026-06-28, lead 7218270.

### Estado C — Validação de checkboxes (ambos os tipos de merchant)

Clicar o botão primário (PP: "SEE PROTECTION BENEFITS"; não-PP: "Proceed to signature") **sem** ambos os checkboxes marcados:
- Toast de erro: "You must confirm that all information is true and complete."
- **Nenhum dos botões é HTML-disabled** — a validação é via React submit handler → toast JS.
  - PP merchant: confirmado live stg 2026-06-28 (lead shortCode `5ARIwnGc`)
  - Não-PP merchant: confirmado live stg 2026-06-28 (lead 7218270)
- Sem mudança de estado; o formulário permanece no Estado B

### Estado D — PP overlay visível

Após marcar `#isInfoConfirmed` + `#isEverythingAgreed` e clicar "SEE PROTECTION BENEFITS":
- Container PP: `[class*="purchase-insurance_buddyOfferContainer"]` muda de `display:none` → `display:block`
- `#buddy_iframe` carrega o widget Buddy Protection Plus
- Radios:
  - nth(0) Opt-in: "I agree to joining Uown Protection Plus for $X/week..."
  - nth(1) Opt-out: "No, continue unprotected"
- Botão avançar: `#purchase-insurance-submit-btn` (`SELECTORS.purchaseInsuranceSubmitBtn`)

Selecionar radio + clicar `#purchase-insurance-submit-btn` → modal GowSign abre.

---

## Page Object

`src/pages/origination/terms-of-agreement.page.ts` (barrel: `src/pages/origination/index.ts`)

| Método | Descrição |
|---|---|
| `waitForLoaded(timeoutMs?)` | Aguarda `#termsOfAgreementForm` visível |
| `waitForLeftTermsPage(timeoutMs?)` | Race: iframe esign attached OU form hidden |
| `checkInfoConfirmed()` | Marca `#isInfoConfirmed` |
| `checkEverythingAgreed()` | Marca `#isEverythingAgreed` |
| `checkAll()` | Ambos checkboxes |
| `clickProceedToSignature()` | `getByRole('button', {name:/proceed to signature/i})` |
| `acceptAndProceed()` | checkAll + clickProceedToSignature (não-PP) |
| `acceptAndProceedWithProtectionPlan(ppOptIn)` | Full PP flow; retorna `{buddyReached, radioClicked}` |
| `acceptProtectionPlanAlreadyEnrolled()` | Variante "already enrolled"; retorna `{alreadyEnrolled}` |
| `getSummary()` | `TermsSummary` com initialPayment, EPO, freq, qty, amount, total |
| `getLeaseItems()` | Array `{modelNumber, description, itemPrice}` |

**Tipos exportados:** `TermsSummary`, `ProtectionPlanOutcome`

---

## Seletores confirmados (stg live 2026-06-28)

| Seletor | IDs/classes reais | Uso |
|---|---|---|
| `#termsOfAgreementForm` | id `termsOfAgreementForm` | Container principal ToA |
| `#completeApplication-submit` | id `completeApplication-submit` | Botão "SIGN CONTRACT" (Estado A) |
| `#isInfoConfirmed` | id `isInfoConfirmed` | Checkbox 1 |
| `#isEverythingAgreed` | id `isEverythingAgreed` | Checkbox 2 |
| `button:has-text("See Protection Benefits")` | (`SELECTORS.seeProtectionBenefitsBtn`) | Botão PP primary |
| `[class*="purchase-insurance_buddyOfferContainer"]` | `purchase-insurance_buddyOfferContainer__8ZdrB` | PP overlay |
| `#buddy_iframe` | id `buddy_iframe` | Iframe Buddy widget |
| `#purchase-insurance-submit-btn` | (`SELECTORS.purchaseInsuranceSubmitBtn`) | Avançar no PP overlay |
| `[class*="termsOfAgreement__form__container__body__span"]` | 2 elementos | initialPayment, dueDate |
| `[class*="termsOfAgreement__form__container__body__description"]` | 5 elementos | freq/qty/amount/total + EPO label |
| `.font-family-gotham-bold.font-size_18px` | Classe utilitária estável | Valor EPO |
| `.rdt_TableBody .rdt_TableRow` | react-data-table rows | Items on lease |
| `[data-column-id="1/2/3"]` | Células de tabela | Model#/Description/Price |

> **CSS Module hashes:** seletores de `getSummary()` usam `[class*="prefix"]` (não hash literal)
> para sobreviver re-builds do webpack. O hash (`__rotPG`, `__pVs0U`) não é estável.

---

## Oracle relacionado

`gowsign-signing.md` — CT-01 a CT-04 cobrem a página de Terms of Agreement:
- CT-01: resumo + itens renderizados
- CT-02: botão desabilitado até checkboxes (não-PP merchant)
- CT-02b: PP merchant — toast de validação (confirmado live stg 2026-06-28)
- CT-03: PP opt-in/opt-out flow
- CT-04: PP already-enrolled (sem radios)

---

## Notas

- **Estado A** ("SIGN CONTRACT") só aparece na revisita de URL. No fluxo inline (CC/ACH submit → ToA),
  o Estado A é efêmero — o formulário muda para Estado B automaticamente.
- **Toast vs. disabled (AMBOS os tipos de merchant):** nenhum dos dois botões primários da ToA é
  HTML-disabled. Em merchant PP-enabled ("See Protection Benefits") e em merchant sem PP ("Proceed to
  signature"), a validação é via React submit handler → toast "You must confirm that all information is
  true and complete." quando os checkboxes não estão marcados. Testes NÃO devem usar `isDisabled()` nem
  `toBeDisabled()` nesses botões — usar `expect(btn).not.toBeDisabled()` + verificar o toast. Confirmado
  para merchant PP (live stg 2026-06-28, lead shortCode `5ARIwnGc`) e merchant sem PP (live stg 2026-06-28,
  lead 7218270). Veja Estado C acima.
- **`#purchase-insurance-submit-btn` vs `button:has-text("PROCEED TO SIGNATURE")`:** são elementos
  diferentes — o primeiro é o botão no overlay PP; o segundo o botão direto em merchants sem PP.

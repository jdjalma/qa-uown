---
title: "Apendice H: Registro de Templates EPO 16 Meses"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - external-doc: https://gitlab.com/groups/uown/-/wikis/gow-sign/EPO-SECTIONS
covers: [epo, template-rendering, gowsign-routing, 16m-lease, state-rules]
---

# Apendice H: Registro de Templates EPO 16 Meses
## UOwn Leasing - SVC Platform

Registro canonico do conteudo dos templates de contrato GowSign **16 meses** (SAC) — clausulas EPO (Early Purchase Option) por estado, tokens renderizaveis e matriz de validacao. E o registro de **conteudo de contrato** que complementa a **calculo** EPO de [`04-calculos-financeiros.md`](04-calculos-financeiros.md) §7/§15/§56/§70 (a cascata de calculo NAO se repete aqui) e o **fluxo** de e-sign de [`03-contratos-esign.md`](03-contratos-esign.md) §8.

> **Fonte primaria (autoritativa):** GitLab wiki `gow-sign/EPO-SECTIONS` — `https://gitlab.com/groups/uown/-/wikis/gow-sign/EPO-SECTIONS` (capturado 2026-06-23). `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`. Por ser fonte oficial do produto, as clausulas e tokens abaixo sao `[CONFIRMADO]`. Correlacoes com regressoes conhecidas sao `[HIPOTESE]` salvo onde a memoria datada confirma.
>
> **Por que `volatility: volatile`:** template state-routing/conteudo drifta (cat. #17 de [[volatile-knowledge-registry]] — foi o caso NY/OH). Sempre reconfirmar contra o template real (`uown_gow_sign_template`) e o PDF flatten antes de afirmar estado-vigente.

---

## H.1 Legenda de status do diagnostico

| Status | Significado |
|--------|-------------|
| **Reuse** | A superficie alinha com um cluster 16-meses ja validado; pode reaproveitar o texto do doador. |
| **Reuse — adjustments** | Majoritariamente reaproveitavel; deltas especificos listados. |
| **New baseline** | Nao alinha com doadores existentes — o negocio deve validar como tipo novo. |

Os templates HTML 16-meses de **CA, TX e FL** estao business-validated. FL e um *reuse adjustment* do doador TX (variante exercise-date). `[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`

---

## H.2 Baselines 16 meses validados (R1–R5)

Cada baseline e um **section type** com texto canonico e estados aplicaveis. O eixo principal de variacao e **daily-accrual ate a data corrente (`current_date_*`)** vs **ate a data de exercicio (`exercise_date_*`)**.

### R1 — `current_date_promo` (Item 4 — daily fees ate a data corrente)
**Estados:** CA, TX

> **Promotional-Payoff Option:** You can buy the Property at any time by paying $ {{costPriceWithFeeNoTax}} plus tax, less all rental payments you have made on time (not including any taxes or fees), plus daily lease fees from the inception of the lease through the date you exercise the Early Purchase Option. Any late payments will void this option.

### R1 — `exercise_date_promo` (Item 4 — daily fees ate a data de exercicio)
**Estados:** AL, FL, LA, NC, TN

> **Promotional Payoff Option:** You can buy the Property at any time by paying $ {{costPriceWithFeeNoTax}} plus tax, less all rental payments you have made on time (not including any taxes or fees), plus daily lease fees from the inception of the lease through the date you exercise the Early Purchase Option. Any late payments will void this option.

### R2 — `exercise_date_epo_fl` (Item 4a — exercise date + nextPaymentDueAmount / salesTax)
**Estados:** AL, FL, NC, TN

> **Lease-Purchase Ownership:** You do not own the property. However, if you choose, you may purchase the property at any time. If you are current, you may elect your Early Purchase Option (EPO) at any time. Your EPO price is calculated by adding the daily lease charges accrued based on the number of days from lease inception through the date you exercise the Early Purchase Option, together with all applicable fees and taxes, less all rental payments you have made on time (not including taxes and fees). The purchase price does not include other charges such as late fees, which are explained below. You do not obtain any ownership rights until you have paid for the Property in full. If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the processing fee, you will have paid a total of $ {{contractAmount}} (the "Total Cost"), and you will own the Property.

### R2 — `current_date_epo_tx` (Item 4a — current date + Total Cost / application fee)
**Estados:** TX

> **Lease-Purchase Ownership:** You do not own the property. However, if you choose, you may purchase the property at any time. If you are current, you may elect your Early Purchase Option (EPO) at any time. Your EPO price is calculated by adding the daily lease charges accrued based on the number of days from lease inception through the current date, together with all applicable fees and taxes, less all rental payments you have made on time (not including taxes and fees). The purchase price does not include other charges such as late fees, which are explained below. You do not obtain any ownership rights until you have paid for the Property in full. If you make {{totalNumberOfPayments}} payments of $ {{firstPaymentDueAmount}} (plus tax) in a row, you will have paid a total of $ {{contractAmount}} (including tax) (including the application fee), the "Total Cost," and you will own the Property. Taxes are subject to changes in the applicable tax rate.

### R2 — `current_date_epo_ca` (Item 4a — current date + Total of Payments / Processing Fee)
**Estados:** CA

> **Lease-Purchase Ownership:** You do not own the property. However, if you choose, you may purchase the property at any time. If you are current, you may elect your Early Purchase Option (EPO) at any time. Your EPO price is calculated by adding the daily lease charges accrued based on the number of days from lease inception through the current date, together with all applicable fees and taxes, less all rental payments you have made on time (not including taxes and fees). The purchase price does not include other charges such as late fees, which are explained below. You do not obtain any ownership rights until you have paid for the Property in full. If you make {{totalNumberOfPayments}} payments of ${{firstPaymentDueAmount}} (plus tax) in a row, and you pay the Processing Fee, you will have paid a total of ${{contractAmount}}, the "Total of Payments," and you will own the Property.

### R3 — `shared_16month_appendix` (Appendix — pagina de formula 16-meses compartilhada)
**Estados:** AL, CA, FL, LA, NC, TN, TX

> EARLY PURCHASE OPTION
>
> This Agreement has a 16-month term for ownership. However, you may purchase the Property at any time before the end of the lease term.
>
> Early Purchase Option ("EPO"): You may buy the Property at any time by paying the EPO price. For a 16-month lease, the EPO price is calculated as:
>
> The cost of the leased goods · Plus taxes · Plus applicable fees · Plus accrued daily lease fees from the lease inception date through the date you exercise the Early Purchase Option. · Minus any payments made, excluding taxes and fees
>
> To exercise this option, you must call us at {{companyInfoBrandPhone}}.

### R4 — `shared_footnote` (Footnote do plano de lease — opcao Promotional Payoff)
**Estados:** AL, CA, FL, LA, NC, TN, TX

> with a Promotional Payoff option

### R5 — `ca_chart` (Chart de payoff EPO)
**Estados:** CA

> **Early Purchase Option – Amount Following Each Rental Payment**
>
> The following chart shows your Early Purchase Option ("EPO") price after each lease payment, assuming you make each payment on time. Please note that any amounts that are past due must be paid before you may exercise your Early Purchase Option.
>
> `[table|earlyPurchaseOption]`

---

## H.3 Diagnostico dos templates SAC por estado

Diagnostico de reuso vs new-baseline para cada `*_2025_SAC.html`. As variantes de clausula (R1–R5) que **diferem** dos baselines validados estao em `<details>` (texto legal verbatim). O template 16-meses implementado e `*_16_MONTHS.html`.

### AL — `AL_2025_SAC.html` — **Reuse TX**
Reaproveita clusters TX exercise-date daily-accrual (Item 4a estilo FL).
<details>
<summary>R1 — Item 4 — Promotional payoff (closest: <code>exercise_date_promo</code>)</summary>

> **{{epoDays}} Day Promotional Payoff Option:** During the first {{epoDays}} days from the date of your Initial Payment (Item 2), you can buy the Property by paying the Cash Price, {{epoFeeText}} a total of $ {{payOffAmountBeforeEPOExpiry}}, less all rental payments you have made on time (not including any taxes or fees), plus tax. Any late payments will void this option. You have other purchase options described below.
</details>
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (closest: <code>exercise_date_epo_fl</code>)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional-Payoff Option (Item 4) you may acquire ownership of the Property at any time by tendering to us all past due lease payments and fees and an amount equal to the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the processing fee, you will have paid a total of $ {{contractAmount}} (the "Total Cost"), and you will own the Property.
</details>
<details>
<summary>R3 — Consumer appendix (EARLY PURCHASE OPTIONS page) (closest: <code>shared_16month_appendix</code>)</summary>

> **EARLY PURCHASE OPTIONS** — This Agreement has a {{numOfMonths}}-month term for ownership. (1) Promotional Payoff Option: Purchase within {{epoDays}} days from when your Initial Payment becomes due and pay only $ {{payOffAmountBeforeEPOExpiry}}, including tax. Call {{companyInfoBrandPhone}}. Price = Cash Price, {{epoFeeText}} less all rental payments made (not including any taxes or fees), plus tax. Only available on the {{companyInfoBrandName}} Traditional Lease Purchase Plan. (2) Early Purchase Option: Beginning {{payOffStartDateAfterEpoExpiry}}, buy at any time by paying the EPO price. Call {{companyInfoBrandPhone}}.
</details>

### GA — `GA_2025_SAC.html` — **Reuse TX**
Revisao de negocio antes do build 16-meses. R1 closest `current_date_promo`, R2 closest `exercise_date_epo_fl` (usa `{{epoExpiryDate}}` + `{{payOffDiscountPercent}}%`).
<details>
<summary>R2 — Item 4a — Early Purchase Option (GA)</summary>

> **Early Purchase Option:** ...After {{epoExpiryDate}}, your EPO price is the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax...
</details>

### LA — `LA_2025_SAC.html` — **Reuse TX — adjustments**
Reaproveita TX exercise-date daily-accrual com tail LA de Item 4a ownership.
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (LA)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional-Payoff Option, your EPO price is the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the Processing Fee, you will have paid a total of $ {{contractAmount}}, the "Total Cost"...
</details>

### NC — `NC_2025_SAC.html` — **Reuse TX**
Particularidade NC: **EPO nunca abaixo de `{{lastPaymentDueAmountWithTax}}`** (floor balloon) + balloon final `{{lastPaymentDueAmount}}`.
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (NC, com balloon floor)</summary>

> **Lease-Purchase Ownership:** ...Your EPO price is the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax. However, your EPO price will never be less than $ {{lastPaymentDueAmountWithTax}}... If you make {{totalNumberOfPaymentsBeforeFinal}} payments of $ {{nextPaymentDueAmount}} (plus tax) in a row Plus a final balloon payment of $ {{lastPaymentDueAmount}} (plus tax), you will have paid a total of $ {{contractAmount}}...
</details>

### NY — `NY_2025_SAC.html` — **New baseline ⚠**
**Formula proporcional Cash Price** em Item 4a, NAO daily-accrual. Nao alinha com os doadores 16-meses validados — risco de validacao distinto (ver H.5).
<details>
<summary>R2 — Item 4a — Rental-Purchase Ownership / EPO (NY proporcional)</summary>

> **Rental-Purchase Ownership:** ...After the Promotional-Payoff Option expires, you may acquire ownership of the Property at any time by tendering to us all past due rental payments and fees and an amount equal to the Cash Price, $ {{costPriceWithFeeNoTax}}, multiplied by the number of rental payments remaining for ownership divided by the total number of rental payments for ownership (not including any taxes or fees), plus tax (EPO Price). The attached chart shows the amount required to exercise your early purchase option after each renewal payment... If you make {{totalNumberOfPayments}} payments of $ {{firstPaymentDueAmount}} plus $ {{salesTax}} in sales tax) in a row, and you pay the Processing Fee, you will have paid a total of $ {{contractAmount}}, the "Total Cost"...
</details>

NY tambem reaproveita o **R5 `ca_chart`** (`[table|earlyPurchaseOption]`).

### OH — `OH_2025_SAC.html` — **Reuse TX**
Particularidade OH: **EPO = Cash Price less 50% of payments made**.
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (OH, less 50%)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional Payoff Option expires, your EPO price is the Cash Price, above, {{epoFeeText}} less 50% of all lease payments made (not including any taxes or fees), plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you have paid the Processing Fee, you will have paid a total of $ {{contractAmount}}, the "Total Cost"...
</details>

### PA — `PA_2025_SAC.html` — **Reuse TX**
R2 usa desconto `{{payOffDiscountPercent}}%` sobre Cash Price; tambem reaproveita R5 `ca_chart`.
<details>
<summary>R2 — Item 4a — Early Purchase Option (PA)</summary>

> **Early Purchase Option:** ...After your {{epoDays}}-Day-Promotional-Payoff Option expires, your EPO price will be the Cash Price, $ {{costPriceWithFeeNoTax}}, less a {{payOffDiscountPercent}}% discount of lease payments made (not including any taxes or fees), plus tax...
</details>

### TN — `TN_2025_SAC.html` — **Reuse TX**
Reaproveita TX exercise-date daily-accrual (Item 4a estilo FL). Item 7 reinstatement tiers diferem (90/180 dias).
<details>
<summary>R2 — Item 4a — Lease-Purchase Ownership / EPO (TN)</summary>

> **Lease-Purchase Ownership:** ...After your {{epoDays}}-Day-Promotional-Payoff Option (Item 4) you may acquire ownership of the Property at any time by tendering... an amount equal to the total amount of remaining lease payments for ownership (not including any taxes or fees) less a {{payOffDiscountPercent}}% discount, plus tax... If you make {{totalNumberOfPayments}} payments of $ {{nextPaymentDueAmount}} plus $ {{salesTax}} in sales tax in a row, and you pay the processing fee, you will have paid a total of $ {{contractAmount}} (the "Total Cost")...
</details>

---

## H.4 Matriz de validacao (16-meses)

| Block | CA | TX | FL | LA | NC | AL | TN | PA | OH | GA |
|-------|----|----|----|----|----|----|----|----|----|----|
| R1 — Item 4 — Promotional payoff | `current_date_promo` | `current_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `exercise_date_promo` | `current_date_promo` | `exercise_date_promo` |
| R2 — Item 4a — Lease-Purchase Ownership / EPO | `current_date_epo_ca` | `current_date_epo_tx` | `exercise_date_epo_fl` | Differs | `exercise_date_epo_fl` | `exercise_date_epo_fl` | `exercise_date_epo_fl` | — | `current_date_epo_tx` | — |
| R3 — Consumer appendix (EARLY PURCHASE OPTION page) | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` | `shared_16month_appendix` |
| R4 — Lease plan table footnote | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` | `shared_footnote` |
| R5 — EPO payoff chart (CA only) | `ca_chart` | — | — | — | — | — | — | `ca_chart` | — | — |

`[external-doc:gitlab/EPO-SECTIONS,2026-06-23]`

---

## H.5 Glossario de tokens

Todo `{{token}}` que aparece nos templates EPO 16-meses. **Esses tokens DEVEM renderizar NAO-vazios no PDF assinado** para o respectivo estado.

| Token | Conteudo |
|-------|----------|
| `{{costPriceWithFeeNoTax}}` | Cash Price (com fee, sem tax) — base do EPO |
| `{{nextPaymentDueAmount}}` | Valor da proxima parcela (sem tax) |
| `{{salesTax}}` | Imposto sobre a parcela |
| `{{totalNumberOfPayments}}` | Numero total de parcelas |
| `{{totalNumberOfPaymentsBeforeFinal}}` | Parcelas antes do balloon final (NC) |
| `{{contractAmount}}` | "Total Cost" do contrato |
| `{{firstPaymentDueAmount}}` | Valor da primeira parcela |
| `{{epoDays}}` | Janela de Promotional Payoff (dias) |
| `{{epoFeeText}}` | Texto descritivo da fee EPO |
| `{{payOffAmountBeforeEPOExpiry}}` | Valor de payoff dentro da janela promocional |
| `{{payOffDiscountPercent}}` | Percentual de desconto EPO (estados PA/AL/LA/NC/TN/GA) |
| `{{epoExpiryDate}}` | Data de expiracao do EPO promocional |
| `{{payOffStartDateAfterEpoExpiry}}` | Inicio do EPO regular apos expiracao do promocional |
| `{{numOfMonths}}` | Termo em meses (16) |
| `{{companyInfoBrandPhone}}` | Telefone da marca (OH = (877)357-5474) |
| `{{companyInfoBrandName}}` | Nome da marca |
| `{{lastPaymentDueAmount}}` | Valor da parcela balloon final (NC) |
| `{{lastPaymentDueAmountWithTax}}` | Floor do EPO em NC (balloon com tax) |
| `[table|earlyPurchaseOption]` | Chart de payoff EPO (CA, NY, PA) — renderiza tabela dinamica |

---

## H.6 QA testing note — render NAO-vazio por estado

> **Regra de teste:** validar visualmente (PDF flatten / iframe — regra inviolavel #14) que os tokens EPO renderizam NAO-vazios para cada estado. Leitura de log de backend NAO substitui render (bug Daniel's Jewelers CA, 2026-05-06).

Regressoes conhecidas correlacionadas (`[HIPOTESE]` salvo memoria datada):
- **OH `{{nextPaymentDueAmount}}` em branco** — BUG-01. **FIXED/validado em qa2 2026-06-22** (renderiza 95.16/22.07/43.50; zero notas "variables map missing"). `[memory:ohio-gowsign-template-fixed]` `[CONFIRMADO via memoria datada — reconfirmar]`. Copy-check do contrato OH: ancorar em `AGREEMENT-OH` (a palavra "Ohio" NAO aparece no flatten); o appendix EPO quebra linha em `16-\nmonth` — ver [[gowsign-knowledge]] OH render facts.
- **NY New baseline (formula proporcional Cash Price, NAO daily-accrual)** — risco de validacao **distinto**: a logica de calculo NY (`cost * remaining/total`) diverge dos doadores daily-accrual. O template NY (`NY_2025_SAC`, 13m, route GowSign) e coberto. A regressao "epoDays within 90 days" foi FIXED em qa2 2026-06-21. `[memory:ny-gowsign-epodays-fixed]` `[HIPOTESE — reconfirmar contra o template/lead atual]`.

Validar template selecionado por lead via `assertSelectedTemplateForLead` — routing por **customer state** (INSTORE tambem usa customer state; ver cat. #17 [[volatile-knowledge-registry]]).

---

## Cross-links

- Calculo EPO (cascata por estado, Kornerstone, NC floor) → [`04-calculos-financeiros.md`](04-calculos-financeiros.md) §7/§15/§56/§70
- Fluxo de e-sign + EPO sections pointer → [`03-contratos-esign.md`](03-contratos-esign.md) §8
- Como testar signing (suites, regressao, helpers) → [[gowsign-knowledge]]
- API do vendor GowSign → [`appendix-a-integracoes.md`](appendix-a-integracoes.md) §GowSign Vendor API
- Categoria volatile #17 (template state-routing) → [[volatile-knowledge-registry]]

---

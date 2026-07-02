---
last-reviewed: 2026-06-30
last-reviewed-sha: cd2d2c8
covers:
  - docs/knowledge-base/illinois-gowsign-template.md
  - src/helpers/gowsign-template-db.helpers.ts
  - src/data/state-merchant-matrix.ts
  - src/helpers/gowsign-signing.helper.ts
  - src/helpers/esign-db.helpers.ts
---

# IL 16-Month GowSign Template — Content & Routing Oracle (work item #576)

> Operação: validar o conteúdo e o roteamento do template **`IL_2025_SAC_16_MONTHS`** (Illinois,
> 16 meses, SAC) renderizado no iframe GowSign, mais o controle negativo 13m (`IL_2025_SAC`).
> Esta operação é NOVA (não coberta pelos oracles de precondição). As precondições
> (`send-application`, `new-application`, `cc-ach`, `terms-of-agreement`, `gowsign-signing`) já
> têm oracle próprio — reutilize, não recrie.
>
> **Roteamento (rule de provider):** `effectiveState = INSTORE ? merchant.state : customerState`;
> existe linha em `uown_gow_sign_template` para `(IL, client_type=null)` em ambos os termos →
> GOWSIGN. O termo (13 vs 16) vem do programa do merchant (ABB Kornerstone → EligibleTerms 16),
> NÃO do sufixo de SSN. `uown_esign_document.client`/`document_name` (criados em CONTRACT_CREATED)
> são a fonte de verdade da seleção.
>
> **Inventário (stg, DB-confirmado 2026-06-30):** `IL_2025_SAC` pk38 (13m, `cv6dyyewqw2azzcsvlkg2xaj`)
> + `IL_2025_SAC_16_MONTHS` pk39 (16m, `r2t4ada62hdsmojymwipdfyv`), ambos `client_type=null`.
>
> **⚠️ Blocker de automação (ver illinois-gowsign-template.md § Automation blocker):** a única rota
> para um lease IL 16m é um merchant Kornerstone ONLINE (host `secure-stg.kornerstoneliving.com`)
> com gate **NeuroID**. O `submitApplication` via API é bloqueado ("Failed to verify
> identification.", lead stg 7218278 — nenhum `uown_esign_document` criado, lead preso em
> UW_APPROVED). O bypass via browser (reload → "Sign Contract") só foi provado **manualmente via
> MCP** (sem page object). Portanto os checkpoints de conteúdo 16m (CT-02..CT-06, CT-08) hoje só
> são validáveis por render MCP-manual; a captura canônica exata do texto deve congelar esses
> checkpoints de `[expected]` para `[confirmed]`.
>
> **Fontes primárias:** `docs/knowledge-base/illinois-gowsign-template.md` ·
> `docs/knowledge-base/alabama-gowsign-template.md` (padrão da task irmã) ·
> `docs/business-rules/03-contratos-esign.md` ·
> `docs/business-rules/appendix-g-cenarios-risco.md#4-program-routing-13-vs-16-months`.

## Critérios de Aceitação

| ID | Critério | CT | Fonte |
|---|---|---|---|
| AC-01 | Lease IL 16m → template `IL_2025_SAC_16_MONTHS`; lease IL 13m → `IL_2025_SAC`; ambos client=GOWSIGN | CT-01 | DB inventory ✓ / esign-doc pending CONTRACT_CREATED |
| AC-02 | Item 4 — heading exato "Promotional-Payoff Option:" + narrativa daily-accrual; sem wording promocional/dia/expiry | CT-02 | #576 AC + AL/OH 16m sibling `[expected]` |
| AC-03 | Item 4a — Lease-Purchase Ownership + tail `[totalNumberOfPayments]`/`$ [nextPaymentDueAmount]`; sem desconto % / TN / VA | CT-03 | #576 AC `[expected]` |
| AC-04 | Token render smoke — não-vazio em todas as ocorrências + zero `{{ }}` + logo + cross-check vs `uown_esign_document.request` | CT-04 | #576 AC + AL regression watch `[expected]` |
| AC-05 | Rodapé do plano — "Traditional [N] Month Lease Purchase Plan*" + footnotes; sem quadro EPO / Options 1&2 | CT-05 | #576 AC `[expected]` |
| AC-06 | Apêndice EARLY PURCHASE OPTION (singular) + 5 bullets + ordem de página (Item 14 logo depois, sem duplicação) | CT-06 | #576 AC `[expected]` |
| AC-07 | Sanity §1–§14 vs template padrão IL SAC (diferencial 16m); reporta divergência como finding | CT-07 | #576 AC `[expected]` |
| AC-08 | Assinatura completa GowSign → SIGNED + logs de atividade (rule #13) | CT-08 | gowsign-signing.md + AL sibling `[expected]` |

## Cenários

```gherkin
Feature: IL 16-Month GowSign Lease-Purchase Template (#576)

  Background:
    Given um merchant Kornerstone ONLINE cujo valid_states inclui IL (ex.: KS3015 / FifthAveFurnitureNY)
    And um cliente fresco, estado IL, SSN fresco, bankData no sendApplication (Kornerstone exige)
    And o lead foi conduzido até CONTRACT_CREATED (CC pre-auth via host kornerstoneliving — gate NeuroID)
    And o iframe GowSign renderizou o contrato (host gowsign-app-dev-uown.azurewebsites.net)

  Scenario: [positive] CT-01 — Routing 16m vs 13m
    When um lease IL é criado com plano WK16 (16m)
    Then uown_esign_document.client='GOWSIGN' e document_name='IL_2025_SAC_16_MONTHS'
    When um lease IL é criado com plano WK13 (13m) — controle negativo
    Then uown_esign_document.client='GOWSIGN' e document_name='IL_2025_SAC'

  Scenario: [positive] CT-02 — Item 4 Promotional-Payoff Option
    Then o heading é exatamente "Promotional-Payoff Option:" (NÃO "[X] Day Promotional Payoff Option")
    And o texto permite exercício "at any time" com $ [costPriceWithFeeNoTax] + tax - pagamentos em dia + lease fees diárias acumuladas até a data de exercício
    And atraso anula a opção
    And NÃO aparece "During the first … days", "This option expires on [date]", o wording promocional do IL SAC padrão ("Cash Price, [epoFeeText]"), nem "You have other purchase options described below"
    And NÃO aparece {{epoDays}}/{{epoExpiryDate}} populado OU em branco

  Scenario: [positive] CT-03 — Item 4a Lease-Purchase Ownership
    Then exige estar em dia para EPO; EPO = lease charges diárias acumuladas + fees/taxes - pagamentos em dia
    And o tail é exatamente: [totalNumberOfPayments] pagamentos de $ [nextPaymentDueAmount] (plus tax); Total $ [contractAmount] (including tax)(including the application fee)
    And contém "Total Cost," + "and you will own the Property"
    And nextPaymentDueAmount renderiza NÃO-vazio (regressão vista em AL)
    And NÃO aparece desconto % ([payOffDiscountPercent]%), wording estilo TN (sales tax + processing fee separados), nem wording estilo VA (reinstatement/fee misturado)

  Scenario: [positive] CT-04 — Token render smoke
    Then costPriceWithFeeNoTax, nextPaymentDueAmount, contractAmount, companyInfoBrandPhone renderizam não-vazios
    And não há nenhum "{{…}}" no texto visível
    And o logo aparece no topo
    And cada valor monetário casa (tolerância de float) com uown_esign_document.request.document.variables
    And NÃO existe note "[DocumentDispatchService][GowSign] … variables map missing … token(s)" para este lead

  Scenario: [positive] CT-05 — Rodapé do plano de compra
    Then aparece "Traditional [N] Month Lease Purchase Plan*", "*with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance"
    And o grid [leasePurchasePlan] está populado
    And aparecem as footnotes "* These amounts include sales tax…" e "** Total Cost includes sales tax, application fee and delivery fee."
    And NÃO aparece o quadro EPO payoff [table|earlyPurchaseOption] nem a lista numerada Options 1 & 2

  Scenario: [positive] CT-06 — Apêndice EPO + ordem de página
    Then existe a seção singular "EARLY PURCHASE OPTION" (não "OPTIONS")
    And contém "This Agreement has a 16-month term for ownership."
    And contém "However, you may purchase the Property at any time before the end of the lease term."
    And contém "For a 16-month lease, the EPO price is calculated as:" (atenção a quebra de linha "16-\nmonth")
    And lista 5 bullets: cost of leased goods; plus taxes; plus applicable fees; plus accrued daily lease fees through exercise date; minus payments made excluding taxes/fees
    And contém "To exercise this option, you must call us at [phone]."
    And NÃO aparece plural "OPTIONS", estrutura Option 1/2, "Purchase the Property by [epoExpiryDate]", sub-pontos a-e, nem linha de iniciais do cliente nesta página
    And o Item 14 (ACH Payments) segue imediatamente após o apêndice e a página NÃO está duplicada

  Scenario: [diff] CT-07 — Sanity §1–§14 vs template padrão IL SAC
    Then §1 sem "Damage to Property: ___", footnote delivery "*(*) Total delivery fee"
    And §2 Processing Fee + LDW(N/A) presentes, label "Total" (não "Total Initial Payment")
    And §3 termo inicia na delivery date, "Your Regular lease rate $ …" (sem "is")
    And §6 intro "These charges are reasonably related…", Late Fee $5/3 dias, In-Home Collection $10
    And §7 expira em pagamento perdido, reinstatement 16/60 dias (não VA 5/21/45)
    And §8 "You are lease the Property"; ACH usa nextPaymentDueAmount (não WithTax); §14 "prior to the last payment due date"
    And NÃO aparecem (exclusivos do 16m): promo §4 padrão, desconto % §4a padrão, apêndice Options 1/2 com iniciais

  Scenario: [positive] CT-08 — Assinatura completa + log
    When a cerimônia GowSign é concluída (Start → adotar assinatura/iniciais → Sign All → dialog Finish → redirect appComplete)
    Then uown_los_lead.lead_status='SIGNED'
    And uown_esign_document status SENT_TO_CUSTOMER→SIGNED com doc_signed_time_stamp preenchido
    And uown_los_lead_notes contém "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED" e "[ESIGNSERVICE][parseCCPeekConsent]"
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> ```bash
> git log cd2d2c8..HEAD -- docs/knowledge-base/illinois-gowsign-template.md src/helpers/gowsign-template-db.helpers.ts src/data/state-merchant-matrix.ts src/helpers/gowsign-signing.helper.ts src/helpers/esign-db.helpers.ts
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Routing 16m vs 13m  `[CONFIRMADO parcial: DB inventory + term-offer WK16/WK13 stg lead 7218276; esign-doc selection pendente de CONTRACT_CREATED (bloqueado por NeuroID)]`

| Checkpoint | Como verificar |
|---|---|
| Template 16m existe | `getGowSignTemplatesForState(db,'IL')` contém name=`IL_2025_SAC_16_MONTHS` (pk39) |
| Template 13m existe | mesma query contém name=`IL_2025_SAC` (pk38) |
| 16m offer | `sendInvoice` → `paymentDetailsList` contém entry `termInMonths=16`, `planId=WK16` |
| 13m offer | mesma lista contém entry `termInMonths=13`, `planId=WK13` |
| Seleção 16m | após CONTRACT_CREATED: `assertSelectedTemplateForLead(db, leadPk, 'IL_2025_SAC_16_MONTHS')` (client=GOWSIGN) |
| Seleção 13m (controle) | lead 13m: `assertSelectedTemplateForLead(db, leadPk, 'IL_2025_SAC')` |

### Oracle: CT-02..CT-07 — Conteúdo do `IL_2025_SAC_16_MONTHS`  `[EXPECTED — pendente captura canônica via render MCP-manual; ver illinois-gowsign-template.md § Automation blocker]`

| Checkpoint | Como verificar |
|---|---|
| Render do body | `frame.locator('body').innerText()` do iframe GowSign (`AlternativeContractModalPage.getGowSignFrame()`); normalizar whitespace |
| CT-02 Item 4 MUST | body contém heading exato "Promotional-Payoff Option:" + frase daily-accrual ($ costPriceWithFeeNoTax + tax − on-time payments + accrued daily lease fees) |
| CT-02 Item 4 MUST NOT | body NÃO casa /During the first .* days/, /This option expires on/, /Cash Price, .*epoFeeText/, "You have other purchase options described below", `{{epoDays}}`, `{{epoExpiryDate}}` |
| CT-03 Item 4a MUST | regex do tail: `/[\d,]+ payments of \$\s?[\d.,]+ .*plus tax/` + "Total Cost," + "and you will own the Property"; `nextPaymentDueAmount` não-vazio |
| CT-03 Item 4a MUST NOT | NÃO casa `/\d+%\s*discount/` (payOffDiscountPercent), nem wording TN/VA |
| CT-04 tokens | para cada token monetário, valor de `uown_esign_document.request.document.variables` aparece no body (sem vírgulas, tolerância de centavo via `toBeCloseTo`); `expect(body).not.toMatch(/\{\{|\}\}/)`; logo `<img>` no topo; ausência do note "variables map missing" |
| CT-05 footer MUST | "Traditional", "Month Lease Purchase Plan*", "*with a Promotional Payoff option", "Early Purchase Option Available Off Unpaid Balance", footnotes "* These amounts include sales tax", "** Total Cost includes sales tax, application fee and delivery fee." |
| CT-05 footer MUST NOT | NÃO contém quadro `earlyPurchaseOption` table nem "Option 1"/"Option 2" |
| CT-06 EPO appendix | contém "EARLY PURCHASE OPTION" (singular), "This Agreement has a 16-month term for ownership.", "you may purchase the Property at any time", "For a 16-\n?month lease, the EPO price is calculated as:", os 5 bullets, "To exercise this option, you must call us at"; NÃO contém "OPTIONS"/"Option 1"/"Option 2"/"[epoExpiryDate]"/linha de iniciais; Item 14 segue logo depois (uma ocorrência) |
| CT-07 sanity | comparar §1–§14 conforme lista MUST/MUST NOT do cenário; divergência = `[finding]` (não passa direto) |

### Oracle: CT-08 — Assinatura + log (rule #13)  `[EXPECTED — reutiliza gowsign-signing.md; bloqueado por NeuroID no host Kornerstone para 16m]`

| Checkpoint | Como verificar |
|---|---|
| Cerimônia | `signGowSignInFrame(page, frame, { preauthChoice:'yes', waitForCompleted:true })` → `capturedCompleted=true` |
| lead SIGNED | `waitForLeadStatus(db, leadPk, 'SIGNED')` |
| esign SIGNED | `uown_esign_document.status='SIGNED'`, `doc_signed_time_stamp` não-nulo (query por lead+client, request pode virar string `getDocumentStatus`) |
| Logs (rule #13) | `uown_los_lead_notes` contém "[ContractService][isLeaseOrLeaseModSigned]…SIGNED", "[EsignRedirectService][updateSignStatus]…to SIGNED", "[ESIGNSERVICE][parseCCPeekConsent]" |

> Pitfalls de execução (host Kornerstone): widget Buddy pode engolir clique em "Proceed" (re-clicar
> / DOM `.click()` cru); NeuroID exige o truque reload→"Sign Contract" (só provado via MCP-manual).

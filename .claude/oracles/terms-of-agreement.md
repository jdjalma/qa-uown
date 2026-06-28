---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/pages/origination/terms-of-agreement.page.ts
  - src/selectors/common.selectors.ts
---

# Terms of Agreement — Página de Revisão do Contrato

> URL consumer-facing: `/{shortCode}/complete?planId={planId}` no estado `CONTRACT_CREATED`.
> A mesma URL usada no CC/ACH agora exibe a revisão do contrato antes da assinatura.
>
> Fontes primárias: `src/pages/origination/terms-of-agreement.page.ts` ·
> `docs/knowledge-base/terms-of-agreement-page.md` · `src/selectors/common.selectors.ts`.
>
> Fluxo seguinte: `gowsign-signing.md` (CT-05 em diante) cobre o modal GowSign que abre
> após o cliente clicar "Proceed to signature".

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | URL revisitada em CONTRACT_CREATED exibe banner "SIGN CONTRACT" (não o form CC/ACH) | CT-01 | live stg ✓ |
| AC-02 | Clicar "SIGN CONTRACT" revela o formulário de Terms of Agreement com resumo completo + itens | CT-02 | live stg ✓ |
| AC-03 | Ambos os checkboxes são obrigatórios antes de avançar; o botão NÃO é HTML-disabled em nenhum merchant — validação é via toast "You must confirm..." para PP e não-PP | CT-03 | live stg 2026-06-28 ✓ |
| AC-04 | Merchant com PP: botão primário é "SEE PROTECTION BENEFITS"; clicar sem checkboxes → toast de erro | CT-04 | live stg ✓ |
| AC-05 | Merchant com PP + ambos os checkboxes + clique → overlay Buddy é REVELADO na página TOA (container visível + iframe carregado + submit disponível); conteúdo do widget (radios/preço) é dono de protection-plan.md CT-01 | CT-05 | live stg ✓ |
| AC-06 | Merchant sem PP: botão "Proceed to signature" (`type="submit" form="termsOfAgreementForm"`) — NÃO é HTML-disabled; clicar sem ambos os checkboxes → toast de validação (mesma mecânica do CT-04/PP) | CT-03 | live stg 2026-06-28 ✓ |
| AC-07 | Merchant com PP + cliente já cadastrado (already covered): overlay Buddy renderiza SEM radios, exibe "already enrolled", e o botão avança direto para o modal GowSign | CT-06 | live qa2 + code ✓ |

## Cenários

```gherkin
Feature: Terms of Agreement — Revisão e Consentimento do Contrato

  Background:
    Given um lead está em CONTRACT_CREATED (CC/ACH submetidos com sucesso)
    And a contract URL (/{shortCode}/complete?planId=) é aberta

  # ─── Estado A: URL revisitada ─────────────────────────────────────────────────

  Scenario: [positive] CT-01 — URL revisitada mostra banner "SIGN CONTRACT"
    Given o lead está em CONTRACT_CREATED e a contract URL é revisitada
    When a página carrega
    Then o banner "Thank you for selecting Uown Leasing..." está visível
    And o botão "SIGN CONTRACT" (#completeApplication-submit) está presente
    And o formulário #missingDataForm está vazio (sem campos CC/ACH)
    And #termsOfAgreementForm NÃO está visível

  # ─── Estado B: ToA revelada ───────────────────────────────────────────────────

  Scenario: [positive] CT-02 — Clicar "SIGN CONTRACT" revela o resumo do contrato
    Given o banner "SIGN CONTRACT" está visível
    When o cliente clica #completeApplication-submit
    Then #termsOfAgreementForm fica visível
    And o resumo exibe: 1º pagamento + data, EPO (valor monetário), frequência de pagamentos, nº de pagamentos, valor por pagamento, total
    And a tabela de itens lista ≥1 item com Model #, Description e Item Price
    And os checkboxes #isInfoConfirmed e #isEverythingAgreed estão presentes e desmarcados

  # ─── Validação de checkboxes ──────────────────────────────────────────────────

  Scenario: [negative] CT-03 — Não-PP merchant: toast de validação sem ambos os checkboxes marcados
    # NOTA: o botão NÃO é HTML-disabled — usa a mesma mecânica de toast que o PP merchant (CT-04).
    Given #termsOfAgreementForm está visível e o merchant NÃO oferece Protection Plus
    And button:has-text("Proceed to signature") (form="termsOfAgreementForm", type="submit") está visível e NÃO está HTML-disabled
    When o cliente clica o botão sem marcar nenhum checkbox
    Then um toast exibe "You must confirm that all information is true and complete."
    And #termsOfAgreementForm permanece visível (sem navegação)
    When apenas #isInfoConfirmed está marcado e o cliente clica novamente
    Then o mesmo toast é exibido (ambos os checkboxes são obrigatórios)
    When ambos os checkboxes estão marcados e o cliente clica
    Then o modal GowSign abre (ver gowsign-signing.md CT-05)

  Scenario: [negative] CT-04 — PP merchant: toast de validação sem checkboxes marcados
    Given #termsOfAgreementForm está visível e o merchant oferece Protection Plus (offerInsurance=true)
    And button:has-text("See Protection Benefits") está visível e NÃO está HTML-disabled
    When o cliente clica "SEE PROTECTION BENEFITS" sem marcar os checkboxes
    Then um toast exibe "You must confirm that all information is true and complete."
    And #termsOfAgreementForm permanece visível
    And o overlay PP permanece oculto (display:none)
    When apenas um dos checkboxes está marcado e o cliente clica novamente
    Then o mesmo toast é exibido (ambos são obrigatórios)

  # ─── Estado D: Overlay PP ─────────────────────────────────────────────────────

  Scenario: [positive] CT-05 — PP merchant: overlay Buddy revelado na página TOA após checkboxes + clique
    # Escopo TOA: a MECÂNICA DE REVELAÇÃO do overlay na página TOA.
    # O CONTEÚDO do widget (radios opt-in/opt-out, preço $12.99) é dono de protection-plan.md CT-01 (oferta) + CT-10 (render guard) — não reasserta aqui (rule #16: evita drift de checkpoint duplicado).
    Given ambos os checkboxes estão marcados e o merchant oferece Protection Plus
    When o cliente clica "SEE PROTECTION BENEFITS"
    Then o container [class*="purchase-insurance_buddyOfferContainer"] muda de display:none para display visível
    And #buddy_iframe carrega (smoke: iframe presente e não-vazio; conteúdo detalhado em protection-plan.md CT-01)
    And #purchase-insurance-submit-btn ("PROCEED TO SIGNATURE") está visível
    When o cliente seleciona um radio e clica #purchase-insurance-submit-btn
    Then o modal GowSign abre (ver gowsign-signing.md CT-05)

  # ─── Estado E: Overlay PP "already enrolled" (cliente já coberto) ─────────────

  Scenario: [positive] CT-06 — PP merchant: cliente já cadastrado, overlay sem radios avança direto
    Given o merchant oferece Protection Plus e o cliente já tem cobertura Uown Protection Plus ativa (mesmo e-mail)
    And ambos os checkboxes (#isInfoConfirmed, #isEverythingAgreed) estão marcados
    When o cliente clica "SEE PROTECTION BENEFITS"
    Then o overlay Buddy renderiza com mensagem "already enrolled" (records indicate / already receiving)
    And NÃO há radios opt-in/opt-out no overlay (getByRole('radio').count() == 0)
    And o botão #purchase-insurance-submit-btn ("PROCEED TO SIGNATURE") avança direto para o modal GowSign (ver gowsign-signing.md CT-05)
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> ```bash
> git log ff4f0fc..HEAD -- src/pages/origination/terms-of-agreement.page.ts src/selectors/common.selectors.ts
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — URL revisitada exibe banner "SIGN CONTRACT"  `[CONFIRMADO live stg 2026-06-28, lead 5ARIwnGc]`

| Checkpoint | Como verificar |
|---|---|
| Banner visível | `page.getByText(/Thank you for selecting Uown Leasing/i).isVisible()` |
| Botão presente | `page.locator('#completeApplication-submit').isVisible()` |
| Form vazio | `page.locator('#missingDataForm').evaluate(el => el.children.length)` → 0 |
| `#termsOfAgreementForm` ausente | `page.locator('#termsOfAgreementForm').isHidden()` |

### Oracle: CT-02 — Clicar "SIGN CONTRACT" revela resumo + itens  `[CONFIRMADO live stg 2026-06-28]`

| Checkpoint | Como verificar |
|---|---|
| `#termsOfAgreementForm` visível | `page.locator('#termsOfAgreementForm').waitFor({state:'visible'})` |
| 1º pagamento | `TermsOfAgreementPage.getSummary().initialPayment` não vazio |
| EPO | `getSummary().earlyPurchaseOption` contém valor `$X.XX` |
| Frequência / nº pagamentos / valor / total | `getSummary().paymentFrequency`, `.numberOfPayments`, `.paymentAmount`, `.totalPaymentAmount` todos não vazios |
| Tabela de itens | `getLeaseItems()` retorna ≥1 item com `modelNumber`, `description`, `itemPrice` |
| Checkboxes desmarcados | `#isInfoConfirmed` e `#isEverythingAgreed` → `isChecked() === false` |

### Oracle: CT-03 — Não-PP: toast de validação (botão NÃO é HTML-disabled)  `[CORRIGIDO live stg 2026-06-28, lead 7218270]`

> **Correção 2026-06-28:** a fonte primária anterior (`code`) estava incorreta. Live stg confirma que o botão `type="submit" form="termsOfAgreementForm"` tem `button.disabled === false` **antes e depois** de marcar os checkboxes. A validação ocorre no React submit handler via toast — mesma mecânica do CT-04 (PP merchant). Não use `isDisabled()` para este botão; ele sempre retorna `false`.

| Checkpoint | Como verificar |
|---|---|
| Botão NÃO HTML-disabled (sem checkboxes) | `page.getByRole('button', {name:/proceed to signature/i}).isDisabled()` → **`false`** |
| Clicar sem checkboxes → toast | `page.getByText(/you must confirm that all information is true and complete/i).isVisible()` → `true`; `#termsOfAgreementForm` permanece visível |
| Somente `#isInfoConfirmed` marcado → toast | mesmo toast (ambos os checkboxes são obrigatórios) |
| Ambos marcados + clique → avança | `.alternative-contract-vendor_iframeContainer__yAn5c` visível (GowSign abre) |

### Oracle: CT-04 — PP merchant: toast de validação  `[CONFIRMADO live stg 2026-06-28, lead 5ARIwnGc]`

| Checkpoint | Como verificar |
|---|---|
| Botão PP visível e NÃO disabled | `page.locator(SELECTORS.seeProtectionBenefitsBtn).isVisible()` + `isDisabled() === false` |
| Toast após clique sem boxes | `page.getByText(/you must confirm that all information is true and complete/i).isVisible()` |
| Container PP ainda oculto | `page.locator('[class*="purchase-insurance_buddyOfferContainer"]').evaluate(el => getComputedStyle(el).display)` → `"none"` |

### Oracle: CT-05 — PP overlay revelado na página TOA (mecânica de revelação)  `[CONFIRMADO live stg 2026-06-28]`

> **Escopo TOA:** a **revelação** do overlay (transição `display:none → visível` + submit disponível). O **conteúdo** do widget (≥2 radios opt-in/opt-out, preço $12.99) é dono de `protection-plan.md` CT-01 (oferta) + CT-10 (render guard) — não reasserta aqui para evitar checkpoint duplicado que diverge (rule #16).

| Checkpoint | Como verificar |
|---|---|
| Container PP visível | `page.locator('[class*="purchase-insurance_buddyOfferContainer"]').evaluate(el => getComputedStyle(el).display)` ≠ `"none"` |
| Buddy iframe presente (smoke) | `page.locator('#buddy_iframe').isVisible()` — conteúdo detalhado validado em protection-plan.md CT-01 |
| Submit button visível | `page.locator(SELECTORS.purchaseInsuranceSubmitBtn).isVisible()` |

### Oracle: CT-06 — PP "already enrolled" avança direto (sem radios)  `[CONFIRMADO live qa2 2026-06-21 + code]`

> Variante do overlay PP quando o cliente já tem cobertura ativa (mesmo e-mail): o painel renderiza
> SEM radios opt-in/opt-out e o botão avança direto para o modal GowSign. Os 3 checkpoints abaixo eram
> do antigo `gowsign-signing.md` CT-04 (re-alocados aqui na limpeza de 2026-06-28).

| Checkpoint | Como verificar |
|---|---|
| Texto "already enrolled" detectado | texto `/already enrolled|already receiving|records indicate/i` visível na página ou em algum sub-frame |
| Sem radios | `getByRole('radio').count()` == 0 no main frame e nos sub-frames |
| Botão "PROCEED TO SIGNATURE" presente | `#purchase-insurance-submit-btn` (ou `button:has-text("PROCEED TO SIGNATURE")`) clicável |
| Avança para GowSign | após o clique, `.alternative-contract-vendor_iframeContainer__yAn5c` visível |

> **Fonte primária:** `src/pages/origination/terms-of-agreement.page.ts:203` — `acceptProtectionPlanAlreadyEnrolled`.
> `terms-of-agreement.page.ts` já consta no `covers:` deste arquivo (sem mudança de frontmatter).

---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/pages/gowsign/alternative-contract-modal.page.ts
  - src/helpers/gowsign-signing.helper.ts
  - src/helpers/esign-db.helpers.ts
  - src/pages/origination/contract.page.ts
  - src/selectors/common.selectors.ts
---

# GowSign — Página de Assinatura do Contrato

> Fluxo consumer-facing que segue o submit da página CC/ACH (`cc-ach.md`). Após o
> `CONTRACT_CREATED` (CC pre-auth aprovado), o cliente passa por três etapas sequenciais:
>
> **(1) Terms of Agreement** — validado por `terms-of-agreement.md` (CT-01..CT-06).
> Precondição obrigatória deste oracle: consentimento marcado + botão "Proceed to signature" clicado.
>
> **(2) Protection Plus (opcional)** — validado por `protection-plan.md` (CT-01..CT-11).
> Precondição obrigatória deste oracle: opt-in ou opt-out concluído (quando o merchant oferece PP).
>
> **(3) GowSign signing modal** — **este oracle começa aqui.** iframe cross-origin
> (`gowsign-app-dev-uown.azurewebsites.net`) embarcado num modal. Cerimônia interna:
> Start → wizard de adoção (Type/Draw) → Sign All → dialog de confirmação → Finish →
> postMessage `completed` → lead → `SIGNED`.
>
> **Roteamento:** GowSign é selecionado quando existe uma linha em `uown_gow_sign_template`
> para `(effectiveState, client_type)`. `effectiveState = merchant.state` para INSTORE,
> `customerState` para ONLINE. Se não há template → fallback Signwell/PandaDocs.
> O campo `uown_esign_document.client` (criado em CONTRACT_CREATED) é a fonte de verdade.
>
> **Fontes primárias:**
> `src/pages/gowsign/alternative-contract-modal.page.ts` ·
> `src/helpers/gowsign-signing.helper.ts` · `docs/knowledge-base/alabama-gowsign-template.md` ·
> `docs/knowledge-base/new-york-gowsign-template.md` · `docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md`.

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-05 | Após "Proceed to signature", abre modal com header "Please Review and Sign..." e iframe GowSign (host `gowsign-app-dev-uown.azurewebsites.net`) | CT-05 | live qa2/stg ✓ |
| AC-06 | `uown_esign_document.client = 'GOWSIGN'`, `status = 'SENT_TO_CUSTOMER'` em CONTRACT_CREATED | CT-05 | DB live ✓ |
| AC-07 | Cerimônia de assinatura: Start → wizard → Sign All → dialog Finish → postMessage `completed` → lead SIGNED | CT-06 | live qa2 + code ✓ |
| AC-08 | Após SIGNED: `uown_esign_document.status = 'SIGNED'` + `doc_signed_time_stamp` preenchido; 3 logs de atividade | CT-07 | live qa2 + code ✓ |
| AC-09 | Fechar o documento sem assinar (botão "Close document" dentro do iframe) deixa lead em CONTRACT_CREATED | CT-08 | live qa2 ✓ |
| AC-10 | Template GowSign não contém tokens `{{ }}` sem valor (exceto bugs já rastreados por estado) | CT-09 | live qa2 ✓ |
| AC-11 | Merchant Signwell / sem template GowSign para o estado → iframe Signwell (não GowSign) | CT-10 | routing rule ✓ |
| AC-12 | Botão "Close document" (X do iframe) deve ser o botão DENTRO do iframe GowSign, não o X do modal pai | CT-08 | code ✓ |

## Cenários

```gherkin
Feature: GowSign — Assinatura do Contrato de Lease

  Background:
    # Pré-condições das etapas anteriores (cada uma tem seu próprio oracle):
    #   (1) Terms of Agreement: checkboxes de consentimento marcados — ver terms-of-agreement.md CT-01..CT-06
    #   (2) Protection Plus: opt-in ou opt-out concluído (quando aplicável) — ver protection-plan.md CT-01..CT-11
    Given um lead aprovado foi criado, faturado e teve CC+ACH submetidos com sucesso (estado de lease = CONTRACT_CREATED)
    And o cliente completou a etapa de Terms of Agreement (ambos os checkboxes marcados e "Proceed to signature" clicado)
    And a etapa de Protection Plus foi concluída quando aplicável (opt-in ou opt-out via widget Buddy)
    And o estado do cliente tem um template GowSign disponível em uown_gow_sign_template

  Scenario: [positive] CT-05 — Modal GowSign abre após "Proceed to signature"
    Given os checkboxes de Terms estão marcados (e PP dispensado quando aplicável)
    When o cliente clica "Proceed to signature"
    Then o modal abre com header "Please Review and Sign Your Leasing Agreement"
    And um iframe com classe alternative-contract-vendor_iframe__nSb3A está visível
    And o src do iframe contém "gowsign-app-dev-uown.azurewebsites.net/document/{uuid}?embedMode=true"
    And uown_esign_document tem client='GOWSIGN' e status='SENT_TO_CUSTOMER' para este lead
    And #startSignatureButton está visível dentro do iframe

  Scenario: [positive] CT-06 — Cerimônia de assinatura: Start → wizard 2 passos → Sign All → Finish
    # Wizard tem 2 passos: (1) Assinatura → #nextStepButton "Next"; (2) Iniciais → #saveUnifiedButton "Save"
    Given o modal GowSign está aberto com #startSignatureButton visível
    When o cliente clica Start (#startSignatureButton)
    Then placeholders de assinatura e iniciais ficam visíveis no documento
    And o wizard abre — Passo 1 (Assinatura): input[name="signature"] pré-preenchido com nome completo e 3 botões de fonte
    When o cliente seleciona uma fonte e clica #nextStepButton ("Next")
    Then o wizard avança para Passo 2 (Iniciais): input[name="initials"]="TT" pré-preenchido e 3 botões de fonte TT
    When o cliente seleciona uma fonte e clica #saveUnifiedButton ("Save")
    Then o wizard fecha e o toolbar exibe o botão #signAllButton
    When o cliente clica #signAllButton
    Then todos os campos de assinatura e iniciais do documento são preenchidos automaticamente
    And aparece o dialog "All fields are complete. Click Finish to finalize your document."
    And existem dois botões Finish: #finishSignatureModalButton (DENTRO do dialog) e #finishSignatureButton (toolbar, coberto pelo overlay)
    When o cliente clica #finishSignatureModalButton (prioridade; fallback: #finishSignatureButton)
    Then a página redireciona para /appComplete?...document_status=completed
    And o postMessage do tipo "completed" é capturado pela janela pai

  Scenario: [positive] CT-06b — PreAuthorization consent marcado como "Yes" no documento
    Given a cerimônia de assinatura é executada com preauthChoice='yes'
    When signGowSignInFrame finaliza com capturedCompleted=true
    Then input[name="preauth_choice-yes"] está marcado dentro do iframe antes do Finish

  Scenario: [side-effect] CT-07 — Lead transição para SIGNED e logs de atividade
    Given a cerimônia GowSign foi concluída (postMessage completed)
    When uown_los_lead e uown_esign_document são consultados pelo leadPk
    Then uown_los_lead.lead_status = 'SIGNED' (e lead.internal_status = 'SIGNED')
    And uown_esign_document.status = 'SIGNED' com doc_signed_time_stamp preenchido (não nulo)
    And uown_los_lead_notes contém "[EsignRedirectService][updateSignStatus] Update lead {pk} status instantly from CONTRACT_CREATED to SIGNED"
    And uown_los_lead_notes contém "[ContractService][isLeaseOrLeaseModSigned] Updating lead status to SIGNED … as losContract is SIGNED"
    And uown_los_lead_notes contém "[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true" (quando preauthChoice=yes)

  Scenario: [negative] CT-08 — Fechar o documento sem assinar mantém lead em CONTRACT_CREATED
    Given o modal GowSign está aberto e o cliente NÃO completou a assinatura
    When o cliente clica o botão aria-label="Close document" DENTRO do iframe GowSign
    Then o postMessage do tipo "closed" é enviado ao backend
    And uown_esign_document.status permanece 'SENT_TO_CUSTOMER' (não avança)
    And lead_status permanece CONTRACT_CREATED
    And o modal fecha na UI (não redireciona para /appComplete)

  Scenario: [positive] CT-09 — Sem tokens não resolvidos no contrato renderizado
    Given o iframe GowSign renderizou o contrato para este lead
    When o conteúdo HTML do iframe é inspecionado
    Then nenhum padrão "{{ }}" ou "__" isolado aparece no texto visível ao cliente
    And o título do contrato corresponde ao estado do cliente (ex: "CONSUMER LEASE-PURCHASE AGREEMENT-AL")
    And os valores dinâmicos chave estão preenchidos: contractNumber, partes, datas, valor total, nº pagamentos

  Scenario: [positive] CT-10 — Merchant sem template GowSign rota para Signwell
    Given o estado do cliente NÃO tem linha em uown_gow_sign_template
    When o lead atinge CONTRACT_CREATED
    Then uown_esign_document.client = 'SIGNWELL' (não GOWSIGN)
    And o modal que abre exibe iframe do host signwell.com (não gowsign-app-dev-uown.azurewebsites.net)
    And a assinatura Signwell segue o fluxo padrão (Sign All via link / completeSignwellFlow)
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> ```bash
> git log ff4f0fc..HEAD -- src/pages/gowsign/alternative-contract-modal.page.ts src/helpers/gowsign-signing.helper.ts src/helpers/esign-db.helpers.ts src/pages/origination/contract.page.ts src/selectors/common.selectors.ts
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-05 — Modal GowSign abre com iframe correto  `[CONFIRMADO live qa2 leads 16649/16661 + stg lead 7218072]`

| Checkpoint | Como verificar |
|---|---|
| Contêiner do modal | `.alternative-contract-vendor_iframeContainer__yAn5c` visível (`modal.waitForOpen()`) |
| iframe class | `iframe.alternative-contract-vendor_iframe__nSb3A` presente e visível |
| src do iframe | `iframe.getAttribute('src')` contém `gowsign-app-dev-uown.azurewebsites.net/document/` + UUID + `?embedMode=true` |
| Header do modal | `.modal-content` contém texto "Please Review and Sign Your Leasing Agreement" — `getModalTitle()` |
| Start button no iframe | `frame.locator('#startSignatureButton').isVisible()` dentro do FrameLocator |
| DB: client=GOWSIGN | `uown_esign_document` do lead → `client='GOWSIGN'`, `status='SENT_TO_CUSTOMER'`, `document_name` = nome do template |

### Oracle: CT-06 — Cerimônia de assinatura GowSign  `[CONFIRMADO live qa2 leads 16661/16664/16666 + live stg lead 7218270 2026-06-28]`

> Wizard confirmado em 2 passos (stg lead 7218270): Passo 1 Assinatura (`input[name="signature"]` pré-preenchido, 3 fontes, `#nextStepButton` "Next") → Passo 2 Iniciais (`input[name="initials"]`="TT", 3 fontes TT, `#saveUnifiedButton` "Save"). Após Save: `#signAllButton` → dialog → dois botões Finish (`#finishSignatureModalButton` no dialog, `#finishSignatureButton` no toolbar coberto pelo overlay).

| Checkpoint | Como verificar |
|---|---|
| Start clicado | `signGowSignInFrame` retorna `startClicked: true` |
| Wizard — Passo 1 (Assinatura) | `frame.locator('input[name="signature"]').inputValue()` → nome completo do lead; `frame.locator('#nextStepButton').isVisible()` → `true` |
| Wizard — Passo 2 (Iniciais) | após `#nextStepButton` clicado: `frame.locator('input[name="initials"]').inputValue()` → "TT"; `frame.locator('#saveUnifiedButton').isVisible()` → `true` |
| Wizard adotado | `result.fieldsSigned >= 1` |
| Sign All clicado | `result.signClicked === true`; `frame.locator('#signAllButton').isVisible()` vira `false` após clique |
| Dialog Finish (`#finishSignatureModalButton`) | `frame.locator('#finishSignatureModalButton').isVisible()` → `true` (prioridade); fallback: `frame.locator('#finishSignatureButton')` (toolbar) |
| Dialog texto | `frame.getByRole('dialog').textContent()` contém "All fields are complete. Click Finish to finalize your document." |
| postMessage "completed" | `result.capturedCompleted === true` (waitForPostMessage com type="completed") |
| Redirect URL | página redireciona para `/appComplete?...document_status=completed` |
| PreAuth consent | quando `preauthChoice='yes'`: `frame.locator('input[name="preauth_choice-yes"]').isChecked()` antes de Finish |

### Oracle: CT-07 — Estado pós-assinatura e logs de atividade  `[CONFIRMADO live qa2 leads 16661/16664 + stg lead 7218072]`

| Checkpoint | Como verificar |
|---|---|
| lead_status = SIGNED | `SELECT lead_status FROM uown_los_lead WHERE pk = :leadPk` → `'SIGNED'` |
| esign status = SIGNED | `SELECT status, doc_signed_time_stamp FROM uown_esign_document WHERE lead_pk = :leadPk` → `status='SIGNED'`, `doc_signed_time_stamp IS NOT NULL` |
| Log EsignRedirectService | `uown_los_lead_notes.note ILIKE '%EsignRedirectService%updateSignStatus%SIGNED%'` — ao menos uma linha |
| Log ContractService | `uown_los_lead_notes.note ILIKE '%isLeaseOrLeaseModSigned%SIGNED%'` |
| Log CCPeekConsent (quando yes) | `uown_los_lead_notes.note ILIKE '%parseCCPeekConsent%CC Peek Consent set to true%'` |

### Oracle: CT-08 — Fechar sem assinar mantém CONTRACT_CREATED  `[CONFIRMADO live qa2 AlternativeContractModalPage code]`

| Checkpoint | Como verificar |
|---|---|
| Botão Close dentro do iframe | `frame.locator('button[aria-label="Close document"]').isVisible()` — deve estar no iframe GowSign, NÃO no modal pai |
| Clique dispara postMessage "closed" | `waitForPostMessage(page, 'closed')` retorna não-null após clique |
| lead_status não muda | `uown_los_lead.lead_status` permanece `'CONTRACT_CREATED'` |
| esign status não muda | `uown_esign_document.status` permanece `'SENT_TO_CUSTOMER'` |
| Modal fecha na UI | `.alternative-contract-vendor_iframeContainer__yAn5c` desaparece; sem redirect para `/appComplete` |

### Oracle: CT-09 — Sem tokens não resolvidos  `[CONFIRMADO live qa2 NY lead 16661 + code (check per-state)]`

| Checkpoint | Como verificar |
|---|---|
| Sem `{{ }}` no DOM | `frame.locator('body').textContent()` NÃO contém padrão `/\{\{[^}]+\}\}/` |
| Título correto | heading principal do contrato contém o estado do cliente (ex: "-NY", "-AL") sem outro estado vazando |
| contractNumber | texto no iframe contém `UOWN_{merchantPk}_{leadPk}` |
| Partes corretas | LESSEE = nome do cliente; LESSOR = "Mollie, LLC, dba Uown" |
| Valores chave preenchidos | nextPaymentDueAmount/nextPaymentDueAmountWithTax visível como valor monetário (NÃO vazio/"$ ") — **verifique o log de tokens faltantes**: `uown_los_lead_notes.note ILIKE '%variables map missing%'` deve retornar zero rows |

> **Atenção por estado:** defects de token confirmados que podem ainda estar presentes:
> - **AL 13m (`AL_2025_SAC`)**: `payOffDiscountPercent`, `epoDays`, `nextPaymentDueAmount` podem estar em branco em qa2 (BUG confirmado — `docs/knowledge-base/alabama-gowsign-template.md §BR-06`). Verifique se o bug está corrigido antes de tratar blank como PASS.
> - **AL 16m (`AL_2025_SAC_16_MONTHS`)**: apenas `nextPaymentDueAmount` pode estar em branco (lead 16653 qa2).
> - **NY (`NY_2025_SAC`)**: `epoDays` CORRIGIDO em qa2 R1.53.0 (lead 16812, `epoDays="90"` no variables map).

### Oracle: CT-10 — Roteamento Signwell quando sem template GowSign  `[CONFIRMADO routing rule + live qa2]`

| Checkpoint | Como verificar |
|---|---|
| Estado sem template | `SELECT * FROM uown_gow_sign_template WHERE state = :customerState` → 0 rows |
| esign client = SIGNWELL | `uown_esign_document.client = 'SIGNWELL'` |
| iframe src Signwell | `iframe[src*="signwell.com"]` visível (não `gowsign-app-dev-uown`) |
| Sem AlternativeContractModal | `.alternative-contract-vendor_iframeContainer__yAn5c` NÃO presente no DOM |

## Notas de fonte primária

- **GowSign modal (CT-05)**: `AlternativeContractModalPage` (`src/pages/gowsign/alternative-contract-modal.page.ts`):
  container `.alternative-contract-vendor_iframeContainer__yAn5c` (`:26`), iframe `iframe.alternative-contract-vendor_iframe__nSb3A` (`:34`).
  src host confirmado live qa2: `gowsign-app-dev-uown.azurewebsites.net` (docs/knowledge-base/alabama-gowsign-template.md `BR`).
- **Cerimônia GowSign (CT-06)**: `src/helpers/gowsign-signing.helper.ts` — `signGowSignInFrame` (`:66`),
  `#startSignatureButton` (`:82`), wizard 2 passos (`#nextStepButton` `:90` → `#saveUnifiedButton` `:92`), `#signAllButton` (`:172`),
  `#finishSignatureModalButton` (dialog, prioridade) → `#finishSignatureButton` (toolbar, fallback) (`:222`),
  `waitForPostMessage(page, 'completed')` (`:344`).
  Confirmado live: leads 16661 (NY), 16664/16666 (AL qa2), stg 7218072; wizard 2-step confirmado live stg lead 7218270 2026-06-28.
- **Pós-assinatura (CT-07)**: `docs/knowledge-base/new-york-gowsign-template.md §Signing completion` — logs
  `[EsignRedirectService][updateSignStatus]`, `[ContractService][isLeaseOrLeaseModSigned]`, `[ESIGNSERVICE][parseCCPeekConsent]`.
  `uown_esign_document.status = 'SIGNED'` (NÃO `'COMPLETED'`); `doc_signed_time_stamp` preenchido (confirmado lead 16661).
- **Fechar sem assinar (CT-08)**: `AlternativeContractModalPage.clickCloseDocumentInIframe` — `button[aria-label="Close document"]`
  dentro do iframe (`:97`). postMessage type `"closed"` + redirect com `document_status=canceled` (`docs/knowledge-base/alabama-gowsign-template.md` nota do modal close).
- **Roteamento (CT-10)**: `docs/knowledge-base/16m-lease-and-gowsign-signwell-routing-qa2.md §The one rule` —
  `effectiveState = INSTORE ? merchant.state : customerState`; GowSign se linha existe em `uown_gow_sign_template`.
  `uown_esign_document.client` criado apenas em CONTRACT_CREATED.
- **Tokens em branco (CT-09)**: `docs/knowledge-base/alabama-gowsign-template.md §BR-06` (AL defect), `docs/knowledge-base/new-york-gowsign-template.md §BR-06 RESOLVED` (NY corrigido). Log de missing tokens: `[DocumentDispatchService][GowSign] leadPk=X variables map missing N simple template token(s): [...]`.

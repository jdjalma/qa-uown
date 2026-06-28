---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/helpers/signwell.helpers.ts
  - src/pages/signing/signing.page.ts
  - src/data/state-merchant-matrix.ts
  - src/helpers/esign-db.helpers.ts
  - src/selectors/common.selectors.ts
---

# SignWell — Assinatura do Contrato de Lease (provider padrão / fallback)

> Fluxo consumer-facing que segue o submit da página CC/ACH (`cc-ach.md`) e a
> revisão de Terms of Agreement (`terms-of-agreement.md`). É o **caminho padrão**
> de e-sign: quando o estado do lead NÃO tem template GowSign, o backend cai no
> `merchant.esign_client` (default `SIGNWELL`). O oracle GowSign (`gowsign-signing.md`)
> cobre o caminho alternativo; este cobre o default.
>
> **Roteamento (fonte de verdade no backend, NÃO no flag do merchant):**
> SignWell é selecionado quando `documentGroup == LEASE` **e** NÃO existe template
> em `uown_gow_sign_template` para `(effectiveState, clientType)`.
> `effectiveState = merchant.state` para INSTORE, `customerState` para ONLINE/online.
> Resultado persistido em `uown_esign_document.client = 'SIGNWELL'` (criado em
> CONTRACT_CREATED). Regra completa: `docs/gowsign/provider-routing-and-template-selection.md`.
>
> **Diferença crítica vs GowSign (surface DOM):**
> - **GowSign**: abre um modal `AlternativeContractModalPage`
>   (`.alternative-contract-vendor_iframeContainer__yAn5c`) com iframe HTML; o
>   texto do contrato ESTÁ no DOM do iframe.
> - **SignWell**: renderiza **INLINE na própria página** (NÃO há modal
>   `alternative-contract-vendor`), num iframe `#SignWell-Embedded-Iframe`
>   (`iframe[src*="signwell.com"]`). O contrato é um **PDF baseado em imagem**
>   (canvas/imagem) → o texto NÃO está no DOM do iframe → validação de conteúdo é
>   feita por colunas do DB (`template_name`, `receiver_name`), não por leitura de
>   texto do iframe. (Finding qa2 2026-04-28, codificado em `multi-state-signing.spec.ts`.)
>
> **Fontes primárias:**
> `src/helpers/signwell.helpers.ts` (cerimônia) ·
> `src/pages/signing/signing.page.ts` (detecção provider-agnóstica) ·
> `src/data/state-merchant-matrix.ts` (matriz de roteamento por estado) ·
> `src/helpers/esign-db.helpers.ts` (validação DB) ·
> `docs/business-rules/03-contratos-esign.md` §8/§63 (mapeamento status + eventos) ·
> `tests/e2e/signing-regression/multi-state-signing.spec.ts` (suite que dirige o fluxo live em 46 estados).
>
> ### ✅ VALIDADO LIVE — stg 2026-06-28, lead 7218271 (esignDocPk 565344)
> Fluxo end-to-end dirigido via MCP Playwright: TireAgent (OW90218-0001, ONLINE) +
> customer state **CO** (sem template GowSign em stg → SIGNWELL) → CC ($2341.50 aprovado,
> Mastercard 5500…0004) → Terms + Protection Plus opt-out (Buddy) → **iframe SignWell inline**
> (`#SignWell-Embedded-Iframe`, host `www.signwell.com`, SEM modal GowSign) → cerimônia
> (Click to Start → Save & Apply Everywhere para 12 INITIAL + Save para 1 Signature →
> Agree & Finish) → `/appComplete?...document_status=completed` → tela "Thank You!".
> DB pós-assinatura: `client='SIGNWELL'`, `esign_mode='EMBEDDED'`, `template_name='CO_SAC_LEASE_AGREEMENT'`,
> `status='SIGNED'`, `doc_signed_time_stamp` preenchido, `lead_status='SIGNED'`, evento esign `completed`.
> **Achado (rule #19c):** no modo `EMBEDDED` a nota "Sent Contract to customer. Contract EsignDocPk"
> **NÃO é emitida** — CT-06 corrigido. Os logs de assinatura são idênticos ao GowSign
> (`[EsignRedirectService][updateSignStatus]` + `[ContractService][isLeaseOrLeaseModSigned]` +
> `[ESIGNSERVICE][parseCCPeekConsent]`).

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | Estado SEM template GowSign roteia SignWell: `uown_esign_document.client='SIGNWELL'`, `esign_mode` populado, FK `uown_los_contract.esign_document_pk` set, `template_name` casa `^{STATE}_..._LEASE_AGREEMENT$`, `receiver_name` = nome do applicant | CT-01 | live stg ✓ |
| AC-02 | SignWell renderiza INLINE na página (sem `AlternativeContractModal`): iframe `#SignWell-Embedded-Iframe`, host `signwell.com`; o container GowSign NÃO está presente | CT-02 | live stg ✓ |
| AC-03 | Conteúdo do contrato é PDF baseado em imagem — NÃO há texto do contrato no DOM do iframe; validação de conteúdo (estado/lessee) via colunas DB, não DOM | CT-03 | suite comment + business rule |
| AC-04 | Cerimônia SignWell embedded: Click to Start → adoção (Type/Draw/Upload) → **"Save & Apply Everywhere"** aplica a todos os campos do mesmo tipo + **"Save"** no campo restante → **"Agree & Finish"** (`a.finish`) finaliza. Em modo embedded a conclusão redireciona para `/appComplete` (CT-08), não exibe a heading standalone "Thanks for filling out your document" | CT-04 | live stg ✓ |
| AC-05 | Pós-assinatura: evento esign `completed` (config `sw.esign.event.signed`) → `uown_esign_document.status='SIGNED'` + `doc_signed_time_stamp` preenchido; lead → SIGNED | CT-05 | live stg ✓ |
| AC-06 | Logs de assinatura (live-confirmado): `[EsignRedirectService][updateSignStatus] … CONTRACT_CREATED to SIGNED` + `[ContractService][isLeaseOrLeaseModSigned] Updating lead status to SIGNED` + `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true`. **No modo EMBEDDED a nota "Sent Contract to customer. Contract EsignDocPk" NÃO é emitida** (live-proven ausente, lead 7218271) | CT-06 | live stg ✓ |
| AC-07 | Cancelar/fechar sem assinar (eventos `declined` / `closed` / `error`, config `sw.esign.event.canceled`) NÃO avança o contrato: `status` permanece `SENT_TO_CUSTOMER`, lead em `CONTRACT_CREATED` | CT-07 | business rule (event mapping) |
| AC-08 | Após assinar com sucesso, o cliente é redirecionado para `/appComplete?...document_status=completed` → tela Confetti "Thank You!" + "Your contract has been successfully signed!" + `(877) 353-8696` | CT-08 | live stg ✓ |
| AC-09 | INSTORE merchant ignora o estado do cliente: `effectiveState = merchant.state` para a escolha de provider/template (pode forçar SignWell mesmo com customer state que teria GowSign) | CT-01 (nota) | testing.md rule + svc code |

## Cenários

```gherkin
Feature: SignWell — Assinatura do Contrato de Lease (provider default)

  Background:
    # Pré-condições das etapas anteriores (cada uma tem seu próprio oracle):
    #   (1) CC/ACH submetidos com sucesso — ver cc-ach.md
    #   (2) Terms of Agreement: checkboxes marcados + "Proceed to signature" — ver terms-of-agreement.md
    Given um lead aprovado foi criado, faturado e teve CC+ACH submetidos (lease em CONTRACT_CREATED)
    And o estado efetivo do lead NÃO tem template em uown_gow_sign_template
    And o merchant tem esign_client = 'SIGNWELL' (default)

  Scenario: [positive] CT-01 — Roteamento SignWell persistido no esign_document
    Given o lead atingiu CONTRACT_CREATED em um estado sem template GowSign
    When uown_esign_document é consultado pelo lead_pk
    Then uown_esign_document.client = 'SIGNWELL' (NÃO 'GOWSIGN')
    And esign_mode está populado (DOCX | HTML | EMAIL | STRAPI | EMBEDDED)
    And uown_los_contract.esign_document_pk referencia este doc (FK não nula)
    And template_name casa o padrão "^{STATE}_..._LEASE_AGREEMENT$" (ex: AK_SAC_LEASE_AGREEMENT)
    And receiver_name contém o primeiro nome do applicant submetido no sendApplication
    # NOTA INSTORE (AC-09): se o merchant é INSTORE, effectiveState = merchant.state,
    # NÃO o customer state — confirme merchant_type antes de assumir roteamento por customer state.

  Scenario: [positive] CT-02 — SignWell renderiza INLINE (sem AlternativeContractModal)
    Given o lead roteou para SignWell e o cliente clicou "Proceed to signature" no Terms
    When a página de assinatura carrega
    Then um iframe identificado por #SignWell-Embedded-Iframe (ou iframe[src*="signwell.com"]) está anexado
    And o hostname do src do iframe casa /(^|\.)signwell\.com$/
    And o container GowSign .alternative-contract-vendor_iframeContainer__yAn5c NÃO está presente no DOM
    And o "Click to Start" (a.start) está visível dentro do iframe

  Scenario: [side-effect] CT-03 — Conteúdo do contrato validado por DB (PDF imagem, não DOM)
    Given o iframe SignWell renderizou o contrato
    When o conteúdo é validado
    Then o texto do contrato NÃO está disponível no DOM do iframe (PDF baseado em imagem/canvas)
    And a validação de conteúdo usa uown_esign_document.template_name (encodifica o estado) e receiver_name (applicant)
    # Diferença vs GowSign CT-09: GowSign valida tokens no DOM HTML; SignWell valida via colunas DB.

  Scenario: [positive] CT-04 — Cerimônia de assinatura SignWell
    Given o iframe SignWell está carregado com "Click to Start" visível
    When o cliente clica Start (a.start / "Click to Start")
    Then placeholders de assinatura (.callout) e iniciais (.avatar-wrapper) aparecem
    When para cada campo o cliente clica, digita no input (.signature__type / .initials__type) e aciona "Sign All"
    Then "Save & Apply Everywhere" / "Sign All" aplica a assinatura em todos os campos
    And o cliente avança via "Next Field" até não restar campo
    When o cliente clica Finish (a.finish)
    Then o documento é finalizado (heading "Thanks for filling out your document")

  Scenario: [side-effect] CT-05 — Estado pós-assinatura e transição do lead
    Given a cerimônia SignWell foi concluída (evento esign "completed")
    When uown_esign_document e uown_los_lead são consultados pelo lead_pk
    Then uown_esign_document.status = 'SIGNED' com doc_signed_time_stamp preenchido (não nulo)
    And uown_los_lead.lead_status = 'SIGNED'
    And se o merchant tem isSignedToFunding=true, o lead avança automaticamente para FUNDING
    And contratos anteriores com status SENT são cancelados

  Scenario: [side-effect] CT-06 — Logs de atividade (enviado + assinado)
    Given o contrato foi enviado para o cliente e posteriormente assinado
    When uown_los_lead_notes é consultado pelo lead_pk
    Then existe nota "Sent Contract to customer. Contract EsignDocPk : {esignDocPk}"
    And essa nota contém "EsignMode : {DOCX|HTML|EMAIL|STRAPI|EMBEDDED}"
    And após a assinatura existe ≥1 nota com marcador de assinatura ([ContractService] / "signed" / "SIGNED")

  Scenario: [negative] CT-07 — Cancelar/fechar sem assinar mantém CONTRACT_CREATED
    Given o iframe SignWell está aberto e o cliente NÃO completou a assinatura
    When o provider emite um evento de cancelamento (declined | closed | error)
    Then uown_esign_document.status permanece 'SENT_TO_CUSTOMER' (não avança para SIGNED)
    And uown_los_lead.lead_status permanece 'CONTRACT_CREATED'
    And o contrato (uown_los_contract) NÃO é marcado como SIGNED

  Scenario: [positive] CT-08 — Tela de conclusão pós-assinatura (Confetti)
    Given a assinatura SignWell foi concluída com sucesso
    When o cliente é redirecionado para /{shortCode}/complete
    Then a tela de conclusão (Confetti) exibe "Thank You!"
    And exibe "Your contract has been successfully signed."
    And exibe o telefone de contato "(877) 353-8696" e "A copy has been sent to your email"
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> ```bash
> git log ff4f0fc..HEAD -- src/helpers/signwell.helpers.ts src/pages/signing/signing.page.ts src/data/state-merchant-matrix.ts src/helpers/esign-db.helpers.ts src/selectors/common.selectors.ts
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

> **Nota de validação live:** CT-01..CT-06 e CT-08 foram validados ao vivo em stg 2026-06-28
> (lead 7218271, esignDocPk 565344, CO/EMBEDDED) via MCP Playwright — ver banner no topo.
> CT-07 (cancelamento) permanece ancorado em regra de negócio (não exercido neste run).

### Oracle: CT-01 — Roteamento SignWell persistido  `[CONFIRMADO live stg 2026-06-28 lead 7218271 + ROUTING RULE]`

| Checkpoint | Como verificar | Live (lead 7218271, CO) |
|---|---|---|
| Sem template GowSign | `SELECT * FROM uown_gow_sign_template WHERE UPPER(TRIM(state)) = :effectiveState` → 0 rows (effectiveState = INSTORE? merchant.state : customerState) | CO ausente da lista de templates stg ✓ |
| client = SIGNWELL | `getEsignDocumentByLeadPk(db, leadPk).esignClient === 'SIGNWELL'` (col `client`); ou `waitForEsignClient(db, esignDocPk, 'SIGNWELL')` | `SIGNWELL` ✓ |
| esign_mode populado | `esignDoc.esignMode` truthy (DOCX/HTML/EMAIL/STRAPI/EMBEDDED) | `EMBEDDED` ✓ |
| FK do contrato | `esignDoc.contractPk` não nulo (`uown_los_contract.esign_document_pk` referencia o doc) | contract_number `UOWN_88906_7218271` ✓ |
| template_name por estado | `SELECT template_name FROM uown_esign_document WHERE pk=:pk` casa `^{STATE}_.*LEASE_AGREEMENT$` | `CO_SAC_LEASE_AGREEMENT` ✓ |
| receiver_name = applicant | `receiver_name` contém `applicant.firstName` (case-insensitive) | `Mark` ✓ |
| INSTORE override (AC-09) | `SELECT merchant_type, state FROM uown_merchant WHERE ref_merchant_code=:code` → se INSTORE, roteamento usa `merchant.state`, não customer state | TireAgent=ONLINE → usou customer state CO ✓ |

> **⚠️ Matriz stg desatualizada (descoberto neste run):** o `state-merchant-matrix.ts` marca CA/AL/NY como
> `stg → SIGNWELL` ("template não implantado em stg"), mas a DB stg 2026-06-28 JÁ tem templates GowSign para
> AL, CA, FL, GA, IL, LA, MI, NC, NY, OH, PA, TN, TX, VA. Para um lead SignWell em stg use um estado FORA dessa
> lista (ex: **CO**). Re-liste via `SELECT state FROM uown_gow_sign_template` antes de escolher.

### Oracle: CT-02 — SignWell renderiza INLINE (sem modal GowSign)  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Live: `#SignWell-Embedded-Iframe` src=`https://www.signwell.com/docs/9784d7aa52/?signwell_embedded_iframe=1`,
> host `www.signwell.com`, `gowsignModalPresent=false`. Coexiste com `#buddy_iframe` (Protection Plus) e `#ibody` (Kaptcha).

| Checkpoint | Como verificar |
|---|---|
| iframe SignWell anexado | `page.locator(SELECTORS.signingSignWellIframeByUrl)` (`iframe[src*="signwell.com"], iframe#SignWell-Embedded-Iframe`) → `waitFor({state:'attached'})` |
| host = signwell.com | `new URL(await iframe.getAttribute('src')).hostname` casa `/(^|\.)signwell\.com$/i` |
| SEM container GowSign | `.alternative-contract-vendor_iframeContainer__yAn5c` NÃO presente (esse é exclusivo do GowSign) |
| Start dentro do iframe | `frame.locator(SELECTORS.signwellStart).first().isVisible()` (`a.start, a:has-text("Click to Start")`) |
| provider detectado | `new SigningPage(page).getDetectedProvider()` retorna `'SIGNWELL'` |

### Oracle: CT-03 — Conteúdo validado via DB (PDF imagem, não DOM)  `[SUITE comment + business rule]`

| Checkpoint | Como verificar |
|---|---|
| texto NÃO no DOM | o conteúdo do contrato SignWell é imagem/canvas — NÃO assumir `frame.locator('body').textContent()` contém lessee/estado (diferente de GowSign) |
| estado via template_name | `template_name` casa `^{STATE}_.*LEASE_AGREEMENT$` (prova que o backend gerou o artefato do estado certo) |
| lessee via receiver_name | `receiver_name` contém o nome do applicant |
| lessor implícito | lessor derivado por estado na matriz (`STATE_MATRIX[state].lessor`): "Mollie, LLC, dba Uown" (default) ou "KW-Choice Alaska LLC" (AK) |

### Oracle: CT-04 — Cerimônia de assinatura SignWell  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Live (SignWell embedded UI atual): após "Click to Start", abre toolbar com contador `1/13` + "Next Field".
> Clicar um campo abre modal de adoção ("Type Your Initials" / "Type Your Signature", abas Type/Draw/Upload, nome
> pré-preenchido). **"Save & Apply Everywhere"** aplica a TODOS os campos do mesmo tipo (12 INITIAL → contador
> salta 1/13 → 12/13). O campo Signature restante usa **"Save"**. Finaliza com **"Agree & Finish"** (=`a.finish`)
> → "Final Step: Click 'Agree & Finish' to agree to the Electronic Signature Disclosure". Um dialog de vídeo
> introdutório ("How To Sign A Document") sobrepõe e precisa ser fechado (botão "Close").

| Checkpoint | Como verificar |
|---|---|
| Start clicado | `frame.locator(SELECTORS.signwellStart)` visível (≤120s) e clicado — `completeSignwellFlow` passo 1 |
| Campo signature | `.callout` (SELECTORS.signwellCallout) visível → click → input `.signature__type` recebe texto |
| Campo initials | `.avatar-wrapper` (SELECTORS.signwellAvatarWrapper) visível → click → input `.initials__type` recebe texto |
| Sign All | `clickSignAllViaLink`: `a:has-text("Save & Apply Everywhere"), a:has-text("Sign All")` (SELECTORS.signwellSignAllLink) clicado |
| Next Field | `SELECTORS.signwellNextField` ("Next Field"/"NEXT FIELD") avança entre campos (loop ≤15) |
| Finish | `a.finish` (SELECTORS.signwellFinish) visível e clicado |
| Documento completo | heading `h1:has-text("Thanks for filling out your document")` (SELECTORS.signwellDocCompleteHeading) |

### Oracle: CT-05 — Estado pós-assinatura e transição do lead  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Live: ao clicar "Agree & Finish", o postMessage `completed` redireciona para
> `/appComplete?uuid={leadUuid}&postMessage=true&document_status=completed`. O backend conclui pela MESMA
> rota do GowSign (`EsignRedirectService.updateSignStatus`). Lead permaneceu `SIGNED` (TireAgent não auto-fundou neste run).

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| evento esign signed | `uown_esign_event_trigger_log.event_name = 'completed'` (config `sw.esign.event.signed`); `waitForEsignEvent(db, esignDocPk, 'completed')` | `completed` @ 07:05:12Z ✓ |
| redirect completed | URL final `/appComplete?...document_status=completed` | ✓ |
| esign status = SIGNED | `waitForEsignDocumentStatus(db, esignDocPk, 'SIGNED')` → `documentStatus === 'SIGNED'` | `SIGNED` ✓ |
| doc_signed_time_stamp | `SELECT doc_signed_time_stamp …` → não nulo (`esignDoc.signedDateTime`) | `2026-06-28T07:05:12.771Z` ✓ |
| lead_status = SIGNED | `getEsignLeadStatus(db, leadPk)` → `'SIGNED'` | `SIGNED` ✓ |
| auto-move FUNDING | se merchant `isSignedToFunding=true` → lead avança para FUNDING (`getLeadStatusTransitions`) | n/a (permaneceu SIGNED) |
| contratos SENT cancelados | contratos anteriores com status SENT → CANCELLED (business rule §8 item 7) | 0 docs CANCELLED (único doc) |

### Oracle: CT-06 — Logs de assinatura  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> **Correção 2026-06-28 (rule #19c):** a versão inicial (herdada do `multi-state-signing.spec.ts`) exigia a nota
> "Sent Contract to customer. Contract EsignDocPk : {N}" + `EsignMode`. **No modo `esign_mode='EMBEDDED'` essa nota
> NÃO é emitida** — live-proven ausente (lead 7218271: zero notas casando "Sent Contract"/"EsignDocPk"/"EsignMode").
> A nota provavelmente pertence a um path de dispatch não-embedded (EMAIL/DOCX). Os logs ABAIXO são a fonte de
> verdade da assinatura e são **idênticos ao GowSign** (mesma rota `EsignRedirectService`).

| Checkpoint | Como verificar | Live (lead 7218271) |
|---|---|---|
| Log EsignRedirectService | `findLeadNoteContaining(db, leadPk, '[EsignRedirectService][updateSignStatus]')` casa `… from CONTRACT_CREATED to SIGNED` | nota 84564866 ✓ |
| Log ContractService | `findLeadNoteContaining(db, leadPk, 'isLeaseOrLeaseModSigned')` casa `Updating lead status to SIGNED from CONTRACT_CREATED` | nota 84564864 ✓ |
| Log CC Peek Consent | `findLeadNoteContaining(db, leadPk, 'parseCCPeekConsent')` → `CC Peek Consent set to true` | nota 84564861 ✓ |
| Sem tokens faltantes | `countLeadNotesContaining(db, leadPk, 'variables map missing')` == 0 | 0 ✓ |
| (path não-embedded) | nota "Sent Contract to customer … EsignMode : {…}" — esperada SÓ quando `esign_mode != EMBEDDED` | ausente (EMBEDDED) — esperado |

### Oracle: CT-07 — Cancelar/fechar sem assinar mantém CONTRACT_CREATED  `[BUSINESS RULE event mapping §63]`

| Checkpoint | Como verificar |
|---|---|
| evento de cancelamento | `uown_esign_event_trigger_log.event_name` ∈ {`declined`, `closed`, `error`} (config `sw.esign.event.canceled`) |
| esign status não avança | `uown_esign_document.status` permanece `'SENT_TO_CUSTOMER'` (não vira SIGNED) |
| lead não muda | `getEsignLeadStatus(db, leadPk)` permanece `'CONTRACT_CREATED'` |
| contrato não SIGNED | `uown_los_contract.status` NÃO é `SIGNED` (mapeamento CANCELLED/SENT, não SIGNED) |

### Oracle: CT-08 — Tela de conclusão pós-assinatura (Confetti)  `[CONFIRMADO live stg 2026-06-28 lead 7218271]`

> Live: redireciona para `/appComplete?uuid={leadUuid}&postMessage=true&document_status=completed` (não `/{shortCode}/complete`).

| Checkpoint | Como verificar | Live |
|---|---|---|
| redirect completed | URL final casa `/appComplete?...document_status=completed` | ✓ |
| título Thank You | `page.getByRole('heading',{name:/Thank You!/i}).isVisible()` | ✓ |
| mensagem de sucesso | `page.getByText(/Your contract has been successfully signed/i).isVisible()` | ✓ ("…signed!") |
| contato + cópia por email | texto contém `(877) 353-8696` e "A copy has been sent to your email" | ✓ |

## Notas de fonte primária

- **Roteamento (CT-01)**: `docs/gowsign/provider-routing-and-template-selection.md` —
  `EsignService.sendDocumentForEsign` / `shouldSendViaGowSign`; SignWell é o caminho quando
  NÃO há template GowSign elegível. `src/data/state-merchant-matrix.ts` mapeia o provider esperado
  por estado/env (`getExpectedProviderForEnv`). Coluna do DB é `client` (não `esign_client`) —
  ver `src/helpers/esign-db.helpers.ts` (`mapEsignDoc`, `ExpectedEsignClient`).
  INSTORE override (AC-09): `.claude/rules/testing.md` §E-sign Provider Routing —
  `EsignService.loadLeadEsignContext()` usa `merchant.state` para INSTORE.
- **Surface INLINE (CT-02/CT-03)**: `src/pages/signing/signing.page.ts` — detecção provider-agnóstica
  via host do iframe (`signingSignWellIframeByUrl`); `#SignWell-Embedded-Iframe` é o marcador DOM.
  `tests/e2e/signing-regression/multi-state-signing.spec.ts:421-454` documenta o finding qa2 2026-04-28:
  SignWell renderiza INLINE (sem `AlternativeContractModalPage`); conteúdo é PDF imagem → validação
  por colunas DB (`template_name`, `receiver_name`) em `:511-544`.
- **Cerimônia (CT-04)**: `src/helpers/signwell.helpers.ts` — `completeSignwellFlow` (`:74`),
  `fillSignwellField` (`:21`), `clickSignAllViaLink` (`:123`). Selectors em
  `src/selectors/common.selectors.ts:224-237` (`signwellStart`, `signwellCallout`,
  `signwellAvatarWrapper`, `signwellSignatureType`, `signwellInitialsType`, `signwellSignAllLink`,
  `signwellNextField`, `signwellFinish`, `signwellDocCompleteHeading`).
- **Pós-assinatura + eventos (CT-05/CT-07)**: `docs/business-rules/03-contratos-esign.md` §8
  (E-sign Status → Contract Status mapping) + §63 (Event Mapping: SignWell signed=`completed`,
  canceled=`declined,closed,error`). Asserção live de `status='SIGNED'` em
  `multi-state-signing.spec.ts:557-560`. Helpers DB: `waitForEsignDocumentStatus`, `waitForEsignEvent`,
  `waitForLeadStatus` (`src/helpers/esign-db.helpers.ts`).
- **Logs (CT-06)**: `multi-state-signing.spec.ts:481-492` (nota "Sent Contract to customer ... EsignMode")
  + `:562-572` (marcador de assinatura). CLAUDE.md rule #13 (activity log obrigatório).
- **Tela Confetti (CT-08)**: `docs/business-rules/03-contratos-esign.md` §63 "Post-Signature
  Completion Screen (Confetti)" — "Thank You!" / "Your contract has been successfully signed." /
  telefone `(877) 353-8696`.

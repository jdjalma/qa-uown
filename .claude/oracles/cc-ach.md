---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/api/clients/application.client.ts
  - src/api/bodies/application.body.ts
  - src/helpers/api-setup.helpers.ts
  - src/api/responses/application.response.ts
  - src/api/responses/invoice.response.ts
  - src/pages/origination/contract-complete.page.ts
  - src/selectors/common.selectors.ts
---

# CC/ACH — Página de Pagamento do Contrato (Contract URL)

> Após o lead ser aprovado e faturado, o sistema gera a **contract URL** (`redirectUrl`) — a página
> consumer-facing onde o cliente preenche **cartão (CC) + dados bancários (ACH)** antes da assinatura.
> Host `secure-{env}.uownleasing.com` (UOWN) / `secure-{env}.kornerstoneliving.com` (Kornerstone),
> carregando `{shortCode}` + `planId`. É o **próximo passo do fluxo** após [send-application.md](send-application.md).
>
> **Equivalente via API:** `submitApplication` (`POST /uown/api/submitApplication`) — preenche os mesmos
> campos CC + ACH programaticamente, bulando o form do consumidor (`SubmitApplicationBody`).
>
> **Rule #14 / #15:** página **customer-facing e mobile-heavy** — validação visual NÃO substituível por
> leitura de log; inspecionar em **375×667 + 768×1024 + 1440×900**. É a classe de bug do BUG-01 (render
> de pagamento só visível ao cliente).
>
> **Estado do oráculo:** discovery ao vivo feita em **stg 2026-06-28** (lead 7218254, doc `2bF9Zc6e`).
> CONFIRMADO live: URL `secure-{env}.uownleasing.com/{shortCode}/complete?planId=`, seletores CC reais,
> preauth $49, Kaptcha, render mobile OK. **Config-driven pelo merchant:** a página exibe a seção **CC** se
> `is_cc_required` ("Require Credit Card Before Signing") e a seção **ACH** se `is_ach_required` ("Require
> Bank Info Before Signing"), ambos colunas de `uown_merchant`. Live: CC-only com só o CC-flag (lead 7218254); **CC+ACH na MESMA página** com ambos os flags
> ON (lead 7218255); **submit CC+ACH** avança para Terms of Agreement → Contract criado (lead 7218256,
> 10 logs + preauth $49 APPROVED, lead_status CONTRACT_CREATED). Negativos confirmados: "Invalid link"
> (2º invoice), "Credit Card is invalid." (cartão de recusa), getMissingFields. **Todos os 7 CT confirmados
> live.** Knowledge-base:
> [`docs/knowledge-base/cc-ach-contract-complete-page.md`](../../docs/knowledge-base/cc-ach-contract-complete-page.md).

## Critérios de Aceitação

| ID | Critério | Oracle | Fonte |
|---|---|---|---|
| AC-01 | Lead aprovado+faturado gera `redirectUrl` em `paymentDetailsList[idx].redirectUrl` (idx=1 se >1, senão 0), host `secure-{env}`, com `shortCode`+`planId` | CT-01 | código ✓ |
| AC-02 | Um 2º `sendInvoice` (ou `authorizeCreditCard`) invalida a contract URL → "Invalid link. Please contact merchant"; submit OK é stateful (→ Sign Contract) | CT-02 | confirmado live ✓ |
| AC-03 | A página `/complete` exibe a seção **CC** se "Require Credit Card Before Signing" ON, e a seção **ACH** se "Require Bank Info Before Signing" ON (ambos ON → CC+ACH na mesma página) + preauth $49 | CT-03 | CC + ACH confirmados live ✓ |
| AC-04 | Submeter CC+ACH válidos avança para Terms of Agreement → Contract criado (esignMode=EMBEDDED, lead_status → CONTRACT_CREATED) | CT-04 | confirmado live ✓ |
| AC-05 | Pagamento submetido gera 10 logs em `uown_los_activity_log` (CreditCard/BankAccount ADDED, preauth $49 APPROVED, Contract, Signing Flow) — rule #13 | CT-05 | confirmado live ✓ |
| AC-06 | CC recusado → erro inline "Credit Card is invalid.", form não avança | CT-06 | confirmado live ✓ |
| AC-07 | `getMissingFields` retorna missingFields ["bankAccountInfo","ccInfo"] + feeToBeCharged 49 antes do submit | CT-07 | confirmado live ✓ |

## Cenários

```gherkin
Feature: CC/ACH — Página de Pagamento do Contrato
  As a customer (consumer portal) após aprovação
  In order to finalizar o lease
  The customer must inform credit card + bank (ACH) details on the contract page before signing

  Background:
    Given um lead aprovado foi criado via send-application e faturado (sendInvoice)
    And a contract URL (redirectUrl) foi extraída de paymentDetailsList[idx].redirectUrl

  Scenario: [positive] CT-01 — Contract URL gerada e válida
    When o lead aprovado é faturado
    Then a resposta traz redirectUrl em paymentDetailsList[idx].redirectUrl
    And o host é secure-{env}.uownleasing.com (UOWN) ou secure-{env}.kornerstoneliving.com (Kornerstone)
    And a URL carrega {shortCode} no path e {planId} na query

  Scenario: [negative] CT-02 — Invalidação da contract URL ("Invalid link")
    Given uma contract URL foi extraída
    When sendInvoice é chamado uma 2ª vez (novo shortCode) ou authorizeCreditCard via API
    Then a URL anterior é invalidada e exibe "Invalid link. Please contact merchant" (sem form)
    And um submit BEM-SUCEDIDO NÃO invalida — a URL é stateful e avança para "SIGN CONTRACT"

  Scenario: [positive] CT-03 — Página /complete renderiza o método de pagamento conforme config do merchant
    Given o cliente abre a contract URL válida (/{shortCode}/complete?planId=)
    When a página de pagamento carrega
    Then se "Require Credit Card Before Signing" estiver ON, exibe a seção CC (#ccFirstName, #ccLastName, #ccValue, #cvc, #ccExpDate)
    And se "Require Bank Info Before Signing" estiver ON, exibe a seção ACH (account#, routing#, account type, nomes)
    And exibe o aviso de preautorização de $49.00 e o botão #completeApplication-submit
    And renderiza sem overflow horizontal em 375×667 (mobile) e em 1440×900 (desktop)

  Scenario: [positive] CT-04 — Submeter CC+ACH válidos avança para a assinatura
    Given o cliente preencheu CC + ACH válidos na página /complete (ou submitApplication via API)
    When o pagamento é submetido (#completeApplication-submit)
    Then o form some e a página avança para "Terms of Agreement" (primeiro pagamento, EPO 90 dias, frequência)
    And um Contract é criado (esignMode=EMBEDDED) e o lead_status passa de UW_APPROVED para CONTRACT_CREATED

  Scenario: [side-effect] CT-05 — Logs gerados no lead após enviar o pagamento
    Given o pagamento (CC + ACH) foi submetido com sucesso
    When uown_los_activity_log é consultado pelo leadPk
    Then existe DATA_CHANGE "ADDED : CreditCard[...]" com ccNumber = últimos 4 do cartão, autoPay=true, isValidCard=true
    And existe CREDIT_CARD "Credit Card Transaction Type : AUTHENTICATION, Amount : $49.00, Status : APPROVED" (o preauth)
    And existe INTERNAL "CC Auth Passed" e INTERNAL "Kount run. Pre-Authorization status: SUCCESS"
    And existe DATA_CHANGE "ADDED : BankAccount[...]" com routingNumber submetido e autoPay=true
    And existe DATA_CHANGE "ADDED : Contract[... esignMode=EMBEDDED]" e INTERNAL "[Signing Flow] Contract created"
    And cada entrada casa Type + conteúdo + valor DESTE lead (nunca apenas "existe entrada do tipo X")
    And nenhuma entrada indica falha (CC e Kount = APPROVED/SUCCESS)

  Scenario: [negative] CT-06 — CC recusado não avança
    Given o cliente informa um cartão de recusa (ex: 4000000000000002)
    When o pagamento é submetido
    Then o erro inline "Credit Card is invalid." é exibido
    And o form permanece na página /complete (não avança para Terms of Agreement)

  Scenario: [positive] CT-07 — getMissingFields lista os campos obrigatórios pendentes
    Given um lead aprovado com contract URL (antes de preencher pagamento)
    When getMissingFields(shortCode, {planId}) é consultado
    Then a resposta (200) traz missingFields = ["bankAccountInfo", "ccInfo"] e feeToBeCharged = 49
    And firstPaymentDate e merchantRefCode são coerentes com o lead
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log ff4f0fc..HEAD -- src/api/clients/application.client.ts src/api/bodies/application.body.ts src/helpers/api-setup.helpers.ts src/api/responses/application.response.ts src/api/responses/invoice.response.ts src/pages/origination/contract-complete.page.ts src/selectors/common.selectors.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Contract URL gerada e válida  `[CONFIRMADO código + live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| redirectUrl presente | `paymentDetailsList[idx].redirectUrl` não vazio (idx=1 se `length>1`, senão 0) — `api-setup.helpers.ts:119-132` |
| Host secure-{env} | regex `^https://secure-{envSlug}\.(uownleasing\|kornerstoneliving)\.com/` — `normalizeContractUrlHost` (`:24-25`) |
| Path `/{shortCode}/complete` | live: `secure-stg.uownleasing.com/2bF9Zc6e/complete?planId=WK13` (lead 7218254) — path `/complete` CONFIRMADO |
| shortCode + planId | `new URL(redirectUrl).pathname` contém o shortCode; `planId` na query (`PaymentDetails.planId`, `invoice.response.ts`) |

### Oracle: CT-02 — Invalidação da contract URL  `[CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| 2º sendInvoice gera novo shortCode | re-faturar muda o shortCode (live: `ux3HPR7d` → `Uv3W8wf0`), invalidando a URL antiga — `skipInvoice` `api-setup.helpers.ts:68-75` |
| UI "Invalid link" | abrir a URL invalidada → "Invalid link. Please contact merchant" (sem form) — live lead 7218258 |
| CC auth também invalida | `skipCreditCardAuth` existe porque pré-autorizar CC via API invalida a URL — `:62-67` |
| Submit NÃO invalida (stateful) | revisitar a URL após submit OK → avança para "SIGN CONTRACT" (não "Invalid link") — live lead 7218256 |

### Oracle: CT-03 — Form de pagamento (config-driven)  `[CC + ACH CONFIRMADO live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Seção CC (se Require Credit Card ON) | inputs `#ccFirstName`, `#ccLastName`, `#ccValue` (Card Number), `#cvc`, `#ccExpDate` (MM/YYYY) — live stg 2026-06-28 |
| Botão submit | `button#completeApplication-submit` ("Submit") — live |
| Preauth $49 | texto "preauthorization of $49.00 ... processing fee/deposit" presente — live |
| Kaptcha (bot/fraude) | `iframe#ibody` de `tst.kaptcha.com` presente — live |
| Seção ACH (se Require Bank Info ON) | inputs `#bankAccountCustomerFirstName`, `#bankAccountCustomerLastName`, account type `#react-select-2-input` (Checking/Savings), `#bankRoutingNumber`, `#bankAccountNumber`, `#achReEnterAccountNumber` (re-enter, UI-only) — live stg 2026-06-28 (lead 7218255) |
| Ambos os flags ON | CC + ACH coexistem na MESMA página `/complete` (12 inputs) — live |
| Render mobile/desktop | sem overflow horizontal em 375 (`scrollWidth==375`) e 1440 — live |

### Oracle: CT-04 — Submit avança para assinatura  `[CONFIRMADO live stg 2026-06-28, lead 7218256]`
| Checkpoint | Como verificar |
|---|---|
| Form some, avança | após `#completeApplication-submit`, o form é removido e a página exibe "Terms of Agreement" (First Payment, EPO 90-day, frequência) — live |
| Contract criado | `DATA_CHANGE ADDED : Contract[contractNumber=UOWN_{merchantPk}_{leadPk}, contractType=LEASE, contractStatus=NEW, esignMode=EMBEDDED]` |
| lead_status transição | `uown_los_lead.lead_status`: UW_APPROVED → **CONTRACT_CREATED** (internal_status idem) |
| API equivalente | `POST /uown/api/submitApplication`; `ApiSetupResult.esignClient` ∈ {GOWSIGN, SIGNWELL}, `embeddedSigningUrl` — `api-setup.helpers.ts:95-98` |

### Oracle: CT-05 — Logs do submit de pagamento  `[CONFIRMADO live stg 2026-06-28, lead 7218256]`

> **Validação específica** (não "existe entrada do tipo X"): casar cada entrada por Type + assinatura +
> valor cruzado com os dados submetidos. O submit gera **10 entradas** em `uown_los_activity_log`:

| # | Type | Assinatura no campo notes | Cross-check (DESTE lead) |
|---|---|---|---|
| 1 | INTERNAL | `[Signing Flow] Started. Lead status UW_APPROVED` | presente |
| 2 | INTERNAL | `Kount run. Pre-Authorization status: SUCCESS` | fraud check (Kount) passou |
| 3 | DATA_CHANGE | `ADDED : CreditCard[ccNumber={last4}, ccExp, autoPay=true, isValidCard=true]` | last4 == cartão submetido (ex: 0055); ccExp == 12/2028 |
| 4 | CREDIT_CARD | `Credit Card Transaction Type : AUTHENTICATION, Amount : $49.00, Status : APPROVED` | $49.00 == preauth anunciado na página; APPROVED |
| 5 | INTERNAL | `CC Auth Passed` | presente |
| 6 | DATA_CHANGE | `ADDED : BankAccount[accountNumber={last4}, routingNumber={routing}, autoPay=true]` | routing == ACH submetido (ex: 123456780) |
| 7 | DATA_CHANGE | `ADDED : Contract[contractNumber=UOWN_{merchantPk}_{leadPk}, contractStatus=NEW, esignMode=EMBEDDED]` | contractNumber contém o leadPk |
| 8 | INTERNAL | `[Signing Flow] Contract created. Lead status CONTRACT_CREATED` (×2) | transição de status |

| Checkpoint extra | Como verificar |
|---|---|
| lead_status | `uown_los_lead.lead_status` passa de UW_APPROVED para **CONTRACT_CREATED** |
| Sem erro | nenhuma entrada "failed"/"declined"/"error"; CC e Kount = APPROVED/SUCCESS |
| (PP por estado) | `INTERNAL "Protection plan not offered in state CA"` aparece quando PP não é ofertado no estado (varia) |

### Oracle: CT-06 — CC recusado não avança  `[CONFIRMADO live stg 2026-06-28]`

> **Atenção — duas causas de "Credit Card is invalid." + `preAuthStatus: NOT_RUN`:**
> 1. **Cartão de recusa** (ex: `4000000000000002`) → comportamento esperado (CT-06 via Kount/gateway).
> 2. **`ccLastName` não coincide com `lead.lastName`** → `ApplicationService.ccLastNameMatchService.checkCCLastNameMatch` retorna `false` antes mesmo de chamar o Kount; o resultado é idêntico (`"Credit Card is invalid."`, `preAuthStatus: NOT_RUN`). Causa mais comum em testes que usam `buildTestData(realistic: true)` (nome aleatório por chamada) e preenchem o form com `ccLastName` hardcoded ou de uma chamada diferente. **Fix:** usar `realistic: false` (nome determinístico "TestLNufl") OU capturar `applicant.lastName` do `sendApplication` e passar o MESMO valor no CC body. Fonte: `ApplicationService.java:173-175`, live stg lead 7218270 2026-06-28.

| Checkpoint | Como verificar |
|---|---|
| Erro inline | após submit com cartão de recusa (`4000000000000002`), exibe "Credit Card is invalid." — live lead 7218257 |
| Sem avanço | `#completeApplication-submit` permanece (form não some); NÃO avança para Terms of Agreement — live |

### Oracle: CT-07 — getMissingFields  `[CONFIRMADO código + live stg 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Endpoint | `GET /uown/los/missing-fields/{shortCode}?planId={planId}` — `application.client.ts:117-122` |
| Campos faltantes | `missingFields == ["bankAccountInfo", "ccInfo"]` antes de preencher — live lead 7218257 |
| Fee + 1º pagamento | `feeToBeCharged: 49` (preauth), `firstPaymentDate`, `merchantRefCode` no body — live |

## Itens Pendentes

_Nenhuma._ Page object criado (`ContractCompletePage`, `src/pages/origination/contract-complete.page.ts`);
flags internos identificados (`uown_merchant.is_cc_required` / `is_ach_required`).

> **CONFIRMADO nesta discovery (stg 2026-06-28):** path `/{shortCode}/complete?planId=`, host secure-stg,
> seletores CC + **ACH** (`#bankAccountCustomerFirstName/LastName`, `#bankRoutingNumber`, `#bankAccountNumber`,
> `#achReEnterAccountNumber`, account type react-select), preauth $49, Kaptcha (`iframe#ibody`), mobile OK.
> Config-driven (CC-flag → CC; Bank-Info-flag → ACH; ambos ON → mesma página). **Submit CC+ACH** (lead 7218256):
> avança para Terms of Agreement → Contract criado (esignMode=EMBEDDED), lead_status → CONTRACT_CREATED, +10 logs
> incluindo preauth $49 APPROVED e Kount SUCCESS. **Negativos:** "Invalid link. Please contact merchant" (URL
> invalidada por 2º invoice, 7218258); "Credit Card is invalid." (cartão de recusa, 7218257); getMissingFields =
> ["bankAccountInfo","ccInfo"]. Leads: 7218254/55/56/57/58.

## Notas de fonte primária

- **Contract URL / single-use** (CT-01/CT-02): `src/helpers/api-setup.helpers.ts` — `extractContractUrlFromResponse`
  (`:119-132`), `normalizeContractUrlHost` (`:24-25`), opções `skipCreditCardAuth` (`:62-67`) e `skipInvoice` (`:68-75`).
- **Campos CC/ACH** (CT-03): `src/api/bodies/application.body.ts:96-121` (`SubmitApplicationCcInfo` + `SubmitApplicationBody`).
- **submitApplication / roteamento de assinatura** (CT-04): `application.client.ts` `submitApplication`;
  `ApiSetupResult.esignClient` + `embeddedSigningUrl` (`api-setup.helpers.ts:95-98`).
- **getMissingFields** (CT-07): `application.client.ts:117-122`; `MissingFieldsResponseBody` (`application.response.ts:80-81`).
- **redirectUrl/planId** (CT-01): `PaymentDetails` em `invoice.response.ts` + `application.response.ts`.
- **Discovery ao vivo** (CT-01/CT-03/CT-04/CT-05): stg 2026-06-28 — leads 7218254 (CC-only), 7218255 (CC+ACH),
  7218256 (submit). Submit via UI (cartão `5146…0055`, ACH routing `123456780`/CHECKING) → Terms of Agreement →
  Contract criado, lead_status CONTRACT_CREATED, +10 logs (preauth $49 APPROVED, Kount SUCCESS). Activity log
  capturado via `src/scripts/_probe_lead_log.ts` (antes 13 / depois 23). Detalhes + screenshots em
  `docs/knowledge-base/cc-ach-contract-complete-page.md`.
- **Negativos** (CT-02/CT-06/CT-07): live stg 2026-06-28 — CT-02 "Invalid link. Please contact merchant"
  (lead 7218258, URL invalidada por 2º sendInvoice; submit OK é stateful → "SIGN CONTRACT", lead 7218256);
  CT-06 "Credit Card is invalid." com cartão `4000000000000002` (lead 7218257, form não avança); CT-07
  `getMissingFields` = ["bankAccountInfo","ccInfo"] + feeToBeCharged 49 (lead 7218257). Probes:
  `_probe_cc_ach_negatives.ts`, `_probe_cc_ach_invalidate.ts`, `_probe_lead_log.ts`.
- **Page object** (CT-03/CT-04/CT-06): `ContractCompletePage` (`src/pages/origination/contract-complete.page.ts`)
  reusa os seletores CC/ACH de `common.selectors.ts` + `ccExpDate`/`bankAccountTypeSelect`/`completeApplicationSubmit`
  (adicionados live 2026-06-28). Métodos: `fillCreditCard`, `fillBankAccount`, `submit`, `getInlineError`, `isInvalidLink`, `hasLeftPaymentForm`.
- **Flags do merchant** (CT-03): `uown_merchant.is_cc_required` = "Require Credit Card Before Signing";
  `uown_merchant.is_ach_required` = "Require Bank Info Before Signing" — confirmado via `docs/database-schema.md`.

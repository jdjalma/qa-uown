---
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/pages/origination/terms-of-agreement.page.ts
  - src/pages/origination/contract.page.ts
  - src/selectors/common.selectors.ts
  - src/data/merchant-config-contract.ts
---

# Protection Plan — Buddy "Uown Protection Plus" (oferta, adesão e painéis)

> Seguro **opcional** ofertado ao cliente, operado por **Buddy Insurance** (parceiro AON). Produto
> `AON_PURCHASEPROTECTION`. Preço **$12.99/mês** (mensal), $38.97 (trimestral), $155.88 (à vista). Fonte
> canônica: **BR §23** ([`09-integracoes-externas.md`](../../docs/business-rules/09-integracoes-externas.md)).
> Discovery completa (UI + DB qa2) em [`docs/knowledge-base/protection-plan.md`](../../docs/knowledge-base/protection-plan.md).
>
> **A oferta é controlada por DUAS condições (ambas obrigatórias):** (a) config do merchant **"Offer
> Protection Plan"** = `offerInsurance=true` (`merchant-config-contract.ts:66`); (b) estado do cliente ∈
> `offer.insurance.in.states` (config de backend, NÃO em `uown_state_configurations`).
>
> **Após a adesão, o plano aparece em painel no Origination E no Servicing** + gera log no Origination.
>
> **Estado do oráculo:** **VALIDADO LIVE em qa2 2026-06-28** (UI + DB cross-check; env confirmado
> MAX(lead.pk)=16937). Leads/contas: 16801 (opt-in), 16805 (opt-out), conta 11204 (servicing opt-in),
> 16912/16727/16459 (estado CA não ofertado), conta **11433** (Canal 2 / portal Website). **CT-01..CT-10
> CONFIRMADOS; CT-11 confirmado até o checkout** (login OTP do portal + widget Buddy + preço $12.99/mês;
> pagamento via Stripe **pk_live** não finalizável com cartão de teste — parada segura). Screenshots:
> `protection-plan-origination-panel-optin-16801.png`, `protection-plan-servicing-panel-optin-11204.png`,
> `protection-plan-channel2-widget-loaded-11433.png`, `protection-plan-channel2-checkout-stripe-live-11433.png`.

## Critérios de Aceitação

| ID | Critério | Oracle | Estado |
|---|---|---|---|
| AC-01 | Merchant com **"Offer Protection Plan"** + estado permitido → Terms troca botão para "See Protection Benefits"; widget Buddy renderiza com 2 radios (opt-in $12.99 / opt-out) | CT-01 | ✅ CONFIRMADO |
| AC-02 | Merchant **sem** "Offer Protection Plan" → plano não ofertado; Terms vai direto a "Proceed to signature"; nenhuma linha em `uown_los_protection_plan` | CT-02 | ✅ CONFIRMADO (código + mod-history) |
| AC-03 | Merchant com config mas estado **fora** de `offer.insurance.in.states` → não ofertado; log `"Protection plan not offered in state {ST}"` | CT-03 | ✅ CONFIRMADO live (CA) |
| AC-04 | **Aderido (opt-in):** linha PENDING no proceed → e-assinatura finaliza → `status=COMPLETED`, `policy_id` mintado, `enrollment_date=hoje`, `opt_in=true` | CT-04 | ✅ CONFIRMADO live (16801) |
| AC-05 | **Não aderido (opt-out):** `opt_in=false`, `status=COMPLETED`, `policy_id=null`, `enrollment_date=null`. **Bug candidato:** log `"Error initiating protection plan"` | CT-05 | ✅ CONFIRMADO live (16805) |
| AC-06 | **Painel Origination** (`/customers/{leadPk}`, card "Protection Plan"): Opted In, Already Covered, Status, Enrollment Date, Cancellation Date, Cancellation Reason, Refund Amount. NÃO mostra policy_id/preço | CT-06 | ✅ CONFIRMADO live |
| AC-07 | **Painel Servicing** (`/customer-information/{accountPk}`): card "Protection Plan" idêntico (lê `uown_sv_protection_plan`) + sub-seção "Protection Plan Fees To Date / Paid"; consistente com Origination e DB | CT-07 | ✅ CONFIRMADO live (conta 11204) |
| AC-08 | **Log Origination (aderido):** notas em `uown_los_activity_log` (não `lead_notes`): "Customer signed and opted in..." → "Successfully initiated protection plan with Buddy. Status: COMPLETED" | CT-08 | ✅ CONFIRMADO live (16801) |
| AC-09 | **Cross-coverage:** `already_covered=true` + `covered_by_account_pk` + `policy_id` copiado existem em `uown_sv_protection_plan` (NÃO em `uown_los_protection_plan`); nenhuma policy nova mintada | CT-09 | ✅ CONFIRMADO live (DB) |
| AC-10 | **Render guard (rule #14):** host Buddy vazio ou < 2 radios → page object lança erro, nunca submit cego | CT-10 | ✅ CONFIRMADO (código) |
| AC-11 | **Canal 2 (portal pós-funding):** o portal Website expõe um botão "Protection Plan" → modal com o widget Buddy "Uown Protection Plus" (embed) → "Yes, Protect my lease" → Checkout. Inscrição cobra **$12.99/mês** direto via Stripe | CT-11 | ✅ CONFIRMADO live até o checkout (pagamento via **Stripe pk_live** não finalizável com cartão de teste) |

## Cenários

```gherkin
Feature: Protection Plan — Buddy "Uown Protection Plus"
  As a customer finalizando o lease
  In order to proteger a mercadoria arrendada contra dano, roubo ou perda
  The customer must poder aceitar ou recusar o plano, e ver o plano refletido nos portais

  Background:
    Given um lead aprovado que chegou ao Terms of Agreement (após CC/ACH, ver cc-ach.md)

  Scenario: [negative] CT-02 — Merchant sem "Offer Protection Plan" não oferta o plano
    Given o merchant está com a configuração "Offer Protection Plan" DESLIGADA
    When o cliente chega ao Terms of Agreement e prossegue para a assinatura
    Then o botão "See Protection Benefits" não é apresentado e o fluxo vai direto para "Proceed to signature"
    And nenhuma linha é criada em uown_los_protection_plan para esse lead

  Scenario: [negative] CT-03 — Estado do cliente não permitido não oferta o plano
    Given o merchant está com "Offer Protection Plan" LIGADA, mas o estado do cliente (ex: CA) não está na lista de estados permitidos
    When o cliente chega ao Terms of Agreement e prossegue para a assinatura
    Then o plano não é ofertado e o log registra "Protection plan not offered in state CA"

  Scenario: [guard] CT-10 — Widget Buddy vazio falha alto, não submete cego
    Given o merchant oferta o plano e o cliente abriu "See Protection Benefits"
    When o offer widget da Buddy renderiza vazio (sem expor 2 radios após as tentativas)
    Then o fluxo é interrompido com erro explícito e nenhuma escolha de plano é submetida

  Scenario: [negative] CT-05 — Cliente NÃO adere ao plano (opt-out)
    Given o widget Buddy exibe opt-in ($12.99) e "No, continue unprotected"
    When o cliente seleciona "No, continue unprotected" e prossegue para a assinatura
    Then uown_los_protection_plan registra opt_in=false, status=COMPLETED e policy_id null
    And o painel Origination mostra Opted In desligado, Status COMPLETED e Enrollment Date "-"

  Scenario: [alternative] CT-09 — Email já coberto registra cross-coverage no Servicing
    Given o email do cliente já possui uma cobertura Uown Protection Plus ativa em outra conta
    When a conta vai para o Servicing e a cobertura cruzada é processada
    Then uown_sv_protection_plan registra already_covered=true, covered_by_account_pk preenchido e o policy_id copiado da conta cobridora
    And nenhuma policy nova é mintada (sem cobrança duplicada)

  Scenario: [negative] CT-11 — Conta inelegível no portal não permite inscrição
    Given uma conta no portal do cliente que não atende à elegibilidade (não-ACTIVE, estado não permitido, já inscrita, ou email com plano ativo)
    When a elegibilidade do plano é consultada para a conta
    Then a resposta indica que a conta não é elegível e a opção de inscrição não é ofertada

  Scenario: [positive] CT-01 — Merchant com config + estado permitido oferta o plano
    Given o merchant tem "Offer Protection Plan" LIGADA e o cliente está em um estado permitido (ex: NY)
    When o cliente chega ao Terms of Agreement e abre "See Protection Benefits"
    Then o widget Buddy renderiza com 2 opções: opt-in ($12.99/mês) e "No, continue unprotected"

  Scenario: [positive] CT-04 — Cliente ADERE e a inscrição finaliza na e-assinatura
    Given o cliente selecionou opt-in ($12.99) e clicou em "Proceed to signature"
    When o cliente conclui a e-assinatura do contrato
    Then uown_los_protection_plan passa para status=COMPLETED com opt_in=true, policy_id preenchido e enrollment_date = hoje

  Scenario: [positive] CT-06 — Plano aderido aparece no painel do Origination
    Given o cliente aderiu ao plano e e-assinou o contrato
    When a visão do lead é aberta no Origination
    Then o card "Protection Plan" exibe Opted In ligado, Status COMPLETED e Enrollment Date com a data real

  Scenario: [positive] CT-07 — Plano aderido aparece no painel do Servicing, consistente
    Given o cliente aderiu ao plano e a conta foi para o Servicing
    When a conta é aberta no Servicing
    Then o card "Protection Plan" exibe os mesmos Opted In / Status / Enrollment Date vistos no Origination
    And a sub-seção "Protection Plan" da Servicing Information exibe Protection Plan Fees To Date e Fees Paid

  Scenario: [side-effect] CT-08 — Adesão registra as notas no log do Origination
    Given o cliente aderiu (opt-in) e e-assinou o contrato
    When uown_los_activity_log é consultado pelo lead_pk
    Then existe "Customer signed and opted in for protection plan. Initiating next steps..."
    And existe "Successfully initiated protection plan with Buddy. Status: COMPLETED"
```

## Oracles

> **Verificação de desatualização (executar antes de qualquer Oracle):**
> `git log ff4f0fc..HEAD -- src/pages/origination/terms-of-agreement.page.ts src/pages/origination/contract.page.ts src/selectors/common.selectors.ts src/data/merchant-config-contract.ts`
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.

### Oracle: CT-01 — Plano ofertado + widget  `[CONFIRMADO qa2 2026-06-28]`

> **Dono canônico do conteúdo do widget** (radios opt-in/opt-out, preço $12.99): este CT + CT-10 (render guard). `terms-of-agreement.md` CT-05 cobre apenas a **revelação** do overlay na página TOA e referencia este checkpoint — não duplica as asserções de conteúdo (rule #16).

| Checkpoint | Como verificar |
|---|---|
| Config do merchant | "Offer Protection Plan" = `offerInsurance=true` — live: mod-history `UPDATED: MERCHANT[ offerInsurance: from:false to:true ]` (OL90202-0001) |
| Estado permitido | estado ∈ `offer.insurance.in.states`; **NY ofertado** (16801) |
| Botão + widget | `SELECTORS.seeProtectionBenefitsBtn` visível; `SELECTORS.buddyOfferElement` não-vazio; `getByRole('radio')` ≥ 2 |
| Texto opt-in/out + preço | opt-in "I agree to the Uown Protection Plus" **$12.99/mês**; opt-out "No, continue unprotected" |

### Oracle: CT-02 — Merchant sem config NÃO oferta  `[CONFIRMADO código]`
| Checkpoint | Como verificar |
|---|---|
| Sem botão / fluxo direto | `offerInsurance=false` → `acceptAndProceedWithProtectionPlan` retorna `{buddyReached:false,radioClicked:false}` (`terms-of-agreement.page.ts:126-130`) |
| Sem linha de PP | `SELECT * FROM uown_los_protection_plan WHERE lead_pk=:lead` → 0 linhas |
| Falhar silent fallback | teste que espera Buddy deve assertar `buddyReached===true` |

### Oracle: CT-03 — Gate de estado NÃO oferta  `[CONFIRMADO live qa2 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Estado não permitido | `offerInsurance=true` mas estado ∉ lista — **CA confirmado não-permitido** |
| Log de não-oferta | `uown_los_activity_log.notes = "Protection plan not offered in state CA"` (leads 16912, 16727, 16459) |
| Lista é de backend | `offer.insurance.in.states` (NÃO em `uown_state_configurations`, que só tem `state`/`state_abbreviation`) — volátil por env (rule #16) |

### Oracle: CT-04 — Adesão finaliza na e-assinatura  `[CONFIRMADO live qa2 2026-06-28, lead 16801]`
| Checkpoint | Como verificar |
|---|---|
| Linha COMPLETED + policy | `uown_los_protection_plan` 16801: `opt_in=true, status=COMPLETED, policy_id="UOWN 000000068901", enrollment_date=2026-06-21, customer_id="buddy-..."` |
| Finaliza na assinatura | linha é PENDING no opt-in; o callback async (~45s pós e-sign) seta COMPLETED + minta `policy_id` |
| Driver | `acceptAndProceedWithProtectionPlan(true)` → `completeESign()`; assert `{buddyReached:true,radioClicked:true}` |

### Oracle: CT-05 — Não adesão (opt-out)  `[CONFIRMADO live; candidato a bug]`
| Checkpoint | Como verificar |
|---|---|
| Linha correta | 16805: `opt_in=false, status=COMPLETED, policy_id=null, enrollment_date=null` |
| ⚠️ Bug candidato | nota `"Error initiating protection plan"` (INTERNAL/SYSTEM) para um decline deliberado — confirmado live em 16805. Dado estruturado OK; bug de texto. **Descartar staleness + checar ticket (rule #19c/#10).** |

### Oracle: CT-06 — Painel do plano no Origination  `[CONFIRMADO live qa2 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Card presente | `/customers/{leadPk}` → card "Protection Plan" (lê `uown_los_protection_plan`) |
| Campos exatos | Opted In (toggle), Already Covered (toggle), Status, Enrollment Date, Cancellation Date, Cancellation Reason, Refund Amount |
| opt-in vs opt-out | 16801: Opted In=ON, COMPLETED, Enrollment 2026-06-21 · 16805: Opted In=OFF, COMPLETED, Enrollment "-" |
| **Status ≠ enrolled** | `Status=COMPLETED` em AMBOS opt-in e opt-out — o sinal de adesão é **Opted In=true + Enrollment Date preenchida**, nunca só Status |
| Não exibe | o painel NÃO mostra `policy_id`/`customer_id`/produto/preço (existem no DB, não renderizados) |

### Oracle: CT-07 — Painel do plano no Servicing  `[CONFIRMADO live qa2 2026-06-28, conta 11204]`
| Checkpoint | Como verificar |
|---|---|
| Card presente | `/customer-information/{accountPk}` → card "Protection Plan" (lê `uown_sv_protection_plan`) |
| Mesmos campos | Opted In, Already Covered, Status, Enrollment Date, Cancellation Date, Cancellation Reason, Refund Amount |
| Consistência | conta 11204: Opted In=ON, COMPLETED, Enrollment 2026-02-16 — bate com o DB (`policy_id="UOWN 000000064801"`) e com a estrutura do Origination |
| Sub-seção de fees | Servicing Information → "Protection Plan": "Protection Plan Fees To Date" + "Protection Plan Fees Paid" (BR §23 — AddOn To Date) |
| Side effect | abrir a página auto-escreve nota `REVIEW "Lead has been reviewed"` (rule #13; ver `servicing-customer-information-page.md`) |

### Oracle: CT-08 — Log da adesão no Origination  `[CONFIRMADO live qa2 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Tabela | `uown_los_activity_log` (não `uown_los_lead_notes`); surface no painel "Notes" do Origination |
| Notas | `"Customer signed and opted in for protection plan. Initiating next steps..."` → `"Successfully initiated protection plan with Buddy. Status: COMPLETED"` (16801) |

### Oracle: CT-09 — Cross-coverage (already_covered)  `[CONFIRMADO live DB qa2 2026-06-28]`
| Checkpoint | Como verificar |
|---|---|
| Persistido no Servicing | `uown_sv_protection_plan`: 8 linhas `already_covered=true` com `covered_by_account_pk` preenchido e `policy_id` **copiado** da conta cobridora (ex. covered_by 11192 → policy "UOWN 000000063201") |
| Sem nova cobrança | linha cross-coverage tem `opt_in=false` + `policy_id` copiado → **nenhuma policy nova** (anti-cobrança-dupla) |
| NÃO persistido no Origination | `uown_los_protection_plan`: `already_covered=true` count = **0** (192 linhas), `covered_by_*` = 0. Mesmos leads cross-cobertos (14614, 15308): LOS `already_covered=false` / SV `already_covered=true` |
| ⚠️ Gap de UI candidato | o toggle "Already Covered" do painel **Origination** lê a coluna LOS (nunca setada) → **sempre `false` no Origination**, mesmo para cliente cross-coberto. Cross-coverage só é conhecida no funding (servicing). Confirmar com produto se é intencional |

### Oracle: CT-10 — Render guard (rule #14)  `[CONFIRMADO código]`
| Checkpoint | Como verificar |
|---|---|
| Offer element obrigatório | `terms-of-agreement.page.ts:142-148` lança "Buddy offer element not visible ... offer-component ^1.7.1 render regression" |
| Nunca submit cego | `:178-183` lança "refusing to submit blind" se nenhum radio `checked` após 5 tentativas |
| Estado real confirmado | `selectProtectionRadio` só retorna true com `isChecked()` (`:241-256`) |

### Oracle: CT-11 — Canal 2 portal pós-funding  `[CONFIRMADO live até o checkout — qa2 2026-06-28, conta 11433]`
| Checkpoint | Como verificar |
|---|---|
| Login OTP do portal | portal Website (`website-{env}.uownleasing.com`) → submeter email do servicing (`uown_sv_email`) → OTP gravado em `uown_login_attempt.code` (lido via DB) → 6-input → "Login Success using code N; Attempt 1" em `uown_sv_activity_log` (CORRESPONDENCE "Created/Sent VerificationCode") |
| Affordance Canal 2 | botão **"Protection Plan"** (`#protectionPlanBanner`) no `/overview` → modal com `iframe` Buddy embed (`staging.embed.buddy.insure/?partner=p-19g61kzm0yy7d&ion=AON_PURCHASEPROTECTION`) |
| Widget renderiza | "Uown Protection Plus" + acordo completo + botão "Yes, Protect my lease" (`#next-button`) — render gated por scroll do acordo (rule #14: 1ª carga deu `NS_ERROR_NET_TIMEOUT`, transitório; recarregou OK) |
| Preço (confirmação independente) | widget: "agree to pay **$12.99 per month**"; checkout: "Today's Payment $12.99 + 11 additional payments of $12.99" = 12×12.99 = $155.88/ano |
| Checkout = Stripe **pk_live** | `#checkout-button` → 3 iframes Stripe Elements ("Secure card number/expiration/CVC input frame", `keyMode=live`, `apiKey=pk_live_51QHbK2…`). Buddy cobra direto via Stripe ao vivo |
| ⚠️ Terminal não finalizável | completar a inscrição exige **cartão real** (Stripe live recusa cartão de teste) → parei antes do pagamento; `uown_sv_protection_plan` da 11433 permanece `opt_in=false, policy_id=null` (sem cobrança). `[OBSERVATION]` portal de teste qa2 usa Stripe **pk_live** no Canal 2 |
| Endpoints (BR §23) | `GET /getPlanEligibilityForAccount/{accountPk}` + `POST /enrollAccountInProtectionPlan` → `uown_sv_protection_plan` COMPLETED (não disparados — bloqueados no pagamento Stripe live) |

## Itens Pendentes

- **CT-11 — pagamento terminal:** o fluxo do Canal 2 foi exercitado live até o **checkout**; a inscrição final cobra via **Stripe pk_live** e só completa com **cartão real** (Stripe live recusa cartão de teste). Não finalizável em automação sem cobrança real — parada segura. A criação da policy Buddy (`uown_sv_protection_plan` COMPLETED + `policy_id`) permanece o único passo não observado.
- **`[OBSERVATION]` — qa2 usa Stripe pk_live no Canal 2:** o portal de teste qa2 roteia o pagamento da inscrição via **Stripe live** (`pk_live_51QHbK2…`), não um key de teste/sandbox — QA não consegue completar a inscrição sem cobrança real. Candidato a reportar ao time (deveria usar Stripe test mode em qa2).
- **"Already Covered" sempre false no Origination (CT-09):** confirmar com produto se é intencional (cross-coverage só conhecida no funding) ou defeito de UI.

## Notas de fonte primária

- **Discovery completa (UI + DB qa2 2026-06-28):** [`docs/knowledge-base/protection-plan.md`](../../docs/knowledge-base/protection-plan.md). Env verificado MAX(lead.pk)=16937. Leads 16801/16805, conta 11204, estados CA (16912/16727/16459).
- **BR §23:** `docs/business-rules/09-integracoes-externas.md:22-88`. Config de oferta: BR §12 `offerInsurance` (`12-produto-lease-deep-dive.md:600`).
- **Config "Offer Protection Plan":** `src/data/merchant-config-contract.ts:66` (`offerInsurance`); label confirmada live na merchant page; toggle UI `SELECTORS.merchantOfferInsuranceCheckbox` (`common.selectors.ts:423`).
- **Page objects:** `TermsOfAgreementPage.acceptAndProceedWithProtectionPlan` / `acceptProtectionPlanAlreadyEnrolled` (`terms-of-agreement.page.ts:118-233`); `ContractPage.completeProtectionPlan` (`contract.page.ts:319-353`). Selectors `common.selectors.ts:423-435`.
- **Schema:** `uown_los_protection_plan` (origination) e `uown_sv_protection_plan` (servicing), 25 cols cada (`database-schema.md:2759`/`:200`). Cols-chave: `opt_in, status, policy_id, customer_id, already_covered, covered_by_account_pk, covered_by_lead_pk, enrollment_date, lead_pk, account_pk`.
- **Preço:** `uown_los_protection_plan.offer_element_response` → `premiumTotal:155.88, paymentOption:MONTHLY` (184/184). $155.88/12 = **$12.99/mês** (corrige a memória "/wk").
- **Candidatos a bug:** (a) opt-out logado como "Error initiating protection plan" (16805, live); (b) `already_covered`/`covered_by_*` nunca no LOS (Origination toggle sempre false) — pendentes de decisão de ticket (rule #10).

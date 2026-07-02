---
operation: paytomorrow-refund-flow
description: Fluxo E2E completo do portal parceiro PayTomorrow — criar aplicação (customer not present) no portal do merchant, finalizar no fluxo do consumidor (identidade, emprego, ofertas, contrato/e-sign no iframe UOWN embutido), acompanhar o lead na Origination até FUNDED, executar o refund pelo portal PayTomorrow (com fallback via API UOWN changeLeadStatus) e confirmar a reversão do status na Origination.
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8
covers:
  - tests/e2e/origination/paytomorrow-refund-flow.spec.ts
  - src/pages/origination/paytomorrow-portal.page.ts
  - src/pages/origination/funding.page.ts
  - src/pages/origination/customer.page.ts
  - src/api/clients/lead.client.ts
  - src/api/clients/merchant.client.ts
  - src/selectors/common.selectors.ts
  - docs/business-rules/08-funding-merchants.md
---

# Oracle BDD — PayTomorrow Refund Flow

> **Gatilho:** qualquer operação que exercite o fluxo de refund do parceiro PayTomorrow — criar/enviar aplicação pelo portal `merchant-staging.paytomorrow.com`, finalizar a jornada do consumidor no iframe UOWN embutido, ou executar/verificar o refund que reverte um lead FUNDED de volta para UW_APPROVED (via portal PayTomorrow ou via `changeLeadStatus` na API UOWN). Inclui rodar `paytomorrow-refund-flow.spec.ts` (rule #19 — executar o spec É executar as operações que ele exercita).
>
> **Verificação de obsolescência:**
> ```bash
> git log cd2d2c8..HEAD -- \
>   tests/e2e/origination/paytomorrow-refund-flow.spec.ts \
>   src/pages/origination/paytomorrow-portal.page.ts \
>   src/pages/origination/funding.page.ts \
>   src/pages/origination/customer.page.ts \
>   src/api/clients/lead.client.ts \
>   src/api/clients/merchant.client.ts \
>   src/selectors/common.selectors.ts \
>   docs/business-rules/08-funding-merchants.md
> ```
> Sem output = oracle está atual.
>
> **Ambiente:** o portal PayTomorrow (`merchant-staging.paytomorrow.com`, MSA `MSAPowersports`) está cabeado para criar aplicações contra o UOWN **sandbox**, independentemente do `ENV` do framework — o iframe do contrato aponta para `secure-sandbox.uownleasing.com`. Fluxo E2E de portal parceiro é **sandbox-only** (memória "Partner portals wired to sandbox"). O webhook UOWN→PT retorna **401 em staging/sandbox**, portanto o portal PayTomorrow consulta o status do UOWN ao carregar os detalhes da aplicação, em vez de confiar no webhook (comentário do spec, linhas 21-24).
>
> **Multi-tab:** Tab 0 = portal PayTomorrow (permanece aberta o tempo todo); Tab 1 = fluxo de finalização do consumidor (aberta/fechada nas fases 5-6); Tab 2 = UOWN Origination (fases 7-9).
>
> **Distinção de contexto — dois caminhos de refund no código:**
> 1. **Caminho portal PayTomorrow (canônico):** botão "Refund" na tela de detalhes da aplicação → modal "Refund Application" → motivo + checkbox de concordância + "Refund $XXX". O PT cancela a invoice via API → UOWN cria a transação `REQUEST_REFUND` e reverte para UW_APPROVED.
> 2. **Caminho fallback API UOWN:** quando o refund do portal PT não propaga (webhook 401 em staging), o spec chama `api.lead.changeLeadStatus(merchant, leadPk, 'UW_APPROVED')` para reverter o status diretamente. Ambos convergem para um status pós-refund aceito (CT-06/CT-07).

---

## CT-01 — Criar aplicação no portal PayTomorrow e capturar a finalization URL

```gherkin
Dado que o merchant está autenticado no portal PayTomorrow (MSAPowersports) na tela de aplicações
Quando o merchant inicia uma aplicação "customer not present" preenchendo telefone, nome, sobrenome e email do cliente
E adiciona um item ao carrinho com endereço, order id, descrição, quantidade 1 e preço $1.000 (abaixo do limite de aprovação)
E envia o carrinho ao cliente via "Send Cart"
Então a chamada POST /send/cart responde 200 e retorna a finalization URL do cliente
E a finalization URL é não-vazia (capturada da resposta de /send/cart, com fallback de token da página de detalhes)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Login no portal PT | redireciona para `**/merchant/applications/**` após submit do Keycloak (`#username`/`#password`/`#kc-login`) | `paytomorrow-portal.page.ts:43-61` |
| Fluxo customer-not-present | clica "No" (customer não presente) → preenche 4 campos → "Initiate Pre Approval" → confirma diálogo "Add the cart" | `paytomorrow-portal.page.ts:91-141` |
| Resposta de `/send/cart` | HTTP 200, body com `url`/`token` | `paytomorrow-portal.page.ts:235-257` |
| `finalizationUrl` capturada | truthy (não-vazia) — `expect(finalizationUrl, 'Finalization URL should be captured from /send/cart API').toBeTruthy()` | `paytomorrow-refund-flow.spec.ts:108` |
| PT App ID | extraído da URL de detalhes `details/(\d+)` (numérico) | `paytomorrow-refund-flow.spec.ts:110-114` |

---

## CT-02 — Finalização do consumidor + contrato/e-sign no iframe UOWN embutido

```gherkin
Dado que o cliente recebeu a finalization URL da aplicação PayTomorrow
Quando o cliente completa identidade (endereço, termos, OTP 12345, SSN, data de nascimento, ciclo de pagamento), emprego e seleciona a oferta de 16 meses
E completa o contrato dentro do iframe UOWN embutido (secure-sandbox.uownleasing.com): dados de cartão, dados bancários/ACH, submit, termos e condições, e assinatura eletrônica
Então a jornada do consumidor conclui a cerimônia de assinatura no iframe
E o lead correspondente existe no UOWN Origination, localizável por email
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| SEON IDV desabilitado (pré-condição) | `mSetup.configureWith(refCode, 'lifecycle', { isSeonIdCheckRequired: false })` antes do fluxo | `paytomorrow-refund-flow.spec.ts:58-63` |
| SSN força elegibilidade 16m | sufixo `916` (mock BlackBox) → oferta de 16 meses disponível | `paytomorrow-refund-flow.spec.ts:65-67` |
| Iframe do contrato | `SELECTORS.ptContractIframe` visível apontando para `secure-sandbox.uownleasing.com/{token}/complete` | `paytomorrow-portal.page.ts:669-676` |
| Submit no iframe | via `el.dispatchEvent(new MouseEvent('click'))` (JS dispatch) para contornar o overlay do SEON IDV (pointer-events CSS) | `paytomorrow-portal.page.ts:743-748` |
| E-sign detectado | GowSign OU SignWell OU PandaDocs dentro do iframe UOWN (auto-detecção, 15 tentativas) | `paytomorrow-portal.page.ts:961-1055` |
| Lead localizável na Origination | busca por Email → `searchAndSelectFirst(uniqueEmail)` retorna o customer page | `paytomorrow-refund-flow.spec.ts:172-174` |
| **Log de Atividade (Regra #13)** | o spec NÃO valida `uown_los_lead_notes` para o evento de assinatura/submissão — lacuna de cobertura. Deveria haver nota `[ContractService]`/`SendInvoiceService` no lead. `[HYPOTHESIS]` — validar em `uown_los_lead_notes WHERE lead_pk = $lead_pk` ao expandir o teste | Regra #13; ausente em `paytomorrow-refund-flow.spec.ts` |

---

## CT-03 — Lead auto-transiciona SIGNED → FUNDING (MSAPowersports is_signed_to_funding=true)

```gherkin
Dado que o lead PayTomorrow concluiu a assinatura no UOWN Origination
E o merchant MSAPowersports tem a configuração "Move from Signed to Funding" habilitada
Quando o agente aciona a checagem de status do documento e acompanha o status do lead
Então o lead atinge o status "Funding" (ou além) sem necessidade de settle manual
E o número da conta fica disponível no resumo do lead
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Gatilho de checagem backend | `customerPage.clickGetDocumentStatus()` antes do polling | `paytomorrow-refund-flow.spec.ts:184` |
| Poll de status inicial | `pollForLeadStatus(['signed','fund','settled'], 20, 5_000)` | `paytomorrow-refund-flow.spec.ts:186-188` |
| Config auto-funding do merchant | `api.merchant.isSignedToFundingEnabled(merchantNumber)` → `true` (lê `merchantInfo.isSignedToFunding`) → pula settle manual | `paytomorrow-refund-flow.spec.ts:219-225`; `merchant.client.ts:29-33` |
| Status atinge Funding/Funded | `pollForLeadStatus(['funding','funded'], 15, 2_000)` → `expect(status.toLowerCase().includes('fund')).toBeTruthy()` | `paytomorrow-refund-flow.spec.ts:242-247` |
| Regra de negócio (→ FUNDING) | "Lead imported into SVC, account created, `fundRequestDateTime` recorded" | `docs/business-rules/08-funding-merchants.md:50` |
| Número da conta | `customerPage.getAccountNumberFromSummary()` retorna valor (armazenado em `ctx.accountNumber`) | `paytomorrow-refund-flow.spec.ts:200-202` |

---

## CT-04 — Lead atinge FUNDED (auto-fund ou via Funding Queue "Send to FUNDED")

```gherkin
Dado que o lead está em status "Funding" no UOWN Origination
Quando o lead auto-funda (MSAPowersports) OU o agente inicia "Send to FUNDED" na Funding Queue
Então o status do lead atinge "Funded" (e não permanece em "Funding")
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Curto-circuito auto-fund | se status já contém "funded" e não "funding" → pula a Funding Queue | `paytomorrow-refund-flow.spec.ts:261-262` |
| Navegação à Funding Queue | `fundingPage.navigateToFundingQueue()` + `searchUntilRecordsAppear(10, 10_000)` | `paytomorrow-refund-flow.spec.ts:265-269` |
| Ação "Send to FUNDED" | `fundingPage.fundFirstEntry()` (quando há registros na fila) | `paytomorrow-refund-flow.spec.ts:272-274` |
| Poll até FUNDED | `pollForLeadStatus(['funded'], 40, 5_000)` — FUNDING→FUNDED pode levar 2-5 min em staging | `paytomorrow-refund-flow.spec.ts:286-289` |
| Asserção final FUNDED | `expect(currentStatus.includes('funded') && !currentStatus.includes('funding')).toBeTruthy()` | `paytomorrow-refund-flow.spec.ts:292-295` |
| Regra de negócio (FUNDING→FUNDED) | "Merchant received payment, FUNDED transaction created, lead → FUNDED" | `docs/business-rules/08-funding-merchants.md:51` |

---

## CT-05 — Refund via portal PayTomorrow propaga para o UOWN

```gherkin
Dado que o lead está em status FUNDED e a aba do portal PayTomorrow permaneceu aberta desde o login
Quando o merchant abre os detalhes da aplicação (ícone de olho pi-eye), clica em "Refund", preenche o motivo "test", marca a concordância e confirma em "Refund $XXX"
Então o portal PayTomorrow processa o refund e cancela a invoice via API
E o status do lead no UOWN Origination muda para "Approved" ou "Request Refund" (o PT consulta o status do UOWN ao carregar os detalhes)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Abrir detalhes da aplicação | clique no ícone `SELECTORS.ptEyeIcon` (`pi-eye`) na primeira linha da lista | `paytomorrow-portal.page.ts:1255-1268` |
| Botão "Refund" visível | `button[label='Refund']` — poll até aparecer (status PT vira "FUNDED BY LENDER") | `paytomorrow-portal.page.ts:1277-1303` |
| Modal "Refund Application" | `SELECTORS.ptRefundApplicationModal` visível | `paytomorrow-portal.page.ts:1311-1314` |
| Motivo + concordância | `textarea[name='refundReason']` = "test"; `SELECTORS.ptRefundCheckbox` marcado | `paytomorrow-portal.page.ts:1320-1332` |
| Confirmação | clique em `span:has-text('Refund $')` / `button:has-text('Refund $')` | `paytomorrow-portal.page.ts:1336-1339` |
| Propagação ao UOWN | `pollForLeadStatus(['approved','refund'], 6, 5_000)` na aba Origination → status contém "approved" ou "refund" | `paytomorrow-refund-flow.spec.ts:324-329` |

---

## CT-06 — Fallback: refund via API UOWN changeLeadStatus quando o webhook não propaga

```gherkin
Dado que o refund pelo portal PayTomorrow foi submetido mas o status do UOWN não mudou (webhook PT→UOWN retorna 401 em staging)
Quando o teste invoca a API UOWN changeLeadStatus(merchant, leadPk, "UW_APPROVED")
Então a resposta HTTP é bem-sucedida (response.ok)
E o lead é revertido para UW_APPROVED no UOWN
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Gatilho do fallback | `catch` do bloco de refund do portal PT (não propagou / webhook 401) | `paytomorrow-refund-flow.spec.ts:333-336` |
| Chamada da API | `api.lead.changeLeadStatus(merchantConfig, leadPk, 'UW_APPROVED')` → `POST /uown/los/changeLeadStatus` | `paytomorrow-refund-flow.spec.ts:338-340`; `lead.client.ts:16-29` |
| Asserção de sucesso | `expect(refundResp.ok, 'UOWN API refund should succeed').toBeTruthy()` | `paytomorrow-refund-flow.spec.ts:341` |
| Regra de negócio | `changeLeadStatus` permite transição para `UW_APPROVED`; "Non-eligible status → UW_APPROVED: re-runs remaining UW steps with a reset of fraud services" | `docs/business-rules/08-funding-merchants.md:148-158` |
| Registro do método | annotation `refundMethod` = "PT Portal" ou "UOWN API (changeLeadStatus → UW_APPROVED)" | `paytomorrow-refund-flow.spec.ts:342-346` |

---

## CT-07 — Status pós-refund no UOWN: revertido para Approved ou Request Refund

```gherkin
Dado que o refund foi executado (via portal PayTomorrow ou via API UOWN)
Quando o agente busca o lead por email no UOWN Origination e acompanha o status
Então o status do lead é "Approved" (UW_APPROVED, quando a invoice foi cancelada) OU "Request Refund" (quando a transação de funding foi marcada REQUEST_REFUND)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Poll pós-refund | `pollForLeadStatus(['approved','refund'], 20, 5_000)` (com reloads — propagação assíncrona) | `paytomorrow-refund-flow.spec.ts:381-383` |
| Status aceito | `isPostRefundStatus(s)` = contém "approved" OU "refund" → `expect(...).toBeTruthy()` | `paytomorrow-refund-flow.spec.ts:375-388` |
| annotation final | `finalLeadStatus` gravada com o status observado | `paytomorrow-refund-flow.spec.ts:390` |
| Transação de funding (regra de negócio) | refund de lead FUNDED → "REQUEST_REFUND transaction created"; `REQUEST_REFUND → REFUNDED` = "Money clawed back from the merchant" | `docs/business-rules/08-funding-merchants.md:53,60,1112` |
| **Transação REQUEST_REFUND no DB** | `[HYPOTHESIS]` — o spec NÃO consulta a tabela de transações de funding; o checkpoint DB exato (nome da tabela/coluna) não foi verificado neste ambiente. Ao expandir, validar a linha `REQUEST_REFUND` para o lead/conta | derivado de `docs/business-rules/08-funding-merchants.md`; ausente no spec |
| **Log de Atividade (Regra #13)** | `[HYPOTHESIS]` — o spec valida apenas o status na UI, não a nota de atividade do refund. Deveria haver nota do refund/reversão em `uown_los_lead_notes`. Validar `WHERE lead_pk = $lead_pk` ao expandir o teste | Regra #13; ausente no spec |

---

## CT-08 — [negative] Carrinho excede o valor máximo aprovado bloqueia a aplicação

```gherkin
Dado que o cliente está na página de ofertas do fluxo de finalização PayTomorrow
Quando o valor do carrinho excede o limite máximo aprovado para o cliente
Então a aplicação é bloqueada com uma mensagem de erro ("cart value exceeded" / "exceeded your maximum")
E nenhuma oferta é selecionável
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Detecção do bloqueio | `handleOffers` inspeciona o body por `cart value exceeded` / `exceeded your maximum` e lança erro antes de selecionar oferta | `paytomorrow-portal.page.ts:533-538` |
| Mensagem de erro | captura o trecho `Sorry.*?Thank you\.` ou fallback "Cart exceeded max approved amount" | `paytomorrow-portal.page.ts:536-537` |
| Mitigação no happy path | preço do item mantido em $1.000 e tax/shipping/discount em 0 para ficar abaixo de ~$1.500 | `paytomorrow-portal.page.ts:190-211` |

---

## Pré-condições

- **Ambiente sandbox-only** (regra de negócio de portal parceiro): o portal PayTomorrow embute `secure-sandbox` independentemente do `ENV`. Não rodar contra qa2/stg esperando o iframe embutido.
- **Preflight do merchant** (regra #12): `mSetup.configureWith(refCode, 'lifecycle', { isSeonIdCheckRequired: false })` — o perfil `lifecycle` + desabilitar SEON IDV é obrigatório antes do fluxo, senão o overlay do SEON intercepta cliques no iframe do contrato.
- **SSN dinâmico** com sufixo `916` (mock BlackBox força elegibilidade de 16 meses); prefixo aleatório por run para isolamento (`uniqueEmail`).
- **Timeout do teste**: `test.setTimeout(900_000)` (15 min) — fluxo multi-portal, polling de status e site externo.
- **Multi-tab**: a aba 0 do portal PayTomorrow deve permanecer aberta desde o login até o refund (o botão "Refund" só aparece após o UOWN sinalizar FUNDED, e o PT reconsulta o status ao carregar os detalhes).
- **Merchant `MSAPowersports`** tem `is_signed_to_funding=true` → auto-transição SIGNED → FUNDING sem settle manual.

## Log de Atividade (Regra #13) — lacuna conhecida

Este spec valida transições de status **apenas pela UI** (via `pollForLeadStatus`). Ele **não** consulta `uown_los_lead_notes` nem a tabela de transações de funding. Por Regra #13 e CLAUDE.md #13, cada ação de negócio (assinatura, funding, refund/reversão) deveria ter validação de log/nota correspondente. Ao promover este oracle a cobertura completa, adicionar asserções de DB para:
- nota de assinatura/submissão (CT-02);
- transição para FUNDING/FUNDED (CT-03/CT-04);
- transação `REQUEST_REFUND` e/ou nota de reversão pós-refund (CT-07).

Enquanto essas asserções não existirem, os checkpoints de log/DB acima estão marcados `[HYPOTHESIS]` — fundamentados na regra de negócio (`08-funding-merchants.md`), não em `expect()` do spec.

---
operation: lease-cancellation
description: Cancelamento de invoice em APPROVED (via API sendInvoice orderType="5") e cancelamento de lease inteiro a partir de SIGNED via botão "Cancel Lease" na barra de ações do portal Origination — em SIGNED, FUNDING sem refund e FUNDING com refund (refundAllPayments). Termina o lead/conta; distinto de modify-lease (que mantém o lead vivo).
last-reviewed: 2026-07-01
last-reviewed-sha: 3b8ce82
covers:
  - tests/e2e/origination/lease-cancellation.spec.ts
  - src/pages/origination/customer.page.ts
  - src/pages/servicing/customer.page.ts
  - src/pages/website/website-base.page.ts
  - src/selectors/common.selectors.ts
  - src/helpers/api-setup.helpers.ts
  - docs/business-rules/06-conta-ciclo-vida.md
  - docs/business-rules/07-modificacoes-conta.md
---

# Oracle BDD — Cancelamento de Lease / Invoice (Lease / Invoice Cancellation)

> **Gatilho:** qualquer ação que (a) cancele uma invoice em APPROVED via `sendInvoice` com `orderType="5"`, ou (b) acione o botão "Cancel Lease" na barra de ações do portal Origination para encerrar um lease em SIGNED ou FUNDING (com ou sem `refundAllPayments`). Aplica-se também à execução da spec `lease-cancellation.spec.ts` (rodar a spec É executar a operação — regra #19).
>
> **Verificação de obsolescência:**
> ```bash
> git log 3b8ce82..HEAD -- \
>   tests/e2e/origination/lease-cancellation.spec.ts \
>   src/pages/origination/customer.page.ts \
>   src/pages/servicing/customer.page.ts \
>   src/pages/website/website-base.page.ts \
>   src/selectors/common.selectors.ts \
>   src/helpers/api-setup.helpers.ts \
>   docs/business-rules/06-conta-ciclo-vida.md \
>   docs/business-rules/07-modificacoes-conta.md
> ```
> Sem output = oracle está atual. Com output = prefixar validações com `[BDD MAY BE STALE]` e re-revisar.
>
> **Viewport:** Origination e Servicing são portais internos voltados para agentes. Obrigatório **1440×900** — `d-lg-block` oculta a barra de ações abaixo de 992 px (regra #15). O botão "Cancel Lease" vive na barra de ações colapsável; `cancelLease` expande o menu (`expandActionsMenu`) e usa `click({ force: true })` após dispensar o alert bar (`dismissAlertBar`), que pode sobrepor o botão. O pagamento no portal do cliente (website, CT-04/CT-05) é feito a **375/768/1440** conforme regra #15 (fluxo customer-facing).
>
> **Distinção de contexto — cancelamento ≠ modificação:**
> 1. **modify-lease (oracle irmão `modify-lease.md`):** altera o VALOR da invoice mantendo o MESMO lead vivo (reduz → mantém SIGNED; aumenta → CONTRACT_CREATED). Nenhum lead novo, nenhum encerramento. `sendInvoice` com `orderType="1"`.
> 2. **lease-cancellation (este oracle):** ENCERRA a operação. Invoice em APPROVED → `orderType="5"` → status vira `INVOICE_CANCELED`. Lease em SIGNED/FUNDING → botão "Cancel Lease" → o lead volta para `UW_APPROVED` (contrato anulado) e, quando já existe conta no Servicing (FUNDING), a conta vai para `CANCELLED`. Regra de negócio §52 (`06-conta-ciclo-vida.md`).
>
> **Escopo — estados cobertos:** APPROVED (invoice), SIGNED, FUNDING. **FUNDED está FORA de escopo** — leases já financiados seguem um fluxo de refund separado pelo portal PayTomorrow (cabeçalho da spec, linhas 10-11). O botão "Cancel Lease" só existe de SIGNED em diante.

---

## CT-01 — Cancelamento de invoice em APPROVED → INVOICE_CANCELED

```gherkin
Dado que um lead em status APPROVED com uma invoice está aberto no portal Origination com viewport 1440×900
E o lead foi criado via createPreQualifiedApplication com skipPaymentInfo=true
Quando o agente abre a invoice pelo link "Invoice #XXXXX" no card Documents
E exclui todos os itens da invoice via deleteAllInvoiceItems() e clica em SAVE
E a invoice é cancelada via API sendInvoice com orderType="5" (todos os valores 0.00 e lineItem vazio)
Então a API sendInvoice responde com sucesso (response.ok)
E ao recarregar a página o status interno do lead contém "INVOICE_CANCEL" (INVOICE_CANCELED)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Link da invoice visível | `button` com texto que casa `/Invoice\s*#/i`, primeiro | `lease-cancellation.spec.ts:138-139` |
| Itens excluídos | `deleteAllInvoiceItems()` retorna `> 0` (ao menos 1 item removido) | `lease-cancellation.spec.ts:147-149`; `customer.page.ts:969` |
| Botão SAVE | `getByRole('button', { name: /^save$/i })`, primeiro | `lease-cancellation.spec.ts:152-154` |
| Corpo do cancelamento API | `orderType: '5'`, `merchandiseSubtotal/orderTotal/…: '0.00'`, `lineItem: []`, `accountNumber = ctx.leadUuid` | `lease-cancellation.spec.ts:163-182` |
| Resposta da API | `cancelResp.ok === true` | `lease-cancellation.spec.ts:185` |
| Status interno após reload | `getInternalStatus()` (UPPER) contém `"INVOICE_CANCEL"` | `lease-cancellation.spec.ts:193-198`; `customer.page.ts:239` |

> **Nota de negócio:** o status `ORDER_CANCELLED` ("Merchant order/invoice cancelled") consta em `06-conta-ciclo-vida.md:259` como sub-status de cancelamento; o valor observado pela UI é `INVOICE_CANCELED` (asserção `toContain('INVOICE_CANCEL')` cobre ambos os prefixos). A exclusão de itens pela UI NÃO altera o status por si só — o cancelamento é disparado pelo `sendInvoice orderType="5"` (comentário `lease-cancellation.spec.ts:160-162`).

---

## CT-02 — Botão "Cancel Lease" disponível de SIGNED em diante + modal de confirmação

```gherkin
Dado que um lead está em status SIGNED aberto no portal Origination com viewport 1440×900
Quando o agente expande a barra de ações
Então o botão "Cancel Lease" está visível (indisponível antes de SIGNED)
E ao clicar abre um modal com campo de comentário obrigatório
E o modal possui um checkbox opcional "Refund all payments"
E o botão de confirmação dentro do modal tem o rótulo "Cancel Lease"
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Disponibilidade do botão | `button:has-text('Cancel Lease')` visível somente de SIGNED em diante | `lease-cancellation.spec.ts:10` (cabeçalho); `customer.page.ts:850` |
| Alert bar dispensado antes | `dismissAlertBar()` chamado — o alert bar pode sobrepor o botão | `customer.page.ts:835,854` |
| Campo de comentário no modal | `.modal.show textarea, .modal.show input[name="comment"], .modal.show #comment` visível | `customer.page.ts:867-868` |
| Checkbox de refund | `.modal.show input[name="refundAllPayments"], …[type="checkbox"][name*="refund"]` (marcado apenas quando `refundAllPayments=true`) | `customer.page.ts:903-910` |
| Botão de confirmação | `.modal.show button:has-text("Cancel Lease")`, clicado com `force: true` | `customer.page.ts:917-922` |
| Toast de resultado | `captureAndDismissToast(60_000)` retorna texto contendo "cancel" (lower) | `customer.page.ts:958`; `lease-cancellation.spec.ts:244` |

> **Nota de robustez:** `cancelLease` faz até 5 tentativas; o clique é `force: true` (não safe-click) porque o menu de ações colapsa/re-renderiza. Estilo herdado da barra de ações colapsável (mesma classe do CT do modify-lease).

---

## CT-03 — Cancelamento de lease em SIGNED (sem refund) → UW_APPROVED

```gherkin
Dado que um lead está em status SIGNED (definido via changeLeadStatus após createPreQualifiedApplication com submitPaymentInfoViaApi=true)
Quando o agente aciona "Cancel Lease" com um comentário e sem marcar o refund
Então o toast de confirmação contém a palavra "cancel"
E ao recarregar a página o status interno do lead contém "UW_APPROVED" (contrato anulado, lead volta ao estado aprovado)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup de SIGNED | `api.lead.changeLeadStatus(merchant, leadPk, 'SIGNED', …)` responde `ok` | `lease-cancellation.spec.ts:230-233` |
| `refundAllPayments` | `false` (checkbox NÃO marcado) | `lease-cancellation.spec.ts:239-242` |
| Texto do toast | `toastText.toLowerCase()` contém `"cancel"` | `lease-cancellation.spec.ts:244` |
| Status interno após reload | `getInternalStatus()` (UPPER) contém `"UW_APPROVED"` | `lease-cancellation.spec.ts:252-254` |

---

## CT-04 — Cancelamento de lease em FUNDING sem refund → UW_APPROVED + conta CANCELLED no Servicing

```gherkin
Dado que um lead foi levado a FUNDING (createPreQualifiedApplication + driveLeadToFunding)
E foi feito um pagamento CC de $25 no portal Servicing e um pagamento CC de $15 no portal do cliente (website)
Quando o agente aciona "Cancel Lease" com um comentário e SEM marcar o refund
Então o toast de confirmação contém a palavra "cancel"
E o status interno do lead no Origination contém "UW_APPROVED"
E o Account Number é lido do sumário do cliente
E a conta correspondente no portal Servicing tem status contendo "CANCEL" (CANCELLED)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Setup a FUNDING | `driveLeadToFunding(api, merchant, ctx)` após `createPreQualifiedApplication({ submitPaymentInfoViaApi: true })` | `lease-cancellation.spec.ts:283-286`; `api-setup.helpers.ts` |
| Pagamento Servicing | `ServicingCustomerPage.addCreditCard` + `makeCcPayment('0', '25', …)` com `TEST_CARDS.VISA_APPROVED` | `lease-cancellation.spec.ts:288-306` |
| Pagamento cliente (website) | login por email OTP + `WebsiteBasePage.makeCcPayment('15')` | `lease-cancellation.spec.ts:308-310`; `website-base.page.ts` |
| `refundAllPayments` | `false` | `lease-cancellation.spec.ts:317-320` |
| Texto do toast | contém `"cancel"` (lower) | `lease-cancellation.spec.ts:322` |
| Status interno Origination | `getInternalStatus()` (UPPER) contém `"UW_APPROVED"` | `lease-cancellation.spec.ts:331-333` |
| Account Number | `getAccountNumberFromSummary()` não vazio | `lease-cancellation.spec.ts:335`; `customer.page.ts:707` |
| Status da conta Servicing | `ServicingCustomerPage.getAccountStatus()` (UPPER) contém `"CANCEL"` (CANCELLED) | `lease-cancellation.spec.ts:340`; `customer.page.ts:111`; `06-conta-ciclo-vida.md:308` (§52 passo 1) |

> **Nota:** `verifyServicingAccountStatus` faz `sleep(5_000)` (propagação Origination→Servicing) e navega para `customer-information/{accountNumber}`. Sem refund, os pagamentos de $25/$15 permanecem aplicados; a asserção cobre apenas o status CANCELLED da conta (não há verificação de estorno neste CT — é o que distingue de CT-05).

---

## CT-05 — Cancelamento de lease em FUNDING COM refund → conta CANCELLED + histórico CC com REFUNDED + CREDIT

```gherkin
Dado que um lead foi levado a FUNDING com um pagamento CC de $25 no Servicing e $15 no portal do cliente
Quando o agente aciona "Cancel Lease" com um comentário E marca "Refund all payments"
Então o toast de confirmação contém a palavra "cancel"
E o status interno do lead no Origination contém "UW_APPROVED"
E a conta no portal Servicing tem status contendo "CANCEL" (CANCELLED)
E no histórico de cartão de crédito (credit-card-history) existe ao menos uma linha com Status "REFUNDED"
E existe ao menos uma linha com CC Action "CREDIT" (a transação de estorno)
E o valor estornado na linha REFUNDED contém "$25.00" (o pagamento do Servicing)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `refundAllPayments` | `true` (checkbox marcado) | `lease-cancellation.spec.ts:403-406` |
| Texto do toast | contém `"cancel"` (lower) | `lease-cancellation.spec.ts:408` |
| Status interno Origination | `getInternalStatus()` (UPPER) contém `"UW_APPROVED"` | `lease-cancellation.spec.ts:417-419` |
| Status da conta Servicing | contém `"CANCEL"` (CANCELLED) | `lease-cancellation.spec.ts:426` |
| Página do histórico CC | `credit-card-history/{accountNumber}` | `lease-cancellation.spec.ts:431-432` |
| Linha REFUNDED | ao menos 1 linha com `[data-column-id="9"]` (Status) = `"REFUNDED"` | `lease-cancellation.spec.ts:446-450` |
| Linha CREDIT | ao menos 1 linha com `[data-column-id="13"]` (CC Action) = `"CREDIT"` | `lease-cancellation.spec.ts:458-462` |
| Valor estornado | `[data-column-id="3"]` (Captured Amount) da linha REFUNDED contém `"$25.00"` (= servicingPaymentAmount) | `lease-cancellation.spec.ts:453,470-473` |

> **Nota de negócio (§52 / Account Cancellation via Lead):** só transações com `action = SALE` e `status = APPROVED` são estornadas, ficando com status `REFUNDED` (`06-conta-ciclo-vida.md:322-323`). O estorno é feito via `RefundPaymentService` quando `refundAllPayments = true` (`06-conta-ciclo-vida.md:312`). A spec valida o estorno do pagamento do Servicing ($25) explicitamente; o pagamento de $15 do portal do cliente não é afirmado com valor exato (apenas a presença das linhas REFUNDED/CREDIT).

---

## CT-06 — Log de atividade do cancelamento (Regra #13) — [GAP: não coberto pela spec]

```gherkin
Dado que um cancelamento de lease foi concluído (SIGNED ou FUNDING, com ou sem refund)
Quando o agente consulta o log de atividade do lead/conta
Então existe uma entrada de log registrando o evento de mudança de status para CANCELLED
E o comentário obrigatório informado no modal está persistido junto ao evento
E, quando houve refund, existe uma entrada de log para cada pagamento estornado
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Log de mudança de status | entrada em `uown_los_lead_notes` / log da conta com o evento de cancelamento (CANCELLED) | `06-conta-ciclo-vida.md:311` (§52 passo 4: "Activity log created with the status-change event") |
| Comentário persistido | o comentário obrigatório do modal aparece no log | `06-conta-ciclo-vida.md:310` (§52 passo 3) |
| Log de refund (quando aplicável) | entrada por transação estornada (`RefundPaymentService`) | `06-conta-ciclo-vida.md:312` |
| **[GAP — Regra #13]** | **A spec `lease-cancellation.spec.ts` NÃO consulta `uown_los_lead_notes` nem valida NENHUM log de atividade em nenhum CT (validação é 100% via UI: status interno + status da conta + tabela de histórico CC).** A regra de negócio §52 afirma que o backend GRAVA o log ("Activity log created with the status-change event"), portanto a cobertura de log é obrigatória mas AUSENTE. Um `qa-implementer` deve adicionar `db.waitForRecord` sobre `uown_los_lead_notes WHERE lead_pk = $1` (evento de cancelamento) e, para CT-05, sobre o log de refund, antes de considerar a cobertura completa. | [OBSERVATION] — lacuna identificada na análise da spec 2026-07-01; asserção de log a criar (regra #13) |

```sql
-- Validação DB CT-06 a IMPLEMENTAR (substituir $lead_pk) — atualmente ausente da spec
SELECT pk, notes FROM uown_los_lead_notes
WHERE lead_pk = $lead_pk
  AND (notes ILIKE '%cancel%' OR notes ILIKE '%CANCELLED%')
ORDER BY pk DESC LIMIT 5;
-- [HYPOTHESIS] os padrões de texto exatos do log de cancelamento não foram confirmados
-- contra o backend; a query acima é um ponto de partida a validar via discovery/DB real.
```

---

## Pré-condições

- **Preflight do merchant** (regra #12): `mSetup.configureByName('TerraceFinance', 'lifecycle')` antes de cada teste que cria um lead (todos os 4 CTs da spec chamam).
- **`skipPaymentInfo: true`** em `createPreQualifiedApplication` para CT-01 (invoice em APPROVED, sem processar pagamento).
- **`submitPaymentInfoViaApi: true`** para CT-03/CT-04/CT-05 (lead precisa de payment info para chegar a SIGNED/FUNDING).
- **`driveLeadToFunding(api, merchant, ctx)`** para CT-04/CT-05 (leva o lead a FUNDING antes do cancelamento).
- **Estado/merchant:** `state: 'NY'`, `merchant: 'TerraceFinance'`, `orderTotal: '800'` em todos os CTs (dados da spec).
- **Timeouts:** CT-01/CT-02/CT-03 = 300 s; CT-04/CT-05 = 600 s (envolvem pagamentos em 2 portais + email OTP).
- **Viewport:** 1440×900 para Origination/Servicing; portal do cliente (website) segue a matriz mobile-first da regra #15.
- **Email OTP (CT-04/CT-05):** `emailFixture.getVerificationCode(applicantEmail)` para login no portal do cliente — depende do IMAP configurado.
- **Cartão de teste:** `TEST_CARDS.VISA_APPROVED` (a spec usa VISA nos pagamentos do Servicing; observar que a regra de application-lifecycle recomenda MASTERCARD_APPROVED para o fluxo de origination — aqui o pagamento é pós-FUNDING no Servicing).

## Log de Atividade (Regra #13)

⚠️ **Cobertura de log AUSENTE na spec atual.** Ver CT-06. A regra de negócio §52 (`06-conta-ciclo-vida.md:311`) garante que o backend cria um log de mudança de status no cancelamento e um log por pagamento estornado. Nenhum CT da `lease-cancellation.spec.ts` valida esses logs — toda a verificação é via UI (status interno, status da conta, tabela de histórico CC). Isto é uma lacuna de conformidade com a regra #13, não um comportamento esperado. O `qa-implementer` deve fechar essa lacuna com asserções sobre `uown_los_lead_notes` (padrões de texto a confirmar via discovery — marcados `[HYPOTHESIS]` acima).

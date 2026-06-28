---
operation: modify-lease
description: Modificação de invoice via botão da barra de ações do portal Origination (reduzir valor, aumentar valor, validação de mínimo, em FUNDING) e via API sendInvoice (orderType="1").
last-reviewed: 2026-06-28
last-reviewed-sha: ff4f0fc
covers:
  - src/pages/origination/customer.page.ts
  - src/selectors/common.selectors.ts
  - docs/business-rules/07-modificacoes-conta.md
  - docs/business-rules/08-funding-merchants.md
  - docs/business-rules/12-produto-lease-deep-dive.md
  - docs/knowledge-base/origination-lead-detail-actions-and-invoice.md
  - tests/e2e/origination/modify-lease.spec.ts
  - tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts
---

# Oracle BDD — Modificação de Lease (Modify Lease)

> **Gatilho:** qualquer ação que acesse o fluxo "Modify Lease" no portal Origination ou que chame `sendInvoice` com `orderType="1"` para atualizar uma invoice existente.
>
> **Verificação de obsolescência:**
> ```bash
> git log ff4f0fc..HEAD -- \
>   src/pages/origination/customer.page.ts \
>   src/selectors/common.selectors.ts \
>   docs/business-rules/07-modificacoes-conta.md \
>   docs/business-rules/08-funding-merchants.md \
>   docs/business-rules/12-produto-lease-deep-dive.md \
>   docs/knowledge-base/origination-lead-detail-actions-and-invoice.md \
>   tests/e2e/origination/modify-lease.spec.ts \
>   tests/e2e/origination/lead-detail-esign-modify-lease.spec.ts
> ```
> Sem output = oracle está atual.
>
> **Viewport:** Origination é um portal interno voltado para agentes. Obrigatório **1440×900** — `d-lg-block` oculta a barra de ações abaixo de 992 px (regra #15). Os botões de ação ficam em uma barra colapsável com scroll horizontal; `clickActionButton` usa JS-dispatch após `scrollIntoView`.
>
> **Distinção de contexto — dois caminhos de "modificação" no código:**
> 1. **Caminho UI (este oracle):** botão "Modify Lease" na barra de ações → `sendInvoice` com itens atualizados. O mesmo lead continua; nenhum novo lead é criado.
> 2. **Caminho modifyInvoiceForLead:** POST `/uown/los/modifyInvoiceForLead/{leadPk}` — cria um NOVO lead, cancela o original, define `LEASE_MOD_REQUESTED`. Usado para modificações pós-assinatura via GowSign (coberto por `gowsign-modify-lease-qa2.spec.ts`). NÃO coberto por este oracle.

---

## CT-01 — Modal de confirmação aparece ao clicar em "Modify Lease"

```gherkin
Dado que um lead em status SIGNED está aberto no portal Origination com viewport 1440×900
Quando o agente expande a barra de ações e clica em "Modify Lease"
Então um diálogo de confirmação aparece com o texto "Please confirm you want to modify the lease:"
E o diálogo possui um botão CANCEL e um botão "Continue" (rótulo exatamente "Continue", C maiúsculo)
E clicar em "Continue" via JS-dispatch fecha o diálogo e abre o formulário de edição da invoice
E "#numberOfItems" fica visível como sinal de prontidão do formulário de edição
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| `SELECTORS.modifyLeaseWarningContinue` visível | `.modal.show button:has-text('Continue'), [role='dialog'] button:has-text('Continue')` | `customer.page.ts:1152`; `common.selectors.ts:417-418` |
| Estilo do clique em Continue | JS-dispatch (`el.click()`) — NÃO o safe-click do Playwright; React desmonta o diálogo durante o clique | `customer.page.ts:1159` |
| Sinal de prontidão do formulário | `SELECTORS.naNumberOfItems` (`#numberOfItems`) visível com timeout de 15 s | `customer.page.ts:1169-1171` |
| Itens pré-existentes visíveis | formulário de adicionar item renderiza persistentemente no topo; NÃO é bloqueado pela exclusão de itens existentes | `customer.page.ts:1162-1165` |

---

## CT-02 — Redução de valor em SIGNED: status permanece SIGNED

```gherkin
Dado que um lead está em status SIGNED com uma invoice existente
E o approvedAmount é conhecido a partir de createPreQualifiedApplication
Quando o agente abre o Modify Lease → descarta o aviso → exclui todos os itens da invoice via deleteAllInvoiceItems()
E adiciona um novo item a 50% do approvedAmount
E clica em SAVE
Então o status interno do lead permanece "SIGNED" no portal Origination
E a invoice NÃO está cancelada (invoice_status != 'CANCELLED') em uown_los_invoice
E uown_los_lead_notes possui ao menos 1 entrada com '%SendInvoiceService%' E '%Invoice%' (Regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status na UI após reload | `customerPage.getInternalStatus()` contém "SIGNED" | `modify-lease.spec.ts:133-145` |
| `uown_los_invoice.invoice_status` | diferente de 'CANCELLED', não nulo | `modify-lease.spec.ts:148-153` |
| Atividade em `uown_los_lead_notes` (Regra #13) | `COUNT(*) >= 1` WHERE `notes LIKE '%SendInvoiceService%' AND notes LIKE '%Invoice%'` | `modify-lease.spec.ts:155-165` |

```sql
-- Validação DB CT-02 (substituir $lead_pk)
SELECT invoice_status FROM uown_los_invoice WHERE lead_pk = $lead_pk ORDER BY pk DESC LIMIT 1;

SELECT COUNT(*) FROM uown_los_lead_notes
WHERE lead_pk = $lead_pk
  AND notes LIKE '%SendInvoiceService%'
  AND notes LIKE '%Invoice%';
```

---

## CT-03 — Aumento de valor em SIGNED: status muda para CONTRACT_CREATED

```gherkin
Dado que um lead está em status SIGNED com uma invoice reduzida (50% do approvedAmount)
Quando o agente abre o Modify Lease → descarta o aviso → exclui todos os itens
E adiciona um novo item a 90% do approvedAmount (conservador para não ultrapassar o limite aprovado após impostos)
E clica em SAVE
Então o status interno do lead muda para "CONTRACT_CREATED" no portal Origination
E uown_los_lead_notes possui uma nota com 'Invoice increase' E 'CONTRACT_CREATED' (Regra #13)
E uown_los_lead_notes possui uma nota com 'Sent Contract to customer' (Regra #13)
E existe uma nova linha em uown_esign_document para este lead_pk
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status na UI após reload | `customerPage.getInternalStatus()` contém "CONTRACT_CREATED" | `modify-lease.spec.ts:280-295` |
| Nota de atividade — aumento | linha em `uown_los_lead_notes` com `notes LIKE '%Invoice increase%' AND notes LIKE '%CONTRACT_CREATED%'` | `modify-lease.spec.ts:297-309` |
| Nota de atividade — contrato enviado | linha em `uown_los_lead_notes` com `notes LIKE '%Sent Contract to customer%'` | `modify-lease.spec.ts:311-319` |
| Novo documento de assinatura | `SELECT COUNT(*) FROM uown_esign_document WHERE lead_pk = $lead_pk` >= 1 | `lead-detail-esign-modify-lease.spec.ts:74-79` |
| redirectUrl | "EsignDoc (embedded) — ver notas do DB acima" (nenhum shortCode de merchant é criado para modificações iniciadas pela UI; a URL de assinatura vai via EsignMode:EMBEDDED, NÃO pela tabela de shortCode do portal do merchant) | `modify-lease.spec.ts:320-325` |

```sql
-- Validação DB CT-03 (substituir $lead_pk)
SELECT COUNT(*) FROM uown_los_lead_notes
WHERE lead_pk = $lead_pk
  AND notes LIKE '%Invoice increase%'
  AND notes LIKE '%CONTRACT_CREATED%';

SELECT COUNT(*) FROM uown_los_lead_notes
WHERE lead_pk = $lead_pk
  AND notes LIKE '%Sent Contract to customer%';

SELECT COUNT(*) FROM uown_esign_document WHERE lead_pk = $lead_pk;
```

---

## CT-04 — Painel de Documentos exibe LEASE_MOD após aumento (CONTRACT_CREATED)

```gherkin
Dado que um lead foi transicionado para CONTRACT_CREATED via um aumento no Modify Lease (CT-03)
Quando o agente visualiza o painel Documents → Lease no portal Origination
Então getLeasePanelContracts() retorna ao menos um contrato com contractType = 'LEASE_MOD'
E o contrato LEASE_MOD possui status 'SENT' (novo contrato enviado automaticamente pelo backend)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Resultado de `getLeasePanelContracts()` | ao menos 1 item onde `contractType === 'LEASE_MOD'` | `customer.page.ts:1226-1317` |
| Status do LEASE_MOD | `status === 'SENT'` (backend enviou automaticamente ao provedor de assinatura) | `docs/knowledge-base/origination-esign-section-lead-detail.md` |
| Contrato no DOM | `<div class="...contractItem__subtitle1__...">LEASE_MOD</div>` | `customer.page.ts:1234` |
| **Ressalva sobre sandbox** | CT-04 não foi reproduzível no sandbox via MCP UI (2026-06-28, lead 97502): após aumento $800→$900 que gerou CONTRACT_CREATED, o painel Documents exibiu apenas LEASE (SENT) — LEASE_MOD não apareceu após 15 s de espera e múltiplos reloads. [OBSERVATION] — pode ser limitação de sandbox (análoga à JpaSystemException do CT-06 para FUNDING). Verificar em QA2/STG com lead fresco via `createPreQualifiedApplication({ skipPaymentInfo: true })`. | Observação live sandbox 2026-06-28 |

```typescript
// Exemplo de asserção CT-04
const contracts = await customerPage.getLeasePanelContracts();
const leaseMod = contracts.find(c => c.contractType === 'LEASE_MOD');
expect(leaseMod, 'Contrato LEASE_MOD deve existir no painel Documentos').toBeDefined();
expect(leaseMod?.status).toBe('SENT');
```

---

## CT-05 — Validação de valor mínimo: toast de erro

```gherkin
Dado que um lead está em status SIGNED com uma invoice existente
Quando o agente abre o Modify Lease → descarta o aviso → adiciona um único item a $1
E clica em SAVE
Então a mensagem do toast corresponde a /minimum|min|below|less than|invoice saved/i
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Padrão do texto do toast | corresponde a `/minimum\|min\|below\|less than\|invoice saved/i` | `modify-lease.spec.ts:486-488` |
| Ressalva sobre sandbox | o sandbox NÃO valida o valor mínimo; retorna "Invoice saved" em vez do erro de mínimo. Ambientes superiores (stg, prod) exibem "The merchandise amount requested, X, is less than the minimum lease amount, 249.9" | `modify-lease.spec.ts:476-485` |

---

## CT-06 — Modificação em FUNDING: status do lead é mantido

```gherkin
Dado que um lead está em status FUNDING (driveLeadToFunding concluído)
Quando o agente abre o Modify Lease → descarta o aviso → exclui todos os itens
E adiciona um novo item a 60% do approvedAmount
E clica em SAVE
Então o status interno do lead é FUNDING, SETTLED ou SIGNED (status mantido, NÃO revertido)
E uown_los_invoice.invoice_status é 'DELIVERED' ou 'ADDED_TO_CART'
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status na UI após reload | `internalStatus.toUpperCase()` corresponde a `/FUNDING\|SETTLED\|SIGNED/` | `modify-lease.spec.ts:565-576` |
| `uown_los_invoice.invoice_status` | 'DELIVERED' ou 'ADDED_TO_CART' | `modify-lease.spec.ts:578-590` |
| Ressalva sobre sandbox | Uma `JpaSystemException` no sandbox impede a conclusão da modificação em FUNDING; a invoice permanece DELIVERED. Isso é uma limitação do ambiente sandbox, não um bug. | `modify-lease.spec.ts:583-589` |

```sql
-- Validação DB CT-06 (substituir $lead_pk)
SELECT lead_status FROM uown_los_lead WHERE pk = $lead_pk;
SELECT invoice_status FROM uown_los_invoice WHERE lead_pk = $lead_pk ORDER BY pk DESC LIMIT 1;
```

---

## CT-07 — Modificação via API sendInvoice orderType="1"

```gherkin
Dado que um lead está em status SIGNED (via driveLeadToSigned)
Quando POST /uown/los/sendInvoice é chamado com orderType="1" e um orderTotal atualizado
Então a resposta é HTTP 200
E response.faults = false
E response.transactionStatus = "A1"
E response.authApprovalStatus = "APPROVED"
E response.paymentDetailsList possui ao menos 1 entrada (quando o lead está em SIGNED)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Status HTTP | 200 OK | `modify-lease.spec.ts:370-375` |
| `response.faults` | `false` | `docs/business-rules/08-funding-merchants.md §51.2` |
| `response.transactionStatus` | `"A1"` | `modify-lease.spec.ts:377-381` |
| `response.authApprovalStatus` | `"APPROVED"` | `docs/business-rules/08-funding-merchants.md §51.2` |
| `response.paymentDetailsList` | array com length > 0 (quando o lead está SIGNED; para modificações iniciadas pela UI não há paymentDetailsList pois nenhum shortCode é criado) | `modify-lease.spec.ts:383-388` |

---

## CT-08 — deleteAllInvoiceItems remove todos os itens existentes

```gherkin
Dado que o modal de Modify Lease está aberto com N itens de invoice existentes
Quando deleteAllInvoiceItems() é chamado
Então todas as N linhas são removidas da lista de itens do modal
E a contagem de itens cai para 0 (cada clique no ícone de lixeira é verificado com queda na contagem)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Gatilho do ícone de lixeira | `svg[data-icon="trash-can"]` via `dispatchEvent(MouseEvent)` — o handler React está no SVG, não no wrapper `#deleteActionIcon`; `.click()` no SVG é bloqueado | `customer.page.ts:904-941` |
| Limite de segurança | máximo 20 iterações para evitar loop infinito | `customer.page.ts:928` |
| Valor de retorno | número de itens excluídos | `customer.page.ts:939` |

---

## Pré-condições

- **Preflight do merchant** (regra #12): `mSetup.configureByName('TireAgent', 'lifecycle')` ou equivalente antes de qualquer teste que crie um lead.
- **`skipPaymentInfo: true`** em `createPreQualifiedApplication` ao preparar um lead para modificação pela UI. Usar `submitPaymentInfoViaApi: true` processa automaticamente a invoice ao clicar em "Continue" no modal de aviso (antes do formulário de edição abrir), causando timeout de 10 s em `continueBtn.waitFor`.
- **`uniqueAddress: true`** para evitar envenenamento por blacklist de endereço estático entre execuções.
- **Viewport**: `test.use({ viewport: { width: 1440, height: 900 } })` — obrigatório para a barra de ações.
- **Elegibilidade de status do lead**: a ação "Modify Lease" é exercida em SIGNED (CT-02, CT-03, CT-04, CT-05), CONTRACT_CREATED e FUNDING (CT-06). As regras de negócio §7.1 (`12-produto-lease-deep-dive.md`) exigem que o lead seja `isSignedOrBeyond()` para `modifyInvoiceForLead`; o caminho via UI tem a mesma pré-condição.
- **Restrição de 80 dias**: a config `num.days.past.creation.for.lease.mod` controla o prazo limite. Usuários específicos podem ignorar essa restrição via config `users.allowed.bypass.lease.mod.check` (§7.3).

## Log de Atividade (Regra #13)

Toda modificação bem-sucedida via UI Modify Lease grava ao menos uma entrada em `uown_los_lead_notes` pelo `SendInvoiceService`. Modificações de aumento gravam adicionalmente as notas "Invoice increase. Set lead to CONTRACT_CREATED" e "Sent Contract to customer". Ausência de notas = modificação não foi concluída.

O seletor de UI do card de Atividade no portal Origination (`SELECTORS.activityLogEntry`) NÃO corresponde à estrutura do DOM desta página (sem `div[role='row']` ou `tr` — confirmado em `modify-lease.spec.ts:146-156`). Use query no DB em `uown_los_lead_notes` para validação pela Regra #13.

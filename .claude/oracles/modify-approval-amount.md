---
operation: modify-approval-amount
description: Modificação do valor de aprovação (approval amount / limite de crédito de underwriting) de um lead APPROVED e sem lease assinado, via botão "Modify Approval Amount" da barra de ações do portal Origination. Cobre rejeição de valor acima do teto do merchant, alteração para valor válido, e restrição de permissão (merchant não vê o botão).
last-reviewed: 2026-07-01
last-reviewed-sha: cd2d2c8
covers:
  - tests/e2e/origination/modify-approval-amount.spec.ts
  - src/pages/origination/customer.page.ts
  - src/pages/origination/overview.page.ts
  - src/selectors/common.selectors.ts
  - docs/business-rules/02-originacao-pipeline.md
---

# Oracle BDD — Modificação do Valor de Aprovação (Modify Approval Amount)

> **Gatilho:** qualquer ação que acesse o fluxo "Modify Approval Amount" na barra de ações do portal Origination (alterar o valor de aprovação de um lead), OU qualquer verificação de que o botão "Modify Approval Amount" está oculto para o papel merchant.
>
> **Verificação de obsolescência:**
> ```bash
> git log cd2d2c8..HEAD -- \
>   tests/e2e/origination/modify-approval-amount.spec.ts \
>   src/pages/origination/customer.page.ts \
>   src/pages/origination/overview.page.ts \
>   src/selectors/common.selectors.ts \
>   docs/business-rules/02-originacao-pipeline.md
> ```
> Sem output = oracle está atual. Com output → prefixar cada CT com `[BDD MAY BE STALE]` e revalidar contra o spec/selectors antes de confiar nos checkpoints.
>
> **Viewport:** Origination é um portal interno voltado para agentes. Obrigatório **1440×900** — `d-lg-block` oculta a barra de ações abaixo de 992 px (regra #15). Os botões de ação ficam em um container `overflow-auto` horizontal (`customerSummary__accountSummary`); `clickActionButton` usa JS-dispatch (`el.click()`) após `scrollIntoView` porque botões fora da largura visível reportam `visible:true` mas ficam fora do viewport de scroll (o `click()` normal do Playwright falha com "ancestor intercepts pointer events" e o `force:true` clica em coordenada fora do container, sem disparar o handler React). Ver `customer.page.ts:94-106`.
>
> **Distinção de contexto — approval amount ≠ modify-lease (LEIA ANTES DE USAR):**
> - **Este oracle (Modify Approval Amount):** altera o **valor de aprovação / limite de crédito de underwriting** do lead — o quanto o cliente PODE financiar. Campo `#approvalAmount`. É um campo de crédito/underwriting (ver `02-originacao-pipeline.md` §"Calculate Max Approval" / §"Impact": o approval amount é limitado ao `maxApprovedAmountCR` do segmento). Impacto financeiro direto sobre o cliente → Tier-1.
> - **`modify-lease.md` (Modify Lease):** altera o **valor da invoice / do pedido** (itens comprados), NÃO o limite de crédito. O próprio frontmatter de `modify-lease.md` lista em `covers` apenas `modify-lease.spec.ts` + `lead-detail-esign-modify-lease.spec.ts` — NÃO cobre esta operação. São botões distintos na mesma barra de ações e campos distintos.
> - Não confundir: "Modify Approval Amount" (crédito) vs "Modify Lease" (invoice/pedido).

---

## CT-01 — Lead APPROVED sem lease assinado aparece no Overview com o valor de aprovação

```gherkin
Dado que um lead foi criado via sendApplication (sem sendInvoice) para um merchant com maxApprovalAmount = 5000
E o agente está logado no portal Origination com viewport 1440×900
Quando o agente localiza o lead na tabela do Overview pelo Reference #
Então a linha do lead mostra o Status contendo "approved"
E a coluna "Signed Lease" mostra "false" (quando a coluna está presente)
E a coluna "Approval Amt" mostra o valor de aprovação original (usado como base para a modificação)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Merchant preflight (regra #12) | `mSetup.configureByName('TireAgent', { maxApprovalAmount: 5000, fraudThreshold: 900 })` antes de criar o lead — o CT-02 depende do teto exato 5000 | `modify-approval-amount.spec.ts:38-40` |
| Lead localizado no Overview | `overviewPage.getRowDataByReferenceId(ctx.leadPk)` retorna linha não-nula (paginação até 20 páginas via `findFirstMatchingRow` por `Reference #`) | `modify-approval-amount.spec.ts:76-77`; `overview.page.ts:38-55` |
| Coluna Status | `rowData['Status'].toLowerCase()` contém `"approved"` | `modify-approval-amount.spec.ts:80-81` |
| Coluna Signed Lease | `rowData['Signed Lease'].toLowerCase() === "false"` (assert condicional — só quando a coluna vem preenchida) | `modify-approval-amount.spec.ts:85-89` |
| Valor de aprovação original | `rowData['Approval Amt']` com `$` e `,` removidos → `parseFloat` = base para calcular o novo valor no CT-03 | `modify-approval-amount.spec.ts:91-92` |

---

## CT-02 — [negative] Valor de aprovação acima do teto do merchant é rejeitado e não persiste

```gherkin
Dado que o lead APPROVED está aberto na página individual do cliente (customers/{leadPk}) no portal Origination
Quando o agente abre "Modify Approval Amount" e informa o valor 50000 com o comentário "Unreasonably high"
Então um toast de erro é exibido contendo exatamente "Given Approval amount is greater"
E ao retornar ao Overview a coluna "Approval Amt" do lead permanece igual ao valor de aprovação original (a rejeição não altera o crédito)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Abertura do modal | `clickActionButton('Modify Approval Amount')` → `#approvalAmount` visível em até 10 s (sinal de prontidão do formulário) | `customer.page.ts:776-780`; `common.selectors.ts:210` (`approvalAmountInput: '#approvalAmount'`) |
| Campo de comentário | preenchido via `#comment` (`SELECTORS.commentInput`) | `customer.page.ts:786-788`; `common.selectors.ts` (`commentInput: '#comment'`) |
| Botão de submit | último `.btn-primary` da página (`SELECTORS.buttonPrimary.last()`) | `customer.page.ts:793-794`; `common.selectors.ts:120` |
| Texto do toast (case-sensitive `contains`) | contém `"Given Approval amount is greater"` | `modify-approval-amount.spec.ts:113-118` |
| Não-persistência no Overview | `rowData['Approval Amt']` (sem `$`/`,`) === valor original — crédito **NÃO** alterado após rejeição | `modify-approval-amount.spec.ts:122-132` |
| Regra de negócio (teto) | o valor pedido excede o `maxApprovalAmount` do merchant (5000); o approval amount é limitado ao teto de crédito do segmento | `docs/business-rules/02-originacao-pipeline.md:184-188, 579-581` |

---

## CT-03 — [positive] Modificação para valor válido altera e persiste o valor de aprovação

```gherkin
Dado que o lead APPROVED está aberto na página individual do cliente no portal Origination
E o novo valor alvo é min(valor original, 5000) − 1 (dentro do teto do merchant)
Quando o agente abre "Modify Approval Amount" e informa o novo valor com o comentário "Acceptable change"
Então um toast de sucesso é exibido contendo exatamente "Successfully changed approval amount"
E ao retornar ao Overview a coluna "Approval Amt" do lead mostra o novo valor (persistência confirmada após navegação)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Novo valor calculado | `Math.min(originalApprovalAmountValue, 5000) − 1`; se `<= 0`, usa `Math.max(1, 5000 − 1)` | `modify-approval-amount.spec.ts:151-154` |
| Texto do toast (case-sensitive `contains`) | contém `"Successfully changed approval amount"` | `modify-approval-amount.spec.ts:158-166` |
| Persistência no Overview | após `goto(overview)` + `waitForSpinner`, `parseFloat(rowData['Approval Amt'])` === novo valor esperado — valor sobrevive à navegação (regra de persistência, [[check-points]]) | `modify-approval-amount.spec.ts:170-186` |
| Log de atividade (Regra #13) `[HYPOTHESIS]` | uma alteração de approval amount **deveria** gravar uma nota de atividade do tipo `APPROVAL_AMOUNT_CHANGE` com o comentário informado. O spec atual **NÃO** valida DB/log; grounding vem apenas do comentário do filtro de atividade em `common.selectors.ts:74` (`options: LEAD_STATUS_CHANGE / APPROVAL_AMOUNT_CHANGE / LEASE_MOD`). Valor/tabela exatos (`uown_los_lead_notes` vs `uown_los_activity_log`, padrão do texto) NÃO verificados — lacuna de cobertura a fechar em execução futura via query DB. | `common.selectors.ts:74` (grounding parcial); lacuna do spec |

---

## CT-04 — [negative] Merchant não vê o botão "Modify Approval Amount" (RBAC)

```gherkin
Dado que o agente fez logout e logou novamente como merchant
E a página individual do cliente (customers/{leadPk}) está aberta no portal Origination
Quando o merchant expande a barra de ações do resumo do cliente
Então o botão "Modify Approval Amount" NÃO está visível (a modificação de crédito é restrita ao papel agente)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Login como merchant | `loginToPortalWithOptions(page, env.originationUrl, env, 'merchant')` | `modify-approval-amount.spec.ts:194` |
| Visibilidade do botão | `isModifyApprovalAmountVisible()` → `expandActionsMenu()` + `button:has-text('Modify Approval Amount')` → `false` (botão oculto) | `modify-approval-amount.spec.ts:206-208`; `customer.page.ts:807-811` |
| **Ressalva sobre sandbox** | o assert `expect(isVisible).toBeFalsy()` **só** roda em ambientes não-sandbox (`process.env.ENV !== 'sandbox'`). O sandbox concede permissões elevadas ao merchant, então o botão pode aparecer lá sem que isso seja bug — validar RBAC em qa1/qa2/stg. | `modify-approval-amount.spec.ts:205-209` |

---

## Pré-condições

- **Merchant preflight (regra #12):** `mSetup.configureByName('TireAgent', { maxApprovalAmount: 5000, fraudThreshold: 900 })` ANTES de `sendApplication`. O teto 5000 é dependência dura do CT-02 (valor rejeitado) e do CT-03 (cap do novo valor).
- **Criação de dados fresca (regra #9):** lead criado via `buildTestData({ state:'NY', merchant:'TireAgent', orderTotal:'621', sanitizeNames:true })` + `api.application.sendApplication` — **sem `sendInvoice`** (o teste opera sobre um lead APPROVED, não sobre uma invoice). `sanitizeNames:true` evita colisão de dados entre execuções.
- **Estado do lead:** APPROVED (`Status` contém "approved") e **sem lease assinado** (`Signed Lease` = "false"). A modificação de approval amount é exercida em lead pré-assinatura.
- **Viewport:** `1440×900` obrigatório para a barra de ações (regra #15).
- **Timeout:** `test.setTimeout(300_000)` (5 min) — criação de conta via API + navegação de UI.

## Log de Atividade (Regra #13) — LACUNA CONHECIDA

O spec atual **não** valida nenhuma entrada de log/nota no DB após a mudança de approval amount. Existe um tipo de atividade `APPROVAL_AMOUNT_CHANGE` referenciado em `common.selectors.ts:74`, o que sugere que a alteração gera uma nota — mas o padrão de texto, a tabela (`uown_los_lead_notes` vs `uown_los_activity_log`) e o autor **não estão confirmados** por este spec. Marcado como `[HYPOTHESIS]` no CT-03. Fechar a lacuna em execução futura: após o toast "Successfully changed approval amount", consultar o DB pelo lead_pk e confirmar a nota de `APPROVAL_AMOUNT_CHANGE` com o comentário informado ("Acceptable change"). Ausência de log = falha de implementação, não comportamento aceitável.

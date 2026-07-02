---
operation: servicing-refund-payment
description: Reverse/Refund genérico (não-Sticky) de um pagamento no portal Servicing — modal "Reverse Payment" na Payment History (/payment-history/{accountPk}), Fully Refund e Partially Refund sobre um pagamento de cartão APPROVED. Valida uown_sv_credit_card_transaction (SALE→REFUNDED/PARTIALLY_REFUNDED + linha CREDIT), o grid CC Transactions e o activity log (uown_sv_activity_log).
last-reviewed: 2026-07-01
last-reviewed-sha: 3b8ce82
covers:
  - tests/e2e/servicing/refund-payment-servicing.spec.ts
  - src/pages/servicing/payment-history.page.ts
  - src/pages/servicing/credit-card-history.page.ts
  - src/selectors/common.selectors.ts
  - src/helpers/database.helpers.ts
  - src/helpers/api-setup.helpers.ts
  - src/api/bodies/payment-arrangement.body.ts
  - docs/business-rules/05-pagamentos.md
  - docs/knowledge-base/servicing-payment-history-page.md
---

# Oracle BDD — Refund de Pagamento Genérico no Servicing (não-Sticky)

> **Backfill retroativo (regra #19b).** O fluxo já tem um spec funcional e passante
> (`tests/e2e/servicing/refund-payment-servicing.spec.ts`), mas não existia arquivo `.claude/oracles/*`
> registrando-o como validado. Este oráculo é construído **a partir das asserções reais do spec** e dos docs
> canônicos abaixo — nenhum comportamento novo foi inventado. Categoria **volatile** (refund/CC — ver
> [[volatile-knowledge-registry]]): sempre confira a fonte primária antes de afirmar valores de fee/status.
>
> **Gatilho:** qualquer ação que abra o modal "Reverse Payment" na Payment History do Servicing
> (`/payment-history/{accountPk}` → menu History → "Payments") e execute um **Fully Refund** ou um
> **Partially Refund** sobre um pagamento de cartão (`CC_Payment`/`ACH_Payment`) — OU a execução do spec
> `refund-payment-servicing.spec.ts`, que exercita essas operações. Aplica-se também a `reverse`/`refund`
> disparados via `POST /uown/svc/refundPayment/{paymentPk}` (§53).
>
> **Verificação de obsolescência (executar antes de tudo):**
> ```bash
> git log 3b8ce82..HEAD -- \
>   tests/e2e/servicing/refund-payment-servicing.spec.ts \
>   src/pages/servicing/payment-history.page.ts \
>   src/pages/servicing/credit-card-history.page.ts \
>   src/selectors/common.selectors.ts \
>   src/helpers/database.helpers.ts \
>   src/helpers/api-setup.helpers.ts \
>   src/api/bodies/payment-arrangement.body.ts \
>   docs/business-rules/05-pagamentos.md \
>   docs/knowledge-base/servicing-payment-history-page.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Viewport:** Servicing é um portal interno voltado para agentes → **1440×900** obrigatório (regra #15).

---

## Distinção de contexto — este oráculo vs `sticky-reverse-refund.md`

Mirando a fronteira que `modify-lease.md` documenta contra `modifyInvoiceForLead`, este oráculo cobre o
caminho de refund **genérico (não-Sticky)** e o `sticky-reverse-refund.md` cobre o caminho **Sticky-específico**.
São endpoints, tabelas e regras diferentes:

1. **Refund genérico (ESTE oráculo):** pagamento comum de `CC_Payment`/`ACH_Payment` na Payment History.
   Oferece `{Reverse, Fully Refund, Partially Refund}` (partial disponível para CC/ACH). O Fully Refund de
   um CC cria uma **linha CREDIT** em `uown_sv_credit_card_transaction` (`cc_action='CREDIT'`) via
   `CCRunRefundService` no gateway — **nenhuma tabela `uown_sticky*` é tocada**. O spec
   `refund-payment-servicing.spec.ts` exercita exatamente este caminho, apenas com CC.
2. **Reverse/Refund de Sticky (`sticky-reverse-refund.md`):** linha de pagamento com `paymentType=STICKY`
   (CC recuperado pelo motor de dunning). A opção **Reverse** é ledger-only (nenhuma chamada ao Sticky) e o
   **Fully Refund** roteia server-side para a Refund API do Sticky (`uown_sticky_outbound_log`,
   `recovery_status`). Sticky é **CC-only** e **nunca** expõe "Partially Refund". Escopo brand-agnostic
   (UOWN/Kornerstone, mesmo código).

**Regra de fronteira:** se a linha de pagamento é `STICKY` → use `sticky-reverse-refund.md`. Se é
`CC_Payment`/`ACH_Payment` comum → use ESTE oráculo. A distinção Fully vs Partially Refund e o efeito
CREDIT+fee documentados aqui **não** valem para linhas Sticky (que travam no valor cheio, sem partial).

---

## Análise de impacto

| Regra | Fonte |
|---|---|
| O afordance de Reverse/Refund vive na Payment History (`/payment-history/{accountPk}`, History → "Payments"), **não** em `/payment-transaction` — a linha `PAID`/`APPROVED` carrega o ícone `svg[data-icon="arrow-rotate-left"]`. | `refund-payment-servicing.spec.ts:4-6`; `common.selectors.ts:282` — `[confirmado, comentário DOM-first svc-website-dev3 conta 141]` |
| Tipos de refund: **Full Refund** (reverte o valor integral) e **Partial Refund** (reverte parte, criando um novo registro para o remanescente). Disponível para ACH **e** CC. | `05-pagamentos.md §53` "Refund Types" + §11 "Reverse/Refund Restriction" (linhas 166-171) — `[confirmado]` |
| **CC Refund Logic:** recupera a transação CC associada → chama `CCRunRefundService` no gateway → só prossegue se o refund retornar `APPROVED` → detecta re-refund checando se o original já era `REFUNDED`/`PARTIALLY_REFUNDED`. | `05-pagamentos.md §53` "CC Refund Logic" — `[confirmado]` |
| **Fully Refund de um CC** credita **principal + a charge_fee da SALE original**: a linha SALE carrega `charge_fee` (tipicamente $1.00) e a linha CREDIT = principal + fee (ex.: $100 + $1 = $101.00). O spec lê o `charge_fee` do DB (não hardcoded) para se manter correto se a tabela de fee mudar. | `refund-payment-servicing.spec.ts:141-149` (repro fresca contas 142+143, 2026-06-01) — `[confirmado, live]` |
| **Partial Refund:** o original vira `REVERSED`/`PARTIALLY_REFUNDED` com data/timestamp de reversão + um **novo registro** é criado para o remanescente (`originalAmount - refundAmount`), herdando estratégia de alocação, data e status `PAID`. | `05-pagamentos.md §53` "Partial Refund Logic" — `[confirmado]` |
| A opção de reembolsar a fee (`refundFee`) só existe no **Fully Refund**; no Partial Refund o `refundFee` é forçado a `false`. | `05-pagamentos.md` linha 175 — `[HYPOTHESIS para o spec: o checkbox `#refundFee` NÃO é exercitado por `refund-payment-servicing.spec.ts`; regra confirmada só na fonte de negócio]` |
| **CC Refund é síncrono** (3 linhas de activity log no mesmo segundo: CREDIT, SALE→REFUNDED, "Refund CC Payment complete"); **ACH Refund é assíncrono** (cria uma nova `ACHPayment` `PENDING/REFUND`; `reverse_date` do original fica `NULL` até liquidar via sweep/Profituity). Pré-existente, não alterado por servicing#519. | `05-pagamentos.md §53` "CC Refund (Synchronous) vs ACH Refund (Asynchronous)" + `.claude/oracles/sticky-reverse-refund.md` Oracle CT-06 — `[confirmado, live 2026-06-30]` |
| A opção de Reverse Reason renderizada no DOM é **"Partially Refund"** (não "Partial Refund" do enum `ReverseReason.PARTIAL_REFUND`) — casar pelo texto real do menu. | `refund-payment-servicing.spec.ts:191-194` (verificado svc-website-dev3) — `[confirmado, live]` |
| Endpoint de backend: `POST /uown/svc/refundPayment/{paymentPk}?amount={amount}&comment={reason}`. | `05-pagamentos.md §53` "How to Trigger" — `[confirmado]` (o spec dispara via UI, não captura a chamada diretamente) |
| Toda ação de refund grava entrada(s) no activity log da conta (regra #13), em `uown_sv_activity_log` (`account_pk`, `notes`) — o spec valida via `getActivityLogsByAccount(accountPk, 'refund')`. | `refund-payment-servicing.spec.ts:173-177, 245-249`; `database.helpers.ts:840-858` — `[confirmado]` |

## Critérios de Aceitação

| ID | Critério | Testável? |
|---|---|---|
| AC-01 | Um Fully Refund sobre um pagamento CC APPROVED vira o original para `REFUNDED` e cria uma linha `CREDIT` de principal + charge_fee | Sim |
| AC-02 | O grid CC Transactions renderiza o original como `REFUNDED` e a linha CREDIT com `cc_action=CREDIT` e o valor correto (principal + fee) | Sim |
| AC-03 | Um Partial Refund de $40 sobre um pagamento de $100 vira o original para `PARTIALLY_REFUNDED`/`REVERSED` e cria uma linha `CREDIT` que cobre ao menos o valor solicitado | Sim |
| AC-04 | O grid CC Transactions renderiza o original como `PARTIALLY_REFUNDED`/`REVERSED` e a linha CREDIT com o valor persistido no DB | Sim |
| AC-05 | O submit do Reverse/Refund retorna um toast sem "error" | Sim |
| AC-06 | Cada ação de refund (full e partial) grava ao menos uma entrada de activity log na conta (regra #13) | Sim (presença + termo "refund") |

## Cenários

> A numeração CT corresponde aos dois cenários do spec. Gherkin em prosa portuguesa (keywords Dado/Quando/Então/E),
> espelhando `modify-lease.md`.

---

## CT-01 — Fully Refund de um pagamento CC integral

```gherkin
Dado que uma conta ACTIVE (lead → FUNDING) possui exatamente 1 pagamento de cartão APPROVED de $100 (cc_action='SALE'), criado via makeCreditCardPayments com data de postagem = hoje
E o agente está autenticado no Servicing (perfil "manager") na Payment History dessa conta, com viewport 1440×900
Quando o agente abre o modal Reverse Payment na linha de $100
E seleciona a reason "Fully Refund", digita um comentário e clica em SAVE
Então o toast exibido não contém a palavra "error"
E a transação SALE original em uown_sv_credit_card_transaction fica com status "REFUNDED"
E uma nova linha com cc_action='CREDIT' é criada com amount = principal + charge_fee da SALE original (tipicamente $100 + $1 = $101.00)
E no grid CC Transactions a linha original mostra "REFUNDED" (coluna Status, índice 8) e a linha CREDIT mostra "CREDIT" (coluna CC Action, índice 12) com Captured Amount (índice 2) = $101.00
E existe ao menos 1 entrada de activity log da conta cujo texto contém "refund" (regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Abrir modal Reverse | ícone `svg[data-icon="arrow-rotate-left"]` na linha `$100` abre o modal `.modal-content` | `payment-history.page.ts:54-79` (`openReverseForPaymentByAmount`); `common.selectors.ts:282` |
| Seleção da reason | menu React-Select `.modal-content #reverseReason` → opção `[role="option"]` com texto **"Fully Refund"** | `payment-history.page.ts:85-89` (`setReverseReason`); `common.selectors.ts:286-287` |
| Toast de submit | `toast.toLowerCase()` **não** contém `"error"` | `refund-payment-servicing.spec.ts:120-122` |
| `uown_sv_credit_card_transaction` — SALE original | `status = 'REFUNDED'` (linha lida por `getCcTransactionByPk(paymentTxPk)`) | `refund-payment-servicing.spec.ts:128-130`; `database.helpers.ts:1015` |
| `uown_sv_credit_card_transaction` — linha CREDIT | 1 linha `cc_action='CREDIT'`, `amount ≈ principal + charge_fee` (fee lido do DB da SALE; live típico $1.00 → **$101.00**) | `refund-payment-servicing.spec.ts:132-149` |
| Grid CC Transactions — original | `getRowStatus(paymentTxPk)` (célula índice 8) contém `"REFUNDED"` | `refund-payment-servicing.spec.ts:161-163`; `credit-card-history.page.ts:107-114` |
| Grid CC Transactions — CREDIT | `getRowCellText(creditTxPk, 12)` contém `"CREDIT"`; `getRowAmount(creditTxPk)` (célula índice 2) contém `"101.00"` (= `expectedCreditAmount.toFixed(2)`) | `refund-payment-servicing.spec.ts:166-170`; `credit-card-history.page.ts:121-125, 157-161` |
| Activity log (regra #13) | `getActivityLogsByAccount(accountPk, 'refund')` → `length > 0` (query `uown_sv_activity_log WHERE account_pk=$1 AND LOWER(notes) LIKE '%refund%'`) | `refund-payment-servicing.spec.ts:173-177`; `database.helpers.ts:840-858` |
| Conteúdo do log (contexto) | CC full refund síncrono → linha `"Refund CC Payment complete. Status REFUNDED, Amount 100.00, refundFee ..., Remaining amount 0.00"` no mesmo segundo da CREDIT e da transição SALE→REFUNDED | `05-pagamentos.md §53` + `.claude/oracles/sticky-reverse-refund.md` CT-06 — `[cross-ref, não asserido pelo spec além da presença de "refund"]` |

```sql
-- Validação DB CT-01 (substituir $account_pk / $payment_tx_pk)
SELECT status FROM uown_sv_credit_card_transaction WHERE pk = $payment_tx_pk;              -- => REFUNDED
SELECT pk, amount, cc_action FROM uown_sv_credit_card_transaction
  WHERE account_pk = $account_pk AND cc_action = 'CREDIT' ORDER BY pk DESC LIMIT 1;         -- => 1 linha, amount = principal + charge_fee
SELECT COUNT(*) FROM uown_sv_activity_log
  WHERE account_pk = $account_pk AND LOWER(notes) LIKE '%refund%';                          -- => >= 1
```

---

## CT-02 — Partial Refund de $40 sobre um pagamento de $100

```gherkin
Dado que uma conta ACTIVE possui exatamente 1 pagamento de cartão APPROVED de $100 (cc_action='SALE')
E o agente está autenticado no Servicing (perfil "manager") na Payment History dessa conta, com viewport 1440×900
Quando o agente abre o modal Reverse Payment na linha de $100
E seleciona a reason "Partially Refund", digita o valor 40, digita um comentário e clica em SAVE
Então o toast exibido não contém a palavra "error"
E a transação original em uown_sv_credit_card_transaction fica com status "PARTIALLY_REFUNDED" ou "REVERSED"
E uma nova linha com cc_action='CREDIT' é criada com amount >= 40 (o backend pode acrescentar fee)
E no grid CC Transactions a linha original mostra "PARTIALLY_REFUNDED" ou "REVERSED" (coluna Status, índice 8) e a linha CREDIT mostra "CREDIT" (índice 12) com o mesmo valor persistido no DB (índice 2)
E existe ao menos 1 entrada de activity log da conta cujo texto contém "refund" (regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Seleção da reason | opção `[role="option"]` com texto **"Partially Refund"** (texto real do DOM; **não** "Partial Refund" do enum) | `refund-payment-servicing.spec.ts:191-194`; `payment-history.page.ts:85-89` |
| Campo de valor parcial | `.modal-content #paymentAmount` fica visível após escolher "Partially Refund" → preenchido com `40` | `refund-payment-servicing.spec.ts:195`; `payment-history.page.ts:92-96`; `common.selectors.ts:290` |
| Toast de submit | `toast.toLowerCase()` **não** contém `"error"` | `refund-payment-servicing.spec.ts:198-200` |
| `uown_sv_credit_card_transaction` — original | `status ∈ {'PARTIALLY_REFUNDED', 'REVERSED'}` | `refund-payment-servicing.spec.ts:206-208` |
| `uown_sv_credit_card_transaction` — linha CREDIT | 1 linha `cc_action='CREDIT'`, `amount >= 40` (valor solicitado; backend pode somar fee) | `refund-payment-servicing.spec.ts:210-224` |
| Grid CC Transactions — original | `getRowStatus(paymentTxPk)` (índice 8) contém `"PARTIALLY_REFUNDED"` **ou** `"REVERSED"` | `refund-payment-servicing.spec.ts:233-235`; `credit-card-history.page.ts:107-114` |
| Grid CC Transactions — CREDIT | `getRowCellText(creditTxPk, 12)` contém `"CREDIT"`; `getRowAmount(creditTxPk)` (índice 2) contém o **mesmo valor persistido no DB** (`dbCreditAmount.toFixed(2)`) | `refund-payment-servicing.spec.ts:237-242`; `credit-card-history.page.ts:121-125, 157-161` |
| Novo registro do remanescente | `05-pagamentos.md §53` prevê um novo `PAID` para `originalAmount - refundAmount` — **não asserido diretamente** pelo spec (que valida a linha CREDIT), citado como comportamento de produto | `05-pagamentos.md §53` "Partial Refund Logic" — `[cross-ref]` |
| Activity log (regra #13) | `getActivityLogsByAccount(accountPk, 'refund')` → `length > 0` | `refund-payment-servicing.spec.ts:245-249`; `database.helpers.ts:840-858` |

```sql
-- Validação DB CT-02 (substituir $account_pk / $payment_tx_pk)
SELECT status FROM uown_sv_credit_card_transaction WHERE pk = $payment_tx_pk;              -- => PARTIALLY_REFUNDED | REVERSED
SELECT pk, amount, cc_action FROM uown_sv_credit_card_transaction
  WHERE account_pk = $account_pk AND cc_action = 'CREDIT' ORDER BY pk DESC LIMIT 1;         -- => 1 linha, amount >= 40
SELECT COUNT(*) FROM uown_sv_activity_log
  WHERE account_pk = $account_pk AND LOWER(notes) LIKE '%refund%';                          -- => >= 1
```

---

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) que cobre(m) | Status |
|---|---|---|
| AC-01 | CT-01 (SALE→REFUNDED + CREDIT principal+fee) | Coberto |
| AC-02 | CT-01 (grid: REFUNDED + CREDIT $101.00) | Coberto |
| AC-03 | CT-02 (original PARTIALLY_REFUNDED/REVERSED + CREDIT ≥ $40) | Coberto |
| AC-04 | CT-02 (grid: PARTIALLY_REFUNDED/REVERSED + CREDIT = valor do DB) | Coberto |
| AC-05 | CT-01 / CT-02 (toast sem "error") | Coberto |
| AC-06 | CT-01 / CT-02 (activity log com "refund") | Coberto |

## Pré-condições

- **Preflight do merchant** (regra #12): o spec usa `createPreQualifiedApplication(..., { submitPaymentInfoViaApi: true })`, que chama `ensureMerchantReady` automaticamente. Merchant/estado do spec: **TerraceFinance / NY**, `orderTotal='800'`.
- **Lead → FUNDING** via `driveLeadToFunding` (conta `uown_sv_account` ACTIVE); `db.waitForAccountByLeadPk` resolve o `accountPk`.
- **Pagamento base:** 1 CC APPROVED de $100 via `buildCcArrangementBody` + `makeCreditCardPayments`, com `date = calculateDateISO(0)` (postagem hoje → executa síncrono → APPROVED). Cartão `TEST_CARDS.VISA_APPROVED` (o spec usa VISA neste fluxo de Servicing — ver nota de dados abaixo). O beforeEach confirma no DB `status='APPROVED' AND cc_action='SALE' AND amount≈100` antes de qualquer refund.
- **Ambiente de referência do spec:** `ENV=dev3` (cabeçalho do arquivo). Dados frescos por teste (regra #9); `describe.configure({ mode: 'serial' })` porque os dois cenários compartilham a mesma conta criada no beforeEach.
- **Viewport:** 1440×900 (portal interno, regra #15).

## Log de Atividade (Regra #13)

Todo Fully/Partial Refund grava ao menos uma entrada em `uown_sv_activity_log` (`account_pk`, `notes`)
recuperável por `getActivityLogsByAccount(accountPk, 'refund')`. Para o CC Fully Refund (síncrono), o
conteúdo esperado inclui `"Refund CC Payment complete. Status REFUNDED, Amount {valor}, refundFee {bool},
Remaining amount 0.00"` (fonte: `05-pagamentos.md §53` + `sticky-reverse-refund.md` CT-06) — o spec valida
a **presença** via o termo `refund`, não o texto integral. Ausência de log = ação não concluída (não
marcar como PASS).

## Pendências / Itens não verificados por este spec

1. **Checkbox `#refundFee` (Fully Refund):** a regra "`refundFee` só existe no full refund; no partial é
   forçado a `false`" (`05-pagamentos.md` linha 175) **não é exercitada** por `refund-payment-servicing.spec.ts`
   — `[HYPOTHESIS]` do ponto de vista do spec. Selector já existe (`common.selectors.ts:291`,
   `reverseRefundFeeCheckbox`). Um CT dedicado ao contraste de controles (fee shown/hidden) exigiria captura
   ao vivo — ver `sticky-reverse-refund.md` CT-05 para o padrão análogo.
2. **Chamada de rede `POST /uown/svc/refundPayment`:** o spec dispara via UI e valida o efeito no DB/grid,
   **não captura o payload/endpoint** diretamente. Endpoint e forma (`?amount=&comment=`) vêm de
   `05-pagamentos.md §53` — `[confirmado na fonte de negócio, não no spec]`.
3. **Novo registro `PAID` do remanescente (Partial Refund):** `05-pagamentos.md §53` prevê a criação de um
   novo `PAID` para `originalAmount - refundAmount`; o spec valida a linha CREDIT, não o registro do
   remanescente — `[cross-ref, não asserido]`.
4. **Refund de ACH (assíncrono):** este oráculo e o spec cobrem apenas **CC**. O refund de ACH cria uma nova
   `ACHPayment` `PENDING/REFUND` e é assíncrono (`05-pagamentos.md §53`); a cobertura genérica ACH-refund
   live está em `sticky-reverse-refund.md` CT-06 (regressão não-Sticky). Um CT ACH dedicado neste fluxo
   ainda não existe.

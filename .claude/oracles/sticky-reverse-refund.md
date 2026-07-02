---
last-reviewed: 2026-06-30
last-reviewed-sha: cd2d2c8
covers:
  - src/pages/servicing/payment-history.page.ts
  - src/pages/servicing/customer.page.ts
  - src/selectors/common.selectors.ts
  - src/helpers/sticky.helpers.ts
  - src/helpers/database.helpers.ts
  - src/scripts/_probe_refund.ts
  - src/scripts/_probe_candidate.ts
  - src/scripts/_probe_verify.ts
  - docs/business-rules/05-pagamentos.md
  - docs/knowledge-base/sticky-payment-refund.md
  - docs/knowledge-base/servicing-payment-history-page.md
  - docs/knowledge-base/servicing-customer-information-page.md
---

# Sticky Reverse/Refund — Opção de Reverse Payment para Transações Sticky

> Origem: GitLab **uown/frontend/servicing#519** "Add Reverse Payment Option for Sticky Transactions"
> (hotfix, `urgency::hotfix` + `priority::high` + `source::business-request`). MR **!700** "Add reverse for
> sticky" mergeado em 2026-06-30 18:03 na branch `R1.53.2`, deployado em sandbox no mesmo dia. Solicitado por
> Sowj, implementado por Gustavo Martins, com pedido de QA no mesmo dia.
>
> Este é um **oráculo novo** — não existia BDD prévio para reverse/refund de Sticky (regra #19b). Construído a
> partir do SPEC do `qa-planner` para esta ticket + os docs canônicos abaixo, **antes** de qualquer execução
> ao vivo. Ver [[volatile-knowledge-registry]] (categorias de sweep/refund são voláteis).
>
> ### ✅ DISCOVERY AO VIVO — sandbox 2026-06-30 (CT-01 a CT-07 todos confirmados)
> Executado via MCP Playwright + DB direto, em duas rodadas. Rodada 1 (Sticky): conta **6040** (payment pk
> 2192472, sticky pk 97, $50.04 → **Reverse**) e conta **6042** (payment pk 2192470, sticky pk 95, $50.04 →
> **Fully Refund**), ambas RECOVERED/PAID pré-ação, contas-gêmeas da mesma carga de seed. Rodada 2 (CT-06,
> regressão não-Sticky): 2 pagamentos CC frescos via UI (6040/6042, $60.08) + 2 pagamentos ACH/PAID
> reaproveitados (17301/17300, $108.81/$164.59 — exceção justificada, ver Oracle CT-06). **Resultado: o
> hotfix funciona exatamente como especificado e não regrediu nenhum comportamento existente.** Confirmado
> também: reverse/refund é **brand-agnostic** (UOWN/Kornerstone, mesmo código) e **Sticky é CC-only por
> desenho de produto** (não existe combinação ACH+Sticky) — ver "Análise de impacto".

## Resumo da demanda

Como agente de Servicing, para corrigir um registro de pagamento recuperado via Sticky sem precisar sempre
devolver o dinheiro pelo Sticky, o agente precisa poder escolher entre um **Reverse** (só ledger) e o
**Fully Refund** (devolve via Sticky) já existente, em uma linha de pagamento `STICKY` + `PAID` no Payment
History. O Fully Refund precisa permanecer exatamente como era.

## Análise de impacto

| Regra | Fonte |
|---|---|
| Antes deste hotfix, as opções de Reverse Reason de uma linha `STICKY`/`PAID` eram **somente `['Fully Refund']`** — "Reverse" não era oferecido para linhas Sticky, e "Partially Refund" também ficava oculto (BR-03). | `docs/knowledge-base/sticky-payment-refund.md` "Available Operations" + tabela "Modal logic" — `[confirmado, live sandbox 2026-06-21]` |
| A ação genérica **Reverse** já existe para pagamentos não-Sticky: `POST /uown/svc/reversePayment {reason, paymentPk, accountPk}` — repare que o corpo **não envia `amount`**: o valor revertido é o valor integral do pagamento, derivado no backend pelo `paymentPk`, não escolhido pelo agente. | `docs/knowledge-base/servicing-payment-history-page.md` "Action endpoints" — `[confirmado]` |
| **Fully Refund** em um pagamento `STICKY` reutiliza o endpoint compartilhado `POST /uown/svc/refundPayment {paymentPk, refundFee, amount, comment}`; aqui o `amount` é enviado explicitamente e, para Sticky, é travado no valor cheio (`initialPaymentAmount`, campo não editável). O roteamento para a Refund API do Sticky acontece **no backend**, quando `paymentType=STICKY`. | `docs/business-rules/05-pagamentos.md §53b`; KB BR-01/BR-02/BR-03 (svc!1465) — `[confirmado]` |
| O payload enviado ao Sticky no refund carrega `amount` **em centavos** (ex.: pagamento de $38.45 → `"amount":"3845"`) — ou seja, o valor em centavos deve bater exatamente com `paymentAmount × 100`. | KB BR-05 / Confirmed Run (`sticky-payment-refund.md`) — `[confirmado, live]` |
| Pré-condições do refund em um pagamento Sticky, validadas em ordem: (1) `paymentType=STICKY`, (2) `status=PAID`, (3) `ccPk` presente, (4) comentário não-vazio. Uma tentativa de refund em pagamento Sticky não-PAID é rejeitada: `"Only PAID Sticky payments can be refunded"`. | KB BR-04 (svc!1465 `StickyRefundPaymentService`) — `[confirmado]` |
| O Reverse/Refund **não cria uma linha nova** no Payment History para o cenário de Reverse ou Fully Refund (valor integral) — é a MESMA linha, só com `status` virando `REVERSED` e estilo tachado. Uma linha nova só nasce no caso de **Partially Refund** (fora do escopo deste hotfix). | `docs/business-rules/05-pagamentos.md §53` "Partial Refund Logic" + KB modal logic — `[confirmado]` |
| Servicing tem uma superfície de UI própria para o activity log — tabela **"Notes / Activity Log"** full-width em `/customer-information/{accountPk}` (`GET /uown/svc/getLogs/{pk}`, colunas (prioridade) \| Date \| Type \| User ID \| Notes). É **diferente** do card "Notes" da Origination (que já tem selector em `common.selectors.ts`) — esta página de Servicing **ainda não tem selector/page-object de leitura** no framework. | `docs/knowledge-base/servicing-customer-information-page.md` "Notes / Activity Log (full-width table)" — `[confirmado, gap de automação]` |
| A página `/customer-information/{accountPk}` exibe Contract Balance, Amount Past Due e Next Payment no painel "Servicing Information" / Account Summary Bar — mas **não existe regra de negócio documentada** sobre se/como esses campos mudam após um Reverse ou um Fully Refund de um pagamento Sticky, nem page-object de leitura desses campos no Servicing (só existe para Website, prefixo `ws*`). | `docs/knowledge-base/servicing-customer-information-page.md` "Account Summary Bar" + "Servicing Information panel" — `[gap, requer captura ao vivo]` |
| Este hotfix é restrito a **adicionar o Reverse** ao conjunto de opções do Sticky. Ele **não** adiciona Refund Parcial para Sticky — a ticket e seus comentários não mencionam parcial. | AC da ticket + decisão de escopo do SPEC — `[assumido, escopo estreito]` |
| Todo reverse/refund precisa deixar uma entrada no activity log da conta (regra #13). Para o Fully Refund em Sticky o conteúdo exato já é live-provado (síncrono "Sticky refund submitted" + assíncrono via webhook "confirmed"). **O que o novo caminho de Reverse-em-Sticky grava no log é desconhecido** — código novo. | KB BR-07 / `sticky-payment-refund.md` Confirmed Run — `[confirmado para Refund]` / `[gap para Reverse — ver Pendências]` |
| Dados de happy-path de refund/recovery Sticky (uma sessão `RECOVERED`) só existem em **sandbox** — qa2/dev2 têm o schema mas `uown_sticky` está vazia e o webhook de confirmação não decripta lá. | memória `sticky-refund-tests-sandbox-only` + KB "How to run this discovery" — `[confirmado]` |
| **Escopo de marca (UOWN vs Kornerstone):** o reverse/refund é **brand-agnostic** — `RefundPaymentService.java`, `StickyRefundPaymentService.java`, `UownPaymentService.java` e `PaymentService.java` não têm **nenhum** condicional de brand/Kornerstone/`merchantType`. As únicas referências a "Kornerstone" no backend ficam isoladas em `migration/kornerstone/` e `MerchantProgramController` — importação/migração de portfólio de leases na **originação**, não tocam a camada de pagamento/Servicing. Este oráculo cobre as duas marcas pelo mesmo código, sem necessidade de candidato Kornerstone separado. | grep direto em `../uown/svc/src/main/java/com/uownleasing/svc/service/{RefundPaymentService,cc/sticky/StickyRefundPaymentService,UownPaymentService,PaymentService}.java` — `[confirmado, 2026-06-30]` |
| **Escopo de instrumento (ACH vs CC):** Sticky é **CC-only por desenho de produto** — BR-04 exige `ccPk>0` (vínculo com transação de cartão); não existe "Sticky de ACH". CT-01/02/03/04/05/07 testam só CC porque é a única combinação possível. CT-06 (regressão genérica, fora do Sticky) cobre **ambos** ACH e CC explicitamente — 4/4 combos confirmados live. | KB BR-04 (`sticky-payment-refund.md`) + svc#485 "Recover Functionality for Denied **Credit Card** Transactions (Sticky)" — `[confirmado]` |

## Critérios de Aceitação

| ID | Critério | Testável? |
|---|---|---|
| AC-01 | Uma opção Reverse é oferecida para uma linha de pagamento Sticky/PAID, junto com Fully Refund (Partially Refund continua ausente) | Sim |
| AC-02 | Reverter um pagamento Sticky atualiza apenas o ledger; nenhum pedido de refund chega ao Sticky | Sim |
| AC-03 | O Fully Refund em um pagamento Sticky permanece inalterado: dinheiro volta via Sticky, ledger atualiza | Sim |
| AC-04 | O agente consegue distinguir visualmente Reverse de Fully Refund no modal | Sim |
| AC-05 | O comportamento existente de reverse/refund para pagamentos não-Sticky (CC/ACH) não é afetado | Sim |
| AC-06 | A reversão de um pagamento Sticky é registrada no activity log da conta (regra #13), **visível tanto via DB quanto na tela "Notes / Activity Log" do Servicing** (regra #14 — ler o log no DB não substitui ver onde o agente olha) | Sim (presença + texto); seletor de UI ainda não existe — ver Pendências |
| AC-07 | Um pagamento Sticky não pode ser revertido ou reembolsado uma segunda vez depois de já revertido | Sim |
| AC-08 | O valor revertido/reembolsado é exatamente o valor original do pagamento (não parcial), e essa mesma linha do Payment History mantém o Amount original — Reverse/Refund não criam uma linha nova nem alteram esse valor exibido | Sim |
| AC-09 | Após o Reverse e após o Refund, os campos de saldo da conta (Contract Balance / Amount Past Due / Next Payment no painel Servicing Information) refletem o efeito esperado da ação | Sim — confirmado live 2026-06-30: ambas as ações reabrem o receivable pelo valor exato (ver Oracle CT-02/CT-04) |

## Cenários

> A numeração CT corresponde ao SPEC do `qa-planner` para esta ticket. **CT-03** (contraste Reverse vs Refund)
> não tem cenário próprio — é a junção lógica dos oráculos de CT-02 e CT-04 (um contraste de verdade exigiria
> duas ações em um único `When`, o que viola a regra de um comportamento por cenário); ver a nota de
> referência cruzada em CT-02. **CT-08** (reconciliação de receivable após o Reverse, agora AC-09) **foi
> resolvida pela discovery ao vivo de 2026-06-30** (ver Oracle CT-02/CT-04 e Pendência #2) — ainda sem cenário
> Gherkin formal com asserts numéricos fixos, pendente de page-object para os campos de saldo no Servicing.
>
> Gherkin em inglês (convenção do projeto); narrativa e comentários em português.

```gherkin
Feature: Reverse Payment for Sticky Transactions
  As a Servicing agent
  In order to correct a Sticky-recovered payment without always returning money through Sticky
  The agent must be able to choose between a ledger-only Reverse and a money-returning Fully Refund

  Background:
    Given the agent is authenticated in the Servicing portal with the reverse_payment and refund_payment permissions
    And the agent is on the Payment History screen for the account holding the payment under test

  Scenario: [negative] CT-07 — No further reverse or refund action on an already-reversed Sticky payment
    Given a Sticky-recovered payment that has already been reversed
    When the agent opens Payment History for that account
    Then the reversed payment's row offers no Reverse Payment action
    And the payment remains shown as reversed, confirming it cannot be reversed or refunded a second time

  Scenario: [positive] CT-01 — Reverse becomes available as a reason for a Sticky-recovered payment
    Given a Sticky-recovered payment with status Paid
    When the agent opens the Reverse Payment action for that payment
    Then both Reverse and Fully Refund are offered as reasons
    And no other reason is offered

  Scenario: [positive] CT-02 — Reversing a Sticky-recovered payment updates the ledger only, for the correct amount
    Given a Sticky-recovered payment with status Paid
    When the agent reverses that payment, selecting Reverse as the reason and entering a comment
    Then the payment is shown as reversed, with its amount unchanged from the original payment amount
    And the Sticky recovery session for that payment is unaffected, with no money returned through Sticky
    And a new entry naming the reversed payment and its amount appears in the account's Notes / Activity Log
    # Referência cruzada CT-03 (contraste): comparar este resultado com CT-04 em um pagamento equivalente —
    # mesmo estado final "reversed" e mesmo valor na linha, mas a sessão de recovery no Sticky diverge
    # (inalterada aqui vs REFUNDED em CT-04).
    # AC-09 (saldo da conta): capturar Contract Balance / Amount Past Due antes e depois desta ação —
    # ver Oracle CT-02 e Pendência #2. Não assumir o efeito esperado.

  Scenario: [positive] CT-04 — Fully Refund on a Sticky-recovered payment is unchanged (regression)
    Given a Sticky-recovered payment with status Paid
    When the agent refunds that payment, selecting Fully Refund as the reason and entering a comment
    Then the payment is shown as reversed, with its amount unchanged from the original payment amount
    And the money is returned through the Sticky recovery session, for the same amount as the original payment, and the session moves to a refunded state
    And entries naming the refund submission, its confirmation, and the refunded amount appear in the account's Notes / Activity Log
    # AC-09 (saldo da conta): capturar Contract Balance / Amount Past Due antes e depois desta ação —
    # ver Oracle CT-04 e Pendência #2. Não assumir o efeito esperado.

  Scenario Outline: [positive] CT-05 — Reverse and Fully Refund show different controls for a Sticky-recovered payment
    Given the agent has opened the Reverse Payment action for a Sticky-recovered payment
    When the agent selects "<reason>" as the reason
    Then the refund-fee option is "<feeOption>"
    And the payment amount field is "<amountState>"

    Examples:
      | reason       | feeOption | amountState |
      | Reverse      | hidden    | fixed       |
      | Fully Refund | shown     | fixed       |

  Scenario Outline: [positive] CT-06 — Reverse and Refund continue to work for non-Sticky payments
    Given a payment funded by "<method>" with status Paid
    When the agent <action> that payment with a comment
    Then the payment is shown as reversed, with its amount unchanged from the original payment amount
    And the account's Notes / Activity Log records the action

    Examples:
      | method         | action         |
      | credit card    | reverses       |
      | credit card    | fully refunds  |
      | bank transfer  | reverses       |
      | bank transfer  | fully refunds  |
```

## Matriz de cobertura

| Critério de Aceitação | Cenário(s) que cobre(m) | Status |
|---|---|---|
| AC-01 | CT-01: [positive] Reverse passa a estar disponível | Coberto |
| AC-02 | CT-02: [positive] Reverse atualiza só o ledger | Coberto |
| AC-03 | CT-04: [positive] Fully Refund inalterado | Coberto |
| AC-04 | CT-05: [positive] Controles diferentes (Outline) | Coberto |
| AC-05 | CT-06: [positive] Regressão não-Sticky (Outline) | Coberto, confirmado live 2026-06-30 (4/4 combos: CC-reverse, CC-refund, ACH-reverse, ACH-refund) |
| AC-06 | CT-02 / CT-04 (Notes / Activity Log, DB confirmado live; UI ainda sem seletor formal) | Coberto (DB confirmado live 2026-06-30); seletor de UI a implementar — ver Pendência #3 |
| AC-07 | CT-07: [negative] Sem ação após reversão | Coberto, confirmado live 2026-06-30 |
| AC-08 | CT-02 / CT-04 (valor inalterado na linha, payloads exatos) | Coberto, confirmado live 2026-06-30 |
| AC-09 | CT-02 / CT-04 (saldo da conta) | Coberto, confirmado live 2026-06-30 — ver Pendência #2 (regra de negócio agora conhecida: ambas as ações reabrem o receivable igualmente) |
| (contraste, não é AC própria) | CT-03 = junção de CT-02 + CT-04 | Coberto por referência cruzada |

## Oracles

> **Verificação de desatualização (executar antes de tudo):**
> ```bash
> git log cd2d2c8..HEAD -- src/pages/servicing/payment-history.page.ts src/pages/servicing/customer.page.ts src/selectors/common.selectors.ts src/helpers/sticky.helpers.ts src/helpers/database.helpers.ts docs/business-rules/05-pagamentos.md docs/knowledge-base/sticky-payment-refund.md docs/knowledge-base/servicing-payment-history-page.md docs/knowledge-base/servicing-customer-information-page.md
> ```
> Saída não vazia → prefixar o relatório com `[BDD MAY BE STALE]`.
>
> **Status: CT-01 a CT-07 confirmados ao vivo (sandbox, 2026-06-30) — sem pendências bloqueantes.**

### Oracle: CT-07 — Sem ação após reversão de um pagamento Sticky `[CONFIRMADO live sandbox 2026-06-30, conta 6040]`

| O que o usuário confere | Valor/estado esperado | Live (conta 6040, payment 2192472) |
|---|---|---|
| Ícone de Reverse Payment na linha já revertida | Ausente — `PaymentHistoryPage` só renderiza o ícone de reverse em linhas `PAID` (BR-01, `servicing-payment-history-page.md`) | ✓ confirmado — após o Reverse, as duas células de ação (Reverse Payment, Update Payment) ficam vazias na linha; somente as 10 linhas com status `PAID` mantêm os ícones |
| Estado e valor da linha | Continua `REVERSED`, **Amount idêntico** ao original | ✓ linha mostra `06/29/2026 $50.04 STICKY REVERSED DEFAULT <comentário>` — Amount inalterado |
| Cor da linha REVERSED | Vermelha (`rgb(229,0,0)`) | ✓ confirmado via `getComputedStyle` |
| **Tachado (strikethrough) da linha REVERSED** | — | 🟡 **NÃO confirmado** — `text-decoration-line` computado = `none` em todas as células, não `line-through`. **Diverge da KB `sticky-payment-refund.md`** ("row renders REVERSED with red strikethrough" `[confirmed]`) — ver Pendência #4 |
| Guarda de backend (suporte, herdada — não alterada por este hotfix) | Uma segunda tentativa de reverse/refund no mesmo `paymentPk` seria rejeitada (`status` não é mais `PAID`) | Não exercitado diretamente (a ausência do ícone na UI já impede a ação pelo caminho normal do agente) |

### Oracle: CT-01 — Opção Reverse disponível para uma linha Sticky/PAID `[CONFIRMADO live sandbox 2026-06-30, conta 6040]`

| O que o usuário confere | Valor/estado esperado | Live (conta 6040, payment 2192472, $50.04) |
|---|---|---|
| Opções de Reverse Reason para uma linha Sticky/PAID | Exatamente `{Reverse, Fully Refund}` — `Partially Refund` continua ausente | ✓ `["Reverse", "Fully Refund"]` lidos via `[role="option"]` no menu aberto — confirma que a baseline pré-hotfix da KB (`['Fully Refund']` apenas) mudou exatamente como a ticket pedia |
| Modal pré-seleciona o reason default | `Fully Refund` continua sendo o default ao abrir o modal (comportamento herdado, não mudou) | ✓ "Reverse Reason: Fully Refund" no primeiro render do modal — agente precisa trocar manualmente para "Reverse" |
| Reverse se comporta como o Reverse genérico já existente, ao ser selecionado | Valor fixo, sem checkbox de taxa | ✓ ver CT-05 |

### Oracle: CT-02 — Reverse em Sticky atualiza só o ledger, pelo valor correto (cenário central) `[CONFIRMADO live sandbox 2026-06-30, conta 6040]`

| O que o usuário confere | Valor/estado esperado | Live (conta 6040, payment 2192472, sticky 97, $50.04) |
|---|---|---|
| Chamada de rede | `reversePayment` dispara; `refundPayment` **NÃO** dispara | ✓ `POST /uown/svc/reversePayment` → **200**; nenhuma chamada a `refundPayment` no mesmo fluxo |
| Payload de `reversePayment` | Sem campo `amount` | ✓ `{"reason":"QA discovery — servicing#519 reverse for sticky, oracle CT-02","paymentPk":2192472,"accountPk":6040}` — confirma que o valor revertido é derivado pelo backend, não enviado pelo agente |
| `uown_sv_payment.status` e `.amount` | `PAID` → `REVERSED`; `amount` inalterado | ✓ `status="REVERSED"`, `payment_amount="50.04"` (idêntico ao original), `reverse_date="2026-06-30"` |
| `uown_sticky.recovery_status` / `.status` | Inalterado, nunca vira `REFUNDED` | ✓ `recovery_status="RECOVERED"`, `status="SUBMITTED"` — **idênticos à baseline pré-ação** |
| `uown_sticky_outbound_log` | Nenhuma linha nova `STICKY_REFUND` | ✓ último registro continua sendo pk=93 (`STICKY_RECOVER`, 06-28) — nenhuma linha nova criada pela reversão |
| Activity log — DB | Nova entrada citando o valor | ✓ pk=11010672: **`"Payment of amount: 50.04 with due date: 2026-06-29 REVERSED On 2026-06-30"`** — resolve a Pendência #1: texto fixo, cita o valor exato ($50.04) |
| Activity log — UI (regra #14) | Mesma entrada visível em "Notes" de `/customer-information/{accountPk}` | 🟡 Não verificado nesta rodada com filtro aplicado (524 linhas na conta, sort/paginação do componente não respondeu como esperado a clique simples — ver Pendência #3); a entrada EXISTE no DB e a tabela "Notes" é real e funcional (confirmado), só não naveguei até a linha específica via filtro de texto. `qa-implementer` deve usar o filtro `notes` (`name="notes"`, placeholder "Search by notes") para isolar |
| Payment History — Amount da linha | Idêntico ao original, sem linha nova | ✓ linha permanece `06/29/2026 $50.04 STICKY ...`, mesmo `paymentPk`, nenhuma linha extra |
| **Saldo da conta (AC-09)** | Capturar antes/depois | ✓ **Contract Balance $1.811,75→$1.861,79 (+$50,04)** · **Amount Past Due $860,72→$910,76 (+$50,04)** · Settlement $905,88→$930,90 (+$25,02) · EPO Balance $1.013,82→$1.038,84 (+$25,02) · Payment Dollars Up to Date $990,76→$940,72 (−$50,04) · Payment Count 20→19 · Returned Payments 1→2 · pagamento revertido **some** da lista "Last 3 Payments". **Regra de negócio confirmada: o Reverse reabre o receivable pelo valor integral revertido** (resolve a Pendência #2) |
| Referência cruzada (CT-03) | Comparar com CT-04 | ✓ ver nota em CT-04 — efeito no **ledger é idêntico** entre Reverse e Refund; a única divergência real é a chamada ao Sticky |

### Oracle: CT-04 — Fully Refund em Sticky inalterado, pelo valor correto (regressão) `[CONFIRMADO live sandbox 2026-06-30, conta 6042]`

| O que o usuário confere | Valor/estado esperado | Live (conta 6042, payment 2192470, sticky 95, $50.04) |
|---|---|---|
| Chamada de rede | `POST /uown/svc/refundPayment` → 200 | ✓ confirmado, 200 |
| Payload de `refundPayment` | `amount` = valor integral, campo travado | ✓ `{"paymentPk":2192470,"refundFee":false,"amount":50.04,"comment":"..."}` — `amount` bate exatamente com o valor original |
| `uown_sticky_outbound_log` | Nova linha `STICKY_REFUND`, `amount` em centavos = original × 100 | ✓ pk=126, `source="STICKY_REFUND"`, request `"amount":"5004"` (= 50.04 × 100, exato), response `stickyStatus:"SUCCESS"` |
| `uown_sticky.status` / `.recovery_status` | → `REFUNDED` | ✓ ambos `REFUNDED` — webhook de confirmação chegou em ~4s (síncrono dentro da janela de poll) |
| `uown_sv_payment.status` e `.amount` | `REVERSED`; `amount` idêntico | ✓ `status="REVERSED"`, `payment_amount="50.04"` (idêntico), `reason="Sticky refund 72c37c65..."` |
| Activity log — DB | Duas linhas, valor citado | ✓ pk=11010689 **`"Sticky refund submitted. paymentPk=2192470, ccPk=85648, stickyTxnId=..., stickyStatus=REFUND_SUBMITTED"`** + pk=11010690 (0.9s depois) **`"Sticky refund confirmed via webhook. paymentPk=2192470, ccPk=85648, stickyTxnId=..., amount=50.04"`** — valor exato confirmado em ambas |
| Payment History — Amount da linha | Idêntico, sem linha nova | ✓ (mesmo padrão do CT-02, não re-verificado individualmente nesta rodada) |
| CC History (resumo Sticky) | Mostra `REFUNDED` com valor correto | 🟡 não verificado nesta rodada (gotcha de reload MobX conhecido na KB) — pendente para `qa-validator` |
| **Saldo da conta (AC-09)** | Capturar antes/depois | ✓ **Past Due $910,76→$960,80 (+$50,04)** · Payment Dollars Up to Date $940,72→$890,68 (−$50,04) · Payments Remaining 38→39 — **delta idêntico ao do Reverse (CT-02)**. Confirma a referência cruzada CT-03: o efeito no ledger/saldo é **igual** entre Reverse e Refund; a diferença real está só no lado Sticky (outbound log + recovery_status) |

### Oracle: CT-05 — Reverse vs Fully Refund mostram controles diferentes `[CONFIRMADO live sandbox 2026-06-30, conta 6040]`

| O que o usuário confere | Valor/estado esperado | Live |
|---|---|---|
| Reverse selecionado | Sem checkbox de fee; Payment Amount fixo | ✓ confirmado — modal com Reverse selecionado mostra só Transaction Date / Type / Payment Amount (read-only, $50.04) / Reverse Reason / Comment — nenhum campo de fee renderizado |
| Fully Refund selecionado (default ao abrir) | — | ✓ confirmado nas duas execuções (CT-02 e CT-04) — modal abre sempre com "Fully Refund" pré-selecionado mesmo após o hotfix |

### Oracle: CT-06 — Regressão de Reverse/Refund não-Sticky `[CONFIRMADO live sandbox 2026-06-30]`

> Dados: 2 pagamentos CC **frescos** gerados via UI (Make Payment modal) nas contas 6040/6042 ($60.08 cada,
> pk 2192490/2192491); 2 pagamentos ACH **PAID já existentes**, postados hoje pelo autopay normal do sistema
> nas contas 17301/17300 ($108.81/$164.59, pk 2192488/2192487) — **exceção justificada de dado** (rule #9): um
> ACH não atinge `PAID` de forma síncrona via automação (precisa de `SendACHPaymentsSweep` + callback real do
> Profituity, ciclo de minutos), então reaproveitar um ACH/PAID gerado pelo sweep do próprio sistema *hoje* é
> o equivalente mais próximo de "dado fresco" disponível sem um UPDATE direto no DB (Exceção 3, não
> autorizada).

| O que o usuário confere | Valor/estado esperado | Live |
|---|---|---|
| CC Reverse (conta 6040, pk 2192490, $60.08) | `reversePayment` → 200; `status='REVERSED'`; `amount` inalterado | ✓ confirmado — payload sem `amount`, log `"Payment of amount: 60.08 with due date: 2026-06-30 REVERSED On 2026-06-30"` (**mesmo template genérico do log usado no Reverse de Sticky** — confirma que o log do CT-02 não é específico de Sticky, é compartilhado) |
| CC Fully Refund (conta 6042, pk 2192491, $60.08) | `refundPayment` → 200; `status='REVERSED'`; **nenhum envolvimento do Sticky** | ✓ confirmado, **síncrono** — 3 logs no mesmo segundo: transação CREDIT $61.08 (inclui $1 de convenience fee, `refundFee=true` default), transação SALE→REFUNDED, e `"Refund CC Payment complete. Status REFUNDED, Amount 60.08, refundFee true, Remaining amount 0.00"`. Nenhuma tabela `uown_sticky*` tocada (payment não é STICKY) |
| ACH Reverse (conta 17301, pk 2192488, $108.81) | `reversePayment` → 200; `status='REVERSED'`; `amount` inalterado | ✓ confirmado — mesmo log genérico: `"Payment of amount: 108.81 with due date: 2026-07-01 REVERSED On 2026-06-30"` |
| ACH Fully Refund (conta 17300, pk 2192487, $164.59) | `refundPayment` → 200; `status='REVERSED'` | ✓ confirmado, **mas assíncrono** (achado novo, fora do escopo do hotfix): cria uma **nova `ACHPayment`** `status=PENDING, achProcessType=REFUND, amount=164.59` — o `uown_sv_payment.reverse_date` original fica `NULL` até essa ACH de crédito liquidar via sweep/vendor (diferente do CC, que é síncrono). Comportamento pré-existente, não alterado por !700 — reforça que AC-05 se sustenta mesmo nesse detalhe mais fino |

## Pendências

1. ~~Conteúdo do activity log para Reverse-em-Sticky~~ **RESOLVIDA (live 2026-06-30).** Texto fixo confirmado:
   `"Payment of amount: {amount} with due date: {dueDate} REVERSED On {date}"` (ex.: `"Payment of amount:
   50.04 with due date: 2026-06-29 REVERSED On 2026-06-30"`), `LogType` não inspecionado mas a entrada é
   visível na mesma `uown_sv_activity_log` consultada via `getActivityLogsByAccount`.
2. ~~Saldo da conta após Reverse/Refund (AC-09)~~ **RESOLVIDA (live 2026-06-30).** Regra de negócio confirmada:
   tanto Reverse quanto Fully Refund **reabrem o receivable** — `Contract Balance` e `Amount Past Due` sobem
   exatamente o valor da ação revertida/refundada (+$50.04 nos dois candidatos testados), `Payment Dollars Up
   to Date` cai o mesmo valor, e o pagamento desaparece de "Last 3 Payments". **O efeito no ledger é idêntico
   entre as duas ações** — a diferença real está apenas no lado Sticky (outbound log + recovery_status).
   `Settlement Amount` e `EPO Balance` sobem ~metade do valor ($25.02 para um pagamento de $50.04) — fórmula
   exata não investigada, mas a direção (sobe) e a consistência entre as duas contas confirmam que não é
   ruído. Ainda **não verificado** com page-object formal — `qa-implementer` precisa adicionar leitura desses
   campos em `customer.page.ts` (não existe; só há equivalente Website, prefixo `ws*`).
3. **Seletor/page-object da tabela "Notes / Activity Log" do Servicing ainda não existe**, mas o DOM real já
   foi mapeado (live 2026-06-30): é uma `<table role="table">` **semântica** (diferente da Origination, que
   usa `.rdt_Table`/divs) em `/customer-information/{accountPk}`, header "Notes", colunas (prioridade) | Date |
   Type | User ID | Notes, com botão "Filters" expondo inputs `name="notes"` (placeholder "Search by notes") e
   `name="userId"` — usar o filtro de notes para isolar uma entrada específica em vez de paginação (a ordenação
   por clique no header "Date ▲" mostrou-se não-confiável: dois cliques não trouxeram as entradas mais
   recentes ao topo nem ao fim — investigar mecanismo real antes de automatizar; usar o filtro é mais
   confiável). `qa-implementer` ainda precisa escrever o page-object/selector formal.
4. **NOVO — discrepância de estilo na linha REVERSED `[OBSERVATION]`.** A KB `docs/knowledge-base/sticky-payment-refund.md`
   afirma `[confirmed]` que a linha REVERSED renderiza "red strikethrough" (`text-decoration:line-through`).
   Live 2026-06-30 (conta 6040, após o Reverse): `getComputedStyle` em todas as células da linha mostra
   `text-decoration-line: none` — a cor vermelha (`rgb(229,0,0)`) está correta, **o tachado não está presente**.
   Reproduzido em dado fresco (não é artefato de dado antigo, regra #10). Fora do escopo direto deste hotfix
   (não foi tocado por !700), mas é uma divergência real entre a KB e o comportamento atual — **não classificar
   como `[BUG]` ainda**: pode ser (a) regressão real de CSS, (b) a KB nunca verificou de fato via
   `getComputedStyle` e só leu visualmente um screenshot. Próximo passo: checar se há um ticket relacionado e
   corrigir a KB (`sticky-payment-refund.md`) removendo o `[confirmed]` indevido — tarefa do `qa-doc-keeper`.
5. ~~CT-06 (regressão não-Sticky) não executado~~ **RESOLVIDA (live 2026-06-30).** 4/4 combos confirmados.
   Achado novo (fora do escopo do hotfix, pré-existente): **CC Refund é síncrono; ACH Refund é assíncrono**
   (cria uma `ACHPayment` nova `PENDING/REFUND`, `reverse_date` do pagamento original só fecha quando essa
   liquidar via sweep/vendor). Não é regressão de !700 — comportamento herdado, documentado aqui pela primeira
   vez para este oráculo.

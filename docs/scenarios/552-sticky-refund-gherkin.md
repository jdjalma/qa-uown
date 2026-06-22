# Feature: Refund a Sticky-recovered payment (svc#552) — BDD scenarios

> Formal Given/When/Then for the Servicing agent flow. UI-first. Companion to the risk matrix `552-sticky-refund-scenarios.md` and the AC report `docs/reports/552-sticky-refund-report.md`.
> Tag legend: `@confirmed` executed live in sandbox 2026-06-21 · `@code` confirmed from merged code only · `@needs-setup` precondition not yet built · `@gap` confirmed defect/risk.
> Environment note: Sticky only works in **sandbox** (webhook decryption + real Sticky sandbox API); qa2/dev2 have the schema but no data.
> **Evidence note:** each scenario carries a `# 🔎 Evidência` line with the sandbox account PK(s) (and session/payment IDs where relevant) that back it, from the live run 2026-06-21. Accounts are sandbox `uown_sv_account.pk`. These are execution-history references (source: `552-sticky-refund-scenarios.md`), NOT a source of pattern. `@code`/`@needs-*` scenarios cite the code/MR instead of a live account. Full account index at the bottom.

```gherkin
Funcionalidade: Reembolsar um pagamento recuperado via Sticky no Servicing

  Contexto:
    Dado que um agente de Servicing está logado com a permissão "RefundPayments:modify"
    E que uma conta tem um pagamento STICKY no status PAID cuja session Sticky está RECOVERED

  # ──────────────── Happy path (AC) ────────────────

  @confirmed @smoke @critical
  Cenário: Reembolsar integralmente um pagamento Sticky recuperado
    # 🔎 Evidência (sandbox 2026-06-21): contas 6168 (weekly, dunning 223) e 6215 (monthly, dunning 225)
    #    — POST /refundPayment 200 → outbound STICKY_REFUND → session REFUND_SUBMITTED → webhook
    #    refund.successful (uown_sticky_inbound_log, status ACCEPTED) → REFUNDED + SvPayment REVERSED + 2 activity logs.
    Dado que o Payment History da conta exibe uma row "STICKY" / "PAID"
    Quando o agente abre o Reverse Payment, o reason está pré-definido como "Fully Refund"
    E o agente digita um comentário e submete
    Então o backend chama o payment-refund do Sticky com stickyTransactionId, amount (cents capturados), authorizationId, refundReason=comentário, refundDescription="Uown servicing refund"
    E uma row é gravada em uown_sticky_outbound_log com source="STICKY_REFUND"
    E uown_sticky.recovery_status e uown_sticky.status passam para "REFUNDED"
    E o SvPayment passa para REVERSED com reverse date, reason e comentário preenchidos
    E um activity log "Sticky refund submitted" e depois "Sticky refund confirmed via webhook" é gravado na conta

  @confirmed @critical
  Cenário: Feedback da UI após um refund bem-sucedido
    # 🔎 Evidência (sandbox 2026-06-21): contas 6168 / 6215 — toast de sucesso, row REVERSED com
    #    strikethrough vermelho no Payment History, e CC History "Sticky Recovery Status"=REFUNDED.
    Quando o refund é bem-sucedido
    Então um toast de sucesso "Successfully refunded payment." é exibido
    E a row do Payment History renderiza REVERSED com strikethrough vermelho
    E a coluna "Sticky Recovery Status" do CC History mostra "REFUNDED"

  @confirmed @critical
  Cenário: O refund reabre a delinquency do cliente
    # 🔎 Evidência (sandbox 2026-06-21): conta 6168 — Past Due +$38,45 ($1.115,05 → $1.153,50),
    #    Past Due Date recuou um período (12/05 → 11/28). EPO/balance recalculados no refund:
    #    conta 6215, uown_sv_sched_summary.row_updated_timestamp = timestamp exato do refund (20:17:48) (N-4).
    Dado que o pagamento recuperado havia quitado um receivable de parcela regular
    Quando o pagamento é reembolsado
    Então esse receivable é reativado (reaberto)
    E o Amount Past Due da conta aumenta no valor reembolsado
    E o Past Due Date recua um período de pagamento
    E os valores armazenados de EPO / balance são recalculados no momento do refund

  # ──────────────── Comportamento do modal ────────────────

  @confirmed
  Cenário: O modal de refund STICKY só oferece Fully Refund
    # 🔎 Evidência (sandbox 2026-06-21): observado nos modais Reverse Payment das contas 6168 / 6215
    #    — única opção de Reverse Reason = "Fully Refund" (F-1).
    Quando o agente abre o Reverse Payment para uma row STICKY
    Então as opções de Reverse Reason são exatamente ["Fully Refund"]
    E nenhuma opção "Reverse" ou "Partially Refund" é oferecida
    E nenhum checkbox "Refund Convenience Fee" é exibido

  @confirmed
  Cenário: O comentário é obrigatório
    # 🔎 Evidência (sandbox 2026-06-21): conta 6169 — SAVE com comentário vazio → erro Formik
    #    "Comment is required.", modal permanece aberto, nenhum POST /refundPayment disparado (B-3).
    Quando o agente submete o refund com um comentário vazio
    Então um erro de validação "Comment is required." é exibido
    E o modal continua aberto
    E nenhuma requisição de refund é enviada

  @confirmed
  Cenário: Uma row já revertida/reembolsada não pode ser reembolsada de novo pela UI
    # 🔎 Evidência (sandbox 2026-06-21): conta 6168 — a row STICKY REVERSED não exibe o ícone de
    #    Reverse Payment (isReversedOrRefunded oculta; só rows PAID exibem) (B-1).
    Dado um pagamento STICKY que já está REVERSED
    Então a row do Payment History não exibe o ícone de Reverse Payment

  # ──────────────── Guards e idempotência ────────────────

  @confirmed @critical
  Cenário: Re-reembolsar uma session já reembolsada não gera refund em dobro
    # 🔎 Evidência (sandbox 2026-06-21): conta/payment 17204 (payment PAID + session REFUNDED) —
    #    refund bloqueado → toast "Unable to refund payment.", sem 2º outbound STICKY_REFUND, sem
    #    dinheiro em dobro, sem novo log (guard de duplicidade svc!1493) (A-1).
    Dado um pagamento STICKY cuja session já está REFUNDED
    Quando o agente tenta reembolsá-lo de novo
    Então o refund é bloqueado com um toast "Unable to refund payment."
    E nenhuma segunda chamada outbound ao Sticky é feita
    E o SvPayment permanece inalterado (sem dinheiro devolvido em dobro)

  @confirmed
  Cenário: O refund é rejeitado quando a session não está RECOVERED
    # 🔎 Evidência (sandbox 2026-06-21): conta 5084 (session CANCELED) — backend log
    #    "Sticky recovery is not in RECOVERED status", payment continua PAID, nenhum outbound
    #    STICKY_REFUND (A-4). Ver também N-1 (cancel-after-capture) abaixo.
    Dado um pagamento STICKY cuja session está CANCELED (ou RECOVERY_STARTED / PENDING)
    Quando o agente tenta reembolsá-lo
    Então o refund falha com o log de backend "Sticky recovery is not in RECOVERED status"
    E o SvPayment continua PAID
    E nenhuma chamada outbound STICKY_REFUND é feita

  @code
  Esquema do Cenário: Guards no nível de pagamento no backend
    # 🔎 Evidência: confirmado por código (StickyRefundPaymentService — svc!1465/!1471/!1493), NÃO
    #    exercido live (alcançáveis só por API; a UI já bloqueia antes). Sem conta de evidência live.
    Quando o refund é solicitado para <caso>
    Então é rejeitado com "<mensagem>"
    Exemplos:
      | caso                                       | mensagem                                                |
      | um pagamento Sticky não-PAID               | Only PAID Sticky payments can be refunded               |
      | um pagamento Sticky sem o link de cc       | Sticky payment is missing credit card transaction link  |
      | um pagamento não-Sticky pela via sticky    | Payment is not a Sticky recovery payment                |

  # ──────────────── Account-state (sem guard — RISCO) ────────────────

  @confirmed @gap @critical
  Esquema do Cenário: O refund prossegue em estados terminais da conta (sem state guard)
    # 🔎 Evidência (sandbox 2026-06-21): uma conta por estado terminal (coluna "conta") — em todos o
    #    refund teve sucesso e o pagamento passou para REVERSED, SEM state guard (C-2 / C-3).
    Dado que o status da conta é "<status>"
    Quando o agente reembolsa o pagamento STICKY
    Então o refund tem sucesso e o pagamento passa para REVERSED
    E o status da conta passa para "<resultado>"
    Exemplos:
      | status          | conta | resultado                                                       |
      | SETTLED_IN_FULL | 6158  | ACTIVE (des-liquidada; settled_in_full_date_time fica stale)    |
      | CHARGED_OFF     | 6228  | CHARGED_OFF (permanece; dinheiro devolvido em dívida baixada)   |
      | CANCELLED       | 6214  | CANCELLED (permanece; dinheiro devolvido em contrato encerrado) |
      | SOLD            | 6166  | SOLD (permanece; dinheiro devolvido em dívida vendida a um comprador) |

  @confirmed @gap @critical
  Cenário: Dinheiro capturado numa session CANCELED é não-reembolsável
    # 🔎 Evidência (sandbox 2026-06-21): conta 5084 — Sticky capturou $218,18 (28/05) → contribuiu p/
    #    PAID_OUT (09/06) → StickyRecoverCancelSweep tentou cancelar e o Sticky rejeitou ("Cannot
    #    cancel transaction", já capturado) → session CANCELED, payment PAID. Na UI o ícone Reverse
    #    aparece (row PAID); SAVE → POST /refundPayment 200, mas payment continua PAID (sem reversal,
    #    sem outbound), só log "Sticky recovery is not in RECOVERED status". $218,18 irrecuperável via UI (N-1).
    Dado um pagamento STICKY que está PAID mas cuja session está CANCELED (cancel-after-capture)
    Quando o agente tenta reembolsá-lo
    Então o ícone de Reverse Payment é exibido (o pagamento está PAID)
    Mas o refund falha ("not in RECOVERED status") e o dinheiro não pode ser devolvido pela UI

  # ──────────────── Letra de rating × recovery (RISCO) ────────────────

  @confirmed
  Cenário: Uma conta em payment-arrangement / falência é excluída de nova recovery
    # 🔎 Evidência (sandbox 2026-06-21, repro fresh): conta 17267 — o MESMO cct selecionado pelo SQL
    #    real do StickyRecoverSweep com rating=NULL é EXCLUÍDO com rating='P' e rating='C' (H-1).
    Dado uma conta com rating "P", "C", "D" ou "B"
    Quando o StickyRecoverSweep roda
    Então a conta não é selecionada para uma nova recovery Sticky

  @confirmed @gap @critical
  Cenário: Uma recovery em andamento NÃO é cancelada quando a conta entra em arrangement/falência
    # 🔎 Evidência (sandbox 2026-06-21, repro fresh): conta 17267 (session RECOVERY_STARTED simulada)
    #    — StickyRecoverCancelSweep NÃO a seleciona com rating='P'/'C' enquanto account_status=ACTIVE
    #    (só após CANCELLED). Conta real 17179 (rating→P + autopay off) teve Sticky capturando
    #    $21,73 × 2 no mesmo dia. Não existe StickyRecoveryGuardianSweep (H-3).
    Dado que uma session Sticky está em andamento (RECOVERY_STARTED) numa conta ACTIVE
    Quando o cliente entra num payment arrangement (rating "P") ou declara falência ("C"/"D"/"B")
    E a conta continua ACTIVE
    Então o StickyRecoverCancelSweep não cancela a session em andamento
    E a recovery prossegue (em prod o gateway captura) — violando o arrangement / o automatic stay

  @confirmed @gap
  Cenário: Contas Fraud / Sold NÃO são excluídas da recovery
    # 🔎 Evidência (sandbox 2026-06-21, repro fresh): conta 17267 — o cct ainda é selecionado com
    #    rating='F'. Dados live: contas 17177 (rating F) e 17176 (rating M) têm sessions Sticky (H-2).
    Dado uma conta com rating "F" (fraud) ou "S" (sold)
    Quando o StickyRecoverSweep roda
    Então a conta ainda é selecionada para recovery Sticky

  # ──────────────── Async / imposto (RISCO) ────────────────

  @gap @needs-dev
  Cenário: Um webhook de confirmação perdido deixa o refund travado
    # 🔎 Evidência: forma do caso payment 17204 (REFUND_SUBMITTED travado, payment PAID — 06-17).
    #    qa2/dev2 não descriptografam webhooks (reconfirma a limitação); nenhum guardian sweep
    #    observado para REFUND_SUBMITTED travado (D-1). [needs-dev — sem conta sandbox happy reproduzível]
    Dado que o agente submeteu um refund (session REFUND_SUBMITTED, Sticky retornou success)
    Quando o webhook "refund.successful" nunca chega (ex.: o qa2 não consegue descriptografar webhooks)
    Então o SvPayment continua PAID e a session continua REFUND_SUBMITTED indefinidamente
    E nenhum guardian reconcilia a divergência

  @gap @needs-dev
  Cenário: O imposto do refund não é reportado de volta ao TaxCloud
    # 🔎 Evidência (sandbox 2026-06-21): dailyTaxCloudRefundsSync com is_active=false (enquanto
    #    dailyTaxCloudPaymentsSync está ativo). Payments revertidos 2190284 / 2190467 ficam com 0 rows
    #    em uown_sv_allocation (taxable_amount apagado); split de imposto do payment revertido = 0.00/0.00
    #    (vs 2.58/32.21 num Sticky não-reembolsado, payment 2190283 ainda PAID) (N-3 / C-5 / C-7).
    #    [needs-dev — verificar prod, categoria env-provisioning]
    Quando um pagamento Sticky é reembolsado
    Então a reversão apaga as rows de uown_sv_allocation do pagamento (incl. taxable_amount)
    E o dailyTaxCloudRefundsSync está inativo
    Logo o imposto coletado não é creditado de volta (over-remittance / gap de reconciliação)
```

## Índice de contas de evidência (sandbox, 2026-06-21)

> `uown_sv_account.pk` salvo no run live. Fonte: `552-sticky-refund-scenarios.md` (histórico de execução — não é fonte de pattern). Sticky só roda em sandbox ([[sticky-refund-tests-sandbox-only]]).

| Conta / ID | Papel na evidência | Cenários |
|---|---|---|
| **6168** (weekly, dunning 223) | Happy path completo + reabre delinquency (+$38,45; 12/05→11/28); modal só "Fully Refund"; row REVERSED sem ícone | Reembolso integral, Feedback UI, Reabre delinquency, Modal Fully-Refund, Row já revertida |
| **6215** (monthly, dunning 225) | Happy path completo; EPO/balance recalculados no refund (sched_summary @20:17:48) | Reembolso integral, Feedback UI, Reabre delinquency (EPO recompute) |
| **6169** | Validação de comentário obrigatório (blank → "Comment is required.") | Comentário é obrigatório |
| **17204** (payment) | Idempotência (PAID + session REFUNDED → bloqueado); forma do webhook-stuck (REFUND_SUBMITTED) | Re-reembolso bloqueado, Webhook perdido |
| **5084** | Session CANCELED → refund rejeitado ("not in RECOVERED status"); cancel-after-capture ($218,18 PAID_OUT, irrecuperável via UI) | Rejeitado fora de RECOVERED, Dinheiro capturado não-reembolsável |
| **6158** | Refund em SETTLED_IN_FULL → reverte para ACTIVE (settled_in_full_date_time stale) | Estados terminais (SETTLED_IN_FULL) |
| **6228** | Refund em CHARGED_OFF → permanece CHARGED_OFF, dinheiro revertido | Estados terminais (CHARGED_OFF) |
| **6214** | Refund em CANCELLED → permanece CANCELLED, dinheiro revertido | Estados terminais (CANCELLED) |
| **6166** | Refund em SOLD → permanece SOLD, dinheiro revertido (dívida vendida) | Estados terminais (SOLD) |
| **17267** (repro fresh) | Gate de rating no sweep: NULL incluído, P/C excluídos; F ainda incluído; cancel-sweep não cancela in-flight com P/C enquanto ACTIVE | Excluída de nova recovery (P/C/D/B), Recovery não cancelada, Fraud/Sold não excluídas |
| **17179** | rating→P + autopay off, Sticky capturou $21,73 × 2 no mesmo dia (recovery não cancelada) | Recovery em andamento não cancelada |
| **17177** (F) · **17176** (M) | Dados live: têm sessions Sticky apesar do rating fraud/M | Fraud/Sold não excluídas |
| payments **2190284 / 2190467** (revertidos) · **2190283** (ainda PAID) | De-alocação na reversão (0 rows uown_sv_allocation; imposto 0.00/0.00 vs 2.58/32.21) | Imposto não reportado ao TaxCloud |
| `dailyTaxCloudRefundsSync` (is_active=false) · `StickyRecoverSweep` / `StickyRecoverCancelSweep` (uown_scheduled_task) | Sweeps/sync — evidência de configuração, não de conta | Imposto não reportado, gates de rating |

> Cenários sem conta live (`@code` / `@needs-dev`): "Guards no nível de pagamento no backend" (código svc!1465/!1471/!1493) e "Webhook perdido" (needs-dev) — evidência é código/MR ou limitação de ambiente, não uma conta sandbox.

# Regression — Arrangement ACH deve ser FAILED quando parcelas ficam BLOCKED_ACCOUNT

## Sumário

Regression guard para o `BasePaymentArrangementListener` (fluxo ACH). Valida que, quando parcelas ACH caem em estados residuais (ex: `BLOCKED_ACCOUNT`), o arrangement é corretamente reconciliado para `FAILED` — nunca `SUCCESS`.

Lógica validada (referência Java: `svc/service/paymentArrangement/listener/BasePaymentArrangementListener.java:76-97`):

```
hasFailure → FAILED
else hasPending → IN_PROGRESS
else → SUCCESS

isFailure = status NOT IN {PENDING, SENT, ACK_RECEIVED, PICKED_TO_SEND, 
                           STATUS_UPDATE_PENDING, PENDING_TO_RERUN,
                           SETTLED, COMPLETED, SETTLED_IN_RERUN}
```

`BLOCKED_ACCOUNT` não está nos sets PENDING ou SUCCESS → tratado como falha → arrangement deve virar `FAILED`.

## Origem

Durante a execução do pipeline #491 em 2026-04-21, foi observado que a conta `11263` em qa2 tinha arrangement `pk=66` com `status='SUCCESS'` + `is_active=false` enquanto ambas as parcelas estavam `BLOCKED_ACCOUNT`. Investigação inicial classificou o caso como bug crítico, mas:

1. A reprodução em conta fresh (`11391`) usando o mesmo teste bank (`123456780` / `160781900000`) mostrou comportamento **CORRETO** — arrangement terminou como `FAILED`.
2. O usuário confirmou que já havia task de validação no backlog para esse cenário específico.

Portanto a classificação correta é: **regression test**, não bug report. Se o teste um dia falhar com `BUG_REPRODUCED=true`, é sinal de regressão introduzida.

Esta investigação também motivou a criação das regras obrigatórias em `.claude/context/shared/bug-classification-rules.md` (exige reprodução em fresh antes de reportar bug) e na seção "Test Data Hierarchy" de `.claude/rules/testing.md`.

## User Story

### US-01 — Listener ACH reconcilia corretamente parcela residual

> Como UOWN, quero que o listener de ACH reconcilia arrangements quando parcelas caem em estados de falha (ex: `BLOCKED_ACCOUNT`), para que o sistema nunca marque uma conta como settled se o dinheiro não entrou.

**Acceptance criteria**
- Arrangement com parcelas `BLOCKED_ACCOUNT` em qa2 resolve para `FAILED`
- Arrangement nunca permanece `SUCCESS` enquanto há parcela residual
- Regra é válida para qualquer status residual (não só `BLOCKED_ACCOUNT`)

## Lease Risks Addressed

- **R-FALSE-SUCCESS:** arrangement marcado como `SUCCESS` quando pagamentos falharam → conta erroneamente considerada quitada (em `SETTLEMENT`, dispararia `SETTLED_IN_FULL`).
- **R-SILENT-FAILURE:** `BLOCKED_ACCOUNT` exige ação do agente (bank change, contato com cliente). Se arrangement não reflete `FAILED`, a falha passa despercebida.

## Test Data Hierarchy compliance

⚠️ **EXCEÇÃO documentada:** este teste reusa fixture ACTIVE existente (`11391` ou fallback `11392..11395`).

**Justificativa:**
- Criar conta via fluxo completo (sendApplication → sign → fund → ACTIVE) demora > 5 min por CT
- O objetivo é reconciliar o listener ACH, não validar o funil de origination
- Fixture ACTIVE é puramente reusada (sem estado histórico que interfira na reconciliação)

Aceito pela § Test Data Hierarchy de `.claude/rules/testing.md` (critério "setup > 10 min").

## Test Strategy

- API-only (no browser). Project: `task-testing`. Env: `qa2`.
- Reusa conta ACTIVE UOWN (`11391` ou fallback).
- SELECT-only no banco. Nenhum `INSERT/UPDATE/DELETE`.
- Polling via `DatabaseHelpers`.
- `test.setTimeout(300_000)` para acomodar latência do Profituity sandbox em CT-04.

## Test Cases

| CT | Objetivo |
|----|----------|
| CT-01 | Escolher conta ACTIVE UOWN fixture (`11391` ou fallback) |
| CT-02 | Criar ACH `SETTLEMENT` arrangement (2 parcelas) via API |
| CT-03 | Disparar `sendACHPaymentsSweep` e aguardar transição `SENT`/`PICKED_TO_SEND` |
| CT-04 | Disparar `getStatusDatePaymentsListSweep` e aguardar status final (≤180s) |
| CT-05 | Validar regra `BasePaymentArrangementListener.handleResult()` — `arrangement.status` deve casar com `expected` computado a partir das parcelas |

## Resultado esperado

- ✅ **PASS:** arrangement termina em `FAILED` (ou `IN_PROGRESS` se Profituity ainda processando). `BUG_REPRODUCED=false`.
- ❌ **FAIL:** arrangement termina em `SUCCESS` enquanto há parcela não-success e não-pending. `BUG_REPRODUCED=true` — regressão detectada, necessário investigar mudanças recentes em:
  - `PaymentArrangementACHListener` (get payments, isFailure, isPending sets)
  - `ProfituityPaymentStatusParser` (event publishing)
  - Configuração `publish.post.update.event` em qa2

## Notas

- Referência Java: `svc/service/paymentArrangement/listener/BasePaymentArrangementListener.java:76-97`
- Observação histórica em 2026-04-17: account 11263, arrangement 66 (não reproduzida em 11391).
- Regra de classificação de bug aplicada: `.claude/context/shared/bug-classification-rules.md`.

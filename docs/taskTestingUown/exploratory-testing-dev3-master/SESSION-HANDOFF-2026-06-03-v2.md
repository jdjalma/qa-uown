# Session Handoff — Sweeps Dev3 (2026-06-03 v2)

> Continuação do handoff anterior (SESSION-HANDOFF-2026-06-03.md). Esta sessão completou todas as pendências principais.

## O que foi feito nesta sessão

### Pendência 1 — Runtime da flag `dailyDelinquencyRerunCCSweep` ✅ CONCLUÍDA

- Flag `run.cc.transaction.for.delinquency.dailyDelinquencyRerunCCSweep` confirmada TRUE em `uown_configuration_management` pk=126.
- Script `src/scripts/dev3-dailydelinquency-flag-validation.mjs` criado (lê .env, seed idempotente, trigger, verifica sweep_log + CC tx).
- Resultado: **processed=1**, thread log confirma `working on accountPk 221` → sweep agora entra em `runCCTransaction` (comportamento esperado com flag TRUE). Sem nova CC tx porque gateway ausente em dev3.
- **SW-OBS-005 corrigido**: flag estava ausente na sessão anterior, agora TRUE e comportamento de re-charge confirmado.
- CSV note de `dailyDelinquencyRerunCCSweep` atualizada para **Nivel A**.

### Pendência 2 — Corrigir 2 Notes erradas no CSV ✅ CONCLUÍDA

Ambas corrigidas e confirmadas via SQL live do DB:
- `StickyRecoverCancelSweep`: SQL real é `uown_sticky` (sticky_transaction_id não-nulo + account_status != 'ACTIVE' + recovery_status NOT IN RECOVERED/FAILED/CANCELED). Nota anterior dizia "CC DENIED 7d" — errada.
- `storedDocSmsServiceSweep`: SQL real é `UPDATE uown_sms_queue SET status='PICKED_TO_STORE' WHERE status='SENT'`. Nota anterior dizia `uown_stored_doc` — errada.

### Pendência 3 — Grupo "sem dado" ✅ CONCLUÍDA

#### `storedDocSmsServiceSweep` → Nivel A
- Seed: `uown_sms_queue` pk=1456 status STORED→SENT.
- Sweep executou: pk=1456 virou PICKED_TO_STORE confirmado via DB.
- processed=1, sem error. sweep_log pk=2062108.

#### `StickyRecoverCancelSweep` → Nivel A
- Seed: INSERT em `uown_sticky` pk=1 (account 217 SETTLED_IN_FULL, cc_transaction_pk=3383, sticky_transaction_id='test-sticky-tx-dev3-001', recovery_status='PENDING').
- Sweep selecionou via SQL exato. processed=1. Error: `[1] (Sticky 1) HTTP 404` (Sticky provider ausente em dev3 — esperado).
- Selecao + mecanismo + chamada externa provados. sweep_log pk=2062109.

#### Funding reports → 3x Nivel B + 1x Nivel A
- Seed: `uown_funding_transaction` pk=2 (merchant 35, ACTIVE, FULLY_FUNDED) → `fund_date_time=CURRENT_DATE-1`.
- Merchant 35 configurado: `send_automated_funding_report=true`, `funding_report_frequency='DAILY,WEEKLY,MONTHLY'`, `send_merged_funding_report=true`, `merged_funding_report_frequency='MONTHLY'`, `merged_funding_report_emails='test@test.com'`.
- `dailyFundingReportSweep`: SQL selecionou merchant 35, processed=0 (<200ms) — entrega SMTP/FTPS ausente. Nivel B. sweep_log pk=2062119.
- `weeklyFundingReportSweep`: mesmo padrão. Nivel B. sweep_log pk=2062120.
- `monthlyFundingReportSweep`: mesmo padrão. Nivel B. sweep_log pk=2062121.
- `monthlyConsolidatedFundingReportSweep`: processed=1, 5.6s de execução → relatório gerado. **Nivel A**. sweep_log pk=2062122.

## Estado atual do CSV

Após esta sessão, todas as pendências do grupo "sem dado" foram resolvidas. Veja status atual:

| Sweep | Nivel | Status |
|-------|-------|--------|
| `dailyDelinquencyRerunCCSweep` | A | ✅ Revalidado (flag TRUE, processed=1) |
| `storedDocSmsServiceSweep` | A | ✅ Revalidado (SENT→PICKED_TO_STORE) |
| `StickyRecoverCancelSweep` | A | ✅ Revalidado (HTTP 404 Sticky provider, expected) |
| `dailyFundingReportSweep` | B | ✅ Revalidado (SQL OK, entrega bloqueada) |
| `weeklyFundingReportSweep` | B | ✅ Revalidado (SQL OK, entrega bloqueada) |
| `monthlyFundingReportSweep` | B | ✅ Revalidado (SQL OK, entrega bloqueada) |
| `monthlyConsolidatedFundingReportSweep` | A | ✅ Revalidado (processed=1) |

## Pendências remanescentes (grupo vendor/infra)

Esses sweeps precisam de provisioning externo em dev3 ou validação em **stg**:
- `rerunCCPaymentsSweep`, `IdempotentCCSweep`, `reverseAchPaymentsSweep` — CC gateway/Profituity ausente
- `danielJewelersLeadReportSweep` — FTPS ausente
- `dailyTaxCloudRefundsSync` — TaxCloud FTPS/config ausente

## Bloco ⚠️ a investigar (não mudou)

- `paymentGatewayFixSweep` — NPE em registros com `rowCreatedTimestamp=null`
- `cancelProtectionPlanSweep` — NPE ocasional `defaultValue=null` (SW-OBS-008)
- `monitorSweep` — `emailBody` vazio intermitente (SW-OBS-007)
- `UnutilizedApprovalSweep` — seleção OK mas email não enfileirado (dedup Java?)

## Artefatos desta sessão

- `src/scripts/dev3-dailydelinquency-flag-validation.mjs` (novo)
- `docs/taskTestingUown/exploratory-testing-dev3-master/sweeps-dev3-tested.csv` (10+ notes atualizadas)
- `uown_sticky` pk=1 criado em dev3 (seed de teste, pode ser mantido)
- `uown_funding_transaction` pk=2 atualizado: `fund_date_time=2026-06-02` (fica como seed para testes futuros)
- Merchant 35 atualizado: `send_merged_funding_report=true`, `merged_funding_report_frequency='MONTHLY'`, `merged_funding_report_emails='test@test.com'`

## Para sincronizar

```bash
git add docs/taskTestingUown/exploratory-testing-dev3-master/ \
        src/scripts/dev3-dailydelinquency-flag-validation.mjs
git commit -m "wip(sweeps-dev3): conclui pendencias v2 - flag dailyDelinquency, storedDocSms, StickyRecover, 4x funding reports"
git push origin dev
```

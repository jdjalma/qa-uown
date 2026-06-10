# Session Handoff — Sweeps Dev3 (2026-06-03)

> Documento de continuidade. Objetivo: retomar este trabalho em outra máquina sem perder contexto.
> **ATENÇÃO:** quase tudo desta linha de trabalho está UNTRACKED no git. Só chega na outra máquina via `git push`. Ver seção "Para sincronizar".

## Onde paramos

Reexecução e validação dos sweeps em **dev3** (ENV=dev3 no `.env`). Os registros foram semeados via UPDATE/INSERT autorizado (Exceção 3 — autorização do usuário registrada nesta sessão) e validados pelos 4 specs de servicing.

### Resultados das runs (dev3, 2026-06-03)

- `payment-scheduling-sweeps-servicing.spec.ts` — **4/4 PASS**
- `cc-rerun-sweeps-servicing.spec.ts` — **5/5 PASS** (após fix da S4, ver abaixo)
- `business-sweeps-servicing.spec.ts` — **9 PASS / 2 SKIP**
- `email-sweeps-servicing.spec.ts` — **3/3 PASS**

### Mudanças feitas nesta sessão

1. **Fix de código** — `tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts` (S4):
   seed account trocado de `222` → `67`. A 222 é estruturalmente inelegível em dev3
   (`rating='P'` + ambos cartões `is_deleted=true` → nunca casa o SQL do
   `delinquencyRerunCCPaymentsSweep`). A 67 (ACTIVE, rating null, cartão on-file) passa.

2. **CSV atualizado** — `sweeps-dev3-tested.csv`: 11 sweeps reexecutados tiveram as Notes
   atualizadas com evidência datada. Preservadas as marcações finais do usuário (os 3
   `BUG - Reportado ao Dev` do SW-BUG-001 alias; os `SKIP - Provisioning Gap`; os `Nivel A`
   já fechados). Coluna `Task Status` mantida em "Waiting Double Check".

3. **Config flag setada em dev3** (via endpoint, JÁ PERSISTIDO no ambiente — não se perde):
   `POST /ConfigurationManagement/createOrUpdateConfig` em `https://svc-dev3.uownleasing.com`
   - key: `com.uownleasing.svc.service.sweeps.paymentSweeps.DelinquencyRerunCCPaymentsSweepService.run.cc.transaction.for.delinquency.dailyDelinquencyRerunCCSweep`
   - value: `true` (gravado em `uown_configuration_management` pk=126)
   - `GET /ConfigurationManagement/forceReloadConfig` chamado → cache Hazelcast evictado (sem restart)

## Conclusões-chave (corrigem a planilha antiga)

- **SW-BUG-001 (CreateScheduledACH/CC, CCDailyScheduledDeniedRerun)**: bug REAL de alias
  confirmado e reportado ao dev pelo usuário (2026-06-02). NÃO foi desmentido — manter como BUG.
- `FirstPaymentReminderSweep` = **email de 1ª parcela** (`taskService.sendFirstPaymentReminders`),
  NÃO refresh de token Kount. Provado: lead 1397 → conta 224 → email_queue.
- `delinquencyRerunCCPaymentsSweep`: flag **TRUE** em dev3 (corrige SW-OBS-005 que dizia false).
- Vendors NÃO têm toggle on/off simples em config: TaxCloud default-on (falta FTPS),
  Kount/Profituity usam defaults/credencial ausente. Charge de CC depende de gateway no
  serviço `payment-gateway` (não no application-dev.yml).

## Pendências (próximos passos)

1. **Validar runtime da flag dailyDelinquency**: disparar `dailyDelinquencyRerunCCSweep`
   (conta 221 já seeded) e checar em `sweep_logs` + `uown_sv_credit_card_transaction` se
   agora ele TENTA o re-charge (entra em `runCCTransaction`) em vez de só logar nota.
2. **Corrigir 2 Notes erradas no CSV** (ainda não feito):
   - `StickyRecoverCancelSweep`: SQL real = `uown_sticky` com `sticky_transaction_id` não-nulo
     + conta `account_status <> 'ACTIVE'` + `recovery_status NOT IN (RECOVERED,FAILED,CANCELED)`.
     (A nota atual fala em "CC DENIED 7d" — isso é OUTRO sticky sweep.)
   - `storedDocSmsServiceSweep`: SQL real = `UPDATE uown_sms_queue SET status='PICKED_TO_STORE'
     WHERE status='SENT'`. (A nota atual fala em `uown_stored_doc` — errado.)
3. **Grupo "sem dado" — criar registros elegíveis** (tudo via dado, sem vendor):
   - Funding reports (daily/weekly/monthly/consolidated): `uown_funding_transaction`
     FULLY_FUNDED com `fund_date_time` na janela (daily=ontem; weekly=7d; monthly=1mês)
     + merchant com `send_automated_funding_report=true`/`send_merged_funding_report=true`
     + frequência. Daniel's pk=42 e Fraser pk=37 já são DAILY.
   - StickyRecover: seed de row em `uown_sticky` em conta não-ACTIVE.
   - storedDocSms: insert de row em `uown_sms_queue` com `status='SENT'` (flip puro, sem vendor).
4. **Grupo "vendor/infra"** (rerunCC, IdempotentCC, reverseAch, danielJewelers, dailyTaxCloudRefunds):
   seleção já provada; completar o passo externo precisa provisionar vendor em dev3 (CC gateway,
   Profituity, FTPS) ou validar em **stg**. NÃO é destravável só por config.
5. **Versionar a flag no YAML** (opcional, para não divergir em redeploy): adicionar sob
   `system.config.com.uownleasing.svc.service`:
   ```yaml
               sweeps:
                 paymentSweeps:
                   DelinquencyRerunCCPaymentsSweepService:
                     run:
                       cc:
                         transaction:
                           for:
                             delinquency:
                               dailyDelinquencyRerunCCSweep: "true"
   ```
   (Reload está desligado — `cloud.kubernetes.reload.enabled: false` → mudança no YAML só pega com restart.)

## Bloco ⚠️ a investigar (defeitos/observações de produto)

- `paymentGatewayFixSweep` — NPE em registros com `rowCreatedTimestamp` null.
- `cancelProtectionPlanSweep` — NPE ocasional com `defaultValue` null (SW-OBS-008).
- `monitorSweep` — `emailBody` vazio intermitente (SW-OBS-007).
- `UnutilizedApprovalSweep` — seleção OK (count=1) mas email não enfileirado; confirmar se é
  dedup do Java ou gap real de enfileiramento.

## Como rodar (dev3)

```bash
# Chromium é necessário (project servicing-ui depende de auth.setup)
npx playwright install chromium

# Specs de sweep (serial, usam fixtures api+db; ENV=dev3 vem do .env)
npx playwright test tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts --project=servicing-ui --reporter=line --workers=1
npx playwright test tests/e2e/servicing/payment-scheduling-sweeps-servicing.spec.ts --project=servicing-ui --reporter=line --workers=1

# Diagnóstico read-only de dev3 (config + estado CC)
node src/scripts/dev3-sweep-diagnostics.mjs
```

## Arquivos tocados nesta sessão

- `tests/e2e/servicing/cc-rerun-sweeps-servicing.spec.ts` (edit — S4 account 222→67) **[untracked]**
- `docs/taskTestingUown/exploratory-testing-dev3-master/sweeps-dev3-tested.csv` (11 Notes) **[untracked]**
- `src/scripts/dev3-sweep-diagnostics.mjs` (diagnóstico read-only, novo) **[untracked]**
- Config flag em dev3 — já persistido no ambiente (não está no repo).

## Para sincronizar (você executa — eu não faço commit/push)

A branch é `dev`. Os arquivos acima e a pasta inteira `exploratory-testing-dev3-master/`
estão UNTRACKED. Para levar pra outra máquina:

```bash
git add docs/taskTestingUown/exploratory-testing-dev3-master/ \
        tests/e2e/servicing/ \
        src/scripts/dev3-sweep-diagnostics.mjs
git commit -m "wip(sweeps-dev3): valida 4 specs servicing + fix S4 delinquencyRerun (222->67) + handoff"
git push origin dev
```

Na outra máquina: `git pull origin dev` e abrir este arquivo para retomar.

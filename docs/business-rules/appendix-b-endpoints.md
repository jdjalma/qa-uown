---
title: "Apendice B: Referencia Rapida de Endpoints"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-23
sources:
  - code: src/api/clients/scheduled-task.client.ts#triggerScheduledTask
  - svc-source: rest/svc/RightFootWebhookController.java
  - svc-source: analytics/controller/CustomerEventController.java
  - env: qa2
covers: [endpoints, sweeps, pagamentos, contas, administracao, config, rightfoot, customer-journey]
---

# Apendice B: Referencia Rapida de Endpoints
## UOwn Leasing - SVC Platform

Endpoints para configuracao, sweeps, pagamentos, contas e administracao.

---

## Apendice B: Referencia Rapida de Endpoints para Ativacao

### Configuracoes

| Acao | Endpoint |
|------|----------|
| Alterar configuracao | `POST /ConfigurationManagement/createOrUpdateConfig` body: `{"key":"...", "value":"..."}` |
| Recarregar todas configs | `GET /ConfigurationManagement/forceReloadConfig` |

### Sweeps

| Acao | Endpoint |
|------|----------|
| Disparar sweep | `POST /uown/svc/triggerScheduledTask/{taskName}` |
| Pausar sweep | `POST /uown/svc/pauseScheduledTask/{taskName}` |
| Resumir sweep | `POST /uown/svc/resumeScheduledTask/{taskName}` |
| Reagendar sweep | `POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger={cron}` |
| Listar todos | `GET /uown/svc/getAllScheduledTasks` |
| Detalhes | `GET /uown/svc/getScheduledTaskByName/{name}` |

### Pagamentos

| Acao | Endpoint |
|------|----------|
| CC Vintage Run | `POST /uown/svc/executeCCVintageRun/{startDate}/{endDate}` |
| CC Payment Sweep | `POST /uown/svc/sendCCPaymentsSweep` |
| ACH Payment Sweep | `POST /uown/svc/sendACHPaymentsSweep` |
| Rewind & Replay | `POST /uown/svc/rewindAndReplayAccount/{accountPk}` |
| Calcular EPO | Via `getPayoffAmount` no TMS |

### Contas

| Acao | Endpoint |
|------|----------|
| Mover due dates | `POST /uown/svc/moveDueDatesByDays/{accountPk}?moveNumberOfDays=N` |
| Cancelar conta | `POST /uown/svc/cancelAccount/{accountPk}` |
| Settlement | `POST /uown/los/settleApplication` |
| Modify Invoice | `POST /uown/los/modifyInvoiceForLead/{leadPk}` |

### Administracao

| Acao | Endpoint |
|------|----------|
| Cleanup logs | `DELETE /uown/cleanupLogEntries?to=YYYY-MM-DD` |
| Cleanup dados | `DELETE /uown/cleanupFunctionalEntities?to=YYYY-MM-DD` |
| Limpar maps | `GET /uown/clearApplicationRequestMap` |
| Carregar approved amounts | `POST /uown/loadApprovedAmountsFromExcel` |

### RightFoot — Verificacao de Saldo ACH (R1.53.0)

Sweeps (disparaveis via `POST /uown/svc/triggerScheduledTask/{taskName}`):

| Sweep (taskName) | Cron seedado | process_type |
|------------------|--------------|--------------|
| `DailyAchBalanceCheckSweep` | `0 0 15 * * ?` (15:00 diario) | `DAILY_RERUN_DELINQUENT` |
| `RerunAchBalanceCheckSweep` | `0 0 9 ? * THU` (Qui 09:00) | `RERUN` |

Endpoints dedicados:

| Acao | Endpoint |
|------|----------|
| Webhook de batch pronto (RightFoot -> SVC) | `POST /uown/webhooks/rightfoot/batch-ready` |
| Reprocessar 1 batch (ops) | `POST /uown/rightfoot/batch-result` |
| Criar ACH daily-rerun a partir de batchIds (ops) | `POST /uown/rightfoot/ach-payments/daily-rerun` |

> A criacao do ACH (`DailyRerunAchCreationService`) NAO e Quartz -- e disparada pelo evento `RightFootBatchCompleteEvent` (AFTER_COMMIT) ou pelo endpoint ops acima. Cron seeds em `BootstrapService` ~linha 2275 (drift-prone -- conferir `uown_scheduled_task` antes de citar). Ver [09-integracoes-externas.md](09-integracoes-externas.md) secao 48.

### Customer Journey Tracking — Ingest (R1.53.0)

Telemetria do funil de originacao (origination#1308). Endpoints path-scoped por journey:

| Acao | Endpoint |
|------|----------|
| Registrar evento | `POST /api/journeys/{journeyId}/events` |
| Iniciar sessao | `POST /api/journeys/{journeyId}/session/start` |
| Encerrar sessao | `POST /api/journeys/{journeyId}/session/{sessionId}/end` |

> `journeyId` = `leadPk`. Idempotencia por `event_id` UNIQUE (DB). Evento cujo `sessionId` pertence a outro journey -> HTTP 409. Ingest sincrono, fire-and-forget no cliente.

---


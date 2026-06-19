---
title: "Apendice B: Referencia Rapida de Endpoints"
domain: business-rules
status: stable
volatility: volatile
last_verified: 2026-06-18
sources:
  - code: src/api/clients/scheduled-task.client.ts#triggerScheduledTask
  - env: qa2
covers: [endpoints, sweeps, pagamentos, contas, administracao, config]
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

---


---
title: "Appendix B: Endpoints Quick Reference"
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

# Appendix B: Endpoints Quick Reference
## UOwn Leasing - SVC Platform

Endpoints for configuration, sweeps, payments, accounts, and administration.

---

## Appendix B: Quick Reference of Activation Endpoints

### Configurations

| Action | Endpoint |
|------|----------|
| Change configuration | `POST /ConfigurationManagement/createOrUpdateConfig` body: `{"key":"...", "value":"..."}` |
| Reload all configs | `GET /ConfigurationManagement/forceReloadConfig` |

### Sweeps

| Action | Endpoint |
|------|----------|
| Trigger sweep | `POST /uown/svc/triggerScheduledTask/{taskName}` |
| Pause sweep | `POST /uown/svc/pauseScheduledTask/{taskName}` |
| Resume sweep | `POST /uown/svc/resumeScheduledTask/{taskName}` |
| Reschedule sweep | `POST /uown/svc/rescheduleScheduledTask/{taskName}?cronTrigger={cron}` |
| List all | `GET /uown/svc/getAllScheduledTasks` |
| Details | `GET /uown/svc/getScheduledTaskByName/{name}` |

### Payments

| Action | Endpoint |
|------|----------|
| CC Vintage Run | `POST /uown/svc/executeCCVintageRun/{startDate}/{endDate}` |
| CC Payment Sweep | `POST /uown/svc/sendCCPaymentsSweep` |
| ACH Payment Sweep | `POST /uown/svc/sendACHPaymentsSweep` |
| Rewind & Replay | `POST /uown/svc/rewindAndReplayAccount/{accountPk}` |
| Calculate EPO | Via `getPayoffAmount` in the TMS |

### Accounts

| Action | Endpoint |
|------|----------|
| Move due dates | `POST /uown/svc/moveDueDatesByDays/{accountPk}?moveNumberOfDays=N` |
| Cancel account | `POST /uown/svc/cancelAccount/{accountPk}` |
| Settlement | `POST /uown/los/settleApplication` |
| Modify Invoice | `POST /uown/los/modifyInvoiceForLead/{leadPk}` |

### Administration

| Action | Endpoint |
|------|----------|
| Cleanup logs | `DELETE /uown/cleanupLogEntries?to=YYYY-MM-DD` |
| Cleanup data | `DELETE /uown/cleanupFunctionalEntities?to=YYYY-MM-DD` |
| Clear maps | `GET /uown/clearApplicationRequestMap` |
| Load approved amounts | `POST /uown/loadApprovedAmountsFromExcel` |

### RightFoot — ACH Balance Verification (R1.53.0)

Sweeps (triggerable via `POST /uown/svc/triggerScheduledTask/{taskName}`):

| Sweep (taskName) | Seeded cron | process_type |
|------------------|--------------|--------------|
| `DailyAchBalanceCheckSweep` | `0 0 15 * * ?` (15:00 daily) | `DAILY_RERUN_DELINQUENT` |
| `RerunAchBalanceCheckSweep` | `0 0 9 ? * THU` (Thu 09:00) | `RERUN` |

Dedicated endpoints:

| Action | Endpoint |
|------|----------|
| Batch-ready webhook (RightFoot -> SVC) | `POST /uown/webhooks/rightfoot/batch-ready` |
| Reprocess 1 batch (ops) | `POST /uown/rightfoot/batch-result` |
| Create ACH daily-rerun from batchIds (ops) | `POST /uown/rightfoot/ach-payments/daily-rerun` |

> The ACH creation (`DailyRerunAchCreationService`) is NOT Quartz -- it's triggered by the `RightFootBatchCompleteEvent` event (AFTER_COMMIT) or by the ops endpoint above. Cron seeds in `BootstrapService` ~line 2275 (drift-prone -- check `uown_scheduled_task` before quoting). See [09-integracoes-externas.md](09-integracoes-externas.md) section 48.

### Customer Journey Tracking — Ingest (R1.53.0)

Origination funnel telemetry (origination#1308). Path-scoped endpoints per journey:

| Action | Endpoint |
|------|----------|
| Record event | `POST /api/journeys/{journeyId}/events` |
| Start session | `POST /api/journeys/{journeyId}/session/start` |
| End session | `POST /api/journeys/{journeyId}/session/{sessionId}/end` |

> `journeyId` = `leadPk`. Idempotency via `event_id` UNIQUE (DB). An event whose `sessionId` belongs to another journey -> HTTP 409. Synchronous ingest, fire-and-forget on the client.

---


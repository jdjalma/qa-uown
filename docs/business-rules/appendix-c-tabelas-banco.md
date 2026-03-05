# Apendice C: Tabelas de Banco Importantes
## UOwn Leasing - SVC Platform

Tabelas PostgreSQL mais importantes para verificacao e troubleshooting.

---

## Apendice C: Tabelas de Banco Importantes para Verificacao

| Tabela | Uso | Quando Consultar |
|--------|-----|-----------------|
| `uown_sv_account` | Contas de servicing | Verificar status, saldo, rating |
| `uown_los_lead` | Leads de aplicacao | Verificar status do lead, UW result |
| `uown_los_lead_short_code` | Short codes de lead (migrado de uown_los_lead) | Verificar short_code apos migracao V20260226100000 |
| `uown_sv_cctransaction` | Transacoes CC | Apos sweeps de CC |
| `uown_sv_achpayment` | Pagamentos ACH | Apos sweeps de ACH |
| `uown_sv_receivable` | Recebiveis | Verificar parcelas, EPO, due dates |
| `uown_sweep_logs` | Logs de sweep | Verificar execucao de qualquer sweep |
| `uown_scheduled_task` | Definicao de sweeps | Verificar cron, SQL, is_active |
| `uown_email_queue` | Fila de emails | Verificar correspondencia enviada |
| `uown_sv_protection_plan` | Plano de protecao | Verificar inscricoes/cancelamentos |
| `uown_sv_contract` | Contratos | Verificar status de e-sign |
| `uown_blacklist_*` | Listas negras | Verificar entradas de fraude |
| `uown_frequency_mods` | Mudancas de frequencia | Auditoria de mudancas |
| `uown_due_date_moves` | Movimentacoes de due date | Auditoria de ajustes |
| `qrtz_*` | Quartz scheduler | Estado dos jobs agendados |

---


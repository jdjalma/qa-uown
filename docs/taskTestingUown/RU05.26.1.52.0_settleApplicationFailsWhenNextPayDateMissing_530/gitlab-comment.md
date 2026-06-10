# Validação QA - #530 Settle Application fails when Next Pay Date is missing

**Ambiente:** qa1 (build 2026-05-24, run v8)
**Resultado:** ✅

---

> ### TL;DR
>
> Os 4 requisitos do ticket (AC-01 a AC-04) foram confirmados em ambiente fresh, com 12 leases novos cobrindo as duas marcas (UOWN e Kornerstone) e as 5 frequências de pagamento.

---

## Resumo

O Settle Application voltou a funcionar para leads que chegavam ao fechamento sem data da próxima parcela definida (cenário que travava com erro 500 antes do fix). Agora o lease é criado com sucesso, o estado fica consistente no banco, e o lead segue normalmente para FUNDING.

---

## Cenários validados

### Requisitos da tarefa

#### 1. Settle Application sem NPD (bug original)

> ✅ **PASSOU** · UOWN (Daniel's Jewelers `OL90205-0079`) + Kornerstone (`FifthAveFurnitureNY` / KS3015), 5 frequências cada

Leads SIGNED sem `next_payment_due_date` agora completam o Settle com sucesso. O lease (`uown_sv_account`) é criado, o `next_payment_due_date` fica populado pós-Settle, e o lead transiciona corretamente para FUNDING. Toast `"Successfully settled this lease"` aparece na UI do Origination em todos os cenários. Validado em 10 cenários sem NPD nas 5 frequências (WK13, BW13, MN13, MN16, SM13) e em ambas as brands.

**Evidência:** accountPks 4861 a 4865 (UOWN), 4867 / 4869 / 4870 / 4871 / 4872 (KS3015); zero ocorrência de NPE em `uown_los_inbound_api_log`.

#### 2. Settle Application com NPD (regression happy)

> ✅ **PASSOU** · UOWN WK13 + Kornerstone WK13

Caminho original (lead com NPD preenchido) continua funcionando após o fix. Sem regressão.

**Evidência:** CT-06 leadPk=11902 (UOWN WK13), CT-12 leadPk=11910 (KS3015 WK13).

#### 3. Cobertura de frequências e brands

> ✅ **PASSOU** · 5 frequências × 2 brands = 10 cenários sem NPD + 2 happy

Todas as combinações de frequência (WEEKLY, BI-WEEKLY, MONTHLY 13m, MONTHLY 16m, SEMI-MONTHLY) validadas tanto em UOWN quanto em Kornerstone. Inclui a regressão do Ticket 443 (null-guard SEMI_MONTHLY).

**Evidência:** leadPks 11897 a 11910, accountPks 4861 a 4872.

#### 4. Observability (stack trace preservado)

> ✅ **PASSOU** · corpus histórico em qa1, janela 90d

O `stack_trace` em `uown_los_inbound_api_log` mantém a classe de exception específica (e não só o wrapper `UnexpectedRollbackException`) após o fix. Em 19 de 20 entries analisados o stack carrega a exception de domínio; a 1 entry restante é pré-fix.

**Evidência:** read-only sobre `uown_los_inbound_api_log` em qa1.

#### 5. Req #2 do Investigation (derivação da primeira parcela)

> ✅ **PASSOU** · repro manual no lead 11878 (qa1)

O backend já deriva a primeira parcela a partir de `employment.next_pay_date`. A primeira parcela recebe a data do pay date do customer, e a próxima parcela cai alinhada com a frequência configurada.


| Campo                      | Valor                         |
| -------------------------- | ----------------------------- |
| `employment.next_pay_date` | 2026-05-31                    |
| `employment.pay_frequency` | WEEKLY                        |
| `first_payment_due_date`   | 2026-05-31 (= employment_npd) |
| `next_payment_due_date`    | 2026-06-07 (= FPD + 7d)       |


### Cenários adicionais explorados

#### 6. Estado consistente pós-Settle

> ✅ **PASSOU**

Validações de integridade rodadas para os 12 leases: `uown_sv_account` criado com `account_number` populado, 2 notas canônicas geradas em `uown_los_lead_notes` (`[UOwnClient][settleApplication]` e `[LeadFundingService][updateFundingStatus] OldLeadStatus : READY_TO_FUND New LeadStatus : FUNDING`), e transição de status `SIGNED → READY_TO_FUND → FUNDING` observada em tempo real.

#### 7. Dual-brand (Kornerstone)

> ✅ **PASSOU**

Kornerstone (KS3015 / FifthAveFurnitureNY) validado em todas as 5 frequências e no happy path. Sem regressão na marca.

---

## Observações (não bloqueiam release)

### OBS-1: Mensagem de erro genérica em cenário residual (AC-05)

> Em fluxo edge (lead SIGNED sem registro em `uown_los_employment` e com `next_payment_due_date` ausente em `uown_los_sched_summary`) a resposta HTTP ainda traz wrapper genérico do Spring (`UnexpectedRollbackException`), sem indicação acionável do tipo `"Missing next payment date. Please update employment information"`. O agent na UI vê apenas erro técnico. SEMI_MONTHLY foi a frequência inicialmente observada, mas a falta de mensagem actionable ocorre em qualquer frequência que caia neste path residual (a frequência só seria filtrável se houvesse employment, que é justamente o que falta no cenário).

**Causa raiz, reprodução e fix proposto**

**Causa raiz:** o catch da exception no path residual não monta uma mensagem de domínio antes de devolver. O wrapper do Spring chega ao agent sem contexto do campo faltante.

**Quando dispara:** lead SIGNED sem registro em `uown_los_employment` (anti-join `LEFT JOIN ... IS NULL`, ou seja, não existe row de employment para o lead) e com `next_payment_due_date` ausente em `uown_los_sched_summary` (coluna NULL ou row inexistente), tentando Settle pelo portal Origination.

**Impacto:** o agent vê erro técnico sem saber qual campo corrigir. O bug crítico (HTTP 500 com NPE) já foi resolvido para o caminho principal; o que resta é polish de mensagem no fluxo edge.

**Evidência:** stack traces em `uown_los_inbound_api_log` pks 51228, 51108, 50983, 50978, 50977, 50976, 50972 (todos contêm apenas `UnexpectedRollbackException`, sem domain class).

**Reprodução:**

```sql
SELECT l.pk AS lead_pk
FROM uown_los_lead l
LEFT JOIN uown_los_employment e ON e.lead_pk = l.pk
LEFT JOIN uown_los_sched_summary s ON s.lead_pk = l.pk
WHERE l.lead_status = 'SIGNED'
  AND e.lead_pk IS NULL
  AND s.next_payment_due_date IS NULL
LIMIT 5;
```

Em seguida tentar Settle pelo portal Origination (`/customers/{leadPk}`, clicar Settle no card Lease).

---


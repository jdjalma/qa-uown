---
name: activity-log-validation
description: Carregue ao planejar, implementar ou validar teste que dispara business action (signing, payment, refund, recovery, status transition, vendor callback). Toda ação relevante exige log em uown_los_lead_notes ou tabela equivalente — sem log = nada aconteceu.
disable-model-invocation: true
---

# Activity Log Validation — Regra Inviolável #13

## O princípio

> "If there is no activity log, that means nothing is happening."
> — Priyanka Namburu, daily UOWN 2026-04-28

Toda ação relevante de negócio **DEVE** ter activity log / note correspondente na DB. Ausência de log é **falha de implementação**, não comportamento aceitável.

## Quando aplicar

Sempre que o teste exercita:

- **Signing**: envio de contrato, signature event, completion, void
- **Payment**: attempt, success, failure, refund, EPO
- **Recovery / Arrangement**: nova arrangement, modify, default
- **Status transition**: pre-qualified → qualified → leased → signed → active → closed
- **Vendor callback**: Kount, SEON, DV360, GowSign, SignWell
- **Lead modification**: edit invoice, add document, change merchant
- **Communication**: email dispatch, SMS, OTP

## Procedimento

### 1. Antes de cada step de teste

Identifique a ação de negócio que o step dispara. Ex: "step 5 — agent confirma signing completion via portal".

### 2. Determine a tabela de log

Default: `uown_los_lead_notes`. Variantes por domínio:
- Signing events: `uown_los_lead_notes` + possível `uown_signing_event` (verificar via Grep)
- Payment: `uown_los_lead_notes` + `uown_payment_attempt`
- Vendor callbacks: `uown_los_lead_notes` + tabela específica do vendor
- **Move Due Date:** `uown_sv_activity_log` (NOT `uown_los_lead_notes` — account-centric action)

Consulte `docs/taskTestingUown/database-schema.md` ou Grep o nome do evento esperado.

### 3. Schema REAL de `uown_los_lead_notes` (confirmado 2026-05-20 via probe qa1)

**Colunas existentes**: `pk` (bigint), `agent` (varchar — frequentemente NULL), `row_created_timestamp`, `row_updated_timestamp`, `tenant_id`, `web_user_id`, `lead_pk`, `notes` (text).

⚠️ **NÃO EXISTEM** as colunas `note_type`, `body`, `content`, `author`, `created_by`, `created_at`. A tipagem é **prefixo dentro do texto**: `[ServiceName][methodName] mensagem`. Exemplos reais:
- `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true`
- `[ContractService][isLeaseOrLeaseModSigned] Lead starting status CONTRACT_CREATED`
- `[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING`

### 4. Adicione assertion DB com schema correto

```ts
import { db } from "@helpers/database.helpers.js";

const log = await db.waitForRecord<{ pk: number; notes: string; row_created_timestamp: Date }>({
  query: `SELECT pk, notes, row_created_timestamp
            FROM uown_los_lead_notes
           WHERE lead_pk = $1
             AND row_created_timestamp >= $2
             AND notes ILIKE $3
           ORDER BY row_created_timestamp DESC
           LIMIT 1`,
  params: [leadPk, triggerTs, '%[ContractService]%SIGNED%'],
  timeoutMs: 30_000,
});

expect(log).toBeDefined();
expect(log.notes).toMatch(/\[ContractService\].*SIGNED/i);
```

### 5. Valide conteúdo, não só presença

Log existir mas vazio é tão ruim quanto não existir. Cheque no `notes`:
- **Prefixo do serviço** (`[ESIGNSERVICE]`, `[ContractService]`, `[LeadFundingService]`, `[UOwnClient]`, `[LosRequestMessageConstraintValidator]`, etc.)
- **Verbo** no método (parse, validate, update, send, sign, void)
- **Identificador** (status novo/antigo, IDs, response codes)
- **Channel** quando aplicável (EMAIL, SMS, IN_PORTAL — extraído do texto)

## Output esperado em SPEC / report

Cada step com ação de negócio na SPEC **deve** ter linha "Activity log expected" e cada report deve cobrir presença + conteúdo:

```markdown
### Step 5 — Agent confirma signing
- Action: clicar "Confirm Signature" no portal Servicing
- API expected: POST /uown/svc/signing/{leadId}/confirm
- UI expected: badge muda para "Signed"
- **Activity log expected**: row em uown_los_lead_notes com `notes ILIKE '%[ContractService]%SIGNED%'`, lead_pk=:leadPk, row_created_timestamp >= trigger
```

## Move Due Date — log canônico em `uown_sv_activity_log` (svc#536, 2026-05-22)

Ação Move Due Date é **account-centric** — log vai em `uown_sv_activity_log`, NÃO em `uown_los_lead_notes`.

| Campo | Valor esperado |
|-------|----------------|
| `log_type` | `'DUE_DATE_MOVES'` |
| `account_pk` | accountPk preenchido |
| `lead_pk` | **NULL** |
| `creation_source` | `'USER_ACTION'` |
| `created_by` | usuário UI logado |
| `notes` | match `/^Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days$/` |

**Pitfall de timing:** backend lança `ResponseStatusException(BAD_REQUEST)` ANTES do `createOrUpdate` quando validação falha (ex: offset > cap WEEKLY). Log nunca chega a ser escrito — assertar ausência do log quando status = 400 é parte do CT negativo, não é gap de observabilidade.

**Pitfall cosmético — `"from dueDate"` no notes:** o `String.format` do backend vaza o nome da variável Java `dueDate` no user-facing log (ex: `"Due Date changed from dueDate 2026-05-30 by 3 days"`). Não é bug desta task. Assertar com a string exata conforme formato real, não "from date".

**Assertion template:**

```typescript
const log = await db.waitForRecord<{ notes: string; created_by: string }>({
  query: `SELECT notes, created_by
            FROM uown_sv_activity_log
           WHERE account_pk = $1
             AND log_type = 'DUE_DATE_MOVES'
             AND row_created_timestamp >= $2
           ORDER BY pk DESC LIMIT 1`,
  params: [accountPk, triggerTs],
  timeoutMs: 15_000,
});
expect(log.notes).toMatch(/Due Date changed from dueDate \d{4}-\d{2}-\d{2} by \d+ days/);
```

## Mapeamento canônico lead_pk vs account_pk

| Ação | Tabela de log | Chave | Exemplo de conteúdo |
|------|--------------|-------|---------------------|
| Settle Application | `uown_los_lead_notes` | `lead_pk` | `[UOwnClient][settleApplication]` + `[LeadFundingService][updateFundingStatus]` |
| Move Due Date | `uown_sv_activity_log` | `account_pk` | `log_type='DUE_DATE_MOVES'`, notes match `/Due Date changed from dueDate .../` |
| Payment attempt | `uown_los_lead_notes` | `lead_pk` | `[PaymentService]...` |
| Signing event | `uown_los_lead_notes` | `lead_pk` | `[ContractService][isLeaseOrLeaseModSigned]...` |

**Regra mnemônica:** ação sobre lead (pré-funding) → `uown_los_lead_notes (lead_pk)`; ação pós-funding sobre account → `uown_sv_activity_log (account_pk)`.
Source: live qa1 lead_pk=11748 / account_pk=4774 (svc#530, 2026-05-24).

## Settle Application — log canônico em `uown_los_lead_notes` (svc#530, 2026-05-24)

Ação Settle Application produz notas em `uown_los_lead_notes` com `lead_pk`:

| Padrão esperado em `notes` | Ordem |
|---------------------------|-------|
| `[UOwnClient][settleApplication]` (chamada ao client de Settle) | 1 |
| `[LeadFundingService][updateFundingStatus]` (transição de status) | 2 |

**Toast UI exato:** `"Successfully settled this lease"` (capturado ao vivo em qa1 lead 11748, 2026-05-24). Usar esta string exata em assertions de toast — não `"Settled successfully"` nem `"Lease settled"`.

**Diagnostic pattern — `termnull` smell:** se as notas de Settle contêm a string `"termnull"`, o lead foi afetado pelo bug NPD=null (svc#530 pré-fix). Query de diagnóstico: `SELECT COUNT(*) FROM uown_los_lead_notes WHERE notes ILIKE '%termnull%'` — zero rows confirma fix aplicado. Ver [[application-lifecycle]] pitfall #62.

**Assertion template:**

```typescript
const settleNote = await db.waitForRecord<{ notes: string }>({
  query: `SELECT notes FROM uown_los_lead_notes
           WHERE lead_pk = $1
             AND notes ILIKE '%[UOwnClient][settleApplication]%'
           ORDER BY pk DESC LIMIT 1`,
  params: [leadPk],
  timeoutMs: 120_000,  // 120s configurado; se retornar 0 rows, suspeitar TZ drift antes de aumentar — ver pitfall #66 (causa raiz) / #65 (SUPERSEDED)
});
expect(settleNote).toBeDefined();
expect(settleNote.notes).not.toContain('termnull');  // confirma NPD não nulo
```

## Gaps conhecidos (ações que NÃO geram log atualmente)

Catálogo de actions que confirmadamente **não** produzem nota — abrir ticket de observabilidade se o teste depender:

| Action | Tabela primária de evidência | Lead notes? | Confirmado em |
|---|---|---|---|
| `POST /uown/sendWelcomeEmail/{pk}` | `uown_email_queue` (template_name='Welcome', status=SENT) | **NÃO** (0/45 em 60d) | 2026-05-20 — qa1 — task #517 |
| `settledInFullAccountEmailSweep` | `uown_email_queue` (template_name=`SettledInFullEmail`, PK monotônico) | indeterminado | 2026-06-02 — dev3 |
| `RecurringPaymentReminderSweep` | `uown_email_queue` (template_name=`RecurringPaymentReminder`) | indeterminado | 2026-06-02 — dev3 |
| `FirstPaymentReminderSweep` | `uown_email_queue` (template_name=`FirstPaymentReminder`) | indeterminado | 2026-06-02 — dev3 |

### Tabelas de audit para email sweeps (dev3 2026-06-02)

- `uown_email_queue` — **evidência primária** (`pk, account_pk, lead_pk, template_name, status, sent_time, row_created_timestamp`). PK monotônico; assertir row nova de hoje.
- `uown_correspondence_logs` — `pk, account_pk, lead_pk, correspondence_type ('EMAIL'), template_name, error, row_created_timestamp`. ⚠️ `error` carrega texto informativo MESMO em sucesso — **NÃO** assertir `error IS NULL`.
- `uown_sweep_logs` — `pk, sweep_name, number_of_records_processed, row_created_timestamp`. ⚠️ `number_of_records_processed` é escrito APÓS o processamento; leitura `< 5s` após trigger retorna `0`. NÃO usar como evidência de sucesso. Ver [[payment-flows]] seção "Email Sweep validation" + [[application-lifecycle]] pitfalls #87-#90.

## Pitfalls

1. **Timing** — log pode ser assíncrono (callback, queue). Use `waitForRecord` com backoff, não query única.
2. **Idempotência** — reenvio de email gera novo log? Confirme: AC4 do "example.md" exige novo log no reenvio.
3. **Audit field vs display field** — `uown_los_lead_notes` mantém technical id; UI mostra friendly name. Validar **ambos** quando aplicável.
4. **Vendor callback latency** — Kount/SEON podem demorar minutos em sandbox. Não bater timeout curto demais.

## Anti-patterns

- ❌ Marcar teste verde quando UI mostra sucesso mas log não foi gravado — bug silencioso
- ❌ Pollar só por status na UI; UI pode estar cached
- ❌ Ignorar log faltante "porque não muda o resultado funcional" — viola regra inviolável #13
- ❌ Hardcode `note_type` string sem verificar valor real em produção/staging

## Cross-links

- Regra inviolável #13 em `CLAUDE.md`
- Skill [[qa-domain-reflexes]] — checklist completo de validações por ação
- Skill [[application-lifecycle]] — logs esperados em cada step do lifecycle
- Skill [[db-polling-pattern]] — como pollar log com backoff

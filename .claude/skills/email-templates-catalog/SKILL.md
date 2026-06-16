---
name: email-templates-catalog
description: Carregue ao planejar/implementar/validar teste que envolva templates de email (Welcome, Settled-in-Full, Verification, Late Payment, OTP). Catálogo de fatos confirmados — template_name, GCS bucket, schema das tabelas uown_email_queue e uown_los_lead_notes, gaps de observabilidade.
disable-model-invocation: true
---

# Email Templates Catalog — fatos confirmados via probe DB

> Fonte das confirmações: probe direto em qa1 (`scripts/probe_welcome.ts`, `scripts/probe_notes_schema.ts`). Atualize esta skill sempre que um novo fato for confirmado por probe (responsabilidade do `qa-doc-keeper`).

## 1. Tabela `uown_email_queue` — schema canônico

Tabela fonte da verdade para evidência de "email foi enviado". Sweep `triggerScheduledTask/emailSweep` é o worker que muda `status PENDING → SENT` e popula `sent_time`.

| Coluna | Tipo | Uso em validação |
|---|---|---|
| `pk` | bigint | identificador da linha |
| `account_pk` | bigint | filtro por conta (FK lease) |
| `lead_pk` | bigint | filtro por lead (origination) |
| `customer_pk` | bigint | FK customer |
| `merchant_pk` | bigint | 0 = sem merchant (ex.: Welcome) |
| `to_email_addresses` | text | comparar com email do customer |
| `from_email_address`, `from_email_name` | varchar | branding do remetente |
| `subject` | text | asserção de subject |
| `template_name` | varchar | **case-sensitive** — usar literal exato |
| `template_version` | varchar | normalmente NULL |
| `status` | varchar | `PENDING` (na fila) → `SENT` / `STORED` (entregue) |
| `queue_type`, `priority` | varchar | metadados de fila |
| `sent_time` | timestamp | NULL antes do sweep; populado após pickup |
| `picked_at_time`, `send_by_time` | timestamp | janela de SLA |
| `row_created_timestamp`, `row_updated_timestamp` | timestamp | use `row_created_timestamp >= trigger_ts` para filtrar |
| `email_body` | text | HTML completo entregue (use para extrair `<img src>`, validar placeholders) |
| `email_body_type` | varchar | `HTML` ou `TEXT` |
| `data_map` | text (json) | merge vars (FirstName, Amount, etc.) |
| `error_desc`, `response` | text | troubleshooting de envios falhos |

### Pattern padrão de validação de envio

```sql
SELECT pk, account_pk, lead_pk, to_email_addresses, subject,
 template_name, status, sent_time, email_body_type
 FROM uown_email_queue
 WHERE account_pk = :accountPk
 AND template_name = :templateName — case-sensitive
 AND row_created_timestamp >= :triggerTs
 ORDER BY row_created_timestamp DESC
 LIMIT 1;
```

Asserções mínimas: linha existe; `status='SENT'`; `sent_time IS NOT NULL`; `to_email_addresses` casa com email; `email_body_type='HTML'`.

## 2. Catálogo de `template_name` (valor exato — case-sensitive)

| template_name | Trigger | Brand-aware? | Activity log em lead_notes? | Confirmado |
|---|---|---|---|---|
| `Welcome` | `POST /uown/sendWelcomeEmail/{accountPk}` | sim (UOWN ↔ KS) após #517 | ❌ NÃO (gap) | 2026-05-20 qa1 (45 envios) |
| `SettledInFullEmail` | sweep `settledInFullAccountEmailSweep` | indeterminado | indeterminado | 2026-06-02 dev3 |
| `RecurringPaymentReminder` | sweep `RecurringPaymentReminderSweep` | indeterminado | indeterminado | 2026-06-02 dev3 |
| `FirstPaymentReminder` | sweep `FirstPaymentReminderSweep` | indeterminado | indeterminado | 2026-06-02 dev3 |

> Adicione novas linhas conforme outros templates forem probados. Inclua coluna "Confirmado em" com env + data — sem isso a entrada vira folclore.

> ⚠️ `src/scripts/dev3-trigger-sweeps.ts` usa o template ERRADO `SettledInFullAccountEmail` (com `Account`) e porta ERRADA `5446` — NÃO copiar desse arquivo. O `template_name` real é `SettledInFullEmail` (sem `Account`). Confirmado em `email-sweeps-servicing.spec.ts`, dev3 2026-06-02. Condições de seleção e janela DOW de cada sweep: [[payment-flows]] seção "Email Sweep validation + selection conditions" + [[application-lifecycle]] pitfalls #87-#90.

## 3. Image hosting — domínio GCS aprovado

**Allow-list confirmada**: `https://storage.googleapis.com/uown/<filename>` (bucket = `uown`).

Imagens conhecidas no template Welcome atual (pré-#517):
- `logo_top_62.png` (+ `@2x.png`)
- `icon-facebook.png`
- `icon-twitter.png` *(será substituído por `icon-linkedin.png` na #517 para UOWN)*
- `icon-instagram.png`
- `logos-05.png` (+ `@2x.png`)

Regex de validação (negative — qualquer URL fora dessa allow-list falha):
```regex
<img[^>]+src="(?!https://storage\.googleapis\.com/uown/)
```

Inclua também CSS background images: `background(?:-image)?:url\(["']?([^"')]+)`.

## 4. Sweep — `emailSweep`

**Endpoint**: `POST {svc}/uown/svc/triggerScheduledTask/emailSweep` — pega rows `PENDING`, dispara via SendGrid, popula `sent_time` e muda `status` para `SENT` (também já visto `STORED`).

**Disponibilidade confirmada**: dev1, qa1.
**Indeterminado** (requer VPN): stg, qa2.

Pattern: `trigger` → `sweep` → `polling DB sent_time IS NOT NULL` → `polling IMAP inbox`.

Helpers existentes em `src/helpers/settled-in-full.helpers.ts`:
- `getEmailQueueRecord(db, toEmail, accountPk, templateHint)` — single fetch
- `waitForEmailQueueRecord(...)` — com polling exponencial
- `waitForEmailQueueDispatched(db, queuePk, timeoutMs)` — espera `sent_time IS NOT NULL`
- `countEmailQueueRows(db, accountPk, sinceTs)` — baseline / idempotência

## 5. `uown_los_lead_notes` — schema real (CORREÇÃO 2026-05-20)

Confirmado por probe que a tabela **NÃO tem** `note_type`. Schema real:

| Coluna | Tipo | Notas |
|---|---|---|
| `pk` | bigint | |
| `agent` | varchar | quase sempre NULL (logs system) |
| `row_created_timestamp` | timestamp | use isto, não `created_at` |
| `row_updated_timestamp` | timestamp | |
| `tenant_id` | bigint | |
| `web_user_id` | bigint | |
| `lead_pk` | bigint | filtro principal |
| `notes` | text | conteúdo livre, tipagem como prefixo |

**Tipagem implícita** — formato observado:
```
2026-05-18T13:22:46.293Z : [ServiceName][methodName] mensagem livre
```

Exemplos reais (lead 11407):
- `[ESIGNSERVICE][parseCCPeekConsent] CC Peek Consent set to true`
- `[ContractService][isLeaseOrLeaseModSigned] Lead starting status CONTRACT_CREATED`
- `[LeadFundingService][updateFundingStatus] Update Lead Status to FUNDING`

Validação correta:
```sql
SELECT pk, notes, row_created_timestamp
 FROM uown_los_lead_notes
 WHERE lead_pk = :leadPk
 AND row_created_timestamp >= :triggerTs
 AND notes ILIKE '%[ContractService]%SIGNED%';
```

## 6. Gaps confirmados de observabilidade

| Action | Gap | Workaround | Reportar? |
|---|---|---|---|
| Welcome Email | Não cria nota em lead_notes | Usar `uown_email_queue` como evidência primária | Sim — pitfall em `activity-log-validation` |
| `uown_correspondence_logs.error` | Campo carrega texto informativo MESMO em sucesso (dev3 2026-06-02) | NÃO assertir `error IS NULL` para validar sucesso de envio — usar presença de row em `uown_email_queue` | Não (comportamento de log, não bug) |

## 7. IMAP — leitura do email entregue

Inbox compartilhada: `fintechgroup777@gmail.com` (ver memory `reference_imap_fintechgroup777`).

Plus-addressing por runId para isolar entre testes/workers:
```ts
import { uniqueEmail, RUN_ID } from '@helpers/index.js';
const customerEmail = uniqueEmail(`517-${RUN_ID}-uown`);
```

Helper: `src/helpers/email.helpers.ts` — `snapshotInboxUid` → `getEmailContent` / `getEmailLink`.

**Regra**: clicar no link real (não usar URL do payload API) para fluxos que envolvem CTA — ver memory `feedback_email_imap_click_link`.

## 8. Como manter esta skill atualizada (qa-doc-keeper)

Esta skill é **catálogo vivo de fatos probados**, não documentação de teoria. Toda vez que:

1. Um novo template é descoberto / criado → adicionar linha na §2.
2. Um novo bucket / domínio de imagem aparece → atualizar §3.
3. Schema da tabela mudar (nova migration) → re-probar e atualizar §1 ou §5.
4. Um gap de log for confirmado / fechado → atualizar §6.

**Comando de re-probe** (rodar quando suspeitar de drift):
```bash
npx tsx scripts/probe_welcome.ts QA1
npx tsx scripts/probe_notes_schema.ts QA1
```

Sempre incluir **data de confirmação + env** ao adicionar uma linha. Sem isso a info vira folclore e o próximo agente não saberá se ainda é verdade.

## Cross-links

- Skill [[activity-log-validation]] — schema correto de lead_notes (referencia esta skill)
- Skill [[db-polling-pattern]] — patterns de polling
- Memory `reference_imap_fintechgroup777`
- `docs/taskTestingUown/database-schema.md` — schema canônico (deve refletir esta skill)

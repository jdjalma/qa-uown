---
name: db-polling-pattern
description: Carregue ao validar resultado assíncrono no DB (callback de vendor, activity log, status transition, sweep task). Use waitForRecord com backoff exponencial, nunca query única + sleep. Polling é prevenção de flakiness — não otimização.
disable-model-invocation: true
---

# DB Polling Pattern

## Quando aplicar

Sempre que precisar validar um efeito assíncrono no DB:

- Activity log (regra inviolável #13)
- Callback de vendor (Kount, SEON, DV360, GowSign)
- Status transition disparada por background job
- Sweep task (scheduled)
- Payment settlement

**NÃO use** para validação síncrona (response de API imediato). Use `expect` direto.

## Procedimento

### Helper canônico

```ts
import { db } from "@/helpers/database.helpers";

const log = await db.waitForRecord({
 table: "uown_los_lead_notes",
 filter: { lead_id: leadId, note_type: "SIGNING_COMPLETED" },
 timeoutMs: 30_000,
 intervalMs: 500, // primeiro intervalo, depois cresce
 maxIntervalMs: 5_000,
});
```

### Política de backoff

```
attempt 1: t=0 (imediato — pode já estar lá)
attempt 2: t=500ms
attempt 3: t=1.5s (cresce 1.5x ou 2x)
attempt 4: t=3.5s
attempt 5: t=7.5s (cap em 5s para próximos)
...
```

Backoff exponencial é importante porque:
- Carga no DB de teste cai quando o evento demora
- Logs ficam menos poluídos
- Falsos negativos por race são mais raros

### Quando usar polling vs `waitForRecord`

| Caso | Helper |
|------|--------|
| Esperar 1 row específica aparecer | `db.waitForRecord({ filter })` |
| Esperar count >= N | `db.waitForCount({ filter, min: N })` |
| Esperar campo mudar (UPDATE) | `db.waitForChange({ filter, field, expected })` |
| Validação imediata após resposta API síncrona | `db.getSingleRow` (sem polling) |

(Verifique nomes exatos em `src/helpers/database.helpers.ts`.)

## Pitfalls

### 1. `setTimeout` + 1 query
```ts
// ❌ Anti-pattern — flakiness garantida
await page.waitForTimeout(5000);
const row = await db.query("SELECT ...");
expect(row).toBeDefined;
```
Se o evento demora 6s nesse ambiente, falha. Se chega em 100ms, perdeu 4.9s. Use `waitForRecord`.

### 2. Timeout curto demais
- Activity log síncrono: 5–10s
- Activity log de Settle Application em qa1: **120s** configurado — mas se polling retorna 0 rows mesmo com 120s, suspeitar de TZ drift (pitfall #6 abaixo) ANTES de aumentar mais o timeout. Ver [[application-lifecycle]] pitfall #66 (TZ drift, causa raiz real) e #65 (SUPERSEDED — timeout era tratamento de sintoma).
- Vendor callback (Kount/SEON): 30–60s
- DV360 / fraud externo: até 2min em sandbox
- Sweep task: depende do schedule — verificar `uown_sv_sql_config` ou config docs

### 3. Filter muito amplo
```ts
// ❌ Ambíguo se múltiplos eventos do mesmo lead
filter: { lead_id }
```
Sempre inclua `note_type` ou outro discriminador.

### 4. Cleanup ausente
Polling acumula latência se a row ficou de uma execução anterior. Garanta cleanup ou use timestamp/runId no filter:
```ts
filter: { lead_id, created_at_gte: testStartedAt }
```

### 6. `timestamp without time zone` vs UTC comparison (2026-05-22)

`Date.toISOString` produces a UTC `Z` string. Comparing that against a Postgres `timestamp without time zone` column breaks silently when the DB host TZ differs from UTC — the predicate becomes false because Postgres interprets the literal without offset conversion.

```typescript
// ❌ Broken on hosts with TZ ≠ UTC
filter: { created_at_gte: new Date.toISOString } // "$1 = '2026-05-22T09:00:00.000Z'" fails to match a UTC+3 host row
```

**Safe alternatives (in order of preference):**
1. **Fresh-data + count-only assertion:** assert `count >= 1` where `pk > $snapshotPk` (avoids timestamp entirely).
2. **Cast to UTC in SQL:** `WHERE created_at AT TIME ZONE 'UTC' > $1` (explicit, works regardless of host TZ).
3. **Correlation by unique marker:** use `source_uuid`, `x-run-id`, or similar inserted with the action (see pitfall #34 in [[application-lifecycle]]).

**Detection:** query `SELECT now, current_setting('TimeZone')` — if TZ ≠ UTC, timestamp comparisons against Node JS Date values are unreliable.

### 7. SQL projection vs JPA entity drift (2026-05-22)

Writing raw SQL that projects columns that do NOT exist in the actual table causes silent failures (0 rows from `waitForRecord`) or Postgres errors swallowed by catch blocks.

**Canonical example:** spec draft projected `scheduled_due_date` and `new_due_date` from `uown_due_date_moves` — neither column exists. Real columns: `pk, agent, row_created_timestamp, row_updated_timestamp, tenant_id, web_user_id, account_pk, agent_username, moved_by_days, moved_from_due_date, is_fpd_change, adjustment_type`.

**Rule:** before projecting any column from a table not already in the catalog, run:
```sql
SELECT column_name, data_type
 FROM information_schema.columns
 WHERE table_name = 'uown_due_date_moves'
 ORDER BY ordinal_position;
```
Never assume column names from entity field names, DTO names, or issue title wording.

### 5. Conexão DB exposta no teste
Use o helper. Não abrir `pg.Client` direto no spec — viola layering e quebra connection pool.

### 8. Loop `while/for` + `sleep()` re-implementa `pollUntil`/`waitForRecord` (DRY)

O `sleep()` (`@helpers/index.js`) é o helper do projeto que vira substituto de `page.waitForTimeout` — e por isso escapa do ban de `waitForTimeout`. Mas **`sleep()` dentro de um loop que espera uma condição é o mesmo anti-pattern**: re-implementa à mão o `pollUntil` (cujo próprio docstring diz "Primitivo compartilhado — antes reimplementado em database/esign-db/settled-in-full").

```ts
// ❌ Hand-rolled poll loop — re-implementa pollUntil, cadência fixa, polui o spec
while (Date.now() < deadline) {
  await sleep(5_000);
  const row = await db.getSingleRow('SELECT ... WHERE pk=$1', [pk]);
  if (row) break;
}

// ✅ Helper compartilhado — backoff exponencial, um lugar para ajustar timing
const row = await pollUntil(
  () => db.getSingleRow('SELECT ... WHERE pk=$1', [pk]),
  { timeoutMs: 120_000, logPrefix: 'sticky-recover' },
);
// ✅ ou, para uma row de tabela conhecida:
const note = await db.waitForRecord('SELECT ... WHERE lead_pk=$1 ORDER BY pk DESC LIMIT 1', [leadPk]);
```

**`sleep()` nu (fora de loop de condição) só é aceitável** para um delay de propagação externa que NÃO tem condição observável (ex: dar tempo a um webhook de vendor antes da PRIMEIRA query, sweep async sem flag de status) — e sempre com comentário de uma linha justificando. Retry de navegação (`for (attempt) { try goto; catch { await sleep(backoff) } }`) é uso legítimo de sleep como backoff entre tentativas, não espera condicional.

**Como detectar (auditoria):** `grep -rn -B6 "await sleep(" tests/` → todo `sleep` precedido por `while (`/`for (` que consulta DB/estado é candidato a `pollUntil`/`waitForRecord`. Origem: auditoria DRY 2026-06-23 — ~30 loops hand-rolled re-implementando o primitivo em specs de domínio (sticky, seon, gowsign).

## Output esperado

Cada step que valida efeito async tem:
1. Action que disparou
2. `await db.waitForRecord({ ... })` com timeout adequado ao tipo
3. Assertion de conteúdo (não só presença — ver skill `activity-log-validation`)

## Cross-links

- Skill [[activity-log-validation]] — primeiro consumidor desse padrão
- Skill [[helpers-catalog]] — verifica nomes/assinaturas reais dos helpers
- Source: `src/helpers/database.helpers.ts`

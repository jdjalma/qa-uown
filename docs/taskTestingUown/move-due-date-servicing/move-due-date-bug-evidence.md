# 🔴 BUG [CONFIRMADO] — Move Due Date quebrado no Servicing UI (trailing slash + Spring Boot 3)

> Descoberto via teste exploratório UI-first (MCP Playwright) em dev3, 2026-06-03.
> Classificação `[CONFIRMADO]` (regra #10): reproduzido deterministicamente, causa raiz na fonte, fix localizado.

## TL;DR
A ação **Move Due Date** (página "Due Amounts" / `/scheduled-payments/{accountPk}`) **falha silenciosamente** no Servicing UI. O usuário preenche o modal, clica SAVE, e a data **não move** — aparece um toast de erro `"No static resource uown/svc/moveDueDatesByDays/{pk}."`. Causa: o frontend monta a URL com uma **barra extra antes do `?`** e o backend (Spring Boot 3) rejeita com 404.

## Reprodução (UI)
1. Login Servicing (dev3) → conta ACTIVE (ex: 219) → menu "Due Amounts"
2. Botão "Move Due Date" → modal abre (Scheduled Due Date + New Due Date)
3. Selecionar data agendada (06/09/2026), New Due Date = 06/11/2026 (+2 dias, dentro do cap WEEKLY=3d)
4. SAVE → **toast: "No static resource uown/svc/moveDueDatesByDays/219."** → data permanece 06/09/2026

## Causa raiz (isolada)
**Network request capturado (MCP):**
```
POST https://svc-website-dev3.uownleasing.com/uown/svc/moveDueDatesByDays/219/?fromDueDate=2026-06-09&moveNumberOfDays=2  → 404
                                                                            ^ barra extra antes do ?
```

**Prova determinística (curl na API):**
| Request | Resultado |
|---------|-----------|
| `POST /uown/svc/moveDueDatesByDays/219?fromDueDate=...&moveNumberOfDays=2` (SEM barra) | **200** — data move, cria row em `uown_due_date_moves` (pk=11, moved_by_days=2, type=SCHEDULE_SHIFT) |
| `POST /uown/svc/moveDueDatesByDays/219/?fromDueDate=...&moveNumberOfDays=2` (COM barra) | **404** "No static resource" |

**Por que 404:** Spring Boot 3 desabilitou trailing-slash path matching por padrão (`setUseTrailingSlashMatch(false)`). O controller `SvcReceivableController.java:117` declara `@PostMapping("/moveDueDatesByDays/{accountPk}")`, que casa `/moveDueDatesByDays/219` mas NÃO `/moveDueDatesByDays/219/`.

**Linha exata no frontend:**
```
servicing/domain/stores/payment.tsx:408
  url: `/uown/svc/moveDueDatesByDays/${accountPk}/?fromDueDate=${fromDueDate}&moveNumberOfDays=${numOfDays}`,
                                                 ^ remover esta barra
```
É o **único** URL no frontend inteiro com o padrão `/${...}/?` (confirmado por grep em `domain/`, `components/`, `pages/`). Os demais endpoints (ex: payment.tsx:112, customer.tsx:1309/1325) não têm a barra.

## Fix sugerido
```diff
- url: `/uown/svc/moveDueDatesByDays/${accountPk}/?fromDueDate=${fromDueDate}&moveNumberOfDays=${numOfDays}`,
+ url: `/uown/svc/moveDueDatesByDays/${accountPk}?fromDueDate=${fromDueDate}&moveNumberOfDays=${numOfDays}`,
```
Alternativa (backend, menos cirúrgica): reabilitar trailing-slash match globalmente no svc. Preferir o fix do frontend (1 caractere, escopo isolado).

## Escopo / impacto
- **Ambientes afetados:** dev3 E stg (ambos retornam 404 com barra; 200 sem barra) → **não é gap de provisioning, é bug de código deployado em ambos**.
- **Feature 100% quebrada via UI** em qualquer env rodando svc Spring Boot 3.
- Backend está **correto** — o endpoint funciona perfeitamente sem a barra (move a data + grava log).

### Impacto DUPLO: o 404 mascara as validações do backend (confirmado conta 223, 2026-06-03)
Reproduzido com `moveNumberOfDays=-26` (move inválido — estoura cap WEEKLY=3d):
| Request | Resposta |
|---------|----------|
| COM barra `/223/?fromDueDate=2026-06-30&moveNumberOfDays=-26` | **404** "No static resource" |
| SEM barra `/223?fromDueDate=2026-06-30&moveNumberOfDays=-26` | **400** `"Due date offset cannot exceed 3 days for WEEKLY frequency"` |

A barra extra não só quebra moves válidos — ela **engole as mensagens de validação legítimas** do backend. O agente vê um `404 No static resource` genérico em vez de `"cannot exceed 3 days for WEEKLY"`, e nunca entende por que o move falhou. Pior UX do que falha-silenciosa: é falha-com-mensagem-errada.

## Lição QA — por que UI-first (regra #15) pegou e API-only mascararia
Nosso próprio api client `src/api/clients/account.client.ts:59` monta a URL **sem** a barra:
```
/uown/svc/moveDueDatesByDays/${accountPk}?moveNumberOfDays=${moveNumberOfDays}
```
→ um teste **API-only teria passado (200)** e **nunca detectaria** o bug, porque o bug está na construção de URL do frontend, não no backend. Só exercitar o fluxo real via browser (regra #15) expõe o defeito. Mesmo padrão da origem da regra #15 (BUG-01 GowSign placeholders, 2026-05-06).

## Próximos passos
1. Abrir bug no frontend (servicing) — fix de 1 caractere em `payment.tsx:408`. Escalar ao dev.
2. Verificar se o time tem lint/regra contra `/${...}/?` (poderia haver outros latentes em outros repos pós-migração Spring Boot 3).
3. Após fix do frontend: implementar o spec E2E `move-due-date-servicing.spec.ts` que exercita o fluxo via browser e assere `uown_due_date_moves` + log `DUE_DATE_MOVES` (regra #13). O spec deve FALHAR enquanto o bug existir (asserir comportamento correto: data move).

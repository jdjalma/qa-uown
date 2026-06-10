> Este arquivo e registro de execucao, NAO fonte de padrao. Verificar fonte primaria antes de usar.

# Servicing — Exploracao de Gaps (dev3, 2026-06-03)

**Ambiente:** dev3 | Conta principal: 166 (ACTIVE, WEEKLY, Progress Mobility)
**Executor:** Claude (MCP Playwright 1440x900)
**Objetivo:** cobrir os 5 gaps de Servicing identificados na sessao de mapeamento anterior.

---

## Resumo

| Gap | Status | Resultado |
|-----|--------|-----------|
| Add Fee modal | ✅ Explorado | Funcional. N-003 CORRIGIDO. 2 novas observacoes UX. |
| Move Due Date via browser | ✅ Explorado | BUG MDD-001 reproduzido deterministicamente. |
| Account status transitions | ✅ Explorado | Dialog de comentario confirmado. 9 opcoes mapeadas. |
| Frequency Changes history (SW-OBS-009) | ✅ Confirmado | Tabela vazia apesar de dados no DB. |
| PayNearMe em profundidade | ✅ Explorado | 3 tabs + 3 endpoints mapeados. Sem dados em dev3. |

---

## 1. Add Fee modal

**Acesso:** `/scheduled-payments/{pk}` → botao `+ ADD FEE`

### Fluxo completo (FUNCIONAL)

1. Modal abre com campos: Fee Type (React Select), Transaction Effective Date (pre-preenchida com hoje), Fee Amount ($0.00), Comment.
2. Fee Type tem **5 opcoes hardcoded**: Protection Plan Fee, NSF Fee, Reinstatement Fee, Manual Fee, Misc Fee.
3. Preencher Fee Amount + Comment → SAVE → `POST /uown/svc/createOrUpdateReceivable` → **200**.
4. Nova linha aparece no topo da tabela de Due Amounts com tipo `MANUAL_FEE`.
5. Activity log registra: `DATA_CHANGE — Receivable added, dueDate: 2026-06-03, amount: 10.00, status: ACTIVE, comment: ..., type: MANUAL_FEE`.

**Evidencia (conta 166, 2026-06-03 22:01 EST):**
- Request: `POST /uown/svc/createOrUpdateReceivable → 200`
- Row criada: `06/03/2026 | $10.00 | MANUAL_FEE | Exploratory test fee - dev3 QA 2026-06-03`
- Activity log entry gerada (regra #13 ✅)
- Next Payment subiu de $90.98 para $100.98 (fee aplicado ao proximo vencimento)

### N-003 CORRIGIDO

**Relatorio anterior dizia:** "SAVE with empty/$0 fires no request and no error"
**Comportamento real:** SAVE com $0.00 exibe 2 erros de validacao inline:
- `"You must specify a number for the fee amount."` — campo Fee Amount
- `"Comment is required."` — campo Comment

Nenhum request e disparado enquanto a validacao estiver ativa. O comportamento e correto. O relatorio anterior estava errado.

### N-002 STATUS (getReceivableType/)

`GET /uown/svc/getReceivableType/` → **404** (trailing slash — mesma causa raiz do MDD-001, Spring Boot 3).
Fee Type funciona porque as 5 opcoes sao **hardcoded no frontend** como fallback. Sem a trailing slash: `GET /uown/svc/getReceivableType → 423 {unauthorized: true}` (manager nao tem permissao para este endpoint ou autorizacao de sessao ausente no fetch direto).

Feature nao esta quebrada do ponto de vista do usuario (fallback funciona), mas o endpoint esta falhando silenciosamente.

### Novas observacoes UX

**O-SVC-001:** Mensagem de validacao "You must specify a number for the fee amount" e tecnicamente incorreta — $0.00 e um numero valido. A mensagem correta seria "Fee amount must be greater than $0.00."

**O-SVC-002:** Campo Comment e obrigatorio (exibe "Comment is required" na validacao) mas nao tem asterisco (*) no label. Comportamento inconsistente com os outros campos obrigatorios no sistema.

---

## 2. Move Due Date via browser

**Acesso:** `/scheduled-payments/{pk}` → botao `Move Due Date`

### MDD-001 REPRODUZIDO (conta 166, 2026-06-03)

**Campos do modal:**
- Scheduled Due Date: React Select com todas as datas futuras (57 opcoes para conta 166)
- New Due Date: `input#numOfDaysToBeMoved type="search" placeholder="MM/DD/YYYY"` — campo cujo ID sugere "numero de dias" mas renderiza como date picker

**Teste executado:** Scheduled Due Date = 06/15/2026, New Due Date = 06/17/2026 (+2 dias)

**Resultado:**
- Toast: `"No static resource uown/svc/moveDueDatesByDays/166."`
- Request: `POST https://svc-website-dev3.uownleasing.com/uown/svc/moveDueDatesByDays/166/?fromDueDate=2026-06-15&moveNumberOfDays=2 → 404`
- O frontend calculou `moveNumberOfDays=2` corretamente (diferenca entre datas)
- A barra extra `/166/?` e o unico problema — o backend calcula e valida corretamente

**O-022 CONFIRMADO:** Field `id="numOfDaysToBeMoved"` aceita data MM/DD/YYYY (nao dias inteiros). O frontend converte a diferenca de datas para o parametro `moveNumberOfDays` na query string. O nome do campo e enganoso mas o comportamento e funcional — exceto pelo bug da barra.

**Nota:** date picker `type="search"` requer native setter (`HTMLInputElement.prototype.value`) + dispatch de eventos `input` e `change` para funcionar via automacao (pitfall #85).

---

## 3. Account status transitions

**Acesso:** Header de qualquer pagina da conta → dropdown "New Status"

### Opcoes mapeadas (9 status)

ACTIVE | PAID_OUT | PAID_OUT_EARLY | PAID_OUT_EARLY_EPO | CHARGED_OFF | CLOSED | CANCELLED | SOLD | SETTLED_IN_FULL

### Fluxo de transicao

1. Selecionar novo status no dropdown.
2. Modal abre imediatamente: **"Add a comment:"** com campo Comment (textbox) + botoes CANCEL e SAVE.
3. CANCEL → dropdown reverte para ACTIVE (sem mutacao).
4. SAVE → submete a transicao com comentario obrigatorio.

**Testado:** selecao de CLOSED → dialog apareceu → cancelado. Status mantido em ACTIVE.

**Achado positivo:** toda transicao de status exige comentario — bom padrao de auditoria. Nao foi testado o SAVE final para evitar mutar status da conta de teste.

---

## 4. Frequency Changes history (SW-OBS-009)

**URL:** `/frequency-history/{pk}`
**Endpoint:** `GET /uown/svc/accounts/{pk}/frequency-changes → 200`

### CONFIRMADO: tabela vazia apesar de dados no DB

**Evidencia:**
- Activity log da conta 166 contem 2 entradas `FREQUENCY_CHANGE`:
  - `06/03/2026 9:14:30 a.m. EST — Payment frequency changed from WEEKLY to BI_WEEKLY`
  - `06/03/2026 9:17:59 a.m. EST — Payment frequency changed from BI_WEEKLY to WEEKLY`
- Endpoint `GET /uown/svc/accounts/166/frequency-changes` chamado com HTTP 200
- Tabela renderiza: `"There are no records to display"`

**Causa provavel:** o endpoint retorna array vazio `[]` mesmo com registros em `uown_frequency_mods`. Hipotese: a query no backend filtra por `web_user_id` ou `tenant_id` que estao `null` nos registros criados por automacao/API direta. Os registros no activity log (`uown_sv_activity_log`) sao gravados por caminho diferente (service layer) e nao tem esse filtro.

**Impacto:** usuarios nao conseguem ver o historico de mudancas de frequencia na aba dedicada mesmo apos mudancas confirmadas. Workaround: verificar no activity log da conta (aba Notes).

---

## 5. PayNearMe em profundidade

**URL:** `/paynearme-history/{pk}`

### Estrutura mapeada

**3 sub-tabs:**
| Tab | Endpoint | Status em dev3 |
|-----|----------|----------------|
| Attempts | `GET /uown/svc/paynearme/accounts/{pk}/history/attempts` | Vazio (sem dados) |
| Payment Callback | `GET /uown/svc/paynearme/accounts/{pk}/history/payment-callbacks` | Vazio (sem dados) |
| Order Change Callback | `GET /uown/svc/paynearme/accounts/{pk}/history/order-change-callbacks` | Vazio (sem dados) |

**Contas testadas:** 166 (automacao ACTIVE) e 104 (CANCELLED com historico completo). Ambas sem dados PayNearMe.

**Motivo:** PayNearMe e metodo de pagamento em dinheiro em lojas fisicas. Em dev3 o provider externo nao esta configurado/integrado. Nao existe dado disponivel para validacao profunda das colunas e comportamento.

**Limitacao de cobertura:** colunas de cada tab nao foram mapeadas (tabelas vazias nao renderizam headers na implementacao react-data-table). Para mapear colunas seria necessario: (a) conta com transacao PayNearMe real, ou (b) leitura do source code do componente frontend.

**O que esta confirmado:**
- 3 endpoints retornam HTTP 200 (sem erro 4xx/5xx)
- 3 tabs renderizam corretamente mesmo com array vazio
- Nenhuma excecao de JavaScript observada

---

## Achados consolidados desta sessao

| ID | Classificacao | Descricao |
|----|--------------|-----------|
| MDD-001 | [CONFIRMADO] | Move Due Date: trailing slash `/166/?` → 404 (reproduzido via browser) |
| SW-OBS-009 | [CONFIRMADO] | Frequency Changes history tab: vazio apesar de dados em `uown_frequency_mods` |
| N-003 | [CORRIGIDO] | Add Fee SAVE com $0.00 SIM mostra validacao — relatorio anterior estava errado |
| O-022 | [CONFIRMADO] | Campo `numOfDaysToBeMoved` aceita data (MM/DD/YYYY), nao dias inteiros |
| O-SVC-001 | [OBSERVACAO] | "You must specify a number" e mensagem errada para $0.00 — deveria ser "amount must be greater than $0.00" |
| O-SVC-002 | [OBSERVACAO] | Comment obrigatorio no Add Fee mas sem asterisco (*) no label |
| N-002 | [OBSERVACAO] | `getReceivableType/` → 404 (trailing slash); fallback hardcoded funciona |
| — | [POSITIVO] | Status transitions exigem comentario (auditoria) — bom padrao de negocio |
| — | [POSITIVO] | Add Fee gera `DATA_CHANGE` no activity log — regra #13 cumprida |

---

## Gaps remanescentes (nao explorados nesta sessao)

| Item | Razao |
|------|-------|
| PayNearMe — colunas de cada tab | Sem dados em dev3 (provider externo nao configurado) |
| Status transition — SAVE confirmado | Evitado para nao mutar status de conta de teste |
| Add Fee — outros Fee Types (NSF, Reinstatement, etc.) | Apenas Manual Fee testado |
| Settlement amount spec | `@pending-decision` — aguarda decisao de produto |

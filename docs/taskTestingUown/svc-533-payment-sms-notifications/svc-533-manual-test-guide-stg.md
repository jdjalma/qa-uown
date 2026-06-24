# Roteiro de Teste Manual — #533 Send SMS Notifications Alongside Payment Emails (stg)

> Baseado no QA Report de qa2 (account_pk 11571, 2026-06-23). Adapta os mesmos cenários para o ambiente **stg**.

---

## Contexto da tarefa

A feature envia, em paralelo ao email de status de pagamento já existente:
- **SMS de aprovação** → `template_name = PaymentReceiptSms` em `uown_sms_queue`
- **SMS de recusa** → depende da flag `send.payment.decline.sms = true` em `uown_configuration_management`

**Diferença crítica qa2 → stg:**
- Em qa2 a flag `send.payment.decline.sms` estava ausente (default false) e o cartão de recusa `4000 3006 1111 2224` foi bloqueado no pré-auth de registro. Verificar ambas as condições em stg antes de iniciar TC-02.

---

## Pré-requisitos

| Item | Detalhe |
|---|---|
| Acesso ao Servicing portal stg | `https://svc-website-stg.uownleasing.com` |
| Credenciais | `MANAGER_USERNAME` / `MANAGER_PASSWORD` do arquivo `.env.stg` |
| Acesso ao DB stg | Túnel local na porta 5445 (confirmar env antes de usar — ver Passo 0) |

> **Atenção — túnel de DB (porta 5445):** o túnel pode estar apontando para outro ambiente sem aviso.  
> Antes de qualquer query, confirme com:  
> `SELECT MAX(pk) FROM uown_sv_account;`  
> Compare o valor retornado com o `account_pk` que você vai encontrar no Passo 1. Se o número for muito menor que o esperado para stg, o túnel está errado.

---

## Passo 0 — Confirmar identidade do DB stg

Execute as queries abaixo no túnel 5445 antes de qualquer ação:

```sql
-- Confirmação de ambiente
SELECT MAX(pk) AS max_account_pk FROM uown_sv_account;
```

Valores de referência stg (2026-06-23): `MAX(pk)` fica na faixa 620.000–625.000.  
Se retornar faixa muito diferente, redirecione o túnel para o host correto antes de continuar.

---

## Passo 1 — Encontrar conta elegível para teste em stg

Critérios: conta ativa, com valor vencido > $0 e pelo menos um telefone MOBILE cadastrado com `do_not_text = false`.

```sql
-- Conta ativa com receivable vencido e telefone MOBILE disponível
SELECT
    a.pk              AS account_pk,
    a.company,
    p.phone_number,
    SUM(r.total_amount - COALESCE(r.partial_payment_amount, 0)) AS amount_due
FROM uown_sv_account a
JOIN uown_sv_receivable r  ON r.account_pk = a.pk
JOIN uown_sv_phone p       ON p.account_pk = a.pk
WHERE a.account_status     = 'ACTIVE'
  AND r.status             = 'ACTIVE'
  AND r.receivable_type    = 'REGULAR_PAYMENT'
  AND r.due_date           <= CURRENT_DATE
  AND p.phone_type         = 'MOBILE'
  AND p.do_not_text        = false
GROUP BY a.pk, a.company, p.phone_number
HAVING SUM(r.total_amount - COALESCE(r.partial_payment_amount, 0)) > 0
ORDER BY a.pk DESC
LIMIT 5;
```

> **Nota stg:** `uown_sv_receivable.status` usa `'ACTIVE'`/`'INACTIVE'` em stg (não `'OPEN'` como em qa2).

Anote: `account_pk` e `phone_number` da conta escolhida.

---

## Passo 2 — Verificar a flag de SMS de recusa no DB stg (pré-condição de TC-02)

```sql
SELECT key, value, description
FROM uown_configuration_management
WHERE key = 'send.payment.decline.sms';
```

**Resultado esperado para TC-02 ser executável:**

| key | value |
|---|---|
| `send.payment.decline.sms` | `true` |

- Se a query retornar **0 rows**: a flag não existe em stg (mesmo bloqueador de qa2) — TC-02 e TC-12 ficam `⚠️ BLOCKED (flag ausente)`.
- Se retornar `value = 'false'`: a feature está desabilitada intencionalmente — TC-02 e TC-12 ficam `⚠️ BLOCKED (flag false)`.
- Se retornar `value = 'true'`: prosseguir com TC-02 no Passo 5.

---

## Passo 3 — TC-01: Processar pagamento CC aprovado via Servicing UI

1. Abra `https://svc-website-stg.uownleasing.com` e faça login.
2. Navegue até a conta: `https://svc-website-stg.uownleasing.com/account/{account_pk}`.
3. No painel de pagamento, clique em **Make Payment**.
4. Selecione a opção **Credit Card**.
5. Insira os dados do cartão aprovado:

| Campo | Valor |
|---|---|
| Card Number | `5146 3150 0000 0055` |
| Expiration | `12/2028` |
| CVV | `998` |
| Nome | qualquer nome |

6. Informe um valor de pagamento válido (ex: o `amount_due` encontrado no Passo 1, ou um valor menor como `$50.00`).
7. Clique em **Submit Payment**.
8. Aguarde o toast de confirmação: `"Payment successful."`.

**Critério de aceite (TC-01):** toast de sucesso exibido sem erro.

---

## Passo 4 — TC-03, TC-11, TC-13: Validações de DB para pagamento aprovado

Execute as queries abaixo imediatamente após a confirmação do pagamento (Passo 3).

### TC-03 — SMS entregue ao número MOBILE correto

```sql
-- Verificar registro SMS enviado para a conta
SELECT
    q.pk,
    q.template_name,
    q.status,
    q.phone_number,
    q.body,
    q.row_created_timestamp
FROM uown_sms_queue q
WHERE q.account_pk = {account_pk}
  AND q.template_name = 'PaymentReceiptSms'
ORDER BY q.row_created_timestamp DESC
LIMIT 3;
```

Confirmar que `phone_number` coincide com o telefone MOBILE encontrado no Passo 1.

| Campo | Valor esperado |
|---|---|
| `template_name` | `PaymentReceiptSms` |
| `status` | `SENT` (ou `QUEUED` se processamento ainda pendente) |
| `phone_number` | número MOBILE do Passo 1 |

### TC-11 — Conteúdo correto no uown_sms_queue

```sql
-- Detalhe do SMS: firstName, amount, next payment date, portal URL
SELECT pk, template_name, status, phone_number, body
FROM uown_sms_queue
WHERE account_pk = {account_pk}
  AND template_name = 'PaymentReceiptSms'
ORDER BY pk DESC
LIMIT 1;
```

Verificar no campo `body`:
- Nome do cliente (`firstName`) presente
- Valor do pagamento corresponde ao submetido no Passo 3
- Data do próximo pagamento presente
- URL do portal presente

### TC-13 — Email de recibo gerado sem regressão

```sql
-- Verificar email de recibo na fila de email
SELECT
    pk,
    template_name,
    status,
    recipient,
    error_desc,
    row_created_timestamp
FROM uown_email_queue
WHERE account_pk = {account_pk}
  AND template_name = 'PaymentReceiptEmail'
ORDER BY row_created_timestamp DESC
LIMIT 3;
```

| Campo | Valor esperado |
|---|---|
| `template_name` | `PaymentReceiptEmail` |
| `status` | `SENT` |
| `error_desc` | `null` |

---

## Passo 5 — TC-02: Tentar pagamento CC recusado (condicionado ao Passo 2)

> **Pré-condição:** executar somente se o Passo 2 confirmou `send.payment.decline.sms = true`.

### 5a — Verificar se o cartão de recusa passa o pré-auth de registro

Em qa2 o cartão `4000 3006 1111 2224` foi bloqueado na etapa de registro (pré-auth), nunca chegando a processar o pagamento. Em stg, tentar nesta ordem:

**Cartão 1 — VISA_DECLINED (padrão de gateway):**

| Campo | Valor |
|---|---|
| Card Number | `4000 0000 0000 0002` |
| Expiration | `12/2030` |
| CVV | `123` |

**Cartão 2 — DECLINE_A (se o Cartão 1 bloquear no registro):**

| Campo | Valor |
|---|---|
| Card Number | `4000 3000 1111 2220` |
| Expiration | `12/2028` |
| CVV | `123` |

### 5b — Fluxo de teste

1. Na mesma conta do Passo 3 (ou outra conta elegível), clique em **Make Payment** → **Credit Card**.
2. Insira os dados do cartão de recusa (começar com VISA_DECLINED).
3. Informe um valor de pagamento (ex: `$50.00`).
4. Clique em **Submit Payment**.
5. Observar o resultado:
   - Se o portal exibir mensagem de erro de registro/registro inválido antes de tentar o pagamento → cartão bloqueado no pré-auth (mesmo comportamento de qa2). Tentar o Cartão 2.
   - Se o portal processar e retornar mensagem de recusa de pagamento → prosseguir com TC-12.

**Critério de aceite (TC-02):** o portal exibe mensagem indicando recusa do pagamento (não bloqueio de registro) e o fluxo de SMS de recusa é acionado.

---

## Passo 6 — TC-12: Validação de SMS de recusa em uown_sms_queue

> Executar somente se TC-02 gerou uma transação DECLINED (não bloqueada no pré-auth).

```sql
-- SMS de recusa na fila
SELECT
    q.pk,
    q.template_name,
    q.status,
    q.phone_number,
    q.body,
    q.row_created_timestamp
FROM uown_sms_queue q
WHERE q.account_pk = {account_pk}
  AND q.template_name = 'PaymentDeclineSms'
ORDER BY q.row_created_timestamp DESC
LIMIT 3;
```

| Campo | Valor esperado |
|---|---|
| `template_name` | `PaymentDeclineSms` |
| `status` | `SENT` (ou `QUEUED`) |
| `phone_number` | número MOBILE do Passo 1 |

Também verificar se a transação DECLINED está registrada:

```sql
SELECT pk, amount, status, payment_type, row_created_timestamp
FROM uown_cc_transaction
WHERE account_pk = {account_pk}
  AND status = 'DECLINED'
ORDER BY row_created_timestamp DESC
LIMIT 3;
```

---

## Matriz de resultados esperados

| TC | Descrição | Como verificar | Critério de aceite |
|---|---|---|---|
| TC-01 | Pagamento CC aprovado via UI | Passo 3 — toast na UI | `"Payment successful."` exibido |
| TC-02 | Pagamento CC recusado via UI | Passo 5 — UI + Passo 2 (flag) | Mensagem de recusa (não bloqueio de pré-auth) + flag `= true` em stg |
| TC-03 | SMS entregue ao número MOBILE | Passo 4 — `uown_sms_queue` | `phone_number` corresponde ao MOBILE da conta; `status = SENT` |
| TC-11 | Conteúdo correto no SMS de aprovação | Passo 4 — campo `body` | firstName + amount + next payment date + URL presentes |
| TC-12 | SMS de recusa gerado | Passo 6 — `uown_sms_queue` | `template_name = PaymentDeclineSms`, `status = SENT` |
| TC-13 | Email de recibo sem regressão | Passo 4 — `uown_email_queue` | `status = SENT`, `error_desc = null` |

---

## Riscos e divergências conhecidas stg vs qa2

| Item | qa2 | stg | Ação |
|---|---|---|---|
| Flag `send.payment.decline.sms` | Ausente (default false) | A verificar (Passo 2) | Documentar resultado real |
| Cartão de recusa `4000 3006 1111 2224` | Bloqueado no pré-auth | A verificar | Tentar VISA_DECLINED (`4000...0002`) primeiro |
| `uown_sv_receivable.status` | `'OPEN'` | `'ACTIVE'` | Query do Passo 1 já usa `'ACTIVE'` |
| DB tunnel 5445 | Aponta para qa2 | Pode flipar entre envs | Sempre confirmar via Passo 0 antes de queries |

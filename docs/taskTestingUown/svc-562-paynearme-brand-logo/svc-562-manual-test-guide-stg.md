# Roteiro de Teste Manual — #562 PayNearMe: logotipo correto por marca (stg)

> Baseado no QA Report de qa2 (Lucas Elias, 18/06/2026). Adapta o mesmo fluxo para o ambiente **stg**.

---

## Pré-requisitos

| Item | Detalhe |
|---|---|
| Acesso ao Servicing portal stg | `https://svc-website-stg.uownleasing.com` |
| Credenciais | `MANAGER_USERNAME` / `MANAGER_PASSWORD` (arquivo `.env.stg`) |
| Acesso ao DB stg | Túnel local na porta 5445 (confirmar qual env está ativo antes de usar — ver nota abaixo) |
| PayNearMe configurado em stg | Confirmar com o time que `kornerstone.png` e `uown.png` estão cadastrados no sandbox do PayNearMe |

> **Atenção — túnel de DB:** o túnel na porta 5445 pode estar apontando para outro ambiente. Antes de usar, confirme com `SELECT MAX(pk) FROM uown_sv_account;` e compare com o valor esperado para stg. Se o número não bater, o túnel está errado.

---

## Passo 1 — Encontrar contas elegíveis no DB (stg)

Execute as queries abaixo no DB stg para obter um `account_pk` por empresa com `amount_due > $0`.

> **Nota stg:** o campo `uown_sv_receivable.status` usa `'ACTIVE'`/`'INACTIVE'` em stg (não `'OPEN'` como em qa2).

**Contas já identificadas em stg (2026-06-23):**

| Empresa | account_pk | amount_due |
|---|---|---|
| KORNERSTONE | 622575 | $32.72 |
| KORNERSTONE | 622566 | $174.94 |
| UOWN | 622613 | $156.39 |
| UOWN | 622574 | $193.35 |

Se precisar de outras contas no futuro, use as queries abaixo:

**Conta KORNERSTONE:**
```sql
SELECT
    a.pk            AS account_pk,
    a.company,
    SUM(r.total_amount - COALESCE(r.partial_payment_amount, 0)) AS amount_due
FROM uown_sv_account a
JOIN uown_sv_receivable r ON r.account_pk = a.pk
WHERE a.company = 'KORNERSTONE'
  AND a.account_status = 'ACTIVE'
  AND r.status = 'ACTIVE'
  AND r.receivable_type = 'REGULAR_PAYMENT'
  AND r.due_date <= CURRENT_DATE
GROUP BY a.pk, a.company
HAVING SUM(r.total_amount - COALESCE(r.partial_payment_amount, 0)) > 0
ORDER BY a.pk DESC
LIMIT 5;
```

**Conta UOWN:**
```sql
SELECT
    a.pk            AS account_pk,
    a.company,
    SUM(r.total_amount - COALESCE(r.partial_payment_amount, 0)) AS amount_due
FROM uown_sv_account a
JOIN uown_sv_receivable r ON r.account_pk = a.pk
WHERE a.company = 'UOWN'
  AND a.account_status = 'ACTIVE'
  AND r.status = 'ACTIVE'
  AND r.receivable_type = 'REGULAR_PAYMENT'
  AND r.due_date <= CURRENT_DATE
GROUP BY a.pk, a.company
HAVING SUM(r.total_amount - COALESCE(r.partial_payment_amount, 0)) > 0
ORDER BY a.pk DESC
LIMIT 5;
```

Anote os `account_pk`s escolhidos (um para KORNERSTONE, um para UOWN).

---

## Passo 2 — Enviar o link PayNearMe via Servicing UI

Repita os passos abaixo **para cada conta** (KORNERSTONE e UOWN).

1. Abra o Servicing portal stg: `https://svc-website-stg.uownleasing.com`
2. Faça login com as credenciais stg.
3. Navegue até a conta: `https://svc-website-stg.uownleasing.com/account/{account_pk}`
4. No cabeçalho da conta, clique no ícone de envelope **Send Invite** (ícone `fa-envelope`).
5. No dropdown que aparece, selecione **PayNearMe Link**.
6. Confirme o envio na modal que surgir (canal SMS ou EMAIL).
7. Aguarde o toast de confirmação de envio bem-sucedido.

> Se o cliente da conta em stg não tiver um número/e-mail acessível para receber o link, use a alternativa via API no Passo 2-B abaixo.

### Passo 2-B (alternativa) — Enviar via API e obter o smart link diretamente

```bash
curl -X POST \
  "https://svc-stg.uownleasing.com/uown/tms/v1/accounts/{account_pk}/paynearme/send?deliveryChannel=SMS" \
  -H "Authorization: {FIVE9_TMS_API_KEY}" \
  -H "Content-Type: application/json"
```

A resposta retorna o `smartLink` diretamente:
```json
[
  {
    "smartLink": "https://paynearme.com/...",
    "deliveryChannel": "SMS",
    "amountDue": 99.00
  }
]
```

Copie a URL do campo `smartLink` para usar no Passo 3.

---

## Passo 3 — Verificar o logotipo na página de pagamento PayNearMe

1. Abra o smart payment link no browser (recebido via SMS/email ou obtido via API).
2. Verifique o logotipo exibido no topo da página:

| Empresa da conta | Logotipo esperado |
|---|---|
| KORNERSTONE | **Kornerstone Living** |
| UOWN | **Uown Leasing** |

**Critério de aprovação (TC-02 / TC-03):** o logotipo correto da marca aparece no topo da página de pagamento.
**Critério de reprovação:** logotipo errado, logotipo ausente ou imagem quebrada.

> Capturar screenshot da página com o logotipo visível como evidência.

---

## Passo 4 — Verificar o registro de tentativa no DB (stg)

Após o envio bem-sucedido, execute a query abaixo para **cada** `account_pk` testado:

```sql
SELECT
    pk,
    account_pk,
    action_type,
    success,
    pnm_order_identifier,
    site_order_identifier,
    error_summary,
    row_created_timestamp
FROM uown_pay_near_me_attempt
WHERE account_pk = {account_pk}
ORDER BY row_created_timestamp DESC
LIMIT 5;
```

**Critério de aprovação (TC-04 / TC-05):**

| Campo | Valor esperado |
|---|---|
| `success` | `true` |
| `error_summary` | `null` |
| `pnm_order_identifier` | preenchido (número do pedido PayNearMe) |
| `site_order_identifier` | `{account_pk}-stg` (prefixo de ambiente aplicado) |

---

## Passo 5 — Verificar o histórico no Servicing portal (opcional)

Acesse a tela de histórico PayNearMe no Servicing:
```
https://svc-website-stg.uownleasing.com/paynearme-history/{account_pk}
```

Na aba **Attempts**, confirme que a tentativa mais recente aparece com status de sucesso e sem mensagem de erro.

---

## Resumo dos critérios de aceite

| TC | Descrição | Como verificar | Esperado |
|---|---|---|---|
| TC-01 | Contas KORNERSTONE e UOWN elegíveis existem em stg | Query do Passo 1 | Retorna pelo menos 1 conta por empresa com `amount_due > 0` |
| TC-02 | Conta KORNERSTONE exibe logotipo Kornerstone Living | Passo 3 — abrir smart link | Logotipo "Kornerstone Living" visível no topo da página |
| TC-03 | Conta UOWN exibe logotipo Uown Leasing | Passo 3 — abrir smart link | Logotipo "Uown Leasing" visível no topo da página |
| TC-04 | Tentativa KORNERSTONE registrada com sucesso no DB | Query do Passo 4 | `success=true`, `error_summary=null`, `site_order_identifier={pk}-stg` |
| TC-05 | Tentativa UOWN registrada com sucesso no DB | Query do Passo 4 | `success=true`, `error_summary=null`, `pnm_order_identifier` preenchido |

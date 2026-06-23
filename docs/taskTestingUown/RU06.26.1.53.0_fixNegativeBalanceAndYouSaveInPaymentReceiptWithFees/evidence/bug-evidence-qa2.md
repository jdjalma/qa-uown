> **DISCLAIMER (Regra #16):** Este arquivo e REGISTRO DE EXECUCAO (raw evidence capture), NAO fonte de padrao. Nao inferir selectors, helpers, classification ou page objects deste documento. Fonte de pattern = skills (`.claude/skills/`) e codigo (`src/`, `tests/`). Toda afirmacao tecnica abaixo carrega source-tag.

# Evidencia: bug "negative Balance + You Save incondicional" VIVO em qa2 (fix !1484 ausente)

- **Task:** RU06.26.1.53.0 — fix Negative Balance And "You Save" In Payment Receipt With Fees
- **Ambiente:** qa2
- **Data da captura:** 2026-06-21
- **Conta alvo:** accountPk **10542** (leadPk 12569), UOWN, merchant **Progress Mobility Acquisition LLC** (`OL90294-0001`, pk 35, ONLINE, PAY_TOMORROW)
- **Recipient do recibo:** `fintechgroup777+xsURi@gmail.com`
- **Autorizacao:** usuario autorizou o pagamento real de exatamente $75.00 (dado de teste). Posting de pagamento via UI — NAO write direto no DB.

---

## TL;DR — veredito

**Bug REPRODUZIDO.** O recibo `PaymentReceiptEmail` gerado pelo pagamento renderiza **Balance negativo** (`-185.53`) e a linha **"If you pay off now you save:"** de forma **incondicional** (`savedAmount = 0.12`, valor sem sentido derivado de dois numeros negativos). Isto e o comportamento bugado que o fix !1484 corrige — presente em qa2 porque o fix **nao esta deployado**.

| Classificacao | Veredito |
|---|---|
| Comportamento bugado (negative Balance + You Save incondicional) vivo em qa2 | **[CONFIRMADO]** — render do recibo capturado (source: `uown_email_queue.email_body` pk 641043) |
| Template atual (`current=true`) e pre-!1484 | **[CONFIRMADO]** — source: `uown_template` pk 7104 v98 / pk 7091 v3, 2026-06-21 |
| E regressao a abrir? | **NAO** — e o estado pre-deploy esperado. Reportado, nao auto-acionado. |

---

## 1. Fix !1484 AUSENTE em qa2 (templates pre-!1484)

Source primaria: `uown_template`, `current=true`, qa2, 2026-06-21 (tunel `127.0.0.1:5445`, SELECT read-only).

| pk | template_name | version_number | current |
|----|---------------|----------------|---------|
| 7104 | `PaymentReceiptEmail` | 98 | true |
| 7091 | `KORNERSTONE_PaymentReceiptEmail` | 3 | true |

Ambos renderizam a linha "You Save" **sem `th:if`** (incondicional). Trecho literal do `template_content` (pk 7104 v98) [source: `uown_template.template_content`]:

```html
<div style="margin: 35px auto;width: 500;">* Balance: <span th:text="${CommonDataPojo.balance}"></span>
  <br>* Payoff Amount: <span th:text="${CommonDataPojo.payOffAmountBeforeEPOExpiry}"></span>
  <br>* Includes taxes and other charges
  <br><br>If you pay off now you save:
  <br><span th:text="${CommonDataPojo.savedAmount}"></span>
</div>
```

Nao ha `th:if` envolvendo o bloco "If you pay off now you save" — ele renderiza sempre, independentemente de `savedAmount` ser positivo/negativo/zero. pk 7091 (Kornerstone) tem bloco identico.

Formula buggada do Balance [source: `uown_template.data_fields_sql` pk 7104]: para receivables cujo `receivableType` NAO esta em `('REGULAR_PAYMENT','EARLY_PAY_OFF','PROCESSING_FEE')` — o que **inclui `MANUAL_FEE`** — a SQL soma `(partialPaymentAmount - totalAmount)`, empurrando o Balance para negativo conforme as fees sao pagas. Esta e a raiz que !1484 corrige.

---

## 2. Estado da conta ANTES do pagamento (guarda-corpos verificados)

Source: DB qa2 SELECT (read-only) + UI header (`03-account-header-bar.png`).

- `uown_sv_account.pk=10542 account_status = 'ACTIVE'` [source: DB] / header UI mostra Status **ACTIVE** [source: screenshot].
- MANUAL_FEE pagavel: `uown_sv_receivable.pk=628487 receivable_type='MANUAL_FEE' total_amount=75.00 status='ACTIVE' allocation_status='UNPAID'` [source: DB] — exatamente UMA, valor exato $75.00.
- EPO Balance ja exibido como **`$-185.65`** no painel da conta (bug visivel ANTES de qualquer pagamento) [source: `05`/`readpanel`, painel "Early Payoff / 90-Day Pay Off"].
- Past Due exibido: `$189.35` [source: header UI].

---

## 3. Modal Make Payment — observacao DOM-first (Regra #15) e decisao de guarda-corpo

Source: MCP-equivalente via Playwright headless (viewport 1440x900), `04`/`05`/`06` screenshots + dumps DOM.

Observado:
- Modal NAO tem mecanismo de selecao de fee especifica (sem linha MANUAL_FEE, sem checkbox por receivable). `MODAL FEE MENTIONS: []`.
- `Total Payment Amount` (`#totalPaymentAmount`) auto-preenche com **`$189.35`** (total Past Due), porem campo **editavel** (`readOnly:false, disabled:false`).
- Allocation Type options: `Payment` | `Payment/EPO` | `EPO Only` (default `Payment`).
- Checkbox "Charge convenience fee" vem marcado, porem **desmarcavel** (`disabled:false`).

Decisao de guarda-corpo: o default ($189.35 + convenience fee) violaria "cobrar exatamente $75.00". Como o campo de valor e editavel e o convenience fee e desmarcavel, foi possivel pinar a cobranca em **exatamente $75.00**. Guarda final no script confirmou `#totalPaymentAmount == 75.00` e convenience fee desmarcado ANTES do Submit (`06-modal-ready-75-OBSERVE.png`). Se o valor nao pudesse ser pinado em 75.00, o script abortaria sem postar.

---

## 4. Pagamento postado

Source: UI toast + DB SELECT (read-only).

- **Valor cobrado:** $75.00 (exato) — card on file VISA-4242, convenience fee desmarcado.
- **Horario (UTC):** 2026-06-21T22:38:52 (submit) — DB `row_created_timestamp` 21:38:50 (EST, -3h offset do servidor).
- **Toast UI:** `"Payment successful."` [source: `07-payment-confirmation.png`].
- `uown_sv_credit_card_transaction.pk=38730 cc_action='SALE' amount=75.00 status='APPROVED'` [source: DB].
- `uown_sv_payment.pk=212550 payment_type='CC' payment_amount=75.00 is_credit_card=true` [source: DB] → ref no recibo `RECEIPT #: UOWNCC212550`.
- MANUAL_FEE pk 628487 apos pagamento: `allocation_status='PAID_IN_FULL' partial_payment_amount=75.00` [source: DB] — o $75 efetivamente quitou a MANUAL_FEE.

### Activity log (Regra #13)
`uown_sv_activity_log.pk=3769314 notes="Created PaymentReceiptEmail to be sent as EMAIL"` @ 21:38:50 [source: DB]. Presente — acao gerou log.

---

## 5. RECIBO RENDERIZADO — o bug (Regra #14: render e o oraculo)

Source: `uown_email_queue.pk=641043` (PaymentReceiptEmail, to `fintechgroup777+xsURi@gmail.com`, subject `Payment Receipt - Account #10542`, status PENDING). `email_body` (HTML, len 10983) salvo em `receipt-641043.html` e renderizado em `08`/`09` PNG.

Valores renderizados [source: `uown_email_queue.email_body` + `data_map` CommonDataPojo pk 641043]:

| Campo no recibo | Valor renderizado |
|---|---|
| **Balance** | **`-185.53`** (NEGATIVO) |
| Payoff Amount | `-185.65` (NEGATIVO) |
| **"If you pay off now you save:"** | renderizada **INCONDICIONALMENTE** → `0.12` |
| Paid / Total | `75.00` / `75.00` |
| Receipt # | `UOWNCC212550` |

`data_map` (CommonDataPojo): `balance = -185.53`, `payOffAmountBeforeEPOExpiry = -185.65`, `savedAmount = 0.12`.

Veredito: **bug reproduzido** — Balance negativo + linha "You Save" presente sem condicional, exatamente o cenario que !1484 deveria eliminar.

> **Entrega confirmada via IMAP (atualizado 2026-06-21):** apos o usuario disparar manualmente a fila de emails pendentes de qa2, o recibo foi **entregue no inbox real** e lido via IMAP [source: `EmailHelpers.getEmailContent`, `src/scripts/_probe_email.ts`].
> - Subject: `Payment Receipt - Account #10542`
> - Date (envelope): `2026-06-21T22:48:15Z`
> - Valores no email entregue: **Balance `-185.53`**, **Payoff `-185.65`**, linha **"If you pay off now you save:" PRESENTE** (`0.12`), Total Paid `3387.45`.
>
> Os valores entregues batem 1:1 com o `email_body` da fila — evidencia agora completa ponta-a-ponta (renderizado na fila E entregue no inbox), nao mais so a row PENDING. Inicialmente a row ficou `PENDING` porque o emailSweep automatico de qa2 nao roda de forma deterministica (consistente com [[email-templates-catalog]] §4); o flush foi manual.

---

## 6. Artefatos

Diretorio: `docs/taskTestingUown/RU06.26.1.53.0_fixNegativeBalanceAndYouSaveInPaymentReceiptWithFees/evidence/`

- `01-account-before.png` — pagina da conta (full)
- `03-account-header-bar.png` — header: Status ACTIVE, Past Due $189.35, merchant Progress Mobility
- `04-modal-cc-selected-OBSERVE.png` — modal default ($189.35, convenience fee marcado, EPO Balance $-185.65)
- `05-allocation-options-OBSERVE.png` — opcoes de Allocation Type
- `06-modal-ready-75-OBSERVE.png` — modal pinado em $75.00, convenience fee DESMARCADO (prova guarda-corpo)
- `07-payment-confirmation.png` — toast "Payment successful."
- `08-receipt-rendered-BUG.png` — recibo renderizado (full) como o cliente ve
- `09-receipt-balance-highlighted-BUG.png` — recibo com regiao do bug destacada em vermelho (Balance -185.53 + You Save 0.12)
- `receipt-641043.html` — HTML bruto do recibo (`uown_email_queue.email_body`)

---

## 7. Classificacao final

- **[CONFIRMADO]** — comportamento bugado (negative Balance `-185.53` + "You Save" incondicional `0.12`) vivo em qa2, evidenciado pelo render do recibo (source primaria: `uown_email_queue.email_body` pk 641043 + `data_map`).
- **[CONFIRMADO]** — templates `current` sao pre-!1484 (source: `uown_template` pk 7104 v98 / pk 7091 v3, sem `th:if` no bloco You Save, JPQL antigo de Balance).
- **NAO e regressao** — e o estado pre-deploy esperado (fix !1484 nao aplicado em qa2). Reportar para o time confirmar deploy; NAO abrir ticket de regressao.
- **Severity (se fosse defeito a abrir):** S2 — defeito de render customer-facing em recibo de pagamento, com workaround (e o estado pre-fix conhecido). Priority alinhada ao deploy de !1484.

## 8. Confirmacao de nao-mutacao de DB

Nenhum INSERT/UPDATE/DELETE foi executado. Todas as consultas DB foram SELECT (read-only). A unica mutacao de estado foi o **posting de pagamento via UI** (acao de negocio autorizada), nao write direto no banco.

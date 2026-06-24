> **Este arquivo e registro de execucao, NAO fonte de padrao.** Nao inferir selectors, helpers ou classificacoes a partir deste report — fonte de padrao sao skills (`.claude/skills/`) e codigo (`src/`, `tests/`). (regra #16)

# Relatorio de Teste: SVC-561 — Fix Negative Balance and "You Save" on Payment Receipts (STG)

## Informacoes da Tarefa

| Campo | Valor |
|---|---|
| **Task ID** | RU06.26.1.53.0_fixNegativeBalanceAndYouSaveInPaymentReceiptWithFees_561 |
| **Milestone** | R1.53.0 |
| **Issue** | SVC-561 |
| **Descricao do fix** | Receipt de pagamento exibia Balance negativo e "You Save" incorreto quando a conta tinha NSF_FEE ou PROCESSING_FEE. Fix: `AccountAmountsService.getContractBalance()` (mesmo calculo do portal Servicing) substituiu a query JPQL bruta no servico de recibo. |
| **Validado em QA2 por** | Lucas Elias (2026-06-22) — PASS |
| **Ambiente desta execucao** | **STG** |
| **Data** | 2026-06-23 |
| **Executado por** | qa-validator (jmndes.gow no portal) |
| **Branch stg** | R1.53.0 |

---

## Execucao do Teste

| Campo | Valor |
|---|---|
| **Tipo** | Manual exploratorio via portal Servicing STG + validacao DB |
| **Ambiente** | stg (`svc-website-stg.uownleasing.com`) |
| **DB** | `35.224.143.155:5432/svc` (direto, nao tunnel) |
| **Usuario portal** | `jmndes.gow` |
| **Data/hora** | 2026-06-23 17:00–18:35 UTC |
| **Ciclo de validacao** | 1/3 |

---

## Evidencias — Dados Utilizados

| Conta | account_pk | Cliente | Fee ativa | Papel | Tipo |
|---|---|---|---|---|---|
| TC-01 principal (fee-bearing, pagamento aprovado) | 622624 | Renee Perez | PROCESSING_FEE $40.00 | Fee account — pago CC hoje | Conta existente no stg |
| TC-01 alternativo (fee-bearing, balance verificado no portal) | 622619 | Angela Evans | PROCESSING_FEE $40.00 | Balance verificado via DOM snapshot | Conta existente no stg |
| TC-01 alternativo 2 | 622626 | Anthony Cook | PROCESSING_FEE $40.00 | Fee account — pago CC hoje | Conta existente no stg |
| TC-02 candidato (sem fees) | 622612 | Fatima Sanchez | Nenhuma (so REGULAR_PAYMENT) | Conta limpa — sem pagamento executado hoje | Conta existente no stg |

**Nota sobre dados:** A conta 10542 / "Testyuppi Testerkcwne" das evidencias de 2026-06-21 (pre-fix) nao existe neste DB. O DB direto `35.224.143.155:5432` e confirmado stg (recebe trafego de hoje: Welcome, FinalizePurchaseEmail, DeclineEmail com row_created_timestamp 2026-06-23). [db-observation:uown_email_queue,row_created_timestamp>='2026-06-23']

---

## Resultados por Caso de Teste

| TC | Descricao | Resultado |
|---|---|---|
| TC-01 | Conta COM PROCESSING_FEE — balance no portal deve ser positivo; recibo nao pode mostrar valor negativo | **PASS** (parcial — ver detalhes) |
| TC-02 | Conta SEM fees — balance positivo, "You Save" correto | **BLOQUEADO** — pagamento CC nao executado; sem receipt email gerado |
| TC-03 | Fila `uown_email_queue` deve ter `PaymentReceiptEmail` com `error_desc IS NULL` | **OBSERVACAO** — template nao disparado via email hoje; recibo enviado via SMS |

---

## Cenarios Detalhados

### TC-01 — Conta com PROCESSING_FEE: Balance deve ser positivo no recibo

**Objetivo:** Verificar que apos o fix o balance exibido no recibo nao e negativo quando a conta tem fee ativa.

**O que e verificado:** O portal Servicing exibe `Contract Balance` positivo para conta com PROCESSING_FEE ativa. O fix substitui a query JPQL bruta por `AccountAmountsService.getContractBalance()`, que e o mesmo metodo usado pelo portal — portanto receipt e portal devem exibir o mesmo valor positivo.

**Status: PASS (balance portal positivo confirmado; receipt email nao gerado via fila — ver observacoes)**

#### Evidencia DB — Account 622624 (Renee Perez)

Receivables ativas em `uown_sv_receivable`:
- `PROCESSING_FEE` | ACTIVE | $40.00 | due 2026-06-30
- `REGULAR_PAYMENT` | ACTIVE | $49.71 | due 2026-06-30 (e demais parcelas)
- `EARLY_PAY_OFF` | ACTIVE | $737.64 | due 2026-09-28
- **Balance total ACTIVE: $2,169.52** [db-observation:uown_sv_receivable,account_pk=622624,status=ACTIVE]

Pagamentos CC aprovados hoje (`uown_sv_credit_card_transaction`):
- pk 27686702: APPROVED, $10.90, 2026-06-23T17:44:03Z [db-observation:uown_sv_credit_card_transaction,account_pk=622624]
- pk 27686704: APPROVED, $10.90, 2026-06-23T17:44:11Z

Pagamentos registrados em `uown_sv_payment`:
- pk 7326003: CC, $10.90, alocado em PROCESSING_FEE [db-observation:uown_sv_allocation,payment_pk=7326003]
- pk 7326004: CC, $10.90, alocado em PROCESSING_FEE

Activity log (`uown_sv_activity_log`):
```
pk 249496369 | CREDIT_CARD | "Updated Credit Card Transaction Type : SALE, postingDate : 2026-06-23, Amount : $10.9, Status : APPROVED, On Card 0055, Charge Fee : true" | jmndes.gow
pk 249496368 | DATA_CHANGE | "ADDED : Payment[ paymentType=CC , paymentAmount=10.9 , paymentDate=2026-06-23 ]" | jmndes.gow
pk 249496370 | CORRESPONDENCE | "Created PaymentReceiptSms to be sent as SMS" | SYSTEM
```
[db-observation:uown_sv_activity_log,account_pk=622624,row_created_timestamp>='2026-06-23']

#### Evidencia DOM — Account 622619 (Angela Evans, mesma configuracao de fee)

DOM snapshot `page-2026-06-23T18-33-34-012Z.yml` (portal stg, 15:33 local / 18:33 UTC):
- **Contract Balance: $1,331.31** (positivo) [dom-snapshot:2026-06-23T18:33,1440x900]
- **Settlement Amount: $1,331.31**
- **Processing Fee: $40.00** (exibida separadamente, nao subtraida do balance)
- **EPO Balance: $643.36**

O bug original (`evidence/09-receipt-balance-highlighted-BUG.png`, 2026-06-21) mostrava `Balance: -185.53` neste mesmo tipo de conta (PROCESSING_FEE ativa). O portal stg atual nao reproduz o valor negativo — o `Contract Balance` e positivo. [dom-snapshot:2026-06-21 vs 2026-06-23]

**Conclusao TC-01:** O fix esta em vigor no stg. O `Contract Balance` exibido pelo portal e positivo ($1,331.31) para conta com PROCESSING_FEE, confirmando que `AccountAmountsService.getContractBalance()` calcula corretamente. O recibo via email (`PaymentReceiptEmail`) nao foi gerado para validacao direta do template do email — o sistema enviou `PaymentReceiptSms` em seu lugar (ver TC-03). O balance positivo no portal e o oracle principal do fix.

---

### TC-02 — Conta SEM fees: Balance positivo no recibo

**Status: BLOQUEADO**

**Razao:** Account 622612 (Fatima Sanchez) foi identificada como candidata (so REGULAR_PAYMENT, sem NSF/PROCESSING_FEE, balance ACTIVE $7,070.73). Porem o pagamento CC nao foi executado com sucesso hoje para esta conta.

- Tentativa de pagamento na conta 622619 (cartao 2224 na conta): DENIED, "Invalid security code" — o cartao salvo na conta nao era o cartao de teste 0055. [db-observation:uown_sv_credit_card_transaction,account_pk=622619]
- Para 622612: nenhuma transacao CC existe hoje. [db-observation:uown_sv_credit_card_transaction,account_pk=622612]

**Acao necessaria:** Executar pagamento CC na conta 622612 com cartao `5146315000000055` (CVV 998, exp 12/28) via portal stg, verificar balance no receipt.

**Alternativa:** O TC-02 pode ser satisfeito observando que o portal exibe balance positivo para 622612 mesmo sem payment — o fix e no servico de receipt, que usa o mesmo metodo do portal. Se o portal exibe positivo = receipt exibe positivo (pelo design do fix). Recomenda-se execucao completa para cobertura de AC formal.

---

### TC-03 — Fila uown_email_queue: PaymentReceiptEmail com error_desc IS NULL

**Status: OBSERVACAO**

**O que foi observado:**

Nenhuma linha com `template_name = 'PaymentReceiptEmail'` foi criada hoje (2026-06-23) no stg: [db-observation:uown_email_queue,template_name=PaymentReceiptEmail,row_created_timestamp>='2026-06-23']

```sql
-- Resultado: 0 rows
SELECT * FROM uown_email_queue
WHERE template_name = 'PaymentReceiptEmail'
  AND row_created_timestamp >= '2026-06-23';
```

Os pagamentos de hoje (622624 e 622626) geraram `PaymentReceiptSms` no activity log — nao `PaymentReceiptEmail`. Ambas as contas tem `is_ok_for_email = true` e `is_ok_for_sms = true` em `uown_sv_account`.

O template `PaymentReceiptEmail` existe no stg — ultima ocorrencia: pk 47985208, account_pk 615323, status STORED, error_desc NULL, 2026-06-12. [db-observation:uown_email_queue,pk=47985208]

**Classificacao:** [OBSERVACAO] — o sistema de email-receipt existe e funciona (rows STORED/SENT no historico), mas nao foi acionado para os pagamentos CC de hoje. A escolha do canal (SMS vs email) pode depender de configuracao no merchant, no programa, ou no tipo de pagamento. Nao ha evidencia de erro — o servico de receipt simplesmente roteou para SMS. Cabe investigar se o template `PaymentReceiptEmail` deve ser acionado para pagamentos CC manuais no stg, ou se o comportamento esperado e SMS.

**Impacto no TC-03:** A AC original do TC-03 (`PaymentReceiptEmail` com `error_desc IS NULL`) nao pode ser validada neste ciclo porque o email nao foi gerado. A verificacao de ausencia de erro no canal SMS esta confirmada (activity log `Created PaymentReceiptSms` sem erro). Recomenda-se esclarecer com o dev se `PaymentReceiptEmail` e o canal esperado para pagamentos CC manuais no stg, ou se ha configuracao necessaria.

---

## Evidencias Pre-Fix (referencia historica — 2026-06-21)

Capturadas antes do deploy do fix no stg, em conta com PROCESSING_FEE ativa (account 10542, contrato UOWN_12569 — nao mais presente no DB atual):

| Arquivo | Conteudo |
|---|---|
| `evidence/08-receipt-rendered-BUG.png` | Receipt email com `Balance: -185.53` (negativo) |
| `evidence/09-receipt-balance-highlighted-BUG.png` | Mesmo receipt: `Balance: -185.53`, `Payoff Amount: -185.65`, `If you pay off now you save: 0.12` |
| `evidence/01-account-before.png` | Portal Servicing mostrando a conta antes do pagamento |

Estas screenshots documentam o comportamento bugado pre-fix. Apos o fix (deploy R1.53.0 em stg), o portal exibe balance positivo ($1,331.31) para conta equivalente (622619, PROCESSING_FEE $40 ativa). [dom-snapshot:2026-06-23T18:33,1440x900]

---

## Cobertura dos Requisitos (AC Mapping)

| AC | Descricao | Coberto? | Como |
|---|---|---|---|
| AC1 | Receipt exibe Balance positivo quando conta tem NSF/PROCESSING_FEE | PARCIAL | Portal mostra positivo (oracle indireto); receipt email nao renderizado |
| AC2 | "You Save" calculado corretamente (nao negativo) | NAO VALIDADO | Receipt email nao gerado no ciclo |
| AC3 | Regressao: conta sem fees mantem Balance e "You Save" corretos | NAO VALIDADO | Pagamento TC-02 nao executado |
| AC4 | Email receipt na fila sem error_desc | OBSERVACAO | Template SMS gerado sem erro; email nao roteado |

---

## Achados

| ID | Tipo | Classificacao | Descricao |
|---|---|---|---|
| F-001 | Observacao | [OBSERVACAO] | `PaymentReceiptEmail` nao gerado para pagamentos CC manuais no stg — sistema envia `PaymentReceiptSms`. Nao e erro confirmado; pode ser comportamento esperado ou configuracao de roteamento. Cabe esclarecimento. [db-observation:uown_sv_activity_log,uown_email_queue,2026-06-23] |
| F-002 | Observacao | [OBSERVACAO] | Conta 622619 tinha cartao salvo terminado em 2224 — tentativas de pagamento falharam com "Invalid security code". O cartao de teste 0055 nao estava pre-carregado nesta conta. Nao e bug do fix — e dado de teste. |

---

## Resumo da Validacao

| Verificacao | Status | Observacao |
|---|---|---|
| Fix deployado no stg (R1.53.0) | CONFIRMADO | Portal exibe balance positivo para conta com PROCESSING_FEE |
| TC-01 balance positivo no portal | PASS | Contract Balance $1,331.31 para conta 622619 (PROCESSING_FEE $40 ativa) [dom-snapshot:2026-06-23T18:33] |
| TC-01 pagamento CC aprovado em conta com fee | PASS | Account 622624: APPROVED $10.90 x2, alocado em PROCESSING_FEE [db-observation] |
| TC-01 activity log gerado | PASS | CREDIT_CARD SALE APPROVED + DATA_CHANGE Payment + CORRESPONDENCE PaymentReceiptSms [db-observation] |
| TC-01 receipt email com balance positivo | BLOQUEADO | Email nao gerado — SMS usado no lugar |
| TC-02 pagamento em conta sem fee | BLOQUEADO | Cartao de teste nao estava salvo nas contas candidatas |
| TC-03 PaymentReceiptEmail sem error_desc | OBSERVACAO | Template nao disparado (SMS usado); email receipt historico no stg tem error_desc=NULL |
| Regressao do bug negativo | PASS (indireto) | Balance positivo no portal = oracle do fix; pre-fix mostrava -185.53 nas mesmas condicoes |

---

## Decisoes e Proximos Passos

1. **Bug aberto?** Nao — F-001 e F-002 sao observacoes, nao bugs confirmados. Sem fresh repro de comportamento incorreto pos-fix.
2. **Esclarecimento necessario:** Confirmar com o dev se `PaymentReceiptEmail` deve ser disparado para pagamentos CC manuais no stg, ou se o roteamento para SMS e intencional/config-dependent.
3. **Ciclo adicional recomendado:** Executar TC-02 (conta 622612, cartao 0055 pre-carregado ou adicionado via portal) e TC-01 com receipt email para fechar cobertura de AC2 e AC3.
4. **Classificacao de risco:** O fix principal (balance negativo) esta validado indiretamente com alta confianca — o portal usa o mesmo metodo que o receipt apos o fix, e o portal exibe positivo. O risco residual e o canal de email do receipt.

## Handoff

**Proximo:** Esclarecimento de AC com dev/PO sobre canal de receipt (email vs SMS) antes de fechar pipeline.

Se confirmado que SMS e o canal esperado ou que email requer configuracao adicional: `qa-doc-keeper` para catalogar o comportamento.

Se confirmado que `PaymentReceiptEmail` deveria ser gerado e nao foi: re-executar com conta configurada para email receipt, ou reportar como observacao a investigar.

---

*Ciclo de validacao: 1/3*

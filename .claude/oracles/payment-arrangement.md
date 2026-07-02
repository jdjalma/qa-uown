---
operation: payment-arrangement
description: Criação de Payment Arrangement (parcelamento / promise-to-pay) no portal Servicing via modal Make Payment (/customer-information/{accountPk} → #makePayment → #paymentArrangement), tanto ACH quanto Credit Card, tipos NORMAL e SETTLEMENT, mais a página de exibição /payment-arrangement/{accountPk}. Cobre a cadeia de sweep ACH (NOT_STARTED → SUCCESS), a transição FAILED e a transição de conta SETTLED_IN_FULL para arrangements de SETTLEMENT.
last-reviewed: 2026-07-01
last-reviewed-sha: 3b8ce82
covers:
  - tests/e2e/servicing/payment-arrangement-servicing.spec.ts
  - src/pages/servicing/account-summary.page.ts
  - src/pages/servicing/payment-arrangement.page.ts
  - src/pages/servicing/servicing-base.page.ts
  - src/api/bodies/payment-arrangement.body.ts
  - src/helpers/database.helpers.ts
  - docs/business-rules/05-pagamentos.md
  - docs/business-rules/06-conta-ciclo-vida.md
  - docs/business-rules/appendix-d-constantes-enums.md
---

# Oracle BDD — Payment Arrangement (Parcelamento no portal Servicing)

> **Gatilho:** qualquer ação que crie ou exiba um Payment Arrangement no portal Servicing — abrir o modal "Make Payment" e marcar `#paymentArrangement`, submeter um arrangement ACH ou CC (tipo NORMAL ou SETTLEMENT), ou navegar até a página de exibição `/payment-arrangement/{accountPk}`. Inclui rodar `payment-arrangement-servicing.spec.ts` (executar o spec É executar as operações que ele exercita — regra #19).
>
> **Verificação de obsolescência:**
> ```bash
> git log 3b8ce82..HEAD -- \
>   tests/e2e/servicing/payment-arrangement-servicing.spec.ts \
>   src/pages/servicing/account-summary.page.ts \
>   src/pages/servicing/payment-arrangement.page.ts \
>   src/pages/servicing/servicing-base.page.ts \
>   src/api/bodies/payment-arrangement.body.ts \
>   src/helpers/database.helpers.ts \
>   docs/business-rules/05-pagamentos.md \
>   docs/business-rules/06-conta-ciclo-vida.md \
>   docs/business-rules/appendix-d-constantes-enums.md
> ```
> Sem output = oracle está atual. Com output, prefixar validações com `[BDD MAY BE STALE]` e revisar.
>
> **Viewport:** Servicing é um portal interno voltado para agentes. Use **1440×900** (mesma regra dos demais portais internos — regra #15). O modal "Make Payment" é aberto sobre `/customer-information/{accountPk}`.
>
> **Ambiente:** o spec roda em **dev3** (`ENV=dev3`). dev3 NÃO possui processador ACH real (Profituity) nem processador CC de sweep — por isso as transições terminais multi-parcela usam um stand-in de processador AUTORIZADO (CLAUDE.md Exceção 3, autorização do usuário 2026-06-01): `approveAllPendingCcSalesForArrangement` / `UPDATE ... SETTLED` + `recalculate*ArrangementStatus`. Esse caminho sintético grava direto em `uown_sv_payment_arrangement` e NÃO executa o listener Java (`PaymentArrangementACHListener`) — logo os logs de finalização podem ficar ausentes (ver CT-02/CT-04/CT-06, ressalva `@blocked-by-missing-log`, regra #10/#13).
>
> **Enums canônicos (appendix-d §D.20/D.21):**
> - `ArrangementType`: `NORMAL` (conta permanece ACTIVE) · `SETTLEMENT` (conta vira SETTLED_IN_FULL ao concluir).
> - `PaymentArrangementStatus`: `NOT_STARTED` (criado, nenhuma transação processada) · `IN_PROGRESS` (parcelas pendentes restantes) · `SUCCESS` (todas concluídas) · `FAILED` (ao menos uma falhou; arrangement desativado, rating resetado).
>
> **Pré-condições comuns (`beforeEach`):** lead fresco por teste via `createPreQualifiedApplication` (preflight de merchant automático, regra #12) → `driveLeadToFunding` → conta ACTIVE resolvida por `db.waitForAccountByLeadPk`. Merchant `TerraceFinance`, estado `NY`, `orderTotal='800'` (grande o bastante para gerar múltiplas parcelas — saldos pequenos auto-capam em 1 parcela). Cartão em arquivo = MASTERCARD (BIN 5146), NUNCA VISA (rollback em qa).

---

## CT-01 — Arrangement ACH semanal criado em NOT_STARTED (happy path)

```gherkin
Dado que uma conta ACTIVE fresca está aberta em /customer-information/{accountPk} no portal Servicing (1440×900)
E existe banco em arquivo (bank on file) proveniente do funding
Quando o agente abre o modal "Make Payment", marca #paymentArrangement e cria um arrangement ACH
  com Start=hoje, End=hoje+28d, Frequency=Weekly, Payment Type=ACH
Então um toast de sucesso aparece (o texto NÃO contém "error")
E existe uma linha em uown_sv_payment_arrangement com payment_type='ACH' e status='NOT_STARTED'
E existem N linhas em uown_sv_achpayment ligadas via payment_arrangement_pk, cada uma em status PENDING ou PICKED_TO_SEND
E a soma dos valores das parcelas é aproximadamente igual ao total do arrangement (tolerância de 1 casa decimal)
E uown_los_lead_notes (log de atividade) possui a nota "Payment Arrangement created ... paymentType=ACH" e a nota "ACH Arrangement created" (regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Toast após submit | string capturada por `captureAndDismissToast(20000)`; `.toLowerCase()` NÃO contém `'error'` | `payment-arrangement-servicing.spec.ts:200-202` |
| Linha do arrangement | `uown_sv_payment_arrangement` WHERE `account_pk=$1 AND payment_type='ACH'` presente; `db.getPaymentArrangement` retorna `payment_type='ACH'`, `status='NOT_STARTED'` | `payment-arrangement-servicing.spec.ts:206-218`; appendix-d §D.21 |
| Parcelas ACH ligadas | `uown_sv_achpayment` WHERE `payment_arrangement_pk=$1` presente; `getAchPaymentsByArrangement().length > 0`; cada `status ∈ {PENDING, PICKED_TO_SEND}` | `payment-arrangement-servicing.spec.ts:222-235` |
| Soma das parcelas ≈ total | `Σ parseMoney(achRow.amount)` `toBeCloseTo(arrangement.amount, 1)` | `payment-arrangement-servicing.spec.ts:237-241` |
| Log criação (regra #13) | nota em `uown_los_lead_notes` contendo `paymentType=ACH` (busca `'Payment Arrangement created'`) — presente | `payment-arrangement-servicing.spec.ts:244-248` |
| Log ACH (regra #13) | ao menos 1 nota `'ACH Arrangement created'` | `payment-arrangement-servicing.spec.ts:250-252` |

```sql
-- Validação DB CT-01 (substituir $account_pk / $arrangement_pk)
SELECT pk, status, payment_type, amount, arrangement_type
  FROM uown_sv_payment_arrangement WHERE account_pk = $account_pk ORDER BY pk DESC LIMIT 1;

SELECT pk, status, amount, ach_process_type
  FROM uown_sv_achpayment WHERE payment_arrangement_pk = $arrangement_pk;
```

---

## CT-02 — Arrangement CC criado e conduzido a SUCCESS (happy path)

```gherkin
Dado que uma conta ACTIVE fresca está aberta em /customer-information/{accountPk}
E existe cartão em arquivo (MASTERCARD, nunca VISA) proveniente do funding
Quando o agente cria um arrangement CC com Start=hoje, End=hoje+28d, Frequency=Weekly, Payment Type="Credit Card Payment"
Então um toast de sucesso aparece (não contém "error")
E existe uma linha em uown_sv_payment_arrangement com payment_type='CC'
E o arrangement alcança status='SUCCESS' (a parcela datada de hoje processa síncrona; parcelas futuras ficam PENDING até um sweep de processador — em dev3, via stand-in autorizado)
E existem transações CC SALE ligadas via payment_arrangement_pk, todas em status='APPROVED'
E uown_los_lead_notes possui "Payment Arrangement created ... paymentType=CC" e "Credit Card Payment Arrangement created" (regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Toast após submit | não contém `'error'` | `payment-arrangement-servicing.spec.ts:276-278` |
| Linha do arrangement | `payment_type='CC'` presente | `payment-arrangement-servicing.spec.ts:288-298` |
| Status terminal | `SUCCESS` — caminho síncrono (parcela única/hoje) OU fallback autorizado `simulateCcSweepForArrangement` + `approveAllPendingCcSalesForArrangement` + `recalculateArrangementStatus` para multi-parcela; asserção final `getPaymentArrangementStatus === 'SUCCESS'` | `payment-arrangement-servicing.spec.ts:302-332` |
| Transações CC SALE | `uown_sv_credit_card_transaction` WHERE `payment_arrangement_pk=$1 AND cc_action='SALE'`; todas `status='APPROVED'` | `payment-arrangement-servicing.spec.ts:335-349` |
| Log criação CC (regra #13) | nota contendo `paymentType=CC` + nota `'Credit Card Payment Arrangement created'` (>0) | `payment-arrangement-servicing.spec.ts:352-360` |
| Log "Arrangement finalized as SUCCESS" | **caminho síncrono** (parcela única de hoje): asserção HARD `> 0`. **Caminho sintético** (multi-parcela, fallback): `@blocked-by-missing-log` — o `recalculate*` NÃO roda o listener que emite o log; ausência é artefato de dev3 (sem processador), NÃO bug de produto (regra #10). Ver `[HYPOTHESIS]` abaixo | `payment-arrangement-servicing.spec.ts:362-385` |

**[HYPOTHESIS]** — Se um log `'Arrangement finalized as SUCCESS'` é emitido no caminho multi-parcela conduzido por um processador REAL: não verificável em dev3 (sem processador). Em ambiente com processador (Q-S2) isso DEVE virar asserção hard exercitando o caminho do listener. O caminho síncrono de parcela única confirma que o log é escrito pela execução do backend, não pelo helper de recalc.

---

## CT-03 — Página de exibição renderiza o arrangement + sub-tabela expansível

```gherkin
Dado que um arrangement ACH foi criado para a conta (via modal Make Payment)
Quando o agente navega até /payment-arrangement/{accountPk}
Então a tabela principal exibe as colunas Arrangement PK, Payment Type, Start Date, End Date, Total Amount, Status, Created At, Created By (comparação case-insensitive)
E existe uma linha cujo Arrangement Pk corresponde ao PK do arrangement criado
E a célula Payment Type dessa linha contém "ACH"
E ao expandir a linha, uma seção "ACH Payments" é renderizada com ao menos uma sub-linha
E a contagem de sub-linhas ACH renderizadas é igual à contagem de linhas em uown_sv_achpayment ligadas ao arrangement (UI-first, regra #14)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Colunas da tabela principal | `getNormalizedHeaders()` contém (case-insensitive) todas as `PaymentArrangementPage.EXPECTED_COLUMNS`: `Arrangement PK`, `Payment Type`, `Start Date`, `End Date`, `Total Amount`, `Status`, `Created At`, `Created By` | `payment-arrangement-servicing.spec.ts:423-431`; `payment-arrangement.page.ts:29-38` |
| Linha do arrangement | `findRowByPk(arrangementPk) >= 0`; célula "Payment Type" contém `ACH` (upper) | `payment-arrangement-servicing.spec.ts:434-443` |
| Cabeçalho da seção expandida | `getExpandedSectionHeaders()` contém uma seção cujo texto inclui `ach` | `payment-arrangement-servicing.spec.ts:445-453` |
| Contagem UI == DB | `getAchPaymentsData().length` `.toBe(getAchPaymentsByArrangement(pk).length)` | `payment-arrangement-servicing.spec.ts:455-461` |

---

## CT-04 — Cadeia de sweep ACH: NOT_STARTED → SUCCESS

```gherkin
Dado que um arrangement ACH multi-parcela foi criado em NOT_STARTED (payment_type='ACH')
E toda parcela ACH tem ach_process_type='REQUEST' (senão o sweep a ignora)
Quando o sweep de envio (sendAchPaymentsSweep) roda até as parcelas saírem de PENDING para PICKED_TO_SEND
Então enquanto as parcelas estão em trânsito (PICKED_TO_SEND/SENT/ACK_RECEIVED) o arrangement permanece NOT_STARTED ou IN_PROGRESS (listener não avança prematuramente)
Quando as parcelas alcançam um estado terminal (via getStatusDatePaymentsListSweep; em dev3, via stand-in SETTLED autorizado + recalculateAchArrangementStatus)
Então o arrangement alcança status='SUCCESS' e is_active=false
E uown_los_lead_notes possui a nota "ACH Arrangement created" (asserção hard — escrita organicamente na criação)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Arrangement inicial | `payment_type='ACH'`, `status='NOT_STARTED'` | `payment-arrangement-servicing.spec.ts:485-497` |
| Pré-condição do sweep | cada `uown_sv_achpayment.ach_process_type='REQUEST'` (sem isso o `sendACHPaymentsSweep` só pega pagamentos com receivable vencendo em ≤1 dia) | `payment-arrangement-servicing.spec.ts:500-514`; `payment-arrangement.body.ts:73-77,211-213` |
| Sweep de envio | `triggerAchSweepUntilProcessed(kind='send')` move parcelas a `PICKED_TO_SEND/SENT/ACK_RECEIVED/SETTLED/COMPLETED` (retry até `MAX_SWEEP_RETRIES=5`) | `payment-arrangement-servicing.spec.ts:517-524` |
| No-op do listener | enquanto `stillInFlight`, `getPaymentArrangementByPk().status ∈ {NOT_STARTED, IN_PROGRESS}` (não avança para SUCCESS prematuramente) | `payment-arrangement-servicing.spec.ts:526-541` |
| Transição terminal | sweep de status OU stand-in SETTLED autorizado + `recalculateAchArrangementStatus`; polling `waitForPaymentArrangementStatus(SUCCESS)` | `payment-arrangement-servicing.spec.ts:543-578` |
| Estado final | `status='SUCCESS'` e `is_active=false` | `payment-arrangement-servicing.spec.ts:580-583`; appendix-d §D.21 |
| Log criação (hard, regra #13) | `'ACH Arrangement created'` `> 0` (escrito organicamente na criação, antes de qualquer sweep) | `payment-arrangement-servicing.spec.ts:586-591` |
| Log finalização | `@blocked-by-missing-log` — `'Arrangement finalized as SUCCESS'` emitido pelo `PaymentArrangementACHListener` num callback SETTLED de processador REAL; em dev3 (stand-in) o log fica ausente = artefato de método, NÃO bug (regra #10). Ver `[HYPOTHESIS]` | `payment-arrangement-servicing.spec.ts:593-610` |

**[HYPOTHESIS]** — Log `'Arrangement finalized as SUCCESS'` num callback SETTLED de processador real: não verificável em dev3 (Q-S4). Deve virar asserção hard em ambiente com processador.

---

## CT-05 — Arrangement ACH → FAILED (parcela RETURNED)

```gherkin
Dado que um arrangement ACH de parcela única (Start==End) foi criado em NOT_STARTED, ach_process_type='REQUEST'
Quando a(s) parcela(s) ACH é marcada RETURNED (UPDATE autorizado, CLAUDE.md Exceção 3, autorização do usuário 2026-06-01)
E recalculateAchArrangementStatus é executado
Então o arrangement alcança status='FAILED' e is_active=false
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Arrangement inicial | `status='NOT_STARTED'`; cada parcela `ach_process_type='REQUEST'` | `payment-arrangement-servicing.spec.ts:635-651` |
| Mutação autorizada | `UPDATE uown_sv_achpayment SET status='RETURNED' WHERE payment_arrangement_pk=$1` (Exceção 3, autorizada 2026-06-01) → linhas afetadas `> 0` | `payment-arrangement-servicing.spec.ts:654-663` |
| Estado final | `waitForPaymentArrangementStatus(FAILED)`; `status='FAILED'` e `is_active=false` | `payment-arrangement-servicing.spec.ts:669-675`; appendix-d §D.21 |
| Log de falha | `@blocked-by-missing-log` — a mutação DB + recalc bypassa o `PaymentArrangementACHListener` (código que, em produção, grava o log de falha no callback RETURNED do processador). Ausência de log em dev3 = artefato de método sintético, NÃO bug (regra #10). Asserção NÃO removida (regra #13), apenas não-gating. Ver `[HYPOTHESIS]` | `payment-arrangement-servicing.spec.ts:678-703` |
| Rating na conta | `[OBSERVAÇÃO]` — captura `getAccountRating(accountPk)` sem gate. A regra rating-na-falha (§06 diz: "Payment arrangement failed → rating null / rating resetado") ainda não confirmada em fresh data (Q1) | `payment-arrangement-servicing.spec.ts:705-710`; `06-conta-ciclo-vida.md:115` |

**[HYPOTHESIS]** — (Q-S5) Um callback RETURNED de processador REAL emite log de falha de atividade? Não verificável em dev3. Deve virar asserção hard em ambiente com processador.
**[HYPOTHESIS]** — (Q1) Rating da conta após arrangement FAILED: §06 documenta reset para `null`, mas não confirmado em reprodução fresca — capturado como OBSERVAÇÃO, não gate.

---

## CT-06 — Arrangement CC de SETTLEMENT → conta SETTLED_IN_FULL

```gherkin
Dado que uma conta ACTIVE fresca está aberta em /customer-information/{accountPk} com cartão em arquivo (MASTERCARD)
Quando o agente cria um arrangement CC com arrangementType='SETTLEMENT' (Start=hoje, End=hoje+28d, Weekly)
Então existe uma linha em uown_sv_payment_arrangement com payment_type='CC' e arrangement_type='SETTLEMENT'
E o arrangement alcança status='SUCCESS' (síncrono OU via stand-in autorizado para parcelas futuras)
E as transações CC SALE ligadas estão todas em status='APPROVED'
E a conta transiciona para status='SETTLED_IN_FULL'
E uown_los_lead_notes possui "Credit Card Payment Arrangement created" (regra #13)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Arrangement de SETTLEMENT | `payment_type='CC'`, `arrangement_type='SETTLEMENT'` | `payment-arrangement-servicing.spec.ts:741-753` |
| Status terminal | `SUCCESS` — síncrono OU fallback `simulateCcSweepForArrangement` + `approveAllPendingCcSalesForArrangement` + `recalculateArrangementStatus` | `payment-arrangement-servicing.spec.ts:756-776` |
| Transações CC SALE | todas `status='APPROVED'` ligadas via `payment_arrangement_pk` | `payment-arrangement-servicing.spec.ts:778-793` |
| Conta → SETTLED_IN_FULL | `waitForAccountStatus(accountPk, 'SETTLED_IN_FULL')` alcançado | `payment-arrangement-servicing.spec.ts:795-800`; `06-conta-ciclo-vida.md:209-214`; appendix-d §D.20 |
| Log criação CC (regra #13) | `'Credit Card Payment Arrangement created'` `> 0` | `payment-arrangement-servicing.spec.ts:802-805` |
| Log finalização | `@blocked-by-missing-log` no caminho sintético multi-parcela (mesma causa do CT-02/CT-04); hard no caminho síncrono de parcela única. Ver `[HYPOTHESIS]` | `payment-arrangement-servicing.spec.ts:807-820` |

**[HYPOTHESIS]** — (Q-S6) Log `'Arrangement finalized as SUCCESS'` no caminho SETTLEMENT multi-parcela via processador real: não verificável em dev3.

---

## CT-07 — Multi-parcela real (ACH, Weekly, hoje → hoje+28)

```gherkin
Dado que um arrangement ACH semanal (hoje → hoje+28d) foi criado para a conta
Então existem N > 1 parcelas em uown_sv_achpayment ligadas ao arrangement
E a soma das parcelas é aproximadamente igual ao total do arrangement (tolerância 1 casa decimal)
E cada parcela está a no máximo 1 unidade do valor da divisão igual (total / N) — a última parcela absorve o arredondamento
E a contagem de sub-linhas ACH renderizadas em /payment-arrangement é igual à contagem de linhas no DB (UI-first, regra #14)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Quantidade de parcelas | `getAchPaymentsByArrangement(pk).length > 1` (schedule semanal sobre 28d gera múltiplas) | `payment-arrangement-servicing.spec.ts:846-860` |
| Soma ≈ total | `Σ amounts` `toBeCloseTo(arrangement.amount, 1)` | `payment-arrangement-servicing.spec.ts:862-866` |
| Distribuição quase-igual | para cada parcela: `Math.abs(amount - total/N) <= 1.0` | `payment-arrangement-servicing.spec.ts:868-872` |
| Contagem UI == DB | `getAchPaymentsData().length` `.toBe(dbAchCount)` na página de exibição | `payment-arrangement-servicing.spec.ts:875-883` |

---

## Pré-condições

- **Preflight do merchant** (regra #12): automático via `createPreQualifiedApplication` (`ensureMerchantReady`). Merchant `TerraceFinance` (`OL90202-0001`, ONLINE), estado `NY`.
- **Dados frescos por teste** (regra #9): sem `emailOverride`, email único por run (evita `DataMismatchStep`). Cada teste dirige um lead novo até FUNDING (conta ACTIVE) no `beforeEach`.
- **`orderTotal='800'`**: valor grande o bastante para o schedule semanal gerar múltiplas parcelas — saldos pequenos auto-capam em 1 parcela.
- **Cartão em arquivo**: MASTERCARD (BIN 5146) do funding, usado automaticamente — NUNCA VISA (rollback em qa).
- **`ach_process_type='REQUEST'`** obrigatório em toda parcela ACH de arrangement — sem isso o `sendACHPaymentsSweep` só pega pagamentos com receivable vencendo em ≤1 dia (condição de auto-pay). Ver `payment-arrangement.body.ts:73-77,211-213`.
- **Ambiente dev3 sem processador**: transições terminais multi-parcela dependem de stand-in de processador AUTORIZADO (Exceção 3, autorização 2026-06-01) — `approveAllPendingCcSalesForArrangement` / `UPDATE ... SETTLED`/`RETURNED` + `recalculate*ArrangementStatus`. Esses caminhos NÃO devem ser usados como oracle de comportamento de produto do listener.

## Log de Atividade (Regra #13)

| Ação | Nota esperada em `uown_los_lead_notes` |
|---|---|
| Arrangement ACH criado | `'Payment Arrangement created ... paymentType=ACH'` + `'ACH Arrangement created'` (HARD — orgânico na criação) |
| Arrangement CC criado | `'Payment Arrangement created ... paymentType=CC'` + `'Credit Card Payment Arrangement created'` (HARD) |
| Arrangement finalizado SUCCESS | `'Arrangement finalized as SUCCESS'` — HARD no caminho síncrono; `@blocked-by-missing-log` no caminho sintético dev3 (regra #10) |
| Arrangement finalizado FAILED | log de falha — `@blocked-by-missing-log` no caminho sintético dev3 (Q-S5) |

Ausência de log em ação com caminho ORGÂNICO = falha de implementação (regra #13). Ausência de log de finalização/falha no caminho SINTÉTICO de dev3 = artefato de método (sem processador), NÃO bug (regra #10) — não removida a asserção, apenas não-gating, até validação em ambiente com processador.

## Questões abertas (para dev / qa-planner)

- **Q1** — Rating da conta após arrangement FAILED: §06 documenta reset para `null`; não confirmado em reprodução fresca. Capturado como OBSERVAÇÃO em CT-05.
- **Q-S2 / Q-S4 / Q-S6** — Logs de finalização (`'Arrangement finalized as SUCCESS'`) no caminho multi-parcela conduzido por processador REAL: não verificável em dev3. Devem virar asserções hard exercitando o listener quando houver ambiente com processador.
- **Q-S5** — Log de falha num callback RETURNED de processador REAL: idem.

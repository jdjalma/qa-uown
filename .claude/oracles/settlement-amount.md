---
operation: settlement-amount
description: Exibição do Settlement Amount (Payoff Agreement) no portal Servicing — label clicável em "Account & Contract Overview" abre o modal "Settlement Breakdown"; o desconto ofertado é derivado das faixas de dias-em-atraso (0/30/50/65%) e o valor segue a fórmula (TCA−pagamentos)×(1−desconto)+taxas+PP. Feature svc#512 / R1.52.0 SettlementAmountService.
last-reviewed: 2026-07-01
last-reviewed-sha: 4280c5b
covers:
  - tests/e2e/servicing/settlement-amount.spec.ts
  - src/helpers/settlement.helpers.ts
  - src/helpers/account-aging.helpers.ts
  - src/pages/servicing/settlement-breakdown.modal.ts
  - src/selectors/common.selectors.ts
  - docs/business-rules/07-modificacoes-conta.md
  - docs/business-rules/06-conta-ciclo-vida.md
---

# Oracle BDD — Exibição do Settlement Amount (Servicing Information)

> **Gatilho:** qualquer ação que abra a página `/customer-information/{accountPk}` no portal Servicing e leia/clique no label "Settlement Amount" em "Account & Contract Overview", ou que chame `GET /uown/svc/getServicingInfo/{accountPk}` para obter `settlementAmount` / `settlementAmountBreakdown`. Inclui a mera VISUALIZAÇÃO do modal "Settlement Breakdown" (rule #19 — leitura pura também exige oracle).
>
> **Verificação de obsolescência:**
> ```bash
> git log 4280c5b..HEAD -- \
>   tests/e2e/servicing/settlement-amount.spec.ts \
>   src/helpers/settlement.helpers.ts \
>   src/helpers/account-aging.helpers.ts \
>   src/pages/servicing/settlement-breakdown.modal.ts \
>   src/selectors/common.selectors.ts \
>   docs/business-rules/07-modificacoes-conta.md \
>   docs/business-rules/06-conta-ciclo-vida.md
> ```
> Sem output = oracle está atual.
>
> **Viewport:** Servicing é portal interno voltado para agentes. Obrigatório **1440×900** (regra #15 — `d-lg-block` oculta painéis abaixo de 992 px).
>
> **Gate de identidade (pré-condição de toda navegação):** abrir `/customer-information/{accountPk}` dispara o modal "Customer Information Confirmation" que intercepta cliques. `dismissCustomerInfoConfirmation(page)` deve rodar ANTES de ler/clicar no label — sem isso o clique no "Settlement Amount" é interceptado e o modal sob teste nunca abre (raiz de 18/18 falhas do spec, 2026-05-22). Fonte: `settlement-breakdown.modal.ts:90`.
>
> **Fórmula canônica (oracle independente):**
> ```
> desconto   = offerPercentForDays(dias_em_atraso) / 100   // 0 / 30 / 50 / 65
> settlement = (TCA − totalPagamentos) × (1 − desconto) + totalTaxas + ppFee
> ```
> `offerPercent` é o DESCONTO ofertado, NÃO o que o cliente paga. Fonte: `settlement.helpers.ts:43-66`.
>
> **Mapa de faixas dias-em-atraso → desconto (canônico):**
>
> | Dias em atraso | Desconto | Faixa de e-mail correspondente (business-rules §20) |
> |---|---|---|
> | ≤ 60 | 0% (saldo cheio, sem desconto) | Delinquency30DayOffer (31–60) |
> | 61 – 90 | 30% | Delinquency60DayOffer + SMS |
> | 91 – 150 | 50% | Delinquency90DayOffer + SMS |
> | ≥ 151 | 65% | Delinquency150DayOffer + SMS |
>
> Fonte do mapa: `settlement.helpers.ts:12-18,43-48`; alinhamento com faixas de e-mail: `docs/business-rules/06-conta-ciclo-vida.md#20-delinquency-and-collections` (linhas 128-137).
>
> **Log de Atividade (Regra #13) — exceção legítima:** a exibição do Settlement Amount é READ-ONLY. Abrir o modal NÃO muta estado, NÃO chama endpoint de escrita e NÃO gera linha em `uown_los_lead_notes` (por design — SPEC §9). Nenhuma validação de log é exigida; a asserção defensiva "ausência de novo log" foi removida por consultar coluna inexistente (`uown_los_lead_notes.account_pk` não existe — tabela é chaveada por `lead_pk`). Fonte: `settlement-amount.spec.ts:33-37,146-158`.
>
> **Fontes primárias de negócio:**
> - Settlement/Payoff Agreement: `docs/business-rules/07-modificacoes-conta.md#35-settlement-payoff-agreement`
> - Delinquência e ratings: `docs/business-rules/06-conta-ciclo-vida.md#20-delinquency-and-collections` + §19 (Rating Letters)
> - Backend: svc R1.52.0 `SettlementAmountService` + `getSettlementAmount.sql` (`GETSETTLEMENTAMOUNT` em `uown_sv_sql_config`); FE `uown/frontend/servicing!689`.

---

## CT-01 — Faixa 0–60 dias: label visível, modal abre, desconto 0%

```gherkin
Dado que o agente abre a página de informações de uma conta com 0 a 60 dias em atraso no portal Servicing
Então o label "Settlement Amount" está visível no painel "Account & Contract Overview"
Quando o agente clica no label "Settlement Amount"
Então o modal "Settlement Breakdown" é exibido
E a linha de oferta ("Offer") apresenta o desconto de 0% correspondente à faixa de dias em atraso
E o valor de settlement retornado pela API é maior ou igual a zero (saldo residual, sem desconto aplicado)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Label visível no painel | `settlementLabel` = `getByText('Settlement Amount', { exact: true }).first()` visível (timeout 5 s) | `settlement-breakdown.modal.ts:31-34,74-77`; `settlement-amount.spec.ts:193-195` |
| Modal abre | `SELECTORS.settlementBreakdownModal` (`.modal.show`) fica visível após clique no label | `settlement-breakdown.modal.ts:36,84-94` |
| Desconto da faixa | `getRowValue('offer')` NÃO nulo E contém `String(offerPercentForDays(dias))` = `"0"` | `settlement-amount.spec.ts:200-207`; `settlement.helpers.ts:43-48` |
| Valor via API (faixa 0) | `getServicingInfo(accountPk).body.settlementAmount >= 0` | `settlement-amount.spec.ts:209-217` |
| Q-D8 (comportamento capturado) | quando desconto = 0%, o modal PODE ainda exibir "0%"; asserção captura comportamento atual pendente de decisão do PO | `settlement-amount.spec.ts:202-206` |

```sql
-- dias em atraso (fonte única da faixa de desconto) — substituir $account_pk
SELECT GREATEST(0, CURRENT_DATE - delinquency_as_of_date)::int
  FROM uown_sv_sched_summary WHERE account_pk = $account_pk;
```

---

## CT-02 — Faixa 61–90 dias: desconto 30% + itens de linha do breakdown

```gherkin
Dado que o agente abre a página de uma conta com 61 a 90 dias em atraso
Quando o agente abre o modal "Settlement Breakdown"
Então o breakdown lista as linhas obrigatórias: Total Contract Amount, Total Payments, Days Delinquent, Offer % e Settlement Amount
E a linha "Offer" apresenta o desconto de 30% correspondente à faixa
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Itens de linha obrigatórios | os labels (lowercase) contêm ao menos um de cada: `contract`, `payment`, `delinquent`, `offer`, `settlement` | `settlement-amount.spec.ts:234-241` |
| Desconto da faixa | linha cujo label contém `offer` → `value` contém `"30"` (= `offerPercentForDays(dias)`) | `settlement-amount.spec.ts:243-246` |
| **OBSERVATION BUG-2 (não bloqueante)** | o TCA exibido no PAINEL (inclui taxas) DIVERGE do TCA no MODAL (bruto). O MODAL é a fonte de verdade; o valor do painel é capturado via `test.info().annotations` como informação, o teste PASSA. | `settlement-amount.spec.ts:248-257`; SPEC §10 |
| Fixture BUG-2 | conta 4322 possui late fee de $15 (caso que expõe a divergência painel×modal) | `settlement-amount.spec.ts:95-96` |

---

## CT-03 — Faixa 91–150 dias: desconto 50%

```gherkin
Dado que o agente abre a página de uma conta com 91 a 150 dias em atraso
Quando o agente abre o modal "Settlement Breakdown"
Então a linha "Offer" apresenta o desconto de 50% correspondente à faixa
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Desconto da faixa | linha `offer` → `value` contém `String(offerPercentForDays(dias))` = `"50"` | `settlement-amount.spec.ts:262-276`; `settlement.helpers.ts:45` |

---

## CT-04 — Faixa >150 dias: desconto 65%

```gherkin
Dado que o agente abre a página de uma conta com mais de 150 dias em atraso
Quando o agente abre o modal "Settlement Breakdown"
Então a linha "Offer" apresenta o desconto de 65% (faixa máxima)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Faixa máxima confirmada | `offerPercentForDays(dias) === 65` para dias ≥ 151 | `settlement-amount.spec.ts:281-291`; `settlement.helpers.ts:46-47` |
| Desconto exibido | linha `offer` → `value` contém `"65"` | `settlement-amount.spec.ts:293-296` |

---

## CT-05 — Análise de valor limite (boundary) + oracle matemático da fórmula

```gherkin
Dado uma conta-semente de settlement dedicada (aging autorizado por SPEC §5)
Quando a conta é envelhecida para exatamente D dias em atraso e o modal é reaberto
Então o desconto exibido corresponde à faixa de D dias
E o Settlement Amount retornado pela API é igual (2 casas) ao valor calculado pelo oracle independente (TCA−pagamentos)×(1−desconto)+taxas+PP
E a conta é restaurada para a baseline de 60 dias ao final (try/finally obrigatório)
```

### Oracle — casos de fronteira (off-by-one)

| Sub-caso | Dias | Desconto esperado | Fonte |
|---|---|---|---|
| A5.1 | 60 | 0% | `settlement-amount.spec.ts:311`; `settlement.helpers.ts:44` |
| A5.2 | 61 | 30% | `settlement-amount.spec.ts:312` |
| A5.3 | 90 | 30% | `settlement-amount.spec.ts:313`; `settlement.helpers.ts:45` |
| A5.4 | 91 | 50% | `settlement-amount.spec.ts:314` |
| A5.5 | 150 | 50% | `settlement-amount.spec.ts:315` |
| A5.6 | 151 | 65% | `settlement-amount.spec.ts:316`; `settlement.helpers.ts:46-47` |

### Oracle — checkpoints do CT-05

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Envelhecimento aplicado | `ageAccount(db, accountPk, D)` seta `delinquency_as_of_date = CURRENT_DATE − D`; retorna ≥ 1 linha | `account-aging.helpers.ts:45-66` |
| Dias em atraso confirmados | `readOracle().daysDelinquent === D` | `settlement-amount.spec.ts:330-331` |
| Desconto exibido | linha `offer` → `value` contém `String(D_esperado)` | `settlement-amount.spec.ts:333-334` |
| Oracle matemático | `apiSettlement` ≈ `calculateSettlement({ tca, totalPayments, daysDelinquent: D, totalFees, ppFee })` com `toBeCloseTo(expected, 1)` | `settlement-amount.spec.ts:336-357`; `settlement.helpers.ts:58-66` |
| Restauração obrigatória (SPEC §11) | `finally { restoreAccount(db, accountPk, SEED_DELINQUENCY_DAYS=60) }` roda mesmo em falha de asserção | `settlement-amount.spec.ts:360-363`; `account-aging.helpers.ts:35,75-81` |
| Autorização de UPDATE | UPDATE em `uown_sv_sched_summary` autorizado apenas para as sementes 4353/4355/4358/4359 (SPEC §5) — nenhuma outra conta pode ser envelhecida | `account-aging.helpers.ts:11-14` |

```sql
-- Oracle: dias em atraso após envelhecimento — substituir $account_pk
SELECT GREATEST(0, CURRENT_DATE - delinquency_as_of_date)::int
  FROM uown_sv_sched_summary WHERE account_pk = $account_pk;
```

---

## CT-06 — Inelegibilidade (rating B/C, conta não-ACTIVE): Settlement = $0.00

```gherkin
Dado que o agente abre a página de uma conta inelegível para settlement (rating B — Discharged Bankruptcy, rating C — Confirmed Bankruptcy, ou status PAID_OUT)
Quando a API getServicingInfo é consultada para a conta
Então o Settlement Amount retornado é exatamente 0
E se o label "Settlement Amount" for clicável, o modal exibe conteúdo explicativo (mensagem "Not eligible") em vez de abrir vazio
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Settlement = 0 (rating B) | `getServicingInfo(2553).body.settlementAmount === 0` | `settlement-amount.spec.ts:375-381`; fixture `B1_ratingB` linha 106 |
| Settlement = 0 (rating C) | `getServicingInfo(1185).body.settlementAmount === 0` (skip fora de qa1) | `settlement-amount.spec.ts:406-412` |
| Settlement = 0 (PAID_OUT) | `getServicingInfo(107).body.settlementAmount === 0` (skip fora de qa1) | `settlement-amount.spec.ts:414-420` |
| Significado dos ratings | B = Discharged Bankruptcy; C = Confirmed Bankruptcy — ambos fortemente excluídos das sweeps de cobrança | `docs/business-rules/06-conta-ciclo-vida.md#19` (linhas 91,93) |
| **FIXME(BUG-1) — pendente Q-D3** | HOJE o modal abre VAZIO (só título + X) em contas com $0.00; a asserção espera o comportamento CORRETO — modal com conteúdo explicativo OU label não-clicável. Grupo B marcado `@pending-decision`; FALHA hoje, PASSA quando BUG-1 for corrigido. | `settlement-amount.spec.ts:369-401`; `settlement-breakdown.modal.ts:96-104` |

```sql
-- (referência) status da conta — substituir $account_pk
SELECT account_status FROM uown_sv_account WHERE pk = $account_pk;
```

---

## CT-07 — Breakdown lista o conjunto completo de itens de linha

```gherkin
Dado que o agente abre o modal "Settlement Breakdown" de uma conta elegível
Então o breakdown lista todas as linhas: Total Contract Amount, Total Payments, Days Delinquent, Offer %, Total Fees e Settlement Amount
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Conjunto completo de linhas | labels (lowercase) contêm ao menos um de cada: `contract`, `payment`, `delinquent`, `offer`, `fee`, `settlement` | `settlement-amount.spec.ts:425-439` |
| Extração de linhas | `getBreakdownRows()` lê pares `{label, value}` de `SELECTORS.settlementBreakdownRow` (`<tr>` th/td ou `<li>`), ordem preservada topo→base | `settlement-breakdown.modal.ts:119-153` |

---

## CT-08 — Formatação de moeda consistente ($X.XX) — OBSERVATION BUG-4

```gherkin
Dado que o agente abre o modal "Settlement Breakdown"
Quando as linhas monetárias (Total Contract Amount, Total Payments, Total Fees, Settlement Amount) são lidas
Então cada valor monetário segue o formato $X.XX (com cifrão e duas casas decimais)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Regex de moeda | cada valor monetário casa `/^\$\d[\d,]*\.\d{2}$/` | `settlement-amount.spec.ts:460-470` |
| **BUG-4 (IMPROVEMENT, P3 — não bloqueante)** | linhas com zero monetário renderizam `"0"` em vez de `"$0.00"` (SQL `CAST(value AS text)` devolve `"0"` para zeros inteiros; regex do FE exige decimal). Inconsistente no mesmo modal (Total Payments tem `$`, Total Fees zero não tem). Capturado via `test.info().annotations`; teste PASSA. Classificado IMPROVEMENT por Yuri 2026-05-22. | `settlement-amount.spec.ts:442-478` |

---

## CT-09 — [AC#2] Settlement Amount = saldo do Delinquency150DayOfferEmail

```gherkin
Dado que o agente abre a página da conta 200 (1423 dias em atraso, qa1) que já recebeu o e-mail de oferta de 150 dias
Quando o agente abre o modal "Settlement Breakdown"
Então a linha "Settlement Amount" apresenta o valor $1,094.65
E esse valor é igual (comparação por valor, ignorando formatação/separador de milhar) ao saldo usado pelo Delinquency150DayOfferEmail
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Linha presente | `getRowValue('settlement amount')` NÃO nulo | `settlement-amount.spec.ts:505-509` |
| Valor exato (AC#2) | normalizado (só dígitos/ponto/sinal) === `"1094.65"` | `settlement-amount.spec.ts:513-517` |
| Fonte do oracle do valor | SQL `correspondence/templates/fieldsSQL/delinquency-offer.sql` (svc R1.52.0) executado sobre a conta 200; e-mail enfileirado confirmado em `uown_email_queue` pks 222925/223868/224829 (leitura DB 2026-05-22) | `settlement-amount.spec.ts:480-499` |
| Ambiente | qa1 apenas (`test.skip(env !== 'qa1')`) — oracle hardcoded para a conta 200 | `settlement-amount.spec.ts:498` |
| **BUG-5 (não bloqueante)** | painel pode usar separador de milhar (`$1,094.65`) e modal renderizar sem (`$1094.65`); AC#2 exige equivalência de VALOR, não de formatação — ambos aceitos após normalização | `settlement-amount.spec.ts:494-496,511-513` |

> **Manutenção:** atualizar este valor exige re-executar `delinquency-offer.sql` contra a conta 200 — o arquivo vive no repo svc, não neste. [HYPOTHESIS quanto à estabilidade do valor] — $1,094.65 é um snapshot capturado 2026-05-22; se a conta 200 sofrer pagamento/aging o valor muda e o CT-09 fica stale.

---

## CT-10 — Linha "Protection Plan Fee" presente quando há PP ativo

```gherkin
Dado que o agente abre o modal "Settlement Breakdown" de uma conta com Protection Plan ativo (conta 3755, fee $110, qa1)
Então o breakdown inclui a linha "Protection Plan Fee"
E o valor da linha contém 110
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Linha PP presente | `getRowValue('protection plan')` NÃO nulo | `settlement-amount.spec.ts:528-529` |
| Valor da linha PP | casa `/110/` | `settlement-amount.spec.ts:530` |
| Papel na fórmula | `ppFee` é somado ao settlement APÓS o desconto: `(TCA−pagamentos)×(1−desconto) + taxas + ppFee` | `settlement.helpers.ts:58-66` |
| Ambiente | qa1 apenas (`test.skip(env !== 'qa1')`) — fixture conta 3755 | `settlement-amount.spec.ts:523` |

---

## CT-11 — Rating P (Payment Arrangement): comportamento capturado, decisão pendente

```gherkin
Dado que o agente abre a página de uma conta com rating P (Payment Arrangement, conta 4492)
Então o label "Settlement Amount" está visível
E o Settlement Amount retornado pela API é maior que zero (comportamento ATUAL capturado)
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Label visível | `isLabelVisible() === true` | `settlement-amount.spec.ts:542` |
| Settlement > 0 (atual) | `getServicingInfo(4492).body.settlementAmount > 0` | `settlement-amount.spec.ts:543-545` |
| Rating P — significado | P = Payment Arrangement; removido automaticamente após 60 dias; excluído das sweeps de pagamento agendado | `docs/business-rules/06-conta-ciclo-vida.md#19` (linha 90) |
| **[HYPOTHESIS] — Q-D2 pendente** | o suite marca este grupo `describe.skip('@pending-decision Q-D2')`. NÃO é comportamento enforced — apenas captura o valor atual até Yuri decidir se rating P deve ou não exibir settlement. NÃO tratar como contrato validado. | `settlement-amount.spec.ts:536-547` |

---

## CT-12 — Paridade de marca: Kornerstone renderiza igual à UOWN

```gherkin
Dado que o agente abre a página de uma conta de merchant Kornerstone (KS3015, conta 3944)
Quando o agente abre o modal "Settlement Breakdown"
Então o label está visível, o modal abre e a linha "Offer" apresenta o desconto correto para a faixa de dias em atraso — idêntico ao comportamento de uma conta UOWN
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Label visível | `isLabelVisible() === true` | `settlement-amount.spec.ts:555` |
| Modal abre | `openModal()` sem erro | `settlement-amount.spec.ts:556` |
| Desconto por faixa | linha `offer` → `value` contém `String(offerPercentForDays(dias))` | `settlement-amount.spec.ts:557-561` |
| Fixture Kornerstone | conta 3944 (KS3015), ~304 dias em atraso na captura | `settlement-amount.spec.ts:113-114` |

---

## CT-13 — Permissão: acesso padrão do usuário tester exibe o Settlement

```gherkin
Dado que o agente autenticado com o acesso padrão do portal Servicing abre a página de uma conta elegível
Então o label "Settlement Amount" está visível
E ao clicar no label o modal "Settlement Breakdown" abre e o título "Settlement Breakdown" fica visível — o acesso padrão concede tanto a visualização quanto o clique
```

### Oracle

| Checkpoint | Esperado | Fonte |
|---|---|---|
| Label visível (acesso padrão) | `isLabelVisible(8_000) === true` | `settlement-amount.spec.ts:571` |
| Título do modal visível | `modalTitle` (`getByText('Settlement Breakdown', { exact: true })` escopado ao modal) visível após clique | `settlement-breakdown.modal.ts:38-43`; `settlement-amount.spec.ts:572-574` |

---

## Pré-condições

- **Gate de identidade:** `dismissCustomerInfoConfirmation(page)` antes de ler/clicar no label em toda página de customer-information (`settlement-breakdown.modal.ts:75,90`).
- **Viewport:** `1440×900` (portal interno, regra #15).
- **Hierarquia de dados (Regra #9 — EXCEÇÃO documentada):** todas as contas são fixtures pré-existentes de qa1 porque o rating (B/C/P) e o aging de delinquência dependem de histórico real que não pode ser reproduzido via automação fresca em < 10 min/CT (SPEC §5). PKs pinados; expectativas derivadas dinamicamente da API/DB no momento do teste (`daysDelinquent` lido antes de computar o oracle).
- **Sem preflight de merchant (Regra #12):** contas existentes NÃO chamam `ensureMerchantReady` — mutar config de merchant fora de escopo é efeito colateral (`settlement-amount.spec.ts:23-25`).
- **Autorização de UPDATE (Exceção 3):** aging via `ageAccount`/`restoreAccount` autorizado APENAS para as sementes 4353/4355/4358/4359 (SPEC §5), sempre em try/finally restaurando 60 dias.

## Log de Atividade (Regra #13)

Exibição do Settlement Amount é READ-ONLY — NÃO gera log em `uown_los_lead_notes` (por design, SPEC §9). Esta é a única exceção legítima à Regra #13 aplicável aqui: nenhuma ação de negócio muta estado. Ver bloco de cabeçalho para o histórico do `assertNoNewActivityLog` removido (consultava coluna inexistente `uown_los_lead_notes.account_pk`).

## Bugs conhecidos referenciados (asserções escritas para o comportamento CORRETO)

| Bug | Descrição | Onde | Bloqueante? |
|---|---|---|---|
| BUG-1 | modal abre vazio (só título+X) em contas $0.00 inelegíveis | CT-06, `@pending-decision` Q-D3 | Sim — grupo B FALHA até correção |
| BUG-2 | TCA do painel (com taxas) ≠ TCA do modal (bruto) | CT-02, OBSERVATION | Não — modal é fonte de verdade |
| BUG-4 | zero monetário renderiza `"0"` sem `$X.XX` | CT-08, IMPROVEMENT P3 | Não — anotação |
| BUG-5 | painel usa separador de milhar, modal não | CT-09 | Não — AC#2 exige valor, não formatação |

## Decisões de PO pendentes

- **Q-D2** (rating P deve exibir settlement?) → CT-11 `describe.skip @pending-decision` [HYPOTHESIS]
- **Q-D3** (modal em conta $0.00 — mensagem "Not eligible" OU label não-clicável?) → CT-06 grupo B
- **Q-D8** (exibir "0%" quando desconto = 0%?) → CT-01 captura comportamento atual

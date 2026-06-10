# Tests in qa1

---

## O que foi testado

### 1. Cálculo do Settlement Amount por faixa de inadimplência

Verificamos que o desconto oferecido segue corretamente as faixas de dias de atraso:


| Cenário                       | Conta testada | Dias de atraso | Desconto esperado | Resultado                 |
| ----------------------------- | ------------- | -------------- | ----------------- | ------------------------- |
| Conta saudável (sem desconto) | acc 4091      | 35 dias        | 0% (sem desconto) | ✅ $893,23 (= saldo cheio) |
| Faixa 61-90 dias              | acc 4322      | 89 dias        | 30% off           | ✅ $2.098,44               |
| Faixa 91-150 dias             | acc 4006      | 122 dias       | 50% off           | ✅ $890,42                 |
| Faixa acima de 150 dias       | acc 200       | 1423 dias      | 65% off           | ✅ $1.094,65               |


### 2. Cenários de borda (transições entre faixas)

Validamos que o cliente recebe o desconto correto exatamente quando muda de faixa:


| Cenário                            | Dias     | Desconto aplicado | Resultado |
| ---------------------------------- | -------- | ----------------- | --------- |
| Último dia da faixa "sem desconto" | 60 dias  | 0%                | ✅         |
| Primeiro dia da faixa 30%          | 61 dias  | 30%               | ✅         |
| Último dia da faixa 30%            | 90 dias  | 30%               | ✅         |
| Primeiro dia da faixa 50%          | 91 dias  | 50%               | ✅         |
| Último dia da faixa 50%            | 150 dias | 50%               | ✅         |
| Primeiro dia da faixa 65%          | 151 dias | 65%               | ✅         |


### 3. Contas que não devem oferecer Settlement


| Cenário                                   | Conta testada | Esperado | Resultado |
| ----------------------------------------- | ------------- | -------- | --------- |
| Cliente em falência (rating B)            | acc 2553      | $0,00    | ✅         |
| Cliente em falência confirmada (rating C) | acc 1185      | $0,00    | ✅         |
| Conta já liquidada (PAID_OUT)             | acc 107       | $0,00    | ✅         |


### 4. Componentes da fórmula no breakdown

Quando o agent clica em "Settlement Amount", o modal "Settlement Breakdown" deve abrir mostrando:

- Dias de atraso
- Percentual de desconto
- Valor total do contrato
- Total já pago
- Taxas (late fees, etc.)
- Protection Plan Fee (quando aplicável)
- Fórmula em texto
- Valor final do Settlement

**Todos os componentes apareceram corretamente** em todas as contas testadas.

### 5. Protection Plan Fee no breakdown

Quando a conta tem Protection Plan vencida, o valor deve ser somado ao Settlement:


| Conta    | Protection Plan vencida | Settlement esperado | Resultado                                                    |
| -------- | ----------------------- | ------------------- | ------------------------------------------------------------ |
| acc 3755 | $110,00                 | $1.128,32           | ✅ Linha "Protection Plan Fee: $110,00" presente no breakdown |


### 6. Consistência com Settlement Email

A regra de negócio mais importante (AC #2): **o valor mostrado no painel deve ser exatamente igual ao valor que o cliente recebe no email de oferta**.


| Conta   | Valor no painel | Valor no email (Delinquency 150 Day Offer) | Match?           |
| ------- | --------------- | ------------------------------------------ | ---------------- |
| acc 200 | $1.094,65       | $1.094,65                                  | ✅ **Bate exato** |


### 7. Kornerstone

Validamos que clientes Kornerstone usam a mesma regra de cálculo:


| Conta    | Merchant                      | Settlement | Resultado                         |
| -------- | ----------------------------- | ---------- | --------------------------------- |
| acc 3944 | KS3015 (5th Ave Furniture NY) | $1.103,18  | ✅ Calcula idêntico ao UOWN padrão |


### 8. Permissão de acesso

Confirmamos que qualquer agent com permissão padrão de Servicing (`customer_information [access]`) consegue ver o Settlement Amount, não foi necessária permissão adicional.

---

## Critérios de Aceitação (do ticket)


| AC  | Descrição                                          | Status                                                           |
| --- | -------------------------------------------------- | ---------------------------------------------------------------- |
| #1  | Settlement Amount visível no Servicing Information | ✅ Confirmado                                                     |
| #2  | Valor bate com o usado no Settlement Email         | ✅ Confirmado                                                     |
| #3  | Comportamento para contas sem settlement data      | ✅ Confirmado (mostra $0,00 — comportamento existente do produto) |


---

## Observações sobre comportamentos do produto

> ⚠️ Os itens abaixo NÃO são bugs introduzidos por esta tarefa. São comportamentos que já existiam no produto antes do #512 — apenas ficaram visíveis agora que o Settlement Amount foi adicionado ao painel. Listados aqui para conhecimento do PO, sem necessidade de ação imediata.

### Observação 1 — Modal abre sem conteúdo em contas inelegíveis

Quando uma conta tem Settlement = $0,00 (clientes em falência, contas PAID_OUT, CANCELLED), o label "Settlement Amount" continua clicável e abre um modal vazio (só com título e botão X).

**Por que é pré-existente:** O mesmo componente é usado pelos modais EPO Breakdown e 90-Day Breakdown, que também têm esse comportamento.

**Como reproduzir:** abrir conta `2553` (rating B) → clicar em "Settlement Amount" → modal abre vazio.

**Sugestão futura (opcional):** esconder o campo para contas inelegíveis, ou mostrar `-` em vez de `$0,00`.

---

### Observação 2 — Diferença no Total Contract Amount entre painel e breakdown

Em contas com late fees ativos, o "Total Contract Amount" mostrado no painel principal é diferente do valor mostrado dentro do breakdown:

- **Painel:** mostra o valor já somado com fees
- **Breakdown:** mostra o valor original, com fees em linha separada

**Por que é pré-existente:** o painel sempre exibiu valores agregados; o breakdown separa componentes da fórmula para transparência.

**Como reproduzir:** abrir conta `4322` → comparar "Total Contract Amount" no painel ($3.260,98) com o mesmo campo no breakdown ($3.245,98). Diferença = $15 (late fee ativo).

**Sugestão futura (opcional):** padronizar valores ou adicionar tooltip explicativo.

---

### Observação 3 — Valores zerados aparecem sem formato de dinheiro

Linhas do breakdown com valor zero (ex.: "Total Fees: 0" quando não há fees) aparecem como `0` ao invés de `$0,00`. Linhas com valor > 0 aparecem corretamente formatadas (`$269,64`).

**Por que é pré-existente:** o formato vem da SQL — quando o valor é zero, retorna apenas o número. O FE depende de ter casas decimais para identificar como moeda.

**Como reproduzir:** abrir qualquer conta com `Total Fees: 0` → ver no breakdown.

**Sugestão futura (opcional):** garantir que todos os valores monetários apareçam como `$X,XX`.

---

## Contas usadas (para validação manual em qa1)

Para qualquer validação adicional pelo PO ou stakeholder, acesse `https://svc-website-qa1.uownleasing.com/customer-information/{accountPk}` com user `test.tester`:


| Conta | Cenário                                  |
| ----- | ---------------------------------------- |
| 4091  | Conta saudável (0-60 dias, sem desconto) |
| 4322  | Faixa 61-90 (com late fee)               |
| 4006  | Faixa 91-150                             |
| 200   | Faixa >150 (1423 dias)                   |
| 3755  | Com Protection Plan vencida              |
| 2553  | Rating B (em falência)                   |
| 107   | Conta liquidada (PAID_OUT)               |
| 4492  | Rating P (Payment Arrangement ativo)     |
| 3944  | Kornerstone KS3015                       |



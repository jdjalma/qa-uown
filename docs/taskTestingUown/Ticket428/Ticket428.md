--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/428


---

# UOWN | Servicing | Add New Breakdowns to Servicing Information (Account Page)

## Status

**Open**
Ticket created 1 week ago by Yuri Araujo

---

## Synopsis

The **Account page** in the **Servicing** module recently underwent a **Servicing Information redesign**.
As part of **technical debt cleanup**, additional financial breakdowns must now be added to complete the redesign, following the structure and layout shown in the reference images.

---

## Required Breakdowns

The following breakdowns must be added to the **Servicing Information** section of the Account page:

1. **Total Contract Amount Breakdown**
2. **Contract Balance Breakdown**
3. **90 Day Breakdown**

![Image](https://www.prestonhyundaiusa.com/static/group-preston-automotive-group/TAG_Chart.jpg)

![Image](https://www.typecalendar.com/wp-content/uploads/2023/08/HVAC-Contract.jpg)

![Image](https://uownleasing.com/wp-content/uploads/2023/09/ConfirmationEmailGroup_v2-002.png)

---

## Business Objective

Complete the **Servicing Information redesign** by ensuring that all required breakdowns are available on the Account page, improving:

* Financial transparency
* Visual consistency
* User clarity when reviewing contract and balance information

---

## Feature Request | Business Requirements

### 1. Add New Breakdowns to Servicing Information

On the **Servicing Account page**, implement the following breakdown modals:

* **Total Contract Amount Breakdown**
* **Contract Balance Breakdown**
* **90 Day Breakdown**

Each breakdown must display the same data structure and formatting as shown in the reference images.

---

### 2. Align With Existing Redesign

* The new breakdowns **must follow the current Servicing redesign standards**
* Layout, spacing, typography, and hierarchy must be consistent
* UI behavior must mirror the existing **EPO Breakdown** experience

---

### 3. Technical Debt Scope

* This ticket **does not introduce new business logic**
* No recalculation, aggregation, or rule changes are expected
* The scope is strictly **UI completion and alignment**

---

## Acceptance Criteria

* [ ] All three new breakdowns are visible in the **Servicing Information** section
* [ ] Breakdown layout matches the **EPO Breakdown** layout
* [ ] Values, labels, and totals are visually aligned with reference images
* [ ] No regression in existing Servicing Information components
* [ ] No new backend logic introduced

---

## Validation Rule (Summary)

> The task is considered complete when the **new breakdown layouts visually and structurally match the EPO breakdown**, following the redesigned Servicing Information standard.

--------------------------------------------------------------------------------------------------------------------------------------------------------

# UOWN | Servicing | Adicionar Novos Breakdowns nas Informações de Servicing (Página da Conta)

## Status

**Aberto**
Tíquete criado há 1 semana por Yuri Araujo

---

## Sinopse

A **página de Conta** do módulo **Servicing** passou recentemente por um **redesign das Informações de Servicing**.
Como parte da **quitação de débito técnico**, novos breakdowns financeiros precisam ser adicionados para completar esse redesign, conforme demonstrado nas imagens de referência.

---

## Breakdowns Necessários

Os seguintes breakdowns devem ser adicionados à seção **Servicing Information** da página da conta:

1. **Total Contract Amount Breakdown**
2. **Contract Balance Breakdown**
3. **90 Day Breakdown**

---

## Objetivo de Negócio

Finalizar o **redesign das Informações de Servicing**, garantindo que todos os breakdowns planejados estejam disponíveis, proporcionando:

* Maior clareza financeira
* Consistência visual
* Melhor entendimento dos valores de contrato e saldo

---

## Solicitação de Funcionalidade | Requisitos de Negócio

### 1. Adicionar Novos Breakdowns nas Informações de Servicing

Na **página de Conta do Servicing**, implementar os seguintes modais de breakdown:

* **Total Contract Amount Breakdown**
* **Contract Balance Breakdown**
* **90 Day Breakdown**

Cada breakdown deve seguir exatamente a estrutura apresentada nas imagens de referência.

---

### 2. Alinhamento com o Redesign Existente

* Os novos breakdowns **devem seguir o padrão visual do redesign atual**
* Layout, espaçamentos, tipografia e hierarquia devem ser consistentes
* O comportamento da UI deve espelhar o **EPO Breakdown**

---

### 3. Escopo de Débito Técnico

* Este ticket **não introduz novas regras de negócio**
* Nenhum cálculo ou lógica adicional deve ser criada
* O foco é exclusivamente **completar e alinhar a interface**

---

## Critérios de Aceite

* [ ] Os três novos breakdowns estão disponíveis na seção **Servicing Information**
* [ ] O layout corresponde ao **EPO Breakdown**
* [ ] Valores, labels e totais seguem o padrão visual esperado
* [ ] Nenhuma regressão nos componentes existentes
* [ ] Nenhuma alteração de lógica backend

---

## Regra de Validação (Resumo)

> A tarefa é considerada concluída quando os **novos breakdowns apresentam layout e estrutura idênticos ao EPO breakdown**, seguindo o padrão do redesign de Servicing.

---


--------------------------------------------------------------------------------------------------------------------------------------------------------

---
Funcionalidade: Servicing Information - Breakdowns Financeiros

  A página de Account no Servicing deve exibir breakdowns financeiros
  seguindo o padrão visual do redesign existente.

  Contexto:
    Dado que o agente esteja logado no UOWN
    E acesse o módulo Servicing
    E abra a página de uma Account

  # ----------------------------------
  # Total Contract Amount Breakdown
  # ----------------------------------

  Cenário: Visualizar Total Contract Amount Breakdown
    Quando o agente clica em "Total Contract Amount"
    Então um modal com o título "Total Contract Amount Breakdown" deve ser exibido
    E o modal deve listar valores de contrato, taxas, fees e total
    E a linha de total deve estar visualmente destacada
    E os valores devem estar alinhados à direita
    E o layout deve seguir o padrão do EPO Breakdown

  # ----------------------------------
  # Contract Balance Breakdown
  # ----------------------------------

  Cenário: Visualizar Contract Balance Breakdown
    Quando o agente clica em "Contract Balance"
    Então um modal com o título "Contract Balance Breakdown" deve ser exibido
    E o modal deve conter todas as linhas do breakdown de contrato
    E o modal deve exibir valor pago e saldo restante
    E o saldo deve refletir o total do contrato menos o valor pago
    E o layout deve seguir o padrão do EPO Breakdown

  # ----------------------------------
  # 90 Day Breakdown
  # ----------------------------------

  Cenário: Visualizar 90 Day Breakdown
    Quando o agente clica em "90-day Total"
    Então um modal com o título "90 Day Breakdown" deve ser exibido
    E o modal deve listar encargos relacionados à invoice e o total
    E o layout deve ser consistente com os demais breakdowns do Servicing

  # ----------------------------------
  # Comportamento do Modal
  # ----------------------------------

  Cenário: Fechar modal de breakdown
    Dado que um modal de breakdown esteja aberto
    Quando o agente clica no ícone de fechar
    Então o modal deve ser fechado
    E o agente deve permanecer na página da Account no Servicing

  # ----------------------------------
  # Tratamento de Ausência de Dados
  # ----------------------------------

  Cenário: Abrir breakdown sem dados disponíveis
    Dado que a Account não possua dados financeiros disponíveis
    Quando o agente abre qualquer modal de breakdown
    Então o modal deve abrir sem erros
    E nenhum valor deve ser exibido
    E nenhuma nova lógica de cálculo deve ser executada

--------------------------------------------------------------------------------------------------------------------------------------------------------


## Tests in qa1

### Feature: Servicing Information – Financial Breakdowns

```gherkin

  Scenario: View Total Contract Amount Breakdown
    When the agent clicks on "Total Contract Amount"
    Then a modal titled "Total Contract Amount Breakdown" should be displayed
    And the modal should list contract amounts, taxes, fees, and total
    And the total row should be visually highlighted
    And values should be right-aligned
    And the layout should follow the EPO Breakdown standard

```

![Screenshot_at_Jan_07_12-20-21](/uploads/7cae97400f82064d1f10c0def73e8323/Screenshot_at_Jan_07_12-20-21.png){width=746 height=360}

![Screenshot_at_Jan_07_12-20-42](/uploads/81a3a108e9870fc32cc37eea083874f5/Screenshot_at_Jan_07_12-20-42.png){width=748 height=503}

**| PASS |**

---

```gherkin

  Scenario: View Contract Balance Breakdown
    When the agent clicks on "Contract Balance"
    Then a modal titled "Contract Balance Breakdown" should be displayed
    And the modal should include all contract amount breakdown rows
    And the modal should display paid amount and remaining balance
    And the balance should reflect the contract total minus the paid amount
    And the layout should follow the EPO Breakdown standard

```

![Screenshot_at_Jan_07_12-25-03](/uploads/c1978cd3be5ba3d8b44936fe3bfaed5c/Screenshot_at_Jan_07_12-25-03.png){width=748 height=433}

**| PASS |**

---

```gherkin

  Scenario: View 90 Day Breakdown
    When the agent clicks on "90-day Total"
    Then a modal titled "90 Day Breakdown" should be displayed
    And the modal should list invoice-related charges and total
    And the layout should be consistent with other Servicing breakdowns

```

![Screenshot_at_Jan_07_12-55-11](/uploads/ddebc9100e17f5bf3abd8c8850df6eec/Screenshot_at_Jan_07_12-55-11.png){width=743 height=320}

**| PASS |**

---

```gherkin

  Scenario: Close breakdown modal
    Given a breakdown modal is open
    When the agent clicks the close icon
    Then the modal should be closed
    And the agent should remain on the Servicing Account page

```
**| PASS |**

---

```gherkin

  Scenario: Open breakdown with no available data
    Given the Account has no financial data available
    When the agent opens any breakdown modal
    Then the modal should open without errors
    And no values should be displayed
    And no additional calculation logic should be triggered

```

![image](/uploads/6232ec80d528797f3ebef211089b5bd5/image.png){width=900 height=137}

![image](/uploads/e2bbdc21498d49d509f47d3159d63715/image.png){width=900 height=131}

![image](/uploads/1cc4ce6b7f85fe6a515ff01a33987e7f/image.png){width=900 height=130}

**| AccountPk: 4317 |**
**| PASS |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------



## Tests in stg

### Feature: Servicing Information – Financial Breakdowns

```gherkin

  Scenario: View Total Contract Amount Breakdown
    When the agent clicks on "Total Contract Amount"
    Then a modal titled "Total Contract Amount Breakdown" should be displayed
    And the modal should list contract amounts, taxes, fees, and total
    And the total row should be visually highlighted
    And values should be right-aligned
    And the layout should follow the EPO Breakdown standard

```

**| AccountPk: 206882 |**

**| PASS |**

---

```gherkin

  Scenario: View Contract Balance Breakdown
    When the agent clicks on "Contract Balance"
    Then a modal titled "Contract Balance Breakdown" should be displayed
    And the modal should include all contract amount breakdown rows
    And the modal should display paid amount and remaining balance
    And the balance should reflect the contract total minus the paid amount
    And the layout should follow the EPO Breakdown standard

```


**| PASS |**

---

```gherkin

  Scenario: View 90 Day Breakdown
    When the agent clicks on "90-day Total"
    Then a modal titled "90 Day Breakdown" should be displayed
    And the modal should list invoice-related charges and total
    And the layout should be consistent with other Servicing breakdowns

```

**| AccountPk: 206870 |**

**| PASS |**

---

```gherkin

  Scenario: Close breakdown modal
    Given a breakdown modal is open
    When the agent clicks the close icon
    Then the modal should be closed
    And the agent should remain on the Servicing Account page

```

**| AccountPk: 206870 |**

**| PASS |**

---

```gherkin

  Scenario: Open breakdown with no available data
    Given the Account has no financial data available
    When the agent opens any breakdown modal
    Then the modal should open without errors
    And no values should be displayed
    And no additional calculation logic should be triggered

```


**| AccountPk: 206884 |**

**| PASS |**

---
--------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/430

A seguir está a **tarefa traduzida e organizada**, entregue em **Markdown**, com **versão em inglês e em português**, mantendo fidelidade ao conteúdo original e clareza para uso em QA, produto e desenvolvimento.

---

# 🇺🇸 ENGLISH VERSION

## UOWN | Servicing | Remove Employer Field Requirement When Editing Employment

### Status

Open
Ticket created 23 hours ago by Yuri Araujo

---

## Synopsis

Currently, when accessing an **Account** in the **Servicing** module and attempting to edit any information in the **Employment** section, the system forces the user to complete required fields under the **Employer** subsection.

This behavior occurs even when **Employer data is not being modified**, creating unnecessary friction and blocking simple edits.

---

## Business Objective

Allow users to edit **Employment** information without being forced to fill in or update **Employer** fields, improving usability and flexibility within the Servicing module.

---

## Feature Request | Business Requirements

* Remove required-field validation for **Employer** fields during the **Employment edit flow**
* Preserve the current validation behavior **only when explicitly required by a defined business rule**

  * If validation is required, it must be **clear, intentional, and justified**

---

## Steps to Reproduce

1. User accesses an **Account** in the **Servicing** module
2. User navigates to the **Employment** section (lower-left side of the screen)
3. User attempts to edit any **Employment** field
4. The system requires mandatory completion of **Employer** fields
5. This happens even when **Employer information is not being changed**

---

## Expected Behavior

* **Employer fields should not be mandatory** when editing Employment
* User should be able to:

  * Edit Employment fields freely
  * Save changes **without filling Employer data**

---

## Notes

> The ticket description provides sufficient information to begin testing.

---

--------------------------------------------------------------------------------------------------------------------------------------------------------

## UOWN | Servicing | Remover Obrigatoriedade dos Campos de Employer ao Editar Employment

### Status

Aberto
Tíquete criado há 23 horas por Yuri Araujo

---

## Sinopse

Atualmente, ao acessar uma **Conta** no módulo **Servicing** e tentar editar qualquer informação na seção **Employment**, o sistema força o preenchimento de campos obrigatórios da subseção **Employer**.

Esse comportamento ocorre mesmo quando **os dados de Employer não estão sendo alterados**, gerando fricção desnecessária e bloqueando edições simples.

---

## Objetivo de Negócio

Permitir que usuários editem informações de **Employment** sem serem obrigados a preencher ou atualizar campos de **Employer**, melhorando a usabilidade e a flexibilidade do módulo de Servicing.

---

## Solicitação de Funcionalidade | Requisitos de Negócio

* Remover a validação de campos obrigatórios de **Employer** durante o fluxo de edição de **Employment**
* Manter o comportamento atual **apenas quando houver uma regra de negócio claramente definida**

  * Caso a validação seja necessária, ela deve ser **clara, intencional e bem justificada**

---

## Passos para Reproduzir

1. Usuário acessa uma **Conta** no módulo **Servicing**
2. Usuário navega até a seção **Employment** (lado inferior esquerdo da tela)
3. Usuário tenta editar qualquer campo de **Employment**
4. O sistema exige o preenchimento obrigatório dos campos de **Employer**
5. Isso ocorre mesmo quando as informações de **Employer não estão sendo alteradas**

---

## Comportamento Esperado

* Os campos de **Employer não devem ser obrigatórios** ao editar Employment
* O usuário deve conseguir:

  * Editar livremente os campos de Employment
  * Salvar as alterações **sem preencher dados de Employer**

---


--------------------------------------------------------------------------------------------------------------------------------------------------------
Alterações dev:


 1 arquivo
+
8
−
8
 libs/common-ui/src/lib/layouts/collapsable-edit/employment/index.tsx 
+
8
−
8

Visualizado
@@ -77,14 +77,14 @@ export const EmploymentPanel = (props: EmploymentPanelProps) => {
      nextPayDate: Yup.string().required('Next pay date is required.'),
      annualIncome: Yup.number().required('Gross pay is required.'),
      payFrequency: Yup.string().required('Pay frequency is required.'),
      employer: Yup.string().required('Employer is required.'),
      jobTitle: Yup.string().required('Job title is required.'),
      address: Yup.string().required('Employer Address is required.'),
      city: Yup.string().required('Employer City is required.'),
      state: Yup.string().required('Employer State is required.'),
      zipCode: Yup.string().required('Employer Zip Code is required.'),
      phoneNumber: Yup.string().required('Phone number is required.'),
      hireDate: Yup.string().required('Hire date is required.'),
      employer: Yup.string(),
      jobTitle: Yup.string(),
      address: Yup.string(),
      city: Yup.string(),
      state: Yup.string(),
      zipCode: Yup.string(),
      phoneNumber: Yup.string(),
      hireDate: Yup.string(),
    }),
    onSubmit: async (values) => {
      const {

--------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in qa1

### Feature: Edit Employment without mandatory Employer fields

---

```gherkin
  Scenario: Edit Employment without validating Employer fields
    When an Employment field is updated
    And no Employer field is modified
    Then the system allows saving the changes
    And no validation is displayed for Employer fields
```
![Screenshot_at_Jan_08_10-21-06](/uploads/6a0fc167ae68fb010d82a95c761a12e6/Screenshot_at_Jan_08_10-21-06.png){width=346 height=600}

![Screenshot_at_Jan_08_10-33-53](/uploads/1237c9fb530c4c709aeccb8ddf2eb743/Screenshot_at_Jan_08_10-33-53.png){width=900 height=446}

![Screenshot_at_Jan_08_10-36-33](/uploads/d7f8e8d1c8d0f4128e9c4d0d2e1efac6/Screenshot_at_Jan_08_10-36-33.png){width=900 height=465}

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

```gherkin
  Scenario Outline: Employer fields are not mandatory when editing Employment
    Given the Employer field <employer_field> is empty
    When an Employment field is updated
    And the save action is performed
    Then the save is completed successfully
    And no validation message is displayed for the field <employer_field>

    Examples:
      | employer_field       |
      | Employer             |
      | Position             |
      | Employer Address     |
      | City                 |
      | State                |
      | Zip Code             |
      | Employer Contact     |
      | Date of Employment   |
```

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

```gherkin
Scenario Outline: Partially fill Employer fields and save Employment
    Given the Employer fields <filled_fields> are filled
    And the Employer fields <empty_fields> remain empty
    When an Employment field is updated
    And the save action is performed
    Then the save is completed successfully
    And no validation is displayed for the unfilled Employer fields

    Examples:
      | filled_fields                   | empty_fields                                                            |
      | Employer                        | Position, Employer Address                                              |
      | Employer, Employer Contact      | City, State, Zip Code, Date of Employment, Position, Employer Address   |
```
![Screenshot_at_Jan_08_10-43-10](/uploads/66c8d17cdd17efb72e044111db31a76b/Screenshot_at_Jan_08_10-43-10.png){width=900 height=464}

![Screenshot_at_Jan_08_10-46-06](/uploads/05298a7a2e741dfbbbd8449ebcf82298/Screenshot_at_Jan_08_10-46-06.png){width=900 height=406}

**| PASS |**

**| LeadPk: 10500 |**

**| AccountPk: 4316 |**

---

--------------------------------------------------------------------------------------------------------------------------------------------------------
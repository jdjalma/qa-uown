---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                            
https://gitlab.com/uown/backend/svc/-/issues/407



UOWN | SVC | Update ACH Payment Date to Reflect Creation Date



Synopsis
As a system user, I want the ACH payment date to reflect the day the payment was created so that records accurately represent when the transaction was initiated, not when it was sent to Profituity.



Business Objective
Currently, the ACH payment date is recorded as the day the payment is sent to Profituity. The requirement is to update this behavior so that the ACH payment date instead reflects the creation date of the payment.



Feature Request | Business Requirements
    Update ACH payment logic so the payment date = creation date, not the Profituity submission date.
    Ensure this behavior applies consistently across all ACH payment flows.
    Confirm that no duplicate or conflicting dates are stored.
    Add tests to confirm payment date reflects creation timestamp in all scenarios.



Test instructions
the /ach-history page on servicing portal should display three new columns instead of "Date" these columns being "Created date", "Sent date" and "Posting date".

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Atualizar a Data de Pagamento ACH para Refletir a Data de Criação
Sinopse



Como usuário do sistema, quero que a data de pagamento ACH reflita o dia em que o pagamento foi criado, para que os registros representem com precisão o momento em que a transação foi iniciada — e não quando foi enviada para o Profituity.



Objetivo de Negócio
Atualmente, a data de pagamento ACH é registrada como o dia em que o pagamento é enviado ao Profituity.
A solicitação é atualizar esse comportamento para que a data de pagamento ACH passe a refletir a data de criação do pagamento.



Requisitos da Funcionalidade / Requisitos de Negócio
Atualizar a lógica de pagamento ACH para que a data de pagamento = data de criação, e não a data de envio ao Profituity.
Garantir que esse comportamento seja aplicado de forma consistente em todos os fluxos de pagamento ACH.
Confirmar que nenhuma data duplicada ou conflitante seja armazenada.
Adicionar testes automatizados para validar que a data de pagamento reflete o timestamp de criação em todos os cenários.



Instruções de Teste
Na página /ach-history do portal de servicing, devem ser exibidas três novas colunas no lugar da coluna atual "Date":
Created Date
Sent Date
Posting Date
Essas colunas devem refletir com precisão os respectivos momentos do ciclo de vida de cada pagamento ACH.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

 1 arquivo
+
11
−
0
 utils/data-table-columns.tsx 
+
11
−
0

Visualizado
@@ -282,6 +282,17 @@ export const achHistoryTableColumns = (
  return [
    {
      name: 'Date',
      key: 'rowCreatedTimestamp',
      selector: (row) => (
        <div>
          {formatDate({f: 'user', d: row.rowCreatedTimestamp ?? ''})}
        </div>
      ),
      width: '150px',
      sortable: true,
    },
    {
      name: 'Posting Date',
      key: 'postingDate',
      selector: (row) => (
        <div>

---


 1 arquivo
+
24
−
2
 utils/data-table-columns.tsx 
+
24
−
2

Visualizado
@@ -281,11 +281,33 @@ export const achHistoryTableColumns = (
) => {
  return [
    {
      name: 'Date',
      name: 'Created date',
      key: 'rowCreatedTimestamp',
      selector: (row) => (
        <div>
          {formatDate({f: 'user', d: row.rowCreatedTimestamp || ''})}
        </div>
      ),
      width: '150px',
      sortable: true,
    },
    {
      name: 'Sent date',
      key: 'sentTimestamp',
      selector: (row) => (
        <div>
          {formatDate({f: 'user', d: row.achPayment?.sentTimestamp || ''})}
        </div>
      ),
      width: '150px',
      sortable: true,
    },
    {
      name: 'Posting date',
      key: 'postingDate',
      selector: (row) => (
        <div>
          {formatDate({f: 'user', d: row?.achPayment?.postingDate || ''})}
          {formatDate({f: 'user', d: row.achPayment?.postingDate || ''})}
        </div>
      ),
      width: '150px',

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


1. Ao criar um pagamento ACH, o usuário deve visualizar a data de pagamento refletindo a data de criação e não a data de envio ao Profituity.
When creating an ACH payment, the user must see the payment date reflecting the creation date and not the date sent to Profituity.

2. Ao acessar a página /ach-history do portal de servicing, o usuário deve visualizar três colunas: "Created Date" exibindo a data de criação, "Sent Date" exibindo a data de envio ao Profituity e "Posting Date" exibindo a data de postagem do pagamento
When accessing the /ach-history page in the servicing portal, the user must see three columns: "Created Date" displaying the creation date, "Sent Date" displaying the date sent to Profituity, and "Posting Date" displaying the payment posting date.

5. Ao classificar a página /ach-history, o usuário deve conseguir ordenar os pagamentos pelas colunas "Created Date", "Sent Date" e "Posting Date".
When sorting the /ach-history page, the user must be able to sort payments by the "Created Date", "Sent Date", and "Posting Date" columns.

6. Ao visualizar um pagamento ACH sem data de envio na página /ach-history, a coluna "Sent Date" deve exibir vazia.
When viewing an ACH payment without a sent date on the /ach-history page, the "Sent Date" column must display as empty.

8. Ao consultar históricos de pagamentos ACH em diferentes fluxos, o usuário deve visualizar consistentemente a data de pagamento refletindo a data de criação.
When reviewing ACH payment histories across different flows, the user must consistently see the payment date reflecting the creation date.

---




-----

> ## Tests in qa2

> ```gherkin

> **When creating an ACH payment, the user must see the payment date reflecting the creation date and not the date sent to Profituity**

> ![Screenshot_at_Oct_27_01-57-50](/uploads/001e91c9e842caf820763f36416299a7/Screenshot_at_Oct_27_01-57-50.png)
> ![Screenshot_at_Oct_27_01-58-20](/uploads/fca588b9e6a319b84ebb0eaa7507b578/Screenshot_at_Oct_27_01-58-20.png)
> ![Screenshot_at_Oct_27_01-58-37](/uploads/dafc297dc272a61b86c457cb5f4f9f94/Screenshot_at_Oct_27_01-58-37.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When accessing the /ach-history page in the servicing portal, the user must see three columns: "Created Date" displaying the creation date, "Sent Date" displaying the date sent to Profituity, and "Posting Date" displaying the payment posting date**

> ![Screenshot_at_Oct_27_02-39-25](/uploads/4fb9c690cb1db1f46c59c7806dd48764/Screenshot_at_Oct_27_02-39-25.png)
> ![Screenshot_at_Oct_27_02-42-24](/uploads/19fca32de56951e689a5c094242113b9/Screenshot_at_Oct_27_02-42-24.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When sorting the /ach-history page, the user must be able to sort payments by the "Created Date", "Sent Date", and "Posting Date" columns**

> ![image](/uploads/2a50ea59bbe1bef6799501bbaa06debc/image.png)
> ![image](/uploads/8d71b43af335e500665d7aff7fd474d8/image.png)
> ![image](/uploads/6d4ea95d779d8c7a095ceb10a8876144/image.png)
> ![image](/uploads/1f420efd934732ea356366b4eee158dc/image.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing an ACH payment without a sent date on the /ach-history page, the "Sent Date" column must display as empty**

> ![Screenshot_at_Oct_27_02-39-25](/uploads/0016bd1d057f4c0a75e16d2828f62c28/Screenshot_at_Oct_27_02-39-25.png)
> ![Screenshot_at_Oct_27_02-42-24](/uploads/526450122323d1af45ba91eff2f9a730/Screenshot_at_Oct_27_02-42-24.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When reviewing ACH payment histories across different flows, the user must consistently see the payment date reflecting the creation date.**

> ![image](/uploads/eaeee87380caf226958202a7ced3b26d/image.png)
> ![Screenshot_at_Oct_27_06-29-48](/uploads/24ce78d448081c529093bf20fc77884c/Screenshot_at_Oct_27_06-29-48.png)
> ![image](/uploads/8879ad1dbe199d2dc278153a5e9c90e7/image.png)
> ![image](/uploads/dc57dcd8ba6c70a91def14ff7872ef7b/image.png)

> **| ERROR |** @marcos.pacheco.silva The payment date displayed in the customer portal is reflecting the “Posting Date” instead of the creation date
> ```

---
> ## Tests in qa2

> ```gherkin

> **When creating an ACH payment, the user must see the payment date reflecting the creation date and not the date sent to Profituity**

> ![Screenshot_at_Oct_27_01-57-50](/uploads/001e91c9e842caf820763f36416299a7/Screenshot_at_Oct_27_01-57-50.png)
> ![Screenshot_at_Oct_27_01-58-20](/uploads/fca588b9e6a319b84ebb0eaa7507b578/Screenshot_at_Oct_27_01-58-20.png)
> ![Screenshot_at_Oct_27_01-58-37](/uploads/dafc297dc272a61b86c457cb5f4f9f94/Screenshot_at_Oct_27_01-58-37.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When accessing the /ach-history page in the servicing portal, the user must see three columns: "Created Date" displaying the creation date, "Sent Date" displaying the date sent to Profituity, and "Posting Date" displaying the payment posting date**

> ![Screenshot_at_Oct_27_02-39-25](/uploads/4fb9c690cb1db1f46c59c7806dd48764/Screenshot_at_Oct_27_02-39-25.png)
> ![Screenshot_at_Oct_27_02-42-24](/uploads/19fca32de56951e689a5c094242113b9/Screenshot_at_Oct_27_02-42-24.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When sorting the /ach-history page, the user must be able to sort payments by the "Created Date", "Sent Date", and "Posting Date" columns**

> ![image](/uploads/2a50ea59bbe1bef6799501bbaa06debc/image.png)
> ![image](/uploads/8d71b43af335e500665d7aff7fd474d8/image.png)
> ![image](/uploads/6d4ea95d779d8c7a095ceb10a8876144/image.png)
> ![image](/uploads/1f420efd934732ea356366b4eee158dc/image.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When viewing an ACH payment without a sent date on the /ach-history page, the "Sent Date" column must display as empty**

> ![Screenshot_at_Oct_27_02-39-25](/uploads/0016bd1d057f4c0a75e16d2828f62c28/Screenshot_at_Oct_27_02-39-25.png)
> ![Screenshot_at_Oct_27_02-42-24](/uploads/526450122323d1af45ba91eff2f9a730/Screenshot_at_Oct_27_02-42-24.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When reviewing ACH payment histories across different flows, the user must consistently see the payment date reflecting the creation date.**

> ![image](/uploads/eaeee87380caf226958202a7ced3b26d/image.png)
> ![Screenshot_at_Oct_27_06-29-48](/uploads/24ce78d448081c529093bf20fc77884c/Screenshot_at_Oct_27_06-29-48.png)
> ![image](/uploads/8879ad1dbe199d2dc278153a5e9c90e7/image.png)
> ![image](/uploads/dc57dcd8ba6c70a91def14ff7872ef7b/image.png)

> **| ERROR |** @marcos.pacheco.silva The payment date displayed in the customer portal is reflecting the “Posting Date” instead of the creation date
> ```

---


---



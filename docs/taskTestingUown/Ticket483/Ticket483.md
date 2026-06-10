----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/483


UOWN | Servicing | Add a New Column "Original Due Date" in ACH History Page


Synopsis
On the Servicing Portal → ACH History page, a new column needs to be added to display the Original Due Date for each ACH transaction.
This information is already available from the backend through the attribute nameOriginalAchPostingDate.
The new column should appear next to the existing date columns for consistency and ease of reference.


Business Objective
Displaying the Original Due Date directly in the ACH History table will improve visibility into payment scheduling, reconciliation, and transaction tracking, providing users with a clearer understanding of each payment’s timeline.


Feature Request | Business Requirements
Add a new column, “Original Due Date” to the ACH History page on Servicing next to the existing date columns.
BackEnd returns this value -attribute nameoriginalAchPostingDate.


Testing Steps
Verify the ACH history in Servicing:
![alt text](image.png)

Confirm the new column (“Original Due Date”) is displayed:
![alt text](image-1.png)

Query accounts with the new value populated:
SELECT account_pk 
FROM uown_sv_achpayment 
WHERE ach_process_type IN ('RERUN', 'RERUN_NSF');

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Aqui está o texto **em português**, mantendo toda a estrutura original e deixando o conteúdo claro e profissional.

---

# **UOWN | Servicing | Adicionar Nova Coluna "Original Due Date" na Página de ACH History**

## **Sinopse**

Na página **Servicing Portal → ACH History**, uma nova coluna precisa ser adicionada para exibir a **Original Due Date** de cada transação ACH.
Essa informação já é fornecida pelo backend através do atributo **nameOriginalAchPostingDate**.

A nova coluna deve aparecer **ao lado das colunas de data já existentes**, garantindo consistência visual e facilidade de consulta.

---

## **Objetivo de Negócio**

Exibir a **Original Due Date** diretamente na tabela de ACH History melhora a visibilidade sobre o agendamento de pagamentos, reconciliação e rastreamento de transações, oferecendo aos usuários uma compreensão mais clara da linha do tempo de cada pagamento.

---

## **Requisitos da Funcionalidade | Business Requirements**

* Adicionar uma nova coluna chamada **“Original Due Date”** na página **ACH History** no Servicing.
* Posicionar a coluna próxima às demais colunas de datas existentes.
* O backend já retorna esse valor no atributo **nameOriginalAchPostingDate**.
* A interface deve exibir o campo exatamente conforme retornado.

---

## **Passos de Teste**

1. Acessar a página **ACH History** no Servicing.
   ![alt text](image.png)

2. Confirmar que a nova coluna **“Original Due Date”** está sendo exibida.
   ![alt text](image-1.png)

3. Validar que há contas com o valor populado usando a consulta abaixo:

```sql
SELECT account_pk
FROM uown_sv_achpayment
WHERE ach_process_type IN ('RERUN', 'RERUN_NSF');
```


----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 2 arquivos
+
14
−
0
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

mod
‎els‎

ach-pay
‎ment.ts‎
+3 -0

ut
‎ils‎

data-table-
‎columns.tsx‎
+11 -0

 models/ach-payment.ts 
+
3
−
0

Visualizado
@@ -125,6 +125,9 @@ export class AchPayment {
  postingDate?: string;
  @observable
  @persist
  originalAchPostingDate?: string;
  @observable
  @persist
  username?: string | null;
  @observable
  @persist
 utils/data-table-columns.tsx 
+
11
−
0

Visualizado
@@ -318,6 +318,17 @@ export const achHistoryTableColumns = (
      width: '150px',
      sortable: true,
    },
    {
      name: 'Original Due Date',
      key: 'originalAchPostingDate',
      selector: (row) => (
        <div>
          {formatDate({f: 'user', d: row.achPayment?.originalAchPostingDate || ''})}
        </div>
      ),
      width: '150px',
      sortable: true,
    },
    {
      name: 'Type',
      key: 'achProcessType',

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------      
1. Quando um usuário acessa a página ACH History no Servicing Portal, uma nova coluna intitulada "Original Due Date" deve estar visível na tabela, posicionada próxima às demais colunas de data (Posting Date), exibindo a data de vencimento original de cada transação ACH
1. When a user accesses the ACH History page in the Servicing Portal, a new column titled "Original Due Date" must be visible in the table, positioned next to the other date columns (Posting Date), displaying the original due date of each ACH transaction.

2. Quando um usuário visualiza um registro ACH sem o valor originalAchPostingDate populado no backend, a coluna "Original Due Date" deve exibir um valor em branco ou placeholder apropriado (sem erro), mantendo a consistência visual da tabela
2. When a user views an ACH record without the originalAchPostingDate value populated in the backend, the "Original Due Date" column must display a blank value or an appropriate placeholder (without error), maintaining the visual consistency of the table.

3. Quando um usuário visualiza múltiplos registros ACH na página ACH History, comparando Posting Date com Original Due Date, deve conseguir identificar visualmente quais pagamentos foram re-agendados (Original Due Date ≠ Posting Date) e quais foram processados na data original
3. When a user views multiple ACH records on the ACH History page and compares Posting Date with Original Due Date, they must be able to visually identify which payments were rescheduled (Original Due Date ≠ Posting Date) and which were processed on the original date.

-----

> ## Tests in qa1

> ```gherkin

> **When a user accesses the ACH History page in the Servicing Portal, a new column titled "Original Due Date" must be visible in the table, positioned next to the other date columns (Posting Date), displaying the original due date of each ACH transaction**

> ![image](/uploads/19847d0d342492c8196945a1d316d64b/image.png){width=900 height=221}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user views an ACH record without the originalAchPostingDate value populated in the backend, the "Original Due Date" column must display a blank value or an appropriate placeholder (without error), maintaining the visual consistency of the table**

> ![image](/uploads/0a3b404f793e2052d60cff2d43fe6019/image.png){width=900 height=355}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user views multiple ACH records on the ACH History page and compares Posting Date with Original Due Date, they must be able to visually identify which payments were rescheduled (Original Due Date ≠ Posting Date) and which were processed on the original date**

> ![Screenshot_at_Nov_14_13-40-04](/uploads/e4231e893ab756053a8d4f9e6baed6f2/Screenshot_at_Nov_14_13-40-04.png){width=900 height=211}

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG

> ## Tests in stg

> ```gherkin

> **When a user accesses the ACH History page in the Servicing Portal, a new column titled "Original Due Date" must be visible in the table, positioned next to the other date columns (Posting Date), displaying the original due date of each ACH transaction**

> ![Screenshot_at_Nov_16_04-04-55](/uploads/75e4b0c795abd986a9823e574c2e5d0c/Screenshot_at_Nov_16_04-04-55.png){width=900 height=381}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user views an ACH record without the originalAchPostingDate value populated in the backend, the "Original Due Date" column must display a blank value or an appropriate placeholder (without error), maintaining the visual consistency of the table**

> ![Screenshot_at_Nov_16_04-03-56](/uploads/f35b00f5473e165512fa805ff0500d4f/Screenshot_at_Nov_16_04-03-56.png){width=900 height=512}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user views multiple ACH records on the ACH History page and compares Posting Date with Original Due Date, they must be able to visually identify which payments were rescheduled (Original Due Date ≠ Posting Date) and which were processed on the original date**

> ![Screenshot_at_Nov_16_04-04-55](/uploads/1febeed0d37d85a04e446120ee538827/Screenshot_at_Nov_16_04-04-55.png){width=900 height=381}

> **| PASS |**
> ```

---



https://svc-website-qa1.uownleasing.com/ach-history/3740
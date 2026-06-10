-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇺🇸 UOWN | SVC | Include `receivableType` Column in DATA_CHANGE Logs

## **Test Steps**

### **1. Update a Receivable Record**
* Perform an update on any receivable (e.g., due date, amount, status, comment, skipped flag, etc.).

### **2. Verify DATA_CHANGE Log Entry**
* After the update, navigate to the **Servicing → Logs → Data Change** section.
* Locate the log entry corresponding to the receivable update.

### **Expected Result**
* The log entry must include the new column/field: **`receivableType`**.
* The value displayed should match the backend output for that receivable.
* All other existing log fields (dueDate, amount, status, comment, skipped, etc.) must continue appearing correctly.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 UOWN | SVC | Incluir coluna `receivableType` nos logs de DATA_CHANGE

## **Passos de Teste**

### **1. Atualizar um registro de Receivable**
* Realize a atualização de qualquer receivable (ex.: due date, amount, status, comment, skipped, etc.).

### **2. Verificar a Entrada no Log DATA_CHANGE**
* Após a atualização, acesse **Servicing → Logs → Data Change**.
* Localize o log correspondente à atualização realizada.

### **Resultado Esperado**
* A entrada de log deve exibir a nova coluna/campo **`receivableType`**.
* O valor exibido deve corresponder ao valor retornado pelo backend para aquele receivable.
* Todos os demais campos já existentes (dueDate, amount, status, comment, skipped etc.) devem continuar sendo exibidos corretamente.

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


 1 arquivo
+
2
−
1
 src/main/java/com/uownleasing/svc/common/service/SvReceivableService.java 
+
2
−
1

Visualizado
@@ -51,7 +51,8 @@ public class SvReceivableService {
                    receivableInfo.getAccountPk(),
                    LogType.DATA_CHANGE,
                    String.format(
                            "Receivable updated, dueDate: %s, amount: %.2f, status: %s, comment: %s, skipped: %b",
                            "Receivable updated, type: %s, dueDate: %s, amount: %.2f, status: %s, comment: %s, skipped: %b",
                            receivableInfo.getReceivableType(),
                            receivableInfo.getDueDate(),
                            receivableInfo.getTotalAmount(),
                            receivableInfo.getStatus(),

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# 📅 UOWN | SVC | Edit Scheduled Payments Modal
## Cenários de Teste - Linguagem Natural

---

1. Dado um agent visualizando uma parcela com data de vencimento original e valor de parcela, quando altera a data para uma data futura mais próxima do fluxo de caixa do cliente e adiciona justificativa no comentário, então log DATA_CHANGE registra a alteração incluindo receivableType, nova data, Scheduled Total, status ACTIVE, comentário, userId e timestamp
1. Given an agent viewing an installment with an original due date and installment amount, when they change the date to a future date closer to the customer’s cash flow and add justification in the comment, then the DATA_CHANGE log records the update including receivableType, new date, Scheduled Total, ACTIVE status, comment, userId, and timestamp

2. Dado um agent em uma parcela, quando marca "Skip Payment" e insere comentário, então status mantem como "ACTIVE", log DATA_CHANGE registra a alteração mostrando flag skipped true, data, Scheduled Total, status ACTIVE, userId e timestamp
2. Given an agent on an installment, when they check "Skip Payment" and enter a comment, then the status remains "ACTIVE", and the DATA_CHANGE log records the update showing the skipped flag as true, date, Scheduled Total, ACTIVE status, userId, and timestamp

3. Dado técnico visualizando uma parcela a pagar, ao realizar renuncia adicionando justificativa, log DATA_CHANGE registra a inativação incluindo receivableType, data, Scheduled Total, status INACTIVE, comentário, userId e timestamp
3. Given a technician viewing an installment to be paid, when performing a waiver and adding justification, the DATA_CHANGE log records the inactivation including receivableType, date, Scheduled Total, INACTIVE status, comment, userId, and timestamp

4. Dado uma parcela com valor base e sem imposto, quando técnico adiciona valor de imposto, então Total recalcula automaticamente, log DATA_CHANGE registra incluindo receivableType, data, valor base,Scheduled Total, status ACTIVE, userId e timestamp
4. Given an installment with base amount and no tax, when the technician adds a tax amount, then the Total recalculates automatically, and the DATA_CHANGE log records it including receivableType, date, base amount, Scheduled Total, ACTIVE status, userId, and timestamp

---

> **Given an agent viewing an installment with an original due date and installment amount, when they change the date to a future date closer to the customer’s cash flow and add justification in the comment, then the DATA_CHANGE log records the update including receivableType, new date, Scheduled Total, ACTIVE status, comment, userId, and timestamp**
>
> !
>
> **| PASS |**

---

> **Given an agent on an installment, when they check "Skip Payment" and enter a comment, then the status remains "ACTIVE", and the DATA_CHANGE log records the update showing the skipped flag as true, date, Scheduled Total, ACTIVE status, userId, and timestamp**
>
> !
>
> **| PASS |**

---

> **Given a technician viewing an installment to be paid, when performing a waiver and adding justification, the DATA_CHANGE log records the inactivation including receivableType, date, Scheduled Total, INACTIVE status, comment, userId, and timestamp**
>
> !
>
> **| PASS |**

---

> **Given an installment with base amount and no tax, when the technician adds a tax amount, then the Total recalculates automatically, and the DATA_CHANGE log records it including receivableType, date, base amount, Scheduled Total, ACTIVE status, userId, and timestamp**
>
> !
>
> **| PASS |**

---

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG


> ## Tests in stg

> **Given an agent viewing an installment with an original due date and installment amount, when they change the date to a future date closer to the customer’s cash flow and add justification in the comment, then the DATA_CHANGE log records the update including receivableType, new date, Scheduled Total, ACTIVE status, comment, userId, and timestamp**
>
> ![Screenshot_at_Nov_16_01-44-21](/uploads/e0b7f34d9d90df15f1701d20de848473/Screenshot_at_Nov_16_01-44-21.png){width=900 height=444}
> ![Screenshot_at_Nov_16_02-09-07](/uploads/26f9455fb2859e87b85c8b13330a337d/Screenshot_at_Nov_16_02-09-07.png){width=900 height=312}

>
> **| PASS |**

---

> **Given an agent on an installment, when they check "Skip Payment" and enter a comment, then the status remains "ACTIVE", and the DATA_CHANGE log records the update showing the skipped flag as true, date, Scheduled Total, ACTIVE status, userId, and timestamp**
>
> ![image](/uploads/9189f1068fa4c48385c9defa8e2e9666/image.png){width=900 height=81}

>
> **| PASS |**

---

> **Given a technician viewing an installment to be paid, when performing a waiver and adding justification, the DATA_CHANGE log records the inactivation including receivableType, date, Scheduled Total, INACTIVE status, comment, userId, and timestamp**
>
> ![Screenshot_at_Nov_16_02-00-49](/uploads/1534ed2f78f36a0334bda37a01df3a81/Screenshot_at_Nov_16_02-00-49.png){width=900 height=216}
> ![Screenshot_at_Nov_16_02-00-49](/uploads/0a5a36b838c0ed39310506116661013e/Screenshot_at_Nov_16_02-00-49.png){width=900 height=216}

>
> **| PASS |**

---

> **Given an installment with base amount and no tax, when the technician adds a tax amount, then the Total recalculates automatically, and the DATA_CHANGE log records it including receivableType, date, base amount, Scheduled Total, ACTIVE status, userId, and timestamp**
>
> ![Screenshot_at_Nov_16_01-55-36](/uploads/6344c1a81f893cd769f246ce75f5fa04/Screenshot_at_Nov_16_01-55-36.png){width=900 height=169}
> ![Screenshot_at_Nov_16_01-49-50](/uploads/0a7833df790089caea31df3e43f11038/Screenshot_at_Nov_16_01-49-50.png){width=900 height=357}
> ![Screenshot_at_Nov_16_02-03-28](/uploads/995d9a06fd3461ba11d959c50eb94f45/Screenshot_at_Nov_16_02-03-28.png){width=900 height=433}

>
> **| PASS |**

---

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


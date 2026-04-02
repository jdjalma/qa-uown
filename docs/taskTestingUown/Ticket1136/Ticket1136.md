---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇬🇧 UOWN | Origination | Investigate and fix incorrect logs generated on merchant edit.

**Status:** Open  
**Ticket created:** 1 week ago by *Yuri Araujo*

---

## **BUG**
It was observed that when performing certain modifications on a Merchant, a new log entry is generated showing a change in one of the flags (e.g., from false → null or null → false), even though the user did not actually modify that value.

This issue appears to be related to Plaid configurations. The log incorrectly indicates that a change occurred when, in reality, it was not altered by the user.

An image was provided showing the behavior in the modification log for reference.

---

## **FIX**
It may be useful to analyze whether some flags are being updated automatically in the database when editing legacy merchants, possibly due to schema or configuration updates applied after manual changes.

---

## **Screenshot(s)**
image

---

## **Steps-to-Reproduce**
List the steps required to verify the implemented feature.

---

## **Attachment(s)**
Zendesk ticket 6175

---

**Edited:** 5 days ago by *Yuri Araujo*  
**Assignee:** *Fernando Martins*  
**Labels:** BUG · production · priority: low · workflow: ready-for-qa  
**Milestone:** Uown | RU10.25.1.45.0  

---

### **Development**
[/uown/frontend/origination#1136] - Filter null to default value logs out  
svc  
!1150 — *Merged by Fernando Martins*  

---

### **Activity**
- Ticket created and updated by *Yuri Araujo*  
- Assigned to *Fernando Martins*  
- Referenced in merge request *uown/backend/svc!1150* (merged)  
- Commit references: *uown/backend/svc@810ee764*  
- Workflow moved through: development → code-review-pending → code-review-done  

---

### **Testing Steps**

Before the fix:
- When a boolean or numeric column was null for a merchant in the merchant table, as shown in the image:
  ![alt text](image.png)

- It was automatically updated to the default value of the attribute (e.g., null → false) and generated unnecessary logs:
  ![alt text](image-1.png)

**Now:**
1. Set a column value to null for a merchant:  
   ![alt text](image-2.png)
2. Make any valid change on the merchant edit page.
3. After saving:
   - The previously null column should now display its default value in the table.
   - **No log entry** should be created for this automatic default value assignment.
4. Finally, verify that normal updates (not involving null-to-default conversions) still work correctly and generate appropriate logs when expected.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 UOWN | Origination | Investigar e corrigir logs incorretos gerados na edição de comerciantes

**Status:** Aberto  
**Tíquete criado:** há 1 semana por *Yuri Araujo*

---

## **BUG**
Foi observado que, ao realizar determinadas modificações em um **Merchant (comerciante)**, uma nova entrada de log é gerada mostrando uma alteração em um dos *flags* (por exemplo: de *false → null* ou *null → false*), mesmo que o usuário **não tenha realmente modificado esse valor**.

Esse problema parece estar relacionado às **configurações do Plaid**. O log indica incorretamente que uma alteração ocorreu, quando na realidade o valor não foi modificado pelo usuário.

Uma imagem foi fornecida mostrando o comportamento no log de modificações para referência.

---

## **CORREÇÃO (FIX)**
Pode ser útil analisar se alguns *flags* estão sendo atualizados automaticamente no banco de dados ao editar comerciantes legados, possivelmente devido a **atualizações de schema** ou **alterações de configuração** aplicadas após mudanças manuais.

---

## **Captura(s) de Tela**
image

---

## **Passos para Reproduzir**
Liste as etapas necessárias para verificar a funcionalidade implementada.

---

## **Anexo(s)**
Ticket Zendesk 6175

---

**Editado:** há 5 dias por *Yuri Araujo*  
**Responsável:** *Fernando Martins*  
**Etiquetas:** BUG · produção · prioridade: baixa · fluxo: pronto para QA  
**Marco:** Uown | RU10.25.1.45.0  

---

### **Desenvolvimento**
[/uown/frontend/origination#1136] - Filtra logs de valor nulo para valor padrão  
svc  
!1150 — *Mesclado por Fernando Martins*  

---

### **Atividade**
- Ticket criado e atualizado por *Yuri Araujo*  
- Atribuído a *Fernando Martins*  
- Referenciado no *merge request* *uown/backend/svc!1150* (mesclado)  
- Referência de commit: *uown/backend/svc@810ee764*  
- Fluxo de trabalho passou por: desenvolvimento → revisão de código pendente → revisão de código concluída  

---

### **Passos de Teste**

Antes da correção:
- Quando uma coluna booleana ou numérica estava nula na tabela de comerciantes, conforme mostrado na imagem:
  ![alt text](image.png)

- Ela era automaticamente atualizada para o valor padrão do atributo (ex: *null → false*) e gerava logs desnecessários:
  ![alt text](image-1.png)

**Agora:**
1. Defina o valor de uma coluna como *null* para um comerciante:  
   ![alt text](image-2.png)
2. Faça qualquer alteração válida na página de edição do comerciante.
3. Após salvar:
   - A coluna anteriormente nula deve agora exibir o valor padrão na tabela.
   - **Nenhum log** deve ser criado para essa atribuição automática de valor padrão.
4. Por fim, verifique se as atualizações normais (que não envolvem conversões *null → padrão*) continuam funcionando corretamente e gerando logs adequados quando esperado.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


 1 arquivo
+
6
−
0
 src/main/java/com/uownleasing/svc/service/MerchantLogService.java 
+
6
−
0

Visualizado
@@ -176,6 +176,12 @@ public class MerchantLogService {
            for (Change change : changes) {
                if (change instanceof ValueChange) {
                    ValueChange valChange = (ValueChange) change;
                    if (valChange.getLeft() == null && (Boolean.FALSE.equals(valChange.getRight()) ||
                        (valChange.getRight() instanceof Number number && number.doubleValue() == 0.0))) {
                        continue;
                    }

                    if(valChange.getLeft()!=null && isNumeric(valChange.getLeft().toString()) && (valChange.getRight()!=null && isNumeric(valChange.getRight().toString()))){
                        if(!new BigDecimal (valChange.getLeft().toString()).setScale(4, RoundingMode.HALF_UP).equals(new BigDecimal(valChange.getRight().toString()).setScale (4, RoundingMode.HALF_UP))) {
                            content = content.concat(delim).concat(valChange.getPropertyName() + " changed from " + valChange.getLeft() + " to " + valChange.getRight());

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------                            
Quando um comerciante é editado e uma coluna booleana com valor null é automaticamente atualizada para false, nenhum log deve ser gerado para essa alteração - ok
When a merchant is edited and a boolean column with a null value is automatically updated to false, no log should be generated for this change

Quando um comerciante é editado e uma coluna numérica com valor null é automaticamente atualizada para 0, nenhum log deve ser gerado para essa alteração - ok
When a merchant is edited and a numeric column with a null value is automatically updated to 0, no log should be generated for this change

Quando um comerciante é editado e um valor é realmente modificado pelo usuário, um log deve ser gerado normalmente documentando a alteração - ok
When a merchant is edited and a value is actually modified by the user, a log should be generated normally documenting the change

Quando um comerciante é editado e uma coluna booleana exibe false na tabela após salvar, a coluna deve estar com seu valor padrão refletido corretamente - ok
When a merchant is edited and a boolean column shows false in the table after saving, the column must have its default value correctly reflected

Quando um comerciante é editado e uma coluna numérica com valor padrão 0 é salva, a coluna deve exibir "0" na tabela e não um campo vazio
    ERROR --> Ao salvar um comerciante com uma coluna numérica que possui valor padrão 0, a coluna exibe um campo vazio na tabela em vez de exibir "0"
When a merchant is edited and a numeric column with a default value of 0 is saved, the column must display "0" in the table and not an empty field
    ERROR --> When saving a merchant with a numeric column that has a default value of 0, the column displays an empty field in the table instead of showing "0"

Quando um comerciante legado é editado, os flags relacionados às configurações do Plaid não devem gerar logs desnecessários de conversão null para valor padrão - ok
When a legacy merchant is edited, the flags related to Plaid configurations must not generate unnecessary logs for null-to-default value conversions

Quando um comerciante legado tem os checkboxes de configurações atualizados através do Merchant Settings, o sistema não deve gerar logs com valores vazios ou null como valor anterior - ok
When a legacy merchant has configuration checkboxes updated through Merchant Settings, the system must not generate logs with empty or null values as the previous value

 Quando um comerciante legado tem o campo fundingReportFrequency atualizado de null para DAILY ou o campo fundingReportEmails atualizado de null para um email válido,, o log não deve exibir "changed from  to DAILY" mas sim ser filtrado ou formatado corretamente   - ERROR 
    ERROR --> AO remover a frequencia e email dos campos e salvar é registrado
    UPDATED: MERCHANT[fundingReportFrequency changed from DAILY to ,
    fundingReportEmails changed from Justin.Batten@UownLeasing.com to ]
When a legacy merchant has the fundingReportFrequency field updated from null to DAILY or the fundingReportEmails field updated from null to a valid email, the log must not display "changed from to DAILY" but instead be properly filtered or formatted.  - ERROR 

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa2

> ```gherkin

> **When a merchant is edited and a boolean column with a null value is automatically updated to false, no log should be generated for this change.**

> **| PASS |**
> ```

---

> ```gherkin

> **When a merchant is edited and a numeric column with a null value is automatically updated to 0, no log should be generated for this change.**

> ![Screenshot_at_Oct_27_00-10-21](/uploads/8cd191808045a75aaa52edc93cc57a96/Screenshot_at_Oct_27_00-10-21.png)
> ![Screenshot_at_Oct_27_00-10-53](/uploads/ba790dff5a01243cefe844a8e2bd01bb/Screenshot_at_Oct_27_00-10-53.png)
> ![Screenshot_at_Oct_27_00-11-55](/uploads/99b526b799d421dbbf63c9bc0eae2a40/Screenshot_at_Oct_27_00-11-55.png)
> ![Screenshot_at_Oct_27_00-18-00](/uploads/c31b96c5dfd69f91277ca7488ad5aa64/Screenshot_at_Oct_27_00-18-00.png)
> ![Screenshot_at_Oct_27_00-18-25](/uploads/e5cd9f8e1ca42de70f103918e14dc4d6/Screenshot_at_Oct_27_00-18-25.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a merchant is edited and a value is actually modified by the user, a log should be generated normally documenting the change.**

> ![Screenshot_at_Oct_27_00-04-00](/uploads/6bf8d5b60f34662d1f172778df987dca/Screenshot_at_Oct_27_00-04-00.png)
> ![Screenshot_at_Oct_27_00-04-01](/uploads/cb7b84d0bd8a451da0aab149b3b44fbe/Screenshot_at_Oct_27_00-04-01.png)
> ![Screenshot_at_Oct_27_00-04-02](/uploads/06316287fa4729601bfc4250847dadd9/Screenshot_at_Oct_27_00-04-02.png)
> ![Screenshot_at_Oct_27_00-04-03](/uploads/0d44ecbbcdf5795dd755b0e1e93b4ed2/Screenshot_at_Oct_27_00-04-03.png)
> ![Screenshot_at_Oct_27_00-04-04](/uploads/52df457ff414c94b7db9da31cabd22d0/Screenshot_at_Oct_27_00-04-04.png)
> ![Screenshot_at_Oct_27_00-04-24](/uploads/a7ac6a1d61828ddc1bf301d2f52126ea/Screenshot_at_Oct_27_00-04-24.png)
> ![Screenshot_at_Oct_27_00-08-29](/uploads/5f15fa573a8af212047a58c08d6f2a7e/Screenshot_at_Oct_27_00-08-29.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a merchant is edited and a boolean column shows false in the table after saving, the column must have its default value correctly reflected.**

> ![Screenshot_at_Oct_27_00-27-16](/uploads/c1cdcda76ba586a3664e916c89c52fe0/Screenshot_at_Oct_27_00-27-16.png)
> ![Screenshot_at_Oct_27_00-27-48](/uploads/c8293b0d42983277e70597efe34867e5/Screenshot_at_Oct_27_00-27-48.png)
> ![Screenshot_at_Oct_27_00-28-36](/uploads/fe5c9007b65c38c063fcd2dacef08892/Screenshot_at_Oct_27_00-28-36.png)
> ![Screenshot_at_Oct_27_00-28-48](/uploads/1c08556b0765754021a2855673854324/Screenshot_at_Oct_27_00-28-48.png)

> ![Screenshot_at_Oct_27_00-58-01](/uploads/4b2f2b365d410079c68e596ac73b2534/Screenshot_at_Oct_27_00-58-01.png)
> ![Screenshot_at_Oct_27_00-58-22](/uploads/bdecdf64e8e9f38054cc10254d7b2d3f/Screenshot_at_Oct_27_00-58-22.png)
> ![Screenshot_at_Oct_27_00-58-50](/uploads/374cc716dc38a157e0b37f37c24d37d2/Screenshot_at_Oct_27_00-58-50.png)
> ![Screenshot_at_Oct_27_00-58-51](/uploads/b60c8ce28882ec0c7b0d27118e5298da/Screenshot_at_Oct_27_00-58-51.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a legacy merchant is edited, the flags related to Plaid configurations must not generate unnecessary logs for null-to-default value conversions**

> ![Screenshot_at_Oct_27_00-58-01](/uploads/1c594c66c40da98559cea2d1578d8af9/Screenshot_at_Oct_27_00-58-01.png)
> ![Screenshot_at_Oct_27_00-58-22](/uploads/dfc7e4443b2c538fb55c64fab88236d5/Screenshot_at_Oct_27_00-58-22.png)
> ![Screenshot_at_Oct_27_00-58-50](/uploads/64f29f9d103f08ab60cecf5521434347/Screenshot_at_Oct_27_00-58-50.png)
> ![Screenshot_at_Oct_27_00-58-51](/uploads/0928c9753e465407d3da370d15188c8b/Screenshot_at_Oct_27_00-58-51.png)
> ![Screenshot_at_Oct_27_01-00-33](/uploads/fd43e8b60b82088a7f2a8691ee39a3a9/Screenshot_at_Oct_27_01-00-33.png)
> ![Screenshot_at_Oct_27_01-00-45](/uploads/cf54f11474c5c072e300fd47e65542fa/Screenshot_at_Oct_27_01-00-45.png)
> ![Screenshot_at_Oct_27_01-00-46](/uploads/36b708933c2b847afd1ca0c98e38b03e/Screenshot_at_Oct_27_01-00-46.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a legacy merchant has configuration checkboxes updated through Merchant Settings, the system must not generate logs with empty or null values as the previous value**

> ![Screenshot_at_Oct_27_08-05-37](/uploads/635b5e5bdc5e85edbf19a715924832c2/Screenshot_at_Oct_27_08-05-37.png)
> ![Screenshot_at_Oct_27_08-05-56](/uploads/65ae7680e24ae13b72d2fad18d8b018f/Screenshot_at_Oct_27_08-05-56.png)
> ![Screenshot_at_Oct_27_08-06-34](/uploads/39a36c0e97664316a7d45d69729c2bd1/Screenshot_at_Oct_27_08-06-34.png)
> ![Screenshot_at_Oct_27_08-06-54](/uploads/bac7b5b10e8929f1335ffd6420517ab4/Screenshot_at_Oct_27_08-06-54.png)

> **| PASS |**
> ```

---

> ```gherkin

> **When a legacy merchant has the fundingReportFrequency field updated from null to DAILY or the fundingReportEmails field updated from null to a valid email, the log must not display "changed from to DAILY" but instead be properly filtered or formatted.**

> ![Screenshot_at_Oct_27_01-22-10](/uploads/3cbe2d6e4e2d9c718789a03ae30d3fc9/Screenshot_at_Oct_27_01-22-10.png)
> ![Screenshot_at_Oct_27_01-22-22](/uploads/70e4f96ddcf2cf4edc474f4e69493746/Screenshot_at_Oct_27_01-22-22.png)
> ![Screenshot_at_Oct_27_01-22-51](/uploads/a449412e5934e4b752f077bd7f27647a/Screenshot_at_Oct_27_01-22-51.png)
> ![Screenshot_at_Oct_27_01-26-14](/uploads/1e8ec5d5b95eabf07dd342af6322f2fd/Screenshot_at_Oct_27_01-26-14.png)

> **| ERROR |** @fernandogmartins When updating the fundingReportFrequency field of a legacy merchant from null to DAILY through Merchant Settings, the log still displays the message incorrectly formatted as "changed from to DAILY" (with an empty space before "to").
> ```

---

> ```gherkin

> **When a merchant is edited and a numeric column with a default value of 0 is saved, the column must display "0" in the table and not an empty field**

> ![Screenshot_at_Oct_27_00-10-21](/uploads/e197f8a24c1c7532f6ae81a167702cd6/Screenshot_at_Oct_27_00-10-21.png)
> ![Screenshot_at_Oct_27_00-10-53](/uploads/91443a4c325703baa35af2dc4b0ea7bc/Screenshot_at_Oct_27_00-10-53.png)
> ![Screenshot_at_Oct_27_00-11-55](/uploads/6fdefd937bb475d7aea81764442791ef/Screenshot_at_Oct_27_00-11-55.png)
> ![Screenshot_at_Oct_27_00-17-39](/uploads/917ca485b1c97dfc7a7af9f04533044d/Screenshot_at_Oct_27_00-17-39.png)

> **| ERROR |** @fernandogmartins When saving a merchant with a numeric column that has a default value of 0, the column displays an empty field in the table instead of showing "0"
> ```

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
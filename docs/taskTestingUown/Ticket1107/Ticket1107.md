----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1107



# 🇺🇸 **UOWN | Origination | Validation Issues on CC/ACH Screen – Routing Number and Name Field**

## 🐛 **BUG**

When proceeding through the application flow on the CC/ACH screen, the following issues were observed:

---

### **Name field (First Name)**

* When a user enters a compound name (with spaces or middle name), the system shows an error message indicating that only letters are allowed.
* Despite the error, the system still allows the user to proceed, which is inconsistent behavior.

---

### **Routing Number field**

* The Routing Number should require exactly **9 digits**.
* Currently, the system allows the user to proceed with only **8 digits**, bypassing the validation.

---

## 🔧 **FIX**

### **Name field validation**

* Adjust validation to correctly handle compound names (allow spaces when appropriate) **OR** update the error message to accurately reflect the restriction.
* Ensure that if validation fails, the user **cannot proceed** until the input is corrected.

---

### **Routing Number validation**

* Enforce strict validation requiring exactly **9 digits** for the Routing Number field.
* If the user enters fewer than 9 digits, block progression and display a clear error message indicating the requirement.

---

## 🧪 **Test Steps**

### **Name field validation**

* Adjust validation to correctly handle compound names (allow spaces when appropriate) **OR** update the error message.
* Ensure that if validation fails, the user **cannot proceed**.

---

### **Routing Number validation**

* Enforce strict validation requiring exactly **9 digits**.
* If fewer than 9 digits are entered, block progression and show a clear error message.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# 🇧🇷 **UOWN | Origination | Problemas de Validação na Tela de CC/ACH – Routing Number e Campo de Nome**

## 🐛 **BUG**

Ao avançar no fluxo de aplicação na tela de CC/ACH, foram observados os seguintes problemas:

---

### **Campo Name (First Name)**

* Quando um usuário insere um nome composto (com espaços ou middle name), o sistema exibe uma mensagem de erro indicando que apenas letras são permitidas.
* Apesar do erro, o sistema ainda permite que o usuário prossiga, o que é um comportamento inconsistente.

---

### **Campo Routing Number**

* O Routing Number deveria exigir exatamente **9 dígitos**.
* Atualmente, o sistema permite que o usuário prossiga com apenas **8 dígitos**, ignorando a validação.

---

## 🔧 **FIX**

### **Validação do campo Name**

* Ajustar a validação para lidar corretamente com nomes compostos (permitindo espaços quando apropriado) **OU** atualizar a mensagem de erro para refletir corretamente a restrição.
* Garantir que, se a validação falhar, o usuário **não consiga avançar** até corrigir o campo.

---

### **Validação do Routing Number**

* Aplicar validação estrita exigindo exatamente **9 dígitos** no Routing Number.
* Se o usuário inserir menos de 9 dígitos, impedir avanço e exibir mensagem clara indicando o requisito.

---

## 🧪 **Test Steps**

### **Validação do campo Name**

* Ajustar validação para lidar com nomes compostos (permitindo espaços quando apropriado) **OU** atualizar a mensagem de erro.
* Garantir que, se a validação falhar, o usuário **não possa prosseguir**.

---

### **Validação do Routing Number**

* Exigir exatamente **9 dígitos** no campo Routing Number.
* Se menos de 9 dígitos forem inseridos, bloquear avanço e exibir mensagem clara.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


 1 arquivo
+
11
−
2
 components/missing-data-panel/index.tsx 
+
11
−
2

Visualizado
@@ -129,7 +129,6 @@ const MissingDataPanel = (props: MissingDataPanelProps) => {

  filteredMissingFields.forEach((missingField) => {
    const fieldName = missingField || '';

    if (fieldName === 'bankAccountInfo') {
      achFields.forEach((newField) => {
        initialValues[newField] = '';
@@ -142,10 +141,20 @@ const MissingDataPanel = (props: MissingDataPanelProps) => {
            : 'This field must only contain numbers.';

        const isNumberType = fieldType === 'number';
        const yupType = isNumberType
        let yupType = isNumberType
          ? Yup.string().matches(/^\d+$/, fieldTypeError)
          : Yup.string().matches(/^[a-zA-Z]+$/, fieldTypeError);

        if (
          newField === 'bankAccountCustomerFirstName' ||
          newField === 'bankAccountCustomerLastName'
        ) {
          yupType = Yup.string().matches(
            /^[A-Za-z]+(?: [A-Za-z]+)*$/,
            fieldTypeError,
          );
        }

        const isAccountNum = newField?.toLowerCase()?.includes('accountnumber');

        const minNum = isAccountNum ? 5 : 9;

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------        
# Test Scenarios - UOWN | Origination | Validation Issues on CC/ACH Screen

## Overview
This covers validation issues on the CC/ACH screen for the Name field (First Name/Last Name) and Routing Number field.

---

1. Quando um usuário preenche o campo First Name com um nome composto contendo um espaço (ex: "Jean Pierre") na tela CC/ACH, o campo deve aceitar o valor como válido, a mensagem de erro "only letters are allowed" não deve aparecer, e o usuário deve conseguir prosseguir normalmente
1. When a user fills the First Name field with a compound name containing a space (e.g., "Jean Pierre") on the CC/ACH screen, the field must accept the value as valid, the error message "only letters are allowed" must not appear, and the user must be able to proceed normally.

2. Quando um usuário digita um nome começando com uma letra maiúscula no campo First Name (ex: "Michael") ou minúscula (ex: "michael") na tela CC/ACH, ambos os casos devem ser aceitos como válidos, permitindo flexibilidade de entrada
2. When a user types a name starting with an uppercase letter in the First Name field (e.g., "Michael") or lowercase (e.g., "michael") on the CC/ACH screen, both cases must be accepted as valid, allowing input flexibility.

3. Quando um usuário tenta inserir caracteres numéricos ou especiais no campo First Name (ex: "John123" ou "John@") na tela CC/ACH, o campo deve rejeitar esses caracteres e exibir mensagem de erro apropriada: "This field must only contain letters" ou similar
3. When a user attempts to enter numeric or special characters in the First Name field (e.g., "John123" or "John@") on the CC/ACH screen, the field must reject these characters and display an appropriate error message: "This field must only contain letters" or similar.

4. Quando um usuário digita um valor inválido no campo First Name (ex: "John123"), vê a mensagem de erro, depois limpa o campo e digita um valor válido (ex: "John"), a mensagem de erro deve desaparecer, o campo deve retornar ao estado normal
4. When a user types an invalid value in the First Name field (e.g., "John123"), sees the error message, then clears the field and types a valid value (e.g., "John"), the error message must disappear, and the field must return to normal state.

5. Quando um usuário preenche o campo Last Name na tela CC/ACH, o comportamento de validação deve ser idêntico ao First Name: aceitar nomes simples e compostos com espaços, rejeitar números e caracteres especiais, e impedir progressão se inválido
5. When a user fills the Last Name field on the CC/ACH screen, the validation behavior must be identical to the First Name field: accept simple and compound names with spaces, reject numbers and special characters, and prevent progression if invalid.

6. Quando um usuário tenta preencher o campo First Name ou Last Name apenas com espaços em branco (ex: "   ") na tela CC/ACH, o sistema deve tratar o campo removendo os espaços e exibindo as letras
6. When a user attempts to fill the First Name or Last Name field with only blank spaces (e.g., " ") on the CC/ACH screen, the system must treat the field by removing the spaces and displaying the letters.

7. Quando um usuário copia e cola um nome válido (ex: "Maria Silva") no campo First Name ou Last Name na tela CC/ACH, o valor deve ser aceito e validado corretamente, aplicando as mesmas regras de validação que entrada manual
ok
7. When a user copies and pastes a valid name (e.g., "Maria Silva") into the First Name or Last Name field on the CC/ACH screen, the value must be accepted and correctly validated, applying the same validation rules as manual input.
OK

8. Quando um usuário preenche o campo Routing Number com apenas 8 dígitos (ex: "02100002") na tela CC/ACH, o campo deve exibir mensagem de erro clara indicando "Routing Number must be exactly 9 digits", o campo deve ser marcado como erro
8. When a user fills the Routing Number field with only 8 digits (e.g., "02100002") on the CC/ACH screen, the field must display a clear error message indicating "Routing Number must be exactly 9 digits", and the field must be marked as an error.

9. Quando um usuário tenta preencher o campo Routing Number com 10 dígitos (ex: "0210000210") na tela CC/ACH, o campo deve rejeitar o dígito extra (não aparecendo no campo), mantendo apenas 9 dígitos formatados
ok
9. When a user attempts to fill the Routing Number field with 10 digits (e.g., "0210000210") on the CC/ACH screen, the field must reject the extra digit (it must not appear in the field), keeping only 9 properly formatted digits.
ok

10. Quando um usuário tenta digitar letras ou caracteres especiais no campo Routing Number (ex: "ABS123456" ou "021-00-0021") na tela CC/ACH, apenas dígitos devem ser aceitos, caracteres inválidos devem ser rejeitados silenciosamente, e a máscara de formatação deve ser aplicada apenas para números
ok
10. When a user attempts to type letters or special characters in the Routing Number field (e.g., "ABS123456" or "021-00-0021") on the CC/ACH screen, only digits must be accepted, invalid characters must be silently rejected, and the formatting mask must be applied only to numbers.
ok

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

QA1
> ## Tests in qa1

> ```gherkin

> **When a user fills the First Name field with a compound name containing a space (e.g., "Jean Pierre") on the CC/ACH screen, the field must accept the value as valid, the error message "only letters are allowed" must not appear, and the user must be able to proceed normally**

> ![Screenshot_at_Nov_16_03-05-20](/uploads/40a5fd464d21f88f40e6081e38b44abb/Screenshot_at_Nov_16_03-05-20.png){width=755 height=102}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types a name starting with an uppercase letter in the First Name field (e.g., "Michael") or lowercase (e.g., "michael") on the CC/ACH screen, both cases must be accepted as valid, allowing input flexibility**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to enter numeric or special characters in the First Name field (e.g., "John123" or "John@") on the CC/ACH screen, the field must reject these characters and display an appropriate error message: "This field must only contain letters" or similar**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types an invalid value in the First Name field (e.g., "John123"), sees the error message, then clears the field and types a valid value (e.g., "John"), the error message must disappear, and the field must return to normal state**

> ![Screenshot_at_Nov_16_03-06-35](/uploads/22f30d1e664455d41a9668b8f80cbe65/Screenshot_at_Nov_16_03-06-35.png){width=785 height=122}
> ![Screenshot_at_Nov_16_03-06-46](/uploads/d54528b341a14a34ccfbb43a2c166f83/Screenshot_at_Nov_16_03-06-46.png){width=772 height=102}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user fills the Last Name field on the CC/ACH screen, the validation behavior must be identical to the First Name field: accept simple and compound names with spaces, reject numbers and special characters, and prevent progression if invalid**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to fill the First Name or Last Name field with only blank spaces (e.g., " ") on the CC/ACH screen, the system must treat the field by removing the spaces and displaying the letters**

> ![Screenshot_at_Nov_16_02-42-50](/uploads/c0af684187ff7a62ec3b21589f62a8e3/Screenshot_at_Nov_16_02-42-50.png){width=900 height=573}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user copies and pastes a valid name (e.g., "Maria Silva") into the First Name or Last Name field on the CC/ACH screen, the value must be accepted and correctly validated, applying the same validation rules as manual input**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user fills the Routing Number field with only 8 digits (e.g., "02100002") on the CC/ACH screen, the field must display a clear error message indicating "Routing Number must be exactly 9 digits", and the field must be marked as an error**

> ![Screenshot_at_Nov_16_03-07-52](/uploads/da6c2951394c46b9478dd3dd98979ba3/Screenshot_at_Nov_16_03-07-52.png){width=380 height=101}

> **| PASS |**
> ```

---


> ```gherkin

> **When a user attempts to fill the Routing Number field with 10 digits (e.g., "0210000210") on the CC/ACH screen, the field must reject the extra digit (it must not appear in the field), keeping only 9 properly formatted digits**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to type letters or special characters in the Routing Number field (e.g., "ABS123456" or "021-00-0021") on the CC/ACH screen, only digits must be accepted, invalid characters must be silently rejected, and the formatting mask must be applied only to numbers**

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG

> ## Tests in stg

> ```gherkin

> **When a user fills the First Name field with a compound name containing a space (e.g., "Jean Pierre") on the CC/ACH screen, the field must accept the value as valid, the error message "only letters are allowed" must not appear, and the user must be able to proceed normally**

> ![image](/uploads/00efe6e8ce48e3ef3bdb82487628f4b1/image.png){width=758 height=99}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types a name starting with an uppercase letter in the First Name field (e.g., "Michael") or lowercase (e.g., "michael") on the CC/ACH screen, both cases must be accepted as valid, allowing input flexibility**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to enter numeric or special characters in the First Name field (e.g., "John123" or "John@") on the CC/ACH screen, the field must reject these characters and display an appropriate error message: "This field must only contain letters" or similar**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user types an invalid value in the First Name field (e.g., "John123"), sees the error message, then clears the field and types a valid value (e.g., "John"), the error message must disappear, and the field must return to normal state**

> ![Screenshot_at_Nov_16_03-22-31](/uploads/38a9e584fc9bd7777534734727a2fd69/Screenshot_at_Nov_16_03-22-31.png){width=766 height=119}
> ![Screenshot_at_Nov_16_03-22-58](/uploads/e35bf2a1d127a072f3226a0f46a82f9c/Screenshot_at_Nov_16_03-22-58.png){width=761 height=98}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user fills the Last Name field on the CC/ACH screen, the validation behavior must be identical to the First Name field: accept simple and compound names with spaces, reject numbers and special characters, and prevent progression if invalid**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to fill the First Name or Last Name field with only blank spaces (e.g., " ") on the CC/ACH screen, the system must treat the field by removing the spaces and displaying the letters**

> ![image](/uploads/4522bc22634df3a254a141417dcc50af/image.png){width=229 height=79}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user copies and pastes a valid name (e.g., "Maria Silva") into the First Name or Last Name field on the CC/ACH screen, the value must be accepted and correctly validated, applying the same validation rules as manual input**

> **| PASS |**
> ```

---

> ```gherkin

> **When a user fills the Routing Number field with only 8 digits (e.g., "02100002") on the CC/ACH screen, the field must display a clear error message indicating "Routing Number must be exactly 9 digits", and the field must be marked as an error**

> ![Screenshot_at_Nov_16_03-24-19](/uploads/f91343dc0945a8469c49cdd95dd742b3/Screenshot_at_Nov_16_03-24-19.png){width=378 height=106}

> **| PASS |**
> ```

---


> ```gherkin

> **When a user attempts to fill the Routing Number field with 10 digits (e.g., "0210000210") on the CC/ACH screen, the field must reject the extra digit (it must not appear in the field), keeping only 9 properly formatted digits**

> ![Screenshot_at_Nov_16_03-24-49](/uploads/a3b3b806079be83d0103d45bfa8753b4/Screenshot_at_Nov_16_03-24-49.png){width=381 height=83}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to type letters or special characters in the Routing Number field (e.g., "ABS123456" or "021-00-0021") on the CC/ACH screen, only digits must be accepted, invalid characters must be silently rejected, and the formatting mask must be applied only to numbers**

> **| PASS |**
> ```

---

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
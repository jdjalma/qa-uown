----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1152


UOWN | Origination | Allow Negative Values in Approval Amount Increase Field on Merchant Page


Synopsis
As a system user, I want to be able to enter negative values in the Approval Amount Increase field on the Merchant page so that I can decrease approval amounts when needed.
In the Origination Portal, within the Merchant page, users can edit various configuration fields, including Approval Amount Increase.
Currently, this field only accepts positive values, which limits flexibility in adjusting approval amounts.
The requirement is to update this field to allow negative percentage values (e.g., -10%), enabling users to both increase and decrease the approval amount as necessary.



Business Objective
Allowing negative percentages provides more control over merchant configuration, particularly for cases where the approval threshold needs to be reduced instead of increased.
This enhancement improves operational flexibility and accuracy in managing approval adjustments across merchants.



Feature Request | Business Requirements
Update the Approval Amount Increase field on the Merchant page to accept both positive and negative numeric values (e.g., -10, +10).
Ensure the field continues to support percentage formatting where applicable.
Validate input to prevent invalid characters or formats (e.g., letters, symbols other than “-” or “%”).
Confirm that negative values are correctly stored, displayed, and applied in the backend logic.
Test all scenarios where the Approval Amount Increase value affects merchant approval calculations to ensure consistent behavior.


![alt text](image.png)

TEST STEPS
Check the screenshot attached on the description, check if the input is working following the new requirements.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Origination | Permitir Valores Negativos no Campo de Aumento do Valor de Aprovação na Página do Comerciante

Sinopse
Como usuário do sistema, quero ser capaz de inserir valores negativos no campo de Aumento do Valor de Aprovação na página do Comerciante, para que eu possa diminuir os valores de aprovação quando necessário.
No Portal de Originação, dentro da página do Comerciante, os usuários podem editar vários campos de configuração, incluindo o Aumento do Valor de Aprovação. Atualmente, este campo só aceita valores positivos, o que limita a flexibilidade ao ajustar os valores de aprovação. O requisito é atualizar este campo para permitir valores de porcentagem negativos (por exemplo, -10%), permitindo que os usuários aumentem ou diminuam o valor de aprovação conforme necessário.

Objetivo de Negócio
Permitir porcentagens negativas oferece mais controle sobre a configuração dos comerciantes, especialmente em casos onde o limite de aprovação precisa ser reduzido, em vez de aumentado.
Essa melhoria proporciona maior flexibilidade operacional e precisão ao gerenciar ajustes de aprovação entre os comerciantes.

Requisitos do Pedido de Funcionalidade | Requisitos de Negócio
Atualizar o campo de Aumento do Valor de Aprovação na página do Comerciante para aceitar valores numéricos positivos e negativos (por exemplo, -10, +10).
Garantir que o campo continue a suportar a formatação de porcentagem quando aplicável.
Validar a entrada para evitar caracteres ou formatos inválidos (por exemplo, letras, símbolos diferentes de “-” ou “%”).
Confirmar que os valores negativos sejam corretamente armazenados, exibidos e aplicados na lógica de backend.
Testar todos os cenários onde o valor do Aumento do Valor de Aprovação afeta os cálculos de aprovação do comerciante para garantir comportamento consistente.

Passos para Teste
Verifique a captura de tela anexada na descrição e verifique se a entrada está funcionando conforme os novos requisitos.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:


 3 arquivos
+
6
−
5
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

components/merc
‎hant-info-panels‎

merchant-inf
‎ormation.tsx‎
+1 -0

packag
‎e.json‎
+1 -1

yarn
‎.lock‎
+4 -4

 components/merchant-info-panels/merchant-information.tsx 
+
1
−
0

Visualizado
@@ -175,6 +175,7 @@ const MerchantInformationPanel = (props: MerchantInformationPanelProps) => {
            rightIcon={faPercentage}
            rightIconClassName="cursor-none"
            type="decimal"
            allowNegativeNumbers
          />
        </Col>
      </Row>
 package.json 
+
1
−
1

Visualizado
@@ -30,7 +30,7 @@
    "@seontechnologies/seon-id-verification": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "5.14.0",
    "@typescript-eslint/parser": "5.14.0",
    "@uownleasing/common-ui": "0.0.386",
    "@uownleasing/common-ui": "0.0.387",
    "@uownleasing/common-utilities": "0.0.52",
    "@uownleasing/mobx-persist-session": "0.0.1",
    "@uownleasing/server-utilities": "0.0.23",
 yarn.lock 
+
4
−
4

Visualizado
@@ -1660,10 +1660,10 @@
    "@typescript-eslint/types" "5.14.0"
    eslint-visitor-keys "^3.0.0"

"@uownleasing/common-ui@0.0.386":
  version "0.0.386"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.386.tgz#dcb54e49a48aae8b21b973dba97fb922bebf597e"
  integrity sha512-1iNDc6cSlaKVgYp77MXVSIMd6/QBvod8rXfaTc9XtAz7ocX6EGDnhO5C61rvrjz90rVjyxjNStMXWYIQyJzEkQ==
"@uownleasing/common-ui@0.0.387":
  version "0.0.387"
  resolved "https://nexus.uownleasing.com/repository/npm-hosted/@uownleasing/common-ui/-/common-ui-0.0.387.tgz#fc3d642d734a5a79c86970c3e641e5b33115655c"
  integrity sha512-4YnvVok9Pglu2MQhvl15ELhPGMd9ilsgT1NbBBoqPaCezPBj0GpwO71d3LX5FXMVjOLDuBJSzHlnkmYTdY1L8w==
  dependencies:
    "@fortawesome/fontawesome-svg-core" "6.1.1"
    "@fortawesome/free-solid-svg-icons" "6.1.1"

---


 3 arquivos
+
11
−
3
Arquivos
3
Pesquisar (por exemplo, *.vue) (F)

libs/co
‎mmon-ui‎

src
‎/lib‎

formik
‎-input‎

inde
‎x.tsx‎
+9 -2

inp
‎uts‎

inde
‎x.tsx‎
+1 -0

packag
‎e.json‎
+1 -1

 libs/common-ui/src/lib/formik-input/index.tsx 
+
9
−
2

Visualizado
@@ -312,6 +312,8 @@ export const formatPhoneNumber = (
  let formattedValue = unformattedValue;
  let isKeyDelete = false;

  if (!isNumeric(clearValue)) return '';

  if (e) {
    const eventType: InputEventInit = e?.nativeEvent;
    const eventTypeName = eventType?.inputType || '';
@@ -414,6 +416,7 @@ export interface FormikInputProps
  checkboxSelectButtonClick?: any;
  checkboxSelectButtonDisabled?: boolean;
  isCalendarPositionFixed?: boolean;
  allowNegativeNumbers?: boolean;
}

export const FormikInput = (props: FormikInputProps) => {
@@ -469,6 +472,7 @@ export const FormikInput = (props: FormikInputProps) => {
    checkboxSelectButtonClick,
    checkboxSelectButtonDisabled,
    isCalendarPositionFixed,
    allowNegativeNumbers = false,
    ...inputProps
  } = props;

@@ -1229,8 +1233,11 @@ export const FormikInput = (props: FormikInputProps) => {
              }

              if (isDecimal) {
                if (isNumeric(e?.target?.value)) {
                  if (hasMaxTwoDecimalPlaces(e?.target?.value)) {
                const negativeNumersRegex = /^-?\d*(\.\d*)?$/;
                const value = e?.target?.value;
                const isValid = allowNegativeNumbers ?  negativeNumersRegex.test(value) : isNumeric(value);
                if (isValid) {
                  if (hasMaxTwoDecimalPlaces(value)) {
                    formik?.handleChange(e);
                  }
                  return;
 libs/common-ui/src/lib/inputs/index.tsx 
+
1
−
0

Visualizado
@@ -108,6 +108,7 @@ export interface InputFieldProps
  checkboxSelectButtonClick?: any;
  checkboxSelectButtonDisabled?: boolean;
  isCalendarPositionFixed?: boolean;
  allowNegativeNumbers?: boolean;
}

export const InputField = (props: InputFieldProps) => {
 libs/common-ui/package.json 
+
1
−
1

Visualizado
{
  "name": "@uownleasing/common-ui",
  "version": "0.0.386",
  "version": "0.0.387",
  "dependencies": {
    "axios": "0.27.2",
    "date-fns": "2.28.0",

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1. Quando um usuário acessa o campo "Approval Amount Increase" na página Merchant no Origination Portal, o campo deve aceitar valores numéricos positivos e negativos (ex: -10, +10, 10) com suporte a formatação de percentagem, permitindo aumentos e diminuições de valores de aprovação conforme necessário
1. When a user accesses the “Approval Amount Increase” field on the Merchant page in the Origination Portal, the field must accept both positive and negative numeric values (e.g., -10, +10, 10) with percentage formatting support, allowing increases and decreases to approval amounts as needed.

2. Quando um usuário digita um valor negativo (ex: -15) no campo "Approval Amount Increase" na página Merchant, o sistema deve validar a entrada aceitando apenas números e o símbolo "-" , rejeitando letras e símbolos inválidos.
2. When a user enters a negative value (e.g., -15) in the “Approval Amount Increase” field on the Merchant page, the system must validate the input by accepting only numbers and the "-" symbol, rejecting letters and invalid characters.

3. Quando um usuário insere um valor negativo no campo "Approval Amount Increase" da página Merchant e salva as alterações, o valor deve ser corretamente armazenado no banco de dados, exibido na interface e aplicado corretamente na lógica de backend dos cálculos de aprovação do comerciante, garantindo comportamento consistente em todos os cenários
3. When a user enters a negative value in the “Approval Amount Increase” field on the Merchant page and saves the changes, the value must be correctly stored in the database, displayed in the interface, and properly applied in the backend logic for merchant approval calculations, ensuring consistent behavior in all scenarios.

4. Quando um usuário tenta inserir valores com múltiplos sinais negativos (ex: --10), valores com espaços (ex: "- 10"), ou combinações inválidas (ex: 10-5) no campo "Approval Amount Increase" da página Merchant, o sistema deve rejeitar a entrada e manter apenas o último valor válido armazenado
4. When a user attempts to enter values with multiple negative signs (e.g., --10), values with spaces (e.g., "- 10"), or invalid combinations (e.g., 10-5) in the “Approval Amount Increase” field on the Merchant page, the system must reject the input and retain only the last valid value.


> ## Tests in qa1


> ```gherkin

> **When a user accesses the “Approval Amount Increase” field on the Merchant page in the Origination Portal, the field must accept both positive and negative numeric values (e.g., -10, 0, 1) with percentage formatting support, allowing increases and decreases to approval amounts as needed**

> ![Screenshot_at_Nov_13_17-39-29](/uploads/1deadd5e08be15014ed2080640d88f44/Screenshot_at_Nov_13_17-39-29.png){width=194 height=102}
> ![Screenshot_at_Nov_13_17-40-48](/uploads/68caaef19b58c9848cc8a64699aad001/Screenshot_at_Nov_13_17-40-48.png){width=804 height=600}
> ![Screenshot_at_Nov_13_17-42-28](/uploads/d7861a1861828c500bd57b3fd9fb94fc/Screenshot_at_Nov_13_17-42-28.png){width=838 height=55}
> ![Screenshot_at_Nov_13_17-42-58](/uploads/dc10a49b8eeaffa6194a0f154f251d6b/Screenshot_at_Nov_13_17-42-58.png){width=900 height=80}
> ![Screenshot_at_Nov_13_17-45-01](/uploads/3328929e0fa96c9ddd9cf2f8e32b21cc/Screenshot_at_Nov_13_17-45-01.png){width=180 height=99}
> ![Screenshot_at_Nov_13_17-45-14](/uploads/557ee24696fd6624c5a5b76bb040de03/Screenshot_at_Nov_13_17-45-14.png){width=843 height=63}
> ![Screenshot_at_Nov_13_17-45-37](/uploads/49f699ac2183ad71ce0b6b1267a92f77/Screenshot_at_Nov_13_17-45-37.png){width=900 height=54}
> ![Screenshot_at_Nov_13_17-55-38](/uploads/e1e024152eab41e3cc1c48f76c60057a/Screenshot_at_Nov_13_17-55-38.png){width=261 height=79}
> ![Screenshot_at_Nov_13_17-55-56](/uploads/97dd3386c2bbf0f37a22e4017acc5cc5/Screenshot_at_Nov_13_17-55-56.png){width=900 height=54}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user enters a negative value (e.g., -15) in the “Approval Amount Increase” field on the Merchant page, the system must validate the input by accepting only numbers and the "-" symbol, rejecting letters and invalid characters**

> ![Screenshot_at_Nov_13_23-12-48](/uploads/bab702f1bfb4bf4347bb8c8341392114/Screenshot_at_Nov_13_23-12-48.png){width=173 height=101}
> ![Screenshot_at_Nov_13_23-13-27](/uploads/cd19d51499bbb6fc08f989a9f2c2bf11/Screenshot_at_Nov_13_23-13-27.png){width=900 height=446}
> ![Screenshot_at_Nov_13_23-14-00](/uploads/e00dc6bd10b820d4439e482eaf69b103/Screenshot_at_Nov_13_23-14-00.png){width=900 height=446}
> ![Screenshot_at_Nov_13_23-14-33](/uploads/6acfbeaeb4eb42978743b79798892985/Screenshot_at_Nov_13_23-14-33.png){width=850 height=60}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user enters a negative value in the “Approval Amount Increase” field on the Merchant page and saves the changes, the value must be correctly stored in the database, displayed in the interface, and properly applied in the backend logic for merchant approval calculations, ensuring consistent behavior in all scenarios**

> ![Screenshot_at_Nov_13_22-20-15](/uploads/81b5088d98fb0efa75e0d644764fe37b/Screenshot_at_Nov_13_22-20-15.png){width=173 height=100}
> ![Screenshot_at_Nov_13_22-22-34](/uploads/bc2cf4db448ecfc2330f96b1b6583f1e/Screenshot_at_Nov_13_22-22-34.png){width=900 height=319}
> ![Screenshot_at_Nov_13_22-23-29](/uploads/ba7fb814603523f8aa4ca4d94b417d8b/Screenshot_at_Nov_13_22-23-29.png){width=804 height=55}
> ![Screenshot_at_Nov_13_22-23-51](/uploads/8eebc4a68d93a2c3d400654f2c312b27/Screenshot_at_Nov_13_22-23-51.png){width=900 height=447}
> ![Screenshot_at_Nov_13_22-24-11](/uploads/4b1b187b6c9c15d35a0c0439a8d88f86/Screenshot_at_Nov_13_22-24-11.png){width=174 height=96}
> ![Screenshot_at_Nov_13_22-24-39](/uploads/91f45e279679077c4e403f81ab98dbb3/Screenshot_at_Nov_13_22-24-39.png){width=900 height=449}
> ![Screenshot_at_Nov_13_22-25-15](/uploads/db76d73bd75d25c90120439877ab53c9/Screenshot_at_Nov_13_22-25-15.png){width=900 height=444}
> ![Screenshot_at_Nov_13_23-05-17](/uploads/541328abe6169b97ac4793d6cca44b13/Screenshot_at_Nov_13_23-05-17.png){width=187 height=106}
> ![Screenshot_at_Nov_13_23-06-51](/uploads/67a4abec992edda6998fd5736e6bd57f/Screenshot_at_Nov_13_23-06-51.png){width=900 height=59}
> ![Screenshot_at_Nov_13_23-07-00](/uploads/ad609a7da94146e14246fbce029be6a1/Screenshot_at_Nov_13_23-07-00.png){width=262 height=86}
> ![Screenshot_at_Nov_13_23-07-11](/uploads/670bf7234a92a9977f88b489fd990571/Screenshot_at_Nov_13_23-07-11.png){width=843 height=64}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user attempts to enter values with multiple negative signs (e.g., --10), values with spaces (e.g., "- 10"), or invalid combinations (e.g., 10-5) in the “Approval Amount Increase” field on the Merchant page, the system must reject the input and retain only the last valid value**

> **| PASS |**
> ```

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

STG

> ## Tests in stg


> ```gherkin

> **When a user accesses the “Approval Amount Increase” field on the Merchant page in the Origination Portal, the field must accept both positive and negative numeric values (e.g., -10, 0, 1) with percentage formatting support, allowing increases and decreases to approval amounts as needed**

> ![Screenshot_at_Nov_16_10-19-06](/uploads/09245cee1b6b6da9aa3caf5ff7430b94/Screenshot_at_Nov_16_10-19-06.png){width=683 height=204}
> ![Screenshot_at_Nov_16_10-19-55](/uploads/5b9b550bf8cbed844c6e07e3609e3e25/Screenshot_at_Nov_16_10-19-55.png){width=900 height=446}
> ![Screenshot_at_Nov_16_10-21-52](/uploads/4ee7185f48d8048e187c70677c7cd1e1/Screenshot_at_Nov_16_10-21-52.png){width=900 height=97}
> ![Screenshot_at_Nov_16_10-22-21](/uploads/99e45c1039eaf0dcc43faf7a434d6d46/Screenshot_at_Nov_16_10-22-21.png){width=683 height=204}
> ![Screenshot_at_Nov_16_10-22-22](/uploads/f94cf20bf226c1e7c0125863d8ad16bb/Screenshot_at_Nov_16_10-22-22.png){width=900 height=90}
> ![Screenshot_at_Nov_16_10-26-16](/uploads/6265956474dba9c728d546b2968f944e/Screenshot_at_Nov_16_10-26-16.png){width=900 height=64}
---
> ![Screenshot_at_Nov_16_11-01-32](/uploads/86229c2fe6384351be023eb1d216ebaf/Screenshot_at_Nov_16_11-01-32.png){width=900 height=447}
> ![Screenshot_at_Nov_16_11-02-02](/uploads/daf3c9935e8c71a2f19e2bdcda1db77a/Screenshot_at_Nov_16_11-02-02.png){width=900 height=103}
---
![Screenshot_at_Nov_16_11-02-46](/uploads/a6459914630c13daf215bd5514b31ef1/Screenshot_at_Nov_16_11-02-46.png){width=900 height=445}
> ![Screenshot_at_Nov_16_11-03-02](/uploads/db0f088fd60b194aa6faaac5e09ccb49/Screenshot_at_Nov_16_11-03-02.png){width=900 height=50}
> ![Screenshot_at_Nov_16_11-03-09](/uploads/b8e13e7868a55216851979271cb469ca/Screenshot_at_Nov_16_11-03-09.png){width=900 height=62}

> ![Screenshot_at_Nov_16_10-52-14](/uploads/e144890388f8e388b93328e81b377a68/Screenshot_at_Nov_16_10-52-14.png){width=650 height=203}
> ![Screenshot_at_Nov_16_10-53-01](/uploads/9101529e0365b4f869d6746f9bef2d41/Screenshot_at_Nov_16_10-53-01.png){width=900 height=445}
> ![Screenshot_at_Nov_16_10-53-25](/uploads/5627d7be773eb6110b3667378eb6984a/Screenshot_at_Nov_16_10-53-25.png){width=900 height=135}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user enters a negative value (e.g., -15) in the “Approval Amount Increase” field on the Merchant page, the system must validate the input by accepting only numbers and the "-" symbol, rejecting letters and invalid characters**

> ![Screenshot_at_Nov_16_10-30-00](/uploads/dcfac8b98e6e8de0d460fe7f92d976a5/Screenshot_at_Nov_16_10-30-00.png){width=900 height=449}
> ![Screenshot_at_Nov_16_10-48-52](/uploads/e3f789b72cbc1addbfa6e194b4d1247f/Screenshot_at_Nov_16_10-48-52.png){width=900 height=66}
> ![Screenshot_at_Nov_16_10-49-09](/uploads/d58a0f2e891f5d6c7f59fcafa2991f48/Screenshot_at_Nov_16_10-49-09.png){width=900 height=88}

> **| PASS |**
> ```

---

> ```gherkin

> **When a user enters a negative value in the “Approval Amount Increase” field on the Merchant page and saves the changes, the value must be correctly stored in the database, displayed in the interface, and properly applied in the backend logic for merchant approval calculations, ensuring consistent behavior in all scenarios**

> ![Screenshot_at_Nov_16_10-50-21](/uploads/bf28b080d330bdbe73bac82ae7d1676d/Screenshot_at_Nov_16_10-50-21.png){width=651 height=210}
> ![Screenshot_at_Nov_16_10-51-19](/uploads/6cb20578dfb1e0953db31cd428c3ac5c/Screenshot_at_Nov_16_10-51-19.png){width=900 height=446}
> ![Screenshot_at_Nov_16_10-51-33](/uploads/d8d7cd105bc54b864a7bdcf16a48a9cc/Screenshot_at_Nov_16_10-51-33.png){width=900 height=66}

> **| OK |**
> ```

---

> ```gherkin

> **When a user attempts to enter values with multiple negative signs (e.g., --10), values with spaces (e.g., "- 10"), or invalid combinations (e.g., 10-5) in the “Approval Amount Increase” field on the Merchant page, the system must reject the input and retain only the last valid value**

> **| PASS |**
> ```

---

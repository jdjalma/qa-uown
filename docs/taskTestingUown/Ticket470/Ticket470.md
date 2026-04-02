------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# UOWN | Servicing | Improve ActivityLogs formatting: multiline display, scroll, max size, and CamelCase

**Status:** Open  
**Ticket created:** 2 weeks ago by Yuri Araujo

## Synopsis

Currently, the structure of the logs in ActivityLogs is a flat, nested string that concatenates all properties of a class into a single line. This makes logs hard to read and analyze, especially when they contain a large number of properties or long values.

## Business Objective

Enhance log readability and user experience by formatting each log entry in a structured, readable format. This will improve visual inspection and debugging capabilities, especially for complex entities.

## Business Requirements / Feature Request

- **Line Breaks:**  
  Update the log formatting logic to break each property into a new line when logging class data (e.g., one line per property: value pair).
- **Scrollable Display with Max Height/Width:**  
  Apply visual constraints when displaying logs in UI tables.  
  Add a scrollable area for each log box to prevent layout breaking.  
  Set a maximum size (height/width) per log cell to ensure consistency in the table view.
- **CamelCase Property Values:**  
  Ensure that property values logged are formatted in CamelCase, with the first letter of each word capitalized where applicable.  
  For example, if the property is Address, and the value is home, it should be displayed as Home.
- **Compatibility:**  
  Changes should be non-breaking for the existing logging system and applied only to visual formatting and string structure generation.
- **Testing:**  
  Include tests to ensure:
  - Logs display one line per property.
  - Long logs are scrollable in the UI.
  - CamelCase is applied correctly to values.

-----

# UOWN | Servicing | Melhorar formatação dos ActivityLogs: múltiplas linhas, rolagem, tamanho máximo e CamelCase

**Status:** Aberto  
**Tíquete criado:** 2 semanas atrás por Yuri Araujo

## Sinopse

Atualmente, a estrutura dos logs em ActivityLogs é uma string aninhada e plana que concatena todas as propriedades de uma classe em uma única linha. 
Isso dificulta a leitura e análise dos logs, especialmente quando contêm muitas propriedades ou valores longos.

## Objetivo de Negócio

Melhorar a legibilidade dos logs e a experiência do usuário, formatando cada entrada de log de maneira estruturada e fácil de ler. 
Isso irá aprimorar a inspeção visual e as capacidades de depuração, especialmente para entidades complexas.

## Requisitos do Negócio / Solicitação de Feature

- **Quebra de Linha:**  
  Atualizar a lógica de formatação dos logs para quebrar cada propriedade em uma nova linha ao registrar dados de classes (ex: uma linha por par propriedade: valor).
- **Exibição Rolável com Tamanho Máximo:**  
  Aplicar restrições visuais ao exibir logs em tabelas da UI.  
  Adicionar uma área rolável para cada caixa de log, evitando quebra do layout.  
  Definir um tamanho máximo (altura/largura) por célula de log para garantir consistência na visualização.
- **Valores em CamelCase:**  
  Garantir que os valores das propriedades registrados estejam em CamelCase, com a primeira letra de cada palavra em maiúsculo quando aplicável.  
  Exemplo: se a propriedade for Address e o valor for home, deve ser exibido como Home.
- **Compatibilidade:**  
  As mudanças devem ser não disruptivas para o sistema de logs existente e aplicadas apenas à visualização e geração da estrutura das strings.
- **Testes:**  
  Incluir testes para garantir que:
  - Os logs exibem uma linha por propriedade.
  - Logs longos são roláveis na interface.
  - CamelCase é aplicado corretamente nos valores.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ao realizar pagamentos com cartão de crédito (CC), o log apresenta múltiplos atributos na mesma linha.
Ao cadastrar um novo CC, o log apresenta múltiplos atributos na mesma linha.
Quando há necessidade de rolagem (scroll), o fechamento do array (`]`) é colocado sozinho em uma linha; o ideal seria mantê-lo ao final da última linha de atributo.
Atualizar dados de contato de terceiros em Third Party Information
Alterar autopay, o log é exbibido uma linha por propriedade
Ao alterar dados de uma parcela não paga, os dados não estão concatenados por linha.

As outras ações analisadas que geram log estão conforme os requisitos de melhoria

Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status | Observation
| ------ | ------ | --------- | --------- | ------ |
| X      | X      | Ao realizar pagamentos com cartão de crédito (CC), o log apresenta múltiplos atributos na mesma linha. |           | ERROR   |
| X      | X      | Ao cadastrar um novo CC, o log apresenta múltiplos atributos na mesma linha. |           | ERROR   |
| X      | X      | Quando há necessidade de rolagem (scroll), o fechamento do array (`]`) é colocado sozinho em uma linha; o ideal seria mantê-lo ao final da última linha de atributo. |           | ERROR |
| X      | X      | Atualizar dados de contato de terceiros em Third Party Information |           | ERROR   |
| X      | X      | Alterar autopay, o log é exibido uma linha por propriedade |           | ERROR   |
| X      | X      | Ao alterar dados de uma parcela não paga, os dados não estão concatenados por linha. |           | ERROR |
| X      | X      | As outras ações analisadas que geram log estão conforme os requisitos de melhoria |           | PASS   |

-----

Tests in qa1

| Test Case | Test Data | Status |Observation |
| --------- | --------- | ------ | ------ |
| When making credit card (CC) payments, the log shows multiple attributes on the same line. |           | ERROR   | Backlog will be created |
| When registering a new CC, the log shows multiple attributes on the same line. |           | ERROR   | Backlog will be created |
| When scrolling is needed, the array closing (`]`) is placed alone on a line; ideally, it should remain at the end of the last attribute line. |           | PASS   |  |
| Updating third-party contact data in Third Party Information. |           | ERROR   | Backlog will be created |
| Changing autopay, the log is displayed one line per property. |           | ERROR   |  |
| When editing data of an unpaid installment, the data is not concatenated per line. |           | ERROR   |  |
| The other actions analyzed that generate logs are in accordance with the improvement requirements. |           | PASS   |  |

-----

Tests in qa1

| Test Case | Test Data | Status |Observation |
| --------- | --------- | ------ | ------ |
| When making credit card (CC) payments, the log shows multiple attributes on the same line. |  ![470-qa1-c1-_E1_](/uploads/44d51b60adec0e9cd1154dca7d7ad089/470-qa1-c1-_E1_.png){width=1158 height=40}         | ERROR   | Backlog will be created |
| When registering a new CC, the log shows multiple attributes on the same line. |      ![470-qa1-c2_E1_](/uploads/a2deb1ee8645755025e9304b20b68ee7/470-qa1-c2_E1_.png){width=1324 height=553}     | ERROR   | Backlog will be created |
| When scrolling is needed, the array closing (`]`) is placed alone on a line; ideally, it should remain at the end of the last attribute line. |     ![470-qa1-c3_E1_](/uploads/73a49bad37b5f5d241af9420a70d0ffe/470-qa1-c3_E1_.png){width=1438 height=740}      | -- |  |
| Updating third-party contact data in Third Party Information. |    ![470-qa1-c4_E1_](/uploads/b46454e9b4f1e0d80b58ea5e50b593fc/470-qa1-c4_E1_.png){width=1237 height=45}       | ERROR   | Backlog will be created |
| Changing autopay, the log is displayed one line per property. |     ![470-qa1-c5_E1_](/uploads/1efe8131bdc204d3b00adb37a2d2fd89/470-qa1-c5_E1_.png){width=851 height=40}      | ERROR   |  |
| When editing data of an unpaid installment, the data is not concatenated per line. |     ![470-qa1-c6_E1_](/uploads/7007a69a3ac51c5b391280978123235d/470-qa1-c6_E1_.png){width=1279 height=190}      | ERROR   |  |
| The other actions analyzed that generate logs are in accordance with the improvement requirements. | ![470-qa1-c7_E1___1_](/uploads/b57e0a47fc060a1cca4d3d73c36fd095/470-qa1-c7_E1___1_.png){width=882 height=54}![470-qa1-c7_E1___2_](/uploads/c764f0ce5c7a7af4e7f8e4b5575e9475/470-qa1-c7_E1___2_.png){width=882 height=54}![470-qa1-c7_E1___3_](/uploads/61f5348026450333e112868ba62748ee/470-qa1-c7_E1___3_.png){width=882 height=54}![470-qa1-c7_E1___4_](/uploads/81676610b2a7f0140eca5e488ef78009/470-qa1-c7_E1___4_.png){width=1308 height=402}![470-qa1-c7_E1___5_](/uploads/99bd9b41153d4208ceb6fda265a4fc02/470-qa1-c7_E1___5_.png){width=1277 height=610}![470-qa1-c7_E1___6_](/uploads/876a479b368b57f81a0622d55fee764d/470-qa1-c7_E1___6_.png){width=1436 height=741}![470-qa1-c7_E1___7_](/uploads/55180a9b052d4cd14bd7b4d5dfb79c3a/470-qa1-c7_E1___7_.png){width=1436 height=741}          | PASS   |  |

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| Test Case | Test Data | Status |Observation |
| --------- | --------- | ------ | ------ |
| When making credit card (CC) payments, the log shows multiple attributes on the same line. |  ![470-qa1-c1-_E1_](/uploads/44d51b60adec0e9cd1154dca7d7ad089/470-qa1-c1-_E1_.png){width=1158 height=40}         | ERROR   | Backlog will be created |
| When registering a new CC, the log shows multiple attributes on the same line. |      ![470-qa1-c2_E1_](/uploads/a2deb1ee8645755025e9304b20b68ee7/470-qa1-c2_E1_.png){width=1324 height=553}     | ERROR   | Backlog will be created |
| When scrolling is needed, the array closing (`]`) is placed alone on a line; ideally, it should remain at the end of the last attribute line. |     ![470-qa1-c3_E1_](/uploads/73a49bad37b5f5d241af9420a70d0ffe/470-qa1-c3_E1_.png){width=1438 height=740}      | -- |  |
| Updating third-party contact data in Third Party Information. |    ![470-qa1-c4_E1_](/uploads/b46454e9b4f1e0d80b58ea5e50b593fc/470-qa1-c4_E1_.png){width=1237 height=45}       | ERROR   | Backlog will be created |

| Changing autopay, the log is displayed one line per property. |           | PASS   |  |
| When editing data of an unpaid installment, the data is not concatenated per line. |          | PASS   | - |
| The other actions analyzed that generate logs are in accordance with the improvement requirements. | - | PASS | - |



Tests in qa1

| Test Case | Test Data | Status |Observation |
| --------- | --------- | ------ | ------ |
| When making credit card (CC) payments, the log shows multiple attributes on the same line. |  ![470-qa1-c1-_E1_](/uploads/44d51b60adec0e9cd1154dca7d7ad089/470-qa1-c1-_E1_.png){width=1158 height=40}         | ERROR   | Backlog will be created |
| When registering a new CC, the log shows multiple attributes on the same line. |      ![470-qa1-c2_E1_](/uploads/a2deb1ee8645755025e9304b20b68ee7/470-qa1-c2_E1_.png){width=1324 height=553}     | ERROR   | Backlog will be created |
| Updating third-party contact data in Third Party Information. |    ![470-qa1-c4_E1_](/uploads/b46454e9b4f1e0d80b58ea5e50b593fc/470-qa1-c4_E1_.png){width=1237 height=45}       | ERROR   | Backlog will be created |

-----

Tests in qa1

| Test Case | Test Data | Status |Observation |
| --------- | --------- | ------ | ------ |
| When scrolling is needed, the array closing (`]`) is placed alone on a line; ideally, it should remain at the end of the last attribute line. | ![image](/uploads/001bcb78d48339bde76b3aa5adf558bf/image.png) | PASS | -- |
| Changing autopay, the log is displayed one line per property. | ![470-qa1-autopay-_1_](/uploads/f6ca3966d4a584d8fd181bbb5775d65f/470-qa1-autopay-_1_.png){width=1278 height=182} | PASS   | -- |
| When editing data of an unpaid installment, the data is not concatenated per line. | ![image](/uploads/34a69854bf6fb926ff757969921a34f6/image.png) | PASS   | -- |
| The other actions analyzed that generate logs are in accordance with the improvement requirements. | ![470-qa1-c7_E1___1_](/uploads/b57e0a47fc060a1cca4d3d73c36fd095/470-qa1-c7_E1___1_.png){width=882 height=54}![470-qa1-c7_E1___2_](/uploads/c764f0ce5c7a7af4e7f8e4b5575e9475/470-qa1-c7_E1___2_.png){width=882 height=54}![470-qa1-c7_E1___3_](/uploads/61f5348026450333e112868ba62748ee/470-qa1-c7_E1___3_.png){width=882 height=54}![470-qa1-c7_E1___4_](/uploads/81676610b2a7f0140eca5e488ef78009/470-qa1-c7_E1___4_.png){width=1308 height=402}![470-qa1-c7_E1___5_](/uploads/99bd9b41153d4208ceb6fda265a4fc02/470-qa1-c7_E1___5_.png){width=1277 height=610}![470-qa1-c7_E1___6_](/uploads/876a479b368b57f81a0622d55fee764d/470-qa1-c7_E1___6_.png){width=1436 height=741}![470-qa1-c7_E1___7_](/uploads/55180a9b052d4cd14bd7b4d5dfb79c3a/470-qa1-c7_E1___7_.png){width=1436 height=741}  | PASS | -- |


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in stg
> ```gherkin
> ### Scenario: Exibir logs do tipo DATA_CHANGE corretamente
>Given que existem logs do tipo DATA_CHANGE gerados pelo sistema
>When o usuário visualiza o log na interface
>Then cada propriedade do log deve ser exibida em uma linha separada
>And se o log for longo, a área do log deve ser rolável na interface
>And os valores das propriedades devem estar formatados em CamelCase
> ```
>

-----

> ## Tests in stg
> ```gherkin
>### Scenario: Display DATA_CHANGE logs correctly
>Given that there are DATA_CHANGE logs generated by the system
>When the user views the log in the interface
>Then each property of the log should be displayed on a separate line
>And if the log is long, the log area should be scrollable in the interface
>And the values of the properties should be formatted in CamelCase
> ```
>

> ## Tests in stg
> ```gherkin
>### Scenario: Display DATA_CHANGE logs correctly
>Given that there are DATA_CHANGE logs generated by the system
>When the user views the log in the interface
>Then each property of the log should be displayed on a separate line
>And if the log is long, the log area should be scrollable in the interface
>And the values of the properties should be formatted in CamelCase
> | PASS | LeadPk 24031 / AccountPk 206382, 206395 and 205000 |
> ```
>
![470-stg-c1-_1_](/uploads/d05b236284fa03c5be79578c150bd98a/470-stg-c1-_1_.png){width=1428 height=746}![470-stg-c1-_2_](/uploads/91fbf877ccda0c154ac6da8f2f3ca5ea/470-stg-c1-_2_.png){width=1428 height=746}![470-stg-c1-_3_](/uploads/1392582df7ea0dfd1bdcf5fef216268f/470-stg-c1-_3_.png){width=1428 height=746}![470-stg-c1-_4_](/uploads/e3ccf916b282369aaf62037e06fc4f4b/470-stg-c1-_4_.png){width=1428 height=746}![470-stg-c1-_5_](/uploads/29660990a56ad07457d1fb249c1bd330/470-stg-c1-_5_.png){width=1428 height=746}![470-stg-c1-_6_](/uploads/00b8dd36247fee3ebf25fd153c8935ab/470-stg-c1-_6_.png){width=1428 height=746}![470-stg-c1-_8_](/uploads/f53a5ea639854f54ed828ae87c7bcdde/470-stg-c1-_8_.png){width=1428 height=746}![470-stg-c1-_9_](/uploads/7247c530113752c1b1c4613203896239/470-stg-c1-_9_.png){width=1428 height=746}
>
@davi.artur.gow In the merchant log, can we apply the same spacing to the edges of the log container?
>
![470-stg-c1-_7_](/uploads/bdd8aa97d7f43ac2670087ac1f2efa58/470-stg-c1-_7_.png){width=1428 height=746}

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
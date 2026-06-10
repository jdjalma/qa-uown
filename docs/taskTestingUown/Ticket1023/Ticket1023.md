------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1023

UOWN | Origination | Remove trailing white spaces from each field in the New Merchant registration.

Synopsis
It was observed that some Merchants were experiencing issues when submitting a New Application, where the "Send" button would not become available.
After investigation, we identified that this issue was caused by trailing spaces at the end of the Merchant name field.
To prevent this from happening, we need to ensure that any trailing white spaces are automatically removed from all input fields when a New Application is submitted.

Business Objective
This change will ensure that Merchants do not face unnecessary blocks or errors during the application process.

Feature Request | Business Requirements
Implement automatic trimming of trailing spaces for all fields in the New Application form.
This should happen both on the frontend (before submission) and backend (on save/update) to guarantee data consistency.
Apply validation rules to strip trailing and leading spaces from all relevant string fields, especially Merchant Name and Location.

-----

UOWN | Origination | Remover espaços em branco finais de cada campo no cadastro de Novo Comerciante

Sinopse
Foi observado que alguns comerciantes enfrentavam problemas ao enviar uma Nova Inscrição, pois o botão “Enviar” não ficava disponível.
Após investigação, identificamos que esse problema era causado por espaços em branco no final do campo de nome do comerciante.
Para evitar que isso ocorra, precisamos garantir que quaisquer espaços em branco finais sejam removidos automaticamente de todos os campos de entrada 
quando uma Nova Inscrição for enviada.

Objetivo de Negócio
Essa alteração garantirá que os comerciantes não enfrentem bloqueios ou erros desnecessários durante o processo de inscrição.

Requisição de Funcionalidade | Requisitos de Negócio
Implementar remoção automática de espaços em branco finais (trailing whitespace) de todos os campos no formulário de Nova Inscrição.
Essa limpeza deve ocorrer tanto no front-end (antes do envio) quanto no back-end (ao salvar/atualizar) para assegurar a consistência dos dados.
Aplicar regras de validação para remover espaços em branco iniciais e finais de todos os campos de texto relevantes, especialmente Nome do Comerciante e Localização.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Ao salvar as configurações do comerciante, verifique se os espaços em branco no início e no fim dos campos Merchant Code, Merchant Name, Location Name e Legal Name foram removidos, para que nem a requisição ao backend nem a exibição na interface contenham tais espaços.
When saving the merchant settings, verify that leading and trailing whitespace in the Merchant Code, Merchant Name, Location Name, and Legal Name fields has been removed, so that neither the request sent to the backend nor the interface display contains these spaces.

Verifique se é possível criar uma aplicação ao selecionar um comerciante cujos campos Merchant Code, Merchant Name, Location Name e Legal Name foram configurados com espaços em branco no início e no fim.
Verify that it is possible to create an application by selecting a merchant whose Merchant Code, Merchant Name, Location Name, and Legal Name fields contain leading and trailing whitespace.

Ao salvar as configurações do comerciante, assegure-se de que os espaços em branco no início e no fim dos campos Address, City, Zip, County, Country e Merchant URL sejam removidos, de modo que nem a interface nem os logs exibam tais espaços.
When saving the merchant settings, ensure that leading and trailing whitespace in the Address, City, Zip, County, Country, and Merchant URL fields is removed so that neither the interface nor the logs display those spaces.

Verifique se é possível criar uma aplicação ao selecionar um comerciante cujos campos Address, City, Zip, County, Country e Merchant URL contenham espaços em branco no início e no fim.
Verify that you can create an application by selecting a merchant whose Address, City, Zip, County, Country, and Merchant URL fields contain leading and trailing whitespace.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | Progress Mobility | When saving the merchant settings, verify that leading and trailing whitespace in the Merchant Code, Merchant Name, Location Name, and Legal Name fields has been removed, so that neither the request sent to the backend nor the interface display contains these spaces. |  | PASS |
| 12723 | Progress Mobility | Verify that it is possible to create an application by selecting a merchant whose Merchant Code, Merchant Name, Location Name, and Legal Name fields contain leading and trailing whitespace. |  | PASS |
| -- | Progress Mobility | When saving the merchant settings, ensure that leading and trailing whitespace in the Address, City, Zip, County, Country, and Merchant URL fields is removed so that neither the interface nor the logs display those spaces. |  | PASS |
| -- | -- | Verify that you can create an application by selecting a merchant whose Address, City, Zip, County, Country, and Merchant URL fields contain leading and trailing whitespace. |  | PASS |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| -- | Progress Mobility | When saving the merchant settings, verify that leading and trailing whitespace in the Merchant Code, Merchant Name, Location Name, and Legal Name fields has been removed, so that neither the request sent to the backend nor the interface display contains these spaces. | ![qa2-1023-c1_1_](/uploads/83d81ad255a47e872e2617ad71cd50c2/qa2-1023-c1_1_.png){width=1439 height=744}![qa2-1023-c1_2_](/uploads/27ab0100e27dbf3cf57a677266feba5e/qa2-1023-c1_2_.png){width=1439 height=744}![qa2-1023-c1_3_](/uploads/f65969082774397fcec0fd2b63f802c6/qa2-1023-c1_3_.png){width=1439 height=744}![qa2-1023-c1_4_](/uploads/4c74f358c4e2eaafbbb5fe48ad0d0b30/qa2-1023-c1_4_.png){width=1439 height=744}![qa2-1023-c1_5_](/uploads/a8d73f6ae896a7cd6017b66b6ce8df87/qa2-1023-c1_5_.png){width=1439 height=744}![qa2-1023-c1_6_](/uploads/22656d42359e1201b56a37ce5bf14e19/qa2-1023-c1_6_.png){width=1439 height=744}![qa2-1023-c1_7_](/uploads/4f42afbb967d646027cf270acfc9885c/qa2-1023-c1_7_.png){width=1439 height=744}![qa2-1023-c1_8_](/uploads/0c67f3a04b73902efb7a182fa8590213/qa2-1023-c1_8_.png){width=1439 height=744}![qa2-1023-c1_9_](/uploads/8e603277b93929723377d26ebb6de019/qa2-1023-c1_9_.png){width=1439 height=744}![qa2-1023-c1_10_](/uploads/28631e7cf236f4d65ab2d46304e3a52b/qa2-1023-c1_10_.png){width=1439 height=744}![qa2-1023-c1_11_](/uploads/ca47b3cbba78e8548b56361d2d4dfaca/qa2-1023-c1_11_.png){width=1439 height=744}![qa2-1023-c1_12_](/uploads/5851a975488d4f15835b36c65ba75686/qa2-1023-c1_12_.png){width=1130 height=72}![qa2-1023-c1_13_](/uploads/2b943a16100a42aac419666efee30b36/qa2-1023-c1_13_.png){width=1130 height=72}![qa2-1023-c1_14_](/uploads/19c15fbbd9accdeaa9df1a9b53d41032/qa2-1023-c1_14_.png){width=1130 height=72}![qa2-1023-c1_15_](/uploads/17d1175a533529462dad487f288dd1a4/qa2-1023-c1_15_.png){width=1130 height=72} | PASS |
| 12723 | Progress Mobility | Verify that it is possible to create an application by selecting a merchant whose Merchant Code, Merchant Name, Location Name, and Legal Name fields contain leading and trailing whitespace. | ![qa2-1023-c2_1_](/uploads/99d9e10c3789fc3b3db5ad993fd7db45/qa2-1023-c2_1_.png){width=1439 height=744}![qa2-1023-c2_2_](/uploads/96d0865ded4534550bb6cca08d345f22/qa2-1023-c2_2_.png){width=1439 height=744}![qa2-1023-c2_3_](/uploads/d1e805098e346de0ff629629ca72d22f/qa2-1023-c2_3_.png){width=1439 height=744} | PASS |
| -- | Progress Mobility | When saving the merchant settings, ensure that leading and trailing whitespace in the Address, City, Zip, County, Country, and Merchant URL fields is removed so that neither the interface nor the logs display those spaces. | ![qa2-1023-c3_1_](/uploads/d1b16678445082e00f0d50ab7f1fe93e/qa2-1023-c3_1_.png){width=517 height=744}![qa2-1023-c3_2_](/uploads/e6f5e72f1bbf03afb2961ee835006abb/qa2-1023-c3_2_.png){width=517 height=744}![qa2-1023-c3_3_](/uploads/38dcb615240d19971561af3663d47c7f/qa2-1023-c3_3_.png){width=517 height=744}![qa2-1023-c3_4_](/uploads/d869ef33ea61d379fed2fb5c17cf12ee/qa2-1023-c3_4_.png){width=517 height=744}![qa2-1023-c3_5_](/uploads/62c96647fdc8e9c7edc9fd1cd82f01c3/qa2-1023-c3_5_.png){width=517 height=744}![qa2-1023-c3_6_](/uploads/b61c03418fbbf1ffc0ccda59e06f2d58/qa2-1023-c3_6_.png){width=517 height=744}![qa2-1023-c3_7_](/uploads/5d0d44cf960aa10e2cf8e541c4e4fcea/qa2-1023-c3_7_.png){width=517 height=744}![qa2-1023-c3_8_](/uploads/f71c439fbfaae83017a903d74255abfa/qa2-1023-c3_8_.png){width=1437 height=744}![qa2-1023-c3_9_](/uploads/348f4055b49f0445ca37deb4c0bcc213/qa2-1023-c3_9_.png){width=1168 height=113}![qa2-1023-c3_10_](/uploads/db53435c12c6d8d8cfc2d6b7136c4af9/qa2-1023-c3_10_.png){width=1168 height=113}![qa2-1023-c3_11_](/uploads/55dfc7c1ffae4ee5c4cf2ef16c4b494d/qa2-1023-c3_11_.png){width=1168 height=113}![qa2-1023-c3_12_](/uploads/f4f71d9e66056f6dbe8630d4fa1c73fe/qa2-1023-c3_12_.png){width=1168 height=113} | PASS |
| -- | Progress Mobility | Verify that you can create an application by selecting a merchant whose Address, City, Zip, County, Country, and Merchant URL fields contain leading and trailing whitespace. | ![qa2-1023-c4_1_](/uploads/9506663c3584344854033213b63495c7/qa2-1023-c4_1_.png){width=1440 height=741} | PASS |
------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status |
| ------ | ------ | ------ |
| When saving the merchant settings, verify that leading and trailing whitespace in the Merchant Code, Merchant Name, Location Name, and Legal Name fields has been removed, so that neither the request sent to the backend nor the interface display contains these spaces. |  | PASS |
| Verify that it is possible to create an application by selecting a merchant whose Merchant Code, Merchant Name, Location Name, and Legal Name fields contain leading and trailing whitespace. |  | PASS |
| When saving the merchant settings, ensure that leading and trailing whitespace in the Address, City, Zip, County, Country, and Merchant URL fields is removed so that neither the interface nor the logs display those spaces. |  | PASS |
| Verify that you can create an application by selecting a merchant whose Address, City, Zip, County, Country, and Merchant URL fields contain leading and trailing whitespace. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
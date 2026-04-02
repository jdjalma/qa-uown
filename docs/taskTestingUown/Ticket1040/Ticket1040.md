----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1040

UOWN | Origination | Allow the minimum amount to be changed to any value if needed.

Synopsis
Currently, the minimum amount for leases is $250.00. However, we should allow the Merchant to change this amount to any value of their choice.

Business Objective
Ensure all lease agreements meet the business requirements.

Feature Request | Business Requirements
The system should enforce a default minimum lease amount of $250
Merchants should be able to configure and update this amount as needed for any value.

Fernando Martins @fernandogmartins
Testing Steps
Previously, there was a validation preventing the merchant from setting a minimum lease value below $250.
This validation has been removed, and now the merchant should be able to set the minimum lease value to any amount.
Test if the validation has been removed.

-----

UOWN | Origination | Permitir que o valor mínimo seja alterado para qualquer valor, conforme necessário.

Sinopse
Atualmente, o valor mínimo para contratos de leasing é de US$ 250,00. No entanto, devemos permitir que o Comerciante altere esse valor para qualquer quantia de sua escolha.

Objetivo de Negócio
Garantir que todos os contratos de leasing atendam aos requisitos de negócio.

Requisição de Funcionalidade | Requisitos de Negócio

O sistema deve aplicar, por padrão, um valor mínimo de leasing de US$ 250,00.
Os Comerciantes devem poder configurar e atualizar esse valor para qualquer quantia, conforme necessário.

Fernando Martins <fernandogmartins>
Passos para Teste
Anteriormente, havia uma validação que impedia o comerciante de definir um valor mínimo de leasing abaixo de US$ 250,00.
Essa validação foi removida, e agora o comerciante deverá conseguir definir o valor mínimo de leasing em qualquer valor.
Verificar se a validação realmente foi removida.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se a validação que obriga o preenchimento do valor mínimo de locação de R$ 250,00 foi removida.
Verify that the validation requiring a minimum lease amount of R$ 250.00 has been removed.

Validar se o sistema permite configurar o valor mínimo de locação para R$ 0,00.
Validate whether the system allows setting the minimum lease amount to R$ 0.00.

Definir o valor mínimo de locação em R$ 200,00 e criar um lease via API com subtotal dos produtos de R$ 199,00 e total superior a R$ 200,00.
Set the minimum lease amount to R$ 200.00 and create a lease via API with a product subtotal of R$ 199.00 and a total above R$ 200.00.

Definir um valor mínimo de locação abaixo de R$ 810,00 e criar um lease pela interface com subtotal dos produtos de R$ 800,00 e total superior a R$ 200,00.
Set a minimum lease amount below R$ 810.00 and create a lease via the UI with a product subtotal of R$ 199.00 and a total above R$ 850.00.

Validar se, por padrão, ao clonar um merchant, o sistema aplica o valor mínimo de locação definido no merchant original.
Validate that, by default, when cloning a merchant, the system applies the minimum lease amount defined in the original merchant.

Verificar se, ao criar um novo merchant, o valor mínimo de locação é exibido como R$ 250,00.
Verify that when creating a new merchant, the minimum lease amount is displayed as R$ 250.00.
-----

Tests in qa2

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Verify that the validation requiring a minimum lease amount of R$ 250.00 has been removed. |  | PASS | -- |
| Validate whether the system allows setting the minimum lease amount to R$ 0.00. |  | ERROR | When the merchant tries to save the minimum rental amount as R$0.00, can we display a warning message informing that this amount is not allowed? Additionally, the cursor focus and page scroll should automatically be directed to the “Minimum rental amount” field, ensuring that the user immediately sees the warning. |
| Set the minimum lease amount to R$ 200.00 and create a lease via API with a product subtotal of R$ 199.00 and a total above R$ 200.00. |  | PASS | -- |
| Set a minimum lease amount below R$ 200.00 and create a lease via the UI with a product subtotal of R$ 199.00 and a total above R$ 200.00. |  | PASS | -- |
| Validate that, by default, when cloning a merchant, the system applies the minimum lease amount defined in the original merchant. |  | PASS | -- |
| Verify that when creating a new merchant, the minimum lease amount is displayed as R$ 250.00. |  | PASS | -- |

-----

Tests in qa2

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Verify that the validation requiring a minimum lease amount of R$ 250.00 has been removed. | ![qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_1_](/uploads/8c71ffde8062cc771c7b26626fb9672e/qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_1_.png){width=1440 height=810}![qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_2_](/uploads/f73256d89ce9a653f27e428330e1ec03/qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_2_.png){width=1437 height=747}![qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_3_](/uploads/145e158398c257d2846e6407d50d3042/qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_3_.png){width=1440 height=810}![qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_4_](/uploads/d5974aad7cf4432462ca6909e7562b53/qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_4_.png){width=1440 height=810}![qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_5_](/uploads/4048db4d6d8626afece9cc5e3c0bfc5b/qa2-1040-c1-VerificarRemovidaValidacaoPreenchimentoValorMinimoLocacao250_5_.png){width=1170 height=53} | PASS | -- |
| Validate whether the system allows setting the minimum lease amount to R$ 0.00. | ![qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_1_](/uploads/50d9683c947cdeddeb5664faeb8abab1/qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_1_.png){width=996 height=741}![qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_2_](/uploads/af78a1bfea5115175b23c764c39f0ce8/qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_2_.png){width=1005 height=741}![qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_3_](/uploads/6a01e02b05dc91156ede34b0a44aa6cb/qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_3_.png){width=1005 height=741}![qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_4_](/uploads/438f68ee47294d52190c06e45b04d4f4/qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_4_.png){width=1437 height=747}![qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_5_](/uploads/ec3fe6814b338e669d159acec3526165/qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_5_.png){width=1437 height=747}![qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_6_](/uploads/4341e9a2eb4af8b97099e0e82f03afe9/qa2-1040-c2-ValidarPermiteConfigurarValorMinimoLocacaoPara0_6_.png){width=1131 height=59} | PASS | The improvement that takes the cursor and the view to the field that displays the warning that the field must be filled in with at least 1 was not implemented. This functionality was not implemented due to deadline issues and, since the current behavior follows this pattern, it would be necessary to create a new demand to change it. |
| Set the minimum lease amount to R$ 200.00 and create a lease via API with a product subtotal of R$ 199.00 and a total above R$ 200.00. | ![qa2-1040-c3-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaApi_1_](/uploads/783dc2942760e153305f3b00454389bb/qa2-1040-c3-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaApi_1_.png){width=1440 height=810}![qa2-1040-c3-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaApi_2_](/uploads/b5a60eae52ca039f96d1c76ca08584ef/qa2-1040-c3-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaApi_2_.png){width=856 height=81}![qa2-1040-c3-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaApi_3_](/uploads/5235b306b29a0fd1ed1c878cc1a409a6/qa2-1040-c3-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaApi_3_.png){width=1075 height=693} | PASS | -- |
| Set a minimum lease amount below R$ 200.00 and create a lease via the UI with a product subtotal of R$ 199.00 and a total above R$ 200.00. | ![qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_1_](/uploads/936d2784437197184734a6d19c12ff18/qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_1_.png){width=1431 height=454}![qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_2_](/uploads/4ceed483a629fea4042f422a0b0365bb/qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_2_.png){width=964 height=741}![qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_3_](/uploads/d2df80ab9472a0040e901432cc66f977/qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_3_.png){width=1431 height=743}![qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_4_](/uploads/490ff3e34c4b783a2eefea48cefffcd4/qa2-1040-c4-ValorMinimoLocacao200CriarLeaseSubtotal199E99Total240ViaInterface_4_.png){width=1431 height=743} | PASS | -- |
| Validate that, by default, when cloning a merchant, the system applies the minimum lease amount defined in the original merchant. | ![qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_1_](/uploads/1e92161a8be3a78457a22ccb900b3ccb/qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_1_.png){width=506 height=366}![qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_2_](/uploads/e6159f7cdbb22afa127f09dc155a98f9/qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_2_.png){width=990 height=162}![qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_3_](/uploads/e73f6c0bc53f8fe1b72d3c949ddc6db0/qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_3_.png){width=441 height=279}![qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_4_](/uploads/a062c8b76b69f4fa16670b648d1a11bc/qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_4_.png){width=498 height=368}![qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_5_](/uploads/4aa1f1280098fc9442f1edd42e75a84d/qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_5_.png){width=948 height=162}![qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_6_](/uploads/29ad058b28e0a4a7ed8541b73bb726b9/qa2-1040-c5-ValidarClonarMerchantAplicaValorMinimoLocacaoDefinidoNoMerchantOriginal_6_.png){width=969 height=744} | PASS | -- |
| Verify that when creating a new merchant, the minimum lease amount is displayed as R$ 250.00. | ![qa2-1040-c6-VerificarCriarNovoMerchantValorMinimoLocacao250_1_](/uploads/2bef7eefade6904c3580a1b9cc099d41/qa2-1040-c6-VerificarCriarNovoMerchantValorMinimoLocacao250_1_.png){width=969 height=744}![qa2-1040-c6-VerificarCriarNovoMerchantValorMinimoLocacao250_2_](/uploads/10580875c39e5977cd16bacc5a386aaa/qa2-1040-c6-VerificarCriarNovoMerchantValorMinimoLocacao250_2_.png){width=636 height=197} | PASS | -- |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ |
| Verify that the validation requiring a minimum lease amount of R$ 250.00 has been removed. |  | PASS | -- |
| Validate whether the system allows setting the minimum lease amount to R$ 0.00. |  | PASS | The improvement that takes the cursor and the view to the field that displays the warning that the field must be filled in with at least 1 was not implemented. This functionality was not implemented due to deadline issues and, since the current behavior follows this pattern, it would be necessary to create a new demand to change it. |
| Set the minimum lease amount to R$ 200.00 and create a lease via API with a product subtotal of R$ 199.00 and a total above R$ 200.00. |  | PASS | -- |
| Set a minimum lease amount below R$ 810.00 and create a lease via the UI with a product subtotal of R$ 199.00 and a total above R$ 850.00. |  | PASS | -- |
| Validate that, by default, when cloning a merchant, the system applies the minimum lease amount defined in the original merchant. |  | PASS | -- |
| Verify that when creating a new merchant, the minimum lease amount is displayed as R$ 250.00. |  | PASS | -- |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
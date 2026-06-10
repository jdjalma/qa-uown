------------------------------------------------------------------------------------------------------------------------------------------------------------------

Uown | Servicing | Prevent a second lease if there is an existing signed application

FPD and Future Leads:
Discussion on leads signed without account creation and implications for future applications.
Agreement to prevent a second lease if there is an existing signed application, while allowing modifications to the current lease.

-----

Uown | Atendimento | Impedir um segundo contrato de locação se já existir uma solicitação assinada

FPD e Leads Futuros:
Discussão sobre leads assinados sem criação de conta e suas implicações para futuras solicitações.
Acordo para impedir um segundo contrato de locação quando já houver uma solicitação assinada, permitindo apenas modificações no contrato vigente.

Verificar se ao configurar um contrato não assinado como assinado pela opção "Change to signed", o próximo contrato criado exibe status "DENIED" e status interno SIGNED_FPD_IN_FUTURE
Verify that when marking an unsigned contract as signed using the “Change to signed” option, the next contract created shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE.

Verificar se ao criar um contrato pela interface para um cliente que ja tem um contrato assinado o contrato criado exibe status "DENIED" e status interno SIGNED_FPD_IN_FUTURE
Verify that when creating a contract via the interface for a customer who already has a signed contract, the newly created contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE.

Verificar se ao iniciar a assinatura de um contrato e e não concluir, assinar outro contrato, retornar ao primeiro contrato para concluir assinatura, o primeiro  contrato exibe status "DENIED" e status interno SIGNED_FPD_IN_FUTURE
Verify that if you begin signing a contract and do not complete it, then sign another contract, and later return to the first contract to finish signing it, the first contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE.

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| X | X | Verify that when marking an unsigned contract as signed using the “Change to signed” option, the next contract created shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. |  | PASS |
| X | X | Verify that when creating a contract via the interface for a customer who already has a signed contract, the newly created contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. |  | PASS |
| X | X | Verify that if you begin signing a contract and do not complete it, then sign another contract, and later return to the first contract to finish signing it, the first contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. |  | PASS |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 12650 and 12651 | Progress Mobility | Verify that when marking an unsigned contract as signed using the “Change to signed” option, the next contract created shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. | ![qa2-356-c1_1_](/uploads/6b01bd5c07990fd90733f9fca0b80ba9/qa2-356-c1_1_.png){width=1440 height=740}![qa2-356-c1_2_](/uploads/e06f7c80c0497f25386ea01898f00045/qa2-356-c1_2_.png){width=1440 height=740}![qa2-356-c1_3_](/uploads/e931d051f80a6d6722b8f69ac4c6f74e/qa2-356-c1_3_.png){width=1118 height=725}![qa2-356-c1_4_](/uploads/2b7f15b76197e389f20fc06bee3fbb11/qa2-356-c1_4_.png){width=1437 height=744}![qa2-356-c1_5_](/uploads/6e4058524197c2450d993b19c9c26f36/qa2-356-c1_5_.png){width=1437 height=744}![qa2-356-c1_6_](/uploads/10478877664d16535c49ca22731053b7/qa2-356-c1_6_.png){width=1437 height=744}![qa2-356-c1_7_](/uploads/b42ae74524b592c145fb59e44188be00/qa2-356-c1_7_.png){width=1437 height=744}![qa2-356-c1_8_](/uploads/b7174a0e5656e0c8fe16341bc1947854/qa2-356-c1_8_.png){width=1437 height=744}![qa2-356-c1_9_](/uploads/8b503198a52d6cc63acacb8c645dc809/qa2-356-c1_9_.png){width=1437 height=744}![qa2-356-c1_10_](/uploads/52af4f1b16f975dbcb6c439523175d20/qa2-356-c1_10_.png){width=1437 height=744}![qa2-356-c1_11_](/uploads/217b13bb892d29ac669293ff7dd2e815/qa2-356-c1_11_.png){width=1437 height=744} | PASS |
| 12653 and 12654 | Progress Mobility | Verify that when creating a contract via the interface for a customer who already has a signed contract, the newly created contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. | ![qa2-356-c2_1_](/uploads/fe581cb6153ff856b66ed0036c8b433b/qa2-356-c2_1_.png){width=1440 height=745}![qa2-356-c2_2_](/uploads/7f38f79d7a220cf9c22c3caf6a068539/qa2-356-c2_2_.png){width=1440 height=745}![qa2-356-c2_3_](/uploads/8f0625fec9e6421bc1def975fe94e1e6/qa2-356-c2_3_.png){width=1432 height=521}![qa2-356-c2_4_](/uploads/200926c428443c37fb4d65d2e9dad5e5/qa2-356-c2_4_.png){width=1432 height=746} | PASS |
| 12659 and 12660 | Progress Mobility | Verify that if you begin signing a contract and do not complete it, then sign another contract, and later return to the first contract to finish signing it, the first contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. | ![qa2-356-c3_E1___1_](/uploads/6e4f368f2107030c002051db0cc92488/qa2-356-c3_E1___1_.png){width=1434 height=741}![qa2-356-c3_E1___2_](/uploads/d55466d17e3715945912681d7406c4ce/qa2-356-c3_E1___2_.png){width=1434 height=741}![qa2-356-c3_E1___3_](/uploads/118cd1fcf6209049aa847465d4dda7fe/qa2-356-c3_E1___3_.png){width=1434 height=553}![qa2-356-c3_E1___4_](/uploads/c437b345f92a2cf504a7d20c69731ab0/qa2-356-c3_E1___4_.png){width=1434 height=741}![qa2-356-c3_E1___5_](/uploads/834e790e1bdbd6f00903631903c79e3a/qa2-356-c3_E1___5_.png){width=1434 height=741}![qa2-356-c3_E1___6_](/uploads/8da56c10ff21bc8442346f8305091293/qa2-356-c3_E1___6_.png){width=1434 height=741}![qa2-356-c3_E1___7_](/uploads/4e37db89554693e55196fe39977f0c1f/qa2-356-c3_E1___7_.png){width=1434 height=548} | WIP |



------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se ao configurar um contrato não assinado como assinado, o próximo contrato criado exibe status "DENIED" e status interno SIGNED_FPD_IN_FUTURE
Verify that when setting an unsigned contract as signed, the next contract created displays status "DENIED" and internal status SIGNED_FPD_IN_FUTURE

Verificar se ao criar um contrato pela interface para um cliente que ja tem um contrato assinado o contrato criado exibe status "DENIED" e status interno SIGNED_FPD_IN_FUTURE
Verify that when creating a contract via the interface for a customer who already has a signed contract, the newly created contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE.

-----

Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23615 and 23616 | Progress Mobility | Verify that when setting an unsigned contract as signed, the next contract created displays status "DENIED" and internal status SIGNED_FPD_IN_FUTURE |  | PASS |
| 23615 and 23617 | Progress Mobility | Verify that when creating a contract via the interface for a customer who already has a signed contract, the newly created contract shows a status of DENIED and an internal status of SIGNED_FPD_IN_FUTURE. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/351

UOWN | Servicing | Separate "View and Add persmissions" in Bank Account and Credit Card Sections

Synopsis
Currently, the permission system of the portal used by the company's agents groups the actions of viewing and adding bank and credit card information 
into a single permission — view_all_bank_accounts and view_all_credit_cards, respectively. In addition, there are separate permissions only for removal.

The goal is to restructure the permissions, segmenting them into three distinct actions for each type of information 
(bank and credit card): view, add and remove, increasing configuration flexibility.

Business Objective
The team will have greater autonomy to define specific permissions according to each agent's actual needs, avoiding excessive grants.

Feature Request | Business Requirements
The current permissions view_all_bank_accounts and view_all_credit_cards must be discontinued
Agents who currently have the old permissions should be assigned the new permissions in a compatible manner, ensuring continuity of operations.

Suggested new permissions:
view_bank_accounts, add_bank_accounts, remove_bank_accounts
view_credit_cards, add_credit_cards, remove_credit_cards

-----

UOWN | Atendimento | Separar “Permissões de Visualizar e Adicionar” nas Seções de Conta Bancária e Cartão de Crédito

Sinopse
Atualmente, o sistema de permissões do portal usado pelos agentes da empresa agrupa as ações de visualizar e adicionar informações bancárias e de cartão de crédito
em uma única permissão — view_all_bank_accounts e view_all_credit_cards, respectivamente. Além disso, existem permissões separadas apenas para remoção.

O objetivo é reestruturar as permissões, segmentando-as em três ações distintas para cada tipo de informação (conta bancária e cartão de crédito): visualizar, adicionar e remover, aumentando a flexibilidade de configuração.

Objetivo de Negócio
A equipe terá maior autonomia para definir permissões específicas de acordo com as necessidades reais de cada agente, evitando concessões excessivas.

Solicitação de Recurso | Requisitos de Negócio
Descontinuar as permissões atuais view_all_bank_accounts e view_all_credit_cards.
Os agentes que já possuem as permissões antigas devem receber as novas permissões de forma compatível, garantindo a continuidade das operações.

Permissões sugeridas:
view_bank_accounts, add_bank_accounts, remove_bank_accounts
view_credit_cards, add_credit_cards, remove_credit_cards

-----


Verificar se o agente não visualiza todas as contas bancárias quando está sem a permissão "view all bank accounts" e se visualiza todas as contas bancárias quando tem a permissão "view all bank accounts"
    view all bank accounts

Verificar se o agente não adiciona contas bancárias quando está sem a permissão "add_bank_accounts" e se adiciona contas bancárias quando tem a permissão "add_bank_accounts"
    add bank accounts

Verificar se o agente não remove contas bancárias quando está sem a permissão "remove bank accounts" e se remore contas bancárias quando tem a permissão "remove bank accounts"
    remove bank accounts

Verificar se o agente não visualiza todos os cc quando está sem a permissão "view all credit cards" e se visualiza todas as contas bancárias quando tem a permissão "view all credit cards"
    view all credit cards

Verificar se o agente não adiciona contas bancárias quando está sem a permissão " add_credit_cards" e se adiciona contas bancárias quando tem a permissão "add_credit_cards"
    add credit cards   

Verificar se o agente não remove contas bancárias quando está sem a permissão "remove credit cards" e se remore contas bancárias quando tem a permissão "remove credit cards"
    remove credit cards

Verificar se ao criar usuario manager, permissoes de servicing view all bank accounts, add_bank_accounts, remove bank accounts, view all credit cards, add_credit_cards e remove credit cards estão configuradas para o usuario

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar se o agente não consegue visualizar todas as contas bancárias quando não possui a permissão view all bank accounts, e consegue visualizar quando possui essa permissão.
Verify that the agent cannot view all bank accounts when lacking the view all bank accounts permission, and can view them when granted that permission.

Verificar se o agente não consegue adicionar contas bancárias quando não possui a permissão add_bank_accounts, e consegue adicionar quando possui essa permissão.
Verify that the agent cannot add bank accounts when lacking the add_bank_accounts permission, and can add them when granted that permission.

Verificar se o agente não consegue remover contas bancárias quando não possui a permissão remove bank accounts, e consegue remover quando possui essa permissão.
Verify that the agent cannot remove bank accounts when lacking the remove bank accounts permission, and can remove them when granted that permission.

Verificar se o agente não consegue visualizar todos os cartões de crédito quando não possui a permissão view all credit cards, e consegue visualizar quando possui essa permissão.
Verify that the agent cannot view all credit cards when lacking the view all credit cards permission, and can view them when granted that permission.

Verificar se o agente não consegue adicionar cartões de crédito quando não possui a permissão add_credit_cards, e consegue adicionar quando possui essa permissão.
Verify that the agent cannot add credit cards when lacking the add_credit_cards permission, and can add them when granted that permission.

Verificar se o agente não consegue remover cartões de crédito quando não possui a permissão remove credit cards, e consegue remover quando possui essa permissão.
Verify that the agent cannot remove credit cards when lacking the remove credit cards permission, and can remove them when granted that permission.

Verificar, ao criar um usuário com perfil Manager, se as permissões de servicing view all bank accounts, add_bank_accounts, remove bank accounts, view all credit cards, add_credit_cards e remove credit cards estão corretamente atribuídas a esse usuário.
When creating a user with a Manager profile, check whether the servicing permissions view all bank accounts, add_bank_accounts, remove bank accounts, view all credit cards, add_credit_cards and remove credit cards are correctly assigned to that user.

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify that the agent cannot view all bank accounts when lacking the view all bank accounts permission, and can view them when granted that permission. |  | PASS | -- |
| X | X | Verify that the agent cannot add bank accounts when lacking the add_bank_accounts permission, and can add them when granted that permission. |  | WIP | @davi.artur.gow I didn't find permission to add bank account |
| 10617 | Progress Mobility | Verify that the agent cannot remove bank accounts when lacking the remove bank accounts permission, and can remove them when granted that permission. |  | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot view all credit cards when lacking the view all credit cards permission, and can view them when granted that permission. |  | PASS | -- |
| X | X | Verify that the agent cannot add credit cards when lacking the add_credit_cards permission, and can add them when granted that permission. |  | WIP | @davi.artur.gow  I didn't find permission to add credit card |
| 10617 | Progress Mobility | Verify that the agent cannot remove credit cards when lacking the remove credit cards permission, and can remove them when granted that permission. |  | PASS | -- |
| -- | -- | When creating a user with a Manager profile, check whether the servicing permissions view all bank accounts, add_bank_accounts, remove bank accounts, view all credit cards, add_credit_cards and remove credit cards are correctly assigned to that user. |  | PASS | -- |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify that the agent cannot view all bank accounts when lacking the view all bank accounts permission, and can view them when granted that permission. | ![qa2-351-c1-VisualizarOuNaoContasBancarias_1_](/uploads/f19dce86847b8ee639783b67f5303b4d/qa2-351-c1-VisualizarOuNaoContasBancarias_1_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_2_](/uploads/035c18a6d648fd4aed3922154f9d0496/qa2-351-c1-VisualizarOuNaoContasBancarias_2_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_3_](/uploads/dd16b3b873b0c26d6b25cb371babe709/qa2-351-c1-VisualizarOuNaoContasBancarias_3_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_4_](/uploads/b181abb799af93ad45bd71e58183dd85/qa2-351-c1-VisualizarOuNaoContasBancarias_4_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_5_](/uploads/bef53fc2ae154ad47790e2996bd82880/qa2-351-c1-VisualizarOuNaoContasBancarias_5_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_6_](/uploads/b135fc0b974a9778fe024f782f9b8d9a/qa2-351-c1-VisualizarOuNaoContasBancarias_6_.png){width=959 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_7_](/uploads/87f53a3b09e3319d47e35b26fc6ba85a/qa2-351-c1-VisualizarOuNaoContasBancarias_7_.png){width=1440 height=744} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot add bank accounts when lacking the add_bank_accounts permission, and can add them when granted that permission. | ![qa2-351-c2-AddBankAccountl_1_](/uploads/aa2143d18ebf00c13780e91e904c40d1/qa2-351-c2-AddBankAccountl_1_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_2_](/uploads/fa3d7bbc320242f7f4b15fe99973a0da/qa2-351-c2-AddBankAccountl_2_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_3_](/uploads/de695021fe122e76a8d1c11e49a3c523/qa2-351-c2-AddBankAccountl_3_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_4_](/uploads/3e50a10414cc320ccf186c862aa70f3e/qa2-351-c2-AddBankAccountl_4_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_5_](/uploads/69f0ae5e0bac193aa068fe2580608807/qa2-351-c2-AddBankAccountl_5_.png){width=1133 height=17} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot remove bank accounts when lacking the remove bank accounts permission, and can remove them when granted that permission. | ![qa2-351-c3-RemoveBankAccount_1_](/uploads/a1a998ac0bb3220c614259f46535aa38/qa2-351-c3-RemoveBankAccount_1_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_2_](/uploads/5508eb527b9c4c2860c64f97ff06d99a/qa2-351-c3-RemoveBankAccount_2_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_3_](/uploads/7283dff5933d03aef5a60dc11897033b/qa2-351-c3-RemoveBankAccount_3_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_4_](/uploads/28d7d279eb60d42f0b225ffabe3d47fc/qa2-351-c3-RemoveBankAccount_4_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_5_](/uploads/67d842c733609013ba311616aac046b8/qa2-351-c3-RemoveBankAccount_5_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_6_](/uploads/54630c3b74dd908b22a323f72f030720/qa2-351-c3-RemoveBankAccount_6_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_7_](/uploads/b4f5155f41d0bedb5ba1a1b7aea1b626/qa2-351-c3-RemoveBankAccount_7_.png){width=1440 height=744} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot view all credit cards when lacking the view all credit cards permission, and can view them when granted that permission. | ![qa2-351-c4-VisualizarOuNaoCC_1_](/uploads/0fd60db471385257dfda68b177585b0f/qa2-351-c4-VisualizarOuNaoCC_1_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_2_](/uploads/3ad025b8088cca20b5b531be39270c51/qa2-351-c4-VisualizarOuNaoCC_2_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_3_](/uploads/8046d7de3cbaa1165d1e6a8c1f2ff9de/qa2-351-c4-VisualizarOuNaoCC_3_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_4_](/uploads/b913536bf42aa1901f028ba8becb733e/qa2-351-c4-VisualizarOuNaoCC_4_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_5_](/uploads/01450a99c4806fc2fe93178924933386/qa2-351-c4-VisualizarOuNaoCC_5_.png){width=1440 height=744} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot add credit cards when lacking the add_credit_cards permission, and can add them when granted that permission. | ![qa2-351-c5-AddCreditCard_1_](/uploads/dd0e37a871b577fc248ce115634ce8e7/qa2-351-c5-AddCreditCard_1_.png){width=1431 height=741}![qa2-351-c5-AddCreditCard_2_](/uploads/80acf842c06da24c9563aebb8bea4097/qa2-351-c5-AddCreditCard_2_.png){width=918 height=741}![qa2-351-c5-AddCreditCard_3_](/uploads/da4ea5c35d377332cba7ad517a18051f/qa2-351-c5-AddCreditCard_3_.png){width=918 height=741}![qa2-351-c5-AddCreditCard_4_](/uploads/4ccc0562938bef5596fbb8f40fc39303/qa2-351-c5-AddCreditCard_4_.png){width=1439 height=741}![qa2-351-c5-AddCreditCard_5_](/uploads/cc9670750b751363b3e9b7d6917aad85/qa2-351-c5-AddCreditCard_5_.png){width=1157 height=36}![qa2-351-c5-AddCreditCard_6_](/uploads/65228ef5c0a86c056a18ebcc176b23ce/qa2-351-c5-AddCreditCard_6_.png){width=1433 height=742}![qa2-351-c5-AddCreditCard_7_](/uploads/39e41b4773a07709ac07e9c93b79837a/qa2-351-c5-AddCreditCard_7_.png){width=1433 height=742}![qa2-351-c5-AddCreditCard_8_](/uploads/21cc1d5ada01e41b878ef80c0ae77ba7/qa2-351-c5-AddCreditCard_8_.png){width=1433 height=742}![qa2-351-c5-AddCreditCard_9_](/uploads/1a44c695759777ca62d0e281801ad427/qa2-351-c5-AddCreditCard_9_.png){width=1433 height=742} | PASS | --- |
| 10617 | Progress Mobility | Verify that the agent cannot remove credit cards when lacking the remove credit cards permission, and can remove them when granted that permission. | ![qa2-351-c6-RemoveCreditCard_1_](/uploads/439b379a3179e6e437b7b159af1ef72b/qa2-351-c6-RemoveCreditCard_1_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_2_](/uploads/1086f9a9a8d8f8fd82ba1775cf92ec08/qa2-351-c6-RemoveCreditCard_2_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_3_](/uploads/13c5d9eb1bdd056ab47dc68d611f3790/qa2-351-c6-RemoveCreditCard_3_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_4_](/uploads/bf0fac06e9b70fe9bc011fc5ce66b97d/qa2-351-c6-RemoveCreditCard_4_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_5_](/uploads/83bfc270f8998f66028da37bc5a80a35/qa2-351-c6-RemoveCreditCard_5_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_6_](/uploads/8ad4f43dea99920b01d6df0d216ce359/qa2-351-c6-RemoveCreditCard_6_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_7_](/uploads/fa20698090bd49dff4b5f70888c11fd5/qa2-351-c6-RemoveCreditCard_7_.png){width=1440 height=744} | PASS | -- |
| -- | -- | When creating a user with a Manager profile, check whether the servicing permissions view all bank accounts, add_bank_accounts, remove bank accounts, view all credit cards, add_credit_cards and remove credit cards are correctly assigned to that user. | ![qa2-351-c7-CreateUserManagerVerifyPermissions_1_](/uploads/7f9272066f9e1aad213ecac5f472b6a9/qa2-351-c7-CreateUserManagerVerifyPermissions_1_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_2_](/uploads/17378c6c778f5346d7984844d7d65dfa/qa2-351-c7-CreateUserManagerVerifyPermissions_2_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_3_](/uploads/488c733870d5fa863eeaa5f02a384eea/qa2-351-c7-CreateUserManagerVerifyPermissions_3_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_4_](/uploads/da69577fe781b125c66ff7a6ce88afb4/qa2-351-c7-CreateUserManagerVerifyPermissions_4_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_5_](/uploads/6af27aa9c7c13c890d3dc706c84c8e6d/qa2-351-c7-CreateUserManagerVerifyPermissions_5_.png){width=1433 height=742} | PASS | -- |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status | Observation |
| ------ | ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify that the agent cannot view all bank accounts when lacking the view all bank accounts permission, and can view them when granted that permission. | ![qa2-351-c1-VisualizarOuNaoContasBancarias_1_](/uploads/f19dce86847b8ee639783b67f5303b4d/qa2-351-c1-VisualizarOuNaoContasBancarias_1_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_2_](/uploads/035c18a6d648fd4aed3922154f9d0496/qa2-351-c1-VisualizarOuNaoContasBancarias_2_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_3_](/uploads/dd16b3b873b0c26d6b25cb371babe709/qa2-351-c1-VisualizarOuNaoContasBancarias_3_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_4_](/uploads/b181abb799af93ad45bd71e58183dd85/qa2-351-c1-VisualizarOuNaoContasBancarias_4_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_5_](/uploads/bef53fc2ae154ad47790e2996bd82880/qa2-351-c1-VisualizarOuNaoContasBancarias_5_.png){width=1432 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_6_](/uploads/b135fc0b974a9778fe024f782f9b8d9a/qa2-351-c1-VisualizarOuNaoContasBancarias_6_.png){width=959 height=744}![qa2-351-c1-VisualizarOuNaoContasBancarias_7_](/uploads/87f53a3b09e3319d47e35b26fc6ba85a/qa2-351-c1-VisualizarOuNaoContasBancarias_7_.png){width=1440 height=744} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot add bank accounts when lacking the add_bank_accounts permission, and can add them when granted that permission. | ![qa2-351-c2-AddBankAccountl_1_](/uploads/aa2143d18ebf00c13780e91e904c40d1/qa2-351-c2-AddBankAccountl_1_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_2_](/uploads/fa3d7bbc320242f7f4b15fe99973a0da/qa2-351-c2-AddBankAccountl_2_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_3_](/uploads/de695021fe122e76a8d1c11e49a3c523/qa2-351-c2-AddBankAccountl_3_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_4_](/uploads/3e50a10414cc320ccf186c862aa70f3e/qa2-351-c2-AddBankAccountl_4_.png){width=1425 height=741}![qa2-351-c2-AddBankAccountl_5_](/uploads/69f0ae5e0bac193aa068fe2580608807/qa2-351-c2-AddBankAccountl_5_.png){width=1133 height=17} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot remove bank accounts when lacking the remove bank accounts permission, and can remove them when granted that permission. | ![qa2-351-c3-RemoveBankAccount_1_](/uploads/a1a998ac0bb3220c614259f46535aa38/qa2-351-c3-RemoveBankAccount_1_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_2_](/uploads/5508eb527b9c4c2860c64f97ff06d99a/qa2-351-c3-RemoveBankAccount_2_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_3_](/uploads/7283dff5933d03aef5a60dc11897033b/qa2-351-c3-RemoveBankAccount_3_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_4_](/uploads/28d7d279eb60d42f0b225ffabe3d47fc/qa2-351-c3-RemoveBankAccount_4_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_5_](/uploads/67d842c733609013ba311616aac046b8/qa2-351-c3-RemoveBankAccount_5_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_6_](/uploads/54630c3b74dd908b22a323f72f030720/qa2-351-c3-RemoveBankAccount_6_.png){width=1440 height=744}![qa2-351-c3-RemoveBankAccount_7_](/uploads/b4f5155f41d0bedb5ba1a1b7aea1b626/qa2-351-c3-RemoveBankAccount_7_.png){width=1440 height=744} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot view all credit cards when lacking the view all credit cards permission, and can view them when granted that permission. | ![qa2-351-c4-VisualizarOuNaoCC_1_](/uploads/0fd60db471385257dfda68b177585b0f/qa2-351-c4-VisualizarOuNaoCC_1_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_2_](/uploads/3ad025b8088cca20b5b531be39270c51/qa2-351-c4-VisualizarOuNaoCC_2_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_3_](/uploads/8046d7de3cbaa1165d1e6a8c1f2ff9de/qa2-351-c4-VisualizarOuNaoCC_3_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_4_](/uploads/b913536bf42aa1901f028ba8becb733e/qa2-351-c4-VisualizarOuNaoCC_4_.png){width=1440 height=744}![qa2-351-c4-VisualizarOuNaoCC_5_](/uploads/01450a99c4806fc2fe93178924933386/qa2-351-c4-VisualizarOuNaoCC_5_.png){width=1440 height=744} | PASS | -- |
| 10617 | Progress Mobility | Verify that the agent cannot add credit cards when lacking the add_credit_cards permission, and can add them when granted that permission. | ![qa2-351-c5-AddCreditCard_1_](/uploads/dd0e37a871b577fc248ce115634ce8e7/qa2-351-c5-AddCreditCard_1_.png){width=1431 height=741}![qa2-351-c5-AddCreditCard_2_](/uploads/80acf842c06da24c9563aebb8bea4097/qa2-351-c5-AddCreditCard_2_.png){width=918 height=741}![qa2-351-c5-AddCreditCard_3_](/uploads/da4ea5c35d377332cba7ad517a18051f/qa2-351-c5-AddCreditCard_3_.png){width=918 height=741}![qa2-351-c5-AddCreditCard_4_](/uploads/4ccc0562938bef5596fbb8f40fc39303/qa2-351-c5-AddCreditCard_4_.png){width=1439 height=741}![qa2-351-c5-AddCreditCard_5_](/uploads/cc9670750b751363b3e9b7d6917aad85/qa2-351-c5-AddCreditCard_5_.png){width=1157 height=36}![qa2-351-c5-AddCreditCard_6_](/uploads/65228ef5c0a86c056a18ebcc176b23ce/qa2-351-c5-AddCreditCard_6_.png){width=1433 height=742}![qa2-351-c5-AddCreditCard_7_](/uploads/39e41b4773a07709ac07e9c93b79837a/qa2-351-c5-AddCreditCard_7_.png){width=1433 height=742}![qa2-351-c5-AddCreditCard_8_](/uploads/21cc1d5ada01e41b878ef80c0ae77ba7/qa2-351-c5-AddCreditCard_8_.png){width=1433 height=742}![qa2-351-c5-AddCreditCard_9_](/uploads/1a44c695759777ca62d0e281801ad427/qa2-351-c5-AddCreditCard_9_.png){width=1433 height=742} | PASS | --- |
| 10617 | Progress Mobility | Verify that the agent cannot remove credit cards when lacking the remove credit cards permission, and can remove them when granted that permission. | ![qa2-351-c6-RemoveCreditCard_1_](/uploads/439b379a3179e6e437b7b159af1ef72b/qa2-351-c6-RemoveCreditCard_1_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_2_](/uploads/1086f9a9a8d8f8fd82ba1775cf92ec08/qa2-351-c6-RemoveCreditCard_2_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_3_](/uploads/13c5d9eb1bdd056ab47dc68d611f3790/qa2-351-c6-RemoveCreditCard_3_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_4_](/uploads/bf0fac06e9b70fe9bc011fc5ce66b97d/qa2-351-c6-RemoveCreditCard_4_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_5_](/uploads/83bfc270f8998f66028da37bc5a80a35/qa2-351-c6-RemoveCreditCard_5_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_6_](/uploads/8ad4f43dea99920b01d6df0d216ce359/qa2-351-c6-RemoveCreditCard_6_.png){width=1440 height=744}![qa2-351-c6-RemoveCreditCard_7_](/uploads/fa20698090bd49dff4b5f70888c11fd5/qa2-351-c6-RemoveCreditCard_7_.png){width=1440 height=744} | PASS | -- |
| -- | -- | When creating a user with a Manager profile, check whether the servicing permissions view all bank accounts, add_bank_accounts, remove bank accounts, view all credit cards, add_credit_cards and remove credit cards are correctly assigned to that user. | ![qa2-351-c7-CreateUserManagerVerifyPermissions_1_](/uploads/7f9272066f9e1aad213ecac5f472b6a9/qa2-351-c7-CreateUserManagerVerifyPermissions_1_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_2_](/uploads/17378c6c778f5346d7984844d7d65dfa/qa2-351-c7-CreateUserManagerVerifyPermissions_2_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_3_](/uploads/488c733870d5fa863eeaa5f02a384eea/qa2-351-c7-CreateUserManagerVerifyPermissions_3_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_4_](/uploads/da69577fe781b125c66ff7a6ce88afb4/qa2-351-c7-CreateUserManagerVerifyPermissions_4_.png){width=1433 height=742}![qa2-351-c7-CreateUserManagerVerifyPermissions_5_](/uploads/6af27aa9c7c13c890d3dc706c84c8e6d/qa2-351-c7-CreateUserManagerVerifyPermissions_5_.png){width=1433 height=742} | PASS | -- |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
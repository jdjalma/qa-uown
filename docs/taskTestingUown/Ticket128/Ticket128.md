---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/website/-/issues/128

UOWN | Customer Portal | Allow login for accounts in PAID_OUT_EARLY_EPO and SETTLED_IN_FULL status

Synopsis
Allow customers to log in to the Customer Portal even when their accounts are in PAID_OUT_EARLY_EPO or SETTLED_IN_FULL status.

Business Objective
Enable access to historical account information for customers who have fully paid or settled their accounts, improving transparency and customer experience.

Feature Request | Business Requirements
Update login and account validation rules in the Customer Portal.
Permit login for accounts in:
    PAID_OUT_EARLY_EPO
    SETTLED_IN_FULL

Marcos Silvano @marcos.pacheco.silva

test instructions
Customers with status PAID_OUT, PAID_OUT_EARLY, and PAID_OUT_EARLY are currently able to log in to the customer portal. With these changes, 
accounts with status PAID_OUT_EARLY_EPO and SETTLED_IN_FULL must also be granted access to the portal.

-----

UOWN | Portal do Cliente | Permitir login para contas com status PAID_OUT_EARLY_EPO e SETTLED_IN_FULL

Sinopse
Permitir que os clientes façam login no Portal do Cliente mesmo quando suas contas estiverem com status PAID_OUT_EARLY_EPO ou SETTLED_IN_FULL.

Objetivo de Negócio
Habilitar o acesso a informações históricas de conta para clientes que quitaram ou liquidaram totalmente suas contas, melhorando a transparência e a experiência do cliente.

Solicitação de Funcionalidade | Requisitos de Negócio
Atualizar as regras de login e validação de contas no Portal do Cliente.
Permitir login para contas com status:
    PAID_OUT_EARLY_EPO
    SETTLED_IN_FULL

Marcos Silvano @marcos.pacheco.silva

Instruções de Teste
Clientes com status PAID_OUT, PAID_OUT_EARLY e PAID_OUT_EARLY já podem fazer login no Portal do Cliente. Com estas alterações, 
contas com status PAID_OUT_EARLY_EPO e SETTLED_IN_FULL também devem ser autorizadas a acessar o portal.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------    
Verifique se o cliente cujo status de conta é PAID_OUT_EARLY_EPO consegue fazer login no Portal do Cliente.
Verify that a customer with account status PAID_OUT_EARLY_EPO can log in to the Customer Portal.

Verifique se o cliente cujo status de conta é SETTLED_IN_FULL consegue fazer login no Portal do Cliente.
Verify that a customer with account status SETTLED_IN_FULL can log in to the Customer Portal.

Verifique se o cliente que tinha conta ativa e acesso ao Portal do Cliente continua com acesso após o agente alterar o status da conta para SETTLED_IN_FULL.
Verify that a customer who previously had an active account and portal access continues to have access after an agent changes the account status to SETTLED_IN_FULL.

Verifique se o cliente cujo status de conta é PAID_OUT consegue fazer login no Portal do Cliente.
Verify that a customer with account status PAID_OUT can log in to the Customer Portal.

Verifique se o cliente cujo status de conta é PAID_OUT_EARLY consegue fazer login no Portal do Cliente.
Verify that a customer with account status PAID_OUT_EARLY can log in to the Customer Portal.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10525 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY_EPO can log in to the Customer Portal. |  | PASS |
| 10018 | Progress Mobility | Verify that a customer with account status SETTLED_IN_FULL can log in to the Customer Portal. |  | PASS |
| 10613 | Progress Mobility | Verify that a customer who previously had an active account and portal access continues to have access after an agent changes the account status to SETTLED_IN_FULL. |  | PASS |
| 10585 | Progress Mobility | Verify that a customer with account status PAID_OUT can log in to the Customer Portal. |  | PASS |
| 10229 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY can log in to the Customer Portal. |  | PASS |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10525 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY_EPO can log in to the Customer Portal. | ![qa2-128-c1-PaydOutEarlyEpo-_2_](/uploads/28eee3715efbf5e7b4774ce00f8b76ff/qa2-128-c1-PaydOutEarlyEpo-_2_.png){width=1435 height=741}![qa2-128-c1-PaydOutEarlyEpo-_2_](/uploads/0b932358a2c79bf3da790f20440fdb51/qa2-128-c1-PaydOutEarlyEpo-_2_.png){width=1435 height=741}![qa2-128-c1-PaydOutEarlyEpo-_3_](/uploads/a6f504e1c3548193303d46fe16b6f1a7/qa2-128-c1-PaydOutEarlyEpo-_3_.png){width=1435 height=741}![qa2-128-c1-PaydOutEarlyEpo-_4_](/uploads/8b1a8864e4ee6548a9e469de1cbd642e/qa2-128-c1-PaydOutEarlyEpo-_4_.png){width=1435 height=741} | PASS |
| 10018 | Progress Mobility | Verify that a customer with account status SETTLED_IN_FULL can log in to the Customer Portal. | ![qa2-128-c2-SetlledInFull_1_](/uploads/2e3958fe7a05f2181e71cf6baf50bc1e/qa2-128-c2-SetlledInFull_1_.png){width=1435 height=741}![qa2-128-c2-SetlledInFull_2_](/uploads/92a2c172534568fdb1332d1451636bfd/qa2-128-c2-SetlledInFull_2_.png){width=1435 height=741} | PASS |
| 10613 | Progress Mobility | Verify that a customer who previously had an active account and portal access continues to have access after an agent changes the account status to SETTLED_IN_FULL. | ![qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_1_](/uploads/29c61836ee9cdd516e6890f497ac95de/qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_1_.png){width=1435 height=741}![qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_2_](/uploads/bcc976dcf665c2193cc9cb85235cd155/qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_2_.png){width=1435 height=741}{{qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin(3).png}}![qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_4_](/uploads/4aa9668c55453758b0ac037d167facb3/qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_4_.png){width=1435 height=741}![qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_5_](/uploads/3858174320125dcec602d737b4ff9094/qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_5_.png){width=1435 height=741}![qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_6_](/uploads/26f294ead6025544d4b65e15bcb6e311/qa2-128-c3-ContaAtivaRealizarLoginAlteraStatusSettledInFullRealizarLogin_6_.png){width=1435 height=741} | PASS |
| 10585 | Progress Mobility | Verify that a customer with account status PAID_OUT can log in to the Customer Portal. | ![qa2-128-c4-PaidOut_1_](/uploads/02f68b377c5f4f878130524a9ae86899/qa2-128-c4-PaidOut_1_.png){width=1435 height=741}![qa2-128-c4-PaidOut_2_](/uploads/5f8dc7ad97ca626394f8efdcfdf93e7f/qa2-128-c4-PaidOut_2_.png){width=1435 height=741} | PASS |
| 10229 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY can log in to the Customer Portal. | ![qa2-128-c5-PaidOutEarly_1_](/uploads/79e438ac69235dbc38c2634b1baa311e/qa2-128-c5-PaidOutEarly_1_.png){width=1435 height=741}![qa2-128-c5-PaidOutEarly_2_](/uploads/4105c6d92998e75c7019be1f8f915e87/qa2-128-c5-PaidOutEarly_2_.png){width=1435 height=741} | PASS |

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206333 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY_EPO can log in to the Customer Portal. |  | PASS |
| 206336 | Progress Mobility | Verify that a customer with account status SETTLED_IN_FULL can log in to the Customer Portal. |  | PASS |
| 206337 | Progress Mobility | Verify that a customer who previously had an active account and portal access continues to have access after an agent changes the account status to SETTLED_IN_FULL. |  | PASS |
| 206334 | Progress Mobility | Verify that a customer with account status PAID_OUT can log in to the Customer Portal. |  | PASS |
| 206332 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY can log in to the Customer Portal. |  | PASS |


Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206333 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY_EPO can log in to the Customer Portal. | ![stg-128-c1_1_](/uploads/c59669645c1e1969a8110a8c1cf653bd/stg-128-c1_1_.png){width=1435 height=745}![stg-128-c1_2_](/uploads/8505d32687a571038347cdf22bd6d34a/stg-128-c1_2_.png){width=1435 height=745} | PASS |
| 206336 | Progress Mobility | Verify that a customer with account status SETTLED_IN_FULL can log in to the Customer Portal. | ![stg-128-c2_1_](/uploads/9a21a7c023e0842d016e8a8dcd2a7697/stg-128-c2_1_.png){width=1435 height=745}![stg-128-c2_2_](/uploads/596778c844f088928c81c0f9ac644236/stg-128-c2_2_.png){width=1435 height=745}![stg-128-c2_3_](/uploads/b1e4951967a45d7f1e7f41913e87712a/stg-128-c2_3_.png){width=1435 height=745}![stg-128-c2_4_](/uploads/f9966bd2c958573bdcfc3e98bfc940e0/stg-128-c2_4_.png){width=1435 height=745} | PASS |
| 206337 | Progress Mobility | Verify that a customer who previously had an active account and portal access continues to have access after an agent changes the account status to SETTLED_IN_FULL. | ![stg-128-c3_1_](/uploads/ae8f2aeaea53349048d9424798f7f993/stg-128-c3_1_.png){width=1435 height=745}![stg-128-c3_2_](/uploads/35ebadf46e68bfa30c3575b10f0a6df3/stg-128-c3_2_.png){width=1435 height=745}![stg-128-c3_3_](/uploads/45571a7300a20d6af9a69cffb6f5ac39/stg-128-c3_3_.png){width=1435 height=745} | PASS |
| 206334 | Progress Mobility | Verify that a customer with account status PAID_OUT can log in to the Customer Portal. | ![stg-128-c4_1_](/uploads/8fad1005db563effc52ad98963457d42/stg-128-c4_1_.png){width=1435 height=745}![stg-128-c4_2_](/uploads/c60777f9efce216bcfc86a388ce52050/stg-128-c4_2_.png){width=1435 height=745} | PASS |
| 206332 | Progress Mobility | Verify that a customer with account status PAID_OUT_EARLY can log in to the Customer Portal. | ![stg-128-c5_1_](/uploads/f05aac323d37dbf0646e6410dc3490d2/stg-128-c5_1_.png){width=1435 height=745}![stg-128-c5_2_](/uploads/d72def660ea42f7d69e822d56bcdf7ef/stg-128-c5_2_.png){width=1435 height=745} | PASS |

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
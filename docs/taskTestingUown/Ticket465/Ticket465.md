----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/465

UOWN | Servicing | Preventing New Logs with Null created_by

BUG
New log records are being created with a NULL value in the created_by field, which causes display inconsistencies in the frontend. 
This behavior needs to be corrected to ensure proper traceability and data consistency.

FIX
Update the code responsible for log creation to ensure that the created_by field (represented in the frontend as agentUserName) always receives a valid value. 
If no agent name is available, a default value such as "Unknown" or "System" should be assigned. This will prevent the creation of incomplete records 
without requiring updates to existing logs in the database.

-----

UOWN | Atendimento | Prevenção de novos logs com created_by nulo

ERRO
Novos registros de log estão sendo criados com valor NULL no campo created_by, o que causa inconsistências na exibição no frontend.
Esse comportamento precisa ser corrigido para garantir rastreabilidade e consistência dos dados.

CORREÇÃO
Atualizar o código responsável pela criação dos logs para garantir que o campo created_by (representado no frontend como agentUserName) sempre receba um valor válido.
Se nenhum nome de agente estiver disponível, um valor padrão como "Unknown" (Desconhecido) ou "System" (Sistema) deve ser atribuído.
Isso evitará a criação de registros incompletos sem exigir atualizações nos logs existentes no banco de dados.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verificar o User ID do log ao realizar ações em Servicing
Verify the User ID in the log when performing actions in Servicing.

------

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify the User ID in the log when performing actions in Servicing. |  | PASS |

-----

Tests in qa2

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 10617 | Progress Mobility | Verify the User ID in the log when performing actions in Servicing. | ![qa2-465-c1-RealizarAcoesVerificarUserIdLog_1_](/uploads/cf1519bb83415947ec364d76a8c410e0/qa2-465-c1-RealizarAcoesVerificarUserIdLog_1_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_2_](/uploads/e3dbf0f006d53b86ffcb6094ea6c44dc/qa2-465-c1-RealizarAcoesVerificarUserIdLog_2_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_3_](/uploads/9cfaf86394c46dc815007d78c9bf012c/qa2-465-c1-RealizarAcoesVerificarUserIdLog_3_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_4_](/uploads/df550cafaa991a551a6dc04c1448b6b3/qa2-465-c1-RealizarAcoesVerificarUserIdLog_4_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_35_](/uploads/36d160b84f286db4c03ffaf49003dc61/qa2-465-c1-RealizarAcoesVerificarUserIdLog_35_.png){width=1437 height=687}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_36_](/uploads/576db88ea02b269dc1cd9c8b0b395425/qa2-465-c1-RealizarAcoesVerificarUserIdLog_36_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_37_](/uploads/e28b83cc8d73e134f95892776ea3fa60/qa2-465-c1-RealizarAcoesVerificarUserIdLog_37_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_38_](/uploads/4b8e262a53fe913b1c9b4288e1c8baa7/qa2-465-c1-RealizarAcoesVerificarUserIdLog_38_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_39_](/uploads/691a1660404a2fea71e44efba1fdc72b/qa2-465-c1-RealizarAcoesVerificarUserIdLog_39_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_40_](/uploads/097fa2f691e535e354bb0f65eb49e03d/qa2-465-c1-RealizarAcoesVerificarUserIdLog_40_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_45_](/uploads/454876e31a9d41aa4d6449405286d6d5/qa2-465-c1-RealizarAcoesVerificarUserIdLog_45_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_46_](/uploads/a9032fa0ce0b463524e41605ce09a95a/qa2-465-c1-RealizarAcoesVerificarUserIdLog_46_.png){width=1437 height=743}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_48_](/uploads/9c03fdc5bc3c98886c91001f473c92b1/qa2-465-c1-RealizarAcoesVerificarUserIdLog_48_.png){width=1440 height=808}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_49_](/uploads/9e525fb885c21fb6f5a7f3719d211d41/qa2-465-c1-RealizarAcoesVerificarUserIdLog_49_.png){width=1440 height=808}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_50_](/uploads/15eae23077fd4bbd1af90f9deef9f87e/qa2-465-c1-RealizarAcoesVerificarUserIdLog_50_.png){width=1440 height=808}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_51_](/uploads/9a084db2a9630b392f0fef895ac186e2/qa2-465-c1-RealizarAcoesVerificarUserIdLog_51_.png){width=1440 height=808}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_52_](/uploads/c4cd0fb34351dfb02e9f33af68a9daf5/qa2-465-c1-RealizarAcoesVerificarUserIdLog_52_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_53_](/uploads/da358e4ad88aeeee2cc775539c618adb/qa2-465-c1-RealizarAcoesVerificarUserIdLog_53_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_54_](/uploads/8cc11152b1b1e45620e503d319550412/qa2-465-c1-RealizarAcoesVerificarUserIdLog_54_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_55_](/uploads/93479cc9faac6b8fd3031d0085eadc05/qa2-465-c1-RealizarAcoesVerificarUserIdLog_55_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_56_](/uploads/0355adcbf3c593fc14d690b083dc4210/qa2-465-c1-RealizarAcoesVerificarUserIdLog_56_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_57_](/uploads/20cd2e9c53883b43ac109c4242c0f76b/qa2-465-c1-RealizarAcoesVerificarUserIdLog_57_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_60_](/uploads/04b91917bd6b7735278cae51b5714570/qa2-465-c1-RealizarAcoesVerificarUserIdLog_60_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_61_](/uploads/8e9ca27b6567df038fb5ca75203f1a01/qa2-465-c1-RealizarAcoesVerificarUserIdLog_61_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_62_](/uploads/296b2b2e2ba0f60df31906bf3862f1fd/qa2-465-c1-RealizarAcoesVerificarUserIdLog_62_.png){width=1433 height=742}![qa2-465-c1-RealizarAcoesVerificarUserIdLog_63_](/uploads/1082415d17507800e481e04625b31181/qa2-465-c1-RealizarAcoesVerificarUserIdLog_63_.png){width=1433 height=742} | PASS |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa2

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Tests in stg

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 206336 | Progress Mobility | Verify the User ID in the log when performing actions in Servicing. |  | PASS |

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
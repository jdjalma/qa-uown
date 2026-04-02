------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/servicing/-/issues/464

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | Servicing | Fixing the getActivityLogs Query


BUG
Currently, in both the Servicing and Origination portals, the getActivityLogs query ignores records where the created_by field (in the database) is NULL. 
As a result, existing logs are not displayed on the frontend, leading to loss of visibility and inconsistency in the activity history.

FIX
Update the getActivityLogs query to include records with a NULL value in created_by, ensuring these logs are properly displayed on the frontend. 
This change will preserve the integrity of legacy data without requiring direct modifications in the database.

Marcos Silvano @marcos.pacheco.silva

Test instructions
Look for log entries for los and svc with createdBy (userId) null or empty, get their lead and account. 
With those ids go to their respective pages in origination and servicing; the activity log table should list the entries with createdBy empty or null.

-----

UOWN | Servicing | Correção da Consulta getActivityLogs
BUG
Atualmente, tanto nos portais Servicing quanto Origination, a consulta getActivityLogs ignora registros onde o campo created_by (no banco de dados) é NULL. 
Como resultado, os logs existentes não são exibidos no front-end, levando à perda de visibilidade e inconsistência no histórico de atividades.

CORREÇÃO
Atualizar a consulta getActivityLogs para incluir registros com valor NULL no campo created_by, garantindo que esses logs sejam exibidos corretamente no front-end.
Essa mudança preservará a integridade dos dados legados sem exigir modificações diretas no banco de dados.

Instruções de Teste
Procure entradas de log para los e svc com createdBy (userId) nulo ou vazio, obtenha os respectivos lead e account.
Com esses ids, acesse suas páginas correspondentes em Origination e Servicing; a tabela de logs de atividades deve listar as entradas com createdBy vazio ou nulo.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se logs com UserID null são exibidos ao filtrar logs por Notes e pelos tipos de Log Activity disponíveis no portal Origination.
Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Origination portal.

Verifique se logs com UserID null são exibidos ao filtrar logs por Notes e pelos tipos de Log Activity disponíveis no portal Servicing.
Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Servicing portal.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in qa1

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8811 | Tire Agent | Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Origination portal. |  | PASS |
| 3864-3863-3860-3858 | Tire Agent | Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Servicing portal. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se logs com UserID null são exibidos ao filtrar logs por Notes e pelos tipos de Log Activity disponíveis no portal Origination.
Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Origination portal.

Verifique se logs com UserID null são exibidos ao filtrar logs por Notes e pelos tipos de Log Activity disponíveis no portal Servicing.
Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Servicing portal.

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk/AccountPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 23330 | Progress Mobility | Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Origination portal. |  | PASS |
| 206264 | Progress Mobility | Verify if logs with null UserID are displayed when filtering logs by Notes and by available Log Activity types in the Servicing portal. |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in stg

------------------------------------------------------------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/326

------------------------------------------------------------------------------------------------------------------------------------------------------------------

UOWN | SVC | Atualizar GetApplicationStatus API para Incluir Dados de Financiamento

Priyanka Namburu @pnamburu
@jose.mendesdev Ponto final : /uown/los/getApplicationStatus. Certifique-se de que as informações relacionadas ao financiamento estejam presentes na resposta. 
Amount, fundRequestDate, fundedDate , merchantDiscount, merchantRebate etc

Por favor, teste leads em diferentes status e certifique-se de que não há erros e que as informações de financiamento são as mesmas 
que você vê na fila de financiamento

Sample body :
{ "userName": "payTomorrow", "setupPassword": "U0wn_payTomorrow", "localeString": "en_US", "merchantNumber": "OL90402-0001", 
"accountNumber" : "2261d667-e49f-444e-b8f7-eb34df3bec48" }

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 8173 | Msa PowerSports | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |
| 8174 | Daniel's Jewelers | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |
| 8175 | MyEyeMed | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------

Verifique se as informações de financiamento estão presentes na resposta do endpoint /uown/los/getApplicationStatus.
Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint

------------------------------------------------------------------------------------------------------------------------------------------------------------------
Tests in staging

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | ------ | ------ | ------ | ------ |
| 19959 | MSA Powersports | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |
| 19960 | Daniels Jewelers | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |
| 19962 | Progress Mobility | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |
| 19963 | MyEyeMed | Verify if the financing-related information is present in the response from the /uown/los/getApplicationStatus endpoint |  | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in staging

------------------------------------------------------------------------------------------------------------------------------------------------------------------
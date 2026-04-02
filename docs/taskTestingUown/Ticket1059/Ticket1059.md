--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1059

# UOWN | Origination | Parse device hash from SEON and detect returning customer based on this field

**Author:** Fernando Martins  
**Date:** 20 hours ago

## Testing Steps

### Requirements

- The lease must be created via the portal. Leases created through the API will not trigger the creation of a SEON fingerprint.
- Ensure the merchant configuration matches the following:
  - ![Merchant Configuration Screenshot](IMAGE_1)
  - ![Merchant Configuration Screenshot](IMAGE_2)

### Test Procedure

#### 1. Verify Schema

- Open the `uown_fraud_verification` table.
- Confirm that the `device_hash` column exists.

#### 2. Create Lease via Portal

- Create a new lease using the portal interface.

#### 3. Validate Record Creation

- After the lease is completed, check the `uown_fraud_verification` table:
  - A new record should be present.
  - The `device_hash` field should be populated.
  - The value should be correctly parsed from the SEON raw response.

##### Example of expected `device_hash` field:

```json
142d4a0c43701a0d99d...
```
  - ![Example of device_hash in DB](IMAGE_3)


-----

# UOWN | Origination | Parse o device hash do SEON e detecte cliente retornante baseado nesse campo

**Autor:** Fernando Martins  
**Data:** 20 horas atrás

## Passos de Teste

### Requisitos

- O lease deve ser criado via portal. Leases criados via API não irão disparar a criação do fingerprint do SEON.
- Certifique-se de que a configuração do merchant esteja conforme abaixo:
  - ![Captura de tela da configuração do merchant](IMAGE_1)
  - ![Captura de tela da configuração do merchant](IMAGE_2)

### Procedimento de Teste

#### 1. Verificar Schema

- Abra a tabela `uown_fraud_verification`.
- Confirme que existe a coluna `device_hash`.

#### 2. Criar Lease via Portal

- Crie um novo lease usando a interface do portal.

#### 3. Validar a Criação do Registro

- Após a finalização do lease, verifique a tabela `uown_fraud_verification`:
  - Um novo registro deve estar presente.
  - O campo `device_hash` deve estar preenchido.
  - O valor deve ser corretamente extraído da resposta bruta do SEON.

##### Exemplo do campo `device_hash` esperado:

```json
142d4a0c43701a0d99d...
```
  - ![Exemplo do device_hash no banco](IMAGE_3)


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


- Abra a tabela `uown_fraud_verification`.
- Confirme que existe a coluna `device_hash`.
    select ufv.lead_pk ,ufv.row_created_timestamp ,ufv.device_hash ,ufv.* from uown_fraud_verification ufv where ufv.row_created_timestamp between '2025-07-01 00:00:00.000' and '2025-07-10 23:59:59.999' ;

configuracao merchant

-----

Após a criação do lease, um novo registro foi encontrado na tabela uown_fraud_verification.
O campo device_hash está devidamente populado.
O valor do campo foi corretamente extraído do raw response do SEON, conforme o esperado.

-----

tests in qa1

| LeadPk | Merchant | Test Case | Test Data | Status |
| ------ | -------- | --------- | --------- | ------ |
| 9396 and 9397 | Progress Mobility |  | Após a criação do lease, um novo registro foi encontrado na tabela uown_fraud_verification | PASS |
| 9396 and 9397 | Progress Mobility |  | O campo device_hash está devidamente populado | PASS |
| 9396 and 9397 | Progress Mobility |  |  O valor foi corretamente extraído do raw response do SEON, conforme o esperado | PASS |

-----

Tests in qa1

| LeadPk        | Merchant          | Test Case                                                                                                                             | Test Data | Status |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 9396, 9397    | Progress Mobility | After the lease creation, a new record was found in the uown_fraud_verification table, the device_hash field is properly populated, and the value was correctly extracted from the SEON raw response, as expected. |           | PASS   |


Tests in qa1

| LeadPk        | Merchant          | Test Case                                                                                                                             | Test Data | Status |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 9396, 9397    | Progress Mobility | After the lease creation, a new record was found in the uown_fraud_verification table, the device_hash field is properly populated, and the value was correctly extracted from the SEON raw response, as expected. |     ![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_1_](/uploads/323c3b1162890a54a83b5731c3ee5ce2/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_1_.png){width=244 height=537}![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_2_](/uploads/dd9edad87a606ce8360cc35179480c12/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_2_.png){width=1005 height=41}![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_3_](/uploads/f0909257aaf55a06fec6dc26c5399059/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_3_.png){width=912 height=41}![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_4_](/uploads/ce1be869a8818e97eaa135eddaaf8670/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_4_.png){width=1059 height=41}![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_5_](/uploads/7d7d49136b47f1b4f5f6d1641d11a9c0/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_5_.png){width=1431 height=736}![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_6_](/uploads/6dc8a87077466aa3e06f71fa3a12f532/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_6_.png){width=1053 height=41}![1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_7_](/uploads/ec428dbb6ce94451d362eea4f7683428/1059-qa1-OK-DeviceHashIsPresente-ConteudoDoDeviceHashVemDoJson-_7_.png){width=374 height=480}      | PASS   |

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

| LeadPk        | Merchant          | Test Case                                                                                                                             | Test Data | Status |
| ------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------ |
| 24039 and 24040 | Tire Agent | After the lease creation, a new record was found in the uown_fraud_verification table, the device_hash field is properly populated, and the value was correctly extracted from the SEON raw response, as expected. |  | PASS   |




> ## Tests in stg
> ```gherkin
> After the lease creation, a new record was found in the uown_fraud_verification table, the device_hash field is properly populated, and the value was correctly extracted from the SEON raw response, as expected
> | PASS | LeadPk 24039 and 24040 | Merchant Tire Agent | 
> ```
>
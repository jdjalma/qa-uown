------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/362


# UOWN | SVC | Fuzzy Name Matching

## Context

Currently, the identity verification process using Intellicheck is ignoring the middle name extracted from the user's document. This can lead to validation failures, especially in cases where the middle name is important for accurately confirming the user's identity.

## Bugs Identified

- Intellicheck is ignoring the document's middle name, affecting verification accuracy.
- The same issue may occur with other identity providers (e.g., SEON).

## Required Fix

- Update the verification logic to **include the middle name** when available, and compare it with the value extracted from the document.
- The logic should:
- Detect if a middle name is provided.
- Check compatibility between the provided middle name and the one in the document.
- Maintain current behavior if no middle name is provided, ensuring no negative impact on existing flows.

- Create a `FuzzyNameMatchService` to be used by both Intellicheck and SEON.
- Implement methods to:
- Match first and last names exactly.
- Combine document name (removing spaces) and ensure each part of the application name exists in the document name.

## Configurations

- Each identity provider (Intellicheck/SEON) has flags to enable first, middle, and last name checks (all enabled by default).
- The middle name is optional: if enabled but not provided, it will be skipped.
- Configurations exist to define if each name part must match exactly or partial matches are allowed (default: all exact).

## Verification Flow

- If the document name is not present, verification ends immediately and logs a specific message.
- If the application's full name exactly matches the document name, verification passes immediately.
- If both first and last names are present in the document name, verification passes, regardless of middle name.
- In the standard flow, the system checks if first, middle (if present), and last names from the application match the document name.
- If any mismatch is found, the log will detail the reason (examples in attached images).

## Note

- For testing, update the first, middle, and last name columns in the `uown_los_customer`, `uown_seon`, and `uown_intellicheck` tables.
- Make sure there is only one record at a time during testing (SEON is prioritized if both exist).


-----


# UOWN | SVC | Fuzzy Name Matching

## Contexto

Atualmente, o processo de verificação de identidade utilizando o Intellicheck está ignorando o nome do meio extraído do documento do usuário.
Isso pode levar a falhas na validação, especialmente em casos onde o nome do meio é importante para a confirmação precisa da identidade do usuário.

## Bugs Identificados

- O Intellicheck ignora o nome do meio do documento, afetando a precisão da verificação.
- O mesmo problema pode ocorrer com outros provedores de identidade (ex: SEON).

## Correção Necessária

- Atualizar a lógica de verificação para **incluir o nome do meio**, quando disponível, e comparar com o valor extraído do documento.
- A lógica deve:
- Detectar se um nome do meio foi informado.
- Verificar a compatibilidade entre o nome do meio informado e o presente no documento.
- Manter o comportamento atual caso o nome do meio não seja informado, sem impacto negativo nos fluxos existentes.

- Criar um serviço `FuzzyNameMatchService` para ser utilizado tanto pelo Intellicheck quanto pelo SEON.
- Implementar métodos para:
- Comparação exata de primeiro e último nome.
- Combinar o nome do documento (removendo espaços) e garantir que cada parte do nome da aplicação exista no nome do documento.

## Configurações

- Cada provedor de identidade (Intellicheck/SEON) possui flags para habilitar a verificação de primeiro, do meio e último nome (todos habilitados por padrão).
- O nome do meio é opcional: se habilitado mas não informado, será ignorado.
- Configurações para definir se a correspondência de cada parte do nome deve ser exata ou parcial (por padrão, todas exatas).

## Fluxo de Verificação

- Se o nome do documento não estiver presente, a verificação termina imediatamente e registra log específico.
- Se o nome completo da aplicação for igual ao nome do documento, a verificação é aprovada imediatamente.
- Se pelo menos primeiro e último nome estiverem no documento, a verificação é aprovada, independente do nome do meio.
- No fluxo padrão, o sistema verifica se primeiro, do meio (se presente) e último nomes da aplicação correspondem ao nome do documento.
- Em caso de divergência, o log detalha o motivo (exemplos nas imagens anexas).

## Observação

- Para testar, é necessário atualizar as colunas de nome, nome do meio e sobrenome nas tabelas `uown_los_customer`, `uown_seon`, `uown_intellicheck`.
- Certifique-se de que só exista um registro por vez durante os testes (a SEON é priorizada se ambos existirem).


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#Intellicheck#
MID NAME
    Documento -> Com mid name
    Aplicacao -> Sem mid name
    - 9078
    - Caso o cliente tenha um nome no meio no documento que nao esta na aplicaçao é aprovado corretamente.
    9078
    {
    "idcheck": {
    "success": true,
    "result": false,
    "message": "Document failed authentication: Extended Result Code - U. Please refer to the ID Check Extended Result Codes documentation.",
    "data": {
    "processResult": "DocumentUnknown",
    "extendedResultCode": "U",
    "firstName": "John",
    "middleName": "Lee",
    "lastName": "Doe",
    "address1": "149 E Dexter St",
    "address2": "",
    "city": "Covina",
    "state": "CA",
    "postalCode": "91723-2639",
    "dateOfBirth": "10/16/1986",
    "age": 38,
    "heightCentimeters": "180",
    "heightFeetInches": "5' 11\"",
    "weightKilograms": "69",
    "weightPounds": "152",
    "eyeColor": "Brown",
    "hairColor": "Brown",
    "gender": "Male",
    "socialSecurity": "",
    "mediaType": "2D",
    "uniqueID": 1613,
    "testCard": false,
    "dlidNumberRaw": "D5265043",
    "dlidNumberFormatted": "D5265043",
    "restrictions": "",
    "endorsements": "",
    "driverClass": "C",
    "organDonor": "",
    "expirationDate": "10/16/2026",
    "expired": 0,
    "issueDate": "12/15/2021",
    "issuingJurisdictionCvt": "California",
    "issuingJurisdictionAbbrv": "CA",
    "isDuplicate": "",
    "duplicateDate": ""
    }
    }
    }
    Documento -> Sem mid name
    Aplicacao -> Com mid name
    - 9079
    - Caso o cliente não tenha um nome no meio no documento e na aplicaçao há um nome no meio é aprovado corretamente.
    9079
    {"idcheck":{"success":true,"result":false,"message":"Document failed authentication: Extended Result Code - U. Please refer to the ID Check Extended Result Codes documentation.","data":{"processResult":"DocumentUnknown","extendedResultCode":"U","firstName":"John","lastName":"Doe","address1":"149 E Dexter St","address2":"","city":"Covina","state":"CA","postalCode":"91723-2639","dateOfBirth":"10/16/1986","age":38,"heightCentimeters":"180","heightFeetInches":"5' 11\"","weightKilograms":"69","weightPounds":"152","eyeColor":"Brown","hairColor":"Brown","gender":"Male","socialSecurity":"","mediaType":"2D","uniqueID":1613,"testCard":false,"dlidNumberRaw":"D5265043","dlidNumberFormatted":"D5265043","restrictions":"","endorsements":"","driverClass":"C","organDonor":"","expirationDate":"10/16/2026","expired":0,"issueDate":"12/15/2021","issuingJurisdictionCvt":"California","issuingJurisdictionAbbrv":"CA","isDuplicate":"","duplicateDate":""}}}

SEM NOME
    Documento -> Sem
    Aplicacao -> Com
    9082
    {"idcheck":{"success":true,"result":false,"message":"Document failed authentication: Extended Result Code - U. Please refer to the ID Check Extended Result Codes documentation.","data":{"processResult":"DocumentUnknown","extendedResultCode":"U","firstName":"Thomaz","middleName":"","lastName":"Martinez","address1":"149 E Dexter St","address2":"","city":"Covina","state":"CA","postalCode":"91723-2639","dateOfBirth":"10/16/1986","age":38,"heightCentimeters":"180","heightFeetInches":"5' 11\"","weightKilograms":"69","weightPounds":"152","eyeColor":"Brown","hairColor":"Brown","gender":"Male","socialSecurity":"","mediaType":"2D","uniqueID":1613,"testCard":false,"dlidNumberRaw":"D5265043","dlidNumberFormatted":"D5265043","restrictions":"","endorsements":"","driverClass":"C","organDonor":"","expirationDate":"10/16/2026","expired":0,"issueDate":"12/15/2021","issuingJurisdictionCvt":"California","issuingJurisdictionAbbrv":"CA","isDuplicate":"","duplicateDate":""}}}
NOME COM ESPACOS
    espaços são removidos e comparação ocorre sem acentos
NOME COM ACENTO
    Acentos são removidos e comparação ocorre sem acentos



Tests in qa1

| LeadPk | Caso de Teste | Dados de Teste | Status |
| ------ | ------------- | -------------- | ------ |
| X | Documento contém nome do meio ausente na aplicação |  | PASS |
| X | Aplicação contém nome do meio ausente no documento |  | PASS |
| X | Verificar se retorna sucesso quando primeiro e último nomes estão corretos | PASS |  |
| X | Verificar se retorna rejeição quando nome do meio e sobrenome estão incorretos |  | PASS |  |
| X | Preenchimento de nomes utilizando apenas letras maiúsculas ou minúsculas |  | PASS |
| X | Troca na ordem do sobrenome e do último nome |  | PASS |
| X | Preenchimento de nomes com acentos ou espaços extras |  | PASS |
| X | Erro de digitação ou autocorreção no último nome |  | PASS |
| X | Verificar rejeição quando primeiro nome, nome do meio e sobrenome são divergentes da aplicação |  | PASS |

-----

Tests in qa1

| LeadPk | Test Case | Test Data | Status |
| ------ | --------- | --------- | ------ |
| X | Document contains middle name missing in application |  | PASS |
| X | Application contains middle name missing in document |  | PASS |
| X | Verify if success is returned when first and last names are correct | PASS |  |
| X | Verify if rejection is returned when middle and last names are incorrect |  | PASS |  |
| X | Filling in names using only uppercase or lowercase letters |  | PASS |
| X | Switching the order of surname and last name |  | PASS |
| X | Filling in names with accents or extra spaces |  | PASS |
| X | Typo or autocorrect in the last name |  | PASS |
| X | Verify rejection when first name, middle name, and last name all differ from application |  | PASS |

-----

Tests in qa1

| LeadPk | Test Case | Test Data | Status |
| ------ | --------- | --------- | ------ |
| 9082 | Document contains middle name missing in application | -- | PASS |
| 9082 | Application contains middle name missing in document | -- | PASS |
| 9082 | Verify if success is returned when first and last names are correct | PASS |
| 9082 | Verify if rejection is returned when middle and last names are incorrect | ![Screenshot_10](/uploads/e181d7d8db93894e23a780c3fb724a91/Screenshot_10.png){width=1055 height=40} | PASS |
| 9082 | Filling in names using only uppercase or lowercase letters | -- | PASS |
| 9082 | Switching the order of surname and last name | -- | PASS |
| 9082 | Filling in names with accents or extra spaces | -- | PASS |
| 9082 | Typo or autocorrect in the last name | -- | PASS |
| 9082 | Verify rejection when first name, middle name, and last name all differ from application | ![Screenshot_8](/uploads/e8a2b1a2888b01f255a182fa9318c892/Screenshot_8.png){width=1110 height=36} | PASS |

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Tests in stg

Document contains middle name missing in application
Application contains middle name missing in document
Verify if success is returned when first and last names are correct
Verify if rejection is returned when middle and last names are incorrect
Filling in names using only uppercase or lowercase letters 
Switching the order of surname and last name 
Filling in names with accents or extra spaces 
Typo or autocorrect in the last name
Verify rejection when first name, middle name, and last name all differ from application 

-----

Documento contém nome do meio ausente na aplicação
Aplicação contém nome do meio ausente no documento
Verifique se sucesso é retornado quando o primeiro e último nomes estão corretos - ok
Verifique se rejeição é retornada quando o nome do meio e o sobrenome estão incorretos


-----

-----

> ## Tests in stg
> 
> ```gherkin
>
> Document contains middle name missing in the application
> | PASS | 
> | The application is approved; the absence of the middle name does not result in an error when the first name and last name are correct | 
> ```
>
> ```gherkin
> Application contains middle name missing in the document
> | PASS |
> ```
>
> ```gherkin
> Verify if success is returned when the first and last names are correct
> | PASS |
> ```
> 
> ```gherkin
> Verify if rejection is returned when the middle name and the last name are incorrect
> | PASS |
> ```
> 
> ```gherkin
> Filling in names using only uppercase or lowercase letters
> | PASS |
> ```
> 
![362-stg-c1-_1_](/uploads/300e41ca74d7c9198210810205623320/362-stg-c1-_1_.png){width=1062 height=57}![362-stg-c1-_2_](/uploads/db319586d8f81e3321aa76fbac5d1d43/362-stg-c1-_2_.png){width=1076 height=55}![362-stg-c1-_3_](/uploads/337fbc8efc79fd80168932dd33c91aba/362-stg-c1-_3_.png){width=1058 height=57}![362-stg-c1-_4_](/uploads/47576c4dd6b5e1bea2107507349ed6ed/362-stg-c1-_4_.png){width=1063 height=195}

------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
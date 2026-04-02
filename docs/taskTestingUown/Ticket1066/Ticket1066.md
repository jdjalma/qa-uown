---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1066


# UOWN | Origination | Refactor Validation to Use Merchant’s Identity Provider

**Status**: Open  
**Ticket created**: 3 weeks ago by Yuri Araujo  

## Synopsis
Currently, the method responsible for internal identity provider validation (Seon or Intellicheck) does not properly handle scenarios where records for both providers exist in the database. This can lead to inconsistencies in the identity verification process.

## Business Objective
Ensure that the application consistently uses the correct identity provider based on the configuration set on the Merchant, even when records for multiple providers exist. This ensures data integrity, reliability, and trust in the identity verification process.

## Feature Request | Business Requirements
- Refactor the internal validation method for the identity provider.
- Add logic to verify which provider is configured on the Merchant and use that configuration to select the appropriate record in the database.
- Ensure that even if both Seon and Intellicheck records exist, only the one defined by the Merchant configuration is used in the verification process.
- Include logging and validations to help track which provider is used in each case.
- Validate the behavior in QA and Staging environments before releasing to production.

## Suggestion
Add automated tests covering scenarios:  
- Only Seon configured.  
- Only Intellicheck configured.

-----

# UOWN | Originação | Refatorar Validação para Usar o Provedor de Identidade do Comerciante

**Status**: Aberto  
**Tíquete criado**: 3 semanas atrás por Yuri Araujo  

## Sinopse
Atualmente, o método responsável pela validação interna do provedor de identidade (Seon ou Intellicheck) não lida adequadamente com cenários em que registros para ambos os provedores existem no banco de dados. Isso pode levar a inconsistências no processo de verificação de identidade.

## Objetivo de Negócio
Garantir que o aplicativo use consistentemente o provedor de identidade correto com base na configuração definida no Comerciante, mesmo quando existirem registros para múltiplos provedores. Isso garante a integridade dos dados, confiabilidade e confiança no processo de verificação de identidade.

## Solicitação de Funcionalidade | Requisitos de Negócio
- Refatorar o método de validação interna para o provedor de identidade.
- Adicionar lógica para verificar qual provedor está configurado no Comerciante e usar essa configuração para selecionar o registro apropriado no banco de dados.
- Garantir que, mesmo se existirem registros para Seon e Intellicheck, apenas o definido pela configuração do Comerciante seja usado no processo de verificação.
- Incluir registros (logs) e validações para ajudar a rastrear qual provedor é usado em cada caso.
- Validar o comportamento nos ambientes de QA e Staging antes de liberar para produção.

## Sugestão
Adicionar testes automatizados cobrindo os cenários:  
- Apenas Seon configurado.  
- Apenas Intellicheck configurado.

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


✅ Requisitos Extraídos
Requisitos Funcionais (RF)
RF1: O sistema deve determinar o provedor de identidade (Intellicheck ou SEON) com base na configuração do merchant.
RF2: Se existirem registros para ambos os provedores, apenas o que estiver configurado deve ser utilizado.
RF3: Se não houver registros para o provedor configurado, o sistema deve registrar isso em log e atualizar o status correspondente.
RF4: Se houver um registro válido para o provedor configurado, ele deve ser utilizado na validação.
RF5: O log de atividade deve indicar qual provedor foi selecionado e se um registro foi encontrado.
RF6: O comportamento deve ser validado nos ambientes de QA e Staging antes da liberação para produção.
RF7: O método getIdVerificationProvider(MerchantInfo) deve retornar o provedor com base ns flags isIntellicheckRequired e isSeonIdCheckRequired.

Requisitos Não Funcionais (RNF)
RNF1: Os logs devem ser detalhados o suficiente para rastrear qual provedor foi utilizado.
RNF2: A lógica deve ser confiável e consistente, mesmo que registros múltiplos existam.
RNF3: A verificação não deve impactar a performance da aplicação.



Funcionalidade: Seleção do Provedor de Identidade para Validação

  Cenário: Apenas SEON está configurado e o registro existe
    Dado que o merchant está configurado para usar SEON na verificação de identidade
    E existe um registro SEON para o lead
    E o merchant não está particinpando mais do plano de protecao
    Quando o cliente realiza a validação de identidade
    Então o registro SEON deve ser utilizado
    E o sistema deve registrar no log "Record found for SEON"
9400


  Cenário: Apenas Intellicheck está configurado e o registro existe
    Dado que o merchant está configurado para usar Intellicheck na verificação de identidade
    E existe um registro Intellicheck para o lead
    Quando o cliente realiza a validação de identidade
    Então o registro Intellicheck deve ser utilizado
    E o sistema deve registrar no log "No record found for SEON"
    E o sistema deve registrar no log "Record found for INTELLICHECK"
9403



  Cenário: Ambos os registros existem, mas SEON está configurado
    Dado que o merchant está configurado para usar SEON na verificação de identidade
    E existem registros para SEON e Intellicheck
    Quando o cliente realiza a validação de identidade
    Então apenas o registro SEON deve ser utilizado
    E o sistema deve registrar no log "Record found for SEON"
9416

  Cenário: Ambos os registros existem, mas Intellicheck está configurado
    Dado que o merchant está configurado para usar Intellicheck na verificação de identidade
    E existem registros para SEON e Intellicheck
    Quando o cliente realiza a validação de identidade
    Então apenas o registro Intellicheck deve ser utilizado
    E o sistema deve registrar no log "Record found for INTELLICHECK"
9421

  Cenário: Nenhum registro existe e Intellicheck está configurado
    Dado que o merchant está configurado para usar Intellicheck na verificação de identidade
    E nenhum registro Intellicheck existe para o lead
    Quando o cliente realiza a validação de identidade
    Então o sistema deve registrar no log "No record found for Seon"
    Então o sistema deve registrar no log "No record found for Intellicheck"
9422

  Cenário: Nenhum provedor está configurado
    Dado que o merchant não está configurado para usar nenhum provedor de identidade
    Quando o cliente realiza o processo de assinatura
    Então nenhum provedor deve ser selecionado
    E o sistema deve registrar no log "Protection plan was not offered"
9425


-----


📌 Tabela de Mapeamento (Requisito ↔ Cenário)
Requisito	Cenários Cobertos
RF1	Todos os cenários com configuração do merchant
RF2	"Ambos os registros existem, mas ..."
RF3	"Nenhum registro existe ..."
RF4	"Apenas SEON/Intellicheck configurado e registro existe"
RF5	Todos os cenários que contêm verificação de logs
RF6	Todos os cenários (devem ser executados nos ambientes QA e Staging)
RF7	Todos os cenários dependentes da lógica de getIdVerificationProvider
RNF1	Todos os cenários com expectativa de logging detalhado
RNF2	Coberto pela lógica de seleção única do provedor
RNF3	Considerado implicitamente (não testável diretamente via testes manuais)

⚠️ Lacunas Identificadas e Recomendações
❗ Concorrência: não há testes que considerem múltiplos merchants ou execuções simultâneas.
❗ Falhas de log: falta um cenário onde o sistema falha ao registrar os logs (ex: indisponibilidade de banco).
❗ Configuração inválida: e se ambos isSeonIdCheckRequired e isIntellicheckRequired forem true? A lógica esperada não está clara.
✅ Recomenda-se automatizar todos os cenários descritos com testes de integração e mocks para SEON e Intellicheck.


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




https://svc-{{env}}.uownleasing.com/uown/los/seonResults
{
"date": "2025-07-16T21:57:56.000Z",
"event": "idv:session_finished",
"details": {
    "name": "John doe",
    "email": "tocebag617@endibit.com",
    "status": "REVIEW",
    "userId": "9400",
    "platform": "WEB",
    "timeline": {
        "session": {
            "startedAt": "2025-07-16T21:57:05.234Z",
            "finishedAt": "2025-07-16T21:57:56.000Z"
        },
        "documentVerification": {
            "startedAt": "2025-07-16T21:57:27.000Z",
            "finishedAt": "2025-07-16T21:57:29.000Z"
        },
        "livenessVerification": {
            "startedAt": "2025-07-16T21:57:51.000Z",
            "finishedAt": "2025-07-16T21:57:54.000Z"
        }
    },
    "sessionId": "c22d8b99-8e42-49ef-be58-24ff07b89550",
    "startedAt": "2025-07-16T21:57:05.234Z",
    "finishedAt": "2025-07-16T21:57:56.000Z",
    "templateId": "b2df1416-0077-4ab1-bffe-f66965369652",
    "phoneNumber": "8283934286",
    "referenceId": "f01d80b6-3dba-459a-8a34-fa78f0b29603",
    "duplicatesFound": true,
    "documentCheckResult": {
        "overallResult": "REVIEW",
        "logicCheckResult": "PASS",
        "matchCheckResult": "NOT_PERFORMED",
        "stateCheckResult": "NOT_PERFORMED",
        "formatCheckResult": "PASS",
        "screenCheckResult": "PASS",
        "nameMatchCheckResult": "PASS",
        "photocopyCheckResult": "PASS",
        "postalCodeCheckResult": "NOT_PERFORMED",
        "dateOfBirthCheckResult": "NOT_PERFORMED",
        "handPresenceCheckResult": "PASS",
        "imageQualityCheckResult": "PASS",
        "photoForgeryCheckResult": "PASS",
        "dataIntegrityCheckResult": "FAIL",
        "barcodeAnomalyCheckResult": "PASS",
        "suspiciousDataCheckResult": "PASS",
        "ageVerificationCheckResult": "NOT_PERFORMED",
        "documentValidityCheckResult": "PASS",
        "securityFeaturesCheckResult": "PASS"
    },
    "dataExtractionResult": {
        "age": 44,
        "state": "US-FL",
        "gender": "M",
        "address": "2806 SANTEGO BAY CT BRANDON, FL 33511-2374",
        "country": "US",
        "fullName": "john doe",
        "birthDate": "1986-10-16T00:00:00.000Z",
        "documentType": "DRIVERS_LICENSE",
        "documentNumber": "B350-424-01-022-0",
        "documentIssueDate": "2020-10-27T00:00:00.000Z",
        "documentExpirationDate": "2029-01-22T00:00:00.000Z"
    },
    "selfieVerificationResult": {
        "overallResult": "APPROVED",
        "faceMatchingResult": "PASS",
        "livenessCheckResult": "PASS"
    },
    "livenessVerificationResult": {
        "blinkCheckResult": "NOT_PERFORMED",
        "depthCheckResult": "NOT_PERFORMED",
        "instructionCheckResult": "NOT_PERFORMED",
        "faceMatchingCheckResult": "NOT_PERFORMED",
        "interferenceCheckResult": "NOT_PERFORMED",
        "overallLivenessVerificationResult": "APPROVED"
    }
}
}

https://svc-{{env}}.uownleasing.com/uown/los/seonResults
{
    "idcheck": {
        "success": true,
        "result": true,
        "message": null,
        "data": {
            "processResult": "DocumentProcessOK",
            "extendedResultCode": "Y",
            "firstName": "John",
            "middleName": "",
            "lastName": "Doe",
            "address1": "2168 Studio Dr",
            "address2": "",
            "city": "Brea",
            "state": "CA",
            "postalCode": "92821",
            "dateOfBirth": "10/16/1986",
            "age": 38,
            "heightCentimeters": "168",
            "heightFeetInches": "5' 6\"",
            "weightKilograms": "73",
            "weightPounds": "160",
            "eyeColor": "Black",
            "hairColor": "Black",
            "gender": "Female",
            "socialSecurity": "",
            "mediaType": "2D",
            "uniqueID": 1613,
            "testCard": false,
            "dlidNumberRaw": "F5341039",
            "dlidNumberFormatted": "F5341039",
            "restrictions": "",
            "endorsements": "",
            "driverClass": "C",
            "organDonor": "No",
            "expirationDate": "04/21/2024",
            "expired": 1,
            "issueDate": "07/18/2022",
            "issuingJurisdictionCvt": "California",
            "issuingJurisdictionAbbrv": "CA",
            "isDuplicate": "",
            "duplicateDate": ""
        }
    }
}

-----

Given I am on the identity verification process for a merchant

### Scenario: Only SEON is configured and the record exists
Given the merchant is configured to use SEON for identity verification  
And there is a SEON record for the lead  
And the merchant is no longer participating in the protection plan  
When the customer performs identity verification  
Then the SEON record should be used  
And the system should log "Record found for SEON"  
| ✅ PASS | 9400 |

### Scenario: Only Intellicheck is configured and the record exists
Given the merchant is configured to use Intellicheck for identity verification  
And there is an Intellicheck record for the lead  
When the customer performs identity verification  
Then the Intellicheck record should be used  
And the system should log "No record found for SEON"  
And the system should log "Record found for INTELLICHECK"  
| ✅ PASS | 9403 |

### Scenario: Both records exist but SEON is configured
Given the merchant is configured to use SEON for identity verification  
And records for both SEON and Intellicheck exist  
When the customer performs identity verification  
Then only the SEON record should be used  
And the system should log "Record found for SEON"  
| ✅ PASS | 9416 |

### Scenario: Both records exist but Intellicheck is configured
Given the merchant is configured to use Intellicheck for identity verification  
And records for both SEON and Intellicheck exist  
When the customer performs identity verification  
Then only the Intellicheck record should be used  
And the system should log "Record found for INTELLICHECK"  
| ✅ PASS | 9421 |

### Scenario: No records exist and Intellicheck is configured
Given the merchant is configured to use Intellicheck for identity verification  
And no Intellicheck record exists for the lead  
When the customer performs identity verification  
Then the system should log "No record found for Seon"  
Then the system should log "No record found for Intellicheck"  
| ✅ PASS | 9422 |

### Scenario: No identity provider is configured
Given the merchant is not configured to use any identity provider  
When the customer proceeds with the signing process  
Then no provider should be selected  
And the system should log "Protection plan was not offered"  
| ✅ PASS | 9425 |


> ## Tests in qa1
> ```gherkin
> Given I am on the identity verification process for a merchant
> 
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
> And there is a SEON record for the lead  
> And the merchant is no longer participating in the protection plan  
> When the customer performs identity verification  
> Then the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS | 9400 |
> 
> ### Scenario: Only Intellicheck is configured and the record exists
> Given the merchant is configured to use Intellicheck for identity verification  
> And there is an Intellicheck record for the lead  
> When the customer performs identity verification  
> Then the Intellicheck record should be used  
> And the system should log "No record found for SEON"  
> And the system should log "Record found for INTELLICHECK"  
> | PASS | 9403 |
> 
> ### Scenario: Both records exist but SEON is configured
> Given the merchant is configured to use SEON for identity verification  
> And records for both SEON and Intellicheck exist  
> When the customer performs identity verification  
> Then only the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS | 9416 |
> 
> ### Scenario: Both records exist but Intellicheck is configured
> Given the merchant is configured to use Intellicheck for identity verification  
> And records for both SEON and Intellicheck exist  
> When the customer performs identity verification  
> Then only the Intellicheck record should be used  
> And the system should log "Record found for INTELLICHECK"  
> | PASS | 9421 |
> 
> ### Scenario: No records exist and Intellicheck is configured
> Given the merchant is configured to use Intellicheck for identity verification  
> And no Intellicheck record exists for the lead  
> When the customer performs identity verification  
> Then the system should log "No record found for Seon"  
> Then the system should log "No record found for Intellicheck"  
> | PASS | 9422 |
> 
> ### Scenario: No identity provider is configured
> Given the merchant is not configured to use any identity provider  
> When the customer proceeds with the signing process  
> Then no provider should be selected  
> And the system should log "Protection plan was not offered"  
> | PASS | 9425 |
> ```

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

ok in qa1

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1
> ```gherkin
> Given I am on the identity verification process for a merchant
> 
> ### Scenario: Only SEON is configured and the record exists
> Given the merchant is configured to use SEON for identity verification  
>And there is an SEON record for the lead
>And the merchant is further participating in identity verification
>When the customer performs identity verification
>Then the SEON record should be used
>And the system should log "Record found for SEON" 
> | PASS |  |
> ```
>

> 
> ```gherkin
> ### Scenario: Only Intellicheck is configured and the record exists
> Given the merchant is configured to use Intellicheck for identity verification  
> And there is an Intellicheck record for the lead  
> When the customer performs identity verification  
> Then the Intellicheck record should be used  
> And the system should log "No record found for SEON"  
> And the system should log "Record found for INTELLICHECK"  
> | PASS |  |
> ```
>

> 
> ```gherkin
> ### Scenario: Both records exist but SEON is configured
> Given the merchant is configured to use SEON for identity verification  
> And records for both SEON and Intellicheck exist  
> When the customer performs identity verification  
> Then only the SEON record should be used  
> And the system should log "Record found for SEON"  
> | PASS |  |
> ```
> 

>
> ```gherkin
> ### Scenario: Both records exist but Intellicheck is configured
> Given the merchant is configured to use Intellicheck for identity verification  
> And records for both SEON and Intellicheck exist  
> When the customer performs identity verification  
> Then only the Intellicheck record should be used  
> And the system should log "Record found for INTELLICHECK"  
> | PASS |  |
> ```
>

> 
> ```gherkin
> ### Scenario: No records exist and Intellicheck is configured
> Given the merchant is configured to use Intellicheck for identity verification  
> And no Intellicheck record exists for the lead  
> When the customer performs identity verification  
> Then the system should log "No record found for Seon"  
> Then the system should log "No record found for Intellicheck"  
> | PASS |  |
> ```
> 

>
> ```gherkin
> ### Scenario: No identity provider is configured
> Given the merchant is not configured to use any identity provider  
> When the customer proceeds with the signing process  
> Then no provider should be selected  
> And the system should log "Protection plan was not offered"  
> | PASS |  |
> ```
>

-----

Testes em stg
Dado que estou no processo de verificação de identidade para um merchant

> ### Scenario: Apenas SEON está configurado e o registro existe
Dado que o merchant está configurado para usar SEON para verificação de identidade
E que haja um registro SEON para o lead
E que o comerciante esteja participando da verificação de identidade
Quando o cliente realiza a verificação de identidade
Então, o registro SEON deve ser usado
E o sistema deve registrar "Registro encontrado para SEON"
| PASS | LeadPk 24031 |


> ### Scenario: Apenas Intellicheck está configurado e o registro existe
Dado que o merchant está configurado para usar Intellicheck para verificação de identidade
E existe um registro Intellicheck para o lead
Quando o cliente realiza a verificação de identidade
Então o registro Intellicheck deve ser utilizado
E o sistema deve registrar "Nenhum registro encontrado para SEON"
E o sistema deve registrar "Registro encontrado para INTELLICHECK"
| PASS | LeadPk 24033|


> ### Scenario: Ambos os registros existem, mas SEON está configurado
Dado que o merchant está configurado para usar SEON para verificação de identidade
E registros para SEON e Intellicheck existem
Quando o cliente realiza a verificação de identidade
Então somente o registro SEON deve ser utilizado
E o sistema deve registrar "Registro encontrado para SEON"
| PASS | LeadPk 24034 |


> ### Scenario: Ambos os registros existem, mas Intellicheck está configurado
Dado que o merchant está configurado para usar Intellicheck para verificação de identidade
E registros para SEON e Intellicheck existem
Quando o cliente realiza a verificação de identidade
Então somente o registro Intellicheck deve ser utilizado
E o sistema deve registrar "Registro encontrado para INTELLICHECK"
| PASS | LeadPk 25035 |


> ### Scenario: Nenhum registro existe e Intellicheck está configurado
Dado que o merchant está configurado para usar Intellicheck para verificação de identidade
E nenhum registro Intellicheck existe para o lead
Quando o cliente realiza a verificação de identidade
Então o sistema deve registrar "Nenhum registro encontrado para Seon"
Então o sistema deve registrar "Nenhum registro encontrado para Intellicheck"
| PASS | -- |

> ### Scenario: Nenhum provedor de identidade está configurado
Dado que o merchant não está configurado para usar nenhum provedor de identidade
Quando o cliente prossegue com o processo de assinatura
Então nenhum provedor deve ser selecionado
E o sistema não deve registrar log referente ao verificador de identidade
| PASS | -- |

-----

> ## Tests in stg
> ```gherkin
>Given I am in the identity verification process for a merchant
>
> ```gherkin
> ### Scenario: Only SEON is configured and the record exists
>Given the merchant is configured to use SEON for identity verification
>And there is a SEON record for the lead
>And the merchant is participating in the identity verification
>When the customer performs identity verification
>Then the SEON record should be used
>And the system should log "Record found for SEON"
>| PASS | LeadPk 24031 |
>
> ```gherkin
> ### Scenario: Only Intellicheck is configured and the record exists
>Given the merchant is configured to use Intellicheck for identity verification
>And there is an Intellicheck record for the lead
>When the customer performs identity verification
>Then the Intellicheck record should be used
>And the system should log "No record found for SEON"
>And the system should log "Record found for INTELLICHECK"
>| PASS | LeadPk 24033 |
>
> ```gherkin
> ### Scenario: Both records exist, but SEON is configured
>Given the merchant is configured to use SEON for identity verification
>And records for SEON and Intellicheck exist
>When the customer performs identity verification
>Then only the SEON record should be used
>And the system should log "Record found for SEON"
>| PASS | LeadPk 24034 |
>
> ```gherkin
> ### Scenario: Both records exist, but Intellicheck is configured
>Given the merchant is configured to use Intellicheck for identity verification
>And records for SEON and Intellicheck exist
>When the customer performs identity verification
>Then only the Intellicheck record should be used
>And the system should log "Record found for INTELLICHECK"
>| PASS | LeadPk 25035 |
>
> ```gherkin
> ### Scenario: No records exist and Intellicheck is configured
>Given the merchant is configured to use Intellicheck for identity verification
>And no Intellicheck record exists for the lead
>When the customer performs identity verification
>Then the system should log "No record found for Seon"
>Then the system should log "No record found for Intellicheck"
>| PASS | -- |
>
> ```gherkin
> ### Scenario: No identity provider is configured
>Given the merchant is not configured to use any identity provider
>When the customer proceeds with the signing process
>Then no provider should be selected
And the system should not log the identity verifier.
>| PASS | -- |
> ```
>

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


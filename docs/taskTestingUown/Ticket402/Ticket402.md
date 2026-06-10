--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/402

UOWN | SVC | Update SEON SDK and API to Latest Version and Capture New Response Fields

Synopsis
Upgrade the SEON SDK and API integration to the latest available version. Extend the response handling to store the True 
Device ID and Network Score values returned by SEON.

Business Objective

Feature Request | Business Requirements
Update the system to use the latest SEON SDK and compatible API version.
Ensure all existing SEON integration flows remain functional after the upgrade.
Capture the following new fields from the SEON API response:
    True Device ID
    Network Score

-----

Implementation Docs:

True Device ID (Web SDK; also available for Android/iOS)
SEON Docs
Available from Web SDK v6.5.0. Returns true_device_id via Fraud API.

Email API v3 (Advanced Digital Footprint – Email)
SEON Docs
Endpoint: /email-api/v3; includes network scores & SEON Fraud History.

Phone API v2 (Advanced Digital Footprint – Phone)
SEON Docs
Endpoint: /phone-api/v2; includes network risk score, HLR/CNAM details.

Clone Search (detect duplicates/synthetics across device, phone, IP, etc.)
SEON Docs



Steps-to-Reproduce

Prerequisites
Fraud verification must be enabled for the merchant you’ll use in the test.

Steps
Access the Origination portal.
Start the New Application flow.
In the sendApplication step, inspect the request payload and verify the field seonFingerprintText is present and populated.
Example shape (truncated):
W;6.9.0;bvDNJplBvR9YjQ0d1nxKRA==;EpFMtJug6WJQylQG...
Submit the application.

Database Verification
In database uown_los_lead, confirm the column seon_fingerprint_text is populated for the created lead.
In uown_fraud_engine_outbound, check the response column for the new True Device ID field:
    Ensure the JSON in response contains the True Device ID (e.g., under a path like device_details.true_device_id).

Expected Results
The request payload includes seonFingerprintText.
uown_los_lead.seon_fingerprint_text is stored with that same session value.
uown_fraud_engine_outbound.response includes the True Device ID.
If fraud verification is not enabled for the merchant, the True Device ID will not be present.

-----

UOWN | SVC | Atualizar SEON SDK e API para a versão mais recente e capturar novos campos de resposta

Sinopse Atualizar a integração do SEON SDK e da API para a versão mais recente disponível. Estender o tratamento de respostas para armazenar os valores True Device ID e Network Score retornados pelo SEON.

Objetivo de Negócio

Requisito de Funcionalidade | Requisitos de Negócio

Atualizar o sistema para usar a versão mais recente do SEON SDK e a versão compatível da API.
Garantir que todos os fluxos existentes de integração com o SEON permaneçam funcionais após a atualização.
Capturar os seguintes novos campos da resposta da API do SEON:
True Device ID
Network Score

Documentação de Implementação:

True Device ID (Web SDK; também disponível para Android/iOS)

SEON Docs
Disponível a partir do Web SDK v6.5.0. Retorna true_device_id via Fraud API.
Email API v3 (Advanced Digital Footprint – Email)

SEON Docs
Endpoint: /email-api/v3; inclui network scores e SEON Fraud History.
Phone API v2 (Advanced Digital Footprint – Phone)

SEON Docs
Endpoint: /phone-api/v2; inclui network risk score, detalhes HLR/CNAM.
Clone Search (detecta duplicados/sintéticos entre device, phone, IP, etc.)
SEON Docs

Passos para Reproduzir

Pré-requisitos

A verificação de fraude deve estar habilitada para o merchant que será usado no teste.
Passos

Acessar o portal Origination.
Iniciar o fluxo de New Application.
Na etapa sendApplication, inspecionar o payload da requisição e verificar se o campo seonFingerprintText está presente e populado. Exemplo de formato (truncado): W;6.9.0;bvDNJplBvR9YjQ0d1nxKRA==;EpFMtJug6WJQylQG...
Enviar a aplicação.
Verificação em Banco de Dados

No banco uown_los_lead, confirmar que a coluna seon_fingerprint_text está populada para o lead criado.
Em uown_fraud_engine_outbound, verificar a coluna response para o novo campo True Device ID:
Garantir que o JSON em response contenha o True Device ID (por exemplo, sob um caminho como device_details.true_device_id).
Resultados Esperados

O payload da requisição inclui seonFingerprintText.
uown_los_lead.seon_fingerprint_text é armazenado com o mesmo valor de sessão.
uown_fraud_engine_outbound.response inclui o True Device ID.
Se a verificação de fraude não estiver habilitada para o merchant, o True Device ID não estará presente.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Resumo do que será validado
Confirmação do fingerprint no request: campo seonFingerprintText na etapa sendApplication.
Persistência do fingerprint: uown_los_lead.seon_fingerprint_text.
Captura do True Device ID no retorno do SEON: uown_fraud_engine_outbound.response (JSON).
Captura de Network Score via Email API v3 e Phone API v2 (quando aplicável).
Regressão dos fluxos já existentes do SEON após upgrade.
Caso negativo: merchant sem fraude habilitada não deve ter True Device ID.

Pré-requisitos
Merchant com verificação de fraude habilitada para o teste (pelo menos em um ambiente QA/Staging).
Acesso ao Origination (usuário/senha).
Acesso ao banco (uown_los_lead, uown_fraud_engine_outbound).
Ferramenta para inspecionar rede (DevTools do navegador) ou HAR via framework.
Referências de versão:
Web SDK SEON v6.5.0+ (True Device ID disponível a partir desta versão).
Email API v3.
Phone API v2.


* Fluxo Manual – Happy Path (com fraude habilitada)
Acessar o portal Origination.
Iniciar o fluxo “New Application”.
Na etapa “sendApplication”:
Abrir DevTools (Aba Network).
Marcar “Preserve log”.
Executar a submissão da aplicação.
Localizar a chamada que contém o payload de envio da aplicação (normalmente POST para a API de criação/envio).
Verificar no Request Payload a presença do campo seonFingerprintText e se ele está populado (similar a W;6.9.0;...).
Enviar a aplicação.
Anotar o LeadPk/Account/UUID da aplicação criada para conferências.

* Verificações de Banco 3.1) seon_fingerprint_text no lead
Confirmar que seon_fingerprint_text foi persistido com o mesmo valor enviado no request:
    -- Replace <LEAD_PK> with the created lead PK
    SELECT lead_pk, seon_fingerprint_text
    FROM uown_los_lead
    WHERE lead_pk = <LEAD_PK>;
Validar que seon_fingerprint_text não está vazio e contém a mesma string capturada no request.

*  True Device ID no retorno do SEON
Conferir a tabela de saída para fraude (respostas do SEON)
    -- Get the most recent fraud engine outbound for your lead (adjust filters if needed)
    SELECT id, lead_pk, created_at, response
    FROM uown_fraud_engine_outbound
    WHERE lead_pk = <LEAD_PK>
    ORDER BY created_at DESC
    LIMIT 3;
No campo response (JSON), procurar pelo True Device ID. O caminho típico pode ser algo como device_details.true_device_id (o caminho exato pode variar conforme a integração):
    Exemplos de verificação (ferramenta externa ou JSON viewer):
        response->'device_details'->>'true_device_id'
        ou localizar por substring "true_device_id" no JSON.

* Verificações de Network Score (Email API v3 / Phone API v2)
Se seu fluxo aciona as Digital Footprints:
    Email API v3 (/email-api/v3): deve incluir network scores e histórico de fraude do SEON.
    Phone API v2 (/phone-api/v2): deve incluir network risk score, HLR/CNAM.
Abordagem prática:
    No DevTools (Network), filtrar por “email-api” e “phone-api” durante o fluxo (ou quando a verificação é disparada).
    Inspecionar as respostas e confirmar presença de campos de “network score” (nomes podem variar: network_score, network_risk_score, etc.).
    Se as respostas são persistidas em tabela de auditoria/integração (ex.: uown_fraud_engine_outbound ou outra), confirmá-las semelhantemente ao passo 3.2.
Caso você use logs de aplicação, verificar entradas “SEON Email API v3” / “SEON Phone API v2” com payloads e response codes 200.

* Caso Negativo – Merchant sem fraude habilitada
Repetir o fluxo “New Application” com merchant que não possua fraude habilitada.
Esperado:
    O seonFingerprintText pode ainda ser enviado (dependendo da implementação), mas o True Device ID não deve aparecer no response do SEON (ou a chamada pode nem ocorrer).
Validação no banco:
    SELECT lead_pk, seon_fingerprint_text
    FROM uown_los_lead
    WHERE lead_pk = <LEAD_PK_SEM_FRAUDE>;
Conferir uown_fraud_engine_outbound:
    SELECT id, lead_pk, created_at, response
    FROM uown_fraud_engine_outbound
    WHERE lead_pk = <LEAD_PK_SEM_FRAUDE>
    ORDER BY created_at DESC
    LIMIT 3;
Confirmar ausência de true_device_id no response.


* Regressão dos Fluxos SEON
Validar que os fluxos previamente existentes de verificação (ex.: Email/Phone/IP, Device Fingerprint, regras de risco) continuam funcionando:
    Sem erros 4xx/5xx nas chamadas SEON.
    Sem exceções no backend.
    Comportamento de aprovação/negação/pendência inalterado em condições equivalentes.
    
* Observabilidade e Logs (opcional, mas recomendado)
Backend:
    Verificar logs de integração (“SEON request/response”, “fingerprint”, “true_device_id persisted”, “network score parsed”).
Frontend:
    Verificar se o SDK é carregado sem erros (DevTools Console).
Auditoria:
    Confirmar mapeamento do True Device ID e network score no pipeline de dados (se aplicável).

* Critérios de Aceite
Request payload contém seonFingerprintText na etapa sendApplication.
uown_los_lead.seon_fingerprint_text persistido e igual ao enviado.
uown_fraud_engine_outbound.response inclui o True Device ID quando a fraude está habilitada.
Network score presente nas respostas Email API v3/Phone API v2 (quando essas consultas são disparadas pelo fluxo).
Sem regressões nos fluxos existentes.
Caso negativo: sem True Device ID quando a fraude não está habilitada.

* Dicas para Automação no Seu Framework (Selenium + Java + Cucumber)
Reusar steps e helpers existentes conforme suas convenções:
    Acessar portal via accessPortal/Portal e configuração em Browser.java.
    Captura de HAR/Network: se você já possui utilitário (ex.: Browser/DevTools/HarHelper), usar para extrair o request contendo seonFingerprintText.
    Validações em UI: preferir verifyPanel + ValidationType para checagens visuais.
    Banco de dados: usar DatabaseSteps/DatabaseUtil para queries:
        sql
        -- Fingerprint
        SELECT seon_fingerprint_text FROM uown_los_lead WHERE lead_pk = <LEAD_PK>;
        -- True Device ID em response JSON
        SELECT response FROM uown_fraud_engine_outbound WHERE lead_pk = <LEAD_PK> ORDER BY created_at DESC LIMIT 1;
API: se houver steps como ApiSteps para chamar endpoints internos e capturar últimas respostas, centralizar por lá a leitura do último response.
    Logs: mensagens sempre em inglês no código (System.out/Logger).
    Esperas: wait.until(...) para elementos das etapas do fluxo.
    Seletores: centralizar em Elements.java e priorizar id, depois xpath estável.
Cucumber (exemplos de steps comportamentais):
    Given Log in to origination
    When Start a new application with merchant “”
    And On sendApplication step I capture the network traffic
    Then The request payload should contain “seonFingerprintText”
    And The database “uown_los_lead.seon_fingerprint_text” should match the captured value
    And The table “uown_fraud_engine_outbound.response” should contain “true_device_id”
    And The SEON Email API v3 response should contain “network score”
    And For merchants without fraud enabled there should be no “true_device_id”

Checklist rápido:
Merchant com fraude habilitada separado do sem fraude.
Captura do request com seonFingerprintText confirmada.
Persistência de seon_fingerprint_text confirmada no DB.
True Device ID presente no response (com fraude habilitada).
Network score presente nas respostas das Digital Footprints (quando aplicável).
Regressão dos fluxos do SEON sem erros.
Caso negativo sem True Device ID.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
9854

QUando inicio o projeto pelo NewApplication, no console é retornado:

[SEON] getSession: success {len: 4601, ms: 1236}len: 4601ms: 1236[[Prototype]]: Objectconstructor: ƒ Object()hasOwnProperty: ƒ hasOwnProperty()isPrototypeOf: ƒ isPrototypeOf()propertyIsEnumerable: ƒ propertyIsEnumerable()toLocaleString: ƒ toLocaleString()toString: ƒ toString()valueOf: ƒ valueOf()__defineGetter__: ƒ __defineGetter__()__defineSetter__: ƒ __defineSetter__()__lookupGetter__: ƒ __lookupGetter__()__lookupSetter__: ƒ __lookupSetter__()__proto__: (...)get __proto__: ƒ __proto__()set __proto__: ƒ __proto__()
host-console-events.js:1 NID initialized...
[SEON] getSessionId:start
host-console-events.js:1 [SEON] customerStore.getSessionId status = 200

Perfeito. Esses logs indicam que o SDK Web do SEON está operacional e a sessão/fingerprint foi obtida com sucesso — é o pré‑requisito para o campo seonFingerprintText aparecer no envio da aplicação.

O que isso atende agora:
--> SDK inicializado e sessão ativa:
--> “[SEON] getSession: success {len: 4601, …}”
--> “NID initialized…”
--> “[SEON] getSessionId:start … status = 200”
--> Requisito coberto: “SEON SDK atualizado e funcional gerando fingerprint”.

-----

Request URL
https://origination-qa1.uownleasing.com/getSessionId
Request Method
GET
Status Code
200 OK
Remote Address
35.225.69.210:443
Referrer Policy
strict-origin-when-cross-origin

preview
"dcd70477-cd10-4b96-a885-39c4776f5e23"

response
{"sessionId":"dcd70477-cd10-4b96-a885-39c4776f5e23"}

--> Sessão do SDK obtida com sucesso no front (“sessionId” 200 OK).
--> Atende ao requisito “SDK atualizado e fluxo funcional” e prepara o envio do fingerprint.

-----

Request URL
https://7afa2ed6a8ac692293032b989292deba.seondnsresolve.com/
Request Method
POST
Status Code
200 OK
Remote Address
52.17.59.51:443
Referrer Policy
strict-origin-when-cross-origin

preview
data
: 
""

response
{"data":""}


Request URL
https://eb6a7d55b667d9b6e52e2ebe363274d7b395eb78.seondnsresolve.com/
Request Method
GET
Status Code
200 OK
Remote Address
52.49.104.56:443
Referrer Policy
strict-origin-when-cross-origin

preview
"TLS;;qQ07B7gBn6wF43CU10gOIg==;M6+novZwnZYzcfwp5j0IYImLC2mzW3tzkXIT/W2iuHMNt/YfMUf9TzaG8TyjrhXfC6V6kVEzXHT5Sv5HeiKZlz/AqwcDOEMa46clHH3ZdMI+gd1kMcggqqq4ZbHLievv+e+u3veIIZBQfaFR6OJCc5XOFN0tKNFIaT3DJ0KBSEliJyXx2lCaG+cTD7FpvyzW2Zrx2HfunILfIHWqwHVW2I3x9bJSDyJEYWX92Eu3m2HS6UgyHlzggnI3GLUwsSfflnh8D/z/FH8VoCkSh4JMIbB68/Ssu9u15Gf4hIs9CazFWOgCIU+mII1C+ux7YyVq3kAmgdU6jvAwrZbG7cRR/bD/ulpmxT35Gwy6e4WuhejR/W7e7ITRRFFFEW1OQEm7EQ2pFITB+R8jVBkLCHP8iTmi0LG1LRWgBtA5NB0Xs8HGGxo6eNck0miPZcOwCpRqLz3EEWf0Q6H4JCPkiHHk3PBbGHkff0rlD7UcQWOR3u7V3+tLCDGXyI/+joLqHKGwmjjw1JpnIp2bfeauB3/TCLg1I0QEBVTmmWpeDgtohCmeKBVAqoweAunWTPegRxvxJPihdKjwJxrSO5FmmEP/rOsMBlGrpdzZeP8rbMhDC7mCr72rsjptQQz95qoLmOziBivMX9Xhqc1/Nig4oajPZLarv3wrjLzJK5x1xc2hNPsrKUSQIO3W7rp2cqAAGecVze5zkbKmWmWfVR+bL5Fpz9nnHawtzYdKREiJxNwqfrnVWt/746i6Q8XnSUjdgLkTdsqOsJcMaGRggrEaH1W6BDBzd4WaCbeU27MhWIUWgNM="

response
"TLS;;qQ07B7gBn6wF43CU10gOIg==;M6+novZwnZYzcfwp5j0IYImLC2mzW3tzkXIT/W2iuHMNt/YfMUf9TzaG8TyjrhXfC6V6kVEzXHT5Sv5HeiKZlz/AqwcDOEMa46clHH3ZdMI+gd1kMcggqqq4ZbHLievv+e+u3veIIZBQfaFR6OJCc5XOFN0tKNFIaT3DJ0KBSEliJyXx2lCaG+cTD7FpvyzW2Zrx2HfunILfIHWqwHVW2I3x9bJSDyJEYWX92Eu3m2HS6UgyHlzggnI3GLUwsSfflnh8D/z/FH8VoCkSh4JMIbB68/Ssu9u15Gf4hIs9CazFWOgCIU+mII1C+ux7YyVq3kAmgdU6jvAwrZbG7cRR/bD/ulpmxT35Gwy6e4WuhejR/W7e7ITRRFFFEW1OQEm7EQ2pFITB+R8jVBkLCHP8iTmi0LG1LRWgBtA5NB0Xs8HGGxo6eNck0miPZcOwCpRqLz3EEWf0Q6H4JCPkiHHk3PBbGHkff0rlD7UcQWOR3u7V3+tLCDGXyI/+joLqHKGwmjjw1JpnIp2bfeauB3/TCLg1I0QEBVTmmWpeDgtohCmeKBVAqoweAunWTPegRxvxJPihdKjwJxrSO5FmmEP/rOsMBlGrpdzZeP8rbMhDC7mCr72rsjptQQz95qoLmOziBivMX9Xhqc1/Nig4oajPZLarv3wrjLzJK5x1xc2hNPsrKUSQIO3W7rp2cqAAGecVze5zkbKmWmWfVR+bL5Fpz9nnHawtzYdKREiJxNwqfrnVWt/746i6Q8XnSUjdgLkTdsqOsJcMaGRggrEaH1W6BDBzd4WaCbeU27MhWIUWgNM="

--> Web SDK do SEON está ativo e coletando sinais de rede/dispositivo (parte do fingerprint). São evidências do pré-requisito para gerar e enviar o seonFingerprintText, mas não fecham sozinhas os critérios de payload, persistência ou novos campos.
--> SDK funcional e coleta de sinais:
--> POST/GET para domínios seondnsresolve.com com 200 OK indicam sondagens DNS/TLS do SDK.
--> Valida o requisito de “SDK SEON atualizado e fluxo funcional” no front.
--> Pré‑requisito para o seonFingerprintText:
--> Como o SDK está coletando dados, espera-se que o campo seonFingerprintText possa ser gerado para o envio (sendApplication).

-----

Request URL
https://origination-qa1.uownleasing.com/uown/los/createOrUpdateInvoiceInformation
Request Method
POST
Status Code
200 OK
Remote Address
35.225.69.210:443
Referrer Policy
strict-origin-when-cross-origin

payload{,…}
invoiceInfo
: 
{invoicePk: null, leadPk: 9854, accountPk: null, merchantPk: 566, merchantInvoiceNumber: "R98888",…}
accountPk
: 
null
category
: 
"TIRES"
deliveryFee
: 
10
depositAmount
: 
0
description
: 
""
discountAmount
: 
"50.00"
installationFee
: 
20
invoiceNumber
: 
""
invoicePk
: 
null
invoiceStatus
: 
"ADDED_TO_CART"
lastDeliveryDate
: 
""
leadPk
: 
9854
merchandiseAmount
: 
980
merchantInvoiceNumber
: 
"R98888"
merchantPk
: 
566
miscellaneousFee
: 
30
processingFee
: 
0
protectionPlanAmount
: 
0
salesPerson
: 
"Paul"
shippingSameAsConsumer
: 
true
taxAmount
: 
40
totalInvoiceAmount
: 
1030
totalNumberOfItems
: 
0
items
: 
[{pk: null, rowCreatedTimestamp: null, rowUpdatedTimestamp: null, tenantId: null, webUserId: null,…}]
0
: 
{pk: null, rowCreatedTimestamp: null, rowUpdatedTimestamp: null, tenantId: null, webUserId: null,…}
itemInfo
: 
{itemPk: null, leadPk: 9854, accountPk: null, merchantPk: 0, invoicePk: 0,…}
accountPk
: 
null
basePricePerItem
: 
980
category
: 
"TIRES"
deliveryType
: 
null
invoicePk
: 
0
itemCode
: 
"ASUS ProArt 27\" Portable Monitor"
itemDeliveryDate
: 
""
itemDeliveryFee
: 
0
itemDescription
: 
"ASUS ProArt 27\" Portable Monitor"
itemImageUrl
: 
null
itemPk
: 
null
itemsDeliveryFee
: 
0
leadPk
: 
9854
lineNumber
: 
""
merchantPk
: 
0
numberOfItems
: 
1
numberOfItemsDelivered
: 
0
serialNumber
: 
""
status
: 
"ADDED_TO_CART"
taxPerItem
: 
0
totalPriceForItems
: 
980
totalPricePerItem
: 
"980.00"
pk
: 
null
rowCreatedTimestamp
: 
null
rowUpdatedTimestamp
: 
null
tenantId
: 
null
webUserId
: 
null
merchantInfo
: 
{merchantPK: 566, clonedFrom: null, clonedFromName: "", refCompanyId: null, refLocationId: null,…}
acceptNewApps
: 
true
allowAutoDecision
: 
true
allowChangeToExpired
: 
false
allowCloseOnIframe
: 
false
allowLocationChangeForMerchantSiteUser
: 
false
allowRemoteSign
: 
true
allowedFrequencies
: 
"WEEKLY,BI_WEEKLY"
altContactEmail
: 
""
altContactFax
: 
""
altContactName
: 
""
altContactPhone
: 
""
apiKey
: 
"U0wn_tireAgent_G4eDIH"
approvalAmountIncrease
: 
0.3
autoDenyApplication
: 
false
bankAccountInfo
: 
{merchantPK: 566, name: "", city: "", state: "", bankTypeUsed: null, routingNumber: "324329881",…}
accountNumber
: 
"123"
bankTypeUsed
: 
null
city
: 
""
merchantPK
: 
566
name
: 
""
routingNumber
: 
"324329881"
state
: 
""
buyGroup
: 
null
buyGroupMember
: 
false
buyGroupName
: 
null
buyoutFee
: 
0
category
: 
null
ccProcessingFeePercent
: 
0
chargeProcessingFee
: 
true
chargeProcessingFeeBeforeEsign
: 
true
checkUwForVerification
: 
false
city
: 
"Tampa"
clientType
: 
"TIRE_AGENT"
clonedFrom
: 
null
clonedFromName
: 
""
comment
: 
null
country
: 
""
county
: 
""
dealerDiscountOverride
: 
0
dealerRebateOverride
: 
0.02
dealerRebateType
: 
"DAILY"
defaultLoanAmount
: 
1500
defaultMonthsAtEmployer
: 
6
deliveryReceiptId
: 
null
doNotAllowNewApps
: 
false
dteCorpTraining
: 
null
dteDealerAppRcvd
: 
null
dteDealerKitShip
: 
null
dteSetupInCRM
: 
null
esignClient
: 
"SIGNWELL"
esignMode
: 
"EMBEDDED"
excludeFromReports
: 
false
fax
: 
""
fedTaxId
: 
null
fiveDayFundingException
: 
null
fundingReportEmails
: 
"erin@uownleasing.com"
fundingReportFrequency
: 
"DAILY"
holdDeposit
: 
false
independentRepCode
: 
null
inventoryCategory
: 
"TIRES"
isAchRequired
: 
true
isActive
: 
true
isBankVerificationRequired
: 
false
isCcRequired
: 
true
isDeleted
: 
false
isFpdRequired
: 
false
isFraudCheckRequired
: 
true
isHidden
: 
false
isIntellicheckRequired
: 
false
isItemSplit
: 
false
isPlaidVerificationRequired
: 
false
isRedirectUrlBranded
: 
false
isSeonIdCheckRequired
: 
true
isSignedToFunding
: 
true
latitude
: 
null
legalName
: 
"Tire Agent"
lendingCategoryList
: 
"LTO"
locationAddress1
: 
"10500 University Center Drive"
locationAddress2
: 
null
locationName
: 
"Tire Agent"
longitude
: 
null
merchantName
: 
"Tire Agent"
merchantPK
: 
566
merchantSupport
: 
""
merchantType
: 
"ONLINE"
merchantUrl
: 
"https://www.tireagent.com"
mergedFundingReportEmails
: 
"erin@uownleasing.com"
mergedFundingReportFrequency
: 
"DAILY"
minimumLeaseAmount
: 
250
numDaysApprovalExp
: 
90
numDaysLeaseDocExp
: 
45
offPeakCampaignId
: 
150
offerInsurance
: 
true
ownerName
: 
null
ownershipType
: 
"OTHER"
peakCampaignId
: 
137
phoneNumber
: 
""
platFormFeeType
: 
"MONTHLY"
platformFee
: 
0
postMessage
: 
true
primaryContactEmail
: 
"erin@uownleasing.com"
primaryContactFax
: 
""
primaryContactName
: 
"Erin"
primaryContactPhone
: 
"8134630959"
priority
: 
0
recordSigningFlow
: 
false
refCompanyId
: 
null
refLocationId
: 
null
refMerchantCode
: 
"OW90218-0001"
removeMerchantFromUsers
: 
false
removeParentOrTopOnIframe
: 
false
returnLambdaScore
: 
false
runAddressVerification
: 
null
salesRepCode
: 
"2897"
scoringCompanyGroup
: 
null
sendAutomatedFundingReport
: 
false
sendFinalizeNotice
: 
false
sendMergedFundingReport
: 
null
showPayrollAndPrepaidCardOnApplication
: 
false
showReportMenuItemOnMerchantSite
: 
false
showWeeklyStatusReport
: 
false
state
: 
"FL"
storeTimings
: 
"Sunday: 9:00 AM - 9:00 AM\nMonday: 9:00 AM - 9:00 AM\nTuesday: 9:00 AM - 9:00 AM\nWednesday: 9:00 AM - 9:00 AM\nThursday: 9:00 AM - 9:00 AM\nFriday: 9:00 AM - 9:00 AM\nSaturday: 9:00 AM - 9:00 AM"
taxExemptedStates
: 
""
taxRate
: 
null
taxZone
: 
null
terminationReason
: 
""
twoDayFundingException
: 
null
useCustomerStateForLeaseAndSalesTax
: 
false
useLexisNexis
: 
false
useNeuroIdCheck
: 
false
useNeustar
: 
false
useSentilink
: 
false
useWebhook
: 
false
username
: 
"tireAgent"
validStates
: 
"AK,AL,AR,AS,AZ,CA,CO,CT,DE,DC,FL,GA,GU,HI,IA,IN,ID,IL,KS,KY,LA,MA,MN,MD,ME,MI,MN,MO,MP,MS,MT,NC,ND,NE,NH,NJ,NM,NV,NY,OH,OR,OK,PA,PR,RI,SC,SD,TN,TX,UM,UT,VA,VI,VT,WA,WI,WV,WY"
verifyEmail
: 
true
verifyIp
: 
true
verifyPhone
: 
true
verifyPhoneBeforeSigning
: 
false
webhookUrl
: 
""
zipCode
: 
"33612"

response
{
    "merchantInfo": {
        "merchantPK": 566,
        "clonedFrom": null,
        "clonedFromName": "",
        "refCompanyId": null,
        "refLocationId": null,
        "refMerchantCode": "OW90218-0001",
        "merchantName": "Tire Agent",
        "locationName": "Tire Agent",
        "legalName": "Tire Agent",
        "locationAddress1": "10500 University Center Drive",
        "locationAddress2": null,
        "city": "Tampa",
        "state": "FL",
        "zipCode": "33612",
        "country": "",
        "county": "",
        "phoneNumber": "",
        "fax": "",
        "merchantUrl": "https://www.tireagent.com",
        "postMessage": true,
        "category": null,
        "salesRepCode": "2897",
        "independentRepCode": null,
        "username": "tireAgent",
        "apiKey": "U0wn_tireAgent_G4eDIH",
        "peakCampaignId": 137,
        "offPeakCampaignId": 150,
        "clientType": "TIRE_AGENT",
        "inventoryCategory": "TIRES",
        "bankAccountInfo": {
            "merchantPK": 566,
            "name": "",
            "city": "",
            "state": "",
            "bankTypeUsed": null,
            "routingNumber": "324329881",
            "accountNumber": "123"
        },
        "primaryContactName": "Erin",
        "primaryContactPhone": "8134630959",
        "primaryContactFax": "",
        "primaryContactEmail": "erin@uownleasing.com",
        "altContactName": "",
        "altContactPhone": "",
        "altContactFax": "",
        "altContactEmail": "",
        "ownershipType": "OTHER",
        "ownerName": null,
        "numDaysApprovalExp": 90,
        "numDaysLeaseDocExp": 45,
        "taxZone": null,
        "taxRate": null,
        "deliveryReceiptId": null,
        "priority": 0,
        "dealerDiscountOverride": 0,
        "dealerRebateOverride": 0.02,
        "approvalAmountIncrease": 0.3,
        "ccProcessingFeePercent": 0,
        "latitude": null,
        "longitude": null,
        "scoringCompanyGroup": null,
        "fedTaxId": null,
        "dteDealerAppRcvd": null,
        "dteDealerKitShip": null,
        "dteSetupInCRM": null,
        "dteCorpTraining": null,
        "buyGroup": null,
        "buyGroupName": null,
        "buyGroupMember": false,
        "storeTimings": "Sunday: 9:00 AM - 9:00 AM\nMonday: 9:00 AM - 9:00 AM\nTuesday: 9:00 AM - 9:00 AM\nWednesday: 9:00 AM - 9:00 AM\nThursday: 9:00 AM - 9:00 AM\nFriday: 9:00 AM - 9:00 AM\nSaturday: 9:00 AM - 9:00 AM",
        "allowAutoDecision": true,
        "doNotAllowNewApps": false,
        "useCustomerStateForLeaseAndSalesTax": false,
        "allowLocationChangeForMerchantSiteUser": false,
        "showReportMenuItemOnMerchantSite": false,
        "showPayrollAndPrepaidCardOnApplication": false,
        "allowRemoteSign": true,
        "excludeFromReports": false,
        "showWeeklyStatusReport": false,
        "isHidden": false,
        "merchantType": "ONLINE",
        "esignMode": "EMBEDDED",
        "platformFee": 0,
        "buyoutFee": 0,
        "platFormFeeType": "MONTHLY",
        "dealerRebateType": "DAILY",
        "validStates": "AK,AL,AR,AS,AZ,CA,CO,CT,DE,DC,FL,GA,GU,HI,IA,IN,ID,IL,KS,KY,LA,MA,MN,MD,ME,MI,MN,MO,MP,MS,MT,NC,ND,NE,NH,NJ,NM,NV,NY,OH,OR,OK,PA,PR,RI,SC,SD,TN,TX,UM,UT,VA,VI,VT,WA,WI,WV,WY",
        "defaultLoanAmount": 1500,
        "minimumLeaseAmount": 250,
        "defaultMonthsAtEmployer": 6,
        "isRedirectUrlBranded": false,
        "chargeProcessingFeeBeforeEsign": true,
        "chargeProcessingFee": true,
        "holdDeposit": false,
        "isIntellicheckRequired": false,
        "allowedFrequencies": "WEEKLY,BI_WEEKLY",
        "removeParentOrTopOnIframe": false,
        "allowCloseOnIframe": false,
        "isActive": true,
        "comment": null,
        "allowChangeToExpired": false,
        "checkUwForVerification": false,
        "esignClient": "SIGNWELL",
        "isCcRequired": true,
        "isAchRequired": true,
        "isFpdRequired": false,
        "isSignedToFunding": true,
        "runAddressVerification": null,
        "isFraudCheckRequired": true,
        "verifyEmail": true,
        "verifyPhone": true,
        "verifyIp": true,
        "useWebhook": false,
        "sendFinalizeNotice": false,
        "verifyPhoneBeforeSigning": false,
        "isBankVerificationRequired": false,
        "isPlaidVerificationRequired": false,
        "autoDenyApplication": false,
        "acceptNewApps": true,
        "taxExemptedStates": "",
        "lendingCategoryList": "LTO",
        "sendAutomatedFundingReport": false,
        "fundingReportFrequency": "DAILY",
        "fundingReportEmails": "erin@uownleasing.com",
        "webhookUrl": "",
        "isItemSplit": false,
        "useSentilink": false,
        "useNeustar": false,
        "useLexisNexis": false,
        "recordSigningFlow": false,
        "returnLambdaScore": false,
        "isDeleted": false,
        "removeMerchantFromUsers": false,
        "merchantSupport": "",
        "useNeuroIdCheck": false,
        "twoDayFundingException": null,
        "fiveDayFundingException": null,
        "sendMergedFundingReport": null,
        "mergedFundingReportEmails": "erin@uownleasing.com",
        "mergedFundingReportFrequency": "DAILY",
        "offerInsurance": true,
        "terminationReason": "",
        "isSeonIdCheckRequired": true
    },
    "invoiceInfo": {
        "invoicePk": 8955,
        "leadPk": 9854,
        "accountPk": 0,
        "merchantPk": 566,
        "salesPerson": "Paul",
        "merchantInvoiceNumber": "R98888",
        "invoiceNumber": "R98888",
        "description": "",
        "category": "TIRES",
        "totalInvoiceAmount": 1030,
        "merchandiseAmount": 980,
        "taxAmount": 40,
        "merchantProtectionPlan": 0,
        "deliveryFee": 10,
        "installationFee": 20,
        "miscellaneousFee": 30,
        "depositAmount": 0,
        "discountAmount": 50,
        "lastDeliveryDate": null,
        "invoiceStatus": "ADDED_TO_CART",
        "shippingSameAsConsumer": true,
        "totalNumberOfItems": 1,
        "orderId": null,
        "purchaseTotal": 0,
        "externalReferenceId": null
    },
    "items": [
        {
            "pk": 0,
            "rowCreatedTimestamp": null,
            "rowUpdatedTimestamp": null,
            "tenantId": null,
            "webUserId": null,
            "agent": null,
            "itemInfo": {
                "itemPk": 0,
                "leadPk": 9854,
                "accountPk": 0,
                "merchantPk": 0,
                "invoicePk": 8955,
                "itemId": null,
                "itemCode": "ASUS ProArt 27\" Portable Monitor",
                "lineNumber": "",
                "serialNumber": "",
                "itemDescription": "ASUS ProArt 27\" Portable Monitor",
                "category": "TIRES",
                "numberOfItems": 1,
                "numberOfItemsDelivered": 0,
                "itemImageUrl": null,
                "basePricePerItem": 980,
                "taxPerItem": 0,
                "totalPricePerItem": 980,
                "totalPriceForItems": 980,
                "status": "ADDED_TO_CART",
                "itemDeliveryDate": null,
                "deliveryType": null,
                "itemDeliveryFee": 0,
                "itemsDeliveryFee": 0,
                "invoiceType": "LEASE",
                "lockStatus": null
            }
        }
    ],
    "itemsForAccount": [],
    "selectedPaymentFrequency": null,
    "itemInfoList": [
        {
            "itemPk": 0,
            "leadPk": 9854,
            "accountPk": 0,
            "merchantPk": 0,
            "invoicePk": 8955,
            "itemId": null,
            "itemCode": "ASUS ProArt 27\" Portable Monitor",
            "lineNumber": "",
            "serialNumber": "",
            "itemDescription": "ASUS ProArt 27\" Portable Monitor",
            "category": "TIRES",
            "numberOfItems": 1,
            "numberOfItemsDelivered": 0,
            "itemImageUrl": null,
            "basePricePerItem": 980,
            "taxPerItem": 0,
            "totalPricePerItem": 980,
            "totalPriceForItems": 980,
            "status": "ADDED_TO_CART",
            "itemDeliveryDate": null,
            "deliveryType": null,
            "itemDeliveryFee": 0,
            "itemsDeliveryFee": 0,
            "invoiceType": "LEASE",
            "lockStatus": null
        }
    ],
    "lead": {
        "pk": 9854,
        "rowCreatedTimestamp": "2025-09-21T08:24:54.384164",
        "rowUpdatedTimestamp": "2025-09-21T09:05:47.973034532",
        "tenantId": null,
        "webUserId": null,
        "agent": null,
        "leadInfo": {
            "leadPk": 9854,
            "refLeadPk": null,
            "accountPk": null,
            "taxForZipPk": null,
            "addressVerificationPk": null,
            "fraudVerificationPk": 1230,
            "sentilinkPk": null,
            "neustarPk": null,
            "lexisNexisPk": null,
            "uuid": "90433286-541c-4dae-812a-d7cb434dd167",
            "id": "8582737149962440704",
            "refAppId": null,
            "merchantPk": 566,
            "merchantProgramPk": 12,
            "refRtoContractId": null,
            "refRtoAccountNumber": null,
            "leadStatus": "UW_APPROVED",
            "importDateTime": "2025-09-21T08:24:54.382517",
            "fundRequestDateTime": null,
            "fundDateTime": null,
            "welcomeCallTimestamp": null,
            "company": "UOWN",
            "productType": "LEASE",
            "expirationDate": "2025-12-20",
            "pastBankruptcy": null,
            "currentOrFutureBankruptcy": false,
            "okToTextApproval": null,
            "okToEmailApproval": null,
            "prepaidCardNumber": null,
            "prepaidCardExpiry": null,
            "prepaidCardCvv": null,
            "customerState": "CA",
            "notes": null,
            "autoPayTypes": [
                "NONE"
            ],
            "ccAutoPay": false,
            "achAutoPay": false,
            "fundingStatus": "NOT_READY_TO_FUND",
            "merchantRedirectUrl": null,
            "sentToServicing": false,
            "ssnAlreadyExists": false,
            "rerunUnderwriting": false,
            "showAlerts": true,
            "ipAddress": "35.208.32.235",
            "requestedLoanAmount": 0,
            "iovationFingerprintText": "",
            "seonFingerprintText": "W;6.9.0;Y9Imc4U1Itgb7IxVdDuDCA==;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",
            "storisCustomerCode": null,
            "sendApplicationToEmail": "DaleFStone@dayrep.com",
            "sendApplicationToPhone": "2226464711",
            "sendApplicationSmsToken": "SMOkjYe20FJNKbF3Dtpdgp0rg==",
            "sendApplicationByUser": "jmendes.gow",
            "finalizeApplicationSmsToken": null,
            "finalizeApplicationSentTime": null,
            "refundAmount": 0,
            "approvalAmount": 2500,
            "deviceType": "Other",
            "browserType": "Chrome",
            "operatingSystem": "Windows",
            "maxApprovalAmount": 3250,
            "equalOrAboveThreshold": false,
            "isScoreAvailable": false,
            "lendingCategoryType": "LTO",
            "isEligibleForReapproval": true,
            "internalStatus": "INVOICE_CREATED",
            "externalReferenceId": null,
            "addedSecondLease": false,
            "source": null,
            "traffic": null,
            "category": null,
            "createdFrom": "PORTAL",
            "ccPeekConsent": true,
            "consentDate": null,
            "cancelled": true
        },
        "signedOrBeyond": false,
        "fundingorBeyond": false,
        "settlementRequested": false
    },
    "providerURL": null,
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination-qa1.uownleasing.com/completeApplication?uuid=90433286-541c-4dae-812a-d7cb434dd167_8582737149962440704&selectedPaymentFrequency=WEEKLY&isBranded=false",
            "totalContractAmountWithTax": 2461.15,
            "totalContractAmountNoTax": 2227.31,
            "regularPaymentWithTax": 43.95,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 43.95,
            "firstPaymentWithFeesNoTax": 39.77,
            "firstPaymentDate": "2025-09-27",
            "paymentDueToday": 0
        },
        {
            "redirectUrl": "https://origination-qa1.uownleasing.com/completeApplication?uuid=90433286-541c-4dae-812a-d7cb434dd167_8582737149962440704&selectedPaymentFrequency=BI_WEEKLY&isBranded=false",
            "totalContractAmountWithTax": 2461.15,
            "totalContractAmountNoTax": 2227.27,
            "regularPaymentWithTax": 87.9,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentWithFeesAndTax": 87.9,
            "firstPaymentWithFeesNoTax": 79.55,
            "firstPaymentDate": "2025-09-27",
            "paymentDueToday": 0
        }
    ],
    "fundingBankData": null,
    "error": null,
    "apiCall": false,
    "refundPaymentsOnCancel": false,
    "comment": ""
}

SDK SEON ativo e versão adequada
    Evidência: lead.leadInfo.seonFingerprintText começa com W;6.9.0;... → Web SDK v6.9.0 em uso (>= 6.5.0, onde o True Device ID passou a ser suportado).
Fingerprint capturado e propagado para o backend
    Evidência: lead.leadInfo.seonFingerprintText presente e populado na resposta do backend após criar/atualizar o invoice.
    Relaciona-se ao requisito “o payload inclui seonFingerprintText” e mostra que o valor está trafegando no servidor.    
Pré‑requisitos habilitados para True Device ID e Network Score
Evidências em merchantInfo:
isFraudCheckRequired: true e isSeonIdCheckRequired: true → pré‑requisito para receber true_device_id via Fraud API.
    verifyEmail: true e verifyPhone: true → pré‑requisito para acionar Email API v3/Phone API v2 e obter “Network Score”.
    verifyIp: true → sinais de rede habilitados (complementar).

-----

consulta ao banco
SELECT seon_fingerprint_text, *
FROM uown_los_lead
WHERE pk = 9854
;

retorno
W;6.9.0;Y9Imc4U1Itgb7IxVdDuDCA==;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	9854		2025-09-21 08:24:54.384	2025-09-21 09:05:47.973				false	Chrome	false	UOWN	false	CA	Other	2025-12-20					NOT_READY_TO_FUND	8582737149962440704	2025-09-21 08:24:54.382		35.208.32.235	UW_APPROVED	566	12					Windows					LEASE					0.00	0.00	false	jmendes.gow	SMOkjYe20FJNKbF3Dtpdgp0rg==	DaleFStone@dayrep.com	2226464711	false	true	false			90433286-541c-4dae-812a-d7cb434dd167		W;6.9.0;Y9Imc4U1Itgb7IxVdDuDCA==;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	1230		3250.00	false	LTO	true	NONE	INVOICE_CREATED		false	false		PORTAL						true	

Seon fingerprint persistido no lead:
    O campo uown_los_lead.seon_fingerprint_text está preenchido com um valor que começa por W;6.9.0;....
    Isso atende ao requisito: “uown_los_lead.seon_fingerprint_text é armazenado com o mesmo valor de sessão”.
Evidência de SDK atualizado:
    O prefixo W;6.9.0; indica Web SDK SEON v6.9.0 (≥ 6.5.0), alinhado ao requisito de usar versão mais recente/compatível.
-----

 O valor persistido no banco é exatamente o mesmo do payload:
--> DB (uown_los_lead.seon_fingerprint_text, pk=9854): começa com W;6.9.0;Y9Imc4U1… e todo o blob é idêntico
--> Resposta do backend (createOrUpdateInvoiceInformation → lead.leadInfo.seonFingerprintText): mesmo valor W;6.9.0;Y9Imc4U1… idêntico
--> Isso atende plenamente ao requisito:
--> “uown_los_lead.seon_fingerprint_text é armazenado com o mesmo valor de sessão (seonFingerprintText)”.

-----

select * from uown_fraud_engine_outbound order by pk desc;
1272		2025-09-21 09:03:24.111	2025-09-21 09:03:30.170				POST	[Content-Type:"application/json", X-API-KEY:"c43b79be-36eb-4475-95a5-672e97dde5a6"]	{"config":{"ip":{"include":null,"timeout":5000,"version":"v1"},"email":{"include":null,"timeout":5000,"version":"v3"},"phone":{"include":null,"timeout":5000,"version":"v2"},"ip_api":true,"email_api":true,"phone_api":true,"device_fingerprinting":true,"ignore_velocity_rules":null,"response_fields":null},"ip":"35.208.32.235","email":"IreneJPeters@armyspy.com","session":"W;6.9.0;Y9Imc4U1Itgb7IxVdDuDCA==;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","regulation":null,"items":null,"gift":null,"action_type":null,"transaction_id":"9854","affiliate_id":null,"affiliate_name":null,"order_memo":null,"email_domain":null,"password_hash":null,"user_fullname":"Irene Peters","user_name":null,"user_id":null,"user_dob":"1979-01-02","user_category":null,"user_account_status":null,"user_created":null,"user_country":null,"user_city":"Palo Alto","user_region":null,"user_zip":"91723","user_street":"2674 Barnes Avenue","user_street2":null,"device_id":null,"payment_mode":null,"card_fullname":null,"card_bin":null,"card_hash":null,"card_last":null,"card_expire":null,"avs_result":null,"cvv_result":null,"receiver_fullname":null,"receiver_bank_account":null,"sca_method":null,"user_bank_account":null,"user_bank_name":null,"user_balance":null,"user_verification_level":null,"status_3d":null,"payment_provider":null,"phone_number":14078704557,"transaction_type":null,"transaction_amount":null,"transaction_currency":null,"brand_id":"UOWN","shipping_country":null,"shipping_city":null,"shipping_region":null,"shipping_zip":null,"shipping_street":null,"shipping_street2":null,"shipping_phone":null,"shipping_fullname":null,"shipping_method":null,"billing_country":null,"billing_city":null,"billing_region":null,"billing_zip":null,"billing_street":null,"billing_street2":null,"billing_phone":null,"discount_code":null,"bonus_campaign_id":null,"gift_message":null,"merchant_id":"OW90218","merchant_created_at":null,"merchant_country":null,"merchant_category":null,"details_url":null,"custom_fields":{"merchant_ref_code":"OW90218-0001"}}		<200,{"success":true,"error":{},"data":{"id":"9854","state":"DECLINE","fraud_score":100.0,"bin_details":null,"version":"v2","applied_rules":[{"id":"E121","name":"Email is not deliverable","operation":"+","score":8.0},{"id":"E100","name":"Domain is disposable","operation":"+","score":80.0},{"id":"P107","name":"IP address was found on 1 spam blacklist","operation":"+","score":0.0},{"id":"P106","name":"Customer is using a datacenter ISP","operation":"+","score":10.0},{"id":"HC101","name":"There are more than 2 different IP addresses detected using WebRTC","operation":"+","score":2.0},{"id":"HC100","name":"Timezone based on IP geolocation and user's device does not match","operation":"+","score":2.0}],"device_details":{"device_location":{"accuracy":null,"latitude":null,"longitude":null,"status":null,"zip":null,"city":null,"region":null,"country_code":null},"adblock":false,"audio_hash":"124.04347527516074","battery":{"battery_charging":true,"battery_level":95},"browser_hash":"d927e3c9422ccb87a484911e239bd72b","browser_version_age":0,"browser_version":"140.0.0.0","browser":"CHROME","canvas_hash":"49e680e68f6524a601b6e28045ee3d67","cookie_enabled":true,"cookie_hash":"b302673d280ccbbc79aae70e8f80ea9f","device_hash":"8db0253aa79687708801f53b90b6ac16","device_ip":"35.208.32.235","device_ip_country":"US","device_ip_isp":"Google LLC","device_ip_region":"US-IA","device_memory":8,"device_type":"desktop","do_not_track":null,"dns_ip":"74.125.113.151","dns_ip_country":"US","dns_ip_isp":"Google LLC","dns_ip_region":"US-IA","drm_key_systems":["org.w3.clearkey"],"extensions":[],"flash_enabled":false,"font_count":16,"font_hash":"5b1b31aa109b548691c449e8c934d6a5","font_list":["monospace","sans-serif","serif","Calibri","Cambria Math","Consolas","Franklin Gothic","Liberation Mono","Lucida Console","MS Serif","MS UI Gothic","Marlett","Roboto","Segoe UI","Segoe UI Light","Tahoma"],"font_noise":false,"hardware_concurrency":12,"has_focus":true,"java_enabled":false,"keyboard_layout_hash":"21986c473d29526fa87e6c667c300af2","keyboard_layout_name":"Brazilian Portugese","languages":["en-US"],"locale":"en-US","math_hash":"a931b6543effb809b4abb1ecb36431db","max_touch_points":0,"media_devices":{"audio_input_count":1,"audio_output_count":1,"video_input_count":1},"mime_types_hash":"12ce62938a9f2e8b926a65dfc687824d","mobile_details":{"announced":null,"models":[],"resolution":null,"avg_price_in_eur":null,"battery_size_in_mah":null,"device_name":null},"mouse_moved":false,"os":"Windows 11","permissions":{"denied":[],"granted":["accelerometer","background-fetch","background-sync","gyroscope","magnetometer","screen-wake-lock"],"prompt":["camera","display-capture","geolocation","microphone","midi","notifications","persistent-storage"]},"platform":"Win32","plugins":{"plugin_count":5,"plugin_hash":"a61464d4341e30d7773ad797e19ea630","plugin_list":["PDF Viewer","Chrome PDF Viewer","Chromium PDF Viewer","Microsoft Edge PDF Viewer","WebKit built-in PDF"]},"price_range":"medium","proxy":false,"referrer":"","screen_data":{"device_pixel_ratio":1.0,"document_height":945,"document_width":1291,"is_extended":true,"orientation_angle":0,"orientation_type":"landscape-primary","screen_available_height":1032,"screen_available_width":1920,"screen_color_depth":24,"screen_height":1080,"screen_pixel_depth":24,"screen_width":1920,"window_inner_height":945,"window_inner_width":1291,"window_outer_height":1032,"window_outer_width":1920,"window_screen_x":0,"window_screen_y":0,"window_scroll_x":0,"window_scroll_y":0},"session_id":"914e201cab045ee640418fe2692066b5","source":"js-6.9.0","spoofing_hash":"7c96c0ab3ed18e5e0b9da204a6322e81","suspicious_flags":[],"system_colors_hash":"32a082df51a78c4a38f81fd30145a026","timezone_country":"BR","timezone_offset":"-03:00","timezone":"America/Sao_Paulo","touch_support":false,"type":"web","unpopular_device_resolution":false,"unpopular_user_agent":false,"user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36","user_agent_data":{"architecture":"x86","bitness":"64","mobile":false,"model":"","platform_version":"19.0.0","platform":"Windows","ua_full_version":"140.0.7339.129"},"vpn":false,"webgl":{"webgl2_image_hash":"ba6faa254e58a06a3de7ed87b7f1f4e5","webgl2_parameters_hash":"85be56111eca00f47d685e49539ebf43","webgl2_parameters_noise":false,"webgl_hash":"2baf206b765eabcf604149787e97f0e3","webgl_image_hash":"ba6faa254e58a06a3de7ed87b7f1f4e5","webgl_parameters_hash":"3241a6446815439deed0cacc5a2d81b1","webgl_parameters_noise":false,"webgl_renderer":"ANGLE (NVIDIA, NVIDIA GeForce RTX 2050 (0x000025ED) Direct3D11 vs_5_0 ps_5_0, D3D11)","webgl_vendor":"Google Inc. (NVIDIA)"},"webrtc_activated":true,"webrtc_count":3,"webrtc_ips":["2804:1530:435:7e00:8d4d:4f80:afee:975c","35.208.32.235","10.8.0.5"],"window_location":"https://origination-qa1.uownleasing.com/sendApplication","true_device_id":"01996c5f-3d2f-71a5-a123-8114cb10db28","private":true},"calculation_time":4812,"seon_id":2019645,"ip_details":{"ip":"35.208.32.235","country":"US","state_prov":"Iowa","city":"Council Bluffs","timezone_offset":"-05:00","isp_name":"Google LLC","latitude":41.26194,"longitude":-95.86083,"type":"DCH","open_ports":[],"tor":false,"harmful":false,"vpn":false,"provider_name":null,"web_proxy":false,"public_proxy":false,"spam_urls":["zen.spamhaus.org"],"score":10.0,"applied_rules":null,"spam_number":1},"email_details":{"id":"ce7f9d61-89ab-459e-ae98-657ab90e42e5","email":"irenejpeters@armyspy.com","risk_scores":{"global_network_score":26.79},"email_details":{"deliverable":false,"full_inbox":null,"valid_format":true,"minimum_age_months":null,"earliest_profile_date":null,"email_randomness_score":2.53},"email_domain_details":{"accept_all":false,"created":"2013-01-24 03:18:24","custom":false,"disposable":true,"dmarc_enforced":true,"domain":"armyspy.com","expires":"2026-01-24 03:18:24","free":false,"registered":true,"registered_to":"DATA REDACTED","registrar_name":"Cloudflare, Inc.","spf_strict":true,"suspicious_tld":false,"tld":".com","updated":"2024-12-25 04:01:12","valid_mx":true,"website_exists":true},"account_aggregates":{"total_registration":0,"business":{"total_registration":0,"technology":{"registered":0,"checked":25},"science_and_education":{"registered":0,"checked":8},"jobs_and_employment":{"registered":0,"checked":5},"money_transfer_remittance":{"registered":0,"checked":5}},"personal":{"total_registration":0,"email_service":{"registered":0,"checked":6},"technology":{"registered":0,"checked":7},"adult_sites":{"registered":0,"checked":6},"delivery":{"registered":0,"checked":5},"ecommerce":{"registered":0,"checked":20},"entertainment":{"registered":0,"checked":31},"health_and_fitness":{"registered":0,"checked":5},"social_media":{"registered":0,"checked":23},"travel":{"registered":0,"checked":6}}},"seon_fraud_history":{"fraudulent_decline_first_seen":null,"fraudulent_decline_last_seen":null,"fraudulent_decline_customer_hits":0,"fraudulent_decline_hits":0,"first_seen":null,"last_seen":null,"customer_hits":0,"hits":0,"flags":[]},"breach_details":{"breaches":[],"first_breach":null,"haveibeenpwned_listed":false,"number_of_breaches":0},"associated_domain_registrations":{"exists":false,"number_of_domains":0,"domains":[],"first_registration_date":null}},"phone_details":{"id":"49eb84b3-7a74-4707-bc5d-569a179a81c1","phone":14078704557,"risk_scores":{"global_network_score":25.17},"account_aggregates":{"total_registration":0,"business":{"total_registration":0,"technology":{"registered":0,"checked":0},"science_and_education":{"registered":0,"checked":0},"jobs_and_employment":{"registered":0,"checked":0},"money_transfer_remittance":{"registered":0,"checked":5}},"personal":{"total_registration":0,"email_service":{"registered":0,"checked":0},"technology":{"registered":0,"checked":1},"delivery":{"registered":0,"checked":3},"ecommerce":{"registered":0,"checked":8},"entertainment":{"registered":0,"checked":3},"social_media":{"registered":0,"checked":7},"travel":{"registered":0,"checked":2},"messenger":{"registered":0,"checked":2}}},"seon_fraud_history":{"fraudulent_decline_first_seen":null,"fraudulent_decline_last_seen":null,"fraudulent_decline_customer_hits":0,"fraudulent_decline_hits":0,"first_seen":null,"last_seen":null,"customer_hits":0,"hits":0,"flags":[]},"provider_carrier_details":{"carrier":"CENTURYLINK OF FLORIDA, INC. (UNITED)","country":"US","disposable":false,"phone_is_valid":true,"type":"FIXED_LINE"}}}},[Content-Type:"application/json", Content-Length:"8450", Connection:"keep-alive", Date:"Sun, 21 Sep 2025 13:03:30 GMT", X-Amzn-Trace-Id:"Root=1-68cff79c-62bbee4f141873b9752ee0fb;Parent=6f89856d511d36d6;Sampled=0;Lineage=1:745abbb6:0", x-amzn-RequestId:"faa82895-2d50-4d54-affd-e3ea97f79369", x-amz-apigw-id:"RQOgjG0vDoEENqg=", X-Cache:"Miss from cloudfront", Via:"1.1 c703222165a12466687c41efdc6804e2.cloudfront.net (CloudFront)", X-Amz-Cf-Pop:"DFW59-P6", X-Amz-Cf-Id:"uMX2tiwb_bpMn6wpK_fckF9hxEEXC4sf1VA_bw2JM-glH0Zf4QYtXA=="]>	SYSTEM		https://api.seon.io/SeonRestService/fraud-api/v2	1230
request:
{"config":{"ip":{"include":null,"timeout":5000,"version":"v1"},"email":{"include":null,"timeout":5000,"version":"v3"},"phone":{"include":null,"timeout":5000,"version":"v2"},"ip_api":true,"email_api":true,"phone_api":true,"device_fingerprinting":true,"ignore_velocity_rules":null,"response_fields":null},"ip":"35.208.32.235","email":"IreneJPeters@armyspy.com","session":"W;6.9.0;Y9Imc4U1Itgb7IxVdDuDCA==;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","regulation":null,"items":null,"gift":null,"action_type":null,"transaction_id":"9854","affiliate_id":null,"affiliate_name":null,"order_memo":null,"email_domain":null,"password_hash":null,"user_fullname":"Irene Peters","user_name":null,"user_id":null,"user_dob":"1979-01-02","user_category":null,"user_account_status":null,"user_created":null,"user_country":null,"user_city":"Palo Alto","user_region":null,"user_zip":"91723","user_street":"2674 Barnes Avenue","user_street2":null,"device_id":null,"payment_mode":null,"card_fullname":null,"card_bin":null,"card_hash":null,"card_last":null,"card_expire":null,"avs_result":null,"cvv_result":null,"receiver_fullname":null,"receiver_bank_account":null,"sca_method":null,"user_bank_account":null,"user_bank_name":null,"user_balance":null,"user_verification_level":null,"status_3d":null,"payment_provider":null,"phone_number":14078704557,"transaction_type":null,"transaction_amount":null,"transaction_currency":null,"brand_id":"UOWN","shipping_country":null,"shipping_city":null,"shipping_region":null,"shipping_zip":null,"shipping_street":null,"shipping_street2":null,"shipping_phone":null,"shipping_fullname":null,"shipping_method":null,"billing_country":null,"billing_city":null,"billing_region":null,"billing_zip":null,"billing_street":null,"billing_street2":null,"billing_phone":null,"discount_code":null,"bonus_campaign_id":null,"gift_message":null,"merchant_id":"OW90218","merchant_created_at":null,"merchant_country":null,"merchant_category":null,"details_url":null,"custom_fields":{"merchant_ref_code":"OW90218-0001"}}
response:
<200,{"success":true,"error":{},"data":{"id":"9854","state":"DECLINE","fraud_score":100.0,"bin_details":null,"version":"v2","applied_rules":[{"id":"E121","name":"Email is not deliverable","operation":"+","score":8.0},{"id":"E100","name":"Domain is disposable","operation":"+","score":80.0},{"id":"P107","name":"IP address was found on 1 spam blacklist","operation":"+","score":0.0},{"id":"P106","name":"Customer is using a datacenter ISP","operation":"+","score":10.0},{"id":"HC101","name":"There are more than 2 different IP addresses detected using WebRTC","operation":"+","score":2.0},{"id":"HC100","name":"Timezone based on IP geolocation and user's device does not match","operation":"+","score":2.0}],"device_details":{"device_location":{"accuracy":null,"latitude":null,"longitude":null,"status":null,"zip":null,"city":null,"region":null,"country_code":null},"adblock":false,"audio_hash":"124.04347527516074","battery":{"battery_charging":true,"battery_level":95},"browser_hash":"d927e3c9422ccb87a484911e239bd72b","browser_version_age":0,"browser_version":"140.0.0.0","browser":"CHROME","canvas_hash":"49e680e68f6524a601b6e28045ee3d67","cookie_enabled":true,"cookie_hash":"b302673d280ccbbc79aae70e8f80ea9f","device_hash":"8db0253aa79687708801f53b90b6ac16","device_ip":"35.208.32.235","device_ip_country":"US","device_ip_isp":"Google LLC","device_ip_region":"US-IA","device_memory":8,"device_type":"desktop","do_not_track":null,"dns_ip":"74.125.113.151","dns_ip_country":"US","dns_ip_isp":"Google LLC","dns_ip_region":"US-IA","drm_key_systems":["org.w3.clearkey"],"extensions":[],"flash_enabled":false,"font_count":16,"font_hash":"5b1b31aa109b548691c449e8c934d6a5","font_list":["monospace","sans-serif","serif","Calibri","Cambria Math","Consolas","Franklin Gothic","Liberation Mono","Lucida Console","MS Serif","MS UI Gothic","Marlett","Roboto","Segoe UI","Segoe UI Light","Tahoma"],"font_noise":false,"hardware_concurrency":12,"has_focus":true,"java_enabled":false,"keyboard_layout_hash":"21986c473d29526fa87e6c667c300af2","keyboard_layout_name":"Brazilian Portugese","languages":["en-US"],"locale":"en-US","math_hash":"a931b6543effb809b4abb1ecb36431db","max_touch_points":0,"media_devices":{"audio_input_count":1,"audio_output_count":1,"video_input_count":1},"mime_types_hash":"12ce62938a9f2e8b926a65dfc687824d","mobile_details":{"announced":null,"models":[],"resolution":null,"avg_price_in_eur":null,"battery_size_in_mah":null,"device_name":null},"mouse_moved":false,"os":"Windows 11","permissions":{"denied":[],"granted":["accelerometer","background-fetch","background-sync","gyroscope","magnetometer","screen-wake-lock"],"prompt":["camera","display-capture","geolocation","microphone","midi","notifications","persistent-storage"]},"platform":"Win32","plugins":{"plugin_count":5,"plugin_hash":"a61464d4341e30d7773ad797e19ea630","plugin_list":["PDF Viewer","Chrome PDF Viewer","Chromium PDF Viewer","Microsoft Edge PDF Viewer","WebKit built-in PDF"]},"price_range":"medium","proxy":false,"referrer":"","screen_data":{"device_pixel_ratio":1.0,"document_height":945,"document_width":1291,"is_extended":true,"orientation_angle":0,"orientation_type":"landscape-primary","screen_available_height":1032,"screen_available_width":1920,"screen_color_depth":24,"screen_height":1080,"screen_pixel_depth":24,"screen_width":1920,"window_inner_height":945,"window_inner_width":1291,"window_outer_height":1032,"window_outer_width":1920,"window_screen_x":0,"window_screen_y":0,"window_scroll_x":0,"window_scroll_y":0},"session_id":"914e201cab045ee640418fe2692066b5","source":"js-6.9.0","spoofing_hash":"7c96c0ab3ed18e5e0b9da204a6322e81","suspicious_flags":[],"system_colors_hash":"32a082df51a78c4a38f81fd30145a026","timezone_country":"BR","timezone_offset":"-03:00","timezone":"America/Sao_Paulo","touch_support":false,"type":"web","unpopular_device_resolution":false,"unpopular_user_agent":false,"user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36","user_agent_data":{"architecture":"x86","bitness":"64","mobile":false,"model":"","platform_version":"19.0.0","platform":"Windows","ua_full_version":"140.0.7339.129"},"vpn":false,"webgl":{"webgl2_image_hash":"ba6faa254e58a06a3de7ed87b7f1f4e5","webgl2_parameters_hash":"85be56111eca00f47d685e49539ebf43","webgl2_parameters_noise":false,"webgl_hash":"2baf206b765eabcf604149787e97f0e3","webgl_image_hash":"ba6faa254e58a06a3de7ed87b7f1f4e5","webgl_parameters_hash":"3241a6446815439deed0cacc5a2d81b1","webgl_parameters_noise":false,"webgl_renderer":"ANGLE (NVIDIA, NVIDIA GeForce RTX 2050 (0x000025ED) Direct3D11 vs_5_0 ps_5_0, D3D11)","webgl_vendor":"Google Inc. (NVIDIA)"},"webrtc_activated":true,"webrtc_count":3,"webrtc_ips":["2804:1530:435:7e00:8d4d:4f80:afee:975c","35.208.32.235","10.8.0.5"],"window_location":"https://origination-qa1.uownleasing.com/sendApplication","true_device_id":"01996c5f-3d2f-71a5-a123-8114cb10db28","private":true},"calculation_time":4812,"seon_id":2019645,"ip_details":{"ip":"35.208.32.235","country":"US","state_prov":"Iowa","city":"Council Bluffs","timezone_offset":"-05:00","isp_name":"Google LLC","latitude":41.26194,"longitude":-95.86083,"type":"DCH","open_ports":[],"tor":false,"harmful":false,"vpn":false,"provider_name":null,"web_proxy":false,"public_proxy":false,"spam_urls":["zen.spamhaus.org"],"score":10.0,"applied_rules":null,"spam_number":1},"email_details":{"id":"ce7f9d61-89ab-459e-ae98-657ab90e42e5","email":"irenejpeters@armyspy.com","risk_scores":{"global_network_score":26.79},"email_details":{"deliverable":false,"full_inbox":null,"valid_format":true,"minimum_age_months":null,"earliest_profile_date":null,"email_randomness_score":2.53},"email_domain_details":{"accept_all":false,"created":"2013-01-24 03:18:24","custom":false,"disposable":true,"dmarc_enforced":true,"domain":"armyspy.com","expires":"2026-01-24 03:18:24","free":false,"registered":true,"registered_to":"DATA REDACTED","registrar_name":"Cloudflare, Inc.","spf_strict":true,"suspicious_tld":false,"tld":".com","updated":"2024-12-25 04:01:12","valid_mx":true,"website_exists":true},"account_aggregates":{"total_registration":0,"business":{"total_registration":0,"technology":{"registered":0,"checked":25},"science_and_education":{"registered":0,"checked":8},"jobs_and_employment":{"registered":0,"checked":5},"money_transfer_remittance":{"registered":0,"checked":5}},"personal":{"total_registration":0,"email_service":{"registered":0,"checked":6},"technology":{"registered":0,"checked":7},"adult_sites":{"registered":0,"checked":6},"delivery":{"registered":0,"checked":5},"ecommerce":{"registered":0,"checked":20},"entertainment":{"registered":0,"checked":31},"health_and_fitness":{"registered":0,"checked":5},"social_media":{"registered":0,"checked":23},"travel":{"registered":0,"checked":6}}},"seon_fraud_history":{"fraudulent_decline_first_seen":null,"fraudulent_decline_last_seen":null,"fraudulent_decline_customer_hits":0,"fraudulent_decline_hits":0,"first_seen":null,"last_seen":null,"customer_hits":0,"hits":0,"flags":[]},"breach_details":{"breaches":[],"first_breach":null,"haveibeenpwned_listed":false,"number_of_breaches":0},"associated_domain_registrations":{"exists":false,"number_of_domains":0,"domains":[],"first_registration_date":null}},"phone_details":{"id":"49eb84b3-7a74-4707-bc5d-569a179a81c1","phone":14078704557,"risk_scores":{"global_network_score":25.17},"account_aggregates":{"total_registration":0,"business":{"total_registration":0,"technology":{"registered":0,"checked":0},"science_and_education":{"registered":0,"checked":0},"jobs_and_employment":{"registered":0,"checked":0},"money_transfer_remittance":{"registered":0,"checked":5}},"personal":{"total_registration":0,"email_service":{"registered":0,"checked":0},"technology":{"registered":0,"checked":1},"delivery":{"registered":0,"checked":3},"ecommerce":{"registered":0,"checked":8},"entertainment":{"registered":0,"checked":3},"social_media":{"registered":0,"checked":7},"travel":{"registered":0,"checked":2},"messenger":{"registered":0,"checked":2}}},"seon_fraud_history":{"fraudulent_decline_first_seen":null,"fraudulent_decline_last_seen":null,"fraudulent_decline_customer_hits":0,"fraudulent_decline_hits":0,"first_seen":null,"last_seen":null,"customer_hits":0,"hits":0,"flags":[]},"provider_carrier_details":{"carrier":"CENTURYLINK OF FLORIDA, INC. (UNITED)","country":"US","disposable":false,"phone_is_valid":true,"type":"FIXED_LINE"}}}},[Content-Type:"application/json", Content-Length:"8450", Connection:"keep-alive", Date:"Sun, 21 Sep 2025 13:03:30 GMT", X-Amzn-Trace-Id:"Root=1-68cff79c-62bbee4f141873b9752ee0fb;Parent=6f89856d511d36d6;Sampled=0;Lineage=1:745abbb6:0", x-amzn-RequestId:"faa82895-2d50-4d54-affd-e3ea97f79369", x-amz-apigw-id:"RQOgjG0vDoEENqg=", X-Cache:"Miss from cloudfront", Via:"1.1 c703222165a12466687c41efdc6804e2.cloudfront.net (CloudFront)", X-Amz-Cf-Pop:"DFW59-P6", X-Amz-Cf-Id:"uMX2tiwb_bpMn6wpK_fckF9hxEEXC4sf1VA_bw2JM-glH0Zf4QYtXA=="]>

--> 
--> True Device ID capturado: "true_device_id":"01996c5f-3d2f-71a5-a123-8114cb10db28" dentro de device_details.
--> Network Score presente:
--> Email API v3: email_details.risk_scores.global_network_score = 26.79.
--> Phone API v2: phone_details.risk_scores.global_network_score = 25.17.
--> Versões corretas das APIs ativadas:
--> Config aponta email.version = "v3" e phone.version = "v2", além de device_fingerprinting = true.
--> Fingerprint coerente:
--> O session enviado na request do SEON é exatamente o mesmo seonFingerprintText persistido no lead (já validado por você).
--> Endpoint correto do Fraud API: https://api.seon.io/SeonRestService/fraud-api/v2.

--> Mapeamento para os requisitos do ticket
--> “Atualizar SEON SDK e API para versão mais recente/compatível” → OK (SDK Web 6.9.0 evidenciado; Fraud API v2; Email v3; Phone v2).
--> “Payload inclui seonFingerprintText” → Indireto, mas já confirmado no fluxo e no DB do lead.
--> “Persistir seon_fingerprint_text no lead” → Já confirmado em uown_los_lead.
--> “Capturar True Device ID na resposta” → OK, presente em device_details.true_device_id.
--> “Capturar Network Score” → OK, presente em email_details.risk_scores.global_network_score e phone_details.risk_scores.global_network_score.
--> 
-----

--> * --> O que foi validado com sucesso
SDK/versões:
--> * --> Web SDK SEON ativo e atualizado: prefixo do fingerprint “W;6.9.0;…”.
--> * --> Fraud API v2 em uso; Email API v3 e Phone API v2 habilitadas no config.
Payload do envio:
--> * --> Campo seonFingerprintText presente no envio e refletido na resposta do backend.
Persistência em banco:
--> * --> uown_los_lead.seon_fingerprint_text populado e idêntico ao valor do payload.
True Device ID:
--> * --> Presente no uown_fraud_engine_outbound.response em device_details.true_device_id = 01996c5f-3d2f-71a5-a123-8114cb10db28.
Network Score:
--> * --> Email API v3: email_details.risk_scores.global_network_score = 26.79.
--> * --> Phone API v2: phone_details.risk_scores.global_network_score = 25.17.
Fluxo funcional sem erros:
--> * --> Chamadas SEON com 200 OK; sem evidências de falhas 4xx/5xx no fluxo apresentado.

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Funcionalidade: Integração do SDK e API do SEON

Cenário: Integração bem-sucedida do SDK e API do SEON com novos campos de resposta
Dado que a verificação de fraude do merchant está habilitada
E eu tenho acesso ao portal Origination
Quando eu iniciar o fluxo de nova aplicação
Então o payload da requisição "sendApplication" deve incluir "seonFingerprintText" populado com o valor correto
E o "seonFingerprintText" deve ser persistido na tabela "uown_los_lead" com o mesmo valor da requisição
E a resposta de "uown_fraud_engine_outbound" deve incluir o "True Device ID" sob "device_details.true_device_id"
E a resposta deve incluir o "Network Score" sob "email_details.risk_scores.global_network_score" e "phone_details.risk_scores.global_network_score"

Cenário: Sem "True Device ID" quando a verificação de fraude não está habilitada
Dado que a verificação de fraude do merchant não está habilitada
Quando eu iniciar o fluxo de nova aplicação
Então o payload da requisição "sendApplication" ainda deve incluir "seonFingerprintText"
Mas a resposta de "uown_fraud_engine_outbound" não deve conter o "True Device ID"

Cenário: Verificando que o sistema suporta todas as APIs e funcionalidades do SEON após o upgrade
Dado que o SEON Web SDK foi atualizado para a versão 6.9.0 ou superior
E a Fraud API v2, Email API v3, e Phone API v2 estão configuradas no sistema
Quando eu inspecionar o payload da requisição para o fluxo de nova aplicação
Então eu devo ver o campo "seonFingerprintText" populado e correspondendo ao valor da sessão
E o "True Device ID" deve estar presente na resposta sob "device_details.true_device_id"
E o "Network Score" deve estar disponível na resposta sob "email_details.risk_scores.global_network_score" e "phone_details.risk_scores.global_network_score"

Cenário: Verificação no banco de dados após a integração com o SEON
Dado que eu enviei uma nova aplicação
Quando eu verificar a tabela "uown_los_lead"
Então o campo "seon_fingerprint_text" deve conter o mesmo valor da sessão da requisição
E eu devo encontrar o "True Device ID" na resposta de "uown_fraud_engine_outbound"

Cenário: Garantindo que não haja regressão na integração do SEON após o upgrade
Dado que o SDK e a API do SEON foram atualizados
Quando eu realizar o fluxo de "Nova Aplicação"
Então o sistema não deve encontrar erros nas chamadas da API do SEON
E os fluxos existentes de verificação de fraude (ex: Email/Phone/IP) devem continuar funcionando sem regressões
E o comportamento de aprovação/negação/pendência deve permanecer inalterado sob condições equivalentes

-----

> ## Tests in qa1

> ```gherkin
> Feature: SEON SDK and API Integration
> 
> ### Scenario: Successful SEON SDK and API integration with new response fields
> Given that fraud verification is enabled for the merchant
> And I have access to the Origination portal
> When I initiate the New Application flow
> Then the request payload "sendApplication" should include "seonFingerprintText" populated with the correct value
> And "seonFingerprintText" should be persisted in the "uown_los_lead" table with the same value as in the request
> And the response from "uown_fraud_engine_outbound" should include the "True Device ID" under "device_details.true_device_id"
> And the response should include the "Network Score" under "email_details.risk_scores.global_network_score" and "phone_details.risk_scores.global_network_score"
> 
> | PASS | LeadPk: 9854 | Merchant: Tire Agent | 
> ```
>
>
> ```gherkin
> ### Scenario: No "True Device ID" when fraud verification is not enabled
> Given that fraud verification is not enabled for the merchant
> When I initiate the New Application flow
> Then the request payload "sendApplication" should still include "seonFingerprintText"
> But the response from "uown_fraud_engine_outbound" should not contain the "True Device ID"
> 
> | PASS | Merchant: Tire Agent | 
> ```
>
>
> ```gherkin
> ### Scenario: Verifying that the system supports all SEON APIs and functionalities after the upgrade
> Given that the SEON Web SDK has been updated to version 6.9.0 or higher
> And Fraud API v2, Email API v3, and Phone API v2 are configured in the system
> When I inspect the request payload for the New Application flow
> Then I should see the "seonFingerprintText" field populated and matching the session value
> And the "True Device ID" should be present in the response under "device_details.true_device_id"
> And the "Network Score" should be available in the response under "email_details.risk_scores.global_network_score" and "phone_details.risk_scores.global_network_score"
> 
> | PASS | LeadPk: 9854 | Merchant: Tire Agent | 
> ```
>
>
> ```gherkin
> ### Scenario: Database verification after SEON integration
> Given that I submitted a new application
> When I check the "uown_los_lead" table
> Then the "seon_fingerprint_text" field should contain the same value as the session in the request
> And I should find the "True Device ID" in the response from "uown_fraud_engine_outbound"
> 
> | PASS | LeadPk: 9854 | Merchant: Tire Agent | 
> ```
>
>
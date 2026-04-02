-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1086

UOWN | Origination | Enable Contract Download Link via GetApplicationStatus for Merchant Convenience
Aberto
  Tíquete criado 3 semanas atrás por Yuri Araujo
Synopsis
It has been observed that some merchants, such as Kornerstone, traditionally prefer to print the contract and review it with their customers at the time of sale. While this is not a required operational step, offering this option represents a value-added convenience that enhances the customer experience and reinforces trust in the process.

Business Objective
Support a common practice among certain merchants who prefer to present contracts in printed form to their customers. This feature aims to enhance the sales experience by allowing merchants to easily access and print the signed contract when needed. It is intended as a convenience feature, not a replacement for the existing digital flow.

Feature Request | Business Requirements
Add a contract download URL field to the GetApplicationStatus endpoint, which already aggregates relevant application data.
The URL should enable direct download of the signed contract PDF, once the e-signature process has been completed.
Validate the expiration time of the link to ensure availability for immediate use at the point of sale.
Confirm whether the URL requires authentication and clearly document the expected behavior.
Ensure that the link is secure and does not expose any sensitive information, complying with privacy policies.
Test and validate the feature across sandbox, QA and staging environments.
Update API documentation to reflect the new field and guide integrators on how to use it.

Test steps

🧪 Test Cases Based on populateContractDetails

Endpoint
/uown/los/getApplicationStatus
Body

{
    "uuid": "63942220-77d0-4cf3-b0d3-f7c864142303" // sample uuid
}


1. Contract not signed


Precondition: contract.getContractInfo().getContractStatus() != SIGNED


Execution: Call /getApplicationStatus


Expected result:

hasSignedLease = false
contractUrlExpirationTime = createdTime + hoursToExpire
contractUrl = null




2. Contract signed and still valid


Precondition: contractStatus = SIGNED and LocalDateTime.now() < contractDownloadExpiresAt


Execution: Call /getApplicationStatus


Expected result:

hasSignedLease = true
contractUrlExpirationTime = createdTime + hoursToExpire
contractUrl = contract.getContractInfo().getUrl()




3. Contract signed but expired


Precondition: contractStatus = SIGNED and LocalDateTime.now() > contractDownloadExpiresAt


Execution: Call /getApplicationStatus


Expected result:

hasSignedLease = true
contractUrlExpirationTime = createdTime + hoursToExpire
contractUrl = null


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


Requisitos de Teste (API) – GetApplicationStatus: Contract Download Link
Endpoint e Payload
Método/rota: POST /uown/los/getApplicationStatus
Corpo mínimo: { "uuid": "<uuid da aplicação>" }
Pré-condição: uuid válido deve identificar um lead/contrato existente.
Novos Campos na Resposta
contractUrl (String, pode ser nulo)
contractUrlExpirationTime (LocalDateTime)
Campos já existentes relevantes: hasSignedLease (boolean)
Regra de Negócio – Assinatura Não Concluída
Dado: contract.getContractInfo().getContractStatus() != SIGNED
Então:
hasSignedLease = false
contractUrl = null
contractUrlExpirationTime = createdTime + hoursToExpire
Regra de Negócio – Assinado e Válido
Dado: contractStatus = SIGNED e now() < contractDownloadExpiresAt
Então:
hasSignedLease = true
contractUrl = contract.getContractInfo().getUrl()
contractUrlExpirationTime = createdTime + hoursToExpire
Regra de Negócio – Assinado porém Expirado
Dado: contractStatus = SIGNED e now() > contractDownloadExpiresAt
Então:
hasSignedLease = true
contractUrl = null
contractUrlExpirationTime = createdTime + hoursToExpire
Cálculo de Expiração
createdTime = contract.rowCreatedTimestamp
hoursToExpire = config("...GetApplicationStatusService.hoursToExpiredContractDownload", default=36)
contractDownloadExpiresAt = createdTime + hoursToExpire
Autenticação e Comportamento do Link
Verificar se contractUrl requer autenticação para download.
Documentar comportamento esperado (com/sem auth). Se exigir auth, validar que o link rejeita acesso não autorizado.
Segurança e Privacidade
Garantir que contractUrl não expõe dados sensíveis em query/path.
Verificar HTTPS obrigatório.
Assegurar que, após expiração, o link não baixa o PDF (HTTP 403/410/404 conforme design).
Compatibilidade/Backward Compatibility
Quando não assinado, contractUrl deve ser nulo (não quebrar integrações).
contractUrlExpirationTime sempre presente e consistente, mesmo quando contractUrl é nulo.
Cenários Funcionais a Cobrir
Contrato não assinado → hasSignedLease=false, contractUrl=null, expiração calculada.
Contrato assinado e válido → hasSignedLease=true, contractUrl preenchida e acessível, expiração correta.
Contrato assinado e expirado → hasSignedLease=true, contractUrl=null, expiração correta.
Cenários Negativos/Erro
uuid inexistente → código/erro apropriado (ex.: 404/400) e payload de erro padronizado.
uuid malformado → 400 Bad Request.
Falha de configuração (hoursToExpire ausente) → usar default 36h e responder corretamente.
Contrato sem url mesmo com SIGNED → hasSignedLease=true, contractUrl=null, log de diagnóstico.
Validação de Download
Quando contractUrl presente (válido), realizar GET e validar:
Contém PDF (Content-Type application/pdf).
Tamanho não-zero.
Nome/headers conforme política (se aplicável).
Após expiração, confirmar que o GET falha conforme esperado.
Ambientes
Validar comportamento em sandbox, QA e staging:
Mesma regra de expiração.
contractUrl aponta para domínios/hosts corretos de cada ambiente.
Diferenças de autenticação documentadas.
Documentação
Atualizar contrato OpenAPI/Swagger:
Schema com contractUrl (nullable) e contractUrlExpirationTime (formato data-hora).
Descrição das regras 3–6.
Exemplo de respostas para os 3 cenários.
Notas de autenticação do link de download.
Observabilidade
Logs quando contractUrl é definido/omitido e motivo (não assinado/expirado).
Métricas/opcionais: contagem de respostas com link válido vs nulo.
Performance
Tempo de resposta do POST /getApplicationStatus permanece dentro do SLA atual.
Cálculo de expiração não adiciona I/O extra (somente leitura de config).
Teste de Configuração
Validar que alterar hoursToExpire na ConfigurationManagement reflete-se imediatamente no cálculo.
Confirmar default de 36h quando a key não existe.
Consistência Temporal
Garantir uso de mesma base temporal (LocalDateTime.now()) e timezone consistente do serviço.
contractUrlExpirationTime deve ser coerente com now() usado para decidir contractUrl.


-----

Contrato é disponibilizado no eindpoint após a assinatura.
{
"userName": "payTomorrow",
"setupPassword": "U0wn_payTomorrow",
"merchantNumber": "OL90294-0001",
"mainFirstName": "john",
"mainLastName": "doe",
"mainDOB": "10161986",
"mainSSN": "378052173",
"mainAddress1": "3374 Happy Hollow Road",
"mainCity": "Wilmington",
"mainStateOrProvince": "NC",
"mainPostalCode": "28403",
"mainCellPhone": "2699864535",
"emailAddress": "AlexiaCLayton@teleworm.us",
"mainEmployerName": "Uown",
"mainPastBankruptcy": false,
"mainCurrentOrFutureBankruptcy": false,
"languagePreference": "E",
"iovationFingerprintText": "fingerPrintText",
"ipaddress": "192.168.0.2",
"desiredPaymentFrequency": "BI_WEEKLY",
"mainAnnualIncome": 51500,
"mainPayFrequency": "BI_WEEKLY",
"mainNextPayDate": "08312025",
"mainLastPayDate": "08242025",
"mainEmploymentDuration": "_1_TO_2_YEARS",
"shipToSameAsConsumer": true,
"merchandiseSubtotal": "800.00",
"discountAmount": "0.00",
"deliveryCharge": "50.00",
"installationCharge": "100.00",
"salesTax": "60.00",
"miscellaneousFees": "300.00",
"depositAmount": "0.00",
"orderTotal": "1310.00",
"invoiceNumber": "R91931",
"lineItem": [
{
"lineItemLineNumber": "317",
"lineItemSerialNumber": "S94712065",
"lineItemProductNumber": "A561SKU283",
"lineItemProductDescription": "Ottoman",
"lineItemProductCategory": "Seating",
"lineItemType": "D",
"lineItemQuantityOrdered": "1",
"lineItemTaxAmount": "",
"lineItemExtendedPrice": "500.00"
},
{
"lineItemLineNumber": "318",
"lineItemSerialNumber": "M68484397",
"lineItemProductNumber": "A333SKU4444",
"lineItemProductDescription": "Recliner",
"lineItemProductCategory": "Seating",
"lineItemType": "D",
"lineItemQuantityOrdered": "1",
"lineItemUnitPrice": "300.00",
"lineItemBasePrice": "300.00",
"lineItemTaxAmount": "00.00",
"lineItemExtendedPrice": "300.00"
}
]
}

-----

{
"faults": false,
"fieldInError1": null,
"fieldInError2": null,
"fieldInError3": null,
"fieldInError4": null,
"fieldInError5": null,
"sorErrorDescription": null,
"transactionMessage": null,
"accountNumber": "1b77b5f5-a8a3-424a-ada3-043d618ebefb",
"authorizationNumber": "13431",
"providerURL": null,
"merchantName": "Progress Mobility Acquisition LLC",
"customerFirstName": "john",
"customerLastName": "doe",
"orderTotal": 1310,
"purchaseNowTotal": 0,
"purchaseNowTotalWithTax": 0,
"externalReferenceId": null,
"invoiceItems": [
{
"lineItemId": 27219,
"lineItemLineNumber": 317,
"lineItemProductNumber": "A561SKU283",
"lineItemSerialNumber": "S94712065",
"lineItemProductCategory": "Seating",
"lineItemType": "DEBIT_SALE",
"lineItemQuantityOrdered": 1,
"lineItemUnitPrice": 0,
"lineItemBasePrice": 0,
"lineItemTaxAmount": null,
"lineItemDeliveryFee": 0,
"lineItemExtendedPrice": 500,
"lineItemExtendedDeliveryFee": 0,
"deliveryDate": null,
"deliveryType": null,
"lineItemStatus": "ADDED_TO_CART",
"lineitemProductDescription": "Ottoman"
},
{
"lineItemId": 27220,
"lineItemLineNumber": 318,
"lineItemProductNumber": "A333SKU4444",
"lineItemSerialNumber": "M68484397",
"lineItemProductCategory": "Seating",
"lineItemType": "DEBIT_SALE",
"lineItemQuantityOrdered": 1,
"lineItemUnitPrice": 300,
"lineItemBasePrice": 300,
"lineItemTaxAmount": 0,
"lineItemDeliveryFee": 0,
"lineItemExtendedPrice": 300,
"lineItemExtendedDeliveryFee": 0,
"deliveryDate": null,
"deliveryType": null,
"lineItemStatus": "ADDED_TO_CART",
"lineitemProductDescription": "Recliner"
}
],
"transactionStatus": "E0",
"appApprovalStatus": "APPROVED",
"creditLimit": 4280,
"promoPlan1": null,
"promoPlanDesc1": null,
"promoPlan2": null,
"promoPlanDesc2": null,
"promoPlan3": null,
"promoPlanDesc3": null,
"promoPlan4": null,
"promoPlanDesc4": null,
"promoPlan5": null,
"promoPlanDesc5": null,
"programType": "LTO",
"locationName": "Progress Mobility Acquisition LLC",
"lambdaScore": null,
"isPlaidRequired": false,
"paymentDetailsList": [
{
"redirectUrl": "https://origination-qa2.uownleasing.com/completeApplication?uuid=1b77b5f5-a8a3-424a-ada3-043d618ebefb_7960569378242809856&selectedPaymentFrequency=WEEKLY&isBranded=false",
"totalContractAmountWithTax": 2995.7,
"totalContractAmountNoTax": 2802.35,
"regularPaymentWithTax": 51.06,
"numberOfPayments": 56,
"frequency": "WEEKLY",
"firstPaymentWithFeesAndTax": 91.06,
"firstPaymentWithFeesNoTax": 87.72,
"firstPaymentDate": "2025-08-31",
"paymentDueToday": 0
},
{
"redirectUrl": "https://origination-qa2.uownleasing.com/completeApplication?uuid=1b77b5f5-a8a3-424a-ada3-043d618ebefb_7960569378242809856&selectedPaymentFrequency=BI_WEEKLY&isBranded=false",
"totalContractAmountWithTax": 2995.7,
"totalContractAmountNoTax": 2802.33,
"regularPaymentWithTax": 104.03,
"numberOfPayments": 28,
"frequency": "BI_WEEKLY",
"firstPaymentWithFeesAndTax": 144.03,
"firstPaymentWithFeesNoTax": 137.22,
"firstPaymentDate": "2025-08-31",
"paymentDueToday": 0
},
{
"redirectUrl": "https://origination-qa2.uownleasing.com/completeApplication?uuid=1b77b5f5-a8a3-424a-ada3-043d618ebefb_7960569378242809856&selectedPaymentFrequency=MONTHLY&isBranded=false",
"totalContractAmountWithTax": 2995.7,
"totalContractAmountNoTax": 2802.33,
"regularPaymentWithTax": 234.05,
"numberOfPayments": 13,
"frequency": "MONTHLY",
"firstPaymentWithFeesAndTax": 274.05,
"firstPaymentWithFeesNoTax": 258.74,
"firstPaymentDate": "2025-08-31",
"paymentDueToday": 0
}
]
}


-----

{
"faults": false,
"fieldInError1": null,
"fieldInError2": null,
"fieldInError3": null,
"fieldInError4": null,
"fieldInError5": null,
"sorErrorDescription": null,
"transactionMessage": null,
"accountNumber": "1b77b5f5-a8a3-424a-ada3-043d618ebefb",
"authorizationNumber": "13431",
"providerURL": null,
"merchantName": "Progress Mobility Acquisition LLC",
"customerFirstName": "john",
"customerLastName": "doe",
"orderTotal": 0,
"purchaseNowTotal": 0,
"purchaseNowTotalWithTax": 0,
"externalReferenceId": null,
"invoiceItems": [],
"transactionStatus": "I0",
"applicationFound": true,
"applicationSubmitted": true,
"applicationCreatedTimestamp": "2025-08-25T12:35:38.819773",
"appUuid": "1b77b5f5-a8a3-424a-ada3-043d618ebefb",
"leadPk": 13431,
"merchantInvoiceNumber": "R91931",
"totalInvoiceAmount": 1310,
"currentStatus": "SIGNED",
"statusDescription": null,
"hasSignedLease": true,
"hasLeaseMod": null,
"canContinue": true,
"approvedAmount": 4280,
"openToBuy": 2970,
"accountBalance": null,
"lastPayment": null,
"lastPaymentDate": null,
"paymentDueDate": "2025-08-31",
"contractUrl": "https://www.signwell.com/docs/e88ea94a22/",
"contractUrlExpirationTime": "2025-08-27T00:39:08.474836",
"merchantProgramName": null,
"merchantPk": null,
"refMerchantCode": "OL90294-0001",
"locationId": null,
"fundRequestDateTime": null,
"fundedDateTime": null,
"amountToBeFunded": null,
"merchantDiscountPercent": 0.03,
"merchantDiscountAmount": null,
"merchantRebatePercent": -1,
"merchantRebateAmount": null,
"merchantRebateType": "MONTHLY",
"paymentDetailsList": [],
"lineItem": [
{
"lineItemId": 27219,
"lineItemLineNumber": null,
"lineItemProductNumber": "A561SKU283",
"lineItemSerialNumber": null,
"lineItemProductCategory": "OTHER",
"lineItemType": "DEBIT_SALE",
"lineItemQuantityOrdered": 1,
"lineItemUnitPrice": 0,
"lineItemBasePrice": 0,
"lineItemTaxAmount": 0,
"lineItemDeliveryFee": 0,
"lineItemExtendedPrice": 0,
"lineItemExtendedDeliveryFee": 0,
"deliveryDate": null,
"deliveryType": null,
"lineItemStatus": null,
"lineitemProductDescription": "Seating:Ottoman"
},
{
"lineItemId": 27220,
"lineItemLineNumber": null,
"lineItemProductNumber": "A333SKU4444",
"lineItemSerialNumber": null,
"lineItemProductCategory": "OTHER",
"lineItemType": "DEBIT_SALE",
"lineItemQuantityOrdered": 1,
"lineItemUnitPrice": 300,
"lineItemBasePrice": 0,
"lineItemTaxAmount": 0,
"lineItemDeliveryFee": 0,
"lineItemExtendedPrice": 300,
"lineItemExtendedDeliveryFee": 0,
"deliveryDate": null,
"deliveryType": null,
"lineItemStatus": null,
"lineitemProductDescription": "Seating:Recliner"
}
]
}

-----


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.1.25.43.0_EnableContractDownloadLinkViaGetApplicationStatusForMerchantConvenience_Ticket1086

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




conta assinada**
498b8820-6c09-4fe3-97b4-db8ae3719b74
289448442
13493
https://origination-qa2.uownleasing.com/completeApplication?uuid=498b8820-6c09-4fe3-97b4-db8ae3719b74_7963158099181957120&selectedPaymentFrequency=WEEKLY&isBranded=false


conta nao assinada*
146443156
"accountNumber": "b0744ee2-3d4c-4bcf-b2d9-d81285418bcc",
"authorizationNumber": "13498",
https://origination-qa2.uownleasing.com/completeApplication?uuid=b0744ee2-3d4c-4bcf-b2d9-d81285418bcc_7963351728387252224&selectedPaymentFrequency=WEEKLY&isBranded=false

{
    "faults": false,
    "fieldInError1": null,
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": null,
    "transactionMessage": null,
    "accountNumber": "498b8820-6c09-4fe3-97b4-db8ae3719b74",
    "authorizationNumber": "13493",
    "providerURL": null,
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "john",
    "customerLastName": "doe",
    "orderTotal": 0,
    "purchaseNowTotal": 0,
    "purchaseNowTotalWithTax": 0,
    "externalReferenceId": null,
    "invoiceItems": [],
    "transactionStatus": "I0",
    "applicationFound": true,
    "applicationSubmitted": true,
    "applicationCreatedTimestamp": "2025-08-25T15:16:22.556878",
    "appUuid": "498b8820-6c09-4fe3-97b4-db8ae3719b74",
    "leadPk": 13493,
    "merchantInvoiceNumber": "R91931",
    "totalInvoiceAmount": 1310,
    "currentStatus": "UW_APPROVED",
    "statusDescription": null,
    "hasSignedLease": null,
    "hasLeaseMod": null,
    "canContinue": true,
    "approvedAmount": 4280,
    "openToBuy": 2970,
    "accountBalance": null,
    "lastPayment": null,
    "lastPaymentDate": null,
    "paymentDueDate": null,
    "contractUrl": null,
    "contractUrlExpirationTime": null,
    "merchantProgramName": null,
    "merchantPk": null,
    "refMerchantCode": "OL90294-0001",
    "locationId": null,
    "fundRequestDateTime": null,
    "fundedDateTime": null,
    "amountToBeFunded": null,
    "merchantDiscountPercent": 0.03,
    "merchantDiscountAmount": null,
    "merchantRebatePercent": -1,
    "merchantRebateAmount": null,
    "merchantRebateType": "MONTHLY",
    "paymentDetailsList": [],
    "lineItem": [
        {
            "lineItemId": 27329,
            "lineItemLineNumber": null,
            "lineItemProductNumber": "A561SKU283",
            "lineItemSerialNumber": null,
            "lineItemProductCategory": "OTHER",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 0,
            "lineItemBasePrice": 0,
            "lineItemTaxAmount": 0,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 0,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": null,
            "lineitemProductDescription": "Seating:Ottoman"
        },
        {
            "lineItemId": 27330,
            "lineItemLineNumber": null,
            "lineItemProductNumber": "A333SKU4444",
            "lineItemSerialNumber": null,
            "lineItemProductCategory": "OTHER",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemBasePrice": 0,
            "lineItemTaxAmount": 0,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 300,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": null,
            "lineitemProductDescription": "Seating:Recliner"
        }
    ]
}

-----

{
    "faults": false,
    "fieldInError1": null,
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": null,
    "transactionMessage": null,
    "accountNumber": "498b8820-6c09-4fe3-97b4-db8ae3719b74",
    "authorizationNumber": "13493",
    "providerURL": null,
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "john",
    "customerLastName": "doe",
    "orderTotal": 0,
    "purchaseNowTotal": 0,
    "purchaseNowTotalWithTax": 0,
    "externalReferenceId": null,
    "invoiceItems": [],
    "transactionStatus": "I0",
    "applicationFound": true,
    "applicationSubmitted": true,
    "applicationCreatedTimestamp": "2025-08-25T15:16:22.556878",
    "appUuid": "498b8820-6c09-4fe3-97b4-db8ae3719b74",
    "leadPk": 13493,
    "merchantInvoiceNumber": "R91931",
    "totalInvoiceAmount": 1310,
    "currentStatus": "SIGNED",
    "statusDescription": null,
    "hasSignedLease": true,
    "hasLeaseMod": null,
    "canContinue": true,
    "approvedAmount": 4280,
    "openToBuy": 2970,
    "accountBalance": null,
    "lastPayment": null,
    "lastPaymentDate": null,
    "paymentDueDate": "2025-08-31",
    "contractUrl": "https://www.signwell.com/docs/6d83b41fdb/",
    "contractUrlExpirationTime": "2025-08-27T03:22:53.47789",
    "merchantProgramName": null,
    "merchantPk": null,
    "refMerchantCode": "OL90294-0001",
    "locationId": null,
    "fundRequestDateTime": null,
    "fundedDateTime": null,
    "amountToBeFunded": null,
    "merchantDiscountPercent": 0.03,
    "merchantDiscountAmount": null,
    "merchantRebatePercent": -1,
    "merchantRebateAmount": null,
    "merchantRebateType": "MONTHLY",
    "paymentDetailsList": [],
    "lineItem": [
        {
            "lineItemId": 27329,
            "lineItemLineNumber": null,
            "lineItemProductNumber": "A561SKU283",
            "lineItemSerialNumber": null,
            "lineItemProductCategory": "OTHER",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 0,
            "lineItemBasePrice": 0,
            "lineItemTaxAmount": 0,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 0,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": null,
            "lineitemProductDescription": "Seating:Ottoman"
        },
        {
            "lineItemId": 27330,
            "lineItemLineNumber": null,
            "lineItemProductNumber": "A333SKU4444",
            "lineItemSerialNumber": null,
            "lineItemProductCategory": "OTHER",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemBasePrice": 0,
            "lineItemTaxAmount": 0,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 300,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": null,
            "lineitemProductDescription": "Seating:Recliner"
        }
    ]
}

-----

{
    "faults": false,
    "fieldInError1": null,
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": null,
    "transactionMessage": null,
    "accountNumber": "498b8820-6c09-4fe3-97b4-db8ae3719b74",
    "authorizationNumber": "13493",
    "providerURL": null,
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "john",
    "customerLastName": "doe",
    "orderTotal": 0,
    "purchaseNowTotal": 0,
    "purchaseNowTotalWithTax": 0,
    "externalReferenceId": null,
    "invoiceItems": [],
    "transactionStatus": "I0",
    "applicationFound": true,
    "applicationSubmitted": true,
    "applicationCreatedTimestamp": "2025-08-25T15:16:22.556878",
    "appUuid": "498b8820-6c09-4fe3-97b4-db8ae3719b74",
    "leadPk": 13493,
    "merchantInvoiceNumber": "R91931",
    "totalInvoiceAmount": 1310,
    "currentStatus": "SIGNED",
    "statusDescription": null,
    "hasSignedLease": true,
    "hasLeaseMod": null,
    "canContinue": true,
    "approvedAmount": 4280,
    "openToBuy": 2970,
    "accountBalance": null,
    "lastPayment": null,
    "lastPaymentDate": null,
    "paymentDueDate": "2025-08-31",
    "contractUrl": "https://www.signwell.com/docs/6d83b41fdb/",
    "contractUrlExpirationTime": "2025-08-27T03:22:53.47789",
    "merchantProgramName": null,
    "merchantPk": null,
    "refMerchantCode": "OL90294-0001",
    "locationId": null,
    "fundRequestDateTime": null,
    "fundedDateTime": null,
    "amountToBeFunded": null,
    "merchantDiscountPercent": 0.03,
    "merchantDiscountAmount": null,
    "merchantRebatePercent": -1,
    "merchantRebateAmount": null,
    "merchantRebateType": "MONTHLY",
    "paymentDetailsList": [],
    "lineItem": [
        {
            "lineItemId": 27329,
            "lineItemLineNumber": null,
            "lineItemProductNumber": "A561SKU283",
            "lineItemSerialNumber": null,
            "lineItemProductCategory": "OTHER",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 0,
            "lineItemBasePrice": 0,
            "lineItemTaxAmount": 0,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 0,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": null,
            "lineitemProductDescription": "Seating:Ottoman"
        },
        {
            "lineItemId": 27330,
            "lineItemLineNumber": null,
            "lineItemProductNumber": "A333SKU4444",
            "lineItemSerialNumber": null,
            "lineItemProductCategory": "OTHER",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300,
            "lineItemBasePrice": 0,
            "lineItemTaxAmount": 0,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 300,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": null,
            "lineitemProductDescription": "Seating:Recliner"
        }
    ]
}

-----

Signed Expirado

<ApplicationStatusResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>498b8820-6c09-4fe3-97b4-db8ae3719b74</accountNumber>
    <authorizationNumber>13493</authorizationNumber>
    <providerURL/>
    <merchantName>Progress Mobility Acquisition LLC</merchantName>
    <customerFirstName>john</customerFirstName>
    <customerLastName>doe</customerLastName>
    <orderTotal>0</orderTotal>
    <purchaseNowTotal>0</purchaseNowTotal>
    <purchaseNowTotalWithTax>0</purchaseNowTotalWithTax>
    <externalReferenceId/>
    <invoiceItems/>
    <transactionStatus>I0</transactionStatus>
    <applicationFound>true</applicationFound>
    <applicationSubmitted>true</applicationSubmitted>
    <applicationCreatedTimestamp>2025-08-25T15:16:22.556878</applicationCreatedTimestamp>
    <appUuid>498b8820-6c09-4fe3-97b4-db8ae3719b74</appUuid>
    <leadPk>13493</leadPk>
    <merchantInvoiceNumber>R91931</merchantInvoiceNumber>
    <totalInvoiceAmount>1310.00</totalInvoiceAmount>
    <currentStatus>SIGNED</currentStatus>
    <statusDescription/>
    <hasSignedLease>true</hasSignedLease>
    <hasLeaseMod/>
    <canContinue>true</canContinue>
    <approvedAmount>4280.00</approvedAmount>
    <openToBuy>2970.00</openToBuy>
    <accountBalance/>
    <lastPayment/>
    <lastPaymentDate/>
    <paymentDueDate>2025-08-31</paymentDueDate>
    <contractUrl/>
    <contractUrlExpirationTime>2025-08-22T03:22:53.477</contractUrlExpirationTime>
    <merchantProgramName/>
    <merchantPk/>
    <refMerchantCode>OL90294-0001</refMerchantCode>
    <locationId/>
    <fundRequestDateTime/>
    <fundedDateTime/>
    <amountToBeFunded/>
    <merchantDiscountPercent>0.03000</merchantDiscountPercent>
    <merchantDiscountAmount/>
    <merchantRebatePercent>-1.00000</merchantRebatePercent>
    <merchantRebateAmount/>
    <merchantRebateType>MONTHLY</merchantRebateType>
    <paymentDetailsList/>
    <lineItem>
        <lineItem>
            <lineItemId>27329</lineItemId>
            <lineItemLineNumber/>
            <lineItemProductNumber>A561SKU283</lineItemProductNumber>
            <lineItemSerialNumber/>
            <lineItemProductCategory>OTHER</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>0.00</lineItemUnitPrice>
            <lineItemBasePrice>0</lineItemBasePrice>
            <lineItemTaxAmount>0</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>0.00</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus/>
            <lineitemProductDescription>Seating:Ottoman</lineitemProductDescription>
        </lineItem>
        <lineItem>
            <lineItemId>27330</lineItemId>
            <lineItemLineNumber/>
            <lineItemProductNumber>A333SKU4444</lineItemProductNumber>
            <lineItemSerialNumber/>
            <lineItemProductCategory>OTHER</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>300.00</lineItemUnitPrice>
            <lineItemBasePrice>0</lineItemBasePrice>
            <lineItemTaxAmount>0</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>300.00</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus/>
            <lineitemProductDescription>Seating:Recliner</lineitemProductDescription>
        </lineItem>
    </lineItem>
</ApplicationStatusResponse>

-----

<ApplicationStatusResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>b0744ee2-3d4c-4bcf-b2d9-d81285418bcc</accountNumber>
    <authorizationNumber>13498</authorizationNumber>
    <providerURL/>
    <merchantName>Progress Mobility Acquisition LLC</merchantName>
    <customerFirstName>john</customerFirstName>
    <customerLastName>doe</customerLastName>
    <orderTotal>0</orderTotal>
    <purchaseNowTotal>0</purchaseNowTotal>
    <purchaseNowTotalWithTax>0</purchaseNowTotalWithTax>
    <externalReferenceId/>
    <invoiceItems/>
    <transactionStatus>I0</transactionStatus>
    <applicationFound>true</applicationFound>
    <applicationSubmitted>true</applicationSubmitted>
    <applicationCreatedTimestamp>2025-08-25T15:28:23.881921</applicationCreatedTimestamp>
    <appUuid>b0744ee2-3d4c-4bcf-b2d9-d81285418bcc</appUuid>
    <leadPk>13498</leadPk>
    <merchantInvoiceNumber>R91931</merchantInvoiceNumber>
    <totalInvoiceAmount>1310.00</totalInvoiceAmount>
    <currentStatus>CONTRACT_CREATED</currentStatus>
    <statusDescription/>
    <hasSignedLease>false</hasSignedLease>
    <hasLeaseMod/>
    <canContinue>true</canContinue>
    <approvedAmount>4280.00</approvedAmount>
    <openToBuy>2970.00</openToBuy>
    <accountBalance/>
    <lastPayment/>
    <lastPaymentDate/>
    <paymentDueDate>2025-08-31</paymentDueDate>
    <contractUrl/>
    <contractUrlExpirationTime>2025-08-27T03:44:07.465629</contractUrlExpirationTime>
    <merchantProgramName/>
    <merchantPk/>
    <refMerchantCode>OL90294-0001</refMerchantCode>
    <locationId/>
    <fundRequestDateTime/>
    <fundedDateTime/>
    <amountToBeFunded/>
    <merchantDiscountPercent>0.03000</merchantDiscountPercent>
    <merchantDiscountAmount/>
    <merchantRebatePercent>-1.00000</merchantRebatePercent>
    <merchantRebateAmount/>
    <merchantRebateType>MONTHLY</merchantRebateType>
    <paymentDetailsList/>
    <lineItem>
        <lineItem>
            <lineItemId>27339</lineItemId>
            <lineItemLineNumber/>
            <lineItemProductNumber>A561SKU283</lineItemProductNumber>
            <lineItemSerialNumber/>
            <lineItemProductCategory>OTHER</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>0.00</lineItemUnitPrice>
            <lineItemBasePrice>0</lineItemBasePrice>
            <lineItemTaxAmount>0</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>0.00</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus/>
            <lineitemProductDescription>Seating:Ottoman</lineitemProductDescription>
        </lineItem>
        <lineItem>
            <lineItemId>27340</lineItemId>
            <lineItemLineNumber/>
            <lineItemProductNumber>A333SKU4444</lineItemProductNumber>
            <lineItemSerialNumber/>
            <lineItemProductCategory>OTHER</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>300.00</lineItemUnitPrice>
            <lineItemBasePrice>0</lineItemBasePrice>
            <lineItemTaxAmount>0</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>300.00</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus/>
            <lineitemProductDescription>Seating:Recliner</lineitemProductDescription>
        </lineItem>
    </lineItem>
</ApplicationStatusResponse>


<ApplicationStatusResponse>
    <faults>false</faults>
    <fieldInError1/>
    <fieldInError2/>
    <fieldInError3/>
    <fieldInError4/>
    <fieldInError5/>
    <sorErrorDescription/>
    <transactionMessage/>
    <accountNumber>b0744ee2-3d4c-4bcf-b2d9-d81285418bcc</accountNumber>
    <authorizationNumber>13498</authorizationNumber>
    <providerURL/>
    <merchantName>Progress Mobility Acquisition LLC</merchantName>
    <customerFirstName>john</customerFirstName>
    <customerLastName>doe</customerLastName>
    <orderTotal>0</orderTotal>
    <purchaseNowTotal>0</purchaseNowTotal>
    <purchaseNowTotalWithTax>0</purchaseNowTotalWithTax>
    <externalReferenceId/>
    <invoiceItems/>
    <transactionStatus>I0</transactionStatus>
    <applicationFound>true</applicationFound>
    <applicationSubmitted>true</applicationSubmitted>
    <applicationCreatedTimestamp>2025-08-25T15:28:23.881921</applicationCreatedTimestamp>
    <appUuid>b0744ee2-3d4c-4bcf-b2d9-d81285418bcc</appUuid>
    <leadPk>13498</leadPk>
    <merchantInvoiceNumber>R91931</merchantInvoiceNumber>
    <totalInvoiceAmount>1310.00</totalInvoiceAmount>
    <currentStatus>CONTRACT_CREATED</currentStatus>
    <statusDescription/>
    <hasSignedLease>false</hasSignedLease>
    <hasLeaseMod/>
    <canContinue>true</canContinue>
    <approvedAmount>4280.00</approvedAmount>
    <openToBuy>2970.00</openToBuy>
    <accountBalance/>
    <lastPayment/>
    <lastPaymentDate/>
    <paymentDueDate>2025-08-31</paymentDueDate>
    <contractUrl/>
    <contractUrlExpirationTime>2025-08-27T03:44:07.465629</contractUrlExpirationTime>
    <merchantProgramName/>
    <merchantPk/>
    <refMerchantCode>OL90294-0001</refMerchantCode>
    <locationId/>
    <fundRequestDateTime/>
    <fundedDateTime/>
    <amountToBeFunded/>
    <merchantDiscountPercent>0.03000</merchantDiscountPercent>
    <merchantDiscountAmount/>
    <merchantRebatePercent>-1.00000</merchantRebatePercent>
    <merchantRebateAmount/>
    <merchantRebateType>MONTHLY</merchantRebateType>
    <paymentDetailsList/>
    <lineItem>
        <lineItem>
            <lineItemId>27339</lineItemId>
            <lineItemLineNumber/>
            <lineItemProductNumber>A561SKU283</lineItemProductNumber>
            <lineItemSerialNumber/>
            <lineItemProductCategory>OTHER</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>0.00</lineItemUnitPrice>
            <lineItemBasePrice>0</lineItemBasePrice>
            <lineItemTaxAmount>0</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>0.00</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus/>
            <lineitemProductDescription>Seating:Ottoman</lineitemProductDescription>
        </lineItem>
        <lineItem>
            <lineItemId>27340</lineItemId>
            <lineItemLineNumber/>
            <lineItemProductNumber>A333SKU4444</lineItemProductNumber>
            <lineItemSerialNumber/>
            <lineItemProductCategory>OTHER</lineItemProductCategory>
            <lineItemType>DEBIT_SALE</lineItemType>
            <lineItemQuantityOrdered>1</lineItemQuantityOrdered>
            <lineItemUnitPrice>300.00</lineItemUnitPrice>
            <lineItemBasePrice>0</lineItemBasePrice>
            <lineItemTaxAmount>0</lineItemTaxAmount>
            <lineItemDeliveryFee>0</lineItemDeliveryFee>
            <lineItemExtendedPrice>300.00</lineItemExtendedPrice>
            <lineItemExtendedDeliveryFee>0</lineItemExtendedDeliveryFee>
            <deliveryDate/>
            <deliveryType/>
            <lineItemStatus/>
            <lineitemProductDescription>Seating:Recliner</lineitemProductDescription>
        </lineItem>
    </lineItem>
</ApplicationStatusResponse>

-----

🔹 1) Contrato não assinado
{
  "currentStatus": "CONTRACT_CREATED",
  "hasSignedLease": false,
  "contractUrl": null,
  "contractUrlExpirationTime": "2025-08-27T03:44:07.465629"
}
✅ Atende: hasSignedLease=false, contractUrl=null, contractUrlExpirationTime presente e calculado.

🔹 2) Contrato assinado e válido
{
  "currentStatus": "SIGNED",
  "hasSignedLease": true,
  "contractUrl": "https://www.signwell.com/docs/6d83b41fdb/",
  "contractUrlExpirationTime": "2025-08-27T03:22:53.47789"
}
✅ Atende: hasSignedLease=true, contractUrl preenchido, contractUrlExpirationTime no futuro.

🔹 3) Contrato assinado e expirado
{
  "currentStatus": "SIGNED",
  "hasSignedLease": true,
  "contractUrl": null,
  "contractUrlExpirationTime": "2025-08-22T03:22:53.477"
}
✅ Atende: hasSignedLease=true, contractUrl=null, contractUrlExpirationTime no passado.

------

Feature: GetApplicationStatus - Contract Download Link

  Scenario: Contrato não assinado
    Given a aplicação é consultada pelo endpoint GetApplicationStatus com um uuid válido
    When o contrato não está assinado
    Then o campo hasSignedLease deve ser false
    And o campo contractUrl deve ser null
    And o campo contractUrlExpirationTime deve estar presente e calculado corretamente

  Scenario: Contrato assinado e válido
    Given a aplicação é consultada pelo endpoint GetApplicationStatus com um uuid válido
    When o contrato está assinado e ainda não expirou
    Then o campo hasSignedLease deve ser true
    And o campo contractUrl deve estar preenchido com a URL do contrato
    And o campo contractUrlExpirationTime deve estar no futuro

  Scenario: Contrato assinado e expirado
    Given a aplicação é consultada pelo endpoint GetApplicationStatus com um uuid válido
    When o contrato está assinado e já expirou
    Then o campo hasSignedLease deve ser true
    And o campo contractUrl deve ser null
    And o campo contractUrlExpirationTime deve estar no passado

-----

Feature: GetApplicationStatus - Contract Download Link

> ## Tests in qa2
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Contract not signed
> Given the application is queried through the GetApplicationStatus endpoint with a valid uuid
> When the contract is not signed
> Then the field hasSignedLease must be false
> And the field contractUrl must be null
> And the field contractUrlExpirationTime must be present and correctly calculated
> 
> ### Scenario: Contract signed and valid
> Given the application is queried through the GetApplicationStatus endpoint with a valid uuid
> When the contract is signed and has not expired yet
> Then the field hasSignedLease must be true
> And the field contractUrl must be filled with the contract URL
> And the field contractUrlExpirationTime must be in the future
> 
> ### Scenario: Contract signed and expired
> Given the application is queried through the GetApplicationStatus endpoint with a valid uuid
> When the contract is signed and has already expired
> Then the field hasSignedLease must be true
> And the field contractUrl must be null
> And the field contractUrlExpirationTime must be in the past
> | PASS | LeadPk: 13493 and 13498 | Merchant: Progress Mobility | 
> ```
>
>



> ## Tests in stg
> ```gherkin
> Given I am on the identity verification process for a merchant
>
> ### Scenario: Contract not signed
> Given the application is queried through the GetApplicationStatus endpoint with a valid uuid
> When the contract is not signed
> Then the field hasSignedLease must be false
> And the field contractUrl must be null
> And the field contractUrlExpirationTime must be present and correctly calculated
> 
> ### Scenario: Contract signed and valid
> Given the application is queried through the GetApplicationStatus endpoint with a valid uuid
> When the contract is signed and has not expired yet
> Then the field hasSignedLease must be true
> And the field contractUrl must be filled with the contract URL
> And the field contractUrlExpirationTime must be in the future
> 
> ### Scenario: Contract signed and expired
> Given the application is queried through the GetApplicationStatus endpoint with a valid uuid
> When the contract is signed and has already expired
> Then the field hasSignedLease must be true
> And the field contractUrl must be null
> And the field contractUrlExpirationTime must be in the past
> | PASS | LeadPk: | Merchant: | 
> ```
>
>

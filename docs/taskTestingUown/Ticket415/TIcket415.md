-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/415



UOWN | SVC | Include ReturnedDate in TaxCloud body request



Synopsis
Currently, when a request is made to TaxCloud for sweep returnPayments, the system sends an empty body.
This needs to be adjusted so that the body includes the field ReturnedDate.



Business Objective
Adding this field ensures that TaxCloud can properly interpret and process payment return data with clear reference to when each transaction was returned.
This change improves data accuracy, traceability, and consistency between our system and TaxCloud’s transaction records.



Feature Request | Business Requirements        
    * Modify the TaxCloud sweep returnPayments request so that the body includes:
        * ReturnedDate
    * Ensure the request body is sent in the proper format expected by TaxCloud.
    * Confirm that requests no longer send an empty body.
    * Validate that TaxCloud receives and processes the information correctly.



Testing Steps
Overview
Verify that refund requests to TaxCloud now include the returnedDate field in the request body.

Prerequisites
Complete Sweep 1 (DailyTaxCloudPaymentsSync) to create an order in TaxCloud
Manually reverse/return a payment in servicing
Verify the payment exists in uown_tax_cloud table



Test Steps
--

Step 1: Create Order in TaxCloud
Sweep 1: DailyTaxCloudPaymentsSync

1. Make a payment in servicing:
2. Verify payment was captured:
SELECT 
usp.pk,
usp.account_pk,
usp.row_created_timestamp,
usp.payment_date
FROM uown_sv_payment usp
WHERE usp.row_created_timestamp::date = CURRENT_DATE;
3. Trigger sweep:
https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync
4. Verify order exists in TaxCloud:
SELECT * 
FROM uown_tax_cloud utc 
WHERE utc.order_id ILIKE '<payment_pk>';

--

Step 2: Reverse/Return Payment

1. Manually reverse the payment in servicing:
2. Verify reversal was captured:
SELECT 
usp.account_pk,
usp.reverse_date_timestamp,
usp.pk AS order_id
FROM uown_sv_payment usp
LEFT JOIN uown_tax_cloud utc
ON utc.order_id = usp.pk::text
WHERE usp.reverse_date_timestamp IS NOT NULL
AND usp.reverse_date_timestamp::date = CURRENT_DATE
AND usp.status = 'REVERSED'
AND (utc.status IS NULL OR utc.status <> 'REFUNDED');

--

Step 3: Trigger Refund Sweep and Verify returnedDate

Sweep 2: DailyTaxCloudRefundsSync

1. Trigger refund sweep:
https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudRefundsSync
2. Verify returnedDate in request body: Check the TaxCloudOutbound table for the refund request:
SELECT 
request,
url,
response,
row_created_timestamp
FROM uown_tax_cloud_outbound
WHERE url LIKE '%refund%'
AND row_created_timestamp::date = CURRENT_DATE
ORDER BY row_created_timestamp DESC
LIMIT 1;
3. Expected Request Body: The request_body should contain:
{
  "items": [],
  "returnedDate": "2024-01-15T10:30:00Z"
}
    * Items should be an empty array
    * ReturnedDate should be present and formatted as RFC3339 (ISO_OFFSET_DATE_TIME with timezone, e.g., 2024-01-15T10:30:00Z)
    * The date should match the reverse_date_timestamp from the payment (converted to UTC)
4. Verify refund status:
SELECT 
utc.order_id,
utc.status,
utc.api
FROM uown_tax_cloud utc
WHERE utc.order_id = '<payment_pk>';
    * status should be 'REFUNDED'
    * api should be 'REFUND'


-----

UOWN | SVC | Incluir ReturnedDate no corpo da requisição para o TaxCloud

Sinopse
Atualmente, quando é feita uma requisição ao TaxCloud para o sweep returnPayments, o sistema envia um corpo vazio.
Isso precisa ser ajustado para que o corpo da requisição inclua o campo ReturnedDate.

Objetivo de Negócio
Adicionar esse campo garante que o TaxCloud possa interpretar e processar corretamente os dados de retorno de pagamento, com uma referência clara sobre quando cada transação foi devolvida.
Essa alteração melhora a precisão dos dados, a rastreabilidade e a consistência entre o nosso sistema e os registros de transação do TaxCloud.

Requisição de Funcionalidade | Requisitos de Negócio
    Modificar a requisição de sweep returnPayments do TaxCloud para que o corpo inclua:
        ReturnedDate
    Garantir que o corpo da requisição seja enviado no formato esperado pelo TaxCloud.
    Confirmar que as requisições não enviem mais um corpo vazio.
    Validar que o TaxCloud receba e processe corretamente as informações enviadas.



Etapas de Teste
--
Etapa 1: Criar Pedido no TaxCloud

Sweep 1: DailyTaxCloudPaymentsSync
1. Realize um pagamento no Servicing:
2. Verifique se o pagamento foi registrado:
    SELECT 
    usp.pk,
    usp.account_pk,
    usp.row_created_timestamp,
    usp.payment_date
    FROM uown_sv_payment usp
    WHERE usp.row_created_timestamp::date = CURRENT_DATE;
3. Dispare o sweep manualmente:
    https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync
4. Verifique se o pedido foi criado no TaxCloud:
    SELECT * 
    FROM uown_tax_cloud utc 
    WHERE utc.order_id ILIKE '<payment_pk>';
--
Etapa 2: Reverter / Devolver Pagamento

1. Reversão manual do pagamento no Servicing:
Verifique se a reversão foi registrada:
    SELECT 
    usp.account_pk,
    usp.reverse_date_timestamp,
    usp.pk AS order_id
    FROM uown_sv_payment usp
    LEFT JOIN uown_tax_cloud utc
    ON utc.order_id = usp.pk::text
    WHERE usp.reverse_date_timestamp IS NOT NULL
    AND usp.reverse_date_timestamp::date = CURRENT_DATE
    AND usp.status = 'REVERSED'
    AND (utc.status IS NULL OR utc.status <> 'REFUNDED');
--
Etapa 3: Executar o Sweep de Reembolso e Verificar returnedDate

Sweep 2: DailyTaxCloudRefundsSync
Dispare o sweep de reembolso:
    https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudRefundsSync
Verifique o campo returnedDate no corpo da requisição — consultar a tabela TaxCloudOutbound:
    SELECT 
    request,
    url,
    response,
    row_created_timestamp
    FROM uown_tax_cloud_outbound
    WHERE url LIKE '%refund%'
    AND row_created_timestamp::date = CURRENT_DATE
    ORDER BY row_created_timestamp DESC
    LIMIT 1;
Corpo da requisição esperado:
    {
    "items": [],
    "returnedDate": "2024-01-15T10:30:00Z"
    }
Verifique o status do reembolso:
    SELECT 
    utc.order_id,
    utc.status,
    utc.api
    FROM uown_tax_cloud utc
    WHERE utc.order_id = '<payment_pk>';
    status deve ser 'REFUNDED'
    api deve ser 'REFUND'

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

 1 arquivo
+
13
−
1
 src/main/java/com/uownleasing/svc/service/sweeps/paymentSweeps/DailyTaxCloudRefundsSync.java 
+
13
−
1

Visualizado
@@ -20,7 +20,10 @@ import org.springframework.stereotype.Service;
import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.Set;
@@ -93,6 +96,7 @@ public class DailyTaxCloudRefundsSync extends BaseSweepService {
            List<CompletableFuture<Void>> futures = resultStream
                .map(row -> CompletableFuture.runAsync(() -> {
                    Long accountPk = ((Number) row[0]).longValue();
                    Object timestampObj = row[1];
                    String orderId = String.valueOf(row[2]);
                    threadIds.add(Thread.currentThread().getId());

@@ -100,7 +104,15 @@ public class DailyTaxCloudRefundsSync extends BaseSweepService {
                        Optional<TaxCloud> taxCloudOpt = refundsService.getTaxCloudOrder(orderId);
                        if (taxCloudOpt.isPresent()) {
                            TaxCloudDefaults defaults = taxCloudService.mapToDefaults(taxCloudConfig);
                            refundsService.processRefund(orderId, accountPk, defaults);
                            
                            String returnedDate = null;
                            if (timestampObj != null) {
                                Timestamp timestamp = (Timestamp) timestampObj;
                                OffsetDateTime offsetDateTime = timestamp.toInstant().atOffset(ZoneOffset.UTC);
                                returnedDate = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(offsetDateTime);
                            }
                            
                            refundsService.processRefund(orderId, returnedDate, accountPk, defaults);
                            totalRecords.incrementAndGet();
                        } else {
                            log.warn("[DailyTaxCloudRefundsSync] TaxCloud order {} not found for account {}", orderId, accountPk);

--------



 5 arquivos
+
122
−
26
Arquivos
5
Pesquisar (por exemplo, *.vue) (F)

s
‎rc‎

main/java/com/uow
‎nleasing/taxcloud‎

pojo/r
‎equests‎

RefundsRe
‎quest.java‎
+12 -0

ser
‎vice‎

exte
‎rnal‎

TaxCloudC
‎lient.java‎
+5 -2

RefundsSe
‎rvice.java‎
+2 -2

test/java/com/uownlea
‎sing/taxcloud/service‎

exte
‎rnal‎

TaxCloudCli
‎entTest.java‎
+58 -9

RefundsServ
‎iceTest.java‎
+45 -13

 src/main/java/com/uownleasing/taxcloud/pojo/requests/RefundsRequest.java  0 → 100644
+
12
−
0

Visualizado
package com.uownleasing.taxcloud.pojo.requests;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class RefundsRequest {
    private List<Object> items = new ArrayList<>();
    private String returnedDate;
}
 src/main/java/com/uownleasing/taxcloud/service/external/TaxCloudClient.java 
+
5
−
2

Visualizado
@@ -7,6 +7,7 @@ import com.uownleasing.taxcloud.exception.TaxCloudException;
import com.uownleasing.taxcloud.pojo.config.TaxCloudDefaults;
import com.uownleasing.taxcloud.pojo.requests.CartsRequest;
import com.uownleasing.taxcloud.pojo.requests.OrdersRequest;
import com.uownleasing.taxcloud.pojo.requests.RefundsRequest;
import com.uownleasing.taxcloud.pojo.requests.VerifyAddressRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@@ -88,9 +89,11 @@ public class TaxCloudClient {
        }
    }

    public String postRefundsRequest(String orderId, TaxCloudDefaults config) {
    public String postRefundsRequest(String orderId, String returnedDate, TaxCloudDefaults config) {
        try {
            String requestJson = "{\"items\":[]}";
            RefundsRequest request = new RefundsRequest();
            request.setReturnedDate(returnedDate);
            String requestJson = objectMapper.writeValueAsString(request);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
 src/main/java/com/uownleasing/taxcloud/service/RefundsService.java 
+
2
−
2

Visualizado
@@ -32,7 +32,7 @@ public class RefundsService {
        log.info("[RefundsService] Marked TaxCloud order {} as REFUNDED", taxCloud.getTaxCloudInfo().getOrderId());
    }

    public void processRefund(String orderId, Long accountPk, TaxCloudDefaults config) {
    public void processRefund(String orderId, String returnedDate, Long accountPk, TaxCloudDefaults config) {
        try {
            Optional<TaxCloud> taxCloudOpt = getTaxCloudOrder(orderId);
            if (taxCloudOpt.isEmpty()) {
@@ -42,7 +42,7 @@ public class RefundsService {

            TaxCloud taxCloud = taxCloudOpt.get();

            String response = taxCloudClient.postRefundsRequest(orderId, config);
            String response = taxCloudClient.postRefundsRequest(orderId, returnedDate, config);

            if (response != null) {
                markAsRefunded(taxCloud);


-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Etapas de Teste
--

Sweep 1: DailyTaxCloudPaymentsSync
1. Realize um pagamento no Servicing:
2. Verifique se o pagamento foi registrado:
    SELECT 
    usp.pk,
    usp.account_pk,
    usp.row_created_timestamp,
    usp.payment_date
    FROM uown_sv_payment usp
    WHERE usp.row_created_timestamp::date = CURRENT_DATE;
3. Dispare o sweep manualmente:
    https://svc-{{env}}.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudPaymentsSync
4. Verifique se o pedido foi criado no TaxCloud:
    SELECT * 
    FROM uown_tax_cloud utc 
    WHERE utc.order_id ILIKE '<payment_pk>';
--
Etapa 2: Reverter / Devolver Pagamento

1. Reversão manual do pagamento no Servicing:
2. Verifique se a reversão foi registrada:
    SELECT 
    usp.account_pk,
    usp.reverse_date_timestamp,
    usp.pk AS order_id
    FROM uown_sv_payment usp
    LEFT JOIN uown_tax_cloud utc
    ON utc.order_id = usp.pk::text
    WHERE usp.reverse_date_timestamp IS NOT NULL
    AND usp.reverse_date_timestamp::date = CURRENT_DATE
    AND usp.status = 'REVERSED'
    AND (utc.status IS NULL OR utc.status <> 'REFUNDED');
--
Etapa 3: Executar o Sweep de Reembolso e Verificar returnedDate

Sweep 2: DailyTaxCloudRefundsSync
Dispare o sweep de reembolso:
    https://svc-qa1.uownleasing.com/uown/svc/triggerScheduledTask/dailyTaxCloudRefundsSync
Verifique o campo returnedDate no corpo da requisição — consultar a tabela TaxCloudOutbound:
    SELECT 
    request,
    url,
    response,
    row_created_timestamp
    FROM uown_tax_cloud_outbound
    WHERE url LIKE '%refund%'
    AND row_created_timestamp::date = CURRENT_DATE
    ORDER BY row_created_timestamp DESC
    LIMIT 1;
Corpo da requisição esperado:
    {
    "items": [],
    "returnedDate": "2024-01-15T10:30:00Z"
    }
Verifique o status do reembolso:
    SELECT 
    utc.order_id,
    utc.status,
    utc.api
    FROM uown_tax_cloud utc
    WHERE utc.order_id = '<payment_pk>';
    status deve ser 'REFUNDED'
    api deve ser 'REFUND'


-------------------------------------------------------------------------------------------------------------------------------------------------------------------------

{
    "userName": "tireAgent",
    "setupPassword": "U0wn_tireAgent_G4eDIH",
    "merchantNumber": "OW90218-0001",
    "mainFirstName": "WIll",
    "mainLastName": "Stark",
    "mainDOB": "09011992",
    "mainSSN": "999018574",
    "emailAddress": "abilaweir8504e@778part.com",
    "mainAddress1": "252 Carlos Bee Blvd",
    "mainCity": "Hayward",
    "mainStateOrProvince": "NY",
    "mainPostalCode": "92614",
    "mainCellPhone": "7772875078",
    "mainEmployerName": "Best Buy",
    "mainPastBankruptcy": false,
    "mainCurrentOrFutureBankruptcy": false,
    "languagePreference": "E",
    "iovationFingerprintText": "fingerPrintText",
    "ipaddress": "192.168.0.2",
    "desiredPaymentFrequency": "WEEKLY",
    "mainAnnualIncome": 510000,
    "mainPayFrequency": "WEEKLY",
    "mainNextPayDate": "11122025",
    "mainLastPayDate": "11052025",
    "mainEmploymentDuration": "_1_TO_2_YEARS",
    "shipToSameAsConsumer": true,
    "merchandiseSubtotal": "808.7",
    "discountAmount": "0.00",
    "deliveryCharge": "57.00",
    "installationCharge": "107.00",
    "salesTax": "0",
    "miscellaneousFees": "333.00",
    "depositAmount": "0.00",
    "orderTotal": "1305.7",
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
            "lineItemUnitPrice": "531.44",
            "lineItemBasePrice": "499",
            "lineItemTaxAmount": "32.44",
            "lineItemExtendedPrice": "531.44"
        },
        {
            "lineItemLineNumber": "318",
            "lineItemSerialNumber": "M68484397",
            "lineItemProductNumber": "A333SKU4444",
            "lineItemProductDescription": "Recliner",
            "lineItemProductCategory": "Seating",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "332.93",
            "lineItemBasePrice": "309.70",
            "lineItemTaxAmount": "23.23",
            "lineItemExtendedPrice": "332.93"
        }
    ]
}
---
{
    "userName": "tireAgent",
    "setupPassword": "U0wn_tireAgent_G4eDIH",
    "merchantNumber": "OW90218-0001",
    "mainFirstName": "Will",
    "mainLastName": "Stark",
    "mainDOB": "09011992",
    "mainSSN": "999018574",
    "emailAddress": "abilaweir8504e@778part.com",
    "mainAddress1": "252 Carlos Bee Blvd",
    "mainCity": "Hayward",
    "mainStateOrProvince": "CA",
    "mainPostalCode": "94542",
    "mainCellPhone": "7772875078",
    "mainEmployerName": "Best Buy",
    "mainPastBankruptcy": false,
    "mainCurrentOrFutureBankruptcy": false,
    "languagePreference": "E",
    "iovationFingerprintText": "fingerPrintText",
    "ipaddress": "192.168.0.2",
    "desiredPaymentFrequency": "WEEKLY",
    "mainAnnualIncome": 510000,
    "mainPayFrequency": "WEEKLY",
    "mainNextPayDate": "2025-11-12",
    "mainLastPayDate": "2025-11-05",
    "mainEmploymentDuration": "_1_TO_2_YEARS",
    "shipToSameAsConsumer": false,
    "shipToAddress1": "200 W 34th St",
    "shipToCity": "New York",
    "shipToStateOrProvince": "NY",
    "shipToPostalCode": "10001",
    "merchandiseSubtotal": "808.70",
    "discountAmount": "0.00",
    "deliveryCharge": "57.00",
    "installationCharge": "107.00",
    "salesTax": "55.67",
    "miscellaneousFees": "333.00",
    "depositAmount": "0.00",
    "orderTotal": "1361.37",
    "invoiceNumber": "R91931",
    "isAmendedReturn": false,
    "lineItem": [
        {
            "lineItemLineNumber": "317",
            "lineItemSerialNumber": "S94712065",
            "lineItemProductNumber": "A561SKU283",
            "lineItemProductDescription": "Ottoman",
            "lineItemProductCategory": "Seating",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "531.44",
            "lineItemBasePrice": "499.00",
            "lineItemTaxAmount": "32.44",
            "lineItemExtendedPrice": "531.44",
            "originState": "CA",
            "destinationState": "NY"
        },
        {
            "lineItemLineNumber": "318",
            "lineItemSerialNumber": "M68484397",
            "lineItemProductNumber": "A333SKU4444",
            "lineItemProductDescription": "Recliner",
            "lineItemProductCategory": "Seating",
            "lineItemType": "D",
            "lineItemQuantityOrdered": "1",
            "lineItemUnitPrice": "332.93",
            "lineItemBasePrice": "309.70",
            "lineItemTaxAmount": "23.23",
            "lineItemExtendedPrice": "332.93",
            "originState": "CA",
            "destinationState": "TX"
        }
    ]
}
---
🧾 Contexto rápido

Você montou um pedido com dois itens:

Item	Origem	Destino	Base Price	Tax Amount	Tax Rate Calculada
Ottoman	CA	NY	499.00	32.44	6.5%
Recliner	CA	TX	309.70	23.23	7.5%
🌎 Verificando taxas reais de jurisdição (TaxCloud)
Estado	Taxa média de Sales Tax (combinada estadual + local)	Observação
New York (NY)	~8.52%	NY cobra 4% estadual + média de 4.5% municipal (depende da cidade, ex: NYC 8.875%)
Texas (TX)	~8.20%	6.25% estadual + até 2% local (varia conforme a cidade)
🧮 Comparando com o seu body

Ottoman – CA → NY

Esperado (NYC): entre 8.5% e 8.875%

Body usa: 32.44 / 499 = 6.5% → abaixo do esperado
✅ Estrutura OK, ❌ taxa levemente subestimada (NY deveria ser ~42.4 para 499 base).

Recliner – CA → TX

Esperado: 8.2%

Body usa: 23.23 / 309.70 = 7.5% → razoável, dentro de variação aceitável por cidade (TX pode ter 7.5% em algumas localidades).
✅ Conclusão
Item	TaxCloud Jurisdição Esperada	Taxa Body	Aderência
Ottoman (CA→NY)	~8.5–8.875%	6.5%	⚠️ Um pouco abaixo
Recliner (CA→TX)	~8.2%	7.5%	✅ Aceitável

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------


LeadPk 10400
AccountPk 4297

https://svc-website-qa1.uownleasing.com/payment-history/4297

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------
> ## Tests in qa1


> ```gherkin

> **When executing the DailyTaxCloudRefundsSync sweep for payments with multiple items that have different tax rates by state, the request to TaxCloud must include the returnedDate field. In the uown_tax_cloud table, the transaction status must be 'REFUNDED' and the API must be 'REFUND'. In the uown_tax_cloud_outbound table, the request field must contain a JSON object with items as an empty array, and the returnedDate field in the request must correspond to the reverse_date_timestamp converted to UTC.**

> ![Screenshot_at_Nov_06_14-37-27](/uploads/859e1aec524cc36d75ba63fa55cdf0e5/Screenshot_at_Nov_06_14-37-27.png){width=900 height=291}
> ![Screenshot_at_Nov_06_14-37-44](/uploads/cae4abf0f414cf0b806cb5740a40795e/Screenshot_at_Nov_06_14-37-44.png){width=900 height=30}
> ![Screenshot_at_Nov_06_14-40-24](/uploads/8cc61ab074e4cb748f599987a85be882/Screenshot_at_Nov_06_14-40-24.png){width=533 height=50}
> ![Screenshot_at_Nov_06_14-40-58](/uploads/02955d8187db1a9aa2ea278154647d10/Screenshot_at_Nov_06_14-40-58.png){width=900 height=29}
> ![Screenshot_at_Nov_06_15-11-49](/uploads/f9f9a569e44eb3ce4cfc9902479cec22/Screenshot_at_Nov_06_15-11-49.png){width=900 height=248}
> ![Screenshot_at_Nov_06_15-12-59](/uploads/5e8dc8e38472dbcfbd197dc7a3ef430c/Screenshot_at_Nov_06_15-12-59.png){width=900 height=26}
> ![Screenshot_at_Nov_06_15-17-58](/uploads/211d997bb84a4ed010c01349edcfb52e/Screenshot_at_Nov_06_15-17-58.png){width=504 height=55}
> ![Screenshot_at_Nov_06_15-18-49](/uploads/7c6c1593b6bebbaec9f9999f7595ea19/Screenshot_at_Nov_06_15-18-49.png){width=900 height=29}
> ![Screenshot_at_Nov_06_15-24-38](/uploads/77d08be8db280b8925ac93c8f3bebf3e/Screenshot_at_Nov_06_15-24-38.png){width=765 height=488}
> ![Screenshot_at_Nov_06_15-28-11](/uploads/72dedb95e173ae270afd582740ea4677/Screenshot_at_Nov_06_15-28-11.png){width=350 height=55}

> **| PASS |  AccountPk: 4297 and 4298  |**
> ```

---

> ```gherkin

> **When multiple payments are reversed simultaneously and the DailyTaxCloudRefundsSync sweep is triggered, each request sent to TaxCloud must contain the correct returnedDate without conflicts**



> **| PASS | AccountPk: 4297 |**
> ```

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------



> ## Tests in stg


> ```gherkin

> **When executing the DailyTaxCloudRefundsSync sweep for payments with multiple items that have different tax rates by state, the request to TaxCloud must include the returnedDate field. In the uown_tax_cloud table, the transaction status must be 'REFUNDED' and the API must be 'REFUND'. In the uown_tax_cloud_outbound table, the request field must contain a JSON object with items as an empty array, and the returnedDate field in the request must correspond to the reverse_date_timestamp converted to UTC.**

> ![image](/uploads/5d955076deca1faa276e1a2a4be336c6/image.png){width=900 height=265}
> ![image](/uploads/08dcbf824c5fe69eaec463c4178753de/image.png){width=660 height=53}
> ![image](/uploads/1999caa965ccb6486f26276a6390b3c9/image.png){width=461 height=142}

> **| PASS |  AccountPk: 206867  |**
> ```

---

> ```gherkin

> **When multiple payments are reversed simultaneously and the DailyTaxCloudRefundsSync sweep is triggered, each request sent to TaxCloud must contain the correct returnedDate without conflicts**

> ![image](/uploads/594d458d54e8031a3c0f3690c87ee85d/image.png){width=510 height=331}
> ![image](/uploads/f1bed8143724085b6d864011b0c6713b/image.png){width=300 height=328}

> **| PASS | AccountPk: 206867 |**
> ```

---


-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
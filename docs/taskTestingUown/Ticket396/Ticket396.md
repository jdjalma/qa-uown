--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/svc/-/issues/396

UOWN | Servicing | Implement TaxCloud API
Aberto
  Tíquete criado 3 semanas atrás por Yuri Araujo
Synopsis
Implement TaxCloud API as the new tax rate provider. Handle TaxJar vs TaxCloud usage by config

API REFERENCE: https://docs.taxcloud.com/api-reference/api-reference/sales-tax-api/cart/create-cart

Business Objective
A brief summary of the result the company aims to achieve

Feature Request | Business Requirements
Remove dependency on TaxJar for tax rate lookups.
Integrate the TaxCloud API to perform tax rate queries.
Update all existing workflows and endpoints that currently use TaxJar to point to TaxCloud.
Ensure returned tax rate data is consistent with existing system expectations and formats.
Validate correctness of responses by comparing sample queries between TaxJar (legacy) and TaxCloud (new).
Update configuration and deployment settings to support TaxCloud credentials.
Provide test coverage to ensure tax rates are retrieved and applied correctly using TaxCloud.

Testing Steps
After the changes, TaxCloud is now the primary tax provider.
Taxes are calculated when calling either:


sendApplication (when a invoice with items is created alongside it), or

/sendInvoice endpoint.

Validation

Create a new application in origination.
Confirm that a valid tax rate and amount were returned.
Check the TaxCloud table, the following columns should be populated:

cart_id
tax_amount
tax_rate

-----

Título UOWN | Servicing | Implementar TaxCloud API Status: Aberto Tíquete criado há 3 semanas por Yuri Araujo

Sinopse Implementar a API do TaxCloud como o novo provedor de taxa de imposto. Controlar o uso de TaxJar vs TaxCloud via configuração.

Referência da API API REFERENCE: https://docs.taxcloud.com/api-reference/api-reference/sales-tax-api/cart/create-cart

Objetivo de Negócio Um resumo do resultado que a empresa deseja alcançar

Requisitos de Funcionalidade | Regras de Negócio

Remover a dependência do TaxJar para consultas de taxa de imposto.
Integrar a API do TaxCloud para realizar consultas de taxa de imposto.
Atualizar todos os fluxos e endpoints existentes que atualmente usam o TaxJar para apontarem para o TaxCloud.
Garantir que os dados de taxa retornados estejam consistentes com as expectativas e formatos do sistema atual.
Validar a correção das respostas comparando consultas de amostra entre o TaxJar (legado) e o TaxCloud (novo).
Atualizar configurações e parâmetros de deploy para suportar as credenciais do TaxCloud.
Fornecer cobertura de testes para garantir que as taxas sejam obtidas e aplicadas corretamente usando o TaxCloud.

Passos de Teste Após as mudanças, o TaxCloud passa a ser o provedor primário de taxas. Os impostos são calculados quando chamar:
sendApplication (quando uma invoice com itens é criada junto com a aplicação), ou
o endpoint /sendInvoice.
Validações

Criar uma nova aplicação no Origination.
Confirmar que uma taxa de imposto (tax rate) e um valor de imposto (tax amount) válidos foram retornados.
Verificar a tabela do TaxCloud; as seguintes colunas devem estar populadas:
cart_id
tax_amount
tax_rate

------

alterações dev:
 src/main/java/com/uownleasing/svc/service/SvAccountService.java 
+
1
−
0

Visualizado
@@ -26,6 +26,7 @@ import com.uownleasing.svc.pojo.MerchantInfo;
import com.uownleasing.svc.pojo.RemainingApprovalAmountInfo;
import com.uownleasing.svc.pojo.embeddable.DueDateMoveInfo;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.tax.TaxService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
 src/main/java/com/uownleasing/svc/service/TaxService.java excluído  100644 → 0
+
0
−
165

Visualizado
package com.uownleasing.svc.service;

import com.uownleasing.dms.common.configuration.*;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.*;
import com.uownleasing.svc.db.repository.*;
import com.uownleasing.svc.exceptions.*;
import com.taxjar.*;
import com.taxjar.exception.*;
import com.taxjar.model.rates.*;
import lombok.*;
import lombok.extern.slf4j.*;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.*;
import org.apache.commons.lang3.builder.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;

import java.math.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
@Getter
@Setter
@RequiredArgsConstructor
@Slf4j
public class TaxService {

    private final ConfigurationManagement configUtil;

    private final TaxForZipRepo taxForZipRepo;

    private final MerchantService merchantService;

    protected String configurationPath = "com.uownleasing.svc.service.TaxService.";

    public BigDecimal getTaxForZip(Long leadPk, Long accountPk, String streetAddress, String city, String state, String zipCode, String country, String merchantRefCode) throws TaxjarException {
        //6434d5dc6381b7f2987cd0b4eb4906d6
        //e0d0a163348342988580bfa648f3c052
        //855ec2ab72b2f2841a40171b46b1c3f1 // 855ec2ab72b2f2841a40171b46b1c3f1
        //c6f8f2089a868929c580c4606e0d154b
        //e6ddc5d4d8c67506c1f4e1dc8269d6b2
        if (StringUtils.isNotBlank(streetAddress))
            streetAddress = streetAddress.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(city))
            city = city.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(state))
            state = state.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(zipCode))
            zipCode = zipCode.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(country))
            country = country.trim().replaceAll("\\s+", " ");

        BigDecimal taxRate = new BigDecimal(configUtil.getDouble("override.combined.tax.rate.for.zip."+zipCode, 0.0));
        if(taxRate != null && taxRate.compareTo(BigDecimal.ZERO) > 0){
            log.info("Returned configured taxrate for zip {} as {}", zipCode, taxRate);
            return taxRate;
        }
        if(StringUtils.isBlank(country)){
            country = "US";
        }

        if (StringUtils.isNotBlank(merchantRefCode)) { // check for tax exemptions
            Merchant merchant = merchantService.getActiveMerchantByMerchantCode(merchantRefCode);
            if (merchant == null) {
                List<Merchant> merchants = merchantService.getMerchantsByRefCode(merchantRefCode);
                if (CollectionUtils.isNotEmpty(merchants)) {
                    merchant = merchants.get(0);
                }
            }

            if (merchant != null &&
                merchant.getMerchantInfo().getTaxExemptedStates() != null &&
                Arrays.asList(merchant.getMerchantInfo().getTaxExemptedStates().split(",")).contains(state)) {
                return BigDecimal.ZERO;
            }
        }

        TaxForZip taxForZip = null;
        if(configUtil.getBoolean("get.tax.from.db", true)) {
            taxForZip = taxForZipRepo.findFirstByStreetAndCityAndStateAndZipCodeAndCountryOrderByRowCreatedTimestampDesc(streetAddress, city, state, zipCode, country);
        }
        if (taxForZip != null && taxForZip.getExpirationDate() != null && !(taxForZip.getExpirationDate().isEqual(LocalDate.now()) || taxForZip.getExpirationDate().isBefore(LocalDate.now()))){
            log.info("Returning taxRate from db for zip {} as {}", zipCode, taxRate);
            taxRate = taxForZip.getCombinedTaxRate();
        }else {
            String apiToken = configUtil.getString("tax.jar.api.key", SystemConfigurationManagement.isProduction() ? "3ee73ccc6b2188269aa7b481c38657b1" : "e6ddc5d4d8c67506c1f4e1dc8269d6b2");
            Map<String, Object> params = new HashMap<>();
            params.put("apiUrl", configUtil.getString("tax.jar.api.url", SystemConfigurationManagement.isProduction() ? "https://api.taxjar.com" : "https://api.sandbox.taxjar.com"));
            Taxjar taxjar = new Taxjar(apiToken, params);
            log.info("TaxJar apiUrl {}, token {}", taxjar.getApiConfig("apiUrl"), apiToken);
            Map<String, String> queryParams = new HashMap<>();
            if(StringUtils.isNotBlank(streetAddress)){
                queryParams.put("street", streetAddress);
            }
            if(StringUtils.isNotBlank(city)) {
                queryParams.put("city", city);
            }
            if(StringUtils.isNotBlank(state)) {
                queryParams.put("state", state);
            }
            queryParams.put("country", StringUtils.isBlank(country) ? "US" : country);
            RateResponse rateResponse = taxjar.ratesForLocation(zipCode, queryParams);
            log.info("RateResponse {}, {}, {}, {}", rateResponse.rate.getCombinedRate(), rateResponse.rate.getState(), rateResponse.rate.getCity(), rateResponse.rate.getZip());
            log.info("Object : {}", ToStringBuilder.reflectionToString(rateResponse.rate));
            if (rateResponse == null || rateResponse.rate == null) {
                //return new BigDecimal(configUtil.getDouble("tax.rate.for.zip."+zipCode, 0.02));
                throw new SvcException("Error retrieving tax rate from TaxJar API for zip " + zipCode);
            }
            taxRate = new BigDecimal(rateResponse.rate.getCombinedRate()).setScale(6, RoundingMode.HALF_EVEN);
            if(configUtil.getBoolean("save.tax.to.db", true)){
                taxForZip = taxForZipRepo.findFirstByStreetAndCityAndStateAndZipCodeAndCountryOrderByRowCreatedTimestampDesc(streetAddress, city, state, zipCode, country);
                if(taxForZip == null){
                    taxForZip = new TaxForZip();
                }
                if (taxForZip.getExpirationDate() == null || taxForZip.getExpirationDate().isEqual(LocalDate.now()) || taxForZip.getExpirationDate().isBefore(LocalDate.now())) {
                    LocalDate date = ObjectUtils.firstNonNull(taxForZip.getRowUpdatedTimestamp(), taxForZip.getRowCreatedTimestamp(), LocalDateTime.now()).toLocalDate();
                    taxForZip.setExpirationDate(date.plusDays(configUtil.getInteger("tax.rate.for.zip.expiration", 30)));
                }
                taxForZip.setStreet(streetAddress);
                taxForZip.setCity(city);
                taxForZip.setState(state);
                taxForZip.setZipCode(zipCode);
                taxForZip.setCounty(rateResponse.rate.getCounty());
                taxForZip.setCountry(country);
                taxForZip.setTaxJarResponse(ToStringBuilder.reflectionToString(rateResponse.rate));
                taxForZip.setCombinedTaxRate(taxRate);
                taxForZip.setTaxJarApiUrl((String) params.get("apiUrl"));
                taxForZip.setTaxJarToken(apiToken);
                taxForZip.setTaxJarParams(queryParams.toString());
                taxForZipRepo.save(taxForZip);
            }
        }
        log.info("[TaxService][TaxForZip] Returning tax for zipCode {} as {}", zipCode, taxRate);
        return taxRate;

    }

    //Find for TaxForZip that is already created and saved in our db
    public TaxForZip findTaxForZipInDB(String streetAddress, String city, String state, String zipCode, String country){

        if (StringUtils.isNotBlank(streetAddress))
            streetAddress = streetAddress.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(city))
            city = city.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(state))
            state = state.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(zipCode))
            zipCode = zipCode.trim().replaceAll("\\s+", " ");
        if (StringUtils.isNotBlank(country))
            country = country.trim().replaceAll("\\s+", " ");


        if(StringUtils.isBlank(country)){
            country = "US";
        }

        return taxForZipRepo.findFirstByStreetAndCityAndStateAndZipCodeAndCountryOrderByRowCreatedTimestampDesc(streetAddress, city, state, zipCode, country);
    }


}
 src/main/java/com/uownleasing/svc/uownClient/StorisClient.java 
+
1
−
0

Visualizado
@@ -17,6 +17,7 @@ import com.uownleasing.svc.service.application.GetApplicationStatusService;
import com.uownleasing.svc.service.application.LeadInvoiceService;
import com.uownleasing.svc.service.application.LeadItemService;
import com.uownleasing.svc.service.cc.CCTransactionService;
import com.uownleasing.svc.service.tax.TaxService;
import com.uownleasing.svc.utility.XMLUtils;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
 src/test/java/com/uownleasing/svc/TaxServiceTest.java 
+
1
−
1

Visualizado
package com.uownleasing.svc;

import com.uownleasing.svc.service.TaxService;
import com.uownleasing.svc.service.tax.TaxService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Documentacao tax TaxCloud
Calculate sales tax for one or more carts
POST
https://api.v3.taxcloud.com/tax/connections/:connectionId/carts
POST
/tax/connections/:connectionId/carts

curl -X POST https://api.v3.taxcloud.com/tax/connections/25eb9b97-5acb-492d-b720-c03e79cf715a/carts \
     -H "X-API-KEY: <apiKey>" \
     -H "Content-Type: application/json" \
     -d '{
  "items": [
    {
      "currency": {},
      "customerId": "customer-453",
      "destination": {
        "city": "Minneapolis",
        "line1": "323 Washington Ave N",
        "state": "MN",
        "zip": "55401-2427"
      },
      "lineItems": [
        {
          "index": 0,
          "itemId": "item-1",
          "price": 10.75,
          "quantity": 1.5
        }
      ],
      "origin": {
        "city": "Minneapolis",
        "line1": "323 Washington Ave N",
        "state": "MN",
        "zip": "55401-2427"
      }
    }
  ]
}'
Try it
200
Successful

{
  "connectionId": "25eb9b97-5acb-492d-b720-c03e79cf715a",
  "items": [
    {
      "cartId": "my-cart-1",
      "currency": {
        "currencyCode": "string"
      },
      "customerId": "customer-453",
      "deliveredBySeller": false,
      "destination": {
        "city": "Minneapolis",
        "countryCode": "US",
        "line1": "323 Washington Ave N",
        "state": "MN",
        "zip": "55401-2427",
        "line2": "string"
      },
      "exemption": {
        "exemptionId": "string",
        "isExempt": true
      },
      "lineItems": [
        {
          "index": 0,
          "itemId": "item-1",
          "price": 10.75,
          "quantity": 1.5,
          "tax": {
            "amount": 1.31,
            "rate": 0.08125
          },
          "tic": 0
        }
      ],
      "origin": {
        "city": "Minneapolis",
        "countryCode": "US",
        "line1": "323 Washington Ave N",
        "state": "MN",
        "zip": "55401-2427",
        "line2": "string"
      }
    }
  ],
  "transactionDate": "2024-08-01T14:00:00Z",
  "$schema": "https://example.com/tax/schemas/CreateCartsResponse.json"
}

-----
bad request
{
  "$schema": "string",
  "detail": "string",
  "errors": [
    {
      "location": "string",
      "message": "string",
      "value": {}
    }
  ],
  "instance": "string",
  "status": 99999,
  "title": "string",
  "type": "string"
}

-----

unauthorized
{
  "$schema": "string",
  "detail": "string",
  "errors": [
    {
      "location": "string",
      "message": "string",
      "value": {}
    }
  ],
  "instance": "string",
  "status": 99999,
  "title": "string",
  "type": "string"
}

-----

forbiden
{
  "$schema": "string",
  "detail": "string",
  "errors": [
    {
      "location": "string",
      "message": "string",
      "value": {}
    }
  ],
  "instance": "string",
  "status": 99999,
  "title": "string",
  "type": "string"
}

-----

Unprocessable entity
{
  "$schema": "string",
  "detail": "string",
  "errors": [
    {
      "location": "string",
      "message": "string",
      "value": {}
    }
  ],
  "instance": "string",
  "status": 99999,
  "title": "string",
  "type": "string"
}

-----

Too many requests
{
  "$schema": "string",
  "detail": "string",
  "errors": [
    {
      "location": "string",
      "message": "string",
      "value": {}
    }
  ],
  "instance": "string",
  "status": 99999,
  "title": "string",
  "type": "string"
}

-----

Internal server error
{
  "$schema": "string",
  "detail": "string",
  "errors": [
    {
      "location": "string",
      "message": "string",
      "value": {}
    }
  ],
  "instance": "string",
  "status": 99999,
  "title": "string",
  "type": "string"
}

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

R7.25.1.44.0_ImplementTaxCloudAPI_Ticket396

--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

> ## Tests in qa1

> ```gherkin
> ### Scenario Outline: Implement TaxCloud API in "<env>"
> Given Create test account with state <state> and merchant "<merchant>", save data file if the following argument is yes: "yes"
> And Tax details should be present in the last API response
> And TaxCloud record should exist for the current lead with populated fields
> And Test is successful
> 
> Examples:
> | env | state | merchant         | browser |
> | qa1 | TX    | ProgressMobility | chrome  |
> 
> | PASS | LeadPk / AccountPk | Merchant | 
> ```
>
>

---

> ```gherkin
> ### Scenario Outline: Implement TaxCloud API via sendApplication in "<env>"
> Given Begin UownUnifiedFlow
> Then I send invoice via API
> And Tax details should be present in the last API response
> And TaxCloud record should exist for the current lead with populated fields
> And Test is successful
> 
> Examples:
> | env |  browser |
> | qa1 |  chrome  |
> 
> | PASS | LeadPk | AccountPk | Merchant | 
> ```
>
>


--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



🧾 Roteiro de Teste Manual — Integração TaxCloud
🔹 Cenário 1 — Criar conta e validar TaxCloud (Implement TaxCloud API in QA1)

Criar conta de teste
Ambiente: qa1

Estado: TX

Merchant: ProgressMobility

Anotar o LeadPk gerado.

Verificar resposta da API

Após a criação, checar se a última resposta da API contém tax details (detalhes de imposto).

Verificar no banco (TaxCloud record)

Consultar o lead criado (LeadPk) no banco ou logs.

Confirmar que existe um registro TaxCloud associado.

Campos obrigatórios devem estar populados (não nulos).

Resultado esperado

API traz detalhes de imposto.

Registro TaxCloud existe e está preenchido.

Teste marcado como PASS.

Exemplo de saída:

| PASS | LeadPk: 9839 | Merchant: Progress Mobility |

🔹 Cenário 2 — Envio de aplicação via API (Implement TaxCloud API via sendApplication in QA1)

Iniciar fluxo UownUnifiedFlow

Ambiente: qa1

Browser: Chrome

Enviar invoice via API (sendApplication)

Seguir o fluxo normal de aplicação.

Verificar resposta da API

Conferir se a resposta traz tax details.

Verificar no banco (TaxCloud record)

Consultar o lead processado.

Confirmar que o registro TaxCloud foi criado e está populado.

Resultado esperado

API retorna os detalhes de imposto.

Registro TaxCloud existe.

Teste marcado como PASS.

Exemplo de saída:

| PASS |

✅ Checklist de Validação

 Conta criada no qa1 com estado TX e merchant ProgressMobility.

 Resposta da API contém tax details.

 Registro TaxCloud criado e populado no banco.

 Para envio via sendApplication, mesma validação acima.

 Resultado final marcado como PASS.

 -----
TX
 {
    "faults": false,
    "fieldInError1": null,
    "fieldInError2": null,
    "fieldInError3": null,
    "fieldInError4": null,
    "fieldInError5": null,
    "sorErrorDescription": null,
    "transactionMessage": null,
    "accountNumber": "63b50d69-d222-4a40-bc54-cd44d0d489b1",
    "authorizationNumber": "10066",
    "providerURL": null,
    "merchantName": "Progress Mobility Acquisition LLC",
    "customerFirstName": "Rick",
    "customerLastName": "Astley",
    "orderTotal": 1310.00,
    "purchaseNowTotal": 0,
    "purchaseNowTotalWithTax": 0,
    "externalReferenceId": null,
    "invoiceItems": [
        {
            "lineItemId": 19171,
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
            "lineItemExtendedPrice": 500.00,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Ottoman"
        },
        {
            "lineItemId": 19172,
            "lineItemLineNumber": 318,
            "lineItemProductNumber": "A333SKU4444",
            "lineItemSerialNumber": "M68484397",
            "lineItemProductCategory": "Seating",
            "lineItemType": "DEBIT_SALE",
            "lineItemQuantityOrdered": 1,
            "lineItemUnitPrice": 300.00,
            "lineItemBasePrice": 300.00,
            "lineItemTaxAmount": 0.00,
            "lineItemDeliveryFee": 0,
            "lineItemExtendedPrice": 300.00,
            "lineItemExtendedDeliveryFee": 0,
            "deliveryDate": null,
            "deliveryType": null,
            "lineItemStatus": "ADDED_TO_CART",
            "lineitemProductDescription": "Recliner"
        }
    ],
    "transactionStatus": "E0",
    "appApprovalStatus": "APPROVED",
    "creditLimit": 5136,
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
    "locationName": "Progress Mobility",
    "lambdaScore": null,
    "isPlaidRequired": false,
    "paymentDetailsList": [
        {
            "redirectUrl": "https://origination-qa1.uownleasing.com/completeApplication?uuid=63b50d69-d222-4a40-bc54-cd44d0d489b1_8658410430811127808&selectedPaymentFrequency=WEEKLY&isBranded=false",
            "totalContractAmountWithTax": 3030.39,
            "totalContractAmountNoTax": 2802.49,
            "regularPaymentWithTax": 53.40,
            "numberOfPayments": 56,
            "frequency": "WEEKLY",
            "firstPaymentWithFeesAndTax": 93.40,
            "firstPaymentWithFeesNoTax": 89.33,
            "firstPaymentDate": "2025-10-12",
            "paymentDueToday": 40.00
        },
        {
            "redirectUrl": "https://origination-qa1.uownleasing.com/completeApplication?uuid=63b50d69-d222-4a40-bc54-cd44d0d489b1_8658410430811127808&selectedPaymentFrequency=BI_WEEKLY&isBranded=false",
            "totalContractAmountWithTax": 3030.39,
            "totalContractAmountNoTax": 2802.49,
            "regularPaymentWithTax": 106.80,
            "numberOfPayments": 28,
            "frequency": "BI_WEEKLY",
            "firstPaymentWithFeesAndTax": 146.80,
            "firstPaymentWithFeesNoTax": 138.66,
            "firstPaymentDate": "2025-10-12",
            "paymentDueToday": 40.00
        }
    ]
}




10066
screen 80
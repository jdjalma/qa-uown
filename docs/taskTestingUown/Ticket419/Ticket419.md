---------------------------------------------------------------------------------------------------------------------------------------------------------


https://gitlab.com/uown/backend/svc/-/issues/419

UOWN | SVC | Update UW API to use GDS Instead of Taktile

Testing Steps

1. Configuration (DevOps)
In the devops configuration, ensure:
Taktile is disabled and GDS is enabled for the underwriting decision.
use:
    taktile:
        for:
            decision: "false"
gds:
    for:
        decision: "true"

2. Create a New Application
Create a new application through the portal or the API
Check the uown_los_uwdata table to confirm that underwriting ran and was decided by GDS.
What to check:
Column / check
Expected when GDS was used
decided_by_agent
'GDS'.
uw_status
'APPROVED', 'DENIED', or 'OTHER' depending on GDS response (e.g. ACCEPT → APPROVED, REJECT → DENIED, ERROR → OTHER).
approval_amount
Numeric value matching GDS credit_limit.
decision_made_at
Timestamp of when the decision was made.
lead_pk
The lead PK for the application you just created.
abb_uw_response (TEXT)
JSON blob of the parsed UWResponse; should contain GDS fields (e.g. decision, creditLimit, decisionAgent: "GDS", term).
charge_processing_fee
true only when GDS returned payment_due_today = "Y".
![alt text](image.png)

3. Other Data to Check in Related Tables
Lead (e.g. uown_los_lead / LeadInfo)
After the calculateMaxApprovalAmount step runs, the lead is updated with:
Field (typical column name)
Description
approval_amount
Set from UW approval amount (GDS credit_limit).
max_approval_amount
Approval amount plus over-approval % (from LeadMaxApprovalService).
So for a GDS-approved application that went through the full pipeline, you should see approval_amount and max_approval_amount populated and consistent with the row in uown_los_uwdata (approval amount from UW; max = approval + over-approval).
GDS token
Confirm the service is obtaining a GDS token:
Table uown_gds_token: should have a row with a non-null access_token and expiration_time in the future.

4. Validate GDS Request Payload in Outbound API Log
Check the uown_los_outbound_api_log table to verify the actual GDS request payload that was sent to the GDS transaction endpoint.
What to check:
Find the row for the lead PK where the api_log_info.url matches the GDS transaction URL (e.g. https://uown.uat.me.dataview360.com/transaction).
Inspect the api_log_info.request column (TEXT/JSON) which contains the full JSON payload sent to GDS.
Condition for Applicant.InvoiceItems to be present:
The data.extra.Applicant.InvoiceItems array will only be present in the GDS request if:
Invoice items exist for the lead at the time underwriting runs.
Items are created before the underwriting call is made.
What to verify in the request JSON:
data.extra.Applicant object exists (if items were present during UW).
data.extra.Applicant.InvoiceItems array contains invoice items.
Each item in the array has:
Quantity (Integer)
Price (Double, per unit)
ProductType (String)
Description (String)
Top-Level Fields (data)
Verify the following top-level fields are present and populated:
Field
Type
Description
data.leadPk
Number
Internal lead primary key
data.campaignID
Number
Campaign identifier
data.ipAddress
String
Client IP address
data.ssn
String
Social Security Number
data.firstName
String
Applicant first name
data.lastName
String
Applicant last name
data.streetAddress
String
Street address
data.city
String
City
data.state
String
State code (e.g. "OH")
data.zipCode
String
ZIP code
data.mobilePhone
String
Phone number
data.dateOfBirth
String
Date of birth (ISO format, e.g. "1999-12-01")
data.payPeriod
String
Pay period frequency (e.g. "BIWEEKLY")
data.email
String
Email address
data.subID
String
Submission/lead UUID
data.subID2
String
Merchant reference code
data.testKey
String
Only present in non-production environments. Should be absent when IS_PRODUCTION=true (prod credentials)
Extra Fields (data.extra)
Verify the following extra fields are present and populated when applicable:
Field
Type
Description
Condition
data.extra.inventoryCategory
String
Inventory category (e.g. "TIRES_&_WHEELS", "ELECTRONICS")
Set when isSetInventoryCategory() config is enabled
data.extra.leaseAmount
Number
Lease/loan amount
Always set for GDS requests
data.extra.returningCount
Integer
Count of signed leads (returning customers)
Always set (defaults to 0 if no previous leads)
data.extra.prevLeaseCount
Integer
Count of all previous leads
Always set (defaults to 0 if no previous leads)
data.extra.bankingData
Object
Banking information
Set when auto-pay bank account exists
data.extra.bankingData.routingNumber
String
Bank routing number
Within bankingData object
data.extra.bankingData.accountNumber
String
Bank account number
Within bankingData object
data.extra.creditCardBin
String
Credit card BIN (6-8 digits)
Set when lead has credit card BIN
data.extra.seonFingerprintText
String
SEON fingerprint text
Set from lead (empty string if not available)
data.extra.iovationFingerprint
String
Iovation fingerprint text
Set from lead (empty string if not available)
Note: Fields marked with @JsonInclude(JsonInclude.Include.NON_NULL) will be omitted from the JSON if they are null. Fields that are conditionally set (e.g. bankingData, creditCardBin, Applicant.InvoiceItems) may not appear if the underlying data is not available.


---------------------------------------------------------------------------------------------------------------------------------------------------------

Tarefa portugues:

Aqui está o roteiro de testes traduzido para português:

---

## Passos de Teste

1. **Configuração (DevOps)**
   - Na configuração do DevOps, garanta:
     - Taktile desativado e GDS ativado para a decisão de underwriting.
     - Use:
       ```yaml
       taktile:
         for:
           decision: "false"
       gds:
         for:
           decision: "true"
       ```

2. **Criar uma Nova Aplicação**
   - Crie uma nova aplicação pelo portal ou API.
   - Verifique a tabela `uown_los_uwdata` para confirmar que o underwriting foi executado e decidido pelo GDS.

   **O que verificar (coluna/checagem → esperado quando GDS foi usado):**
   - `decided_by_agent`: `"GDS"`.
   - `uw_status`: `'APPROVED'`, `'DENIED'` ou `'OTHER'` conforme a resposta do GDS (ex.: `ACCEPT → APPROVED`, `REJECT → DENIED`, `ERROR → OTHER`).
   - `approval_amount`: valor numérico igual a `credit_limit` retornado pelo GDS.
   - `decision_made_at`: timestamp do momento da decisão.
   - `lead_pk`: PK do lead da aplicação criada.
   - `abb_uw_response` (TEXT): blob JSON da UWResponse parseada; deve conter campos do GDS (ex.: `decision`, `creditLimit`, `decisionAgent: "GDS"`, `term`).
   - `charge_processing_fee`: `true` apenas se o GDS retornou `payment_due_today = "Y"`.

3. **Outros Dados para Conferir em Tabelas Relacionadas**
   - **Lead (ex.: `uown_los_lead` / `LeadInfo`):** após `calculateMaxApprovalAmount`, o lead deve ter:
     - `approval_amount`: vindo do UW (GDS `credit_limit`).
     - `max_approval_amount`: `approval_amount` + % de over-approval (serviço `LeadMaxApprovalService`).
     - Assim, para uma aprovação GDS que percorreu o pipeline completo, `approval_amount` e `max_approval_amount` devem estar preenchidos e consistentes com a linha em `uown_los_uwdata`.
   - **Token GDS:** confirme que o serviço obteve um token GDS:
     - Tabela `uown_gds_token`: deve ter uma linha com `access_token` não nulo e `expiration_time` no futuro.

4. **Validar o Payload da Requisição GDS no Log de Outbound API**
   - Verifique a tabela `uown_los_outbound_api_log` para o payload enviado ao endpoint de transação GDS.
   - Localize a linha do `lead_pk` em que `api_log_info.url` corresponde à URL de transação do GDS (ex.: `https://uown.uat.me.dataview360.com/transaction`).
   - Inspecione `api_log_info.request` (TEXT/JSON) com o JSON enviado ao GDS.

   **Condição para presença de `Applicant.InvoiceItems`:**
   - O array `data.extra.Applicant.InvoiceItems` só aparece se:
     - Existem invoice items para o lead no momento do underwriting.
     - Os items são criados antes da chamada de underwriting.

   **O que verificar no JSON de requisição:**
   - `data.extra.Applicant` existe (se havia items).
   - `data.extra.Applicant.InvoiceItems` contém os itens.
   - Cada item tem: `Quantity` (Integer), `Price` (Double, por unidade), `ProductType` (String), `Description` (String).

   **Campos de nível superior (`data`) a validar:**
   - `data.leadPk` (Number): PK interno do lead.
   - `data.campaignID` (Number): identificador da campanha.
   - `data.ipAddress` (String): IP do cliente.
   - `data.ssn` (String): SSN.
   - `data.firstName` / `data.lastName` (String): nome e sobrenome.
   - `data.streetAddress`, `data.city`, `data.state`, `data.zipCode` (String): endereço.
   - `data.mobilePhone` (String): telefone.
   - `data.dateOfBirth` (String, ISO ex. `1999-12-01`).
   - `data.payPeriod` (String, ex.: `BIWEEKLY`).
   - `data.email` (String).
   - `data.subID` (String): UUID da submissão/lead.
   - `data.subID2` (String): código de referência do merchant.
   - `data.testKey` (String): só aparece em ambientes não produtivos; deve estar ausente quando `IS_PRODUCTION=true` (credenciais de prod).

   **Campos adicionais (`data.extra`) a validar quando aplicável:**
   - `data.extra.inventoryCategory` (String): categoria de inventário (ex.: `"TIRES_&_WHEELS"`, `"ELECTRONICS"`) — setado quando `isSetInventoryCategory()` estiver ativo.
   - `data.extra.leaseAmount` (Number): valor de leasing/loan — sempre presente em requisições GDS.
   - `data.extra.returningCount` (Integer): contagem de leads assinados (clientes recorrentes) — sempre setado (0 se não houver).
   - `data.extra.prevLeaseCount` (Integer): contagem de todos os leads anteriores — sempre setado (0 se não houver).
   - `data.extra.bankingData` (Object): dados bancários — presente quando existe conta para auto-pay.
     - `routingNumber` (String), `accountNumber` (String) dentro de `bankingData`.
   - `data.extra.creditCardBin` (String, 6–8 dígitos): presente quando o lead tem BIN de cartão.
   - `data.extra.seonFingerprintText` (String): fingerprint SEON — vazio se indisponível.
   - `data.extra.iovationFingerprint` (String): fingerprint Iovation — vazio se indisponível.

   > Observação: Campos anotados com `@JsonInclude(JsonInclude.Include.NON_NULL)` serão omitidos se forem nulos. Campos condicionais (ex.: `bankingData`, `creditCardBin`, `Applicant.InvoiceItems`) podem não aparecer se os dados de origem não existirem.

UOWN-UAT Oauth2.0 Authentication
Oauth Flow Client credentials
Ouauth Client ID 31kpab936chdvouohd9bdssam1
Oauth Client Secret q26jsci612jnhgt3svdk6gem8i4882ffqnloc2olcke8u9vb1j5
Oauth URL https://uown-uat.auth.us-east-1.amazoncognito.com/oauth2/token
Oauth Scope integrate/transaction
URL https://uown.uat.me.dataview360.com/transaction
DV IP/s 3.214.30.86
Client IP Whitelisted "34.135.193.245/32", # Client IP Z98529
"104.154.97.148/32", # Client IP Z98529
Oauth 2.0 Call – Example using CURL command
curl -X POST https://uown-uat.auth.us-east-1.amazoncognito.com/oauth2/token -d
'grant_type=client_credentials&client_id=31kpab936chdvouohd9bdssam1&client_secret=q26jsci612jnhgt3svdk6gem8i4882ffqnloc2olck
e8u9vb1j5&scope=integrate/transaction'
Data Call – Example using CURL Command
curl -X POST -d @test.json -H "Authorization:TOKEN" --url " https://uown.uat.me.dataview360.com/transaction"


---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:


src/main/java/com/uownleasing/svc/config/uw/UnderwritingServiceConfig.java
package com.uownleasing.svc.config.uw;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UnderwritingServiceConfig {

    private final ConfigurationManagement configurationManagement;

    private static final String BASE_PATH = "com.uownleasing.svc.service.UnderwritingService.";

    public boolean isUseRiskTypeForApprovalAmount() {
        return configurationManagement.getBoolean(BASE_PATH + "use.risk.type.for.approval.amount", true);
    }

    public boolean isSetExtraUwData() {
        return configurationManagement.getBoolean(BASE_PATH + "set.extra.uw.data", true);
    }

    public boolean isSetUwSentilinkData() {
        return configurationManagement.getBoolean(BASE_PATH + "set.uw.sentilink.data", true);
    }

    public boolean isSetUwNeustarData() {
        return configurationManagement.getBoolean(BASE_PATH + "set.uw.neustar.data", false);
    }

    public boolean isSetUwSeonData() {
        return configurationManagement.getBoolean(BASE_PATH + "set.uw.seon.data", false);
    }

    public boolean isSetInventoryCategory() {
        return configurationManagement.getBoolean(BASE_PATH + "set.inventory.category", true);
    }

    public String getUwTtTestKey() {
        return configurationManagement.getString(BASE_PATH + "uw.tt.test.key", "71ca04b7-1308-400d-bed5-31c7d7f721f1");
    }

    public String getUwTtEntityId() {
        return configurationManagement.getString(BASE_PATH + "uw.tt.entity.id", "379ed8c3-b4ae-48d3-a147-393189517afb", "c474366f-2b32-4f81-90c8-e848c93bae59");
    }

    public boolean isUseTaktileForDecision() {
        return configurationManagement.getBoolean(BASE_PATH + "use.taktile.for.decision", false);
    }

    public boolean isSendRequestToTaktile() {
        return configurationManagement.getBoolean(BASE_PATH + "send.request.to.taktile", true);
    }

    public int getLambdaSegmentMin() {
        return configurationManagement.getInteger(BASE_PATH + "lambda.segment.min", 1);
    }

    public int getLambdaSegmentMax() {
        return configurationManagement.getInteger(BASE_PATH + "lambda.segment.max", 8);
    }

    public int getTierXMin() {
        return configurationManagement.getInteger(BASE_PATH + "tier.x.min", 0);
    }

    public int getTierXMax() {
        return configurationManagement.getInteger(BASE_PATH + "tier.x.max", 3);
    }

    public int getTierYMin() {
        return configurationManagement.getInteger(BASE_PATH + "tier.y.min", 0);
    }

    public int getTierYMax() {
        return configurationManagement.getInteger(BASE_PATH + "tier.y.max", 3);
    }

    public double getLoanAmountForMerchant(String refMerchantCode) {
        return configurationManagement.getDouble(BASE_PATH + "loan.amount.for.merchant." + refMerchantCode, 1500.00);
    }

    public boolean isAvailableForThreshold(String refMerchantCode) {
        return configurationManagement.getBoolean(BASE_PATH + "is.available.for.threshold." + refMerchantCode, false);
    }

    public boolean isAvailableForScoreAvailable(String refMerchantCode) {
        return configurationManagement.getBoolean(BASE_PATH + "is.available.for.score.available." + refMerchantCode, false);
    }

    public boolean isSkipUwMerchantClientType(String clientType) {
        return configurationManagement.getBoolean(BASE_PATH + "skip.uw.merchant.clientType." + clientType, false);
    }

    public int getPeakStartHourForMerchant(String merchantRefCode) {
        return configurationManagement.getInteger(BASE_PATH + "peak.start.hour.for.merchant." + merchantRefCode, 9);
    }

    public int getPeakEndHourForMerchant(String merchantRefCode) {
        return configurationManagement.getInteger(BASE_PATH + "peak.end.hour.for.merchant." + merchantRefCode, 21);
    }

    public boolean isUseOldProgramFor(String clientName) {
        return configurationManagement.getBoolean(BASE_PATH + "use.old.program.for." + clientName, false);
    }
}



src/main/java/com/uownleasing/svc/config/GdsConfig.java
package com.uownleasing.svc.config;

import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GdsConfig {

    private final ConfigurationManagement configurationManagement;

    private static final String BASE_PATH = "com.uownleasing.svc.service.GdsUwService.";
    private static final String UW_SERVICE_PATH = "com.uownleasing.svc.service.UnderwritingService.";

    public String getOauthClientId() {
        return configurationManagement.getString(
            BASE_PATH + "oauth.client.id",
            "nus39g39smnopmo5grf9s6eto",
            "31kpab936chdvouohd9bdssam1"
        );
    }

    public String getOauthClientSecret() {
        return configurationManagement.getString(
            BASE_PATH + "oauth.client.secret",
            "1g72qc2a8amhgenm88makiesr6jo18lrqtqcf8ikqi3mgl76a6m7",
            "q26jsci612jnhgt3svdk6gem8i4882ffqnloc2olcke8u9vb1j5"
        );
    }

    public String getOauthUrl() {
        return configurationManagement.getString(
            BASE_PATH + "oauth.url",
            "https://uown-prod.auth.us-east-1.amazoncognito.com/oauth2/token",
            "https://uown-uat.auth.us-east-1.amazoncognito.com/oauth2/token"
        );
    }

    public String getOauthScope() {
        return configurationManagement.getString(
            BASE_PATH + "oauth.scope",
            "integrate/transaction"
        );
    }

    public String getGdsUrl() {
        return configurationManagement.getString(
            BASE_PATH + "gds.url",
            "https://uown.prod.me.dataview360.com/transaction",
            "https://uown.uat.me.dataview360.com/transaction"
        );
    }

    public int getTokenExpiresIn() {
        return configurationManagement.getInteger(
            BASE_PATH + "token.expires.in",
            7190
        );
    }

    public int getTokenExpirationBufferSeconds() {
        return configurationManagement.getInteger(
            BASE_PATH + "token.expires.buffer",
            60
        );
    }

    public boolean isUseGdsForDecision() {
        return configurationManagement.getBoolean(UW_SERVICE_PATH + "use.gds.for.decision", true);
    }

    public String getUwGdsTestKey() {
        return configurationManagement.getString(UW_SERVICE_PATH + "uw.gds.test.key", "71ca04b7-1308-400d-bed5-31c7d7f721f1");
    }
}




src/main/java/com/uownleasing/svc/db/entity/GdsToken.java
package com.uownleasing.svc.db.entity;

import com.uownleasing.svc.superentity.SuperEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import javax.persistence.Column;
import javax.persistence.Entity;
import java.time.Instant;

@Getter
@Setter
@ToString(exclude = "accessToken")
@NoArgsConstructor
@Entity
public class GdsToken extends SuperEntity {
    @Column(length = 2048, nullable = false)
    private String accessToken;
    @Column(nullable = false)
    private Instant expirationTime;

    public GdsToken(String accessToken, Instant expirationTime) {
        this.accessToken = accessToken;
        this.expirationTime = expirationTime;
    }
}




src/main/java/com/uownleasing/svc/db/repository/GdsTokenRepo.java
package com.uownleasing.svc.db.repository;

import com.uownleasing.svc.db.entity.GdsToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface GdsTokenRepo extends JpaRepository<GdsToken, Long> {
    @Query(value = "SELECT * FROM uown_gds_token ORDER BY row_created_timestamp DESC LIMIT 1 FOR UPDATE", nativeQuery = true)
    Optional<GdsToken> findMostRecentForUpdate();

}




src/main/java/com/uownleasing/svc/pojo/underwriting/gds/BankingData.java
package com.uownleasing.svc.pojo.underwriting.gds;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BankingData {
    private String routingNumber;
    private String accountNumber;
}



src/main/java/com/uownleasing/svc/pojo/underwriting/gds/GdsUWRequest.java
package com.uownleasing.svc.pojo.underwriting.gds;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.uownleasing.svc.pojo.UWRequest;
import com.uownleasing.svc.pojo.underwriting.RequestData;
import com.uownleasing.svc.pojo.underwriting.UWExtraData;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GdsUWRequest {
    private RequestData data;

    public RequestData getData() {
        return data == null ? new RequestData() : data;
    }

    public void setRequestData(UWRequest request) {
        data = new RequestData();
        data.setUwData(request);
        data.setExtra(request.getExtra() != null ? request.getExtra() : new UWExtraData());
    }
}



src/main/java/com/uownleasing/svc/pojo/underwriting/UWExtraData.java
package com.uownleasing.svc.pojo.underwriting;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.uownleasing.svc.pojo.underwriting.gds.BankingData;
import com.uownleasing.svc.pojo.underwriting.gds.GdsApplicant;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UWExtraData {
    private Object sentilink;
    private Object neustar;
    private Object seon;
    private String inventoryCategory;
    private Double leaseAmount;
    private String routingNumber;
    private Integer returningCount;
    private Integer prevLeaseCount;
    private BankingData bankingData;
    private String creditCardBin;
    private String seonFingerprintText;
    private String iovationFingerprint;
    @JsonProperty("Applicant")
    private GdsApplicant applicant;
}



src/main/java/com/uownleasing/svc/pojo/UWResponse.java
package com.uownleasing.svc.pojo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.UnderwritingStatus;
import com.uownleasing.svc.enumeration.AppApprovalStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
public class UWResponse {

    @JsonIgnore
    private Long leadPk;
    //ACCEPT, REJECT, FURTHER_REVIEW, ERROR
    private String decision;

    private String adverseReasonCode;

    private String adverseReasonDescription;

    private String adverseReasonSuggestedCorrection;

    private String leadId;

    private Double creditLimit;

    private String errorName;

    private String errorMessage;

    private List<String> errorFailures = new ArrayList<>();

    private Integer campaignId;

    private Boolean isIntellicheckRequired = Boolean.FALSE;

    private Boolean chargeProcessingFee = Boolean.FALSE;

    private Boolean bankVerificationRequired = Boolean.FALSE;

    private Integer tierX;

    private Integer tierY;

    private Integer lambdaSegment;

    private String decisionAgent;

    private Integer cashScoreThreshold;

    private Integer vantageScore;

    // Approved term from GDS
    private String term;
    private String internalDecision;

    public AppApprovalStatus getAppApprovalStatus() {
        return switch (getDecision()) {
            case "ACCEPT" -> AppApprovalStatus.APPROVED;
            case "REJECT" -> AppApprovalStatus.DECLINED;
            case "FURTHER_REVIEW" -> AppApprovalStatus.DELAYED;
            case "ERROR" -> AppApprovalStatus.SYSTEM_ERROR;
            default -> AppApprovalStatus.SYSTEM_ERROR;
        };
    }

    public UnderwritingStatus getUnderwritingStatus() {
        return switch (getDecision()) {
            case "ACCEPT" -> UnderwritingStatus.APPROVED;
            case "REJECT" -> UnderwritingStatus.DENIED;
            case "FURTHER_REVIEW" -> UnderwritingStatus.REVIEW;
            case "ERROR" -> UnderwritingStatus.OTHER;
            default -> UnderwritingStatus.OTHER;
        };
    }

    public LeadStatus getLeadStatus() {
        return switch (getDecision()) {
            case "ACCEPT" -> LeadStatus.UW_APPROVED;
            case "REJECT" -> LeadStatus.UW_DENIED;
            case "FURTHER_REVIEW" -> LeadStatus.UW_REVIEW;
            case "ERROR" -> LeadStatus.UW_ERROR;
            default -> LeadStatus.UW_ERROR;
        };
    }


}



src/main/java/com/uownleasing/svc/service/gds/GdsResponseParser.java
package com.uownleasing.svc.service.gds;

import com.jayway.jsonpath.Configuration;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.Option;
import com.uownleasing.svc.pojo.UWResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Parses GDS API JSON envelope (success or error) into {@link UWResponse}.
 */
@Component
@Slf4j
public class GdsResponseParser {

    private static final String OUT = "$.data.out";

    private static final Configuration JSON_CONFIG = Configuration.defaultConfiguration()
        .addOptions(Option.DEFAULT_PATH_LEAF_TO_NULL, Option.SUPPRESS_EXCEPTIONS);

    /**
     * Parses a successful GDS response body (2xx) into UWResponse.
     */
    public UWResponse parseSuccessResponse(String json) {
        UWResponse response = new UWResponse();
        try {
            DocumentContext ctx = JsonPath.parse(json, JSON_CONFIG);
            setBasicInfoAndDecision(ctx, response);
            setIds(ctx, response);
            setCreditLimitAndTerm(ctx, response);
            setReasonsAndErrors(ctx, response);
            setPaymentDueToday(ctx, response);
        } catch (Exception e) {
            log.error("Error parsing GDS response", e);
            response.setDecision("ERROR");
            response.setCreditLimit(0.0);
            response.setErrorMessage("Error parsing GDS response: " + e.getMessage());
        }
        String status = readTopLevelStatus(json);
        if (StringUtils.isNotBlank(status) && !"SUCCESS".equalsIgnoreCase(status)) {
            response.setDecision("ERROR");
            if (StringUtils.isBlank(response.getErrorMessage())) {
                response.setErrorMessage("GDS returned status: " + status);
            }
        }
        return response;
    }

    private void setBasicInfoAndDecision(DocumentContext ctx, UWResponse response) {
        response.setDecisionAgent("GDS");
        String decision = ctx.read(OUT + ".decision", String.class);
        response.setDecision(decision != null ? decision : "ERROR");
        response.setInternalDecision(ctx.read(OUT + "['internal_decision']", String.class));
    }

    private void setIds(DocumentContext ctx, UWResponse response) {
        response.setLeadId(ctx.read(OUT + ".leadID", String.class));
        Number campaign = ctx.read(OUT + ".campaignID", Number.class);
        response.setCampaignId(campaign != null ? campaign.intValue() : null);
    }

    private void setCreditLimitAndTerm(DocumentContext ctx, UWResponse response) {
        Number creditLimit = ctx.read(OUT + "['credit_limit']", Number.class);
        response.setCreditLimit(creditLimit != null ? creditLimit.doubleValue() : 0.0);
        Object term = ctx.read(OUT + ".term");
        response.setTerm(term != null ? term.toString() : null);
    }

    private void setReasonsAndErrors(DocumentContext ctx, UWResponse response) {
        Object adverseReasons = ctx.read(OUT + "['adverse_reasons']");
        if (adverseReasons != null) {
            String adverseDesc = adverseReasons instanceof List
                ? StringUtils.join((List<?>) adverseReasons, ", ")
                : adverseReasons.toString();
            response.setAdverseReasonDescription(adverseDesc);
        }
        String denialReasons = ctx.read(OUT + "['denial_reasons']", String.class);
        if (StringUtils.isNotBlank(denialReasons)) {
            String existing = response.getAdverseReasonDescription();
            response.setAdverseReasonDescription(
                StringUtils.isBlank(existing) ? denialReasons : existing + "; " + denialReasons);
        }
        Object errorDetails = ctx.read(OUT + "['error_details']");
        if (errorDetails != null) {
            if (errorDetails instanceof String) {
                response.setErrorMessage((String) errorDetails);
            } else if (errorDetails instanceof Map) {
                Object message = ((Map<?, ?>) errorDetails).get("message");
                response.setErrorMessage(message != null ? message.toString() : errorDetails.toString());
            } else {
                response.setErrorMessage(errorDetails.toString());
            }
        }
    }

    private void setPaymentDueToday(DocumentContext ctx, UWResponse response) {
        String paymentDueToday = ctx.read(OUT + "['payment_due_today']", String.class);
        if (paymentDueToday != null && "Y".equalsIgnoreCase(paymentDueToday.trim())) {
            response.setChargeProcessingFee(true);
        }
    }

    /**
     * Reads the top-level "status" field from the GDS envelope (e.g. SUCCESS).
     */
    public String readTopLevelStatus(String json) {
        if (StringUtils.isBlank(json)) {
            return null;
        }
        Object status = JsonPath.parse(json, JSON_CONFIG).read("$.status");
        return status != null ? status.toString() : null;
    }

    /**
     * Parses an error response body (non-2xx or empty) into UWResponse with decision ERROR.
     */
    public UWResponse parseErrorResponse(String json) {
        UWResponse response = new UWResponse();
        response.setDecision("ERROR");
        response.setCreditLimit(0.0);
        if (StringUtils.isBlank(json)) {
            response.setErrorMessage("Unknown error from GDS API");
            return response;
        }
        try {
            DocumentContext ctx = JsonPath.parse(json, JSON_CONFIG);
            Object errorDetails = ctx.read("$.data.out['error_details']");
            if (errorDetails != null) {
                response.setErrorMessage(errorDetails instanceof String ? (String) errorDetails : errorDetails.toString());
                return response;
            }
            String mesg = ctx.read("$.detail.mesg", String.class);
            if (StringUtils.isNotBlank(mesg)) {
                response.setErrorName(ctx.read("$.detail.exc_type", String.class));
                response.setErrorMessage(mesg);
                return response;
            }
            String errorMessage = ctx.read("$.error", String.class);
            if (StringUtils.isBlank(errorMessage)) {
                errorMessage = ctx.read("$.message", String.class);
            }
            if (StringUtils.isNotBlank(errorMessage)) {
                response.setErrorMessage(errorMessage);
                return response;
            }
            response.setErrorMessage("Unknown error from GDS API");
        } catch (Exception e) {
            log.error("Error parsing GDS error response", e);
            response.setErrorMessage("Error parsing GDS error response: " + e.getMessage());
        }
        return response;
    }
}



src/main/java/com/uownleasing/svc/service/gds/GdsTokenManagerService.java
package com.uownleasing.svc.service.gds;

import com.uownleasing.svc.config.GdsConfig;
import com.uownleasing.svc.db.entity.GdsToken;
import com.uownleasing.svc.db.repository.GdsTokenRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GdsTokenManagerService {

    private final GdsTokenRepo gdsTokenRepo;
    private final GdsConfig gdsConfig;
    private final RestTemplate restTemplate;

    public String getAccessToken() {
        Instant now = Instant.now();
        Instant bufferTime = now.plusSeconds(gdsConfig.getTokenExpirationBufferSeconds());

        GdsToken token = gdsTokenRepo.findMostRecentForUpdate()
            .filter(t -> t.getRowCreatedTimestamp() != null)
            .orElseGet(GdsToken::new);

        boolean shouldRequestNewToken = token.getAccessToken() == null
            || token.getExpirationTime() == null
            || bufferTime.isAfter(token.getExpirationTime());

        if (shouldRequestNewToken) {
            GdsToken updatedToken = requestToken(token);
            if (updatedToken != null) {
                token = updatedToken;
            }
        }

        return token.getAccessToken();
    }

    private GdsToken requestToken(GdsToken token) {
        HttpEntity<MultiValueMap<String, String>> request = buildTokenRequest();
        try {
            ResponseEntity<Map> response = restTemplate.exchange(gdsConfig.getOauthUrl(), HttpMethod.POST, request, Map.class);
            Map<String, Object> body = response.getBody();

            if (!response.getStatusCode().is2xxSuccessful() || body == null) {
                log.error("[GdsTokenManagerService][requestToken] Failed token response: {}", response.getStatusCode());
                return null;
            }

            String accessToken = (String) body.get("access_token");
            int expiresIn = parseExpiresInSeconds(body);
            int buffer = gdsConfig.getTokenExpirationBufferSeconds();
            Instant expirationTime = Instant.now().plusSeconds(expiresIn - buffer);

            token.setAccessToken(accessToken);
            token.setExpirationTime(expirationTime);
            log.info("[GdsTokenManagerService][requestToken] New token set, expires at {}", expirationTime);
            return gdsTokenRepo.save(token);
        } catch (Exception e) {
            log.error("[GdsTokenManagerService][requestToken] Token request failed", e);
            return null;
        }
    }

    private HttpEntity<MultiValueMap<String, String>> buildTokenRequest() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", gdsConfig.getOauthClientId());
        form.add("client_secret", gdsConfig.getOauthClientSecret());
        form.add("scope", gdsConfig.getOauthScope());
        return new HttpEntity<>(form, headers);
    }

    private int parseExpiresInSeconds(Map<String, Object> body) {
        Object expiresInObj = body != null ? body.get("expires_in") : null;
        if (expiresInObj instanceof Number number) {
            return number.intValue();
        }
        return gdsConfig.getTokenExpiresIn();
    }
}



src/main/java/com/uownleasing/svc/service/GdsUwService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.los.common.db.config.LosThreadAttributes;
import com.uownleasing.los.common.service.LosLoggingService;
import com.uownleasing.svc.config.LosOutboundCall;
import com.uownleasing.svc.config.GdsConfig;
import com.uownleasing.svc.pojo.underwriting.gds.GdsUWRequest;
import com.uownleasing.svc.pojo.UWResponse;
import com.uownleasing.svc.service.gds.GdsResponseParser;
import com.uownleasing.svc.service.gds.GdsTokenManagerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GdsUwService {
    private final LosOutboundCall losOutboundCall;
    private final LosLoggingService loggingService;
    private final GdsTokenManagerService gdsTokenManagerService;
    private final GdsConfig gdsConfig;
    private final GdsResponseParser gdsResponseParser;

    private MultiValueMap<String, String> buildHeader() {
        MultiValueMap<String, String> headers = new LinkedMultiValueMap<>();
        headers.add("Content-Type", String.valueOf(MediaType.APPLICATION_JSON));
        headers.add("Accept", String.valueOf(MediaType.APPLICATION_JSON));
        String accessToken = gdsTokenManagerService.getAccessToken();
        if (StringUtils.isNotBlank(accessToken)) {
            headers.add("Authorization", "Bearer " + accessToken);
        }
        return headers;
    }

    public UWResponse sendUWRequest(GdsUWRequest request) {
        log.info("sendUWRequest to GDS for lead {}", request.getData().getLeadPk());
        ResponseEntity<String> result = losOutboundCall.makeRestCall(gdsConfig.getGdsUrl(), HttpMethod.POST,
            new HttpEntity<>(request, buildHeader()), String.class);
        log.info("sendUWRequest RESPONSE status: {}", result.getStatusCode());

        UWResponse uwResponse = result.getStatusCode().is2xxSuccessful()
            ? gdsResponseParser.parseSuccessResponse(result.getBody())
            : gdsResponseParser.parseErrorResponse(result.getBody());

        log.info("UWResponse UnderwritingStatus {}, CreditLimit {}", uwResponse.getUnderwritingStatus(), uwResponse.getCreditLimit());
        Long leadPk = request.getData().getLeadPk();
        uwResponse.setLeadPk(leadPk);
        loggingService.createActivityLog(leadPk, LogType.UNDERWRITING, false, null,
            "Underwriting is run. Response Status is " + uwResponse.getUnderwritingStatus(), LosThreadAttributes.getUsername());
        return uwResponse;
    }
}



src/main/java/com/uownleasing/svc/service/UnderwritingService.java
package com.uownleasing.svc.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.JsonObject;
import com.uownleasing.common.enumeration.Frequency;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.common.enumeration.UnderwritingStatus;
import com.uownleasing.common.pojo.UWInfo;
import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.config.GdsConfig;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.uw.UnderwritingServiceConfig;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.PreviousLeadsInfo;
import com.uownleasing.svc.pojo.UWRequest;
import com.uownleasing.svc.pojo.UWResponse;
import com.uownleasing.svc.pojo.underwriting.UWExtraData;
import com.uownleasing.svc.pojo.underwriting.gds.BankingData;
import com.uownleasing.svc.pojo.underwriting.gds.GdsApplicant;
import com.uownleasing.svc.pojo.underwriting.gds.GdsInvoiceItem;
import com.uownleasing.svc.pojo.underwriting.gds.GdsUWRequest;
import com.uownleasing.svc.pojo.underwriting.taktile.TtUWRequest;
import com.uownleasing.svc.utility.JsonUtils;
import com.uownleasing.uwengine.db.entities.FraudVerification;
import com.uownleasing.uwengine.db.entities.Neustar;
import com.uownleasing.uwengine.db.entities.Sentilink;
import com.uownleasing.uwengine.db.entities.UwEngineData;
import com.uownleasing.uwengine.service.FraudVerificationService;
import com.uownleasing.uwengine.service.NeustarService;
import com.uownleasing.uwengine.service.SentilinkService;
import com.uownleasing.uwengine.service.UwEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class UnderwritingService {

    private final LosUWService losUWService;
    private final AbbUwService abbUwService;
    private final TtUwService ttUwService;
    private final GdsUwService gdsUwService;
    private final GdsConfig gdsConfig;
    private final MerchantService merchantService;
    private final MerchantProgramService merchantProgramService;
    private final LeadProgramService leadProgramService;
    private final LosLeadService losLeadService;
    private final LosItemService losItemService;

    private final UwEngineService uwEngineService;
    private final SentilinkService sentilinkService;
    private final NeustarService neustarService;
    private final FraudVerificationService fraudVerificationService;
    private final LeadRiskService leadRiskService;

    private final ObjectMapper mapper;

    private final UnderwritingServiceConfig underwritingServiceConfig;

    private final LosLoggingService losLoggingService;

    private final LosBankAccountService bankAccountService;

    public UWResponse runUnderwriting(UWRequest uwRequest) {
        UWResponse uwResponse = abbUwService.sendUWRequest(uwRequest);
        UWInfo uwInfo = toUWInfo(uwResponse);
        uwInfo.setLeadPk(uwRequest.getLeadPk());
        LosUWData uwData = losUWService.createOrUpdateUnderwritingData(uwInfo);
        log.info("[UnderwritingService][runUnderwriting] LosUWData {}", uwData);
        return uwResponse;
    }

    public UWInfo toUWInfo(UWResponse uwResponse){
        UWInfo uwInfo = new UWInfo();
        if(uwResponse.getCampaignId()==0 && uwResponse.getLeadId().equals("")) {
            uwInfo.setDecidedByAgent("INTERNAL");
        }
        else {
            uwInfo.setDecidedByAgent(uwResponse.getDecisionAgent());
        }
        uwInfo.setDecisionMadeAt(LocalDateTime.now());
        uwInfo.setUwApprovalAmount(uwResponse.getCreditLimit() != null && uwResponse.getCreditLimit() > 0 ? BigDecimal.valueOf(uwResponse.getCreditLimit()) : BigDecimal.ZERO);
        uwInfo.setApprovalAmount(uwResponse.getCreditLimit() != null && uwResponse.getCreditLimit() > 0 ? BigDecimal.valueOf(uwResponse.getCreditLimit()) : BigDecimal.ZERO);
        uwInfo.setUwStatus(uwResponse.getUnderwritingStatus());
        uwInfo.setAbbUwResponse(JsonUtils.convertPojoToJSON(uwResponse));
        uwInfo.setIsIntellicheckRequired(uwResponse.getIsIntellicheckRequired());
        uwInfo.setChargeProcessingFee(uwResponse.getChargeProcessingFee());
        uwInfo.setBankVerificationRequired(uwResponse.getBankVerificationRequired());
        uwInfo.setIsIntellicheckRequired(uwResponse.getIsIntellicheckRequired());
        uwInfo.setApprovalExpirationDate(LocalDate.now().plusDays(merchantService.getMerchantByLeadPk(uwResponse.getLeadPk()).getMerchantInfo().getNumDaysApprovalExp()));
        uwInfo.setTierX(uwResponse.getTierX());
        uwInfo.setTierY(uwResponse.getTierY());
        uwInfo.setLambdaSegment(uwResponse.getLambdaSegment());
        uwInfo.setCashScoreThreshold(uwResponse.getCashScoreThreshold());
        uwInfo.setVantageScore(uwResponse.getVantageScore());
        uwInfo.setCampaignId(uwResponse.getCampaignId());
        uwInfo.setEligibleTerms(uwResponse.getTerm());
        uwInfo.setInternalDecision(uwResponse.getInternalDecision());
        return uwInfo;
    }

    public Boolean rerunUnderwriting(LosLead losLead) {
        boolean rerun = false;
        LeadStatus leadStatus = losLead.getLeadInfo().getLeadStatus();
        LosUWData currentUWDataByLead = losLead.getLosUWData();
        if (leadStatus == LeadStatus.NEW || leadStatus == LeadStatus.EXPIRED || leadStatus == LeadStatus.PENDING_UW
            || leadStatus == LeadStatus.UW_DENIED || leadStatus == LeadStatus.UW_ERROR || currentUWDataByLead == null) {
            rerun = true;
        }else if (currentUWDataByLead.getUwInfo().getApprovalExpirationDate() != null && currentUWDataByLead.getUwInfo().getApprovalExpirationDate().compareTo(LocalDate.now()) < 0) {
            log.info("Rerun UW on Lead pk {}. Previous UW was run at {}", losLead.getPk(), currentUWDataByLead.getUwInfo().getDecisionMadeAt());
            rerun = true;
        }
        //losLead.getLeadInfo().setNotes("Use past UW approval ? "+!rerun);
        log.info("Rerun UW on lead {} with status {} ? {}", losLead.getPk(), leadStatus, rerun);
        losLeadService.updateLead(losLead.getLeadInfo());
        return rerun;
    }

    public LosUWData copyUnderwriting(LosLead oldLead, LosLead lead, BigDecimal approvalAmount){
        UWResponse uwResponse = new UWResponse();
        LosUWData currentUWDataByLead = oldLead.getLosUWData();
        BigDecimal remainingAmount = approvalAmount == null || approvalAmount.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : approvalAmount;//currentUWDataByLead.getUwInfo().getApprovalAmount();
        log.info("[UnderwritingService][copyUnderwriting] oldLead {}, newLead {}, approvalAmount {}, remainingAmount {}", oldLead.getPk(), lead.getPk(), approvalAmount, remainingAmount);
        UWInfo uwInfo = new UWInfo();
        BeanUtils.copyProperties(currentUWDataByLead.getUwInfo(), uwInfo);
        uwInfo.setUwPK(0);
        uwInfo.setPreviousUW(String.valueOf(currentUWDataByLead.getPk()));
        uwInfo.setApprovalAmount(remainingAmount);
        uwInfo.setRiskType(underwritingServiceConfig.isUseRiskTypeForApprovalAmount() ? leadRiskService.determineRiskType(lead) : uwInfo.getRiskType());
        UnderwritingStatus uwStatus = currentUWDataByLead.getUwInfo().getUwStatus();
        uwInfo.setLeadPk(lead.getPk());
        if(uwInfo.getAbbUwResponse() != null){
            JsonUtils jsonUtils = new JsonUtils();
            uwResponse = (UWResponse) jsonUtils.convertJsonToObject(uwInfo.getAbbUwResponse(), new UWResponse());
        }
        uwResponse.setCreditLimit(remainingAmount.doubleValue());
        if(uwStatus == UnderwritingStatus.APPROVED && remainingAmount.compareTo(BigDecimal.ZERO) <= 0){
            uwResponse.setDecision("REJECT");
            uwResponse.setAdverseReasonDescription("There is no credit left for customer");
            uwInfo.setUwStatus(UnderwritingStatus.DENIED);
        }
        uwInfo.setAbbUwResponse(JsonUtils.convertPojoToJSON(uwResponse));
        //lead.getLeadInfo().setEqualOrAboveThreshold(oldLead.getLeadInfo().getEqualOrAboveThreshold());
        //lead.getLeadInfo().setLendingCategoryType(oldLead.getLeadInfo().getLendingCategoryType());
        LeadStatus status = LeadStatus.getLeadStatus(uwInfo.getUwStatus());
        lead.getLeadInfo().setLeadStatus(status, status, "[UnderwritingService][copyUnderwriting] Credit left over from previous approval amount is " + remainingAmount);
        LosUWData uwData = losUWService.createOrUpdateUnderwritingData(uwInfo);
        uwData.setLosLead(lead);
        setMerchantProgramForLead(lead);
        return uwData;
    }

    public LosUWData runUnderwriting(LosLead lead) {
        lead.getLeadInfo().setNotes("[UnderwritingService][runUnderwriting] Start");
        LosCustomer customer = lead.getLosCustomers().iterator().next();
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        //MerchantProgram merchantProgram = merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk());
        UWRequest uwRequest = new UWRequest();
        uwRequest.setLeadPk(lead.getPk());
        uwRequest.setFirstName(customer.getCustomerInfo().getFirstName());
        uwRequest.setLastName(customer.getCustomerInfo().getLastName());
        uwRequest.setDateOfBirth(customer.getCustomerInfo().getDateOfBirth().toString());
        uwRequest.setSsn(customer.getCustomerInfo().getSsn());
        uwRequest.setIovationID(lead.getLeadInfo().getIovationFingerprintText());
        uwRequest.setSubID(lead.getLeadInfo().getUuid());
        uwRequest.setSubID2(merchant.getMerchantInfo().getRefMerchantCode());
        LosAddress address = customer.getLosAddresses().iterator().next();
        uwRequest.setStreetAddress(address.getAddressInfo().getStreetAddress1());
        uwRequest.setCity(address.getAddressInfo().getCity());
        uwRequest.setState(address.getAddressInfo().getState());
        uwRequest.setZipCode(address.getAddressInfo().getZipCode());

        if (underwritingServiceConfig.isSetExtraUwData()) {
            UwEngineData data = uwEngineService.getLatestByLeadPk(lead.getPk());
            String camelCaseRegex = "\"([a-z]+)([A-Z]+)[a-z]*\"";
            String subRegex = "([a-z]+)([A-Z]+)";
            String replacement = "$1_$2";
            if (data != null) {

                if (underwritingServiceConfig.isSetUwSentilinkData()
                    && data.getUwEngineInfo().getSentilinkPk() != null
                    && data.getUwEngineInfo().getSentilinkPk() > 0) {

                    Sentilink sentilink = sentilinkService.getByPk(data.getUwEngineInfo().getSentilinkPk());
                    if (sentilink != null && org.apache.commons.lang3.StringUtils.isNotBlank(sentilink.getRawResponse())) {
                        uwRequest.setSentilinkData(JsonUtils.getGson().fromJson(Pattern.compile(camelCaseRegex)
                            .matcher(sentilink.getRawResponse()).replaceAll(m -> m.group().replaceAll(subRegex, replacement).toLowerCase()), JsonObject.class));
                    }
                }
                if (underwritingServiceConfig.isSetUwNeustarData()
                    && data.getUwEngineInfo().getNeustarPk() != null
                    && data.getUwEngineInfo().getNeustarPk() > 0) {

                    Neustar neustar = neustarService.findByPk(data.getUwEngineInfo().getNeustarPk());
                    if (neustar != null && org.apache.commons.lang3.StringUtils.isNotBlank(neustar.getRawResponse())) {
                        uwRequest.setNeustarData(JsonUtils.getGson().fromJson(Pattern.compile(camelCaseRegex)
                            .matcher(neustar.getRawResponse()).replaceAll(m -> m.group().replaceAll(subRegex, replacement).toLowerCase()), JsonObject.class));
                    }
                }
                if (underwritingServiceConfig.isSetUwSeonData()
                    && data.getUwEngineInfo().getFraudVerificationPk() != null
                    && data.getUwEngineInfo().getFraudVerificationPk() > 0) {

                    FraudVerification seon = fraudVerificationService.getByPk(data.getUwEngineInfo().getFraudVerificationPk());
                    if (seon != null && org.apache.commons.lang3.StringUtils.isNotBlank(seon.getRawResponse())) {
                        uwRequest.setSeonData(JsonUtils.getGson().fromJson(Pattern.compile(camelCaseRegex)
                            .matcher(seon.getRawResponse()).replaceAll(m -> m.group().replaceAll(subRegex, replacement).toLowerCase()), JsonObject.class));
                    }
                }
            }

            if (underwritingServiceConfig.isSetInventoryCategory()) {
                uwRequest.setInventoryCategoryData(merchant.getMerchantInfo().getInventoryCategory());
            }
        }

        populateInvoiceItemsInGdsExtraFields(lead, uwRequest);

        populateFinancialDataInGdsExtraFields(customer, lead, uwRequest);

        populateLeadInfoInGdsExtraFields(lead, uwRequest);

        LosEmployment employment = customer.getLosEmploymentSet().iterator().next();
        if(employment.getEmploymentInfo().getMonthlyIncome() != null){
            uwRequest.setMonthlyIncome(employment.getEmploymentInfo().getMonthlyIncome().intValue());
        }
//        if(employment.getEmploymentInfo().getDuration()){
//
//        }

        LosPhone losPhone = customer.getLosPhones().iterator().next();
        uwRequest.setEmail(customer.getLosEmails() != null && !customer.getLosEmails().isEmpty() ? customer.getLosEmails().iterator().next().getEmailInfo().getEmailAddress() : null);
        uwRequest.setIpAddress(org.apache.commons.lang3.StringUtils.isBlank(lead.getLeadInfo().getIpAddress()) ? "0.0.0.0" : lead.getLeadInfo().getIpAddress());
        uwRequest.setMobilePhone(losPhone.getPhoneInfo().getAreaCode()+losPhone.getPhoneInfo().getPhoneNumber());
        BigDecimal loanAmount = merchant.getMerchantInfo().getDefaultLoanAmount();
        double defaultLoanAmount = loanAmount != null ? loanAmount.doubleValue() : underwritingServiceConfig.getLoanAmountForMerchant(merchant.getMerchantInfo().getRefMerchantCode());
        uwRequest.setLoanAmount(lead.getLeadInfo().getRequestedLoanAmount() != null && lead.getLeadInfo().getRequestedLoanAmount().compareTo(BigDecimal.ZERO) > 0 ? lead.getLeadInfo().getRequestedLoanAmount().doubleValue() : defaultLoanAmount);
        uwRequest.setPayPeriod(getUWFrequency(employment.getEmploymentInfo().getPayFrequency()));
        Integer defaultMonthsAtEmployer = employment.getEmploymentInfo().getMonthsAtEmployer() == null || employment.getEmploymentInfo().getMonthsAtEmployer() <= 0 ? merchant.getMerchantInfo().getDefaultMonthsAtEmployer() : employment.getEmploymentInfo().getMonthsAtEmployer();
        uwRequest.setMonthsAtEmployer(defaultMonthsAtEmployer);

        Integer campaignId = !SystemConfigurationManagement.isProduction() ?  merchant.getMerchantInfo().getPeakCampaignId() : null;
        uwRequest.setCampaignID(campaignId != null ? campaignId : isPeakTime(merchant.getMerchantInfo().getRefMerchantCode()) ? merchant.getMerchantInfo().getPeakCampaignId() : merchant.getMerchantInfo().getOffPeakCampaignId());
        uwRequest.setSourceURL(merchant.getMerchantInfo().getMerchantUrl());
        UWResponse uwResponse;

        boolean thresholdCheck = underwritingServiceConfig.isAvailableForThreshold(merchant.getMerchantInfo().getRefMerchantCode());
        boolean scoreAvailableCheck = underwritingServiceConfig.isAvailableForScoreAvailable(merchant.getMerchantInfo().getRefMerchantCode());
        if(underwritingServiceConfig.isSkipUwMerchantClientType(merchant.getMerchantInfo().getClientType().toString())
            && (!thresholdCheck || lead.getLeadInfo().getEqualOrAboveThreshold() != null
                && lead.getLeadInfo().getEqualOrAboveThreshold())
            && (!scoreAvailableCheck || lead.getLeadInfo().getIsScoreAvailable() != null
                && lead.getLeadInfo().getIsScoreAvailable())) {
            if(lead.getLeadInfo().getMaxApprovalAmount() != null && lead.getLeadInfo().getMaxApprovalAmount().compareTo(BigDecimal.ZERO) > 0)
                uwRequest.setLoanAmount(lead.getLeadInfo().getMaxApprovalAmount().doubleValue());
            uwResponse = skipUwProcess(uwRequest);
            lead.getLeadInfo().setNotes("[UnderwritingService][runUnderwriting] Skip UW process for merchant(ClientType) : " + merchant.getMerchantInfo().getClientType());
        }
        else {
            uwResponse = routeUwRequest(uwRequest);
        }
        UWInfo uwInfo = toUWInfo(uwResponse);
        uwInfo.setLeadPk(uwRequest.getLeadPk());
        uwInfo.setRiskType(underwritingServiceConfig.isUseRiskTypeForApprovalAmount() ? leadRiskService.determineRiskType(lead) : uwInfo.getRiskType());
        LeadStatus status = uwResponse.getLeadStatus();
        lead.getLeadInfo().setLeadStatus(status, status, "[UnderwritingService][runUnderwriting] UW is run. Lead Status "+status);
        lead.getLeadInfo().setApprovalAmount(uwInfo.getApprovalAmount());
        losLeadService.updateLead(lead.getLeadInfo());
        LosUWData uwData = losUWService.createOrUpdateUnderwritingData(uwInfo);
        setMerchantProgramForLead(lead);
        uwData.setLosLead(lead);
        return uwData;
    }

    private UWResponse routeUwRequest(UWRequest request) {
        if (gdsConfig.isUseGdsForDecision()) {
            GdsUWRequest gdsRequest = new GdsUWRequest();
            gdsRequest.setRequestData(request);
            gdsRequest.getData().setTestKey(SystemConfigurationManagement.isProduction() ? null : gdsConfig.getUwGdsTestKey());
            gdsRequest.getData().getExtra().setLeaseAmount(request.getLoanAmount());
            return gdsUwService.sendUWRequest(gdsRequest);
        }

        TtUWRequest ttRequest = new TtUWRequest();
        ttRequest.setRequestData(request);
        ttRequest.setTestKey(underwritingServiceConfig.getUwTtTestKey());
        ttRequest.setEntityId(underwritingServiceConfig.getUwTtEntityId());

        try {
            UWExtraData extra = new UWExtraData();
            extra.setSentilink(request.getExtra().getSentilink() != null ? mapper.readTree(JsonUtils.convertPojoToJSON(request.getExtra().getSentilink())) : null);
            extra.setNeustar(request.getExtra().getNeustar() != null ? mapper.readTree(JsonUtils.convertPojoToJSON(request.getExtra().getNeustar())) : null);
            extra.setSeon(request.getExtra().getSeon() != null ? mapper.readTree(JsonUtils.convertPojoToJSON(request.getExtra().getSeon())) : null);
            extra.setInventoryCategory(request.getExtra().getInventoryCategory());
            extra.setLeaseAmount(request.getLoanAmount());
            ttRequest.getData().setExtra(extra);
        } catch (Exception e) {
            log.error("Unable to convert uw extra data to taktile extra data", e);
        }

        if (underwritingServiceConfig.isUseTaktileForDecision()) {
            return ttUwService.sendUWRequest(ttRequest);
        }

        if (underwritingServiceConfig.isSendRequestToTaktile()) {
            ttUwService.sendUWRequestAsync(ttRequest);
        }
        return abbUwService.sendUWRequest(request);
    }

    private Boolean isPeakTime(String merchantReferenceCode){
        int startHour = underwritingServiceConfig.getPeakStartHourForMerchant(merchantReferenceCode);
        int endHour = underwritingServiceConfig.getPeakEndHourForMerchant(merchantReferenceCode);
        log.info("CurrentTime {}, start time {}, end Time {}", LocalDateTime.now(), LocalDate.now().atTime(startHour,0), LocalDate.now().atTime(endHour,0));
        return LocalDateTime.now().compareTo(LocalDate.now().atTime(startHour,0)) > 0 && LocalDateTime.now().compareTo(LocalDate.now().atTime(endHour,0)) < 0;
    }

    private String getUWFrequency(Frequency payFrequency) {
        return payFrequency != null ? payFrequency.name().replace("_", "") : null;
    }

    public LosUWData getUWDataForLead(long leadPk){
        return losUWService.getUWDataByLead(leadPk);
    }

    public MerchantProgram setMerchantProgramForLead(LosLead lead) {
        lead.getLeadInfo().setNotes("[UnderwritingService][setMerchantProgramForLead]");
        MerchantProgram program = getMerchantProgramForLead(lead);
        if (program != null) {
            lead.getLeadInfo().setMerchantProgramPk(program.getPk());
        }
        return program;
    }

    public MerchantProgram getMerchantProgramForLead(LosLead lead) {
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        if (underwritingServiceConfig.isUseOldProgramFor(merchant.getMerchantInfo().getClientType().getClientName())
            && lead.getLeadInfo().getMerchantProgramPk() != null
            && lead.getLeadInfo().getMerchantProgramPk() > 0) {
            lead.getLeadInfo().setNotes("[UnderwritingService][getMerchantProgramForLead] Return existing merchantProgram " +lead.getLeadInfo().getMerchantProgramPk());
            return merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk());
        } else {
            LosUWData uw = lead.getLosUWData();
            if (uw == null) {
                throw new SvcException("No underwriting data found");
            }
            return leadProgramService.findMerchantProgramForLead(lead, merchant, uw.getUwInfo());
        }
    }



    private UWResponse skipUwProcess(UWRequest uwRequest) {
        UWResponse uwResponse = new UWResponse();
        uwResponse.setLeadPk(uwRequest.getLeadPk());
        uwResponse.setDecision("ACCEPT");
        uwResponse.setCreditLimit(uwRequest.getLoanAmount());
        uwResponse.setLeadId("");
        uwResponse.setCampaignId(0);
        log.info("[UnderwritingService] Bypass UnderWriting process UWRequest {} and UWResponse {}", uwRequest, uwResponse);
        return uwResponse;
    }

    public LosUWData createUnderwritingForLead(LosLead lead, PreviousLeadsInfo previousLeadsInfo) {
        LosUWData uwData;
        LosLead mostRecentPrevLead = null;
        int previousLeadsCount = 0;
        int signedLeadsCount = 0;
        if(previousLeadsInfo != null){
            mostRecentPrevLead = previousLeadsInfo.getMostRecentPrevLead();
            previousLeadsCount = CollectionUtils.isEmpty(previousLeadsInfo.getPreviousLeads()) ? 0 : previousLeadsInfo.getPreviousLeads().size();
            signedLeadsCount = previousLeadsInfo.getPreviousSignedLeadCount();
        }
        if(mostRecentPrevLead != null){
            Merchant oldMerchant = merchantService.getMerchantByLeadPk(mostRecentPrevLead.getPk());
            Merchant newMerchant = merchantService.getMerchantByLeadPk(lead.getPk());
            lead.getLeadInfo().setNotes("[UnderwritingService][createUnderwritingForLead]mostRecentPrevLead exists. Comparing merchants... ");
            if(oldMerchant.getMerchantInfo().getRefMerchantCode().equals(newMerchant.getMerchantInfo().getRefMerchantCode())) {
                UWInfo prevUwInfo = mostRecentPrevLead.getLosUWData().getUwInfo();
                if (prevUwInfo.getApprovalExpirationDate().compareTo(LocalDate.now()) >= 0) {
                    lead.getLeadInfo().setNotes(String.format("[UnderwritingService][createUnderwritingForLead] Same merchant. " +
                        "Copy UW data. prevUWInfo UwApproval %s approval %s final remainingApproval %s", prevUwInfo.getUwApprovalAmount(), prevUwInfo.getApprovalAmount(), previousLeadsInfo.getApprovalAmount()));
                    uwData = copyUnderwriting(mostRecentPrevLead, lead, previousLeadsInfo.getApprovalAmount());
                    addUnderwritingLog(lead.getPk(), String.format("Reusing UW data on lead %s", mostRecentPrevLead.getPk()));
                    return uwData;
                }
            }
        }
        lead.getLeadInfo().setNotes("[UnderwritingService][createUnderwritingForLead]mostRecentPrevLead doesn't exist or different merchant. Running UW ...");
        addUnderwritingLog(lead.getPk(),"Running UW data on lead");
        lead.getLeadInfo().setPreviousLeadsCount(previousLeadsCount);
        lead.getLeadInfo().setSignedLeadsCount(signedLeadsCount);

        uwData = runUnderwriting(lead);
        UWInfo uwInfo = uwData.getUwInfo();
        BigDecimal blackBoxApproval = uwInfo.getApprovalAmount();
        lead.getLeadInfo().setNotes(String.format("[UnderwritingService][createUnderwritingForLead] Original blackBoxApproval minSignedApproval calc: %.2f; ", blackBoxApproval));
        if(previousLeadsInfo != null && blackBoxApproval != null && blackBoxApproval.compareTo(BigDecimal.ZERO) > 0){
//            BigDecimal minSignedApproval = previousLeadsInfo.getMinSignedApproval();
//            blackBoxApproval =  minSignedApproval!= null && blackBoxApproval.compareTo(minSignedApproval) > 0 ? minSignedApproval : blackBoxApproval;
            lead.getLeadInfo().setNotes(String.format("[UnderwritingService][createUnderwritingForLead] Approval is %.2f", blackBoxApproval));
            BigDecimal approval = blackBoxApproval.subtract(previousLeadsInfo.getConsumedApprovalAmount());
            uwInfo.setApprovalAmount(approval.max(BigDecimal.ZERO));
            lead.getLeadInfo().setApprovalAmount(uwInfo.getApprovalAmount());
            lead.getLeadInfo().setNotes(String.format("[UnderwritingService][createUnderwritingForLead] BlackBoxApproval after consumed amount calc: %.2f; ConsumedAmount: %.2f; Original Approval: %.2f"
                , uwInfo.getApprovalAmount(), previousLeadsInfo.getConsumedApprovalAmount(), uwInfo.getUwApprovalAmount()));
            addUnderwritingLog(lead.getPk(),String.format("UW Status : %s. Original approval %s" +
                    ", consumed amount %s, final approval, %s", uwInfo.getUwStatus()
                , blackBoxApproval, previousLeadsInfo.getConsumedApprovalAmount(), uwInfo.getApprovalAmount()));
            uwData = losUWService.createOrUpdateUnderwritingData(uwInfo);
        }
        return uwData;
    }

    private void addUnderwritingLog(long leadPk, String logNote) {
        losLoggingService.createActivityLog(leadPk, LogType.INTERNAL, false, null, logNote, ThreadAttributes.getUsername());
    }

    private void populateInvoiceItemsInGdsExtraFields(LosLead lead, UWRequest uwRequest) {
        Optional.ofNullable(losItemService.getAllItemsForLead(lead.getPk()))
            .filter(list -> !list.isEmpty())
            .ifPresent(itemsList -> {
                List<GdsInvoiceItem> gdsInvoiceItems = itemsList.stream()
                    .map(LosItem::getItemInfo)
                    .map(GdsInvoiceItem::fromItemInfo)
                    .toList();

                if (!gdsInvoiceItems.isEmpty()) {
                    GdsApplicant applicant = new GdsApplicant();
                    applicant.setInvoiceItems(gdsInvoiceItems);
                    uwRequest.getExtra().setApplicant(applicant);
                }
            });
    }

    private void populateFinancialDataInGdsExtraFields(LosCustomer customer, LosLead lead, UWRequest uwRequest) {
        Optional.ofNullable(bankAccountService.getAutoPayBankAccountForCustomer(customer.getPk()))
            .map(LosBankAccount::getBankAccountInfo)
            .ifPresent(info -> {
                BankingData bankingData = new BankingData();
                bankingData.setRoutingNumber(info.getRoutingNumber());
                bankingData.setAccountNumber(info.getAccountNumber());
                uwRequest.getExtra().setBankingData(bankingData);
            });

        Optional.ofNullable(lead.getLeadInfo().getCreditCardBin())
            .filter(StringUtils::isNotBlank)
            .ifPresent(bin -> uwRequest.getExtra().setCreditCardBin(bin));
    }

    private void populateLeadInfoInGdsExtraFields(LosLead lead, UWRequest uwRequest) {
        var extra = uwRequest.getExtra();
        var leadInfo = lead.getLeadInfo();
        extra.setReturningCount(leadInfo.getPreviousLeadsCount());
        extra.setPrevLeaseCount(leadInfo.getSignedLeadsCount());
        extra.setSeonFingerprintText(StringUtils.isNotBlank(leadInfo.getSeonFingerprintText()) ? leadInfo.getSeonFingerprintText() : "");
        extra.setIovationFingerprint(StringUtils.isNotBlank(leadInfo.getIovationFingerprintText()) ? leadInfo.getIovationFingerprintText() : "");
    }
}




src/main/resources/db/migration/V20260205052025__create_gds_token_table.sql
-- =====================================================
-- Flyway Migration: V20260205052025__create_gds_token_table.sql
-- Created: 2026-02-05 05:20:25 PST/PDT
-- Description: Create uown_gds_token table for GdsToken entity (GDS OAuth2 token storage)
-- =====================================================

CREATE TABLE IF NOT EXISTS uown_gds_token (
    pk BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    row_created_timestamp TIMESTAMP,
    row_updated_timestamp TIMESTAMP,
    tenant_id BIGINT,
    access_token VARCHAR(2048) NOT NULL,
    expiration_time TIMESTAMP WITH TIME ZONE NOT NULL
);



src/main/java/com/uownleasing/svc/pojo/underwriting/gds/GdsApplicant.java
package com.uownleasing.svc.pojo.underwriting.gds;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GdsApplicant {
    @JsonProperty("InvoiceItems")
    private List<GdsInvoiceItem> invoiceItems = new ArrayList<>();
}



src/main/java/com/uownleasing/svc/pojo/underwriting/gds/GdsInvoiceItem.java
package com.uownleasing.svc.pojo.underwriting.gds;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.uownleasing.common.pojo.ItemInfo;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GdsInvoiceItem {
    @JsonProperty("Quantity")
    private Integer quantity;
    @JsonProperty("Price")
    private Double price;
    @JsonProperty("ProductType")
    private String productType;
    @JsonProperty("Description")
    private String description;

    /**
     * Maps an {@link ItemInfo} to a GDS invoice item. Price is per unit (basePricePerItem).
     */
    public static GdsInvoiceItem fromItemInfo(ItemInfo itemInfo) {
        GdsInvoiceItem gdsItem = new GdsInvoiceItem();
        gdsItem.setQuantity(itemInfo.getNumberOfItems() != null ? itemInfo.getNumberOfItems() : 1);
        gdsItem.setPrice(itemInfo.getBasePricePerItem() != null ? itemInfo.getBasePricePerItem().doubleValue() : null);
        gdsItem.setProductType(itemInfo.getCategory());
        gdsItem.setDescription(itemInfo.getItemDescription());
        return gdsItem;
    }
}

---------------------------------------------------------------------------------------------------------------------------------------------------------

cenarios de teste:

---
### Scenario 1: Roteamento para GDS (use.gds.for.decision=true / use.taktile.for.decision=false)
```markdown
- Given a UW request is initiated com GDS habilitado e Taktile desabilitado
- When o underwriting é solicitado
- Then a requisição é enviada ao GDS
- And nenhuma decisão é enviada ao Taktile

|    LeadPk  |
|------------|
| 94457      | 
```

**PASS**

---

### Scenario 2: Roteamento para Taktile (fallback)
```markdown
- Given a UW request é iniciado com GDS desabilitado e Taktile habilitado
- When o underwriting é solicitado
- Then a requisição é enviada ao Taktile
- And nenhuma decisão é enviada ao GDS

|    LeadPk  |
|------------|
| 94463      | 
```

**PASS**

---

### Scenario 3: Resposta GDS aprovada
```markdown
- Given um lead elegível com dados válidos
- And o GDS retorna decision "ACCEPT" com credit_limit definido
- When o underwriting é processado
- Then uown_los_uwdata registra decided_by_agent "GDS" e uw_status "APPROVED"
- And approval_amount é igual ao credit_limit
- And decision_made_at é preenchido
- And abb_uw_response contém decision "ACCEPT", decisionAgent "GDS" e term
- And o lead fica com lead_status "UW_APPROVED" e max_approval_amount consistente
- And UWData persiste term, internal_decision e eligible_terms

|    LeadPk  |
|------------|
| 94458      | 
```

**PASS**

---

### Scenario 4: Token GDS renova quando perto de expirar
```markdown
- Given existe token com expiration_time dentro do buffer de expiração
- When uma requisição de underwriting aciona o GDS
- Then um novo token é solicitado e salvo em uown_gds_token
- And o novo token é usado no header Authorization
```

**PASS**

---

### Scenario 5: InvoiceItems aparecem somente quando há itens
```markdown
- Given um lead com invoice items criados antes do underwriting
- When o underwriting envia a requisição ao GDS
- Then data.extra.Applicant.InvoiceItems está presente no api_log_info.request
- And cada item contém Quantity, Price (unitário), ProductType e Description
```

**PASS**

---

### Scenario 6: InvoiceItems ausentes quando não há itens
```markdown
- Given um lead sem invoice items
- When o underwriting envia a requisição ao GDS
- Then o bloco data.extra.Applicant.InvoiceItems não aparece no api_log_info.request
```

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------

Comentario tarefa:

## Tests in sandbox

---
### Scenario 1: Routing to GDS (use.gds.for.decision=true / use.taktile.for.decision=false)
```markdown
- Given a UW request is initiated with GDS enabled and Taktile disabled
- When the underwriting is requested
- Then the request is sent to GDS
- And no decision is sent to Taktile

|    LeadPk  |
|------------|
| 94457      | 
```

**PASS**

---

### Scenario 2: Routing to Taktile (fallback)
```markdown
- Given a UW request is initiated with GDS disabled and Taktile enabled
- When the underwriting is requested
- Then the request is sent to Taktile
- And no decision is sent to GDS

|    LeadPk  |
|------------|
| 94463      | 
```

**PASS**

---

### Scenario 3: GDS approved response
```markdown
- Given an eligible lead with valid data
- And GDS returns decision "ACCEPT" with credit_limit defined
- When the underwriting is processed
- Then uown_los_uwdata records decided_by_agent "GDS" and uw_status "APPROVED"
- And approval_amount equals credit_limit
- And decision_made_at is filled
- And abb_uw_response contains decision "ACCEPT", decisionAgent "GDS" and term
- And the lead has lead_status "UW_APPROVED" and consistent max_approval_amount
- And UWData persists term, internal_decision and eligible_terms

|    LeadPk  |
|------------|
| 94458      | 
```

**PASS**

---

### Scenario 4: GDS token renews when near expiration
```markdown
- Given there is a token with expiration_time within the expiration buffer
- When a UW request triggers GDS
- Then a new token is requested and saved in uown_gds_token
- And the new token is used in the Authorization header
```

**PASS**

---

### Scenario 5: InvoiceItems present only when items exist
```markdown
- Given a lead with invoice items created before underwriting
- When the underwriting sends the request to GDS
- Then data.extra.Applicant.InvoiceItems is present in api_log_info.request
- And each item contains Quantity, Price (unit), ProductType and Description
```

**PASS**

---

### Scenario 6: InvoiceItems absent when no items exist
```markdown
- Given a lead without invoice items
- When the underwriting sends the request to GDS
- Then the data.extra.Applicant.InvoiceItems block does not appear in api_log_info.request
```

**PASS**

---
### Scenario 7: UW data persisted for GDS decision (DB/API check)
```markdown
- Given a UW request is processed by GDS
- When the underwriting response is stored
- Then uown_los_uwdata records decided_by_agent "GDS" and uw_status (APPROVED/DENIED/OTHER)
- And approval_amount equals credit_limit
- And decision_made_at is filled and lead_pk matches the application
- And abb_uw_response contains decision, creditLimit, decisionAgent "GDS", term, internal_decision, eligible_terms
- And charge_processing_fee is true only if payment_due_today = "Y"
- And Lead/LeadInfo has approval_amount matching credit_limit and max_approval_amount = approval + over-approval
```

**PASS**

---

### Scenario 8: Outbound payload contains mandatory GDS fields (DB outbound log)
```markdown
- Given a UW request is sent to GDS
- When the outbound call is logged in uown_los_outbound_api_log
- Then api_log_info.request.data includes leadPk, campaignID, ipAddress, ssn, firstName, lastName, streetAddress, city, state, zipCode, mobilePhone, dateOfBirth, payPeriod, email, subID, subID2
- And testKey is present only in non-production
- And data.extra.leaseAmount is always populated
```

**PASS**

---

### Scenario 9: Outbound payload includes/omits optional extras appropriately (DB outbound log)
```markdown
- Given a UW request with optional data available
- When the outbound call is logged in uown_los_outbound_api_log
- Then data.extra includes:
  - inventoryCategory when config is enabled
  - returningCount and prevLeaseCount (0 if none)
  - bankingData (routingNumber, accountNumber) when an auto-pay account exists
  - creditCardBin when available
  - seonFingerprintText and iovationFingerprint as strings (empty if missing)
- And Applicant.InvoiceItems appears only when items exist before UW, with Quantity, Price (unit), ProductType, Description; otherwise the block is absent
```

**PASS**

---

---------------------------------------------------------------------------------------------------------------------------------------------------------


select * from uown_gds_token ;
1	2026-02-09 11:24:41.931	2026-02-16 04:14:06.341		eyJraWQiOiI1Y1p0RTFxTWRZeWtMOWFSOGtMazVLcWJlaXRGQ2FVQ0JXRmE1czByajMwPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIzMWtwYWI5MzZjaGR2b3VvaGQ5YmRzc2FtMSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiaW50ZWdyYXRlXC90cmFuc2FjdGlvbiIsImF1dGhfdGltZSI6MTc3MTIzMzIzOSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfcXl4STVzbEZVIiwiZXhwIjoxNzcxMjQwNDM5LCJpYXQiOjE3NzEyMzMyMzksInZlcnNpb24iOjIsImp0aSI6IjJiNTAzZGM4LWMzOWMtNGJjZS05Mjg4LTQ3NzlmY2Y0NTFhNiIsImNsaWVudF9pZCI6IjMxa3BhYjkzNmNoZHZvdW9oZDliZHNzYW0xIn0.VSGEM4i44wjkfZ3Q19qpXIH4-7D2CoFTANBsUfgSHjNOC5COAA6e6Auk91Bj3isP9O9D1alcCkvGB-d7LxG_prpb3WcNLkxwWs-UC4mFTLG58ihpLg0mLdYoKIuDQYHjxOZVD3jam2xbTGrO7ev9KkmhJZyJ0IhlYhD43nsnDizlRD56PesQdgiHAi57MPNKGcMBJx3JRpmyScTwJLM4JjkuBmF_mw4d58pwVcXZRnkbCl5r54FDP71hWYHOorUT-yjYMa_AMfCLkCaZ0fHOUucmaq-4FuttTm0ATeINZLCn9zuK-HQl-JmzftUKrUaakiTgRRgn6dNBR1fZyrEtBA	2026-02-16 08:12:59.169 -0300




---------------------------------------------------------------------------------------------------------------------------------------------------------

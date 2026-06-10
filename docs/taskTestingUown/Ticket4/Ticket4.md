---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/backend/payment-gateway/-/issues/4


UOWN | Payment Gateway | Implement new API - OMNIFUND


Implement bew API:
https://gotobilling.atlassian.net/wiki/spaces/DOC/pages/827275/HTTP+API


More Attachment: (Sandbox credentials)
Sandbox
	"GatewayConfiguration": {
		"Processors": [
			{
				"Id": 1,
				"Weight": 100,
				"InvestorId": 1,
				"Memo": "Lease Payment for Kornerstone Living",
				"SourceDescription": "",
				"Name": "OmniFund Sandbox",
				"ServiceUri": "https://secure.gotobilling.com/os/system/gateway/transact.php",
				"SettlementUri": "https://secure.gotobilling.com/api/v1/settlements",
				"Type": "Payment.Gateways.OmniFundProcessor, Payment.Gateways, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null",
				"MerchantIdentification": {
					"Id": "238857",
					"AccessKey": "D33188CE2C874DBB8245",
					"Secret": "490B9B4EEA1E4290BA824310DC3F856B",
					"DailyDebitLimit": 600000,
					"SingleTransactionLimit": 5000
				}
			},
			{
				"Id": 2,
				"Weight": 100,
				"InvestorId": 2,
				"Memo": "Lease Payment for Kornerstone Living",
				"SourceDescription": "",
				"Name": "OmniFund Sandbox (ARC)",
				"Type": "Payment.Gateways.OmniFundProcessor, Payment.Gateways, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null",
				"ServiceUri": "https://secure.gotobilling.com/os/system/gateway/transact.php",
				"SettlementUri": "https://secure.gotobilling.com/api/v1/settlements",
				"MerchantIdentification": {
					"Id": "238941",
					"AccessKey": "32BD58C7E3344478893C",
					"Secret": "027E5E300302436C969AF2C4CBB38372",
					"DailyDebitLimit": 600000,
					"SingleTransactionLimit": 5000
				}
			},
			{
				"Id": 3,
				"Weight": 100,
				"InvestorId": 3,
				"IsTesting": true,
				"Memo": "Lease Payment for Kornerstone Living",
				"SourceDescription": "",
				"Name": "OmniFund Sandbox 2",
				"Type": "Payment.Gateways.OmniFundProcessor, Payment.Gateways, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null",
				"ServiceUri": "https://secure.gotobilling.com/os/system/gateway/transact.php",
				"SettlementUri": "https://secure.gotobilling.com/api/v1/settlements",
				"MerchantIdentification": {
					"Id": "239096",
					"AccessKey": "ACA6ED3707984FA4B9B8",
					"Secret": "142E6F0EC5E14B7EA4D1E6435D1CD27D",
					"DailyDebitLimit": 600000,
					"SingleTransactionLimit": 5000
				}
			},
			{
				"Id": 4,
				"Weight": 100,
				"InvestorId": 3,
				"IsTesting": true,
				"Memo": "KashApp Spiff Payment for Sales Associates",
				"SourceDescription": "",
				"Name": "KC Kash Sandbox",
				"Type": "Payment.Gateways.OmniFundProcessor, Payment.Gateways, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null",
				"ServiceUri": "https://secure.gotobilling.com/os/system/gateway/transact.php",
				"SettlementUri": "https://secure.gotobilling.com/api/v1/settlements",
				"MerchantIdentification": {
					"Id": "239297",
					"AccessKey": "6E78939F2B294CBC946E",
					"Secret": "CC290ABC15C3439DA450831D40737B",
					"DailyDebitLimit": 600000,
					"SingleTransactionLimit": 5000
				}
			},
			{
				"Id": 5,
				"Weight": 100,
				"InvestorId": 3,
				"Memo": "KashApp Spiff Payment for Sales Associates",
				"SourceDescription": "",
				"Name": "OmniFund",
				"ServiceUri": "https://secure.gotobilling.com/os/system/gateway/transact.php",
				"SettlementUri": "https://secure.gotobilling.com/api/v1/settlements",
				"Type": "Payment.Gateways.OmniFundProcessor, Payment.Gateways, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null",
				"MerchantIdentification": {
					"Id": "239369",
					"AccessKey": "8C5A5753614F4FD596FA",
					"Secret": "0B2CD05F067E4F58ADCF09142C3CCB08",
					"DailyDebitLimit": 600000,
					"SingleTransactionLimit": 5000
				}
			}
		]
	}
}


Testing Steps
Using the account: https://svc-website-qa2.uownleasing.com/customer-information/11119
Make a payment and confirm it's successful and the ccVendor is OMNIFUND
![alt text](image.png)

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Alterações dev:
 src/main/java/com/uownleasing/payment/gateway/config/OmnifundConfig.java  0 → 100644
+
35
−
0

Visualizado
package com.uownleasing.payment.gateway.config;

import com.uownleasing.payment.gateway.config.configuration.ConfigurationManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OmnifundConfig {

    private final ConfigurationManagement configurationManagement;

    private static final String BASE_PATH = "com.uownleasing.payment.gateway.client.OmnifundClient.";

    public String getBaseUrl() {
        return configurationManagement.getString(BASE_PATH + "base.url", "https://secure.gotobilling.com/os/system/gateway/transact.php");
    }

    public String getAccessKey() {
        return configurationManagement.getString(BASE_PATH + "access.key", "D33188CE2C874DBB8245");
    }

    public String getAccessKeySecret() {
        return configurationManagement.getString(BASE_PATH + "access.key.secret", "490B9B4EEA1E4290BA824310DC3F856B");
    }

    public String getDebug() {
        return configurationManagement.getString(BASE_PATH + "debug", "0");
    }

    public String getVersion() {
        return configurationManagement.getString(BASE_PATH + "version", "1.1");
    }
}
 src/main/java/com/uownleasing/payment/gateway/converters/OmnifundConverter.java  0 → 100644
+
384
−
0

Visualizado
package com.uownleasing.payment.gateway.converters;

import com.uownleasing.payment.gateway.config.OmnifundConfig;
import com.uownleasing.payment.gateway.entity.db.ApiCall;
import com.uownleasing.payment.gateway.entity.db.RequestResponse;
import com.uownleasing.payment.gateway.entity.enumeration.DecisionEnum;
import com.uownleasing.payment.gateway.request.Card;
import com.uownleasing.payment.gateway.request.RequestMessage;
import com.uownleasing.payment.gateway.repository.ApiCallRepo;
import com.uownleasing.payment.gateway.repository.RequestResponseRepo;
import com.uownleasing.payment.gateway.response.CCAuthReply;
import com.uownleasing.payment.gateway.response.CCCaptureReply;
import com.uownleasing.payment.gateway.response.OmnifundResponseData;
import com.uownleasing.payment.gateway.response.ReplyMessage;
import com.uownleasing.payment.gateway.utility.DateTimeUtil;
import com.uownleasing.payment.gateway.utility.XMLXpathParser;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import javax.xml.xpath.XPathExpressionException;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
public class OmnifundConverter {

    @Autowired
    private OmnifundConfig omnifundConfig;

    @Autowired
    private ApiCallRepo apiCallRepo;

    @Autowired
    private RequestResponseRepo requestResponseRepo;

    private static final String DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    public MultiValueMap<String, String> convertRequestMessageToFormUrlEncoded(RequestMessage requestMessage, String transactionType) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();

        // Configurable fields
        formData.add("access_key", omnifundConfig.getAccessKey());
        formData.add("access_key_secret", omnifundConfig.getAccessKeySecret());
        formData.add("x_debug", omnifundConfig.getDebug());
        formData.add("x_version", omnifundConfig.getVersion());

        if (requestMessage.getLeadPK() != null) {
            formData.add("x_customer_id", String.valueOf(requestMessage.getLeadPK()));
        }
        if (requestMessage.getAmount() != null) {
            String formattedAmount = requestMessage.getAmount()
                .setScale(2, RoundingMode.HALF_EVEN)
                .toPlainString();
            formData.add("x_amount", formattedAmount);
        }

        formData.add("x_transaction_type", transactionType);

        if (StringUtils.isNotBlank(requestMessage.getTransactionID())) {
            formData.add("x_invoice_id", requestMessage.getTransactionID());
        }

        // Add x_ticket_id for DS (capture), CR (credit)
        String ticketId = getTicketId(transactionType, requestMessage);
        if (StringUtils.isNotBlank(ticketId)) {
            formData.add("x_ticket_id", ticketId);
        }

        if (!"RM".equals(transactionType)) {
            addPaymentMethod(formData, requestMessage.getCard());
        }

        return formData;
    }

    private void addPaymentMethod(MultiValueMap<String, String> formData, Card card) {
        if (card == null) {
            return;
        }

        if (StringUtils.isNotBlank(card.getCreditCardToken())) {
            formData.add("x_payment_token_id", card.getCreditCardToken());
            return;
        }

        // Credit card fields
        addIfNotBlank(formData, "x_cc_name", card.getCardHolderName());
        addIfNotBlank(formData, "x_cc_number", card.getAccountNumber());

        if (card.getExpirationMonth() != null && card.getExpirationYear() != null) {
            String expirationDate = formatExpirationDate(card.getExpirationMonth(), card.getExpirationYear());
            formData.add("x_cc_exp", expirationDate);
        }

        addIfNotBlank(formData, "x_cc_cvv", card.getCvNumber());
    }

    private void addIfNotBlank(MultiValueMap<String, String> formData, String key, String value) {
        if (StringUtils.isNotBlank(value)) {
            formData.add(key, value);
        }
    }

    public String extractTicketIdFromResponse(String xmlResponse) {
        if (StringUtils.isBlank(xmlResponse)) {
            return null;
        }
        try {
            XMLXpathParser xmlParser = new XMLXpathParser(xmlResponse);
            return xmlParser.getExpressionValue("//ResponseData/ticket_id");
        } catch (Exception e) {
            log.warn("Error extracting ticket_id from response", e);
            return null;
        }
    }

    private String getTicketId(String transactionType, RequestMessage requestMessage) {
        String transactionId = null;

        if ("DS".equals(transactionType)) {
            // Capture: get transaction ID from authorize
            if (requestMessage.getCcCaptureService() != null
                && StringUtils.isNotBlank(requestMessage.getCcCaptureService().getAuthRequestID())) {
                transactionId = requestMessage.getCcCaptureService().getAuthRequestID();
            }
        } else if ("CR".equals(transactionType)) {
            // Credit: get transaction ID from original transaction
            if (requestMessage.getCcCreditService() != null
                && StringUtils.isNotBlank(requestMessage.getCcCreditService().getCaptureRequestID())) {
                transactionId = requestMessage.getCcCreditService().getCaptureRequestID();
            }
        }

        if (StringUtils.isBlank(transactionId)) {
            return null;
        }

        // Look up ticket_id from stored ApiCall
        return getTicketIdFromTransaction(transactionId);
    }

    private String getTicketIdFromTransaction(String transactionId) {
        if (StringUtils.isBlank(transactionId)) {
            return null;
        }

        // Look up RequestResponse by transaction ID
        RequestResponse requestResponse = requestResponseRepo.findByTransactionID(transactionId);
        if (requestResponse == null) {
            log.warn("No RequestResponse found for transactionId: {}", transactionId);
            return null;
        }

        // Get ApiCalls for this RequestResponse
        List<ApiCall> apiCalls = apiCallRepo.findByRequestResponsePK(requestResponse.getPk());
        if (apiCalls == null || apiCalls.isEmpty()) {
            log.warn("No ApiCalls found for RequestResponse pk: {}", requestResponse.getPk());
            return null;
        }

        for (ApiCall apiCall : apiCalls) {
            if (StringUtils.isNotBlank(apiCall.getReferenceId())) {
                return apiCall.getReferenceId();
            }
        }

        log.warn("No ticket_id found for transactionId: {}", transactionId);
        return null;
    }

    private String formatExpirationDate(BigInteger expirationMonth, BigInteger expirationYear) {
        String month = String.format("%02d", expirationMonth.intValue());
        String year = String.valueOf(expirationYear.intValue());
        if (year.length() == 4) {
            year = year.substring(2);
        }
        return month + year;
    }

    public ReplyMessage convertXmlResponseToReplyMessage(ResponseEntity<String> response, RequestMessage requestMessage) {
        ReplyMessage replyMessage = new ReplyMessage();
        replyMessage.setMerchantReferenceCode(requestMessage.getMerchantReferenceCode());

        // Validate HTTP response
        ReplyMessage errorResponse = validateHttpResponse(response, replyMessage);
        if (errorResponse != null) {
            return errorResponse;
        }

        String xmlResponse = response.getBody();
        try {
            XMLXpathParser xmlParser = new XMLXpathParser(xmlResponse);
            OmnifundResponseData responseData = extractResponseFields(xmlParser);

            setBasicReplyMessageFields(replyMessage, responseData);
            setCcAuthReply(replyMessage, responseData);
            setCcCaptureReply(replyMessage, responseData);
            setCardInformation(replyMessage, responseData);

        } catch (Exception e) {
            log.error("Error parsing Omnifund XML response", e);
            replyMessage.setDecision(DecisionEnum.ERROR_150.getReason());
            replyMessage.setReasonCode(DecisionEnum.ERROR_150.getReasonCode());
            replyMessage.setErrorMessage("Error parsing response: " + e.getMessage());
        }

        return replyMessage;
    }

    private ReplyMessage validateHttpResponse(ResponseEntity<String> response, ReplyMessage replyMessage) {
        if (!response.getStatusCode().is2xxSuccessful()) {
            replyMessage.setDecision(DecisionEnum.ERROR_150.getReason());
            replyMessage.setReasonCode(DecisionEnum.ERROR_150.getReasonCode());
            replyMessage.setErrorCode(String.valueOf(response.getStatusCode().value()));
            if (response.getBody() != null) {
                replyMessage.setErrorMessage("Omnifund HTTP Error: " + response.getStatusCode() + " - " + response.getBody());
            }
            return replyMessage;
        }

        String xmlResponse = response.getBody();
        if (StringUtils.isBlank(xmlResponse)) {
            replyMessage.setDecision(DecisionEnum.ERROR_150.getReason());
            replyMessage.setReasonCode(DecisionEnum.ERROR_150.getReasonCode());
            replyMessage.setErrorMessage("Omnifund Error: Empty response body");
            return replyMessage;
        }

        return null;
    }

    private OmnifundResponseData extractResponseFields(XMLXpathParser xmlParser) throws XPathExpressionException {
        OmnifundResponseData data = new OmnifundResponseData();
        data.setStatus(xmlParser.getExpressionValue("//ResponseData/status"));
        data.setDescription(xmlParser.getExpressionValue("//ResponseData/description"));
        data.setOrderNumber(xmlParser.getExpressionValue("//ResponseData/order_number"));
        data.setTermCode(xmlParser.getExpressionValue("//ResponseData/term_code"));
        data.setTranAmount(xmlParser.getExpressionValue("//ResponseData/tran_amount"));
        data.setTranDate(xmlParser.getExpressionValue("//ResponseData/tran_date"));
        data.setTranTime(xmlParser.getExpressionValue("//ResponseData/tran_time"));
        data.setTicketId(xmlParser.getExpressionValue("//ResponseData/ticket_id"));
        data.setAuthCode(xmlParser.getExpressionValue("//ResponseData/auth_code"));
        data.setAvs(xmlParser.getExpressionValue("//ResponseData/avs"));
        data.setCvv(xmlParser.getExpressionValue("//ResponseData/cvv"));
        data.setPaymentTokenId(xmlParser.getExpressionValue("//ResponseData/payment_token_id"));
        data.setCardNetwork(xmlParser.getExpressionValue("//ResponseData/card/network"));
        data.setCardNumber(xmlParser.getExpressionValue("//ResponseData/card/number"));

        // Format date-time once for reuse
        data.setAuthorizedDateTime(formatDateTime(data.getTranDate(), data.getTranTime()));

        return data;
    }

    private void setBasicReplyMessageFields(ReplyMessage replyMessage, OmnifundResponseData data) {
        DecisionEnum decision = getDecisionForOmnifund(data.getStatus(), data.getDescription());
        replyMessage.setDecision(decision.getReason());
        replyMessage.setReasonCode(decision.getReasonCode());
        replyMessage.setApiTransactionId(data.getOrderNumber());

        if (StringUtils.isNotBlank(data.getTermCode()) && !"0".equals(data.getTermCode())) {
            replyMessage.setErrorCode(data.getTermCode());
        }

        if (decision != DecisionEnum.ACCEPT_100 && StringUtils.isNotBlank(data.getDescription())) {
            replyMessage.setErrorMessage(data.getDescription());
        }

        if (StringUtils.isNotBlank(data.getTranAmount())) {
            replyMessage.getPurchaseTotals().setGrandTotalAmount(data.getTranAmount());
        }
    }

    private void setCcAuthReply(ReplyMessage replyMessage, OmnifundResponseData data) {
        CCAuthReply ccAuthReply = new CCAuthReply();
        ccAuthReply.setReasonCode(replyMessage.getReasonCode());
        ccAuthReply.setAmount(data.getTranAmount());
        ccAuthReply.setAuthorizationCode(data.getAuthCode());
        ccAuthReply.setReconciliationID(data.getOrderNumber());
        ccAuthReply.setAuthorizedDateTime(data.getAuthorizedDateTime());
        ccAuthReply.setAvsCodeRaw(data.getAvs());
        ccAuthReply.setCvCodeRaw(data.getCvv());
        ccAuthReply.setProcessorResponse(data.getTermCode());

        replyMessage.setCcAuthReply(ccAuthReply);
    }

    private void setCcCaptureReply(ReplyMessage replyMessage, OmnifundResponseData data) {
        CCCaptureReply ccCaptureReply = new CCCaptureReply();
        ccCaptureReply.setReasonCode(replyMessage.getReasonCode());
        ccCaptureReply.setAmount(data.getTranAmount());
        ccCaptureReply.setReconciliationID(data.getOrderNumber());
        ccCaptureReply.setRequestDateTime(data.getAuthorizedDateTime());

        replyMessage.setCcCaptureReply(ccCaptureReply);
    }

    private void setCardInformation(ReplyMessage replyMessage, OmnifundResponseData data) {
        if (StringUtils.isBlank(data.getCardNumber())) {
            return;
        }

        Card card = new Card();
        card.setAccountNumber(data.getCardNumber());
        card.setCardType(data.getCardNetwork());

        if (StringUtils.isNotBlank(data.getPaymentTokenId())) {
            card.setCreditCardToken(data.getPaymentTokenId());
        }

        replyMessage.setCard(card);
    }

    private DecisionEnum getDecisionForOmnifund(String status, String description) {
        if (StringUtils.isBlank(status)) {
            return DecisionEnum.ERROR_150;
        }

        String statusUpper = status.toUpperCase().trim();

        DecisionEnum decision = getDecisionByStatus(statusUpper);
        if (decision != null) {
            return decision;
        }

        return getDecisionByDescription(description);
    }

    private DecisionEnum getDecisionByStatus(String statusUpper) {
        return switch (statusUpper) {
            case "G", "R" ->
                    DecisionEnum.ACCEPT_100;
            case "D", "C" ->
                    DecisionEnum.GENERAL_DECLINE;
            case "T" ->
                    DecisionEnum.ERROR_150;
            case "E" ->
                    DecisionEnum.ACCOUNT_INVALID;
            default -> null;
        };
    }

    private DecisionEnum getDecisionByDescription(String description) {
        if (StringUtils.isBlank(description)) {
            return DecisionEnum.ERROR_150;
        }

        String descUpper = description.toUpperCase();
        if (descUpper.contains("APPROVED") || descUpper.contains("SUCCESS")) {
            return DecisionEnum.ACCEPT_100;
        }
        if (descUpper.contains("DECLINED") || descUpper.contains("DECLINE")) {
            return DecisionEnum.GENERAL_DECLINE;
        }

        return DecisionEnum.ERROR_150;
    }

    private String formatDateTime(String tranDate, String tranTime) {
        try {
            if (StringUtils.isNotBlank(tranDate) && StringUtils.isNotBlank(tranTime)) {
                String dateTimeStr = tranDate + " " + tranTime;
                DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyyMMdd HHmmss");
                LocalDateTime dateTime = LocalDateTime.parse(dateTimeStr, inputFormatter);
                return DateTimeUtil.formatLocalDateTime(dateTime, DATE_TIME_FORMAT);
            }
        } catch (Exception e) {
            log.warn("Error formatting date/time: {} {}", tranDate, tranTime, e);
        }
        return DateTimeUtil.formatLocalDateTime(LocalDateTime.now(), DATE_TIME_FORMAT);
    }

}
 src/main/java/com/uownleasing/payment/gateway/entity/enumeration/OmnifundTransactionType.java  0 → 100644
+
36
−
0

Visualizado
package com.uownleasing.payment.gateway.entity.enumeration;

import lombok.Getter;

@Getter
public enum OmnifundTransactionType {
    // Credit Card Types
    AS("AS", "Authorize Only"),
    DS("DS", "Capture Only"),
    ES("ES", "Authorize & Capture"),
    CR("CR", "Credit/Refund"),
    VO("VO", "Void"),
    AV("AV", "AVS Check Only"),
    OF("OF", "Offline (Force)"),
    AP("AP", "3DS Tokens Only (without associated full card info)"),
    // Transaction Administration
    RM("RM", "Remove transaction");

    private final String code;
    private final String description;

    OmnifundTransactionType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public static OmnifundTransactionType fromCode(String code) {
        for (OmnifundTransactionType type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        return null;
    }
}
 src/main/java/com/uownleasing/payment/gateway/entity/enumeration/PaymentGatewayEnum.java 
+
2
−
1

Visualizado
@@ -7,5 +7,6 @@ public enum PaymentGatewayEnum {
    WORLDPAY,
    USAEPAY,
    CHANNEL_PAYMENTS_CC,
    CHANNEL_PAYMENTS_ACH
    CHANNEL_PAYMENTS_ACH,
    OMNIFUND
}
 src/main/java/com/uownleasing/payment/gateway/response/OmnifundResponseData.java  0 → 100644
+
25
−
0

Visualizado
package com.uownleasing.payment.gateway.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OmnifundResponseData {
    private String status;
    private String description;
    private String orderNumber;
    private String termCode;
    private String tranAmount;
    private String tranDate;
    private String tranTime;
    private String authorizedDateTime;
    private String ticketId;
    private String authCode;
    private String avs;
    private String cvv;
    private String paymentTokenId;
    private String cardNetwork;
    private String cardNumber;
}

---


 1 arquivo
+
1
−
1
 src/main/java/com/uownleasing/common/enumeration/CCVendor.java 
+
1
−
1

Visualizado
package com.uownleasing.common.enumeration;

public enum CCVendor {
    USAEPAY, CHANNEL_PAYMENTS_CC, OTHER;
    USAEPAY, CHANNEL_PAYMENTS_CC, OMNIFUND, OTHER;
}

---


 1 arquivo
+
3
−
1
 src/main/java/com/uownleasing/svc/service/cc/CCTransactionService.java 
+
3
−
1

Visualizado
@@ -397,10 +397,12 @@ public class CCTransactionService{
    }

    private CCVendor getCurrentVendor() {
        if (Boolean.TRUE.equals(configurationManagement.getBoolean(configurationPath + "use.omnifund", false))) {
            return CCVendor.OMNIFUND;
        }
        return configurationManagement.getBoolean(configurationPath + "use.channel.payments", true) ? CCVendor.CHANNEL_PAYMENTS_CC : CCVendor.USAEPAY;
    }


    public void runTransactionsWithSql(String sqlName, String agentUsername) {
        SvSqlConfig config = sqlConfigService.getSqlConfigBySqlName(sqlName);
        if (config != null) {

---


 1 arquivo
+
2
−
2
 src/main/java/com/uownleasing/payment/gateway/converters/OmnifundConverter.java 
+
2
−
2

Visualizado
@@ -54,8 +54,8 @@ public class OmnifundConverter {
        formData.add("x_debug", omnifundConfig.getDebug());
        formData.add("x_version", omnifundConfig.getVersion());

        if (requestMessage.getLeadPK() != null) {
            formData.add("x_customer_id", String.valueOf(requestMessage.getLeadPK()));
        if (requestMessage.getAccountPK() != null) {
            formData.add("x_customer_id", String.valueOf(requestMessage.getAccountPK()));
        }
        if (requestMessage.getAmount() != null) {
            String formattedAmount = requestMessage.getAmount()

---


 2 arquivos
+
51
−
8
Arquivos
2
Pesquisar (por exemplo, *.vue) (F)

src/main/java/com/uownleasin
‎g/payment/gateway/converters‎

OmnifundCon
‎verter.java‎
+51 -6

.gitlab
‎-ci.yml‎
+0 -2

 src/main/java/com/uownleasing/payment/gateway/converters/OmnifundConverter.java 
+
51
−
6

Visualizado
@@ -57,17 +57,32 @@ public class OmnifundConverter {
        if (requestMessage.getAccountPK() != null) {
            formData.add("x_customer_id", String.valueOf(requestMessage.getAccountPK()));
        }
        if (requestMessage.getAmount() != null) {
            String formattedAmount = requestMessage.getAmount()
                .setScale(2, RoundingMode.HALF_EVEN)
                .toPlainString();

        if (requestMessage.getCard() != null && StringUtils.isNotBlank(requestMessage.getCard().getCardHolderName())) {
            parseNameFromCardHolderName(requestMessage.getCard().getCardHolderName(), formData);
        } else if (requestMessage.getBillTo() != null) {
            if (StringUtils.isNotBlank(requestMessage.getBillTo().getFirstName())) {
                formData.add("x_first_name", requestMessage.getBillTo().getFirstName());
            }
            if (StringUtils.isNotBlank(requestMessage.getBillTo().getLastName())) {
                formData.add("x_last_name", requestMessage.getBillTo().getLastName());
            }
        }

        if (requestMessage.getPurchaseTotals() != null
            && StringUtils.isNotBlank(requestMessage.getPurchaseTotals().getGrandTotalAmount())) {
            String grandTotalAmount = requestMessage.getPurchaseTotals().getGrandTotalAmount();
            BigDecimal amount = new BigDecimal(grandTotalAmount);
            String formattedAmount = amount.setScale(2, RoundingMode.HALF_EVEN).toPlainString();
            formData.add("x_amount", formattedAmount);
        }

        formData.add("x_transaction_type", transactionType);

        if (StringUtils.isNotBlank(requestMessage.getTransactionID())) {
            formData.add("x_invoice_id", requestMessage.getTransactionID());
        // Add x_invoice_id from Snowflake ID in transactionID
        String invoiceId = extractInvoiceId(requestMessage);
        if (StringUtils.isNotBlank(invoiceId)) {
            formData.add("x_invoice_id", invoiceId);
        }

        // Add x_ticket_id for DS (capture), CR (credit)
@@ -111,6 +126,36 @@ public class OmnifundConverter {
        }
    }

    private String extractInvoiceId(RequestMessage requestMessage) {
        if (StringUtils.isBlank(requestMessage.getTransactionID())) {
            return null;
        }
        String transactionID = requestMessage.getTransactionID();
        int underscoreIndex = transactionID.lastIndexOf('_');
        if (underscoreIndex > 0 && underscoreIndex < transactionID.length() - 1) {
            String snowflakeId = transactionID.substring(underscoreIndex + 1);
            return snowflakeId.length() <= 32 ? snowflakeId : null;
        }
        return null;
    }

    private void parseNameFromCardHolderName(String cardHolderName, MultiValueMap<String, String> formData) {
        if (StringUtils.isBlank(cardHolderName)) {
            return;
        }
        String normalizedName = cardHolderName.trim().replaceAll("\\s+", " ");
        String[] parts = normalizedName.split(" ", 2);

        String firstName = parts[0];
        if (StringUtils.isNotBlank(firstName)) {
            formData.add("x_first_name", firstName);
        }

        if (parts.length > 1 && StringUtils.isNotBlank(parts[1])) {
            formData.add("x_last_name", parts[1]);
        }
    }

    public String extractTicketIdFromResponse(String xmlResponse) {
        if (StringUtils.isBlank(xmlResponse)) {
            return null;
 .gitlab-ci.yml 
+
0
−
2

Visualizado
@@ -17,8 +17,6 @@ before_script:
.release-env:
  except:
    - master
  only:
    - /^R\d+\.\d+\.\d+$/

export vars:
  extends: .release-env

---

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

https://gotobilling.atlassian.net/wiki/spaces/DOC/pages/827275/HTTP+API



Developer Information
/
HTTP API



HTTP API



By Jed Danner
Sept 18, 2025

thumbs up
1
Legacy editor
Overview
Purpose
Changelog
Notes about the Merchant IDs and PINs
Use of the x_payment_token_id field
Data Type Conventions
Transaction Fields
Merchant Credentials
API Access Key Pair
OAuth2 Client ID & Secret
OAuth2 Client ID & Access Token
Merchant ID and PIN **DEPRECATED**
Optional Fields
Customer Fields
Transaction Information
Transaction Information - ACH
Transaction Information – Credit Card
Example Requests
Credit Card AUTH-CAPTURE
Request
Response (Approval)
Credit Card PRE-AUTH, CAPTURE
PRE-AUTH Request
Response (Approval)
CAPTURE Request
Response (Approval)
Tokenization
Credit Card Tokenization Request
Response
Credit Card Tokenization via Initial Sale Request
Response
Subsequent Requests
Gateway Response
Example Non-Relay Response Data
Relayed Response
Example Relay Response Data
Example Non-Relay Response Data with ACH Verification
Approval
Decline
Level 1 Verification Information
Additional Info
Format Accept
Format Warning/Reject
Example Warning/Reject
Debug and Test ACH Information
Level 2 Verification Information
Additional Info
Format
Example
Debug and Test Card Information
Card #s that will return an approval "G"
Card #s that will return a decline "D"
Loopback Testing Procedures
Test Parameters
Valid AVS
Valid CV: (This must be supplied or you will always receive a Decline response)
Old basic amount checks
New amount checks (phard_code)
New amount checks (msoft_code)
Visa Cardlevel Results
Overview
Purpose
The Gateway Submission API defines the type of information that may be sent to the gateway. When transmitting data to the gateway, information should be posted to

/os/system/gateway/transact.php
GOTOBILLING recognizes and processes both GET and POST methods. The interface between the ISP and GOTOBILLING is the standard HTTP/1.0 (or HTTP/1.1) protocol using Secure Sockets Layer (SSL) encryption.

Transactions are broken up into delimited fields. A transaction is transmitted either in the request header for the GET method or following the request headers for the POST method.

Changelog
~	Added PN transaction-type for indicating ACH Pre-Note requests.	2021-07-14
1.3	x_customer_id now allows for alpha-numeric characters, as well as, the special characters period ., underscore _, and dash -	2021-06-15
Notes about the Merchant IDs and PINs
Merchant IDs (also called Merchant-IDs) and PINs are issued by gotoBilling upon approval of a merchant's account application. These are sensitive fields that must remain confidential. Under no circumstances should the contents of these fields be available to the shopper, either on-screen or through a browser's View/Source command. Instead, they should be filled in by the merchant's web application prior to forwarding to GOTOBILLING.
Merchants must be approved in advance to submit electronic check credit transactions. Once approved, specific conditions apply.
Use of the x_payment_token_id field
The Purpose of the x_payment_token_id field is to allow a “one-time” sending of the Credit Card number or the Route and Account number (for an ACH transaction) and then be able to reference it in the future without needing to send the card number or account number again. This allows an application to be developed where it does not have to store these sensitive numbers but instead, gotoBilling is the only place these numbers are stored securely. A future transaction may be as simple as needing to process a credit card refund or an ACH credit. This can now be accomplished if the associated x_payment_token_id from the original transaction is sent. Therefore, the application must keep a database of x_payment_token_ids for all transactions sent if future transactions using this field are to be performed. The following are the basic points regarding using this feature:

Initially, the payment account information (CC Number, ACH Account) can be sent along with the x_payment_token_id.
The account can then be accessed in the future by simply passing the x_payment_token_id for the desired account. The individual account information is not needed.
If any account information is passed with an existing x_payment_token_id. That account information will be updated to match the information given.
The x_payment_token_id should be unique. Technically it only has to be unique per Customer ID (x_customer_id) but it might be easier to design if it is unique across the entire Merchant ID (merchant_id) so there’s no duplication at all. One suggestion would be to have the x_payment_token_id be the x_customer_id+(some value) where the value could be the date in YYYYMMDD format. This would facilitate easier research if needed and would likely be easier to implement than other numbering schemes. Especially since the x_customer_id must be unique across the Merchant ID.
IMPORTANT NOTE: Validation for the uniqueness of this field will be added in the future, however, it is not currently live.

When using the x_payment_token_id to reference an existing credit card on file, the following credit card fields are not needed as they will already be on file in gotobilling when the original transaction was sent:

x_cc_type
x_cc_name
x_cc_number
x_cc_exp
For ACH transactions, the following fields will not be needed since they will be on file:

x_ach_route
x_ach_account
x_ach_account_type
Data Type Conventions
a	Alpha characters [a-z, A-Z]
n	Numeric digits [0-9]
s	
Special characters -.@#,

Transaction Fields
Merchant Credentials
Merchant credentials can be submitted in a couple of different ways.  The legacy method of using the six digit merchant ID and gateway pin, or using an API access key pair.  Only one set of credentials are required.  It is recommended to use the API key pair which allows for greater control over the credentials.  You can generate an Access key pair in the OmniFund dashboard by visiting:  Profile > API Access

API Access Key Pair
For more information on obtaining an API access key, see: Managing API Access Keys

access_key	Required	Generated API access key
access_key_secret	Required	Key secret associated with the given access_key
OAuth2 Client ID & Secret
For more information on obtaining and working with an OAuth2 client, see: Managing OAuth Clients

client_id	Required	Generated Client ID
client_secret	Required	Client secret associated with the given client_id
OAuth2 Client ID & Access Token
For more information on obtaining and working with an OAuth2 client, see: Managing OAuth Clients

client_id	Required	Generated Client ID
access_token	Required	User access token
Merchant ID and PIN **DEPRECATED**
For more information on obtaining your PIN, see: Generating a Merchant Gateway Pin

merchant_id	Required	Merchant ID assigned by gotoBilling
merchant_pin	Required	Merchant Pin associated with the Merchant ID. Assigned by gotoBilling
Optional Fields
x_relay_url	Optional	an. ..	Contains the URL to which the gateway will post the response. Include http:// or https://. When set the gateway response will automatically be sent via HTTP POST to this location.
x_relay_type	Optional	a. 7	Indicates the type of action of the response. When ACTIVE is set the browser will automatically be sent to the location specified with x_relay_url. When PASSIVE is set the browser will not be redirected, but the response will be sent to the location specified with x_relay_url via HTTP POST. This is set to default to PASSIVE
x_debug

Optional	n. 1	When set to 1 (numerical one) transactions will be sent in test mode. A response will be given for the transaction, but no processing will occur. Default: 0 (zero).
x_version	Optional	ns 3	DEFAULT: 1.1  (When this value is set to 1.2, the transaction Gateway Response will be returned in JSON format, rather than XML format)
Customer Fields
x_customer_id	Required	ans 32	A unique customer Identification number set by
the merchant.

x_company	Conditional	an 32	The company associated with the billing address. Either first name & last name, or company name must be given.
x_last_name	Conditional	an 32	The last name of the customer associated with
the billing address. Either first name & last name, or company name must be given.

x_first_name	Conditional	an 32	The first name of the customer associated with
the billing address. Either first name & last name, or company name must be given.

x_address1	Optional	an 32	The address associated with the billing
address

x_address2	Optional	an 32	Continuation address associated with the
billing address

x_city	Optional	a 40	The city associated with the billing address
x_state	Optional	a 2	The state associated with the billing address.
The state is formatted using the two letter post abbreviation. Example: FL

x_zip	Optional	ns 10	The zip code associated with the billing address
x_phone	Optional	n 10	The phone number of the customer associated with the billing address. Does not contain any dashes – ex. 2223334444
x_email	Optional	ans 50	The email of the customer associated with the billing address.
Transaction Information
x_transaction_type	Required	2	This field identifies the type of transaction
being submitted. Valid transaction types are:

Credit Card Type:

AS – Authorize Only
DS – Capture Only
ES – Authorize & Capture
CR – Credit/Refund
VO – Void
AV – AVS Check Only
OF – Offline (Force)
AP – 3DS tokens Only (without associated full card info)
ACH Transactions:

DH - Electronic Check Debit
DC - Electronic Check Credit
DV - Electronic Check Verification Only
PN - Electronic Check Pre-Note
Transaction Administration:

RM - Remove transaction (See x_invoice_id)
x_invoice_id	Required	an 32	Unique transaction ID field specified by the merchant. Also used in determining duplicate submissions.
For transaction type ‘RM’ this can be set to a specific id to remove a single transaction, or can be set to ‘ALL’ to remove all transactions currently pending for the given customer id.

x_amount	Required	n 10	
Amount to be charged or credited. The amount may be formatted with or without a decimal. If no decimal is given two (2) decimal places are assumed (1.00 = 100).

Note:  Must be zero (0) for PN transaction types.

x_process_date	Optional	n 8	Date on which the transaction is to be
processed. If no date is given, the transaction will default to the date it is submitted on. Format: YYYYMMDD

x_invoice_file	Optional	
File containing information to be sent to the customer via email when the transaction is processed.

x_payment_token_id	Optional	an 20	1) Initially the payment account information
(CC Number, ACH Account) can be sent along with the x_payment_token_id. 2) The account can then be accessed in the future simply by passing the x_payment_token_id for the desired account. The individual account information is not needed. 3) If any account information is passed with an existing x_payment_token_id. That account information will be updated to match the information given. The x_payment_token_id should be unique. Validation will be added for this, however it is not currently live.

x_memo	Optional	ans 255	Description of transaction to be forwarded to
the customer.

x_notes	Optional	ans 255	Internal notes to be stored with the
transaction.

x_occurrence_type	Optional	an 10	Used for setting up recurring transactions.
Available types: • week • biweek • month • bimonth • quarter • semiannual • annual

x_occurrence_number	Optional	n 3	Specify the number of occurrences for a
recurring transaction. If no occurrence number is giving, the default will be set to indefinite until deleted manually.

x_source_description	Optional	an 20	This is to be used by the developer to send
the name and version number of the software that is sending the transactions. It’s a free form description field to tell GTB the source of the transactions.

x_module_description	Optional	an 20	This field is used by the developer to send
the name and version number of a module or plugin that was built using this API. This allows for proper tracking of plugins or modules that may be built and then used in other software applications. The end software application name and version number would be put into the “source_description” field.

x_custom_field	Optional	n 1	Presentment indicator for ACH transactions.
x_po_number	Optional	an 50	PO number associated with the transaction. Unique PO numbers can also be used by allow duplicate transactions if duplicate processing is current disabled.
Transaction Information - ACH
x_ach_payment_type	For ach transactions: Required	a 3	* PPD (Prearranged Payment and Deposit
Entry). Used to submit prearranged credit and debit transactions such as payroll deposits and periodic bill payments against a consumer's account.

WEB (Internet-Initiated Entry). Used to
submit debit entries pursuant to an authorization that has been obtained from the consumer via the Internet.

TEL (Telephone-Initiated Entry). Used to
submit transactions pursuant to an oral authorization obtained from the consumer via the telephone. NACHA regulations require that either the session in which the order was taken be recorded, or the consumer be notified in writing prior to initiation.

ARC (Accounts Receivable Entry): Used
to submit ACH debits for consumer checks received via the U.S. mail or at a drop-box location for the payment of goods or services. The consumer's source document (e.g. the check) is used to collect the consumer's routing number, account number, check serial number, (in raw MICR format) and the dollar amount for the transaction.

RCK (Re-Presentation Check Entry):
Format used to represent a returned check, through the generation of a single entry ACH debit. The RCK SEC allows for a single entry ACH debit transaction to represent a paper check after the paper check has been returned for either insufficient or uncollected funds.

ICL (Image Cash Letter): RESERVED-Use
only if directed to do so.

x_ach_route	Conditional	n 9	Routing number of the bank associated with
the customers bank account. Can send the x_payment_token_id to reference an existing Route and Account.

x_ach_account	Conditional	n 20	Account number associated with the customer's bank account. Can send the x_payment_token_id to reference an existing Route and Account.
x_ach_account_type	Conditional	a 2	Personal Accounts
PC – Personal Checking
PS – Personal Savings
Business Accounts (Business designations currently not in use-they would create CCD transactions vs. PPD)

BC – Business Checking
BS – Business Savings
Not needed if x_payment_token_id is sent to reference an existing account

x_ach_serial	Conditional	n 10	Check number of the transaction being submitted. Required for Payment Type ARC, RCK
x_arc_image	Conditional	an 22	TIF image file associated with ARC transactions
x_ach_verification	Conditional	n 1	Set to 1 to enable.. otherwise default is off.
There are two levels of ACH verification but that is set on the Account level at gotoBilling. If an ACH transaction receives an Authorization the status sent back will be R, if it is Declined, the status will be D.

Transaction Information – Credit Card
x_cc_type	For cc transactions: Optional	a 2	Card Types:
VS – Visa
MC – MasterCard
AX – Amex
DC – Discover
x_cc_name	Optional	a 32	Contains the name located on the credit card
x_cc_number	Conditional	n 22	Contains the credit card number.
Can send the x_payment_token_id to reference an existing Credit card on file.

x_cc_exp	Conditional	n 4	Contains the expiration date for the credit
card. Format: MMYY Can send the x_payment_token_id to reference an existing Credit card on file

x_cc_cvv	Optional	n 4	Three or Four digit validation number for the credit card
x_ticket_id	Conditional	n 32	Ticket ID of a transaction previously approved by the gateway. This is required for the following transaction types: DS (capture), CR (refund), VO (void)
x_authorization	Conditional	n 32	Authorization code of a transaction previously authorized by the gateway. This is required for the following transaction types: OF (offline force)
x_trackdata	Optional	n 4	Combined Track1 and Track2 data from credit card POS device.
x_token	Optional	ans ..	A valid 3DS (3D Secure) payment token, issued by a trusted provider offering payment tokenization, must be presented in this field.
The x_token field value must be included along with the other conditionally required fields for Credit Card type transactions (x_cc_number, x_cc_exp and x_cc_cvv).
Example Requests
Credit Card AUTH-CAPTURE
Request
POST /os/system/gateway/transact.php
Content-Type: application/x-www-form-urlencoded

merchant_id = "123456"
merchant_pin' = "gatewayPin"
x_transaction_type = "ES"
x_customer_id = "27500000001"
x_first_name = "Test"
x_last_name = "Account"
x_zip = "55555"
x_amount = "36.00"
x_cc_number = "4111111111111111"
x_cc_name = "Ester Tester"
x_cc_exp = "1215"
Response (Approval)
<ResponseData>
  <status>G</status>
  <order_number>122879-20050804-985829</order_number>
  <term_code>0</term_code>
  <tran_amount>36.00</tran_amount>
  <tran_date>20160804</tran_date>
  <tran_time>091121</tran_time>
  <ticket_id>1234</ticket_id>
  <auth_code>094533</auth_code>
  <description>APPROVED</description>
  <avs>GOOD</avs>
  <cvv>UNKNOWN</cvv>
  <type>card</type>
  <card>
     <network>Visa</network>
     <number>4111xxxxxxxx1111</number>
     <expiration>1215</expiration>
  </card>
</ResponseData>
Credit Card PRE-AUTH, CAPTURE
PRE-AUTH Request
POST /os/system/gateway/transact.php
Content-Type: application/x-www-form-urlencoded

merchant_id = "123456"
merchant_pin' = "gatewayPin"
x_transaction_type = "AS"
x_customer_id = "27500000001"
x_first_name = "Test"
x_last_name = "Account"
x_zip = "55555"
x_amount = "36.00"
x_cc_number = "4111111111111111"
x_cc_name = "Ester Tester"
x_cc_exp = "1215"
Response (Approval)
<ResponseData>
  <status>G</status>
  <order_number>123456-20050804-985829</order_number
  <term_code>0</term_code>
  <tran_amount>36.00</tran_amount>
  <tran_date>20160804</tran_date>
  <tran_time>091121</tran_time>
  <ticket_id>1234</ticket_id>
  <auth_code>094533</auth_code>
  <description>APPROVED</description>
  <avs>GOOD</avs>
  <cvv>UNKNOWN</cvv>
  <type>card</type>
  <card>
     <network>Visa</network>
     <number>4111xxxxxxxx1111</number>
     <expiration>1215</expiration>
  </card>
  <payment_token_id>tok_194bfc699e124281b87f1ad4266e64be</payment_token_id>
</ResponseData>
CAPTURE Request
POST /os/system/gateway/transact.php
Content-Type: application/x-www-form-urlencoded

merchant_id = "123456"
merchant_pin' = "gatewayPin"
x_transaction_type = "DS"
x_customer_id = "27500000001"
x_amount = "36.00"
x_ticket_id = "1234"
Response (Approval)
<ResponseData>
    <status>G</status>
    <order_number>123456-20170509-59120e0c5b178</order_number>
    <term_code>0</term_code>
    <tran_amount>36.00</tran_amount>
    <tran_date>20160804</tran_date>
    <tran_time>091121</tran_time>
    <ticket_id>1234</ticket_id>
    <auth_code>094533</auth_code>
    <description>APPROVED</description>
    <avs>GOOD</avs>
    <cvv>UNKNOWN</cvv>
    <phard_code>SUCCESS</phard_code>
    <payment_token_id>tok_194bfc699e124281b87f1ad4266e64be</payment_token_id>
</ResponseData>
Tokenization
Credit Card Tokenization Request
POST /os/system/gateway/transact.php
Content-Type: application/x-www-form-urlencoded

merchant_id = "123456"
merchant_pin = "gatewayPin"
x_transaction_type = "TK"
x_customer_id = "27500000001"
x_first_name = "Test"
x_last_name = "Account"
x_zip = "55555"
x_cc_number = "4111111111111111"
x_cc_name = "Ester Tester"
x_cc_exp = "1215"
Response
<ResponseData>
  <status>G</status>
  <order_number>123456-20161128-583c83a833fcd</order_number>
  <term_code>0</term_code>
  <tran_amount></tran_amount>
  <tran_date>20161128</tran_date>
  <tran_time>132112</tran_time>
  <invoice_id></invoice_id>
  <transaction_id></transaction_id>
  <type>card</type>
  <card>
     <network>Visa</network>
     <number>4111xxxxxxxx1111</number>
     <expiration>1215</expiration>
  </card>
  <payment_token_id>tok_9fc0739aa554441e96151bae88943154</payment_token_id>
  </ResponseData>
Credit Card Tokenization via Initial Sale Request
POST /os/system/gateway/transact.php
Content-Type: application/x-www-form-urlencoded

merchant_id = "123456"
merchant_pin = "gatewayPin"
x_transaction_type = "ES"
x_customer_id = "27500000001"
x_first_name = "Test"
x_last_name = "Account"
x_zip = "55555"
x_amount = "36.00"
x_cc_number = "4111111111111111"
x_cc_name = "Ester Tester"
x_cc_exp = "1215"
Response
<ResponseData>
  <status>G</status>
  <order_number>122879-20050804-985829</order_number
  <term_code>0</term_code>
  <tran_amount>36.00</tran_amount>
  <tran_date>20160804</tran_date>
  <tran_time>091121</tran_time>
  <ticket_id>1234</ticket_id>
  <auth_code>094533</auth_code>
  <description>APPROVED</description>
  <avs>GOOD</avs>
  <cvv>UNKNOWN</cvv>
  <type>card</type>
  <card>
     <network>Visa</network>
     <number>4111xxxxxxxx1111</number>
     <expiration>1215</expiration>
  </card>
  <payment_token_id>tok_5aeda1a4e5e244cbbb45d6594dbb1ad</payment_token_id>
</ResponseData>
Subsequent Requests
All other request may utilize the 'x_payment_token_id' instead of the card data.

POST /os/system/gateway/transact.php
Content-Type: application/x-www-form-urlencoded

merchant_id = "123456"
merchant_pin = "gatewayPin"
x_transaction_type = "ES"
x_customer_id = "27500000001"
x_first_name = "Test"
x_last_name = "Account"
x_zip = "55555"
x_amount = "5.00"
x_payment_token_id = "tok_5aeda1a4e5e244cbbb45d6594dbb1ad"
Gateway Response
The Gateway Response API defines the type of information that will be sent by the gateway once a transaction has been processed. The gateway response type can be changed from the default XML response to a JSON response by passing in x_version=1.2 through incoming parameters, as outlined in the Optional Fields section above.

Non-Rely Response.

Gateway Responses are delimited by the GOTOBILLING tags:

<ResponseData>
</ResponseData>
<status></status>	Transaction Status. Values are:
G - Approved
R - Received
D - Declined
C - Cancelled
T - Timeout waiting for host response
E – Invalid debug card number
Response Statuses for Various Transaction Types: Credit Card:

AS – Authorize Only (G if approved)
DS – Capture Only
ES – Authorize & Capture (G if approved)
CR – Credit/Refund
VO – Void
Future dated transactions always get R on both Credit Card and ACH transactions.

When using the ACH Verification option, if an ACH transaction receives an Authorization the status sent back will be R, if it is Declined, the status will be D. An

<order_number></order_number>	A 22-digit code, formatted nnnn-nnnnn-nnnnn, used
by GOTOBILLING to synchronize and track transactions and orders. It is not used or recognized by the GOTOBILLING host computers.

<term_code></term_code>	The reason the gotoBilling process
terminated. Values are: 30998 Internal software error. 20999 Missing or invalid Merchant-ID 20998 Could not validate Merchant-ID 20997 Invalid server (potential security violation) 20996 Missing transaction type 20995 Invalid transaction type 20994 Reserved 20993 Reserved 20992 Reserved 20991 Reserved 20990 Reserved 20989 Both Card and Check services are turned off 20988 Merchant is not approved for service 20987 Reserved 20986 Reserved 20985 Reserved 20984 Reserved 20983 Reserved 20982 Reserved 20981 Reserved 20980 Reserved 20979 A required transaction field is missing 20978 A required transaction field is invalid/missing 0 Normal Termination On 20979 and 20978 the <description> field will tell what field it is that is missing or invalid.

<tran_amount></tran_amount>	The amount of the transaction. This field should be the
same as the field x_amount in the submitted transaction (see above).

<tran_date></tran_date>	Date Stamp of when the transaction was processed.
Format: YYYYMMDD

<tran_time></tran_time>	Time Stamp of when the transaction was processed.
Format: HHMMSS

<invoice_id></invoice_id>	Echo of merchant submitted Order ID
<ticket_id></ticket_id>	For credit card transactions this is the 'x_ticket_id' that is used when performing a void or refund.
<auth_code></auth_code>	Reference number identifying the transaction on the gateway
<description></description>	Description of any error or decline returned for the
transaction.

<avs></avs>	AVS response text
BAD – no match on street or zip
GOOD – street and zip match
STREET – Zip match, street doesn't
ZIP – street match, zip doesn't
UNKNOWN – AVS info not available, treat as good
<cvv></cvv>	CVV response text
BAD – CVV code doesn't match
GOOD – CVV code match
UNKNOWN – CVV data not available, treat as good
<phard_code></phard_code>	Text supplied by the card issuer. Generally additional details about a decline
<version></version>	
(optional response) Version response text is returned ONLY when x_version is specified in incoming parameters.

1.1 - XML Format returned
1.2 - JSON Format returned
<type></type>	
(Conditional response based on type of payment specified) The type of payment received will be indicated by the following values:

bank (for transactions with ACH payment information included)
card (for transactions with Credit Card payment information included)
The type value returned in this node will indicate what payment type value node to look for in the provided response.

    <card>
        <network></network>
        <number></number>
        <expiration></expiration>
    </card>
(Conditional response provided ONLY for Credit Card payments) Additional information about the credit card payment type will now be included in the card node. Children nodes include:

network (card type)
number (shows masked card number)
expiration (numbers only)
    <bank>
        <account></account>
        <routing></routing>
    </bank>
(Conditional response provided ONLY for ACH payments) Additional information about the ACH payment type will now be included in the bank node. Children nodes include:

account (shows masked account number)
routing (shows routing number)
<payment_token_id></payment_token_id>	Token assigned to the payment account. Can be used in subsequent request instead of providing the actual card or bank details.
Example Non-Relay Response Data
<ResponseData>
  <status>R</status>
  <order_number>122879-20050804-985829</order_number
  <term_code>0</term_code>
  <tran_amount>12.33</tran_amount>
  <tran_date>20050804</tran_date>
  <tran_time>091121</tran_time>
  <invoice_id>123549854</invoice_id>
</ResponseData>
Relayed Response
A relayed response will contain the same information, but will be formatted in a HTTP REQUEST string. Active being POST and Inactive being GET.

Example Relay Response Data
?status=R&order_number=122879-20050804-
985829&term_code=0&tran_amount=12.33&tran_date=20050804&tran_time=091121&invoice_id=123549854
Example Non-Relay Response Data with ACH Verification
Approval
<ResponseData>
<status>R</status>
<order_number>122879-20081217198384</order_number>
<term_code>0</term_code>
<tran_amount>1.01</tran_amount>
<tran_date>20081217</tran_date>
<tran_time>131643</tran_time>
<invoice_id>44444</invoice_id>
<description>AUTH NUM 123-1234</description>
</ResponseData>
Decline
<ResponseData>
<status>D</status>
<order_number>122879-20081217198384</order_number>
<term_code>0</term_code>
<tran_amount>1.01</tran_amount>
<tran_date>20081217</tran_date>
<tran_time>131643</tran_time>
<invoice_id>44444</invoice_id>
<description>CHEXDIRECT|DECLINE CHECK|3 UNPAIDS (ALL)|UNPAID AMT= 35|PHN 800-238-5888|EXPRESS RECOVERY</description>
</ResponseData>


Level 1 Verification Information
Level 1 ACH verification compares the given account information against a neg file database. Results for accounts that do not contain any negative data will return an AUTH NUM indicating that no negative events have been recorded for the account. Additional info will be passed in the <description> field.

Additional Info
History of Ineligible	Account does have a reported history and there is known transaction history on the account.
Routing Number is Invalid	Invalid bank routing number
History of Unauthorized	Account does not have a reported history or returns for Account Closed, Invalid Account, No account found, or Unable to locate, the routing number and account format are verified and there is no known transactional history on the account.
Wrong Account Structure

The account identified as suspicious format
Not populated	Account does not have a reported history or returns for Account Closed, Invalid Account, No account found, or Unable to locate, the routing number and account format are verified, and there is known transactional history on the account.
Format Accept
<auth_code>
AUTH NUM
</auth_code>

Example Accept
<auth_code>
AUTH NUM 6847027C
</auth_code>

Format Warning/Reject
<description>
ADDITIONAL INFO
</description>
Example Warning/Reject
<description>
HISTORY OF UNAUTHORIZED
</description>


Debug and Test ACH Information
ACCEPT	Valid (AUTH NUM)	Bank of America	053200983	11101010
WARNING	History of Ineligible	Bank of America	226078036	13590100098321
WARNING	Routing Number is Invalid	Bank of America	053200983	11101012
DECLINE	History of Unauthorized	Bank of America	226078036	13590100098319
WARNING	
Wrong Account Structure

Bank of America	053200983	11101015
Level 2 Verification Information
Level 2 verification will return some additional information with the verification AUTH NUM. This additional info will be passed with the AUTH NUM in the <description> field with a pip ("|") delimiter.

Additional Info
Non-Participating: Negative Information	This customer's bank does not participate in the Bank ACH Verification system. However, the normal negative database has negative information (returned checks) that are in the system.
ACH Unavailable	This merchant's bank account is not able to be debited via the ACH system.
Non-Participating: No Info	This customer's bank does not participate in the Bank ACH Verification system and the customer's bank account has not been seen in the negative database system.
Account Closed or Neg Status	The customer's bank participates in the Bank ACH Verification system and is reporting this account as Closed or in a state that will result in the ACH transaction being returned.
Account Good	The customer's bank participates in the Bank ACH verification system and is reporting this account as open and in good standing.
Format
<description>
AUTH NUM|ADDITIONAL INFO
</description>
Example
<description>
AUTH NUM 53793041|Non-Participating: No Info
</description>
Debug and Test Card Information
We also have some updated debug methods, which will be in the next version of the documentation. With this, while in debug mode (x_debug=1), you can trigger the gateway to give you an approve, decline or error response based on the reset of the information sent over.

Card #s that will return an approval "G"
370000000000002
6011000000000012
4007000000027
5424000000000015
Card #s that will return a decline "D"
4222222222222
All other Card#s return an error "E"

Loopback Testing Procedures
gotoBilling now provides a built in (offline) processor module called 'Loopback' that can be used for black-box testing.

Overview: The 'Loopback' processor module was designed and implemented to replicate the base functionality of a 'Live' Processor for testing, training and development environments. Currently the Loopback module supports the following transaction types:

Credit Cards
Debit Cards
Note: The 'Loopback' module was designed for black_box testing against defined transaction amounts (i.e by supplying a certain amount you will force a defined response back from the server). Any amount other than the ones listed below should return a valid Authorization(AUTH). For this module to work you must set debug=0 and be using a valid development account issued by gotoBilling. To test integration with live merchant accounts please use the debug instructions located in the HTTP Integration API Package.

Test Parameters
Valid AVS
Street: 14520 Main Street Zip: 32615

-or-

Street: 2831 NW 41st St STE J Zip: 32606

Valid CV: (This must be supplied or you will always receive a Decline response)
Visa/MC/DISC: 999 Amex: 1234

Old basic amount checks
$5.00	DENY
$5.10	CALL
$5.20	PKUP
$5.30	RETRY
$5.40	SETUP
New amount checks (phard_code)
$6.01	DENY	GENERICFAIL
$6.02	CALL	CALL
$6.03	RETRY	NOREPLY
$6.04	PKUP	PICKUP_NOFRAUD
$6.05	PKUP	PICKUP_FRAUD
$6.06	PKUP	PICKUP_LOST
$6.07	PKUP	PICKUP_STOLEN
$6.08	DENY	ACCTERROR
$6.09	DENY	ALREADY_REVERSED
$6.10	DENY	BAD_PIN
$6.11	DENY	CASHBACK_EXCEEDED
$6.12	DENY	CASHBACK_NOAVAIL
$6.13	DENY	CID_ERROR
$6.14	DENY	DATE_ERROR
$6.15	DENY	DONOTHONOR
$6.16	DENY	INSUFFICIENT_FUNDS
$6.17	DENY	EXCEED_WITHDRAWAL_LIMIT
$6.18	SETUP	INVALID_SERVICE_CODE
$6.19	DENY	EXCEED_ACTIVITY_LIMIT
$6.20	DENY	VIOLATION
$6.21	DENY	ENCRYPTION_ERROR
$6.22	DENY	CARD_EXPIRED
$6.23	DENY	RETRYREENTER
$6.24	DENY	SECURITY_VIOLATION
$6.25	SETUP	NOT_PERMITTED_CARD
$6.26	SETUP	NOT_PERMITTED_TRAN
$6.27	DENY	SYSTEM_ERROR
$6.28	SETUP	BAD_MERCH_ID
$6.29	DENY	DUPLICATE_BATCH
$6.30	DENY	REJECTED_BATCH
$6.31	DENY	ACCOUNT_CLOSED
New amount checks (msoft_code)
$6.50	DENY	CONN_TOREVERSAL
$6.51	DENY	CONN_MAXSENDS
$6.52	DENY	CONN_MAXATTEMPTS
$6.53	DENY	DB_FAIL
Visa Cardlevel Results
$7.00	VISA_TRADITIONAL
$7.01	VISA_TRADITIONAL_REWARDS
$7.02	VISA_SIGNATURE
$7.03	VISA_INFINITE
$7.04	RESERVED (E^)
$7.05	RESERVED (F^)
$7.06	VISA_BUSINESS
$7.07	VISA_CHECK
$7.08	VISA_COMMERCE
$7.09	RESERVED (J^)
$7.10	VISA_CORPORATE
$7.11	RESERVED (L^)
$7.12	MASTERCARD_EUROCARD_DINERS
$7.13	RESERVED (N^)
$7.14	RESERVED (O^)
$7.15	RESERVED (P^)
$7.16	PRIVATE_LABEL
$7.17	PROPRIETARY
$7.18	VISA_PURCHASE_CARD
$7.19	INTERLINK
$7.20	VISA_TRAVELMONEY
$7.21	RESERVED (V^)
$7.22	RESERVED (W^)
$7.23	RESERVED (X^)
$7.24	RESERVED (Y^)
$7.25	RESERVED (Z^)
$7.26	RESERVED (0^)
$7.27	RESERVED (1^)
$7.28	RESERVED (2^)
$7.29	RESERVED (3^)
$7.30	RESERVED (4^)
$7.31	RESERVED (5^)
$7.32	RESERVED (6^)
$7.33	RESERVED (7^)
$7.34	RESERVED (8^)
$7.35	RESERVED (9^)
$7.36	VISA_SIGNATURE_BUSINESS
$7.37	VISA_BUSINESS_CHECK
$7.38	VISA_GENERAL_PREPAID
$7.39	VISA_PREPAID_GIFT
$7.40	VISA_PREPAID_HEALTH
$7.41	VISA_PREPAID_COMMERCIAL
$7.42	VISA_GSA_CORPORATE_TANDE
$7.43	PRIVATE_LABEL_PREPAID
$7.44	VISA_PURCHASE_FLEET
$7.45	VISA_GSA_PURCHASE
$7.46	VISA_GSA_PURCHASE_FLEET
$7.47	RESERVED (V1)
$7.48	AMEX
$7.49	DISCOVER
If you have any questions regarding testing with the Loopback module, simply email support@gotobilling.com or visit the support desk at support.gotobilling.com

-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


# CENÁRIOS DE TESTE INTERFACE-  UOWN OMNIFUND

---

### 1. Pagamento com Valor Normal (Aprovado)

```gherkin
Cenário: Realizar pagamento com valor normal e cartão configurado
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 50.00 |
  E clica em "Processar Pagamento"
  Então a transação é aprovada com sucesso
  E a mensagem exibe "Approved" ou "Success"
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```

### 2. Pagamento com Valor $5.00 (Recusado - Loopback)

```gherkin
Cenário: Simular recusa genérica via valor de teste Loopback
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 5.00 |
  E clica em "Processar Pagamento"
  Então a transação é recusada
  E a mensagem exibe "Declined" ou "Error"
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

### 3. Pagamento com Valor $6.22 (Cartão Expirado - Loopback)

```gherkin
Cenário: Simular cartão expirado via valor de teste Loopback
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 6.22 |
  E clica em "Processar Pagamento"
  Então a transação é recusada com código CARD_EXPIRED
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | CARD_EXPIRED |
```

### 4. Pagamento com Valor $6.16 (Saldo Insuficiente - Loopback)

```gherkin
Cenário: Simular saldo insuficiente via valor de teste Loopback
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 6.16 |
  E clica em "Processar Pagamento"
  Então a transação é recusada com código INSUFFICIENT_FUNDS
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | INSUFFICIENT_FUNDS |
```

### 5. Pagamento com Valor $6.50 (Timeout/Reversão - Loopback)

```gherkin
Cenário: Simular timeout e reversão obrigatória via valor de teste Loopback
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 6.50 |
  E clica em "Processar Pagamento"
  Então a transação é recusada com código TOReversal Required
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | TOReversal Required |
```

### 6. Pagamento com Valor $6.27 (Erro de Sistema - Loopback)

```gherkin
Cenário: Simular erro de sistema via valor de teste Loopback
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 6.27 |
  E clica em "Processar Pagamento"
  Então a transação é recusada com código SYSTEM_ERROR
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

### 7. Pagamento com Valor $6.31 (Conta Fechada - Loopback)

```gherkin
Cenário: Simular conta fechada via valor de teste Loopback
  Dado que o usuário acessa a conta 11119 em QA2
  Quando preenche os dados do pagamento:
    | Campo | Valor |
    | Cartão | 6011000993026909 |
    | Expiração | 12/28 |
    | CVV | 996 |
    | Valor | 6.31 |
  E clica em "Processar Pagamento"
  Então a transação é recusada com código ACCOUNT_CLOSED
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

---




# 🔌 TESTES VIA API (UOWN)

---

## 📋 CENÁRIOS DE TESTE VIA API

### 1. Pagamento Aprovado

```gherkin
Cenário: Realizar pagamento com valor normal
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 50.00
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | ACCEPT |
    | ccVendor |  OMNIFUND |
    | status | APPROVED |
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```

### 2. Recusa Genérica (Loopback)

```gherkin
Cenário: Simular recusa genérica via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 5.00
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | status | DENIED |
```

### 3. Cartão Expirado (Loopback)

```gherkin
Cenário: Simular cartão expirado via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.22
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | CARD_EXPIRED |
```

### 4. Saldo Insuficiente (Loopback)

```gherkin
Cenário: Simular saldo insuficiente via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.16
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | INSUFFICIENT_FUNDS |
```

### 5. Timeout/Reversão (Loopback)

```gherkin
Cenário: Simular timeout e reversão obrigatória via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.50
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | TOReversal Required |
    | reasonCode | 203 |
```

### 6. Erro de Sistema (Loopback)

```gherkin
Cenário: Simular erro de sistema via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.27
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | SYSTEM_ERROR |
```

### 7. Conta Fechada (Loopback)

```gherkin
Cenário: Simular conta fechada via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.31
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | ACCOUNT_CLOSED |
```

---



#  TESTES DIRETOS OMNIFUND


---

## 📋 SCENARIO 1: AUTH-CAPTURE (Authorize and Capture in One Request)

```gherkin
Scenario: Perform AUTH-CAPTURE transaction successfully
  Given a POST request to /os/system/gateway/transact.php
  With parameters:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_first_name | Test |
    | x_last_name | User |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-001 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | term_code | 0 |
    | auth_code | Present |
    | ticket_id | Present |
    | order_number | Present |
    | description | APPROVED |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_first_name=Test" \
  -d "x_last_name=User" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-001" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## ⚠️ NOTE: PRE-AUTH (AS) and CAPTURE (DS) NOT SUPPORTED IN DEBUG MODE

**These scenarios do NOT work in OMNIFUND Debug Mode:**
- ❌ SCENARIO 2 (PRE-AUTH - AS) - Returns "Invalid Debug Card Number"
- ❌ SCENARIO 3 (CAPTURE - DS) - Returns "Invalid Debug Card Number"

**Use AUTH-CAPTURE (ES) instead for all transactions.**

---

## 📋 SCENARIO 2: REFUND (Refund)

### Gherkin Specification

```gherkin
Scenario: Refund a captured transaction
  Given that a transaction was captured with ticket_id = "696994"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | CR |
    | x_ticket_id | 696994 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=CR" \
  -d "x_ticket_id=696994"
```

---

## 📋 SCENARIO 3: VOID (Cancel Transaction)

### Gherkin Specification

```gherkin
Scenario: Cancel an authorized transaction
  Given that a transaction was authorized with ticket_id = "696994"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | VO |
    | x_ticket_id | 696994 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=VO" \
  -d "x_ticket_id=696994"
```

---

## 📋 SCENARIO 4: Card Tokenization (TK)

### Gherkin Specification

```gherkin
Scenario: Tokenize a card for future use
  Given a POST request to /os/system/gateway/transact.php
  With parameters:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_transaction_type | TK |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | payment_token_id | Present |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_transaction_type=TK" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 5: Transaction with Token (Saved Card)

### Gherkin Specification

```gherkin
Scenario: Process payment using saved card token
  Given that a card was tokenized with payment_token_id = "tok_578577597069320c2b7ee17755010712"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-003 |
    | x_payment_token_id | tok_578577597069320c2b7ee17755010712 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
  And no card data is required in the request
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-003" \
  -d "x_payment_token_id=tok_578577597069320c2b7ee17755010712"
```

---

## 📋 SCENARIO 6: Discover Card (Approved)

### Gherkin Specification

```gherkin
Scenario: Test transaction with valid Discover card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | Discover Card |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-008" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 7: Visa Card (Approved)

### Gherkin Specification

```gherkin
Scenario: Test transaction with valid Visa card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 4007000000027 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | Visa |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-009" \
  -d "x_cc_number=4007000000027" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 8: MasterCard (Approved)

### Gherkin Specification

```gherkin
Scenario: Test transaction with valid MasterCard
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 5424000000000015 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | MasterCard |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-010" \
  -d "x_cc_number=5424000000000015" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 9: American Express (Approved)

### Gherkin Specification

```gherkin
Scenario: Test transaction with valid American Express card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 370000000000002 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 1234 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | American Express |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-011" \
  -d "x_cc_number=370000000000002" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=1234" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 10: Declined Card (Decline)

### Gherkin Specification

```gherkin
Scenario: Test transaction with card that returns decline
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 4222222222222 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | D |
    | description | DECLINE |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-012" \
  -d "x_cc_number=4222222222222" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 11: Missing Required Field (x_customer_id)

### Gherkin Specification

```gherkin
Scenario: Validate error when x_customer_id is missing
  Given a POST request without the x_customer_id parameter
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | No customer specified |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-013" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 12: Missing Required Field (x_amount)

### Gherkin Specification

```gherkin
Scenario: Validate error when x_amount is missing
  Given a POST request without the x_amount parameter
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | Amount must be greater than Zero |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-014" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 13: Missing Required Field (x_cc_number)

### Gherkin Specification

```gherkin
Scenario: Validate error when x_cc_number is missing (without token)
  Given a POST request without x_cc_number and without x_payment_token_id
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | The card number provided is invalid |
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-015" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 14: Invalid Expiration Format

### Gherkin Specification

```gherkin
Scenario: Validate correct expiration format (MMYY)
  Given a POST request with:
    | Parameter | Value |
    | x_cc_exp | 1228 |
  When the request is sent
  Then the transaction is processed correctly
  
  And when sent with invalid format:
    | Parameter | Value |
    | x_cc_exp | 12-28 |
  Then the response contains an error
```

### cURL for Execution (Correct Format)

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-016" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

### cURL for Execution (Invalid Format)

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-016-INVALID" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=12-28" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 15: JSON Response Format (x_version 1.2)

### Gherkin Specification

```gherkin
Scenario: Get response in JSON format
  Given a POST request with:
    | Parameter | Value |
    | x_version | 1.2 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response is returned in JSON format
  And contains the same fields as XML
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.2" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-017" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---

## 📋 SCENARIO 16: XML Response Format (x_version 1.1)

### Gherkin Specification

```gherkin
Scenario: Get response in XML format (default)
  Given a POST request with:
    | Parameter | Value |
    | x_version | 1.1 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response is returned in XML format
  And contains <ResponseData> tags
```

### cURL for Execution

```bash
curl -X POST "https://secure.gotobilling.com/os/system/gateway/transact.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "access_key=D33188CE2C874DBB8245" \
  -d "access_key_secret=490B9B4EEA1E4290BA824310DC3F856B" \
  -d "x_debug=1" \
  -d "x_version=1.1" \
  -d "x_customer_id=11119" \
  -d "x_amount=50.00" \
  -d "x_transaction_type=ES" \
  -d "x_invoice_id=INV-11119-018" \
  -d "x_cc_number=6011000000000012" \
  -d "x_cc_exp=1228" \
  -d "x_cc_cvv=999" \
  -d "x_cc_name=Test User"
```

---




----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------





# TESTES VIA INTERFACE-  UOWN OMNIFUND

### 1. Pagamento com Valor Normal (Aprovado)

```gherkin
Cenário: Realizar pagamento com valor normal e cartão configurado
  Dado que o usuário efetua pagamento
    | Valor | 50.00 |
  Então a transação é aprovada com sucesso
  E a mensagem exibe "Approved" ou "Success"
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```

### 2. Pagamento com Valor $5.00 (Recusado - Loopback)

```gherkin
Cenário: Simular recusa genérica via valor de teste Loopback
  Dado que o usuário efetua pagamento
    | Valor | 5.00 |
  Então a transação é recusada
  E a mensagem exibe "Declined" ou "Error"
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

### 3. Pagamento com Valor $6.22 (Cartão Expirado - Loopback)

```gherkin
Cenário: Simular cartão expirado via valor de teste Loopback
  Dado que o usuário efetua pagamento
    | Valor | 6.22 |
  Então a transação é recusada com código CARD_EXPIRED
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | CARD_EXPIRED |
```

### 4. Pagamento com Valor $6.16 (Saldo Insuficiente - Loopback)

```gherkin
Cenário: Simular saldo insuficiente via valor de teste Loopback
  Dado que o usuário efetua pagamento
    | Valor | 6.16 |
  Então a transação é recusada com código INSUFFICIENT_FUNDS
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | INSUFFICIENT_FUNDS |
```

### 5. Pagamento com Valor $6.50 (Timeout/Reversão - Loopback)

```gherkin
Cenário: Simular timeout e reversão obrigatória via valor de teste Loopback
  Dado que o usuário efetua pagamento
    | Valor | 6.50 |
  Então a transação é recusada com código TOReversal Required
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | TOReversal Required |
```

### 6. Pagamento com Valor $6.27 (Erro de Sistema - Loopback)

```gherkin
Cenário: Simular erro de sistema via valor de teste Loopback
  Dado que o usuário efetua pagamento
    | Valor | 6.27 |
  Então a transação é recusada com código SYSTEM_ERROR
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

### 7. Pagamento com Valor $6.31 (Conta Fechada - Loopback)

```gherkin
Cenário: Simular conta fechada via valor de teste Loopback
  Dado que o usuário efetua pagamento
    | Valor | 6.31 |
  Então a transação é recusada com código ACCOUNT_CLOSED
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

---


# TESTES VIA API (UOWN)

### 1. Pagamento Aprovado

```gherkin
Cenário: Realizar pagamento com valor normal
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 50.00
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | ACCEPT |
    | ccVendor |  OMNIFUND |
    | status | APPROVED |
  E o banco de dados registra:
    | Campo | Valor |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```

### 2. Recusa Genérica (Loopback)

```gherkin
Cenário: Simular recusa genérica via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 5.00
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | status | DENIED |
```

### 3. Cartão Expirado (Loopback)

```gherkin
Cenário: Simular cartão expirado via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.22
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | CARD_EXPIRED |
```

### 4. Saldo Insuficiente (Loopback)

```gherkin
Cenário: Simular saldo insuficiente via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.16
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | INSUFFICIENT_FUNDS |
```

### 5. Timeout/Reversão (Loopback)

```gherkin
Cenário: Simular timeout e reversão obrigatória via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.50
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | TOReversal Required |
    | reasonCode | 203 |
```

### 6. Erro de Sistema (Loopback)

```gherkin
Cenário: Simular erro de sistema via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.27
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | SYSTEM_ERROR |
```

### 7. Conta Fechada (Loopback)

```gherkin
Cenário: Simular conta fechada via Loopback
  Dado uma requisição POST para /uown/svc/makeCreditCardPayment
  Com valor: 6.31
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | decision | REJECT |
    | ccVendor | (em branco - esperado: OMNIFUND) |
    | error_message | ACCOUNT_CLOSED |
```

---



#  TESTES DIRETOS OMNIFUND

## 📋 CENÁRIO 1: AUTH-CAPTURE (Autorizar e Capturar em Uma Requisição)

```gherkin
Cenário: Realizar transação AUTH-CAPTURE com sucesso
  Dado uma requisição POST para /os/system/gateway/transact.php
  Com os parâmetros:
    | Parâmetro | Valor |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_first_name | Test |
    | x_last_name | User |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-001 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | term_code | 0 |
    | auth_code | Presente |
    | ticket_id | Presente |
    | order_number | Presente |
    | description | APPROVED |
```

---

## 📋 CENÁRIO 2: PRE-AUTH (Autorização Apenas)

```gherkin
Cenário: Realizar transação PRE-AUTH (Authorize Only)
  Dado uma requisição POST para /os/system/gateway/transact.php
  Com os parâmetros:
    | Parâmetro | Valor |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | AS |
    | x_invoice_id | INV-11119-002 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | ticket_id | Presente (necessário para captura) |
    | payment_token_id | Presente |
```

---

## 📋 CENÁRIO 3: CAPTURE (Capturar Pré-Autorização)

```gherkin
Cenário: Capturar uma transação pré-autorizada
  Dado que uma transação PRE-AUTH foi realizada com ticket_id = "696994"
  Quando uma requisição POST é enviada com:
    | Parâmetro | Valor |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | DS |
    | x_ticket_id | 696994 |
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | phard_code | SUCCESS |
    | order_number | Presente |
```

---

## 📋 CENÁRIO 4: REFUND (Reembolso)

```gherkin
Cenário: Reembolsar uma transação capturada
  Dado que uma transação foi capturada com ticket_id = "696994"
  Quando uma requisição POST é enviada com:
    | Parâmetro | Valor |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | CR |
    | x_ticket_id | 696994 |
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | order_number | Presente |
```

---

## 📋 CENÁRIO 5: Tokenização de Cartão (TK)

```gherkin
Cenário: Tokenizar um cartão para uso futuro
  Dado uma requisição POST para /os/system/gateway/transact.php
  Com os parâmetros:
    | Parâmetro | Valor |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_transaction_type | TK |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | payment_token_id | Presente |
```

---

## 📋 CENÁRIO 6: Transação com Token (Cartão Salvo)

```gherkin
Cenário: Processar pagamento usando token de cartão salvo
  Dado que um cartão foi tokenizado com payment_token_id = "tok_578577597069320c2b7ee17755010712"
  Quando uma requisição POST é enviada com:
    | Parâmetro | Valor |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-003 |
    | x_payment_token_id | tok_578577597069320c2b7ee17755010712 |
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | order_number | Presente |
  E nenhum dado de cartão é necessário na requisição
```

---

## 📋 CENÁRIO 7: Cartão Discover (Aprovado)

```gherkin
Cenário: Testar transação com cartão Discover válido
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_debug | 1 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | card/network | Discover Card |
```

---

## 📋 CENÁRIO 8: Cartão Visa (Aprovado)

```gherkin
Cenário: Testar transação com cartão Visa válido
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_debug | 1 |
    | x_cc_number | 4007000000027 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | card/network | Visa |
```

---

## 📋 CENÁRIO 9: Cartão MasterCard (Aprovado)

```gherkin
Cenário: Testar transação com cartão MasterCard válido
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_debug | 1 |
    | x_cc_number | 5424000000000015 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | card/network | MasterCard |
```

---

## 📋 CENÁRIO 10: Cartão Amex (Aprovado)

```gherkin
Cenário: Testar transação com cartão American Express válido
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_debug | 1 |
    | x_cc_number | 370000000000002 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 1234 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | G |
    | card/network | American Express |
```

---

## 📋 CENÁRIO 11: Cartão Recusado (Decline)

```gherkin
Cenário: Testar transação com cartão que retorna recusa
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_debug | 1 |
    | x_cc_number | 4222222222222 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | status | D |
    | description | DECLINE |
```

---

## 📋 CENÁRIO 12: Campo Obrigatório Faltando (x_customer_id)

```gherkin
Cenário: Validar erro quando x_customer_id está faltando
  Dado uma requisição POST sem o parâmetro x_customer_id
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | term_code | 20979 |
    | description | No customer specified |
```

---

## 📋 CENÁRIO 13: Campo Obrigatório Faltando (x_amount)

```gherkin
Cenário: Validar erro quando x_amount está faltando
  Dado uma requisição POST sem o parâmetro x_amount
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | term_code | 20979 |
    | description | Amount must be greater than Zero |
```

---

## 📋 CENÁRIO 14: Campo Obrigatório Faltando (x_cc_number)

```gherkin
Cenário: Validar erro quando x_cc_number está faltando (sem token)
  Dado uma requisição POST sem x_cc_number e sem x_payment_token_id
  Quando a requisição é enviada
  Então a resposta contém:
    | Campo | Valor |
    | term_code | 20979 |
    | description | The card number provided is invalid |
```

---

## 📋 CENÁRIO 15: Formato Inválido de Expiração

```gherkin
Cenário: Validar formato correto de expiração (MMYY)
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_cc_exp | 1228 |
  Quando a requisição é enviada
  Então a transação é processada corretamente
  
  E quando enviada com formato inválido:
    | Parâmetro | Valor |
    | x_cc_exp | 12-28 |
  Então a resposta contém erro
```

---

## 📋 CENÁRIO 16: Resposta em JSON (x_version 1.2)

```gherkin
Cenário: Obter resposta em formato JSON
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_version | 1.2 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta é retornada em formato JSON
  E contém os mesmos campos que XML
```

---

## 📋 CENÁRIO 17: Resposta em XML (x_version 1.1)

```gherkin
Cenário: Obter resposta em formato XML (padrão)
  Dado uma requisição POST com:
    | Parâmetro | Valor |
    | x_version | 1.1 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  Quando a requisição é enviada
  Então a resposta é retornada em formato XML
  E contém tags <ResponseData>
```
---



----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------





## UI/INTERFACE TESTS - UOWN OMNIFUND

### 1. Payment with Normal Amount (Approved)

```gherkin
Scenario: Process payment with normal amount and configured card
  Given that the user processes a payment
    | Amount | 50.00 |
  Then the transaction is approved successfully
  And the message displays "Approved" or "Success"
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```

---

### 2. Payment with $5.00 Amount (Declined - Loopback)

```gherkin
Scenario: Simulate generic decline via Loopback test amount
  Given that the user processes a payment
    | Amount | 5.00 |
  Then the transaction is declined
  And the message displays "Declined" or "Error"
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

---

### 3. Payment with $6.22 Amount (Card Expired - Loopback)

```gherkin
Scenario: Simulate expired card via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.22 |
  Then the transaction is declined with code CARD_EXPIRED
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | CARD_EXPIRED |
```

---

### 4. Payment with $6.16 Amount (Insufficient Funds - Loopback)

```gherkin
Scenario: Simulate insufficient funds via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.16 |
  Then the transaction is declined with code INSUFFICIENT_FUNDS
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | INSUFFICIENT_FUNDS |
```

---

### 5. Payment with $6.50 Amount (Timeout/Reversal - Loopback)

```gherkin
Scenario: Simulate timeout and mandatory reversal via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.50 |
  Then the transaction is declined with code TOReversal Required
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | TOReversal Required |
```

---

### 6. Payment with $6.27 Amount (System Error - Loopback)

```gherkin
Scenario: Simulate system error via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.27 |
  Then the transaction is declined with code SYSTEM_ERROR
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

---

### 7. Payment with $6.31 Amount (Account Closed - Loopback)

```gherkin
Scenario: Simulate closed account via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.31 |
  Then the transaction is declined with code ACCOUNT_CLOSED
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

---

## API WRAPPER TESTS (UOWN)

### 1. Approved Payment

```gherkin
Scenario: Process payment with normal amount
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 50.00
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | ACCEPT |
    | ccVendor | OMNIFUND |
    | status | APPROVED |
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```

---

### 2. Generic Decline (Loopback)

```gherkin
Scenario: Simulate generic decline via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 5.00
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | status | DENIED |
```

---

### 3. Card Expired (Loopback)

```gherkin
Scenario: Simulate expired card via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.22
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | CARD_EXPIRED |
```

---

### 4. Insufficient Funds (Loopback)

```gherkin
Scenario: Simulate insufficient funds via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.16
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | INSUFFICIENT_FUNDS |
```

---

### 5. Timeout/Reversal (Loopback)

```gherkin
Scenario: Simulate timeout and mandatory reversal via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.50
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | TOReversal Required |
    | reasonCode | 203 |
```

---

### 6. System Error (Loopback)

```gherkin
Scenario: Simulate system error via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.27
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | SYSTEM_ERROR |
```

---

### 7. Account Closed (Loopback)

```gherkin
Scenario: Simulate closed account via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.31
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | ACCOUNT_CLOSED |
```

---

## DIRECT OMNIFUND API TESTS

---

## 📋 SCENARIO 1: AUTH-CAPTURE (Authorize and Capture in One Request)

```gherkin
Scenario: Perform AUTH-CAPTURE transaction successfully
  Given a POST request to /os/system/gateway/transact.php
  With parameters:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_first_name | Test |
    | x_last_name | User |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-001 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | term_code | 0 |
    | auth_code | Present |
    | ticket_id | Present |
    | order_number | Present |
    | description | APPROVED |
```


---

## 📋 SCENARIO 2: REFUND (Refund)

```gherkin
Scenario: Refund a captured transaction
  Given that a transaction was captured with ticket_id = "696994"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | CR |
    | x_ticket_id | 696994 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
```


---

## 📋 SCENARIO 3: VOID (Cancel Transaction)

```gherkin
Scenario: Cancel an authorized transaction
  Given that a transaction was authorized with ticket_id = "696994"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | VO |
    | x_ticket_id | 696994 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
```


---

## 📋 SCENARIO 4: Card Tokenization (TK)

```gherkin
Scenario: Tokenize a card for future use
  Given a POST request to /os/system/gateway/transact.php
  With parameters:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_transaction_type | TK |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | payment_token_id | Present |
```

---

## 📋 SCENARIO 5: Transaction with Token (Saved Card)

```gherkin
Scenario: Process payment using saved card token
  Given that a card was tokenized with payment_token_id = "tok_578577597069320c2b7ee17755010712"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-003 |
    | x_payment_token_id | tok_578577597069320c2b7ee17755010712 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
  And no card data is required in the request
```

---

## 📋 SCENARIO 6: Discover Card (Approved)

```gherkin
Scenario: Test transaction with valid Discover card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | Discover Card |
```


---

## 📋 SCENARIO 7: Visa Card (Approved)

```gherkin
Scenario: Test transaction with valid Visa card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 4007000000027 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | Visa |
```

---

## 📋 SCENARIO 8: MasterCard (Approved)

```gherkin
Scenario: Test transaction with valid MasterCard
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 5424000000000015 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | MasterCard |
```


---

## 📋 SCENARIO 9: American Express (Approved)

```gherkin
Scenario: Test transaction with valid American Express card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 370000000000002 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 1234 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | American Express |
```


---

## 📋 SCENARIO 10: Declined Card (Decline)

```gherkin
Scenario: Test transaction with card that returns decline
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 4222222222222 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | D |
    | description | DECLINE |
```


---

## 📋 SCENARIO 11: Missing Required Field (x_customer_id)

```gherkin
Scenario: Validate error when x_customer_id is missing
  Given a POST request without the x_customer_id parameter
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | No customer specified |
```


---

## 📋 SCENARIO 12: Missing Required Field (x_amount)

```gherkin
Scenario: Validate error when x_amount is missing
  Given a POST request without the x_amount parameter
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | Amount must be greater than Zero |
```


---

## 📋 SCENARIO 13: Missing Required Field (x_cc_number)

```gherkin
Scenario: Validate error when x_cc_number is missing (without token)
  Given a POST request without x_cc_number and without x_payment_token_id
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | The card number provided is invalid |
```


---

## 📋 SCENARIO 14: Invalid Expiration Format

```gherkin
Scenario: Validate correct expiration format (MMYY)
  Given a POST request with:
    | Parameter | Value |
    | x_cc_exp | 1228 |
  When the request is sent
  Then the transaction is processed correctly
  
  And when sent with invalid format:
    | Parameter | Value |
    | x_cc_exp | 12-28 |
  Then the response contains an error
```


---

## 📋 SCENARIO 15: JSON Response Format (x_version 1.2)

```gherkin
Scenario: Get response in JSON format
  Given a POST request with:
    | Parameter | Value |
    | x_version | 1.2 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response is returned in JSON format
  And contains the same fields as XML
```


---

## 📋 SCENARIO 16: XML Response Format (x_version 1.1)

```gherkin
Scenario: Get response in XML format (default)
  Given a POST request with:
    | Parameter | Value |
    | x_version | 1.1 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response is returned in XML format
  And contains <ResponseData> tags
```


---



https://gitlab.com/uown/devops/configuration/-/blob/uown-dev3/config/svc/application.yaml

https://gitlab.com/uown/devops/configuration/-/blob/uown-qa1/config/svc/application.yaml



---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------QA2

> ## Tests in qa2


## UI/INTERFACE TESTS - UOWN OMNIFUND

### 1. Payment with Normal Amount (Approved)

```gherkin
Scenario: Process payment with normal amount and configured card
  Given that the user processes a payment
    | Amount | 50.00 |
  Then the transaction is approved successfully
  And the message displays "Approved" or "Success"
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```
![4-AprovadoSucesso-Screenshot_at_Dec_04_15-45-06](/uploads/43b71af6364ba8b3a19ab41bf3b3541b/4-AprovadoSucesso-Screenshot_at_Dec_04_15-45-06.png){width=900 height=457}
![4-AprovadoSucesso-Screenshot_at_Dec_04_15-50-38](/uploads/a6157d8c8390453db020e4d466d4b418/4-AprovadoSucesso-Screenshot_at_Dec_04_15-50-38.png){width=900 height=169}
![4-AprovadoSucesso-Screenshot_at_Dec_04_15-50-50](/uploads/02194d62dbf09a5becf313b308094621/4-AprovadoSucesso-Screenshot_at_Dec_04_15-50-50.png){width=900 height=172}
![4-AprovadoSucesso-Screenshot_at_Dec_04_16-02-58](/uploads/a329667b670d452fe0f08aa06f564e13/4-AprovadoSucesso-Screenshot_at_Dec_04_16-02-58.png){width=900 height=33}
![4-AprovadoSucesso-Screenshot_at_Dec_04_16-44-59](/uploads/b09ebb1f7acc9af9f0bc783aef8808c3/4-AprovadoSucesso-Screenshot_at_Dec_04_16-44-59.png){width=518 height=600}

---

### 2. Payment with $5.00 Amount (Declined - Loopback)

```gherkin
Scenario: Simulate generic decline via Loopback test amount
  Given that the user processes a payment
    | Amount | 5.00 |
  Then the transaction is declined
  And the message displays "Declined" or "Error"
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```
![4-2-recusado5Reais-Screenshot_at_Dec_04_16-20-06](/uploads/759293f2577b73df87c888846ad1b0d1/4-2-recusado5Reais-Screenshot_at_Dec_04_16-20-06.png){width=841 height=600}
![4-2-recusado5Reais-Screenshot_at_Dec_04_16-20-58](/uploads/719201bdac83d084068740b344142dc2/4-2-recusado5Reais-Screenshot_at_Dec_04_16-20-58.png){width=900 height=173}
![4-2-recusado5Reais-Screenshot_at_Dec_04_16-21-15](/uploads/04687b56fc716de2197bc601b7ada2e4/4-2-recusado5Reais-Screenshot_at_Dec_04_16-21-15.png){width=900 height=170}
![4-2-recusado5Reais-Screenshot_at_Dec_04_16-21-36](/uploads/3b2f31faaa698f85fb83251e9e847462/4-2-recusado5Reais-Screenshot_at_Dec_04_16-21-36.png){width=900 height=174}
![4-2-recusado5Reais-Screenshot_at_Dec_04_16-23-02](/uploads/9d5a0dd090e4173ab38266d8d7885343/4-2-recusado5Reais-Screenshot_at_Dec_04_16-23-02.png){width=900 height=31}
![4-2-recusado5Reais-Screenshot_at_Dec_04_16-23-22](/uploads/75dd52810e485a8254a8a64a0730d861/4-2-recusado5Reais-Screenshot_at_Dec_04_16-23-22.png){width=521 height=600}

---

### 3. Payment with $6.22 Amount (Card Expired - Loopback)

```gherkin
Scenario: Simulate expired card via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.22 |
  Then the transaction is declined with code CARD_EXPIRED
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | CARD_EXPIRED |
```
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-26-20](/uploads/2d64536acb43853daa568ab4f250df0b/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-26-20.png){width=639 height=600}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-26-35](/uploads/f66091c5313a7a378dea000a84000ab4/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-26-35.png){width=900 height=460}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-27-24](/uploads/1fae8db66edd2f7e4c73d184ac1e9b53/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-27-24.png){width=900 height=367}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-27-58](/uploads/9e1626b13a9059cefbe66b0e6fe3f974/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-27-58.png){width=900 height=262}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-28-24](/uploads/353b276128f419a5546fdf9a727b837e/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-28-24.png){width=900 height=84}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-28-36](/uploads/2d6e4a757c673d8eda95bbdfb46b4891/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-28-36.png){width=900 height=83}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-28-59](/uploads/81388d085747e384bec4c2e90ce371f4/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-28-59.png){width=900 height=84}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-29-23](/uploads/e626e9139c4e03588e2c29fcbaeffdc4/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-29-23.png){width=900 height=29}
![4-3-CartaoExpirado-Screenshot_at_Dec_04_16-29-57](/uploads/4f3fa6b5644747951e9f3581a5c8f433/4-3-CartaoExpirado-Screenshot_at_Dec_04_16-29-57.png){width=523 height=600}

---

### 4. Payment with $6.16 Amount (Insufficient Funds - Loopback)

```gherkin
Scenario: Simulate insufficient funds via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.16 |
  Then the transaction is declined with code INSUFFICIENT_FUNDS
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | INSUFFICIENT_FUNDS |
```
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-31-44](/uploads/fde9df1e91bda2feb20cba617f498849/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-31-44.png){width=665 height=600}
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-32-37](/uploads/cc95b74e4ee37b0ed5c13294168ec099/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-32-37.png){width=900 height=360}
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-32-52](/uploads/d37a9f48d5de7abc0cf40e33a4f112d2/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-32-52.png){width=900 height=122}
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-33-08](/uploads/ab5a22f823ac0938f530fded85376ba6/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-33-08.png){width=900 height=53}
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-34-24](/uploads/2fdbad9ee4e547b9b8d5815c537a9dc8/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-34-24.png){width=900 height=173}
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-34-37](/uploads/89562faf6d551a2dd908ab6843dddd7f/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-34-37.png){width=900 height=53}
![4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-47-51](/uploads/5bddc5b782779e39758f87fce2565ad5/4-4-SaldoInsuficiente-Screenshot_at_Dec_04_16-47-51.png){width=493 height=600}

---

### 5. Payment with $6.50 Amount (Timeout/Reversal - Loopback)

```gherkin
Scenario: Simulate timeout and mandatory reversal via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.50 |
  Then the transaction is declined with code TOReversal Required
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | TOReversal Required |
```
![4-5-TimeoutsEReversoesDeTransacao-Screenshot_at_Dec_04_15-28-58](/uploads/d86b191c961b904cce3bffc3e6751e4d/4-5-TimeoutsEReversoesDeTransacao-Screenshot_at_Dec_04_15-28-58.png){width=900 height=172}
![4-5-TimeoutsEReversoesDeTransacao-Screenshot_at_Dec_04_16-43-58](/uploads/8f25a1d48f8ae2dde788970a26874dcb/4-5-TimeoutsEReversoesDeTransacao-Screenshot_at_Dec_04_16-43-58.png){width=532 height=600}

---

### 6. Payment with $6.27 Amount (System Error - Loopback)

```gherkin
Scenario: Simulate system error via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.27 |
  Then the transaction is declined with code SYSTEM_ERROR
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```
![4-6-ErroDeSistema-](/uploads/135fa23e92e66eaf5455c6183c398156/4-6-ErroDeSistema-.png){width=708 height=600}
![4-6-ErroDeSistema-Screenshot_at_Dec_04_16-41-15](/uploads/4512caf7c15b7065913ddb0e6c8b8f98/4-6-ErroDeSistema-Screenshot_at_Dec_04_16-41-15.png){width=900 height=393}
![4-6-ErroDeSistema-Screenshot_at_Dec_04_16-41-30](/uploads/bc9edcac2a55aec19aaa0807ec987099/4-6-ErroDeSistema-Screenshot_at_Dec_04_16-41-30.png){width=900 height=84}
![4-6-ErroDeSistema-Screenshot_at_Dec_04_16-41-54](/uploads/6c83661be0f18109d49d18d9f6b30e8f/4-6-ErroDeSistema-Screenshot_at_Dec_04_16-41-54.png){width=900 height=53}
![4-6-ErroDeSistema-Screenshot_at_Dec_04_16-42-06](/uploads/baec2bf5ca7f2316a127dfb94b6eee7d/4-6-ErroDeSistema-Screenshot_at_Dec_04_16-42-06.png){width=900 height=51}
![4-6-ErroDeSistema-Screenshot_at_Dec_04_16-56-10](/uploads/ce38575815eb64f475056dd1f36869db/4-6-ErroDeSistema-Screenshot_at_Dec_04_16-56-10.png){width=900 height=35}
![4-6-ErroDeSistema-Screenshot_at_Dec_04_16-56-27](/uploads/0bbccaa4cbe9d2118a0c1bfc12c38cf7/4-6-ErroDeSistema-Screenshot_at_Dec_04_16-56-27.png){width=506 height=600}

---

### 7. Payment with $6.31 Amount (Account Closed - Loopback)

```gherkin
Scenario: Simulate closed account via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.31 |
  Then the transaction is declined with code ACCOUNT_CLOSED
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```
![4-7-ContaFechada-Screenshot_at_Dec_04_16-59-30](/uploads/9fdc67c193d4e5d1ae29143377575205/4-7-ContaFechada-Screenshot_at_Dec_04_16-59-30.png){width=900 height=80}
![4-7-ContaFechada-Screenshot_at_Dec_04_16-59-41](/uploads/3a569c6a2c8262addf77606e7785d3f1/4-7-ContaFechada-Screenshot_at_Dec_04_16-59-41.png){width=900 height=127}
![4-7-ContaFechada-Screenshot_at_Dec_04_16-59-54](/uploads/4c5ef412ee8a6e28f3bd79ff0078cd12/4-7-ContaFechada-Screenshot_at_Dec_04_16-59-54.png){width=900 height=34}
![4-7-ContaFechada-Screenshot_at_Dec_04_17-00-08](/uploads/592ce3f3ba4ddeb1ebd52a8ed8813ba8/4-7-ContaFechada-Screenshot_at_Dec_04_17-00-08.png){width=286 height=328}

---

## API WRAPPER TESTS (UOWN)

### 1. Approved Payment

```gherkin
Scenario: Process payment with normal amount
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 50.00
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | ACCEPT |
    | ccVendor | OMNIFUND |
    | status | APPROVED |
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```
![4-8-API-AprovadoSucesso-_1_-Screenshot_at_Dec_04_17-18-48](/uploads/14ff795da3a37600bb61f6921493abf8/4-8-API-AprovadoSucesso-_1_-Screenshot_at_Dec_04_17-18-48.png){width=819 height=600}
![4-8-API-AprovadoSucesso-_2_-Screenshot_at_Dec_04_17-18-49](/uploads/839e5c1e15066518f8d4192e8ef0c51b/4-8-API-AprovadoSucesso-_2_-Screenshot_at_Dec_04_17-18-49.png){width=763 height=433}
![4-8-API-AprovadoSucesso-_3_-Screenshot_at_Dec_04_17-19-15](/uploads/735ce7c8b39686755bd70ec254daa7c2/4-8-API-AprovadoSucesso-_3_-Screenshot_at_Dec_04_17-19-15.png){width=236 height=278}

---

### 2. Generic Decline (Loopback)

```gherkin
Scenario: Simulate generic decline via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 5.00
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | status | DENIED |
```
![4-9-API-RecusaGenerica-Screenshot_at_Dec_04_17-26-16](/uploads/2c3fb5cc75a3920ff8449346d1568f87/4-9-API-RecusaGenerica-Screenshot_at_Dec_04_17-26-16.png){width=900 height=524}
![4-9-API-RecusaGenerica-Screenshot_at_Dec_04_17-30-38](/uploads/6f083cd79e176d33e3a0bc8f60fc1cdd/4-9-API-RecusaGenerica-Screenshot_at_Dec_04_17-30-38.png){width=781 height=438}
![4-9-API-RecusaGenerica-Screenshot_at_Dec_04_17-30-56](/uploads/a4fa259611af2097f56ab129b3920abb/4-9-API-RecusaGenerica-Screenshot_at_Dec_04_17-30-56.png){width=232 height=273}

---

### 3. Card Expired (Loopback)

```gherkin
Scenario: Simulate expired card via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.22
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | CARD_EXPIRED |
```
![4-10-API-CartaoExpirado-Screenshot_at_Dec_04_18-32-49](/uploads/47523686a9479f9f9c03da4efe8c7586/4-10-API-CartaoExpirado-Screenshot_at_Dec_04_18-32-49.png){width=900 height=464}
![4-10-API-CartaoExpirado-Screenshot_at_Dec_04_18-33-18](/uploads/ce726a69b578e542a2c61cb390f1e50f/4-10-API-CartaoExpirado-Screenshot_at_Dec_04_18-33-18.png){width=237 height=278}

---

### 4. Insufficient Funds (Loopback)

```gherkin
Scenario: Simulate insufficient funds via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.16
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | INSUFFICIENT_FUNDS |
```
![4-11-API-InsuficientFunds-Screenshot_at_Dec_04_18-40-08](/uploads/14d117df188281756b5d1ef69eab5a91/4-11-API-InsuficientFunds-Screenshot_at_Dec_04_18-40-08.png){width=900 height=418}
![4-11-API-InsuficientFunds-Screenshot_at_Dec_04_18-40-24](/uploads/9cb86f8ca2ade2cdb62a793f0e02315b/4-11-API-InsuficientFunds-Screenshot_at_Dec_04_18-40-24.png){width=216 height=272}

---

### 5. Timeout/Reversal (Loopback)

```gherkin
Scenario: Simulate timeout and mandatory reversal via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.50
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | TOReversal Required |
    | reasonCode | 203 |
```
![4-12-API-TimeoutReversalRequired-Screenshot_at_Dec_04_19-20-17](/uploads/4668995750b057257a78a71bf340dc19/4-12-API-TimeoutReversalRequired-Screenshot_at_Dec_04_19-20-17.png){width=900 height=543}
![4-12-API-TimeoutReversalRequired-Screenshot_at_Dec_04_19-20-35](/uploads/6175c609ecf8843805283373b624397a/4-12-API-TimeoutReversalRequired-Screenshot_at_Dec_04_19-20-35.png){width=235 height=274}

---

### 6. System Error (Loopback)

```gherkin
Scenario: Simulate system error via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.27
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | SYSTEM_ERROR |
```
![image](/uploads/75ff7a3c356b6da06beb441fcb823bec/image.png){width=900 height=542}
![image](/uploads/cb3cf7e2db9cd6b6d70cc368a945ab83/image.png){width=236 height=273}

---

### 7. Account Closed (Loopback)

```gherkin
Scenario: Simulate closed account via Loopback
  Given a POST request to /uown/svc/makeCreditCardPayment
  With amount: 6.31
  When the request is sent
  Then the response contains:
    | Field | Value |
    | decision | REJECT |
    | ccVendor | (blank - expected: OMNIFUND) |
    | error_message | ACCOUNT_CLOSED |
```
![4-13-API-ContaClosed-Screenshot_at_Dec_04_19-21-54](/uploads/baa3846bb3e925d321280782f48fbddf/4-13-API-ContaClosed-Screenshot_at_Dec_04_19-21-54.png){width=900 height=549}
![4-13-API-ContaClosed-Screenshot_at_Dec_04_19-22-12](/uploads/fdca892bae17c2fc5a89fcd6a1ae36b7/4-13-API-ContaClosed-Screenshot_at_Dec_04_19-22-12.png){width=242 height=278}

---

## DIRECT OMNIFUND API TESTS

### SCENARIO 1: AUTH-CAPTURE (Authorize and Capture in One Request)

```gherkin
Scenario: Perform AUTH-CAPTURE transaction successfully
  Given a POST request to /os/system/gateway/transact.php
  With parameters:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_first_name | Test |
    | x_last_name | User |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-001 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | term_code | 0 |
    | auth_code | Present |
    | ticket_id | Present |
    | order_number | Present |
    | description | APPROVED |
```
![image](/uploads/e772ef4cd5f03f4f61a2c6d417b8842d/image.png){width=900 height=462}

---

### SCENARIO 2: Card Tokenization (TK)

```gherkin
Scenario: Tokenize a card for future use
  Given a POST request to /os/system/gateway/transact.php
  With parameters:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_transaction_type | TK |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_cc_name | Test User |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | payment_token_id | Present |
```

---

### SCENARIO 3: Transaction with Token (Saved Card)

```gherkin
Scenario: Process payment using saved card token
  Given that a card was tokenized with payment_token_id = "tok_578577597069320c2b7ee17755010712"
  When a POST request is sent with:
    | Parameter | Value |
    | access_key | D33188CE2C874DBB8245 |
    | access_key_secret | 490B9B4EEA1E4290BA824310DC3F856B |
    | x_debug | 1 |
    | x_version | 1.1 |
    | x_customer_id | 11119 |
    | x_amount | 50.00 |
    | x_transaction_type | ES |
    | x_invoice_id | INV-11119-003 |
    | x_payment_token_id | tok_578577597069320c2b7ee17755010712 |
  Then the response contains:
    | Field | Value |
    | status | G |
    | order_number | Present |
  And no card data is required in the request
```
![image](/uploads/24ed2c3f7c206ec6aaed2fd7cba7e33c/image.png){width=900 height=459}

---

### SCENARIO 4: Discover Card (Approved)

```gherkin
Scenario: Test transaction with valid Discover card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 6011000000000012 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | Discover Card |
```
![image](/uploads/d7696e9800693fa0dc44f609a454fb0b/image.png){width=900 height=462}

---

### SCENARIO 5: Visa Card (Approved)

```gherkin
Scenario: Test transaction with valid Visa card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 4007000000027 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | Visa |
```
![image](/uploads/1dd35d9a61f86c5b655f27a967cda978/image.png){width=495 height=336}

---

### SCENARIO 6: MasterCard (Approved)

```gherkin
Scenario: Test transaction with valid MasterCard
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 5424000000000015 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | MasterCard |
```
![image](/uploads/e847935f11420421a6a8f6cd467dfa6c/image.png){width=900 height=460}

---

### SCENARIO 7: American Express (Approved)

```gherkin
Scenario: Test transaction with valid American Express card
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 370000000000002 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 1234 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | G |
    | card/network | American Express |
```
![image](/uploads/bd8539c2cc72e7e302a16907f6a8d0f6/image.png){width=900 height=503}

---

### SCENARIO 8: Declined Card (Decline)

```gherkin
Scenario: Test transaction with card that returns decline
  Given a POST request with:
    | Parameter | Value |
    | x_debug | 1 |
    | x_cc_number | 4222222222222 |
    | x_cc_exp | 1228 |
    | x_cc_cvv | 999 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response contains:
    | Field | Value |
    | status | D |
    | description | DECLINE |
```
![image](/uploads/fdf8d90baa114039bf4997f93c8fa0ac/image.png){width=900 height=449}

---

### SCENARIO 9: Missing Required Field (x_customer_id)

```gherkin
Scenario: Validate error when x_customer_id is missing
  Given a POST request without the x_customer_id parameter
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | No customer specified |
```
![image](/uploads/6fce3abd6db602f46fcde35635250ef0/image.png){width=900 height=367}

---

### SCENARIO 10: Missing Required Field (x_amount)

```gherkin
Scenario: Validate error when x_amount is missing
  Given a POST request without the x_amount parameter
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | Amount must be greater than Zero |
```
![image](/uploads/dc0c41a933306727618081072a17fcbb/image.png){width=481 height=317}

---

### SCENARIO 11: Missing Required Field (x_cc_number)

```gherkin
Scenario: Validate error when x_cc_number is missing (without token)
  Given a POST request without x_cc_number and without x_payment_token_id
  When the request is sent
  Then the response contains:
    | Field | Value |
    | term_code | 20979 |
    | description | The card number provided is invalid |
```


---

### SCENARIO 12: Invalid Expiration Format

```gherkin
Scenario: Validate correct expiration format (MMYY)
  Given a POST request with:
    | Parameter | Value |
    | x_cc_exp | 1228 |
  When the request is sent
  Then the transaction is processed correctly
  
  And when sent with invalid format:
    | Parameter | Value |
    | x_cc_exp | 12-28 |
  Then the response contains an error
```


---

### SCENARIO 13: JSON Response Format (x_version 1.2)

```gherkin
Scenario: Get response in JSON format
  Given a POST request with:
    | Parameter | Value |
    | x_version | 1.2 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response is returned in JSON format
  And contains the same fields as XML
```
![image](/uploads/5dad71261508bf04e07c6131e0440b71/image.png){width=900 height=290}

---

### SCENARIO 14: XML Response Format (x_version 1.1)

```gherkin
Scenario: Get response in XML format (default)
  Given a POST request with:
    | Parameter | Value |
    | x_version | 1.1 |
    | x_cc_number | 6011000000000012 |
    | x_amount | 50.00 |
  When the request is sent
  Then the response is returned in XML format
  And contains <ResponseData> tags
```
![image](/uploads/5b8057e29a3b2568f9457ea89cab2af0/image.png){width=900 height=456}

---

### SCENARIO 15: Payment via customer Portal

![image](/uploads/d8c8db06d63ae9279dcf458e6eda0913/image.png){width=900 height=448}
![image](/uploads/a36dc76ed2cce053073da86489dc0669/image.png){width=562 height=600}
![image](/uploads/49377f9d94f86613ff48dd9bac7a79ed/image.png){width=467 height=548}

---

---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

> ## Tests in stg


## UI/INTERFACE TESTS - UOWN OMNIFUND

### 1. Payment with Normal Amount (Approved)

```gherkin
Scenario: Process payment with normal amount and configured card
  Given that the user processes a payment
    | Amount | 50.00 |
  Then the transaction is approved successfully
  And the message displays "Approved" or "Success"
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | APPROVED |
    | amount | 50.00 |
```
![Screenshot_at_Dec_16_13-13-18](/uploads/2e21f5d69eb034619fb19c33103f923a/Screenshot_at_Dec_16_13-13-18.png){width=900 height=462}
![Screenshot_at_Dec_16_13-13-55](/uploads/447a2b9373a79f975359c2965133fc8e/Screenshot_at_Dec_16_13-13-55.png){width=900 height=244}
![Screenshot_at_Dec_16_13-14-27](/uploads/4d3208c76feb26b9e53c58a82fbc1a4d/Screenshot_at_Dec_16_13-14-27.png){width=900 height=400}

---

### 2. Payment with $5.00 Amount (Declined - Loopback)

```gherkin
Scenario: Simulate generic decline via Loopback test amount
  Given that the user processes a payment
    | Amount | 5.00 |
  Then the transaction is declined
  And the message displays "Declined" or "Error"
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```
![Screenshot_at_Dec_16_13-17-28](/uploads/5795e40739aa251bf454eea2fb5be0de/Screenshot_at_Dec_16_13-17-28.png){width=900 height=182}
![Screenshot_at_Dec_16_13-18-23](/uploads/b4720fbc3a73502a7cd8a9f198883e43/Screenshot_at_Dec_16_13-18-23.png){width=900 height=169}
![Screenshot_at_Dec_16_13-20-55](/uploads/acc8b236f4adefc1a210881b472b2015/Screenshot_at_Dec_16_13-20-55.png){width=900 height=31}
![Screenshot_at_Dec_16_13-21-33](/uploads/27fc814c5aaf3589720c4a8c56025657/Screenshot_at_Dec_16_13-21-33.png){width=468 height=398}

---

### 3. Payment with $6.22 Amount (Card Expired - Loopback)

```gherkin
Scenario: Simulate expired card via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.22 |
  Then the transaction is declined with code CARD_EXPIRED
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | CARD_EXPIRED |
```
![Screenshot_at_Dec_16_13-24-03](/uploads/0f1f068be07af18db1ab7af90b43c7d1/Screenshot_at_Dec_16_13-24-03.png){width=900 height=408}
![Screenshot_at_Dec_16_13-24-17](/uploads/445ec5db863247a518ffceae1a92519e/Screenshot_at_Dec_16_13-24-17.png){width=900 height=82}
![Screenshot_at_Dec_16_13-25-45](/uploads/da74c2c06b1007e4e1930ea20ed5adee/Screenshot_at_Dec_16_13-25-45.png){width=484 height=401}

---

### 4. Payment with $6.16 Amount (Insufficient Funds - Loopback)

```gherkin
Scenario: Simulate insufficient funds via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.16 |
  Then the transaction is declined with code INSUFFICIENT_FUNDS
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | INSUFFICIENT_FUNDS |
```

![Screenshot_at_Dec_16_13-26-26](/uploads/3c2823bf173f742bded4c690d1a2fea4/Screenshot_at_Dec_16_13-26-26.png){width=900 height=87}
![Screenshot_at_Dec_16_13-26-35](/uploads/a74ff03011be52ab34f4ace01bbeb330/Screenshot_at_Dec_16_13-26-35.png){width=900 height=61}
![Screenshot_at_Dec_16_13-26-58](/uploads/29caddbbda7be78112ce25fba72f2a16/Screenshot_at_Dec_16_13-26-58.png){width=483 height=406}

---

### 5. Payment with $6.50 Amount (Timeout/Reversal - Loopback)

```gherkin
Scenario: Simulate timeout and mandatory reversal via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.50 |
  Then the transaction is declined with code TOReversal Required
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
    | error_message | TOReversal Required |
```

![Screenshot_at_Dec_16_13-27-27](/uploads/f511cc5c19042c13a2db753b142befed/Screenshot_at_Dec_16_13-27-27.png){width=900 height=52}
![Screenshot_at_Dec_16_13-27-39](/uploads/f9e8e4a3151a0e8abf690a9e8b8db142/Screenshot_at_Dec_16_13-27-39.png){width=900 height=48}
![Screenshot_at_Dec_16_13-27-59](/uploads/42bd9d9b325c44a8e485620427cc1b27/Screenshot_at_Dec_16_13-27-59.png){width=479 height=417}

---

### 6. Payment with $6.27 Amount (System Error - Loopback)

```gherkin
Scenario: Simulate system error via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.27 |
  Then the transaction is declined with code SYSTEM_ERROR
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

![Screenshot_at_Dec_16_13-31-54](/uploads/c0c4d705646132815a13784c176b54d7/Screenshot_at_Dec_16_13-31-54.png){width=900 height=51}
![Screenshot_at_Dec_16_13-32-06](/uploads/71fad750f971eb6e1618322f4ec8bc9e/Screenshot_at_Dec_16_13-32-06.png){width=900 height=48}
![Screenshot_at_Dec_16_13-32-47](/uploads/64d2a79195129c4394ff4bb9d0d6afc2/Screenshot_at_Dec_16_13-32-47.png){width=486 height=396}

---

### 7. Payment with $6.31 Amount (Account Closed - Loopback)

```gherkin
Scenario: Simulate closed account via Loopback test amount
  Given that the user processes a payment
    | Amount | 6.31 |
  Then the transaction is declined with code ACCOUNT_CLOSED
  And the database records:
    | Field | Value |
    | cc_vendor | OMNIFUND |
    | status | DENIED |
```

![Screenshot_at_Dec_16_13-33-31](/uploads/fc06ebc942c17e788b534e7593e88ac4/Screenshot_at_Dec_16_13-33-31.png){width=900 height=128}
![Screenshot_at_Dec_16_13-33-45](/uploads/29dc67c14de63b98647bbbbf0926b5c9/Screenshot_at_Dec_16_13-33-45.png){width=900 height=44}
![Screenshot_at_Dec_16_13-34-21](/uploads/6613a4f4a8d9a7d7d7de1b79a76e516e/Screenshot_at_Dec_16_13-34-21.png){width=478 height=402}

---

### SCENARIO 8: Payment via customer Portal

![Screenshot_at_Dec_16_13-39-27](/uploads/324e9ec4841b5d08b07625d0074363f0/Screenshot_at_Dec_16_13-39-27.png){width=900 height=444}
![image](/uploads/05048586e5479ec19e3c1db0050242fc/image.png){width=900 height=180}
![image](/uploads/3bf266f8c9729e13295067c46efc082d/image.png){width=900 height=49}

---


---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
STG

tem que alterar o cc token para source_12f6f1651e5a4e908f89c7348cf47363 e o cc vendor para OMNIFUND
 
e fazer um pagamento
 

 cc_token = source_12f6f1651e5a4e908f89c7348cf47363
 cc_vendor = OMNIFUND

---------------------------------------------------------------------------------------------------------------------------------------------------------

https://gitlab.com/uown/frontend/origination/-/issues/1191

UOWN | Origination | NEW APPLICATION Rebrand customer email/SMS sent in Kornerstone flow


Synopsis
Currently, after filling out the fields on the NEW Application page, the system sends an email and/or SMS to the Customer containing a link to continue the application.
When the application is part of the Kornerstone flow, this communication must receive rebranding, including Kornerstone logos and brand colors.

Business Objective
Ensure brand consistency and trustworthy communication with the Customer during the Kornerstone flow by applying Kornerstone’s visual identity to outgoing emails and SMS messages.

Feature Request | Business Requirements
    Apply rebranding only when the flow is identified as Kornerstone  
    Rebranding scope includes:
        Visual identity (logos and colors)
        Email layout
    Do not change functional content (links, text, or sending logic)        
    Maintain compatibility with both email and SMS

Expected Behavior
When the application belongs to the Kornerstone flow:
    Customer emails must include:
        Kornerstone logo(s)
        Kornerstone brand colors and visual identity
    The same branding concept should be applied to SMS content, when applicable
For non-Kornerstone flows, current behavior should remain unchanged

---------------------------------------------------------------------------------------------------------------------------------------------------------


**Título:**  
UOWN | Origination | NOVA APLICAÇÃO – Rebrand do e-mail/SMS enviados no fluxo Kornerstone

**Sinopse**  
Atualmente, após o preenchimento dos campos na página de Nova Aplicação, o sistema envia um e-mail e/ou SMS ao Cliente contendo um link para continuar a aplicação. Quando a aplicação faz parte do fluxo Kornerstone, essa comunicação deve receber o rebranding, incluindo logos e cores da marca Kornerstone.

**Objetivo de Negócio**  
Garantir consistência de marca e comunicação confiável com o Cliente durante o fluxo Kornerstone, aplicando a identidade visual da Kornerstone nos e-mails e SMS enviados.

**Requisito de Funcionalidade | Requisitos de Negócio**  
- Aplicar o rebranding somente quando o fluxo for identificado como Kornerstone.  
- Escopo do rebranding:  
  - Identidade visual (logos e cores)  
  - Layout do e-mail  
- Não alterar o conteúdo funcional (links, texto ou lógica de envio).  
- Manter compatibilidade tanto com e-mail quanto com SMS.

**Comportamento Esperado**  
Quando a aplicação pertencer ao fluxo Kornerstone:  
- E-mails ao cliente devem incluir:  
  - Logo(s) da Kornerstone  
  - Cores e identidade visual da Kornerstone  
- O mesmo conceito de branding deve ser aplicado ao conteúdo SMS, quando aplicável.  




Testing Steps:

# Test Instructions -- Uown / Kornerstone Integration

## 1. Objective

Ensure the correct functioning of the integration and modernization of
the application flow between **Uown Leasing** and the acquired fintech
(**Kornerstone**), ensuring:

-   **Backward compatibility** with legacy URLs\
-   Proper behavior of the **new URLs**\
-   Correct application of **visual themes by domain**\
-   Correct delivery of **email and SMS templates**, according to each
    flow

## 2. Scope

### Included

-   Application flow testing:
    -   `sendApplication`
    -   `finalizeApplication`
    -   `completeApplication`
-   Legacy and new URLs
-   **Uown** flow and **Kornerstone** flow
-   Domain-based theme (branding) validation
-   **Email** and **SMS** template validation

### Out of Scope

-   Performance testing
-   Load testing
-   External integrations not related to the application flow

## 3. Prerequisites

-   Available environment: DEV / QA / STAGING
-   Valid lead registered in the system
-   Lead containing:
    -   `uuid`
    -   `shortCode`
-   Rebranding feature flags enabled (if applicable)
-   Email and SMS delivery services active

## 4. URL Models

### 4.1 Legacy URLs (must continue to work)

-   `origination-{env}.uowleansing.com/sendApplication?uuid={uuid}&paymentFrequency={frequency}`
-   `origination-{env}.uowleansing.com/finalizeApplication?uuid={uuid}&paymentFrequency={frequency}`
-   `origination-{env}.uowleansing.com/completeApplication?uuid={uuid}&paymentFrequency={frequency}`

### 4.2 New URLs

#### Uown Flow

-   `apply-{env}.uowleansing.com/{shortCode}/send`
-   `secure-{env}.uowleansing.com/{shortCode}/finalize`
-   `secure-{env}.uowleansing.com/{shortCode}/complete`

#### Kornerstone Flow

-   `apply-{env}.kornerstonecredit.com/{shortCode}/send`
-   `secure-{env}.kornerstonecredit.com/{shortCode}/complete`

## 5. Themes and Branding

-   Screen themes **must be defined based on the access domain**
-   Validate:
    -   Logos
    -   Primary and secondary colors:
        -   green: `#8FC31F`
        -   purple: `#86217F`
        -   gray: `#d5d5d5`
    -   Visual identity (Uown vs Kornerstone)
-   Themes **must not leak** across different domains

## 6. Communication Templates -- Kornerstone

### 6.1 Email Templates

Templates: \* `ApprovalEmail` \* `SendApplicationEmail` \*
`DeclineEmail` \* `ActivationNotice` \* `Welcome` \*
`InitialPaymentReminder` \* `FinalizePurchaseEmail`

### 6.2 SMS Templates

-   `SendApplication`
-   `ApprovalMessage`
-   `FinalizePurchase`

## 7. Acceptance Criteria

-   All legacy URLs remain functional
-   New URLs work as expected
-   Correct themes are applied per domain
-   Leads receive **only** the templates corresponding to their flow

---------------------------------------------------------------------------------------------------------------------------------------------------------

Alteracoes dev:

components/merchant-setting-panels/merchant-settings.tsx




src/main/java/com/uownleasing/svc/pojo/rest/CanContinueRequest.java

package com.uownleasing.svc.pojo.rest;

import lombok.Data;

@Data
public class CanContinueRequest {
    private String uuid;
    private String shortCode;
}




src/main/java/com/uownleasing/svc/pojo/rest/CanContinueResponse.java
package com.uownleasing.svc.pojo.rest;

import lombok.Data;

@Data
public class CanContinueResponse {
    private long leadPk;
    private Boolean leadFound = false;
    private Boolean canContinueApplication = false;
    private Boolean canContinuePlaid = false;
    private Boolean verifyPhone = false;

    private String uuid;
    private String merchantLocationName;
    private String refMerchantCode;
    private String customerFirstName;
}





src/main/java/com/uownleasing/svc/rest/los/LosApplicationController.java
package com.uownleasing.svc.rest.los;

import com.uownleasing.common.enumeration.Frequency;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.pojo.CCInfo;
import com.uownleasing.common.pojo.CCTransactionInfo;
import com.uownleasing.los.common.db.entity.LosContract;
import com.uownleasing.los.common.db.entity.LosUWData;
import com.uownleasing.svc.db.entity.NeuroIdVerification;
import com.uownleasing.svc.exceptions.CustomExceptionHandler;
import com.uownleasing.svc.exceptions.InvalidFieldsException;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.pojo.plaid.GetPlaidTokenRequest;
import com.uownleasing.svc.pojo.plaid.PlaidLinkEvent;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.application.ContinueApplicationService;
import com.uownleasing.svc.service.application.SendApplicationService;
import com.uownleasing.svc.service.application.run.RunUwService;
import com.uownleasing.svc.service.application.run.RunUwStepsService;
import com.uownleasing.svc.service.application.sendApp.ApplicationProcessor;
import com.uownleasing.svc.service.plaid.PlaidService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import java.util.List;
import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping(value = "/uown/los", produces = MediaType.APPLICATION_JSON_VALUE)
public class LosApplicationController {

    private final AbbUwService abbuwService;

    private final ApplicationService applicationService;

    private final ContinueApplicationService continueApplicationService;

    private final PlaidService plaidService;

    private final FinalizeApplicationService finalizeApplicationService;

    private final WebhookService webhookService;

    private final CustomExceptionHandler customExceptionHandler;

    private final MerchantService merchantService;

    private final NeuroIdVerificationService neuroIdVerificationService;

    private final SendApplicationService sendApplicationService;

    private final AddLeaseService addLeaseService;

    private final RunUwService runUwService;

    private final RunUwStepsService runUwStepsService;

    private final RemainingApprovalAmountService remainingApprovalService;

    private final LeadPhoneValidationService leadPhoneValidationService;

    private final ApplicationProcessor applicationProcessor;

    @ExceptionHandler({InvalidFieldsException.class, SvcException.class})
    public ResponseEntity<Object> logExceptions(HttpServletRequest request, RuntimeException thrownException) {
        // Handles exceptions thrown while executing code in this controller and makes sure to log it properly
        return customExceptionHandler.logExceptions(request, thrownException);
    }

    @PostMapping(value = "/sendApplication", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ApplicationResponse sendApplication(@RequestBody @Valid ApplicationRequest  applicationRequest) {
        return sendApplicationService.createApplication(applicationRequest);
    }

    @PostMapping(value = "/applications", consumes = {MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ApplicationResponse createApplication(@RequestBody ApplicationRequest  applicationRequest) {
        return applicationProcessor.process(applicationRequest);
    }

    @PostMapping(value = "/sendInvoice", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public AuthorizationResponse sendInvoice(@RequestBody @Valid AuthorizationRequest  authRequest) {
        return applicationService.createInvoice(authRequest);
    }

    @GetMapping(value = "/verifyPhoneBeforeSigning/{leadPk}")
    public boolean verifyPhone(@PathVariable long leadPk, @RequestParam String phoneNumber) {
        return leadPhoneValidationService.matchesLeadPhoneNumber(leadPk, phoneNumber);
    }

    @Deprecated
    @GetMapping(value = "/getMissingRequiredFields/{uuid}", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public RequiredFields getMissingRequiredFieldsByUuid(@PathVariable String uuid, @RequestParam(required = false) Frequency selectedPaymentFrequency) {
        return applicationService.getMissingRequiredFields(uuid, null, selectedPaymentFrequency);
    }

    @Deprecated
    @GetMapping(value = "/getFinalizeApplicationFields/{uuid}", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public FinalizeRequiredFields getFinalizeApplicationFieldsByUuid(@PathVariable String uuid) {
        return finalizeApplicationService.getFinalizeApplicationFields(uuid, null);
    }

    @Deprecated
    @GetMapping(value = "/getEsignFields/{uuid}", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public EsignFields getEsignFieldsByUuid(@PathVariable String uuid) {
        return applicationService.getEsignFields(uuid, null);
    }

    @GetMapping(value = "/missing-fields/{shortCode}")
    public RequiredFields getMissingRequiredFieldsByShortCode(
        @PathVariable("shortCode") String shortCode,
        @RequestParam(required = false) Frequency selectedPaymentFrequency
    ) {
        return applicationService.getMissingRequiredFields(null, shortCode, selectedPaymentFrequency);
    }

    @GetMapping(value = "/finalize-fields/{shortCode}")
    public FinalizeRequiredFields getFinalizeApplicationFieldsByShortCode(@PathVariable("shortCode") String shortCode) {
        return finalizeApplicationService.getFinalizeApplicationFields(null, shortCode);
    }

    @GetMapping(value = "/esign-fields/{shortCode}")
    public EsignFields getEsignFieldsByShortCode(@PathVariable("shortCode") String shortCode) {
        return applicationService.getEsignFields(null, shortCode);
    }

    @PostMapping(value = "/authorizeCreditCard", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public CCTransactionInfo authorizeCreditCard(@RequestBody CCInfo ccInfo ) {
        return applicationService.authorizeCreditCard(ccInfo);
    }

    @PostMapping(value = "/submitApplication", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public SubmitApplicationResponse submitApplication(@RequestBody SubmitApplicationRequest  submitApplicationRequest) {
        return applicationService.submitApplication(submitApplicationRequest);
    }

    @PostMapping(value = "/generateEsignContract", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public GenerateContractResponse generateEsignContract(@RequestBody GenerateContractRequest request) {
        return applicationService.generateEsignContract(request);
    }

    @PostMapping(value = "/settleApplication", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ApplicationSettleResponse settleApplication(@RequestBody @Valid ApplicationSettleRequest  settleRequest) {
        return applicationService.settleApplication(settleRequest);
    }

    @PostMapping(value = "/getApplicationStatus", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ApplicationStatusResponse getApplicationStatus(@RequestBody @Valid ApplicationStatusRequest appStatusRequest) {
        return applicationService.getApplicationStatus(appStatusRequest);
    }

    @PostMapping(value = "/canContinueApplication", consumes = {MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_JSON_VALUE})
    public CanContinueResponse canContinueApplication(@RequestBody CanContinueRequest appStatusRequest) {
        return continueApplicationService.canContinueApplication(appStatusRequest);
    }

    @GetMapping(value = "/getDocumentStatus/{leadPk}", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public List<LosContract> getDocumentStatus(@PathVariable long leadPk) {
        return applicationService.getDocumentStatus(leadPk);
    }

    //STORIS
    @PostMapping(value = "/sendApplication/soap")
    public String sendApplicationXml(@Valid @RequestBody String applicationRequest) {
        return applicationService.createApplication(applicationRequest);
    }

    @PostMapping(value = "/sendInvoice/soap")
    public String sendInvoiceRequestXml(@Valid @RequestBody String authRequest) {
        return applicationService.createInvoiceRequest(authRequest);
    }

    @PostMapping(value = "/sendAdjustment/soap")
    public String sendAdjustment(@Valid @RequestBody String authAdjustmentRequest) {
        return applicationService.createAdjustmentRequest(authAdjustmentRequest);
    }

    @PostMapping(value = "/getApplicationStatus/soap")
    public String getApplicationStatus(@Valid @RequestBody String creditInquiryRequest) {
        return applicationService.getApplicationStatus(creditInquiryRequest);
    }

    @PostMapping(value = "/settleApplication/soap")
    public String settleApplication(@Valid @RequestBody String settlementRequest) {
        return applicationService.settleApplication(settlementRequest);
    }

    @PostMapping(value = "/getPlaidToken", produces = {MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<Map<String, String>> getPlaidToken(@RequestBody GetPlaidTokenRequest getPlaidTokenRequest) {
        return plaidService.getPlaidLinkToken(getPlaidTokenRequest);
    }

    @PostMapping(value = "/sendPlaidStatus", produces = {MediaType.APPLICATION_JSON_VALUE})
    public void sendPlaidEvents(@RequestBody PlaidLinkEvent plaidLinkEvent) {
        plaidService.sendPlaidStatus(plaidLinkEvent);
    }

    //UW
    @PostMapping(value = "/sendToUnderwriting")
    public UWResponse sendToUnderwriting(@RequestBody UWRequest  uwRequest) {
        return abbuwService.sendUWRequest(uwRequest);
    }

    @PostMapping(value = "/runUnderwritingForLead/{leadPk}")
    public LosUWData runUnderwritingForLead(@PathVariable("leadPk") long leadPk, @RequestParam(value = "forceUW", required = false) Boolean forceUW, @RequestParam(value = "comment") String comment) {
        return runUwService.runUnderwritingForExistingLead(leadPk, forceUW, comment);
    }

    @PostMapping(value = "/runUwStepsForLead/{leadPk}")
    public RunUwStepsResponse runUwStepsForExistingLead(@PathVariable long leadPk, @RequestBody String uwSteps) {
        return runUwStepsService.runUwStepsOnExistingLead(leadPk, uwSteps);
    }

    @PostMapping("/runUpdateWebhook/{leadPk}")
    public void runUpdateWebhook(@PathVariable("leadPk") long leadPk, @RequestParam("status") LeadStatus status) {
        webhookService.sendWebhookLeadUpdate(leadPk, status);
    }

    @PostMapping(value = "/addLease", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE}, produces = {MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public AuthorizationResponse addLease(@Valid @RequestBody AuthorizationRequest authorizationRequest) {
        return addLeaseService.addLease(authorizationRequest);
    }

    @GetMapping(value = "/checkRemainingApprovalBeforeAddLease/{leadPk}")
    public RemainingApprovalAmountInfo checkRemainingApprovalAmountBeforeAddLease(@PathVariable("leadPk") long leadPk) {
        return remainingApprovalService.checkRemainingApprovalAmountBeforeAddLease(leadPk);
    }

    @PostMapping(value = "/getMerchant")
    public MerchantResponse getMerchant(@RequestBody MerchantRequest merchantRequest) {
        return merchantService.getMerchant(merchantRequest);
    }

    @PostMapping(value = "/runNeuroIdVerification", consumes = {MediaType.APPLICATION_JSON_VALUE})
    public NeuroIdVerification runNeuroIdVerification(@RequestBody NeuroIdVerification neuroIdVerification) {
            return neuroIdVerificationService.runNeuroIdVerification(neuroIdVerification);
    }
}





src/main/java/com/uownleasing/svc/service/application/ContinueApplicationService.java
package com.uownleasing.svc.service.application;

import com.uownleasing.los.common.db.entity.LosCustomer;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.service.LosCustomerService;
import com.uownleasing.svc.config.PlaidConfig;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.pojo.rest.CanContinueResponse;
import com.uownleasing.svc.pojo.rest.CanContinueRequest;
import com.uownleasing.svc.service.LeadService;
import com.uownleasing.svc.service.MerchantService;
import com.uownleasing.svc.service.plaid.PlaidService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ContinueApplicationService {
    private static final String LOG_SUFFIX = "[ContinueApplicationService]";

    private final LeadService leadService;

    private final LeadShortCodeService leadShortCodeService;

    private final MerchantService merchantService;

    private final PlaidService plaidService;

    private final LosCustomerService customerService;

    private final PlaidConfig plaidConfig;

    public CanContinueResponse canContinueApplication(CanContinueRequest appStatusRequest) {
        var response = new CanContinueResponse();

        LosLead lead = null;

        if (StringUtils.isNotBlank(appStatusRequest.getUuid())) {
            lead = leadService.getByLeadUuid(appStatusRequest.getUuid().split("_")[0]);
        } else if (StringUtils.isNotBlank(appStatusRequest.getShortCode())) {
            lead = leadShortCodeService.getNewLeadByShortCode(appStatusRequest.getShortCode());
        }

        response.setLeadFound(lead != null);

        if (lead == null) {
            log.warn("{}Lead not found for request: {}", LOG_SUFFIX, appStatusRequest);
            return response;
        }

        log.info("{}Lead found: {}", LOG_SUFFIX, lead.getPk());
        response.setLeadPk(lead.getPk());

        Merchant merchant = merchantService.getMerchantByPk(lead.getLeadInfo().getMerchantPk());
        if (merchant == null) {
            return response;
        }

        response.setUuid(lead.getLeadInfo().getUuid() + "_" + lead.getLeadInfo().getId());
        response.setMerchantLocationName(merchant.getMerchantInfo().getLocationName());
        response.setRefMerchantCode(merchant.getMerchantInfo().getRefMerchantCode());

        LosCustomer losCustomer = customerService.getPrimaryCustomer(lead.getPk());
        if (losCustomer == null || losCustomer.getCustomerInfo() == null) {
            response.setCanContinueApplication(true);
            return response;
        }
        response.setCustomerFirstName(losCustomer.getCustomerInfo().getFirstName());
        response.setCanContinuePlaid(plaidService.canContinuePlaid(lead.getLeadInfo().getLeadStatus(),
            merchant.getMerchantInfo().getIsPlaidVerificationRequired(), lead.getLosUWData()));
        response.setVerifyPhone(response.getCanContinuePlaid() && plaidConfig.requirePhoneVerification());
        return response;
    }
}




src/main/java/com/uownleasing/svc/service/application/GetApplicationStatusService.java
package com.uownleasing.svc.service.application;

import com.uownleasing.common.enumeration.ContractStatus;
import com.uownleasing.common.enumeration.ItemStatus;
import com.uownleasing.common.pojo.LeadInfo;
import com.uownleasing.common.pojo.SchedSummaryInfo;
import com.uownleasing.los.common.db.entity.LosCustomer;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.db.entity.LosSchedSummary;
import com.uownleasing.los.common.service.LosContractService;
import com.uownleasing.los.common.service.LosCustomerService;
import com.uownleasing.los.common.service.LosItemService;
import com.uownleasing.los.common.service.LosSchedSummaryService;
import com.uownleasing.svc.common.db.entity.SvPayment;
import com.uownleasing.svc.common.service.SvPaymentService;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.enumeration.CreditInquiryTransactionStatus;
import com.uownleasing.svc.pojo.rest.ApplicationStatusRequest;
import com.uownleasing.svc.pojo.rest.ApplicationStatusResponse;
import com.uownleasing.svc.service.FundingTransactionService;
import com.uownleasing.svc.service.LeadService;
import com.uownleasing.svc.service.MerchantProgramService;
import com.uownleasing.svc.service.MerchantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.validation.Validator;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GetApplicationStatusService {

    private final LeadService leadService;

    private final Validator validator;

    private final MerchantService merchantService;

    private final MerchantProgramService merchantProgramService;

    private final LosCustomerService customerService;

    private final LosItemService itemService;

    private final LosSchedSummaryService schedSummaryService;

    private final SvPaymentService svPaymentService;

    private final LosContractService losContractService;

    private final FundingTransactionService fundingTransactionService;

    private final ConfigurationManagement configurationManagement;

    private static final String GET_APPLICATION_STATUS_SERVICE_CONFIG_PATH = "com.uownleasing.svc.service.application.GetApplicationStatusService.";

    public ApplicationStatusResponse getApplicationStatus(ApplicationStatusRequest appStatusRequest) {
        if (appStatusRequest.getMerchant() == null) {
            validator.validate(appStatusRequest);
        }

        var response = new ApplicationStatusResponse();
        var lead = getLeadFromRequest(appStatusRequest);

        if (lead == null) {
            log.warn("Lead not found for request: {}", appStatusRequest);
            return response;
        }
        log.info("Lead found: {}", lead.getPk());
        populateBasicDetails(response, lead);
        populateCustomerDetails(response, lead);
        populateMerchantDetails(response, lead);
        populateMerchantProgramDetails(response, lead);
        populateInvoiceDetails(response, lead);
        populateContractDetails(response, lead);
        populatePaymentSchedule(response, lead);
        populateFundingTransactions(response, lead);
        populatePaymentDetails(response, lead);

        return response;
    }

    private void populateBasicDetails(ApplicationStatusResponse response, LosLead lead) {
        response.setApplicationFound(true);
        response.setTransactionStatus(CreditInquiryTransactionStatus.ACCOUNT_FOUND.getStatus());
        LeadInfo leadInfo = lead.getLeadInfo();
        response.setAppUuid(leadInfo.getUuid());
        response.setLeadPk(lead.getPk());
        response.setApplicationCreatedTimestamp(lead.getRowCreatedTimestamp());
        response.setAuthorizationNumber(String.valueOf(lead.getPk()));
        response.setAccountNumber(leadInfo.getUuid());
        response.setApprovedAmount(leadInfo.getMaxApprovalAmount());
        response.setCurrentStatus(leadInfo.getLeadStatus());
        Optional.ofNullable(lead.getLosInvoice())
            .ifPresent(invoice -> response.setOpenToBuy(leadInfo.getMaxApprovalAmount().subtract(invoice.getInvoiceInfo().getTotalInvoiceAmount())));
        if (response.getOpenToBuy() != null && response.getOpenToBuy().compareTo(BigDecimal.ZERO) > 0) {
            response.setCanContinue(true);
        }
    }

    private void populateCustomerDetails(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(customerService.getPrimaryCustomer(lead.getPk()))
            .map(LosCustomer::getCustomerInfo)
            .ifPresent(customerInfo -> {
                response.setApplicationSubmitted(true);
                response.setCustomerFirstName(customerInfo.getFirstName());
                response.setCustomerLastName(customerInfo.getLastName());
            });
    }

    private void populateMerchantDetails(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(merchantService.getMerchantByPk(lead.getLeadInfo().getMerchantPk()))
            .map(Merchant::getMerchantInfo).ifPresent(info -> {
                response.setMerchantName(info.getMerchantName());
                response.setRefMerchantCode(info.getRefMerchantCode());
                response.setLocationId(info.getRefLocationId());
                response.setMerchantDiscountPercent(info.getDealerDiscountOverride());
                response.setMerchantRebatePercent(info.getDealerRebateOverride());
                response.setMerchantRebateType(info.getDealerRebateType().name());
            });
    }

    private void populateMerchantProgramDetails(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(lead)
            .map(LosLead::getLeadInfo)
            .map(LeadInfo::getMerchantProgramPk)
            .map(merchantProgramService::getMerchantProgramByProgramPk)
            .map(MerchantProgram::getProgramInfo)
            .ifPresent(info -> {
                response.setMerchantDiscountPercent(Optional.ofNullable(info.getDealerDiscount())
                    .orElse(response.getMerchantDiscountPercent()));
                response.setMerchantRebatePercent(Optional.ofNullable(info.getDealerRebate())
                    .orElse(response.getMerchantRebatePercent()));
            });
    }


    private void populateInvoiceDetails(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(lead.getLosInvoice())
            .filter(invoice -> invoice.getInvoiceInfo().getInvoiceStatus() != ItemStatus.CANCELLED)
            .ifPresent(invoice -> {
                response.setTotalInvoiceAmount(invoice.getInvoiceInfo().getTotalInvoiceAmount());
                response.setMerchantInvoiceNumber(invoice.getInvoiceInfo().getMerchantInvoiceNumber());
                response.setLineItems(itemService.getAllItemsForLead(lead.getPk()));
            });
    }

    private void populateContractDetails(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(losContractService.getLeaseContractForLead(lead.getPk()))
            .ifPresent(
                contract -> {
                    boolean isSigned = ContractStatus.SIGNED.equals(contract.getContractInfo().getContractStatus());
                    response.setHasSignedLease(isSigned);
                    LocalDateTime createdTime = contract.getRowCreatedTimestamp();
                    int hoursToExpire = this.configurationManagement.getInteger(
                        GET_APPLICATION_STATUS_SERVICE_CONFIG_PATH + "hoursToExpiredContractDownload",
                        36);
                    LocalDateTime contractDownloadExpiresAt = createdTime.plusHours(hoursToExpire);
                    response.setContractUrlExpirationTime(contractDownloadExpiresAt);
                    if (isSigned && LocalDateTime.now().isBefore(contractDownloadExpiresAt)) {
                        response.setContractUrl(contract.getContractInfo().getUrl());
                    }
                }
            );
    }

    private void populatePaymentSchedule(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(schedSummaryService.getSchedSummaryByLead(lead.getPk()))
            .map(LosSchedSummary::getSchedSummaryInfo)
            .map(SchedSummaryInfo::getFirstPaymentDueDate)
            .ifPresent(response::setPaymentDueDate);
    }

    private void populateFundingTransactions(ApplicationStatusResponse response, LosLead lead) {
        Optional.ofNullable(fundingTransactionService.getActiveFundingTransactionsForLeadPk(lead.getPk()))
            .stream()
            .flatMap(Collection::stream) // Handle null safely
            .findFirst()
            .ifPresent(transaction -> {
                var details = transaction.getFundingQueueDetails();
                if (details != null) {
                    response.setFundRequestDateTime(details.getFundingRequestDateTime());
                    response.setFundedDateTime(details.getFundDateTime());
                    response.setAmountToBeFunded(details.getAmountToBeFunded());
                    response.setMerchantDiscountAmount(details.getDealerDiscount());
                    response.setMerchantRebateAmount(details.getDealerRebate());
                }
            });
    }

    private void populatePaymentDetails(ApplicationStatusResponse response, LosLead lead) {
        Long accountPk = Optional.ofNullable(lead.getLeadInfo())
            .map(LeadInfo::getAccountPk)
            .filter(pk -> pk > 0)
            .orElse(null);

        if (accountPk == null) {
            return;
        }

        BigDecimal fee = Optional.ofNullable(lead.getLosSchedSummary())
            .map(LosSchedSummary::getSchedSummaryInfo)
            .map(info -> ObjectUtils.max(
                info.getProcessingFee(),
                info.getSecurityDeposit(),
                info.getProtectionPlanFee(),
                BigDecimal.ZERO))
            .orElse(BigDecimal.ZERO);

        List<SvPayment> payments = svPaymentService.getAllAppliedPaymentsForAccount(accountPk);
        if (CollectionUtils.isNotEmpty(payments) && (fee.compareTo(BigDecimal.ZERO) <= 0 || payments.size() > 1)) {
            SvPayment latestPayment = payments.get(0);
            Optional.ofNullable(latestPayment.getPaymentInfo()).ifPresent(paymentInfo -> {
                response.setLastPayment(paymentInfo.getPaymentAmount());
                response.setLastPaymentDate(paymentInfo.getPaymentDate());
            });
        }

    }


    private LosLead getLeadFromRequest(ApplicationStatusRequest appStatusRequest) {
        if (StringUtils.isNotBlank(appStatusRequest.getAccountNumber())) {
            return leadService.getByLeadUuid(appStatusRequest.getAccountNumber());
        }
        if (StringUtils.isNotBlank(appStatusRequest.getSsn())) {
            return leadService.getMostRecentLeadsForSsnAndMerchantPk(appStatusRequest.getSsn(), appStatusRequest.getMerchant().getPk());
        }
        if (StringUtils.isNotBlank(appStatusRequest.getUuid())) {
            return leadService.getByLeadUuid(appStatusRequest.getUuid().split("_")[0]);
        }
        return null;
    }
}





src/main/java/com/uownleasing/svc/service/application/GetSendApplicationService.java
package com.uownleasing.svc.service.application;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.uownleasing.common.enumeration.Company;
import com.uownleasing.common.pojo.LeadInfo;
import com.uownleasing.dms.common.db.entity.SmsQueue;
import com.uownleasing.dms.common.enumeration.CorrespondenceType;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.svc.common.db.entity.SvSqlConfig;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.repository.ApplicationRepo;
import com.uownleasing.svc.enumeration.ClientType;
import com.uownleasing.svc.pojo.CommonDataPojo;
import com.uownleasing.svc.pojo.CorrespondenceRequest;
import com.uownleasing.svc.pojo.rest.GetSendAppRequests;
import com.uownleasing.svc.pojo.rest.SendApplicationPojo;
import com.uownleasing.svc.pojo.rest.SendApplicationResults;
import com.uownleasing.svc.service.CorrespondenceService;
import com.uownleasing.svc.service.LeadManagementService;
import com.uownleasing.svc.service.MerchantService;
import com.uownleasing.svc.service.SmsService;
import com.uownleasing.svc.utility.SmsMessageBuilder;
import com.uownleasing.svc.utility.UrlBuilderUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class GetSendApplicationService {
    private final ApplicationRepo appRepo;
    private final SvSqlConfigService sqlConfigService;
    private final EntityManager entityManager;
    private final SmsService smsService;
    private final MerchantService merchantService;
    private final LeadManagementService leadManagementService;
    private final ConfigurationManagement configurationManagement;
    private final CorrespondenceService correspondenceService;
    protected String configurationPath = "com.uownleasing.svc.service.application.GetSendApplicationService.";

    private final ObjectMapper mapper = new ObjectMapper();
    public List<SendApplicationPojo> getSendApplicationRequests(String refMerchantCodes) {
        List<String> refCodes = StringUtils.isBlank(refMerchantCodes) ? com.uownleasing.svc.config.ThreadAttributes.getMerchantReferenceCodes() : refMerchantCodes.equalsIgnoreCase("*") ? null : Arrays.asList(refMerchantCodes.split(","))  ;
        log.info("[LeadService][getSendApplicationRequests] refCodes : {}", refCodes);
        return appRepo.getSendApplicationRequests(refCodes == null || refCodes.isEmpty(), refCodes);
    }

    public SendApplicationResults getSendApplicationRequestsByCriteria(GetSendAppRequests request) {
        List<String> refCodes = CollectionUtils.isEmpty(request.getMerchantRefCodes()) ? com.uownleasing.svc.config.ThreadAttributes.getMerchantReferenceCodes() : request.getMerchantRefCodes().contains("*") ? null : request.getMerchantRefCodes();
        SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("getSendApplicationRequests");
        String sql = sqlConfig.getSqlConfigInfo().getSqlQuery()
            .replaceAll("(?i):from", "'" + request.getFrom() + "'")
            .replaceAll("(?i):to", "'" + request.getTo() + "'")
            .replaceAll("(?i):returnAll", CollectionUtils.isEmpty(refCodes) ? "true" : "false")
            .replaceAll("(?i):merchantRefCodes", "'" + StringUtils.join(refCodes, "','") + "'")
            .replaceAll("(?i):merchantNames", CollectionUtils.isEmpty(request.getMerchantNames()) ? "null" : "'" + StringUtils.join(request.getMerchantNames(), "','") + "'")
            .replaceAll("(?i):searchString", StringUtils.isBlank(request.getSearchString()) ? "null" : "'" + request.getSearchString() + "'")
            .replaceAll("(?i):maxResults", String.valueOf(request.getMaxResults()))
            .replaceAll("(?i):offset", String.valueOf(request.getMaxResults() * request.getPageNumber()));

        Query query = entityManager.createNativeQuery(sql);
        NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
        nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        List<Map<String, Object>> resultList = nativeQuery.getResultList();

        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        mapper.configure(MapperFeature.USE_ANNOTATIONS, false);
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModule(new Jdk8Module());

        List<SendApplicationPojo> r = resultList.stream()
            .map(o -> {
                try {
                    return
                        mapper.readValue(mapper.writeValueAsString(o), SendApplicationPojo.class);
                } catch (Exception e) {
                    log.info("Error message ", e);
                }
                return null;
            }).collect(Collectors.toList());

        SendApplicationResults results = new SendApplicationResults();
        results.setResults(r);
        results.setTotalCount(CollectionUtils.isEmpty(r) ? 0L : r.get(0).getTotalCount());
        results.setMoreResults(request.getMaxResults() * (request.getPageNumber() + 1) < results.getTotalCount());
        return results;
    }

    public String sendApplicationToCustomer(SendApplicationPojo sendApplicationPojo){
        Merchant merchant = merchantService.getActiveMerchantByMerchantCode(sendApplicationPojo.getRefMerchantCode());
        LeadInfo leadInfo = new LeadInfo();
        leadInfo.setUuid(UUID.randomUUID().toString());
        leadInfo.setMerchantPk(merchant.getPk());
        leadInfo.setExpirationDate(LocalDate.now().plusDays(merchant.getMerchantInfo().getNumDaysApprovalExp()));
        leadInfo.setSendApplicationToEmail(sendApplicationPojo.getCustEmailAddress());
        leadInfo.setSendApplicationToPhone(sendApplicationPojo.getCustPhoneNumber());
        leadInfo.setSendApplicationByUser(com.uownleasing.svc.config.ThreadAttributes.getUsername());
        if (merchant.getMerchantInfo().getClientType() == ClientType.KORNERSTONE) {
            leadInfo.setCompany(Company.KORNERSTONE);
        }
        leadInfo.setNotes("[UownClient][sendApplicationToCustomer] DeviceInfo : "+ ThreadAttributes.getDeviceInfo()+", Email : "+sendApplicationPojo.getCustEmailAddress()+", Phone : "+sendApplicationPojo.getCustPhoneNumber());
        leadInfo.setCreatedFrom("PORTAL");
        LosLead lead = leadManagementService.createOrUpdateLead(leadInfo);

        //send email and text to customer
        String envName = System.getenv("ENVIRONMENT_NAME");
        String env = !org.thymeleaf.util.StringUtils.isEmpty(envName) ? envName : null;
        var clientType = merchant.getMerchantInfo().getClientType();
        var redirectUrl = UrlBuilderUtils.buildStartApplicationUrl(clientType, env, lead.getLeadInfo().getShortCode());

        if(StringUtils.isNotBlank(sendApplicationPojo.getCustPhoneNumber())){
            SmsQueue sms = new SmsQueue();
            sms.setLeadPk(lead.getPk());
            sms.setAccountPk(lead.getLeadInfo().getAccountPk());
            sms.setToPhoneNumber(sendApplicationPojo.getCustPhoneNumber());
            sms.setSmsBody(SmsMessageBuilder.buildApplicationRedirectMessage(clientType, redirectUrl));
            sms.setTemplateName("SendApplication");
            String token = smsService.sendText(sms);
            lead.getLeadInfo().setSendApplicationSmsToken(token);
        }
        if(StringUtils.isNotBlank(sendApplicationPojo.getCustEmailAddress())) {
            CorrespondenceRequest correspondenceRequest = new CorrespondenceRequest();
            correspondenceRequest.setLeadPk(lead.getPk());
            correspondenceRequest.setCorrespondenceType(CorrespondenceType.EMAIL);
            correspondenceRequest.setTemplateName("SendApplicationEmail");
            correspondenceRequest.setIsImmediate(Boolean.TRUE);
            CommonDataPojo cdp = new CommonDataPojo();
            cdp.setCustomerEmailAddresses(sendApplicationPojo.getCustEmailAddress());
            cdp.setSendApplicationUrl(redirectUrl);
            correspondenceRequest.setCommonDataPojo(cdp);
            log.info("Correspondence Request {}", correspondenceRequest);
            if (configurationManagement.getBoolean(configurationPath + "send.send.application.email.in.async", true)) {
                correspondenceService.createCorrespondenceAsync(correspondenceRequest);
            } else {
                correspondenceService.createCorrespondence(correspondenceRequest);
            }
        }
        return redirectUrl;
    }
}





src/main/java/com/uownleasing/svc/service/application/LeadShortCodeService.java
package com.uownleasing.svc.service.application;

import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.pojo.LeadInfo;
import com.uownleasing.common.utils.Base62GeneratorUtils;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.service.LosLeadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeadShortCodeService {

    private final LosLeadService losLeadService;

    public LosLead generateShortCodeForLeadIfMissing(LosLead lead) {
        if (StringUtils.isBlank(lead.getLeadInfo().getShortCode())) {
            lead.getLeadInfo().setShortCode(Base62GeneratorUtils.randomBase62(8));
            return losLeadService.updateLead(lead.getLeadInfo());
        };
        return lead;
    }

    public LosLead getByLeadShortCodeAndStatus(String shortCode, LeadStatus status) {
        log.info("[LeadService][getByLeadShortCodeAndStatus] Lead shortCode {}", shortCode);
        LosLead lead = null;
        if (StringUtils.isNotBlank(shortCode)) {
            lead = losLeadService.getByLeadShortCodeAndLeadStatus(shortCode, status)
                .stream()
                .findFirst()
                .orElse(null);
        }
        return lead;
    }

    public LosLead getNewLeadByShortCode(String shortCode) {
        log.info("[LeadService][getNewLeadByShortCode] Lead ApplicationId {}", shortCode);
        LosLead lead = null;
        if (StringUtils.isNotBlank(shortCode)) {
            lead = losLeadService.getRecentByLeadShortCodeAndLeadStatus(shortCode, LeadStatus.NEW);
        }
        return lead;
    }

    public List<LosLead> getByLeadShortCode(String shortCode) {
        log.info("[LeadService][getByLeadShortCode] Lead shortCode {}", shortCode);
        List<LosLead> leads = null;
        if (StringUtils.isNotBlank(shortCode)) {
            leads = losLeadService.getByLeadShortCode(shortCode);
        }
        return leads;
    }

    public LosLead refreshAndSaveShortCode(LosLead lead) {
        lead.getLeadInfo().setShortCode(Base62GeneratorUtils.randomBase62(8));
        return losLeadService.updateLead(lead.getLeadInfo());
    }
}





src/main/java/com/uownleasing/svc/service/application/MissingRequiredFieldsService.java
package com.uownleasing.svc.service.application;

import com.uownleasing.common.enumeration.Frequency;
import com.uownleasing.common.enumeration.ItemStatus;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Intellicheck;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.db.entity.NeuroIdVerification;
import com.uownleasing.svc.enumeration.MerchantType;
import com.uownleasing.svc.enumeration.NeuroIdStatus;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.MerchantInfo;
import com.uownleasing.svc.pojo.rest.RequiredFields;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.utility.DateUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@Slf4j
@RequiredArgsConstructor
public class MissingRequiredFieldsService {
    protected String configurationPath = "com.uownleasing.svc.service.MissingRequiredFieldsService";
    private final LeadService leadService;
    private final LosCustomerService customerService;
    private final LosEmploymentService employmentService;
    private final LosBankAccountService bankAccountService;
    private final LosInvoiceService invoiceService;
    private final LosItemService itemService;
    private final MerchantService merchantService;
    private final ConfigurationManagement configurationManagement;
    private final IdVerificationService idVerificationService;
    private final LosLoggingService loggingService;
    private final UnderwritingService underwritingService;
    private final CalculatorService calculatorService;
    private final IntellicheckService intellicheckService;
    private final LosLoggingService losLoggingService;
    private final MerchantProgramService merchantProgramService;
    private final NeuroIdVerificationService neuroIdVerificationService;
    private final UserAgentService userAgentService;
    private final CCCheckService ccCheckService;
    private final LeadCustomerService leadCustomerService;

    public RequiredFields getMissingRequiredFields(LosLead lead, Frequency selectedPaymentFrequency, String shortCode) {
        RequiredFields requiredFields = new RequiredFields();
        //requiredFields.setAchAutoPay(lead.getLeadInfo().getAchAutoPay());

        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        if(merchant == null){
            throw new SvcException("Could not find application for merchant. Please contact merchant");
        }
        MerchantInfo merchantInfo = merchant.getMerchantInfo();
        requiredFields.setMerchantRefCode(merchantInfo.getRefMerchantCode());
        if (!configurationManagement.getBoolean(configurationPath+"items.can.be.empty.for.merchant."+merchantInfo.getRefMerchantCode(), false)
            && !configurationManagement.getString(configurationPath+"items.can.be.empty.for.client.type", "SYNCHRONY").contains(merchantInfo.getClientType().name())
            && (itemService.getAllItemsForLead(lead.getPk()) == null ||
            itemService.getAllItemsForLead(lead.getPk()).isEmpty())) {
            throw new SvcException("Please add items to cart.");
        }

        LosInvoice invoice = invoiceService.getInvoiceForLead(lead.getPk());
        if (invoice == null || invoice.getInvoiceInfo().getTotalInvoiceAmount().compareTo(BigDecimal.ZERO) < 1)
            throw new SvcException("Please add items to cart before proceeding to sign.");
        if (invoice.getInvoiceInfo().getInvoiceStatus() == ItemStatus.CANCELLED)
            throw new SvcException("Items were cancelled. Please add items to cart before proceeding to sign.");

        LosUWData uwData = underwritingService.getUWDataForLead(lead.getPk());

        String state = merchantInfo.getMerchantType() == MerchantType.INSTORE ? merchantInfo.getState() : lead.getLeadInfo().getCustomerState();
        //StateConfigurations stateConfigs = stateConfigService.getByState(state);
        Boolean isIdCheckRequired = merchantInfo.getIsIntellicheckRequired() || merchantInfo.getIsSeonIdCheckRequired()
            || (merchantInfo.getCheckUwForVerification() && uwData.getUwInfo().getIsIntellicheckRequired());
        if(!merchantInfo.getIsCcRequired() && merchantInfo.getIsAchRequired()
            && configurationManagement.getBoolean(configurationPath+"no.discount.for.auto.achpayment.only." + merchantInfo.getClientType(), true))
            requiredFields.setAchDiscount(new BigDecimal(0));
        else
            requiredFields.setAchDiscount(BigDecimal.valueOf(configurationManagement.getDouble(configurationPath + "discount.amount.auto.ach", 0.00)));
        lead.getLeadInfo().setNotes("[UownClient][getMissingRequiredFields]");
        Integer hours = configurationManagement.getInteger(configurationPath + "max.hours.link.is.valid", 36);
        if (lead.getLeadInfo().getLeadStatus() != LeadStatus.UW_APPROVED
            && lead.getLeadInfo().getLeadStatus() != LeadStatus.CONTRACT_CREATED) {
            throw new SvcException("Application is " + lead.getLeadInfo().getLeadStatus().getUserFriendlyText() + ". Please reapply");
        }

        LosPaymentOptions paymentOption = lead.getLosPaymentOptions()
            .stream()
            .filter(po -> shortCode.equals(po.getSchedSummaryInfo().getShortCode()))
            .findFirst()
            .orElse(null);

        if (paymentOption == null) {
            throw new SvcException("Invalid link. Please contact merchant");
        }

        if (DateUtils.getDifferenceBetweenLocalDateTimesInHours(paymentOption.getRowCreatedTimestamp(), LocalDateTime.now()) > hours) {
            throw new SvcException("Link is valid only for " + hours + " hours. Please submit new application");
        }

        requiredFields.setLeadPk(lead.getPk());
        if(selectedPaymentFrequency == null){
//            LosSchedSummary schedSummary = schedSummaryService.getSchedSummaryByLead(lead.getPk());
//            if(schedSummary == null || schedSummary.getSchedSummaryInfo() == null || schedSummary.getSchedSummaryInfo().getPaymentFrequency() == null) {
            requiredFields.getMissingFields().add("desiredPaymentFrequency");
//            }else{
//                requiredFields.setDesiredPaymentFrequency(schedSummary.getSchedSummaryInfo().getPaymentFrequency());
//            }
        }

        Boolean isNeuroIdCheckRequired = merchantInfo.getUseNeuroIdCheck();
        requiredFields.setIsNeuroIdCheckRequired(isNeuroIdCheckRequired);
        if (Boolean.TRUE.equals(requiredFields.getIsNeuroIdCheckRequired())) {
            List<NeuroIdVerification> neuroIdVerificationList = neuroIdVerificationService.getByLeadPk(lead.getPk());
            if (neuroIdVerificationList.size()>0)
                requiredFields.setNeuroIdCheckPassed(Boolean.TRUE.equals(neuroIdVerificationList.get(0).getSuccess()) && neuroIdVerificationList.get(0).getNeuroIdStatus().equals(NeuroIdStatus.SUCCESS));
        }

        requiredFields.setIsIdCheckRequired(isIdCheckRequired);

        if (Boolean.TRUE.equals(requiredFields.getIsIdCheckRequired())) {
            String provider = idVerificationService.getIdVerificationProvider(merchantInfo);
            if ("INTELLICHECK".equals(provider)) {
                Intellicheck intellicheck = intellicheckService.getByLeadPk(lead.getPk());
                boolean passed = intellicheck != null
                    && Boolean.TRUE.equals(intellicheck.getIntellicheckInfo().getSuccess())
                    && Boolean.TRUE.equals(intellicheck.getIntellicheckInfo().getIdVerifySuccess());

                requiredFields.setIdCheckPassed(passed);
                if (!passed) {
                    requiredFields.setIdCheckProvider("INTELLICHECK");
                }

            } else {
//                Seon seon = seonService.getRecentRecord(lead.getPk());
//                boolean passed = seon != null
//                    && Boolean.TRUE.equals(seon.getSeonInfo().getSuccess())
//                    && Boolean.TRUE.equals(seon.getSeonInfo().getIdVerifySuccess());
                Boolean passed = idVerificationService.verifySeon(lead) == null;
                log.info("[UownClient][getMissingRequiredFields] leadPk {}, is seon id check pass? {}", lead.getPk(), passed);
                requiredFields.setIdCheckPassed(passed);
                if (!passed) {
                    requiredFields.setIdCheckProvider("SEON");
                }
            }
        }


        Boolean isOfferInsuranceRequired = merchantInfo.getOfferInsurance();
        if(isOfferInsuranceRequired != null && isOfferInsuranceRequired){
            String insuranceOfferedStates = configurationManagement.getString(configurationPath+"offer.insurance.in.states", "AR, AZ, AK, AL, CO, CT, DE, DC, FL, GA, HI, IN, IL, IA, ID, KY, KS, LA, LA, MO, MI, MT, MN, MD, ME, MA, MS, NE, NY, NM, NH, ND, NC, NJ, NV, OR, OH, PA, SD, SC, TX, TN, VT, VA, WV, WY, WI, PR");
            String customerState = lead.getLeadInfo().getCustomerState();
            if(!insuranceOfferedStates.contains(customerState)){
                isOfferInsuranceRequired = Boolean.FALSE;
                loggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, null, null, "Protection plan not offered in state "+state, ThreadAttributes.getUsername());
            }
        }
        requiredFields.setIsOfferInsuranceRequired(isOfferInsuranceRequired);

        Boolean isBankVerificationRequired = merchantInfo.getIsBankVerificationRequired();
        requiredFields.setIsBankVerificationRequired(isBankVerificationRequired);

        requiredFields.setRecordSigningFlow(merchantInfo.getRecordSigningFlow());

        BigDecimal feeToBeCharged = calculatorService.getFeeToBeChargedForLead(lead);
        requiredFields.setSecurityDeposit(calculatorService.getSecurityDepositForLead(lead));
        requiredFields.setFeeToBeCharged(feeToBeCharged);

        MerchantProgram merchantProgram = merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk());
        if(merchantProgram==null)
            throw new SvcException("No program exists.");
        requiredFields.setSigningFeeExists(merchantProgram.getProgramInfo().getAmountChargedAtSigning().compareTo(BigDecimal.ZERO) > 0);
        LosCustomer customer = customerService.getPrimaryCustomer(lead.getPk());
        requiredFields.setBasicCustomerData(leadCustomerService.getBasicCustomerDataForLead(lead.getPk()));

        LosBankAccount bankAccount = bankAccountService.getAutoPayBankAccountForCustomer(customer.getPk());
//        if(bankAccount != null){
//            requiredFields.setBankAccountInfo(bankAccount.getBankAccountInfo());
//        }
        if(merchantInfo.getIsAchRequired()) {
            if(bankAccount == null || bankAccount.getBankAccountInfo() == null
                || StringUtils.isBlank(bankAccount.getBankAccountInfo().getAccountNumber())
                || StringUtils.isBlank(bankAccount.getBankAccountInfo().getRoutingNumber())){
                requiredFields.getMissingFields().add("bankAccountInfo");
            }
        }
//        if(lead.getLeadInfo().getAchAutoPay() == null || !lead.getLeadInfo().getAchAutoPay()){
//            requiredFields.getMissingFields().add("achAutoPay");
//        }

        LosEmployment employment = employmentService.getPrimaryEmploymentByCustomerPK(customer.getPk());
        if(employment == null || employment.getEmploymentInfo() == null){
            requiredFields.getMissingFields().add("nextPayDate");
            requiredFields.getMissingFields().add("payFrequency");
        }else {
            if (employment.getEmploymentInfo().getNextPayDate() == null) {
                requiredFields.getMissingFields().add("nextPayDate");
            }
            if (employment.getEmploymentInfo().getPayFrequency() == null){
                requiredFields.getMissingFields().add("payFrequency");
            }
        }
        if(merchantInfo.getIsCcRequired()) {
            if(!ccCheckService.creditCardExists(lead.getPk(), feeToBeCharged)){
                requiredFields.getMissingFields().add("ccInfo");
            }
        }
        if(merchantInfo.getIsFpdRequired()){
            requiredFields.getMissingFields().add("firstPaymentDate");
        }

        LosSchedSummary summary = lead.getLosSchedSummary();
        if(summary != null && summary.getSchedSummaryInfo() != null) {
            requiredFields.setFirstPaymentDate(summary.getSchedSummaryInfo().getFirstPaymentDueDate());
        }

        if(merchantInfo.getIsItemSplit()) {
            List<LosItem> itemList = itemService.getAllItemsForLead(requiredFields.getLeadPk());
            List<LosItem> itemsToPurchase = itemList.stream()
                .filter(item -> item.getItemInfo().getStatus().equals(ItemStatus.PURCHASE_NOW))
                .collect(Collectors.toList());
            List<LosItem> itemsOnLease = itemList.stream()
                .filter(item -> !List.of(ItemStatus.PURCHASE_NOW, ItemStatus.PAID, ItemStatus.PAID_DELIVERED, ItemStatus.CANCELLED, ItemStatus.RETURNED)
                    .contains(item.getItemInfo().getStatus()))
                .collect(Collectors.toList());
            if(itemsToPurchase.size() > 0) {
                LosInvoice losInvoice = invoiceService.getInvoiceForLead(lead.getPk());

                requiredFields.getMissingFields().add("purchaseNowItem");
                requiredFields.getItemPaymentSummary().setLeaseAmount(losInvoice.getInvoiceInfo().getTotalInvoiceAmount());
                requiredFields.getItemPaymentSummary().setApprovalAmount(lead.getLeadInfo().getMaxApprovalAmount());
                requiredFields.getItemPaymentSummary().setItemsOnLease(itemsOnLease);
                requiredFields.getItemPaymentSummary().setItemsToPurchase(itemsToPurchase);

                BigDecimal taxRate;
                if (summary != null) {
                    taxRate = summary.getSchedSummaryInfo().getTaxRate();
                } else {
                    taxRate = calculatorService.getTaxRateForLead(lead, merchant);
                    if (taxRate == null) {
                        throw new SvcException("Unable to get tax rate");
                    }
                }
                requiredFields.getItemPaymentSummary().setPurchaseNowAmount(losInvoice.getInvoiceInfo().getPurchaseTotal()
                    .multiply(BigDecimal.ONE.add(taxRate))
                    .setScale(2, RoundingMode.HALF_EVEN));

                requiredFields.setVerifyPhoneBeforeSigning(merchantInfo.getVerifyPhoneBeforeSigning() == null
                    ? Boolean.FALSE
                    : merchantInfo.getVerifyPhoneBeforeSigning());
            }
        }

        if (requiredFields.getMissingFields().contains("bankAccountInfo") && !isBankVerificationRequired && merchantInfo.getIsCcRequired()) {
            requiredFields.setOptionalAchText(configurationManagement.getString(configurationPath + "optional.ach.text", """
                Optional Method of Payment
                If you would like to provide us with your bank account information in addition to your credit/debit card information, we will use that as your primary method of payment. You authorize us to use it for your first payment and future payments. We will reprocess the debit or credit card in the event of a returned payment.
                """)
            );
        }
        userAgentService.addUserAgentToLead(lead);
        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "[Signing Flow] Started. Lead status "+lead.getLeadInfo().getLeadStatus(), ThreadAttributes.getUsername());
        leadService.createOrUpdateLead(lead.getLeadInfo());
        return requiredFields;
    }
}





src/main/java/com/uownleasing/svc/service/application/SendFinalizeService.java
package com.uownleasing.svc.service.application;

import com.uownleasing.dms.common.db.entity.SmsQueue;
import com.uownleasing.dms.common.enumeration.CorrespondenceType;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.db.entity.LosPhone;
import com.uownleasing.los.common.service.LosPhoneService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.pojo.CommonDataPojo;
import com.uownleasing.svc.pojo.CorrespondenceRequest;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.utility.SmsMessageBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Service
@Transactional
@Validated
@Slf4j
@RequiredArgsConstructor
public class SendFinalizeService {

    private final LeadService leadService;

    private final MerchantService merchantService;

    private final LosPhoneService phoneService;

    private final SmsService smsService;

    private final CorrespondenceService correspondenceService;

    private final ConfigurationManagement configurationManagement;

    protected String configurationPath = "com.uownleasing.svc.service.SendFinalizeService.";


    public void sendFinalizeEmailToCustomer(long leadPk, String redirectUrl) {
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        LosLead lead = leadService.getByLeadPk(leadPk);
        List<LosPhone> losPhones = phoneService.getPhonesByLeadPk(lead.getPk());
        if(losPhones != null && !losPhones.isEmpty()) {
            String phoneNumber = losPhones.get(0).getPhoneInfo().getAreaCode()+losPhones.get(0).getPhoneInfo().getPhoneNumber().toString();
            SmsQueue sms = new SmsQueue();
            sms.setToPhoneNumber(phoneNumber);
            sms.setTemplateName("FinalizePurchase");
            sms.setSmsBody(SmsMessageBuilder.buildPurchaseFinalizationMessage(merchant.getMerchantInfo().getClientType(), redirectUrl));
            sms.setLeadPk(lead.getPk());
            sms.setAccountPk(lead.getLeadInfo().getAccountPk());
            sms.setCreatedBy(ThreadAttributes.getUsername());
            smsService.sendTextAsync(sms);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseSms to phone "+phoneNumber+" in async");
        }
        CorrespondenceRequest request = new CorrespondenceRequest();
        request.setLeadPk(leadPk);
        request.setTemplateName("FinalizePurchaseEmail");
        request.setCorrespondenceType(CorrespondenceType.EMAIL);
        request.setIsImmediate(Boolean.TRUE);
        request.setCreatedBy(com.uownleasing.svc.config.ThreadAttributes.getUsername());
        CommonDataPojo cdp = new CommonDataPojo();
        cdp.setPaymentOptionUrl(redirectUrl);
        request.setCommonDataPojo(cdp);
        if (configurationManagement.getBoolean(configurationPath + "send.finalize.email.in.async", true)) {
            try {
                Thread.sleep(configurationManagement.getLong(configurationPath + "sleep.before.sending.finalize", 1000L));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            correspondenceService.createCorrespondenceAsync(request);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseEmail in async.");
        } else {
            correspondenceService.createCorrespondence(request);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseEmail in sync.");
        }
        leadService.createOrUpdateLead(lead.getLeadInfo());
    }
}




src/main/java/com/uownleasing/svc/service/application/SendInvoiceService.java
package com.uownleasing.svc.service.application;

import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.*;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.service.SvAlertService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.enumeration.AuthApprovalStatus;
import com.uownleasing.svc.enumeration.ModType;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.AuthorizationRequest;
import com.uownleasing.svc.pojo.AuthorizationResponse;
import com.uownleasing.svc.pojo.LeadModificationsInfo;
import com.uownleasing.svc.pojo.MerchantInfo;
import com.uownleasing.svc.pojo.rest.CalculatorRequest;
import com.uownleasing.svc.pojo.rest.CalculatorResults;
import com.uownleasing.svc.pojo.rest.CancelAccountRequest;
import com.uownleasing.svc.pojo.rest.InvoiceInformation;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.cc.CCRunRefundService;
import com.uownleasing.svc.service.protectionplan.CancelProtectionPlanService;
import com.uownleasing.svc.utility.UrlBuilderUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.validation.Validator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class SendInvoiceService {

    private final LeadService leadService;

    private final LosContractService contractService;

    private final EsignService esignService;

    private final LosInvoiceService invoiceService;

    private final LosItemService itemService;

    private final ConfigurationManagement configurationManagement;

    private final LosCustomerService customerService;

    private final LeadShortCodeService leadShortCodeService;

    private final CalculatorService calculatorService;

    private final Validator validator;
    private final LosBankAccountService bankAccountService;

    private final LosEmploymentService employmentService;

    private final SvAccountService accountService;

    private final LosSchedSummaryService schedSummaryService;

    private final UownReceivableService receivableService;

    private final LosToSvcImportService losToSvcImportService;

    private final LosPaymentOptionsService paymentOptionsService;

    private final LeadManagementService leadManagementService;

    private final ItemSplitService itemSplitService;

    private final SendFinalizeService sendFinalizeService;

    private final LeadItemService leadItemService;

    private final UpdateLeadStatusService updateLeadStatusService;

    private final LeadFundingService leadFundingService;
    private final LosLoggingService loggingService;

    private final CCRunRefundService ccRunRefundService;

    private final CancelProtectionPlanService cancelProtectionPlanService;

    private final SvAlertService svAlertService;

    private final LosAlertService alertService;

    private final LeadModificationsService leadModificationsService;

    private final LosCreditCardTransactionService losCreditCardTransactionService;

    private final UnderwritingService underwritingService ;

    private final CreateAndSendContractService sendContractService ;

    private final CancelAccountService cancelAccountService;

    protected String configurationPath = "com.uownleasing.svc.service.SendInvoiceService.";

    public AuthorizationResponse createInvoiceRequest(AuthorizationRequest authorizationRequest) {
        if (authorizationRequest.getMerchant() == null || authorizationRequest.getLead() == null) {
            validator.validate(authorizationRequest);
        }

        log.info("Authorization Request {} ", authorizationRequest);
        LosLead lead = authorizationRequest.getLead();
        AuthorizationResponse authorizationResponse;

        String uuid = configurationManagement.getAuthorizationRequestByLeadPk(lead.getPk());
        boolean useAuthMap = configurationManagement.getBoolean(configurationPath + "check.authorization.request.map.for."
            + authorizationRequest.getMerchant().getMerchantInfo().getClientType(), false);
        if (useAuthMap && StringUtils.isNotBlank(uuid)) {
            authorizationResponse = new AuthorizationResponse();
            authorizationResponse.setSorErrorDescription("Duplicate authorization request");
            authorizationResponse.setFaults(true);
            authorizationResponse.setAuthApprovalStatus(AuthApprovalStatus.DECLINED);
            return authorizationResponse;
        }

        try {
            if (useAuthMap) {
                configurationManagement.addAuthorizationRequest(lead.getPk(), lead.getLeadInfo().getUuid());
                log.info("[createInvoiceRequest] Added application, leadPk: {}, uuid: {}", lead.getPk(), lead.getLeadInfo().getUuid());
            }
            LosCustomer customer = customerService.getPrimaryCustomer(lead.getPk());
            lead.getLeadInfo().setNotes("[SendInvoiceService][createInvoiceRequest] START Invoice received from merchant. Order Type "+authorizationRequest.getOrderType());
            //        if(authorizationRequest.getOrderType() != OrderType.SALE || lead.getLeadInfo().getAccountPk() != null
            //            || (lead.isSignedOrBeyond() && isInvoiceModified(authorizationRequest))){
            //            lead.getLeadInfo().setNotes("[SendInvoiceService][createInvoiceRequest] updateInvoiceRequest");
            //            return updateInvoiceRequest(authorizationRequest);
            //        }

            BankAccountInfo bankAccountInfo = authorizationRequest.toBankAccountInfo();
            if (bankAccountInfo != null) {
                LosBankAccount bankAccount = bankAccountService.getAutoPayBankAccountForCustomer(customer.getPk());
                if (bankAccount != null) {
                    bankAccountInfo.setBankAccountPk(bankAccount.getPk());
                }

                bankAccountInfo.setLeadPk(lead.getPk());
                bankAccountInfo.setCustomerPk(customer.getPk());
                bankAccountService.createOrUpdateBankAccount(bankAccountInfo);
            }

            EmploymentInfo employmentInfo = authorizationRequest.toEmploymentInfo();
            if (employmentInfo != null) {
                LosEmployment employment = employmentService.getPrimaryEmploymentByCustomerPK(customer.getPk());
                if (employment != null) {
                    employmentInfo.setEmploymentPk(employment.getPk());
                }

                employmentInfo.setCustomerPk(customer.getPk());
                employmentService.createOrUpdateEmployment(employmentInfo);
            }

            authorizationResponse = createOrUpdateInvoice(authorizationRequest);

            lead.getLeadInfo().setNotes("[SendInvoiceService][createInvoiceRequest] Lead status "+lead.getLeadInfo().getLeadStatus());
            lead.getLeadInfo().setNotes("[SendInvoiceService][createInvoiceRequest] END. sendInvoice response status "+authorizationResponse.getAuthApprovalStatus());
            return authorizationResponse;
        } catch (Exception e) {
            log.error("Error updating invoice", e);
            authorizationResponse = new AuthorizationResponse();
            authorizationResponse.setSorErrorDescription("Unable to process request");
            authorizationResponse.setFaults(true);
            authorizationResponse.setAuthApprovalStatus(AuthApprovalStatus.DECLINED);
            return authorizationResponse;
        } finally {
            if (useAuthMap) {
                configurationManagement.removeAuthorizationRequest(lead.getPk(), lead.getLeadInfo().getUuid());
                log.info("[createInvoiceRequest] Removed application, leadPk: {}, uuid: {}", lead.getPk(), lead.getLeadInfo().getUuid());
            }
        }
    }

    protected AuthorizationResponse createOrUpdateInvoice(AuthorizationRequest authorizationRequest){
        AuthorizationResponse authorizationResponse = new AuthorizationResponse();
        LosLead lead = authorizationRequest.getLead();
        LosInvoice oldInvoice = lead.getLosInvoice();
        lead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoice]");
        InvoiceInfo invoiceInfo = authorizationRequest.toInvoiceInfo();
        invoiceInfo.setLeadPk(lead.getPk());
        List<ItemInfo> items = authorizationRequest.toItems();
        MerchantInfo merchantInfo = authorizationRequest.getMerchant().getMerchantInfo();

        if (lead.isSignedOrBeyond() && invoiceInfo.getTotalInvoiceAmount().compareTo(oldInvoice.getInvoiceInfo().getTotalInvoiceAmount()) > 0
            && (configurationManagement.getBoolean(configurationPath + "do.not.allow.invoice.increase.for.merchant." + merchantInfo.getRefMerchantCode(), false)
            || configurationManagement.getBoolean(configurationPath + "do.not.allow.invoice.increase.for.client." + merchantInfo.getClientType(), false))) {
            throw new SvcException("Invoice increase after signing not allowed for merchant");
        }

        InvoiceInformation invoiceInformation = new InvoiceInformation();
        invoiceInformation.setInvoiceInfo(invoiceInfo);
        invoiceInformation.setItemInfoList(items);
        invoiceInformation.setSelectedPaymentFrequency(authorizationRequest.getSelectedPaymentFrequency());
        invoiceInformation.setLead(lead);
        invoiceInformation.setMerchantInfo(merchantInfo);
        invoiceInformation.setApiCall(true);
        invoiceInformation.setRefundPaymentsOnCancel(Boolean.TRUE);
        invoiceInformation.setComment("Invoice cancelled via API ");
        invoiceInformation = createOrUpdate(invoiceInformation);
        authorizationResponse.setPaymentDetailsList(invoiceInformation.getPaymentDetailsList());
        authorizationResponse.setProviderURL(invoiceInformation.getProviderURL());
        authorizationResponse.setLead(invoiceInformation.getLead());
        authorizationResponse.setAccountNumber(lead.getLeadInfo().getUuid());
        authorizationResponse.setAuthorizationNumber(String.valueOf(lead.getPk()));
        authorizationResponse.setOrderTotal(authorizationRequest.getOrderTotal());
        authorizationResponse.setExternalReferenceId(lead.getLeadInfo().getExternalReferenceId());
        authorizationResponse.setInvoiceItems(invoiceInformation.getItemInfoList());
        authorizationResponse.setAuthApprovalStatus(StringUtils.isNotBlank(invoiceInformation.getError()) ? AuthApprovalStatus.DECLINED : AuthApprovalStatus.APPROVED);
        authorizationResponse.setFaults(StringUtils.isNotBlank(invoiceInformation.getError()));
        authorizationResponse.setSorErrorDescription(invoiceInformation.getError());
        return authorizationResponse;
    }

    public InvoiceInformation createOrUpdate(InvoiceInformation invoiceInformation) {
        LosLead losLead = leadService.getByLeadPk(invoiceInformation.getInvoiceInfo().getLeadPk());
        invoiceInformation.setLead(losLead);

        if(!invoiceInformation.getApiCall()) {
            validator.validate(invoiceInformation);
            if (StringUtils.isNotBlank(invoiceInformation.getError())) {
                return invoiceInformation;
            }
        }
        if (losLead.hasAccount()) {
            AccountInfo account = accountService.getAccountInfoForAccount(losLead.getLeadInfo().getAccountPk());
            Integer daysPastActivation = configurationManagement.getInteger(configurationPath + "num.days.past.creation.for.lease.mod", 80);
            if (!configurationManagement.getString(configurationPath + "account.status.to.allow.lease.mod", "ACTIVE,CANCELLED")
                .contains(account.getAccountStatus().name())) {
                invoiceInformation.setError("Cannot modify lease with inactive account");
                return invoiceInformation;
            } else if (configurationManagement.getBoolean(configurationPath + "check.days.past.creation.for.lead.mod", true)
                && !configurationManagement.getString(configurationPath + "users.allowed.bypass.lease.mod.check","justin.batten,jessica.short,nicole.banfield,tim.blomquist,erin.coalson1").contains(ThreadAttributes.getUsername())
                && account.getActivationDate().plusDays(daysPastActivation).isBefore(LocalDate.now())) {
                invoiceInformation.setError("Cannot modify lease after " + daysPastActivation + " days from account activation date");
                return invoiceInformation;
            }
        }

        LeadStatus oldInternalStatus = losLead.getLeadInfo().getInternalStatus();
        MerchantInfo merchantInfo = invoiceInformation.getMerchantInfo();
        Boolean isSignedOrBeyond = losLead.isSignedOrBeyond();
        if (!isSignedOrBeyond) {
            losLead.getLeadInfo().setLeadStatus(null, LeadStatus.INVOICE_CREATED, "[SendInvoiceService][createOrUpdateInvoiceInformation] Invoice created");
        }

        List<ItemInfo> items = invoiceInformation.getItemInfoList() != null && !invoiceInformation.getItemInfoList().isEmpty() ? invoiceInformation.getItemInfoList()
            : invoiceInformation.getItems() != null && !invoiceInformation.getItems().isEmpty() ? invoiceInformation.getItems().stream().map(LosItem::getItemInfo).collect(Collectors.toList()) : new ArrayList<>();

        //Check if any purchase now, paid, or paid delivered items removed from invoice
        List<LosItem> oldPurchasedItems = itemService.getAllItemsForLeadWithInvoiceTypeAndStatus(losLead.getPk(), InvoiceType.PURCHASED, List.of(ItemStatus.PURCHASE_NOW, ItemStatus.PAID, ItemStatus.PAID_DELIVERED));
        boolean purchaseItemsChanged = false;
        Map<Long, ItemInfo> purchaseItemMap = null;
        boolean paidItemInInvoice = false;
        if(CollectionUtils.isNotEmpty(oldPurchasedItems)) {
            purchaseItemMap = oldPurchasedItems.stream().collect(Collectors.toMap(LosItem::getPk, LosItem::getItemInfo));
            for (ItemInfo item : items) {
                Long pk = item.getItemPk();
                if (purchaseItemMap.containsKey(pk)) {
                    item.setInvoiceType(InvoiceType.PURCHASED);
                    if (item.getStatus() != ItemStatus.CANCELLED && item.getStatus() != ItemStatus.RETURNED) {
                        item.setStatus(purchaseItemMap.get(pk).getStatus());
                        purchaseItemMap.remove(pk);
                    }
                    if (item.getStatus() == ItemStatus.PAID || item.getStatus() == ItemStatus.PAID_DELIVERED) {
                        paidItemInInvoice = true;
                    }
                }
            }
            purchaseItemsChanged = !purchaseItemMap.isEmpty();
        }

        //recalculate invoice information if have purchase items
        if (merchantInfo.getIsItemSplit()) {
            setInvoiceInformationForPurchase(invoiceInformation, items);
        }

        //merchandise and total invoice amount null check
        BigDecimal maxApprovalAmount = losLead.getLeadInfo().getMaxApprovalAmount();
        BigDecimal merchandiseAmount = invoiceInformation.getInvoiceInfo().getMerchandiseAmount();
        BigDecimal totalInvoiceAmount = invoiceInformation.getInvoiceInfo().getTotalInvoiceAmount();
        
        if(merchandiseAmount == null){
            merchandiseAmount = BigDecimal.ZERO;
        }
        if (totalInvoiceAmount == null) {
            totalInvoiceAmount = BigDecimal.ZERO;
        }
        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Given merchandiseAmount "+merchandiseAmount + ", totalInvoiceAmount " + totalInvoiceAmount);

        if (items.size() <= 1 && maxApprovalAmount.compareTo(totalInvoiceAmount) < 0) {
            invoiceInformation.setError("Cannot have invoice with only one item and the total invoice amount greater than the approval amount");
            return invoiceInformation;
        }

        LosInvoice losInvoice = losLead.getLosInvoice();
        Boolean areAllItemsCancelled = configurationManagement.getBoolean(configurationPath + "items.can.be.empty.for.merchant." + invoiceInformation.getMerchantInfo().getClientType(), false)
            ? (invoiceInformation.getInvoiceInfo().getTotalInvoiceAmount().compareTo(BigDecimal.ZERO) <= 0)
            : (items == null || items.isEmpty() || items.stream().allMatch(itemInfo -> itemInfo.getStatus() == ItemStatus.CANCELLED));
        BigDecimal oldMerchandiseAmount = losInvoice != null ? losInvoice.getInvoiceInfo().getMerchandiseAmount() : BigDecimal.ZERO;
        BigDecimal oldTotalInvoiceAmount = losInvoice != null ? losInvoice.getInvoiceInfo().getTotalInvoiceAmount() : BigDecimal.ZERO;
        BigDecimal oldPurchaseTotal = losInvoice != null ? losInvoice.getInvoiceInfo().getPurchaseTotal() : BigDecimal.ZERO;

        Boolean invoiceChanged = losInvoice != null && (oldMerchandiseAmount.compareTo(merchandiseAmount) != 0 || oldTotalInvoiceAmount.compareTo(totalInvoiceAmount) != 0);
        Boolean invoiceDecrease = invoiceChanged && losLead.isSignedOrBeyond() && (oldMerchandiseAmount.compareTo(merchandiseAmount) > 0 || oldTotalInvoiceAmount.compareTo(totalInvoiceAmount) > 0);
        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] invoiceChanged ? " + invoiceChanged
            + ", oldMerchandiseAmount " + oldMerchandiseAmount
            + ", newMerchandiseAmount " + merchandiseAmount
            + ", oldTotalInvoiceAmount" + oldTotalInvoiceAmount
            + ", newTotalInvoiceAmount" + totalInvoiceAmount
            + ", invoiceDecrease ? " + invoiceDecrease);

        if (invoiceChanged && paidItemInInvoice && maxApprovalAmount.compareTo(totalInvoiceAmount) < 0) {
            invoiceInformation.setError("Cannot modify invoice with PAID item(s) still in invoice and total invoice amount being greater than approval amount");
            return invoiceInformation;
        }
        else if (merchantInfo.getIsItemSplit() && maxApprovalAmount.compareTo(totalInvoiceAmount) < 0) {
            itemSplitService.getPurchaseNowItemList(items, totalInvoiceAmount, maxApprovalAmount);
            setInvoiceInformationForPurchase(invoiceInformation, items);
        }

        if (purchaseItemMap != null && CollectionUtils.isNotEmpty(purchaseItemMap.values())) {
            LosSchedSummary summary = schedSummaryService.getSchedSummaryByLead(losLead.getPk());
            BigDecimal totalPrice = purchaseItemMap.values().stream()
                .filter(it -> it.getStatus().equals(ItemStatus.PAID) || it.getStatus().equals(ItemStatus.PAID_DELIVERED))
                .map(it->it.getTotalPriceForItems().multiply(BigDecimal.ONE.add(summary.getSchedSummaryInfo().getTaxRate())).setScale(2, RoundingMode.HALF_EVEN))
                .reduce(BigDecimal.ZERO,BigDecimal::add);

            if (totalPrice.compareTo(BigDecimal.ZERO) > 0) {
                List<LosCreditCardTransaction> original = losCreditCardTransactionService.getByActionAndChargeTypeInStatus(losLead.getPk(), CCAction.SALE, ChargeType.PURCHASE, CCTransactionStatus.APPROVED);
                if (CollectionUtils.isEmpty(original)) {
                    original = losCreditCardTransactionService.getByActionAndChargeTypeInStatus(losLead.getPk(), CCAction.SALE, ChargeType.PURCHASE, CCTransactionStatus.PARTIALLY_REFUNDED);
                }

                if (CollectionUtils.isNotEmpty(original)) {
                    boolean refundFee = configurationManagement.getBoolean(configurationPath+"refundccfee", false);
                    CCTransactionInfo ccTransactionInfo = ccRunRefundService.refundCreditCardPayment(original.get(0).getPk(), refundFee, totalPrice,true);
                    if(ccTransactionInfo.getStatus() != CCTransactionStatus.APPROVED) {
                        invoiceInformation.setError("CC refund for itemSplit failed");
                        return invoiceInformation;
                    }
                    else {
                        loggingService.createActivityLog(losLead.getPk(), LogType.PAYMENT, Boolean.FALSE, null, String.format("PAID items are refunded successfully. Total : %s", totalPrice), ThreadAttributes.getUsername());
                    }
                    leadFundingService.updateFundingTransaction(invoiceInformation, InvoiceType.PURCHASED, totalPrice, items);
                } else {
                    invoiceInformation.setError("No CC payment available to refund");
                    return invoiceInformation;
                }
            }
        }

        if(losLead.isFundingorBeyond() && (areAllItemsCancelled || invoiceChanged)){
            leadFundingService.updateFundingTransaction(invoiceInformation, InvoiceType.LEASE, null);
        }
        if(areAllItemsCancelled) {
            updateLeadStatusService.updateLeadStatus(losLead, null, LeadStatus.INVOICE_CANCELLED, "[SendInvoiceService][createOrUpdateInvoiceInformation] Invoice cancelled, items empty", null, null);
            alertService.createOrUpdate(losLead.getPk(), "Invoice cancelled");
        }

        losInvoice = invoiceService.createOrUpdate(invoiceInformation.getInvoiceInfo());
        losLead = leadItemService.setItemsForLead(items, invoiceInformation.getInvoiceInfo().getLeadPk());

        List<LosItem> updatedItems = itemService.getAllItemsForLead(losLead.getPk());
        if (CollectionUtils.isNotEmpty(items) && CollectionUtils.isNotEmpty(updatedItems)) {
            invoiceInformation.setItemInfoList(updatedItems.stream().map(LosItem::getItemInfo).collect(Collectors.toList()));
        }

        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Created/Updated Invoice information. Number of items "+losInvoice.getInvoiceInfo().getTotalNumberOfItems()+". LeadStatus "+losLead.getLeadInfo().getLeadStatus());
        if (!losLead.isSignedOrBeyond() && configurationManagement.getBoolean(configurationPath + "set.program.for." + merchantInfo.getClientType().getClientName(), false)) {
            underwritingService.setMerchantProgramForLead(losLead);
        }

        LosContract leaseContract  = contractService.getLeaseContractForLead(losLead.getPk());
        Frequency selectedFrequency = invoiceInformation.getSelectedPaymentFrequency();
        boolean purchaseNowItemsInInvoice = items.stream().anyMatch(item -> item.getStatus().equals(ItemStatus.PURCHASE_NOW));
        if(losInvoice.getInvoiceInfo().getInvoiceStatus() != ItemStatus.CANCELLED) {
            log.debug("[SendInvoiceService][createOrUpdate] Call from merchant portal? {}", !invoiceInformation.getApiCall());

            LosSchedSummary losSchedSummary = schedSummaryService.getSchedSummaryByLead(losLead.getPk());
            if(configurationManagement.getBoolean(configurationPath+"set.selected.frequency.from.schedSummary", true) && selectedFrequency == null && losSchedSummary != null){
                selectedFrequency = losSchedSummary.getSchedSummaryInfo().getPaymentFrequency();
                losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Given frequency is null, set existing schedSummary frequency "+selectedFrequency);
            }
            CalculatorResults calculatorResults = createOrUpdateSchedSummary(losLead, selectedFrequency);
            invoiceInformation.setPaymentDetailsList(calculatorResults.getPaymentDetailsList());
            invoiceInformation.setProviderURL(calculatorResults.getRedirectUrl());
            if (selectedFrequency != null && losLead.isSignedOrBeyond()) {
                losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Creating receivables and sending contract");
                List<LosReceivable> receivables = receivableService.createReceivablesForLead(losLead.getLosSchedSummary());
                if(invoiceChanged) {
                    if (purchaseNowItemsInInvoice) {
                        LosContract losContract = sendContractService.createContractAndSend(losLead.getPk(), customerService.getPrimaryCustomer(losLead.getPk()).getPk(), EsignMode.EMBEDDED);
                        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Purchase items in lease. Sent Contract to customer. Contract EsignDocPk : " + losContract.getContractInfo().getEsignDocumentPk() + " LeaseType : " + losContract.getContractInfo().getContractType() + " and EsignMode : " + losContract.getContractInfo().getEsignMode());
                    } else {
                        LosContract losContract = sendContractService.createContractAndSend(losLead.getPk(), customerService.getPrimaryCustomer(losLead.getPk()).getPk(), null);
                        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Sent Contract to customer. Contract EsignDocPk : " + losContract.getContractInfo().getEsignDocumentPk() + " LeaseType : " + losContract.getContractInfo().getContractType() + " and EsignMode : " + losContract.getContractInfo().getEsignMode());
                    }
                } else {
                    losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] No invoice change. Not sending a contract");
                    if (configurationManagement.getBoolean(configurationPath + "update.invoice.history", true)) {
                        LosContract recentContract = contractService.getRecentLeaseOrLeaseModContractForLead(losLead.getPk());
                        if (recentContract != null && ((!isSignedOrBeyond && recentContract.getContractInfo().getContractStatus() != ContractStatus.SIGNED) || purchaseItemsChanged)) {
                            recentContract.getContractInfo().setInvoiceRecord(losInvoice.getInvoiceInfo());
                            recentContract.getContractInfo().setItemsRecord(items);
                            contractService.createOrUpdate(recentContract.getContractInfo());
                        }
                    }
                }

                boolean updateAccountOnIncrease = configurationManagement.getBoolean(configurationPath+"updateAccountOnIncrease", false);
                if((invoiceDecrease || updateAccountOnIncrease) && losLead.getLeadInfo().getAccountPk() != null && losLead.getLeadInfo().getAccountPk() > 0){
                    losToSvcImportService.updateAccountFromLead(losLead, isSignedOrBeyond ? false : true);
                    losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Updated account");
                }

                if(isSignedOrBeyond) {
                    LeadModificationsInfo info = new LeadModificationsInfo();
                    info.setModType(ModType.LEASE_MOD);
                    info.setAgentUsername(ThreadAttributes.getUsername());
                    info.setOldStatus(losLead.getLeadInfo().getLeadStatus());
                    info.setOldAmount(oldMerchandiseAmount);
                    info.setNewAmount(losInvoice.getInvoiceInfo().getTotalInvoiceAmount());
                    info.setLeadPk(losLead.getPk());
                    if (invoiceDecrease && !purchaseNowItemsInInvoice) {
                        String notes = "[SendInvoiceService][createOrUpdateInvoiceInformation] Merchant clientType : " + merchantInfo.getClientType() + " Invoice decrease. Set lead to " + LeadStatus.SIGNED;
                        losLead.getLeadInfo().setLeadStatus(LeadStatus.SIGNED, LeadStatus.SIGNED, notes);
                        esignService.updateLeadStatus(losLead);
                    } else if (invoiceChanged) {
                        validateUWStatus(losLead);
                        updateLeadStatusService.updateLeadStatus(losLead, LeadStatus.CONTRACT_CREATED, LeadStatus.CONTRACT_CREATED, "[SendInvoiceService][createOrUpdateInvoiceInformation] Invoice increase. Set lead to CONTRACT_CREATED", null, null);
                    }

                    if (purchaseNowItemsInInvoice && !invoiceInformation.getApiCall()) {
                        sendFinalizeEmailAndSmsToCustomer(losLead.getPk(), merchantInfo);
                    }

                    info.setNewStatus(losLead.getLeadInfo().getLeadStatus());
                    info.setOldInternalStatus(oldInternalStatus);
                    info.setNewInternalStatus(losLead.getLeadInfo().getInternalStatus());
                    info.setMerchantName(merchantInfo.getMerchantName());
                    info.setMerchantLocation(merchantInfo.getLocationName());
                    leadModificationsService.createLeadModInfo(info);
                }
            }
        }else{
            losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation] Order Cancelled. Cancelling contract and account if exists");
            if(leaseContract != null){
                if(leaseContract.getContractInfo().getContractStatus() != ContractStatus.SIGNED
                    || configurationManagement.getBoolean(configurationPath+"cancel.signed.document.when.invoice.cancelled", false))
                    esignService.cancelDocument(leaseContract.getContractInfo().getEsignDocumentPk());
                leaseContract.getContractInfo().setContractStatus(ContractStatus.CANCELLED);
                contractService.createOrUpdate(leaseContract.getContractInfo());
            }

            //cancel protection plan if exists
            cancelProtectionPlanService.cancelProtectionPlanAsync(losLead.getPk());
//            leadService.updateFundingTransaction(invoiceInformation);
            cancelAccountIfExists(losLead, invoiceInformation.getComment(),
                Boolean.TRUE.equals(invoiceInformation.getRefundPaymentsOnCancel()));
        }
        losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateInvoiceInformation]  End. LeadStatus : "+losLead.getLeadInfo().getLeadStatus());
        losLead = leadManagementService.createOrUpdateLead(losLead.getLeadInfo());
        invoiceInformation.setLead(losLead);
        return invoiceInformation;//getInvoiceInformation(invoiceInformation.getInvoiceInfo().getLeadPk());
    }

    private void cancelAccountIfExists(LosLead losLead, String comment, boolean refundPayments) {
        if(losLead.getLeadInfo().getAccountPk() != null && losLead.getLeadInfo().getAccountPk() > 0) {
            String finalComment = StringUtils.isNotBlank(comment)
                ? comment
                : "Invoice cancelled" + (refundPayments ? ", refunding payments per user request" : "");
            CancelAccountRequest cancelAccountRequest = new CancelAccountRequest(losLead, refundPayments, finalComment);
            cancelAccountService.cancelAccountForLead(cancelAccountRequest);

            svAlertService.createOrUpdate(losLead.getLeadInfo().getAccountPk(),
                "Account has been cancelled due to Invoice cancellation on lead " + losLead.getPk());
        }
    }

    private void validateUWStatus(LosLead lead) {
        if (configurationManagement.getBoolean(configurationPath + "validate.uw.for.invoice.information", true)) {
            lead.getLeadInfo().setNotes("[createOrUpdate InvoiceInformation][validateUWStatus]");
            LosUWData uwData = lead.getLosUWData();
            if(uwData == null || uwData.getUwInfo() == null || uwData.getUwInfo().getUwStatus() != UnderwritingStatus.APPROVED
                ||  uwData.getUwInfo().getApprovalAmount().compareTo(BigDecimal.ZERO) <= 0 || uwData.getUwInfo().getApprovalExpirationDate().compareTo(LocalDate.now()) < 0){
                throw new SvcException("Lead doesn't have UW approval");
            }
        }
    }

    public void setInvoiceInformationForPurchase(InvoiceInformation invoiceInformation, List<ItemInfo> items) {
        List<ItemInfo> purchasedNowOrPaidItems = items.stream()
            .filter(i-> i.getStatus().equals(ItemStatus.PURCHASE_NOW)
                || i.getStatus().equals(ItemStatus.PAID)
                || i.getStatus().equals(ItemStatus.PAID_DELIVERED))
            .collect(Collectors.toList());

        invoiceInformation.getInvoiceInfo().setPurchaseTotal(CollectionUtils.isEmpty(purchasedNowOrPaidItems)
            ? BigDecimal.ZERO
            : purchasedNowOrPaidItems.stream()
            .map(ItemInfo::getTotalPriceForItems)
            .reduce(BigDecimal.ZERO, BigDecimal::add));
        invoiceInformation.getInvoiceInfo().setMerchandiseAmount(items.stream()
            .filter(item -> item.getStatus() != ItemStatus.CANCELLED && item.getStatus() != ItemStatus.RETURNED)
            .map(ItemInfo::getTotalPriceForItems)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .subtract(invoiceInformation.getInvoiceInfo().getPurchaseTotal()));
        invoiceInformation.getInvoiceInfo().setTotalInvoiceAmount(invoiceInformation.getInvoiceInfo().getMerchandiseAmount()
            .add(invoiceInformation.getInvoiceInfo().getMiscellaneousFee())
            .add(invoiceInformation.getInvoiceInfo().getDeliveryFee())
            .add(invoiceInformation.getInvoiceInfo().getInstallationFee())
            .add(invoiceInformation.getInvoiceInfo().getTaxAmount())
            .subtract(invoiceInformation.getInvoiceInfo().getDepositAmount())
            .subtract(invoiceInformation.getInvoiceInfo().getDiscountAmount()));
    }

    public void sendFinalizeEmailAndSmsToCustomer(long leadPk, MerchantInfo merchantInfo) {
        LosLead lead = leadService.getByLeadPk(leadPk);
        String envName = System.getenv("ENVIRONMENT_NAME");
        String env = !StringUtils.isEmpty(envName) ? envName : "dev2";
        lead = leadShortCodeService.generateShortCodeForLeadIfMissing(lead);
        String redirectUrl = UrlBuilderUtils.buildCompleteUrl(merchantInfo.getClientType(), env, lead.getLeadInfo().getShortCode());
        log.debug("send email and text when invoice is created.");
        sendFinalizeService.sendFinalizeEmailToCustomer(leadPk, redirectUrl);
    }


    private CalculatorResults createOrUpdateSchedSummary(LosLead losLead, Frequency selectedFrequency) {
        if(losLead.getLosInvoice().getInvoiceInfo().getInvoiceStatus() != ItemStatus.CANCELLED) {
            log.info("Selected Payment Frequency : {}", selectedFrequency);
            List<Frequency> frequencyList = selectedFrequency != null ? List.of(selectedFrequency) : new ArrayList<>();
            CalculatorRequest calculatorRequest = new CalculatorRequest(losLead, frequencyList, null, null, null, null, null, null, null, null, 0, null, BigDecimal.ZERO, null);
            CalculatorResults calculatorResults = calculatorService.calculate(calculatorRequest);
            paymentOptionsService.removeByLeadPk(losLead.getPk());
            losLead.setLosPaymentOptions(new HashSet<>());
            calculatorResults.getSchedSummaryInfoList().forEach(paymentOptionsService::createOrUpdate);
            if (selectedFrequency != null) {
                LosSchedSummary schedSummary = calculatorService.createOrUpdateSchedSummary(calculatorResults);
                log.info("SchedSummary {}", schedSummary);
                losLead.getLeadInfo().setNotes("[SendInvoiceService][createOrUpdateSchedSummary] SchedSummary created for frequency : " + selectedFrequency);
            }
            return calculatorResults;
        }
        return null;
    }

}




src/main/java/com/uownleasing/svc/service/ApplicationService.java

package com.uownleasing.svc.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.uownleasing.common.enumeration.Frequency;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.common.pojo.CCInfo;
import com.uownleasing.common.pojo.CCTransactionInfo;
import com.uownleasing.common.pojo.InvoiceInfo;
import com.uownleasing.common.pojo.ItemInfo;
import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.los.common.db.entity.LosContract;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.db.entity.LosPaymentOptions;
import com.uownleasing.los.common.service.LosContractService;
import com.uownleasing.svc.common.db.entity.SvSqlConfig;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.repository.ApplicationRepo;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.application.*;
import com.uownleasing.svc.service.application.run.RunUwService;
import com.uownleasing.svc.uownClient.UownClient;
import com.uownleasing.svc.uownClient.UownClientRouter;
import com.uownleasing.uwengine.pojo.UwEngineInfo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Validated
@Slf4j
public class ApplicationService {

    private final LeadService leadService;

    private final LeadShortCodeService leadShortCodeService;

    private final MerchantService merchantService;

    private final UownClientRouter clientRouter;

    private final ApplicationRepo  applicationRepo;

    private final EsignService esignService;

    private final LosContractService contractService;

    private final CalculatorService calculatorService;

    private final EntityManager entityManager;

    private final SvSqlConfigService svSqlConfigService;

    private final ApprovalEmailService approvalEmailService;

    private final ObjectMapper mapper;

    private final ItemSplitService itemSplitService;

    private final ConfigurationManagement configurationManagement;

    private final SendApplicationService sendApplicationService;

    private final SendInvoiceService sendInvoiceService;

    private final RunUwService runUwService;

    private final GetSendApplicationService getSendApplicationService;

    private final GetApplicationStatusService applicationStatusService;

    private final CCCheckService ccLastNameMatchService;

    private final SubmitApplicationService submitApplicationService;

    private final GenerateContractService generateContractService;

    private final MissingRequiredFieldsService missingRequiredFieldsService;

    private final UpdateLeadStatusService updateLeadStatusService;

    private final String configurationPath = "com.uownleasing.svc.service.ApplicationService";

    public ApplicationResponse createApplication(ApplicationRequest applicationRequest){
       return  sendApplicationService.createApplication(applicationRequest);
    }

    public UwEngineInfo runUwEngineOnExistingLead(long leadPk, String uwSteps) {
        ApplicationRequest request = applicationRepo.getApplicationRequestFromLead(leadPk);
        if (request == null) {
            throw new SvcException("Unable to find previous application for lead");
        }
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        LosLead lead = leadService.getByLeadPk(leadPk);
        request.setMerchant(merchant);
        request.setLead(lead);

        UwEngineConfigs configs = new UwEngineConfigs();
        configs.setSteps(uwSteps);

        return runUwService.runUwEngine(request, configs);
    }

    public AuthorizationResponse createInvoice(AuthorizationRequest  authRequest){
        return  sendInvoiceService.createInvoiceRequest(authRequest);
    }

    public RequiredFields getMissingRequiredFields(String uuid, String shortCode, Frequency selectedPaymentFrequency){
        LosLead lead = null;

        if (StringUtils.isNotBlank(uuid)) {
            lead = leadService.getByLeadUuidAndId(uuid);
        } else {
            var leads = leadShortCodeService.getByLeadShortCode(shortCode);
            var validLead = leads
                .stream()
                .filter(
                    l -> l.getLeadInfo().getLeadStatus() == LeadStatus.CONTRACT_CREATED
                        || l.getLeadInfo().getLeadStatus() == LeadStatus.UW_APPROVED
                ).findFirst();
            if (validLead.isPresent()) {
                lead = validLead.get();
            }
        }

        if(lead == null){
            throw new SvcException("Invalid link. Please contact merchant");
        }

        return missingRequiredFieldsService.getMissingRequiredFields(lead, selectedPaymentFrequency, shortCode);
    }

    public EsignFields getEsignFields(String uuid, String shortCode) {
        LosLead lead;

        if (StringUtils.isNotBlank(uuid)) {
            lead = leadService.getByLeadUuidAndId(uuid);
        } else {
            lead = leadShortCodeService.getByLeadShortCodeAndStatus(shortCode, LeadStatus.UW_APPROVED);
        }

        if(lead == null){
            throw new SvcException("Invalid link. Please contact merchant");
        }
        return  clientRouter.getUownClient(merchantService.getMerchantByLeadPk(lead.getPk())).getEsignFields(lead);
    }

    public CCTransactionInfo authorizeCreditCard(CCInfo ccInfo ){
        LosLead lead = leadService.getByLeadPk(ccInfo.getLeadPk());
        if(lead == null){
            return null;
        }
        UownClient uownClient =  clientRouter.getUownClient(merchantService.getMerchantByLeadPk(lead.getPk()));

        CCTransactionInfo binMatchResult = uownClient.validateCreditCardBinMatch(ccInfo, lead);
        if (binMatchResult != null) {
            String leadBin = lead.getLeadInfo().getCreditCardBin();
            String ccBin = ccInfo.getCcNumber() != null && ccInfo.getCcNumber().length() >= 6 
                ? ccInfo.getCcNumber().substring(0, 6) : "";
            String logMessage = "CCBin in application " + leadBin + " does not match cc bin on submit " + ccBin;
            updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.CC_BIN_MISMATCH, 
                "[ApplicationService][authorizeCreditCard] " + logMessage, logMessage, LogType.INTERNAL);
            return binMatchResult;
        }

        if(!ccLastNameMatchService.checkCCLastNameMatch(ccInfo, lead)) {
            return uownClient.declineCreditCard(ccInfo);
        }
        return  uownClient.authorizeCreditCard(ccInfo);
    }

    public SubmitApplicationResponse submitApplication(SubmitApplicationRequest  request) {
        LosLead lead = leadService.getByLeadPk(request.getLeadPk());
        if(lead == null){
            return null;
        }
        return  submitApplicationService.submitApplication(request);
    }

    public GenerateContractResponse generateEsignContract(GenerateContractRequest request) {
        LosLead lead = leadService.getByLeadPk(request.getLeadPk());
        if(lead == null){
            return null;
        }
        return  generateContractService.generateEsignContract(request);
    }

    public ApplicationSettleResponse settleApplication(ApplicationSettleRequest  request) {
        return  clientRouter.getUownClient(request.getMerchant()).settleApplication(request);
    }

    public ApplicationStatusResponse getApplicationStatus(ApplicationStatusRequest request) {
        return applicationStatusService.getApplicationStatus(request);
    }

    public String createApplication(@Valid String request) {
        String refCode = StringUtils.substringBetween(request,"<merchantNumber>", "</merchantNumber>");
        log.info("RefCode {}", refCode);
        return  clientRouter.getUownClient(merchantService.getMerchantByMerchantCode(refCode)).createApplication(request);
    }

    public String createInvoiceRequest(@Valid String request) {
        String refCode = StringUtils.substringBetween(request,"<merchantNumber>", "</merchantNumber>");
        log.info("RefCode {}", refCode);
        return  clientRouter.getUownClient(merchantService.getMerchantByMerchantCode(refCode)).createInvoiceRequest(request);
    }

    public String createAdjustmentRequest(String request) {
        String refCode = StringUtils.substringBetween(request,"<merchantNumber>", "</merchantNumber>");
        log.info("RefCode {}", refCode);
        return  clientRouter.getUownClient(merchantService.getMerchantByMerchantCode(refCode)).createAdjustmentRequest(request);
    }

    public LeadSearchResults getLeadsInDateRange(LeadFilters filters){
        log.info("[getLeadsInDateRange] from {}, to {}", filters.getFrom(), filters.getTo());
        LeadSearchResults results = new LeadSearchResults();

        filters = filters.sanitize();
        SvSqlConfig sqlConfig = svSqlConfigService.getSqlConfigBySqlName("getLeadSummaryResults");
        String sql = sqlConfig.getSqlConfigInfo().getSqlQuery()
            .replaceAll("(?i):merchantRefCodes", CollectionUtils.isEmpty(ThreadAttributes.getMerchantReferenceCodes()) ? "null" : "'" + StringUtils.join(com.uownleasing.svc.config.ThreadAttributes.getMerchantReferenceCodes(), ",") + "'")
            .replaceAll("(?i):returnAll", String.valueOf(filters.getFrom() == null || filters.getTo() == null))
            .replaceAll("(?i):returnNonCancelledOnly", String.valueOf(configurationManagement.getBoolean(configurationPath+"return.non.cancelled.only", false)))
            .replaceAll("(?i):fromTime", filters.getFrom() == null || filters.getTo() == null ? "null" : "'" + filters.getFrom() + "'")
            .replaceAll("(?i):toTime", filters.getFrom() == null || filters.getTo() == null ? "null" : "'" + filters.getTo() + "'")
            .replaceAll("(?i):status", filters.getStatus() == null ? "null" : "'" + filters.getStatus().name() + "'")
            .replaceAll("(?i):merchantNames", CollectionUtils.isEmpty(filters.getMerchants()) ? "(null)" : ("('" + StringUtils.join(filters.getMerchants(), "','") + "')"))
            .replaceAll("(?i):location", CollectionUtils.isEmpty(filters.getLocations()) ? "(null)" : ("('" + StringUtils.join(filters.getLocations(), "','") + "')"))
            .replaceAll("(?i):merchantSupport", StringUtils.isBlank(filters.getMerchantSupport()) ? "null" : "'%" + filters.getMerchantSupport().toLowerCase().trim().replace("'", "''") + "%'")
            .replaceAll("(?i):search", StringUtils.isBlank(filters.getSearch()) ? "null" : "'%" + filters.getSearch().toLowerCase().trim() + "%'")
            .replaceAll("(?i):clientTypes", CollectionUtils.isEmpty(filters.getClientTypes()) ? "null" : ("'" + StringUtils.join(filters.getClientTypes(), ",") + "'"))
            .replaceAll("(?i):internalStatus", filters.getInternalStatus() == null ? "null" : "'" + filters.getInternalStatus() + "'")
            .replaceAll("(?i):offset", filters.getPageNumber() == null || filters.getMaxResults() == null ? "null" : String.valueOf(filters.getPageNumber() * filters.getMaxResults()))
            .replaceAll("(?i):limit", filters.getPageNumber() == null || filters.getMaxResults() == null ? "null" : filters.getMaxResults().toString());

        Query query = entityManager.createNativeQuery(sql);
        NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
        nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        List<Map<String, Object>> result = nativeQuery.getResultList();
        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModule(new Jdk8Module());
        List<LeadSummary> summaries = result.stream()
            .map(o -> {
                try {
                    return
                        mapper.readValue(mapper.writeValueAsString(o), LeadSummary.class);
                } catch (Exception e) {
                    log.info("Error message ", e);
                }
                return null;
            }).collect(Collectors.toList());

        results.setLeads(summaries);
        results.setTotalCount(CollectionUtils.isEmpty(summaries) ? 0 : summaries.get(0).getTotal());
        results.setMoreResults(!CollectionUtils.isEmpty(summaries)
            && filters.getPageNumber() != null && filters.getMaxResults() != null
            && (long) filters.getPageNumber() * filters.getMaxResults() + filters.getMaxResults() < summaries.get(0).getTotal());

        return results;
    }

    public List<LosContract> getDocumentStatus(long leadPk) {
        List<LosContract> retList = new ArrayList<>();
        List<LosContract> contracts = contractService.getAllContractsForLead(leadPk);
        if(contracts != null && ! contracts.isEmpty()){
            for (LosContract contract : contracts) {
                EsignStatusResult esignStatusResult = esignService.getEsignStatus(contract.getContractInfo().getEsignDocumentPk());
                contract.getContractInfo().setContractStatus(esignService.getContractStatusFromEsignStatus(esignStatusResult.getEsignStatus()));
                retList.add(contractService.createOrUpdate(contract.getContractInfo()));
            }
        }
        return retList;
    }

    public String getApplicationStatus(String request) {
        String refCode = StringUtils.substringBetween(request,"<merchantNumber>", "</merchantNumber>");
        log.info("RefCode {}", refCode);
        return  clientRouter.getUownClient(merchantService.getMerchantByMerchantCode(refCode)).getApplicationStatus(request);
    }

    public String settleApplication(String request) {
        String refCode = StringUtils.substringBetween(request,"<merchantNumber>", "</merchantNumber>");
        log.info("RefCode {}", refCode);
        return  clientRouter.getUownClient(merchantService.getMerchantByMerchantCode(refCode)).settleApplication(request);
    }

    public CalculatorResults getCalculatorResults(CalculatorRequest calculatorRequest) {
        if(StringUtils.isBlank(calculatorRequest.getMerchantRefCode()) && !SystemConfigurationManagement.isProduction()){
            calculatorRequest.setMerchantRefCode("OL90294-0001");
        }
        return calculatorService.calculate(calculatorRequest);
    }

    public ApplicationSettleResponse settleApplication(InvoiceInformation invoiceInformation) {
        if(invoiceInformation == null || invoiceInformation.getInvoiceInfo() == null){
            throw new SvcException("Invoice information is missing");
        }
        InvoiceInfo invoiceInfo = invoiceInformation.getInvoiceInfo();
        Merchant merchant = merchantService.getMerchantByLeadPk(invoiceInfo.getLeadPk());
        ApplicationSettleRequest request = new ApplicationSettleRequest();
//        request.setUserName(merchant.getMerchantInfo().getUsername());
//        request.setPassword(merchant.getMerchantInfo().getApiKey());
//        request.setMerchantId(merchant.getMerchantInfo().getRefMerchantCode());
//        request.setAccountNumber(lead.getLeadInfo().getUuid());
        request.setInvoiceInformation(invoiceInformation);
        request.setFundingBankData(invoiceInformation.getFundingBankData());
        return clientRouter.getUownClient(merchant).settleApplication(request);
    }

    public void sendApprovalEmail(long leadPk){
        LosLead lead = leadService.getByLeadPk(leadPk);
        approvalEmailService.sendApprovalEmail(lead);
    }

    public void sendDeclineEmail(long leadPk){
        LosLead lead = leadService.getByLeadPk(leadPk);
        approvalEmailService.sendDeclineEmail(lead);
    }

    public void sendActivationEmail(long leadPk){
        LosLead lead = leadService.getByLeadPk(leadPk);
        clientRouter.getUownClient(merchantService.getMerchantByLeadPk(leadPk)).sendActivationEmail(lead);
    }

    public List<LosPaymentOptions> getPaymentOptionsForLead(long leadPk) {
        return clientRouter.getUownClient(merchantService.getMerchantByLeadPk(leadPk)).getPaymentOptionsForLead(leadPk);
    }

    public String sendApplicationToCustomer(SendApplicationPojo sendApplicationPojo){
        Merchant merchant = merchantService.getActiveMerchantByMerchantCode(sendApplicationPojo.getRefMerchantCode());
        if (merchant == null)
            throw new SvcException("No active merchant with the refMerchantCode " + sendApplicationPojo.getRefMerchantCode());
        return getSendApplicationService.sendApplicationToCustomer(sendApplicationPojo);
    }

    public List<SendApplicationPojo> getSendApplicationRequests(String refMerchantCodes) {
        return getSendApplicationService.getSendApplicationRequests(refMerchantCodes);
    }

    public SendApplicationResults getSendApplicationRequestsByCriteria(GetSendAppRequests request) {
        return getSendApplicationService.getSendApplicationRequestsByCriteria(request);
    }

    public MerchantSearchResults getMerchantSearchResult(MerchantSearchFilter filter){
        return merchantService.getMerchantsByCriteria(filter);
    }

    public List<ItemInfo> getCustomerPaymentSummary(Long leadPk) {
        return itemSplitService.getCustomerPaymentSummary(leadPk);
    }
}




src/main/java/com/uownleasing/svc/service/ApprovalSmsService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.dms.common.db.entity.SmsQueue;
import com.uownleasing.dms.common.enumeration.QueueStatus;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.service.LosLoggingService;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.enumeration.ClientType;
import com.uownleasing.svc.enumeration.MerchantType;
import com.uownleasing.svc.utility.SmsMessageBuilder;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.concurrent.CompletableFuture;

@Transactional
@Service
@AllArgsConstructor
@Slf4j
public class ApprovalSmsService {

    private final MerchantService merchantService;

    private final SmsService smsService;

    private final LosLoggingService loggingService;

    private final ConfigurationManagement configurationManagement;

    private final String configurationPath = "com.uownleasing.svc.service.ApprovalSmsService.";


    public void sendApprovalSms(LosLead lead, String phoneNumber, BigDecimal creditLimit) {
        sendApprovalSms(lead, phoneNumber, creditLimit, null, false);
    }

    public void sendApprovalSms(LosLead lead, String phoneNumber, BigDecimal creditLimit, String merchants, boolean useAsync) {
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        ClientType clientType = merchant.getMerchantInfo().getClientType();
        boolean merchantIsNotExcluded =
            StringUtils.isBlank(merchants)
                || !merchants.contains(clientType.name());
        if (merchantIsNotExcluded) {
            if (useAsync) {
                try {
                    Thread.sleep(configurationManagement.getLong(configurationPath + "sleep.before.sending.approval", 1000L));
                } catch (Exception e) {
                    log.error("Error sleeping before send approval email async", e);
                }
                sendApprovalSmsForLeadAsync(lead, phoneNumber, creditLimit, clientType);
            }
            else {
                sendApprovalSmsForLead(lead, phoneNumber, creditLimit, clientType);
            }
        }
    }

    private void sendApprovalSmsForLeadAsync(LosLead lead, String phoneNumber, BigDecimal creditLimit, ClientType clientType) {
        CompletableFuture.runAsync(() -> sendApprovalSmsForLead(lead, phoneNumber, creditLimit, clientType))
            .exceptionally(e -> {
                log.error("Error sending approval email async", e);
                return null;
            });
    }

    private void sendApprovalSmsForLead(
        LosLead lead,
        String phoneNumber,
        BigDecimal creditLimit,
        ClientType clientType
    ) {
        SmsQueue sms = createSmsQueue(lead, phoneNumber);
        String message = SmsMessageBuilder.buildApprovalMessage(clientType, creditLimit);
        sms.setSmsBody(message);
        smsService.sendText(sms);
        logSmsResult(lead, phoneNumber, sms);
    }

    private SmsQueue createSmsQueue(LosLead lead, String phoneNumber) {
        SmsQueue sms = new SmsQueue();
        sms.setLeadPk(lead.getPk());
        sms.setTemplateName("ApprovalSms");
        sms.setAccountPk(lead.getLeadInfo().getAccountPk());
        sms.setToPhoneNumber(phoneNumber);
        return sms;
    }

    private void logSmsResult(LosLead lead, String phoneNumber, SmsQueue sms) {
        String activityMessage;

        if (sms.getStatus() == QueueStatus.ERROR) {
            activityMessage = buildErrorLogMessage(phoneNumber, sms);
        } else {
            activityMessage = "Approval text message sent to " + phoneNumber;
        }

        loggingService.createActivityLog(
            lead.getPk(),
            LogType.CORRESPONDENCE,
            false,
            null,
            activityMessage,
            ""
        );
    }

    private String buildErrorLogMessage(String phoneNumber, SmsQueue sms) {
        if ("Attempt to send to unsubscribed recipient".equals(sms.getErrorDesc())) {
            return "Unable to send approval text message to " + phoneNumber +
                " because customer has unsubscribed from text messages";
        }

        return "Unable to send approval text message to " + phoneNumber +
            " for reason: " + sms.getErrorDesc();
    }
}




src/main/java/com/uownleasing/svc/service/CalculatorService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.Frequency;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LendingCategoryType;
import com.uownleasing.common.pojo.AddressInfo;
import com.uownleasing.common.pojo.CustomerInfo;
import com.uownleasing.common.pojo.InvoiceInfo;
import com.uownleasing.common.pojo.SchedSummaryInfo;
import com.uownleasing.common.service.ConfigurationManagementService;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.LosAddressService;
import com.uownleasing.los.common.service.LosCustomerService;
import com.uownleasing.los.common.service.LosEmploymentService;
import com.uownleasing.los.common.service.LosSchedSummaryService;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.entity.SvInvoice;
import com.uownleasing.svc.common.service.AddressService;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.entity.MerchantProgram;
import com.uownleasing.svc.db.entity.StateConfigurations;
import com.uownleasing.svc.enumeration.MerchantType;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.MerchantInfo;
import com.uownleasing.svc.pojo.ProgramInfo;
import com.uownleasing.svc.pojo.rest.CalculatorRequest;
import com.uownleasing.svc.pojo.rest.CalculatorResults;
import com.uownleasing.svc.service.application.LeadShortCodeService;
import com.uownleasing.svc.service.calculator.CalculationContext;
import com.uownleasing.svc.service.calculator.ContextBuildResult;
import com.uownleasing.svc.service.calculator.ScheduleCalculationParams;
import com.uownleasing.svc.service.tax.TaxService;
import com.uownleasing.svc.utility.DateUtils;
import com.uownleasing.svc.utility.UrlBuilderUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CalculatorService {

    private final ConfigurationManagement configurationManagement;

    private final TaxService taxService;

    private final MerchantService merchantService;

    private final MerchantToProgramService merchantToProgramService;

    private final MerchantProgramService merchantProgramService;

    private final LeadShortCodeService leadShortCodeService;

    private final StateConfigurationsService stateConfigService;

    private final LosAddressService addressService;

    private final LosCustomerService customerService;

    private final LosEmploymentService employmentService;

    private final UnderwritingService underwritingService;

    private final SvCustomerService svCustomerService;

    private final AddressService svAddressService;

    private final LosSchedSummaryService schedSummaryService;

    private final ConfigurationManagementService configurationManagementService;

    protected String configurationPath = "com.uownleasing.svc.service.CalculatorService.";

    public CalculatorResults calculate(CalculatorRequest request) {
        CalculatorResults result = new CalculatorResults();

        if (request.getSvAccount() != null) {
            return calculateForAccount(request);
        }

        log.info("[CalculatorService][calculate] Lead {}", request.getLead().getPk());

        ContextBuildResult ctxResult = buildContext(request);

        if (ctxResult instanceof ContextBuildResult.Error error) {
            return new CalculatorResults(error.message());
        }

        if (ctxResult instanceof ContextBuildResult.Redirect redirect) {
            result.setRedirectUrl(redirect.redirectUrl());
            return result;
        }

        CalculationContext ctx = ((ContextBuildResult.Success) ctxResult).context();
        result.setMerchant(ctx.merchant());
        result.setLead(ctx.lead());
        LosUWData uwData = underwritingService.getUWDataForLead(ctx.lead().getPk());
        result.setLosUWData(uwData);

        List<MerchantProgram> programs = getProgramsForLead(ctx.lead(), ctx.state(), ctx.merchant());
        log.info("[CalculatorService][getProgramsForLead] lead {}, Programs exist? {}", request.getLead().getPk(), !programs.isEmpty());
        if (programs.isEmpty()) {
            return new CalculatorResults("No active merchant program for lead "
                    + ctx.lead().getPk()
                    + " in state "
                    + ctx.state()
            );
        }

        for (MerchantProgram program : programs) {
            calculateForProgram(ctx, program, request, result);
        }

        return result;
    }

    private ContextBuildResult buildContext(CalculatorRequest request) {
        LosLead lead = request.getLead();
        if (lead == null) {
            return new ContextBuildResult.Error("No lead provided");
        }

        LosInvoice invoice = lead.getLosInvoice();
        if (invoice == null) {
            return new ContextBuildResult.Error("No invoice found for lead " + lead.getPk());
        }

        var customer = customerService.getPrimaryCustomer(lead.getPk());
        if (customer == null || customer.getCustomerInfo() == null) {
            return new ContextBuildResult.Error("Customer information missing");
        }

        var address =
            addressService.getHomeAddressForCustomer(customer.getCustomerInfo().getCustomerPk());
        if (address == null || address.getAddressInfo() == null) {
            return new ContextBuildResult.Error("Address information missing");
        }
        LocalDate nextPayDate = resolveNextPayDate(request, customer.getCustomerInfo());
        Frequency payFrequency = resolvePayFrequency(request, customer.getCustomerInfo());
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());

        if (nextPayDate == null) {
            String redirectUrl = buildBaseRedirectUrl(lead, merchant);
            return new ContextBuildResult.Redirect(redirectUrl);
        }

        return new ContextBuildResult.Success(
            new CalculationContext(
                lead,
                invoice.getInvoiceInfo(),
                merchant,
                address.getAddressInfo().getState(),
                address.getAddressInfo().getZipCode9(),
                address.getAddressInfo(),
                nextPayDate,
                payFrequency
            )
        );
    }


    private void calculateForProgram(
        CalculationContext ctx,
        MerchantProgram program,
        CalculatorRequest request,
        CalculatorResults result) {
        Merchant merchant = ctx.merchant();
        List<Frequency> frequencies = resolveFrequencies(program, merchant, request);

        BigDecimal baseCost = getBaseCost(ctx.invoiceInfo());
        BigDecimal taxRate = resolveTaxRate(ctx, result);
        log.info("[CalculatorService][calculateForProgram] lead {}, baseCost {}, taxRate {}", request.getLead().getPk(), baseCost, taxRate);
        if (taxRate == null) return;

        MerchantInfo merchantInfo = merchant.getMerchantInfo();
        ProgramInfo programInfo = program.getProgramInfo();
        int termMonths = program.getProgramInfo().getTermMonths();
        BigDecimal moneyFactor = program.getProgramInfo().getMoneyFactor();
        BigDecimal contractAmountBeforeTax = baseCost.multiply(moneyFactor)
            .multiply(BigDecimal.valueOf(termMonths))
            .setScale(4, RoundingMode.HALF_EVEN);

        BigDecimal processingFee = getProcessingFeeForLead(ctx.lead());
        BigDecimal companyDiscount = request.getCompanyDiscount() != null ? request.getCompanyDiscount() : BigDecimal.ZERO;

        BigDecimal contractTax = contractAmountBeforeTax.multiply(taxRate)
            .setScale(6, RoundingMode.HALF_EVEN);

        BigDecimal contractAmountAfterTax = contractAmountBeforeTax
            .add(contractTax)
            .add(processingFee)
            .subtract(companyDiscount)
            .setScale(2, RoundingMode.HALF_EVEN);

        BigDecimal securityDeposit = getSecurityDepositForLead(ctx.lead());
        BigDecimal minLastPaymentAmount = resolveMinLastPayment(ctx.state(), baseCost);

        BigDecimal merchantDiscountRate = programInfo.getDealerDiscount() != null
            && programInfo.getDealerDiscount().compareTo(BigDecimal.ZERO) > 0
            ? programInfo.getDealerDiscount() : merchant.getMerchantInfo().getDealerDiscountOverride();
        BigDecimal platformFeeRate = merchantInfo.getPlatformFee();
        BigDecimal merchantRebateRate = merchantInfo.getDealerRebateOverride();

        merchantDiscountRate = merchantDiscountRate == null ? BigDecimal.ZERO : merchantDiscountRate;
        merchantRebateRate = merchantRebateRate == null ? BigDecimal.ZERO : merchantRebateRate;
        platformFeeRate = platformFeeRate == null ? BigDecimal.ZERO : platformFeeRate;
        BigDecimal merchantDiscountAmount = baseCost.multiply(merchantDiscountRate).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal platformFeeAmount = baseCost.multiply(platformFeeRate).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal merchantRebateAmount = baseCost.multiply(merchantRebateRate).setScale(2, RoundingMode.HALF_EVEN);

        BigDecimal recycleFee = BigDecimal.ZERO;
        int totalNumOfItems = ctx.invoiceInfo().getTotalNumberOfItems();
        BigDecimal buyOutFee = ctx.merchant().getMerchantInfo().getBuyoutFee();
        BigDecimal signingFee = getFeeToBeChargedForLead(ctx.lead());
        BigDecimal amountChargedAtSigning = programInfo.getAmountChargedAtSigning() != null
            ? programInfo.getAmountChargedAtSigning()
            : BigDecimal.ZERO;
        LocalDate firstPaymentDate = request.getFirstPaymentDate() != null
            ? request.getFirstPaymentDate()
            : getFirstPaymentDate(ctx.payFrequency(), ctx.nextPayDate());
        String redirectUrl = buildBaseRedirectUrl(ctx.lead(), ctx.merchant());

        ScheduleCalculationParams params = new ScheduleCalculationParams(
            ctx,
            request,
            contractAmountBeforeTax,
            contractAmountAfterTax,
            processingFee,
            companyDiscount,
            securityDeposit,
            minLastPaymentAmount,
            taxRate,
            merchantDiscountAmount,
            merchantDiscountRate,
            platformFeeAmount,
            platformFeeRate,
            merchantRebateAmount,
            merchantRebateRate,
            recycleFee,
            totalNumOfItems,
            buyOutFee,
            signingFee,
            amountChargedAtSigning,
            firstPaymentDate,
            termMonths,
            redirectUrl,
            moneyFactor,
            baseCost,
            programInfo.getEpoFeePercent(),
            programInfo.getEpoDays()
        );

        for (Frequency frequency : frequencies) {
            SchedSummaryInfo schedSummaryInfo = buildScheduleForFrequency(params, frequency);
            result.getSchedSummaryInfoList().add(schedSummaryInfo);
        }
    }

    private List<Frequency> resolveFrequencies(
        MerchantProgram program,
        Merchant merchant,
        CalculatorRequest request) {
        if (!CollectionUtils.isEmpty(request.getPaymentFrequencyList())) {
            return request.getPaymentFrequencyList();
        }

        String allowed =
            StringUtils.defaultIfBlank(
                program.getProgramInfo().getAllowedFrequencyOverride(),
                merchant.getMerchantInfo().getAllowedFrequencies()
            );

        if (StringUtils.isBlank(allowed)) {
            return List.of(
                Frequency.WEEKLY,
                Frequency.BI_WEEKLY,
                Frequency.SEMI_MONTHLY,
                Frequency.MONTHLY
            );
        }

        return Arrays.stream(allowed.split(","))
            .map(String::trim)
            .map(Frequency::valueOf)
            .toList();
    }

    private BigDecimal resolveTaxRate(
        CalculationContext ctx,
        CalculatorResults result) {
        try {
            return taxService
                .getTaxForZip(
                    ctx.lead().getPk(),
                    null,
                    ctx.address().getStreetAddress1(),
                    ctx.address().getCity(),
                    ctx.state(),
                    ctx.zipCode(),
                    null,
                    ctx.merchant().getMerchantInfo().getRefMerchantCode()
                )
                .setScale(6, RoundingMode.HALF_EVEN);

        } catch (Exception e) {
            log.error("[CalculatorService][calculate] Tax lookup failed", e);
            result.setIsError(true);
            result.setErrorMessage("Unable to retrieve tax for lead " + ctx.lead().getPk());
            return null;
        }
    }
    private LocalDate resolveNextPayDate(CalculatorRequest request, CustomerInfo customerInfo) {
        if (request.getNextPayDate() != null) {
            return request.getNextPayDate();
        }
        LosEmployment employment =
            employmentService.getPrimaryEmploymentByCustomerPK(customerInfo.getCustomerPk());
        return employment != null
            ? employment.getEmploymentInfo().getNextPayDate()
            : null;
    }

    private Frequency resolvePayFrequency(CalculatorRequest request, CustomerInfo customerInfo) {
        if (request.getPayFrequency() != null) {
            return request.getPayFrequency();
        }
        LosEmployment employment =
            employmentService.getPrimaryEmploymentByCustomerPK(customerInfo.getCustomerPk());

        return employment != null
            ? employment.getEmploymentInfo().getPayFrequency()
            : null;
    }


    private String buildBaseRedirectUrl(
        LosLead lead,
        Merchant merchant
    ) {
        String env = System.getenv("ENVIRONMENT_NAME");

        boolean returnFinalizeUrl =
            env != null
                && configurationManagement
                .getString(configurationPath + "return.finalize.url.for.merchants", "SYNCHRONY")
                .contains(merchant.getMerchantInfo().getClientType().toString())
                && lead.getLeadInfo().getInternalStatus() == LeadStatus.UW_APPROVED;

        lead = leadShortCodeService.refreshAndSaveShortCode(lead);
        long leadPk = lead.getPk();
        String shortCode = lead.getLeadInfo().getShortCode();

        log.info("[CalculatorService][buildRedirectUrl] lead {}, shortCode {}, returnFinalizeUrl {}", leadPk, shortCode, returnFinalizeUrl);

        String finalizeUrl = UrlBuilderUtils.buildFinalizeUrl(
            merchant.getMerchantInfo().getClientType(),
            env,shortCode

        );
        String completeUrl = UrlBuilderUtils.buildCompleteUrl(
            merchant.getMerchantInfo().getClientType(),
            env,
            shortCode
        );

        String baseUrl = returnFinalizeUrl ? finalizeUrl : completeUrl;
        log.info("[CalculatorService][buildRedirectUrl] lead {}, baseUrl {}", leadPk, baseUrl);

        return baseUrl + "?selectedPaymentFrequency=";
    }


    private SchedSummaryInfo buildScheduleForFrequency(ScheduleCalculationParams params, Frequency frequency) {
        SchedSummaryInfo sched = new SchedSummaryInfo();

        // --- Basic info ---
        sched.setLeadPk(params.ctx().lead().getPk());
        sched.setShortCode(params.ctx().lead().getLeadInfo().getShortCode());
        sched.setPaymentFrequency(frequency);
        sched.setTermInMonths(params.termMonths());
        sched.setMoneyFactor(params.moneyFactor().multiply(BigDecimal.valueOf(params.termMonths())).setScale(4, RoundingMode.HALF_EVEN));
        sched.setCostWithoutTaxAndFees(params.baseCost());
        sched.setCostWithFeesNoTax(params.baseCost().add(params.processingFee()));

        // --- Number of payments ---
        Integer numOfPayments = configurationManagement.getInteger(
            configurationPath + "numOfPayments." + params.termMonths() + "." + frequency
        );
        if (numOfPayments == null) {
            numOfPayments = getNumberOfPayments(params.termMonths(), frequency);
        }
        BigDecimal numberOfPaymentsBD = BigDecimal.valueOf(numOfPayments);
        sched.setTotalNumberOfPayments(numOfPayments);

        // --- Regular payment calculations ---
        BigDecimal regularPaymentNoTax = params.minLastPaymentAmount() == null
            ? params.contractAmountBeforeTax().divide(numberOfPaymentsBD, 4, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN)
            : params.contractAmountBeforeTax().subtract(params.minLastPaymentAmount())
            .divide(new BigDecimal(numOfPayments - 1), 2, RoundingMode.HALF_EVEN);
        sched.setFirstPaymentNoTaxNoFees(regularPaymentNoTax);
        sched.setNextPaymentNoTaxNoFees(regularPaymentNoTax);
        sched.setLastPaymentNoTaxNoFees(params.minLastPaymentAmount() == null ? regularPaymentNoTax : params.minLastPaymentAmount());

        // --- Tax calculations ---
        BigDecimal firstPaymentTax = regularPaymentNoTax.subtract(params.companyDiscount())
            .max(BigDecimal.ZERO)
            .multiply(params.taxRate())
            .setScale(4, RoundingMode.HALF_EVEN);
        BigDecimal lastPaymentTax = sched.getLastPaymentNoTaxNoFees().multiply(params.taxRate()).setScale(4, RoundingMode.HALF_EVEN);
        BigDecimal regularTax = regularPaymentNoTax.multiply(params.taxRate()).setScale(4, RoundingMode.HALF_EVEN);

        sched.setFirstPaymentTax(firstPaymentTax);
        sched.setLastPaymentTax(lastPaymentTax);
        sched.setRegularPaymentTax(regularTax);
        sched.setTaxRate(params.taxRate());
        sched.setTaxAmount(firstPaymentTax.add(lastPaymentTax)
            .add(regularTax.multiply(BigDecimal.valueOf(numOfPayments - 2)))
            .setScale(2, RoundingMode.HALF_EVEN));

        // --- First payment dates ---
        LocalDate firstPaymentDate = params.firstPaymentDate();
        sched.setFirstPaymentDueDate(firstPaymentDate);
        sched.setDelinquencyAsOfDate(firstPaymentDate);

        // --- Payment with fees and tax ---
        BigDecimal firstPaymentNoTaxWithFees = regularPaymentNoTax.add(params.processingFee()).subtract(params.companyDiscount());
        sched.setFirstPaymentNoTaxWithFees(firstPaymentNoTaxWithFees);
        sched.setFirstPaymentWithTaxNoFees(regularPaymentNoTax.add(firstPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
        sched.setNextPaymentWithTax(regularPaymentNoTax.multiply(params.taxRate().add(BigDecimal.ONE)).setScale(2, RoundingMode.HALF_EVEN));
        sched.setLastPaymentNoTaxWithFees(sched.getLastPaymentNoTaxNoFees().subtract(params.securityDeposit()));
        sched.setLastPaymentWithTax(sched.getLastPaymentNoTaxWithFees().add(lastPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
        sched.setFirstPaymentDiscount(params.companyDiscount());

        // --- Fees and discounts ---
        sched.setProcessingFee(params.processingFee());
        sched.setBuyoutFee(params.buyOutFee());
        sched.setTotalRecycleFee(params.recycleFee().multiply(BigDecimal.valueOf(params.totalNumOfItems())).setScale(2, RoundingMode.HALF_EVEN));
        sched.setMerchantDiscountAmount(params.merchantDiscountAmount());
        sched.setMerchantDiscountRate(params.merchantDiscountRate());
        sched.setPlatFormFeeAmount(params.platformFeeAmount());
        sched.setPlatFormFeeRate(params.platformFeeRate());
        sched.setMerchantRebateAmount(params.merchantRebateAmount());
        sched.setMerchantRebateRate(params.merchantRebateRate());

        // --- Signing / security ---
        sched.setSecurityDeposit(params.securityDeposit());
        sched.setSigningFee(params.signingFee());
        sched.setAmountChargedAtSigning(params.amountChargedAtSigning());

        // --- Early payoff / EPO ---
        Long months = configurationManagement.getLong(configurationPath + "epo.months.for.state." + params.ctx().state());
        LocalDate epoStartDate = configurationManagement.getBoolean(configurationPath + "getEpoDateFromFpd", false)
            ? firstPaymentDate
            : LocalDate.now();
        BigDecimal epoFeeAmount = params.epoFeeRate() != null && params.epoFeeRate().compareTo(BigDecimal.ZERO) > 0
            ? params.baseCost().multiply(params.epoFeeRate()).setScale(2, RoundingMode.HALF_EVEN)
            : BigDecimal.ZERO;
        sched.setEarlyPayoffDateExpiry(months != null ? epoStartDate.plusMonths(months) : epoStartDate.plusDays(params.epoDays()));
        sched.setEpoAmountWithoutTax(sched.getCostWithoutTaxAndFees().add(epoFeeAmount).add(params.buyOutFee()));

        // --- Redirect URL ---
        sched.setRedirectUrl(params.redirectUrl() + frequency);

        return sched;
    }

    private BigDecimal resolveMinLastPayment(String state, BigDecimal baseCost) {
        if (!configurationManagement
            .getString("last.payment.amount.different.for.states", "NC")
            .contains(state)) {
            return null;
        }

        double rate = configurationManagement.getDouble(
                "last.payment.percent.rate.for.state." + state,
                0.11
            );

        return baseCost
            .multiply(BigDecimal.valueOf(rate))
            .setScale(2, RoundingMode.HALF_EVEN);
    }











//    public CalculatorResults calculate(CalculatorRequest request){
//        CalculatorResults result = new CalculatorResults();
//
//        SvAccount account = request.getSvAccount();
//        if(account != null){
//            return calculateForAccount(request);
//        }
//
//        LosLead lead = request.getLead();
//        if(lead == null){
//            log.info("[CalculatorService][calculate] No account or lead given. Returning.");
//            return result;
//        }
//        log.info("[CalculatorService][calculate] Lead {}", lead.getPk());
//        LosInvoice invoice = lead.getLosInvoice();
//        if (invoice == null) {
//            log.info("[CalculatorService][calculate] Lead {} does not have an invoice. Returning without calculation", lead.getPk());
//            return result;
//        }
//
//        String state = request.getState();
//        String zipCode = request.getZipCode();
//        String streetAddress = request.getStreetAddress();
//        String city = request.getCity();
//        LocalDate nextPayDate = request.getNextPayDate();
//        Frequency payFrequency = request.getPayFrequency();
//
//        InvoiceInfo invoiceInfo = invoice.getInvoiceInfo();
//        CustomerInfo customerInfo = customerService.getPrimaryCustomer(lead.getPk()).getCustomerInfo();
//        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
//        AddressInfo addressInfo = addressService.getHomeAddressForCustomer(customerInfo.getCustomerPk()).getAddressInfo();
//        LosUWData uwData = underwritingService.getUWDataForLead(lead.getPk());
//        result.setLosUWData(uwData);
//
//        if (nextPayDate == null || payFrequency == null) {
//            LosEmployment employment = employmentService.getPrimaryEmploymentByCustomerPK(customerInfo.getCustomerPk());
//            nextPayDate = nextPayDate == null ? employment.getEmploymentInfo().getNextPayDate() : nextPayDate;
//            payFrequency = payFrequency == null ? employment.getEmploymentInfo().getPayFrequency() : payFrequency;
//        }
//
//        result.setLead(lead);
//        result.setMerchant(merchant);
//        if (StringUtils.isBlank(state) || StringUtils.isBlank(zipCode)) {
//            state = addressInfo.getState().toUpperCase();
//            zipCode = addressInfo.getZipCode9();
//            streetAddress = addressInfo.getStreetAddress1();
//            city = addressInfo.getCity();
//        }
//        log.info("[CalculatorService][calculate] Lead {}, nextPayDate {}, merchant {}", lead.getPk(), nextPayDate, merchant.getMerchantInfo().getRefMerchantCode());
//        List<MerchantProgram> programs = getProgramsForLead(lead, state, merchant);
//        if (programs.isEmpty())
//            throw new SvcException("No active merchant program for lead "+lead.getPk()+" in state " + state);
//
//        String envName = System.getenv("ENVIRONMENT_NAME");
//        String env = !org.thymeleaf.util.StringUtils.isEmpty(envName) ? envName : null;
//        boolean returnFinalizeUrl = env != null
//            ? configurationManagement.getString(configurationPath + "return.finalize.url.for.merchants", "SYNCHRONY")
//            .contains(merchant.getMerchantInfo().getClientType().toString())
//            && lead != null && lead.getLeadInfo().getInternalStatus() == LeadStatus.UW_APPROVED
//            : false;
//
//        lead = leadShortCodeService.refreshAndSaveShortCode(lead);
//        String finalizeAppUrl = UrlBuilderUtils.buildFinalizeUrl(merchant.getMerchantInfo().getClientType(), env, lead.getLeadInfo().getShortCode());
//        String completeAppUrl = UrlBuilderUtils.buildCompleteUrl(merchant.getMerchantInfo().getClientType(), env, lead.getLeadInfo().getShortCode());
//        String redirectUrl = returnFinalizeUrl ? finalizeAppUrl : completeAppUrl;
//        if (nextPayDate == null) {
//            log.info("[CalculatorService][calculate] NextPayDate is null for lead "+lead.getPk()+". Returning redirectUrl.");
////            if(merchant.getMerchantInfo().getSendMerchantPortalUrlAsProvider()){
////                redirectUrl = env != null ? "https://origination-" + env + ".uownleasing.com/customers/" : configurationManagement.getString(configurationPath + "redirect.merchant.portal.base.url.", "https://origination-dev1.uownleasing.com/customers/");
////            }
//            result.setRedirectUrl(redirectUrl + "?selectedPaymentFrequency=");
//            log.info("[CalculatorService][calculate] Returning for Lead {}, redirectUrl {}", lead.getPk(), result.getRedirectUrl());
//            return result;
//        }
//        BigDecimal baseCost = getBaseCost(invoiceInfo);
//        Integer totalNumOfItems = invoiceInfo.getTotalNumberOfItems();
//        List<Frequency> frequencyList = request.getPaymentFrequencyList();
//        List<Frequency> defaultFrequencyList = List.of(Frequency.WEEKLY, Frequency.BI_WEEKLY, Frequency.SEMI_MONTHLY, Frequency.MONTHLY);
//        if(CollectionUtils.isEmpty(frequencyList)) {
//            String allowedFrequencies = StringUtils.isBlank(merchantProgram.getProgramInfo().getAllowedFrequencyOverride())
//                ? merchant.getMerchantInfo().getAllowedFrequencies()
//                : merchantProgram.getProgramInfo().getAllowedFrequencyOverride();
//            frequencyList = StringUtils.isBlank(allowedFrequencies) ? defaultFrequencyList
//                : Arrays.stream(allowedFrequencies.split(",")).map(s -> Frequency.valueOf(s.trim())).collect(Collectors.toList());
//        }
//        BigDecimal moneyFactor = merchantProgram.getProgramInfo().getMoneyFactor().setScale(6, RoundingMode.HALF_EVEN);
//        Integer numberOfMonths = merchantProgram.getProgramInfo().getTermMonths();
//        Integer epoDays = merchantProgram.getProgramInfo().getEpoDays();
//        BigDecimal epoFeeRate = merchantProgram.getProgramInfo().getEpoFeePercent();
//
//        BigDecimal merchantDiscountRate = merchantProgram.getProgramInfo().getDealerDiscount() != null && merchantProgram.getProgramInfo().getDealerDiscount().compareTo(BigDecimal.ZERO) > 0
//            ? merchantProgram.getProgramInfo().getDealerDiscount()
//            : merchant.getMerchantInfo().getDealerDiscountOverride();
//        BigDecimal platformFeeRate = merchant.getMerchantInfo().getPlatformFee();
//        BigDecimal merchantRebateRate = merchant.getMerchantInfo().getDealerRebateOverride();
//
//        BigDecimal securityDeposit = getSecurityDepositForLead(lead);
//        merchantDiscountRate = merchantDiscountRate == null ? BigDecimal.ZERO : merchantDiscountRate;
//        merchantRebateRate = merchantRebateRate == null ? BigDecimal.ZERO : merchantRebateRate;
//        platformFeeRate = platformFeeRate == null ? BigDecimal.ZERO : platformFeeRate;
//        BigDecimal merchantDiscountAmount = baseCost.multiply(merchantDiscountRate).setScale(2, RoundingMode.HALF_EVEN);
//        BigDecimal merchantRebateAmount = baseCost.multiply(merchantRebateRate).setScale(2, RoundingMode.HALF_EVEN);
//        BigDecimal platformFeeAmount = baseCost.multiply(platformFeeRate).setScale(2, RoundingMode.HALF_EVEN);
//        BigDecimal contractAmountBeforeTax = baseCost.multiply(moneyFactor).multiply(new BigDecimal(numberOfMonths)).setScale(4, RoundingMode.HALF_EVEN);
//        BigDecimal epoFeeAmount = epoFeeRate != null && epoFeeRate.compareTo(BigDecimal.ZERO) > 0
//            ? baseCost.multiply(epoFeeRate).setScale(2, RoundingMode.HALF_EVEN)
//            : BigDecimal.ZERO;
//        BigDecimal buyOutFee = merchant.getMerchantInfo().getBuyoutFee();
//        BigDecimal taxRate;
//        try {
//            taxRate = taxService.getTaxForZip(lead.getPk(), null, streetAddress, city, state, zipCode, request.getCountry(), merchant.getMerchantInfo().getRefMerchantCode()).setScale(6, RoundingMode.HALF_EVEN);
//        } catch (RuntimeException e) {
//            log.info("[CalculatorService][calculate] Exception while retrieving tax ");
//            e.printStackTrace();
//            lead.getLeadInfo().setNotes("Exception while retrieving tax : " + ExceptionUtils.getMessage(e));
//            if (!SystemConfigurationManagement.isProduction()) {
//                taxRate = BigDecimal.valueOf(configurationManagement.getDouble(configurationPath + "default.taxrate.on.exception", 0.06));
//            } else {
//                result.setIsError(Boolean.TRUE);
//                result.setErrorMessage(String.format("Unable to retrieve tax for street %s, city %s, state %s, zip %s for lead %s", streetAddress, city, state, zipCode, lead != null ? lead.getPk() : account.getPk()));
//                return result;
//            }
//
//        }
//        log.info("[CalculatorService][calculate] TaxRate for zipcode for {} : {} is {}", "lead", lead.getPk(), taxRate);
//
//        //add taxForZipPK in leadInfo
//        TaxForZip taxForZip = taxService.findTaxForZipInDB(streetAddress, city, state, zipCode, request.getCountry());
//        if (taxForZip != null) {
//            lead.getLeadInfo().setTaxForZipPk(taxForZip.getPk());
//        }
//
//        BigDecimal taxAmount = contractAmountBeforeTax.multiply(taxRate).setScale(6, RoundingMode.HALF_EVEN);
//        BigDecimal contractAmountAfterTax = contractAmountBeforeTax.add(taxAmount).setScale(2, RoundingMode.HALF_EVEN);
//        BigDecimal recycleFee = BigDecimal.ZERO;//stateConfigInfo.getRecycleFee() == null ? BigDecimal.ZERO : stateConfigInfo.getRecycleFee();
//        BigDecimal processingFee = getProcessingFeeForLead(lead);
//        contractAmountAfterTax = contractAmountAfterTax
//            .add(processingFee)
//            .subtract(request.getCompanyDiscount())
//            .add(recycleFee.multiply(new BigDecimal(totalNumOfItems)))
//            .setScale(2, RoundingMode.HALF_EVEN);
//        BigDecimal minLastPaymentAmount = null;
////        BigDecimal amortizedAmount = contractAmountBeforeTax.add(securityDeposit).setScale(2, RoundingMode.HALF_EVEN);
//
//        BigDecimal signingFee;
//        BigDecimal amountChargedAtSigning;
//        LocalDate activationDate = LocalDate.now();
//        signingFee = getFeeToBeChargedForLead(lead);
//        amountChargedAtSigning = merchantProgram.getProgramInfo().getAmountChargedAtSigning() == null ? BigDecimal.ZERO : merchantProgram.getProgramInfo().getAmountChargedAtSigning();
//
//
//        if (configurationManagement.getString("last.payment.amount.different.for.states", "NC").contains(state)) {
//            minLastPaymentAmount = baseCost.multiply(BigDecimal.valueOf(configurationManagement.getDouble("last.payment.percent.rate.for.state." + state, 0.11))).setScale(2, RoundingMode.HALF_EVEN);
//        }
//
//        LocalDate firstPaymentDate = request.getFirstPaymentDate() == null ? getFirstPaymentDate(payFrequency, nextPayDate) : request.getFirstPaymentDate();
//        log.info("****************************************************[CalculatorService][calculate] ****************************************");
//        log.info("""
//            [CalculatorService][calculate] Lead {}
//            ,  baseCost {}
//            , processingFee {}
//            , contractAmountFactor {}
//            , , numberOfMonths {}
//            , contractAmountBeforeTax {}
//            , contractAmountAfterTax {}
//            , recycleFee {}
//            ,minLastPaymentAmount {}""", lead, baseCost, processingFee, moneyFactor, numberOfMonths, contractAmountBeforeTax, contractAmountAfterTax, recycleFee, minLastPaymentAmount);
//        log.info("*************************************************[CalculatorService][calculate] ******************************************");
//        for(MerchantProgram program : programs) {
//            for (Frequency frequency : frequencyList) {
//                Integer numOfPayments = configurationManagement.getInteger(configurationPath + "numOfPayments." + numberOfMonths + "." + frequency);
//                if (numOfPayments == null) {
//                    numOfPayments = getNumberOfPayments(numberOfMonths, frequency);
//                }
//                BigDecimal numberOfPayments = new BigDecimal(numOfPayments);
//
//                BigDecimal regularPaymentNoTax = minLastPaymentAmount == null ? contractAmountBeforeTax.divide(numberOfPayments, 4, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN) : contractAmountBeforeTax.subtract(minLastPaymentAmount).divide(new BigDecimal(numOfPayments - 1), 2, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN);
//
//                SchedSummaryInfo schedSummaryInfo = new SchedSummaryInfo();
//                schedSummaryInfo.setLeadPk(lead.getPk());
//                schedSummaryInfo.setShortCode(lead.getLeadInfo().getShortCode());
//                schedSummaryInfo.setMoneyFactor(moneyFactor.multiply(new BigDecimal(numberOfMonths).setScale(4, RoundingMode.HALF_EVEN)));
//                schedSummaryInfo.setCostWithoutTaxAndFees(baseCost);
//                schedSummaryInfo.setCostWithFeesNoTax(baseCost.add(processingFee));
//                schedSummaryInfo.setPaymentFrequency(frequency);
//                schedSummaryInfo.setTotalContractAmountWithTaxAndFees(contractAmountAfterTax);
//                schedSummaryInfo.setTotalNumberOfPayments(numOfPayments);
//                schedSummaryInfo.setFirstPaymentDueDate(firstPaymentDate);
//                schedSummaryInfo.setDelinquencyAsOfDate(firstPaymentDate);
//                schedSummaryInfo.setFirstPaymentNoTaxNoFees(regularPaymentNoTax);
//                BigDecimal firstPaymentNoTaxWithFees = regularPaymentNoTax.add(processingFee).subtract(request.getCompanyDiscount());
//                BigDecimal taxableFirstPayment = regularPaymentNoTax.subtract(request.getCompanyDiscount());
//                schedSummaryInfo.setFirstPaymentNoTaxWithFees(firstPaymentNoTaxWithFees);
//                BigDecimal firstPaymentTax = (taxableFirstPayment.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : taxableFirstPayment).multiply(taxRate).setScale(4, RoundingMode.HALF_EVEN);
//                schedSummaryInfo.setFirstPaymentTax(firstPaymentTax);
//                schedSummaryInfo.setFirstPaymentWithTaxNoFees(regularPaymentNoTax.add(firstPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
//                schedSummaryInfo.setFirstPaymentDiscount(request.getCompanyDiscount());
//                schedSummaryInfo.setNextPaymentNoTaxNoFees(regularPaymentNoTax);
//                schedSummaryInfo.setNextPaymentWithTax(regularPaymentNoTax.multiply(taxRate.add(BigDecimal.ONE)).setScale(2, RoundingMode.HALF_EVEN));
//                schedSummaryInfo.setLastPaymentNoTaxNoFees(minLastPaymentAmount == null ? regularPaymentNoTax : minLastPaymentAmount);
//                schedSummaryInfo.setLastPaymentNoTaxWithFees(schedSummaryInfo.getLastPaymentNoTaxNoFees().subtract(securityDeposit));
//                BigDecimal lastPaymentTax = schedSummaryInfo.getLastPaymentNoTaxWithFees().multiply(taxRate).setScale(4, RoundingMode.HALF_EVEN);
//                schedSummaryInfo.setLastPaymentTax(lastPaymentTax);
//                schedSummaryInfo.setLastPaymentWithTax(schedSummaryInfo.getLastPaymentNoTaxWithFees().add(lastPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
//                BigDecimal regularTax = regularPaymentNoTax.multiply(taxRate).setScale(4, RoundingMode.HALF_EVEN);
//                schedSummaryInfo.setRegularPaymentTax(regularTax);
//                log.info("[CalculatorService][calculate] TaxRate in SchedSummary {}", taxRate);
//                schedSummaryInfo.setTaxRate(taxRate);
//                schedSummaryInfo.setTaxAmount(firstPaymentTax.add(lastPaymentTax).add(regularTax.multiply(new BigDecimal(schedSummaryInfo.getTotalNumberOfPayments() - 2))).setScale(2, RoundingMode.HALF_EVEN));
//                schedSummaryInfo.setMerchantDiscountAmount(merchantDiscountAmount);
//                schedSummaryInfo.setMerchantDiscountRate(merchantDiscountRate);
//                schedSummaryInfo.setPlatFormFeeAmount(platformFeeAmount);
//                schedSummaryInfo.setPlatFormFeeRate(platformFeeRate);
//                schedSummaryInfo.setMerchantRebateRate(merchant.getMerchantInfo().getDealerRebateOverride());
//                schedSummaryInfo.setMerchantRebateAmount(merchantRebateAmount);
//                schedSummaryInfo.setProcessingFee(processingFee);
//                schedSummaryInfo.setBuyoutFee(merchant.getMerchantInfo().getBuyoutFee());
//                schedSummaryInfo.setTotalRecycleFee(recycleFee.multiply(new BigDecimal(totalNumOfItems)).setScale(2, RoundingMode.HALF_EVEN));
//                //schedSummaryInfo.setMoneyFactor(moneyFactor);
//                Long months = configurationManagement.getLong(configurationPath + "epo.months.for.state." + state);
//                LocalDate epoStartDate = configurationManagement.getBoolean(configurationPath + "getEpoDateFromFpd", false) ? schedSummaryInfo.getFirstPaymentDueDate() : activationDate;
//                schedSummaryInfo.setEarlyPayoffDateExpiry(months != null ? epoStartDate.plusMonths(months) : epoStartDate.plusDays(epoDays));
//                schedSummaryInfo.setEpoAmountWithoutTax(schedSummaryInfo.getCostWithFeesNoTax().add(epoFeeAmount).add(buyOutFee));
//                schedSummaryInfo.setTermInMonths(numberOfMonths);
//                schedSummaryInfo.setSecurityDeposit(securityDeposit);
//                schedSummaryInfo.setSigningFee(signingFee);
//                schedSummaryInfo.setAmountChargedAtSigning(amountChargedAtSigning);
//                //https://origination-dev1.uownleasing.com/completeApplication?uuid=
//                //"http://localhost:8082/uown/los/getMissingRequiredFields/"
//                schedSummaryInfo.setRedirectUrl(redirectUrl + "?selectedPaymentFrequency=" + frequency);
//                result.getSchedSummaryInfoList().add(schedSummaryInfo);
//            }
//        }
//        return result;
//    }

    private List<MerchantProgram> getProgramsForLead(LosLead lead, String state, Merchant merchant) {
        List<MerchantProgram> programs = new ArrayList<>();
        long leadPk = lead.getPk();
        log.info("[CalculatorService][getProgramsForLead] lead {}, MerchantProgram on lead {}", leadPk, lead.getLeadInfo().getMerchantProgramPk());
        if (lead.getLeadInfo().getMerchantProgramPk() != null) {
            programs.add(merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk()));
            return programs;
        }
        programs = merchantToProgramService.getSACActiveProgramForStateAndCategory(merchant.getPk(), state, LendingCategoryType.LTO);

        if (CollectionUtils.isEmpty(programs)) {
            log.info("[CalculatorService][getProgramsForLead] lead {}, No programs for state {} on merchant {}", leadPk, state, merchant.getMerchantInfo().getRefMerchantCode());
            return programs;
        }
        LosUWData losUWData = lead.getLosUWData();
        if (losUWData != null) {
            String terms = losUWData.getUwInfo().getEligibleTerms();
            log.info("[CalculatorService][getProgramsForLead] lead {}, EligibleTerms{}", leadPk, terms);
            if (StringUtils.isNotBlank(terms)) {
                return programs.stream().filter(p -> terms.contains(p.getProgramInfo().getTermMonths().toString())).toList();
            }
        }
        return programs;

    }

    public CalculatorResults calculateForAccount(CalculatorRequest request) {
        CalculatorResults result = new CalculatorResults();
        SvAccount account = request.getSvAccount();
        SvInvoice invoice = account.getSvInvoice();
        if (invoice == null || account.getSchedSummary() == null) {
            log.info("[CalculatorService][calculate] Account {} needs both Sched summary and invoice infomation. Returning without calculation", account.getPk());
            return result;
        }
        SchedSummaryInfo schedSummaryInfo = account.getSchedSummary().getSchedSummaryInfo();
        InvoiceInfo invoiceInfo = invoice.getInvoiceInfo();
        CustomerInfo customerInfo = svCustomerService.getCustomerService().getPrimaryCustomer(account.getPk()).getCustomerInfo();
        Merchant merchant = merchantService.getMerchantByAccountPk(account.getPk());
        AddressInfo addressInfo = svAddressService.getHomeAddressForCustomer(customerInfo.getCustomerPk()).getAddressInfo();
        result.setMerchant(merchant);
        int numberOfMonths = schedSummaryInfo.getTermInMonths();
        Frequency frequency = request.getPaymentFrequencyList().get(0);
        Integer numOfPayments = configurationManagement.getInteger(configurationPath + "numOfPayments." + numberOfMonths + "." + frequency);
        if (numOfPayments == null) {
            numOfPayments = getNumberOfPayments(numberOfMonths, frequency);
        }
        BigDecimal numberOfPayments = new BigDecimal(numOfPayments);
        BigDecimal minLastPaymentAmount = null;
        String state = addressInfo.getState();
        BigDecimal baseCost = getBaseCost(invoiceInfo);
        BigDecimal moneyFactor = getMoneyFactorForAccount(account);
        BigDecimal taxRate = schedSummaryInfo.getTaxRate();

        if(moneyFactor.equals(BigDecimal.ZERO)){
            result.setErrorMessage("Merchant program doesn't exist on account");
            return result;
        }
        BigDecimal contractAmountBeforeTax = getContractAmountBeforeTax(baseCost, moneyFactor);
        BigDecimal taxAmount = contractAmountBeforeTax.multiply(taxRate).setScale(2, RoundingMode.HALF_EVEN);
        schedSummaryInfo.setTotalContractAmountWithTaxAndFees((contractAmountBeforeTax
            .multiply(BigDecimal.ONE.add(taxRate)))
            .add(schedSummaryInfo.getProcessingFee())
            .setScale(2, RoundingMode.HALF_EVEN));
        BigDecimal termPaymentNoTax = contractAmountBeforeTax.divide(numberOfPayments, 4, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN);

        if (configurationManagement.getString("last.payment.amount.different.for.states", "NC").contains(state)) {
            minLastPaymentAmount = baseCost.multiply(BigDecimal.valueOf(configurationManagement.getDouble("last.payment.percent.rate.for.state." + state, 0.11))).setScale(2, RoundingMode.HALF_EVEN);
        }
        BigDecimal regularPaymentNoTax = minLastPaymentAmount == null ? termPaymentNoTax
            : contractAmountBeforeTax.subtract(minLastPaymentAmount).divide(new BigDecimal(numOfPayments - 1), 2, RoundingMode.HALF_EVEN).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal regularPaymentTax = regularPaymentNoTax.multiply(taxRate).setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal regularPaymentWithTax = regularPaymentNoTax.add(regularPaymentTax).setScale(2, RoundingMode.HALF_EVEN);

        schedSummaryInfo.setPaymentFrequency(frequency);
        schedSummaryInfo.setTaxAmount(taxAmount);
        schedSummaryInfo.setTotalNumberOfPayments(numOfPayments);
        schedSummaryInfo.setFirstPaymentDueDate(request.getFirstPaymentDate() != null ? request.getFirstPaymentDate() : schedSummaryInfo.getFirstPaymentDueDate());
        schedSummaryInfo.setFirstPaymentNoTaxNoFees(regularPaymentNoTax);
        BigDecimal firstPaymentNoTaxWithFees = regularPaymentNoTax.add(schedSummaryInfo.getProcessingFee());
        schedSummaryInfo.setFirstPaymentWithTaxNoFees(regularPaymentNoTax.add(regularPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
        schedSummaryInfo.setFirstPaymentNoTaxWithFees(firstPaymentNoTaxWithFees);
        schedSummaryInfo.setNextPaymentNoTaxNoFees(regularPaymentNoTax);
        schedSummaryInfo.setNextPaymentWithTax(regularPaymentWithTax);
        schedSummaryInfo.setLastPaymentNoTaxNoFees(minLastPaymentAmount == null ? regularPaymentNoTax : minLastPaymentAmount);
        schedSummaryInfo.setLastPaymentNoTaxWithFees(schedSummaryInfo.getLastPaymentNoTaxNoFees().subtract(schedSummaryInfo.getSecurityDeposit()));
        BigDecimal lastPaymentTax = schedSummaryInfo.getLastPaymentNoTaxWithFees().multiply(taxRate).setScale(4, RoundingMode.HALF_EVEN);
        schedSummaryInfo.setLastPaymentTax(lastPaymentTax);
        schedSummaryInfo.setLastPaymentWithTax(schedSummaryInfo.getLastPaymentNoTaxWithFees().add(lastPaymentTax).setScale(2, RoundingMode.HALF_EVEN));
        result.getSchedSummaryInfoList().add(schedSummaryInfo);
        return result;
    }

    private BigDecimal getMoneyFactorForAccount(SvAccount account) {
        SchedSummaryInfo schedSummaryInfo = account.getSchedSummary().getSchedSummaryInfo();
        BigDecimal moneyFactor = schedSummaryInfo.getMoneyFactor();
        if(moneyFactor == null){
            MerchantProgram merchantProgram = merchantProgramService.getMerchantProgramByProgramPk(account.getAccountInfo().getMerchantProgramPk());
            if(merchantProgram == null){
                moneyFactor = BigDecimal.ZERO;
            }else {
                moneyFactor = merchantProgram.getProgramInfo().getMoneyFactor().multiply(BigDecimal.valueOf(schedSummaryInfo.getTermInMonths())).setScale(4, RoundingMode.HALF_EVEN);
            }
        }
        return moneyFactor;
    }

    private BigDecimal getBaseCost(InvoiceInfo invoiceInfo) {
        return invoiceInfo.getTotalInvoiceAmount()
            .subtract(invoiceInfo.getTaxAmount())
            .subtract(invoiceInfo.getDepositAmount()).setScale(2, RoundingMode.HALF_EVEN);
    }

    private BigDecimal getContractAmountBeforeTax(BigDecimal baseCost, BigDecimal moneyFactor) {
        return baseCost.multiply(moneyFactor).setScale(4, RoundingMode.HALF_EVEN);
    }


    private Integer getNumberOfPayments(Integer numberOfMonths, Frequency frequency) {
        String basePath = "number.of.payments.";
        Integer numMonths = configurationManagementService.getInteger(basePath + numberOfMonths + "." + frequency);
        if (numMonths == null) {
            if (frequency.equals(Frequency.MONTHLY))
                return numberOfMonths;
            throw new SvcException("The frequency for MonthPayments(" + numberOfMonths + ") should be MONTHLY only. current frequency : " + frequency);
        }
        return numMonths;
    }

    private LocalDate getFirstPaymentDate(Frequency frequency, LocalDate nextPayDate){
        Boolean checkIfPayIn3Days = configurationManagement.getBoolean(configurationPath+"check.next.pay.date.in.3.days", true);
        Long numOfDays = configurationManagement.getLong(configurationPath+"check.next.pay.date.in.days", 5L);
        if(nextPayDate != null && nextPayDate.compareTo(LocalDate.now()) > 0){
            if(checkIfPayIn3Days && nextPayDate.compareTo(LocalDate.now().plusDays(numOfDays)) <= 0){
                log.info("NextPayDate {} is within {} days. Returning nextPayDate", nextPayDate, numOfDays);
                return DateUtils.getNextDate(nextPayDate, frequency);
            }
            return nextPayDate;
        }
        return DateUtils.getNextDateInFuture(nextPayDate, frequency);
    }

    public BigDecimal getProcessingFeeForLead(LosLead lead) {
        /* utility function to determine what the processing fee should be for this lead
            returns:
                0                                       if processing fee should not be applied
                ProgramInfo.processingFeeOverride       if available
                StateConfigurationInfo.processingFee    default
        */
        MerchantProgram program = merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk());
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        StateConfigurations stateConfigs = stateConfigService.getByState(
            merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE ? merchant.getMerchantInfo().getState() : lead.getLeadInfo().getCustomerState());

        if (Boolean.FALSE.equals(merchant.getMerchantInfo().getChargeProcessingFee())) return BigDecimal.ZERO;
        if (program != null
            && program.getProgramInfo().getAmountChargedAtSigning() != null
            && program.getProgramInfo().getAmountChargedAtSigning().compareTo(BigDecimal.ZERO) > 0)
            return BigDecimal.ZERO;
        if (program != null
            && program.getProgramInfo().getProcessingFeeOverride() != null
            && program.getProgramInfo().getProcessingFeeOverride().compareTo(BigDecimal.ZERO) > 0)
            return program.getProgramInfo().getProcessingFeeOverride();
        if (stateConfigs == null) return BigDecimal.ZERO;
        if (stateConfigs.getStateConfigurationsInfo().getProcessingFee() != null) return stateConfigs.getStateConfigurationsInfo().getProcessingFee();
        return BigDecimal.ZERO;
    }

    public BigDecimal getSecurityDepositForLead(LosLead lead) {
        /* utility function to determine what the security deposit is
            returns 0 if there is no deposit
         */
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        MerchantProgram merchantProgram = merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk());
        LosUWData uwData = underwritingService.getUWDataForLead(lead.getPk());
        StateConfigurations stateConfigs = stateConfigService.getByState(
            merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE ? merchant.getMerchantInfo().getState() : lead.getLeadInfo().getCustomerState());

        // determine if the security deposit should be held
        boolean holdDeposit = merchant.getMerchantInfo().getHoldDeposit() != null
            && merchant.getMerchantInfo().getHoldDeposit()
            && stateConfigs != null
            && stateConfigs.getStateConfigurationsInfo().getSecurityDeposit() != null;
        if (!holdDeposit) holdDeposit = merchant.getMerchantInfo().getCheckUwForVerification()
            && uwData.getUwInfo().getChargeProcessingFee()
            && stateConfigs != null
            && stateConfigs.getStateConfigurationsInfo().getSecurityDeposit() != null;

        return holdDeposit
            && (merchantProgram.getProgramInfo().getProcessingFeeOverride() == null
                || merchantProgram.getProgramInfo().getProcessingFeeOverride().compareTo(BigDecimal.ZERO) <= 0)
            && (merchantProgram.getProgramInfo().getAmountChargedAtSigning() == null
                || merchantProgram.getProgramInfo().getAmountChargedAtSigning().compareTo(BigDecimal.ZERO) < 1)
            ? stateConfigs.getStateConfigurationsInfo().getSecurityDeposit()
            : BigDecimal.ZERO;
    }

    public BigDecimal getFeeToBeChargedForLead(LosLead lead) {
        /* utility function to determine what the before e-sign fee is
           feeToBeCharged is either the security deposit or the processing fee or none at all (0)
         */
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        MerchantProgram program = merchantProgramService.getMerchantProgramByProgramPk(lead.getLeadInfo().getMerchantProgramPk());
        LosUWData uwData = underwritingService.getUWDataForLead(lead.getPk());

        // determine if a fee should be charged before e-sign
        boolean chargeFee = merchant.getMerchantInfo().getChargeProcessingFee() != null
            && merchant.getMerchantInfo().getChargeProcessingFee()
            && merchant.getMerchantInfo().getChargeProcessingFeeBeforeEsign() != null
            && merchant.getMerchantInfo().getChargeProcessingFeeBeforeEsign();
        if (!chargeFee) chargeFee = merchant.getMerchantInfo().getCheckUwForVerification()
            && uwData.getUwInfo().getChargeProcessingFee();

        BigDecimal feeToBeCharged = BigDecimal.ZERO;
        if (program != null
            && program.getProgramInfo().getAmountChargedAtSigning() != null
            && program.getProgramInfo().getAmountChargedAtSigning().compareTo(BigDecimal.ZERO) > 0) feeToBeCharged = program.getProgramInfo().getAmountChargedAtSigning();
        if (chargeFee && feeToBeCharged.compareTo(BigDecimal.ZERO) == 0) feeToBeCharged = getProcessingFeeForLead(lead); // only charge a processing fee if it's specified to do so before e-sign
        if (feeToBeCharged.compareTo(BigDecimal.ZERO) == 0) feeToBeCharged = getSecurityDepositForLead(lead); // if all 3 options are ticked in FE and processing fee is 0, use the security deposit
        return feeToBeCharged; // technically feeToBeCharged can't be null since getProcessingFee and getSecurityDeposit cannot return null
    }

    public BigDecimal getTaxRateForLead(LosLead lead, Merchant merchant) {
        String streetAddress;
        String state;
        String zipCode;
        String city;
        String country;

        if (merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE) {
            streetAddress = merchant.getMerchantInfo().getLocationAddress1();
            state = merchant.getMerchantInfo().getState().toUpperCase();
            zipCode = merchant.getMerchantInfo().getZipCode();
            city = merchant.getMerchantInfo().getCity();
            country = merchant.getMerchantInfo().getCountry();
        } else {
            AddressInfo addressInfo = addressService.getHomeAddressForPrimaryCustomerForLead(lead.getPk()).getAddressInfo();
            state = addressInfo.getState().toUpperCase();
            zipCode = addressInfo.getZipCode9();
            streetAddress = addressInfo.getStreetAddress1();
            city = addressInfo.getCity();
            country = addressInfo.getCountry();
        }

        try {
            return taxService.getTaxForZip(lead.getPk(), null, streetAddress, city, state, zipCode, country, merchant.getMerchantInfo().getRefMerchantCode()).setScale(6, RoundingMode.HALF_EVEN);
        } catch (RuntimeException e) {
            log.info("[CalculatorService][calculate] Exception while retrieving tax", e);
            lead.getLeadInfo().setNotes("Exception while retrieving tax : " + ExceptionUtils.getMessage(e));
        }
        return null;
    }

    public LosSchedSummary createOrUpdateSchedSummary(CalculatorResults results){
        if(results.getSchedSummaryInfoList().isEmpty()){
            return null;
        }
        SchedSummaryInfo ssi = results.getSchedSummaryInfoList().get(0);
        LosSchedSummary losSchedSummary = schedSummaryService.getSchedSummaryByLead(ssi.getLeadPk());
        if(losSchedSummary != null){
            ssi.setSchedSummaryPK(losSchedSummary.getPk());
        }
        losSchedSummary = schedSummaryService.createOrUpdateSchedSummary(ssi);
        return losSchedSummary;
    }

}




src/main/java/com/uownleasing/svc/service/CorrespondenceService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.AccountInfo;
import com.uownleasing.dms.common.db.entity.*;
import com.uownleasing.dms.common.enumeration.*;
import com.uownleasing.dms.common.service.*;
import com.uownleasing.los.common.db.config.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.config.*;
import com.uownleasing.svc.common.db.entity.SvAccount;
import com.uownleasing.svc.common.db.repository.SvAccountRepo;
import com.uownleasing.svc.common.service.*;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.*;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.enumeration.ClientType;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.utility.*;
import lombok.*;
import lombok.extern.slf4j.*;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.*;
import org.hibernate.query.internal.*;
import org.hibernate.transform.*;
import org.springframework.beans.*;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.*;
import org.springframework.transaction.annotation.*;
import org.thymeleaf.templatemode.*;

import javax.persistence.*;
import java.beans.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CorrespondenceService {

    private final TemplateManagementService templateService;
    private final MerchantService merchantService;
    private final EmailQService emailQueueService;
    private final ThymeleafTemplateEngine thymeleafTemplateEngine;
    private final EntityManager entityManager;
    private final LoggingService svLoggingService;
    private final LosLoggingService losLoggingService;
    private final CorrespondenceLogService correspondenceLogService;
    private final ConfigurationManagement configurationManagement;
    private final SmsService smsService;
    private final SvAccountRepo svAccountRepo;
    private final SnowFlakeService snowFlakeService;
    private final String configurationPath = "com.uownleasing.svc.service.CorrespondenceService.";

    @Async
    @Transactional
    public void createCorrespondenceAsync(CorrespondenceRequest correspondenceRequest) {
        ThreadAttributes.setUsername(correspondenceRequest.getCreatedBy());
        try {

            Thread.sleep(configurationManagement.getLong(configurationPath + "sleep.in.create.correspondence.async"
                    + (StringUtils.isNotBlank(correspondenceRequest.getTemplateName()) ? "." + correspondenceRequest.getTemplateName() : ""),
                3000L));
        } catch (InterruptedException e) {
            log.error("Error sleeping before create correspondence async", e);
        }

        log.debug("******************    START createCorrespondenceAsync ...**********************");
        createCorrespondence(correspondenceRequest);
        log.debug("******************    END createCorrespondenceAsync ...**********************");
    }

    public void createCorrespondence(CorrespondenceRequest correspondenceRequest, String subject, String sql) {
        String error = "";
        Map<String, Object> dataMap = new HashMap<>();
        try {
            // 1. Fetch template
            SvAccount account = correspondenceRequest.getAccountPk() != null && correspondenceRequest.getAccountPk() > 0 ? svAccountRepo.findByPk(correspondenceRequest.getAccountPk()) : null;
            Merchant merchant = correspondenceRequest.getLeadPk() != null && correspondenceRequest.getLeadPk() > 0 ? merchantService.getMerchantByLeadPk(correspondenceRequest.getLeadPk()) : null;

            String company = Optional.ofNullable(account)
                .map(SvAccount::getAccountInfo)
                .map(AccountInfo::getCompany)
                .map(Enum::name)
                .orElse(Company.UOWN.name());

            if(account != null) {
                correspondenceRequest.setTemplateName(Company.KORNERSTONE.name().equals(company)
                    ?Company.KORNERSTONE+"_"+correspondenceRequest.getTemplateName()
                    :correspondenceRequest.getTemplateName());
            } else if (merchant != null && merchant.getMerchantInfo().getClientType() == ClientType.KORNERSTONE) {
                correspondenceRequest.setTemplateName(Company.KORNERSTONE+"_"+correspondenceRequest.getTemplateName());
            }

            log.info("[CorrespondenceService][createCorrespondence] fetching template  {}", correspondenceRequest.getTemplateName());

            Template template = templateService.getCurrentTemplateByName(correspondenceRequest.getTemplateName());

            log.debug("TEMPLATE {}", template);

            String errorString = template == null
                ? "No associated template found for correspondence request template name "
                + correspondenceRequest.getTemplateName()
                : null;

            if (errorString != null) {
                 correspondenceLogService.logCorrespondence(
                    correspondenceRequest.getAccountPk(),
                    correspondenceRequest.getLeadPk(),
                    correspondenceRequest.getTemplateName(),
                    correspondenceRequest.getCorrespondenceType(),
                    correspondenceRequest.getAccountPk() != null ? SystemSource.SVC : SystemSource.LOS,
                    dataMap,
                    String.format(
                        "accountPK:%d\nleadPK:%d\n%s",
                        correspondenceRequest.getAccountPk(),
                        correspondenceRequest.getLeadPk(),
                        errorString
                    )
                );
                 return;
            }

            CommonDataPojo commonDataPojo = correspondenceRequest.getCommonDataPojo();

            String sqlToGetValues = StringUtils.isBlank(sql) ? template.getTemplateInfo().getDataFieldsSQL() : sql;

            log.debug("sqlToGetValues {}", sqlToGetValues);
            log.debug("accountPK {}", correspondenceRequest.getAccountPk());
            log.debug("leadPK {}", correspondenceRequest.getLeadPk());

            if (StringUtils.isNotBlank(sqlToGetValues)) {
                if (Boolean.TRUE.equals(template.getTemplateInfo().getIsNative())) {
                    log.debug("[CorrespondenceService] Using native query");
                    sqlToGetValues = sqlToGetValues.replaceAll("(?i):accountPK", String.valueOf(correspondenceRequest.getAccountPk()));
                    sqlToGetValues = sqlToGetValues.replaceAll("(?i):leadPK", String.valueOf(correspondenceRequest.getLeadPk()));
                    dataMap = getDataMap(sqlToGetValues, commonDataPojo);
                } else {
                    log.debug("[CorrespondenceService] Using non-native query");
                    Query query = entityManager.createQuery(sqlToGetValues);
                    if (sqlToGetValues.contains(":leadPk")) {
                        query = query.setParameter("leadPk", correspondenceRequest.getLeadPk());
                    }
                    if (sqlToGetValues.contains(":accountPk")) {
                        query = query.setParameter("accountPk", correspondenceRequest.getAccountPk());
                    }
                    List data = query.getResultList();
                    if (!data.isEmpty()) {
                        commonDataPojo = (CommonDataPojo) data.get(0);
                        dataMap.put("CommonDataPojo", commonDataPojo);
                    }
                }
            } else {
                log.debug("[CorrespondenceService] Using CommonDataPojo");
                dataMap.put("CommonDataPojo", commonDataPojo);
            }

            long id = snowFlakeService.nextId();
            if (configurationManagement.getBoolean(configurationPath + "track.customer.correspondence." + correspondenceRequest.getCorrespondenceType().name(), false)) {
                ((CommonDataPojo) dataMap.get("CommonDataPojo")).setCustomerPortalParameters(String.format("?pathing=true&id=%d&type=%d",
                    id, correspondenceRequest.getCorrespondenceType().ordinal()));
            }

            log.debug("******** DATAMAP = {} *******", dataMap);

            if(MapUtils.isNotEmpty(dataMap)) {
                if (Company.KORNERSTONE.name().equals(company)) {
                    String environmentName = commonDataPojo.getEnvironment();
                    commonDataPojo.setCustomerPortalUrl(environmentName.equals("prd")
                        ? "portal.kornerstonecredit.com"
                        : "website-" + environmentName + ".kornerstonecredit.com");
                }

                String templateContent = template.getTemplateInfo().getTemplateContent();
                if (correspondenceRequest.getCorrespondenceType() == CorrespondenceType.EMAIL) {
                    log.debug("Creating Email Queue request for Template {}, for Lead {}, for Account {}", correspondenceRequest.getTemplateName(), correspondenceRequest.getLeadPk(), correspondenceRequest.getAccountPk());
                    String mergedTemplate =  thymeleafTemplateEngine.mergeDataIntoTemplateString(templateContent, dataMap, TemplateMode.HTML);
                    EmailQueue emailQueue = new EmailQueue();
                    emailQueue.setAccountPk(correspondenceRequest.getAccountPk());
                    emailQueue.setLeadPk(correspondenceRequest.getLeadPk() == null || correspondenceRequest.getLeadPk() <=0?commonDataPojo.getLeadPK(): correspondenceRequest.getLeadPk());
                    emailQueue.setCustomerPk(correspondenceRequest.getCustomerPk() == null ||  correspondenceRequest.getCustomerPk()<=0?commonDataPojo.getCustomerPK():correspondenceRequest.getCustomerPk());
                    emailQueue.setDataMap(StringUtility.convertMapToString(dataMap));
                    emailQueue.setEmailBody(mergedTemplate);
                    emailQueue.setSubject(subject == null ? template.getTemplateInfo().getSubject() : subject);
                    emailQueue.setTemplateName(correspondenceRequest.getTemplateName());

                    emailQueue.setFromEmailAddress(configurationManagement.getString(
                        configurationPath + "from.email." + company.toLowerCase(),
                        Company.KORNERSTONE.name().equalsIgnoreCase(company)?"CS@kornerstoneliving.com":
                            "CustomerService@uownleasing.com",
                        Company.KORNERSTONE.name().equalsIgnoreCase(company)?"uown.dev.kornerstone@uownleasing.com":"uown.dev@uownleasing.com"
                    ));
                    emailQueue.setStatus(QueueStatus.PENDING);
                    emailQueue.setLocation(template.getTemplateInfo().getLocation());
                    emailQueue.setCreatedBy(ThreadAttributes.getUsername());
                    emailQueue.setToEmailAddresses(((CommonDataPojo) dataMap.get("CommonDataPojo")).getCustomerEmailAddresses());
                    emailQueue.setId(String.valueOf(id));

                    try {
                        if (StringUtils.isBlank(emailQueue.getToEmailAddresses())) {
                            error = "Cannot create emailQueue due to null email address";
                            log.error(error);
                        } else if (Boolean.TRUE.equals(correspondenceRequest.getIsImmediate())) {
                            emailQueueService.sendEmail(emailQueue);
                        } else {
                            emailQueueService.createOrUpdateEmailQueue(emailQueue, null);
                        }
                    } catch (Exception e) {
                        log.error("Error creating email for correspondence", e);
                        error = Arrays.toString(e.getStackTrace());
                    }
                }
                else if(correspondenceRequest.getCorrespondenceType()==CorrespondenceType.SMS) {
                    log.debug("Creating Sms Queue request for Template {}, for Lead {}, for Account {}", correspondenceRequest.getTemplateName(), correspondenceRequest.getLeadPk(), correspondenceRequest.getAccountPk());
                    String mergedTemplate = thymeleafTemplateEngine.mergeDataIntoTemplateString(templateContent, dataMap, TemplateMode.TEXT);
                    SmsQueue smsQueue = new SmsQueue();
                    smsQueue.setAccountPk(correspondenceRequest.getAccountPk());
                    smsQueue.setLeadPk(correspondenceRequest.getLeadPk());
                    smsQueue.setDataMap(StringUtility.convertMapToString(dataMap));
                    smsQueue.setSmsBody(mergedTemplate);
                    smsQueue.setTemplateName(template.getTemplateInfo().getTemplateName());
                    smsQueue.setToPhoneNumber(((CommonDataPojo) dataMap.get("CommonDataPojo")).getCustomerPhoneNumbers());
                    smsQueue.setId(String.valueOf(id));
                    if(StringUtils.isNotBlank(smsQueue.getToPhoneNumber())) {
                        try {
                            String messageId = smsService.sendText(smsQueue);
                            log.debug("Sms created. PhoneNumber : {}, MessageId : {}", smsQueue.getToPhoneNumber(), messageId);
                        }
                        catch(Exception e) {
                            log.error("Cannot create smsQueue due to null phone number");
                            error = "Cannot create smsQueue due to null phone number";
                        }
                    }
                }

                if (correspondenceRequest.getAccountPk() != null) {
                    String createdBy = getCreatedBy(correspondenceRequest, SvThreadAttributes.getUsername());
                    svLoggingService.createActivityLog(correspondenceRequest.getAccountPk(), LogType.CORRESPONDENCE, false, null, "Created " + correspondenceRequest.getTemplateName() + " to be sent as " + correspondenceRequest.getCorrespondenceType(), createdBy);
                }
                if (correspondenceRequest.getLeadPk() != null) {
                    String createdBy = getCreatedBy(correspondenceRequest, LosThreadAttributes.getUsername());
                    losLoggingService.createActivityLog(correspondenceRequest.getLeadPk(), LogType.CORRESPONDENCE, false, null, "Created " + correspondenceRequest.getTemplateName() + " to be sent as " + correspondenceRequest.getCorrespondenceType(), createdBy);
                }
            } else {
                error = "No data associated with correspondence request";
            }
        } catch (Exception e) {
            log.error("Error creating correspondence ", e);
            error = Arrays.stream(e.getStackTrace()).map(StackTraceElement::toString).collect(Collectors.joining("\n"));
        }

        correspondenceLogService.logCorrespondence(correspondenceRequest.getAccountPk(), correspondenceRequest.getLeadPk(), correspondenceRequest.getTemplateName(),
            correspondenceRequest.getCorrespondenceType(),correspondenceRequest.getAccountPk() != null ? SystemSource.SVC : SystemSource.LOS, dataMap,
            String.format("accountPK:%d\nleadPK:%d\n%s", correspondenceRequest.getAccountPk(), correspondenceRequest.getLeadPk(), error));
    }

    private String getCreatedBy(CorrespondenceRequest correspondenceRequest, String createdBy) {
        if (!StringUtils.isBlank(correspondenceRequest.getCreatedBy()) && "SYSTEM".equalsIgnoreCase(createdBy)) {
            createdBy = correspondenceRequest.getCreatedBy();
        }
        return createdBy;
    }

    public void createCorrespondence(CorrespondenceRequest correspondenceRequest, String subject) {
        createCorrespondence(correspondenceRequest, subject, null);
    }

    public void createCorrespondence(CorrespondenceRequest correspondenceRequest) {
        createCorrespondence(correspondenceRequest, null, null);
    }

    public Map<String, Object> getDataMap(String sql, CommonDataPojo commonDataPojo) {
        Map<String, Object> dataMap = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        Query query = entityManager.createNativeQuery(sql);
        NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
        nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        List<Map<String, Object>> result = nativeQuery.getResultList();
        Statement stmt;
        for (Map<String, Object> res : result) {
            Set<String> keySet = res.keySet();
            for (String key : keySet) {
                if (key.toLowerCase().contains("commondatapojo")) {
                    try {
                        Object o = commonDataPojo;
                        Class<?> c = o.getClass();
                        for (Field field : c.getDeclaredFields()) {
                            if (field.getName().equalsIgnoreCase(key.substring(key.indexOf("_") + 1))) {
                                PropertyAccessor myAccessor = PropertyAccessorFactory.forBeanPropertyAccess(o);
                                if(field.getType()==long.class){
                                    if((long)myAccessor.getPropertyValue(field.getName()) <= 0){
                                        stmt = new Statement(o, "set"+StringUtils.capitalize(field.getName()), new Object[]{res.get(key)});
                                        stmt.execute();
                                    }
                                }
                                else {
                                    log.debug("field : {} , fieldValue: {}", field.getName(), myAccessor.getPropertyValue(field.getName()));
                                    if (myAccessor.getPropertyValue(field.getName()) == null) {
                                        if(res.get(key) != null) {
                                            stmt = new Statement(o, "set" + StringUtils.capitalize(field.getName()), new Object[]{res.get(key)});
                                            stmt.execute();
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Throwable th) {
                        th.printStackTrace();
                    }
                } else {
                    dataMap.put(key, res.get(key));
                }
            }
            dataMap.put("CommonDataPojo", commonDataPojo);
        }

        return dataMap;

    }


}






src/main/java/com/uownleasing/svc/service/FinalizeApplicationService.java
package com.uownleasing.svc.service;

import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.los.common.db.entity.LosCustomer;
import com.uownleasing.los.common.db.entity.LosEmployment;
import com.uownleasing.los.common.db.entity.LosLead;
import com.uownleasing.los.common.exception.LosCommonException;
import com.uownleasing.los.common.service.LosCustomerService;
import com.uownleasing.los.common.service.LosEmploymentService;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.pojo.FinalizeApplication;
import com.uownleasing.svc.pojo.FinalizeRequiredFields;
import com.uownleasing.svc.service.application.LeadShortCodeService;
import com.uownleasing.svc.uownClient.UownClientRouter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;

@Service
@Transactional
@RequiredArgsConstructor
@Validated
@Slf4j
public class FinalizeApplicationService {

    private final UownClientRouter clientRouter;
    private final ApprovalEmailService approvalEmailService;
    private final MerchantService merchantService;
    private final LeadService leadService;
    private final LeadShortCodeService leadShortCodeService;
    private final ApprovalSmsService approvalSmsService;
    private final LosCustomerService customerService;
    private final LosEmploymentService employmentService;
    private final ConfigurationManagement configurationManagement;
    private final LeadMaxApprovalService leadMaxApprovalService;
    private final String configurationPath = "com.uownleasing.svc.service.FinalizeApplicationService.";

    public FinalizeRequiredFields getFinalizeApplicationFields(String uuid, String shortCode) {
        LosLead lead;

        if (StringUtils.isNotBlank(uuid)) {
            lead = leadService.getByLeadUuidAndId(uuid);
        } else {
            lead = leadShortCodeService.getByLeadShortCodeAndStatus(shortCode, LeadStatus.UW_APPROVED);
        }

        if(lead == null){
            throw new LosCommonException("Invalid link. Please contact merchant");
        }
        FinalizeRequiredFields finalizeRequiredFields = new FinalizeRequiredFields();
        LosCustomer customer = customerService.getPrimaryCustomer(lead.getPk());
        LosEmployment employment = employmentService.getPrimaryEmploymentByCustomerPK(customer.getPk());
        finalizeRequiredFields.setLeadPk(lead.getPk());
        finalizeRequiredFields.setWelcomeMessageTitle(getWelcomeMessageTitle(customer.getCustomerInfo().getFirstName()));
        finalizeRequiredFields.setWelcomeMessageBody(getWelcomeMessageBody());
        if(employment == null || employment.getEmploymentInfo() == null){
            finalizeRequiredFields.getMissingFields().add("nextPayDate");
            finalizeRequiredFields.getMissingFields().add("payFrequency");
            finalizeRequiredFields.getMissingFields().add("employer");
            return finalizeRequiredFields;
        }
        var nextPayDate = employment.getEmploymentInfo().getNextPayDate();
        var payFrequency = employment.getEmploymentInfo().getNextPayDate();
        var employerName = employment.getEmploymentInfo().getEmployer();
        if (nextPayDate == null) finalizeRequiredFields.getMissingFields().add("nextPayDate");
        if (payFrequency == null) finalizeRequiredFields.getMissingFields().add("payFrequency");
        if (employerName == null) finalizeRequiredFields.getMissingFields().add("employer");
        if (finalizeRequiredFields.getMissingFields().isEmpty()) {
            finalizeRequiredFields.setMessage("Your application has been submitted. Please contact the sales representative in the store for further assistance.");
        }
        return finalizeRequiredFields;
    }

    public FinalizeApplication getFinalApprovalDetails(long leadPk) {
        FinalizeApplication finalizeApplication = new FinalizeApplication();
        LosLead lead = leadService.getByLeadPk(leadPk);
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        LosCustomer customer = customerService.getPrimaryCustomer(lead.getPk());
        setFinalizeApplicationDetails(finalizeApplication, customer, merchant, leadPk);
        setUnapprovedMessageIfLeadIsDenied(finalizeApplication, lead.getLeadInfo().getLeadStatus(), lead.getPk());
        if (StringUtils.isNotEmpty(finalizeApplication.getUnapprovedMessage())) return finalizeApplication;
        sendApprovalEmail(lead);
        sendApprovalSms(lead, finalizeApplication.getMaxApprovalAmount());
        return finalizeApplication;
    }

    private void setUnapprovedMessageIfLeadIsDenied(FinalizeApplication finalizeApplication, LeadStatus leadStatus, long leadPk) {
        if (leadStatus != LeadStatus.DENIED) return;
        String unapprovedMessage = configurationManagement.getString(configurationPath + "lead.denied.message", "Sorry, unfortunately your application is not accepted.");
        log.info("Unapproved lead at finalize application, leadPk: {}", leadPk);
        finalizeApplication.setUnapprovedMessage(unapprovedMessage);
    }

    private String getWelcomeMessageBody() {
        var defaultWelcomeMessageBody = "Thank you for selecting Uown Leasing to provide you with a simple lease to own payment program to complete your purchase. We need a couple of details from you to wrap things up—please complete the following information.";
        return configurationManagement.getString(configurationPath + "welcome.message.body.for.lead", defaultWelcomeMessageBody);
    }

    private String getWelcomeMessageTitle(String customerFirstName) {
        var defaultWelcomeMessageTitle = "Welcome " + customerFirstName + ". You have been pre-approved!";
        return configurationManagement.getString(configurationPath + "welcome.message.title.for.lead", defaultWelcomeMessageTitle);
    }

    private void setFinalizeApplicationDetails(FinalizeApplication finalizeApplication, LosCustomer customer, Merchant merchant, long leadPk) {
        finalizeApplication.setCustomerFirstName(customer.getCustomerInfo().getFirstName());
        finalizeApplication.setCustomerLastName(customer.getCustomerInfo().getLastName());
        finalizeApplication.setMerchantName(merchant.getMerchantInfo().getMerchantName());
        finalizeApplication.setMaxApprovalAmount(leadMaxApprovalService.calculateMaxApproval(leadPk));
    }

    private void sendApprovalEmail(LosLead lead) {
        approvalEmailService.sendApprovalEmail(
            lead,"",
            configurationManagement.getBoolean(configurationPath + "send.approval.email.in.async", true)
        );
    }

    private void sendApprovalSms(LosLead lead, BigDecimal maxApprovalAmount) {
        var leadHasPhone = lead.getLosPhones().stream().findFirst().isPresent() && !lead.getLosPhones().stream().findFirst().get().getPhoneInfo().getAreaCode().isEmpty();
        if (leadHasPhone) {
            var phoneNumber = lead.getLosPhones().stream().findFirst().get().getPhoneInfo().getAreaCode() + lead.getLosPhones().stream().findFirst().get().getPhoneInfo().getPhoneNumber();
            approvalSmsService.sendApprovalSms(
                lead,
                phoneNumber,
                maxApprovalAmount, "",
                configurationManagement.getBoolean(configurationPath + "send.approval.sms.in.async", true)
            );
        }
    }
}




src/main/java/com/uownleasing/svc/service/LeadService.java
package com.uownleasing.svc.service;

import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.uownleasing.common.enumeration.LeadStatus;
import com.uownleasing.common.enumeration.LogType;
import com.uownleasing.common.enumeration.UnderwritingStatus;
import com.uownleasing.common.pojo.*;
import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.dms.common.db.entity.EmailQueue;
import com.uownleasing.dms.common.db.entity.SmsQueue;
import com.uownleasing.dms.common.enumeration.AttachmentType;
import com.uownleasing.dms.common.enumeration.CorrespondenceType;
import com.uownleasing.dms.common.enumeration.EmailBodyType;
import com.uownleasing.dms.common.enumeration.Location;
import com.uownleasing.dms.common.pojo.AttachmentInfo;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.db.entity.SvSqlConfig;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.Merchant;
import com.uownleasing.svc.db.repository.ApplicationRepo;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.CommonDataPojo;
import com.uownleasing.svc.pojo.CorrespondenceRequest;
import com.uownleasing.svc.pojo.PreviousLeadsInfo;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.utility.SmsMessageBuilder;
import com.uownleasing.svc.utility.Snowflake;
import com.uownleasing.svc.utility.UrlBuilderUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class LeadService {
    private final ApplicationRepo appRepo;

    private final LosLeadService losLeadService;

    private final UpdateLeadStatusService updateLeadStatusService;

    private final LosEmploymentService employmentService;

    private final LosBankAccountService bankAccountService;

    private final LosReceivableService receivableService;

    private final MerchantService merchantService;

    private final LosInvoiceService invoiceService;

    private final LosItemService itemService;

    private final LosCreditCardService ccService;

    private final LosCustomerService customerService;

    private final UnderwritingService uwService;

    private final ConfigurationManagement configurationManagement;

    private final EntityManager entityManager;

    private final ObjectMapper mapper = new ObjectMapper();

    private final SvSqlConfigService sqlConfigService;

    private final LosLoggingService losLoggingService;

    private final CorrespondenceService correspondenceService;

    private final EmailQService emailQService;

    private final SmsService smsService;

    private final BlackListService blackListService;

    private final String configurationPath = "com.uownleasing.svc.service.LeadService.";

    public LosLead getMostRecentLeadForSsn(String ssn) {
        List<LosLead> leads = appRepo.getMostRecentLeadForSsn(ssn);
        return leads == null || leads.isEmpty() ? null : leads.get(0);
    }

    public LosLead getMostRecentLeadsForSsnAndMerchantPk(String ssn, Long merchantPk) {
        List<LosLead> leads = appRepo.getMostRecentLeadForSsnAndMerchantPk(ssn, merchantPk);
        return leads == null || leads.isEmpty() ? null : leads.get(0);
    }

    public LosUWData checkForDeniedUW(LosLead lead, List<LosLead> previousLeads, BigDecimal approvalAmount) {
        log.info("[LeadService][checkForDeniedUW] New lead {}, approvalAmount {}", lead.getPk(), approvalAmount);
        if (CollectionUtils.isNotEmpty(previousLeads)) {
            LosLead oldLead = previousLeads.get(previousLeads.size()-1);
            LosUWData uw = oldLead.getLosUWData();
            if(uw != null && uw.getUwInfo().getUwStatus().equals(UnderwritingStatus.DENIED)){
                log.info("[LeadService][checkForDeniedUW] Most recent lead {} is denied", oldLead.getPk());
                return uwService.copyUnderwriting(oldLead, lead, approvalAmount);
            }
        }
        return null;
    }

    public LosUWData createOrRetrieveUWForLead(LosLead lead, PreviousLeadsInfo previousLeadsInfo) {
        return uwService.createUnderwritingForLead(lead, previousLeadsInfo);
    }
//        List<LosLead> previousLeads = previousLeadsInfo.getPreviousLeads();
//        BigDecimal approvalAmount = previousLeadsInfo.getApprovalAmount();
//        Boolean checkExistingUw = configurationManagement.getBoolean("check.existing.uw.data.exists.for.lead", true);
//        LosCustomer customer = lead.getLosCustomers().iterator().next();
////        if(otherLead == null) {
////            otherLead = getMostRecentLeadForSsn(customer.getCustomerInfo().getSsn());
////        }
//        Boolean otherLeadExists = previousLeads != null && !previousLeads.isEmpty();
//        if(!checkExistingUw || !otherLeadExists){
//            uwData = uwService.runUnderwriting(lead);
//        }else{
//            String oldLeadPks = previousLeads.stream().map(l -> String.valueOf(l.getPk()))
//                .collect(Collectors.joining(", ", "", ""));
//            LosLead oldLead = previousLeads.get(previousLeads.size()-1);
//            uwData = checkForDeniedUW(lead, previousLeads, approvalAmount);
//            if (uwData == null) {
//                LosEmail oldEmail = oldLead.getLosEmails().iterator().next();
//                LosPhone oldPhone = oldLead.getLosPhones().iterator().next();
//                LosAddress oldAddress = oldLead.getLosAddresses().iterator().next();
//
//                LosEmail email = lead.getLosEmails().iterator().next();
//                LosPhone phone = lead.getLosPhones().iterator().next();
//                LosAddress address = lead.getLosAddresses().iterator().next();
//
//                String changed = "";
//                if (configurationManagement.getBoolean(configurationPath + "get.mismatched.lead.info", true)) {
//                    if (oldEmail != null && email != null && !oldEmail.getEmailInfo().getEmailAddress().trim().equalsIgnoreCase(email.getEmailInfo().getEmailAddress().trim()))
//                        changed += String.format("; Email: %s changed to %s", oldEmail.getEmailInfo().getEmailAddress(), email.getEmailInfo().getEmailAddress());
//                    if (oldPhone != null && phone != null && (!oldPhone.getPhoneInfo().getPhoneNumber().equals(phone.getPhoneInfo().getPhoneNumber())
//                        || !oldPhone.getPhoneInfo().getAreaCode().trim().equals(phone.getPhoneInfo().getAreaCode().trim())))
//                        changed += String.format("; Phone: (%s) %s changed to (%s) %s", oldPhone.getPhoneInfo().getAreaCode(), oldPhone.getPhoneInfo().getPhoneNumber(),
//                            phone.getPhoneInfo().getAreaCode(), phone.getPhoneInfo().getPhoneNumber());
//                    if (oldAddress != null && address != null && !oldAddress.getAddressInfo().getZipCode().trim().equals(address.getAddressInfo().getZipCode().trim()))
//                        changed += String.format("; Zipcode: %s changed to %s", oldAddress.getAddressInfo().getZipCode(), address.getAddressInfo().getZipCode());
//
//                    if (StringUtils.isNotBlank(changed)) {
//                        lead.getLeadInfo().setNotes("[LeadService][createOrRetrieveUWForLead] Data mismatch: " + changed);
//                        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "Data mismatch for UW: " + changed, ThreadAttributes.getUsername());
//                    }
//                }
//
//                if (StringUtils.isBlank(changed)) {
//                    lead.getLeadInfo().setSsnAlreadyExists(true);
//                    lead.getLeadInfo().setNotes("Copying UW due to data match");
//                    lead.getLeadInfo().setNotes("Given ssn " + customer.getCustomerInfo().getSsn().substring(5) + " already exists on lead(s) " + oldLeadPks);
//                    uwData = uwService.copyUnderwriting(previousLeads.get(0), lead, approvalAmount);
//                    // if not eligible set uw status to DENIED & create log -> uwDataRepo.save(uwData)
//                } else {
//                    if (configurationManagement.getBoolean(configurationPath + "check.old.lead.info.for.match", false)) {
//                        lead.getLeadInfo().setNotes("Rerunning UW due to data mismatch" + changed);
//                        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "Rerunning UW due to data mismatch", ThreadAttributes.getUsername());
//                        lead.getLeadInfo().setRerunUnderwriting(Boolean.TRUE);
//                        uwData = uwService.runUnderwriting(lead);
//                    } else {
//                        lead.getLeadInfo().setSsnAlreadyExists(true);
//                        lead.getLeadInfo().setNotes("Given ssn " + customer.getCustomerInfo().getSsn().substring(5) + " already exists on lead(s) " + oldLeadPks);
//                        losLoggingService.createActivityLog(lead.getPk(), LogType.INTERNAL, false, null, "Copying UW regardless of data mismatch", ThreadAttributes.getUsername());
//                        uwData = uwService.copyUnderwriting(previousLeads.get(0), lead, approvalAmount);
//                    }
//                }
//            }
//        }
//        return uwData;



    public FinancialInformation getFinancialInfoForLead(long leadPk){
        FinancialInformation financialInformation = new FinancialInformation();
        financialInformation.setLeadPk(leadPk);
        LosEmployment employment = employmentService.getPrimaryEmploymentByLeadPk(leadPk);
        financialInformation.setEmploymentInfo(employment != null ? employment.getEmploymentInfo() : null);
        List<LosBankAccount> bankAccounts = bankAccountService.getAllBankAccountsForLead(leadPk);
        List<LosCreditCard> creditCards = ccService.getByLeadPk(leadPk);

        //financialInformation.setBankAccountInfo(bankAccount != null ? bankAccount.getBankAccountInfo() : null);
        financialInformation.setBankAccounts(bankAccounts);
        financialInformation.setCreditCards(creditCards);
        //financialInformation.setCcInfo(losCreditCard != null ? losCreditCard.getCreditCardInfo() : null);
        return financialInformation;
    }

    public ScheduledPaymentsInformation getScheduledPayments(long leadPk){
        ScheduledPaymentsInformation scheduledPaymentsInformation = new ScheduledPaymentsInformation();
        scheduledPaymentsInformation.setLeadReceivables(receivableService.getActiveReceivablesOrderByDueDate(leadPk));
        return scheduledPaymentsInformation;
    }

    public InvoiceInformation getInvoiceInformation(long leadPk){
        InvoiceInformation invoiceInformation = new InvoiceInformation();
        invoiceInformation.setMerchantInfo(merchantService.getMerchantByLeadPk(leadPk).getMerchantInfo());
        LosInvoice invoiceForLead = invoiceService.getInvoiceForLead(leadPk);
        invoiceInformation.setInvoiceInfo(invoiceForLead != null ? invoiceForLead.getInvoiceInfo() : null);
        invoiceInformation.setItems(itemService.getAllItemsForLead(leadPk));
        return invoiceInformation;
    }

    public LosLead getByLeadPk(long leadPk) {
        LosLead losLead = losLeadService.getByLeadPk(leadPk);
        LosUWData uwData = uwService.getUWDataForLead(leadPk);
        if(uwData != null){
            losLead.getLeadInfo().setApprovalAmount(uwData.getUwInfo().getApprovalAmount());
        }
        return losLead;
    }

    public LosLead createOrUpdateLead(LeadInfo leadInfo) {
        if(StringUtils.isBlank(leadInfo.getId())){
            Snowflake snowflake = new Snowflake(SystemConfigurationManagement.getDatacenterId(), SystemConfigurationManagement.getWorkerId());
            leadInfo.setId(String.valueOf(snowflake.nextId()));
        }
        return losLeadService.createOrUpdateLead(leadInfo);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public LosLead createOrUpdateLeadWithNewTransaction(LeadInfo leadInfo) {
        return createOrUpdateLead(leadInfo);
    }

    public LosLead getByLeadUuid(String uuid) {
        return losLeadService.getByLeadUuid(uuid);
    }

    public LosLead getByLeadUuidAndId(String uuid, String id) {
        log.info("Lead Uuid {}, lead id {}", uuid, id);
        return losLeadService.getByLeadUuidAndId(uuid, id);
    }

    public LosLead getByLeadUuidAndId(String uuidWithId) {
        log.info("[LeadService][getByLeadUuidAndId] Lead UuidWithId {}", uuidWithId);
        LosLead lead = null;
        if (StringUtils.isNotBlank(uuidWithId)) {
            int separatorIndex = uuidWithId.lastIndexOf("_");
            if (separatorIndex > 0 && separatorIndex < uuidWithId.length() - 1) {
                String leadUuid = uuidWithId.substring(0, separatorIndex);
                String leadId = uuidWithId.substring(separatorIndex + 1);
                log.info("[LeadService][getByLeadUuidAndId] Parsed leadUuid: {}, leadId: {}", leadUuid, leadId);
                lead = losLeadService.getByLeadUuidAndId(leadUuid, leadId);
            }
        }
        return lead;
    }

    public LosLead updateLead(LeadInfo leadInfo) {
        return losLeadService.updateLead(leadInfo);
    }

    public LeadInfo updateBankruptcyInfo(LeadInfo leadInfo) {
        LeadInfo info = losLeadService.getByLeadPk(leadInfo.getLeadPk()).getLeadInfo();
        if (info == null) {
            throw new SvcException("Please provide a valid leadPk");
        }
        info.setPastBankruptcy(leadInfo.getPastBankruptcy());
        info.setCurrentOrFutureBankruptcy(leadInfo.getCurrentOrFutureBankruptcy());
        losLeadService.updateLead(info);
        return info;
    }
//    public FinancialUpdate createOrUpdateFinancialInfo(FinanceInfo financeInfo) {
//        FinancialUpdate updatedInfo=new FinancialUpdate();
//
//        if (financeInfo.getCcInfo() != null) {
//            LosCreditCard losCreditCard= (LosCreditCard) ccTransactionService.createOrUpdate(financeInfo.getCcInfo());
//            updatedInfo.setLosCreditCard(losCreditCard);
//        }
//        if (financeInfo.getBankAccountInfo() !=null){
//            LosBankAccount losBankAccount= bankAccountService.createOrUpdateBankAccount(financeInfo.getBankAccountInfo());
//            updatedInfo.setLosBankAccount(losBankAccount);
//        }
//        return updatedInfo;
//    }

    public LeadInfo toggleAlertsForLead(long leadPk, boolean toggleAlert) {
        LeadInfo leadInfo = losLeadService.getByLeadPk(leadPk).getLeadInfo();
        leadInfo.setShowAlerts(toggleAlert);
        return losLeadService.updateLead(leadInfo).getLeadInfo();
    }

    public List<LeadStatus> getAllLeadStatuses() {
        return List.of(LeadStatus.values());
    }

    public List<LeadStatus> getAllInternalStatuses() {
        List<String> allInternalStatus =
            List.of(configurationManagement.getString(
                    configurationPath + "internal.status", "ACCOUNT_STATUS_INELIGIBLE, ACCOUNT_UNDERPAID, ACH_NOT_CLEARED, ACH_NOT_CLEARED_DUP_EMAIL, ACH_NOT_CLEARED_DUP_PHONE, ADDRESS_MISMATCH, BANK_VERIFICATION_ERROR, BLACKLIST_APPROVED, BLACKLIST_DENIED, BLACKLISTED, CANCELLED_DUP_DENIAL, CANCELLED_DUP_SSN, CC_AUTH_FAILED, CC_VALIDATION_FAILED, CONTRACT_CREATED, DELINQUENCY_DENIED, DELINQUENT_ACCOUNT, DELINQUENT_ACCOUNT_DUP_EMAIL, DELINQUENT_ACCOUNT_DUP_PHONE, DUP_EMAIL_DATA_MISMATCH, DUP_FRAUD_DENIED, DUP_LEXISNEXIS_DENIED, DUP_NEUSTAR_DENIED, DUP_PHONE_DATA_MISMATCH, DUP_SENTILINK_DENIED, EMAIL_COUNT_FAILED, EXPIRED, FPD_IN_FUTURE, FPD_IN_FUTURE_DUP_EMAIL, FPD_IN_FUTURE_DUP_PHONE, FRAUD_DENIED, FRAUD_ERROR, FUNDED, FUNDING, INTELLICHECK_FAILED, INVOICE_CANCELLED, INVOICE_CREATED, LEXISNEXIS_DENIED, LEXISNEXIS_ERROR, NEUSTAR_DENIED, NO_BUSINESS_IN_STATE, NO_PROGRAM_IN_STATE, PENDING_UW, PHONE_COUNT_FAILED, PRE_AUTH_FAILED, SENTILINK_DENIED, SENTILINK_DENIED_SSN_TYPO, SIGNED, SIGNING_FEE_DENIED, SOURCE_INELIGIBLE, UW_APPROVED, UW_DENIED, UW_ERROR, UWENGINE_ERROR, UWENGINE_FAILED, INCOMPLETE, INTELLICHECK_UPLOADED, INTELLICHECK_UPLOAD_ERROR, INTELLICHECK_RESULTS_ERROR, INTELLICHECK_ERRORED,NEURO_ID_DENIED,NEURO_ID_APPROVED,NEURO_ID_ERROR,SEON_ID_FAILED,SEON_ID_UPLOADED,SEON_ID_APPROVED,PLAID_PENDING,PLAID_SUBMITTED,PLAID_ABANDONED,PLAID_ERROR,PLAID_IN_PROCESS,PLAID_FAILED,PLAID_SUCCESS")
                .split(","));

        List<LeadStatus> allDistinctInternalStatus = new ArrayList<>();
        for (String internalStatus : allInternalStatus) {
            allDistinctInternalStatus.add(LeadStatus.valueOf(internalStatus.trim()));
        }

        return allDistinctInternalStatus;
    }

    public void sendBankVerificationDeclinedEmail(long leadPk) {
        LosLead lead = getByLeadPk(leadPk);
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        LosCustomer customer = customerService.getPrimaryCustomer(leadPk);
        String envName = System.getenv("ENVIRONMENT_NAME");
        String env = !org.thymeleaf.util.StringUtils.isEmpty(envName) ? envName : null;
        String redirectUrl = UrlBuilderUtils.buildCompleteUrl(merchant.getMerchantInfo().getClientType(), env, lead.getLeadInfo().getShortCode());
        CorrespondenceRequest request = new CorrespondenceRequest();
        request.setLeadPk(leadPk);
        request.setLocation(Location.SVC);
        request.setCustomerPk(customer.getPk());
        request.setTemplateName("BankVerificationDeclinedEmail");
        request.setCorrespondenceType(CorrespondenceType.EMAIL);

        CommonDataPojo cdp = new CommonDataPojo();
        cdp.setPaymentOptionUrl(redirectUrl);
        request.setCommonDataPojo(cdp);

        correspondenceService.createCorrespondence(request);
    }


    public void sendFundingReport(List<Long> merchantPks, String frequency, AtomicReference<String> error) {
        sendFundingReport(merchantPks, false, frequency, error);
    }

    public void sendFundingReport(List<Long> merchantPks, boolean consolidated, String frequency, AtomicReference<String> error) {
        String csv;
        String reportName = "Funding Report_%s";
        String fundingReportDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        if (consolidated) {
            try {
                Merchant m = merchantService.getMerchantByPk(merchantPks.get(0));
                reportName += " [%s]";
                reportName = String.format(reportName, frequency.toUpperCase(), fundingReportDate);
                csv = createFundingReport(merchantPks, frequency);
                createAndSendFundingReportToEmails(csv, reportName, m.getMerchantInfo().getMergedFundingReportEmails());
            } catch (Exception e) {
                log.error("Error sending merged funding report", e);
                error.set(error.get() + "\n" + e.getMessage());
            }
        } else {
            for (Long pk : merchantPks) {
                try {
                    Merchant m = merchantService.getMerchantByPk(pk);
                    reportName += "_%s [%s]";
                    reportName = String.format(reportName, m.getMerchantInfo().getLocationName(), frequency.toUpperCase(), fundingReportDate);
                    csv = createFundingReport(List.of(pk), frequency);
                    createAndSendFundingReportToEmails(csv, reportName, m.getMerchantInfo().getFundingReportEmails());
                } catch (Exception e) {
                    log.error("Error sending funding report to merchant pk {}", pk, e);
                    error.set(String.format("%s merchantPk %d -> %s%n", error.get(), pk, e.getMessage()));
                }
            }
        }
    }

    private String createFundingReport(List<Long> merchantPks, String frequency) {
        if (CollectionUtils.isNotEmpty(merchantPks)) {
            SvSqlConfig config = sqlConfigService.getSqlConfigBySqlName("getFundingReport");
            String sql = config.getSqlConfigInfo().getSqlQuery();
            sql = sql.replaceAll("(?i):merchantPks", StringUtils.join(merchantPks, ','))
                .replaceAll("(?i):frequency", "'" + frequency.toUpperCase() + "'");

            List<String> keys = new ArrayList<>();
            Matcher matcher = Pattern.compile("(?i)(as) (\"[A-Z]+[^\"]*\")").matcher(sql);
            matcher.results().forEach(r -> keys.add(r.group().replaceAll("(?i)as ", "").replace("\"", "")));

            Query query = entityManager.createNativeQuery(sql);
            NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
            nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
            List<Map<String, Object>> fundingList = nativeQuery.getResultList();

            NumberFormat formatter = NumberFormat.getCurrencyInstance();
            StringBuilder csv = new StringBuilder(StringUtils.join(keys, ",")).append("\n");
            for (Map<String, Object> map : fundingList) {
                for (String key : keys) {
                    if (map.get(key) instanceof Double || map.get(key) instanceof BigDecimal) {
                        csv.append("\"").append(formatter.format(map.get(key))).append("\"");
                    } else if (String.valueOf(map.get(key)).contains(",")) {
                        csv.append("\"").append(map.get(key)).append("\"");
                    } else {
                        csv.append(map.get(key));
                    }

                    if (keys.indexOf(key) != keys.size() - 1) {
                        csv.append(",");
                    }
                }
                csv.append("\n");
            }
            return csv.toString();
        }
        return null;
    }

    private void createAndSendFundingReportToEmails(String reportCsv, String reportName, String toEmails) {
        if (StringUtils.isNotBlank(reportCsv) && StringUtils.isNotBlank(toEmails)) {
            EmailQueue email = new EmailQueue();
            email.setSubject(reportName);
            email.setEmailBodyType(EmailBodyType.TEXT);
            email.setEmailBody("Attached is the Funding Report");
            email.setToEmailAddresses(toEmails);
            email.setLocation(Location.LOS);

            if (SystemConfigurationManagement.isProduction()) {
                email.setFromEmailAddress(configurationManagement.getString(configurationPath + "from.funding.email.uown", "funding@uownleasing.com"));
            } else {
                email.setFromEmailAddress(configurationManagement.getString(configurationPath + "from.funding.email.uown", "uown.dev@uownleasing.com"));
            }

            AttachmentInfo attachmentInfo = new AttachmentInfo();
            attachmentInfo.setAttachmentType(AttachmentType.CSV);

            attachmentInfo.setContent(reportCsv.getBytes(StandardCharsets.UTF_8));
            attachmentInfo.setName(reportName + ".csv");
            emailQService.createOrUpdateEmailQueue(email, List.of(attachmentInfo));
        }
    }

    public void sendFinalizeEmailAfterVerification(long leadPk) {
        LosLead lead = losLeadService.getByLeadPk(leadPk);
        Merchant merchant = merchantService.getMerchantByLeadPk(leadPk);
        String envName = System.getenv("ENVIRONMENT_NAME");
        String env = !org.thymeleaf.util.StringUtils.isEmpty(envName) ? envName : null;
        String redirectUrl = (env != null
            ? "https://origination-" + env + ".uownleasing.com/completeEsign?uuid="
            : configurationManagement.getString(configurationPath + "bank.verified.redirect.base.url", "https://origination-dev1.uownleasing.com/completeEsign?uuid="))
            + lead.getLeadInfo().getUuid() + "_" + lead.getLeadInfo().getId();

        CorrespondenceRequest request = new CorrespondenceRequest();
        request.setLeadPk(lead.getPk());
        request.setTemplateName("FinalizeVerifiedPurchaseEmail");
        request.setCorrespondenceType(CorrespondenceType.EMAIL);
        request.setCreatedBy(ThreadAttributes.getUsername());
        CommonDataPojo cdp = new CommonDataPojo();
        cdp.setPaymentOptionUrl(redirectUrl);
        request.setCommonDataPojo(cdp);

        if (configurationManagement.getBoolean(configurationPath + "send.finalize.email.in.async", true)) {
            correspondenceService.createCorrespondenceAsync(request);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseEmail after bank verification in async.");
        } else {
            correspondenceService.createCorrespondence(request);
            lead.getLeadInfo().setNotes("[UownClient][sendFinalizeEmailToCustomer] sending FinalizePurchaseEmail after bank verification in sync.");
        }

        if (configurationManagement.getBoolean(configurationPath + "send.verified.finalize.text", true)) {
            Set<LosPhone> phones = lead.getLosPhones();
            Set<LosCustomer> customers = lead.getLosCustomers();
            LosInvoice invoice = lead.getLosInvoice();
            if (CollectionUtils.isNotEmpty(phones) && CollectionUtils.isNotEmpty(customers) && invoice != null) {
                LosPhone phone = phones.stream().findFirst().orElse(null);
                LosCustomer customer = customers.stream().findFirst().orElse(null);

                if (phone != null && customer != null) {
                    SmsQueue sms = new SmsQueue();
                    sms.setLeadPk(lead.getPk());
                    String template = configurationManagement.getString(
                        configurationPath + "verified.finalize.text.body",
                        "Hi, %s %s!%n Finalize your purchase of $%s, with Uown. Please follow the link below to finalize your purchase.%n%s%n Reply STOP to Unsubscribe. Uownleasing"
                    );
                    sms.setSmsBody(
                        SmsMessageBuilder.buildVerifiedFinalizeMessage(
                            merchant.getMerchantInfo().getClientType(),
                            customer.getCustomerInfo().getFirstName(),
                            customer.getCustomerInfo().getLastName(),
                            invoice.getInvoiceInfo().getTotalInvoiceAmount(),
                            redirectUrl,
                            template
                        )
                    );
                    sms.setToPhoneNumber(phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber().toString());
                    sms.setTemplateName("FinalizeAfterVerification");
                    smsService.sendText(sms);
                    losLoggingService.createActivityLog(lead.getPk(),  LogType.CORRESPONDENCE, false, null, "Finalize after Verification text message sent to " + phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber().toString(), "");
                }
            }
        }
    }

    public MerchantRebateResults getRebateAmount(MerchantRebateRequest request) {
        SvSqlConfig sqlConfig = sqlConfigService.getSqlConfigBySqlName("getRebateAmount");
        String sql = sqlConfig.getSqlConfigInfo().getSqlQuery();
        sql = sql.replace(":merchantPks", CollectionUtils.isNotEmpty(request.getMerchantPks()) ? StringUtils.join(request.getMerchantPks(), ",") : "null");
        sql = sql.replace(":from", "'" + (request.getFrom() == null ? LocalDate.now() : request.getFrom()) + "'" );
        sql = sql.replace(":to", "'" + (request.getTo() == null ? LocalDate.now() : request.getTo()) + "'");
        sql = sql.replace(":max", request.getMaxResults() != null && request.getPageNumber() != null ? request.getMaxResults().toString() : "null");
        sql = sql.replace(":pageOffset", request.getMaxResults() != null && request.getPageNumber() != null ? ((Integer)(request.getPageNumber() * request.getMaxResults())).toString() : "null");
        sql = sql.replace(":merchantRefCodes", CollectionUtils.isEmpty(ThreadAttributes.getMerchantReferenceCodes()) ? "'*'" : "'" + String.join("','", ThreadAttributes.getMerchantReferenceCodes()) + "'");

        Query query = entityManager.createNativeQuery(sql);
        NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
        nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        List<Map<String, Object>> result = nativeQuery.getResultList();
        mapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
        mapper.registerModule(new JavaTimeModule());
        mapper.registerModule(new Jdk8Module());
        return new MerchantRebateResults(result.stream()
            .map(o -> {
                try {
                    return
                        mapper.readValue(mapper.writeValueAsString(o), MerchantRebateInfo.class);
                } catch (Exception e) {
                    log.info("Error message ", e);
                }
                return null;
            }).collect(Collectors.toList()), request);
    }

    public Map<String, String> leadStatusToMap() {
        Map<String, String> leadStatuses = new HashMap<>();
        for (LeadStatus status : LeadStatus.values()) {
            leadStatuses.put(status.name(), status.getUserFriendlyText());
        }
        return leadStatuses;
    }

    public void blackListAllItemsForLead(Long leadPk) {
        LosLead lead = getByLeadPk(leadPk);

        Optional<CustomerInfo> customerInfoOptional = Optional.ofNullable(customerService.getPrimaryCustomer(lead.getPk()))
            .map(LosCustomer::getCustomerInfo);

        Optional<PhoneInfo> phoneInfoOptional = lead.getLosPhones().stream().findFirst().map(LosPhone::getPhoneInfo);

        Optional<EmailInfo> emailInfoOptional = lead.getLosEmails().stream().findFirst().map(LosEmail::getEmailInfo);

        Optional<BankAccountInfo> bankAccountInfoOptional = Optional.ofNullable(bankAccountService.getAutoPayBankAccountForLead(leadPk))
            .map(LosBankAccount::getBankAccountInfo);

        Optional<AddressInfo> addressInfoOptional = lead.getLosAddresses().stream()
            .findFirst()
            .map(LosAddress::getAddressInfo);

        customerInfoOptional.ifPresent(customerInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setFirstName(customerInfo.getFirstName());
            blackListInfo.setLastName(customerInfo.getLastName());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);

            blackListInfo = new BlackListInfo();
            blackListInfo.setSsn(customerInfo.getSsn());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        phoneInfoOptional.ifPresent(phoneInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setPhoneNumber(phoneInfo.getAreaCode() +
                phoneInfo.getPhoneNumber().toString());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        emailInfoOptional.ifPresent(emailInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setEmailAddress(emailInfo.getEmailAddress());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        bankAccountInfoOptional.ifPresent(bankAccountInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setBankAccountNumber(bankAccountInfo.getAccountNumber());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });

        addressInfoOptional.ifPresent(addressInfo -> {
            BlackListInfo blackListInfo = new BlackListInfo();
            blackListInfo.setStreetAddress1(addressInfo.getStreetAddress1());
            blackListInfo.setZipCode(addressInfo.getZipCode());
            blackListInfo.setLeadPk(leadPk);
            blackListService.createOrUpdateBlackListItem(blackListInfo);
        });
        String notes = "[LeadService][BlackListLead] BlackListed First Name Last Name, Email, Phone Number, ssn, Bank Account Num, Street Address Zip Code for the Lead: " + leadPk;
        updateLeadStatusService.updateLeadStatus(lead,LeadStatus.BLACKLISTED, LeadStatus.BLACKLISTED, notes, "BlackListed All Items for the Lead ", LogType.INTERNAL);
    }

}



src/main/java/com/uownleasing/svc/uownClient/UownClient.java
package com.uownleasing.svc.uownClient;

import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.enumeration.Company;
import com.uownleasing.common.pojo.*;
import com.uownleasing.dms.common.db.entity.SmsQueue;
import com.uownleasing.dms.common.enumeration.CorrespondenceType;
import com.uownleasing.los.common.db.config.LosThreadAttributes;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.common.service.SvSqlConfigService;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.config.configuration.ConfigurationManagement;
import com.uownleasing.svc.db.entity.*;
import com.uownleasing.svc.enumeration.*;
import com.uownleasing.svc.exceptions.SvcException;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.application.CCCheckService;
import com.uownleasing.svc.service.application.UserAgentService;
import com.uownleasing.svc.service.cc.CCTransactionService;
import com.uownleasing.svc.utility.DateUtils;
import com.uownleasing.svc.utility.SmsMessageBuilder;
import com.uownleasing.svc.utility.UrlBuilderUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.query.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import javax.persistence.EntityManager;
import javax.persistence.Query;
import javax.validation.Valid;
import javax.validation.Validator;
import java.io.FileInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
@Validated
@Slf4j
public abstract class UownClient {
    @Autowired
    private LeadService leadService;

    @Autowired
    private LeadManagementService leadManagementService;

    @Autowired
    private LosCustomerService customerService;

    @Autowired
    private LosEmailService emailService;

    @Autowired
    private LosPhoneService phoneService;

    @Autowired
    private LosEmploymentService employmentService;

    @Autowired
    private LosBankAccountService bankAccountService;

    @Autowired
    private LosInvoiceService invoiceService;

    @Autowired
    private LosItemService itemService;

    @Autowired
    private MerchantService merchantService;

    @Autowired
    private LosCreditCardService creditCardService;

    @Autowired
    private ConfigurationManagement configurationManagement;

    @Autowired
    private IdVerificationService idVerificationService;

    @Autowired
    private LosCreditCardTransactionService losCreditCardTransactionService;

    @Autowired
    private CCTransactionService ccTransactionService;

    @Autowired
    private LosPaymentOptionsService paymentOptionsService;

    @Autowired
    private LosLoggingService loggingService;

    @Autowired
    private CorrespondenceService correspondenceService;

    @Autowired
    private UnderwritingService underwritingService;

    @Autowired
    private ContractService svcContractService;

    @Autowired
    private CalculatorService calculatorService;

    @Autowired
    private Validator validator;

    @Autowired
    private IntellicheckService intellicheckService;

    @Autowired
    private FundingBankAccountService fundingBankAccountService;

    @Autowired
    private LosLoggingService losLoggingService;

    @Autowired
    private UpdateLeadStatusService updateLeadStatusService;

    @Autowired
    private SvSqlConfigService sqlConfigService;

    @Autowired
    private LeadFundingService leadFundingService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private NeuroIdVerificationService neuroIdVerificationService;

    @Autowired
    private UserAgentService userAgentService;

    @Autowired
    private CCCheckService ccCheckService;

    @Autowired
    LeadCustomerService leadCustomerService;

    @Autowired
    private BlackListService blackListService;

    protected String configurationPath = "com.uownleasing.svc.uownclient.UownClient.";

    private Map<String,String> propertiesMap;

    public UownClient(){
    }

    private void constructProperties() {
        propertiesMap = getProperties();
    }

    private Map<String,String> getProperties() {
        String propertiesFilePath = "merchant/credentials.properties";
        Properties properties = new Properties();
        Resource resource = new ClassPathResource(propertiesFilePath);
        Map<String, String> map;
        try (InputStream inputStream = new FileInputStream(resource.getFile())) {
            properties.load(inputStream);
            map = new HashMap(properties.entrySet()
                .stream()
                .collect(Collectors.toMap(e -> e.getKey().toString(),
                    e -> e.getValue().toString())));
        } catch (Throwable th) {
            th.printStackTrace();
            return null;
        }
        return map;
    }

    private CCTransactionInfo validateCreditCardBin(CCInfo ccInfo, LosLead lead) {
        String ccBin = null;
        String ccNumber = ccInfo.getCcNumber();
        if (StringUtils.isNotBlank(ccNumber) && ccNumber.length() >= 10 && !ccNumber.contains("*")) {
            ccBin = ccNumber.substring(0, 6);
        }

        if (configurationManagement.getBoolean(configurationPath + "check.cc.bin.blacklist", Boolean.FALSE, Boolean.TRUE)
            && StringUtils.isNotBlank(ccBin)) {
            List<LosBlackList> binBlackListResults = blackListService.checkBlackList(null, null, null, null, null, null, null, null, null, ccBin);
            if (CollectionUtils.isNotEmpty(binBlackListResults)) {
                CCTransactionInfo ccTransactionInfo = new CCTransactionInfo();
                ccTransactionInfo.setCcInfo(ccInfo);
                ccTransactionInfo.setStatus(CCTransactionStatus.ERROR);
                ccTransactionInfo.setError("Failed to verify card");
                ccTransactionInfo.setCcTransactionType(CCTransactionType.BLACKLIST_CHECK);

                String note = "Credit card BIN " + ccBin + " is blacklisted";
                updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.BLACKLIST_DENIED, "[UownClient][authorizeCreditCard] " + note, note, LogType.INTERNAL);
                log.info("[UownClient][authorizeCreditCard] Credit card BIN {} is blacklisted", ccBin);
                return ccTransactionInfo;
            }
        }
        return null;
    }

    public CCTransactionInfo validateCreditCardBinMatch(CCInfo ccInfo, LosLead lead) {
        if (ccInfo == null || lead == null) {
            return null;
        }
        String ccNumber = ccInfo.getCcNumber();
        if (StringUtils.isBlank(ccNumber) || ccNumber.length() < 10 || ccNumber.contains("*")) {
            return null;
        }
        String cardBin = ccNumber.substring(0, 6);
        String leadBin = lead.getLeadInfo().getCreditCardBin();
        if (StringUtils.isBlank(leadBin)) {
            return null;
        }
        String normalizedLeadBin = leadBin.trim();
        if (normalizedLeadBin.length() < 6) {
            return null;
        }
        normalizedLeadBin = normalizedLeadBin.substring(0, 6);
        if (!cardBin.equals(normalizedLeadBin)) {
            CCTransactionInfo ccTransactionInfo = new CCTransactionInfo();
            ccTransactionInfo.setCcInfo(ccInfo);
            ccTransactionInfo.setStatus(CCTransactionStatus.ERROR);
            ccTransactionInfo.setErrorCode("BIN_MISMATCH");
            ccTransactionInfo.setError("Please use the same card you used when you submitted your application.");
            ccTransactionInfo.setCcTransactionType(CCTransactionType.BIN_MISMATCH);
            log.info("[UownClient][validateCreditCardBinMatch] Credit card BIN {} does not match lead BIN {}", cardBin, normalizedLeadBin);
            return ccTransactionInfo;
        }
        return null;
    }

    public CCTransactionInfo authorizeCreditCard(CCInfo ccInfo) {
        log.info("[UownClient] authorizeCreditCard for CCInfo CardHolder {}", ccInfo.getCcFirstName()+" "+ccInfo.getCcLastName());
        LosLead lead = leadService.getByLeadPk(ccInfo.getLeadPk());
        CCTransactionInfo binValidationResult = validateCreditCardBin(ccInfo, lead);
        if (binValidationResult != null) {
            return binValidationResult;
        }

        CCTransactionInfo ccTransactionInfo = null;
        if (configurationManagement.getBoolean(configurationPath + "skip.multiple.cc.auth", Boolean.TRUE)
            && ccInfo.getLeadPk() != null && ccInfo.getLeadPk() > 0) { // don't rerun authorization if it has already been run before
            List<LosCreditCardTransaction> foundApprovedTransactions = ccTransactionService.getAuthorizedCCsForLead(ccInfo);
            if (CollectionUtils.isNotEmpty(foundApprovedTransactions)) {
                // 99% of the time, there should only be one CC that matches all these parameters, but in lowers, we all use the same CC numbers,
                // so it's more than likely that this will return more than one result. getting the first element in the list (newest) should be good enough
                log.info("[UownClient][authorizeCreditCard] credit card was previously authorized. skip running another authentication transaction.");
                ccTransactionInfo = foundApprovedTransactions.get(0).getCreditCardTransactionInfo();
            }
        }

        BigDecimal fee = calculatorService.getFeeToBeChargedForLead(lead);
        fee = fee == null || fee.compareTo(BigDecimal.ZERO) <= 0 ? BigDecimal.valueOf(configurationManagement.getDouble(configurationPath + "default.amount.to.authenticate", 0.01)).setScale(2, RoundingMode.HALF_EVEN) : fee;

        if (ccTransactionInfo == null) {
            if (configurationManagement.getBoolean(configurationPath + "check.duplicate.cc", true)) {
                SqlConfigInfo info = sqlConfigService.getSqlConfigBySqlName("checkCountOfDuplicateCC").getSqlConfigInfo();
                String sql = info.getSqlQuery()
                    .replaceAll("(?i):firstName", StringUtils.isNotBlank(ccInfo.getCcFirstName())
                        ? "'" + ccInfo.getCcFirstName() + "'" : "null")
                    .replaceAll("(?i):lastName", StringUtils.isNotBlank(ccInfo.getCcLastName())
                        ? "'" + ccInfo.getCcLastName() + "'" : "null")
                    .replaceAll("(?i):ccNumber", StringUtils.isNotBlank(ccInfo.getCcNumber())
                        ? "'" + ccInfo.getCcNumber() + "'" : "null")
                    .replaceAll("(?i):ccExp", StringUtils.isNotBlank(ccInfo.getCcExp())
                        ? "'" + ccInfo.getCcExp() + "'" : "null");

                Query query = entityManager.createNativeQuery(sql);
                NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
                nativeQuery.setResultTransformer(AliasToEntityMapResultTransformer.INSTANCE);
                List<Map<String, Object>> result = nativeQuery.getResultList();

                if (CollectionUtils.isNotEmpty(result)) {
                    Map<String, Object> count = result.get(0);
                    if (((BigInteger) count.getOrDefault("ccCount", 0)).intValue() >= configurationManagement.getInteger(configurationPath + "max.duplicate.cc", 3)) {
                        ccTransactionInfo = new CCTransactionInfo();
                        ccTransactionInfo.setCcInfo(ccInfo);
                        ccTransactionInfo.setStatus(CCTransactionStatus.ERROR);

                        String note = "Exceeded max amount of duplicate credit cards";
                        updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.CC_COUNT_FAILED, "[UownClient][authorizeCreditCard] " + note, note, LogType.INTERNAL);
                        return ccTransactionInfo;
                    }
                }
            }
        }

        int hash = ccInfo.createHash();
        if (ccTransactionInfo == null && configurationManagement.getBoolean(configurationPath + "check.prev.auth.for.customer.and.card", Boolean.TRUE)) {
            LosCustomer customer = customerService.getPrimaryCustomer(ccInfo.getLeadPk());
            LosEmail email = emailService.getPrimaryEmailByCustomerPK(customer.getPk());
            LosPhone phone = phoneService.getPhonesByCustomerPK(customer.getPk()).get(0);

            List<LosCreditCardTransaction> prevAuths = losCreditCardTransactionService.getPreviousApprovedAuthForCustomerAndCardSinceHours(
                customer.getCustomerInfo().getSsn(),
                email.getEmailInfo().getEmailAddress(),
                phone.getPhoneInfo().getAreaCode() + phone.getPhoneInfo().getPhoneNumber(),
                hash, configurationManagement.getInteger(configurationPath + "hours.since.last.auth.on.card", 8), fee
            );
            if (CollectionUtils.isNotEmpty(prevAuths)) {
                log.info("[UownClient][authorizeCreditCard] credit card was previously authorized on different lead. Moving auth to new lead");
                CCTransactionInfo prevAuth = prevAuths.get(0).getCreditCardTransactionInfo();

                CCTransactionInfo info = new CCTransactionInfo();
                BeanUtils.copyProperties(prevAuth, info);
                info.setCreditCardTransactionPk(0L);
                info.setLeadPk(ccInfo.getLeadPk());

                CCInfo prevCCInfo = creditCardService.getByAutoPayByLeadPkAndCCHash(prevAuth.getLeadPk(), hash).getCreditCardInfo();
                CCInfo newCCInfo = new CCInfo();
                BeanUtils.copyProperties(prevCCInfo, newCCInfo);
                newCCInfo.setCreditCardPk(0L);
                newCCInfo.setLeadPk(ccInfo.getLeadPk());
                info.setCcInfo(newCCInfo);

                prevAuth.setStatus(CCTransactionStatus.REUSED);

                losCreditCardTransactionService.createOrUpdateTransaction(prevAuth);
                ccTransactionInfo = losCreditCardTransactionService.createOrUpdateTransaction(info).getCreditCardTransactionInfo();
                ccInfo = info.getCcInfo();

                loggingService.createActivityLog(ccInfo.getLeadPk(), LogType.INTERNAL, null, null, "Previous Auth from lead " + prevAuth.getLeadPk() + " reused", ThreadAttributes.getUsername());
                loggingService.createActivityLog(prevCCInfo.getLeadPk(), LogType.INTERNAL, null, null, "Auth reused on new lead " + ccInfo.getLeadPk(), ThreadAttributes.getUsername());
            }
        }

        if (ccTransactionInfo == null) {
            lead.getLeadInfo().setNotes("[UownClient][authorizeCreditCard] Running authentication for credit card with amount " + fee);
            ccTransactionInfo = ccTransactionService.authorizeAndTokenizeCardForTransaction(ccInfo, fee);
        }

        if (ccTransactionInfo.getStatus() == CCTransactionStatus.ERROR || ccTransactionInfo.getStatus() == CCTransactionStatus.DENIED) {
            if (ccTransactionInfo.getCcInfo().getPreAuthStatus() == PreAuthStatus.DENIED) {
                String kountNotes = "Kount PreAuthentication failed";
                updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.PRE_AUTH_FAILED, "[UownClient][authorizeCreditCard] " + kountNotes, kountNotes, LogType.INTERNAL);
            } else {
                String notes = "CC auth failed: " + ccTransactionInfo.getError();
                updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.CC_AUTH_FAILED, "[UownClient][authorizeCreditCard] " + notes, notes, LogType.CREDIT_CARD);
            }
            losLoggingService.createActivityLog(lead.getPk(), LogType.CREDIT_CARD, Boolean.FALSE, null, "Invalid Credit Card", ThreadAttributes.getUsername());
        } else {
            String note = "CC Auth Passed";
            updateLeadStatusService.updateLeadStatus(lead, null, LeadStatus.CC_AUTH_PASSED, "[submitApplication] " + note, note, LogType.INTERNAL);
        }
        return ccTransactionInfo;
    }

    public CCTransactionInfo declineCreditCard(CCInfo ccInfo) {
        CCTransactionInfo ccTransactionInfo = new CCTransactionInfo();
        ccTransactionInfo.setCcInfo(ccInfo);
        ccTransactionInfo.setLeadPk(ccInfo.getLeadPk());
        ccTransactionInfo.setAccountPk(ccInfo.getAccountPk());
        ccTransactionInfo.setCcTransactionType(CCTransactionType.OTHER);
        ccTransactionInfo.setCcAction(CCAction.AUTHENTICATION);
        ccTransactionInfo.setAmount(new BigDecimal(0));
        ccTransactionInfo.setVendor(CCVendor.USAEPAY);
        ccTransactionInfo.setPostingDate(LocalDate.now());
        ccTransactionInfo.setError("Credit Card is invalid.");
        ccTransactionInfo.setStatus(CCTransactionStatus.ERROR);
        ccTransactionInfo.setSaveOnSuccessOnly(false);
        ccTransactionInfo.setUseCardOnFile(false);
        ccTransactionInfo.setSaveCardToFile(false);
        ccTransactionInfo.setIsNsf(false);
        ccTransactionInfo.setIsCustomRefund(false);
        return ccTransactionInfo;
    }







    public ApplicationSettleResponse settleApplication(ApplicationSettleRequest request) {
        ApplicationSettleResponse response = new ApplicationSettleResponse();
        InvoiceInformation invoiceInformation = request.getInvoiceInformation();

        response.setAccountNumber(request.getAccountNumber());
        if (request.getLead() == null) {
            validator.validate(request);
        }

        LosLead lead = request.getLead();
        lead.getLeadInfo().setNotes("Merchant requested settlement"+(request.getInvoiceInformation() == null ? " through API " : " through portal"));
        response.setExternalReferenceId(lead.getLeadInfo().getExternalReferenceId());
        response.setAuthorizationNumber(String.valueOf(lead.getPk()));

        LosCustomer customer = customerService.getPrimaryCustomer(lead.getPk());
        String uuid = configurationManagement.getSettleApplicationRequestByLeadPk(lead.getPk());
        boolean useSettleMap = configurationManagement.getBoolean(configurationPath + "check.settle.application.request.map", true);
        if (useSettleMap && StringUtils.isNotBlank(uuid)) {
            response.setTransactionMessage("Duplicate settle application request");
            return response;
        }

        try {
            if (useSettleMap) {
                configurationManagement.addSettleApplicationRequest(lead.getPk(), lead.getLeadInfo().getUuid());
                log.info("[createApplication] Added application, ssn: {}, uuid: {}", customer.getCustomerInfo().getSsn().substring(customer.getCustomerInfo().getSsn().length()-4), lead.getLeadInfo().getUuid());
            }

            FundingBankData fundingBankData = request.getFundingBankData();
            if (fundingBankData != null)
            {
                if (!StringUtils.isBlank(fundingBankData.getBankAccountNumber()) && !StringUtils.isBlank(fundingBankData.getBankRoutingNumber())) {
                    FundingBankAccount fundingBankAccount = new FundingBankAccount();
                    fundingBankAccount.setLeadPk(request.getLead().getPk());
                    fundingBankAccount.setFundingBankData(fundingBankData);
                    fundingBankAccountService.createOrUpdateFundingBankAccount(fundingBankAccount);
                }
            }


            if (lead.getLeadInfo().getLeadStatus() == LeadStatus.FUNDING || lead.getLeadInfo().getLeadStatus() == LeadStatus.FUNDED
                || !svcContractService.isLeaseOrLeaseModSigned(lead)) {
                if (invoiceInformation != null) throw new SvcException("Lead in status "+lead.getLeadInfo().getLeadStatus()+" is not eligible for settlement");
                response.setTransactionMessage("LeadStatus "+lead.getLeadInfo().getLeadStatus()+" is not eligible for settlement");
                return response;
            }

            lead.getLosInvoice().getInvoiceInfo().setInvoiceStatus(ItemStatus.DELIVERED);
            LosInvoice losInvoice = invoiceService.createOrUpdate(lead.getLosInvoice().getInvoiceInfo());
            Integer deliveredItems = 0;
            Boolean fullFund = Boolean.TRUE;
            LocalDate invoiceDeliveryDate = null;
            if(request.getLineItem() != null && !request.getLineItem().isEmpty()){
                for(LineItemInfo lineItem : request.getLineItem()) {
                    ItemInfo itemInfo = lineItem.toItemInfo();
                    itemInfo.setLeadPk(lead.getPk());
                    itemInfo.setInvoicePk(lead.getLosInvoice().getPk());
                    if (itemInfo.getItemPk() <= 0 && StringUtils.isNotBlank(lineItem.getLineItemProductDescription())) {
                        List<LosItem> items = itemService.getItemsForLeadAndDescription(lead.getPk(), StringUtils.isBlank(lineItem.getLineItemProductCategory()) ? lineItem.getLineItemProductDescription() : lineItem.getLineItemProductCategory() + ":"+ lineItem.getLineItemProductDescription());
                        if(items != null && !items.isEmpty()){
                            itemInfo.setItemPk(items.get(0).getPk());
                        }
                    }
                    deliveredItems = deliveredItems+lineItem.getLineItemQuantityOrdered();
                    invoiceDeliveryDate = itemInfo.getItemDeliveryDate();
                    if(itemInfo.getItemPk() > 0) {
                        LosItem item = itemService.findByPk(itemInfo.getItemPk());
                        itemInfo.setStatus(item.getItemInfo().getStatus() == ItemStatus.PAID ? ItemStatus.PAID_DELIVERED : ItemStatus.DELIVERED);
                        itemInfo.setInvoiceType(item.getItemInfo().getInvoiceType());
                        itemService.createOrUpdateItem(itemInfo);
                    }
                }
            } else if (request.getInvoiceInformation() != null) {
                Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
                if (!configurationManagement.getBoolean(configurationPath + "items.can.be.empty.for.merchant." + merchant.getMerchantInfo().getClientType(), false)
                    && !configurationManagement.getBoolean(configurationPath+"items.can.be.empty.for.merchant."+merchant.getMerchantInfo().getRefMerchantCode(), false)) {
                    List<LosItem> items = invoiceInformation.getItems();
                    if(items == null || items.isEmpty()){
                        items = itemService.getAllItemsForLead(invoiceInformation.getInvoiceInfo().getLeadPk());
                    }
                    for(LosItem item : items){
                        ItemInfo itemInfo = item.getItemInfo();
                        if (itemInfo.getStatus() != ItemStatus.CANCELLED && itemInfo.getStatus() != ItemStatus.RETURNED && itemInfo.getNumberOfItemsDelivered() != null ){
                            itemInfo.setStatus(itemInfo.getStatus() == ItemStatus.PAID ? ItemStatus.PAID_DELIVERED : ItemStatus.DELIVERED);
                            if (itemInfo.getItemDeliveryDate() == null) {
                                itemInfo.setItemDeliveryDate(LocalDate.now());
                            }
                            deliveredItems = deliveredItems+itemInfo.getNumberOfItemsDelivered();
                            invoiceDeliveryDate = itemInfo.getItemDeliveryDate();
                            if(itemInfo.getNumberOfItems() != null && !Objects.equals(itemInfo.getNumberOfItems(), itemInfo.getNumberOfItemsDelivered())){
                                fullFund = false;
                            }
                        }
                        itemService.createOrUpdateItem(item.getItemInfo());
                    }
                }
            }
            response.setAmount(lead.getLosInvoice().getInvoiceInfo().getTotalInvoiceAmount());
            losInvoice.getInvoiceInfo().setLastDeliveryDate(invoiceDeliveryDate == null ? LocalDate.now() : invoiceDeliveryDate);
            invoiceService.createOrUpdate(losInvoice.getInvoiceInfo());
            lead.getLeadInfo().setLeadStatus(LeadStatus.READY_TO_FUND, LeadStatus.READY_TO_FUND, "[UOwnClient][settleApplication] Lead set to READY_TO_FUND");
            lead.getLeadInfo().setFundingStatus(fullFund || Objects.equals(lead.getLosInvoice().getInvoiceInfo().getTotalNumberOfItems(), deliveredItems) ? FundingStatus.READY_FOR_FULL_FUND : FundingStatus.READY_TO_PARTIAL_FUND);
            lead.getLeadInfo().setFundRequestDateTime(LocalDateTime.now());
            response.setTransactionStatus(SettlementTransactionStatus.ACCEPTED.getStatus());
            loggingService.createActivityLog(lead.getPk(), LogType.STATUS_CHANGE, false, null, "Merchant requested settlement : SIGNED -> FUNDING", LosThreadAttributes.getUsername());
            sendActivationEmail(lead);
            lead.getLeadInfo().setNotes("[UOwnClient][settleApplication] End. LeadStatus : " + lead.getLeadInfo().getLeadStatus());
            leadManagementService.createOrUpdateLead(lead.getLeadInfo());
            leadFundingService.updateFundingStatus(new FundingStatusRequest(List.of(lead.getPk()), FundingQueueStatus.FUNDING));
            return response;
        } catch (Exception e) {
            log.error("Exception in settleApplication", e);
            throw e;
        } finally {
            if (useSettleMap) {
                configurationManagement.removeSettleApplicationRequest(lead.getPk(), lead.getLeadInfo().getUuid());
                log.info("[settleApplication] Removed application, ssn: {}, uuid: {}", customer.getCustomerInfo().getSsn().substring(customer.getCustomerInfo().getSsn().length()-4), lead.getLeadInfo().getUuid());
            }
        }
    }


    public void sendActivationEmail(LosLead lead) {
        if(configurationManagement.getBoolean(configurationPath+"send.activation.email.in.settle.application", true)) {
            CorrespondenceRequest request = new CorrespondenceRequest();
            request.setLeadPk(lead.getPk());
            request.setTemplateName("ActivationNotice");
            request.setCorrespondenceType(CorrespondenceType.EMAIL);
            request.setCreatedBy(com.uownleasing.svc.config.ThreadAttributes.getUsername());
            if(configurationManagement.getBoolean(configurationPath+"send.activation.email.in.async", true)){
                correspondenceService.createCorrespondenceAsync(request);
            }else{
                correspondenceService.createCorrespondence(request);
            }
        }

    }

    //STORIS
    public String createApplication(@Valid String applicationRequest){
        return null;
    }

    public String createInvoiceRequest(@Valid String authRequestXml){
        return null;
    }

    public String getApplicationStatus(@Valid String request){
        return null;
    }

    public String settleApplication(@Valid String request) {
        return null;
    }

    public String createAdjustmentRequest(@Valid String request){ return null;}


    //JEWELERS


    public List<LosPaymentOptions> getPaymentOptionsForLead(long leadPk){
        LosLead lead = leadService.getByLeadPk(leadPk);
        LosInvoice losInvoice = lead.getLosInvoice();
        if(losInvoice == null || losInvoice.getInvoiceInfo().getInvoiceStatus() == ItemStatus.CANCELLED){
            throw new SvcException("Please provide a valid invoice");
        }
        Merchant merchant = merchantService.getMerchantByLeadPk(lead.getPk());
        List<LosItem> items = itemService.getAllItemsForLead(lead.getPk());
        if(!configurationManagement.getBoolean(configurationPath+"items.can.be.empty.for.merchant."+merchant.getMerchantInfo().getClientType(), false)
            && !configurationManagement.getBoolean(configurationPath+"items.can.be.empty.for.merchant."+merchant.getMerchantInfo().getRefMerchantCode(), false)
            && (items == null || items.isEmpty())){
            throw new SvcException("Please provide atleast one item on invoice");
        }
        LosEmployment employment = employmentService.getPrimaryEmploymentByLeadPk(leadPk);
        if(employment == null){
            throw new SvcException("Please provide employment details");
        }else if (employment.getEmploymentInfo().getNextPayDate() == null){
            throw new SvcException("Please provide next pay date");
        }
        CalculatorRequest calculatorRequest = new CalculatorRequest(lead, new ArrayList<>(), null, null, null,null, null, null, null, null,0, null, BigDecimal.ZERO, null);
        CalculatorResults calculatorResults = calculatorService.calculate(calculatorRequest);
        paymentOptionsService.removeByLeadPk(leadPk);
        calculatorResults.getSchedSummaryInfoList().forEach(ssi -> paymentOptionsService.createOrUpdate(ssi));
        return paymentOptionsService.getPaymentOptionsByLead(leadPk);
    }

    public EsignFields getEsignFields(LosLead lead) {
        if(lead.getLeadInfo().getLeadStatus() != LeadStatus.UW_APPROVED
            && lead.getLeadInfo().getLeadStatus() != LeadStatus.CONTRACT_CREATED){
            throw new SvcException("Invalid link. Application is in status "+lead.getLeadInfo().getLeadStatus());
        }

        lead.getLeadInfo().setNotes(" [ApplicationService][getEsignFields] is called");
        EsignFields esignFields = new EsignFields();
        esignFields.setLeadPk(lead.getPk());
        esignFields.getMissingFields().add("firstPaymentDate");
        esignFields.setPhoneVerificationRequired(configurationManagement.getBoolean(configurationPath + "check.phone.verification.required", true));
        esignFields.setPaymentOptions(getPaymentOptionsForLead(lead.getPk()));
        lead.getLeadInfo().setLeadStatus(null, LeadStatus.COMPLETE_ESIGN_LOADED, "[UownClient][getEsignFields] Complete esign loaded");
        return esignFields;
    }



    public static void main(String[] args){
        System.out.println(DateUtils.getDifferenceBetweenLocalDateTimesInHours(LocalDateTime.now().minusDays(1L),LocalDateTime.now()));
    }
}




src/main/java/com/uownleasing/svc/utility/SmsMessageBuilder.java
package com.uownleasing.svc.utility;

import com.uownleasing.svc.enumeration.ClientType;

import java.math.BigDecimal;

public final class SmsMessageBuilder {

    private SmsMessageBuilder() {}

    public static String buildApprovalMessage(ClientType clientType, BigDecimal creditLimit) {
        if (clientType == ClientType.KORNERSTONE) {
            return String.format(
                "Congratulations! You have been approved for a $%s lease with Kornerstone. " +
                    "Check email (and spam) for approval email. Reply STOP to unsubscribe. Kornerstone",
                creditLimit
            );
        }

        return String.format(
            "Congratulations! You have been approved for a $%s lease with Uown. " +
                "Check email (and spam) for approval email. Reply STOP to unsubscribe. Uownleasing",
            creditLimit
        );
    }

    public static String buildApplicationRedirectMessage(ClientType clientType, String redirectUrl) {
        if (clientType == ClientType.KORNERSTONE) {
            return String.format(
                "Click here %s to complete your application from Kornerstone. Reply STOP to Unsubscribe. Kornerstone",
                redirectUrl
            );
        }

        return String.format(
            "Click here %s to complete your application from Uown. Reply STOP to Unsubscribe. Uownleasing",
            redirectUrl
        );
    }

    public static String buildPurchaseFinalizationMessage(ClientType clientType, String redirectUrl) {
        if (clientType == ClientType.KORNERSTONE) {
            return String.format(
                "Click here %s to finalize your purchase from Kornerstone. Reply STOP to Unsubscribe. Kornerstone",
                redirectUrl
            );
        }

        return String.format(
            "Click here %s to finalize your purchase from Uown. Reply STOP to Unsubscribe. Uownleasing",
            redirectUrl
        );
    }

    public static String buildVerifiedFinalizeMessage(
        ClientType clientType,
        String firstName,
        String lastName,
        BigDecimal totalAmount,
        String redirectUrl,
        String template
    ) {
        String messageTemplate = template;
        if (clientType == ClientType.KORNERSTONE) {
            messageTemplate = template.replace("Uown", "Kornerstone")
                .replace("Uownleasing", "Kornerstone");
        }

        return String.format(
            messageTemplate,
            firstName,
            lastName,
            totalAmount,
            redirectUrl
        );
    }
}





src/main/java/com/uownleasing/svc/utility/UrlBuilderUtils.java
package com.uownleasing.svc.utility;

import com.uownleasing.dms.common.configuration.SystemConfigurationManagement;
import com.uownleasing.svc.enumeration.ClientType;

public class UrlBuilderUtils {

    private static boolean isProduction() {
        return SystemConfigurationManagement.isProduction();
    }

    public static String buildFinalizeUrl(ClientType clientType, String env, String shortCode) {
        return resolveBaseDomain(clientType, env, "secure") + "/" + shortCode + "/finalize";
    }

    public static String buildCompleteUrl(ClientType clientType, String env, String shortCode) {
        return resolveBaseDomain(clientType, env, "secure") + "/" + shortCode + "/complete";
    }

    public static String buildStartApplicationUrl(
        ClientType clientType,
        String env,
        String shortCode
    ) {
        return resolveBaseDomain(clientType, env, "apply") + "/" + shortCode + "/start";
    }

    private static String resolveBaseDomain(ClientType clientType, String env, String subdomain) {
        String finalEnv = (env == null || env.isBlank()) ? "dev1" : env.trim();

        String domain;
        if (clientType == ClientType.KORNERSTONE) {
            if (isProduction() || "prod".equals(env)) {
                domain = subdomain + ".kornerstoneliving.com";
            } else {
                domain = subdomain + "-" + finalEnv + ".kornerstoneliving.com";
            }
        } else {
            if (isProduction() || "prod".equals(env)) {
                domain = subdomain + ".uownleasing.com";
            } else {
                domain = subdomain + "-" + finalEnv + ".uownleasing.com";
            }
        }

        return "https://" + domain;
    }
}





src/main/java/com/uownleasing/svc/validator/LosRequestMessageConstraintValidator.java
package com.uownleasing.svc.validator;

import com.uownleasing.common.enumeration.*;
import com.uownleasing.common.pojo.AddressInfo;
import com.uownleasing.common.utils.DateUtils;
import com.uownleasing.dms.common.configuration.*;
import com.uownleasing.los.common.db.config.*;
import com.uownleasing.los.common.db.entity.*;
import com.uownleasing.los.common.service.*;
import com.uownleasing.svc.config.AddressValidationConfig;
import com.uownleasing.svc.config.LosRequestMessageConstraintValidatorConfig;
import com.uownleasing.svc.config.ThreadAttributes;
import com.uownleasing.svc.db.entity.*;
import com.uownleasing.svc.enumeration.*;
import com.uownleasing.svc.exceptions.*;
import com.uownleasing.svc.pojo.*;
import com.uownleasing.svc.pojo.rest.*;
import com.uownleasing.svc.service.*;
import com.uownleasing.svc.service.tax.TaxCloudService;
import com.uownleasing.svc.utility.*;
import com.uownleasing.taxcloud.exception.TaxCloudException;
import com.vdurmont.emoji.EmojiParser;
import lombok.extern.slf4j.*;
import org.apache.commons.beanutils.*;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.*;
import org.apache.commons.lang3.math.*;
import org.apache.commons.validator.routines.*;
import org.slf4j.*;
import org.springframework.beans.factory.annotation.*;

import javax.validation.*;
import java.math.*;
import java.time.*;
import java.util.*;
import java.util.function.Function;
import java.util.function.Supplier;

@Slf4j
public class LosRequestMessageConstraintValidator implements ConstraintValidator<LosRequestMessageConstraint, Object> {

    private static final Logger LOG = LoggerFactory.getLogger(LosRequestMessageConstraintValidator.class);

    @Autowired
    private  MerchantService merchantService;

    @Autowired
    private LosLeadService losLeadService;

    @Autowired
    private LeadService leadService;

    @Autowired
    private MerchantToProgramService merchantToProgramService;

    @Autowired
    private MerchantProgramService merchantProgramService;

    @Autowired
    private ApiInfoTrackerService apiInfoTrackerService;

    @Autowired
    private LosRequestMessageConstraintValidatorConfig config;

    @Autowired
    private AddressValidationConfig addressConfig;

    @Autowired
    private AddressValidationUtils addressValidationUtils;

    @Autowired
    private TaxCloudService taxCloudService;

    @Override
    public boolean isValid(Object object, ConstraintValidatorContext context) {
        LOG.info("{RequestMessageConstraintValidator} START");

        if(object instanceof ApplicationRequest) {
            validateApplicationRequest((ApplicationRequest) object);
        }else if(object instanceof AuthorizationRequest){
            validateAuthorizationRequest((AuthorizationRequest)object);
        }else if(object instanceof ApplicationStatusRequest){
            validateApplicationStatusRequest((ApplicationStatusRequest)object);
        }else if(object instanceof ApplicationSettleRequest){
            validateApplicationSettleRequest((ApplicationSettleRequest)object);
        }else if(object instanceof InvoiceInformation){
            validateInvoiceInformation((InvoiceInformation) object);
        }
        return true;
    }

    private InvoiceInformation validateInvoiceInformation(InvoiceInformation invoiceInformation) {
        if (config.requireUwApprovalForInvoiceInformation()) {
            try {
                LOG.info("[RequestMessageConstraintValidator][validateInvoiceInformation] LeadPk : {}", invoiceInformation.getLead().getPk());
                if (CollectionUtils.isNotEmpty(invoiceInformation.getItems())) {
                    boolean allItemsCancelled = invoiceInformation.getItems().stream()
                        .allMatch(item -> item.getItemInfo().getStatus() == ItemStatus.CANCELLED);
                    if (!allItemsCancelled) {
                        validateUWApproval(
                            invoiceInformation.getLead(),
                            invoiceInformation.getMerchantInfo(),
                            invoiceInformation.getInvoiceInfo().getTotalInvoiceAmount()
                        );

                        validateMinimumLeaseValue(
                            invoiceInformation.getMerchantInfo(),
                            invoiceInformation.getInvoiceInfo().getMerchandiseAmount()
                        );
                    }
                }
            } catch (InvalidFieldsException invalidFieldsException) {
                invoiceInformation.setError(invalidFieldsException.getMessage());
            }
        }
        LOG.debug("[RequestMessageConstraintValidator][validateInvoiceInformation] Error : {}", invoiceInformation.getError());
        return invoiceInformation;
    }

    private void validateApplicationSettleRequest(ApplicationSettleRequest request) {
        LosLead lead = null;
        String invalidField = "";
        String invalidValue = "";
        if(request.getInvoiceInformation() == null) {
            String requiredFields = "userName,password,merchantId,accountNumber";
            checkRequiredFields(requiredFields, request);
            Merchant merchant = getMerchant(request.getUserName(), request.getPassword(), request.getMerchantId(), request.getStoreId());
            request.setMerchant(merchant);
            lead = losLeadService.getByLeadUuid(request.getAccountNumber());
            invalidField = "AccountNumber";
            invalidValue = request.getAccountNumber();
        }else{
            lead = losLeadService.getByLeadPk(request.getInvoiceInformation().getInvoiceInfo().getLeadPk());
            invalidField = "LeadPk";
            invalidValue = String.valueOf(request.getInvoiceInformation().getInvoiceInfo().getLeadPk());
        }
        if(lead == null){
            throw new InvalidFieldsException(invalidField, "Invalid "+ invalidField + ". Received " + invalidValue);
        }
        lead.getLeadInfo().setNotes("[LosRequestMessageConstraintValidator][validateApplicationSettleRequest]");
//        request.setMerchantProgram(getMerchantProgram(request.getMerchant(), lead.getLeadInfo().getCustomerState()));
        request.setLead(lead);
    }

    private MerchantProgram getMerchantProgram(Merchant merchant, String state) {
        if(merchant != null) {
            state = merchant.getMerchantInfo().getMerchantType() == MerchantType.INSTORE ? merchant.getMerchantInfo().getState().toUpperCase() : state;
            return merchantToProgramService.getSACActiveProgramsForStateByMerchant(merchant.getPk(), state);
        }
        return null;
    }

    private void validateApplicationStatusRequest(ApplicationStatusRequest appStatusRequest) {
        LosLead lead = null;
        if(StringUtils.isNotBlank(appStatusRequest.getUuid())){
           if (appStatusRequest.getUuid().lastIndexOf("_") > 0) {
                lead = losLeadService.getByLeadUuid(appStatusRequest.getUuid().substring(0, appStatusRequest.getUuid().lastIndexOf("_")));
            }else {
                lead = losLeadService.getByLeadUuid(appStatusRequest.getUuid());
            }
            if(lead == null){
                throw new InvalidFieldsException("uuid", "Invalid uuid. Received " + appStatusRequest.getUuid());
            }
            appStatusRequest.setMerchant(merchantService.getMerchantByLeadPk(lead.getPk()));
        }
        if(appStatusRequest.getMerchant() == null) {
            String requiredFields = "userName,password,merchantId";
            checkRequiredFields(requiredFields, appStatusRequest);
            appStatusRequest.setMerchant(getMerchant(appStatusRequest.getUserName(), appStatusRequest.getPassword(), appStatusRequest.getMerchantId(), appStatusRequest.getStoreId()));
            //appStatusRequest.setMerchantProgram(getMerchantProgram(appStatusRequest.getMerchant()));
        }
        if(StringUtils.isBlank(appStatusRequest.getUserName())){
            setUsername("MERCHANT_PORTAL");
        }
    }

    private Merchant getMerchant(String username, String password, String merchantId, String storeId) {
        Merchant merchant = merchantService.getMerchant(username, password, merchantId);
        if (merchant == null) {
            throw new InvalidFieldsException("merchantId", "Invalid merchantId. Received " + merchantId);
        }
        ClientType clientType = merchant.getMerchantInfo().getClientType();
        setUsername(clientType+" API");
        return merchant;
    }

    private void setUsername(String username){
        if(StringUtils.isBlank(ThreadAttributes.getUsername()) || ThreadAttributes.getUsername().equalsIgnoreCase("SYSTEM")){
            ThreadAttributes.setUsername(username);
            LosThreadAttributes.setUsername(username);
        }
    }
    private void validateApplicationRequest(ApplicationRequest applicationRequest) {
        ApiInfoTracker apiInfoTracker = apiInfoTrackerService.logApi(null, "sendApplication", "validateApplicationRequest");
        if (apiInfoTracker != null) {
            applicationRequest.setApiInfoTrackerPk(apiInfoTrackerService.createOrUpdate(apiInfoTracker).getPk());
        }

        String requiredFields = "";
        if(applicationRequest.getRefLead() == null && !applicationRequest.getChangeMerchant() && !applicationRequest.getAddedNewLease()) {
            if (StringUtils.isBlank(applicationRequest.getUserName())) {
                String uuid = applicationRequest.getAppUuid();
                LosLead lead = leadService.getByLeadUuidAndId(uuid);
                Merchant merchant = merchantService.getActiveMerchantByMerchantCode(applicationRequest.getMerchantId());
                if (lead == null || merchant == null) {
                    throw new InvalidFieldsException("uuid", "Invalid link. Please provide the correct merchantCode and uuid. Received merchantCode: " + applicationRequest.getMerchantId() + " & uuid: " + applicationRequest.getUuid());
                }
                lead.getLeadInfo().setCreatedFrom("PORTAL");
                lead.getLeadInfo().setNotes("[LosRequestMessageConstraintValidator][validateApplicationRequest]");
                applicationRequest.setLead(lead);
                applicationRequest.setMerchant(merchant);
                setUsername("MERCHANT_PORTAL");
            }

            if (applicationRequest.getMerchant() == null) {
                requiredFields = "userName,password,merchantId";
                checkRequiredFields(requiredFields, applicationRequest);
                applicationRequest.setMerchant(getMerchant(applicationRequest.getUserName(), applicationRequest.getPassword(), applicationRequest.getMerchantId(), applicationRequest.getStoreId()));
            }
//        applicationRequest.setMerchantProgram(getMerchantProgram(applicationRequest.getMerchant(), applicationRequest.toLeadInfo().getCustomerState()));
            requiredFields = config.getRequiredFieldsForClientType(applicationRequest.getMerchant().getMerchantInfo().getClientType());
            if (applicationRequest.getMerchant().getMerchantInfo().getClientType() == ClientType.STORIS) {
                requiredFields = requiredFields + ",customerCode";
            }
            log.info("[LosRequestMessageConstraintValidator][validateApplicationRequest] RequiredFields {}", requiredFields);
            applicationRequest.setMainFirstName(removeInvalidCharacters(applicationRequest.getMainFirstName()));
            applicationRequest.setMainLastName(removeInvalidCharacters(applicationRequest.getMainLastName()));

            checkRequiredFields(requiredFields, applicationRequest);
            if (!applicationRequest.getMerchant().getMerchantInfo().getAcceptNewApps()) {
                throw new InvalidFieldsException("acceptNewApps", "This merchant is not currently accepting new applications");
            }
            if (config.monthlyIncomeRequiredForClientType(applicationRequest.getMerchant().getMerchantInfo().getClientType()) && applicationRequest.getMainMonthlyNetIncome() == null && applicationRequest.getMainMonthlyIncome() == null && applicationRequest.getMainAnnualIncome() == null) {
                throw new InvalidFieldsException("mainMonthlyIncome", "Please provide mainMonthlyIncome or mainAnnualIncome");
            }

            if (!NumberUtils.isParsable(applicationRequest.getMainSSN())) {
                throw new InvalidFieldsException("mainSSN", "SSN should have only digits. Received " + applicationRequest.getMainSSN());
            }

            if (applicationRequest.getMainSSN().length() != 9) {
                throw new InvalidFieldsException("mainSSN", "SSN should have 9 digits. Received " + applicationRequest.getMainSSN());
            }

            if (!NumberUtils.isParsable(applicationRequest.getMainPostalCode()) || applicationRequest.getMainPostalCode().length() != 5) {
                throw new InvalidFieldsException("mainPostalCode", "PostalCode should have only 5 digits. Received " + applicationRequest.getMainPostalCode());
            }

            if(!NumberUtils.isParsable(applicationRequest.getMainCellPhone().toString()) || applicationRequest.getMainCellPhone().toString().length() != 10){
                throw new InvalidFieldsException("mainCellPhone", "Phone number should have 10 digits. Received " + applicationRequest.getMainCellPhone().toString());
            }

            if (!EmailValidator.getInstance().isValid(applicationRequest.getEmailAddress())) {
                throw new InvalidFieldsException("emailAddress", "EmailAddress is invalid. Received " + applicationRequest.getEmailAddress());
            }

            validateBankAccount(applicationRequest);
            validateCreditCardBin(applicationRequest);

            populateStateFromZipCode(applicationRequest);

            validateAddressFormat(applicationRequest);

            if(config.checkSalesTax()
                && applicationRequest.getOrderTotal() != null && applicationRequest.getOrderTotal().compareTo(BigDecimal.ZERO) > 0
                && applicationRequest.getSalesTax() != null && applicationRequest.getSalesTax().compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidFieldsException("salesTax", "salesTax is negative");
            }

            if (applicationRequest.getMainNextPayDate() != null) {
                long daysBetween = DateUtils.getDifferenceBetweenLocalDateInDays(LocalDate.now(), applicationRequest.getMainNextPayDate());
                Long max = config.getDefaultMaxDays();
                if (applicationRequest.getMainPayFrequency() != null) {
                    switch(applicationRequest.getMainPayFrequency()) {
                        case WEEKLY:
                            max = config.getWeeklyMaxDays();
                            break;
                        case BI_WEEKLY:
                            max = config.getBiWeeklyMaxDays();
                            break;
                        case SEMI_MONTHLY:
                            max = config.getSemiMonthlyMaxDays();
                            break;
                        case MONTHLY:
                            max = config.getMonthlyMaxDays();
                            break;
                        default:
                    }
                }

                if (config.lookFutureNextPayForClientType(applicationRequest.getMerchant().getMerchantInfo().getClientType()) && daysBetween < 0) {
                    throw new InvalidFieldsException("mainNextPayDate", "NextPayDate should be in the future. Received " + applicationRequest.getMainNextPayDate());
                }
                else if (max != null && daysBetween > max) {
                    throw new InvalidFieldsException("mainNextPayDate", "NextPayDate should be within " + max + " days. Received " + applicationRequest.getMainNextPayDate());
                }
            }

            if (Boolean.TRUE.equals(config.authenticateAddress())) {
                verifyAddress(applicationRequest);
            }

            if(config.checkProgramNameByClientType(applicationRequest.getMerchant().getMerchantInfo().getClientType())) {
                if(CollectionUtils.isEmpty(merchantProgramService.getAllProgramsByNameAndClientType(applicationRequest.getProgramName(), applicationRequest.getMainStateOrProvince(), applicationRequest.getMerchant().getMerchantInfo().getMerchantPK()))){
                    throw new InvalidFieldsException("programName", "Cannot find the merchantProgram(" + applicationRequest.getProgramName() + "," + applicationRequest.getMainStateOrProvince() + ").");
                }
            }
            log.info("Final state : {}", applicationRequest.getMainStateOrProvince());
        }

        if (applicationRequest.getOrderTotal() != null && applicationRequest.getOrderTotal().compareTo(BigDecimal.ZERO) > 0) {
            validateInvoiceDetails(applicationRequest);
        }else if (applicationRequest.getRefInvoiceInfo() != null && applicationRequest.getMerchant() != null){
            validateMinimumLeaseValue(applicationRequest.getMerchant().getMerchantInfo(), applicationRequest.getRefInvoiceInfo().getMerchandiseAmount());
        }
    }

    private void validateAuthorizationRequest(AuthorizationRequest authorizationRequest) {
        log.info("INSIDE AUTH REQUEST {}", authorizationRequest.toString());
        String requiredFields = "userName,password,merchantId,accountNumber";
        checkRequiredFields(requiredFields, authorizationRequest);
        Merchant merchant = getMerchant(authorizationRequest.getUserName(), authorizationRequest.getPassword(), authorizationRequest.getMerchantId(), authorizationRequest.getStoreId());
        authorizationRequest.setMerchant(merchant);
        LosLead lead = null;
        Boolean isStoris = merchant.getMerchantInfo().getClientType() == ClientType.STORIS;
        if(isStoris){
            if(StringUtils.isBlank(authorizationRequest.getCustomerCode())){
                throw new InvalidFieldsException("CustomerCode", "CustomerCode is required");
            }
            if(StringUtils.isNotBlank(authorizationRequest.getOriginalAuthorizationNumber()) && !authorizationRequest.getOriginalAuthorizationNumber().equalsIgnoreCase("000000000")){
                if (!NumberUtils.isParsable(authorizationRequest.getOriginalAuthorizationNumber())) {
                    throw new InvalidFieldsException("OriginalAuthorizationNumber", "Invalid OriginalAuthorizationNumber. Received " + authorizationRequest.getOriginalAuthorizationNumber());
                }
                lead = losLeadService.getByLeadPk(Long.valueOf(authorizationRequest.getOriginalAuthorizationNumber()));
            }else if(StringUtils.isNotBlank(authorizationRequest.getOriginalOrderAuthorizationNumber()) && !authorizationRequest.getOriginalOrderAuthorizationNumber().equalsIgnoreCase("000000000")){
                if (!NumberUtils.isParsable(authorizationRequest.getOriginalOrderAuthorizationNumber())) {
                    throw new InvalidFieldsException("OriginalOrderAuthorizationNumber", "Invalid OriginalOrderAuthorizationNumber. Received " + authorizationRequest.getOriginalOrderAuthorizationNumber());
                }
                lead = losLeadService.getByLeadPk(Long.parseLong(authorizationRequest.getOriginalOrderAuthorizationNumber()));
            }else {
                List<LosLead> leads = losLeadService.getByStorisCustomerCodeAndMerchantPk(merchant.getPk(), authorizationRequest.getCustomerCode());
                if (leads == null || leads.isEmpty()) {
                    throw new InvalidFieldsException("CustomerCode", "Cannot find Application for customer from merchant " + merchant.getMerchantInfo().getMerchantName() + ". Please use sendApplication");
                }
                for(LosLead l : leads){
                    if(l.getLeadInfo().getLeadStatus() != LeadStatus.EXPIRED &&
                        l.getLeadInfo().getLeadStatus() != LeadStatus.INCOMPLETE &&
                        l.getLeadInfo().getLeadStatus() != LeadStatus.CANCELLED_DUP_SSN) {
                        lead = l;
                        break;
                    }
                }
            }
        }else {
            lead = losLeadService.getByLeadUuid(authorizationRequest.getAccountNumber());
        }
        if(lead == null){
            throw new InvalidFieldsException("CustomerCode Or AccountNumber", "Lead could not be found with the given parameters");
        }
        lead.getLeadInfo().setNotes("[LosRequestMessageConstraintValidator][validateAuthorizationRequest]");
//        authorizationRequest.setMerchantProgram(getMerchantProgram(authorizationRequest.getMerchant(), lead.getLeadInfo().getCustomerState()));

        Snowflake snowflake = new Snowflake(SystemConfigurationManagement.getDatacenterId(), SystemConfigurationManagement.getWorkerId());
        lead.getLeadInfo().setId(String.valueOf(snowflake.nextId()));
        lead = losLeadService.save(lead);
        authorizationRequest.setLead(lead);
//        if(authorizationRequest.getOrderType() == OrderType.SALE){
//            validateUWStatus(authorizationRequest);
//        }
        if(!isStoris){
//            validateLeadStatus(authorizationRequest);
            if (authorizationRequest.getOrderType() == OrderType.SALE){
                validateInvoiceDetails(authorizationRequest);
            } else if (CollectionUtils.isNotEmpty((authorizationRequest.getLineItem()))) {
                if (authorizationRequest.getLineItem().stream().filter(lineItemInfo -> lineItemInfo.getLineItemType().equals(LineItemType.DEBIT_SALE)).findAny().orElse(null) != null)
                    validateInvoiceDetails(authorizationRequest);
            }

            if(merchant.getMerchantInfo().getClientType() != ClientType.PAY_TOMORROW
                && merchant.getMerchantInfo().getClientType() != ClientType.PAY_TOMORROW_FRASER
                && authorizationRequest.getOrderType() == OrderType.SALE){
                validateUWApproval(authorizationRequest);
            }
        }
    }

    private void validateUWApproval(AuthorizationRequest authorizationRequest) {
        validateUWApproval(authorizationRequest.getLead(), authorizationRequest.getMerchant().getMerchantInfo(), authorizationRequest.getOrderTotal());
    }

    private void validateUWApproval(LosLead lead, MerchantInfo merchantInfo, BigDecimal orderTotal){
        lead.getLeadInfo().setNotes("[LosRequestMessageConstraintValidator][validateUWApproval]");
        LosUWData uwData = lead.getLosUWData();
        BigDecimal maxApprovalAmount = lead.getLeadInfo().getMaxApprovalAmount();
        //Remove unnecessary getMaxApprovalAmount service call as lead already has max approval amount
        //leadService.getMaxApprovalAmount(lead.getPk());
        if(orderTotal != null
            && !merchantInfo.getIsItemSplit()
            && (uwData == null || maxApprovalAmount.compareTo(orderTotal) < 0)){
            throw new InvalidFieldsException("Amount", "Approved amount "+(uwData == null ? "0" : uwData.getUwInfo().getApprovalAmount())+" is lower than invoice total "+orderTotal);
        } else if (merchantInfo.getIsItemSplit() && (uwData == null || uwData.getUwInfo().getApprovalExpirationDate().isBefore(LocalDate.now()))) {
            throw new InvalidFieldsException("Approval", "Approval has expired");
        }
    }
    private void validateUWStatus(AuthorizationRequest authorizationRequest) {
        LosLead lead = authorizationRequest.getLead();
        lead.getLeadInfo().setNotes("[LosRequestMessageConstraintValidator][validateUWStatus]");
        LosUWData uwData = lead.getLosUWData();
        if(uwData == null || uwData.getUwInfo() == null || uwData.getUwInfo().getUwStatus() != UnderwritingStatus.APPROVED
            ||  uwData.getUwInfo().getApprovalAmount().compareTo(BigDecimal.ZERO) <= 0 || uwData.getUwInfo().getApprovalExpirationDate().compareTo(LocalDate.now()) < 0){
            throw new InvalidFieldsException("underwritingStatus", "Lead doesn't have UW approval");
        }
    }

    private void validateLeadStatus(AuthorizationRequest authorizationRequest) {
        LosLead lead = authorizationRequest.getLead();
        if(authorizationRequest.getOrderType() == OrderType.SALE && lead.getLeadInfo().getLeadStatus() != LeadStatus.UW_APPROVED &&
            lead.getLeadInfo().getLeadStatus() != LeadStatus.CONTRACT_CREATED &&
            lead.getLeadInfo().getLeadStatus() != LeadStatus.ORDER_CANCELLED){
            throw new InvalidFieldsException("leadStatus", "Invalid request as lead status is "+lead.getLeadInfo().getLeadStatus());
        }
    }

    private void validateInvoiceDetails(Request request){
        String merchantCode = "ABC";
        if(request.getMerchant() != null){
            merchantCode = request.getMerchant().getMerchantInfo().getRefMerchantCode();
        }
        if(request.getOrderTotal() == null){
            throw new InvalidFieldsException("orderTotal", "orderTotal is not provided");
        }
        if(config.checkSalesTax()
            && request.getSalesTax() != null && request.getSalesTax().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidFieldsException("salesTax", "salesTax is negative");
        }
        if(config.validateInvoiceNumbersForMerchant(merchantCode)) {
            BigDecimal merchandiseSubtotal = request.getMerchandiseSubtotal();
            BigDecimal discountAmount = request.getDiscountAmount();
            BigDecimal deliveryCharge = request.getDeliveryCharge();
            BigDecimal installationCharge = request.getInstallationCharge();
            BigDecimal salesTax = request.getSalesTax();
            BigDecimal miscellaneousFees = request.getMiscellaneousFees();
            BigDecimal depositAmount = request.getDepositAmount();
            BigDecimal orderTotal = request.getOrderTotal();
            if (merchandiseSubtotal.signum() == -1) {
                merchandiseSubtotal = new BigDecimal(0);
            }
            if (orderTotal.signum() == -1) {
                orderTotal = new BigDecimal(0);
            }
            BigDecimal baseCost = orderTotal.subtract(depositAmount);
            if (request.getLead() != null) {
                BigDecimal maxApproval = request.getLead().getLeadInfo().getMaxApprovalAmount();
                //leadService.getMaxApprovalAmount(request.getLead().getPk());
                if (!request.getMerchant().getMerchantInfo().getIsItemSplit() && baseCost.compareTo(maxApproval) > 0) {
                    throw new InvalidFieldsException("orderTotal", "Cost is greater than the approved amount");
                }
            }
            BigDecimal sum = merchandiseSubtotal.add(deliveryCharge).add(installationCharge).add(salesTax).add(miscellaneousFees);
            log.info("Sum of merchandise+delivery+otherCharges {}", sum);
            Boolean discountInSubtotal = config.discountIncludedInSubTotalForMerchant(merchantCode);
            BigDecimal sub = discountInSubtotal ? depositAmount : discountAmount.add(depositAmount);
            log.info("Sum of discountAmount+depositamount {}", sub);
            BigDecimal total = sum.subtract(sub).setScale(2, RoundingMode.HALF_EVEN);
            log.info("Calculated Total{}, Given total {}", total, orderTotal);
            if (total.compareTo(orderTotal.setScale(2, RoundingMode.HALF_EVEN)) != 0) {
                throw new InvalidFieldsException("orderTotal", "orderTotal doesn't match the sum of all the charges");
            }
            validateMinimumLeaseValue(request.getMerchant().getMerchantInfo(), merchandiseSubtotal);
            if (config.validateInvoiceItemsForMerchant(merchantCode) && request.getOrderType() != OrderType.CANCEL && request.getOrderType() != OrderType.RETURN) {
                if (request.getLineItem() == null || request.getLineItem().isEmpty()) {
                    throw new InvalidFieldsException("lineItem", "Items are not provided");
                }
                BigDecimal merchandiseTotal = BigDecimal.valueOf(request.getLineItem().stream().filter(lineItem -> lineItem.getLineItemType() == LineItemType.DEBIT_SALE).mapToDouble(lineItemInfo -> lineItemInfo.getLineItemExtendedPrice().doubleValue()).sum()).setScale(2, RoundingMode.HALF_EVEN);
                if (merchandiseSubtotal.compareTo(merchandiseTotal) != 0) {
                    throw new InvalidFieldsException("merchandiseSubtotal", "merchandiseSubtotal and the total of given items do not match");
                }
            }
        }
    }

    private void validateMinimumLeaseValue(MerchantInfo merchantInfo, BigDecimal merchandiseSubtotal) {
        if (config.verifyMinimumLeaseValue()) {
            BigDecimal minimumLeaseAmount = merchantInfo.getMinimumLeaseAmount();
            if (merchandiseSubtotal.compareTo(minimumLeaseAmount) < 0) {
                throw new InvalidFieldsException("merchandiseSubtotal", "The merchandise amount requested, "
                    + merchandiseSubtotal + ", is less than the minimum lease amount, "
                    + minimumLeaseAmount + ".");
            }
        }
    }

    private void checkRequiredFields(String requiredFields,Object value) {
        StringBuilder requiredFieldsStr = new StringBuilder();
        StringBuilder errorDesc = new StringBuilder();
        for (String str : requiredFields.split(",")) {
            try {
                Object propertyValueObj = null;
                String propertyValue = "";
                if (str.contains(".")) {
                    propertyValueObj = PropertyUtils.getNestedProperty(value, str);
                } else {
                    propertyValueObj = PropertyUtils.getProperty(value, str);
                }
                if (propertyValueObj instanceof BigDecimal bgPropertyValue) {
                    if(bgPropertyValue == null || BigDecimal.ZERO.compareTo(bgPropertyValue) >= 0){
                        propertyValue = null;
                    }else{
                        propertyValue = propertyValueObj.toString();
                    }
                }else if(propertyValueObj instanceof LocalDate localDate) {
                    propertyValue = localDate != null? String.valueOf(localDate):null;
                }else{
                    propertyValue = propertyValueObj !=null? String.valueOf(propertyValueObj): null;
                }

                if (StringUtils.isBlank(propertyValue)) {
                    requiredFieldsStr.append(str).append(",");
                    errorDesc.append(str).append(" is required").append(",");
                }
            } catch (Throwable th) {
                th.printStackTrace();
                log.error("Exception {}", str);
            }
        }

        if (StringUtils.isNotBlank(requiredFieldsStr)) {
            log.debug("requiredFieldsStr {} {}", requiredFieldsStr.deleteCharAt(requiredFieldsStr.length()-1), errorDesc.deleteCharAt(errorDesc.length()-1));
            throw new InvalidFieldsException(requiredFieldsStr.toString(), errorDesc.toString());
        }
    }

    public static LocalDate validateDateFormat(String fieldName, String date) {
        try {
            LocalDate convertedDate = DateUtils.stringToLocalDate(date);
            if (convertedDate.isBefore(LocalDate.parse("1900-01-01"))) throw new InvalidFieldsException(fieldName, "Invalid date (too old). Received " + date); // don't let people use dates like 0993-05-25
            return convertedDate;
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Couldn't convert date")) throw new InvalidFieldsException(fieldName, "Invalid date format. Received " + date + ". Please use MMddyyyy. ex: 07201969.");
            throw e;
        }
    }

    private String removeInvalidCharacters(String s) {
        return EmojiParser.removeAllEmojis(s);
    }


    private void validateAddressFormat(ApplicationRequest applicationRequest) {
        if (!addressConfig.enableAddressFormatCheck()) {
            return;
        }

        Map<String, Supplier<Boolean>> validations = Map.of(
            "mainAddress1", () -> !addressConfig.enableStreet1FormatCheck() ||
                addressValidationUtils.isValidStreetAddress1(applicationRequest.getMainAddress1()),
            "mainAddress2", () -> !addressConfig.enableStreet2FormatCheck() ||
                addressValidationUtils.isValidStreetAddress2(applicationRequest.getMainAddress2()),
            "mainCity", () -> !addressConfig.enableCityFormatCheck() ||
                addressValidationUtils.isValidCity(applicationRequest.getMainCity()),
            "mainStateOrProvince", () -> !addressConfig.enableStateFormatCheck() ||
                addressValidationUtils.isValidState(applicationRequest.getMainStateOrProvince()),
            "mainPostalCode", () -> !addressConfig.enableZipFormatCheck() ||
                addressValidationUtils.isValidZip(applicationRequest.getMainPostalCode())
        );

        Map<String, Function<ApplicationRequest, String>> fieldGetters = Map.of(
            "mainAddress1", ApplicationRequest::getMainAddress1,
            "mainAddress2", ApplicationRequest::getMainAddress2,
            "mainCity", ApplicationRequest::getMainCity,
            "mainStateOrProvince", ApplicationRequest::getMainStateOrProvince,
            "mainPostalCode", ApplicationRequest::getMainPostalCode
        );

        for (var entry : validations.entrySet()) {
            if (Boolean.FALSE.equals(entry.getValue().get())) {
                String fieldName = entry.getKey();
                String fieldValue = fieldGetters.get(fieldName).apply(applicationRequest);
                throw new InvalidFieldsException(fieldName,
                    fieldName + " must match the required address format. Received: " + fieldValue);
            }
        }
    }

    private void verifyAddress(ApplicationRequest applicationRequest) {
        AddressInfo addressInfo = applicationRequest.toAddressInfo();

        try {
            String verifyResponse = taxCloudService.verifyAddress(addressInfo);
            applicationRequest.setNineDigitsPostalCode(addressInfo.getZipCode9());

            if (verifyResponse == null || verifyResponse.isEmpty()) {
                throw new InvalidFieldsException("address", "Failed to verify address: empty or null response from TaxCloud");
            }

            log.info("[LosRequestMessageConstraintValidator] Address verification successful for zip {}: {}",
                addressInfo.getZipCode(), verifyResponse);

        } catch (TaxCloudException e) {
            log.warn("[LosRequestMessageConstraintValidator] Address validation failed: {}", e.getMessage());
            //throw new InvalidFieldsException("address", e.getMessage());
        } catch (Exception e) {
            log.error("[LosRequestMessageConstraintValidator] Unexpected address verification failure for {}", addressInfo, e);
            //throw new InvalidFieldsException("address", "Unexpected error verifying address");
        }
    }

    private void populateStateFromZipCode(ApplicationRequest applicationRequest) {
        log.info("Given zip : {}, Given state : {}", applicationRequest.getMainPostalCode(), applicationRequest.getMainStateOrProvince());
        if (StringUtils.isBlank(applicationRequest.getMainStateOrProvince()) || config.getStateFromZip()) {
            String statesForZip = config.getStatesForZip(applicationRequest.getMainPostalCode());
            if (statesForZip == null) {
                statesForZip = StateForZip.getStateByZip(applicationRequest.getMainPostalCode());
            }
            if (statesForZip != null && (StringUtils.isBlank(applicationRequest.getMainStateOrProvince()) || !statesForZip.contains(applicationRequest.getMainStateOrProvince().toUpperCase()))) {
                applicationRequest.setMainStateOrProvince(Arrays.asList(statesForZip.split(",")).get(0));
            }
        }
        if (StringUtils.isBlank(applicationRequest.getMainStateOrProvince())) {
            throw new InvalidFieldsException("mainStateOrProvince", "Please provide mainStateOrProvince");
        }
    }

    private void validateBankAccount(ApplicationRequest applicationRequest) {
        if (StringUtils.isNotBlank(applicationRequest.getMainBankRoutingNumber())) {
            validateRoutingNumber(applicationRequest.getMainBankRoutingNumber());
        }
        if (StringUtils.isNotBlank(applicationRequest.getMainBankAccountNumber())) {
            validateAccountNumber(applicationRequest.getMainBankAccountNumber());
        }
    }

    private void validateRoutingNumber(String routingNumber) {
        if (!NumberUtils.isParsable(routingNumber) || !isRoutingNumberLengthValid(routingNumber)) {
            throw new InvalidFieldsException("mainBankRoutingNumber", "Invalid routing number. Received " + routingNumber);
        }
    }

    private void validateAccountNumber(String accountNumber) {
        if (!NumberUtils.isParsable(accountNumber) || !isAccountNumberInValidRange(accountNumber)) {
            throw new InvalidFieldsException("mainBankAccountNumber", "Invalid Bank Account Number. Received " + accountNumber);
        }
    }

    private boolean isRoutingNumberLengthValid(String routingNumber) {
        int expectedLength = config.getBankRoutingNumberLength();
        return routingNumber.length() == expectedLength;
    }

    private boolean isAccountNumberInValidRange(String accountNumber) {
        int minLength = config.getBankAccountNumberMinLength();
        int maxLength = config.getBankAccountNumberMaxLength();
        int accountNumberLength = accountNumber.length();
        return accountNumberLength >= minLength && accountNumberLength <= maxLength;
    }

    private void validateCreditCardBin(ApplicationRequest applicationRequest) {
        if (StringUtils.isNotBlank(applicationRequest.getMainCreditCardBin())) {
            String creditCardBin = applicationRequest.getMainCreditCardBin();
            if (!NumberUtils.isParsable(creditCardBin) || !isCreditCardBinInValidRange(creditCardBin)) {
                throw new InvalidFieldsException("mainCreditCardBin", "Invalid Credit Card bin. Received " + creditCardBin);
            }
        }
    }

    private boolean isCreditCardBinInValidRange(String creditCardBin) {
        int minLength = config.getCreditCardBinMinLength();
        int maxLength = config.getCreditCardBinMaxLength();
        int creditCardBinLength = creditCardBin.length();
        return creditCardBinLength >= minLength && creditCardBinLength <= maxLength;
    }

}






src/main/resources/correspondence/templates/kornerstone/activation-confirmation-notice-email.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Activation Confirmation Email</title>
</head>

<body>
<div style="width: 600px">

  <!-- HEADER LOGO -->
  <div style="overflow: visible;height: 52px;margin: 7px 0;clear: both;text-align: center;">
    <img style="width:132px;height:62px;overflow:visible;"
         src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png">
  </div>

  <!-- DATE -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:12px;color:#707070;">
    <div style="margin-top:35px;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <!-- TITLE -->
  <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:20px;color:#8FC31F;">
    <div style="margin:30px auto;width:450px;">
      Thank you,
      <span th:text="${CommonDataPojo.customerFirstName} + ' ' + ${CommonDataPojo.customerLastName}"></span>!
      <br>
      We have received your signed lease from
      <span th:text="${CommonDataPojo.merchantLocationName}"></span>.
    </div>
  </div>

  <!-- PAYMENT INFO -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:16px;color:#777;margin:20px 0;">
    <div style="margin:35px auto;width:420px;">
      Your first payment of $
      <span th:text="${CommonDataPojo.firstPaymentDueAmount}"></span>
      is due on
      <span th:text="${CommonDataPojo.firstPaymentDueDate}"></span>.
      You have
      <span th:text="${CommonDataPojo.remainingNumberOfPayments}"></span>
      more payments to gain ownership of your item(s).
    </div>
  </div>

  <!-- DELIVERY INFO -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;margin:20px 0;">
    <div style="margin:35px auto;width:420px;">
      <span th:text="${CommonDataPojo.merchantLocationName}"></span>
      has confirmed that they shipped or delivered your item(s) on
      <span th:text="${CommonDataPojo.deliveryDate}"></span>.
    </div>
  </div>

  <!-- NOTE -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:20px;color:#8FC31F;margin:20px 0;">
    <div style="margin:35px auto;width:430px;">
      <i>
        Don’t forget there are great early payoff options.<br>
        Check your lease for your 90 Day Special Program and other discounts available to you.
      </i>
    </div>
  </div>

  <!-- HELP SECTION -->
  <div style="background-color:#f7f7f7;padding:30px 0;width:572px;margin:41px auto 0;">

    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:18px;color:#222;text-transform:uppercase;">
      WE’RE HERE TO HELP!
    </div>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;">
      Call the number below to speak to one of<br>our customer service representatives.
    </p>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;">
      <a target="_blank"
         th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
         style="text-decoration:none;">
        kornerstonecredit.com
      </a>
    </p>

    <div style="margin:23px 0;text-align:center;">
      <div style="font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
        Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
        Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
        Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
      </div>

      <div style="margin-top:15px;font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
        CS@kornerstoneliving.com<br>
        (888) 521-5111
      </div>
    </div>

    <!-- SOCIAL MEDIA -->
    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:14px;color:#222;text-transform:uppercase;margin:13px 0;">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="text-align:center;margin-bottom:10px;">
      <div style="display:inline-block;">
        <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float:left;margin:0 15px;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
        </a>
        <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float:left;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
        </a>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="overflow:visible;height:52px;background-color:#8FC31F;margin:-1px 0;clear:both;text-align:center;">
    <img style="width:83px;height:38px;margin:6px;"
         src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>

</div>
</body>
</html>





src/main/resources/correspondence/templates/kornerstone/approval-email-general.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Approval Email General</title>
</head>
<body>
<div style="width: 600px">
  <div style="
        overflow: visible;
        height: 52px;
        margin: 7px 0;
        clear: both;
        text-align: center;
        ">
    <img style="
            width: 132px;
            height: 62px;
            overflow: visible;
          "
         src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png">
  </div>

  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 12px;
        color: #707070;
      ">
    <div style="margin: 0 auto;margin-top: 35px;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-weight: bold;
        font-size: 20px;
        color: #8FC31F;
      ">
    <div style="margin: 0 auto;width: 344px;margin-top: 30px;">
      Congratulations, <span th:text=" ${CommonDataPojo.customerFirstName}+ ' '+ ${CommonDataPojo.customerLastName}"></span>! <br>
      You've Been Approved for a $<span th:text="'' + ${CommonDataPojo.approvalAmount}"></span> lease with Kornerstone.
    </div>
  </div>

  <div style="
        overflow: visible;
        white-space: normal;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        color: #777777;
        margin: 20px 0;
      ">
    <div style="margin: 35px auto;width: 420px;">
      Please return to <span th:text="'' + ${CommonDataPojo.merchantLocationName}+ ','"></span> when you are ready to make your purchase and utilize your spending limit of $<span th:text="'' + ${CommonDataPojo.approvalAmount}"></span>.
    </div>
  </div>

  <div th:unless="${CommonDataPojo.chargeProcessingFee}">
    <div style="
        overflow: visible;
        background-color: #8FC31F;
        padding: 15px 0;
        font-family: Helvetica Neue;
      ">
      <div id="Rectangle_52" width="600" height="52" style="text-align: center">
        <span style="font-size: 20px; color: #FFFFFF">
          NO MONEY DOWN!
        </span>
      </div>
    </div>
  </div>

  <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 16px;
        color: #8FC31F;
        margin-top: 20px;
        margin-bottom: 15px;
      ">
    <i>Why utilize a lease-to-own transaction today?</i>
  </div>

  <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
      ">
    It’s an affordable pathway to ownership of your product(s)!
  </div>

  <div style="
        text-align: center;
        min-height: 150px;
        margin-top: 35px;
        font-family: Helvetica Neue;
        ">
    <!-- Feature Cards -->
    <div style="
          overflow: visible;
          width: 30%;
          height: 125px;
          border-radius: 14px;
          background-color: #F7F7F7;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
          float: left;
        ">
      <div>
        <img style="
              overflow: visible;
              margin-top: 35px;
              width: 38px;
              height: 34px;
            " src="https://storage.googleapis.com/uown/kornerstone/icon-speedometer.png">
      </div>
      <div style="margin-top: -2px;font-weight: bold;font-size: 14px;">
        No Credit
      </div>
      <div style="font-weight: bold;font-size: 14px;">Required</div>
    </div>

    <div style="
          overflow: visible;
          width: 30%;
          height: 125px;
          border-radius: 14px;
          background-color: #F7F7F7;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
          margin: 0 5%;
          float: left;
        ">
      <div>
        <img style="
              overflow: visible;
              margin-top: 30px;
              width: 26.79px;
              height: 30.61px;
            " src="https://storage.googleapis.com/uown/kornerstone/icon-calendar.png">
      </div>
      <div style="margin-top: 3px;font-weight: bold;font-size: 14px;">
        90-Day Special
      </div>
      <div style="font-weight: bold;font-size: 14px;">Program Available</div>
    </div>

    <div style="
          overflow: visible;
          width: 30%;
          height: 125px;
          border-radius: 14px;
          background-color: #F7F7F7;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.161);
          float: left;
        ">
      <div>
        <img style="
              overflow: visible;
              margin-top: 35px;
              width: 30px;
              height: 24px;
            " src="https://storage.googleapis.com/uown/kornerstone/icon-payment.png">
      </div>
      <div style="margin-top: 3px;font-weight: bold;font-size: 14px;">
        Payment Up to
      </div>
      <div style="font-weight: bold;font-size: 14px;">13 Months</div>
    </div>
  </div>

  <div style="
        background-color: #F7F7F7;
        padding: 30px 0;
        width: 572px;
        margin-left: 12px;
        margin-top: 41px;
        ">
    <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 18px;
        color: #222222;
        text-transform: uppercase;
      ">
      WE’RE HERE TO HELP!
    </div>

    <p style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #222222;
      ">
      Call the number below to speak to one of<br>our customer service representatives.
    </p>

    <p style="text-align: center;font-family: Helvetica Neue;font-size: 14px;">
      <a target="_blank"
         th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
         style="text-decoration: none">kornerstonecredit.com</a>
    </p>

    <div style="margin: 23px 0;text-align: center;">
      <div style="font-family: Helvetica Neue;font-size: 14px;color: #8FC31F;font-weight: bold;">
        Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
        Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
        Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
      </div>

      <div style="margin-top: 15px;font-family: Helvetica Neue;font-size: 14px;color: #8FC31F;font-weight: bold;">
        CS@kornerstoneliving.com<br>
        (888) 521-5111
      </div>
    </div>

    <div style="
        overflow: visible;
        text-align: center;
        font-family: Helvetica Neue;
        font-style: normal;
        font-weight: bold;
        font-size: 14px;
        color: #222222;
        text-transform: uppercase;
        margin: 13px 0;
        clear: both;
      ">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
      <div style="margin: 0 auto; display: inline-block;">
        <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
          <img style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
			" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
        </a>

        <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
          <img style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
			" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
        </a>
      </div>
    </div>
  </div>

  <div style="
    overflow: visible;
    height: 52px;
    background-color: #8FC31F;
    margin: -1px 0;
    clear: both;
    text-align: center;
    ">
    <img style="
      width: 83px;
      height: 38px;
      overflow: visible;
      margin: 6px;
    " src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>
</div>
</body>
</html>





src/main/resources/correspondence/templates/kornerstone/decline-email.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Decline Email</title>
</head>
<body>
<div style="width: 600px">
  <!-- Header Logo -->
  <div style="overflow: visible; height: 52px; margin: 7px 0; clear: both; text-align: center;">
    <img style="width: 132px; height: 62px; overflow: visible;"
         src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png"
         alt="Kornerstone Logo">
  </div>

  <!-- Date -->
  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-size: 12px; color: #707070;">
    <div style="margin: 0 auto; margin-top: 35px;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <!-- Greeting & Intro -->
  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-weight: bold; font-size: 20px; color: #8FC31F;">
    <div style="margin: 0 auto; width: 344px; margin-top: 30px;">
      Dear <span th:text="${CommonDataPojo.customerFirstName} + ' ' + ${CommonDataPojo.customerLastName}"></span>,<br>
      Thank you for applying to us for a rental-purchase agreement.
    </div>
  </div>

  <!-- Decline Message -->
  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-size: 18px; color: #777777; margin: 20px 0;">
    <div style="margin: 35px auto; width: 420px;">
      After carefully reviewing your application, we are sorry to advise you that we cannot provide you with merchandise to rent at this time.
    </div>
  </div>

  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-size: 16px; margin: 18px 0;">
    <div style="margin: 35px auto; width: 420px;">
      If you would like a statement of specific reasons why your application was denied, please contact our compliance department below within 60 days of this notice. We will provide you with the statement of reasons within 30 days after receiving your request.
    </div>
  </div>

  <!-- Company Address -->
  <div style="text-align: left; margin-left: 85px; font-style: normal;">
    <p style="font-family: Helvetica Neue; font-weight: bold; font-size: 16px; color: #777777; margin-top: 30px;">
      Kornerstone Living
    </p>
    <p style="font-family: Helvetica Neue; font-weight: normal; font-size: 15px; color: #777777; margin-top: -10px;">
      10500 University Center Drive<br>
      Suite 150<br>
      Tampa, FL 33612<br>
      Phone: <span style="color: #8FC31F;">1-877-353-8696</span>
    </p>
  </div>

  <!-- Consumer Reporting Info -->
  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-size: 16px; margin: 18px 0;">
    <div style="margin: 35px auto; width: 420px;">
      If we obtained information from a consumer reporting agency as part of our consideration of your application, its name, address, and toll-free telephone number is shown below.
    </div>
  </div>

  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-style: italic; font-size: 14px; margin: 18px 0;">
    <div style="margin: 35px auto; width: 430px;">
      The reporting agency played no part in our decision and is unable to supply specific reasons why we have denied your application. You have a right under the Fair Credit Reporting Act to know the information contained in your credit file at the consumer reporting agency. You have a right to a free copy of your report from the reporting agency, if you request it no later than 60 days after you receive this notice. If you find any inaccurate or incomplete information, you have the right to dispute the matter directly with the reporting agency.
    </div>
  </div>

  <!-- Agencies -->
  <div style="text-align: left; margin-left: 85px; font-style: normal;">
    <p style="font-weight: bold; font-size: 16px; color: #777777; margin-top: 10px;">DataX Ltd</p>
    <p style="font-weight: normal; font-size: 15px; color: #8FC31F; margin-top: -10px;">
      http://dataxltd.com/<br>
      Email: <span style="color: #8FC31F;">compliance@dataxltd.com</span><br>
      Phone: <span style="color: #8FC31F;">1-800-295-4790</span>
    </p>

    <p style="font-weight: bold; font-size: 16px; color: #777777; margin-top: 30px;">FactorTrust Inc.</p>
    <p style="font-weight: normal; font-size: 15px; color: #8FC31F; margin-top: -10px;">
      http://ws.factortrust.com/consumer-inquiry/<br>
      Email: <span style="color: #8FC31F;">customercare@factortrust.com</span><br>
      Phone: <span style="color: #8FC31F;">1-844-773-3321</span>
    </p>

    <p style="font-weight: bold; font-size: 16px; color: #777777; margin-top: 30px;">Clarity Services, Inc.</p>
    <p style="font-weight: normal; font-size: 15px; color: #8FC31F; margin-top: -10px;">
      https://www.clarityservices.com/contact/<br>
      Phone: <span style="color: #8FC31F;">1-866-390-3118</span>
    </p>

    <p style="font-weight: bold; font-size: 16px; color: #777777; margin-top: 30px;">LexisNexis</p>
    <p style="font-weight: normal; font-size: 15px; color: #8FC31F; margin-top: -10px;">
      https://consumer.risk.lexisnexis.com/consumer<br>
      Phone: <span style="color: #8FC31F;">1-866-897-8126</span>
    </p>
  </div>

  <!-- Closing & Signature -->
  <div style="text-align: center;">
    <p style="font-family: Helvetica Neue; font-size: 16px; color: #222222; margin-top: 50px;">Sincerely,</p>
    <p style="font-family: Helvetica Neue; font-weight: bold; font-size: 20px; color: #8FC31F; margin-top: 20px;">Kornerstone Living</p>
  </div>

  <!-- Federal Notice -->
  <div style="overflow: visible; white-space: normal; text-align: center; font-family: Helvetica Neue; font-size: 12px; margin: 18px 0;">
    <div style="margin: 35px auto; width: 450px;">
      <b>Notice:</b> <i>The Federal Equal Credit Opportunity Act prohibits us from discriminating against applicants on the basis of race, color, religion, national origin, sex, marital status, age (provided the applicant has the capacity to enter into a binding contract); because all or part of the applicant’s income derives from any public assistance program; or because the applicant has in good faith exercised any right under the Consumer Credit Protection Act. The Federal agency that administers compliance with this law concerning this creditor is FTC Regional Office for region in which the creditor operates or Federal Trade Commission, Equal Credit Opportunity, Washington, DC 20580.</i>
    </div>
  </div>

  <!-- Customer Service Section -->
  <div style="background-color: rgba(247,247,247,1); padding: 30px 0; width: 572px; margin-left: 12px; margin-top: 41px;">
    <div style="text-align: center; font-family: Helvetica Neue; font-weight: bold; font-size: 18px; color: #222222; text-transform: uppercase;">WE’RE HERE TO HELP!</div>
    <p style="text-align: center; font-family: Helvetica Neue; font-size: 14px; color: #222222;">Call the number below to speak to one of our customer service representatives.</p>
    <p style="text-align: center; font-family: Helvetica Neue; font-size: 14px; color: #8FC31F;">
      <a th:href="'https://portal.kornerstoneliving.com' + ${CommonDataPojo.customerPortalParameters}" target="_blank">www.kornerstoneliving.com</a>
    </p>

    <div style="margin: 23px 0;">
      <div style="width: 572px; display: block; height: 53px;">
        <div style="width: 377px; margin: 0 auto;">
          <div style="font-family: Helvetica Neue; font-weight: bold; font-size: 14px; color: #8FC31F; text-align: center;">
            Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
            Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
            Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
          </div>
        </div>
      </div>
      <div style="width: 572px; display: block; height: 53px;">
        <div style="width: 572px;">
          <div style="font-family: Helvetica Neue; font-weight: bold; font-size: 14px; color: #8FC31F; text-align: center;">
            cs@kornerstoneliving.com<br>
            (877) 357-5474
          </div>
        </div>
      </div>
    </div>

    <!-- SOCIAL MEDIA -->
    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:14px;color:#222;text-transform:uppercase;margin:13px 0;">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="text-align:center;margin-bottom:10px;">
      <div style="display:inline-block;">
        <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float:left;margin:0 15px;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
        </a>
        <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float:left;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
        </a>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="overflow: visible; height: 52px; background-color: #8FC31F; margin: -1px 0; clear: both; text-align: center;">
    <img style="width: 83px; height: 38px; margin: 6px;" src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>
</div>
</body>
</html>





src/main/resources/correspondence/templates/kornerstone/finalize-purchase-email.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Finalize Purchase Email</title>
</head>
<body>
<div style="width: 600px">

  <!-- HEADER -->
  <div style="overflow: visible;height: 52px;margin: 7px 0;clear: both;text-align: center;">
    <img style="width:132px;height:62px;overflow:visible;"
         src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png">
  </div>

  <div style="text-align:center;font-family:Helvetica Neue;font-size:12px;color:#707070;">
    <div style="margin-top:35px;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:20px;color:#8FC31F;">
    <div style="margin:30px auto;width:344px;">
      Hi,
      <span th:text="${CommonDataPojo.customerFirstName}+ ' '+ ${CommonDataPojo.customerLastName}"></span>!
      <br>
      Finalize your purchase of
      <span th:text="'' + ${#numbers.formatCurrency(CommonDataPojo.costPriceWithTaxNoFee)} + ','"></span>
      with Kornerstone.
    </div>
  </div>

  <div style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;margin:20px 0;">
    <div style="margin:35px auto;width:420px;">
      Please click below to finalize your purchase.
    </div>
  </div>

  <div style="background-color:#8FC31F;padding:15px 0;border-radius:10px;margin:auto;width:200px;">
    <a th:href="${CommonDataPojo.paymentOptionUrl}" style="text-decoration:none;">
      <div style="font-size:20px;color:white;text-align:center;font-family:Helvetica Neue;">
        CLICK HERE
      </div>
    </a>
  </div>

  <div style="text-align:center;font-family:Helvetica Neue;font-size:20px;color:#8FC31F;margin:20px 0;">
    <i>We look forward to working with you!</i>
  </div>

  <!-- HELP SECTION -->
  <div style="background-color:#F7F7F7;padding:30px 0;width:572px;margin:40px auto 0;">
    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:18px;">
      WE’RE HERE TO HELP!
    </div>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;">
      Call the number below to speak to one of<br>our customer service representatives.
    </p>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;">
      <a target="_blank"
         th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
         style="text-decoration:none;">
        kornerstonecredit.com
      </a>
    </p>

    <div style="text-align:center;margin:23px 0;font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
      Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
      Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
      Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
    </div>

    <div style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
      CS@kornerstoneliving.com<br>
      (888) 521-5111
    </div>

    <!-- SOCIAL -->
    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:14px;margin:20px 0;">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="text-align:center;margin-bottom:10px;">
      <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="margin:0 15px;">
        <img width="20" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
      </a>
      <a href="https://www.instagram.com/kornerstoneliving" target="_blank">
        <img width="20" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
      </a>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="height:52px;background-color:#8FC31F;text-align:center;margin-top:-1px;">
    <img style="width:83px;height:38px;margin:6px;"
         src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>

</div>
</body>
</html>




src/main/resources/correspondence/templates/kornerstone/initial-payment-receipt-email.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>1st Payment Email</title>
</head>

<body>
<div style="width: 600px">

  <!-- HEADER LOGO -->
  <div style="overflow: visible;height: 52px;margin: 7px 0;clear: both;text-align: center;">
    <img style="
          width: 132px;
          height: 62px;
          overflow: visible;
        "
         src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png">
  </div>

  <!-- TITLE -->
  <div style="text-align: center;font-family: Helvetica Neue;font-weight: bold;font-size: 20px;color: #8FC31F;">
    <div style="margin: 30px auto;width: 344px;">Payment Receipt</div>
  </div>

  <!-- DATE -->
  <div style="text-align: center;font-family: Helvetica Neue;font-size: 12px;color: #707070;">
    <div style="margin-top: 35px;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <!-- CUSTOMER INFO -->
  <div style="font-family: Helvetica Neue;font-size: 14px;color: #222222;margin: 35px auto;width: 500px;line-height: 23px;">
    <span th:text="${CommonDataPojo.customerFirstName} + ' ' + ${CommonDataPojo.customerLastName}"></span><br>
    <span th:text="${CommonDataPojo.customerStreetAddress1}"></span><br>
    <span th:text="${CommonDataPojo.customerCity} + ', ' + ${CommonDataPojo.customerState} + ' ' + ${CommonDataPojo.customerZipCode}"></span><br>
    Phone: <span th:text="${CommonDataPojo.customerPhoneNumbers}"></span><br>
    Email: <span th:text="${CommonDataPojo.customerEmailAddresses}"></span>
  </div>

  <!-- CONTRACT -->
  <div style="font-family: Helvetica Neue;font-size: 14px;color: #222222;margin: 0 auto 35px;width: 500px;">
    <hr>
    CONTRACT #: <span th:text="'KORNERSTONE_' + ${CommonDataPojo.leadPK}"></span><br><br>
    RECEIPT #: <span th:text="${CommonDataPojo.receiptNum}"></span>
    <hr>
  </div>

  <!-- PAID BOX -->
  <div style="
      margin: auto;
      margin-top: 35px;
      width: 83%;
      height: 100px;
      background-color: #f7f7f7;
      border-radius: 3px;
      box-shadow: 0 3px 6px rgba(0,0,0,.16);
      text-align: center;
      font-family: Helvetica Neue;
  ">
    <div style="float:left;width:45%;margin-top:35px;font-weight:bold;font-size:23px;text-align:right;">
      Paid:
    </div>
    <div style="float:left;width:50%;margin-top:35px;font-weight:bold;font-size:23px;color:#8FC31F;text-align:left;">
      $ <span th:text="${CommonDataPojo.paidAmount}"></span>
    </div>
  </div>

  <!-- THANK YOU -->
  <div style="text-align: center;font-family: Helvetica Neue;font-size: 21px;color: #8FC31F;margin: 35px auto;">
    Thank you for your business!
  </div>

  <!-- HELP SECTION -->
  <div style="background-color:#f7f7f7;padding:30px 0;width:572px;margin:41px auto 0;">

    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:18px;color:#222;text-transform:uppercase;">
      WE’RE HERE TO HELP!
    </div>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;">
      Call the number below to speak to one of<br>our customer service representatives.
    </p>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;">
      <a target="_blank"
         th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
         style="text-decoration:none;">
        kornerstonecredit.com
      </a>
    </p>

    <div style="margin:23px 0;text-align:center;">
      <div style="font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
        Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
        Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
        Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
      </div>

      <div style="margin-top:15px;font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
        CS@kornerstoneliving.com<br>
        (888) 521-5111
      </div>
    </div>

    <!-- SOCIAL MEDIA -->
    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:14px;color:#222;text-transform:uppercase;margin:13px 0;">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="text-align:center;margin-bottom:10px;">
      <div style="display:inline-block;">
        <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float:left;margin:0 15px;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
        </a>
        <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float:left;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
        </a>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="
      overflow: visible;
      height: 52px;
      background-color: #8FC31F;
      margin: -1px 0;
      clear: both;
      text-align: center;
  ">
    <img style="
        width: 83px;
        height: 38px;
        overflow: visible;
        margin: 6px;
      "
         src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>

</div>
</body>
</html>





src/main/resources/correspondence/templates/kornerstone/send-application-email.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Application Email</title>
</head>
<body>
<div style="width: 600px; background-color: #00">

  <!-- Logo -->
  <div style="overflow: visible;height: 52px;margin: 7px 0;clear: both;text-align: center;">
    <img
      style="width: 132px;height: 62px;overflow: visible;"
      src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png">
  </div>

  <!-- Date -->
  <div style="text-align: center;font-family: Helvetica Neue;font-size: 12px;color: #707070;">
    <div style="margin: 35px auto 0;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <!-- Header -->
  <div style="text-align: center;font-family: Helvetica Neue;font-weight: bold;font-size: 20px;color: #8FC31F;">
    <div style="margin: 30px auto;width: 344px;">
      Hello! <br><br>
      Please see below to start your application today with Kornerstone.
    </div>
  </div>

  <!-- CTA Button -->
  <div style="
      background-color: #8FC31F;
      padding: 15px 0;
      font-family: Helvetica Neue;
      border-radius: 10px;
      margin: 40px auto;
      width: 250px;
    ">
    <a th:href="${CommonDataPojo.sendApplicationUrl}" style="text-decoration:none;">
      <button style="
          font-size: 20px;
          color: white;
          cursor: pointer;
          display: block;
          background: transparent;
          border: none;
          width: 100%;
          text-align: center;
        ">
        CLICK HERE TO APPLY
      </button>
    </a>
  </div>

  <!-- Closing text -->
  <div style="text-align: center;font-family: Helvetica Neue;font-size: 20px;color: #8FC31F;">
    <div style="margin: 35px auto;width: 430px;">
      <i>We look forward to working with you!</i>
    </div>
  </div>

  <!-- Help Section -->
  <div style="background-color: #F7F7F7;padding: 30px 0;width: 572px;margin: 41px auto 0;">
    <div style="text-align: center;font-family: Helvetica Neue;font-weight: bold;font-size: 18px;text-transform: uppercase;">
      WE’RE HERE TO HELP!
    </div>

    <p style="text-align: center;font-family: Helvetica Neue;font-size: 14px;">
      Call the number below to speak to one of<br>
      our customer service representatives.
    </p>

    <p style="text-align: center;font-family: Helvetica Neue;font-size: 14px;">
      <a target="_blank"
         th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
         style="text-decoration: none">kornerstonecredit.com</a>
    </p>

    <div style="margin: 23px 0;text-align: center;">
      <div style="font-family: Helvetica Neue;font-size: 14px;color: #8FC31F;font-weight: bold;">
        Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
        Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
        Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
      </div>

      <div style="margin-top: 15px;font-family: Helvetica Neue;font-size: 14px;color: #8FC31F;font-weight: bold;">
        CS@kornerstoneliving.com<br>
        (888) 521-5111
      </div>
    </div>

    <!-- Social -->
    <div style="text-align: center;font-family: Helvetica Neue;font-weight: bold;font-size: 14px;margin: 20px 0;">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="display: block; margin-bottom: 10px; height: 20px; text-align: center;">
      <div style="margin: 0 auto; display: inline-block;">
        <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float: left; margin: 0 15px">
          <img style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
			" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
        </a>

        <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float: left;">
          <img style="
            overflow: visible;
            width: 19.781px;
            height: 19.777px;
            transform: matrix(1, 0, 0, 1, 0, 0);
			" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
        </a>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="height: 52px;background-color: #8FC31F;text-align: center;">
    <img
      style="width: 83px;height: 38px;margin: 6px;"
      src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>

</div>
</body>
</html>





src/main/resources/correspondence/templates/kornerstone/welcome-email.html
<html lang="en" xmlns:th="http://www.thymeleaf.org">
<head>
  <title>Kornerstone Welcome Email</title>
</head>

<body>
<div style="width: 600px">

  <!-- HEADER LOGO -->
  <div style="overflow: visible;height: 52px;margin: 7px 0;clear: both;text-align: center;">
    <img style="width:132px;height:62px;overflow:visible;"
         src="https://storage.googleapis.com/uown/kornerstone/kc-login-logo.png">
  </div>

  <!-- DATE -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:12px;color:#707070;">
    <div style="margin-top:35px;">
      <span th:text="${#dates.format(#dates.createNow(), 'MMM dd, yyyy')}"></span>
    </div>
  </div>

  <!-- TITLE -->
  <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:20px;color:#8FC31F;">
    <div style="margin:30px auto;width:344px;">
      Welcome,
      <span th:text="${CommonDataPojo.customerFirstName} + ' ' + ${CommonDataPojo.customerLastName}"></span>!
      <br>
      You’ve signed a lease for
      <span th:text="${#numbers.formatCurrency(CommonDataPojo.costPriceWithFeeNoTax)}"></span>
      with Kornerstone.
    </div>
  </div>

  <!-- FIRST PAYMENT -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;margin:20px 0;">
    <div style="margin:35px auto;width:420px;">
      Your first payment amount is $
      <span th:text="${CommonDataPojo.firstPaymentDueAmount}"></span>
      due on your first paydate after shipment of your item(s).
    </div>
  </div>

  <!-- TOTAL PAYMENTS -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;margin:20px 0;">
    <div style="margin:35px auto;width:420px;">
      You have
      <span th:text="${CommonDataPojo.totalNumberOfPayments}"></span>
      total payments over the next
      <span th:text="${CommonDataPojo.numOfMonths}"></span>
      months in order to gain ownership of your item(s).
    </div>
  </div>

  <!-- REGULAR PAYMENT -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;margin:20px 0;">
    <div style="margin:35px auto;width:420px;">
      After your first payment, your regular payment amount is $
      <span th:text="${CommonDataPojo.nextPaymentDueAmount}"></span>.
    </div>
  </div>

  <!-- NOTE -->
  <div style="text-align:center;font-family:Helvetica Neue;font-size:20px;color:#8FC31F;margin:20px 0;">
    <div style="margin:35px auto;width:430px;">
      <i>
        Don’t forget there are great early payoff options.<br>
        Check your lease for your 90 Day Special Program and other discounts available to you.
      </i>
    </div>
  </div>

  <!-- HELP SECTION -->
  <div style="background-color:#f7f7f7;padding:30px 0;width:572px;margin:41px auto 0;">

    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:18px;color:#222;text-transform:uppercase;">
      WE’RE HERE TO HELP!
    </div>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;color:#222;">
      Call the number below to speak to one of<br>our customer service representatives.
    </p>

    <p style="text-align:center;font-family:Helvetica Neue;font-size:14px;">
      <a target="_blank"
         th:href="'https://'+ ${CommonDataPojo.customerPortalUrl} + ${CommonDataPojo.customerPortalParameters}"
         style="text-decoration:none;">
        kornerstonecredit.com
      </a>
    </p>

    <div style="margin:23px 0;text-align:center;">
      <div style="font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
        Mon - Fri<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationWeekdays}"></span></span><br>
        Sat<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSaturday}"></span></span><br>
        Sun<span style="font-style: normal; font-weight: normal;">: <span th:text="${CommonDataPojo.companyInfo.hoursOfOperationSunday}"></span></span>
      </div>

      <div style="margin-top:15px;font-family:Helvetica Neue;font-size:14px;color:#8FC31F;font-weight:bold;">
        CS@kornerstoneliving.com<br>
        (888) 521-5111
      </div>
    </div>

    <!-- SOCIAL MEDIA -->
    <div style="text-align:center;font-family:Helvetica Neue;font-weight:bold;font-size:14px;color:#222;text-transform:uppercase;margin:13px 0;">
      FOLLOW US ON SOCIAL MEDIA!
    </div>

    <div style="text-align:center;margin-bottom:10px;">
      <div style="display:inline-block;">
        <a href="https://www.facebook.com/Kornerstoneliving/" target="_blank" style="float:left;margin:0 15px;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/facebook.png">
        </a>
        <a href="https://www.instagram.com/kornerstoneliving" target="_blank" style="float:left;">
          <img width="20" src="https://storage.googleapis.com/uown/kornerstone/ig.png">
        </a>
      </div>
    </div>

  </div>

  <!-- FOOTER -->
  <div style="overflow:visible;height:52px;background-color:#8FC31F;margin:-1px 0;clear:both;text-align:center;">
    <img style="width:83px;height:38px;margin:6px;"
         src="https://storage.googleapis.com/uown/kornerstone/Kornerstone-Living.png">
  </div>

</div>
</body>
</html>





src/main/resources/db/migration/V20260129052242__add_short_code_to_loslead.sql
-- =====================================================
-- Flyway Migration: V20260129162000__add_short_code_to_uown_los_lead.sql
-- Created: 2026-01-29 16:20:00 PST/PDT
-- Description: Add short_code column to uown_los_lead (LeadInfo embedded) and create partial index
-- =====================================================

ALTER TABLE "uown_los_lead" 
ADD COLUMN IF NOT EXISTS short_code VARCHAR(8);

-- Partial index: index only non-null short_code values
CREATE INDEX IF NOT EXISTS idx_uown_los_lead_short_code
ON "uown_los_lead"(short_code)
WHERE short_code IS NOT NULL;

-- =====================================================
-- Migration DOWN (commented) - For reference only
-- To undo these changes, create a new migration and apply:
-- =====================================================
-- DROP INDEX IF EXISTS idx_uown_los_lead_short_code;
-- ALTER TABLE "uown_los_lead" DROP COLUMN short_code;





src/test/java/com/uownleasing/svc/utility/SmsMessageBuilder.java
package com.uownleasing.svc.utility;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;

import com.uownleasing.svc.enumeration.ClientType;
import org.junit.jupiter.api.Test;

class SmsMessageBuilderTest {

    @Test
    void buildApprovalMessage_shouldReturnUownMessage_whenClientIsUown() {
        BigDecimal creditLimit = BigDecimal.valueOf(1500);

        String message = SmsMessageBuilder.buildApprovalMessage(ClientType.V1_UOWN, creditLimit);

        assertTrue(message.contains("Uown"));
        assertTrue(message.contains(creditLimit.toString()));
        assertTrue(message.contains("Reply STOP to unsubscribe"));
    }

    @Test
    void buildApprovalMessage_shouldReturnKornerstoneMessage_whenClientIsKornerstone() {
        BigDecimal creditLimit = BigDecimal.valueOf(2000);

        String message = SmsMessageBuilder.buildApprovalMessage(ClientType.KORNERSTONE, creditLimit);

        assertTrue(message.contains("Kornerstone"));
        assertTrue(message.contains(creditLimit.toString()));
        assertTrue(message.contains("Reply STOP to unsubscribe"));
    }

    @Test
    void buildApplicationRedirectMessage_shouldReturnUownMessage_whenClientIsUown() {
        String redirectUrl = "http://uown.com/apply";

        String message = SmsMessageBuilder.buildApplicationRedirectMessage(ClientType.V1_UOWN, redirectUrl);

        assertTrue(message.contains("Uown"));
        assertTrue(message.contains(redirectUrl));
        assertTrue(message.contains("Reply STOP to Unsubscribe"));
    }

    @Test
    void buildApplicationRedirectMessage_shouldReturnKornerstoneMessage_whenClientIsKornerstone() {
        String redirectUrl = "http://kornerstone.com/apply";

        String message = SmsMessageBuilder.buildApplicationRedirectMessage(ClientType.KORNERSTONE, redirectUrl);

        assertTrue(message.contains("Kornerstone"));
        assertTrue(message.contains(redirectUrl));
        assertTrue(message.contains("Reply STOP to Unsubscribe"));
    }

    @Test
    void buildApprovalMessage_shouldDefaultToUown_forBRIDGE() {
        BigDecimal creditLimit = BigDecimal.valueOf(500);

        String message = SmsMessageBuilder.buildApprovalMessage(ClientType.BRIDGE, creditLimit);

        assertTrue(message.contains("Uown"));
        assertTrue(message.contains(creditLimit.toString()));
    }

    @Test
    void buildApplicationRedirectMessage_shouldDefaultToUown_forCHOICE_PAYe() {
        String redirectUrl = "http://example.com";

        String message = SmsMessageBuilder.buildApplicationRedirectMessage(ClientType.CHOICE_PAY, redirectUrl);

        assertTrue(message.contains("Uown"));
        assertTrue(message.contains(redirectUrl));
    }

    @Test
    void buildPurchaseFinalizationMessage_shouldReturnUownMessage() {
        String redirectUrl = "http://uown.com/finalize";

        String message = SmsMessageBuilder.buildPurchaseFinalizationMessage(
            ClientType.V1_UOWN,
            redirectUrl
        );

        assertTrue(message.contains("Uown"));
        assertTrue(message.contains(redirectUrl));
        assertTrue(message.contains("Reply STOP to Unsubscribe"));
    }

    @Test
    void buildPurchaseFinalizationMessage_shouldReturnKornerstoneMessage() {
        String redirectUrl = "http://kornerstone.com/finalize";

        String message = SmsMessageBuilder.buildPurchaseFinalizationMessage(
            ClientType.KORNERSTONE,
            redirectUrl
        );

        assertTrue(message.contains("Kornerstone"));
        assertTrue(message.contains(redirectUrl));
        assertTrue(message.contains("Reply STOP to Unsubscribe"));
    }

    @Test
    void buildVerifiedFinalizeMessage_shouldReturnUownMessage() {
        String template = "Hi, %s %s!%nFinalize your purchase of $%s, with Uown.%n%s%nReply STOP to Unsubscribe. Uownleasing";
        String firstName = "John";
        String lastName = "Doe";
        BigDecimal totalAmount = BigDecimal.valueOf(1200);
        String redirectUrl = "http://uown.com/finalize";

        String message = SmsMessageBuilder.buildVerifiedFinalizeMessage(
            ClientType.V1_UOWN,
            firstName,
            lastName,
            totalAmount,
            redirectUrl,
            template
        );

        assertTrue(message.contains("Uown"));
        assertTrue(message.contains("Uownleasing"));
        assertTrue(message.contains(firstName));
        assertTrue(message.contains(lastName));
        assertTrue(message.contains(totalAmount.toString()));
        assertTrue(message.contains(redirectUrl));
    }

    @Test
    void buildVerifiedFinalizeMessage_shouldReturnKornerstoneMessage() {
        String template = "Hi, %s %s!%nFinalize your purchase of $%s, with Uown.%n%s%nReply STOP to Unsubscribe. Uownleasing";
        String firstName = "Jane";
        String lastName = "Smith";
        BigDecimal totalAmount = BigDecimal.valueOf(2500);
        String redirectUrl = "http://kornerstone.com/finalize";

        String message = SmsMessageBuilder.buildVerifiedFinalizeMessage(
            ClientType.KORNERSTONE,
            firstName,
            lastName,
            totalAmount,
            redirectUrl,
            template
        );

        assertTrue(message.contains("Kornerstone"));
        assertTrue(message.contains(firstName));
        assertTrue(message.contains(lastName));
        assertTrue(message.contains(totalAmount.toString()));
        assertTrue(message.contains(redirectUrl));
    }
}




src/test/java/com/uownleasing/svc/utility/UrlBuilderUtilsTest.java
package com.uownleasing.svc.utility;

import com.uownleasing.svc.enumeration.ClientType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;


import com.uownleasing.svc.enumeration.ClientType;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class UrlBuilderUtilsTest {

    private static final String SHORT_CODE = "Ab3Kx9";

    // ---------- FINALIZE URL ----------

    @ParameterizedTest(name = "[{index}] FINALIZE - {0} - env={1}")
    @MethodSource("finalizeUrlCases")
    void shouldBuildFinalizeUrlCorrectly(
        ClientType clientType,
        String env,
        String expectedUrl
    ) {
        String url = UrlBuilderUtils.buildFinalizeUrl(
            clientType,
            env,
            SHORT_CODE
        );

        assertThat(url).isEqualTo(expectedUrl);
    }

    private static Stream<Arguments> finalizeUrlCases() {
        return Stream.of(
            // UOWN
            Arguments.of(
                ClientType.V1_UOWN,
                "prod",
                "https://secure.uownleasing.com/" + SHORT_CODE + "/finalize"
            ),
            Arguments.of(
                ClientType.V1_UOWN,
                null,
                "https://secure-dev1.uownleasing.com/" + SHORT_CODE + "/finalize"
            ),

            // KORNERSTONE
            Arguments.of(
                ClientType.KORNERSTONE,
                "prod",
                "https://secure.kornerstoneliving.com/" + SHORT_CODE + "/finalize"
            ),
            Arguments.of(
                ClientType.KORNERSTONE,
                "sandbox ",
                "https://secure-sandbox.kornerstoneliving.com/" + SHORT_CODE + "/finalize"
            )
        );
    }

    // ---------- COMPLETE URL ----------

    @ParameterizedTest(name = "[{index}] COMPLETE - {0} - env={1}")
    @MethodSource("completeUrlCases")
    void shouldBuildCompleteUrlCorrectly(
        ClientType clientType,
        String env,
        String expectedUrl
    ) {
        String url = UrlBuilderUtils.buildCompleteUrl(
            clientType,
            env,
            SHORT_CODE
        );

        assertThat(url).isEqualTo(expectedUrl);
    }

    private static Stream<Arguments> completeUrlCases() {
        return Stream.of(
            Arguments.of(
                ClientType.V1_UOWN,
                "prod",
                "https://secure.uownleasing.com/" + SHORT_CODE + "/complete"
            ),
            Arguments.of(
                ClientType.KORNERSTONE,
                "dev2",
                "https://secure-dev2.kornerstoneliving.com/" + SHORT_CODE + "/complete"
            )
        );
    }

    // ---------- SEND APPLICATION URL ----------

    @ParameterizedTest(name = "[{index}] SEND - {0} - env={1}")
    @MethodSource("startApplicationUrlCases")
    void shouldBuildSendApplicationUrlCorrectly(
        ClientType clientType,
        String env,
        String expectedUrl
    ) {
        String url = UrlBuilderUtils.buildStartApplicationUrl(
            clientType,
            env,
            SHORT_CODE
        );

        assertThat(url).isEqualTo(expectedUrl);
    }

    private static Stream<Arguments> startApplicationUrlCases() {
        return Stream.of(
            // UOWN
            Arguments.of(
                ClientType.V1_UOWN,
                null,
                "https://apply-dev1.uownleasing.com/" + SHORT_CODE + "/start"
            ),
            Arguments.of(
                ClientType.V1_UOWN,
                "prod",
                "https://apply.uownleasing.com/" + SHORT_CODE + "/start"
            ),

            // KORNERSTONE
            Arguments.of(
                ClientType.KORNERSTONE,
                null,
                "https://apply-dev1.kornerstoneliving.com/" + SHORT_CODE + "/start"
            ),
            Arguments.of(
                ClientType.KORNERSTONE,
                "stg",
                "https://apply-stg.kornerstoneliving.com/" + SHORT_CODE + "/start"
            )
        );
    }
}

---------------------------------------------------------------------------------------------------------------------------------------------------------

1. **Detecção do fluxo Kornerstone**  
   - Validar que o rebranding só é aplicado quando o lead/merchant retorna `ClientType.KORNERSTONE` (URLs `apply/secure kornerstoneliving` e short code obrigatório).  
   - Confirmar que flows UOWN continuam com branding original, inclusive nas URLs legadas (`origination-*.uownleasing.com/...`).

2. **Envio de e-mail “Send Application”**  
   - Ao disparar `SendApplicationEmail`, verificar presença do logo Kornerstone, cores verde/púrpura e layout atualizado exclusivo @src/main/resources/correspondence/templates/kornerstone/send-application-email.html#1-128.  
   - Garantir que links, textos e CTA permanecem funcionais e inalterados (somente estética).

3. **Envio de SMS “SendApplication”**  
   - No envio via `SmsMessageBuilder.buildApplicationRedirectMessage`, assegurar que mensagens para `ClientType.KORNERSTONE` trazem branding textual correto (nome Kornerstone, instrução “Reply STOP to Unsubscribe”) e URL com domínio `apply-*.kornerstonecredit.com`.  
   - Confirmar que demais client types não sofrem alteração.

4. **Demais templates de e-mail Kornerstone**  
   - Testar visual e links dos templates rebrandados: welcome, decline, finalize purchase, initial payment receipt, approval, activation notice, initial payment reminder, finalize purchase (todos sob `/correspondence/templates/kornerstone/`).  
   - Verificar que cada template mantém o conteúdo funcional original (valores, datas, links) e apenas a identidade visual muda.

5. **Envios acionados pela API**  
   - Exercitar endpoints `sendApplication`, `finalizeApplication`, `completeApplication` tanto pelas URLs legadas quanto pelas novas, confirmando que:  
     a) Envio de e-mail/SMS é disparado para leads com shortCode recém-criado (@src/main/java/com/uownleasing/svc/service/application/GetSendApplicationService.java#107-156).  
     b) Leads Kornerstone recebem templates rebrandados e leads UOWN recebem templates antigos.

6. **Compatibilidade de URLs e shortCode**  
   - Garantir que os endpoints REST (`/missing-fields/{shortCode}`, `/finalize-fields/{shortCode}`, `/esign-fields/{shortCode}` etc.) aceitam shortCode e continuam funcionando por UUID para legados (@src/main/java/com/uownleasing/svc/rest/los/LosApplicationController.java#67-195).  
   - Validar criação/consulta de shortCode (Flyway + `LeadShortCodeService`) para novos leads Kornerstone, assegurando que apps podem continuar via short URL.

7. **Fluxo “Can Continue Application”**  
   - Chamar `/canContinueApplication` com `uuid` e com `shortCode` garantindo que a resposta contém os novos campos necessários (uuid, merchant info, customer first name) e que leads Kornerstone podem prosseguir com Plaid/phone verification se aplicável (@src/main/java/com/uownleasing/svc/service/application/ContinueApplicationService.java#29-86).

8. **Temas por domínio**  
   - Percorrer páginas públicas (`apply`/`secure`) nos domínios UOWN e Kornerstone confirmando que o tema (logos/cores) muda automaticamente por domínio, sem “vazamento” de estilos entre eles (Teste 5 dos Test Instructions).

9. **Entrega e conteúdo de SMS adicionais**  
   - Exercitar `buildApprovalMessage`, `buildPurchaseFinalizationMessage`, `buildVerifiedFinalizeMessage` garantindo que mensagens Kornerstone trazem nome correto, valores formatados e textos “Reply STOP...” conforme especificação, sem regressão para outros client types (testes unitários em @src/test/java/com/uownleasing/svc/utility/SmsMessageBuilder.java guiando os expected strings).

10. **Aceitação geral**  
    - Confirmar critérios globais do documento de testes:  
      a) URLs legadas funcionam.  
      b) Novas URLs funcionam.  
      c) Tema correto por domínio.  
      d) Leads recebem apenas templates compatíveis com seu fluxo (UOWN vs Kornerstone).

---------------------------------------------------------------------------------------------------------------------------------------------------------


1. **Cenário 1 — Aplicar branding Kornerstone somente no fluxo Kornerstone**  

Cenário: Aplicar rebranding quando o lead pertence ao fluxo Kornerstone
  Dado um lead identificado como ClientType KORNERSTONE com short code válido
  Quando o envio de aplicação é disparado para esse lead
  Então as URLs geradas devem usar o domínio kornerstoneliving.com
  E a comunicação deve adotar logos, cores e layout Kornerstone sem alterar textos ou links


2. **Cenário 2 — Preservar branding Uown para fluxos não Kornerstone**  

Cenário: Manter o branding legível quando o fluxo não é Kornerstone
  Dado um lead identificado como ClientType V1_UOWN ou qualquer client type não Kornerstone
  Quando o envio de aplicação é disparado por URLs legadas ou novas
  Então a comunicação deve manter o branding e o texto originais da Uown
  E os links gerados devem continuar nos domínios uownleasing.com


3. **Cenário 3 — E-mail “Send Application” Kornerstone**  

Cenário: Renderizar o template SendApplicationEmail com identidade Kornerstone
  Dado um lead Kornerstone com e-mail de destino configurado
  Quando o template SendApplicationEmail é renderizado
  Então o corpo deve apresentar logo Kornerstone, paleta (#8FC31F/#86217F/#d5d5d5) e CTA estilizado
  E o texto do CTA e o link devem permanecer inalterados


5. **Cenário 5 — Demais templates de e-mail Kornerstone**  

Cenário: Renderizar templates Kornerstone restantes com novo branding
  Dado qualquer template Kornerstone (Welcome, Decline, Approval, ActivationNotice, InitialPaymentReminder, FinalizePurchase, InitialPaymentReceipt)
  Quando o template é enviado para um cliente Kornerstone
  Então cabeçalho, destaques e rodapé devem exibir a identidade visual Kornerstone
  E dados dinâmicos (valores, datas, URLs, contatos) devem permanecer iguais


6. **Cenário 6 — Fluxos baseados em short code permanecem funcionais**  

Cenário: Endpoints REST aceitam short codes e retornam o contexto correto
  Dado um lead com shortCode armazenado em uown_los_lead.short_code
  Quando /missing-fields/{shortCode}, /finalize-fields/{shortCode} ou /esign-fields/{shortCode} é chamado
  Então a resposta deve equivaler aos dados retornados anteriormente via UUID
  E as validações devem seguir funcionando para fluxos Kornerstone e Uown


7. **Cenário 7 — Resposta enriquecida de CanContinueApplication**  

Cenário: ContinueApplicationService preenche dados específicos para Kornerstone
  Dado um lead Kornerstone obtido por uuid ou shortCode
  Quando /canContinueApplication recebe a requisição
  Então a resposta deve incluir leadPk, uuid, dados da localização do merchant e primeiro nome do cliente
  E os campos canContinuePlaid e verifyPhone devem refletir os requisitos de Plaid daquele lead


8. **Cenário 8 — Isolamento de temas por domínio**  

Cenário: Temas da interface seguem o domínio acessado sem vazamento
  Dado páginas públicas abertas via domínios uownleasing.com e kornerstoneliving.com
  Quando as rotas send/finalize/complete são acessadas em cada domínio
  Então o tema correspondente (Uown ou Kornerstone) deve carregar consistentemente
  E nenhum estilo Kornerstone deve aparecer em domínios Uown, nem o inverso


9. **Cenário 9 — Roteamento de templates por fluxo**  

Cenário: Entregar somente os templates correspondentes a cada fluxo de lead
  Dado leads mistos pertencentes aos programas Uown e Kornerstone
  Quando e-mails ou SMS são disparados
  Então leads Kornerstone devem receber apenas templates com branding Kornerstone
  E leads não Kornerstone devem receber apenas os templates Uown
  E nenhum lead deve receber os dois tipos de template para o mesmo evento


---------------------------------------------------------------------------------------------------------------------------------------------------------

## Tests in sandbox

### Scenario: 1 — Apply Kornerstone branding only on Kornerstone flow
```markdown
- Given a lead identified as ClientType KORNERSTONE with a valid short code
- When the application send flow is triggered for this lead
- Then the generated URLs must use the kornerstoneliving.com domain
- And the communication must adopt Kornerstone logos, colors, and layout without changing texts or links
```

![Screenshot_at_Feb_05_08-13-31](/uploads/17bedcde1cb78a9bfc62be1443f65f45/Screenshot_at_Feb_05_08-13-31.png){width=900 height=361}
![Screenshot_at_Feb_05_08-12-05](/uploads/e693fb0e081a192b71a70cbe3b9bc777/Screenshot_at_Feb_05_08-12-05.png){width=333 height=475}
![WhatsApp_Image_2026-02-05_at_13.35.49__1_](/uploads/ef8f1b763f70d511c102fc744e664d0d/WhatsApp_Image_2026-02-05_at_13.35.49__1_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.49__2_](/uploads/421d705799c1aaaf583aca2cc2dd6805/WhatsApp_Image_2026-02-05_at_13.35.49__2_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50](/uploads/fdb58f8a4b058ed4cbafcc28b8dc4080/WhatsApp_Image_2026-02-05_at_13.35.50.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50__1_](/uploads/aef6bb306c81905351ff81395a7b1c69/WhatsApp_Image_2026-02-05_at_13.35.50__1_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50__2_](/uploads/3d1a51d6c8ee0cc993412cf910abc06d/WhatsApp_Image_2026-02-05_at_13.35.50__2_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50__3_](/uploads/9b0c59ecc7afe946d524bc0953abd42c/WhatsApp_Image_2026-02-05_at_13.35.50__3_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50__4_](/uploads/e37e3a38323a35b0b4a3597d9c5137bc/WhatsApp_Image_2026-02-05_at_13.35.50__4_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50__5_](/uploads/fda7794b4e31f0bb4a7809f7a768db69/WhatsApp_Image_2026-02-05_at_13.35.50__5_.jpeg){width=278 height=600}
![WhatsApp_Image_2026-02-05_at_13.35.50__9_](/uploads/eb65496f3a2c1efef734720ba1d4a2fb/WhatsApp_Image_2026-02-05_at_13.35.50__9_.jpeg){width=278 height=600}
![Screenshot_at_Feb_05_08-51-53](/uploads/b1977830891ddd7d17db947eea6d76e8/Screenshot_at_Feb_05_08-51-53.png){width=303 height=600}
![Screenshot_at_Feb_05_09-00-20](/uploads/c67f563cecdb6c2b29742fa02dcf686b/Screenshot_at_Feb_05_09-00-20.png){width=333 height=474}

---

### Scenario: 2 — Preserve Uown branding for non‑Kornerstone flows
```markdown
- Given a lead identified as ClientType V1_UOWN or any non-Kornerstone client type
- When the application send flow is triggered via legacy or new URLs
- Then the communication must keep the original Uown branding and text
- And generated links must remain on uownleasing.com domains
```

---

### Scenario: 3 — Kornerstone “Send Application” email
```markdown
- Given a Kornerstone lead with a destination email configured
- When the SendApplicationEmail template is rendered
- Then the body must show the Kornerstone logo, palette (#8FC31F/#86217F/#d5d5d5), and a styled CTA
- And the CTA text and link must remain unchanged
```

---

### Scenario: 4 — Remaining Kornerstone email templates
```markdown
- Given any Kornerstone template (Welcome, Decline, Approval, ActivationNotice, InitialPaymentReminder, FinalizePurchase, InitialPaymentReceipt)
- When the template is sent to a Kornerstone customer
- Then the header, highlights, and footer must display Kornerstone visual identity
- And dynamic data (amounts, dates, URLs, contacts) must remain unchanged
```

---

### Scenario: 5 — Short-code based flows remain functional
```markdown
- Given a lead with shortCode stored in uown_los_lead.short_code
- When /missing-fields/{shortCode}, /finalize-fields/{shortCode}, or /esign-fields/{shortCode} is called
- Then the response must match the data previously returned via UUID
- And validations must continue working for both Kornerstone and Uown flows
```

---

### Scenario: 6 — Enriched CanContinueApplication response
```markdown
- Given a Kornerstone lead obtained by uuid or shortCode
- When /canContinueApplication receives the request
- Then the response must include leadPk, uuid, merchant location data, and customer first name
```

---

### Scenario: 7 — Theme isolation by domain
```markdown
- Given public pages opened via domains uownleasing.com and kornerstoneliving.com
- When the send/finalize/complete routes are accessed on each domain
- Then the corresponding theme (Uown or Kornerstone) must load consistently
- And no Kornerstone styles should appear on Uown domains, nor the inverse
```

---

### Scenario: 8 — Template routing per lead flow
```markdown
- Given mixed leads belonging to Uown and Kornerstone programs
- When emails or SMS are sent
- Then Kornerstone leads must receive only Kornerstone-branded templates
- And non-Kornerstone leads must receive only Uown templates
- And no lead must receive both template types for the same event
```


**PASS**

---



---------------------------------------------------------------------------------------------------------------------------------------------------------